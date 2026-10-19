// Air-conditioning services copy, carried over from the original site's air-conditioner-services.html
// (fetched 2026-10-19). The About page shows a summary and both service lists; the full copy lives on
// acServicesPath, and the old .html address redirects there from workers/site.mjs. The page's closing
// keyword line is left out.
import { companyContact } from './company-contact'
import type { DaikinArticle } from './daikin-articles'

export const acServicesPath = '/air-conditioner-services'

export interface AcServiceGroup {
  id: 'residential' | 'commercial'
  title: string
  /** Global icon class suffix: icon--home or icon--factory. */
  icon: 'home' | 'factory'
  items: string[]
  note?: string
}

export const acServiceGroups: AcServiceGroup[] = [
  {
    id: 'residential',
    title: 'Residential',
    icon: 'home',
    items: [
      'Design of Air Cond Systems',
      'New Air Cond installation',
      'Air Cond Upgrade or Replacement',
      'Air Cond Trouble Shooting and Repair Service',
      'Air Cond Preventive Maintenance',
    ],
  },
  {
    id: 'commercial',
    title: 'Commercial',
    icon: 'factory',
    items: [
      'Design of Air Cond Systems',
      'Air Cond New installation',
      'Air Cond Troubleshoot and repair service',
      'Air Cond Preventive Maintenance',
      'Air Cond Retrofit & System Replacement',
      'Filtration & Indoor Air Quality',
      'General Maintenance',
      'Tenant Fit-Out',
      'Ducting Works',
      'Building Automation System (BAS)',
    ],
    note: 'Air conditioning services above cover split type, VRV, chiller, cooling towers & high precision AC.',
  },
]

const [residential, commercial] = acServiceGroups as [AcServiceGroup, AcServiceGroup]

