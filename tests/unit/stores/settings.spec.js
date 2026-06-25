import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { get, patch } from '@/api/client'

vi.mock('@/api/client', () => import('@/api/__mocks__/client'))

describe('settings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    get.mockResolvedValue({ theme: 'cyan', bgInterval: 10 })
  })

  it('should load settings on init', async () => {
    const store = useSettingsStore()
    await store.loadSettings()
    expect(get).toHaveBeenCalledWith('/settings')
    expect(store.theme).toBe('cyan')
    expect(store.bgInterval).toBe(10)
  })

  it('should update theme', async () => {
    patch.mockResolvedValue({})
    const store = useSettingsStore()
    await store.loadSettings()
    await store.setTheme('purple')
    expect(patch).toHaveBeenCalledWith('/settings', { theme: 'purple' })
    expect(store.theme).toBe('purple')
  })

  it('should update background interval', async () => {
    patch.mockResolvedValue({})
    const store = useSettingsStore()
    await store.loadSettings()
    await store.setBgInterval(30)
    expect(patch).toHaveBeenCalledWith('/settings', { bgInterval: 30 })
    expect(store.bgInterval).toBe(30)
  })
})
