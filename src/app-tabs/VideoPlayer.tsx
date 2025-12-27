import { useContext, useEffect, useState } from 'react'
import { DataContext } from '../api-google/DataContext'
import { IMediaFile } from '../App.props'
import { isVideo } from '../utils/mimeTypes'
import AlertNoImages from '../components/AlertNoImages'
import AlertLoading from '../components/AlertLoading'
import CaptionFull from '../components/CaptionFull'

const VideoPlayer: React.FC = () => {
	const { mediaFiles, getBlobUrlForFile } = useContext(DataContext)
	//
	const [allVideos, setAllVideos] = useState<IMediaFile[]>([])
	const [shfImages, setShfImages] = useState<IMediaFile[]>([])
	const [currIndex, setCurrIndex] = useState(0)
	const [usedIndexes, setUsedIndexes] = useState<number[]>([])
	const [currentImageUrl, setCurrentImageUrl] = useState('')
	const [optSchWord, setOptSchWord] = useState('')
	const [isFullSize, setIsFullSize] = useState(true)
	const [showCaptions, setShowCaptions] = useState(false)

	/**
	 * filter videos from all files and shuffle at startup
	 */
	useEffect(() => {
		setAllVideos([...mediaFiles]
			.filter((item) => isVideo(item))
			.sort(() => Math.random() - 0.5))
	}, [mediaFiles])

	/**
	 * update shuffled videos when search term changes
	 */
	useEffect(() => {
		setShfImages(allVideos
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
		)
	}, [allVideos, optSchWord])

	useEffect(() => {
		const loadImage = async () => {
			const currentImage = shfImages[currIndex];
			if (currentImage?.id) {
				const imageBlob = await getBlobUrlForFile(currentImage.id) || '';
				setCurrentImageUrl(imageBlob);
			}
		};
		loadImage();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currIndex, shfImages])

	useEffect(() => {
		setCurrIndex(0)
	}, [optSchWord])

	// --------------------------------------------------------------------------------------------

	const goToNextSlide = () => {
		if (shfImages.length === 0) return
		const nextIndex = (currIndex + 1) % shfImages.length
		setUsedIndexes(usedIndexes => [...usedIndexes, currIndex]) // Add current index before changing
		setCurrentImageUrl('')
		setCurrIndex(nextIndex)
	}

	const goToPrevSlide = () => {
		if (usedIndexes.length <= 1) return  // Can't go back if there's only one or no image
		const newUsedIndexes = usedIndexes.slice(0, -1) // Remove the last index to go back
		const prevIndex = newUsedIndexes[newUsedIndexes.length - 1] // Get the new last index
		setUsedIndexes(newUsedIndexes)
		setCurrentImageUrl('')
		setCurrIndex(prevIndex)
	}

	// --------------------------------------------------------------------------------------------

	function renderTopCmdBar(): JSX.Element {
		return (
			<div className="mb-6">
				<div className="flex flex-wrap gap-4 items-center justify-center">
					{/* NOW PLAYING/METADATA SECTION */}
					{shfImages.length > 0 && (
						<div className="w-full sm:flex-1 bg-base-100 rounded-xl px-3 pt-1 pb-2">
							<div className="grid grid-cols-[1fr_auto] gap-3 items-start p-1">
								{/* Left: Icon and Title */}
								<div className="flex items-start gap-2 min-w-0">
									<i className="bi-info-circle-fill text-xl text-success shrink-0 mt-0.5"></i>
									<div className="wrap-anywhere line-clamp-2 opacity-60">
										{shfImages[currIndex].name}
									</div>
								</div>

								{/* Right: Stacked badges */}
								<div className="grid grid-cols-1 gap-1 sm:grid">
									<span className='badge badge-soft badge-info'>{new Date(shfImages[currIndex].modifiedByMeTime).toLocaleDateString()}</span>
									<span className='badge badge-soft badge-primary'>{parseFloat((Number(shfImages[currIndex].size) / 1024 / 1024).toFixed(2))}&nbsp;MB</span>
								</div>
							</div>
						</div>
					)}

					{/* NAVIGATION SECTION */}
					<div className="w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label block pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Control</span>
						</label>
						<div className="join">
							<button
								type="button"
								className="btn btn-sm btn-ghost"
								disabled={usedIndexes.length <= 1}
								onClick={goToPrevSlide}
								title="Prev">
								<i className="bi-chevron-left" />
								<span className="hidden lg:inline">Prev</span>
							</button>
							<button
								type="button"
								className="btn btn-sm btn-ghost"
								disabled={shfImages.length === 0}
								onClick={goToNextSlide}
								title="Next">
								<span className="hidden lg:inline">Next</span>
								<i className="bi-chevron-right" />
							</button>
						</div>
					</div>

					{/* DISPLAY SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Display</span>
						</label>
						<div className="join w-full">
							<button
								type="button"
								className={`btn btn-sm flex-1 ${!isFullSize ? 'btn-primary' : 'btn-ghost'}`}
								disabled={shfImages.length === 0}
								onClick={() => setIsFullSize(false)}
								title="Normal size">
								<i className="bi-fullscreen" />
								<span className="hidden lg:inline">Normal</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${isFullSize ? 'btn-primary' : 'btn-ghost'}`}
								disabled={shfImages.length === 0}
								onClick={() => setIsFullSize(true)}
								title="Full size">
								<i className="bi-fullscreen-exit" />
								<span className="hidden lg:inline">Full</span>
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

					{/* SEARCH SECTION */}
					<div className="w-full sm:flex-1 bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Search</span>
						</label>
						<div className="input input-sm input-bordered flex items-center gap-2">
							<i className="bi-search opacity-50"></i>
							<input
								type="search"
								className="grow bg-transparent outline-none"
								placeholder="Search videos..."
								value={optSchWord}
								onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }}
							/>
						</div>
					</div>

					{/* STATS SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Results</span>
						</label>
						<div className="text-sm font-semibold flex items-center justify-center h-9">
							{shfImages.length === 0
								? (<span className="text-base-content/60">No videos</span>)
								: optSchWord
									? (<span><span className="text-primary font-bold">{currIndex + 1}</span><span className="text-base-content/60"> of {shfImages.length} </span><span className="text-xs opacity-70">({allVideos.length} total)</span></span>)
									: (<span><span className="text-primary font-bold">{currIndex + 1}</span><span className="text-base-content/60"> of {allVideos.length}</span></span>)
							}
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<section className="h-full flex flex-col">
			{renderTopCmdBar()}
			<div className="flex-1 flex items-center justify-center overflow-hidden relative bg-gray-950">
				{shfImages.length === 0
					? <AlertNoImages />
					: !currentImageUrl
						? <AlertLoading />
						: <div className="relative w-full h-full flex items-center justify-center">
							<video controls className={isFullSize ? 'h-full w-full object-contain' : 'max-h-full max-w-full object-contain'}>
								<source key={currIndex} src={currentImageUrl} type={shfImages[currIndex].mimeType} />
								Your browser does not support the video tag.
							</video>
							{showCaptions && (
								<CaptionFull
									title={shfImages[currIndex].name}
									size={Number(shfImages[currIndex].size || 0)}
									modifiedDate={new Date(shfImages[currIndex].modifiedByMeTime).toLocaleDateString()}
									mimeType={shfImages[currIndex].mimeType}
									position="bottom-left"
								/>
							)}
						</div>
				}
			</div>
		</section>
	)
}

export default VideoPlayer
