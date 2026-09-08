<script setup lang="ts">
/* The site's one header, held in its collapsed state on every interior page so
   arriving from the landing feels like the bar simply stayed put. The corporate
   page adds the toll-free line beside the wordmark. */
defineProps<{ corporate?: boolean }>()
const company = useCompany()
</script>

<template>
  <div id="mastbar" class="mastbar">
    <div class="mastbar__inner">
      <NuxtLink class="mastbar__brand" to="/">
        <span class="mastbar__word">{{ company.wordmark }}</span>
        <span class="mastbar__sub">{{ company.wordmarkSub }}</span>
      </NuxtLink>
      <div class="mastbar__actions">
        <AudienceSwitch variant="bar" />
        <a v-if="corporate" class="mastbar__tel" :href="company.phones.tollFree.href">Toll free <b>{{ company.phones.tollFree.display }}</b></a>
        <NuxtLink class="mastbar__quote" to="/enquiry">Get a quote</NuxtLink>
        <MenuToggle />
      </div>
    </div>
  </div>
</template>
