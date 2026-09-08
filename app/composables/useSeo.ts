/* One call per page: unique title and description, canonical on the production
   domain, Open Graph. */
export function usePageSeo(opts: { title: string; description: string; path: string; ogImage?: string }) {
  const site = useRuntimeConfig().public.siteUrl
  const url = `${site}${opts.path === '/' ? '/' : opts.path}`
  const image = `${site}${opts.ogImage || '/images/spaces-diptych.jpg'}`
  useHead({ link: [{ rel: 'canonical', href: url }] })
  useSeoMeta({
    title: opts.title,
    description: opts.description,
    ogTitle: opts.title,
    ogDescription: opts.description,
    ogUrl: url,
    ogType: 'website',
    ogImage: image,
    ogSiteName: 'Setia Air-Cond & Electrical',
    ogLocale: 'en_MY',
    twitterCard: 'summary_large_image',
    twitterTitle: opts.title,
    twitterDescription: opts.description,
    twitterImage: image,
  })
}
