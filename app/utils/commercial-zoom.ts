import { easeCamera, frameKeyframe, roomPose, samples, smoothstep, translate, type BuildingZoomPlan, type CameraPose, type Point } from '~/utils/building-zoom'

// The cutaway building's centre on the hero canvas; the camera pulls back from it while travelling right.
const buildingFocus: Point = { x: .66, y: .56 }

/**
 * The commercial entry pulls the camera back and travels right, so the home
 * building slides off to the left while the commercial scene, riding the same
 * path, enters from the right and settles into place. The
 * building scales logarithmically so the pull-back reads at a constant speed,
 * and the scene crossfades over it mid-move so neither layer ever snaps.
 */
export function planCommercialZoom(frame: HTMLElement, canvas: HTMLElement, duration = 1500): BuildingZoomPlan {
  const frameRect = frame.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()
  const width = window.innerWidth
  const height = window.innerHeight
  const phone = width <= 680
  const focus: Point = { x: canvasRect.left + canvasRect.width * buildingFocus.x, y: canvasRect.top + canvasRect.height * buildingFocus.y }
  const scale = phone ? .8 : .72
  const drift: Point = { x: -width * (phone ? .12 : .16), y: height * (phone ? 0 : .04) }

  // Screen mapping of the frame at eased progress e: p -> offset + zoom * p,
  // with the building's focus drifting left as the camera pulls out and pans right.
  const camera = (e: number): CameraPose => {
    const zoom = scale ** e
    return {
      zoom,
      offset: { x: focus.x + drift.x * e - focus.x * zoom, y: focus.y + drift.y * e - focus.y * zoom },
    }
  }
  const end = camera(1)

  const frameKeyframes: Keyframe[] = []
  const roomKeyframes: Keyframe[] = []
  for (let index = 0; index <= samples; index++) {
    const t = index / samples
    const pose = camera(easeCamera(t))
    frameKeyframes.push(frameKeyframe(t, pose, frameRect))
    const room = roomPose(pose, end)
    roomKeyframes.push({ offset: t, transform: translate(room.offset, room.zoom), opacity: smoothstep(.3, .64, t).toFixed(3) })
  }

  return { frame, frameKeyframes, roomKeyframes, shadeKeyframes: [], duration }
}
