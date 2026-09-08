<script setup lang="ts">
/* Plain-language glosses for the public view. The corporate page does not use this. */
import glossary from '~~/content/glossary.json'
const props = defineProps<{ only?: string[] }>()
const terms = computed(() => props.only ? glossary.terms.filter(t => props.only!.includes(t.term)) : glossary.terms)
</script>

<template>
  <aside class="terms reveal" aria-labelledby="terms-title">
    <div class="terms__head">
      <span class="eyebrow">In plain terms</span>
      <h3 id="terms-title" class="terms__title">A few words you'll hear from us, explained.</h3>
    </div>
    <dl>
      <div v-for="t in terms" :key="t.term">
        <dt>{{ t.term }}</dt>
        <dd>{{ t.gloss }}</dd>
      </div>
    </dl>
  </aside>
</template>
