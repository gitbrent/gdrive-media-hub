import { createContext } from "react";
import { IMediaFile } from '../App.props';

interface DataContextProps {
	mediaFiles: IMediaFile[];
	userProfile: gapi.auth2.BasicProfile | null;
	refreshData: () => void;
	isLoading: boolean;
	downloadFile: (fileId: string) => Promise<boolean>;
	loadPageImages: (fileIds: string[]) => Promise<boolean>;
	getBlobForFile: (fileId: string) => Promise<string | null>;
}

export const DataContext = createContext<DataContextProps>({
	mediaFiles: [],
	userProfile: null,
	refreshData: () => { },
	isLoading: false,
	downloadFile: async () => false,
	loadPageImages: async () => false,
	getBlobForFile: async () => '',
});
