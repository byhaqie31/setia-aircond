export const homeChapters = [
  {
    id: 'home-planning',
    label: 'Plan',
    title: 'The right cooling, room by room.',
    description: 'Every home uses space differently. We size your air-conditioning around your rooms, cooling needs and budget, so the system fits the way you live.',
    services: ['System design', 'Cooling capacity', 'Room-by-room planning'],
    scene: 'The full apartment establishes how the cooling and electrical systems belong to one home.',
  },
  {
    id: 'home-installation',
    label: 'Install',
    title: 'Everything connected. Comfortably.',
    description: 'From a new split system to replacing an ageing unit, we supply and install the equipment that brings your plan together.',
    services: ['New installation', 'Multi-split systems', 'Upgrades & replacement'],
    scene: 'Scrolling into this section moves the camera close to the wall-mounted air-conditioner and its airflow.',
  },
  {
    id: 'home-electrical',
    label: 'Connect',
    title: 'Power for the way you live.',
    description: 'Plan your wiring, lighting and connected spaces alongside your cooling. Tell us what your home needs, and we’ll confirm the electrical scope with you.',
    services: ['Home wiring', 'Interior lighting', 'Data & network cabling'],
    scene: 'The camera moves across the room to a close-up of the electrical panel and illuminated wiring routes.',
  },
  {
    id: 'home-maintenance',
    label: 'Care',
    title: 'Keep that just-right feeling.',
    description: 'Regular servicing helps your system keep running smoothly. When something feels off, our troubleshooting and repair service helps get your cooling back on track.',
    services: ['Preventive maintenance', 'Troubleshooting', 'Repairs'],
    scene: 'The camera returns to a close view of the air-conditioner as its cover opens and the filter slides forward.',
  },
] as const

// These three brands appear in both the supplied handoff and the source brands page.
export const homeBrands = ['Daikin', 'Acson', 'Panasonic'] as const
export const residentialEnquiry = 'mailto:mail@setiaaircond.com.my?subject=Residential%20air-conditioning%20and%20electrical%20enquiry'
