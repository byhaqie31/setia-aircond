<script setup lang="ts">
const company = useCompany()
usePageSeo({
  path: '/certifications',
  title: `Certifications — ${company.displayName}`,
  description: `CIDB G5, Suruhanjaya Tenaga C-Class, Daikin dealership, ISO 9001:2015 and Million Ringgit Sales Award — ${company.shortName}'s certifications.`,
})
</script>

<template>
  <div>
    <PageHero crumb="Certifications" eyebrow="Accreditation" lede="The accreditations behind every Setia installation and electrical job.">
      Certified, licensed, <em>and proven.</em>
    </PageHero>
    <main id="site" class="site">
      <section class="section">
        <div class="wrap">
          <CertCards />
        </div>
      </section>
    </main>
  </div>
</template>
