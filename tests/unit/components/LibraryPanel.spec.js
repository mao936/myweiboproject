import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LibraryPanel from '@/components/LibraryPanel.vue'

beforeEach(() => {
  global.window.confirm = vi.fn(() => true)
})

describe('LibraryPanel', () => {
  it('renders empty message when no items', () => {
    const wrapper = mount(LibraryPanel, {
      props: { items: [] }
    })
    expect(wrapper.text()).toContain('暂无媒体文件')
  })

  it('renders media items', () => {
    const wrapper = mount(LibraryPanel, {
      props: {
        items: [
          { id: 'img-1', type: 'image', name: 'a.jpg', size: 1024, url: 'blob:1' },
          { id: 'vid-1', type: 'video', name: 'b.mp4', size: 2048, url: 'blob:2' }
        ]
      }
    })
    expect(wrapper.findAll('.library-item').length).toBe(2)
    expect(wrapper.text()).toContain('a.jpg')
  })

  it('emits delete with item id', async () => {
    const wrapper = mount(LibraryPanel, {
      props: {
        items: [{ id: 'img-1', type: 'image', name: 'a.jpg', size: 1024, url: 'blob:1' }]
      }
    })
    await wrapper.find('.library-remove').trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
    expect(wrapper.emitted('delete')[0]).toEqual(['img-1'])
  })
})
