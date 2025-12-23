import React from 'react'
import { IGapiFile, IMediaFile } from '../App.props'

interface OverlayButtonsProps {
	selectedFile: IMediaFile | null
	navigateToPrevFile?: () => void
	navigateToNextFile?: () => void
	setSelectedFile: (arg: IGapiFile | null) => void
}

const OverlayButtons: React.FC<OverlayButtonsProps> = ({ navigateToPrevFile, navigateToNextFile, setSelectedFile }) => {
	return (
		<>
			{navigateToPrevFile &&
				<button
					className="fixed top-1/2 left-2.5 z-1022 bg-black/50 border-none text-white cursor-pointer p-2.5 rounded-lg hover:bg-black/70 transition-all text-3xl"
					onClick={navigateToPrevFile}>
					<i className="bi bi-chevron-left"></i>
				</button>
			}
			{navigateToNextFile &&
				<button
					className="fixed top-1/2 right-2.5 z-1022 bg-black/50 border-none text-white cursor-pointer p-2.5 rounded-lg hover:bg-black/70 transition-all text-3xl"
					onClick={navigateToNextFile}>
					<i className="bi bi-chevron-right"></i>
				</button>
			}
			<button
				className="fixed top-2.5 right-2.5 z-1022 bg-black/50 border-none text-white cursor-pointer p-2.5 rounded-lg hover:bg-black/70 transition-all text-3xl"
				onClick={(e) => {
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
		<div className="fixed inset-0 w-full h-full bg-black/80 z-1021 flex items-center justify-center">
			<div className="text-center">
				<img
					src={selectedFile.original}
					alt={selectedFile.name}
					className="max-h-[98vh] max-w-[98vw] m-auto object-contain"
				/>
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
		<div className="fixed inset-0 w-full h-full bg-black/80 z-1021 flex items-center justify-center">
			<div className="flex items-center w-full max-w-[90%] max-h-[90vh]">
				<video
					id="video-player"
					controls
					className="w-full h-auto max-h-[calc(100vh-70px)] object-contain">
					<source src={selectedFile.original} type={selectedFile.mimeType} />
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
