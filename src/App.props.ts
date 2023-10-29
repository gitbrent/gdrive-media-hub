// APP
// @see [SampleImages](https://unsample.net/)
export const APP_BLD = '20231028-2101'
export const APP_VER = '1.3.0-WIP'
export const IS_LOCALHOST = window.location.href.toLowerCase().indexOf('localhost?show=gapi') > -1

// ============================================================================

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

export enum OPT_SORTBY {
	modDate = 'Modified Date',
	filName = 'File Name'
}

export enum OPT_SORTDIR {
	asce = 'Ascending',
	desc = 'Descinding'
}
