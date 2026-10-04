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

function tileHtml(n, x, cls, L, extra = '', more = '') {
  const ry = ((50 - x) * 0.28).toFixed(1);
  return `<div class="gt ${cls}" style="left:${x}%;--c:${col(n)};--ry:${ry}deg;${more}">
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

function sceneHtml(S, st, prevSt, L, idx, fresh, o) {
  const isDr = st && st.k === 'dr';
  if (isDr) {
    const held = st.hold ? `<div class="drpass ${fresh ? 'fresh' : ''}">${passHtml(st.by, 'held')}<b>STILL IN MY POCKET</b></div>` : '';
    return `${setDiv('dr', o.season)}<div class="drring">${DRRING}</div>${tileHtml(st.by, 50, 'speak', L, '', 'width:15cqw;bottom:17cqw')}${held}`;
  }
  const arena = S.arena;
  let h = arena ? `<div class="set photo" style="background-image:url('assets/bb/house/${o.season}/${S.set}-td-b.webp?v=${V}')"></div>`
    : S.built ? `<div class="set set-${S.set}"><div class="floor"></div></div>` : setDiv(S.set, o.season);
  h += suiteObjects(S, L, st, idx, fresh);
  h += wallHtml(S, L, st, fresh);
  if (S.tvObj && !(L.out.length && st && st.k !== 'host' && L.out.at(-1) && S.steps.some(x => x.out))) {
    h += `<div class="obj ledtv ${st && st.k === 'host' ? 'on' : ''} ${L.votes && st && st.k === 'host' ? 'dim' : ''}">${img(o.host, true)}<div class="lb"><span>● LIVE · HOST</span>${esc(String(o.host).toUpperCase())}</div></div>`;
  }
  if (idx < 0) return h;
  const cast = castAt(S, idx);
  const speaker = st && (st.k === 'say' || st.k === 'host') ? st.by : null;
  const seated = S.seated ? seatsAt(S, idx) : null;
  for (const [n, x] of cast) {
    const entered = fresh && idx === 0;
    const cls = [n === speaker ? 'speak' : (st && st.push) ? 'out' : '', entered ? 'in' : '', L.plus === n ? 'plus' : '', L.passed === n ? 'passed' : ''].join(' ');
    if (seated) {
      const a = seatOf(S, seated, n);
      h += tileHtml(n, x, cls, L, '', `bottom:${(a.at[1] * 0.5625).toFixed(2)}cqw;width:${a.w.toFixed(2)}cqw;z-index:${zOf(a)}`);
    } else h += tileHtml(n, x, cls, L);
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
    <div class="body"><div class="tx" data-full="${esc(st.t)}">${fresh ? '' : escT(st.t)}</div></div></div>`;
}

/** The whole stage for step `idx` of screen `si`. `o` = { season, host }. */
export function stageHtml(screens, si, idx, fresh, o) {
  const S = screens[si];
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
  if (L.bill && S.steps.some(x => x.bill) && !isDr) h += billHtml(L, st, fresh);
  if (L.votes && st && st.k === 'host') {
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
  return { html: h, cls: `stage ${st && st.k === 'bb' ? 'bbspeaks' : ''} ${st && st.rule != null ? 'rulesup' : ''} ${S.bright && !(st && st.k === 'dr') ? 'lightset' : ''} ${S.nv && !(st && st.k === 'dr') ? 'nv' : ''} ${fresh && st && st.shake ? 'shake' : ''}`, cam: camNow, ledger: L };
}
