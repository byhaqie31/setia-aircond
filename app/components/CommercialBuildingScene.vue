<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CommercialSkylinePlate from '~/components/CommercialSkylinePlate.vue'
import { commercialServices } from '~/data/commercial-view'
import { easeCamera, samples, smoothstep } from '~/utils/building-zoom'
import { compactEquipmentLabels, compactRowLabels, compactRowWidths, type CommercialLeader, type CommercialLabelBounds, type ScenePhase } from '~/utils/commercial-view-layout'
import type { ArrivalMode } from '~/utils/navigation'

const props = withDefaults(defineProps<{
  phase: ScenePhase
  reducedMotion?: boolean
  selectedServiceSlug?: string | null
  unlitSrc?: string
  litSrc?: string
  fromClients?: boolean
  /** Rendered inside the home page's cover: 'entry' holds the frame the page will continue from, 'return' the resting scene it leaves. */
  preview?: 'entry' | 'return' | null
  /** Arriving under that cover, the scene is already grown and lit, so only the reveal remains. */
  arrival?: ArrivalMode | null
}>(), {
  reducedMotion: false,
  selectedServiceSlug: null,
  unlitSrc: '/images/commercial/building/commercial-roof-unlit.webp',
  litSrc: '/images/commercial/building/commercial-roof-lit.webp',
  fromClients: false,
})

const emit = defineEmits<{
  ready: []
  'exit-complete': []
  next: []
  'service-select': [slug: string]
}>()

type LocalStage = 'hold' | 'grow' | 'settle' | 'reveal' | 'ready' | 'retract' | 'unlight' | 'dim' | 'zoom' | 'backdrop' | 'exit' | 'skyline'
const stage = ref<LocalStage>(props.fromClients ? 'skyline' : props.preview === 'return' ? 'ready' : props.preview || props.arrival ? 'settle' : 'hold')
const revealed = ref(props.preview === 'return' ? commercialServices.length : 0)
const enhanced = ref(false)
const desktop = ref(false)
const mobile = ref(false)
const unlitFailed = ref(false)
const litFailed = ref(false)
const unlitLoaded = ref(false)
const litLoaded = ref(false)
const imageTimedOut = ref(false)
const allImagesFailed = computed(() => unlitFailed.value && litFailed.value)
const usableImage = computed(() => unlitLoaded.value || litLoaded.value)
const imageUnavailable = computed(() => allImagesFailed.value || imageTimedOut.value)
const sceneElement = ref<HTMLElement | null>(null)
const stageElement = ref<HTMLElement | null>(null)
const plateElement = ref<HTMLElement | null>(null)
const streetElement = ref<HTMLElement | null>(null)
const skylinePlate = ref<InstanceType<typeof CommercialSkylinePlate> | null>(null)
const exitDrop = ref('0px')
const headingElement = ref<HTMLElement | null>(null)
const markerElement = ref<HTMLElement | null>(null)
const imageElement = ref<HTMLImageElement | null>(null)
const litImageElement = ref<HTMLImageElement | null>(null)
const streetUnlit = ref('')
const streetLit = ref('')
const mobileArtworkRatio = ref(1001 / 1430)
const leaders = ref<CommercialLeader[]>([])
const markerTops = ref<Record<string, number>>({})
const markerWidths = ref<Record<string, number>>({})
const labelBounds = ref<CommercialLabelBounds[]>([])
const compactMinimum = ref('620px')
const compactOverflow = ref('0px')
const compactDescriptions: Record<string, string> = {
  'cooling-tower': 'Install & maintain',
  pump: 'Flow enquiries',
  chiller: 'Service & repair',
  'vrf-vrv': 'Multi-zone cooling',
  ahu: 'Airflow enquiry',
  'chilled-water-piping': 'Chilled-water pipework',
  'duct-services': 'Supply, install & repair',
}

const equipmentPositions = [
  { id: 'cooling-tower', x: .300, y: .245 },
  { id: 'pump', x: .425, y: .350 },
  { id: 'chilled-water-piping', x: .470, y: .325 },
  { id: 'chiller', x: .552, y: .332 },
  { id: 'vrf-vrv', x: .709, y: .403 },
  { id: 'ahu', x: .847, y: .402 },
  { id: 'duct-services', x: .903, y: .365 },
] as const
const mobileEquipmentPositions = [
  { id: 'cooling-tower', x: .220, y: .130 },
  { id: 'pump', x: .400, y: .280 },
  { id: 'chilled-water-piping', x: .463, y: .240 },
  { id: 'chiller', x: .580, y: .275 },
  { id: 'vrf-vrv', x: .745, y: .345 },
  { id: 'ahu', x: .900, y: .340 },
  { id: 'duct-services', x: .942, y: .315 },
] as const

const showLit = computed(() => !['hold', 'unlight', 'dim', 'zoom', 'backdrop', 'exit', 'skyline'].includes(stage.value) && !litFailed.value)
const isGrown = computed(() => stage.value !== 'hold')
const markersAvailable = computed(() => stage.value === 'ready' && props.phase !== 'exit' && usableImage.value && !imageUnavailable.value)
const isExiting = computed(() => ['retract', 'unlight', 'dim', 'zoom', 'backdrop', 'exit', 'skyline'].includes(stage.value))
const isZoomed = computed(() => ['zoom', 'backdrop', 'exit', 'skyline'].includes(stage.value))
const skylineVisible = computed(() => ['backdrop', 'exit', 'skyline'].includes(stage.value))

