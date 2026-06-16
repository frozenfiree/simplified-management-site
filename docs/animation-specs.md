# Simplified Management — UI Animation Build Specs

Implementation-ready specs for 4 bespoke, looping, code-driven UI animations (SVG/DOM + GSAP) in the style of polished Framer product-UI motion graphics. Light theme, glassy, premium, seamless infinite loops.

**Stack:** Vite + vanilla JS + GSAP. GSAP imported via `import { gsap } from '../../lib/gsap.js'` (ScrollTrigger pre-registered; defaults `ease:'power3.out'`, `duration:1`).

> Note on line-drawing: specs use plain `stroke-dasharray` / `stroke-dashoffset` tweens (no DrawSVGPlugin dependency). Each `<path>`/`<line>` gets its `pathLength="1"` attribute set so dash math is normalized to 0–1 regardless of real geometry.

---

## Shared conventions (ALL components must follow)

### File layout
- One component = one file: `src/components/animations/<name>.js`.
- Colocated CSS: `import './<name>.css'` at top of the JS file. CSS holds all static styling (fills, strokes, glass blur, radii, fonts); JS only mutates `transform`/`opacity`/dash props via GSAP.
- Export signature: `export function init<Name>(root) { ... return cleanup }`.

### Module skeleton (copy this shape)
```js
import { gsap } from '../../lib/gsap.js'
import './<name>.css'

export function init<Name>(root) {
  root.classList.add('<name>')
  root.innerHTML = `...svg/dom markup...`   // build once, no runtime DOM churn

  if (prefersReduced()) return renderStatic(root)

  const q = gsap.utils.selector(root)
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } })
  // ...choreography...

  // optional hover: accelerate
  const onEnter = () => gsap.to(tl, { timeScale: 1.8, duration: 0.4, overwrite: true })
  const onLeave = () => gsap.to(tl, { timeScale: 1,   duration: 0.4, overwrite: true })
  root.addEventListener('pointerenter', onEnter)
  root.addEventListener('pointerleave', onLeave)

  return () => {                 // cleanup — MUST be returned
    tl.kill()
    gsap.killTweensOf(q('*'))
    root.removeEventListener('pointerenter', onEnter)
    root.removeEventListener('pointerleave', onLeave)
    root.innerHTML = ''
    root.classList.remove('<name>')
  }
}
```

### Reduced-motion helper (inline in each file, identical body)
```js
function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
```
- When reduced: build the SAME markup, then set the **final resting visual state** (all chips connected, counters at final value, lines fully drawn, grid fully synced) with `gsap.set(...)` — no timelines, no listeners. Still `return () => { root.innerHTML=''; root.classList.remove(...) }`.

### Mount pattern (host site calls this — for reference only, do not build host)
```js
const cleanup = initHeroControlRoom(document.querySelector('#hero-anim'))
// on unmount/route change: cleanup()
```

### Performance rules
- Animate ONLY `transform` (x/y/scale/rotation) and `opacity`, plus SVG `stroke-dashoffset`/`stroke-dasharray` and `attr` counters. Never animate width/height/top/left/layout props.
- Add `will-change: transform, opacity` (CSS) only on nodes that actually move; remove via class, don't leave globally.
- Use `gsap.ticker` / timeline only; no `setInterval`. One timeline per component where possible.
- Number counters: tween a proxy object `{ v: 0 }` with `onUpdate` writing `el.textContent`. Use `snap` for integers.
- All loops `repeat:-1`; design the timeline so frame-0 state === end state (seamless). Prefer `yoyo:false` with a built-in reset beat, or `repeatRefresh:true` when randomizing.

### Shared tokens (read from CSS vars; never hardcode hex in JS)
`--color-bg:#ffffff` · `--color-subtle:#f8fafc` · `--color-border:#e2e8f0` · `--color-text:#0f172a` · `--color-muted:#64748b` · `--color-accent:#2563eb` · `--color-sync:#10b981`. Fonts: **Inter** (body/labels/numbers), **Plus Jakarta Sans** (display/headline numbers).

### Shared glass recipe (CSS, reused)
```css
.glass {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
}
```

---

## 1. HERO — `hero-control-room.js` (showpiece)

### (a) Concept
A live "channel distribution control room": a Simplified Management dashboard panel on the left continuously pushing real-time updates outward to a ring of OTA channel chips (Airbnb, Booking.com, Agoda, Expedia, StayVista). Pulse packets travel the connecting lines, each chip flips to a green "synced" tick on arrival, and a live occupancy/booking counter ticks up. Communicates: **one dashboard, real-time control over every channel, zero manual work.**

