import React, { useEffect, useMemo, useRef, useState } from 'react'
import { IGapiFile, IGapiFolder, IMediaFile, log } from '../App.props'
import { SortConfig, SortDirection, SortKey } from '../types/FileBrowser'
import { VideoViewerOverlay } from './FileBrowOverlays'
import { isFolder, isImage, isVideo } from '../utils/mimeTypes'
import { fetchFileBlobUrl } from '../AppMainLogic'
import { Gallery, Item } from 'react-photoswipe-gallery'
import 'photoswipe/dist/photoswipe.css'
import '../css/ImageGrid.css'

interface Props {
	origFolderContents: Array<IGapiFile | IGapiFolder>
	handleFolderClick: (folderId: string, folderName: string) => Promise<void>
	isFolderLoading: boolean
	currFolderContents: Array<IMediaFile | IGapiFolder>
	setCurrFolderContents: (res: Array<IGapiFile | IGapiFolder>) => void
	optSchWord?: string
}

const FileBrowserGridView: React.FC<Props> = ({
	origFolderContents,
	handleFolderClick,
	isFolderLoading,
	currFolderContents,
	setCurrFolderContents,
	optSchWord,
}) => {
	const ITEMS_PER_PAGE = 6 * 4 // current style sets 6 items per row
	//
	const loadingRef = useRef(new Set<string>())
	const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' })
	const [displayedItems, setDisplayedItems] = useState<Array<IMediaFile | IGapiFolder>>([])
	const [selectedFile, setSelectedFile] = useState<IMediaFile | null>(null)
	const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false)

	const gridShowFiles = useMemo(() => {
		return currFolderContents
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
	}, [currFolderContents, optSchWord])

	// --------------------------------------------------------------------------------------------

	/**
	 * Handle scroll event to load more items
	 */
	const handleScroll = () => {
		if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) return
		setDisplayedItems(currentItems => {
			// Calculate the number of new items to add
			const nextItemsEndIndex = Math.min(currentItems.length + ITEMS_PER_PAGE, gridShowFiles.length)
			const newItems = gridShowFiles.slice(currentItems.length, nextItemsEndIndex)

			// Append new items to the current list
			return [...currentItems, ...newItems]
		})
	}

	useEffect(() => {
		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [gridShowFiles])

	/**
	 * Load initial set of items
	 */
	useEffect(() => {
		setDisplayedItems(gridShowFiles.slice(0, ITEMS_PER_PAGE))
	}, [gridShowFiles])

	useEffect(() => {
		function compareValues<T extends IGapiFile | IGapiFolder>(key: keyof T, a: T, b: T, direction: SortDirection) {
			// Place folders before files
			if (a.mimeType === 'application/vnd.google-apps.folder' && b.mimeType !== 'application/vnd.google-apps.folder') {
				return -1
			}
			if (b.mimeType === 'application/vnd.google-apps.folder' && a.mimeType !== 'application/vnd.google-apps.folder') {
				return 1
			}

			// Special handling for file names starting with '_'
			if (key === 'name') {
				const startsWithUnderscoreA = a.name.startsWith('_')
				const startsWithUnderscoreB = b.name.startsWith('_')

				if (startsWithUnderscoreA && !startsWithUnderscoreB) {
					return direction === 'ascending' ? -1 : 1
				}
				if (!startsWithUnderscoreA && startsWithUnderscoreB) {
					return direction === 'ascending' ? 1 : -1
				}
			}

			// Handle null size
			if (key === 'size') {
				const aValue = a.size ? parseInt(a.size) : 0
				const bValue = b.size ? parseInt(b.size) : 0
				return direction === 'ascending' ? aValue - bValue : bValue - aValue
			}

			// For other properties
			if (!(key in a) || !(key in b)) return 0
			const aValue = a[key] as string | number
			const bValue = b[key] as string | number

			if (direction === 'ascending') {
				return aValue < bValue ? -1 : 1
			} else {
				return aValue > bValue ? -1 : 1
			}
		}

		const filterItems = (items: Array<IGapiFile | IGapiFolder>) => {
			return items.filter((item) => {
				return !optSchWord || item.name.toLowerCase().includes(optSchWord.toLowerCase())
			})
		}

		const sortItems = (items: Array<IGapiFile | IGapiFolder>, key: SortKey | null, direction: SortDirection) => {
			if (!key) return items // Exclude other non-common keys

			const filteredItems = filterItems(items)
			const sortedItems = filteredItems.sort((a, b) => compareValues(key, a, b, direction))
			return sortedItems
		}

		const sortedFilteredItems = sortItems(origFolderContents, sortConfig.key, sortConfig.direction)
		setCurrFolderContents(sortedFilteredItems)
	}, [sortConfig, optSchWord, origFolderContents])

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
					<i className={isFolderLoading ? 'bi-arrow-repeat' : 'bi-folder-fill'} />
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
						(<figure>
							<img ref={ref as React.MutableRefObject<HTMLImageElement>} onClick={open} src={item.original} onError={(e) => console.error('Error loading image:', e)} title={item.name} alt={item.name} />
							<figcaption>{item.name}</figcaption>
						</figure>)
					)}
				</Item>
			)
		}
	}

	const renderGrid = () => {
		return (
			<Gallery id="contImageGrid" withCaption={false}>
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
