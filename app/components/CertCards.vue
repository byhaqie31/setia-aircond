<script setup lang="ts">
/* `showReg` is the corporate register: registration slots are shown against
   each body, pending ones marked with the placeholder pill. */
import certs from '~~/content/certifications.json'
const props = defineProps<{ corporate?: boolean }>()
const items = computed(() => certs.items.filter(c =>
  props.corporate ? !('publicOnly' in c && c.publicOnly) : !('corporateOnly' in c && c.corporateOnly),
))
</script>

<template>
  <div class="cert-grid">
    <article v-for="(c, i) in items" :key="c.id" :class="['cert-card', 'reveal', i % 2 ? 'reveal--d1' : '']">
      <div class="cert-card__seal" aria-hidden="true">{{ c.seal }}</div>
      <h3 class="cert-card__title">{{ c.title }}</h3>
      <p class="cert-card__issuer">{{ c.issuer }}</p>
      <p class="cert-card__detail">
        {{ c.detail }}
        <template v-if="corporate && c.regLabel">
          {{ c.regLabel }}
          <!-- TODO(client): registration / certificate number -->
          <span v-if="isTodo(c.regNo)" class="corp-todo">pending</span>
          <template v-else>{{ c.regNo }}.</template>
        </template>
        <template v-if="corporate && c.id === 'daikin'"> Million Ringgit Sales Award winner, 14 consecutive years.</template>
      </p>
    </article>
  </div>
</template>
