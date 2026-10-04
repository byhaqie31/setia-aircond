<script setup lang="ts">
import { useId } from 'vue'
import { commercialLeaderPath, type CommercialLeader, type CommercialLabelBounds } from '~/utils/commercial-view-layout'

defineProps<{
  leaders: readonly CommercialLeader[]
  visibleCount: number
  retracting?: boolean
  selectedId?: string | null
  reducedMotion?: boolean
  labelBounds?: readonly CommercialLabelBounds[]
}>()
const maskId = `commercial-labels-${useId()}`
</script>

<template>
  <div class="commercial-leaders" :class="{ 'is-retracting': retracting }" aria-hidden="true">
    <svg class="commercial-leaders__svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" focusable="false">
      <defs v-if="labelBounds?.length">
        <mask :id="maskId" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
          <rect x="0" y="0" width="1000" height="1000" fill="white" />
          <rect v-for="(bounds, index) in labelBounds" :key="index" :x="bounds.x * 1000" :y="bounds.y * 1000"
            :width="bounds.width * 1000" :height="bounds.height * 1000" fill="black" />
        </mask>
      </defs>
      <g :mask="labelBounds?.length ? `url(#${maskId})` : undefined">
      <g
        v-for="(leader, index) in leaders"
        :key="leader.id"
        class="commercial-leaders__mark"
        :class="{
          'is-visible': index < visibleCount && !retracting,
          'is-selected': leader.id === selectedId,
          'is-reduced': reducedMotion,
        }"
      >
        <path
          class="commercial-leaders__path"
          :class="{ 'commercial-leaders__path--elbow': leader.elbow && leader.elbow !== 'direct' }"
          :d="commercialLeaderPath(leader)"
          pathLength="1"
        />
      </g>
      </g>
    </svg>
    <span
      v-for="(leader, index) in leaders"
      :key="leader.id"
      class="commercial-leaders__target"
      :class="{ 'is-visible': index < visibleCount && !retracting, 'is-selected': leader.id === selectedId, 'is-reduced': reducedMotion }"
      :style="{ left: `${leader.targetX * 100}%`, top: `${leader.targetY * 100}%` }"
    />
  </div>
</template>

<style scoped>
.commercial-leaders { position: absolute; z-index: 2; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.commercial-leaders__svg { display: block; width: 100%; height: 100%; overflow: visible; }
.commercial-leaders__mark { color: #d9ebde; opacity: 0; transition: opacity 180ms ease; }
.commercial-leaders__mark.is-visible { opacity: 1; }
.commercial-leaders__path { fill: none; stroke: currentColor; stroke-width: 1.1; vector-effect: non-scaling-stroke; opacity: .82; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 420ms cubic-bezier(.22, 1, .36, 1), opacity 180ms ease; }
.commercial-leaders__path--elbow { vector-effect: none; stroke-width: .8; }
.commercial-leaders__mark.is-visible .commercial-leaders__path { stroke-dashoffset: 0; }
.commercial-leaders.is-retracting .commercial-leaders__path { transition-duration: 240ms; }
.commercial-leaders__mark.is-selected { color: #a0ebbb; }
.commercial-leaders__target { position: absolute; width: 17px; height: 17px; border: 1.5px solid #d9ebde; border-radius: 50%; background: #0b3022; opacity: 0; transform: translate(-50%, -50%); transition: opacity 180ms ease; }
.commercial-leaders__target::after { position: absolute; inset: 5px; border-radius: 50%; background: #d9ebde; content: ''; }
.commercial-leaders__target.is-visible { opacity: 1; }
.commercial-leaders__target.is-selected { border-color: #a0ebbb; }
.commercial-leaders__target.is-selected::after { background: #a0ebbb; }
.commercial-leaders__mark.is-reduced,
.commercial-leaders__mark.is-reduced .commercial-leaders__path,
.commercial-leaders__target.is-reduced { transition-duration: 100ms; }
@media (prefers-reduced-motion: reduce) {
  .commercial-leaders__mark, .commercial-leaders__path, .commercial-leaders__target { transition-duration: 100ms; }
}
</style>
