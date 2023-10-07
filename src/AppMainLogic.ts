import { IGapiFile, IS_LOCALHOST } from './App.props'
import { initGoogleApi, doAuthSignIn, fetchDriveFiles, fetchFileImgBlob } from './GoogleApi'

export interface AppMainLogicInterface {
	doInitGoogleApi: (callback: () => void) => void;
	handleAuthClick: () => void;
	handleSignOutClick: () => void;
	downloadFile: (fileId: string) => Promise<void>;
}

// --------------------------------------------------------------------------------------------

let _gapiFiles: IGapiFile[] = []
let _signedInUser = ''
let _isBusyGapiLoad = false

// --------------------------------------------------------------------------------------------

export const allFiles = () => _gapiFiles

export const signedInUser = () => _signedInUser

export const isBusyGapiLoad = () => _isBusyGapiLoad

export const doInitGoogleApi = (initCallback: () => void) => {
	_isBusyGapiLoad = true
	initGoogleApi((authState) => {
		_signedInUser = authState.userName
		if (_signedInUser) {
			if (IS_LOCALHOST) console.log(`[AppMainLogic] signedInUser = "${_signedInUser}"`)
			fetchDriveFiles().then((files) => {
				_gapiFiles = files
				_isBusyGapiLoad = false
				initCallback()
			})
		}
		else {
			initCallback()
		}
	})
}

/**
 *  Sign in the user upon button click.
 */
export const handleAuthClick = () => {
	doAuthSignIn()
}

/**
 *  Sign out the user upon button click.
 */
export const handleSignOutClick = () => {
	gapi.auth2.getAuthInstance().signOut()
	_signedInUser = ''
	_gapiFiles = []
}

/**
 * load image file blob from google drive api
 * @param fileId
 */
/*
export const downloadFile = async (fileId: string) => {
	const file = _gapiFiles.filter(item => item.id === fileId)[0]
	const response = await fetchFileImgBlob(file)
	if (response) {
		const blob = await response.blob()
		const objectUrl = URL.createObjectURL(blob)
		const img = document.createElement('img')
		img.src = objectUrl
		img.onload = () => {
			const updFiles = [..._gapiFiles]
			const imgFile = updFiles.filter((file) => file.id === fileId)[0]
			imgFile.imageBlobUrl = objectUrl
			imgFile.imageW = img.width && !isNaN(img.width) ? img.width : 100
			imgFile.imageH = img.height && !isNaN(img.height) ? img.height : 100
			_gapiFiles = updFiles
		}
	}
}
*/
export const downloadFile = async (fileId: string): Promise<boolean> => {
	try {
		const file = _gapiFiles.filter(item => item.id === fileId)[0]
		const response = await fetchFileImgBlob(file)
		if (response) {
			const blob = await response.blob()
			const objectUrl = URL.createObjectURL(blob)
			return new Promise((resolve) => {
				const img = new Image()
				img.src = objectUrl
				img.onload = () => {
					const updFiles = [..._gapiFiles]
					const imgFile = updFiles.filter((file) => file.id === fileId)[0]
					imgFile.imageBlobUrl = objectUrl
					imgFile.imageW = img.width && !isNaN(img.width) ? img.width : 100
					imgFile.imageH = img.height && !isNaN(img.height) ? img.height : 100
					_gapiFiles = updFiles
					resolve(true)
				}
			})
		} else {
			return false
		}
	} catch (error) {
		console.error(`Failed to download file with ID ${fileId}:`, error)
		return false
	}
}

export const loadPageImages = async (fileIds: string[]): Promise<boolean> => {
	_isBusyGapiLoad = true
	try {
		const downloadPromises = fileIds.map(downloadFile)
		const results = await Promise.all(downloadPromises)
		_isBusyGapiLoad = false
		return results.every(Boolean)
	} catch (error) {
		console.error('Failed to load page images:', error)
		_isBusyGapiLoad = false
		return false
	}
}
