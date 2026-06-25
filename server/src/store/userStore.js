const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3000'

let user = { name: '我', avatarFileId: null, favorites: [], repostedPostIds: [] }

export function resetUser() {
  user = { name: '我', avatarFileId: null, favorites: [], repostedPostIds: [] }
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

export function getFavorites() {
  return [...user.favorites]
}

export function addFavorite(postId) {
  if (!user.favorites.includes(postId)) {
    user.favorites.push(postId)
  }
  return getFavorites()
}

export function removeFavorite(postId) {
  user.favorites = user.favorites.filter(id => id !== postId)
  return getFavorites()
}

export function isFavorite(postId) {
  return user.favorites.includes(postId)
}

export function getReposts() {
  return [...user.repostedPostIds]
}

export function addRepost(postId) {
  if (!user.repostedPostIds.includes(postId)) {
    user.repostedPostIds.push(postId)
  }
  return getReposts()
}

export function removeRepost(postId) {
  user.repostedPostIds = user.repostedPostIds.filter(id => id !== postId)
  return getReposts()
}

export function isReposted(postId) {
  return user.repostedPostIds.includes(postId)
}