let resizeObserver: ResizeObserver | null = null
let viewportQuery: MediaQueryList | null = null
let pending: ReturnType<typeof setTimeout>[] = []
let imageWatchdog: ReturnType<typeof setTimeout> | undefined
let sequence = 0

function later(callback: () => void, delay: number) {
  const timer = setTimeout(callback, delay)
  pending.push(timer)
}

function cancelSequence() {
  sequence++
  pending.forEach(clearTimeout)
  pending = []
  cancelCamera()
}

function showReady(announce = true) {
  cancelSequence()
  stage.value = 'ready'
  revealed.value = commercialServices.length
  if (announce) emit('ready')
}

function beginIntro() {
  if (props.preview) return
  if (props.fromClients) {
    beginReturn()
    return
  }
  if (props.arrival) {
    beginArrival()
    return
  }
  cancelSequence()
  if (props.reducedMotion || document.hidden) {
    showReady()
    return
  }
  const current = sequence
  stage.value = 'hold'
  revealed.value = 0
  later(() => {
    if (sequence !== current) return
    stage.value = 'grow'
    later(() => {
      if (sequence !== current) return
      stage.value = 'settle'
      void nextTick(updateLeaders)
      later(() => {
        if (sequence !== current) return
        stage.value = 'reveal'
        commercialServices.forEach((_, index) => {
          later(() => { if (sequence === current) revealed.value = index + 1 }, index * 160)
        })
        later(() => { if (sequence === current) showReady() }, (commercialServices.length - 1) * 160 + 640)
      }, 650)
    }, 1000)
  }, 650)
}

/** The home cover handed over a grown, lit building: skip the hold and grow, then reveal the services. */
function beginArrival() {
  cancelSequence()
  if (props.arrival === 'instant' || props.reducedMotion || document.hidden) {
    showReady()
    return
  }
  const current = sequence
  stage.value = 'settle'
  revealed.value = 0
  void nextTick(updateLeaders)
  later(() => {
    if (current !== sequence) return
    stage.value = 'reveal'
    commercialServices.forEach((_, index) => {
      later(() => { if (current === sequence) revealed.value = index + 1 }, index * 110)
    })
    later(() => { if (current === sequence) showReady() }, (commercialServices.length - 1) * 110 + 520)
  }, 200)
}

let camera: Animation[] = []

function cancelCamera() {
  for (const animation of camera) animation.cancel()
  camera = []
}

/**
 * One pull-back shared by the building and the skyline behind it. The
 * building recedes at a constant perceived speed while the city arrives from
 * twice its size on the same camera, crossfading through the middle of the
 * move; the lights dim first and the skyline brightens as it settles.
 */
function cameraKeyframes() {
  const exposure = Number.parseFloat(sceneElement.value ? getComputedStyle(sceneElement.value).getPropertyValue('--commercial-art-exposure') : '') || 1
  const plate: Keyframe[] = []
  const street: Keyframe[] = []
  const skyline: Keyframe[] = []
  for (let index = 0; index <= samples; index++) {
    const t = index / samples
    const zoom = .5 ** easeCamera(t)
    const exposed = (exposure * (1 - .65 * smoothstep(.08, .5, t))).toFixed(3)
    const present = (1 - smoothstep(.42, .72, t)).toFixed(3)
    const lit = smoothstep(.5, .96, t)
    plate.push({ offset: t, transform: `translateY(${exitDrop.value}) scale(${zoom.toFixed(4)})`, opacity: present, filter: `brightness(${exposed})` })
    street.push({ offset: t, opacity: present, filter: `brightness(${exposed})` })
    skyline.push({
      offset: t,
      transform: `translateX(-50%) scale(${(zoom * 2).toFixed(4)})`,
      opacity: smoothstep(.3, .62, t).toFixed(3),
      filter: `brightness(${(.22 + .88 * lit).toFixed(3)}) contrast(1.04) saturate(${(.6 + .42 * lit).toFixed(3)})`,
    })
  }
  return { plate, street, skyline }
}

/** Drive the handoff with the Web Animations API; the class state is set to the destination first, so nothing snaps when the animations are released. */
function startCamera(direction: PlaybackDirection, duration: number) {
  cancelCamera()
  const plate = plateElement.value
  const skyline = skylinePlate.value?.$el as HTMLElement | undefined
  if (!plate || !skyline || typeof plate.animate !== 'function') return null
  try {
    const frames = cameraKeyframes()
    const timing: KeyframeAnimationOptions = { duration, direction, fill: 'both' }
    camera = [plate.animate(frames.plate, timing), skyline.animate(frames.skyline, timing)]
    if (streetElement.value) camera.push(streetElement.value.animate(frames.street, timing))
    return camera[0]!.finished
  } catch {
    cancelCamera()
    return null
  }
}

function beginReturn() {
  cancelSequence()
  if (props.reducedMotion || document.hidden) {
    showReady()
    return
  }
  const current = sequence
  stage.value = 'skyline'
  revealed.value = 0
  // Play the pull-back backwards: the city recedes as the building comes forward, then its lights and labels return.
  later(() => {
    if (current !== sequence) return
    stage.value = 'unlight'
    const finished = startCamera('reverse', 1500)
    const land = () => {
      if (current !== sequence) return
      cancelCamera()
      stage.value = 'settle'
      void nextTick(updateLeaders)
      later(() => {
        if (current !== sequence) return
        stage.value = 'reveal'
        commercialServices.forEach((_, index) => {
          later(() => { if (current === sequence) revealed.value = index + 1 }, index * 110)
        })
        later(() => { if (current === sequence) showReady() }, (commercialServices.length - 1) * 110 + 520)
      }, 520)
    }
    if (finished) void finished.then(land).catch(() => {})
    else later(land, 700)
  }, 60)
}

