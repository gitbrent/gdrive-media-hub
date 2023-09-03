import React, { useEffect, useState } from 'react'
import { IGapiFile } from './App.props'

interface Props {
	duration: number;
	images: IGapiFile[];
	downloadFile: (fileId: string) => Promise<boolean>;
}

const Slideshow: React.FC<Props> = ({ images, duration, downloadFile }) => {
	const [currentIndex, setCurrentIndex] = useState(0)

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex(Math.floor(Math.random() * images.length))
		}, duration * 1000)

		return () => clearInterval(interval)
	}, [duration, images.length])

	useEffect(() => {
		const idxImage = images[currentIndex]
		if (!idxImage.imageBlobUrl) {
			downloadFile(idxImage.id)
		}
	}, [currentIndex])

	const currentImage = images[currentIndex]

	return (
		<div className='slideShowContainer'>
			<div className='slideShowMain'>
				<img src={currentImage.imageBlobUrl} />
			</div>
		</div>
	)
}

export default Slideshow
