<script setup lang="ts">
/* The mockup's styled, keyboard-accessible dropdown, now an enhancement over a
   real <select>. The select is the value the form submits; with scripting off
   it is the control the visitor sees (port.css). */
const props = defineProps<{ modelValue: string; name: string; options: string[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
const open = ref(false)
const root = ref<HTMLElement>()
const btn = ref<HTMLButtonElement>()
const opts = ref<HTMLElement[]>([])

function choose(v: string) { emit('update:modelValue', v); open.value = false; btn.value?.focus() }
function focusOpt(i: number) { const list = opts.value; if (!list.length) return; list[(i + list.length) % list.length]?.focus() }
function onBtnKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault(); open.value = true
    nextTick(() => focusOpt(Math.max(0, props.options.indexOf(props.modelValue))))
  }
}
function onOptKey(e: KeyboardEvent, i: number) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(props.options[i]!) }
  else if (e.key === 'ArrowDown') { e.preventDefault(); focusOpt(i + 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); focusOpt(i - 1) }
  else if (e.key === 'Escape') { open.value = false; btn.value?.focus() }
}
function onDocClick(e: MouseEvent) { if (!root.value?.contains(e.target as Node)) open.value = false }
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" :class="['cselect', open ? 'is-open' : '']">
    <select class="cselect__native" :name="name" :value="modelValue" aria-label="Brand" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option value="">Select brand…</option>
      <option v-for="o in options" :key="o" :value="o">{{ o }}</option>
    </select>
    <button ref="btn" type="button" class="cselect__btn" aria-haspopup="listbox" :aria-expanded="open ? 'true' : 'false'" @click="open = !open" @keydown="onBtnKey">
      <span :class="['cselect__value', modelValue ? '' : 'is-placeholder']">{{ modelValue || 'Select brand…' }}</span>
      <svg class="cselect__caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </button>
    <ul class="cselect__menu" role="listbox" tabindex="-1" :hidden="!open">
      <li
        v-for="(o, i) in options" :key="o" ref="opts"
        :class="['cselect__opt', o === modelValue ? 'is-selected' : '']" role="option" tabindex="-1"
        :aria-selected="o === modelValue ? 'true' : 'false'"
        @click="choose(o)" @keydown="onOptKey($event, i)"
      >{{ o }}</li>
    </ul>
  </div>
</template>
