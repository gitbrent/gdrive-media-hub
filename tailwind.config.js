/** @type {import('tailwindcss').Config} */

import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	plugins: [react(), tailwindcss(), require("daisyui")],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	daisyui: {
		themes: ["dim", "darkbrent"],
	},
})
