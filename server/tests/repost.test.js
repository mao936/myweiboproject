import { describe, it, expect, beforeEach } from 'vitest'
import app from '../src/index.js'
import { resetAll } from '../src/store/index.js'
import {
  getReposts,
  addRepost,
  removeRepost,
  isReposted,
  resetUser
} from '../src/store/userStore.js'
import { createPost, resetPosts, getPost, toggleRepost, toggleRetract } from '../src/store/postStore.js'

describe('reposts', () => {
  beforeEach(() => {
    resetAll()
  })

  describe('store', () => {
    beforeEach(() => {
      resetUser()
      resetPosts()
    })

    it('returns empty reposts by default', () => {
      expect(getReposts()).toEqual([])
    })

    it('adds repost id if not present', () => {
      addRepost('p1')
      expect(getReposts()).toEqual(['p1'])
      addRepost('p1')
      expect(getReposts()).toEqual(['p1'])
    })

    it('removes repost id', () => {
      addRepost('p1')
      addRepost('p2')
      removeRepost('p1')
      expect(getReposts()).toEqual(['p2'])
    })

    it('checks repost status', () => {
      addRepost('p1')
      expect(isReposted('p1')).toBe(true)
      expect(isReposted('p2')).toBe(false)
    })

    it('toggleRepost increments and decrements reposts', () => {
      const post = createPost({ content: 'repost me', author: '我', avatarFileId: null })
      toggleRepost(post.id)
      expect(getPost(post.id).reposts).toBe(1)
      expect(isReposted(post.id)).toBe(true)
      toggleRepost(post.id)
      expect(getPost(post.id).reposts).toBe(0)
      expect(isReposted(post.id)).toBe(false)
    })

    it('toggleRepost returns null for missing or retracted post', () => {
      expect(toggleRepost('missing')).toBeNull()
      const post = createPost({ content: 'oops', author: '我', avatarFileId: null })
      toggleRetract(post.id)
      expect(toggleRepost(post.id)).toBeNull()
    })
  })

  describe('routes', () => {
    it('GET /api/me/reposts returns empty list', async () => {
      const res = await app.request('/api/me/reposts')
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual([])
    })

    it('POST /api/posts/:id/repost toggles repost and enriches post', async () => {
      const post = await createPostRoute(app, 'toggle repost')
      let res = await app.request(`/api/posts/${post.id}/repost`, { method: 'POST' })
      expect(res.status).toBe(200)
      let json = await res.json()
      expect(json.isReposted).toBe(true)
      expect(json.reposts).toBe(1)
      expect(getReposts()).toEqual([post.id])

      res = await app.request(`/api/posts/${post.id}/repost`, { method: 'POST' })
      expect(res.status).toBe(200)
      json = await res.json()
      expect(json.isReposted).toBe(false)
      expect(json.reposts).toBe(0)
      expect(getReposts()).toEqual([])
    })

    it('POST /api/posts/:id/repost returns 404 for missing post', async () => {
      const res = await app.request('/api/posts/missing/repost', { method: 'POST' })
      expect(res.status).toBe(404)
    })

    it('enriches listed posts with isReposted', async () => {
      const post = await createPostRoute(app, 'enrich repost')
      await app.request(`/api/posts/${post.id}/repost`, { method: 'POST' })
      const list = await (await app.request('/api/posts')).json()
      expect(list[0].isReposted).toBe(true)
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
