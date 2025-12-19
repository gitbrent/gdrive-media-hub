import React, { useState, useEffect, ReactNode } from 'react';
import { gapi } from 'gapi-script';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [isSignedIn, setIsSignedIn] = useState<boolean>(false);

	useEffect(() => {
		try {
			const auth = gapi.auth2.getAuthInstance();
			if (auth) {
				// FIXME: we'll address this when upgrading from gapi to Google Identity Services (20251219)
				// eslint-disable-next-line react-hooks/set-state-in-effect
				setIsSignedIn(auth.isSignedIn.get());
				auth.isSignedIn.listen(setIsSignedIn);
			} else {
				console.error('gapi.auth2.getAuthInstance() returned null');
			}
		} catch (error) {
			console.error('Error accessing gapi.auth2:', error);
		}
	}, []);

	const signIn = (forceConsent: boolean = false) => {
		//console.log('Initiating sign-in process', forceConsent ? 'with forced consent' : '');
		const options = forceConsent ? { prompt: 'consent' } : {};
		gapi.auth2.getAuthInstance().signIn(options);
	};

	const signOut = () => {
		gapi.auth2.getAuthInstance().signOut();
	};

	return (
		<AuthContext.Provider value={{ isSignedIn, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	);
};
