import React, { useEffect, useState } from 'react'
import { IGapiFile } from '../App.props'
import AlertNoImages from '../components/AlertNoImages'
import AlertLoading from '../components/AlertLoading'
import '../css/VideoPlayer.css'

export interface Props {
	allFiles: IGapiFile[];
	downloadFile: (fileId: string) => Promise<boolean>;
}

const VideoPlayer: React.FC<Props> = ({ allFiles, downloadFile }) => {
	const [allVideos, setAllVideos] = useState<IGapiFile[]>([])
	const [shfImages, setShfImages] = useState<IGapiFile[]>([])
	const [currIndex, setCurrIndex] = useState(0)
	const [usedIndexes, setUsedIndexes] = useState<number[]>([])
	const [currentImageUrl, setCurrentImageUrl] = useState('')
	const [optSchWord, setOptSchWord] = useState('')

	/**
	 * filter videos from all files and shuffle at startup
	 */
	useEffect(() => {
		setAllVideos([...allFiles]
			.filter((item) => item.mimeType.toLowerCase().indexOf('video/mp4') > -1)
			.sort(() => Math.random() - 0.5))
	}, [allFiles])

	/**
	 * update shuffled videos when search term changes
	 */
	useEffect(() => {
		setShfImages(allVideos
			.filter((item) => { return !optSchWord || item.name.toLowerCase().indexOf(optSchWord.toLowerCase()) > -1 })
		)
	}, [allVideos, optSchWord])

	useEffect(() => {
		if (shfImages[currIndex]?.id && !shfImages[currIndex]?.videoBlobUrl) {
			downloadFile(shfImages[currIndex].id).then(() => {
				setCurrentImageUrl(shfImages[currIndex].videoBlobUrl || '')
			})
		}
		else {
			setCurrentImageUrl(shfImages[currIndex]?.videoBlobUrl || '')
		}
	}, [currIndex, shfImages])

	useEffect(() => {
		setCurrIndex(0)
	}, [optSchWord])

	// --------------------------------------------------------------------------------------------

	const goToNextSlide = () => {
		if (shfImages.length === 0) return
		const nextIndex = (currIndex + 1) % shfImages.length
		setCurrentImageUrl('')
		setCurrIndex(nextIndex)
		setUsedIndexes([...usedIndexes, nextIndex])
	}

	const goToPrevSlide = () => {
		if (usedIndexes.length <= 1) return  // Can't go back if there's only one or no image
		const prevIndex = usedIndexes[usedIndexes.length - 2] // Get the second last index
		setUsedIndexes(usedIndexes.slice(0, -1)) // Remove the last index
		setCurrentImageUrl('')
		setCurrIndex(prevIndex)
	}

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar sticky-top bg-dark">
				<div className="container-fluid">
					<div className="row w-100 align-items-center justify-content-between">
						<div className='col-auto d-none d-xl-block'>
							<a className="navbar-brand text-white"><i className="bi-camera-video me-2" />Video Viewer</a>
						</div>
						<div className="col">
							<button className='btn btn-secondary w-100' disabled={usedIndexes.length <= 1} onClick={goToPrevSlide} title="Prev">
								<i className="bi-chevron-left me-0 me-md-2"></i><span className="d-none d-lg-inline-block">Prev</span>
							</button>
						</div>
						<div className="col">
							<button className='btn btn-secondary w-100' disabled={shfImages.length === 0} onClick={goToNextSlide} title="Next">
								<span className="d-none d-lg-inline-block">Next</span><i className="bi-chevron-right ms-0 ms-md-2"></i>
							</button>
						</div>
						<div className="col mt-3 mt-md-0">
							<form className="d-flex" role="search">
								<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
								<input type="search" placeholder="Search" aria-label="Search" aria-describedby="grp-search" className="form-control" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
							</form>
						</div>
						<div className="col-auto mt-3 mt-md-0">
							<div className="text-muted">
								{shfImages.length === 0
									? ('No videos to show')
									: optSchWord
										? (<span><b>{currIndex + 1}</b>&nbsp;of&nbsp;<b>{shfImages.length}</b>&nbsp;(<b>{allVideos.length} total)</b></span>)
										: (<span><b>{currIndex + 1}</b>&nbsp;of&nbsp;<b>{allVideos.length}</b></span>)
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
				{!currentImageUrl
					? <AlertLoading />
					: <section>
						<div className="position-relative">
							<div className="position-absolute top-0 start-0 w-100 bg-dark bg-opacity-50 text-opacity-75 text-white px-2 py-1 d-flex justify-content-between align-items-center">
								<div className='col-auto h6 mb-0 py-2 px-3'>
									{shfImages[currIndex].name}
								</div>
								<div className='col-auto h6 mb-0 py-2 px-3'>
									{parseFloat((Number(shfImages[currIndex].size) / 1024 / 1024).toFixed(2))}&nbsp;MB
								</div>
								<div className='col-auto h6 mb-0 py-2 px-3'>
									{new Date(shfImages[currIndex].modifiedByMeTime).toLocaleString()}
								</div>
							</div>
						</div>
						<div id="video-container">
							<video id="video-player" controls>
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
