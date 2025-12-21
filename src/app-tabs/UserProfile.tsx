import { useContext, useState } from 'react'
import { DEBUG, APP_BLD, APP_VER, formatBytes } from '../App.props'
import { AuthContext } from '../api-google/AuthContext'
import { DataContext } from '../api-google/DataContext'
import AlertLoading from '../components/AlertLoading'
import { loadCacheFromIndexedDB, doClearFileCache, cleanupOldCaches, CACHE_DBASE_VER } from '../api/CacheService'
import { getCurrentUserProfile } from '../api-google'
import { getFileAnalysis } from '../api-google/utils/fileAnalysis'

const UserProfile: React.FC = () => {
	const { isSignedIn, signOut } = useContext(AuthContext)
	const { mediaFiles, userProfile, cacheTimestamp, isLoading, clearData } = useContext(DataContext)
	const [uploading, setUploading] = useState(false)
	const [uploadStatus, setUploadStatus] = useState<string>('')
	const [showCacheData, setShowCacheData] = useState(false)
	const [cacheData, setCacheData] = useState<string>('')
	const [loadingCache, setLoadingCache] = useState(false)

	// --------------------------------------------------------------------------------------------

	const handleClearCache = async () => {
		if (confirm('This will clear the local file cache. You will need to refresh data from Google Drive. Continue?')) {
			try {
				await doClearFileCache()
				clearData() // Clear the React state
				alert('Cache cleared successfully')
			} catch (error) {
				console.error('Error clearing cache:', error)
				alert('Failed to clear cache')
			}
		}
	}

	// --------------------------------------------------------------------------------------------

	const handleCleanupOldCaches = async () => {
		if (confirm('This will remove old misnamed cache databases from a previous bug. Continue?')) {
			const result = await cleanupOldCaches()
			if (result.cleaned > 0) {
				alert(`Cleaned up ${result.cleaned} old cache(s): ${result.databases.join(', ')}`)
			} else {
				alert('No old caches found to clean up.')
			}
		}
	}

	// --------------------------------------------------------------------------------------------

	const handleToggleCacheData = async () => {
		if (!showCacheData) {
			// Load the cache data
			setLoadingCache(true)
			try {
				// Get all IndexedDB databases
				const databases = await indexedDB.databases()
				const cache = await loadCacheFromIndexedDB()

				// Truncate gapiFiles array to show only first and last items
				if (cache.gapiFiles && cache.gapiFiles.length > 2) {
					const firstItem = cache.gapiFiles[0]
					const lastItem = cache.gapiFiles[cache.gapiFiles.length - 1]
					const snippedCount = cache.gapiFiles.length - 2

					const truncatedCache = {
						currentUser: userProfile?.getName(),
						currentUserEmail: userProfile?.getEmail(),
						allIndexedDBs: databases.map(db => ({ name: db.name, version: db.version })),
						cacheData: {
							...cache,
							gapiFiles: [
								firstItem,
								`(SNIP! ${snippedCount} items not shown)`,
								lastItem
							]
						}
					}
					setCacheData(JSON.stringify(truncatedCache, null, 2))
				} else {
					const fullCache = {
						currentUser: userProfile?.getName(),
						currentUserEmail: userProfile?.getEmail(),
						allIndexedDBs: databases.map(db => ({ name: db.name, version: db.version })),
						cacheData: cache
					}
					setCacheData(JSON.stringify(fullCache, null, 2))
				}
			} catch (error) {
				console.error('Error loading cache:', error)
				setCacheData(JSON.stringify({ error: 'Failed to load cache data', message: String(error) }, null, 2))
			} finally {
				setLoadingCache(false)
			}
		}
		setShowCacheData(!showCacheData)
	}

	// --------------------------------------------------------------------------------------------

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files
		if (!files || files.length === 0) return

		setUploading(true)
		setUploadStatus('')

		try {
			const file = files[0]
			const boundary = '-------314159265358979323846'
			const delimiter = `\r\n--${boundary}\r\n`
			const closeDelimiter = `\r\n--${boundary}--`

			const metadata = {
				name: file.name,
				mimeType: file.type,
			}

			// Read file as base64
			const reader = new FileReader()
			reader.onload = async (e) => {
				try {
					const fileContent = e.target?.result as ArrayBuffer
					const base64Content = btoa(
						new Uint8Array(fileContent).reduce((data, byte) => data + String.fromCharCode(byte), '')
					)

					const multipartRequestBody =
						delimiter +
						'Content-Type: application/json\r\n\r\n' +
						JSON.stringify(metadata) +
						delimiter +
						`Content-Type: ${file.type}\r\n` +
						'Content-Transfer-Encoding: base64\r\n\r\n' +
						base64Content +
						closeDelimiter

					const response = await gapi.client.request({
						path: '/upload/drive/v3/files',
						method: 'POST',
						params: {
							uploadType: 'multipart',
						},
						headers: {
							'Content-Type': `multipart/related; boundary="${boundary}"`,
						},
						body: multipartRequestBody,
					})

					setUploadStatus(`✓ Uploaded: ${file.name}`)
					console.log('Upload successful:', response.result)

					// Reset file input
					event.target.value = ''
				} catch (error) {
					console.error('Error uploading file:', error)
					setUploadStatus(`✗ Error uploading ${file.name}`)
				} finally {
					setUploading(false)
				}
			}

			reader.readAsArrayBuffer(file)
		} catch (error) {
			console.error('Error reading file:', error)
			setUploadStatus('✗ Error reading file')
			setUploading(false)
		}
	}

	// --------------------------------------------------------------------------------------------

	function renderUserAndAppInfo(): JSX.Element {
		return (
			<div className="row mt-4">
				<div className="col-12 col-md-6" data-desc="User Profile">
					{isSignedIn &&
						<div className="card h-100">
							<div className={`card-header ${userProfile?.getName() ? 'text-bg-success' : 'text-bg-warning'}`}>
								<h5 className="mb-0">Google Account</h5>
							</div>
							<div className="card-body bg-black p-4">
								<div className="row align-items-center">
									<div className="col-auto">
										<img src={userProfile?.getImageUrl() || ''} alt="User Avatar" className="rounded-circle" style={{ fontSize: '1rem' }} />
									</div>
									<div className="col">
										<h4 className="mb-0">{userProfile?.getName() || ''}</h4>
										<h6 className="mt-2">{userProfile?.getEmail() || ''}</h6>
									</div>
								</div>
							</div>
							<div className="card-footer text-center">
								<button type="button" className="btn btn-warning me-2" onClick={() => signOut()}>
									<i className="bi bi-box-arrow-right me-2"></i>Sign Out
								</button>
								<button type="button" className="btn btn-danger" onClick={async () => {
									await doClearFileCache()
									clearData()
									signOut()
								}}>
									<i className="bi bi-box-arrow-right me-2"></i>
									<i className="bi bi-trash3 me-2"></i>Sign Out & Clear Cache
								</button>
							</div>
						</div>
					}
				</div>
				<div className="col-12 col-md-6" data-desc="App Info">
					<div className="card h-100">
						<div className="card-header text-bg-info">
							<h5 className="mb-0">Application Info</h5>
						</div>
						<div className="card-body bg-black p-4">
							<div className="row align-items-center mt-0">
								<div className="col"><h4 className="fw-light mb-0">Version</h4></div>
								<div className="col-auto"><h2 className="fw-light mb-0">{APP_VER}</h2></div>
							</div>
							<div className="row align-items-center mt-4">
								<div className="col"><h4 className="fw-light mb-0">Build</h4></div>
								<div className="col-auto"><h2 className="fw-light mb-0">{APP_BLD}</h2></div>
							</div>
						</div>
						<div className="card-footer text-center">
							<a href="https://github.com/brentely/gdrive-media-hub" target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary">
								<i className="bi bi-github me-2"></i>View on GitHub
							</a>
						</div>
					</div>
				</div>
			</div>
		)
	}

	function renderMediaDatabase(): JSX.Element {
		const profile = getCurrentUserProfile()
		const dbName = `${profile?.getName()}-File-Cache`
		const analysis = getFileAnalysis(mediaFiles)
		const imageCount = analysis.file_types['image'] || 0
		const videoCount = analysis.file_types['video'] || 0

		return (
			<div className="row mt-4">
				<div className="col-12">
					<div className="card">
						<div className="card-header text-bg-primary">
							<div className="row align-items-center">
								<div className="col">
									<h5 className="mb-0">Media Database Cache</h5>
								</div>
								<div className="col-auto">
									<span className="badge bg-light text-dark">{cacheTimestamp ? 'Active' : 'Empty'}</span>
								</div>
							</div>
						</div>
						<div className="card-body bg-black p-4">
							<div className="row g-4">
								<div className="col-12 col-md-6 col-lg-3">
									<div className="text-center p-3 bg-dark rounded">
										<h6 className="text-uppercase text-secondary mb-0">Database Name</h6>
										<h4 className="fw-light text-warning text-truncate mt-2 mb-0" title={dbName}>
											{dbName}
										</h4>
										<div className="badge text-bg-warning">IndexedDB v{CACHE_DBASE_VER}</div>
									</div>
								</div>								<div className="col-12 col-md-6 col-lg-3">
									<div className="text-center p-3 bg-dark rounded">
										<h6 className="text-uppercase text-secondary mb-0">Total Files</h6>
										<h2 className="fw-light text-primary mb-0">{analysis.total_files}</h2>
										<div className="badge text-bg-primary">
											{imageCount} images · {videoCount} videos
										</div>
									</div>
								</div>
								<div className="col-12 col-md-6 col-lg-3">
									<div className="text-center p-3 bg-dark rounded">
										<h6 className="text-uppercase text-secondary mb-0">Total Size</h6>
										<h2 className="fw-light text-info mb-0">{formatBytes(analysis.total_size)}</h2>
										<div className="badge text-bg-info">
											Avg: {analysis.total_files ? formatBytes(analysis.total_size / analysis.total_files) : '0 B'}
										</div>
									</div>
								</div>
								<div className="col-12 col-md-6 col-lg-3">
									<div className="text-center p-3 bg-dark rounded">
										<h6 className="text-uppercase text-secondary mb-0">Last Updated</h6>
										<h2 className="fw-light text-success mb-0">
											{cacheTimestamp ? new Date(cacheTimestamp).toLocaleDateString() : 'Never'}
										</h2>
										<div className="badge text-bg-success" title={cacheTimestamp ? new Date(cacheTimestamp).toISOString() : ''}>
											{cacheTimestamp ? new Date(cacheTimestamp).toLocaleTimeString() : 'No cache'}
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="card-footer text-center">
							<button
								type="button"
								className="btn btn-outline-info me-2"
								onClick={handleToggleCacheData}
								disabled={loadingCache}
							>
								<i className="bi bi-code-square me-2"></i>
								{loadingCache ? 'Loading...' : showCacheData ? 'Hide Cache Data' : 'Show Cache Data'}
							</button>
							{DEBUG && (
								<button
									type="button"
									className="btn btn-outline-warning me-2"
									onClick={handleCleanupOldCaches}
									title="Remove old misnamed cache databases"
								>
									<i className="bi bi-recycle me-2"></i>Cleanup Old Caches
								</button>
							)}
							<button type="button" className="btn btn-outline-danger" onClick={handleClearCache}>
								<i className="bi bi-trash me-2"></i>Clear Cache
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	// --------------------------------------------------------------------------------------------

	function showCacheDataSection(): JSX.Element {
		return (
			<div className="card mt-3">
				<div className="card-header text-bg-secondary">
					<h6 className="mb-0">Cache Data (IndexedDB)</h6>
				</div>
				<div className="card-body bg-dark p-0" style={{ maxHeight: '500px', overflow: 'auto' }}>
					<pre className="mb-0 p-3" style={{
						backgroundColor: '#1e1e1e',
						color: '#d4d4d4',
						fontSize: '12px',
						lineHeight: '1.5',
						fontFamily: 'Consolas, "Courier New", monospace'
					}}>
						<code>{cacheData}</code>
					</pre>
				</div>
			</div>
		)
	}

	function renderUploadSection(): JSX.Element {
		// NOTE: UNUSED - for testing uploads during development
		return (
			<div className="row mt-4 d-none">
				<div className="col">
					<div className="card">
						<div className="card-header text-bg-warning">
							<h5 className="mb-0">Upload Test Media</h5>
						</div>
						<div className="card-body bg-black p-4">
							<div className="mb-3">
								<label htmlFor="fileUpload" className="form-label">
									Upload images or videos to your Google Drive for testing
								</label>
								<input
									id="fileUpload"
									type="file"
									className="form-control"
									accept="image/*,video/*"
									onChange={handleFileUpload}
									disabled={uploading}
								/>
							</div>
							{uploading && (
								<div className="alert alert-info mb-0">
									<div className="spinner-border spinner-border-sm me-2" role="status">
										<span className="visually-hidden">Uploading...</span>
									</div>
									Uploading file...
								</div>
							)}
							{uploadStatus && !uploading && (
								<div className={`alert ${uploadStatus.startsWith('✓') ? 'alert-success' : 'alert-danger'} mb-0`}>
									{uploadStatus}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		)
	}

	// --------------------------------------------------------------------------------------------

	return (
		<section>
			<h3>User Profile</h3>
			{isLoading ? <AlertLoading /> : (
				<>
					{renderUserAndAppInfo()}
					{renderMediaDatabase()}
					{isSignedIn && DEBUG && renderUploadSection()}
					{showCacheData && showCacheDataSection()}
				</>
			)}
		</section>
	)
}

export default UserProfile
