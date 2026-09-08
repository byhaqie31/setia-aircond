import company from '~~/content/company.json'
import navigation from '~~/content/navigation.json'

export const TODO = '__TODO_CLIENT__'
export const isTodo = (v: unknown) => v === TODO || v == null || v === ''

export function useCompany() {
  const year = new Date().getFullYear()
  const addr = company.address
  return {
    ...company,
    year,
    yearsInBusiness: year - company.established,
    addressLine: `${addr.line1}, ${addr.line2}, ${addr.postcode} ${addr.city}, ${addr.state}, ${addr.country}.`,
    addressShort: `${addr.line1.replace(' (Ground Floor)', '')}, ${addr.line2}, ${addr.postcode} ${addr.city}, ${addr.state.replace(' Darul Ehsan', '')}`,
    whatsappUrl(message: string) {
      return `https://wa.me/${company.whatsapp.number}?text=${encodeURIComponent(message)}`
    },
    mailtoUrl(subject: string, body?: string) {
      const q = new URLSearchParams()
      q.set('subject', subject)
      if (body) q.set('body', body)
      return `mailto:${company.email}?${q.toString().replace(/\+/g, '%20')}`
    },
  }
}

export function useNavigation() {
  return navigation
}
