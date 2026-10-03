<script setup lang="ts">
import { getCommercialService } from '~/data/commercial-view'

const route = useRoute()
const service = getCommercialService(String(route.params.slug))
if (!service) throw createError({ statusCode: 404, statusMessage: 'Commercial service not found' })

const siteUrl = useRuntimeConfig().public.siteUrl.replace(/\/?$/, '/')
const canonical = new URL(`commercial/services/${service.slug}`, siteUrl).href
useHead({
  title: `${service.title} | Commercial services | Setia Air-Cond`,
  htmlAttrs: { 'data-theme': 'service' },
  link: [{ rel: 'canonical', href: canonical }],
  meta: [{ name: 'description', content: `${service.explanation} Talk to Setia Air-Cond about your commercial site.` }],
})

</script>

<template>
  <CommercialDetailLayout class="equipment-detail-page" scroll-reveals>
    <CommercialEquipmentHero :service="service" />
    <CommercialServiceEditorial :service="service" />
    <CompanyEnquirySection heading-id="service-contact-heading" :heading-lines="['Tell us what your', 'building needs.']" quote-to="/get-a-quote?property=commercial" />
  </CommercialDetailLayout>
</template>

<style scoped>
.equipment-detail-page { background: #062319; }
.equipment-detail-page :deep(.commercial-detail__header) { background: #062319; }
.equipment-detail-page :deep(.commercial-detail__header-inner) { width: min(100% - 2 * clamp(24px, 5.5vw, 80px), 1680px); min-height: clamp(48px, 5vw, 72px); }
</style>
