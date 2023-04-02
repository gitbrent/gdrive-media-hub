import React, { useState, useMemo } from 'react'
import { IGapiFile } from './App.props'
import { CustomImage } from './ImageGrid.props'
import { Gallery } from 'react-grid-gallery'
import Lightbox from 'react-18-image-lightbox'
import 'react-image-lightbox/style.css'

interface IProps {
	showFiles: IGapiFile[]
}

export default function ImageGrid(props:IProps) {
	const images: CustomImage[] = useMemo(() => {
		const showImages: CustomImage[] = []

		props.showFiles.forEach((file) => {
			showImages.push({
				src: file.imageBlobUrl || '/spinner750.png',
				original: file.imageBlobUrl || '/spinner750.png',
				/*tags: [
					{ value: 'Nature', title: 'Nature' },
				],*/
				width: file.imageW || 750,
				height: file.imageH || 750,
				caption: file.title || 'loading',
			})
		})
		//console.log('DEBUG:showImages', showImages)

		return showImages
	}, [props.showFiles])

	const [photoIndex, setPhotoIndex] = useState(-1)
	const [isOpen, setIsOpen] = useState(false)

	//const currentImage = useMemo(() => { return images[photoIndex] }, [photoIndex]) // stil comes up empty on first click
	const currentImage = images[photoIndex]
	const nextIndex = (photoIndex + 1) % images.length
	const nextImage = images[nextIndex] || currentImage
	const prevIndex = (photoIndex + images.length - 1) % images.length
	const prevImage = images[prevIndex] || currentImage

	const handleClick = (index: number) => {
		setPhotoIndex(index)
		setIsOpen(true)
	}
	const handleClose = () => setIsOpen(false)
	const handleMovePrev = () => setPhotoIndex(prevIndex)
	const handleMoveNext = () => setPhotoIndex(nextIndex)

	return (
		<div>
			<Gallery
				images={images}
				onClick={handleClick}
				enableImageSelection={false}
			/>
			{!images || images.length === 0 &&
				<section className='bg-secondary my-5'>
					<div className='row row-cols-auto justify-content-center align-items-center'>
						<div className='col'><span style={{ fontSize:'3rem' }}>&#9888;</span></div>
						<div className='col'>(no images to display)</div>
					</div>
				</section>
			}
			{isOpen && currentImage && (
				<Lightbox
					mainSrc={currentImage.original}
					imageTitle={currentImage.caption}
					mainSrcThumbnail={currentImage.src}
					nextSrc={nextImage.original}
					nextSrcThumbnail={nextImage.src}
					prevSrc={prevImage.original}
					prevSrcThumbnail={prevImage.src}
					onCloseRequest={handleClose}
					onMovePrevRequest={handleMovePrev}
					onMoveNextRequest={handleMoveNext}
					clickOutsideToClose={true}
					reactModalStyle={{ overlay: { zIndex: 10000 } }} // cover bootstrap navbar
				/>
			)}
		</div>
	)
}
