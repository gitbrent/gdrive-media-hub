import { FileSizeThresholds, IAuthState, IFileAnalysis, IFileListCache, IMediaFile, log } from './App.props'
import { isGif, isImage, isVideo } from './utils/mimeTypes'
import {
	doAuthSignIn,
	doAuthSignOut,
	doClearFileCache,
	fetchDriveFiles,
	getBlobForFile,
	initGapiClient,
	loadCacheFromIndexedDB,
	userAuthState,
} from './api'

export interface AppMainLogicInterface {
	doInitGoogleApi: (callback: () => void) => void;
	handleAuthClick: () => void;
	handleSignOutClick: () => void;
	downloadFile: (fileId: string) => Promise<void>;
}

// --------------------------------------------------------------------------------------------

let _gapiFiles: IMediaFile[] = []
let _authUserName = ''
let _authUserPict = ''
let _isBusyGapiLoad = false
let _initCallback: () => void

// --------------------------------------------------------------------------------------------

export const allFiles = () => _gapiFiles

export const authUserName = () => _authUserName

export const authUserPict = () => _authUserPict

export const isBusyGapiLoad = () => _isBusyGapiLoad

// Called from `useAppMain.ts` at startup
export const doInitGoogleApi = (initCallback: () => void) => {
	_isBusyGapiLoad = true
	_initCallback = initCallback
	initGapiClient(initGapiCallback)
}

async function initGapiCallback() {
	try {
		const authState = userAuthState()
		log(2, `[AppMainLogic.doInitGoogleApi] authState = ${authState.status}`)
		_authUserName = authState.userName
		_authUserPict = authState.userPict
		if (_authUserName) {
			log(2, `[AppMainLogic] signedInUser = "${_authUserName}"`)
			_gapiFiles = await fetchDriveFiles()
			_gapiFiles.forEach((item) => item.original = '')
			log(2, `[AppMainLogic] _gapiFiles.length = ${_gapiFiles.length}`)
		}
	} catch (error) {
		console.error('Initialization failed:', error)
	} finally {
		_isBusyGapiLoad = false
		_initCallback()
	}
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

export const handleClearFileCache = () => {
	doClearFileCache()
}

export const getUserAuthState = (): IAuthState => {
	return userAuthState()
}

export const getCacheStatus = async (): Promise<IFileListCache | null> => {
	try {
		const cacheStatus = await loadCacheFromIndexedDB()
		return cacheStatus
	} catch (error) {
		console.error('Error getting cache status:', error)
		return null
	}
}

//

/**
 * Download a file, update _gapiFiles collection, and return success status.
 * @param fileId The ID of the file to download.
 * @returns A boolean indicating the success of the operation.
 */
export const downloadFile = async (fileId: string): Promise<boolean> => {
	try {
		const file = _gapiFiles.find(item => item.id === fileId)
		if (!file) {
			console.warn(`File not found! "${fileId}"`)
			return false
		}

		const objectUrl = await getBlobForFile(file.id)
		if (!objectUrl) return false

		if (isImage(file) || isGif(file)) {
			return new Promise((resolve) => {
				const img = new Image()
				img.src = objectUrl
				img.onload = () => {
					const updFiles = [..._gapiFiles]
					const imgFile = updFiles.find((file) => file.id === fileId)
					if (imgFile) {
						imgFile.original = objectUrl
						imgFile.width = img.width && !isNaN(img.width) ? img.width : 100
						imgFile.height = img.height && !isNaN(img.height) ? img.height : 100
					}
					_gapiFiles = updFiles
					resolve(true)
				}
				img.onerror = () => {
					console.error('Error loading image')
					resolve(false)
				}
			})
		} else if (isVideo(file)) {
			const updFiles = [..._gapiFiles]
			const videoFile = updFiles.find((file) => file.id === fileId)
			if (videoFile) {
				videoFile.original = objectUrl // Store the URL for the video
				// For video, you might not need width and height beforehand,
				// but you could set some default values or try to read the metadata
				// using a hidden video element (more complex and usually not necessary).
			}
			_gapiFiles = updFiles
			return true
		} else {
			console.warn(`Unknown mimeType: ${file.mimeType}`)
			console.warn(`.......file.name: ${file.name}`)
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
