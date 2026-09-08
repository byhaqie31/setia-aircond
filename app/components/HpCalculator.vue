<script setup lang="ts">
/* Horsepower calculator, ported from enquiry.js. factor = 55 + 10 × windowed
   walls; HP = area × factor / 9000. Snaps to a standard unit, or suggests a
   split into 2.5HP units above 5HP. */
const L = ref(''), W = ref(''), noWin = ref('2'), win = ref('2')
const UNITS = [1, 1.5, 2, 2.5, 3, 4, 5]
const result = computed(() => {
  const area = (Number(L.value) || 0) * (Number(W.value) || 0)
  const w = Math.max(0, Math.min(4, Number(win.value) || 0))
  const hp = area > 0 ? (area * (55 + 10 * w)) / 9000 : 0
  let combo = '—', total = ''
  if (hp > 5) {
    const halves = Math.round(hp / 2.5)
    combo = `${halves} × 2.5HP`; total = `≈ ${(halves * 2.5).toFixed(1)}HP`
  } else if (hp > 0) {
    const nearest = UNITS.reduce((a, b) => (Math.abs(b - hp) < Math.abs(a - hp) ? b : a))
    combo = `1 × ${nearest}HP`
  }
  return { area, hp, combo, total }
})
</script>

<template>
  <aside class="enq-calc reveal reveal--d1">
    <h2 class="section__title">Horsepower calculator</h2>
    <p class="enq-calc__lede">Estimate the cooling capacity your room needs. All measurements in feet.</p>
    <div class="enq-row2">
      <label class="enq-field"><span>Room Size (L)</span><input v-model="L" type="number" min="0" inputmode="decimal"></label>
      <label class="enq-field"><span>Room Size (W)</span><input v-model="W" type="number" min="0" inputmode="decimal"></label>
    </div>
    <label class="enq-field"><span>No. of Walls without windows</span><input v-model="noWin" type="number" min="0" max="4"></label>
    <label class="enq-field"><span>No. of Walls with windows</span><input v-model="win" type="number" min="0" max="4"></label>
    <div class="enq-calc__out" aria-live="polite">
      <div><span class="enq-calc__k">Total Area</span><strong>{{ result.area ? result.area.toFixed(0) + ' sf' : '—' }}</strong></div>
      <div><span class="enq-calc__k">Cooling Capacity</span><strong>{{ result.hp ? result.hp.toFixed(1) + ' HP' : '—' }}</strong></div>
      <div><span class="enq-calc__k">Recommended Units</span><strong>{{ result.combo }}<small v-if="result.total" class="enq-calc__approx">{{ result.total }}</small></strong></div>
    </div>
    <div class="enq-calc__tips">
      <p><b>Rule of thumb</b> for a room with 4 walls:</p>
      <p><b>Example 1</b> — 30′ × 20′ = 600 sf, 2 walls with windows &amp; 2 without → 600 × 75 / 9000 = 5 HP (1×5HP or 2×2.5HP).</p>
      <p><b>Example 2</b> — 30′ × 20′ = 600 sf, 1 wall with window &amp; 3 without → 600 × 65 / 9000 = 4.3 HP (1×2HP + 1×2.5HP).</p>
    </div>
  </aside>
</template>
