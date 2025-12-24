import { useContext } from 'react'
import { IFileAnalysis } from '../App.props'
import { getFileAnalysis } from '../api-google/utils/fileAnalysis'
import { DataContext } from '../api-google/DataContext'
import AlertLoading from '../components/AlertLoading'
import HomeMetrics from './HomeMetrics'

const Home: React.FC = () => {
	const { mediaFiles, isLoading } = useContext(DataContext)
	const fileAnalysis: IFileAnalysis = getFileAnalysis(mediaFiles)

	// --------------------------------------------------------------------------------------------

	return (
		<>
			{isLoading && <AlertLoading />}
			{!isLoading && <HomeMetrics analysis={fileAnalysis} />}
		</>
	)
}

export default Home
