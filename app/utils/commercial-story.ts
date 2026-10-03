import { COMMERCIAL_SCROLL_SCREENS } from './commercial-motion-path.ts'

// Keep the equipment's original scroll distance, then reveal the client register
// inside the same pinned stage, using Residential's upward brand folds.
export const COMMERCIAL_STORY_SCREENS = 11
export const COMMERCIAL_EQUIPMENT_END = COMMERCIAL_SCROLL_SCREENS / COMMERCIAL_STORY_SCREENS
export const COMMERCIAL_CLIENTS_STOP = .97

const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
function reveal(value: number, start: number, end: number) {
  const t = clamp((value - start) / (end - start))
  return t * t * (3 - 2 * t)
}

export function commercialStoryAt(value: number, clientCount = 6) {
  const p = clamp(value)
  const count = Math.max(0, Math.floor(clientCount))
  return {
    equipmentProgress: clamp(p / COMMERCIAL_EQUIPMENT_END),
    equipmentOpacity: 1 - reveal(p, COMMERCIAL_EQUIPMENT_END, .78),
    clientsOpacity: reveal(p, .755, .795),
    clientTitle: reveal(p, .755, .80),
    clientReveals: Array.from({ length: count }, (_, index) => {
      const start = .805 + index / Math.max(1, count - 1) * .11
      return reveal(p, start, start + .035)
    }),
  }
}
