import { IFileListCache, IGapiFile, log, APP_VER } from '../App.props'
import { getCurrentUserProfile } from '../api-google'

/**
 * Convert semantic version string (e.g., "1.2.0-WIP") to an integer for IndexedDB
 * Format: major*100 + minor*10 + patch
 * Example: "1.2.0" -> 120, "2.5.3" -> 253
 */
function getDbVersionFromAppVersion(): number {
	const versionMatch = APP_VER.match(/^(\d+)\.(\d+)\.(\d+)/)
	if (!versionMatch) return 1 // Fallback if version format is unexpected

	const [, major, minor, patch] = versionMatch
	return parseInt(major) * 100 + parseInt(minor) * 10 + parseInt(patch)
}

export const CACHE_DBASE_VER = getDbVersionFromAppVersion()
const CHUNK_SIZE = 10000 // Anything over ~18000 is not storable on iPad, hence we break into 10k chunks

// PRIVATE

function getDatabaseName() {
	const profile = getCurrentUserProfile()
	const userName = profile?.getName()
	console.log('Database name for user:', userName)

	return `${userName}-File-Cache`
}

// PUBLIC

export const saveCacheToIndexedDB = (fileListCache: IFileListCache): Promise<boolean> => {
	// Helper function to chunk the array
	function chunkArray(array: IGapiFile[], size: number) {
		const chunkedArr = []
		for (let i = 0; i < array.length; i += size) {
			chunkedArr.push(array.slice(i, i + size))
		}
		return chunkedArr
	}

	return new Promise((resolve, reject) => {
		const open = indexedDB.open(getDatabaseName(), CACHE_DBASE_VER)

		open.onupgradeneeded = () => {
			const db = open.result
			if (!db.objectStoreNames.contains('GapiFileCache')) {
				db.createObjectStore('GapiFileCache', { keyPath: 'id' })
			}
		}

		open.onsuccess = () => {
			const db = open.result
			const tx = db.transaction('GapiFileCache', 'readwrite')
			const store = tx.objectStore('GapiFileCache')

			// A: Save the timestamp
			store.put({ id: 'timeStamp', timeStamp: fileListCache.timeStamp })

			// B: Split the gapiFiles into chunks and save each chunk
			const chunks = chunkArray(fileListCache.gapiFiles, CHUNK_SIZE)
			chunks.forEach((chunk, index) => {
				store.put({ id: `gapiFiles_${index}`, gapiFiles: chunk })
			})

			tx.oncomplete = () => {
				db.close()
				resolve(true)
			}

			tx.onerror = (event) => {
				console.error(event)
				reject(false)
			}
		}

		open.onerror = (event) => {
			console.error(event)
			reject(false)
		}
	})
}

