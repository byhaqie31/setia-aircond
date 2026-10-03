<script setup lang="ts">
import type { RouteLocationNormalized } from 'vue-router'
import type { BuildingFloor } from '~/utils/navigation'
import { waitForPageAssets } from '~/utils/page-loading'

const router = useRouter()
const nuxtApp = useNuxtApp()
const supportsLoader = (path: string) => ['/', '/about-us', '/get-a-quote'].includes(path.replace(/\/+$/, '') || '/')
const startup = Boolean(nuxtApp.ssrContext || nuxtApp.isHydrating) && supportsLoader(router.currentRoute.value.path)
const serviceReturn = useState<BuildingFloor | null>('service-return', () => null)
const content = useTemplateRef<HTMLElement>('content')
const cover = useTemplateRef<HTMLElement>('cover')
const active = ref(startup)
const branded = ref(startup)
const initialCover = ref(startup)
const mounted = ref(false)
const opening = ref(false)
const blackFade = ref(false)
let loadingRequest: AbortController | undefined
let skipAssets = false
let disposed = false
let generation = 0
let destination: string | undefined
let animation: Animation | undefined
let readyFrame: number | undefined
let deadline: ReturnType<typeof setTimeout> | undefined
let previousOverflow = ''
let previousFocus: HTMLElement | null = null
let preference: MediaQueryList | undefined
const removeHooks: Array<() => void> = []

// Server-rendered pages remain readable without JavaScript.
useHead({ noscript: [{ innerHTML: '<style>.site-page-cover{display:none!important}</style>' }] })

function cancelAnimation() {
  animation?.cancel()
  animation = undefined
}

function clearPending() {
  loadingRequest?.abort()
  loadingRequest = undefined
  cancelAnimation()
  if (readyFrame !== undefined) cancelAnimationFrame(readyFrame)
  readyFrame = undefined
  clearTimeout(deadline)
}

function finish(arrived = false) {
  const wasActive = active.value
  const attempt = generation
  const restoreFocus = previousFocus
  clearPending()
  destination = undefined
  if (!wasActive) return
  active.value = false
  initialCover.value = false
  opening.value = false
  document.documentElement.style.overflow = previousOverflow
  if (cover.value) {
    cover.value.style.opacity = '0'
    cover.value.style.clipPath = 'inset(0)'
  }
  void nextTick(() => {
    if (disposed || active.value || attempt !== generation) return
    if (arrived) {
      const target = content.value?.querySelector<HTMLElement>('.cooling-loader:not([inert]) .cooling-loader__continue')
        ?? content.value?.querySelector<HTMLElement>('main[tabindex="-1"], h1[tabindex="-1"]')
        ?? content.value
      target?.focus({ preventScroll: true })
    } else if (restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true })
  })
}

async function animate(keyframes: Keyframe[], duration: number, easing: string) {
  if (!cover.value || preference?.matches || document.hidden) return
  try {
    const current = cover.value.animate(keyframes, { duration, easing, fill: 'forwards' })
    animation = current
    await current.finished.catch(() => {})
  } catch {
    // Route navigation must remain usable when animation is unavailable.
  }
}

async function reveal(attempt: number) {
  if (disposed || !active.value || attempt !== generation) return
  opening.value = true
  if (blackFade.value) await animate([{ opacity: '1' }, { opacity: '0' }], 160, 'ease-out')
  else await animate([{ clipPath: 'inset(0)' }, { clipPath: 'inset(0 0 100% 0)' }], 560, 'cubic-bezier(.76, 0, .24, 1)')
  if (!disposed && attempt === generation) finish(true)
}

async function pageReady() {
  if (!active.value || router.currentRoute.value.fullPath !== destination) return
  const attempt = generation
  loadingRequest?.abort()
  const request = new AbortController()
  loadingRequest = request
  if (branded.value && !skipAssets) {
    await waitForPageAssets(router.currentRoute.value.path.replace(/\/+$/, '') || '/', nuxtApp.$sitePath, request.signal).catch(() => {})
  }
  if (disposed || !active.value || attempt !== generation || loadingRequest !== request) return
  if (readyFrame !== undefined) cancelAnimationFrame(readyFrame)
  // Nuxt restores scroll after page:loading:end. Let that happen under the cover.
  readyFrame = requestAnimationFrame(() => {
    readyFrame = requestAnimationFrame(() => {
      readyFrame = undefined
      void reveal(attempt)
    })
  })
}

/** A floor whose opening scene is still on screen hands the home page a matched frame to pull out of. */
function matchedReturn(from: RouteLocationNormalized, to: RouteLocationNormalized): BuildingFloor | null {
  if ((to.path.replace(/\/+$/, '') || '/') !== '/' || preference?.matches || document.hidden) return null
  const path = from.path.replace(/\/+$/, '')
  if (path === '/residential') return 'residential'
  if (path === '/commercial' && document.querySelector('.commercial-view .commercial-building-scene:not(.is-exiting)')) return 'commercial'
  return null
}

function openPageNow() {
  skipAssets = true
  loadingRequest?.abort()
}

function onMotionChange() {
  if (preference?.matches) finish()
}

function onVisibilityChange() {
  if (document.hidden) finish()
}

