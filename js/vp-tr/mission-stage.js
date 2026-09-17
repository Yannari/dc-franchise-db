// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-stage.js — the shared stage a bespoke mission plays on
// ══════════════════════════════════════════════════════════════════════
//
// The Funeral proved the shape (mockup/mockup-tr-funeral.html, at the Drag
// Race level): a full-width scene above the cards that plays each reveal in
// TWO BEATS — the suspense (a heartbeat vignette, spotlights, something
// trembling) and, a second or so later, the answer (a flash, a stamp, a thing
// moving). Reveal all and a fresh mount land straight on the end state.
//
// WHAT LIVES HERE is everything that is the same on every mission: the frame,
// the caption, the pot readout, the vignette/grain/flash/rays layers, the
// particle bursts, the slammed stamp, and the timer bookkeeping that lets a
// step be interrupted by the next click. WHAT DOES NOT is the scene itself —
// the loch, the board, the pews — because that is the whole point of a
// bespoke mission having its own screen.
//
// A theme opts in with `stage(v, states, n)` and paints in `paintSide(...,
// mode)`, where mode is 'next' (play), 'all' or 'mount' (settle). See
// js/vp-tr/mission-theme-beacon-lighting.js for the smallest real use.
export const STAGE_CSS = `
@property --ms-spin{syntax:'<angle>';inherits:false;initial-value:0deg}
.ms{position:sticky;top:54px;z-index:20;margin:22px 0 0;height:360px;border-radius:18px;overflow:hidden;isolation:isolate;
  background:#07070a;box-shadow:0 30px 80px -30px rgba(0,0,0,.95),inset 0 0 0 1px rgba(255,255,255,.08)}
.ms svg.ms-scene{position:absolute;inset:0;width:100%;height:100%}
.ms-layer{position:absolute;inset:0;pointer-events:none}
.ms-vig{box-shadow:inset 0 0 140px 50px rgba(0,0,0,.85);opacity:.7;transition:opacity .6s}
.ms-grain{opacity:.06;background-image:repeating-radial-gradient(circle at 23% 31%,#fff 0 1px,transparent 1px 3px);mix-blend-mode:overlay}
.ms-flash{opacity:0;background:radial-gradient(circle at var(--ms-fx,50%) var(--ms-fy,45%),#fff,rgba(255,240,210,.7) 22%,transparent 64%)}
.ms-flash.go{animation:ms-flash 1.2s ease-out}
@keyframes ms-flash{0%{opacity:0}10%{opacity:1}100%{opacity:0}}
.ms-rays{opacity:0;background:repeating-conic-gradient(from var(--ms-spin) at 50% 30%,rgba(255,220,140,.32) 0 6deg,transparent 6deg 18deg);
  -webkit-mask:radial-gradient(circle at 50% 30%,#000 0,#000 12%,transparent 55%);mask:radial-gradient(circle at 50% 30%,#000 0,#000 12%,transparent 55%);transition:opacity .6s}
.ms[data-phase=win] .ms-rays{opacity:1;animation:ms-spin 9s linear infinite}
@keyframes ms-spin{to{--ms-spin:360deg}}
.ms[data-phase=hold] .ms-vig,.ms[data-phase=ask] .ms-vig{opacity:1;animation:ms-heart 1s ease-in-out infinite}
@keyframes ms-heart{0%,100%{box-shadow:inset 0 0 140px 50px rgba(0,0,0,.85)}14%{box-shadow:inset 0 0 190px 90px rgba(0,0,0,.97)}28%{box-shadow:inset 0 0 140px 50px rgba(0,0,0,.85)}42%{box-shadow:inset 0 0 170px 70px rgba(0,0,0,.93)}}
.ms-cap{position:absolute;left:18px;top:14px;z-index:6;font:11px/1 var(--ms-mono,monospace);letter-spacing:.24em;text-transform:uppercase;color:var(--ms-accent,#e2c47e)}
.ms-cap b{display:block;margin-top:6px;font:400 30px/1 var(--cv-display,serif);letter-spacing:.04em;color:var(--ms-ink,#f4f1e8);text-transform:none}
.ms-pot{position:absolute;right:18px;top:14px;z-index:6;text-align:right;font:11px/1 var(--ms-mono,monospace);letter-spacing:.2em;text-transform:uppercase;color:#8a8690}
.ms-pot b{display:block;margin-top:6px;font:600 26px/1 var(--ms-mono,monospace);letter-spacing:0;color:var(--ms-accent,#e2c47e)}
.ms-pot b.tick{animation:ms-tick .8s ease-out}
@keyframes ms-tick{0%{transform:scale(1.5);color:#fff}100%{transform:scale(1)}}
.ms-stamp{position:absolute;z-index:7;left:50%;top:84%;padding:8px 18px;border:4px solid currentColor;border-radius:8px;white-space:nowrap;
  font:400 28px/1 var(--cv-display,serif);letter-spacing:.12em;background:rgba(6,6,10,.86);opacity:0;
  transform:translate(-50%,-50%) rotate(-4deg) scale(3);pointer-events:none}
.ms-stamp.go{animation:ms-slam .45s cubic-bezier(.2,1.6,.4,1) forwards}
@keyframes ms-slam{0%{opacity:0;transform:translate(-50%,-50%) rotate(-4deg) scale(3)}100%{opacity:1;transform:translate(-50%,-50%) rotate(-4deg) scale(1)}}
.ms-stamp.good{color:#b8f07a}.ms-stamp.bad{color:#ff5f75}.ms-stamp.gold{color:#efcb5f}.ms-stamp.cool{color:#9fd8ff}
.ms-bits i{position:absolute;display:block;opacity:0;width:var(--w);height:var(--w);border-radius:50%;background:var(--c,rgba(255,240,210,.85))}
.ms-bits.go i{animation:ms-burst var(--t) cubic-bezier(.1,.7,.3,1) var(--dl) forwards}
@keyframes ms-burst{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--x),var(--y))}}
.ms-fall i{position:absolute;display:block;top:-20px;opacity:0;width:var(--w);height:calc(var(--w) * .6);border-radius:60% 40% 60% 40%;background:var(--c,#f4f1e8)}
.ms-fall.go i{animation:ms-fall var(--t) linear var(--dl) forwards}
@keyframes ms-fall{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:1}100%{opacity:0;transform:translate(var(--x),420px) rotate(540deg)}}
@media(max-width:700px){.ms{height:240px}.ms-cap b{font-size:22px}.ms-stamp{font-size:20px}}
@media(prefers-reduced-motion:reduce){.ms *,.ms{animation:none !important;transition:none !important}}
`;

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const _gbp = n => '£' + Number(n || 0).toLocaleString('en-GB');

