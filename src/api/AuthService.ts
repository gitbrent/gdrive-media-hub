/**
 * Google Drive access involves two libraries: GSI and GAPI
 * ========================================================
 * - gsi = provides google-one-tap login/auth
 * - gapi = provides ability to perfrom CRUD operations against Drive
 *
 * @see https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#redirecting
 * "While gapi.client is still the recommended choice to access Google APIs, the newer Google Identity Services library should be used for authentication and authorization instead."
 *
 * Design: "Using the token model"
 * @see https://developers.google.com/identity/oauth2/web/guides/use-token-model
 * ========================================================
 * @see https://developers.googleblog.com/2022/03/gis-jsweb-authz-migration.html
 * @see https://developers.google.com/identity/oauth2/web/guides/migration-to-gis
 *
 * NOTE: `GAPI_API_KEY` will always be empty unless the "private initGapiClient = (): void => {}" style of function declaration is used!!
 */
/**
 * @see https://developers.google.com/drive/api/guides/about-sdk
 * @see https://developers.google.com/drive/api/guides/search-files#node.js
 * @see https://developers.google.com/drive/api/guides/fields-parameter
 * @see https://developers.google.com/drive/api/v3/reference/files/get
 * @see https://medium.com/@willikay11/how-to-link-your-react-application-with-google-drive-api-v3-list-and-search-files-2e4e036291b7
 */
import { AuthState, IAuthState, IS_LOCALHOST } from '../App.props'
import { TokenClientConfig, TokenResponse } from '../types/googlegsi.types'
import { CredentialResponse } from 'google-one-tap'
import { decodeJwt } from 'jose'

declare global {
	interface Window {
		google: {
			accounts: {
				oauth2: {
					initTokenClient: (config: TokenClientConfig) => { requestAccessToken: () => void }, // google-one-tap types are missing this
					hasGrantedAllScopes: (token: TokenResponse, scope: string) => boolean,
				}
			},
			gsi: () => void,
			load: () => void,
		};
	}
}

const GAPI_CLIENT_ID = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID || ''
const GAPI_API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY || ''
const GAPI_DISC_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
const GAPI_SCOPES = 'https://www.googleapis.com/auth/drive.readonly'
let clientCallback: () => void
let authUserName = ''
let authUserPict = ''
let isAuthorized = false
let tokenResponse: TokenResponse

async function doLoadInitGsiGapi() {
	// GAPI (1/2)
	if (typeof gapi === 'undefined' || !gapi.client) await loadGapiScript()

	// GSI (2/2)
	if (typeof window.google === 'undefined' || !window.google) await loadGsiScript()
	else if (window.google.accounts && !authUserName) await initGsiClient()

	// check for current token
	const tokenData = sessionStorage.getItem('googleTokenData')
	const tokenJson: TokenResponse = tokenData ? JSON.parse(tokenData) : null
	const isExp = !tokenJson || (tokenJson && tokenJson?.expiresTime <= Date.now()) ? true : false
	if (IS_LOCALHOST) console.log(`[doLoadInit] tokenJson=${tokenJson?.expiresTime} <= dateNow=${Date.now()} ??? (isExp = ${isExp})`)
	if (!isExp) tokenResponse = tokenJson

	// proceed to read data files, etc as we're good to go
	//if (tokenResponse?.access_token) doAuthorizeUser()
	doAuthorizeUser()
}

async function doAuthorizeUser() {
	if (tokenResponse?.access_token) {
		// A: set auth
		isAuthorized = true
		// B: *IMPORTANT* do this as `await initGapiClient()` below w/b skipped as gapi is loaded, however, it'll throw "no anon access" errors if token isnt set like this!
		gapi.client.setToken(tokenResponse)
	}
	else {
		// STEP 1: now that gsi is init and user is signed-in, get access token
		if (!tokenResponse?.access_token) {
			if (IS_LOCALHOST) console.log('\nGSI-STEP-2: tokenFlow() --------------')
			await tokenFlow()
		}
	}

	// STEP 2: now that token exists, setup gapi so we can use Drive API's with the token from prev step
	if (typeof gapi === 'undefined' || !gapi.client) {
		if (IS_LOCALHOST) console.log('\nGSI-STEP-3: initGapiClient() ---------')
		await initGapiClient()
	}

	// STEP 3: checks user scopes, sets `isAuthorized`
	if (IS_LOCALHOST) console.log('\nGSI-STEP-4: updateUserAuthStatus() ---')
	await updateUserAuthStatus()

	// FINALLY: callback to notify class/data is loaded
	clientCallback()
}

