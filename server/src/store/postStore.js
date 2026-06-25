import { generateId } from '../utils/id.js'
import { extractTags } from '../utils/extractTags.js'
import { getMedia } from './mediaStore.js'

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3000'

let posts = []

export function resetPosts() {
  posts = []
}

function toMediaUrl(id) {
  return id ? `${SERVER_BASE_URL}/api/media/${id}` : null
}

function toCoverUrl(mediaItem) {
  return mediaItem?.coverId ? `${SERVER_BASE_URL}/api/media/${mediaItem.id}/cover` : null
}

export function enrichPost(post) {
  const avatarUrl = toMediaUrl(post.avatarFileId)
  const media = (post.media || []).map(item => {
    const mediaRecord = getMedia(item.id || item.fileId)
    return {
      id: item.id || item.fileId,
      type: item.type,
      url: toMediaUrl(item.id || item.fileId),
      coverUrl: toCoverUrl(mediaRecord),
      duration: mediaRecord?.duration ?? null
    }
  })
  return { ...post, avatarUrl, media }
}

export function listPosts(query = '') {
  const q = query.trim().toLowerCase()
  let result = posts.filter(p => !p.isHidden)

  if (q) {
    result = result.filter(p =>
      p.content.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      (p.tags || []).some(tag => tag.toLowerCase().includes(q))
    )
  }

  return result.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}

export function getPost(id) {
  return posts.find(p => p.id === id) || null
}

export function createPost({ content, mood = '', media = [], author, avatarFileId }) {
  const post = {
    id: generateId(),
    author,
    avatarFileId,
    content,
    mood,
    tags: extractTags(content),
    createdAt: new Date().toISOString(),
    media,
    likes: 0,
    likedByMe: false,
    comments: [],
    reposts: 0,
    isPinned: false,
    isRetracted: false,
    isHidden: false
  }
  posts.unshift(post)
  return post
}

export function updatePost(id, { content, mood }) {
  const post = getPost(id)
  if (!post) return null
  if (content !== undefined) {
    post.content = content
    post.tags = extractTags(content)
  }
  if (mood !== undefined) {
    post.mood = mood
  }
  return post
}

export function deletePost(id) {
  const index = posts.findIndex(p => p.id === id)
  if (index === -1) return false
  posts.splice(index, 1)
  return true
}

export function pinPost(id) {
  const post = getPost(id)
  if (!post) return null
  posts.forEach(p => { p.isPinned = false })
  post.isPinned = true
  return post
}

export function unpinPost(id) {
  const post = getPost(id)
  if (!post) return null
  post.isPinned = false
  return post
}

export function toggleLike(id) {
  const post = getPost(id)
  if (!post || post.isRetracted) return null
  post.likedByMe = !post.likedByMe
  post.likes += post.likedByMe ? 1 : -1
  return post
}

export function toggleRetract(id) {
  const post = getPost(id)
  if (!post) return null
  post.isRetracted = !post.isRetracted
  return post
}

export function hidePost(id) {
  const post = getPost(id)
  if (!post) return null
  post.isHidden = true
  return post
}

export function showPost(id) {
  const post = getPost(id)
  if (!post) return null
  post.isHidden = false
  return post
}

export function addComment(id, content) {
  const post = getPost(id)
  if (!post || post.isRetracted) return null
  const comment = {
    id: generateId(),
    author: '路人甲',
    content,
    createdAt: new Date().toISOString()
  }
  post.comments.push(comment)
  return comment
}
