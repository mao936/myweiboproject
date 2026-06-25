<script setup>
import { watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  images: { type: Array, required: true },
  interval: { type: Number, default: 10 },
  modelValue: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue'])

let timer = null

function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    const next = (props.modelValue + 1) % props.images.length
    emit('update:modelValue', next)
  }, props.interval * 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function setIndex(index) {
  emit('update:modelValue', index)
}

watch(() => props.interval, startTimer)
watch(() => props.modelValue, startTimer)

onMounted(startTimer)
onUnmounted(stopTimer)
</script>

<template>
  <div class="bg-slider">
    <div
      v-for="(image, index) in images"
      :key="image"
      class="bg-slide"
      :class="{ active: modelValue === index }"
      :style="{ backgroundImage: `url(${image})` }"
    />
    <div class="bg-overlay" />
    <div class="bg-controls">
      <button
        v-for="(_, index) in images"
        :key="index"
        class="bg-dot"
        :class="{ active: modelValue === index }"
        type="button"
        @click="setIndex(index)"
      />
    </div>
  </div>
</template>
