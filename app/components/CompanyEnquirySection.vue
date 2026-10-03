<script setup lang="ts">
withDefaults(defineProps<{
  headingId?: string
  headingLines?: string[]
  quoteTo?: string
  description?: string
  showQuote?: boolean
  animated?: boolean
  detailsHidden?: boolean
  viewport?: boolean
}>(), {
  headingId: 'company-enquiry-title',
  headingLines: () => ['Let’s talk about', 'your space.'],
  quoteTo: '/get-a-quote',
  showQuote: true,
  animated: false,
  detailsHidden: false,
  viewport: false,
})
</script>

<template>
  <section id="company-contact" class="company-enquiry" :class="{ 'company-enquiry--viewport': viewport, 'company-enquiry--animated': animated }" :aria-labelledby="headingId" tabindex="-1">
    <div class="company-enquiry__hero">
      <div class="company-enquiry__copy">
        <h2 :id="headingId"><template v-for="(line, index) in headingLines" :key="line">{{ line }}<br v-if="index < headingLines.length - 1"></template></h2>
        <p v-if="description" class="company-enquiry__description" :inert="detailsHidden" :aria-hidden="detailsHidden || undefined">{{ description }}</p>
        <NuxtLink v-if="showQuote" class="service-enquiry" :to="quoteTo" :inert="detailsHidden" :aria-hidden="detailsHidden || undefined">Get a quote<span class="service-enquiry__arrow"><span class="icon icon--arrow" aria-hidden="true" /></span></NuxtLink>
      </div>
      <div class="company-enquiry__team" aria-hidden="true">
        <img :src="$sitePath('/images/residential/technician-team-v1.webp')" width="1200" height="800" alt="" loading="lazy" decoding="async">
      </div>
    </div>
    <CompanyContactDetails compact :inert="detailsHidden" :aria-hidden="detailsHidden || undefined" />
  </section>
</template>

<style scoped>
.company-enquiry { --company-content-width: 1240px; --company-columns: minmax(0, .9fr) minmax(0, 1.1fr); --company-column-gap: clamp(40px, 7vw, 112px); --company-muted: #bed0c3; --company-line: #bed0c34d; display: flex; flex-direction: column; justify-content: center; gap: 24px; width: min(100% - var(--page-gutter) * 2, var(--company-content-width)); margin-inline: auto; padding-block: clamp(32px, 5svh, 48px); color: var(--paper); }
.company-enquiry:focus { outline: none; }
.company-enquiry__hero { display: grid; grid-template-columns: var(--company-columns); gap: var(--company-column-gap); align-items: center; }
.company-enquiry__hero > * { min-width: 0; }
.company-enquiry h2 { margin: 0 0 24px; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(36px, 4vw, 60px); font-weight: 400; line-height: 1.04; letter-spacing: -.035em; text-wrap: balance; }
.company-enquiry .service-enquiry { color: var(--paper); }
.company-enquiry__description { max-width: 40ch; margin: 0 0 24px; color: var(--company-muted); font-size: 15px; line-height: 1.6; }
.company-enquiry__team { width: 100%; max-width: 460px; justify-self: center; margin: 0; mask-image: linear-gradient(#000 75%, transparent 100%); transform-origin: center bottom; }
.company-enquiry__team img { width: 100%; height: auto; }
.company-enquiry :deep(.company-link) { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; text-decoration: underline; text-decoration-color: #bed0c380; text-underline-offset: 5px; }
.company-enquiry :deep(.company-link .icon) { width: 18px; height: 18px; }
.company-enquiry :deep(.company-link:hover) { text-decoration-color: currentColor; }
.company-enquiry--animated h2 { opacity: var(--contact-title, 1); clip-path: inset(0 0 calc((1 - var(--contact-title, 1)) * 100%) 0); transform: translate3d(0, calc((1 - var(--contact-title, 1)) * 30px), 0); }
.company-enquiry--animated .company-enquiry__team { opacity: var(--contact-team, 1); transform: translate3d(0, calc((1 - var(--contact-team, 1)) * 70px), 0) scale(calc(.94 + var(--contact-team, 1) * .06)); }
.company-enquiry--animated :is(.company-enquiry__description, .service-enquiry), .company-enquiry--animated :deep(.company-contact) { opacity: var(--contact-details, 1); transform: translate3d(0, calc((1 - var(--contact-details, 1)) * 18px), 0); }
/* Match About's centered desktop chapter; shorter views keep natural flow. */
@media (min-width: 1000px) and (min-height: 760px) and (prefers-reduced-motion: no-preference) {
  .company-enquiry--viewport { min-height: 100svh; }
}
@media (max-width: 850px) {
  .company-enquiry { --company-columns: minmax(0, 1fr); --company-content-width: 680px; }
  .company-enquiry__hero { gap: 20px; }
  .company-enquiry__team { max-width: 380px; }
}
</style>
