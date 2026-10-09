<script setup lang="ts">
import { commercialClientCategories, commercialClients } from '~/data/commercial-view'
import type { ScenePhase } from '~/utils/commercial-view-layout'
import type { ArrivalMode } from '~/utils/navigation'

type Scene = 'services' | 'clients'
const props = defineProps<{ arrival?: ArrivalMode | null }>()
const route = useRoute()
const router = useRouter()
const supportHashes = ['#certifications', '#capability', '#commercial-brands', '#tender', '#commercial-contacts', '#brands']
const sceneFromRoute = (): Scene => route.query.scene === 'clients' || supportHashes.includes(route.hash) || (!route.query.scene && route.hash === '#commercial-clients') ? 'clients' : 'services'
const scene = ref<Scene>(sceneFromRoute())
const phase = ref<ScenePhase>(scene.value === 'clients' && route.query.scene === 'clients' ? 'ready' : 'intro')
const selectedClientSlug = ref<string | null>(typeof route.query.client === 'string' ? route.query.client : null)
const selectedClientPage = ref<number>(Math.max(1, Number(route.query.page) || 1))
const categoryFromRoute = () => typeof route.query.category === 'string' && commercialClientCategories.some(category => category.id === route.query.category) ? route.query.category : null
const selectedClientCategory = ref<string | null>(categoryFromRoute())
const selectedServiceSlug = ref<string | null>(typeof route.query.service === 'string' ? route.query.service : null)
const enhanced = ref(false)
const reducedMotion = ref(false)
const headerReady = ref(phase.value !== 'intro')
const sceneMoving = ref(false)
const goingBack = ref(false)
const skylineArrived = ref(false)
const buildingArrived = ref(false)
let motionQuery: MediaQueryList | undefined
let headerTimer: ReturnType<typeof setTimeout> | undefined
let scrollReleaseUntil = 0
let touchStart: { x: number; y: number; panning: boolean; atTop: boolean } | null = null
let touchConsumed = false
let consumedScrollKey: string | null = null
/** Scroll input moves the scenes. This much wheel travel or finger travel is a deliberate gesture rather than a nudge. */
const WHEEL_INTENT = 40
const TOUCH_INTENT = 48
let wheelGesture: { sum: number; atTop: boolean } | null = null
let lastWheelAt = 0

const scrollLocked = computed(() => enhanced.value && (scene.value === 'services' || sceneMoving.value || phase.value !== 'ready'))

function ignoresScroll(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('.floating-contact, .client-scene__summary, input, textarea, select, [contenteditable="true"]'))
}

function canScrollList(target: EventTarget | null, direction = 1) {
  // Short phones/landscape pan the complete diagram before advancing its scene.
  const list = target instanceof Element ? target.closest('.commercial-building-scene__service-list, .commercial-building-scene.is-compact') : null
  return list instanceof HTMLElement && (direction > 0
    ? list.scrollHeight - list.clientHeight - list.scrollTop > 2
    : list.scrollTop > 2)
}

function consumeScroll(event: Event) {
  event.preventDefault()
  event.stopPropagation()
}

/** A gesture is one stream of wheel events; a quiet gap starts the next, remembering where the page stood when it began. */
function wheelGestureFor(event: WheelEvent) {
  const now = performance.now()
  if (!wheelGesture || now - lastWheelAt > 350) wheelGesture = { sum: 0, atTop: window.scrollY <= 2 }
  lastWheelAt = now
  wheelGesture.sum += event.deltaY
  return wheelGesture
}