/**
 * The stage's markup: the scene, the layers over it, the caption and the pot.
 * `scene` is the theme's own SVG innards; `defs` its own <defs>.
 */
export function stageShell({ epNum, scene, defs = '', cap = ['', ''], potLabel = 'In the pot',
  pot = 0, vars = '', viewBox = '0 0 1080 360', label = 'The mission, staged' }) {
  return '<section class="ms" id="ms-' + epNum + '" data-scene="a" data-phase="rest"'
    + (vars ? ' style="' + vars + '"' : '') + ' aria-label="' + _esc(label) + '">'
    + '<svg class="ms-scene" viewBox="' + viewBox + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
    + (defs ? '<defs>' + defs + '</defs>' : '') + scene + '</svg>'
    + '<div class="ms-layer ms-rays"></div><div class="ms-layer ms-bits"></div><div class="ms-layer ms-fall"></div>'
    + '<div class="ms-layer ms-flash"></div><div class="ms-layer ms-vig"></div><div class="ms-layer ms-grain"></div>'
    + '<div class="ms-cap"><span class="ms-cap-k">' + _esc(cap[0]) + '</span><b class="ms-cap-t">' + _esc(cap[1]) + '</b></div>'
    + '<div class="ms-pot">' + _esc(potLabel) + '<b class="ms-potv">' + _gbp(pot) + '</b></div>'
    + '<div class="ms-stamp"></div></section>';
}

