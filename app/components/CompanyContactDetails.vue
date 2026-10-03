<script setup lang="ts">
import { companyContact as contact } from '~/data/company-contact'
defineProps<{ heading?: string; compact?: boolean }>()
</script>

<template>
  <section :id="compact ? undefined : 'company-contact'" class="company-contact company-width" :class="{ 'company-contact--compact': compact }" aria-labelledby="company-contact-title">
    <div class="company-contact__intro">
      <h2 id="company-contact-title" :class="{ 'sr-only': compact }">{{ heading || 'Visit or get in touch.' }}</h2>
      <p>{{ contact.name }}<br><span class="company-contact__registration">Company no. {{ contact.registration }}</span></p>
      <div v-if="compact" class="company-contact__office">
        <address><span v-for="line in contact.address" :key="line">{{ line }}</span></address>
        <a class="company-link" :href="contact.mapsHref" target="_blank" rel="noopener noreferrer">Get directions<span class="icon icon--arrow" aria-hidden="true" /><span class="sr-only"> (opens Google Maps in a new tab)</span></a>
      </div>
    </div>
    <dl class="company-contact__details">
      <div v-if="!compact" class="company-contact__address">
        <dt>Our office</dt>
        <dd>
          <address><span v-for="line in contact.address" :key="line">{{ line }}</span></address>
          <a class="company-link" :href="contact.mapsHref" target="_blank" rel="noopener noreferrer">Get directions<span class="icon icon--arrow" aria-hidden="true" /><span class="sr-only"> (opens Google Maps in a new tab)</span></a>
        </dd>
      </div>
      <div>
        <dt>Telephone</dt>
        <dd><a v-for="phone in contact.phones" :key="phone.href" :href="phone.href">{{ phone.label }}</a></dd>
      </div>
      <div>
        <dt>Toll free</dt>
        <dd><a :href="contact.tollFree.href">{{ contact.tollFree.label }}</a></dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd><a :href="`mailto:${contact.email}`">{{ contact.email }}</a></dd>
      </div>
      <div>
        <dt>Fax</dt>
        <dd>{{ contact.fax }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.company-contact { display: grid; grid-template-columns: var(--company-columns, minmax(0, .9fr) minmax(0, 1.3fr)); gap: var(--company-column-gap, clamp(32px, 7vw, 96px)); border-top: 1px solid var(--company-line); padding-block: clamp(56px, 7vw, 100px); }
.company-contact > * { min-width: 0; }
.company-contact__intro p { margin: 0; color: var(--company-muted); max-width: 34ch; }
.company-contact__registration { font-size: 13px; }
.company-contact__details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px var(--company-details-column-gap, 32px); margin: 0; }
.company-contact__details > div { min-width: 0; }
.company-contact__address { grid-column: 1 / -1; }
dt { margin-bottom: 10px; color: var(--company-muted); font-size: 13px; }
dd { margin: 0; font-size: 16px; line-height: 1.6; overflow-wrap: anywhere; }
dd a { display: flex; width: fit-content; min-height: 44px; align-items: center; }
dd a:hover { text-decoration: underline; text-underline-offset: 5px; }
address { font-style: normal; }
address span { display: block; }
.company-contact__address .company-link { margin-top: 8px; }
.company-contact--compact { width: 100%; padding-block: 24px 0; }
.company-contact--compact .company-contact__intro p { max-width: none; font-size: 16px; line-height: 1.5; color: var(--paper); }
.company-contact--compact .company-contact__registration { color: var(--company-muted); }
.company-contact--compact .company-contact__details { gap: 20px 24px; align-content: start; }
.company-contact--compact dt { margin-bottom: 4px; }
.company-contact__office { margin-top: 16px; font-size: 15px; line-height: 1.6; }
.company-contact__office .company-link { margin-top: 4px; }
@media (min-width: 1100px) { .company-contact--compact .company-contact__details { grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); } }
@media (max-width: 850px) { .company-contact { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 850px) { .company-contact--compact { gap: 28px; } }
@media (max-width: 480px) { .company-contact__details { grid-template-columns: 1fr; gap: 24px; } }
</style>
