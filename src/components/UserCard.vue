<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  avatarUrl: { type: String, default: '' }
})

const emit = defineEmits(['update:name', 'update:avatar'])

const localName = ref(props.name)
const fileInput = ref(null)

watch(() => props.name, (newName) => {
  localName.value = newName
})

function onNameChange() {
  const value = localName.value.trim()
  if (value) {
    emit('update:name', value)
  } else {
    localName.value = props.name
  }
}

function onAvatarClick() {
  fileInput.value?.click()
}

function onFileChange(event) {
  const file = event.target.files?.[0]
  if (file) {
    emit('update:avatar', file)
  }
  event.target.value = ''
}

function defaultAvatar() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect width="48" height="48" fill="#e5e5ea" rx="24"/>
    <circle cx="24" cy="19" r="7" fill="#aeaeb2"/>
    <path d="M11 42c0-9 5.8-15 13-15s13 6 13 15v2H11z" fill="#aeaeb2"/>
  </svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}
</script>

<template>
  <div class="user-card card">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      hidden
      @change="onFileChange"
    >
    <img
      class="avatar avatar-clickable"
      :src="avatarUrl || defaultAvatar()"
      alt="点击更换头像"
      title="点击更换头像"
      @click="onAvatarClick"
    >
    <div class="user-info">
      <input
        v-model="localName"
        class="user-name"
        type="text"
        maxlength="20"
        @change="onNameChange"
      >
      <p class="user-hint">点击头像可上传自定义头像，点击昵称可直接编辑</p>
    </div>
  </div>
</template>
