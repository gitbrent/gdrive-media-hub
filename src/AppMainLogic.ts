import { IFileAnalysis, IGapiFile, IS_LOCALHOST } from './App.props'
import { initGoogleApi, doAuthSignIn, doAuthSignOut, fetchDriveFiles, fetchFileImgBlob, fetchDriveFolders } from './GoogleApi'

export interface AppMainLogicInterface {
	doInitGoogleApi: (callback: () => void) => void;
	handleAuthClick: () => void;
	handleSignOutClick: () => void;
	downloadFile: (fileId: string) => Promise<void>;
}

// --------------------------------------------------------------------------------------------

let _gapiFiles: IGapiFile[] = []
let _authUserName = ''
let _authUserPict = ''
let _isBusyGapiLoad = false

// --------------------------------------------------------------------------------------------

export const allFiles = () => _gapiFiles

export const authUserName = () => _authUserName

export const authUserPict = () => _authUserPict

export const isBusyGapiLoad = () => _isBusyGapiLoad

export const doInitGoogleApi = (initCallback: () => void) => {
	_isBusyGapiLoad = true
	initGoogleApi((authState) => {
		_authUserName = authState.userName
		_authUserPict = authState.userPict
		if (_authUserName) {
			if (IS_LOCALHOST) console.log(`[AppMainLogic] signedInUser = "${_authUserName}"`)
			fetchDriveFiles().then((files) => {
				_gapiFiles = files
				_isBusyGapiLoad = false
				initCallback()
			})
			fetchDriveFolders().then((folders) => {
				// WIP: NEW:
				console.log('fetchDriveFolders', folders)
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
	doAuthSignOut()
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
			console.warn('fetchFileImgBlob() failed')
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

export const getFileAnalysis = (): IFileAnalysis => {
	const analysis = {
		total_files: 0,
		total_size: 0,
		file_types: {} as Record<string, number>,
		common_names: {} as Record<string, number>
	}

	_gapiFiles.forEach((file) => {
		// Increment the total file count
		analysis.total_files += 1

		// Increment the total size
		if (file.size) {
			analysis.total_size += parseInt(file.size)
		}

		// Count the MIME types
		const mimeType = file.mimeType.split('/').pop()
		if (mimeType) {
			analysis.file_types[mimeType] = (analysis.file_types[mimeType] || 0) + 1
		}

		// Count common names
		const commonNameMatch = file.name.match(/^([a-zA-Z]+)(?:-|_|[0-9])/)
		const commonName = commonNameMatch ? commonNameMatch[0] : file.name.length >= 5 ? file.name.substring(0, 4) : '(misc)'
		analysis.common_names[commonName] = (analysis.common_names[commonName] || 0) + 1
	})

	// Filter common names to keep only the top 10
	analysis.common_names = Object.fromEntries(Object.entries(analysis.common_names).slice(0, 10))

	// done
	return analysis
}
