import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default defineNuxtPlugin((nuxtApp) => {
  gsap.registerPlugin(ScrollTrigger)
  const lenis = new Lenis({
    lerp: .1,
    autoRaf: false,
    autoToggle: true,
    smoothWheel: true,
    // Keep page easing over form controls. Only overflowing inner content,
    // such as a long message, should receive native scroll until its boundary.
    allowNestedScroll: true,
    syncTouch: false,
    respectReducedMotion: true,
    // The service stories map anchors into pinned timelines themselves.
    anchors: false,
    prevent: node => node.matches('.cooling-loader, [data-lenis-prevent]'),
  })
  const tick = (seconds: number) => lenis.raf(seconds * 1000)
  const update = () => ScrollTrigger.update()
  const resize = () => lenis.resize()
  let navigationFrame: number | undefined
  const cancelInertia = () => {
    lenis.scrollTo(lenis.actualScroll, { immediate: true, force: true })
    if (navigationFrame !== undefined) cancelAnimationFrame(navigationFrame)
    // Immediate scrollTo suppresses one native scroll event. Resync after the
    // link's default action or story handler has moved to its actual destination.
    navigationFrame = requestAnimationFrame(() => {
      navigationFrame = undefined
      resize()
    })
  }
  const onLink = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (event.target instanceof Element && event.target.closest('a[href]')) cancelInertia()
  }

  lenis.on('scroll', update)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  ScrollTrigger.addEventListener('refresh', resize)
  // Cancel smoothing before native anchors, skip links, or Vue's route handlers run.
  document.addEventListener('click', onLink, true)
  const removeGuard = useRouter().beforeEach(cancelInertia)
  const removeFinishHook = nuxtApp.hook('page:finish', resize)
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    if (navigationFrame !== undefined) cancelAnimationFrame(navigationFrame)
    removeGuard()
    removeFinishHook()
    document.removeEventListener('click', onLink, true)
    ScrollTrigger.removeEventListener('refresh', resize)
    gsap.ticker.remove(tick)
    lenis.off('scroll', update)
    lenis.destroy()
  }
  const scrollTo = (target: number | HTMLElement, options: { immediate?: boolean; onComplete?: () => void } = {}) => {
    if (disposed) return
    // A programmatic journey owns its destination; discard the native-link resync.
    if (navigationFrame !== undefined) {
      cancelAnimationFrame(navigationFrame)
      navigationFrame = undefined
    }
    resize()
    lenis.scrollTo(target, {
      duration: 1.8,
      lerp: 0,
      easing: t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2,
      immediate: options.immediate ?? false,
      // Restore direct contact hashes while the loading curtain still locks input.
      force: options.immediate ? true : undefined,
      onComplete: options.onComplete,
    })
  }
  nuxtApp.vueApp.onUnmount(dispose)
  if (import.meta.hot) import.meta.hot.dispose(dispose)
  return { provide: { scrollTo } }
})
