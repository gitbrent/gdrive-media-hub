import { useContext, useEffect, useState } from 'react'
import { BreadcrumbSegment, DEBUG, IGapiFile, IGapiFolder, LOG_LEVEL } from '../App.props'
import { isFolder, isGif, isImage, isVideo } from '../utils/mimeTypes'
import { getRootFolderId, fetchFolderContents } from '../api-google'
import { DataContext } from '../api-google/DataContext'
import FileBrowViewList from '../components/FileBrowViewList'
import AlertLoading from '../components/AlertLoading'
import Breadcrumbs from '../components/Breadcrumbs'
import GridView from '../components/GridView'
import '../css/FileBrowser.css'

type ViewMode = 'grid' | 'list'
type SortField = 'name' | 'size' | 'modifiedByMeTime'
type SortOrder = 'asc' | 'desc'
type MediaType = 'all' | 'image' | 'gif' | 'video'

const FileBrowser: React.FC = () => {
	const { mediaFiles, isLoading, releaseAllBlobUrls } = useContext(DataContext)
	//
	const [origFolderContents, setOrigFolderContents] = useState<Array<IGapiFile | IGapiFolder>>([])
	const [currFolderContents, setCurrFolderContents] = useState<Array<IGapiFile | IGapiFolder>>([])
	const [currentFolderPath, setCurrentFolderPath] = useState<BreadcrumbSegment[]>([])
	const [optSchWord, setOptSchWord] = useState('')
	const [isRecursiveSearch, setIsRecursiveSearch] = useState(false)
	const [isFolderLoading, setIsFolderLoading] = useState(false)
	const [viewMode, setViewMode] = useState<ViewMode>('list')
	const [sortField, setSortField] = useState<SortField>('name')
	const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
	const [tileSize, setTileSize] = useState<'small' | 'medium' | 'large'>('medium')
	const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaType>('all')
	const [hasRootAccess, setHasRootAccess] = useState(true)
	const [debugInfo, setDebugInfo] = useState<{
		currentFolderId: string;
		descendantFolderCount: number;
		sourceItemCount: number;
		afterRecursiveFilter: number;
		afterNameFilter: number;
		filesWithParents: number;
		filesWithoutParents: number;
	}>({ currentFolderId: '', descendantFolderCount: 0, sourceItemCount: 0, afterRecursiveFilter: 0, afterNameFilter: 0, filesWithParents: 0, filesWithoutParents: 0 })

	// --------------------------------------------------------------------------------------------

	/**
	 * Fetch root folder contents on mount, or fallback to flat file list if root access denied
	 */
	useEffect(() => {
		const loadRootFolder = async () => {
			const rootFolderId = await getRootFolderId()
			if (!rootFolderId) {
				console.warn('Root folder ID not found - using flat file view')
				setHasRootAccess(false)
				setCurrentFolderPath([{ folderName: 'My Files', folderId: 'flat-view' }])
				// Files will be populated from mediaFiles via the sorting effect
				return
			}
			const rootContents = await fetchFolderContents(rootFolderId)
			setCurrentFolderPath([{ folderName: 'My Drive', folderId: rootFolderId }])
			setCurrFolderContents(rootContents.items)
			setOrigFolderContents(rootContents.items)
			setHasRootAccess(true)
		}
		loadRootFolder()
	}, [])

	/**
	 * Prevent memory leaks by freeing the contentUrls
	 */
	useEffect(() => {
		// Define a function that handles the visibility change event
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				releaseAllBlobUrls()
			}
		}

		// Add event listeners when the component mounts
		window.addEventListener('pagehide', releaseAllBlobUrls)
		window.addEventListener('visibilitychange', handleVisibilityChange)

		// Return a cleanup function from the useEffect hook
		return () => {
			// Remove event listeners when the component unmounts or before re-running the effect
			window.removeEventListener('pagehide', releaseAllBlobUrls)
			window.removeEventListener('visibilitychange', handleVisibilityChange)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// --------------------------------------------------------------------------------------------

	const handleBreadcrumbClick = async (pathIndex: number, folderId: string) => {
		// A: Fetch the contents of the clicked folder
		const contents = await fetchFolderContents(folderId)
		setOrigFolderContents(contents.items)
		setCurrFolderContents(contents.items)

		// B: Truncate the breadcrumb path
		// NOTE: Do this second as new currFolderPath triggers re-sort and we want contents to be set prior to sorting
		const newPath = currentFolderPath.slice(0, pathIndex + 1)
		setCurrentFolderPath(newPath)

		// C: Clear filter
		setOptSchWord('')
	}

	const handleFolderClick = async (folderId: string, folderName: string) => {
		if (isFolderLoading) return // Prevent further clicks if already loading a folder
		setIsFolderLoading(true)

		try {
			const contents = await fetchFolderContents(folderId)
			setOrigFolderContents(contents.items)
			setCurrFolderContents(contents.items)
			setCurrentFolderPath([...currentFolderPath, { folderName: folderName, folderId: folderId }])
		} catch (err) {
			console.error('Error fetching folder contents:', err)
		}

		setIsFolderLoading(false)
	}

	useEffect(() => {
		interface ICommonFileFolderProperties {
			name: string;
			size?: string;
			modifiedByMeTime: string;
			mimeType: string;
		}

		/**
		 * Get all descendant folder IDs from a starting folder (recursively)
		 */
		const getDescendantFolderIds = (startFolderId: string): Set<string> => {
			const descendantIds = new Set<string>([startFolderId])
			const foldersToProcess = [startFolderId]

			while (foldersToProcess.length > 0) {
				const currentFolderId = foldersToProcess.shift()!

				// Find all folders that have currentFolderId as a parent
				const childFolders = mediaFiles.filter(file =>
					isFolder(file) &&
					file.parents?.includes(currentFolderId)
				)

				childFolders.forEach(folder => {
					if (!descendantIds.has(folder.id)) {
						descendantIds.add(folder.id)
						foldersToProcess.push(folder.id)
					}
				})
			}

			return descendantIds
		}

		// If no root access, always use mediaFiles; otherwise use origFolderContents unless recursive search
		let sourceItems = !hasRootAccess ? [...mediaFiles]
			: (isRecursiveSearch && optSchWord ? [...mediaFiles] : [...origFolderContents])

		const sourceItemCount = sourceItems.length
		let descendantFolderIds: Set<string> | null = null
		let currentFolderId = ''

		// Calculate descendant folders for debug info (always when we have root access)
		if (hasRootAccess && currentFolderPath.length > 0) {
			currentFolderId = currentFolderPath[currentFolderPath.length - 1].folderId
			descendantFolderIds = getDescendantFolderIds(currentFolderId)

			// Also count immediate child folders from origFolderContents (since mediaFiles may not have folders)
			const immediateFolders = origFolderContents.filter(item => isFolder(item))
			immediateFolders.forEach(folder => {
				descendantFolderIds!.add(folder.id)
			})
		}

		// Filter for recursive search: only show files in current folder or its descendants
		if (isRecursiveSearch && hasRootAccess && optSchWord && currentFolderPath.length > 0 && descendantFolderIds) {
			sourceItems = sourceItems.filter(item =>
				item.parents?.some(parentId => descendantFolderIds!.has(parentId))
			)
		}

		const afterRecursiveFilter = sourceItems.length

		const sortedContents = sourceItems.sort((a: ICommonFileFolderProperties, b: ICommonFileFolderProperties) => {
			const isFolderA = a.mimeType === 'application/vnd.google-apps.folder'
			const isFolderB = b.mimeType === 'application/vnd.google-apps.folder'
			if (isFolderA && !isFolderB) {
				return -1
			}
			if (!isFolderA && isFolderB) {
				return 1
			}
			// If both are folders or both are not folders, then sort based on the sortField and sortOrder
			if (sortField === 'name' || sortField === 'modifiedByMeTime') {
				const fieldA = a[sortField] || ''
				const fieldB = b[sortField] || ''
				return sortOrder === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
			}
			if (sortField === 'size') {
				const sizeA = Number(a[sortField] || 0)
				const sizeB = Number(b[sortField] || 0)
				return sortOrder === 'asc' ? sizeA - sizeB : sizeB - sizeA
			}
			return 0
		})

		// Filter results - first by media type, then by search word
		const filteredContents = sortedContents
			.filter((item) => {
				// Always show folders
				if (isFolder(item)) return true
				// Apply media type filter
				if (mediaTypeFilter === 'all') return true
				if (mediaTypeFilter === 'image') return isImage(item)
				if (mediaTypeFilter === 'gif') return isGif(item)
				if (mediaTypeFilter === 'video') return isVideo(item)
				return false
			})
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })

		// Update debug info
		const filesWithParents = mediaFiles.filter(f => f.parents && f.parents.length > 0).length
		const filesWithoutParents = mediaFiles.filter(f => !f.parents || f.parents.length === 0).length
		setDebugInfo({
			currentFolderId,
			descendantFolderCount: descendantFolderIds ? descendantFolderIds.size : 0,
			sourceItemCount,
			afterRecursiveFilter,
			afterNameFilter: filteredContents.length,
			filesWithParents,
			filesWithoutParents
		})

		setCurrFolderContents(filteredContents)
	}, [
		mediaFiles, origFolderContents, isRecursiveSearch, optSchWord, sortField,
		sortOrder, hasRootAccess, currentFolderPath, mediaTypeFilter
	])

	const toggleSortOrder = (field: SortField) => {
		setSortField(field)
		setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'))
	}

	// --------------------------------------------------------------------------------------------

	function renderSearchResultsInfo(): JSX.Element {
		return (
			<>
				{DEBUG && LOG_LEVEL === 3 && (
					<div className="mb-3" style={{
						background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)',
						borderRadius: '16px',
						padding: '20px',
						boxShadow: '0 8px 32px rgba(109, 40, 217, 0.4)',
						border: '1px solid rgba(139, 92, 246, 0.2)'
					}}>
						<div className="d-flex align-items-center mb-3">
							<div style={{
								background: 'rgba(255, 255, 255, 0.2)',
								borderRadius: '12px',
								padding: '8px 12px',
								backdropFilter: 'blur(10px)'
							}}>
								<i className="bi-bug-fill me-2" style={{ color: '#fff' }}></i>
								<strong style={{ color: '#fff', fontSize: '1.1rem' }}>Debug Dashboard</strong>
							</div>
						</div>
						<div className="row g-3">
							<div className="col-md-4 col-sm-6">
								<div style={{
									background: 'rgba(255, 255, 255, 0.15)',
									borderRadius: '12px',
									padding: '12px',
									backdropFilter: 'blur(10px)',
									border: '1px solid rgba(255, 255, 255, 0.2)',
									transition: 'transform 0.2s',
									cursor: 'pointer'
								}} className="hover-lift">
									<div className="d-flex align-items-center justify-content-between">
										<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>Recursive Search</span>
										<span className="badge" style={{
											background: isRecursiveSearch ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'rgba(255, 255, 255, 0.2)',
											padding: '6px 12px',
											fontSize: '0.75rem'
										}}>{isRecursiveSearch ? 'ON' : 'OFF'}</span>
									</div>
								</div>
							</div>
							<div className="col-md-4 col-sm-6">
								<div style={{
									background: 'rgba(255, 255, 255, 0.15)',
									borderRadius: '12px',
									padding: '12px',
									backdropFilter: 'blur(10px)',
									border: '1px solid rgba(255, 255, 255, 0.2)'
								}}>
									<div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem', marginBottom: '6px' }}>Search Word</div>
									<div style={{ color: '#fff', fontWeight: '600' }}>{optSchWord || '(none)'}</div>
								</div>
							</div>
							<div className="col-md-4 col-sm-6">
								<div style={{
									background: 'rgba(255, 255, 255, 0.15)',
									borderRadius: '12px',
									padding: '12px',
									backdropFilter: 'blur(10px)',
									border: '1px solid rgba(255, 255, 255, 0.2)'
								}}>
									<div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem', marginBottom: '6px' }}>Descendant Folders</div>
									<div className="d-flex align-items-center">
										<i className="bi-folder2-open me-2" style={{ color: '#ffd700', fontSize: '1.2rem' }}></i>
										<span style={{ color: '#fff', fontWeight: '700', fontSize: '1.3rem' }}>{debugInfo.descendantFolderCount}</span>
									</div>
								</div>
							</div>
							<div className="col-md-4 col-sm-6">
								<div style={{
									background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
									borderRadius: '12px',
									padding: '12px',
									backdropFilter: 'blur(10px)',
									border: '1px solid rgba(59, 130, 246, 0.3)',
									boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
								}}>
									<div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.85rem', marginBottom: '6px' }}>Total Media Files</div>
									<div className="d-flex align-items-center">
										<i className="bi-collection-play-fill me-2" style={{ color: '#60a5fa', fontSize: '1.2rem' }}></i>
										<span style={{ color: '#fff', fontWeight: '700', fontSize: '1.3rem' }}>{mediaFiles.length}</span>
									</div>
								</div>
							</div>
							<div className="col-md-4 col-sm-6">
								<div style={{
									background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
									borderRadius: '12px',
									padding: '12px',
									backdropFilter: 'blur(10px)',
									border: '1px solid rgba(16, 185, 129, 0.3)',
									boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
								}}>
									<div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.85rem', marginBottom: '6px' }}>With Parents</div>
									<div className="d-flex align-items-center">
										<i className="bi-check-circle-fill me-2" style={{ color: '#34d399', fontSize: '1.2rem' }}></i>
										<span style={{ color: '#fff', fontWeight: '700', fontSize: '1.3rem' }}>{debugInfo.filesWithParents}</span>
									</div>
								</div>
							</div>
							<div className="col-md-4 col-sm-6">
								<div style={{
									background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
									borderRadius: '12px',
									padding: '12px',
									backdropFilter: 'blur(10px)',
									border: '1px solid rgba(239, 68, 68, 0.3)',
									boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
								}}>
									<div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.85rem', marginBottom: '6px' }}>Without Parents</div>
									<div className="d-flex align-items-center">
										<i className="bi-x-circle-fill me-2" style={{ color: '#f87171', fontSize: '1.2rem' }}></i>
										<span style={{ color: '#fff', fontWeight: '700', fontSize: '1.3rem' }}>{debugInfo.filesWithoutParents}</span>
									</div>
								</div>
							</div>
							<div className="col-12">
								<div style={{
									background: 'rgba(255, 255, 255, 0.1)',
									borderRadius: '12px',
									padding: '12px',
									backdropFilter: 'blur(10px)',
									border: '1px solid rgba(255, 255, 255, 0.15)'
								}}>
									<div className="d-flex flex-wrap gap-3 align-items-center justify-content-around text-center">
										<div>
											<div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>Source Items</div>
											<div style={{ color: '#fff', fontWeight: '600', fontSize: '1.1rem' }}>{debugInfo.sourceItemCount}</div>
										</div>
										<i className="bi-arrow-right" style={{ color: 'rgba(255, 255, 255, 0.5)' }}></i>
										<div>
											<div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>After Recursive</div>
											<div style={{ color: '#fff', fontWeight: '600', fontSize: '1.1rem' }}>{debugInfo.afterRecursiveFilter}</div>
										</div>
										<i className="bi-arrow-right" style={{ color: 'rgba(255, 255, 255, 0.5)' }}></i>
										<div>
											<div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>After Name Filter</div>
											<div style={{ color: '#10b981', fontWeight: '700', fontSize: '1.2rem' }}>{debugInfo.afterNameFilter}</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
				{DEBUG && LOG_LEVEL !== 3 && (
					<div className="row g-3 mb-3">
						<div className="col">
							<div className="card border-0 shadow-lg kpi-card kpi-card-purple">
								<div className="card-body kpi-card-body">
									<div className="d-flex align-items-center justify-content-between">
										<div>
											<div className="text-white-50 text-uppercase small mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Total Files</div>
											<div className="text-white fw-bold kpi-title mb-0">{mediaFiles.length}</div>
										</div>
										<div className="kpi-icon-circle rounded-circle d-flex align-items-center justify-content-center">
											<i className="bi-images text-white kpi-icon"></i>
										</div>
									</div>
								</div>
								<i className="bi-images kpi-card-icon-bg"></i>
							</div>
						</div>
						<div className="col">
							<div className="card border-0 shadow-lg kpi-card kpi-card-green">
								<div className="card-body kpi-card-body">
									<div className="d-flex align-items-center justify-content-between">
										<div>
											<div className="text-white-50 text-uppercase small mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Shown</div>
											<div className="text-white fw-bold kpi-title mb-0">{debugInfo.afterNameFilter}</div>
										</div>
										<div className="kpi-icon-circle rounded-circle d-flex align-items-center justify-content-center">
											<i className="bi-funnel text-white kpi-icon"></i>
										</div>
									</div>
								</div>
								<i className="bi-funnel kpi-card-icon-bg"></i>
							</div>
						</div>
						{isRecursiveSearch && (
							<div className="col">
								<div className="card border-0 shadow-lg kpi-card kpi-card-blue">
									<div className="card-body kpi-card-body">
										<div className="d-flex align-items-center justify-content-between">
											<div>
												<div className="text-white-50 text-uppercase small mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Folders</div>
												<div className="text-white fw-bold kpi-title mb-0">{debugInfo.descendantFolderCount}</div>
											</div>
											<div className="kpi-icon-circle rounded-circle d-flex align-items-center justify-content-center">
												<i className="bi-folder text-white kpi-icon"></i>
											</div>
										</div>
									</div>
									<i className="bi-folder kpi-card-icon-bg"></i>
								</div>
							</div>
						)}
					</div>
				)}
			</>
		)
	}

	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar mb-3">
				<form className="container-fluid px-0">
					<div className="row w-100 align-items-center justify-content-between">
						<div className="col-12 col-md-auto">
							<div className="btn-group" role="group" aria-label="view switcher">
								<button
									type="button"
									className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
									aria-label="list view"
									onClick={() => setViewMode('list')}>
									<i className="bi-card-list" /><span className="ms-2 d-none d-lg-inline">List</span>
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
									aria-label="grid view"
									onClick={() => setViewMode('grid')}>
									<i className="bi-grid" /><span className="ms-2 d-none d-lg-inline">Grid</span>
								</button>
							</div>
						</div>
						{viewMode === 'grid' && (
							<div className="col-12 col-md-auto mt-2 mt-md-0">
								<div className="btn-group" role="group" aria-label="tile size options">
									<button type="button" aria-label="small tiles"
										className={`btn btn-outline-secondary text-nowrap ${tileSize === 'small' ? 'active' : ''}`}
										title="Small tiles"
										onClick={() => setTileSize('small')}>
										<i className="bi-grid-3x3-gap" />
									</button>
									<button type="button" aria-label="medium tiles"
										className={`btn btn-outline-secondary text-nowrap ${tileSize === 'medium' ? 'active' : ''}`}
										title="Medium tiles"
										onClick={() => setTileSize('medium')}>
										<i className="bi-grid" />
									</button>
									<button type="button" aria-label="large tiles"
										className={`btn btn-outline-secondary text-nowrap ${tileSize === 'large' ? 'active' : ''}`}
										title="Large tiles"
										onClick={() => setTileSize('large')}>
										<i className="bi-grid-1x2" />
									</button>
								</div>
							</div>
						)}
						<div className="col-12 col-md-auto mt-2 mt-md-0">
							<div className="btn-group" role="group" aria-label="sort options">
								<button type="button" aria-label="sort by name"
									className={`btn btn-outline-secondary text-nowrap ${sortField === 'name' ? 'active' : ''}`}
									onClick={() => toggleSortOrder('name')}>
									<i className="bi-alphabet-uppercase" /><span className="ms-2 d-none d-lg-inline">Name</span> {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
								</button>
								<button type="button" aria-label="sort by size"
									className={`btn btn-outline-secondary text-nowrap ${sortField === 'size' ? 'active' : ''}`}
									onClick={() => toggleSortOrder('size')}>
									<i className="bi-hdd" /><span className="ms-2 d-none d-lg-inline">Size</span> {sortField === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
								</button>
								<button type="button" aria-label="sort by modified"
									className={`btn btn-outline-secondary text-nowrap ${sortField === 'modifiedByMeTime' ? 'active' : ''}`}
									onClick={() => toggleSortOrder('modifiedByMeTime')}>
									<i className="bi-clock" /><span className="ms-2 d-none d-lg-inline">Modified</span> {sortField === 'modifiedByMeTime' && (sortOrder === 'asc' ? '↑' : '↓')}
								</button>
							</div>
						</div>
						<div className="col-12 col-md-auto mt-2 mt-md-0">
							<div className="btn-group" role="group" aria-label="media type filter">
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'all' ? 'active' : ''}`}
									title="show all"
									aria-label="show all"
									onClick={() => setMediaTypeFilter('all')}>
									<i className="bi-files" /><span className="ms-2 d-none d-lg-inline">All</span>
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'image' ? 'active' : ''}`}
									title="show images"
									aria-label="show images"
									onClick={() => setMediaTypeFilter('image')}>
									<i className="bi-image" /><span className="ms-2 d-none d-lg-inline">Image</span>
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'gif' ? 'active' : ''}`}
									title="show gifs"
									aria-label="show gifs"
									onClick={() => setMediaTypeFilter('gif')}>
									<i className="bi-play-btn" /><span className="ms-2 d-none d-lg-inline">GIF</span>
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'video' ? 'active' : ''}`}
									title="show videos"
									aria-label="show videos"
									onClick={() => setMediaTypeFilter('video')}>
									<i className="bi-camera-video" /><span className="ms-2 d-none d-lg-inline">Video</span>
								</button>
							</div>
						</div>
						<div className="col col-md mt-2 mt-md-0">
							<div className="input-group flex-nowrap">
								<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
								<div className="input-group-text">
									<input className="form-check-input mt-0" type="checkbox" id="recursiveSearchCheck" value="" checked={isRecursiveSearch} onChange={(ev) => setIsRecursiveSearch(ev.currentTarget.checked)} aria-label="Checkbox for recursive search" />
									<label className="form-check-label ms-2 text-white-50 nouserselect" htmlFor="recursiveSearchCheck">Recursive</label>
								</div>
								<input type="search" className="form-control" placeholder="Search" aria-label="Search" aria-describedby="grp-search" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
							</div>
						</div>
					</div>
				</form>
			</nav>
		)
	}

	function renderBrowser(): JSX.Element {
		return (
			<section>
				{!hasRootAccess && (
					<div className="alert alert-info mb-3" role="alert">
						<i className="bi-info-circle me-2"></i>
						Showing files created by this app. Full folder browsing requires additional permissions.
					</div>
				)}
				{hasRootAccess && (
					<div className='row align-items-center mb-2'>
						<div className='col'>
							<Breadcrumbs path={currentFolderPath} onNavigate={handleBreadcrumbClick} />
						</div>
						<div className='col-auto'>
							<div className="bg-dark-subtle rounded-3 px-3 py-2 d-flex align-items-center h-100">
								<span className="text-nowrap text-warning">
									{currFolderContents.filter(item => isFolder(item)).length}
									<i className="bi-folder-fill ms-2" />
								</span>
								<span className="text-nowrap text-success ms-3">
									{currFolderContents.filter(item => isImage(item)).length}
									<i className="bi-image ms-2" />
								</span>
								<span className="text-nowrap text-primary ms-3">
									{currFolderContents.filter(item => isGif(item)).length}
									<i className="bi-play-btn ms-2" />
								</span>
								<span className="text-nowrap text-info ms-3">
									{currFolderContents.filter(item => isVideo(item)).length}
									<i className="bi-camera-video ms-2" />
								</span>
							</div>
						</div>
					</div>
				)}
				{viewMode === 'grid' ?
					<section className="bg-black h-100">
						<GridView
							currFolderContents={currFolderContents}
							isFolderLoading={isFolderLoading}
							handleFolderClick={handleFolderClick}
							tileSize={tileSize}
						/>
					</section>
					: <FileBrowViewList
						currFolderContents={currFolderContents}
						isFolderLoading={isFolderLoading}
						handleFolderClick={handleFolderClick}
					/>
				}
			</section>
		)
	}

	return (
		<section>
			{renderTopBar()}
			{optSchWord && renderSearchResultsInfo()}
			{isLoading ? <AlertLoading /> : renderBrowser()}
		</section>
	)
}

export default FileBrowser
