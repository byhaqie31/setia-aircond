<script setup lang="ts">
/* The only navigation the site has, so it opens at every width and lays the
   whole site out at once. With JavaScript off it renders open, in the flow. */
const nav = useNavigation()
const route = useRoute()
const { set } = useMenu()
</script>

<template>
  <nav id="navDrawer" class="mastbar__drawer" aria-label="Primary">
    <AudienceSwitch variant="drawer" />
    <ul>
      <li v-for="item in nav.menu" :key="item.to">
        <NuxtLink :to="item.to" :aria-current="route.path === item.to ? 'page' : undefined" @click="set(false)">{{ item.label }}</NuxtLink>
      </li>
    </ul>
  </nav>
</template>
