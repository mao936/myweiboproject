const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3000'

let user = { name: '我', avatarFileId: null }

export function resetUser() {
  user = { name: '我', avatarFileId: null }
}

function toMediaUrl(id) {
  return id ? `${SERVER_BASE_URL}/api/media/${id}` : null
}

export function getUser() {
  return { ...user, avatarUrl: toMediaUrl(user.avatarFileId) }
}

export function updateUser(updates) {
  if (updates.name !== undefined) {
    user.name = String(updates.name)
  }
  return getUser()
}

export function setAvatar(fileId) {
  user.avatarFileId = fileId
  return getUser()
}

export function removeAvatar() {
  user.avatarFileId = null
  return getUser()
}
