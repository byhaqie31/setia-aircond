<script setup lang="ts">
import { airConditioningBrandLogos } from '~/data/air-conditioning'

const story = useTemplateRef<HTMLElement>('story')
const { $scrollTo } = useNuxtApp()
let alive = true
let motion: { revert: () => void } | undefined
let rebuild: (() => void) | undefined
let getContactPosition: (() => number | undefined) | undefined
let pendingOfficeClick = false
let resizeTimer: ReturnType<typeof setTimeout> | undefined
let viewportWidth = 0
let viewportHeight = 0
const pinnedChapters = new Set<HTMLElement>()

function clearMotion() {
  getContactPosition = undefined
  motion?.revert()
  motion = undefined
  for (const chapter of pinnedChapters) chapter.removeAttribute('data-about-pinned')
  pinnedChapters.clear()
}

function scheduleRebuild() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    if (!alive) return
    try { rebuild?.() } catch { clearMotion() }
  }, 160)
}

function onResize() {
  const width = window.innerWidth
  const height = window.innerHeight
  if (width === viewportWidth && (height === viewportHeight || width < 1000)) return
  scheduleRebuild()
}

function followContact(focus = false, smooth = false) {
  const section = story.value?.querySelector<HTMLElement>('#company-contact')
  if (!alive || !section) return
  $scrollTo(getContactPosition?.() ?? section, {
    immediate: !smooth,
    onComplete: () => { if (alive && focus) section.focus({ preventScroll: true }) },
  })
}

function onOfficeClick(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  if (window.location.hash !== '#company-contact') history.pushState(history.state, '', '#company-contact')
  pendingOfficeClick = !motion
  followContact(true, true)
}

function onHashChange() {
  if (window.location.hash === '#company-contact') followContact()
}

useHead({
  htmlAttrs: { 'data-theme': 'service' },
  title: 'About us | Setia Air-Cond',
  meta: [{ name: 'description', content: 'Malaysian-owned air-conditioning and electrical specialists since 1990. Get to know Setia and contact our Subang Jaya office.' }],
})

