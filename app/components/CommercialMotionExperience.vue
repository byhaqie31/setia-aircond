<script setup lang="ts">
import corporate from '~/data/corporate.json'
import ServiceLoadingScreen from '~/components/ResidentialLoadingScreen.vue'
import CommercialLogo from '~/components/CommercialLogo.vue'
import CommercialRecordsStory from '~/components/CommercialRecordsStory.vue'
import { commercialCompanyLogos } from '~/data/commercial-logos'
import { COMMERCIAL_RECORD_SCREENS, commercialRecordStop, type CommercialRecordGroup } from '~/utils/commercial-records'
import { commercialChapters, commercialBrandLogos, commercialEnquiry } from '~/data/commercial-motion'
import { COMMERCIAL_STOPS, commercialCopyAt, commercialPoseAt } from '~/utils/commercial-motion-path'
import { COMMERCIAL_STORY_SCREENS, COMMERCIAL_EQUIPMENT_END, COMMERCIAL_CLIENTS_STOP, commercialStoryAt } from '~/utils/commercial-story'
import { COMMERCIAL_ENDING_SCREENS, COMMERCIAL_BRANDS_STOP, COMMERCIAL_TENDER_STOP, commercialEndingAt } from '~/utils/commercial-ending'
import type { createCommercialRenderer } from '~/utils/commercial-motion-scene'

const chapters = commercialChapters.map(chapter => ({ ...chapter, anchor: chapter.id }))
const { $sitePath } = useNuxtApp()
const page = useTemplateRef<HTMLElement>('page')
const root = useTemplateRef<HTMLElement>('root')
const stage = useTemplateRef<HTMLElement>('stage')
const host = useTemplateRef<HTMLElement>('host')
const clients = useTemplateRef<HTMLElement>('clients')
const recordsRoot = useTemplateRef<HTMLElement>('recordsRoot')
const recordsStage = useTemplateRef<HTMLElement>('recordsStage')
const brands = useTemplateRef<HTMLElement>('brands')
const ending = useTemplateRef<HTMLElement>('ending')
const endingStage = useTemplateRef<HTMLElement>('endingStage')
const contact = useTemplateRef<HTMLElement>('contact')
const enhanced = ref(false)
const endingState = ref(commercialEndingAt(0))
const clientsVisible = ref(true)
const recordsProgress = ref(0)
const recordsPinned = ref(true)
const panelVisible = ref(chapters.map(() => true))
const status = ref<'loading' | 'ready' | 'reading' | 'reduced' | 'unavailable'>('loading')
let view: ReturnType<typeof createCommercialRenderer> | undefined
let motion: { revert: () => void } | undefined
let scrollRange: { start: number; end: number } | undefined
let resizeObserver: ResizeObserver | undefined
let preference: MediaQueryList | undefined
let recordsPreference: MediaQueryList | undefined
let alive = true
let generation = 0
let progress = 0
let equipmentOpacity = 1
let panels: HTMLElement[] = []
let stopContextListener = () => {}
let loadingDeadline: ReturnType<typeof setTimeout> | undefined
let productRequest: AbortController | undefined
let intersectionObserver: IntersectionObserver | undefined
let onScreen = false
let flowFrame = 0
let flowTime = 0
let lastFlowFrame = 0
let flowAccumulator = 0
let sceneDirty = false
let brandMarks: HTMLElement[] = []
let clientWords: HTMLElement[] = []
let jumpStory: ((value: number) => void) | undefined
let jumpRecords: ((value: number) => void) | undefined
let jumpEnding: ((value: number) => void) | undefined

useHead({ noscript: [{ innerHTML: `<style>
  .commercial-prototype .cooling-loader { display: none !important; }
  .commercial-prototype.is-loading { height: auto !important; overflow: visible !important; }
  .commercial-prototype.is-loading > .commercial-content { visibility: visible !important; opacity: 1 !important; }
</style>` }] })

