<script setup lang="ts">
import { homeChapters } from '~/data/residential'
import { airConditioningBrands, residentialBrandLogos, airConditioningEnquiry, airConditioningIntro, airConditioningServices } from '~/data/air-conditioning'
import { PROTOTYPE_STOPS, prototypeCopyAt, prototypePoseAt, prototypeUpgradeAt } from '~/utils/residential-prototype-path'
import { EQUIPMENT_END, RESIDENTIAL_STORY_SCREENS, RESIDENTIAL_BRANDS_STOP, RESIDENTIAL_CONTACT_STOP, residentialStoryAt } from '~/utils/residential-story'
import type { createPrototypeRenderer } from '~/utils/residential-prototype-scene'

const electrical = homeChapters.find(chapter => chapter.id === 'home-electrical')!
const chapters = [
  { id: 'air-conditioning-overview', label: 'Overview', number: null, ...airConditioningIntro, services: [] as readonly string[], position: 'intro' },
  ...airConditioningServices.map((service, index) => ({ ...service, services: [] as readonly string[], position: index % 2 === 0 ? 'left' : 'right' })),
  { ...electrical, label: 'Electrical', number: null, position: 'left' },
].map(chapter => ({ ...chapter, anchor: `motion-${chapter.id}` }))
const root = useTemplateRef<HTMLElement>('root')
const { $sitePath } = useNuxtApp()
const stage = useTemplateRef<HTMLElement>('stage')
const host = useTemplateRef<HTMLElement>('host')
const brands = useTemplateRef<HTMLElement>('brands')
const contact = useTemplateRef<HTMLElement>('contact')
const enhanced = ref(false)
const brandsVisible = ref(true)
const contactVisible = ref(true)
const contactDetailsVisible = ref(true)
const contactOverflow = ref(0)
const upgradeProgress = ref(0)
const panelVisible = ref(chapters.map(() => true))
const status = ref<'loading' | 'ready' | 'reading' | 'reduced' | 'unavailable'>('loading')
let view: ReturnType<typeof createPrototypeRenderer> | undefined
let motion: { revert: () => void } | undefined
let scrollRange: { start: number; end: number } | undefined
let resizeObserver: ResizeObserver | undefined
let intersectionObserver: IntersectionObserver | undefined
let preference: MediaQueryList | undefined
let alive = true
let generation = 0
let panels: HTMLElement[] = []
let brandWords: HTMLElement[] = []
let story = residentialStoryAt(0, airConditioningBrands.length)
let jumpToProgress: ((value: number) => void) | undefined
let airflowFrame = 0
let airflowTime = 0
let lastAirflowFrame = 0
let airflowActive = false
let onScreen = false
let stopContextListener = () => {}
let productRequest: AbortController | undefined
let loadingDeadline: ReturnType<typeof setTimeout> | undefined

// Keep the server-rendered reading view accessible when JavaScript is disabled.
useHead({ noscript: [{ innerHTML: `<style>
  .cooling-loader { display: none !important; }
  .motion-prototype.is-loading { height: auto !important; overflow: visible !important; }
  .motion-prototype.is-loading > :is(.motion-story, .skip-link) { visibility: visible !important; opacity: 1 !important; }
</style>` }] })

function syncAirflow() {
  const running = alive && enhanced.value && onScreen && airflowActive && !document.hidden
  if (running && !airflowFrame) {
    lastAirflowFrame = 0
    airflowFrame = requestAnimationFrame(animateAirflow)
  } else if (!running && airflowFrame) {
    cancelAnimationFrame(airflowFrame)
    airflowFrame = 0
  }
}

function animateAirflow(now: number) {
  airflowFrame = 0
  if (!alive || !enhanced.value || !onScreen || !airflowActive || document.hidden) return
  if (!lastAirflowFrame) lastAirflowFrame = now
  const elapsed = now - lastAirflowFrame
  if (elapsed >= 1000 / 30) {
    airflowTime += Math.min(elapsed, 80) / 1000
    lastAirflowFrame = now
    view?.render(story.equipmentProgress, airflowTime)
  }
  airflowFrame = requestAnimationFrame(animateAirflow)
}

