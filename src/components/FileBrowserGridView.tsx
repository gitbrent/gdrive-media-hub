import React, { useEffect, useMemo, useState } from 'react'
import { IGapiFile, IGapiFolder } from '../App.props'
import { SortConfig, SortDirection, SortKey } from '../types/FileBrowser'
import { Gallery, Item } from 'react-photoswipe-gallery'
import 'photoswipe/dist/photoswipe.css'

interface Props {
	origFolderContents: Array<IGapiFile | IGapiFolder>
	handleFolderClick: (folderId: string, folderName: string) => Promise<void>
	isFolderLoading: boolean
	currFolderContents: Array<IGapiFile | IGapiFolder>
	setCurrFolderContents: (res: Array<IGapiFile | IGapiFolder>) => void
	optSchWord?: string
}

const FileBrowserGridView: React.FC<Props> = ({
	origFolderContents,
	handleFolderClick,
	isFolderLoading,
	currFolderContents,
	setCurrFolderContents,
	optSchWord
}) => {
	const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' })

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

	// TODO: Show folders first
	const filteredSortedContents = useMemo(() => {
		// TODO: Implement filtering and sorting logic here, similar to FileBrowserListView
		// Return the sorted and filtered contents
		return currFolderContents
	}, [currFolderContents, optSchWord])

	const renderGridItem = (item: IGapiFile | IGapiFolder, index: number) => {
		if (item.mimeType === 'application/vnd.google-apps.folder') {
			return (
				<figure
					key={index}
					title={item.name}
					onClick={() => handleFolderClick(item.id, item.name)}
					style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
					className='text-success'
				>
					<i className="bi-folder-fill" style={{ fontSize: '6rem' }} />
					<figcaption style={{ textAlign: 'center', maxWidth: '100%', wordWrap: 'break-word' }}>{item.name}</figcaption>
				</figure>
			)
		} else if ('blobUrl' in item) {
			return (
				<Item
					key={index}
					original={item.blobUrl}
					thumbnail={item.blobUrl}
					width="1024"
					height="768"
				>
					{({ ref, open }) => (
						<figure>
							<img ref={ref as React.MutableRefObject<HTMLImageElement>} onClick={open} src={item.blobUrl} alt={item.name} />
							<figcaption>{item.name}</figcaption>
						</figure>
					)}
				</Item>
			)
		}
	}

	const renderGrid = () => {
		return (
			<Gallery id="contImageGrid" withCaption={false}>
				<div id="gallery-container" className="gallery">
					{filteredSortedContents.map((item, index) => renderGridItem(item, index))}
				</div>
			</Gallery>
		)
	}

	return (
		<section>
			{renderGrid()}
		</section>
	)
}

export default FileBrowserGridView
