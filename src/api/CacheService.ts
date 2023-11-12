import { IFileListCache, IGapiFile, log } from '../App.props'
import { authUserName } from '../AppMainLogic'

export const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const CACHE_DBASE_VER = 6
const CHUNK_SIZE = 10000 // Anything over ~18000 is not storage on iPad, hence we break into 10k chunks

// PRIVATE

function getDatabaseName() {
	return `${authUserName}-File-Cache`
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
