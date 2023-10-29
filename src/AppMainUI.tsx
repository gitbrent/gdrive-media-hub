import React, { useState } from 'react'
import { OPT_SORTBY, OPT_SORTDIR } from './App.props'
import { useAppMain } from './useAppMain'
import ImageGrid from './AppTabs/ImageGrid'
import Slideshow from './AppTabs/Slideshow'
import './css/AppMainUI.css'

export enum AppTabs {
	ImageGrid = 'ImageGrid',
	SlideShow = 'SlideShow',
	Settings = 'Settings',
	//Profile = 'Profile',
}

export default function AppMainUI() {
	const { allFiles, authUserName, authUserPict, isBusyGapiLoad, handleAuthClick, handleSignOutClick, downloadFile, loadPageImages } = useAppMain()
	//
	const [currentTab, setCurrentTab] = useState(AppTabs.ImageGrid)
	const [optSortBy, setOptSortBy] = useState(OPT_SORTBY.modDate_full)
	const [optSortDir, setOptSortDir] = useState(OPT_SORTDIR.desc_full)
	const [optIsShowCap, setOptIsShowCap] = useState(true)
	//
	const [isSidebarOpen, setSidebarOpen] = useState(false)
	const toggleSidebar = () => {
		setSidebarOpen(!isSidebarOpen)
	}

	// --------------------------------------------------------------------------------------------

	function renderLogin(): JSX.Element {
		return (<section id="loginCont" className="text-center cursor-link" onClick={() => handleAuthClick()}>
			<div className="p-4">
				<img height="150" width="150" src="/google-drive.png" alt="GoogleDriveLogo" />
			</div>
			<h5>Google Drive</h5>
			<p className='text-muted'>superior media viewer</p>
		</section>)
	}

	function renderLNav(): JSX.Element {
		return (<nav id="leftNav" className={`col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark ${isSidebarOpen ? '' : 'collapsed'}`}>
			<div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100 position-sticky" style={{ top: 0, zIndex: 100 }}>
				<a href="#" onClick={toggleSidebar} className="d-flex align-items-center pb-3 mb-md-0 me-md-auto text-white text-decoration-none" title="collapse/expand">
					<i className="fs-4 bi-list" /><span className={`ms-2 ${isSidebarOpen ? 'd-inline' : 'd-none'}`}>Menu</span>
				</a>
				<ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start" id="menu">
					<li className="nav-item" data-desc="home">
						<a href="/" className="nav-link px-0 align-middle text-nowrap">
							<i className="fs-4 bi-house"></i><span className="ms-2 d-inline">Home</span>
						</a>
					</li>
					<li className="nav-item px-0 align-middle text-nowrap">
						<a href="#submenuSlideshow" onClick={() => setCurrentTab(AppTabs.ImageGrid)} className={`nav-link px-0 ${currentTab === AppTabs.ImageGrid ? 'active' : ''}`}>
							<i className="fs-4 bi-grid"></i><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Image Grid</span>
						</a>
					</li>
					<li className="nav-item px-0 align-middle text-nowrap">
						<a href="#submenuSlideshow" onClick={() => setCurrentTab(AppTabs.SlideShow)} className={`nav-link px-0 ${currentTab === AppTabs.SlideShow ? 'active' : ''}`}>
							<i className="fs-4 bi-play-circle"></i><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Slide Show</span>
						</a>
					</li>
					<li className="nav-item px-0 align-middle text-nowrap">
						<a href="#submenuSettings" onClick={() => setCurrentTab(AppTabs.Settings)} className={`nav-link px-0 ${currentTab === AppTabs.Settings ? 'active' : ''}`}>
							<i className="fs-4 bi-sliders"></i><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Settings</span>
						</a>
					</li>
					{/* TODO: move below to SETTINGS */}
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
				</ul>
				<hr />
				<div id="leftNavBtmBtn" className="dropdown px-2 pb-4">
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

	function renderBody(): JSX.Element {
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
			switch (currentTab) {
				case AppTabs.ImageGrid:
					returnJsx = <ImageGrid allFiles={allFiles} isShowCap={optIsShowCap} loadPageImages={loadPageImages} optSortBy={optSortBy} optSortDir={optSortDir} />
					break
				case AppTabs.SlideShow:
					returnJsx = <Slideshow allFiles={allFiles} downloadFile={downloadFile} />
					break
				case AppTabs.Settings:
					returnJsx = <div className='p-4'><h1>TODO:SETTINGS</h1></div>
					break
				default:
					returnJsx = <div />
			}
		}
		else {
			returnJsx = renderLogin()
		}

		return (
			<main id="main-container" className={`col p-0 ${authUserName ? '' : 'login'}`}>{returnJsx}</main>
		)
	}

	return (
		<div className="container-fluid">
			<div className="row flex-nowrap">
				{renderLNav()}
				{renderBody()}
			</div>
		</div>
	)
}
