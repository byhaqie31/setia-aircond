<script setup lang="ts">
// `threshold` is how many viewport heights count as having scrolled: a threshold control appears
// there, while a control kept on screen from the start with `shown` switches there from home to
// back to top. `focusTarget` receives focus once a back-to-top journey lands. The home action
// links to `homeTo`, or with `homeTo` null it emits `home` for the page to handle in place.
const props = withDefaults(defineProps<{ threshold?: number; shown?: boolean; focusTarget?: string; homeTo?: string | null; homeLabel?: string; homeIcon?: string }>(), {
  threshold: .6, shown: false, focusTarget: '#page-content', homeTo: '/', homeLabel: 'Back to home', homeIcon: 'icon--home',
})
// `top` fires once a back-to-top journey has landed, for pages whose first section lies beyond the scroll.
const emit = defineEmits<{ home: []; top: [] }>()
const { $scrollTo } = useNuxtApp()
const visible = ref(false)
const mode = ref<'home' | 'top'>('home')
let lastY = 0
let frame: number | undefined

// A control shown from the start reads position alone: home while the first screen is on view,
// back to top once the page has scrolled past it. A threshold control appears past the threshold
// and reads the scroll direction with a little slack so a slow or jittery wheel does not flicker
// it: moving down offers home, moving back up offers the top of the page.
function measure() {
  frame = undefined
  const y = window.scrollY
  const scrolled = y > window.innerHeight * props.threshold
  if (props.shown) {
    mode.value = scrolled ? 'top' : 'home'
  } else if (Math.abs(y - lastY) > 8) {
    mode.value = y < lastY ? 'top' : 'home'
    lastY = y
  }
  visible.value = props.shown || scrolled
}

function onScroll() {
  if (frame === undefined) frame = requestAnimationFrame(measure)
}

function toTop() {
  mode.value = 'top'
  $scrollTo(0, {
    immediate: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // Focus follows the journey so keyboard users do not stay on an off-screen button; the
    // frame's delay lets a scroll-driven scene lift any inert state first.
    onComplete: () => requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(props.focusTarget)?.focus({ preventScroll: true })
      emit('top')
    }),
  })
}

watch(() => props.shown, measure)

onMounted(() => {
  lastY = window.scrollY
  measure()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (frame !== undefined) cancelAnimationFrame(frame)
})
</script>

<template>
  <div class="floating-return" :class="{ 'is-visible': visible, 'is-top': mode === 'top' }" :inert="!visible" :aria-hidden="!visible || undefined">
    <NuxtLink v-if="homeTo" class="floating-return__control floating-return__home" :to="homeTo" :aria-label="homeLabel" :data-tip="homeLabel" :inert="mode !== 'home'" :aria-hidden="mode !== 'home' || undefined">
      <span class="icon" :class="homeIcon" aria-hidden="true" />
    </NuxtLink>
    <button v-else class="floating-return__control floating-return__home" type="button" :aria-label="homeLabel" :data-tip="homeLabel" :inert="mode !== 'home'" :aria-hidden="mode !== 'home' || undefined" @click="emit('home')">
      <span class="icon" :class="homeIcon" aria-hidden="true" />
    </button>
    <button class="floating-return__control floating-return__top" type="button" aria-label="Back to top" data-tip="Back to top" :inert="mode !== 'top'" :aria-hidden="mode !== 'top' || undefined" @click="toTop">
      <span class="icon icon--arrow floating-return__up" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
/* A round button floating clear of the corner, in the contact bar's black and green. */
.floating-return { position: fixed; left: clamp(24px, 5vw, 100px); bottom: max(32px, calc(env(safe-area-inset-bottom) + 16px)); z-index: 25; box-sizing: border-box; width: 56px; height: 56px; border: 1px solid #ffffff1f; border-radius: 50%; color: #bed0c3; background: #000; box-shadow: 0 10px 28px #0000004d; opacity: 0; transform: translateY(12px) scale(.9); pointer-events: none; transition: opacity .2s ease, transform .38s cubic-bezier(.22, 1, .36, 1), background-color .24s ease, border-color .24s ease; }
.floating-return.is-visible { opacity: 1; transform: none; pointer-events: auto; }
.floating-return:hover, .floating-return:focus-within { --return-surface: #006600; border-color: #ffffff2e; color: #f8fbf8; background: var(--return-surface); }
.floating-return__control { position: absolute; inset: 0; display: grid; place-items: center; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; border-radius: 50%; color: inherit; background: none; font: inherit; cursor: pointer; opacity: 0; transform: translateY(8px) scale(.8); transition: opacity .18s ease, transform .3s cubic-bezier(.22, 1, .36, 1); }
/* The two controls roll past each other in the direction of travel: home rises out as the arrow comes up from below, and back again. */
.floating-return__home { opacity: 1; transform: none; }
.floating-return.is-top .floating-return__home { opacity: 0; transform: translateY(-8px) scale(.8); }
.floating-return.is-top .floating-return__top { opacity: 1; transform: none; }
.floating-return__control:focus-visible { outline: 2px solid #d1e4d7; outline-offset: 3px; }
.floating-return .icon { width: 20px; height: 20px; }
.floating-return__up { transform: rotate(-90deg); }
/* The label sits to the right of the button, away from the screen edge. */
.floating-return__control::after { position: absolute; left: calc(100% + 14px); top: 50%; padding: 6px 10px; border-radius: 4px; color: #f8fbf8; background: var(--return-surface, #000); font-size: 13px; font-weight: 600; white-space: nowrap; opacity: 0; transform: translate(-4px, -50%); pointer-events: none; transition: opacity .16s ease, transform .2s cubic-bezier(.22, 1, .36, 1); content: attr(data-tip); }
.floating-return__control:hover::after, .floating-return__control:focus-visible::after { opacity: 1; transform: translate(0, -50%); }
/* The loading covers keep their own layer in the DOM until their exit motion finishes. */
:global(body:has(.site-page-cover.is-active) .floating-return), :global(body:has(.cooling-loader) .floating-return) { display: none; }
/* Commercial moves between its scenes in place; the control steps aside like the contact bar does. */
:global(body:has(.commercial-view.is-transitioning) .floating-return) { opacity: 0; visibility: hidden; pointer-events: none; }
@media (max-width: 1023px) {
  .floating-return { left: max(18px, env(safe-area-inset-left)); width: 50px; height: 50px; }
  .floating-return .icon { width: 18px; height: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .floating-return, .floating-return__control, .floating-return__control::after { transition: none; }
}
</style>
