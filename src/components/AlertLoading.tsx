import React from 'react'

interface AlertLoadingProps {
	title?: string;
	subtitle?: string;
}

const AlertLoading: React.FC<AlertLoadingProps> = ({ title = 'loading...' }) => {
	return (
		<section className="flex justify-center items-center min-h-80 w-full">
			<div className="card w-96 bg-base-100 shadow-xl">
				<div className="card-body items-center text-center">
					<span className="loading loading-spinner loading-lg"></span>
					<h3 role="status" className="card-title capitalize mt-4">{title}</h3>
				</div>
			</div>
		</section>
	)
}

export default AlertLoading
