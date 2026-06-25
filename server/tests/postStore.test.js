import { describe, it, expect, beforeEach } from 'vitest'
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
  resetPosts
} from '../src/store/postStore.js'

describe('postStore', () => {
  beforeEach(() => {
    resetPosts()
  })

  it('returns empty posts by default', () => {
    expect(listPosts()).toEqual([])
  })

  it('creates a post with extracted tags', () => {
    const post = createPost({
      content: '今天天气不错 #天气',
      mood: '开心',
      author: '我',
      avatarFileId: null
    })
    expect(post.content).toBe('今天天气不错 #天气')
    expect(post.mood).toBe('开心')
    expect(post.tags).toContain('天气')
    expect(post.tags).toContain('今天')
    expect(post.likes).toBe(0)
    expect(post.likedByMe).toBe(false)
    expect(post.comments).toEqual([])
    expect(post.isPinned).toBe(false)
  })

  it('gets a single post', () => {
    const post = createPost({ content: 'hello', author: '我', avatarFileId: null })
    expect(getPost(post.id).content).toBe('hello')
    expect(getPost('missing')).toBeNull()
  })

  it('updates a post', () => {
    const post = createPost({ content: 'old', mood: 'sad', author: '我', avatarFileId: null })
    updatePost(post.id, { content: 'new #updated', mood: 'happy' })
    const updated = getPost(post.id)
    expect(updated.content).toBe('new #updated')
    expect(updated.mood).toBe('happy')
    expect(updated.tags).toContain('updated')
  })

  it('deletes a post', () => {
    const post = createPost({ content: 'bye', author: '我', avatarFileId: null })
    deletePost(post.id)
    expect(getPost(post.id)).toBeNull()
  })

  it('pins and unpins posts', () => {
    const a = createPost({ content: 'a', author: '我', avatarFileId: null })
    const b = createPost({ content: 'b', author: '我', avatarFileId: null })
    pinPost(a.id)
    expect(getPost(a.id).isPinned).toBe(true)
    expect(getPost(b.id).isPinned).toBe(false)
    pinPost(b.id)
    expect(getPost(a.id).isPinned).toBe(false)
    expect(getPost(b.id).isPinned).toBe(true)
    unpinPost(b.id)
    expect(getPost(b.id).isPinned).toBe(false)
  })

  it('toggles like', () => {
    const post = createPost({ content: 'like me', author: '我', avatarFileId: null })
    toggleLike(post.id)
    expect(getPost(post.id).likedByMe).toBe(true)
    expect(getPost(post.id).likes).toBe(1)
    toggleLike(post.id)
    expect(getPost(post.id).likedByMe).toBe(false)
    expect(getPost(post.id).likes).toBe(0)
  })

  it('toggles retract', () => {
    const post = createPost({ content: 'oops', author: '我', avatarFileId: null })
    toggleRetract(post.id)
    expect(getPost(post.id).isRetracted).toBe(true)
    toggleRetract(post.id)
    expect(getPost(post.id).isRetracted).toBe(false)
  })

  it('hides and shows post', () => {
    const post = createPost({ content: 'hide me', author: '我', avatarFileId: null })
    hidePost(post.id)
    expect(getPost(post.id).isHidden).toBe(true)
    showPost(post.id)
    expect(getPost(post.id).isHidden).toBe(false)
  })

  it('adds comment', () => {
    const post = createPost({ content: 'comment me', author: '我', avatarFileId: null })
    addComment(post.id, 'nice')
    const comments = getPost(post.id).comments
    expect(comments).toHaveLength(1)
    expect(comments[0].author).toBe('路人甲')
    expect(comments[0].content).toBe('nice')
  })

  it('lists posts sorted by pin then date', () => {
    const old = createPost({ content: 'old', author: '我', avatarFileId: null })
    const recent = createPost({ content: 'recent', author: '我', avatarFileId: null })
    pinPost(old.id)
    const result = listPosts()
    expect(result[0].id).toBe(old.id)
    expect(result[1].id).toBe(recent.id)
  })

  it('searches posts by content, author or tags', () => {
    createPost({ content: 'hello world', author: '我', avatarFileId: null })
    createPost({ content: 'foo bar', author: '小明', avatarFileId: null })
    createPost({ content: 'tag test #special', author: '我', avatarFileId: null })
    expect(listPosts('hello')).toHaveLength(1)
    expect(listPosts('小明')).toHaveLength(1)
    expect(listPosts('special')).toHaveLength(1)
    expect(listPosts('zzz')).toHaveLength(0)
  })

  it('excludes hidden posts from search and list', () => {
    const post = createPost({ content: 'hidden', author: '我', avatarFileId: null })
    hidePost(post.id)
    expect(listPosts()).toHaveLength(0)
    expect(listPosts('hidden')).toHaveLength(0)
  })
})
