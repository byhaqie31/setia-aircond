<script setup lang="ts">
import { getCommercialParty, getCommercialPartyRecords } from '~/data/commercial-view'
import { computed, onMounted, ref } from 'vue'
const route = useRoute()
const router = useRouter()
const party = getCommercialParty(String(route.params.slug))
if (!party) throw createError({ statusCode: 404, statusMessage: 'Commercial client not found' })
const records = getCommercialPartyRecords(party.id)
// Prerendered HTML has no query. Read the live return context after hydration.
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const fromProjects = computed(() => mounted.value && router.currentRoute.value.query.from === 'projects')
const returnTo = computed(() => fromProjects.value ? '/commercial/projects' : `/commercial?scene=clients&client=${party.slug}`)
const siteUrl = useRuntimeConfig().public.siteUrl.replace(/\/?$/, '/')
useHead({
  title: `${party.displayName} | Commercial clients | Setia Air-Cond`,
  htmlAttrs: { 'data-theme': 'service' },
  link: [{ rel: 'canonical', href: new URL(`commercial/clients/${party.slug}`, siteUrl).href }],
  meta: [{ name: 'description', content: records.length ? party.summary : `${party.displayName} | Commercial clients | Setia Air-Cond.` }],
})
</script>

<template>
  <CommercialDetailLayout class="client-detail-page" scroll-reveals>
    <article class="client-detail">
      <nav class="client-detail__breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Home</NuxtLink><span aria-hidden="true">/</span>
        <NuxtLink :to="returnTo">{{ fromProjects ? 'Project records' : 'Commercial clients' }}</NuxtLink><span aria-hidden="true">/</span>
        <span aria-current="page">{{ party.displayName }}</span>
      </nav>
      <CommercialClientProject v-for="(record, index) in records" :key="record.id" :party="party" :record="record" :first="index === 0" />
      <CommercialClientProject v-if="!records.length" :party="party" :record="null" first />
      <nav v-if="fromProjects" class="client-detail__return" aria-label="Return to project records">
        <NuxtLink :to="returnTo"><CommercialDetailArrow direction="left" />Back to project records</NuxtLink>
      </nav>
    </article>
    <CompanyEnquirySection heading-id="client-contact-heading" :heading-lines="['Start a conversation', 'with Setia.']" quote-to="/get-a-quote?property=commercial" />
  </CommercialDetailLayout>
</template>

<style scoped>
.client-detail { --client-gutter: clamp(20px, 4vw, 64px); width: min(100% - 2 * var(--client-gutter), 1440px); margin: auto; padding-bottom: 24px; }
.client-detail__breadcrumb { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; min-height: 72px; padding-block: 12px; color: #bed0c3; font-size: 13px; line-height: 1.5; }
.client-detail__breadcrumb a { display: inline-flex; align-items: center; min-height: 44px; text-underline-offset: 4px; }
.client-detail__breadcrumb a:hover { text-decoration: underline; }
.client-detail__return { display: flex; justify-content: end; padding-bottom: 24px; }
.client-detail__return a { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; color: #bed0c3; font-size: 15px; text-underline-offset: 5px; }
.client-detail__return a:hover { text-decoration: underline; }
@media (min-width: 900px) {
  .client-detail-page :deep(.commercial-detail__header-inner) { min-height: clamp(48px, 5vw, 72px); }
  .client-detail__breadcrumb { min-height: clamp(40px, 4vw, 60px); padding-block: 0; }
}
@media (max-width: 899px) { .client-detail { width: min(100% - 2 * clamp(20px, 4vw, 64px), 680px); } }
@media (max-width: 550px) { .client-detail__breadcrumb { min-height: 64px; font-size: 12px; } }
@media (max-width: 360px) {
  .client-detail__breadcrumb > span:last-child,
  .client-detail__breadcrumb > span:nth-last-child(2) { display: none; }
}
</style>
