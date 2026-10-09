/**
 * Commercial content ledger. Project wording and values are transcribed from
 * https://www.setiaaircond.com.my/projects.html (checked 2026-09-30).
 * Client categories, names and system scope follow the client-supplied clientele
 * listing of 2026-10-09 (references/commercial-view/clientele-listing-2026-10-09.md).
 * Technical descriptions are informational; they are not extra Setia work claims.
 */

export const commercialSources = {
  clientServiceAdditions: 'references/commercial-view/client-service-additions-2026-10-02.md',
  projects: 'https://www.setiaaircond.com.my/projects.html',
  clientele: 'https://www.setiaaircond.com.my/clientele.html',
  clienteleListing: 'references/commercial-view/clientele-listing-2026-10-09.md',
  services: 'https://www.setiaaircond.com.my/air-conditioner-services.html',
  coolingTower: 'https://baltimoreaircoil.com/what-is-a-cooling-tower',
  pump: 'https://www.grundfos.com/us/learn/ecademy/all-courses/pumping-schemes-in-chilled-water-systems/an-introduction-to-pumping-schemes-in-hvac-applications',
  chiller: 'https://www.trane.com/commercial/north-america/us/en/products-systems/chillers.html',
  vrv: 'https://www.daikin.com.my/product_type/air-cooled-vrv/',
  ahu: 'https://www.daikin.com.my/product/vrv-ahu/',
} as const

export interface CommercialService {
  id: string
  slug: string
  title: string
  /** The clientele-listing system this service covers; its page lists the clients recorded with it. */
  system: CommercialSystemKey
  shortLine: string
  explanation: string
  systemDetails: string[]
  serviceItems: string[]
  scopeStatus: 'published' | 'enquiry' | 'client-confirmed'
  sourceRefs: string[]
  primaryImage: string | null
  secondaryImage: string | null
  imageAlt: string
  detailAlt: string
}