function disposeMotion() {
  clearTimeout(loadingDeadline)
  loadingDeadline = undefined
  productRequest?.abort()
  productRequest = undefined
  if (airflowFrame) cancelAnimationFrame(airflowFrame)
  airflowFrame = 0
  airflowActive = false
  intersectionObserver?.disconnect()
  intersectionObserver = undefined
  stopContextListener()
  stopContextListener = () => {}
  resizeObserver?.disconnect()
  resizeObserver = undefined
  motion?.revert()
  motion = undefined
  scrollRange = undefined
  jumpToProgress = undefined
  view?.dispose()
  view = undefined
  enhanced.value = false
  brandsVisible.value = true
  contactVisible.value = true
  contactDetailsVisible.value = true
  contactOverflow.value = 0
  panelVisible.value = chapters.map(() => true)
  for (const panel of panels) {
    panel.style.removeProperty('opacity')
    panel.style.removeProperty('transform')
  }
  root.value?.removeAttribute('style')
  for (const word of brandWords) {
    word.style.removeProperty('--brand-reveal')
    word.removeAttribute('aria-hidden')
  }
}

function renderProgress(value: number) {
  story = residentialStoryAt(value, airConditioningBrands.length)
  const pose = prototypePoseAt(story.equipmentProgress)
  const upgrade = prototypeUpgradeAt(pose.replacement)
  upgradeProgress.value = upgrade.incoming
  airflowActive = pose.airflow > .005 && !upgrade.active && story.equipmentOpacity > .01
  panels.forEach((panel, index) => {
    const copy = prototypeCopyAt(story.equipmentProgress, index)
    copy.opacity *= story.equipmentOpacity
    panel.style.opacity = String(copy.opacity)
    panel.style.transform = `translate3d(0, ${copy.y}px, 0)`
    panelVisible.value[index] = copy.opacity > .05
  })
  const properties = {
    '--equipment-opacity': story.equipmentOpacity,
    '--brands-opacity': story.brandsOpacity,
    '--brands-exit': story.brandsExit,
    '--brand-title': story.brandTitle,
    '--contact-opacity': story.contactOpacity,
    '--contact-title': story.contactTitle,
    '--contact-team': story.contactTeam,
    '--contact-details': story.contactDetails,
  }
  for (const [name, amount] of Object.entries(properties)) root.value?.style.setProperty(name, String(amount))
  brandWords.forEach((word, index) => {
    const amount = story.brandReveals[index] ?? 0
    word.style.setProperty('--brand-reveal', String(amount))
    word.setAttribute('aria-hidden', String(amount < .05))
  })
  brandsVisible.value = story.brandsOpacity > .05
  contactVisible.value = story.contactOpacity > .1
  contactDetailsVisible.value = story.contactDetails > .1
  if (!document.hidden && story.equipmentOpacity > 0) view?.render(story.equipmentProgress, airflowTime)
  syncAirflow()
}

function measureContactOverflow() {
  if (!enhanced.value || !contact.value || !stage.value) return
  // The equipment story stays pinned; the full contact grid continues in
  // document flow once that story ends on a phone or a shorter viewport.
  contactOverflow.value = Math.max(0, contact.value.clientHeight - stage.value.clientHeight)
}

function failPreview() {
  generation++
  disposeMotion()
  revealView('unavailable')
}

function revealView(next: Exclude<typeof status.value, 'loading'>) {
  clearTimeout(loadingDeadline)
  loadingDeadline = undefined
  const restoreFocus = Boolean(document.activeElement?.closest('.cooling-loader'))
  const current = generation
  status.value = next
  if (restoreFocus) void nextTick(() => {
    if (alive && generation === current) root.value?.focus({ preventScroll: true })
  })
}

function viewServices() {
  generation++
  disposeMotion()
  revealView('reading')
}

