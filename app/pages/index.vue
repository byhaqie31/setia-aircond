<script setup lang="ts">
import { startLanding } from '~/utils/hero-engine.js'
import clients from '~~/content/clients.json'
definePageMeta({ layout: 'landing' })
const company = useCompany()

/* GSAP + ScrollTrigger, client-only by construction: a dynamic import inside
   onMounted, from this page's chunk. Kept out of any plugin on purpose — a
   plugin lives in the entry bundle, and Nuxt then emitted prefetch links for
   the GSAP chunk on every route, corporate included. Here the chunk belongs to
   the landing alone and never executes during prerender. */
let gsapPending: Promise<{ gsap: any; ScrollTrigger: any } | null> | null = null
function loadGsap() {
  if (!gsapPending) {
    gsapPending = Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([g, st]) => ({ gsap: g.gsap || g.default, ScrollTrigger: st.ScrollTrigger || st.default }))
      .catch(() => null)
  }
  return gsapPending
}

usePageSeo({
  path: '/',
  title: `${company.displayName} — Every building has a pulse. We keep it cool. | Daikin, KL & Selangor`,
  description: `Commercial and residential air conditioning and electrical systems for Kuala Lumpur and Selangor — engineered, installed and maintained since ${company.established}. ${company.brands.join(', ')}.`,
  ogImage: '/images/spaces-diptych.jpg',
})

/* The loading counter plays ONCE PER SESSION. Read before first paint so a
   returning visitor never catches a frame of dark veil or a stale 0%. */
const INTRO_SCRIPT = "try{window.__setiaIntroRan=true;if(sessionStorage.getItem('setia.introSeen'))document.documentElement.classList.add('intro-seen');else sessionStorage.setItem('setia.introSeen','1')}catch(e){}"
useHead({ script: [{ innerHTML: INTRO_SCRIPT, tagPriority: 'critical' }] })

const heroClients = clients.items.filter(c => 'hero' in c && c.hero).sort((a: any, b: any) => a.hero - b.hero)
const pillarClients = clients.items.filter(c => 'hero' in c && c.hero).map(c => ('pillarName' in c && c.pillarName) || c.name)
const brandsSentence = [...company.brands].join(', ').replace(/, ([^,]*)$/, ' and $1')

let engine: { destroy: () => void } | null = null
onMounted(() => {
  const w = window as any
  if (!w.__setiaIntroRan) {
    try {
      if (sessionStorage.getItem('setia.introSeen')) document.documentElement.classList.add('intro-seen')
      else sessionStorage.setItem('setia.introSeen', '1')
    } catch { /* storage unavailable: play the intro */ }
  }
  w.__setiaIntroRan = false
  document.body.classList.remove('header-revealed')
  engine = startLanding({ loadGsap })
  revealAll()
})
onBeforeUnmount(() => {
  engine?.destroy()
  engine = null
  document.body.classList.remove('header-revealed')
})
</script>

