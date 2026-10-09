<script setup lang="ts">
import { computed, ref } from 'vue'
import { getCommercialClientPhotos } from '~/data/commercial-client-media'
import { commercialSources, type CommercialClient, type CommercialProjectRecord } from '~/data/commercial-view'

const props = defineProps<{ party: CommercialClient, record: CommercialProjectRecord | null, first: boolean }>()
const photos = computed(() => getCommercialClientPhotos(props.party, props.record))
const selectedSource = ref('')
const failedSources = ref<string[]>([])
const availablePhotos = computed(() => photos.value.filter(photo => !failedSources.value.includes(photo.src)))
const activePhoto = computed(() => availablePhotos.value.find(photo => photo.src === selectedSource.value) ?? availablePhotos.value[0])
const galleryPhotos = computed(() => availablePhotos.value.length > 2 ? availablePhotos.value.slice(-2) : availablePhotos.value)
const hasRepresentativePhotos = computed(() => photos.value.some(photo => photo.kind === 'representative'))
const recordKey = computed(() => props.record?.id ?? props.party.slug)
const title = computed(() => props.record ? props.record.discipline === 'air-conditioning' ? 'Cooling systems' : 'Electrical works' : 'Commercial client')
/** A client without a register row describes itself from the clientele listing: the systems recorded for it, or its brief. */
const partyScope = computed(() => props.party.systems.length ? `Setia’s clientele listing records the following systems for ${props.party.displayName}: ${props.party.systems.join(' · ')}.` : props.party.summary ?? 'N/A')
function markUnavailable(src: string) {
  if (!failedSources.value.includes(src)) failedSources.value.push(src)
}
</script>

<template>
  <section :id="`project-${recordKey}`" class="client-project" :class="{ 'client-project--first': first }" :aria-labelledby="`scope-${recordKey}`">
    <div class="client-project__split">
      <div class="client-project__visual">
        <figure class="client-project__hero">
          <img v-if="activePhoto" :key="activePhoto.src" :src="$sitePath(activePhoto.src)" :alt="activePhoto.alt" :width="activePhoto.width" :height="activePhoto.height" :loading="first ? 'eager' : 'lazy'" :fetchpriority="first ? 'high' : 'auto'" decoding="async" @error="markUnavailable(activePhoto.src)">
          <p v-else class="client-project__unavailable">Equipment photographs are currently unavailable.</p>
          <figcaption class="client-project__hero-copy">
            <h1 v-if="first">{{ party.displayName }}</h1>
            <p v-else class="client-project__hero-title">{{ party.displayName }}</p>
            <p v-if="record">{{ first ? party.summary : record.displayScope }}</p>
            <span v-if="record" class="client-project__hero-years">{{ record.yearText }}</span>
          </figcaption>
        </figure>
        <div v-if="availablePhotos.length > 1" class="client-project__filmstrip">
          <div class="client-project__thumbnails" role="group" :aria-label="`${party.displayName} equipment photographs`">
            <button v-for="(photo, index) in availablePhotos" :key="photo.src" type="button" :aria-pressed="activePhoto?.src === photo.src" :aria-label="`Show ${photo.caption.toLowerCase()}, image ${index + 1} of ${availablePhotos.length}`" @click="selectedSource = photo.src">
              <img :src="$sitePath(photo.src)" alt="" :width="photo.width" :height="photo.height" loading="lazy" decoding="async" @error="markUnavailable(photo.src)">
            </button>
          </div>
          <a class="client-project__explore" :href="`#client-gallery-${recordKey}`">Explore photos <CommercialDetailArrow /></a>
        </div>
        <p v-if="hasRepresentativePhotos" class="client-project__image-note">Representative equipment imagery, not photographs of this project site.</p>
      </div>

      <div class="client-project__sheet">
        <div class="client-project__overview">
          <figure v-if="party.logoSrc" class="client-project__logo"><img :src="$sitePath(party.logoSrc)" :alt="`${party.displayName} logo`" width="360" height="180" decoding="async"></figure>
          <div class="client-project__sheet-title"><h2 :id="`scope-${recordKey}`">{{ title }}</h2></div>
          <dl class="client-project__quick-facts">
            <div><dt>Recorded years</dt><dd>{{ record?.yearText ?? 'N/A' }}</dd></div>
            <div><dt>Client</dt><dd>{{ party.displayName }}</dd></div>
          </dl>
        </div>
        <div class="client-project__scope"><h3>{{ record ? 'What Setia delivered' : 'Project description' }}</h3><p>{{ record?.displayScope ?? partyScope }}</p></div>
      </div>
    </div>

    <div v-if="galleryPhotos.length > 1" :id="`client-gallery-${recordKey}`" class="client-project__gallery" :aria-label="`${party.displayName} equipment gallery`">
      <figure v-for="photo in galleryPhotos" :key="photo.src"><img :src="$sitePath(photo.src)" :alt="photo.alt" :width="photo.width" :height="photo.height" loading="lazy" decoding="async" @error="markUnavailable(photo.src)"><figcaption>{{ photo.caption }}</figcaption></figure>
    </div>

    <details class="client-project__details">
      <summary>Project details<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg></summary>
      <div class="client-project__details-content">
        <div v-if="record?.explicitSystems.length" class="client-project__systems"><h3>Systems included</h3><p>{{ record.explicitSystems.join(' · ') }}</p></div>
        <div v-else-if="party.systems.length" class="client-project__systems"><h3>Systems included</h3><p>{{ party.systems.join(' · ') }}</p></div>
        <dl>
          <div><dt>Main contractor / owner</dt><dd>{{ record?.partyName ?? 'N/A' }}</dd></div>
          <div><dt>Recorded years</dt><dd>{{ record?.yearText ?? 'N/A' }}</dd></div>
          <div><dt>Published job value</dt><dd>{{ record?.valueDisplay ?? 'N/A' }}<small v-if="record?.qualifier">{{ record.qualifier }}</small></dd></div>
          <div v-if="record?.quantities.length"><dt>Published quantity</dt><dd>{{ record.quantities.join(' · ') }}</dd></div>
          <div v-if="record?.location"><dt>Location in register</dt><dd>{{ record.location }}</dd></div>
          <div v-if="record"><dt>Register reference</dt><dd>{{ record.id.toUpperCase() }}</dd></div>
        </dl>
        <div class="client-project__original"><h3>{{ record ? 'Original register wording' : 'Project description' }}</h3><p>{{ record?.originalScope ?? 'N/A' }}</p></div>
        <p class="client-project__source">Source: <a v-if="record" :href="commercialSources.projects" target="_blank" rel="noopener noreferrer">Setia’s published project register<span class="sr-only"> (opens in a new tab)</span></a><template v-else>Setia’s clientele listing, October 2026</template>.</p>
      </div>
    </details>
  </section>
