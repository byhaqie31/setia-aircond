<script setup lang="ts">
import type { CommercialService } from '~/data/commercial-view'
import { commercialServicePhotos } from '~/data/commercial-service-photos'

const props = defineProps<{ service: CommercialService }>()
const photos = computed(() => commercialServicePhotos[props.service.slug] ?? [])
const scopePhoto = computed(() => photos.value.find(photo => photo.placement === 'scope') ?? photos.value.find(photo => photo.placement === 'system'))
const galleryPhotos = computed(() => [...photos.value.filter(photo => photo.placement === 'gallery'), ...photos.value.filter(photo => photo.placement !== 'gallery')])
</script>

<template>
  <article class="service-editorial">
    <section class="service-editorial__work-band">
      <div class="service-editorial__work-inner">
        <div class="service-editorial__system" aria-labelledby="service-system-heading">
          <h2 id="service-system-heading">How it works.</h2>
          <p class="service-editorial__system-lead">{{ service.systemDetails[0] }}</p>
          <CommercialServicePhoto v-if="scopePhoto" :photo="scopePhoto" sizes="(min-width: 1440px) 720px, (min-width: 900px) 50vw, 100vw" />
          <details v-if="service.systemDetails.length > 1" class="service-editorial__considerations">
            <summary>Site considerations<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 8 5 5 5-5" /></svg></summary>
            <p v-for="paragraph in service.systemDetails.slice(1)" :key="paragraph">{{ paragraph }}</p>
          </details>
        </div>
        <div class="service-editorial__scope" aria-labelledby="service-scope-heading">
          <h2 id="service-scope-heading">Work for your site.</h2>
          <p v-if="service.scopeStatus === 'enquiry'" class="service-editorial__scope-note">Setia can discuss this equipment as part of your site’s cooling system. The exact work scope will be confirmed for your installation.</p>
          <ul class="service-editorial__scope-list">
            <li v-for="item in service.serviceItems" :key="item">{{ item }}</li>
          </ul>
          <NuxtLink class="service-editorial__quote" to="/get-a-quote?property=commercial">Discuss your site<CommercialDetailArrow /></NuxtLink>
        </div>
      </div>
    </section>
    <div class="service-editorial__gallery">
      <CommercialServiceGallery :photos="galleryPhotos" />
    </div>
  </article>
</template>

<style scoped>
.service-editorial { --detail-gutter: clamp(24px, 5.5vw, 80px); --detail-section: clamp(40px, 4.8vw, 72px); background: #062319; color: #f8fbf8; }
.service-editorial h2 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(34px, 3.8vw, 54px); font-weight: 400; line-height: 1.08; letter-spacing: -.035em; text-wrap: balance; }
.service-editorial__work-band { background: #d1e4d7; color: #0b3022; }
.service-editorial__work-inner { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, .9fr); align-items: start; gap: clamp(40px, 4.5vw, 80px); width: min(100% - 2 * var(--detail-gutter), 1440px); margin: auto; padding-block: 32px; }
.service-editorial__system-lead { max-width: 62ch; margin: 14px 0 20px; font-size: clamp(16px, 1.5vw, 19px); line-height: 1.55; }
.service-editorial__system :deep(.service-photo__image) { aspect-ratio: 2.1 / 1; }
.service-editorial__system :deep(img) { width: 100%; height: 100%; object-fit: cover; }
.service-editorial__system :deep(figcaption) { margin-top: 8px; color: #365b46; font-size: 12px; }
.service-editorial__considerations { margin-top: 12px; border-top: 1px solid #365b4640; }
.service-editorial__considerations summary { display: flex; justify-content: space-between; align-items: center; gap: 16px; min-height: 44px; padding-block: 8px; font-size: 14px; font-weight: 600; cursor: pointer; list-style: none; }
.service-editorial__considerations summary::-webkit-details-marker { display: none; }
.service-editorial__considerations summary svg { width: 18px; height: 18px; }
.service-editorial__considerations[open] summary svg { transform: rotate(180deg); }
.service-editorial__considerations p { max-width: 62ch; margin: 8px 0 16px; color: #365b46; font-size: 16px; line-height: 1.6; }
.service-editorial__scope { padding-top: 40px; }
.service-editorial__scope-note { margin: 18px 0 0; color: #365b46; font-size: 16px; line-height: 1.6; }
.service-editorial__scope-list { margin: 24px 0 0; padding: 0; list-style: none; }
.service-editorial__scope-list li { display: flex; align-items: center; min-height: 60px; padding-block: 16px; border-top: 1px solid #365b4640; font-size: clamp(16px, 1.6vw, 20px); line-height: 1.5; }
.service-editorial__scope-list li:last-child { border-bottom: 1px solid #365b4640; }
.service-editorial__quote { display: inline-flex; align-items: center; gap: 18px; min-height: 44px; margin-top: 16px; padding-block: 8px; color: #0b3022; font-size: 15px; font-weight: 600; text-decoration: underline; text-underline-offset: 5px; }
.service-editorial__quote:hover { text-decoration-thickness: 2px; }
.service-editorial__work-band :is(a, summary):focus-visible { outline: 2px solid #0b3022; outline-offset: 4px; }
.service-editorial__gallery { width: min(100% - 2 * var(--detail-gutter), 1440px); margin: auto; padding-top: var(--detail-section); }
.service-editorial__gallery :deep(.service-gallery__slide) { flex-basis: 44%; }
.service-editorial__gallery :deep(.service-gallery__heading) { margin-bottom: 20px; }
.service-editorial__gallery :deep(.service-gallery__heading p) { margin-top: 12px; }
@media (min-width: 900px) {
  .service-editorial__gallery :deep(.service-gallery__track) { margin-right: calc(-1 * var(--detail-gutter)); gap: 20px; }
  .service-editorial__gallery :deep(.service-photo__image) { aspect-ratio: 2 / 1; }
}
@media (max-width: 899px) {
  .service-editorial__work-inner { grid-template-columns: minmax(0, 1fr); gap: 32px; max-width: 680px; padding-block: 32px; }
  .service-editorial__scope { padding-top: 0; }
  .service-editorial__scope-list li { min-height: 56px; font-size: 17px; }
  .service-editorial__system :deep(.service-photo__image) { aspect-ratio: 3 / 2; }
  .service-editorial__gallery :deep(.service-gallery__slide) { flex-basis: 88%; }
}
@media (max-width: 550px) {
  .service-editorial { --detail-section: 40px; }
  .service-editorial__gallery :deep(.service-gallery__heading) { flex-direction: row; align-items: center; gap: 12px; }
  .service-editorial__gallery :deep(.service-gallery h2) { font-size: 32px; }
  .service-editorial__gallery :deep(.service-gallery__controls) { gap: 6px; }
  .service-editorial__gallery :deep(.service-gallery__position) { min-width: 36px; font-size: 12px; }
  .service-editorial__gallery :deep(.service-gallery__controls button) { width: 44px; height: 44px; }
}
@media (max-width: 380px) {
  .service-editorial__gallery :deep(.service-gallery__heading) { flex-direction: column; align-items: start; }
}
</style>
