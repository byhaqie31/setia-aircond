<script setup lang="ts">
import { acServicesPage } from '~/data/ac-services'
import { jsonLdScript, servicesPageSchema } from '~/utils/structured-data'

const route = useRoute()
const siteUrl = useRuntimeConfig().public.siteUrl
useHead({
  htmlAttrs: { 'data-theme': 'service' },
  title: `${acServicesPage.metaTitle} | Setia Air-Cond`,
  meta: [{ name: 'description', content: acServicesPage.description }],
  script: [{ key: 'services-schema', ...jsonLdScript(servicesPageSchema(siteUrl, acServicesPage, route.path)) }],
})
useSeoMeta({
  ogTitle: acServicesPage.title,
  ogDescription: acServicesPage.description,
  twitterTitle: acServicesPage.title,
  twitterDescription: acServicesPage.description,
})
</script>

<template>
  <CompanyPage current="about" class="services-page">
    <section class="company-intro company-width services-intro" aria-labelledby="services-title">
      <div>
        <NuxtLink class="company-link services-intro__back" to="/about-us#services"><span class="icon icon--arrow" aria-hidden="true" />About us</NuxtLink>
        <h1 id="services-title">{{ acServicesPage.title }}</h1>
      </div>
      <img class="services-intro__art" :src="$sitePath('/images/about/tools-ai-v1.webp')" width="700" height="514" alt="" aria-hidden="true" decoding="async">
    </section>

    <ArticleBody :intro="acServicesPage.intro" :sections="acServicesPage.sections" />

    <CompanyEnquirySection heading-id="services-enquiry-title" />
  </CompanyPage>
</template>

<style scoped>
.services-intro { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, .75fr); gap: clamp(32px, 6vw, 96px); align-items: center; }
.services-intro__back { margin-bottom: 28px; color: var(--company-muted); font-size: 14px; }
.services-intro__back .icon { transform: scaleX(-1); }
.services-intro__art { justify-self: center; width: min(340px, 100%); height: auto; }
@media (max-width: 850px) {
  .services-intro { grid-template-columns: minmax(0, 1fr); }
  .services-intro__art { justify-self: start; width: 200px; }
}
</style>
