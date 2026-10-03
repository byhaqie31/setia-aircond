<script setup lang="ts">
withDefaults(defineProps<{ message?: string }>(), { message: 'Getting things ready…' })
const airPaths = [
  'M8 24H106C144 24 144 8 182 8H272',
  'M8 40H106C144 40 144 24 182 24H272',
  'M8 56H106C144 56 144 40 182 40H272',
]
</script>

<template>
  <div class="cooling-loader__identity">
    <SetiaWordmark class="cooling-loader__brand" />
    <svg class="cooling-loader__air" viewBox="0 0 280 64" fill="none" aria-hidden="true">
      <g v-for="(path, index) in airPaths" :key="path" :style="{ '--air-delay': `${index * -.3}s` }">
        <path class="cooling-loader__track" :d="path" />
        <path class="cooling-loader__flow" :d="path" pathLength="100" />
      </g>
    </svg>
    <p class="cooling-loader__status" role="status" aria-live="polite">{{ message }}</p>
  </div>
</template>

<style scoped>
.cooling-loader__identity { grid-row: 2; display: flex; flex-direction: column; align-items: center; width: 100%; text-align: center; }
.cooling-loader__brand { font-size: clamp(28px, 5vw, 64px); }
.cooling-loader__air { display: block; width: min(240px, 70vw); height: auto; margin-top: clamp(40px, 7svh, 64px); stroke: #bed0c3; stroke-width: 1.25; stroke-linecap: round; }
.cooling-loader__track { opacity: .16; }
.cooling-loader__flow { stroke-dasharray: 24 76; animation: cooling-air 2.4s linear infinite; animation-delay: var(--air-delay); }
.cooling-loader__status { margin: 20px 0 0; color: #bed0c3; font-size: 14px; line-height: 1.5; }
@keyframes cooling-air { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .cooling-loader__flow { animation: none; } }
@media (max-width: 400px) { .cooling-loader__brand { font-size: 24px; } }
</style>
