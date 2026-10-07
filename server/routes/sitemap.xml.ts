import { absoluteSiteUrl, indexableRoutes } from '../../app/data/site-routes'

export default defineEventHandler((event) => {
  const siteUrl = useRuntimeConfig(event).public.siteUrl
  const urls = indexableRoutes
    .map(path => `  <url>\n    <loc>${absoluteSiteUrl(siteUrl, path)}</loc>\n    <priority>${path === '/' ? '1.00' : '0.80'}</priority>\n  </url>`)
    .join('\n')
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
})
