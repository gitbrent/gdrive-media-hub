/**
 * @see https://developers.google.com/drive/api/guides/about-sdk
 * @see https://developers.google.com/drive/api/guides/search-files#node.js
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

interface IGapiDoc {
	/**
	 * id
	 * @example "1l5mVFTysjVoZ14_unp5F8F3tLH7Vkbtc"
	 */
	id: string
	/**
	 * created time (ISO format)
	 * @example "2022-11-21T14:54:14.453Z"
	 */
	createdTime: string
	/**
	 * mime type
	 * @example "application/json"
	 */
	mimeType: string
	/**
	 * modified time (ISO format)
	 * @example "2022-11-21T14:54:14.453Z"
	 */
	modifiedTime: string
	/**
	 * file name
	 * @example "some-file.json"
	 */
	name: string
	/**
	 * file size (bytes)
	 * - only populated for files
	 * @example "3516911"
	 */
	size?: string
}

enum FileIcons {
	'application/vnd.google-apps.folder' = 'folder',
	'application/vnd.google-apps.document' = 'doc',
	'application/vnd.google-apps.presentation' = 'ppt',
	'application/json' = 'json',
	'text/plain' = "txt",
	'image/png' = "png"
}

export default function AppMain() {
	const GAPI_CLIENT_ID = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID;
	const GAPI_API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;
	const GAPI_DISC_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
	const GAPI_SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly';

	const [documents, setDocuments] = useState<IGapiDoc[]>([]);
	const [isLoadingGoogleDriveApi, setIsLoadingGoogleDriveApi] = useState(false);
	const [isFetchingGoogleDriveFiles, setIsFetchingGoogleDriveFiles] = useState(false);
	const [signedInUser, setSignedInUser] = useState('');
	//const handleChange = (file) => { };

	/**
	 *  Sign in the user upon button click.
	 */
	const handleAuthClick = () => {
		gapi.auth2.getAuthInstance().signIn();
	};

	/**
  *  Sign out the user upon button click.
  */
	const handleSignOutClick = (event) => {
		gapi.auth2.getAuthInstance().signOut();
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
			listFiles();
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

	/**
	 * Print files
	 */
	const listFiles = (searchTerm = null) => {
		setIsFetchingGoogleDriveFiles(true);
		gapi.client.drive.files
			.list({
				pageSize: 15,
				fields: 'nextPageToken, files(id, name, createdTime, mimeType, modifiedTime, size)',
				//q: `${searchTerm} mimeType = 'image/png'`,
				//q: `mimeType = 'image/png'`,
				q: `mimeType = 'image/png' or mimeType = 'image/jpeg'`,
			})
			.then(function(response) {
				setIsFetchingGoogleDriveFiles(false);
				const res = JSON.parse(response.body);
				setDocuments(res.files);
				console.log(res.files);
			});
	};

	function renderTable(): JSX.Element {
		return (<div className='p-4 bg-dark'>
			<table className='table table-sm mb-0'>
				<thead>
					<tr>
						<th>Type</th>
						<th>Filename</th>
						<th>Created</th>
						<th>Modified</th>
						<th className='text-end'>Size (MB)</th>
					</tr>
				</thead>
				<tbody>
					{documents.sort((a, b) => a.name < b.name ? -1 : 1).map((doc) =>
						<tr key={doc.id}>
							<td>{FileIcons[doc.mimeType]}</td>
							<th>{doc.name}</th>
							<td>{new Date(doc.createdTime).toLocaleString()}</td>
							<td>{new Date(doc.modifiedTime).toLocaleString()}</td>
							<td className='text-end'>{doc.size ? (Number(doc.size) / 1024 / 1024).toFixed(1) : ''}</td>
							<td>{doc.mimeType.indexOf('image') > -1 && <img src={`https://drive.google.com/uc?export=view&id=${doc.id}`} alt="img" />}</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>)
	}

	return (
		<main>
			{isLoadingGoogleDriveApi && <div>LOADING</div>}
			{signedInUser ? <section>
				<div className='row align-items-center mb-4'>
					<div className='col'><h5 className='mb-0'>Welcome {signedInUser}</h5></div>
					<div className='col-auto'><button className='btn btn-primary' type='button' onClick={handleSignOutClick}>Logout</button></div>
				</div>
				<div className='p-4 bg-dark'>
					<div className='row row-cols-1 row-cols-md-2 row-cols-lg-4 justify-content-between align-items-center g-4'>
						{documents.sort((a, b) => a.modifiedTime < b.modifiedTime ? -1 : 1).map((doc) =>
							<div className='col'>
								<img src={`https://drive.google.com/uc?export=view&id=${doc.id}`} alt={`${doc.name}`} style={{ width: '100%', height: '100%' }} />
							</div>
						)}
					</div>
				</div>
			</section> :
				<section onClick={() => handleClientLoad()} className="text-center p-4 bg-dark">
					<img height="100" width="100" src="https://raw.githubusercontent.com/willikay11/React-Google-Drive-Tutorial/master/src/assets/images/google-drive.png" alt="GoogleDriveImage" />
					<h5>Google Drive</h5>
					<span>view media directly from your google drive</span>
				</section>
			}
		</main >
	)
}
