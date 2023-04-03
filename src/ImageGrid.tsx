import React, { useState, useMemo } from 'react'
import { IGapiFile, IGridSize } from './App.props'
import { FixedItemProps } from './ImageGrid.props'
import { Gallery, Item } from 'react-photoswipe-gallery'
import 'photoswipe/dist/photoswipe.css'
import './css/ImageGrid.css'

interface IProps {
	gapiFiles: IGapiFile[]
	isShowCap: boolean
	selGridSize: IGridSize
}

export default function ImageGrid(props: IProps) {
	const galleryItems: FixedItemProps[] = useMemo(() => {
		const showImages: FixedItemProps[] = []

		props.gapiFiles.forEach((item) => {
			showImages.push({
				id: item.id,
				caption: item.name || '(loading)',
				original: item.imageBlobUrl || '/spinner750.png',
				thumbnail: item.imageBlobUrl || '/spinner750.png',
				width: item.imageW || 0,
				height: item.imageH || 0,
			})
		})

		return showImages
	}, [props.gapiFiles])

	const [photoIndex, setPhotoIndex] = useState(-1)
	const [isOpen, setIsOpen] = useState(false)

	//const currentImage = useMemo(() => { return images[photoIndex] }, [photoIndex]) // stil comes up empty on first click
	const currentImage = galleryItems[photoIndex]
	const nextIndex = (photoIndex + 1) % galleryItems.length
	const nextImage = galleryItems[nextIndex] || currentImage
	const prevIndex = (photoIndex + galleryItems.length - 1) % galleryItems.length
	const prevImage = galleryItems[prevIndex] || currentImage

	const handleClick = (index: number) => {
		setPhotoIndex(index)
		setIsOpen(true)
	}
	const handleClose = () => setIsOpen(false)
	const handleMovePrev = () => setPhotoIndex(prevIndex)
	const handleMoveNext = () => setPhotoIndex(nextIndex)

	return galleryItems && galleryItems.length > 0 ? (
		<Gallery id="galleryItems" withCaption={props.isShowCap}>
			<div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill, minMax(${props.selGridSize.css}, 1fr)` }}>
				{galleryItems.map((item) => (<Item {...item} key={item.id}>
					{({ ref, open }) => (
						<figure className={item.width > item.height ? 'landscape' : ''}>
							<img ref={ref as React.MutableRefObject<HTMLImageElement>} onClick={open} src={item.thumbnail} alt={item.alt} />
							{props.isShowCap && <figcaption>{item.caption}</figcaption>}
						</figure>
					)}
				</Item>
				))}
			</div>
		</Gallery>
	) :
		(
			<div className='alter alert-info'>(no images to display)</div>
		)
}