onMounted(async () => {
  try {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
    if (!alive || !story.value) return
    const root = story.value
    gsap.registerPlugin(ScrollTrigger)
    rebuild = () => {
      clearMotion()
      viewportWidth = window.innerWidth
      viewportHeight = window.innerHeight
      const media = gsap.matchMedia()
      motion = media
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const canPin = viewportWidth >= 1000 && viewportHeight >= 760
        const chapter = (selector: string, screens: number, compactEnd = 'bottom 82%') => {
          const section = root.querySelector<HTMLElement>(selector)!
          // Measure the reading layout first: long/zoomed content must never be trapped.
          const pin = canPin && section.scrollHeight <= viewportHeight
          if (pin) {
            section.setAttribute('data-about-pinned', '')
            pinnedChapters.add(section)
          }
          return gsap.timeline({
            defaults: { ease: 'power2.out' },
            scrollTrigger: {
              trigger: section, start: pin ? 'top top' : 'top 88%',
              end: pin ? () => `+=${window.innerHeight * screens}` : compactEnd,
              pin, pinSpacing: true, scrub: .7, anticipatePin: pin ? 1 : 0,
              invalidateOnRefresh: true,
            },
          })
        }

        gsap.fromTo(root.querySelectorAll('[data-about-opening]'), { opacity: .35, y: 24 }, {
          opacity: 1, y: 0, duration: .7, stagger: .1, ease: 'power3.out',
        })

        const purpose = chapter('.about-purpose-band', 1.5)
        purpose.fromTo(root.querySelectorAll('[data-about-motto]'), { clipPath: 'inset(0 100% 0 0)' }, {
          clipPath: 'inset(0 0% 0 0)', duration: .8, stagger: .25, ease: 'none',
        }, 0)
        purpose.fromTo(root.querySelectorAll('[data-about-purpose-item]'), { opacity: .2, y: 36 }, {
          opacity: 1, y: 0, duration: .55, stagger: .35,
        }, .25)
        purpose.to({}, { duration: .45 })

        const standards = chapter('.about-standards', 2)
        standards.fromTo(root.querySelector('#standards-title'), { opacity: .2, y: 36 }, { opacity: 1, y: 0, duration: .5 }, 0)
        standards.fromTo(root.querySelectorAll('[data-about-commitment]'), { opacity: .15, y: 28 }, {
          opacity: 1, y: 0, duration: .45, stagger: .3,
        }, .2)
        standards.fromTo(root.querySelector('.about-support'), { opacity: .2, y: 36 }, { opacity: 1, y: 0, duration: .55 }, 1.25)
        standards.to({}, { duration: .45 })

        const brands = chapter('.about-brands-band', 1.8)
        brands.fromTo(root.querySelector('#about-brands-title'), { opacity: .2, y: 32 }, { opacity: 1, y: 0, duration: .5 }, 0)
        brands.fromTo(root.querySelectorAll('[data-about-brand]'), { opacity: 0, y: 70, rotationX: 65 }, {
          opacity: 1, y: 0, rotationX: 0, duration: .55, stagger: .13,
        }, .25)
        brands.to({}, { duration: .55 })

        const enquiry = chapter('.about-enquiry', 1.1, 'top 35%')
        // Reveal the heading, action and portrait together, with no faded preview.
        enquiry.fromTo(root.querySelector('.company-enquiry__hero'), { autoAlpha: 0, y: 36 }, {
          autoAlpha: 1, y: 0, duration: .8,
        }, 0)
        enquiry.fromTo(root.querySelector('.company-enquiry__team'), { y: 24, scale: .96 }, {
          y: 0, scale: 1, duration: .8,
        }, 0)
        enquiry.addLabel('contact-ready')
        enquiry.to({}, { duration: .45 })

        getContactPosition = () => {
          const range = enquiry.scrollTrigger
          if (range?.vars.pin) {
            // Land halfway through the completed hold, keeping the whole panel in view.
            const ready = (enquiry.labels['contact-ready']! / enquiry.duration() + 1) / 2
            return range.start + (range.end - range.start) * ready
          }
        }

        // The contact grid shares this final chapter and stays fully readable.
        return () => {
          getContactPosition = undefined
          for (const section of pinnedChapters) section.removeAttribute('data-about-pinned')
          pinnedChapters.clear()
        }
      }, root)
      ScrollTrigger.refresh()
    }
    rebuild()
    // Pin spacing changes document positions; restore explicit direct contact entry.
    if (window.location.hash === '#company-contact') followContact(pendingOfficeClick, pendingOfficeClick)
    pendingOfficeClick = false
    window.addEventListener('resize', onResize)
    window.addEventListener('hashchange', onHashChange)
    document.fonts?.addEventListener('loadingdone', scheduleRebuild)
  } catch {
    // Default HTML remains readable if animation imports or initialization fail.
    clearMotion()
  }
})

onBeforeUnmount(() => {
  alive = false
  clearTimeout(resizeTimer)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('hashchange', onHashChange)
  document.fonts?.removeEventListener('loadingdone', scheduleRebuild)
  clearMotion()
  rebuild = undefined
})
</script>