export const commercialServices: CommercialService[] = [
  {
    id: 'cassette-ceiling-ducted', slug: 'cassette-ceiling-ducted', system: 'ccd', title: 'Cassette, ceiling exposed and ducted',
    shortLine: 'Indoor unit supply, installation, maintenance and repair',
    explanation: 'Cassette, ceiling-exposed and ducted units are the indoor air conditioners that cool offices, shops and other occupied areas. Setia supplies, installs, maintains and repairs all three types in commercial buildings.',
    systemDetails: [
      'A cassette unit sits flush in the ceiling and blows air out on four sides. A ceiling-exposed unit hangs below the ceiling where there is no ceiling void. A ducted unit is concealed above the ceiling and delivers air through ductwork and grilles.',
      'The right type depends on ceiling height, the space above the ceiling and how each area is used. Share your floor plan or room list when requesting a quote so the unit mix can be matched to the space.',
    ],
    serviceItems: ['Cassette unit supply and installation', 'Ceiling-exposed unit supply and installation', 'Ducted unit supply and installation', 'Servicing and preventive maintenance', 'Repairs'],
    scopeStatus: 'client-confirmed', sourceRefs: ['clientServiceAdditions', 'projects'],
    primaryImage: '/images/commercial/details/project-cassette-detail-v1.webp', secondaryImage: '/images/commercial/details/project-ac-detail.webp',
    imageAlt: 'Representative ceiling cassette air conditioner installed flush below a concrete office ceiling',
    detailAlt: 'Illustrative ducted indoor unit with refrigerant connections and ductwork above a ceiling',
  },
  {
    id: 'cooling-tower', slug: 'cooling-tower', system: 'coolingTower', title: 'Cooling tower',
    shortLine: 'Installation, repair and preventive maintenance',
    explanation: 'A cooling tower rejects heat from circulating water to the outside air. In a water-cooled building system, it helps the cooling plant release heat collected indoors.',
    systemDetails: [
      'Warm water arrives from the cooling plant. Air moving through the tower carries heat away before the water returns to the system.',
      'Tower selection, access and maintenance requirements depend on the connected chiller plant and the building’s operating conditions.',
    ],
    serviceItems: ['New system design and installation', 'Troubleshooting and repair', 'Preventive maintenance', 'Retrofit and system replacement'],
    scopeStatus: 'published', sourceRefs: ['services', 'coolingTower'],
    primaryImage: '/images/commercial/details/cooling-tower.webp', secondaryImage: '/images/commercial/details/cooling-tower.webp',
    imageAlt: 'Cooling towers above a commercial building',
    detailAlt: 'Cooling tower fans and connected pipework',
  },
  {
    id: 'pump', slug: 'pump', system: 'pump', title: 'Pump',
    shortLine: 'Discuss pumping and water-circulation requirements',
    explanation: 'Pumps circulate water through pipework and connected cooling equipment. Chilled-water and condenser-water circuits serve different parts of a building system.',
    systemDetails: [
      'In a chilled-water circuit, pumps move cool water between the chiller and air-conditioning equipment. A separate condenser-water circuit may connect a water-cooled chiller to a cooling tower.',
      'The required arrangement depends on the installed plant, flow demands and pipework. Setia can review the wider air-conditioning brief before proposing work on a particular pump.',
    ],
    serviceItems: ['Discuss your existing pumping arrangement', 'Review the connected air-conditioning system', 'Request a site-specific proposal'],
    scopeStatus: 'enquiry', sourceRefs: ['pump'],
    primaryImage: '/images/commercial/details/pump.webp', secondaryImage: '/images/commercial/details/pump.webp',
    imageAlt: 'Commercial HVAC pump and motor beside cooling pipework',
    detailAlt: 'Pump connections, valves and water pipes',
  },
  {
    id: 'chilled-water-piping', slug: 'chilled-water-piping', system: 'chilledWater', title: 'Chilled water piping works',
    shortLine: 'Pipework for chilled-water systems',
    explanation: 'Chilled-water piping connects the cooling plant to the equipment it serves. Talk to Setia about chilled-water piping works for your commercial building.',
    systemDetails: [
      'The pipework carries chilled water between the cooling plant and connected air-conditioning equipment.',
      'Share your existing pipe routes, equipment connections and site access requirements so the work can be planned around your building.',
    ],
    serviceItems: ['Chilled-water piping works', 'Review of pipe routes and equipment connections', 'Site-specific work proposal'],
    scopeStatus: 'client-confirmed', sourceRefs: ['clientServiceAdditions'],
    primaryImage: '/images/commercial/details/pump.webp', secondaryImage: '/images/commercial/details/chiller.webp',
    imageAlt: 'Illustrative cooling-system pipework connected to a pump',
    detailAlt: 'Illustrative water pipes and connections at a chiller',
  },
  {
    id: 'chiller', slug: 'chiller', system: 'chiller', title: 'Chiller',
    shortLine: 'Installation, servicing and system replacement',
    explanation: 'A chiller produces chilled water for air-conditioning equipment. Its heat can be rejected through air-cooled equipment or a water-cooled plant, depending on the system.',
    systemDetails: [
      'Chilled water flows to connected coils, where it absorbs heat from air serving the building. The chiller then removes that heat from the water so the cycle can continue.',
      'The plant layout determines whether heat is rejected directly to outside air or through a separate cooling-tower circuit.',
    ],
    serviceItems: ['New system design and installation', 'Troubleshooting and repair', 'Preventive maintenance', 'Retrofit and system replacement'],
    scopeStatus: 'published', sourceRefs: ['services', 'chiller'],
    primaryImage: '/images/commercial/details/chiller.webp', secondaryImage: '/images/commercial/details/chiller.webp',
    imageAlt: 'Chiller installed in a commercial cooling plant',
    detailAlt: 'Chiller connections in a mechanical plant area',
  },
  {
    id: 'vrf-vrv', slug: 'vrf-vrv', system: 'vrv', title: 'VRF / VRV',
    shortLine: 'Multi-zone installation and preventive maintenance',
    explanation: 'A variable-refrigerant system connects outdoor equipment to indoor units serving different spaces. VRV is a commonly used name for this type of system.',
    systemDetails: [
      'The outdoor equipment adjusts refrigerant delivery as connected spaces call for cooling. Indoor units can serve different rooms without one large chilled-water distribution system.',
      'The number and type of indoor units, pipe routes and controls are selected for the actual building. VRV is Daikin’s name for its variable-refrigerant systems; VRF is the general term.',
    ],
    serviceItems: ['New VRV system installation', 'Troubleshooting and repair', 'Preventive maintenance', 'Retrofit and system replacement'],
    scopeStatus: 'published', sourceRefs: ['services', 'vrv'],
    primaryImage: '/images/commercial/details/vrf-vrv.webp', secondaryImage: '/images/commercial/details/vrf-vrv.webp',
    imageAlt: 'Grouped VRF and VRV outdoor units on a commercial roof',
    detailAlt: 'Outdoor units connected to indoor cooling zones',
  },
  {
    id: 'ahu', slug: 'ahu', system: 'ahu', title: 'AHU',
    shortLine: 'Air-handling unit maintenance and repair',
    explanation: 'An air-handling unit (AHU) moves air through components such as filters, coils and fans before distributing it through ducts. The connected cooling source depends on the building design. Setia maintains and repairs AHUs in commercial buildings.',
    systemDetails: [
      'A typical air-handling unit draws in air, passes it through filters and a cooling coil, then uses a fan to move conditioned air into connected ductwork.',
      'An AHU can be part of different cooling arrangements. Its sections, capacity and ventilation strategy are site-specific, so Setia should review the existing installation before defining work.',
    ],
    serviceItems: ['AHU maintenance', 'AHU repair', 'Discuss filtration and ducting works', 'Request a site-specific proposal'],
    scopeStatus: 'client-confirmed', sourceRefs: ['services', 'ahu', 'clientServiceAdditions'],
    primaryImage: '/images/commercial/details/ahu.webp', secondaryImage: '/images/commercial/details/ahu.webp',
    imageAlt: 'Air-handling unit with connected ductwork',
    detailAlt: 'Illustration of filter, coil and fan sections inside an air-handling unit',
  },
  {
    id: 'duct-services', slug: 'duct-services', system: 'ducting', title: 'Duct services',
    shortLine: 'Duct supply, installation, maintenance and repair',
    explanation: 'Setia supplies, installs, maintains and repairs air-conditioning ductwork for commercial spaces.',
    systemDetails: [
      'Ductwork carries air between air-conditioning equipment and the spaces it serves.',
      'Duct routes, connections and access depend on your building. Share the areas that need new ductwork or repair when requesting a quote.',
    ],
    serviceItems: ['Duct supply', 'Duct installation', 'Duct maintenance', 'Duct repair'],
    scopeStatus: 'client-confirmed', sourceRefs: ['clientServiceAdditions'],
    primaryImage: '/images/commercial/details/ahu.webp', secondaryImage: '/images/commercial/details/ahu.webp',
    imageAlt: 'Illustrative air-handling unit and connected ductwork',
    detailAlt: 'Illustrative ductwork connected to air-handling equipment',
  },
]