<template>
  <div>
    <!-- ===================== 1. HERO — the sticky building =====================
         700vh of native scroll over a sticky stage. Every chapter is real text:
         the h1 lives here, and nothing in this section is hidden from a crawler. -->
    <section id="hero" class="hero-track" :aria-label="`${company.shortName} — commercial cooling since ${company.established}`">
      <div id="heroStage" class="hero-stage">
        <div id="heroScene" class="hero-scene">
          <div class="hero-sky" aria-hidden="true" />
          <div id="heroStars" class="hero-stars" aria-hidden="true" />
          <div id="heroCity" class="hero-layer hero-city" aria-hidden="true" />

          <div id="heroFrame" class="hero-frame">
            <i id="heroFrameL" class="hero-frame__line hero-frame__line--l" aria-hidden="true" />
            <i id="heroFrameT" class="hero-frame__line hero-frame__line--t" aria-hidden="true" />
            <i id="heroFrameR" class="hero-frame__line hero-frame__line--r" aria-hidden="true" />
            <div class="hero-frame__inner">
              <span class="hero-frame__k">Established</span>
              <div class="hero-frame__y">{{ company.established }}</div>
            </div>
          </div>

          <div id="heroBuilding" class="hero-layer hero-building" aria-hidden="true">
            <div class="hero-plate">
              <picture>
                <source srcset="/images/building-hero-unlit.webp" type="image/webp">
                <img src="/images/building-hero-unlit.png" alt="" width="1915" height="364" fetchpriority="high">
              </picture>
              <picture id="heroLit" class="hero-pic--lit">
                <source srcset="/images/building-hero.webp" type="image/webp">
                <img src="/images/building-hero.png" alt="" width="1915" height="364" fetchpriority="high">
              </picture>
              <div id="heroDim" class="hero-dim" aria-hidden="true" />
              <div id="heroGlow" class="hero-glow" aria-hidden="true" />
            </div>
          </div>

          <div id="heroFg" class="hero-layer hero-fg" aria-hidden="true" />
        </div>

        <div class="hero-hud">
          <div class="hero-hud__temp" aria-hidden="true">
            <div class="hero-hud__v"><span id="heroTemp">33</span><b>°C</b></div>
            <div id="heroMode" class="hero-hud__m">KL · Evening</div>
          </div>
        </div>

        <div id="heroChapters" class="hero-chapters">
          <!-- 1 · THE PROMISE -->
          <div id="heroCh1" class="hero-ch hero-ch--promise">
            <h1 class="hero-ch__title">
              <span class="hero-line"><span>Every building has a pulse.</span></span>
              <span class="hero-line"><span><em>We keep it cool.</em></span></span>
            </h1>
            <p class="hero-ch__sub">Air-conditioning and electrical systems for commercial and residential spaces across Kuala Lumpur and Selangor — supplied, installed and maintained since {{ company.established }}.</p>
            <div id="heroChips" class="hero-chips">
              <span class="hero-chip">01 · Air conditioning</span>
              <span class="hero-chip">02 · Electrical &amp; cabling</span>
            </div>
          </div>

          <!-- 2 · THE PROOF -->
          <div id="heroCh2" class="hero-ch hero-ch--proof">
            <div class="hero-proof">
              <span class="hero-proof__k">Trusted at scale</span>
              <div id="heroLogos" class="hero-brands">
                <span v-for="c in heroClients" :key="c.name">{{ c.name }}</span>
              </div>
              <NuxtLink id="heroFork" class="hero-fork" to="/clientele">See the full client list <i aria-hidden="true">&rarr;</i></NuxtLink>
              <p class="hero-proof__note">Serving Kuala Lumpur &amp; Selangor · {{ company.yearsInBusiness }}+ years.</p>
            </div>
          </div>

          <!-- 3 · THE ACTION: the two registers side by side -->
          <div id="heroCh3" class="hero-ch hero-ch--action">
            <h2 class="hero-ch__title hero-ch__title--pair">One team for <em>every space.</em></h2>
            <aside id="heroSpaces" class="hero-card">
              <div class="hero-card__pic">
                <picture>
                  <source srcset="/images/spaces-diptych.webp" type="image/webp">
                  <img src="/images/spaces-diptych.jpg" alt="Wall-mounted split unit cooling a living room beside a ceiling cassette cooling a cafe workspace" width="1400" height="788" loading="lazy" decoding="async">
                </picture>
              </div>
              <div class="hero-card__body">
                <span class="hero-card__k">Commercial &amp; residential</span>
                <p>A split unit for the living room or cassettes across a shopfloor: the right system for every space, supplied, installed and maintained.</p>
                <a class="btn btn--primary btn--sm" href="#services">Explore more</a>
              </div>
            </aside>
            <aside id="heroCard" class="hero-card">
              <div class="hero-card__pic">
                <picture>
                  <source srcset="/images/corporate-plant.webp" type="image/webp">
                  <img src="/images/corporate-plant.jpg" alt="Engineer with a tablet checking chillers in a plant room" width="1200" height="685" loading="lazy" decoding="async">
                </picture>
              </div>
              <div class="hero-card__body">
                <span class="hero-card__k">Corporate &amp; projects</span>
                <p>Chilled water, VRV/VRF and ducted systems for facility managers and tender boards — with the electrical scope to match.</p>
                <NuxtLink class="btn btn--primary btn--sm" to="/corporate">View corporate capabilities</NuxtLink>
              </div>
            </aside>
          </div>
        </div>

        <div id="heroRelease" class="hero-release" aria-hidden="true" />
        <div id="heroHint" class="track-hint" aria-hidden="true">Scroll<i /></div>
      </div>
    </section>

    <!-- ===================== 2. RELEASE ===================== -->
    <main id="site" class="site">
      <StatRibbon :stats="[
        { num: String(company.yearsInBusiness), em: true, suffix: '+', label: 'Years of cooling Malaysia' },
        { num: String(company.established), label: 'Established & trusted' },
        { num: String(company.brands.length), label: 'Premium aircon brands carried' },
        { num: '2', label: 'Disciplines: cooling + electrical' },
      ]" />

      <section id="services" class="section">
        <div class="wrap">
          <div class="section__head reveal">
            <span class="eyebrow">What we do</span>
            <h2 class="section__title">Two disciplines, one standard of work.</h2>
            <p class="section__lede">From a single split unit at home to full commercial systems and the cabling behind them — handled end to end by one team.</p>
          </div>
          <div class="svc-grid">
            <article class="svc-card reveal">
              <span class="svc-card__idx">01 — Cooling</span>
              <div class="svc-card__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5L4.2 17.5M12 5l3 1.5M12 5L9 6.5M12 19l3-1.5M12 19l-3-1.5M5 9.5l.5 3.3M19 9.5l-.5 3.3" /></svg></div>
              <h3 class="svc-card__title">Air Conditioning</h3>
              <!-- §6.3: brand-neutral services copy; Daikin stays in titles, on /brands and in the dealership badges -->
              <p>Professional installation and maintenance for home and commercial customers across KL and Selangor. State-of-the-art solutions customised to your space, with preventive maintenance plans <span class="gloss">(regular scheduled servicing)</span> that keep units running smoothly and lasting longer. We carry {{ brandsSentence }}.</p>
              <NuxtLink to="/air-conditioner-services" class="more">View air conditioning <IconArrow /></NuxtLink>
            </article>
            <article class="svc-card reveal reveal--d1">
              <span class="svc-card__idx">02 — Electrical</span>
              <div class="svc-card__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10.5H13l0-8.5z" /></svg></div>
              <h3 class="svc-card__title">Electrical &amp; Cabling</h3>
              <p>Design and installation of electrical wiring, lighting systems, network and fibre-optic cabling, telephone systems, lightning arrestors <span class="gloss">(lightning protection for your roof)</span>, earthing and grounding <span class="gloss">(the safe path that makes a fault trip the breaker)</span>. The infrastructure your cooling depends on, done to spec and built to last.</p>
              <NuxtLink to="/electrical-services" class="more">View electrical work <IconArrow /></NuxtLink>
            </article>
          </div>

          <div id="clientele" class="pillars">
            <NuxtLink class="pillar reveal" to="/corporate">
              <div class="pillar__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h0M15 9h0M9 13h0M15 13h0" /></svg></div>
              <h4>Corporate &amp; Projects</h4>
              <p>Capability statement, featured projects and tender contact for facility and procurement teams.</p>
            </NuxtLink>
            <NuxtLink class="pillar reveal" to="/clientele">
              <div class="pillar__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87" /></svg></div>
              <h4>Clientele</h4>
              <p>Trusted by {{ pillarClients.join(', ') }} and more.</p>
            </NuxtLink>
            <NuxtLink class="pillar reveal" to="/brands">
              <div class="pillar__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" /></svg></div>
              <h4>Brands</h4>
              <p>{{ brandsSentence }} — supplied and installed.</p>
            </NuxtLink>
            <NuxtLink class="pillar reveal" to="/contact-us">
              <div class="pillar__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg></div>
              <h4>Contact</h4>
              <p>One call away for quotes, servicing or advice on the right unit for your space.</p>
            </NuxtLink>
          </div>
        </div>
      </section>

      <section id="brands" class="brands">
        <div class="wrap brands__inner reveal">
          <span class="eyebrow eyebrow--bright eyebrow--center">Brands we carry</span>
          <h2 class="brands__title">Premium air conditioning brands, supplied and installed.</h2>
          <div class="brand-marquee" aria-label="Brands we carry">
            <div class="brand-marquee__track">
              <span v-for="b in company.brands" :key="b" class="brand-logo">{{ b }}</span>
              <span v-for="b in company.brands" :key="`dup-${b}`" class="brand-logo" aria-hidden="true">{{ b }}</span>
            </div>
          </div>
          <DealershipBadges />
          <NuxtLink to="/brands" class="more more--ondark" style="margin-top:46px">View all brands <IconArrow /></NuxtLink>
        </div>
      </section>

      <CtaBlock />
      <SiteFooter />
    </main>
  </div>
</template>
