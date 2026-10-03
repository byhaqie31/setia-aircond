import { onBeforeUnmount, onMounted, type Ref } from 'vue'

type RevealKind = 'heading' | 'media' | 'item'

// These targets belong to the two detail templates; the pinned Commercial story
// and the shared About page keep their own motion.
const revealTargets: { selector: string; kind: RevealKind; stagger?: boolean }[] = [
  { selector: '.equipment-hero h1, .client-project__hero-copy h1, .client-project__hero-title, .client-project__sheet-title h2, .service-editorial h2, .service-gallery h2, .company-enquiry h2:not(.sr-only)', kind: 'heading' },
  { selector: '.equipment-hero__visual, .client-project__hero, .client-project__logo, .service-editorial__system .service-photo, .company-enquiry__team', kind: 'media' },
  { selector: '.equipment-hero__scope, .equipment-hero__explanation, .equipment-hero__quote, .client-project__hero-copy > p:not(.client-project__hero-title), .client-project__hero-years, .client-project__thumbnails, .client-project__explore, .client-project__image-note, .client-project__scope h3, .client-project__scope p, .client-project__portfolio-note, .service-editorial__system-lead, .service-editorial__scope-note, .service-editorial__quote, .service-gallery__heading p, .service-gallery__controls, .company-enquiry__description, .company-enquiry .service-enquiry, .company-contact__intro > p, .company-contact__office, .company-footer > a, .client-detail__return a', kind: 'item' },
  { selector: '.client-project__quick-facts > div, .service-editorial__scope-list > li, .company-contact__details > div', kind: 'item', stagger: true },
  { selector: '.client-project__gallery > figure, .service-gallery__slide', kind: 'media', stagger: true },
  { selector: '.client-project__details > summary, .service-editorial__considerations > summary', kind: 'item' },
  { selector: '.client-project__details-content h3, .client-project__details-content p, .client-project__details-content dl > div, .service-editorial__considerations > p', kind: 'item', stagger: true },
]

export function useCommercialDetailMotion(root: Ref<HTMLElement | null>, enabled: boolean) {
  let alive = true
  let dispose: (() => void) | undefined

  onMounted(async () => {
    if (!enabled) return
    try {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      if (!alive || !root.value) return
      const element = root.value
      gsap.registerPlugin(ScrollTrigger)
      const media = gsap.matchMedia()
      const shown = new WeakSet<HTMLElement>()
      dispose = () => media.revert()

      media.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 900px)' }, (context) => {
        if (!context.conditions?.motion) return
        const animations = new Map<HTMLElement, ReturnType<typeof gsap.fromTo>>()
        let refreshFrame: number | undefined
        let triggerIndex = 0

        const scheduleRefresh = () => {
          if (refreshFrame !== undefined) return
          refreshFrame = requestAnimationFrame(() => {
            refreshFrame = undefined
            ScrollTrigger.refresh()
          })
        }
        const bindItems = (scope: HTMLElement) => {
          for (const { selector, kind, stagger } of revealTargets) {
            for (const item of scope.querySelectorAll<HTMLElement>(selector)) {
              if (animations.has(item) || shown.has(item) || !item.getClientRects().length) continue
              // Native disclosures register their contents only when opened.
              const disclosure = item.closest('details')
              if (disclosure && !disclosure.open && item.tagName !== 'SUMMARY') continue
              const index = stagger && item.parentElement ? [...item.parentElement.children].indexOf(item) : 0
              const distance = context.conditions?.desktop ? 20 : 12
              // The first client overview fills the viewport. Its bottom controls
              // and provenance must reveal on entry without another scroll gesture.
              const start = item.closest('.client-project--first .client-project__split') ? 'top bottom' : 'top 92%'
              item.dataset.detailReveal = kind
              item.dataset.detailRevealState = 'waiting'
              const animation = gsap.fromTo(item, {
                opacity: kind === 'media' ? .3 : 0,
                y: distance,
                ...(kind === 'heading' ? { clipPath: 'inset(0 0 100% 0)' } : {}),
                ...(kind === 'media' ? { clipPath: 'inset(0 0 6% 0)' } : {}),
              }, {
                opacity: 1, y: 0,
                ...(kind !== 'item' ? { clipPath: 'inset(0 0 0% 0)' } : {}),
                duration: kind === 'media' ? .7 : .55,
                delay: Math.min(index * .06, .18),
                ease: 'power3.out',
                clearProps: 'opacity,transform,clipPath,willChange',
                scrollTrigger: { trigger: item, start, once: true, id: `commercial-detail-${triggerIndex++}` },
                onStart: () => {
                  item.dataset.detailRevealState = 'revealing'
                  item.style.willChange = 'transform, opacity'
                },
                onComplete: () => {
                  shown.add(item)
                  item.dataset.detailRevealState = 'shown'
                },
              })
              animations.set(item, animation)
              if (item.contains(document.activeElement)) animation.progress(1)
            }
          }
        }
        // Late disclosure bindings must join the same GSAP cleanup context.
        context.add('bindDisclosure', (disclosure: HTMLDetailsElement) => {
          bindItems(disclosure)
          scheduleRefresh()
        })
        const onToggle = (event: Event) => {
          const disclosure = event.target
          if (disclosure instanceof HTMLDetailsElement && disclosure.open) context.bindDisclosure(disclosure)
          else scheduleRefresh()
        }
        const onFocus = (event: FocusEvent) => {
          if (!(event.target instanceof Element)) return
          for (const [item, animation] of animations) {
            if (item.contains(event.target)) animation.progress(1)
          }
        }
        let previousSize = ''
        const observer = new ResizeObserver(([entry]) => {
          if (!entry) return
          const size = `${entry.contentRect.width}:${entry.contentRect.height}`
          if (size !== previousSize) { previousSize = size; scheduleRefresh() }
        })
        bindItems(element)
        observer.observe(element)
        element.addEventListener('toggle', onToggle, true)
        element.addEventListener('focusin', onFocus)
        element.addEventListener('load', scheduleRefresh, true)
        document.fonts?.addEventListener('loadingdone', scheduleRefresh)
        scheduleRefresh()

        return () => {
          if (refreshFrame !== undefined) cancelAnimationFrame(refreshFrame)
          observer.disconnect()
          element.removeEventListener('toggle', onToggle, true)
          element.removeEventListener('focusin', onFocus)
          element.removeEventListener('load', scheduleRefresh, true)
          document.fonts?.removeEventListener('loadingdone', scheduleRefresh)
          for (const item of animations.keys()) {
            delete item.dataset.detailReveal
            delete item.dataset.detailRevealState
          }
          animations.clear()
        }
      }, element)
    } catch {
      // Server HTML and reduced-motion layouts remain visible without animation.
      dispose?.()
    }
  })
  onBeforeUnmount(() => { alive = false; dispose?.() })
}
