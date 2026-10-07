<script setup lang="ts">
import corporate from '~/data/corporate.json'
import type { ArrivalMode, ServiceArrival } from '~/utils/navigation'

const serviceArrival = useState<ServiceArrival | null>('service-arrival', () => null)
// The home page's cover already shows this scene grown and lit, so the intro continues from there.
const arrival: ArrivalMode | null = serviceArrival.value?.floor === 'commercial' ? (serviceArrival.value.animate ? 'animated' : 'instant') : null
serviceArrival.value = null

useHead({
  title: 'Commercial Services & Projects | Setia Air-Cond & Electrical',
  htmlAttrs: { 'data-theme': 'service' },
  meta: [{ name: 'description', content: corporate.description }],
})
</script>

<template>
  <CommercialViewExperience :arrival="arrival" />
</template>
