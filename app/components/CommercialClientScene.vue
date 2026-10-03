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
  back: []
  previous: [page: number]
  next: [page: number]
}>()

// Preserve the same four/five-client groups and page URLs on every screen.
const groups = computed(() => groupCommercialClients(commercialClients, 8))
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
  // Two clear rows, alternating up and down, so eight marks share one page:
  // the upper row clears the heading and the lower row clears the upper marks.
  const markHeight = Math.max(52, ...Array.from(markerElement.value?.children ?? [], marker => (marker as HTMLElement).offsetHeight))
  const headingBottom = (headingElement.value?.getBoundingClientRect().bottom ?? sceneRect.top) - sceneRect.top
  const upperRow = Math.max(sceneRect.height * (sceneRect.height < 700 ? .52 : .44), headingBottom + 24 + markHeight) / sceneRect.height
  const lowerRow = upperRow + (markHeight + 28) / sceneRect.height
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
      labelY: index % 2 ? lowerRow : upperRow,
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

function goToPage(target: number) {
  if (busy.value || props.phase === 'exit' || target === activeGroupIndex.value || target < 0 || target >= groups.value.length) return
  const direction = target < activeGroupIndex.value ? -1 : 1
  const announce = () => {
    emit('slide-change', target + 1, visibleClients.value[0]?.slug ?? '')
    if (direction === -1) emit('previous', target + 1)
    else emit('next', target + 1)
  }
  if (props.reducedMotion || document.hidden) {
    selectedSlug.value = null
    activeGroupIndex.value = target
    visibleLeaders.value = visibleClients.value.length
    displayedLogos.value = visibleClients.value.length
    announce()
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
    announce()
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

function movePage(direction: -1 | 1) {
  goToPage(activeGroupIndex.value + direction)
}

/** The only way back to the building scene; the view experience plays the camera in reverse. */
function requestBack() {
  if (busy.value || props.phase === 'exit') return
  emit('back')
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
          :aria-describedby="client.projectIds.length ? `client-summary-${client.slug}` : undefined"
          @click="guardClientNavigation($event)"
        >
          <span class="client-scene__mark-art" aria-hidden="true">
            <img v-if="client.logoSrc" :src="$sitePath(client.logoSrc)" alt="" decoding="async" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'">
            <strong v-else aria-hidden="true">{{ client.displayName }}</strong>
          </span>
          <span v-if="client.logoSrc" class="client-scene__mark-name">{{ client.displayName }}</span>
          <span v-if="client.projectIds.length" :id="`client-summary-${client.slug}`" class="client-scene__summary" role="tooltip">{{ client.summary }}</span>
        </NuxtLink>
      </div>

      <nav v-if="enhanced && skylineLoaded && !imageUnavailable" class="client-scene__pagination client-scene__pagination--stage" aria-label="Client groups" :aria-busy="busy || undefined">
        <button v-if="activeGroupIndex > 0" type="button" class="client-scene__arrow" aria-label="Previous client group" :aria-disabled="busy || exiting || undefined" @click="movePage(-1)"><svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M15 10H5m0 0 4-4m-4 4 4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
        <div class="client-scene__center">
          <div class="client-scene__dots" role="group" aria-label="Client group pages">
            <button v-for="(_group, index) in groups" :key="index" type="button" class="client-scene__dot" :aria-label="`Client group ${index + 1} of ${groups.length}`" :aria-current="index === activeGroupIndex ? 'true' : undefined" :aria-disabled="busy || exiting || undefined" @click="goToPage(index)" />
          </div>
          <span class="sr-only" role="status" aria-live="polite" aria-atomic="true">Client group {{ activeGroupIndex + 1 }} of {{ groups.length }}</span>
          <button type="button" class="client-scene__back" :aria-disabled="busy || exiting || undefined" @click="requestBack"><span class="icon icon--factory" aria-hidden="true" />Back to commercial</button>
        </div>
        <button v-if="activeGroupIndex < groups.length - 1" type="button" class="client-scene__arrow client-scene__arrow--next" aria-label="Next client group" :aria-disabled="busy || exiting || undefined" @click="movePage(1)"><svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M5 10h10m0 0-4-4m4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
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
.client-scene__heading { position: absolute; z-index: 3; top: clamp(110px, 15svh, 160px); inset-inline: clamp(24px, 5.5vw, 104px); display: grid; justify-items: center; text-align: center; pointer-events: none; }
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
/* Project summary on hover or keyboard focus; it floats above the mark so the leader line stays clear. */
.client-scene__mark:hover, .client-scene__mark:focus-visible { z-index: 1; }
.client-scene__summary { position: absolute; left: 50%; bottom: calc(100% + 10px); z-index: 2; width: max(100%, 240px); max-width: 300px; padding: 10px 12px; border: 1px solid #a0ebbb40; border-radius: 10px; color: #e9f1eb; background: #061710f0; font-size: 12.5px; font-weight: 400; line-height: 1.4; text-align: center; text-wrap: pretty; opacity: 0; transform: translate(-50%, 4px); transition: opacity .18s ease, transform .18s ease; pointer-events: none; }
.client-scene__summary::after { content: ''; position: absolute; left: 50%; top: 100%; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-right: 1px solid #a0ebbb40; border-bottom: 1px solid #a0ebbb40; background: #061710f0; transform: rotate(45deg); }
@media (hover: hover) { .client-scene__mark.is-visible:hover .client-scene__summary { opacity: 1; transform: translate(-50%, 0); } }
.client-scene__mark.is-visible:focus-visible .client-scene__summary { opacity: 1; transform: translate(-50%, 0); }
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
/* Round controls: icon-only arrows at the sides, one dot per page in the middle. */
/* White so they read against the skyline; each arrow only appears when there is a page in that direction. */
.client-scene__pagination .client-scene__arrow { grid-row: 1; justify-content: center; width: 44px; height: 44px; min-width: 0; padding: 0; border: 1px solid transparent; border-radius: 50%; color: var(--service-stage); background: var(--paper); box-shadow: 0 2px 10px #0617104d; text-shadow: none; transition: background-color .2s ease, box-shadow .2s ease, transform .2s ease; }
.client-scene__pagination .client-scene__arrow:hover:not([aria-disabled='true']) { color: var(--service-stage); background: #fff; box-shadow: 0 4px 14px #06171066; transform: translateY(-1px); }
.client-scene__pagination .client-scene__arrow { grid-column: 1; justify-self: start; }
.client-scene__pagination .client-scene__arrow--next { grid-column: 3; justify-self: end; }
.client-scene__dots { display: flex; align-items: center; justify-content: center; gap: 2px; }
.client-scene__pagination .client-scene__dot { display: grid; place-items: center; width: 28px; min-width: 0; min-height: 44px; padding: 0; border: 0; background: transparent; pointer-events: auto; }
.client-scene__pagination .client-scene__dot::before { content: ''; width: 9px; height: 9px; border: 1px solid #d5e8d9b3; border-radius: 50%; transition: background-color .2s ease, border-color .2s ease, transform .2s ease; }
.client-scene__pagination .client-scene__dot:hover:not([aria-disabled='true'])::before { border-color: #a0ebbb; }
.client-scene__pagination .client-scene__dot[aria-current='true']::before { background: #a0ebbb; border-color: #a0ebbb; transform: scale(1.25); }
.client-scene__center { grid-column: 2; grid-row: 1; align-self: end; display: flex; flex-direction: column; align-items: center; gap: 4px; pointer-events: none; }
/* Same white pill as the building scene's secondary action (and the arrows above), so both scenes keep their controls at the bottom centre. */
.client-scene__pagination .client-scene__back { justify-content: center; width: auto; min-height: 44px; padding: 10px 20px; border: 1px solid transparent; border-radius: 100px; color: var(--service-stage); background: var(--paper); box-shadow: 0 2px 10px #0617104d; font-size: 14px; font-weight: 600; line-height: 1.25; white-space: nowrap; text-shadow: none; pointer-events: auto; transition: background-color .2s ease, box-shadow .2s ease, transform .2s ease; }
.client-scene__pagination .client-scene__back .icon { width: 16px; height: 16px; }
.client-scene__pagination .client-scene__back:hover:not([aria-disabled='true']) { color: var(--service-stage); background: #fff; box-shadow: 0 4px 14px #06171066; transform: translateY(-1px); }
.client-scene__all { display: flex; flex-wrap: wrap; gap: 12px 24px; margin: 24px 0; }
.client-scene__all > * { color: #d2e2d6; font-size: 14px; }
.client-scene__all.is-visually-hidden { position: absolute; top: 0; left: 0; width: 1px; height: 1px; margin: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.client-scene :is(a, button):focus-visible { outline: 2px solid #a0ebbb; outline-offset: 4px; }
@media (max-width: 1099px), (max-height: 699px) {
  .client-scene.is-enhanced .client-scene__stage { height: max(620px, 100svh); }
  .client-scene__heading { top: 88px; inset-inline: 24px; }
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
