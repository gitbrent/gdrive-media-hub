import React from "react"
import logo from "./logo.svg"
import AppMain from './AppMain.tsx'
import "./App.css"
//import './firebaseConfig.ts'

/*
  const button = document.getElementById(‘signout_button’);
	button.onclick = () => {
	  google.accounts.id.disableAutoSelect();
	}
*/

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<p>Edit <code>src/App.js</code> and save to reload.</p>
				<a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
					Learn React
				</a>
			</header>
			<AppMain />
			<section style={{ backgroundColor: '#eee', padding: '2rem' }}>
				<div id="g_id_onload"
					data-client_id="293663430835-1se89ppg5maotvqdjhmkesl7o7fsmecc.apps.googleusercontent.com"
					//data-login_uri="https://gdrive-media-hub.web.app"
					data-login_uri="https://localhost:3000"
					data-auto_select="true"
					data-callback="handleCredentialResponse">
				</div>
				<div className="g_id_signout">Sign Out</div>
			</section>
		</div>
	)
}

export default App
