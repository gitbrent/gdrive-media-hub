import { useContext } from 'react'
import { IFileAnalysis } from '../App.props'
import { getFileAnalysis } from '../api-google/utils/fileAnalysis'
import { DataContext } from '../api-google/DataContext'
import AlertLoading from '../components/AlertLoading'
import HomeMetrics from './HomeMetrics'
import '../css/Home.css'

const Home: React.FC = () => {
	const { mediaFiles, userProfile, isLoading } = useContext(DataContext)
	const fileAnalysis: IFileAnalysis = getFileAnalysis(mediaFiles)

	// --------------------------------------------------------------------------------------------

	function renderHome(): JSX.Element {
		return (
			<section>
				<h3 className='mt-2 mb-4'>Welcome {userProfile?.getName()}!</h3>
				<HomeMetrics analysis={fileAnalysis} />
			</section>
		)
	}

	// --------------------------------------------------------------------------------------------

	return (
		<>
			{isLoading && <AlertLoading />}
			{!isLoading && renderHome()}
		</>
	)
}

export default Home
