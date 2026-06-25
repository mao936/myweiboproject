<script setup>
import { ref } from 'vue'

const props = defineProps({
  comments: { type: Array, required: true },
  expanded: { type: Boolean, default: false }
})

const emit = defineEmits(['submit'])

const newComment = ref('')

function onSubmit() {
  const content = newComment.value.trim()
  if (!content) return
  emit('submit', content)
  newComment.value = ''
}
</script>

<template>
  <div v-if="expanded" class="comments">
    <div class="comment-list">
      <div v-if="comments.length === 0" class="comment-empty">暂无评论，来说两句吧</div>
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="comment-item"
      >
        <span class="comment-author">{{ comment.author }}:</span>
        <span class="comment-text">{{ comment.content }}</span>
      </div>
    </div>
    <form class="comment-form" @submit.prevent="onSubmit">
      <input
        v-model="newComment"
        class="comment-input"
        type="text"
        placeholder="写下你的评论..."
        maxlength="140"
      >
      <button class="comment-submit" type="submit" :disabled="!newComment.trim()">发送</button>
    </form>
  </div>
</template>
