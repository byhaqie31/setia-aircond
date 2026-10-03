<script setup lang="ts">
import { isPlainNavigation, type BuildingFloor } from '~/utils/navigation'
import { planResidentialZoom, type ResidentialZoomPlan } from '~/utils/residential-zoom'

const building = useTemplateRef('building')
const exploreTrigger = useTemplateRef<HTMLButtonElement>('exploreTrigger')
const residentialChoice = useTemplateRef<HTMLAnchorElement>('residentialChoice')
const commercialChoice = useTemplateRef<HTMLAnchorElement>('commercialChoice')
const transition = useTemplateRef('transition')
const choosingFloor = ref(false)
const serviceReturn = useState<BuildingFloor | null>('service-return', () => null)
// Back from Residential: open inside the room, then pull the camera out.
const returningHome = ref(serviceReturn.value === 'residential' && import.meta.client
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
serviceReturn.value = null
const showTransition = ref(returningHome.value)
const openingFloor = ref<BuildingFloor | null>(null)
// Holds a DOM element, so keep it out of Vue's deep reactivity.
const residentialZoom = shallowRef<ResidentialZoomPlan | null>(null)
const serviceArrival = useState<BuildingFloor | null>('service-arrival', () => null)
const navigationError = ref('')
const destinationName = computed(() => openingFloor.value === 'commercial' ? 'Commercial' : 'Residential')
const router = useRouter()
let lightingTimer: ReturnType<typeof setTimeout> | undefined
let assetTimer: ReturnType<typeof setTimeout> | undefined
let finishAssetWait: (() => void) | undefined
let entryAttempt = 0
let navigating = false
let disposed = false
let reducedMotion: MediaQueryList | undefined
let commercialImagePreparation: Promise<unknown> | undefined

useHead({
  htmlAttrs: { 'data-theme': 'dark' },
  title: 'Setia | Air-conditioning & Electrical Since 1990',
  meta: [{
    name: 'description',
    content: 'Air-conditioning and electrical systems for commercial and residential spaces across Kuala Lumpur and Selangor supplied, installed and maintained since 1990.',
  }],
})

onMounted(() => {
  void preloadRouteComponents('/residential', router).catch(() => {})
  void preloadRouteComponents('/commercial', router).catch(() => {})
  void prepareCommercialImages()
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.addEventListener('change', onMotionChange)
  window.addEventListener('keydown', onKeydown, true)
  if (returningHome.value) playReturn()
})

onBeforeUnmount(() => {
  disposed = true
  entryAttempt++
  clearEntryTimers()
  reducedMotion?.removeEventListener('change', onMotionChange)
  window.removeEventListener('keydown', onKeydown, true)
})

function clearEntryTimers() {
  clearTimeout(lightingTimer)
  clearTimeout(assetTimer)
  finishAssetWait?.()
  finishAssetWait = undefined
}

function prepareCommercialImages() {
  if (typeof Image === 'undefined') return Promise.resolve()
  if (commercialImagePreparation) return commercialImagePreparation
  const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '')
  const portraitArtwork = window.matchMedia('(max-width: 1099px)').matches
    && !window.matchMedia('(max-width: 1023px) and (orientation: landscape)').matches
  const sizes = portraitArtwork ? 'min(max(100vw, calc(40svh / .7)), 120vw)' : '114vw'
  const assets = [
    { src: '/images/hero/building-zoom-extended-v1.webp', srcset: '' },
    ...['unlit', 'lit'].map(light => ({
      src: `/images/commercial/building/commercial-roof-${light}.webp`,
      srcset: portraitArtwork
        ? `${base}/images/commercial/building/commercial-roof-mobile-${light}-v4.webp 800w, ${base}/images/commercial/building/commercial-roof-mobile-${light}-v4-1280.webp 1280w`
        : `${base}/images/commercial/building/commercial-roof-${light}-1280.webp 1280w, ${base}/images/commercial/building/commercial-roof-${light}.webp 2169w`,
    })),
  ]
  commercialImagePreparation = Promise.all(assets.map(asset => new Promise<void>(resolve => {
    const image = new Image()
    image.onload = () => { void image.decode().catch(() => {}).finally(resolve) }
    image.onerror = () => resolve()
    if (asset.srcset) { image.sizes = sizes; image.srcset = asset.srcset }
    image.src = `${base}${asset.src}`
  })))
  return commercialImagePreparation
}

