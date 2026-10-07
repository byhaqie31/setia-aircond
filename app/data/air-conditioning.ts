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
// York swapped on 2026-10-04 for the wordmark without its tagline, cut to a
// transparent background from references/brands/york-download-2026-10-04.webp.
export const airConditioningBrandLogos = [
  { name: 'Daikin', src: '/images/brands/daikin.svg', width: 183, height: 39, treatment: 'light' },
  { name: 'Acson', src: '/images/brands/acson.png', width: 160, height: 50, treatment: 'light' },
  { name: 'Panasonic', src: '/images/brands/panasonic.svg', width: 600, height: 92, treatment: 'solid' },
  { name: 'York', src: '/images/brands/york-v2.webp', width: 905, height: 197, treatment: 'reverse' },
  { name: 'Carrier', src: '/images/brands/carrier.png', width: 800, height: 320, treatment: 'reverse' },
  { name: 'Fujiaire', src: '/images/brands/fujiaire.png', width: 233, height: 62, treatment: 'reverse' },
  { name: 'Samsung', src: '/images/brands/samsung.svg', width: 130, height: 29, treatment: 'solid' },
  { name: 'Toshiba', src: '/images/brands/toshiba.png', width: 459, height: 70, treatment: 'solid' },
] as const
export const airConditioningEnquiry = '/get-a-quote?property=residential'

const mideaBrandLogo = { name: 'Midea', src: '/images/brands/midea.svg', width: 3228, height: 1242, treatment: 'solid' } as const
// Residential-only replacement requested on 2026-10-02; the shared list stays intact.
export const residentialBrandLogos = airConditioningBrandLogos.map(brand => brand.name === 'Fujiaire' ? mideaBrandLogo : brand)

// Chiller and plant-room makers requested for Commercial on 2026-10-02.
// Original manufacturer artwork: references/brands/commercial-2026-10-02.md.
export const commercialPlantBrandLogos = [
  { name: 'Trane', src: '/images/brands/trane.png', width: 2385, height: 795, treatment: 'solid' },
  { name: 'Dunham-Bush', src: '/images/brands/dunham-bush.webp', width: 170, height: 85, treatment: 'solid' },
  { name: 'Daikin Applied', src: '/images/brands/daikin-applied.png', width: 2463, height: 413, treatment: 'solid' },
] as const

// About us shows every brand carried: the shared list, the plant-room makers and Midea.
export const aboutBrandLogos = [...airConditioningBrandLogos, ...commercialPlantBrandLogos, mideaBrandLogo]

// Featured Daikin range and copy carried over verbatim from the original homepage; each links to its article in ~/data/daikin-articles.
export const featuredDaikinProducts = [
  {
    title: 'Energy Efficiency and Advanced Features',
    body: 'Daikin Malaysia air conditioners are renowned for high energy efficiency, helping users reduce electricity bills while minimising environmental impact. Many units feature advanced air purification systems, removing dust, allergens, and bacteria to create healthier indoor environments. With smart sensors, automatic operation modes, and Wi-Fi-enabled control options, Daikin air cond Malaysia provides intelligent cooling solutions tailored to both residential and commercial spaces.',
    link: 'Read more about Daikin Air Conditioners',
    href: '/blog/7-reasons-to-choose-daikin-air-conditioner-for-your-malaysia-home',
    src: '/images/daikin/wall-split.jpg', alt: 'Daikin Air Conditioners', width: 350, height: 215,
  },
  {
    title: 'Reliable Cooling for Every Space',
    body: 'Whether you need a Daikin air cond Malaysia for a compact apartment, large office, retail outlet, or industrial facility, Daikin offers dependable solutions with long-lasting performance. Multi-split systems allow one outdoor unit to connect multiple indoor units, while ducted systems provide seamless climate control for larger spaces. All units are designed to maintain consistent cooling, minimise noise, and deliver precise temperature control.',
    link: 'Read more about the Benefits of Daikin VRV Systems Air Conditioners',
    href: '/blog/reasons-to-choose-daikin-vrv-system-for-your-air-conditioning',
    src: '/images/daikin/vrv-outdoor.jpg', alt: 'Daikin VRV Systems (Multi-Split Type Air Conditioners)', width: 350, height: 227,
  },
  {
    title: 'Why Choose Daikin in Malaysia',
    body: 'With decades of innovation and a strong commitment to durability and sustainability, Daikin remains a preferred choice for Malaysians seeking reliable and energy-efficient air conditioning. From residential homes to large commercial projects, Daikin Malaysia air conditioners combine cutting-edge technology, low maintenance, and excellent after-sales service. Investing in Daikin means choosing a trusted brand that delivers comfort, performance, and efficiency throughout Malaysia.',
    link: 'Read more about Why Should You Choose Daikin Air Conditioner?',
    href: '/blog/why-should-you-choose-daikin-air-conditioner',
    src: '/images/daikin/ceiling-cassette.jpg', alt: 'Daikin Air Conditioners', width: 350, height: 215,
  },
  {
    title: 'Reasons to Choose Daikin Air Conditioners for Your Malaysia Home',
    body: 'Living in Malaysia’s hot and humid climate means having a dependable cooling solution is essential all year round. For homeowners seeking quality and performance, Daikin air conditioners Malaysia offer exceptional energy efficiency, long-lasting durability, and whisper-quiet operation. Choosing the right unit requires understanding your home’s layout, room size, and cooling requirements. By assessing your specific needs first, you can select the ideal Daikin air conditioner to keep your living spaces comfortable and refreshing. Trust in a brand renowned across Malaysia for reliable cooling and advanced technology, ensuring your home remains a haven from the heat.',
    link: 'Read more about Reasons to Choose Daikin Air Conditioning for Your Malaysia Home',
    href: '/blog/reasons-to-choose-daikin-air-conditioning-for-your-malaysia-home',
    src: '/images/daikin/ceiling-suspended.jpg', alt: 'inverter series', width: 350, height: 227,
  },
] as const
