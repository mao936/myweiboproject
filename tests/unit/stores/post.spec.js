import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePostStore } from '@/stores/post'
import { useUserStore } from '@/stores/user'
import { get, patch, post, del } from '@/api/client'

vi.mock('@/api/client', () => import('@/api/__mocks__/client'))

function createPostResponse(overrides = {}) {
  return {
    id: `post-${Math.random().toString(36).slice(2)}`,
    author: '我',
    avatarUrl: null,
    content: '测试内容',
    mood: '😊',
    tags: [],
    createdAt: new Date().toISOString(),
    media: [],
    likes: 0,
    likedByMe: false,
    comments: [],
    isPinned: false,
    isRetracted: false,
    isHidden: false,
    isFavorited: false,
    ...overrides
  }
}

describe('post store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    get.mockResolvedValue([])
  })

  async function initStore(posts = []) {
    const store = usePostStore()
    get.mockResolvedValue(posts)
    await store.refresh()
    return store
  }

  it('should load posts on refresh', async () => {
    const store = await initStore([createPostResponse({ content: '第一条简讯' })])
    expect(store.filteredPosts.length).toBe(1)
    expect(store.filteredPosts[0].content).toBe('第一条简讯')
  })

  it('should add a post', async () => {
    const store = usePostStore()
    const created = createPostResponse({ content: '第一条简讯' })
    post.mockResolvedValue(created)
    await store.refresh()
    const postResult = await store.addPost({ content: '第一条简讯', mood: '😊', media: [] })
    expect(post).toHaveBeenCalledWith('/posts', { content: '第一条简讯', mood: '😊', media: [] })
    expect(postResult.content).toBe('第一条简讯')
    expect(store.filteredPosts.length).toBe(1)
  })

  it('should edit a post', async () => {
    const created = createPostResponse({ content: '旧内容' })
    const store = await initStore([created])
    const updated = { ...created, content: '新内容', mood: '🤔' }
    patch.mockResolvedValue(updated)
    await store.editPost(created.id, { content: '新内容', mood: '🤔' })
    expect(patch).toHaveBeenCalledWith(`/posts/${created.id}`, { content: '新内容', mood: '🤔' })
    expect(store.filteredPosts[0].content).toBe('新内容')
    expect(store.filteredPosts[0].mood).toBe('🤔')
  })

  it('should delete a post', async () => {
    const created = createPostResponse()
    const store = await initStore([created])
    del.mockResolvedValue({})
    await store.deletePost(created.id)
    expect(del).toHaveBeenCalledWith(`/posts/${created.id}`)
    expect(store.filteredPosts.length).toBe(0)
  })

  it('should pin and unpin a post', async () => {
    const post1 = createPostResponse({ content: 'post1' })
    const post2 = createPostResponse({ content: 'post2' })
    const store = await initStore([post1, post2])

    post.mockResolvedValue({ ...post2, isPinned: true })
    await store.pinPost(post2.id)
    expect(post).toHaveBeenCalledWith(`/posts/${post2.id}/pin`)
    expect(store.filteredPosts.find(p => p.id === post2.id).isPinned).toBe(true)

    del.mockResolvedValue({ ...post2, isPinned: false })
    await store.unpinPost(post2.id)
    expect(del).toHaveBeenCalledWith(`/posts/${post2.id}/pin`)
    expect(store.filteredPosts.find(p => p.id === post2.id).isPinned).toBe(false)
  })

  it('should retract and restore a post', async () => {
    const created = createPostResponse()
    const store = await initStore([created])

    post.mockResolvedValue({ ...created, isRetracted: true })
    await store.retractPost(created.id)
    expect(store.filteredPosts[0].isRetracted).toBe(true)

    post.mockResolvedValue({ ...created, isRetracted: false })
    await store.retractPost(created.id)
    expect(store.filteredPosts[0].isRetracted).toBe(false)
  })

  it('should hide and show a post', async () => {
    const created = createPostResponse()
    const store = await initStore([created])

    post.mockResolvedValue({ ...created, isHidden: true })
    await store.hidePost(created.id)
    expect(store.filteredPosts.length).toBe(0)

    del.mockResolvedValue({ ...created, isHidden: false })
    await store.showPost(created.id)
    expect(store.filteredPosts.length).toBe(1)
  })

  it('should like and unlike a post', async () => {
    const created = createPostResponse()
    const store = await initStore([created])

    post.mockResolvedValue({ ...created, likes: 1, likedByMe: true })
    await store.likePost(created.id)
    expect(store.filteredPosts[0].likes).toBe(1)
    expect(store.filteredPosts[0].likedByMe).toBe(true)

    post.mockResolvedValue({ ...created, likes: 0, likedByMe: false })
    await store.likePost(created.id)
    expect(store.filteredPosts[0].likes).toBe(0)
    expect(store.filteredPosts[0].likedByMe).toBe(false)
  })

  it('should toggle favorite on a post', async () => {
    const created = createPostResponse()
    const store = await initStore([created])

    post.mockResolvedValue({ ...created, isFavorited: true })
    await store.toggleFavorite(created.id)
    expect(post).toHaveBeenCalledWith(`/posts/${created.id}/favorite`)
    expect(store.filteredPosts[0].isFavorited).toBe(true)

    post.mockResolvedValue({ ...created, isFavorited: false })
    await store.toggleFavorite(created.id)
    expect(store.filteredPosts[0].isFavorited).toBe(false)
  })

  it('should not like a retracted post', async () => {
    const created = createPostResponse({ isRetracted: true })
    const store = await initStore([created])
    await store.likePost(created.id)
    expect(post).not.toHaveBeenCalled()
  })

  it('should add comment to a post', async () => {
    const created = createPostResponse()
    const store = await initStore([created])
    const updated = { ...created, comments: [{ id: 'c1', author: '路人甲', content: '评论内容', createdAt: new Date().toISOString() }] }
    post.mockResolvedValue(updated)
    await store.addComment(created.id, '评论内容')
    expect(post).toHaveBeenCalledWith(`/posts/${created.id}/comments`, { content: '评论内容' })
    expect(store.filteredPosts[0].comments.length).toBe(1)
    expect(store.filteredPosts[0].comments[0].content).toBe('评论内容')
  })

  it('should filter posts by search query', async () => {
    const store = usePostStore()
    get.mockResolvedValue([
      createPostResponse({ content: '关于 Vue 的内容' }),
      createPostResponse({ content: '关于 React 的内容' })
    ])
    await store.search('Vue')
    expect(get).toHaveBeenCalledWith('/posts?q=Vue')
    expect(store.filteredPosts.length).toBe(2)
  })

  it('should sort pinned posts first', async () => {
    const post1 = createPostResponse({ content: '普通' })
    const post2 = createPostResponse({ content: '置顶', isPinned: true })
    const store = await initStore([post1, post2])
    expect(store.filteredPosts[0].content).toBe('置顶')
  })

  it('should extract tags when adding a post', async () => {
    const store = usePostStore()
    const created = createPostResponse({ content: '学习#vue 真不错', tags: ['vue'] })
    post.mockResolvedValue(created)
    await store.refresh()
    const postResult = await store.addPost({ content: '学习#vue 真不错' })
    expect(postResult.tags).toContain('vue')
  })

  it('should use current user name as author', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    get.mockResolvedValue({ name: '小明', avatarFileId: null, avatarUrl: null })
    const userStore = useUserStore()
    await userStore.loadUser()

    get.mockResolvedValue([])
    const postStore = usePostStore()
    await postStore.refresh()
    const created = createPostResponse({ author: '小明', content: '测试' })
    post.mockResolvedValue(created)
    const result = await postStore.addPost({ content: '测试' })
    expect(result.author).toBe('小明')
  })
})
