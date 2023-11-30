import { IGapiItem } from '../App.props'

// NOTE: we filter all but mp4 to ensure they play
export const isVideo = (item: IGapiItem): boolean => item.mimeType.startsWith('video/mp4')

export const isImage = (item: IGapiItem): boolean => item.mimeType.startsWith('image/')

export const isFolder = (item: IGapiItem): boolean => item.mimeType === 'application/vnd.google-apps.folder'
