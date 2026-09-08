<script setup lang="ts">
/* Scaffolded for client photographs; renders nothing until content/gallery.json has items. */
import gallery from '~~/content/gallery.json'
const items = gallery.items as { src: string; alt: string; caption?: string; width?: number; height?: number }[]
</script>

<template>
  <!-- TODO(client): project photographs — add files to public/images/projects and entries to content/gallery.json -->
  <div v-if="items.length" class="proj-block reveal">
    <h2 class="section__title">Project gallery</h2>
    <div class="gallery">
      <figure v-for="g in items" :key="g.src">
        <img :src="g.src" :alt="g.alt" :width="g.width" :height="g.height" loading="lazy" decoding="async">
        <figcaption v-if="g.caption">{{ g.caption }}</figcaption>
      </figure>
    </div>
  </div>
</template>
