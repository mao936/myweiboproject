import { Hono } from 'hono'
import { listMedia, getMedia, getMediaData, saveMedia, deleteMedia } from '../store/mediaStore.js'
import { generateId } from '../utils/id.js'

const media = new Hono()

media.get('/', (c) => {
  return c.json(listMedia())
})

media.post('/', async (c) => {
  const form = await c.req.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') {
    return c.json({ error: 'file is required' }, 400)
  }

  const type = file.type.startsWith('video/') ? 'video' : 'image'
  let coverId = null
  let duration = null

  if (type === 'video') {
    const cover = form.get('cover')
    if (cover && typeof cover !== 'string') {
      coverId = generateId()
      saveMedia({
        id: coverId,
        data: Buffer.from(await cover.arrayBuffer()),
        type: 'image',
        name: cover.name,
        size: cover.size
      })
    }
    duration = form.get('duration')
    if (duration) {
      duration = Number(duration)
      if (!Number.isFinite(duration)) duration = null
    }
  }

  const id = generateId()
  const buffer = Buffer.from(await file.arrayBuffer())
  saveMedia({
    id,
    data: buffer,
    type,
    name: file.name,
    size: file.size,
    coverId,
    duration
  })

  const item = getMedia(id)
  return c.json(toMediaResponse(item), 201)
})

media.get('/:id', (c) => {
  const id = c.req.param('id')
  const item = getMedia(id)
  if (!item) return c.json({ error: 'media not found' }, 404)
  const data = getMediaData(id)
  return c.body(data, 200, {
    'Content-Type': inferContentType(item.name, item.type),
    'Content-Length': String(data.length)
  })
})

media.get('/:id/cover', (c) => {
  const id = c.req.param('id')
  const item = getMedia(id)
  if (!item || !item.coverId) return c.json({ error: 'cover not found' }, 404)
  const cover = getMedia(item.coverId)
  if (!cover) return c.json({ error: 'cover not found' }, 404)
  const data = getMediaData(item.coverId)
  return c.body(data, 200, {
    'Content-Type': inferContentType(cover.name, cover.type),
    'Content-Length': String(data.length)
  })
})

media.delete('/:id', (c) => {
  const id = c.req.param('id')
  const removed = deleteMedia(id)
  if (!removed) return c.json({ error: 'media not found' }, 404)
  return c.body(null, 204)
})

function inferContentType(name, type) {
  if (type === 'video') return 'video/mp4'
  if (type === 'image') {
    if (name.toLowerCase().endsWith('.png')) return 'image/png'
    if (name.toLowerCase().endsWith('.gif')) return 'image/gif'
    return 'image/jpeg'
  }
  return 'application/octet-stream'
}

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3000'

function toMediaResponse(item) {
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    size: item.size,
    coverId: item.coverId,
    duration: item.duration,
    url: `${SERVER_BASE_URL}/api/media/${item.id}`,
    coverUrl: item.coverId ? `${SERVER_BASE_URL}/api/media/${item.id}/cover` : null,
    createdAt: item.createdAt
  }
}

export default media
