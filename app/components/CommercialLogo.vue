<script setup lang="ts">
import type { CompanyLogo } from '~/data/commercial-logos'
defineProps<{ logo: CompanyLogo; name: string; dark?: boolean; caption?: boolean; lazy?: boolean }>()
</script>

<template>
  <div class="commercial-logo" :class="{ 'commercial-logo--dark': dark }">
    <div class="commercial-logo__image">
      <img :src="$sitePath(logo.src)" :width="logo.width" :height="logo.height" :alt="name" :class="`commercial-logo--${logo.treatment}`" :loading="lazy ? 'lazy' : undefined" decoding="async">
    </div>
    <span v-if="caption" class="commercial-logo__caption" aria-hidden="true">{{ name }}</span>
  </div>
</template>

<style scoped>
.commercial-logo { display: flex; flex-direction: column; align-items: center; gap: 18px; min-width: 0; }
.commercial-logo__image { display: flex; align-items: center; justify-content: center; width: 100%; height: var(--logo-height, 70px); }
.commercial-logo img { display: block; width: auto; height: auto; max-width: min(85%, var(--logo-width, 180px)); max-height: 100%; object-fit: contain; }
.commercial-logo__caption { font-size: 12px; line-height: 1.2; text-align: center; font-weight: 400; letter-spacing: .02em; color: var(--ink-soft, #bed0c3); }
.commercial-logo--solid { filter: brightness(0); }
.commercial-logo--paper { filter: grayscale(1) contrast(3); mix-blend-mode: multiply; }
.commercial-logo--reverse { filter: grayscale(1); }
.commercial-logo--light { filter: grayscale(1) invert(1); }
.commercial-logo--dark .commercial-logo--solid { filter: brightness(0) invert(1); }
.commercial-logo--dark .commercial-logo__image { background: #0b3022; isolation: isolate; }
.commercial-logo--dark .commercial-logo--paper { filter: grayscale(1) contrast(3) invert(1); mix-blend-mode: screen; }
.commercial-logo--dark .commercial-logo--reverse { filter: grayscale(1) invert(1) brightness(1.4); }
.commercial-logo--dark .commercial-logo--light { filter: none; }
@media (max-width: 700px) {
  .commercial-logo { gap: 12px; }
  .commercial-logo__image { height: var(--logo-height, 40px); }
  .commercial-logo__caption { font-size: 11px; }
}
@media (min-width: 701px) and (max-height: 750px) {
  .commercial-logo--dark { gap: 10px; }
  .commercial-logo--dark .commercial-logo__image { height: var(--logo-height, 40px); }
}
@media (max-aspect-ratio: 1/1) and (max-height: 700px) {
  .commercial-logo--dark { gap: 8px; }
  .commercial-logo--dark .commercial-logo__image { height: var(--logo-height, 28px); }
}
</style>
