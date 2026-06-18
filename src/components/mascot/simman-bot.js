import { gsap } from '../../lib/gsap.js'
import './simman-bot.css'

// Friendly automation mascot for the hero: a white "robohands" bot that bobs,
// blinks, waves, and pulses its antenna — surrounded by floating context badges
// (property, calendar sync, booking key, ₹ payouts) so it instantly reads as a
// property-management assistant to the end audience. Self-contained inline SVG
// with a static reduced-motion fallback and a cleanup return.

function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// 24x24 line glyphs, placed centered inside a 40x40 badge.
const GLYPHS = {
  property: '<path d="M4 11 L12 4 L20 11"/><path d="M6 10 V20 H18 V10"/>',
  calendar:
    '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10 H20 M8 4 V8 M16 4 V8"/>',
  key: '<circle cx="8" cy="14" r="4"/><path d="M10.8 11.2 L20 4 M16 6 L18 8 M14 8 L16 10"/>',
  payout: '<text class="bot-badge-rupee" x="12" y="17" text-anchor="middle">₹</text>',
}

function badge(x, y, kind, label) {
  return `
    <g class="bot-badge" data-badge transform="translate(${x},${y})">
      <rect class="bot-badge-bg" width="40" height="40" rx="11"/>
      <g class="bot-badge-glyph" transform="translate(8,8)">${GLYPHS[kind]}</g>
      <title>${label}</title>
    </g>`
}

function markup() {
  return `
  <svg viewBox="-40 -8 320 320" class="bot-stage" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Simplified Management property automation mascot">
    <ellipse class="bot-shadow" cx="120" cy="288" rx="56" ry="9"/>

    <g class="bot-float">
      <!-- antenna -->
      <line class="bot-antenna" x1="120" y1="74" x2="120" y2="50"/>
      <circle class="bot-antenna-ring" cx="120" cy="46" r="7"/>
      <circle class="bot-antenna-dot" cx="120" cy="46" r="7"/>

      <!-- arms sit behind the torso -->
      <g class="bot-arm bot-arm--left">
        <path class="bot-limb" d="M80 206 Q 56 226 48 246"/>
        <circle class="bot-hand" cx="46" cy="250" r="15"/>
      </g>
      <g class="bot-arm bot-arm--right">
        <path class="bot-limb" d="M160 204 Q 196 190 206 158"/>
        <circle class="bot-hand" cx="208" cy="152" r="15"/>
      </g>

      <!-- torso -->
      <rect class="bot-body" x="74" y="178" width="92" height="82" rx="24"/>
      <rect class="bot-chest" x="90" y="196" width="60" height="46" rx="12"/>
      <path class="bot-check" pathLength="1" d="M104 220 l9 9 l16 -19"/>

      <!-- feet -->
      <rect class="bot-foot" x="86" y="258" width="26" height="14" rx="7"/>
      <rect class="bot-foot" x="128" y="258" width="26" height="14" rx="7"/>

      <!-- neck + head -->
      <rect class="bot-neck" x="110" y="166" width="20" height="18" rx="6"/>
      <rect class="bot-ear" x="50" y="108" width="10" height="28" rx="5"/>
      <rect class="bot-ear" x="180" y="108" width="10" height="28" rx="5"/>
      <rect class="bot-head" x="58" y="74" width="124" height="98" rx="28"/>
      <rect class="bot-face" x="72" y="90" width="96" height="66" rx="18"/>
      <g class="bot-eyes">
        <circle class="bot-eye" data-eye cx="102" cy="118" r="8"/>
        <circle class="bot-eye" data-eye cx="138" cy="118" r="8"/>
      </g>
      <path class="bot-smile" d="M104 136 Q 120 146 136 136"/>
    </g>

    <!-- floating context badges: what the bot manages for you -->
    ${badge(-34, 70, 'property', 'Properties & listings')}
    ${badge(216, 70, 'calendar', 'Calendar sync')}
    ${badge(-38, 172, 'key', 'Bookings & access')}
    ${badge(222, 172, 'payout', 'Partner payouts')}
  </svg>`
}

export function initMascot(root) {
  root.classList.add('simman-bot')
  root.innerHTML = markup()

  const q = gsap.utils.selector(root)
  const float = q('.bot-float')[0]
  const eyes = q('[data-eye]')
  const rightArm = q('.bot-arm--right')[0]
  const dot = q('.bot-antenna-dot')[0]
  const ring = q('.bot-antenna-ring')[0]
  const check = q('.bot-check')[0]
  const badges = q('[data-badge]')

  if (prefersReduced()) {
    gsap.set(check, { strokeDasharray: 1, strokeDashoffset: 0 })
    gsap.set(ring, { opacity: 0 })
    return () => {
      root.innerHTML = ''
      root.classList.remove('simman-bot')
    }
  }

  // Pivots / origins
  gsap.set(eyes, { transformOrigin: 'center center' })
  gsap.set(rightArm, { svgOrigin: '160 204' })
  gsap.set([ring, ...badges], { transformOrigin: 'center center' })

  const tweens = []

  // Gentle idle bob for the whole bot
  tweens.push(
    gsap.to(float, {
      y: -8,
      duration: 2.2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
  )

  // Blink: quick eyelid squash on a relaxed cadence
  tweens.push(
    gsap.to(eyes, {
      scaleY: 0.1,
      duration: 0.09,
      ease: 'power1.inOut',
      repeat: -1,
      yoyo: true,
      repeatDelay: 2.6,
    })
  )

  // Friendly wave from the raised right arm
  tweens.push(
    gsap.to(rightArm, {
      rotation: -16,
      duration: 0.7,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
  )

  // Antenna "live" pulse: dot breathes, ring expands and fades
  tweens.push(
    gsap.to(dot, {
      scale: 1.25,
      transformOrigin: 'center center',
      duration: 1,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
  )
  tweens.push(
    gsap.fromTo(
      ring,
      { scale: 0.6, opacity: 0.7 },
      {
        scale: 2.4,
        opacity: 0,
        duration: 1.6,
        ease: 'power1.out',
        repeat: -1,
        repeatDelay: 0.4,
      }
    )
  )

  // Each context badge drifts on its own gentle, offset loop
  badges.forEach((b, i) => {
    tweens.push(
      gsap.to(b, {
        y: i % 2 ? 7 : -7,
        duration: 2.4 + i * 0.3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: i * 0.25,
      })
    )
  })

  // Chest check draws in once, then holds (the "synced" beat)
  gsap.set(check, { strokeDasharray: 1, strokeDashoffset: 1 })
  tweens.push(
    gsap.to(check, {
      strokeDashoffset: 0,
      duration: 0.6,
      ease: 'power2.out',
      delay: 0.5,
    })
  )

  return () => {
    tweens.forEach((t) => t.kill())
    gsap.killTweensOf(q('*'))
    root.innerHTML = ''
    root.classList.remove('simman-bot')
  }
}
