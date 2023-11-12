import { initGoogleApi } from './AuthService'

let isGapiInitialized = false
let useAppMainCallback: () => void

export const checkGapiInitialized = () => {
	if (!isGapiInitialized) {
		throw new Error('GAPI client is not initialized')
	}
}

function callbackInit() {
	isGapiInitialized = true
	useAppMainCallback()
}

export const initGapiClient = (initCallback: () => void) => {
	useAppMainCallback = initCallback
	if (!isGapiInitialized) {
		initGoogleApi(callbackInit)
	}
}
