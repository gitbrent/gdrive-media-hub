import { useContext, useEffect, useMemo, useState } from 'react'
import { BreadcrumbSegment, IFileAnalysis, IGapiFile, IGapiFolder } from '../App.props'
import { isFolder, isGif, isImage, isVideo } from '../utils/mimeTypes'
import { getRootFolderId, fetchFolderContents } from '../api-google'
import { DataContext } from '../api-google/DataContext'
import { getFileAnalysis } from '../api-google/utils/fileAnalysis'
import FileBrowViewList from '../components/FileBrowViewList'
import AlertLoading from '../components/AlertLoading'
import Breadcrumbs from '../components/Breadcrumbs'
import GridView from '../components/GridView'
import MetricCards from './MetricCards'

type ViewMode = 'grid' | 'list'
type SortField = 'name' | 'size' | 'createdTime' | 'modifiedByMeTime'
type SortOrder = 'asc' | 'desc'
type MediaType = 'all' | 'image' | 'gif' | 'video'
type TileSize = 'small' | 'medium' | 'large'

// --------------------------------------------------------------------------------------------
// Custom Hook: useFileAnalysis
// --------------------------------------------------------------------------------------------

const useFileAnalysis = (items: Array<IGapiFile | IGapiFolder>): IFileAnalysis => {
	return useMemo(() => {
		// Filter to only media files (exclude folders)
		const mediaItems = items.filter(item => !isFolder(item)) as IGapiFile[]
		return getFileAnalysis(mediaItems)
	}, [items])
}