export const loadCacheFromIndexedDB = (): Promise<IFileListCache> => {
	return new Promise((resolve, reject) => {
		const open = indexedDB.open(getDatabaseName(), CACHE_DBASE_VER)

		open.onupgradeneeded = () => {
			const db = open.result
			if (!db.objectStoreNames.contains('GapiFileCache')) {
				db.createObjectStore('GapiFileCache', { keyPath: 'id' })
			}
		}

		open.onsuccess = async () => {
			const db = open.result
			const tx = db.transaction('GapiFileCache', 'readonly')
			const store = tx.objectStore('GapiFileCache')
			let gapiFiles: IGapiFile[] = []
			let timeStamp: number

			// A: Retrieve the timestamp
			const stampRequest = store.get('timeStamp')
			stampRequest.onsuccess = () => {
				timeStamp = stampRequest.result.timeStamp
			}

			// B: Determine how many chunks we have
			const countRequest = store.count()
			countRequest.onsuccess = async () => {
				// Subtract 1 for the timestamp entry
				const numberOfChunks = (countRequest.result - 1)

				// Retrieve each chunk and combine them
				for (let i = 0; i < numberOfChunks; i++) {
					await new Promise((chunkResolve, chunkReject) => {
						const chunkRequest = store.get(`gapiFiles_${i}`)
						chunkRequest.onsuccess = () => {
							if (chunkRequest.result && chunkRequest.result.gapiFiles) {
								log(3, `[CacheService] Chunk ${i} retrieved with length: ${chunkRequest.result.gapiFiles.length}`) // Log each chunk's length
								gapiFiles = gapiFiles.concat(chunkRequest.result.gapiFiles)
								chunkResolve(true)
							} else {
								log(3, `[CacheService] Chunk ${i} is empty or malformed.`)
								chunkResolve(false)
							}
						}
						chunkRequest.onerror = () => {
							chunkReject(chunkRequest.error)
						}
					})
				}

				// Once all chunks are retrieved, resolve the promise with the full cache
				if (gapiFiles.length > 0 && timeStamp) {
					log(3, `[CacheService] Total gapiFiles after retrieval: ${gapiFiles.length}`) // Log the total length after all retrievals
					resolve({
						timeStamp: timeStamp,
						gapiFiles: gapiFiles,
					})
				} else {
					reject(new Error('Cache is empty or timestamp is missing'))
				}
			}

			tx.oncomplete = () => {
				db.close()
			}

			tx.onerror = (event) => {
				console.error(event)
				reject('Error loading from IndexedDB')
			}
		}

		open.onerror = (event) => {
			console.error(event)
			reject('Error opening IndexedDB')
		}
	})
}

export const getCacheTimestamp = (): Promise<number | null> => {
	return new Promise((resolve) => {
		const open = indexedDB.open(getDatabaseName(), CACHE_DBASE_VER)

		open.onupgradeneeded = () => {
			const db = open.result
			if (!db.objectStoreNames.contains('GapiFileCache')) {
				db.createObjectStore('GapiFileCache', { keyPath: 'id' })
			}
		}

		open.onsuccess = () => {
			const db = open.result
			const tx = db.transaction('GapiFileCache', 'readonly')
			const store = tx.objectStore('GapiFileCache')

			const stampRequest = store.get('timeStamp')
			stampRequest.onsuccess = () => {
				if (stampRequest.result) {
					resolve(stampRequest.result.timeStamp)
				} else {
					resolve(null)
				}
			}

			stampRequest.onerror = () => {
				resolve(null)
			}

			tx.oncomplete = () => {
				db.close()
			}
		}

		open.onerror = () => {
			resolve(null)
		}
	})
}

export async function doClearFileCache() {
	const deleteRequest = indexedDB.deleteDatabase(getDatabaseName())

	deleteRequest.onsuccess = () => {
		alert('Database deleted successfully')
		return
	}

	deleteRequest.onerror = (event) => {
		console.error('Database deletion failed', event)
		return
	}

	deleteRequest.onblocked = () => {
		console.warn('Database deletion blocked')
		return
	}
}

/**
 * Clean up old misnamed cache databases from the bug where getName was called without ()
 * This removes databases with names like "function getName() { [native code] }-File-Cache"
 */
export async function cleanupOldCaches(): Promise<{ cleaned: number, databases: string[] }> {
	try {
		const databases = await indexedDB.databases()
		const cleaned: string[] = []

		for (const db of databases) {
			if (db.name) {
				// Check if database name contains "function" or looks like the old buggy format
				if (db.name.includes('function') && db.name.includes('File-Cache')) {
					console.log('Deleting old misnamed cache:', db.name)
					await new Promise<void>((resolve, reject) => {
						const deleteRequest = indexedDB.deleteDatabase(db.name!)
						deleteRequest.onsuccess = () => {
							cleaned.push(db.name!)
							resolve()
						}
						deleteRequest.onerror = () => reject(deleteRequest.error)
						deleteRequest.onblocked = () => {
							console.warn('Deletion blocked for:', db.name)
							resolve() // Continue anyway
						}
					})
				}
			}
		}

		return { cleaned: cleaned.length, databases: cleaned }
	} catch (error) {
		console.error('Error cleaning up old caches:', error)
		return { cleaned: 0, databases: [] }
	}
}
