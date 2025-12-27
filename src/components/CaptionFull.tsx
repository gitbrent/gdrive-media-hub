import React from 'react'
import { formatBytes } from '../App.props'

/**
 * FullViewCaption - For displaying detailed captions in full-view scenarios
 * Used by VideoPlayer and Slideshow for showing name, size, date, dimensions, etc.
 */
interface CaptionFullProps {
	title: string
	size?: number
	modifiedDate?: string
	dimensions?: { width?: number; height?: number }
	mimeType?: string
	position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const CaptionFull: React.FC<CaptionFullProps> = ({
	title,
	size,
	modifiedDate,
	dimensions,
	mimeType,
	position = 'bottom-left',
}) => {
	// Determine positioning classes
	const positionClasses = {
		'top-left': 'top-4 left-4',
		'top-right': 'top-4 right-4',
		'bottom-left': 'bottom-4 left-4',
		'bottom-right': 'bottom-4 right-4',
	}

	// Determine if gradient should go up or down
	const isBottomPosition = position.includes('bottom')
	const gradientClass = isBottomPosition
		? 'bg-linear-to-t from-black/90 via-black/60 to-transparent'
		: 'bg-linear-to-b from-black/90 via-black/60 to-transparent'

	const paddingClass = isBottomPosition ? 'pb-4 pt-8' : 'pt-4 pb-8'

	return (
		<div
			className={`absolute ${positionClasses[position]} z-30 ${gradientClass} ${paddingClass} px-4 rounded-lg max-w-xs sm:max-w-sm`}
		>
			{/* Title */}
			<div className="mb-3">
				<h2
					className="text-lg sm:text-xl font-bold text-white wrap-break-word line-clamp-3"
					title={title}
				>
					{title}
				</h2>
			</div>

			{/* Metadata Grid */}
			<div className="flex flex-col gap-2 text-xs sm:text-sm text-white/80">
				{/* Date */}
				{modifiedDate && (
					<div className="flex items-center gap-2">
						<i className="bi-calendar-event text-white/60 w-4" />
						<span>{modifiedDate}</span>
					</div>
				)}

				{/* File Size */}
				{size && (
					<div className="flex items-center gap-2">
						<i className="bi-file-earmark text-white/60 w-4" />
						<span>{formatBytes(size)}</span>
					</div>
				)}

				{/* Dimensions */}
				{dimensions && (dimensions.width || dimensions.height) && (
					<div className="flex items-center gap-2">
						<i className="bi-aspect-ratio text-white/60 w-4" />
						<span>
							{dimensions.width && dimensions.height
								? `${dimensions.width} × ${dimensions.height}`
								: dimensions.width
									? `${dimensions.width}px`
									: `${dimensions.height}px`}
						</span>
					</div>
				)}

				{/* MIME Type */}
				{mimeType && (
					<div className="flex items-center gap-2">
						<i className="bi-file-type text-white/60 w-4" />
						<span className="truncate">{mimeType}</span>
					</div>
				)}
			</div>
		</div>
	)
}

export default CaptionFull
