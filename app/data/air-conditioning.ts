// Copy supplied directly by Takip from the services reference, 2026-09-10.
export const airConditioningIntro = {
  title: 'Our air conditioning services.',
  description: 'A complete scope of work for homes, offices, retail and industrial spaces supplying and supporting Daikin, Acson, Panasonic, York, Carrier, Fujiaire, Samsung and Toshiba.',
} as const

export const airConditioningServices = [
  {
    id: 'air-conditioning-design', number: '01', label: 'Design',
    title: 'Design of Air-Cond Systems',
    description: 'Sizing and system design tailored to your space, load and budget.',
  },
  {
    id: 'air-conditioning-installation', number: '02', label: 'Install',
    title: 'New Air-Cond Installation',
    description: 'Professional installation of split, multi-split, cassette and ducted systems.',
  },
  {
    id: 'air-conditioning-replacement', number: '03', label: 'Upgrade',
    title: 'Air-Cond Upgrade or Replacement',
    description: 'Swapping ageing units for efficient inverter systems with minimal disruption.',
  },
  {
    id: 'air-conditioning-repair', number: '04', label: 'Repair',
    title: 'Troubleshooting & Repair Service',
    description: 'Fast diagnosis and repair to get cooling back online.',
  },
  {
    id: 'air-conditioning-maintenance', number: '05', label: 'Maintain',
    title: 'Preventive Maintenance',
    description: 'Scheduled servicing that keeps units running smoothly and lasting longer.',
  },
] as const

export const airConditioningBrands = ['Daikin', 'Acson', 'Panasonic', 'York', 'Carrier', 'Fujiaire', 'Samsung', 'Toshiba'] as const
// Manufacturer assets and the YORK distributor artwork; provenance is archived
// in references/brands/2026-09-10. The source list and order stay unchanged.
export const airConditioningBrandLogos = [
  { name: 'Daikin', src: '/images/brands/daikin.svg', width: 183, height: 39, treatment: 'light' },
  { name: 'Acson', src: '/images/brands/acson.png', width: 160, height: 50, treatment: 'light' },
  { name: 'Panasonic', src: '/images/brands/panasonic.svg', width: 600, height: 92, treatment: 'solid' },
  { name: 'York', src: '/images/brands/york.svg', width: 382, height: 136, treatment: 'reverse' },
  { name: 'Carrier', src: '/images/brands/carrier.png', width: 800, height: 320, treatment: 'reverse' },
  { name: 'Fujiaire', src: '/images/brands/fujiaire.png', width: 233, height: 62, treatment: 'reverse' },
  { name: 'Samsung', src: '/images/brands/samsung.svg', width: 130, height: 29, treatment: 'solid' },
  { name: 'Toshiba', src: '/images/brands/toshiba.png', width: 459, height: 70, treatment: 'solid' },
] as const
export const airConditioningEnquiry = '/get-a-quote?property=residential'

// Residential-only replacement requested on 2026-10-02; shared/About list stays intact.
export const residentialBrandLogos = airConditioningBrandLogos.map(brand => brand.name === 'Fujiaire'
  ? { name: 'Midea', src: '/images/brands/midea.svg', width: 3228, height: 1242, treatment: 'solid' as const }
  : brand)
