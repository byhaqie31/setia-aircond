<script setup lang="ts">
import { residentialBrandLogos, airConditioningEnquiry, airConditioningServices } from '~/data/air-conditioning'

const props = defineProps<{ arriving?: boolean }>()

const services = [
  ...airConditioningServices,
  { id: 'home-electrical', number: '06', title: 'Home electrical services', description: 'Wiring, lighting and electrical support for a comfortable, connected home.' },
]
const root = useTemplateRef<HTMLElement>('root')
const heading = useTemplateRef<HTMLElement>('heading')
let observer: IntersectionObserver | undefined

onMounted(() => {
  if (props.arriving) requestAnimationFrame(() => heading.value?.focus({ preventScroll: true }))
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('is-visible')
      observer?.unobserve(entry.target)
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 })
  root.value?.classList.add('has-reveals')
  root.value?.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => observer?.observe(element))
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <main ref="root" class="residential-view" :class="{ 'is-arriving': arriving }">
    <a class="skip-link" href="#residential-services">Skip to residential services</a>

    <section class="residential-view__hero" aria-labelledby="residential-title">
      <picture class="residential-view__room">
        <source media="(max-width: 680px)" :srcset="$sitePath('/images/residential/room-hero-mobile-v1.webp')">
        <img :src="$sitePath('/images/residential/room-hero-v1.webp')" width="1672" height="940" alt="A warmly lit living room with a wall-mounted air conditioner and a recessed ceiling cassette above the sofa." fetchpriority="high" decoding="async">
      </picture>
      <div class="residential-view__room-shade" aria-hidden="true" />

      <header class="residential-view__header service-header">
        <NuxtLink class="residential-view__brand service-brand" to="/" aria-label="Setia Air-Cond and Electrical home"><SetiaWordmark /></NuxtLink>
        <NuxtLink class="residential-view__quote service-quote" :to="airConditioningEnquiry">Get a quote<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
      </header>

      <div class="residential-view__hero-copy">
        <h1 id="residential-title" ref="heading" tabindex="-1">Your Home Is<br>Our Responsibility</h1>
      </div>

      <div id="residential-services" class="residential-view__services" aria-labelledby="residential-services-heading">
        <h2 id="residential-services-heading" class="sr-only">Residential services</h2>
        <ol class="residential-view__service-list">
          <li v-for="service in services" :id="service.id" :key="service.id" class="residential-view__service">
            <span class="residential-view__service-number">{{ service.number }}</span>
            <h3>{{ service.title }}</h3>
            <p class="sr-only">{{ service.description }}</p>
          </li>
        </ol>
      </div>
      <a class="residential-view__next" href="#residential-brands">Scroll to explore<span class="residential-view__next-line" aria-hidden="true"><i /></span></a>
    </section>

    <!-- The brand strip is the shared service-brands design from Commercial and About; only the list is residential. -->
    <section id="residential-brands" class="residential-view__brands service-brands" aria-labelledby="residential-brands-heading">
      <div class="residential-view__brands-heading" data-reveal>
        <h2 id="residential-brands-heading">Supplying and supporting.</h2>
        <p>Air-conditioning brands we work with.</p>
      </div>
      <ul aria-label="Air-conditioning brands we supply and support">
        <li v-for="(brand, index) in residentialBrandLogos" :key="brand.name" data-reveal :style="{ '--brand-delay': `${index * 110}ms` }">
          <div class="service-brand-mark" data-brand-word>
            <div class="service-brand-image"><img :src="$sitePath(brand.src)" :alt="brand.name" :width="brand.width" :height="brand.height" :class="`service-brand-image--${brand.treatment}`" loading="lazy" decoding="async"></div>
            <span class="service-brand-caption" aria-hidden="true">{{ brand.name }}</span>
          </div>
        </li>
      </ul>
      <p class="residential-view__brands-more" data-reveal>and many more</p>
    </section>

    <div class="residential-view__ending">
      <CompanyEnquirySection
        heading-id="residential-contact-heading"
        :heading-lines="['Ready for', 'better cooling?']"
        description="Tell us about your space. Let’s plan the right system for you."
        :quote-to="airConditioningEnquiry"
      />
      <CompanyFooter />
    </div>
  </main>
</template>

