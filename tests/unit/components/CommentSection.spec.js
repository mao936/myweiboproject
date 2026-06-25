import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CommentSection from '@/components/CommentSection.vue'

describe('CommentSection', () => {
  it('renders comments when expanded', () => {
    const wrapper = mount(CommentSection, {
      props: {
        comments: [
          { id: 'c1', author: '路人甲', content: '不错', createdAt: new Date().toISOString() }
        ],
        expanded: true
      }
    })
    expect(wrapper.find('.comment-item').exists()).toBe(true)
    expect(wrapper.text()).toContain('路人甲')
    expect(wrapper.text()).toContain('不错')
  })

  it('shows empty message when no comments', () => {
    const wrapper = mount(CommentSection, {
      props: { comments: [], expanded: true }
    })
    expect(wrapper.text()).toContain('暂无评论')
  })

  it('is hidden when not expanded', () => {
    const wrapper = mount(CommentSection, {
      props: { comments: [], expanded: false }
    })
    expect(wrapper.find('.comments').exists()).toBe(false)
  })

  it('emits submit with comment content', async () => {
    const wrapper = mount(CommentSection, {
      props: { comments: [], expanded: true }
    })
    await wrapper.find('.comment-input').setValue('好棒')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')[0]).toEqual(['好棒'])
  })

  it('does not submit empty comment', async () => {
    const wrapper = mount(CommentSection, {
      props: { comments: [], expanded: true }
    })
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })
})
