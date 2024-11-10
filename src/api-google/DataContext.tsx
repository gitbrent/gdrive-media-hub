import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { listFiles, getCurrentUserProfile } from './';
import { IMediaFile } from '../App.props';

interface DataContextProps {
	mediaFiles: IMediaFile[];
	userProfile: gapi.auth2.BasicProfile | null;
	refreshData: () => void;
	isLoading: boolean;
}

export const DataContext = createContext<DataContextProps>({
	mediaFiles: [],
	userProfile: null,
	refreshData: () => { },
	isLoading: false,
});

interface DataProviderProps {
	children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
	const [mediaFiles, setMediaFiles] = useState<IMediaFile[]>([]);
	const [userProfile, setUserProfile] = useState<gapi.auth2.BasicProfile | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const refreshData = async () => {
		try {
			setIsLoading(true);
			const files = await listFiles();
			setMediaFiles(files);

			const profile = getCurrentUserProfile();
			setUserProfile(profile);
		} catch (error) {
			console.error('Error refreshing data:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		refreshData();
	}, []);

	return (
		<DataContext.Provider value={{ mediaFiles, userProfile, refreshData, isLoading }}>
			{children}
		</DataContext.Provider>
	);
};
