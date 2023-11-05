// APP
// @see [SampleImages](https://unsample.net/)
export const APP_BLD = '20231104-1800'
export const APP_VER = '2.0.0-WIP'
export const IS_LOCALHOST = window.location.href.toLowerCase().indexOf('?mode=debug') > -1

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
	Tiny: 100 * 1024,        // files up to 100KB
	Small: 1 * 1024 * 1024,  // files up to 1MB
	Medium: 5 * 1024 * 1024, // files up to 5MB
	Large: 10 * 1024 * 1024, // files up to 10MB
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

export interface IGapiFile extends gapi.client.drive.File {
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
	 * blob from google drive
	 * - custom property (not in GAPI API)
	 * @example "blob:http://localhost:3000/2ba6f9a8-f8cf-4242-af53-b89418441b53"
	 */
	imageBlobUrl?: string
	imageW?: number
	imageH?: number
	/**
	 * FUTURE: show parent folder
	 * `application/vnd.google-apps.folder`
	 * @example ["1jjOs28hGj3as3vorJveCI00NY1PmDbTr"]
	 */
	// parents: string[]
}

export interface IFileAnalysis {
	total_files: number
	total_size: number
	file_types: Record<string, number>
	file_years: Record<string, number>
	common_names: Record<string, number>
	size_categories: Record<string, number>
}
