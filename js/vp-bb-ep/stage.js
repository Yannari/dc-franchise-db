// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/stage.js — paint step N of a Big Brother screen
// ══════════════════════════════════════════════════════════════════════
//
// Ported from the approved mockup (mockup/mockup-bb-house-v2.html). `stageHtml`
// returns the WHOLE picture for "the first idx+1 steps have happened" (§6.5):
// Next, Back, Reveal all and a re-render all land on the same picture, and the
// one-shot business (a line typing, a pop, a toast, a key turning) plays only
// on a fresh step. Rooms are the Blender renders of the season's own house
// (tools/bb-house/house.py); seats, the nominations screen and the memory
// wall come from Blender's anchors (anchors.js).
import { playerAvatarUrl } from '../players.js';
import { ANCH } from './anchors.js';
import { HUNT_SPOTS } from './steps.js';

const ROOM_FILE = { kitchen: 'kitchen', ceremony: 'living', bedroom: 'bedroom', hoh: 'hoh', dr: 'dr', yard: 'yard', dining: 'dining' };
export const SEASON_DIR = { 'summer-of-temptation': 'temptation', 'machine-summer': 'machine', 'summer-of-mystery': 'mystery',
  'high-rollers': 'high-rollers', 'summer-camp': 'summer-camp', 'summer-school': 'summer-school' };
