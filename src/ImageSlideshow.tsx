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

	/**
	 * Pre-load images
	 * @description Not all images will have had their blob downloaded yet, so look ahead and fetch the next 3 images
	 */
	useEffect(() => {
		for (let i = 1; i <= 3; i++) {
			const nextIndex = currentIndex + i
			if (nextIndex < images.length && !images[nextIndex].imageBlobUrl) {
				downloadFile(images[nextIndex].id)
			}
		}
	}, [currentIndex])

	const currentImage = images[currentIndex]

	return (
		<div className='slideShowContainer'>
			<div className='slideShowMain'>
				{currentImage.imageBlobUrl ? <img src={currentImage.imageBlobUrl} /> : <i className="h1 mb-0 bi-arrow-repeat" />}
			</div>
		</div>
	)
}

export default Slideshow