async function doAuthorizeSignOut() {
	sessionStorage.setItem('googleTokenData', '')

	// FIXME:
	gapi.auth2.getAuthInstance().signOut()
	//_authUserName = ''
	//_gapiFiles = []
}

//#region GAPI
async function loadGapiScript() {
	return new Promise((resolve) => {
		const script = document.createElement('script')
		script.src = 'https://apis.google.com/js/api.js'
		// Load gapi script, load client, load gapi drive client (`drive` must be loaded!) = ready
		script.onload = () => gapi.load('client', () => gapi.client.load('drive', 'v3').then(() => resolve(true)))
		document.body.appendChild(script)
	})
}

/** called after gsi, not called from script load above */
async function initGapiClient() {
	return await gapi.client.init({
		apiKey: GAPI_API_KEY,
		clientId: GAPI_CLIENT_ID,
		scope: GAPI_SCOPES,
		discoveryDocs: GAPI_DISC_DOCS
	})
}
//#endregion

//#region GSI

/** STEP 1: load <script> */
async function loadGsiScript() {
	return new Promise((resolve) => {
		const script = document.createElement('script')
		script.src = 'https://accounts.google.com/gsi/client'
		script.async = true
		script.defer = true
		script.onload = () => initGsiClient().then(() => resolve(true))
		document.body.appendChild(script)
	})
}

/**
 * STEP 2: init <script>
 * @see https://developers.google.com/identity/gsi/web/guides/use-one-tap-js-api
 */
async function initGsiClient() {
	return new Promise((resolve) => {
		window.google.accounts.id.initialize({
			client_id: GAPI_CLIENT_ID,
			callback: (resp) => initGsiCallback(resp).then(() => resolve(true)),
			auto_select: true,
			cancel_on_tap_outside: true,
			context: 'signin',
		})
		window.google.accounts.id.prompt()
	})
}

/**
 * STEP 3: process cred resp
 */
async function initGsiCallback(response: CredentialResponse) {
	/**
	 * @note `credential`: This field is the ID token as a base64-encoded JSON Web Token (JWT) string.
	 * @see https://developers.google.com/identity/gsi/web/reference/js-reference#credential
	 */
	const responsePayload = decodeJwt(response.credential)

	if (IS_LOCALHOST) console.log('\nGSI-STEP-1: responsePayload ----------')
	authUserName = responsePayload?.name?.toString() || ''
	authUserPict = responsePayload?.picture?.toString() || ''
	if (IS_LOCALHOST) console.log('authUserName', authUserName)
	if (IS_LOCALHOST) console.log('authUserPict', authUserPict)

	return
}

/**
 * STEP 4: request access token
 * @see https://developers.google.com/identity/oauth2/web/guides/use-token-model#working_with_tokens
 * @see https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#token_request
 */
async function tokenFlow() {
	return new Promise((resolve) => {
		const client = window.google.accounts.oauth2.initTokenClient({
			client_id: GAPI_CLIENT_ID,
			scope: GAPI_SCOPES,
			callback: (tokenResp: TokenResponse) => {
				// A: capture token
				tokenResponse = tokenResp
				tokenResp.expiresTime = Date.now() + tokenResp.expires_in * 1000
				if (IS_LOCALHOST) console.log(`- tokenResponse.expires_in = ${tokenResp?.expires_in}`)

				// B: store the token data in session storage
				sessionStorage.setItem('googleTokenData', JSON.stringify(tokenResp))

				// Done
				resolve(true)
			},
		})
		client.requestAccessToken()
	})
}

/**
 * Sets if user is authorized. Called after both scripts are init.
 * @see https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#token_and_consent_response
 */
async function updateUserAuthStatus() {
	isAuthorized = window.google.accounts.oauth2.hasGrantedAllScopes(tokenResponse, GAPI_SCOPES)

	if (IS_LOCALHOST) {
		if (!isAuthorized) console.warn('Unauthorized?!')
		else console.log('- isAuthorized = ', isAuthorized)
	}

	return
}

//#endregion

// PUBLIC

export const initGoogleApi = (onAuthChange: () => void) => {
	clientCallback = onAuthChange
	doLoadInitGsiGapi()
}

export const getAccessToken = () => {
	return tokenResponse.access_token
}

export const doAuthSignIn = async () => {
	return doAuthorizeUser()
}

export const doAuthSignOut = async () => {
	return doAuthorizeSignOut()
}

export const userAuthState = (): IAuthState => {
	return ({
		status: isAuthorized === true ? AuthState.Authenticated : AuthState.Unauthenticated,
		userName: authUserName ? authUserName : '',
		userPict: authUserPict ? authUserPict : '',
	})
}