function syncFlow() {
  const running = alive && enhanced.value && onScreen && !document.hidden && equipmentOpacity > 0
    && (sceneDirty || commercialPoseAt(progress).flow > .05)
  if (running && !flowFrame) flowFrame = requestAnimationFrame(animateFlow)
  else if (!running) {
    if (flowFrame) cancelAnimationFrame(flowFrame)
    flowFrame = 0
    lastFlowFrame = 0
    flowAccumulator = 0
  }
}

function requestSceneRender() {
  sceneDirty = true
  // Startup must finish its first correctly positioned frame behind the loader.
  if (status.value === 'loading' && !document.hidden && equipmentOpacity > 0) {
    view?.render(progress, flowTime)
    sceneDirty = false
  }
  syncFlow()
}

function animateFlow(now: number) {
  flowFrame = 0
  if (!alive || !enhanced.value || !onScreen || document.hidden || equipmentOpacity <= 0) return
  const elapsed = lastFlowFrame ? Math.min(now - lastFlowFrame, 80) : 0
  lastFlowFrame = now
  const flowing = commercialPoseAt(progress).flow > .05
  if (flowing) { flowTime += elapsed / 1000; flowAccumulator += elapsed }
  const interval = 1000 / 30
  if (sceneDirty || (flowing && flowAccumulator + .001 >= interval)) {
    view?.render(progress, flowTime)
    sceneDirty = false
    if (flowAccumulator + .001 >= interval) flowAccumulator = Math.max(0, flowAccumulator - interval * Math.floor((flowAccumulator + .001) / interval))
  }
  syncFlow()
}

function disposeMotion() {
  productRequest?.abort()
  productRequest = undefined
  clearTimeout(loadingDeadline)
  loadingDeadline = undefined
  if (flowFrame) cancelAnimationFrame(flowFrame)
  flowFrame = 0
  lastFlowFrame = 0
  flowAccumulator = 0
  sceneDirty = false
  intersectionObserver?.disconnect()
  intersectionObserver = undefined
  jumpStory = undefined
  jumpRecords = undefined
  jumpEnding = undefined
  stopContextListener()
  stopContextListener = () => {}
  resizeObserver?.disconnect()
  resizeObserver = undefined
  motion?.revert()
  motion = undefined
  scrollRange = undefined
  view?.dispose()
  view = undefined
  enhanced.value = false
  clientsVisible.value = true
  recordsProgress.value = 0
  panelVisible.value = chapters.map(() => true)
  for (const panel of panels) {
    panel.style.removeProperty('opacity')
    panel.style.removeProperty('transform')
    panel.style.removeProperty('clip-path')
  }
  ending.value?.removeAttribute('style')
  for (const property of ['--equipment-opacity', '--clients-opacity', '--client-title']) root.value?.style.removeProperty(property)
  clientWords.forEach(word => {
    word.style.removeProperty('--client-reveal')
    word.removeAttribute('aria-hidden')
  })
  brandMarks.forEach(mark => mark.style.removeProperty('--brand-reveal'))
}

function renderProgress(value: number) {
  const story = commercialStoryAt(value, corporate.clients.length)
  progress = story.equipmentProgress
  equipmentOpacity = story.equipmentOpacity
  panels.forEach((panel, index) => {
    const copy = commercialCopyAt(progress, index)
    copy.opacity *= equipmentOpacity
    panel.style.opacity = String(copy.opacity)
    panel.style.transform = `translate3d(0, ${copy.y}px, 0)`
    panelVisible.value[index] = copy.opacity > .05
  })
  for (const [name, amount] of Object.entries({
    '--equipment-opacity': equipmentOpacity, '--clients-opacity': story.clientsOpacity, '--client-title': story.clientTitle,
  })) root.value?.style.setProperty(name, String(amount))
  clientWords.forEach((word, index) => {
    const amount = story.clientReveals[index] ?? 0
    word.style.setProperty('--client-reveal', String(amount))
    word.setAttribute('aria-hidden', String(amount < .05))
  })
  clientsVisible.value = story.clientsOpacity > .05
  requestSceneRender()
}

