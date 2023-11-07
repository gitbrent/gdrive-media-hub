import React, { useState } from 'react'
import { OPT_SORTBY, OPT_SORTDIR } from './App.props'
import { useAppMain } from './useAppMain'
import Home from './AppTabs/Home'
import ImageGrid from './AppTabs/ImageGrid'
import Slideshow from './AppTabs/Slideshow'
import VideoPlayer from './AppTabs/VideoPlayer'
import Settings from './AppTabs/Settings'
import UserProfile from './AppTabs/UserProfile'
import './css/AppMainUI.css'

export enum AppTabs {
	Home = 'Home',
	ImageGrid = 'ImageGrid',
	SlideShow = 'SlideShow',
	VideoPlayer = 'VideoPlayer',
	Settings = 'Settings',
	UserProfile = 'UserProfile',
}

export default function AppMainUI() {
	const {
		allFiles,
		authUserName,
		authUserPict,
		downloadFile,
		getFileAnalysis,
		handleAuthClick,
		handleSignOutClick,
		handleClearFileCache,
		isBusyGapiLoad,
		loadPageImages,
		getUserAuthState,
		getCacheStatus,
	} = useAppMain()
	//
	const [currentTab, setCurrentTab] = useState(AppTabs.Home)
	const [isSidebarOpen, setSidebarOpen] = useState(false)
	//
	const [optSortBy, setOptSortBy] = useState(OPT_SORTBY.modDate)
	const [optSortDir, setOptSortDir] = useState(OPT_SORTDIR.desc)
	const [optIsShowCap, setOptIsShowCap] = useState(true)
	//
	const toggleSidebar = () => {
		setSidebarOpen(!isSidebarOpen)
	}

	// --------------------------------------------------------------------------------------------

	function renderLNav(): JSX.Element {
		return (
			<nav id="leftNav" className={`col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark ${isSidebarOpen ? '' : 'collapsed'}`}>
				<div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-3 text-white min-vh-100-fixed position-sticky" style={{ top: 0, zIndex: 100 }}>
					<a href="#" onClick={toggleSidebar} className="d-flex align-items-center pb-3 mb-md-0 me-md-auto text-white text-decoration-none" title="collapse/expand">
						<i className="fs-4 bi-list" /><span className={`ms-2 ${isSidebarOpen ? 'd-inline' : 'd-none'}`}>Menu</span>
					</a>
					<ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start" id="menu">
						<li className="nav-item" data-desc="home">
							<a href="#" role="button"
								onClick={() => setCurrentTab(AppTabs.Home)}
								className={`nav-link px-0 ${currentTab === AppTabs.Home ? 'active' : ''}`}
								title="home" aria-label="home"
							>
								<i className="fs-4 bi-house" /><span className="ms-2 d-inline">Home</span>
							</a>
						</li>
						{authUserName &&
							<li className="nav-item px-0 align-middle text-nowrap">
								<a href="#" role="button" onClick={() => setCurrentTab(AppTabs.ImageGrid)} className={`nav-link px-0 ${currentTab === AppTabs.ImageGrid ? 'active' : ''}`} title="image grid" aria-label="image grid">
									<i className="fs-4 bi-grid" /><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Image Grid</span>
								</a>
							</li>
						}
						{authUserName &&
							<li className="nav-item px-0 align-middle text-nowrap">
								<a href="#" role="button" onClick={() => setCurrentTab(AppTabs.SlideShow)} className={`nav-link px-0 ${currentTab === AppTabs.SlideShow ? 'active' : ''}`} title="slide show" aria-label="slide show">
									<i className="fs-4 bi-play-circle" /><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Slide Show</span>
								</a>
							</li>
						}
						{authUserName &&
							<li className="nav-item px-0 align-middle text-nowrap">
								<a href="#" role="button" onClick={() => setCurrentTab(AppTabs.VideoPlayer)} className={`nav-link px-0 ${currentTab === AppTabs.VideoPlayer ? 'active' : ''}`} title="video grid" aria-label="video grid">
									<i className="fs-4 bi-camera-video" /><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Video Grid</span>
								</a>
							</li>
						}
						{authUserName &&
							<li className="nav-item px-0 align-middle text-nowrap">
								<a href="#" role="button" onClick={() => setCurrentTab(AppTabs.Settings)} className={`nav-link px-0 ${currentTab === AppTabs.Settings ? 'active' : ''}`} title="settings" aria-label="settings">
									<i className="fs-4 bi-sliders" /><span className={`ms-2 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>Settings</span>
								</a>
							</li>
						}
						<li className="nav-item px-0 align-middle text-nowrap" id="leftNavBtmBtn">
							<div id="leftNavBtmBtn" className="dropdown px-3 pb-4">
								<a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
									{authUserPict ? <img src={authUserPict} alt="User Avatar" width="30" height="30" className="rounded-circle" /> : <i className="fs-4 bi bi-question-circle-fill" />}
									<span className={`mx-1 ${isSidebarOpen ? 'd-sm-inline' : 'd-none'}`}>{authUserName}</span>
								</a>
								{authUserName ?
									<ul className="dropdown-menu dropdown-menu-dark text-small shadow">
										<li>
											<a className="dropdown-item" href="#" onClick={() => setCurrentTab(AppTabs.UserProfile)}>Profile</a>
										</li>
										<li>
											<hr className="dropdown-divider" />
										</li>
										<li>
											<button className="dropdown-item" onClick={handleSignOutClick}>Sign Out</button>
										</li>
									</ul>
									:
									<ul className="dropdown-menu dropdown-menu-dark text-small shadow">
										<li>
											<a className="dropdown-item" href="#" onClick={handleClearFileCache}>Clear Cache</a>
										</li>
									</ul>
								}
							</div>
						</li>
					</ul>
				</div>
			</nav>
		)
	}

	function renderBody(): JSX.Element {
		let returnJsx = <div>Loading...</div>

		switch (currentTab) {
			case AppTabs.Home:
				returnJsx = <Home
					authUserName={authUserName}
					allFiles={allFiles}
					getFileAnalysis={getFileAnalysis}
					isBusyGapiLoad={isBusyGapiLoad}
					handleAuthClick={handleAuthClick} />
				break
			case AppTabs.ImageGrid:
				returnJsx = <ImageGrid
					allFiles={allFiles}
					isShowCap={optIsShowCap}
					loadPageImages={loadPageImages}
					optSortBy={optSortBy}
					optSortDir={optSortDir} />
				break
			case AppTabs.SlideShow:
				returnJsx = <Slideshow allFiles={allFiles} downloadFile={downloadFile} />
				break
			case AppTabs.VideoPlayer:
				returnJsx = <VideoPlayer allFiles={allFiles} downloadFile={downloadFile} />
				break
			case AppTabs.Settings:
				returnJsx = <Settings
					optSortBy={optSortBy}
					optSortDir={optSortDir}
					optIsShowCap={optIsShowCap}
					setOptSortBy={setOptSortBy}
					setOptSortDir={setOptSortDir}
					setOptIsShowCap={setOptIsShowCap} />
				break
			case AppTabs.UserProfile:
				returnJsx = <UserProfile
					getUserAuthState={getUserAuthState}
					getCacheStatus={getCacheStatus}
					handleClearFileCache={handleClearFileCache}
					isBusyGapiLoad={isBusyGapiLoad}
				/>
				break
			default:
				returnJsx = <div />
		}

		return (
			<main className="col p-0">{returnJsx}</main>
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