function onVisibilityChange() {
  if (!document.hidden && story.equipmentOpacity > 0) view?.render(story.equipmentProgress, airflowTime)
  syncAirflow()
}

function followStoryHash(focus = false) {
  if (!enhanced.value || !jumpToProgress) return
  const linked = chapters.findIndex(chapter => `#${chapter.anchor}` === location.hash)
  let destination: number | undefined
  if (linked >= 0) destination = PROTOTYPE_STOPS[linked]! * EQUIPMENT_END
  else if (location.hash === '#prototype-brands') destination = RESIDENTIAL_BRANDS_STOP
  else if (['#prototype-contact', '#prototype-services'].includes(location.hash)) destination = RESIDENTIAL_CONTACT_STOP
  if (destination === undefined) return
  jumpToProgress(destination)
  if (focus && destination === RESIDENTIAL_CONTACT_STOP) void nextTick(() => contact.value?.focus({ preventScroll: true }))
}

function skipToEnquiry(event: MouseEvent) {
  if (!enhanced.value || !jumpToProgress || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  history.replaceState(history.state, '', '#prototype-contact')
  followStoryHash(true)
}

async function initialize() {
  const current = ++generation
  disposeMotion()
  if (!alive || !root.value || !host.value || !stage.value) return
  if (preference?.matches) {
    revealView('reduced')
    return
  }
  status.value = 'loading'
  // A stalled module download must not leave the full-screen cover up forever.
  loadingDeadline = setTimeout(() => {
    if (alive && generation === current) failPreview()
  }, 15_000)
  try {
    const [{ createPrototypeRenderer }, { loadResidentialProduct, disposeProductAsset }, { gsap }, { ScrollTrigger }] = await Promise.all([
      import('~/utils/residential-prototype-scene'), import('~/utils/residential-product'), import('gsap'), import('gsap/ScrollTrigger'),
    ])
    if (!alive || generation !== current || !host.value || !root.value) return
    const request = new AbortController()
    productRequest = request
    const product = await loadResidentialProduct(request.signal, $sitePath('/models/residential/ac-product-v1.glb'))
    if (!alive || generation !== current || !host.value || !root.value) {
      if (product) disposeProductAsset(product)
      return
    }
    productRequest = undefined
    gsap.registerPlugin(ScrollTrigger)
    panels = Array.from(root.value.querySelectorAll<HTMLElement>('[data-motion-copy]'))
    brandWords = Array.from(brands.value?.querySelectorAll<HTMLElement>('[data-brand-item]') ?? [])
    view = createPrototypeRenderer(host.value, product)
    const onContextLost = (event: Event) => { event.preventDefault(); failPreview() }
    const canvas = view.canvas
    canvas.addEventListener('webglcontextlost', onContextLost)
    stopContextListener = () => canvas.removeEventListener('webglcontextlost', onContextLost)
    enhanced.value = true
    await nextTick()
    if (!alive || generation !== current || !view || !root.value || !stage.value) return
    view.resize()
    const clock = { progress: 0 }
    motion = gsap.context(() => {
      const tween = gsap.fromTo(clock, { progress: 0 }, {
        progress: 1,
        ease: 'none',
        onUpdate: () => renderProgress(clock.progress),
        scrollTrigger: {
          trigger: root.value,
          pin: stage.value,
          start: 'top top',
          end: () => `+=${Math.max(4200, stage.value!.clientHeight * RESIDENTIAL_STORY_SCREENS)}`,
          scrub: .65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => view?.resize(),
        },
      })
      scrollRange = tween.scrollTrigger
      jumpToProgress = (value: number) => {
        if (!scrollRange) return
        window.scrollTo({ top: scrollRange.start + (scrollRange.end - scrollRange.start) * value, behavior: 'instant' })
        ScrollTrigger.update()
        tween.scrollTrigger?.getTween()?.progress(1)
        tween.progress(value)
        renderProgress(value)
      }
    }, root.value)
    resizeObserver = new ResizeObserver(() => {
      view?.resize()
      measureContactOverflow()
    })
    resizeObserver.observe(host.value!)
    resizeObserver.observe(contact.value!)
    resizeObserver.observe(stage.value!)
    measureContactOverflow()
    intersectionObserver = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting)
      syncAirflow()
    })
    intersectionObserver.observe(stage.value!)
    renderProgress(clock.progress)
    revealView('ready')
    await nextTick()
    if (!alive || generation !== current) return
    // Removing the loading viewport restores the pinned story's full scroll range.
    ScrollTrigger.refresh()
    followStoryHash()
  } catch {
    if (alive && generation === current) failPreview()
  }
}

