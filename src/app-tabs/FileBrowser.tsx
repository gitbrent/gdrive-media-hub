import React, { useEffect, useState } from 'react'
import { BreadcrumbSegment, IGapiFile, IGapiFolder } from '../App.props'
import { fetchFolderContents, fetchWithTokenRefresh, getRootFolderId } from '../api/FolderService'
import { isFolder, isImage, isVideo } from '../utils/mimeTypes'
import FileBrowViewList from '../components/FileBrowViewList'
import FileBrowViewGrid from '../components/FileBrowViewGrid'
import AlertLoading from '../components/AlertLoading'
import Breadcrumbs from '../components/Breadcrumbs'
import '../css/FileBrowser.css'

interface Props {
	isBusyGapiLoad: boolean
}

type ViewMode = 'grid' | 'list'
type SortField = 'name' | 'size' | 'modifiedByMeTime';
type SortOrder = 'asc' | 'desc';

const FileBrowser: React.FC<Props> = ({ isBusyGapiLoad }) => {
	const [origFolderContents, setOrigFolderContents] = useState<Array<IGapiFile | IGapiFolder>>([])
	const [currFolderContents, setCurrFolderContents] = useState<Array<IGapiFile | IGapiFolder>>([])
	const [currentFolderPath, setCurrentFolderPath] = useState<BreadcrumbSegment[]>([])
	const [optSchWord, setOptSchWord] = useState('')
	const [isFolderLoading, setIsFolderLoading] = useState(false)
	const [viewMode, setViewMode] = useState<ViewMode>('list')
	const [sortField, setSortField] = useState<SortField>('name')
	const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

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
		} catch (err: any) {
			console.error('Error fetching folder contents:', err)
			console.error(err.status)
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

		const sortedContents = [...origFolderContents].sort((a: ICommonFileFolderProperties, b: ICommonFileFolderProperties) => {
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
		setCurrFolderContents(
			sortedContents.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
		)
	}, [origFolderContents, optSchWord, sortField, sortOrder])

	const toggleSortOrder = (field: SortField) => {
		setSortField(field)
		setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'))
	}

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar sticky-top bg-dark">
				<div className="container-fluid">
					<div className="row align-items-center w-100">
						<div className="col d-none d-lg-block">
							<a className="navbar-brand me-0 text-white">File Browser</a>
						</div>
						<div className="col-12 col-md">
							<div className="input-group">
								<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
								<input type="search" placeholder="Search" aria-label="Search" aria-describedby="grp-search" className="form-control" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
							</div>
						</div>
						<div className="col-12 col-md-auto h4 mb-0 mt-2 mt-md-0 text-center">
							<span className='text-nowrap text-success'>
								{currFolderContents.filter(item => isFolder(item)).length}
								<i className="bi-folder-fill ms-2" />
							</span>
							<span className='text-nowrap text-info ms-3'>
								{currFolderContents.filter(item => isImage(item)).length}
								<i className="bi-image-fill ms-2" />
							</span>
							<span className='text-nowrap text-warning ms-3'>
								{currFolderContents.filter(item => isVideo(item)).length}
								<i className="bi-camera-video-fill ms-2" />
							</span>
						</div>
					</div>
				</div>
			</nav>
		)
	}

	function renderBrowser(): JSX.Element {
		return (
			<section className="p-4">
				<div className="row align-items-center fs-5 mb-2">
					<div className='col'>
						<Breadcrumbs path={currentFolderPath} onNavigate={handleBreadcrumbClick} />
					</div>
					<div className='col-12 col-md-auto'>
						<div className="btn-group" role="group" aria-label="sort options">
							<button
								type="button"
								className={`btn ${sortField === 'name' ? 'btn-secondary' : 'btn-gray'}`}
								aria-label="list view"
								onClick={() => toggleSortOrder('name')}
							>
								Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
							</button>
							<button
								type="button"
								className={`btn ${sortField === 'size' ? 'btn-secondary' : 'btn-gray'}`}
								aria-label="list view"
								onClick={() => toggleSortOrder('size')}
							>
								Size {sortField === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
							</button>
							<button
								type="button"
								className={`btn ${sortField === 'modifiedByMeTime' ? 'btn-secondary' : 'btn-gray'}`}
								aria-label="list view"
								onClick={() => toggleSortOrder('modifiedByMeTime')}
							>
								Modified {sortField === 'modifiedByMeTime' && (sortOrder === 'asc' ? '↑' : '↓')}
							</button>
						</div>
					</div>
					<div className='col-12 col-md-auto'>
						<div className="btn-group" role="group" aria-label="view switcher">
							<button
								type="button"
								className={`btn ${viewMode === 'list' ? 'btn-secondary' : 'btn-gray'}`}
								aria-label="list view"
								onClick={() => setViewMode('list')}
							>
								<i className="bi-card-list" />
							</button>
							<button
								type="button"
								className={`btn ${viewMode === 'grid' ? 'btn-secondary' : 'btn-gray'}`}
								aria-label="grid view"
								onClick={() => setViewMode('grid')}
							>
								<i className="bi-grid" />
							</button>
						</div>
					</div>
				</div>
				{viewMode === 'grid'
					? <FileBrowViewGrid
						currFolderContents={currFolderContents}
						isFolderLoading={isFolderLoading}
						handleFolderClick={handleFolderClick}
					/>
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
			{isBusyGapiLoad ? <AlertLoading /> : renderBrowser()}
		</section>
	)
}

export default FileBrowser
