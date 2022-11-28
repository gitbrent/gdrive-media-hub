import React from 'react'
import { IGapiFile } from './App.props'

export interface IProps {
	showFiles: IGapiFile[]
	updTimestamp: string
}

// TODO: use this component for VIDEO files

export default function AppImgGrid(props: IProps) {
	return (<section>
		<div id='imgGrid' className='p-4 bg-dark'>
			<div className='row row-cols-1 row-cols-md-2 row-cols-lg-4 justify-content-between align-items-center g-4' data-desc={props.updTimestamp}>
				{props.showFiles.map((file) =>
					<div key={file.id} className='col'>
						{file.imageBlobUrl && file.mimeType.indexOf('video') > -1 ?
							<video width="320" height="240" controls={true}>
								<source src={file.imageBlobUrl} type='video/mp4' />
							</video>
							: file.imageBlobUrl ?
								<img src={file.imageBlobUrl} alt={file.name} />
								:
								<div className='text-center'>
									<div className="spinner-grow text-primary" role="status">
										<span className="visually-hidden">Loading...</span>
									</div>
								</div>
						}
					</div>
				)}
			</div>
		</div>
	</section>)
}
