// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/vp.js — The Ridonculous Race's stepped viewer, in the simulator's viewing pane
// ══════════════════════════════════════════════════════════════════════
//
// The Challenge's pattern (js/vp-ch-ep/screens.js): one VP screen per CHAPTER of the leg, each the stage over its
// lines, so the pane's sidebar lists the leg the way the show cuts it: Previously, The Start, each challenge as the
// leaders reach it, The Chill Zone. A chapter starts the first time the race's front reaches a new challenge (or the
// mat); the cutaways to the teams behind stay in the chapter they interrupt. The readout (rr-view.js) is one button
// away on every screen and the choice is remembered; a leg picker and "Next leg" move between the legs that aired
// without leaving the player.
//
// The race is the one the run tab built, played again in this page (rr-run.js racePlayed: the same teams, seed and
// history give the same race), cut into screens by the viewer's own pure steps (steps.js). The pane re-renders a
// screen's HTML when it is shown; `vp:screen` finds the root and paints its first step. A registry on `window`
// holds each leg's screens, so a repaint never loses them.
import { RACE_FORMAT } from '../shows.js';
import { PLACES } from '../rr/places.js';
import { avatarUrl } from '../avatar-registry.js';
import { episodeScreens, flatSteps } from './steps.js';
import { createStage } from './stage.js';
import { createSidebar } from './sidebar.js';
import { RR_CSS } from './style.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reg = () => (typeof window !== 'undefined' ? (window._rrx ||= {}) : (globalThis._rrx ||= {}));
const TASK = new Set(['either', 'botch', 'allin', 'route', 'superteam', 'midmat']);

// ── the look, scoped: the viewer's rules sit under .rrx so none of its generic class names (.stage, .title, .slam)
//    reach the simulator's own, and its keyframes are renamed so none replaces one of the page's ──
export function scopeCss(css, root = '.rrx') {
  let text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const name of new Set([...text.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]))) {
    text = text.replace(new RegExp('(^|[^\\w-])' + name + '(?![\\w-])', 'g'), (m, pre) => pre + 'rrx-' + name);
  }
  const sel = s => s.split(',').map(x => x.trim()).filter(Boolean).map(x => {
    if (x === ':root' || x === 'body' || x === 'body.rr-body' || x === 'html') return root;
    if (x.startsWith('.rr-app')) return root + x.slice('.rr-app'.length);
    return `${root} ${x}`;
  }).join(',');
  let out = '', i = 0;
  const block = from => { let d = 0; for (let k = from; k < text.length; k++) { if (text[k] === '{') d++; else if (text[k] === '}' && --d === 0) return k; } return text.length - 1; };
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open < 0) break;
    const head = text.slice(i, open).trim();
    const close = block(open);
    const body = text.slice(open + 1, close);
    if (/^@keyframes|^@font-face/.test(head)) out += `${head}{${body}}`;
    else if (/^@(media|container|supports)/.test(head)) out += `${head}{${scopeCss(body, root)}}`;
    else if (head) out += `${sel(head)}{${body}}`;
    i = close + 1;
  }
  return out;
}
function ensureStyle() {
  if (typeof document === 'undefined' || document.getElementById('rrx-css')) return;
  const st = document.createElement('style');
  st.id = 'rrx-css';
  st.textContent = scopeCss(RR_CSS) + EXTRA;
  document.head.appendChild(st);
  if (!document.getElementById('rrx-fonts')) {
    const l = document.createElement('link');
    l.id = 'rrx-fonts'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:wght@400;500;600;800&display=swap';
    document.head.appendChild(l);
  }
}
// the pane's own pieces around the stage: the top bar, the controls, the Intel drawer
const EXTRA = `
.rrx{color:#fff;font-family:Rubik,system-ui,sans-serif;background:#05070d;border-radius:14px;padding:10px 12px 12px}
.rrx .rrx-top{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 10px}
.rrx .rrx-logo{font-family:Bungee,system-ui;font-size:16px;color:#ffc21f;letter-spacing:.04em;text-shadow:0 2px 0 #6a2200}
.rrx .rrx-chap{font:800 13px Rubik;color:#cfe0ff;letter-spacing:.04em;text-transform:uppercase}
.rrx .rrx-spacer{flex:1}
.rrx select.rrx-legs{font:600 13px Rubik;background:#141b31;color:#fff;border:1px solid #2a3354;border-radius:8px;padding:5px 8px}
.rrx .rrx-btn{font:800 13px Rubik;padding:7px 12px;border-radius:10px;border:0;background:#1d2747;color:#fff;cursor:pointer}
.rrx .rrx-btn.go{background:#f7c948;color:#0f1424}
.rrx .rrx-btn.on{background:#39c0ff;color:#0f1424}
.rrx .rrx-ctrl{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px}
.rrx .rrx-ctrl .stepn{margin-left:auto;font-size:12px;color:#8b95b3}
.rrx .rrx-body{display:grid;grid-template-columns:minmax(0,1fr) 36px;gap:12px}
.rrx.intel-open .rrx-body{grid-template-columns:minmax(0,1fr) 300px}
@media (max-width:1000px){.rrx .rrx-body,.rrx.intel-open .rrx-body{grid-template-columns:minmax(0,1fr)}.rrx .rrx-tab{writing-mode:horizontal-tb;height:auto;width:100%}}
.rrx .rrx-tab{writing-mode:vertical-rl;font:800 12px Bungee,system-ui;letter-spacing:.12em;color:#ffc21f;background:#0d1426;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:12px 6px;cursor:pointer;height:220px}
.rrx.intel-open .rrx-tab{writing-mode:horizontal-tb;height:auto;width:100%;margin-bottom:8px}
.rrx .rrx-side{display:none}
.rrx.intel-open .rrx-side{display:block}
.rrx .rr-side{max-height:calc(100vh - 220px);overflow:auto}
.rrx .stage-holder{max-width:max(560px,calc((100vh - 290px) * 16 / 9))}
`;