const V = 7;   // bump when the renders change, so a browser never shows a stale room
const roomUrl = (season, set) => `assets/bb/house/${season}/${ROOM_FILE[set] || set}-td-b.webp?v=${V}`;

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** For text between tags: a quotation mark needs no escaping there. */
export const escT = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PALETTE = ['#ec4899', '#6366f1', '#10b981', '#22c55e', '#f59e0b', '#3b82f6', '#eab308', '#f97316', '#ef4444', '#14b8a6', '#a855f7', '#84cc16', '#06b6d4', '#f43f5e', '#8b5cf6', '#0ea5e9'];
// A line reads faster when what matters stands out: the people in it, and the words of the game
// (the user, 2026-10-06: "the text… not stimulating enough"). Escapes, then marks.
const KW = /(?<![\w-])(Block Buster|Head of Household|Power of Veto|HOH|veto|(?:on|off) the block|evict(?:ed|ion)?|jury|jurors?|final (?:two|three)|backdoor|nominat\w*|target|pawn|alliance)(?![\w-])/gi;
export function emph(text, names = []) {
  let h = escT(text);
  const ns = [...new Set(names.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (ns.length) {
    const re = new RegExp(`(?<![\\w])(${ns.map(n => escT(n).replace(/[.*+?^${}()|[\]\\]/g, '\\export const col = n =>')).join('|')})(?![\\w])`, 'g');
    h = h.replace(re, '\u0001$1\u0002');
  }
  h = h.replace(KW, m => `<b class="kw">${m}</b>`);
  return h.replace(/\u0001/g, '<b class="kn">').replace(/\u0002/g, '</b>');
}
const namesOf = S => [...(S.cast || []).map(c => (Array.isArray(c) ? c[0] : c)), ...Object.keys(S.seated || {})];
export const col = n => { let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PALETTE[h % PALETTE.length]; };
const avatar = n => { try { return playerAvatarUrl(n) || ''; } catch { return ''; } };
export const img = (n, host = false) => {
  const u = host ? `assets/avatars/${String(n).toLowerCase()}.png` : avatar(n);
  return u ? `<img src="${esc(u)}" alt="" onerror="this.remove()">` : '';
};

export function eyeSvg(cls = 'eye') {
  const blades = Array.from({ length: 6 }, (_, i) => `<path d="M0 -9 L7.8 -4.5 L3 0 Z" transform="rotate(${i * 60})" fill="#0a2a3a" stroke="#22e1ff" stroke-width=".5" opacity=".95"/>`).join('');
  return `<svg class="${cls}" viewBox="-30 -18 60 36" aria-hidden="true">
    <defs><radialGradient id="irs${cls}" r="1"><stop offset="0" stop-color="#9ff6ff"/><stop offset=".45" stop-color="#22e1ff"/><stop offset="1" stop-color="#0a5cff"/></radialGradient></defs>
    <path d="M-28 0 C-15 -17 15 -17 28 0 C15 17 -15 17 -28 0Z" fill="#050b16" stroke="#cfe9ff" stroke-width="1.8"/>
    <g class="ring2"><circle r="13" fill="none" stroke="#22e1ff" stroke-opacity=".35" stroke-width=".6" stroke-dasharray="1.2 2.2"/></g>
    <circle r="11" fill="url(#irs${cls})"/>
    <g class="ring"><circle r="9.6" fill="none" stroke="#e8fdff" stroke-width=".7" stroke-dasharray="5 2.6" opacity=".8"/></g>
    <g class="pup">${blades}<circle r="3.1" fill="#02060c"/></g>
    <circle cx="4" cy="-4.4" r="1.7" fill="#fff" opacity=".9"/></svg>`;
}
const MEDAL = `<svg viewBox="0 0 60 80"><defs><radialGradient id="bbxmg" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff4c2"/><stop offset=".5" stop-color="#f5c542"/><stop offset="1" stop-color="#8a6010"/></radialGradient></defs>
  <path d="M17 0 L30 24 L43 0" fill="none" stroke="#c9961e" stroke-width="3.2"/><circle cx="30" cy="50" r="26" fill="url(#bbxmg)"/>
  <text x="30" y="46" text-anchor="middle" font-family="Chakra Petch" font-weight="700" font-size="6.5" fill="#3d2a00" letter-spacing="1">POWER OF</text>
  <text x="30" y="59" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="14" fill="#3d2a00" letter-spacing="1">VETO</text></svg>`;

// ── the week so far ────────────────────────────────────────────────────
/** Everything settled by step `idx` of screen `si`: earlier screens count as watched in full. */
// Screens that cut between rooms with `scene` markers on their steps.
const SCENE_KINDS = new Set(['houselife', 'movein', 'final-cut', 'jury-q', 'closing', 'jury-vote', 'afp', 'reunion', 'final-part']);
export function ledgerAt(screens, si, idx) {
  const S0 = screens[si] || screens[0] || {};
  const L = { status: {}, nom: [], veto: null, out: [], votes: null, vetoPlay: [], ballots: [], revealed: [], hoh: null, moves: [], stances: {},
    spent: [], held: [], runs: {}, stamps: {}, safe: [], plus: null, bill: null, passed: null, shut: false,
    chain: [], snubs: [], leftover: [], looks: {}, heat: 0, found: null, secret: false, boxes: {} };
  for (const n of S0.priorOut || []) { L.status[n] = 'out'; L.out.push(n); }
  for (let s = 0; s <= si; s++) {
    const steps = screens[s].steps; const upto = s < si ? steps.length - 1 : idx;
    for (const n of screens[s].rail?.spent || []) if (!L.spent.includes(n)) L.spent.push(n);
    if (s === si && screens[s].hunt) L.heat = screens[s].hunt.heat || 0;
    for (let i = 0; i <= upto; i++) {
      const st = steps[i];
      for (const n of st.swipe || []) if (!L.spent.includes(n)) L.spent.push(n);
      if (st.hold && !L.held.includes(st.hold)) L.held.push(st.hold);
      if (st.shut) L.shut = true;
      if (st.run) L.runs[st.run[0]] = st.run;
      if (st.stamp) L.stamps[st.stamp[0]] = st.stamp[1];
      if (st.safe && !L.safe.includes(st.safe)) L.safe.push(st.safe);
      // safe off the block (the Block Buster, read out live): no longer a nominee
      if (st.safe && L.nom.includes(st.safe) && st.big) { L.nom = L.nom.filter(n => n !== st.safe); if (L.status[st.safe] === 'nom') L.status[st.safe] = ''; }
      if (st.plus) { L.plus = st.plus; if (!L.safe.includes(st.plus)) L.safe.push(st.plus); }
      if (st.bill) L.bill = st.bill;
      if (st.passed) L.passed = st.passed;
      if (st.chainStart && !L.safe.includes(st.chainStart)) L.safe.push(st.chainStart);
      if (st.link && !L.safe.includes(st.link[1])) L.safe.push(st.link[1]);
      if (s === si && st.chainStart) L.chain = [st.chainStart];
      if (s === si && st.link) { if (!L.chain.length && screens[s].chainRun?.starter) L.chain = [screens[s].chainRun.starter]; L.chain.push(st.link[1]); }
      if (s === si && st.snub) L.snubs.push(st.snub);
      if (st.leftover) L.leftover = st.leftover.slice();
      if (s === si && st.look) (L.looks[st.look[1]] ||= []).push(st.look[0]);
      if (s === si && st.seen) L.heat = Math.min(4, L.heat + 1);
      if (s === si && st.found) L.found = { name: st.found[0], place: st.found[1] };
      if (s === si && st.secret) L.secret = true;
      if (s === si && st.open) L.boxes[st.open[1]] = { holder: st.open[0], kind: st.open[2], item: st.open[3] };
      if (s === si && st.swap) {
        const [thief, victim, got, gave] = st.swap;
        if (L.boxes[got]) L.boxes[got].holder = thief;
        if (L.boxes[gave]) L.boxes[gave].holder = victim;
      }
      if (st.hoh) { if (L.hoh && L.status[L.hoh] === 'hoh') L.status[L.hoh] = ''; L.hoh = st.hoh; L.status[st.hoh] = 'hoh'; }
      if (st.nom) { L.nom.forEach(n => { if (L.status[n] === 'nom') L.status[n] = ''; }); L.nom = st.nom.slice(); st.nom.forEach(n => { L.status[n] = 'nom'; }); }
      if (st.veto) L.veto = st.veto;
      if (st.vetoPlay && s === si) L.vetoPlay.push(...st.vetoPlay);
      if (st.reveal && s === si) L.revealed.push(st.reveal);
      if (st.ballot && s === si) L.ballots.push(st.ballot);
      if (st.key && s === si) (L.keys ||= []).push(st.key);
      if (st.keyIn && s === si) (L.keyIn ||= []).push(st.keyIn);
      if (s === si && st.scene) L.why = st.scene.why || null;
      if (s === si && st.why) L.why = st.why;
      if (st.stance && s === si) L.stances[st.stance[0]] = st.stance;
      if (st.votes && s === si) L.votes = st.votes;
      if (st.out) { L.out.push(st.out); L.status[st.out] = 'out'; L.nom.forEach(n => { if (n !== st.out) L.status[n] = ''; }); }
      (st.pops || []).forEach(p => L.moves.push(p));
    }
  }
  return L;
}

// ── where people are ──────────────────────────────────────────────────
function seatsAt(S, i) {
  const seated = { ...(S.seated || {}) };
  for (let j = 0; j <= i; j++) Object.assign(seated, S.steps[j]?.seat || {});
  return seated;
}
function seatOf(S, seated, n) {
  const a = ANCH[S.set]; const id = seated[n];
  if (!a || !id) return null;
  if (id === 'head') return { at: a.head.at, w: a.head.w * 1.25 };
  if (id === 'stand2') { const t = a.seats.stand; return { at: [100 - t.at[0], t.at[1], t.at[2]], w: t.w }; }
  // a third nominee's chair (the Block Buster, a third seat): the render has two, so the third
  // stands between them, a step behind (the user, 2026-10-06: "only 2 chairs even when there's 3")
  if (id === 'N0' && a.seats?.N1) { const t = a.seats.N1; return { at: [50, t.at[1] + 1.4, t.at[2] - 0.3], w: t.w * 0.96 }; }
  const t = a.seats[id];
  return t ? { at: t.at, w: t.w * (S.set === 'dining' ? 0.72 : 1.0) } : null;
}
const zOf = a => Math.round(100 - a.at[2] * 10);
function castAt(S, i) {
  if (S.seated) {
    const gone = new Set(S.steps.slice(0, i + 1).filter(x => x.exit).map(x => x.exit));
    const seated = seatsAt(S, i);
    return Object.keys(seated).filter(n => !gone.has(n) && seatOf(S, seated, n)).map(n => [n, seatOf(S, seated, n).at[0]]);
  }
  for (let j = i; j >= 0; j--) if (S.steps[j]?.at) return S.steps[j].at;
  return S.cast || [];
}
function chipsFor(n, L) {
  const c = [];
  if (L.status[n] === 'hoh') c.push('<span class="chipx hoh">HOH</span>');
  if (L.out.includes(n)) c.push('<span class="chipx out">Evicted</span>');
  else if (L.nom.includes(n)) c.push('<span class="chipx nom">Nom</span>');
  if (L.veto === n) c.push('<span class="chipx veto">Veto</span>');
  if (L.plus === n) c.push('<span class="chipx plus">Plus one</span>');
  else if (L.safe.includes(n)) c.push('<span class="chipx safe">Safe</span>');
  else if (L.leftover.includes(n) && !L.nom.includes(n)) c.push('<span class="chipx nom">Not chosen</span>');
  else if (L.spent.includes(n) && L.status[n] !== 'hoh') c.push('<span class="chipx spent">Pass spent</span>');
  return c.join('');
}
function camOf(S, i) {
  const st = S.steps[i];
  if (!st || !st.push || !st.by || S.set === 'suite') return 'none';
  if (st.k === 'host') return 'scale(1.18)|20% 30%';
  if (st.k === 'dr') return 'scale(1.18)|50% 42%';
  if (S.seated) { const seated = seatsAt(S, i); const a = seatOf(S, seated, st.by); if (a) return `scale(1.3)|${a.at[0]}% ${100 - a.at[1] - a.w * 1.1}%`; }
  const p = castAt(S, i).find(([n]) => n === st.by);
  return `scale(1.22)|${p ? p[1] : 50}% 58%`;
}
export const camStyle = c => c === 'none' ? 'transform:none' : `transform:${c.split('|')[0]};transform-origin:${c.split('|')[1]}`;

function tileHtml(n, x, cls, L, extra = '', more = '', fx = '') {
  const ry = ((50 - x) * 0.28).toFixed(1);
  return `<div class="gt ${cls}" style="left:${x}%;--c:${col(n)};--ry:${ry}deg;${more}">${fx}
    <div class="tile"><span class="i">${esc(String(n)[0])}</span>${img(n)}${extra}</div>
    <div class="plate"><b>${esc(n)}</b>${chipsFor(n, L)}</div></div>`;
}
const DRRING = `<svg viewBox="-100 -100 200 200"><circle r="78" fill="none" stroke="#22e1ff" stroke-width="2.2" opacity=".85"/><circle r="86" fill="none" stroke="#a593ff" stroke-width="1.2" stroke-dasharray="3 6" opacity=".7"/></svg>`;

function setDiv(set, season) {
  return `<div class="set set-${set} photo" style="background-image:url('${roomUrl(season, set)}')"><div class="floor"></div></div>`;
}

function memoryFrames(panels, n) {
  const out = [];
  const per = [Math.ceil(n / 2), Math.floor(n / 2)];
  panels.forEach((p, pi) => {
    const k = per[pi], rows = Math.ceil(k / 2);
    const pitch = (p.h * 0.92) / (rows + 0.5);
    const fh = pitch * 0.97, fw = Math.min(p.w * 0.42, fh * 0.8 * 9 / 16 * 1.25);
    for (let j = 0; j < k; j++) {
      const c = j % 2, row = Math.floor(j / 2);
      const top = p.y + p.h - p.h * 0.04 - row * pitch - (c ? pitch / 2 : 0);
      out.push({ x: p.x + p.w * (c ? 0.73 : 0.27) - fw / 2, y: top - fh, w: fw, h: fh });
    }
  });
  return out;
}
function wallHtml(S, L, st, fresh) {
  const A = ANCH[S.set];
  if (!A?.panels) return '';
  const names = S.wall || [];
  const frames = memoryFrames(A.panels, names.length);
  return `<div class="wall onwall">${names.map((n, i) => {
    const fr = frames[i]; if (!fr) return '';
    const s = L.status[n] || '';
    const isFresh = fresh && st && (st.out === n || (st.nom || []).includes(n));
    return `<div class="mf ${s} ${i % 3 === 2 ? 'dark' : ''} ${isFresh ? 'fresh' : ''}" style="left:${fr.x}%;bottom:${fr.y}%;width:${fr.w}%;height:${fr.h}%;--c:${col(n)}"><div class="mfin">${img(n)}</div>${s === 'hoh' ? '<span class="mft">HOH</span>' : ''}</div>`;
  }).join('')}</div>`;
}
function nomScreenHtml(S, L, st, fresh) {
  const r = ANCH.dining.screen;
  const n = S.steps.filter(x => x.reveal).length;
  const slots = Array.from({ length: n }, (_, i) => {
    const who = L.revealed[i];
    const flip = fresh && st && st.reveal && who === st.reveal;
    return `<div class="nslot ${who ? 'on' : ''} ${flip ? 'flip' : ''}">${who ? `${img(who)}<b>${esc(who)}</b>` : '<i>?</i>'}</div>`;
  }).join('');
  const b = ANCH.dining.box;
  const keys = Array.from({ length: n }, (_, i) => {
    const turned = i < L.revealed.length;
    const now = fresh && st && st.reveal && i === L.revealed.length - 1;
    return `<span class="nkey ${turned ? 'turned' : ''} ${now ? 'now' : ''}"><b>BB</b></span>`;
  }).join('');
  return `<div class="nomscreen" style="left:${r.x}%;bottom:${r.y}%;width:${r.w}%;height:${r.h}%"><div class="nhead">NOMINATIONS</div><div class="nslots">${slots}</div></div>
    <div class="nkeys" style="left:${b.at[0]}%;bottom:${(b.at[1] * 0.5625).toFixed(2)}cqw;width:${(b.w * 1.15).toFixed(2)}cqw;z-index:${zOf(b) + 2}">${keys}</div>`;
}

// ── the Safety Suite's objects (Phase 7) ───────────────────────────────
const PASSEYE = `<svg class="pe" viewBox="-30 -18 60 36"><path d="M-28 0 C-15 -17 15 -17 28 0 C15 17 -15 17 -28 0Z" fill="none" stroke="#22e1ff" stroke-width="3"/><circle r="9" fill="#22e1ff"/><circle r="3" fill="#02060c"/></svg>`;
const DOOR = `<svg viewBox="0 0 120 200"><rect x="6" y="6" width="80" height="190" rx="3" fill="#0b1018" stroke="#f5c542" stroke-width="2.4"/>
  <rect x="12" y="12" width="68" height="178" rx="2" fill="#e8ecf3" opacity=".16"/>
  <text x="46" y="40" text-anchor="middle" font-family="Chakra Petch" font-weight="700" font-size="8" fill="#f5c542" letter-spacing="2">SAFETY</text>
  <text x="46" y="51" text-anchor="middle" font-family="Chakra Petch" font-weight="700" font-size="8" fill="#f5c542" letter-spacing="2">SUITE</text>
  <rect x="94" y="88" width="20" height="34" rx="3" fill="#121a26" stroke="#5c6b80" stroke-width="1"/><rect x="98" y="94" width="12" height="3" rx="1" fill="#22e1ff" opacity=".6"/>
  <circle class="lamp" cx="104" cy="112" r="3.6" fill="#5c6b80"/><circle class="scan2" cx="104" cy="112" r="5" fill="none" stroke="#12e08a" stroke-width="1" opacity="0" style="transform-origin:104px 112px"/></svg>`;
function clockSvg(left, ok) {
  const C = 2 * Math.PI * 40;
  const ticks = Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-44" x2="0" y2="-40" stroke="#1a2233" stroke-width="1.4" transform="rotate(${i * 30})"/>`).join('');
  return `<svg class="sclock" viewBox="-50 -50 100 100"><circle r="46" fill="#ffffff" stroke="#1a2233" stroke-width="1.6"/>${ticks}
    <circle class="arc" r="40" fill="none" stroke="${ok ? '#f5c542' : '#22b5ff'}" stroke-width="5" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - left)).toFixed(1)}" transform="rotate(-90)" stroke-linecap="round"/>
    <text y="-6" text-anchor="middle" font-family="Chakra Petch" font-weight="700" font-size="7" fill="#1a2233" letter-spacing="1.5">${ok ? 'BEATEN' : 'THE CLOCK'}</text>
    <text y="10" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="15" fill="${ok ? '#b8860b' : '#1a2233'}">${ok ? 'SAFE' : `0${Math.max(0, Math.round(5 - left * 5))}:00`}</text></svg>`;
}
/** A twist's rules, read out by Big Brother: one row lights per line (the screen's `rules`). */
function rulesHtml(S, n, fresh) {
  return `<div class="rules"><div class="rt">${esc(S.rulesTitle || 'HOW IT WORKS')}</div>${(S.rules || []).map(([a, b], i) =>
    `<div class="rr ${i < n ? 'on' : ''} ${fresh && i === n - 1 ? 'now' : ''}"><span class="rk">${i + 1}</span><b>${a}</b><span>${b}</span></div>`).join('')}</div>`;
}
const passHtml = (n, cls) => `<div class="pass ${cls}">${PASSEYE}<i class="chipline"></i>${img(n)}<span class="pn">${esc(n)}</span></div>`;
function railHtml(S, L, st, fresh) {
  const lit = fresh && st && st.railLit;
  return `<div class="rail ${lit ? 'lit' : ''}"><span class="rh">PASSES · ONE PER SEASON</span>${(S.rail.names || []).map(n => {
    const cls = n === S.rail.hoh ? 'na' : L.spent.includes(n) ? 'spent' : L.held.includes(n) ? 'held' : '';
    const now = fresh && st && ((st.swipe || []).includes(n) || st.hold === n);
    return passHtml(n, `${cls} ${now ? 'now' : ''}`);
  }).join('')}</div>`;
}
function billHtml(L, st, fresh) {
  const now = fresh && st && st.bill;
  return `<div class="bill ${now ? 'fresh' : 'flip'}"><div class="in"><div class="face front">THE PRICE</div>
    <div class="face back"><div><small>PLUS ONE PAYS</small><b>${esc(L.bill)}</b></div></div></div></div>`;
}
function suiteObjects(S, L, st, idx, fresh) {
  let h = '';
  if (S.door) {
    const ping = fresh && st && (st.swipe || []).length;
    h += `<div class="obj door ${L.shut ? 'shut' : 'go'} ${ping ? 'ping' : ''}">${DOOR}</div>`;
  }
  if (S.set === 'suite' && idx >= 0) {
    const done = Object.keys(L.runs).filter(n => S.runners.some(([m]) => m === n)).length;
    h += clockSvg(Math.min(1, done / Math.max(1, S.runners.length)), L.safe.some(n => S.runners.some(([m]) => m === n)));
    h += `<div class="cols">${S.runners.map(([n, x]) => {
      const r = L.runs[n]; const now = fresh && st && st.run && st.run[0] === n;
      return `<div class="col ${r ? r[2] : ''} ${now ? 'grow' : ''}" style="left:${x}%"><div class="fill" style="--h:${r ? r[1] : 0}%"></div></div>`;
    }).join('')}</div><div class="clockline"><b>THE CLOCK</b></div>`;
    for (const [n, x] of S.runners) {
      const k = L.stamps[n]; if (!k) continue;
      const now = fresh && st && st.stamp && st.stamp[0] === n;
      h += `<div class="stamp ${k} ${now ? 'fresh' : ''}" style="--x:${x}%">${k === 'ok' ? 'SAFE' : k === 'slow' ? 'TOO SLOW' : 'SHORT'}</div>`;
    }
  }
  return h;
}

// ── the Chain of Safety's line of links (Phase 7) ──────────────────────
const LINK = `<svg class="lk" viewBox="0 0 24 12"><rect x="1" y="2" width="12" height="8" rx="4" fill="none" stroke="#f5c542" stroke-width="2"/><rect x="11" y="2" width="12" height="8" rx="4" fill="none" stroke="#f5c542" stroke-width="2"/></svg>`;
function chainHtml(S, L, st, fresh) {
  const run = S.chainRun;
  const order = L.chain.length ? L.chain : (run.starter ? [run.starter] : []);
  const waiting = (run.pool || []).filter(n => !order.includes(n));
  const newest = fresh && st && (st.link || st.chainStart) ? order.at(-1) : null;
  const holder = order.at(-1);
  const cells = order.map((n, i) => `${i ? LINK : ''}<div class="cl ${n === newest ? 'now' : ''} ${n === holder && !L.leftover.length ? 'hold' : ''}" style="--c:${col(n)}">${img(n)}<span class="cn">${i + 1}</span><b>${esc(n)}</b></div>`).join('');
  const wait = waiting.map(n => `<div class="cw ${L.leftover.includes(n) ? 'left' : ''}" style="--c:${col(n)}">${img(n)}<b>${esc(n)}</b></div>`).join('');
  return `<div class="chainbar"><span class="ch">THE CHAIN · ${order.length} SAFE</span><div class="cls">${cells}</div>
    <div class="cwr"><span class="ch2">${L.leftover.length ? 'CHOSEN BY NOBODY' : `STILL WAITING · ${waiting.length}`}</span>${wait}</div></div>`;
}

// ── the Hidden Power's map of the house (Phase 7) ──────────────────────
function huntHtml(S, L, st, fresh) {
  const cells = HUNT_SPOTS.map(([id, name]) => {
    const looked = L.looks[id] || [];
    const isIt = id === S.hunt.place;
    const found = L.found && L.found.place === id;
    const now = fresh && st && ((st.look && st.look[1] === id) || (st.found && st.found[1] === id));
    const cls = [found ? 'found' : '', isIt && L.secret && !found ? 'secret' : '', now ? 'now' : ''].join(' ');
    const who = found ? `<span class="hf" style="--c:${col(L.found.name)}">${img(L.found.name)}</span>`
      : looked.map(n => `<span class="hl" style="--c:${col(n)}">${img(n)}</span>`).join('');
    const tag = found ? 'FOUND · ONLY YOU KNOW' : isIt && L.secret ? 'IT WAS HERE' : looked.length ? 'NOTHING' : '';
    return `<div class="hc ${cls}"><b>${esc(name)}</b><div class="hw">${who}</div>${tag ? `<i>${tag}</i>` : ''}</div>`;
  }).join('');
  const bars = Array.from({ length: 4 }, (_, i) => `<span class="${i < L.heat ? 'on' : ''}"></span>`).join('');
  return `<div class="huntmap"><div class="hh"><span>WHERE COULD IT BE</span><span class="hb">THE HOUSE BELIEVES ${bars}</span></div><div class="hg">${cells}</div></div>`;
}

// ── Prizes and Punishments' table of boxes (Phase 7) ──────────────────────
const GIFT = `<svg viewBox="0 0 40 40"><rect x="4" y="14" width="32" height="22" rx="3" fill="#1d3a66" stroke="#22e1ff" stroke-opacity=".6"/>
  <rect x="2" y="9" width="36" height="7" rx="2" fill="#24497f" stroke="#22e1ff" stroke-opacity=".6"/><rect x="18" y="9" width="4" height="27" fill="#f5c542"/>
  <path d="M20 9 C14 2 8 6 13 9 Z M20 9 C26 2 32 6 27 9 Z" fill="#f5c542"/></svg>`;
function pxHtml(S, L, st, fresh) {
  const boxes = Array.from({ length: S.px.boxes }, (_, i) => {
    const no = i + 1; const b = L.boxes[no];
    const now = fresh && st && ((st.open && st.open[1] === no) || (st.swap && (st.swap[2] === no || st.swap[3] === no)));
    if (!b) return `<div class="pxb"><span class="pn">${no}</span>${GIFT}</div>`;
    return `<div class="pxb open ${b.kind} ${now ? 'now' : ''}"><span class="pn">${no}</span>
      <span class="pi">${b.kind === 'veto' ? 'POWER OF VETO' : esc(b.item)}</span>
      <span class="ph" style="--c:${col(b.holder)}">${img(b.holder)}</span><b>${esc(b.holder)}</b></div>`;
  }).join('');
  return `<div class="pxtable"><span class="pt">THE BOXES · ONE HOLDS THE VETO</span><div class="pxr">${boxes}</div></div>`;
}

// ── Team America's mission card (Phase 7) ──────────────────────────────
function teamHtml(S, L, st, fresh, idx) {
  const T = S.team || {};
  const seen = S.steps.slice(0, idx + 1);
  const done = seen.find(x => x.taDone)?.taDone, noticed = seen.some(x => x.taNoticed);
  const faces = (T.members || []).map(n => `<span class="taf" style="--c:${col(n)}" title="${esc(n)}">${img(n)}</span>`).join('');
  return `<div class="taboard ${done || ''}"><span class="tah">TEAM AMERICA · MISSION ${T.number || ''}</span><div class="tar">${faces}</div>`
    + `<b>${esc(T.name || '')}</b><i>${done === 'done' ? 'COMPLETE' : done === 'failed' ? 'FAILED' : 'IN PLAY'}${noticed ? ' · NOTICED' : ''}</i></div>`;
}

// ── Move-in day: the wall of frames filling ────────────────────────────
function moveInHtml(S, L, st, fresh, idx) {
  const M = S.movein || {};
  const seen = new Set(S.steps.slice(0, idx + 1).filter(x => x.miIn).flatMap(x => [].concat(x.miIn)));
  const tiles = (M.arrivals || []).map(n => {
    if (!seen.has(n)) return '<span class="mif empty">?</span>';
    const now = fresh && [].concat(st?.miIn || []).includes(n);
    return `<span class="mif ${now ? 'now' : ''}" style="--c:${col(n)}" title="${esc(n)}">${img(n)}</span>`;
  }).join('');
  return `<div class="miboard"><span class="mih">IN THE HOUSE · ${seen.size} OF ${(M.arrivals || []).length}</span><div class="mir">${tiles}</div></div>`;
}

// ── The White Locust's call-out chain (Phase 7) ────────────────────────
function locustHtml(S, L, st, fresh, idx) {
  const seen = S.steps.slice(0, idx + 1);
  const safe = seen.find(x => x.wlSafe)?.wlSafe;
  const state = new Map();
  for (const x of seen) if (x.wlRound) state.set(x.wlRound[0], x.wlRound);
  const tile = (n, cls, tag) => `<div class="bkt ${cls} ${fresh && (st?.wlRound?.[0] === n || st?.wlSafe === n) ? 'now' : ''}"><span class="bkf" style="--c:${col(n)}">${img(n)}</span><b>${esc(n)}</b><i>${tag}</i></div>`;
  const tiles = [safe ? tile(safe, 'back', 'SAFE') : '', ...[...state.values()].map(([n, s, lim, t]) =>
    tile(n, s === 'out' ? 'out' : s === 'made' ? '' : 'champ', s === 'up' ? `${lim}s ON THE CLOCK` : s === 'made' ? `${t}s / ${lim}s` : 'OUT'))].join('');
  return `<div class="bkboard"><span class="bkh">THE CALL-OUT CHAIN</span><div class="bkr">${tiles || '<span class="bkh">PLAYING FOR SAFETY</span>'}</div></div>`;
}

// ── Battle Back's field (Phase 7) ──────────────────────────────────────
function battleBackHtml(S, L, st, fresh, idx) {
  const B = S.battleback || {};
  const seen = S.steps.slice(0, idx + 1);
  const out = new Set(seen.filter(x => x.bkOut).map(x => x.bkOut));
  const champ = seen.find(x => x.bkChamp)?.bkChamp, back = seen.find(x => x.bkBack)?.bkBack;
  const tile = (n, cls = '') => {
    const now = fresh && (st?.bkOut === n || st?.bkWin === n || st?.bkBack === n || st?.bkChamp === n);
    const tag = n === back ? 'BACK IN' : out.has(n) ? 'OUT' : cls === 'champ' ? 'CHAMPION' : 'EVICTED';
    return `<div class="bkt ${cls} ${n === back ? 'back' : out.has(n) ? 'out' : ''} ${now ? 'now' : ''}"><span class="bkf" style="--c:${col(n)}">${img(n)}</span><b>${esc(n)}</b><i>${tag}</i></div>`;
  };
  return `<div class="bkboard"><span class="bkh">BATTLE BACK</span><div class="bkr">${(B.field || []).map(n => tile(n)).join('')}${champ ? `<span class="bkvs">VS</span>${tile(champ, 'champ')}` : ''}</div></div>`;
}

// ── The second veto's block (Phase 7) ──────────────────────────────────
function veto2Html(S, L, st, fresh, idx) {
  const V = S.veto2 || {};
  const seen = S.steps.slice(0, idx + 1);
  const saved = seen.find(x => x.v2Save)?.v2Save, rep = seen.find(x => x.v2Rep)?.v2Rep;
  const chip = (n, cls) => `<div class="v2c ${cls} ${fresh && (st?.v2Save === n || st?.v2Rep === n) ? 'now' : ''}"><span class="v2f" style="--c:${col(n)}">${img(n)}</span><b>${esc(n)}</b><i>${cls === 'off' ? 'SAVED' : cls === 'new' ? 'REPLACEMENT' : 'NOMINATED'}</i></div>`;
  const N = S.nightmare;
  const off = N && seen.some(x => x.nmOff), on = N && seen.some(x => x.nmOn);
  const chips = N ? (N.voided || []).map(n => chip(n, off ? 'off' : '')).join('') + (on ? (N.named || []).map(n => chip(n, 'new')).join('') : '')
    : (V.before || []).map(n => chip(n, n === saved ? 'off' : '')).join('') + (rep ? chip(rep, 'new') : '');
  return `<div class="v2board"><span class="v2h">THE BLOCK${seen.some(x => x.v2Kept) ? ' · UNCHANGED' : ''}</span><div class="v2r">${chips}</div></div>`;
}

// ── The Coin of Destiny's table (Phase 7) ──────────────────────────────
const COIN_SVG = `<svg viewBox="0 0 20 20" class="cn"><circle cx="10" cy="10" r="8.5" fill="#f5c542" stroke="#a57c12" stroke-width="1.4"/><circle cx="10" cy="10" r="5.6" fill="none" stroke="#a57c12" stroke-width="1"/></svg>`;
function coinHtml(S, L, st, fresh, idx) {
  const C = S.coin || {};
  const seen = S.steps.slice(0, idx + 1);
  const ins = seen.filter(x => x.coinIn).map(x => x.coinIn);
  const shorts = seen.filter(x => x.coinShort).map(x => x.coinShort);
  const win = seen.find(x => x.coinWin)?.coinWin;
  const call = seen.find(x => x.coinCall)?.coinCall;
  const tile = (n, cls) => {
    const now = fresh && (st?.coinIn === n || st?.coinShort === n || st?.coinWin === n);
    return `<div class="ct ${cls} ${n === win ? 'win' : ''} ${now ? 'now' : ''}"><span class="ctf" style="--c:${col(n)}">${img(n)}</span><b>${esc(n)}</b><i>${cls === 'short' ? 'CANNOT PAY' : n === win ? 'HOLDS IT' : 'BOUGHT IN'}</i></div>`;
  };
  const tiles = [...ins.map(n => tile(n, 'in')), ...shorts.map(n => tile(n, 'short'))].join('') || '<div class="ce">nobody at the table yet</div>';
  const result = call ? `<div class="cres ${call}">${COIN_SVG}<b>${call === 'right' ? 'CALLED RIGHT' : 'CALLED WRONG'}</b></div>` : '';
  return `<div class="coinboard"><span class="ch2">${COIN_SVG} THE COIN OF DESTINY</span><div class="ctr">${tiles}${result}</div></div>`;
}

// ── A power, played: the card (Phase 7) ───────────────────────────────
function powerCardHtml(S, L, st, fresh, idx) {
  const P = S.power || {};
  const mark = S.steps.slice(0, idx + 1).filter(x => x.pwMark).at(-1)?.pwMark;
  return `<div class="expcard live ${mark ? 'played' : ''} ${fresh && st?.pwMark ? 'now' : ''}"><span class="eh">${mark ? 'PLAYED' : 'A POWER'}</span>`
    + `<b>${esc(P.name || '')}</b><i>held by ${esc(P.holder || '')}</i></div>`;
}

// ── A power never played: the card (Phase 7) ───────────────────────────
function expiredHtml(S, L, st, fresh, idx) {
  const card = S.steps.slice(0, idx + 1).filter(x => x.expCard).at(-1)?.expCard;
  if (!card) return '';
  const [a, power, part] = card;
  return `<div class="expcard ${fresh && st?.expCard ? 'now' : ''}"><span class="eh">${part === 'evicted' ? 'LEFT WITH THEM' : part === 'kept' ? 'KEPT IN A POCKET' : 'NEVER PLAYED'}</span>`
    + `<b>${esc(power || '')}</b><i>held by ${esc(a)}</i></div>`;
}

// ── The Whacktivity's corridor of doors (Phase 7) ──────────────────────
function whackHtml(S, L, st, fresh, idx) {
  const W = S.whack || {};
  const seen = S.steps.slice(0, idx + 1);
  const picked = new Set(seen.filter(x => x.whPick != null).map(x => x.whPick));
  const openAt = seen.find(x => x.whOpen != null)?.whOpen;
  const win = seen.find(x => x.whWin)?.whWin, miss = seen.find(x => x.whMiss)?.whMiss;
  const doors = (W.rooms || []).map((r, i) => {
    const shown = picked.has(i);
    const state = openAt == null ? '' : openAt === i ? 'open' : 'shut';
    const now = fresh && (st?.whPick === i || st?.whOpen === i);
    const faces = shown ? (r.entrants.length ? r.entrants.map(n => `<span class="whf ${n === win ? 'win' : ''} ${n === miss ? 'miss' : ''}" style="--c:${col(n)}" title="${esc(n)}">${img(n)}</span>`).join('') : '<em>NOBODY</em>') : '';
    return `<div class="wd ${state} ${now ? 'now' : ''}"><span class="wdn">DOOR ${i + 1}</span><b>${esc(r.power)}</b><div class="whr">${faces}</div><i>${state === 'shut' ? 'DOES NOT OPEN' : state === 'open' ? (win ? `${esc(win)} WINS` : miss ? 'NOT BEATEN' : 'OPEN') : ''}</i></div>`;
  }).join('');
  return `<div class="whboard"><span class="whh">THE WHACKTIVITY</span><div class="wdr">${doors}</div></div>`;
}

// ── The Interrogation's tally of names (Phase 7) ───────────────────────
function interroHtml(S, L, st, fresh, idx) {
  const seen = S.steps.slice(0, idx + 1);
  const asked = seen.filter(x => x.intRoom).length;
  const tally = new Map();
  for (const x of seen) if (x.intPoint) tally.set(x.intPoint, (tally.get(x.intPoint) || 0) + 1);
  const named = seen.find(x => x.intName != null)?.intName;
  const end = seen.find(x => x.intEnd)?.intEnd;
  const top = Math.max(1, ...tally.values());
  const rows = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, c]) => {
    const now = fresh && st?.intPoint === n;
    return `<div class="ir ${n === named ? (end === 'caught' ? 'caught' : 'named') : ''} ${now ? 'now' : ''}"><span class="irf" style="--c:${col(n)}">${img(n)}</span>`
      + `<b>${esc(n)}</b><span class="irb"><i style="width:${((c / top) * 100).toFixed(0)}%"></i></span><em>${c}</em></div>`;
  }).join('');
  const foot = end === 'caught' ? 'CAUGHT' : end === 'wrong' ? 'WRONG NAME' : named != null ? `NAMED: ${esc(named || 'NOBODY')}` : `${asked} QUESTIONED`;
  return `<div class="intboard"><span class="ih">NAMES GIVEN</span>${rows || '<div class="ie">nobody has named anyone yet</div>'}<span class="ift ${end || ''}">${foot}</span></div>`;
}