export type ProjectDiscipline = 'air-conditioning' | 'electrical'

export interface CommercialProjectRecord {
  id: string
  partyId: string
  discipline: ProjectDiscipline
  partyName: string
  yearText: string
  originalScope: string
  displayScope: string
  valueDisplay: string
  qualifier: string | null
  sourceRef: 'projects'
  sourceRow: number
  quantities: string[]
  explicitSystems: string[]
  location: string | null
}

const nonTotalQualifier = 'The published value does not indicate the total project worth.'
const withheldQualifier = 'The published value was omitted due to contract confidentiality.'

export const commercialProjectRecords: CommercialProjectRecord[] = [
  {
    id: 'ac-01', partyId: 'limkokwing-university', discipline: 'air-conditioning', partyName: 'LIM KOK WING INTERGRATED SDN BHD', yearText: '2011, 2013',
    originalScope: 'SUPPLY AND INSTALL AIR CONDITIONER (WALL, CEILING SUSPENDED, CASSETTE)',
    displayScope: 'Supplied and installed wall-mounted, ceiling-suspended and cassette air conditioners.',
    valueDisplay: 'RM 459,900.00', qualifier: null, sourceRef: 'projects', sourceRow: 1, quantities: [], explicitSystems: ['Wall-mounted', 'Ceiling-suspended', 'Cassette'], location: null,
  },
  {
    id: 'ac-02', partyId: 'maxis', discipline: 'air-conditioning', partyName: 'MAXIS BROADBAND', yearText: '2010–2016',
    originalScope: 'SUPPLY AND INSTALL AIR CONDITIONER (WALL, CEILING SUSPENDED, CASSETTE, DUCTED) PREVENTIVE MAINTENANCE AND SERVICES OF AIR CONDITIONER (SPLIT,HIGH PRECISION AC,ETC)',
    displayScope: 'Supplied and installed wall-mounted, ceiling-suspended, cassette and ducted air conditioners; provided preventive maintenance and servicing for split and high-precision units.',
    valueDisplay: '~ RM 1,582,000.00*', qualifier: nonTotalQualifier, sourceRef: 'projects', sourceRow: 2, quantities: [], explicitSystems: ['Wall-mounted', 'Ceiling-suspended', 'Cassette', 'Ducted', 'Split', 'High-precision AC'], location: null,
  },
  {
    id: 'ac-03', partyId: 'mission-foods', discipline: 'air-conditioning', partyName: 'MISSION FOODS MALAYSIA SDN BHD', yearText: '2010–2016',
    originalScope: '20 NO OF SUPPLY AND INSTALL AIR CONDITIONER PREVENTIVE MAINTENANCE AND SERVICES OF AIR CONDITIONER (SPLIT,VRV,CHILLER, COOLING TOWER)',
    displayScope: 'The register lists 20 air conditioners supplied and installed, plus preventive maintenance and servicing for split, VRV, chiller and cooling-tower systems.',
    valueDisplay: 'RM 351,800.00', qualifier: null, sourceRef: 'projects', sourceRow: 3, quantities: ['20 air conditioners'], explicitSystems: ['Split', 'VRV', 'Chiller', 'Cooling tower'], location: null,
  },
  {
    id: 'ac-04', partyId: 'maybank', discipline: 'air-conditioning', partyName: 'MAYBANK', yearText: '2010, 2012',
    originalScope: '46 NO OF SUPPLY AND INSTALL AIR CONDITIONER PREVENTIVE MAINTENANCE AND SERVICES OF AIR CONDITIONER',
    displayScope: 'The register lists 46 air conditioners supplied and installed, with preventive maintenance and servicing.',
    valueDisplay: '~ RM 300,000.00*', qualifier: nonTotalQualifier, sourceRef: 'projects', sourceRow: 4, quantities: ['46 air conditioners'], explicitSystems: [], location: null,
  },
  {
    id: 'ac-05', partyId: 'goodyear', discipline: 'air-conditioning', partyName: 'GOODYEAR MALAYSIA BERHAD', yearText: '2013–2016',
    originalScope: '43 NO OF SUPPLY AND INSTALL AIR CONDITIONER PREVENTIVE MAINTENANCE AND SERVICES OF AIR CONDITIONER (SPLIT,CHILLER)',
    displayScope: 'The register lists 43 air conditioners supplied and installed, with preventive maintenance and servicing for split and chiller systems.',
    valueDisplay: '~ RM 429,358.70*', qualifier: nonTotalQualifier, sourceRef: 'projects', sourceRow: 5, quantities: ['43 air conditioners'], explicitSystems: ['Split', 'Chiller'], location: null,
  },
  {
    id: 'ac-06', partyId: 'sony-emcs', discipline: 'air-conditioning', partyName: 'SONY EMCS (MALAYSIA)', yearText: '2010–2014',
    originalScope: '10 NO OF SUPPLY AND INSTALL AIR CONDITIONER (10HP AND ABOVE) PREVENTIVE MAINTENANCE AND SERVICES OF AIR CONDITIONER',
    displayScope: 'The register lists ten air conditioners of 10 HP and above supplied and installed, with preventive maintenance and servicing.',
    valueDisplay: 'RM 385,013.20', qualifier: null, sourceRef: 'projects', sourceRow: 6, quantities: ['10 air conditioners', '10 HP and above'], explicitSystems: [], location: null,
  },
  {
    id: 'ac-07', partyId: 'garden-international-school', discipline: 'air-conditioning', partyName: 'GARDEN INTERNATIONAL SCHOOL', yearText: '2013–2015',
    originalScope: '23 NO OF SUPPLY AND INSTALL AIR CONDITIONER PREVENTIVE MAINTENANCE AND SERVICES OF AIR CONDITIONER (SPLIT,CHILLER)',
    displayScope: 'The register lists 23 air conditioners supplied and installed, with preventive maintenance and servicing for split and chiller systems.',
    valueDisplay: 'RM**', qualifier: withheldQualifier, sourceRef: 'projects', sourceRow: 7, quantities: ['23 air conditioners'], explicitSystems: ['Split', 'Chiller'], location: null,
  },
  {
    id: 'ac-08', partyId: 'viewqwest', discipline: 'air-conditioning', partyName: 'VIEWQWEST MANAGEMENT SDN BHD', yearText: '2016',
    originalScope: 'SUPPLY AND INSTALL VRV AIR CONDITIONER PREVENTIVE MAINTENANCE AND SERVICES OF AIR CONDITIONER',
    displayScope: 'Supplied and installed VRV air conditioning and provided preventive maintenance and servicing.',
    valueDisplay: 'RM**', qualifier: withheldQualifier, sourceRef: 'projects', sourceRow: 8, quantities: [], explicitSystems: ['VRV'], location: null,
  },
  {
    id: 'el-01', partyId: 'radient-trend', discipline: 'electrical', partyName: 'RADIENT TREND SDN BHD', yearText: '2003',
    originalScope: '2 1/2 STOREY SEMI D HOUSE 150 UNIT HOUSES ELECTRICAL, TELPHONE AND ATTENA WIRING.',
    displayScope: 'Electrical, telephone and antenna wiring for 150 two-and-a-half-storey semi-detached houses.',
    valueDisplay: '~RM 650,000.00', qualifier: 'Approximate value as published.', sourceRef: 'projects', sourceRow: 9, quantities: ['150 houses'], explicitSystems: ['Electrical wiring', 'Telephone wiring', 'Antenna wiring'], location: null,
  },
  {
    id: 'el-02', partyId: 'bukit-ikhlas-development', discipline: 'electrical', partyName: 'BUKIT IKHLAS DEVELOPMENT SDN BHD', yearText: '2006',
    originalScope: '27 BLOCKS CONDOMINIUM & CLUB HOUSE 430 UNIT HOUSES ELECTRICAL, TELPHONE AND ATTENA WIRING. STREET LIGHT AND FEEDER PILLAR CABLING.',
    displayScope: 'Electrical, telephone and antenna wiring for 430 units across 27 condominium blocks and a clubhouse, plus street lighting and feeder-pillar cabling.',
    valueDisplay: 'RM 4,200,000.00', qualifier: null, sourceRef: 'projects', sourceRow: 10, quantities: ['27 blocks and clubhouse', '430 units'], explicitSystems: ['Electrical wiring', 'Telephone wiring', 'Antenna wiring', 'Street lighting', 'Feeder-pillar cabling'], location: null,
  },
  {
    id: 'el-03', partyId: 'europlus-construction', discipline: 'electrical', partyName: 'EUROPLUS CONSTRUCTION SDN BHD', yearText: '2006',
    originalScope: 'STREET LIGHTING INSTALLATION WORK FOR PHASE 1 AND 2 - 568 UNITS AT DENGKIL DAERAH SEPANG',
    displayScope: 'Street-lighting installation for phases one and two, covering 568 units at Dengkil, Sepang.',
    valueDisplay: 'RM 1,200,000.00', qualifier: null, sourceRef: 'projects', sourceRow: 11, quantities: ['568 units', 'Phases 1 and 2'], explicitSystems: ['Street lighting'], location: 'Dengkil, Sepang',
  },
  {
    id: 'el-04', partyId: 'uitm', discipline: 'electrical', partyName: 'UITM-SHAH ALAM/TERENGGANU', yearText: '2006–2007',
    originalScope: 'FIRE FIGHTING ASSIGNMENT, PROJECT AND MISCELLANEOUS e.g. SYSTEM UPGRADING, INSTALLATION OF DETECTORS, EQUIPMENT AND FIRE PROTECTION SYSTEM.',
    displayScope: 'Fire-protection work, including system upgrades and installation of detectors, equipment and a fire-protection system.',
    valueDisplay: '~RM 550,000.00', qualifier: 'Approximate value as published.', sourceRef: 'projects', sourceRow: 12, quantities: [], explicitSystems: ['Fire-protection systems', 'Detectors'], location: null,
  },
  {
    id: 'el-05', partyId: 'kej-mahirjaya', discipline: 'electrical', partyName: 'KEJ.MAHIRJAYA SDN BHD', yearText: '2009',
    originalScope: 'ELECTRICAL ASSIGNMENT, PROJECT AND MISCELLANEOUS e.g. OFFICE UPGRADING, INSTALLATION OF NEW WIRING.',
    displayScope: 'Office electrical upgrades and installation of new wiring.',
    valueDisplay: 'RM 1,300,000.00', qualifier: null, sourceRef: 'projects', sourceRow: 13, quantities: [], explicitSystems: ['Electrical wiring'], location: null,
  },
  {
    id: 'el-06', partyId: 'kenforce-construction', discipline: 'electrical', partyName: 'KENFORCE CONSTRUCTION SDN BHD', yearText: '2010',
    originalScope: '3 STOREY BUNGLOW PJ SMART HOME SYSTEM WIRING',
    displayScope: 'Smart-home system wiring for a three-storey bungalow in PJ.',
    valueDisplay: 'RM 1,100,000.00', qualifier: null, sourceRef: 'projects', sourceRow: 14, quantities: ['Three-storey bungalow'], explicitSystems: ['Smart-home wiring'], location: 'PJ',
  },
  {
    id: 'el-07', partyId: 'valserv', discipline: 'electrical', partyName: 'VALSERV SDN BHD', yearText: '2010',
    originalScope: '338 UNIT APARTMENT & 2 BUNGLOW AT TDRM GAMBANG PAHANG ELECTRICAL INFRA, ELECTRICAL WIRING,TEPEPHONE WIRING',
    displayScope: 'Electrical infrastructure, electrical wiring and telephone wiring for 338 apartments and two bungalows at TDRM Gambang, Pahang.',
    valueDisplay: 'RM 6,200,000.00', qualifier: null, sourceRef: 'projects', sourceRow: 15, quantities: ['338 apartments', '2 bungalows'], explicitSystems: ['Electrical infrastructure', 'Electrical wiring', 'Telephone wiring'], location: 'TDRM Gambang, Pahang',
  },
  {
    id: 'el-08', partyId: 'kenforce-construction', discipline: 'electrical', partyName: 'KENFORCE CONSTRUCTION SDN BHD', yearText: '2014–2016',
    originalScope: '19 UNIT 2 STOREY SHOP LOT/ 2 UNIT 3 STOREY SHOPLOT AT PRAI NEGERI SEMBILAN ELECTRICAL INFRA, ELECTRICAL WIRING,TEPEPHONE WIRING',
    displayScope: 'Electrical infrastructure, electrical wiring and telephone wiring for 19 two-storey and two three-storey shoplots.',
    valueDisplay: 'RM 750,000.00', qualifier: null, sourceRef: 'projects', sourceRow: 16, quantities: ['19 two-storey shoplots', '2 three-storey shoplots'], explicitSystems: ['Electrical infrastructure', 'Electrical wiring', 'Telephone wiring'], location: null,
  },
]

