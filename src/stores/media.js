import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get, del, postFile } from '@/api/client'

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
      const data = await postFile('/media', { file })
      return {
        fileId: data.id,
        type: 'image',
        url: data.url,
        name: file.name
      }
    }

    if (type === 'video') {
      if (file.size > MAX_VIDEO_SIZE) {
        throw new Error(`视频 ${file.name} 超过 50MB 限制`)
      }
      const duration = await getVideoDuration(file)
      if (duration > 60) {
        throw new Error('视频时长不能超过 60 秒')
      }
      const coverBlob = await generateVideoCover(file)
      const fields = { file, duration }
      if (coverBlob) {
        fields.cover = coverBlob
      }
      const data = await postFile('/media', fields)
      return {
        fileId: data.id,
        type: 'video',
        url: data.url,
        coverUrl: data.coverUrl,
        name: file.name,
        duration
      }
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
    pendingMedia.value.splice(index, 1)
  }

  function clearPendingMedia() {
    pendingMedia.value = []
  }

  function getPendingMedia() {
    return pendingMedia.value.map(m => ({ id: m.fileId, type: m.type }))
  }

  async function deleteMediaFile(id) {
    await del(`/media/${id}`)
  }

  async function loadMediaLibrary() {
    library.value = await get('/media')
  }

  function getMediaUrl(id) {
    return `http://localhost:3000/api/media/${id}`
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
