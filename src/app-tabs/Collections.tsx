import { useContext, useState, useMemo } from 'react'
import { DataContext } from '../api-google/DataContext'
import AlertLoading from '../components/AlertLoading'
import GridView from '../components/GridView'
import { IMediaFile, formatBytes } from '../App.props'
import '../css/Collections.css'

interface CollectionGroup {
	prefix: string
	count: number
	files: IMediaFile[]
	gradientClass: string
	videoCount: number
	dateRange: string
	avgSize: string
	totalSize: number
	imageCount: number
}

const Collections: React.FC = () => {
	const { mediaFiles, isLoading } = useContext(DataContext)
	const [selectedCollection, setSelectedCollection] = useState<CollectionGroup | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const MIN_COUNT = 10

	// Helper to calculate collection metadata
	const calculateMetadata = (files: IMediaFile[]) => {
		const dates = files
			.map(f => f.modifiedByMeTime ? new Date(f.modifiedByMeTime).getTime() : 0)
			.filter(d => d > 0)
			.sort((a, b) => a - b)

		const dateRange = dates.length > 0
			? `${new Date(dates[0]).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${new Date(dates[dates.length - 1]).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
			: 'No dates'

		const totalSize = files.reduce((sum, f) => sum + (Number(f.size) || 0), 0)
		const avgSize = files.length > 0 ? formatBytes(totalSize / files.length, 1) : '0 KB'

		const imageCount = files.filter(f => f.mimeType.includes('image/')).length
		const videoCount = files.filter(f => f.mimeType.includes('video/')).length

		return { dateRange, avgSize, totalSize, imageCount, videoCount }
	}

	// Analyze file names and extract common prefixes/patterns
	const collections = useMemo(() => {
		const prefixMap = new Map<string, IMediaFile[]>()

		mediaFiles.forEach(file => {
			// Extract all meaningful words (3+ characters) from the filename
			// Remove file extension first, then split by separators
			const nameWithoutExt = file.name.replace(/\.[^.]+$/, '') // Remove file extension
			const words = nameWithoutExt
				.split(/[\s\-_]+/) // Split by spaces, dashes, underscores
				.filter(word => /^[A-Za-z]+$/.test(word) && word.length >= 3) // Only alphabetic words, 3+ chars

			// Add file to collection for each significant word found
			const addedPatterns = new Set<string>()
			words.forEach(word => {
				const normalizedWord = word.toLowerCase()
				// Avoid adding the same word twice
				if (!addedPatterns.has(normalizedWord)) {
					if (!prefixMap.has(normalizedWord)) {
						prefixMap.set(normalizedWord, [])
					}
					prefixMap.get(normalizedWord)!.push(file)
					addedPatterns.add(normalizedWord)
				}
			})
		})

		// Convert to array and filter by minimum count
		const gradientClasses = [
			'bg-gradient-to-br from-violet-600 to-violet-800',
			'bg-gradient-to-br from-blue-600 to-blue-800',
			'bg-gradient-to-br from-emerald-600 to-emerald-800',
			'bg-gradient-to-br from-pink-600 to-pink-800',
			'bg-gradient-to-br from-orange-600 to-orange-800',
			'bg-gradient-to-br from-cyan-600 to-cyan-800',
			'bg-gradient-to-br from-indigo-600 to-indigo-800',
			'bg-gradient-to-br from-red-600 to-red-800',
			'bg-gradient-to-br from-sky-600 to-sky-800',
		]

		const result: CollectionGroup[] = Array.from(prefixMap.entries())
			.filter(([, files]) => files.length >= MIN_COUNT)
			.map(([prefix, files], index) => {
				const metadata = calculateMetadata(files)
				return {
					prefix: prefix.charAt(0).toUpperCase() + prefix.slice(1),
					count: files.length,
					files,
					gradientClass: gradientClasses[index % gradientClasses.length],
					...metadata
				}
			})
			.sort((a, b) => b.count - a.count)

		return result
	}, [mediaFiles])

	// Filter collections based on search
	const filteredCollections = useMemo(() => {
		if (!searchTerm) return collections
		return collections.filter(c =>
			c.prefix.toLowerCase().includes(searchTerm.toLowerCase())
		)
	}, [collections, searchTerm])

	const handleCollectionClick = (collection: CollectionGroup) => {
		setSelectedCollection(collection)
	}

	const handleBackToCollections = () => {
		setSelectedCollection(null)
	}

	const getCardSize = (count: number): string => {
		if (count >= 100) return 'large'
		if (count >= 50) return 'medium'
		return 'small'
	}

	const getAnimationDelay = (index: number): string => {
		return `${index * 0.05}s`
	}

	if (isLoading) return <AlertLoading />

	if (selectedCollection) {
		return (
			<section className="collections-container">
				<div className="collection-header">
					<button className="btn-back" onClick={handleBackToCollections}>
						<i className="bi bi-arrow-left"></i>
						<span>Back to Collections</span>
					</button>
					<div className="collection-title">
						<h2>{selectedCollection.prefix} Collection</h2>
						<span className="collection-count">{selectedCollection.count} items</span>
					</div>
				</div>
				<GridView
					currFolderContents={selectedCollection.files}
					isFolderLoading={false}
					handleFolderClick={async () => { }}
					tileSize="medium"
				/>
			</section>
		)
	}

	return (
		<section className="collections-container">
			<div className="collections-hero">
				<h1 className="collections-main-title">
					<i className="bi bi-collection-fill"></i>
					Your Media Collections
				</h1>
				<p className="collections-subtitle">
					Discover patterns and groups in your media library
				</p>

				<div className="collections-search">
					<i className="bi bi-search search-icon"></i>
					<input
						type="text"
						className="search-input"
						placeholder="Search collections..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>

				<div className="collections-stats">
					<div className="stat-card">
						<div className="stat-icon purple">
							<i className="bi bi-collection"></i>
						</div>
						<div className="stat-content">
							<div className="stat-value">{collections.length}</div>
							<div className="stat-label">Collections</div>
						</div>
					</div>
					<div className="stat-card">
						<div className="stat-icon blue">
							<i className="bi bi-file-earmark-image"></i>
						</div>
						<div className="stat-content">
							<div className="stat-value">{mediaFiles.length}</div>
							<div className="stat-label">Total Files</div>
						</div>
					</div>
					<div className="stat-card">
						<div className="stat-icon green">
							<i className="bi bi-graph-up"></i>
						</div>
						<div className="stat-content">
							<div className="stat-value">
								{collections.length > 0 ? Math.round(mediaFiles.length / collections.length) : 0}
							</div>
							<div className="stat-label">Avg per Collection</div>
						</div>
					</div>
				</div>
			</div>

			{filteredCollections.length === 0 ? (
				<div className="no-collections">
					<i className="bi bi-inbox"></i>
					<h3>No collections found</h3>
					<p>Try adjusting your search or add more media files</p>
				</div>
			) : (
				<div className="collections-grid">
					{filteredCollections.map((collection, index) => (
						<div
							key={collection.prefix}
							className={`collection-card ${getCardSize(collection.count)} ${collection.gradientClass}`}
							style={{
								animationDelay: getAnimationDelay(index)
							}}
							onClick={() => handleCollectionClick(collection)}
						>
							<div className="collection-card-content">
								<div className="collection-header-row">
									<div className="collection-icon">
										{collection.count}
									</div>
									<h3 className="collection-name">{collection.prefix}</h3>
								</div>
								<div className="collection-stats">
									<div className="stat-row">
										<i className="bi bi-calendar-range"></i>
										<span>{collection.dateRange}</span>
									</div>
									<div className="stat-row">
										<i className="bi bi-hdd"></i>
										<span>Avg: {collection.avgSize}</span>
									</div>
									<div className="stat-row file-types">
										{collection.imageCount > 0 && (
											<span className="type-badge">
												<i className="bi bi-image"></i> {collection.imageCount} Images
											</span>
										)}
										{collection.videoCount > 0 && (
											<span className="type-badge">
												<i className="bi bi-camera-video"></i> {collection.videoCount} Videos
											</span>
										)}
									</div>
								</div>
							</div>
							<div className="collection-overlay">
								<span className="view-text">
									<i className="bi bi-eye"></i>
									View Collection
								</span>
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	)
}

export default Collections
