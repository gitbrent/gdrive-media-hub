import { createContext } from "react";

interface AuthContextProps {
	isSignedIn: boolean;
	signIn: (forceConsent?: boolean) => void;
	signOut: () => void;
}

export const AuthContext = createContext<AuthContextProps>({
	isSignedIn: false,
	signIn: () => { },
	signOut: () => { },
});
