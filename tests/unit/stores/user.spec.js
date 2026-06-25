import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { get, patch, postFile } from '@/api/client'

vi.mock('@/api/client', () => import('@/api/__mocks__/client'))

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    get.mockResolvedValue({ name: '我', avatarFileId: null, avatarUrl: null })
  })

  it('should load user on init', async () => {
    const store = useUserStore()
    await store.loadUser()
    expect(get).toHaveBeenCalledWith('/me')
    expect(store.name).toBe('我')
    expect(store.avatarFileId).toBeNull()
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
