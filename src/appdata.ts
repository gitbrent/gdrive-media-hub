/**
 * perform data engine functions
 * - acts as interface between app ("edit entry", "save data file") requests and googlegsi.ts
 */
import { AuthState, IAuthState, IGapiFile } from './App.props'
import { googlegsi } from './googlegsi'

export class appdata {
	private readonly DEF_AUTH_STATE: IAuthState = {
		status: AuthState.Unauthenticated,
		userName: '',
	}
	private driveAuthState: IAuthState = this.DEF_AUTH_STATE
	private gapiFiles!: IGapiFile[]
	private googleapi: googlegsi
	private clientCallback: () => void

	constructor(callbackFunc: (() => void)) {
		this.clientCallback = callbackFunc
		this.googleapi = new googlegsi(this.doUpdateAndCallback)
	}

	private doUpdateAndCallback = () => {
		// A: Set vars
		// IMPORTANT: follow tertiary set method below (if `this.gapiFiles = this.googleapi.imageFiles` is used instead, that's a closure and will be empty every time!!!)
		this.driveAuthState = this.googleapi.authState ? this.googleapi.authState : this.DEF_AUTH_STATE
		this.gapiFiles = this.googleapi.imageFiles ? this.googleapi.imageFiles : []

		// B: Notify caller
		this.clientCallback()
	}

	// -------------------------------------------------------------

	get authState(): IAuthState {
		return this.driveAuthState
	}

	get imageFiles(): IGapiFile[] {
		return this.gapiFiles
	}

	// -------------------------------------------------------------

	public doAuthSignIn = async () => {
		return this.googleapi.doAuthSignIn()
	}

	public doAuthSignOut = async () => {
		return this.googleapi.doAuthSignOut()
	}

	public doFetchFileBlob = async (fileId: IGapiFile['id']) => {
		return this.googleapi.doFetchFileBlob(fileId)
	}
}