const TIMERS = {};

/** A tiny painter bound to one episode's stage. Returns null when it is not up. */
export function stageFor(epNum) {
  const root = typeof document === 'undefined' ? null : document.getElementById('ms-' + epNum);
  if (!root) return null;
  const key = 'ms-' + epNum;
  const q = sel => root.querySelector(sel);
  const qa = sel => Array.from(root.querySelectorAll(sel));
  const restart = (el, cls) => { if (el) { el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); } };
  const spread = (n, seed) => {
    let s = seed; const out = [];
    for (let i = 0; i < n; i++) {
      s = (s * 16807) % 2147483647; const a = s / 2147483647;
      s = (s * 16807) % 2147483647; out.push([a, s / 2147483647]);
    }
    return out;
  };
  return {
    root, q, qa,
    /** Stop everything this stage had queued. Always called before a new step. */
    clear() { (TIMERS[key] || []).forEach(clearTimeout); TIMERS[key] = []; },
    later(fn, ms) { (TIMERS[key] = TIMERS[key] || []).push(setTimeout(fn, ms)); },
    phase(p) { root.dataset.phase = p; },
    scene(s) { root.dataset.scene = s; },
    cap(k, t) {
      const a = q('.ms-cap-k'), b = q('.ms-cap-t');
      if (a && k != null) a.textContent = k;
      if (b && t != null) b.textContent = t;
    },
    pot(v, tick) { const b = q('.ms-potv'); if (!b) return; b.textContent = _gbp(v); if (tick) restart(b, 'tick'); },
    stamp(text, cls) {
      const s = q('.ms-stamp'); if (!s) return;
      s.textContent = text; s.className = 'ms-stamp ' + (cls || ''); void s.offsetWidth; s.classList.add('go');
    },
    clearStamp() { const s = q('.ms-stamp'); if (s) s.className = 'ms-stamp'; },
    flash(x = '50%', y = '45%', colour) {
      const f = q('.ms-flash'); if (!f) return;
      if (colour) f.style.background = 'radial-gradient(circle at ' + x + ' ' + y + ',#fff,' + colour + ' 24%,transparent 66%)';
      f.style.setProperty('--ms-fx', x); f.style.setProperty('--ms-fy', y);
      restart(f, 'go');
    },
    /** A burst of particles at a point, in stage percentages. */
    burst(n, cx, cy, px, colour) {
      const host = q('.ms-bits'); if (!host) return;
      host.innerHTML = spread(n, 11 + Math.round(cx)).map(r =>
        '<i style="left:' + cx + '%;top:' + cy + '%;--w:' + (3 + r[0] * 6) + 'px;--x:' + ((r[0] - 0.5) * px)
        + 'px;--y:' + ((r[1] - 0.8) * px) + 'px;--t:' + (0.8 + r[1]) + 's;--dl:' + (r[0] * 0.2) + 's'
        + (colour ? ';--c:' + colour : '') + '"></i>').join('');
      restart(host, 'go');
    },
    /** Something falling across the whole stage: ash, petals, snow. */
    fall(n, colour) {
      const host = q('.ms-fall'); if (!host) return;
      host.innerHTML = spread(n, 5).map(r =>
        '<i style="left:' + (r[0] * 100) + '%;--w:' + (5 + r[1] * 8) + 'px;--x:' + ((r[1] - 0.5) * 160)
        + 'px;--t:' + (3 + r[0] * 3) + 's;--dl:' + (r[1] * 2) + 's' + (colour ? ';--c:' + colour : '') + '"></i>').join('');
      restart(host, 'go');
    },
    restart,
  };
}

/** Whether the viewer asked for no motion. A staged theme settles instead. */
export function reducedMotion() {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The cards in order, with the theme's own kind attached — the step model. */
export function stageEvents(v, kindOf) {
  const out = [];
  for (const p of v.phases) {
    for (const c of p.cards) {
      out.push({ k: kindOf(c, p), phase: p.id, who: [...(c.who || [])], text: c.text, relic: !!c.relic });
    }
  }
  return out;
}