### (b) DOM / SVG structure
Root: glass card, `viewBox="0 0 720 440"`, `class="hero-control-room glass"`.
```
<svg viewBox="0 0 720 440" class="hcr-stage">
  <!-- LEFT: dashboard panel -->
  <g class="hcr-dash" transform="translate(28,28)">
    <rect class="hcr-panel" width="300" height="384" rx="14"/>
    <g class="hcr-topbar"> logo dot + "Simplified Management" text + 3 window dots </g>
    <g class="hcr-counter">
      <text class="hcr-counter-num" x="20" y="120">0</text>      <!-- occupancy % / bookings -->
      <text class="hcr-counter-label" x="20" y="142">Live bookings today</text>
    </g>
    <g class="hcr-rows">                                          <!-- 4 listing rows -->
      <g class="hcr-row" data-i="0"> rect bar + dot + label + value </g>
      ... x4
    </g>
    <rect class="hcr-scan"/>   <!-- subtle scanning highlight bar -->
  </g>

  <!-- HUB anchor (right edge of dashboard) -->
  <circle class="hcr-hub" cx="336" cy="220" r="6"/>

  <!-- CONNECTORS: 5 paths hub -> each chip -->
  <g class="hcr-lines" fill="none">
    <path class="hcr-line" data-i="0" pathLength="1" d="M336,220 C 470,90  540,90  600,96"/>
    <path class="hcr-line" data-i="1" pathLength="1" d="M336,220 C 470,150 540,150 600,168"/>
    <path class="hcr-line" data-i="2" pathLength="1" d="M336,220 C 470,220 540,220 600,232"/>
    <path class="hcr-line" data-i="3" pathLength="1" d="M336,220 C 470,290 540,290 600,300"/>
    <path class="hcr-line" data-i="4" pathLength="1" d="M336,220 C 470,350 540,350 600,372"/>
  </g>

  <!-- PULSE packets (one per line, reused) -->
  <g class="hcr-pulses">
    <circle class="hcr-pulse" data-i="0..4" r="4"/>   <!-- moved via MotionPath OR x/y along precomputed points -->
  </g>

  <!-- RIGHT: 5 channel chips -->
  <g class="hcr-chips">
    <g class="hcr-chip" data-i="0" transform="translate(600,80)">
      <rect class="hcr-chip-bg" width="92" height="32" rx="10"/>
      <circle class="hcr-chip-icon" cx="16" cy="16" r="6"/>
      <text class="hcr-chip-name" x="30" y="20">Airbnb</text>
      <g class="hcr-tick"> <path d="M.. check ..."/> </g>   <!-- hidden until synced -->
    </g>
    ... Booking.com / Agoda / Expedia / StayVista
  </g>
</svg>
```
Pulse travel path: precompute points with `path.getPointAtLength()` at init (sample ~30 pts/line into an array), then drive `gsap.to(pulse,{x,y})` keyframes — avoids MotionPathPlugin dependency. (If MotionPathPlugin is confirmed available, use it instead.)

### (c) GSAP choreography (master `tl`, `repeat:-1`, total ~6.0s loop)
Build a per-channel sub-timeline, staggered, so the loop feels continuous:
1. **t=0** Dashboard intro beat: `hcr-scan` bar sweeps top→bottom (`y` 0→384, `opacity` 0.0→0.18→0, `duration:1.2`, `ease:none`) — runs continuously, looped independently.
2. **Row activations** (`hcr-row`): stagger each row's value `scale` 1→1.06→1 + dot color flash to `--color-accent`, `stagger:0.18`, `duration:0.5`, `ease:power2.out`.
3. **Per channel i (stagger 0.5s between channels):**
   - a. Line draw: `fromTo(line, {strokeDashoffset:1, strokeDasharray:1}, {strokeDashoffset:0, duration:0.55, ease:power2.inOut})`.
   - b. Pulse launch: pulse `opacity` 0→1 then travel hub→chip over `0.6s` `ease:power1.in` along sampled points; on complete `opacity`→0.
   - c. Chip arrival: `hcr-chip-bg` border flashes accent→sync; `hcr-tick` draws (`strokeDashoffset` 1→0, `0.3s`) + chip `scale` 1→1.05→1 `back.out(2)`.
   - d. Line settles to idle dim (`opacity` 1→0.35).
