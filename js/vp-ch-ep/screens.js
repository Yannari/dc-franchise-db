// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/screens.js — The Challenge's stepped viewer, in the viewing pane
// ══════════════════════════════════════════════════════════════════════
//
// One VP screen per chapter of the episode (steps.js chStepScreens: the open,
// the daily, the villa, the vote, the night before, the Arena, the final's
// stages), each the stage above its script with the chapter strip under it.
// The readout (js/vp-ch/screens.js) stays one click away on every screen, and
// the switch remembers the choice (manual §18.3: a viewer that loses your place
// gets abandoned).
//
// The pane re-renders a screen's HTML when it is shown; `vp:screen` finds the
// root and paints step 0. A registry on `window` holds each episode's steps, so
// a repaint never loses them (the _tvState wipe class, manual §11.5).
import { chStepScreens } from './steps.js';
import { ChxStage } from './stage.js';
import { ensureChxStyle } from './style.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reg = () => (typeof window !== 'undefined' ? (window._chx ||= {}) : (globalThis._chx ||= {}));

/** The episode's VP screens: [{ id, label, html }]. */
export function chStepVpScreens(row, ctx = {}) {
  const screens = chStepScreens(row, ctx);
  const key = `ch${row.num}`;
  reg()[key] = { row, screens, ctx: { ...ctx, ...wordsOf(row, ctx) } };
  ensureChxStyle();
  const week = row?.ch?.final ? 'The final' : row?.ch?.division === 'm' ? "Men's week" : row?.ch?.division === 'f' ? "Women's week" : '';
  return screens.map((s, si) => ({ id: `ch-${s.id}`, label: s.label, html: shell(key, si, s, row, week, ctx) }));
}

function shell(key, si, s, row, week, ctx) {
  return `<div class="chx" data-ep="${esc(key)}" data-si="${si}">
  <div class="chx-top"><div class="chx-logo">The Challenge<small>${esc((ctx.title || 'Blue Lagoon').toUpperCase())}</small></div>
    <div class="chx-eps"><b>Episode ${esc(row.num)}</b>${week ? ` · ${esc(week)}` : ''} · ${esc(s.label)}</div><div class="chx-spacer"></div>
    <button type="button" class="chx-ibtn" onclick="chxTv()">TV</button>
    <button type="button" class="chx-ibtn" onclick="chxSwitchViewer('classic')" title="The readout: every line of the episode, one screen per moment">Readout view</button></div>
  <div class="chx-frame" onclick="chxNext(this)">
    <div class="chx-world"><div class="chx-drift"><div class="chx-platebox"></div><div class="chx-live"></div><div class="chx-cast"></div><div class="chx-wfx"></div></div></div>
    <div class="chx-hud"></div><div class="chx-confbox"></div>
    <div class="dlg"><div class="panel"></div><div class="cutin"></div><div class="name"></div><div class="say"></div><div class="next"></div></div>
    <div class="over"></div><div class="intel"></div><div class="static"></div>
  </div>
  <div class="chx-ctl">
    <button type="button" class="cbtn" onclick="chxRestart(this)">Restart</button>
    <button type="button" class="cbtn" onclick="chxBack(this)">Back <span class="key">&larr;</span></button>
    <button type="button" class="cbtn go" onclick="chxNext(this)">Next <span class="key">Space</span></button>
    <button type="button" class="cbtn chx-auto" onclick="chxAuto(this)">Auto</button>
    <div class="chapters"></div>
  </div>
  <details class="script"><summary>Script</summary><div class="lines"></div></details>
</div>`;
}

// The words that light up, and each player's alliance for the confessional's name plate.
function wordsOf(row, ctx) {
  const hist = ctx.history || (typeof window !== 'undefined' ? (window.gs?.episodeHistory || []) : []);
  const rows = [...hist.filter(r => r && r.format === row.format && r.num < row.num), row];
  const team = {};
  for (const r of rows) {
    for (const m of r.ch?.meetings || []) if (m.name) for (const [n, v] of Object.entries(m.responses || {})) if (v === 'yes' || v === 'organiser') team[n] = m.name;
    for (const a of r.ch?.aired || []) if ((a.kind === 'alliance-form' || a.kind === 'alliance-grow') && a.data?.name) for (const n of a.who) team[n] = a.data.name;
    for (const a of r.ch?.aired || []) if (a.kind === 'alliance-end' && a.data?.name) for (const n of a.who) if (team[n] === a.data.name) delete team[n];
  }
  const game = ['Arena', 'daily', 'the vote', row.ch?.daily?.name, ...(row.ch?.duels || []).map(d => d.name), ...new Set(Object.values(team))].filter(Boolean);
  const names = [...new Set([...(row.ch?.house || []), 'TJ'])];
  return { names, game, team };
}

