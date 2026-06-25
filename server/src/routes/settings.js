import { Hono } from 'hono'
import { getSettings, updateSettings } from '../store/settingsStore.js'

const settings = new Hono()

settings.get('/', (c) => {
  return c.json(getSettings())
})

settings.patch('/', async (c) => {
  const body = await c.req.json()
  const updates = {}
  if (body.theme !== undefined) updates.theme = body.theme
  if (body.bgInterval !== undefined) updates.bgInterval = body.bgInterval
  return c.json(updateSettings(updates))
})

export default settings
