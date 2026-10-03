<script setup lang="ts">
import { estimateRoomCooling, formatRoomCoolingEstimate, type CoolingEstimate } from '~/utils/air-con-sizing'

const calculator = useTemplateRef<HTMLFormElement>('calculator')
const length = ref('')
const width = ref('')
const windowWalls = ref('')
const attempted = ref(false)
const result = ref<CoolingEstimate | null>(null)
const changed = ref(false)
const copying = ref(false)
const copied = ref(false)
const copyFailed = ref(false)
const manualCopy = useTemplateRef<HTMLTextAreaElement>('manualCopy')
const estimateText = computed(() => result.value ? formatRoomCoolingEstimate({ lengthFt: Number(length.value), widthFt: Number(width.value), windowWalls: Number(windowWalls.value) }) : null)
const errors = computed<Record<string, string>>(() => {
  if (!attempted.value) return {}
  const issues: Record<string, string> = {}
  if (!Number.isFinite(Number(length.value)) || Number(length.value) <= 0) issues.length = 'Enter a room length greater than zero.'
  if (!Number.isFinite(Number(width.value)) || Number(width.value) <= 0) issues.width = 'Enter a room width greater than zero.'
  if (windowWalls.value === '' || !Number.isInteger(Number(windowWalls.value)) || Number(windowWalls.value) < 0 || Number(windowWalls.value) > 4) issues.windows = 'Choose how many walls have windows.'
  if (!Object.keys(issues).length && !estimateRoomCooling({ lengthFt: Number(length.value), widthFt: Number(width.value), windowWalls: Number(windowWalls.value) })) issues.length = 'Check your room dimensions. Use measurements in feet.'
  return issues
})

const number = (value: number, decimals = 0) => value.toLocaleString('en-MY', { maximumFractionDigits: decimals })

watch([length, width, windowWalls], () => {
  if (result.value) changed.value = true
  result.value = null
  copied.value = false
  copyFailed.value = false
})

async function calculate() {
  attempted.value = true
  if (Object.keys(errors.value).length) {
    await nextTick()
    calculator.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }
  result.value = estimateRoomCooling({ lengthFt: Number(length.value), widthFt: Number(width.value), windowWalls: Number(windowWalls.value) })
  changed.value = false
  copied.value = false
  copyFailed.value = false
}

async function copyEstimate() {
  const text = estimateText.value
  if (!text || copying.value) return
  copying.value = true
  copied.value = false
  copyFailed.value = false
  try {
    await navigator.clipboard.writeText(text)
    if (estimateText.value === text) copied.value = true
  } catch {
    if (estimateText.value !== text) return
    copyFailed.value = true
    await nextTick()
    manualCopy.value?.focus({ preventScroll: true })
    manualCopy.value?.select()
  } finally {
    copying.value = false
  }
}

function reset() {
  length.value = ''
  width.value = ''
  windowWalls.value = ''
  attempted.value = false
  result.value = null
  changed.value = false
  calculator.value?.querySelector<HTMLInputElement>('input')?.focus()
}
</script>

