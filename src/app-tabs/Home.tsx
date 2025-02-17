import { useContext } from 'react'
import { FileSizeThresholds, formatBytes, IFileAnalysis } from '../App.props'
import { getFileAnalysis } from '../api-google/utils/fileAnalysis'
import { AuthContext } from '../api-google/AuthContext'
import { DataContext } from '../api-google/DataContext'
import '../css/Home.css'

const Home: React.FC = () => {
	const { isSignedIn, signIn } = useContext(AuthContext)
	const { mediaFiles, userProfile } = useContext(DataContext)
	const fileAnalysis: IFileAnalysis = getFileAnalysis(mediaFiles)

	// --------------------------------------------------------------------------------------------

	function renderLogin(): JSX.Element {
		return (
			<section id="contHome" className="m-5">
				<div id="loginCont" className="text-center cursor-link bg-black p-4 rounded" onClick={signIn}>
					<img src="/google-drive.png" alt="GoogleDriveLogo" className="w-25" />
					<div className="my-3">
						<div className="display-6">Google Drive</div>
						<div className="display-6">Media Viewer</div>
					</div>
					<div id="loginContClick" className="text-muted mt-3">click to connect</div>
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
			<div className="bg-black p-4">
				<div className="row align-items-center mb-4">
					<div className='col'><h4 className='mb-0'>Files by Type</h4></div>
					<div className='col-auto'>
						<span className="badge bg-primary rounded-pill fw-lighter mb-0" style={{ fontSize: '1rem' }}>
							{fileAnalysis.total_files}
						</span>
					</div>
				</div>
				<div className="row row-cols-1 row-cols-md-2 g-4">
					{Object.entries(fileAnalysis.file_types)
						.sort(([, a], [, b]) => b - a)
						.map(([type, count], index) => {
							const percent = Math.round(calculatePercent(count, totalFiles))
							return (
								<div key={index} className="col">
									<div className="card">
										<div className="card-body">
											<div className='row align-items-center mb-2'>
												<div className='col'><h5 className="mb-0">{type}</h5></div>
												<div className='col-auto d-none d-lg-block'><span className="badge bg-primary">{count}</span></div>
											</div>
											<div className="progress" title={`${percent}%`}>
												<div className="progress-bar" role="progressbar" style={{ width: `${percent}%` }} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} />
											</div>
										</div>
									</div>
								</div>
							)
						})
					}
				</div>
			</div>
		)
	}

	function renderFilesBySize(): JSX.Element {
		const calculatePercent = (size: number, total: number) => {
			return (size / total) * 100
		}

		return (
			<div className="bg-black p-4">
				<div className="row align-items-center flex-nowrap mb-4">
					<div className='col'><h4 className='mb-0'>Files by Size</h4></div>
					<div className='col-auto'>
						<span className="badge bg-primary rounded-pill fw-lighter mb-0" style={{ fontSize: '1rem' }}>
							{formatBytes(fileAnalysis.total_size)}
						</span>
					</div>
				</div>
				<div className="row row-cols-1 row-cols-md-2 g-4">
					{Object.entries(FileSizeThresholds)
						.map(([category, size], index) => {
							const catTotal = fileAnalysis.size_categories[category] || 0
							const percent = Math.round(calculatePercent(catTotal, fileAnalysis.total_files))
							return (
								<div key={index} className="col">
									<div className="card">
										<div className="card-body">
											<div className="row align-items-center mb-2">
												<div className="col text-nowrap">
													<h5 className="mb-0">{category} <span className="h6 mb-0 text-muted ms-2 d-none d-xl-inline-block">({formatBytes(size)})</span></h5>
												</div>
												<div className="col-auto d-none d-lg-block">
													<span className="badge bg-primary">{catTotal}</span>
												</div>
											</div>
											<div className="progress" title={`${percent}%`}>
												<div className="progress-bar" role="progressbar" style={{ width: `${percent}%` }} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} />
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

	function renderFilesByYear(): JSX.Element {
		const totalFiles = fileAnalysis.total_files
		const currentYear = new Date().getFullYear()
		const calculatePercent = (count: number, total: number) => {
			return Math.round((count / total) * 100)
		}
		let overTenYearsCount = 0

		const sortedFileYears = Object.entries(fileAnalysis.file_years)
			.sort((a, b) => parseInt(a[0]) - parseInt(b[0]))

		// Sum counts for years more than 10 years ago
		sortedFileYears.forEach(([year, count]) => {
			if (currentYear - parseInt(year) > 10) {
				overTenYearsCount += count
			}
		})

		return (
			<div className="bg-black p-4">
				<div className='row align-items-center'>
					<div className='col'><h4 className='mb-0'>Files By Year</h4></div>
					<div className='col-auto'>
						<span className="badge bg-primary rounded-pill fw-lighter mb-0" style={{ fontSize: '1rem' }}>
							{fileAnalysis.total_files}
						</span>
					</div>
				</div>
				<div className='row row-cols row-cols-md-4 row-cols-xl-6'>
					{sortedFileYears
						.filter(([year]) => currentYear - parseInt(year) <= 10)
						.map(([year, count], index) => {
							const percent = Math.round(calculatePercent(count, totalFiles))
							return (
								<div key={`${year}${index}`} className="col">
									<div className="card mt-4">
										<div className="card-body">
											<div className='row align-items-center gx-0 flex-nowrap mb-2'>
												<div className='col'><h5 className="mb-0">{year}</h5></div>
												<div className='col-auto'><span className="badge bg-primary">{count}</span></div>
											</div>
											<div className="progress" title={`${percent}%`}>
												<div className="progress-bar" role="progressbar" style={{ width: `${percent}%` }} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} />
											</div>
										</div>
									</div>
								</div>
							)
						})
					}
					{overTenYearsCount > 0 && (
						<div key="over10" className="col order-first">
							<div className="card mt-4">
								<div className="card-body">
									<div className='row align-items-center flex-nowrap mb-2'>
										<div className='col'><h5 className="mb-0">Older</h5></div>
										<div className='col-auto'><span className="badge bg-primary">{overTenYearsCount}</span></div>
									</div>
									<div className="progress">
										<div className="progress-bar" role="progressbar" title={`${calculatePercent(overTenYearsCount, totalFiles)}%`} style={{ width: `${calculatePercent(overTenYearsCount, totalFiles)}%` }} aria-valuenow={calculatePercent(overTenYearsCount, totalFiles)} aria-valuemin={0} aria-valuemax={100} />
									</div>
								</div>
							</div>
						</div>
					)}
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
			<div className="bg-black p-4">
				<div className="row align-items-center mb-4">
					<div className='col'><h4 className='mb-0'>Top Filenames</h4></div>
					<div className='col-auto'>
						<span className="badge bg-primary rounded-pill fw-lighter mb-0" style={{ fontSize: '1rem' }}>
							{entriesLength}
						</span>
					</div>
				</div>
				<div className="row g-4">{columns}</div>
			</div>
		)
	}

	function renderHome(): JSX.Element {
		return (
			<section>
				<h3 className='mt-2 mb-4'>Welcome {userProfile?.getName()}!</h3>
				<div className='row row-cols g-4'>
					<div className='col-12 col-md'>{renderFilesBySize()}</div>
					<div className='col-12 col-md'>{renderFilesByType()}</div>
					<div className='col-12'>{renderFilesByYear()}</div>
					<div className='col-12'>{renderTopFileNames()}</div>
				</div>
			</section>
		)
	}

	// --------------------------------------------------------------------------------------------

	return (isSignedIn ? renderHome() : renderLogin())
}

export default Home
