<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CommercialSkylinePlate from '~/components/CommercialSkylinePlate.vue'
import { commercialClients } from '~/data/commercial-view'
import { compactRowLabels, compactSceneLabels, groupCommercialClients, groupForClient, type CommercialLeader, type CommercialLabelBounds, type ScenePhase } from '~/utils/commercial-view-layout'

const props = withDefaults(defineProps<{
  phase: ScenePhase
  reducedMotion?: boolean
  selectedClientSlug?: string | null
  initialPage?: number
  skylineSrc?: string
  skylineArrived?: boolean
  pinned?: boolean
}>(), {
  reducedMotion: false,
  selectedClientSlug: null,
  initialPage: 1,
  skylineSrc: '/images/commercial/skyline/kl-skyline-cutout-v1.webp',
  skylineArrived: false,
  pinned: false,
})

const emit = defineEmits<{
  ready: []
  'exit-complete': []
  'slide-change': [page: number, firstSlug: string]
  previous: [page: number]
  next: [page: number]
}>()

// Preserve the same four/five-client groups and page URLs on every screen.
const groups = computed(() => groupCommercialClients(commercialClients, 5))
const compact = ref(false)
const mobile = ref(false)
const activeGroupIndex = ref(0)
const visibleClients = computed(() => groups.value[activeGroupIndex.value] ?? [])
const selectedSlug = ref<string | null>(props.selectedClientSlug)
const displayedLogos = ref(0)
const visibleLeaders = ref(0)
const enhanced = ref(false)
const busy = ref(false)
const exiting = ref(false)
const skylineFailed = ref(false)
const skylineLoaded = ref(false)
const imageTimedOut = ref(false)
const imageUnavailable = computed(() => skylineFailed.value || imageTimedOut.value)
const settled = ref(false)
const stageElement = ref<HTMLElement | null>(null)
const headingElement = ref<HTMLElement | null>(null)
const markerElement = ref<HTMLElement | null>(null)
const skylineElement = ref<HTMLImageElement | null>(null)
const skylinePlate = ref<InstanceType<typeof CommercialSkylinePlate> | null>(null)
const leaders = ref<CommercialLeader[]>([])
const labelBounds = ref<CommercialLabelBounds[]>([])

let layoutQuery: MediaQueryList | null = null
let resizeObserver: ResizeObserver | null = null
let pending: ReturnType<typeof setTimeout>[] = []
let imageWatchdog: ReturnType<typeof setTimeout> | undefined
let sequence = 0

function later(callback: () => void, delay: number) {
  pending.push(setTimeout(callback, delay))
}

function cancelSequence() {
  sequence++
  pending.forEach(clearTimeout)
  pending = []
  busy.value = false
}

function setReady(announce = true) {
  cancelSequence()
  exiting.value = false
  settled.value = true
  visibleLeaders.value = visibleClients.value.length
  displayedLogos.value = visibleClients.value.length
  if (announce) emit('ready')
}

function beginIntro() {
  cancelSequence()
  exiting.value = false
  settled.value = props.skylineArrived
  visibleLeaders.value = 0
  displayedLogos.value = 0
  if (props.reducedMotion || document.hidden) {
    setReady()
    return
  }
  const current = sequence
  later(() => { if (current === sequence) settled.value = true }, 40)
  later(() => {
    if (current !== sequence) return
    updateLeaders()
    visibleClients.value.forEach((_, index) => {
      later(() => { if (current === sequence) visibleLeaders.value = index + 1 }, index * 100)
      later(() => { if (current === sequence) displayedLogos.value = index + 1 }, index * 100 + 420)
    })
    later(() => { if (current === sequence) setReady() }, Math.max(0, visibleClients.value.length - 1) * 100 + 600)
  }, 700)
}

function beginExit() {
  cancelSequence()
  exiting.value = true
  if (props.reducedMotion || document.hidden) {
    visibleLeaders.value = 0
    displayedLogos.value = 0
    emit('exit-complete')
    return
  }
  displayedLogos.value = 0
  later(() => { visibleLeaders.value = 0 }, 140)
  later(() => emit('exit-complete'), 640)
}

function pageFor(slug: string | null) {
  return groupForClient(groups.value, slug)
}

