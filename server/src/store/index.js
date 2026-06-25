import { resetUser } from './userStore.js'
import { resetSettings } from './settingsStore.js'
import { resetPosts } from './postStore.js'
import { resetMedia } from './mediaStore.js'
import { resetAds } from './adStore.js'

export function resetAll() {
  resetUser()
  resetSettings()
  resetPosts()
  resetMedia()
  resetAds()
}

resetAll()
