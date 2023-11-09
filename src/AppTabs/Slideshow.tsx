import React, { useEffect, useState } from 'react'
import { IGapiFile } from '../App.props'
import AlertNoImages from '../components/AlertNoImages'
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
	const [currentImageUrl, setCurrentImageUrl] = useState('')

	useEffect(() => {
		if (shuffledImages[currentIndex]?.id && !shuffledImages[currentIndex]?.imageBlobUrl) {
			downloadFile(shuffledImages[currentIndex].id).then(() => {
				setCurrentImageUrl(shuffledImages[currentIndex].imageBlobUrl || '')
			})
		}
		else {
			setCurrentImageUrl(shuffledImages[currentIndex]?.imageBlobUrl || '')
		}
	}, [currentIndex, shuffledImages])

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
			if (shuffledImages[nextIndex] && !shuffledImages[nextIndex].imageBlobUrl) {
				downloadFile(shuffledImages[nextIndex].id)
			}
		}
	}, [currentIndex, shuffledImages])

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

	// TODO: 20231029: use `downloadFile` on first init, then use UpdateDate like gird so we GUARANTEE the image shows/is loaded
	/* 20231029 - not working, seems like a closure issue in `AppMainLogic.ts`
	useEffect(() => {
		if (currentImage && currentImage.id && !currentImage.imageBlobUrl) {
			downloadFile(currentImage.id)
				.then(() => {
					//setLastLoadDate(new Date().toISOString())
				})
				.catch((error) => {
					console.error(`Error downloading item: ${currentImage.id}`, error)
				})
		}
	}, [currentImage])
	*/

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar sticky-top bg-dark">
				<div className="container-fluid">
					<div className="row w-100 align-items-center">
						<div className='col-auto d-none d-xl-block'>
							<a className="navbar-brand me-0 text-white">Slide Show</a>
						</div>
						<div className="col col-md">
							<button className="btn btn-primary w-100" onClick={() => { setIsPaused(!isPaused) }} title="play/pause">
								{isPaused
									? <span><i className='bi-play  me-0 me-md-2'></i><span className="d-none d-lg-inline-block">Play</span></span>
									: <span><i className='bi-pause me-0 me-md-2'></i><span className="d-none d-lg-inline-block">Pause</span></span>
								}
							</button>
						</div>
						<div className="col-3 col-md-auto">
							<button className='btn btn-secondary w-100' disabled={usedIndices.length <= 1} onClick={goToPreviousSlide} title="Prev">
								<i className="bi-skip-backward me-0 me-md-2"></i><span className="d-none d-lg-inline-block">Prev</span>
							</button>
						</div>
						<div className="col-3 col-md-auto">
							<button className='btn btn-secondary w-100' disabled={shuffledImages.length === 0} onClick={goToNextSlide} title="Next">
								<span className="d-none d-lg-inline-block">Next</span><i className="bi-skip-forward ms-0 ms-md-2"></i>
							</button>
						</div>
						<div className="col-3 col-md-auto">
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
							<form className="d-flex" role="search">
								<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
								<input type="search" placeholder="Search" aria-label="Search" aria-describedby="grp-search" className="form-control" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
							</form>
						</div>
						<div className="col-auto col-md-auto mt-3 mt-md-0">
							<div className="text-muted">
								{shuffledImages.length === 0
									? ('No files to show')
									: (<span>
										<b>{shuffledImages.length}</b>&nbsp;of&nbsp;
										<b>{allFiles.length}</b><span className="d-none d-lg-inline-block"></span>
									</span>)
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
						? <AlertNoImages />
						: currentImageUrl ? <img src={currentImageUrl} /> : <i className="h1 mb-0 bi-arrow-repeat" />
					}
				</div>
			</div>
		</section>
	)
}

export default Slideshow
