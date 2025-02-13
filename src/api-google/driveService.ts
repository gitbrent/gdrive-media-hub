/**
 * Drive Service
 * - perform CRUD operations on Google Drive files
 * - Some of these methods can be called directly (they dont have to be wrapped in DataProvider)
 */

import { IDirectory, IGapiFile, IGapiFolder, IMediaFile } from "../App.props";

// == FILES ===================================================================

export const createFile = async (name: string, content: string): Promise<gapi.client.Response<gapi.client.drive.File>> => {
	try {
		const boundary = '-------314159265358979323846';
		const delimiter = `\r\n--${boundary}\r\n`;
		const closeDelimiter = `\r\n--${boundary}--`;

		const metadata = {
			name,
			mimeType: 'text/plain',
		};

		const multipartRequestBody =
			delimiter +
			'Content-Type: application/json\r\n\r\n' +
			JSON.stringify(metadata) +
			delimiter +
			'Content-Type: text/plain\r\n\r\n' +
			content +
			closeDelimiter;

		const response = await gapi.client.request({
			path: '/upload/drive/v3/files',
			method: 'POST',
			params: {
				uploadType: 'multipart',
			},
			headers: {
				'Content-Type': `multipart/related; boundary="${boundary}"`,
			},
			body: multipartRequestBody,
		});

		return response;
	} catch (error) {
		console.error('Error creating file:', error);
		throw error;
	}
};

export const listFiles = async (): Promise<gapi.client.drive.File[]> => {
	try {
		const response = await gapi.client.drive.files.list({
			q: "trashed=false and (mimeType contains 'image/' or mimeType contains 'video/')",
			fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedByMeTime)',
			pageSize: 1000,
		});

		let files = response.result.files || [];

		// TODO: poor-mans paging (just grab 2000)
		const pageToken = response.result.nextPageToken

		if (files && pageToken) {
			const response = await gapi.client.drive.files.list({
				q: "trashed=false and (mimeType contains 'image/' or mimeType contains 'video/')",
				fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedByMeTime)',
				pageSize: 1000,
				pageToken: pageToken,
			})
			files = files.concat(response.result.files || [])
		}

		return files || [];
	} catch (error) {
		console.error('Error fetching files:', error);
		throw error;
	}
};

// == FOLDERS =================================================================

export const getRootFolderId = async (): Promise<string | undefined> => {
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

export const fetchFolderContents = async (folderId: string): Promise<IDirectory> => {
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
