export interface IGapiCurrUser {
	"le": {
		"wt": {
			/**
			 * Full Name
			 * @example "Git Brent"
			 */
			"Ad": string,
			/**
			 * First Name
			 * @example "Git"
			 */
			"rV": string,
			/**
			 * Last Name
			 * @example "Brent"
			 */
			"uT": string,
			/**
			 * Account Picture
			 * @example "https://lh3.googleusercontent.com/a/ALm5wu3R_tKI4hZd9DbwPh8SShfBYgaNN95WZYZYvfwy=s96-c"
			 */
			"hK": string,
			/**
			 * Email
			 * @example "gitbrent@gmail.com"
			 */
			"cu": string
		}
	},
}

export interface IGapiFile {
	/**
	 * id
	 * @example "1l5mVFTysjVoZ14_unp5F8F3tLH7Vkbtc"
	 */
	id: string
	/**
	 * created time (ISO format)
	 * @example "2022-11-21T14:54:14.453Z"
	 */
	createdTime: string
	/**
	 * mime type
	 * @example "application/json"
	 */
	mimeType: string
	/**
	 * modified time (ISO format)
	 * @example "2022-11-21T14:54:14.453Z"
	 */
	modifiedTime: string
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
	imageBlobUrl: string
}

export enum OPT_SORTBY {
	modDate = 'Modified Date',
	filName = 'File Name'
}

export enum OPT_SORTDIR {
	asc = 'Ascending',
	desc = 'Descinding'
}

export enum OPT_PAGESIZE {
	ps08 = '8 items',
	ps12 = '12 items',
	ps24 = '24 items',
	ps48 = '48 items',
}
