/* IntersectionObserver reveals, ported from main.js setupReveals. Safe to call
   again after a page change: already-revealed nodes are skipped. */
export function revealAll() {
  if (typeof window === 'undefined') return
  const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-in)'))
  if (!els.length) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-in'))
    return
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in')
        io.unobserve(entry.target)
      }
    })
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 })
  els.forEach(el => io.observe(el))
}