function beginExit() {
  cancelSequence()
  if (props.reducedMotion || document.hidden) {
    stage.value = 'exit'
    revealed.value = 0
    emit('exit-complete')
    return
  }
  stage.value = 'retract'
  revealed.value = 0
  const current = sequence
  // Labels retract, then one pull-back carries the building into the skyline behind it.
  later(() => {
    if (current !== sequence) return
    stage.value = 'skyline'
    const finished = startCamera('normal', 1700)
    const handOff = () => { if (current === sequence) emit('exit-complete') }
    if (finished) void finished.then(handOff).catch(() => {})
    else later(handOff, 700)
  }, 220)
}

function requestNext() {
  if (props.phase === 'exit') return
  if (stage.value !== 'ready') showReady(false)
  emit('next')
}

function onVisibilityChange() {
  if (document.hidden && props.phase === 'intro' && stage.value !== 'ready') showReady()
  else if (document.hidden && props.phase === 'exit') {
    cancelSequence()
    stage.value = 'exit'
    emit('exit-complete')
  }
}

function updateViewport() {
  desktop.value = Boolean(viewportQuery?.matches)
  mobile.value = window.innerWidth < 1024
  void nextTick(updateLeaders)
}

function updateLeaders() {
  exitDrop.value = `${Math.max(0, (sceneElement.value?.clientHeight ?? 0) - (stageElement.value?.clientHeight ?? 0))}px`
  compactOverflow.value = `${Math.max(0, (stageElement.value?.clientHeight ?? 0) - (sceneElement.value?.clientHeight ?? 0))}px`
  const scene = stageElement.value
  const image = (unlitFailed.value ? litImageElement.value : imageElement.value) ?? imageElement.value
  if (!scene || !image) return
  // The home cover scales this scene while it measures; work in layout pixels either way.
  const scaled = scene.getBoundingClientRect()
  const unit = scene.offsetWidth ? scaled.width / scene.offsetWidth : 1
  const measure = (element: Element) => {
    const rect = element.getBoundingClientRect()
    return new DOMRect(rect.left / unit, rect.top / unit, rect.width / unit, rect.height / unit)
  }
  const sceneRect = measure(scene)
  const imageRect = measure(image)
  if (!sceneRect.width || !sceneRect.height || !imageRect.width || !imageRect.height) return
  const naturalWidth = image.naturalWidth || 2169
  const naturalHeight = image.naturalHeight || 725
  mobileArtworkRatio.value = naturalHeight / naturalWidth
  // Reuse decoded picture sources for the fixed street, including image failure fallback.
  streetUnlit.value = imageElement.value?.naturalWidth ? imageElement.value.currentSrc : litImageElement.value?.currentSrc ?? ''
  streetLit.value = litImageElement.value?.naturalWidth ? litImageElement.value.currentSrc : streetUnlit.value
  const scale = Math.min(imageRect.width / naturalWidth, imageRect.height / naturalHeight)
  const drawnWidth = naturalWidth * scale
  const drawnHeight = naturalHeight * scale
  const drawnLeft = imageRect.left + (imageRect.width - drawnWidth) / 2
  const drawnTop = imageRect.bottom - drawnHeight
  const markerHeights = Array.from(markerElement.value?.children ?? [], marker => (marker as HTMLElement).offsetHeight)
  Array.from(markerElement.value?.children ?? []).forEach(marker => resizeObserver?.observe(marker))
  if (!desktop.value) {
    const headingBottom = (headingElement.value ? measure(headingElement.value).bottom : sceneRect.top + 180) - sceneRect.top
    const artworkPositions = naturalHeight / naturalWidth > .5 ? mobileEquipmentPositions : equipmentPositions
    const anchors = artworkPositions.map(item => (drawnLeft + item.x * drawnWidth - sceneRect.left) / sceneRect.width)
    const stagger = Math.max(Math.min(96, sceneRect.height * .1), Math.max(44, ...markerHeights.filter((_, index) => index % 2 === 0)) + 14)
    const labels = mobile.value
      ? compactRowLabels(anchors, headingBottom, drawnTop - sceneRect.top, markerHeights).map((label, index) => ({
        ...label,
        top: index % 2
          ? Math.max(label.top, headingBottom + 24 + stagger)
          : Math.max(headingBottom + 24, label.top - stagger),
      }))
      : compactEquipmentLabels(anchors, headingBottom, markerHeights)
    // Adjacent labels alternate rows, so size against neighbours in the same row.
    const rowWidths = [0, 1].map(row => compactRowWidths(anchors.filter((_, index) => index % 2 === row), sceneRect.width))
    const widths = anchors.map((_, index) => rowWidths[index % 2]?.[Math.floor(index / 2)] ?? 44)
    labels.forEach((label, index) => {
      const inset = ((widths[index] ?? 44) / 2 + 4) / sceneRect.width
      label.x = Math.max(inset, Math.min(1 - inset, label.x))
    })
    // Edge clamping must not push the rightmost touch target into its row neighbour.
    for (let index = labels.length - 3; index >= 0; index--) {
      const label = labels[index]!
      const next = labels[index + 2]!
      const separation = ((widths[index] ?? 44) / 2 + (widths[index + 2] ?? 44) / 2 + 6) / sceneRect.width
      label.x = Math.min(label.x, next.x - separation)
    }
    markerTops.value = Object.fromEntries(artworkPositions.map((item, index) => [item.id, labels[index]?.top ?? headingBottom + 22]))
    markerWidths.value = Object.fromEntries(artworkPositions.map((item, index) => [item.id, widths[index] ?? 100]))
    labelBounds.value = mobile.value ? [] : labels.map((label, index) => ({
      x: label.x - (widths[index] ?? 100) / sceneRect.width / 2 - .01,
      y: label.top / sceneRect.height - .006,
      width: (widths[index] ?? 100) / sceneRect.width + .02,
      height: (markerHeights[index] ?? 70) / sceneRect.height + .012,
    }))
    // The diagram remains one scene; very short views can pan its complete height.
    compactMinimum.value = mobile.value ? '0px' : `${Math.max(620, Math.max(...labels.map((label, index) => label.top + (markerHeights[index] ?? 70))) + drawnHeight + 24)}px`
    leaders.value = artworkPositions.map((item, index) => ({
      id: item.id,
      targetX: anchors[index] ?? .5,
      targetY: (drawnTop + item.y * drawnHeight - sceneRect.top) / sceneRect.height,
      labelX: labels[index]?.x ?? .5,
      labelY: ((labels[index]?.top ?? headingBottom) + (markerHeights[index] ?? 70) + 6) / sceneRect.height,
    }))
    return
  }
  labelBounds.value = []
  const raise = (index: number) => ['chilled-water-piping', 'duct-services'].includes(equipmentPositions[index]?.id ?? '') ? (markerHeights[index] ?? 100) + 24 : 0
  // Leader lines keep at least this much height between a label and its equipment.
  const roofClearance = (leader: number) => Math.min(...equipmentPositions.map((item, index) =>
    drawnTop + item.y * drawnHeight - sceneRect.top - (markerHeights[index] ?? 100) - leader,
  ))
  // The centred heading sits over the middle of the row, so the raised labels must clear its bottom edge.
  const headingBottom = headingElement.value ? measure(headingElement.value).bottom - sceneRect.top : 0
  const clearHeading = headingBottom + 20 + Math.max(0, ...equipmentPositions.map((_, index) => raise(index)))
  let rowTop = Math.min(sceneRect.height * .38, roofClearance(48))
  if (rowTop < clearHeading) rowTop = Math.min(clearHeading, roofClearance(24))
  markerTops.value = Object.fromEntries(equipmentPositions.map((item, index) => [item.id, rowTop - raise(index)]))
  // Follow the client's two square-corner routes into the empty left side.
  leaders.value = equipmentPositions.map((item, index) => {
    const targetX = (drawnLeft + item.x * drawnWidth - sceneRect.left) / sceneRect.width
    const targetY = (drawnTop + item.y * drawnHeight - sceneRect.top) / sceneRect.height
    const markerWidth = (markerElement.value?.children[index] as HTMLElement | undefined)?.offsetWidth ?? 220
    const inset = (markerWidth / 2 + 8) / sceneRect.width
    return {
      id: item.id,
      targetX,
      targetY,
      labelX: item.id === 'cooling-tower' ? .10 : item.id === 'pump' ? .29 : Math.max(inset, Math.min(1 - inset, targetX)),
      labelY: ((markerTops.value[item.id] ?? 0) + (markerHeights[index] ?? 100)) / sceneRect.height,
      elbow: item.id === 'cooling-tower' ? 'at-target-height' : item.id === 'pump' ? 'at-label-height' : undefined,
    }
  })
}

