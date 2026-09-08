<script setup lang="ts">
import why from '~~/content/why-choose-us.json'
const company = useCompany()
usePageSeo({
  path: '/about-us',
  title: `About Us — ${company.displayName} | Cooling Malaysia since ${company.established}`,
  description: `${company.legalName} — a wholly Malaysian-owned air conditioning and electrical contractor established in ${company.established}, serving homes, industry and commercial projects nationwide.`,
})
const whyPoints = why.items.filter(p => !isTodo(p.title) && !isTodo(p.text))
const brandsSentence = [...company.brands].join(', ').replace(/, ([^,]*)$/, ' and $1')
</script>

<template>
  <div>
    <PageHero crumb="About" eyebrow="About us" :lede="`A wholly Malaysian-owned air conditioning and electrical company, trusted since ${company.established}.`">
      The air-cond name Malaysia <em>relies on.</em>
    </PageHero>

    <main id="site" class="site">
      <section class="section about">
        <div class="wrap about__grid">
          <div class="about__visual reveal">
            <div class="about__badge">
              <div class="about__year">{{ company.established }}</div>
              <div class="about__since">Cooling Malaysia since</div>
            </div>
          </div>
          <div class="reveal reveal--d1">
            <span class="eyebrow">Who we are</span>
            <h2 class="about__title">Air conditioning &amp; electrical services, nationwide.</h2>
            <p>{{ company.legalName }} is a wholly Malaysian owned private limited company offering Air Conditioning and Electrical Services, in public and private sectors throughout Malaysia. Established in {{ company.established }}, Setia has built a reputation for providing a fast, friendly and professional service, delivering systems which are tailored to optimise project quality, cost and programme objectives.</p>
            <p>Today, we operate throughout Malaysia, servicing projects ranging from small to large scale in both air conditioning and electrical fields. Our field of experience cover all types of air conditioning and electrical services in projects ranging from residential homes to factories, industrial lots, production plants and high rise buildings.</p>
            <!-- TODO(client): confirm whether Samsung is still supplied; it is on the current site's About page but not its homepage -->
            <p>Here at Setia, we have {{ company.experience.manYears }} man years of technical experience between us, our complimentary styles and ranges of experience have produced an exceptionally capable team who is always on par with the ever-changing technology. We are a supplier of some of the most popular brands for air conditioners products in Malaysia including {{ brandsSentence }}.</p>
            <p>We take pride in our delivery, thus you, our client; can be assured that you will be provided with the best service and experience.</p>
            <NuxtLink to="/contact-us" class="btn btn--ghost-light">Talk to our team</NuxtLink>
          </div>
        </div>
      </section>

      <StatRibbon :stats="[
        { num: String(company.established), label: 'Established & trusted' },
        { num: '100', em: true, suffix: '+', label: 'Man-years of technical experience' },
        { num: String(company.brands.length), label: 'Premium aircon brands carried' },
        { num: '2', label: 'Disciplines: cooling + electrical' },
      ]" />

      <section id="VisionMission" class="section">
        <div class="wrap">
          <div class="section__head reveal">
            <span class="eyebrow">Vision &amp; Mission</span>
            <h2 class="section__title">What drives the team.</h2>
            <p class="section__lede">In the company's own words, as published on setiaaircond.com.my.</p>
          </div>
          <!-- TODO(client): sign off the vision and mission text below, carried over verbatim from the current site -->
          <div class="vm-grid">
            <article class="vm-card reveal">
              <span class="vm-card__k">Vision</span>
              <p>Strive to be the best in identifying our client's needs and provide the best solution in air conditioning and electrical matters.</p>
            </article>
            <article class="vm-card reveal reveal--d1">
              <span class="vm-card__k">Mission</span>
              <p>We believe in: offering our clients efficient and reliable service. Offering only safe and environment friendly solutions to reduce environmental impact wherever possible. Our people and their skills and experience to deliver the best solution for each project. Offering only top quality and state-of-the-art technological equipment and material from our reliable partners with whom we have been fostering good relationships for more than a decade.</p>
            </article>
          </div>
        </div>
      </section>

      <!-- TODO(client): three to five "Why Choose Us" speciality points in the company's own words (content/why-choose-us.json) -->
      <section v-if="whyPoints.length" id="why" class="section">
        <div class="wrap">
          <div class="section__head reveal">
            <span class="eyebrow">Why choose us</span>
            <h2 class="section__title">What sets Setia apart.</h2>
          </div>
          <div class="vm-grid">
            <article v-for="(p, i) in whyPoints" :key="p.title" :class="['vm-card', 'reveal', i % 2 ? 'reveal--d1' : '']">
              <span class="vm-card__k">{{ p.title }}</span>
              <p>{{ p.text }}</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
