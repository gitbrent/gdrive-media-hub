/**
 * custom hook so state changes cause renders in AppMainUI
 */
import { useEffect, useState } from 'react'
import { IGapiFile, IS_LOCALHOST } from '../App.props'
import * as AppMainLogic from '../AppMainLogic'

export const useAppMain = () => {
	let isLoading = false
	const [allFiles, setAllFiles] = useState<IGapiFile[]>([])
	const [authUserName, setAuthUserName] = useState<string | null>(null)
	const [authUserPict, setAuthUserPict] = useState<string | null>(null)
	const [isBusyGapiLoad, setIsBusyGapiLoad] = useState<boolean>(false)

	function callbackInit() {
		if (IS_LOCALHOST) console.log('useAppMain.callbackInit')
		setAllFiles(AppMainLogic.allFiles())
		setAuthUserName(AppMainLogic.authUserName())
		setAuthUserPict(AppMainLogic.authUserPict())
		setIsBusyGapiLoad(AppMainLogic.isBusyGapiLoad())
		isLoading = false
	}

	/**
	 * This file/hook will get called more than once on startup b/c react does whatever it does
	 * - the `isLoading` flag limits the process to a single thread
	 */
	useEffect(() => {
		if (!isLoading) {
			isLoading = true
			if (IS_LOCALHOST) console.log('useAppMain.isLoading')
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
