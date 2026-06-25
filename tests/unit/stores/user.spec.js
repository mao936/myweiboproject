import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

describe('user store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('should have default state', () => {
    const store = useUserStore()
    expect(store.name).toBe('我')
    expect(store.avatarFileId).toBeNull()
  })

  it('should update name', () => {
    const store = useUserStore()
    store.updateName('小明')
    expect(store.name).toBe('小明')
  })

  it('should update avatar', () => {
    const store = useUserStore()
    store.updateAvatar('avatar-123')
    expect(store.avatarFileId).toBe('avatar-123')
  })

  it('should persist to localStorage', () => {
    const store = useUserStore()
    store.updateName(' persisted ')
    expect(JSON.parse(localStorage.getItem('myinfo-user')).name).toBe(' persisted ')
  })
})
