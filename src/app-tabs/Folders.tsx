import { useContext, useState, useMemo, useEffect } from 'react'
import { DataContext } from '../api-google/DataContext'
import { getAllFolders, type FolderHierarchy } from '../api-google/driveService'
import AlertLoading from '../components/AlertLoading'
import { IMediaFile, formatBytes } from '../App.props'
import '../css/Folders.css'

interface FolderNode {
	id: string
	name: string
	parentIds: string[]
	childFolderIds: string[] // Direct children folder IDs
	mediaFiles: IMediaFile[]
	gradientClass: string
	dateRange: string
	totalSize: number
	formattedSize: string
	imageCount: number
	videoCount: number
}

const Folders: React.FC = () => {
	const { mediaFiles, isLoading } = useContext(DataContext)
	const [currentLevelId, setCurrentLevelId] = useState<string>('root')
	const [breadcrumb, setBreadcrumb] = useState<Array<{ id: string; name: string }>>([
		{ id: 'root', name: 'My Drive' }
	])
	const [searchTerm, setSearchTerm] = useState('')
	const [allFolders, setAllFolders] = useState<FolderHierarchy[]>([])
	const [isLoadingFolders, setIsLoadingFolders] = useState(false)

	// Fetch all folders on component mount
	useEffect(() => {
		const loadFolders = async () => {
			try {
				setIsLoadingFolders(true)
				const folders = await getAllFolders()
				setAllFolders(folders)
			} catch (error) {
				console.error('Error loading folders:', error)
			} finally {
				setIsLoadingFolders(false)
			}
		}

		loadFolders()
	}, [])

	// Build folder hierarchy from all folders and media files
	const folderHierarchy = useMemo(() => {
		const map = new Map<string, FolderNode>()

		// Initialize root folder
		map.set('root', {
			id: 'root',
			name: 'My Drive',
			parentIds: [],
			childFolderIds: [],
			mediaFiles: [],
			gradientClass: '',
			dateRange: '',
			totalSize: 0,
			formattedSize: '',
			imageCount: 0,
			videoCount: 0,
		})

		// Initialize all folders from Google Drive
		allFolders.forEach(folder => {
			if (!map.has(folder.id)) {
				map.set(folder.id, {
					id: folder.id,
					name: folder.name,
					parentIds: folder.parents || [],
					childFolderIds: [],
					mediaFiles: [],
					gradientClass: '',
					dateRange: '',
					totalSize: 0,
					formattedSize: '',
					imageCount: 0,
					videoCount: 0,
				})
			}
		})

		// Build parent-child relationships between folders
		allFolders.forEach(folder => {
			if (folder.parents && folder.parents.length > 0) {
				const parentId = folder.parents[0]
				if (!map.has(parentId)) {
					// Create parent folder entry if it doesn't exist
					map.set(parentId, {
						id: parentId,
						name: 'Unknown Folder',
						parentIds: [],
						childFolderIds: [],
						mediaFiles: [],
						gradientClass: '',
						dateRange: '',
						totalSize: 0,
						formattedSize: '',
						imageCount: 0,
						videoCount: 0,
					})
				}
				const parentFolder = map.get(parentId)!
				if (!parentFolder.childFolderIds.includes(folder.id)) {
					parentFolder.childFolderIds.push(folder.id)
				}
			}
		})

		// Add media files to their parent folders
		mediaFiles.forEach(file => {
			if (file.parents && file.parents.length > 0) {
				const folderId = file.parents[0]
				if (!map.has(folderId)) {
					map.set(folderId, {
						id: folderId,
						name: 'Unknown Folder',
						parentIds: [file.parents[0]],
						childFolderIds: [],
						mediaFiles: [],
						gradientClass: '',
						dateRange: '',
						totalSize: 0,
						formattedSize: '',
						imageCount: 0,
						videoCount: 0,
					})
				}

				const folder = map.get(folderId)!
				folder.mediaFiles.push(file)
				folder.totalSize += Number(file.size) || 0

				if (file.mimeType.includes('image/')) {
					folder.imageCount++
				} else if (file.mimeType.includes('video/')) {
					folder.videoCount++
				}

				// If this file is directly under root, add its folder as a child of root
				if (folderId !== 'root' && !map.get('root')!.childFolderIds.includes(folderId)) {
					map.get('root')!.childFolderIds.push(folderId)
				}
			}
		})

		// Calculate metadata for each folder
		const gradientClasses = [
			'bg-gradient-to-br from-violet-600 to-violet-800',
			'bg-gradient-to-br from-blue-600 to-blue-800',
			'bg-gradient-to-br from-emerald-600 to-emerald-800',
			'bg-gradient-to-br from-pink-600 to-pink-800',
			'bg-gradient-to-br from-orange-600 to-orange-800',
			'bg-gradient-to-br from-cyan-600 to-cyan-800',
			'bg-gradient-to-br from-indigo-600 to-indigo-800',
			'bg-gradient-to-br from-red-600 to-red-800',
			'bg-gradient-to-br from-sky-600 to-sky-800',
		]

		let index = 0
		map.forEach((folder) => {
			folder.gradientClass = gradientClasses[index % gradientClasses.length]
			folder.formattedSize = formatBytes(folder.totalSize)

			// Calculate date range from media files
			const dates = folder.mediaFiles
				.map(f => f.modifiedByMeTime ? new Date(f.modifiedByMeTime).getTime() : 0)
				.filter(d => d > 0)
				.sort((a, b) => a - b)

			folder.dateRange = dates.length > 0
				? `${new Date(dates[0]).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${new Date(dates[dates.length - 1]).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
				: 'No dates'

			index++
		})

		return map
	}, [allFolders, mediaFiles])

	// Get child folders for current level
	const currentLevelFolders = useMemo(() => {
		const currentFolder = folderHierarchy.get(currentLevelId)
		if (!currentFolder) return []

		// Get direct children folder IDs
		const childFolderIds = currentFolder.childFolderIds
		const folders = childFolderIds
			.map(id => folderHierarchy.get(id))
			.filter((f): f is FolderNode => f !== undefined)
			.sort((a, b) => b.mediaFiles.length - a.mediaFiles.length)

		if (!searchTerm) return folders

		return folders.filter(f =>
			f.name.toLowerCase().includes(searchTerm.toLowerCase())
		)
	}, [folderHierarchy, currentLevelId, searchTerm])

	const handleFolderClick = (folder: FolderNode) => {
		setCurrentLevelId(folder.id)
		setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }])
	}

	const handleBreadcrumbClick = (id: string) => {
		const index = breadcrumb.findIndex(b => b.id === id)
		if (index !== -1) {
			setCurrentLevelId(id)
			setBreadcrumb(breadcrumb.slice(0, index + 1))
		}
	}

	const getCardSize = (mediaCount: number): string => {
		if (mediaCount >= 100) return 'large'
		if (mediaCount >= 50) return 'medium'
		return 'small'
	}

	const getAnimationDelay = (index: number): string => {
		return `${index * 0.05}s`
	}

	if (isLoading || isLoadingFolders) return <AlertLoading />

	return (
		<section className="folders-container">
			<div className="folders-hero">
				<h1 className="folders-main-title">
					<i className="bi bi-folder-fill"></i>
					Folder Hierarchy
				</h1>
				<p className="folders-subtitle">
					Navigate your media by folder structure
				</p>

				{/* Breadcrumb */}
				<div className="folders-breadcrumb">
					{breadcrumb.map((crumb, index) => (
						<span key={crumb.id}>
							<button
								className={`breadcrumb-item ${index === breadcrumb.length - 1 ? 'active' : ''}`}
								onClick={() => handleBreadcrumbClick(crumb.id)}
								disabled={index === breadcrumb.length - 1}
							>
								{crumb.name}
							</button>
							{index < breadcrumb.length - 1 && (
								<i className="bi bi-chevron-right breadcrumb-separator"></i>
							)}
						</span>
					))}
				</div>

				<div className="folders-search">
					<i className="bi bi-search search-icon"></i>
					<input
						type="text"
						className="search-input"
						placeholder="Search folders..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>

				<div className="folders-stats">
					<div className="stat-card">
						<div className="stat-icon purple">
							<i className="bi bi-folder"></i>
						</div>
						<div className="stat-content">
							<div className="stat-value">{currentLevelFolders.length}</div>
							<div className="stat-label">Subfolders</div>
						</div>
					</div>
					<div className="stat-card">
						<div className="stat-icon blue">
							<i className="bi bi-file-earmark-image"></i>
						</div>
						<div className="stat-content">
							<div className="stat-value">
								{currentLevelFolders.reduce((sum, f) => sum + f.mediaFiles.length, 0)}
							</div>
							<div className="stat-label">Files in Subfolders</div>
						</div>
					</div>
					<div className="stat-card">
						<div className="stat-icon green">
							<i className="bi bi-hdd"></i>
						</div>
						<div className="stat-content">
							<div className="stat-value">
								{formatBytes(currentLevelFolders.reduce((sum, f) => sum + f.totalSize, 0))}
							</div>
							<div className="stat-label">Total Storage</div>
						</div>
					</div>
				</div>
			</div>

			{currentLevelFolders.length === 0 ? (
				<div className="no-folders">
					<i className="bi bi-inbox"></i>
					<h3>No folders found</h3>
					<p>Try adjusting your search or check your media files</p>
				</div>
			) : (
				<div className="folders-grid">
					{currentLevelFolders.map((folder, index) => (
						<div
							key={folder.id}
							className={`folder-card ${getCardSize(folder.mediaFiles.length)} ${folder.gradientClass}`}
							style={{
								animationDelay: getAnimationDelay(index)
							}}
							onClick={() => handleFolderClick(folder)}
						>
							<div className="folder-card-content">
								<div className="folder-header-row">
									<div className="folder-icon">
										{folder.mediaFiles.length}
									</div>
									<h3 className="folder-name">{folder.name}</h3>
								</div>
								<div className="folder-stats">
									<div className="stat-row">
										<i className="bi bi-calendar-range"></i>
										<span>{folder.dateRange}</span>
									</div>
									<div className="stat-row">
										<i className="bi bi-hdd"></i>
										<span>{folder.formattedSize}</span>
									</div>
									<div className="stat-row file-types">
										{folder.imageCount > 0 && (
											<span className="type-badge">
												<i className="bi bi-image"></i> {folder.imageCount}
											</span>
										)}
										{folder.videoCount > 0 && (
											<span className="type-badge">
												<i className="bi bi-camera-video"></i> {folder.videoCount}
											</span>
										)}
									</div>
								</div>
							</div>
							<div className="folder-overlay">
								<span className="view-text">
									<i className="bi bi-eye"></i>
									View Folder
								</span>
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	)
}

export default Folders