onMounted(() => {
  mounted.value = true
  preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference.addEventListener('change', onMotionChange)
  document.addEventListener('visibilitychange', onVisibilityChange)
  if (startup) {
    previousOverflow = document.documentElement.style.overflow
    previousFocus = document.activeElement as HTMLElement | null
    document.documentElement.style.overflow = 'hidden'
    destination = router.currentRoute.value.fullPath
    if (preference.matches || document.hidden) finish(true)
    else {
      cover.value!.style.opacity = '1'
      deadline = setTimeout(() => finish(true), 6000)
      void pageReady()
    }
  }
  removeHooks.push(router.beforeEach(async (to, from) => {
    if (to.path === from.path) {
      if (active.value) { generation++; finish() }
      return
    }
    const attempt = ++generation
    // The home page pulls its camera back out of the floor's scene instead of showing the loader.
    const returningFrom = matchedReturn(from, to)
    serviceReturn.value = returningFrom
    if (returningFrom) {
      finish()
      return
    }
    blackFade.value = from.path === '/' && to.path === '/commercial'
    // The matched entry cover already fills the viewport before router.push.
    const coveredByBuilding = from.path === '/' && ['/residential', '/commercial'].includes(to.path)
      && document.querySelector<HTMLElement>('.residential-transition__room')?.style.opacity === '1'
    if (disposed || !from.matched.length || preference?.matches || document.hidden || !cover.value?.animate || coveredByBuilding) {
      finish()
      return
    }
    const start = getComputedStyle(cover.value)
    const opacity = active.value ? start.opacity : '0'
    const clipPath = active.value ? start.clipPath : 'inset(0)'
    clearPending()
    branded.value = supportsLoader(to.path)
    opening.value = false
    skipAssets = false
    destination = to.fullPath
    if (!active.value) {
      previousOverflow = document.documentElement.style.overflow
      previousFocus = document.activeElement as HTMLElement | null
      active.value = true
      document.documentElement.style.overflow = 'hidden'
    }
    cover.value.style.opacity = opacity
    cover.value.style.clipPath = clipPath
    // Never leave the site covered if routing or an animation stalls.
    deadline = setTimeout(() => finish(), 6000)
    await nextTick()
    if (disposed || attempt !== generation) return false
    await animate([{ opacity, clipPath }, { opacity: '1', clipPath: 'inset(0)' }], blackFade.value ? 120 : 280, 'cubic-bezier(.4, 0, .2, 1)')
    if (disposed || attempt !== generation) return false
    if (active.value && cover.value) {
      cover.value.style.opacity = '1'
      cover.value.style.clipPath = 'inset(0)'
      cancelAnimation()
    }
  }))
  removeHooks.push(router.afterEach((to, _from, failure) => {
    if (failure && to.fullPath === destination) finish()
  }))
  removeHooks.push(router.onError((_error, to) => {
    if (to.fullPath === destination) finish()
  }))
  removeHooks.push(nuxtApp.hook('page:loading:end', pageReady))
  removeHooks.push(nuxtApp.hook('app:error', () => finish()))
})

onBeforeUnmount(() => {
  disposed = true
  generation++
  finish()
  for (const remove of removeHooks) remove()
  preference?.removeEventListener('change', onMotionChange)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <div ref="content" class="site-page-content" :inert="mounted && active || undefined" :aria-busy="mounted && active || undefined" tabindex="-1">
    <slot />
  </div>
  <Teleport to="#teleports">
    <div ref="cover" class="site-page-cover" :class="{ 'is-active': active, 'is-initial': initialCover, 'is-opening': opening, 'is-black-fade': blackFade }" :aria-hidden="!active || !branded || opening ? true : undefined" :inert="opening || undefined">
      <template v-if="active && branded">
        <CoolingLoadingIdentity />
        <button class="site-page-cover__continue" type="button" @click="openPageNow">Open page now<span class="icon icon--arrow" aria-hidden="true" /></button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.site-page-content:focus { outline: none; }
.site-page-cover { position: fixed; inset: 0; z-index: 110; display: grid; grid-template-rows: 1fr auto 1fr; justify-items: center; padding: 32px 24px; overflow: auto; visibility: hidden; pointer-events: none; color: #f5f5ed; background: var(--service-stage); opacity: 0; clip-path: inset(0); }
.site-page-cover.is-active { visibility: visible; pointer-events: auto; }
.site-page-cover.is-initial { opacity: 1; }
.site-page-cover.is-black-fade { background:#000; }
.site-page-cover__continue { grid-row: 3; align-self: end; display: inline-flex; align-items: center; gap: 12px; min-height: 44px; margin-top: 32px; padding: 10px 8px; border: 0; color: #bed0c3; background: transparent; font-size: 13px; cursor: pointer; }
.site-page-cover__continue .icon { width: 16px; height: 16px; }
.site-page-cover__continue:hover { color: #f5f5ed; text-decoration: underline; text-underline-offset: 5px; }
.site-page-cover__continue:focus-visible { outline: 2px solid #bed0c3; outline-offset: 5px; }
.site-page-cover :deep(.cooling-loader__identity) { transition: opacity .24s ease-out; }
.site-page-cover.is-opening :deep(.cooling-loader__identity) { opacity: 0; }
.site-page-cover.is-opening :deep(.cooling-loader__flow) { animation-play-state: paused; }
.site-page-cover.is-opening .site-page-cover__continue { opacity: 0; transition: opacity .15s ease-out; }
@media (prefers-reduced-motion: reduce) { .site-page-cover :deep(.cooling-loader__identity), .site-page-cover__continue { transition: none !important; } }
</style>
