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
import { ChxStage, AV } from './stage.js';
import { ensureChxStyle } from './style.js';
import { CH_MARKS } from './marks.js';
import { bedFor, playStep, warmStings } from './sound.js';

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
  return `<div class="chx" data-ep="${esc(key)}" data-si="${si}" data-ambient="${bedFor(s)}">
  <div class="chx-top"><div class="chx-logo">The Challenge<small>${esc((ctx.title || 'Blue Lagoon').toUpperCase())}</small></div>
    <div class="chx-eps"><b>Episode ${esc(row.num)}</b>${week ? ` · ${esc(week)}` : ''} · ${esc(s.label)}</div>
    <div class="chx-chapmenu"><button type="button" class="chx-ibtn" onclick="chxChapters(this)">Chapters &#9662;</button><div class="chapters"></div></div><div class="chx-spacer"></div>
    <button type="button" class="chx-ibtn" onclick="chxTv()">TV</button>
    <button type="button" class="chx-ibtn" onclick="chxSwitchViewer('classic')" title="The readout: every line of the episode, one screen per moment">Readout view</button></div>
  <div class="chx-frame" onclick="chxFrame(this)">
    <div class="chx-world"><div class="chx-drift"><div class="chx-platebox"></div><div class="chx-live"></div><div class="chx-props"></div><div class="chx-cast"></div><div class="chx-props chx-fore"></div><div class="chx-wfx"></div></div></div>
    <div class="chx-hud"></div><div class="chx-confbox"></div>
    <div class="dlg"><div class="panel"></div><div class="cutin"></div><div class="name"></div><div class="say"></div><div class="next"></div></div>
    <div class="over"></div><div class="intel"></div><div class="isle"></div><div class="static"></div>
  </div>
  <div class="chx-ctl">
    <button type="button" class="pbtn" onclick="chxRestart(this)" title="Back to the start of this part"><svg viewBox='0 0 24 24'><path d='M5 4h2.5v16H5zM20 4v16L8.5 12z'/></svg></button>
    <button type="button" class="pbtn" onclick="chxBack(this)" title="Back one (Left arrow)"><svg viewBox='0 0 24 24'><path d='M11.5 4v16L1 12zM23 4v16L12.5 12z'/></svg></button>
    <button type="button" class="pbtn big chx-auto" onclick="chxAuto(this)" title="Play / pause (P)"><svg class='i-play' viewBox='0 0 24 24'><path d='M6 3.5v17L21 12z'/></svg><svg class='i-pause' viewBox='0 0 24 24'><path d='M5 4h5v16H5zM14 4h5v16h-5z'/></svg></button>
    <button type="button" class="pbtn" onclick="chxNext(this)" title="Forward one (Space or Right arrow)"><svg viewBox='0 0 24 24'><path d='M1 4v16l10.5-8zM12.5 4v16L23 12z'/></svg></button>
    <button type="button" class="pbtn speed" onclick="chxSpeed(this)" title="Playback speed">x1</button>
    <button type="button" class="pbtn intelbtn" onclick="chxIntel(this)" title="Intel: what the house doesn't know (I)">INTEL<i></i></button>
    <div class="pbar"><div class="segs"></div><span class="pt"></span></div>
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
  warmStings();
  root.querySelector('.chx-hud').addEventListener('click', e => {
    // the map: a bubble, a place, the villa, the way back out, an empty place
    const go = e.target.closest('[data-go]');
    const inMap = e.target.closest('.mview');
    if (go && !inMap) { e.stopPropagation(); const i = Number(go.dataset.go); if (i >= 0) goTo(R, i, false, true); return; }
    if (go) { e.stopPropagation(); const i = Number(go.dataset.go); if (i >= 0) flyTo(R, go.closest('.mpin') || go, () => goTo(R, i, false, true)); return; }
    const enter = e.target.closest('[data-enter]');
    if (enter) { e.stopPropagation(); flyTo(R, enter, () => setView(R, 'villa', true)); return; }
    const zone = e.target.closest('.mpin[data-gos]');
    if (zone) {
      e.stopPropagation();
      const gos = zone.dataset.gos.split(',').filter(Boolean).map(Number);
      if (!gos.length) { hint(R, `Nobody is at ${zone.dataset.label} right now.`); return; }
      const seen = seenOf(R);
      const i = gos.find(g => !seen.has(g)) ?? gos[0];
      flyTo(R, zone, () => goTo(R, i, false, true));
      return;
    }
    if (e.target.closest('[data-intel]')) { e.stopPropagation(); R.intelOpen = !R.intelOpen; intel(R); paintHud(R); }
    if (e.target.closest('[data-isle]')) { e.stopPropagation(); stopAuto(R); isle(R, true); }
    const mv = e.target.closest('[data-mview]');
    if (mv) { e.stopPropagation(); setView(R, mv.dataset.mview, false); }
  });
  root.querySelector('.isle').addEventListener('click', e => {
    e.stopPropagation();
    const p = e.target.closest('[data-si]');
    if (e.target.closest('[data-close]') || p) isle(R, false);
    if (p) { const i = Number(p.dataset.si); if (i === R.si) goTo(R, 0, false); else if (typeof window.vpGoTo === 'function') window.vpGoTo(vpIndexOf(R, i)); }
  });
  root.querySelector('.pbar .segs').addEventListener('click', e => {
    const el = e.target.closest('i'); if (!el) return;
    const g = segsOf(R)[Number(el.dataset.k)]; if (!g) return;
    const r = el.getBoundingClientRect();
    const f = Math.max(0, Math.min(0.999, (e.clientX - r.left) / Math.max(1, r.width)));
    stopAuto(R); goTo(R, Math.min(g.z - 1, g.a + Math.floor(f * (g.z - g.a))), false);
  });
  root.querySelector('.intel').addEventListener('click', e => {
    e.stopPropagation();
    if (e.target.closest('[data-close]')) { R.intelOpen = false; intel(R); return; }
    const t = e.target.closest('[data-itab]'); if (t) { istate().tab = t.dataset.itab; intel(R); return; }
    const w = e.target.closest('[data-who]'); if (w) { istate().who = w.dataset.who; intel(R); }
  });
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
// ── Intel: what the house doesn't know (the user, 2026-10-15: "intel doesn't show anything like it does in
// Big Brother and Total Drama") ──
// Tabs: in their heads (what this episode has shown so far), relationships (pick anybody: how everybody
// stands with them), alliances, deals and couples, the record. The house as the episode began until its
// last screen, then as it ends, so the drawer never gets ahead of the screen.
const ITABS = [['heads', 'In their heads'], ['people', 'Relationships'], ['allies', 'Alliances'], ['deals', 'Deals'], ['rec', 'Record']];
const BOND_WORD = v => (v >= 6 ? 'Close' : v >= 3 ? 'Friends' : v > -2 ? 'Neutral' : v > -5 ? 'Tension' : 'Enemies');
const BOND_CLS = v => (v >= 6 ? 'close' : v >= 3 ? 'friend' : v > -2 ? 'neutral' : v > -5 ? 'tense' : 'enemy');
const istate = () => (typeof window !== 'undefined' ? (window._chxIntel ||= { tab: 'heads', who: null }) : { tab: 'heads', who: null });
function houseNow(R) {
  const I = R.E.row?.ch?.intel;
  if (!I) return null;
  const last = R.si === R.E.screens.length - 1;
  return (last && I.end) || I.start || null;
}
function intel(R) {
  const I = R.root.querySelector('.intel');
  I.classList.toggle('open', R.intelOpen);
  R.root.querySelector('.intelbtn')?.classList.toggle('on', R.intelOpen);
  if (!R.intelOpen) return;
  const st = istate();
  const tab = ITABS.some(t => t[0] === st.tab) ? st.tab : 'heads';
  const H = houseNow(R);
  const face = n => `<img class='if' src='${esc(AV(n))}' alt='' title='${esc(n)}'>`;
  let body = '';
  if (tab === 'heads') {
    const cur = `${R.si}:${R.idx}`;
    const know = knowAt(R);
    body = know.length ? [...know].reverse().map(k => `<div class="icard ${k.at === cur ? 'fresh' : ''}"><h6>${esc(k.h)}</h6>${k.b}</div>`).join('') : '<div class="inone">Nothing hidden yet this episode. Keep watching.</div>';
  } else if (!H) {
    body = '<div class="inone">This episode was saved without its record.</div>';
  } else if (tab === 'people') {
    const me = H.players.includes(st.who) ? st.who : H.players[0];
    const bond = (a, b) => H.bonds[a <= b ? `${a}||${b}` : `${b}||${a}`] || 0;
    const couple = n => H.couples.some(c => c.includes(me) && c.includes(n));
    body = `<div class="ipick">${H.players.map(n => `<button type="button" data-who="${esc(n)}" class="${n === me ? 'on' : ''}">${face(n)}</button>`).join('')}</div><div class="isub">${esc(me)}</div>`
      + H.players.filter(n => n !== me).map(n => [n, bond(me, n)]).sort((x, y) => y[1] - x[1])
        .map(([n, v]) => `<div class="irow">${face(n)}<b>${esc(n)}</b><span class="ibond ${BOND_CLS(v)}">${BOND_WORD(v)}</span>${couple(n) ? '<span class="ilove">Showmance</span>' : ''}</div>`).join('');
  } else if (tab === 'allies') {
    body = H.alliances.length ? H.alliances.map(a => `<div class="ial"><div class="ialn">${esc(a.name)}</div><div class="ialm">${a.members.map(n => `<span>${face(n)}${esc(n)}${n === a.leader ? ' <em>leads</em>' : ''}</span>`).join('')}</div></div>`).join('')
      : '<div class="inone">No alliance in the house.</div>';
    if (H.gone.length) body += `<div class="isub">Broken up</div>${H.gone.map(n => `<div class="igone">${esc(n)}</div>`).join('')}`;
  } else if (tab === 'deals') {
    body = (H.deals.length ? H.deals.map(d => `<div class="irow">${face(d.a)}${face(d.b)}<b>${esc(d.a)} &amp; ${esc(d.b)}</b><span class="ibond friend">${d.tier === 'final' ? 'Ride to the final' : 'No votes, no call-outs'}</span></div>`).join('')
      : '<div class="inone">No deal standing.</div>')
      + (H.couples.length ? `<div class="isub">Couples</div>${H.couples.map(([a, b]) => `<div class="irow">${face(a)}${face(b)}<b>${esc(a)} &amp; ${esc(b)}</b><span class="ilove">Showmance</span></div>`).join('')}` : '')
      + (H.broken.length ? `<div class="isub">Broken</div>${H.broken.map(d => `<div class="igone">${esc(d.a)} &amp; ${esc(d.b)}</div>`).join('')}` : '');
  } else if (tab === 'rec') {
    const rows = H.players.map(n => [n, H.rec[n] || {}]).sort((x, y) => (y[1].daily + y[1].arenaW * 2) - (x[1].daily + x[1].arenaW * 2));
    // the stakes (ch/stakes.js): the bank, a skull (&#9760;) for each one earned, a cross while hurt
    body = `<div class="irec ihead"><span></span><b>Player</b><i>Dailies</i><i>Arena</i><i>Voted in</i><i>Votes</i><i>Bank</i></div>`
      + rows.map(([n, r]) => `<div class="irec">${face(n)}<b>${esc(n)}${r.skulls ? ` ${'&#9760;'.repeat(Math.min(3, r.skulls))}` : ''}${r.hurt ? ' &#10010;' : ''}</b><i>${r.daily}</i><i>${r.arenaW}-${r.arenaL}</i><i>${r.votedIn}</i><i>${r.votes}</i><i>${r.bank ? `$${Math.round(r.bank / 1000)}k` : '–'}</i></div>`).join('');
  }
  const note = tab === 'heads' ? '' : `<div class="inote">${R.si === R.E.screens.length - 1 ? 'As the episode ends.' : 'As the episode began.'}</div>`;
  I.innerHTML = `<h4>INTEL <button type="button" data-close>&times;</button></h4><div class="sub">What the house doesn't know.</div>`
    + `<div class="itabs">${ITABS.map(([k, l]) => `<button type="button" data-itab="${k}" class="${k === tab ? 'on' : ''}">${esc(l)}</button>`).join('')}</div><div class="list">${body}${note}</div>`;
}
function paintHud(R) { R.root.querySelector('.intelbtn')?.classList.remove('new'); }

