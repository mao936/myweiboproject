<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: { type: String, default: '' },
  mood: { type: String, default: '' },
  media: { type: Array, default: () => [] },
  maxLength: { type: Number, default: 140 },
  editing: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:content',
  'update:mood',
  'publish',
  'add-image',
  'add-video',
  'remove-media'
])

const moods = ['', '😊', '😂', '🤔', '👍', '❤️', '🎉', '😴', '😭']

const countText = computed(() => `${props.content.length}/${props.maxLength}`)
const isOverLimit = computed(() => props.content.length > props.maxLength)
const canPublish = computed(() =>
  !isOverLimit.value && (props.content.trim().length > 0 || props.media.length > 0)
)

function onInput(event) {
  emit('update:content', event.target.value)
}

function selectMood(mood) {
  emit('update:mood', mood)
}

function onPublish() {
  if (canPublish.value) {
    emit('publish')
  }
}

function onRemove(index) {
  emit('remove-media', index)
}
</script>

<template>
  <div class="compose card">
    <div class="compose-row">
      <slot name="avatar" />
      <div class="compose-body">
        <textarea
          class="compose-input"
          rows="3"
          placeholder="分享今日心情、想法或新鲜事..."
          :value="content"
          @input="onInput"
        />

        <div class="mood-selector">
          <button
            v-for="m in moods"
            :key="m || 'none'"
            class="mood-item"
            :class="{ active: mood === m }"
            type="button"
            @click="selectMood(m)"
          >
            {{ m || '−' }}
          </button>
        </div>

        <div v-if="media.length" class="media-preview">
          <div
            v-for="(item, index) in media"
            :key="item.fileId"
            class="media-preview-item"
          >
            <img v-if="item.type === 'image'" :src="item.url" :alt="item.name">
            <video v-else-if="item.type === 'video'" :src="item.url" />
            <button
              class="media-remove"
              type="button"
              :data-index="index"
              @click="onRemove(index)"
            >
              ×
            </button>
          </div>
        </div>

        <div class="compose-footer">
          <div class="compose-tools">
            <button class="tool-btn tool-image" type="button" @click="$emit('add-image')">
              图片
            </button>
            <button class="tool-btn tool-video" type="button" @click="$emit('add-video')">
              视频
            </button>
          </div>
          <div class="compose-actions">
            <span class="compose-count" :class="{ 'over-limit': isOverLimit }">{{ countText }}</span>
            <button
              class="btn btn-primary compose-submit"
              type="button"
              :disabled="!canPublish"
              @click="onPublish"
            >
              {{ editing ? '保存' : '发布' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