function pageFromProp() {
  const requested = Number.isFinite(props.initialPage) ? Math.floor(props.initialPage) : 1
  return Math.max(0, Math.min(groups.value.length - 1, requested - 1))
}

function changeLayout() {
  compact.value = Boolean(layoutQuery?.matches)
  mobile.value = window.innerWidth < 1024
  void nextTick(updateLeaders)
}

function updateLeaders() {
  const scene = stageElement.value
  const image = skylineElement.value
  if (!scene || !image) return
  const sceneRect = scene.getBoundingClientRect()
  const imageRect = image.getBoundingClientRect()
  if (!sceneRect.width || !sceneRect.height || !imageRect.width || !imageRect.height) return
  const naturalWidth = image.naturalWidth || 2172
  const naturalHeight = image.naturalHeight || 724
  const scale = getComputedStyle(image).objectFit === 'cover'
    ? Math.max(imageRect.width / naturalWidth, imageRect.height / naturalHeight)
    : Math.min(imageRect.width / naturalWidth, imageRect.height / naturalHeight)
  const drawnWidth = naturalWidth * scale
  const drawnHeight = naturalHeight * scale
  const drawnLeft = imageRect.left + (imageRect.width - drawnWidth) / 2
  const drawnTop = imageRect.bottom - drawnHeight
  const count = visibleClients.value.length
  if (compact.value) {
    const markers = Array.from(markerElement.value?.children ?? []) as HTMLElement[]
    markers.forEach(marker => resizeObserver?.observe(marker))
    const heights = markers.map(marker => marker.offsetHeight)
    const headingBottom = (headingElement.value?.getBoundingClientRect().bottom ?? sceneRect.top + 180) - sceneRect.top
    const visibleArtworkTop = mobile.value
      ? (image.closest('.commercial-skyline-plate')?.getBoundingClientRect().top ?? drawnTop) - sceneRect.top
      : drawnTop - sceneRect.top
    const anchors = Array.from({ length: count }, (_, index) => count === 1 ? .5 : .12 + index * .76 / (count - 1))
    const stagger = Math.min(96, sceneRect.height * .1)
    const labels = mobile.value
      ? compactRowLabels(anchors, headingBottom, visibleArtworkTop, heights).map((label, index) => ({
        ...label,
        top: index % 2
          ? Math.max(label.top, headingBottom + 24 + stagger)
          : Math.max(headingBottom + 24, label.top - stagger),
      }))
      : compactSceneLabels(count, sceneRect.width, headingBottom, heights)
    const rows = Array.from(new Set(labels.map(label => label.top)))
    labelBounds.value = mobile.value ? [] : labels.map((label, index) => ({
      x: label.x - (markers[index]?.offsetWidth ?? 120) / sceneRect.width / 2 - .01,
      y: label.top / sceneRect.height - .006,
      width: (markers[index]?.offsetWidth ?? 120) / sceneRect.width + .02,
      height: (heights[index] ?? 80) / sceneRect.height + .02,
    }))
    leaders.value = visibleClients.value.map((client, index) => ({
      id: client.slug,
      targetX: labels[index]?.x ?? .5,
      targetY: (drawnTop + (mobile.value ? .72 : [.72, .89, .82][rows.indexOf(labels[index]?.top ?? 0)] ?? .76) * drawnHeight - sceneRect.top) / sceneRect.height,
      labelX: labels[index]?.x ?? .5,
      labelY: ((labels[index]?.top ?? headingBottom) + (heights[index] ?? 80) + 6) / sceneRect.height,
    }))
    return
  }
  labelBounds.value = []
  const ordinaryBuildings = [
    { x: .07, y: .61 },
    { x: .19, y: .68 },
    { x: .54, y: .76 },
    { x: .77, y: .62 },
    { x: .92, y: .65 },
  ]
  const edge = count === 2 ? .28 : count === 3 ? .2 : .18
  leaders.value = visibleClients.value.map((client, index) => {
    // Pins are compositional points on ordinary buildings, not location claims.
    const targetX = count === 1 ? .5 : edge + index * (1 - edge * 2) / (count - 1)
    const imageX = (sceneRect.left + targetX * sceneRect.width - drawnLeft) / drawnWidth
    const pin = ordinaryBuildings.reduce((closest, point) => Math.abs(point.x - imageX) < Math.abs(closest.x - imageX) ? point : closest)
    return {
      id: client.slug,
      targetX,
      targetY: (drawnTop + Math.max(.76, pin.y) * drawnHeight - sceneRect.top) / sceneRect.height,
      labelX: targetX,
      labelY: sceneRect.height < 700
        ? (index % 2 ? .57 : .48)
        : (index % 2 ? .43 : .36),
    }
  })
}

