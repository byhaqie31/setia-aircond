export type BuildingFloor = 'residential' | 'commercial'

/** Set by the home page before it routes into a floor while its matched cover still fills the viewport. */
export interface ServiceArrival {
  floor: BuildingFloor
  /** False when the visitor skipped the camera move, so the floor should settle at once. */
  animate: boolean
}

export function isPlainNavigation(event: Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'defaultPrevented'>) {
  return event.button === 0 && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

/** How a floor continues once the home cover hands over: play its reveal, or settle at once. */
export type ArrivalMode = 'animated' | 'instant'
