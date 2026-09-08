/* Body-class bookkeeping shared by every page, ported from main.js:
   - menu-open mirrors the drawer state
   - .reveal blocks are observed after every page change
   - the menu closes on navigation */
export default defineNuxtPlugin((nuxtApp) => {
  const { open, set } = useMenu()
  watch(open, (v) => {
    document.body.classList.toggle('menu-open', v)
  }, { immediate: true })

  nuxtApp.hook('page:finish', () => {
    set(false)
    nextTick(revealAll)
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open.value) {
      set(false)
      document.getElementById('navToggle')?.focus()
    }
  })
  document.addEventListener('click', (e) => {
    if (!open.value) return
    const t = e.target as HTMLElement
    if (t.closest('#navToggle') || t.closest('#navDrawer')) return
    set(false)
  })
})
