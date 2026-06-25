import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get } from '@/api/client'

export const useAdsStore = defineStore('ads', () => {
  const ads = ref([])

  const adsByPosition = computed(() => {
    return ads.value.reduce((acc, ad) => {
      if (!acc[ad.position]) acc[ad.position] = []
      acc[ad.position].push(ad)
      return acc
    }, {})
  })

  function adsForPosition(position) {
    return adsByPosition.value[position] || []
  }

  async function loadAds(position) {
    const result = await get(`/ads?position=${position}`)
    const normalized = Array.isArray(result) ? result : []
    const existingIds = new Set(ads.value.map(ad => ad.id))
    const newAds = normalized.filter(ad => !existingIds.has(ad.id))
    ads.value.push(...newAds)
  }

  return {
    ads,
    adsByPosition,
    adsForPosition,
    loadAds
  }
})
