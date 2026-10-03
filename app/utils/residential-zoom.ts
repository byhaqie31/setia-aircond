export interface ResidentialZoomPlan {
  frame: HTMLElement
  frameKeyframes: Keyframe[]
  roomKeyframes: Keyframe[]
  shadeKeyframes: Keyframe[]
  duration: number
}

interface Point { x: number; y: number }

// Matches .building-image--residential: the lit upstairs window on the canvas.
const roomWindow: Point[] = [{ x: .47192, y: .27016 }, { x: .84669, y: .22581 }, { x: .84858, y: .42137 }, { x: .47192, y: .45766 }]
const roomFocus: Point = { x: .66, y: .345 }
const samples = 48

const easeCamera = (t: number) => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
const smoothstep = (from: number, to: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - from) / (to - from)))
  return x * x * (3 - 2 * x)
}
const round = (value: number) => Math.round(value * 100) / 100
const translate = ({ x, y }: Point, scale: number) => `translate3d(${round(x)}px, ${round(y)}px, 0) scale(${scale.toFixed(4)})`

/**
 * One camera path for both layers. The building scales logarithmically so the
 * push-in reads at a constant speed, while the room photo rides the same path
 * as if it were painted behind the lit window. It resolves inside the window,
 * then the aperture opens until the photo is the full viewport.
 */
export function planResidentialZoom(frame: HTMLElement, canvas: HTMLElement, duration = 1700): ResidentialZoomPlan {
  const frameRect = frame.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()
  const width = window.innerWidth
  const height = window.innerHeight
  const onCanvas = ({ x, y }: Point): Point => ({ x: canvasRect.left + canvasRect.width * x, y: canvasRect.top + canvasRect.height * y })
  const focus = onCanvas(roomFocus)
  const scale = width <= 680 ? 4.2 : 3.1

  // Screen mapping of the frame at eased progress e: p -> offset + zoom * p,
  // with the room's focus travelling to the viewport centre.
  const camera = (e: number) => {
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

  const frameKeyframes: Keyframe[] = []
  const roomKeyframes: Keyframe[] = []
  for (let index = 0; index <= samples; index++) {
    const t = index / samples
    const { zoom, offset } = camera(easeCamera(t))
    // The frame transforms from its own top-left corner.
    frameKeyframes.push({ offset: t, transform: translate({ x: offset.x + frameRect.left * (zoom - 1), y: offset.y + frameRect.top * (zoom - 1) }, zoom) })
    // Room = frame camera now, composed with the inverse of the final camera.
    const roomZoom = zoom / end.zoom
    roomKeyframes.push({
      offset: t,
      transform: translate({ x: offset.x - roomZoom * end.offset.x, y: offset.y - roomZoom * end.offset.y }, roomZoom),
      opacity: smoothstep(.2, .48, t).toFixed(3),
      clipPath: clipAt(smoothstep(.42, .94, t)),
    })
  }

  return {
    frame,
    frameKeyframes,
    roomKeyframes,
    shadeKeyframes: [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .58 }, { opacity: 1, offset: 1, easing: 'ease' }],
    duration,
  }
}
