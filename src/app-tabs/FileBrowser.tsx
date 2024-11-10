import { useContext, useEffect, useState } from 'react'
import { BreadcrumbSegment, IGapiFile, IGapiFolder, IMediaFile } from '../App.props'
import { isFolder, isGif, isImage, isVideo } from '../utils/mimeTypes'
import FileBrowViewList from '../components/FileBrowViewList'
import GridView from '../components/GridView'
import AlertLoading from '../components/AlertLoading'
import Breadcrumbs from '../components/Breadcrumbs'
import '../css/FileBrowser.css'
// WIP: BELOW:
import { fetchFolderContents, fetchWithTokenRefresh, getRootFolderId, releaseAllBlobUrls } from '../api' // WIP: REMOVE
import { DataContext } from '../api-google/DataContext'

type ViewMode = 'grid' | 'list'
type SortField = 'name' | 'size' | 'modifiedByMeTime';
type SortOrder = 'asc' | 'desc';

const FileBrowser: React.FC = () => {
	const [origFolderContents, setOrigFolderContents] = useState<Array<IGapiFile | IGapiFolder>>([])
	const [currFolderContents, setCurrFolderContents] = useState<Array<IGapiFile | IGapiFolder>>([])
	const [currentFolderPath, setCurrentFolderPath] = useState<BreadcrumbSegment[]>([])
	const [optSchWord, setOptSchWord] = useState('')
	const [isGlobalSearch, setIsGlobalSearch] = useState(false)
	const [isFolderLoading, setIsFolderLoading] = useState(false)
	const [viewMode, setViewMode] = useState<ViewMode>('list')
	const [sortField, setSortField] = useState<SortField>('name')
	const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
	//
	const { mediaFiles, isLoading } = useContext(DataContext);

	// --------------------------------------------------------------------------------------------

	/**
	 * Fetch root folder contents on mount
	 */
	useEffect(() => {
		const loadRootFolder = async () => {
			const rootFolderId = await getRootFolderId() || ''
			const rootContents = await fetchWithTokenRefresh(rootFolderId)
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
			const contents = await fetchWithTokenRefresh(folderId)
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

		const sourceItems = isGlobalSearch && optSchWord ? [...mediaFiles] : [...origFolderContents]

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

		// Filter results
		const filteredContents = sortedContents.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
		if (currFolderContents[0]) console.log('currFolderContents:', currFolderContents[0])

		setCurrFolderContents(filteredContents)
	}, [mediaFiles, origFolderContents, isGlobalSearch, optSchWord, sortField, sortOrder])

	const toggleSortOrder = (field: SortField) => {
		setSortField(field)
		setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'))
	}

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar mb-3">
				<form className="container-fluid px-0">
					<div className="row w-100 align-items-center justify-content-between">
						<div className="col-4 col-md-auto">
							<div className="btn-group" role="group" aria-label="view switcher">
								<button
									type="button"
									className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
									aria-label="list view"
									onClick={() => setViewMode('list')}>
									<i className="bi-card-list me-2" />List
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
									aria-label="grid view"
									onClick={() => setViewMode('grid')}>
									<i className="bi-grid me-2" />Grid
								</button>
							</div>
						</div>
						<div className="col-8 col-md-auto">
							<div className="btn-group" role="group" aria-label="sort options">
								<button type="button" aria-label="sort by name"
									className={`btn btn-outline-secondary text-nowrap ${sortField === 'name' ? 'active' : ''}`}
									onClick={() => toggleSortOrder('name')}>
									Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
								</button>
								<button type="button" aria-label="sort by size"
									className={`btn btn-outline-secondary text-nowrap ${sortField === 'size' ? 'active' : ''}`}
									onClick={() => toggleSortOrder('size')}>
									Size {sortField === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
								</button>
								<button type="button" aria-label="sort by modified"
									className={`btn btn-outline-secondary text-nowrap ${sortField === 'modifiedByMeTime' ? 'active' : ''}`}
									onClick={() => toggleSortOrder('modifiedByMeTime')}>
									Modified {sortField === 'modifiedByMeTime' && (sortOrder === 'asc' ? '↑' : '↓')}
								</button>
							</div>
						</div>
						<div className="col-12 col-md">
							<div className="input-group">
								<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
								<div className="input-group-text">
									<input className="form-check-input mt-0" type="checkbox" id="globalSearchCheck" value="" checked={isGlobalSearch} onChange={(ev) => setIsGlobalSearch(ev.currentTarget.checked)} aria-label="Checkbox for global search" />
									<label className="form-check-label ms-2 text-white-50 nouserselect" htmlFor="globalSearchCheck">Global</label>
								</div>
								<input type="search" className="form-control" placeholder="Search" aria-label="Search" aria-describedby="grp-search" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
							</div>
						</div>
						<div className="col-12 col-md-auto text-center h4 fw-light mb-0">
							<span className="text-nowrap text-success">
								{currFolderContents.filter(item => isFolder(item)).length}
								<i className="bi-folder-fill ms-2" />
							</span>
							<span className="text-nowrap text-info ms-3">
								{currFolderContents.filter(item => isImage(item)).length}
								<i className="bi-image-fill ms-2" />
							</span>
							<span className="text-nowrap text-warning ms-3">
								{currFolderContents.filter(item => isGif(item)).length}
								<i className="bi-play-circle-fill ms-2" />
							</span>
							<span className="text-nowrap text-warning ms-3">
								{currFolderContents.filter(item => isVideo(item)).length}
								<i className="bi-play-btn-fill ms-2" />
							</span>
						</div>
					</div>
				</form>
			</nav>
		)
	}

	function renderBrowser(): JSX.Element {
		return (
			<section>
				<Breadcrumbs path={currentFolderPath} onNavigate={handleBreadcrumbClick} className="pb-2" />
				{viewMode === 'grid' ?
					<section className="bg-black h-100">
						<GridView
							currFolderContents={currFolderContents}
							isFolderLoading={isFolderLoading}
							handleFolderClick={handleFolderClick}
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
			{isLoading ? <AlertLoading /> : renderBrowser()}
		</section>
	)
}

export default FileBrowser
