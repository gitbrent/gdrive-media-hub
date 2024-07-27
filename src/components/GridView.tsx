import React, { useEffect, useRef, useState } from 'react'
import { IGapiFolder, IMediaFile, log } from '../App.props'
import { VideoViewerOverlay } from './FileBrowOverlays'
import { isFolder, isGif, isImage, isVideo } from '../utils/mimeTypes'
import { Gallery, Item } from 'react-photoswipe-gallery'
import { getBlobForFile } from '../api'
import useCalcMaxGridItems from './useCalcMaxGridItems'
import 'photoswipe/dist/photoswipe.css'

interface Props {
	currFolderContents: Array<IMediaFile | IGapiFolder>
	isFolderLoading: boolean
	handleFolderClick: (folderId: string, folderName: string) => Promise<void>
}

const GridView: React.FC<Props> = ({ currFolderContents, isFolderLoading, handleFolderClick }) => {
	const SHOW_CAPTIONS = false
	//
	const loadingRef = useRef(new Set<string>())
	const [selectedFile, setSelectedFile] = useState<IMediaFile | null>(null)
	const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false)
	const [displayedItems, setDisplayedItems] = useState<Array<IMediaFile | IGapiFolder>>([])
	const [pagingSize, setPagingSize] = useState(0)

	// --------------------------------------------------------------------------------------------

	useCalcMaxGridItems(setPagingSize)

	/**
	 * @summary Handle scroll event to load more items
	 * @description Only operational when used from `FileBrowser` as `ImageGrid` only sends enough images to fit on screen
	 */
	const handleScroll = () => {
		if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) return
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
	}, [currFolderContents])

	/**
	 * Load initial set of items
	 */
	useEffect(() => {
		setDisplayedItems(currFolderContents.slice(0, pagingSize))
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
			const blobFetchPromises: Promise<any>[] = []

			updatedItems.forEach((item) => {
				// NOTE: only download images
				if ((isImage(item) || isGif(item)) && 'original' in item && !item.original && !item.blobUrlError && !loadingRef.current.has(item.id)) {
					log(2, `[loadBlobs] fetch file.id "${item.id}"`)
					loadingRef.current.add(item.id)

					const fetchPromise = getBlobForFile(item.id).then(original => {
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
	}, [displayedItems])

	/**
	 * download videos when they're clicked
	 * - (they are not preloaded for perf reasons)
	 */
	useEffect(() => {
		if (selectedFile && isVideo(selectedFile) && !selectedFile.original && !selectedFile.blobUrlError) {
			log(2, `[useEffect] loading video selectedFile.id "${selectedFile.id}"...`)
			setIsLoadingFile(true)
			const item = { ...selectedFile }
			getBlobForFile(selectedFile.id)
				.then(original => {
					if (original) {
						item.original = original
						item.blobUrlError = ''
					} else {
						item.original = ''
						item.blobUrlError = 'Blob URL not found'
					}
					log(2, `[useEffect] ...done loading video (length = ${selectedFile.original?.length})`)
					setSelectedFile(item)
					setIsLoadingFile(false)
				})
				.catch(error => {
					console.error(`Error loading blob for item ${item.id}:`, error)
					item.blobUrlError = error.toString()
					setIsLoadingFile(false)
				})
		}
	}, [selectedFile])

	// --------------------------------------------------------------------------------------------

	const renderGridItem = (item: IMediaFile | IGapiFolder, index: number) => {
		const figCaption = SHOW_CAPTIONS ? <figcaption>{item.name}</figcaption> : <span />

		if ('blobUrlError' in item && item.blobUrlError) {
			return (
				<figure key={`${index}${item.id}`} title={item.blobUrlError} onClick={() => alert(item.blobUrlError)} className='text-danger figure-icon'>
					<i className="bi-warning" />
					{figCaption}
				</figure>
			)
		} else if (isFolder(item)) {
			return (
				<figure key={`${index}${item.id}`} title={item.name} onClick={() => handleFolderClick(item.id, item.name)} className='text-success figure-icon'>
					<i className={isFolderLoading ? 'bi-hourglass-split' : 'bi-folder'} />
					<figcaption>{item.name}</figcaption>
				</figure>
			)
		} else if (isVideo(item)) {
			if (isLoadingFile) {
				return (
					<figure key={`${index}${item.id}`} title={item.name} className="text-info figure-icon">
						{item.id === selectedFile?.id ? <i className="bi-hourglass-split" /> : <i className="bi-play-btn-fill" />}
						<figcaption>{item.name}</figcaption>
					</figure>
				)
			} else {
				return (
					<figure key={`${index}${item.id}`} title={item.name} className="text-warning figure-icon bg-dark" onClick={() => setSelectedFile(item)}>
						<i className="bi-play-btn-fill" />
						<figcaption>{item.name}</figcaption>
					</figure>
				)
			}
		} else if (isImage(item) || isGif(item)) {
			if ('original' in item && item.original) {
				return (
					<Item {...item} key={`${index}${item.id}`}>
						{({ ref, open }) => (
							<figure>
								<img ref={ref as React.MutableRefObject<HTMLImageElement>} onClick={open} src={item.original} onError={(e) => console.error('Error loading image:', e)} title={item.name} alt={item.name} />
								{figCaption}
							</figure>
						)}
					</Item>
				)
			} else {
				return (
					<figure key={`${index}${item.id}`} title={item.name} className="text-info figure-icon">
						<i className="bi-hourglass-split" />
						<figcaption>{item.name}</figcaption>
					</figure>
				)
			}
		}
	}

	const renderGrid = () => {
		return (
			<Gallery id="contImageGrid">
				<div id="gallery-container" className="gallery">
					{displayedItems.map((item, index) => renderGridItem(item, index))}
				</div>
				<div className="p-3 bg-darker text-muted text-center">
					{displayedItems < currFolderContents
						? <span>(scroll for more files)</span>
						: <span>(all files shown)</span>
					}
				</div>
			</Gallery>
		)
	}

	return (
		<section className="bg-black">
			{selectedFile && isVideo(selectedFile) && !isLoadingFile && selectedFile.original &&
				<VideoViewerOverlay selectedFile={selectedFile} setSelectedFile={setSelectedFile} />
			}
			{renderGrid()}
		</section>
	)
}

export default GridView
