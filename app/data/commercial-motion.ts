import corporate from './corporate.json'
import { airConditioningBrandLogos, commercialPlantBrandLogos } from './air-conditioning'

export const commercialChapters = [
  {
    id: 'commercial-overview', position: 'intro',
    title: corporate.title,
    description: corporate.description.split(' One contractor')[0]!,
  },
  {
    id: 'commercial-plant', position: 'right',
    title: 'Commercial cooling, from the plant up.',
    description: corporate.capabilities[0]!.items[0]!,
  },
  {
    id: 'commercial-distribution', position: 'left',
    title: 'The right system for every zone.',
    description: `${corporate.capabilities[0]!.items[1]}. ${corporate.capabilities[0]!.items[2]}.`,
  },
  {
    id: 'commercial-power', position: 'right',
    title: corporate.capabilities[1]!.title,
    description: corporate.capabilities[1]!.items[0]!,
  },
  {
    id: 'commercial-maintenance', position: 'left',
    title: 'Support across every site.',
    description: `${corporate.capabilities[3]!.items[0]}. ${corporate.capabilities[3]!.items[1]}.`,
  },
] as const

// Supplier changes requested by the client on 2026-10-02: the first five shared
// brands, then the chiller and plant-room makers defined alongside them.
export const commercialBrandLogos = [...airConditioningBrandLogos.slice(0, 5), ...commercialPlantBrandLogos]
export const commercialBrands = commercialBrandLogos.map(brand => brand.name)
export const commercialEnquiry = '/get-a-quote?property=commercial'
export const commercialTenderPack = 'mailto:mail@setiaaircond.com.my?subject=Tender%20pack%20request'
