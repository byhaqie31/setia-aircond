import { residentialStoryAt } from './residential-story.ts'

export const COMMERCIAL_ENDING_SCREENS = 4
export const COMMERCIAL_BRANDS_STOP = .56
export const COMMERCIAL_TENDER_STOP = .99
export const COMMERCIAL_FIRST_BRAND_ENTRY = { start: 64, end: 48 } as const

const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
// Keep the approved brand-to-enquiry clock, with Commercial's heading and
// first logo allowed to enter before pinning. Residential timing is independent.
export function commercialEndingAt(value: number, count = 7, entry: { heading?: number; firstBrand?: number } = {}) {
  const state = residentialStoryAt(.662 + clamp(value) * (1 - .662), count)
  const heading = clamp(entry.heading ?? 0)
  const firstBrand = clamp(entry.firstBrand ?? 0)
  return {
    brandTitle: Math.max(state.brandTitle, heading),
    brandsOpacity: Math.max(state.brandsOpacity, Math.min(1, heading * 3) * (1 - state.brandsExit)),
    brandsExit: state.brandsExit,
    brandReveals: state.brandReveals.map((amount, index) => index === 0 ? Math.max(amount, firstBrand) : amount),
    contactOpacity: state.contactOpacity,
    contactTitle: state.contactTitle,
    contactTeam: state.contactTeam,
    contactDetails: state.contactDetails,
  }
}