function leaderFor(slug: string) {
  return leaders.value.find(leader => leader.id === slug)
}

function onSkylineLoad(image: HTMLImageElement) {
  skylineElement.value = image
  skylineLoaded.value = true
  resizeObserver?.observe(image)
  void nextTick(updateLeaders)
}

function movePage(direction: -1 | 1) {
  const target = activeGroupIndex.value + direction
  if (busy.value || props.phase === 'exit' || target < 0 || target >= groups.value.length) return
  if (props.reducedMotion || document.hidden) {
    selectedSlug.value = null
    activeGroupIndex.value = target
    visibleLeaders.value = visibleClients.value.length
    displayedLogos.value = visibleClients.value.length
    emit('slide-change', target + 1, visibleClients.value[0]?.slug ?? '')
    if (direction === -1) emit('previous', target + 1)
    else emit('next', target + 1)
    void nextTick(updateLeaders)
    return
  }
  cancelSequence()
  busy.value = true
  const current = sequence
  selectedSlug.value = null
  // Marks fade first; leaders then retract toward their building dots.
  displayedLogos.value = 0
  later(() => { if (current === sequence) visibleLeaders.value = 0 }, 140)
  later(() => {
    if (current !== sequence) return
    activeGroupIndex.value = target
    emit('slide-change', target + 1, visibleClients.value[0]?.slug ?? '')
    if (direction === -1) emit('previous', target + 1)
    else emit('next', target + 1)
    void nextTick(updateLeaders)
    later(() => {
      if (current !== sequence) return
      visibleClients.value.forEach((_, index) => {
        later(() => { if (current === sequence) visibleLeaders.value = index + 1 }, index * 70)
        later(() => { if (current === sequence) displayedLogos.value = index + 1 }, index * 70 + 420)
      })
      later(() => { if (current === sequence) busy.value = false }, Math.max(0, visibleClients.value.length - 1) * 70 + 520)
    }, 80)
  }, 460)
}

function guardClientNavigation(event: MouseEvent) {
  if (busy.value || props.phase === 'exit') event.preventDefault()
}

function onVisibilityChange() {
  if (document.hidden && props.phase === 'intro' && displayedLogos.value < visibleClients.value.length) setReady()
  else if (document.hidden && busy.value) setReady(false)
}

watch(() => props.phase, phase => {
  if (!enhanced.value) return
  if (phase === 'intro') beginIntro()
  else if (phase === 'ready') setReady(false)
  else beginExit()
})

watch(() => props.selectedClientSlug, slug => {
  if (slug === selectedSlug.value) return
  selectedSlug.value = slug ?? null
  if (selectedSlug.value) activeGroupIndex.value = pageFor(selectedSlug.value)
  visibleLeaders.value = visibleClients.value.length
  displayedLogos.value = visibleClients.value.length
  void nextTick(updateLeaders)
})

watch(() => props.initialPage, () => {
  if (selectedSlug.value) return
  const requested = pageFromProp()
  if (requested === activeGroupIndex.value) return
  cancelSequence()
  activeGroupIndex.value = requested
  visibleLeaders.value = visibleClients.value.length
  displayedLogos.value = visibleClients.value.length
  void nextTick(updateLeaders)
})

watch(() => props.reducedMotion, reduced => {
  if (reduced && props.phase === 'intro') setReady()
  else if (reduced && busy.value) setReady(false)
})

watch(imageUnavailable, failed => {
  if (failed && props.phase === 'intro') setReady()
})

