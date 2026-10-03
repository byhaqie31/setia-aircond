<script setup lang="ts">
import { isPlainNavigation, type BuildingFloor as Floor } from '~/utils/navigation'

const props = defineProps<{ enteringFloor?: Floor | null }>()
const emit = defineEmits<{ enter: [floor: Floor] }>()
const hoveredFloor = ref<Floor | null>(null)
const focusedFloor = ref<Floor | null>(null)
const residentialControl = useTemplateRef<HTMLAnchorElement>('residentialControl')
const commercialControl = useTemplateRef<HTMLAnchorElement>('commercialControl')
const residentialImage = useTemplateRef<HTMLImageElement>('residentialImage')
const commercialImages = useTemplateRef<HTMLImageElement[]>('commercialImages')
const activeFloor = computed(() => props.enteringFloor ?? hoveredFloor.value ?? focusedFloor.value)
const ready = reactive({ residential: false, commercial: false })

// Prerendered images can finish loading before Vue attaches their load handlers.
onMounted(() => {
  const residential = residentialImage.value
  ready.residential = Boolean(residential?.complete && residential.naturalWidth)
  ready.commercial = commercialImages.value?.some(image => image.complete && image.naturalWidth > 0) ?? false
})

function preview(floor: Floor, event: PointerEvent) {
  if (props.enteringFloor) return
  if (event.pointerType === 'mouse' || event.pointerType === 'pen') hoveredFloor.value = floor
}

function leave(floor: Floor) {
  if (hoveredFloor.value === floor) hoveredFloor.value = null
}

function focus(floor: Floor, event: FocusEvent) {
  if ((event.currentTarget as HTMLElement).matches(':focus-visible')) {
    hoveredFloor.value = null
    focusedFloor.value = floor
  }
}

function blur(floor: Floor) {
  if (focusedFloor.value === floor) focusedFloor.value = null
}

function reset() {
  hoveredFloor.value = null
  focusedFloor.value = null
}

function explore(floor: Floor = 'residential') {
  const control = floor === 'residential' ? residentialControl.value : commercialControl.value
  control?.focus({ preventScroll: true })
  focusedFloor.value = floor
}

async function prepareFloor(floor: Floor) {
  const images = floor === 'residential' ? [residentialImage.value] : commercialImages.value ?? []
  await Promise.allSettled(images.map(async image => {
    if (image && typeof image.decode === 'function') await image.decode()
  }))
  ready[floor] = images.some(image => Boolean(image?.complete && image.naturalWidth))
}

function enter(floor: Floor, event: MouseEvent) {
  if (!isPlainNavigation(event)) return
  event.preventDefault()
  if (props.enteringFloor) return
  emit('enter', floor)
}

defineExpose({ explore, prepareFloor })
</script>

<template>
  <div id="explore-building" class="building-scene" @keydown.esc.stop="reset">
    <div class="building-frame">
      <div class="building-canvas" :data-active-floor="activeFloor ?? 'none'">
        <img
          class="building-image building-image--base"
          src="/images/hero/building-dimmed-v1.png"
          alt="A cutaway building overlooking Kuala Lumpur, with a home above an office and café, showing air-conditioning equipment and electrical systems."
          width="1585"
          height="992"
          fetchpriority="high"
        >
        <img
          ref="residentialImage"
          class="building-image building-image--residential"
          :class="{ 'is-lit': activeFloor === 'residential' && ready.residential }"
          src="/images/hero/building-residential-v1.png"
          alt=""
          aria-hidden="true"
          width="1584"
          height="993"
          decoding="async"
          @load="ready.residential = true"
        >
        <img
          v-for="level in ['office', 'cafe']"
          ref="commercialImages"
          :key="level"
          class="building-image"
          :class="[`building-image--${level}`, { 'is-lit': activeFloor === 'commercial' && ready.commercial }]"
          src="/images/hero/building-commercial-v1.png"
          alt=""
          aria-hidden="true"
          width="1586"
          height="992"
          decoding="async"
          @load="ready.commercial = true"
        >

        <div class="floor-controls" role="group" aria-label="Explore our residential and commercial spaces">
          <a
            ref="residentialControl"
            :href="$sitePath('/residential')"
            class="floor-control floor-control--residential"
            :class="{ 'is-active': activeFloor === 'residential' }"
            :aria-disabled="Boolean(enteringFloor) || undefined"
            aria-label="Residential: enter and explore our home services"
            @pointerenter="preview('residential', $event)"
            @pointerleave="leave('residential')"
            @pointercancel="leave('residential')"
            @focus="focus('residential', $event)"
            @blur="blur('residential')"
            @click="enter('residential', $event)"
          >
            <span class="floor-label">
              <span class="floor-label__text">Residential</span>
              <span class="floor-label__line" aria-hidden="true" />
              <span class="floor-label__dot" aria-hidden="true" />
            </span>
          </a>
          <a
            ref="commercialControl"
            :href="$sitePath('/commercial')"
            :aria-disabled="Boolean(enteringFloor) || undefined"
            class="floor-control floor-control--commercial"
            :class="{ 'is-active': activeFloor === 'commercial' }"
            aria-label="Commercial: enter and explore our business services"
            @pointerenter="preview('commercial', $event)"
            @pointerleave="leave('commercial')"
            @pointercancel="leave('commercial')"
            @focus="focus('commercial', $event)"
            @blur="blur('commercial')"
            @click="enter('commercial', $event)"
          >
            <span class="floor-label">
              <span class="floor-label__text">Commercial</span>
              <span class="floor-label__line" aria-hidden="true" />
              <span class="floor-label__dot" aria-hidden="true" />
            </span>
          </a>
        </div>
      </div>
    </div>
    <p class="sr-only" role="status">
      {{ activeFloor === 'residential' ? 'Residential floor illuminated.' : activeFloor === 'commercial' ? 'Office and café illuminated.' : 'Building lights dimmed.' }}
    </p>
  </div>
</template>
