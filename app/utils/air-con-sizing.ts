export interface RoomDimensions {
  lengthFt: number
  widthFt: number
  windowWalls: number
}

export interface CoolingEstimate {
  areaSqFt: number
  capacityHp: number
  coolingWatts: number
  suggestedHp: number
}

// Setia's published enquiry examples use 65 or 75 Btu/h per square foot
// and 9,000 Btu/h per nominal air-con HP. The two-window example uses 75;
// the legacy script accidentally overwrote this result with its second if.
// Sources and the distinction from electrical horsepower are in
// references/about-contact/air-con-calculator.md.
const WATTS_PER_BTU_HOUR = 0.2930711

export function estimateRoomCooling(room: RoomDimensions): CoolingEstimate | null {
  const { lengthFt, widthFt, windowWalls } = room
  if (!Number.isFinite(lengthFt) || lengthFt <= 0
    || !Number.isFinite(widthFt) || widthFt <= 0
    || !Number.isInteger(windowWalls) || windowWalls < 0 || windowWalls > 4) return null

  const areaSqFt = lengthFt * widthFt
  const btuPerHour = areaSqFt * (windowWalls >= 2 ? 75 : 65)
  const capacityHp = btuPerHour / 9000
  const coolingWatts = btuPerHour * WATTS_PER_BTU_HOUR
  // Half-HP increments follow the old calculator; 1 HP is the smallest
  // unit size offered on that enquiry form.
  const suggestedHp = Math.max(1, Math.ceil(capacityHp * 2) / 2)
  if (![areaSqFt, capacityHp, coolingWatts, suggestedHp].every(value => Number.isFinite(value) && value > 0)) return null
  return { areaSqFt, capacityHp, coolingWatts, suggestedHp }
}

/** Plain text for pasting a valid estimate into an enquiry. */
export function formatRoomCoolingEstimate(room: RoomDimensions): string | null {
  const estimate = estimateRoomCooling(room)
  if (!estimate) return null
  const number = (value: number, decimals = 0) => value.toLocaleString('en-MY', { maximumFractionDigits: decimals })
  return [
    `Estimated cooling capacity: ${number(estimate.capacityHp, 2)} HP (${number(estimate.coolingWatts)} watts of cooling).`,
    `Suggested ${estimate.suggestedHp > 3 ? 'total ' : ''}unit capacity: ${number(estimate.suggestedHp, 1)} HP.`,
    `Room: ${number(room.lengthFt, 2)} ft × ${number(room.widthFt, 2)} ft; ${room.windowWalls} ${room.windowWalls === 1 ? 'wall' : 'walls'} with windows.`,
    'Approximate sizing estimate; Setia to confirm the final capacity.',
  ].join('\n')
}
