<script setup lang="ts">
import type { CommercialServicePhoto } from '~/data/commercial-service-photos'

withDefaults(defineProps<{
  photo: CommercialServicePhoto
  eager?: boolean
  sizes?: string
}>(), {
  eager: false,
  sizes: '(min-width: 1440px) 620px, (min-width: 900px) 46vw, 100vw',
})
</script>

<template>
  <figure class="service-photo">
    <div class="service-photo__image" :class="{ 'service-photo__image--crop': photo.crop }" :style="photo.crop ? { '--photo-scale': photo.crop.scale, '--photo-origin': photo.crop.position } : undefined">
      <img
        :src="$sitePath(photo.src)"
        :srcset="photo.smallSrc ? `${$sitePath(photo.smallSrc)} 800w, ${$sitePath(photo.src)} ${photo.width}w` : undefined"
        :sizes="photo.smallSrc ? sizes : undefined"
        :alt="photo.alt"
        :width="photo.width"
        :height="photo.height"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : undefined"
        decoding="async"
      >
    </div>
    <figcaption>{{ photo.caption }}</figcaption>
  </figure>
</template>

<style scoped>
.service-photo { min-width: 0; margin: 0; }
.service-photo__image { position: relative; display: block; overflow: hidden; background: #174a36; color: #f8fbf8; }
.service-photo img { display: block; width: 100%; height: auto; }
.service-photo__image--crop { aspect-ratio: 3 / 2; }
.service-photo__image--crop img { width: 100%; height: 100%; object-fit: cover; transform: scale(var(--photo-scale)); transform-origin: var(--photo-origin); }
.service-photo figcaption { margin-top: 12px; color: #bed0c3; font-size: 13px; line-height: 1.5; }
</style>
