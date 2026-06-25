<script setup>
import { formatBytes } from '@/utils/formatBytes'

const props = defineProps({
  items: { type: Array, required: true }
})

const emit = defineEmits(['delete'])

function onDelete(id) {
  if (window.confirm('确定从媒体库删除该文件吗？')) {
    emit('delete', id)
  }
}
</script>

<template>
  <div class="library-panel">
    <div v-if="items.length === 0" class="empty-state">
      <p class="empty-title">暂无媒体文件</p>
      <p class="empty-desc">发布简讯时上传的图片和视频会出现在这里</p>
    </div>
    <div v-else class="library">
      <div
        v-for="item in items"
        :key="item.id"
        class="library-item"
        :data-id="item.id"
      >
        <div class="library-thumb">
          <img v-if="item.type === 'image'" :src="item.url" :alt="item.name">
          <video v-else-if="item.type === 'video'" :src="item.url" />
        </div>
        <div class="library-info">
          <div class="library-name">{{ item.name }}</div>
          <div class="library-size">{{ formatBytes(item.size) }}</div>
        </div>
        <button
          class="library-remove"
          type="button"
          @click="onDelete(item.id)"
        >
          删除
        </button>
      </div>
    </div>
  </div>
</template>
