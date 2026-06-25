<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { usePostStore } from '@/stores/post'
import { useMediaStore } from '@/stores/media'
import { useSettingsStore } from '@/stores/settings'
import {
  saveMedia,
  deleteMedia,
  createObjectURL,
  cleanupOrphanMedia
} from '@/db/indexedDB'
import { generateId } from '@/utils/id'
import UserCard from '@/components/UserCard.vue'
import ComposePanel from '@/components/ComposePanel.vue'
import SearchBox from '@/components/SearchBox.vue'
import PostCard from '@/components/PostCard.vue'
import LibraryPanel from '@/components/LibraryPanel.vue'
import BackgroundSlider from '@/components/BackgroundSlider.vue'

const userStore = useUserStore()
const postStore = usePostStore()
const mediaStore = useMediaStore()
const settingsStore = useSettingsStore()

const { name, avatarFileId } = storeToRefs(userStore)
const { filteredPosts, searchQuery } = storeToRefs(postStore)
const { theme, bgInterval } = storeToRefs(settingsStore)

const currentTab = ref('home')
const searchQueryMine = ref('')
const composeContent = ref('')
const composeMood = ref('')
const editingPostId = ref(null)
const expandedComments = ref(new Set())
const toastMessage = ref('')
const toastVisible = ref(false)
const toastTimer = ref(null)
const avatarUrl = ref('')
const postAvatarUrls = ref({})
const libraryItems = ref([])
const bgIndex = ref(0)
const bgSettingsOpen = ref(false)

const imageInput = ref(null)
const videoInput = ref(null)

const isEditing = computed(() => !!editingPostId.value)

const backgrounds = [
  '/images/backgrounds/mountains.jpg',
  '/images/backgrounds/lake.jpg',
  '/images/backgrounds/forest.jpg',
  '/images/backgrounds/sunset.jpg',
  '/images/backgrounds/ocean.jpg',
  '/images/backgrounds/meadow.jpg'
]

