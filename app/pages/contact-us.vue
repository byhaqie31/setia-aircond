<script setup lang="ts">
const company = useCompany()
usePageSeo({
  path: '/contact-us',
  title: `Contact Us — ${company.displayName}`,
  description: `${company.legalName} — ${company.address.line1.replace(' (Ground Floor)', '')}, ${company.address.line2}, ${company.address.city}, Selangor. Call ${company.phones.tollFree.display} or email ${company.email}.`,
})
</script>

<template>
  <div>
    <PageHero crumb="Contact" eyebrow="Contact us" lede="Quotes, servicing, or advice on the right system — one call away.">
      Let's talk <em>cooling.</em>
    </PageHero>
    <main id="site" class="site">
      <section class="section">
        <div class="wrap contact__grid">
          <div class="reveal">
            <div class="contact__co">{{ company.legalName }} <span>({{ company.registration.legacy }})</span></div>
            <div class="contact__rows">
              <div class="contact__row"><span class="contact__k">Address</span><p>{{ company.address.line1 }},<br>{{ company.address.line2 }}, {{ company.address.postcode }} {{ company.address.city }},<br>{{ company.address.state }}, {{ company.address.country }}.</p></div>
              <div class="contact__row"><span class="contact__k">Phone</span><p><a :href="company.phones.secondary.href">{{ company.phones.secondary.display }}</a><br><a :href="company.phones.main.href">{{ company.phones.main.display }}</a><br>Toll Free <a :href="company.phones.tollFree.href">{{ company.phones.tollFree.display }}</a></p></div>
              <div class="contact__row"><span class="contact__k">WhatsApp</span><p><a :href="company.whatsappUrl('Hi Setia Air-Cond, I\'d like to ask about ')" target="_blank" rel="noopener">Message us on WhatsApp</a></p></div>
              <div class="contact__row"><span class="contact__k">Fax</span><p>{{ company.phones.fax.display }}</p></div>
              <div class="contact__row"><span class="contact__k">Email</span><p><a :href="`mailto:${company.email}`">{{ company.email }}</a></p></div>
            </div>
            <NuxtLink to="/enquiry" class="btn btn--primary">Make an enquiry</NuxtLink>
          </div>
          <!-- TODO(client): an embedded map needs the client's decision on Google Maps (third-party script); a static map image is the no-dependency option -->
          <div class="contact__map reveal reveal--d1" aria-label="Map placeholder">
            <div class="contact__map-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span>{{ company.address.city }}, Selangor</span>
              <small>Map placeholder</small>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
