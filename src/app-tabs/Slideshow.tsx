import { useCallback, useContext, useEffect, useState } from 'react'
import { DataContext } from '../api-google/DataContext'
import { IMediaFile } from '../App.props'
import { isImage } from '../utils/mimeTypes'
import AlertNoImages from '../components/AlertNoImages'

enum SlideShowDelay {
	Fast = 2,
	Normal = 5,
	Slow = 10,
}

const Slideshow: React.FC = () => {
	const { mediaFiles, getBlobUrlForFile } = useContext(DataContext)
	//
	const [randomizedImages, setRandomizedImages] = useState<IMediaFile[]>([])
	const [filteredImages, setFilteredImages] = useState<IMediaFile[]>([])
	//
	const [optSlideshowSecs, setOptSlideshowSecs] = useState(SlideShowDelay.Normal)
	const [optSchWord, setOptSchWord] = useState('')
	const [isPaused, setIsPaused] = useState(true)
	const [isFullSize, setIsFullSize] = useState(true)
	//
	const [currIndex, setCurrIndex] = useState(0)
	const [usedIndices, setUsedIndices] = useState<number[]>([])
	const [currentImageUrl, setCurrentImageUrl] = useState('')
	const [remainingSecs, setRemainingSecs] = useState(optSlideshowSecs)

	/**
	 * filter images from all files and shuffle at startup
	 */
	useEffect(() => {
		setRandomizedImages([...mediaFiles]
			.filter((item) => isImage(item))
			.sort(() => Math.random() - 0.5))
	}, [mediaFiles])

	useEffect(() => {
		setFilteredImages(randomizedImages
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
		)
	}, [randomizedImages, optSchWord])

	useEffect(() => {
		const loadImage = async () => {
			const currentImage = filteredImages[currIndex];
			if (currentImage?.id) {
				const imageBlob = await getBlobUrlForFile(currentImage.id) || '';
				setCurrentImageUrl(imageBlob);
			}
		};
		loadImage();
		// IMPORTANT: Done include `filteredImages` or `getBlobUrlForFile` in the dependencies array!!!
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currIndex, filteredImages.length]);

	// Pre-fetch next images
	useEffect(() => {
		if (isPaused) return

		const prefetchImages = async () => {
			for (let i = 1; i <= 2; i++) {
				const nextIndex = (currIndex + i) % filteredImages.length;
				const nextImage = filteredImages[nextIndex];
				if (nextImage && !nextImage.original) {
					await getBlobUrlForFile(nextImage.id);
				}
			}
		};
		prefetchImages();

		// IMPORTANT: Done include `filteredImages` or `getBlobUrlForFile` in the dependencies array, or RACE CONDITION!!
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currIndex, isPaused]);

	/**
	 * Handle resetting of current index when search word entered
	 * - ex: if user is on index 12, search word returns 1 result, index 12 is no longer valid
	 */
	useEffect(() => {
		if (currIndex >= filteredImages.length) {
			setCurrIndex(0)
		}
	}, [filteredImages, currIndex])

	const goToNextSlide = useCallback(() => {
		if (filteredImages.length === 0) return
		setCurrIndex((prevIndex) => {
			const nextIndex = (prevIndex + 1) % filteredImages.length
			setUsedIndices((prevUsedIndices) => [...prevUsedIndices, nextIndex])
			return nextIndex
		})
	}, [filteredImages.length])

	const goToPrevSlide = useCallback(() => {
		if (usedIndices.length <= 1) return
		setUsedIndices((prevUsedIndices) => {
			const newUsedIndices = prevUsedIndices.slice(0, -1)
			const prevIndex = newUsedIndices[newUsedIndices.length - 1]
			setCurrIndex(prevIndex)
			return newUsedIndices
		})
	}, [usedIndices])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'ArrowLeft') {
				goToPrevSlide()
			} else if (event.key === 'ArrowRight') {
				goToNextSlide()
			} else if (event.key === ' ') {
				setIsPaused((prevIsPaused) => !prevIsPaused)
			}
		}

		window.addEventListener('keydown', handleKeyDown)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [goToPrevSlide, goToNextSlide])

	// --------------------------------------------------------------------------------------------

	// MAIN Slide-show logic
	useEffect(() => {
		if (isPaused) return

		const interval = setInterval(() => {
			if (filteredImages.length === 0) return
			setCurrIndex((prevIndex) => {
				const nextIndex = (prevIndex + 1) % filteredImages.length
				setUsedIndices((prevUsedIndices) => [...prevUsedIndices, nextIndex])
				return nextIndex
			})
		}, optSlideshowSecs * 1000)

		return () => clearInterval(interval)
	}, [isPaused, optSlideshowSecs, filteredImages.length])

	// Update remaining seconds
	useEffect(() => {
		if (isPaused) return

		setRemainingSecs(optSlideshowSecs)
		const interval = setInterval(() => {
			setRemainingSecs((prevSecs) => (prevSecs > 1 ? prevSecs - 1 : optSlideshowSecs))
		}, 1000)

		return () => clearInterval(interval)
	}, [isPaused, optSlideshowSecs])

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		return (
			<div className="mb-4">
				<div className="flex flex-wrap gap-4 items-center justify-center">
					{/* NOW PLAYING/METADATA SECTION */}
					{filteredImages.length > 0 && (
						<div className="w-full sm:flex-1 bg-base-100 rounded-xl px-3 pt-1 pb-2">
							<div className="grid grid-cols-[1fr_auto] gap-3 items-start p-1">
								{/* Left: Icon and Title */}
								<div className="flex items-start gap-2 min-w-0 py-1">
									<i className="bi-image text-xl text-info shrink-0 mt-0.5"></i>
									<div className="wrap-anywhere line-clamp-2 opacity-60">
										{filteredImages[currIndex].name}
									</div>
								</div>

								{/* Right: Stacked badges */}
								<div className="grid grid-cols-1 gap-1 sm:grid">
									<span className='badge badge-soft badge-info'>{new Date(filteredImages[currIndex].modifiedByMeTime).toLocaleDateString()}</span>
									<span className='badge badge-soft badge-primary w-full'>{parseFloat((Number(filteredImages[currIndex].size) / 1024 / 1024).toFixed(2))}&nbsp;MB</span>
								</div>
							</div>
						</div>
					)}

					{/* PLAY/PAUSE SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Controls</span>
						</label>
						<div className="join w-full">
							<button
								type="button"
								className="btn btn-sm flex-1 flex flex-col items-center justify-center gap-0 btn-primary"
								onClick={() => { setIsPaused(!isPaused) }}
								title="play/pause (space)">
								<i className={`bi ${isPaused ? 'bi-play' : 'bi-pause'}`} />
								<span className="hidden lg:block text-xs">
									{isPaused
										? 'Play'
										: `(${remainingSecs}s)`
									}
								</span>
							</button>
							<button
								type="button"
								className="btn btn-sm flex-1 flex flex-col items-center justify-center gap-0 btn-ghost"
								disabled={usedIndices.length <= 1}
								onClick={goToPrevSlide}
								title="prev (left-arrow)">
								<i className="bi-chevron-left" />
								<span className="hidden lg:block text-xs">Prev</span>
							</button>
							<button
								type="button"
								className="btn btn-sm flex-1 flex flex-col items-center justify-center gap-0 btn-ghost"
								disabled={filteredImages.length === 0}
								onClick={goToNextSlide}
								title="next (right-arrow)">
								<i className="bi-chevron-right" />
								<span className="hidden lg:block text-xs">Next</span>
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
								className={`btn btn-sm flex-1 flex flex-col items-center justify-center gap-0 ${!isFullSize ? 'btn-primary' : 'btn-ghost'}`}
								disabled={filteredImages.length === 0}
								onClick={() => setIsFullSize(false)}
								title="Normal size">
								<i className="bi-fullscreen" />
								<span className="hidden lg:block text-xs">Normal</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 flex flex-col items-center justify-center gap-0 ${isFullSize ? 'btn-primary' : 'btn-ghost'}`}
								disabled={filteredImages.length === 0}
								onClick={() => setIsFullSize(true)}
								title="Full size">
								<i className="bi-fullscreen-exit" />
								<span className="hidden lg:block text-xs">Full</span>
							</button>
						</div>
					</div>

					{/* DELAY SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Delay</span>
						</label>
						<div className="join w-full">
							<button
								type="button"
								className={`btn btn-sm flex-1 flex flex-col items-center justify-center gap-0 ${optSlideshowSecs === SlideShowDelay.Fast ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setOptSlideshowSecs(SlideShowDelay.Fast)}
								title="Fast (2s)">
								<i className="bi-lightning" />
								<span className="hidden lg:block text-xs">Fast</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 flex flex-col items-center justify-center gap-0 ${optSlideshowSecs === SlideShowDelay.Normal ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setOptSlideshowSecs(SlideShowDelay.Normal)}
								title="Normal (5s)">
								<i className="bi-circle" />
								<span className="hidden lg:block text-xs">Normal</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 flex flex-col items-center justify-center gap-0 ${optSlideshowSecs === SlideShowDelay.Slow ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setOptSlideshowSecs(SlideShowDelay.Slow)}
								title="Slow (10s)">
								<i className="bi-hourglass-bottom" />
								<span className="hidden lg:block text-xs">Slow</span>
							</button>
						</div>
					</div>

					{/* SEARCH SECTION */}
					<div className="w-full sm:flex-1 sm:min-w-62.50 bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Search</span>
						</label>
						<div className="input input-sm input-bordered flex items-center gap-2">
							<i className="bi-search opacity-50"></i>
							<input
								type="search"
								className="grow bg-transparent outline-none"
								placeholder="Search files..."
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
							{filteredImages.length === 0
								? (<span><span className="text-base-content/60">{0} of {randomizedImages.length}</span></span>)
								: optSchWord
									? (<span><span className="text-primary font-bold">{currIndex + 1}</span><span className="text-base-content/60"> of {filteredImages.length} </span><span className="text-xs opacity-70">({randomizedImages.length} total)</span></span>)
									: (<span><span className="text-primary font-bold">{currIndex + 1}</span><span className="text-base-content/60"> of {randomizedImages.length}</span></span>)
							}
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<section className="h-full flex flex-col">
			{renderTopBar()}
			<div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-950">
				{filteredImages.length === 0
					? <AlertNoImages />
					: currentImageUrl
						? <img src={currentImageUrl} alt={filteredImages[currIndex]?.name} className={isFullSize ? 'h-full w-full object-contain' : 'max-h-full max-w-full object-contain'} />
						: <i title={filteredImages[currIndex]?.name} className="text-5xl bi-arrow-repeat animate-spin" />
				}
			</div>
		</section>
	)
}

export default Slideshow
