import { useMemo, useState } from 'react'
import { IMediaFile, OPT_SORTBY, OPT_SORTDIR } from '../App.props'
import AlertNoImages from '../components/AlertNoImages'
import AlertLoading from '../components/AlertLoading'
import GridView from '../components/GridView'
import { isImage, isGif, isMedia, isVideo } from '../utils/mimeTypes'
import 'photoswipe/dist/photoswipe.css'
import '../css/ImageGrid.css'

interface IProps {
	allFiles: IMediaFile[]
	loadPageImages: (fileIds: string[]) => Promise<boolean>
	isShowCap: boolean
}

type MediaType = 'all' | 'image' | 'gif' | 'video'

export default function ImageGrid(props: IProps) {
	const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaType>('all')
	const [optSortBy, setIptSortBy] = useState<OPT_SORTBY>(OPT_SORTBY.modDate)
	const [optSortDir, setOptSortDir] = useState<OPT_SORTDIR>(OPT_SORTDIR.desc)
	const [optSchWord, setOptSchWord] = useState('')
	const [isSearching, setIsSearching] = useState(false)

	// --------------------------------------------------------------------------------------------

	const filtdSortdFiles = useMemo(() => {
		const showImages: IMediaFile[] = []

		// A: define sorter
		const sorter = (a: IMediaFile, b: IMediaFile) => {
			if (optSortBy === OPT_SORTBY.filName) {
				return a.name < b.name ? (optSortDir === OPT_SORTDIR.asce ? -1 : 1) : (optSortDir === OPT_SORTDIR.asce ? 1 : -1)
			}
			else if (optSortBy === OPT_SORTBY.modDate) {
				return a.modifiedByMeTime < b.modifiedByMeTime ? (optSortDir === OPT_SORTDIR.asce ? -1 : 1) : (optSortDir === OPT_SORTDIR.asce ? 1 : -1)
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
		props.allFiles
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
	}, [props.allFiles, optSortBy, optSortDir, optSchWord, mediaTypeFilter])

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
									<i className="bi-files me-2 d-none d-lg-inline" />All
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'image' ? 'active' : ''}`}
									title="show images"
									aria-label="show images"
									onClick={() => setMediaTypeFilter('image')}>
									<i className="bi-image me-2 d-none d-lg-inline" />Image
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'gif' ? 'active' : ''}`}
									title="show gifs"
									aria-label="show gifs"
									onClick={() => setMediaTypeFilter('gif')}>
									<i className="bi-play-circle me-2 d-none d-lg-inline" />GIF
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'video' ? 'active' : ''}`}
									title="show videos"
									aria-label="show videos"
									onClick={() => setMediaTypeFilter('video')}>
									<i className="bi-play-btn-fill me-2 d-none d-lg-inline" />Video
								</button>
							</div>
						</div>
						<div className="col-12 col-md-auto mt-2 mt-md-0">
							<div className="btn-group" role="group" aria-label="sort options">
								<button type="button" aria-label="sort by name"
									className={`btn btn-outline-secondary text-nowrap ${optSortBy === OPT_SORTBY.filName ? 'active' : ''}`}
									onClick={() => toggleSortOrder(OPT_SORTBY.filName)}>
									Name {optSortBy === OPT_SORTBY.filName && (optSortDir === OPT_SORTDIR.asce ? '↑' : '↓')}
								</button>
								<button type="button" aria-label="sort by size"
									className={`btn btn-outline-secondary text-nowrap ${optSortBy === OPT_SORTBY.filSize ? 'active' : ''}`}
									onClick={() => toggleSortOrder(OPT_SORTBY.filSize)}>
									Size {optSortBy === OPT_SORTBY.filSize && (optSortDir === OPT_SORTDIR.asce ? '↑' : '↓')}
								</button>
								<button type="button" aria-label="sort by modified"
									className={`btn btn-outline-secondary text-nowrap ${optSortBy === OPT_SORTBY.modDate ? 'active' : ''}`}
									onClick={() => toggleSortOrder(OPT_SORTBY.modDate)}>
									Modified {optSortBy === OPT_SORTBY.modDate && (optSortDir === OPT_SORTDIR.asce ? '↑' : '↓')}
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
											<b>{filtdSortdFiles.length}</b>&nbsp;of&nbsp;<b>{props.allFiles.length}</b>
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
