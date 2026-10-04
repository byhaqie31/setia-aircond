export type ScenePhase = 'intro' | 'ready' | 'exit'

export interface CommercialLeader {
  id: string
  targetX: number
  targetY: number
  labelX: number
  labelY: number
  /** 'direct' draws one straight segment from the dot to the label point. */
  elbow?: 'at-target-height' | 'at-label-height' | 'direct'
}

export interface CommercialLabelBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface CompactSceneLabel {
  x: number
  top: number
}

/** Fit non-overlapping touch targets around the exact vertical leader anchors. */
export function compactRowWidths(anchors: readonly number[], width: number): number[] {
  return anchors.map((x, index) => {
    const left = index === 0 ? x : x - anchors[index - 1]!
    const right = index === anchors.length - 1 ? 1 - x : anchors[index + 1]! - x
    const space = Math.min(index === 0 ? left * 2 : left, index === anchors.length - 1 ? right * 2 : right) * width - 6
    return Math.max(44, Math.min(132, space))
  })
}

/** Fit every item into staggered rows without changing its group on a phone. */
export function compactSceneLabels(count: number, width: number, headingBottom: number, heights: readonly number[]): CompactSceneLabel[] {
  const columns = width < 700 || count === 4 ? 2 : Math.min(3, Math.max(1, count))
  const rows = Math.ceil(count / columns)
  const gap = width < 700 ? 14 : 24
  let top = headingBottom + (width < 700 ? 22 : 32)
  return Array.from({ length: rows }, (_, row) => {
    const start = row * columns
    const items = Math.min(columns, count - start)
    const rowHeight = Math.max(44, ...heights.slice(start, start + items))
    const labels = Array.from({ length: items }, (_, column) => ({
      x: items === 1 ? .5 : items === 2 ? .27 + column * .46 : .18 + column * .32,
      top,
    }))
    top += rowHeight + gap
    return labels
  }).flat()
}

/** Stagger adjacent equipment labels while keeping each directly over its dot. */
export function compactEquipmentLabels(anchors: readonly number[], headingBottom: number, heights: readonly number[]): CompactSceneLabel[] {
  const rows = anchors.length > 5 ? anchors.map((_, index) => index % 2) : [0, 1, 0, 2, 1]
  const starts = [headingBottom + 22]
  for (let row = 1; row < 3; row++) {
    const previousHeight = Math.max(44, ...heights.filter((_, index) => rows[index] === row - 1))
    starts[row] = starts[row - 1]! + previousHeight + 14
  }
  return anchors.map((x, index) => ({ x, top: starts[rows[index] ?? 0]! }))
}

/** Lines grow from the equipment/city dot towards the label in both layouts. */
export function commercialLeaderPath(leader: CommercialLeader): string {
  const point = (x: number, y: number) => `${x * 1000} ${y * 1000}`
  if (leader.elbow === 'direct') return `M ${point(leader.targetX, leader.targetY)} L ${point(leader.labelX, leader.labelY)}`
  if (leader.elbow) {
    const corner = leader.elbow === 'at-target-height'
      ? point(leader.labelX, leader.targetY)
      : point(leader.targetX, leader.labelY)
    return `M ${point(leader.targetX, leader.targetY)} L ${corner} L ${point(leader.labelX, leader.labelY)}`
  }
  return `M ${point(leader.targetX, leader.targetY)} L ${point(leader.targetX, leader.labelY)}`
}

export interface GroupableClient {
  slug: string
}

/** Keep the first eight featured clients together: as one page of eight, or as the requested two groups of four. */
export function groupCommercialClients<T extends GroupableClient>(clients: readonly T[], capacity: number): T[][] {
  const size = Math.max(1, Math.min(8, Math.floor(capacity) || 1))
  if (size >= 8 || size < 4 || clients.length <= 4) {
    return chunk(clients, size)
  }

  const featured = [clients.slice(0, 4), clients.slice(4, 8)]
  const remaining = clients.slice(8)
  if (!remaining.length) return featured.filter(group => group.length > 0)

  const count = Math.ceil(remaining.length / size)
  const base = Math.floor(remaining.length / count)
  const extra = remaining.length % count
  let cursor = 0
  const rest = Array.from({ length: count }, (_, index) => {
    const width = base + (index < extra ? 1 : 0)
    const group = remaining.slice(cursor, cursor + width)
    cursor += width
    return group
  })
  return [...featured, ...rest].filter(group => group.length > 0)
}

export function groupForClient<T extends GroupableClient>(groups: readonly T[][], slug: string | null | undefined): number {
  if (!slug) return 0
  const index = groups.findIndex(group => group.some(client => client.slug === slug))
  return index < 0 ? 0 : index
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const groups: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size))
  }
  return groups
}
