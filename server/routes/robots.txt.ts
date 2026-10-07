// Matches the original site's open policy. Non-production hosts are kept out by the worker's X-Robots-Tag.
export default defineEventHandler((event) => {
  const siteUrl = useRuntimeConfig(event).public.siteUrl
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `User-agent: *\nDisallow:\n\nSitemap: ${new URL('sitemap.xml', siteUrl.replace(/\/?$/, '/')).href}\n`
})
