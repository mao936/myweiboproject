import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMediaStore } from '@/stores/media'
import { get, del, postFile } from '@/api/client'

vi.mock('@/api/client', () => import('@/api/__mocks__/client'))

describe('media store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn(() => 'blob:url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('should start with empty pending media', () => {
    const store = useMediaStore()
    expect(store.pendingMedia.length).toBe(0)
  })

  it('should add pending image', async () => {
    postFile.mockResolvedValue({ id: 'img-1', url: 'http://localhost:3000/api/media/img-1', coverUrl: null })
    const store = useMediaStore()
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' })
    const result = await store.addPendingImage(file)
    expect(result.success).toBe(true)
    expect(store.pendingMedia.length).toBe(1)
    expect(store.pendingMedia[0].type).toBe('image')
    expect(typeof store.pendingMedia[0].fileId).toBe('string')
    expect(postFile).toHaveBeenCalledWith('/media', { file })
  })

  it('should reject oversized image', async () => {
    const store = useMediaStore()
    const file = new File(['x'], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 })
    const result = await store.addPendingImage(file)
    expect(result.success).toBe(false)
    expect(store.pendingMedia.length).toBe(0)
  })

  it('should remove pending media', async () => {
    postFile.mockResolvedValue({ id: 'img-1', url: 'http://localhost:3000/api/media/img-1', coverUrl: null })
    const store = useMediaStore()
    await store.addPendingImage(new File(['x'], 'test.jpg', { type: 'image/jpeg' }))
    store.removePendingMedia(0)
    expect(store.pendingMedia.length).toBe(0)
  })

  it('should clear pending media', async () => {
    postFile.mockResolvedValue({ id: 'img-1', url: 'http://localhost:3000/api/media/img-1', coverUrl: null })
    const store = useMediaStore()
    await store.addPendingImage(new File(['x'], 'test.jpg', { type: 'image/jpeg' }))
    store.clearPendingMedia()
    expect(store.pendingMedia.length).toBe(0)
  })

  it('should return pending media for publishing', async () => {
    postFile.mockResolvedValue({ id: 'img-1', url: 'http://localhost:3000/api/media/img-1', coverUrl: null })
    const store = useMediaStore()
    await store.addPendingImage(new File(['x'], 'test.jpg', { type: 'image/jpeg' }))
    const media = store.getPendingMedia()
    expect(media.length).toBe(1)
    expect(media[0].type).toBe('image')
    expect(typeof media[0].id).toBe('string')
  })

  it('should delete media by id', async () => {
    del.mockResolvedValue({})
    const store = useMediaStore()
    await store.deleteMediaFile('img-1')
    expect(del).toHaveBeenCalledWith('/media/img-1')
  })

  it('should load all media', async () => {
    get.mockResolvedValue([
      { id: 'img-1', type: 'image', name: 'test.jpg', size: 1024, url: 'http://localhost:3000/api/media/img-1' }
    ])
    const store = useMediaStore()
    await store.loadMediaLibrary()
    expect(store.library.length).toBe(1)
    expect(store.library[0].id).toBe('img-1')
  })
})
