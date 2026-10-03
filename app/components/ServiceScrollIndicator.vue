<script setup lang="ts">
defineProps<{ visible: boolean }>()
const documentVisible = ref(true)
const atEnd = ref(false)
const end = useTemplateRef<HTMLElement>('end')
let observer: IntersectionObserver | undefined
function onVisibilityChange() { documentVisible.value = !document.hidden }
onMounted(() => {
  onVisibilityChange()
  document.addEventListener('visibilitychange', onVisibilityChange)
  if (end.value) {
    observer = new IntersectionObserver(([entry]) => { atEnd.value = Boolean(entry?.isIntersecting) })
    observer.observe(end.value)
  }
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <span ref="end" class="service-scroll-end" aria-hidden="true" />
  <div class="service-scroll" :class="{ 'is-visible': visible && documentVisible && !atEnd }" aria-hidden="true">
    <span class="service-scroll__label">Scroll</span>
    <span class="service-scroll__track" />
  </div>
</template>

<style scoped>
.service-scroll-end { display: block; width: 1px; height: 1px; margin-top: -1px; pointer-events: none; }
.service-scroll { position: fixed; z-index: 25; left: 50%; bottom: max(20px, env(safe-area-inset-bottom)); display: flex; flex-direction: column; align-items: center; gap: 6px; color: #bed0c3; pointer-events: none; opacity: 0; visibility: hidden; transform: translate(-50%, 4px); transition: opacity .25s ease, transform .25s ease, visibility .25s; }
.service-scroll.is-visible { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
.service-scroll__label { font-size: 11px; font-weight: 400; line-height: 1.4; white-space: nowrap; }
.service-scroll__track { position: relative; width: 1px; height: 26px; }
.service-scroll__track::before { content: ''; position: absolute; inset: 0; background: currentColor; opacity: .3; }
.service-scroll__track::after { content: ''; position: absolute; top: 0; left: -1px; width: 3px; height: 3px; border-radius: 50%; background: currentColor; box-shadow: 0 0 4px currentColor; filter: blur(.4px); animation: scroll-travel 2.6s linear infinite; animation-play-state: paused; }
.is-visible .service-scroll__track::after { animation-play-state: running; }
:global(.motion-prototype:not(.has-scene)) .service-scroll, :global(.commercial-prototype:not(.has-scene)) .service-scroll { color: #365b46; }
@keyframes scroll-travel {
  0% { opacity: 0; transform: translateY(0); }
  12% { opacity: .9; }
  32% { opacity: .45; }
  52% { opacity: 1; }
  72% { opacity: .55; }
  88% { opacity: .85; }
  96%, 100% { opacity: 0; transform: translateY(23px); }
}
@media (max-width: 700px) { .service-scroll { bottom: max(14px, env(safe-area-inset-bottom)); } }
@media (prefers-reduced-motion: reduce) { .service-scroll { transition: none; } .service-scroll__track::after { animation: none; opacity: .65; transform: translateY(11px); } }
</style>
