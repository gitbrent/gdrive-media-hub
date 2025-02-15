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
				silenceDeprecations: ['mixed-decls', 'color-functions', 'global-builtin', 'import'],
				quietDeps: true, // Add this line to suppress warnings (above needed for bootstrap SCSS Dart messages)
			},
		},
	},
	/* following is suppress: `node_modules/gapi-script/gapiScript.js (44:36): Use of eval in "node_modules/gapi-script/gapiScript.js" is [...].` */
	build: {
		rollupOptions: {
			onwarn: (warning, warn) => {
				if (warning.code === 'EVAL') {  // Suppress eval warnings
					return;
				}
				warn(warning); // Otherwise, show other warnings
			}
		}
	}
})
