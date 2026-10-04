<script setup lang="ts">
// One way back from a commercial detail page. It sits on the header's centred measure so it lines up with the logo at every width.
withDefaults(defineProps<{ to: string; label?: string }>(), { label: 'Back to commercial' })
</script>

<template>
  <div class="commercial-detail-back">
    <NuxtLink class="commercial-detail-back__link" :to="to"><CommercialDetailArrow direction="left" />{{ label }}</NuxtLink>
  </div>
</template>

<style scoped>
.commercial-detail-back { --detail-back-gutter: clamp(24px, 5.5vw, 80px); position: relative; z-index: 2; display: flex; width: min(100% - 2 * var(--detail-back-gutter), 1680px); margin: 0 auto; padding: 4px 0 12px; }
.commercial-detail-back__link { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 10px 18px 10px 14px; border: 1px solid #bed0c366; border-radius: 100px; color: #f8fbf8; font-size: 14px; font-weight: 600; line-height: 1.25; text-decoration: none; transition: background-color .2s ease, border-color .2s ease; }
.commercial-detail-back__link:hover { border-color: #bed0c3; background: #ffffff14; }
.commercial-detail-back__link svg { width: 18px; height: 18px; }
@media (max-width: 360px) { .commercial-detail-back { --detail-back-gutter: 20px; } }
</style>
