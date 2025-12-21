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
			<ol className="breadcrumb mb-0" style={{
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				flexWrap: 'wrap'
			}}>
				{path.map((segment, index) => {
					const isLast = index === path.length - 1
					const isFirst = index === 0

					return (
						<React.Fragment key={index}>
							<li
								className={`breadcrumb-item ${isLast ? 'active text-primary fw-semibold bg-primary bg-opacity-10' : 'text-secondary fw-medium'}`}
								onClick={() => !isLast && onNavigate(index, segment.folderId)}
								style={{
									cursor: isLast ? 'default' : 'pointer',
									padding: '6px 12px',
									borderRadius: '6px',
									transition: 'all 0.2s ease',
									display: 'flex',
									alignItems: 'center',
									gap: '6px'
								}}
								onMouseEnter={(e) => {
									if (!isLast) {
										e.currentTarget.classList.add('bg-dark-subtle', 'text-body')
									}
								}}
								onMouseLeave={(e) => {
									if (!isLast) {
										e.currentTarget.classList.remove('bg-dark-subtle', 'text-body')
									}
								}}
							>
								{isFirst && <i className="bi-house-fill me-1"></i>}
								{segment.folderName}
							</li>
							{!isLast && <i className="bi-chevron-right text-muted"></i>}
						</React.Fragment>
					)
				})}
			</ol>
		</nav>
	)
}

export default Breadcrumbs
