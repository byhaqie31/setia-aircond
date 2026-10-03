export const COMMERCIAL_SUPPORT_SCREENS = 4
export const COMMERCIAL_CREDENTIALS_STOP = 2.2 / COMMERCIAL_SUPPORT_SCREENS
export const COMMERCIAL_MAINTENANCE_STOP = 3.55 / COMMERCIAL_SUPPORT_SCREENS

const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }

// One reversible scroll clock carries the skyline into the credential grid,
// then holds maintenance until native scrolling releases into the suppliers.
export function commercialSupportAt(progress: number, clients = true, maintenanceCount = 5) {
  const position = clamp(progress) * (clients ? COMMERCIAL_SUPPORT_SCREENS : 3.25) + (clients ? 0 : .75)
  const credentialArrival = clients ? smooth((position - .1) / .8) : 1
  const credentialExit = smooth((position - 2.45) / .25)
  const credentialsOpacity = 1 - credentialExit
  const maintenanceArrival = smooth((position - 2.6) / .25)
  const maintenanceBody = smooth((position - 2.85) / .25)
  const clientsControls = clients ? 1 : 0
  return {
    clientsOpacity: clients ? 1 - smooth((position - .9) / .08) : 0,
    clientsControls,
    clientsVisible: clients && credentialArrival < .65,
    credentialsCover: credentialArrival,
    credentials: { opacity: credentialsOpacity, reveal: credentialArrival, visible: credentialArrival > .05 && credentialsOpacity > .05 },
    records: Array.from({ length: 6 }, (_, index) => {
      const arrival = smooth((position - .85 - index * .2) / .2)
      const opacity = arrival * (1 - credentialExit)
      return { opacity, reveal: arrival, visible: opacity > .05 }
    }),
    maintenance: { opacity: maintenanceArrival, reveal: maintenanceArrival, visible: maintenanceArrival > .05 },
    maintenanceBody: { opacity: maintenanceBody, reveal: maintenanceBody, visible: maintenanceBody > .05 },
    maintenanceItems: Array.from({ length: maintenanceCount }, (_, index) => {
      const arrival = smooth((position - 3 - index * .08) / .16)
      return { opacity: arrival, reveal: arrival }
    }),
    maintenanceArt: smooth((position - 3) / .25),
  }
}
