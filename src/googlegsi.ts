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
 *
 * NOTE: `this.GAPI_API_KEY` will always be empty unless the "private initGapiClient = (): void => {}" style of function declaration is used!!
 */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="google-one-tap" />
/// <reference types="gapi" />
import { AuthState, IAuthState, IS_LOCALHOST } from './App.props'
import { TokenResponse, IGapiFile, TokenClientConfig } from './googlegsi.types'
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

export class googlegsi {
	private readonly GAPI_CLIENT_ID = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID || ''
	private readonly GAPI_API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY || ''
	private readonly GAPI_DISC_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
	private readonly GAPI_SCOPES = 'https://www.googleapis.com/auth/drive.file'
	private clientCallback: () => void
	private signedInUser = ''
	private isAuthorized = false
	private tokenResponse!: TokenResponse
	private gapiFiles: IGapiFile[] = []

	constructor(callbackFunc: (() => void)) {
		this.clientCallback = callbackFunc
		this.doLoadInitGsiGapi()
	}

	private doLoadInitGsiGapi = async () => {
		// GAPI (1/2)
		if (typeof gapi === 'undefined' || !gapi.client) await this.loadGapiScript()

		// GSI (2/2)
		if (typeof window.google === 'undefined' || !window.google) await this.loadGsiScript()
		else if (window.google.accounts && !this.signedInUser) await this.initGsiClient()

		// check for current token
		const tokenData = sessionStorage.getItem('googleTokenData')
		const tokenJson: TokenResponse = tokenData ? JSON.parse(tokenData) : null
		const isExp = tokenJson && tokenJson?.expiresTime <= Date.now() ? false : true
		if (IS_LOCALHOST) console.log(`[doLoadInit] tokenJson=${tokenJson?.expiresTime} <= dateNow=${Date.now()} ??? (isExp = ${isExp})`)
		if (!isExp) this.tokenResponse = tokenJson

		// proceed to read data files, etc as we're good to go
		//if (this.tokenResponse?.access_token) this.doAuthorizeUser()
		this.doAuthorizeUser()
	}

	private doAuthorizeUser = async () => {
		if (this.tokenResponse?.access_token) {
			// A: set auth
			this.isAuthorized = true
			// B: *IMPORTANT* do this as `await this.initGapiClient()` below w/b skipped as gapi is loaded, however, it'll throw "no anon access" errors if token isnt set like this!
			gapi.client.setToken(this.tokenResponse)
		}
		else {
			// STEP 1: now that gsi is init and user is signed-in, get access token
			if (!this.tokenResponse?.access_token) {
				if (IS_LOCALHOST) console.log('\nGSI-STEP-2: tokenFlow() --------------')
				await this.tokenFlow()
			}
		}

		// STEP 2: now that token exists, setup gapi so we can use Drive API's with the token from prev step
		if (typeof gapi === 'undefined' || !gapi.client) {
			if (IS_LOCALHOST) console.log('\nGSI-STEP-3: initGapiClient() ---------')
			await this.initGapiClient()
		}

		// STEP 3: checks user scopes, sets `isAuthorized`
		if (IS_LOCALHOST) console.log('\nGSI-STEP-4: updateUserAuthStatus() ---')
		await this.updateUserAuthStatus()

		// STEP 4: download app files if authorized
		if (IS_LOCALHOST) console.log('\nGSI-STEP-5: listFiles() --------------')
		if (this.isAuthorized) await this.listFiles()

		// FINALLY: callback to notify class/data is loaded
		this.clientCallback()

		return
	}

	//#region GAPI
	private loadGapiScript = async () => {
		return new Promise((resolve) => {
			const script = document.createElement('script')
			script.src = 'https://apis.google.com/js/api.js'
			// Load gapi script, load client, load gapi drive client (`drive` must be loaded!) = ready
			script.onload = () => gapi.load('client', () => gapi.client.load('drive', 'v2').then(() => resolve(true)))
			document.body.appendChild(script)
		})
	}

	/** called after gsi, not called from script load above */
	private initGapiClient = async () => {
		return await gapi.client.init({
			apiKey: this.GAPI_API_KEY,
			clientId: this.GAPI_CLIENT_ID,
			scope: this.GAPI_SCOPES,
			discoveryDocs: this.GAPI_DISC_DOCS
		})
	}
	//#endregion

