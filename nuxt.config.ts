import { resolve } from 'node:path'
import { allCommercialParties, commercialServices } from './app/data/commercial-view'
import { daikinArticlePath, daikinArticles } from './app/data/daikin-articles'

const cloudflareBuild = process.env.SETIA_CLOUDFLARE_BUILD === '1'
const siteBaseURL = '/'
const commercialDetailRoutes = [
  '/commercial/projects',
  ...commercialServices.map(service => `/commercial/services/${service.slug}`),
  ...allCommercialParties.map(party => `/commercial/clients/${party.slug}`),
  ...daikinArticles.map(article => daikinArticlePath(article.slug)),
]

export default defineNuxtConfig({
  buildDir: cloudflareBuild ? '.nuxt-cloudflare' : '.nuxt',
  nitro: {
    ...(cloudflareBuild ? { output: { dir: resolve('.output-cloudflare') } } : {}),
    prerender: { routes: commercialDetailRoutes },
  },
  compatibilityDate: '2026-09-08',
  devtools: { enabled: true },
  runtimeConfig: {
    public: { siteUrl: 'https://setia-aircond.axelnova.workers.dev/' },
  },
  css: ['lenis/dist/lenis.css', '~/assets/css/main.css', '~/assets/css/service-story.css'],
  app: {
    baseURL: siteBaseURL,
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'SetiaAC',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: `${siteBaseURL}favicon.ico?v=original` },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${siteBaseURL}favicon.png?v=original` },
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
    '/get-a-quote': { prerender: true },
  },
})
