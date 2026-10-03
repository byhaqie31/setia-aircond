export interface CommercialServicePhoto {
  id: string
  placement: 'system' | 'scope' | 'gallery'
  src: string
  smallSrc?: string
  alt: string
  caption: string
  width: number
  height: number
  isIllustrative: boolean
  crop?: { scale: number; position: string }
}

type EquipmentDetail = Pick<CommercialServicePhoto, 'alt' | 'caption' | 'crop'>

// The four existing equipment assets have one source view each. Detail crops
// show parts of that same image; they are not additional site photographs.
function equipmentViews(slug: string, overview: string, system: EquipmentDetail, scope: EquipmentDetail): CommercialServicePhoto[] {
  const source = { src: `/images/commercial/details/${slug}.webp`, width: 1536, height: 1024, isIllustrative: true }
  return [
    { ...source, id: `${slug}-overview`, placement: 'gallery', alt: overview, caption: overview + '.' },
    { ...source, id: `${slug}-system-detail`, placement: 'system', ...system },
    { ...source, id: `${slug}-connections-detail`, placement: 'scope', ...scope },
  ]
}

// Add approved client photos here. Use placement: 'gallery' for extra images;
// the page grows automatically. Mark genuine project photos as non-illustrative.
export const commercialServicePhotos: Record<string, CommercialServicePhoto[]> = {
  'chilled-water-piping': [
    { id: 'piping-connections', placement: 'scope', src: '/images/commercial/details/pump.webp', width: 1536, height: 1024, isIllustrative: true, alt: 'Illustrative pump and connected cooling-system pipework', caption: 'Pipework and equipment connections.' },
    { id: 'piping-chiller', placement: 'gallery', src: '/images/commercial/details/chiller.webp', width: 1536, height: 1024, isIllustrative: true, alt: 'Illustrative water connections at a chiller', caption: 'Water connections at the cooling plant.' },
  ],
  'duct-services': [
    { id: 'duct-connections', placement: 'scope', src: '/images/commercial/details/ahu.webp', width: 1536, height: 1024, isIllustrative: true, alt: 'Illustrative air-handling unit and connected ductwork', caption: 'Air-handling equipment and connected ductwork.' },
  ],
  'cooling-tower': [
    {
      id: 'cooling-tower-fan-detail',
      placement: 'system',
      src: '/images/commercial/details/cooling-tower-fan-detail-v1.webp',
      smallSrc: '/images/commercial/details/cooling-tower-fan-detail-v1-800.webp',
      alt: 'Cooling tower fan beneath a steel safety guard, with casing and intake louvers',
      caption: 'Fan, casing and air intake.',
      width: 1536, height: 1024, isIllustrative: true,
    },
    {
      id: 'cooling-tower-water-connections',
      placement: 'scope',
      src: '/images/commercial/details/cooling-tower-water-connections-v1.webp',
      smallSrc: '/images/commercial/details/cooling-tower-water-connections-v1-800.webp',
      alt: 'Supported green water pipes, flanged connections and valves beside cooling tower louvers',
      caption: 'Water connections and access around the tower.',
      width: 1536, height: 1024, isIllustrative: true,
    },
    {
      id: 'cooling-tower-rooftop-view',
      placement: 'gallery',
      src: '/images/commercial/details/cooling-tower-rooftop-view-v1.webp',
      smallSrc: '/images/commercial/details/cooling-tower-rooftop-view-v1-800.webp',
      alt: 'Three cooling tower cells, connected pipework and access walkways on a commercial rooftop',
      caption: 'A wider view of a rooftop cooling-tower arrangement.',
      width: 1536, height: 1024, isIllustrative: true,
    },
  ],
  pump: equipmentViews('pump', 'Pump and motor beside cooling pipework',
    { alt: 'Detail of the pump motor and coupling', caption: 'Motor and pump coupling.', crop: { scale: 1.7, position: '30% 65%' } },
    { alt: 'Detail of the pump casing, flanges and isolation valve', caption: 'Pump connections and isolation valve.', crop: { scale: 1.8, position: '72% 40%' } }),
  chiller: equipmentViews('chiller', 'Chiller in a commercial cooling plant',
    { alt: 'Detail of the compressor assembly above the chiller vessel', caption: 'Compressor assembly and chiller vessel.', crop: { scale: 1.6, position: '55% 25%' } },
    { alt: 'Detail of insulated water pipes and flanged chiller connections', caption: 'Water pipes and flanged connections.', crop: { scale: 1.7, position: '15% 60%' } }),
  'vrf-vrv': equipmentViews('vrf-vrv', 'Outdoor units arranged on a commercial rooftop',
    { alt: 'Detail of outdoor-unit air intakes and fan guards', caption: 'Outdoor-unit casing and fan guards.', crop: { scale: 1.7, position: '48% 40%' } },
    { alt: 'Detail of insulated pipe connections and outdoor-unit supports', caption: 'Pipe connections and unit supports.', crop: { scale: 1.8, position: '40% 82%' } }),
  ahu: equipmentViews('ahu', 'Air-handling unit with connected ductwork',
    { alt: 'Detail of filter and cooling-coil sections inside the air-handling unit', caption: 'Filter and cooling-coil sections.', crop: { scale: 1.8, position: '40% 58%' } },
    { alt: 'Detail of the air-handling unit fan and motor', caption: 'Fan section and motor.', crop: { scale: 1.9, position: '65% 60%' } }),
}
