<script setup lang="ts">
import { homeChapters } from '~/data/residential'
import { createFrameCache, HOME_FRAME_COUNT, HOME_FRAME_HEIGHT, HOME_FRAME_WIDTH, homeFrameAtProgress, homeFrameUrl } from '~/utils/residential-sequence'

defineProps<{ arriving: boolean }>()
const emit = defineEmits<{ arrived: [] }>()
const root = useTemplateRef<HTMLElement>('root')
const heading = ref<HTMLHeadingElement | null>(null)
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const visual = useTemplateRef<HTMLElement>('visual')
const enhanced = ref(false)
const activeChapter = ref(0)
const paused = ref(false)
const hasFrame = ref(false)
const posterFailed = ref(false)
let disposed = false
let media: { revert: () => void } | undefined
let togglePlayback: (() => void) | undefined
type FrameImage = ImageBitmap | HTMLImageElement

function setHeading(element: unknown) {
  heading.value = element as HTMLHeadingElement | null
}

async function loadFrame(index: number, signal: AbortSignal): Promise<FrameImage> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) controller.abort()
  const timer = window.setTimeout(abort, 8000)
  try {
    const response = await fetch(homeFrameUrl(index), { signal: controller.signal, cache: 'force-cache' })
    if (!response.ok) throw new Error('Frame unavailable')
    const blob = await response.blob()
    if (typeof createImageBitmap === 'function') return await createImageBitmap(blob)
    const url = URL.createObjectURL(blob)
    try {
      const image = new Image()
      image.src = url
      await image.decode()
      return image
    } finally { URL.revokeObjectURL(url) }
  } finally {
    window.clearTimeout(timer)
    signal.removeEventListener('abort', abort)
  }
}

function toggleMotion() {
  paused.value = !paused.value
  togglePlayback?.()
}

function onPosterError() {
  posterFailed.value = true
  media?.revert()
}

function onTitleEnd(event: AnimationEvent) {
  if (event.animationName === 'residential-title-in') emit('arrived')
}

