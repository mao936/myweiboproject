import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'

export const useUserStore = defineStore('user', () => {
  const storage = useLocalStorage('myinfo-user', { name: '我', avatarFileId: null })

  const name = computed(() => storage.value.name)
  const avatarFileId = computed(() => storage.value.avatarFileId)

  function updateName(newName) {
    storage.value = { ...storage.value, name: newName }
  }

  function updateAvatar(fileId) {
    storage.value = { ...storage.value, avatarFileId: fileId }
  }

  return { name, avatarFileId, updateName, updateAvatar }
})
