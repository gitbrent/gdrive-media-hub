import { doLoadInitGsiGapi } from './AuthService'

const GAPI_CLIENT_ID = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID || ''
const GAPI_API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY || ''
const GAPI_DISC_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
const GAPI_SCOPES = 'https://www.googleapis.com/auth/drive.readonly'

let isGapiInitialized = false

export const checkGapiInitialized = () => {
	if (!isGapiInitialized) {
		throw new Error('GAPI client is not initialized')
	}
}

export const initGapiClient = async () => {
	if (typeof gapi === 'undefined') {
		await loadGapiScript()
	}

	// Init gapi client *after* gsi
	await gapi.client.init({
		apiKey: GAPI_API_KEY,
		clientId: GAPI_CLIENT_ID,
		scope: GAPI_SCOPES,
		discoveryDocs: GAPI_DISC_DOCS
	})

	await doLoadInitGsiGapi()

	isGapiInitialized = true
}

/**
 * Utility function to dynamically load the GAPI script
 * @returns Promise<void>
 */
const loadGapiScript = () => {
	return new Promise<void>((resolve, reject) => {
		const script = document.createElement('script')
		script.src = 'https://apis.google.com/js/api.js'
		// Load gapi script, load client, load gapi drive client (`drive` must be loaded!) = ready
		script.onload = () => gapi.load('client', () => gapi.client.load('drive', 'v3').then(() => resolve()))
		script.onerror = () => reject(new Error('Script loading failed'))
		document.body.appendChild(script)
	})
}
