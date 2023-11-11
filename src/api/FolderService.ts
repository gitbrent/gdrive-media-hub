import { IDirectory, IGapiFile, IGapiFolder } from '../App.props'
import { checkGapiInitialized } from './GapiClient'

const getRootFolderId = async () => {
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
/*
async function buildFolderHierarchy(): Promise<IGapiFolder[]> {
	try {
		const folderMap = new Map<string, IGapiFolder>()
		const rootFolders: IGapiFolder[] = []

		// A:
		const rootFolderId = await getRootFolderId()
		if (!rootFolderId) throw new Error('unable to fetch root folder id')

		// B:
		const response = await gapi.client.drive.files.list({
			q: 'mimeType=\'application/vnd.google-apps.folder\' and trashed = false',
			fields: 'nextPageToken, files(id, name, parents)',
		})

		// C: First pass: Populate folderMap with all folders
		response.result.files?.forEach((folder) => {
			const id = folder.id || ''
			const name = folder.name || ''
			const currentFolder = folderMap.get(id) || { id, name, children: [] }

			folderMap.set(id, currentFolder)
		})

		// D: Second pass: Populate children and identify root folders
		response.result.files?.forEach((folder) => {
			const id = folder.id || ''
			const currentFolder = folderMap.get(id)

			const parentIds = folder.parents || []

			if (currentFolder && (parentIds.length === 0 || parentIds.includes(rootFolderId))) {
				rootFolders.push(currentFolder)
				return
			}

			parentIds.forEach((parentId) => {
				const parentFolder = folderMap.get(parentId)

				if (parentFolder && currentFolder && !parentFolder.children?.includes(currentFolder)) {
					parentFolder.children?.push(currentFolder)
				}
			})
		})

		return rootFolders
	} catch (error) {
		console.error('[buildFolderHierarchy]', error)
		return []
	}
}

async function fetchFolderContents(folderId: string): Promise<IDirectory> {
	try {
		const response = await gapi.client.drive.files.list({
			q: `'${folderId}' in parents and trashed = false`,
			fields: 'nextPageToken, files(id, name, mimeType, parents, size, webContentLink)',
		})

		const files: IGapiFile[] = []
		const folders: IGapiFolder[] = []
		const results: IGapiFile[] = (response.result.files || []) as IGapiFile[]
		results.forEach((file) => {
			if (file.mimeType === 'application/vnd.google-apps.folder') {
				folders.push(file as IGapiFolder)
			} else {
				files.push(file as IGapiFile)
			}
		})

		return {
			currentFolder: { }, // current folder details
			items: [...folders, ...files],
		} as IDirectory
	} catch (error) {
		console.error('Error fetching folder contents:', error)
		throw error
	}
}
*/
