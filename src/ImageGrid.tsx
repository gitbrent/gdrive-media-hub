import React, { useMemo } from 'react'
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

	return galleryItems && galleryItems.length > 0 ? (
		<Gallery withCaption={props.isShowCap}>
			<div id="gallery-container" className="gallery">
				{galleryItems.map((item) => (
					<Item {...item} key={item.id}>
						{({ ref, open }) => (
							item?.thumbnail?.indexOf('spinner') === -1 ?
								(<figure>
									<img ref={ref as React.MutableRefObject<HTMLImageElement>} onClick={open} src={item.thumbnail} alt={item.alt} />
									{props.isShowCap && <figcaption>{item.caption}</figcaption>}
								</figure>)
								:
								(<figure className='text-muted' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
									<i className="h1 mb-0 bi-arrow-repeat" />
								</figure>)
						)}
					</Item>
				))}
			</div>
		</Gallery>
	) : (
		<section className='text-center my-5'>
			<div className="alert alert-warning d-inline-flex align-items-center" role="alert">
				<span className="h1 fw-light mb-0 me-3">⚠️</span>no images to display
			</div>
		</section>
	)
}
