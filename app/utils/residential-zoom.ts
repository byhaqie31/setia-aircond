import { easeCamera, frameKeyframe, roomPose, round, samples, smoothstep, translate, type BuildingZoomPlan, type CameraPose, type Point } from '~/utils/building-zoom'

export type ResidentialZoomPlan = BuildingZoomPlan

// Matches .building-image--residential: the lit upstairs window on the canvas.
const roomWindow: Point[] = [{ x: .47192, y: .27016 }, { x: .84669, y: .22581 }, { x: .84858, y: .42137 }, { x: .47192, y: .45766 }]
const roomFocus: Point = { x: .66, y: .345 }

// The camera never stops to hand off: the interior takes over while it is still flying in.
// The photo fills the lit window early in the push-in, then the window opens out around
// the camera until the room is the whole viewport, and the camera settles inside it.
const photoFade = { from: .22, to: .46 }
const apertureOpen = { from: .42, to: .9 }
const apertureSamples = 24
const shadeIn = .7

// Entering, the camera leaves at once instead of easing out of a standstill, then settles into the room.
const easeEntry = (t: number) => (easeCamera(t) + 1 - (1 - t) ** 3) / 2
// The return plays the path backwards, so this mirror pulls out of the room at once and still lands softly on the building.
const easeReturn = (t: number) => (easeCamera(t) + t ** 3) / 2

/**
 * One camera path for both layers. The building scales logarithmically so the
 * push-in reads at a constant speed, while the room photo rides the same path
 * as if it were painted behind the lit window. Partway through the push-in the
 * photo fades in behind the window, and the aperture opens while the camera is
 * still moving, so outside becomes inside in one continuous move. Played in
 * reverse, the room shrinks back into its window as the camera pulls out.
 *
 * Every layer moves by transform and opacity only, so the whole move runs on the
 * compositor: the window outline is a fixed clip that grows by scaling, never an
 * animated clip-path, which would repaint the room on the main thread each frame.
 */
export function planResidentialZoom(frame: HTMLElement, canvas: HTMLElement, duration = 850, returning = false): BuildingZoomPlan {
  const frameRect = frame.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()
  const width = window.innerWidth
  const height = window.innerHeight
  const onCanvas = ({ x, y }: Point): Point => ({ x: canvasRect.left + canvasRect.width * x, y: canvasRect.top + canvasRect.height * y })
  const focus = onCanvas(roomFocus)
  const scale = width <= 680 ? 4.2 : 3.1
  const ease = returning ? easeReturn : easeEntry

  // Screen mapping of the frame at eased progress e: p -> offset + zoom * p,
  // with the room's focus travelling to the viewport centre.
  const camera = (e: number): CameraPose => {
    const zoom = scale ** e
    return {
      zoom,
      offset: {
        x: focus.x + (width / 2 - focus.x) * e - focus.x * zoom,
        y: focus.y + (height / 2 - focus.y) * e - focus.y * zoom,
      },
    }
  }
  const end = camera(1)

  // The room layer's own coordinates are the viewport at the end of the move.
  const windowClip = roomWindow.map(point => {
    const { x, y } = onCanvas(point)
    return { x: end.offset.x + end.zoom * x, y: end.offset.y + end.zoom * y }
  })
  // The window opens by growing about its own centre, so its outline keeps the window's
  // shape, until it covers the viewport with a small margin.
  const origin: Point = { x: windowClip.reduce((sum, { x }) => sum + x, 0) / windowClip.length, y: windowClip.reduce((sum, { y }) => sum + y, 0) / windowClip.length }
  const bleed = Math.max(width, height) * .02
  const viewportCorners: Point[] = [{ x: -bleed, y: -bleed }, { x: width + bleed, y: -bleed }, { x: width + bleed, y: height + bleed }, { x: -bleed, y: height + bleed }]
  const insideWindow = ({ x, y }: Point, scale: number) => windowClip.every((from, index) => {
    const to = windowClip[(index + 1) % windowClip.length]!
    const point = { x: origin.x + (x - origin.x) / scale, y: origin.y + (y - origin.y) / scale }
    return (to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x) >= 0
  })
  let openScale = 64
  for (let low = 1, step = 0; step < 24; step++) {
    const scale = (low + openScale) / 2
    if (viewportCorners.every(corner => insideWindow(corner, scale))) openScale = scale
    else low = scale
  }

  const frameKeyframes: Keyframe[] = []
  const roomKeyframes: Keyframe[] = []
  for (let index = 0; index <= samples; index++) {
    const t = index / samples
    // The camera moves for the whole timeline and lands as the room fills the viewport.
    const pose = camera(ease(t))
    frameKeyframes.push(frameKeyframe(t, pose, frameRect))
    const room = roomPose(pose, end)
    roomKeyframes.push({
      offset: t,
      transform: translate(room.offset, room.zoom),
      opacity: smoothstep(photoFade.from, photoFade.to, t).toFixed(3),
    })
  }

  // The aperture scales up while the view inside it scales down by the same amount, so the
  // window outline grows on the compositor and the photo stays put. Until it starts
  // opening, both hold still.
  const apertureKeyframes: Keyframe[] = []
  const viewKeyframes: Keyframe[] = []
  for (let index = 0; index <= apertureSamples; index++) {
    const progress = index / apertureSamples
    const t = apertureOpen.from + (apertureOpen.to - apertureOpen.from) * progress
    const scale = openScale ** smoothstep(apertureOpen.from, apertureOpen.to, t)
    apertureKeyframes.push({ offset: progress, transform: `scale(${scale.toFixed(5)})` })
    viewKeyframes.push({ offset: progress, transform: `scale(${(1 / scale).toFixed(5)})` })
  }

  return {
    frame,
    frameKeyframes,
    roomKeyframes,
    shadeKeyframes: [{ opacity: 0, offset: 0 }, { opacity: 0, offset: shadeIn, easing: 'ease' }, { opacity: 1, offset: 1 }],
    aperture: {
      clip: `polygon(${windowClip.map(({ x, y }) => `${round(x)}px ${round(y)}px`).join(', ')})`,
      origin,
      keyframes: apertureKeyframes,
      viewKeyframes,
      from: apertureOpen.from,
    },
    duration,
  }
}
