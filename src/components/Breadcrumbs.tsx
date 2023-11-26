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
			<ol className="breadcrumb mb-0">
				{path.map((segment, index) => (
					<li
						key={index}
						className={`breadcrumb-item ${index === path.length - 1 ? 'active' : ''}`}
						onClick={() => onNavigate(index, segment.folderId)}
						style={{ cursor: 'pointer' }}
					>
						{segment.folderName}
					</li>
				))}
			</ol>
		</nav>
	)
}

export default Breadcrumbs
