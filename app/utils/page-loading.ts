/** Wait for the actual first-view artwork and type; the controller owns the safety deadline. */
export async function waitForPageAssets(path: string, sitePath: (path: string) => string, signal: AbortSignal) {
  if (signal.aborted) return
  const pending: Promise<unknown>[] = []
  const images: HTMLImageElement[] = []
  const urls = path === '/' ? [
    '/images/hero/building-dimmed-v1.png',
    '/images/hero/building-residential-v1.png',
    '/images/hero/building-commercial-v1.png',
    '/images/hero/building-sky-mask-v1.png',
  ] : []
  for (const url of urls) {
    const image = new Image()
    images.push(image)
    pending.push(new Promise<void>(resolve => {
      image.onload = () => {
        if (image.decode) void image.decode().catch(() => {}).then(resolve)
        else resolve()
      }
      image.onerror = () => resolve()
      image.src = sitePath(url)
    }))
  }
  if (document.fonts) pending.push(document.fonts.load('800 64px "Hanken Grotesk"').then(() => document.fonts.ready))
  let timer: ReturnType<typeof setTimeout> | undefined
  // A short stable hold keeps cached pages from flashing the identity for one frame.
  pending.push(new Promise<void>(resolve => { timer = setTimeout(resolve, 450) }))
  let cancel = () => {}
  const aborted = new Promise<void>(resolve => { cancel = resolve; signal.addEventListener('abort', cancel, { once: true }) })
  await Promise.race([Promise.allSettled(pending), aborted])
  clearTimeout(timer)
  signal.removeEventListener('abort', cancel)
  for (const image of images) { image.onload = null; image.onerror = null }
}
