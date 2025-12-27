import React from 'react'

interface MediaCaptionProps {
	title: string
	subtitle?: string
	size?: 'small' | 'medium' | 'large'
	variant?: 'overlay' | 'card'
	showIcon?: boolean
}

const MediaCaption: React.FC<MediaCaptionProps> = ({
	title,
	subtitle,
	size = 'medium',
	variant = 'overlay',
	showIcon = true,
}) => {
	if (variant === 'overlay') {
		return (
			<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/70 to-transparent p-3 z-20">
				<div className="flex items-start gap-2">
					{showIcon && (
						<i className="bi-file-earmark text-white/80 text-lg shrink-0 mt-0.5" />
					)}
					<div className="flex-1 min-w-0">
						<div
							className={`text-white font-medium line-clamp-2 ${
								size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'
							}`}
							title={title}
						>
							{title}
						</div>
						{subtitle && (
							<div className="text-white/70 text-xs line-clamp-1 mt-1">{subtitle}</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	// Card variant (for figcaption style)
	return (
		<figcaption
			className={`media-caption bg-linear-to-t from-base-900/80 via-base-900/40 to-transparent text-center font-medium flex items-center justify-center gap-2 ${
				size === 'small' ? 'text-xs p-1.5' : size === 'large' ? 'text-base p-3' : 'text-sm p-2'
			}`}
			title={title}
		>
			{showIcon && <i className="bi-file-earmark opacity-70" />}
			<span className="truncate">{title}</span>
		</figcaption>
	)
}

export default MediaCaption
