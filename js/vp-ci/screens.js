// ══════════════════════════════════════════════════════════════════════
// vp-ci/screens.js — a Circle episode on screen (Plan 5)
// ══════════════════════════════════════════════════════════════════════
//
// One screen per aired scene (vp-ci/steps.js): the stage (vp-ci/stage.js),
// the controls, and the script under it lighting up a line at a time — the
// same lines the text backlog prints (js/ci/transcript.js), so the screen and
// the backlog never say different things.
//
// ONE CLICK IS ONE LINE (spec 18.3): Next, a click on the stage, or Auto,
// which plays the screen on its own at a reading pace and rolls on to the
// next screen at its end, the way a programme cuts to its next segment.
//
// THE REVEAL PATCHES THE SCREEN IT IS ON. `renderVPScreen` rebuilds the page
// on every navigation; a screen the page has just drawn is at rest (no
// `data-idx` yet), whatever it was last time.
import { circleScreens } from './steps.js';
import { withTeasers } from './teasers.js';
import { TEASER_CSS } from './teaser-stage.js';
import { VISIT_CSS } from './visit-stage.js';
import { webScreen, WEB_CSS } from './web-stage.js';
import { VOTE_CSS } from './vote-stage.js';
import { circleDebugScreen } from './debug.js';
import { stageInner, paintStage } from './stage.js';
import { CIV_CSS, CIV_FONTS } from './style.js';
import { bedFor, playStep } from './sound.js';
import { sidebarHtml } from './sidebar.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const reg = () => (typeof window !== 'undefined' ? (window._civ ||= {}) : {});
const LOGO = '<svg viewBox="0 0 58 58"><defs><linearGradient id="civLg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff4fb4"/><stop offset=".5" stop-color="#8b5cff"/><stop offset="1" stop-color="#3fd8ff"/></linearGradient></defs><circle cx="29" cy="29" r="23" fill="none" stroke="url(#civLg)" stroke-width="7"/><circle cx="29" cy="6" r="3.2" fill="#fff"/></svg>';
const PART = { say: 'ALOUD', react: 'REACTS', send: 'SENT', post: 'POSTED', video: 'VIDEO', host: 'THE CIRCLE', stage: '' };

function scriptHtml(row, screen) {
  const nameOf = h => row.ci.profiles?.[h]?.name || String(h || '').replace(/^@/, '');
  return screen.steps.map((st, i) => {
    const k = st.clip ? (st.clip.aloud ? 'ALOUD' : 'SENT') : st.host ? 'THE CIRCLE' : PART[st.part] || '';
    const who = st.who ? `<b>${esc(nameOf(st.who))}</b> ` : st.clip ? `<b>${esc(st.clip.real)}</b> ` : '';
    return `<p class="civ-ln ${esc(st.part)}" data-s="${i}" data-text="${esc(st.text)}">${k ? `<span class="k">${k}</span>` : ''}${who}${esc(st.text)}</p>`;
  }).join('');
}

