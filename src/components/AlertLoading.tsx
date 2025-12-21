import React from 'react'
import '../css/AlertLoading.css'

interface AlertLoadingProps {
	title?: string;
	subtitle?: string;
}

const AlertLoading: React.FC<AlertLoadingProps> = ({ title = 'loading...' }) => {
	return (
		<section className="loading-container">
			<div className="loading-card">
				<div className="loading-spinner-wrapper">
					<div className="loading-spinner">
						<div className="spinner-ring"></div>
						<div className="spinner-ring"></div>
						<div className="spinner-ring"></div>
					</div>
				</div>
				<div className="loading-content">
					<h3 className="loading-title" role="status">{title}</h3>
				</div>
			</div>
		</section>
	)
}

export default AlertLoading
