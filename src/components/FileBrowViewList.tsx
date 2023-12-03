import React, { useEffect, useState } from 'react'
import { IGapiFile, IGapiFolder, IMediaFile, formatBytesToMB, formatDate } from '../App.props'
import { VideoViewerOverlay, ImageViewerOverlay } from './FileBrowOverlays'
import { isFolder, isImage, isVideo } from '../utils/mimeTypes'
import { getBlobForFile } from '../api'

interface Props {
	handleFolderClick: (folderId: string, folderName: string) => Promise<void>
	isFolderLoading: boolean
	currFolderContents: Array<IGapiFile | IGapiFolder>
	sortField: string
	sortOrder: 'asc' | 'desc'
}

const FileBrowserListView: React.FC<Props> = ({
	handleFolderClick,
	isFolderLoading,
	currFolderContents,
	sortField,
	sortOrder,
}) => {
	const [selectedFile, setSelectedFile] = useState<IMediaFile | null>(null)
	const [isMediaLoading, setIsMediaLoading] = useState(false)
	const [touchStart, setTouchStart] = useState<number | null>(null)
	const [touchEnd, setTouchEnd] = useState<number | null>(null)

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
					<th>
						Name {sortField === 'name' && (sortOrder === 'asc' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}
					</th>
					<th style={{ width: '4%' }}>
						Type {sortField === 'mimeType' && (sortOrder === 'asc' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}
					</th>
					<th style={{ width: '4%' }}>
						Size {sortField === 'size' && (sortOrder === 'asc' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}
					</th>
					<th style={{ width: '10%' }}>
						Created
					</th>
					<th style={{ width: '10%' }}>
						Modified {sortField === 'modifiedByMeTime' && (sortOrder === 'asc' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}
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
					isVideo(selectedFile)
						? <VideoViewerOverlay
							selectedFile={selectedFile}
							navigateToNextFile={navigateToNextFile}
							navigateToPrevFile={navigateToPrevFile}
							setSelectedFile={setSelectedFile}
						/>
						: <ImageViewerOverlay
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
