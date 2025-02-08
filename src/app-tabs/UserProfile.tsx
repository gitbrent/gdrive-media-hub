import { useEffect, useState } from 'react'
import { AuthState, IAuthState, IFileListCache } from '../App.props'
import AlertLoading from '../components/AlertLoading'

interface Props {
	getUserAuthState?: () => IAuthState
	getCacheStatus?: () => Promise<IFileListCache | null>
	handleClearFileCache?: () => void
	isBusyGapiLoad?: boolean
}

const UserProfile: React.FC<Props> = ({ getUserAuthState, getCacheStatus, handleClearFileCache, isBusyGapiLoad }) => {
	const [userAuthState, setUserAuthState] = useState<IAuthState | null>(null)
	const [cacheStatus, setCacheStatus] = useState<IFileListCache | null>(null)

	useEffect(() => {
		const authState = getUserAuthState()
		setUserAuthState(authState)
	}, [getUserAuthState])

	useEffect(() => {
		const fetchStatus = async () => {
			const status = await getCacheStatus()
			setCacheStatus(status)
		}
		fetchStatus()
	}, [getCacheStatus])

	// --------------------------------------------------------------------------------------------

	function renderProfile(): JSX.Element {
		return (
			<div className="row mt-4">
				<div className="col">
					{userAuthState &&
						<div className="card h-100">
							<div className={`card-header ${userAuthState.status === AuthState.Authenticated ? 'text-bg-success' : 'text-bg-warning'}`} title={userAuthState.status}>
								<h5 className="mb-0">Auth Status</h5>
							</div>
							<div className="card-body bg-black">
								<div className="row align-items-center">
									<div className="col-auto">
										<img src={userAuthState.userPict} alt="User Avatar" className="rounded-circle" style={{ fontSize: '1rem' }} />
									</div>
									<div className="col">
										<h4 className="mb-0">{userAuthState.userName}</h4>
									</div>
								</div>
							</div>
							<div className="card-footer text-center">
								<button type="button" className="btn btn-outline-danger" onClick={() => { alert('TODO:') }}>Sign Out</button>
							</div>
						</div>
					}
				</div>
				<div className="col">
					<div className="card h-100">
						<div className="card-header text-bg-primary">
							<h5 className="mb-0">File Cache</h5>
						</div>
						<div className="card-body bg-black">
							<div className="row align-items-center mt-0">
								<div className="col"><h4 className="fw-light mb-0">Time Stamp</h4></div>
								<div className="col-auto">{new Date(cacheStatus?.timeStamp as number).toLocaleString()}</div>
							</div>
							<div className="row align-items-center mt-4">
								<div className="col"><h4 className="fw-light mb-0">File Count</h4></div>
								<div className="col-auto">{cacheStatus?.gapiFiles?.length}</div>
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

	return (
		<section>
			<h3>Welcome!</h3>
			{isBusyGapiLoad ? <AlertLoading /> : renderProfile()}
		</section>
	)
}

export default UserProfile
