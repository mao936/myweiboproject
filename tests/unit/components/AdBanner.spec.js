import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AdBanner from '@/components/AdBanner.vue'
import { get } from '@/api/client'

vi.mock('@/api/client', () => import('@/api/__mocks__/client'))

describe('AdBanner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function createAd(overrides = {}) {
    return {
      id: `ad-${Math.random().toString(36).slice(2)}`,
      title: '广告标题',
      description: '广告描述',
      imageUrl: '/images/ad.jpg',
      linkUrl: 'https://example.com',
      position: 'top',
      ...overrides
    }
  }

  it('loads and renders top ads horizontally', async () => {
    get.mockResolvedValue([createAd({ position: 'top' })])
    const wrapper = mount(AdBanner, {
      props: { position: 'top' }
    })
    await flushPromises()
    expect(get).toHaveBeenCalledWith('/ads?position=top')
    expect(wrapper.find('.ad-banner').exists()).toBe(true)
    expect(wrapper.find('.ad-banner').classes()).toContain('horizontal')
    expect(wrapper.find('.ad-title').text()).toBe('广告标题')
    expect(wrapper.find('.ad-image').attributes('src')).toBe('/images/ad.jpg')
    expect(wrapper.find('.ad-item').attributes('href')).toBe('https://example.com')
  })

  it('loads and renders sidebar ads vertically', async () => {
    get.mockResolvedValue([createAd({ position: 'sidebar' })])
    const wrapper = mount(AdBanner, {
      props: { position: 'sidebar' }
    })
    await flushPromises()
    expect(get).toHaveBeenCalledWith('/ads?position=sidebar')
    expect(wrapper.find('.ad-banner').classes()).toContain('vertical')
  })

  it('does not render when no ads', async () => {
    get.mockResolvedValue([])
    const wrapper = mount(AdBanner, {
      props: { position: 'top' }
    })
    await flushPromises()
    expect(wrapper.find('.ad-banner').exists()).toBe(false)
  })
})
