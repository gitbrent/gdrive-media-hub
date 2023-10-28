import React, { useEffect, useState } from 'react'
import { IGapiFile } from '../App.props'
import '../css/Slideshow.css'

interface Props {
	allFiles: IGapiFile[];
	downloadFile: (fileId: string) => Promise<boolean>;
	duration: number; // TODO: change to slideshowOptions object, add to upcoming OPTIOMNS tab
}

const ImageSlideshow: React.FC<Props> = ({ allFiles, duration, downloadFile }) => {
	const [shuffledImages, setShuffledImages] = useState<IGapiFile[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [usedIndices, setUsedIndices] = useState<number[]>([])
	//
	const currentImage = shuffledImages[currentIndex]

	// Shuffle images once at the beginning
	useEffect(() => {
		const shuffled = [...allFiles].sort(() => Math.random() - 0.5)
		setShuffledImages(shuffled)
	}, [allFiles])

	// Slide-show logic
	useEffect(() => {
		const interval = setInterval(() => {
			if (shuffledImages.length === 0) return
			const nextIndex = (currentIndex + 1) % shuffledImages.length
			setCurrentIndex(nextIndex)
			setUsedIndices([...usedIndices, nextIndex])
		}, duration * 1000)

		return () => clearInterval(interval)
	}, [duration, currentIndex, shuffledImages, usedIndices])

	// Pre-fetching logic
	useEffect(() => {
		for (let i = 1; i <= 3; i++) {
			const nextIndex = (currentIndex + i) % shuffledImages.length
			if (!shuffledImages[nextIndex]?.imageBlobUrl) {
				downloadFile(shuffledImages[nextIndex]?.id)
			}
		}
	}, [currentIndex, shuffledImages, downloadFile])

	// --------------------------------------------------------------------------------------------

	return (
		<div className='slideShowContainer'>
			<div className='slideShowMain'>
				{currentImage?.imageBlobUrl ? <img src={currentImage.imageBlobUrl} /> : <i className="h1 mb-0 bi-arrow-repeat" />}
			</div>
		</div>
	)
}

export default ImageSlideshow