<style scoped>
.residential-view { color: var(--paper); background: #0b3022; }
.residential-view :is(a, button):focus-visible { outline: 2px solid #d1e4d7; outline-offset: 5px; }
.residential-view__hero { position: relative; isolation: isolate; min-height: 100svh; overflow: clip; background: #191b17; }
.residential-view__room, .residential-view__room img, .residential-view__room-shade { position: absolute; inset: 0; width: 100%; height: 100%; }
.residential-view__room img { object-fit: cover; object-position: center; }
.residential-view__room-shade { background: linear-gradient(90deg, #07180fc4 0%, #07180f10 49%, transparent 100%), linear-gradient(0deg, #061b12d6 0%, #061b1240 26%, transparent 58%), linear-gradient(180deg, #051b1399 0%, transparent 22%); }
.residential-view__header { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: clamp(18px, 2.4svh, 32px) var(--page-gutter); }
.residential-view__brand { display: inline-flex; align-items: center; font-size: clamp(30px, 2.6vw, 42px); }
.residential-view__quote { white-space: nowrap; }
.residential-view__hero-copy { position: absolute; z-index: 2; left: var(--page-gutter); bottom: clamp(180px, 22svh, 245px); max-width: min(560px, 60vw); }
.residential-view__hero h1 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(54px, 6vw, 94px); font-weight: 400; line-height: .98; letter-spacing: -.038em; text-wrap: balance; }
.residential-view.is-arriving .residential-view__header, .residential-view.is-arriving .residential-view__hero-copy, .residential-view.is-arriving .residential-view__services { animation: residential-room-arrive .6s cubic-bezier(.22, 1, .36, 1) both; }
.residential-view.is-arriving .residential-view__hero-copy { animation-delay: .12s; }
.residential-view.is-arriving .residential-view__services { animation-delay: .22s; }
.residential-view.is-arriving .residential-view__next { animation: residential-next-arrive .6s ease .22s both; }
@keyframes residential-room-arrive { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes residential-next-arrive { from { opacity: 0; } to { opacity: 1; } }

.residential-view__services { position: absolute; z-index: 2; inset: auto 0 0; padding: 24px max(var(--page-gutter), 350px) 76px var(--page-gutter); background: linear-gradient(0deg, #061b12f8 0%, #06261bfa 72%, #06261bc4 100%); }
.residential-view__services::before { position: absolute; inset: -32px 0 auto; height: 32px; background: linear-gradient(to bottom, transparent, #06261bc4); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); pointer-events: none; content: ''; }
.residential-view__service-list { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); width: 100%; padding: 0; margin: 0; list-style: none; }
.residential-view__service { min-width: 0; min-height: 79px; padding: 4px 14px 0; border-left: 1px solid #bed0c342; }
.residential-view__service:first-child { padding-left: 0; border-left: 0; }
.residential-view__service-number { display: block; margin-bottom: 8px; color: #a8c7b1; font-size: 12px; font-variant-numeric: tabular-nums; }
.residential-view__service h3 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(15px, 1.25vw, 19px); font-weight: 400; line-height: 1.2; text-wrap: balance; }
.residential-view__next { position: absolute; z-index: 3; left: 50%; bottom: max(14px, 2svh); display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 140px; min-height: 52px; padding: 6px 12px; color: #e4f0e6; font-size: 13px; text-decoration: none; transform: translateX(-50%); }
.residential-view__next-line { position: relative; width: 1px; height: 22px; background: #c2d9c8a6; }
.residential-view__next-line i { position: absolute; left: -2px; top: -2px; width: 5px; height: 5px; border-radius: 50%; background: #d5e8d9; animation: residential-scroll-dot 2.2s cubic-bezier(.45, 0, .55, 1) infinite; }
@keyframes residential-scroll-dot { 0%, 12% { transform: translateY(0); opacity: 0; } 20% { transform: translateY(0); opacity: 1; } 82% { transform: translateY(22px); opacity: 1; } 96%, 100% { transform: translateY(22px); opacity: 0; } }
.residential-view__next:hover { color: #a0ebbb; }
/* The heading keeps its own block; the strip below takes the shared service-brands rules with the dark-ground treatments Commercial and About use. */
.residential-view__brands h2 { margin: 0; text-wrap: balance; }
.residential-view__brands-heading p { max-width: 38ch; margin: 0; color: #bed0c3; font-size: 17px; line-height: 1.65; }
.residential-view__brands { padding: clamp(96px, 10vw, 150px) var(--page-gutter) clamp(110px, 11vw, 170px); background: #08271b; }
.residential-view__brands-heading { width: min(100%, 1240px); margin: 0 auto 72px; text-align: center; }
.residential-view__brands-heading p { margin: 18px auto 0; }
.residential-view__brands ul { width: min(100%, 1240px); margin: 0 auto; }
.residential-view__brands li::after { background: #bed0c34d; }
.residential-view__brands .service-brand-caption { color: #bed0c3; }
.residential-view__brands .service-brand-image--light { filter: none; }
.residential-view__brands .service-brand-image--solid { filter: brightness(0) invert(1); }
.residential-view__brands .service-brand-image--reverse { filter: grayscale(1) invert(1) brightness(1.4); }
.residential-view__brands-more { margin: 24px 0 0; color: #bed0c3; font-size: 14px; line-height: 1.5; text-align: center; }
.residential-view__ending { display: flex; flex-direction: column; min-height: 100svh; background: #0b3022; }
/* The enquiry section and footer use their shared layout, as on About Us and Commercial. */
.residential-view__ending :deep(.company-enquiry) { flex: 1; }

@media (prefers-reduced-motion: no-preference) {
  .residential-view.has-reveals .residential-view__brands-heading[data-reveal] { transition: opacity .65s cubic-bezier(.22, 1, .36, 1), transform .65s cubic-bezier(.22, 1, .36, 1); }
  .residential-view.has-reveals .residential-view__brands-heading[data-reveal]:not(.is-visible) { opacity: .58; transform: translateY(18px); }
  /* Each mark folds up as Commercial's do and its rule draws from the left, staggered along the row. */
  .residential-view.has-reveals .residential-view__brands li [data-brand-word] { transform-origin: 50% 100%; transition: opacity .7s cubic-bezier(.22, 1, .36, 1) var(--brand-delay, 0ms), transform .7s cubic-bezier(.22, 1, .36, 1) var(--brand-delay, 0ms); }
  .residential-view.has-reveals .residential-view__brands li::after { transition: transform .7s cubic-bezier(.22, 1, .36, 1) var(--brand-delay, 0ms); }
  .residential-view.has-reveals .residential-view__brands li:not(.is-visible) [data-brand-word] { opacity: 0; transform: translate3d(0, 115%, 0) rotateX(65deg); }
  .residential-view.has-reveals .residential-view__brands li:not(.is-visible)::after { transform: scaleX(0); }
  .residential-view.has-reveals .residential-view__brands-more[data-reveal] { transition: opacity .6s ease .25s, transform .6s cubic-bezier(.22, 1, .36, 1) .25s; }
  .residential-view.has-reveals .residential-view__brands-more[data-reveal]:not(.is-visible) { opacity: 0; transform: translateY(14px); }
}
@media (max-width: 900px) {
  .residential-view__brands-heading { margin-bottom: 48px; }
}
@media (min-width: 1101px) {
  .residential-view__hero-copy { bottom: clamp(236px, 28svh, 300px); }
  .residential-view__services { padding-right: var(--page-gutter); padding-bottom: 124px; }
}
@media (min-width: 681px) and (max-width: 1100px) {
  .residential-view__hero { min-height: max(100svh, 950px); }
  .residential-view__hero-copy { bottom: 275px; }
  .residential-view__service-list { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .residential-view__service:nth-child(n + 4) { padding-top: 12px; border-top: 1px solid #bed0c342; }
}
@media (max-width: 680px) {
  .residential-view__hero { display: flex; flex-direction: column; min-height: max(100svh, 820px); }
  .residential-view__room img { object-position: center; }
  .residential-view__room-shade { background: linear-gradient(0deg, #061b12e0 0%, #061b126e 32%, transparent 66%), linear-gradient(180deg, #051b13c2 0%, transparent 25%); }
  .residential-view__header { padding: 16px var(--page-gutter); gap: 12px; }
  .residential-view__brand { font-size: clamp(20px, 5.4vw, 28px); }
  .residential-view__quote { font-size: 12px; }
  /* Stack the copy above the services instead of pinning it, so it sits centred and clear of the panel. */
  .residential-view__hero-copy { position: relative; inset: auto; margin: auto var(--page-gutter) 36px; max-width: none; text-align: center; }
  .residential-view__hero h1 { font-size: clamp(43px, 10vw, 62px); }
  .residential-view__services { position: relative; inset: auto; padding: 17px var(--page-gutter) 71px; }
  .residential-view__service-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .residential-view__service { min-height: 66px; padding: 8px 10px 4px; }
  .residential-view__service:nth-child(2n + 1) { padding-left: 0; border-left: 0; }
  .residential-view__service:nth-child(n + 3) { border-top: 1px solid #bed0c342; }
  .residential-view__service-number { margin-bottom: 4px; font-size: 10px; }
  .residential-view__service h3 { font-size: clamp(13px, 3.3vw, 16px); }
  .residential-view__next { bottom: max(11px, env(safe-area-inset-bottom)); }
  .residential-view__brands { padding-block: 90px 110px; }
}
@media (max-height: 620px) and (min-aspect-ratio: 3/2) {
  .residential-view__hero-copy { bottom: 205px; }
  .residential-view__hero h1 { font-size: clamp(38px, 6vw, 62px); }
  .residential-view__service { min-height: 60px; }
}
@media (prefers-reduced-motion: reduce) {
  .residential-view.is-arriving .residential-view__header, .residential-view.is-arriving .residential-view__hero-copy, .residential-view.is-arriving .residential-view__services, .residential-view.is-arriving .residential-view__next { animation: none; }
  .residential-view__next-line i { animation: none; transform: translateY(11px); opacity: .65; }
}
</style>
