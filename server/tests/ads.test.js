import { describe, it, expect, beforeEach } from 'vitest'
import app from '../src/index.js'
import { resetAll } from '../src/store/index.js'
import { listAds, getAd, resetAds } from '../src/store/adStore.js'

describe('ads routes', () => {
  beforeEach(() => {
    resetAll()
  })

  it('GET /api/ads returns seeded ads', async () => {
    const res = await app.request('/api/ads')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.length).toBe(2)
  })

  it('GET /api/ads?position=top filters by position', async () => {
    const res = await app.request('/api/ads?position=top')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.length).toBe(1)
    expect(json[0].position).toBe('top')
  })

  it('GET /api/ads?position=sidebar filters by position', async () => {
    const res = await app.request('/api/ads?position=sidebar')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.length).toBe(1)
    expect(json[0].position).toBe('sidebar')
  })

  it('POST /api/ads creates an ad', async () => {
    const res = await app.request('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Ad', position: 'top' })
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.title).toBe('New Ad')
    expect(json.position).toBe('top')
    expect(json.id).toBeTruthy()
  })

  it('POST /api/ads rejects missing title', async () => {
    const res = await app.request('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: 'top' })
    })
    expect(res.status).toBe(400)
  })

  it('PATCH /api/ads/:id updates an ad', async () => {
    const created = await createAdRoute(app, { title: 'Old', position: 'top' })
    const res = await app.request(`/api/ads/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated', active: false })
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.title).toBe('Updated')
    expect(json.active).toBe(false)
  })

  it('PATCH /api/ads/:id returns 404 for missing ad', async () => {
    const res = await app.request('/api/ads/missing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'x' })
    })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/ads/:id removes an ad', async () => {
    const created = await createAdRoute(app, { title: 'Delete me', position: 'top' })
    const res = await app.request(`/api/ads/${created.id}`, { method: 'DELETE' })
    expect(res.status).toBe(204)
    expect(getAd(created.id)).toBeNull()
  })

  it('DELETE /api/ads/:id returns 404 for missing ad', async () => {
    const res = await app.request('/api/ads/missing', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})

async function createAdRoute(app, data) {
  const res = await app.request('/api/ads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}
