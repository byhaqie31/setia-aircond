<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CommercialSkylinePlate from '~/components/CommercialSkylinePlate.vue'
import { commercialClientCategories, commercialClients, getCommercialClientPages } from '~/data/commercial-view'
import { compactSceneLabels, groupForClient, type CommercialLeader, type CommercialLabelBounds, type ScenePhase } from '~/utils/commercial-view-layout'

const props = withDefaults(defineProps<{
  phase: ScenePhase
  reducedMotion?: boolean
  selectedClientSlug?: string | null
  initialPage?: number
  initialCategory?: string | null
  skylineSrc?: string
  skylineArrived?: boolean
  pinned?: boolean
}>(), {
  reducedMotion: false,
  selectedClientSlug: null,
  initialPage: 1,
  initialCategory: null,
  skylineSrc: '/images/commercial/skyline/kl-skyline-cutout-v1.webp',
  skylineArrived: false,
  pinned: false,
})

const emit = defineEmits<{
  ready: []
  'exit-complete': []
  'slide-change': [page: number, firstSlug: string, categoryId: string]
  previous: [page: number]
  next: [page: number]
}>()

/** One tab per industry. Each tab pages its own clients in the same groups on every screen, so page URLs match everywhere. */
const categories = commercialClientCategories
const pagesByCategory = categories.map(category => getCommercialClientPages(category.id))
const groupsFor = (category: number) => pagesByCategory[category] ?? []
const activeCategoryIndex = ref(0)
/** The tab the visitor pressed: it reads as selected at once while the previous tab's marks are still clearing. */
const chosenCategoryIndex = ref(0)
const activeCategory = computed(() => categories[activeCategoryIndex.value] ?? categories[0]!)
const groups = computed(() => groupsFor(activeCategoryIndex.value))
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
const tablistElement = ref<HTMLElement | null>(null)
const tabElements: HTMLButtonElement[] = []
const skylineElement = ref<HTMLImageElement | null>(null)
const skylinePlate = ref<InstanceType<typeof CommercialSkylinePlate> | null>(null)
const leaders = ref<CommercialLeader[]>([])
const labelBounds = ref<CommercialLabelBounds[]>([])
/** Pointer hover or keyboard focus extends that client's line into a frame and lets the other clients step back. */
const framedSlug = ref<string | null>(null)
const labelFrames = ref<Record<string, CommercialLabelBounds>>({})
const stageSize = ref<{ width: number, height: number } | null>(null)
/** Phones: the page is a two-column grid of logo cards in the sky; the page arrows sit beside its middle. */
const gridTop = ref(160)
const gridMiddle = ref(240)
/** Logos follow their leader lines on larger screens; phones have no lines to wait for. */
const logoLag = computed(() => mobile.value ? 0 : 420)

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
  chosenCategoryIndex.value = activeCategoryIndex.value
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
      later(() => { if (current === sequence) displayedLogos.value = index + 1 }, index * 100 + logoLag.value)
    })
    later(() => { if (current === sequence) setReady() }, Math.max(0, visibleClients.value.length - 1) * 100 + 180 + logoLag.value)
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

/** A client's own tab and page; an unknown or absent client means the first page of the first tab. */
function locate(slug: string | null) {
  const category = slug ? pagesByCategory.findIndex(pages => pages.some(page => page.some(client => client.slug === slug))) : -1
  if (category < 0) return { category: 0, page: 0 }
  return { category, page: groupForClient(groupsFor(category), slug) }
}

function placeFromProps() {
  const category = Math.max(0, categories.findIndex(category => category.id === props.initialCategory))
  const requested = Number.isFinite(props.initialPage) ? Math.floor(props.initialPage) : 1
  return { category, page: Math.max(0, Math.min(groupsFor(category).length - 1, requested - 1)) }
}

/** Show a tab and page outright with every mark in place: for arrivals and URL changes rather than the visitor's own paging. */
function jumpTo(category: number, page: number) {
  chosenCategoryIndex.value = category
  activeCategoryIndex.value = category
  activeGroupIndex.value = page
  visibleLeaders.value = visibleClients.value.length
  displayedLogos.value = visibleClients.value.length
  void nextTick(updateLeaders)
}

