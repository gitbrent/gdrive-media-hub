import React from 'react'

interface AlertNoImagesProps {
	title?: string;
	subtitle?: string;
}

const AlertNoImages: React.FC<AlertNoImagesProps> = ({ title = 'say less bro', subtitle = '(no images to display)' }) => {
	return (
		<section className="flex justify-center my-5">
			<div className="inline-flex items-center gap-4 bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-md shadow-sm" role="alert">
				<div className="shrink-0">
					<i className="bi bi-exclamation-triangle-fill text-2xl text-yellow-600 dark:text-yellow-400"></i>
				</div>
				<div className="flex-1">
					<h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 m-0">{title}</h3>
					<p className="text-sm text-yellow-700 dark:text-yellow-300 m-0">{subtitle}</p>
				</div>
			</div>
		</section>
	)
}

export default AlertNoImages
