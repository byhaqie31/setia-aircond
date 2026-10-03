<script setup lang="ts">
withDefaults(defineProps<{ direction?: 'right' | 'left' | 'up-right' }>(), { direction: 'right' })
</script>

<template>
  <svg class="commercial-detail-arrow" :class="`commercial-detail-arrow--${direction}`" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path d="M4 12h15m-6-6 6 6-6 6" />
  </svg>
</template>

<style scoped>
.commercial-detail-arrow { display: inline-block; width: 20px; height: 20px; flex: 0 0 auto; }
.commercial-detail-arrow--left { transform: rotate(180deg); }
.commercial-detail-arrow--up-right { transform: rotate(-45deg); }
</style>
