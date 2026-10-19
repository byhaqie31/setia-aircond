<script setup lang="ts">
import { absoluteSiteUrl } from '~/data/site-routes'
import { businessSchema, jsonLdScript } from '~/utils/structured-data'

const { $sitePath } = useNuxtApp()
const route = useRoute()
const siteUrl = useRuntimeConfig().public.siteUrl.replace(/\/?$/, '/')
const socialImage = new URL('images/social/setia-aircond-og-v3.jpg', siteUrl).href
// Link previews take the home page's opening screen: its headline, description and a capture of it.
const socialTitle = 'Setia Air-Cond | Every building has a pulse. We keep it cool.'
const socialDescription = 'Air-conditioning and electrical systems for commercial and residential spaces across Kuala Lumpur and Selangor supplied, installed and maintained since 1990.'
const pageUrl = () => absoluteSiteUrl(siteUrl, route.path)
const socialImageAlt = 'Setia Air-Cond home page: Every building has a pulse. We keep it cool. Beside it, a cutaway building with residential and commercial floors and the Kuala Lumpur skyline at night.'

useSeoMeta({
  ogType: 'website',
  ogSiteName: 'Setia Air-Cond',
  ogTitle: socialTitle,
  ogDescription: socialDescription,
  ogUrl: pageUrl,
  ogImage: socialImage,
  ogImageSecureUrl: socialImage,
  ogImageType: 'image/jpeg',
  ogImageWidth: 1200,
  ogImageHeight: 628,
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
