export const HOME_FRAME_COUNT = 96
export const HOME_FRAME_WIDTH = 960
export const HOME_FRAME_HEIGHT = 800

export function homeFrameUrl(index: number) {
  const frame = Math.max(0, Math.min(HOME_FRAME_COUNT - 1, Math.round(index))) + 1
  return `/images/residential/sequence/frame-${String(frame).padStart(4, '0')}.webp`
}

export const HOME_SHOT_FRAMES = [0, 35, 63, 95] as const

/** Map real section positions to their composed views, including uneven phone copy. */
export function homeFrameAtProgress(progress: number, sectionPositions: readonly number[]) {
  const first = sectionPositions[0] ?? 0
  const last = sectionPositions[3] ?? first
  if (last <= first) return 0
  const position = first + Math.min(1, Math.max(0, progress)) * (last - first)
  for (let index = 1; index < HOME_SHOT_FRAMES.length; index++) {
    const start = sectionPositions[index - 1]!
    const end = sectionPositions[index]!
    if (position <= end) {
      const fraction = end > start ? Math.min(1, Math.max(0, (position - start) / (end - start))) : 1
      return HOME_SHOT_FRAMES[index - 1]! + fraction * (HOME_SHOT_FRAMES[index]! - HOME_SHOT_FRAMES[index - 1]!)
    }
  }
  return HOME_FRAME_COUNT - 1
}

/** A bounded, seek-first decoded-frame cache. A fast scroll replaces queued work. */
export function createFrameCache<T>(options: {
  load: (index: number, signal: AbortSignal) => Promise<T>
  release: (frame: T) => void
  changed: () => void
  capacity?: number
  concurrency?: number
  radius?: number
}) {
  const capacity = options.capacity ?? 18
  const concurrency = options.concurrency ?? 3
  const radius = options.radius ?? 5
  const frames = new Map<number, T>()
  const pending = new Map<number, AbortController>()
  const failed = new Set<number>()
  let queue: number[] = []
  let target = 0
  let disposed = false
  let enabled = true

  function trim() {
    while (frames.size > capacity) {
      const oldest = [...frames.keys()].sort((a, b) => Math.abs(b - target) - Math.abs(a - target))[0]!
      options.release(frames.get(oldest)!)
      frames.delete(oldest)
    }
  }

  function pump() {
    while (!disposed && enabled && pending.size < concurrency && queue.length) {
      const index = queue.shift()!
      if (frames.has(index) || pending.has(index) || failed.has(index)) continue
      const controller = new AbortController()
      pending.set(index, controller)
      void Promise.resolve().then(() => options.load(index, controller.signal)).then(frame => {
        if (disposed) { options.release(frame); return }
        frames.set(index, frame)
        trim()
        options.changed()
      }).catch(() => {
        if (!disposed) failed.add(index)
      }).finally(() => {
        pending.delete(index)
        pump()
      })
    }
  }

  return {
    seek(index: number) {
      if (disposed) return
      target = Math.max(0, Math.min(HOME_FRAME_COUNT - 1, Math.round(index)))
      queue = [target]
      for (let offset = 1; offset <= radius; offset++) queue.push(target + offset, target - offset)
      queue = queue.filter(frame => frame >= 0 && frame < HOME_FRAME_COUNT)
      pump()
    },
    get(index: number) { return frames.get(index) },
    nearest(index: number) {
      const key = [...frames.keys()].sort((a, b) => Math.abs(a - index) - Math.abs(b - index))[0]
      return key === undefined ? undefined : { index: key, image: frames.get(key)! }
    },
    enable(value: boolean) { enabled = value; if (value) pump() },
    dispose() {
      disposed = true
      queue = []
      for (const controller of pending.values()) controller.abort()
      for (const frame of frames.values()) options.release(frame)
      frames.clear()
    },
    get size() { return frames.size },
  }
}
