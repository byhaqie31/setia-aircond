export type Point3 = [number, number, number]

export interface PrototypePose {
  eye: Point3
  target: Point3
  fov: number
  shiftX: number
  shiftY: number
  subjectWidth: number
  cover: number
  wiring: number
  airflow: number
  replacement: number
  filter: number
}

interface Shot extends PrototypePose { at: number }

// Overview, five source services, then the separate electrical chapter.
export const PROTOTYPE_STOPS = [0, .16, .31, .46, .61, .76, .96] as const
export const PROTOTYPE_SCROLL_SCREENS = 9

// Camera coordinates and composition share one reversible scroll clock.
// Repair exposes the coil; maintenance separately brings the filter forward.
const overview = { eye: [2.85, 3.86, 6.14], target: [-1.05, 2.6, .2], fov: 32, shiftX: -.17, shiftY: -.04, subjectWidth: 4.15 } as const
const design = { eye: [.75, 3.5, 7.35], target: [-1.05, 2.6, .2], fov: 32, shiftX: -.2, shiftY: -.04, subjectWidth: 4.15 } as const
const installation = { eye: [-4, 2.984, 6.074], target: [-1.05, 2.6, .25], fov: 34, shiftX: .15, shiftY: -.04, subjectWidth: 4.2 } as const
const upgrade = { eye: [-.1, 3.6, 7.2], target: [-1.05, 2.6, .25], fov: 36, shiftX: -.2, shiftY: -.04, subjectWidth: 4.3 } as const
const repair = { eye: [-3.7, 4.05, 6.55], target: [-1.05, 2.65, .5], fov: 38, shiftX: .15, shiftY: -.04, subjectWidth: 4.2 } as const
const maintenance = { eye: [1.65, 3.9, 6.55], target: [-1.05, 2.65, .5], fov: 38, shiftX: -.15, shiftY: -.04, subjectWidth: 4.2 } as const
const electrical = { eye: [5.2, 1.75, 4.8], target: [2.75, .85, .12], fov: 38, shiftX: -.17, shiftY: .01, subjectWidth: 2.4 } as const

function shot(at: number, camera: { eye: readonly number[]; target: readonly number[]; fov: number; shiftX: number; shiftY: number; subjectWidth: number }, state: Partial<PrototypePose> = {}): Shot {
  return { at, ...camera, eye: [...camera.eye] as Point3, target: [...camera.target] as Point3, cover: 0, wiring: 0, airflow: 0, replacement: 0, filter: 0, ...state }
}

const shots: Shot[] = [
  shot(0, overview), shot(.06, overview),
  shot(.13, design), shot(.18, design),
  shot(.29, installation, { airflow: 1 }), shot(.35, installation, { airflow: 1 }),
  shot(.41, upgrade), shot(.5, upgrade, { replacement: 1, airflow: 1 }),
  shot(.58, repair, { replacement: 1, cover: 1 }), shot(.65, repair, { replacement: 1, cover: 1 }),
  shot(.695, { eye: [-1.15, 2.9, 2.2], target: [-1.05, 2.72, .46], fov: 38, shiftX: 0, shiftY: -.04, subjectWidth: 2.9 }, { replacement: 1, cover: 1 }),
  shot(.73, maintenance, { replacement: 1, cover: 1, filter: 1 }), shot(.8, maintenance, { replacement: 1, cover: 1, filter: 1 }),
  shot(.87, { eye: [2.5, 3.5, 2.1], target: [1.1, 2.7, -.05], fov: 40, shiftX: 0, shiftY: -.03, subjectWidth: 2.3 }, { replacement: 1, wiring: .45 }),
  shot(.93, electrical, { replacement: 1, wiring: 1 }), shot(1, electrical, { replacement: 1, wiring: 1 }),
]

export function clampProgress(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

function smooth(value: number) {
  const t = clampProgress(value)
  return t * t * (3 - 2 * t)
}

function mix(a: number, b: number, t: number) { return a + (b - a) * t }

export function prototypeUpgradeAt(value: number) {
  const progress = clampProgress(value)
  return {
    active: progress > 0 && progress < 1,
    outgoing: smooth((progress - .04) / .64),
    incoming: smooth((progress - .26) / .7),
  }
}
function mixPoint(a: Point3, b: Point3, t: number): Point3 {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
}

export function prototypePoseAt(value: number, aspect = 16 / 9): PrototypePose {
  const p = clampProgress(value)
  const next = shots.findIndex(shot => shot.at > p)
  const end = shots[next < 0 ? shots.length - 1 : next]!
  const start = shots[Math.max(0, (next < 0 ? shots.length - 1 : next) - 1)]!
  const t = smooth((p - start.at) / (end.at - start.at))
  const pose: PrototypePose = {
    eye: mixPoint(start.eye, end.eye, t), target: mixPoint(start.target, end.target, t),
    fov: mix(start.fov, end.fov, t), shiftX: mix(start.shiftX, end.shiftX, t),
    shiftY: mix(start.shiftY, end.shiftY, t), subjectWidth: mix(start.subjectWidth, end.subjectWidth, t),
    cover: mix(start.cover, end.cover, t), wiring: mix(start.wiring, end.wiring, t), airflow: mix(start.airflow, end.airflow, t),
    replacement: mix(start.replacement, end.replacement, t), filter: mix(start.filter, end.filter, t),
  }
  // Portrait gets its own framing: equipment below the copy, fitted horizontally.
  if (aspect <= 1) {
    const safeAspect = Math.max(.25, aspect)
    const delta = pose.eye.map((value, index) => value - pose.target[index]!) as Point3
    const distance = Math.hypot(...delta)
    const fit = pose.subjectWidth * (1 + .25 * pose.wiring) / (2 * Math.tan(pose.fov * Math.PI / 360) * safeAspect * .88)
    const scale = Math.max(distance * .85, fit) / distance
    pose.eye = pose.target.map((value, index) => value + delta[index]! * scale) as Point3
    pose.shiftX = 0
    pose.shiftY = -.17 - .07 * pose.wiring
  } else if (aspect < 1.6) {
    // Keep the product out of the alternating copy columns on narrow desktops.
    const scale = 1.6 / aspect
    pose.eye = pose.eye.map((value, index) => pose.target[index]! + (value - pose.target[index]!) * scale) as Point3
  }
  return pose
}

const copyWindows = [
  [0, 0, .055, .095],
  [.105, .13, .18, .23],
  [.26, .29, .35, .39],
  [.405, .43, .5, .54],
  [.56, .58, .65, .69],
  [.71, .73, .8, .84],
  [.91, .93, 1, 1],
] as const

export function prototypeCopyAt(value: number, index: number) {
  const p = clampProgress(value)
  const [enter, ready, leave, gone] = copyWindows[index] ?? copyWindows[0]
  const arriving = ready === enter ? 1 : smooth((p - enter) / (ready - enter))
  const leaving = gone === leave ? 1 : 1 - smooth((p - leave) / (gone - leave))
  return { opacity: arriving * leaving, y: (1 - arriving) * 24 - (1 - leaving) * 16 }
}

export function prototypeChapterAt(value: number) {
  const p = clampProgress(value)
  return p < .1 ? 0 : p < .25 ? 1 : p < .4 ? 2 : p < .55 ? 3 : p < .7 ? 4 : p < .85 ? 5 : 6
}
