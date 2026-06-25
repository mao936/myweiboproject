<script setup>
import { computed } from 'vue'
import { formatTime } from '@/utils/formatTime'
import MediaGallery from './MediaGallery.vue'
import CommentSection from './CommentSection.vue'

const props = defineProps({
  post: { type: Object, required: true },
  isMine: { type: Boolean, default: false },
  postAvatarUrl: { type: String, default: '' },
  commentsExpanded: { type: Boolean, default: false },
  media: { type: Array, default: null }
})

const avatarUrl = computed(() => props.postAvatarUrl || props.post.avatarUrl || '')

const displayMedia = computed(() => props.media || props.post.media || [])

const emit = defineEmits(['like', 'comment', 'edit', 'delete', 'pin', 'retract', 'hide', 'add-comment', 'tag-click'])

const timeText = computed(() => {
  const pinned = props.post.isPinned ? '置顶 · ' : ''
  return pinned + formatTime(props.post.createdAt)
})

function defaultAvatar() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect width="48" height="48" fill="#e5e5ea" rx="24"/>
    <circle cx="24" cy="19" r="7" fill="#aeaeb2"/>
    <path d="M11 42c0-9 5.8-15 13-15s13 6 13 15v2H11z" fill="#aeaeb2"/>
  </svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

function onDelete() {
  if (window.confirm('确定要删除这条简讯吗？')) {
    emit('delete')
  }
}

function onRetract() {
  const post = props.post
  if (!post.isRetracted && !window.confirm('撤回后其他用户将看到该简讯已撤回，是否继续？')) {
    return
  }
  emit('retract')
}
</script>

<template>
  <li class="post-item" :class="{ pinned: post.isPinned, retracted: post.isRetracted }">
    <div class="post-header">
      <img class="avatar" :src="avatarUrl || defaultAvatar()" alt="头像">
      <div class="post-meta">
        <div class="post-author">
          {{ post.author }}
          <span v-if="post.mood" class="post-mood">{{ post.mood }}</span>
        </div>
        <div class="post-time">{{ timeText }}</div>
      </div>
      <div v-if="isMine" class="post-actions-top">
        <button class="post-action-btn action-pin" type="button" @click="$emit('pin')">
          {{ post.isPinned ? '取消置顶' : '置顶' }}
        </button>
        <button class="post-action-btn action-edit" type="button" @click="$emit('edit')">编辑</button>
        <button class="post-action-btn action-retract" type="button" @click="onRetract">
          {{ post.isRetracted ? '恢复' : '撤回' }}
        </button>
        <button class="post-action-btn action-hide" type="button" @click="$emit('hide')">
          {{ post.isHidden ? '显示' : '隐藏' }}
        </button>
        <button class="post-action-btn danger action-delete" type="button" @click="onDelete">删除</button>
      </div>
    </div>

    <div v-if="post.isRetracted" class="post-content retracted-notice">该简讯已撤回</div>
    <template v-else>
      <div v-if="post.content" class="post-content">{{ post.content }}</div>
      <div v-if="post.tags?.length" class="post-tags">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="post-tag"
          @click="$emit('tag-click', tag)"
        >#{{ tag }}</span>
      </div>
      <MediaGallery :media="displayMedia" />
    </template>

    <div class="post-actions">
      <button
        class="action-btn action-like"
        :class="{ active: post.likedByMe }"
        type="button"
        :disabled="post.isRetracted"
        @click="$emit('like')"
      >
        <span>{{ post.likes || 0 }}</span>
      </button>
      <button
        class="action-btn action-comment"
        type="button"
        :disabled="post.isRetracted"
        @click="$emit('comment')"
      >
        <span>{{ post.comments.length > 0 ? post.comments.length : '评论' }}</span>
      </button>
      <button
        class="action-btn action-repost"
        type="button"
        :disabled="post.isRetracted"
      >
        <span>{{ post.reposts || '转发' }}</span>
      </button>
    </div>

    <CommentSection
      :comments="post.comments"
      :expanded="commentsExpanded"
      @submit="$emit('add-comment', $event)"
    />
  </li>
</template>
