<script setup lang="ts">
import type { ResidentialZoomPlan } from '~/utils/residential-zoom'

const props = defineProps<{ destination?: string; duration?: number; zoom?: ResidentialZoomPlan | null; returning?: boolean }>()
const emit = defineEmits<{ complete: [animateArrival: boolean]; cancel: [] }>()
const paper = useTemplateRef<HTMLElement>('paper')
const shade = useTemplateRef<HTMLElement>('shade')
const skipControl = useTemplateRef<HTMLButtonElement>('skipControl')
let fade: Animation | undefined
let camera: Animation[] = []
let completed = false
let disposed = false
let previousOverflow = ''
let reducedMotion: MediaQueryList | undefined

function finish(animateArrival = true) {
  if (completed || disposed) return
  completed = true
  if (!props.returning) {
    if (paper.value) paper.value.style.opacity = '1'
    fade?.cancel()
    // The room now covers the building, so the camera can stay where it landed.
    for (const animation of camera.slice(1)) animation.cancel()
  }
  emit('complete', animateArrival)
}

async function cancel() {
  if (completed || disposed) return
  // Leaving the room has nowhere to go back to, so Escape just lands home.
  if (props.returning) return finish(false)
  completed = true
  fade?.cancel()
  // Pull the camera back out instead of snapping to the wide shot.
  const playing = camera.filter(animation => animation.playState === 'running')
  if (playing.length) {
    try {
      for (const animation of playing) animation.updatePlaybackRate(-2.4)
      await Promise.all(playing.map(animation => animation.finished))
    } catch {}
  }
  if (!disposed) emit('cancel')
}

function startCamera(plan: ResidentialZoomPlan, direction: PlaybackDirection = 'normal') {
  const timing: KeyframeAnimationOptions = { duration: plan.duration, fill: 'both', direction }
  const room = paper.value!.animate(plan.roomKeyframes, timing)
  camera = [
    plan.frame.animate(plan.frameKeyframes, timing),
    room,
    ...(shade.value ? [shade.value.animate(plan.shadeKeyframes, timing)] : []),
  ]
  void room.finished.then(() => finish()).catch(() => {
    if (!completed && !disposed) finish(false)
  })
}

/** Play the entry path backwards: the room shrinks into its window as the building pulls out. */
function playReturn(plan: ResidentialZoomPlan) {
  if (completed || disposed) return
  try {
    startCamera(plan, 'reverse')
  } catch {
    finish(false)
  }
}

defineExpose({ playReturn })

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

  // A return waits for the home page to measure the building and call playReturn.
  if (props.returning) return

  try {
    if (props.zoom) {
      startCamera(props.zoom)
      return
    }
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
  for (const animation of camera) animation.cancel()
  document.documentElement.style.overflow = previousOverflow
  window.removeEventListener('keydown', onKeydown, true)
  reducedMotion?.removeEventListener('change', onMotionChange)
})
</script>

<template>
  <Teleport to="body">
    <div class="residential-transition" role="dialog" aria-modal="true" :aria-label="returning ? 'Returning home' : `Opening ${destination ?? 'Residential'}`">
      <div ref="paper" class="residential-transition__room" :class="{ 'is-zooming': zoom || returning, 'is-returning': returning }" aria-hidden="true">
        <slot>
        <picture>
          <source media="(max-width: 680px)" :srcset="$sitePath('/images/residential/room-hero-mobile-v1.webp')">
          <img :src="$sitePath('/images/residential/room-hero-v1.webp')" width="1672" height="940" alt="" decoding="async">
        </picture>
        <span ref="shade" class="residential-transition__shade" />
        </slot>
      </div>
      <button ref="skipControl" class="residential-transition__skip" type="button" @click="finish(false)">Skip transition</button>
    </div>
  </Teleport>
</template>