onMounted(() => {
  preference = window.matchMedia('(prefers-reduced-motion: reduce), (max-height: 499px)')
  preference.addEventListener('change', initialize)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('hashchange', onHashChange)
  void initialize()
})
onBeforeUnmount(() => {
  alive = false
  generation++
  preference?.removeEventListener('change', initialize)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('hashchange', onHashChange)
  disposeMotion()
})
function onHashChange() { followStoryHash(true) }
</script>

<template>
  <main class="motion-prototype" :class="{ 'is-loading': status === 'loading', 'has-scene': enhanced }">
    <ResidentialLoadingScreen :active="status === 'loading'" @continue="viewServices" />
    <a class="skip-link" href="#prototype-contact" @click="skipToEnquiry">Skip to enquiry</a>
    <section ref="root" :data-story-enhanced="enhanced || undefined" class="motion-story" :class="{ 'is-enhanced': enhanced }" tabindex="-1" aria-label="Air-conditioning and electrical services">
      <header class="motion-header service-header">
          <div class="motion-identity service-identity">
            <NuxtLink class="motion-brand service-brand" to="/" aria-label="Setia Air-Cond and Electrical home"><SetiaWordmark /></NuxtLink>
          </div>
          <NuxtLink class="motion-quote service-quote" :to="airConditioningEnquiry">Get a quote<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
      </header>
      <div ref="stage" class="motion-stage" :class="{ 'is-contact-visible': enhanced && contactVisible }">

        <div ref="host" class="motion-canvas" aria-hidden="true" />

        <p v-if="status === 'reduced' || status === 'unavailable'" class="motion-status" role="status">
          <template v-if="status === 'reduced'">A reading view for reduced motion or a short screen.</template>
          <template v-else>The 3D preview couldn’t load. You can still explore the services below. <button type="button" @click="initialize">Try again</button></template>
        </p>

        <div class="motion-panels">
          <section
            v-for="(chapter, index) in chapters"
            :id="chapter.anchor"
            :key="chapter.id"
            :class="['motion-copy', `motion-copy--${chapter.position}`]"
            :aria-hidden="enhanced && !panelVisible[index] ? true : undefined"
            :aria-labelledby="`${chapter.anchor}-heading`"
            data-motion-copy
          >
            <component :is="index === 0 ? 'h1' : 'h2'" :id="`${chapter.anchor}-heading`"><span v-if="chapter.number" class="motion-copy__number">{{ chapter.number }}</span>{{ chapter.title }}</component>
            <p>{{ chapter.description }}</p>
            <div v-if="chapter.id === 'air-conditioning-replacement' && enhanced" class="motion-upgrade" :style="{ '--upgrade-progress': upgradeProgress }" aria-hidden="true">
              <span class="motion-upgrade__before">Existing unit</span>
              <span class="icon icon--arrow" />
              <span class="motion-upgrade__after">Inverter upgrade</span>
            </div>
            <ul v-if="chapter.services.length" class="motion-services" aria-label="Services">
              <li v-for="service in chapter.services" :key="service">{{ service }}</li>
            </ul>
          </section>
        </div>

        <section id="prototype-brands" ref="brands" class="motion-brands service-brands" :aria-hidden="enhanced && !brandsVisible ? true : undefined" :inert="enhanced && !brandsVisible" aria-labelledby="motion-brands-heading">
          <h2 id="motion-brands-heading">Supplying<br>and supporting.</h2>
          <ul aria-label="Air-conditioning brands we supply and support">
            <li v-for="brand in residentialBrandLogos" :key="brand.name" data-brand-item>
              <div class="motion-brand-mark service-brand-mark" data-brand-word>
                <div class="motion-brand-image service-brand-image">
                  <img :src="$sitePath(brand.src)" :alt="brand.name" :width="brand.width" :height="brand.height" :class="`service-brand-image--${brand.treatment}`" decoding="async">
                </div>
                <span class="motion-brand-caption service-brand-caption" aria-hidden="true">{{ brand.name }}</span>
              </div>
            </li>
          </ul>
        </section>

        <section id="prototype-contact" ref="contact" class="motion-contact" :aria-hidden="enhanced && !contactVisible ? true : undefined" :inert="enhanced && !contactVisible" tabindex="-1" aria-labelledby="motion-contact-heading">
          <CompanyEnquirySection
            heading-id="motion-contact-heading"
            :heading-lines="['Ready for', 'better cooling?']"
            description="Tell us about your space. Let’s plan the right system for you."
            :quote-to="airConditioningEnquiry"
            :animated="enhanced"
            :details-hidden="enhanced && !contactDetailsVisible"
            viewport
          />
        </section>
      </div>
      <div v-if="enhanced" class="motion-contact-overflow" :style="{ height: `${contactOverflow}px` }" aria-hidden="true" />
    </section>
    <div class="motion-footer"><CompanyFooter /></div>
    <ServiceScrollIndicator :visible="status !== 'loading' && (!enhanced || !contactVisible)" />
  </main>
