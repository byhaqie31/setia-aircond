<script setup lang="ts">
import { coverageNorth, coveragePinPosition, coveragePins, coverageRegions, coverageSouth, type CoverageRegion } from '~/data/commercial-coverage'

// The pins pop together on a timer, not with the scroll. While the support stage is pinned it says
// when the map has arrived; otherwise the map pops its pins the first time it scrolls into view.
const props = defineProps<{ shown?: boolean }>()

const height = Math.round((coverageNorth - coverageSouth) * 100)
const width = (region: CoverageRegion) => Math.round((region.east - region.west) * 100)
const pinsIn = (region: CoverageRegion) => coveragePins.filter(pin => pin.region === region.id)
// Jiggle turn: stepping by 7 through 19 pins visits each once, scattered across the map rather than north to south.
const jiggleOrder = (pin: (typeof coveragePins)[number]) => coveragePins.indexOf(pin) * 7 % coveragePins.length

const root = useTemplateRef<HTMLElement>('root')
// Pins only hide once script is running, so the server-rendered map always shows them.
const armed = ref(false)
const seen = ref(false)
const popped = computed(() => props.shown ?? seen.value)
let observer: IntersectionObserver | undefined

onMounted(() => {
  if (!root.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  armed.value = true
  observer = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) return
    seen.value = true
    observer?.disconnect()
  }, { threshold: .35 })
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="root" class="coverage-map" :class="{ 'is-armed': armed, 'is-popped': popped }">
    <div v-for="region in coverageRegions" :key="region.id" class="coverage-panel" :class="`coverage-panel--${region.id}`" :style="{ aspectRatio: `${width(region)} / ${height}` }">
      <img :src="$sitePath(region.src)" alt="" :width="width(region)" :height="height" loading="lazy" decoding="async">
      <ul class="coverage-pins" :aria-label="`Locations we cover in ${region.label}`">
        <li v-for="pin in pinsIn(region)" :key="pin.city" class="coverage-pin" :class="`coverage-pin--${pin.label}`" :style="{ ...coveragePinPosition(pin), '--jiggle-order': jiggleOrder(pin) }">
          <span class="coverage-pin__marker" aria-hidden="true"><span class="coverage-pin__logo" /></span>
          <span class="coverage-pin__name">{{ pin.city }}<span class="sr-only">, {{ pin.state }}</span></span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Both panels share one latitude band, so their widths in degrees (5.1 and 10) keep them at the same scale side by side. */
.coverage-map { --coverage-gap: clamp(20px, 3.5vw, 48px); container-type: inline-size; display: grid; grid-template-columns: minmax(0, 510fr) minmax(0, 1000fr); column-gap: var(--coverage-gap); align-items: start; width: min(100%, 1300px); margin-inline: auto; }
.coverage-panel { position: relative; min-width: 0; }
.coverage-panel img { display: block; width: 100%; height: 100%; }
.coverage-pins { position: absolute; inset: 0; margin: 0; padding: 0; list-style: none; }

/* A pin is a zero-size point on the town; the marker stands above it with its tail on the dot. */
.coverage-pin { --pin: clamp(16px, 2.1cqw, 26px); position: absolute; width: 0; height: 0; }
.coverage-pin::before { content: ''; position: absolute; top: -3px; left: -3px; width: 6px; height: 6px; border-radius: 50%; background: #a0ebbb; box-shadow: 0 0 0 2px #0b302299; }
.coverage-pin__marker { position: absolute; bottom: 6px; left: calc(var(--pin) / -2); display: grid; place-items: center; width: var(--pin); height: var(--pin); border-radius: 50%; background: var(--green); box-shadow: 0 0 0 1.5px #0b3022, 0 4px 10px #0619108c; transform-origin: 50% calc(100% + 6px); }
.coverage-pin__marker::after { content: ''; position: absolute; top: calc(100% - 3px); left: 50%; width: 8px; height: 8px; background: inherit; transform: translateX(-50%) rotate(45deg); }
.coverage-pin__logo { position: relative; z-index: 1; width: 56%; height: 62%; background: #fff; mask: url('/images/brand/setia-mark-transparent.png') center / contain no-repeat; }
.coverage-pin__name { position: absolute; bottom: calc(6px + var(--pin) / 2); color: #f5f5ed; font-size: 12px; font-weight: 600; line-height: 1; white-space: nowrap; text-shadow: 0 1px 3px #0b3022, 0 0 8px #0b3022; transform: translateY(50%); }
.coverage-pin--right .coverage-pin__name { left: calc(var(--pin) / 2 + 5px); }
.coverage-pin--left .coverage-pin__name { right: calc(var(--pin) / 2 + 5px); }
.coverage-pin--below .coverage-pin__name { top: 8px; bottom: auto; left: 0; transform: translateX(-50%); }

/* All pins pop at once: markers drop and grow into place, then dots and names fade up. Hiding back reverses quickly. */
.coverage-pin::before, .coverage-pin__name { transition: opacity .2s ease; }
.coverage-pin__marker { transition: opacity .15s ease, transform .2s ease; }
.coverage-map.is-armed:not(.is-popped) .coverage-pin::before,
.coverage-map.is-armed:not(.is-popped) .coverage-pin__name { opacity: 0; }
.coverage-map.is-armed:not(.is-popped) .coverage-pin__marker { opacity: 0; transform: translate3d(0, -14px, 0) scale(.6); }
.coverage-map.is-popped .coverage-pin__marker { transition: opacity .25s ease, transform .5s cubic-bezier(.16, 1, .3, 1); }
.coverage-map.is-popped .coverage-pin::before,
.coverage-map.is-popped .coverage-pin__name { transition: opacity .35s ease .25s; }

/* Once popped, each pin gives a short jiggle on its tip in turn, one every ~0.27s, so the map ripples rather than shaking at once.
   It uses the separate rotate property, leaving transform to the pop. */
@keyframes coverage-pin-jiggle {
  0%, 12%, 100% { rotate: 0deg; }
  2.5% { rotate: -10deg; }
  5% { rotate: 8deg; }
  7.5% { rotate: -5deg; }
  10% { rotate: 2deg; }
}
.coverage-map.is-popped .coverage-pin__marker { animation: coverage-pin-jiggle 5.2s ease-in-out calc(.7s + var(--jiggle-order) * .274s) infinite; }
@media (prefers-reduced-motion: reduce) {
  .coverage-map.is-popped .coverage-pin__marker { animation: none; }
}

/* Phones and narrow tablets: the panels stack, each at a readable size. */
@media (max-width: 760px) {
  .coverage-map { grid-template-columns: minmax(0, 1fr); row-gap: 28px; }
  .coverage-panel--peninsular { justify-self: center; width: min(100%, 420px); }
  .coverage-pin { --pin: 18px; }
  .coverage-pin__name { font-size: 11px; }
}
</style>
