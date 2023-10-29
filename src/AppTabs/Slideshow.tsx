import React, { useEffect, useState } from 'react'
import { IGapiFile } from '../App.props'
import NoImagesAlert from '../components/NoImagesAlert'
import '../css/Slideshow.css'

enum SlideShowDelay {
	Fast = 2,
	Normal = 5,
	Slow = 10,
}

interface Props {
	allFiles: IGapiFile[];
	downloadFile: (fileId: string) => Promise<boolean>;
}

const Slideshow: React.FC<Props> = ({ allFiles, downloadFile }) => {
	const [optSlideshowSecs, setOptSlideshowSecs] = useState(SlideShowDelay.Normal)
	const [optSchWord, setOptSchWord] = useState('')
	//
	const [shuffledImages, setShuffledImages] = useState<IGapiFile[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [usedIndices, setUsedIndices] = useState<number[]>([])
	//
	const [isPaused, setIsPaused] = useState(true)
	const currentImage = shuffledImages[currentIndex]

	// Shuffle images once at the beginning
	useEffect(() => {
		const shuffled = [...allFiles]
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
			.sort(() => Math.random() - 0.5)
		setShuffledImages(shuffled)
	}, [allFiles, optSchWord])

	// Pre-fetching logic
	useEffect(() => {
		for (let i = 1; i <= 3; i++) {
			const nextIndex = (currentIndex + i) % shuffledImages.length
			if (!shuffledImages[nextIndex]?.imageBlobUrl) {
				downloadFile(shuffledImages[nextIndex]?.id)
			}
		}
	}, [currentIndex, shuffledImages, downloadFile])

	// --------------------------------------------------------------------------------------------

	// MAIN Slide-show logic
	useEffect(() => {
		if (isPaused) return

		const interval = setInterval(() => {
			if (shuffledImages.length === 0) return
			const nextIndex = (currentIndex + 1) % shuffledImages.length
			setCurrentIndex(nextIndex)
			setUsedIndices([...usedIndices, nextIndex])
		}, optSlideshowSecs * 1000)

		return () => clearInterval(interval)
	}, [optSlideshowSecs, currentIndex, shuffledImages, usedIndices, isPaused])

	const goToNextSlide = () => {
		if (shuffledImages.length === 0) return
		const nextIndex = (currentIndex + 1) % shuffledImages.length
		setCurrentIndex(nextIndex)
		setUsedIndices([...usedIndices, nextIndex])
	}

	const goToPreviousSlide = () => {
		if (usedIndices.length <= 1) return  // Can't go back if there's only one or no image
		const prevIndex = usedIndices[usedIndices.length - 2] // Get the second last index
		setUsedIndices(usedIndices.slice(0, -1)) // Remove the last index
		setCurrentIndex(prevIndex)
	}

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		console.log(Object.entries(SlideShowDelay))

		return (
			<nav className="navbar position-sticky bg-dark py-3" style={{ top: 0, zIndex: 100 }}>
				<div className="container-fluid">
					<div className="row w-100 align-items-center">
						<div className='col-auto d-none d-lg-block'>
							<a className="navbar-brand text-white me-0">Slide Show</a>
						</div>
						<div className="col-3 col-md">
							<button className="btn btn-primary w-100" onClick={() => { setIsPaused(!isPaused) }}>
								{isPaused ? <span><i className='bi-play me-2'></i>Play</span> : <span><i className='bi-pause me-2'></i>Pause</span>}
							</button>
						</div>
						<div className="col-3 col-md-auto">
							<button className='btn btn-secondary w-100' disabled={usedIndices.length <= 1} onClick={goToPreviousSlide}>
								<i className="bi-skip-backward me-2"></i><span className="d-none d-lg-inline-block">Prev</span>
							</button>
						</div>
						<div className="col-3 col-md-auto">
							<button className='btn btn-secondary w-100' disabled={shuffledImages.length === 0} onClick={goToNextSlide}>
								<span className="d-none d-lg-inline-block">Next</span><i className="bi-skip-forward ms-2"></i>
							</button>
						</div>
						<div className='col-3 col-md-auto'>
							<div className="dropdown">
								<button className="btn btn-secondary dropdown-toggle" type="button" id="delayDropdown" data-bs-toggle="dropdown" aria-expanded="false">
									<span className="d-none d-lg-inline-block">Delay: </span>{optSlideshowSecs}<span className="d-none d-lg-inline-block"> sec</span>
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
						<div className="col-12 col-md mt-3 mt-md-0">
							<form className="d-flex" role="search">
								<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
								<input type="search" placeholder="Search" aria-label="Search" aria-describedby="grp-search" className="form-control" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
							</form>
						</div>
						<div className="col-12 col-md-auto mt-3 mt-md-0">
							<div className="text-muted">
								{shuffledImages.length === 0
									? ('No files to show')
									: (<span><span className="d-none d-lg-inline-block">Showing </span><b>{shuffledImages.length}</b> of <b>{allFiles.length}</b> files</span>)
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
			<div className='slideShowContainer'>
				<div className='slideShowMain'>
					{shuffledImages.length === 0
						? <NoImagesAlert />
						: currentImage?.imageBlobUrl ? <img src={currentImage.imageBlobUrl} /> : <i className="h1 mb-0 bi-arrow-repeat" />
					}
				</div>
			</div>
		</section>
	)
}

export default Slideshow