// ── the chapters ──
function chaptersOf(e, placeId) {
  const place = PLACES[placeId];
  const order = new Map((place?.stretches || []).map((s, k) => [s.id, k]));
  const label = new Map((place?.stretches || []).map(s => [s.id, s.label || s.called || s.id]));
  const milestone = new Map((place?.stretches || []).filter(s => TASK.has(s.kind) || s.kind === 'mat').map(s => [s.id, s]));
  const matId = (place?.stretches || []).find(s => s.kind === 'mat')?.id || 'mat';
  const chapters = [];
  let front = -1;
  e.screens.forEach((s, si) => {
    const task = String(s.hud?.task || '').toUpperCase();
    let key = null, name = null;
    if (!chapters.length && (task === 'PREVIOUSLY' || task === 'LAST TIME')) { key = 'previously'; name = 'Previously'; }
    else if (!chapters.length || (chapters.length === 1 && chapters[0].key === 'previously' && task !== 'PREVIOUSLY' && task !== 'LAST TIME')) {
      key = 'start'; name = e.kind === 'final' ? 'The Finale' : 'The Start';
    }
    const stretch = s.stretch || (task === 'CHILL ZONE' ? matId : null);
    if (!key && stretch && milestone.has(stretch) && (order.get(stretch) ?? -1) > front) {
      front = order.get(stretch);
      key = stretch;
      name = stretch === matId ? 'The Chill Zone' : label.get(stretch);
    }
    if (key) chapters.push({ key, name, from: si, to: si });
    else chapters.at(-1).to = si;
  });
  return chapters;
}

// ── the screens ──
const ICONS = { previously: '◀', start: '✈', mat: '🏁' };
/** The leg's VP screens: one per chapter [{ id, label, html, phase }]. Null when the race can't be played here. */
export function raceStepVpScreens(row, { played, aired = [] } = {}) {
  if (!played?.res?.legs?.[row.num - 1]) return null;
  ensureStyle();
  const i = row.num - 1;
  const e = { ...episodeScreens(played.res, played.eps, i), res: played.res };
  const chapters = chaptersOf(e, played.res.legs[i].place);
  const key = `rr${row.num}`;
  reg()[key] = { row, e, chapters, aired: aired.map(r => ({ num: r.num, place: r.rr?.placeName || '' })) };
  const phase = { id: 'rr-leg', label: `Leg ${row.num} · ${row.rr?.placeName || ''}`, icon: '🏁' };
  return chapters.map((c, ci) => ({ id: `rr-c${ci}`, label: c.name, html: shell(key, ci, c, row), phase,
    icon: ICONS[c.key] || (c.name === 'The Chill Zone' ? ICONS.mat : '⚑') }));
}

