import { resolve } from 'node:path'
import { detailRoutes } from './app/data/site-routes'

const cloudflareBuild = process.env.SETIA_CLOUDFLARE_BUILD === '1'
const siteBaseURL = '/'

export default defineNuxtConfig({
  buildDir: cloudflareBuild ? '.nuxt-cloudflare' : '.nuxt',
  nitro: {
    ...(cloudflareBuild ? { output: { dir: resolve('.output-cloudflare') } } : {}),
    prerender: { routes: [...detailRoutes, '/sitemap.xml', '/robots.txt'] },
  },
  compatibilityDate: '2026-09-08',
  devtools: { enabled: true },
  runtimeConfig: {
    // Production origin for canonicals, og:url and the sitemap; preview hosts are noindexed by workers/site.mjs.
    public: { siteUrl: 'https://www.setiaaircond.com.my/' },
  },
  css: ['lenis/dist/lenis.css', '~/assets/css/main.css', '~/assets/css/service-story.css'],
  app: {
    baseURL: siteBaseURL,
    head: {
      htmlAttrs: { lang: 'en-MY' },
      title: 'SetiaAC',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: `${siteBaseURL}favicon.ico?v=bright` },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${siteBaseURL}favicon.png?v=bright` },
        { rel: 'apple-touch-icon', sizes: '180x180', href: `${siteBaseURL}apple-touch-icon.png` },
      ],
    },
  },
  routeRules: {
    '/': { prerender: true },
    '/residential': { prerender: true },
    '/commercial': { prerender: true },
    '/residential-prototype': { prerender: true },
    '/about-us': { prerender: true },
    '/air-conditioner-services': { prerender: true },
    '/get-a-quote': { prerender: true },
  },
})