// ── the villa map as a hub (the user, 2026-10-15: "it doesn't let me choose where I want to go") ──
// A map step offers the block's conversations; each runs from its first step to the step before the
// next scene starts. Next runs on from one into the next one not watched; the map is only where the
// viewer asks to go (its button). Watched ones are ticked; when all are watched the screen carries on.
function hubs(R) {
  if (R.hubs) return R.hubs;
  const steps = R.scr.steps;
  R.hubs = [];
  steps.forEach((st, i) => {
    if (!st.map) return;
    const starts = [...new Set([...st.map.rooms.flatMap(r => r.bubs || []), ...(st.map.isle || []).flatMap(r => r.bubs || []), ...st.map.later].map(b => b.go))].filter(g => g > i).sort((a, b) => a - b);
    const convs = starts.map(s => { let e = s + 1; while (e < steps.length && steps[e].sceneIdx == null && !steps[e].map && !steps[e].seg && !steps[e].card) e++; return { s, e: e - 1 }; });
    R.hubs.push({ at: i, convs, end: convs.length ? Math.max(...convs.map(c => c.e)) : i });
  });
  return R.hubs;
}
// What the viewer has watched, by episode and screen, on the page (a screen rebuilt by the pane is a new
// runner; the ticks must survive it: the user, 2026-10-15, "it doesn't say read when I read an event").
const seenStore = () => (typeof window !== 'undefined' ? (window._chxSeen ||= {}) : (globalThis._chxSeen ||= {}));
const seenOf = R => (seenStore()[`${R.root.dataset.ep}|${R.scr.id}`] ||= new Set());
function hubAt(R, idx) {
  for (const h of hubs(R)) {
    if (idx === h.at) return { h, conv: null };
    const c = h.convs.find(x => idx >= x.s && idx <= x.e);
    if (c) return { h, conv: c };
  }
  return null;
}
// where Next goes from here inside a hub, or null to step on as usual
function hubNext(R) {
  const H = hubAt(R, R.idx); if (!H) return null;
  const seen = seenOf(R);
  if (H.conv && R.idx < H.conv.e) return null;
  // the user, 2026-10-15: "it goes to the map for no reason, I just wanted a button". A finished
  // conversation runs straight on into the next one not watched (the ones after it first); the map is
  // only ever where the viewer asks to go (the Villa map button, or Back from a conversation's start).
  const after = H.conv ? H.h.convs.find(c => c.s > H.conv.s && !seen.has(c.s)) : null;
  const left = after || H.h.convs.find(c => !seen.has(c.s));
  if (left) return left.s;
  return H.h.end + 1 < R.scr.steps.length ? H.h.end + 1 : -1;
}
// ── going somewhere on the map, like a game: the map flies into the point clicked, then the scene arrives ──
function flyTo(R, el, then) {
  const fr = R.root.querySelector('.chx-frame').getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const x = ((r.left + r.width / 2 - fr.left) / fr.width) * 100, y = ((r.top + r.height - fr.top) / fr.height) * 100;
  R.root.style.setProperty('--zx', `${x.toFixed(1)}%`); R.root.style.setProperty('--zy', `${y.toFixed(1)}%`);
  stopAuto(R);
  R.root.classList.add('mzoom');
  setTimeout(() => {
    R.root.classList.remove('mzoom');
    then();
    R.root.classList.add('marrive');
    setTimeout(() => R.root.classList.remove('marrive'), 600);
  }, 520);
}
function setView(R, view, arrive, quiet = false) {
  const was = R.mview;
  R.mview = view;
  R.root.classList.toggle('mview-villa', view === 'villa');
  if (!quiet && was === 'villa' && view === 'isle') { R.root.classList.add('mleave'); setTimeout(() => R.root.classList.remove('mleave'), 600); }
  if (arrive) { R.root.classList.add('marrive'); setTimeout(() => R.root.classList.remove('marrive'), 600); }
}
function hint(R, text) {
  // a fresh element each time, so the fade plays again on every click
  R.root.querySelectorAll('.mhint').forEach(x => x.remove());
  const d = document.createElement('div'); d.className = 'mhint again'; d.textContent = text;
  R.root.querySelector('.chx-hud').append(d);
}
function paintHub(R) {
  const H = hubAt(R, R.idx); if (!H) return;
  const hud = R.root.querySelector('.chx-hud'); const seen = seenOf(R);
  if (H.conv) { seen.add(H.conv.s); hud.insertAdjacentHTML('beforeend', `<button type='button' class='tomap' data-go='${H.h.at}'>&#9664; Map</button>`); return; }
  hud.querySelectorAll('[data-go]').forEach(b => b.classList.toggle('seen', seen.has(Number(b.dataset.go))));
  const n = H.h.convs.filter(c => seen.has(c.s)).length;
  hud.insertAdjacentHTML('beforeend', `<div class='mcount'>${n} / ${H.h.convs.length} watched</div>`);
}
// The island: every part of this episode at the place it happens; a pin takes you there.
function isle(R, open) {
  const I = R.root.querySelector('.isle');
  if (!open) { I.classList.remove('open'); return; }
  const night = (R.scr.steps[R.idx]?.scene?.plate || R.stage.ST?.plate || '').includes('night');
  const MAP = CH_MARKS['map-day']?.m || [];
  const at = {};
  R.E.screens.forEach((s, si) => {
    const sc = s.steps.find(st => st.scene && (st.scene.island || st.scene.room))?.scene;
    const id = sc ? (sc.island || 'villa') : null;
    if (id && !/previously/i.test(s.label)) (at[id] ||= []).push({ si, label: s.label });
  });
  const here = Object.keys(at).find(id => at[id].some(x => x.si === R.si));
  I.style.backgroundImage = `url('assets/sets/ch/${night ? 'map-night' : 'map-day'}.webp')`;
  I.innerHTML = `<div class='ihead'>Blue Lagoon<small>Episode ${esc(R.E.row.num)} · where it happens</small></div><button type='button' class='iclose' data-close>Close &times;</button>`
    + Object.entries(at).map(([id, list]) => {
      const m = MAP.find(x => x.kind === 'spot' && x.id === id); if (!m) return '';
      return `<div class='ipin ${id === here ? 'here' : ''}' style='left:${m.u * 100}%;top:${m.v * 100}%'><i></i><div class='chips'>${list.map(x => `<span data-si='${x.si}' class='${x.si === R.si ? 'cur' : ''}'>${esc(x.label)}</span>`).join('')}</div></div>`;
    }).join('');
  I.classList.add('open');
}

