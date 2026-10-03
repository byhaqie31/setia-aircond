export const COMMERCIAL_RECORD_COUNTS = { projects: 8, certifications: 6, capability: 4 } as const
export type CommercialRecordGroup = keyof typeof COMMERCIAL_RECORD_COUNTS
export const COMMERCIAL_RECORD_SCREENS = 15
const lengths: Record<CommercialRecordGroup, number> = { projects: 8, certifications: 3, capability: 4 }
const offsets: Record<CommercialRecordGroup, number> = { projects: 0, certifications: 8, capability: 11 }
const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }

// Projects hold individually. Credentials assemble into one shared grid;
// capabilities pair the two disciplines, then maintenance and supported brands.
// All states derive from the clock so reverse scrolling restores the same layout.
export function commercialRecordAt(progress: number, group: CommercialRecordGroup, index: number) {
  const position = clamp(progress) * COMMERCIAL_RECORD_SCREENS - offsets[group]
  let arrival: number, exit: number
  if (group === 'projects') {
    arrival = smooth((position - index) / .18)
    exit = smooth((position - index - .82) / .18)
  } else if (group === 'certifications') {
    arrival = smooth((position - .18 - index * .16) / .5)
    exit = smooth((position - 2.7) / .3)
  } else {
    const secondBoard = index >= 2
    const delay = index === 1 || index === 2 ? .28 : 0
    arrival = smooth((position - (secondBoard ? 2 : 0) - .12 - delay) / .5)
    exit = secondBoard ? 0 : smooth((position - 1.75) / .25)
  }
  const opacity = arrival * (1 - exit)
  return { opacity, reveal: arrival, exit, visible: opacity > .05 }
}

export function commercialRecordGroupAt(progress: number, group: CommercialRecordGroup) {
  const position = clamp(progress) * COMMERCIAL_RECORD_SCREENS - offsets[group]
  const arrival = smooth(position / .18)
  const exit = group === 'capability' ? 0 : smooth((position - lengths[group] + .18) / .18)
  const opacity = position < 0 ? 0 : arrival * (1 - exit)
  return { opacity, reveal: arrival, visible: opacity > .05 }
}

export function commercialRecordStop(group: CommercialRecordGroup, index = 0) {
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.min(COMMERCIAL_RECORD_COUNTS[group] - 1, Math.floor(index))) : 0
  const position = group === 'projects' ? safeIndex + .5 : group === 'certifications' ? 2 : safeIndex < 2 ? 1.3 : 3.3
  return (offsets[group] + position) / COMMERCIAL_RECORD_SCREENS
}
