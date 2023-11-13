import React, { useEffect, useState } from 'react'
import { BreadcrumbSegment, IGapiFile, IGapiFolder, formatBytes, formatDate } from '../App.props'
import { fetchFolderContents, getRootFolderId } from '../api/FolderService' // Import from your service
import AlertLoading from '../components/AlertLoading'
import Breadcrumbs from '../components/Breadcrumbs'
import { Gallery, Item } from 'react-photoswipe-gallery'

interface Props {
	isBusyGapiLoad: boolean
}

type SortKey = keyof IGapiFile | keyof IGapiFolder
type SortDirection = 'ascending' | 'descending'

interface SortConfig {
	key: SortKey | null; // Include 'null' to handle no sorting case
	direction: SortDirection;
}

const FileBrowser: React.FC<Props> = ({ isBusyGapiLoad }) => {
	//
	const [currentFolderContents, setCurrentFolderContents] = useState<Array<IGapiFile | IGapiFolder>>([])
	const [currentFolderPath, setCurrentFolderPath] = useState<BreadcrumbSegment[]>([])
	//
	const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' })

	// --------------------------------------------------------------------------------------------

	/**
	 * Fetch root folder contents on mount
	 */
	useEffect(() => {
		const loadRootFolder = async () => {
			// A:
			const rootFolderId = await getRootFolderId() || ''
			const rootContents = await fetchFolderContents(rootFolderId)
			setCurrentFolderPath([{ folderName: 'My Drive', folderId: rootFolderId }])
			setCurrentFolderContents(rootContents.items)

			// B:
			setSortConfig({ key: 'name', direction: 'ascending' })
		}
		loadRootFolder()
	}, [])

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

		const sortItems = (items: Array<IGapiFile | IGapiFolder>, key: SortKey | null, direction: SortDirection) => {
			if (!key || key === 'children') return items // Exclude 'children' or any other non-common keys

			const sortedItems = [...items].sort((a, b) => {
				return compareValues(key, a, b, direction)
			})

			return sortedItems
		}

		// Assuming `originalFolderContents` holds the original unsorted data
		const sortedItems = sortItems([...currentFolderContents], sortConfig.key, sortConfig.direction)
		setCurrentFolderContents(sortedItems)
	}, [sortConfig])

	// --------------------------------------------------------------------------------------------

	const handleBreadcrumbClick = async (pathIndex: number, folderId: string) => {
		// A: Truncate the breadcrumb path
		const newPath = currentFolderPath.slice(0, pathIndex + 1)
		setCurrentFolderPath(newPath)

		// B: Fetch the contents of the clicked folder
		const contents = await fetchFolderContents(folderId)
		setCurrentFolderContents(contents.items)
	}

	const requestSort = (key: SortKey) => {
		let direction: SortDirection = 'ascending'
		if (sortConfig.key === key && sortConfig.direction === 'ascending') {
			direction = 'descending'
		}
		setSortConfig({ key, direction })
	}

	const handleFolderClick = async (folderId: string, folderName: string) => {
		const contents = await fetchFolderContents(folderId)
		setCurrentFolderContents(contents.items)
		// Append the clicked folder to the path
		setCurrentFolderPath([...currentFolderPath, { folderName: folderName, folderId: folderId }])
	}

	// --------------------------------------------------------------------------------------------

	function renderTopBar(): JSX.Element {
		return (
			<nav className="navbar sticky-top bg-dark">
				<div className="container-fluid">
					<div className="row align-items-center">
						<div className='col-auto d-none d-lg-block'>
							<a className="navbar-brand me-0 text-white">File Browser</a>
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
										<th className='cursor-link text-nowrap text-end' title="click to sort" style={{ width: '4%' }} onClick={() => requestSort('size')}>File Size {sortConfig.key === 'size' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}</th>
										<th className='cursor-link text-nowrap text-center' title="click to sort" style={{ width: '10%' }} onClick={() => requestSort('createdTime')}>Date Created {sortConfig.key === 'createdTime' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}</th>
										<th className='cursor-link text-nowrap text-center' title="click to sort" style={{ width: '10%' }} onClick={() => requestSort('modifiedByMeTime')}>Date Modified {sortConfig.key === 'modifiedByMeTime' && (sortConfig.direction === 'ascending' ? <i className="bi bi-arrow-up"></i> : <i className="bi bi-arrow-down"></i>)}</th>
									</tr>
								</thead>
								<tbody>
									{currentFolderContents.map((item, index) => {
										const isFolder = item.mimeType === 'application/vnd.google-apps.folder'
										return (
											<tr key={index} className={item.mimeType?.indexOf('folder') > -1 ? 'text-success' : 'text-info'}>
												<td>
													<i className={
														item.mimeType?.indexOf('folder') > -1
															? 'fs-4 bi-folder-fill'
															: item.mimeType?.indexOf('image') > -1
																? 'fs-4 bi-image-fill'
																: item.mimeType?.indexOf('video') > -1
																	? 'fs-4 bi-camera-video-fill'
																	: 'fs-4 bi-file-x text-light'
													} />
												</td>
												<td className='cursor-link'>
													{isFolder ?
														<div
															className='fw-bold'
															onClick={() => isFolder && handleFolderClick(item.id, item.name)}>
															{item.name}
														</div>
														: item.mimeType.includes('image/') ?
															<Gallery>
																<Item original={item.webContentLink} thumbnail={item.webContentLink}>
																	{({ ref, open }) => (
																		<a ref={ref as React.MutableRefObject<HTMLAnchorElement>} onClick={open}>
																			{item.name}
																		</a>
																	)}
																</Item>
															</Gallery>
															:
															<div>{item.name}</div>
													}
												</td>
												<td className='text-nowrap text-end'>{item.size ? formatBytes(Number(item.size)) : ''}</td>
												<td className='text-nowrap text-end'>{item.createdTime ? formatDate(item.createdTime) : ''}</td>
												<td className='text-nowrap text-end'>{item.modifiedByMeTime ? formatDate(item.modifiedByMeTime) : ''}</td>
											</tr>
										)
									})}
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
