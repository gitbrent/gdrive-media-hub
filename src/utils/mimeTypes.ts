import { IGapiFile } from '../App.props'

export const isVideo = (item: IGapiFile): boolean => item.mimeType.startsWith('video/')

export const isImage = (item: IGapiFile): boolean => item.mimeType.startsWith('image/')

/**
 * isVideo || isImage
 * @param item
 * @returns
 */
export const isMedia = (item: IGapiFile): boolean => isVideo(item) || isImage(item)

export const isFolder = (item: IGapiFile): boolean => item.mimeType === 'application/vnd.google-apps.folder'
