<script setup lang="ts">
import { absoluteSiteUrl } from '~/data/site-routes'
import { businessSchema, jsonLdScript } from '~/utils/structured-data'

const { $sitePath } = useNuxtApp()
const route = useRoute()
const siteUrl = useRuntimeConfig().public.siteUrl.replace(/\/?$/, '/')
const socialImage = new URL('images/social/setia-aircond-og-v2.png', siteUrl).href
const socialTitle = 'Setia | Air-conditioning & Electrical Since 1990'
const socialDescription = 'Air-conditioning and electrical systems for residential and commercial spaces. Supplied, installed and maintained by Setia since 1990.'
const pageUrl = () => absoluteSiteUrl(siteUrl, route.path)
const socialImageAlt = 'SETIA Air-Cond. Better cooling. Since 1990. A close-up of an ivory air conditioner with sculpted airflow on deep green.'

useSeoMeta({
  ogType: 'website',
  ogSiteName: 'Setia Air-Cond',
  ogTitle: socialTitle,
  ogDescription: socialDescription,
  ogUrl: pageUrl,
  ogImage: socialImage,
  ogImageSecureUrl: socialImage,
  ogImageType: 'image/png',
  ogImageWidth: 1734,
  ogImageHeight: 907,
  ogImageAlt: socialImageAlt,
  twitterCard: 'summary_large_image',
  twitterTitle: socialTitle,
  twitterDescription: socialDescription,
  twitterImage: socialImage,
  twitterImageAlt: socialImageAlt,
})
useHead({
  // One canonical per page, in the trailing-slash form the static host serves.
  link: () => [{ rel: 'canonical', href: pageUrl() }],
  script: [{ key: 'business-schema', ...jsonLdScript([businessSchema(siteUrl)]) }],
})
useHead({
  link: [{ rel: 'preload', href: $sitePath('/fonts/hanken-grotesk-variable.ttf'), as: 'font', type: 'font/ttf', crossorigin: '' }],
  noscript: [{ innerHTML: '<style>@media(min-width:1024px){.floating-contact{display:flex!important}}</style>' }],
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <SitePageTransition>
    <NuxtPage />
  </SitePageTransition>
  <FloatingContact v-if="route.path.replace(/\/$/, '') !== '/get-a-quote'" />
</template>