// ── The Time Capsule's meter (Phase 7) ─────────────────────────────────
function capsuleHtml(S, L, st, fresh, idx) {
  const C = S.capsule || {};
  const seen = S.steps.slice(0, idx + 1);
  const done = seen.filter(x => x.capStage).map(x => x.capStage);
  const end = seen.find(x => x.capEnd)?.capEnd;
  const total = done.reduce((s, x) => s + (x[2] || 0), 0);
  const pct = C.target ? Math.max(0, Math.min(100, (total / C.target) * 100)) : 0;
  const segs = Array.from({ length: C.n || 0 }, (_, i) => {
    const d = done[i];
    const now = fresh && d && st?.capStage?.[0] === d[0];
    return `<span class="cs ${d ? d[1] : ''} ${now ? 'now' : ''}">${i + 1}</span>`;
  }).join('');
  return `<div class="capboard ${end || ''}"><span class="cph">THE TIME CAPSULE · ${esc((C.name || '').toUpperCase())}</span>`
    + `<div class="csr">${segs}</div><div class="cbar"><i style="width:${pct.toFixed(1)}%"></i><em></em></div>`
    + `<span class="cpf">${end === 'won' ? 'BEATEN' : end === 'lost' ? 'OUT OF TIME' : 'TARGET'}</span></div>`;
}