export const acServicesPage: Pick<DaikinArticle, 'title' | 'metaTitle' | 'description' | 'intro' | 'sections'> = {
  title: 'Air Conditioning Services',
  metaTitle: 'AC Repair Services Malaysia Air Conditioning Services',
  description: 'Setia Air Cond offers AC repair services in Malaysia including aircond repair, servicing, Installation and maintenance services.',
  intro: [
    { type: 'p', html: 'Setia Aircond is a trusted provider of AC services in Malaysia, offering professional solutions for residential, commercial, and industrial properties. With years of industry expertise, our certified technicians deliver reliable air conditioning services designed to maximise comfort, improve energy efficiency, and ensure long-term system performance.' },
    { type: 'p', html: 'Whether you require routine AC servicing, urgent AC repair, or a complete system upgrade, Setia Aircond is your dependable partner. Our team specialises in comprehensive air conditioner services including installation, replacement, fault detection, consultation, and preventive maintenance—helping you enjoy an efficient and long-lasting cooling system.' },
    { type: 'p', html: 'We not only support homeowners with residential AC services, but are also a leading name in commercial air conditioning solutions across Malaysia. From offices, retail outlets, and shop lots to large buildings, we provide system design, split unit installations, troubleshooting, ducting, retrofitting, filtration cleaning, tenant fit-outs, and integration with building management systems (BMS).' },
    { type: 'p', html: 'To ensure quality, we supply and service leading air conditioning brands such as York, Carrier, Acson, Fujiaire, Samsung, Daikin, Panasonic, and Toshiba. Whether you have a split unit, central cooling system, or multi-split AC unit, we tailor our AC services to meet your specific needs.' },
    { type: 'p', html: 'If you are searching for reliable and professional AC services in Malaysia, Setia Aircond is here to help. Contact us today for expert servicing, repair, and maintenance to keep your cooling systems running at their best.' },
  ],
  sections: [
    {
      id: 'residential-air-conditioning-services',
      title: 'Residential Air Conditioning Services',
      blocks: [{ type: 'list', columns: 2, items: residential.items }],
    },
    {
      id: 'commercial-air-conditioning-services',
      title: 'Commercial Air Conditioning Services',
      blocks: [
        { type: 'list', columns: 2, items: commercial.items },
        { type: 'p', html: commercial.note! },
      ],
    },
    {
      id: 'why-choose-setia-air-cond',
      title: 'Why Choose Setia Air Cond for Professional AC Services in Malaysia',
      blocks: [
        { type: 'p', html: 'If you’re looking for dependable AC services in Malaysia, Setia Air Cond is your trusted partner for both residential and commercial air conditioning. We recognise the specific needs of Malaysia’s tropical climate, where keeping your indoor spaces cool and comfortable isn’t a luxury but an essential. With our years of experience in the industry and commitment to quality, you can rely on Setia Air Cond to provide reliable solutions for all your air conditioning needs.' },
      ],
    },
    {
      id: 'quality-air-conditioning-services',
      title: 'Quality Air Conditioning Services in Malaysia',
      blocks: [
        { type: 'p', html: 'At Setia Air Cond, we are committed to providing comprehensive air conditioning services in Malaysia, including new air conditioner installation, preventive maintenance, and emergency repair. Whether you need a new unit for your home or regular maintenance for a central AC system in your office, our team of experienced, certified professionals is ready to service all makes and models of AC equipment.' },
        { type: 'p', html: 'We provide both residential and commercial AC services in Malaysia, ensuring long-term comfort and reliability through:' },
        { type: 'list', columns: 2, items: ['Air conditioner installation', 'Aircon servicing and maintenance', 'Emergency AC repair', 'HVAC system troubleshooting', 'Aircon gas top-up', 'Central cooling system maintenance'] },
        { type: 'p', html: 'We perform every service with precision and the highest level of safety, so your air conditioning works effectively all year long.' },
      ],
    },
    {
      id: 'fast-ac-repair-services',
      title: 'Fast and Professional AC Repair Services in Malaysia',
      blocks: [
        { type: 'p', html: 'As a leading provider of AC repair services in Malaysia, Setia Air Cond is known for its swift response and efficient solutions. We understand how critical a functioning cooling system is in Malaysia’s hot and humid weather. That’s why we prioritise urgent repair requests and aim to minimise your downtime with prompt service.' },
        { type: 'p', html: 'From minor issues such as leaking water and unusual noises to major concerns like compressor failures or complete breakdowns, our team uses advanced diagnostic tools to quickly identify the problem and provide the right fix. Our fast turnaround time and technical expertise make us a preferred choice for professional air conditioning repair services in Malaysia.' },
      ],
    },
    {
      id: 'routine-ac-services-and-maintenance',
      title: 'Routine AC Services and Maintenance in Malaysia for Better Energy Efficiency',
      blocks: [
        { type: 'p', html: 'Regular AC services and maintenance are essential for maintaining your system’s performance, energy efficiency, and longevity. At Setia Air Cond, we advocate for preventive maintenance as it helps detect potential problems early, before they escalate into costly repairs.' },
        { type: 'p', html: 'Our routine AC servicing in Malaysia includes:' },
        { type: 'list', columns: 2, items: ['Cleaning and replacing air filters', 'Checking refrigerant levels', 'Inspecting electrical components', 'Cleaning coils and drain lines', 'Verifying thermostat settings'] },
        { type: 'p', html: 'Proper maintenance not only ensures a consistent indoor climate but also reduces electricity consumption, helping you save on utility bills. Our tailored AC service packages in Malaysia make it easy for you to stay on top of your maintenance schedule.' },
      ],
    },
    {
      id: 'transparent-pricing',
      title: 'Transparent Pricing and Honest Service',
      blocks: [
        { type: 'p', html: 'At Setia Air Cond, transparency and honesty are at the core of our services. Our air conditioning services in Malaysia are priced upfront with no hidden fees. We provide a clear quote before beginning any work, so you know exactly what to expect. This openness has earned us the trust of hundreds of homeowners and businesses across Malaysia.' },
        { type: 'p', html: 'Our customer service team is always ready to assist you with questions, schedule appointments, or provide guidance with AC issues. At Setia Air Cond, we ensure your peace of mind every time you choose us for installation, servicing, or repair.' },
      ],
    },
    {
      id: 'experienced-technicians',
      title: 'Experienced Technicians You Can Trust',
      blocks: [
        { type: 'p', html: 'What sets us apart from other providers of AC services in Malaysia is our team of qualified and experienced technicians. Each member of our crew undergoes rigorous training and stays updated with the latest advancements in air conditioning technology. Whether it’s a basic wall unit or a complex central AC system, our technicians deliver reliable repair, servicing, and installation that meets your highest expectations.' },
        { type: 'p', html: 'We also specialise in:' },
        { type: 'list', columns: 2, items: ['Commercial AC systems', 'Inverter air conditioning servicing', 'Split and multi-split systems', 'Ducted air conditioning maintenance'] },
        { type: 'p', html: 'Our technicians are dedicated to delivering quality work with professional results you can trust.' },
      ],
    },
    {
      id: 'go-to-partner-for-ac-services',
      title: 'Your Go-To Partner for AC Services in Malaysia',
      blocks: [
        { type: 'p', html: 'Choosing Setia Air Cond means choosing trust, experience, and peace of mind. From homeowners in need of split system tune-ups to businesses requiring consistent service plans, we have solutions tailored to your needs and budget.' },
        { type: 'p', html: 'Our wide service coverage, from Kuala Lumpur to Selangor and surrounding areas, ensures that professional AC services in Malaysia are just a call away. We are committed to keeping your spaces cool, comfortable, and energy-efficient, no matter the season.' },
      ],
    },
    {
      id: 'contact-setia-air-cond',
      title: 'Contact Setia Air Cond Today',
      callout: true,
      blocks: [
        { type: 'p', html: 'If you’re looking for reliable AC services in Malaysia, Setia Air Cond is here for you. Contact our friendly staff today to schedule your appointment or request a free consultation. Discover how our leading air conditioning services in Malaysia can help keep your surroundings cool and comfortable all year round.' },
        { type: 'p', html: `Call us toll free on <a href="${companyContact.tollFree.href}">${companyContact.tollFree.label}</a> or email <a href="mailto:${companyContact.email}">${companyContact.email}</a>.` },
      ],
    },
  ],
}