export interface CommercialClientCategory {
  id: string
  /** Full name, used for announcements and records. */
  label: string
  /** Shorter name on the tab itself, so all six tabs share one line on a desktop. */
  tabLabel: string
}

/** Clientele tabs, in the order of the client-supplied industry grouping, with its two healthcare clients folded into the first tab so there are six. The first tab is the default. */
export const commercialClientCategories: CommercialClientCategory[] = [
  { id: 'retail-property-healthcare', label: 'Retail, Property & Healthcare', tabLabel: 'Retail, Property & Healthcare' },
  { id: 'banking-finance', label: 'Banking, Finance & Insurance', tabLabel: 'Banking & Finance' },
  { id: 'manufacturing-energy', label: 'Manufacturing, Industrial & Energy', tabLabel: 'Manufacturing & Energy' },
  { id: 'transport-logistics', label: 'Automotive, Transport & Logistics', tabLabel: 'Automotive & Transport' },
  { id: 'telecommunications', label: 'Telecommunications & Connectivity', tabLabel: 'Telecommunications' },
  { id: 'education', label: 'Education & Learning', tabLabel: 'Education' },
]

export interface CommercialClient {
  id: string
  slug: string
  displayName: string
  /** Clientele tab the mark sits under; null for parties that only appear in the project register. */
  categoryId: string | null
  logoSrc: string | null
  /** Air-conditioning systems recorded for the client, in the listing's own order; labels in `commercialSystemLabels`. */
  systems: CommercialSystemKey[]
  /** Brief shown on hover or focus of the mark; null when nothing beyond the name is recorded. */
  summary: string | null
  projectIds: string[]
  sourceRefs: string[]
}