// ── running one screen ────────────────────────────────────────────────
function rootOf(el) { return el?.closest ? el.closest('.chx[data-ep]') : null; }
function runner(root) {
  if (!root) return null;
  if (root._chx) return root._chx;
  const E = reg()[root.dataset.ep]; if (!E) return null;
  const si = Number(root.dataset.si);
  const R = { root, E, si, scr: E.screens[si], idx: -1, intelOpen: false, auto: false, timer: 0 };
  R.stage = new ChxStage(root, R);
  root._chx = R;
  root.querySelector('.chx-hud').addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) { e.stopPropagation(); const i = Number(go.dataset.go); if (i >= 0) goTo(R, i, false); return; }
    if (e.target.closest('[data-intel]')) { e.stopPropagation(); R.intelOpen = !R.intelOpen; intel(R); paintHud(R); }
  });
  root.querySelector('.intel').addEventListener('click', e => { e.stopPropagation(); if (e.target.closest('[data-close]')) { R.intelOpen = false; intel(R); } });
  return R;
}
// The intel cards so far: every earlier screen of the episode, and this one up to the step.
function knowAt(R) {
  const out = [];
  R.E.screens.forEach((s, si) => {
    if (si > R.si) return;
    s.steps.forEach((st, i) => { if (st.know && (si < R.si || i <= R.idx)) out.push({ h: st.know[0], b: st.know[1], at: `${si}:${i}` }); });
  });
  return out;
}
function ctxOf(R) {
  const step = R.scr.steps[R.idx] || {};
  return { names: R.E.ctx.names, game: R.E.ctx.game, roleOf: n => R.E.ctx.team?.[n] || null, intelOpen: R.intelOpen, freshKnow: !!step.know };
}
function intel(R) {
  const I = R.root.querySelector('.intel');
  I.classList.toggle('open', R.intelOpen);
  const cur = `${R.si}:${R.idx}`;
  const know = knowAt(R);
  I.innerHTML = `<h4>INTEL <button type="button" data-close>&times;</button></h4><div class="sub">What the house doesn't know. Only what has happened by this step.</div><div class="list">${
    know.length ? [...know].reverse().map(k => `<div class="icard ${k.at === cur ? 'fresh' : ''}"><h6>${esc(k.h)}</h6>${k.b}</div>`).join('') : '<div class="icard">Nothing yet. Keep watching.</div>'}</div>`;
}
function paintHud(R) { const b = R.root.querySelector('.ibtn2'); if (b) b.classList.toggle('new', false); }

function goTo(R, idx, forward) {
  const steps = R.scr.steps;
  idx = Math.max(0, Math.min(steps.length - 1, idx));
  const st = R.stage;
  if (forward && idx === R.idx + 1 && R.idx >= 0) st.apply(steps[idx], true);
  else {
    st.ST = null;
    for (let i = 0; i <= idx; i++) {
      if (i === 0 && !steps[0].scene) st.setScene({ plate: 'villa-day', place: '', cast: {} });
      st.apply(steps[i], false);
    }
  }
  if (!st.ST) st.setScene({ plate: 'villa-day', place: '', cast: {} });
  R.idx = idx;
  R.root.dataset.idx = String(idx);
  st.present(steps[idx], true, ctxOf(R));
  intel(R); chapters(R); script(R);
}
function chapters(R) {
  const C = R.root.querySelector('.chapters');
  C.innerHTML = R.E.screens.map((s, i) => `<div class="chap ${i === R.si ? 'on' : ''}" data-i="${i}" title="${esc(s.label)}"><span>${esc(s.label)}</span><i><b style="width:${i < R.si ? 100 : i > R.si ? 0 : ((R.idx + 1) / s.steps.length * 100)}%"></b></i></div>`).join('');
  C.querySelectorAll('.chap').forEach(c => { c.onclick = () => { const i = Number(c.dataset.i); if (i !== R.si && typeof window.vpGoTo === 'function') window.vpGoTo(vpIndexOf(R, i)); }; });
}
// The VP screen holding chapter i of this episode (the pane's list is exactly these screens).
function vpIndexOf(R, i) {
  const list = (typeof window !== 'undefined' && window.vpScreens) || [];
  const id = `ch-${R.E.screens[i].id}`;
  const at = list.findIndex(s => s.id === id);
  return at >= 0 ? at : i;
}
function script(R) {
  const L = R.root.querySelector('.lines');
  L.innerHTML = R.scr.steps.map((s, i) => {
    const c = i === R.idx ? ' cur' : '';
    if (s.say) return `<div class="ln${c}" data-i="${i}"><span class="n">${esc(s.say[0])}:</span> ${esc(s.say[1])}</div>`;
    if (s.tj) return `<div class="ln${c}" data-i="${i}"><span class="n">TJ:</span> ${esc(s.tj)}</div>`;
    if (s.conf) return `<div class="ln${c}" data-i="${i}"><span class="n">${esc(s.conf[0])} [confessional]:</span> ${esc(s.conf[1])}</div>`;
    if (s.dir) return `<div class="ln d${c}" data-i="${i}">(${esc(s.dir)})</div>`;
    const t = s.rules ? `${s.rules.n}: the rules` : s.seg ? s.seg[1] : s.scene ? s.scene.place : '';
    return t ? `<div class="ln sc${c}" data-i="${i}">${esc(t)}</div>` : '';
  }).join('');
  L.querySelectorAll('.ln').forEach(l => { l.onclick = () => goTo(R, Number(l.dataset.i), false); });
  L.querySelector('.cur')?.scrollIntoView?.({ block: 'nearest' });
}

