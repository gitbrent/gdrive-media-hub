import { IGapiItem } from '../App.props'

export const isVideo = (item: IGapiItem): boolean => item.mimeType.startsWith('video/')
export const isImage = (item: IGapiItem): boolean => item.mimeType.startsWith('image/')
export const isFolder = (item: IGapiItem): boolean => item.mimeType === 'application/vnd.google-apps.folder'