	//#region GSI
	/** STEP 1: load <script> */
	private loadGsiScript = async () => {
		return new Promise((resolve) => {
			const script = document.createElement('script')
			script.src = 'https://accounts.google.com/gsi/client'
			script.async = true
			script.defer = true
			script.onload = () => this.initGsiClient().then(() => resolve(true))
			document.body.appendChild(script)
		})
	}

	/**
	 * STEP 2: init <script>
	 * @see https://developers.google.com/identity/gsi/web/guides/use-one-tap-js-api
	 */
	private initGsiClient = async () => {
		return new Promise((resolve) => {
			window.google.accounts.id.initialize({
				client_id: this.GAPI_CLIENT_ID,
				callback: (resp) => this.initGsiCallback(resp).then(() => resolve(true)),
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
	private initGsiCallback = async (response: CredentialResponse) => {
		/**
		 * @note `credential`: This field is the ID token as a base64-encoded JSON Web Token (JWT) string.
		 * @see https://developers.google.com/identity/gsi/web/reference/js-reference#credential
		 */
		const responsePayload = decodeJwt(response.credential)

		if (IS_LOCALHOST) console.log('\nGSI-STEP-1: responsePayload ----------')
		this.signedInUser = responsePayload?.name?.toString() || ''
		if (IS_LOCALHOST) console.log('this.signedInUser', this.signedInUser)

		return
	}

	/**
	 * STEP 4: request access token
	 * @see https://developers.google.com/identity/oauth2/web/guides/use-token-model#working_with_tokens
	 * @see https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#token_request
	 */
	private tokenFlow = async () => {
		return new Promise((resolve) => {
			const client = window.google.accounts.oauth2.initTokenClient({
				client_id: this.GAPI_CLIENT_ID,
				scope: this.GAPI_SCOPES,
				callback: (tokenResponse: TokenResponse) => {
					// A: capture token
					this.tokenResponse = tokenResponse
					this.tokenResponse.expiresTime = Date.now() + this.tokenResponse.expires_in * 1000
					if (IS_LOCALHOST) console.log(`- tokenResponse.expires_in = ${this.tokenResponse?.expires_in}`)

					// B: store the token data in session storage
					sessionStorage.setItem('googleTokenData', JSON.stringify(tokenResponse))

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
	private updateUserAuthStatus = async () => {
		this.isAuthorized = window.google.accounts.oauth2.hasGrantedAllScopes(this.tokenResponse, this.GAPI_SCOPES)

		if (IS_LOCALHOST) {
			if (!this.isAuthorized) console.warn('Unauthorized?!')
			else console.log('- this.isAuthorized = ', this.isAuthorized)
		}

		return
	}
	//#endregion

	//#region file operations
	private listFiles = async () => {
		const response: { body: string } = await gapi.client.drive.files.list({
			q: 'trashed=false and (mimeType = \'image/png\' or mimeType = \'image/jpeg\' or mimeType = \'image/gif\')'
		})
		const respBody = JSON.parse(response.body)
		const respFiles: IGapiFile[] = respBody.items
		if (IS_LOCALHOST) console.log(`- respFiles.length = ${respFiles.length}`)
		this.gapiFiles = respFiles
		return
	}

	//#region getters
	get authState(): IAuthState {
		if (IS_LOCALHOST) console.log('returning this.isAuthorized:', this.isAuthorized)
		//if (IS_LOCALHOST) console.log(window.google.accounts.oauth2.hasGrantedAllScopes(this.tokenResponse, this.GAPI_SCOPES))

		return {
			status: this.isAuthorized ? AuthState.Authenticated : AuthState.Unauthenticated,
			userName: this.signedInUser,
			userPhoto: ''
		}
	}

	get imageFiles(): IGapiFile[] {
		return this.gapiFiles
	}
	//#endregion

	//#region public methods
	public doAuthSignIn = async () => {
		return this.doAuthorizeUser()
	}

	public doAuthSignOut = async () => {
		console.log('TODO: doAuthSignOut')
		return
	}
	//#endregion
}
