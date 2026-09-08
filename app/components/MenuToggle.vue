<script setup lang="ts">
const { open, toggle } = useMenu()
</script>

<template>
  <button
    id="navToggle" class="mastbar__toggle" type="button"
    :aria-label="open ? 'Close menu' : 'Open menu'" :aria-expanded="open ? 'true' : 'false'" aria-controls="navDrawer"
    @click="toggle"
  >
    <svg class="mastbar__toggle-bars" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
    <svg class="mastbar__toggle-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  </button>
</template>
