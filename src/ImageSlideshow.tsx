import React, { useEffect, useState } from 'react'
import { IGapiFile } from './App.props'

interface Props {
	images: IGapiFile[];
	duration: number;
}

const Slideshow: React.FC<Props> = ({ images, duration }) => {
	const [currentIndex, setCurrentIndex] = useState(0)

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex((currentIndex + 1) % images.length)
		}, duration * 1000)

		return () => clearInterval(interval)
	}, [currentIndex, duration, images.length])

	return (
		<div>
			{images[currentIndex] && (
				<img src={images[currentIndex].imageBlobUrl} style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', margin: 'auto' }} />
			)}
		</div>
	)
}

export default Slideshow
