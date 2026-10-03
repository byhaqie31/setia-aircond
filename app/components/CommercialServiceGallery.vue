<script setup lang="ts">
import type { CommercialServicePhoto } from '~/data/commercial-service-photos'

const props = defineProps<{ photos: CommercialServicePhoto[] }>()
const track = ref<HTMLUListElement | null>(null)
const currentIndex = ref(0)
const atStart = ref(true)
const atEnd = ref(false)
let resizeObserver: ResizeObserver | undefined
let requestedIndex: number | null = null
let settleTimer: ReturnType<typeof setTimeout> | undefined

function updatePosition() {
  const element = track.value
  if (!element || !element.children.length) return
  const maximum = element.scrollWidth - element.clientWidth
  atStart.value = element.scrollLeft <= 2
  atEnd.value = maximum <= 2 || element.scrollLeft >= maximum - 2
  if (atEnd.value && !atStart.value) {
    currentIndex.value = props.photos.length - 1
    return
  }
  const first = element.children[0] as HTMLElement
  currentIndex.value = [...element.children].reduce((nearest, child, index) => {
    const distance = Math.abs((child as HTMLElement).offsetLeft - first.offsetLeft - element.scrollLeft)
    const nearestDistance = Math.abs((element.children[nearest] as HTMLElement).offsetLeft - first.offsetLeft - element.scrollLeft)
    return distance < nearestDistance ? index : nearest
  }, 0)
}

function goTo(index: number) {
  const element = track.value
  if (!element) return
  const target = element.children[Math.max(0, Math.min(props.photos.length - 1, index))] as HTMLElement | undefined
  const first = element.children[0] as HTMLElement | undefined
  if (!target || !first) return
  requestedIndex = Math.max(0, Math.min(props.photos.length - 1, index))
  element.scrollTo({
    left: target.offsetLeft - first.offsetLeft,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}

function clearRequest() {
  clearTimeout(settleTimer)
  requestedIndex = null
}

function onScroll() {
  updatePosition()
  clearTimeout(settleTimer)
  settleTimer = setTimeout(clearRequest, 150)
}

function moveBy(step: number) {
  goTo((requestedIndex ?? currentIndex.value) + step)
}

function onKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const actions: Record<string, number> = {
    ArrowLeft: (requestedIndex ?? currentIndex.value) - 1,
    ArrowRight: (requestedIndex ?? currentIndex.value) + 1,
    Home: 0,
    End: props.photos.length - 1,
  }
  if (!(event.key in actions)) return
  event.preventDefault()
  goTo(actions[event.key]!)
}

onMounted(() => {
  updatePosition()
  resizeObserver = new ResizeObserver(updatePosition)
  if (track.value) resizeObserver.observe(track.value)
})
watch(() => props.photos.length, async () => {
  await nextTick()
  updatePosition()
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  clearTimeout(settleTimer)
})
</script>

<template>
  <section v-if="photos.length" id="service-photo-gallery" class="service-gallery" aria-labelledby="service-gallery-heading">
    <div class="service-gallery__heading">
      <div>
        <h2 id="service-gallery-heading">Equipment gallery.</h2>
        <p>Equipment views and details.</p>
      </div>
      <div v-if="photos.length > 1" class="service-gallery__controls">
        <span class="service-gallery__position" aria-live="polite" aria-atomic="true"><span class="service-gallery__sr-only">Photo </span>{{ currentIndex + 1 }}<span aria-hidden="true"> / </span><span class="service-gallery__sr-only"> of </span>{{ photos.length }}</span>
        <button type="button" aria-label="Previous photo" aria-controls="service-gallery-track" :disabled="atStart" @click="moveBy(-1)"><CommercialDetailArrow direction="left" /></button>
        <button type="button" aria-label="Next photo" aria-controls="service-gallery-track" :disabled="atEnd" @click="moveBy(1)"><CommercialDetailArrow /></button>
      </div>
    </div>
    <ul id="service-gallery-track" ref="track" class="service-gallery__track" tabindex="0" aria-label="Equipment photos; use left and right arrow keys to browse" data-lenis-prevent-horizontal @scroll.passive="onScroll" @scrollend="clearRequest" @wheel.passive="clearRequest" @touchstart.passive="clearRequest" @pointerdown="clearRequest" @keydown="onKeydown">
      <li v-for="photo in photos" :key="photo.id" class="service-gallery__slide">
        <CommercialServicePhoto :photo="photo" sizes="(min-width: 1440px) 900px, (min-width: 900px) 65vw, 88vw" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.service-gallery { min-width: 0; scroll-margin-top: 32px; margin-bottom: var(--detail-section); }
.service-gallery__heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.service-gallery h2 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-weight: 400; font-size: clamp(34px, 3.2vw, 48px); letter-spacing: -.035em; line-height: 1.08; }
.service-gallery__heading p { margin: 16px 0 0; color: #bed0c3; font-size: 16px; line-height: 1.6; }
.service-gallery__controls { display: flex; flex-shrink: 0; align-items: center; gap: 12px; }
.service-gallery__position { min-width: 48px; color: #bed0c3; font-size: 14px; font-variant-numeric: tabular-nums; }
.service-gallery__controls button { display: grid; place-items: center; width: 48px; height: 48px; padding: 0; border: 1px solid #bed0c380; background: transparent; color: #f8fbf8; cursor: pointer; }
.service-gallery__controls button:hover:enabled { background: #16513a; border-color: #d1e4d7; }
.service-gallery__controls button:disabled { opacity: .35; cursor: default; }
.service-gallery__track { position: relative; display: flex; gap: 24px; overflow-x: auto; scroll-snap-type: x proximity; scroll-padding-inline: 8px; scrollbar-color: #bed0c380 #174a36; scrollbar-width: thin; margin: -8px -8px 0; padding: 8px 8px 20px; list-style: none; }
/* Keep vertical page scrolling available alongside Lenis' nested-scroll styles. */
ul.service-gallery__track { overscroll-behavior: contain auto; }
.service-gallery__slide { flex: 0 0 70%; min-width: 0; scroll-snap-align: start; }
.service-gallery :deep(.service-photo__image) { aspect-ratio: 3 / 2; }
.service-gallery :deep(img) { width: 100%; height: 100%; object-fit: cover; }
.service-gallery__track:focus-visible, .service-gallery__controls button:focus-visible { outline: 2px solid #d1e4d7; outline-offset: 5px; }
.service-gallery__sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 899px) {
  .service-gallery__slide { flex-basis: 88%; }
}
@media (max-width: 550px) {
  .service-gallery__heading { align-items: start; flex-direction: column; gap: 20px; }
  .service-gallery__controls { align-self: start; }
  .service-gallery__track { gap: 16px; }
}
</style>
