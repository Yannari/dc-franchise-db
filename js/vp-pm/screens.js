// ══════════════════════════════════════════════════════════════════════
// vp-pm/screens.js — the villa's viewing party (Plan 5)
// ══════════════════════════════════════════════════════════════════════
//
// An episode as a dozen-plus screens (vp-pm/steps.js), each one the stage
// pinned above its script, the Heart Map beside it, and the controls at the
// bottom. Behind the wrench, a Debug screen with the engine's numbers: the
// public's approval and fame, feelings, and the romance and friendship grids
// (the user: public mood "should be in debug … but the relationship should be
// seen").
//
// THE REVEAL PATCHES THE SCREEN IT IS ON. `renderVPScreen` rebuilds the page
// on every navigation and clears `_tvState`, so a screen always opens at rest;
// a click repaints the stage (whole state), shows the lines up to it, and
// redraws the sidebar. Nothing rebuilds the page.
import { episodeScreens } from './steps.js';
import { stageHtml, paintStage, mini, IC } from './stage.js';
import { asideHtml } from './heart.js';
import { PMV_CSS, PMV_FONTS } from './style.js';
import { momentTitle } from '../pm/transcript.js';
import { clickSound, voicesOn, pmVoices } from './sound.js';
export { pmVoices };

const P = c => `pmv-${c}`;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const reg = () => (typeof window !== 'undefined' ? (window._pmv ||= {}) : {});

function themeAttr() {
  try {
    const t = localStorage.getItem('pm-theme');
    if (t === 'dark' || t === 'light') return t;
  } catch { /* per-viewer convenience only */ }
  const site = typeof document !== 'undefined' ? document.documentElement.dataset.theme : null;
  return site === 'dark' || site === 'light' ? site : '';
}
const themeBtn = t => (t === 'dark' ? `${IC.sun} Light` : `${IC.moon} Dark`);
// The talking blips' own switch (mute and volume are the simulator header's,
// js/audio.js): the speaker is crossed out when the voices are off.
const SPEAKER = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="pmv-waves" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="pmv-cross" d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const soundCtl = () => `<span class="pmv-sound"><button type="button" class="pmv-themeBtn pmv-soundBtn${voicesOn() ? '' : ' pmv-muted'}" onclick="pmVoices()" title="The islanders' talking blips on / off (mute and volume are in the header)">${SPEAKER} Voices</button></span>`;

// ── TV mode: no cards, no sidebar, the stage as big as the window ─────
// (user: "the fullscreen option to not have cards and just a bigger screen").
// Remembered per viewer, and asked of the browser as real fullscreen on the
// player — the one element that survives a screen change, so moving on to
// the next screen does not drop out of it.
function tvOn() { try { return localStorage.getItem('pm-tv') === '1'; } catch { return false; } }
const TV_ICON = '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="2" y="4" width="20" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2"/></svg>';
// Both labels drawn; the player's class says which shows (a screen's HTML is built before any toggle).
const tvBtn = () => `${TV_ICON} <span class="pmv-tvOn">TV mode</span><span class="pmv-tvOff">Exit TV mode</span>`;
function applyTv(on) {
  if (typeof document === 'undefined') return;
  const player = document.getElementById('visual-player');
  player?.classList.toggle('pm-tv', on);
}
export function pmTv() {
  const on = !tvOn();
  try { localStorage.setItem('pm-tv', on ? '1' : '0'); } catch { /* per-viewer convenience only */ }
  applyTv(on);
  const player = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  try {
    if (on && player?.requestFullscreen && !document.fullscreenElement) player.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch { /* fullscreen refused (an iframe, a phone): the bigger stage still applies */ }
}
// In TV mode the keyboard drives it: space or the right arrow is the next
// line, and the last line of a screen rolls on to the next screen.
if (typeof document !== 'undefined' && !globalThis.__pmTvKeys) {
  globalThis.__pmTvKeys = true;
  document.addEventListener('keydown', e => {
    if (!tvOn() || e.target?.closest?.('input,textarea,select')) return;
    const root = document.querySelector('.pmv[data-uid]');
    if (!root) return;
    if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); pmRevealNext(root.dataset.uid); }
  });
  // …and a click on the picture is the next line too, as on a remote.
  document.addEventListener('click', e => {
    if (!tvOn() || !e.target?.closest?.('.pm-tv .pmv-stage')) return;
    const uid = e.target.closest('.pmv')?.dataset.uid;
    if (uid) pmRevealNext(uid);
  });
  document.addEventListener('fullscreenchange', () => {
    // Leaving fullscreen with Esc leaves TV mode too: one switch, one state.
    if (!document.fullscreenElement && tvOn() && document.getElementById('visual-player')?.classList.contains('pm-tv')) {
      try { localStorage.setItem('pm-tv', '0'); } catch { /* fine */ }
      applyTv(false);
    }
  });
}

