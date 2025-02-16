import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router"
import App from './App.tsx'
import 'bootstrap/dist/js/bootstrap.js'
import './css/style.scss'

createRoot(document.getElementById('root')!).render(
	<BrowserRouter>
		<StrictMode>
			<App />
		</StrictMode>
	</BrowserRouter>
)
