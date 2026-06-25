import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSettings,
  updateSettings,
  resetSettings
} from '../src/store/settingsStore.js'

describe('settingsStore', () => {
  beforeEach(() => {
    resetSettings()
  })

  it('returns seeded settings', () => {
    expect(getSettings()).toEqual({ theme: 'cyan', bgInterval: 10 })
  })

  it('updates theme', () => {
    updateSettings({ theme: 'dark' })
    expect(getSettings().theme).toBe('dark')
  })

  it('updates bgInterval', () => {
    updateSettings({ bgInterval: 30 })
    expect(getSettings().bgInterval).toBe(30)
  })

  it('ignores unknown fields', () => {
    updateSettings({ theme: 'light', unknown: true })
    expect(getSettings()).toEqual({ theme: 'light', bgInterval: 10 })
  })
})
