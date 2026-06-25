import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PostCard from '@/components/PostCard.vue'

beforeEach(() => {
  global.window.confirm = vi.fn(() => true)
})

function createPost(overrides = {}) {
  return {
    id: 'p1',
    author: '我',
    content: '今天天气不错 #晴天',
    mood: '😊',
    tags: ['晴天'],
    createdAt: new Date().toISOString(),
    media: [],
    likes: 5,
    likedByMe: false,
    comments: [],
    reposts: 0,
    isPinned: false,
    isRetracted: false,
    isHidden: false,
    isFavorited: false,
    ...overrides
  }
}

describe('PostCard', () => {
  it('renders post content and author', () => {
    const wrapper = mount(PostCard, {
      props: { post: createPost(), isMine: true, postAvatarUrl: '' }
    })
    expect(wrapper.text()).toContain('今天天气不错')
    expect(wrapper.text()).toContain('我')
  })

  it('renders tags and emits tag-click', async () => {
    const wrapper = mount(PostCard, {
      props: { post: createPost(), isMine: false, postAvatarUrl: '' }
    })
    const tag = wrapper.find('.post-tag')
    expect(tag.exists()).toBe(true)
    expect(tag.text()).toBe('#晴天')
    await tag.trigger('click')
    expect(wrapper.emitted('tag-click')).toHaveLength(1)
    expect(wrapper.emitted('tag-click')[0]).toEqual(['晴天'])
  })

  it('renders media gallery', () => {
    const wrapper = mount(PostCard, {
      props: {
        post: createPost({
          media: [{ fileId: 'img-1', type: 'image', url: 'blob:1' }]
        }),
        isMine: false,
        postAvatarUrl: ''
      }
    })
    expect(wrapper.find('img[alt=""]').exists()).toBe(true)
  })

  it('emits like when like button clicked', async () => {
    const wrapper = mount(PostCard, {
      props: { post: createPost(), isMine: false, postAvatarUrl: '' }
    })
    await wrapper.find('.action-like').trigger('click')
    expect(wrapper.emitted('like')).toHaveLength(1)
  })

  it('emits favorite when favorite button clicked and shows active state', async () => {
    const wrapper = mount(PostCard, {
      props: { post: createPost({ isFavorited: true }), isMine: false, postAvatarUrl: '' }
    })
    expect(wrapper.find('.action-favorite').classes()).toContain('active')
    expect(wrapper.find('.action-favorite').text()).toContain('已收藏')
    await wrapper.find('.action-favorite').trigger('click')
    expect(wrapper.emitted('favorite')).toHaveLength(1)
  })

  it('emits comment when comment button clicked', async () => {
    const wrapper = mount(PostCard, {
      props: { post: createPost(), isMine: false, postAvatarUrl: '' }
    })
    await wrapper.find('.action-comment').trigger('click')
    expect(wrapper.emitted('comment')).toHaveLength(1)
  })

  it('shows mine actions when isMine', () => {
    const wrapper = mount(PostCard, {
      props: { post: createPost(), isMine: true, postAvatarUrl: '' }
    })
    expect(wrapper.find('.action-edit').exists()).toBe(true)
    expect(wrapper.find('.action-delete').exists()).toBe(true)
  })

  it('does not show mine actions when not isMine', () => {
    const wrapper = mount(PostCard, {
      props: { post: createPost({ author: '别人' }), isMine: false, postAvatarUrl: '' }
    })
    expect(wrapper.find('.action-edit').exists()).toBe(false)
    expect(wrapper.find('.action-delete').exists()).toBe(false)
  })

  it('emits edit/delete/pin/retract/hide', async () => {
    const wrapper = mount(PostCard, {
      props: { post: createPost(), isMine: true, postAvatarUrl: '' }
    })
    await wrapper.find('.action-edit').trigger('click')
    await wrapper.find('.action-delete').trigger('click')
    await wrapper.find('.action-pin').trigger('click')
    await wrapper.find('.action-retract').trigger('click')
    await wrapper.find('.action-hide').trigger('click')
    expect(wrapper.emitted('edit')).toHaveLength(1)
    expect(wrapper.emitted('delete')).toHaveLength(1)
    expect(wrapper.emitted('pin')).toHaveLength(1)
    expect(wrapper.emitted('retract')).toHaveLength(1)
    expect(wrapper.emitted('hide')).toHaveLength(1)
  })

  it('emits add-comment from comment section', async () => {
    global.window.confirm = vi.fn(() => true)
    const wrapper = mount(PostCard, {
      props: { post: createPost(), isMine: false, postAvatarUrl: '', commentsExpanded: true }
    })
    await wrapper.find('.comment-input').setValue('好棒')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.emitted('add-comment')).toHaveLength(1)
    expect(wrapper.emitted('add-comment')[0]).toEqual(['好棒'])
  })

  it('disables actions when post is retracted', () => {
    const wrapper = mount(PostCard, {
      props: { post: createPost({ isRetracted: true }), isMine: false, postAvatarUrl: '' }
    })
    expect(wrapper.find('.action-like').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.action-comment').attributes('disabled')).toBeDefined()
  })
})
