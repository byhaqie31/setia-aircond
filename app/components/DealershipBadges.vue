<script setup lang="ts">
/* Daikin, Acson and Panasonic presented explicitly as dealerships. */
const company = useCompany()
</script>

<template>
  <div class="dealers">
    <div v-for="d in company.dealerships" :key="d.brand" class="dealer reveal">
      <div class="dealer__seal" aria-hidden="true">DEALER</div>
      <div>
        <div class="dealer__brand">{{ d.brand }}</div>
        <span class="dealer__k">{{ d.title }}</span>
        <!-- TODO(client): certificate issuer and details for the Acson and Panasonic dealerships -->
        <p v-if="!isTodo(d.issuer)" class="dealer__issuer">{{ d.issuer }}<template v-if="!isTodo(d.detail)"> · {{ d.detail }}</template></p>
        <p v-if="d.award" class="dealer__award">{{ d.award }}</p>
      </div>
    </div>
  </div>
</template>