onMounted(() => {
  enhanced.value = true
  skylineElement.value = skylinePlate.value?.imageElement ?? null
  if (skylineElement.value?.complete) {
    skylineLoaded.value = skylineElement.value.naturalWidth > 0
    skylineFailed.value = !skylineLoaded.value
  }
  imageWatchdog = setTimeout(() => {
    if (!skylineLoaded.value) imageTimedOut.value = true
  }, 4200)
  layoutQuery = window.matchMedia('(max-width: 1099px), (max-height: 699px)')
  layoutQuery.addEventListener('change', changeLayout)
  changeLayout()
  activeGroupIndex.value = selectedSlug.value ? pageFor(selectedSlug.value) : pageFromProp()
  resizeObserver = new ResizeObserver(updateLeaders)
  if (stageElement.value) resizeObserver.observe(stageElement.value)
  if (skylineElement.value) resizeObserver.observe(skylineElement.value)
  if (headingElement.value) resizeObserver.observe(headingElement.value)
  if (markerElement.value) resizeObserver.observe(markerElement.value)
  void document.fonts.ready.then(updateLeaders)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('resize', changeLayout)
  void nextTick(updateLeaders)
  if (props.phase === 'intro') beginIntro()
  else if (props.phase === 'ready') setReady()
  else beginExit()
})

onBeforeUnmount(() => {
  cancelSequence()
  clearTimeout(imageWatchdog)
  resizeObserver?.disconnect()
  layoutQuery?.removeEventListener('change', changeLayout)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('resize', changeLayout)
})
</script>

<template>
  <section id="commercial-clients" class="client-scene" :class="{ 'is-enhanced': enhanced, 'is-exiting': exiting, 'is-reduced': reducedMotion, 'is-pinned': pinned, 'is-compact': compact }" aria-labelledby="commercial-clients-heading">
    <div ref="stageElement" class="client-scene__stage">
      <div ref="headingElement" class="client-scene__heading">
        <p class="client-scene__eyebrow">Our work</p>
        <h2 id="commercial-clients-heading">Clients we have worked with</h2>
      </div>

      <CommercialSkylinePlate ref="skylinePlate" class="client-scene__plate" :src="skylineSrc"
        :revealed="!enhanced || settled" :zoomed="enhanced && !settled"
        :unavailable="imageUnavailable" alt="Illustrated Kuala Lumpur skyline at dusk"
        @load="onSkylineLoad" @error="skylineFailed = true" />

      <CommercialLeaderLayer
        v-if="enhanced && skylineLoaded && !imageUnavailable && leaders.length"
        :leaders="leaders"
        :visible-count="visibleLeaders"
        :retracting="exiting || (busy && visibleLeaders === 0)"
        :selected-id="selectedSlug"
        :reduced-motion="reducedMotion"
        :label-bounds="compact ? labelBounds : undefined"
      />

      <div v-if="enhanced && skylineLoaded && !imageUnavailable" ref="markerElement" class="client-scene__marks" :aria-busy="busy || undefined">
        <NuxtLink
          v-for="(client, index) in visibleClients"
          :key="client.slug"
          :to="`/commercial/clients/${client.slug}`"
          class="client-scene__mark"
          :class="{ 'is-visible': index < displayedLogos && !exiting, 'is-selected': selectedSlug === client.slug }"
          :style="{ left: `${(leaderFor(client.slug)?.labelX ?? .5) * 100}%`, top: `${(leaderFor(client.slug)?.labelY ?? .32) * 100}%`, width: mobile ? `${visibleClients.length === 5 ? 17 : 21}%` : undefined }"
          :data-client-slug="client.slug"
          :inert="busy || index >= displayedLogos || exiting"
          :aria-disabled="busy || index >= displayedLogos || exiting || undefined"
          :aria-label="`View ${client.displayName}`"
          @click="guardClientNavigation($event)"
        >
          <span class="client-scene__mark-art" aria-hidden="true">
            <img v-if="client.logoSrc" :src="$sitePath(client.logoSrc)" alt="" decoding="async" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'">
            <strong v-else aria-hidden="true">{{ client.displayName }}</strong>
          </span>
          <span v-if="client.logoSrc" class="client-scene__mark-name">{{ client.displayName }}</span>
        </NuxtLink>
      </div>

      <nav v-if="enhanced && skylineLoaded && !imageUnavailable" class="client-scene__pagination client-scene__pagination--stage" aria-label="Client groups" :aria-busy="busy || undefined">
        <button type="button" :aria-disabled="busy || activeGroupIndex === 0 || exiting" @click="movePage(-1)"><svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M15 10H5m0 0 4-4m-4 4 4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg><span class="client-scene__page-label">Previous</span></button>
        <span class="client-scene__page-count" role="status" aria-live="polite" aria-atomic="true"><span aria-hidden="true">{{ activeGroupIndex + 1 }} / {{ groups.length }}</span><span class="sr-only">Client group {{ activeGroupIndex + 1 }} of {{ groups.length }}</span></span>
        <button type="button" :aria-disabled="busy || activeGroupIndex >= groups.length - 1 || exiting" @click="movePage(1)"><span class="client-scene__page-label">Next</span><svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M5 10h10m0 0-4-4m4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
      </nav>
      <p v-if="imageUnavailable" class="client-scene__fallback" role="status">Explore the client portfolio below.</p>
    </div>

    <div class="client-scene__below" :class="{ 'has-content': imageUnavailable }">
      <nav class="client-scene__all" :class="{ 'is-visually-hidden': enhanced && !imageUnavailable }" aria-label="All commercial clients" :inert="enhanced && !imageUnavailable" :aria-hidden="enhanced && !imageUnavailable || undefined">
        <template v-for="client in commercialClients" :key="client.slug">
          <NuxtLink :to="`/commercial/clients/${client.slug}`">{{ client.displayName }}</NuxtLink>
        </template>
      </nav>
    </div>
  </section>
