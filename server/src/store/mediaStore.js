import { generateId } from '../utils/id.js'

const mediaMap = new Map()

export function resetMedia() {
  mediaMap.clear()
}

export function listMedia() {
  return Array.from(mediaMap.values()).map(m => ({
    id: m.id,
    type: m.type,
    name: m.name,
    size: m.size,
    coverId: m.coverId,
    duration: m.duration,
    createdAt: m.createdAt
  }))
}

export function getMedia(id) {
  return mediaMap.has(id) ? { ...mediaMap.get(id) } : null
}

export function getMediaData(id) {
  return mediaMap.has(id) ? mediaMap.get(id).data : null
}

export function saveMedia({ id = generateId(), data, type, name, size, coverId = null, duration = null }) {
  const item = {
    id,
    data,
    type,
    name,
    size,
    coverId,
    duration,
    createdAt: new Date().toISOString()
  }
  mediaMap.set(id, item)
  return id
}

export function deleteMedia(id) {
  const media = mediaMap.get(id)
  if (!media) return false
  mediaMap.delete(id)
  if (media.coverId) {
    mediaMap.delete(media.coverId)
  }
  return true
}
