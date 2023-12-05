import React, { useEffect, useRef, useState } from 'react'
import { IGapiFolder, IMediaFile, log } from '../App.props'
import { VideoViewerOverlay } from './FileBrowOverlays'
import { isFolder, isImage, isVideo } from '../utils/mimeTypes'
import { fetchFileBlobUrl } from '../AppMainLogic'
import { Gallery, Item } from 'react-photoswipe-gallery'
import 'photoswipe/dist/photoswipe.css'
import '../css/ImageGrid.css'

interface Props {
	handleFolderClick: (folderId: string, folderName: string) => Promise<void>
	isFolderLoading: boolean
	currFolderContents: Array<IMediaFile | IGapiFolder>
}

const FileBrowserGridView: React.FC<Props> = ({ handleFolderClick, isFolderLoading, currFolderContents }) => {
	const ITEMS_PER_PAGE = 6 * 4 // current style sets 6 items per row
	//
	const loadingRef = useRef(new Set<string>())
	const [displayedItems, setDisplayedItems] = useState<Array<IMediaFile | IGapiFolder>>([])
	const [selectedFile, setSelectedFile] = useState<IMediaFile | null>(null)
	const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false)

	// --------------------------------------------------------------------------------------------

	/**
	 * Handle scroll event to load more items
	 */
	const handleScroll = () => {
		if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) return
		setDisplayedItems(currentItems => {
			// Calculate the number of new items to add
			const nextItemsEndIndex = Math.min(currentItems.length + ITEMS_PER_PAGE, currFolderContents.length)
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
		setDisplayedItems(currFolderContents.slice(0, ITEMS_PER_PAGE))
	}, [currFolderContents])

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
				if (isImage(item) && 'original' in item && !item.original && !item.blobUrlError && !loadingRef.current.has(item.id)) {
					log(2, `[loadBlobs] fetch file.id "${item.id}"`)
					loadingRef.current.add(item.id)

					const fetchPromise = fetchFileBlobUrl(item.id).then(original => {
						if (original) {
							if (isImage(item)) {
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
			fetchFileBlobUrl(selectedFile.id).then(original => {
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
			}).catch(error => {
				console.error(`Error loading blob for item ${item.id}:`, error)
				item.blobUrlError = error.toString()
				setIsLoadingFile(false)
			})
		}
	}, [selectedFile])

	// --------------------------------------------------------------------------------------------

	const renderGridItem = (item: IMediaFile | IGapiFolder, index: number) => {
		if (isFolder(item)) {
			return (
				<figure key={`${index}${item.id}`} title={item.name} onClick={() => handleFolderClick(item.id, item.name)} className='text-success figure-icon'>
					<i className={isFolderLoading ? 'bi-arrow-repeat' : 'bi-folder'} />
					<figcaption>{item.name}</figcaption>
				</figure>
			)
		} else if ('blobUrlError' in item && item.blobUrlError) {
			return (
				<figure key={`${index}${item.id}`} title={item.blobUrlError} onClick={() => alert(item.blobUrlError)} className='text-danger figure-icon'>
					<i className="bi-warning" />
					<figcaption>{item.name}</figcaption>
				</figure>
			)
		} else if (isVideo(item)) {
			if (isLoadingFile) {
				return (
					<figure key={`${index}${item.id}`} title={item.name} className="text-info figure-icon">
						{item.id === selectedFile?.id ? <i className="bi-arrow-repeat" /> : <i className="bi-camera-video" />}
						<figcaption>{item.name}</figcaption>
					</figure>
				)
			} else {
				return (
					<figure key={`${index}${item.id}`} title={item.name} onClick={() => setSelectedFile(item)} className="text-info figure-icon">
						<i className="bi-camera-video" />
						<figcaption>{item.name}</figcaption>
					</figure>
				)
			}
		} else if (isImage(item) && 'original' in item && !item.original) {
			return (
				<figure key={`${index}${item.id}`} title={item.name} className="text-info figure-icon">
					<i className="bi-arrow-repeat" />
					<figcaption>{item.name}</figcaption>
				</figure>
			)
		} else if (isImage(item) && 'original' in item && item.original) {
			return (
				<Item {...item} key={`${index}${item.id}`}>
					{({ ref, open }) => (
						<figure>
							<img ref={ref as React.MutableRefObject<HTMLImageElement>} onClick={open} src={item.original} onError={(e) => console.error('Error loading image:', e)} title={item.name} alt={item.name} />
							<figcaption>{item.name}</figcaption>
						</figure>
					)}
				</Item>
			)
		}
	}

	const renderGrid = () => {
		return (
			<Gallery id="contImageGrid" withCaption={true}>
				<div id="gallery-container" className="gallery">
					{displayedItems.map((item, index) => renderGridItem(item, index))}
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

export default FileBrowserGridView
