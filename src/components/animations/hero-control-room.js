import { gsap } from '../../lib/gsap.js'
import './hero-control-room.css'

const CHANNELS = ['Airbnb', 'Booking.com', 'Agoda', 'Expedia', 'StayVista']

// Chip vertical anchors (top-left translate y of each chip group); chip is 132x32.
const CHIP_Y = [80, 152, 216, 284, 356]
const CHIP_X = 576
const CHIP_W = 132
const CHIP_H = 32
// Tick sits in a reserved gap on the chip's right edge (label never reaches here).
const TICK_X = CHIP_W - 18 // 114
// Connectors terminate a few px LEFT of each chip so the line never crosses the
// chip body. Endpoint x = CHIP_X - LINE_GAP; endpoint y = chip vertical centre.
const LINE_GAP = 6
const LINE_END_X = CHIP_X - LINE_GAP // 570
const CHIP_CY = CHIP_Y.map((y) => y + CHIP_H / 2) // icon/centre line of each chip

// Connector path d-strings (hub -> just left of chip edge, at chip centre Y).
const LINE_D = [
  `M336,220 C 460,90  520,${CHIP_CY[0]}  ${LINE_END_X},${CHIP_CY[0]}`,
  `M336,220 C 460,150 520,${CHIP_CY[1]}  ${LINE_END_X},${CHIP_CY[1]}`,
  `M336,220 C 460,220 520,${CHIP_CY[2]}  ${LINE_END_X},${CHIP_CY[2]}`,
  `M336,220 C 460,290 520,${CHIP_CY[3]}  ${LINE_END_X},${CHIP_CY[3]}`,
  `M336,220 C 460,350 520,${CHIP_CY[4]}  ${LINE_END_X},${CHIP_CY[4]}`,
]

const COUNTER_TARGET = 247

function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function buildRows() {
  const rows = [
    { label: 'Sea View Villa', value: '92%' },
    { label: 'Downtown Loft', value: '88%' },
    { label: 'Garden Studio', value: '95%' },
    { label: 'Hilltop Cabin', value: '81%' },
  ]
  return rows
    .map((r, i) => {
      const y = 168 + i * 50
      return `
        <g class="hcr-row" data-i="${i}">
          <rect class="hcr-row-bar" x="20" y="${y}" width="260" height="38" rx="9"/>
          <circle class="hcr-row-dot" cx="38" cy="${y + 19}" r="5"/>
          <text class="hcr-row-label" x="54" y="${y + 23}">${r.label}</text>
          <text class="hcr-row-value" x="262" y="${y + 23}" text-anchor="end">${r.value}</text>
        </g>`
    })
    .join('')
}

function buildLines() {
  return LINE_D.map(
    (d, i) => `<path class="hcr-line" data-i="${i}" pathLength="1" d="${d}"/>`
  ).join('')
}

function buildPulses() {
  return [0, 1, 2, 3, 4]
    .map((i) => `<circle class="hcr-pulse" data-i="${i}" r="4" cx="336" cy="220"/>`)
    .join('')
}

function buildChips() {
  return CHANNELS.map((name, i) => {
    return `
      <g class="hcr-chip" data-i="${i}" transform="translate(${CHIP_X},${CHIP_Y[i]})">
        <rect class="hcr-chip-bg" width="${CHIP_W}" height="${CHIP_H}" rx="10"/>
        <circle class="hcr-chip-icon" cx="16" cy="16" r="6"/>
        <text class="hcr-chip-name" x="30" y="20">${name}</text>
        <g class="hcr-tick" transform="translate(${TICK_X},16)">
          <path pathLength="1" d="M -5 0 L -1 4 L 5 -4"/>
        </g>
      </g>`
  }).join('')
}

function markup() {
  return `
  <svg viewBox="0 0 720 440" class="hcr-stage" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g class="hcr-dash" transform="translate(28,28)">
      <rect class="hcr-panel" width="300" height="384" rx="14"/>
      <g class="hcr-topbar">
        <circle class="hcr-topbar-logo" cx="32" cy="32" r="6"/>
        <text class="hcr-topbar-title" x="48" y="36">Simplified Management</text>
        <circle class="hcr-win" cx="252" cy="32" r="4"/>
        <circle class="hcr-win" cx="268" cy="32" r="4"/>
        <circle class="hcr-win" cx="284" cy="32" r="4"/>
      </g>
      <g class="hcr-counter">
        <text class="hcr-counter-num" x="20" y="120">0</text>
        <text class="hcr-counter-label" x="20" y="142">Live bookings today</text>
      </g>
      <g class="hcr-rows">
        ${buildRows()}
      </g>
      <rect class="hcr-scan" x="14" y="0" width="272" height="40" rx="8"/>
    </g>

    <circle class="hcr-hub" cx="336" cy="220" r="6"/>

    <g class="hcr-lines" fill="none">
      ${buildLines()}
    </g>

    <g class="hcr-pulses">
      ${buildPulses()}
    </g>

    <g class="hcr-chips">
      ${buildChips()}
    </g>
  </svg>`
}