// ── controls ──────────────────────────────────────────────────────────
const holdFor = s => Math.min(9000, 1700 + String(s?.say?.[1] || s?.tj || s?.conf?.[1] || s?.dir || '').length * 38)
  + (s?.rules ? 5200 : 0) + (s?.seg ? 1600 : 0) + (s?.open ? 4200 : 0) + (s?.slam ? 1400 : 0) + (s?.map ? 2400 : 0);
function stopAuto(R) { R.auto = false; clearTimeout(R.timer); R.root.querySelector('.chx-auto')?.classList.remove('on'); }
export function chxNext(el) {
  const R = runner(rootOf(el) || document.querySelector('.chx[data-ep]')); if (!R) return;
  if (R.idx >= R.scr.steps.length - 1) {
    const wasAuto = R.auto; stopAuto(R);
    if (typeof window.vpNext === 'function') {
      window.vpNext();
      if (wasAuto) setTimeout(() => { const nx = document.querySelector('.chx[data-ep]'); if (nx && nx !== R.root) chxAuto(nx); }, 700);
    }
    return;
  }
  goTo(R, R.idx + 1, true);
}
export function chxBack(el) {
  const R = runner(rootOf(el) || document.querySelector('.chx[data-ep]')); if (!R) return;
  stopAuto(R);
  if (R.idx <= 0) { if (typeof window.vpPrev === 'function') window.vpPrev(); return; }
  goTo(R, R.idx - 1, false);
}
export function chxRestart(el) { const R = runner(rootOf(el)); if (!R) return; stopAuto(R); goTo(R, 0, false); }
export function chxAuto(el) {
  const R = runner(rootOf(el) || document.querySelector('.chx[data-ep]')); if (!R) return;
  R.auto = !R.auto;
  R.root.querySelector('.chx-auto')?.classList.toggle('on', R.auto);
  const tick = () => { if (!R.auto) return; chxNext(R.root); if (R.auto) R.timer = setTimeout(tick, holdFor(R.scr.steps[R.idx])); };
  if (R.auto) R.timer = setTimeout(tick, holdFor(R.scr.steps[R.idx])); else clearTimeout(R.timer);
}
export function chxIntel(el) { const R = runner(rootOf(el) || document.querySelector('.chx[data-ep]')); if (!R) return; R.intelOpen = !R.intelOpen; intel(R); }
export function chxTv() { if (typeof window.tdxTv === 'function') window.tdxTv(); }
/** Switch between the stepped viewer and the readout, staying in the same part of the episode. */
export function chxSwitchViewer(which) {
  try { localStorage.setItem('ch-vp', which === 'stepped' ? 'stepped' : 'classic'); } catch { /* a per-viewer convenience */ }
  try {
    const before = window.vpScreens || [], at = window.vpCurrentScreen || 0;
    const frac = before.length > 1 ? at / (before.length - 1) : 0;
    const ep = window.vpEpNum ?? window._vpEpNum;
    const rec = (window.gs?.episodeHistory || []).find(e => e && e.num === ep && e.format === 'the-challenge');
    if (!rec || typeof window.buildVPScreens !== 'function') { location.reload(); return; }
    window.buildVPScreens(rec);
    const now = window.vpScreens || [];
    const i = Math.round(frac * Math.max(0, now.length - 1));
    if (typeof window.vpGoTo === 'function') window.vpGoTo(Math.max(0, i)); else { window.vpCurrentScreen = Math.max(0, i); window.renderVPScreen?.(); }
  } catch { location.reload(); }
}
/** The readout's way back to the stepped viewer. */
export const CHX_SWITCH = `<div style="display:flex;justify-content:flex-end;margin:0 0 8px"><button type="button" onclick="chxSwitchViewer('stepped')" style="border:1px solid #ff6a1a;background:#1a1716;color:#ff6a1a;padding:7px 12px;font:700 12px 'Barlow Condensed',system-ui,sans-serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer">&#9654; Stepped viewer</button></div>`;

if (typeof window !== 'undefined') Object.assign(window, { chxNext, chxBack, chxRestart, chxAuto, chxIntel, chxTv, chxSwitchViewer });
if (typeof document !== 'undefined') {
  // a screen opens on its first step; leaving it stops its Auto
  document.addEventListener('vp:screen', () => {
    setTimeout(() => {
      const root = document.querySelector('.chx[data-ep]');
      if (!root) return;
      const R = runner(root);
      if (R && R.idx < 0) goTo(R, 0, false);
    }, 0);
  });
  document.addEventListener('keydown', e => {
    const root = document.querySelector('.chx[data-ep]');
    if (!root || /input|textarea|select/i.test(e.target?.tagName || '')) return;
    if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); chxNext(root); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); chxBack(root); }
    else if (e.key === 'i' || e.key === 'I') chxIntel(root);
  }, true);
}