<template>
  <section class="room-sizing" aria-labelledby="room-sizing-title">
    <div class="room-sizing__intro">
      <h2 id="room-sizing-title">Find the right <br>air-cond size.</h2>
      <p>Start with your room’s dimensions for an estimate of the cooling capacity you need.</p>
      <p class="room-sizing__note">For a room with four walls. Sunlight, ceiling height and how the room is used can affect the final size. Setia can help confirm it.</p>
    </div>
    <form ref="calculator" class="room-sizing__form" novalidate aria-label="Air-conditioning size calculator" @submit.prevent="calculate">
      <div class="room-sizing__dimensions">
        <div class="room-sizing__field">
          <label for="room-length">Room length <span>(ft)</span></label>
          <input id="room-length" v-model="length" name="room-length" type="number" inputmode="decimal" step="any" min="0" placeholder="e.g. 14" required :aria-invalid="Boolean(errors.length)" :aria-describedby="errors.length ? 'room-length-error' : undefined">
          <p v-if="errors.length" id="room-length-error" class="room-sizing__error">{{ errors.length }}</p>
        </div>
        <div class="room-sizing__field">
          <label for="room-width">Room width <span>(ft)</span></label>
          <input id="room-width" v-model="width" name="room-width" type="number" inputmode="decimal" step="any" min="0" placeholder="e.g. 12" required :aria-invalid="Boolean(errors.width)" :aria-describedby="errors.width ? 'room-width-error' : undefined">
          <p v-if="errors.width" id="room-width-error" class="room-sizing__error">{{ errors.width }}</p>
        </div>
      </div>
      <div class="room-sizing__field room-sizing__windows">
        <label for="room-windows">Walls with windows</label>
        <select id="room-windows" v-model="windowWalls" name="window-walls" required :aria-invalid="Boolean(errors.windows)" :aria-describedby="errors.windows ? 'room-windows-help room-windows-error' : 'room-windows-help'">
          <option disabled value="">Choose a count</option>
          <option v-for="count in 5" :key="count" :value="String(count - 1)">{{ count - 1 }} {{ count === 2 ? 'wall' : 'walls' }}{{ count === 1 ? ' (no windows)' : '' }}</option>
        </select>
        <p id="room-windows-help" class="room-sizing__hint">Count walls, rather than individual windows.</p>
        <p v-if="errors.windows" id="room-windows-error" class="room-sizing__error">{{ errors.windows }}</p>
      </div>
      <div class="room-sizing__actions">
        <button class="room-sizing__calculate" type="submit">Calculate size<span class="icon icon--arrow" aria-hidden="true" /></button>
        <button class="room-sizing__reset" type="button" @click="reset">Reset</button>
      </div>
      <div class="room-sizing__result" role="status" aria-live="polite" aria-atomic="true">
        <template v-if="result">
          <p class="room-sizing__result-label">Estimated cooling capacity</p>
          <div class="room-sizing__values">
            <p><strong>{{ number(result.capacityHp, 2) }}</strong><span>HP</span></p>
            <p><strong>{{ number(result.coolingWatts) }}</strong><span>watts of cooling</span></p>
          </div>
          <p class="room-sizing__recommendation">Suggested size: <strong>{{ number(result.suggestedHp, 1) }} HP{{ result.suggestedHp > 3 ? ' total' : '' }}</strong><span>For {{ number(result.areaSqFt, 2) }} sq ft. Add this estimate to your enquiry below.</span></p>
          <p class="room-sizing__hint">Cooling watts describe heat removed from the room, not electricity usage.</p>
          <div class="room-sizing__copy-actions">
            <button class="room-sizing__copy" type="button" :disabled="copying" @click="copyEstimate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" /></svg>
              {{ copying ? 'Copying…' : copied ? 'Copied' : 'Copy estimate' }}
            </button>
            <p class="room-sizing__hint">{{ copied ? 'Copied. Paste into “A little more detail” in the quote form below.' : 'Copy this estimate to include it in your quote.' }}</p>
          </div>
          <div v-if="copyFailed" class="room-sizing__manual-copy">
            <p id="room-copy-help" class="room-sizing__hint">Copy isn’t available. Select the estimate below and copy it.</p>
            <textarea ref="manualCopy" :value="estimateText ?? ''" readonly rows="5" aria-label="Cooling estimate to copy" aria-describedby="room-copy-help" />
          </div>
        </template>
        <p v-else class="room-sizing__empty">{{ changed ? 'Room details changed. Calculate again to update your estimate.' : 'Your HP and cooling watts estimate will appear here.' }}</p>
      </div>
      <noscript><p class="room-sizing__hint">Enable JavaScript to use the calculator, or contact Setia above for help with sizing.</p></noscript>
    </form>
  </section>
</template>

