import React, { useEffect, useState } from 'react'
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
	//
	const [showFiles, setShowFiles] = useState<IGapiFile[]>([])
	//
	const [isSidebarOpen, setSidebarOpen] = useState(false)
	const toggleSidebar = () => {
		setSidebarOpen(!isSidebarOpen)
	}

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
		const gridFiles = allFiles
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
			.sort(sorter)
			.filter((_item, idx) => { return idx >= ((pagingPage - 1) * pagingSize) && idx <= ((pagingPage * pagingSize) - 1) })

		// C: set show files
		const noBlobIds = gridFiles.filter((file) => !file.imageBlobUrl).map((item) => item.id)
		if (noBlobIds.length > 0) {
			loadPageImages(noBlobIds).then(() => {
				const gridFiles = allFiles
					.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
					.sort(sorter)
					.filter((_item, idx) => { return idx >= ((pagingPage - 1) * pagingSize) && idx <= ((pagingPage * pagingSize) - 1) })
				setShowFiles([...gridFiles])
			})
		}
		else {
			setShowFiles(gridFiles)
		}
	}, [allFiles, pagingPage, pagingSize, optSortBy, optSortDir, optSchWord])

	// --------------------------------------------------------------------------------------------

	// TODO: move search to NavBar (or new topbar)
	function renderNavbar(): JSX.Element {
		function renderBtns(): JSX.Element {
			const isDisabledNext = (showFiles.length < pagingSize) || ((pagingPage - 1) * pagingSize + showFiles.length >= allFiles.length)
			const isSlidePaused = optSlideshowSecs === 999

			return optIsSlideshow ?
				(<form className="row">
					<div className="col">
						<input type="number"
							min={1}
							max={10}
							disabled={isSlidePaused}
							value={optSlideshowSecs}
							onChange={(ev) => setOptSlideshowSecs(Number(ev.currentTarget.value))}
							className="form-control"
							aria-describedby="slideshow delay" />
					</div>
					<div className="col">
						{isSlidePaused ?
							<button className="btn btn-warning text-nowrap w-100 px-5" type="button" onClick={() => { setOptSlideshowSecs(DEFAULT_SLIDE_DELAY) }}>Resume Slideshow</button>
							:
							<button className="btn btn-warning text-nowrap w-100 px-5" type="button" onClick={() => { setOptSlideshowSecs(999) }}>Pause Slideshow</button>
						}
					</div>
					<div className="col">
						<button className="btn btn-danger" type="button" onClick={() => { setOptIsSlideshow(false) }}>Stop</button>
					</div>
				</form>)
				:
				(<form className="container-fluid">
					<div className="row">
						<div className="col-lg-4 col-md-4 col-sm-12 mb-2 mb-md-0">
							<button className="btn btn-success w-100" type="button" onClick={() => { setOptIsSlideshow(true); setOptSlideshowSecs(4) }}>
								Start SlideShow
							</button>
						</div>
						<div className="col-lg-2 col-md-2 col-6 mb-2 mb-md-0">
							<button className="btn btn-info w-100" type="button" onClick={() => { setPagingPage(pagingPage > 1 ? pagingPage - 1 : 1) }} disabled={pagingPage < 2}>
								Prev
							</button>
						</div>
						<div className="col-lg-2 col-md-2 col-6 mb-2 mb-md-0">
							<button className="btn btn-info w-100" type="button" onClick={() => { setPagingPage(pagingPage + 1) }} disabled={isDisabledNext}>
								Next
							</button>
						</div>
						<div className="col-lg col-md col-sm-12">
							<input className="form-control text-nowrap w-100" type="search" placeholder="Search" aria-label="Search" onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
						</div>
					</div>
				</form>)
		}

		return (
			<nav className="navbar navbar-expand-lg navbar-dark bg-primary">
				<div className="container-fluid">
					<a className="navbar-brand d-none d-lg-block" href="/">
						<img src="/google-drive.png" alt="Google Drive Media Hub" width="32" height="32" />
					</a>
					<div className='d-lg-none'>{renderBtns()}</div>
					<button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
						<span className="navbar-toggler-icon"></span>
					</button>
					<div className="collapse navbar-collapse" id="navbarSupportedContent">
						<ul className="navbar-nav me-auto mb-2 mb-lg-0" data-desc="option-dropdowns">
							<li className="nav-item">
								<a className="nav-link active" aria-current="page" href="/">Home</a>
							</li>
							<li className="nav-item dropdown" data-desc="opt-pagesize">
								{/* TODO:
									<a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Media</a>
									<ul className="dropdown-menu">
										<li>images</button></li>
										<li>Video</button></li>
									</ul>
								*/}
							</li>
							<li className="nav-item dropdown" data-desc="opt-grid">
								<a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Grid Options</a>
								<ul className="dropdown-menu">
									<li><h6 className="dropdown-header">Sort By</h6></li>
									<li><button className="dropdown-item" disabled={optSortBy === OPT_SORTBY.modDate_full} onClick={() => setOptSortBy(OPT_SORTBY.modDate_full)}>{OPT_SORTBY.modDate_full}</button></li>
									<li><button className="dropdown-item" disabled={optSortBy === OPT_SORTBY.filName_full} onClick={() => setOptSortBy(OPT_SORTBY.filName_full)}>{OPT_SORTBY.filName_full}</button></li>
									<li><hr className="dropdown-divider" /></li>
									<li><h6 className="dropdown-header">Sort Direction</h6></li>
									<li><button className="dropdown-item" disabled={optSortDir === OPT_SORTDIR.asce_full} onClick={() => setOptSortDir(OPT_SORTDIR.asce_full)}>{OPT_SORTDIR.asce_full}</button></li>
									<li><button className="dropdown-item" disabled={optSortDir === OPT_SORTDIR.desc_full} onClick={() => setOptSortDir(OPT_SORTDIR.desc_full)}>{OPT_SORTDIR.desc_full}</button></li>
									<li><hr className="dropdown-divider" /></li>
									<li><h6 className="dropdown-header">Page Size</h6></li>
									<li><button className="dropdown-item" disabled={optPgeSize === OPT_PAGESIZE.ps08_full} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps08_full)}>{OPT_PAGESIZE.ps08_full}</button></li>
									<li><button className="dropdown-item" disabled={optPgeSize === OPT_PAGESIZE.ps12_full} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps12_full)}>{OPT_PAGESIZE.ps12_full}</button></li>
									<li><button className="dropdown-item" disabled={optPgeSize === OPT_PAGESIZE.ps24_full} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps24_full)}>{OPT_PAGESIZE.ps24_full}</button></li>
									<li><button className="dropdown-item" disabled={optPgeSize === OPT_PAGESIZE.ps48_full} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps48_full)}>{OPT_PAGESIZE.ps48_full}</button></li>
									<li><hr className="dropdown-divider" /></li>
									<li><h6 className="dropdown-header">Images</h6></li>
									<li><button className="dropdown-item" onClick={() => setOptIsShowCap(!optIsShowCap)}>{optIsShowCap ? 'Show' : 'No'} Captions</button></li>
								</ul>
							</li>
							{(document.location.hostname === 'localhost' || location.href.toLowerCase().includes('debug')) &&
								<li className="nav-item dropdown" data-desc="opt-debug">
									<a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">DEBUG</a>
									<ul className="dropdown-menu">
										<li><h6 className="dropdown-header">Display</h6></li>
										<li>
											<button className="dropdown-item" disabled={true}>
												<div className='row flex-nowrap'><div className='col'>Total Images</div><div className='col-auto'>{allFiles?.length}</div></div>
											</button>
										</li>
										<li>
											<button className="dropdown-item" disabled={true}>
												<div className='row flex-nowrap'><div className='col'>Show Images</div><div className='col-auto'>{showFiles?.length}</div></div>
											</button>
										</li>
										<li>
											<hr className="dropdown-divider" />
										</li>
										<li><h6 className="dropdown-header">Search</h6></li>
										<li>
											<button className="dropdown-item" disabled={true}>
												<div className='row flex-nowrap'><div className='col'>Keyword</div><div className='col-auto'>&quot;{optSchWord}&quot;</div></div>
											</button>
										</li>
										<li>
											<button className="dropdown-item" disabled={true}>
												<div className='row flex-nowrap'><div className='col'>Show Images</div><div className='col-auto'>{showFiles?.length}</div></div>
											</button>
										</li>
										<li>
											<hr className="dropdown-divider" />
										</li>
									</ul>
								</li>
							}
						</ul>
						<div className='d-none d-lg-block'>{renderBtns()}</div>
						<ul className="navbar-nav flex-row ms-md-auto">
							<li className="nav-item d-none d-lg-block col-6 col-lg-auto">
								<a className="nav-link py-2 px-0 px-lg-2" href="https://github.com/gitbrent" target="_blank" rel="noreferrer">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="navbar-nav-svg" viewBox="0 0 512 499.36" role="img">
										<title>GitHub</title>
										<path fill="currentColor" fillRule='evenodd' d="M256 0C114.64 0 0 114.61 0 256c0 113.09 73.34 209 175.08 242.9 12.8 2.35 17.47-5.56 17.47-12.34 0-6.08-.22-22.18-.35-43.54-71.2 15.49-86.2-34.34-86.2-34.34-11.64-29.57-28.42-37.45-28.42-37.45-23.27-15.84 1.73-15.55 1.73-15.55 25.69 1.81 39.21 26.38 39.21 26.38 22.84 39.12 59.92 27.82 74.5 21.27 2.33-16.54 8.94-27.82 16.25-34.22-56.84-6.43-116.6-28.43-116.6-126.49 0-27.95 10-50.8 26.35-68.69-2.63-6.48-11.42-32.5 2.51-67.75 0 0 21.49-6.88 70.4 26.24a242.65 242.65 0 0 1 128.18 0c48.87-33.13 70.33-26.24 70.33-26.24 14 35.25 5.18 61.27 2.55 67.75 16.41 17.9 26.31 40.75 26.31 68.69 0 98.35-59.85 120-116.88 126.32 9.19 7.9 17.38 23.53 17.38 47.41 0 34.22-.31 61.83-.31 70.23 0 6.85 4.61 14.81 17.6 12.31C438.72 464.97 512 369.08 512 256.02 512 114.62 397.37 0 256 0z"></path>
									</svg>
									<small className="d-lg-none ms-2">GitHub</small>
								</a>
							</li>
							<li className="nav-item d-none d-lg-block py-1 col-12 col-lg-auto">
								<div className="vr d-none d-lg-flex h-100 mx-lg-2 text-white"></div>
								<hr className="d-lg-none text-white-50" />
							</li>
							<li className="nav-item dropdown">
								<button type="button" className="btn btn-link nav-link py-2 px-0 px-lg-2 dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" data-bs-display="static">
									<span className='me-1'>User</span>
								</button>
								<ul className="dropdown-menu dropdown-menu-end">
									<li>
										<h6 className="dropdown-header">Logged In As</h6>
									</li>
									<li>
										{authUserName ?
											<button className="dropdown-item disabled">{authUserName}</button>
											:
											<button className="dropdown-item" onClick={() => handleAuthClick()}>(click to signin)</button>
										}
									</li>
									<li>
										<hr className="dropdown-divider" />
									</li>
									<li>
										<button className="dropdown-item" disabled={!authUserName} onClick={handleSignOutClick}>Sign Out</button>
									</li>
								</ul>
							</li>
						</ul>
					</div>
				</div>
			</nav>
		)
	}

	function renderLogin(): JSX.Element {
		return (<section onClick={() => handleAuthClick()} className="text-center">
			<div className="p-4">
				<img height="150" width="150" src="/google-drive.png" alt="GoogleDriveLogo" />
			</div>
			<h5>Google Drive</h5>
			<p>view media directly from your google drive</p>
		</section>)
	}

	function renderTopBar(): JSX.Element {
		const isDisabledNext = (showFiles.length < pagingSize) || ((pagingPage - 1) * pagingSize + showFiles.length >= allFiles.length)

		return (<div className="position-sticky bg-dark p-3" style={{ top: 0, zIndex: 100 }}>
			<form className="container-fluid">
				<div className="row">
					<div className="col-lg-2 col-md-2 col-6 mb-2 mb-md-0">
						<button className="btn btn-info w-100" type="button" onClick={() => { setPagingPage(pagingPage > 1 ? pagingPage - 1 : 1) }} disabled={pagingPage < 2}>
							Prev
						</button>
					</div>
					<div className="col-lg-2 col-md-2 col-6 mb-2 mb-md-0">
						<button className="btn btn-info w-100" type="button" onClick={() => { setPagingPage(pagingPage + 1) }} disabled={isDisabledNext}>
							Next
						</button>
					</div>
					<div className="col-lg-4 col-md-4 col-sm-12">
						<input className="form-control text-nowrap w-100" type="search" placeholder="Search" aria-label="Search" onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
					</div>
				</div>
			</form>
		</div>
		)
	}

	function renderMainContNav(): JSX.Element {
		//const isDisabledNext = (showFiles.length < pagingSize) || ((pagingPage - 1) * pagingSize + showFiles.length >= allFiles.length)
		//const isSlidePaused = optSlideshowSecs === 999

		return (<div className={`col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark ${isSidebarOpen ? '' : 'collapsed'}`}>
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
					<li>
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
					<li>
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
					<li>
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
					<li>
						<a href="#submenuSlideshow" data-bs-toggle="collapse" className="nav-link px-0 align-middle text-nowrap">
							<i className="fs-4 bi-play-circle"></i><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Slideshow</span>
						</a>
						<ul className="collapse nav flex-column ms-1" id="submenuSlideshow" data-bs-parent="#menu">
							<li className="w-100">
								{optIsSlideshow ?
									<>
										<button className="dropdown-item" onClick={() => { setOptSlideshowSecs(DEFAULT_SLIDE_DELAY) }}>
											<i className="bi-play-fill"></i><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Resume</span>
										</button>
										<button className="dropdown-item" onClick={() => { setOptSlideshowSecs(999) }}>
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
					{renderTopBar()}
					<div className='p-2'>
						<ImageGrid gapiFiles={showFiles} isShowCap={optIsShowCap} selGridSize={GridSizes[1]} />
					</div>
				</section>
			}
		}
		else {
			returnJsx = renderLogin()
		}

		return (
			<div className="col p-0">{returnJsx}</div>
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
