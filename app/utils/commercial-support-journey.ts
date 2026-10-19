export const COMMERCIAL_SUPPORT_SCREENS = 5.25
export const COMMERCIAL_COVERAGE_STOP = 1.6 / COMMERCIAL_SUPPORT_SCREENS
export const COMMERCIAL_CREDENTIALS_STOP = 3.45 / COMMERCIAL_SUPPORT_SCREENS
export const COMMERCIAL_MAINTENANCE_STOP = 4.8 / COMMERCIAL_SUPPORT_SCREENS
// Without the skyline the clock starts with the coverage map already in place.
const CLIENTLESS_START = .75
// The coverage map holds this many screens before the credentials arrive.
const COVERAGE = 1.25

export const commercialSupportScreens = (clients: boolean) => COMMERCIAL_SUPPORT_SCREENS - (clients ? 0 : CLIENTLESS_START)

const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }

// One reversible scroll clock carries the skyline into the coverage map, crosses
// into the credential grid, then holds maintenance until native scrolling
// releases into the suppliers. The map's pins pop on a timer once it has arrived.
export function commercialSupportAt(progress: number, clients = true, maintenanceCount = 5) {
  const position = clamp(progress) * commercialSupportScreens(clients) + (clients ? 0 : CLIENTLESS_START)
  const coverageArrival = clients ? smooth((position - .1) / .8) : 1
  const coverageExit = smooth((position - 1.8) / .25)
  const coverageOpacity = 1 - coverageExit
  const credentialArrival = smooth((position - 1.95) / .25)
  const credentialExit = smooth((position - 2.45 - COVERAGE) / .25)
  const credentialsOpacity = credentialArrival * (1 - credentialExit)
  const maintenanceArrival = smooth((position - 2.6 - COVERAGE) / .25)
  const maintenanceBody = smooth((position - 2.85 - COVERAGE) / .25)
  const clientsControls = clients ? 1 : 0
  return {
    clientsOpacity: clients ? 1 - smooth((position - .9) / .08) : 0,
    clientsControls,
    clientsVisible: clients && coverageArrival < .65,
    coverageCover: coverageArrival,
    coverage: { opacity: coverageOpacity, reveal: coverageArrival, visible: coverageArrival > .05 && coverageOpacity > .05 },
    credentials: { opacity: credentialsOpacity, reveal: credentialArrival, visible: credentialsOpacity > .05 },
    records: Array.from({ length: 6 }, (_, index) => {
      const arrival = smooth((position - .85 - COVERAGE - index * .2) / .2)
      const opacity = arrival * (1 - credentialExit)
      return { opacity, reveal: arrival, visible: opacity > .05 }
    }),
    maintenance: { opacity: maintenanceArrival, reveal: maintenanceArrival, visible: maintenanceArrival > .05 },
    maintenanceBody: { opacity: maintenanceBody, reveal: maintenanceBody, visible: maintenanceBody > .05 },
    maintenanceItems: Array.from({ length: maintenanceCount }, (_, index) => {
      const arrival = smooth((position - 3 - COVERAGE - index * .08) / .16)
      return { opacity: arrival, reveal: arrival }
    }),
    maintenanceArt: smooth((position - 3 - COVERAGE) / .25),
  }
}
