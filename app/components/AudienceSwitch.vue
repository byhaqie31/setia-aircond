<script setup lang="ts">
/* Homes · Business & Retail · Corporate & Projects — the persistent switch
   between the two registers. Homes and Business & Retail both live on the
   public view; Corporate & Projects is its own route. */
const props = defineProps<{ variant: 'bar' | 'drawer' }>()
const nav = useNavigation()
const route = useRoute()
const current = computed(() => {
  if (route.path.startsWith('/corporate')) return '/corporate'
  if (route.path === '/' && route.hash === '#services') return '/#services'
  return '/'
})
</script>

<template>
  <nav :aria-label="'Audience'" :class="['aud-switch', `aud-switch--${props.variant}`]">
    <NuxtLink
      v-for="a in nav.audience" :key="a.to" :to="a.to"
      :aria-current="current === a.to ? 'true' : undefined"
    >{{ a.label }}</NuxtLink>
  </nav>
</template>
