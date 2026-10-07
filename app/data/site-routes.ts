import { allCommercialParties, commercialServices } from './commercial-view'
import { daikinArticlePath, daikinArticles } from './daikin-articles'

// Generated detail pages; nuxt.config prerenders these alongside the routeRules pages.
export const detailRoutes = [
  '/commercial/projects',
  ...commercialServices.map(service => `/commercial/services/${service.slug}`),
  ...allCommercialParties.map(party => `/commercial/clients/${party.slug}`),
  ...daikinArticles.map(article => daikinArticlePath(article.slug)),
]

// Every page meant for search results, as listed in /sitemap.xml. The motion prototype stays out (noindex).
export const indexableRoutes = ['/', '/residential', '/commercial', '/about-us', '/get-a-quote', ...detailRoutes]

/** Absolute URL in the form the site is served at: Cloudflare serves /path/index.html at /path/. */
export function absoluteSiteUrl(siteUrl: string, path: string) {
  const url = new URL(siteUrl.replace(/\/?$/, '/'))
  const clean = path.replace(/^\/+|\/+$/g, '')
  url.pathname += clean ? `${clean}/` : ''
  return url.href
}
