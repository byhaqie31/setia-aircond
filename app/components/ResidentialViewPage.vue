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

    <section id="residential-brands" class="residential-view__brands" aria-labelledby="residential-brands-heading">
      <div class="residential-view__brands-heading" data-reveal>
        <h2 id="residential-brands-heading">Supplying and supporting.</h2>
        <p>Air-conditioning brands we work with.</p>
      </div>
      <ul class="residential-view__brand-list" aria-label="Air-conditioning brands we supply and support">
        <li v-for="(brand, index) in residentialBrandLogos" :key="brand.name" data-reveal :style="{ '--brand-delay': `${index * 130}ms` }">
          <img :src="$sitePath(brand.src)" :alt="brand.name" :width="brand.width" :height="brand.height" :class="{ 'residential-view__brand-image--carrier': brand.name === 'Carrier' }" loading="lazy" decoding="async">
        </li>
      </ul>
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
.residential-view__brands h2 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(42px, 5vw, 74px); font-weight: 400; line-height: 1.05; letter-spacing: -.035em; text-wrap: balance; }
.residential-view__brands-heading p { max-width: 38ch; margin: 0; color: #bed0c3; font-size: 17px; line-height: 1.65; }
.residential-view__brands { padding: clamp(96px, 10vw, 150px) var(--page-gutter) clamp(110px, 11vw, 170px); background: #08271b; }
.residential-view__brands-heading { width: min(100%, 1240px); margin: 0 auto 72px; text-align: center; }
.residential-view__brands-heading p { margin: 18px auto 0; }
.residential-view__brand-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); width: min(100%, 1240px); padding: 0; margin: auto; list-style: none; }
.residential-view__brand-list li { display: flex; align-items: center; justify-content: center; min-height: 160px; padding: 30px; border-top: 1px solid #bed0c333; }
.residential-view__brand-list li:nth-child(4n + 1) { border-left: 1px solid #bed0c333; }
.residential-view__brand-list li { border-right: 1px solid #bed0c333; }
.residential-view__brand-list li:nth-last-child(-n + 4) { border-bottom: 1px solid #bed0c333; }
.residential-view__brand-list img { width: auto; height: auto; max-width: min(85%, 190px); max-height: 70px; object-fit: contain; filter: grayscale(1) brightness(0) invert(1); }
.residential-view__brand-list .residential-view__brand-image--carrier { filter: grayscale(1) brightness(1.15); }
.residential-view__brand-list img[alt='Midea'] { width: 180px; }
.residential-view__ending { display: flex; flex-direction: column; min-height: 100svh; background: #0b3022; }
.residential-view__ending :deep(.company-enquiry) { flex: 1; padding-block: clamp(22px, 3svh, 38px); gap: 18px; }
.residential-view__ending :deep(.company-enquiry__team) { max-width: 400px; }
.residential-view__ending :deep(.company-contact--compact) { padding-top: 18px; }
.residential-view__ending :deep(.company-footer) { padding-bottom: clamp(18px, 3svh, 32px); }

@media (prefers-reduced-motion: no-preference) {
  .residential-view.has-reveals .residential-view__brands-heading[data-reveal] { transition: opacity .65s cubic-bezier(.22, 1, .36, 1), transform .65s cubic-bezier(.22, 1, .36, 1); }
  .residential-view.has-reveals .residential-view__brands-heading[data-reveal]:not(.is-visible) { opacity: .58; transform: translateY(18px); }
  .residential-view.has-reveals .residential-view__brand-list li:not(.is-visible) { opacity: 0; transform: translateY(24px); transition: none; }
  .residential-view.has-reveals .residential-view__brand-list li.is-visible { opacity: 1; transform: translateY(0); transition: opacity .65s cubic-bezier(.22, 1, .36, 1) var(--brand-delay, 0ms), transform .65s cubic-bezier(.22, 1, .36, 1) var(--brand-delay, 0ms); }
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
  .residential-view__brand-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .residential-view__brand-list li { min-height: 128px; padding: 22px 14px; }
  .residential-view__brand-list li:nth-child(4n + 1) { border-left: 0; }
  .residential-view__brand-list li:nth-child(2n + 1) { border-left: 1px solid #bed0c333; }
  .residential-view__brand-list li:nth-last-child(-n + 4) { border-bottom: 0; }
  .residential-view__brand-list li:nth-last-child(-n + 2) { border-bottom: 1px solid #bed0c333; }
  .residential-view__brand-list img { max-width: min(82%, 150px); max-height: 58px; }
  .residential-view__ending :deep(.company-enquiry) { gap: 12px; padding-block: 22px; }
  .residential-view__ending :deep(.company-enquiry__hero) { grid-template-columns: minmax(0, 1fr) minmax(82px, .4fr); gap: 12px; }
  .residential-view__ending :deep(.company-enquiry__team) { width: 100%; max-width: 180px; align-self: end; }
  .residential-view__ending :deep(.company-enquiry h2) { margin-bottom: 12px; font-size: clamp(29px, 7.5vw, 38px); }
  .residential-view__ending :deep(.company-enquiry__description) { margin-bottom: 12px; font-size: 14px; }
  .residential-view__ending :deep(.company-contact--compact) { grid-template-columns: minmax(0, .88fr) minmax(0, 1.12fr); gap: 12px; padding-top: 14px; }
  .residential-view__ending :deep(.company-contact--compact .company-contact__intro p) { font-size: 13px; line-height: 1.4; }
  .residential-view__ending :deep(.company-contact__office) { margin-top: 8px; font-size: 13px; line-height: 1.4; }
  .residential-view__ending :deep(.company-contact--compact .company-contact__details) { grid-template-columns: 1fr; gap: 6px; }
  .residential-view__ending :deep(.company-contact--compact dt) { margin-bottom: 1px; font-size: 11px; }
  .residential-view__ending :deep(.company-contact--compact dd) { font-size: 13px; line-height: 1.3; }
  .residential-view__ending :deep(.company-footer) { padding-block: 10px 18px; }
}
@media (min-width: 681px) and (max-width: 850px) {
  .residential-view__ending :deep(.company-enquiry) { gap: 12px; padding-block: 18px; }
  .residential-view__ending :deep(.company-enquiry__hero) { grid-template-columns: minmax(0, 1fr) minmax(160px, .6fr); gap: 20px; }
  .residential-view__ending :deep(.company-enquiry__team) { max-width: 220px; }
  .residential-view__ending :deep(.company-enquiry h2) { margin-bottom: 12px; font-size: clamp(34px, 4.4vw, 40px); }
  .residential-view__ending :deep(.company-enquiry__description) { margin-bottom: 12px; font-size: 14px; }
  .residential-view__ending :deep(.company-contact--compact) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; padding-top: 14px; }
  .residential-view__ending :deep(.company-contact--compact .company-contact__details) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 12px; }
  .residential-view__ending :deep(.company-contact__details > div:nth-child(n + 3)) { grid-column: 1 / -1; }
  .residential-view__ending :deep(.company-contact--compact .company-contact__intro p) { font-size: 14px; }
  .residential-view__ending :deep(.company-contact__office) { margin-top: 10px; font-size: 14px; }
  .residential-view__ending :deep(.company-contact--compact dt) { margin-bottom: 1px; font-size: 11px; }
  .residential-view__ending :deep(.company-contact--compact dd) { font-size: 13px; line-height: 1.3; }
  .residential-view__ending :deep(.company-footer) { padding-block: 8px 16px; }
}
@media (max-height: 620px) and (min-aspect-ratio: 3/2) {
  .residential-view__hero-copy { bottom: 205px; }
  .residential-view__hero h1 { font-size: clamp(38px, 6vw, 62px); }
  .residential-view__service { min-height: 60px; }
}
@media (max-width: 680px) and (max-height: 700px) {
  .residential-view__ending :deep(.company-enquiry) { gap: 8px; padding-block: 12px; }
  .residential-view__ending :deep(.company-enquiry__hero) { grid-template-columns: 1fr; }
  .residential-view__ending :deep(.company-enquiry__team) { display: none; }
  .residential-view__ending :deep(.company-enquiry h2) { margin-bottom: 8px; }
  .residential-view__ending :deep(.company-enquiry__description) { margin-bottom: 8px; }
  .residential-view__ending :deep(.company-contact--compact) { gap: 8px; padding-top: 10px; }
  .residential-view__ending :deep(.company-footer) { padding-block: 8px; }
}
@media (max-width: 360px) {
  .residential-view__ending :deep(.company-contact--compact) { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .residential-view.is-arriving .residential-view__header, .residential-view.is-arriving .residential-view__hero-copy, .residential-view.is-arriving .residential-view__services, .residential-view.is-arriving .residential-view__next { animation: none; }
  .residential-view__next-line i { animation: none; transform: translateY(11px); opacity: .65; }
}
</style>