function leaderFor(slug: string) {
  return leaders.value.find(leader => leader.id === slug)
}

watch(() => props.phase, phase => {
  if (!enhanced.value) return
  if (phase === 'intro') beginIntro()
  else if (phase === 'ready') showReady(false)
  else beginExit()
})

watch(() => props.reducedMotion, reduced => {
  if (reduced && props.phase === 'intro' && stage.value !== 'ready') showReady()
  else if (reduced && props.phase === 'exit') {
    cancelSequence()
    stage.value = 'exit'
    emit('exit-complete')
  }
})

watch(imageUnavailable, failed => {
  if (failed && props.phase === 'intro') showReady()
})

watch([desktop, usableImage], () => { void nextTick(updateLeaders) })

onMounted(() => {
  enhanced.value = true
  if (imageElement.value?.complete) {
    unlitLoaded.value = imageElement.value.naturalWidth > 0
    unlitFailed.value = !unlitLoaded.value
  }
  if (litImageElement.value?.complete) {
    litLoaded.value = litImageElement.value.naturalWidth > 0
    litFailed.value = !litLoaded.value
  }
  imageWatchdog = setTimeout(() => {
    if (!usableImage.value) imageTimedOut.value = true
  }, 4200)
  viewportQuery = window.matchMedia('(min-width: 1100px) and (min-height: 700px)')
  viewportQuery.addEventListener('change', updateViewport)
  updateViewport()
  resizeObserver = new ResizeObserver(updateLeaders)
  if (sceneElement.value) resizeObserver.observe(sceneElement.value)
  if (stageElement.value) resizeObserver.observe(stageElement.value)
  if (imageElement.value) resizeObserver.observe(imageElement.value)
  if (litImageElement.value) resizeObserver.observe(litImageElement.value)
  if (headingElement.value) resizeObserver.observe(headingElement.value)
  if (markerElement.value) resizeObserver.observe(markerElement.value)
  void document.fonts.ready.then(updateLeaders)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('resize', updateViewport)
  void nextTick(updateLeaders)
  if (props.phase === 'intro') beginIntro()
  else if (props.phase === 'ready') showReady()
  else beginExit()
})

