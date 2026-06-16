import { gsap } from '../../lib/gsap.js'
import './payout-split.css'

/* PARTNERS — payout-split
   Total earnings count up, then a donut splits 60/40 between Partner A (accent)
   and Partner B (sync green) while two Indian-currency counters tick. A reset
   beat returns to zero for a seamless repeat:-1 loop.
   Plugin-free: gsap core + ScrollTrigger only. Donut split via two <circle>
   using stroke-dasharray / stroke-dashoffset on pathLength="1". */

const TOTAL = 184000 // ₹1,84,000
const SHARE_A = 110400 // ₹1,10,400 (60%)
const SHARE_B = 73600 // ₹73,600 (40%)

function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Indian digit grouping: e.g. 184000 -> "₹1,84,000"
function inr(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

function markup() {
  return `
  <svg viewBox="0 0 520 300" class="ps-stage" role="img" aria-label="Payout split between Partner A and Partner B">
    <!-- donut centered left -->
    <g class="ps-donut" transform="translate(130,150)">
      <circle class="ps-track" r="78" fill="none" stroke-width="22"/>
      <circle class="ps-arc-a" r="78" fill="none" stroke-width="22" pathLength="1"
              transform="rotate(-90)"/>
      <circle class="ps-arc-b" r="78" fill="none" stroke-width="22" pathLength="1"
              transform="rotate(126)"/>
      <text class="ps-total" x="0" y="6" text-anchor="middle">${inr(0)}</text>
    </g>
    <!-- legend / counters right -->
    <g class="ps-legend" transform="translate(280,90)">
      <g class="ps-li" data-p="a">
        <rect class="ps-sw ps-sw-a" x="0" y="-12" width="14" height="14" rx="4"/>
        <text class="ps-name" x="26" y="0">Partner A</text>
        <text class="ps-amt ps-amt-a" x="26" y="30">${inr(0)}</text>
        <text class="ps-pct" x="200" y="0" text-anchor="end">60%</text>
      </g>
      <g class="ps-li" data-p="b" transform="translate(0,90)">
        <rect class="ps-sw ps-sw-b" x="0" y="-12" width="14" height="14" rx="4"/>
        <text class="ps-name" x="26" y="0">Partner B</text>
        <text class="ps-amt ps-amt-b" x="26" y="30">${inr(0)}</text>
        <text class="ps-pct" x="200" y="0" text-anchor="end">40%</text>
      </g>
    </g>
  </svg>`
}

export function initPayoutSplit(root) {
  root.classList.add('payout-split')
  root.innerHTML = markup()

  const q = gsap.utils.selector(root)
  const trackEl = q('.ps-track')[0]
  const arcA = q('.ps-arc-a')[0]
  const arcB = q('.ps-arc-b')[0]
  const donut = q('.ps-donut')[0]
  const totalEl = q('.ps-total')[0]
  const amtAEl = q('.ps-amt-a')[0]
  const amtBEl = q('.ps-amt-b')[0]

  // Small gap between arcs so the round caps don't overlap.
  const GAP = 0.01
  const A_LEN = 0.6 - GAP
  const B_LEN = 0.4 - GAP

  // Reduced-motion: render the final split state, no tweens/listeners.
  if (prefersReduced()) {
    gsap.set(trackEl, { attr: { 'stroke-dasharray': 1, 'stroke-dashoffset': 0 } })
    gsap.set(arcA, { attr: { 'stroke-dasharray': `${A_LEN} ${1 - A_LEN}`, 'stroke-dashoffset': 0 } })
    gsap.set(arcB, { attr: { 'stroke-dasharray': `${B_LEN} ${1 - B_LEN}`, 'stroke-dashoffset': 0 } })
    totalEl.textContent = inr(TOTAL)
    amtAEl.textContent = inr(SHARE_A)
    amtBEl.textContent = inr(SHARE_B)
    return () => {
      root.innerHTML = ''
      root.classList.remove('payout-split')
    }
  }

  // Frame-0 / reset state: track full, arcs hidden, counters at zero.
  gsap.set(trackEl, { attr: { 'stroke-dasharray': 1, 'stroke-dashoffset': 1 } })
  gsap.set(arcA, { attr: { 'stroke-dasharray': `${A_LEN} ${1 - A_LEN}`, 'stroke-dashoffset': A_LEN } })
  gsap.set(arcB, { attr: { 'stroke-dasharray': `${B_LEN} ${1 - B_LEN}`, 'stroke-dashoffset': B_LEN } })

  const counters = { total: 0, a: 0, b: 0 }
  const writeTotal = () => { totalEl.textContent = inr(counters.total) }
  const writeA = () => { amtAEl.textContent = inr(counters.a) }
  const writeB = () => { amtBEl.textContent = inr(counters.b) }

  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } })

  // 1. Fill total + sweep the full track ring in.
  tl.to(trackEl, { attr: { 'stroke-dashoffset': 0 }, duration: 1.0, ease: 'power2.out' }, 0)
    .to(counters, {
      total: TOTAL, duration: 2.0, ease: 'power1.out',
      snap: { total: 1 }, onUpdate: writeTotal
    }, 0)

  // 2. Split reveal — Arc A draws its 60%, then Arc B draws its 40%.
  tl.to(arcA, { attr: { 'stroke-dashoffset': 0 }, duration: 0.8, ease: 'power3.out' }, 1.0)
    .to(donut, { scale: 1.03, transformOrigin: 'center', duration: 0.18, yoyo: true, repeat: 1 }, '>-0.18')
    .to(arcB, { attr: { 'stroke-dashoffset': 0 }, duration: 0.8, ease: 'power3.out' }, 1.2)
    .to(donut, { scale: 1.03, transformOrigin: 'center', duration: 0.18, yoyo: true, repeat: 1 }, '>-0.18')

  // 3. Counters split in parallel with the arcs.
  tl.to(counters, {
    a: SHARE_A, duration: 0.8, ease: 'power1.out', snap: { a: 1 }, onUpdate: writeA
  }, 1.0)
    .to(counters, {
      b: SHARE_B, duration: 0.8, ease: 'power1.out', snap: { b: 1 }, onUpdate: writeB
    }, 1.2)

  // 4. Hold at full state.
  tl.to({}, { duration: 0.8 })

  // 5. Reset beat — arcs retract + counters tween back to zero (seamless loop).
  tl.to(arcA, { attr: { 'stroke-dashoffset': A_LEN }, duration: 0.6, ease: 'power2.in' }, '>')
    .to(arcB, { attr: { 'stroke-dashoffset': B_LEN }, duration: 0.6, ease: 'power2.in' }, '<')
    .to(trackEl, { attr: { 'stroke-dashoffset': 1 }, duration: 0.6, ease: 'power2.in' }, '<')
    .to(counters, {
      total: 0, a: 0, b: 0, duration: 0.6, ease: 'power2.in',
      snap: { total: 1, a: 1, b: 1 },
      onUpdate: () => { writeTotal(); writeA(); writeB() }
    }, '<')

  // Hover: accelerate timeScale + slight arc pop; restore on leave.
  const onEnter = () => {
    gsap.to(tl, { timeScale: 1.6, duration: 0.4, overwrite: true })
    gsap.to(donut, { scale: 1.04, transformOrigin: 'center', duration: 0.3, overwrite: 'auto' })
  }
  const onLeave = () => {
    gsap.to(tl, { timeScale: 1, duration: 0.4, overwrite: true })
    gsap.to(donut, { scale: 1, transformOrigin: 'center', duration: 0.3, overwrite: 'auto' })
  }
  root.addEventListener('pointerenter', onEnter)
  root.addEventListener('pointerleave', onLeave)

  return () => {
    tl.kill()
    gsap.killTweensOf(q('*'))
    gsap.killTweensOf(counters)
    gsap.killTweensOf(tl)
    root.removeEventListener('pointerenter', onEnter)
    root.removeEventListener('pointerleave', onLeave)
    root.innerHTML = ''
    root.classList.remove('payout-split')
  }
}
