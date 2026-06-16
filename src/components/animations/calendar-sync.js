import { gsap } from '../../lib/gsap.js'
import './calendar-sync.css'

/* FEATURES — calendar-sync
   "Real-Time Calendar Sync": one master availability grid (7×5) plus two channel
   mini-grids (Airbnb, Booking.com). A booking on one channel instantly mirrors to
   the master grid and the other channel → visualizes ZERO double-bookings.
   Scripted loop of booking events, then a reset wave back to empty for a seamless
   repeat:-1.
   Plugin-free: gsap core + ScrollTrigger only. Flying tokens move via x/y keyframe
   tweens; sync arrows draw via stroke-dasharray/stroke-dashoffset on pathLength="1". */

function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Master grid is 7×5 = 35; each mini channel grid mirrors the first 21 cells (7×3).
const MASTER_COLS = 7
const MASTER_ROWS = 5
const MASTER_CELLS = MASTER_COLS * MASTER_ROWS // 35
const MINI_COLS = 7
const MINI_ROWS = 3
const MINI_CELLS = MINI_COLS * MINI_ROWS // 21

// Scripted booking events. Each: which channel originates it ('airbnb'|'booking')
// and which cell index (shared across master + both minis, must be < MINI_CELLS).
const EVENTS = [
  { from: 'airbnb', cell: 4 },
  { from: 'booking', cell: 9 },
  { from: 'airbnb', cell: 15 },
  { from: 'booking', cell: 18 },
]

// Reduced-motion static pattern: these cells booked + mirrored everywhere.
const STATIC_BOOKED = [3, 7, 10, 14, 19]

function cellsMarkup(count, prefix) {
  let out = ''
  for (let i = 0; i < count; i++) {
    out += `<span class="cs-cell is-free" data-i="${i}" data-grid="${prefix}"></span>`
  }
  return out
}

function markup() {
  return `
    <div class="cs-wrap">
      <div class="cs-master">
        <div class="cs-head">Master Calendar · June</div>
        <div class="cs-grid">${cellsMarkup(MASTER_CELLS, 'master')}</div>
      </div>

      <div class="cs-link" aria-hidden="true">
        <svg class="cs-link-svg" viewBox="0 0 60 220" xmlns="http://www.w3.org/2000/svg" fill="none">
          <path class="cs-arrow" data-dir="top" pathLength="1"
                d="M4,58 C 34,58 34,30 56,30"/>
          <path class="cs-arrow" data-dir="bottom" pathLength="1"
                d="M56,190 C 34,190 34,162 4,162"/>
        </svg>
      </div>

      <div class="cs-channels">
        <div class="cs-mini" data-ch="airbnb">
          <div class="cs-mini-head">Airbnb</div>
          <div class="cs-minigrid">${cellsMarkup(MINI_CELLS, 'airbnb')}</div>
        </div>
        <div class="cs-mini" data-ch="booking">
          <div class="cs-mini-head">Booking.com</div>
          <div class="cs-minigrid">${cellsMarkup(MINI_CELLS, 'booking')}</div>
        </div>
      </div>

      <span class="cs-token" aria-hidden="true"></span>
    </div>`
}