function renderEnding(value: number) {
  const state = commercialEndingAt(value, commercialBrandLogos.length)
  endingState.value = state
  for (const [name, amount] of Object.entries({
    '--brands-opacity': state.brandsOpacity, '--brands-exit': state.brandsExit,
    '--brand-title': state.brandTitle, '--contact-opacity': state.contactOpacity,
    '--contact-title': state.contactTitle, '--contact-team': state.contactTeam, '--contact-details': state.contactDetails,
  })) ending.value?.style.setProperty(name, String(amount))
  brandMarks.forEach((mark, i) => mark.style.setProperty('--brand-reveal', String(state.brandReveals[i] ?? 0)))
}

function failPreview() {
  generation++
  disposeMotion()
  revealView('unavailable')
}

function revealView(next: Exclude<typeof status.value, 'loading'>) {
  clearTimeout(loadingDeadline)
  loadingDeadline = undefined
  const focus = Boolean(document.activeElement?.closest('.cooling-loader'))
  const current = generation
  status.value = next
  if (focus) void nextTick(() => { if (alive && generation === current) root.value?.focus({ preventScroll: true }) })
}

function viewCapabilities() {
  generation++
  disposeMotion()
  revealView('reading')
}

function onVisibilityChange() {
  requestSceneRender()
}

function followHash(focus = false) {
  if (!enhanced.value) return
  const linked = chapters.findIndex(chapter => `#${chapter.anchor}` === location.hash)
  if (linked >= 0) jumpStory?.(COMMERCIAL_STOPS[linked]! * COMMERCIAL_EQUIPMENT_END)
  else if (location.hash === '#commercial-clients') jumpStory?.(COMMERCIAL_CLIENTS_STOP)
  else if (['#projects', '#certifications', '#capability'].includes(location.hash) || /^#commercial-project-[1-8]$/.test(location.hash)) {
    if (recordsPinned.value) {
      const project = /^#commercial-project-/.test(location.hash)
      jumpRecords?.(commercialRecordStop(project ? 'projects' : location.hash.slice(1) as CommercialRecordGroup, project ? Number(location.hash.split('-').at(-1)) - 1 : 0))
    } else document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' })
  }
  else if (location.hash === '#commercial-brands') jumpEnding?.(COMMERCIAL_BRANDS_STOP)
  else if (location.hash === '#tender' || location.hash === '#commercial-contacts') jumpEnding?.(COMMERCIAL_TENDER_STOP)
  if (focus && (location.hash === '#tender' || location.hash === '#commercial-contacts')) void nextTick(() => contact.value?.focus({ preventScroll: true }))
  else if (focus && location.hash === '#commercial-clients') void nextTick(() => clients.value?.focus({ preventScroll: true }))
  else if (focus && ['#projects', '#certifications', '#capability'].includes(location.hash)) void nextTick(() => document.getElementById(location.hash.slice(1))?.focus({ preventScroll: true }))
}

