/**
 * custom hook so state changes cause renders in AppMainUI
 */
import { useEffect, useState } from 'react'
import { IGapiFile, log } from '../App.props'
import * as AppMainLogic from '../AppMainLogic'

export const useAppMain = () => {
	let isLoading = false
	const [allFiles, setAllFiles] = useState<IGapiFile[]>([])
	const [authUserName, setAuthUserName] = useState<string | null>(null)
	const [authUserPict, setAuthUserPict] = useState<string | null>(null)
	const [isBusyGapiLoad, setIsBusyGapiLoad] = useState<boolean>(false)

	function callbackInit() {
		log(2, '[useAppMain] callbackInit called')
		log(2, `[useAppMain] allFiles.length = ${AppMainLogic.allFiles().length}`)

		setAllFiles(AppMainLogic.allFiles())
		setAuthUserName(AppMainLogic.authUserName())
		setAuthUserPict(AppMainLogic.authUserPict())
		setIsBusyGapiLoad(AppMainLogic.isBusyGapiLoad())
		isLoading = false

		log(1, '[useAppMain] ...DONE! ----------------------------')
		log(1, '[useAppMain] -------------------------------------')
	}

	/**
	 * This file/hook will get called more than once on startup b/c react does whatever it does
	 * - the `isLoading` flag limits the process to a single thread
	 */
	useEffect(() => {
		if (!isLoading) {
			isLoading = true
			log(1, '[useAppMain] -------------------------------------')
			log(1, '[useAppMain] STARTING UP... ----------------------')
			AppMainLogic.doInitGoogleApi(callbackInit)
		}
	}, [])

	return {
		allFiles,
		authUserName,
		authUserPict,
		isBusyGapiLoad,
		handleAuthClick: AppMainLogic.handleAuthClick,
		handleSignOutClick: AppMainLogic.handleSignOutClick,
		handleClearFileCache: AppMainLogic.handleClearFileCache,
		downloadFile: AppMainLogic.downloadFile,
		loadPageImages: AppMainLogic.loadPageImages,
		getFileAnalysis: AppMainLogic.getFileAnalysis,
		getUserAuthState: AppMainLogic.getUserAuthState,
		getCacheStatus: AppMainLogic.getCacheStatus
	}
}
