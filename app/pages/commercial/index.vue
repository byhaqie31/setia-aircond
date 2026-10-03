<script setup lang="ts">
import corporate from '~/data/corporate.json'
import type { BuildingFloor } from '~/utils/navigation'

const arrival = useState<BuildingFloor | null>('service-arrival', () => null)
if (arrival.value === 'commercial') arrival.value = null
const siteUrl = useRuntimeConfig().public.siteUrl.replace(/\/?$/, '/')

useHead({
  title: 'Commercial Services & Projects | Setia Air-Cond & Electrical',
  htmlAttrs: { 'data-theme': 'service' },
  link: [{ rel: 'canonical', href: new URL('commercial', siteUrl).href }],
  meta: [{ name: 'description', content: corporate.description }],
})
</script>

<template>
  <CommercialViewExperience />
</template>
