import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get, patch, post, del, postFile } from '@/api/client'

export const useUserStore = defineStore('user', () => {
  const profile = ref({ name: '我', avatarFileId: null, avatarUrl: null })
  const favorites = ref([])

  const name = computed(() => profile.value.name)
  const avatarFileId = computed(() => profile.value.avatarFileId)
  const avatarUrl = computed(() => profile.value.avatarUrl)

  async function loadUser() {
    profile.value = await get('/me')
  }

  async function loadFavorites() {
    favorites.value = await get('/me/favorites')
  }

  function isFavorite(postId) {
    return favorites.value.includes(postId)
  }

  async function addFavorite(postId) {
    await post(`/me/favorites/${postId}`)
    if (!favorites.value.includes(postId)) {
      favorites.value.push(postId)
    }
  }

  async function removeFavorite(postId) {
    await del(`/me/favorites/${postId}`)
    favorites.value = favorites.value.filter(id => id !== postId)
  }

  async function toggleFavorite(postId) {
    if (isFavorite(postId)) {
      await removeFavorite(postId)
    } else {
      await addFavorite(postId)
    }
  }

  async function updateName(newName) {
    await patch('/me', { name: newName })
    profile.value = { ...profile.value, name: newName }
  }

  async function updateAvatar(file) {
    await postFile('/me/avatar', { avatar: file })
    await loadUser()
  }

  return {
    name,
    avatarFileId,
    avatarUrl,
    profile,
    favorites,
    loadUser,
    loadFavorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    updateName,
    updateAvatar
  }
})
