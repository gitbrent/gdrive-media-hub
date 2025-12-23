import { useContext, useEffect, useRef, useState } from 'react'
import { IGapiFile, IGapiFolder, IMediaFile, log, formatBytes } from '../App.props'
import { VideoViewerOverlay } from './FileBrowOverlays'
import { isFolder, isGif, isImage, isVideo } from '../utils/mimeTypes'
import { Gallery, Item } from 'react-photoswipe-gallery'
import useCalcMaxGridItems from './useCalcMaxGridItems'
import { DataContext } from '../api-google/DataContext'
import 'photoswipe/dist/photoswipe.css'

interface ItemWithLineage extends IGapiFile {
	_lineagePath?: string
}

interface Props {
	currFolderContents: Array<IMediaFile | IGapiFolder>
	isFolderLoading: boolean
	handleFolderClick: (folderId: string, folderName: string) => Promise<void>
	tileSize?: 'small' | 'medium' | 'large'
}

const GridView: React.FC<Props> = ({ currFolderContents, isFolderLoading, handleFolderClick, tileSize = 'medium' }) => {
	const SHOW_CAPTIONS = false // TODO: Implement as a prop
	//
	const { getBlobUrlForFile } = useContext(DataContext)
	//
	const loadingRef = useRef(new Set<string>())
	const [selectedFile, setSelectedFile] = useState<IMediaFile | null>(null)
	const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false)
	const [displayedItems, setDisplayedItems] = useState<Array<IMediaFile | IGapiFolder>>([])
	const [pagingSize, setPagingSize] = useState(0)

	// --------------------------------------------------------------------------------------------

	useCalcMaxGridItems(setPagingSize, tileSize)

	/**
	 * @summary Handle scroll event to load more items
	 * @description Only operational when used from `FileBrowser` as `ImageGrid` only sends enough images to fit on screen
	 */
	const handleScroll = () => {
		const scrollPosition = window.innerHeight + document.documentElement.scrollTop
		const scrollThreshold = document.documentElement.offsetHeight - 100 // Trigger 100px before bottom

		// Only load more if we're near the bottom and there are more items to load
		if (scrollPosition < scrollThreshold) return
		if (displayedItems.length >= currFolderContents.length) return

		setDisplayedItems(currentItems => {
			// Calculate the number of new items to add
			const nextItemsEndIndex = Math.min(currentItems.length + pagingSize, currFolderContents.length)
			const newItems = currFolderContents.slice(currentItems.length, nextItemsEndIndex)
			// Append new items to the current list
			return [...currentItems, ...newItems]
		})
	}

	useEffect(() => {
		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currFolderContents, displayedItems, pagingSize])

	/**
	 * Load initial set of items
	 */
	useEffect(() => {
		setDisplayedItems(prevItems => {
			// If we have previously displayed items with loaded blobs, preserve them
			if (prevItems.length > 0) {
				const prevItemsMap = new Map(prevItems.map(item => [item.id, item]))
				const newSlice = currFolderContents.slice(0, pagingSize)
				// Merge loaded blob data from previous items
				return newSlice.map(item => prevItemsMap.get(item.id) || item)
			}
			// Initial load or when currFolderContents changes
			return currFolderContents.slice(0, pagingSize)
		})
	}, [currFolderContents, pagingSize])

	// --------------------------------------------------------------------------------------------

	/**
	 * Load blobs for the displayed items
	 */
	useEffect(() => {
		const loadImage = (src: string): Promise<{ width: number, height: number }> => {
			return new Promise((resolve, reject) => {
				const img = new Image()
				img.src = src
				img.onload = () => resolve({ width: img.width, height: img.height })
				img.onerror = () => reject(new Error('Image load error'))
			})
		}

		const loadBlobs = async () => {
			let itemsUpdated = false
			const updatedItems = [...displayedItems]
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const blobFetchPromises: Promise<any>[] = []

			updatedItems.forEach((item) => {
				// NOTE: only download images
				if ((isImage(item) || isGif(item)) && 'original' in item && !item.original && !item.blobUrlError && !loadingRef.current.has(item.id)) {
					log(2, `[loadBlobs] fetch file.id "${item.id}"`)
					loadingRef.current.add(item.id)

					const fetchPromise = getBlobUrlForFile(item.id).then(original => {
						if (original) {
							if (isImage(item) || isGif(item)) {
								return loadImage(original).then(({ width, height }) => {
									item.original = original
									item.width = width
									item.height = height
									item.blobUrlError = ''
									itemsUpdated = true
								}).catch(() => {
									console.error('Error loading image')
									item.blobUrlError = 'Error loading image'
									itemsUpdated = true
								})
							} else if (isVideo(item)) {
								item.original = original
								itemsUpdated = true
							}
						} else {
							item.blobUrlError = 'Blob URL not found'
							itemsUpdated = true
						}
					}).catch(error => {
						console.error(`Error loading blob for item ${item.id}:`, error)
						item.blobUrlError = error.toString()
						itemsUpdated = true
					}).finally(() => {
						loadingRef.current.delete(item.id)
					})

					blobFetchPromises.push(fetchPromise)
				}
			})

			await Promise.all(blobFetchPromises)

			if (itemsUpdated) {
				setDisplayedItems(updatedItems)
			}
		}

		loadBlobs()
	}, [displayedItems, getBlobUrlForFile])

	/**
	 * download videos when they're clicked
	 * - (they are not preloaded for perf reasons)
	 */
	useEffect(() => {
		if (selectedFile && isVideo(selectedFile) && !selectedFile.original && !selectedFile.blobUrlError) {
			log(2, `[useEffect] loading video selectedFile.id "${selectedFile.id}"...`)
			setIsLoadingFile(true)
			const item = { ...selectedFile }
			getBlobUrlForFile(selectedFile.id)
				.then(original => {
					if (original) {
						item.original = original
						item.blobUrlError = ''
					} else {
						item.original = ''
						item.blobUrlError = 'Blob URL not found'
					}
					log(2, `[useEffect] ...done loading video (length = ${item.original?.length})`)
					setSelectedFile(item)

					// Update displayedItems so the thumbnail appears
					setDisplayedItems(currentItems =>
						currentItems.map(i => i.id === item.id ? item : i)
					)

					setIsLoadingFile(false)
				})
				.catch(error => {
					console.error(`Error loading blob for item ${item.id}:`, error)
					item.blobUrlError = error.toString()
					setIsLoadingFile(false)
				})
		}
	}, [getBlobUrlForFile, selectedFile])

	// --------------------------------------------------------------------------------------------

	const renderGridItem = (item: IMediaFile | IGapiFolder, index: number) => {
		const figCaption = SHOW_CAPTIONS ? <figcaption>{item.name}</figcaption> : <span />
		const itemWithLineage = item as ItemWithLineage
		const itemTitle = itemWithLineage._lineagePath ? `${itemWithLineage._lineagePath}\n${item.name}` : item.name

		if ('blobUrlError' in item && item.blobUrlError) {
			return (
				<figure key={`${index}${item.id}`} title={item.blobUrlError} onClick={() => alert(item.blobUrlError)} className='flex flex-col items-center justify-center text-error cursor-pointer hover:opacity-80 transition-opacity'>
					<i className="bi-warning text-3xl" />
					<figcaption className="gallery-item-name mt-2 text-center">{item.name}</figcaption>
				</figure>
			)
		} else if (isFolder(item)) {
			return (
				<figure key={`${index}${item.id}`} title={itemTitle} onClick={() => handleFolderClick(item.id, item.name)} className='flex flex-col items-center justify-center text-warning cursor-pointer hover:opacity-80 transition-opacity'>
					<i className={isFolderLoading ? 'bi-hourglass-split text-3xl' : 'bi-folder text-3xl'} />
					<figcaption className="gallery-item-name mt-2 text-center">{item.name}</figcaption>
				</figure>
			)
		} else if (isVideo(item)) {
			const videoSize = item.size ? formatBytes(Number(item.size)) : 'Unknown'
			const videoDate = item.modifiedByMeTime ? new Date(item.modifiedByMeTime).toLocaleDateString() : 'Unknown'
			const isLoaded = 'original' in item && item.original

			// If video is already loaded (has blob), show it
			if (isLoaded) {
				return (
					<figure
						key={`${index}${item.id}`}
						title={itemTitle}
						onClick={() => setSelectedFile(item)}
						className="flex flex-col items-center justify-center bg-base-900 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden rounded-lg group relative"
					>
						<video
							src={item.original}
							className="absolute inset-0 w-full h-full object-cover"
							onMouseEnter={(e) => {
								const video = e.currentTarget as HTMLVideoElement
								video.play().catch(() => { })
							}}
							onMouseLeave={(e) => {
								const video = e.currentTarget as HTMLVideoElement
								video.pause()
								video.currentTime = 0
							}}
						/>
						<div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center z-10">
							<i className="bi-play-circle text-white text-4xl opacity-80 group-hover:opacity-100 transition-opacity" />
						</div>
						<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2 z-20">
							<div className="text-white opacity-75" title={item.name}>{item.name}</div>
						</div>
					</figure>
				)
			}

			// Using daisyUI stat class for clean, informative tile
			return (
				<figure
					key={`${index}${item.id}`}
					className="stat stats-vertical bg-base-200 hover:bg-base-300 cursor-pointer transition-colors rounded-lg shadow-md border border-base-300"
					onClick={() => !isLoadingFile && setSelectedFile(item)}
				>
					<div className="text-info text gallery-item-name" title={item.name}>{item.name}</div>
					<div className="stat-title text-primary gallery-item-title">{videoSize}</div>
					<div className="stat-desc text-xs flex flex-col gap-1">
						{videoDate}
					</div>
				</figure>
			)
		} else if (isImage(item) || isGif(item)) {
			if ('original' in item && item.original) {
				return (
					<Item {...item} key={`${index}${item.id}`}>
						{({ ref, open }) => (
							<figure className="overflow-hidden rounded-lg">
								<img ref={ref} onClick={open} src={item.original} onError={(e) => console.error('Error loading image:', e)} title={itemTitle} alt={item.name} className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
								{figCaption}
							</figure>
						)}
					</Item>
				)
			} else {
				return (
					<figure key={`${index}${item.id}`} title={itemTitle} className="flex flex-col items-center justify-center text-base-content opacity-50">
						<i className="bi-hourglass-split text-3xl" />
						<figcaption className="gallery-item-name mt-2 text-center">{item.name}</figcaption>
					</figure>
				)
			}
		}
	}

	return (
		<section>
			{selectedFile && isVideo(selectedFile) && !isLoadingFile && selectedFile.original &&
				<VideoViewerOverlay selectedFile={selectedFile} setSelectedFile={setSelectedFile} />
			}
			<Gallery id="contImageGrid">
				<div id="gallery-container" className={`gallery gallery-${tileSize}`}>
					{displayedItems.map((item, index) => renderGridItem(item, index))}
				</div>
				<div className="p-4 bg-base-900 text-base-content text-center text-sm opacity-70">
					{displayedItems.length < currFolderContents.length
						? <span>(showing {displayedItems.length} of {currFolderContents.length} - scroll for more files)</span>
						: <span>(all {displayedItems.length} shown)</span>
					}
				</div>
			</Gallery>
		</section>
	)
}

export default GridView
