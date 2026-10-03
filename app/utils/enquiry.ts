import { companyContact } from '../data/company-contact.ts'

export const enquiryServices = [
  'New installation',
  'Servicing or maintenance',
  'Troubleshooting or repair',
  'Upgrade or replacement',
  'Electrical work',
  'Commercial project or tender',
  'Not sure yet',
] as const

export type EnquiryChannel = 'email' | 'whatsapp'
export type EnquiryProperty = '' | 'residential' | 'commercial'
export type EnquiryDetails = { name: string; contact: string; service: string; location: string; message: string }
export type EnquiryErrors = Partial<Record<keyof EnquiryDetails, string>>

export function enquiryProperty(value: unknown): EnquiryProperty {
  return value === 'residential' || value === 'commercial' ? value : ''
}

export function validateEnquiry(details: EnquiryDetails): EnquiryErrors {
  const errors: EnquiryErrors = {}
  if (!details.name.trim() || details.name.trim().length > 80) errors.name = 'Enter your name, up to 80 characters.'
  const contact = details.contact.trim()
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
  const phone = /^\+?[\d\s().-]+$/.test(contact) && /^\d{7,15}$/.test(contact.replace(/\D/g, ''))
  if ((!email && !phone) || contact.length > 120) errors.contact = 'Enter a valid email address or phone number, including the area code.'
  if (!(enquiryServices as readonly string[]).includes(details.service)) errors.service = 'Choose a service, or select “Not sure yet”.'
  if (details.location.trim().length < 2 || details.location.trim().length > 120) errors.location = 'Enter your area or postcode, up to 120 characters.'
  if (details.message.trim().length > 1000) errors.message = 'Keep your message within 1,000 characters.'
  return errors
}

export function createEnquiryDraft(details: EnquiryDetails, channel: EnquiryChannel, property: EnquiryProperty = '') {
  if (Object.keys(validateEnquiry(details)).length) throw new Error('Complete the enquiry before opening a draft.')
  const subject = property === 'commercial' ? 'Commercial project enquiry' : property === 'residential' ? 'Residential enquiry' : 'Air-conditioning and electrical enquiry'
  const body = [
    'Hello Setia, I would like to enquire about your services.',
    '',
    `Name: ${details.name.trim()}`,
    `Contact: ${details.contact.trim()}`,
    ...(property ? [`Space: ${property === 'commercial' ? 'Commercial' : 'Residential'}`] : []),
    `Service: ${details.service}`,
    `Area / postcode: ${details.location.trim()}`,
    ...(details.message.trim() ? ['', 'Project details:', details.message.trim()] : []),
  ].join('\n')
  const href = channel === 'whatsapp'
    ? `https://wa.me/${companyContact.whatsappNumber}?text=${encodeURIComponent(body)}`
    : `mailto:${companyContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  return { href, body, channel }
}
