<script setup lang="ts">
const company = useCompany()
</script>

<template>
  <section class="cta">
    <div class="wrap">
      <div class="cta__box reveal">
        <div class="cta__copy">
          <h2 class="cta__title">Ready for cooling done properly?</h2>
          <p>Tell us about your space — we'll recommend the right system and give you a straight quote. Homes, offices, retail and industrial, across KL and Selangor.</p>
          <div class="cta__btns">
            <NuxtLink to="/enquiry" class="btn btn--light">Make an enquiry</NuxtLink>
            <a :href="company.whatsappUrl('Hi Setia Air-Cond, I\'d like a quote.')" class="btn btn--ghost-dark" target="_blank" rel="noopener">WhatsApp us</a>
            <NuxtLink to="/contact-us" class="btn btn--ghost-dark">Contact us</NuxtLink>
          </div>
        </div>
        <div class="cta__contact">
          <div class="cta__label">Toll Free</div><a :href="company.phones.tollFree.href" class="cta__line">{{ company.phones.tollFree.display }}</a>
          <div class="cta__label">Or call</div><a :href="company.phones.main.href" class="cta__line">{{ company.phones.main.display }}</a>
          <div class="cta__label">Email</div><a :href="`mailto:${company.email}`" class="cta__line">{{ company.email }}</a>
        </div>
      </div>
    </div>
  </section>
</template>
