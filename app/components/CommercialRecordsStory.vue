<script setup lang="ts">
import corporate from '~/data/corporate.json'
import { certificateDetailParts } from '~/utils/certificate-detail'
import CommercialLogo from '~/components/CommercialLogo.vue'
import { commercialCompanyLogos, commercialCredentialLogos } from '~/data/commercial-logos'
import { commercialBrandLogos } from '~/data/commercial-motion'
import { commercialRecordAt, commercialRecordGroupAt, type CommercialRecordGroup } from '~/utils/commercial-records'

const props = defineProps<{ enhanced: boolean; pinned: boolean; progress: number }>()
const animated = computed(() => props.enhanced && props.pinned)
const capabilityBoards = [[0, 1], [3, 2]]
const capabilityName = (index: number) => corporate.capabilities[index]!.label.split(' — ')[1]
const boardVisible = (indices: number[]) => indices.some(index => recordState('capability', index).visible)
const groupState = (group: CommercialRecordGroup) => commercialRecordGroupAt(props.progress, group)
const recordState = (group: CommercialRecordGroup, index: number) => commercialRecordAt(props.progress, group, index)
function groupStyle(group: CommercialRecordGroup) {
  if (!animated.value) return undefined
  const state = groupState(group)
  return { '--group-opacity': state.opacity, '--group-reveal': state.reveal }
}
function recordStyle(group: CommercialRecordGroup, index: number) {
  if (!animated.value) return undefined
  const state = recordState(group, index)
  return { '--record-opacity': state.opacity, '--record-reveal': state.reveal, '--record-exit': state.exit }
}
</script>

<template>
  <div class="records" :class="{ 'records--animated': animated, 'records--dark': enhanced }">
    <section id="projects" class="records-group" tabindex="-1" :style="groupStyle('projects')"
      :inert="animated && !groupState('projects').visible" :aria-hidden="animated && !groupState('projects').visible || undefined" aria-labelledby="commercial-projects-heading">
      <header class="records-heading"><h2 class="service-section-heading" id="commercial-projects-heading">Work, in place.</h2></header>
      <div class="records-scenes">
        <article v-for="(project, index) in corporate.projects" :id="`commercial-project-${index + 1}`" :key="project.name"
          class="records-scene records-project" :style="recordStyle('projects', index)" data-record-reveal
          :inert="animated && !recordState('projects', index).visible" :aria-hidden="animated && !recordState('projects', index).visible || undefined" :aria-labelledby="`project-name-${index}`">
          <div class="records-mark"><CommercialLogo :logo="commercialCompanyLogos[project.name]!" :name="project.name" :dark="enhanced" /></div>
          <h3 :id="`project-name-${index}`" class="records-company">{{ project.name }}</h3>
          <p class="records-project-scope">{{ project.scope }}</p>
          <dl class="records-project-meta"><div><dt>Location</dt><dd>{{ project.location }}</dd></div><div><dt>System</dt><dd>{{ project.system }}</dd></div></dl>
        </article>
      </div>
      <footer class="records-footnote"><p>Project locations and system types are pending client confirmation.</p><a href="https://axelnova.my/setiaaircondv2/projects" target="_blank" rel="noopener noreferrer">Full project register<span class="icon icon--arrow" aria-hidden="true" /><span class="sr-only"> (opens in a new tab)</span></a></footer>
    </section>

    <section id="certifications" class="records-group records-credentials" tabindex="-1" :style="groupStyle('certifications')"
      :inert="animated && !groupState('certifications').visible" :aria-hidden="animated && !groupState('certifications').visible || undefined" aria-labelledby="commercial-credentials-heading">
      <header class="records-heading"><h2 class="service-section-heading" id="commercial-credentials-heading">Registered, graded<br>and audited.</h2></header>
      <div class="credential-grid">
        <article v-for="(certificate, index) in corporate.certifications" :key="certificate.code" class="records-certificate" :style="recordStyle('certifications', index)" data-record-reveal
          :inert="animated && !recordState('certifications', index).visible" :aria-hidden="animated && !recordState('certifications', index).visible || undefined" :aria-labelledby="`certificate-name-${index}`">
          <div class="records-mark">
            <CommercialLogo v-if="commercialCredentialLogos[certificate.code]" :logo="commercialCredentialLogos[certificate.code]!" :name="certificate.title" :dark="enhanced" />
            <span v-else class="records-standard">ISO 9001:2015</span>
          </div>
          <h3 :id="`certificate-name-${index}`">{{ certificate.title }}</h3>
          <p class="records-issuer">{{ certificate.issuer }}</p>
          <p class="records-certificate-detail"><template v-for="(part, partIndex) in certificateDetailParts(certificate.detail, certificate.highlight)" :key="partIndex"><mark v-if="part.highlight" class="certificate-highlight">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></p>
        </article>
      </div>
    </section>

    <section id="capability" class="records-group records-capabilities" tabindex="-1" :style="groupStyle('capability')"
      :inert="animated && !groupState('capability').visible" :aria-hidden="animated && !groupState('capability').visible || undefined" aria-labelledby="commercial-scope-heading">
      <header class="records-heading"><h2 class="service-section-heading" id="commercial-scope-heading">Both disciplines.<br>One contract.</h2><p>Cooling and the power that runs it, coordinated for your site.</p></header>
      <div class="capability-boards">
        <div v-for="(indices, board) in capabilityBoards" :key="board" class="capability-board" :class="{ 'capability-board--support': board === 1 }"
          :inert="animated && !boardVisible(indices)" :aria-hidden="animated && !boardVisible(indices) || undefined">
          <article v-for="index in indices" :key="index" class="capability-column" :class="{ 'capability-column--brands': index === 2 }"
            :style="recordStyle('capability', index)" data-record-reveal
            :inert="animated && !recordState('capability', index).visible" :aria-hidden="animated && !recordState('capability', index).visible || undefined" :aria-labelledby="`capability-name-${index}`">
            <h3 :id="`capability-name-${index}`">{{ capabilityName(index) }}</h3>
            <p class="records-capability-title">{{ corporate.capabilities[index]!.title }}</p>
            <ul v-if="index === 2" class="records-brand-grid" aria-label="Brands carried"><li v-for="brand in commercialBrandLogos" :key="brand.name"><CommercialLogo :logo="brand" :name="brand.name" :dark="enhanced" /></li></ul>
            <ul class="records-capability-items"><li v-for="item in corporate.capabilities[index]!.items" :key="item">{{ item }}</li></ul>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.records { color: var(--pine-900); background: var(--paper); }
