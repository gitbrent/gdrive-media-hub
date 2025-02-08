//import { gapi } from 'gapi-script';

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

		const files = response.result.files;
		return files || [];
	} catch (error) {
		console.error('Error fetching files:', error);
		throw error;
	}
};
