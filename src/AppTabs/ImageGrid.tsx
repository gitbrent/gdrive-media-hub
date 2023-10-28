import React, { useEffect, useMemo, useState } from 'react'
import { IGapiFile, OPT_SORTBY, OPT_SORTDIR } from '../App.props'
import { FixedItemProps } from './ImageGrid.props'
import { Gallery, Item } from 'react-photoswipe-gallery'
import 'photoswipe/dist/photoswipe.css'
import '../css/ImageGrid.css'

interface IProps {
	allFiles: IGapiFile[]
	loadPageImages: (fileIds: string[]) => Promise<boolean>
	isShowCap: boolean
	optSortBy: OPT_SORTBY
	optSortDir: OPT_SORTDIR
}

export default function ImageGrid(props: IProps) {
	const [pagingSize, setPagingSize] = useState(0)
	const [pagingPage, setPagingPage] = useState(0)
	const [optSchWord, setOptSchWord] = useState('')
	const [isSearching, setIsSearching] = useState(false)

	// --------------------------------------------------------------------------------------------

	const filtdSortdFiles = useMemo(() => {
		const showImages: FixedItemProps[] = []

		// A: define sorter
		const sorter = (a: IGapiFile, b: IGapiFile) => {
			if (props.optSortBy === OPT_SORTBY.filName_full) {
				return a.name < b.name ? (props.optSortDir === OPT_SORTDIR.asce_full ? -1 : 1) : (props.optSortDir === OPT_SORTDIR.asce_full ? 1 : -1)
			}
			else if (props.optSortBy === OPT_SORTBY.modDate_full) {
				return a.modifiedByMeTime < b.modifiedByMeTime ? (props.optSortDir === OPT_SORTDIR.asce_full ? -1 : 1) : (props.optSortDir === OPT_SORTDIR.asce_full ? 1 : -1)
			}
			else {
				console.error('unknown OPT_SORTBY value')
				return 1
			}
		}

		setIsSearching(true)

		const noBlobIds = props.allFiles.filter((file) => !file.imageBlobUrl).map((item) => item.id)
		if (noBlobIds.length > 0) props.loadPageImages(noBlobIds)

		props.allFiles
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
			.sort(sorter)
			.forEach((item) => {
				showImages.push({
					id: item.id,
					caption: item.name || '(loading)',
					original: item.imageBlobUrl || '/spinner750.png',
					thumbnail: item.imageBlobUrl || '/spinner750.png',
					width: item.imageW || 0,
					height: item.imageH || 0,
				})
			})

		setIsSearching(false)
		return showImages
	}, [props.allFiles, optSchWord])

	const gridShowFiles = useMemo(() => {
		return filtdSortdFiles.filter((_item, idx) => { return idx >= ((pagingPage - 1) * pagingSize) && idx <= ((pagingPage * pagingSize) - 1) })
	}, [filtdSortdFiles, pagingPage, pagingSize, props.optSortBy, props.optSortDir])

	// --------------------------------------------------------------------------------------------

	/**
	 * Set `pageSize` based upon current container size
	 * - also creates up a window.resize event listener!
	 */
	useEffect(() => {
		const calculatePageSize = () => {
			// Get the height of a single figure element inside #gallery-container
			const galleryContainer = document.getElementById('main-container')
			const galleryTopBar = document.getElementById('topGridBar')
			const figureElement = galleryContainer ? galleryContainer.querySelector('figure') : null
			const figureStyles = figureElement ? window.getComputedStyle(figureElement) : null
			const marginTop = figureStyles ? parseFloat(figureStyles.marginTop) : 0
			const marginBottom = figureStyles ? parseFloat(figureStyles.marginBottom) : 0
			const rowHeight = figureElement ? figureElement.offsetHeight + marginTop + marginBottom : 199 + 8  // fallback to 198 if not found

			// Calculate the available height and width for the gallery.
			const availableHeight = galleryContainer ? galleryContainer.clientHeight - (galleryTopBar ? galleryTopBar.clientHeight : 0) : window.innerHeight
			const availableWidth = galleryContainer ? galleryContainer.clientWidth : window.innerWidth

			// Calculate the number of rows and columns that can fit.
			const numRows = Math.floor(availableHeight / rowHeight)
			const numColumns = Math.floor(availableWidth / rowHeight)

			// Calculate pageSize.
			const newPagingSize = numRows * numColumns

			// Set pageSize
			setPagingSize(newPagingSize)
		}

		// Initial calculation
		calculatePageSize()

		// Add resize event listener
		window.addEventListener('resize', calculatePageSize)

		// Cleanup: remove event listener
		return () => window.removeEventListener('resize', calculatePageSize)
	}, [filtdSortdFiles])

	/**
	 * Set to page 1 on startup
	 */
	useEffect(() => {
		if (props.allFiles.length > 0) setPagingPage(1)
	}, [props.allFiles])

	/**
	 * This useEffect watches the length of `showFiles`, the number of items per page (`pagingSize`),
	 * and the current page number (`pagingPage`). If the number of items in `showFiles` changes,
	 * such that the current page number is out of range, it resets the current page to 1.
	 */
	useEffect(() => {
		const maxPage = Math.ceil(filtdSortdFiles.length / pagingSize)
		if (pagingPage > maxPage || pagingPage < 1) {
			setPagingPage(1)
		}
	}, [gridShowFiles.length, pagingSize, pagingPage])

	// --------------------------------------------------------------------------------------------

	function renderMainContBody_TopBar_Paging(): JSX.Element {
		const maxPage = Math.ceil(filtdSortdFiles.length / pagingSize)
		const startPage = Math.max(1, pagingPage - 2)
		const endPage = Math.min(maxPage, pagingPage + 2)
		const isDisabledNext = (pagingPage * pagingSize >= filtdSortdFiles.length)

		return (
			<nav aria-label="Page navigation example">
				<ul className="pagination mb-0">
					<li className={`page-item ${pagingPage === 1 ? 'disabled' : ''}`}>
						<button type="button" className="page-link" onClick={() => setPagingPage(1)}>
							<i className="bi-chevron-bar-left me-1"></i>
							<span className="d-none d-sm-inline-block">First</span>
						</button>
					</li>
					<li className={`page-item ${pagingPage === 1 ? 'disabled' : ''}`}>
						<button type="button" className="page-link" onClick={() => { setPagingPage(pagingPage > 1 ? pagingPage - 1 : 1) }}>
							<i className="bi-chevron-left me-1"></i>
							<span className="d-none d-sm-inline-block">Prev</span>
						</button>
					</li>
					{Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
						.filter(page => page >= 1 && page <= maxPage)
						.map(page => (
							<li key={page} className={`page-item ${page === pagingPage ? 'active' : ''}`}>
								<button type="button" className="page-link" onClick={() => setPagingPage(page)}>
									{page}
								</button>
							</li>
						))}
					<li className={`page-item ${isDisabledNext ? 'disabled' : ''}`}>
						<button type="button" className="page-link" onClick={() => { setPagingPage(pagingPage + 1) }}>
							<span className="d-none d-sm-inline-block">Next</span>
							<i className="bi-chevron-right ms-1"></i>
						</button>
					</li>
					<li className={`page-item ${isDisabledNext ? 'disabled' : ''}`}>
						<button type="button" className="page-link" onClick={() => { setPagingPage(maxPage) }}>
							<span className="d-none d-sm-inline-block">Last</span>
							<i className="bi-chevron-bar-right ms-1"></i>
						</button>
					</li>
				</ul>
			</nav>
		)
	}

	function renderMainContBody_TopBar(): JSX.Element {
		return (<div id="topGridBar" className="position-sticky bg-dark p-3" style={{ top: 0, zIndex: 100 }}>
			<form className="container-fluid px-0">
				<div className="row">
					<div className="col-lg-auto col-md-4 col-12 mb-2 mb-md-0">
						{renderMainContBody_TopBar_Paging()}
					</div>
					<div className="col-lg col-md-4 col-sm-12 mb-2 mb-md-0">
						<div className="input-group">
							<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
							<input type="search" placeholder="Search" aria-label="Search" aria-describedby="grp-search" className="form-control" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
						</div>
					</div>
					<div className="col-lg-auto col-md-4 col-sm-12 my-auto">
						<div className="text-muted">
							{isSearching ? <span>searching...</span>
								: gridShowFiles.length === 0
									? ('No files to show')
									: (<span>Showing <b>{gridShowFiles.length}</b> of <b>{filtdSortdFiles.length}</b> files</span>)
							}
						</div>
					</div>
				</div>
			</form>
		</div>
		)
	}

	// --------------------------------------------------------------------------------------------

	return (
		<section>
			{renderMainContBody_TopBar()}
			{
				pagingSize > 0 && gridShowFiles && gridShowFiles.length > 0 ? (
					<Gallery withCaption={props.isShowCap}>
						<div id="gallery-container" className="gallery">
							{gridShowFiles.map((item) => (
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
		</section>
	)
}
