// Mobile navigation toggle. The nav markup is shared across all pages but has
// no menu button in the HTML, so we inject one and wire it here. Runs on both
// the homepage (main.js) and the standalone pages (page.js).
export function initNav() {
  const nav = document.querySelector('.nav')
  if (!nav) return
  const links = nav.querySelector('.nav__links')
  if (!links || nav.querySelector('.nav__toggle')) return

  const btn = document.createElement('button')
  btn.className = 'nav__toggle'
  btn.type = 'button'
  btn.setAttribute('aria-label', 'Toggle menu')
  btn.setAttribute('aria-expanded', 'false')
  btn.innerHTML = '<span></span><span></span><span></span>'
  nav.appendChild(btn)

  const setOpen = (open) => {
    nav.classList.toggle('nav--open', open)
    btn.setAttribute('aria-expanded', String(open))
  }

  btn.addEventListener('click', () =>
    setOpen(!nav.classList.contains('nav--open'))
  )

  // Tapping a link closes the menu (it's a same-page anchor or a navigation).
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false)
  })

  // Reset to desktop state if the viewport grows past the breakpoint.
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 960) setOpen(false)
  })
}
