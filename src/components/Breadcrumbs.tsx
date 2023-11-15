import React from 'react'
import { BreadcrumbSegment } from '../App.props'

interface BreadcrumbProps {
	path: BreadcrumbSegment[]
	onNavigate: (pathIndex: number, folderId: string) => void
}

const Breadcrumbs: React.FC<BreadcrumbProps> = ({ path, onNavigate }) => {
	return (
		<nav className="text-noselect" aria-label="breadcrumb">
			<ol className="breadcrumb">
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