import { describe, it, expect, beforeEach } from 'vitest'
import {
  getUser,
  updateUser,
  setAvatar,
  removeAvatar,
  resetUser,
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite
} from '../src/store/userStore.js'

describe('userStore', () => {
  beforeEach(() => {
    resetUser()
  })

  it('returns seeded user', () => {
    expect(getUser()).toEqual({ name: '我', avatarFileId: null, avatarUrl: null, favorites: [], repostedPostIds: [] })
  })

  it('updates user name', () => {
    updateUser({ name: '小明' })
    expect(getUser().name).toBe('小明')
  })

  it('sets avatar file id', () => {
    setAvatar('avatar-1')
    const user = getUser()
    expect(user.avatarFileId).toBe('avatar-1')
    expect(user.avatarUrl).toBe('http://localhost:3000/api/media/avatar-1')
  })

  it('removes avatar', () => {
    setAvatar('avatar-1')
    removeAvatar()
    expect(getUser().avatarFileId).toBeNull()
  })

  it('ignores unknown fields', () => {
    updateUser({ name: 'Bob', age: 30 })
    expect(getUser()).toEqual({ name: 'Bob', avatarFileId: null, avatarUrl: null, favorites: [], repostedPostIds: [] })
  })

  it('manages favorites', () => {
    expect(getFavorites()).toEqual([])
    expect(isFavorite('post-1')).toBe(false)
    addFavorite('post-1')
    expect(getFavorites()).toEqual(['post-1'])
    expect(isFavorite('post-1')).toBe(true)
    addFavorite('post-1')
    expect(getFavorites()).toEqual(['post-1'])
    addFavorite('post-2')
    expect(getFavorites()).toEqual(['post-1', 'post-2'])
    removeFavorite('post-1')
    expect(getFavorites()).toEqual(['post-2'])
    removeFavorite('missing')
    expect(getFavorites()).toEqual(['post-2'])
  })
})
