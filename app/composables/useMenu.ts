/* The drawer's open state lives on <body class="menu-open"> exactly as the
   mockup's setupMobileNav did, so styles.css needs no change. */
export function useMenu() {
  const open = useState('menuOpen', () => false)
  const set = (v: boolean) => { open.value = v }
  const toggle = () => { open.value = !open.value }
  return { open, set, toggle }
}
