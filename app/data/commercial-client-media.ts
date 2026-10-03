import { getCommercialProjectIllustrations, type CommercialClient, type CommercialProjectRecord } from './commercial-view'

export interface CommercialClientPhoto {
  src: string
  alt: string
  caption: string
  width: number
  height: number
  kind: 'representative' | 'project'
  recordId?: string
}

// Add verified client photographs by slug. An optional recordId selects one record.
export const commercialClientPhotos: Record<string, CommercialClientPhoto[]> = {}

export function getCommercialClientPhotos(party: CommercialClient, record: CommercialProjectRecord | null): CommercialClientPhoto[] {
  const supplied = (commercialClientPhotos[party.slug] ?? []).filter(photo => !photo.recordId || photo.recordId === record?.id)
  if (supplied.length) return supplied
  const illustrations = record ? getCommercialProjectIllustrations(record) : [{
    src: '/images/commercial/details/project-air-conditioning.webp',
    alt: 'Representative commercial office with installed air-conditioning equipment',
  }]
  const photos: CommercialClientPhoto[] = illustrations.map((image, index) => ({
    ...image, caption: index === 0 ? 'System overview' : 'Equipment detail',
    width: 1536, height: 1024, kind: 'representative',
  }))
  if (record?.explicitSystems.some(system => /cassette/i.test(system))) photos.push({
    src: '/images/commercial/details/project-cassette-detail-v1.webp',
    alt: 'Representative ceiling cassette air conditioner and commercial ceiling services',
    caption: 'Ceiling cassette', width: 1536, height: 1024, kind: 'representative',
  })
  if (record?.explicitSystems.some(system => /wall-mounted/i.test(system))) photos.push({
    src: '/images/commercial/details/project-wall-mounted-detail-v1.webp',
    alt: 'Representative wall-mounted split air conditioner in a commercial interior',
    caption: 'Wall-mounted unit', width: 1536, height: 1024, kind: 'representative',
  })
  return photos
}
