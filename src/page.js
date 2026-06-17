// Lightweight entry for the standalone service landing pages.
// Loads the shared design system CSS and adds subtle scroll reveals for any
// [data-reveal] elements — without the homepage's heavy GSAP animation mounts.
import './styles/main.css'
import { initReveals } from './components/scroll.js'
import { initNav } from './components/nav.js'

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

function boot() {
  // Navigation must always work; reveals are gated behind motion preference.
  initNav()
  if (!prefersReducedMotion) initReveals()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
