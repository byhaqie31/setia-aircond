<script setup lang="ts">
defineProps<{ stats: { num: string; em?: boolean; suffix?: string; label: string }[] }>()
</script>

<template>
  <div class="ribbon">
    <div class="wrap ribbon__grid">
      <div v-for="s in stats" :key="s.label">
        <div class="ribbon__num"><em v-if="s.em">{{ s.num }}</em><template v-else>{{ s.num }}</template>{{ s.suffix || '' }}</div>
        <div class="ribbon__label">{{ s.label }}</div>
      </div>
    </div>
  </div>
</template>