/** `prev` / `next`: the neighbouring episodes, for Previously and Next time (teasers.js). */
export function circleVpScreens(row, { prev = null, next = null, debug = false } = {}) {
  const screens = withTeasers(row, circleScreens(row), { prev, next, screensOf: circleScreens });
  // The last screen of the episode (before Debug): the Circle web.
  const web = webScreen(row, prev);
  if (web) screens.push(web);
  if (!screens.length) {
    return [{ id: 'ci-empty', label: 'The day', html: `<style>${CIV_FONTS}${CIV_CSS}</style><div class="civ"><div class="civ-top"><div class="civ-logo">${LOGO}<div>THE CIRCLE<small>Episode ${esc(row.num)} · Day ${esc(row.day)}</small></div></div></div><p class="civ-ln vis">A quiet day in The Circle.</p></div>` }];
  }
  if (typeof document !== 'undefined') queueMicrotask?.(() => applyTv(tvOn()));
  const out = screens.map((screen, si) => {
    const uid = `ci${esc(row.num)}-${si}`;
    reg()[uid] = { row: screen.rowView || row, screen, idx: -1, auto: false, screens, si };
    return {
      // ci-<kind>-<n>: the player files it by kind (vp-ui.js _ciPhaseForScreen).
      id: `ci-${screen.kind}-${si}`,
      label: screen.title,
      // The root carries the scene's music bed (vp-ui.js reads data-ambient
      // off the first element after its stage cue, so the style goes inside).
      html: `<div class="civ" data-uid="${uid}" data-ambient="${bedFor(screen)}"><style>${CIV_FONTS}${CIV_CSS}${TEASER_CSS}${VISIT_CSS}${WEB_CSS}${VOTE_CSS}</style>
  <div class="civ-top"><div class="civ-logo">${LOGO}<div>THE CIRCLE<small>Episode ${esc(row.num)} · Day ${esc(row.day)}</small></div></div>
    <div class="civ-title">${esc(screen.title)}</div></div>
  <div class="civ-stagewrap"><div class="civ-stage" id="civ-st-${uid}" onclick="civNext('${uid}')" title="Click for the next line">${stageInner(screen.rowView || row, screen, -1)}</div>
</div>
  <div class="civ-controls">
    <button type="button" class="civ-btn" onclick="civReset('${uid}')">Restart</button>
    <button type="button" class="civ-btn main civ-nextbtn" onclick="civNext('${uid}')" title="Next line: or click the picture, or press space / →">Next ▶</button>
    <button type="button" class="civ-btn" id="civ-auto-${uid}" onclick="civAuto('${uid}')">Auto</button>
    <button type="button" class="civ-btn" onclick="civAll('${uid}')">Reveal all</button>
    <span class="civ-count" id="civ-count-${uid}">0 / ${screen.steps.length}</span>
    <button type="button" class="civ-btn civ-tvbtn" onclick="civTv()" title="Fullscreen: just the picture (space / → / click for the next line, Esc to leave)">${TV_ICON} <span class="civ-tvOn">TV mode</span><span class="civ-tvOff">Exit TV mode</span></button>
  </div>
  <div class="civ-under"><div class="civ-script" id="civ-script-${uid}">${scriptHtml(row, screen)}</div>
    <aside class="civ-side" id="civ-side-${uid}">${sidebarHtml(row, screens, si, -1)}</aside></div>
</div>`,
    };
  });
  // The engine's numbers, last of all, behind the vp_debug switch (debug.js).
  if (debug) out.push(circleDebugScreen(row));
  return out;
}

// ── TV mode: just the picture, as big as the window ───────────────────
// User: "do a fullscreen button like Perfect Match". The same switch as
// vp-pm's TV mode: a class on the PLAYER (#visual-player), which survives
// every screen change, plus the browser's real fullscreen on it. Remembered
// per viewer; leaving fullscreen with Esc leaves TV mode too.
const TV_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" style="vertical-align:-2px"><rect x="2" y="4" width="20" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2"/></svg>';
function tvOn() { try { return localStorage.getItem('ci-tv') === '1'; } catch { return false; } }
function applyTv(on) {
  if (typeof document === 'undefined') return;
  document.getElementById('visual-player')?.classList.toggle('ci-tv', !!on);
}
export function civTv() {
  const on = !tvOn();
  try { localStorage.setItem('ci-tv', on ? '1' : '0'); } catch { /* per-viewer convenience only */ }
  applyTv(on);
  const player = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  try {
    if (on && player?.requestFullscreen && !document.fullscreenElement) player.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch { /* fullscreen refused (an iframe, a phone): the bigger stage still applies */ }
}
if (typeof document !== 'undefined' && !globalThis.__civTv) {
  globalThis.__civTv = true;
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && tvOn() && document.getElementById('visual-player')?.classList.contains('ci-tv')) {
      try { localStorage.setItem('ci-tv', '0'); } catch { /* fine */ }
      applyTv(false);
    }
  });
}