4. **Counter:** proxy `{v:0}`→ target (e.g. 247) tween `duration:5.4 ease:power1.out snap:{v:1}`, runs across whole loop, writes `hcr-counter-num`. At loop end it resets to 0 cleanly (start state == 0, so seamless).
5. **Seamless reset beat (last 0.6s):** all chips fade ticks out + lines re-dim to identical frame-0 state via a short `to(...,{...frame0})`; because start state is "nothing synced", the repeat is invisible.

Idle ambient (separate looped tweens, not in master): hub `scale` 1↔1.15 `2s yoyo sine`; each idle line a faint travelling dash (`strokeDashoffset` drift) at low opacity for "live wire" feel.

### (d) Hover
`pointerenter` → `gsap.to(tl,{timeScale:1.7})` AND boost pulse glow (CSS class `.is-hot` adds brighter drop-shadow on `.hcr-pulse`). `pointerleave` → back to `1` and remove class.

### (e) Reduced-motion static
All 5 lines fully drawn at `opacity:0.4`; all chips show green tick + sync border; counter `textContent="247"`; scan bar hidden; rows at rest. No listeners.

### (f) Tokens
Panel/glass per shared recipe. Dashboard rows bars `--color-subtle`; active dot/value `--color-accent`. Lines stroke `--color-accent` while drawing, settle to `--color-border` idle. Pulses fill `--color-accent` with subtle glow. Synced tick + chip success border `--color-sync`. Counter number Plus Jakarta Sans, `--color-text`; label Inter `--color-muted`. Chip names Inter `--color-text`.

### (g) Dimensions / responsive
Intrinsic `720×440`; SVG scales fluidly (`width:100%;height:auto`). `max-width:720px`, centered. Below ~560px container: switch CSS to stack — dashboard on top, chips row below (use a `.is-compact` class toggled by a `ResizeObserver` OR pure CSS container query); choreography unchanged (paths still resolve since coords are viewBox-relative). `aspect-ratio:720/440`.

---

## 2. FEATURES — `calendar-sync.js`

### (a) Concept
A "Real-Time Calendar Sync" mini-UI: one master availability grid, and two small "channel" mini-grids beside it. When a cell is booked on one channel it instantly mirrors (blocks out) on master + the other channel — visualizing **zero double-bookings**. Communicates real-time two-way sync.

### (b) DOM / SVG structure
Can be pure DOM (CSS grid) — cleaner than SVG here. Root `class="calendar-sync glass"`.
```
<div class="cs-wrap">
  <div class="cs-master">
    <div class="cs-head">Master Calendar · June</div>
    <div class="cs-grid">  35 × <span class="cs-cell" data-i="N"></span>  </div>  <!-- 7×5 -->
  </div>
  <div class="cs-link"> <svg> two curved sync arrows (top→ , ←bottom), pathLength=1 </svg> </div>
  <div class="cs-channels">
    <div class="cs-mini" data-ch="airbnb"><div class="cs-mini-head">Airbnb</div><div class="cs-minigrid">…21 cells…</div></div>
    <div class="cs-mini" data-ch="booking"><div class="cs-mini-head">Booking.com</div><div class="cs-minigrid">…21 cells…</div></div>
  </div>
</div>
```
Cell states via class: `.is-free` (subtle bg), `.is-booked` (accent fill), `.is-syncing` (pulsing). A small flying "booking token" `.cs-token` (absolute-positioned dot) animates from a channel cell to the master cell to show propagation.

### (c) GSAP choreography (`tl`, `repeat:-1`, ~5s loop)
Scripted sequence of 3–4 booking events, each:
1. A channel cell pulses (`scale` 1→1.15→1, fill→`--color-accent`, `0.4s back.out`).
2. Sync arrow draws channel→master (`strokeDashoffset` 1→0, `0.4s power2.inOut`); a `.cs-token` flies along it (`x/y` keyframes, `0.5s power1.inOut`, opacity in/out).
3. Master cell flips booked (`scale` pop + class), then mirror arrow draws to the OTHER channel and that twin cell flips booked too — staggered `0.15s`.
4. Brief settle. Next event targets a different cell.
- **Loop reset:** final 0.7s beat fades all booked cells back to free in a quick wave (`stagger:{each:0.02,from:'random'}`, opacity/scale to free state), returning to identical frame-0 empty grid → seamless.
- Ambient: 2–3 random free cells gently breathe (`opacity` 0.6↔1, low-key) to feel live (`repeatRefresh`).

### (d) Hover
`timeScale` →1.6. Optional: hovering pauses the auto-fade and adds a faint grid highlight (CSS).

### (e) Reduced-motion static
Grid shown with a fixed mirrored pattern: ~5 cells booked, the SAME cells booked on both mini-grids, arrows fully drawn at idle opacity, no tokens. Demonstrates the "mirrored" end-state at a glance.