// `sting`: the viewer moved here (a click, Play, a place on the map), so the step's sting plays;
// back, restart and a seek on the bar only bring the music to the moment (vp-ch-ep/sound.js).
function goTo(R, idx, forward, sting = forward) {
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
  paintHub(R);
  // on a map the dialogue box is not there; the map opens on the island, or where the viewer last was
  R.root.classList.toggle('on-map', !!steps[idx]?.map);
  if (steps[idx]?.map) setView(R, R.mview || 'isle', false, true); else R.root.classList.remove('mview-villa');
  if (steps[idx]?.know && !R.intelOpen) R.root.querySelector('.intelbtn')?.classList.add('new');
  intel(R); chapters(R); script(R);
  playStep(R.scr, idx, sting);
}
// The bar is one segment per scene (the user, 2026-10-15: "like in Total Drama, a bubble each time a scene
// switches"): as long as its scene, filling as it plays, ticked once watched, named on hover.
function segsOf(R) {
  if (R.segs) return R.segs;
  const steps = R.scr.steps;
  const starts = steps.map((x, i) => (i === 0 || x.scene || x.card ? i : -1)).filter(i => i >= 0);
  R.segs = starts.map((a, k) => {
    const z = starts[k + 1] ?? steps.length;
    const st = steps[a];
    const name = st.card ? `${st.card.k}: ${st.card.t}` : st.title || st.scene?.place || st.seg?.[1] || '';
    return { a, z, name };
  });
  return R.segs;
}
function progress(R) {
  const n = R.scr.steps.length;
  const box = R.root.querySelector('.pbar .segs');
  if (box) {
    const segs = segsOf(R);
    if (box.dataset.for !== R.scr.id) {
      box.dataset.for = R.scr.id;
      box.innerHTML = segs.map((g, k) => `<i data-k="${k}" style="flex:${g.z - g.a}" title="${esc(g.name)}"><b></b></i>`).join('') + '<span class="head"></span>';
    }
    const seen = seenOf(R);
    for (const g of segs) if (R.idx >= g.a && R.idx < g.z) seen.add(g.a);   // a scene you have been in is a scene you have seen
    box.querySelectorAll('i').forEach((el, k) => {
      const g = segs[k];
      const f = R.idx >= g.z ? 1 : R.idx < g.a ? 0 : (R.idx - g.a + 1) / (g.z - g.a);
      el.querySelector('b').style.width = `${f * 100}%`;
      el.classList.toggle('on', R.idx >= g.a && R.idx < g.z);
      el.classList.toggle('seen', seen.has(g.a));
    });
    const cur = segs.findIndex(g => R.idx >= g.a && R.idx < g.z);
    const el = box.querySelectorAll('i')[cur];
    const head = box.querySelector('.head');
    if (el && head) head.style.left = `${el.offsetLeft + el.offsetWidth * Math.min(1, (R.idx - segs[cur].a + 1) / (segs[cur].z - segs[cur].a))}px`;
  }
  const t = R.root.querySelector('.pbar .pt'); if (t) t.textContent = `${R.scr.label} · ${R.idx + 1} / ${n}`;
  const sp = R.root.querySelector('.pbtn.speed'); if (sp) sp.textContent = `x${speed()}`;
}
function chapters(R) {
  progress(R);
  const C = R.root.querySelector('.chapters');
  C.innerHTML = R.E.screens.map((s, i) => `<div class="chap ${i === R.si ? 'on' : ''}" data-i="${i}" title="${esc(s.label)}"><span>${esc(s.label)}</span><i><b style="width:${i < R.si ? 100 : i > R.si ? 0 : ((R.idx + 1) / s.steps.length * 100)}%"></b></i></div>`).join('');
  C.querySelectorAll('.chap').forEach(c => { c.onclick = e => { e.stopPropagation(); R.root.querySelector('.chx-chapmenu')?.classList.remove('open'); const i = Number(c.dataset.i); if (i !== R.si && typeof window.vpGoTo === 'function') window.vpGoTo(vpIndexOf(R, i)); }; });
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
    const t = s.rules ? `${s.rules.n}: the rules` : s.card ? `${s.card.k}: ${s.card.t}` : s.seg ? s.seg[1] : s.scene ? s.scene.place : '';
    return t ? `<div class="ln sc${c}" data-i="${i}">${esc(t)}</div>` : '';
  }).join('');
  L.querySelectorAll('.ln').forEach(l => { l.onclick = () => goTo(R, Number(l.dataset.i), false); });
  L.querySelector('.cur')?.scrollIntoView?.({ block: 'nearest' });
}

