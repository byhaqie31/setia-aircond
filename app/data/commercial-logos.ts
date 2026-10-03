import { airConditioningBrandLogos } from './air-conditioning'

export interface CompanyLogo {
  src: string
  width: number
  height: number
  treatment: 'solid' | 'paper' | 'reverse' | 'light'
}

// Source URLs, original artwork and hashes live in the Commercial references.
const sony: CompanyLogo = { src: '/images/commercial/sony.svg', width: 1280, height: 225, treatment: 'solid' }
const maybank: CompanyLogo = { src: '/images/commercial/maybank.svg', width: 165, height: 45, treatment: 'paper' }
const maxis: CompanyLogo = { src: '/images/commercial/maxis.svg', width: 134, height: 39, treatment: 'solid' }
const goodyear: CompanyLogo = { src: '/images/commercial/goodyear.svg', width: 140, height: 25, treatment: 'solid' }
const mission: CompanyLogo = { src: '/images/commercial/mission.png', width: 205, height: 141, treatment: 'reverse' }

export const commercialCompanyLogos: Record<string, CompanyLogo> = {
  'Sony Malaysia': sony,
  'Sony EMCS (Malaysia)': sony,
  Maybank: maybank,
  Maxis: maxis,
  'Maxis Broadband': maxis,
  'Affin Bank': { src: '/images/commercial/affin.png', width: 561, height: 171, treatment: 'paper' },
  Goodyear: goodyear,
  'Goodyear Malaysia Berhad': goodyear,
  'Mission Foods': mission,
  'Mission Foods Malaysia': mission,
  'Garden International School': { src: '/images/commercial/garden-crest.png', width: 292, height: 300, treatment: 'light' },
  'Limkokwing University': { src: '/images/commercial/limkokwing.svg', width: 156, height: 61, treatment: 'light' },
  'ViewQwest Management': { src: '/images/commercial/viewqwest-primary.png', width: 1400, height: 278, treatment: 'solid' },
}

export const commercialCredentialLogos: Record<string, CompanyLogo | undefined> = {
  SSM: { src: '/images/commercial/ssm.png', width: 3508, height: 2481, treatment: 'reverse' },
  G7: { src: '/images/commercial/cidb-compact.png', width: 1938, height: 590, treatment: 'solid' },
  ST: { src: '/images/commercial/st.svg', width: 206, height: 40, treatment: 'light' },
  MOF: { src: '/images/commercial/mof.svg', width: 255, height: 40, treatment: 'solid' },
  // ISO 9001:2015 is a standard, not a certifying company; retain its text reference.
  DAIKIN: airConditioningBrandLogos.find(brand => brand.name === 'Daikin'),
}
