import { resetUser } from './userStore.js'
import { resetSettings } from './settingsStore.js'
import { resetPosts } from './postStore.js'
import { resetMedia } from './mediaStore.js'

export function resetAll() {
  resetUser()
  resetSettings()
  resetPosts()
  resetMedia()
}

resetAll()
