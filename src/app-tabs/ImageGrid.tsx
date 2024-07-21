import React, { useMemo, useState } from 'react'
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
	optSortBy: OPT_SORTBY
	optSortDir: OPT_SORTDIR
}

type MediaType = 'all' | 'image' | 'gif' | 'video'

export default function ImageGrid(props: IProps) {
	const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaType>('all')
	const [optSchWord, setOptSchWord] = useState('')
	const [isSearching, setIsSearching] = useState(false)

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
	}, [props.allFiles, props.optSortBy, props.optSortDir, optSchWord, mediaTypeFilter])

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
									<i className="bi-files me-2" />All
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'image' ? 'active' : ''}`}
									title="show images"
									aria-label="show images"
									onClick={() => setMediaTypeFilter('image')}>
									<i className="bi-image me-2" />Image
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'gif' ? 'active' : ''}`}
									title="show gifs"
									aria-label="show gifs"
									onClick={() => setMediaTypeFilter('gif')}>
									<i className="bi-play-circle me-2" />GIF
								</button>
								<button
									type="button"
									className={`btn btn-outline-secondary ${mediaTypeFilter === 'video' ? 'active' : ''}`}
									title="show videos"
									aria-label="show videos"
									onClick={() => setMediaTypeFilter('video')}>
									<i className="bi-play-btn-fill me-2" />Video
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

	// --------------------------------------------------------------------------------------------

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
