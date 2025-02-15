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

	return (
		<section>
			<h3>User Profile</h3>
			{isBusyGapiLoad ? <AlertLoading /> : renderProfile()}
		</section>
	)
}

export default UserProfile
