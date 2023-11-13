import { IFileListCache, IGapiFile, log } from '../App.props'
import { CACHE_EXPIRY_TIME, loadCacheFromIndexedDB, saveCacheToIndexedDB } from './CacheService'
import { getAccessToken } from './AuthService'

export const fetchDriveFiles = async (): Promise<IGapiFile[]> => {
	let cachedFiles: IGapiFile[] = []
	let mergedFiles: IGapiFile[] = []
	let isFullRefresh = true

	const objCache = await loadCacheFromIndexedDB().catch(() => {
		log(2, '[FileService]: loadCacheFromIndexedDB failed')
	})

	if (objCache?.timeStamp && objCache?.gapiFiles?.length > 0) {
		if (Date.now() - objCache.timeStamp < CACHE_EXPIRY_TIME) {
			log(2, '[FileService] FYI: fetchDriveFiles = using cachedData')
			cachedFiles = objCache.gapiFiles
		}
	}
	isFullRefresh = !cachedFiles || cachedFiles.length === 0
	log(2, `[FileService]: FYI: isFullRefresh = ${isFullRefresh}`)

	// Cache is stale or not present, so fetch new data using fetchDriveFilesAll
	const newFiles = await fetchDriveFilesAll(isFullRefresh)

	if (!isFullRefresh) {
		const cachedFilesMap = new Map(cachedFiles.map(file => [file.id, file]))

		// Iterate over new files and update or add to the map
		newFiles.forEach(file => {
			cachedFilesMap.set(file.id, file)
		})

		mergedFiles = Array.from(cachedFilesMap.values())
	}
	else {
		mergedFiles = newFiles
	}

	// Store the new list in the cache with a timestamp
	saveCacheToIndexedDB({ timeStamp: Date.now(), gapiFiles: mergedFiles } as IFileListCache)

	// Done
	return mergedFiles
}

export const fetchDriveFilesAll = async (isFullSync: boolean): Promise<IGapiFile[]> => {
	const oneDayAgo = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString()
	let allFiles: IGapiFile[] = []
	let pageToken: string | undefined

	// A: update UI loading status
	const loginCont = document.getElementById('loginCont')
	let badgeElement = document.getElementById('file-load-badge')
	if (!badgeElement) {
		badgeElement = document.createElement('div')
		badgeElement.className = 'alert alert-primary'
		badgeElement.id = 'file-load-badge'
		loginCont?.appendChild(badgeElement)
	}
	badgeElement.textContent = 'Loading files...'

	// B: read files
	do {
		// eslint-disable-next-line quotes
		let query = "trashed=false and (mimeType contains 'image/' or mimeType contains 'video/')"
		if (!isFullSync) query = `modifiedTime > '${oneDayAgo}' and ${query}`
		const response = await gapi.client.drive.files.list({
			q: query,
			fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedByMeTime)',
			//orderBy: 'modifiedByMeTime desc',
			pageSize: 1000,
			pageToken: pageToken,
		})

		allFiles = allFiles.concat(response.result.files as IGapiFile[]) || []
		pageToken = response.result.nextPageToken
		//
		badgeElement.textContent = `Loading files... (${allFiles?.length})`
	} while (pageToken)

	log(2, `[fetchDriveFiles] allFiles.length = ${allFiles.length}`)

	// C: update UI loading status
	document.getElementById('file-load-badge')?.remove()

	// D: done
	return allFiles
}

export const fetchFileImgBlob = async (chgFile: IGapiFile) => {
	try {
		return chgFile?.id ?
			await fetch(`https://www.googleapis.com/drive/v3/files/${chgFile.id}?alt=media`, {
				method: 'GET',
				headers: { Authorization: `Bearer ${getAccessToken()}` },
			})
			:
			false
	}
	catch (ex) {
		console.error(ex)
		return false
	}
}
