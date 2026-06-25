import { describe, it, expect, beforeEach } from 'vitest'
import { useLocalStorage } from '@/composables/useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should save and load value', () => {
    const storage = useLocalStorage('test-key', { name: 'test' })
    storage.value = { name: 'updated' }
    expect(storage.value).toEqual({ name: 'updated' })

    const storage2 = useLocalStorage('test-key', { name: 'test' })
    expect(storage2.value).toEqual({ name: 'updated' })
  })

  it('should return default value when no stored data', () => {
    const storage = useLocalStorage('missing-key', { default: true })
    expect(storage.value).toEqual({ default: true })
  })

  it('should clear localStorage when set to null', () => {
    const storage = useLocalStorage('clear-key', { data: 1 })
    storage.value = null
    expect(localStorage.getItem('clear-key')).toBeNull()
  })
})