export const commercialSystemLabels = {
  ccd: 'Cassette, ceiling & ducted',
  vrv: 'VRV',
  chiller: 'Chiller',
  coolingTower: 'Cooling tower',
  ahu: 'AHU',
  ducting: 'Ducting',
  pump: 'Pump',
  chilledWater: 'Chilled water piping',
} as const
export type CommercialSystemKey = keyof typeof commercialSystemLabels

interface ClientOptions {
  /** Gallery clients show /images/commercial/clients/<id>.webp, a pale transparent mark; false shows a monogram placeholder until one exists. */
  logo?: boolean
  systems?: CommercialSystemKey[]
  summary?: string
  projectIds?: string[]
  sourceRefs?: string[]
}

const client = (id: string, displayName: string, categoryId: string | null, options: ClientOptions = {}): CommercialClient => {
  const systems = options.systems ?? []
  return {
    id, slug: id, displayName, categoryId,
    logoSrc: (options.logo ?? categoryId !== null) ? `/images/commercial/clients/${id}.webp` : null,
    systems,
    summary: options.summary ?? (systems.length ? systems.map(key => commercialSystemLabels[key]).join(' · ') : null),
    projectIds: options.projectIds ?? [],
    sourceRefs: options.sourceRefs ?? ['clienteleListing'],
  }
}

