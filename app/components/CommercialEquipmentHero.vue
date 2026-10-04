<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { CommercialService } from '~/data/commercial-view'
import { commercialEquipmentScenes } from '~/data/commercial-service-scenes'

const props = defineProps<{ service: CommercialService }>()
const scene = computed(() => commercialEquipmentScenes[props.service.slug])
const arrived = ref(false)
const cutoutFailed = ref(false)
const fallbackFailed = ref(false)
const foreground = ref<HTMLImageElement | null>(null)
onMounted(() => {
  // A failed eager image may emit its error before hydration attaches listeners.
  if (foreground.value?.complete && foreground.value.naturalWidth === 0) cutoutFailed.value = true
  requestAnimationFrame(() => { arrived.value = true })
})
</script>

<template>
  <section class="equipment-hero" :class="{ 'equipment-hero--arrived': arrived, 'equipment-hero--fallback': cutoutFailed }" aria-labelledby="equipment-title">
    <CommercialDetailBack to="/commercial?scene=services" />
    <div class="equipment-hero__stage">
      <div class="equipment-hero__copy">
        <h1 id="equipment-title">{{ service.title }}</h1>
        <p class="equipment-hero__scope">{{ service.shortLine }}.</p>
        <p class="equipment-hero__explanation">{{ service.explanation }}</p>
        <NuxtLink class="equipment-hero__quote" to="/get-a-quote?property=commercial">Get a quote<CommercialDetailArrow /></NuxtLink>
      </div>
      <div class="equipment-hero__visual" :class="{ 'equipment-hero__visual--offset': ['chiller', 'ahu', 'duct-services'].includes(service.slug) }">
        <img v-if="scene && !cutoutFailed" ref="foreground" class="equipment-hero__image" :src="$sitePath(scene.src)" :srcset="`${$sitePath(scene.smallSrc)} 960w, ${$sitePath(scene.src)} 1536w`" sizes="(max-width: 899px) 140vw, 100vw" width="1536" height="864" :alt="scene.alt" fetchpriority="high" decoding="async" @error="cutoutFailed = true">
        <img v-else-if="service.primaryImage && !fallbackFailed" class="equipment-hero__fallback-image" :src="$sitePath(service.primaryImage)" width="1536" height="1024" :alt="service.imageAlt" @error="fallbackFailed = true">
        <p v-else class="equipment-hero__unavailable">Equipment photo unavailable. You can still explore the system below.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.equipment-hero { --equipment-gutter: clamp(24px, 5.5vw, 80px); position: relative; overflow: hidden; background: radial-gradient(ellipse at 70% 75%, #0b3022, #062319 66%); color: #f8fbf8; }
.equipment-hero__stage { position: relative; width: min(100%, 1840px); aspect-ratio: 16 / 9; margin: auto; }
.equipment-hero__copy { position: absolute; z-index: 2; top: 8%; left: var(--equipment-gutter); width: 26%; max-width: 380px; }
.equipment-hero h1 { width: max-content; max-width: 145%; margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(44px, 6.2vw, 80px); font-weight: 400; line-height: 1.04; letter-spacing: -.035em; text-wrap: balance; }
.equipment-hero__scope { margin: 20px 0 0; font-size: clamp(15px, 1.6vw, 21px); line-height: 1.5; }
.equipment-hero__explanation { max-width: 34ch; margin: 20px 0 0; color: #e3ede5; font-size: clamp(14px, 1.4vw, 18px); line-height: 1.6; }
.equipment-hero__quote { display: inline-flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 48px; margin-top: 24px; padding: 12px 20px; background: #d1e4d7; color: #0b3022; font-size: 15px; font-weight: 600; text-decoration: none; }
.equipment-hero__quote:hover { background: #f8fbf8; }
.equipment-hero__quote:focus-visible { outline: 2px solid #f8fbf8; outline-offset: 5px; }
.equipment-hero__visual { position: absolute; inset: 0; aspect-ratio: 16 / 9; }
.equipment-hero__visual--offset { inset: 18% 0 0 18%; }
.equipment-hero__image { display: block; width: 100%; height: 100%; object-fit: contain; }
.equipment-hero__fallback-image { position: absolute; right: 0; bottom: 0; width: 64%; height: 90%; object-fit: contain; }
.equipment-hero__unavailable { position: absolute; right: 8%; top: 45%; max-width: 32ch; color: #bed0c3; }
@media (prefers-reduced-motion: no-preference) {
  .equipment-hero--arrived .equipment-hero__image { animation: equipment-arrive .85s cubic-bezier(.16, 1, .3, 1) both; }
}
@keyframes equipment-arrive { from { opacity: .4; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 899px) {
  .equipment-hero__stage { aspect-ratio: auto; }
  .equipment-hero__copy { position: relative; top: auto; left: auto; width: auto; max-width: 620px; margin: 16px var(--equipment-gutter) 24px; }
  .equipment-hero h1 { max-width: 100%; font-size: clamp(44px, 8vw, 68px); }
  .equipment-hero__scope { margin-top: 16px; font-size: 17px; }
  .equipment-hero__explanation { max-width: 52ch; margin-top: 14px; font-size: 16px; }
  .equipment-hero__quote { margin-top: 20px; }
  .equipment-hero__visual { position: relative; width: 140%; margin-left: -40%; margin-top: 8px; }
  .equipment-hero__visual--offset { inset: auto; }
  .equipment-hero__fallback-image { width: 68%; height: 100%; }
}
@media (max-width: 360px) {
  .equipment-hero { --equipment-gutter: 20px; }
  .equipment-hero h1 { font-size: 40px; }
}
</style>
