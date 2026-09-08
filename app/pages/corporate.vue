<script setup lang="ts">
/* The quiet register. Dense, fast, crawlable. No GSAP, no scrub: the only
   scripting this page takes is the shared drawer and the .reveal observer. */
import projects from '~~/content/projects.json'
import clients from '~~/content/clients.json'
definePageMeta({ cta: false })
const company = useCompany()
usePageSeo({
  path: '/corporate',
  title: `Corporate & Projects — ${company.displayName} | Commercial HVAC contractor, KL & Selangor`,
  description: `Capability statement for facility and procurement teams: chilled-water systems, VRV/VRF, ducted and split air conditioning, plus electrical wiring, cabling, earthing and lightning protection. CIDB G5, Suruhanjaya Tenaga C Class, ISO 9001:2015. Established ${company.established}, ${company.address.city}, Selangor.`,
  ogImage: '/images/corporate-plant.jpg',
})
const featured = projects.items.filter(p => p.featured)
const strip = clients.items.filter(c => 'strip' in c && c.strip).sort((a: any, b: any) => a.strip - b.strip)
const capabilities = [
  { k: '01 — Air conditioning', title: 'Systems we design, install and maintain', items: [
    'Chilled-water systems: chillers, cooling towers, pumps and distribution',
    'VRV / VRF multi-zone systems',
    'Ducted systems and air-handling units',
    'Split, cassette, ceiling-suspended and wall-mounted units',
    'High-precision cooling for server and equipment rooms',
    'Scheduled preventive maintenance programmes and reactive servicing',
  ] },
  { k: '02 — Electrical', title: 'Infrastructure the cooling depends on', items: [
    'Electrical wiring and distribution for commercial and industrial buildings',
    'Lighting systems, street lighting and feeder pillar cabling',
    'Network, fibre-optic and telephone cabling',
    'Lightning arrestor installation',
    'Earthing and grounding systems',
    'Fire protection system upgrading and detector installation',
  ] },
  { k: '03 — Brands carried', title: 'Supplied, installed and supported', items: [
    'Daikin — authorised dealership, the bulk of our commercial work',
    'Acson, Panasonic, Toshiba',
    'York, Carrier, Fujiaire',
    'Servicing and repair for all unit types, whoever supplied them',
  ] },
  { k: '04 — Maintenance programmes', title: 'How the contracts are structured', items: [
    'Scheduled preventive maintenance, quarterly or half-yearly',
    'Multi-site estate contracts with consolidated reporting',
    'Chemical wash, coil cleaning and refrigerant top-up',
    'Breakdown response for contracted sites',
    'Condition reporting and replacement planning',
  ] },
]
const tenderWa = company.whatsappUrl("Hi Setia Air-Cond, I'd like to discuss a commercial project tender.")
</script>

