import { IFileListCache, IGapiFile, log } from '../App.props'
import { loadCacheFromIndexedDB, saveCacheToIndexedDB } from './CacheService'
import { getAccessToken } from './AuthService'

const blobUrlCache: Record<string, string> = {}

export const fetchDriveFiles = async (): Promise<IGapiFile[]> => {
	// STEP 1:
	const objCache = await loadCacheFromIndexedDB().catch(() => {
		log(2, '[FileService]: loadCacheFromIndexedDB failed')
	})

	// STEP 2:
	const cachedFiles = objCache?.gapiFiles || []
	const lastLoadDate = objCache?.timeStamp ? new Date(objCache.timeStamp).toISOString() : ''
	log(2, `[FileService] FYI: cachedFiles.length = ${cachedFiles?.length}`)
	log(2, `[FileService] FYI: lastLoadDate = ${lastLoadDate}`)

	// STEP 3: Cache is stale or not present, so fetch new data using fetchDriveFilesAll
	const newFiles = await fetchDriveFilesAll(lastLoadDate)

	// STEP 4: File collection
	const mergedFiles = [...new Set([...cachedFiles, ...newFiles])]

	// STEP 5: Store the new list in the cache with a timestamp
	saveCacheToIndexedDB({ timeStamp: Date.now(), gapiFiles: mergedFiles } as IFileListCache)

	// LAST: Done
	return mergedFiles
}

export const fetchDriveFilesAll = async (lastLoadDate?: string): Promise<IGapiFile[]> => {
	let allFiles: IGapiFile[] = []
	let pageToken: string | undefined

	// A: update UI loading status
	const loginCont = document.getElementById('loginCont')
	const loginHide = document.getElementById('loginContClick')
	let badgeElement = document.getElementById('file-load-badge')
	if (!badgeElement) {
		badgeElement = document.createElement('div')
		badgeElement.className = 'alert alert-primary'
		badgeElement.id = 'file-load-badge'
		loginCont?.appendChild(badgeElement)
		loginHide?.classList.add('d-none')
	}
	badgeElement.textContent = 'Loading files...'

	// B: read files
	do {
		let query = "trashed=false and (mimeType contains 'image/' or mimeType contains 'video/')"
		if (lastLoadDate) {
			query = `modifiedTime > '${lastLoadDate}' and ${query}`
			log(2, '[fetchDriveFilesAll] FYI: query is using modifiedTime > lastLoadDate')
		}

		const debugElement = document.createElement('div')
		debugElement.textContent = `lastLoadDate = ${lastLoadDate}`
		badgeElement.append(debugElement)

		const response = await gapi.client.drive.files.list({
			q: query,
			fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedByMeTime)',
			//orderBy: 'modifiedByMeTime desc',
			pageSize: 1000,
			pageToken: pageToken,
		})

		allFiles = allFiles.concat(response.result.files as IGapiFile[]) || []
		if (allFiles?.length < 10000) {
			pageToken = response.result.nextPageToken
		}
		else {
			pageToken = ''
		}
		//
		badgeElement.textContent = `Loading files... (${allFiles?.length})`
	} while (pageToken)

	log(2, `[fetchDriveFilesAll] allFiles.length = ${allFiles.length}`)

	// C: update UI loading status
	document.getElementById('file-load-badge')?.remove()

	// D: done
	return allFiles
}

export const fetchFileImgBlob = async (fileId: IGapiFile['id']) => {
	try {
		return fileId ?
			await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
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

export const getBlobForFile = async (fileId: IGapiFile['id']): Promise<string | null> => {
	if (blobUrlCache[fileId]) {
		return blobUrlCache[fileId]
	}
	else {
		const response = await fetchFileImgBlob(fileId)
		if (response) {
			const blob = await response.blob()
			const blobUrl = URL.createObjectURL(blob)
			blobUrlCache[fileId] = blobUrl
			return blobUrl
		}
		else {
			return null
		}
	}
}

export function releaseAllBlobUrls() {
	function releaseBlobUrl(fileId: string) {
		const blobUrl = blobUrlCache[fileId]
		if (blobUrl) {
			URL.revokeObjectURL(blobUrl)
			delete blobUrlCache[fileId]
		}
	}

	Object.keys(blobUrlCache).forEach(releaseBlobUrl)
}
