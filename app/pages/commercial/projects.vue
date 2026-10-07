<script setup lang="ts">
import { commercialProjectRecords, commercialSources } from '~/data/commercial-view'

const airConditioning = commercialProjectRecords.filter(record => record.discipline === 'air-conditioning')
const electrical = commercialProjectRecords.filter(record => record.discipline === 'electrical')
useHead({
  title: 'All project records | Setia Air-Cond',
  htmlAttrs: { 'data-theme': 'service' },
  meta: [{ name: 'description', content: 'Browse Setia Air-Cond’s published historical air-conditioning and electrical project records.' }],
})
</script>

<template>
  <CommercialDetailLayout>
    <div class="project-register">
      <nav class="project-register__breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Home</NuxtLink><span aria-hidden="true">/</span>
        <NuxtLink to="/commercial?scene=clients">Commercial clients</NuxtLink><span aria-hidden="true">/</span>
        <span aria-current="page">All project records</span>
      </nav>

      <header class="project-register__intro">
        <p class="project-register__eyebrow">The published register</p>
        <h1>Project records.</h1>
        <p>Setia’s historical project register lists eight air-conditioning and eight electrical records. Each entry below opens the published scope, year and disclosed value for that party.</p>
        <p class="project-register__source">Source: <a :href="commercialSources.projects" target="_blank" rel="noopener noreferrer">Setia’s project register<span class="sr-only"> (opens in a new tab)</span></a>. Approximate values and confidentiality notes follow the source.</p>
      </header>

      <section class="project-register__section" aria-labelledby="air-projects-title">
        <div class="project-register__section-heading"><span>01 / 02</span><h2 id="air-projects-title">Air conditioning.</h2></div>
        <ol>
          <li v-for="record in airConditioning" :key="record.id">
            <NuxtLink :to="`/commercial/clients/${record.partyId}?from=projects#project-${record.id}`">
              <span class="project-register__name">{{ record.partyName }}</span>
              <span class="project-register__year">{{ record.yearText }}</span>
              <span class="project-register__scope">{{ record.displayScope }}</span>
              <CommercialDetailArrow class="project-register__arrow" direction="up-right" />
            </NuxtLink>
          </li>
        </ol>
      </section>

      <section class="project-register__section" aria-labelledby="electrical-projects-title">
        <div class="project-register__section-heading"><span>02 / 02</span><h2 id="electrical-projects-title">Electrical.</h2></div>
        <ol>
          <li v-for="record in electrical" :key="record.id">
            <NuxtLink :to="`/commercial/clients/${record.partyId}?from=projects#project-${record.id}`">
              <span class="project-register__name">{{ record.partyName }}</span>
              <span class="project-register__year">{{ record.yearText }}</span>
              <span class="project-register__scope">{{ record.displayScope }}</span>
              <CommercialDetailArrow class="project-register__arrow" direction="up-right" />
            </NuxtLink>
          </li>
        </ol>
      </section>

      <NuxtLink class="project-register__back" to="/commercial?scene=clients"><CommercialDetailArrow direction="left" />Back to the skyline</NuxtLink>
    </div>
    <CompanyEnquirySection heading-id="project-contact-heading" :heading-lines="['Tell us what', 'you need.']" quote-to="/get-a-quote?property=commercial" viewport />
  </CommercialDetailLayout>
</template>

<style scoped>
.project-register { width: min(100% - 2 * clamp(20px, 4vw, 64px), 1280px); margin: auto; padding-bottom: 24px; }
.project-register__breadcrumb { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding-top: 40px; color: #bed0c3; font-size: 13px; }
.project-register__breadcrumb a, .project-register__source a { color: inherit; text-underline-offset: 4px; }
.project-register__intro { max-width: 960px; padding: clamp(52px, 7vw, 112px) 0 clamp(84px, 9vw, 140px); }
.project-register__eyebrow { margin: 0 0 22px; color: #9bdbb6; text-transform: uppercase; font-size: 12px; font-weight: 750; letter-spacing: .16em; }
h1, h2 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-weight: 400; letter-spacing: -.04em; line-height: 1.06; text-wrap: balance; }
h1 { font-size: clamp(60px, 8vw, 120px); }
h2 { font-size: clamp(40px, 5vw, 72px); }
.project-register__intro > p:not(.project-register__eyebrow) { max-width: 63ch; margin: 30px 0 0; color: #e3ede5; font-size: clamp(18px, 1.8vw, 23px); line-height: 1.6; }
.project-register__intro .project-register__source { color: #bed0c3 !important; font-size: 14px !important; }
.project-register__section { margin-bottom: clamp(88px, 12vw, 160px); }
.project-register__section-heading { display: grid; grid-template-columns: minmax(120px, .3fr) 1fr; gap: 30px; padding-top: 25px; border-top: 1px solid #bed0c34d; }
.project-register__section-heading > span { color: #9bdbb6; font-size: 12px; letter-spacing: .14em; }
.project-register ol { margin: 45px 0 0; padding: 0; list-style: none; }
.project-register li { border-top: 1px solid #bed0c34d; }
.project-register li:last-child { border-bottom: 1px solid #bed0c34d; }
.project-register li a { display: grid; grid-template-columns: minmax(0, 1fr) 110px minmax(0, 1.4fr) 20px; align-items: start; gap: clamp(14px, 3vw, 45px); min-height: 98px; padding: 23px 0; color: #f8fbf8; text-decoration: none; }
.project-register li a:hover .project-register__name, .project-register li a:hover .project-register__arrow { color: #9bdbb6; }
.project-register__name { font-size: clamp(17px, 1.5vw, 21px); font-weight: 650; line-height: 1.3; }
.project-register__year, .project-register__scope { color: #bed0c3; font-size: 14px; line-height: 1.55; }
.project-register__arrow { font-size: 23px; }
.project-register__back { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; margin-top: 64px; color: #bed0c3; text-underline-offset: 5px; }
@media (max-width: 850px) { .project-register li a { grid-template-columns: 1fr auto; gap: 8px 20px; } .project-register__name { grid-column: 1; } .project-register__year { grid-column: 1; grid-row: 2; } .project-register__scope { grid-column: 1; grid-row: 3; } .project-register__arrow { grid-column: 2; grid-row: 1; } }
@media (max-width: 600px) { .project-register__section-heading { grid-template-columns: 1fr; gap: 18px; } }
</style>
