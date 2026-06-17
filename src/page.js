// Lightweight entry for the standalone service landing pages.
// Loads the shared design system CSS and adds subtle scroll reveals for any
// [data-reveal] elements — without the homepage's heavy GSAP animation mounts.
import './styles/main.css'
import { initReveals } from './components/scroll.js'

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

if (!prefersReducedMotion) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveals)
  } else {
    initReveals()
  }
}