function shell(key, ci, c, row) {
  const R = reg()[key];
  const legs = R.aired.map(a => `<option value="${a.num}"${a.num === row.num ? ' selected' : ''}>Leg ${a.num} · ${esc(a.place)}</option>`).join('');
  return `<div class="rrx" data-key="${esc(key)}" data-ci="${ci}">
  <div class="rrx-top"><span class="rrx-logo">The Ridonculous Race</span>
    <select class="rrx-legs" onchange="rrxLeg(this.value)" title="Watch another leg">${legs}</select>
    <span class="rrx-chap">${esc(c.name)}</span><span class="rrx-spacer"></span>
    <button type="button" class="rrx-btn" onclick="rrxSwitchViewer('readout')" title="Every line of the leg as text">Transcript</button></div>
  <div class="rrx-body">
    <div><div class="stage-holder rrx-holder" style="position:relative"></div>
      <div class="rrx-ctrl">
        <button type="button" class="rrx-btn" onclick="rrxBack(this)">◀ Back</button>
        <button type="button" class="rrx-btn go" onclick="rrxNext(this)">Next ▶</button>
        <button type="button" class="rrx-btn rrx-auto" onclick="rrxAuto(this)">▶ Auto</button>
        <span class="stepn"></span>
      </div></div>
    <div class="rrx-sidecol"><button type="button" class="rrx-tab" onclick="rrxIntel(this)">INTEL ◂</button><aside class="rr-side rrx-side"></aside></div>
  </div>
</div>`;
}

// ── the runtime: a runner per mounted screen ──
const RUN = new WeakMap();
const INTEL_KEY = 'rr-vp-intel';
function faceOf(name) {
  const p = (typeof window !== 'undefined' ? window.players : null)?.find?.(x => x?.name === name);
  return avatarUrl({ slug: p?.slug || name, avatarId: p?.avatarId, avatarFile: p?.avatarFile });
}
function rootOf(el) { return el?.closest?.('.rrx[data-key]') || (typeof document !== 'undefined' ? document.querySelector('.rrx[data-key]') : null); }
function runner(root) {
  if (!root) return null;
  if (RUN.has(root)) return RUN.get(root);
  const R0 = reg()[root.dataset.key];
  if (!R0) return null;
  const c = R0.chapters[Number(root.dataset.ci)];
  const flat = flatSteps(R0.e.screens).filter(f => f.si >= c.from && f.si <= c.to);
  const stage = createStage(root.querySelector('.rrx-holder'), { faceOf, legLabel: `LEG ${R0.row.num}` });
  const side = createSidebar(root.querySelector('.rrx-side'), { faceOf });
  let open = false;
  try { open = localStorage.getItem(INTEL_KEY) === '1'; } catch { open = false; }
  root.classList.toggle('intel-open', open);
  const R = { root, R0, c, flat, at: -1, stage, side, auto: null, last: Number(root.dataset.ci) === R0.chapters.length - 1 };
  stage.el.addEventListener('click', () => next(R));
  RUN.set(root, R);
  return R;
}
function draw(R, fresh) {
  const f = R.flat[R.at];
  if (!f) return;
  R.stage.paint(R.R0.e, f.si, f.idx, fresh);
  R.side.paint(R.R0.e, f.si, f.idx, { speaking: R.R0.e.screens[f.si].steps[f.idx]?.team || null });
  const n = R.root.querySelector('.stepn');
  if (n) n.textContent = `${R.c.name} · ${R.at + 1} of ${R.flat.length}`;
  const nx = R.root.querySelector('.rrx-btn.go');
  if (nx) nx.textContent = R.at >= R.flat.length - 1 ? (R.last ? (nextLeg(R) ? 'Next leg ▶' : 'The end') : 'Next part ▶') : 'Next ▶';
}
function nextLeg(R) { const a = R.R0.aired; const k = a.findIndex(x => x.num === R.R0.row.num); return k >= 0 ? a[k + 1] || null : null; }
function next(R) {
  if (R.at < R.flat.length - 1) { R.at++; draw(R, true); return; }
  stopAuto(R);
  if (!R.last) { if (typeof window.vpNext === 'function') window.vpNext(); return; }
  const n = nextLeg(R);
  if (n && typeof window.openVisualPlayer === 'function') window.openVisualPlayer(n.num);
}
function back(R) {
  stopAuto(R);
  if (R.at > 0) { R.at--; draw(R, false); return; }
  if (typeof window.vpPrev === 'function') window.vpPrev();
}
function stopAuto(R) { if (R.auto) { clearTimeout(R.auto); R.auto = null; R.root.querySelector('.rrx-auto')?.classList.remove('on'); } }

