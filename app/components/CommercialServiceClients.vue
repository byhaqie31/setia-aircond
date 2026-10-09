<script setup lang="ts">
import { computed } from 'vue'
import { getCommercialClientMonogram, getCommercialClientsForService, type CommercialService } from '~/data/commercial-view'

const props = defineProps<{ service: CommercialService }>()
// Clients recorded with this system in Setia's clientele listing, in the listing's own order.
const clients = computed(() => getCommercialClientsForService(props.service.id))
</script>

<template>
  <section v-if="clients.length" class="service-clients" aria-labelledby="service-clients-heading">
    <div class="service-clients__inner">
      <div class="service-clients__heading">
        <p class="service-clients__eyebrow">Track record</p>
        <h2 id="service-clients-heading">Clients who have taken this service.</h2>
        <p class="service-clients__lead">Recorded for {{ clients.length }} of Setia’s commercial clients.</p>
      </div>
      <ul class="service-clients__list" aria-label="Clients recorded with this system">
        <li v-for="client in clients" :key="client.slug" class="service-clients__mark">
          <span class="service-clients__art" aria-hidden="true">
            <img v-if="client.logoSrc" :src="$sitePath(client.logoSrc)" alt="" loading="lazy" decoding="async" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'">
            <span v-else class="service-clients__monogram">{{ getCommercialClientMonogram(client) }}</span>
          </span>
          <span class="service-clients__name">{{ client.displayName }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.service-clients { color: #f8fbf8; }
.service-clients__inner { width: min(100% - 2 * var(--detail-gutter, clamp(24px, 5.5vw, 80px)), 1440px); margin: auto; padding-top: var(--detail-section, clamp(40px, 4.8vw, 72px)); }
.service-clients__heading { display: grid; gap: 12px; max-width: 62ch; }
.service-clients__eyebrow { margin: 0; color: #a7d2b5; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
.service-clients h2 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(34px, 3.8vw, 54px); font-weight: 400; line-height: 1.08; letter-spacing: -.035em; text-wrap: balance; }
.service-clients__lead { margin: 0; color: #bed0c3; font-size: 16px; line-height: 1.6; }
/* The same pale marks as the clientele screen, as a quiet grid of cards. */
.service-clients__list { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin: 28px 0 0; padding: 0; list-style: none; }
.service-clients__mark { display: grid; justify-items: center; align-content: center; gap: 10px; min-height: 112px; padding: 16px 12px; border: 1px solid #d5e8d933; border-radius: 12px; background: #0f3a2a80; text-align: center; }
.service-clients__art { display: grid; place-items: center; height: 40px; }
.service-clients__art img { display: block; max-width: 120px; max-height: 40px; object-fit: contain; }
.service-clients__monogram { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid #d5e8d980; border-radius: 50%; color: #ebf3ea; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; letter-spacing: .04em; }
.service-clients__name { color: #e9f1eb; font-size: 13px; line-height: 1.3; text-wrap: balance; }
@media (max-width: 550px) {
  .service-clients__list { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .service-clients__mark { min-height: 96px; padding: 12px 8px; }
  .service-clients__art img { max-width: 100px; max-height: 32px; }
}
</style>