// ── the reveal ─────────────────────────────────────────────────────────
function sync(uid) {
  const S = reg()[uid];
  const root = typeof document !== 'undefined' ? document.querySelector(`.civ[data-uid="${uid}"]`) : null;
  if (S && root && root.dataset.idx == null) { S.idx = -1; stopAuto(S); }
  return S;
}
function paint(uid, fresh) {
  const S = reg()[uid];
  if (!S || typeof document === 'undefined') return;
  const root = document.querySelector(`.civ[data-uid="${uid}"]`);
  if (root) root.dataset.idx = String(S.idx);
  paintStage(document.getElementById(`civ-st-${uid}`), S.row, S.screen, S.idx, fresh);
  const script = document.getElementById(`civ-script-${uid}`);
  script?.querySelectorAll('[data-s]').forEach(el => el.classList.toggle('vis', Number(el.dataset.s) <= S.idx));
  const side = document.getElementById(`civ-side-${uid}`);
  if (side && S.screens) side.innerHTML = sidebarHtml(S.row, S.screens, S.si, S.idx);
  const count = document.getElementById(`civ-count-${uid}`);
  if (count) count.textContent = `${Math.max(0, S.idx + 1)} / ${S.screen.steps.length}`;
  if (fresh) playStep(S.screen, S.idx);
  // The new line is brought into view INSIDE the script box only. This was
  // scrollIntoView, which also scrolls every ancestor: the page jumped down to
  // the script on every click (user: "the screen always scrolls down").
  if (fresh && script) {
    const ln = script.querySelector(`[data-s="${S.idx}"]`);
    if (ln) {
      const top = ln.offsetTop - script.offsetTop, bottom = top + ln.offsetHeight;
      if (bottom > script.scrollTop + script.clientHeight) script.scrollTop = bottom - script.clientHeight + 6;
      else if (top < script.scrollTop) script.scrollTop = Math.max(0, top - 6);
    }
  }
}
export function civNext(uid) {
  const S = sync(uid);
  if (!S) return;
  if (S.idx >= S.screen.steps.length - 1) {
    const wasAuto = S.auto;
    stopAuto(S);
    if (typeof window !== 'undefined' && typeof window.vpNext === 'function') {
      window.vpNext();
      // Auto carries on into the next screen once the player has drawn it.
      if (wasAuto) setTimeout(() => { const next = document.querySelector('.civ[data-uid]'); if (next && next.dataset.uid !== uid) civAuto(next.dataset.uid); }, 700);
    }
    return;
  }
  S.idx++;
  paint(uid, true);
}
export function civAll(uid) { const S = sync(uid); if (!S) return; stopAuto(S); S.idx = S.screen.steps.length - 1; paint(uid, false); }
export function civReset(uid) { const S = sync(uid); if (!S) return; stopAuto(S); S.idx = -1; paint(uid, false); }

// ── Auto: the screen plays itself at a reading pace ──────────────────
// A line holds long enough to read; a sent message longer, for the dictation
// to type and fire.
export const holdFor = st => Math.min(9000, 1500 + String(st?.text || '').length * 42 + (st?.part === 'send' ? 1600 : 0));
function stopAuto(S) {
  if (S?.timer) clearTimeout(S.timer);
  if (S) { S.timer = null; S.auto = false; }
  const b = typeof document !== 'undefined' ? document.getElementById(`civ-auto-${Object.keys(reg()).find(k => reg()[k] === S)}`) : null;
  b?.classList.remove('on');
}
export function civAuto(uid) {
  const S = sync(uid);
  if (!S) return;
  if (S.auto) { stopAuto(S); return; }
  S.auto = true;
  document.getElementById(`civ-auto-${uid}`)?.classList.add('on');
  const tick = () => {
    if (!S.auto || !document.querySelector(`.civ[data-uid="${uid}"]`)) return;
    civNext(uid);
    if (S.auto) S.timer = setTimeout(tick, holdFor(S.screen.steps[S.idx]));
  };
  tick();
}

if (typeof window !== 'undefined') Object.assign(window, { civNext, civAll, civReset, civAuto, civTv });

// The web's tabs (web-stage.js): a tab or a person re-draws the screen where
// it stands; it is not the next line.
if (typeof document !== 'undefined' && !globalThis.__civWeb) {
  globalThis.__civWeb = true;
  const redraw = (el, set) => {
    const root = el.closest('.civ[data-uid]');
    const S = root && reg()[root.dataset.uid];
    if (!S) return;
    set(S.screen);
    paint(root.dataset.uid, false);
  };
  document.addEventListener('click', e => {
    const t = e.target?.closest?.('[data-webtab]');
    if (!t) return;
    e.stopPropagation();
    redraw(t, sc => { sc.tab = t.dataset.webtab; });
  }, true);
  document.addEventListener('change', e => {
    const s = e.target?.closest?.('[data-webwho]');
    if (!s) return;
    redraw(s, sc => { sc.tab = 'person'; sc.who1 = s.value; });
  });
}

// The keyboard: space or the right arrow is the next line on whatever Circle
// screen is showing (never while typing in a field).
if (typeof document !== 'undefined' && !globalThis.__civKeys) {
  globalThis.__civKeys = true;
  document.addEventListener('keydown', e => {
    if (e.key !== ' ' && e.key !== 'ArrowRight') return;
    if (e.target?.closest?.('input,textarea,select,[contenteditable]')) return;
    const root = document.querySelector('.civ[data-uid]');
    if (!root || !root.offsetParent) return;
    e.preventDefault();
    civNext(root.dataset.uid);
  });
}
