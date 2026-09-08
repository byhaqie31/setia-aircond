<script setup lang="ts">
import projects from '~~/content/projects.json'
const company = useCompany()
usePageSeo({
  path: '/projects',
  title: `Projects — ${company.displayName}`,
  description: `A selection of completed air conditioning and electrical projects by ${company.shortName}, from Lim Kok Wing and Maxis to Maybank, Goodyear and Sime Darby developments.`,
})
const aircond = projects.items.filter(p => p.discipline === 'air-conditioning')
const electrical = projects.items.filter(p => p.discipline === 'electrical')
</script>

<template>
  <div>
    <PageHero crumb="Projects" eyebrow="Projects" lede="A selection of completed air conditioning and electrical projects for industry, institutions and developments.">
      Work delivered <em>across Malaysia.</em>
    </PageHero>
    <main id="site" class="site">
      <section class="section">
        <div class="wrap">
          <!-- TODO(client): project records 2017 onward; the register ends at 2016 -->
          <div class="proj-block reveal">
            <h2 class="section__title">Air Conditioning</h2>
            <ProjectTable :rows="aircond" mode="register" />
          </div>
          <div class="proj-block reveal">
            <h2 class="section__title">Electrical</h2>
            <ProjectTable :rows="electrical" mode="register" />
          </div>
          <p class="proj-note reveal">* {{ projects.notes.partial }}<br>** {{ projects.notes.confidential }}</p>
          <ProjectGallery />
        </div>
      </section>
    </main>
  </div>
</template>