function prepareResidentialImages() {
  if (typeof Image === 'undefined') return Promise.resolve()
  const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '')
  return Promise.all(['/images/residential/room-hero-v1.webp', '/images/residential/room-hero-mobile-v1.webp'].map(path => new Promise<void>(resolve => {
    const image = new Image()
    image.onload = () => { void image.decode().catch(() => {}).finally(resolve) }
    image.onerror = () => resolve()
    image.src = `${base}${path}`
  })))
}

function prepareResidentialZoom() {
  residentialZoom.value = null
  if (typeof document === 'undefined') return
  const frame = document.querySelector<HTMLElement>('.building-frame')
  const canvas = frame?.querySelector<HTMLElement>('.building-canvas')
  if (frame && canvas) residentialZoom.value = planResidentialZoom(frame, canvas)
}

function playReturn() {
  const frame = document.querySelector<HTMLElement>('.building-frame')
  const canvas = frame?.querySelector<HTMLElement>('.building-canvas')
  if (frame && canvas && transition.value) transition.value.playReturn(planResidentialZoom(frame, canvas, 1500))
  else void endReturn()
}

async function endReturn() {
  returningHome.value = false
  showTransition.value = false
  await nextTick()
  if (!disposed) document.getElementById('hero-title')?.focus({ preventScroll: true })
}

function onTransitionComplete(animateArrival: boolean) {
  if (returningHome.value) void endReturn()
  else void openFloor(animateArrival)
}

async function showChoices() {
  void prepareCommercialImages()
  choosingFloor.value = true
  navigationError.value = ''
  await nextTick()
  residentialChoice.value?.focus({ preventScroll: true })
}

async function closeChoices() {
  if (openingFloor.value) return
  choosingFloor.value = false
  await nextTick()
  exploreTrigger.value?.focus({ preventScroll: true })
}

function chooseFloor(floor: BuildingFloor, event: MouseEvent) {
  if (!isPlainNavigation(event)) return
  event.preventDefault()
  void enterFloor(floor)
}

async function enterFloor(floor: BuildingFloor) {
  if (openingFloor.value || returningHome.value || disposed) return
  const attempt = ++entryAttempt
  openingFloor.value = floor
  navigationError.value = ''
  if (reducedMotion?.matches) {
    await openFloor(false)
    return
  }

  // Give the selected plate time to decode, with a bounded fallback on slow networks.
  const preparation = building.value?.prepareFloor(floor).catch(() => {})
  await Promise.race([
    Promise.all([preparation, floor === 'commercial' ? prepareCommercialImages() : prepareResidentialImages()]),
    new Promise<void>(resolve => {
      finishAssetWait = resolve
      assetTimer = setTimeout(resolve, 1200)
    }),
  ])
  if (disposed || attempt !== entryAttempt) return
  clearTimeout(assetTimer)
  finishAssetWait = undefined
  await nextTick()
  if (disposed || attempt !== entryAttempt) return
  // Both routes hand off when the shared matched-image fade completes. The
  // residential push-in starts while its window is still lighting up.
  lightingTimer = setTimeout(() => {
    if (disposed || attempt !== entryAttempt) return
    if (floor === 'residential') prepareResidentialZoom()
    showTransition.value = true
  }, floor === 'commercial' ? 150 : 300)
}

async function openFloor(animateArrival = true) {
  const floor = openingFloor.value
  if (!floor || navigating || disposed) return
  navigating = true
  entryAttempt++
  clearEntryTimers()
  serviceArrival.value = animateArrival ? floor : null
  try {
    const failure = await router.push(`/${floor}`)
    if (failure) throw failure
  } catch {
    if (disposed) return
    serviceArrival.value = null
    showTransition.value = false
    openingFloor.value = null
    navigationError.value = `${floor === 'residential' ? 'Residential' : 'Commercial'} could not open. Please try again.`
    await restoreEntryFocus(floor)
  } finally {
    navigating = false
  }
}

async function cancelEntry() {
  if (navigating) return
  const floor = openingFloor.value
  entryAttempt++
  clearEntryTimers()
  showTransition.value = false
  serviceArrival.value = null
  openingFloor.value = null
  if (floor) await restoreEntryFocus(floor)
}

