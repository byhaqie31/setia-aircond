<script setup lang="ts">
import brandCards from '~~/content/brands.json'
const company = useCompany()
usePageSeo({
  path: '/brands',
  title: `Brands — ${company.brands.join(', ')} | ${company.displayName}`,
  description: `The premium air conditioning brands ${company.shortName} supplies and installs across KL & Selangor, with Daikin as the flagship dealership.`,
})
const cards = brandCards.items.filter(c => company.brands.includes(c.name))
const count = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][company.brands.length - 1]
</script>

<template>
  <div>
    <PageHero crumb="Brands" eyebrow="Brands we carry" :lede="`We supply, install and service ${count} of the most trusted air conditioning brands in Malaysia — with Daikin as our flagship dealership.`">
      Premium brands, <em>supplied and installed.</em>
    </PageHero>
    <main id="site" class="site">
      <section class="section">
        <div class="wrap">
          <div class="section__head reveal">
            <span class="eyebrow">Dealerships</span>
            <h2 class="section__title">Authorised dealer for three brands.</h2>
          </div>
          <DealershipBadges />
        </div>
      </section>
      <section class="section" style="padding-top:0">
        <div class="wrap">
          <!-- TODO(client): confirm whether Samsung is still supplied (content/company.json brandsUnconfirmed) -->
          <div class="brand-cards">
            <article v-for="c in cards" :key="c.name" :class="['brand-card', 'reveal', c.lead ? 'brand-card--lead' : '']">
              <span class="brand-card__name">{{ c.name }}</span>
              <span v-if="c.tag" class="brand-card__tag">{{ c.tag }}</span>
              <p>{{ c.text }}</p>
              <NuxtLink v-if="c.lead" to="/air-conditioner-services" class="more">Featured Daikin <IconArrow /></NuxtLink>
            </article>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
