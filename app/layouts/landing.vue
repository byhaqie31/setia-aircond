<script setup lang="ts">
/* The landing's header is the masthead: one box in three states (loading card,
   opened masthead, the bar), driven by the hero engine. There is no second
   header to hand over to. With JavaScript off it is an ordinary bar at the top
   of the document with the menu open beneath it (styles.css html:not(.js)). */
const company = useCompany()
useHead({ bodyAttrs: { class: 'mastbar-page' } })
</script>

<template>
  <div>
    <div id="preloader" class="preloader">
      <div id="preloaderVeil" class="preloader__veil" aria-hidden="true" />
      <div id="masthead" class="masthead">
        <div id="mastheadBrand" class="masthead__brand">{{ company.wordmark }}</div>
        <div id="mastheadSub" class="masthead__sub">{{ company.wordmarkSub }} · EST. {{ company.established }}</div>
        <div id="mastheadPct" class="masthead__pct"><span id="preloaderPct">0</span>%</div>
        <div id="mastheadRule" class="masthead__rule" aria-hidden="true"><i id="preloaderBar" class="masthead__bar" /></div>
        <div id="mastheadActions" class="masthead__actions">
          <AudienceSwitch variant="bar" />
          <NuxtLink class="mastbar__quote" to="/enquiry">Get a quote</NuxtLink>
          <MenuToggle />
        </div>
      </div>
    </div>

    <NavDrawer />

    <div id="setia-root">
      <GrainOverlay />
      <slot />
    </div>

    <QuoteFab />
  </div>
</template>
