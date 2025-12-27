import { useContext, useEffect } from 'react'
import { Routes, Route, Link, NavLink } from 'react-router'
import { AuthContext } from './api-google/AuthContext'
import { DataContext } from './api-google/DataContext'
import { DEBUG, APP_VER, APP_BLD } from './App.props'
import Home from './app-tabs/Home'
import Collections from './app-tabs/Collections'
import Folders from './app-tabs/Folders'
import FileBrowser from './app-tabs/FileBrowser'
import ImageGrid from './app-tabs/ImageGrid'
import Slideshow from './app-tabs/Slideshow'
import VideoPlayer from './app-tabs/VideoPlayer'
import UserProfile from './app-tabs/UserProfile'

export default function AppMainUI() {
	const { isSignedIn, signIn } = useContext(AuthContext)
	const { userProfile, refreshData } = useContext(DataContext)

	useEffect(() => {
		if (isSignedIn) refreshData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isSignedIn])

	// --------------------------------------------------------------------------------------------

	function renderLogin(): JSX.Element {
		return (
			<section className="hero min-h-screen bg-base-200">
				<div className="hero-content text-center">
					<div id="loginCont" className="w-full max-w-md">
						<div className="flex flex-wrap w-auto justify-center items-center gap-4 mb-6">
							<div>
								<img src="/google-drive.png" alt="Google Drive Logo" style={{ maxWidth: 100 }} />
							</div>
							<div>
								<img src="/app-logo.png" alt="App Logo" style={{ maxWidth: 100 }} />
							</div>
						</div>
						<h1 className="text-5xl font-bold mb-2">Google Drive</h1>
						<h2 className="text-5xl font-bold mb-6">Media Viewer</h2>
						<button type="button" className='btn btn-lg btn-success w-full' onClick={() => signIn(false)}>Sign In with Google</button>
						<button type="button" className={`btn btn-sm btn-outline btn-warning w-full mt-3 ${!DEBUG ? 'hidden' : ''}`} onClick={() => signIn(true)}>
							Force Re-authenticate (Dev Only)
						</button>
						<div className="mt-6">
							<a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="text-base-content/50 no-underline text-sm hover:text-base-content/70">Privacy Policy</a>
						</div>
						<div className={`${!DEBUG ? 'hidden' : ''} mt-6`}>
							<div className="flex justify-center gap-2">
								<span className="badge badge-primary">{APP_VER}</span>
								<span className="badge badge-secondary">{APP_BLD}</span>
							</div>
						</div>
					</div>
				</div>
			</section>
		)
	}

	function renderTopBar(): JSX.Element {
		return (
			<div className="navbar bg-base-100 sticky top-0 z-50">
				<div className="navbar-start">
					<div className="dropdown">
						<div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
							</svg>
						</div>
						<ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-1 p-2 shadow bg-base-100 rounded-box w-52">
							<li>
								<NavLink to="/" end title="home" aria-label="home" className={({ isActive }) => isActive ? 'menu-active' : ''}>
									Home
								</NavLink>
							</li>
							{userProfile &&
								<>
									<li>
										<NavLink to="/collections" title="collections" aria-label="collections" className={({ isActive }) => isActive ? 'menu-active' : ''}>
											Collections
										</NavLink>
									</li>
									<li>
										<NavLink to="/folders" title="folders" aria-label="folders" className={({ isActive }) => isActive ? 'menu-active' : ''}>
											Folders
										</NavLink>
									</li>
									<li>
										<NavLink to="/file-browser" title="file browser" aria-label="file browser" className={({ isActive }) => isActive ? 'menu-active' : ''}>
											File Browser
										</NavLink>
									</li>
									<li>
										<NavLink to="/image-grid" title="image grid" aria-label="image grid" className={({ isActive }) => isActive ? 'menu-active' : ''}>
											Image Grid
										</NavLink>
									</li>
									<li>
										<NavLink to="/slide-show" title="slide show" aria-label="slide show" className={({ isActive }) => isActive ? 'menu-active' : ''}>
											Slide Show
										</NavLink>
									</li>
									<li>
										<NavLink to="/video-player" title="video grid" aria-label="video grid" className={({ isActive }) => isActive ? 'menu-active' : ''}>
											Video Grid
										</NavLink>
									</li>
								</>
							}
						</ul>
					</div>
					<Link className="btn btn-ghost text-xl" to="/">
						<img src="/app-logo.png" alt="Drive" width="30" height="26" />
					</Link>
				</div>
				<div className="navbar-center hidden lg:flex">
					<ul className="menu menu-horizontal px-1">
						<li>
							<NavLink to="/" end title="home" aria-label="home" className={({ isActive }) => isActive ? 'menu-active' : ''}>
								Home
							</NavLink>
						</li>
						{userProfile &&
							<>
								<li>
									<NavLink to="/collections" title="collections" aria-label="collections" className={({ isActive }) => isActive ? 'menu-active' : ''}>
										Collections
									</NavLink>
								</li>
								<li>
									<NavLink to="/folders" title="folders" aria-label="folders" className={({ isActive }) => isActive ? 'menu-active' : ''}>
										Folders
									</NavLink>
								</li>
								<li>
									<NavLink to="/file-browser" title="file browser" aria-label="file browser" className={({ isActive }) => isActive ? 'menu-active' : ''}>
										File Browser
									</NavLink>
								</li>
								<li>
									<NavLink to="/image-grid" title="image grid" aria-label="image grid" className={({ isActive }) => isActive ? 'menu-active' : ''}>
										Image Grid
									</NavLink>
								</li>
								<li>
									<NavLink to="/slide-show" title="slide show" aria-label="slide show" className={({ isActive }) => isActive ? 'menu-active' : ''}>
										Slide Show
									</NavLink>
								</li>
								<li>
									<NavLink to="/video-player" title="video grid" aria-label="video grid" className={({ isActive }) => isActive ? 'menu-active' : ''}>
										Video Grid
									</NavLink>
								</li>
							</>
						}
					</ul>
				</div>
				<div className="navbar-end">
					<div className="dropdown dropdown-end">
						<div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
							{userProfile
								? <div className="w-10 rounded-full">
									<img src={userProfile.getImageUrl()} alt="User Avatar" />
								</div>
								: <i className="text-2xl bi bi-question-circle-fill" />
							}
						</div>
						{userProfile ?
							<ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow bg-base-100 rounded-box w-52">
								<li>
									<Link to="/user-profile">Profile</Link>
								</li>
							</ul>
							:
							<ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow bg-base-100 rounded-box w-52">
								<li>
									<a role="button" className="cursor-pointer" onClick={() => { alert('TODO:') }}>Clear Cache</a>
								</li>
							</ul>
						}
					</div>
				</div>
			</div>
		)
	}

	return (
		<section className="flex flex-col h-screen overflow-hidden">
			{!isSignedIn ?
				renderLogin()
				:
				<>
					{renderTopBar()}
					<main className="flex-1 overflow-y-auto p-4 md:p-6">
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/collections" element={<Collections />} />
							<Route path="/folders" element={<Folders />} />
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
