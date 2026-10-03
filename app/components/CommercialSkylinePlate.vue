<script setup lang="ts">
import { onMounted, ref } from 'vue'

withDefaults(defineProps<{
  src?: string
  revealed?: boolean
  dimmed?: boolean
  zoomed?: boolean
  backdrop?: boolean
  exiting?: boolean
  unavailable?: boolean
  alt?: string
}>(), {
  src: '/images/commercial/skyline/kl-skyline-cutout-v1.webp',
  revealed: true,
  dimmed: false,
  zoomed: false,
  backdrop: false,
  exiting: false,
  unavailable: false,
  alt: '',
})

const emit = defineEmits<{ load: [image: HTMLImageElement]; error: [] }>()
const imageElement = ref<HTMLImageElement | null>(null)
defineExpose({ imageElement })

function loaded() {
  if (imageElement.value) emit('load', imageElement.value)
}

onMounted(() => {
  if (imageElement.value?.complete && imageElement.value.naturalWidth) loaded()
})
</script>

<template>
  <div class="commercial-skyline-plate" :class="{ 'is-revealed': revealed, 'is-dimmed': dimmed, 'is-zoomed': zoomed, 'is-backdrop': backdrop, 'is-exiting': exiting, 'is-unavailable': unavailable }">
    <img ref="imageElement" class="commercial-skyline-plate__image client-scene__image"
      :src="$sitePath(src)"
      :srcset="`${$sitePath('/images/commercial/skyline/kl-skyline-cutout-v1-1280.webp')} 1280w, ${$sitePath(src)} 2172w`"
      sizes="(max-width: 1023px) calc(40svh * 2172 / 326), (max-width: 1099px) 900px, 100vw" width="2172" height="724" :alt="alt"
      :aria-hidden="!alt || undefined" @load="loaded" @error="emit('error')">
  </div>
</template>

<style scoped>
.commercial-skyline-plate { position: absolute; z-index: 0; left: 50%; bottom: -1px; width: max(100%, 900px); aspect-ratio: 2172 / 724; opacity: 0; filter: brightness(1.1) contrast(1.04) saturate(1.02); transform: translateX(-50%) scale(1); transform-origin: 50% 100%; transition: opacity 320ms ease, filter 650ms ease, transform 650ms cubic-bezier(.22, 1, .36, 1); }
.commercial-skyline-plate.is-revealed { opacity: 1; }
.commercial-skyline-plate.is-dimmed { filter: brightness(.22) contrast(1.04) saturate(.6); }
.commercial-skyline-plate.is-zoomed { transform: translateX(-50%) scale(.94); }
.commercial-skyline-plate.is-backdrop { transform: translateX(-50%) scale(2); }
.commercial-skyline-plate.is-exiting { opacity: 0; transform: translateX(-50%) scale(.88); }
.commercial-skyline-plate.is-unavailable { visibility: hidden; }
.commercial-skyline-plate__image { display: block; width: 100%; height: 100%; object-fit: cover; }
@media (max-width: 1023px) {
  .commercial-skyline-plate { width: 100%; height: 40svh; aspect-ratio: auto; }
  .commercial-skyline-plate__image { position: absolute; bottom: 0; height: calc(100% * 724 / 326); object-position: 31% bottom; }
}
@media (prefers-reduced-motion: reduce) { .commercial-skyline-plate { transition-duration: 100ms; } }
</style>
