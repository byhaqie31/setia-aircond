<script setup lang="ts">
import corporate from '~/data/corporate.json'
import { certificateDetailParts } from '~/utils/certificate-detail'

defineProps<{ arriving: boolean }>()
const emit = defineEmits<{ arrived: [] }>()
const heading = useTemplateRef<HTMLHeadingElement>('heading')
const enquiryHref = 'mailto:mail@setiaaircond.com.my?subject=Commercial%20project%20enquiry'
const tenderHref = 'mailto:mail@setiaaircond.com.my?subject=Tender%20pack%20request'

function onTitleEnd(event: AnimationEvent) {
  if (event.animationName === 'residential-title-in') emit('arrived')
}

onMounted(() => heading.value?.focus({ preventScroll: true }))
</script>

<template>
  <main class="corporate-content" :class="{ 'corporate-content--arriving': arriving }" aria-labelledby="corporate-heading">
    <section class="corporate-intro" aria-labelledby="corporate-heading">
      <p class="residential-eyebrow">Corporate &amp; Projects</p>
      <h1 id="corporate-heading" ref="heading" tabindex="-1">
        <span class="corporate-title-text" @animationend="onTitleEnd">Commercial cooling,<br><em>delivered at scale.</em></span>
      </h1>
      <p class="corporate-lede">{{ corporate.description }}</p>
      <div class="corporate-actions">
        <a class="button" :href="tenderHref">Request a tender pack<span class="icon icon--arrow" aria-hidden="true" /></a>
        <a class="corporate-text-link" href="#capability">View our capabilities<span class="icon icon--arrow" aria-hidden="true" /></a>
      </div>
    </section>

    <section class="corporate-clients" aria-label="Selected clients">
      <p>{{ corporate.history }}</p>
      <ul><li v-for="client in corporate.clients" :key="client">{{ client }}</li></ul>
    </section>

    <nav class="corporate-section-nav" aria-label="On this page">
      <a href="#projects">Projects</a>
      <a href="#certifications">Certifications</a>
      <a href="#capability">Capabilities</a>
      <a href="#tender">Tender enquiries<span class="icon icon--arrow" aria-hidden="true" /></a>
    </nav>

    <section id="projects" class="corporate-section" aria-labelledby="projects-heading">
      <div class="corporate-section-head">
        <p class="residential-eyebrow">Featured projects</p>
        <h2 id="projects-heading">Delivered across retail, banking, industry and education.</h2>
        <p>A selection of commercial work. The full project register, with job values and contract years, is on the <a class="corporate-inline-link" href="https://axelnova.my/setiaaircondv2/projects" target="_blank" rel="noopener noreferrer">projects page<span class="sr-only"> (opens in a new tab)</span></a>.</p>
      </div>
      <table class="corporate-projects" role="table" aria-describedby="project-data-note">
        <caption class="sr-only">Selected commercial projects, locations, scopes and system types</caption>
        <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Project</th><th scope="col" role="columnheader">Location</th><th scope="col" role="columnheader">Scope</th><th scope="col" role="columnheader">System type</th></tr></thead>
        <tbody role="rowgroup">
          <tr v-for="project in corporate.projects" :key="project.name" role="row">
            <th scope="row" role="rowheader">{{ project.name }}</th>
            <td role="cell" data-label="Location">{{ project.location }}</td>
            <td role="cell" data-label="Scope">{{ project.scope }}</td>
            <td role="cell" data-label="System type">{{ project.system }}</td>
          </tr>
        </tbody>
      </table>
      <p id="project-data-note" class="corporate-source-note">{{ corporate.projectNote }}</p>
    </section>

    <section id="certifications" class="corporate-section" aria-labelledby="certifications-heading">
      <div class="corporate-section-head">
        <p class="residential-eyebrow">Certification</p>
        <h2 id="certifications-heading">Registered, graded and audited.</h2>
        <p>The registrations a tender board asks for, in one place. Registration numbers are shown against each body.</p>
      </div>
      <div class="corporate-certifications">
        <article v-for="certificate in corporate.certifications" :key="certificate.code" class="corporate-certificate">
          <span class="corporate-certificate-code" aria-hidden="true">{{ certificate.code }}</span>
          <h3>{{ certificate.title }}</h3>
          <p class="corporate-certificate-issuer">{{ certificate.issuer }}</p>
          <p><template v-for="(part, partIndex) in certificateDetailParts(certificate.detail, certificate.highlight)" :key="partIndex"><mark v-if="part.highlight" class="certificate-highlight">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></p>
        </article>
      </div>
    </section>

    <section id="capability" class="corporate-section" aria-labelledby="capability-heading">
      <div class="corporate-section-head">
        <p class="residential-eyebrow">Capability</p>
        <h2 id="capability-heading">What we <em>actually</em> carry in-house.</h2>
        <p>Both disciplines under one contract, so the cooling and the power that runs it are never two separate problems on your site.</p>
      </div>
      <div class="corporate-capabilities">
        <article v-for="capability in corporate.capabilities" :key="capability.label" class="corporate-capability">
          <p class="corporate-label">{{ capability.label }}</p>
          <h3>{{ capability.title }}</h3>
          <ul><li v-for="item in capability.items" :key="item">{{ item }}</li></ul>
        </article>
      </div>
    </section>

    <section id="tender" class="corporate-tender" aria-labelledby="tender-heading">
      <div>
        <p class="residential-eyebrow">Tender enquiries</p>
        <h2 id="tender-heading">Send us the drawings.<br><em>We'll price it.</em></h2>
        <p>{{ corporate.tenderDescription }}</p>
        <div class="corporate-actions">
          <a class="button" :href="corporate.whatsappHref" target="_blank" rel="noopener noreferrer">WhatsApp the projects team<span class="icon icon--arrow" aria-hidden="true" /><span class="sr-only"> (opens in a new tab)</span></a>
          <a class="corporate-text-link" :href="enquiryHref">Submit an enquiry<span class="icon icon--arrow" aria-hidden="true" /></a>
        </div>
      </div>
      <dl class="corporate-contact">
        <div><dt>Projects contact</dt><dd>Projects &amp; Tender Desk</dd></div>
        <div><dt>Direct line</dt><dd><a href="tel:+60356318325">+603-5631 8325</a></dd></div>
        <div><dt>Toll free</dt><dd><a href="tel:1800887412">1-800-88-7412</a></dd></div>
        <div><dt>Email</dt><dd><a href="mailto:mail@setiaaircond.com.my">mail@setiaaircond.com.my</a></dd></div>
        <div><dt>Office</dt><dd><address>No. 4A, Block H, Jalan SS13/1F,<br>47500 Subang Jaya, Selangor</address></dd></div>
      </dl>
    </section>

    <footer class="corporate-footer">
      <div><strong>Setia Air-Cond &amp; Electrical</strong><p>Trusted Daikin air conditioning supplier and electrical contractor in Kuala Lumpur and Selangor since 1990.</p><span>Setia Air-Cond and Electrical Sdn Bhd · Reg. 502557-T</span></div>
      <div class="corporate-footer-contact"><address>No. 4A (Ground Floor), Block H, Jalan SS13/1F,<br>47500 Subang Jaya, Selangor Darul Ehsan, Malaysia.</address><a href="tel:+60356338325">+603-5633 8325</a><span>Fax +603-5632 7072</span></div>
      <NuxtLink class="back-to-building" to="/"><span class="icon icon--arrow icon--back" aria-hidden="true" />Back to building</NuxtLink>
    </footer>
  </main>