function skipToProjects(event: MouseEvent) {
  if (!enhanced.value || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  history.replaceState(history.state, '', '#projects')
  followHash(true)
}

function onHashChange() { followHash(true) }

async function initialize() {
  const current = ++generation
  disposeMotion()
  if (!alive || !root.value || !host.value || !stage.value || !page.value || !recordsRoot.value || !recordsStage.value || !ending.value || !endingStage.value) return
  if (preference?.matches) {
    revealView('reduced')
    return
  }
  status.value = 'loading'
  loadingDeadline = setTimeout(() => { if (alive && generation === current) failPreview() }, 15_000)
  try {
    const [{ createCommercialRenderer }, { loadCommercialProduct, disposeCommercialProduct }, { gsap }, { ScrollTrigger }] = await Promise.all([
      import('~/utils/commercial-motion-scene'), import('~/utils/commercial-product'), import('gsap'), import('gsap/ScrollTrigger'),
    ])
    if (!alive || generation !== current || !host.value || !root.value) return
    const request = new AbortController()
    productRequest = request
    const product = await loadCommercialProduct(request.signal, $sitePath('/models/commercial/commercial-equipment-v1.glb'))
    if (!alive || generation !== current || !host.value || !root.value) {
      if (product) disposeCommercialProduct(product)
      return
    }
    productRequest = undefined
    gsap.registerPlugin(ScrollTrigger)
    panels = Array.from(root.value.querySelectorAll<HTMLElement>('[data-commercial-copy]'))
    clientWords = Array.from(clients.value?.querySelectorAll<HTMLElement>('[data-commercial-client]') ?? [])
    brandMarks = Array.from(brands.value?.querySelectorAll<HTMLElement>('[data-commercial-brand]') ?? [])
    view = createCommercialRenderer(host.value, product)
    const onContextLost = (event: Event) => { event.preventDefault(); failPreview() }
    const canvas = view.canvas
    canvas.addEventListener('webglcontextlost', onContextLost)
    stopContextListener = () => canvas.removeEventListener('webglcontextlost', onContextLost)
    recordsPinned.value = !recordsPreference?.matches
    enhanced.value = true
    await nextTick()
    if (!alive || generation !== current || !view || !root.value || !stage.value) return
    view.resize()
    const clock = { progress: 0 }
    const recordsClock = { progress: 0 }
    const endingClock = { progress: 0 }
    motion = gsap.context(() => {
      const tween = gsap.fromTo(clock, { progress: 0 }, {
        progress: 1,
        ease: 'none',
        onUpdate: () => renderProgress(clock.progress),
        scrollTrigger: {
          trigger: root.value,
          pin: stage.value,
          start: 'top top',
          end: () => `+=${Math.max(4200 / COMMERCIAL_EQUIPMENT_END, stage.value!.clientHeight * COMMERCIAL_STORY_SCREENS)}`,
          scrub: .65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => view?.resize(),
        },
      })
      scrollRange = tween.scrollTrigger
      jumpStory = (value: number) => {
        if (!scrollRange) return
        window.scrollTo({ top: scrollRange.start + (scrollRange.end - scrollRange.start) * value, behavior: 'instant' })
        ScrollTrigger.update()
        tween.scrollTrigger?.getTween()?.progress(1)
        tween.progress(value)
        renderProgress(value)
      }
      if (recordsPinned.value) {
      const recordsTween = gsap.fromTo(recordsClock, { progress: 0 }, {
        progress: 1, ease: 'none', onUpdate: () => { recordsProgress.value = recordsClock.progress },
        scrollTrigger: {
          trigger: recordsRoot.value, pin: recordsStage.value, start: 'top top',
          end: () => `+=${recordsStage.value!.clientHeight * COMMERCIAL_RECORD_SCREENS}`,
          scrub: .65, anticipatePin: 1, invalidateOnRefresh: true,
        },
      })
      jumpRecords = (value: number) => {
        const range = recordsTween.scrollTrigger
        if (!range) return
        window.scrollTo({ top: range.start + (range.end - range.start) * value, behavior: 'instant' })
        ScrollTrigger.update()
        range.getTween()?.progress(1)
        recordsTween.progress(value)
        recordsProgress.value = value
      }
      } else {
        // Let dense records take their natural height on phones/short windows.
        // They still reveal with scroll, without clipping the source detail.
        recordsRoot.value!.querySelectorAll<HTMLElement>('[data-record-reveal]').forEach(record => {
          gsap.fromTo(record, { opacity: 0, y: 32 }, {
            opacity: 1, y: 0, ease: 'none',
            scrollTrigger: { trigger: record, start: 'top 95%', end: 'top 72%', scrub: .6, invalidateOnRefresh: true },
          })
        })
      }
      const endTween = gsap.fromTo(endingClock, { progress: 0 }, {
        progress: 1, ease: 'none', onUpdate: () => renderEnding(endingClock.progress),
        scrollTrigger: {
          trigger: ending.value, pin: endingStage.value, start: 'top top',
          end: () => `+=${endingStage.value!.clientHeight * COMMERCIAL_ENDING_SCREENS}`,
          scrub: .7, anticipatePin: 1, invalidateOnRefresh: true,
        },
      })
      jumpEnding = (value: number) => {
        const range = endTween.scrollTrigger
        if (!range) return
        window.scrollTo({ top: range.start + (range.end - range.start) * value, behavior: 'instant' })
        ScrollTrigger.update()
        range.getTween()?.progress(1)
        endTween.progress(value)
        renderEnding(value)
      }
    }, page.value!)
    resizeObserver = new ResizeObserver(() => view?.resize())
    resizeObserver.observe(host.value!)
    intersectionObserver = new IntersectionObserver(([entry]) => { onScreen = Boolean(entry?.isIntersecting); syncFlow() })
    intersectionObserver.observe(stage.value!)
    renderProgress(clock.progress)
    renderEnding(endingClock.progress)
    revealView('ready')
    await nextTick()
    if (!alive || generation !== current) return
    ScrollTrigger.refresh()
    followHash()
  } catch {
    if (alive && generation === current) failPreview()
  }
}

onMounted(() => {
  preference = window.matchMedia('(prefers-reduced-motion: reduce), (max-height: 499px)')
  recordsPreference = window.matchMedia('(max-width: 760px), (max-height: 699px)')
  preference.addEventListener('change', initialize)
  recordsPreference.addEventListener('change', initialize)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('hashchange', onHashChange)
  void initialize()
})
onBeforeUnmount(() => {
  alive = false
  generation++
  preference?.removeEventListener('change', initialize)
  recordsPreference?.removeEventListener('change', initialize)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('hashchange', onHashChange)
  disposeMotion()
})
</script>

<template>
  <main :data-story-enhanced="enhanced || undefined" class="commercial-prototype" :class="{ 'is-loading': status === 'loading', 'has-scene': enhanced }">
    <ServiceLoadingScreen :active="status === 'loading'" shortcut="View capabilities now" @continue="viewCapabilities" />
    <div ref="page" class="commercial-content">
    <a class="skip-link" href="#projects" @click="skipToProjects">Skip to projects and tender enquiries</a>
        <header class="commercial-header service-header">
          <div class="commercial-identity service-identity">
            <NuxtLink class="commercial-brand service-brand" to="/" aria-label="Setia Air-Cond and Electrical home"><SetiaWordmark /></NuxtLink>
          </div>
          <NuxtLink class="commercial-quote service-quote" :to="commercialEnquiry">Get a quote<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
        </header>
    <section ref="root" class="commercial-story" :class="{ 'is-enhanced': enhanced }" tabindex="-1" aria-label="Commercial air-conditioning and electrical capabilities">
      <div ref="stage" class="commercial-stage">
        <div ref="host" class="commercial-canvas" aria-hidden="true" />
        <p v-if="status === 'reduced' || status === 'unavailable'" class="commercial-status" role="status">
          <template v-if="status === 'reduced'">Explore our capabilities below.</template>
          <template v-else>The 3D scene couldn’t load. Our capabilities are available below. <button type="button" @click="initialize">Try again</button></template>
        </p>
        <div class="commercial-panels">
          <section v-for="(chapter, index) in chapters" :id="chapter.anchor" :key="chapter.id"
            :class="['commercial-copy', `commercial-copy--${chapter.position}`]"
            :aria-hidden="enhanced && !panelVisible[index] ? true : undefined"
            :aria-labelledby="`${chapter.anchor}-heading`" data-commercial-copy>
            <component :is="index === 0 ? 'h1' : 'h2'" :id="`${chapter.anchor}-heading`">{{ chapter.title }}</component>
            <p>{{ chapter.description }}</p>
            <p v-if="index === 0" class="commercial-history">{{ corporate.history }}</p>
          </section>
        </div>
        <section id="commercial-clients" ref="clients" class="commercial-proof service-brands" tabindex="-1"
          :aria-hidden="enhanced && !clientsVisible || undefined" :inert="enhanced && !clientsVisible"
          aria-labelledby="commercial-proof-heading">
          <h2 id="commercial-proof-heading">Across retail, banking,<br>industry and education.</h2>
          <ul class="commercial-clients" aria-label="Selected clients">
            <li v-for="client in corporate.clients" :key="client" data-commercial-client><div class="commercial-client-name service-brand-mark" data-brand-word><CommercialLogo :logo="commercialCompanyLogos[client]!" :name="client" :dark="enhanced" caption /></div></li>
          </ul>
        </section>
      </div>
    </section>

    <section ref="recordsRoot" class="commercial-records-story" aria-label="Projects, credentials and capabilities">
      <div ref="recordsStage" class="commercial-records-stage" :class="{ 'is-pinned': recordsPinned }">
        <CommercialRecordsStory :enhanced="enhanced" :pinned="recordsPinned" :progress="recordsProgress" />
      </div>
    </section>

    <section ref="ending" class="commercial-ending" aria-label="Suppliers and project enquiries">
    <div ref="endingStage" class="commercial-ending-stage">
    <section id="commercial-brands" ref="brands" class="commercial-brands service-brands" :inert="enhanced && endingState.brandsOpacity < .05" :aria-hidden="enhanced && endingState.brandsOpacity < .05 || undefined" aria-labelledby="commercial-brands-heading">
      <h2 id="commercial-brands-heading">Supplying<br>and supporting.</h2>
      <ul aria-label="Commercial air-conditioning brands">
        <li v-for="(brand, index) in commercialBrandLogos" :key="brand.name" :aria-hidden="enhanced && (endingState.brandReveals[index] ?? 0) < .05 || undefined" data-commercial-brand>
          <div class="commercial-brand-mark service-brand-mark" data-brand-word>
            <div class="commercial-brand-image service-brand-image"><img :src="$sitePath(brand.src)" :alt="brand.name" :width="brand.width" :height="brand.height" :class="`service-brand-image--${brand.treatment}`" decoding="async"></div>
            <span class="commercial-brand-caption service-brand-caption" aria-hidden="true">{{ brand.name }}</span>
          </div>
        </li>
      </ul>
    </section>

    <section id="tender" ref="contact" class="commercial-contact service-contact" tabindex="-1" :inert="enhanced && endingState.contactOpacity < .1" :aria-hidden="enhanced && endingState.contactOpacity < .1 || undefined" aria-labelledby="commercial-contact-heading">
      <div class="commercial-contact__body service-contact__body">
        <h2 id="commercial-contact-heading">Ready for<br>better cooling?</h2>
        <div class="commercial-contact__team service-contact__team" aria-hidden="true">
          <img src="/images/residential/technician-team-v1.webp" width="1200" height="800" alt="" decoding="async">
        </div>
        <div class="commercial-contact__details service-contact__details" :inert="enhanced && endingState.contactDetails < .1" :aria-hidden="enhanced && endingState.contactDetails < .1 || undefined">
          <p>{{ corporate.tenderDescription }}</p>
          <div class="commercial-contact__actions service-contact__actions">
            <NuxtLink class="commercial-enquiry service-enquiry" :to="commercialEnquiry">Get a quote<span class="commercial-enquiry__arrow service-enquiry__arrow"><span class="icon icon--arrow" aria-hidden="true" /></span></NuxtLink>
            <NuxtLink class="commercial-email-enquiry" to="/get-a-quote?property=commercial&amp;channel=email">Submit an enquiry by email</NuxtLink>
          </div>
        </div>
      </div>
      <footer class="commercial-end service-end" :inert="enhanced && endingState.contactDetails < .1" :aria-hidden="enhanced && endingState.contactDetails < .1 || undefined">
        <NuxtLink class="commercial-end__brand service-end__brand" to="/" aria-label="Setia Air-Cond and Electrical home"><SetiaWordmark /></NuxtLink>
      </footer>
    </section>
    </div>
    </section>
    </div>
    <ServiceScrollIndicator :visible="status !== 'loading' && (!enhanced || endingState.contactOpacity < .1)" />
  </main>
</template>

<style scoped>
.commercial-prototype { --commercial-surface: #e9f1eb; color: var(--pine-900); background: var(--commercial-surface); }
.commercial-prototype.has-scene { --commercial-surface: #0b3022; --pine-900: #f5f5ed; --pine: #d1e4d7; --pine-700: #b9d5c4; --ink-soft: #bed0c3; --line: #bed0c338; color: #f5f5ed; }
.commercial-content { position: relative; opacity: 1; transition: opacity .8s cubic-bezier(.33, 1, .68, 1); }
.commercial-prototype.is-loading { height: 100svh; overflow: clip; background: #0b3022; }
.commercial-prototype.is-loading > .commercial-content { visibility: hidden; opacity: 0; transition: none; }
.commercial-prototype :is(a, button):focus-visible { outline: 2px solid var(--pine-700); outline-offset: 5px; }
.commercial-story { position: relative; }
.commercial-records-story { position: relative; }
.has-scene .commercial-records-stage.is-pinned { height: 100svh; min-height: 500px; overflow: clip; isolation: isolate; }
.commercial-story.is-enhanced { --commercial-surface: #0b3022; --ink-soft: #bed0c3; --pine-700: #b9d5c4; --pine-900: #f5f5ed; color: #f5f5ed; }
.commercial-stage { position: relative; background: var(--commercial-surface); }
.has-scene .commercial-header { position: absolute; inset: 0 0 auto; z-index: 6; }
.commercial-proof { --brands-opacity: var(--clients-opacity, 1); --brand-title: var(--client-title, 1); --brands-exit: 0; }
.commercial-proof li { --brand-reveal: var(--client-reveal, 1); }
.commercial-proof ul { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.commercial-client-name > * { width: 100%; }
.commercial-brands ul { display: flex; flex-wrap: wrap; justify-content: center; }
.commercial-brands li { flex: 0 0 calc(25% - 24px); }
.commercial-contact__actions { flex-shrink: 0; text-align: center; }
.commercial-contact__details > p { max-width: 40ch; }
.commercial-prototype a:hover { text-decoration: underline; text-underline-offset: 5px; }
.commercial-canvas { display: none; }
.commercial-copy { max-width: 800px; padding: 56px var(--page-gutter); scroll-margin-top: 24px; }
.commercial-copy h1, .commercial-copy h2 { margin: 0 0 24px; font-weight: 500; font-size: clamp(36px, 4.5vw, 72px); line-height: 1.02; letter-spacing: -.035em; text-wrap: balance; }
.commercial-copy h1 { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; letter-spacing: -.035em; }
.commercial-copy p { max-width: 40ch; margin: 0; color: var(--ink-soft); font-size: 16px; line-height: 1.65; }
.commercial-copy .commercial-history { margin-top: 24px; font-size: 12px; color: var(--pine-700); }
.commercial-services { display: flex; flex-wrap: wrap; gap: 8px 18px; list-style: none; padding: 0; margin: 24px 0 0; font-size: 12px; line-height: 1.5; color: var(--pine-700); }
.commercial-status { padding: 16px var(--page-gutter) 32px; margin: 0; color: var(--ink-soft); font-size: 14px; }
.commercial-status button { padding: 10px 6px; border: 0; color: var(--pine); background: transparent; text-decoration: underline; cursor: pointer; }
.is-enhanced .commercial-stage { width: 100%; height: 100svh; min-height: 500px; overflow: clip; isolation: isolate; }
.is-enhanced .commercial-canvas { position: absolute; inset: 0; display: block; z-index: 0; pointer-events: none; opacity: var(--equipment-opacity, 1); }
.commercial-canvas :deep(canvas) { width: 100%; height: 100%; display: block; }
.is-enhanced .commercial-panels { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
.is-enhanced .commercial-copy { position: absolute; padding: 0; max-width: none; width: 28%; opacity: 0; }
.is-enhanced .commercial-copy--intro { top: 25%; left: var(--page-gutter); width: 33%; opacity: 1; }
.is-enhanced .commercial-copy--intro h1 { font-size: clamp(46px, 5vw, 80px); }
.is-enhanced .commercial-copy--right { top: 29%; right: var(--page-gutter); }
.is-enhanced .commercial-copy--left { top: 29%; left: var(--page-gutter); width: 30%; }
.commercial-copy__number { display: block; margin-bottom: 20px; font-size: 14px; font-family: 'Hanken Grotesk', sans-serif; line-height: 1; font-weight: 500; letter-spacing: 0; color: var(--pine-700); font-variant-numeric: tabular-nums; }
.is-enhanced .commercial-copy h2 { font-size: clamp(36px, 3.5vw, 56px); }
.commercial-ending { position: relative; }
.has-scene .commercial-ending-stage { position: relative; width: 100%; height: 100svh; min-height: 500px; overflow: clip; isolation: isolate; background: #0b3022; }
.commercial-email-enquiry { display: block; width: fit-content; min-height: 44px; padding-block: 12px; margin: 0 auto; font-size: 14px; color: #bed0c3; }
@media (max-width: 700px) {
  .commercial-proof ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .commercial-brands li { flex-basis: calc(50% - 12px); }
}
@media (max-width: 1100px) and (min-aspect-ratio: 1/1) {
  .is-enhanced .commercial-copy p { font-size: 14px; }
  .is-enhanced .commercial-copy h1, .is-enhanced .commercial-copy h2 { font-size: 40px; }
  .is-enhanced .commercial-copy { top: 23%; width: 32%; }
  .commercial-services { font-size: 11px; gap: 5px 12px; }
}
@media (max-aspect-ratio: 1/1) {
  .is-enhanced .commercial-copy { top: 14%; left: 22px; right: 22px; width: auto; }
  .is-enhanced .commercial-copy--intro h1, .is-enhanced .commercial-copy h2 { max-width: 17ch; font-size: clamp(30px, 6.8vw, 48px); margin-bottom: 16px; }
  .commercial-copy__number { margin-bottom: 12px; font-size: 12px; }
  .is-enhanced .commercial-copy p { max-width: 48ch; font-size: 14px; line-height: 1.55; }
  .is-enhanced .commercial-services { margin-top: 14px; font-size: 11px; gap: 4px 12px; }
}
@media (max-aspect-ratio: 1/1) and (max-height: 700px) {
  .is-enhanced .commercial-copy--intro h1, .is-enhanced .commercial-copy h2 { max-width: none; font-size: 28px; margin-bottom: 12px; }
  .is-enhanced .commercial-copy p { font-size: 13px; line-height: 1.5; }
  .is-enhanced .commercial-copy .commercial-history { margin-top: 12px; font-size: 11px; }
  .is-enhanced .commercial-services { font-size: 10px; gap: 4px 12px; }
  .has-scene .commercial-email-enquiry { margin-top: 0; padding-block: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .commercial-prototype { scroll-behavior: auto; }
}
@media (prefers-reduced-motion: reduce), (max-height: 499px) {
  .commercial-prototype.is-loading { height: auto; overflow: visible; }
  .commercial-prototype.is-loading > .commercial-content { visibility: visible; opacity: 1; }
  .commercial-content { transition: none; }
  .commercial-prototype :deep(.cooling-loader) { display: none; }
}
</style>
