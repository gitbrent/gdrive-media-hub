import { IGapiFile } from '../App.props'

// NOTE: we filter all but mp4 to ensure they play
export const isVideo = (item: IGapiFile): boolean => item.mimeType.startsWith('video/mp4')

export const isImage = (item: IGapiFile): boolean => item.mimeType.startsWith('image/')

export const isFolder = (item: IGapiFile): boolean => item.mimeType === 'application/vnd.google-apps.folder'
