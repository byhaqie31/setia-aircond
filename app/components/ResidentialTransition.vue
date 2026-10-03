<script setup lang="ts">
const props = defineProps<{ destination?: string; duration?: number }>()
const emit = defineEmits<{ complete: [animateArrival: boolean]; cancel: [] }>()
const paper = useTemplateRef<HTMLElement>('paper')
const skipControl = useTemplateRef<HTMLButtonElement>('skipControl')
let fade: Animation | undefined
let completed = false
let disposed = false
let previousOverflow = ''
let reducedMotion: MediaQueryList | undefined

function finish(animateArrival = true) {
  if (completed || disposed) return
  completed = true
  if (paper.value) paper.value.style.opacity = '1'
  fade?.cancel()
  emit('complete', animateArrival)
}

function cancel() {
  if (completed || disposed) return
  completed = true
  fade?.cancel()
  emit('cancel')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    cancel()
  } else if (event.key === 'Tab') {
    event.preventDefault()
    skipControl.value?.focus({ preventScroll: true })
  }
}

function onMotionChange(event: MediaQueryListEvent) {
  if (event.matches) finish(false)
}

onMounted(() => {
  previousOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown, true)
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.addEventListener('change', onMotionChange)
  skipControl.value?.focus({ preventScroll: true })

  if (reducedMotion.matches || !paper.value || typeof paper.value.animate !== 'function') {
    finish(false)
    return
  }

  try {
    // Keep the destination scene transparent during the camera move, then
    // cover the route swap with the same image shown by the destination page.
    fade = paper.value.animate([
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: .56 },
      { opacity: 1, offset: 1 },
    ], {
      duration: props.duration ?? 1050, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards',
    })
    void fade.finished.then(() => finish()).catch(() => {
      if (!completed && !disposed) finish(false)
    })
  } catch {
    finish(false)
  }
})

onBeforeUnmount(() => {
  disposed = true
  fade?.cancel()
  document.documentElement.style.overflow = previousOverflow
  window.removeEventListener('keydown', onKeydown, true)
  reducedMotion?.removeEventListener('change', onMotionChange)
})
</script>

<template>
  <Teleport to="body">
    <div class="residential-transition" role="dialog" aria-modal="true" :aria-label="`Opening ${destination ?? 'Residential'}`">
      <div ref="paper" class="residential-transition__room" aria-hidden="true">
        <slot>
        <picture>
          <source media="(max-width: 680px)" :srcset="$sitePath('/images/residential/room-hero-mobile-v1.webp')">
          <img :src="$sitePath('/images/residential/room-hero-v1.webp')" width="1672" height="940" alt="" decoding="async">
        </picture>
        <span class="residential-transition__shade" />
        </slot>
      </div>
      <button ref="skipControl" class="residential-transition__skip" type="button" @click="finish(false)">Skip transition</button>
    </div>
  </Teleport>
</template>
