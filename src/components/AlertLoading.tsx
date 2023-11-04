import React from 'react'

interface AlertLoadingProps {
	title?: string;
	subtitle?: string;
}

const AlertLoading: React.FC<AlertLoadingProps> = ({ title = 'loading...' }) => {
	return (
		<section className="text-center my-5">
			<div className="alert alert-primary d-inline-flex" role="alert">
				<div className="d-flex align-items-center">
					<div className="spinner-border" aria-hidden="true"></div>
					<strong className="mx-3" role="status">{title}</strong>
				</div>
			</div>
		</section>
	)
}

export default AlertLoading
