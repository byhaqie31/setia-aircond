<script setup lang="ts">
import clients from '~~/content/clients.json'
const company = useCompany()
usePageSeo({
  path: '/clientele',
  title: `Clientele — ${company.displayName}`,
  description: `${company.shortName}'s clients include Sony, Maybank, Maxis, Affin Bank, Sime Darby, Siemens, University of Malaya and many more.`,
})
</script>

<template>
  <div>
    <PageHero crumb="Clientele" eyebrow="Clientele" lede="A selection of the organisations that rely on Setia for air conditioning and electrical work.">
      Trusted by Malaysia's <em>leading names.</em>
    </PageHero>
    <main id="site" class="site">
      <section class="section">
        <div class="wrap">
          <!-- TODO(client): current clientele roster with correct legal names (Tesco → Lotus's, Setia → SP Setia, plus the latest additions) -->
          <div class="client-wall reveal">
            <span v-for="c in clients.items" :key="c.name" class="client-tile">{{ c.name }}</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
