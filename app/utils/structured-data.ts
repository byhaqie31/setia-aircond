import { companyContact } from '~/data/company-contact'
import type { DaikinArticle, DaikinBlock } from '~/data/daikin-articles'
import { absoluteSiteUrl } from '~/data/site-routes'

const stripTags = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()

/** Site-wide business identity, carried over from the original site's LocalBusiness markup with the published contact details. */
export function businessSchema(siteUrl: string) {
  const root = absoluteSiteUrl(siteUrl, '/')
  return {
    '@type': 'HVACBusiness',
    '@id': `${root}#business`,
    name: companyContact.name,
    alternateName: 'Setia Air-Cond',
    url: root,
    logo: new URL('apple-touch-icon.png', root).href,
    image: new URL('images/social/setia-aircond-og-v2.png', root).href,
    description: 'Setia Air-Cond and Electrical Sdn Bhd supplies, installs and maintains air-conditioning and electrical systems for residential and commercial properties in Malaysia, carrying brands including Daikin, Acson, Panasonic, York, Carrier, Fujiaire and Toshiba.',
    telephone: '+60356338325',
    faxNumber: '+60356327072',
    email: companyContact.email,
    foundingDate: '1990',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No. 4A (Ground Floor), Block H, Jalan SS13/1F',
      addressLocality: 'Subang Jaya',
      addressRegion: 'Selangor',
      postalCode: '47500',
      addressCountry: 'MY',
    },
    areaServed: [
      { '@type': 'City', name: 'Kuala Lumpur' },
      { '@type': 'State', name: 'Selangor' },
      { '@type': 'Country', name: 'Malaysia' },
    ],
    contactPoint: { '@type': 'ContactPoint', telephone: '+601800887412', contactType: 'customer service', areaServed: 'MY' },
  }
}

function plainAnswer(blocks: DaikinBlock[]): string {
  return blocks.map((block) => {
    if (block.type === 'p') return stripTags(block.html)
    if (block.type === 'list') return block.items.map(stripTags).join('; ')
    return ''
  }).filter(Boolean).join(' ')
}

/** Article, breadcrumb and (where the article has one) FAQ markup, as the original blog pages carried. */
export function articleSchema(siteUrl: string, article: DaikinArticle, path: string) {
  const url = absoluteSiteUrl(siteUrl, path)
  const root = absoluteSiteUrl(siteUrl, '/')
  const faqs = article.sections.flatMap(section => section.blocks).flatMap(block => block.type === 'faq' ? block.items : [])
  return [
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: article.title,
      description: article.description,
      image: new URL(article.image.src.replace(/^\//, ''), root).href,
      mainEntityOfPage: url,
      inLanguage: 'en-MY',
      about: { '@type': 'Brand', name: 'Daikin' },
      author: { '@id': `${root}#business` },
      publisher: { '@id': `${root}#business` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: root },
        { '@type': 'ListItem', position: 2, name: 'About us', item: absoluteSiteUrl(siteUrl, '/about-us') },
        { '@type': 'ListItem', position: 3, name: article.title, item: url },
      ],
    },
    ...(faqs.length ? [{
      '@type': 'FAQPage',
      mainEntity: faqs.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: plainAnswer(item.blocks) },
      })),
    }] : []),
  ]
}

export function jsonLdScript(graph: object[]) {
  return { type: 'application/ld+json' as const, innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }
}
