import React, { useEffect, useState } from 'react'
import { AuthState, IAuthState, IFileListCache } from '../App.props'
import AlertLoading from '../components/AlertLoading'

interface Props {
	getUserAuthState: () => IAuthState
	getCacheStatus: () => Promise<IFileListCache | null>
	handleClearFileCache: () => void
	isBusyGapiLoad: boolean
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
				<div className='col'>
					{userAuthState &&
						<div className='card h-100'>
							<div className={`card-header ${userAuthState.status === AuthState.Authenticated ? 'text-bg-success' : 'text-bg-warning'}`}>
								<h5 className="mb-0">Auth Status</h5>
							</div>
							<div className='card-body'>
								<div className='row align-items-center'>
									<div className='col-auto'>
										<img src={userAuthState.userPict} alt="User Avatar" className="rounded-circle" style={{ fontSize: '1rem' }} />
									</div>
									<div className='col'>
										<h5 className="mb-0">{userAuthState.userName}</h5>
									</div>
								</div>
							</div>
						</div>
					}
				</div>
				<div className="col">
					<div className='card h-100'>
						<div className='card-header'>
							<h5 className="mb-0">File Cache</h5>
						</div>
						<div className='card-body'>
							<div className='row align-items-center mt-0'>
								<div className='col'>Time Stamp</div>
								<div className='col-auto'>{new Date(cacheStatus?.timeStamp as number).toLocaleString()}</div>
							</div>
							<div className='row align-items-center mt-3'>
								<div className='col'>File Count</div>
								<div className='col-auto'>{cacheStatus?.gapiFiles?.length}</div>
							</div>
						</div>
						<div className='card-footer'>
							<button type="button" className="btn btn-danger" onClick={handleClearFileCache}>Clear File Cache</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<>
			<nav className="navbar sticky-top bg-dark">
				<div className="container-fluid">
					<div className="row align-items-center">
						<div className='col-auto d-none d-lg-block'>
							<a className="navbar-brand text-white"><i className="bi-person-circle me-2" />User Profile</a>
						</div>
					</div>
				</div>
			</nav>
			<section className='p-4'>
				<h3>User Profile</h3>
				{isBusyGapiLoad ? <AlertLoading /> : renderProfile()}
			</section>
		</>
	)
}

export default UserProfile
