<script setup lang="ts">
import type { ServiceArrival } from '~/utils/navigation'

const serviceArrival = useState<ServiceArrival | null>('service-arrival', () => null)
const arriving = serviceArrival.value?.floor === 'residential' && serviceArrival.value.animate
serviceArrival.value = null

useHead({
  title: 'Aircond Services & Repairs for Homes in Malaysia | Setia',
  htmlAttrs: { 'data-theme': 'service' },
  meta: [{ name: 'description', content: 'Air conditioner installation, servicing, repairs and electrical work for homes across Kuala Lumpur and Selangor. Daikin, York and other leading brands, maintained by Setia since 1990.' }],
})
</script>

<template>
  <ResidentialViewPage :arriving="arriving" />
</template>