onBeforeUnmount(() => {
  cancelSequence()
  clearTimeout(imageWatchdog)
  resizeObserver?.disconnect()
  viewportQuery?.removeEventListener('change', updateViewport)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('resize', updateViewport)
})
</script>

<template>
  <section id="commercial-services" ref="sceneElement" class="commercial-building-scene" :class="{ 'is-enhanced': enhanced, 'is-desktop': desktop, 'is-compact': enhanced && !desktop, 'is-grown': isGrown, 'is-exiting': isExiting, 'is-reduced': reducedMotion, 'is-restored': phase === 'ready' }" :style="{ '--commercial-exit-drop': exitDrop, '--commercial-compact-min': compactMinimum, '--commercial-compact-overflow': compactOverflow, '--commercial-mobile-art-ratio': mobileArtworkRatio }" :data-lenis-prevent="enhanced && !desktop ? '' : undefined" aria-labelledby="commercial-services-heading">
    <CommercialSkylinePlate v-if="enhanced || fromClients" ref="skylinePlate" class="commercial-building-scene__skyline" aria-hidden="true"
      :revealed="skylineVisible" :dimmed="stage !== 'skyline'" :backdrop="stage !== 'skyline'" />
    <div ref="stageElement" class="commercial-building-scene__stage">
      <div ref="headingElement" class="commercial-building-scene__heading">
        <p class="commercial-building-scene__eyebrow">Commercial</p>
        <h1 id="commercial-services-heading">Commercial air-conditioning services</h1>
      </div>

      <div v-if="enhanced" ref="streetElement" class="commercial-building-scene__street" aria-hidden="true"
        :class="{ 'is-lit': showLit || unlitFailed, 'is-dimmed': stage === 'dim' || isZoomed, 'is-zoomed': isZoomed, 'is-exiting': stage === 'exit' || stage === 'skyline', 'is-image-unavailable': imageUnavailable }"
        :style="{ '--commercial-street-unlit': `url('${streetUnlit}')`, '--commercial-street-lit': `url('${streetLit}')` }" />
      <div ref="plateElement" class="commercial-building-scene__plate" :class="{ 'is-grown': isGrown, 'is-dimmed': stage === 'dim' || isZoomed, 'is-zoomed': isZoomed, 'is-exiting': stage === 'exit' || stage === 'skyline', 'is-image-unavailable': imageUnavailable }">
        <picture class="commercial-building-scene__image-wrap">
        <source media="(max-width: 1023px) and (orientation: landscape)" :srcset="`${$sitePath('/images/commercial/building/commercial-roof-unlit-1280.webp')} 1280w, ${$sitePath(unlitSrc)} 2169w`" sizes="100vw">
        <source media="(max-width: 1099px)" :srcset="`${$sitePath('/images/commercial/building/commercial-roof-mobile-unlit-v4.webp')} 800w, ${$sitePath('/images/commercial/building/commercial-roof-mobile-unlit-v4-1280.webp')} 1280w`" sizes="min(max(100vw, calc(40svh / .7)), 120vw)">
        <img
          ref="imageElement"
          class="commercial-building-scene__image"
          :class="{ 'is-hidden': unlitFailed && !litFailed }"
          :src="$sitePath(unlitSrc)"
          :srcset="`${$sitePath('/images/commercial/building/commercial-roof-unlit-1280.webp')} 1280w, ${$sitePath(unlitSrc)} 2169w`"
          sizes="114vw"
          width="2169"
          height="725"
          alt="Commercial building with rooftop cooling equipment"
          fetchpriority="high"
          @load="unlitLoaded = true; updateLeaders()"
          @error="unlitFailed = true; updateLeaders()"
        >
        </picture>
        <picture class="commercial-building-scene__image-wrap commercial-building-scene__image-wrap--lit" :class="{ 'is-visible': showLit || unlitFailed, 'is-hidden': litFailed }">
        <source media="(max-width: 1023px) and (orientation: landscape)" :srcset="`${$sitePath('/images/commercial/building/commercial-roof-lit-1280.webp')} 1280w, ${$sitePath(litSrc)} 2169w`" sizes="100vw">
        <source media="(max-width: 1099px)" :srcset="`${$sitePath('/images/commercial/building/commercial-roof-mobile-lit-v4.webp')} 800w, ${$sitePath('/images/commercial/building/commercial-roof-mobile-lit-v4-1280.webp')} 1280w`" sizes="min(max(100vw, calc(40svh / .7)), 120vw)">
        <img
          ref="litImageElement"
          class="commercial-building-scene__image commercial-building-scene__image--lit"
          :class="{ 'is-visible': showLit || unlitFailed, 'is-hidden': litFailed }"
          :src="$sitePath(litSrc)"
          :srcset="`${$sitePath('/images/commercial/building/commercial-roof-lit-1280.webp')} 1280w, ${$sitePath(litSrc)} 2169w`"
          sizes="114vw"
          width="2169"
          height="725"
          alt=""
          aria-hidden="true"
          @load="litLoaded = true; updateLeaders()"
          @error="litFailed = true"
        >
        </picture>
      </div>

      <CommercialLeaderLayer
        v-if="leaders.length && enhanced && usableImage && !imageUnavailable"
        :leaders="leaders"
        :visible-count="revealed"
        :retracting="isExiting"
        :selected-id="selectedServiceSlug"
        :reduced-motion="reducedMotion"
        :label-bounds="desktop ? undefined : labelBounds"
      />

      <div v-if="enhanced && usableImage && !imageUnavailable" ref="markerElement" class="commercial-building-scene__markers">
        <NuxtLink
          v-for="(service, index) in commercialServices"
          :key="service.slug"
          class="commercial-building-scene__marker"
          :class="{ 'is-visible': index < revealed && !isExiting, 'is-selected': selectedServiceSlug === service.slug }"
          :style="{ left: `${(leaderFor(service.slug)?.labelX ?? .5) * 100}%`, top: `${markerTops[service.slug] ?? 0}px`, width: desktop ? undefined : `${markerWidths[service.slug] ?? 100}px` }"
          :to="`/commercial/services/${service.slug}`"
          :inert="!markersAvailable"
          :aria-hidden="!markersAvailable || undefined"
          @click="emit('service-select', service.slug)"
        >
          <strong>{{ service.title }}</strong>
          <span v-if="!mobile">{{ desktop ? service.shortLine : compactDescriptions[service.slug] }}</span>
        </NuxtLink>
      </div>

      <div class="commercial-building-scene__actions">
        <NuxtLink class="commercial-building-scene__action" to="/"><span class="icon icon--home" aria-hidden="true" />Back home</NuxtLink>
        <a class="commercial-building-scene__action commercial-building-scene__action--next" :href="$sitePath('/commercial?scene=clients')" :aria-disabled="phase === 'exit' || undefined" @click.prevent="requestNext"><span class="icon icon--people" aria-hidden="true" />Show clientele</a>
      </div>
      <p v-if="imageUnavailable" class="commercial-building-scene__fallback" role="status">Explore the commercial services below.</p>
    </div>

    <nav class="commercial-building-scene__service-list" data-lenis-prevent :class="{ 'is-visually-hidden': enhanced && !imageUnavailable }" aria-label="Commercial services" :inert="enhanced && !imageUnavailable" :aria-hidden="enhanced && !imageUnavailable || undefined">
      <NuxtLink v-for="service in commercialServices" :key="service.slug" :to="`/commercial/services/${service.slug}`" @click="emit('service-select', service.slug)">
        <span>{{ service.title }}</span><small>{{ service.shortLine }}</small>
      </NuxtLink>
    </nav>
  </section>
