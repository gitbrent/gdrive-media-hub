import { useCallback, useContext, useEffect, useState } from 'react'
import { IGapiFile, IGapiFolder, IMediaFile, formatBytesToMB, formatDate } from '../App.props'
import { VideoViewerOverlay, ImageViewerOverlay } from './FileBrowOverlays'
import { isFolder, isGif, isImage, isMedia, isVideo } from '../utils/mimeTypes'
import { DataContext } from '../api-google/DataContext'

interface ItemWithLineage extends IGapiFile, IGapiFolder {
	_lineagePath?: string
}

interface Props {
	handleFolderClick: (folderId: string, folderName: string) => Promise<void>
	isFolderLoading: boolean
	currFolderContents: Array<IGapiFile | IGapiFolder>
}

const FileBrowViewList: React.FC<Props> = ({ handleFolderClick, isFolderLoading, currFolderContents }) => {
	const [selectedFile, setSelectedFile] = useState<IMediaFile | null>(null)
	const [isMediaLoading, setIsMediaLoading] = useState(false)
	const [touchStart, setTouchStart] = useState<number | null>(null)
	const [touchEnd, setTouchEnd] = useState<number | null>(null)
	const { getBlobUrlForFile } = useContext(DataContext)

	const handleFileClick = useCallback(async (file: IGapiFile) => {
		if (file.mimeType.includes('image/') || file.mimeType.includes('video/')) {
			setIsMediaLoading(true)

			const original = await getBlobUrlForFile(file.id)
			if (original) {
				setSelectedFile({ ...file, original: original })
			}
			else {
				console.error('unable to getBlobUrlForFile() for file!')
			}

			setIsMediaLoading(false)
		} else {
			// TODO: Handle error scenario (e.g., show an error message)
		}
	}, [getBlobUrlForFile])

	const navigateToNextFile = useCallback(() => {
		const currentIndex = currFolderContents.findIndex(item => item.id === selectedFile?.id)
		if (currentIndex >= 0 && currentIndex < currFolderContents.length - 1) {
			const nextFile = currFolderContents[currentIndex + 1]
			if (nextFile.mimeType.includes('image/') || nextFile.mimeType.includes('video/')) {
				handleFileClick(nextFile)
			}
		}
	}, [currFolderContents, handleFileClick, selectedFile?.id])

	const navigateToPrevFile = useCallback(() => {
		const currentIndex = currFolderContents.findIndex(item => item.id === selectedFile?.id)
		if (currentIndex > 0) {
			const prevFile = currFolderContents[currentIndex - 1]
			if (prevFile.mimeType.includes('image/') || prevFile.mimeType.includes('video/')) {
				handleFileClick(prevFile)
			}
		}
	}, [currFolderContents, handleFileClick, selectedFile?.id])

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
	}, [currFolderContents, navigateToNextFile, navigateToPrevFile, selectedFile])

	useEffect(() => {
		if (!touchStart || !touchEnd) return

		const threshold = 50 // Minimum distance of the swipe
		const swipeDistance = touchStart - touchEnd

		if (swipeDistance > threshold) { // Swipe left
			// eslint-disable-next-line react-hooks/set-state-in-effect
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
		// Helper to determine file type for badges
		const getTypeLabel = (item: IGapiFile | IGapiFolder): string => {
			if (isFolder(item)) return 'Folder'
			if (isImage(item)) return 'Image'
			if (isGif(item)) return 'GIF'
			if (isVideo(item)) return 'Video'
			return 'File'
		}

		// Helper to determine badge color based on type
		const getTypeBadgeClass = (item: IGapiFile | IGapiFolder): string => {
			if (isFolder(item)) return 'bg-warning text-dark'
			if (isImage(item)) return 'bg-success'
			if (isGif(item)) return 'bg-primary'
			if (isVideo(item)) return 'bg-info text-dark'
			return 'bg-secondary'
		}

		// Helper to get progress bar color based on size
		const getSizeProgressColor = (sizeInBytes: number): string => {
			const sizeInMB = sizeInBytes / (1024 * 1024)
			if (sizeInMB < 10) return 'bg-success'
			if (sizeInMB < 100) return 'bg-info'
			if (sizeInMB < 500) return 'bg-warning'
			return 'bg-danger'
		}

		// Helper to extract date only (remove time)
		const getDateOnly = (dateString: string): string => {
			return formatDate(dateString).split(' ')[0]
		}

		// Calculate max file size in current folder for relative progress bars
		const maxFileSize = currFolderContents.reduce((max, item) => {
			const size = Number(item.size || 0)
			return Math.max(max, size)
		}, 0)

		return (<table className='table align-middle mb-0'>
			<thead className='table-dark'>
				<tr className='text-noselect'>
					<th style={{ width: '1%' }}>&nbsp;</th>
					<th>Name</th>
					<th className='d-none d-lg-table-cell' style={{ width: '8%' }}>Type</th>
					<th className='d-none d-md-table-cell' style={{ width: '12%' }}>Size</th>
					<th className='d-none d-xl-table-cell' style={{ width: '8%' }}>Created</th>
					<th className='d-none d-lg-table-cell' style={{ width: '8%' }}>Modified</th>
				</tr>
			</thead>
			<tbody>
				{currFolderContents.length > 0
					? currFolderContents.map((item, index) => {
						const mimeTextClass = isFolder(item) ? 'text-warning' : isImage(item) ? 'text-success' : isGif(item) ? 'text-primary' : isVideo(item) ? 'text-info' : 'text-muted'
						const sizeInBytes = Number(item.size || 0)
						const sizePercent = maxFileSize > 0 ? (sizeInBytes / maxFileSize) * 100 : 0
						const itemWithLineage = item as ItemWithLineage

						return (
							<tr key={index} className='border-bottom border-dark-subtle file-list-row'>
								<td>
									<div className={`file-list-icon-wrapper ${mimeTextClass}`}>
										<i className={
											isFolder(item) && isFolderLoading
												? 'fs-4 bi-arrow-repeat'
												: isFolder(item)
													? 'fs-4 bi-folder-fill'
													: isImage(item)
														? 'fs-4 bi-image'
														: isGif(item)
															? 'fs-4 bi-play-btn'
															: isVideo(item)
																? 'fs-4 bi-camera-video'
																: 'fs-4 bi-file-x text-light'
										} />
									</div>
								</td>
								<td className='cursor-link'>
									{isFolder(item)
										? <div
											className={`${mimeTextClass} fw-bold text-decoration-none`}
											onClick={() => !isFolderLoading && handleFolderClick(item.id, item.name)}
											style={{ cursor: 'pointer' }}>
											{item.name}
											{itemWithLineage._lineagePath && (
												<div className='file-list-path'>
													{itemWithLineage._lineagePath}
												</div>
											)}
										</div>
										: isMedia(item) ?
											<div className={mimeTextClass} onClick={() => handleFileClick(item)} style={{ cursor: 'pointer' }}>
												{item.name}
												{itemWithLineage._lineagePath && (
													<div className='file-list-path'>
														{itemWithLineage._lineagePath}
													</div>
												)}
											</div>
											:
											<div className='text-muted'>{item.name}</div>
									}
								</td>
								<td className='d-none d-lg-table-cell'>
									{!isFolder(item) && (
										<span className={`badge ${getTypeBadgeClass(item)}`}>
											{getTypeLabel(item)}
										</span>
									)}
								</td>
								<td className='d-none d-md-table-cell'>
									{!isFolder(item) && item.size && (
										<div className='hstack gap-2'>
											<div className='progress flex-grow-1' style={{ height: '6px' }}>
												<div
													className={`progress-bar ${getSizeProgressColor(sizeInBytes)}`}
													style={{ width: `${sizePercent}%` }}
													role='progressbar'
													aria-valuenow={sizePercent}
													aria-valuemin={0}
													aria-valuemax={100}>
												</div>
											</div>
											<small className='text-muted text-nowrap'>{formatBytesToMB(sizeInBytes)}</small>
										</div>
									)}
								</td>
								<td className='text-nowrap d-none d-xl-table-cell text-center text-muted small'>{item.createdTime ? getDateOnly(item.createdTime) : ''}</td>
								<td className='text-nowrap d-none d-lg-table-cell text-center text-muted small'>{item.modifiedByMeTime ? getDateOnly(item.modifiedByMeTime) : ''}</td>
							</tr>
						)
					})
					: (
						<tr>
							<td colSpan={6} className='text-center text-muted p-4'>(no media files)</td>
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

export default FileBrowViewList