</template>

<style scoped>
.client-project { --project-line: #bed0c34d; --project-muted: #bed0c3; scroll-margin-top: 24px; padding-bottom: clamp(40px, 5vw, 72px); }
.client-project + .client-project { padding-top: clamp(40px, 5vw, 72px); border-top: 1px solid var(--project-line); }
.client-project__split { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: clamp(28px, 4vw, 64px); align-items: start; }
.client-project__visual { position: sticky; top: 24px; min-width: 0; }
.client-project__hero { position: relative; isolation: isolate; height: clamp(560px, calc(100svh - 190px), 900px); margin: 0; overflow: hidden; background: #103d2c; }
.client-project__hero > img { width: 100%; height: 100%; object-fit: cover; object-position: 42% center; animation: client-photo-in 240ms ease-out; }
.client-project__hero-copy { position: absolute; inset: auto 0 0; padding: 100px clamp(24px, 3vw, 48px) 32px; background: linear-gradient(transparent, #061710e6); color: #f8fbf8; }
.client-project h1, .client-project h2, .client-project__hero-title { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; line-height: 1.06; letter-spacing: -.035em; text-wrap: balance; }
.client-project h1, .client-project__hero-title { margin: 0 0 16px; font-size: clamp(42px, 4.8vw, 76px); overflow-wrap: anywhere; }
.client-project__hero-copy > p:not(.client-project__hero-title) { max-width: 46ch; margin: 0; font-size: 15px; line-height: 1.6; }
.client-project__hero-years { display: block; margin-top: 16px; font-size: 15px; font-weight: 650; font-variant-numeric: tabular-nums; }
.client-project__unavailable { margin: 0; padding: 32px; color: var(--project-muted); font-size: 16px; line-height: 1.6; }
.client-project__filmstrip { display: flex; align-items: center; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--project-line); }
.client-project__thumbnails { display: flex; gap: 10px; flex: 1; min-width: 0; padding: 4px; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: thin; scrollbar-color: #bed0c380 transparent; }
.client-project__thumbnails button { flex: 0 0 clamp(68px, 6.5vw, 104px); min-width: 44px; height: clamp(48px, 4.5vw, 68px); padding: 0; border: 0; background: #103d2c; cursor: pointer; opacity: .65; transition: opacity 150ms ease; }
.client-project__thumbnails button:hover, .client-project__thumbnails button[aria-pressed='true'] { opacity: 1; }
.client-project__thumbnails button[aria-pressed='true'] { outline: 1px solid #d1e4d7; outline-offset: 3px; }
.client-project__thumbnails img { width: 100%; height: 100%; object-fit: cover; }
.client-project__explore { display: inline-flex; align-items: center; gap: 12px; flex: 0 0 auto; min-height: 44px; font-size: 13px; line-height: 1.3; text-underline-offset: 5px; }
.client-project__explore:hover { text-decoration: underline; }
.client-project__explore svg { width: 18px; height: 18px; }
.client-project__image-note { margin: 12px 0 0; color: var(--project-muted); font-size: 12px; line-height: 1.5; }
.client-project__sheet { min-width: 0; padding-top: clamp(20px, 4vw, 64px); }
.client-project__logo { display: grid; align-items: center; min-height: 110px; margin: 0 0 32px; }
.client-project__logo img { width: min(100%, 250px); height: auto; max-height: 104px; object-fit: contain; object-position: left center; }
.client-project__sheet-title { padding-block: 32px; border-block: 1px solid var(--project-line); }
.client-project h2 { margin: 0; font-size: clamp(40px, 3.6vw, 60px); }
.client-project__quick-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin: 0; padding-block: 28px; border-bottom: 1px solid var(--project-line); }
.client-project dt { margin: 0 0 8px; color: var(--project-muted); font-size: 12px; font-weight: 550; }
.client-project dd { margin: 0; font-size: 17px; line-height: 1.5; overflow-wrap: anywhere; }
.client-project__scope { padding-block: 32px; }
.client-project h3 { margin: 0 0 16px; font-size: 18px; font-weight: 550; }
.client-project__scope p, .client-project__systems p { max-width: 65ch; margin: 0; font-size: 17px; line-height: 1.7; }
.client-project__systems { padding-bottom: 24px; }
.client-project__systems h3 { margin-bottom: 12px; color: var(--project-muted); font-size: 13px; }
.client-project__systems p { color: #e3ede5; font-size: 15px; }
.client-project__gallery { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: clamp(28px, 4vw, 56px); scroll-margin-top: 24px; }
.client-project__gallery figure { min-width: 0; margin: 0; }
.client-project__gallery img { width: 100%; aspect-ratio: 3 / 2; height: auto; object-fit: cover; }
.client-project__gallery figcaption { padding-top: 10px; color: var(--project-muted); font-size: 13px; line-height: 1.5; }
.client-project__details { margin-top: 32px; padding-block: 8px; border-block: 1px solid var(--project-line); }
.client-project__details summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 48px; cursor: pointer; list-style: none; font-size: 15px; text-underline-offset: 5px; }
.client-project__details summary::-webkit-details-marker { display: none; }
.client-project__details summary:hover { text-decoration: underline; }
.client-project__details summary svg { flex: 0 0 auto; transition: transform 150ms ease; }
.client-project__details[open] summary svg { transform: rotate(180deg); }
.client-project__details-content { padding: 24px 0; }
.client-project__details dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px 40px; margin: 0 0 32px; }
.client-project__details dd { font-size: 15px; }
.client-project__details small { display: block; margin-top: 8px; color: var(--project-muted); font-size: 13px; }
.client-project__original { max-width: 70ch; font-size: 15px; line-height: 1.7; }
.client-project__original h3 { font-size: 16px; }
.client-project__original p { margin: 0; }
.client-project__source { max-width: 70ch; margin: 24px 0 0; color: var(--project-muted); font-size: 14px; line-height: 1.7; }
.client-project__source a { text-decoration: underline; text-underline-offset: 4px; }
.client-project :is(a, button, summary):focus-visible { outline: 2px solid #d1e4d7; outline-offset: 4px; }
@keyframes client-photo-in { from { opacity: .65; } to { opacity: 1; } }
@media (min-width: 900px) {
  .client-project__split { gap: 0; margin-inline: calc(-1 * var(--client-gutter)); }
  .client-project--first .client-project__split { min-height: calc(100svh - clamp(48px, 5vw, 72px) - clamp(44px, 4vw, 60px)); }
  .client-project--first .client-project__hero { height: max(360px, calc(100svh - 260px)); }
  .client-project__hero { height: clamp(360px, calc(100svh - 260px), 820px); }
  .client-project h1, .client-project__hero-title { font-size: clamp(40px, min(6.4vw, 7svh), 80px); }
  .client-project__filmstrip { gap: 12px; padding: 8px var(--client-gutter); }
  .client-project__image-note { margin: 8px var(--client-gutter) 0; }
  .client-project__sheet { padding: clamp(16px, 2.5svh, 32px) var(--client-gutter) 0; }
  .client-project__logo { min-height: clamp(60px, 8svh, 88px); margin-bottom: 20px; }
  .client-project__logo img { width: clamp(150px, 16vw, 240px); max-height: clamp(60px, 8svh, 88px); }
  .client-project__sheet-title { padding-block: clamp(16px, 2.5svh, 28px); }
  .client-project h2 { font-size: clamp(36px, min(4.5vw, 6svh), 60px); }
  .client-project__quick-facts { padding-block: clamp(16px, 2.5svh, 28px); }
  .client-project__scope { padding-block: clamp(20px, 3svh, 32px); }
  .client-project__scope p { font-size: clamp(14px, 1.55vw, 18px); }
  .client-project__systems p { font-size: clamp(13px, 1.4vw, 16px); }
  .client-project__gallery { margin-top: 24px; }
}
@media (max-width: 899px) {
  .client-project__split { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .client-project__visual { position: static; }
  .client-project__hero { height: clamp(160px, calc(100svh - 400px), 540px); }
  .client-project__hero-copy { padding: 64px 20px 20px; }
  .client-project h1, .client-project__hero-title { margin-bottom: 0; font-size: clamp(28px, 5vw, 44px); }
  .client-project__hero-copy > p:not(.client-project__hero-title) { display: none; }
  .client-project__hero-years { margin-top: 8px; font-size: 13px; }
  .client-project__filmstrip { gap: 12px; padding-block: 8px; }
  .client-project__thumbnails { gap: 8px; }
  .client-project__thumbnails button { flex-basis: 60px; height: 44px; }
  .client-project__explore { font-size: 12px; gap: 8px; }
  .client-project__image-note { margin-top: 8px; }
  .client-project__sheet { padding-top: 0; }
  .client-project__overview { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); align-items: center; gap: 12px 20px; }
  .client-project__logo { min-height: 44px; margin: 0; }
  .client-project__logo img { max-width: 150px; max-height: 48px; }
  .client-project__sheet-title { padding-block: 8px; border: 0; }
  .client-project__sheet-title:first-child { grid-column: 1 / -1; }
  .client-project h2 { font-size: clamp(26px, 4vw, 36px); }
  .client-project__quick-facts { grid-column: 1 / -1; gap: 12px; padding-block: 8px 12px; }
  .client-project__quick-facts dt { margin-bottom: 4px; }
  .client-project__quick-facts dd { font-size: 14px; line-height: 1.4; }
  .client-project__scope { padding-block: 24px; }
  .client-project__details dl { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 550px) {
  .client-project__thumbnails button { flex-basis: 52px; }
  .client-project__gallery { display: flex; gap: 14px; overflow-x: auto; padding: 0 0 12px; scroll-snap-type: x proximity; scrollbar-width: thin; scrollbar-color: #bed0c380 transparent; }
  .client-project__gallery figure { flex: 0 0 88%; scroll-snap-align: start; }
  .client-project__details dl { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 360px) {
  .client-project__split { gap: 12px; }
  .client-project__hero { height: clamp(160px, calc(100svh - 416px), 540px); }
  .client-project__hero-copy { padding-top: 16px; }
  .client-project h1, .client-project__hero-title { font-size: 26px; }
  .client-project h2 { font-size: 24px; }
  .client-project__overview { gap: 8px 16px; }
  .client-project__quick-facts { grid-template-columns: minmax(0, 1fr); padding-bottom: 8px; }
  .client-project__quick-facts > div:last-child { display: none; }
}
@media (prefers-reduced-motion: reduce) { .client-project__hero > img { animation: none; } .client-project__thumbnails button, .client-project__details summary svg { transition: none; } }
</style>
