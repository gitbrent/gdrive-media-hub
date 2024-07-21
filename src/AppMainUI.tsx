import React, { useState } from 'react'
import { OPT_SORTBY, OPT_SORTDIR } from './App.props'
import { useAppMain } from './api/useAppMain'
import Home from './app-tabs/Home'
import FileBrowser from './app-tabs/FileBrowser'
import ImageGrid from './app-tabs/ImageGrid'
import Slideshow from './app-tabs/Slideshow'
import VideoPlayer from './app-tabs/VideoPlayer'
import Settings from './app-tabs/Settings'
import UserProfile from './app-tabs/UserProfile'
import './css/AppMainUI.css'

export enum AppTabs {
	Home = 'Home',
	FileBrowser = 'FileBrowser',
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
	//
	const [optSortBy, setOptSortBy] = useState(OPT_SORTBY.modDate)
	const [optSortDir, setOptSortDir] = useState(OPT_SORTDIR.desc)
	const [optIsShowCap, setOptIsShowCap] = useState(false)

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar navbar-expand-lg bg-body-tertiary sticky-top">
				<div className="container-fluid">
					<a className="navbar-brand" href="#">
						<img src="/google-drive.png" alt="Drive" width="30" height="26" />
					</a>
					<button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
						<span className="navbar-toggler-icon"></span>
					</button>
					<div className="collapse navbar-collapse" id="navbarSupportedContent">
						<ul className="navbar-nav me-auto mb-2 mb-lg-0">
							<li className="nav-item">
								<a href="#" onClick={() => setCurrentTab(AppTabs.Home)} className={`nav-link ${currentTab === AppTabs.Home ? 'active' : ''}`} title="home" aria-label="home">
									Home
								</a>
							</li>
							{authUserName &&
								<li className="nav-item">
									<a href="#" onClick={() => setCurrentTab(AppTabs.FileBrowser)} className={`nav-link ${currentTab === AppTabs.FileBrowser ? 'active' : ''}`} title="file browser" aria-label="file browser">
										File Browser
									</a>
								</li>
							}
							{authUserName &&
								<li className="nav-item">
									<a href="#" onClick={() => setCurrentTab(AppTabs.ImageGrid)} className={`nav-link ${currentTab === AppTabs.ImageGrid ? 'active' : ''}`} title="image grid" aria-label="image grid">
										Image Grid
									</a>
								</li>
							}
							{authUserName &&
								<li className="nav-item">
									<a href="#" onClick={() => setCurrentTab(AppTabs.SlideShow)} className={`nav-link ${currentTab === AppTabs.SlideShow ? 'active' : ''}`} title="slide show" aria-label="slide show">
										Slide Show
									</a>
								</li>
							}
							{authUserName &&
								<li className="nav-item">
									<a href="#" onClick={() => setCurrentTab(AppTabs.VideoPlayer)} className={`nav-link ${currentTab === AppTabs.VideoPlayer ? 'active' : ''}`} title="video grid" aria-label="video grid">
										Video Grid
									</a>
								</li>
							}
							{authUserName &&
								<li className="nav-item">
									<a href="#" onClick={() => setCurrentTab(AppTabs.Settings)} className={`nav-link ${currentTab === AppTabs.Settings ? 'active' : ''}`} title="settings" aria-label="settings">
										Settings
									</a>
								</li>
							}

						</ul>
						<div className="dropdown">
							<a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
								{authUserPict
									? <img src={authUserPict} alt="User Avatar" width="30" height="30" className="rounded-circle" />
									: <i className="fs-4 bi bi-question-circle-fill" />
								}
							</a>
							{authUserName ?
								<ul className="dropdown-menu dropdown-menu-end">
									<li>
										<a className="dropdown-item" href="#" onClick={() => setCurrentTab(AppTabs.UserProfile)}>Profile</a>
									</li>
									<li><hr className="dropdown-divider" /></li>
									<li>
										<button className="dropdown-item" onClick={handleSignOutClick}>Sign Out</button>
									</li>
								</ul>
								:
								<ul className="dropdown-menu dropdown-menu-end">
									<li>
										<a className="dropdown-item" href="#" onClick={handleClearFileCache}>Clear Cache</a>
									</li>
								</ul>
							}
						</div>
					</div>
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
			case AppTabs.FileBrowser:
				returnJsx = <FileBrowser isBusyGapiLoad={isBusyGapiLoad} />
				break
			case AppTabs.ImageGrid:
				returnJsx = <ImageGrid allFiles={allFiles} isShowCap={optIsShowCap} loadPageImages={loadPageImages} />
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

		return <main className="p-4 pt-3">{returnJsx}</main>
	}

	return (
		<>
			{renderTopBar()}
			{renderBody()}
		</>
	)
}
