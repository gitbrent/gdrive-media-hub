import React from 'react'
import { IGapiFile, IMediaFile } from '../App.props'
import '../css/FileBrowser.css'

interface OverlayButtonsProps {
	selectedFile: IGapiFile | IMediaFile | null
	navigateToPrevFile?: () => void
	navigateToNextFile?: () => void
	setSelectedFile: (arg: IGapiFile | null) => void
}

const OverlayButtons: React.FC<OverlayButtonsProps> = ({ navigateToPrevFile, navigateToNextFile, setSelectedFile }) => {
	return (
		<>
			{navigateToPrevFile &&
				<button className="h3 chevron-button chevron-left" onClick={navigateToPrevFile}>
					<i className="bi bi-chevron-left"></i>
				</button>
			}
			{navigateToNextFile &&
				<button className="h3 chevron-button chevron-right" onClick={navigateToNextFile}>
					<i className="bi bi-chevron-right"></i>
				</button>
			}
			<button className="h3 btn-close-overlay" onClick={(e) => {
				e.stopPropagation()
				setSelectedFile(null)
			}}>
				<i className="bi bi-x-lg"></i>
			</button>
		</>
	)
}

export const ImageViewerOverlay: React.FC<OverlayButtonsProps> = (
	{ selectedFile, navigateToPrevFile, navigateToNextFile, setSelectedFile }
) => {
	if (!selectedFile) return null

	return (
		<div className="image-viewer-overlay">
			<div className="image-viewer-content">
				<img src={selectedFile.blobUrl} alt={selectedFile.name} />
			</div>
			<OverlayButtons
				selectedFile={selectedFile}
				navigateToNextFile={navigateToNextFile}
				navigateToPrevFile={navigateToPrevFile}
				setSelectedFile={setSelectedFile}
			/>
		</div>
	)
}

export const VideoViewerOverlay: React.FC<OverlayButtonsProps> = (
	{ selectedFile, navigateToPrevFile, navigateToNextFile, setSelectedFile }
) => {
	if (!selectedFile) return null

	return (
		<div className="video-viewer-overlay">
			<div className="video-viewer-content">
				<video id="video-player" controls>
					<source src={selectedFile.blobUrl} type={selectedFile.mimeType} />
					Your browser does not support the video tag.
				</video>
			</div>
			<OverlayButtons
				selectedFile={selectedFile}
				navigateToNextFile={navigateToNextFile}
				navigateToPrevFile={navigateToPrevFile}
				setSelectedFile={setSelectedFile}
			/>
		</div>
	)
}
