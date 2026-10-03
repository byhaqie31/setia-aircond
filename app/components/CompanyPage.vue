<script setup lang="ts">
defineProps<{ current: 'about' | 'quote' }>()
</script>

<template>
  <div class="company-page">
    <a class="skip-link" href="#page-content">Skip to content</a>
    <header class="company-header">
      <div class="service-header company-header__inner company-width">
        <NuxtLink class="service-identity" to="/" aria-label="Setia Air-Cond and Electrical home"><SetiaWordmark class="service-brand" /></NuxtLink>
        <nav aria-label="Main navigation">
          <NuxtLink v-if="current === 'about'" class="service-quote" to="/get-a-quote">Get a quote<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
          <NuxtLink v-else class="service-quote" to="/about-us">About us<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
        </nav>
      </div>
    </header>
    <main id="page-content" tabindex="-1"><slot /></main>
    <CompanyFooter />
  </div>
</template>

<style>
.company-page { min-height: 100svh; background: var(--service-stage); color: var(--paper); --company-muted: #bed0c3; --company-line: #bed0c34d; }
.company-page :focus-visible { outline: 2px solid #d1e4d7; outline-offset: 5px; }
.company-page #page-content:focus-visible { outline: none; }
.company-page ::selection { background: #d1e4d7; color: var(--service-stage); }
.company-page h1, .company-page h2 { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; line-height: 1.04; letter-spacing: -.035em; text-wrap: balance; }
.company-page h1 { margin: 0; font-size: clamp(48px, 6vw, 88px); }
.company-page h2 { margin: 0 0 28px; font-size: clamp(36px, 4vw, 60px); }
.company-page p { line-height: 1.7; }
.company-page .company-header { position: relative; z-index: 4; width: 100%; }
.company-page .company-header__inner { min-height: 64px; padding: 8px 0; }
.company-width { width: min(100% - var(--page-gutter) * 2, var(--company-content-width, 1240px)); margin-inline: auto; }
.company-intro { padding-block: clamp(56px, 8vw, 120px) clamp(56px, 7vw, 96px); }
.company-intro p { max-width: 54ch; margin: 28px 0 0; color: var(--company-muted); font-size: clamp(17px, 1.4vw, 20px); }
.company-link { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; text-decoration: underline; text-decoration-color: #bed0c380; text-underline-offset: 5px; }
.company-link .icon { width: 18px; height: 18px; }
.company-link:hover { text-decoration-color: currentColor; }
@media (prefers-reduced-motion: no-preference) {
  .company-intro { animation: company-arrive .65s cubic-bezier(.16, 1, .3, 1) both; }
  @keyframes company-arrive { from { opacity: .35; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
}
</style>
