<script setup lang="ts">
import corporate from '~/data/corporate.json'
import { commercialCredentialLogos } from '~/data/commercial-logos'
import { commercialBrandLogos, commercialEnquiry } from '~/data/commercial-motion'
import { COMMERCIAL_SUPPORT_SCREENS, COMMERCIAL_CREDENTIALS_STOP, COMMERCIAL_MAINTENANCE_STOP, commercialSupportAt } from '~/utils/commercial-support-journey'
import { COMMERCIAL_ENDING_SCREENS, COMMERCIAL_BRANDS_STOP, COMMERCIAL_TENDER_STOP, COMMERCIAL_FIRST_BRAND_ENTRY, commercialEndingAt } from '~/utils/commercial-ending'

const maintenance = corporate.capabilities[3]!
const props = withDefaults(defineProps<{ sceneReady?: boolean }>(), { sceneReady: true })
const hasClients = Boolean(useSlots().clients)
const route = useRoute()
const { $scrollTo } = useNuxtApp()
const root = useTemplateRef<HTMLElement>('root')
const recordsRoot = useTemplateRef<HTMLElement>('recordsRoot')
const recordsStage = useTemplateRef<HTMLElement>('recordsStage')
const clientsRoot = useTemplateRef<HTMLElement>('clientsRoot')
const ending = useTemplateRef<HTMLElement>('ending')
const endingStage = useTemplateRef<HTMLElement>('endingStage')
const endingContact = useTemplateRef<HTMLElement>('endingContact')
const pinned = ref(false)
const coverPinned = ref(false)
const coverProgress = ref(0)
const endingPinned = ref(false)
const recordsProgress = ref(0)
const recordsState = computed(() => commercialSupportAt(recordsProgress.value, hasClients, maintenance.items.length))
const endingState = ref(commercialEndingAt(0, commercialBrandLogos.length))
let motion: { revert: () => void } | undefined
let initializing = false
let alive = true
let jumpRecords: ((value: number) => void) | undefined
let jumpCover: ((value: number) => void) | undefined
let jumpEnding: ((value: number) => void) | undefined

function groupState(group: 'certifications' | 'capability') {
  return group === 'certifications' ? recordsState.value.credentials : recordsState.value.maintenance
}
function recordState(index: number) {
  return recordsState.value.records[index]!
}
function maintenanceState() {
  return recordsState.value.maintenanceBody
}
function maintenanceItemStyle(index: number) {
  if (!pinned.value) return undefined
  const state = recordsState.value.maintenanceItems[index]!
  return { '--item-reveal': state.reveal }
}
function groupStyle(group: 'certifications' | 'capability') {
  if (!pinned.value) return undefined
  const state = groupState(group)
  return { '--group-opacity': state.opacity, '--group-reveal': state.reveal, '--group-cover': group === 'certifications' ? recordsState.value.credentialsCover : 1 }
}
function recordStyle(index: number) {
  if (!pinned.value) return undefined
  const state = recordState(index)
  return { '--record-opacity': state.opacity, '--record-reveal': state.reveal }
}
const maintenanceStyle = computed(() => {
  if (!pinned.value) return undefined
  const state = maintenanceState()
  return { '--record-opacity': state.opacity, '--record-reveal': state.reveal }
})
const clientsStyle = computed(() => pinned.value ? {
  opacity: recordsState.value.clientsOpacity,
  '--clients-controls': recordsState.value.clientsControls,
} : undefined)
const clientsVisible = computed(() => pinned.value ? recordsState.value.clientsVisible : !coverPinned.value || coverProgress.value < .65)
const detailsStyle = computed(() => coverPinned.value ? { '--clients-cover': coverProgress.value } : undefined)
const maintenanceArtStyle = computed(() => pinned.value ? {
  opacity: recordsState.value.maintenanceArt,
  transform: `translateY(${(1 - recordsState.value.maintenanceArt) * 32}px)`,
} : undefined)