// ── controls ──────────────────────────────────────────────────────────
const holdFor = s => Math.min(9000, 1700 + String(s?.say?.[1] || s?.tj || s?.conf?.[1] || s?.dir || '').length * 38)
  + (s?.rules ? 5200 : 0) + (s?.seg ? 1600 : 0) + (s?.card ? 3600 : 0) + (s?.open ? 4200 : 0) + (s?.slam ? 1400 : 0) + (s?.map ? 2400 : 0);
// x1 or x2, for the whole episode (and the next ones): a per-viewer convenience
const speed = () => { try { return Number(localStorage.getItem('ch-vp-speed')) === 2 ? 2 : 1; } catch { return 1; } };
export function chxSpeed(el) {
  try { localStorage.setItem('ch-vp-speed', speed() === 2 ? '1' : '2'); } catch { /* per viewer */ }
  const R = runner(rootOf(el) || document.querySelector('.chx[data-ep]')); if (R) progress(R);
}
export function chxChapters(el) { rootOf(el)?.querySelector('.chx-chapmenu')?.classList.toggle('open'); }
function stopAuto(R) { R.auto = false; clearTimeout(R.timer); R.root.querySelector('.chx-auto')?.classList.remove('on'); }
/** A click on the picture: the next step, except on a map, where only a bubble or the Forward button moves on. */
export function chxFrame(el) {
  const R = runner(rootOf(el)); if (!R) return;
  // on a map the picture is the map: only its places, bubbles and buttons do anything
  if (R.scr.steps[R.idx]?.map) return;
  chxNext(el);
}
export function chxNext(el) {
  const R = runner(rootOf(el) || document.querySelector('.chx[data-ep]')); if (!R) return;
  const hn = R.idx >= 0 ? hubNext(R) : null;
  if (hn != null && hn >= 0) { goTo(R, hn, hn === R.idx + 1, true); return; }
  if (hn === -1 || R.idx >= R.scr.steps.length - 1) {
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
/** Go straight to a step of the screen showing (the art harness and the debug tab). */
export function chxGo(i) { const R = runner(document.querySelector('.chx[data-ep]')); if (R) { stopAuto(R); goTo(R, i, false); } }
export function chxRestart(el) { const R = runner(rootOf(el)); if (!R) return; stopAuto(R); goTo(R, 0, false); }
export function chxAuto(el) {
  const R = runner(rootOf(el) || document.querySelector('.chx[data-ep]')); if (!R) return;
  R.auto = !R.auto;
  R.root.querySelector('.chx-auto')?.classList.toggle('on', R.auto);
  // play stops at a map: the viewer picks (the user, 2026-10-15: "let me pick, then it chooses for me")
  const tick = () => { if (!R.auto) return; if (R.scr.steps[R.idx]?.map) { stopAuto(R); return; } chxNext(R.root); if (R.auto) R.timer = setTimeout(tick, holdFor(R.scr.steps[R.idx]) / speed()); };
  if (R.auto) R.timer = setTimeout(tick, holdFor(R.scr.steps[R.idx]) / speed()); else clearTimeout(R.timer);
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

if (typeof window !== 'undefined') Object.assign(window, { chxGo, chxFrame, chxNext, chxBack, chxRestart, chxAuto, chxIntel, chxTv, chxSwitchViewer, chxSpeed, chxChapters });
if (typeof document !== 'undefined') {
  // a screen opens on its first step; leaving it stops its Auto
  document.addEventListener('vp:screen', () => {
    setTimeout(() => {
      const root = document.querySelector('.chx[data-ep]');
      if (!root) return;
      const R = runner(root);
      if (R && R.idx < 0) goTo(R, 0, false, true);
    }, 0);
  });
  document.addEventListener('keydown', e => {
    const root = document.querySelector('.chx[data-ep]');
    if (!root || /input|textarea|select/i.test(e.target?.tagName || '')) return;
    if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); chxNext(root); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); chxBack(root); }
    else if (e.key === 'i' || e.key === 'I') chxIntel(root);
    else if (e.key === 'p' || e.key === 'P') chxAuto(root);
  }, true);
}
