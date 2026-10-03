<script setup lang="ts">
import { createEnquiryDraft, enquiryProperty, enquiryServices, validateEnquiry, type EnquiryDetails, type EnquiryProperty } from '~/utils/enquiry'
import { companyContact } from '~/data/company-contact'

const router = useRouter()
const formElement = useTemplateRef<HTMLFormElement>('formElement')
const ready = ref(false)
const attempted = ref(false)
const property = ref<EnquiryProperty>('')
const details = reactive<EnquiryDetails>({ name: '', contact: '', service: '', location: '', message: '' })
const errors = computed(() => attempted.value ? validateEnquiry(details) : {})
const handoff = ref<ReturnType<typeof createEnquiryDraft> | null>(null)

useHead({
  htmlAttrs: { 'data-theme': 'service' },
  title: 'Get a quote | Setia Air-Cond',
  meta: [{ name: 'description', content: 'Tell Setia what your space needs. Prepare an enquiry for air-conditioning or electrical work, then continue by email.' }],
})

onMounted(() => {
  // The prerendered Nuxt route can still have an empty query at mount.
  // Read the resolved router URL after hydration for direct contextual links.
  const query = router.currentRoute.value.query
  property.value = enquiryProperty(query.property)
  ready.value = true
})

async function openDraft() {
  attempted.value = true
  if (Object.keys(errors.value).length) {
    await nextTick()
    formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }
  handoff.value = createEnquiryDraft(details, 'email', property.value)
  window.location.assign(handoff.value.href)
}
</script>

