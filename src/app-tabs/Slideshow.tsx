import { useCallback, useContext, useEffect, useState } from 'react'
import { DataContext } from '../api-google/DataContext'
import { IMediaFile } from '../App.props'
import { isImage } from '../utils/mimeTypes'
import AlertNoImages from '../components/AlertNoImages'
import '../css/Slideshow.css'

enum SlideShowDelay {
	Fast = 2,
	Normal = 5,
	Slow = 10,
}

const Slideshow: React.FC = () => {
	const { mediaFiles, downloadFile, getBlobUrlForFile } = useContext(DataContext)
	//
	const [randomizedImages, setRandomizedImages] = useState<IMediaFile[]>([])
	const [filteredImages, setFilteredImages] = useState<IMediaFile[]>([])
	//
	const [optSlideshowSecs, setOptSlideshowSecs] = useState(SlideShowDelay.Normal)
	const [optSchWord, setOptSchWord] = useState('')
	const [isPaused, setIsPaused] = useState(true)
	//
	const [currIndex, setCurrIndex] = useState(0)
	const [usedIndices, setUsedIndices] = useState<number[]>([])
	const [currentImageUrl, setCurrentImageUrl] = useState('')

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
			const imageBlob = await getBlobUrlForFile(currentImage.id) || '';
			setCurrentImageUrl(imageBlob);
		};
		loadImage();
		// IMPORTANT: Done include `filteredImages` or `getBlobUrlForFile` in the dependencies array!!!
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currIndex, filteredImages.length]);

	// Pre-fetch next images
	useEffect(() => {
		if (isPaused) return

		const prefetchImages = async () => {
			for (let i = 1; i <= 3; i++) {
				const nextIndex = (currIndex + i) % filteredImages.length;
				const nextImage = filteredImages[nextIndex];
				if (nextImage && !nextImage.original) {
					await downloadFile(nextImage.id);
				}
			}
		};
		prefetchImages();

		// IMPORTANT: Done include `filteredImages` or `downloadFile` in the dependencies array, or RACE CONDITION!!
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

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar mb-3">
				<div className="container-fluid">
					<div className="row w-100 align-items-center">
						<div className="col-12 col-md">
							<button className="btn btn-primary w-100" onClick={() => { setIsPaused(!isPaused) }} title="play/pause (space)">
								{isPaused
									? <span><i className='bi-play  me-0 me-md-2'></i><span className="d-none d-lg-inline-block">Play</span></span>
									: <span><i className='bi-pause me-0 me-md-2'></i><span className="d-none d-lg-inline-block">Pause</span></span>
								}
							</button>
						</div>
						<div className="col-5 col-md-auto">
							<button className='btn btn-secondary w-100' disabled={usedIndices.length <= 1} onClick={goToPrevSlide} title="prev (left-arrow)">
								<i className="bi-chevron-left me-0 me-md-2"></i><span className="d-none d-lg-inline-block">Prev</span>
							</button>
						</div>
						<div className="col-5 col-md-auto">
							<button className='btn btn-secondary w-100' disabled={filteredImages.length === 0} onClick={goToNextSlide} title="next (right-arrow)">
								<span className="d-none d-lg-inline-block">Next</span><i className="bi-chevron-right ms-0 ms-md-2"></i>
							</button>
						</div>
						<div className="col-2 col-md-auto">
							<div className="dropdown">
								<button className="btn btn-secondary dropdown-toggle" type="button" id="delayDropdown" data-bs-toggle="dropdown" aria-expanded="false">
									<span className="d-none d-lg-inline-block">Delay:&nbsp;</span>{optSlideshowSecs}<span className="d-none d-lg-inline-block">&nbsp;sec</span>
								</button>
								<ul className="dropdown-menu" aria-labelledby="delayDropdown">
									{Object.entries(SlideShowDelay).filter(([key]) => isNaN(Number(key))).map(([key, value]) => (
										<li key={key + value}>
											<button
												className={`dropdown-item ${optSlideshowSecs === value ? 'disabled' : ''}`}
												onClick={() => setOptSlideshowSecs(value as SlideShowDelay)}
											>
												{value} seconds ({key})
											</button>
										</li>
									))}
								</ul>
							</div>
						</div>
						<div className="col col-md mt-3 mt-md-0">
							<div className="input-group">
								<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
								<input type="search" placeholder="Search" aria-label="Search" aria-describedby="grp-search" className="form-control" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
							</div>
						</div>
						<div className="col-auto col-md-auto mt-3 mt-md-0">
							<div className="text-muted">
								{filteredImages.length === 0
									? (<span><b>{0}</b>&nbsp;of&nbsp;<b>{randomizedImages.length}</b></span>)
									: optSchWord
										? (<span><b>{currIndex + 1}</b>&nbsp;of&nbsp;<b>{filteredImages.length}</b>&nbsp;(<b>{randomizedImages.length} total)</b></span>)
										: (<span><b>{currIndex + 1}</b>&nbsp;of&nbsp;<b>{randomizedImages.length}</b></span>)
								}
							</div>
						</div>
					</div>
				</div>
			</nav>
		)
	}

	return (
		<section>
			{renderTopBar()}
			<div className="slideShowContainer">
				<div className="slideShowMain">
					{filteredImages.length === 0
						? <AlertNoImages />
						: currentImageUrl
							? <img src={currentImageUrl} />
							: <i title={filteredImages[currIndex]?.name} className="h1 mb-0 bi-arrow-repeat" />
					}
				</div>
			</div>
		</section>
	)
}

export default Slideshow