// ── The Secret Power Competition's doors (Phase 7) ─────────────────────
function spowerHtml(S, L, st, fresh, idx) {
  const D = S.spower || {};
  const seen = S.steps.slice(0, idx + 1);
  const shown = new Set(seen.filter(x => x.spDoor != null).map(x => x.spDoor));
  const opened = new Map(seen.filter(x => x.spOpen).map(x => [x.spOpen[0], x.spOpen[1]]));
  const names = Object.fromEntries(S.steps.filter(x => x.spDoor != null).map(x => [x.spDoor, x.spName]));
  const door = i => {
    const now = fresh && (st?.spDoor === i || st?.spOpen?.[0] === i);
    if (!shown.has(i)) return `<div class="spd shut"><span class="spn">${i + 1}</span><i>DOOR ${i + 1}</i></div>`;
    const who = opened.get(i);
    const face = who ? `<span class="spf" style="--c:${col(who)}">${img(who)}</span><b>${esc(who)}</b>` : opened.has(i) ? `<span class="spf none">—</span><b>UNCLAIMED</b>` : `<span class="spf none">?</span><b>&nbsp;</b>`;
    return `<div class="spd ${who ? 'won' : opened.has(i) ? 'none' : 'open'} ${now ? 'now' : ''}">${face}<i>${esc(names[i] || '')}</i></div>`;
  };
  return `<div class="spboard"><span class="sph">SECRET POWERS · THE HOUSE NEVER SEES THIS</span><div class="spr">${Array.from({ length: D.doors || 3 }, (_, i) => door(i)).join('')}</div></div>`;
}

