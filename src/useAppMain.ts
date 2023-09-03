/**
 * custom hook so state changes cause renders in AppMainUI
 */
import { useEffect, useState } from 'react'
import { IGapiFile } from './App.props'
import * as AppMainLogic from './AppMainLogic'

export const useAppMain = () => {
	const [allFiles, setAllFiles] = useState<IGapiFile[]>([])
	const [signedInUser, setSignedInUser] = useState<string | null>(null)
	const [isBusyGapiLoad, setIsBusyGapiLoad] = useState<boolean>(false)

	function callbackInit() {
		setAllFiles(AppMainLogic.allFiles())
		setSignedInUser(AppMainLogic.signedInUser())
		setIsBusyGapiLoad(AppMainLogic.isBusyGapiLoad())
	}

	useEffect(() => {
		AppMainLogic.doInitGoogleApi(callbackInit)
	}, [])

	return {
		allFiles,
		signedInUser,
		isBusyGapiLoad,
		handleAuthClick: AppMainLogic.handleAuthClick,
		handleSignOutClick: AppMainLogic.handleSignOutClick,
		downloadFile: AppMainLogic.downloadFile,
		loadPageImages: AppMainLogic.loadPageImages,
	}
}
