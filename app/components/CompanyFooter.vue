<template>
  <footer class="company-footer service-end company-width">
    <NuxtLink class="service-end__brand" to="/" aria-label="Setia Air-Cond and Electrical home"><SetiaWordmark /></NuxtLink>
  </footer>
</template>

<style scoped>
.company-footer { --company-content-width: 1240px; display: flex; flex-shrink: 0; align-items: center; width: min(100% - var(--page-gutter) * 2, var(--company-content-width)); margin-inline: auto; padding: 14px 0 64px; border-top: 1px solid #bed0c338; color: #bed0c3; font-size: 12px; }
.company-footer a { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; }
.company-footer .service-end__brand { font-size: 28px; font-weight: 800; letter-spacing: -.025em; color: #f5f5ed; }
@media (max-width: 850px) {
  .company-footer { --company-content-width: 680px; }
}
@media (max-width: 700px) {
  .company-footer { font-size: 11px; }
  .company-footer .service-end__brand { font-size: 20px; }
}
</style>
