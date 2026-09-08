<script setup lang="ts">
const company = useCompany()
usePageSeo({
  path: '/electrical-services',
  title: `Electrical Services — ${company.displayName}`,
  description: 'Electrical wiring, lighting, network and fibre-optic cabling, telephone systems, lightning arrestors, earthing and grounding — the infrastructure behind your cooling.',
})
const items = [
  { title: 'Electrical Wiring & Infrastructure', text: 'Design and installation of electrical wiring and infrastructure for homes, apartments, shoplots and developments.' },
  { title: 'Lighting Systems', text: 'Interior and street lighting installation, including feeder pillar cabling.' },
  { title: 'Network & Fibre-Optic Cabling', text: 'Structured data, network and fibre-optic cabling for connected buildings.' },
  { title: 'Telephone & Antenna Wiring', text: 'Telephone and antenna wiring for residential and commercial projects.' },
  { title: 'Lightning Arrestors, Earthing & Grounding', text: 'Protection and earthing systems engineered to spec — carrying a lightning strike safely to ground, and giving stray current a safe path so a fault trips the breaker.' },
  { title: 'Fire Protection & Smart-Home Wiring', text: 'Fire-fighting system installation and smart-home system wiring for larger projects.' },
]
</script>

<template>
  <div>
    <PageHero crumb="Electrical" eyebrow="Services · Electrical" lede="Electrical and cabling work for residential, commercial and industrial projects across Malaysia.">
      The infrastructure <em>behind the cooling.</em>
    </PageHero>
    <main id="site" class="site">
      <section class="section">
        <div class="wrap">
          <div class="section__head reveal">
            <span class="eyebrow">Electrical &amp; cabling</span>
            <h2 class="section__title">Electrical services scope.</h2>
            <!-- TODO(client): confirm the full electrical service scope; this list is compiled from Setia's stated capabilities and completed electrical projects -->
            <p class="section__lede tbd-note">Representative scope — full electrical service details to be confirmed with client. Compiled from Setia's stated electrical capabilities and completed electrical projects.</p>
          </div>
          <div class="svc-list">
            <div v-for="(s, i) in items" :key="s.title" class="svc-item reveal">
              <span class="svc-item__n">{{ String(i + 1).padStart(2, '0') }}</span>
              <div><h3>{{ s.title }}</h3><p>{{ s.text }}</p></div>
            </div>
          </div>
          <div class="svc-cross reveal">
            <NuxtLink to="/projects" class="more">See electrical projects we've delivered <IconArrow /></NuxtLink>
          </div>
          <PlainTerms :only="['Lightning arrestors', 'Earthing and grounding']" />
        </div>
      </section>
    </main>
  </div>
</template>
