import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { get, patch, post, del, postFile } from '@/api/client'

vi.mock('@/api/client', () => import('@/api/__mocks__/client'))

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    get.mockResolvedValue({ name: '我', avatarFileId: null, avatarUrl: null })
  })

  it('should load user on init', async () => {
    get.mockResolvedValueOnce({ name: '我', avatarFileId: null, avatarUrl: null })
    get.mockResolvedValueOnce([])
    const store = useUserStore()
    await store.loadUser()
    expect(get).toHaveBeenCalledWith('/me')
    expect(get).toHaveBeenCalledWith('/me/reposts')
    expect(store.name).toBe('我')
    expect(store.avatarFileId).toBeNull()
  })

  it('should load favorites', async () => {
    get.mockResolvedValue(['p1', 'p2'])
    const store = useUserStore()
    await store.loadFavorites()
    expect(get).toHaveBeenCalledWith('/me/favorites')
    expect(store.favorites).toEqual(['p1', 'p2'])
    expect(store.isFavorite('p1')).toBe(true)
    expect(store.isFavorite('p3')).toBe(false)
  })

  it('should add favorite', async () => {
    post.mockResolvedValue({})
    const store = useUserStore()
    store.favorites = ['p1']
    await store.addFavorite('p2')
    expect(post).toHaveBeenCalledWith('/me/favorites/p2')
    expect(store.favorites).toContain('p2')
  })

  it('should remove favorite', async () => {
    del.mockResolvedValue({})
    const store = useUserStore()
    store.favorites = ['p1', 'p2']
    await store.removeFavorite('p1')
    expect(del).toHaveBeenCalledWith('/me/favorites/p1')
    expect(store.isFavorite('p1')).toBe(false)
    expect(store.isFavorite('p2')).toBe(true)
  })

  it('should toggle favorite', async () => {
    post.mockResolvedValue({})
    del.mockResolvedValue({})
    const store = useUserStore()
    store.favorites = ['p1']

    await store.toggleFavorite('p2')
    expect(post).toHaveBeenCalledWith('/me/favorites/p2')
    expect(store.isFavorite('p2')).toBe(true)

    await store.toggleFavorite('p1')
    expect(del).toHaveBeenCalledWith('/me/favorites/p1')
    expect(store.isFavorite('p1')).toBe(false)
  })

  it('should load reposts', async () => {
    get.mockResolvedValue(['p1', 'p2'])
    const store = useUserStore()
    await store.loadReposts()
    expect(get).toHaveBeenCalledWith('/me/reposts')
    expect(store.repostedPostIds).toEqual(['p1', 'p2'])
    expect(store.isReposted('p1')).toBe(true)
    expect(store.isReposted('p3')).toBe(false)
  })

  it('should add repost', async () => {
    const store = useUserStore()
    store.repostedPostIds = ['p1']
    store.addRepost('p2')
    expect(store.isReposted('p2')).toBe(true)
    store.addRepost('p2')
    expect(store.repostedPostIds).toEqual(['p1', 'p2'])
  })

  it('should remove repost', async () => {
    const store = useUserStore()
    store.repostedPostIds = ['p1', 'p2']
    store.removeRepost('p1')
    expect(store.isReposted('p1')).toBe(false)
    expect(store.isReposted('p2')).toBe(true)
  })

  it('should update name', async () => {
    patch.mockResolvedValue({})
    const store = useUserStore()
    await store.loadUser()
    await store.updateName('小明')
    expect(patch).toHaveBeenCalledWith('/me', { name: '小明' })
    expect(store.name).toBe('小明')
  })

  it('should update avatar', async () => {
    postFile.mockResolvedValue({})
    get.mockResolvedValue({ name: '我', avatarFileId: 'avatar-123', avatarUrl: '/api/media/avatar-123' })
    const store = useUserStore()
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await store.updateAvatar(file)
    expect(postFile).toHaveBeenCalledWith('/me/avatar', { avatar: file })
    expect(store.avatarFileId).toBe('avatar-123')
  })
})
