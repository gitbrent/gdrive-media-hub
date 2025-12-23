import { useContext, useEffect, useState } from 'react'
import { DataContext } from '../api-google/DataContext'
import { IMediaFile } from '../App.props'
import { isVideo } from '../utils/mimeTypes'
import AlertNoImages from '../components/AlertNoImages'
import AlertLoading from '../components/AlertLoading'

const VideoPlayer: React.FC = () => {
	const { mediaFiles, getBlobUrlForFile } = useContext(DataContext)
	//
	const [allVideos, setAllVideos] = useState<IMediaFile[]>([])
	const [shfImages, setShfImages] = useState<IMediaFile[]>([])
	const [currIndex, setCurrIndex] = useState(0)
	const [usedIndexes, setUsedIndexes] = useState<number[]>([])
	const [currentImageUrl, setCurrentImageUrl] = useState('')
	const [optSchWord, setOptSchWord] = useState('')

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

	function renderTopBar(): JSX.Element {
		return (
			<div className="mb-6">
				<div className="flex flex-wrap gap-4 items-center justify-center">
					{/* NAVIGATION SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Control</span>
						</label>
						<div className="join w-full">
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

					{/* SEARCH SECTION */}
					<div className="w-full sm:flex-1 sm:min-w-62.50 bg-base-100 rounded-xl p-2">
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

	function renderVideo(): JSX.Element {
		return (
			<section>
				{!currentImageUrl
					? <AlertLoading />
					: <section className="relative">
						{/* OVERLAY METADATA */}
						<div className="absolute top-0 left-0 right-0 bg-black/50 text-white px-2 py-1 flex items-center gap-2 text-sm">
							<div className="flex-1 text-right truncate">
								{shfImages[currIndex].name}
							</div>
							<div className="shrink-0">
								{parseFloat((Number(shfImages[currIndex].size) / 1024 / 1024).toFixed(2))}&nbsp;MB
							</div>
							<div className="flex-1 text-left text-xs hidden sm:block">
								{new Date(shfImages[currIndex].modifiedByMeTime).toLocaleString()}
							</div>
						</div>
						{/* VIDEO CONTAINER */}
						<div className="w-full max-w-full" style={{ maxHeight: 'calc(100vh - 70px - 110px)' }}>
							<video controls className="w-full h-auto object-contain" style={{ maxHeight: 'calc(100vh - 70px - 110px)' }}>
								<source key={currIndex} src={currentImageUrl} type={shfImages[currIndex].mimeType} />
								Your browser does not support the video tag.
							</video>
						</div>
					</section>
				}
			</section>
		)
	}

	return (
		<section>
			{renderTopBar()}
			{shfImages.length === 0 ? <AlertNoImages /> : renderVideo()}
		</section>
	)
}

export default VideoPlayer
