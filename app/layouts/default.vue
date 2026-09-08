<script setup lang="ts">
/* Every page except the landing: static bar, drawer, page content, the CTA
   block (unless the page opts out), footer, quote FAB. */
const route = useRoute()
const corporate = computed(() => route.path.startsWith('/corporate'))
const showCta = computed(() => route.meta.cta !== false)

useHead({ bodyAttrs: { class: 'is-interior mastbar-page' } })

onMounted(() => {
  /* the static mastbar is up from the start — nothing to reveal; the FAB rides this */
  document.body.classList.add('header-revealed')
  document.documentElement.style.setProperty('--header-h', (document.getElementById('mastbar')?.offsetHeight || 64) + 'px')
  revealAll()
})
</script>

<template>
  <div>
    <div id="setia-root">
      <GrainOverlay />
      <SiteMastbar :corporate="corporate" />
      <NavDrawer />
      <slot />
      <CtaBlock v-if="showCta" />
      <SiteFooter />
    </div>
    <QuoteFab />
  </div>
</template>
