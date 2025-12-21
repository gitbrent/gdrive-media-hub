/* eslint-disable react-hooks/set-state-in-render */
import { useContext, useMemo, useState } from 'react'
import { IMediaFile, OPT_SORTBY, OPT_SORTDIR } from '../App.props'
import { isImage, isGif, isMedia, isVideo } from '../utils/mimeTypes'
import { DataContext } from '../api-google/DataContext'
import AlertNoImages from '../components/AlertNoImages'
import AlertLoading from '../components/AlertLoading'
import GridView from '../components/GridView'
import 'photoswipe/dist/photoswipe.css'
import '../css/ImageGrid.css'

type MediaType = 'all' | 'image' | 'gif' | 'video'

export default function ImageGrid() {
	const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaType>('all')
	const [optSortBy, setIptSortBy] = useState<OPT_SORTBY>(OPT_SORTBY.modDate)
	const [optSortDir, setOptSortDir] = useState<OPT_SORTDIR>(OPT_SORTDIR.desc)
	const [optSchWord, setOptSchWord] = useState('')
	const [tileSize, setTileSize] = useState<'small' | 'medium' | 'large'>('medium')
	const [isSearching, setIsSearching] = useState(false)
	const { mediaFiles } = useContext(DataContext)

	// --------------------------------------------------------------------------------------------

	const filtdSortdFiles = useMemo(() => {
		const showImages: IMediaFile[] = []

		// A: define sorter
		const sorter = (a: IMediaFile, b: IMediaFile) => {
			if (optSortBy === OPT_SORTBY.filName) {
				return a.name < b.name ? (optSortDir === OPT_SORTDIR.asce ? -1 : 1) : (optSortDir === OPT_SORTDIR.asce ? 1 : -1)
			}
			else if (optSortBy === OPT_SORTBY.modDate) {
				return a.modifiedByMeTime! < b.modifiedByMeTime! ? (optSortDir === OPT_SORTDIR.asce ? -1 : 1) : (optSortDir === OPT_SORTDIR.asce ? 1 : -1)
			}
			else if (optSortBy === OPT_SORTBY.filSize) {
				const sizeA = Number(a.size || 0)
				const sizeB = Number(b.size || 0)
				return optSortDir === OPT_SORTDIR.asce ? sizeA - sizeB : sizeB - sizeA
			}
			else {
				console.error('unknown OPT_SORTBY value')
				return 1
			}
		}

		setIsSearching(true)

		// B: filter, sort, populate image array
		mediaFiles
			.filter((item) => mediaTypeFilter === 'all' ? isMedia(item)
				: mediaTypeFilter === 'image' ? isImage(item)
					: mediaTypeFilter === 'gif' ? isGif(item)
						: mediaTypeFilter === 'video' ? isVideo(item)
							: false)
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
			.sort(sorter)
			.forEach((item) => {
				showImages.push(item)
			})

		setIsSearching(false)
		return showImages
	}, [mediaFiles, optSortBy, optSortDir, optSchWord, mediaTypeFilter])

	const toggleSortOrder = (field: OPT_SORTBY) => {
		setIptSortBy(field)
		setOptSortDir((prevOrder) => (prevOrder === OPT_SORTDIR.asce ? OPT_SORTDIR.desc : OPT_SORTDIR.asce))
	}

	// --------------------------------------------------------------------------------------------

	function renderMainContBody_TopBar(): JSX.Element {
		return (
			<nav className="navbar mb-3">
				<form className="container-fluid px-0">
					<div className="row w-100 align-items-center justify-content-between">
						<div className="col-12 col-md-auto">
							<div className="btn-group" role="group" aria-label="item type switcher">
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'all' ? 'active' : ''}`}
									title="show all"
									aria-label="show all"
									onClick={() => setMediaTypeFilter('all')}>
									<i className="bi-files" /><span className="ms-2 d-none d-lg-inline">All</span>
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'image' ? 'active' : ''}`}
									title="show images"
									aria-label="show images"
									onClick={() => setMediaTypeFilter('image')}>
									<i className="bi-image" /><span className="ms-2 d-none d-lg-inline">Image</span>
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'gif' ? 'active' : ''}`}
									title="show gifs"
									aria-label="show gifs"
									onClick={() => setMediaTypeFilter('gif')}>
									<i className="bi-play-btn" /><span className="ms-2 d-none d-lg-inline">GIF</span>
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'video' ? 'active' : ''}`}
									title="show videos"
									aria-label="show videos"
									onClick={() => setMediaTypeFilter('video')}>
									<i className="bi-camera-video" /><span className="ms-2 d-none d-lg-inline">Video</span>
								</button>
							</div>
						</div>
						<div className="col-12 col-md-auto mt-2 mt-md-0">
							<div className="btn-group" role="group" aria-label="sort options">
								<button type="button" aria-label="sort by name"
									className={`btn btn-outline-secondary text-nowrap ${optSortBy === OPT_SORTBY.filName ? 'active' : ''}`}
									onClick={() => toggleSortOrder(OPT_SORTBY.filName)}>
									<i className="bi-alphabet-uppercase" /><span className="ms-2 d-none d-lg-inline">Name</span> {optSortBy === OPT_SORTBY.filName && (optSortDir === OPT_SORTDIR.asce ? '↑' : '↓')}
								</button>
								<button type="button" aria-label="sort by size"
									className={`btn btn-outline-secondary text-nowrap ${optSortBy === OPT_SORTBY.filSize ? 'active' : ''}`}
									onClick={() => toggleSortOrder(OPT_SORTBY.filSize)}>
									<i className="bi-hdd" /><span className="ms-2 d-none d-lg-inline">Size</span> {optSortBy === OPT_SORTBY.filSize && (optSortDir === OPT_SORTDIR.asce ? '↑' : '↓')}
								</button>
								<button type="button" aria-label="sort by modified"
									className={`btn btn-outline-secondary text-nowrap ${optSortBy === OPT_SORTBY.modDate ? 'active' : ''}`}
									onClick={() => toggleSortOrder(OPT_SORTBY.modDate)}>
									<i className="bi-clock" /><span className="ms-2 d-none d-lg-inline">Modified</span> {optSortBy === OPT_SORTBY.modDate && (optSortDir === OPT_SORTDIR.asce ? '↑' : '↓')}
								</button>
							</div>
						</div>
						<div className="col-12 col-md-auto mt-2 mt-md-0">
							<div className="btn-group" role="group" aria-label="tile size options">
								<button type="button" aria-label="small tiles"
									className={`btn btn-outline-secondary text-nowrap ${tileSize === 'small' ? 'active' : ''}`}
									title="Small tiles"
									onClick={() => setTileSize('small')}>
									<i className="bi-grid-3x3-gap" />
								</button>
								<button type="button" aria-label="medium tiles"
									className={`btn btn-outline-secondary text-nowrap ${tileSize === 'medium' ? 'active' : ''}`}
									title="Medium tiles"
									onClick={() => setTileSize('medium')}>
									<i className="bi-grid" />
								</button>
								<button type="button" aria-label="large tiles"
									className={`btn btn-outline-secondary text-nowrap ${tileSize === 'large' ? 'active' : ''}`}
									title="Large tiles"
									onClick={() => setTileSize('large')}>
									<i className="bi-grid-1x2" />
								</button>
							</div>
						</div>
						<div className="col col-md mt-2 mt-md-0">
							<div className="input-group">
								<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
								<input type="search" placeholder="Search" aria-label="Search" aria-describedby="grp-search" className="form-control" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
							</div>
						</div>
						<div className="col-auto col-md-auto mt-2 mt-md-0 pe-0">
							<div className="text-muted">
								{isSearching ? <span>searching...</span>
									: filtdSortdFiles.length === 0
										? ('No files to show')
										: (<span>
											<b>{filtdSortdFiles.length}</b>&nbsp;of&nbsp;<b>{mediaFiles.length}</b>
											<span className="d-none d-lg-inline-block">&nbsp;files</span>
										</span>)
								}
							</div>
						</div>
					</div>
				</form>
			</nav>
		)
	}

	return (
		<section>
			{renderMainContBody_TopBar()}
			{filtdSortdFiles && filtdSortdFiles.length > 0
				? <GridView
					currFolderContents={filtdSortdFiles}
					isFolderLoading={isSearching}
					handleFolderClick={() => Promise.resolve()}
					tileSize={tileSize}
				/>
				: filtdSortdFiles.length > 0 ? (
					<AlertLoading />
				) : (
					<AlertNoImages />
				)
			}
		</section>
	)
}
