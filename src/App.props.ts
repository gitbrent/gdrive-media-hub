/**
 * APP
 * @see [SampleImages](https://unsample.net/)
 */
export const APP_BLD = '20231112-2020'
export const APP_VER = '2.0.0-WIP'

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

export const formatDate = (dateString: string) => {
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}

	return new Date(dateString).toLocaleString('en-US', options)
}

// ============================================================================

export enum OPT_SORTBY {
	modDate = 'Modified Date',
	filName = 'File Name'
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

// ----------------------------------------------------------------------------

export enum AuthState {
	Authenticated = 'Authenticated',
	Unauthenticated = 'Unauthenticated',
	Expired = 'Expired',
}
export interface IAuthState {
	status: AuthState
	userName: string
	userPict: string
}

// ----------------------------------------------------------------------------

export interface IGapiItem extends gapi.client.drive.File {
	/**
	 * id
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
	parents: string[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IGapiFile extends IGapiItem {
}

export interface IMediaFile extends IGapiFile {
	imageBlobUrl?: string;
	imageW?: number;
	imageH?: number;
	videoBlobUrl?: string;
	// Other media-specific properties...
}

export interface IGapiFolder extends IGapiItem {
	children: IGapiFolder[]
}

export interface IDirectory {
	currentFolder: IGapiFolder
	items: Array<IGapiFile | IGapiFolder>
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
	common_names: Record<string, number>
	size_categories: Record<string, number>
}
