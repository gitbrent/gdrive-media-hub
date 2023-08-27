/**
 * @see https://developers.google.com/drive/api/guides/about-sdk
 * @see https://developers.google.com/drive/api/guides/search-files#node.js
 * @see https://developers.google.com/drive/api/guides/fields-parameter
 * @see https://developers.google.com/drive/api/v3/reference/files/get
 * @see https://medium.com/@willikay11/how-to-link-your-react-application-with-google-drive-api-v3-list-and-search-files-2e4e036291b7
 */
import React, { useEffect, useMemo, useState } from 'react'
import { GridSizes, IGapiFile, IS_LOCALHOST, OPT_PAGESIZE, OPT_SORTBY, OPT_SORTDIR } from './App.props'
import { initGoogleApi, doAuthSignIn, fetchDriveFiles, fetchFileImgBlob } from './GoogleApi'
import ImageSlideshow from './ImageSlideshow'
import ImageGrid from './ImageGrid'

export default function AppMain() {
	const [pagingSize, setPagingSize] = useState(12)
	const [pagingPage, setPagingPage] = useState(0)
	const [optSortBy, setOptSortBy] = useState(OPT_SORTBY.modDate)
	const [optSortDir, setOptSortDir] = useState(OPT_SORTDIR.desc)
	const [optPgeSize, setOptPgeSize] = useState(OPT_PAGESIZE.ps12)
	const [optSchWord, setOptSchWord] = useState('')
	const [optIsSlideshow, setOptIsSlideshow] = useState(false)
	const [optSlideshowSecs, setOptSlideshowSecs] = useState(4)
	//
	const [signedInUser, setSignedInUser] = useState('')
	const [isBusyGapiLoad, setIsBusyGapiLoad] = useState(false)
	const [dataSvcLoadTime, setDataSvcLoadTime] = useState('')
	const [gapiFiles, setGapiFiles] = useState<IGapiFile[]>([])
	const [updated, setUpdated] = useState('')
	//
	const [debugShowFileNames, setDebugShowFileNames] = useState(false)

	useEffect(() => {
		initGoogleApi((authState) => setSignedInUser(authState.userName))
	}, [])

	useEffect(() => {
		if (signedInUser) {
			if (IS_LOCALHOST) console.log(`[MAIN] signedInUser = "${signedInUser}"`)
			fetchDriveFiles().then((files) => {
				setGapiFiles(files)
				setIsBusyGapiLoad(false)
			})
		}
	}, [signedInUser])

	useEffect(() => {
		if (optPgeSize === OPT_PAGESIZE.ps08) setPagingSize(8)
		else if (optPgeSize === OPT_PAGESIZE.ps12) setPagingSize(12)
		else if (optPgeSize === OPT_PAGESIZE.ps24) setPagingSize(24)
		else if (optPgeSize === OPT_PAGESIZE.ps48) setPagingSize(48)
	}, [optPgeSize])

	/** fetch images now that files are loaded */
	useEffect(() => {
		if (gapiFiles.length > 0) setPagingPage(1)
	}, [gapiFiles])

	useEffect(() => {
		showFiles.filter((file) => !file.imageBlobUrl).forEach((file: IGapiFile) => { downloadFile(file.id) })
	}, [pagingPage, pagingSize, optSchWord, dataSvcLoadTime])

	const showFiles = useMemo(() => {
		const sorter = (a: IGapiFile, b: IGapiFile) => {
			if (optSortBy === OPT_SORTBY.filName) {
				return a.name < b.name ? (optSortDir === OPT_SORTDIR.asc ? -1 : 1) : (optSortDir === OPT_SORTDIR.asc ? 1 : -1)
			}
			else if (optSortBy === OPT_SORTBY.modDate) {
				return a.modifiedByMeTime < b.modifiedByMeTime ? (optSortDir === OPT_SORTDIR.asc ? -1 : 1) : (optSortDir === OPT_SORTDIR.asc ? 1 : -1)
			}
			else {
				console.error('unknown OPT_SORTBY value')
				return 1
			}
		}

		return gapiFiles
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
			.sort(sorter)
			.filter((_item, idx) => { return idx >= ((pagingPage - 1) * pagingSize) && idx <= ((pagingPage * pagingSize) - 1) })
	}, [gapiFiles, pagingPage, pagingSize, optSortBy, optSortDir, dataSvcLoadTime, optSchWord, updated])

	// --------------------------------------------------------------------------------------------

	/**
	 *  Sign in the user upon button click.
	 */
	const handleAuthClick = () => {
		// NOTE: this triggers callback above (dataSvcLoadTime is set)
		doAuthSignIn()
	}

	/**
	 *  Sign out the user upon button click.
	 */
	const handleSignOutClick = () => {
		gapi.auth2.getAuthInstance().signOut()
		setSignedInUser('')
		setGapiFiles([])
	}

	/**
	 * load image file blob from google drive api
	 * @param fileId
	 */
	const downloadFile = async (fileId: string) => {
		const file = gapiFiles.filter(item => item.id === fileId)[0]
		const response = await fetchFileImgBlob(file)
		if (response) {
			const blob = await response.blob()
			const objectUrl = URL.createObjectURL(blob)
			const img = document.createElement('img')
			img.src = objectUrl
			img.onload = function() {
				const updFiles = gapiFiles
				const imgFile = updFiles.filter((file) => file.id === fileId)[0]
				imgFile.imageBlobUrl = objectUrl
				imgFile.imageW = img.width && !isNaN(img.width) ? img.width : 100
				imgFile.imageH = img.height && !isNaN(img.height) ? img.height : 100
				setGapiFiles(updFiles)
				setUpdated(new Date().toISOString())
			}
		}
	}

	// NEW: WIP:
	const doSearchFiles = async () => {
		setIsBusyGapiLoad(true)
		const files = await fetchDriveFiles()
		setGapiFiles(files)
		setIsBusyGapiLoad(false)
	}

	// --------------------------------------------------------------------------------------------

	function renderNavbar(): JSX.Element {
		function renderBtns(): JSX.Element {
			const isDisabledNext = (showFiles.length < pagingSize) || ((pagingPage - 1) * pagingSize + showFiles.length >= gapiFiles.length)

			return optIsSlideshow ?
				(<form className="d-flex me-0 me-lg-5">
					{optSlideshowSecs === 999 ?
						<button className="btn btn-warning me-2" type="button" onClick={() => { setOptSlideshowSecs(4) }}>Unpause SlideShow</button>
						:
						<button className="btn btn-warning me-2" type="button" onClick={() => { setOptSlideshowSecs(999) }}>Pause SlideShow</button>
					}
					<button className="btn btn-danger me-0" type="button" onClick={() => { setOptIsSlideshow(false) }}>Stop SlideShow</button>
				</form>)
				:
				(<form className="d-flex me-0 me-lg-5">
					<button className="btn btn-success me-2 me-lg-4" type="button" onClick={() => { setOptIsSlideshow(true); setOptSlideshowSecs(4) }}>Start SlideShow</button>
					<button className="btn btn-info me-2" type="button" onClick={() => { setPagingPage(pagingPage > 1 ? pagingPage - 1 : 1) }} disabled={pagingPage < 2}>Prev</button>
					<button className="btn btn-info me-0" type="button" onClick={() => { setPagingPage(pagingPage + 1) }} disabled={isDisabledNext}>Next</button>
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
							{(document.location.hostname === 'localhost' || location.href.toLowerCase().includes('debug')) &&
								<li className="nav-item dropdown" data-desc="opt-debug">
									<a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">DEBUG</a>
									<ul className="dropdown-menu">
										<li><h6 className="dropdown-header">Display</h6></li>
										<li><button className="dropdown-item" disabled={true}>{showFiles?.length} images shown</button></li>
										<li><button className="dropdown-item" disabled={true}>{gapiFiles?.length} images total</button></li>
										<li>
											<hr className="dropdown-divider" />
										</li>
										<li><h6 className="dropdown-header">Search</h6></li>
										<li><button className="dropdown-item" disabled={true}>{gapiFiles?.filter((item) => !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1).length} images (searching for &quot;{optSchWord}&quot;)</button></li>
										<li>
											<hr className="dropdown-divider" />
										</li>
										<li><button className="dropdown-item" onClick={() => setDebugShowFileNames(!debugShowFileNames)}>{debugShowFileNames ? 'Hide' : 'Show'}&nbsp;file.names</button></li>
									</ul>
								</li>
							}
							<li className="nav-item dropdown" data-desc="opt-pagesize">
								{/* TODO:
									<a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Media</a>
									<ul className="dropdown-menu">
										<li>images</button></li>
										<li>Video</button></li>
									</ul>
								*/}
							</li>
							<li className="nav-item dropdown" data-desc="opt-sortby">
								<a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Sorting</a>
								<ul className="dropdown-menu">
									<li><h6 className="dropdown-header">Sort By</h6></li>
									<li><button className="dropdown-item" disabled={optSortBy === OPT_SORTBY.modDate} onClick={() => setOptSortBy(OPT_SORTBY.modDate)}>{OPT_SORTBY.modDate}</button></li>
									<li><button className="dropdown-item" disabled={optSortBy === OPT_SORTBY.filName} onClick={() => setOptSortBy(OPT_SORTBY.filName)}>{OPT_SORTBY.filName}</button></li>
									<li><hr className="dropdown-divider" /></li>
									<li><h6 className="dropdown-header">Sort Direction</h6></li>
									<li><button className="dropdown-item" disabled={optSortDir === OPT_SORTDIR.asc} onClick={() => setOptSortDir(OPT_SORTDIR.asc)}>{OPT_SORTDIR.asc}</button></li>
									<li><button className="dropdown-item" disabled={optSortDir === OPT_SORTDIR.desc} onClick={() => setOptSortDir(OPT_SORTDIR.desc)}>{OPT_SORTDIR.desc}</button></li>
								</ul>
							</li>
							<li className="nav-item dropdown" data-desc="opt-pagesize">
								<a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Paging</a>
								<ul className="dropdown-menu">
									<li><button className="dropdown-item" disabled={optPgeSize === OPT_PAGESIZE.ps08} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps08)}>{OPT_PAGESIZE.ps08}</button></li>
									<li><button className="dropdown-item" disabled={optPgeSize === OPT_PAGESIZE.ps12} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps12)}>{OPT_PAGESIZE.ps12}</button></li>
									<li><button className="dropdown-item" disabled={optPgeSize === OPT_PAGESIZE.ps24} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps24)}>{OPT_PAGESIZE.ps24}</button></li>
									<li><button className="dropdown-item" disabled={optPgeSize === OPT_PAGESIZE.ps48} onClick={() => setOptPgeSize(OPT_PAGESIZE.ps48)}>{OPT_PAGESIZE.ps48}</button></li>
								</ul>
							</li>
						</ul>
						<div className='d-none d-lg-block'>{renderBtns()}</div>
						<form className="d-flex" role="search">
							<input className="form-control" type="search" placeholder="Search" aria-label="Search" onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
							<button type='button' className='btn btn-sm btn-outline-info ms-2' disabled={!optSchWord} onClick={() => doSearchFiles()}>Search</button>
						</form>
						<ul className="navbar-nav flex-row flex-wrap ms-md-auto">
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
										{signedInUser ?
											<button className="dropdown-item disabled">{signedInUser}</button>
											:
											<button className="dropdown-item" onClick={() => setDataSvcLoadTime(new Date().toISOString())}>(click to refresh)</button>
										}
									</li>
									<li>
										<hr className="dropdown-divider" />
									</li>
									<li>
										<button className="dropdown-item" disabled={!signedInUser} onClick={handleSignOutClick}>Sign Out</button>
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
		return (<section onClick={() => handleAuthClick()} className="text-center p-4 bg-dark">
			<div className='p-4'>
				<img height="150" width="150" src="/google-drive.png" alt="GoogleDriveImage" />
			</div>
			<h5>Google Drive</h5>
			<p>view media directly from your google drive</p>
		</section >)
	}

	return (
		<div className="container-fluid">
			<header>
				{renderNavbar()}
			</header>
			<main>
				{isBusyGapiLoad ?
					<section>
						{renderLogin()}
						<div className='text-center bg-dark p-3'>
							<div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
						</div>
					</section>
					:
					optIsSlideshow ?
						<ImageSlideshow images={gapiFiles.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })} duration={optSlideshowSecs} />
						:
						debugShowFileNames ?
							<section>{gapiFiles?.map(item => item.name).sort().map((item, idx) => (<div key={`badge${idx}`} className='badge bg-info mb-2 me-2'>[{idx}]&nbsp;{item}</div>))}</section>
							:
							<section>{signedInUser ? <ImageGrid gapiFiles={showFiles} isShowCap={false} selGridSize={GridSizes[1]} /> : renderLogin()}</section>
				}
			</main>
		</div >
	)
}