export function rrxNext(el) { const R = runner(rootOf(el)); if (R) next(R); }
export function rrxBack(el) { const R = runner(rootOf(el)); if (R) back(R); }
export function rrxAuto(el) {
  const R = runner(rootOf(el)); if (!R) return;
  if (R.auto) { stopAuto(R); return; }
  R.root.querySelector('.rrx-auto')?.classList.add('on');
  const tick = () => {
    const f = R.flat[R.at];
    const len = (R.R0.e.screens[f?.si]?.steps[f?.idx]?.text || '').length;
    const wasLast = R.at >= R.flat.length - 1;
    next(R);
    if (!wasLast) R.auto = setTimeout(tick, 1800 + len * 28);
  };
  R.auto = setTimeout(tick, 600);
}
export function rrxIntel(el) {
  const R = runner(rootOf(el)); if (!R) return;
  const open = !R.root.classList.contains('intel-open');
  R.root.classList.toggle('intel-open', open);
  try { localStorage.setItem(INTEL_KEY, open ? '1' : '0'); } catch { /* a per-viewer convenience */ }
  draw(R, false);
}
/** Watch another leg that aired, from inside the player. */
export function rrxLeg(num) { if (typeof window.openVisualPlayer === 'function') window.openVisualPlayer(Number(num)); }
/** Switch between the stepped viewer and the transcript, staying on the leg. */
export function rrxSwitchViewer(which) {
  try { localStorage.setItem('rr-vp', which === 'readout' ? 'readout' : 'stepped'); } catch { /* a per-viewer convenience */ }
  const ep = typeof window !== 'undefined' ? (window.vpEpNum ?? window._vpEpNum) : null;
  try { if (ep != null && typeof window.openVisualPlayer === 'function') window.openVisualPlayer(ep); else location.reload(); } catch { location.reload(); }
}
/** Which viewer the pane shows a race leg in: the stepped one unless the viewer chose the transcript. */
export function raceViewerMode() {
  try { return localStorage.getItem('rr-vp') === 'readout' ? 'readout' : 'stepped'; } catch { return 'stepped'; }
}

if (typeof window !== 'undefined') Object.assign(window, { rrxNext, rrxBack, rrxAuto, rrxIntel, rrxLeg, rrxSwitchViewer });
if (typeof document !== 'undefined') {
  // a screen opens on its first step
  document.addEventListener('vp:screen', () => {
    setTimeout(() => {
      const root = document.querySelector('.rrx[data-key]');
      if (!root) return;
      const R = runner(root);
      if (R && R.at < 0) { R.at = 0; draw(R, true); }
    }, 0);
  });
  document.addEventListener('keydown', e => {
    const root = document.querySelector('.rrx[data-key]');
    if (!root || root.offsetParent === null || /input|textarea|select/i.test(e.target?.tagName || '')) return;
    const R = runner(root); if (!R) return;
    if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); next(R); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); back(R); }
    else if (e.key === 'i' || e.key === 'I') rrxIntel(root);
  }, true);
}
export { RACE_FORMAT };