// ── The Wildcard's hat board (Phase 7) ─────────────────────────────────
function wildHtml(S, L, st, fresh, idx) {
  const W = S.wild || {};
  const seen = S.steps.slice(0, idx + 1);
  const drawn = seen.filter(x => x.wcDraw).map(x => x.wcDraw);
  const score = Object.fromEntries(seen.filter(x => x.wcScore).map(x => x.wcScore));
  const win = seen.find(x => x.wcWin)?.wcWin;
  const offer = seen.some(x => x.wcOffer);
  const took = seen.some(x => x.wcTook), refused = seen.some(x => x.wcRefused);
  const card = i => {
    const n = drawn[i];
    if (!n) return `<div class="wc hid"><span class="wcf">?</span><i>IN THE HAT</i></div>`;
    const now = fresh && (st?.wcDraw === n || st?.wcScore?.[0] === n);
    return `<div class="wc ${n === win ? 'win' : ''} ${win && n !== win ? 'lost' : ''} ${now ? 'now' : ''}"><span class="wcf" style="--c:${col(n)}">${img(n)}</span><b>${esc(n)}</b>`
      + `<i>${score[n] != null ? esc(String(score[n])) : 'DRAWN'}</i></div>`;
  };
  const price = offer ? `<div class="wcp ${took ? 'took' : ''} ${refused ? 'no' : ''}"><span>THE PRICE${W.houseWide ? ' · THE HOUSE PAYS' : ''}</span><b>${esc(W.price || '')}</b>`
    + `${took ? '<em>ACCEPTED</em>' : refused ? '<em>TURNED DOWN</em>' : ''}</div>` : '';
  return `<div class="wildboard"><span class="wh">THE WILDCARD</span><div class="wr">${Array.from({ length: W.n || 3 }, (_, i) => card(i)).join('')}${price}</div></div>`;
}

// ── Camp Comeback's board of bunks (Phase 7) ───────────────────────────
function campHtml(S, L, st, fresh, idx) {
  const C = S.camp || {};
  const seen = S.steps.slice(0, idx + 1);
  const names = C.reveal && !seen.some(x => x.campIn) ? C.names.filter(n => n !== C.reveal) : C.names;
  const out = new Set(seen.filter(x => x.campOut).map(x => x.campOut));
  const back = seen.find(x => x.campBack)?.campBack;
  const slots = Array.from({ length: Math.max(C.size || 4, names.length) }, (_, i) => names[i] || null);
  const tile = n => {
    if (!n) return `<div class="cb empty"><span class="cbf"></span><i>EMPTY BUNK</i></div>`;
    const cls = n === back ? 'back' : out.has(n) ? 'gone' : '';
    const now = fresh && (st?.campIn === n || st?.campOut === n || st?.campBack === n);
    const tag = n === back ? 'BACK IN' : out.has(n) ? 'GONE' : 'CAMPER';
    return `<div class="cb ${cls} ${now ? 'now' : ''}"><span class="cbf" style="--c:${col(n)}">${img(n)}</span><b>${esc(n)}</b><i>${tag}</i></div>`;
  };
  const left = names.length - out.size;
  const head = back ? `THE DOOR · ${esc(back)} IS BACK IN` : out.size ? `THE DOOR · ${left} STILL PLAYING` : `CAMP · ${names.length} OF ${C.size || 4}`;
  return `<div class="campboard"><span class="ch">${head}</span><div class="cr">${slots.map(tile).join('')}</div></div>`;
}

// ── Duo Week's board of pairs (Phase 7) ─────────────────────────────────
const DUOLINK = `<svg class="dl" viewBox="0 0 24 12"><rect x="1" y="2" width="12" height="8" rx="4" fill="none" stroke="#22e1ff" stroke-width="2"/><rect x="11" y="2" width="12" height="8" rx="4" fill="none" stroke="#22e1ff" stroke-width="2"/></svg>`;
function duoHtml(S, L, st, fresh, idx) {
  const D = S.duo || {};
  const shown = D.reveal ? S.steps.slice(0, idx + 1).filter(x => x.pair).map(x => x.pair) : (D.pairs || []);
  const on = new Set(st?.pairOn || st?.pair || []);
  const noms = new Set(D.nominees || []);
  const face = n => `<span class="df" style="--c:${col(n)}">${img(n)}<b>${esc(n)}</b></span>`;
  const pairs = shown.map(p => {
    const nom = p.some(n => noms.has(n));
    const now = fresh && st && st.pair && st.pair[0] === p[0];
    return `<div class="dp ${p.some(n => on.has(n)) ? 'on' : ''} ${nom ? 'nom' : ''} ${now ? 'now' : ''}">${face(p[0])}${DUOLINK}${face(p[1])}${nom ? '<i>ON THE BLOCK</i>' : ''}</div>`;
  }).join('');
  const soloShown = D.solo && (!D.reveal || S.steps.slice(0, idx + 1).some(x => x.solo));
  const solo = soloShown ? `<div class="dp solo ${on.has(D.solo) ? 'on' : ''}">${face(D.solo)}<i>CAN'T BE NOMINATED</i></div>` : '';
  return `<div class="duoboard"><span class="dh">YOU GO, THEY GO · ${shown.length} ${shown.length === 1 ? 'PAIR' : 'PAIRS'}</span><div class="dr2">${pairs}${solo}</div></div>`;
}

