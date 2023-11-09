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
	const [allImages, setAllImages] = useState<IGapiFile[]>([])
	const [optSlideshowSecs, setOptSlideshowSecs] = useState(SlideShowDelay.Normal)
	const [optSchWord, setOptSchWord] = useState('')
	//
	const [shfImages, setShfImages] = useState<IGapiFile[]>([])
	const [currIndex, setCurrIndex] = useState(0)
	const [usedIndices, setUsedIndices] = useState<number[]>([])
	//
	const [isPaused, setIsPaused] = useState(true)
	const [currentImageUrl, setCurrentImageUrl] = useState('')

	/**
	 * filter images from all files and shuffle at startup
	 */
	useEffect(() => {
		setAllImages([...allFiles]
			.filter((item) => item.mimeType.toLowerCase().indexOf('image') > -1)
			.sort(() => Math.random() - 0.5))
	}, [allFiles])

	useEffect(() => {
		setShfImages(allImages
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
		)
	}, [allImages, optSchWord])

	useEffect(() => {
		if (shfImages[currIndex]?.id && !shfImages[currIndex]?.imageBlobUrl) {
			downloadFile(shfImages[currIndex].id).then(() => {
				setCurrentImageUrl(shfImages[currIndex].imageBlobUrl || '')
			})
		}
		else {
			setCurrentImageUrl(shfImages[currIndex]?.imageBlobUrl || '')
		}
	}, [currIndex, shfImages])

	// Pre-fetching logic
	useEffect(() => {
		for (let i = 1; i <= 3; i++) {
			const nextIndex = (currIndex + i) % shfImages.length
			if (shfImages[nextIndex] && !shfImages[nextIndex].imageBlobUrl) {
				downloadFile(shfImages[nextIndex].id)
			}
		}
	}, [currIndex, shfImages])

	/**
	 * Handle resetting of current index when search word entered
	 * - ex: if user is on index 12, search word returns 1 result, index 12 is no longer valid
	 */
	useEffect(() => {
		if (currIndex >= shfImages.length) {
			setCurrIndex(0)
		}
	}, [shfImages, currIndex])

	const goToNextSlide = () => {
		if (shfImages.length === 0) return
		const nextIndex = (currIndex + 1) % shfImages.length
		setCurrIndex(nextIndex)
		setUsedIndices([...usedIndices, nextIndex])
	}

	const goToPrevSlide = () => {
		if (usedIndices.length <= 1) return  // Can't go back if there's only one or no image
		const prevIndex = usedIndices[usedIndices.length - 2] // Get the second last index
		setUsedIndices(usedIndices.slice(0, -1)) // Remove the last index
		setCurrIndex(prevIndex)
	}

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'ArrowLeft') {
				goToPrevSlide()
			}
			else if (event.key === 'ArrowRight') {
				goToNextSlide()
			}
			else if (event.key === ' ') {
				setIsPaused(!isPaused)
			}
		}

		// Add event listener
		window.addEventListener('keydown', handleKeyDown)

		// Cleanup event listener
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [goToPrevSlide, goToNextSlide, setIsPaused])

	// --------------------------------------------------------------------------------------------

	// MAIN Slide-show logic
	useEffect(() => {
		if (isPaused) return

		const interval = setInterval(() => {
			if (shfImages.length === 0) return
			const nextIndex = (currIndex + 1) % shfImages.length
			setCurrIndex(nextIndex)
			setUsedIndices([...usedIndices, nextIndex])
		}, optSlideshowSecs * 1000)

		return () => clearInterval(interval)
	}, [optSlideshowSecs, currIndex, shfImages, usedIndices, isPaused])

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
							<button className="btn btn-primary w-100" onClick={() => { setIsPaused(!isPaused) }} title="play/pause (space)">
								{isPaused
									? <span><i className='bi-play  me-0 me-md-2'></i><span className="d-none d-lg-inline-block">Play</span></span>
									: <span><i className='bi-pause me-0 me-md-2'></i><span className="d-none d-lg-inline-block">Pause</span></span>
								}
							</button>
						</div>
						<div className="col-3 col-md-auto">
							<button className='btn btn-secondary w-100' disabled={usedIndices.length <= 1} onClick={goToPrevSlide} title="prev (left-arrow)">
								<i className="bi-chevron-left me-0 me-md-2"></i><span className="d-none d-lg-inline-block">Prev</span>
							</button>
						</div>
						<div className="col-3 col-md-auto">
							<button className='btn btn-secondary w-100' disabled={shfImages.length === 0} onClick={goToNextSlide} title="next (right-arrow)">
								<span className="d-none d-lg-inline-block">Next</span><i className="bi-chevron-right ms-0 ms-md-2"></i>
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
								{shfImages.length === 0
									? (<span><b>{0}</b>&nbsp;of&nbsp;<b>{allImages.length}</b></span>)
									: optSchWord
										? (<span><b>{currIndex + 1}</b>&nbsp;of&nbsp;<b>{shfImages.length}</b>&nbsp;(<b>{allImages.length} total)</b></span>)
										: (<span><b>{currIndex + 1}</b>&nbsp;of&nbsp;<b>{allImages.length}</b></span>)
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
					{shfImages.length === 0
						? <AlertNoImages />
						: currentImageUrl
							? <img src={currentImageUrl} />
							: <i title={shfImages[currIndex]?.name} className="h1 mb-0 bi-arrow-repeat" />
					}
				</div>
			</div>
		</section>
	)
}

export default Slideshow
