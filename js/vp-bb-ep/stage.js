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
  const L = { status: {}, nom: [], veto: null, out: [], votes: null, vetoPlay: [], ballots: [], revealed: [], hoh: null, moves: [], stances: {} };
  for (const n of S0.priorOut || []) { L.status[n] = 'out'; L.out.push(n); }
  for (let s = 0; s <= si; s++) {
    const steps = screens[s].steps; const upto = s < si ? steps.length - 1 : idx;
    for (let i = 0; i <= upto; i++) {
      const st = steps[i];
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
  return S.cast || [];
}
function chipsFor(n, L) {
  const c = [];
  if (L.status[n] === 'hoh') c.push('<span class="chipx hoh">HOH</span>');
  if (L.out.includes(n)) c.push('<span class="chipx out">Evicted</span>');
  else if (L.nom.includes(n)) c.push('<span class="chipx nom">Nom</span>');
  if (L.veto === n) c.push('<span class="chipx veto">Veto</span>');
  return c.join('');
}
function camOf(S, i) {
  const st = S.steps[i];
  if (!st || !st.push || !st.by) return 'none';
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

function sceneHtml(S, st, prevSt, L, idx, fresh, o) {
  const isDr = st && st.k === 'dr';
  if (isDr) {
    return `${setDiv('dr', o.season)}<div class="drring">${DRRING}</div>${tileHtml(st.by, 50, 'speak', L, '', 'width:15cqw;bottom:17cqw')}`;
  }
  const arena = S.arena;
  let h = arena ? `<div class="set photo" style="background-image:url('assets/bb/house/${o.season}/${S.set}-td-b.webp?v=${V}')"></div>` : setDiv(S.set, o.season);
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
    const cls = [n === speaker ? 'speak' : (st && st.push) ? 'out' : '', entered ? 'in' : ''].join(' ');
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
  return { html: h, cls: `stage ${st && st.k === 'bb' ? 'bbspeaks' : ''} ${fresh && st && st.shake ? 'shake' : ''}`, cam: camNow, ledger: L };
}
