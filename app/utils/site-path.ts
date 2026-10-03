/** Keep public assets and native links inside the configured deployment path. */
export function withSiteBase(path: string, baseURL = '/') {
  if (!path.startsWith('/') || path.startsWith('//')) return path
  const base = baseURL.replace(/\/$/, '')
  if (!base || path === base || path.startsWith(`${base}/`)) return path
  return `${base}${path}`
}