<template>
  <CompanyPage current="quote" class="quote-page">
    <div class="quote-content company-width">
      <section id="company-contact" class="quote-contact" aria-labelledby="quote-title">
        <div class="quote-contact__intro">
          <h1 id="quote-title">Let’s talk about<br>your space.</h1>
          <p>Call or email Setia directly, or send us a few details below.</p>
        </div>
        <div class="quote-contact__details">
          <div class="quote-contact__item">
            <h2>Telephone</h2>
            <a v-for="phone in companyContact.phones" :key="phone.href" :href="phone.href">{{ phone.label }}</a>
          </div>
          <div class="quote-contact__item">
            <h2>Toll free</h2>
            <a :href="companyContact.tollFree.href">{{ companyContact.tollFree.label }}</a>
          </div>
          <div class="quote-contact__item quote-contact__item--email">
            <h2>Email</h2>
            <a :href="`mailto:${companyContact.email}`">{{ companyContact.email }}<span class="icon icon--arrow" aria-hidden="true" /></a>
          </div>
          <address class="quote-contact__office">
            <p>{{ companyContact.name }}</p>
            <p>{{ companyContact.address.join(' ') }}</p>
            <p class="quote-contact__meta"><span>Company no. {{ companyContact.registration }}</span><span>Fax {{ companyContact.fax }}</span></p>
            <a :href="companyContact.mapsHref" target="_blank" rel="noopener noreferrer">Get directions<span class="icon icon--arrow" aria-hidden="true" /><span class="sr-only"> (opens in a new tab)</span></a>
          </address>
        </div>
      </section>

      <AirConCalculator />

      <form ref="formElement" class="quote-form" aria-labelledby="enquiry-title" novalidate @submit.prevent="openDraft" @input="handoff = null" @change="handoff = null">
        <header class="quote-form__intro">
          <h2 id="enquiry-title">Get a quote</h2>
          <p>Tell us a little about your space and what you need. We’ll help you find the right next step.</p>
          <p v-if="property" class="quote-context">For your {{ property }} space.</p>
          <p class="quote-form__hint">A few details to prepare your email enquiry.</p>
        </header>
        <div class="quote-form__body">
        <p class="quote-form__hint">Fields are required unless marked optional.</p>
        <div class="quote-fields">
          <div class="quote-field">
            <label for="enquiry-name">Your name</label>
            <input id="enquiry-name" v-model="details.name" name="name" autocomplete="name" maxlength="80" required :aria-invalid="Boolean(errors.name)" :aria-describedby="errors.name ? 'name-error' : undefined">
            <p v-if="errors.name" id="name-error" class="quote-error">{{ errors.name }}</p>
          </div>
          <div class="quote-field">
            <label for="enquiry-contact">Email or phone number</label>
            <input id="enquiry-contact" v-model="details.contact" name="contact" type="text" maxlength="120" autocapitalize="none" :spellcheck="false" required :aria-invalid="Boolean(errors.contact)" :aria-describedby="errors.contact ? 'contact-error' : undefined">
            <p v-if="errors.contact" id="contact-error" class="quote-error">{{ errors.contact }}</p>
          </div>
          <div class="quote-field">
            <label for="enquiry-service">What do you need?</label>
            <select id="enquiry-service" v-model="details.service" name="service" required :aria-invalid="Boolean(errors.service)" :aria-describedby="errors.service ? 'service-error' : undefined">
              <option disabled value="">Choose a service</option>
              <option v-for="service in enquiryServices" :key="service" :value="service">{{ service }}</option>
            </select>
            <p v-if="errors.service" id="service-error" class="quote-error">{{ errors.service }}</p>
          </div>
          <div class="quote-field">
            <label for="enquiry-location">Area or postcode</label>
            <input id="enquiry-location" v-model="details.location" name="location" maxlength="120" required placeholder="e.g. Subang Jaya" :aria-invalid="Boolean(errors.location)" :aria-describedby="errors.location ? 'location-error' : undefined">
            <p v-if="errors.location" id="location-error" class="quote-error">{{ errors.location }}</p>
          </div>
          <div class="quote-field quote-field--full">
            <label for="enquiry-message">A little more detail <span>(optional)</span></label>
            <textarea id="enquiry-message" v-model="details.message" name="message" rows="3" maxlength="1000" placeholder="Type of space, number of units, the issue or your preferred timing." :aria-invalid="Boolean(errors.message)" :aria-describedby="errors.message ? 'message-error' : undefined" />
            <p v-if="errors.message" id="message-error" class="quote-error">{{ errors.message }}</p>
          </div>
        </div>
        <p id="handoff-note" class="quote-form__hint">Opens a draft in your email app. Review your message there, then send it.</p>
        <div class="quote-actions">
          <button class="quote-submit" type="submit" :disabled="!ready" aria-describedby="handoff-note">Open email draft<span class="icon icon--arrow" aria-hidden="true" /></button>
          <p class="quote-call">or call us at <a :href="companyContact.phones[0].href">{{ companyContact.phones[0].label }}</a></p>
        </div>
        <div v-if="handoff" class="quote-handoff" role="status">
          <p>Your enquiry hasn’t been sent by this page. If your email app didn’t open, <a :href="handoff.href">open your draft again</a>.</p>
        </div>
        <noscript><p>Please enable JavaScript to prepare your message, or use our email and telephone links above.</p></noscript>
        </div>
      </form>
    </div>
  </CompanyPage>
</template>

