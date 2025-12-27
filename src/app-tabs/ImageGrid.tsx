/* eslint-disable react-hooks/set-state-in-render */
import { useContext, useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router'
import { IMediaFile, OPT_SORTBY, OPT_SORTDIR } from '../App.props'
import { isImage, isGif, isMedia, isVideo } from '../utils/mimeTypes'
import { DataContext } from '../api-google/DataContext'
import AlertNoImages from '../components/AlertNoImages'
import AlertLoading from '../components/AlertLoading'
import GridView from '../components/GridView'
import 'photoswipe/dist/photoswipe.css'
import '../css/ImageGrid.css'

type MediaType = 'all' | 'image' | 'gif' | 'video'
type TileSize = 'small' | 'medium' | 'large'

export default function ImageGrid() {
	const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaType>('all')
	const [optSortBy, setIptSortBy] = useState<OPT_SORTBY>(OPT_SORTBY.modDate)
	const [optSortDir, setOptSortDir] = useState<OPT_SORTDIR>(OPT_SORTDIR.desc)
	const [optSchWord, setOptSchWord] = useState('')
	const [tileSize, setTileSize] = useState<TileSize>('medium')
	const [isSearching, setIsSearching] = useState(false)
	const [showCaptions, setShowCaptions] = useState(false)
	const [showSearch, setShowSearch] = useState(false)
	const { mediaFiles } = useContext(DataContext)
	const location = useLocation()

	useEffect(() => {
		if (location.state?.searchTerm) {
			setOptSchWord(location.state.searchTerm)
		}
	}, [location.state])

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
		const isSearchActive = optSchWord.length > 0

		return (
			<div className="mb-4">
				<div className="flex flex-wrap gap-4 items-justify-center">
					{/* TILE SIZE SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1 block">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Size</span>
						</label>
						<div className="join">
							<button
								type="button"
								className={`btn btn-sm flex-1 ${tileSize === 'small' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setTileSize('small')}
								title="Small tiles">
								<i className="bi-grid-3x3-gap text-lg" />
								<span className="hidden lg:inline">Small</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${tileSize === 'medium' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setTileSize('medium')}
								title="Medium tiles">
								<i className="bi-grid text-lg" />
								<span className="hidden lg:inline">Medium</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${tileSize === 'large' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setTileSize('large')}
								title="Large tiles">
								<i className="bi-grid-1x2 text-lg" />
								<span className="hidden lg:inline">Large</span>
							</button>
						</div>
					</div>

					{/* FILTER SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1 block">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Type</span>
						</label>
						<div className="join">
							<button
								type="button"
								className={`btn btn-sm flex-1 ${mediaTypeFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setMediaTypeFilter('all')}
								title="Show all">
								<i className="bi-files text-lg" />
								<span className="hidden lg:inline">All</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${mediaTypeFilter === 'image' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setMediaTypeFilter('image')}
								title="Show images">
								<i className="bi-image text-lg" />
								<span className="hidden lg:inline">Image</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${mediaTypeFilter === 'gif' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setMediaTypeFilter('gif')}
								title="Show gifs">
								<i className="bi-play-btn text-lg" />
								<span className="hidden lg:inline">GIF</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${mediaTypeFilter === 'video' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setMediaTypeFilter('video')}
								title="Show videos">
								<i className="bi-camera-video text-lg" />
								<span className="hidden lg:inline">Video</span>
							</button>
						</div>
					</div>

					{/* SORT SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1 block">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Sort</span>
						</label>
						<div className="join">
							<button
								type="button"
								className={`btn btn-sm flex-1 ${optSortBy === OPT_SORTBY.filName ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => toggleSortOrder(OPT_SORTBY.filName)}
								title="Sort by name">
								<i className="bi-sort-alpha-down text-lg" />
								<span className="hidden lg:inline">Name</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${optSortBy === OPT_SORTBY.filSize ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => toggleSortOrder(OPT_SORTBY.filSize)}
								title="Sort by size">
								<i className="bi-hdd-stack text-lg" />
								<span className="hidden lg:inline">Size</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${optSortBy === OPT_SORTBY.modDate ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => toggleSortOrder(OPT_SORTBY.modDate)}
								title="Sort by modified">
								<i className="bi-clock text-lg" />
								<span className="hidden lg:inline">Modified</span>
							</button>
							<button
								type="button"
								className="btn btn-sm btn-outline btn-active bg-base-900"
								onClick={() => setOptSortDir(optSortDir === OPT_SORTDIR.asce ? OPT_SORTDIR.desc : OPT_SORTDIR.asce)}
								title={optSortDir === OPT_SORTDIR.asce ? 'Ascending (A → Z)' : 'Descending (Z → A)'}>
								<i className={`text-xl bi ${optSortDir === OPT_SORTDIR.asce ? 'bi-arrow-up' : 'bi-arrow-down'}`} />
							</button>
						</div>
					</div>

					{/* CAPTIONS SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1 block">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Captions</span>
						</label>
						<button
							type="button"
							className={`btn btn-sm w-full ${showCaptions ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setShowCaptions(!showCaptions)}
							title="Toggle captions">
							<i className="bi-chat-left-text text-lg" />
							<span className="hidden lg:inline">{showCaptions ? 'On' : 'Off'}</span>
						</button>
					</div>

					{/* SEARCH & RESULTS SECTION */}
					<div className="w-full sm:flex-1 flex items-stretch gap-2 bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<div className="flex-1 flex flex-col justify-center">
							{showSearch && (
								<label className="label pb-1 block">
									<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Search</span>
								</label>
							)}
							{showSearch && (
								<div className={`input input-sm input-bordered flex items-center gap-2 transition-all ${isSearchActive ? 'input-primary ring-2 ring-primary/30' : ''}`}>
									<i className="bi-search opacity-50"></i>
									<input
										type="search"
										className="grow bg-transparent outline-none"
										placeholder="Search files..."
										value={optSchWord}
										onChange={(ev) => setOptSchWord(ev.currentTarget.value)}
										autoFocus
									/>
								</div>
							)}
						</div>

						{/* Search Toggle Button */}
						<button
							type="button"
							className={`btn btn-sm ${showSearch ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setShowSearch(!showSearch)}
							title="Toggle search">
							<i className="bi-search text-lg" />
						</button>

						{/* Results Info */}
						<div className="flex items-center px-3 py-2 bg-base-200 rounded-lg text-sm font-semibold whitespace-nowrap">
							{filtdSortdFiles.length === 0 ? (
								<span className="text-base-content/60">No results</span>
							) : isSearchActive ? (
								<>
									<span className="text-primary font-bold">{filtdSortdFiles.length}</span>
									<span className="text-base-content/60 ml-1">of {mediaFiles.length}</span>
								</>
							) : (
								<>
									<span className="text-primary font-bold">{filtdSortdFiles.length}</span>
									<span className="text-base-content/60 ml-1">files</span>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
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
					showCaptions={showCaptions}
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
