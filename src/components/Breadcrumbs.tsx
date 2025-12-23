import React from 'react'
import { BreadcrumbSegment } from '../App.props'

interface BreadcrumbProps {
	path: BreadcrumbSegment[]
	onNavigate: (pathIndex: number, folderId: string) => void
	className?: string
}

const Breadcrumbs: React.FC<BreadcrumbProps> = ({ path, onNavigate, className }) => {
	const navClassName = `text-noselect ${className || ''}`

	return (
		<nav className={navClassName} aria-label="breadcrumb">
			<ol className="flex items-center flex-wrap gap-2">
				{path.map((segment, index) => {
					const isLast = index === path.length - 1
					const isFirst = index === 0

					return (
						<React.Fragment key={index}>
							<li
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 ${isLast
										? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-100 dark:bg-blue-900 cursor-default'
										: 'text-gray-600 dark:text-gray-400 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
									}`}
								onClick={() => !isLast && onNavigate(index, segment.folderId)}
							>
								{isFirst && <i className="bi-house-fill"></i>}
								{segment.folderName}
							</li>
							{!isLast && <i className="bi-chevron-right text-gray-400 dark:text-gray-600"></i>}
						</React.Fragment>
					)
				})}
			</ol>
		</nav>
	)
}

export default Breadcrumbs
