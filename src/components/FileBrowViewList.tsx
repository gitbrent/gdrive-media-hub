import React, { useEffect, useState } from 'react'
import { IGapiFile, IGapiFolder, IMediaFile, formatBytesToMB, formatDate } from '../App.props'
import { SortConfig, SortDirection, SortKey } from '../types/FileBrowser'
import { VideoViewerOverlay, ImageViewerOverlay } from './FileBrowOverlays'
import { isFolder, isImage, isVideo } from '../utils/mimeTypes'
import { getBlobForFile } from '../api'

interface Props {
	origFolderContents: Array<IGapiFile | IGapiFolder>
	handleFolderClick: (folderId: string, folderName: string) => Promise<void>
	isFolderLoading: boolean
	currFolderContents: Array<IGapiFile | IGapiFolder>
	setCurrFolderContents: (res: Array<IGapiFile | IGapiFolder>) => void
	optSchWord?: string
}

const FileBrowserListView: React.FC<Props> = ({
	origFolderContents,
	handleFolderClick,
	isFolderLoading,
	currFolderContents,
	setCurrFolderContents,
	optSchWord
}) => {
	const [selectedFile, setSelectedFile] = useState<IMediaFile | null>(null)
	const [isMediaLoading, setIsMediaLoading] = useState(false)
	const [touchStart, setTouchStart] = useState<number | null>(null)
	const [touchEnd, setTouchEnd] = useState<number | null>(null)
	const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' })

	/**
	 * FILTER and SORT folder contents
	 */
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

	const requestSort = (key: SortKey) => {
		let direction: SortDirection = 'ascending'

		if (sortConfig.key === key && sortConfig.direction === 'ascending') {
			direction = 'descending'
		}

		setSortConfig({ key, direction })
	}

	const handleFileClick = async (file: IGapiFile) => {
		if (file.mimeType.includes('image/') || file.mimeType.includes('video/')) {
			setIsMediaLoading(true)

			const original = await getBlobForFile(file.id)
			if (original) {
				setSelectedFile({ ...file, original: original })
			}

			setIsMediaLoading(false)
		} else {
			// TODO: Handle error scenario (e.g., show an error message)
		}
	}

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'ArrowLeft') {
				navigateToPrevFile()
			}
			else if (event.key === 'ArrowRight') {
				navigateToNextFile()
			}
		}

		window.addEventListener('keydown', handleKeyDown)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [currFolderContents, selectedFile])

	const navigateToNextFile = () => {
		const currentIndex = currFolderContents.findIndex(item => item.id === selectedFile?.id)
		if (currentIndex >= 0 && currentIndex < currFolderContents.length - 1) {
			const nextFile = currFolderContents[currentIndex + 1]
			if (nextFile.mimeType.includes('image/') || nextFile.mimeType.includes('video/')) {
				handleFileClick(nextFile)
			}
		}
	}

	const navigateToPrevFile = () => {
		const currentIndex = currFolderContents.findIndex(item => item.id === selectedFile?.id)
		if (currentIndex > 0) {
			const prevFile = currFolderContents[currentIndex - 1]
			if (prevFile.mimeType.includes('image/') || prevFile.mimeType.includes('video/')) {
				handleFileClick(prevFile)
			}
		}
	}

	useEffect(() => {
		if (!touchStart || !touchEnd) return

		const threshold = 50 // Minimum distance of the swipe
		const swipeDistance = touchStart - touchEnd

		if (swipeDistance > threshold) { // Swipe left
			navigateToNextFile()
		}

		if (swipeDistance < -threshold) { // Swipe right
			navigateToPrevFile()
		}

		// Reset
		setTouchStart(null)
		setTouchEnd(null)
	}, [touchStart, touchEnd, navigateToNextFile, navigateToPrevFile])

	const toggleBodyScroll = (shouldScroll: boolean) => {
		document.body.style.overflow = shouldScroll ? '' : 'hidden'
	}

	useEffect(() => {
		if (selectedFile) {
			// Disable scrolling when overlay is active
			toggleBodyScroll(false)
		} else {
			// Enable scrolling when overlay is inactive
			toggleBodyScroll(true)
		}
	}, [selectedFile])

	useEffect(() => {
		const handleTouchStart = (e: TouchEvent) => {
			e.preventDefault()
			setTouchStart(e.targetTouches[0].clientX)
		}

		const handleTouchEnd = (e: TouchEvent) => {
			e.preventDefault()
			setTouchEnd(e.changedTouches[0].clientX)
		}

		const overlayElement = selectedFile ? document.querySelector('.image-viewer-content') || document.querySelector('.video-viewer-content') : null

		if (overlayElement) {
			overlayElement.addEventListener('touchstart', handleTouchStart as EventListener, { passive: false })
			overlayElement.addEventListener('touchend', handleTouchEnd as EventListener, { passive: false })
		}

		return () => {
			if (overlayElement) {
				overlayElement.removeEventListener('touchstart', handleTouchStart as EventListener)
				overlayElement.removeEventListener('touchend', handleTouchEnd as EventListener)
			}
		}
	}, [selectedFile])

	// --------------------------------------------------------------------------------------------

	function renderTable(): JSX.Element {
		return (<table className='table align-middle mb-0'>
			<thead>
				<tr className='text-noselect'>
					<th style={{ width: '1%' }}>&nbsp;</th>
					<th className='cursor-link text-nowrap' title="click to sort" onClick={() => requestSort('name')}>
						Name {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}
					</th>
					<th className='cursor-link text-nowrap d-none d-lg-table-cell' title="click to sort" style={{ width: '4%' }} onClick={() => requestSort('mimeType')}>
						Type {sortConfig.key === 'mimeType' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}
					</th>
					<th className='cursor-link text-nowrap d-none d-md-table-cell' title="click to sort" style={{ width: '4%' }} onClick={() => requestSort('size')}>
						Size {sortConfig.key === 'size' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}
					</th>
					<th className='cursor-link text-nowrap d-none d-xl-table-cell' title="click to sort" style={{ width: '10%' }} onClick={() => requestSort('createdTime')}>
						Created {sortConfig.key === 'createdTime' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}
					</th>
					<th className='cursor-link text-nowrap d-none d-md-table-cell' title="click to sort" style={{ width: '10%' }} onClick={() => requestSort('modifiedByMeTime')}>
						Modified {sortConfig.key === 'modifiedByMeTime' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}
					</th>
				</tr>
			</thead>
			<tbody>
				{currFolderContents.length > 0
					? currFolderContents.map((item, index) => {
						const mimeTextClass = isFolder(item) ? 'text-success' : isImage(item) ? 'text-info' : 'text-warning'
						return (
							<tr key={index}>
								<td>
									<div className={mimeTextClass}>
										<i className={
											isFolder(item) && isFolderLoading
												? 'fs-4 bi-arrow-repeat'
												: isFolder(item)
													? 'fs-4 bi-folder-fill'
													: isImage(item)
														? 'fs-4 bi-image-fill'
														: isVideo(item)
															? 'fs-4 bi-camera-video-fill'
															: 'fs-4 bi-file-x text-light'
										} />
									</div>
								</td>
								<td className='cursor-link' style={{ wordBreak: 'break-all' }}>
									{isFolder ?
										<div
											className={`${mimeTextClass} fw-bold`}
											onClick={() => isFolder(item) && !isFolderLoading && handleFolderClick(item.id, item.name)}>
											{item.name}
										</div>
										: isImage(item) || isVideo(item) ?
											<div className={mimeTextClass} onClick={() => handleFileClick(item)}>
												{item.name}
											</div>
											:
											<div>{item.name}</div>
									}
								</td>
								<td className='text-nowrap text-end text-muted d-none d-lg-table-cell'>{!isFolder(item) && item.mimeType ? item.mimeType.split('/').pop() : ''}</td>
								<td className='text-nowrap text-end text-muted d-none d-md-table-cell'>{item.size ? formatBytesToMB(Number(item.size)) : ''}</td>
								<td className='text-nowrap text-center text-muted d-none d-xl-table-cell'>{item.createdTime ? formatDate(item.createdTime) : ''}</td>
								<td className='text-nowrap text-center text-muted d-none d-md-table-cell'>{item.modifiedByMeTime ? formatDate(item.modifiedByMeTime) : ''}</td>
							</tr>
						)
					})
					: (
						<tr>
							<td colSpan={6} className='text-center text-muted p-3'>(no media files)</td>
						</tr>
					)
				}
			</tbody>
		</table>)
	}



	return (
		<section className={`p-4 bg-black ${isFolderLoading ? 'busy-cursor' : ''}`}>
			{isMediaLoading
				? (
					<div className="media-loading-indicator">
						<div className="spinner-border text-light" role="status">
							<span className="visually-hidden">Loading...</span>
						</div>
						<strong className="ms-3" role="status">Loading...</strong>
					</div>
				)
				: selectedFile ? (
					// eslint-disable-next-line react/prop-types
					selectedFile.mimeType.includes('video/') ?
						<VideoViewerOverlay
							selectedFile={selectedFile}
							navigateToNextFile={navigateToNextFile}
							navigateToPrevFile={navigateToPrevFile}
							setSelectedFile={setSelectedFile}
						/> :
						<ImageViewerOverlay
							selectedFile={selectedFile}
							navigateToNextFile={navigateToNextFile}
							navigateToPrevFile={navigateToPrevFile}
							setSelectedFile={setSelectedFile}
						/>
				) :
					<div />
			}

			<div className='table-responsive'>{renderTable()}</div>
		</section>
	)
}

export default FileBrowserListView