const plant: CommercialSystemKey[] = ['chiller', 'coolingTower', 'ahu', 'ducting', 'pump']
/** A client with a row in the project register keeps that register's wording as its brief. */
const recorded = (summary: string, projectIds: string[]): ClientOptions => ({ summary, projectIds, sourceRefs: ['clienteleListing', 'projects'] })

// Clients sit in their listing order inside each category. Returning clients keep their slugs so project records, detail pages and marks carry over.
export const commercialClients: CommercialClient[] = [
  // Retail, Property & Healthcare
  client('lotuss', 'Lotus’s', 'retail-property-healthcare', { systems: [...plant, 'chilledWater'] }),
  client('econsave', 'Econsave', 'retail-property-healthcare', { systems: ['ccd'] }),
  client('sp-setia', 'SP Setia', 'retail-property-healthcare', { summary: 'SP Setia HQ and Bandar Setia Alam.' }),
  client('eco-sky', 'Eco Sky Development', 'retail-property-healthcare'),
  client('assunta-hospital', 'Assunta Hospital', 'retail-property-healthcare'),
  client('animal-medical-centre', 'Animal Medical Centre / Medivet', 'retail-property-healthcare'),
  // Banking, Finance & Insurance
  client('mbsb-bank', 'MBSB Bank', 'banking-finance', { systems: ['ccd'] }),
  client('standard-chartered', 'Standard Chartered', 'banking-finance', { systems: ['ccd', 'vrv'] }),
  client('maybank', 'Maybank', 'banking-finance', { systems: ['ccd', 'vrv'], ...recorded('Air-conditioning installation, preventive maintenance and servicing, 2010 and 2012.', ['ac-04']) }),
  client('affin-bank', 'Affin Bank', 'banking-finance', { systems: ['ccd', 'vrv'] }),
  client('prudential', 'Prudential', 'banking-finance', { systems: ['ccd', 'vrv'] }),
  client('cimb', 'CIMB Bank', 'banking-finance', { systems: ['coolingTower', 'chilledWater'] }),
  client('bank-pembangunan', 'Bank Pembangunan Malaysia', 'banking-finance', { systems: ['ccd'] }),
  // Manufacturing, Industrial & Energy
  client('sony-emcs', 'Sony EMCS (Malaysia)', 'manufacturing-energy', { systems: [...plant, 'chilledWater'], ...recorded('Air-conditioning installation, preventive maintenance and servicing, 2010–2014.', ['ac-06']) }),
  client('goodyear', 'Goodyear Malaysia', 'manufacturing-energy', { systems: plant, ...recorded('Air-conditioning installation and split/chiller servicing for Goodyear Malaysia Berhad, 2013–2016.', ['ac-05']) }),
  client('panasonic', 'Panasonic AVC', 'manufacturing-energy', { systems: plant }),
  client('siemens', 'Siemens', 'manufacturing-energy', { systems: ['ccd'] }),
  client('petron', 'Petron Malaysia', 'manufacturing-energy', { systems: ['ccd', 'vrv'] }),
  client('sime-darby', 'Sime Darby Plantation & Technology', 'manufacturing-energy', { systems: ['ccd'] }),
  client('kawan-food', 'Kawan Food', 'manufacturing-energy', { systems: ['ccd'] }),
  client('carlsberg', 'Carlsberg', 'manufacturing-energy', { systems: [...plant, 'ccd'] }),
  client('nestle', 'Nestlé Manufacturing Malaysia', 'manufacturing-energy', { systems: ['ccd', 'vrv', 'ahu'] }),
  client('mission-foods', 'Mission Foods Malaysia', 'manufacturing-energy', { systems: [...plant, 'chilledWater', 'vrv'], ...recorded('Air-conditioning installation and servicing across split, VRV, chiller and cooling-tower systems, 2010–2016.', ['ac-03']) }),
  // Automotive, Transport & Logistics
  client('proton', 'Proton', 'transport-logistics', { systems: plant }),
  client('volvo', 'Volvo Malaysia', 'transport-logistics', { systems: ['ccd'] }),
  client('tan-chong', 'Tan Chong Motor Holdings', 'transport-logistics', { systems: ['ccd', 'vrv'] }),
  client('malaysia-airlines', 'Malaysia Airlines', 'transport-logistics', { systems: ['pump', 'vrv', 'ahu', 'ducting', 'ccd'] }),
  client('crown-worldwide', 'Crown Worldwide Group', 'transport-logistics', { systems: ['ccd'] }),
  client('prolintas', 'PROLINTAS', 'transport-logistics', { systems: ['ccd'] }),
  // Telecommunications & Connectivity
  client('maxis', 'Maxis Broadband', 'telecommunications', { systems: ['ccd', 'vrv', 'ahu', 'ducting'], ...recorded('Air-conditioning installation and preventive maintenance for Maxis Broadband, 2010–2016.', ['ac-02']) }),
  client('viewqwest', 'ViewQwest', 'telecommunications', { systems: ['vrv'], ...recorded('VRV air-conditioning installation and preventive maintenance for ViewQwest Management Sdn Bhd, 2016.', ['ac-08']) }),
  client('celcom-axiata', 'Celcom Axiata', 'telecommunications', { systems: ['ccd', 'vrv', 'ahu'] }),
  client('edotco', 'edotco Malaysia', 'telecommunications', { systems: ['ccd'] }),
  // Education & Learning
  client('garden-international-school', 'Garden International School', 'education', { systems: ['ccd', 'vrv', 'ahu', 'ducting'], ...recorded('Air-conditioning installation and split/chiller maintenance, 2013–2015.', ['ac-07']) }),
  client('uow', 'UOW Malaysia', 'education'),
  client('iskl', 'ISKL', 'education', { systems: ['ccd', 'vrv', 'ahu', 'ducting'] }),
  client('segi-university-colleges', 'SEGi University & Colleges', 'education', { systems: ['ccd', 'vrv', 'ahu', 'ducting'] }),
  client('taylors', 'Taylor’s Education Group', 'education'),
  client('global-indian-education', 'Global Indian Education', 'education', { logo: false }),
  client('mindvalley', 'Mindvalley', 'education', { systems: ['ccd'] }),
]

