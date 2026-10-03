<script setup lang="ts">
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { companyContact } from '~/data/company-contact'

if (import.meta.client) gsap.registerPlugin(Flip)

const telephone = companyContact.phones[1]!
const route = useRoute()
const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const presented = ref(true)
const expanded = ref(false)
const morphing = ref(false)
let observer: MutationObserver | undefined
let arrivalFrame: number | undefined
let hiddenState: boolean | undefined
let morph: gsap.core.Timeline | undefined
let morphToken = 0

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// A Flip timeline reverts by jumping to its end, which puts back the inline styles it borrowed.
function settleMorph() {
  morph?.revert()
  morph = undefined
  morphing.value = false
}

async function setExpanded(next: boolean, animate = true) {
  if (next === expanded.value) return
  settleMorph()
  const el = root.value
  if (!el || !animate || reducedMotion()) {
    expanded.value = next
    return
  }
  // Record where the title, icons and labels sit, switch the layout, then let Flip carry them to their new places.
  const state = Flip.getState([el, ...el.querySelectorAll('.floating-contact__title, address a, .floating-contact__label')])
  const token = ++morphToken
  expanded.value = next
  morphing.value = true
  await nextTick()
  if (token !== morphToken) return
  morph = Flip.from(state, {
    duration: 0.45,
    ease: 'power4.out',
    nested: true,
    absoluteOnLeave: true,
    clearProps: true,
    onEnter: elements => gsap.fromTo(elements, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, delay: 0.14, stagger: 0.05, ease: 'power2.out', clearProps: 'opacity,transform' }),
    onLeave: elements => gsap.to(elements, { opacity: 0, duration: 0.14, ease: 'power1.in' }),
    onComplete: () => {
      morph = undefined
      morphing.value = false
    },
  })
}

function onRootClick() {
  if (!expanded.value) void setExpanded(true)
}

// Collapsed, the icons are part of the trigger; the rows only act as links once the bar is open.
function onLinkClick(event: MouseEvent) {
  if (!expanded.value) event.preventDefault()
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!expanded.value || root.value?.contains(event.target as Node)) return
  void setExpanded(false)
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !expanded.value) return
  const focusInside = root.value?.contains(document.activeElement)
  void setExpanded(false)
  if (focusInside) trigger.value?.focus()
}

