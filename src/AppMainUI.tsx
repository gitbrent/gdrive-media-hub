import React, { useEffect, useMemo, useState } from 'react'
import { GridSizes, IGapiFile, IS_LOCALHOST, OPT_PAGESIZE, OPT_SORTBY, OPT_SORTDIR } from './App.props'
import { useAppMain } from './useAppMain'
import ImageSlideshow from './ImageSlideshow'
import ImageGrid from './ImageGrid'
import './css/AppMainUI.css'

export default function AppMainUI() {
	const { allFiles, authUserName, authUserPict, isBusyGapiLoad, handleAuthClick, handleSignOutClick, downloadFile, loadPageImages } = useAppMain()
	//
	const DEFAULT_SLIDE_DELAY = 4
	//
	const [pagingSize, setPagingSize] = useState(12)
	const [pagingPage, setPagingPage] = useState(0)
	const [optSortBy, setOptSortBy] = useState(OPT_SORTBY.modDate_full)
	const [optSortDir, setOptSortDir] = useState(OPT_SORTDIR.desc_full)
	const [optPgeSize, setOptPgeSize] = useState(OPT_PAGESIZE.ps12_full)
	const [optSchWord, setOptSchWord] = useState('')
	const [optIsSlideshow, setOptIsSlideshow] = useState(false)
	const [optIsShowCap, setOptIsShowCap] = useState(true)
	const [optSlideshowSecs, setOptSlideshowSecs] = useState(DEFAULT_SLIDE_DELAY)
	const [isSearching, setIsSearching] = useState(false)
	//
	const [gridFiles, setGridFiles] = useState<IGapiFile[]>([])
	//
	const [isSidebarOpen, setSidebarOpen] = useState(false)
	const toggleSidebar = () => {
		setSidebarOpen(!isSidebarOpen)
	}

	// --------------------------------------------------------------------------------------------

	const filteredFiles = useMemo(() => {
		setIsSearching(true)
		const results = allFiles.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
		setIsSearching(false)
		return results
	}, [allFiles, optSchWord])

	/**
	 * Initializes the Google API when the component mounts.
	 */
	useEffect(() => {
		if (IS_LOCALHOST) console.log('[AppMainUI] init!')
		if (allFiles.length > 0) setPagingPage(1)
	}, [allFiles])

	/**
	 * Updates the `pagingSize` state based on the selected `optPgeSize`.
	 */
	useEffect(() => {
		if (optPgeSize === OPT_PAGESIZE.ps08_full) setPagingSize(8)
		else if (optPgeSize === OPT_PAGESIZE.ps12_full) setPagingSize(12)
		else if (optPgeSize === OPT_PAGESIZE.ps24_full) setPagingSize(24)
		else if (optPgeSize === OPT_PAGESIZE.ps48_full) setPagingSize(48)
	}, [optPgeSize])

	/**
	 * Sets show files upon source images or option changes
	 */
	useEffect(() => {
		// A: define sorter
		const sorter = (a: IGapiFile, b: IGapiFile) => {
			if (optSortBy === OPT_SORTBY.filName_full) {
				return a.name < b.name ? (optSortDir === OPT_SORTDIR.asce_full ? -1 : 1) : (optSortDir === OPT_SORTDIR.asce_full ? 1 : -1)
			}
			else if (optSortBy === OPT_SORTBY.modDate_full) {
				return a.modifiedByMeTime < b.modifiedByMeTime ? (optSortDir === OPT_SORTDIR.asce_full ? -1 : 1) : (optSortDir === OPT_SORTDIR.asce_full ? 1 : -1)
			}
			else {
				console.error('unknown OPT_SORTBY value')
				return 1
			}
		}

		// B: sort, filter, page files
		const gridFiles = filteredFiles
			.sort(sorter)
			.filter((_item, idx) => { return idx >= ((pagingPage - 1) * pagingSize) && idx <= ((pagingPage * pagingSize) - 1) })

		// C: set show files
		const noBlobIds = gridFiles.filter((file) => !file.imageBlobUrl).map((item) => item.id)
		if (noBlobIds.length > 0) {
			loadPageImages(noBlobIds).then(() => {
				const gridFiles = filteredFiles
					.sort(sorter)
					.filter((_item, idx) => { return idx >= ((pagingPage - 1) * pagingSize) && idx <= ((pagingPage * pagingSize) - 1) })
				setGridFiles([...gridFiles])
			})
		}
		else {
			setGridFiles(gridFiles)
		}
	}, [filteredFiles, pagingPage, pagingSize, optSortBy, optSortDir])

	// --------------------------------------------------------------------------------------------

	function renderLogin(): JSX.Element {
		return (<section className="text-center cursor-link" onClick={() => handleAuthClick()}>
			<div className="p-4">
				<img height="150" width="150" src="/google-drive.png" alt="GoogleDriveLogo" />
			</div>
			<h5>Google Drive</h5>
			<p>view media directly from your google drive</p>
		</section>)
	}

	function renderMainContNav(): JSX.Element {
		const isSlideShowPaused = optSlideshowSecs === 999

		return (<nav className={`col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark ${isSidebarOpen ? '' : 'collapsed'}`}>
			<div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100 position-sticky" style={{ top: 0, zIndex: 100 }}>
				<a href="#" onClick={toggleSidebar} className="d-flex align-items-center pb-3 mb-md-0 me-md-auto text-white text-decoration-none" title="collapse/expand">
					<i className="fs-4 bi-list" /><span className={`ms-2 ${isSidebarOpen ? 'd-inline' : 'd-none'}`}>Menu</span>
				</a>
				<ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start" id="menu">
					<li className="nav-item">
						<a href="#" className="nav-link px-0 align-middle text-nowrap">
							<i className="fs-4 bi-house"></i><span className="ms-2 d-inline">Home</span>
						</a>
					</li>
					<li data-desc="sort-by">
						<a href="#submenuSortBy" data-bs-toggle="collapse" className="nav-link px-0 align-middle text-nowrap">
							<i className="fs-4 bi-sort-alpha-down"></i><span className="ms-2 d-inline">Sort By</span>
						</a>
						<ul className="collapse nav flex-column" id="submenuSortBy" data-bs-parent="#menu">
							<li className="w-100">
								<button className={`dropdown-item ${optSortBy === OPT_SORTBY.modDate_full ? '' : 'text-light'}`} disabled={optSortBy === OPT_SORTBY.modDate_full} onClick={() => setOptSortBy(OPT_SORTBY.modDate_full)}>{isSidebarOpen ? OPT_SORTBY.modDate_full : OPT_SORTBY.modDate_trim}</button>
								<button className={`dropdown-item ${optSortBy === OPT_SORTBY.filName_full ? '' : 'text-light'}`} disabled={optSortBy === OPT_SORTBY.filName_full} onClick={() => setOptSortBy(OPT_SORTBY.filName_full)}>{isSidebarOpen ? OPT_SORTBY.filName_full : OPT_SORTBY.filName_trim}</button>
							</li>
						</ul>
					</li>
					<li data-desc="sort-dir">
						<a href="#submenuSortDirection" data-bs-toggle="collapse" className="nav-link px-0 align-middle text-nowrap">
							<i className="fs-4 bi-arrow-down-up"></i><span className="ms-2 d-inline">Sort Direction</span>
						</a>
						<ul className="collapse nav flex-column" id="submenuSortDirection" data-bs-parent="#menu">
							<li className="w-100">
								<button className={`dropdown-item ${optSortDir === OPT_SORTDIR.asce_full ? '' : 'text-light'}`} disabled={optSortDir === OPT_SORTDIR.asce_full} onClick={() => setOptSortDir(OPT_SORTDIR.asce_full)}>{isSidebarOpen ? OPT_SORTDIR.asce_full : OPT_SORTDIR.asce_trim}</button>
								<button className={`dropdown-item ${optSortDir === OPT_SORTDIR.desc_full ? '' : 'text-light'}`} disabled={optSortDir === OPT_SORTDIR.desc_full} onClick={() => setOptSortDir(OPT_SORTDIR.desc_full)}>{isSidebarOpen ? OPT_SORTDIR.desc_full : OPT_SORTDIR.desc_trim}</button>
							</li>
						</ul>
					</li>
					<li data-desc="page-size">
						<a href="#submenuPageSize" data-bs-toggle="collapse" className="nav-link px-0 align-middle text-nowrap">
							<i className="fs-4 bi-grid"></i><span className="ms-2 d-inline">Page Size</span>
						</a>
						<ul className="collapse nav flex-column" id="submenuPageSize" data-bs-parent="#menu">
							<li className="w-100">
								<button className={`dropdown-item ${optPgeSize === OPT_PAGESIZE.ps08_full ? '' : 'text-light'}`} disabled={optPgeSize === OPT_PAGESIZE.ps08_full} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps08_full)}>{isSidebarOpen ? OPT_PAGESIZE.ps08_full : OPT_PAGESIZE.ps08_trim}</button>
								<button className={`dropdown-item ${optPgeSize === OPT_PAGESIZE.ps12_full ? '' : 'text-light'}`} disabled={optPgeSize === OPT_PAGESIZE.ps12_full} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps12_full)}>{isSidebarOpen ? OPT_PAGESIZE.ps12_full : OPT_PAGESIZE.ps12_trim}</button>
								<button className={`dropdown-item ${optPgeSize === OPT_PAGESIZE.ps24_full ? '' : 'text-light'}`} disabled={optPgeSize === OPT_PAGESIZE.ps24_full} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps24_full)}>{isSidebarOpen ? OPT_PAGESIZE.ps24_full : OPT_PAGESIZE.ps24_trim}</button>
								<button className={`dropdown-item ${optPgeSize === OPT_PAGESIZE.ps48_full ? '' : 'text-light'}`} disabled={optPgeSize === OPT_PAGESIZE.ps48_full} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps48_full)}>{isSidebarOpen ? OPT_PAGESIZE.ps48_full : OPT_PAGESIZE.ps48_trim}</button>
							</li>
						</ul>
					</li>
					<li data-desc="slide-show">
						<a href="#submenuSlideshow" data-bs-toggle="collapse" className="nav-link px-0 align-middle text-nowrap">
							<i className="fs-4 bi-play-circle"></i><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Slideshow</span>
						</a>
						<ul className="collapse nav flex-column ms-1" id="submenuSlideshow" data-bs-parent="#menu">
							<li className="w-100">
								{optIsSlideshow ?
									<>
										<button className={`dropdown-item ${isSlideShowPaused ? '' : 'text-light'}`} disabled={!isSlideShowPaused} onClick={() => { setOptSlideshowSecs(DEFAULT_SLIDE_DELAY) }}>
											<i className="bi-play-fill"></i><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Resume</span>
										</button>
										<button className={`dropdown-item ${!isSlideShowPaused ? '' : 'text-light'}`} disabled={isSlideShowPaused} onClick={() => { setOptSlideshowSecs(999) }}>
											<i className="bi-pause-fill"></i><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Pause</span>
										</button>
										<button className="dropdown-item" onClick={() => { setOptIsSlideshow(false) }}>
											<i className="bi-stop-fill"></i><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Stop</span>
										</button>
									</>
									:
									<button className="dropdown-item" onClick={() => { setOptIsSlideshow(true); setOptSlideshowSecs(4) }}>
										<i className="bi-play-fill"></i><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Start</span>
									</button>
								}
							</li>
						</ul>
					</li>
				</ul>
				<hr />
				<div className="dropdown pb-4">
					<a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
						{authUserPict ? <img src={authUserPict} alt="User Avatar" width="30" height="30" className="rounded-circle" /> : <i className="fs-4 bi bi-question-circle-fill"></i>}
						<span className={`mx-1 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>{authUserName}</span>
					</a>
					<ul className="dropdown-menu dropdown-menu-dark text-small shadow">
						<li><a className="dropdown-item" href="#">Settings</a></li>
						<li><a className="dropdown-item" href="#">Profile</a></li>
						<li>
							<hr className="dropdown-divider" />
						</li>
						<li>
							<button className="dropdown-item" disabled={!authUserName} onClick={handleSignOutClick}>Sign Out</button>
						</li>
					</ul>
				</div>
			</div>
		</nav>
		)
	}

	function renderMainContBody_TopBar_Paging(): JSX.Element {
		const maxPage = Math.ceil(filteredFiles.length / pagingSize)
		const startPage = Math.max(1, pagingPage - 2)
		const endPage = Math.min(maxPage, pagingPage + 2)
		const isDisabledNext = (pagingPage * pagingSize >= filteredFiles.length)

		return (
			<nav aria-label="Page navigation example">
				<ul className="pagination mb-0">
					<li className={`page-item ${pagingPage === 1 ? 'disabled' : ''}`}>
						<button type="button" className="page-link" onClick={() => setPagingPage(1)}>
							<i className="bi-skip-start me-1"></i>First
						</button>
					</li>
					<li className={`page-item ${pagingPage === 1 ? 'disabled' : ''}`}>
						<button type="button" className="page-link" onClick={() => { setPagingPage(pagingPage > 1 ? pagingPage - 1 : 1) }}>
							<i className="bi-arrow-left me-1"></i>Prev
						</button>
					</li>
					{Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
						.filter(page => page >= 1 && page <= maxPage)
						.map(page => (
							<li key={page} className={`page-item ${page === pagingPage ? 'active' : ''}`}>
								<button type="button" className="page-link" onClick={() => setPagingPage(page)}>
									{page}
								</button>
							</li>
						))}
					<li className={`page-item ${isDisabledNext ? 'disabled' : ''}`}>
						<button type="button" className="page-link" onClick={() => { setPagingPage(pagingPage + 1) }}>
							Next<i className="bi-arrow-right ms-1"></i>
						</button>
					</li>
					<li className={`page-item ${isDisabledNext ? 'disabled' : ''}`}>
						<button type="button" className="page-link" onClick={() => { setPagingPage(maxPage) }}>
							Last<i className="bi-skip-end ms-1"></i>
						</button>
					</li>
				</ul>
			</nav>
		)
	}

	function renderMainContBody_TopBar(): JSX.Element {
		return (<div className="position-sticky bg-dark p-3" style={{ top: 0, zIndex: 100 }}>
			<form className="container-fluid px-0">
				<div className="row">
					<div className="col-lg-auto col-md-4 col-12 mb-2 mb-md-0">
						{renderMainContBody_TopBar_Paging()}
					</div>
					<div className="col-lg col-md-4 col-sm-12 mb-2 mb-md-0">
						<div className="input-group">
							<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
							<input type="search" placeholder="Search" aria-label="Search" aria-describedby="grp-search" className="form-control" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
						</div>
					</div>
					<div className="col-lg-auto col-md-4 col-sm-12 my-auto">
						<div className="text-muted">
							{isSearching ? <span>searching...</span>
								: gridFiles.length === 0
									? ('No files to show')
									: (<span>Showing <b>{filteredFiles.length}</b> of <b>{allFiles.length}</b> files</span>)
							}
						</div>
					</div>
				</div>
			</form>
		</div>
		)
	}

	function renderMainContBody(): JSX.Element {
		let returnJsx = <div>Loading...</div>

		if (isBusyGapiLoad) {
			returnJsx = <section className='flex-grow'>
				{renderLogin()}
				<div className='text-center p-3'>
					<div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
				</div>
			</section>
		}
		else if (authUserName) {
			if (optIsSlideshow) {
				returnJsx = <ImageSlideshow
					images={allFiles.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })}
					duration={optSlideshowSecs}
					downloadFile={downloadFile}
				/>
			}
			else {
				returnJsx = <section>
					{renderMainContBody_TopBar()}
					<div className='p-2'>
						<ImageGrid gapiFiles={gridFiles} isShowCap={optIsShowCap} selGridSize={GridSizes[1]} />
					</div>
				</section>
			}
		}
		else {
			returnJsx = renderLogin()
		}

		return (
			<main className={`col p-0 ${authUserName ? '' : 'login'}`}>{returnJsx}</main>
		)
	}

	return (
		<div className="container-fluid">
			<div className="row flex-nowrap">
				{renderMainContNav()}
				{renderMainContBody()}
			</div>
		</div>
	)
}