// Sample points along a path so pulses can travel without MotionPathPlugin.
function samplePath(pathEl, samples) {
  const total = pathEl.getTotalLength()
  const pts = []
  for (let s = 0; s <= samples; s++) {
    const p = pathEl.getPointAtLength((total * s) / samples)
    pts.push({ x: p.x, y: p.y })
  }
  return pts
}

function renderStatic(root) {
  const q = gsap.utils.selector(root)
  gsap.set(q('.hcr-line'), { strokeDasharray: 1, strokeDashoffset: 0, opacity: 0.4 })
  gsap.set(q('.hcr-line'), { stroke: 'var(--color-border)' })
  gsap.set(q('.hcr-tick path'), { strokeDasharray: 1, strokeDashoffset: 0, opacity: 1 })
  gsap.set(q('.hcr-tick'), { opacity: 1 })
  gsap.set(q('.hcr-chip-bg'), { stroke: 'var(--color-sync)' })
  gsap.set(q('.hcr-chip-icon'), { fill: 'var(--color-sync)' })
  gsap.set(q('.hcr-pulse'), { opacity: 0 })
  gsap.set(q('.hcr-scan'), { opacity: 0 })
  const num = q('.hcr-counter-num')[0]
  if (num) num.textContent = String(COUNTER_TARGET)

  return () => {
    root.innerHTML = ''
    root.classList.remove('hero-control-room')
  }
}

