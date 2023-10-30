import React from 'react'
import { IGapiFile } from '../App.props'

interface Props {
	authUserName: string | null
	allFiles: IGapiFile[]
	isBusyGapiLoad: boolean
	handleAuthClick: () => void
}

const Home: React.FC<Props> = ({ authUserName, allFiles, isBusyGapiLoad, handleAuthClick }) => {
	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar sticky-top bg-dark">
				<div className="container-fluid">
					<div className="row w-100 align-items-center">
						<div className='col-auto d-none d-lg-block'>
							<a className="navbar-brand text-white"><i className="bi-house me-2" />Home</a>
						</div>
					</div>
				</div>
			</nav>
		)
	}

	function renderLogin(): JSX.Element {
		return (<div id="contHome">
			<div id="loginCont" className="text-center cursor-link" onClick={handleAuthClick}>
				<div className="p-4">
					<img height="150" width="150" src="/google-drive.png" alt="GoogleDriveLogo" />
				</div>
				<h5>Google Drive</h5>
				<p className="text-muted">superior media viewer</p>
				{isBusyGapiLoad && <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>}
			</div>
		</div>)
	}

	function renderHome(): JSX.Element {
		return (<section className='p-4'>
			<h5>Connected!</h5>
			<div className='row'>
				<div className='col' data-desc="sort-by">
					<div className="bg-secondary p-4 my-4">
						<h3>Total Images</h3>
						<div>{allFiles.length}</div>
					</div>
				</div>
			</div>
		</section>)
	}

	return (
		<section className="w-100">
			{renderTopBar()}
			{authUserName ? renderHome() : renderLogin()}
		</section>
	)
}

export default Home
