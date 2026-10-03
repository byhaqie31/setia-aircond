<script setup lang="ts">
import { companyContact } from '~/data/company-contact'

const telephone = companyContact.phones[1]!
const presented = ref(true)
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
  // Give the hidden state a paint after the cover leaves, then rise in.
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
  <aside class="floating-contact" :class="{ 'is-arriving': !presented }" aria-labelledby="floating-contact-title">
    <p id="floating-contact-title" class="floating-contact__title">Contact Setia Air-Cond</p>
    <address>
      <a :href="companyContact.tollFree.href" :data-tip="companyContact.tollFree.label" :aria-label="`Toll-free ${companyContact.tollFree.label}`">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14v-3a9 9 0 0 1 18 0v3" /><path d="M3 14h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4Zm18 0h-3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-4Z" /></svg>
      </a>
      <a :href="telephone.href" :data-tip="telephone.label" :aria-label="`Telephone ${telephone.label}`">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.68A2 2 0 0 1 22 16.92Z" /></svg>
      </a>
      <a :href="`mailto:${companyContact.email}`" :data-tip="companyContact.email" :aria-label="`Email ${companyContact.email}`">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" /></svg>
      </a>
    </address>
  </aside>
</template>

<style scoped>
.floating-contact { display: none; position: fixed; right: 30px; bottom: 0; z-index: 25; padding: 4px max(8px, env(safe-area-inset-right)) max(4px, env(safe-area-inset-bottom)) 14px; border-radius: 4px; color: #f8fbf8; background: #000; opacity:1; transform:translateY(0); transition:opacity .2s ease, transform .38s cubic-bezier(.22,1,.36,1), background-color .24s ease; }
/* Hovering the bar switches it to the green of the Setia logo mark. */
.floating-contact:hover, .floating-contact:focus-within { --contact-surface: #006600; background: var(--contact-surface); }
.floating-contact.is-arriving { opacity:0; transform:translateY(10px); }
.floating-contact, .floating-contact address { align-items: center; gap: 2px; }
.floating-contact__title { margin: 0 10px 0 0; font-size: 13px; font-weight: 600; white-space: nowrap; }
.floating-contact address { display: flex; padding-left: 10px; border-left: 1px solid #bed0c32d; font-style: normal; }
.floating-contact a { position: relative; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 4px; color: #bed0c3; transition: color .2s ease, background-color .2s ease; }
.floating-contact:hover a, .floating-contact:focus-within a { color: #e3f1e3; }
.floating-contact a:hover { color: #f8fbf8; background: #ffffff1f; }
.floating-contact a:focus-visible { outline: 2px solid #d1e4d7; outline-offset: -2px; color: #f8fbf8; }
.floating-contact svg { width: 18px; height: 18px; }
/* The number or address appears above its icon on hover and keyboard focus. */
.floating-contact a::after { position: absolute; right: 0; bottom: calc(100% + 8px); padding: 6px 10px; border-radius: 4px; color: #f8fbf8; background: var(--contact-surface, #000); font-size: 13px; font-weight: 600; white-space: nowrap; opacity: 0; transform: translateY(4px); pointer-events: none; transition: opacity .16s ease, transform .2s cubic-bezier(.22, 1, .36, 1); content: attr(data-tip); }
.floating-contact a:hover::after, .floating-contact a:focus-visible::after { opacity: 1; transform: translateY(0); }
/* Both loading systems keep their own cover in the DOM until the exit motion finishes. */
:global(body:has(.site-page-cover.is-active) .floating-contact), :global(body:has(.cooling-loader) .floating-contact), :global(body:has(.hero--entering) .floating-contact) { display: none; }
@media (min-width: 1024px) {
  .floating-contact { display: flex; }
}
@media (prefers-reduced-motion: reduce) {
  .floating-contact, .floating-contact a, .floating-contact a::after { transition: none; }
}
</style>
