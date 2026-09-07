// ══════════════════════════════════════════════════════════════════════
// vp-dr/reveal.js — click-to-reveal, patched into the DOM and nowhere else
// ══════════════════════════════════════════════════════════════════════
//
// Every viewing party in this repo has had a version of this file, and the
// ones that got it wrong got it wrong the same two ways:
//
//   1. THEY REBUILT THE PAGE ON EVERY CLICK. The screen flashed back to the
//      top, the reader lost their place, and any <input> or scroll position
//      on the screen was thrown away. Nothing here rebuilds: a reveal toggles
//      a class on an element found by id.
//
//   2. THEY PATCHED ONLY THE NEWEST STEP. That works right up until the
//      viewer switches tabs — `renderVPScreen` repaints the whole screen, so
//      every element the earlier clicks touched is gone, and the screen comes
//      back showing one card. `_reapplyVisibility` loops 0→idx over the FRESH
//      DOM every time, which is why it is cheap to call and safe to call
//      twice.
//
// State lives on `window._tvState`, keyed by EPISODE as well as by screen —
// `renderVPScreen` wipes and repaints, and reveal state that is not keyed by
// episode number leaks from the episode you just watched into the one you
// are replaying.

/** The reveal state for one screen of one episode. `idx` is the last step shown. */
export function _state(ep, suffix) {
  if (!window._tvState) window._tvState = {};
  const key = `dr:${ep?.num ?? 0}:${suffix}`;
  if (!window._tvState[key]) window._tvState[key] = { idx: -1 };
  return window._tvState[key];
}

/**
 * The sticky bar at the bottom of every screen.
 *
 * The ids matter more than the markup: `_reapplyVisibility` finds the counter
 * and the controls by them, so a screen that renames one silently stops
 * counting. They are built from `suffix` in both places and never typed twice.
 */
export function _controls(suffix, total, epNum) {
  const s = String(suffix);
  return `<div class="dr-controls" id="dr-controls-${s}">
    <button type="button" class="dr-btn dr-ghost" onclick="drRevealAll('${s}', ${total}, ${epNum})">Reveal all</button>
    <button type="button" class="dr-btn" onclick="drRevealNext('${s}', ${total}, ${epNum})">Next &rsaquo;</button>
    <span class="dr-counter" id="dr-counter-${s}">0 / ${total}</span>
  </div>`;
}

/**
 * Show steps 0..upToIdx and hide the rest, from whatever the DOM currently is.
 *
 * Deliberately does the whole range rather than the difference. See note 2 at
 * the top: the cheap version is the one that breaks on a tab switch.
 */
export function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i < total; i++) {
    const el = document.getElementById(`dr-step-${suffix}-${i}`);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('dr-vis');
    else el.classList.remove('dr-vis');
  }
  const counter = document.getElementById(`dr-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  const controls = document.getElementById(`dr-controls-${suffix}`);
  if (controls) controls.classList.toggle('dr-done', upToIdx >= total - 1);
  const newest = document.getElementById(`dr-step-${suffix}-${upToIdx}`);
  if (newest && newest.scrollIntoView) {
    // jsdom has no layout and throws here; a failed scroll must never take
    // the reveal down with it.
    try { newest.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { /* jsdom */ }
  }
}

/**
 * Swap the sidebar's contents for the panel belonging to the current step.
 *
 * GATED, NOT HIDDEN. `window._drSidebar[suffix]` is an array with one entry
 * per step, and this puts exactly the current one in the DOM — a panel that
 * belongs to a later step is not on the page at all, so "view source" cannot
 * spoil the call the viewer has not clicked to yet.
 *
 * Silent when there is no mount: not every screen has a sidebar, and a screen
 * without one is not an error.
 */
export function _updateSidebar(suffix, epNum) {
  const host = document.getElementById('dr-sidebar-inner');
  if (!host) return;
  const panels = (window._drSidebar || {})[suffix];
  if (!Array.isArray(panels) || !panels.length) return;
  const { idx } = _state({ num: epNum }, suffix);
  const at = Math.max(0, Math.min(idx, panels.length - 1));
  host.innerHTML = panels[at] ?? '';
}

/** One more step. */
export function drRevealNext(suffix, total, epNum) {
  const st = _state({ num: epNum }, suffix);
  if (st.idx >= total - 1) return;
  st.idx += 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateSidebar(suffix, epNum);
}

/** All of it, for a viewer who does not want to click through. */
export function drRevealAll(suffix, total, epNum) {
  const st = _state({ num: epNum }, suffix);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateSidebar(suffix, epNum);
}

/**
 * Put the screen back the way the viewer left it.
 *
 * Called after a screen paints. Without it a tab switch shows a fully-built
 * screen with every step hidden, because the markup ships hidden and the
 * classes that revealed them were on elements that no longer exist.
 */
export function _restore(suffix, total, epNum) {
  const { idx } = _state({ num: epNum }, suffix);
  if (idx < 0) return;
  _reapplyVisibility(suffix, idx, total);
  _updateSidebar(suffix, epNum);
}