</template>

<style scoped>
.client-scene { position: relative; color: #f5f5ed; background: radial-gradient(ellipse 85% 40% at 50% 94%, #14503a9c, transparent 77%), linear-gradient(180deg, #061710 0%, #09241a 40%, #0b3022 75%, #0d3524 100%); }
.client-scene__stage { position: relative; min-height: max(760px, 100svh); overflow: hidden; isolation: isolate; }
.client-scene.is-enhanced .client-scene__stage { min-height: 0; height: 100svh; }
.client-scene__heading { position: absolute; z-index: 3; top: clamp(110px, 15svh, 160px); left: clamp(24px, 5.5vw, 104px); }
.client-scene__eyebrow { margin: 0 0 8px; color: #a7d2b5; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
.client-scene__heading h2 { max-width: 25ch; margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(28px, 2.8vw, 46px); font-weight: 400; line-height: 1.12; }
.client-scene__heading, .client-scene__pagination, .client-scene__below { transition: opacity 200ms ease; }
.client-scene.is-exiting :is(.client-scene__heading, .client-scene__pagination, .client-scene__below) { opacity: 0; pointer-events: none; }
.client-scene__marks { position: absolute; z-index: 3; inset: 0; pointer-events: none; }
.client-scene__mark { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: end; gap: 6px; width: clamp(120px, 12vw, 205px); min-height: 52px; padding: 8px 4px; border: 0; background: none; color: #eff8f0; opacity: 0; transform: translate(-50%, -100%) translateY(8px); transition: opacity 180ms ease, transform 180ms ease, color 180ms ease; cursor: pointer; pointer-events: none; }
.client-scene__mark.is-visible { opacity: 1; transform: translate(-50%, -100%); pointer-events: auto; }
.client-scene__mark:hover, .client-scene__mark:focus-visible, .client-scene__mark.is-selected { color: #a0ebbb; }
.client-scene__mark-art { display: flex; justify-content: center; align-items: center; width: 100%; min-height: 46px; }
.client-scene__mark-art > img { display: block; max-width: 82%; max-height: 48px; object-fit: contain; }
.client-scene__mark-art > strong { font-size: 17px; line-height: 1.1; }
.client-scene__mark-name { font-size: 12px; line-height: 1.2; text-align: center; }
.client-scene__fallback { position: absolute; top: 50%; left: clamp(24px, 5.5vw, 104px); max-width: 28ch; color: #c9dfcf; font-size: 17px; line-height: 1.45; }
.client-scene__below { padding: 0 clamp(24px, 5.5vw, 104px); }
.client-scene__below.has-content { padding-bottom: 64px; }
.client-scene.is-pinned .client-scene__below.has-content { position:absolute; z-index:5; inset:auto clamp(24px,5.5vw,104px) 132px; padding:0; }
.client-scene__pagination { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 24px; min-height: 64px; }
.client-scene__pagination--stage { position: absolute; z-index: 4; inset: 0; padding: 24px clamp(12px, 1.5vw, 32px); pointer-events: none; }
.client-scene__pagination--stage::before { content: ''; position: absolute; z-index: -1; inset: auto 0 0; height: 80px; background: linear-gradient(transparent, #061710bf); pointer-events: none; }
.client-scene__pagination button { display: inline-flex; align-items: center; gap: 10px; width: fit-content; min-height: 44px; padding: 10px 0; border: 0; color: #f1f8f2; background: transparent; font: inherit; font-size: 15px; cursor: pointer; pointer-events: auto; }
.client-scene__pagination button:first-child { grid-column: 1; grid-row: 1; justify-self: start; }
.client-scene__pagination button:last-child { grid-column: 3; grid-row: 1; justify-self: end; }
.client-scene__pagination button svg { flex: 0 0 18px; }
.client-scene__pagination button:hover:not([aria-disabled="true"]) { color: #a0ebbb; }
.client-scene__pagination button[aria-disabled="true"] { opacity: .4; cursor: default; }
.client-scene__page-count { grid-column: 2; grid-row: 1; display: flex; align-items: center; justify-content: center; min-width: 48px; min-height: 44px; padding: 10px 6px; border: 0; color: #d2e2d6; background: transparent; font-size: 12px; font-weight: 500; font-variant-numeric: tabular-nums; line-height: 1; text-align: center; white-space: nowrap; text-shadow: 0 1px 4px #000d; }
.client-scene__pagination--stage .client-scene__page-count { align-self: end; }
.client-scene__all { display: flex; flex-wrap: wrap; gap: 12px 24px; margin: 24px 0; }
.client-scene__all > * { color: #d2e2d6; font-size: 14px; }
.client-scene__all.is-visually-hidden { position: absolute; top: 0; left: 0; width: 1px; height: 1px; margin: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.client-scene :is(a, button):focus-visible { outline: 2px solid #a0ebbb; outline-offset: 4px; }
@media (min-width: 1100px) and (max-width: 1440px) and (min-height: 700px) {
  .client-scene__pagination--stage button { justify-content: center; width: 44px; }
  .client-scene__pagination--stage .client-scene__page-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
@media (max-width: 1099px), (max-height: 699px) {
  .client-scene.is-enhanced .client-scene__stage { height: max(620px, 100svh); }
  .client-scene__heading { top: 88px; right: 24px; }
  .client-scene__mark { width: 28%; padding: 6px 4px; }
  .client-scene__mark-art { min-height: 38px; }
  .client-scene__mark-art > img { max-height: 36px; }
  .client-scene__mark-name { font-size: 16px; line-height: 1.25; }
  .client-scene__pagination--stage { align-items: end; padding: 16px 24px max(16px, env(safe-area-inset-bottom)); }
  .client-scene__pagination button { min-width: 44px; }
  .client-scene__pagination--stage button { padding: 10px 4px; color: #d2e2d6; background: transparent; font-size: 13px; text-shadow: 0 1px 4px #000d; }
}
@media (max-width: 699px) {
  .client-scene__heading h2 { font-size: clamp(28px, 7vw, 34px); text-wrap: balance; }
  .client-scene__mark { width: 42%; }
  .client-scene__mark-art > img { max-height: 32px; }
  .client-scene__pagination { gap: 12px; }
  .client-scene__pagination button { gap: 6px; font-size: 14px; }
}
@media (max-width: 360px) {
  .client-scene__pagination--stage .client-scene__page-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
@media (max-width: 1023px) {
  .client-scene.is-enhanced .client-scene__stage { min-height: 0; height: 100svh; }
  .client-scene__mark { min-height: 44px; padding: 4px 2px; gap: 4px; }
  .client-scene__mark-art { min-height: 24px; }
  .client-scene__mark-art > img { max-width: 96%; max-height: 24px; }
  .client-scene__mark-art > strong { font-size: 12px; text-wrap: balance; }
  .client-scene__mark-name { font-size: 10px; line-height: 1.25; text-wrap: balance; }
}
@media (max-width: 1023px) and (max-height: 450px) {
  .client-scene__heading { top: 72px; }
  .client-scene__heading h2 { max-width: 32ch; font-size: 26px; }
}
@media (prefers-reduced-motion: reduce) {
  .client-scene__plate, .client-scene__mark { transition-duration: 100ms; }
}
.client-scene.is-reduced .client-scene__plate,
.client-scene.is-reduced .client-scene__mark { transition-duration: 100ms; }
</style>
