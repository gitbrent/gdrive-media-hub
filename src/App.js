/**
 * @see https://console.firebase.google.com/u/0/project/gdrive-media-hub/
 * @see https://console.cloud.google.com/apis/credentials?project=gdrive-media-hub
 * @see https://medium.com/@willikay11/how-to-link-your-react-application-with-google-drive-api-v3-list-and-search-files-2e4e036291b7
 * @see https://github.com/partnerhero/gapi-script
 * ...
 * @see https://www.youtube.com/watch?v=IPyl0igVkH4&t=287s
 * @see https://www.youtube.com/watch?v=TFIt9o6BWqA (HOWTO: process.env)
 */
import React from "react"
import AppMain from './AppMain.tsx'
import "./bootstrap.min.css"

function App() {
	return (
		<div className="container">
			<header>
				<h1>Google Drive Media Hub</h1>
			</header>
			<AppMain />
		</div>
	)
}

export default App