<style scoped>
.room-sizing { display: grid; grid-template-columns: .85fr 1.15fr; gap: clamp(40px, 7vw, 104px); padding-block: clamp(40px, 5vw, 72px); border-top: 1px solid var(--company-line); }
.room-sizing__intro h2 { margin: 0 0 24px; font-size: clamp(36px, 3.7vw, 52px); }
.room-sizing__intro p { max-width: 36ch; margin: 0; color: var(--company-muted); font-size: 17px; line-height: 1.65; }
.room-sizing__intro .room-sizing__note { margin-top: 24px; font-size: 14px; }
.room-sizing__form { min-width: 0; }
.room-sizing__dimensions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.room-sizing__field { min-width: 0; }
.room-sizing__field label { display: block; margin-bottom: 10px; font-size: 15px; font-weight: 500; }
.room-sizing__field label span { color: var(--company-muted); font-weight: 400; }
.room-sizing__field :is(input, select) { width: 100%; min-height: 52px; padding: 12px 14px; border: 1px solid #bed0c380; border-radius: 4px; background: #103d2c; color: var(--paper); font: inherit; font-size: 16px; caret-color: #d1e4d7; }
.room-sizing__field :is(input, select):focus-visible { outline: 2px solid #d1e4d7; outline-offset: 3px; }
.room-sizing__field ::placeholder { color: #b0c6b8; opacity: 1; }
.room-sizing__field [aria-invalid='true'] { border-color: #ffc4b8; }
.room-sizing__windows { margin-top: 24px; }
.room-sizing__hint { margin: 8px 0 0; color: var(--company-muted); font-size: 13px; line-height: 1.5; }
.room-sizing__error { margin: 8px 0 0; color: #ffc4b8; font-size: 13px; line-height: 1.5; }
.room-sizing__actions { display: flex; align-items: center; gap: 24px; margin-top: 24px; }
.room-sizing__calculate { display: inline-flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 48px; padding: 12px 18px; border: 1px solid #d1e4d7; border-radius: 4px; background: #d1e4d7; color: #0b3022; font: inherit; font-weight: 600; cursor: pointer; transition: background-color .2s ease; }
.room-sizing__calculate:hover { background: var(--paper); }
.room-sizing__calculate .icon { width: 20px; height: 20px; }
.room-sizing__reset { min-width: 44px; min-height: 44px; padding: 8px 4px; border: 0; background: transparent; color: var(--company-muted); font: inherit; font-size: 14px; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
.room-sizing__reset:hover { color: var(--paper); }
.room-sizing__result { min-height: 130px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--company-line); }
.room-sizing__result-label { margin: 0 0 12px; color: var(--company-muted); font-size: 14px; }
.room-sizing__values { display: flex; flex-wrap: wrap; gap: 16px 40px; margin-bottom: 20px; }
.room-sizing__values p { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin: 0; }
.room-sizing__values strong { min-width: 0; overflow-wrap: anywhere; font-size: clamp(28px, 3vw, 38px); line-height: 1.15; font-weight: 500; letter-spacing: -.025em; font-variant-numeric: tabular-nums; }
.room-sizing__values span { color: var(--company-muted); font-size: 14px; }
.room-sizing__recommendation { margin: 0; font-size: 16px; line-height: 1.5; }
.room-sizing__recommendation strong { font-weight: 600; }
.room-sizing__recommendation span { display: block; margin-top: 4px; color: var(--company-muted); font-size: 14px; }
.room-sizing__empty { max-width: 42ch; margin: 0; color: var(--company-muted); font-size: 15px; line-height: 1.6; }
.room-sizing__copy-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-top: 20px; }
.room-sizing__copy { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 10px 14px; border: 1px solid #bed0c380; border-radius: 4px; background: transparent; color: var(--paper); font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; }
.room-sizing__copy svg { width: 18px; height: 18px; flex-shrink: 0; }
.room-sizing__copy:hover { background: #103d2c; }
.room-sizing__copy:focus-visible { outline: 2px solid #d1e4d7; outline-offset: 3px; }
.room-sizing__copy:disabled { opacity: .6; cursor: wait; }
.room-sizing__copy-actions .room-sizing__hint { flex: 1 1 220px; margin: 0; }
.room-sizing__manual-copy { margin-top: 12px; }
.room-sizing__manual-copy textarea { display: block; width: 100%; padding: 12px; margin-top: 8px; border: 1px solid #bed0c380; border-radius: 4px; background: #103d2c; color: var(--paper); font: inherit; font-size: 14px; line-height: 1.6; resize: vertical; }
@media (max-width: 850px) { .room-sizing { grid-template-columns: 1fr; gap: 28px; } .room-sizing__intro p { max-width: 58ch; } .room-sizing__intro h2 br { display: none; } .room-sizing__intro .room-sizing__note { margin-top: 16px; } }
@media (max-width: 380px) { .room-sizing__dimensions { gap: 12px; } .room-sizing__actions { gap: 16px; } }
@media (prefers-reduced-motion: reduce) { .room-sizing__calculate { transition: none; } }
</style>