onMounted(async () => {
  heading.value?.focus({ preventScroll: true })
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData || typeof IntersectionObserver === 'undefined') return
  try {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
    if (disposed || posterFailed.value || !root.value || !canvas.value || !visual.value) return
    gsap.registerPlugin(ScrollTrigger)
    media = gsap.matchMedia()
    const match = media as ReturnType<typeof gsap.matchMedia>
    let initialSetup = true
    match.add({
      desktop: '(min-width: 900px) and (min-height: 600px)',
      phone: '(max-width: 899px) and (min-height: 640px)',
      motion: '(prefers-reduced-motion: no-preference)',
    }, context => {
      const conditions = context.conditions
      if (!conditions?.motion || (!conditions.desktop && !conditions.phone) || !root.value || !canvas.value || !visual.value) return
      const wrapper = root.value
      const surface = canvas.value
      const frameContext = surface.getContext('2d')
      if (!frameContext) return
      const chapters = Array.from(wrapper.querySelectorAll<HTMLElement>('.home-chapter'))
      if (chapters.length !== homeChapters.length) return
      const playhead = { progress: 0, frame: 0 }
      let sectionPositions = [0, 1, 2, 3]
      let visible = true
      let animationFrame = 0
      let alive = true
      let lastDrawn = ''
      const release = (image: FrameImage) => { if ('close' in image) image.close(); else image.src = '' }
      const cache = createFrameCache<FrameImage>({
        load: loadFrame, release, changed: requestDraw,
        capacity: conditions.phone ? 12 : 18, radius: conditions.phone ? 4 : 6, concurrency: 3,
      })

      function draw() {
        animationFrame = 0
        if (!alive || !visible || paused.value || document.hidden || !frameContext) return
        const nearest = cache.nearest(playhead.frame)
        if (!nearest) return
        const lowerIndex = Math.floor(playhead.frame)
        const upperIndex = Math.min(HOME_FRAME_COUNT - 1, lowerIndex + 1)
        const lower = cache.get(lowerIndex)
        const upper = cache.get(upperIndex)
        const key = lower && upper ? `${lowerIndex}:${upperIndex}:${playhead.frame.toFixed(2)}` : String(nearest.index)
        if (key === lastDrawn) return
        frameContext.clearRect(0, 0, surface.width, surface.height)
        const blending = Boolean(lower && upper && lowerIndex !== upperIndex)
        const fraction = playhead.frame - lowerIndex
        frameContext.globalCompositeOperation = 'source-over'
        frameContext.globalAlpha = blending ? 1 - fraction : 1
        frameContext.drawImage(lower && upper ? lower : nearest.image, 0, 0, surface.width, surface.height)
        if (blending && upper) {
          frameContext.globalCompositeOperation = 'lighter'
          frameContext.globalAlpha = fraction
          frameContext.drawImage(upper, 0, 0, surface.width, surface.height)
        }
        frameContext.globalCompositeOperation = 'source-over'
        frameContext.globalAlpha = 1
        lastDrawn = key
        hasFrame.value = true
      }
      function requestDraw() {
        if (alive && !animationFrame) animationFrame = requestAnimationFrame(draw)
      }
      function updatePlayback() {
        if (visible && !paused.value && !document.hidden) {
          cache.seek(playhead.frame)
          cache.enable(true)
          requestDraw()
        } else cache.enable(false)
      }
      togglePlayback = updatePlayback
      wrapper.dataset.scrubbing = 'true'
      enhanced.value = true
      activeChapter.value = 0
      surface.width = HOME_FRAME_WIDTH
      surface.height = HOME_FRAME_HEIGHT

      function measureSections() {
        sectionPositions = chapters.map(chapter => chapter.getBoundingClientRect().top)
        playhead.frame = homeFrameAtProgress(playhead.progress, sectionPositions)
        updatePlayback()
      }
      measureSections()

      // CSS keeps the camera in view; real service sections own the scroll distance.
      // Each section arrival corresponds to a composed Blender close-up.
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: chapters[0], start: 'top top',
          endTrigger: chapters[chapters.length - 1], end: 'top top',
          scrub: .6, invalidateOnRefresh: true, onRefresh: measureSections,
        },
      })
      timeline.to(playhead, {
        progress: 1, duration: 3, ease: 'none',
        onUpdate: () => {
          playhead.frame = homeFrameAtProgress(playhead.progress, sectionPositions)
          if (visible && !paused.value && !document.hidden) cache.seek(playhead.frame)
          requestDraw()
        },
      }, 0)
      chapters.forEach((chapter, index) => {
        ScrollTrigger.create({
          trigger: chapter, start: 'top 55%', end: 'bottom 55%',
          onToggle: self => { if (self.isActive) activeChapter.value = index },
        })
      })
      const observer = new IntersectionObserver(entries => {
        visible = Boolean(entries[0]?.isIntersecting)
        updatePlayback()
      }, { rootMargin: '100px' })
      observer.observe(visual.value)
      document.addEventListener('visibilitychange', updatePlayback)
      cache.seek(0)
      if (initialSetup) {
        const linkedTarget = document.getElementById(location.hash.slice(1))
        linkedTarget?.scrollIntoView({ block: 'start', behavior: 'instant' })
      }

      return () => {
        alive = false
        observer.disconnect()
        document.removeEventListener('visibilitychange', updatePlayback)
        cancelAnimationFrame(animationFrame)
        cache.dispose()
        delete wrapper.dataset.scrubbing
        enhanced.value = false
        hasFrame.value = false
        paused.value = false
        togglePlayback = undefined
      }
    }, root.value)
    initialSetup = false
  } catch {
    media?.revert()
  }
})

onBeforeUnmount(() => {
  disposed = true
  media?.revert()
})
</script>

