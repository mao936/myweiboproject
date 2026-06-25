<script setup>
import { computed } from 'vue'

const props = defineProps({
  media: { type: Array, required: true }
})

const gridClass = computed(() => {
  const count = props.media.length
  if (count === 1) return 'grid-1'
  if (count === 2) return 'grid-2'
  if (count === 4) return 'grid-4'
  return 'grid-3'
})
</script>

<template>
  <div v-if="media.length" class="post-media" :class="gridClass">
    <div
      v-for="item in media"
      :key="item.fileId"
      class="media-item"
    >
      <img v-if="item.type === 'image'" :src="item.url" :alt="item.name || ''">
      <video v-else-if="item.type === 'video'" :src="item.url" controls />
    </div>
  </div>
</template>
