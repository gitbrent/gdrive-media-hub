/**
 * custom hook so state changes cause renders in AppMainUI
 */
import { useEffect, useState } from 'react'
import { IGapiFile } from './App.props'
import * as AppMainLogic from './AppMainLogic'

export const useAppMain = () => {
	const [allFiles, setAllFiles] = useState<IGapiFile[]>([])
	const [authUserName, setAuthUserName] = useState<string | null>(null)
	const [authUserPict, setAuthUserPict] = useState<string | null>(null)
	const [isBusyGapiLoad, setIsBusyGapiLoad] = useState<boolean>(false)

	function callbackInit() {
		setAllFiles(AppMainLogic.allFiles())
		setAuthUserName(AppMainLogic.authUserName())
		setAuthUserPict(AppMainLogic.authUserPict())
		setIsBusyGapiLoad(AppMainLogic.isBusyGapiLoad())
	}

	useEffect(() => {
		AppMainLogic.doInitGoogleApi(callbackInit)
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
		getFileAnalysis: AppMainLogic.getFileAnalysis
	}
}
