import { useContext, useState } from 'react'
import { OPT_SORTBY, OPT_SORTDIR } from './App.props'
import Home from './app-tabs/Home'
import FileBrowser from './app-tabs/FileBrowser'
import ImageGrid from './app-tabs/ImageGrid'
import Slideshow from './app-tabs/Slideshow'
import VideoPlayer from './app-tabs/VideoPlayer'
import Settings from './app-tabs/Settings'
import UserProfile from './app-tabs/UserProfile'
import './css/AppMainUI.css'
// NEW:
import { AuthContext } from './api-google/AuthContext'
import { DataContext } from './api-google/DataContext'
// vvv DELETE ME vvv - once above is implemented in all tabs
import { useAppMain } from './api/useAppMain'
// ^^^ WIP: REMOVE ME:

enum AppTabs {
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
		downloadFile,
		handleClearFileCache,
		isBusyGapiLoad,
		getUserAuthState,
		getCacheStatus,
	} = useAppMain()
	//
	const [currentTab, setCurrentTab] = useState(AppTabs.Home)
	//
	const [optSortBy, setOptSortBy] = useState(OPT_SORTBY.modDate)
	const [optSortDir, setOptSortDir] = useState(OPT_SORTDIR.desc)
	const [optIsShowCap, setOptIsShowCap] = useState(false)

	// NEW!!! BELOW: WIP: TODO:
	const { isSignedIn, signIn, signOut } = useContext(AuthContext);
	const { mediaFiles, userProfile } = useContext(DataContext);

	// --------------------------------------------------------------------------------------------

	/**
	 * @see https://getbootstrap.com/docs/5.3/utilities/background/
	 */
	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar navbar-expand-lg bg-dark-subtle2 bg-body-secondary sticky-top">
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
							{userProfile &&
								<li className="nav-item">
									<a href="#" onClick={() => setCurrentTab(AppTabs.FileBrowser)} className={`nav-link ${currentTab === AppTabs.FileBrowser ? 'active' : ''}`} title="file browser" aria-label="file browser">
										File Browser
									</a>
								</li>
							}
							{userProfile &&
								<li className="nav-item">
									<a href="#" onClick={() => setCurrentTab(AppTabs.ImageGrid)} className={`nav-link ${currentTab === AppTabs.ImageGrid ? 'active' : ''}`} title="image grid" aria-label="image grid">
										Image Grid
									</a>
								</li>
							}
							{userProfile &&
								<li className="nav-item">
									<a href="#" onClick={() => setCurrentTab(AppTabs.SlideShow)} className={`nav-link ${currentTab === AppTabs.SlideShow ? 'active' : ''}`} title="slide show" aria-label="slide show">
										Slide Show
									</a>
								</li>
							}
							{userProfile &&
								<li className="nav-item">
									<a href="#" onClick={() => setCurrentTab(AppTabs.VideoPlayer)} className={`nav-link ${currentTab === AppTabs.VideoPlayer ? 'active' : ''}`} title="video grid" aria-label="video grid">
										Video Grid
									</a>
								</li>
							}
							{userProfile &&
								<li className="nav-item">
									<a href="#" onClick={() => setCurrentTab(AppTabs.Settings)} className={`nav-link ${currentTab === AppTabs.Settings ? 'active' : ''}`} title="settings" aria-label="settings">
										Settings
									</a>
								</li>
							}
						</ul>
						<div className="dropdown">
							<a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
								{userProfile
									? <img src={userProfile.getImageUrl()} alt="User Avatar" width="30" height="30" className="rounded-circle" />
									: <i className="fs-4 bi bi-question-circle-fill" />
								}
							</a>
							{userProfile ?
								<ul className="dropdown-menu dropdown-menu-end">
									<li>
										<a className="dropdown-item" href="#" onClick={() => setCurrentTab(AppTabs.UserProfile)}>Profile</a>
									</li>
									<li><hr className="dropdown-divider" /></li>
									<li>
										<button className="dropdown-item" onClick={signOut}>Sign Out</button>
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
				returnJsx = <Home />
				break
			case AppTabs.FileBrowser:
				returnJsx = <FileBrowser />
				break
			case AppTabs.ImageGrid:
				returnJsx = <ImageGrid />
				break
			case AppTabs.SlideShow:
				returnJsx = <Slideshow />
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
		<section>
			{mediaFiles.length === 0 ?
				<div>BUSY</div>
				:
				isSignedIn ? (
					<>
						{renderTopBar()}
						{renderBody()}
					</>
				) : (
					<button type='button' className='btn btn-lg bg-success' onClick={signIn}>Sign In with Google</button>
				)}
		</section>
	);
}
