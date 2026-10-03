<script setup lang="ts">
const props = withDefaults(defineProps<{ scrollReveals?: boolean }>(), { scrollReveals: false })
const detailRoot = ref<HTMLElement | null>(null)
useCommercialDetailMotion(detailRoot, props.scrollReveals)
</script>

<template>
  <div ref="detailRoot" class="commercial-detail">
    <a class="skip-link" href="#commercial-detail-content">Skip to content</a>
    <header class="commercial-detail__header">
      <div class="commercial-detail__header-inner">
        <NuxtLink class="commercial-detail__identity" to="/" aria-label="Setia Air-Cond and Electrical home"><SetiaWordmark /></NuxtLink>
        <NuxtLink class="commercial-detail__quote" to="/get-a-quote?property=commercial">Get a quote <CommercialDetailArrow /></NuxtLink>
      </div>
    </header>
    <main id="commercial-detail-content" tabindex="-1"><slot /></main>
    <CompanyFooter />
  </div>
</template>

<style scoped>
.commercial-detail { min-height: 100svh; background: #0b3022; color: #f8fbf8; }
.commercial-detail :focus-visible { outline: 2px solid #d1e4d7; outline-offset: 5px; }
.commercial-detail__header { position: relative; z-index: 2; width: 100%; }
.commercial-detail__header-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; width: min(100% - 2 * clamp(20px, 4vw, 64px), 1440px); min-height: 72px; margin: auto; }
.commercial-detail__identity { display: inline-flex; align-items: center; min-width: 0; color: inherit; font-size: clamp(22px, 2.5vw, 38px); text-decoration: none; }
.commercial-detail__quote { display: inline-flex; align-items: center; gap: 16px; flex: 0 0 auto; min-height: 44px; color: inherit; font-weight: 700; }
/* Hover comes from the shared header "Get a quote" rule in assets/css/main.css. */
@media (max-width: 700px) { .commercial-detail__header-inner { min-height: 64px; } .commercial-detail__identity { font-size: clamp(14px, 4vw, 26px); } .commercial-detail__quote { font-size: 13px; gap: 6px; } }
@media (max-width: 480px) { .commercial-detail__header-inner { width: calc(100% - 32px); gap: 8px; } .commercial-detail__identity { font-size: 14px; } .commercial-detail__quote { font-size: 12px; } .commercial-detail__quote :deep(svg) { display: none; } }
</style>
