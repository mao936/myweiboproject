import { Hono } from 'hono'
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  pinPost,
  unpinPost,
  toggleLike,
  toggleRetract,
  hidePost,
  showPost,
  addComment,
  enrichPost
} from '../store/postStore.js'
import { getUser } from '../store/userStore.js'

const posts = new Hono()

posts.get('/', (c) => {
  const q = c.req.query('q') || ''
  return c.json(listPosts(q).map(enrichPost))
})

posts.get('/:id', (c) => {
  const id = c.req.param('id')
  const post = getPost(id)
  if (!post) return c.json({ error: 'post not found' }, 404)
  return c.json(enrichPost(post))
})

posts.post('/', async (c) => {
  const body = await c.req.json()
  if (!body.content || body.content.trim() === '') {
    return c.json({ error: 'content is required' }, 400)
  }
  const user = getUser()
  const post = createPost({
    content: body.content.trim(),
    mood: body.mood || '',
    media: body.media || [],
    author: user.name,
    avatarFileId: user.avatarFileId
  })
  return c.json(enrichPost(post), 201)
})

posts.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const post = updatePost(id, { content: body.content, mood: body.mood })
  if (!post) return c.json({ error: 'post not found' }, 404)
  return c.json(enrichPost(post))
})

posts.delete('/:id', (c) => {
  const id = c.req.param('id')
  const removed = deletePost(id)
  if (!removed) return c.json({ error: 'post not found' }, 404)
  return c.body(null, 204)
})

posts.post('/:id/pin', (c) => {
  const id = c.req.param('id')
  const post = pinPost(id)
  if (!post) return c.json({ error: 'post not found' }, 404)
  return c.json(enrichPost(post))
})

posts.delete('/:id/pin', (c) => {
  const id = c.req.param('id')
  const post = unpinPost(id)
  if (!post) return c.json({ error: 'post not found' }, 404)
  return c.json(enrichPost(post))
})

posts.post('/:id/like', (c) => {
  const id = c.req.param('id')
  const post = toggleLike(id)
  if (!post) return c.json({ error: 'post not found or retracted' }, 404)
  return c.json(enrichPost(post))
})

posts.post('/:id/retract', (c) => {
  const id = c.req.param('id')
  const post = toggleRetract(id)
  if (!post) return c.json({ error: 'post not found' }, 404)
  return c.json(enrichPost(post))
})

posts.post('/:id/hide', (c) => {
  const id = c.req.param('id')
  const post = hidePost(id)
  if (!post) return c.json({ error: 'post not found' }, 404)
  return c.json(enrichPost(post))
})

posts.delete('/:id/hide', (c) => {
  const id = c.req.param('id')
  const post = showPost(id)
  if (!post) return c.json({ error: 'post not found' }, 404)
  return c.json(enrichPost(post))
})

posts.post('/:id/comments', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  if (!body.content || body.content.trim() === '') {
    return c.json({ error: 'content is required' }, 400)
  }
  const comment = addComment(id, body.content.trim())
  if (!comment) return c.json({ error: 'post not found or retracted' }, 404)
  return c.json(enrichPost(getPost(id)), 201)
})

export default posts
