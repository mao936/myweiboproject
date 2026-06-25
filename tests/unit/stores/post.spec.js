import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePostStore } from '@/stores/post'
import { useUserStore } from '@/stores/user'

describe('post store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  function createPost(store, overrides = {}) {
    return store.addPost({
      content: '测试内容',
      mood: '😊',
      media: [],
      ...overrides
    })
  }

  it('should add a post', () => {
    const store = usePostStore()
    const post = createPost(store, { content: '第一条简讯' })
    expect(store.posts.length).toBe(1)
    expect(post.content).toBe('第一条简讯')
    expect(post.author).toBe('我')
  })

  it('should edit a post', () => {
    const store = usePostStore()
    const post = createPost(store, { content: '旧内容' })
    store.editPost(post.id, { content: '新内容', mood: '🤔' })
    expect(store.posts[0].content).toBe('新内容')
    expect(store.posts[0].mood).toBe('🤔')
  })

  it('should delete a post', () => {
    const store = usePostStore()
    const post = createPost(store)
    store.deletePost(post.id)
    expect(store.posts.length).toBe(0)
  })

  it('should pin and unpin a post', () => {
    const store = usePostStore()
    const post1 = createPost(store, { content: 'post1' })
    const post2 = createPost(store, { content: 'post2' })

    store.pinPost(post2.id)
    expect(store.posts.find(p => p.id === post2.id).isPinned).toBe(true)
    expect(store.posts.find(p => p.id === post1.id).isPinned).toBe(false)

    store.unpinPost(post2.id)
    expect(store.posts.find(p => p.id === post2.id).isPinned).toBe(false)
  })

  it('should retract and restore a post', () => {
    const store = usePostStore()
    const post = createPost(store)
    store.retractPost(post.id)
    expect(store.posts[0].isRetracted).toBe(true)
    store.retractPost(post.id)
    expect(store.posts[0].isRetracted).toBe(false)
  })

  it('should hide and show a post', () => {
    const store = usePostStore()
    const post = createPost(store)
    store.hidePost(post.id)
    expect(store.posts[0].isHidden).toBe(true)
    expect(store.filteredPosts.length).toBe(0)
    store.showPost(post.id)
    expect(store.posts[0].isHidden).toBe(false)
    expect(store.filteredPosts.length).toBe(1)
  })

  it('should like and unlike a post', () => {
    const store = usePostStore()
    const post = createPost(store)
    store.likePost(post.id)
    expect(store.posts[0].likes).toBe(1)
    expect(store.posts[0].likedByMe).toBe(true)
    store.likePost(post.id)
    expect(store.posts[0].likes).toBe(0)
    expect(store.posts[0].likedByMe).toBe(false)
  })

  it('should not like a retracted post', () => {
    const store = usePostStore()
    const post = createPost(store)
    store.retractPost(post.id)
    store.likePost(post.id)
    expect(store.posts[0].likes).toBe(0)
  })

  it('should add comment to a post', () => {
    const store = usePostStore()
    const post = createPost(store)
    store.addComment(post.id, '评论内容')
    expect(store.posts[0].comments.length).toBe(1)
    expect(store.posts[0].comments[0].content).toBe('评论内容')
  })

  it('should filter posts by search query', () => {
    const store = usePostStore()
    createPost(store, { content: '关于 Vue 的内容' })
    createPost(store, { content: '关于 React 的内容' })
    store.search('Vue')
    expect(store.filteredPosts.length).toBe(1)
    expect(store.filteredPosts[0].content).toContain('Vue')
  })

  it('should sort pinned posts first', () => {
    const store = usePostStore()
    const post1 = createPost(store, { content: '普通' })
    createPost(store, { content: '置顶' })
    store.pinPost(post1.id)
    expect(store.filteredPosts[0].content).toBe('普通')
  })

  it('should extract tags when adding a post', () => {
    const store = usePostStore()
    const post = createPost(store, { content: '学习#vue 真不错' })
    expect(post.tags).toContain('vue')
  })

  it('should use current user name as author', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const userStore = useUserStore()
    userStore.updateName('小明')

    const postStore = usePostStore()
    const post = postStore.addPost({ content: '测试' })
    expect(post.author).toBe('小明')
  })
})
