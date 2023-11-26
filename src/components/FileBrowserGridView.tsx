import React from 'react'
import { IMediaFile } from '../App.props'

interface Props {
	allFiles: IMediaFile[]
}

const FileBrowserGridView: React.FC<Props> = ({ allFiles }) => {
	// Implement the grid view logic here, based on ImageGrid.tsx

	return (
		<div>
			<span>TODO:</span>
			<div>{allFiles.length}</div>
		</div>
	)
}

export default FileBrowserGridView
