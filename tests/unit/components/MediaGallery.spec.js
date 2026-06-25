import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MediaGallery from '@/components/MediaGallery.vue'

describe('MediaGallery', () => {
  it('renders nothing when media is empty', () => {
    const wrapper = mount(MediaGallery, {
      props: { media: [] }
    })
    expect(wrapper.find('.post-media').exists()).toBe(false)
  })

  it('renders image items', () => {
    const wrapper = mount(MediaGallery, {
      props: {
        media: [
          { fileId: 'img-1', type: 'image', url: 'blob:1' },
          { fileId: 'img-2', type: 'image', url: 'blob:2' }
        ]
      }
    })
    const images = wrapper.findAll('img')
    expect(images.length).toBe(2)
    expect(images[0].attributes('src')).toBe('blob:1')
  })

  it('renders video item', () => {
    const wrapper = mount(MediaGallery, {
      props: {
        media: [{ fileId: 'vid-1', type: 'video', url: 'blob:video' }]
      }
    })
    const video = wrapper.find('video')
    expect(video.exists()).toBe(true)
    expect(video.attributes('src')).toBe('blob:video')
  })

  it('applies grid class based on media count', () => {
    const wrapper = mount(MediaGallery, {
      props: {
        media: [
          { fileId: 'img-1', type: 'image', url: 'blob:1' },
          { fileId: 'img-2', type: 'image', url: 'blob:2' },
          { fileId: 'img-3', type: 'image', url: 'blob:3' }
        ]
      }
    })
    expect(wrapper.find('.post-media').classes()).toContain('grid-3')
  })
})
