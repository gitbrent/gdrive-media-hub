import { useContext, useEffect, useState } from 'react'
import { AuthContext } from './api-google/AuthContext'
import { DataContext } from './api-google/DataContext'
import Home from './app-tabs/Home'
import FileBrowser from './app-tabs/FileBrowser'
import ImageGrid from './app-tabs/ImageGrid'
import Slideshow from './app-tabs/Slideshow'
import VideoPlayer from './app-tabs/VideoPlayer'
import UserProfile from './app-tabs/UserProfile'
import './css/AppMainUI.css'

enum AppTabs {
	Home = 'Home',
	FileBrowser = 'FileBrowser',
	ImageGrid = 'ImageGrid',
	SlideShow = 'SlideShow',
	VideoPlayer = 'VideoPlayer',
	UserProfile = 'UserProfile',
}

export default function AppMainUI() {
	const [currentTab, setCurrentTab] = useState(AppTabs.Home)
	const { isSignedIn, signIn, signOut } = useContext(AuthContext)
	const { userProfile, refreshData } = useContext(DataContext)

	useEffect(() => {
		if (isSignedIn) refreshData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isSignedIn])

	// --------------------------------------------------------------------------------------------

	function renderLogin(): JSX.Element {
		return (
			<section id="contHome" className="m-5">
				<div id="loginCont" className="text-center bg-black p-5 rounded">
					<img src="/google-drive.png" alt="GoogleDriveLogo" className="w-25" />
					<div className="my-3">
						<div className="display-6">Google Drive</div>
						<div className="display-6">Media Viewer</div>
					</div>
					<button type="button" className='btn btn-lg bg-success w-100 mt-4' onClick={signIn}>Sign In with Google</button>
				</div>
			</section>
		)
	}

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
										<a className="dropdown-item" href="#" onClick={() => { alert('TODO:') }}>Clear Cache</a>
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
				returnJsx = <VideoPlayer />
				break
			case AppTabs.UserProfile:
				returnJsx = <UserProfile />
				break
			default:
				returnJsx = <div />
		}

		return <main className="p-4 pt-3">{returnJsx}</main>
	}

	return (
		<section>
			{!isSignedIn ?
				renderLogin()
				:
				<>
					{renderTopBar()}
					{renderBody()}
				</>
			}
		</section>
	)
}