</template>

<style scoped>
.corporate-content { max-width: 1240px; margin-inline: auto; padding: 0 var(--page-gutter); color: var(--ink); }
.corporate-intro { max-width: 940px; padding-block: clamp(52px, 7vw, 96px) 64px; }
.corporate-intro h1 { max-width: 860px; margin: 20px 0 24px; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(40px, 5.2vw, 68px); line-height: 1.08; font-weight: 400; letter-spacing: -.035em; }
.corporate-intro h1 span { white-space: normal; }
.corporate-intro h1 em { font-weight: 400; color: var(--pine); }
.corporate-lede { max-width: 76ch; margin: 0; color: var(--ink-soft); font-size: 18px; line-height: 1.7; }
.corporate-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 28px; margin-top: 28px; }
.corporate-actions .button { font-size: 15px; gap: 16px; min-height: 48px; padding: 13px 22px; }
.corporate-text-link { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; padding-block: 10px; font-size: 15px; font-weight: 600; }
.corporate-text-link .icon { width: 18px; height: 18px; transition: transform .25s ease; }
.corporate-text-link:hover .icon { transform: translateX(3px); }
.corporate-text-link:hover, .corporate-inline-link, .corporate-contact a:hover { text-decoration: underline; text-underline-offset: 4px; }
.corporate-clients { padding-block: 24px; border-block: 1px solid var(--line); }
.corporate-clients > p { margin: 0 0 20px; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft); }
.corporate-clients ul { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 20px 28px; list-style: none; margin: 0; padding: 0; }
.corporate-clients li { font-size: 19px; font-weight: 600; letter-spacing: -.02em; }
.corporate-section-nav { display: flex; flex-wrap: wrap; gap: 8px 32px; padding-top: 20px; }
.corporate-section-nav a { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; font-size: 13px; color: var(--ink-soft); }
.corporate-section-nav a:hover { color: var(--pine); text-decoration: underline; text-underline-offset: 5px; }
.corporate-section-nav .icon { width: 15px; height: 15px; }
.corporate-section { padding-block: 80px; border-bottom: 1px solid var(--line); scroll-margin-top: 32px; }
.corporate-section-head { max-width: 700px; margin-bottom: 36px; }
.corporate-section h2, .corporate-tender h2 { margin: 20px 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(32px, 3.5vw, 46px); line-height: 1.14; font-weight: 400; letter-spacing: -.025em; }
.corporate-section-head > p:last-child { margin: 0; max-width: 65ch; font-size: 17px; line-height: 1.65; color: var(--ink-soft); }
.corporate-projects { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6; text-align: left; }
.corporate-projects th, .corporate-projects td { padding: 22px 20px 22px 0; border-bottom: 1px solid var(--line); vertical-align: top; }
.corporate-projects thead th { padding-block: 14px; font-family: 'Space Mono', monospace; text-transform: uppercase; font-size: 10px; letter-spacing: .12em; color: var(--ink-soft); font-weight: 400; }
.corporate-projects th:first-child { width: 22%; }
.corporate-projects th:nth-child(2) { width: 19%; }
.corporate-projects th:nth-child(3) { width: 42%; }
.corporate-projects th:last-child { width: 17%; }
.corporate-projects tbody th { font-size: 15px; font-weight: 600; }
.corporate-projects td { color: var(--ink-soft); }
.corporate-projects td:last-child { padding-right: 0; color: var(--pine); }
.corporate-source-note { margin: 16px 0 0; font-size: 12px; color: var(--ink-soft); }
.corporate-certifications { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 36px 32px; }
.corporate-certificate { padding-top: 24px; border-top: 1px solid var(--line); }
.corporate-certificate-code { display: block; margin-bottom: 24px; font-family: 'Space Mono', monospace; font-size: 20px; letter-spacing: -.03em; color: var(--pine); }
.corporate-certificate h3, .corporate-capability h3 { margin: 0 0 12px; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; line-height: 1.2; font-weight: 400; letter-spacing: -.015em; }
.corporate-certificate p { margin: 12px 0 0; font-size: 14px; line-height: 1.65; color: var(--ink-soft); }
.corporate-certificate .certificate-highlight { padding: 0 2px; color: var(--pine); font-weight: 700; background: linear-gradient(transparent 58%, color-mix(in srgb, var(--green-bright) 30%, transparent) 58%); }
.corporate-certificate .corporate-certificate-issuer { margin-top: 0; font-size: 12px; }
.corporate-capabilities { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px; }
.corporate-capability { padding-top: 24px; border-top: 1px solid var(--line); }
.corporate-label { margin: 0 0 20px; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #147a43; }
.corporate-capability ul { margin: 20px 0 0; padding-left: 18px; display: grid; gap: 12px; color: var(--ink-soft); font-size: 15px; line-height: 1.6; }
.corporate-capability li::marker { color: #147a43; }
.corporate-tender { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 48px; margin-top: 80px; padding: 48px; color: var(--paper); background: var(--pine-900); scroll-margin-top: 32px; }
.corporate-tender .residential-eyebrow { color: var(--green-bright); }
.corporate-tender h2 { margin-top: 20px; }
.corporate-tender > div > p:not(.residential-eyebrow) { max-width: 48ch; color: var(--mist); font-size: 16px; line-height: 1.7; }
.corporate-tender .corporate-actions { gap: 8px 20px; }
.corporate-tender .button { background: var(--paper); color: var(--pine-900); font-size: 14px; padding-inline: 18px; gap: 12px; }
.corporate-tender .button:hover { background: var(--mist); }
.corporate-tender .corporate-text-link { font-size: 14px; }
.corporate-contact { margin: 0; }
.corporate-contact > div { padding-block: 16px; border-bottom: 1px solid #e9f1eb30; }
.corporate-contact > div:first-child { padding-top: 0; }
.corporate-contact dt { margin-bottom: 4px; color: #e9f1ebc7; font-size: 11px; letter-spacing: .05em; }
.corporate-contact dd { margin: 0; font-size: 15px; overflow-wrap: anywhere; }
.corporate-contact a { display: inline-block; min-height: 44px; padding-block: 8px; }
.corporate-contact address, .corporate-footer address { font-style: normal; }
.corporate-footer { display: grid; grid-template-columns: 1fr 1fr; align-items: start; gap: 24px 64px; padding-block: 48px 32px; font-size: 12px; color: var(--ink-soft); }
.corporate-footer strong { font-size: 16px; color: var(--ink); font-weight: 600; }
.corporate-footer p { max-width: 46ch; margin: 12px 0; }
.corporate-footer-contact { display: grid; gap: 8px; }
.corporate-footer-contact a { width: fit-content; min-height: 44px; padding-block: 10px; }
.corporate-footer > .back-to-building { grid-column: 1 / -1; width: fit-content; color: var(--pine); }
.corporate-content--arriving .corporate-intro h1 { overflow: clip; overflow-clip-margin: .08em; }
.corporate-content--arriving .corporate-title-text { animation: residential-title-in .62s cubic-bezier(.16, 1, .3, 1) both; }
.corporate-content--arriving .corporate-lede { animation: residential-copy-in .36s ease-out .1s both; }
.corporate-content--arriving .corporate-actions { animation: residential-copy-in .4s ease-out .16s both; }
.corporate-content--arriving .corporate-clients { animation: residential-fade-in .4s ease-out .2s both; }
@media (max-width: 960px) {
  .corporate-certifications { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .corporate-tender { grid-template-columns: minmax(0, 1fr); gap: 40px; padding: 36px; }
  .corporate-contact { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 32px; }
  .corporate-contact > div:first-child { padding-top: 16px; }
}
@media (max-width: 680px) {
  .corporate-intro { padding-block: 48px 36px; }
  .corporate-intro h1 { font-size: clamp(34px, 7.6vw, 48px); letter-spacing: -.03em; }
  .corporate-lede { font-size: 16px; line-height: 1.65; }
  .corporate-actions { gap: 8px 20px; margin-top: 24px; }
  .corporate-clients ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .corporate-clients li { font-size: 17px; }
  .corporate-section-nav { gap: 0 24px; }
  .corporate-section { padding-block: 52px; }
  .corporate-section-head { margin-bottom: 28px; }
  .corporate-section-head > p:last-child { font-size: 16px; }
  .corporate-projects, .corporate-projects tbody { display: block; }
  .corporate-projects thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .corporate-projects tbody tr { display: grid; gap: 16px; padding-block: 24px; border-top: 1px solid var(--line); }
  .corporate-projects tbody th, .corporate-projects td { display: block; width: auto; border: 0; padding: 0; }
  .corporate-projects tbody th { font-size: 20px; line-height: 1.3; }
  .corporate-projects td::before { content: attr(data-label); display: block; margin-bottom: 4px; font-family: 'Space Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
  .corporate-certifications, .corporate-capabilities { grid-template-columns: minmax(0, 1fr); gap: 28px; }
  .corporate-certificate-code { margin-bottom: 16px; }
  .corporate-tender { margin-top: 52px; padding: 28px 24px; gap: 28px; }
  .corporate-tender .button { white-space: normal; text-align: left; min-width: 0; }
  .corporate-tender .button .icon { width: 18px; height: 18px; }
  .corporate-contact, .corporate-footer { grid-template-columns: minmax(0, 1fr); }
  .corporate-footer { gap: 24px; padding-block: 36px 24px; }
}
</style>
