<script setup lang="ts">
const company = useCompany()
usePageSeo({
  path: '/air-conditioner-services',
  title: `Air Conditioning Services — ${company.displayName} | Daikin, KL & Selangor`,
  description: 'Design, installation, upgrade, repair and preventive maintenance of air conditioning systems for homes and commercial spaces across KL & Selangor.',
})
const brandsSentence = [...company.brands].join(', ').replace(/, ([^,]*)$/, ' and $1')
const items = [
  { title: 'Design of Air-Cond Systems', text: 'Sizing and system design tailored to your space, load and budget.' },
  { title: 'New Air-Cond Installation', text: 'Professional installation of split, multi-split, cassette and ducted systems.' },
  { title: 'Air-Cond Upgrade or Replacement', text: 'Swapping ageing units for efficient inverter systems with minimal disruption.' },
  { title: 'Troubleshooting & Repair Service', text: 'Fast diagnosis and repair to get cooling back online.' },
  { title: 'Preventive Maintenance', text: 'Scheduled servicing that keeps units running smoothly and lasting longer — regular visits that catch small faults before they become breakdowns.' },
]
</script>

<template>
  <div>
    <PageHero crumb="Air Conditioning" eyebrow="Services · Air Conditioning" lede="From a single split unit at home to full commercial systems — designed, installed, and maintained by one team.">
      Cooling, handled <em>end to end.</em>
    </PageHero>
    <main id="site" class="site">
      <section class="section">
        <div class="wrap">
          <div class="section__head reveal">
            <span class="eyebrow">Residential &amp; commercial</span>
            <h2 class="section__title">Our air conditioning services.</h2>
            <p class="section__lede">A complete scope of work for homes, offices, retail and industrial spaces — supplying and supporting {{ brandsSentence }}.</p>
          </div>
          <div class="svc-list">
            <div v-for="(s, i) in items" :key="s.title" class="svc-item reveal">
              <span class="svc-item__n">{{ String(i + 1).padStart(2, '0') }}</span>
              <div><h3>{{ s.title }}</h3><p>{{ s.text }}</p></div>
            </div>
          </div>
          <div class="svc-cross reveal">
            <NuxtLink to="/electrical-services" class="more">Looking for electrical &amp; cabling? <IconArrow /></NuxtLink>
            <NuxtLink to="/brands" class="more">See the brands we carry <IconArrow /></NuxtLink>
          </div>
          <PlainTerms :only="['Chilled water', 'VRV / VRF', 'Ducted systems', 'Preventive maintenance']" />
        </div>
      </section>
    </main>
  </div>
</template>
