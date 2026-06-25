import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ComposePanel from '@/components/ComposePanel.vue'

const MAX_LENGTH = 140
const moods = ['', '😊', '😂', '🤔', '👍', '❤️', '🎉', '😴', '😭']

describe('ComposePanel', () => {
  it('renders textarea and character count', () => {
    const wrapper = mount(ComposePanel, {
      props: { content: '', mood: '', media: [], maxLength: MAX_LENGTH }
    })
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('.compose-count').text()).toBe(`0/${MAX_LENGTH}`)
  })

  it('emits update:content when typing', async () => {
    const wrapper = mount(ComposePanel, {
      props: { content: '', mood: '', media: [], maxLength: MAX_LENGTH }
    })
    await wrapper.find('textarea').setValue('hello')
    expect(wrapper.emitted('update:content')).toHaveLength(1)
    expect(wrapper.emitted('update:content')[0]).toEqual(['hello'])
  })

  it('selects mood', async () => {
    const wrapper = mount(ComposePanel, {
      props: { content: '', mood: '', media: [], maxLength: MAX_LENGTH }
    })
    const buttons = wrapper.findAll('.mood-item')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:mood')).toHaveLength(1)
    expect(wrapper.emitted('update:mood')[0]).toEqual(['😊'])
  })

  it('disables publish when empty', () => {
    const wrapper = mount(ComposePanel, {
      props: { content: '', mood: '', media: [], maxLength: MAX_LENGTH }
    })
    expect(wrapper.find('.compose-submit').attributes('disabled')).toBeDefined()
  })

  it('enables publish when content exists', () => {
    const wrapper = mount(ComposePanel, {
      props: { content: 'hello', mood: '', media: [], maxLength: MAX_LENGTH }
    })
    expect(wrapper.find('.compose-submit').attributes('disabled')).toBeUndefined()
  })

  it('disables publish when over limit', () => {
    const wrapper = mount(ComposePanel, {
      props: { content: 'x'.repeat(141), mood: '', media: [], maxLength: MAX_LENGTH }
    })
    expect(wrapper.find('.compose-submit').attributes('disabled')).toBeDefined()
  })

  it('emits add-image when image button clicked', async () => {
    const wrapper = mount(ComposePanel, {
      props: { content: '', mood: '', media: [], maxLength: MAX_LENGTH }
    })
    await wrapper.find('.tool-image').trigger('click')
    expect(wrapper.emitted('add-image')).toHaveLength(1)
  })

  it('emits add-video when video button clicked', async () => {
    const wrapper = mount(ComposePanel, {
      props: { content: '', mood: '', media: [], maxLength: MAX_LENGTH }
    })
    await wrapper.find('.tool-video').trigger('click')
    expect(wrapper.emitted('add-video')).toHaveLength(1)
  })

  it('renders media previews and emits remove-media', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:preview')
    const wrapper = mount(ComposePanel, {
      props: {
        content: '',
        mood: '',
        media: [{ fileId: 'img-1', type: 'image', url: 'blob:preview', name: 'a.jpg' }],
        maxLength: MAX_LENGTH
      }
    })
    expect(wrapper.findAll('.media-preview-item').length).toBe(1)
    await wrapper.find('.media-remove').trigger('click')
    expect(wrapper.emitted('remove-media')).toHaveLength(1)
    expect(wrapper.emitted('remove-media')[0]).toEqual([0])
  })

  it('shows save text when editing', () => {
    const wrapper = mount(ComposePanel, {
      props: { content: 'edit', mood: '', media: [], maxLength: MAX_LENGTH, editing: true }
    })
    expect(wrapper.find('.compose-submit').text()).toBe('保存')
  })
})
