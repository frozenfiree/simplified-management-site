import { gsap } from '../lib/gsap.js'

// Minimal preloader: a single blue line at the top of the viewport tracks
// progress, then fades out to reveal the clean white page grid.
export function runLoader() {
  return new Promise((resolve) => {
    const loader = document.querySelector('[data-loader]')
    const bar = document.querySelector('[data-loader-bar]')

    if (!loader || !bar) {
      if (loader) loader.remove()
      resolve()
      return
    }

    const progress = { value: 0 }

    gsap
      .timeline({
        onComplete: () => {
          loader.remove()
          resolve()
        },
      })
      .to(progress, {
        value: 100,
        duration: 1.3,
        ease: 'power1.inOut',
        onUpdate: () => {
          bar.style.transform = `scaleX(${progress.value / 100})`
        },
      })
      .to(loader, { autoAlpha: 0, duration: 0.35 }, '+=0.1')
  })
}
