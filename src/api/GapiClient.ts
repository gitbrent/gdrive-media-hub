import { log } from '../App.props'
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
	log(2, 'GapiClient.useAppMainCallback')
	useAppMainCallback()
}

export const initGapiClient = (initCallback: () => void) => {
	log(2, 'GapiClient.initGapiClient')
	useAppMainCallback = initCallback
	if (!isGapiInitialized) {
		initGoogleApi(callbackInit)
	}
}
