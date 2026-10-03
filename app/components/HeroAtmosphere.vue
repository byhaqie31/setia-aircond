<script setup lang="ts">
const atmosphere = useTemplateRef<HTMLElement>('atmosphere')
const visible = ref(false)
const pageVisible = ref(true)
let observer: IntersectionObserver | undefined

// Fixed coordinates keep the server and client sky identical during hydration.
const stars: [number, number, number, number, number][] = [
  [7, 17, 3, 5.8, -1.2], [16, 10, 2, 6.4, -3.1],
  [25, 20, 7, 7.2, -4.6], [34, 12, 2, 5.1, -2.4],
  [42, 7, 3, 6.8, -5.3], [50, 22, 2, 7.4, -1.7],
  [58, 13, 6, 6.3, -4.2], [67, 5, 2, 5.7, -2.8],
  [76, 16, 3, 7.6, -6.1], [87, 8, 7, 6.9, -3.4],
  [95, 24, 2, 5.5, -1.9], [4, 38, 2, 6.6, -5.7],
  [13, 30, 5, 7.8, -2.1], [31, 28, 2, 6.1, -4.9],
  [45, 35, 3, 5.9, -3.8], [54, 44, 6, 7.3, -6.4],
  [64, 29, 2, 6.7, -2.6], [82, 35, 2, 5.6, -4.1],
  [92, 46, 5, 7.1, -1.4], [7, 57, 3, 6.2, -5.2],
  [22, 64, 2, 7.5, -3.6], [37, 55, 5, 6.5, -2.3],
  [48, 65, 2, 5.4, -4.8], [16, 76, 3, 7, -6.2],
]

function syncVisibility() {
  pageVisible.value = !document.hidden
}

onMounted(() => {
  syncVisibility()
  document.addEventListener('visibilitychange', syncVisibility)
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => {
      visible.value = entry?.isIntersecting ?? false
    })
    if (atmosphere.value) observer.observe(atmosphere.value)
  } else {
    visible.value = true
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', syncVisibility)
})
</script>

<template>
  <div ref="atmosphere" class="hero-atmosphere" :class="{ 'is-active': visible && pageVisible }" aria-hidden="true">
    <svg
      v-for="([x, y, size, duration, delay], index) in stars"
      :key="index"
      class="hero-star"
      :class="{ 'hero-star--sparkle': size > 3 }"
      :style="{ left: `${x}%`, top: `${y}%`, width: `${size}px`, height: `${size}px`, animationDuration: `${duration}s`, animationDelay: `${delay}s` }"
      viewBox="0 0 16 16"
      fill="currentColor"
      focusable="false"
    >
      <path v-if="size > 3" d="M8 0 9.6 6.4 16 8 9.6 9.6 8 16 6.4 9.6 0 8 6.4 6.4Z" />
      <circle v-else cx="8" cy="8" r="5" />
    </svg>
  </div>
</template>
