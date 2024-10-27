import { IGapiFile } from '../App.props'

export const isVideo = (item: IGapiFile): boolean => item.mimeType?.startsWith('video/')

export const isImage = (item: IGapiFile): boolean => item.mimeType?.startsWith('image/') && !item.mimeType?.startsWith('image/gif')

export const isGif = (item: IGapiFile): boolean => item.mimeType?.startsWith('image/gif')

/**
 * isVideo || isImage
 * @param item
 * @returns
 */
export const isMedia = (item: IGapiFile): boolean => isVideo(item) || isImage(item) || isGif(item)

export const isFolder = (item: IGapiFile): boolean => item.mimeType?.startsWith('application/vnd.google-apps.folder')