// These parties are documented in the project register but have no mark on the clientele screen.
export const commercialProjectParties: CommercialClient[] = [
  client('limkokwing-university', 'Limkokwing University', null, { logo: true, summary: 'Wall-mounted, ceiling-suspended and cassette air-conditioning installation for Lim Kok Wing Intergrated Sdn Bhd, 2011 and 2013.', projectIds: ['ac-01'], sourceRefs: ['projects'] }),
  client('radient-trend', 'Radient Trend Sdn Bhd', null, { summary: 'Electrical, telephone and antenna wiring for 150 houses, 2003.', projectIds: ['el-01'], sourceRefs: ['projects'] }),
  client('bukit-ikhlas-development', 'Bukit Ikhlas Development Sdn Bhd', null, { summary: 'Electrical and related infrastructure for condominium blocks and a clubhouse, 2006.', projectIds: ['el-02'], sourceRefs: ['projects'] }),
  client('europlus-construction', 'Europlus Construction Sdn Bhd', null, { summary: 'Street-lighting installation in Dengkil, Sepang, 2006.', projectIds: ['el-03'], sourceRefs: ['projects'] }),
  client('uitm', 'UiTM Shah Alam / Terengganu', null, { summary: 'Fire-protection system work recorded in 2006–2007.', projectIds: ['el-04'], sourceRefs: ['projects'] }),
  client('kej-mahirjaya', 'Kej. Mahirjaya Sdn Bhd', null, { summary: 'Office electrical upgrade and wiring recorded in 2009.', projectIds: ['el-05'], sourceRefs: ['projects'] }),
  client('kenforce-construction', 'Kenforce Construction Sdn Bhd', null, { summary: 'Two separately recorded electrical projects from 2010 and 2014–2016.', projectIds: ['el-06', 'el-08'], sourceRefs: ['projects'] }),
  client('valserv', 'Valserv Sdn Bhd', null, { summary: 'Electrical infrastructure and wiring for apartments and bungalows, 2010.', projectIds: ['el-07'], sourceRefs: ['projects'] }),
]