// ── House Life: the camera follows the conversation ───────────────────
// A whole-house scene has six or eight people in it, and putting every one of them up
// front at full size, all the time, buried the two people actually talking (the user,
// 2026-10-06). The focus is the current exchange: the last two or three people to speak
// in this scene, or whoever the stage direction names; at the very top of a scene, the
// first people about to speak. Everybody else in the room is background: further back,
// smaller, dimmed, no name plate. Somebody who joins the exchange comes forward.
function sceneStartOf(S, idx) {
  for (let i = idx; i >= 0; i--) if (S.steps[i]?.scene) return i;
  return 0;
}
export function focusAt(S, idx) {
  const names = new Set((S.cast || []).map(([n]) => n));
  if (idx < 0 || names.size <= 2) return [...names];
  const from = sceneStartOf(S, idx);
  const out = [];
  const add = n => { if (n && names.has(n) && !out.includes(n)) out.push(n); };
  const st = S.steps[idx];
  if (st?.k === 'beat') for (const n of names) if (String(st.t).includes(n)) add(n);
  // the speaker and whoever they are talking to; a third only if three people are trading
  // lines right now (inside the last four spoken lines)
  let said = 0;
  for (let i = idx; i >= from && out.length < 3 && said < 4; i--) { const x = S.steps[i]; if (x?.k === 'say') { said++; add(x.by); } }
  for (let i = idx + 1; i < S.steps.length && out.length < 2 && !S.steps[i]?.scene; i++) { const x = S.steps[i]; if (x?.k === 'say') add(x.by); }
  return out.length ? out : [...names].slice(0, 2);
}
const FRONT = { 1: [50], 2: [36, 64], 3: [27, 50, 73] };

// ── what people DO, animated ────────────────────────────────────────────
// The user, 2026-10-06: "when they're shouting we should have an animation, an animation of every
// action, that's how you make a viewer alive, like we did in Perfect Match". As there, the action
// is read from what HAPPENS (a stage direction), never from what somebody says they did, except
// a shout, which is how a line is said. Who: the people the direction names, or the speaker.
const ACTIONS = [
  ['kiss', /\bkiss(es|ed)?\b/i, 2],
  ['hug', /\bhug(s|ged)?\b|\bembrace|into a hug|squeezes .{0,20}(shoulder|hand)/i, 2],
  ['storm', /storms? (off|out)|walks (out|off|away)|leaves the room|heads (off|upstairs|out)|slams the door|goes upstairs/i, 1],
  ['slam', /\bslams?\b|\bbangs?\b|\bthrows?\b|\bkicks?\b|\bpunches\b/i, 0],
  ['cry', /\bcr(y|ies|ying)\b|in tears|tears up|wipes? .{0,15}eyes|\bsobs?\b/i, 1],
  ['laugh', /\blaugh|cracks up|giggl|\bsnorts?\b|falls apart|in stitches/i, 3],
  ['whisper', /whisper|leans? in|lowers? .{0,12}voice|under (his|her|their) breath/i, 2],
  ['sit', /\bsits? down|\bflops\b|lies down|sinks into|collapses (on|onto|into)/i, 1],
  ['cheer', /high[- ]fives?|\bcheers\b|\btoasts?\b|\bclinks?\b|fist[- ]bump|\bdances?\b|jumps up and down/i, 3],
];
export function actionOf(st, names) {
  if (!st || st.bg) return null;
  const t = String(st.t || '');
  if (st.k === 'say' || st.k === 'host') {
    const shout = (t.match(/!/g) || []).length >= 2 || /\b[A-Z]{4,}\b/.test(t)
      || (/!/.test(t) && /^(what|oh my|no way|are you (serious|kidding)|shut up|excuse me|get out|enough)/i.test(t));
    return shout && st.by ? { kind: 'shout', who: [st.by] } : null;
  }
  if (st.k !== 'beat') return null;
  const named = names.filter(n => new RegExp(`(^|[^\\w])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\const FRONT = { 1: [50], 2: [36, 64], 3: [27, 50, 73] };')}(?![\\w])`).test(t))
    .sort((x, y) => t.indexOf(x) - t.indexOf(y));
  for (const [kind, re, need] of ACTIONS) {
    if (!re.test(t)) continue;
    if (need === 2 && named.length < 2) continue;
    if (need === 1 && !named.length) continue;
    return { kind, who: need === 2 ? named.slice(0, 2) : need === 1 ? named.slice(0, 1) : named };
  }
  return null;
}
// the little things drawn with an action (inline SVG, never a CSS picture)
const FX = {
  shout: '<span class="fx fx-shout"><i></i><i></i><i></i></span>',
  kiss: '<span class="fx fx-heart"><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 3 4.5 6.6 4.5c2.2 0 3.6 1.3 4.4 2.6.8-1.3 2.2-2.6 4.4-2.6 3.6 0 5.8 3.7 4.2 7.3C19.5 16.4 12 21 12 21z" fill="#ff4d7d"/></svg></span>',
  cry: '<span class="fx fx-tears"><svg viewBox="0 0 24 40"><path d="M6 4c2 4 4 7 4 10a4 4 0 0 1-8 0c0-3 2-6 4-10z" fill="#7fd3ff"/><path d="M18 14c2 4 4 7 4 10a4 4 0 0 1-8 0c0-3 2-6 4-10z" fill="#7fd3ff"/></svg></span>',
  whisper: '<span class="fx fx-hush"><svg viewBox="0 0 40 24"><path d="M4 12h6M14 6l5 3M14 18l5-3" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg></span>',
  cheer: '<span class="fx fx-spark"><svg viewBox="0 0 24 24"><path d="M12 2l2.2 6.6L21 9l-5.4 4.1L17.6 20 12 16.2 6.4 20l2-6.9L3 9l6.8-.4z" fill="#f5c542"/></svg></span>',
};
/** The classes and drawing an action puts on one tile: { cls, fx }. */
function actOn(A, n, x, xs) {
  if (!A || !A.who.includes(n) && !(A.kind === 'laugh' || A.kind === 'cheer' || A.kind === 'slam')) return { cls: '', fx: '' };
  if (!A.who.includes(n)) return { cls: '', fx: '' };
  const other = A.who.find(m => m !== n);
  const ox = other != null ? xs[other] : null;
  const side = ox == null ? '' : ox > x ? 'toR' : 'toL';
  return { cls: `act-${A.kind} ${side}`, fx: FX[A.kind] && (A.kind !== 'kiss' || side === 'toR') ? FX[A.kind] : '' };
}
// what a line does to the rest of the room: 'laugh', 'wow', or nothing
function reactionOf(st) {
  if (!st || st.bg) return null;
  const t = String(st.t || '');
  if (/laugh|cracks up|giggl|snort|falls apart|in stitches|room loses it/i.test(t)) return 'laugh';
  if (st.k === 'beat' && /gasp|shout|scream|slam|erupt|cheer|everybody (turns|looks|stops)|room (goes|falls) (quiet|silent)|storms|throws/i.test(t)) return 'wow';
  // a shout, not any exclamation: two of them, a word in capitals, or a line that is all disbelief
  if (st.k === 'say' && ((t.match(/!/g) || []).length >= 2 || /\b[A-Z]{4,}\b/.test(t)
    || (/!/.test(t) && /^(what|oh my|no way|are you (serious|kidding)|shut up|excuse me)/i.test(t)))) return 'wow';
  return null;
}
const KEY_SVG = '<svg viewBox="0 0 24 24"><circle cx="7" cy="12" r="4.5" fill="none" stroke="#f5c542" stroke-width="2.4"/><path d="M11 12h11M18 12v4M21 12v3" stroke="#f5c542" stroke-width="2.4" stroke-linecap="round"/></svg>';
const REACT_WOW = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#ff2e4d"/><rect x="10.6" y="5" width="2.8" height="9" rx="1.4" fill="#fff"/><circle cx="12" cy="17.6" r="1.7" fill="#fff"/></svg>';
const REACT_LAUGH = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#f5c542"/><path d="M7 13.5q5 5.5 10 0" fill="none" stroke="#3a2600" stroke-width="2.2" stroke-linecap="round"/><path d="M7.5 9.5l2 -1.5M16.5 9.5l-2 -1.5" stroke="#3a2600" stroke-width="2" stroke-linecap="round"/></svg>';

