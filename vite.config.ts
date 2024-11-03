import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// [BDE]: Use port 3000 like CRA as thats what google API is expecting
export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000
	},
	css: {
		preprocessorOptions: {
			scss: {
				quietDeps: true, // Add this line to suppress warnings
			},
		},
	}
})