<template>
  <CompanyPage current="about" class="about-page">
    <div ref="story" class="about-story">
    <section class="company-intro company-width about-intro about-columns" aria-labelledby="about-title">
      <div class="about-intro__title-block">
        <h1 id="about-title" data-about-opening>
          <span class="about-title-line">About us.</span>
          <span class="about-title-line">Committed</span>
          <span class="about-title-line">since <span class="about-year">1990.</span></span>
        </h1>
        <img class="about-intro__art" :src="$sitePath('/images/about/coverage-ai-v1.webp')" width="640" height="427" alt="" aria-hidden="true" decoding="async">
      </div>
      <div class="about-intro__copy" data-about-opening>
        <p>Wholly Malaysian-owned, Setia provides air-conditioning and electrical services for public and private clients across Malaysia.</p>
        <p>From homes to factories, production plants and high-rise buildings, we match each system to the space, budget and programme. Our team brings over 100 man-years of combined technical experience.</p>
        <a class="company-link" href="#company-contact" @click="onOfficeClick">Find our office<span class="icon icon--arrow" aria-hidden="true" /></a>
      </div>
    </section>

    <section class="about-purpose-band" aria-labelledby="purpose-title">
    <div class="about-purpose company-width">
      <div class="about-purpose__heading about-columns">
      <h2 id="purpose-title" class="about-motto">
        <span class="about-motto__line"><span>“Commit to</span><span class="about-motto__ink" data-about-motto aria-hidden="true">“Commit to</span></span>
        <span class="about-motto__line"><span>your commitment.”</span><span class="about-motto__ink" data-about-motto aria-hidden="true">your commitment.”</span></span>
      </h2>
      <p data-about-purpose-item>Our motto guides a straightforward goal: comfort and customer satisfaction through efficient equipment, quality workmanship and competitive pricing.</p>
      </div>
      <div class="about-purpose__cards about-columns">
        <div class="about-purpose-card about-purpose-card--vision" data-about-purpose-item>
          <img class="about-purpose-card__art about-purpose-card__art--vision" :src="$sitePath('/images/about/vision-ai-v2.webp')" width="640" height="462" alt="" aria-hidden="true" decoding="async">
          <h3>Our vision</h3>
          <p>Understand each client’s needs and deliver appropriate cooling and electrical solutions.</p>
        </div>
        <div class="about-purpose-card about-purpose-card--mission" data-about-purpose-item>
          <img class="about-purpose-card__art" :src="$sitePath('/images/about/mission-ai-v2.webp')" width="640" height="490" alt="" aria-hidden="true" decoding="async">
          <h3>Our mission</h3>
          <p>Reliable service, safe and environmentally responsible solutions, skilled people, and quality equipment from established partners.</p>
        </div>
      </div>
    </div>
    </section>

    <section class="about-standards about-columns company-width" aria-labelledby="standards-title">
      <div class="about-standards__title">
        <h2 id="standards-title">The way<br>we work.</h2>
        <img class="about-standards__art" :src="$sitePath('/images/about/tools-ai-v1.webp')" width="700" height="514" alt="" aria-hidden="true" decoding="async">
      </div>
      <div class="about-standards__copy">
        <div class="about-commitments">
          <h3>Our commitments</h3>
          <ul>
            <li data-about-commitment>Professional, disciplined teams and timely delivery.</li>
            <li data-about-commitment>Clean, safe sites and efficient working practices.</li>
            <li data-about-commitment>Honest advice, appropriate technology and fair pricing.</li>
            <li data-about-commitment>Accountability for meeting customer expectations.</li>
          </ul>
        </div>
        <div class="about-support">
          <h3>Support that stays with you</h3>
          <p>Our in-house and backup teams take a complete, customer-first approach, with credibility and occupational safety at its core.</p>
          <p>Maintenance contracts support warranties, system performance, energy management and regulatory compliance.</p>
        </div>
      </div>
    </section>

    <section class="about-brands-band" aria-labelledby="about-brands-title">
    <div class="about-brands service-brands company-width">
      <h2 id="about-brands-title">Supplying<br>and supporting.</h2>
      <ul aria-label="Air-conditioning brands we supply and support">
        <li v-for="brand in airConditioningBrandLogos" :key="brand.name">
          <div class="service-brand-mark" data-about-brand>
            <div class="service-brand-image"><img :src="$sitePath(brand.src)" :alt="brand.name" :width="brand.width" :height="brand.height" :class="`about-brand--${brand.treatment}`" loading="lazy" decoding="async"></div>
            <span class="about-brand-caption" aria-hidden="true">{{ brand.name }}</span>
          </div>
        </li>
      </ul>
    </div>
    </section>

    <CompanyEnquirySection class="about-enquiry" heading-id="about-enquiry-title" />
    </div>
  </CompanyPage>
</template>

