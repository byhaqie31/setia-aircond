<script setup lang="ts">
import { daikinArticlePath, daikinArticles } from '~/data/daikin-articles'
import { articleSchema, jsonLdScript } from '~/utils/structured-data'

const route = useRoute()
const article = computed(() => daikinArticles.find(item => item.slug === route.params.slug))
if (!article.value) throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
const related = computed(() => daikinArticles.filter(item => item.slug !== route.params.slug))

const siteUrl = useRuntimeConfig().public.siteUrl
useHead(() => ({
  htmlAttrs: { 'data-theme': 'service' },
  title: `${article.value!.metaTitle} | Setia Air-Cond`,
  meta: [{ name: 'description', content: article.value!.description }],
  script: [{ key: 'article-schema', ...jsonLdScript(articleSchema(siteUrl, article.value!, route.path)) }],
}))
useSeoMeta({
  ogType: 'article',
  ogTitle: () => article.value!.title,
  ogDescription: () => article.value!.description,
  twitterTitle: () => article.value!.title,
  twitterDescription: () => article.value!.description,
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

    <ArticleBody :intro="article.intro" :sections="article.sections" />

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

.blog-related { padding-block: clamp(56px, 7vw, 96px); background: #d1e4d7; color: #0b3022; }
.blog-related h2 { margin-bottom: clamp(28px, 4vw, 44px); }
.blog-related ul { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(16px, 2vw, 28px); margin: 0; padding: 0; list-style: none; }
.blog-related a { display: flex; flex-direction: column; gap: 20px; height: 100%; padding: clamp(20px, 2vw, 28px); background: #fff; font-weight: 600; line-height: 1.4; }
.blog-related img { width: 100%; height: 150px; object-fit: contain; transition: transform .3s ease; }
.blog-related a:hover img { transform: scale(1.04); }
.blog-related a:hover span { text-decoration: underline; text-underline-offset: 4px; }

@media (max-width: 850px) {
  .blog-intro { grid-template-columns: minmax(0, 1fr); }
  .blog-intro__media { max-width: 420px; }
  .blog-related ul { grid-template-columns: minmax(0, 1fr); }
}
</style>
