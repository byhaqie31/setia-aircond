<script setup lang="ts">
import { companyContact } from '~/data/company-contact'

const telephone = companyContact.phones[1]!
const expanded = ref(true)
const presented = ref(true)
const detailsVisible = computed(() => expanded.value && presented.value)
let observer: MutationObserver | undefined
let arrivalFrame: number | undefined
let hiddenState: boolean | undefined

function syncPresentation() {
  const hidden = Boolean(document.querySelector('.site-page-cover.is-active, .cooling-loader, .hero--entering, .commercial-view.is-transitioning'))
  if (hidden === hiddenState) return
  hiddenState = hidden
  if (arrivalFrame !== undefined) cancelAnimationFrame(arrivalFrame)
  presented.value = false
  if (hidden) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    presented.value = true
    return
  }
  // Give the compact state a paint after the cover leaves, then expand upward.
  arrivalFrame = requestAnimationFrame(() => {
    arrivalFrame = requestAnimationFrame(() => {
      arrivalFrame = undefined
      presented.value = true
    })
  })
}

onMounted(() => {
  syncPresentation()
  observer = new MutationObserver(syncPresentation)
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
})
onBeforeUnmount(() => {
  observer?.disconnect()
  if (arrivalFrame !== undefined) cancelAnimationFrame(arrivalFrame)
})
</script>

<template>
  <aside class="floating-contact" :class="{ 'is-collapsed': !expanded, 'is-arriving': !presented }" aria-label="Contact Setia">
    <button class="floating-contact__toggle" type="button" :aria-expanded="detailsVisible" aria-controls="setia-contact-links" @click="expanded = !expanded">
      <span>Contact Setia</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    <div id="setia-contact-links" class="floating-contact__details" :inert="!detailsVisible" :aria-hidden="!detailsVisible || undefined">
    <address>
      <a :href="companyContact.tollFree.href">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14v-3a9 9 0 0 1 18 0v3" /><path d="M3 14h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4Zm18 0h-3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-4Z" /></svg>
        <span><span class="floating-contact__label">Toll-free</span><span class="floating-contact__value">{{ companyContact.tollFree.label }}</span></span>
      </a>
      <a :href="telephone.href">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.68A2 2 0 0 1 22 16.92Z" /></svg>
        <span><span class="floating-contact__label">Tel</span><span class="floating-contact__value">{{ telephone.label }}</span></span>
      </a>
      <a :href="`mailto:${companyContact.email}`">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" /></svg>
        <span><span class="floating-contact__label">Email</span><span class="floating-contact__value">{{ companyContact.email }}</span></span>
      </a>
    </address>
    </div>
  </aside>
</template>

<style scoped>
.floating-contact { display: none; position: fixed; right: 0; bottom: 0; z-index: 25; width: min(320px, calc(100vw - 24px)); padding: 4px max(12px, env(safe-area-inset-right)) max(6px, env(safe-area-inset-bottom)) 12px; border: 0; border-radius: 4px; color: #f8fbf8; background: #000; opacity:1; transform:translateY(0); transition:opacity .2s ease, transform .38s cubic-bezier(.22,1,.36,1); }
.floating-contact__toggle { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; min-height: 28px; padding: 0; border: 0; color: #f8fbf8; background: transparent; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; }
.floating-contact__toggle svg { width: 16px; height: 16px; color: #bed0c3; transform: rotate(0); transition: transform .32s cubic-bezier(.22, 1, .36, 1); }
.is-collapsed .floating-contact__toggle svg { transform: rotate(180deg); }
.floating-contact__toggle:focus-visible { outline: 2px solid #d1e4d7; outline-offset: 3px; }
.floating-contact__details { display: grid; grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows .38s cubic-bezier(.22, 1, .36, 1), opacity .2s ease; }
.is-collapsed .floating-contact__details, .is-arriving .floating-contact__details { grid-template-rows: 0fr; opacity: 0; }
.floating-contact.is-arriving { opacity:0; transform:translateY(10px); }
.floating-contact address { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 12px; min-height: 0; overflow: hidden; border-top: 1px solid #bed0c32d; font-style: normal; }
.floating-contact a { display: grid; grid-template-columns: 16px minmax(0, 1fr); align-items: center; gap: 7px; min-height: 36px; padding: 3px 0; }
.floating-contact a:last-child { grid-column: 1 / -1; }
.floating-contact svg { width: 16px; height: 16px; color: #bed0c3; }
.floating-contact a > span { display: grid; gap: 1px; min-width: 0; }
.floating-contact__label { color: #bed0c3; font-size: 10px; font-weight: 600; line-height: 1.2; letter-spacing: .07em; text-transform: uppercase; }
.floating-contact__value { width: fit-content; font-size: 13px; font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; text-decoration: underline; text-decoration-color: transparent; text-underline-offset: 3px; }
.floating-contact a:hover .floating-contact__value { text-decoration-color: currentColor; }
.floating-contact a:focus-visible { outline: 2px solid #d1e4d7; outline-offset: 2px; }
/* Both loading systems keep their own cover in the DOM until the exit motion finishes. */
:global(body:has(.site-page-cover.is-active) .floating-contact), :global(body:has(.cooling-loader) .floating-contact), :global(body:has(.hero--entering) .floating-contact) { display: none; }
@media (min-width: 1024px) {
  .floating-contact { display: block; }
}
@media (prefers-reduced-motion: reduce) {
  .floating-contact, .floating-contact__toggle svg, .floating-contact__details { transition: none; }
}
</style>