export function initCalendarSync(root) {
  root.classList.add('calendar-sync')
  root.innerHTML = markup()

  const q = gsap.utils.selector(root)
  const cell = (grid, i) => q(`.cs-cell[data-grid="${grid}"][data-i="${i}"]`)[0]

  // ---- Reduced motion: static mirrored end-state, no tweens, no listeners ----
  if (prefersReduced()) {
    STATIC_BOOKED.forEach((i) => {
      ;['master', 'airbnb', 'booking'].forEach((grid) => {
        const c = cell(grid, i)
        if (c) {
          c.classList.remove('is-free')
          c.classList.add('is-booked')
        }
      })
    })
    gsap.set(q('.cs-arrow'), { strokeDashoffset: 0, opacity: 0.55 })
    gsap.set(q('.cs-token'), { opacity: 0 })
    return () => {
      root.innerHTML = ''
      root.classList.remove('calendar-sync')
    }
  }

  const arrowTop = q('.cs-arrow[data-dir="top"]')[0]
  const arrowBottom = q('.cs-arrow[data-dir="bottom"]')[0]
  const token = q('.cs-token')[0]

  // ---- Frame-0 state (mirrors post-reset state for a seamless loop) ----
  gsap.set(q('.cs-arrow'), { strokeDasharray: 1, strokeDashoffset: 1, opacity: 0.55 })
  gsap.set(token, { opacity: 0, x: 0, y: 0, scale: 1, xPercent: -50, yPercent: -50 })

  // Helper: flip a cell to booked (pop + class swap).
  const bookCell = (tl, c, at) => {
    if (!c) return
    tl.call(() => {
      c.classList.remove('is-free')
      c.classList.add('is-syncing', 'is-booked')
    }, null, at)
    tl.fromTo(
      c,
      { scale: 1 },
      { scale: 1.15, duration: 0.18, ease: 'back.out(3)', transformOrigin: 'center' },
      at
    )
    tl.to(c, { scale: 1, duration: 0.22, ease: 'power2.out', transformOrigin: 'center' }, at + 0.18)
    tl.call(() => c.classList.remove('is-syncing'), null, at + 0.4)
  }

  // Token flight: read source + target cell centres relative to root, tween x/y.
  const flyToken = (tl, srcCell, dstCell, at) => {
    tl.call(
      () => {
        const rb = root.getBoundingClientRect()
        const s = srcCell.getBoundingClientRect()
        const d = dstCell.getBoundingClientRect()
        gsap.set(token, {
          x: s.left + s.width / 2 - rb.left,
          y: s.top + s.height / 2 - rb.top,
          opacity: 0,
          scale: 1,
        })
        gsap.to(token, {
          keyframes: {
            x: [
              s.left + s.width / 2 - rb.left,
              d.left + d.width / 2 - rb.left,
            ],
            y: [
              s.top + s.height / 2 - rb.top,
              d.top + d.height / 2 - rb.top,
            ],
            opacity: [0, 1, 1, 0],
          },
          duration: 0.5,
          ease: 'power1.inOut',
        })
      },
      null,
      at
    )
  }

  // ---- Master choreography timeline ----
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } })

  const EVENT_DUR = 1.1
  EVENTS.forEach((evt, idx) => {
    const at = idx * EVENT_DUR
    const otherCh = evt.from === 'airbnb' ? 'booking' : 'airbnb'
    const arrow = evt.from === 'airbnb' ? arrowTop : arrowBottom

    const srcCell = cell(evt.from, evt.cell)
    const masterCell = cell('master', evt.cell)
    const twinCell = cell(otherCh, evt.cell)

    // 1. Source channel cell pulses + books.
    bookCell(tl, srcCell, at)

    // 2. Sync arrow draws channel→master + token flies along it.
    tl.fromTo(
      arrow,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.4, ease: 'power2.inOut' },
      at + 0.1
    )
    flyToken(tl, srcCell, masterCell, at + 0.15)

    // 3. Master cell flips booked, then mirror to the OTHER channel (staggered).
    bookCell(tl, masterCell, at + 0.5)
    bookCell(tl, twinCell, at + 0.65)

    // 4. Arrow re-dims back to idle dash for the next event (seamless).
    tl.to(arrow, { strokeDashoffset: 1, duration: 0.3, ease: 'power2.in' }, at + 0.85)
  })

  // 5. Brief settle, then reset wave: all booked cells fade back to free.
  const resetAt = EVENTS.length * EVENT_DUR + 0.3
  tl.to(
    q('.cs-cell.is-booked'),
    {
      scale: 0.86,
      opacity: 0.6,
      duration: 0.4,
      ease: 'power2.in',
      stagger: { each: 0.02, from: 'random' },
    },
    resetAt
  )
  tl.call(
    () => {
      q('.cs-cell').forEach((c) => {
        c.classList.remove('is-booked', 'is-syncing')
        c.classList.add('is-free')
        gsap.set(c, { scale: 1, opacity: 1, clearProps: 'transform' })
      })
    },
    null,
    resetAt + 0.5
  )
  // Tail beat so the loop's frame-0 reads as the clean empty grid.
  tl.to({}, { duration: 0.3 })

  // ---- Ambient: a few free cells gently breathe to feel live ----
  const breatheCells = [
    cell('master', 22),
    cell('master', 28),
    cell('master', 33),
  ].filter(Boolean)
  const breathe = gsap.to(breatheCells, {
    opacity: 0.62,
    duration: 1.4,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    stagger: 0.4,
  })

  // ---- Hover: accelerate timeScale; restore on leave ----
  const onEnter = () => {
    gsap.to(tl, { timeScale: 1.6, duration: 0.4, overwrite: true })
    root.classList.add('is-hot')
  }
  const onLeave = () => {
    gsap.to(tl, { timeScale: 1, duration: 0.4, overwrite: true })
    root.classList.remove('is-hot')
  }
  root.addEventListener('pointerenter', onEnter)
  root.addEventListener('pointerleave', onLeave)

  // ---- Cleanup ----
  return () => {
    tl.kill()
    breathe.kill()
    gsap.killTweensOf(q('*'))
    gsap.killTweensOf(tl)
    root.removeEventListener('pointerenter', onEnter)
    root.removeEventListener('pointerleave', onLeave)
    root.innerHTML = ''
    root.classList.remove('calendar-sync', 'is-hot')
  }
}