### (f) Tokens
Free cells `--color-subtle` bg, `--color-border` outline. Booked cells `--color-accent` fill (white glyph if any). Syncing pulse + arrows + token `--color-sync` (sync = green = success/mirrored). Heads Inter `--color-muted`. Card glass recipe.

### (g) Dimensions / responsive
Intrinsic ~`640×360`. Master grid ~`280px` wide; minis stack vertically right of it on desktop, move BELOW master on narrow (<600px) via flex-wrap. Cells use `aspect-ratio:1`. `width:100%;max-width:640px`.

---

## 3. PARTNERS — `payout-split.js`

### (a) Concept
"Payout Split": total earnings animate, then visibly divide between Partner A and Partner B via an animated donut (or split bar) while two currency counters tick up to their share. Communicates transparent partner equity / automated payout splits.

### (b) DOM / SVG structure
Root `class="payout-split glass"`, `viewBox="0 0 520 300"`.
```
<svg viewBox="0 0 520 300">
  <!-- donut centered left -->
  <g class="ps-donut" transform="translate(130,150)">
    <circle class="ps-track"  r="78" fill="none" stroke-width="22"/>           <!-- bg ring -->
    <circle class="ps-arc-a"  r="78" fill="none" stroke-width="22" pathLength="1"/>  <!-- Partner A -->
    <circle class="ps-arc-b"  r="78" fill="none" stroke-width="22" pathLength="1"/>  <!-- Partner B, rotated -->
    <text class="ps-total" x="0" y="6">₹0</text>     <!-- center total -->
  </g>
  <!-- legend / counters right -->
  <g class="ps-legend" transform="translate(280,90)">
    <g class="ps-li" data-p="a"> swatch + "Partner A" + <text class="ps-amt-a">₹0</text> + "60%" </g>
    <g class="ps-li" data-p="b" transform="translate(0,90)"> swatch + "Partner B" + <text class="ps-amt-b">₹0</text> + "40%" </g>
  </g>
</svg>
```
Donut split via two `<circle>`s using `stroke-dasharray`/`stroke-dashoffset` on `pathLength=1`: Arc A draws `0→0.6`, Arc B starts rotated by A's share (`transform:rotate`) and draws `0→0.4`. (`stroke-linecap:round`, slight gap between arcs.)

### (c) GSAP choreography (`tl`, `repeat:-1`, ~4.5s loop)
1. **Fill total:** center total counter `{v:0}`→ e.g. 184000, `2.0s power1.out`, formatted `₹1,84,000` (Indian grouping). Simultaneously a thin full ring sweeps in (`ps-track` draw, `1.0s`).
2. **Split reveal:** Arc A draws `dashoffset` to show 60% (`0.8s power3.out`); a beat later Arc B draws its 40% (`0.8s`, starts at +0.2s). Each arc pops slightly on finish (`scale` of the `g` 1→1.03→1).
3. **Counters split:** `ps-amt-a` →110400, `ps-amt-b` →73600 tween in parallel with their arcs (`snap:1`, Indian currency format).
4. **Hold** ~0.8s at full state.
5. **Reset beat (~0.6s):** arcs retract (`dashoffset`→0), counters tween back to 0, total back to ₹0 — quick `power2.in`. Frame-0 == zeroed → seamless loop. (Alternative: keep filled and only re-pulse counters; but retract gives clearer "loop".)
- Ambient: legend swatches subtle `opacity` breathe.

### (d) Hover
`timeScale` →1.6; additionally on hover, pop both arcs slightly (`scale`1→1.04) via a separate quick tween for tactility.

### (e) Reduced-motion static
Donut fully split 60/40, counters at final `₹1,10,400` / `₹73,600`, total `₹1,84,000`. No tweens.

### (f) Tokens
Track ring `--color-border`. Arc A `--color-accent`; Arc B `--color-sync` (two-tone, on-brand). Total + amounts Plus Jakarta Sans `--color-text`; labels/percentages Inter `--color-muted`. Swatch colors match arcs. Glass card.

### (g) Dimensions / responsive
Intrinsic `520×300`. `max-width:520px`. On narrow (<460px): legend moves below donut (CSS flex-column on the wrapper, or `.is-compact` swapping the `<g>` transforms). `width:100%;height:auto`.

---

## 4. OTA CONNECTIVITY — `ota-constellation.js`

### (a) Concept
"50+ OTA Connections" constellation: a central Simplified Management hub with channel chips radiating outward; connecting lines draw in one by one, chips light up on connect, and a "+50" cluster pops to imply the long tail. Communicates breadth of integrations.

