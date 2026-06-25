import { describe, it, expect, beforeEach } from 'vitest'
import {
  listAds,
  getAd,
  createAd,
  updateAd,
  deleteAd,
  resetAds
} from '../src/store/adStore.js'

describe('adStore', () => {
  beforeEach(() => {
    resetAds()
  })

  it('seeds two ads on reset', () => {
    const all = listAds()
    expect(all).toHaveLength(2)
    expect(all.some(ad => ad.position === 'top')).toBe(true)
    expect(all.some(ad => ad.position === 'sidebar')).toBe(true)
  })

  it('lists ads filtered by position', () => {
    const topAds = listAds('top')
    expect(topAds).toHaveLength(1)
    expect(topAds[0].position).toBe('top')

    const sidebarAds = listAds('sidebar')
    expect(sidebarAds).toHaveLength(1)
    expect(sidebarAds[0].position).toBe('sidebar')
  })

  it('filters inactive ads from list', () => {
    const ad = createAd({ title: 'Inactive', position: 'top', active: false })
    expect(listAds('top')).not.toContainEqual(expect.objectContaining({ id: ad.id }))
    expect(getAd(ad.id).active).toBe(false)
  })

  it('sorts ads by order', () => {
    createAd({ title: 'Second', position: 'top', order: 2 })
    createAd({ title: 'First', position: 'top', order: 1 })
    const topAds = listAds('top')
    const orders = topAds.map(ad => ad.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('gets ad by id', () => {
    const ad = createAd({ title: 'Find me' })
    expect(getAd(ad.id).title).toBe('Find me')
    expect(getAd('missing')).toBeNull()
  })

  it('creates ad with defaults', () => {
    const ad = createAd({ title: 'New Ad' })
    expect(ad.title).toBe('New Ad')
    expect(ad.position).toBe('top')
    expect(ad.active).toBe(true)
    expect(ad.order).toBe(0)
    expect(ad.createdAt).toBeTruthy()
    expect(ad.id).toBeTruthy()
  })

  it('updates ad fields', () => {
    const ad = createAd({ title: 'Old' })
    const updated = updateAd(ad.id, { title: 'New', position: 'sidebar', active: false, order: 5 })
    expect(updated.title).toBe('New')
    expect(updated.position).toBe('sidebar')
    expect(updated.active).toBe(false)
    expect(updated.order).toBe(5)
  })

  it('returns null when updating missing ad', () => {
    expect(updateAd('missing', { title: 'x' })).toBeNull()
  })

  it('deletes ad', () => {
    const ad = createAd({ title: 'Delete me' })
    expect(deleteAd(ad.id)).toBe(true)
    expect(getAd(ad.id)).toBeNull()
  })

  it('returns false when deleting missing ad', () => {
    expect(deleteAd('missing')).toBe(false)
  })
})
