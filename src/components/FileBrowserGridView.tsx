import React, { useEffect, useMemo, useRef, useState } from 'react'
import { IGapiFile, IGapiFolder, IMediaFile, log } from '../App.props'
import { SortConfig, SortDirection, SortKey } from '../types/FileBrowser'
import { fetchFileBlobUrl } from '../AppMainLogic'
import { Gallery, Item } from 'react-photoswipe-gallery'
import 'photoswipe/dist/photoswipe.css'
//import '../css/ImageGrid.css'

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
	const ITEMS_PER_PAGE = 6 * 2 // current style sets 6 items per row
	//
	const loadingRef = useRef(new Set<string>())
	const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' })
	const [displayedItems, setDisplayedItems] = useState<Array<IMediaFile | IGapiFolder>>([])

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

	/**
	 * Load blobs for the displayed items
	 */
	useEffect(() => {
		const loadBlobs = async () => {
			let itemsUpdated = false
			const updatedItems = [...displayedItems]

			for (let i = 0; i < displayedItems.length; i++) {
				const item = displayedItems[i]
				if ('imageBlobUrl' in item && !item.imageBlobUrl && !item.blobUrlError && !loadingRef.current.has(item.id)) {
					log(2, `[loadBlobs] fetch file.id "${item.id}"`)
					loadingRef.current.add(item.id)
					try {
						const blobUrl = await fetchFileBlobUrl(item.id)
						if (blobUrl) {
							updatedItems[i] = { ...item, imageBlobUrl: blobUrl }
							itemsUpdated = true
						} else {
							throw new Error('Blob URL not found')
						}
					} catch (error: any) {
						console.error(`Error loading blob for item ${item.id}:`, error)
						updatedItems[i] = { ...item, blobUrlError: error.toString() }
						itemsUpdated = true
					} finally {
						loadingRef.current.delete(item.id) // Mark as not loading
					}
				}
			}

			if (itemsUpdated) {
				setDisplayedItems(updatedItems)
			}
		}

		loadBlobs()
	}, [displayedItems])

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

	const renderGridItem = (item: IMediaFile | IGapiFolder, index: number) => {
		if (item.mimeType === 'application/vnd.google-apps.folder') {
			return (
				<figure key={index} title={item.name} onClick={() => handleFolderClick(item.id, item.name)} className='text-success figure-icon'>
					<i className={isFolderLoading ? 'bi-arrow-repeat' : 'bi-folder-fill'} />
					<figcaption>{item.name}</figcaption>
				</figure>
			)
		} else if ('blobUrlError' in item && item.blobUrlError) {
			return (
				<figure key={index} title={item.blobUrlError} onClick={() => alert(item.blobUrlError)} className='text-danger figure-icon'>
					<i className="bi-warning" />
					<figcaption>{item.name}</figcaption>
				</figure>
			)
		} else if ('imageBlobUrl' in item && !item.imageBlobUrl) {
			return (
				<figure key={index} title={item.name} className="text-info figure-icon">
					<i className="bi-arrow-repeat" />
					<figcaption>{item.name}</figcaption>
				</figure>
			)
		} else if ('imageBlobUrl' in item && item.imageBlobUrl) {
			return (
				<Item {...item} key={item.id}>
					{({ ref, open }) => (
						(<figure>
							<img ref={ref as React.MutableRefObject<HTMLImageElement>} onClick={open} src={item.imageBlobUrl} title={item.name} />
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
			{renderGrid()}
		</section>
	)
}

export default FileBrowserGridView
