import React, { useMemo } from 'react'
import { IGapiFile, IGridSize } from './App.props'
import { FixedItemProps } from './ImageGrid.props'
import { Gallery, Item } from 'react-photoswipe-gallery'
import 'photoswipe/dist/photoswipe.css'
import './css/ImageGrid.css'

interface IProps {
	gridImages: IGapiFile[]
	isShowCap: boolean
	selGridSize: IGridSize
}

export default function ImageGrid(props: IProps) {
	/**
	 * @description Memoized array of gallery items to be displayed in the grid.
	 *
	 * @returns {FixedItemProps[]} Returns an array of gallery items with properties appropriately set for display.
	 */
	const galleryItems: FixedItemProps[] = useMemo(() => {
		const showImages: FixedItemProps[] = []

		props.gridImages.forEach((item) => {
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
	}, [props.gridImages])

	return galleryItems && galleryItems.length > 0 ? (
		<Gallery withCaption={props.isShowCap}>
			<div id="gallery-container" className="gallery">
				{galleryItems.map((item) => (
					<Item {...item} key={item.id}>
						{({ ref, open }) => (
							item?.thumbnail?.indexOf('spinner') === -1 ?
								(<figure>
									<img ref={ref as React.MutableRefObject<HTMLImageElement>} onClick={open} src={item.thumbnail} title={item.caption} alt={item.alt} />
									{props.isShowCap && <figcaption>{item.caption}</figcaption>}
								</figure>)
								:
								(<figure className="text-muted" title={item.caption} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
									<i className="h1 mb-0 bi-arrow-repeat" />
								</figure>)
						)}
					</Item>
				))}
			</div>
		</Gallery>
	) : (
		<section className="text-center my-5">
			<div className="alert alert-warning d-inline-flex align-items-center" role="alert">
				<div className="row align-items-center no-gutters gx-2">
					<div className="col-auto">
						<i className="bi-exclamation-triangle-fill display-3"></i>
					</div>
					<div className="col">
						<div>
							<h3 className="mb-0">say less bro</h3>
						</div>
						<div>
							<p className="mb-0">(no imgaes to display)</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
