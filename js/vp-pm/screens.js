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

// ── the cards: one per scene, filling in a line at a time ──────────────
function cardsHtml(uid, screen) {
  const out = [];
  let open = null, hutShown = false;
  screen.steps.forEach((st, i) => {
    if (st.sceneStart) {
      hutShown = false;
      if (open) out.push(open.join('') + '</div></div>');
      const faces = [...new Set(st.cast.map(c => c[0]))];
      open = [`<div class="${P('card')}${st.big ? ' ' + P('big') : ''}${st.raw ? ' ' + P('unaired') : ''}" id="${P('c')}-${uid}-${i}" data-first="${i}">
        <div class="${P('fx')}">${faces.map(mini).join('')}</div><div class="${P('body')}"><div class="${P('k')}">${esc(st.headline || screen.label)}</div>`];
      if (st.raw) open.push(`<div class="${P('tape')}">Didn't air</div>`);
      if (st.caption) open.push(`<p class="${P('ln')} ${P('cap')}" data-s="${i}">${esc(st.caption)}</p>`);
    }
    const cls = st.part === 'hut' ? P('hutl') : st.part === 'narr' ? P('narl') : st.part === 'stage' ? P('cap') : '';
    const who = st.part === 'stage' || !st.who ? '' : `<span class="${P('who')}">${esc(st.who)}:</span> `;
    const hutTag = st.part === 'hut' && !hutShown ? `<span class="${P('hutk')}">Beach hut${st.stance === 'two-faced' ? ' · two-faced' : ''}</span>` : '';
    if (st.part === 'hut') hutShown = true;
    open.push(`<p class="${P('ln')} ${cls}" data-s="${i}">${hutTag}${who}${esc(st.text)}</p>`);
    if (st.beat) open.push(`<p class="${P('ln')} ${P('bt')}" data-s="${i}">${esc(st.beat)}</p>`);
  });
  if (open) out.push(open.join('') + '</div></div>');
  return out.join('');
}

const railHtml = (screen, idx) => (screen.rail ? `<div class="${P('rail')}">${screen.rail.map((p, i) => {
  const at = idx >= 0 ? screen.steps[idx].rail ?? -1 : -1;
  return `<span class="${i === at ? P('on') : i < at ? P('done') : ''}">${i + 1}. ${esc(p)}</span>`;
}).join('')}</div>` : '');

// The day the episode STARTS on: its first scene is that morning, or night one's arrivals.
function hudOf(row) { return `${row.days ? `Day ${row.days[0]} · ` : ''}Episode ${row.num}`; }

function screenHtml(uid, row, prev, screens, si) {
  const screen = screens[si];
  const theme = themeAttr();
  return `<style>${PMV_FONTS}${PMV_CSS}</style>
  <div class="pmv" data-uid="${esc(uid)}"${theme ? ` data-pmtheme="${theme}"` : ''}>
    <div class="${P('top')}"><div class="${P('logo')}">Perfect Match<small>${esc(hudOf(row))} · ${esc(momentTitle(row))}</small></div>
      <button type="button" class="${P('themeBtn')}" onclick="pmTheme()">${themeBtn(theme)}</button></div>
    <div class="${P('layout')}">
      <div class="${P('main')}" style="min-width:0">
        ${stageHtml(`${P('st')}-${uid}`, screen, hudOf(row))}
        <div id="${P('rail')}-${uid}">${railHtml(screen, -1)}</div>
        <div class="${P('cards')}" id="${P('cards')}-${uid}">${cardsHtml(uid, screen)}</div>
      </div>
      <div class="${P('aside')}" id="${P('aside')}-${uid}">${asideHtml(row, prev, screens, si, -1)}</div>
    </div>
    <div class="${P('controls')}">
      <button type="button" class="${P('ghost')}" onclick="pmRevealReset('${esc(uid)}')">Restart</button>
      <button type="button" class="${P('next')}" onclick="pmRevealNext('${esc(uid)}')">Next</button>
      <button type="button" class="${P('ghost')}" onclick="pmRevealAll('${esc(uid)}')">Reveal all</button>
      <span class="${P('count')}" id="${P('count')}-${uid}">0 / ${screen.steps.length}</span>
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
  const cards = document.getElementById(`${P('cards')}-${uid}`);
  if (cards) {
    cards.querySelectorAll('[data-s]').forEach(el => el.classList.toggle(P('vis'), Number(el.dataset.s) <= idx));
    cards.querySelectorAll('.' + P('card')).forEach(c => c.classList.toggle(P('vis'), Number(c.dataset.first) <= idx));
  }
  const rail = document.getElementById(`${P('rail')}-${uid}`);
  if (rail) rail.innerHTML = railHtml(screen, idx);
  const aside = document.getElementById(`${P('aside')}-${uid}`);
  if (aside) aside.innerHTML = asideHtml(row, prev, screens, si, idx, S.sel);
  const count = document.getElementById(`${P('count')}-${uid}`);
  if (count) count.textContent = `${Math.max(0, idx + 1)} / ${screen.steps.length}`;
  if (fresh && cards) {
    const last = [...cards.querySelectorAll(`[data-s="${idx}"]`)].pop();
    try { last?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch { /* jsdom */ }
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
  if (!S || S.idx >= S.screens[S.si].steps.length - 1) return;
  S.idx++;
  // The speaker becomes the one the relationships panel is about.
  const sp = S.screens[S.si].steps[S.idx].cast.find(c => c[2] === 'speak')?.[0];
  if (sp && S.names?.includes(sp)) S.sel = sp;
  paint(uid, true);
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
  document.querySelectorAll('.pmv-themeBtn').forEach(b => { b.innerHTML = themeBtn(next); });
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
      <div class="${P('panel')} ${P('wide')}"><h3>Romance · row feels for column</h3>${heat(0, rom)}</div>
      <div class="${P('panel')} ${P('wide')}"><h3>Friendship · row feels for column</h3>${heat(1, fr)}</div>
    </div></div>`;
}

/**
 * The episode's screens for vp-screens.js: [{ id, label, html }]. Ids are
 * `villa-<phase>-<i>` (vp-ui.js groups them: the day, the night, the reunion).
 */
export function perfectMatchVpScreens(row, prev = null, { debug = false } = {}) {
  const screens = episodeScreens(row);
  const out = screens.map((screen, si) => {
    const uid = `${row.num}-${si}`;
    reg()[uid] = { row, prev, screens, si, idx: -1, sel: null, names: screen.steps.flatMap(s => s.cast.map(c => c[0])) };
    return { id: `villa-${screen.phase}-${si}`, label: screen.label, html: screenHtml(uid, row, prev, screens, si) };
  });
  if (debug) out.push({ id: 'villa-debug', label: 'Debug', html: debugHtml(row) });
  return out;
}
