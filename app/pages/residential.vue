<script setup lang="ts">
import type { ServiceArrival } from '~/utils/navigation'

const serviceArrival = useState<ServiceArrival | null>('service-arrival', () => null)
const arriving = serviceArrival.value?.floor === 'residential' && serviceArrival.value.animate
serviceArrival.value = null

useHead({
  title: 'Residential Air-Conditioning & Electrical | Setia',
  htmlAttrs: { 'data-theme': 'service' },
  meta: [{ name: 'description', content: 'Air-conditioning design, installation, electrical services and maintenance for homes across Kuala Lumpur and Selangor. Supplied, installed and maintained by Setia since 1990.' }],
})
</script>

<template>
  <ResidentialViewPage :arriving="arriving" />
</template>
