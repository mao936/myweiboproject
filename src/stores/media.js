import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  saveMedia,
  deleteMedia,
  getAllMedia,
  createObjectURL
} from '@/db/indexedDB'
import { generateId } from '@/utils/id'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024
const MAX_IMAGES = 9

export const useMediaStore = defineStore('media', () => {
  const pendingMedia = ref([])
  const library = ref([])

  async function handleFileSelect(file, type) {
    if (type === 'image') {
      if (file.size > MAX_IMAGE_SIZE) {
        throw new Error(`图片 ${file.name} 超过 5MB 限制`)
      }
      const fileId = generateId()
      await saveMedia(fileId, file, { type: 'image', name: file.name, size: file.size })
      return { fileId, type: 'image', url: URL.createObjectURL(file), name: file.name }
    }

    if (type === 'video') {
      if (file.size > MAX_VIDEO_SIZE) {
        throw new Error(`视频 ${file.name} 超过 50MB 限制`)
      }
      const duration = await getVideoDuration(file)
      if (duration > 60) {
        throw new Error('视频时长不能超过 60 秒')
      }
      const fileId = generateId()
      const coverBlob = await generateVideoCover(file)
      const coverId = coverBlob ? generateId() : null
      if (coverBlob) {
        await saveMedia(coverId, coverBlob, { type: 'image', name: 'cover', size: coverBlob.size })
      }
      await saveMedia(fileId, file, { type: 'video', name: file.name, size: file.size, coverId, duration })
      return { fileId, type: 'video', url: URL.createObjectURL(file), coverId, name: file.name, duration }
    }

    return null
  }

  async function addPendingImage(file) {
    const remaining = MAX_IMAGES - pendingMedia.value.filter(m => m.type === 'image').length
    if (remaining <= 0) {
      return { success: false, error: `最多上传 ${MAX_IMAGES} 张图片` }
    }

    if (pendingMedia.value.some(m => m.type === 'video')) {
      return { success: false, error: '图片和视频不能同时发布' }
    }

    try {
      const media = await handleFileSelect(file, 'image')
      if (media) pendingMedia.value.push(media)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async function addPendingVideo(file) {
    if (pendingMedia.value.some(m => m.type === 'image')) {
      return { success: false, error: '图片和视频不能同时发布' }
    }

    try {
      const media = await handleFileSelect(file, 'video')
      if (media) pendingMedia.value = [media]
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  function removePendingMedia(index) {
    const item = pendingMedia.value[index]
    if (item) {
      URL.revokeObjectURL(item.url)
      pendingMedia.value.splice(index, 1)
    }
  }

  function clearPendingMedia() {
    pendingMedia.value.forEach(m => URL.revokeObjectURL(m.url))
    pendingMedia.value = []
  }

  function getPendingMedia() {
    return pendingMedia.value.map(m => ({ fileId: m.fileId, type: m.type }))
  }

  async function deleteMediaFile(id) {
    await deleteMedia(id)
  }

  async function loadMediaLibrary() {
    library.value = await getAllMedia()
  }

  async function getMediaUrl(id) {
    return createObjectURL(id)
  }

  return {
    pendingMedia,
    library,
    addPendingImage,
    addPendingVideo,
    removePendingMedia,
    clearPendingMedia,
    getPendingMedia,
    deleteMediaFile,
    loadMediaLibrary,
    getMediaUrl
  }
})

function getVideoDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = URL.createObjectURL(file)

    video.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    })

    video.addEventListener('error', () => {
      URL.revokeObjectURL(video.src)
      resolve(0)
    })
  })
}

function generateVideoCover(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    video.muted = true
    video.playsInline = true

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(1, video.duration / 2)
    })

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(video.src)

      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.7)
    })

    video.addEventListener('error', () => {
      URL.revokeObjectURL(video.src)
      resolve(null)
    })

    video.load()
  })
}
