const DB_NAME = 'myinfo-media-db'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('media')) {
        db.createObjectStore('media', { keyPath: 'id' })
      }
    }
  })
}

export async function saveMedia(id, blob, metadata = {}) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('media', 'readwrite')
    const store = tx.objectStore('media')
    const data = { id, blob, ...metadata, createdAt: new Date().toISOString() }
    const request = store.put(data)
    request.onsuccess = () => resolve(id)
    request.onerror = () => reject(request.error)
  })
}

export async function getMedia(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('media', 'readonly')
    const store = tx.objectStore('media')
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteMedia(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('media', 'readwrite')
    const store = tx.objectStore('media')
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getAllMediaIds() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('media', 'readonly')
    const store = tx.objectStore('media')
    const request = store.getAllKeys()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllMedia() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('media', 'readonly')
    const store = tx.objectStore('media')
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function createObjectURL(id) {
  const item = await getMedia(id)
  if (!item || !item.blob) return null
  return URL.createObjectURL(item.blob)
}

export async function cleanupOrphanMedia(usedFileIds) {
  const allIds = await getAllMediaIds()
  const used = new Set(usedFileIds)
  const orphans = allIds.filter(id => !used.has(id))
  for (const id of orphans) {
    await deleteMedia(id)
  }
  return orphans.length
}
