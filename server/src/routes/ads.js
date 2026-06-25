import { Hono } from 'hono'
import { listAds, getAd, createAd, updateAd, deleteAd } from '../store/adStore.js'

const ads = new Hono()

ads.get('/', (c) => {
  const position = c.req.query('position')
  return c.json(listAds(position))
})

ads.post('/', async (c) => {
  const body = await c.req.json()
  if (!body.title || body.title.trim() === '') {
    return c.json({ error: 'title is required' }, 400)
  }
  const ad = createAd(body)
  return c.json(ad, 201)
})

ads.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const ad = updateAd(id, body)
  if (!ad) return c.json({ error: 'ad not found' }, 404)
  return c.json(ad)
})

ads.delete('/:id', (c) => {
  const id = c.req.param('id')
  const removed = deleteAd(id)
  if (!removed) return c.json({ error: 'ad not found' }, 404)
  return c.body(null, 204)
})

export default ads