</template>

<style scoped>
.commercial-building-scene { position: relative; background: radial-gradient(ellipse 75% 36% at 50% 82%, #14503a8c, transparent 78%), linear-gradient(180deg, #061710 0%, #09241a 40%, #0b3022 75%, #0d3524 100%); color: #f5f5ed; }
.commercial-building-scene__stage { position: relative; min-height: max(760px, 100svh); overflow: hidden; isolation: isolate; container-type: inline-size; }
.commercial-building-scene.is-exiting .commercial-building-scene__stage { overflow: visible; }
.commercial-building-scene__heading { position: absolute; z-index: 4; top: clamp(110px, 15svh, 160px); inset-inline: clamp(24px, 5.5vw, 104px); display: grid; justify-items: center; text-align: center; pointer-events: none; }
.commercial-building-scene__eyebrow { margin: 0 0 8px; color: #a7d2b5; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
.commercial-building-scene__heading h1 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(26px, min(2.3vw, 4.4svh), 40px); font-weight: 400; line-height: 1.12; white-space: nowrap; }
.commercial-building-scene__plate { position: absolute; z-index: 1; left: calc(-100% * .06 / .88); bottom: calc(-100cqw * 149 / 2169 / .88); display: grid; place-items: end center; width: calc(100% / .88); aspect-ratio: 2169 / 725; transform: scale(.88); transform-origin: 50% 79.4483%; filter: brightness(var(--commercial-art-exposure, 1)); transition: transform 1000ms cubic-bezier(.22, 1, .36, 1), opacity 450ms ease, filter 240ms ease; }
.commercial-building-scene__plate.is-grown { transform: scale(1); }
.commercial-building-scene__plate.is-dimmed { filter: brightness(calc(var(--commercial-art-exposure, 1) * .35)); }
.commercial-building-scene__plate.is-zoomed { transform: translateY(var(--commercial-exit-drop)) scale(.78); transition-duration: 650ms, 320ms, 240ms; }
.commercial-building-scene__plate.is-exiting { opacity: 0; }
.commercial-building-scene__plate.is-image-unavailable { visibility: hidden; }
.commercial-building-scene__street { display: none; }
.commercial-building-scene__image-wrap { display: block; grid-area: 1 / 1; width: 100%; height: 100%; }
.commercial-building-scene__image { display: block; grid-area: 1 / 1; width: 100%; height: 100%; object-fit: cover; -webkit-mask: url('/images/commercial/building/commercial-roof-silhouette-v2.svg') center / 100% 100% no-repeat; mask: url('/images/commercial/building/commercial-roof-silhouette-v2.svg') center / 100% 100% no-repeat; }
.commercial-building-scene__image--lit { opacity: 0; transition: opacity 480ms ease; }
.commercial-building-scene__image--lit.is-visible { opacity: 1; transition-delay: 220ms; }
.commercial-building-scene.is-restored .commercial-building-scene__image--lit.is-visible { transition: none; }
.commercial-building-scene__image.is-hidden { visibility: hidden; }
.commercial-building-scene__markers { position: absolute; z-index: 3; inset: 0; pointer-events: none; }
.commercial-building-scene__marker { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 5px; width: clamp(116px, 11.3vw, 220px); min-height: 48px; padding: 9px 0; color: #f6fbf7; opacity: 0; pointer-events: none; transform: translate(-50%, 8px); transition: opacity 200ms ease, transform 200ms ease, color 180ms ease; text-align: center; text-decoration: none; }
.commercial-building-scene__marker.is-visible { opacity: 1; pointer-events: auto; transform: translateX(-50%); transition-delay: 180ms; }
.commercial-building-scene__marker:hover, .commercial-building-scene__marker:focus-visible, .commercial-building-scene__marker.is-selected { color: #a0ebbb; }
.commercial-building-scene__marker strong { font-size: clamp(15px, 1.1vw, 18px); line-height: 1.2; }
.commercial-building-scene__marker span { max-width: 22ch; color: #cfddd1; font-size: clamp(12px, .8vw, 14px); line-height: 1.35; }
.commercial-building-scene__actions { position: absolute; z-index: 5; inset-inline: 16px; bottom: max(22px, 3.5svh); display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 12px; pointer-events: none; }
/* Secondary pill is white, like the client scene arrows; --next is the green primary. */
.commercial-building-scene__action { display: inline-flex; align-items: center; justify-content: center; gap: 12px; min-height: 48px; padding: 12px 22px; border: 1px solid transparent; border-radius: 100px; color: var(--service-stage); background: var(--paper); box-shadow: 0 2px 10px #0617104d; font-size: 14px; font-weight: 600; line-height: 1.25; white-space: nowrap; text-decoration: none; pointer-events: auto; transition: background-color .2s ease, box-shadow .2s ease, transform .2s ease; }
.commercial-building-scene__action .icon { width: 16px; height: 16px; }
.commercial-building-scene__action:hover { background: #fff; box-shadow: 0 4px 14px #06171066; transform: translateY(-1px); }
.commercial-building-scene__action--next { color: var(--stage); background: var(--green); box-shadow: none; }
.commercial-building-scene__action--next:hover { background: var(--green-bright); box-shadow: none; }
.commercial-building-scene__action[aria-disabled='true'] { cursor: wait; }
.commercial-building-scene__heading, .commercial-building-scene__actions, .commercial-building-scene__service-list { transition: opacity 220ms ease; }
.commercial-building-scene.is-exiting :is(.commercial-building-scene__heading, .commercial-building-scene__actions, .commercial-building-scene__service-list) { opacity: 0; pointer-events: none; }
.commercial-building-scene.is-exiting .commercial-building-scene__action { pointer-events: none; }
.commercial-building-scene__fallback { position: absolute; top: 50%; left: clamp(24px, 5.5vw, 104px); max-width: 28ch; color: #c9dfcf; font-size: 17px; line-height: 1.45; }
.commercial-building-scene :is(a, button):focus-visible { outline: 2px solid #a0ebbb; outline-offset: 4px; }
.commercial-building-scene__service-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 28px; padding: 22px clamp(24px, 5.5vw, 104px) 100px; }
.commercial-building-scene__service-list a { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; min-height: 56px; padding: 12px 0; border-top: 1px solid #d5e8d933; color: #f5f5ed; text-decoration: none; }
.commercial-building-scene__service-list a:hover { color: #a0ebbb; }
.commercial-building-scene__service-list span { font-size: 16px; font-weight: 600; }
.commercial-building-scene__service-list small { max-width: 24ch; color: #c1d5c7; font-size: 13px; line-height: 1.4; }
.commercial-building-scene__service-list.is-visually-hidden { position: absolute; top: 0; left: 0; width: 1px; height: 1px; padding: 0; margin: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 1099px), (max-height: 699px) {
  .commercial-building-scene__stage { min-height: max(620px, 100svh); }
  .commercial-building-scene__heading { top: 88px; inset-inline: 24px; }
  /* One line at every width: the title is about 16em wide in Georgia, so size it from the stage. */
  .commercial-building-scene__heading h1 { font-size: clamp(17px, calc((100cqw - 48px) / 17.5), 38px); }
  .commercial-building-scene__marker { width: 28%; padding: 4px; gap: 4px; }
  .commercial-building-scene__marker strong { font-size: 16px; }
  .commercial-building-scene__marker span { font-size: 14px; line-height: 1.35; }
}
@media (max-width: 1099px) {
  .commercial-building-scene__plate { left: 0; bottom: -1px; width: 100%; aspect-ratio: 800 / 466; transform-origin: 50% 100%; }
  .commercial-building-scene__image { object-fit: contain; mask: none; -webkit-mask: none; }
  .commercial-building-scene__skyline { bottom: calc(-1 * var(--commercial-compact-overflow, 0px) - 1px); }
}
@media (max-width: 699px) {
  .commercial-building-scene__heading { top: 88px; }
  .commercial-building-scene__marker { width: 42%; }
  .commercial-building-scene__marker strong { font-size: 16px; }
  .commercial-building-scene__service-list { display: block; padding-bottom: 52px; }
  .commercial-building-scene__service-list a { display: block; min-height: 66px; }
  .commercial-building-scene__service-list small { display: block; margin-top: 3px; font-size: 14px; }
}
.commercial-building-scene.is-enhanced { height: 100svh; overflow: hidden; }
@media (min-width: 1100px) and (min-height: 700px) {
  .commercial-building-scene.is-enhanced .commercial-building-scene__stage { min-height: 0; height: 100%; }
}
@media (max-width: 1099px), (max-height: 699px) {
  .commercial-building-scene.is-enhanced { overflow-x: clip; overflow-y: auto; overscroll-behavior: contain; }
  .commercial-building-scene.is-enhanced .commercial-building-scene__stage { height: max(620px, 100svh, var(--commercial-compact-min, 620px)); }
  .commercial-building-scene__actions { bottom: max(12px, env(safe-area-inset-bottom)); }
}
@media (max-width: 1023px) {
  .commercial-building-scene__stage,
  .commercial-building-scene.is-enhanced .commercial-building-scene__stage { min-height: 0; height: 100svh; }
  .commercial-building-scene__plate { height: 40svh; aspect-ratio: auto; grid-template: minmax(0, 1fr) / minmax(0, 1fr); }
  .commercial-building-scene__image { object-position: center bottom; }
  .commercial-building-scene__marker { justify-content: end; min-height: 44px; padding: 4px 2px; }
  .commercial-building-scene__marker strong { font-size: 12px; line-height: 1.25; text-wrap: balance; }
  .commercial-building-scene__actions { gap: 8px; }
  .commercial-building-scene__action { min-height: 44px; padding: 10px 16px; font-size: 13px; }
}
@media (max-width: 1023px) and (orientation: portrait) {
  .commercial-building-scene { --commercial-art-exposure: .82; --commercial-mobile-art-width: min(max(100cqw, calc(40svh / var(--commercial-mobile-art-ratio))), 120cqw); }
  .commercial-building-scene__plate,
  .commercial-building-scene__street { height: max(40svh, calc(100cqw * var(--commercial-mobile-art-ratio))); }
  .commercial-building-scene__plate { left: calc((100cqw - var(--commercial-mobile-art-width)) * .79); width: var(--commercial-mobile-art-width); }
  .commercial-building-scene__street { display: block; position: absolute; z-index: 1; left: 0; bottom: -1px; width: 100%; pointer-events: none; clip-path: inset(80% 0 0); filter: brightness(var(--commercial-art-exposure)); transition: opacity 450ms ease, filter 240ms ease; }
  .commercial-building-scene__street::before,
  .commercial-building-scene__street::after { content: ''; position: absolute; inset: 0; background-position: 79% bottom; background-size: var(--commercial-mobile-art-width) auto; background-repeat: no-repeat; }
  .commercial-building-scene__street::before { background-image: var(--commercial-street-unlit); }
  .commercial-building-scene__street::after { background-image: var(--commercial-street-lit); opacity: 0; transition: opacity 480ms ease; }
  .commercial-building-scene__street.is-lit::after { opacity: 1; transition-delay: 220ms; }
  .commercial-building-scene__street.is-dimmed { filter: brightness(calc(var(--commercial-art-exposure) * .35)); }
  .commercial-building-scene__street.is-zoomed { transition-duration: 320ms, 240ms; }
  .commercial-building-scene__street.is-exiting { opacity: 0; }
  .commercial-building-scene__street.is-image-unavailable { visibility: hidden; }
  .commercial-building-scene.is-restored .commercial-building-scene__street.is-lit::after { transition: none; }
}
@media (max-width: 1023px) and (max-height: 450px) {
  .commercial-building-scene__heading { top: 72px; }
  .commercial-building-scene__heading h1 { font-size: min(26px, calc((100cqw - 48px) / 17.5)); }
}
@media (max-width: 1023px) and (orientation: landscape) {
  .commercial-building-scene__plate {
    left: calc(50% - 20svh * 2169 / 576);
    bottom: calc(-40svh * 149 / 576);
    width: calc(40svh * 2169 / 576);
    height: calc(40svh * 725 / 576);
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    transform-origin: 50% 79.4483%;
  }
  .commercial-building-scene__image {
    -webkit-mask: url('/images/commercial/building/commercial-roof-silhouette-v2.svg') center / 100% 100% no-repeat;
    mask: url('/images/commercial/building/commercial-roof-silhouette-v2.svg') center / 100% 100% no-repeat;
  }
}
@media (prefers-reduced-motion: reduce) {
  .commercial-building-scene__plate, .commercial-building-scene__image--lit, .commercial-building-scene__marker { transition-duration: 100ms; }
  .commercial-building-scene__street, .commercial-building-scene__street::after { transition-duration: 100ms; transition-delay: 0ms; }
}
.commercial-building-scene.is-reduced .commercial-building-scene__plate,
.commercial-building-scene.is-reduced .commercial-building-scene__image--lit,
.commercial-building-scene.is-reduced .commercial-building-scene__marker { transition-duration: 100ms; }
.commercial-building-scene.is-reduced .commercial-building-scene__street,
.commercial-building-scene.is-reduced .commercial-building-scene__street::after { transition-duration: 100ms; transition-delay: 0ms; }
.commercial-building-scene.is-reduced .commercial-building-scene__image--lit.is-visible { transition-delay: 0ms; }
</style>