function onWheel(event: WheelEvent) {
  if (event.ctrlKey || ignoresScroll(event.target) || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
  const gesture = wheelGestureFor(event)
  if (!scrollLocked.value) {
    // Briefly absorb transition inertia, then allow continuous scrolling into
    // the support chapters. A stream of wheel events must never extend the lock.
    if (performance.now() < scrollReleaseUntil) consumeScroll(event)
    // At the top of the clients screen a fresh upward gesture climbs back into the building.
    // Inertia left over from scrolling up to the top began lower down, so it never counts.
    else if (scene.value === 'clients' && gesture.atTop && gesture.sum <= -WHEEL_INTENT && window.scrollY <= 2) {
      consumeScroll(event)
      onClientBack()
    }
    return
  }
  // A locked scene absorbs the wheel. Where the compact diagram still has room to pan it pans
  // natively instead, and the next gesture after the pan is the one that moves the scene on.
  if (scene.value === 'services' && phase.value === 'ready' && !sceneMoving.value) {
    if (canScrollList(event.target, event.deltaY)) {
      wheelGesture = null
      return
    }
    if (gesture.sum >= WHEEL_INTENT) onBuildingNext()
  }
  consumeScroll(event)
}

function onTouchStart(event: TouchEvent) {
  const touch = event.touches.length === 1 ? event.touches[0] : undefined
  touchStart = touch && !ignoresScroll(event.target) ? { x: touch.clientX, y: touch.clientY, panning: canScrollList(event.target), atTop: window.scrollY <= 2 } : null
  touchConsumed = false
}

function onTouchMove(event: TouchEvent) {
  const touch = event.touches.length === 1 ? event.touches[0] : undefined
  if (!touch || !touchStart) return
  const down = touchStart.y - touch.clientY
  if (Math.abs(touch.clientX - touchStart.x) >= Math.abs(down)) return
  if (!scrollLocked.value && !touchConsumed) {
    // At the top of the clients screen, pulling down past the slack climbs back into the building.
    if (scene.value === 'clients' && touchStart.atTop && down <= -TOUCH_INTENT) {
      consumeScroll(event)
      touchConsumed = true
      onClientBack()
    }
    return
  }
  // The compact diagram pans natively until it reaches its boundary.
  if (!touchConsumed && scene.value === 'services' && phase.value === 'ready') {
    if (touchStart.panning || (down < 0 && canScrollList(event.target, -1))) return
  }
  consumeScroll(event)
  touchConsumed = true
  // Past the slack, an upward swipe on the settled building moves on to the clients.
  if (scene.value === 'services' && phase.value === 'ready' && !sceneMoving.value && down >= TOUCH_INTENT) onBuildingNext()
}

function onTouchEnd() { touchStart = null; touchConsumed = false }

function onScrollKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey || ignoresScroll(event.target)) return
  if (event.key === ' ' && event.target instanceof Element && event.target.closest('button, [role="button"]')) return
  const down = ['ArrowDown', 'PageDown', 'End', ' '].includes(event.key) && !event.shiftKey
  const up = ['ArrowUp', 'PageUp', 'Home'].includes(event.key) || (event.key === ' ' && event.shiftKey)
  if (!scrollLocked.value) {
    if (event.repeat && consumedScrollKey === event.key) consumeScroll(event)
    // At the top of the clients screen, Arrow Up or Page Up climbs back into the building.
    else if (scene.value === 'clients' && !event.repeat && ['ArrowUp', 'PageUp'].includes(event.key) && window.scrollY <= 2) {
      consumeScroll(event)
      consumedScrollKey = event.key
      onClientBack()
    }
    return
  }
  if (!down && !up) return
  if (scene.value === 'services' && phase.value === 'ready' && canScrollList(event.target, down ? 1 : -1)) return
  consumeScroll(event)
  consumedScrollKey = event.key
  // A downward key on the settled building moves on to the clients.
  if (down && !event.repeat && scene.value === 'services' && phase.value === 'ready' && !sceneMoving.value) onBuildingNext()
}

function onScrollKeyUp(event: KeyboardEvent) {
  if (event.key === consumedScrollKey) consumedScrollKey = null
}

function readMotion() { reducedMotion.value = Boolean(motionQuery?.matches) }
function replaceSceneQuery(target: Scene, client: string | null = null, service: string | null = null) {
  const query = {
    ...route.query,
    scene: target,
    client: target === 'clients' ? client || undefined : undefined,
    category: target === 'clients' && selectedClientCategory.value && selectedClientCategory.value !== commercialClientCategories[0]?.id ? selectedClientCategory.value : undefined,
    page: target === 'clients' && selectedClientPage.value > 1 ? String(selectedClientPage.value) : undefined,
    service: target === 'services' ? service || undefined : undefined,
  }
  // Query state restores the scene without a native hash scroll while it moves.
  void router.replace({ path: '/commercial', query, hash: '' }).catch(() => {})
}

function onSceneReady() {
  phase.value = 'ready'
  headerReady.value = true
  scrollReleaseUntil = performance.now() + 120
}

function onBuildingNext() {
  if (scene.value !== 'services' || phase.value === 'exit') return
  goingBack.value = false
  sceneMoving.value = true
  phase.value = 'exit'
}

function onBuildingExit() {
  if (scene.value !== 'services') return
  buildingArrived.value = false
  scene.value = 'clients'
  skylineArrived.value = true
  selectedClientSlug.value = null
  selectedClientPage.value = 1
  selectedClientCategory.value = null
  phase.value = reducedMotion.value ? 'ready' : 'intro'
  replaceSceneQuery('clients')
  void nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    finishSceneMove(document.getElementById('commercial-clients'))
  })
}

function onClientBack() {
  if (scene.value !== 'clients' || phase.value === 'exit') return
  goingBack.value = true
  sceneMoving.value = true
  phase.value = 'exit'
}

