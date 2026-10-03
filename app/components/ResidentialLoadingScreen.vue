<script setup lang="ts">
withDefaults(defineProps<{ active: boolean; shortcut?: string }>(), { shortcut: 'View services now' })
defineEmits<{ continue: [] }>()

function leave(element: Element) {
  element.setAttribute('inert', '')
}
</script>

<template>
  <Transition name="cooling-loader" @before-leave="leave">
    <div v-if="active" class="cooling-loader">
      <CoolingLoadingIdentity />
      <button class="cooling-loader__continue" type="button" @click="$emit('continue')">
        {{ shortcut }}<span class="icon icon--arrow" aria-hidden="true" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.cooling-loader { position: fixed; inset: 0; z-index: 30; display: grid; grid-template-rows: 1fr auto 1fr; justify-items: center; padding: 32px 24px; overflow: auto; color: #f5f5ed; background: #0b3022; clip-path: inset(0); }
.cooling-loader__continue { grid-row: 3; align-self: end; display: inline-flex; align-items: center; gap: 12px; min-height: 44px; margin-top: 32px; padding: 10px 8px; border: 0; color: #bed0c3; background: transparent; font-size: 13px; cursor: pointer; text-underline-offset: 5px; }
.cooling-loader__continue .icon { width: 16px; height: 16px; }
.cooling-loader__continue:hover { color: #f5f5ed; text-decoration: underline; }
.cooling-loader .cooling-loader__continue:focus-visible { outline: 2px solid #bed0c3; outline-offset: 5px; }
.cooling-loader-leave-active { transition: clip-path .8s cubic-bezier(.76, 0, .24, 1); will-change: clip-path; pointer-events: none; }
.cooling-loader-leave-to { clip-path: inset(0 0 100% 0); }
.cooling-loader-leave-active :deep(.cooling-loader__identity) { transition: opacity .24s ease-out; }
.cooling-loader-leave-to :deep(.cooling-loader__identity) { opacity: 0; }
.cooling-loader-leave-active .cooling-loader__continue { transition: opacity .15s ease-out; }
.cooling-loader-leave-to .cooling-loader__continue { opacity: 0; }
.cooling-loader-leave-active :deep(.cooling-loader__flow) { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .cooling-loader-leave-active, .cooling-loader-leave-active :deep(.cooling-loader__identity), .cooling-loader-leave-active .cooling-loader__continue { transition: none; }
}
</style>
