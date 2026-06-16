import SplitType from 'split-type'
import { gsap } from '../lib/gsap.js'

// Reveal the white page grid: a clean line-by-line headline rise, then the nav
// and supporting elements settle in. Runs once the preloader unmounts.
export function revealHero() {
  const content = document.querySelector('[data-content]')
  const title = document.querySelector('[data-hero-title]')
  gsap.set(content, { opacity: 1 })

  const tl = gsap.timeline()

  if (title) {
    const split = new SplitType(title, { types: 'lines', lineClass: 'line' })
    tl.from(split.lines, {
      yPercent: 110,
      duration: 1,
      ease: 'power4.out',
      stagger: 0.12,
    })
  }

  tl.from('[data-nav]', { y: -30, autoAlpha: 0, duration: 0.8 }, 0).from(
    '[data-hero-fade]',
    { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1 },
    title ? '-=0.6' : 0
  )
}
