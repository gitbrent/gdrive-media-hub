import { useContext, useState } from 'react'
import { DEBUG, APP_BLD, APP_VER, formatBytes } from '../App.props'
import { AuthContext } from '../api-google/AuthContext'
import { DataContext } from '../api-google/DataContext'
import { loadCacheFromIndexedDB, doClearFileCache, cleanupOldCaches, CACHE_DBASE_VER } from '../api/CacheService'
import { getCurrentUserProfile } from '../api-google'
import { getFileAnalysis } from '../api-google/utils/fileAnalysis'
import AlertLoading from '../components/AlertLoading'

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
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
				<div data-desc="User Profile">
					{isSignedIn &&
						<div className="card bg-base-100 card-border border-base-300 border-2 h-full">
							<div className="card-body">
								<h2 className="card-title text-success">Google Account</h2>
								<div className="flex items-center gap-4">
									<img src={userProfile?.getImageUrl() || ''} alt="User Avatar" className="w-16 h-16 rounded-full" />
									<div className="flex-1">
										<h3 className="font-bold text-lg">{userProfile?.getName() || ''}</h3>
										<p className="text-sm text-base-content/70">{userProfile?.getEmail() || ''}</p>
									</div>
								</div>
							</div>
							<div className="divider my-0"></div>
							<div className="card-actions justify-center gap-2 p-4">
								<button type="button" className="btn btn-warning" onClick={() => signOut()}>
									<i className="bi bi-box-arrow-right"></i>Sign Out
								</button>
								<button type="button" className="btn btn-error" onClick={async () => {
									await doClearFileCache()
									clearData()
									signOut()
								}}>
									<i className="bi bi-trash3"></i>Sign Out & Clear Cache
								</button>
							</div>
						</div>
					}
				</div>
				<div data-desc="App Info">
					<div className="card bg-base-100 card-border border-base-300 border-2 h-full">
						<div className="card-body space-y-4">
							<h2 className="card-title text-info">Application Info</h2>
							<div className="flex justify-between items-center">
								<span className="text-base-content/70">Version</span>
								<span className="text-2xl">{APP_VER}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-base-content/70">Build</span>
								<span className="text-2xl">{APP_BLD}</span>
							</div>
						</div>
						<div className="divider my-0"></div>
						<div className="card-actions justify-center p-4">
							<a href="https://github.com/brentely/gdrive-media-hub" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-outline">
								<i className="bi bi-github"></i>View on GitHub
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
			<div className="mt-6">
				<div className="card bg-base-100 card-border border-base-300 border-2">
					<div className="card-body pb-2">
						<div className="grid grid-cols-[1fr_auto] items-start gap-4">
							<h2 className="card-title text-primary m-0">Media Database Cache</h2>
							<span className={`badge badge-lg ${cacheTimestamp ? 'badge-success' : 'badge-neutral'}`}>
								{cacheTimestamp ? 'Active' : 'Empty'}
							</span>
						</div>
					</div>
					<div className="card-body">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<div className="bg-base-300 p-4 rounded-lg text-center border-l-4 border-l-primary">
								<h6 className="text-xs font-bold text-base-content/60 uppercase mb-2">Database Name</h6>
								<p className="font-light text-2xl text-primary truncate" title={dbName}>
									{dbName}
								</p>
								<div className="badge badge-primary mt-2 text-xs">IndexedDB v{CACHE_DBASE_VER}</div>
							</div>
							<div className="bg-base-300 p-4 rounded-lg text-center border-l-4 border-l-info">
								<h6 className="text-xs font-bold text-base-content/60 uppercase mb-2">Total Files</h6>
								<h2 className="font-light text-3xl text-info mb-2">{analysis.total_files}</h2>
								<div className="badge badge-info text-xs">
									{imageCount} images · {videoCount} videos
								</div>
							</div>
						<div className="bg-base-300 p-4 rounded-lg text-center border-l-4 border-l-warning">
							<h6 className="text-xs font-bold text-base-content/60 uppercase mb-2">Total Size</h6>
							<h2 className="font-light text-3xl text-warning mb-2">{formatBytes(analysis.total_size)}</h2>
								<div className="badge badge-warning text-xs">
									Avg: {analysis.total_files ? formatBytes(analysis.total_size / analysis.total_files) : '0 B'}
								</div>
							</div>
							<div className="bg-base-300 p-4 rounded-lg text-center border-l-4 border-l-success">
								<h6 className="text-xs font-bold text-base-content/60 uppercase mb-2">Last Updated</h6>
								<h2 className="font-light text-3xl text-success mb-2">
									{cacheTimestamp ? new Date(cacheTimestamp).toLocaleDateString() : 'Never'}
								</h2>
								<div className="badge badge-success text-xs" title={cacheTimestamp ? new Date(cacheTimestamp).toISOString() : ''}>
									{cacheTimestamp ? new Date(cacheTimestamp).toLocaleTimeString() : 'No cache'}
								</div>
							</div>
						</div>
					</div>
					<div className="divider my-0"></div>
					<div className="card-actions justify-center gap-2 p-4 flex-wrap">
						<button
							type="button"
							className="btn btn-info btn-outline"
							onClick={handleToggleCacheData}
							disabled={loadingCache}
						>
							<i className="bi bi-code-square"></i>
							{loadingCache ? 'Loading...' : showCacheData ? 'Hide Cache Data' : 'Show Cache Data'}
						</button>
						{DEBUG && (
							<button
								type="button"
								className="btn btn-warning btn-outline"
								onClick={handleCleanupOldCaches}
								title="Remove old misnamed cache databases"
							>
								<i className="bi bi-recycle"></i>Cleanup Old Caches
							</button>
						)}
						<button type="button" className="btn btn-error" onClick={handleClearCache}>
							<i className="bi bi-trash"></i>Clear Cache
						</button>
					</div>
				</div>
			</div>
		)
	}

	// --------------------------------------------------------------------------------------------

	function showCacheDataSection(): JSX.Element {
		return (
			<div className="card bg-base-100 shadow-xl mt-4">
				<div className="card-body">
					<h2 className="card-title text-base">Cache Data (IndexedDB)</h2>
					<div className="max-h-96 overflow-auto bg-base-200 p-4 rounded-lg">
						<pre className="text-xs whitespace-pre-wrap wrap-break-word font-mono">
							<code>{cacheData}</code>
						</pre>
					</div>
				</div>
			</div>
		)
	}

	function renderUploadSection(): JSX.Element {
		// NOTE: UNUSED - for testing uploads during development
		return (
			<div className="hidden mt-4">
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h2 className="card-title">Upload Test Media</h2>
						<div className="form-control">
							<label className="label">
								<span className="label-text">Upload images or videos to your Google Drive for testing</span>
							</label>
							<input
								id="fileUpload"
								type="file"
								className="file-input file-input-bordered"
								accept="image/*,video/*"
								onChange={handleFileUpload}
								disabled={uploading}
							/>
						</div>
						{uploading && (
							<div className="alert alert-info">
								<span className="loading loading-spinner"></span>
								<span>Uploading file...</span>
							</div>
						)}
						{uploadStatus && !uploading && (
							<div className={`alert ${uploadStatus.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>
								<span>{uploadStatus}</span>
							</div>
						)}
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
