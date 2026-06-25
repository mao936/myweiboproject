import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'

export const useSettingsStore = defineStore('settings', () => {
  const storage = useLocalStorage('myinfo-settings', { theme: 'cyan', bgInterval: 10 })

  const theme = computed(() => storage.value.theme)
  const bgInterval = computed(() => storage.value.bgInterval)

  function setTheme(newTheme) {
    storage.value = { ...storage.value, theme: newTheme }
  }

  function setBgInterval(interval) {
    storage.value = { ...storage.value, bgInterval: interval }
  }

  return { theme, bgInterval, setTheme, setBgInterval }
})