<template>
  <section ref="root" class="home-journey" aria-labelledby="home-heading">
    <div class="home-journey__stage">
      <div ref="visual" class="home-journey__visual">
        <div class="home-journey__picture" :class="{ 'has-frame': hasFrame }">
          <img v-if="!posterFailed" class="home-journey__poster" :src="homeFrameUrl(0)" :width="HOME_FRAME_WIDTH" :height="HOME_FRAME_HEIGHT" fetchpriority="high" alt="An apartment cutaway with a wall-mounted air-conditioner and an electrical service wall." @error="onPosterError">
          <p v-else class="home-journey__fallback">Explore our home services below.</p>
          <canvas ref="canvas" class="home-journey__canvas" :width="HOME_FRAME_WIDTH" :height="HOME_FRAME_HEIGHT" aria-hidden="true" />
        </div>
        <div class="home-journey__camera-controls">
          <span v-if="enhanced" class="home-journey__scroll-cue">Scroll to look closer<span class="icon icon--arrow" aria-hidden="true" /></span>
          <button v-if="enhanced" class="home-motion-control" type="button" :aria-pressed="paused" @click="toggleMotion">{{ paused ? 'Resume camera' : 'Pause camera' }}</button>
        </div>
        <nav class="home-journey__navigation" aria-label="Home service chapters">
          <a v-for="(chapter, index) in homeChapters" :key="chapter.id" :href="`#${chapter.id}`" :aria-current="enhanced && activeChapter === index ? 'step' : undefined">
            <span class="home-journey__step" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>{{ chapter.label }}
          </a>
        </nav>
      </div>

      <div class="home-journey__chapters">
        <article v-for="(chapter, index) in homeChapters" :id="chapter.id" :key="chapter.id" class="home-chapter" tabindex="-1" :aria-labelledby="`${chapter.id}-heading`">
          <header v-if="index === 0" class="home-journey__intro">
            <h1 id="home-heading" :ref="setHeading" tabindex="-1"><span :class="{ 'home-title--arriving': arriving }" @animationend="onTitleEnd">Comfort, built<br>around your home.</span></h1>
            <p>Air-conditioning and electrical services for homes across Kuala Lumpur and Selangor.</p>
          </header>
          <div class="home-chapter__copy">
            <h2 :id="`${chapter.id}-heading`">{{ chapter.title }}</h2>
            <p>{{ chapter.description }}</p>
            <ul><li v-for="service in chapter.services" :key="service">{{ service }}</li></ul>
            <p class="sr-only">{{ chapter.scene }}</p>
          </div>
          <a v-if="index === homeChapters.length - 1" class="home-journey__continue" href="#residential-brands">Find your cooling system<span class="icon icon--arrow" aria-hidden="true" /></a>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-journey { color: var(--pine-900); background: var(--paper); }
