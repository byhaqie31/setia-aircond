<script setup lang="ts">
/* The project register table. `mode="register"` is the public projects page
   (contractor / year / description / value); `mode="featured"` is the
   corporate page's featured selection (project / location / scope / system). */
import type { PropType } from 'vue'
type Row = {
  discipline: string; contractorOrOwner: string; years: string; scope: string;
  value: number | null; valueApproximate: boolean; valuePartial: boolean; valueConfidential: boolean;
  featured?: boolean; featuredName?: string; location?: string | null; systemType?: string | null;
}
const props = defineProps({
  rows: { type: Array as PropType<Row[]>, required: true },
  mode: { type: String as PropType<'register' | 'featured'>, default: 'register' },
})
const rm = new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function value(r: Row) {
  if (r.valueConfidential || r.value == null) return null
  return `${r.valueApproximate ? '~ ' : ''}RM ${rm.format(r.value)}${r.valuePartial ? '*' : ''}`
}
</script>

<template>
  <table class="proj-table">
    <thead v-if="mode === 'register'"><tr><th>Contractor / Owner</th><th>Year</th><th>Description</th><th>Job Value (RM)</th></tr></thead>
    <thead v-else><tr><th>Project</th><th>Location</th><th>Scope</th><th>System type</th></tr></thead>
    <tbody v-if="mode === 'register'">
      <tr v-for="(r, i) in rows" :key="i">
        <td data-label="Contractor / Owner">{{ r.contractorOrOwner }}</td>
        <td data-label="Year">{{ r.years }}</td>
        <td data-label="Description">{{ r.scope }}</td>
        <td data-label="Job Value (RM)">
          <span v-if="value(r)">{{ value(r) }}</span>
          <span v-else class="is-confidential">Confidential**</span>
        </td>
      </tr>
    </tbody>
    <tbody v-else>
      <tr v-for="(r, i) in rows" :key="i">
        <td data-label="Project">{{ r.featuredName || r.contractorOrOwner }}</td>
        <!-- TODO(client): confirm site location for each featured project -->
        <td data-label="Location"><span v-if="isTodo(r.location)" class="is-tbc">To be confirmed</span><template v-else>{{ r.location }}</template></td>
        <td data-label="Scope">{{ r.scope }}</td>
        <!-- TODO(client): confirm system type where the register does not name it -->
        <td data-label="System type"><span v-if="isTodo(r.systemType)" class="is-tbc">To be confirmed</span><template v-else>{{ r.systemType }}</template></td>
      </tr>
    </tbody>
  </table>
</template>
