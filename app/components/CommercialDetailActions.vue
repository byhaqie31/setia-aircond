<script setup lang="ts">
import { companyContact } from '~/data/company-contact'

const email = companyContact.email
const phone = companyContact.phones.find(item => item.href === 'tel:+60356318325')!
</script>

<template>
  <nav class="commercial-detail-actions" aria-label="Contact Setia">
    <NuxtLink class="commercial-detail-actions__primary" to="/get-a-quote?property=commercial">
      <span>Get a quote</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
    </NuxtLink>
    <a :href="`mailto:${email}`">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="1.5"/><path d="m3 6 9 7 9-7" /></svg>
      <span>Email <small>{{ email }}</small></span>
    </a>
    <a :href="phone.href">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5.5 3.5h3l1.3 4.7-2 1.7a16 16 0 0 0 6.3 6.3l1.7-2 4.7 1.3v3A2.5 2.5 0 0 1 18 21C9.7 20.7 3.3 14.3 3 6A2.5 2.5 0 0 1 5.5 3.5Z" /></svg>
      <span>Call <small>{{ phone.label }}</small></span>
    </a>
  </nav>
</template>

<style scoped>
.commercial-detail-actions { display: flex; flex-wrap: wrap; align-items: stretch; gap: 12px; margin-top: 36px; }
.commercial-detail-actions a { display: inline-flex; align-items: center; gap: 12px; min-height: 54px; padding: 12px 18px; border: 1px solid #bed0c366; color: #f8fbf8; text-decoration: none; font-size: 15px; font-weight: 650; }
.commercial-detail-actions a:hover { background: #ffffff14; border-color: #bed0c3; }
.commercial-detail-actions__primary { background: #20a05e; border-color: #20a05e !important; color: #09271b !important; }
.commercial-detail-actions__primary:hover { background: #4dbb7a !important; }
.commercial-detail-actions svg { width: 22px; height: 22px; flex: 0 0 auto; }
.commercial-detail-actions small { display: block; color: #bed0c3; font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
.commercial-detail-actions__primary svg { margin-left: 16px; }
@media (max-width: 700px) { .commercial-detail-actions { display: grid; grid-template-columns: 1fr; } .commercial-detail-actions a { width: 100%; } }
</style>
