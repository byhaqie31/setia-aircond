<script setup lang="ts">
import { isPlainNavigation, type BuildingFloor, type ServiceArrival } from '~/utils/navigation'
import type { BuildingZoomPlan } from '~/utils/building-zoom'
import { planCommercialZoom } from '~/utils/commercial-zoom'
import { planResidentialZoom } from '~/utils/residential-zoom'
import corporate from '~/data/corporate.json'
import { commercialCredentialLogos } from '~/data/commercial-logos'
import { certificateDetailParts } from '~/utils/certificate-detail'

const building = useTemplateRef('building')
const hero = useTemplateRef<HTMLElement>('hero')
const exploreTrigger = useTemplateRef<HTMLButtonElement>('exploreTrigger')
const residentialChoice = useTemplateRef<HTMLAnchorElement>('residentialChoice')
const commercialChoice = useTemplateRef<HTMLAnchorElement>('commercialChoice')
const transition = useTemplateRef('transition')
const choosingFloor = ref(false)
const serviceReturn = useState<BuildingFloor | null>('service-return', () => null)
// Back from a floor: open inside its scene, then pull the camera out to the building.
const returningFrom = ref<BuildingFloor | null>(import.meta.client && serviceReturn.value
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? serviceReturn.value : null)
serviceReturn.value = null
const showTransition = ref(Boolean(returningFrom.value))
const openingFloor = ref<BuildingFloor | null>(null)
const cameraFloor = computed(() => openingFloor.value ?? returningFrom.value)
// Holds a DOM element, so keep it out of Vue's deep reactivity.
const zoomPlan = shallowRef<BuildingZoomPlan | null>(null)
const serviceArrival = useState<ServiceArrival | null>('service-arrival', () => null)
const navigationError = ref('')
const destinationName = computed(() => cameraFloor.value === 'commercial' ? 'Commercial' : 'Residential')
const router = useRouter()
const { $scrollTo } = useNuxtApp()
// The four registrations that persuade on the home page; About us lists them all.
const homeCredentials = ['G7', 'ST', 'ISO', 'DAIKIN'].flatMap(code => corporate.certifications.filter(certificate => certificate.code === code))
let heroSize: ResizeObserver | undefined
let settling = false
let lightingTimer: ReturnType<typeof setTimeout> | undefined
let assetTimer: ReturnType<typeof setTimeout> | undefined
let finishAssetWait: (() => void) | undefined
let entryAttempt = 0
let navigating = false
let disposed = false
let reducedMotion: MediaQueryList | undefined
let commercialImagePreparation: Promise<unknown> | undefined
let residentialImagePreparation: Promise<unknown> | undefined
let nudgeTimer: ReturnType<typeof setTimeout> | undefined
const pageCovered = useState('page-covered', () => false)
// Set by About's service cards: point at that floor once the home page is on screen.
const buildingNudge = useState<BuildingFloor | null>('building-nudge', () => null)

useHead({
  htmlAttrs: { 'data-theme': 'dark' },
  title: 'Daikin Air Conditioners Malaysia Supplier | Setia Air-Cond',
  meta: [{
    name: 'description',
    content: 'Setia Air-Cond and Electrical is a trusted Daikin air cond Malaysia supplier and distributor, supplying, installing and servicing air-conditioning across Kuala Lumpur and Selangor since 1990.',
  }],
})

onMounted(() => {
  void preloadRouteComponents('/residential', router).catch(() => {})
  void preloadRouteComponents('/commercial', router).catch(() => {})
  void prepareCommercialImages()
  // Warm the room photo so a click starts the camera instead of waiting on a download.
  void prepareResidentialImages()
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.addEventListener('change', onMotionChange)
  window.addEventListener('keydown', onKeydown, true)
  // The pinned hero may outgrow short screens: let it scroll until its bottom lands before it holds.
  if (hero.value && 'ResizeObserver' in window) {
    heroSize = new ResizeObserver(entries => {
      const height = entries[0]?.borderBoxSize?.[0]?.blockSize ?? hero.value?.offsetHeight
      if (height) hero.value?.style.setProperty('--hero-height', `${Math.round(height)}px`)
    })
    heroSize.observe(hero.value)
  }
  if (returningFrom.value) void playReturn()
  const nudgeFloor = buildingNudge.value
  buildingNudge.value = null
  if (nudgeFloor && !returningFrom.value) {
    // Wait for the page cover to lift and hand focus to the page, then point.
    const point = () => { nudgeTimer = setTimeout(() => building.value?.nudge(nudgeFloor), 300) }
    if (!pageCovered.value) point()
    else {
      const stop = watch(pageCovered, (covered) => {
        if (covered) return
        stop()
        point()
      })
    }
  }
})

