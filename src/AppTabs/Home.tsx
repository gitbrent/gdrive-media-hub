import React, { useMemo } from 'react'
import { IFileAnalysis, IGapiFile } from '../App.props'
import '../css/Home.css'

interface Props {
	authUserName: string | null
	allFiles: IGapiFile[]
	getFileAnalysis: () => IFileAnalysis
	isBusyGapiLoad: boolean
	handleAuthClick: () => void
}

const Home: React.FC<Props> = ({ authUserName, allFiles, getFileAnalysis, isBusyGapiLoad, handleAuthClick }) => {
	const fileAnalysis = useMemo(() => { return getFileAnalysis() }, [allFiles])

	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar sticky-top bg-dark">
				<div className="container-fluid">
					<div className="row align-items-center">
						<div className='col-auto d-none d-lg-block'>
							<a className="navbar-brand text-white"><i className="bi-house me-2" />Home</a>
						</div>
					</div>
				</div>
			</nav>
		)
	}

	function renderLogin(): JSX.Element {
		return (
			<div id="contHome">
				<div id="loginCont" className="text-center cursor-link bg-secondary p-4 rounded" onClick={handleAuthClick}>
					<img src="/google-drive.png" alt="GoogleDriveLogo" className='w-25' />
					<div className='my-3'>
						<div className="display-6">Google Drive</div>
						<div className="display-6">Media Viewer</div>
					</div>
					{isBusyGapiLoad
						? <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
						: <div className="text-muted mt-3">click to connect</div>
					}
				</div>
			</div>
		)
	}

	function renderImageTypes(): JSX.Element {
		const totalFiles = fileAnalysis.total_files
		const calculatePercent = (count: number, total: number) => {
			return (count / total) * 100
		}

		return (<div className="bg-secondary p-4 my-4">
			<h3>Image Types</h3>
			{Object.keys(fileAnalysis.file_types).map((type, index) => {
				const count = fileAnalysis.file_types[type]
				const percent = calculatePercent(count, totalFiles)

				return (
					<div key={index} className="card mt-3">
						<div className="card-body">
							<div className='row align-items-center mb-2'>
								<div className='col'><h5 className="mb-0">{type}</h5></div>
								<div className='col-auto'><span className="badge bg-primary">{count}</span></div>
							</div>
							<div className="progress">
								<div className="progress-bar" role="progressbar" style={{ width: `${percent}%` }} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} />
							</div>
						</div>
					</div>
				)
			})}
		</div>)
	}

	function renderHome(): JSX.Element {
		console.log('getFileAnalysis', fileAnalysis)
		console.log('fileAnalysis.common_names', fileAnalysis.common_names)

		return (<section className='p-4'>
			<h5>Connected!</h5>
			<div className='row'>
				<div className="col" data-desc="total-images">
					<div className="bg-secondary p-4 my-4">
						<h3>Total Images</h3>
						<div>{allFiles.length}</div>
					</div>
				</div>
				<div className='col' data-desc="image-types">
					{renderImageTypes()}
				</div>
				<div className='col' data-desc="common-names">
					<div className="bg-secondary p-4 my-4">
						<h3>Common Names</h3>
						{Object.entries(fileAnalysis.common_names).sort(([, a], [, b]) => b - a).map(([type, count], index) => (
							<ul key={`${type}${index}`} className="list-group">
								<li className="list-group-item d-flex justify-content-between align-items-center">
									<strong>{type}</strong>
									<span className="badge bg-primary rounded-pill">{count}</span>
								</li>
							</ul>
						))}
					</div>
				</div>
			</div>
		</section>)
	}

	return (
		<section>
			{renderTopBar()}
			{authUserName ? renderHome() : renderLogin()}
		</section>
	)
}

export default Home
