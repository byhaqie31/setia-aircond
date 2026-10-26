<script setup lang="ts">
const props = defineProps<{ current: 'about' | 'quote'; stickyHeader?: boolean }>()
const page = useTemplateRef<HTMLElement>('page')
const header = useTemplateRef<HTMLElement>('header')
// The band beneath the sticky header, as 'r, g, b', and whether it needs dark ink.
const blend = ref<string | null>(null)
const lightBand = ref(false)
let headerSize: ResizeObserver | undefined
let sampleFrame: number | undefined

function onScroll() {
  if (sampleFrame === undefined) sampleFrame = requestAnimationFrame(sampleBand)
}

// The header takes on the full-width band just below it, so cards passing beneath don't flicker it.
function sampleBand() {
  sampleFrame = undefined
  const bar = header.value
  if (!bar) return
  const width = document.documentElement.clientWidth
  let node = document.elementFromPoint(width / 2, bar.offsetHeight + 1)
  while (node && node !== document.documentElement) {
    const rgb = node.getBoundingClientRect().width >= width - 1 ? opaqueRgb(getComputedStyle(node).backgroundColor) : null
    if (rgb) {
      blend.value = rgb.join(', ')
      const [r, g, b] = rgb.map(value => value / 255 <= .04045 ? value / 255 / 12.92 : ((value / 255 + .055) / 1.055) ** 2.4)
      lightBand.value = .2126 * r! + .7152 * g! + .0722 * b! > .4
      return
    }
    node = node.parentElement
  }
}

function opaqueRgb(color: string) {
  const channels = color.match(/[\d.]+/g)?.map(Number)
  if (!channels || channels.length < 3 || (channels[3] ?? 1) < .5) return null
  return channels.slice(0, 3)
}

// Pins and anchor landings on the page measure from below the header.
function measureHeader() {
  page.value?.style.setProperty('--company-header-height', `${header.value?.offsetHeight ?? 0}px`)
}

onMounted(() => {
  if (!props.stickyHeader) return
  measureHeader()
  sampleBand()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  headerSize = new ResizeObserver(measureHeader)
  if (header.value) headerSize.observe(header.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (sampleFrame !== undefined) cancelAnimationFrame(sampleFrame)
  headerSize?.disconnect()
})
</script>

<template>
  <div ref="page" class="company-page" :class="{ 'company-page--sticky-header': stickyHeader }">
    <a class="skip-link" href="#page-content">Skip to content</a>
    <header ref="header" class="company-header" :class="{ 'company-header--light': lightBand }" :style="blend ? { '--header-blend': blend } : undefined">
      <div class="site-header company-header__inner">
        <NuxtLink class="brand" to="/" aria-label="Setia Air-Cond and Electrical home"><SetiaWordmark class="brand__name" /></NuxtLink>
        <nav class="site-nav" aria-label="Main navigation">
          <NuxtLink v-if="current === 'about'" class="site-nav__quote" to="/get-a-quote">Get a quote<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
          <NuxtLink v-else class="site-nav__quote" to="/about-us">About us<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
        </nav>
      </div>
    </header>
    <main id="page-content" tabindex="-1"><slot /></main>
    <CompanyFooter />
  </div>
</template>

<style>
.company-page { min-height: 100svh; background: var(--service-stage); color: var(--paper); --company-muted: #bed0c3; --company-line: #bed0c34d; }
.company-page :focus-visible { outline: 2px solid #d1e4d7; outline-offset: 5px; }
.company-page #page-content:focus-visible { outline: none; }
.company-page ::selection { background: #d1e4d7; color: var(--service-stage); }
.company-page h1, .company-page h2 { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; line-height: 1.04; letter-spacing: -.035em; text-wrap: balance; }
.company-page h1 { margin: 0; font-size: clamp(48px, 6vw, 88px); }
.company-page h2 { margin: 0 0 28px; font-size: clamp(36px, 4vw, 60px); }
.company-page p { line-height: 1.7; }
.company-page .company-header { position: relative; z-index: 4; width: 100%; }
/* A sticky header that blends into each band: it takes the exact colour of the band beneath it, with dark ink over
   the light bands. It stays opaque because pinned chapters hold below it, leaving the dark page behind the header.
   Anchored sections land below it. */
.company-page--sticky-header .company-header { --header-blend: 11, 48, 34; position: sticky; top: 0; z-index: 20; color: var(--paper); background-color: rgb(var(--header-blend)); transition: background-color .3s ease, color .3s ease; }
.company-page--sticky-header .company-header .site-nav__quote { color: inherit; transition: color .3s ease; }
.company-page--sticky-header .company-header--light { color: #0b3022; }
.company-page--sticky-header .company-header--light :focus-visible { outline-color: #0b3022; }
.company-page--sticky-header main [id] { scroll-margin-top: var(--company-header-height, 0px); }
/* The header reuses the home page .site-header lockup so the logo, gutters and sizing match page to page. */
.company-width { width: min(100% - var(--page-gutter) * 2, var(--company-content-width, 1240px)); margin-inline: auto; }
.company-intro { padding-block: clamp(56px, 8vw, 120px) clamp(56px, 7vw, 96px); }
.company-intro p { max-width: 54ch; margin: 28px 0 0; color: var(--company-muted); font-size: clamp(17px, 1.4vw, 20px); }
.company-link { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; text-decoration: underline; text-decoration-color: #bed0c380; text-underline-offset: 5px; }
.company-link .icon { width: 18px; height: 18px; }
.company-link:hover { text-decoration-color: currentColor; }
@media (prefers-reduced-motion: no-preference) {
  .company-intro { animation: company-arrive .65s cubic-bezier(.16, 1, .3, 1) both; }
  @keyframes company-arrive { from { opacity: .35; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
}
</style>