### (b) DOM / SVG structure
Root `class="ota-constellation glass"`, `viewBox="0 0 560 480"`. Hub at center `(280,240)`.
```
<svg viewBox="0 0 560 480">
  <g class="oc-lines" fill="none">
    <line class="oc-line" data-i="0" x1="280" y1="240" x2="120" y2="110" pathLength="1"/>
    ... 6 named lines to chip anchors (radial, ~60° apart) ...
  </g>
  <g class="oc-chips">
    <g class="oc-chip" data-i="0" transform="translate(120,110)"> rect 96×34 rx12 + icon dot + label </g>
    ... Airbnb, Booking.com, Agoda, Expedia, StayVista, +  the "+50" node
  </g>
  <g class="oc-plus" transform="translate(440,360)">    <!-- the +50 cluster -->
    <circle class="oc-plus-bg" r="26"/>
    <text class="oc-plus-num" x="0" y="5">+50</text>
  </g>
  <g class="oc-hub" transform="translate(280,240)">
    <circle class="oc-hub-ring" r="40"/>
    <circle class="oc-hub-core" r="26"/>
    <text class="oc-hub-label" y="5">SM</text>   <!-- or small logo glyph -->
  </g>
</svg>
```
Chip anchors arranged radially (≈ -150°,-90°,-30°,30°,90°,150°) at radius ~170.

### (c) GSAP choreography (`tl`, `repeat:-1`, ~5s loop)
1. **Hub entrance/idle:** `oc-hub-ring` continuous expanding pulse (`scale`1→1.4, `opacity`0.5→0, `1.8s ease:none repeat:-1`) — sonar effect; core gentle breathe.
2. **Connect each chip (stagger 0.35s):**
   - a. Line draws hub→chip (`strokeDashoffset`1→0, `0.45s power2.out`).
   - b. Chip pops in (`scale`0.8→1, `opacity`0→1, `back.out(1.7)`); icon dot flashes `--color-accent`→`--color-sync`.
   - c. Tiny pulse travels the line outward (optional reuse of hero pulse technique).
3. **"+50" cluster:** after the 6 named chips, `oc-plus` pops (`scale`0→1 `back.out(2)`) and its number does a quick `{v:0}`→50 count (`0.5s`), with 2–3 faint extra short lines fanning out behind it to imply more.
4. **Hold** ~0.8s fully connected.
5. **Reset beat (~0.7s):** lines retract (`strokeDashoffset`→1, stagger) + chips fade/scale to frame-0 (hidden) → loop seamless. Hub sonar keeps running across reset.
- Ambient: each connected line carries a slow travelling dash (low opacity) = "live data".

### (d) Hover
`timeScale` →1.7; hub sonar brightens (CSS `.is-hot`).

### (e) Reduced-motion static
All 6 lines drawn, all chips visible + synced color, "+50" shown at `50`, hub ring at rest (no sonar). Full constellation, static.

### (f) Tokens
Lines `--color-border` idle / `--color-accent` while drawing. Hub ring `--color-accent` (low opacity sonar), core `--color-accent` solid, label white. Chips: glass mini-bg, name Inter `--color-text`, icon dot accent→`--color-sync` on connect. "+50" bg `--color-accent`, number white Plus Jakarta Sans. Card glass.

### (g) Dimensions / responsive
Intrinsic `560×480` (taller, near-square). `max-width:560px`. Radial layout scales with viewBox so it stays intact down to small sizes; on very narrow, reduce font via CSS clamp. `width:100%;height:auto; aspect-ratio:560/480`.

---

## Build checklist (per component)
- [ ] File + colocated CSS, `import './<name>.css'`.
- [ ] `init<Name>(root)` builds markup once, returns `cleanup`.
- [ ] `prefersReduced()` branch sets full final state, no listeners, still returns cleanup.
- [ ] Single `repeat:-1` master timeline; frame-0 state === post-reset state (seamless).
- [ ] Only transform/opacity/dash animated; `will-change` on moving nodes only.
- [ ] Counters via proxy `{v}` + `onUpdate` + `snap`; Indian currency grouping where shown.
- [ ] Hover `timeScale` accelerate + restore; listeners removed in cleanup.
- [ ] Tokens via CSS vars only; fonts Inter / Plus Jakarta Sans.
- [ ] `width:100%;height:auto` + `aspect-ratio`; compact/stacked variant for narrow widths.
- [ ] `tl.kill()` + `gsap.killTweensOf` + `innerHTML=''` on cleanup.
