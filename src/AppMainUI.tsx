import { useContext, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router'
import { AuthContext } from './api-google/AuthContext'
import { DataContext } from './api-google/DataContext'
import Home from './app-tabs/Home'
import FileBrowser from './app-tabs/FileBrowser'
import ImageGrid from './app-tabs/ImageGrid'
import Slideshow from './app-tabs/Slideshow'
import VideoPlayer from './app-tabs/VideoPlayer'
import UserProfile from './app-tabs/UserProfile'
import './css/AppMainUI.css'

export default function AppMainUI() {
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
								<Link to="/" className="nav-link" title="home" aria-label="home">
									Home
								</Link>
							</li>
							{userProfile &&
								<>
									<li className="nav-item">
										<Link to="/file-browser" className="nav-link" title="file browser" aria-label="file browser">
											File Browser
										</Link>
									</li>
									<li className="nav-item">
										<Link to="/image-grid" className="nav-link" title="image grid" aria-label="image grid">
											Image Grid
										</Link>
									</li>
									<li className="nav-item">
										<Link to="/slide-show" className="nav-link" title="slide show" aria-label="slide show">
											Slide Show
										</Link>
									</li>
									<li className="nav-item">
										<Link to="/video-player" className="nav-link" title="video grid" aria-label="video grid">
											Video Grid
										</Link>
									</li>
								</>
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
										<Link className="dropdown-item" to="/user-profile">Profile</Link>
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

	return (
		<section>
			{!isSignedIn ?
				renderLogin()
				:
				<>
					{renderTopBar()}
					<main className="p-4 pt-3">
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/file-browser" element={<FileBrowser />} />
							<Route path="/image-grid" element={<ImageGrid />} />
							<Route path="/slide-show" element={<Slideshow />} />
							<Route path="/video-player" element={<VideoPlayer />} />
							<Route path="/user-profile" element={<UserProfile />} />
							<Route path="/login" element={renderLogin()} />
						</Routes>
					</main>
				</>
			}
		</section>
	)
}
