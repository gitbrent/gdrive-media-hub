import { useCallback, useContext, useEffect, useState } from 'react'
import { IGapiFile, IGapiFolder, IMediaFile, formatBytesToMB, formatDate } from '../App.props'
import { VideoViewerOverlay, ImageViewerOverlay } from './FileBrowOverlays'
import { isFolder, isGif, isImage, isMedia, isVideo } from '../utils/mimeTypes'
import { DataContext } from '../api-google/DataContext'

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
						Name
					</th>
					<th className='d-none d-lg-table-cell' style={{ width: '4%' }}>
						Type
					</th>
					<th className='d-none d-md-table-cell' style={{ width: '5%' }}>
						Size
					</th>
					<th className='d-none d-xl-table-cell' style={{ width: '10%' }}>
						Created
					</th>
					<th className='d-none d-md-table-cell' style={{ width: '10%' }}>
						Modified
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
														: isGif(item)
															? 'fs-4 bi-play-circle'
															: isVideo(item)
																? 'fs-4 bi-play-btn-fill'
																: 'fs-4 bi-file-x text-light'
										} />
									</div>
								</td>
								<td className='cursor-link' style={{ wordBreak: 'break-all' }}>
									{isFolder(item)
										? <div
											className={`${mimeTextClass} fw-bold`}
											onClick={() => !isFolderLoading && handleFolderClick(item.id, item.name)}>
											{item.name}
										</div>
										: isMedia(item) ?
											<div className={mimeTextClass} onClick={() => handleFileClick(item)}>
												{item.name}
											</div>
											:
											<div className='text-muted'>{item.name}</div>
									}
								</td>
								<td className='text-nowrap d-none d-lg-table-cell text-end text-muted'>{!isFolder(item) && item.mimeType ? item.mimeType.split('/').pop() : ''}</td>
								<td className='text-nowrap d-none d-md-table-cell text-end text-muted'>{item.size ? formatBytesToMB(Number(item.size)) : ''}</td>
								<td className='text-nowrap d-none d-xl-table-cell text-center text-muted'>{item.createdTime ? formatDate(item.createdTime) : ''}</td>
								<td className='text-nowrap d-none d-md-table-cell text-center text-muted'>{item.modifiedByMeTime ? formatDate(item.modifiedByMeTime) : ''}</td>
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

export default FileBrowViewList