function sceneHtml(S, st, prevSt, L, idx, fresh, o) {
  const isDr = st && st.k === 'dr';
  if (isDr) {
    const held = st.hold ? `<div class="drpass ${fresh ? 'fresh' : ''}">${passHtml(st.by, 'held')}<b>STILL IN MY POCKET</b></div>` : '';
    return `${setDiv('dr', o.season)}<div class="drring">${DRRING}</div>${tileHtml(st.by, 40, 'speak', L, '', 'width:15cqw;bottom:17cqw')}${held}`;
  }
  const arena = S.arena;
  let h = arena ? `<div class="set photo" style="background-image:url('assets/bb/house/${/^studio/.test(S.set) ? 'default' : o.season}/${S.set}-td-b.webp?v=${V}')"></div>`
    : S.built ? `<div class="set set-${S.set}"><div class="floor"></div></div>` : setDiv(S.set, o.season);
  h += suiteObjects(S, L, st, idx, fresh);
  h += wallHtml(S, L, st, fresh);
  if (S.tvObj && !(L.out.length && st && st.k !== 'host' && L.out.at(-1) && S.steps.some(x => x.out))) {
    h += `<div class="obj ledtv ${st && st.k === 'host' ? 'on' : ''} ${L.votes && st && st.k === 'host' ? 'dim' : ''}">${img(o.host, true)}<div class="lb"><span>● LIVE · HOST</span>${esc(String(o.host).toUpperCase())}</div></div>`;
  }
  if (idx < 0) return h;
  const cast = castAt(S, idx);
  const speaker = st && (st.k === 'say' || st.k === 'host') ? st.by : null;
  // the host on the stage with them (move-in night), not on a screen
  if (S.hostOn && o.host) h += `<div class="gt host ${speaker === o.host ? 'speak' : ''}" style="left:9%;--c:#ff2e4d;--ry:10deg"><div class="tile">${img(o.host, true)}</div><div class="plate"><b>${esc(o.host)}</b><span class="hostlab">HOST</span></div></div>`;
  const seated = S.seated ? seatsAt(S, idx) : null;
  if (SCENE_KINDS.has(S.kind) && !seated && cast.length > 3) {
    const focus = focusAt(S, idx);
    const before = idx > sceneStartOf(S, idx) ? focusAt(S, idx - 1) : focus;
    const back = cast.map(([n]) => n).filter(n => !focus.includes(n));
    const xs = FRONT[Math.min(3, focus.length)] || FRONT[3];
    // The rest of the room stands on the floor too, in the gaps beside and between the
    // people talking (never floating above the furniture): smaller and dimmer, so they read
    // as further back. Spots are the free stretches of floor, filled from the edges in.
    const front = xs.slice(0, Math.min(3, focus.length));
    const spots = [];
    for (let x = 5; x <= 95; x += 1) if (front.every(f => Math.abs(f - x) >= 9.5)) spots.push(x);
    const runs = [];
    for (const x of spots) { const r = runs.at(-1); if (r && x === r.at(-1) + 1) r.push(x); else runs.push([x]); }
    const places = [];
    const per = Math.max(1, Math.ceil(back.length / Math.max(1, runs.length)));
    for (const r of runs) {
      const k = Math.min(per, Math.max(1, Math.floor(r.length / 5)));
      for (let j = 0; j < k; j++) places.push(r[0] + Math.round(((j + 0.5) * r.length) / k));
    }
    places.sort((p, q) => Math.abs(50 - q) - Math.abs(50 - p));
    // A loud line or a big moment turns the room: one or two of the people in the background
    // react (a jump, a badge). Everybody else keeps breathing, so the room is never a photo.
    const react = reactionOf(st);
    const who = react ? new Set(back.filter((_, i) => (i + idx) % 3 !== 2).slice(0, 2)) : new Set();
    back.forEach((n, i) => {
      const x = places[i % Math.max(1, places.length)] ?? 50;
      const r = who.has(n) ? `react ${react}` : '';
      const badge = r ? `<i class="rb">${react === 'laugh' ? REACT_LAUGH : REACT_WOW}</i>` : '';
      h += tileHtml(n, x, `bgp ${r}`, L, badge, `z-index:1;bottom:${(21.5 + (i % 2) * 0.8).toFixed(1)}cqw;--d:${(-(i * 0.9 + idx * 0.13) % 4).toFixed(2)}s`);
    });
    const A = fresh ? actionOf(st, cast.map(([n]) => n)) : null;
    const at = Object.fromEntries(focus.slice(0, 3).map((n, i) => [n, xs[i]]));
    focus.slice(0, 3).forEach((n, i) => {
      const a = actOn(A, n, xs[i], at);
      const cls = [n === speaker ? 'speak' : '', fresh && !before.includes(n) ? 'step' : '', L.plus === n ? 'plus' : '', a.cls].join(' ');
      h += tileHtml(n, xs[i], cls, L, '', '', a.fx);
    });
    if (A && A.kind === 'slam') h += '<div class="fx-impact"></div>';
    return h;
  }
  const A2 = fresh ? actionOf(st, cast.map(([n]) => n)) : null;
  const at2 = Object.fromEntries(cast);
  for (const [n, x] of cast) {
    const a2 = actOn(A2, n, x, at2);
    const entered = fresh && idx === 0;
    const tense = st && st.tense ? (st.tense.includes(n) ? 'tense' : 'out') : '';
    const cls = [tense || (n === speaker ? 'speak' : (st && st.push) ? 'out' : ''), entered ? 'in' : '', L.plus === n ? 'plus' : '', L.passed === n ? 'passed' : '', a2.cls].join(' ');
    if (seated && n === o.host) {
      const a = seatOf(S, seated, n);
      if (a) h += `<div class="gt host ${speaker === o.host ? 'speak' : ''}" style="left:${a.at[0]}%;--c:#ff2e4d;bottom:${(a.at[1] * 0.5625).toFixed(2)}cqw;width:${a.w.toFixed(2)}cqw;z-index:${zOf(a)}"><div class="tile">${img(o.host, true)}</div><div class="plate"><b>${esc(o.host)}</b><span class="hostlab">HOST</span></div></div>`;
      continue;
    }
    if (seated) {
      const a = seatOf(S, seated, n);
      h += tileHtml(n, x, cls, L, '', `bottom:${(a.at[1] * 0.5625).toFixed(2)}cqw;width:${a.w.toFixed(2)}cqw;z-index:${zOf(a)}`, a2.fx);
    } else h += tileHtml(n, x, cls, L, '', '', a2.fx);
  }
  if (S.set === 'dining') {
    h += `<img class="front" src="assets/bb/house/${o.season}/dining-td-b-nombox.webp?v=${V}" alt="" style="z-index:${zOf(ANCH.dining.box)}">`;
    h += nomScreenHtml(S, L, st, fresh);
  }
  if (S.medalOn && L.veto === S.medalOn && seated) {
    const ma = seatOf(S, seated, S.medalOn);
    const on = S.steps.slice(0, idx + 1).some(s => s.medal);
    if (ma && on) h += `<div class="obj medal ${fresh && st.medal === 'on' ? 'fresh' : ''} ${fresh && st.medal === 'glint' ? 'glint' : ''}" style="left:${ma.at[0]}%;bottom:${(ma.at[1] * 0.5625 + ma.w * 1.25 * 0.15).toFixed(2)}cqw;width:${(ma.w * 0.42).toFixed(2)}cqw;z-index:${zOf(ma) + 1}">${MEDAL}</div>`;
  }
  return h;
}

function hudHtml(S, st, prevSt, fresh) {
  const isDr = st && st.k === 'dr';
  const camNo = isDr ? '01' : String(S.cam || 0).padStart(2, '0');
  const room = isDr ? 'Diary Room' : S.room || '';
  const sw = fresh && prevSt && st && (prevSt.by !== st.by || prevSt.k !== st.k) ? 'sw' : '';
  return `<div class="hud">
    <div class="bug">${eyeSvg('eye')}<div class="wm">BIG BROTHER<span>WEEK ${esc(S.week)}</span></div>
      <span class="live">LIVE</span><span class="camlab ${sw}" style="margin-left:.6cqw"><b>CAM ${camNo}</b>${esc(String(room).toUpperCase())}</span></div>
    <div class="clockw">DAY ${esc(S.day)} <span class="sig"><i></i><i></i><i></i><i></i></span><div class="big">${esc(S.time)}</div></div></div>`;
}

function lineHtml(S, st, fresh, L) {
  if (!st) return '';
  if (st.k === 'bb') {
    const bars = Array.from({ length: 28 }, (_, i) => `<i style="animation-delay:${(i * 73 % 900) / 1000}s;animation-duration:${.5 + (i * 37 % 50) / 100}s"></i>`).join('');
    return `<div class="bbv ${fresh ? 'fresh' : ''}">${eyeSvg('eye')}<div class="who">BIG BROTHER</div><div class="tx">${escT(st.t)}</div><div class="wave">${bars}</div></div>`;
  }
  if (st.k === 'beat') return `<div class="cc"><span class="ccl">[ CC ]</span><span>${escT(st.t)}</span></div>`;
  const kind = st.k === 'dr' ? 'dr' : st.k === 'host' ? 'host' : '';
  const role = st.k === 'dr' ? 'Diary Room' : st.k === 'host' ? 'Host · Live' : L.status[st.by] === 'hoh' ? 'Head of Household'
    : L.nom.includes(st.by) && !L.out.includes(st.by) ? 'Nominated' : L.veto === st.by ? 'Veto holder' : 'Houseguest';
  return `<div class="l3 ${kind} ${fresh ? 'fresh' : ''}" style="--c:${col(st.by)}"><div class="tagr"><span class="nm">${esc(st.by)}</span><span class="role">${role}</span></div>
    <div class="body"><div class="tx" data-full="${esc(st.t)}" data-emph="${esc(emph(st.t, [...namesOf(S), st.by]))}">${fresh ? '' : emph(st.t, [...namesOf(S), st.by])}</div></div></div>`;
}

