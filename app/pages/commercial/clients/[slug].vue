<script setup lang="ts">
import { commercialClientCategories, getCommercialClientPages, getCommercialParty, getCommercialPartyRecords } from '~/data/commercial-view'
import { groupForClient } from '~/utils/commercial-view-layout'
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
// Return to the client's own tab and page of the clientele screen without reselecting its mark, so nothing stays highlighted after the round trip.
const clientPages = party.categoryId ? getCommercialClientPages(party.categoryId) : []
const clientPage = groupForClient(clientPages, party.slug) + 1
const clientQuery = (party.categoryId && party.categoryId !== commercialClientCategories[0]?.id ? `&category=${party.categoryId}` : '') + (clientPage > 1 ? `&page=${clientPage}` : '')
const returnTo = computed(() => fromProjects.value ? '/commercial/projects' : `/commercial?scene=clients${clientQuery}`)
useHead({
  title: `${party.displayName} | Commercial clients | Setia Air-Cond`,
  htmlAttrs: { 'data-theme': 'service' },
  meta: [{ name: 'description', content: records.length && party.summary ? party.summary : `${party.displayName} | Commercial clients | Setia Air-Cond.` }],
})
</script>

<template>
  <CommercialDetailLayout class="client-detail-page" scroll-reveals>
    <CommercialDetailBack :to="returnTo" :label="fromProjects ? 'Back to project records' : 'Back to clientele'" />
    <article class="client-detail">
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
/* The same header measure as the service pages, outranking the layout's own phone rule, so the back button shares the logo's left edge at every width. */
.client-detail-page :deep(.commercial-detail__header .commercial-detail__header-inner) { width: min(100% - 2 * clamp(24px, 5.5vw, 80px), 1680px); min-height: clamp(48px, 5vw, 72px); }
.client-detail__return { display: flex; justify-content: end; padding-bottom: 24px; }
.client-detail__return a { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; color: #bed0c3; font-size: 15px; text-underline-offset: 5px; }
.client-detail__return a:hover { text-decoration: underline; }
@media (max-width: 899px) { .client-detail { width: min(100% - 2 * clamp(20px, 4vw, 64px), 680px); } }
@media (max-width: 360px) { .client-detail-page :deep(.commercial-detail__header .commercial-detail__header-inner) { width: calc(100% - 40px); } }
</style>
