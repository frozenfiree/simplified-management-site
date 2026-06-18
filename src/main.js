import './styles/main.css'
import { gsap, ScrollTrigger } from './lib/gsap.js'
import { runLoader } from './components/loader.js'
import { revealHero } from './components/hero.js'
import { initReveals } from './components/scroll.js'
import { initDemoForm } from './components/form.js'
import { initNav } from './components/nav.js'
import { initHeroControlRoom } from './components/animations/hero-control-room.js'
import { initCalendarSync } from './components/animations/calendar-sync.js'
import { initPayoutSplit } from './components/animations/payout-split.js'
import { initOtaConstellation } from './components/animations/ota-constellation.js'
import { initMascot } from './components/mascot/simman-bot.js'

// Registry: [data-anim] value -> component initializer. Each component handles
// its own reduced-motion fallback and returns a cleanup function.
const ANIMATIONS = {
  'hero-control-room': initHeroControlRoom,
  'calendar-sync': initCalendarSync,
  'payout-split': initPayoutSplit,
  'ota-constellation': initOtaConstellation,
  mascot: initMascot,
}

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

// Lazy-mount each animation the first time its container nears the viewport so
// four GSAP loops never spin up at once on load.
function mountAnimations() {
  const nodes = Array.from(document.querySelectorAll('[data-anim]'))
  const mount = (node) => {
    const init = ANIMATIONS[node.dataset.anim]
    if (!init) return
    // Isolate failures: a throw in one animation must not break the others.
    try {
      init(node)
    } catch (err) {
      console.error(`Animation "${node.dataset.anim}" failed to mount:`, err)
    }
  }

  if (!('IntersectionObserver' in window)) {
    nodes.forEach(mount)
    return
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        mount(entry.target)
        obs.unobserve(entry.target)
      })
    },
    { rootMargin: '200px' }
  )
  nodes.forEach((node) => io.observe(node))
}

function boot() {
  // Nav + lead capture must work regardless of motion preference or animations.
  initNav()
  initDemoForm()

  // Scroll reveals are gated behind motion preference; animations self-gate.
  const mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    initReveals()
  })

  mountAnimations()

  if (prefersReducedMotion) {
    const loader = document.querySelector('[data-loader]')
    if (loader) loader.remove()
    const content = document.querySelector('[data-content]')
    if (content) content.style.opacity = '1'
    return
  }

  runLoader().then(revealHero)

  window.addEventListener('load', () => ScrollTrigger.refresh())
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
