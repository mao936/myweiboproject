import { describe, it, expect, beforeEach } from 'vitest'
import {
  listMedia,
  getMedia,
  saveMedia,
  deleteMedia,
  resetMedia
} from '../src/store/mediaStore.js'

describe('mediaStore', () => {
  beforeEach(() => {
    resetMedia()
  })

  it('returns empty library by default', () => {
    expect(listMedia()).toEqual([])
  })

  it('saves and retrieves media', () => {
    const id = saveMedia({
      data: Buffer.from('hello'),
      type: 'image',
      name: 'test.png',
      size: 5
    })
    const media = getMedia(id)
    expect(media.id).toBe(id)
    expect(media.type).toBe('image')
    expect(media.name).toBe('test.png')
    expect(media.size).toBe(5)
    expect(Buffer.isBuffer(media.data)).toBe(true)
    expect(listMedia()).toHaveLength(1)
  })

  it('saves video with cover', () => {
    const coverId = saveMedia({
      data: Buffer.from('cover'),
      type: 'image',
      name: 'cover.jpg',
      size: 5
    })
    const videoId = saveMedia({
      data: Buffer.from('video'),
      type: 'video',
      name: 'test.mp4',
      size: 10,
      coverId,
      duration: 12
    })
    const video = getMedia(videoId)
    expect(video.coverId).toBe(coverId)
    expect(video.duration).toBe(12)
  })

  it('deletes media', () => {
    const id = saveMedia({
      data: Buffer.from('hello'),
      type: 'image',
      name: 'test.png',
      size: 5
    })
    deleteMedia(id)
    expect(getMedia(id)).toBeNull()
    expect(listMedia()).toHaveLength(0)
  })

  it('returns null for missing media', () => {
    expect(getMedia('missing')).toBeNull()
  })
})