onBeforeUnmount(() => {
  disposed = true
  entryAttempt++
  clearEntryTimers()
  clearTimeout(nudgeTimer)
  reducedMotion?.removeEventListener('change', onMotionChange)
  window.removeEventListener('keydown', onKeydown, true)
  heroSize?.disconnect()
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
  if (residentialImagePreparation) return residentialImagePreparation
  residentialImagePreparation = Promise.all(['/images/residential/room-hero-v1.webp', '/images/residential/room-hero-mobile-v1.webp'].map(path => new Promise<void>(resolve => {
    const image = new Image()
    image.onload = () => { void image.decode().catch(() => {}).finally(resolve) }
    image.onerror = () => resolve()
    image.src = `${base}${path}`
  })))
  return residentialImagePreparation
}

/** Measure the building at rest; the overlay plays the plan forwards on entry and backwards on return. */
function planZoom(floor: BuildingFloor, duration?: number, returning = false) {
  if (typeof document === 'undefined') return null
  const frame = document.querySelector<HTMLElement>('.building-frame')
  const canvas = frame?.querySelector<HTMLElement>('.building-canvas')
  if (!frame || !canvas) return null
  return floor === 'commercial' ? planCommercialZoom(frame, canvas, duration) : planResidentialZoom(frame, canvas, duration, returning)
}

async function playReturn() {
  const floor = returningFrom.value
  if (!floor) return
  // The scene covers the first frame; let the lit plates decode before the camera pulls out to them.
  await Promise.race([
    building.value ? building.value.prepareFloor(floor).catch(() => {}) : Promise.resolve(),
    new Promise<void>(resolve => setTimeout(resolve, 250)),
  ])
  if (disposed || returningFrom.value !== floor) return
  const plan = planZoom(floor, floor === 'commercial' ? 1400 : 1000, true)
  if (plan && transition.value) transition.value.playReturn(plan)
  else void endReturn()
}

async function endReturn() {
  returningFrom.value = null
  showTransition.value = false
  await nextTick()
  if (!disposed) document.getElementById('hero-title')?.focus({ preventScroll: true })
}

function onTransitionComplete(animateArrival: boolean) {
  if (returningFrom.value) void endReturn()
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
  if (openingFloor.value || returningFrom.value || disposed) return
  const attempt = ++entryAttempt
  openingFloor.value = floor
  navigationError.value = ''
  if (reducedMotion?.matches) {
    await openFloor(false)
    return
  }

  // Give the selected plate time to decode, with a bounded fallback on slow networks.
  // Meanwhile the page settles back to the top so the story chapter is clear of the camera.
  const preparation = building.value?.prepareFloor(floor).catch(() => {})
  await Promise.all([settleScroll(), Promise.race([
    Promise.all([preparation, floor === 'commercial' ? prepareCommercialImages() : prepareResidentialImages()]),
    new Promise<void>(resolve => {
      finishAssetWait = resolve
      assetTimer = setTimeout(resolve, 1200)
    }),
  ])])
  if (disposed || attempt !== entryAttempt) return
  clearTimeout(assetTimer)
  finishAssetWait = undefined
  await nextTick()
  if (disposed || attempt !== entryAttempt) return
  // Both cameras start while the chosen floor is still lighting up, and the
  // overlay hands off once its scene covers the building.
  lightingTimer = setTimeout(() => {
    if (disposed || attempt !== entryAttempt) return
    zoomPlan.value = planZoom(floor)
    showTransition.value = true
  }, 60)
}

/** Scrolled into the story chapter, a floor opens with the hero at rest so the camera moves over the whole scene. */
function settleScroll(duration = .5) {
  // A hero taller than the viewport rests with its bottom landed, not at the page top.
  const landed = Math.max(0, (hero.value?.offsetHeight ?? 0) - window.innerHeight)
  if (window.scrollY <= landed + 1 || !$scrollTo) return Promise.resolve()
  settling = true
  return new Promise<void>(resolve => {
    let deadline: ReturnType<typeof setTimeout> | undefined
    const done = () => { clearTimeout(deadline); settling = false; resolve() }
    deadline = setTimeout(done, duration * 1000 + 200)
    $scrollTo(landed, { duration, onComplete: done })
  })
}

/** The story buttons and explore cards carry the visitor back up to the building and point at the matching floor. */
async function pointToFloor(floor: BuildingFloor, event: MouseEvent) {
  if (!isPlainNavigation(event)) return
  event.preventDefault()
  if (openingFloor.value || returningFrom.value || disposed) return
  navigationError.value = ''
  // The longer trip up from the explore cards gets a little more time than the one from the story chapter.
  await settleScroll(Math.min(1.2, .5 + window.scrollY / 4000))
  if (!disposed && !openingFloor.value) building.value?.nudge(floor)
}

async function openFloor(animateArrival = true) {
  const floor = openingFloor.value
  if (!floor || navigating || disposed) return
  navigating = true
  entryAttempt++
  clearEntryTimers()
  // A covered swap lets the floor continue from the frame the overlay shows.
  serviceArrival.value = showTransition.value ? { floor, animate: animateArrival } : null
  try {
    const failure = await router.push(`/${floor}`)
    if (failure) throw failure
  } catch {
    if (disposed) return
    serviceArrival.value = null
    showTransition.value = false
    zoomPlan.value = null
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
  // Escape mid-settle leaves the page where it is instead of carrying it to the top.
  if (settling && $scrollTo) {
    settling = false
    $scrollTo(window.scrollY, { immediate: true })
  }
  showTransition.value = false
  zoomPlan.value = null
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
  <main class="home" :inert="showTransition" :aria-busy="Boolean(openingFloor)">
    <a class="skip-link" href="#hero-title">Skip to content</a>
    <section ref="hero" class="hero" :class="{ 'hero--opening': Boolean(openingFloor), 'hero--entering': showTransition, 'hero--entering-commercial': showTransition && cameraFloor === 'commercial', 'hero--entering-residential': showTransition && cameraFloor === 'residential' }" aria-labelledby="hero-title">
      <HeroAtmosphere />
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

      <InteractiveBuilding ref="building" :entering-floor="cameraFloor" @enter="enterFloor" />
      <div class="hero-cue" aria-hidden="true">
        <span class="hero-cue__label">Scroll</span>
        <span class="hero-cue__track" />
      </div>
      <ResidentialTransition v-if="showTransition" ref="transition" :returning="Boolean(returningFrom)" :destination="destinationName" :duration="cameraFloor === 'commercial' ? 600 : 1050" :zoom="zoomPlan" @complete="onTransitionComplete" @cancel="cancelEntry">
        <template v-if="cameraFloor === 'commercial'" #default>
          <CommercialBuildingScene phase="intro" :preview="returningFrom ? 'return' : 'entry'" inert />
        </template>
      </ResidentialTransition>
    </section>

    <section class="home-story" aria-labelledby="home-story-title">
      <div class="home-story__inner">
        <div class="home-story__copy">
          <h2 id="home-story-title">Committed <span class="home-story__year">since 1990.</span></h2>
          <p>Wholly Malaysian-owned, Setia designs, installs and maintains air-conditioning and electrical systems for public and private clients across Malaysia.</p>
          <p>From homes to factories, production plants and high-rise buildings, each system is matched to the space, budget and programme by a team with over 100 man-years of combined technical experience.</p>
          <div class="home-story__actions">
            <div class="home-story__floors" role="group" aria-label="Explore residential or commercial services">
              <a :href="$sitePath('/residential')" class="home-story__floor home-story__floor--residential" @click="pointToFloor('residential', $event)">Residential</a>
              <a :href="$sitePath('/commercial')" class="home-story__floor home-story__floor--commercial" @click="pointToFloor('commercial', $event)">Commercial</a>
            </div>
            <NuxtLink class="home-story__link" to="/about-us">Read our story<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
          </div>
        </div>
        <div class="home-story__proof">
          <h3 id="home-credentials-title">What backs the work.</h3>
          <ul class="home-credentials" aria-labelledby="home-credentials-title">
            <li v-for="certificate in homeCredentials" :key="certificate.code" class="home-credential">
              <div class="home-credential__mark" :aria-hidden="commercialCredentialLogos[certificate.code] ? 'true' : undefined">
                <CommercialLogo v-if="commercialCredentialLogos[certificate.code]" :logo="commercialCredentialLogos[certificate.code]!" :name="certificate.title" :lazy="true" />
                <span v-else class="home-credential__standard">{{ certificate.title }}</span>
              </div>
              <div class="home-credential__text">
                <!-- A standard with no logo already names itself in the mark, so its line carries the issuer instead. -->
                <p class="home-credential__title">{{ commercialCredentialLogos[certificate.code] ? certificate.title : certificate.issuer }}</p>
                <p class="home-credential__detail"><template v-for="(part, partIndex) in certificateDetailParts(certificate.detail, certificate.highlight)" :key="partIndex"><mark v-if="part.highlight" class="home-credential__highlight">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="home-coverage" aria-labelledby="home-coverage-title">
      <header class="home-coverage__heading">
        <h2 id="home-coverage-title">Every state within reach.</h2>
        <p>From Perlis to Johor, and across the South China Sea to Sabah, Sarawak and Labuan.</p>
      </header>
      <CommercialCoverageMap class="home-coverage__map" shuffle />
    </section>

    <section class="home-explore" aria-labelledby="home-explore-title">
      <header class="home-explore__heading">
        <h2 id="home-explore-title">Explore our services.</h2>
        <p>Choose a floor, and we’ll take you to it on the building.</p>
      </header>
      <ul class="home-explore__cards">
        <li>
          <a :href="$sitePath('/residential')" class="home-explore__card" aria-label="Explore residential" @click="pointToFloor('residential', $event)">
            <span class="home-explore__snapshot home-explore__snapshot--residential" aria-hidden="true">
              <img :src="$sitePath('/images/residential/room-hero-v1.webp')" width="1672" height="940" alt="" loading="lazy" decoding="async">
              <span class="home-explore__page">
                <SetiaWordmark class="home-explore__brand" />
                <span class="home-explore__page-title">Your Home Is<br>Our Responsibility</span>
              </span>
            </span>
            <span class="home-explore__caption">
              <span class="home-explore__name">Residential</span>
              <span class="home-explore__cta">Explore<span class="icon icon--arrow" aria-hidden="true" /></span>
            </span>
          </a>
        </li>
        <li>
          <a :href="$sitePath('/commercial')" class="home-explore__card" aria-label="Explore commercial" @click="pointToFloor('commercial', $event)">
            <span class="home-explore__snapshot home-explore__snapshot--commercial" aria-hidden="true">
              <img :src="$sitePath('/images/commercial/building/commercial-roof-lit-1280.webp')" width="1280" height="428" alt="" loading="lazy" decoding="async">
              <span class="home-explore__page">
                <SetiaWordmark class="home-explore__brand" />
                <span class="home-explore__page-eyebrow">Commercial</span>
                <span class="home-explore__page-title">Commercial air-conditioning services</span>
              </span>
            </span>
            <span class="home-explore__caption">
              <span class="home-explore__name">Commercial</span>
              <span class="home-explore__cta">Explore<span class="icon icon--arrow" aria-hidden="true" /></span>
            </span>
          </a>
        </li>
      </ul>
    </section>

    <div class="home-close">
      <CompanyEnquirySection heading-id="home-enquiry-title" />
      <CompanyFooter />
    </div>
  </main>
</template>

<style scoped>
/* The hero holds at the top while the story chapter slides up over it. A hero taller than the
   viewport (short or zoomed phones) scrolls until its bottom lands, then holds; the page measures --hero-height,
   and until it has, the 200svh fallback keeps the hero in normal flow. */
.hero { position: sticky; top: min(0px, calc(100svh - var(--hero-height, 200svh))); }
/* Night falls over the scene as the chapter covers it. */
.hero::after { content: ''; position: absolute; inset: 0; z-index: 5; background: var(--stage); opacity: 0; pointer-events: none; }
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    .hero::after { animation: hero-dusk linear both; animation-timeline: scroll(root); animation-range: calc(var(--hero-height, 200svh) - 100svh) calc(var(--hero-height, 200svh) - 10svh); }
  }
}
@keyframes hero-dusk { from { opacity: 0; } to { opacity: .62; } }

/* The same travelling-dot cue as the service stories, sitting at the bottom of the first viewport even when the
   hero is taller than it, so the rising chapter covers it first. Phones scroll on their own and lose it. */
.hero-cue { position: absolute; z-index: 2; left: 50%; top: calc(100svh - 48px - max(20px, env(safe-area-inset-bottom))); display: flex; flex-direction: column; align-items: center; gap: 6px; color: #bed0c3; text-shadow: 0 1px 8px #061710; pointer-events: none; transform: translateX(-50%); transition: opacity .25s ease; }
.hero--opening .hero-cue, .hero--entering .hero-cue { opacity: 0; }
.hero-cue__label { font-size: 11px; line-height: 1.4; white-space: nowrap; }
.hero-cue__track { position: relative; width: 1px; height: 26px; }
.hero-cue__track::before { content: ''; position: absolute; inset: 0; background: currentColor; opacity: .3; }
.hero-cue__track::after { content: ''; position: absolute; top: 0; left: -1px; width: 3px; height: 3px; border-radius: 50%; background: currentColor; box-shadow: 0 0 4px currentColor; animation: hero-cue-travel 2.6s linear infinite; }
@keyframes hero-cue-travel {
  0% { opacity: 0; transform: translateY(0); }
  12% { opacity: .9; }
  32% { opacity: .45; }
  52% { opacity: 1; }
  72% { opacity: .55; }
  88% { opacity: .85; }
  96%, 100% { opacity: 0; transform: translateY(23px); }
}

/* Story chapter: the About page's mint band, rising over the night scene. */
.home-story { --story-muted: #365b46; --story-line: #365b4640; position: relative; z-index: 2; color: #0b3022; background: #d1e4d7; box-shadow: 0 -18px 48px -16px #061710a6; }
.home-story ::selection { background: #16513a; color: #fff; }
.home-story :focus-visible { outline-color: #0b3022; }
.home-story__inner { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(40px, 7vw, 112px); align-items: start; width: min(100% - var(--page-gutter) * 2, 1240px); margin-inline: auto; padding-block: clamp(72px, 9vw, 136px); }
.home-story__inner > * { min-width: 0; }
.home-story h2 { margin: 0 0 28px; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(40px, 4.6vw, 68px); font-weight: 400; line-height: 1.04; letter-spacing: -.035em; text-wrap: balance; }
.home-story__year { color: #16513a; }
.home-story__copy p { max-width: 54ch; margin: 0; color: var(--story-muted); font-size: clamp(17px, 1.3vw, 19px); line-height: 1.7; }
.home-story__copy p + p { margin-top: 20px; }
.home-story__link { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; font-weight: 600; text-decoration: underline; text-decoration-color: #0b302266; text-underline-offset: 5px; }
.home-story__link .icon { width: 18px; height: 18px; transition: transform .2s ease; }
.home-story__link:hover { text-decoration-color: currentColor; }
.home-story__link:hover .icon { transform: translateX(4px); }
/* The hero's floor pair, repeated at the end of the chapter; a click carries the visitor back up to it. */
.home-story__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 28px; margin-top: 32px; }
.home-story__floors { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; width: min(100%, 300px); }
.home-story__floor { display: inline-flex; align-items: center; justify-content: center; min-width: 0; min-height: 56px; padding: 10px 12px; border: 1px solid #0b302233; border-radius: 100px; color: var(--floor-ink); background: var(--floor-color); font-size: 15px; font-weight: 700; line-height: 1.25; overflow-wrap: anywhere; transition: background .2s ease; }
.home-story__floor--residential { --floor-color: var(--paper); --floor-hover: #fff; --floor-ink: var(--pine-900); }
.home-story__floor--commercial { --floor-color: var(--pine); --floor-hover: var(--pine-700); --floor-ink: var(--paper); border-color: transparent; }
.home-story__floor:hover { background: var(--floor-hover); }
.home-story__floor:focus-visible { outline: 2px solid var(--floor-ink); outline-offset: -5px; }
/* The proof column starts a touch below the heading's cap line so the two columns read as one line of thought. */
.home-story__proof { padding-top: clamp(12px, 1.6vw, 24px); }
.home-story h3 { margin: 0 0 14px; font-size: 22px; font-weight: 600; line-height: 1.3; letter-spacing: -.01em; }
.home-credentials { margin: 0; padding: 0; list-style: none; }
.home-credential { display: grid; grid-template-columns: 148px minmax(0, 1fr); gap: 24px; align-items: center; padding-block: 20px; border-top: 1px solid var(--story-line); }
.home-credential:last-child { border-bottom: 1px solid var(--story-line); }
.home-credential__mark { --logo-height: 40px; --logo-width: 140px; display: flex; align-items: center; min-height: 40px; }
.home-credential__mark :deep(.commercial-logo__image) { justify-content: flex-start; }
.home-credential__standard { font-size: 20px; font-weight: 600; letter-spacing: -.02em; line-height: 1.1; }
.home-credential__title { margin: 0; font-size: 16px; font-weight: 600; line-height: 1.3; }
.home-credential__detail { margin: 4px 0 0; color: var(--story-muted); font-size: 15px; line-height: 1.55; white-space: pre-line; text-wrap: pretty; }
.home-credential__highlight { padding: 0 2px; color: #0b3022; font-weight: 700; background: linear-gradient(transparent 58%, color-mix(in srgb, var(--green-bright) 38%, transparent) 58%); }

/* The commercial page's coverage map, on the night stage its artwork is drawn for. */
.home-coverage { position: relative; z-index: 2; padding: clamp(72px, 9vw, 136px) var(--page-gutter) clamp(24px, 4vw, 64px); color: var(--paper); background: var(--service-stage); }
.home-coverage__heading { text-align: center; }
.home-coverage h2 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(40px, 4.6vw, 68px); font-weight: 400; line-height: 1.04; letter-spacing: -.035em; text-wrap: balance; }
.home-coverage__heading p { max-width: 42ch; margin: 20px auto 0; color: #bed0c3; font-size: clamp(15px, 1.2vw, 17px); line-height: 1.6; text-wrap: balance; }
.home-coverage__map { margin-top: clamp(36px, 5vw, 64px); }
@media (min-width: 761px) {
  .home-coverage__heading p { max-width: none; white-space: nowrap; }
}

/* Explore: each floor's page in miniature, composed like its opening screen. Type inside a snapshot is sized in
   container units so it scales with the card like a shrunken page. A click carries the visitor up to the building.
   The band takes About's brand green so it reads apart from the dark map and enquiry either side. */
.home-explore { position: relative; z-index: 2; padding: clamp(56px, 7vw, 104px) var(--page-gutter); color: var(--paper); background: #16513a; }
.home-explore ::selection { background: #d1e4d7; color: #0b3022; }
.home-explore__heading { text-align: center; }
.home-explore h2 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(36px, 4vw, 60px); font-weight: 400; line-height: 1.04; letter-spacing: -.035em; text-wrap: balance; }
.home-explore__heading p { max-width: 46ch; margin: 16px auto 0; color: #d1e4d7; font-size: clamp(15px, 1.2vw, 17px); line-height: 1.6; text-wrap: balance; }
.home-explore__cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(20px, 3vw, 40px); width: min(100%, 1240px); margin: clamp(32px, 4vw, 56px) auto 0; padding: 0; list-style: none; }
.home-explore__card { display: grid; gap: 18px; color: inherit; border-radius: 8px; }
.home-explore__card:focus-visible { outline: 2px solid #d1e4d7; outline-offset: 6px; }
.home-explore__snapshot { position: relative; display: block; aspect-ratio: 16 / 10; overflow: hidden; container-type: inline-size; border: 1px solid #d1e4d733; border-radius: 6px; background: #061710; box-shadow: 0 28px 48px -26px #061710e6; }
.home-explore__snapshot img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.16, 1, .3, 1); }
.home-explore__card:hover .home-explore__snapshot img { transform: scale(1.03); }
.home-explore__page { position: absolute; z-index: 1; inset: 0; display: flex; flex-direction: column; padding: 3.4cqw 4.4cqw; color: #f5f5ed; }
.home-explore__brand { align-self: flex-start; font-size: 3.4cqw; }
.home-explore__page-title { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; letter-spacing: -.035em; }
/* Residential: the room photo under the page's own shade, headline low on the left. */
.home-explore__snapshot--residential::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #07180fc4 0%, #07180f10 49%, transparent 100%), linear-gradient(0deg, #061b12d6 0%, #061b1240 26%, transparent 58%), linear-gradient(180deg, #051b1399 0%, transparent 22%); }
.home-explore__snapshot--residential .home-explore__page-title { margin: auto 0 7cqw; font-size: 6.6cqw; line-height: .98; white-space: nowrap; }
/* Commercial: the night sky with the lit building along the bottom, heading centred above it. */
.home-explore__snapshot--commercial { background: radial-gradient(ellipse 75% 36% at 50% 82%, #14503a8c, transparent 78%), linear-gradient(180deg, #061710 0%, #09241a 40%, #0b3022 75%, #0d3524 100%); }
.home-explore__snapshot--commercial img { inset: auto 0 4% 0; height: auto; mask-image: linear-gradient(transparent, #000 30%); }
.home-explore__page-eyebrow { align-self: center; margin-top: 7cqw; color: #a7d2b5; font-size: 1.5cqw; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
.home-explore__snapshot--commercial .home-explore__page-title { align-self: center; margin-top: 1.2cqw; font-size: 3.6cqw; line-height: 1.12; white-space: nowrap; }
.home-explore__caption { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.home-explore__name { font-size: clamp(20px, 1.8vw, 26px); font-weight: 600; letter-spacing: -.01em; }
.home-explore__cta { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; color: #d1e4d7; font-size: 15px; font-weight: 600; transition: color .2s ease; }
.home-explore__cta .icon { width: 18px; height: 18px; transition: transform .2s ease; }
.home-explore__card:hover .home-explore__cta { color: var(--paper); }
.home-explore__card:hover .home-explore__cta .icon { transform: translateX(4px); }
@media (max-width: 760px) {
  .home-explore__cards { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .home-explore__snapshot img, .home-explore__cta .icon { transition: none; }
}

/* Enquiry and footer close the page on the service stage, as About does. */
.home-close { position: relative; z-index: 2; padding-top: clamp(48px, 7vw, 96px); background: var(--service-stage); }

@media (max-width: 850px) {
  .home-story__inner { grid-template-columns: minmax(0, 1fr); gap: 48px; width: min(100% - var(--page-gutter) * 2, 680px); padding-block: clamp(64px, 12vw, 96px); }
  .home-story__proof { padding-top: 0; }
  .home-story__floor { min-height: 48px; }
  .home-credential { grid-template-columns: 112px minmax(0, 1fr); gap: 16px; }
  .home-credential__mark { --logo-width: 104px; }
}
@media (max-width: 680px) {
  .hero-cue { display: none; }
}
@media (max-width: 380px) {
  .home-credential { grid-template-columns: minmax(0, 1fr); gap: 10px; padding-block: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-cue { transition: none; }
  .hero-cue__track::after { animation: none; opacity: .65; transform: translateY(11px); }
}
</style>
