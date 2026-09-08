import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import company from './content/company.json'
import navigation from './content/navigation.json'

const SITE_URL = company.siteUrl

/* Every route the site ships. The menu is the source; anything not in the menu
   is listed here so the sitemap and the prerenderer agree. */
const ROUTES = Array.from(new Set(navigation.menu.map(m => m.to)))

export default defineNuxtConfig({
  compatibilityDate: '2026-09-08',
  devtools: { enabled: false },

  /* SSG only. Every route is a real HTML file with its full copy in the body. */
  ssr: true,
  nitro: {
    preset: 'static',
    prerender: { crawlLinks: true, failOnError: true, routes: ROUTES },
  },

  modules: ['@nuxt/fonts'],

  css: ['~/assets/css/styles.css', '~/assets/css/port.css'],

  /* Hanken Grotesk and Space Mono are self-hosted at build time. Georgia is a
     system face and is deliberately not fetched. */
  fonts: {
    /* the stylesheet reaches its faces through --body / --mono custom
       properties, so the scanner has to look inside variables */
    processCSSVariables: true,
    families: [
      { name: 'Hanken Grotesk', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal'], global: true },
      { name: 'Space Mono', provider: 'google', weights: [400, 700], styles: ['normal'], global: true },
      { name: 'Georgia', provider: 'none' },
      { name: 'Times New Roman', provider: 'none' },
    ],
    defaults: { subsets: ['latin'] },
  },

  runtimeConfig: {
    public: { siteUrl: SITE_URL },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0A271B' },
      ],
      link: [
        /* TODO(client): the client's own favicon set. The mockup borrowed the Axel Nova favicon. */
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      ],
    },
  },

  hooks: {
    /* Files that must exist in the static output but are not routes: the
       sitemap, the cPanel .htaccess, and a redirect stub for every URL the
       2016 site had. The stubs are plain HTML with a meta refresh and a
       canonical, so they work on any static host with no server rules. */
    'nitro:build:public-assets'(nitro) {
      const out = nitro.options.output.publicDir
      const today = new Date().toISOString().slice(0, 10)

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        ROUTES.map(r => `  <url><loc>${SITE_URL}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
        `\n</urlset>\n`
      writeFileSync(join(out, 'sitemap.xml'), sitemap)

      const legacy: Record<string, string> = {}
      for (const m of navigation.menu) if ('legacy' in m && m.legacy) legacy[m.legacy] = m.to
      for (const [from, to] of Object.entries(navigation.legacyArticles)) if (!from.startsWith('_')) legacy[from] = to

      const htaccess = [
        '# Setia Air-Cond & Electrical — static site',
        'Options -Indexes',
        'RewriteEngine On',
        ...Object.entries(legacy).map(([from, to]) => `Redirect 301 ${from} ${to}`),
        '',
        '<IfModule mod_expires.c>',
        '  ExpiresActive On',
        '  ExpiresByType image/webp "access plus 1 year"',
        '  ExpiresByType image/png "access plus 1 year"',
        '  ExpiresByType image/jpeg "access plus 1 year"',
        '  ExpiresByType font/woff2 "access plus 1 year"',
        '  ExpiresByType text/css "access plus 1 month"',
        '  ExpiresByType application/javascript "access plus 1 month"',
        '</IfModule>',
        '',
      ].join('\n')
      writeFileSync(join(out, '.htaccess'), htaccess)

      for (const [from, to] of Object.entries(legacy)) {
        const target = `${SITE_URL}${to}`
        const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
          `<title>Moved — ${company.displayName}</title>` +
          `<meta name="robots" content="noindex">` +
          `<link rel="canonical" href="${target}">` +
          `<meta http-equiv="refresh" content="0; url=${target}">` +
          `</head><body><p>This page has moved to <a href="${target}">${target}</a>.</p></body></html>\n`
        const file = join(out, from.replace(/^\//, ''))
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, html)
      }
    },
  },
})
