<script setup lang="ts">
const { $scrollTo } = useNuxtApp()
const visible = ref(false)
const mode = ref<'home' | 'top'>('home')
let lastY = 0
let frame: number | undefined

// The control appears once the header's home link has scrolled away. It reads the
// scroll direction with a little slack so a slow or jittery wheel does not flicker it:
// moving down offers home, moving back up offers the top of the page.
function measure() {
  frame = undefined
  const y = window.scrollY
  const delta = y - lastY
  if (Math.abs(delta) > 8) {
    mode.value = delta < 0 ? 'top' : 'home'
    lastY = y
  }
  visible.value = y > window.innerHeight * .6
}

function onScroll() {
  if (frame === undefined) frame = requestAnimationFrame(measure)
}

function toTop() {
  mode.value = 'top'
  $scrollTo(0, {
    immediate: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // Focus follows the journey so keyboard users do not stay on an off-screen button.
    onComplete: () => document.getElementById('page-content')?.focus({ preventScroll: true }),
  })
}

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
    <NuxtLink class="floating-return__control floating-return__home" to="/" aria-label="Back to home" data-tip="Back to home" :inert="mode !== 'home'" :aria-hidden="mode !== 'home' || undefined">
      <span class="icon icon--home" aria-hidden="true" />
    </NuxtLink>
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
@media (max-width: 1023px) {
  .floating-return { left: max(18px, env(safe-area-inset-left)); width: 50px; height: 50px; }
  .floating-return .icon { width: 18px; height: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .floating-return, .floating-return__control, .floating-return__control::after { transition: none; }
}
</style>