.home-journey__stage { display: grid; grid-template-columns: minmax(0, .7fr) minmax(0, 1.3fr); column-gap: clamp(24px, 3vw, 56px); max-width: 1680px; margin-inline: auto; padding-inline: var(--page-gutter); }
.home-journey__visual { position: sticky; top: 0; grid-column: 2; grid-row: 1; align-self: start; min-width: 0; height: min(100svh, 960px); display: flex; flex-direction: column; justify-content: center; }
.home-journey__picture { position: relative; min-height: 0; width: 100%; aspect-ratio: 6 / 5; flex: 0 1 auto; overflow: clip; }
.home-journey__poster, .home-journey__canvas { display: block; width: 100%; height: 100%; object-fit: contain; }
.home-journey__canvas { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
.has-frame .home-journey__canvas { opacity: 1; }
.has-frame .home-journey__poster { opacity: 0; }
.home-journey__fallback { padding: 24px; color: var(--ink-soft); }
.home-journey__chapters { grid-column: 1; grid-row: 1; min-width: 0; }
.home-chapter { display: flex; flex-direction: column; justify-content: center; padding-block: 48px; scroll-margin-top: 16px; }
.home-journey__intro { margin-bottom: 44px; }
.home-journey h1 { margin: 0 0 20px; overflow: clip; overflow-clip-margin: .1em; color: var(--pine-900); font-family: Georgia, 'Times New Roman', serif; font-size: clamp(36px, 3.4vw, 58px); font-weight: 400; line-height: 1.07; letter-spacing: -.025em; }
.home-journey__intro > p { max-width: 38ch; margin: 0; color: var(--ink-soft); font-size: 15px; line-height: 1.65; }
.home-chapter h2 { max-width: 18ch; margin: 0 0 22px; font-family: 'Hanken Grotesk', sans-serif; font-size: clamp(32px, 3vw, 48px); font-weight: 600; line-height: 1.12; letter-spacing: -.025em; text-wrap: balance; }
.home-chapter:first-child h2 { font-size: clamp(24px, 2vw, 30px); max-width: 22ch; }
.home-chapter__copy > p:not(.sr-only) { max-width: 41ch; margin: 0; color: var(--ink-soft); font-size: 16px; line-height: 1.7; }
.home-chapter ul { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 26px 0 0; padding: 0; list-style: none; }
.home-chapter li { font-size: 12px; font-weight: 600; color: var(--pine-700); }
.home-chapter li + li::before { content: '/'; margin-right: 16px; font-weight: 400; color: var(--ink-soft); }
.home-journey__camera-controls { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex: 0 0 auto; min-height: 44px; }
.home-journey__scroll-cue { display: inline-flex; align-items: center; gap: 10px; color: var(--ink-soft); font-size: 12px; }
.home-journey__scroll-cue .icon { height: 13px; width: 13px; transform: rotate(90deg); }
.home-motion-control { min-height: 44px; padding: 8px 0 8px 12px; border: 0; color: var(--pine-700); background: transparent; font-size: 12px; cursor: pointer; text-underline-offset: 4px; }
.home-motion-control:hover { text-decoration: underline; }
.home-journey__navigation { display: grid; grid-template-columns: repeat(4, 1fr); flex: 0 0 auto; border-top: 1px solid var(--line); }
.home-journey__navigation a { position: relative; display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 10px 0; color: var(--ink-soft); font-size: 14px; text-underline-offset: 4px; }
.home-journey__navigation a::before { position: absolute; content: ''; top: -1px; inset-inline: 0 16px; height: 2px; background: var(--pine-700); transform: scaleX(0); transform-origin: left; transition: transform .24s ease; }
.home-journey__navigation a[aria-current] { color: var(--pine-900); font-weight: 700; }
.home-journey__navigation a[aria-current]::before { transform: scaleX(1); }
.home-journey__navigation a:hover { color: var(--pine-900); text-decoration: underline; }
.home-journey__step { font-size: 10px; font-variant-numeric: tabular-nums; }
.home-journey__continue { display: inline-flex; align-self: start; align-items: center; gap: 12px; min-height: 44px; margin-top: 32px; font-size: 14px; color: var(--pine-700); text-underline-offset: 4px; }
.home-journey__continue:hover { text-decoration: underline; }
.home-journey__continue .icon { height: 16px; width: 16px; }
.home-title--arriving { animation: residential-title-in .62s cubic-bezier(.16, 1, .3, 1) both; }
.home-journey[data-scrubbing] .home-chapter { min-height: 100svh; scroll-margin-top: 0; }
.home-journey[data-scrubbing] .home-journey__visual { height: 100svh; }
.home-journey[data-scrubbing] .home-journey__picture { max-height: calc(100svh - 128px); }

@media (max-width: 899px) {
  .home-journey__stage { display: block; padding-inline: 24px; }
  .home-journey__visual { position: relative; height: auto; margin-inline: -8px; }
  .home-journey__picture { width: 100%; max-height: 60svh; }
  .home-journey h1 { font-size: clamp(36px, 7vw, 48px); }
  .home-journey__intro { margin-bottom: 36px; }
  .home-journey__intro > p { font-size: 14px; }
  .home-chapter { padding-block: 36px; }
  .home-chapter h2 { max-width: 21ch; font-size: clamp(30px, 6vw, 40px); }
  .home-chapter:first-child h2 { font-size: 26px; }
  .home-chapter__copy > p:not(.sr-only) { max-width: 46ch; font-size: 15px; line-height: 1.65; }
  .home-chapter ul { margin-top: 20px; gap: 6px 10px; }
  .home-chapter li { font-size: 11px; }
  .home-chapter li + li::before { margin-right: 10px; }
  .home-journey__navigation a { min-height: 44px; gap: 6px; font-size: 12px; }
  .home-journey__scroll-cue, .home-motion-control { font-size: 11px; }
  .home-journey[data-scrubbing] .home-journey__visual { position: sticky; top: 0; z-index: 2; height: 48svh; margin-bottom: -48svh; background: var(--paper); }
  .home-journey[data-scrubbing] .home-journey__picture { flex: 1 1 auto; max-height: none; }
  .home-journey[data-scrubbing] .home-chapter { min-height: 110svh; padding-top: calc(48svh + 28px); padding-bottom: 72px; justify-content: start; }
  .home-journey[data-scrubbing] .home-chapter:first-child { min-height: 135svh; }
  .home-journey[data-scrubbing] .home-chapter:last-child { min-height: 130svh; }
}
@media (prefers-reduced-motion: reduce) {
  .home-title--arriving { animation: none; }
  .home-journey__navigation a::before { transition: none; }
}
@media print {
  .home-journey__stage { display: block; }
  .home-journey__visual { position: static !important; height: auto !important; margin: 0 !important; }
  .home-chapter { min-height: 0 !important; padding-block: 24px !important; }
  .home-journey__navigation, .home-journey__camera-controls { display: none; }
}
</style>
