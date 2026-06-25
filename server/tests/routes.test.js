import { describe, it, expect, beforeEach } from 'vitest'
import app from '../src/index.js'
import { resetAll } from '../src/store/index.js'

describe('routes', () => {
  beforeEach(() => {
    resetAll()
  })

  describe('GET /api/me', () => {
    it('returns current user', async () => {
      const res = await app.request('/api/me')
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toEqual({ name: '我', avatarFileId: null, avatarUrl: null })
    })
  })

  describe('PATCH /api/me', () => {
    it('updates user name', async () => {
      const res = await app.request('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '小明' })
      })
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ name: '小明', avatarFileId: null, avatarUrl: null })
    })

    it('rejects empty name', async () => {
      const res = await app.request('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' })
      })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/me/avatar', () => {
    it('uploads avatar image', async () => {
      const { body, headers } = await createAvatarForm()
      const res = await app.request('/api/me/avatar', {
        method: 'POST',
        headers,
        body
      })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.avatarFileId).toBeTruthy()
      expect(json.name).toBe('我')
    })

    it('rejects missing avatar', async () => {
      const { body, headers } = await buildMultipartBody({})
      const res = await app.request('/api/me/avatar', {
        method: 'POST',
        headers,
        body
      })
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /api/me/avatar', () => {
    it('removes avatar', async () => {
      const { body, headers } = await createAvatarForm()
      await app.request('/api/me/avatar', {
        method: 'POST',
        headers,
        body
      })
      const res = await app.request('/api/me/avatar', { method: 'DELETE' })
      expect(res.status).toBe(200)
      expect((await res.json()).avatarFileId).toBeNull()
    })
  })

  describe('settings', () => {
    it('GET /api/settings', async () => {
      const res = await app.request('/api/settings')
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ theme: 'cyan', bgInterval: 10 })
    })

    it('PATCH /api/settings', async () => {
      const res = await app.request('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: 'dark', bgInterval: 20 })
      })
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ theme: 'dark', bgInterval: 20 })
    })
  })

  describe('posts', () => {
    it('GET /api/posts returns empty list', async () => {
      const res = await app.request('/api/posts')
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual([])
    })

    it('POST /api/posts creates post', async () => {
      const res = await app.request('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'hello #world', mood: 'happy' })
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.content).toBe('hello #world')
      expect(json.tags).toContain('world')
    })

    it('GET /api/posts/:id', async () => {
      const created = await createPost(app, 'find me')
      const res = await app.request(`/api/posts/${created.id}`)
      expect(res.status).toBe(200)
      expect((await res.json()).content).toBe('find me')
    })

    it('returns 404 for missing post', async () => {
      const res = await app.request('/api/posts/missing')
      expect(res.status).toBe(404)
    })

    it('PATCH /api/posts/:id edits post', async () => {
      const created = await createPost(app, 'old')
      const res = await app.request(`/api/posts/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'new #updated', mood: 'sad' })
      })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.content).toBe('new #updated')
      expect(json.mood).toBe('sad')
      expect(json.tags).toContain('updated')
    })

    it('DELETE /api/posts/:id', async () => {
      const created = await createPost(app, 'delete me')
      const res = await app.request(`/api/posts/${created.id}`, { method: 'DELETE' })
      expect(res.status).toBe(204)
      expect((await app.request(`/api/posts/${created.id}`)).status).toBe(404)
    })

    it('POST /api/posts/:id/pin and DELETE pin', async () => {
      const a = await createPost(app, 'a')
      const b = await createPost(app, 'b')
      await app.request(`/api/posts/${a.id}/pin`, { method: 'POST' })
      await app.request(`/api/posts/${b.id}/pin`, { method: 'POST' })
      let list = await (await app.request('/api/posts')).json()
      expect(list[0].id).toBe(b.id)
      expect(list.find(p => p.id === a.id).isPinned).toBe(false)
      await app.request(`/api/posts/${b.id}/pin`, { method: 'DELETE' })
      list = await (await app.request('/api/posts')).json()
      expect(list.find(p => p.id === b.id).isPinned).toBe(false)
    })

    it('POST /api/posts/:id/like toggles like', async () => {
      const post = await createPost(app, 'like me')
      let res = await app.request(`/api/posts/${post.id}/like`, { method: 'POST' })
      expect(res.status).toBe(200)
      let json = await res.json()
      expect(json.likedByMe).toBe(true)
      expect(json.likes).toBe(1)
      res = await app.request(`/api/posts/${post.id}/like`, { method: 'POST' })
      json = await res.json()
      expect(json.likedByMe).toBe(false)
      expect(json.likes).toBe(0)
    })

    it('POST /api/posts/:id/retract toggles retract', async () => {
      const post = await createPost(app, 'oops')
      let res = await app.request(`/api/posts/${post.id}/retract`, { method: 'POST' })
      expect((await res.json()).isRetracted).toBe(true)
      res = await app.request(`/api/posts/${post.id}/retract`, { method: 'POST' })
      expect((await res.json()).isRetracted).toBe(false)
    })

    it('POST /api/posts/:id/hide and DELETE hide', async () => {
      const post = await createPost(app, 'hide me')
      await app.request(`/api/posts/${post.id}/hide`, { method: 'POST' })
      let list = await (await app.request('/api/posts')).json()
      expect(list.find(p => p.id === post.id)).toBeUndefined()
      await app.request(`/api/posts/${post.id}/hide`, { method: 'DELETE' })
      list = await (await app.request('/api/posts')).json()
      expect(list.find(p => p.id === post.id)).toBeDefined()
    })

    it('POST /api/posts/:id/comments adds comment', async () => {
      const post = await createPost(app, 'comment me')
      const res = await app.request(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'nice' })
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.comments).toHaveLength(1)
      expect(json.comments[0].content).toBe('nice')
    })

    it('GET /api/posts?q= filters posts', async () => {
      await createPost(app, 'hello world')
      await createPost(app, 'foo bar')
      const res = await app.request('/api/posts?q=hello')
      expect((await res.json())).toHaveLength(1)
    })
  })

  describe('media', () => {
    it('GET /api/media returns empty list', async () => {
      const res = await app.request('/api/media')
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual([])
    })

    it('POST /api/media uploads image', async () => {
      const { body, headers } = await createImageForm('test.png')
      const res = await app.request('/api/media', {
        method: 'POST',
        headers,
        body
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.id).toBeTruthy()
      expect(json.type).toBe('image')
    })

    it('POST /api/media uploads video with cover', async () => {
      const { body, headers } = await buildMultipartBody({
        file: { blob: new Blob(['video'], { type: 'video/mp4' }), filename: 'video.mp4' },
        cover: { blob: new Blob(['cover'], { type: 'image/jpeg' }), filename: 'cover.jpg' }
      })
      const res = await app.request('/api/media', {
        method: 'POST',
        headers,
        body
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.type).toBe('video')
      expect(json.coverId).toBeTruthy()
    })

    it('GET /api/media/:id returns file', async () => {
      const { body, headers } = await createImageForm('test.png')
      const created = await (await app.request('/api/media', {
        method: 'POST',
        headers,
        body
      })).json()
      const res = await app.request(`/api/media/${created.id}`)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toBe('image/png')
    })

    it('GET /api/media/:id/cover returns cover', async () => {
      const { body, headers } = await buildMultipartBody({
        file: { blob: new Blob(['video'], { type: 'video/mp4' }), filename: 'video.mp4' },
        cover: { blob: new Blob(['cover'], { type: 'image/jpeg' }), filename: 'cover.jpg' }
      })
      const created = await (await app.request('/api/media', {
        method: 'POST',
        headers,
        body
      })).json()
      const res = await app.request(`/api/media/${created.id}/cover`)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toBe('image/jpeg')
    })

    it('DELETE /api/media/:id removes file', async () => {
      const { body, headers } = await createImageForm('test.png')
      const created = await (await app.request('/api/media', {
        method: 'POST',
        headers,
        body
      })).json()
      const res = await app.request(`/api/media/${created.id}`, { method: 'DELETE' })
      expect(res.status).toBe(204)
      expect((await app.request(`/api/media/${created.id}`)).status).toBe(404)
    })
  })
})

function createAvatarForm() {
  return buildMultipartBody({
    avatar: { blob: new Blob(['image'], { type: 'image/png' }), filename: 'avatar.png' }
  })
}

function createImageForm(filename) {
  return buildMultipartBody({
    file: { blob: new Blob(['image'], { type: 'image/png' }), filename }
  })
}

async function buildMultipartBody(fields) {
  const boundary = '----test-boundary-' + Math.random().toString(36).slice(2)
  const chunks = []
  for (const [name, value] of Object.entries(fields)) {
    const { blob, filename = 'file' } = value.blob ? value : { blob: value, filename: 'file' }
    chunks.push(Buffer.from(`--${boundary}\r\n`))
    chunks.push(Buffer.from(`Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`))
    chunks.push(Buffer.from(`Content-Type: ${blob.type || 'application/octet-stream'}\r\n\r\n`))
    chunks.push(Buffer.from(await blob.arrayBuffer()))
    chunks.push(Buffer.from('\r\n'))
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`))
  return {
    body: Buffer.concat(chunks),
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
  }
}

async function createPost(app, content) {
  const res = await app.request('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
  return res.json()
}
