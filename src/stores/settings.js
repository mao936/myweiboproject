import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get, patch } from '@/api/client'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({ theme: 'cyan', bgInterval: 10 })

  const theme = computed(() => settings.value.theme)
  const bgInterval = computed(() => settings.value.bgInterval)

  async function loadSettings() {
    settings.value = await get('/settings')
  }

  async function setTheme(newTheme) {
    await patch('/settings', { theme: newTheme })
    settings.value = { ...settings.value, theme: newTheme }
  }

  async function setBgInterval(interval) {
    await patch('/settings', { bgInterval: interval })
    settings.value = { ...settings.value, bgInterval: interval }
  }

  return { theme, bgInterval, settings, loadSettings, setTheme, setBgInterval }
})
