import type { EquipmentPose } from './equipment-renderer.ts'

export interface CommercialPose extends EquipmentPose {
  subjectWidth: number
  flow: number
  distribution: number
  wiring: number
  maintenance: number
}
type Shot = CommercialPose & { at: number }
export const COMMERCIAL_STOPS = [0, .23, .46, .68, .93] as const
export const COMMERCIAL_SCROLL_SCREENS = 8

const overview = { eye: [2.8, 3.9, 7.5], target: [-1.15, 1.5, 0], fov: 34, shiftX: -.18, shiftY: -.04, subjectWidth: 5.2 } as const
const plant = { eye: [-4.8, 5.5, 6.2], target: [-1.15, 1.5, .1], fov: 36, shiftX: .17, shiftY: -.04, subjectWidth: 5.2 } as const
const distribution = { eye: [5.8, 3.2, 6.4], target: [2.8, 1.3, .2], fov: 36, shiftX: -.19, shiftY: -.04, subjectWidth: 3.7 } as const
const electrical = { eye: [7.7, 2.5, 6.2], target: [4.8, 1.4, .1], fov: 36, shiftX: .18, shiftY: -.04, subjectWidth: 3.6 } as const
const maintenance = { eye: [1.2, 3.7, 7.8], target: [-1.15, 1.7, .3], fov: 36, shiftX: -.2, shiftY: -.05, subjectWidth: 5.3 } as const

function shot(at: number, camera: typeof overview | typeof plant | typeof distribution | typeof electrical | typeof maintenance, state: Partial<CommercialPose> = {}): Shot {
  return { at, ...camera, eye: [...camera.eye], target: [...camera.target], flow: 0, distribution: 0, wiring: 0, maintenance: 0, ...state }
}
const shots = [
  shot(0, overview), shot(.07, overview),
  shot(.19, plant, { flow: 1 }), shot(.28, plant, { flow: 1 }),
  shot(.34, distribution, { eye: [1.4, 6.2, 5.4], target: [.9, 1.4, 0], subjectWidth: 6.4, flow: 1, distribution: .45, shiftX: 0 }),
  shot(.41, distribution, { flow: 1, distribution: 1 }), shot(.5, distribution, { flow: 1, distribution: 1 }),
  shot(.565, electrical, { eye: [5.4, 6.4, 4.5], target: [3.9, 1.4, .1], subjectWidth: 5.4, flow: 1, distribution: 1, wiring: .2, shiftX: 0 }),
  shot(.63, electrical, { flow: 1, distribution: 1, wiring: 1 }), shot(.73, electrical, { flow: 1, distribution: 1, wiring: 1 }),
  shot(.87, maintenance, { maintenance: 1 }), shot(1, maintenance, { maintenance: 1 }),
]
const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }
const mix = (a: number, b: number, t: number) => a + (b - a) * t

export function commercialPoseAt(value: number, aspect = 16 / 9): CommercialPose {
  const p = clamp(value)
  const next = shots.findIndex(shot => shot.at > p)
  const end = shots[next < 0 ? shots.length - 1 : next]!
  const start = shots[Math.max(0, (next < 0 ? shots.length - 1 : next) - 1)]!
  const t = smooth((p - start.at) / (end.at - start.at))
  const pose: CommercialPose = {
    eye: start.eye.map((v, i) => mix(v, end.eye[i]!, t)) as CommercialPose['eye'],
    target: start.target.map((v, i) => mix(v, end.target[i]!, t)) as CommercialPose['target'],
    fov: mix(start.fov, end.fov, t), shiftX: mix(start.shiftX, end.shiftX, t), shiftY: mix(start.shiftY, end.shiftY, t),
    subjectWidth: mix(start.subjectWidth, end.subjectWidth, t), flow: mix(start.flow, end.flow, t),
    distribution: mix(start.distribution, end.distribution, t), wiring: mix(start.wiring, end.wiring, t), maintenance: mix(start.maintenance, end.maintenance, t),
  }
  // Travel around the equipment instead of cutting through a straight camera
  // chord. Reading holds retain their exact framing; the lift belongs to travel.
  const a = start.eye.map((v, i) => v - start.target[i]!)
  const b = end.eye.map((v, i) => v - end.target[i]!)
  const angleA = Math.atan2(a[0]!, a[2]!)
  const angleB = Math.atan2(b[0]!, b[2]!)
  const turn = Math.atan2(Math.sin(angleB - angleA), Math.cos(angleB - angleA))
  const angle = angleA + turn * t
  const radius = mix(Math.hypot(a[0]!, a[2]!), Math.hypot(b[0]!, b[2]!), t)
  const lift = Math.sin(Math.PI * t) * Math.min(.75, Math.abs(turn))
  pose.eye = [pose.target[0] + Math.sin(angle) * radius, pose.target[1] + mix(a[1]!, b[1]!, t) + lift, pose.target[2] + Math.cos(angle) * radius]
  if (aspect <= 1) {
    const delta = pose.eye.map((v, i) => v - pose.target[i]!)
    const distance = Math.hypot(...delta)
    const fit = pose.subjectWidth / (2 * Math.tan(pose.fov * Math.PI / 360) * Math.max(.25, aspect) * .88)
    const fitHeight = (3.15 + .55 * pose.distribution + .1 * pose.maintenance) / (2 * Math.tan(pose.fov * Math.PI / 360) * .45)
    const scale = Math.max(distance * .85, fit, fitHeight) / distance
    pose.eye = pose.target.map((v, i) => v + delta[i]! * scale) as CommercialPose['eye']
    pose.shiftX = 0
    pose.shiftY = -.2 - .03 * pose.wiring
  } else if (aspect < 1.6) {
    pose.eye = pose.eye.map((v, i) => pose.target[i]! + (v - pose.target[i]!) * 1.6 / aspect) as CommercialPose['eye']
  }
  return pose
}

const windows = [[0, 0, .07, .13], [.15, .19, .28, .34], [.37, .41, .5, .56], [.59, .63, .73, .79], [.83, .87, 1, 1]] as const
export function commercialCopyAt(value: number, index: number) {
  const p = clamp(value)
  const [enter, ready, leave, gone] = windows[index] ?? windows[0]
  const arrival = ready === enter ? 1 : smooth((p - enter) / (ready - enter))
  const exit = gone === leave ? 1 : 1 - smooth((p - leave) / (gone - leave))
  return { opacity: arrival * exit, y: (1 - arrival) * 32 - (1 - exit) * 24, reveal: arrival }
}
