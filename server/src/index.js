import { Hono } from 'hono'
import { cors } from 'hono/cors'
import me from './routes/me.js'
import posts from './routes/posts.js'
import media from './routes/media.js'
import settings from './routes/settings.js'
import ads from './routes/ads.js'
import './store/index.js'

const app = new Hono()

app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true
}))

app.route('/api/me', me)
app.route('/api/posts', posts)
app.route('/api/media', media)
app.route('/api/settings', settings)
app.route('/api/ads', ads)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'internal server error' }, 500)
})

app.get('/health', (c) => c.json({ ok: true }))

export default app

if (process.env.NODE_ENV !== 'test') {
  const { serve } = await import('@hono/node-server')
  const port = Number(process.env.PORT) || 3000
  serve({ fetch: app.fetch, port })
  console.log(`Server running on http://localhost:${port}`)
}
