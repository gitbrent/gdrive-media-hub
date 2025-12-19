import { useContext, useState } from 'react'
import { IFileListCache } from '../App.props'
import { AuthContext } from '../api-google/AuthContext'
import { DataContext } from '../api-google/DataContext'
import AlertLoading from '../components/AlertLoading'

interface Props {
	handleClearFileCache?: () => void
	isBusyGapiLoad?: boolean
}

const UserProfile: React.FC<Props> = ({ handleClearFileCache, isBusyGapiLoad }) => {
	const { isSignedIn, signOut } = useContext(AuthContext)
	const { mediaFiles, userProfile } = useContext(DataContext)
	//
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [cacheStatus, _setCacheStatus] = useState<IFileListCache | null>(null)
	const [uploading, setUploading] = useState(false)
	const [uploadStatus, setUploadStatus] = useState<string>('')

	/* WIP: FIXME:
	useEffect(() => {
		const fetchStatus = async () => {
			const status = await getCacheStatus()
			setCacheStatus(status)
		}
		fetchStatus()
	}, [getCacheStatus])
	*/

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

	function renderProfile(): JSX.Element {
		return (
			<div className="row mt-4">
				<div className="col">
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
								<button type="button" className="btn btn-outline-danger" onClick={() => signOut}>Sign Out</button>
							</div>
						</div>
					}
				</div>
				<div className="col">
					<div className="card h-100">
						<div className="card-header text-bg-primary">
							<h5 className="mb-0">Media Database</h5>
						</div>
						<div className="card-body bg-black p-4">
							<div className="row align-items-center mt-0">
								<div className="col"><h4 className="fw-light mb-0">File Count</h4></div>
								<div className="col-auto"><h2 className="fw-light mb-0">{mediaFiles?.length}</h2></div>
							</div>
							<div className="row align-items-center mt-4">
								<div className="col"><h4 className="fw-light mb-0">Time Stamp</h4></div>
								<div className="col-auto" title={cacheStatus?.timeStamp.toString()}>{/*new Date(cacheStatus?.timeStamp as number).toLocaleString()*/}FIXME:</div>
							</div>
						</div>
						<div className="card-footer text-center">
							<button type="button" className="btn btn-outline-danger" onClick={handleClearFileCache}>Clear Cache</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	function renderUploadSection(): JSX.Element {
		return (
			<div className="row mt-4">
				<div className="col">
					<div className="card">
						<div className="card-header text-bg-info">
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

	return (
		<section>
			<h3>User Profile</h3>
			{isBusyGapiLoad ? <AlertLoading /> : (
				<>
					{renderProfile()}
					{isSignedIn && renderUploadSection()}
				</>
			)}
		</section>
	)
}

export default UserProfile
