export interface CommercialEquipmentScene {
  src: string
  smallSrc: string
  alt: string
}

// Responsive transparent foregrounds for the service heroes.
export const commercialEquipmentScenes: Record<string, CommercialEquipmentScene> = {
  'chilled-water-piping': {
    src: '/images/commercial/equipment/pump-immersive-v1.webp',
    smallSrc: '/images/commercial/equipment/pump-immersive-v1-960.webp',
    alt: 'Illustrative water pipework and flanged connections around a cooling-system pump',
  },
  'duct-services': {
    src: '/images/commercial/equipment/ahu-immersive-v1.webp',
    smallSrc: '/images/commercial/equipment/ahu-immersive-v1-960.webp',
    alt: 'Illustrative air-handling equipment with connected ductwork',
  },
  'cooling-tower': {
    src: '/images/commercial/equipment/cooling-tower-immersive-v1.webp',
    smallSrc: '/images/commercial/equipment/cooling-tower-immersive-v1-960.webp',
    alt: 'Representative cooling-tower assembly with top fans, louvered air intakes and connected water pipes',
  },
  pump: {
    src: '/images/commercial/equipment/pump-immersive-v1.webp',
    smallSrc: '/images/commercial/equipment/pump-immersive-v1-960.webp',
    alt: 'Representative centrifugal water pump, electric motor and connected flanged pipework',
  },
  chiller: {
    src: '/images/commercial/equipment/chiller-immersive-v1.webp',
    smallSrc: '/images/commercial/equipment/chiller-immersive-v1-960.webp',
    alt: 'Representative water-cooled chiller with compressor assembly, vessel and water connections',
  },
  'vrf-vrv': {
    src: '/images/commercial/equipment/vrf-vrv-immersive-v1.webp',
    smallSrc: '/images/commercial/equipment/vrf-vrv-immersive-v1-960.webp',
    alt: 'Representative group of VRF outdoor units with fan guards, intake grilles and insulated connections',
  },
  ahu: {
    src: '/images/commercial/equipment/ahu-immersive-v1.webp',
    smallSrc: '/images/commercial/equipment/ahu-immersive-v1-960.webp',
    alt: 'Representative air-handling unit showing filter, cooling-coil and fan sections',
  },
}
