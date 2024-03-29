import { IDirectory, IGapiFile, IGapiFolder, IMediaFile } from '../App.props'
import { checkGapiInitialized } from './GapiClient'
import { refreshToken } from './AuthService'

export const getRootFolderId = async () => {
	checkGapiInitialized()

	try {
		const response = await gapi.client.drive.files.get({
			fileId: 'root',
			fields: 'id'
		})
		return response.result.id
	} catch (error) {
		// NOTE: This occurs when Google App/Drive Permissions are not correct (e.g.: "Can read only its own files")
		console.error('[getRootFolderId] Could not fetch root folder ID!', error)
		return ''
	}
}

/* useful?
async function buildFolderHierarchy(): Promise<IGapiFolder[]> {
	try {
		const folderMap = new Map<string, IGapiFolder>()
		const rootFolders: IGapiFolder[] = []

		const rootFolderId = await getRootFolderId()
		if (!rootFolderId) throw new Error('unable to fetch root folder id')

		const response = await gapi.client.drive.files.list({
			q: 'mimeType=\'application/vnd.google-apps.folder\' and trashed = false',
			fields: 'nextPageToken, files(id, name, mimeType, parents)',
		})

		// First pass: Populate folderMap with all folders
		response.result.files?.forEach((file) => {
			if (file.id && file.mimeType === 'application/vnd.google-apps.folder') {
				const folder: IGapiFolder = {
					...file,
					id: file.id || '',
					mimeType: file.mimeType || '',
					modifiedByMeTime: file.modifiedByMeTime || '',
					name: file.name || '',
					parents: file.parents || [],
					children: []
				}
				if (folder.id) folderMap.set(folder.id, folder)
			}
		})

		// Second pass: Populate children and identify root folders
		response.result.files?.forEach((file) => {
			if (file.mimeType !== 'application/vnd.google-apps.folder') return

			if (file.id) {
				const currentFolder = folderMap.get(file.id)
				if (!currentFolder) return

				const parentIds = file.parents || []
				if (parentIds.length === 0 || parentIds.includes(rootFolderId)) {
					rootFolders.push(currentFolder)
				} else {
					parentIds.forEach((parentId) => {
						const parentFolder = folderMap.get(parentId)
						if (parentFolder) {
							parentFolder.children.push(currentFolder)
						}
					})
				}
			}
		})

		return rootFolders
	} catch (error) {
		console.error('[buildFolderHierarchy]', error)
		return []
	}
}
*/

export async function fetchFolderContents(folderId: string): Promise<IDirectory> {
	checkGapiInitialized()

	try {
		const response = await gapi.client.drive.files.list({
			q: `'${folderId}' in parents and trashed=false and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'image/' or mimeType contains 'video/')`,
			fields: 'nextPageToken, files(id, name, mimeType, parents, size, createdTime, modifiedByMeTime, webContentLink)',
			pageSize: 1000,
		})

		const files: IGapiFile[] = []
		const folders: IGapiFolder[] = []
		const results: IGapiFile[] = (response.result.files || []) as IGapiFile[]
		results.forEach((file) => {
			if (file.mimeType === 'application/vnd.google-apps.folder') {
				folders.push(file as IGapiFolder)
			} else {
				files.push({ ...file, original: '' } as IMediaFile)
			}
		})

		return {
			currentFolder: {}, // current folder details
			items: [...folders, ...files],
		} as IDirectory
	} catch (error) {
		console.error('Error fetching folder contents:', error)
		throw error
	}
}

// Utility function to fetch folder contents with automatic token refresh
export const fetchWithTokenRefresh = async (folderId: string) => {
	try {
		return await fetchFolderContents(folderId)
	} catch (err: any) {
		if (err.status === 401) {
			// Attempt to refresh the token
			await refreshToken()
			// Retry the request after token refresh
			return await fetchFolderContents(folderId)
		} else {
			// Re-throw other errors to be handled by the caller
			throw err
		}
	}
}