function syncPresentation() {
  const hidden = Boolean(document.querySelector('.site-page-cover.is-active, .cooling-loader, .hero--entering, .commercial-view.is-transitioning'))
  if (hidden === hiddenState) return
  hiddenState = hidden
  if (arrivalFrame !== undefined) cancelAnimationFrame(arrivalFrame)
  presented.value = false
  if (hidden) {
    void setExpanded(false, false)
    return
  }
  if (reducedMotion()) {
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

watch(() => route.path, () => {
  void setExpanded(false, false)
})

onMounted(() => {
  syncPresentation()
  observer = new MutationObserver(syncPresentation)
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
  if (arrivalFrame !== undefined) cancelAnimationFrame(arrivalFrame)
  settleMorph()
})
</script>

<template>
  <aside ref="root" class="floating-contact" :class="{ 'is-arriving': !presented, 'is-expanded': expanded, 'is-morphing': morphing }" aria-labelledby="floating-contact-title" @click="onRootClick">
    <button id="floating-contact-title" ref="trigger" class="floating-contact__title" type="button" :aria-expanded="expanded" @click.stop="setExpanded(!expanded)">Contact Setia Air-Cond</button>
    <address :aria-hidden="expanded ? undefined : 'true'">
      <a :href="companyContact.tollFree.href" :data-tip="companyContact.tollFree.label" :aria-label="`Toll-free ${companyContact.tollFree.label}`" :tabindex="expanded ? undefined : -1" @click="onLinkClick">
        <span class="floating-contact__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14v-3a9 9 0 0 1 18 0v3" /><path d="M3 14h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4Zm18 0h-3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-4Z" /></svg></span>
        <span class="floating-contact__label">{{ companyContact.tollFree.label }}</span>
      </a>
      <a :href="telephone.href" :data-tip="telephone.label" :aria-label="`Telephone ${telephone.label}`" :tabindex="expanded ? undefined : -1" @click="onLinkClick">
        <span class="floating-contact__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.68A2 2 0 0 1 22 16.92Z" /></svg></span>
        <span class="floating-contact__label">{{ telephone.label }}</span>
      </a>
      <a :href="`mailto:${companyContact.email}`" :data-tip="companyContact.email" :aria-label="`Email ${companyContact.email}`" :tabindex="expanded ? undefined : -1" @click="onLinkClick">
        <span class="floating-contact__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" /></svg></span>
        <span class="floating-contact__label">{{ companyContact.email }}</span>
      </a>
    </address>
  </aside>
</template>

<style scoped>
.floating-contact { display: none; position: fixed; right: 30px; bottom: 0; z-index: 25; align-items: center; gap: 2px; padding: 4px max(8px, env(safe-area-inset-right)) max(4px, env(safe-area-inset-bottom)) 14px; border-radius: 4px; color: #f8fbf8; background: #000; opacity: 1; transform: translateY(0); cursor: pointer; transition: opacity .2s ease, transform .38s cubic-bezier(.22,1,.36,1), background-color .24s ease; }
/* Hovering the bar switches it to the green of the Setia logo mark. */
.floating-contact:hover, .floating-contact:focus-within { --contact-surface: #006600; background: var(--contact-surface); }
.floating-contact.is-arriving { opacity: 0; transform: translateY(10px); }
/* Open, the title sits above one row per contact. */
.floating-contact.is-expanded { flex-direction: column; align-items: stretch; gap: 6px; padding-top: 10px; padding-right: max(10px, env(safe-area-inset-right)); padding-bottom: max(10px, env(safe-area-inset-bottom)); cursor: default; }
/* Flip drives the bar's size and transform while it morphs, so the CSS transform transition steps aside. */
.floating-contact.is-morphing { overflow: hidden; transition: background-color .24s ease; }
.floating-contact__title { margin: 0 10px 0 0; padding: 0; border: 0; border-radius: 2px; background: none; color: inherit; font: inherit; font-size: 13px; font-weight: 600; white-space: nowrap; text-align: left; cursor: pointer; }
.floating-contact__title:focus-visible { outline: 2px solid #d1e4d7; outline-offset: 2px; }
.is-expanded .floating-contact__title { margin: 0; }
.floating-contact address { display: flex; align-items: center; gap: 2px; padding-left: 10px; border-left: 1px solid #bed0c32d; font-style: normal; }
.is-expanded address { flex-direction: column; align-items: stretch; padding-left: 0; border-left: 0; }
.floating-contact a { position: relative; display: flex; align-items: center; width: 36px; height: 36px; border-radius: 4px; color: #bed0c3; white-space: nowrap; transition: color .2s ease, background-color .2s ease; }
.is-expanded a { width: auto; padding-right: 12px; }
.floating-contact:hover a, .floating-contact:focus-within a { color: #e3f1e3; }
.floating-contact a:hover { color: #f8fbf8; background: #ffffff1f; }
.floating-contact a:focus-visible { outline: 2px solid #d1e4d7; outline-offset: -2px; color: #f8fbf8; }
.floating-contact__icon { display: grid; flex: none; place-items: center; width: 36px; height: 36px; }
.floating-contact svg { width: 18px; height: 18px; }
.floating-contact__label { display: none; flex: none; font-size: 13px; font-weight: 600; }
.is-expanded .floating-contact__label { display: block; }
/* Collapsed, the number or address appears above its icon on hover; open, it sits beside the icon instead. */
.floating-contact a::after { position: absolute; right: 0; bottom: calc(100% + 8px); padding: 6px 10px; border-radius: 4px; color: #f8fbf8; background: var(--contact-surface, #000); font-size: 13px; font-weight: 600; white-space: nowrap; opacity: 0; transform: translateY(4px); pointer-events: none; transition: opacity .16s ease, transform .2s cubic-bezier(.22, 1, .36, 1); content: attr(data-tip); }
.floating-contact a:hover::after, .floating-contact a:focus-visible::after { opacity: 1; transform: translateY(0); }
.is-expanded a::after { display: none; }
/* Both loading systems keep their own cover in the DOM until the exit motion finishes. */
:global(body:has(.site-page-cover.is-active) .floating-contact), :global(body:has(.cooling-loader) .floating-contact), :global(body:has(.hero--entering) .floating-contact) { display: none; }
@media (min-width: 1024px) {
  .floating-contact { display: flex; }
}
@media (prefers-reduced-motion: reduce) {
  .floating-contact, .floating-contact__title, .floating-contact a, .floating-contact a::after { transition: none; }
}
</style>
