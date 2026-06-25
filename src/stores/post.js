import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useUserStore } from './user'
import { generateId } from '@/utils/id'
import { extractTags } from '@/utils/extractTags'

export const usePostStore = defineStore('post', () => {
  const userStore = useUserStore()
  const storage = useLocalStorage('myinfo-posts', [])
  const posts = ref(storage.value)
  const searchQuery = ref('')

  const filteredPosts = computed(() => {
    let result = posts.value.filter(p => !p.isHidden)

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(p =>
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        (p.tags || []).some(tag => tag.toLowerCase().includes(q))
      )
    }

    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  })

  function syncStorage() {
    storage.value = posts.value
  }

  function addPost({ content, mood = '', media = [] }) {
    const post = {
      id: generateId(),
      author: userStore.name,
      avatarFileId: userStore.avatarFileId,
      content,
      mood,
      tags: extractTags(content),
      createdAt: new Date().toISOString(),
      media,
      likes: 0,
      likedByMe: false,
      comments: [],
      reposts: 0,
      isPinned: false,
      isRetracted: false,
      isHidden: false
    }

    posts.value.unshift(post)
    syncStorage()
    return post
  }

  function editPost(id, { content, mood }) {
    const post = posts.value.find(p => p.id === id)
    if (!post) return

    post.content = content
    post.mood = mood
    post.tags = extractTags(content)
    syncStorage()
  }

  function deletePost(id) {
    posts.value = posts.value.filter(p => p.id !== id)
    syncStorage()
  }

  function pinPost(id) {
    posts.value.forEach(p => { p.isPinned = false })
    const post = posts.value.find(p => p.id === id)
    if (post) {
      post.isPinned = true
      syncStorage()
    }
  }

  function unpinPost(id) {
    const post = posts.value.find(p => p.id === id)
    if (post) {
      post.isPinned = false
      syncStorage()
    }
  }

  function retractPost(id) {
    const post = posts.value.find(p => p.id === id)
    if (post) {
      post.isRetracted = !post.isRetracted
      syncStorage()
    }
  }

  function hidePost(id) {
    const post = posts.value.find(p => p.id === id)
    if (post) {
      post.isHidden = true
      syncStorage()
    }
  }

  function showPost(id) {
    const post = posts.value.find(p => p.id === id)
    if (post) {
      post.isHidden = false
      syncStorage()
    }
  }

  function likePost(id) {
    const post = posts.value.find(p => p.id === id)
    if (!post || post.isRetracted) return

    post.likedByMe = !post.likedByMe
    post.likes += post.likedByMe ? 1 : -1
    syncStorage()
  }

  function addComment(id, content) {
    const post = posts.value.find(p => p.id === id)
    if (!post || post.isRetracted) return

    post.comments.push({
      id: generateId(),
      author: '路人甲',
      content,
      createdAt: new Date().toISOString()
    })
    syncStorage()
  }

  function search(query) {
    searchQuery.value = query
  }

  return {
    posts,
    filteredPosts,
    searchQuery,
    addPost,
    editPost,
    deletePost,
    pinPost,
    unpinPost,
    retractPost,
    hidePost,
    showPost,
    likePost,
    addComment,
    search
  }
})
