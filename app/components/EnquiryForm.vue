<script setup lang="ts">
/* No backend, by design. The form composes a message and hands it to WhatsApp
   or the visitor's mail client. With scripting off it posts to a mailto:
   action, which opens the mail client with the fields as plain text. */
const company = useCompany()
const services = [
  { value: 'Supply', title: 'Supply', desc: 'Units only, delivered to your site.' },
  { value: 'Supply & Installation', title: 'Supply & Installation', desc: 'We supply and install, end to end.' },
  { value: 'Installation Only', title: 'Installation Only', desc: 'You provide units, we fit them.' },
  { value: 'Repair & Service', title: 'Repair & Service', desc: 'Servicing, maintenance and repairs.' },
]
const brandOptions = [...company.brands]

const f = reactive({ company: '', person: '', phone: '', email: '', address: '', postcode: '', state: '', service: '', message: '' })
const units = ref([{ brand: '', capacity: '', qty: '' }])
const invalid = ref<Set<string>>(new Set())
const sent = ref<'' | 'whatsapp' | 'email'>('')

function addUnit() { if (units.value.length < 4) units.value.push({ brand: '', capacity: '', qty: '' }) }

function validate() {
  const bad = new Set<string>()
  for (const k of ['company', 'person', 'phone', 'email', 'message'] as const) if (!String(f[k]).trim()) bad.add(k)
  invalid.value = bad
  return bad.size === 0
}
function compose() {
  const lines = [
    `Enquiry from ${company.shortName} website`,
    `Company: ${f.company}`, `Contact person: ${f.person}`, `Contact no: ${f.phone}`, `Email: ${f.email}`,
  ]
  if (f.address || f.postcode || f.state) lines.push(`Address: ${[f.address, f.postcode, f.state].filter(Boolean).join(', ')}`)
  if (f.service) lines.push(`Service required: ${f.service}`)
  units.value.forEach((u, i) => {
    if (u.brand || u.capacity || u.qty) lines.push(`Unit ${i + 1}: ${[u.brand, u.capacity, u.qty ? `qty ${u.qty}` : ''].filter(Boolean).join(', ')}`)
  })
  lines.push('', f.message)
  return lines.join('\n')
}
function send(via: 'whatsapp' | 'email') {
  if (!validate()) { sent.value = ''; return }
  const body = compose()
  const url = via === 'whatsapp' ? company.whatsappUrl(body) : company.mailtoUrl(`Enquiry — ${f.company}`, body)
  if (via === 'whatsapp') window.open(url, '_blank', 'noopener')
  else window.location.href = url
  sent.value = via
}
const photoUrl = company.whatsappUrl("Hi Setia Air-Cond, I'd like a quote. Here are photos of my space and current unit:")
</script>

<template>
  <form id="enqForm" class="enq-form reveal" :action="`mailto:${company.email}`" method="post" enctype="text/plain" novalidate @submit.prevent="send('email')">
    <h2 class="section__title">Enquiry form</h2>

    <!-- §6.5 the photo route: no upload backend, a pre-filled WhatsApp message instead -->
    <div class="enq-wa">
      <div>
        <span class="enq-wa__k">Fastest way to a quote</span>
        <p>Send us photos of your room and your current unit on WhatsApp — we'll size it and reply with a price.</p>
      </div>
      <a class="btn btn--light enq-wa__btn" :href="photoUrl" target="_blank" rel="noopener">Send us photos on WhatsApp</a>
    </div>

    <div class="enq-row2">
      <label class="enq-field"><span>Company Name *</span><input v-model="f.company" name="company" required :class="{ 'is-invalid': invalid.has('company') }"></label>
      <label class="enq-field"><span>Contact Person *</span><input v-model="f.person" name="person" required :class="{ 'is-invalid': invalid.has('person') }"></label>
    </div>
    <div class="enq-row2">
      <label class="enq-field"><span>Contact No *</span><input v-model="f.phone" name="phone" type="tel" required :class="{ 'is-invalid': invalid.has('phone') }"></label>
      <label class="enq-field"><span>Email *</span><input v-model="f.email" name="email" type="email" required :class="{ 'is-invalid': invalid.has('email') }"></label>
    </div>
    <label class="enq-field"><span>Address</span><input v-model="f.address" name="address"></label>
    <div class="enq-row2">
      <label class="enq-field"><span>Postcode</span><input v-model="f.postcode" name="postcode"></label>
      <label class="enq-field"><span>State / Country</span><input v-model="f.state" name="state"></label>
    </div>

    <fieldset id="enqService" class="enq-field enq-svc">
      <span>Service Required</span>
      <div class="enq-svc__grid">
        <label v-for="s in services" :key="s.value" :class="['enq-svc__card', f.service === s.value ? 'is-selected' : '']">
          <input v-model="f.service" type="radio" name="service" :value="s.value">
          <span class="enq-svc__check" aria-hidden="true" />
          <span class="enq-svc__body">
            <span class="enq-svc__title">{{ s.title }}</span>
            <span class="enq-svc__desc">{{ s.desc }}</span>
          </span>
        </label>
      </div>
    </fieldset>

    <div id="enqUnits" class="enq-units">
      <div v-for="(u, i) in units" :key="i" class="enq-unit">
        <div class="enq-field"><span>Brand</span><BrandSelect v-model="u.brand" :name="`brand${i + 1}`" :options="brandOptions" /></div>
        <label class="enq-field"><span>Air-Cond Capacity</span><input v-model="u.capacity" :name="`capacity${i + 1}`" placeholder="e.g. 2.5 HP"></label>
        <label class="enq-field"><span>Quantity</span><input v-model="u.qty" :name="`qty${i + 1}`" type="number" min="0" placeholder="0"></label>
      </div>
    </div>
    <button v-if="units.length < 4" type="button" class="more" @click="addUnit">+ Add another unit</button>

    <label class="enq-field"><span>Message *</span><textarea v-model="f.message" name="message" rows="4" required :class="{ 'is-invalid': invalid.has('message') }" /></label>

    <div class="enq-send">
      <button type="button" class="btn btn--primary" @click="send('whatsapp')">Send via WhatsApp</button>
      <button type="submit" class="btn btn--ghost-light">Send via email</button>
    </div>
    <p v-if="sent" class="enq-success" aria-live="polite">
      <template v-if="sent === 'whatsapp'">Your enquiry has been opened in WhatsApp — press send there and our team will reply during working hours.</template>
      <template v-else>Your enquiry has been opened in your email app — press send there and our team will reply during working hours.</template>
    </p>
  </form>
</template>
