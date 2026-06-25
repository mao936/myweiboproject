import { generateId } from '../utils/id.js'

let ads = []

export function resetAds() {
  ads = []
  seedAds()
}

function seedAds() {
  createAd({
    title: '微博会员',
    imageUrl: 'https://via.placeholder.com/728x90?text=Weibo+Member',
    linkUrl: 'https://weibo.com/vip',
    position: 'top',
    active: true,
    order: 0
  })
  createAd({
    title: '热门应用',
    imageUrl: 'https://via.placeholder.com/300x250?text=Hot+App',
    linkUrl: 'https://weibo.com/app',
    position: 'sidebar',
    active: true,
    order: 0
  })
}

export function listAds(position) {
  let result = ads.filter(ad => ad.active)
  if (position !== undefined && position !== null && position !== '') {
    result = result.filter(ad => ad.position === position)
  }
  return result.sort((a, b) => a.order - b.order)
}

export function getAd(id) {
  return ads.find(ad => ad.id === id) || null
}

export function createAd(data) {
  const ad = {
    id: generateId(),
    title: data.title ?? '',
    imageUrl: data.imageUrl ?? '',
    linkUrl: data.linkUrl ?? '',
    position: data.position ?? 'top',
    active: data.active !== undefined ? Boolean(data.active) : true,
    order: data.order ?? 0,
    createdAt: new Date().toISOString()
  }
  ads.push(ad)
  return ad
}

export function updateAd(id, data) {
  const ad = getAd(id)
  if (!ad) return null
  if (data.title !== undefined) ad.title = String(data.title)
  if (data.imageUrl !== undefined) ad.imageUrl = String(data.imageUrl)
  if (data.linkUrl !== undefined) ad.linkUrl = String(data.linkUrl)
  if (data.position !== undefined) ad.position = data.position === 'sidebar' ? 'sidebar' : 'top'
  if (data.active !== undefined) ad.active = Boolean(data.active)
  if (data.order !== undefined) ad.order = Number(data.order)
  return ad
}

export function deleteAd(id) {
  const index = ads.findIndex(ad => ad.id === id)
  if (index === -1) return false
  ads.splice(index, 1)
  return true
}

seedAds()
