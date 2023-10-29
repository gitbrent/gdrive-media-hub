import React from 'react'

interface NoImagesAlertProps {
	title?: string;
	subtitle?: string;
}

const NoImagesAlert: React.FC<NoImagesAlertProps> = ({ title = 'say less bro', subtitle = '(no images to display)' }) => {
	return (
		<section className="text-center my-5">
			<div className="alert alert-warning d-inline-flex align-items-center" role="alert">
				<div className="row align-items-center no-gutters gx-2">
					<div className="col-auto">
						<i className="bi-exclamation-triangle-fill display-3"></i>
					</div>
					<div className="col">
						<div>
							<h3 className="mb-0">{title}</h3>
						</div>
						<div>
							<p className="mb-0">{subtitle}</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}

export default NoImagesAlert
