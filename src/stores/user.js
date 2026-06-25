import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get, patch, postFile } from '@/api/client'

export const useUserStore = defineStore('user', () => {
  const profile = ref({ name: '我', avatarFileId: null, avatarUrl: null })

  const name = computed(() => profile.value.name)
  const avatarFileId = computed(() => profile.value.avatarFileId)
  const avatarUrl = computed(() => profile.value.avatarUrl)

  async function loadUser() {
    profile.value = await get('/me')
  }

  async function updateName(newName) {
    await patch('/me', { name: newName })
    profile.value = { ...profile.value, name: newName }
  }

  async function updateAvatar(file) {
    await postFile('/me/avatar', { avatar: file })
    await loadUser()
  }

  return { name, avatarFileId, avatarUrl, profile, loadUser, updateName, updateAvatar }
})
