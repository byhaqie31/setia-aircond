<script setup lang="ts">
import { useId } from 'vue'
import { commercialFramePaths, commercialLeaderPath, type CommercialLeader, type CommercialLabelBounds } from '~/utils/commercial-view-layout'

defineProps<{
  leaders: readonly CommercialLeader[]
  visibleCount: number
  retracting?: boolean
  selectedId?: string | null
  reducedMotion?: boolean
  labelBounds?: readonly CommercialLabelBounds[]
  /** Hover frames around each label, keyed by leader id, drawn in the stage's own pixels so every edge keeps one weight. */
  frames?: Readonly<Record<string, CommercialLabelBounds>>
  framedId?: string | null
  size?: { width: number, height: number } | null
  /** Fade the other leaders back while one label is framed. */
  dimOthers?: boolean
}>()
const maskId = `commercial-labels-${useId()}`
</script>

<template>
  <div class="commercial-leaders" :class="{ 'is-retracting': retracting, 'is-dimming': dimOthers && framedId }" aria-hidden="true">
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
          'is-framed': leader.id === framedId,
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
    <svg v-if="frames && size?.width && size.height" class="commercial-leaders__svg commercial-leaders__frames" :viewBox="`0 0 ${size.width} ${size.height}`" preserveAspectRatio="none" focusable="false">
      <template v-for="(leader, index) in leaders" :key="leader.id">
        <g v-if="frames[leader.id]" class="commercial-leaders__frame"
          :class="{ 'is-framed': leader.id === framedId && index < visibleCount && !retracting, 'is-reduced': reducedMotion }">
          <path class="commercial-leaders__trace" :d="commercialLeaderPath(leader, size.width, size.height)" pathLength="1" />
          <path v-for="(edge, side) in commercialFramePaths(leader, frames[leader.id]!, size.width, size.height)" :key="side"
            class="commercial-leaders__edge" :d="edge" pathLength="1" />
        </g>
      </template>
    </svg>
    <span
      v-for="(leader, index) in leaders"
      :key="leader.id"
      class="commercial-leaders__target"
      :class="{ 'is-visible': index < visibleCount && !retracting, 'is-selected': leader.id === selectedId || leader.id === framedId, 'is-framed': leader.id === framedId, 'is-reduced': reducedMotion }"
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
.commercial-leaders__frames { position: absolute; inset: 0; }
.commercial-leaders__frame { color: #a0ebbb; }
.commercial-leaders__trace, .commercial-leaders__edge { fill: none; stroke: currentColor; stroke-width: 1.1; stroke-dasharray: 1; stroke-dashoffset: 1; }
/* Leaving, the frame folds back into the line first, then the colour drains back down to the dot. */
.commercial-leaders__trace { transition: stroke-dashoffset 220ms cubic-bezier(.4, 0, .2, 1) 160ms; }
.commercial-leaders__edge { transition: stroke-dashoffset 180ms cubic-bezier(.4, 0, .2, 1); }
/* Hovering, the colour runs up the line, then splits around the label and closes across the top. */
.commercial-leaders__frame.is-framed :is(.commercial-leaders__trace, .commercial-leaders__edge) { stroke-dashoffset: 0; }
.commercial-leaders__frame.is-framed .commercial-leaders__trace { transition: stroke-dashoffset 260ms cubic-bezier(.4, 0, .2, 1); }
.commercial-leaders__frame.is-framed .commercial-leaders__edge { transition: stroke-dashoffset 340ms cubic-bezier(.22, 1, .36, 1) 220ms; }
.commercial-leaders__frame.is-reduced :is(.commercial-leaders__trace, .commercial-leaders__edge) { transition-duration: 100ms; transition-delay: 0ms; }
.commercial-leaders.is-dimming :is(.commercial-leaders__mark, .commercial-leaders__target).is-visible:not(.is-framed) { opacity: .22; }
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
  .commercial-leaders__trace, .commercial-leaders__edge { transition-duration: 100ms; transition-delay: 0ms; }
}
</style>