// Back to top on this page means its first section: once the journey lands on the clients screen, the reverse camera carries on into the building.
function returnToBuilding() {
  if (scene.value !== 'clients' || phase.value !== 'ready' || sceneMoving.value) return
  onClientBack()
}

function onClientExit() {
  if (scene.value !== 'clients') return
  buildingArrived.value = true
  scene.value = 'services'
  skylineArrived.value = false
  selectedClientSlug.value = null
  phase.value = reducedMotion.value ? 'ready' : 'intro'
  replaceSceneQuery('services', null, selectedServiceSlug.value)
  void nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    finishSceneMove(document.getElementById('commercial-services'))
  })
}

function onClientSlideChange(page: number, _firstSlug: string, category: string) {
  selectedClientSlug.value = null
  selectedClientPage.value = page
  selectedClientCategory.value = category
  replaceSceneQuery('clients', selectedClientSlug.value)
}

function onServiceSelect(slug: string) { selectedServiceSlug.value = slug }

function finishSceneMove(element: Element | null) {
  sceneMoving.value = false
  if (supportHashes.includes(route.hash)) return
  if (element instanceof HTMLElement) element.focus({ preventScroll: true })
}

async function skipToSupport(event: MouseEvent) {
  if (!enhanced.value || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  scene.value = 'clients'
  phase.value = 'ready'
  headerReady.value = true
  sceneMoving.value = false
  void router.replace({ path: '/commercial', query: { ...route.query, scene: 'clients' }, hash: '#certifications' })
  await nextTick()
  document.getElementById('certifications')?.scrollIntoView({ behavior: 'instant' })
  document.getElementById('certifications')?.focus({ preventScroll: true })
}

watch(() => route.fullPath, () => {
  if (route.path !== '/commercial') return
  const target = sceneFromRoute()
  if (target !== scene.value) {
    buildingArrived.value = target === 'services' && scene.value === 'clients'
    scene.value = target
    phase.value = target === 'services' && !reducedMotion.value ? 'intro' : 'ready'
  }
  selectedClientSlug.value = typeof route.query.client === 'string' ? route.query.client : null
  selectedClientPage.value = Math.max(1, Number(route.query.page) || 1)
  selectedClientCategory.value = categoryFromRoute()
  selectedServiceSlug.value = typeof route.query.service === 'string' ? route.query.service : null
})

onMounted(() => {
  const legacyProjects = [
    'maxis', 'sony-emcs', 'maybank', 'goodyear',
    'mission-foods', 'garden-international-school', 'limkokwing-university', 'viewqwest',
  ]
  const legacyProject = /^#commercial-project-([1-8])$/.exec(route.hash)
  if (legacyProject) {
    const slug = legacyProjects[Number(legacyProject[1]) - 1]
    if (slug) void router.replace(`/commercial/clients/${slug}`)
  } else if (route.hash === '#projects') {
    void router.replace('/commercial/projects')
  } else if (route.hash === '#commercial-contacts') {
    void router.replace({ path: '/commercial', query: route.query, hash: '#tender' })
  } else if (route.hash === '#brands') {
    void router.replace({ path: '/commercial', query: route.query, hash: '#commercial-brands' })
  }
  enhanced.value = true
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  readMotion()
  motionQuery.addEventListener('change', readMotion)
  window.addEventListener('wheel', onWheel, { passive: false, capture: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
  window.addEventListener('touchend', onTouchEnd, true)
  window.addEventListener('touchcancel', onTouchEnd, true)
  window.addEventListener('keydown', onScrollKey, true)
  window.addEventListener('keyup', onScrollKeyUp, true)
  // A matched arrival already spent the camera move without a header, so bring it back sooner.
  if (phase.value === 'intro') headerTimer = setTimeout(() => { headerReady.value = true }, props.arrival ? 500 : 1650)
})

onBeforeUnmount(() => {
  clearTimeout(headerTimer)
  motionQuery?.removeEventListener('change', readMotion)
  window.removeEventListener('wheel', onWheel, true)
  window.removeEventListener('touchstart', onTouchStart, true)
  window.removeEventListener('touchmove', onTouchMove, true)
  window.removeEventListener('touchend', onTouchEnd, true)
  window.removeEventListener('touchcancel', onTouchEnd, true)
  window.removeEventListener('keydown', onScrollKey, true)
  window.removeEventListener('keyup', onScrollKeyUp, true)
})
</script>

<template>
  <main class="commercial-view" :data-lenis-prevent="scrollLocked ? '' : undefined" :class="{ 'is-transitioning': enhanced && phase !== 'ready', 'is-service-gated': enhanced && scene === 'services', 'is-scroll-locked': scrollLocked, 'is-scene-moving': sceneMoving, 'is-going-back': goingBack, 'is-reduced': reducedMotion }">
    <a class="skip-link" href="#certifications" @click="skipToSupport">Skip to certifications and contact</a>
    <h1 v-if="scene === 'clients'" class="sr-only">Commercial clients and projects</h1>

    <div class="commercial-view__stage">
      <header class="commercial-view__header service-header" :class="{ 'is-hidden': enhanced && !headerReady }">
        <div class="service-identity"><NuxtLink class="service-brand" to="/" aria-label="Setia Air-Cond and Electrical home"><SetiaWordmark /></NuxtLink></div>
        <NuxtLink class="service-quote" to="/get-a-quote?property=commercial">Get a quote<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
      </header>

      <CommercialBuildingScene
        v-if="scene === 'services'"
        key="services"
        tabindex="-1"
        :phase="phase"
        :reduced-motion="reducedMotion"
        :selected-service-slug="selectedServiceSlug"
        :from-clients="buildingArrived"
        :arrival="arrival"
        @ready="onSceneReady"
        @next="onBuildingNext"
        @exit-complete="onBuildingExit"
        @service-select="onServiceSelect"
      />
      <CommercialSupportSections v-else :scene-ready="!scrollLocked">
        <template #clients="{ pinned: clientsPinned }">
          <CommercialClientScene
            key="clients"
            tabindex="-1"
            :phase="phase"
            :reduced-motion="reducedMotion"
            :selected-client-slug="selectedClientSlug"
            :initial-page="selectedClientPage"
            :initial-category="selectedClientCategory"
            :skyline-arrived="skylineArrived"
            :pinned="clientsPinned"
            @ready="onSceneReady"
            @exit-complete="onClientExit"
            @slide-change="onClientSlideChange"
          />
        </template>
      </CommercialSupportSections>
    </div>

    <section v-if="!enhanced" class="commercial-view__nojs-clients" aria-labelledby="commercial-nojs-clients-heading">
      <h2 id="commercial-nojs-clients-heading">Commercial clients</h2>
      <ul>
        <li v-for="client in commercialClients" :key="client.slug">{{ client.displayName }}</li>
      </ul>
    </section>

    <CommercialSupportSections v-if="scene !== 'clients' && !enhanced" :scene-ready="!scrollLocked" />
    <!-- Home floats only once the building section is behind the visitor; once the clients screen has scrolled away it offers back to top, which climbs all the way back into the building. -->
    <FloatingReturn v-if="enhanced && scene === 'clients'" shown :threshold=".8" focus-target="#commercial-clients" @top="returnToBuilding" />
  </main>
</template>

<style scoped>
.commercial-view { min-width:0; color:#f5f5ed; background:#0b3022; }
.commercial-view.is-service-gated { height:100svh; overflow:clip; }
.commercial-view.is-service-gated .commercial-view__stage { height:100%; }
.commercial-view__stage { position:relative; }
.commercial-view.is-scene-moving .commercial-view__stage { overflow:clip; }
.commercial-view__stage :is(.commercial-building-scene,.client-scene):focus { outline:none; }
:global(html:has(.commercial-view.is-scroll-locked)), :global(body:has(.commercial-view.is-scroll-locked)) { overflow:hidden; overscroll-behavior:none; }
.commercial-view__header { position:absolute; inset:0 0 auto; z-index:12; width:100%; padding:12px var(--page-gutter); color:#f5f5ed; background:transparent; opacity:1; transition:opacity .24s ease; }
.commercial-view__header.is-hidden { opacity:0; pointer-events:none; visibility:hidden; }
.commercial-view__header :is(a,button):focus-visible { outline:2px solid #d1e4d7; outline-offset:4px; }
:global(body:has(.commercial-view.is-transitioning) .floating-contact) { opacity:0; visibility:hidden; pointer-events:none; }
.commercial-view__nojs-clients { padding:64px var(--page-gutter); }
.commercial-view__nojs-clients ul { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; padding:0; list-style:none; }
@media (max-width:700px) { .commercial-view__header { padding:10px 22px; } .commercial-view__header .service-brand { font-size:24px; } .commercial-view__nojs-clients ul { grid-template-columns:1fr 1fr; } }
@media (max-width:360px) { .commercial-view__header { flex-wrap:wrap; } .commercial-view__header .service-quote { margin-left:auto; } .commercial-view__nojs-clients ul { grid-template-columns:1fr; } }
@media (prefers-reduced-motion:reduce) { .commercial-view__header { transition:none; } }
</style>