<style scoped>
.about-page { --company-columns: minmax(0, .9fr) minmax(0, 1.1fr); --company-column-gap: clamp(40px, 7vw, 112px); --about-header-height: 64px; }
.about-columns { display: grid; grid-template-columns: var(--company-columns); gap: var(--company-column-gap); align-items: start; }
.about-columns > * { min-width: 0; }
.about-intro { min-height: calc(100svh - var(--about-header-height)); align-items: start; align-content: center; padding-block: clamp(32px, 6svh, 64px); animation: none; }
.about-intro h1 { font-size: clamp(48px, 5.2vw, 76px); }
.about-title-line { display: block; white-space: nowrap; }
.about-title-line .about-year { display: inline; color: #94d1a5; }
.about-intro__copy p:first-child { margin-top: 0; }
.about-intro__copy .company-link { margin-top: 24px; }
.about-intro__art { width: min(300px, 64%); height: auto; margin-top: clamp(22px, 4svh, 40px); }
.about-purpose-band { background: #d1e4d7; color: #0b3022; --company-muted: #365b46; --company-line: #365b4640; }
.about-purpose { padding-block: clamp(48px, 7svh, 80px); }
.about-purpose h2 { margin: 0; font-size: clamp(38px, 4vw, 60px); }
.about-purpose__heading { align-items: center; }
.about-purpose__cards { margin-top: 40px; align-items: stretch; }
.about-motto__line { position: relative; display: block; color: #4a6755; }
.about-motto__ink { position: absolute; inset: 0; color: #0b3022; }
.about-purpose p, .about-standards p { margin: 0; max-width: 60ch; color: var(--company-muted); }
.about-purpose h3, .about-standards h3 { font-size: 20px; font-weight: 600; margin: 0 0 12px; }
.about-purpose-card { padding: clamp(24px, 2.4vw, 36px); }
.about-purpose-card__art { --about-art-size: clamp(150px, 13vw, 190px); width: var(--about-art-size); max-width: 52%; height: var(--about-art-size); object-fit: contain; object-position: right bottom; margin: -20px -12px -8px auto; }
.about-purpose-card__art--vision { filter: brightness(0) opacity(.68); }
.about-purpose-card--vision { background: var(--mist); }
.about-purpose-card--mission { background: #16513a; color: var(--paper); --company-muted: #d1e4d7; }
.about-standards { padding-block: clamp(56px, 7vw, 100px); }
.about-standards__art { width: min(270px, 74%); height: auto; margin-top: clamp(24px, 5svh, 48px); }
.about-standards h3 { margin-top: 0; }
.about-standards ul { margin: 0; padding: 0; list-style: none; color: var(--company-muted); line-height: 1.7; }
.about-standards li { padding-block: 18px; border-bottom: 1px solid var(--company-line); }
.about-standards li:first-child { padding-top: 8px; }
.about-support { margin-top: 44px; }
.about-standards p + p { margin-top: 20px; }
.about-brands-band { background: #16513a; --company-muted: #d1e4d7; }
.about-brands { padding: clamp(56px, 7vw, 100px) 0; background: transparent; }
.about-brands .service-brand-mark { transform-origin: center bottom; }
.about-brands li::after { background: var(--company-line); }
.about-brand--solid { filter: brightness(0) invert(1); }
.about-brand--reverse { filter: grayscale(1) invert(1) brightness(1.4); }
.about-brand-caption { color: var(--company-muted); font-size: 12px; }
[data-about-pinned] { min-height: 100svh; align-content: center; }
.about-purpose-band[data-about-pinned], .about-brands-band[data-about-pinned] { display: flex; align-items: center; }
@media (max-width: 850px) {
  .about-page { --company-columns: minmax(0, 1fr); --company-content-width: 680px; }
  .about-intro { align-content: center; gap: 28px; }
  .about-intro__copy p { max-width: 64ch; }
  .about-intro__art { width: 200px; margin-top: 18px; }
  .about-purpose h2 { margin: 0; }
  .about-purpose__heading { gap: 24px; }
  .about-purpose__cards { margin-top: 28px; gap: 16px; }
  .about-standards__art { width: 170px; margin-top: 16px; }
}
@media (max-width: 380px) {
  .about-intro h1 { font-size: clamp(36px, 11vw, 48px); }
}
</style>