function changeLayout() {
  compact.value = Boolean(layoutQuery?.matches)
  mobile.value = window.innerWidth < 1024
  void nextTick(updateLeaders)
  void nextTick(() => revealTab('instant'))
}

function updateLeaders() {
  const scene = stageElement.value
  const image = skylineElement.value
  if (!scene || !image) return
  const sceneRect = scene.getBoundingClientRect()
  const imageRect = image.getBoundingClientRect()
  if (!sceneRect.width || !sceneRect.height || !imageRect.width || !imageRect.height) return
  stageSize.value = { width: sceneRect.width, height: sceneRect.height }
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
    if (mobile.value) {
      // The grid floats midway between the heading and the city; nothing points at the skyline.
      // The plate's upper part is sky and thin tower tips, so centre on where the building mass begins.
      const grid = markerElement.value
      if (grid) resizeObserver?.observe(grid)
      const gridHeight = grid?.offsetHeight ?? 0
      const plate = image.closest('.commercial-skyline-plate')?.getBoundingClientRect()
      const skylineTop = (plate ? plate.top + plate.height * .4 : drawnTop) - sceneRect.top
      gridTop.value = Math.max(headingBottom + 24, Math.round((headingBottom + skylineTop - gridHeight) / 2))
      gridMiddle.value = gridTop.value + Math.round(gridHeight / 2)
      labelBounds.value = []
      labelFrames.value = {}
      leaders.value = []
      return
    }
    const labels = compactSceneLabels(count, sceneRect.width, headingBottom, heights)
    const rows = Array.from(new Set(labels.map(label => label.top)))
    labelBounds.value = labels.map((label, index) => ({
      x: label.x - (markers[index]?.offsetWidth ?? 120) / sceneRect.width / 2 - .01,
      y: label.top / sceneRect.height - .006,
      width: (markers[index]?.offsetWidth ?? 120) / sceneRect.width + .02,
      height: (heights[index] ?? 80) / sceneRect.height + .02,
    }))
    leaders.value = visibleClients.value.map((client, index) => ({
      id: client.slug,
      targetX: labels[index]?.x ?? .5,
      targetY: (drawnTop + ([.72, .89, .82][rows.indexOf(labels[index]?.top ?? 0)] ?? .76) * drawnHeight - sceneRect.top) / sceneRect.height,
      labelX: labels[index]?.x ?? .5,
      labelY: ((labels[index]?.top ?? headingBottom) + (heights[index] ?? 80) + 6) / sceneRect.height,
    }))
    labelFrames.value = Object.fromEntries(leaders.value.flatMap((leader, index) => {
      const bounds = labelBounds.value[index]
      return bounds ? [[leader.id, { ...bounds, height: leader.labelY - bounds.y }]] : []
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
  // Each frame hugs the logo and name, 10px clear above them and closing on the line's end below.
  const marks = Array.from(markerElement.value?.children ?? []) as HTMLElement[]
  labelFrames.value = Object.fromEntries(leaders.value.map((leader, index) => {
    const mark = marks[index]
    const content = Math.max(0, ...Array.from(mark?.querySelectorAll<HTMLElement>('.client-scene__mark-art > *, .client-scene__mark-name') ?? [], part => part.offsetWidth))
    const half = ((content || 140) / 2 + 14) / sceneRect.width
    const top = leader.labelY - ((mark?.offsetHeight ?? 80) + 2) / sceneRect.height
    return [leader.id, { x: leader.labelX - half, y: top, width: half * 2, height: leader.labelY - top }]
  }))
}

function frameClient(slug: string, event: PointerEvent | FocusEvent) {
  if (event instanceof PointerEvent ? event.pointerType !== 'touch' : (event.target as HTMLElement).matches(':focus-visible')) framedSlug.value = slug
}

function unframeClient(slug: string) {
  if (framedSlug.value === slug) framedSlug.value = null
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
  transitionTo(activeCategoryIndex.value, target)
}

function selectCategory(target: number) {
  transitionTo(target, 0)
}

/** Paging and switching tabs are one movement: marks fade, leaders retract, the group changes, then the new marks grow in. */
function transitionTo(category: number, page: number) {
  if (busy.value || props.phase === 'exit' || category < 0 || category >= categories.length) return
  if (category === activeCategoryIndex.value && page === activeGroupIndex.value) return
  if (page < 0 || page >= groupsFor(category).length) return
  const direction = category !== activeCategoryIndex.value ? 0 : page < activeGroupIndex.value ? -1 : 1
  const announce = () => {
    emit('slide-change', page + 1, visibleClients.value[0]?.slug ?? '', activeCategory.value.id)
    if (direction === -1) emit('previous', page + 1)
    else if (direction === 1) emit('next', page + 1)
  }
  if (props.reducedMotion || document.hidden) {
    selectedSlug.value = null
    jumpTo(category, page)
    announce()
    return
  }
  cancelSequence()
  busy.value = true
  chosenCategoryIndex.value = category
  const current = sequence
  selectedSlug.value = null
  // Marks fade first; leaders then retract toward their building dots.
  displayedLogos.value = 0
  later(() => { if (current === sequence) visibleLeaders.value = 0 }, 140)
  later(() => {
    if (current !== sequence) return
    activeCategoryIndex.value = category
    activeGroupIndex.value = page
    announce()
    void nextTick(updateLeaders)
    later(() => {
      if (current !== sequence) return
      visibleClients.value.forEach((_, index) => {
        later(() => { if (current === sequence) visibleLeaders.value = index + 1 }, index * 70)
        later(() => { if (current === sequence) displayedLogos.value = index + 1 }, index * 70 + logoLag.value)
      })
      later(() => { if (current === sequence) busy.value = false }, Math.max(0, visibleClients.value.length - 1) * 70 + 100 + logoLag.value)
    }, 80)
  }, 460)
}

function movePage(direction: -1 | 1) {
  goToPage(activeGroupIndex.value + direction)
}

function guardClientNavigation(event: MouseEvent) {
  if (busy.value || props.phase === 'exit') event.preventDefault()
}

function setTabElement(element: unknown, index: number) {
  if (element instanceof HTMLButtonElement) tabElements[index] = element
}

/** Arrow keys move focus along the tabs; Enter or Space chooses one, so a held key never queues a run of transitions. */
function onTabKeydown(event: KeyboardEvent, index: number) {
  const last = categories.length - 1
  const target = event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
    : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : null
  if (target === null) return
  event.preventDefault()
  tabElements[target]?.focus()
}

/** Where the tab row scrolls sideways, keep the chosen tab in view without moving the page itself. */
function revealTab(behavior: ScrollBehavior = props.reducedMotion ? 'instant' : 'smooth') {
  const list = tablistElement.value
  const tab = tabElements[chosenCategoryIndex.value]
  if (!list || !tab || list.scrollWidth <= list.clientWidth + 1) return
  list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior })
}

/** Placeholder for a client whose mark is not on disk yet: a short acronym, or the initials of the first two words. */
function monogram(name: string) {
  const words = name.split(/[\s/]+/).filter(word => /^[\p{L}\p{N}]/u.test(word))
  const first = words[0] ?? ''
  if (/^[A-Z]{2,5}$/.test(first)) return first
  return words.slice(0, 2).map(word => word[0]!.toUpperCase()).join('')
}

function onVisibilityChange() {
  if (document.hidden && props.phase === 'intro' && displayedLogos.value < visibleClients.value.length) setReady()
  else if (document.hidden && busy.value) setReady(false)
}

// A page change or exit removes the hovered mark before it can report the pointer leaving.
watch([activeCategoryIndex, activeGroupIndex, exiting, busy], () => { framedSlug.value = null })

watch(chosenCategoryIndex, () => void nextTick(revealTab))

watch(() => props.phase, phase => {
  if (!enhanced.value) return
  if (phase === 'intro') beginIntro()
  else if (phase === 'ready') setReady(false)
  else beginExit()
})

watch(() => props.selectedClientSlug, slug => {
  if (slug === selectedSlug.value) return
  selectedSlug.value = slug ?? null
  const place = selectedSlug.value ? locate(selectedSlug.value) : { category: activeCategoryIndex.value, page: activeGroupIndex.value }
  jumpTo(place.category, place.page)
})

watch([() => props.initialCategory, () => props.initialPage], () => {
  if (selectedSlug.value) return
  const { category, page } = placeFromProps()
  if (category === activeCategoryIndex.value && page === activeGroupIndex.value) return
  cancelSequence()
  jumpTo(category, page)
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
  const start = selectedSlug.value ? locate(selectedSlug.value) : placeFromProps()
  chosenCategoryIndex.value = start.category
  activeCategoryIndex.value = start.category
  activeGroupIndex.value = start.page
  void nextTick(revealTab)
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
  <section id="commercial-clients" class="client-scene" :class="{ 'is-enhanced': enhanced, 'is-exiting': exiting, 'is-reduced': reducedMotion, 'is-pinned': pinned, 'is-compact': compact, 'is-mobile': mobile }" aria-labelledby="commercial-clients-heading">
    <div ref="stageElement" class="client-scene__stage" :style="mobile ? { '--client-grid-arrow': `${gridMiddle}px` } : undefined">
      <div ref="headingElement" class="client-scene__heading">
        <p class="client-scene__eyebrow">Our work</p>
        <h2 id="commercial-clients-heading">Clients we have worked with</h2>
        <div v-if="!imageUnavailable" class="client-scene__tabbar">
          <button v-if="compact" type="button" class="client-scene__tab-arrow" aria-label="Previous client industry" :disabled="chosenCategoryIndex === 0" @click="selectCategory(chosenCategoryIndex - 1)"><svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16"><path d="m12 5-5 5 5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
          <div ref="tablistElement" class="client-scene__tabs" role="tablist" aria-label="Client industries">
            <button
              v-for="(category, index) in categories"
              :id="`client-tab-${category.id}`"
              :key="category.id"
              :ref="element => setTabElement(element, index)"
              type="button"
              role="tab"
              class="client-scene__tab"
              :aria-selected="index === chosenCategoryIndex ? 'true' : 'false'"
              :aria-controls="enhanced && skylineLoaded && !imageUnavailable ? 'commercial-clients-panel' : undefined"
              :tabindex="index === chosenCategoryIndex ? 0 : -1"
              @click="selectCategory(index)"
              @keydown="onTabKeydown($event, index)"
            >{{ category.label }}</button>
          </div>
          <button v-if="compact" type="button" class="client-scene__tab-arrow client-scene__tab-arrow--next" aria-label="Next client industry" :disabled="chosenCategoryIndex === categories.length - 1" @click="selectCategory(chosenCategoryIndex + 1)"><svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16"><path d="m8 5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
        </div>
      </div>

      <CommercialSkylinePlate ref="skylinePlate" class="client-scene__plate" :src="skylineSrc"
        :revealed="!enhanced || settled" :zoomed="enhanced && !settled"
        :unavailable="imageUnavailable" alt="Illustrated Kuala Lumpur skyline at dusk"
        @load="onSkylineLoad" @error="skylineFailed = true" />

      <CommercialLeaderLayer
        v-if="enhanced && skylineLoaded && !imageUnavailable && leaders.length && !mobile"
        :leaders="leaders"
        :visible-count="visibleLeaders"
        :retracting="exiting || (busy && visibleLeaders === 0)"
        :selected-id="selectedSlug"
        :reduced-motion="reducedMotion"
        :label-bounds="compact ? labelBounds : undefined"
        :frames="labelFrames"
        :framed-id="framedSlug"
        :size="stageSize"
        dim-others
      />

      <div v-if="enhanced && skylineLoaded && !imageUnavailable" id="commercial-clients-panel" ref="markerElement" class="client-scene__marks" role="tabpanel" :aria-labelledby="`client-tab-${activeCategory.id}`" :class="{ 'is-grid': mobile, 'has-framed': !mobile && framedSlug }" :style="mobile ? { top: `${gridTop}px` } : undefined" :aria-busy="busy || undefined">
        <NuxtLink
          v-for="(client, index) in visibleClients"
          :key="client.slug"
          :to="`/commercial/clients/${client.slug}`"
          class="client-scene__mark"
          :class="{ 'is-visible': index < displayedLogos && !exiting, 'is-selected': selectedSlug === client.slug, 'is-framed': framedSlug === client.slug }"
          :style="mobile ? undefined : { left: `${(leaderFor(client.slug)?.labelX ?? .5) * 100}%`, top: `${(leaderFor(client.slug)?.labelY ?? .32) * 100}%` }"
          :data-client-slug="client.slug"
          :inert="busy || index >= displayedLogos || exiting"
          :aria-disabled="busy || index >= displayedLogos || exiting || undefined"
          :aria-label="`View ${client.displayName}`"
          :aria-describedby="client.summary ? `client-summary-${client.slug}` : undefined"
          @click="guardClientNavigation($event)"
          @pointerenter="frameClient(client.slug, $event)"
          @pointerleave="unframeClient(client.slug)"
          @focus="frameClient(client.slug, $event)"
          @blur="unframeClient(client.slug)"
        >
          <span class="client-scene__mark-art" aria-hidden="true">
            <img v-if="client.logoSrc" :src="$sitePath(client.logoSrc)" alt="" decoding="async" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'">
            <span v-else class="client-scene__monogram">{{ monogram(client.displayName) }}</span>
          </span>
          <span class="client-scene__mark-name">{{ client.displayName }}</span>
          <span v-if="client.summary" :id="`client-summary-${client.slug}`" class="client-scene__summary" role="tooltip">{{ client.summary }}</span>
        </NuxtLink>
      </div>

      <nav v-if="enhanced && skylineLoaded && !imageUnavailable && groups.length > 1" class="client-scene__pagination client-scene__pagination--stage" aria-label="Client groups" :aria-busy="busy || undefined">
        <button v-if="activeGroupIndex > 0" type="button" class="client-scene__arrow" aria-label="Previous client group" :aria-disabled="busy || exiting || undefined" @click="movePage(-1)"><svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M15 10H5m0 0 4-4m-4 4 4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
        <div class="client-scene__center">
          <div class="client-scene__dots" role="group" aria-label="Client group pages">
            <button v-for="(_group, index) in groups" :key="index" type="button" class="client-scene__dot" :aria-label="`Client group ${index + 1} of ${groups.length}`" :aria-current="index === activeGroupIndex ? 'true' : undefined" :aria-disabled="busy || exiting || undefined" @click="goToPage(index)" />
          </div>
        </div>
        <button v-if="activeGroupIndex < groups.length - 1" type="button" class="client-scene__arrow client-scene__arrow--next" aria-label="Next client group" :aria-disabled="busy || exiting || undefined" @click="movePage(1)"><svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M5 10h10m0 0-4-4m4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
      </nav>
      <span v-if="enhanced && !imageUnavailable" class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ activeCategory.label }}<template v-if="groups.length > 1">: client group {{ activeGroupIndex + 1 }} of {{ groups.length }}</template></span>
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
/* Industry tabs under the title. They are part of the measured heading, so the marks and the phone grid keep clear of them on their own. */
.client-scene__tabbar { position: relative; display: flex; align-items: center; min-width: 0; max-width: 920px; margin-top: 22px; pointer-events: auto; }
.client-scene__tabs { position: relative; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 8px; }
/* Compact layouts: a round arrow in its own column at either side steps to the neighbouring industry. An arrow with no tab in its direction keeps its space but disappears, so the title between them never shifts. */
.client-scene__tab-arrow { flex: 0 0 auto; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 1px solid #d5e8d966; border-radius: 50%; color: #eff8f0; background: #061710d9; cursor: pointer; }
.client-scene__tab-arrow[disabled] { visibility: hidden; }
.client-scene__tab-arrow:active:not([disabled]) { color: #061710; background: #a0ebbb; border-color: #a0ebbb; }
.client-scene__tab { min-height: 36px; padding: 8px 15px; border: 1px solid #d5e8d94d; border-radius: 999px; color: #d2e2d6; background: #06171066; font: inherit; font-size: 12.5px; font-weight: 600; letter-spacing: .03em; line-height: 1.2; white-space: nowrap; cursor: pointer; transition: color .2s ease, background-color .2s ease, border-color .2s ease; }
@media (hover: hover) { .client-scene__tab:hover:not([aria-selected='true']) { border-color: #a0ebbb99; color: #eff8f0; } }
.client-scene__tab[aria-selected='true'] { color: #061710; background: #a0ebbb; border-color: #a0ebbb; cursor: default; }
.client-scene__heading, .client-scene__pagination, .client-scene__below { transition: opacity 200ms ease; }
.client-scene.is-exiting :is(.client-scene__heading, .client-scene__pagination, .client-scene__below) { opacity: 0; pointer-events: none; }
.client-scene__marks { position: absolute; z-index: 3; inset: 0; pointer-events: none; }
.client-scene__mark { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: end; gap: 6px; width: clamp(120px, 12vw, 205px); min-height: 52px; padding: 8px 4px; border: 0; background: none; color: #eff8f0; opacity: 0; transform: translate(-50%, -100%) translateY(8px); transition: opacity 180ms ease, transform 180ms ease, color 180ms ease; cursor: pointer; pointer-events: none; }
.client-scene__mark.is-visible { opacity: 1; transform: translate(-50%, -100%); pointer-events: auto; }
.client-scene__mark:focus-visible, .client-scene__mark.is-selected { color: #a0ebbb; }
/* Hover styling only where a pointer can hover: touch screens keep :hover on the last tapped spot across a round trip. */
@media (hover: hover) { .client-scene__mark:hover { color: #a0ebbb; } }
/* The hovered or focused mark is framed by its own leader line, drawn in CommercialLeaderLayer; the frame replaces the focus ring. */
.client-scene__marks:not(.is-grid) .client-scene__mark:focus-visible { outline: none; }
/* The other clients step back so the framed mark and its brief read on their own. */
.client-scene__marks.has-framed .client-scene__mark.is-visible:not(.is-framed) { opacity: .22; }
.client-scene__mark-art { display: flex; justify-content: center; align-items: center; width: 100%; min-height: 46px; }
.client-scene__mark-art > img { display: block; max-width: 82%; max-height: 48px; object-fit: contain; }
/* A client without a mark on disk shows its monogram where the mark will go. */
.client-scene__monogram { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid #d5e8d980; border-radius: 50%; color: #ebf3ea; font-family: Georgia, 'Times New Roman', serif; font-size: 17px; letter-spacing: .04em; }
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
.client-scene__all { display: flex; flex-wrap: wrap; gap: 12px 24px; margin: 24px 0; }
.client-scene__all > * { color: #d2e2d6; font-size: 14px; }
.client-scene__all.is-visually-hidden { position: absolute; top: 0; left: 0; width: 1px; height: 1px; margin: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.client-scene :is(a, button):focus-visible { outline: 2px solid #a0ebbb; outline-offset: 4px; }
@media (max-width: 1099px), (max-height: 699px) {
  .client-scene.is-enhanced .client-scene__stage { height: max(620px, 100svh); }
  .client-scene__heading { top: 88px; inset-inline: 24px; }
  /* Between the arrows, one scrolling row with the chosen tab centred and its full title showing; half-width spacers at both ends let the first and last tabs centre too. */
  .client-scene__tabbar { justify-self: stretch; gap: 6px; max-width: none; margin: 16px -16px 0; }
  .client-scene__tabs { flex: 1 1 auto; flex-wrap: nowrap; justify-content: flex-start; align-items: center; gap: 6px; min-width: 0; padding: 2px 0; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none; -webkit-mask-image: linear-gradient(90deg, transparent, #000 16px, #000 calc(100% - 16px), transparent); mask-image: linear-gradient(90deg, transparent, #000 16px, #000 calc(100% - 16px), transparent); }
  .client-scene__tabs::before, .client-scene__tabs::after { content: ''; flex: 0 0 50%; }
  .client-scene__tabs::-webkit-scrollbar { display: none; }
  .client-scene__tab { flex: 0 0 auto; max-width: 100%; min-height: 34px; padding: 7px 13px; font-size: 12px; text-align: center; white-space: normal; text-wrap: balance; }
  .client-scene__mark { width: 28%; padding: 6px 4px; }
  .client-scene__mark-art { min-height: 38px; }
  .client-scene__mark-art > img { max-height: 36px; }
  .client-scene__monogram { width: 36px; height: 36px; font-size: 14px; }
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
  .client-scene__monogram { width: 24px; height: 24px; font-size: 10px; }
  .client-scene__mark-name { font-size: 10px; line-height: 1.25; text-wrap: balance; }
}
/* Phones: two columns of logo cards in the sky (up to five rows), no leader lines; the page arrows sit beside the grid's middle. */
.client-scene__marks.is-grid { --client-card-columns: 2; --client-card-gap: 10px; bottom: auto; display: flex; flex-wrap: wrap; justify-content: center; gap: var(--client-card-gap); inset-inline: 60px; }
.client-scene__marks.is-grid .client-scene__mark { position: relative; flex: 0 0 auto; justify-content: center; width: calc((100% - var(--client-card-gap) * (var(--client-card-columns) - 1)) / var(--client-card-columns)); min-height: 56px; padding: 6px; gap: 4px; border: 1px solid #d5e8d94d; border-radius: 12px; background: #0f3a2ab3; transform: translateY(10px); transition: opacity 180ms ease, transform 180ms ease, color 180ms ease, border-color 180ms ease, background-color 180ms ease; }
.client-scene__marks.is-grid .client-scene__mark.is-visible { transform: none; }
.client-scene__marks.is-grid .client-scene__mark:focus-visible, .client-scene__marks.is-grid .client-scene__mark.is-selected { border-color: #a0ebbb; background: #a0ebbb1f; }
@media (hover: hover) { .client-scene__marks.is-grid .client-scene__mark:hover { border-color: #a0ebbb; background: #a0ebbb1f; } }
.client-scene__marks.is-grid .client-scene__mark-art { min-height: 26px; }
.client-scene__marks.is-grid .client-scene__mark-art > img { max-width: 80%; max-height: 26px; }
.client-scene__marks.is-grid .client-scene__monogram { width: 26px; height: 26px; font-size: 11px; }
.client-scene__marks.is-grid .client-scene__mark-name { font-size: 11px; }
/* grid-area: auto so the arrows position against the stage edges rather than the pagination's padded columns. */
.client-scene.is-mobile .client-scene__pagination .client-scene__arrow { grid-area: auto; position: absolute; top: var(--client-grid-arrow, 50%); left: 6px; width: 40px; height: 40px; min-width: 0; transform: translateY(-50%); }
.client-scene.is-mobile .client-scene__pagination .client-scene__arrow--next { left: auto; right: 6px; }
.client-scene.is-mobile .client-scene__pagination .client-scene__arrow:hover:not([aria-disabled='true']) { transform: translateY(calc(-50% - 1px)); }
@media (max-width: 1023px) and (orientation: landscape) {
  .client-scene__marks.is-grid { --client-card-columns: 4; }
}
@media (max-width: 1023px) and (max-height: 450px) {
  .client-scene__heading { top: 72px; }
  .client-scene__heading h2 { max-width: 32ch; font-size: 26px; }
}
@media (prefers-reduced-motion: reduce) {
  .client-scene__plate, .client-scene__mark { transition-duration: 100ms; }
  .client-scene__tab { transition: none; }
}
.client-scene.is-reduced .client-scene__plate,
.client-scene.is-reduced .client-scene__mark { transition-duration: 100ms; }
.client-scene.is-reduced .client-scene__tab { transition: none; }
</style>
