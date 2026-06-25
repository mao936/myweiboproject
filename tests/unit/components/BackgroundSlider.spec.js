import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BackgroundSlider from '@/components/BackgroundSlider.vue'

describe('BackgroundSlider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const images = ['bg1.jpg', 'bg2.jpg', 'bg3.jpg']

  it('renders slides for each image', () => {
    const wrapper = mount(BackgroundSlider, {
      props: { images, interval: 10, modelValue: 0 }
    })
    expect(wrapper.findAll('.bg-slide').length).toBe(3)
  })

  it('shows active slide based on modelValue', () => {
    const wrapper = mount(BackgroundSlider, {
      props: { images, interval: 10, modelValue: 1 }
    })
    expect(wrapper.findAll('.bg-slide')[1].classes()).toContain('active')
  })

  it('advances after interval', async () => {
    const wrapper = mount(BackgroundSlider, {
      props: { images, interval: 1, modelValue: 0 }
    })
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([1])
  })

  it('clicking dot changes slide', async () => {
    const wrapper = mount(BackgroundSlider, {
      props: { images, interval: 10, modelValue: 0 }
    })
    await wrapper.findAll('.bg-dot')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([2])
  })
})
