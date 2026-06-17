import { gsap } from '../../lib/gsap.js'
import './ota-constellation.css'

/* OTA CONNECTIVITY — ota-constellation
   "50+ OTA Connections" constellation: central SM hub with a continuous sonar
   pulse, 6 channel chips radiating out as connector lines draw, and a "+50"
   cluster that pops + counts up to imply the long tail. Plugin-free: lines draw
   via stroke-dasharray/stroke-dashoffset on pathLength="1". */

function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Hub centre + radial chip layout (radius ~170, angles ≈ -150..150° / 60° apart)
const HUB = { x: 280, y: 240 }
const RADIUS = 170
const CHIPS = [
  { name: 'Airbnb', angle: -150 },
  { name: 'Booking.com', angle: -90 },
  { name: 'Agoda', angle: -30 },
  { name: 'Expedia', angle: 30 },
  { name: 'StayVista', angle: 90 },
  { name: 'Vrbo', angle: 150 },
]

const CHIP_W = 96
const CHIP_H = 34
// Connectors stop just short of each chip's near edge (along the radial line)
// so the line never crosses into the chip body — the Booking.com chip sits
// straight above the hub, so its line is vertical and used to poke out the
// chip's bottom edge.
const LINE_GAP = 6

function anchorFor(angle) {
  const rad = (angle * Math.PI) / 180
  return {
    x: Math.round(HUB.x + RADIUS * Math.cos(rad)),
    y: Math.round(HUB.y + RADIUS * Math.sin(rad)),
  }
}

// Point where the hub->chip line should terminate: the chip's rectangle edge
// (toward the hub) minus LINE_GAP. Computed from the chip centre by walking
// back along the radial direction to the nearest rect boundary.
function lineEndFor(angle) {
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const c = anchorFor(angle)
  const back =
    Math.min(
      Math.abs(cos) < 1e-6 ? Infinity : CHIP_W / 2 / Math.abs(cos),
      Math.abs(sin) < 1e-6 ? Infinity : CHIP_H / 2 / Math.abs(sin)
    ) + LINE_GAP
  return {
    x: Math.round(c.x - back * cos),
    y: Math.round(c.y - back * sin),
  }
}

