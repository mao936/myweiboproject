import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get, patch, post as postRequest, del } from '@/api/client'

export const usePostStore = defineStore('post', () => {
  const allPosts = ref([])
  const searchQuery = ref('')

  const filteredPosts = computed(() => {
    return allPosts.value
      .filter(p => !p.isHidden)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
  })

  function replacePost(updated) {
    const index = allPosts.value.findIndex(p => p.id === updated.id)
    if (index >= 0) {
      allPosts.value.splice(index, 1, updated)
    }
  }

  async function refresh() {
    const query = searchQuery.value.trim()
    const path = query ? `/posts?q=${encodeURIComponent(query)}` : '/posts'
    allPosts.value = await get(path)
  }

  function search(query) {
    searchQuery.value = query
    return refresh()
  }

  async function addPost({ content, mood = '', media = [] }) {
    const payload = {
      content,
      mood,
      media: media.map(m => ({ id: m.id || m.fileId, type: m.type }))
    }
    const created = await postRequest('/posts', payload)
    allPosts.value.unshift(created)
    return created
  }

  async function editPost(id, { content, mood }) {
    const updated = await patch(`/posts/${id}`, { content, mood })
    replacePost(updated)
  }

  async function deletePost(id) {
    await del(`/posts/${id}`)
    allPosts.value = allPosts.value.filter(p => p.id !== id)
  }

  async function pinPost(id) {
    const updated = await postRequest(`/posts/${id}/pin`)
    allPosts.value.forEach(p => { p.isPinned = false })
    replacePost(updated)
  }

  async function unpinPost(id) {
    const updated = await del(`/posts/${id}/pin`)
    replacePost(updated)
  }

  async function retractPost(id) {
    const updated = await postRequest(`/posts/${id}/retract`)
    replacePost(updated)
  }

  async function hidePost(id) {
    const updated = await postRequest(`/posts/${id}/hide`)
    replacePost(updated)
  }

  async function showPost(id) {
    const updated = await del(`/posts/${id}/hide`)
    replacePost(updated)
  }

  async function likePost(id) {
    const target = allPosts.value.find(p => p.id === id)
    if (!target || target.isRetracted) return
    const updated = await postRequest(`/posts/${id}/like`)
    replacePost(updated)
  }

  async function toggleFavorite(id) {
    const updated = await postRequest(`/posts/${id}/favorite`)
    replacePost(updated)
  }

  async function toggleRepost(id) {
    const updated = await postRequest(`/posts/${id}/repost`)
    replacePost(updated)
  }

  async function addComment(id, content) {
    const target = allPosts.value.find(p => p.id === id)
    if (!target || target.isRetracted) return
    const updated = await postRequest(`/posts/${id}/comments`, { content })
    replacePost(updated)
  }

  return {
    filteredPosts,
    searchQuery,
    refresh,
    search,
    addPost,
    editPost,
    deletePost,
    pinPost,
    unpinPost,
    retractPost,
    hidePost,
    showPost,
    likePost,
    toggleFavorite,
    toggleRepost,
    addComment
  }
})
