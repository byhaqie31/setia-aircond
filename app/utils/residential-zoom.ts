import { easeCamera, frameKeyframe, roomPose, round, samples, smoothstep, translate, type BuildingZoomPlan, type CameraPose, type Point } from '~/utils/building-zoom'

export type ResidentialZoomPlan = BuildingZoomPlan

// Matches .building-image--residential: the lit upstairs window on the canvas.
const roomWindow: Point[] = [{ x: .47192, y: .27016 }, { x: .84669, y: .22581 }, { x: .84858, y: .42137 }, { x: .47192, y: .45766 }]
const roomFocus: Point = { x: .66, y: .345 }

// Share of the timeline the camera spends travelling; the rest is the hand-off inside the window.
const travel = .64
// Only after the camera has landed: the photo fades in behind the window, then the aperture opens.
const photoFade = { from: travel, to: travel + .18 }
const apertureOpen = { from: travel + .05, to: 1 }
const shadeIn = .8

/**
 * One camera path for both layers. The building scales logarithmically so the
 * push-in reads at a constant speed, while the room photo rides the same path
 * as if it were painted behind the lit window. The photo stays hidden until the
 * camera has come to rest inside the window; only then does it fade in over the
 * lit room and the aperture open until the photo is the full viewport. Played
 * in reverse, the aperture closes and the photo clears before the camera pulls out.
 */
export function planResidentialZoom(frame: HTMLElement, canvas: HTMLElement, duration = 2200): BuildingZoomPlan {
  const frameRect = frame.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()
  const width = window.innerWidth
  const height = window.innerHeight
  const onCanvas = ({ x, y }: Point): Point => ({ x: canvasRect.left + canvasRect.width * x, y: canvasRect.top + canvasRect.height * y })
  const focus = onCanvas(roomFocus)
  const scale = width <= 680 ? 4.2 : 3.1

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
  const bleed = Math.max(width, height) * .1
  const openClip: Point[] = [{ x: -bleed, y: -bleed }, { x: width + bleed, y: -bleed }, { x: width + bleed, y: height + bleed }, { x: -bleed, y: height + bleed }]
  const clipAt = (amount: number) => `polygon(${windowClip.map((from, index) => {
    const to = openClip[index] ?? from
    return `${round(from.x + (to.x - from.x) * amount)}px ${round(from.y + (to.y - from.y) * amount)}px`
  }).join(', ')})`

  // Sample the whole timeline densely enough that the camera leg keeps its usual resolution.
  const steps = Math.round(samples / travel)
  const frameKeyframes: Keyframe[] = []
  const roomKeyframes: Keyframe[] = []
  for (let index = 0; index <= steps; index++) {
    const t = index / steps
    // The camera finishes its move at `travel` and holds its landing pose for the hand-off.
    const pose = camera(easeCamera(Math.min(1, t / travel)))
    frameKeyframes.push(frameKeyframe(t, pose, frameRect))
    const room = roomPose(pose, end)
    roomKeyframes.push({
      offset: t,
      transform: translate(room.offset, room.zoom),
      opacity: smoothstep(photoFade.from, photoFade.to, t).toFixed(3),
      clipPath: clipAt(smoothstep(apertureOpen.from, apertureOpen.to, t)),
    })
  }

  return {
    frame,
    frameKeyframes,
    roomKeyframes,
    shadeKeyframes: [{ opacity: 0, offset: 0 }, { opacity: 0, offset: shadeIn, easing: 'ease' }, { opacity: 1, offset: 1 }],
    duration,
  }
}
