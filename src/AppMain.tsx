/**
 * @see https://developers.google.com/drive/api/guides/about-sdk
 * @see https://developers.google.com/drive/api/guides/search-files#node.js
 * @see https://developers.google.com/drive/api/v3/reference/files/get
 * @see https://medium.com/@willikay11/how-to-link-your-react-application-with-google-drive-api-v3-list-and-search-files-2e4e036291b7
 */
import React, { useEffect, useState } from 'react';
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

interface IGapiFile {
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
	// WORKS
	imageBlobUrl: string
}

export default function AppMain() {
	const GAPI_CLIENT_ID = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID;
	const GAPI_API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;
	const GAPI_DISC_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
	const GAPI_SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly';
	//
	const PAGE_SIZE = 12
	//
	const [signedInUser, setSignedInUser] = useState('');
	const [gapiFiles, setGapiFiles] = useState<IGapiFile[]>([]);
	const [isLoadingGoogleDriveApi, setIsLoadingGoogleDriveApi] = useState(false);
	const [isFetchingGoogleDriveFiles, setIsFetchingGoogleDriveFiles] = useState(false);

	/** fetch images */
	useEffect(() => {
		gapiFiles.forEach((file: IGapiFile) => { downloadFile(file.id) });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [gapiFiles])

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
				pageSize: PAGE_SIZE,
				fields: 'nextPageToken, files(id, name, createdTime, mimeType, modifiedTime, size)',
				q: `mimeType = 'image/png' or mimeType = 'image/jpeg'`,
			})
			.then(function(response) {
				setIsFetchingGoogleDriveFiles(false);
				const res = JSON.parse(response.body);
				setGapiFiles(res.files);
			});
	};

	const downloadFile = (fileId: string) => {
		gapi.client.drive.files.get({ fileId: fileId, alt: "media", })
			.then((response) => {
				// 1
				const objectUrl = URL.createObjectURL(new Blob([new Uint8Array(response.body.length).map((_, i) => response.body.charCodeAt(i))], { type: 'image/png' }));
				// 2
				const updFiles = gapiFiles
				updFiles.filter((file) => file.id === fileId)[0].imageBlobUrl = objectUrl;
				setGapiFiles(updFiles)
			})
			.catch((err) => console.log(err))
	}

	// --------------------------------------------------------------------------------------------

	return (
		<main>
			{isLoadingGoogleDriveApi && <div>LOADING</div>}
			{signedInUser ? <section>
				<div className='row align-items-center mb-4'>
					<div className='col'><h5 className='mb-0'>Welcome {signedInUser}</h5></div>
					<div className='col-auto'><button className='btn btn-primary' type='button' onClick={handleSignOutClick}>Logout</button></div>
				</div>
				<div className='p-4 bg-dark mt-4'>
					<div className='row row-cols-1 row-cols-md-2 row-cols-lg-4 justify-content-between align-items-center g-4'>
						{gapiFiles.sort((a, b) => a.modifiedTime < b.modifiedTime ? -1 : 1).map((file) =>
							<div key={file.id} className='col'>
								<img src={file.imageBlobUrl} alt={file.name} style={{ width: '100%', height: '100%' }} />
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
