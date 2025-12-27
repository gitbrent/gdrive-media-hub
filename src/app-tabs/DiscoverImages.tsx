import { useCallback, useContext, useEffect, useState } from 'react'
import { DataContext } from '../api-google/DataContext'
import { IMediaFile } from '../App.props'
import { isImage, isGif } from '../utils/mimeTypes'
import AlertNoImages from '../components/AlertNoImages'
import { Item } from 'react-photoswipe-gallery'
import 'photoswipe/dist/photoswipe.css'

enum DiscoverySpeed {
	Fast = 2,
	Normal = 5,
	Slow = 10,
}

type MediaType = 'all' | 'image' | 'gif'

const DiscoverImages: React.FC = () => {
	const { mediaFiles, getBlobUrlForFile } = useContext(DataContext)
	//
	const [mediaType, setMediaType] = useState<MediaType>('all')
	const [speed, setSpeed] = useState(DiscoverySpeed.Normal)
	const [isPlaying, setIsPlaying] = useState(false)
	const [randomBatch, setRandomBatch] = useState<IMediaFile[]>([])
	const [currentMedia, setCurrentMedia] = useState<IMediaFile | null>(null)
	const [currentMediaUrl, setCurrentMediaUrl] = useState('')
	const [remainingSecs, setRemainingSecs] = useState(speed)

	/**
	 * Generate a new random batch of media files
	 */
	const generateNewBatch = useCallback(() => {
		const filteredMedia = mediaFiles.filter((item) => {
			if (mediaType === 'all') return isImage(item) || isGif(item)
			if (mediaType === 'image') return isImage(item)
			if (mediaType === 'gif') return isGif(item)
			return false
		})

		// Get 20 random items for the filmstrips (10 top, 10 bottom)
		const shuffled = [...filteredMedia].sort(() => Math.random() - 0.5)
		const batch = shuffled.slice(0, 20)

		setRandomBatch(batch)

		// Set the first item as current if we have any
		if (batch.length > 0) {
			setCurrentMedia(batch[0])
		}
	}, [mediaFiles, mediaType])

	/**
	 * Load current media URL
	 */
	useEffect(() => {
		const loadMedia = async () => {
			if (currentMedia?.id) {
				const mediaBlob = await getBlobUrlForFile(currentMedia.id) || ''
				setCurrentMediaUrl(mediaBlob)
			}
		}
		loadMedia()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentMedia])

	/**
	 * Pre-fetch next media items
	 */
	useEffect(() => {
		if (!isPlaying || randomBatch.length === 0) return

		const prefetchMedia = async () => {
			const currentIndex = randomBatch.findIndex(item => item.id === currentMedia?.id)
			for (let i = 1; i <= 2; i++) {
				const nextIndex = (currentIndex + i) % randomBatch.length
				const nextItem = randomBatch[nextIndex]
				if (nextItem && !('original' in nextItem)) {
					await getBlobUrlForFile(nextItem.id)
				}
			}
		}
		prefetchMedia()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentMedia, isPlaying])

	/**
	 * Main auto-play logic - randomly select from filmstrip
	 */
	useEffect(() => {
		if (!isPlaying || randomBatch.length === 0) return

		const interval = setInterval(() => {
			// Randomly select a media item from the batch
			const randomIndex = Math.floor(Math.random() * randomBatch.length)
			setCurrentMedia(randomBatch[randomIndex])
		}, speed * 1000)

		return () => clearInterval(interval)
	}, [isPlaying, speed, randomBatch])

	/**
	 * Update remaining seconds countdown
	 */
	useEffect(() => {
		if (!isPlaying) return

		setRemainingSecs(speed)
		const interval = setInterval(() => {
			setRemainingSecs((prevSecs) => (prevSecs > 1 ? prevSecs - 1 : speed))
		}, 1000)

		return () => clearInterval(interval)
	}, [isPlaying, speed, currentMedia])

	/**
	 * Keyboard shortcuts
	 */
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === ' ') {
				event.preventDefault()
				setIsPlaying((prev) => !prev)
			} else if (event.key === 'r' || event.key === 'R') {
				generateNewBatch()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [generateNewBatch])

	/**
	 * Generate initial batch on mount or when media type changes
	 */
	useEffect(() => {
		generateNewBatch()
	}, [generateNewBatch])

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		return (
			<div className="mb-4">
				<div className="flex flex-wrap gap-4 items-center justify-center">
					{/* NOW PLAYING/METADATA SECTION */}
					{currentMedia && (
						<div className="w-full sm:flex-1 bg-base-100 rounded-xl px-3 pt-1 pb-2">
							<div className="grid grid-cols-[1fr_auto] gap-3 items-start p-1">
								{/* Left: Icon and Title */}
								<div className="flex items-start gap-2 min-w-0 py-1">
									<i className={`text-xl shrink-0 mt-0.5 ${isGif(currentMedia) ? 'bi-play-btn text-warning' : 'bi-image text-info'}`}></i>
									<div className="wrap-anywhere line-clamp-2 opacity-60">
										{currentMedia.name}
									</div>
								</div>

								{/* Right: Stacked badges */}
								<div className="grid grid-cols-1 gap-1 sm:grid">
									<span className='badge badge-soft badge-info'>{new Date(currentMedia.modifiedByMeTime).toLocaleDateString()}</span>
									<span className='badge badge-soft badge-primary w-full'>{parseFloat((Number(currentMedia.size) / 1024 / 1024).toFixed(2))}&nbsp;MB</span>
								</div>
							</div>
						</div>
					)}

					{/* MEDIA TYPE FILTER SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1 block">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Type</span>
						</label>
						<div className="join">
							<button
								type="button"
								className={`btn btn-sm flex-1 ${mediaType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setMediaType('all')}
								title="Show all media">
								<i className="bi-files text-lg" />
								<span className="hidden lg:inline">All</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${mediaType === 'image' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setMediaType('image')}
								title="Show images only">
								<i className="bi-image text-lg" />
								<span className="hidden lg:inline">Image</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${mediaType === 'gif' ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setMediaType('gif')}
								title="Show gifs only">
								<i className="bi-play-btn text-lg" />
								<span className="hidden lg:inline">GIF</span>
							</button>
						</div>
					</div>

					{/* SPEED SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1 block">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Speed</span>
						</label>
						<div className="join">
							<button
								type="button"
								className={`btn btn-sm flex-1 ${speed === DiscoverySpeed.Fast ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setSpeed(DiscoverySpeed.Fast)}
								title="2 second delay">
								<i className="bi-lightning-charge text-lg" />
								<span className="hidden lg:inline">Fast</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${speed === DiscoverySpeed.Normal ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setSpeed(DiscoverySpeed.Normal)}
								title="5 second delay">
								<i className="bi-play text-lg" />
								<span className="hidden lg:inline">Normal</span>
							</button>
							<button
								type="button"
								className={`btn btn-sm flex-1 ${speed === DiscoverySpeed.Slow ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setSpeed(DiscoverySpeed.Slow)}
								title="10 second delay">
								<i className="bi-pause text-lg" />
								<span className="hidden lg:inline">Slow</span>
							</button>
						</div>
					</div>

					{/* CONTROLS SECTION */}
					<div className="w-full sm:w-auto bg-base-100 rounded-xl px-3 pt-1 pb-2">
						<label className="label pb-1 block">
							<span className="label-text text-xs font-bold uppercase tracking-wider opacity-50">Controls</span>
						</label>
						<div className="join">
							<button
								type="button"
								className={`btn btn-sm flex-1 ${isPlaying ? 'btn-primary' : 'btn-ghost'}`}
								onClick={() => setIsPlaying(!isPlaying)}
								title="Play/Pause (space)">
								<i className={`bi text-lg ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`} />
								<span className="hidden lg:inline">
									{isPlaying ? `(${remainingSecs}s)` : 'Play'}
								</span>
							</button>
							<button
								type="button"
								className="btn btn-sm flex-1 btn-ghost"
								onClick={generateNewBatch}
								title="Load new random batch (R)">
								<i className="bi-arrow-clockwise text-lg" />
								<span className="hidden lg:inline">Refresh</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	function renderFilmstrip(items: IMediaFile[], startIndex: number, count: number): JSX.Element {
		// Slice logic remains the same
		const filmstripItems = items.slice(startIndex, startIndex + count);

		return (
			<div className="flex w-full gap-3 justify-between overflow-x-auto px-4 py-4 snap-x scroll-smooth no-scrollbar">
				{filmstripItems.map((item) => {
					const isActive = currentMedia?.id === item.id;

					return (
						<div
							key={`filmstrip-${item.id}`}
							onClick={() => setCurrentMedia(item)}
							className={`
                            relative shrink-0 cursor-pointer rounded-lg overflow-hidden transition-all duration-200 snap-center
                            h-24 aspect-4/3
                            ${isActive
									? 'ring-2 ring-primary ring-offset-2 ring-offset-base-300 scale-105 opacity-100 z-10'
									: 'hover:scale-105 opacity-60 hover:opacity-100'
								}
                        `}
						>
							{(isImage(item) || isGif(item)) && item.original ? (
								<img
									src={item.original}
									alt={item.name}
									className="w-full h-full object-cover"
									loading="lazy" // Good for performance in lists
								/>
							) : (
								// Fallback state styling
								<div className="w-full h-full bg-base-300 flex flex-col items-center justify-center gap-1">
									<i className="bi-hourglass-split text-xl text-base-content/50" />
									{/* Optional: Show extension if image fails to give context */}
									<span className="text-[10px] uppercase font-mono text-base-content/30">
										{item.name.split('.').pop()}
									</span>
								</div>
							)}
						</div>
					);
				})}
			</div>
		)
	}

	function renderMainViewer(): JSX.Element {
		if (!currentMedia || !currentMediaUrl) {
			return (
				<div className="flex-1 flex items-center justify-center rounded-lg">
					<div className="text-center">
						<i className="bi-image text-6xl opacity-30 mb-4" />
						<p className="text-lg opacity-50">No media selected</p>
					</div>
				</div>
			)
		}

		// Image viewer with PhotoSwipe
		return (
			<div className="flex-1 flex items-center justify-center rounded-lg overflow-hidden">
				<Item
					original={currentMediaUrl}
					thumbnail={currentMediaUrl}
					width={currentMedia.imageMediaMetadata?.width || 1920}
					height={currentMedia.imageMediaMetadata?.height || 1080}
					key={currentMedia.id}
				>
					{({ ref, open }) => (
						<img
							ref={ref}
							onClick={open}
							src={currentMediaUrl}
							alt={currentMedia.name}
							className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
						/>
					)}
				</Item>
			</div>
		)
	}

	// --------------------------------------------------------------------------------------------

	if (mediaFiles.length === 0) {
		return <AlertNoImages />
	}

	if (randomBatch.length === 0) {
		return (
			<div className="flex items-center justify-center h-96">
				<div className="text-center">
					<i className="bi-hourglass-split text-6xl opacity-30 mb-4" />
					<p className="text-lg opacity-50">Loading random media...</p>
				</div>
			</div>
		)
	}

	return (
		<section className="flex flex-col h-full">
			{renderTopBar()}

			<div className="flex flex-col gap-4 flex-1 overflow-hidden">
				{/* Top Filmstrip */}
				<div className="bg-base-100 rounded-lg overflow-hidden">
					{renderFilmstrip(randomBatch, 0, 10)}
				</div>

				{/* Main Viewer */}
				<div className="bg-gray-950 flex-1 overflow-hidden flex rounded-lg">
					{renderMainViewer()}
				</div>

				{/* Bottom Filmstrip */}
				<div className="bg-base-100 rounded-lg overflow-hidden">
					{renderFilmstrip(randomBatch, 10, 10)}
				</div>
			</div>
		</section>
	)
}

export default DiscoverImages