export function initOtaConstellation(root) {
  root.classList.add('ota-constellation')

  const chipMarkup = CHIPS.map((chip, i) => {
    const a = anchorFor(chip.angle)
    return `
      <g class="oc-chip" data-i="${i}" transform="translate(${a.x},${a.y})">
        <rect class="oc-chip-bg" x="${-CHIP_W / 2}" y="${-CHIP_H / 2}" width="${CHIP_W}" height="${CHIP_H}" rx="12"/>
        <circle class="oc-chip-icon" cx="${-CHIP_W / 2 + 18}" cy="0" r="6"/>
        <text class="oc-chip-name" x="${-CHIP_W / 2 + 32}" y="4">${chip.name}</text>
      </g>`
  }).join('')

  const lineMarkup = CHIPS.map((chip, i) => {
    const e = lineEndFor(chip.angle)
    return `<line class="oc-line" data-i="${i}" x1="${HUB.x}" y1="${HUB.y}" x2="${e.x}" y2="${e.y}" pathLength="1"/>`
  }).join('')

  root.innerHTML = `
    <svg class="oc-stage" viewBox="0 0 560 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Simplified Management connecting to 50+ OTA channels">
      <g class="oc-fan" fill="none" stroke-linecap="round">
        <line class="oc-fan-line" data-i="0" x1="440" y1="360" x2="500" y2="300" pathLength="1"/>
        <line class="oc-fan-line" data-i="1" x1="440" y1="360" x2="520" y2="378" pathLength="1"/>
        <line class="oc-fan-line" data-i="2" x1="440" y1="360" x2="466" y2="430" pathLength="1"/>
      </g>

      <g class="oc-lines" fill="none">
        ${lineMarkup}
      </g>

      <g class="oc-chips">
        ${chipMarkup}
      </g>

      <g class="oc-plus" transform="translate(440,360)">
        <circle class="oc-plus-bg" r="26"/>
        <text class="oc-plus-num" x="0" y="5">+0</text>
      </g>

      <g class="oc-hub" transform="translate(280,240)">
        <circle class="oc-hub-ring" r="40"/>
        <circle class="oc-hub-core" r="26"/>
        <text class="oc-hub-label" x="0" y="5">SM</text>
      </g>
    </svg>`

  const q = gsap.utils.selector(root)

  // ---- Reduced motion: full final resting state, no tweens, no listeners ----
  if (prefersReduced()) {
    gsap.set(q('.oc-line'), { strokeDashoffset: 0, opacity: 1 })
    gsap.set(q('.oc-fan-line'), { strokeDashoffset: 0, opacity: 0.4 })
    gsap.set(q('.oc-chip'), { scale: 1, opacity: 1, transformOrigin: 'center' })
    gsap.set(q('.oc-chip-icon'), { fill: 'var(--color-sync)' })
    gsap.set(q('.oc-plus'), { scale: 1, opacity: 1, transformOrigin: 'center' })
    gsap.set(q('.oc-hub-ring'), { scale: 1, opacity: 0.45, transformOrigin: 'center' })
    q('.oc-plus-num')[0].textContent = '+50'
    return () => {
      root.innerHTML = ''
      root.classList.remove('ota-constellation')
    }
  }

  // ---- Frame-0 state (mirrors the post-reset state for a seamless loop) ----
  gsap.set(q('.oc-line'), { strokeDasharray: 1, strokeDashoffset: 1, opacity: 1 })
  gsap.set(q('.oc-fan-line'), { strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 })
  gsap.set(q('.oc-chip'), { scale: 0.8, opacity: 0, transformOrigin: 'center' })
  gsap.set(q('.oc-chip-icon'), { fill: 'var(--color-accent)' })
  gsap.set(q('.oc-plus'), { scale: 0, opacity: 0, transformOrigin: 'center' })

  // ---- Continuous hub sonar (independent loop, runs across the reset) ----
  gsap.set(q('.oc-hub-ring'), { transformOrigin: 'center' })
  const sonar = gsap.fromTo(
    q('.oc-hub-ring'),
    { scale: 1, opacity: 0.5 },
    { scale: 1.4, opacity: 0, duration: 1.8, ease: 'none', repeat: -1 }
  )
  // Gentle core breathe (independent, seamless).
  const breathe = gsap.to(q('.oc-hub-core'), {
    scale: 1.06,
    transformOrigin: 'center',
    duration: 1.6,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  })

  // ---- Master choreography timeline ----
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } })
  const counter = { v: 0 }

  // Connect each chip, staggered.
  CHIPS.forEach((chip, i) => {
    const at = i * 0.35
    const line = q(`.oc-line[data-i="${i}"]`)
    const chipEl = q(`.oc-chip[data-i="${i}"]`)
    const icon = q(`.oc-chip[data-i="${i}"] .oc-chip-icon`)

    tl.to(line, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, at)
    tl.to(
      chipEl,
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' },
      at + 0.2
    )
    tl.to(icon, { fill: 'var(--color-sync)', duration: 0.3 }, at + 0.35)
  })

  // "+50" cluster pops after the named chips, with the fan lines + count-up.
  const plusStart = CHIPS.length * 0.35 + 0.1
  tl.to(
    q('.oc-plus'),
    { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(2)' },
    plusStart
  )
  tl.to(
    q('.oc-fan-line'),
    { strokeDashoffset: 0, opacity: 0.4, duration: 0.4, stagger: 0.06, ease: 'power2.out' },
    plusStart + 0.1
  )
  tl.to(
    counter,
    {
      v: 50,
      duration: 0.5,
      ease: 'power1.out',
      snap: { v: 1 },
      onUpdate() {
        q('.oc-plus-num')[0].textContent = '+' + counter.v
      },
    },
    plusStart + 0.1
  )

  // Hold fully connected.
  tl.to({}, { duration: 0.8 })

  // ---- Reset beat: retract lines + fade chips/plus back to frame-0 ----
  const reset = '+=0'
  tl.to(
    q('.oc-line'),
    { strokeDashoffset: 1, duration: 0.5, stagger: 0.04, ease: 'power2.in' },
    reset
  )
  tl.to(
    q('.oc-fan-line'),
    { strokeDashoffset: 1, opacity: 0, duration: 0.4, ease: 'power2.in' },
    reset
  )
  tl.to(
    q('.oc-chip'),
    { scale: 0.8, opacity: 0, duration: 0.45, stagger: 0.03, ease: 'power2.in' },
    reset
  )
  tl.to(
    q('.oc-chip-icon'),
    { fill: 'var(--color-accent)', duration: 0.3 },
    reset
  )
  tl.to(
    q('.oc-plus'),
    {
      scale: 0,
      opacity: 0,
      duration: 0.45,
      ease: 'power2.in',
      onComplete() {
        q('.oc-plus-num')[0].textContent = '+0'
        counter.v = 0
      },
    },
    reset
  )

  // ---- Hover: accelerate + brighten hub via CSS .is-hot ----
  const onEnter = () => {
    gsap.to(tl, { timeScale: 1.7, duration: 0.4, overwrite: true })
    gsap.to(sonar, { timeScale: 1.7, duration: 0.4, overwrite: true })
    root.classList.add('is-hot')
  }
  const onLeave = () => {
    gsap.to(tl, { timeScale: 1, duration: 0.4, overwrite: true })
    gsap.to(sonar, { timeScale: 1, duration: 0.4, overwrite: true })
    root.classList.remove('is-hot')
  }
  root.addEventListener('pointerenter', onEnter)
  root.addEventListener('pointerleave', onLeave)

  // ---- Cleanup ----
  return () => {
    tl.kill()
    sonar.kill()
    breathe.kill()
    gsap.killTweensOf(q('*'))
    root.removeEventListener('pointerenter', onEnter)
    root.removeEventListener('pointerleave', onLeave)
    root.innerHTML = ''
    root.classList.remove('ota-constellation', 'is-hot')
  }
}
