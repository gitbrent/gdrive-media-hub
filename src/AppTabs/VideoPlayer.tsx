import React, { useEffect, useState } from 'react'
import { IGapiFile } from '../App.props'
import AlertNoImages from '../components/AlertNoImages'
import AlertLoading from '../components/AlertLoading'

export interface Props {
	allFiles: IGapiFile[];
	downloadFile: (fileId: string) => Promise<boolean>;
}

const VideoPlayer: React.FC<Props> = ({ allFiles, downloadFile }) => {
	const [optSchWord, setOptSchWord] = useState('')
	const [shuffledImages, setShuffledImages] = useState<IGapiFile[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [usedIndices, setUsedIndices] = useState<number[]>([])
	const [currentImageUrl, setCurrentImageUrl] = useState('')
	const [allVideos, setAllVideos] = useState<IGapiFile[]>([])

	useEffect(() => {
		const videos = [...allFiles].filter((item) => item.mimeType.toLowerCase().indexOf('video/mp4') > -1)
		setAllVideos(videos)
	}, [allFiles])

	useEffect(() => {
		setShuffledImages(allVideos)
	}, [allVideos])

	useEffect(() => {
		if (shuffledImages[currentIndex]?.id && !shuffledImages[currentIndex]?.videoBlobUrl) {
			downloadFile(shuffledImages[currentIndex].id).then(() => {
				setCurrentImageUrl(shuffledImages[currentIndex].videoBlobUrl || '')
			})
		}
		else {
			setCurrentImageUrl(shuffledImages[currentIndex]?.videoBlobUrl || '')
		}
	}, [currentIndex, shuffledImages])

	const goToNextSlide = () => {
		if (shuffledImages.length === 0) return
		const nextIndex = (currentIndex + 1) % shuffledImages.length
		setCurrentImageUrl('')
		setCurrentIndex(nextIndex)
		setUsedIndices([...usedIndices, nextIndex])
	}

	const goToPrevSlide = () => {
		if (usedIndices.length <= 1) return  // Can't go back if there's only one or no image
		const prevIndex = usedIndices[usedIndices.length - 2] // Get the second last index
		setUsedIndices(usedIndices.slice(0, -1)) // Remove the last index
		setCurrentImageUrl('')
		setCurrentIndex(prevIndex)
	}

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar sticky-top bg-dark">
				<div className="container-fluid">
					<div className="row w-100 align-items-center">
						<div className='col-auto d-none d-xl-block'>
							<a className="navbar-brand text-white"><i className="bi-camera-video me-2" />Video Viewer</a>
						</div>
						<div className="col-3 col-md-auto">
							<button className='btn btn-secondary w-100' disabled={usedIndices.length <= 1} onClick={goToPrevSlide} title="Prev">
								<i className="bi-skip-backward me-0 me-md-2"></i><span className="d-none d-lg-inline-block">Prev</span>
							</button>
						</div>
						<div className="col-3 col-md-auto">
							<button className='btn btn-secondary w-100' disabled={shuffledImages.length === 0} onClick={goToNextSlide} title="Next">
								<span className="d-none d-lg-inline-block">Next</span><i className="bi-skip-forward ms-0 ms-md-2"></i>
							</button>
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
									? ('No videos to show')
									: (<span>showing <b>{currentIndex + 1}</b>&nbsp;of&nbsp;<b>{shuffledImages.length}</b>&nbsp;(<b>{allVideos.length} total)</b></span>)
								}
							</div>
						</div>
					</div>
				</div>
			</nav>
		)
	}

	function renderVideo(): JSX.Element {
		return (
			<section>
				<div className='row align-items-center justify-content-evenly text-muted'>
					<div className='col-auto h6 mb-0 py-2 px-3'>
						{shuffledImages[currentIndex].name}
					</div>
					<div className='col-auto h6 mb-0 py-2 px-3'>
						{parseFloat((Number(shuffledImages[currentIndex].size) / 1024 / 1024).toFixed(2))}&nbsp;MB
					</div>
					<div className='col-auto h6 mb-0 py-2 px-3'>
						{new Date(shuffledImages[currentIndex].modifiedByMeTime).toLocaleString()}
					</div>
				</div>
				<div className='text-center px-4'>
					{!currentImageUrl
						? <AlertLoading />
						: <video width="90%" controls>
							<source key={currentImageUrl} src={currentImageUrl} type={shuffledImages[currentIndex].mimeType} />
							Your browser does not support the video tag.
						</video>
					}
				</div>
			</section>
		)
	}

	return (
		<section>
			{renderTopBar()}
			{shuffledImages.length === 0 ? <AlertNoImages /> : renderVideo()}
		</section>
	)
}

export default VideoPlayer