export function initHeroControlRoom(root) {
  root.classList.add('hero-control-room')
  root.innerHTML = markup()

  if (prefersReduced()) return renderStatic(root)

  const q = gsap.utils.selector(root)

  const lines = q('.hcr-line')
  const pulses = q('.hcr-pulse')
  const chips = q('.hcr-chip')
  const chipBgs = q('.hcr-chip-bg')
  const chipIcons = q('.hcr-chip-icon')
  const ticks = q('.hcr-tick')
  const tickPaths = q('.hcr-tick path')
  const rowValues = q('.hcr-row-value')
  const rowDots = q('.hcr-row-dot')
  const scan = q('.hcr-scan')
  const hub = q('.hcr-hub')[0]
  const counterNum = q('.hcr-counter-num')[0]

  // Pre-sample pulse travel points (avoids MotionPathPlugin).
  const linePoints = lines.map((ln) => samplePath(ln, 30))

  // --- Frame-0 / reset state (identical) ---
  const setFrame0 = () => {
    gsap.set(lines, { strokeDasharray: 1, strokeDashoffset: 1, opacity: 1, stroke: 'var(--color-accent)' })
    gsap.set(pulses, { opacity: 0, x: 0, y: 0 })
    gsap.set(chipBgs, { stroke: 'var(--color-border)' })
    gsap.set(chipIcons, { fill: 'var(--color-accent)' })
    gsap.set(ticks, { opacity: 0 })
    gsap.set(tickPaths, { strokeDasharray: 1, strokeDashoffset: 1 })
    gsap.set(chips, { scale: 1 })
    gsap.set(rowValues, { scale: 1 })
    gsap.set(rowDots, { fill: 'var(--color-border)' })
    gsap.set(scan, { opacity: 0, y: 0 })
    if (counterNum) counterNum.textContent = '0'
  }
  setFrame0()

  // --- Ambient (independent loops, NOT in master) ---
  const hubTween = gsap.to(hub, {
    scale: 1.15,
    duration: 2,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    transformOrigin: 'center',
  })

  const scanTween = gsap.fromTo(
    scan,
    { y: 0, opacity: 0 },
    {
      keyframes: {
        opacity: [0, 0.18, 0],
        easeEach: 'none',
      },
      y: 344,
      duration: 1.2,
      ease: 'none',
      repeat: -1,
    }
  )

  // --- Master timeline (seamless, repeat:-1) ---
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } })

  // Row activations (stagger)
  tl.to(
    rowValues,
    { scale: 1.06, duration: 0.25, ease: 'power2.out', stagger: 0.18, yoyo: true, repeat: 1 },
    0
  )
  tl.to(
    rowDots,
    { fill: 'var(--color-accent)', duration: 0.25, stagger: 0.18, yoyo: true, repeat: 1 },
    0
  )

  // Counter proxy across the whole loop
  const counter = { v: 0 }
  tl.to(
    counter,
    {
      v: COUNTER_TARGET,
      duration: 5.4,
      ease: 'power1.out',
      snap: { v: 1 },
      onUpdate: () => {
        if (counterNum) counterNum.textContent = String(Math.round(counter.v))
      },
    },
    0
  )

  // Per-channel choreography, staggered 0.5s
  CHANNELS.forEach((_, i) => {
    const at = 0.2 + i * 0.5
    const line = lines[i]
    const pulse = pulses[i]
    const pts = linePoints[i]
    const xs = pts.map((p) => p.x - 336)
    const ys = pts.map((p) => p.y - 220)

    // a. Line draws
    tl.fromTo(
      line,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.55, ease: 'power2.inOut' },
      at
    )

    // b. Pulse launches and travels along sampled points
    tl.set(pulse, { opacity: 1, x: xs[0], y: ys[0] }, at + 0.1)
    tl.to(
      pulse,
      { x: xs[xs.length - 1], y: ys[ys.length - 1], duration: 0.6, ease: 'power1.in' },
      at + 0.1
    )
    tl.to(pulse, { opacity: 0, duration: 0.15 }, at + 0.68)

    // c. Chip arrival: border accent->sync, tick draws, chip pop
    tl.to(chipBgs[i], { stroke: 'var(--color-sync)', duration: 0.25 }, at + 0.66)
    tl.to(chipIcons[i], { fill: 'var(--color-sync)', duration: 0.25 }, at + 0.66)
    tl.set(ticks[i], { opacity: 1 }, at + 0.66)
    tl.fromTo(
      tickPaths[i],
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' },
      at + 0.66
    )
    tl.to(
      chips[i],
      { scale: 1.05, duration: 0.18, ease: 'back.out(2)', yoyo: true, repeat: 1 },
      at + 0.66
    )

    // d. Line settles to idle dim
    tl.to(line, { opacity: 0.35, stroke: 'var(--color-border)', duration: 0.4 }, at + 0.7)
  })

  // Seamless reset beat (last ~0.6s): fade ticks + re-dim lines to frame-0 state.
  const resetAt = 5.5
  tl.to(ticks, { opacity: 0, duration: 0.4 }, resetAt)
  tl.to(tickPaths, { strokeDashoffset: 1, duration: 0.4 }, resetAt)
  tl.to(chipBgs, { stroke: 'var(--color-border)', duration: 0.4 }, resetAt)
  tl.to(chipIcons, { fill: 'var(--color-accent)', duration: 0.4 }, resetAt)
  tl.to(lines, { strokeDashoffset: 1, opacity: 1, stroke: 'var(--color-accent)', duration: 0.4 }, resetAt)
  tl.to(pulses, { opacity: 0, duration: 0.1 }, resetAt)
  // hold to total ~6.0s loop
  tl.set({}, {}, 6.0)

  // --- Hover: accelerate timeScale + glow ---
  const onEnter = () => {
    root.classList.add('is-hot')
    gsap.to(tl, { timeScale: 1.7, duration: 0.4, overwrite: true })
  }
  const onLeave = () => {
    root.classList.remove('is-hot')
    gsap.to(tl, { timeScale: 1, duration: 0.4, overwrite: true })
  }
  root.addEventListener('pointerenter', onEnter)
  root.addEventListener('pointerleave', onLeave)

  // --- Responsive compact toggle ---
  let ro = null
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        root.classList.toggle('is-compact', e.contentRect.width < 560)
      }
    })
    ro.observe(root)
  }

  return () => {
    tl.kill()
    hubTween.kill()
    scanTween.kill()
    gsap.killTweensOf(q('*'))
    root.removeEventListener('pointerenter', onEnter)
    root.removeEventListener('pointerleave', onLeave)
    if (ro) ro.disconnect()
    root.innerHTML = ''
    root.classList.remove('hero-control-room')
    root.classList.remove('is-hot')
    root.classList.remove('is-compact')
  }
}
