<script setup lang="ts">
const company = useCompany()
const site = useRuntimeConfig().public.siteUrl

/* LocalBusiness, once, on every page, from the shared config. */
const ld = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: company.legalName,
  alternateName: company.displayName,
  description: 'Air conditioning and electrical contractor serving commercial, industrial and residential clients in Kuala Lumpur and Selangor. Chilled-water systems, VRV/VRF, ducted and split air conditioning, electrical wiring, cabling, earthing and lightning protection.',
  foundingDate: String(company.established),
  url: `${site}/`,
  email: company.email,
  telephone: company.phones.main.display,
  faxNumber: company.phones.fax.display,
  address: {
    '@type': 'PostalAddress',
    streetAddress: `${company.address.line1}, ${company.address.line2}`,
    addressLocality: company.address.city,
    addressRegion: company.address.state,
    postalCode: company.address.postcode,
    addressCountry: company.address.countryCode,
  },
  areaServed: company.areasServed.map(name => ({ '@type': 'AdministrativeArea', name })),
  knowsAbout: [
    'Chilled water systems', 'VRV and VRF air conditioning', 'Ducted air conditioning',
    'Split air conditioning', 'Preventive maintenance', 'Electrical wiring',
    'Network and fibre-optic cabling', 'Lightning arrestor', 'Earthing and grounding',
  ],
  brand: company.brands,
  contactPoint: [{
    '@type': 'ContactPoint',
    contactType: 'sales',
    telephone: company.phones.tollFree.display,
    email: company.email,
    areaServed: 'MY',
    availableLanguage: ['en', 'ms'],
  }],
}

useHead({
  script: [
    /* Set before first paint so the JS-off CSS fallbacks (drawer open in the
       flow, hero as a still, reveals visible) only apply when scripting really
       is off. Must stay inline and first. */
    { innerHTML: "document.documentElement.classList.add('js')", tagPriority: 'critical' },
    { type: 'application/ld+json', innerHTML: JSON.stringify(ld) },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
