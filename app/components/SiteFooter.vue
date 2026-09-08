<script setup lang="ts">
const company = useCompany()
const nav = useNavigation()
const byPath = Object.fromEntries(nav.menu.map(m => [m.to, m]))
const label = (to: string) => (to === '/contact-us' ? 'Contact us' : to === '/about-us' ? 'About us' : byPath[to]?.label)
</script>

<template>
  <footer class="footer">
    <div class="wrap">
      <div class="footer__grid">
        <div class="footer__brand">
          <span class="footer__brand-name">{{ company.displayName }}</span>
          <p>Trusted Daikin air conditioning supplier and electrical contractor in Kuala Lumpur and Selangor since {{ company.established }}.</p>
          <address class="footer__addr">
            {{ company.address.line1 }}, {{ company.address.line2 }},<br>
            {{ company.address.postcode }} {{ company.address.city }}, {{ company.address.state }}, {{ company.address.country }}.<br>
            <!-- TODO(client): current 12-digit SSM registration number; only the legacy number is on record -->
            Reg. {{ company.registration.legacy }}
          </address>
        </div>
        <div class="footer__col">
          <h2 class="footer__h">Company</h2>
          <ul>
            <li v-for="to in nav.footer.company" :key="to"><NuxtLink :to="to">{{ label(to) }}</NuxtLink></li>
          </ul>
        </div>
        <div class="footer__col">
          <h2 class="footer__h">Explore</h2>
          <ul>
            <li v-for="to in nav.footer.explore" :key="to"><NuxtLink :to="to">{{ label(to) }}</NuxtLink></li>
          </ul>
        </div>
        <div class="footer__contact">
          <h2 class="footer__h">Get in touch</h2>
          <a :href="company.phones.tollFree.href">{{ company.phones.tollFree.display }}</a>
          <a :href="company.phones.main.href">{{ company.phones.main.display }}</a>
          <a :href="company.phones.secondary.href">{{ company.phones.secondary.display }}</a>
          <a :href="`mailto:${company.email}`">{{ company.email }}</a>
          <span class="footer__fax">Fax {{ company.phones.fax.display }}</span>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© {{ company.year }} {{ company.legalName }}. All rights reserved.</span>
        <span class="by">Designed by <b>Axel&nbsp;Nova</b></span>
      </div>
    </div>
  </footer>
</template>
