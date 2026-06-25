import { Hono } from 'hono'
import { getUser, updateUser, setAvatar, removeAvatar, getFavorites, addFavorite, removeFavorite } from '../store/userStore.js'
import { saveMedia, getMediaData, getMedia } from '../store/mediaStore.js'
import { getPost } from '../store/postStore.js'
import { generateId } from '../utils/id.js'

const me = new Hono()

me.get('/', (c) => {
  return c.json(getUser())
})

me.patch('/', async (c) => {
  const body = await c.req.json()
  if (body.name === undefined || body.name.trim() === '') {
    return c.json({ error: 'name is required' }, 400)
  }
  return c.json(updateUser({ name: body.name.trim() }))
})

me.post('/avatar', async (c) => {
  const form = await c.req.formData()
  const file = form.get('avatar')
  if (!file || typeof file === 'string') {
    return c.json({ error: 'avatar file is required' }, 400)
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileId = generateId()
  saveMedia({
    id: fileId,
    data: buffer,
    type: 'image',
    name: file.name,
    size: file.size
  })
  return c.json(setAvatar(fileId))
})

me.delete('/avatar', (c) => {
  const user = getUser()
  if (user.avatarFileId) {
    removeAvatar()
  }
  return c.json(getUser())
})

me.get('/favorites', (c) => {
  return c.json(getFavorites())
})

me.post('/favorites/:postId', (c) => {
  const postId = c.req.param('postId')
  if (!getPost(postId)) {
    return c.json({ error: 'post not found' }, 404)
  }
  return c.json(addFavorite(postId), 201)
})

me.delete('/favorites/:postId', (c) => {
  const postId = c.req.param('postId')
  return c.json(removeFavorite(postId))
})

export default me
