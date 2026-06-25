import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('should have default state', () => {
    const store = useSettingsStore()
    expect(store.theme).toBe('cyan')
    expect(store.bgInterval).toBe(10)
  })

  it('should update theme', () => {
    const store = useSettingsStore()
    store.setTheme('purple')
    expect(store.theme).toBe('purple')
  })

  it('should update background interval', () => {
    const store = useSettingsStore()
    store.setBgInterval(30)
    expect(store.bgInterval).toBe(30)
  })

  it('should persist to localStorage', () => {
    const store = useSettingsStore()
    store.setTheme('green')
    expect(JSON.parse(localStorage.getItem('myinfo-settings')).theme).toBe('green')
  })
})