/** The whole stage for step `idx` of screen `si`. `o` = { season, host }. */
export function stageHtml(screens, si, idx, fresh, o) {
  // A House Life segment cuts room to room: the latest `scene` marker up to
  // this step says which room, camera and people are on screen.
  const S0 = screens[si];
  let sc = null;
  if (SCENE_KINDS.has(S0.kind)) for (let i = Math.max(0, idx); i >= 0; i--) { if (S0.steps[i]?.scene) { sc = S0.steps[i].scene; break; } }
  const S = sc ? { ...S0, ...sc } : S0;
  const st = idx >= 0 ? S.steps[idx] : null;
  const prevSt = idx > 0 ? S.steps[idx - 1] : null;
  const L = ledgerAt(screens, si, idx);
  const camNow = camOf(S, idx);
  const cut = fresh && prevSt && st && ((st.k === 'dr') !== (prevSt.k === 'dr'));
  let h = `<div class="cam" data-cam="${camNow}" style="${camStyle(fresh && idx > 0 ? camOf(S, idx - 1) : camNow)}"><div class="lens ${cut ? 'cut' : ''}">${sceneHtml(S, st, prevSt, L, idx, fresh, o)}</div></div>`;
  h += `<div class="grain"></div><div class="vign"></div>`;
  const isDr = st && st.k === 'dr';
  if (S.rail && !S.railHidden && !isDr && idx >= 0) h += railHtml(S, L, st, fresh);
  if (st && st.rule != null && S.rules) h += rulesHtml(S, st.rule, fresh);
  if (S.chainRun && !isDr && idx >= 0) h += chainHtml(S, L, st, fresh);
  if (S.hunt && !isDr && idx >= 0 && !(st && st.rule != null)) h += huntHtml(S, L, st, fresh);
  if (S.px && !isDr && idx >= 0 && !(st && st.rule != null)) h += pxHtml(S, L, st, fresh);
  if (S.duo && !isDr && idx >= 0 && !(st && st.rule != null)) h += duoHtml(S, L, st, fresh, idx);
  if (S.camp && !isDr && idx >= 0 && !(st && st.rule != null)) h += campHtml(S, L, st, fresh, idx);
  if (S.wild && !isDr && idx >= 0 && !(st && st.rule != null)) h += wildHtml(S, L, st, fresh, idx);
  if (S.spower && !isDr && idx >= 0 && !(st && st.rule != null)) h += spowerHtml(S, L, st, fresh, idx);
  if (S.capsule && !isDr && idx >= 0 && !(st && st.rule != null)) h += capsuleHtml(S, L, st, fresh, idx);
  if (S.interro && !isDr && idx >= 0 && !(st && st.rule != null)) h += interroHtml(S, L, st, fresh, idx);
  if (S.whack && !isDr && idx >= 0 && !(st && st.rule != null)) h += whackHtml(S, L, st, fresh, idx);
  if (S.expired && idx >= 0) h += expiredHtml(S, L, st, fresh, idx);
  if (S.power && !isDr && idx >= 0 && !(st && st.rule != null)) h += powerCardHtml(S, L, st, fresh, idx);
  if (S.coin && !isDr && idx >= 0 && !(st && st.rule != null)) h += coinHtml(S, L, st, fresh, idx);
  if (S.veto2 && !isDr && idx >= 0 && !(st && st.rule != null)) h += veto2Html(S, L, st, fresh, idx);
  if (S.battleback && !isDr && idx >= 0 && !(st && st.rule != null)) h += battleBackHtml(S, L, st, fresh, idx);
  if (S.locust && !isDr && idx >= 0 && !(st && st.rule != null)) h += locustHtml(S, L, st, fresh, idx);
  if (S.movein && !isDr && idx >= 0) h += moveInHtml(S, L, st, fresh, idx);
  if (S.team && idx >= 0 && !(st && st.rule != null)) h += teamHtml(S, L, st, fresh, idx);
  if (L.bill && S.steps.some(x => x.bill) && !isDr) h += billHtml(L, st, fresh);
  // the live vote: a count of ballots cast, never whose (the room does not know until the host says)
  const totalBallots = S.kind === 'evict' ? S.steps.filter(x => x.ballot).length : 0;
  if (totalBallots && L.ballots.length && !L.votes) {
    const pips = Array.from({ length: totalBallots }, (_, i) => `<i class="${i < L.ballots.length ? 'on' : ''} ${fresh && i === L.ballots.length - 1 && st?.ballot ? 'new' : ''}"></i>`).join('');
    h += `<div class="ballots ${L.ballots.length === totalBallots ? 'locked' : ''}"><div class="k">${L.ballots.length === totalBallots ? 'Votes locked' : 'Votes cast'}</div><div class="n">${L.ballots.length}<span>/ ${totalBallots}</span></div><div class="pips">${pips}</div></div>`;
  }
  if (st && st.big) {
    const [a, b, tone] = st.big;
    h += tone ? `<div class="bigrev name ${tone} ${fresh ? 'fresh' : ''}"><b>${esc(a)}</b><i>${esc(b)}</i></div>`
      : `<div class="bigrev ${fresh ? 'fresh' : ''}"><i>${esc(a)}</i><b>${esc(b)}</b></div>`;
  }
  if (fresh && st && st.door) h += '<div class="doorflood"></div>';
  // the jury's keys: in the box (a count), then pulled one at a time onto the board
  if (S.kind === 'jury-vote' && (S.keysFor || []).length) {
    const keys = L.keys || [];
    const inBox = (L.keyIn || []).length;
    if (keys.length) {
      const col2 = (S.keysFor || []).slice(0, 2).map(n => {
        const k = keys.filter(x => x[1] === n).length;
        const lastNow = fresh && st?.key?.[1] === n;
        return `<div class="kcol ${k >= (S.keysNeed || 99) ? 'won' : ''}"><span class="kf" style="--c:${col(n)}">${img(n)}</span><b>${esc(n)}</b><div class="kn ${lastNow ? 'bump' : ''}">${k}</div><div class="kp">${Array.from({ length: k }, (_, i) => `<i class="${lastNow && i === k - 1 ? 'new' : ''}">${KEY_SVG}</i>`).join('')}</div></div>`;
      }).join('<span class="kvs">VS</span>');
      h += `<div class="keyboard"><span class="kh">THE JURY'S KEYS · ${S.keysNeed} TO WIN</span><div class="kr">${col2}</div></div>`;
    } else if (inBox) {
      h += `<div class="ballots"><div class="k">Keys in the box</div><div class="n">${inBox}</div></div>`;
    }
  }
  if (st && st.board) {
    const B = st.board;
    const rows = (B.rows || []).map(r => `<div class="fbr ${r.out ? 'out' : ''}"><span class="ff" style="--c:${col(r.n)}">${img(r.n)}</span><b>${esc(r.n)}</b>${r.v != null ? `<span class="fbar"><i style="width:${Math.round(r.v * 100)}%"></i></span>` : ''}${r.text != null ? `<span class="ft">${esc(r.text)}</span>` : ''}</div>`).join('');
    h += `<div class="fboard"><span class="fh">${esc(B.title || '')}</span>${rows}</div>`;
  }
  if (fresh && st && st.confetti) h += '<div class="goldflash"></div>';
  if (fresh && st && st.confetti) h += `<div class="confetti">${Array.from({ length: 120 }, (_, i) => `<i style="left:${(i * 37) % 100}%;--d:${((i * 13) % 34) / 10}s;--x:${((i * 29) % 40) - 20}cqw;--r:${(i * 47) % 360}deg;background:${['#f5c542', '#ff2e4d', '#22e1ff', '#7c5cff', '#fff', '#12b76a'][i % 6]}"></i>`).join('')}</div>`;
  if (S.finale && idx >= 0) h += '<div class="beams"><i></i><i></i><i></i></div>';
  if (fresh && st && st.card && ['alliance', 'meeting', 'joined', 'out', 'deal'].includes(st.card.kind)) {
    const faces = (st.card.members || []).slice(0, 6).map((n, i) => `<span class="alf" style="--c:${col(n)};--i:${i}">${img(n)}</span>`).join('');
    const who = esc(String((st.card.members || [])[0] || '').toUpperCase());
    const over = st.card.kind === 'meeting' ? `CALLED BY ${who}` : st.card.kind === 'joined' ? `${who} JOINS` : st.card.kind === 'out' ? `${who} IS NO LONGER IN` : st.card.kind === 'deal' ? 'A DEAL IS MADE' : 'AN ALLIANCE IS BORN';
    h += `<div class="alcard ${st.card.kind}"><i>${over}</i><b>${esc(st.card.name)}</b><div class="alfs">${faces}</div></div>`;
  }
  if (fresh && st && st.scene && st.scene.slate && (S0.kind === 'houselife' || S0.kind === 'movein')) {
    h += `<div class="slate"><span>DAY ${esc(S.day)} · ${esc(st.scene.time || S.time || '')}</span><b>${esc(st.scene.room || S.room || '')}</b></div>`;
  }
  if (L.votes && st && st.k === 'host' && !st.big) {
    h += `<div class="votes ${fresh && st.votes ? 'fresh' : ''}"><div class="v"><div class="n">${L.votes[0]}</div><div class="k">Votes</div></div><i class="sep"></i><div class="v"><div class="n">${L.votes[1]}</div><div class="k">Votes</div></div></div>`;
  }
  h += hudHtml(S, st, prevSt, fresh);
  if (idx < 0) h += `<div class="rest">${eyeSvg('eye')}<div class="k">${esc(S.kicker)}</div><div class="t">${esc(S.title)}</div><div class="s">${esc(S.sub)}</div><div class="go">▶ PLAY</div></div>`;
  else h += lineHtml(S, st, fresh, L);
  if (fresh && st) {
    if (st.toast) h += `<div class="toast" style="--tc:${st.toast[1]}"><b style="font-size:${Math.min(6, 64 / Math.max(1, st.toast[0].length)).toFixed(2)}cqw;white-space:nowrap">${esc(st.toast[0])}</b></div>`;
    if (st.chip) h += `<div class="vchip">${st.chip.chip === 'choice' ? `<b>Houseguest's<br>choice</b>` : img(st.chip.chip)}<i>${esc(st.chip.drawer)} draws</i></div>`;
    if (cut) h += `<div class="flash"></div>`;
  }
  return { html: h, cls: `stage ${S.lodge ? 'lodge' : ''} ${st && st.k === 'bb' ? 'bbspeaks' : ''} ${st && st.rule != null ? 'rulesup' : ''} ${S.bright && !(st && st.k === 'dr') ? 'lightset' : ''} ${S.nv && !(st && st.k === 'dr') ? 'nv' : ''} ${fresh && st && st.shake ? 'shake' : ''}`, cam: camNow, ledger: L };
}
