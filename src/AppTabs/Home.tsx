import React, { useMemo } from 'react'
import { FileSizeThresholds, IFileAnalysis, IGapiFile } from '../App.props'
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

	function renderFilesByType(): JSX.Element {
		const totalFiles = fileAnalysis.total_files
		const calculatePercent = (count: number, total: number) => {
			return (count / total) * 100
		}

		return (
			<div className="bg-secondary p-4 my-4">
				<div className='row align-items-center'>
					<div className='col'><h4 className='mb-0'>Files by Type</h4></div>
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

	function renderFilesBySize(): JSX.Element {
		const calculatePercent = (size: number, total: number) => {
			return (size / total) * 100
		}
		const formatBytes = (bytes: number, decimals = 2) => {
			if (bytes === 0) return '0 Bytes'
			const k = 1024
			const dm = decimals < 0 ? 0 : decimals
			const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
			const i = Math.floor(Math.log(bytes) / Math.log(k))
			return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
		}

		return (
			<div className="bg-secondary p-4 my-4">
				<div className='row align-items-center'>
					<div className='col'><h4 className='mb-0'>Files by Size</h4></div>
					<div className='col-auto'>
						<span className="badge bg-primary rounded-pill mb-0" style={{ fontSize: '18px' }}>
							{formatBytes(fileAnalysis.total_size)}
						</span>
					</div>
				</div>
				{Object.entries(FileSizeThresholds)
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					.filter(([_, size]) => size !== FileSizeThresholds.Huge)
					.map(([category, size], index) => {
						const catTotal = fileAnalysis.size_categories[category]
						const percent = calculatePercent(catTotal, fileAnalysis.total_files)
						return (
							<div key={index} className="card mt-4">
								<div className="card-body">
									<div className="row align-items-center mb-2">
										<div className="col">
											<h5 className="mb-0">{category} <span className="h6 text-muted ms-2">({formatBytes(size)})</span></h5>
										</div>
										<div className="col-auto">
											<span className="badge bg-primary">{catTotal}</span>
										</div>
									</div>
									<div className="progress">
										<div className="progress-bar" role="progressbar" title={`${percent}%`} style={{ width: `${percent}%` }} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} />
									</div>
								</div>
							</div>
						)
					})}
			</div>
		)
	}

	function renderFilesByYear(): JSX.Element {
		const totalFiles = fileAnalysis.total_files
		const calculatePercent = (count: number, total: number) => {
			return (count / total) * 100
		}

		return (
			<div className="bg-secondary p-4 my-4">
				<div className='row align-items-center'>
					<div className='col'><h4 className='mb-0'>Files By Year</h4></div>
					<div className='col-auto'>
						<span className="badge bg-primary rounded-pill mb-0" style={{ fontSize: '18px' }}>{fileAnalysis.total_files}</span>
					</div>
				</div>
				<div className='row row-cols-1 row-cols-md-2'>
					{Object.entries(fileAnalysis.file_years)
						.sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
						.map(([year, count], index) => {
							const percent = calculatePercent(count, totalFiles)
							return (
								<div key={`${year}${index}`} className="col">
									<div className="card mt-4">
										<div className="card-body">
											<div className='row align-items-center mb-2'>
												<div className='col'><h5 className="mb-0">{year}</h5></div>
												<div className='col-auto'><span className="badge bg-primary">{count}</span></div>
											</div>
											<div className="progress">
												<div className="progress-bar" role="progressbar" title={`${percent}%`} style={{ width: `${percent}%` }} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} />
											</div>
										</div>
									</div>
								</div>
							)
						})}
				</div>
			</div>
		)
	}

	function renderTopFileNames(): JSX.Element {
		function renderColumn(startIndex: number, endIndex: number) {
			return Object.entries(fileAnalysis.common_names)
				.sort(([, a], [, b]) => b - a)
				.slice(startIndex, endIndex)
				.map(([type, count], index) => (
					<ul key={`${type}${index}`} className="list-group">
						<li className="list-group-item d-flex justify-content-between align-items-center">
							<strong>{type}</strong>
							<span className="badge bg-primary rounded-pill">{count}</span>
						</li>
					</ul>
				))
		}

		const entriesLength = Object.entries(fileAnalysis.common_names).length
		const columns = []
		const itemsPerColumn = entriesLength / 5
		const totalColumns = Math.ceil(Math.min(entriesLength, entriesLength) / itemsPerColumn)

		for (let i = 0; i < totalColumns; i++) {
			const startIndex = i * itemsPerColumn
			const endIndex = startIndex + itemsPerColumn
			columns.push(
				<div className="col" key={i}>
					{renderColumn(startIndex, endIndex)}
				</div>
			)
		}

		return (
			<div className="bg-secondary p-4 my-4">
				<h4>Top {entriesLength} File Names</h4>
				<div className="row mt-4">{columns}</div>
			</div>
		)
	}

	function renderHome(): JSX.Element {
		return (<section className='p-4'>
			<h5>Welcome {authUserName}!</h5>
			<div className='row'>
				<div className='col-12 col-md'>{renderFilesBySize()}</div>
				<div className='col-12 col-md'>{renderFilesByYear()}</div>
				<div className='col-12 col-md'>{renderFilesByType()}</div>
				<div className='col-12 col-md-12'>{renderTopFileNames()}</div>
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
