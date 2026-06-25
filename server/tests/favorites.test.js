import { describe, it, expect, beforeEach } from 'vitest'
import app from '../src/index.js'
import { resetAll } from '../src/store/index.js'
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  resetUser
} from '../src/store/userStore.js'
import { createPost, resetPosts, getPost } from '../src/store/postStore.js'

describe('favorites', () => {
  beforeEach(() => {
    resetAll()
  })

  describe('store', () => {
    beforeEach(() => {
      resetUser()
      resetPosts()
    })

    it('returns empty favorites by default', () => {
      expect(getFavorites()).toEqual([])
    })

    it('adds favorite id if not present', () => {
      addFavorite('p1')
      expect(getFavorites()).toEqual(['p1'])
      addFavorite('p1')
      expect(getFavorites()).toEqual(['p1'])
    })

    it('removes favorite id', () => {
      addFavorite('p1')
      addFavorite('p2')
      removeFavorite('p1')
      expect(getFavorites()).toEqual(['p2'])
    })

    it('checks favorite status', () => {
      addFavorite('p1')
      expect(isFavorite('p1')).toBe(true)
      expect(isFavorite('p2')).toBe(false)
    })
  })

  describe('routes', () => {
    it('GET /api/me/favorites returns empty list', async () => {
      const res = await app.request('/api/me/favorites')
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual([])
    })

    it('POST /api/me/favorites/:postId adds favorite', async () => {
      const post = await createPostRoute(app, 'favorite me')
      const res = await app.request(`/api/me/favorites/${post.id}`, { method: 'POST' })
      expect(res.status).toBe(201)
      expect(await res.json()).toEqual([post.id])
      expect(isFavorite(post.id)).toBe(true)
    })

    it('POST /api/me/favorites/:postId returns 404 for missing post', async () => {
      const res = await app.request('/api/me/favorites/missing', { method: 'POST' })
      expect(res.status).toBe(404)
    })

    it('DELETE /api/me/favorites/:postId removes favorite', async () => {
      const post = await createPostRoute(app, 'unfavorite me')
      await app.request(`/api/me/favorites/${post.id}`, { method: 'POST' })
      const res = await app.request(`/api/me/favorites/${post.id}`, { method: 'DELETE' })
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual([])
      expect(isFavorite(post.id)).toBe(false)
    })

    it('POST /api/posts/:id/favorite toggles favorite and enriches post', async () => {
      const post = await createPostRoute(app, 'toggle me')
      let res = await app.request(`/api/posts/${post.id}/favorite`, { method: 'POST' })
      expect(res.status).toBe(200)
      let json = await res.json()
      expect(json.isFavorited).toBe(true)
      expect(getFavorites()).toEqual([post.id])

      res = await app.request(`/api/posts/${post.id}/favorite`, { method: 'POST' })
      expect(res.status).toBe(200)
      json = await res.json()
      expect(json.isFavorited).toBe(false)
      expect(getFavorites()).toEqual([])
    })

    it('POST /api/posts/:id/favorite returns 404 for missing post', async () => {
      const res = await app.request('/api/posts/missing/favorite', { method: 'POST' })
      expect(res.status).toBe(404)
    })

    it('enriches listed posts with isFavorited', async () => {
      const post = await createPostRoute(app, 'enrich me')
      await app.request(`/api/me/favorites/${post.id}`, { method: 'POST' })
      const list = await (await app.request('/api/posts')).json()
      expect(list[0].isFavorited).toBe(true)
    })
  })
})

async function createPostRoute(app, content) {
  const res = await app.request('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
  return res.json()
}
