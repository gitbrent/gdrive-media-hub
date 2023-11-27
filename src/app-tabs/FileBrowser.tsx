import React, { useEffect, useState } from 'react'
import { BreadcrumbSegment, IGapiFile, IGapiFolder } from '../App.props'
import { fetchFolderContents, fetchWithTokenRefresh, getRootFolderId } from '../api/FolderService'
import AlertLoading from '../components/AlertLoading'
import Breadcrumbs from '../components/Breadcrumbs'
import FileBrowserListView from '../components/FileBrowserListView'
import FileBrowserGridView from '../components/FileBrowserGridView'
import '../css/FileBrowser.css'

interface Props {
	isBusyGapiLoad: boolean
}

type ViewMode = 'grid' | 'list'

const FileBrowser: React.FC<Props> = ({ isBusyGapiLoad }) => {
	const [origFolderContents, setOrigFolderContents] = useState<Array<IGapiFile | IGapiFolder>>([])
	const [currFolderContents, setCurrFolderContents] = useState<Array<IGapiFile | IGapiFolder>>([])
	const [currentFolderPath, setCurrentFolderPath] = useState<BreadcrumbSegment[]>([])
	const [optSchWord, setOptSchWord] = useState('')
	const [viewMode, setViewMode] = useState<ViewMode>('list')
	const [isFolderLoading, setIsFolderLoading] = useState(false)

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
								{currFolderContents.filter(item => item.mimeType.indexOf('folder') > -1).length}
								<i className="bi-folder-fill ms-2" />
							</span>
							<span className='text-nowrap text-info ms-3'>
								{currFolderContents.filter(item => item.mimeType.indexOf('image') > -1).length}
								<i className="bi-image-fill ms-2" />
							</span>
							<span className='text-nowrap text-warning ms-3'>
								{currFolderContents.filter(item => item.mimeType.indexOf('video') > -1).length}
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
				<div className='row align-items-center fs-5 mb-2'>
					<div className='col'>
						<Breadcrumbs path={currentFolderPath} onNavigate={handleBreadcrumbClick} />
					</div>
					<div className='col-auto'>
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
					? <FileBrowserGridView
						origFolderContents={origFolderContents}
						currFolderContents={currFolderContents}
						isFolderLoading={isFolderLoading}
						setCurrFolderContents={setCurrFolderContents}
						handleFolderClick={handleFolderClick}
						optSchWord={optSchWord}
					/>
					: <FileBrowserListView
						origFolderContents={origFolderContents}
						currFolderContents={currFolderContents}
						isFolderLoading={isFolderLoading}
						handleFolderClick={handleFolderClick}
						setCurrFolderContents={setCurrFolderContents}
						optSchWord={optSchWord}
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
