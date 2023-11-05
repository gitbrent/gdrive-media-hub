import { FileSizeThresholds, IFileAnalysis, IGapiFile, IS_LOCALHOST } from './App.props'
import { initGoogleApi, doAuthSignIn, doAuthSignOut, doClearFileCache, fetchDriveFiles, fetchFileImgBlob, fetchDriveFolders } from './GoogleApi'

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

// TODO: Add to "Profile" page
export const handleClearFileCache = () => {
	doClearFileCache()
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
	const topNames = 50
	const analysis = {
		total_files: 0,
		total_size: 0,
		file_types: {} as Record<string, number>,
		file_years: {} as Record<string, number>,
		common_names: {} as Record<string, number>,
		size_categories: {
			Tiny: 0,
			Small: 0,
			Medium: 0,
			Large: 0,
			Huge: 0
		} as Record<string, number>
	}

	_gapiFiles.forEach((file) => {
		// Increment the total file count
		analysis.total_files += 1

		// A: Bucket FILES by SIZE-CATEGORY
		if (file.size) {
			const fileSize = parseInt(file.size)
			analysis.total_size += fileSize

			// Categorize the file size
			if (fileSize <= FileSizeThresholds.Tiny) {
				analysis.size_categories.Tiny += 1
			} else if (fileSize <= FileSizeThresholds.Small) {
				analysis.size_categories.Small += 1
			} else if (fileSize <= FileSizeThresholds.Medium) {
				analysis.size_categories.Medium += 1
			} else if (fileSize <= FileSizeThresholds.Large) {
				analysis.size_categories.Large += 1
			} else {
				analysis.size_categories.Huge += 1
			}
		}

		// B: Bucket FILES by YEAR
		const year = file.modifiedByMeTime ? new Date(file.modifiedByMeTime).getFullYear().toString() : 'Unknown'
		analysis.file_years[year] = (analysis.file_years[year] || 0) + 1

		// C: Bucket FILES by MIME-TYPE
		const mimeType = file.mimeType.split('/').pop()
		if (mimeType) {
			analysis.file_types[mimeType] = (analysis.file_types[mimeType] || 0) + 1
		}

		// D: Bucket FILES by COMMON-NAME
		const commonNameMatch = file.name.match(/^([a-zA-Z]+)(?:-|_|[0-9])/)
		const commonName = commonNameMatch ? commonNameMatch[0] : file.name.length >= 5 ? file.name.substring(0, 5) : '(misc)'
		analysis.common_names[commonName] = (analysis.common_names[commonName] || 0) + 1
	})

	// Filter common names to keep only the top NN
	analysis.common_names = Object.fromEntries(Object.entries(analysis.common_names).sort(([, a], [, b]) => b - a).slice(0, topNames))

	// done
	return analysis
}