export const allCommercialParties: CommercialClient[] = [...commercialClients, ...commercialProjectParties]

export function getCommercialService(slug: string) {
  return commercialServices.find(service => service.slug === slug)
}

export function getCommercialParty(slug: string) {
  return allCommercialParties.find(party => party.slug === slug)
}

export function getCommercialPartyRecords(partyId: string) {
  return commercialProjectRecords.filter(record => record.partyId === partyId)
}

export function getCommercialClientCategory(id: string | null | undefined) {
  return commercialClientCategories.find(category => category.id === id)
}

export function getCommercialClientsInCategory(categoryId: string) {
  return commercialClients.filter(client => client.categoryId === categoryId)
}

/** A tab's clients in pages of at most `capacity` (ten, so every current tab is a single page), split as evenly as possible if a tab ever outgrows it. */
export function getCommercialClientPages(categoryId: string, capacity = 10): CommercialClient[][] {
  const clients = getCommercialClientsInCategory(categoryId)
  const count = Math.max(1, Math.ceil(clients.length / capacity))
  const base = Math.floor(clients.length / count)
  const extra = clients.length % count
  let cursor = 0
  return Array.from({ length: count }, (_, index) => {
    const page = clients.slice(cursor, cursor + base + (index < extra ? 1 : 0))
    cursor += page.length
    return page
  }).filter(page => page.length > 0)
}

/** The clientele-listing clients recorded with the system a service covers, in listing order. */
export function getCommercialClientsForService(serviceId: string): CommercialClient[] {
  const service = commercialServices.find(entry => entry.id === serviceId)
  return service ? commercialClients.filter(client => client.systems.includes(service.system)) : []
}

export function describeCommercialSystems(client: Pick<CommercialClient, 'systems'>) {
  return client.systems.map(key => commercialSystemLabels[key]).join(' · ')
}

/** Placeholder for a client whose mark is not on disk yet: a short acronym, or the initials of the first two words. */
export function getCommercialClientMonogram(client: Pick<CommercialClient, 'displayName'>) {
  const words = client.displayName.split(/[\s/]+/).filter(word => /^[\p{L}\p{N}]/u.test(word))
  const first = words[0] ?? ''
  if (/^[A-Z]{2,5}$/.test(first)) return first
  return words.slice(0, 2).map(word => word[0]!.toUpperCase()).join('')
}

export interface CommercialIllustration {
  src: string
  alt: string
}

const detailImage = (name: string, alt: string): CommercialIllustration => ({
  src: `/images/commercial/details/${name}.webp`, alt,
})

const acContext = detailImage('project-air-conditioning', 'Illustrative commercial office with ceiling cassette, wall-mounted air conditioner and ducts')
const acDetail = detailImage('project-ac-detail', 'Illustrative close view of a ceiling-suspended air-conditioning unit and connections')
const electricalContext = detailImage('project-electrical', 'Illustrative electrical distribution room and organized cable routes')
const electricalDetail = detailImage('project-electrical-detail', 'Illustrative close view of protected electrical cabling and conduits')

/** Representative equipment visuals only. They never depict the named project site. */
export function getCommercialProjectIllustrations(record: CommercialProjectRecord): CommercialIllustration[] {
  switch (record.id) {
    case 'ac-03': return [detailImage('cooling-tower', 'Illustrative commercial cooling tower and connected pipework'), detailImage('chiller', 'Illustrative commercial chiller plant')]
    case 'ac-05':
    case 'ac-07': return [detailImage('chiller', 'Illustrative commercial chiller plant'), acDetail]
    case 'ac-08': return [detailImage('vrf-vrv', 'Illustrative group of VRF and VRV outdoor units'), acDetail]
    case 'el-03': return [detailImage('project-street-lighting', 'Illustrative street lighting and roadside feeder cabinet'), electricalDetail]
    case 'el-04': return [detailImage('project-fire-protection', 'Illustrative detectors, sprinkler pipework and fire control panel'), electricalDetail]
    case 'el-06': return [detailImage('project-smart-home', 'Illustrative home control interface and protected electrical wiring'), electricalDetail]
    default: return record.discipline === 'air-conditioning' ? [acContext, acDetail] : [electricalContext, electricalDetail]
  }
}
