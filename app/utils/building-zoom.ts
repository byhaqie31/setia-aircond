/** One camera path shared by the home building and the destination scene that replaces it. */
export interface BuildingZoomPlan {
  frame: HTMLElement
  frameKeyframes: Keyframe[]
  roomKeyframes: Keyframe[]
  shadeKeyframes: Keyframe[]
  duration: number
}

export interface Point { x: number; y: number }

export interface CameraPose { zoom: number; offset: Point }

export const samples = 48

export const easeCamera = (t: number) => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2

export const smoothstep = (from: number, to: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - from) / (to - from)))
  return x * x * (3 - 2 * x)
}

export const round = (value: number) => Math.round(value * 100) / 100

export const translate = ({ x, y }: Point, scale: number) => `translate3d(${round(x)}px, ${round(y)}px, 0) scale(${scale.toFixed(4)})`

/** Screen mapping p -> offset + zoom * p, applied to a frame that transforms from its own top-left corner. */
export function frameKeyframe(t: number, { zoom, offset }: CameraPose, frameRect: DOMRect): Keyframe {
  return { offset: t, transform: translate({ x: offset.x + frameRect.left * (zoom - 1), y: offset.y + frameRect.top * (zoom - 1) }, zoom) }
}

/** The arriving layer's own coordinates are the viewport at the end of the move: camera now, composed with the inverse of the final camera. */
export function roomPose({ zoom, offset }: CameraPose, end: CameraPose): CameraPose {
  const roomZoom = zoom / end.zoom
  return { zoom: roomZoom, offset: { x: offset.x - roomZoom * end.offset.x, y: offset.y - roomZoom * end.offset.y } }
}
