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

		// Helper to determine badge color based on type (DaisyUI badge classes)
		const getTypeBadgeClass = (item: IGapiFile | IGapiFolder): string => {
			if (isFolder(item)) return 'badge-warning'
			if (isImage(item)) return 'badge-success'
			if (isGif(item)) return 'badge-primary'
			if (isVideo(item)) return 'badge-info'
			return 'badge-ghost'
		}

		// Helper to get progress bar color based on size (DaisyUI progress classes)
		const getSizeProgressColor = (sizeInBytes: number): string => {
			const sizeInMB = sizeInBytes / (1024 * 1024)
			if (sizeInMB < 10) return 'progress-success'
			if (sizeInMB < 100) return 'progress-info'
			if (sizeInMB < 500) return 'progress-warning'
			return 'progress-error'
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

		return (
			<table className='table'>
				<thead>
					<tr className='select-none'>
						<th className='w-12'></th>
						<th>Name</th>
						<th className='hidden lg:table-cell w-24'>Type</th>
						<th className='hidden md:table-cell w-40'>Size</th>
						<th className='hidden xl:table-cell w-28 text-center'>Created</th>
						<th className='hidden lg:table-cell w-28 text-center'>Modified</th>
					</tr>
				</thead>
				<tbody>
					{currFolderContents.length > 0
						? currFolderContents.map((item, index) => {
							const mimeTextClass = isFolder(item) ? 'text-warning' : isImage(item) ? 'text-success' : isGif(item) ? 'text-primary' : isVideo(item) ? 'text-info' : 'text-base-content/50'
							const sizeInBytes = Number(item.size || 0)
							const sizePercent = maxFileSize > 0 ? (sizeInBytes / maxFileSize) * 100 : 0
							const itemWithLineage = item as ItemWithLineage

							return (
								<tr key={index}>
									<td>
										<div className="flex items-center justify-center">
											<div className="avatar placeholder">
												<div className="bg-base-300 text-base-content rounded-full w-12 h-12 flex items-center justify-center">
													<i className={
														isFolder(item) && isFolderLoading
															? 'text-2xl bi-arrow-repeat'
															: isFolder(item)
																? 'text-2xl bi-folder-fill'
																: isImage(item)
																	? 'text-2xl bi-image'
																	: isGif(item)
																		? 'text-2xl bi-play-btn'
																		: isVideo(item)
																			? 'text-2xl bi-camera-video'
																			: 'text-2xl bi-file-x opacity-30'
													} />
												</div>
											</div>
										</div>
									</td>
									<td className='cursor-pointer'>
										{isFolder(item)
											? <div
												className={`${mimeTextClass} font-bold no-underline`}
												onClick={() => !isFolderLoading && handleFolderClick(item.id, item.name)}>
												{item.name}
												{itemWithLineage._lineagePath && (
													<div className='badge block badge-ghost badge-sm mt-1'>
														{itemWithLineage._lineagePath}
													</div>
												)}
											</div>
											: isMedia(item) ?
												<div className={mimeTextClass} onClick={() => handleFileClick(item)}>
													{item.name}
													{itemWithLineage._lineagePath && (
														<div className='badge block badge-ghost badge-sm mt-1'>
															{itemWithLineage._lineagePath}
														</div>
													)}
												</div>
												:
												<div className='text-base-content/50'>{item.name}</div>
										}
									</td>
									<td className='hidden lg:table-cell'>
										{!isFolder(item) && (
											<span className={`badge ${getTypeBadgeClass(item)} badge-sm`}>
												{getTypeLabel(item)}
											</span>
										)}
									</td>
									<td className='hidden md:table-cell'>
										{!isFolder(item) && item.size && (
											<div className='flex items-center gap-2'>
												<progress
													className={`progress ${getSizeProgressColor(sizeInBytes)} w-20 h-2`}
													value={sizePercent}
													max={100}>
												</progress>
												<small className='text-base-content/60 whitespace-nowrap text-xs'>
													{formatBytesToMB(sizeInBytes)}
												</small>
											</div>
										)}
									</td>
									<td className='whitespace-nowrap hidden xl:table-cell text-center text-base-content/60 text-sm'>
										{item.createdTime ? getDateOnly(item.createdTime) : ''}
									</td>
									<td className='whitespace-nowrap hidden lg:table-cell text-center text-base-content/60 text-sm'>
										{item.modifiedByMeTime ? getDateOnly(item.modifiedByMeTime) : ''}
									</td>
								</tr>
							)
						})
						: (
							<tr>
								<td colSpan={6} className='text-center text-base-content/60 p-8'>(no media files)</td>
							</tr>
						)
					}
				</tbody>
			</table>
		)
	}

	return (
		<section className="p-4 bg-base-100">
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
