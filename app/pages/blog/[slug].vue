<script setup lang="ts">
import { daikinArticlePath, daikinArticles } from '~/data/daikin-articles'

const route = useRoute()
const article = computed(() => daikinArticles.find(item => item.slug === route.params.slug))
if (!article.value) throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
const related = computed(() => daikinArticles.filter(item => item.slug !== route.params.slug))

useHead(() => ({
  htmlAttrs: { 'data-theme': 'service' },
  title: `${article.value!.metaTitle} | Setia Air-Cond`,
  meta: [{ name: 'description', content: article.value!.description }],
}))

const { $scrollTo } = useNuxtApp()
const body = useTemplateRef<HTMLElement>('body')
const activeId = ref('')
const progress = ref(0)
let observer: IntersectionObserver | undefined
let frame: number | undefined

function measureProgress() {
  frame = undefined
  const el = body.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const travel = rect.height - window.innerHeight * .6
  progress.value = Math.min(1, Math.max(0, (window.innerHeight * .4 - rect.top) / Math.max(travel, 1)))
}
function onScroll() {
  if (frame === undefined) frame = requestAnimationFrame(measureProgress)
}

function goTo(id: string, event: MouseEvent) {
  const target = document.getElementById(id)
  if (!target || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  history.replaceState(history.state, '', `#${id}`)
  activeId.value = id
  ;(event.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')
  if ($scrollTo) $scrollTo(target, { onComplete: () => target.focus({ preventScroll: true }) })
  else target.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  const sections = body.value?.querySelectorAll<HTMLElement>('[data-blog-section]') ?? []
  activeId.value = sections[0]?.id ?? ''
  // The section crossing the upper third of the viewport is the one being read.
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) activeId.value = entry.target.id
  }, { rootMargin: '-30% 0px -65% 0px' })
  sections.forEach(section => observer!.observe(section))
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  measureProgress()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (frame !== undefined) cancelAnimationFrame(frame)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <CompanyPage v-if="article" current="about" class="blog-page">
    <section class="company-intro company-width blog-grid blog-intro" aria-labelledby="blog-title">
      <div class="blog-intro__copy">
        <NuxtLink class="company-link blog-intro__back" to="/about-us#featured-daikin"><span class="icon icon--arrow" aria-hidden="true" />Featured Daikin products</NuxtLink>
        <h1 id="blog-title">{{ article.title }}</h1>
      </div>
      <div class="blog-intro__media">
        <img :src="$sitePath(article.image.src)" :alt="article.image.alt" :width="article.image.width" :height="article.image.height" decoding="async">
      </div>
    </section>

    <div class="blog-body">
      <div class="company-width blog-layout">
        <div v-if="article.intro.length" class="blog-lead">
          <DaikinArticleBlocks :blocks="article.intro" />
        </div>

        <aside class="blog-toc" aria-label="On this page">
          <div class="blog-toc__panel" data-lenis-prevent>
            <p class="blog-toc__title">On this page</p>
            <ol class="blog-toc__list" :style="{ '--blog-progress': progress }">
              <li v-for="section in article.sections" :key="section.id" :class="{ 'is-active': activeId === section.id }">
                <a :href="`#${section.id}`" :aria-current="activeId === section.id ? 'location' : undefined" @click="goTo(section.id, $event)">{{ section.title }}</a>
              </li>
            </ol>
            <NuxtLink class="blog-toc__quote" to="/get-a-quote">Get a quote<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
          </div>
        </aside>

        <article ref="body" class="blog-article">
          <details class="blog-toc-mobile">
            <summary>On this page<span class="icon icon--arrow" aria-hidden="true" /></summary>
            <ol>
              <li v-for="section in article.sections" :key="section.id">
                <a :href="`#${section.id}`" @click="goTo(section.id, $event)">{{ section.title }}</a>
              </li>
            </ol>
          </details>

          <section
            v-for="section in article.sections"
            :id="section.id"
            :key="section.id"
            class="blog-section"
            :class="{ 'blog-section--callout': section.callout }"
            :aria-labelledby="`${section.id}-title`"
            tabindex="-1"
            data-blog-section
          >
            <h2 :id="`${section.id}-title`">{{ section.title }}</h2>
            <DaikinArticleBlocks :blocks="section.blocks" />
            <NuxtLink v-if="section.callout" class="blog-callout__action" to="/get-a-quote">Get a quote<span class="icon icon--arrow" aria-hidden="true" /></NuxtLink>
          </section>
        </article>
      </div>
    </div>

    <section class="blog-related" aria-labelledby="blog-related-title">
      <div class="company-width">
        <h2 id="blog-related-title">More on Daikin</h2>
        <ul>
          <li v-for="item in related" :key="item.slug">
            <NuxtLink :to="daikinArticlePath(item.slug)">
              <img :src="$sitePath(item.image.src)" :alt="item.image.alt" :width="item.image.width" :height="item.image.height" loading="lazy" decoding="async">
              <span>{{ item.title }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <CompanyEnquirySection heading-id="blog-enquiry-title" />
  </CompanyPage>
</template>

<style scoped>
.blog-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, .75fr); gap: clamp(32px, 6vw, 96px); }
.blog-intro { align-items: center; }
.blog-intro h1 { font-size: clamp(36px, 4.4vw, 64px); }
.blog-intro__back { margin-bottom: 28px; color: var(--company-muted); font-size: 14px; }
.blog-intro__back .icon { transform: scaleX(-1); }
.blog-intro__media { display: grid; place-items: center; padding: clamp(20px, 3vw, 40px); background: #fff; }
.blog-intro__media img { width: 100%; max-width: 360px; height: auto; }

.blog-body { background: var(--paper); color: var(--ink-soft); }
.blog-body ::selection { background: #d1e4d7; color: #0b3022; }
/* The intro spans the full width under the hero; below it the contents rail sits left of the article,
   its first entry level with the first section heading. */
.blog-layout { display: grid; grid-template-columns: minmax(200px, 280px) minmax(0, 1fr); gap: 0 clamp(40px, 6vw, 96px); align-items: start; padding-block: clamp(56px, 7vw, 104px) clamp(64px, 8vw, 120px); }
.blog-article { grid-area: 2 / 2; min-width: 0; max-width: 780px; font-size: 17px; line-height: 1.75; }
.blog-lead { grid-column: 1 / -1; margin-bottom: clamp(48px, 6vw, 88px); padding-bottom: clamp(40px, 5vw, 64px); border-bottom: 1px solid var(--line); font-size: 17px; line-height: 1.75; }
.blog-lead :deep(.daikin-p:first-child) { color: var(--ink); font-size: clamp(20px, 1.8vw, 26px); line-height: 1.55; }
.blog-lead :deep(.daikin-p:last-child) { margin-bottom: 0; }
.blog-section { padding-top: clamp(48px, 5vw, 72px); scroll-margin-top: 16px; }
.blog-section:focus { outline: none; }
.blog-section > h2 { margin: 0 0 24px; color: var(--ink); font-size: clamp(30px, 3vw, 42px); }
.blog-article > .blog-section:first-of-type { padding-top: 0; }

.blog-section--callout { margin-top: clamp(48px, 5vw, 72px); padding: clamp(32px, 4vw, 52px); background: var(--pine-700); color: #d1e4d7; }
.blog-section--callout > h2 { color: var(--paper); }
.blog-section--callout :deep(.daikin-p strong) { color: var(--paper); }
.blog-section--callout :deep(.daikin-p a) { color: var(--paper); }
.blog-section--callout + .blog-section { padding-top: clamp(64px, 6vw, 88px); }
.blog-callout__action { display: inline-flex; align-items: center; gap: 12px; min-height: 48px; margin-top: 8px; padding: 0 22px; border-radius: 999px; background: var(--paper); color: var(--pine-700); font-size: 15px; font-weight: 700; transition: background-color .2s ease, gap .3s cubic-bezier(.16, 1, .3, 1); }
.blog-callout__action .icon { width: 18px; height: 18px; }
.blog-callout__action:hover { gap: 18px; background: #d1e4d7; }
.blog-callout__action:focus-visible { outline: 2px solid var(--paper); outline-offset: 4px; }

/* Contents rail: the track fills with reading progress and the current section lights up. */
.blog-toc { grid-area: 2 / 1; position: sticky; top: 24px; min-width: 0; }
.blog-toc__panel { max-height: calc(100svh - 48px); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: #16513a40 transparent; }
.blog-toc__title { margin: 0 0 16px; color: var(--ink); font-size: 14px; font-weight: 600; }
.blog-toc__list { position: relative; margin: 0; padding: 0 0 0 20px; list-style: none; }
.blog-toc__list::before, .blog-toc__list::after { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 2px; border-radius: 2px; background: var(--line); }
.blog-toc__list::after { background: var(--pine-700); transform: scaleY(var(--blog-progress, 0)); transform-origin: top; transition: transform .15s linear; }
.blog-toc__list a { display: block; padding: 7px 0; color: var(--ink-soft); font-size: 14px; line-height: 1.4; text-wrap: pretty; transition: color .2s ease, transform .35s cubic-bezier(.16, 1, .3, 1); }
.blog-toc__list a:hover { color: var(--ink); }
.blog-toc__list .is-active a { color: var(--pine-700); font-weight: 600; transform: translateX(4px); }
.blog-toc__list a:focus-visible, .blog-toc__quote:focus-visible, .blog-toc-mobile summary:focus-visible { outline: 2px solid var(--pine-700); outline-offset: 3px; }
.blog-toc__quote { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; margin-top: 24px; color: var(--pine-700); font-size: 14px; font-weight: 700; }
.blog-toc__quote .icon { width: 17px; height: 17px; transition: transform .3s cubic-bezier(.16, 1, .3, 1); }
.blog-toc__quote:hover .icon { transform: translateX(4px); }
.blog-toc-mobile { display: none; }

.blog-related { padding-block: clamp(56px, 7vw, 96px); background: #d1e4d7; color: #0b3022; }
.blog-related h2 { margin-bottom: clamp(28px, 4vw, 44px); }
.blog-related ul { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(16px, 2vw, 28px); margin: 0; padding: 0; list-style: none; }
.blog-related a { display: flex; flex-direction: column; gap: 20px; height: 100%; padding: clamp(20px, 2vw, 28px); background: #fff; font-weight: 600; line-height: 1.4; }
.blog-related img { width: 100%; height: 150px; object-fit: contain; transition: transform .3s ease; }
.blog-related a:hover img { transform: scale(1.04); }
.blog-related a:hover span { text-decoration: underline; text-underline-offset: 4px; }

@media (max-width: 1000px) {
  .blog-layout { grid-template-columns: minmax(0, 1fr); }
  .blog-toc { display: none; }
  .blog-article { grid-column: 1; max-width: none; }
  .blog-toc-mobile { display: block; margin-bottom: 40px; border-block: 1px solid var(--line); }
  .blog-toc-mobile summary { display: flex; align-items: center; justify-content: space-between; min-height: 52px; color: var(--ink); font-size: 15px; font-weight: 600; cursor: pointer; list-style: none; }
  .blog-toc-mobile summary::-webkit-details-marker { display: none; }
  .blog-toc-mobile summary .icon { width: 17px; height: 17px; color: var(--pine-700); transform: rotate(90deg); transition: transform .3s ease; }
  .blog-toc-mobile[open] summary .icon { transform: rotate(-90deg); }
  .blog-toc-mobile ol { margin: 0; padding: 0 0 16px 20px; color: var(--ink-soft); font-size: 15px; line-height: 1.5; }
  .blog-toc-mobile li { padding: 6px 0; }
  .blog-toc-mobile a { color: inherit; }
}
@media (max-width: 850px) {
  .blog-intro { grid-template-columns: minmax(0, 1fr); }
  .blog-intro__media { max-width: 420px; }
  .blog-related ul { grid-template-columns: minmax(0, 1fr); }
  .blog-article { font-size: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .blog-toc__list::after, .blog-toc__list a, .blog-callout__action, .blog-toc__quote .icon { transition: none; }
}
</style>
