import { useContext, useEffect, useRef, useState } from 'react'
import { IGapiFile, IGapiFolder, IMediaFile, log } from '../App.props'
import { VideoViewerOverlay } from './FileBrowOverlays'
import { isFolder, isGif, isImage, isVideo } from '../utils/mimeTypes'
import { Gallery, Item } from 'react-photoswipe-gallery'
import useCalcMaxGridItems from './useCalcMaxGridItems'
import { DataContext } from '../api-google/DataContext'
import CaptionGrid from './CaptionGrid'
import 'photoswipe/dist/photoswipe.css'

interface ItemWithLineage extends IGapiFile {
	_lineagePath?: string
}

interface Props {
	currFolderContents: Array<IMediaFile | IGapiFolder>
	isFolderLoading: boolean
	handleFolderClick: (folderId: string, folderName: string) => Promise<void>
	tileSize?: 'small' | 'medium' | 'large'
	showCaptions?: boolean
}

const GridView: React.FC<Props> = ({ currFolderContents, isFolderLoading, handleFolderClick, tileSize = 'medium', showCaptions = false }) => {
	const SHOW_CAPTIONS = showCaptions
	//
	const { getBlobUrlForFile } = useContext(DataContext)
	//
	const loadingRef = useRef<Set<string>>(new Set<string>())
	const scrollContainerRef = useRef<HTMLDivElement | null>(null)
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
		const container = scrollContainerRef.current
		if (!container) return

		const scrollPosition = container.scrollTop + container.clientHeight
		const scrollThreshold = container.scrollHeight - 100 // Trigger 100px before bottom

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
		const container = scrollContainerRef.current
		if (!container) return

		container.addEventListener('scroll', handleScroll)
		return () => container.removeEventListener('scroll', handleScroll)
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
				// NOTE: only preload full images (not videos or thumbnails)
				if ((isImage(item) || isGif(item)) && 'original' in item && !item.original && !item.blobUrlError && !loadingRef.current.has(item.id)) {
					log(2, `[loadBlobs] fetch file.id "${item.id}"`)
					loadingRef.current.add(item.id)

					const fetchPromise = getBlobUrlForFile(item.id).then(original => {
						if (original) {
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
		const figCaption = SHOW_CAPTIONS ? <CaptionGrid title={item.name} size={tileSize} /> : <span />
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
						{SHOW_CAPTIONS && (
							<CaptionGrid title={item.name} size={tileSize} />
						)}
					</figure>
				)
			}

			// If thumbnail is available, show it as a placeholder
			if ('thumbnail' in item && item.thumbnail) {
				return (
					<figure
						key={`${index}${item.id}`}
						title={itemTitle}
						onClick={() => setSelectedFile(item)}
						className="flex flex-col items-center justify-center bg-base-900 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden rounded-lg group relative"
					>
						<img
							src={item.thumbnail}
							className="absolute inset-0 w-full h-full object-cover"
							onError={(e) => console.error('Error loading thumbnail:', e)}
							alt={item.name}
						/>
						<div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center z-10">
							<i className="bi-play-circle text-white text-4xl opacity-80 group-hover:opacity-100 transition-opacity" />
						</div>
						{SHOW_CAPTIONS && (
							<CaptionGrid title={item.name} size={tileSize} />
						)}
					</figure>
				)
			}

			// No thumbnail available - show loading placeholder with overlay style
			return (
				<figure
					key={`${index}${item.id}`}
					title={itemTitle}
					className="flex flex-col items-center justify-center bg-base-900 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden rounded-lg group relative"
					onClick={() => !isLoadingFile && setSelectedFile(item)}
				>
					<div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
						<i className="bi-play-circle text-white text-4xl opacity-80" />
					</div>
					<CaptionGrid title={item.name} size={tileSize} />
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
			} else if ('thumbnail' in item && item.thumbnail) {
				// Show thumbnail as placeholder while full image loads
				return (
					<figure key={`${index}${item.id}`} title={itemTitle} className="flex flex-col items-center justify-center overflow-hidden rounded-lg">
						<img src={item.thumbnail} onError={(e) => console.error('Error loading thumbnail:', e)} alt={item.name} className="w-full h-full object-cover opacity-75" />
						<div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
							<i className="bi-hourglass-split text-white text-2xl opacity-80" />
						</div>
						{figCaption}
					</figure>
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

	// Find the scrollable container (main element from AppMainUI)
	useEffect(() => {
		const main = document.querySelector('main')
		if (main) {
			scrollContainerRef.current = main as HTMLDivElement
		}
	}, [])

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
						? <span>
							<span className="badge badge-soft badge-info me-2">showing <b>{displayedItems.length}</b> of <b>{currFolderContents.length}</b></span>
							<span className="badge badge-outline badge-info">scroll for more files)</span>
						</span>
						: <span className='badge badge-soft badge-info'>all {displayedItems.length} shown</span>
					}
				</div>
			</Gallery>
		</section>
	)
}

export default GridView