<style scoped>
.quote-content { padding-bottom: clamp(56px, 6vw, 88px); }
.quote-contact { display: grid; grid-template-columns: .85fr 1.15fr; align-items: start; gap: clamp(40px, 7vw, 104px); padding-block: clamp(40px, 5vw, 68px); }
.quote-contact__intro h1 { margin: 0 0 24px; font-size: clamp(44px, 4.8vw, 64px); }
.quote-contact__intro p { max-width: 32ch; margin: 0; color: var(--company-muted); font-size: 17px; line-height: 1.65; }
.quote-contact__details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 32px; }
.quote-contact__item { min-width: 0; }
.quote-contact__item h2 { margin: 0 0 4px; color: var(--company-muted); font: inherit; font-size: 14px; }
.quote-contact__item a { display: flex; align-items: center; gap: 16px; width: fit-content; min-height: 44px; color: var(--paper); font-size: clamp(19px, 2vw, 23px); font-weight: 500; line-height: 1.4; text-decoration: underline; text-decoration-color: transparent; text-underline-offset: 5px; overflow-wrap: anywhere; }
.quote-contact__item a:hover { text-decoration-color: currentColor; }
.quote-contact__item--email { grid-column: 1 / -1; padding-top: 12px; border-top: 1px solid var(--company-line); }
.quote-contact__item--email .icon { flex-shrink: 0; width: 20px; height: 20px; }
.quote-contact__office { grid-column: 1 / -1; padding-top: 4px; color: var(--company-muted); font-style: normal; font-size: 13px; line-height: 1.6; }
.quote-contact__office p { margin: 0 0 4px; }
.quote-contact__meta { display: flex; flex-wrap: wrap; gap: 4px 24px; }
.quote-contact__office a { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; text-decoration: underline; text-underline-offset: 4px; }
.quote-contact__office .icon { width: 16px; height: 16px; }
.quote-form { display: grid; grid-template-columns: .7fr 1.3fr; gap: clamp(28px, 5vw, 72px); min-width: 0; padding: clamp(24px, 4vw, 48px); border: 1px solid #527863; border-radius: 4px; background: #164d38; }
.quote-form h2 { font-family: inherit; font-size: 30px; font-weight: 500; letter-spacing: -.02em; margin: 0 0 20px; }
.quote-form__intro > p { max-width: 30ch; line-height: 1.65; }
.quote-form__intro .quote-form__hint { margin-top: 24px; }
.quote-form__body { min-width: 0; }
.quote-form p { margin: 0; font-size: 14px; }
.quote-form .quote-form__hint, .quote-form .quote-context { color: var(--company-muted); font-size: 13px; }
.quote-form .quote-context { margin-top: 16px; font-size: 15px; }
.quote-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 20px; margin-block: 28px; }
.quote-field { min-width: 0; }
.quote-field--full { grid-column: 1 / -1; }
.quote-field label { display: block; margin-bottom: 10px; font-size: 14px; font-weight: 500; }
.quote-field label span { color: var(--company-muted); font-weight: 400; }
.quote-field :is(input, select, textarea) { display: block; width: 100%; min-height: 48px; padding: 12px 14px; border: 1px solid #bed0c380; border-radius: 4px; background: #103d2c; color: var(--paper); font-size: 16px; line-height: 1.5; caret-color: #d1e4d7; }
.quote-field select { padding-right: 24px; }
.quote-field textarea { resize: vertical; min-height: 112px; }
.quote-field ::placeholder { color: #b0c6b8; opacity: 1; }
.quote-field [aria-invalid='true'] { border-color: #ffc4b8; }
.quote-form .quote-error { margin-top: 8px; color: #ffc4b8; font-size: 13px; }
.quote-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; margin-top: 20px; }
.quote-call { color: var(--company-muted); }
.quote-call a { display: inline-flex; align-items: center; min-height: 44px; color: var(--paper); white-space: nowrap; text-decoration: underline; text-underline-offset: 4px; }
.quote-submit { display: flex; flex: 1 1 220px; align-items: center; justify-content: space-between; gap: 24px; min-height: 56px; padding: 14px 20px; border: 1px solid #d1e4d7; border-radius: 4px; background: #d1e4d7; color: #0b3022; font-weight: 600; cursor: pointer; transition: background-color .2s ease; }
.quote-submit .icon { width: 22px; height: 22px; flex-shrink: 0; }
.quote-submit:hover { background: var(--paper); }
.quote-submit:disabled { opacity: .6; cursor: wait; }
.quote-handoff { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--company-line); color: var(--company-muted); }
.quote-handoff a { color: var(--paper); text-decoration: underline; text-underline-offset: 4px; }
@media (max-width: 850px) {
  .quote-contact, .quote-form { grid-template-columns: 1fr; gap: 28px; }
  .quote-contact__intro p { max-width: 52ch; }
  .quote-form__intro > p { max-width: 58ch; }
  .quote-form__intro .quote-form__hint { margin-top: 12px; }
}
@media (max-width: 550px) { .quote-fields { grid-template-columns: 1fr; gap: 20px; } }
@media (max-width: 380px) { .quote-contact__details { gap: 20px 16px; } .quote-contact__item a { font-size: 17px; } }
@media (max-width: 700px) { .quote-page :deep(.company-footer) { padding-bottom: 64px; } }
@media (prefers-reduced-motion: reduce) { .quote-submit { transition: none; } }
</style>