async function followHash() {
  if (!alive) return
  const id = route.hash.slice(1)
  if (!['certifications', 'capability', 'commercial-brands', 'tender'].includes(id)) return
  if (pinned.value && id === 'certifications') jumpRecords?.(COMMERCIAL_CREDENTIALS_STOP)
  else if (pinned.value && id === 'capability') jumpRecords?.(COMMERCIAL_MAINTENANCE_STOP)
  else if (coverPinned.value && id === 'certifications') jumpCover?.(1)
  else if (endingPinned.value && ['commercial-brands', 'tender'].includes(id)) jumpEnding?.(id === 'commercial-brands' ? COMMERCIAL_BRANDS_STOP : COMMERCIAL_TENDER_STOP)
  else {
    if (coverPinned.value) {
      jumpCover?.(1)
      await nextTick()
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
  }
  void nextTick(() => { if (alive) document.getElementById(id)?.focus({ preventScroll: true }) })
}
watch(() => route.hash, followHash)

async function initialize() {
  try {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
    if (!alive || !root.value || !recordsRoot.value || !recordsStage.value || !ending.value || !endingStage.value || !endingContact.value) return
    gsap.registerPlugin(ScrollTrigger)
    const scope = root.value
    const match = gsap.matchMedia()
    motion = match
    match.add({
      all: 'all',
      desktop: '(min-width: 1000px) and (min-height: 760px)',
      endingDesktop: '(min-width: 1000px) and (min-height: 800px)',
      reduced: '(prefers-reduced-motion: reduce)',
    }, context => {
      const desktop = Boolean(context.conditions?.desktop)
      const reduced = Boolean(context.conditions?.reduced)
      pinned.value = desktop && !reduced
      scope.classList.toggle('support--pinned', pinned.value)
      // Preserve a natural reading layout when the grid cannot fit the viewport.
      if (pinned.value && Array.from(recordsStage.value!.querySelectorAll<HTMLElement>('.records-group')).some(group => group.scrollHeight > window.innerHeight)) {
        pinned.value = false
      }
      const clientStage = clientsRoot.value?.querySelector<HTMLElement>('.client-scene')
      coverPinned.value = hasClients && !pinned.value && !reduced && Boolean(clientStage)
      scope.classList.toggle('support--client-cover', coverPinned.value)
      // Keep About's natural spacing. Only pin the expanded company ending
      // when its complete contact grid fits; compact views remain scrollable.
      endingPinned.value = Boolean(context.conditions?.endingDesktop) && !reduced
        && endingContact.value!.scrollHeight <= window.innerHeight
      scope.classList.toggle('support--pinned', pinned.value)
      ending.value!.classList.toggle('support-ending--pinned', endingPinned.value)
      ending.value!.toggleAttribute('data-story-enhanced', endingPinned.value)
      const brandMarks = Array.from(scope.querySelectorAll<HTMLElement>('[data-commercial-brand]'))
      const supplierHeading = scope.querySelector<HTMLElement>('#commercial-brands-heading')!
      const columnDelay = (item: HTMLElement, index: number, amount: number) => {
        const columns = getComputedStyle(item.parentElement!).gridTemplateColumns.split(' ').length
        return (index % columns) * amount
      }
      const renderSupplierHeading = (value: number) => {
        ending.value!.style.setProperty('--supplier-first', String(Math.min(1, Math.max(0, value / .8))))
        ending.value!.style.setProperty('--supplier-second', String(Math.min(1, Math.max(0, (value - .16) / .84))))
      }
      if (pinned.value) {
        const recordsClock = { progress: 0 }
        const recordsTween = gsap.fromTo(recordsClock, { progress: 0 }, {
          progress: 1, ease: 'none', onUpdate: () => { recordsProgress.value = recordsClock.progress },
          scrollTrigger: {
            trigger: recordsRoot.value, pin: recordsStage.value, start: 'top top',
            id: 'commercial-clients-credentials',
            end: () => `+=${recordsStage.value!.clientHeight * (hasClients ? COMMERCIAL_SUPPORT_SCREENS : 3.25)}`,
            scrub: .45, anticipatePin: 1, invalidateOnRefresh: true,
          },
        })
        jumpRecords = value => {
          const range = recordsTween.scrollTrigger
          if (!range) return
          $scrollTo(range.start + (range.end - range.start) * value, { immediate: true })
          ScrollTrigger.update()
          range.getTween()?.progress(1)
          recordsTween.progress(value)
          recordsProgress.value = value
        }
      } else if (!reduced) {
        if (coverPinned.value && clientStage) {
          const coverClock = { progress: 0 }
          const coverTween = gsap.fromTo(coverClock, { progress: 0 }, {
            progress: 1, ease: 'none', onUpdate: () => { coverProgress.value = coverClock.progress },
            scrollTrigger: {
              trigger: recordsRoot.value, pin: clientStage, pinSpacing: false, start: 'top top',
              id: 'commercial-clients-cover', end: () => `+=${clientsRoot.value!.clientHeight}`,
              scrub: .45, anticipatePin: 1, invalidateOnRefresh: true,
            },
          })
          jumpCover = value => {
            const range = coverTween.scrollTrigger
            if (!range) return
            $scrollTo(range.start + (range.end - range.start) * value, { immediate: true })
            ScrollTrigger.update()
            range.getTween()?.progress(1)
            coverTween.progress(value)
            coverProgress.value = value
          }
        }
        const certificates = Array.from(recordsRoot.value!.querySelectorAll<HTMLElement>('.records-certificate'))
        recordsRoot.value!.querySelectorAll<HTMLElement>('[data-support-reveal]').forEach(item => {
          const certificateIndex = certificates.indexOf(item)
          const delay = () => certificateIndex >= 0 ? columnDelay(item, certificateIndex, 4) : 0
          gsap.fromTo(item, { opacity: 0, y: 32 }, {
            opacity: 1, y: 0, ease: 'none',
            scrollTrigger: { trigger: item, start: () => `top ${95 - delay()}%`, end: () => `top ${72 - delay()}%`, scrub: .6, invalidateOnRefresh: true },
          })
          if (certificateIndex >= 0) gsap.fromTo(item, { '--record-reveal': 0 }, {
            '--record-reveal': 1, ease: 'none',
            scrollTrigger: { trigger: item, start: () => `top ${95 - delay()}%`, end: () => `top ${72 - delay()}%`, scrub: .6, invalidateOnRefresh: true },
          })
        })
        recordsRoot.value!.querySelectorAll<HTMLElement>('[data-maintenance-item]').forEach(item => {
          gsap.fromTo(item, { '--item-reveal': 0 }, {
            '--item-reveal': 1, ease: 'none',
            scrollTrigger: { trigger: item, start: 'top 88%', end: 'top 68%', scrub: .45, invalidateOnRefresh: true },
          })
        })
      }
      if (endingPinned.value) {
        const endingClock = { progress: 0 }
        const endingEntry = { progress: 0 }
        const firstBrandEntry = { progress: 0 }
        const renderEnding = (value: number) => {
          const state = commercialEndingAt(value, brandMarks.length, {
            heading: endingEntry.progress, firstBrand: firstBrandEntry.progress,
          })
          endingState.value = state
          for (const [name, amount] of Object.entries({
            '--brands-opacity': state.brandsOpacity, '--brands-exit': state.brandsExit,
            '--brand-title': state.brandTitle, '--contact-opacity': state.contactOpacity,
            '--contact-title': state.contactTitle, '--contact-team': state.contactTeam, '--contact-details': state.contactDetails,
          })) ending.value!.style.setProperty(name, String(amount))
          renderSupplierHeading(state.brandTitle)
          brandMarks.forEach((mark, i) => mark.style.setProperty('--brand-reveal', String(state.brandReveals[i] ?? 0)))
        }
        // Leave a short reading gap, then reveal the heading's two lines while
        // it is onscreen. Keep the existing supplier folds and enquiry clock.
        gsap.fromTo(endingEntry, { progress: 0 }, {
          progress: 1, ease: 'none', onUpdate: () => renderEnding(endingClock.progress),
          scrollTrigger: {
            trigger: supplierHeading, start: 'top 92%', end: 'top 68%',
            scrub: .45, invalidateOnRefresh: true,
          },
        })
        // Start the first fold four viewport points after the heading finishes,
        // before pinning. Later marks retain their ordered ending-clock folds.
        gsap.fromTo(firstBrandEntry, { progress: 0 }, {
          progress: 1, ease: 'none', onUpdate: () => renderEnding(endingClock.progress),
          scrollTrigger: {
            trigger: supplierHeading,
            start: `top ${COMMERCIAL_FIRST_BRAND_ENTRY.start}%`, end: `top ${COMMERCIAL_FIRST_BRAND_ENTRY.end}%`,
            scrub: .45, invalidateOnRefresh: true,
          },
        })
        const endingTween = gsap.fromTo(endingClock, { progress: 0 }, {
          progress: 1, ease: 'none', onUpdate: () => renderEnding(endingClock.progress),
          scrollTrigger: {
            trigger: ending.value, pin: endingStage.value, start: 'top top',
            end: () => `+=${endingStage.value!.clientHeight * COMMERCIAL_ENDING_SCREENS}`,
            scrub: .7, anticipatePin: 1, invalidateOnRefresh: true,
          },
        })
        jumpEnding = value => {
          const range = endingTween.scrollTrigger
          if (!range) return
          $scrollTo(range.start + (range.end - range.start) * value, { immediate: true })
          ScrollTrigger.update()
          range.getTween()?.progress(1)
          endingTween.progress(value)
          renderEnding(value)
        }
        renderEnding(0)
      } else if (!reduced) {
        // Dense records and short windows keep their natural height. Retain the
        // approved logo folds and team entrance without a clipped pinned stage.
        ending.value!.querySelectorAll<HTMLElement>('[data-support-reveal]').forEach(item => {
          if (item === supplierHeading) {
            const headingClock = { progress: 0 }
            gsap.fromTo(headingClock, { progress: 0 }, {
              progress: 1, ease: 'none', onUpdate: () => renderSupplierHeading(headingClock.progress),
              scrollTrigger: { trigger: item, start: 'top 92%', end: 'top 68%', scrub: .45, invalidateOnRefresh: true },
            })
            renderSupplierHeading(0)
            return
          }
          gsap.fromTo(item, { opacity: 0, y: 32 }, {
            opacity: 1, y: 0, ease: 'none',
            scrollTrigger: { trigger: item, start: 'top 95%', end: 'top 72%', scrub: .6, invalidateOnRefresh: true },
          })
        })
        brandMarks.forEach((mark, index) => {
          const word = mark.querySelector('[data-brand-word]')
          if (!word) return
          const delay = () => columnDelay(mark, index, 6)
          gsap.timeline({
            defaults: { duration: 1, ease: 'none' },
            scrollTrigger: { trigger: mark, start: () => `top ${95 - delay()}%`, end: () => `top ${73 - delay()}%`, scrub: .6, invalidateOnRefresh: true },
          })
            .fromTo(word, { opacity: 0, yPercent: 115, rotationX: 65, transformOrigin: '50% 100%' }, { opacity: 1, yPercent: 0, rotationX: 0 }, 0)
            .fromTo(mark, { '--brand-reveal': 0 }, { '--brand-reveal': 1 }, 0)
        })
        const team = scope.querySelector('.company-enquiry__team')
        if (team) gsap.fromTo(team, { opacity: 0, y: 70, scale: .94, transformOrigin: 'center bottom' }, {
          opacity: 1, y: 0, scale: 1, ease: 'none',
          scrollTrigger: { trigger: team, start: 'top 95%', end: 'top 60%', scrub: .7, invalidateOnRefresh: true },
        })
      }
      void nextTick(() => {
        if (!alive) return
        ScrollTrigger.refresh()
        followHash()
      })
      return () => {
        pinned.value = false
        coverPinned.value = false
        endingPinned.value = false
        jumpRecords = undefined
        jumpCover = undefined
        jumpEnding = undefined
        scope.classList.remove('support--pinned')
        scope.classList.remove('support--client-cover')
        ending.value?.removeAttribute('data-story-enhanced')
        ending.value?.classList.remove('support-ending--pinned')
        for (const name of ['--brands-opacity', '--brands-exit', '--brand-title', '--supplier-first', '--supplier-second', '--contact-opacity', '--contact-title', '--contact-team', '--contact-details']) ending.value?.style.removeProperty(name)
        brandMarks.forEach(mark => mark.style.removeProperty('--brand-reveal'))
      }
    }, scope)
  } catch {
    // The unenhanced template remains a complete reading view.
    motion?.revert()
    motion = undefined
  }
}
async function activate() {
  await nextTick()
  if (!alive || !props.sceneReady || initializing || motion) return
  initializing = true
  try { await initialize() } finally { initializing = false }
}
// Measure the scroll chapters after the incoming skyline has its final frame
// and page scrolling is unlocked, including the compact pagination layout.
watch(() => props.sceneReady, ready => { if (ready) void activate() })
onMounted(() => { void activate() })
onBeforeUnmount(() => { alive = false; motion?.revert(); motion = undefined })
</script>

<template>
  <div ref="root" class="commercial-support" :class="{ 'support--has-clients': hasClients }">
    <section ref="recordsRoot" class="support-records" aria-label="Credentials and maintenance capabilities">
      <div ref="recordsStage" class="support-records__stage">
        <div v-if="hasClients" ref="clientsRoot" class="support-clients" :style="clientsStyle" :inert="!clientsVisible" :aria-hidden="!clientsVisible || undefined">
          <slot name="clients" :pinned="pinned || coverPinned" />
        </div>
        <div class="support-details" :style="detailsStyle">
        <section id="certifications" class="records-group records-credentials" aria-labelledby="commercial-credentials-heading" tabindex="-1" :style="groupStyle('certifications')"
          :inert="pinned && !groupState('certifications').visible" :aria-hidden="pinned && !groupState('certifications').visible || undefined">
          <header class="records-heading" data-support-reveal><h2 id="commercial-credentials-heading" class="service-section-heading">Registered, graded<br>and audited.</h2></header>
          <div class="credential-grid">
            <article v-for="(certificate, index) in corporate.certifications" :key="certificate.code" class="records-certificate" data-support-reveal :style="recordStyle(index)"
              :inert="pinned && !recordState(index).visible" :aria-hidden="pinned && !recordState(index).visible || undefined">
              <div class="records-mark">
                <CommercialLogo v-if="commercialCredentialLogos[certificate.code]" :logo="commercialCredentialLogos[certificate.code]!" :name="certificate.title" :dark="true" :lazy="true" />
                <span v-else class="records-standard">ISO 9001:2015</span>
              </div>
              <h3>{{ certificate.title }}</h3>
              <p class="records-issuer">{{ certificate.issuer }}</p>
              <p class="records-certificate-detail">{{ certificate.detail }}</p>
            </article>
          </div>
        </section>

        <section id="capability" class="records-group records-capabilities" aria-labelledby="commercial-maintenance-heading" tabindex="-1" :style="groupStyle('capability')"
          :inert="pinned && !groupState('capability').visible" :aria-hidden="pinned && !groupState('capability').visible || undefined">
          <header class="records-heading" data-support-reveal>
            <h2 id="commercial-maintenance-heading" class="service-section-heading">Both disciplines.<br>One contract.</h2>
            <p>Cooling and the power that runs it, coordinated for your site.</p>
          </header>
          <div class="capability-boards">
            <article class="capability-column" data-support-reveal :style="maintenanceStyle" :inert="pinned && !maintenanceState().visible" :aria-hidden="pinned && !maintenanceState().visible || undefined">
              <h3>Maintenance programmes</h3>
              <p class="records-capability-title">{{ maintenance.title }}</p>
              <ul class="records-capability-items"><li v-for="(item, index) in maintenance.items" :key="item" data-maintenance-item :style="maintenanceItemStyle(index)">{{ item }}</li></ul>
            </article>
            <div class="capability-illustration" data-support-reveal :style="maintenanceArtStyle" aria-hidden="true">
              <img :src="$sitePath('/images/about/tools-ai-v1.webp')" width="700" height="514" alt="" loading="lazy" decoding="async">
            </div>
          </div>
        </section>
        </div>
      </div>
    </section>

    <section ref="ending" class="support-ending" aria-label="Suppliers and project enquiries">
      <div ref="endingStage" class="support-ending__stage">
        <section id="commercial-brands" class="service-brands" aria-labelledby="commercial-brands-heading" tabindex="-1" :inert="endingPinned && endingState.brandsOpacity < .05" :aria-hidden="endingPinned && endingState.brandsOpacity < .05 || undefined">
          <h2 id="commercial-brands-heading" data-support-reveal>
            <span class="supplier-heading-line"><span>Supplying</span></span>
            <span class="supplier-heading-line"><span>and supporting.</span></span>
          </h2>
          <ul aria-label="Commercial air-conditioning brands">
            <li v-for="(brand, index) in commercialBrandLogos" :key="brand.name" data-commercial-brand :aria-hidden="endingPinned && (endingState.brandReveals[index] ?? 0) < .05 || undefined">
              <div class="service-brand-mark" data-brand-word>
                <div class="service-brand-image"><img :src="$sitePath(brand.src)" :alt="brand.name" :width="brand.width" :height="brand.height" :class="`service-brand-image--${brand.treatment}`" loading="lazy" decoding="async"></div>
                <span class="service-brand-caption" aria-hidden="true">{{ brand.name }}</span>
              </div>
            </li>
          </ul>
          <p class="supplier-more" :style="{ opacity: endingPinned ? endingState.brandReveals[commercialBrandLogos.length - 1] ?? 0 : 1 }">and many more</p>
        </section>

        <section id="tender" ref="endingContact" class="support-enquiry" aria-labelledby="commercial-contact-heading" tabindex="-1" :inert="endingPinned && endingState.contactOpacity < .1" :aria-hidden="endingPinned && endingState.contactOpacity < .1 || undefined">
          <CompanyEnquirySection
            heading-id="commercial-contact-heading"
            :heading-lines="['Ready for', 'better cooling?']"
            :description="corporate.tenderDescription"
            :quote-to="commercialEnquiry"
            :animated="endingPinned"
            :details-hidden="endingPinned && endingState.contactDetails < .1"
          />
        </section>
      </div>
      <CompanyFooter />
    </section>
  </div>
</template>

<style scoped>
.commercial-support { --pine-900:#f5f5ed; --pine:#d1e4d7; --pine-700:#b9d5c4; --ink-soft:#bed0c3; --line:#bed0c338; color:#f5f5ed; background:#0b3022; }
.commercial-support :is(a,button,[tabindex]):focus-visible { outline:2px solid #d1e4d7; outline-offset:5px; }
.support-records,.support-ending { position:relative; }
.records-group { padding:80px var(--page-gutter); }
.records-heading { text-align:center; }
.records-heading h2 { margin:0; }
.records-heading p { color:var(--ink-soft); max-width:42ch; margin:20px auto 0; font-size:15px; line-height:1.6; }
.credential-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:40px 48px; max-width:1200px; margin:64px auto 0; }
.records-certificate { min-width:0; padding:0 0 24px; border-bottom:1px solid var(--line); text-align:center; }
.records-mark { --logo-height:56px; --logo-width:220px; min-height:56px; display:grid; align-items:center; }
.records-mark { perspective:800px; }
.records-mark > * { transform-origin:center bottom; transform:rotateX(calc((1 - var(--record-reveal,1)) * 65deg)); }
.records-certificate h3 { margin:20px 0 0; font-size:18px; line-height:1.3; font-weight:500; text-wrap:balance; }
.records-standard { font-size:clamp(24px,2.4vw,34px); font-weight:600; letter-spacing:-.03em; }
.records-issuer { margin:8px 0 0; color:var(--ink-soft); font-size:12px; line-height:1.4; }
.records-certificate-detail { max-width:38ch; margin:16px auto 0; font-size:14px; line-height:1.5; text-wrap:pretty; }
.capability-boards { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,1fr); align-items:center; gap:clamp(40px,6vw,100px); width:min(100%,1200px); margin:64px auto 0; }
.capability-illustration img { display:block; width:100%; max-width:460px; height:auto; margin-inline:auto; }
.capability-column { min-width:0; }
.capability-column h3 { margin:0; font-size:clamp(28px,3vw,44px); font-weight:500; line-height:1.1; letter-spacing:-.03em; text-wrap:balance; }
.records-capability-title { margin:16px 0 28px; color:var(--ink-soft); font-size:14px; line-height:1.5; }
.records-capability-items { padding:0; margin:0; list-style:none; }
.records-capability-items li { padding:14px 0; border-top:1px solid var(--line); font-size:16px; line-height:1.45; text-wrap:pretty; opacity:var(--item-reveal,1); transform:translate3d(0,calc((1 - var(--item-reveal,1)) * 18px),0); }
.support--pinned .support-records__stage,.support-ending--pinned .support-ending__stage { position:relative; width:100%; height:100svh; min-height:500px; overflow:clip; isolation:isolate; background:#0b3022; }
.support--pinned .support-clients { position:absolute; z-index:1; inset:0; }
.support--pinned .support-clients :deep(.client-scene__heading), .support--pinned .support-clients :deep(.client-scene__marks), .support--pinned .support-clients :deep(.commercial-leaders), .support--pinned .support-clients :deep(.client-scene__pagination), .support--pinned .support-clients :deep(.client-scene__below) { opacity:var(--clients-controls,1); }
.support--pinned .records-group { position:absolute; z-index:2; inset:0; display:flex; flex-direction:column; padding:80px var(--page-gutter) 140px; opacity:var(--group-opacity,0); }
.support--pinned .records-credentials { background:#0b3022; transform:translate3d(0,calc((1 - var(--group-cover,0)) * 100%),0); }
.support--client-cover .support-clients { position:relative; z-index:1; height:125svh; }
.support--client-cover .support-details { position:relative; z-index:2; transform:translate3d(0,calc((1 - var(--clients-cover,0)) * -25svh),0); }
.support--client-cover .records-credentials { background:#0b3022; }
.support--pinned .records-heading { flex-shrink:0; transform:translate3d(0,calc((1 - var(--group-reveal,0)) * 40px),0); }
.support--pinned .credential-grid { width:100%; margin-block:auto; padding-top:24px; gap:28px 48px; }
.support--pinned .records-certificate { opacity:var(--record-opacity,0); transform:translate3d(0,calc((1 - var(--record-reveal,0)) * 32px),0); }
.support--pinned .capability-boards { align-content:center; flex:1; min-height:0; margin-top:40px; }
.support--pinned .capability-column { opacity:var(--record-opacity,0); transform:translate3d(0,calc((1 - var(--record-reveal,0)) * 40px),0); }
.support--pinned [inert] { pointer-events:none; }
/* Reuse the records stage's protected bottom padding during the handoff. */
.support--pinned .support-ending { margin-top:-128px; }
.support--pinned .service-brands { padding-top:80px; }
.commercial-support .service-brands { background:#0b3022; }
.support-ending--pinned .service-brands { justify-content:flex-start; padding-top:80px; }
.commercial-support .service-brands h2 { opacity:1; transform:none; text-align:center; }
.supplier-heading-line { --supplier-line:var(--supplier-first,1); display:block; overflow:clip; }
.supplier-heading-line + .supplier-heading-line { --supplier-line:var(--supplier-second,1); }
.supplier-heading-line > span { display:block; transform:translate3d(0,calc((1 - var(--supplier-line)) * 105%),0); }
.commercial-support .service-brand-image--light { filter:none; }
.commercial-support .service-brand-image--solid { filter:brightness(0) invert(1); }
.commercial-support .service-brand-image--reverse { filter:grayscale(1) invert(1) brightness(1.4); }
.commercial-support .service-brands li::after { transform:scaleX(var(--brand-reveal,1)); }
.supplier-more { margin:24px 0 0; color:#bed0c3; font-size:14px; line-height:1.5; text-align:center; }
.support-enquiry:focus { outline:none; }
.support-ending--pinned .support-enquiry { position:absolute; inset:0; z-index:3; display:flex; align-items:center; opacity:var(--contact-opacity,0); }
.support-ending--pinned .support-enquiry[inert] { pointer-events:none; }
@media (max-width:1000px),(max-height:850px) {
  .support--pinned .support-ending { margin-top:-96px; }
  .support--pinned .credential-grid { gap:24px 32px; }
  .support--pinned .records-certificate { padding-bottom:16px; }
  .support--pinned .records-mark { --logo-height:44px; min-height:44px; }
  .support--pinned .records-certificate h3 { margin-top:16px; font-size:16px; }
  .support--pinned .records-certificate-detail { margin-top:12px; font-size:13px; }
  .support--pinned .records-issuer { font-size:11px; }
  .support--pinned .capability-boards { margin-top:28px; }
  .support--pinned .capability-column h3 { font-size:32px; }
  .support--pinned .records-capability-title { margin-block:12px 20px; font-size:13px; }
  .support--pinned .records-capability-items li { padding-block:10px; font-size:14px; }
}
@media (max-width:760px) {
  .records-group { padding:64px 22px; }
  .records-heading p { margin-top:16px; font-size:14px; }
  .credential-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:36px 24px; margin-top:48px; }
  .records-mark { --logo-height:40px; min-height:40px; }
  .records-certificate h3 { font-size:16px; margin-top:16px; }
  .records-certificate-detail { font-size:13px; }
  .records-standard { font-size:22px; }
  .capability-boards { grid-template-columns:1fr; gap:40px; margin-top:48px; }
  .capability-illustration img { width:min(100%,340px); }
  .records-capability-items li { font-size:15px; }
}
@media (max-width:460px) { .credential-grid { grid-template-columns:1fr; } }
@media (prefers-reduced-motion:reduce) { .commercial-support .service-brands li::after { transform:none; } }
</style>