<template>
  <main class="site">
    <section class="corp-hero">
      <div class="corp-hero__glow" aria-hidden="true" />
      <div class="wrap corp-hero__inner">
        <span class="eyebrow eyebrow--bright">Corporate &amp; Projects</span>
        <h1 class="corp-hero__title">Commercial cooling, <em>delivered at scale.</em></h1>
        <p class="corp-hero__lede">{{ company.legalName }} designs, installs and maintains air conditioning and electrical systems for commercial, industrial and institutional buildings across Kuala Lumpur and Selangor. One contractor for the plant, the distribution and the power behind both — CIDB G5, Suruhanjaya Tenaga C Class, ISO 9001:2015 certified, and doing this since {{ company.established }}.</p>
        <div class="cta__btns">
          <NuxtLink to="/enquiry" class="btn btn--primary">Request a tender pack</NuxtLink>
          <!-- TODO(client): company profile PDF — link goes to the capability statement until the file is supplied -->
          <a href="#capability" class="btn btn--ghost-dark">Download company profile (PDF)</a>
        </div>
      </div>
    </section>

    <section class="corp-cred">
      <div class="wrap corp-cred__row">
        <span class="corp-cred__k">Est. {{ company.established }} · {{ company.yearsInBusiness }}+ years</span>
        <div class="corp-cred__logos" aria-label="Selected clients">
          <span v-for="c in strip" :key="c.name">{{ ('stripName' in c && c.stripName) || c.name }}</span>
        </div>
      </div>
    </section>

    <div class="wrap">
      <section id="projects" class="corp-section">
        <div class="corp-section__head reveal">
          <span class="eyebrow">Featured projects</span>
          <h2 class="corp-section__title">Delivered across <em>retail, banking, industry and education.</em></h2>
          <p class="corp-section__lede">A selection of commercial work. The full project register, with job values and contract years, is on the <NuxtLink to="/projects">projects page</NuxtLink>.</p>
        </div>
        <div class="reveal">
          <ProjectTable :rows="featured" mode="featured" />
        </div>
        <!-- TODO(client): confirm site location and system type for each featured project -->
        <span class="corp-todo">Placeholder: location &amp; system type pending client confirmation</span>
      </section>

      <section id="certifications" class="corp-section">
        <div class="corp-section__head reveal">
          <span class="eyebrow">Certification</span>
          <h2 class="corp-section__title">Registered, graded and <em>audited.</em></h2>
          <p class="corp-section__lede">The registrations a tender board asks for, in one place. Registration numbers are shown against each body.</p>
        </div>
        <CertCards corporate />
      </section>

      <section id="capability" class="corp-section">
        <div class="corp-section__head reveal">
          <span class="eyebrow">Capability</span>
          <h2 class="corp-section__title">What we <em>actually</em> carry in-house.</h2>
          <p class="corp-section__lede">Both disciplines under one contract, so the cooling and the power that runs it are never two separate problems on your site.</p>
        </div>
        <div class="corp-cap">
          <article v-for="(c, i) in capabilities" :key="c.k" :class="['corp-cap__card', 'reveal', i % 2 ? 'reveal--d1' : '']">
            <span class="corp-cap__k">{{ c.k }}</span>
            <h3>{{ c.title }}</h3>
            <ul class="corp-cap__list">
              <li v-for="item in c.items" :key="item">{{ item }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="tender" class="corp-section">
        <div class="corp-tender reveal">
          <div>
            <span class="eyebrow eyebrow--bright">Tender enquiries</span>
            <h2>Send us the drawings. <em>We'll price it.</em></h2>
            <p>For tender documents, bills of quantities, site visits and pre-qualification packs. We'll confirm receipt the same working day.</p>
            <div class="cta__btns">
              <a :href="tenderWa" class="btn btn--light" target="_blank" rel="noopener">WhatsApp the projects team</a>
              <NuxtLink to="/enquiry" class="btn btn--ghost-dark">Submit an enquiry</NuxtLink>
            </div>
          </div>
          <div class="corp-tender__lines">
            <div class="corp-tender__line">
              <span class="corp-tender__label">Projects contact</span>
              <!-- TODO(client): named projects contact -->
              <span class="corp-tender__val">Projects &amp; Tender Desk</span>
            </div>
            <div class="corp-tender__line">
              <span class="corp-tender__label">Direct line</span>
              <span class="corp-tender__val"><a :href="company.phones.main.href">{{ company.phones.main.display }}</a></span>
            </div>
            <div class="corp-tender__line">
              <span class="corp-tender__label">Toll free</span>
              <span class="corp-tender__val"><a :href="company.phones.tollFree.href">{{ company.phones.tollFree.display }}</a></span>
            </div>
            <div class="corp-tender__line">
              <span class="corp-tender__label">Email</span>
              <span class="corp-tender__val"><a :href="`mailto:${company.email}`">{{ company.email }}</a></span>
            </div>
            <div class="corp-tender__line">
              <span class="corp-tender__label">Office</span>
              <span class="corp-tender__val">{{ company.address.line1.replace(' (Ground Floor)', '') }}, {{ company.address.line2 }},<br>{{ company.address.postcode }} {{ company.address.city }}, Selangor</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
