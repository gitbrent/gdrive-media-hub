import { doLoadInitGsiGapi } from './AuthService'

let isGapiInitialized = false

export const checkGapiInitialized = () => {
	if (!isGapiInitialized) {
		throw new Error('GAPI client is not initialized')
	}
}

export const initGapiClient = async () => {
	if (!isGapiInitialized) {
		await doLoadInitGsiGapi()
		isGapiInitialized = true
	}
}