// ── the ident: every screen opens like a segment of the show ──────────
// The logo sting, then where and when we are — the cut a real edit makes
// between parts of the night, instead of a page simply changing.
const PLACE = { morning: 'The villa · Morning', day: 'The villa · The day', event: 'The challenge', evening: 'The villa · Evening',
  firepit: 'The fire pit', dumping: 'The fire pit', reunion: 'The reunion', result: 'The final', arrival: 'The villa',
  coupling: 'The fire pit', moment: 'Tonight', comingup: 'Coming up', nexttime: 'Next time' };
function identHtml(row, screen) {
  if (screen.teaser) return `<div class="${P('ident')} ${P('identBreak')}"><b>${esc(screen.label)}</b></div>`;
  const where = PLACE[screen.phase] || 'The villa';
  return `<div class="${P('ident')}"><div class="${P('identLogo')}">${IC.heart}<b>Perfect Match</b></div>
    <div class="${P('identWhere')}"><span>${esc(where)}</span><small>${esc(hudOf(row))}</small></div></div>`;
}

// ── the script: every word, in order, under the picture ──────────────
// (2026-11-03, the user: Perfect Match "visually not on par with the other
// stepped viewers". It was a small stage over a stack of cards that repeated
// every line; Big Brother's and the Challenge's are a big picture over a
// player bar, with the script beside the panel.) A scene opens on its faces
// and its name; each line is the speaker's name and the words, a beach-hut
// line and the narrator marked; nothing shows before its step.
function scriptHtml(uid, screen) {
  const out = [];
  screen.steps.forEach((st, i) => {
    if (st.sceneStart) {
      const faces = [...new Set(st.cast.map(c => c[0]))];
      out.push(`<div class="${P('sh')}${st.raw ? ' ' + P('unaired') : ''}${st.big ? ' ' + P('big') : ''}" data-s="${i}">
        <span class="${P('fx')}">${faces.map(mini).join('')}</span><b>${esc(st.headline || screen.label)}</b>${st.raw ? `<em>Didn't air</em>` : ''}</div>`);
      if (st.caption) out.push(`<div class="${P('sl')} ${P('sl-stage')}" data-s="${i}"><span>${esc(st.caption)}</span></div>`);
    }
    const kind = st.part === 'hut' ? 'hut' : st.part === 'narr' ? 'narr' : st.part === 'stage' ? 'stage' : 'line';
    const who = kind === 'stage' || !st.who ? '' : `<b>${kind === 'hut' ? `<small>Beach hut${st.stance === 'two-faced' ? ' · two-faced' : ''}</small>` : ''}${esc(st.who)}</b>`;
    out.push(`<div class="${P('sl')} ${P('sl-' + kind)}" data-s="${i}">${who}<span>${esc(st.text)}</span></div>`);
    if (st.beat) out.push(`<div class="${P('sl')} ${P('sl-stage')}" data-s="${i}"><span>${esc(st.beat)}</span></div>`);
  });
  return out.join('');
}

// ── the player: the controls every stepped viewer has ─────────────────
// Back, play (lines go by on their own, at the speed chosen, and the show
// rolls on to the next screen), next, a bar to scrub, the count, the speed.
const SPEEDS = [1, 1.5, 2];
const speedOf = () => { try { const v = Number(localStorage.getItem('pm-speed')); return SPEEDS.includes(v) ? v : 1; } catch { return 1; } };
const PI = {
  restart: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 5v14M18 5l-9 7 9 7z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M15 5l-8 7 8 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 5l8 7-8 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  end: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 5v14M6 5l9 7-9 7z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};
function playerHtml(uid, screen) {
  const u = esc(uid);
  const b = (fn, title, icon, cls = '') => `<button type="button" class="${P('pb')} ${cls}" onclick="${fn}('${u}')" title="${title}">${icon}</button>`;
  return `<div class="${P('player')}">
    ${b('pmRevealReset', 'Back to the start of this screen', PI.restart)}
    ${b('pmRevealBack', 'Back one line', PI.back)}
    ${b('pmAuto', 'Play: the lines go by on their own', autoOn() ? PI.pause : PI.play, P('pbPlay'))}
    ${b('pmRevealNext', 'Next line', PI.next)}
    ${b('pmRevealAll', 'Show the whole screen', PI.end)}
    <div class="${P('bar')}" id="${P('bar')}-${u}" data-uid="${u}" title="Drag to move through the screen"><i></i><b></b></div>
    <span class="${P('count')}" id="${P('count')}-${u}">0 / ${screen.steps.length}</span>
    <button type="button" class="${P('pb')} ${P('pbSpeed')}" onclick="pmSpeed('${u}')" title="Play speed">${speedOf()}×</button>
  </div>`;
}

const railHtml = (screen, idx) => (screen.rail ? `<div class="${P('rail')}">${screen.rail.map((p, i) => {
  const at = idx >= 0 ? screen.steps[idx].rail ?? -1 : -1;
  return `<span class="${i === at ? P('on') : i < at ? P('done') : ''}">${i + 1}. ${esc(p)}</span>`;
}).join('')}</div>` : '');

// The day the episode STARTS on: its first scene is that morning, or night one's arrivals.
function hudOf(row) { const d = row.calendar || row.days; return `${d ? `Day ${d[0]} · ` : ''}Episode ${row.num}`; }

function screenHtml(uid, row, prev, screens, si) {
  const screen = screens[si];
  const theme = themeAttr();
  // The player carries TV mode: set it as the screens are built (a reload
  // remembers it; the toggle moves it after).
  if (typeof document !== 'undefined') queueMicrotask?.(() => applyTv(tvOn()));
  return `<style>${PMV_FONTS}${PMV_CSS}</style>
  <div class="pmv${screen.teaser ? ' ' + P('isBreak') : ''}" data-uid="${esc(uid)}"${theme ? ` data-pmtheme="${theme}"` : ''}>
    <div class="${P('top')}"><div class="${P('logo')}">Perfect Match<small>${esc(hudOf(row))} · ${esc(momentTitle(row))}</small></div>
      ${soundCtl()}
      <button type="button" class="${P('themeBtn')} ${P('tvBtn')}" onclick="pmTv()">${tvBtn()}</button>
      <button type="button" class="${P('themeBtn')}" onclick="pmTheme()">${themeBtn(theme)}</button></div>
    <div class="${P('theatre')}">
      ${stageHtml(`${P('st')}-${uid}`, screen, hudOf(row)).replace(' data-bg=', ` data-bug="${esc(screen.teaser ? screen.label : 'Coming up')}" data-bg=`)
        .replace(/<\/div>$/, identHtml(row, screen) + '</div>')}
      ${playerHtml(uid, screen)}
      <div id="${P('rail')}-${uid}">${railHtml(screen, -1)}</div>
    </div>
    <div class="${P('layout')}">
      <div class="${P('script')}" id="${P('script')}-${uid}">${scriptHtml(uid, screen)}</div>
      <div class="${P('aside')}" id="${P('aside')}-${uid}">${asideHtml(row, prev, screens, si, -1)}</div>
    </div>
  </div>`;
}

// ── the reveal ─────────────────────────────────────────────────────────
function paint(uid, fresh) {
  const S = reg()[uid];
  if (!S || typeof document === 'undefined') return;
  const { row, prev, screens, si, idx } = S;
  const screen = screens[si];
  const root = document.querySelector(`.pmv[data-uid="${uid}"]`);
  if (root) root.dataset.idx = String(idx);
  paintStage(document.getElementById(`${P('st')}-${uid}`), screen, idx, { fresh, hud: hudOf(row) });
  const script = document.getElementById(`${P('script')}-${uid}`);
  if (script) script.querySelectorAll('[data-s]').forEach(el => el.classList.toggle(P('vis'), Number(el.dataset.s) <= idx));
  const bar = document.getElementById(`${P('bar')}-${uid}`);
  if (bar) bar.style.setProperty('--at', `${screen.steps.length ? 100 * Math.max(0, idx + 1) / screen.steps.length : 0}%`);
  const play = root?.querySelector('.' + P('pbPlay'));
  if (play) play.innerHTML = autoOn() ? PI.pause : PI.play;
  const rail = document.getElementById(`${P('rail')}-${uid}`);
  if (rail) rail.innerHTML = railHtml(screen, idx);
  const aside = document.getElementById(`${P('aside')}-${uid}`);
  if (aside) aside.innerHTML = asideHtml(row, prev, screens, si, idx, S.sel);
  const count = document.getElementById(`${P('count')}-${uid}`);
  if (count) count.textContent = `${Math.max(0, idx + 1)} / ${screen.steps.length}`;
  // The script follows the picture inside its own box: the page doesn't move.
  if (script) {
    const last = [...script.querySelectorAll(`[data-s="${idx}"]`)].pop();
    if (last) script.scrollTop = Math.max(0, last.offsetTop - script.clientHeight + last.offsetHeight + 12);
    else if (idx < 0) script.scrollTop = 0;
  }
}

/** A screen the page has just drawn is at rest, whatever it was last time. */
function sync(uid) {
  const S = reg()[uid];
  const root = typeof document !== 'undefined' ? document.querySelector(`.pmv[data-uid="${uid}"]`) : null;
  if (S && root && root.dataset.idx == null) { S.idx = -1; S.sel = null; }
  return S;
}
export function pmRevealNext(uid) {
  const S = sync(uid);
  if (!S) return;
  // The last line of a screen: the show rolls on to the next one, the way a
  // programme cuts to its next segment rather than stopping on a page.
  if (S.idx >= S.screens[S.si].steps.length - 1) {
    // (vp-ui.js plays the screen change's whoosh.)
    if (typeof window !== 'undefined' && typeof window.vpNext === 'function') window.vpNext();
    return;
  }
  clickSound();
  S.idx++;
  // The speaker becomes the one the relationships panel is about.
  const sp = S.screens[S.si].steps[S.idx].cast.find(c => c[2] === 'speak')?.[0];
  if (sp && S.names?.includes(sp)) S.sel = sp;
  paint(uid, true);
}
export function pmRevealBack(uid) {
  const S = sync(uid);
  if (!S || S.idx < 0) return;
  S.idx--;
  paint(uid, false);
}
/** Jump to a fraction of the screen (the bar): the whole state, no animation. */
export function pmSeek(uid, frac) {
  const S = sync(uid);
  if (!S) return;
  const n = S.screens[S.si].steps.length;
  const idx = Math.max(-1, Math.min(n - 1, Math.round(frac * n) - 1));
  if (idx === S.idx) return;
  S.idx = idx;
  paint(uid, false);
}
// Auto: each line held for as long as it takes to type and read, then the next;
// the last line of a screen rolls on to the next screen, which carries on.
function autoOn() { return !!(typeof window !== 'undefined' && window.__pmAuto); }
let autoTimer = null;
const holdFor = st => { const n = (st?.text || '').length; return Math.min(9000, 1300 + n * 52); };
function autoTick() {
  clearTimeout(autoTimer);
  if (!autoOn() || typeof document === 'undefined') return;
  const root = document.querySelector('.pmv[data-uid]');
  if (!root) { window.__pmAuto = false; return; }
  const S = sync(root.dataset.uid);
  if (!S) return;
  const st = S.screens[S.si].steps[S.idx];
  autoTimer = setTimeout(() => {
    if (!autoOn()) return;
    const at = S.idx;
    pmRevealNext(root.dataset.uid);
    if (S.idx !== at) autoTick();   // the screen change brings its own tick (vp:screen, below)
  }, (S.idx < 0 ? 700 : holdFor(st)) / speedOf());
}
export function pmAuto(uid) {
  if (typeof window === 'undefined') return;
  window.__pmAuto = !window.__pmAuto;
  const root = document.querySelector(`.pmv[data-uid="${uid}"]`);
  const play = root?.querySelector('.' + P('pbPlay'));
  if (play) play.innerHTML = autoOn() ? PI.pause : PI.play;
  if (autoOn()) autoTick(); else clearTimeout(autoTimer);
}
export function pmSpeed(uid) {
  const next = SPEEDS[(SPEEDS.indexOf(speedOf()) + 1) % SPEEDS.length];
  try { localStorage.setItem('pm-speed', String(next)); } catch { /* per viewer */ }
  document.querySelectorAll('.' + P('pbSpeed')).forEach(b => { b.textContent = `${next}×`; });
  if (autoOn()) autoTick();
}
if (typeof document !== 'undefined' && !globalThis.__pmPlayerWired) {
  globalThis.__pmPlayerWired = true;
  // A new screen while playing: carry on from its first line.
  document.addEventListener('vp:screen', () => { if (autoOn()) setTimeout(() => { if (document.querySelector('.pmv[data-uid]')) autoTick(); else window.__pmAuto = false; }, 400); });
  // The bar: press and drag to scrub.
  let drag = null;
  const seekAt = (bar, x) => { const r = bar.getBoundingClientRect(); pmSeek(bar.dataset.uid, Math.max(0, Math.min(1, (x - r.left) / Math.max(1, r.width)))); };
  document.addEventListener('pointerdown', e => {
    const bar = e.target?.closest?.('.' + P('bar'));
    if (!bar) return;
    e.preventDefault(); drag = bar; window.__pmAuto = false; clearTimeout(autoTimer); seekAt(bar, e.clientX);
  });
  document.addEventListener('pointermove', e => { if (drag) seekAt(drag, e.clientX); });
  document.addEventListener('pointerup', () => { drag = null; });
}
export function pmRevealAll(uid) {
  const S = sync(uid);
  if (!S) return;
  S.idx = S.screens[S.si].steps.length - 1;
  paint(uid, false);
}
export function pmRevealReset(uid) {
  const S = sync(uid);
  if (!S) return;
  S.idx = -1;
  paint(uid, false);
}
/** A face on the map or the picker: that islander's relationships. */
export function pmPick(el) {
  const root = el?.closest?.('.pmv');
  const uid = root?.dataset.uid, S = reg()[uid];
  if (!S) return;
  S.sel = el.dataset.n;
  const aside = document.getElementById(`${P('aside')}-${uid}`);
  if (aside) aside.innerHTML = asideHtml(S.row, S.prev, S.screens, S.si, S.idx, S.sel);
}
export function pmTheme() {
  const cur = document.querySelector('.pmv')?.dataset.pmtheme || (matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('pm-theme', next); } catch { /* fine */ }
  document.querySelectorAll('.pmv').forEach(r => { r.dataset.pmtheme = next; });
  // Only the theme button: the TV button wears the same style (it was relabelled Light/Dark).
  document.querySelectorAll('.pmv-themeBtn:not(.pmv-tvBtn)').forEach(b => { b.innerHTML = themeBtn(next); });
}

// ── the Debug screen ───────────────────────────────────────────────────
function debugHtml(row) {
  const villa = [...(row.pm.villa || [])].sort();
  const ap = row.pm.approval || {}, fame = row.pm.fame || {}, lab = row.pm.labels || {}, emo = row.pm.emotions || {};
  const rel = row.pm.relationships || {};
  const mood = villa.map(n => {
    const a = Math.max(-100, Math.min(100, ap[n] || 0));
    return `<div class="${P('mrow')}">${mini(n)}<div><div class="${P('nm')}"><span>${esc(n)}</span><span class="${P('lab')} ${P(String(lab[n] || 'invisible').toLowerCase().replace(/[^a-z]/g, ''))}">${esc(lab[n] || '—')} · ${Math.round(a)}</span></div>
      <div class="${P('gauge')}"><i style="left:${a >= 0 ? 50 : 50 + a / 2}%;width:${Math.abs(a) / 2}%;background:${a >= 0 ? 'linear-gradient(90deg,#ff7a59,#ff2e88)' : 'linear-gradient(90deg,#7f1d1d,#f87171)'}"></i></div></div></div>`;
  }).join('');
  const maxF = Math.max(1, ...villa.map(n => fame[n] || 0));
  const fameRows = villa.map(n => `<div class="${P('mrow')}">${mini(n)}<div><div class="${P('nm')}"><span>${esc(n)}</span><span>${Math.round(fame[n] || 0)}</span></div>
    <div class="${P('gauge')}"><i style="left:0;width:${100 * (fame[n] || 0) / maxF}%;background:linear-gradient(90deg,#ffc15e,#ff7a59)"></i></div></div></div>`).join('');
  const emoRows = villa.map(n => { const e = emo[n] || {};
    return `<div class="${P('mrow')}">${mini(n)}<div><div class="${P('nm')}"><span>${esc(n)}</span></div><div class="${P('emo')}">${
      ['security', 'confidence', 'stress', 'jealousy', 'heartbreak', 'guilt'].map(k => `<span title="${k}">${k.slice(0, 4)} ${Math.round((e[k] || 0) * 10) / 10}</span>`).join('')}</div></div></div>`; }).join('');
  const att = row.pm.attach || {};
  const bar = (v, c) => `<div class="${P('gauge')}"><i style="left:0;width:${Math.round(100 * Math.min(1, v || 0))}%;background:${c}"></i></div>`;
  const attachRows = villa.map(n => { const a = att[n] || {};
    return `<div class="${P('mrow')}">${mini(n)}<div><div class="${P('nm')}"><span>${esc(n)}</span><span class="${P('lab')}">${esc(a.label || '—')} · ${esc(String(a.persona || '').replace(/-/g, ' '))} · prone ×${a.prone ?? '—'}</span></div>
      <div class="${P('attach')}"><span>anxious</span>${bar(a.anxiety, 'linear-gradient(90deg,#fbbf24,#f97316)')}<span>avoidant</span>${bar(a.avoidance, 'linear-gradient(90deg,#60a5fa,#6366f1)')}</div></div></div>`; }).join('');
  const heat = (i, colour) => `<table class="${P('heat')}"><tr><th></th>${villa.map(n => `<th class="${P('rot')}"><span>${esc(n)}</span></th>`).join('')}</tr>
    ${villa.map(a => `<tr><th style="text-align:right">${esc(a)}</th>${villa.map(b => {
      if (a === b) return `<td class="${P('self')}"></td>`;
      const v = rel[`${a}→${b}`]?.[i];
      return `<td style="background:${v == null ? 'transparent' : colour(v)}" title="${esc(a)} → ${esc(b)}: ${v ?? '—'}">${v == null ? '' : Math.round(v)}</td>`; }).join('')}</tr>`).join('')}</table>`;
  const rom = v => (v > 0.5 ? `rgba(255,46,136,${(.15 + v / 11).toFixed(2)})` : 'transparent');
  const fr = v => (v > 0.5 ? `rgba(20,184,166,${(.15 + v / 11).toFixed(2)})` : v < -0.5 ? `rgba(239,68,68,${(.15 - v / 11).toFixed(2)})` : 'transparent');
  const theme = themeAttr();
  return `<style>${PMV_FONTS}${PMV_CSS}</style><div class="pmv ${P('debug')}"${theme ? ` data-pmtheme="${theme}"` : ''}>
    <div class="${P('top')}"><div class="${P('logo')}">Debug<small>${esc(hudOf(row))} · at the end of the episode</small></div>
      <button type="button" class="${P('themeBtn')}" onclick="pmTheme()">${themeBtn(theme)}</button></div>
    <div class="${P('debugScreen')}">
      <div class="${P('panel')} ${P('wide')}"><h3>Engine numbers</h3><p class="${P('note')}">The islanders never see any of this. The public see only what aired, which is all approval and fame are made of.</p></div>
      <div class="${P('panel')}"><h3>Public approval</h3>${mood}</div>
      <div class="${P('panel')}"><h3>Fame</h3>${fameRows}</div>
      <div class="${P('panel')} ${P('wide')}"><h3>Feelings</h3>${emoRows}</div>
      <div class="${P('panel')} ${P('wide')}"><h3>Attachment · who breaks</h3><p class="${P('note')}">Worked out from the stats: anxious = loyalty × a short fuse (cares a lot, reacts hard); avoidant = low loyalty × strategy (keeps a distance). Proneness scales the chance of a breakdown — attachment, persona and archetype — 1 is average.</p>${attachRows}</div>
      <div class="${P('panel')} ${P('wide')}"><h3>Romance · row feels for column</h3>${heat(0, rom)}</div>
      <div class="${P('panel')} ${P('wide')}"><h3>Friendship · row feels for column</h3>${heat(1, fr)}</div>
    </div></div>`;
}

/**
 * The episode's screens for vp-screens.js: [{ id, label, html }]. Ids are
 * `villa-<phase>-<i>` (vp-ui.js groups them: the day, the night, the reunion).
 */
export function perfectMatchVpScreens(row, prev = null, { debug = false, next = null } = {}) {
  const screens = episodeScreens(row, { next, prev });
  const out = screens.map((screen, si) => {
    const uid = `${row.num}-${si}`;
    reg()[uid] = { row, prev, screens, si, idx: -1, sel: null, names: screen.steps.flatMap(s => s.cast.map(c => c[0])) };
    return { id: `villa-${screen.phase}-${si}`, label: screen.label, html: screenHtml(uid, row, prev, screens, si) };
  });
  if (debug) out.push({ id: 'villa-debug', label: 'Debug', html: debugHtml(row) });
  return out;
}