const minePosts = computed(() => {
  let result = postStore.posts.filter(p => p.author === name.value && !p.isHidden)

  if (searchQueryMine.value.trim()) {
    const q = searchQueryMine.value.toLowerCase()
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

const activeTheme = computed(() => `theme-${theme.value}`)

function showToast(message) {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer.value) clearTimeout(toastTimer.value)
  toastTimer.value = setTimeout(() => {
    toastVisible.value = false
  }, 2000)
}

async function loadAvatar() {
  if (avatarFileId.value) {
    const url = await createObjectURL(avatarFileId.value)
    if (url) {
      avatarUrl.value = url
      return
    }
  }
  avatarUrl.value = ''
}

async function updateAvatar(file) {
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_IMAGE_SIZE) {
    showToast('头像图片不能超过 5MB')
    return
  }

  const fileId = generateId()
  await saveMedia(fileId, file, { type: 'image', name: file.name, size: file.size })

  if (avatarFileId.value) {
    await deleteMedia(avatarFileId.value)
  }

  userStore.updateAvatar(fileId)
  await loadAvatar()
  await loadPostAvatars()
  showToast('头像已更新')
}

function updateName(newName) {
  userStore.updateName(newName)
}

async function publishPost() {
  if (editingPostId.value) {
    postStore.editPost(editingPostId.value, { content: composeContent.value, mood: composeMood.value })
    showToast('简讯已更新')
    editingPostId.value = null
  } else {
    const media = mediaStore.getPendingMedia()
    postStore.addPost({ content: composeContent.value, mood: composeMood.value, media })
    mediaStore.clearPendingMedia()
    showToast('发布成功')
  }

  composeContent.value = ''
  composeMood.value = ''
  await nextTick()
  await loadPostAvatars()
}

function startEdit(post) {
  editingPostId.value = post.id
  composeContent.value = post.content
  composeMood.value = post.mood || ''
  currentTab.value = 'home'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function deletePost(post) {
  if (!window.confirm('确定要删除这条简讯吗？')) return

  for (const m of post.media || []) {
    await deleteMedia(m.fileId)
    if (m.coverId) await deleteMedia(m.coverId)
  }

  postStore.deletePost(post.id)
  expandedComments.value.delete(post.id)
  await cleanupOrphans()
  await loadPostAvatars()
  showToast('已删除')
}

async function cleanupOrphans() {
  const usedIds = new Set()
  if (avatarFileId.value) usedIds.add(avatarFileId.value)
  for (const post of postStore.posts) {
    for (const m of post.media || []) {
      usedIds.add(m.fileId)
      if (m.coverId) usedIds.add(m.coverId)
    }
  }
  await cleanupOrphanMedia(Array.from(usedIds))
}

function handleLike(id) {
  postStore.likePost(id)
}

function toggleComments(id) {
  if (expandedComments.value.has(id)) {
    expandedComments.value.delete(id)
  } else {
    expandedComments.value.add(id)
  }
}

function addComment(id, content) {
  postStore.addComment(id, content)
  expandedComments.value.add(id)
}

function handlePin(post) {
  if (post.isPinned) {
    postStore.unpinPost(post.id)
    showToast('已取消置顶')
  } else {
    postStore.pinPost(post.id)
    showToast('已置顶')
  }
}

function handleRetract(post) {
  if (!post.isRetracted && !window.confirm('撤回后其他用户将看到该简讯已撤回，是否继续？')) {
    return
  }
  postStore.retractPost(post.id)
  showToast(post.isRetracted ? '已恢复' : '已撤回')
}

function handleHide(post) {
  if (post.isHidden) {
    postStore.showPost(post.id)
    showToast('已显示')
  } else {
    postStore.hidePost(post.id)
    showToast('已隐藏')
  }
}

function handleTagClick(tag) {
  if (currentTab.value === 'mine') {
    searchQueryMine.value = tag
  } else {
    postStore.search(tag)
  }
}

async function handleAddImage() {
  imageInput.value?.click()
}

async function handleAddVideo() {
  videoInput.value?.click()
}

async function onImageSelected(event) {
  const files = event.target.files
  if (!files) return
  for (const file of files) {
    const result = await mediaStore.addPendingImage(file)
    if (!result.success) {
      showToast(result.error)
    }
  }
  event.target.value = ''
}

async function onVideoSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const result = await mediaStore.addPendingVideo(file)
  if (!result.success) {
    showToast(result.error)
  }
  event.target.value = ''
}

async function loadPostAvatars() {
  const ids = new Set()
  for (const post of postStore.posts) {
    if (post.avatarFileId) ids.add(post.avatarFileId)
  }

  const newUrls = {}
  for (const id of ids) {
    if (postAvatarUrls.value[id]) {
      newUrls[id] = postAvatarUrls.value[id]
    } else {
      const url = await createObjectURL(id)
      if (url) newUrls[id] = url
    }
  }
  postAvatarUrls.value = newUrls
}

async function loadLibrary() {
  await mediaStore.loadMediaLibrary()
  const items = []
  for (const item of mediaStore.library) {
    const url = await createObjectURL(item.id)
    items.push({ ...item, url })
  }
  libraryItems.value = items
}

async function deleteLibraryItem(id) {
  const usedInAvatar = avatarFileId.value === id
  const usedInPosts = postStore.posts.some(p =>
    (p.media || []).some(m => m.fileId === id || m.coverId === id)
  )

  if (usedInAvatar || usedInPosts) {
    showToast('该文件正在使用，无法删除')
    return
  }

  await deleteMedia(id)
  await loadLibrary()
  showToast('媒体已删除')
}

function switchTab(tab) {
  currentTab.value = tab
  window.location.hash = tab
  if (tab === 'library') {
    loadLibrary()
  }
}

watch(avatarFileId, loadAvatar)
watch(() => postStore.posts, loadPostAvatars, { deep: true })

onMounted(async () => {
  const hashTab = window.location.hash.replace('#', '')
  if (['home', 'mine', 'library'].includes(hashTab)) {
    currentTab.value = hashTab
  }
  await loadAvatar()
  await loadPostAvatars()
})
</script>

<template>
  <div id="app" :class="activeTheme">
    <BackgroundSlider
      :images="backgrounds"
      :interval="bgInterval"
      :model-value="bgIndex"
      @update:model-value="bgIndex = $event"
    />

    <header class="header">
      <div class="header-inner">
        <a href="#" class="logo">我的简讯</a>
        <nav class="nav">
          <button
            v-for="tab in ['home', 'mine', 'library']"
            :key="tab"
            class="nav-item"
            :class="{ active: currentTab === tab }"
            type="button"
            @click="switchTab(tab)"
          >
            {{ tab === 'home' ? '首页' : tab === 'mine' ? '我的' : '媒体库' }}
          </button>
        </nav>
      </div>
    </header>

    <main class="main">
      <section v-show="currentTab === 'home'" class="tab-panel">
        <div class="banner">
          <img class="banner-image" src="/images/banners/banner1.jpg" alt="Banner">
          <div class="banner-content">
            <h1 class="banner-title">记录每一刻</h1>
            <p class="banner-subtitle">分享心情、想法与生活点滴</p>
          </div>
        </div>

        <UserCard
          :name="name"
          :avatar-url="avatarUrl"
          @update:name="updateName"
          @update:avatar="updateAvatar"
        />

        <ComposePanel
          v-model:content="composeContent"
          v-model:mood="composeMood"
          :media="mediaStore.pendingMedia"
          :editing="isEditing"
          @publish="publishPost"
          @add-image="handleAddImage"
          @add-video="handleAddVideo"
          @remove-media="mediaStore.removePendingMedia"
        >
          <template #avatar>
            <img class="avatar current-avatar-small" :src="avatarUrl || ''" alt="头像">
          </template>
        </ComposePanel>

        <SearchBox
          v-model="searchQuery"
          placeholder="搜索内容、作者或标签"
        />

        <ul v-if="filteredPosts.length" class="post-list">
          <PostCard
            v-for="post in filteredPosts"
            :key="post.id"
            :post="post"
            :is-mine="post.author === name"
            :post-avatar-url="postAvatarUrls[post.avatarFileId] || ''"
            :comments-expanded="expandedComments.has(post.id)"
            @like="handleLike(post.id)"
            @comment="toggleComments(post.id)"
            @edit="startEdit(post)"
            @delete="deletePost(post)"
            @pin="handlePin(post)"
            @retract="handleRetract(post)"
            @hide="handleHide(post)"
            @add-comment="addComment(post.id, $event)"
            @tag-click="handleTagClick"
          />
        </ul>
        <div v-else class="empty-state">
          <p class="empty-title">{{ searchQuery.trim() ? '未找到相关简讯' : '还没有简讯' }}</p>
          <p class="empty-desc">{{ searchQuery.trim() ? '换个关键词试试吧' : '发布第一条简讯，记录此刻心情' }}</p>
        </div>
      </section>

      <section v-show="currentTab === 'mine'" class="tab-panel">
        <SearchBox
          v-model="searchQueryMine"
          placeholder="搜索我的简讯"
        />
        <ul v-if="minePosts.length" class="post-list">
          <PostCard
            v-for="post in minePosts"
            :key="post.id"
            :post="post"
            :is-mine="true"
            :post-avatar-url="postAvatarUrls[post.avatarFileId] || ''"
            :comments-expanded="expandedComments.has(post.id)"
            @like="handleLike(post.id)"
            @comment="toggleComments(post.id)"
            @edit="startEdit(post)"
            @delete="deletePost(post)"
            @pin="handlePin(post)"
            @retract="handleRetract(post)"
            @hide="handleHide(post)"
            @add-comment="addComment(post.id, $event)"
            @tag-click="handleTagClick"
          />
        </ul>
        <div v-else class="empty-state">
          <p class="empty-title">{{ searchQueryMine.trim() ? '未找到相关简讯' : '你还没有发布过简讯' }}</p>
          <p class="empty-desc">{{ searchQueryMine.trim() ? '换个关键词试试吧' : '在首页发布一条简讯吧' }}</p>
        </div>
      </section>

      <section v-show="currentTab === 'library'" class="tab-panel">
        <div class="card" style="padding: 22px; margin-bottom: 20px;">
          <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">媒体库</h2>
          <p style="font-size: 14px; color: var(--text-secondary);">管理本地上传的图片与视频素材</p>
        </div>
        <LibraryPanel :items="libraryItems" @delete="deleteLibraryItem" />
      </section>
    </main>

    <div class="bg-controls">
      <button
        v-for="(_, index) in backgrounds"
        :key="index"
        class="bg-dot"
        :class="{ active: bgIndex === index }"
        type="button"
        @click="bgIndex = index"
      />
      <button class="bg-settings-btn" type="button" title="切换背景设置" @click="bgSettingsOpen = !bgSettingsOpen">
        ⚙
      </button>
    </div>

    <div v-show="bgSettingsOpen" class="bg-settings">
      <div class="bg-settings-title">背景切换间隔</div>
      <div class="bg-settings-options">
        <button
          v-for="sec in [5, 10, 30, 60]"
          :key="sec"
          class="bg-option"
          :class="{ active: bgInterval === sec }"
          type="button"
          @click="settingsStore.setBgInterval(sec)"
        >
          {{ sec }}秒
        </button>
      </div>
    </div>

    <input
      ref="imageInput"
      type="file"
      accept="image/*"
      multiple
      hidden
      @change="onImageSelected"
    >
    <input
      ref="videoInput"
      type="file"
      accept="video/mp4,video/webm"
      hidden
      @change="onVideoSelected"
    >

    <div class="toast" :class="{ visible: toastVisible }">{{ toastMessage }}</div>
  </div>
</template>
