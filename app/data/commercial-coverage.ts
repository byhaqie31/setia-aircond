// Nationwide coverage map on the commercial page: a pin with the Setia mark on every state capital,
// plus the Sabah and Sarawak towns the client asked for (2026-10-19). Federal territories other than
// Labuan are left off; Kuala Lumpur and Putrajaya would sit on top of the Shah Alam pin.
// Panel SVGs: public/images/commercial/coverage/*.svg, built from Natural Earth (see the .svg.json notes).

export interface CoverageRegion {
  id: 'peninsular' | 'east'
  label: string
  src: string
  /** Panel bounds in degrees; both panels share one latitude band so they sit at the same scale. */
  west: number
  east: number
}

/** Which side of the marker the town name sits on, chosen so names stay inside the panel and clear of each other. */
export type CoverageLabelSide = 'left' | 'right' | 'below'

export interface CoveragePin {
  city: string
  state: string
  region: CoverageRegion['id']
  lat: number
  lon: number
  label: CoverageLabelSide
}

export const coverageNorth = 7.45
export const coverageSouth = .75

export const coverageRegions: CoverageRegion[] = [
  { id: 'peninsular', label: 'Peninsular Malaysia', src: '/images/commercial/coverage/peninsular-malaysia.svg', west: 99.5, east: 104.6 },
  { id: 'east', label: 'Sabah, Sarawak and Labuan', src: '/images/commercial/coverage/east-malaysia.svg', west: 109.4, east: 119.4 },
]

// North to south down the peninsula, then west to east across Borneo, which is also the order the pins drop in.
export const coveragePins: CoveragePin[] = [
  { city: 'Kangar', state: 'Perlis', region: 'peninsular', lat: 6.4414, lon: 100.1986, label: 'right' },
  { city: 'Alor Setar', state: 'Kedah', region: 'peninsular', lat: 6.1248, lon: 100.3678, label: 'right' },
  { city: 'Kota Bharu', state: 'Kelantan', region: 'peninsular', lat: 6.1254, lon: 102.2381, label: 'right' },
  { city: 'George Town', state: 'Penang', region: 'peninsular', lat: 5.4141, lon: 100.3288, label: 'right' },
  { city: 'Kuala Terengganu', state: 'Terengganu', region: 'peninsular', lat: 5.3302, lon: 103.1408, label: 'below' },
  { city: 'Ipoh', state: 'Perak', region: 'peninsular', lat: 4.5975, lon: 101.0901, label: 'right' },
  { city: 'Kuantan', state: 'Pahang', region: 'peninsular', lat: 3.8077, lon: 103.326, label: 'right' },
  { city: 'Shah Alam', state: 'Selangor', region: 'peninsular', lat: 3.0733, lon: 101.5185, label: 'left' },
  { city: 'Seremban', state: 'Negeri Sembilan', region: 'peninsular', lat: 2.7258, lon: 101.9424, label: 'right' },
  { city: 'Melaka', state: 'Melaka', region: 'peninsular', lat: 2.1896, lon: 102.2501, label: 'left' },
  { city: 'Johor Bahru', state: 'Johor', region: 'peninsular', lat: 1.4927, lon: 103.7414, label: 'left' },
  { city: 'Kuching', state: 'Sarawak', region: 'east', lat: 1.5535, lon: 110.3593, label: 'right' },
  { city: 'Sibu', state: 'Sarawak', region: 'east', lat: 2.287, lon: 111.8305, label: 'right' },
  { city: 'Bintulu', state: 'Sarawak', region: 'east', lat: 3.1667, lon: 113.0333, label: 'right' },
  { city: 'Miri', state: 'Sarawak', region: 'east', lat: 4.3995, lon: 113.9914, label: 'right' },
  { city: 'Labuan', state: 'Labuan', region: 'east', lat: 5.2831, lon: 115.2308, label: 'left' },
  { city: 'Kota Kinabalu', state: 'Sabah', region: 'east', lat: 5.9804, lon: 116.0735, label: 'left' },
  { city: 'Sandakan', state: 'Sabah', region: 'east', lat: 5.8394, lon: 118.1172, label: 'left' },
  { city: 'Tawau', state: 'Sabah', region: 'east', lat: 4.2448, lon: 117.8912, label: 'right' },
]

/** Pin position as percentages of its panel (plate carrée, matching the panel SVGs). */
export function coveragePinPosition(pin: CoveragePin) {
  const region = coverageRegions.find(item => item.id === pin.region)!
  return {
    left: `${((pin.lon - region.west) / (region.east - region.west) * 100).toFixed(3)}%`,
    top: `${((coverageNorth - pin.lat) / (coverageNorth - coverageSouth) * 100).toFixed(3)}%`,
  }
}
