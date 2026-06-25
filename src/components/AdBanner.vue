<script setup>
import { computed, onMounted } from 'vue'
import { useAdsStore } from '@/stores/ads'

const props = defineProps({
  position: { type: String, default: 'top' }
})

const adsStore = useAdsStore()

const positionAds = computed(() => adsStore.adsForPosition(props.position))
const isHorizontal = computed(() => props.position === 'top')

onMounted(() => {
  adsStore.loadAds(props.position)
})
</script>

<template>
  <div
    v-if="positionAds.length"
    class="ad-banner"
    :class="{ horizontal: isHorizontal, vertical: !isHorizontal }"
  >
    <a
      v-for="ad in positionAds"
      :key="ad.id"
      class="ad-item"
      :href="ad.linkUrl"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img v-if="ad.imageUrl" class="ad-image" :src="ad.imageUrl" :alt="ad.title">
      <div class="ad-content">
        <h4 v-if="ad.title" class="ad-title">{{ ad.title }}</h4>
        <p v-if="ad.description" class="ad-description">{{ ad.description }}</p>
      </div>
    </a>
  </div>
</template>

<style scoped>
.ad-banner {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.ad-banner.horizontal {
  flex-direction: row;
  overflow-x: auto;
}

.ad-banner.vertical {
  flex-direction: column;
}

.ad-item {
  display: flex;
  flex: 1 1 auto;
  min-width: 200px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.ad-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ad-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.ad-content {
  padding: 10px 12px;
}

.ad-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px;
}

.ad-description {
  font-size: 12px;
  color: var(--text-secondary, #666);
  margin: 0;
  line-height: 1.4;
}
</style>
