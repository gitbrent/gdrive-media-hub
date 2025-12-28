import React from 'react'

/**
 * GridCaption - For displaying captions on grid/tile thumbnails
 * Shows a small overlay caption for thumbnail view
 */
interface CaptionGridProps {
	title: string
	size?: 'small' | 'medium' | 'large'
}

const CaptionGrid: React.FC<CaptionGridProps> = ({
	title,
	size = 'medium',
}) => {
	const textSizeClass = size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'
	return (
		<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/70 to-transparent p-3 z-20">
			<div className="flex-1 min-w-0">
				<div
					className={`text-gray-300 font-medium line-clamp-2 ${textSizeClass}`}
					title={title}>
					{title}
				</div>
			</div>
		</div>
	)
}

export default CaptionGrid
