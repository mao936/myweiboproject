import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get, patch, post, del, postFile } from '@/api/client'

export const useUserStore = defineStore('user', () => {
  const profile = ref({ name: '我', avatarFileId: null, avatarUrl: null })
  const favorites = ref([])
  const repostedPostIds = ref([])

  const name = computed(() => profile.value.name)
  const avatarFileId = computed(() => profile.value.avatarFileId)
  const avatarUrl = computed(() => profile.value.avatarUrl)

  async function loadUser() {
    profile.value = await get('/me')
    await loadReposts()
  }

  async function loadFavorites() {
    favorites.value = await get('/me/favorites')
  }

  async function loadReposts() {
    repostedPostIds.value = await get('/me/reposts')
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

  function isReposted(postId) {
    return repostedPostIds.value.includes(postId)
  }

  function addRepost(postId) {
    if (!repostedPostIds.value.includes(postId)) {
      repostedPostIds.value.push(postId)
    }
  }

  function removeRepost(postId) {
    repostedPostIds.value = repostedPostIds.value.filter(id => id !== postId)
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
    repostedPostIds,
    loadUser,
    loadFavorites,
    loadReposts,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isReposted,
    addRepost,
    removeRepost,
    updateName,
    updateAvatar
  }
})
