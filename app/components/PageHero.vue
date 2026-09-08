<script setup lang="ts">
/* Interior page hero: breadcrumb, eyebrow, italic-emphasis title, lede, and
   the mint air-thread accent down the right (styles.css .page-hero::after). */
defineProps<{ crumb: string; eyebrow: string; lede: string }>()
</script>

<template>
  <section class="page-hero">
    <div class="page-hero__glow" aria-hidden="true" />
    <div class="wrap page-hero__inner reveal">
      <nav class="crumb" aria-label="Breadcrumb"><NuxtLink to="/">Home</NuxtLink><span aria-hidden="true">/</span><span>{{ crumb }}</span></nav>
      <span class="eyebrow eyebrow--bright">{{ eyebrow }}</span>
      <h1 class="page-hero__title"><slot /></h1>
      <p class="page-hero__lede">{{ lede }}</p>
    </div>
  </section>
</template>