.records--dark { color: #f5f5ed; background: #0b3022; }
.records-group { padding: 80px var(--page-gutter); }
.records-heading { text-align: center; }
.records-heading h2 { margin: 0; }
.records-heading p { color: var(--ink-soft); max-width: 42ch; margin: 20px auto 0; font-size: 15px; line-height: 1.6; }
.records-scenes { margin-top: 56px; }
.records-scene { max-width: 1000px; margin: 0 auto; padding: 48px 0; text-align: center; border-bottom: 1px solid var(--line); }
.records-mark { --logo-height: 104px; --logo-width: 350px; }
.records-company { margin: 20px 0 0; font-size: 14px; line-height: 1.4; font-weight: 400; letter-spacing: .02em; color: var(--ink-soft); }
.records-project-scope { max-width: 42ch; margin: 36px auto; font-size: clamp(21px, 2.3vw, 34px); line-height: 1.35; letter-spacing: -.02em; text-wrap: balance; }
.records-project-meta { display: flex; justify-content: center; gap: 64px; margin: 0; }
.records-project-meta dt { margin-bottom: 8px; color: var(--ink-soft); font-size: 12px; }
.records-project-meta dd { margin: 0; font-size: 15px; line-height: 1.5; }
.records-footnote { display: flex; align-items: center; justify-content: space-between; gap: 32px; margin-top: 28px; color: var(--ink-soft); font-size: 12px; line-height: 1.5; }
.records-footnote p { margin: 0; }
.records-footnote a { display: inline-flex; align-items: center; gap: 16px; min-height: 44px; }
.records-footnote .icon { width: 16px; height: 16px; }
.records :is(a, [tabindex]):focus-visible { outline: 2px solid currentColor; outline-offset: 5px; }
.credential-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px 48px; max-width: 1200px; margin: 64px auto 0; }
.records-certificate { min-width: 0; padding: 0 0 24px; border-bottom: 1px solid var(--line); text-align: center; }
.records-certificate .records-mark { --logo-height: 56px; --logo-width: 220px; min-height: 56px; display: grid; align-items: center; }
.records-certificate h3 { margin: 20px 0 0; font-size: 18px; line-height: 1.3; font-weight: 500; text-wrap: balance; }
.records-standard { font-size: clamp(24px, 2.4vw, 34px); font-weight: 600; letter-spacing: -.03em; }
.records-issuer { margin: 8px 0 0; color: var(--ink-soft); font-size: 12px; line-height: 1.4; }
.records-certificate-detail { max-width: 38ch; margin: 16px auto 0; font-size: 14px; line-height: 1.5; text-wrap: pretty; }
.records-certificate-detail .certificate-highlight { padding: 0 2px; color: inherit; font-weight: 700; background: linear-gradient(transparent 58%, color-mix(in srgb, var(--green-bright) 38%, transparent) 58%); }
.capability-boards { max-width: 1200px; margin: 64px auto 0; }
.capability-board { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 64px; }
.capability-board + .capability-board { margin-top: 80px; padding-top: 64px; border-top: 1px solid var(--line); }
.capability-column { min-width: 0; }
.capability-column h3 { margin: 0; font-size: clamp(28px, 3vw, 44px); font-weight: 500; line-height: 1.1; letter-spacing: -.03em; text-wrap: balance; }
.records-capability-title { margin: 16px 0 28px; color: var(--ink-soft); font-size: 14px; line-height: 1.5; }
.records-capability-items { padding: 0; margin: 0; list-style: none; }
.records-capability-items li { padding: 14px 0; border-top: 1px solid var(--line); font-size: 16px; line-height: 1.45; text-wrap: pretty; }
.records-brand-grid { --logo-height: 32px; --logo-width: 112px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px 16px; padding: 0; margin: 0 0 28px; list-style: none; }
.capability-column--brands .records-capability-items li { font-size: 14px; padding-block: 12px; }
.records--animated { position: relative; width: 100%; height: 100%; }
.records--animated .records-group { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 100px var(--page-gutter) 40px; opacity: var(--group-opacity, 0); }
.records--animated .records-heading { flex-shrink: 0; transform: translate3d(0, calc((1 - var(--group-reveal, 0)) * 40px), 0); }
.records--animated .records-scenes { position: relative; flex: 1; min-height: 0; margin-top: 24px; }
.records--animated .records-scene { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; width: 100%; max-width: 1040px; padding: 0; border: 0; opacity: var(--record-opacity, 0); transform: translate3d(0, calc((1 - var(--record-reveal, 0)) * 52px - var(--record-exit, 0) * 32px), 0); }
.records--animated .records-mark { perspective: 800px; }
.records--animated .records-mark > * { transform-origin: center bottom; transform: rotateX(calc((1 - var(--record-reveal, 0)) * 65deg)); }
.records--animated .credential-grid { width: 100%; margin-block: auto; padding-top: 24px; gap: 28px 48px; }
.records--animated .records-certificate { opacity: var(--record-opacity, 0); transform: translate3d(0, calc((1 - var(--record-reveal, 0)) * 32px), 0); }
.records--animated .capability-boards { position: relative; width: 100%; flex: 1; min-height: 0; margin-top: 40px; }
.records--animated .capability-board { position: absolute; inset: 0; align-content: center; }
.records--animated .capability-board + .capability-board { margin: 0; padding: 0; border: 0; }
.records--animated .capability-board[aria-hidden='true'] { visibility: hidden; }
.records--animated .capability-column { opacity: var(--record-opacity, 0); transform: translate3d(0, calc((1 - var(--record-reveal, 0)) * 40px - var(--record-exit, 0) * 24px), 0); }
.records--animated .capability-board--support .capability-column { transform: translate3d(0, calc((1 - var(--record-reveal, 0)) * 40px), 0); }
.records--animated [inert] { pointer-events: none; }
@media (max-width: 1000px), (max-height: 850px) {
  .records--animated .records-group { padding-top: 100px; }
  .records--animated .credential-grid { gap: 24px 32px; }
  .records--animated .records-certificate { padding-bottom: 16px; }
  .records--animated .records-certificate .records-mark { --logo-height: 44px; min-height: 44px; }
  .records--animated .records-certificate h3 { margin-top: 16px; font-size: 16px; }
  .records--animated .records-certificate-detail { margin-top: 12px; font-size: 13px; }
  .records--animated .records-issuer { font-size: 11px; }
  .records--animated .capability-board { gap: 40px; }
  .records--animated .capability-boards { margin-top: 28px; }
  .records--animated .capability-column h3 { font-size: 32px; }
  .records--animated .records-capability-title { margin-block: 12px 20px; font-size: 13px; }
  .records--animated .records-capability-items li { padding-block: 10px; font-size: 14px; }
  .records--animated .records-brand-grid { --logo-height: 28px; gap: 20px 12px; margin-bottom: 20px; }
  .records--animated .capability-column--brands .records-capability-items li { font-size: 13px; }
}
@media (max-width: 760px) {
  .records-group { padding: 64px 22px; }
  .records-heading p { margin-top: 16px; font-size: 14px; }
  .records-mark { --logo-height: 76px; --logo-width: 250px; }
  .records-project-scope { font-size: clamp(21px, 5vw, 27px); margin: 28px auto; }
  .records-project-meta { gap: 28px; }
  .records-project-meta dd { font-size: 13px; }
  .records-footnote { flex-direction: column; text-align: center; gap: 4px; font-size: 11px; margin-top: 16px; }
  .records-company { font-size: 12px; }
  .credential-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 36px 24px; margin-top: 48px; }
  .records-certificate .records-mark { --logo-height: 40px; min-height: 40px; }
  .records-certificate h3 { font-size: 16px; margin-top: 16px; }
  .records-certificate-detail { font-size: 13px; }
  .records-standard { font-size: 22px; }
  .capability-boards { margin-top: 48px; }
  .capability-board { grid-template-columns: 1fr; gap: 48px; }
  .capability-board + .capability-board { margin-top: 48px; padding-top: 48px; }
  .records-capability-items li { font-size: 15px; }
  .records-brand-grid { --logo-height: 28px; --logo-width: 96px; }
}
</style>