// --------------------------------------------------------------------------------------------

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
	const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaType>('all')
	const [tileSize, setTileSize] = useState<TileSize>('medium')

	// Calculate analysis based on current folder contents
	const analysis = useFileAnalysis(currFolderContents)

	// --------------------------------------------------------------------------------------------

	/**
	 * Fetch root folder contents on mount, or fallback to flat file list if root access denied
	 */
	useEffect(() => {
		const loadRootFolder = async () => {
			const rootFolderId = await getRootFolderId()
			if (!rootFolderId) {
				console.warn('Root folder ID not found - using flat file view')
				setCurrentFolderPath([{ folderName: 'My Files', folderId: 'flat-view' }])
				// Files will be populated from mediaFiles via the sorting effect
				return
			}
			const rootContents = await fetchFolderContents(rootFolderId)
			setCurrentFolderPath([{ folderName: 'My Drive', folderId: rootFolderId }])
			setCurrFolderContents(rootContents.items)
			setOrigFolderContents(rootContents.items)
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
			createdTime?: string;
			mimeType: string;
		}

		/**
		 * Build a map of folder IDs to folder names for lineage lookup
		 */
		const buildFolderNameMap = (): Record<string, string> => {
			const map: Record<string, string> = {}
			const allFolders = [
				...mediaFiles.filter(file => isFolder(file)),
				...origFolderContents.filter(file => isFolder(file))
			]

			// Deduplicate by ID
			const uniqueFolders = allFolders.filter((folder, index, arr) =>
				arr.findIndex(f => f.id === folder.id) === index
			)

			uniqueFolders.forEach(folder => {
				map[folder.id] = folder.name
			})

			// Add "My Drive" or "My Files" as root
			if (currentFolderPath.length > 0) {
				map[currentFolderPath[0].folderId] = currentFolderPath[0].folderName
			}

			return map
		}

		/**
		 * Get the full lineage path for an item by traversing its parents array
		 */
		const getLineagePath = (item: IGapiFile | IGapiFolder): string => {
			const pathSegments: string[] = []

			const buildPath = (folderId: string, visited = new Set<string>()): void => {
				// Prevent infinite loops
				if (visited.has(folderId)) return
				visited.add(folderId)

				const folderName = folderNameMap[folderId]
				if (folderName) {
					pathSegments.unshift(folderName)
				}

				// Find the parent of this folder and recurse
				const allItems = [...mediaFiles, ...origFolderContents]
				const folderItem = allItems.find(f => f.id === folderId)
				if (folderItem?.parents && folderItem.parents.length > 0) {
					buildPath(folderItem.parents[0], visited)
				}
			}

			// Start with the item's parent(s)
			if (item.parents && item.parents.length > 0) {
				buildPath(item.parents[0])
			}

			return pathSegments.length > 0 ? pathSegments.join(' > ') : ''
		}

		/**
		 * Get all descendant folder IDs from a starting folder (recursively)
		 * Scans parents array to find folders at all levels
		 */
		const getDescendantFolderIds = (startFolderId: string): Set<string> => {
			const descendantIds = new Set<string>([startFolderId])
			const foldersToProcess = [startFolderId]

			while (foldersToProcess.length > 0) {
				const currentFolderId = foldersToProcess.shift()!

				// Find all folders that have currentFolderId as a parent (from mediaFiles)
				const childFoldersFromMedia = mediaFiles.filter(file =>
					isFolder(file) &&
					file.parents?.includes(currentFolderId)
				)

				// Also find folders from origFolderContents (for immediate children)
				const childFoldersFromOrig = origFolderContents.filter(file =>
					isFolder(file) &&
					file.parents?.includes(currentFolderId)
				)

				// Combine and deduplicate
				const allChildFolders = [...childFoldersFromMedia, ...childFoldersFromOrig]
				const uniqueChildFolders = allChildFolders.filter((folder, index, arr) =>
					arr.findIndex(f => f.id === folder.id) === index
				)

				uniqueChildFolders.forEach(folder => {
					if (!descendantIds.has(folder.id)) {
						descendantIds.add(folder.id)
						foldersToProcess.push(folder.id)
					}
				})
			}

			return descendantIds
		}

		// Build folder name map for lineage lookup
		const folderNameMap = buildFolderNameMap()

		// Use origFolderContents unless recursive search
		let sourceItems = isRecursiveSearch && optSchWord ? [...mediaFiles] : [...origFolderContents]

		let descendantFolderIds: Set<string> | null = null
		let currentFolderId = ''

		// Calculate descendant folders for debug info
		if (currentFolderPath.length > 0) {
			currentFolderId = currentFolderPath[currentFolderPath.length - 1].folderId
			descendantFolderIds = getDescendantFolderIds(currentFolderId)

			// Also count immediate child folders from origFolderContents (since mediaFiles may not have folders)
			const immediateFolders = origFolderContents.filter(item => isFolder(item))
			immediateFolders.forEach(folder => {
				descendantFolderIds!.add(folder.id)
			})
		}

		// Filter for recursive search: only show files in current folder or its descendants
		if (isRecursiveSearch && optSchWord && currentFolderPath.length > 0 && descendantFolderIds) {
			sourceItems = sourceItems.filter(item =>
				item.parents?.some(parentId => descendantFolderIds!.has(parentId))
			)
		}

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
			if (sortField === 'name' || sortField === 'modifiedByMeTime' || sortField === 'createdTime') {
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
			.map((item) => ({
				...item,
				_lineagePath: getLineagePath(item)
			} as (IGapiFile | IGapiFolder) & { _lineagePath?: string }))

		setCurrFolderContents(filteredContents)
	}, [
		mediaFiles, origFolderContents, isRecursiveSearch, optSchWord, sortField,
		sortOrder, currentFolderPath, mediaTypeFilter
	])

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		const isSearchActive = optSchWord.length > 0 || isRecursiveSearch;

		return (
			<div className="mb-6">
				<div className="flex flex-wrap gap-4 items-justify-center">
					{/* VIEW MODE SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">View</span>
						</label>
						<div className="join w-full">
							<button
								type="button"
								className={`btn btn-sm flex-1 ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setViewMode('list')}
								title="List View">
								<i className="bi-card-list" />
								<span className="hidden sm:inline">List</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setViewMode('grid')}
								title="Grid View">
								<i className="bi-grid" />
								<span className="hidden sm:inline">Grid</span>
							</button>
						</div>
					</div>

					{/* TILE SIZE SECTION - Show only in grid mode */}
					{viewMode === 'grid' && (
						<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
							<label className="label pb-1">
								<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Size</span>
							</label>
							<div className="join w-full">
								<button
									type="button"
									className={`btn btn-sm flex-1 ${tileSize === 'small' ? 'btn-primary' : 'btn-ghost'}`}
									onClick={() => setTileSize('small')}
									title="Small tiles">
									<i className="bi-grid-3x3-gap" />
								</button>
								<button
									type="button"
									className={`btn btn-sm flex-1 ${tileSize === 'medium' ? 'btn-primary' : 'btn-ghost'}`}
									onClick={() => setTileSize('medium')}
									title="Medium tiles">
									<i className="bi-grid" />
								</button>
								<button
									type="button"
									className={`btn btn-sm flex-1 ${tileSize === 'large' ? 'btn-primary' : 'btn-ghost'}`}
									onClick={() => setTileSize('large')}
									title="Large tiles">
									<i className="bi-grid-1x2" />
								</button>
							</div>
						</div>
					)}

					{/* FILTER SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Type</span>
						</label>
						<div className="join w-full">
							<button
								type="button"
								className={`btn btn-sm flex-1 ${mediaTypeFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setMediaTypeFilter('all')}
								title="Show all">
								<i className="bi-files" />
								<span className="hidden lg:inline">All</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${mediaTypeFilter === 'image' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setMediaTypeFilter('image')}
								title="Show images">
								<i className="bi-image" />
								<span className="hidden lg:inline">Image</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${mediaTypeFilter === 'gif' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setMediaTypeFilter('gif')}
								title="Show gifs">
								<i className="bi-play-btn" />
								<span className="hidden lg:inline">GIF</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${mediaTypeFilter === 'video' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setMediaTypeFilter('video')}
								title="Show videos">
								<i className="bi-camera-video" />
								<span className="hidden lg:inline">Video</span>
							</button>
						</div>
					</div>

					{/* SORT SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Sort</span>
						</label>
						<div className="join w-full">
							<button
								type="button"
								className={`btn btn-sm flex-1 ${sortField === 'name' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setSortField('name')}
								title="Sort by name">
								<i className="bi-sort-alpha-down" />
								<span className="hidden">Name</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${sortField === 'size' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setSortField('size')}
								title="Sort by size">
								<i className="bi-hdd-stack" />
								<span className="hidden">Size</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${sortField === 'createdTime' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setSortField('createdTime')}
								title="Sort by created date">
								<i className="bi-calendar-plus" />
								<span className="hidden">Created</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${sortField === 'modifiedByMeTime' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setSortField('modifiedByMeTime')}
								title="Sort by modified date">
								<i className="bi-clock" />
								<span className="hidden">Modified</span>
							</button>
							<button
								type="button"
								className="btn btn-sm bg-base-900"
								onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
								title={sortOrder === 'asc' ? 'Ascending (A → Z)' : 'Descending (Z → A)'}>
								<i className={`bi ${sortOrder === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down'}`} />
							</button>
						</div>
					</div>

					{/* SEARCH SECTION */}
					<div className="w-full sm:flex-1 sm:min-w-62.50 bg-base-100 rounded-xl p-2">
						<label className="label pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Search</span>
						</label>
						<div className="join w-full">
							<div className={`input input-sm input-bordered flex items-center gap-2 transition-all join-item grow ${isSearchActive ? 'input-primary ring-2 ring-primary/30' : ''}`}>
								<i className="bi-search"></i>
								<input
									type="search"
									className="grow bg-transparent outline-none"
									placeholder="Search files..."
									value={optSchWord}
									onChange={(ev) => setOptSchWord(ev.currentTarget.value)}
								/>
							</div>
							<select
								className="select select-sm select-bordered join-item w-auto"
								value={isRecursiveSearch ? 'all' : 'local'}
								onChange={(ev) => setIsRecursiveSearch(ev.currentTarget.value === 'all')}
								title="Search scope">
								<option value="local">Local</option>
								<option value="all">All</option>
							</select>
						</div>
					</div>
				</div>
			</div>
		)
	}

	function renderBrowser(): JSX.Element {
		return (
			<section>
				<div className='flex flex-col md:flex-row items-start md:items-center gap-3 mb-3'>
					<div className='flex-1'>
						<Breadcrumbs path={currentFolderPath} onNavigate={handleBreadcrumbClick} />
					</div>
					<div className='shrink-0'>
						<div className="bg-base-200 rounded-xl px-4 py-2 flex items-center gap-3 h-full shadow-sm">
							<span className="flex items-center gap-2 text-warning whitespace-nowrap">
								{currFolderContents.filter(item => isFolder(item)).length}
								<i className="bi-folder-fill" />
							</span>
							<span className="flex items-center gap-2 text-success whitespace-nowrap">
								{currFolderContents.filter(item => isImage(item)).length}
								<i className="bi-image" />
							</span>
							<span className="flex items-center gap-2 text-primary whitespace-nowrap">
								{currFolderContents.filter(item => isGif(item)).length}
								<i className="bi-play-btn" />
							</span>
							<span className="flex items-center gap-2 text-info whitespace-nowrap">
								{currFolderContents.filter(item => isVideo(item)).length}
								<i className="bi-camera-video" />
							</span>
						</div>
					</div>
				</div>
				{viewMode === 'grid' ?
					<section className="bg-black h-full">
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
			<MetricCards analysis={analysis} />
			{isLoading ? <AlertLoading /> : renderBrowser()}
		</section>
	)
}

export default FileBrowser