async function restoreEntryFocus(floor: BuildingFloor) {
  await nextTick()
  if (disposed) return
  if (choosingFloor.value) {
    const choice = floor === 'residential' ? residentialChoice.value : commercialChoice.value
    choice?.focus({ preventScroll: true })
  } else {
    building.value?.explore(floor)
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && openingFloor.value && !showTransition.value && !navigating) {
    event.preventDefault()
    event.stopImmediatePropagation()
    void cancelEntry()
  }
}

function onMotionChange(event: MediaQueryListEvent) {
  if (event.matches && openingFloor.value && !showTransition.value) void openFloor(false)
}
</script>

<template>
  <main class="hero" :class="{ 'hero--entering': showTransition, 'hero--entering-commercial': showTransition && openingFloor === 'commercial', 'hero--entering-residential': showTransition && (openingFloor === 'residential' || returningHome) }" :inert="showTransition" :aria-busy="Boolean(openingFloor)" aria-labelledby="hero-title">
    <HeroAtmosphere />
    <a class="skip-link" href="#hero-title">Skip to content</a>
    <header class="site-header">
      <a class="brand" :href="$sitePath('/')" aria-label="Setia Air-Cond and Electrical home">
        <SetiaWordmark class="brand__name" />
      </a>
      <nav class="site-nav" aria-label="Main navigation">
        <NuxtLink class="site-nav__quote" to="/get-a-quote">Get a quote<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
      </nav>
    </header>

    <div class="hero__copy">
      <p class="eyebrow">SINCE 1990</p>
      <h1 id="hero-title" tabindex="-1"><span>Every building has a pulse.</span> <span>We keep it cool.</span></h1>
      <p class="hero__description">Air-conditioning and electrical systems for commercial and residential spaces across Kuala Lumpur and Selangor supplied, installed and maintained since 1990.</p>
      <div class="hero__actions">
        <div class="hero-explore" :class="{ 'is-choosing': choosingFloor }" @keydown.esc.stop.prevent="closeChoices">
          <button ref="exploreTrigger" class="button hero-explore__trigger" type="button" :inert="choosingFloor" :aria-hidden="choosingFloor || undefined" aria-controls="hero-service-choices" :aria-expanded="choosingFloor" @click="showChoices">
            Explore<span class="icon icon--arrow" aria-hidden="true" />
          </button>
          <NuxtLink class="hero-explore__about" to="/about-us" :inert="choosingFloor" :aria-hidden="choosingFloor || undefined">About us</NuxtLink>
          <button class="hero-explore__back" type="button" aria-label="Back to Explore" :inert="!choosingFloor" :aria-hidden="!choosingFloor || undefined" :disabled="Boolean(openingFloor)" @click="closeChoices">
            <span class="icon icon--arrow icon--back" aria-hidden="true" />
          </button>
          <div id="hero-service-choices" class="hero-explore__choices" role="group" aria-label="Choose residential or commercial services" :inert="!choosingFloor" :aria-hidden="!choosingFloor || undefined">
            <a ref="residentialChoice" :href="$sitePath('/residential')" class="hero-explore__choice hero-explore__choice--residential" :class="{ 'is-selected': openingFloor === 'residential' }" :aria-disabled="Boolean(openingFloor) || undefined" @click="chooseFloor('residential', $event)">Residential</a>
            <a ref="commercialChoice" :href="$sitePath('/commercial')" class="hero-explore__choice hero-explore__choice--commercial" :class="{ 'is-selected': openingFloor === 'commercial' }" :aria-disabled="Boolean(openingFloor) || undefined" @click="chooseFloor('commercial', $event)">Commercial</a>
          </div>
        </div>
      </div>
      <p class="sr-only" role="status">{{ openingFloor ? `Opening ${destinationName}.` : '' }}</p>
      <p v-if="navigationError" class="navigation-error" role="alert">{{ navigationError }}</p>
    </div>

    <InteractiveBuilding ref="building" :entering-floor="openingFloor ?? (returningHome ? 'residential' : null)" @enter="enterFloor" />
    <ResidentialTransition v-if="showTransition" ref="transition" :returning="returningHome" :destination="destinationName" :duration="openingFloor === 'commercial' ? 600 : 1050" :zoom="openingFloor === 'residential' ? residentialZoom : null" @complete="onTransitionComplete" @cancel="cancelEntry">
      <template v-if="openingFloor === 'commercial'" #default>
        <CommercialBuildingScene phase="intro" entry-preview inert />
      </template>
    </ResidentialTransition>
  </main>
</template>
