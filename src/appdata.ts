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
		userPhoto: '',
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
		this.driveAuthState = this.googleapi.authState
		this.gapiFiles = this.googleapi.imageFiles
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
}
