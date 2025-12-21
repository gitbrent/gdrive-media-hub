/**
 * APP
 * @see [SampleImages](https://unsample.net/)
 */
export const APP_BLD = '20251221-1045'
export const APP_VER = '1.3.0-WIP'

/** Debug mode - shows development-only UI/features */
export const DEBUG = (() => {
	const urlParams = new URLSearchParams(window.location.search)
	const mode = urlParams.get('mode')
	return import.meta.env.DEV || mode === 'debug'
})()

// ============================================================================

export const getLogLevel = (): number => {
	const urlParams = new URLSearchParams(window.location.search)
	const mode = urlParams.get('mode')

	switch (mode) {
		case 'debug': return 3
		case 'api': return 2
		case 'core': return 1
		default: return 0
	}
}
export const LOG_LEVEL = getLogLevel()

export const log = (level: number, message: string) => {
	if (level <= LOG_LEVEL) {
		console.log(message)
	}
}

// ============================================================================

export const formatBytes = (bytes: number, decimals = 2) => {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const dm = decimals < 0 ? 0 : decimals
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const formatBytesToMB = (bytes: number, decimals = 2) => {
	if (bytes === 0) return '0 MB'
	const mb = bytes / (1024 * 1024)
	const formattedMB = mb.toFixed(decimals < 0 ? 0 : decimals)
	return `${formattedMB} MB`
}

export const formatDate = (dateString: string, format: 'full' | 'short' = 'full') => {
	const date = new Date(dateString)

	const year = date.getFullYear()
	const month = (date.getMonth() + 1).toString().padStart(2, '0') // getMonth() is zero-based
	const day = date.getDate().toString().padStart(2, '0')
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')

	if (format === 'short') {
		return `${year}-${month}-${day}`
	} else { // full format
		return `${year}-${month}-${day} @ ${hours}:${minutes}`
	}
}

// ============================================================================

export enum OPT_SORTBY {
	modDate = 'Modified Date',
	filName = 'File Name',
	filSize = 'File Size'
}

export enum OPT_SORTDIR {
	asce = 'Ascending',
	desc = 'Descinding'
}

// ----------------------------------------------------------------------------

export interface IPageSize { title: string, size: number }
export const PageSizes: IPageSize[] = [
	{ title: '8 posts', size: 8 },
	{ title: '16 posts', size: 16 },
	{ title: '24 posts', size: 24 },
	{ title: '48 posts', size: 48 },
]

export interface IGridSize { title: string, css: string }
export const GridSizes: IGridSize[] = [
	{ title: '4 (sml)', css: '4rem' },
	{ title: '8 (med)', css: '8rem' },
	{ title: '12 (lg)', css: '12rem' },
	{ title: '16 (xl)', css: '16rem' },
]

export const FileSizeThresholds = {
	Tiny: 100 * 1024,        // files up to 100kb
	Small: 500 * 1024,       // files up to 500kb
	Medium: 1 * 1024 * 1024, // files up to 1MB
	Large: 5 * 1024 * 1024,  // files up to 5MB
	Giant: 10 * 1024 * 1024, // files up to 10MB
	Huge: 25 * 1024 * 1024,  // files up to 25MB
}

export interface IGapiFile extends gapi.client.drive.File {
	/**
	 * file id
	 * @summary optional in gapi client, made required to avoid checking constantly!
	 * @example "1l5mVFTysjVoZ14_unp5F8F3tLH7Vkbtc"
	 */
	id: string
	/**
	 * mime type
	 * @example "application/json"
	 */
	mimeType: string
	/**
	 * modified time (ISO format)
	 * @example "2022-11-21T14:54:14.453Z"
	 */
	modifiedByMeTime: string
	/**
	 * file name
	 * @example "corp-logo.png"
	 */
	name: string
	/**
	 * file size (bytes)
	 * - only populated for files
	 * @example "3516911"
	 */
	size?: string
	/**
	 * IDs of parent folders
	 * @example ["1jjOs28hGj3as3vorJveCI00NY1PmDbTr"]
	 */
	parents?: string[] | undefined
}

// NOTE: prop names follow [PhotoswipeGalleryItems] **DO NOT RENAME**
export interface IMediaFile extends IGapiFile {
	/**
	 * Url of image
	 * @example "blob:http://localhost:3000/fa7ff500-2d80-4e57-a2e7-ab4992e01bf6"
	 */
	original?: string
	width?: string | number
	height?: string | number
	caption?: string
	thumbnail?: string
	blobUrlError?: string
}

export interface IGapiFolder extends IGapiFile {
	children: IGapiFolder[]
}

export interface IDirectory {
	currentFolder: IGapiFolder
	items: Array<IMediaFile | IGapiFolder>
}

export interface BreadcrumbSegment {
	folderName: string
	folderId: string
}

// ----------------------------------------------------------------------------

export interface IFileListCache {
	timeStamp: number
	gapiFiles: IMediaFile[]
}

export interface IFileAnalysis {
	total_files: number
	total_size: number
	file_types: Record<string, number>
	file_years: Record<string, number>
	file_types_by_year: Record<string, Record<string, number>>
	common_names: Record<string, number>
	size_categories: Record<string, number>
}
