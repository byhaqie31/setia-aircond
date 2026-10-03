import { clampProgress, PROTOTYPE_SCROLL_SCREENS } from './residential-prototype-path.ts'

// Preserve the approved service timing, then extend the same pinned clock
// through the supplier names and the human ending.
export const RESIDENTIAL_STORY_SCREENS = 14
export const EQUIPMENT_END = PROTOTYPE_SCROLL_SCREENS / RESIDENTIAL_STORY_SCREENS
export const RESIDENTIAL_BRANDS_STOP = .85
export const RESIDENTIAL_CONTACT_STOP = .99

function reveal(value: number, start: number, end: number) {
  const t = clampProgress((value - start) / (end - start))
  return t * t * (3 - 2 * t)
}

export function residentialStoryAt(value: number, brandCount = 8) {
  const p = clampProgress(value)
  const count = Math.max(0, Math.floor(brandCount))
  const brandsExit = reveal(p, .865, .902)
  return {
    equipmentProgress: clampProgress(p / EQUIPMENT_END),
    equipmentOpacity: 1 - reveal(p, EQUIPMENT_END, .681),
    brandsOpacity: reveal(p, .662, .69) * (1 - brandsExit),
    brandsExit,
    brandTitle: reveal(p, .662, .695),
    brandReveals: Array.from({ length: count }, (_, index) => {
      const start = .702 + index / Math.max(1, count - 1) * .105
      return reveal(p, start, start + .035)
    }),
    contactOpacity: reveal(p, .887, .91),
    contactTitle: reveal(p, .892, .926),
    contactTeam: reveal(p, .91, .951),
    contactDetails: reveal(p, .943, .978),
  }
}