</template>

<style scoped>
.motion-prototype { --motion-surface: #e9f1eb; color: var(--pine-900); background: var(--motion-surface); }
.motion-prototype.has-scene { background: #0b3022; }
.motion-prototype.is-loading { height: 100svh; overflow: clip; background: #0b3022; }
.motion-prototype.is-loading > :is(.motion-story, .skip-link) { visibility: hidden; }
.motion-prototype.is-loading > .motion-story { opacity: 0; transition: none; }
.motion-prototype :is(a, button):focus-visible { outline: 2px solid var(--pine-700); outline-offset: 5px; }
.motion-story { position: relative; opacity: 1; transition: opacity .8s cubic-bezier(.33, 1, .68, 1); }
.motion-story.is-enhanced { --motion-surface: #0b3022; --ink-soft: #bed0c3; --pine-700: #b9d5c4; --pine-900: #f5f5ed; color: #f5f5ed; }
.is-enhanced .motion-header { position: absolute; inset: 0 0 auto; z-index: 6; }
.motion-stage { position: relative; background: var(--motion-surface); }
.motion-prototype a:hover { text-decoration: underline; text-underline-offset: 5px; }
.motion-canvas { display: none; }
.motion-copy { max-width: 800px; padding: 56px var(--page-gutter); scroll-margin-top: 24px; }
.motion-copy h1, .motion-copy h2 { margin: 0 0 24px; font-weight: 500; font-size: clamp(36px, 4.5vw, 72px); line-height: 1.02; letter-spacing: -.035em; text-wrap: balance; }
.motion-copy h1 { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; letter-spacing: -.035em; }
.motion-copy p { max-width: 40ch; margin: 0; color: var(--ink-soft); font-size: 16px; line-height: 1.65; }
.motion-services { display: flex; flex-wrap: wrap; gap: 8px 18px; list-style: none; padding: 0; margin: 24px 0 0; font-size: 12px; line-height: 1.5; color: var(--pine-700); }
.motion-status { padding: 16px var(--page-gutter) 32px; margin: 0; color: var(--ink-soft); font-size: 14px; }
.motion-status button { padding: 10px 6px; border: 0; color: var(--pine); background: transparent; text-decoration: underline; cursor: pointer; }
.is-enhanced .motion-stage { width: 100%; height: 100svh; min-height: 500px; overflow: clip; isolation: isolate; }
.is-enhanced .motion-canvas { position: absolute; inset: 0; display: block; z-index: 0; pointer-events: none; opacity: var(--equipment-opacity, 1); }
.motion-canvas :deep(canvas) { width: 100%; height: 100%; display: block; }
.motion-contact, .motion-footer { color: #f5f5ed; background: #0b3022; }
.motion-contact:focus { outline: none; }
.motion-contact :deep(:is(a, button):focus-visible) { outline-color: #d1e4d7; }
.is-enhanced .motion-contact { position: absolute; inset: 0 0 auto; z-index: 3; opacity: var(--contact-opacity, 0); }
.is-enhanced .motion-contact[inert] { pointer-events: none; }
.is-enhanced .motion-stage.is-contact-visible { overflow: visible; }
.is-enhanced .motion-panels { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
.is-enhanced .motion-copy { position: absolute; padding: 0; max-width: none; width: 28%; opacity: 0; }
.is-enhanced .motion-copy--intro { top: 25%; left: var(--page-gutter); width: 33%; opacity: 1; }
.is-enhanced .motion-copy--intro h1 { font-size: clamp(46px, 5vw, 80px); }
.is-enhanced .motion-copy--right { top: 29%; right: var(--page-gutter); }
.is-enhanced .motion-copy--left { top: 29%; left: var(--page-gutter); width: 30%; }
.motion-copy__number { display: block; margin-bottom: 20px; font-size: 14px; font-family: 'Hanken Grotesk', sans-serif; line-height: 1; font-weight: 500; letter-spacing: 0; color: var(--pine-700); font-variant-numeric: tabular-nums; }
.is-enhanced .motion-copy h2 { font-size: clamp(36px, 3.5vw, 56px); }
.motion-upgrade { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; margin-top: 28px; font-size: 12px; line-height: 1.4; color: #d1e4d7; }
.motion-upgrade .icon { width: 20px; height: 20px; opacity: .6; }
.motion-upgrade__before { opacity: calc(1 - var(--upgrade-progress) * .6); }
.motion-upgrade__after { opacity: calc(.35 + var(--upgrade-progress) * .65); }
@media (max-width: 1100px) and (min-aspect-ratio: 1/1) {
  .is-enhanced .motion-copy p { font-size: 14px; }
  .is-enhanced .motion-copy h1, .is-enhanced .motion-copy h2 { font-size: 40px; }
  .is-enhanced .motion-copy { top: 23%; width: 32%; }
  .motion-services { font-size: 11px; gap: 5px 12px; }
}
@media (max-aspect-ratio: 1/1) {
  .is-enhanced .motion-copy { top: 14%; left: 22px; right: 22px; width: auto; }
  .is-enhanced .motion-copy--intro h1, .is-enhanced .motion-copy h2 { max-width: 17ch; font-size: clamp(30px, 6.8vw, 48px); margin-bottom: 16px; }
  .motion-copy__number { margin-bottom: 12px; font-size: 12px; }
  .is-enhanced .motion-copy p { max-width: 48ch; font-size: 14px; line-height: 1.55; }
  .is-enhanced .motion-services { margin-top: 14px; font-size: 11px; gap: 4px 12px; }
}
@media (max-aspect-ratio: 1/1) and (max-height: 700px) {
  .is-enhanced .motion-copy--intro h1, .is-enhanced .motion-copy h2 { max-width: none; font-size: 28px; margin-bottom: 12px; }
  .is-enhanced .motion-copy p { font-size: 13px; line-height: 1.5; }
  .is-enhanced .motion-services { font-size: 10px; gap: 4px 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .motion-prototype { scroll-behavior: auto; }
}
@media (prefers-reduced-motion: reduce), (max-height: 499px) {
  .motion-prototype.is-loading { height: auto; overflow: visible; }
  .motion-prototype.is-loading > :is(.motion-story, .skip-link) { visibility: visible; opacity: 1; }
  .motion-story { transition: none; }
  .motion-prototype :deep(.cooling-loader) { display: none; }
}
</style>
