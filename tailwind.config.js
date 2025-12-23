/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				// Chart Colors - keep your existing data viz palette
				'chart-1': '#60a5fa',
				'chart-2': '#a78bfa',
				'chart-3': '#f472b6',
				'chart-4': '#fb923c',
				'chart-5': '#2dd4bf',
				'chart-6': '#facc15',
				'chart-7': '#f87171',
				'chart-8': '#818cf8',
				'chart-9': '#34d399',
				'chart-10': '#22d3ee',
			},
			backgroundImage: {
				// KPI Card Gradients
				'gradient-purple': 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
				'gradient-red': 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
				'gradient-blue': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
				'gradient-green': 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
				'gradient-pink': 'linear-gradient(135deg, #f472b6 0%, #be185d 100%)',
				'gradient-orange': 'linear-gradient(135deg, #fb923c 0%, #c2410c 100%)',
				'gradient-teal': 'linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)',
				'gradient-violet': 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
				'gradient-sky': 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
				'radial-blue': 'radial-gradient(ellipse at center, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.05) 40%, #0f172a 100%)',
			},
			boxShadow: {
				'purple': '0 4px 14px 0 rgba(139, 92, 246, 0.25)',
				'red': '0 4px 14px 0 rgba(239, 68, 68, 0.25)',
				'blue': '0 4px 14px 0 rgba(59, 130, 246, 0.25)',
				'green': '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
			},
		},
	},
	plugins: [require("daisyui")],
	daisyui: {
		themes: ["dim", "darkbrent"],
	},
}
