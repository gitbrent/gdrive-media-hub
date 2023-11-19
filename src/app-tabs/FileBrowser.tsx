import React, { useEffect, useState } from 'react'
import { BreadcrumbSegment, IGapiFile, IGapiFolder, IGapiItem, formatBytesToMB, formatDate } from '../App.props'
import { fetchFolderContents, fetchWithTokenRefresh, getRootFolderId } from '../api/FolderService'
import { getBlobForFile } from '../api'
import AlertLoading from '../components/AlertLoading'
import Breadcrumbs from '../components/Breadcrumbs'
import '../css/FileBrowser.css'

interface Props {
	isBusyGapiLoad: boolean
}

type SortKey = keyof IGapiItem
type SortDirection = 'ascending' | 'descending'

interface SortConfig {
	key: SortKey | null; // Include 'null' to handle no sorting case
	direction: SortDirection;
}

const FileBrowser: React.FC<Props> = ({ isBusyGapiLoad }) => {
	const [origFolderContents, setOrigFolderContents] = useState<Array<IGapiFile | IGapiFolder>>([])
	const [currFolderContents, setCurrFolderContents] = useState<Array<IGapiFile | IGapiFolder>>([])
	const [currentFolderPath, setCurrentFolderPath] = useState<BreadcrumbSegment[]>([])
	const [selectedFile, setSelectedFile] = useState<IGapiFile | null>(null)
	const [isMediaLoading, setIsMediaLoading] = useState(false)
	const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' })
	const [optSchWord, setOptSchWord] = useState('')

	// --------------------------------------------------------------------------------------------

	/**
	 * Fetch root folder contents on mount
	 */
	useEffect(() => {
		const loadRootFolder = async () => {
			// A:
			const rootFolderId = await getRootFolderId() || ''
			const rootContents = await fetchWithTokenRefresh(rootFolderId)
			setCurrentFolderPath([{ folderName: 'My Drive', folderId: rootFolderId }])
			setCurrFolderContents(rootContents.items)
			setOrigFolderContents(rootContents.items)

			// B:
			setSortConfig({ key: 'name', direction: 'ascending' })
		}
		loadRootFolder()
	}, [])

	/**
	 * FILTER and SORT folder contents
	 */
	useEffect(() => {
		function compareValues<T extends IGapiFile | IGapiFolder>(key: keyof T, a: T, b: T, direction: SortDirection) {
			// Place folders before files
			if (a.mimeType === 'application/vnd.google-apps.folder' && b.mimeType !== 'application/vnd.google-apps.folder') {
				return -1
			}
			if (b.mimeType === 'application/vnd.google-apps.folder' && a.mimeType !== 'application/vnd.google-apps.folder') {
				return 1
			}

			// Handle null size
			if (key === 'size') {
				const aValue = a.size ? parseInt(a.size) : 0
				const bValue = b.size ? parseInt(b.size) : 0
				return direction === 'ascending' ? aValue - bValue : bValue - aValue
			}

			// For other properties
			if (!(key in a) || !(key in b)) return 0
			const aValue = a[key] as string | number
			const bValue = b[key] as string | number

			if (direction === 'ascending') {
				return aValue < bValue ? -1 : 1
			} else {
				return aValue > bValue ? -1 : 1
			}
		}

		const filterItems = (items: Array<IGapiFile | IGapiFolder>) => {
			return items.filter((item) => {
				return !optSchWord || item.name.toLowerCase().includes(optSchWord.toLowerCase())
			})
		}

		const sortItems = (items: Array<IGapiFile | IGapiFolder>, key: SortKey | null, direction: SortDirection) => {
			if (!key) return items // Exclude other non-common keys

			const filteredItems = filterItems(items)
			const sortedItems = filteredItems.sort((a, b) => compareValues(key, a, b, direction))
			return sortedItems
		}

		const sortedFilteredItems = sortItems(origFolderContents, sortConfig.key, sortConfig.direction)
		setCurrFolderContents(sortedFilteredItems)
	}, [sortConfig, optSchWord, origFolderContents])

	// --------------------------------------------------------------------------------------------

	const requestSort = (key: SortKey) => {
		let direction: SortDirection = 'ascending'

		if (sortConfig.key === key && sortConfig.direction === 'ascending') {
			direction = 'descending'
		}

		setSortConfig({ key, direction })
	}

	const handleFolderClick = async (folderId: string, folderName: string) => {
		try {
			const contents = await fetchWithTokenRefresh(folderId)
			setOrigFolderContents(contents.items)
			setCurrFolderContents(contents.items)
			setCurrentFolderPath([...currentFolderPath, { folderName: folderName, folderId: folderId }])
		} catch (err: any) {
			console.error('Error fetching folder contents:', err)
			console.error(err.status)
		}
	}

	const handleFileClick = async (file: IGapiFile) => {
		if (file.mimeType.includes('image/') || file.mimeType.includes('video/')) {
			setIsMediaLoading(true)

			const blobUrl = await getBlobForFile(file.id)
			if (blobUrl) {
				setSelectedFile({ ...file, blobUrl: blobUrl })
			}

			setIsMediaLoading(false)
		} else {
			// TODO: Handle error scenario (e.g., show an error message)
		}
	}

	const handleBreadcrumbClick = async (pathIndex: number, folderId: string) => {
		// A: Fetch the contents of the clicked folder
		const contents = await fetchFolderContents(folderId)
		setOrigFolderContents(contents.items)
		setCurrFolderContents(contents.items)

		// B: Truncate the breadcrumb path
		// NOTE: Do this second as new currFolderPath triggers re-sort and we want contents to be set prior to sorting
		const newPath = currentFolderPath.slice(0, pathIndex + 1)
		setCurrentFolderPath(newPath)

		// C: Clear filter
		setOptSchWord('')
	}

	// --------------------------------------------------------------------------------------------

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'ArrowLeft') {
				navigateToPrevFile()
			}
			else if (event.key === 'ArrowRight') {
				navigateToNextFile()
			}
		}

		window.addEventListener('keydown', handleKeyDown)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [currFolderContents, selectedFile, handleFileClick])

	const navigateToNextFile = () => {
		const currentIndex = currFolderContents.findIndex(item => item.id === selectedFile?.id)
		if (currentIndex >= 0 && currentIndex < currFolderContents.length - 1) {
			const nextFile = currFolderContents[currentIndex + 1]
			if (nextFile.mimeType.includes('image/') || nextFile.mimeType.includes('video/')) {
				handleFileClick(nextFile)
			}
		}
	}

	const navigateToPrevFile = () => {
		const currentIndex = currFolderContents.findIndex(item => item.id === selectedFile?.id)
		if (currentIndex > 0) {
			const prevFile = currFolderContents[currentIndex - 1]
			if (prevFile.mimeType.includes('image/') || prevFile.mimeType.includes('video/')) {
				handleFileClick(prevFile)
			}
		}
	}

	// --------------------------------------------------------------------------------------------

	const ImageViewerOverlay: React.FC<{ selectedFile: IGapiFile }> = ({ selectedFile }) => {
		if (!selectedFile) return null

		return (
			<div className="image-viewer-overlay cursor-link" onClick={() => setSelectedFile(null)}>
				<div className="image-viewer-content">
					<img src={selectedFile.blobUrl} alt={selectedFile.name} />
				</div>
			</div>
		)
	}

	const VideoViewerOverlay: React.FC<{ selectedFile: IGapiFile }> = ({ selectedFile }) => {
		if (!selectedFile) return null

		return (
			<div className="video-viewer-overlay cursor-link" onClick={() => setSelectedFile(null)}>
				<div className="video-viewer-content">
					<video id="video-player" controls>
						<source src={selectedFile.blobUrl} type={selectedFile.mimeType} />
						Your browser does not support the video tag.
					</video>
				</div>
			</div>
		)
	}

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar sticky-top bg-dark">
				<div className="container-fluid">
					<div className="row align-items-center w-100">
						<div className="col-auto d-none d-lg-block">
							<a className="navbar-brand me-0 text-white">File Browser</a>
						</div>
						<div className="col">
							<div className="input-group">
								<span id="grp-search" className="input-group-text"><i className="bi-search"></i></span>
								<input type="search" placeholder="Search" aria-label="Search" aria-describedby="grp-search" className="form-control" value={optSchWord} onChange={(ev) => { setOptSchWord(ev.currentTarget.value) }} />
							</div>
						</div>
						<div className="col-auto">
							{`${currFolderContents.filter(item => item.mimeType === 'application/vnd.google-apps.folder').length} Folders / ${currFolderContents.filter(item => item.mimeType !== 'application/vnd.google-apps.folder').length} Files`}
						</div>
					</div>
				</div>
			</nav>
		)
	}

	function renderBrowser(): JSX.Element {
		return (
			<section>
				<Breadcrumbs path={currentFolderPath} onNavigate={handleBreadcrumbClick} />
				{isMediaLoading
					? (
						<div className="media-loading-indicator">
							<div className="spinner-border text-light" role="status">
								<span className="visually-hidden">Loading...</span>
							</div>
							<strong className="ms-3" role="status">Loading...</strong>
						</div>
					)
					: selectedFile ? (
						// eslint-disable-next-line react/prop-types
						selectedFile.mimeType.includes('video/') ?
							<VideoViewerOverlay selectedFile={selectedFile} /> :
							<ImageViewerOverlay selectedFile={selectedFile} />
					) :
						<div />
				}
				<section className='p-4'>
					<div className='p-4 bg-black'>
						<div className='table-responsive'>
							<table className='table align-middle mb-0'>
								<thead>
									<tr className='text-noselect'>
										<th style={{ width: '1%' }}>&nbsp;</th>
										<th className='cursor-link text-nowrap' title="click to sort" onClick={() => requestSort('name')}>
											Name&nbsp;
											{sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}
										</th>
										<th className='cursor-link text-nowrap text-end d-none d-md-table-cell' title="click to sort" style={{ width: '4%' }} onClick={() => requestSort('mimeType')}>Mime Type {sortConfig.key === 'size' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}</th>
										<th className='cursor-link text-nowrap text-end' title="click to sort" style={{ width: '4%' }} onClick={() => requestSort('size')}>File Size {sortConfig.key === 'size' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}</th>
										<th className='cursor-link text-nowrap text-center d-none d-xl-table-cell' title="click to sort" style={{ width: '10%' }} onClick={() => requestSort('createdTime')}>Date Created {sortConfig.key === 'createdTime' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}</th>
										<th className='cursor-link text-nowrap text-center' title="click to sort" style={{ width: '10%' }} onClick={() => requestSort('modifiedByMeTime')}>Date Modified {sortConfig.key === 'modifiedByMeTime' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}</th>
									</tr>
								</thead>
								<tbody>
									{currFolderContents.length > 0
										? currFolderContents.map((item, index) => {
											const isFolder = item.mimeType?.includes('folder')
											const mimeTextClass = isFolder ? 'text-success' : item.mimeType?.includes('image') ? 'text-info' : 'text-warning'
											return (
												<tr key={index}>
													<td>
														<div className={mimeTextClass}>
															<i className={
																item.mimeType?.indexOf('folder') > -1
																	? 'fs-4 bi-folder-fill'
																	: item.mimeType?.indexOf('image') > -1
																		? 'fs-4 bi-image-fill'
																		: item.mimeType?.indexOf('video') > -1
																			? 'fs-4 bi-camera-video-fill'
																			: 'fs-4 bi-file-x text-light'
															} />
														</div>
													</td>
													<td className='cursor-link'>
														{isFolder ?
															<div
																className={`${mimeTextClass} fw-bold`}
																onClick={() => isFolder && handleFolderClick(item.id, item.name)}>
																{item.name}
															</div>
															: item.mimeType.includes('image/') || item.mimeType.includes('video/') ?
																<div className={mimeTextClass} onClick={() => handleFileClick(item)}>
																	{item.name}
																</div>
																:
																<div>{item.name}</div>
														}
													</td>
													<td className='text-nowrap text-end text-muted d-none d-md-table-cell'>{!isFolder && item.mimeType ? item.mimeType.split('/').pop() : ''}</td>
													<td className='text-nowrap text-end text-muted'>{item.size ? formatBytesToMB(Number(item.size)) : ''}</td>
													<td className='text-nowrap text-center text-muted d-none d-xl-table-cell'>{item.createdTime ? formatDate(item.createdTime) : ''}</td>
													<td className='text-nowrap text-center text-muted d-none d-md-table-cell d-xl-none'>{item.modifiedByMeTime ? formatDate(item.modifiedByMeTime, 'short') : ''}</td>
													<td className='text-nowrap text-center text-muted d-none d-xl-table-cell'>{item.modifiedByMeTime ? formatDate(item.modifiedByMeTime) : ''}</td>
												</tr>
											)
										})
										: (
											<tr>
												<td colSpan={6} className='text-center text-muted p-3'>(no media files)</td>
											</tr>
										)
									}
								</tbody>
							</table>
						</div>
					</div>
				</section>
			</section>
		)
	}

	return (
		<section>
			{renderTopBar()}
			{isBusyGapiLoad ? <AlertLoading /> : renderBrowser()}
		</section>
	)
}

export default FileBrowser
