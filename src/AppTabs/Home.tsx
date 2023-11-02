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
			<section id="contHome" className='m-5'>
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
			</section>
		)
	}

	function renderTotalFiles(): JSX.Element {
		return (
			<div className="bg-secondary p-4 my-4">
				<h4>File Overview</h4>
				<div className="card mt-4">
					<div className="card-body">
						<div className='row align-items-center mb-2'>
							<div className='col'><h5 className="mb-0">Total Images</h5></div>
							<div className='col-auto'><span className="badge bg-primary">{allFiles.length}</span></div>
						</div>
						<div className="progress">
							<div className="progress-bar" role="progressbar" style={{ width: '100%' }} aria-valuenow={100} aria-valuemin={0} aria-valuemax={100} />
						</div>
					</div>
				</div>
			</div>
		)
	}

	function renderImageTypes(): JSX.Element {
		const totalFiles = fileAnalysis.total_files
		const calculatePercent = (count: number, total: number) => {
			return (count / total) * 100
		}

		return (
			<div className="bg-secondary p-4 my-4">
				<div className='row align-items-center'>
					<div className='col'><h4 className='mb-0'>File Types</h4></div>
					<div className='col-auto'>
						<span className="badge bg-primary rounded-pill mb-0" style={{ fontSize: '18px' }}>{fileAnalysis.total_files}</span>
					</div>
				</div>
				{Object.entries(fileAnalysis.file_types)
					.sort(([, a], [, b]) => b - a)
					.map(([type, count], index) => {
						const percent = calculatePercent(count, totalFiles)
						return (
							<div key={index} className="card mt-4">
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
					})
				}
			</div>
		)
	}

	function renderTopFileNames(): JSX.Element {
		return (<div className="bg-secondary p-4 my-4">
			<h4>Top File Names</h4>
			<div className="row mt-4">
				<div className="col">
					{Object.entries(fileAnalysis.common_names)
						.sort(([, a], [, b]) => b - a)
						.slice(0, 8)
						.map(([type, count], index) => (
							<ul key={`${type}${index}`} className="list-group">
								<li className="list-group-item d-flex justify-content-between align-items-center">
									<strong>{type}</strong>
									<span className="badge bg-primary rounded-pill">{count}</span>
								</li>
							</ul>
						))}
				</div>
				<div className="col">
					{Object.entries(fileAnalysis.common_names)
						.sort(([, a], [, b]) => b - a)
						.slice(8, 16)
						.map(([type, count], index) => (
							<ul key={`${type}${index}`} className="list-group">
								<li className="list-group-item d-flex justify-content-between align-items-center">
									<strong>{type}</strong>
									<span className="badge bg-primary rounded-pill">{count}</span>
								</li>
							</ul>
						))}
				</div>
				{Object.entries(fileAnalysis.common_names)?.length > 16 &&
					<div className="col">
						{Object.entries(fileAnalysis.common_names)
							.sort(([, a], [, b]) => b - a)
							.slice(16, 24)
							.map(([type, count], index) => (
								<ul key={`${type}${index}`} className="list-group">
									<li className="list-group-item d-flex justify-content-between align-items-center">
										<strong>{type}</strong>
										<span className="badge bg-primary rounded-pill">{count}</span>
									</li>
								</ul>
							))}
					</div>
				}
			</div>
		</div>)
	}

	function renderHome(): JSX.Element {
		return (<section className='p-4'>
			<h5>Welcome {authUserName}!</h5>
			<div className='row'>
				{/*<div className='col'>{renderTotalFiles()}</div>*/}
				<div className='col-12 col-md-4'>{renderImageTypes()}</div>
				<div className='col-12 col-md-8'>{renderTopFileNames()}</div>
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
