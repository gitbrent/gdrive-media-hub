import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { listFiles, getCurrentUserProfile } from './';
import { IMediaFile } from '../App.props';

interface DataContextProps {
	mediaFiles: IMediaFile[];
	userProfile: gapi.auth2.BasicProfile | null;
	refreshData: () => void;
}

export const DataContext = createContext<DataContextProps>({
	mediaFiles: [],
	userProfile: null,
	refreshData: () => { },
});

interface DataProviderProps {
	children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
	const [mediaFiles, setMediaFiles] = useState<IMediaFile[]>([]);
	const [userProfile, setUserProfile] = useState<gapi.auth2.BasicProfile | null>(null);

	const refreshData = async () => {
		try {
			const files = await listFiles();
			setMediaFiles(files);

			const profile = getCurrentUserProfile();
			setUserProfile(profile);
		} catch (error) {
			console.error('Error refreshing data:', error);
		}
	};

	useEffect(() => {
		refreshData();
	}, []);

	return (
		<DataContext.Provider value={{ mediaFiles, userProfile, refreshData }}>
			{children}
		</DataContext.Provider>
	);
};
