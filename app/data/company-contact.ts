// Published contact details: references/about-contact/2026-09-10/contact-us.html.
export const companyContact = {
  name: 'Setia Air-Cond and Electrical Sdn Bhd',
  registration: '502557-T',
  email: 'mail@setiaaircond.com.my',
  phones: [
    { label: '+603-5633 8325', href: 'tel:+60356338325' },
    { label: '+603-5631 8325', href: 'tel:+60356318325' },
  ],
  tollFree: { label: '1-800-88-7412', href: 'tel:1800887412' },
  fax: '+603-5632 7072',
  address: [
    'No. 4A (Ground Floor), Block H,',
    'Jalan SS13/1F, 47500 Subang Jaya,',
    'Selangor Darul Ehsan, Malaysia.',
  ],
  mapsHref: 'https://www.google.com/maps/search/?api=1&query=Setia%20Air-Cond%20and%20Electrical%20Sdn%20Bhd%2C%20No.%204A%20Block%20H%20Jalan%20SS13%2F1F%20Subang%20Jaya',
  // Retains the destination already configured in the corporate reference.
  whatsappNumber: '60356318325',
} as const
