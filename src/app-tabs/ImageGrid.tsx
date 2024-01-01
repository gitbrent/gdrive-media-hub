import React, { useEffect, useMemo, useState } from 'react'
import { IMediaFile, OPT_SORTBY, OPT_SORTDIR } from '../App.props'
import AlertNoImages from '../components/AlertNoImages'
import AlertLoading from '../components/AlertLoading'
import GridView from '../components/GridView'
import { isMedia } from '../utils/mimeTypes'
import 'photoswipe/dist/photoswipe.css'
import '../css/ImageGrid.css'

interface IProps {
	allFiles: IMediaFile[]
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
	const [lastLoadDate, setLastLoadDate] = useState('')

	// --------------------------------------------------------------------------------------------

	const filtdSortdFiles = useMemo(() => {
		const showImages: IMediaFile[] = []

		// A: define sorter
		const sorter = (a: IMediaFile, b: IMediaFile) => {
			if (props.optSortBy === OPT_SORTBY.filName) {
				return a.name < b.name ? (props.optSortDir === OPT_SORTDIR.asce ? -1 : 1) : (props.optSortDir === OPT_SORTDIR.asce ? 1 : -1)
			}
			else if (props.optSortBy === OPT_SORTBY.modDate) {
				return a.modifiedByMeTime < b.modifiedByMeTime ? (props.optSortDir === OPT_SORTDIR.asce ? -1 : 1) : (props.optSortDir === OPT_SORTDIR.asce ? 1 : -1)
			}
			else {
				console.error('unknown OPT_SORTBY value')
				return 1
			}
		}

		setIsSearching(true)

		// B: filter, sort, populate image array
		props.allFiles
			.filter((item) => isMedia(item))
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
			.sort(sorter)
			.forEach((item) => {
				showImages.push(item)
			})

		setIsSearching(false)
		return showImages
	}, [props.allFiles, optSchWord, lastLoadDate])

	const gridShowFiles = useMemo(() => {
		return filtdSortdFiles.filter((_item, idx) => { return idx >= ((pagingPage - 1) * pagingSize) && idx <= ((pagingPage * pagingSize) - 1) })
	}, [filtdSortdFiles, pagingPage, pagingSize, props.optSortBy, props.optSortDir])

	// --------------------------------------------------------------------------------------------

	// Fix issue with initial images all showing loading images
	useEffect(() => {
		const noBlobIds = gridShowFiles.filter((file) => !file.original).map((file) => file.id as string)
		if (noBlobIds.length > 0) props.loadPageImages(noBlobIds).then(() => setLastLoadDate((new Date).toISOString()))
	}, [gridShowFiles])

	/**
	 * Set `pageSize` based upon current container size
	 * - also creates up a window.resize event listener!
	 */
	useEffect(() => {
		const calculatePageSize = () => {
			// Get the height of a single figure element inside #gallery-container
			const galleryContainer = document.getElementById('contImageGrid')
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
		const isDisabledNext = (pagingPage * pagingSize >= filtdSortdFiles.length)
		// Determine start and end pages to show a max of 3 numbers
		let startPage = pagingPage - 1
		let endPage = pagingPage + 1
		if (startPage < 1) {
			startPage = 1
			endPage = Math.min(3, maxPage)
		} else if (endPage > maxPage) {
			endPage = maxPage
			startPage = Math.max(1, maxPage - 2)
		}

		return (
			<nav className='text-center' aria-label="page navigation">
				<ul className="pagination mb-0">
					<li className={`page-item ${pagingPage === 1 ? 'disabled' : ''}`}>
						<button type="button" className="page-link text-nowrap" onClick={() => setPagingPage(1)}>
							<i className="bi-chevron-bar-left me-1"></i>
							<span className="d-none d-lg-inline-block">First</span>
						</button>
					</li>
					<li className={`page-item ${pagingPage === 1 ? 'disabled' : ''}`}>
						<button type="button" className="page-link text-nowrap" onClick={() => { setPagingPage(pagingPage > 1 ? pagingPage - 1 : 1) }}>
							<i className="bi-chevron-left me-1"></i>
							<span className="d-none d-lg-inline-block">Prev</span>
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
						<button type="button" className="page-link text-nowrap" onClick={() => { setPagingPage(pagingPage + 1) }}>
							<span className="d-none d-lg-inline-block">Next</span>
							<i className="bi-chevron-right ms-1"></i>
						</button>
					</li>
					<li className={`page-item ${isDisabledNext ? 'disabled' : ''}`}>
						<button type="button" className="page-link text-nowrap" onClick={() => { setPagingPage(maxPage) }}>
							<span className="d-none d-lg-inline-block">Last</span>
							<i className="bi-chevron-bar-right ms-1"></i>
						</button>
					</li>
				</ul>
			</nav>
		)
	}

	function renderMainContBody_TopBar(): JSX.Element {
		return (
			<nav className="navbar sticky-top bg-dark" id="topGridBar">
				<form className="container-fluid">
					<div className="row w-100 align-items-center justify-content-between">
						<div className='col-auto d-none d-lg-block'>
							<a className="navbar-brand me-0 text-white">Image Grid</a>
						</div>
						<div className="col-12 col-md-auto mb-2 mb-md-0">
							{renderMainContBody_TopBar_Paging()}
						</div>
						<div className="col col-md mt-2 mt-md-0">
							<div className="input-group">
								<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
								<input type="search" placeholder="Search" aria-label="Search" aria-describedby="grp-search" className="form-control" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
							</div>
						</div>
						<div className="col-auto col-md-auto mt-2 mt-md-0">
							<div className="text-muted">
								{isSearching ? <span>searching...</span>
									: gridShowFiles.length === 0
										? ('No files to show')
										: (<span>
											<span className="d-none d-lg-inline-block">Showing&nbsp;</span><b>{gridShowFiles.length}</b>&nbsp;of&nbsp;
											<b>{filtdSortdFiles.length}</b><span className="d-none d-lg-inline-block">&nbsp;files</span>
										</span>)
								}
							</div>
						</div>
					</div>
				</form>
			</nav>
		)
	}

	// --------------------------------------------------------------------------------------------

	return (
		<section className="bg-black h-100">
			{renderMainContBody_TopBar()}
			{pagingSize > 0 && gridShowFiles && gridShowFiles.length > 0
				? <GridView
					currFolderContents={gridShowFiles as IMediaFile[]}
					isFolderLoading={isSearching}
					handleFolderClick={() => Promise.resolve()}
				/>
				: props.allFiles?.length > 0 ? (
					<AlertLoading />
				) : (
					<AlertNoImages />
				)
			}
		</section>
	)
}
