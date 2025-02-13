import React, { useState, useEffect, ReactNode, useContext } from 'react'
import { isGif, isImage, isVideo } from './utils/fileHelpers'
import { listFiles, getCurrentUserProfile } from '.'
import { IMediaFile, log } from '../App.props'
import { AuthContext } from './AuthContext'
import { DataContext } from './DataContext'

interface DataProviderProps {
	children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
	const [userProfile, setUserProfile] = useState<gapi.auth2.BasicProfile | null>(null)
	const [mediaFiles, setMediaFiles] = useState<IMediaFile[]>([])
	const [blobUrlCache, setBlobUrlCache] = useState<Record<string, string>>({})
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const { isSignedIn } = useContext(AuthContext)

	const refreshData = async () => {
		log(2, `[DataProvider] refreshData!`)
		try {
			setIsLoading(true);
			const gapiFiles = await listFiles();
			const mediaFiles = gapiFiles
				.filter((file) => file.id !== undefined && file.id !== null)
				.map((file) => ({
					...file,
					// Initialize or map any additional properties specific to IMediaFile
					original: '', // *REQUIRED* to hold image blob later
				})) as IMediaFile[];
			setMediaFiles(mediaFiles);
			const profile = getCurrentUserProfile();
			setUserProfile(profile);
		} catch (error) {
			console.error('Error refreshing data:', error);
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		log(2, `[DataProvider] isSignedIn = ${isSignedIn}`)
		if (isSignedIn) refreshData();
	}, [isSignedIn])

	// TODO: REMOVE - update VideoPlayer to be like SlideShow, then no other calls to this exist [20250210]
	const downloadFile = async (fileId: string): Promise<boolean> => {
		try {
			log(2, `[DataProvider] downloadFile = ${fileId}`)
			const file = mediaFiles.find((item) => item.id === fileId);
			if (!file) {
				console.warn(`File not found: "${fileId}"`);
				return false;
			}

			const accessToken = gapi.auth.getToken()?.access_token;
			if (!accessToken) {
				console.error('Access token is not available.');
				return false;
			}

			const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
				method: 'GET',
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			if (response.ok) {
				const blob = await response.blob();
				const objectUrl = URL.createObjectURL(blob);

				if (isImage(file) || isGif(file)) {
					return new Promise((resolve) => {
						const img = new Image();
						img.src = objectUrl;
						img.onload = () => {
							const updatedFiles = mediaFiles.map((f) =>
								f.id === fileId
									? {
										...f,
										original: objectUrl,
										width: img.width || 100,
										height: img.height || 100,
									}
									: f
							);
							setMediaFiles(updatedFiles);
							resolve(true);
						};
						img.onerror = () => {
							console.error('Error loading image');
							resolve(false);
						};
					});
				} else if (isVideo(file)) {
					const updatedFiles = mediaFiles.map((f) =>
						f.id === fileId
							? {
								...f,
								original: objectUrl,
								// Optionally set width and height
							}
							: f
					);
					setMediaFiles(updatedFiles);
					return true;
				} else {
					console.warn(`Unknown mimeType: ${file.mimeType}`);
					console.warn(`File name: ${file.name}`);
					return false;
				}
			} else {
				console.error('Failed to fetch file content. ', response);
				return false;
			}
		} catch (error) {
			console.error(`Failed to download file with ID ${fileId}:`, error);
			return false;
		}
	}

	/**
	 * Fetches the file content as a blob from Google Drive.
	 * @param fileId The ID of the file to fetch.
	 * @returns A Response object if successful, or null if an error occurs.
	 */
	const fetchFileImgBlob = async (fileId: string): Promise<Response | null> => {
		try {
			const accessToken = gapi.auth.getToken()?.access_token;
			if (!accessToken) {
				console.error('Access token is not available.');
				return null;
			}

			const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
				method: 'GET',
				headers: { Authorization: `Bearer ${accessToken}` },
			});

			if (response.ok) {
				return response;
			} else {
				console.error('Failed to fetch file blob:', response.statusText);
				return null;
			}
		} catch (error) {
			console.error('Error fetching file blob:', error);
			return null;
		}
	}

	/**
	 * Retrieves the blob URL for a file, fetching it if not cached.
	 * @param fileId The ID of the file.
	 * @returns The blob URL as a string, or null if an error occurs.
	 */
	const getBlobUrlForFile = async (fileId: string): Promise<string | null> => {
		if (blobUrlCache[fileId]) {
			// Return the cached blob URL
			return blobUrlCache[fileId];
		} else {
			const response = await fetchFileImgBlob(fileId);
			if (response) {
				const blob = await response.blob();
				const blobUrl = URL.createObjectURL(blob);
				// Update the cache
				setBlobUrlCache((prevCache) => ({ ...prevCache, [fileId]: blobUrl }));
				return blobUrl;
			} else {
				return null;
			}
		}
	}

	/**
	 * Releases all blob URLs from the cache.
	 */
	const releaseAllBlobUrls = () => {
		function releaseBlobUrl(fileId: string) {
			const blobUrl = blobUrlCache[fileId];
			if (blobUrl) {
				URL.revokeObjectURL(blobUrl);
				delete blobUrlCache[fileId];
			}
		}

		Object.keys(blobUrlCache).forEach(releaseBlobUrl);
	}

	return (
		<DataContext.Provider
			value={{
				mediaFiles, userProfile, refreshData, isLoading,
				downloadFile, getBlobUrlForFile, releaseAllBlobUrls
			}}>
			{children}
		</DataContext.Provider>
	)
}
