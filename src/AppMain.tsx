/**
 * @see https://medium.com/@willikay11/how-to-link-your-react-application-with-google-drive-api-v3-list-and-search-files-2e4e036291b7
 */
import React, { useState } from 'react';
import { gapi } from 'gapi-script';

interface IGapiCurrUser {
	"le": {
		"wt": {
			/**
			 * Full Name
			 * @example "Git Brent"
			 */
			"Ad": string,
			/**
			 * First Name
			 * @example "Git"
			 */
			"rV": string,
			/**
			 * Last Name
			 * @example "Brent"
			 */
			"uT": string,
			/**
			 * Account Picture
			 * @example "https://lh3.googleusercontent.com/a/ALm5wu3R_tKI4hZd9DbwPh8SShfBYgaNN95WZYZYvfwy=s96-c"
			 */
			"hK": string,
			/**
			 * Email
			 * @example "gitbrent@gmail.com"
			 */
			"cu": string
		}
	},
}

export default function AppMain() {
	const GAPI_CLIENT_ID = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID;
	const GAPI_API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;
	const GAPI_DISC_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
	const GAPI_SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly';

	//const [listDocumentsVisible, setListDocumentsVisibility] = useState(false);
	//const [documents, setDocuments] = useState([]);
	const [isLoadingGoogleDriveApi, setIsLoadingGoogleDriveApi] = useState(false);
	//const [isFetchingGoogleDriveFiles, setIsFetchingGoogleDriveFiles] = useState(false);
	const [signedInUser, setSignedInUser] = useState('');
	//const handleChange = (file) => { };

	/**
	 *  Sign in the user upon button click.
	 */
	const handleAuthClick = () => {
		gapi.auth2.getAuthInstance().signIn();
	};

	/**
	 *  Called when the signed in status changes, to update the UI
	 *  appropriately. After a sign-in, the API is called.
	 */
	const updateSigninStatus = (isSignedIn) => {
		if (isSignedIn) {
			const currentUser: IGapiCurrUser = gapi.auth2.getAuthInstance().currentUser;

			// Set the signed in user
			setSignedInUser(currentUser?.le?.wt?.Ad);
			setIsLoadingGoogleDriveApi(false);

			// list files if user is authenticated
			// TODO: listFiles();
		} else {
			// prompt user to sign in
			handleAuthClick();
		}
	};

	/**
	 *  Initializes the API client library and sets up sign-in state listeners.
	 */
	const initClient = () => {
		setIsLoadingGoogleDriveApi(true);
		gapi.client
			.init({
				apiKey: GAPI_API_KEY,
				clientId: GAPI_CLIENT_ID,
				discoveryDocs: GAPI_DISC_DOCS,
				scope: GAPI_SCOPES,
			})
			.then(
				() => {
					// Listen for sign-in state changes.
					gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

					// Handle the initial sign-in state.
					updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
				},
				(error) => {
					console.error(error);
				}
			);
	};

	const handleClientLoad = () => {
		gapi.load('client:auth2', initClient);
	};

	return (
		<main className='text-center'>
			<section onClick={() => handleClientLoad()} className="">
				{signedInUser && <div>SIGNED IN as {signedInUser}</div>}
				{isLoadingGoogleDriveApi && <div>LOADING</div>}
				<div className="p-4 bg-dark">
					<img height="100" width="100" src="https://raw.githubusercontent.com/willikay11/React-Google-Drive-Tutorial/master/src/assets/images/google-drive.png" alt="GoogleDriveImage" />
					<h5>Google Drive</h5>
					<span>Import documents straight from your google drive</span>
				</div>
			</section>
		</main>
	)
}
