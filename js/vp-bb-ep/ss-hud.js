// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-hud.js — Secret Story on the stage: its own look, and a game to play
// ══════════════════════════════════════════════════════════════════════
//
// Part 4 (the user, 2026-10-28: "grandiose, like playing a visual novel and a video game at
// the same time... super animated and interactive"). On a Secret Story week the stepped
// viewer drops Big Brother's broadcast skin and wears the House of Secrets':
//
// - the HUD: the show's lettering (Fredoka, Nunito: assets/fonts), the Eye, the room
//   in English, and the VIEWER BANK (the viewer's own calls; each housemate's kitty is in Intel);
// - the dialogue box of a visual novel: a name tab in the speaker's colour, the line typed
//   at speaking pace (screens.js types any `.tx[data-full]`), the confessional's name plate,
//   the Voice speaking through a living Eye;
// - the props the user painted (assets/sets/bb/secret-story/props), pressed, not shown:
//   the buzzer, the red phone, the bailiff's envelope, the clue chest;
// - the secret card, turned over when a secret comes out;
// - CALL IT: the public knows every secret (the launch shows them), so the viewer's game is
//   what the real fans play, calling what happens next with a kitty of their own (start
//   $10,000, like a housemate). A step's `ask` opens a call; its `settle` pays it. Kept per
//   viewer in the browser (a convenience: a missing store just starts a fresh kitty).
//
// Pure HTML builders and a few window handlers; stage.js calls these when o.season is
// Secret Story's. Nothing here decides anything in the season.

import { ssSfx } from './ss-sound.js';
import { ssx, SS_TYPE_CSS } from './ss-type.js';

const PROPS = 'assets/sets/bb/secret-story/props';
const EYE = `${PROPS}/eye.webp`;
const START = 10000;
const STAKE = 500;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = n => `${n < 0 ? '−' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
/** What a right call pays: more for a harder one (more names to choose from). */
export const payout = n => Math.min(3000, 1000 * Math.max(1, n - 1));

// ── the viewer's kitty ──────────────────────────────────────────────────
const bankKey = key => `ss-bank:${key || 'season'}`;
/** The viewer's bank for a season: { kitty, picks: {askId: option}, settled: {askId: delta} }. */
export function bankOf(key) {
  try {
    const b = JSON.parse(localStorage.getItem(bankKey(key)) || 'null');
    if (b && typeof b.kitty === 'number') return { picks: {}, settled: {}, ...b };
  } catch { /* no store: a fresh kitty */ }
  return { kitty: START, picks: {}, settled: {} };
}
function saveBank(key, b) { try { localStorage.setItem(bankKey(key), JSON.stringify(b)); } catch { /* a convenience only */ } }

/** Settles a call the first time its reveal airs; returns { delta, right, picked } (delta 0 if no call was made). */
export function settleCall(key, id, answer, n) {
  const b = bankOf(key);
  const picked = b.picks[id];
  if (picked == null) return { delta: 0, right: false, picked: null, kitty: b.kitty };
  if (b.settled[id] == null) {
    const right = picked === answer;
    b.settled[id] = right ? payout(n) : -STAKE;
    b.kitty += b.settled[id];
    saveBank(key, b);
  }
  return { delta: b.settled[id], right: b.settled[id] > 0, picked, kitty: b.kitty };
}

// ── the sounds of the house (synthesised: a siren, a ring, coins) ───────
let AC = null;
function sfx(kind) {
  // a recording when there is one (vp-bb-ep/ss-sound.js), the synth otherwise
  if (kind !== 'lose' && ssSfx(kind)) return;
  try {
    const A = /** @type {any} */ (globalThis).audio;
    if (A?.isMuted?.()) return;
    const vol = Math.max(0, Math.min(1, A?.getVolume?.() ?? 0.6)) * 0.35;
    if (!vol) return;
    AC ||= new (globalThis.AudioContext || /** @type {any} */ (globalThis).webkitAudioContext)();
    const t0 = AC.currentTime;
    const g = AC.createGain(); g.connect(AC.destination);
    const tone = (type, f0, f1, at, dur, v = 1) => {
      const o = AC.createOscillator(); const gg = AC.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t0 + at); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + at + dur);
      gg.gain.setValueAtTime(0, t0 + at); gg.gain.linearRampToValueAtTime(vol * v, t0 + at + 0.02); gg.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      o.connect(gg); gg.connect(g); o.start(t0 + at); o.stop(t0 + at + dur + 0.05);
    };
    if (kind === 'buzz') { for (let i = 0; i < 4; i++) { tone('sawtooth', 520, 880, i * 0.32, 0.3, 0.7); tone('square', 260, 440, i * 0.32, 0.3, 0.25); } }
    else if (kind === 'ring') { for (let i = 0; i < 2; i++) for (let j = 0; j < 8; j++) tone('sine', j % 2 ? 1180 : 1320, null, i * 0.9 + j * 0.05, 0.05, 0.6); }
    else if (kind === 'coin') { tone('square', 988, null, 0, 0.08, 0.4); tone('square', 1319, null, 0.08, 0.25, 0.4); }
    else if (kind === 'lose') { tone('triangle', 330, 180, 0, 0.45, 0.6); }
    else if (kind === 'open') { tone('triangle', 660, 1320, 0, 0.25, 0.4); }
  } catch { /* sound never breaks the stage */ }
}

// ── the HUD ─────────────────────────────────────────────────────────────
// The room, as the House of Secrets calls it: the plate knows better than Big Brother's room names
// ("Storage Room" is the Store; there are two bedrooms; the hallway is the secret passage).
/** @type {[RegExp, string][]} */
const ROOM_OF_PLATE = [[/^bedroom2-/, "Boys' Bedroom"], [/^bedroom-/, "Girls' Bedroom"], [/^storage/, 'The Store'], [/^(hallway|purple-hall)$/, 'Secret Passage'],
  [/^foyer$/, 'The Airlock'], [/^ss-attic/, 'The Secret Room'], [/^hoh-suite$/, 'The Love Room'], [/^library-/, 'The Library'], [/^gym-/, 'The Gym'],
  [/^(pool-|patio$)/, 'The Pool'], [/^lawn-/, 'The Garden'], [/^(front|balcony)$/, 'The Garden'], [/^nom-table$/, 'Living Room'], [/^confessional/, 'Confessional']];
// (a hidden space keeps its own name, whatever room stands in for it until its plate exists: vp-bb-ep/ss-groups.js)
const SPACE_ROOMS = /^(The Control Tower|The Secret Box|The Intruders' House|The Crystal House|The Hotel of Secrets|The Yacht of Secrets|The Portrait Gallery|The Tunnel|The Red Room|The Clue Room)$/;
const roomOf = S => { if (SPACE_ROOMS.test(S.room || '')) return S.room; const p = S.plate || ''; for (const [re, n] of ROOM_OF_PLATE) if (re.test(p)) return n; return S.room || ''; };

/** The top of the screen: the show's bug, the room, the day, the viewer's kitty. */
export function ssHudHtml(S, st, fresh, o) {
  const isDr = st && st.k === 'dr';
  const room = isDr ? 'Confessional' : roomOf(S);
  const b = bankOf(o?.ssKey);
  return `<div class="ssh">
    <div class="ssh-bug"><img class="ssh-eye" src="${EYE}" alt=""><div class="ssh-wm">${ssx('SECRET STORY')}<span class="sub">WEEK ${esc(S.week)} · DAY ${esc(S.day)}</span></div>
      ${/LIVE/i.test(String(S.time || '')) ? '<span class="ssh-live">LIVE</span>' : `<span class="ssh-time">${esc(S.time || '')}</span>`}
      <span class="ssh-room ${fresh ? 'fresh' : ''}">${esc(String(room))}</span></div>
    <div class="ssh-bank" title="Your bank, as a viewer: call what happens next to grow it. Each housemate's own kitty is in Intel."><img src="${PROPS}/kitty-stand.webp" alt=""><div><i>VIEWER BANK</i><b>${money(b.kitty)}</b></div></div>
  </div>`;
}

/** The title card before a screen's first line. */
export function ssRestHtml(S) {
  return `<div class="ssrest"><img class="ssrest-eye" src="${EYE}" alt=""><div class="k">${esc(S.kicker)}</div><div class="t">${ssx(S.title)}</div><div class="s">${esc(S.sub)}</div><div class="go">▶ PLAY</div></div>`;
}

// ── the dialogue box ────────────────────────────────────────────────────
/**
 * The line on screen. `H` = { emph, names, col, nominated } from stage.js.
 * A housemate's line is a visual novel's box; a confessional has the show's name plate; the
 * host is live; the Voice speaks through the Eye; a beat is the narrator.
 */
export function ssLineHtml(S, st, fresh, L, H) {
  if (!st || st.quiet) return '';
  if (st.k === 'voice' || st.k === 'bb') {
    return `<div class="ssv ${fresh ? 'fresh' : ''}"><div class="ssv-eye"><i></i><i></i><i></i><img src="${EYE}" alt=""></div>
      <div class="ssv-body"><b>${st.falseVoice ? esc(String(st.by || 'The New Voice').toUpperCase()) : 'THE VOICE'}</b><div class="ssv-tx">${esc(st.t)}</div></div></div>`;
  }
  if (st.k === 'beat') return `<div class="ssn ${fresh ? 'fresh' : ''}"><span>${esc(st.t)}</span></div>`;
  const c = H.col(st.by);
  const tx = `<div class="tx" data-full="${esc(st.t)}" data-emph="${esc(H.emph(st.t, H.names))}">${fresh ? '' : H.emph(st.t, H.names)}</div>`;
  if (st.k === 'dr') {
    return `<div class="ssd ${fresh ? 'fresh' : ''}" style="--c:${c}"><div class="ssd-plate"><b><span>${esc(st.by)}</span></b><i>${st.live ? 'LIVE · CONFESSIONAL' : st.clip ? 'PORTRAIT' : 'CONFESSIONAL'}</i></div>
      <div class="ssd-body">${tx}</div></div>`;
  }
  const role = st.k === 'host' ? 'HOST · LIVE' : H.nominated?.(st.by) ? 'NOMINATED' : 'HOUSEMATE';
  return `<div class="ssl ${st.k === 'host' ? 'host' : ''} ${fresh ? 'fresh' : ''}" style="--c:${c}"><div class="ssl-tab"><b>${esc(st.by)}</b><i>${role}</i></div>
    <div class="ssl-body">${tx}</div><span class="ssl-next">▼</span></div>`;
}

// ── the pieces on the stage ─────────────────────────────────────────────
const PROP = {
  buzzer: { src: 'buzzer', cls: 'p-buzzer', cue: 'PRESS THE BUZZER', snd: 'buzz' },
  phone: { src: 'phone-red', cls: 'p-phone', cue: 'PICK UP', snd: 'ring' },
  envelope: { src: 'envelope', cls: 'p-envelope', cue: 'OPEN THE ENVELOPE', snd: 'open' },
  chest: { src: 'clue-chest', cls: 'p-chest', cue: 'OPEN THE CHEST', snd: 'open' },
  ball: { src: 'crystal-ball', cls: 'p-ball', cue: '', snd: '' },
  portrait: { src: 'portrait', cls: 'p-portrait', cue: '', snd: '' },
};

// eight hearts, each its own drift and delay (inline SVG: a heart is a path, never a box of divs)
const HEARTS = Array.from({ length: 8 }, (_, i) => `<svg viewBox="0 0 32 29" style="--i:${i};--x:${((i * 37) % 9) - 4}cqw;--s:${(0.7 + ((i * 13) % 6) / 10).toFixed(2)}"><path d="M16 28 C 6 20 0 14 0 8 A 8 8 0 0 1 16 4 A 8 8 0 0 1 32 8 C 32 14 26 20 16 28 Z" fill="${i % 3 ? '#ff4f9a' : '#ff9cc6'}"/></svg>`).join('');

/** Leans the two kissing tiles in until they meet, and puts the hearts between them. */
function placeKiss() {
  if (typeof document === 'undefined') return;
  for (const k of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.ss-kiss:not([data-placed])'))) {
    k.dataset.placed = '1';
    const root = k.closest('[id^="bbx-st-"]') || document;
    const tile = n => /** @type {HTMLElement|null} */ ([...root.querySelectorAll('.gt:not(.host) .plate b[data-t]')].find(b => /** @type {HTMLElement} */ (b).dataset.t === n)?.closest('.gt') || null);
    const a = tile(k.dataset.a), b = tile(k.dataset.b);
    if (!a || !b || !a.parentElement) { k.remove(); continue; }
    const [l, r] = a.offsetLeft <= b.offsetLeft ? [a, b] : [b, a];
    const mid = (l.offsetLeft + r.offsetLeft) / 2, half = l.offsetWidth * 0.36;
    // (each slides to just short of the middle and tips towards the other; the stage redraws them on the next step)
    l.style.setProperty('--kx', `${(mid - half - l.offsetLeft).toFixed(1)}px`); l.style.setProperty('--kr', '7deg');
    r.style.setProperty('--kx', `${(mid + half - r.offsetLeft).toFixed(1)}px`); r.style.setProperty('--kr', '-7deg');
    l.classList.add('ss-kissing'); r.classList.add('ss-kissing');
    k.style.left = `${mid.toFixed(1)}px`;
    k.style.top = `${(l.offsetTop + l.offsetHeight * 0.1).toFixed(1)}px`;
    a.parentElement.appendChild(k);
  }
}

// The painted board on the user's clue room plates (to-edit-family5), in % of the stage: the cork area, its round
// frames for faces (centres), a frame's width, and the cards' type size
const PLATE_BOARD = {
  'ss-clue-room': { L: 27.8, T: 17, W: 31.4, H: 29.8, f: [[30.1, 9.6], [34.7, 9.6], [52.6, 9.6], [57.2, 9.6]], fd: 4.2, fs: 0.62 },
  'ss-clue-board': { L: 40.7, T: 16, W: 53.8, H: 38.7, f: [[44.3, 7.4], [52, 7.4], [82.2, 7.4], [90.2, 7.4]], fd: 6.4, fs: 0.95 },
};

/** Puts each new clue card in its housemate's hand: beside their tile, in the same (zoomed) layer as the tiles,
 * measured in layout pixels so the camera moves it with them. A pass flies from the giver's hand to the taker's. */
function placeCarry() {
  if (typeof document === 'undefined') return;
  for (const c of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.ss-carry:not([data-placed])'))) {
    c.dataset.placed = '1';
    const root = c.closest('[id^="bbx-st-"]') || document;
    const tile = n => n ? /** @type {HTMLElement|null} */ ([...root.querySelectorAll('.gt:not(.host) .plate b[data-t]')].find(b => /** @type {HTMLElement} */ (b).dataset.t === n)?.closest('.gt') || null) : null;
    const from = tile(c.dataset.by), to = tile(c.dataset.to);
    const home = to || from;
    if (!home || !home.parentElement) { c.remove(); continue; }
    // (a tile's box is centred on its offsetLeft: .gt is drawn translateX(-50%))
    // (beside the tile, on the side with room: a housemate at the right edge holds it on the left)
    const W = home.parentElement.offsetWidth || 1, cw = c.offsetWidth || W * 0.052;
    const hand = g => { const t = /** @type {HTMLElement} */ (g.querySelector('.tile')) || g; const right = g.offsetLeft + g.offsetWidth * 0.42 + cw < W;
      return { x: right ? g.offsetLeft + g.offsetWidth * 0.42 : g.offsetLeft - g.offsetWidth * 0.42 - cw, y: g.offsetTop + t.offsetTop + t.offsetHeight * 0.38 }; };
    const at = hand(home);
    c.style.left = `${at.x.toFixed(1)}px`;
    c.style.top = `${at.y.toFixed(1)}px`;
    if (from && to) {
      const a = hand(from);
      c.style.setProperty('--dx', `${(a.x - at.x).toFixed(1)}px`);
      c.style.setProperty('--dy', `${(a.y - at.y).toFixed(1)}px`);
    }
    home.parentElement.appendChild(c);
  }
}

/** Props, the secret card, the call and its payoff, for step `st` (`o` = the stage's options). */
export function ssPiecesHtml(S, st, idx, fresh, o, H) {
  if (!st) return '';
  let h = '';
  // A new screen opens through the Eye (the user, 2026-10-29: "the screen switcher with the eye animations"): the Eye
  // blinks open on the show's pink, then the camera dives through its pupil into the next screen
  if (fresh && idx === 0) {
    h += `<div class="ss-sw"><img class="ss-sw-eye" src="${EYE}" alt=""></div>`;
    setTimeout(() => ssSfx('whoosh', 0.5), 380);
  }
  // the eliminated walks into the studio: the lights sweep the room and the crowd roars, or boos (vp-bb-ep/steps.js ssWalkScreen)
  if (st.studioIn) {
    if (fresh) { if (st.studioIn === 'boo') { ssSfx('boo', 1); setTimeout(() => ssSfx('applause', 0.6), 400); } else { ssSfx('applause', 1); setTimeout(() => ssSfx('cheer', 0.8), 250); } }
    h += `<div class="ss-lights ${st.studioIn === 'boo' ? 'boo' : ''} ${fresh ? 'fresh' : ''}"><i></i><i></i><i></i><i></i><i></i><i></i><b></b></div>`;
  }
  // the thermal camera (vp-bb-ep/ss-prime-nights.js): the shot in false colour, with its scale
  if (S.thermal) h += '<div class="ss-thermal"><i></i><b>THERMAL</b></div>';
  // a party: the lights, the mirror ball, and everybody on the floor dancing (vp-bb-ep/steps.js ssPartyScreen)
  if (S.party) h += '<div class="ss-party"><i></i><i></i><i></i><b></b></div>';
  // THE BREAK: the Eye and the show's jingle, where the real show cuts to the ads (vp-bb-ep/steps.js ssBreaks)
  if (st.bumper) {
    if (fresh) setTimeout(() => sfx('jingle'), 40);
    h += `<div class="ssbk ${fresh ? 'fresh' : ''}"><div class="ssbk-rays"></div><div class="ssbk-ring"></div><img class="ssbk-eye" src="${EYE}" alt="">
      <div class="ssbk-t">${ssx('SECRET STORY')}</div><div class="ssbk-n"><i>AFTER THE BREAK</i><b>${esc(st.bumper.next || '')}</b></div></div>`;
  }
  // THE BUZZ: the alarm, and the whole house in red (the user, 2026-10-29). The siren plays once, from the press or,
  // when nobody clicked the buzzer, from the first red step after it
  if (st.alarm) {
    if (fresh && !st.press && Date.now() - (Number(/** @type {any} */ (globalThis).__ssAlarmAt) || 0) > 8000) { /** @type {any} */ (globalThis).__ssAlarmAt = Date.now(); setTimeout(() => sfx('buzz'), 30); }
    h += `<div class="ss-red ${fresh ? 'fresh' : ''}"><div class="ss-red-beam"></div><b>BUZZ</b></div>`;
  }
  const P = st.prop && PROP[st.prop];
  if (P) {
    const press = st.press && fresh;
    // beside the people, never in front of a face: the widest gap between them (or high and small, if none)
    const xs = (S.cast || []).map(c => (Array.isArray(c) ? Number(c[1]) : 50)).filter(x => !Number.isNaN(x)).sort((a, b) => a - b);
    const edges = [8, ...xs, 92];
    let gap = 0, gx = 50;
    for (let i = 1; i < edges.length; i++) if (edges[i] - edges[i - 1] > gap) { gap = edges[i] - edges[i - 1]; gx = (edges[i] + edges[i - 1]) / 2; }
    const pos = !xs.length ? '' : gap >= 30 ? `left:${gx.toFixed(1)}%` : 'bottom:25cqw;--sc:.72';
    h += `<div class="ssp ${P.cls} ${fresh ? 'fresh' : ''} ${press ? 'ss-on' : ''}" style="${pos}" ${press ? `onclick="event.stopPropagation();ssPress(this,'${P.snd}')"` : ''}>
      <img src="${PROPS}/${P.src}.webp" alt="">${press && P.cue ? `<span class="ssp-cue">${P.cue}</span>` : ''}</div>`;
    // (the alarm's siren is the buzz itself: played once, by the alarm above)
    if (fresh && !st.press && P.snd && !st.alarm) setTimeout(() => sfx(P.snd), 60);
  }
  // (a secret's card has no `kind`: one with a kind is the house's alliance card, drawn by the stage itself; read as a
  // secret it was an empty white card over the alliance's name: the user, 2026-10-28, "what's happening here")
  if (st.card && !st.card.kind) {
    const C = st.card;
    h += `<div class="ssc ${fresh ? 'fresh' : 'shown'} ${esc(C.state || '')}"><div class="ssc-in">
      <div class="ssc-f ssc-front"><img src="${EYE}" alt=""><b>SECRET</b></div>
      <div class="ssc-f ssc-back"><i>${esc(C.who || '')}</i><b>“${esc(C.text || '')}”</b>${C.state ? `<em>${C.state === 'found' ? 'FOUND' : C.state === 'wrong' ? 'WRONG' : C.state === 'kept' ? 'NEVER FOUND' : C.state === 'evidence' ? 'EVIDENCE' : C.state === 'clue' ? 'THE CLUE' : ''}</em>` : ''}</div>
    </div></div>`;
  }
  // the kitties: every housemate's money rolls up (or down) from where the week began, coins stacked by size
  if (st.kitties) {
    const top = Math.max(1, ...st.kitties.map(r => r.to));
    h += `<div class="ssk ${fresh ? 'fresh' : ''}"><b class="ssk-h">${ssx('THE KITTIES', 't')}</b><div class="ssk-r">${st.kitties.map((r, i) => {
      const up = r.to - r.from;
      return `<div class="ssk-c" style="--i:${i};--h:${Math.max(4, Math.round(r.to / top * 100))}%"><div class="ssk-stack"><i></i></div>
        <span class="ssk-n" style="--from:${Math.round(r.from)};--to:${Math.round(r.to)}" data-v="${money(r.to)}"></span>${up ? `<em class="${up > 0 ? 'up' : 'down'}">${up > 0 ? '+' : '−'}${money(Math.abs(up)).slice(1)}</em>` : ''}
        <span class="ssk-f" style="--c:${H.col(r.n)}">${H.img(r.n)}</span><b>${esc(r.n)}</b>${st.kittyStamp ? `<i class="ssk-v" style="--i:${i}">${esc(st.kittyStamp)}</i>` : ''}</div>`;
    }).join('')}</div></div>`;
  }
  // THE CLUE ROOM'S BOARD (vp-bb-ep/ss-clue-room.js): the cork board, the cards pinned to it, and the faces the group
  // has strung to them; the card being talked about lit up, a new one popping in
  // (on the user's own plates the board is painted: the cards go onto it, the faces into its empty round frames)
  const PB = st.clueBoard && PLATE_BOARD[S.plate];
  if (PB && (st.clueBoard.cards || []).length) {
    const B = st.clueBoard;
    const cards = B.cards.slice(-8);
    const cols = Math.min(4, cards.length), rows = cards.length > 4 ? 2 : 1;
    const at = i => ({ x: PB.L + PB.W * (((i % 4) + 0.5) / cols), y: PB.T + PB.H * ((Math.floor(i / 4) + 0.5) / rows) });
    const pins = (B.pins || []).filter(p => cards.some(c => c.clue === p.clue)).slice(0, PB.f.length);
    const lines = pins.map((p, j) => { const c = at(cards.findIndex(x => x.clue === p.clue)); return `<line x1="${PB.f[j][0]}" y1="${PB.f[j][1] + PB.fd * 0.9}" x2="${c.x.toFixed(1)}" y2="${(c.y - PB.H / rows * 0.32).toFixed(1)}"/>`; }).join('');
    h += `<div class="ss-board onplate ${fresh ? 'fresh' : ''}" style="--fs:${PB.fs}cqw"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>
      ${pins.map((p, j) => `<span class="sbf ${B.add === p.face && fresh ? 'pop' : ''}" style="left:${PB.f[j][0]}%;top:${PB.f[j][1]}%;width:${PB.fd}%;--c:${H.col(p.face)}"><i>${esc(String(p.face)[0])}</i>${H.img(p.face)}</span>`).join('')}
      ${cards.map((c, i) => { const p = at(i); return `<b class="sbc ${B.focus === c.clue ? 'on' : ''} ${B.fresh === c.clue && fresh ? 'pop' : ''}" style="left:${p.x.toFixed(1)}%;top:${p.y.toFixed(1)}%;width:${(PB.W / cols * 0.8).toFixed(1)}%;min-height:${(PB.H / rows * 0.55).toFixed(1)}%;--r:${((i * 37) % 9) - 4}deg">${esc(c.clue)}</b>`; }).join('')}</div>`;
  } else if (st.clueBoard && (st.clueBoard.cards || []).length) {
    const B = st.clueBoard;
    const cards = B.cards.slice(-8);
    const pins = (B.pins || []).filter(p => cards.some(c => c.clue === p.clue)).slice(0, 5);
    const cx = i => 12.5 + 25 * (i % 4), cy = i => (cards.length > 4 ? 40 : 58) + 36 * Math.floor(i / 4);
    const fx = j => ((j + 1) * 100) / (pins.length + 1);
    const lines = pins.map((p, j) => { const i = cards.findIndex(c => c.clue === p.clue); return `<line x1="${fx(j)}" y1="13" x2="${cx(i)}" y2="${cy(i) - 12}"/>`; }).join('');
    h += `<div class="ss-board ${fresh ? 'fresh' : ''}"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>
      ${pins.map((p, j) => `<span class="sbf ${B.add === p.face && fresh ? 'pop' : ''}" style="left:${fx(j)}%;--c:${H.col(p.face)}"><i>${esc(String(p.face)[0])}</i>${H.img(p.face)}</span>`).join('')}
      ${cards.map((c, i) => `<b class="sbc ${B.focus === c.clue ? 'on' : ''} ${B.fresh === c.clue && fresh ? 'pop' : ''}" style="left:${cx(i)}%;top:${cy(i)}%;--r:${((i * 37) % 9) - 4}deg">${esc(c.clue)}</b>`).join('')}</div>`;
  }
  // A KISS (the user, 2026-10-30: "kiss should be more of an event with animation of them kissing"): the two tiles
  // lean in and meet in the middle, the room glows pink, and hearts float up from between them
  if (st.kiss && st.kiss.length === 2) {
    h += `<div class="ss-kissglow ${fresh ? 'fresh' : ''}"></div><div class="ss-kiss" data-a="${esc(st.kiss[0])}" data-b="${esc(st.kiss[1])}">${HEARTS}</div>`;
    setTimeout(placeKiss, 0);
  }
  // THE CLUE IN HAND (vp-bb-ep/steps.js ssHandedClueScreen; the user, 2026-10-29: "the clue screen needs the card
  // animated when they walk out"): it flies out of the confessional into their hand, then is held up, passed to
  // somebody, or slipped into a pocket
  // (drawn loose, then moved into the housemate's own tile once the stage is up: the stage arranges and zooms a
  // crowd, so the card follows the person, not a guessed position)
  if (st.carry) {
    const C = st.carry;
    const mode = C.mode || 'hold';
    if (fresh && (mode === 'out' || mode === 'pass')) setTimeout(() => ssSfx('whoosh', 0.35), mode === 'out' ? 60 : 200);
    if (fresh || mode !== 'pocket') {
      h += `<div class="ss-carry m-${esc(mode)} ${fresh ? 'fresh' : ''}" data-by="${esc(C.by)}" data-to="${esc(mode === 'pass' ? C.to || '' : '')}">
        <div class="cc"><img src="${EYE}" alt=""><i>THE CLUE</i></div></div>`;
      setTimeout(placeCarry, 0);
    }
  }
  // money changing hands: coins fly from one housemate to the other
  if (st.coins && fresh) {
    const xs = Object.fromEntries((S.cast || []).filter(Array.isArray));
    const a = xs[st.coins.from] ?? 30, b = xs[st.coins.to] ?? 70;
    h += `<div class="ssf" style="--a:${a}%;--b:${b}%">${Array.from({ length: 14 }, (_, i) => `<img src="${PROPS}/kitty-stand.webp" style="--d:${(i * 0.07).toFixed(2)}s;--y:${(i % 5) * 1.4}cqw" alt="">`).join('')}</div>`;
    setTimeout(() => sfx('coin'), 300);
  }
  // the Oops night: the signs go up over the heads of whoever it fits
  if (st.signs) {
    const xs = Object.fromEntries((S.cast || []).filter(Array.isArray));
    h += st.signs.map((n, i) => `<div class="sso ${fresh ? 'fresh' : ''}" style="left:${xs[n] ?? 30 + i * 20}%;--i:${i}"><b>OOPS!</b><i></i></div>`).join('');
  }
  // THE LIST OF SECRETS, as the show draws it: a sky of pink clouds, a pill per secret, the face of whoever the
  // public already knows it belongs to on a cloud beside it (the user's reference, S14)
  if (st.secretlist) {
    const L = st.secretlist;
    // (a secret read out on its own first: its card, numbered, over the board; the user, 2026-10-29)
    const card = L.show ? `<div class="ssls-card ${fresh ? 'fresh' : ''}"><i>SECRET N°${esc(L.show.no)}</i><b>${esc(L.show.text)}</b>${L.show.pair ? '<em>SHARED BY TWO</em>' : ''}<img src="${EYE}" alt=""></div>` : '';
    h += `<div class="ssls ${fresh && !L.show ? 'fresh' : ''} ${L.show ? 'carded' : ''}"><div class="ssls-sky"></div><b class="ssls-h"><span>THE LIST</span><span>OF SECRETS</span></b>${card}<div class="ssls-r ${(L.rows || []).length > 6 ? 'many' : ''}">${(L.rows || []).map((r, i) => `
      <div class="ssls-row ${r.new ? 'new' : ''} g${i % 4}" style="--i:${i}">${r.who ? ((ws) => `<span class="ssls-who"><em>${esc(ws.join(' & '))}</em>${ws.map((w, j) => `<span class="ssls-f" style="--c:${H.col(w)};--j:${j}">${H.img(w)}</span>`).join('')}</span>`)(r.whos?.length ? r.whos : [r.who]) : ''}<span class="ssls-p">${esc(r.text)}</span></div>`).join('')}</div>
      <img class="ssls-eye" src="${EYE}" alt=""></div>`;
  }
  // the nominees in the airlock, holding hands: one ribbon of hands across the line of them
  if (S.hands && Array.isArray(S.cast) && S.cast.length > 1 && !st.out) {
    const p = S.cast.map(c => Number(c[1]) || 50).sort((x, y) => x - y);
    h += p.slice(1).map((x, i) => `<i class="ssha" style="left:${(p[i] + x) / 2}%;--i:${i}"></i>`).join('');
  }
  // a package's title card (the real prime's "magnéto"): it fills the screen, then the tape rolls
  if (st.magneto) {
    const M = st.magneto;
    h += `<div class="ssmg ${fresh ? 'fresh' : ''}"><div class="ssmg-rays"></div><img class="ssmg-eye" src="${EYE}" alt="">
      ${M.n ? `<span class="ssmg-tag">TAPE ${M.n}</span>` : ''}
      ${(M.who || []).length ? `<div class="ssmg-ps ${M.who.length > 3 ? 'n4' : ''}">${M.who.slice(0, 4).map((n, i, w) => `${i && M.sym ? `<i class="ssmg-sym">${esc(M.sym)}</i>` : ''}<span class="ssmg-p" style="--c:${H.col(n)};--i:${i};--d:${i === 0 ? -1 : i === w.length - 1 ? 1 : 0}">${H.img(n)}<em>${esc(n)}</em></span>`).join('')}</div>` : ''}
      <b class="ssmg-t">${ssx(M.title)}</b><span class="ssmg-s">${esc(M.sub || '')}</span></div>`;
  }
  // the call to vote: every nominee under a big number, and how to vote
  if (st.votecall) {
    const V = st.votecall;
    h += `<div class="ssvc ${fresh ? 'fresh' : ''}"><div class="ssvc-sky"></div><div class="ssvc-r">${V.map((n, i) => `
      <div class="ssvc-c" style="--i:${i}"><b class="ssvc-n">${i + 1}</b><span class="ssvc-f" style="--c:${H.col(n)}">${H.img(n)}</span><em>${esc(n)}</em></div>`).join('')}</div>
      <div class="ssvc-how"><span>TEXT <b>THE NUMBER</b> TO <b>71 700</b></span><span><b>CALL</b> 3690 · OR VOTE IN <b>THE APP</b></span><small>The public decides who stays</small></div></div>`;
  }
  if (st.ask) h += askHtml(st.ask, o, H);
  if (st.settle && fresh) {
    const r = settleCall(o?.ssKey, st.settle.id, st.settle.answer, st.settle.n || 2);
    if (r.picked != null) {
      setTimeout(() => sfx(r.right ? 'coin' : 'lose'), 120);
      h += `<div class="sss ${r.right ? 'win' : 'lose'}"><i>${r.right ? 'YOU CALLED IT' : 'WRONG CALL'}</i><b>${ssx(money(r.delta), r.right ? 'g' : 'w')}</b><span>Your bank: ${money(r.kitty)}</span>
        ${r.right ? `<div class="sss-coins">${Array.from({ length: 16 }, (_, i) => `<img src="${PROPS}/kitty-stand.webp" style="--a:${(i * 22.5).toFixed(1)}deg;--d:${(i % 5) * 0.04}s" alt="">`).join('')}</div>` : ''}</div>`;
    }
  }
  return h;
}

function askHtml(A, o, H) {
  const b = bankOf(o?.ssKey);
  const picked = b.picks[A.id];
  const settled = b.settled[A.id] != null;
  const chips = (A.opts || []).map(op => {
    const face = A.people ? `<span class="ssa-f" style="--c:${H.col(op)}">${H.img(op)}</span>` : '';
    const on = picked === op;
    return `<button type="button" class="ssa-o ${on ? 'on' : ''}" ${picked != null ? 'disabled' : ''} onclick="event.stopPropagation();ssCall(this,'${esc(A.id)}','${esc(String(op).replace(/'/g, '\\\''))}')">${face}<b>${esc(op)}</b></button>`;
  }).join('');
  return `<div class="ssa ${picked != null ? 'done' : ''} ${settled ? 'settled' : ''}" onclick="event.stopPropagation()" data-key="${esc(o?.ssKey || '')}">
    <div class="ssa-h"><i>CALL IT</i><b>${esc(A.q)}</b><span>${picked != null ? 'Your call is in. Play on to find out.' : `Right: +${money(payout((A.opts || []).length))} · wrong: −${money(STAKE)} · or just play on`}</span></div>
    <div class="ssa-os">${chips}</div></div>`;
}

// ── handlers ────────────────────────────────────────────────────────────
/** A call made: kept, and the chips lock (no repaint, so the line keeps typing). */
export function ssCall(el, id, op) {
  const box = el.closest('.ssa');
  const key = box?.dataset?.key || '';
  const b = bankOf(key);
  if (b.picks[id] != null) return;
  b.picks[id] = op;
  saveBank(key, b);
  sfx('open');
  box.classList.add('done');
  box.querySelectorAll('.ssa-o').forEach(x => { x.setAttribute('disabled', ''); if (x === el) x.classList.add('on'); });
  const note = box.querySelector('.ssa-h span');
  if (note) note.textContent = 'Your call is in. Play on to find out.';
}
/** A prop pressed: its sound, its burst, and the next line. */
export function ssPress(el, snd) {
  if (el.classList.contains('pressed')) return;
  el.classList.add('pressed');
  if (snd === 'buzz') /** @type {any} */ (globalThis).__ssAlarmAt = Date.now();
  sfx(snd);
  const root = el.closest('.bbx');
  const st = el.closest('.stage');
  st?.classList.add(snd === 'buzz' ? 'ss-alarm' : 'ss-pop');
  const uid = root?.getAttribute('data-uid');
  setTimeout(() => { if (uid && typeof globalThis.bbxNext === 'function') globalThis.bbxNext(uid); }, snd === 'buzz' ? 900 : 500);
}
if (typeof window !== 'undefined') Object.assign(window, { ssCall, ssPress });

// ── the look ────────────────────────────────────────────────────────────
export const SS_CSS = `${SS_TYPE_CSS}
@font-face{font-family:'SSNunito';src:url('assets/fonts/Nunito.woff2') format('woff2');font-weight:200 1000;font-display:swap}
.bbx .stage.ss{--ssp:#ff3ea5;--ssm:#c8137a;--sst:#19d3c5;--ssi:#2b0d3f;--ssg:#f5c542;--ssc:#fff6fb;font-family:'SSNunito',system-ui,sans-serif}
/* a clean HD picture: no film grain, no scanlines (the user, 2026-10-28: "we're not in 2006 anymore") */
.bbx .stage.ss .grain{display:none}
/* a name on screen is the real show's caption (the user, 2026-10-29, with a still of one: "this is the fonts and the
   stylization we need"): capitals in Aachen Bold, a magenta gradient, on a white sticker with a thin dark rim.
   Under the faces it is only drawn in a crowd (3+ in shot): "we dont really need a name under their avatar most
   of the time", and alone or in a pair the line's own plate already says who is talking */
.bbx .stage.ss .plate b,.bbx .stage.ss .plate span{font-family:'SSAachen',sans-serif!important;font-weight:400!important;letter-spacing:.03em}
.bbx .stage.ss .gt .plate b{display:none;position:relative;font-size:1.25cqw;line-height:1;text-transform:uppercase;text-shadow:none;
  background:linear-gradient(180deg,#fff 55%,#f3e7f0);padding:.3cqw .55cqw .2cqw;border-radius:.4cqw;box-shadow:0 0 0 .1cqw rgba(70,10,50,.6),0 .2cqw .5cqw rgba(0,0,0,.35)}
.bbx .stage.ss:has(.gt:not(.bgp) ~ .gt:not(.bgp) ~ .gt:not(.bgp)) .gt .plate b{display:inline-block}
.bbx .stage.ss .gt .plate b>span,.ssd-plate b>span{color:transparent;-webkit-background-clip:text;background-clip:text;text-shadow:none;
  background-image:linear-gradient(180deg,#ff9fd8 0%,#ff4db5 32%,#e5168f 58%,#c30f7f 82%,#990a66 100%)}
.bbx .stage.ss .gt.host .plate b>span{background-image:linear-gradient(180deg,#8ff5ea 0%,#19d3c5 45%,#0d8f86 100%)}
.bbx .stage.ss .ledtv::after{background:linear-gradient(0deg,rgba(0,0,0,.65),transparent 30%)}
.bbx .stage.ss .vign{background:radial-gradient(ellipse at center,transparent 70%,rgba(0,0,0,.22))}
.bbx .stage.ss .toast b{font-family:'SSAachen',sans-serif;font-weight:700;letter-spacing:.02em}
.bbx .stage.ss .bigrev b,.bbx .stage.ss .bigrev i{font-family:'SSAachen',sans-serif}
.bbx .stage.ss .bigrev b{font-size:min(9cqw,calc(140cqw / var(--len,10)))}
.bbx .stage.ss .bigrev.name b{font-size:min(7.5cqw,calc(130cqw / var(--len,10)))}
.bbx .stage.ss .fboard{font-family:'SSNunito',sans-serif;border-radius:1.4cqw;background:linear-gradient(160deg,rgba(43,13,63,.92),rgba(80,12,70,.9));box-shadow:0 0 0 .25cqw var(--ssp),0 1.5cqw 4cqw rgba(0,0,0,.45)}
.bbx .stage.ss .fboard .fh{font-family:'SSAachen',sans-serif;color:var(--ssg)}
/* (the board's amount is .ft, a class Big Brother's camera thumbnails also style as a 16:9 box) */
.bbx .stage.ss .fboard .ft{width:auto;aspect-ratio:auto;box-shadow:none;opacity:1;overflow:visible;margin-left:auto;padding-left:1.4cqw;font:700 1.6cqw 'SSAachen',sans-serif;color:#fff}
.bbx .stage.ss .fboard .fbr b{font:700 1.3cqw 'SSAachen',sans-serif;color:#fff}
/* the HUD */
.ssh{position:absolute;inset:0 0 auto 0;z-index:30;display:flex;justify-content:space-between;align-items:flex-start;padding:1.4cqw 1.6cqw;pointer-events:none}
.ssh-bug{display:flex;align-items:center;gap:.9cqw}
.ssh-eye{width:5.6cqw;filter:drop-shadow(0 .3cqw .6cqw rgba(0,0,0,.4));animation:ss-blink 6s infinite;transform-origin:50% 55%}
.ssh-wm{font-family:'SSAachen',sans-serif;font-weight:700;font-size:2.5cqw;line-height:.95;color:#fff;letter-spacing:.03em;
  text-shadow:0 0 .1cqw var(--ssm),.15cqw .15cqw 0 var(--ssm),-.1cqw -.1cqw 0 var(--ssm),0 .4cqw 1cqw rgba(200,19,122,.6)}
.ssh-wm .sub{display:block;font-family:'SSNunito',sans-serif;font-weight:800;font-size:1cqw;letter-spacing:.18em;color:#fff;text-shadow:0 .1cqw .3cqw rgba(0,0,0,.6);margin-top:.3cqw}
.ssh-live{font:800 1cqw 'SSNunito',sans-serif;letter-spacing:.14em;color:#fff;background:var(--ssp);padding:.35cqw .8cqw;border-radius:2cqw;box-shadow:0 0 1.2cqw var(--ssp);animation:ss-pulse 1.6s infinite}
.ssh-time{font:800 1.1cqw 'SSNunito',sans-serif;color:#fff;background:rgba(43,13,63,.7);padding:.35cqw .8cqw;border-radius:2cqw}
.ssh-room{font:800 1cqw 'SSNunito',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--ssi);background:var(--sst);padding:.35cqw .9cqw;border-radius:2cqw}
.ssh-room.fresh{animation:ss-slidein .5s cubic-bezier(.2,1.4,.4,1)}
.ssh-bank{display:flex;align-items:center;gap:.6cqw;background:linear-gradient(135deg,rgba(43,13,63,.88),rgba(120,16,90,.85));border:.18cqw solid var(--ssg);
  border-radius:1.2cqw;padding:.45cqw 1cqw .45cqw .5cqw;box-shadow:0 .5cqw 1.4cqw rgba(0,0,0,.35)}
.ssh-bank img{width:3cqw}
.ssh-bank i{display:block;font:800 .8cqw 'SSNunito',sans-serif;letter-spacing:.18em;color:var(--ssg);font-style:normal}
.ssh-bank b{display:block;font:700 1.7cqw 'SSAachen',sans-serif;color:#fff}
/* the title card */
.ssrest{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;
  background:radial-gradient(60cqw 40cqw at 50% 45%,rgba(255,62,165,.55),rgba(43,13,63,.92) 70%)}
.ssrest-eye{width:16cqw;animation:ss-blink 4s infinite,ss-float 5s ease-in-out infinite;filter:drop-shadow(0 1cqw 2cqw rgba(0,0,0,.5))}
.ssrest .k{font:800 1.2cqw 'SSNunito',sans-serif;letter-spacing:.24em;color:var(--sst);text-transform:uppercase;margin-top:1.4cqw}
.ssrest .t{font:700 5.2cqw 'SSAachen',sans-serif;line-height:1;text-shadow:.25cqw .25cqw 0 var(--ssm),0 .8cqw 2cqw rgba(0,0,0,.5);margin:.6cqw 0}
.ssrest .s{font:700 1.6cqw 'SSNunito',sans-serif;opacity:.9}
.ssrest .go{margin-top:2cqw;font:800 1.2cqw 'SSNunito',sans-serif;letter-spacing:.2em;background:var(--ssp);padding:.8cqw 2cqw;border-radius:3cqw;box-shadow:0 0 2cqw var(--ssp);animation:ss-pulse 1.6s infinite}
/* the dialogue box */
.ssl,.ssd{position:absolute;left:4cqw;right:4cqw;bottom:1.8cqw;z-index:25}
.ssl-body,.ssd-body{background:linear-gradient(180deg,#fff,var(--ssc));border:.35cqw solid var(--c);border-radius:1.8cqw;padding:1.9cqw 2.4cqw 1.6cqw;min-height:6.4cqw;
  box-shadow:0 .5cqw 0 color-mix(in srgb,var(--c) 55%,#2b0d3f),0 1.6cqw 3.4cqw rgba(30,0,40,.45)}
.ssl .tx,.ssd .tx{font:700 2.05cqw/1.38 'SSNunito',sans-serif;color:var(--ssi)}
.ssl .tx b,.ssl .tx strong,.ssd .tx b{color:var(--ssm)}
.ssl-tab{position:absolute;left:2.2cqw;top:-2.1cqw;display:flex;align-items:baseline;gap:.8cqw;background:var(--c);color:#fff;padding:.5cqw 1.6cqw .6cqw;border-radius:1.4cqw 1.4cqw 1.4cqw .3cqw;
  box-shadow:0 .4cqw 1cqw rgba(0,0,0,.3)}
.ssl-tab b{font:700 2cqw 'SSAachen',sans-serif;letter-spacing:.01em}
.ssl-tab i{font:.85cqw 'SSAachen',sans-serif;letter-spacing:.18em;font-style:normal;opacity:.92}
.ssl.host{--c:#7c3aed}
.ssl-next{position:absolute;right:2.2cqw;bottom:1.2cqw;color:var(--c);font-size:1.3cqw;animation:ss-bob 1s ease-in-out infinite}
.ssl.fresh,.ssd.fresh{animation:ss-boxin .38s cubic-bezier(.2,1.3,.4,1)}
.ssd{left:30cqw;right:3cqw}
.ssd-plate{position:absolute;left:-26cqw;bottom:.6cqw;width:25cqw;display:flex;flex-direction:column;align-items:flex-start;gap:.55cqw}
.ssd-plate b{position:relative;max-width:100%;overflow:hidden;white-space:nowrap;font:3cqw/1 'SSAachen',sans-serif;text-transform:uppercase;letter-spacing:.03em;
  background:linear-gradient(180deg,#fff 55%,#f3e7f0);padding:.5cqw 1.05cqw .35cqw;border-radius:.75cqw;box-shadow:0 0 0 .16cqw rgba(70,10,50,.6),0 .4cqw 1cqw rgba(0,0,0,.35)}
.ssd-plate i{font:.95cqw 'SSAachen',sans-serif;letter-spacing:.28em;font-style:normal;color:#fff;background:rgba(43,13,63,.85);padding:.3cqw .8cqw;border-radius:.5cqw;margin-left:.4cqw}
.ssd.fresh .ssd-plate b{animation:ss-cap .45s cubic-bezier(.2,1.3,.4,1)}
@keyframes ss-cap{from{transform:translateX(-3cqw);opacity:0}}
/* the narrator */
.ssn{position:absolute;left:12cqw;right:12cqw;bottom:2.2cqw;z-index:25;text-align:center}
.ssn span{display:inline-block;font:italic 700 1.75cqw/1.4 'SSNunito',sans-serif;color:#fff;background:rgba(43,13,63,.78);padding:1cqw 2cqw;border-radius:1.2cqw;
  box-shadow:0 0 0 .15cqw rgba(255,255,255,.18),0 1cqw 2.4cqw rgba(0,0,0,.35);backdrop-filter:blur(.4cqw)}
.ssn.fresh span{animation:ss-fade .5s ease}
/* the Voice */
.ssv{position:absolute;left:8cqw;right:8cqw;bottom:2.4cqw;z-index:26;display:flex;align-items:center;gap:2cqw;padding:1.6cqw 2.4cqw;border-radius:2cqw;
  background:linear-gradient(120deg,rgba(43,13,63,.94),rgba(110,14,96,.92));box-shadow:0 0 0 .2cqw rgba(245,197,66,.65),0 0 4cqw rgba(255,62,165,.45)}
.ssv-eye{position:relative;width:11cqw;flex:none;display:grid;place-items:center}
.ssv-eye img{width:100%;position:relative;z-index:2;animation:ss-blink 3.2s infinite;transform-origin:50% 55%}
.ssv-eye i{position:absolute;inset:-.5cqw;border:.2cqw solid var(--ssg);border-radius:50%;opacity:0;animation:ss-ripple 2.4s infinite}
.ssv-eye i:nth-child(2){animation-delay:.8s}.ssv-eye i:nth-child(3){animation-delay:1.6s}
.ssv-body b{font:700 1.3cqw 'SSAachen',sans-serif;letter-spacing:.3em;color:var(--ssg)}
.ssv-tx{font:700 2.1cqw/1.4 'SSNunito',sans-serif;color:#fff;margin-top:.3cqw}
.ssv.fresh{animation:ss-voicein .6s cubic-bezier(.2,1.2,.4,1)}
.bbx .stage.ss.bbspeaks .cam{filter:brightness(.42) saturate(.75) blur(.15cqw)}
/* props */
.ssp{position:absolute;z-index:22;left:50%;transform:translateX(-50%) scale(var(--sc,1));transform-origin:50% 100%;bottom:13cqw;display:flex;flex-direction:column;align-items:center}
.bbx .stage .ssp img{display:block;margin:0 auto;filter:drop-shadow(0 1.2cqw 1.6cqw rgba(0,0,0,.45))}
.ssp.fresh{animation:ss-propin .6s cubic-bezier(.2,1.4,.4,1)}
.ssp.ss-on{cursor:pointer}
.ssp-cue{display:inline-block;margin-top:.8cqw;font:800 1.15cqw 'SSNunito',sans-serif;letter-spacing:.2em;color:#fff;background:var(--ssp);padding:.5cqw 1.4cqw;border-radius:2cqw;box-shadow:0 0 1.6cqw var(--ssp);animation:ss-pulse 1s infinite}
.bbx .stage .p-buzzer img{width:9cqw}.bbx .stage .p-buzzer.ss-on img{animation:ss-throb 1s ease-in-out infinite}
.bbx .stage .p-buzzer.pressed img{animation:ss-press .25s ease forwards}
.bbx .stage .p-phone img{width:9cqw;animation:ss-ring .12s linear infinite}.bbx .stage .p-phone.pressed img{animation:ss-lift .5s ease forwards}
.bbx .stage .p-envelope img{width:17cqw;animation:ss-float 3s ease-in-out infinite}.bbx .stage .p-envelope.pressed img{animation:ss-open .5s ease forwards}
.bbx .stage .p-chest img{width:15cqw}.bbx .stage .p-chest.pressed img{animation:ss-open .5s ease forwards}
.bbx .stage .p-ball img{width:12cqw;animation:ss-float 4s ease-in-out infinite}
.stage.ss-alarm::after{content:"";position:absolute;inset:0;z-index:60;pointer-events:none;background:rgba(255,20,60,.45);animation:ss-strobe .18s steps(2) 5}
.stage.ss-alarm .cam{animation:bbx-shake .5s}
/* the rig over the studio: six spots sweeping down on the stairs, the room flashing white on the name */
.gt.ss-kissing{translate:var(--kx) 0;rotate:var(--kr);transition:translate 1.1s cubic-bezier(.3,.1,.2,1),rotate 1.1s cubic-bezier(.3,.1,.2,1);z-index:6}
.ss-kissglow{position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(ellipse at 50% 55%,rgba(255,120,180,.38),rgba(120,0,70,.25) 70%);mix-blend-mode:screen}
.ss-kissglow.fresh{animation:ss-kglow 1.6s ease-out both}
.ss-kiss{position:absolute;width:0;height:0;z-index:7;pointer-events:none}
.ss-kiss svg{position:absolute;left:-1.4cqw;top:0;width:2.8cqw;scale:var(--s);opacity:0;animation:ss-heart 2.6s ease-out infinite;animation-delay:calc(1s + var(--i) * .3s)}
@keyframes ss-kglow{from{opacity:0}to{opacity:1}}
@keyframes ss-heart{0%{opacity:0;translate:0 0}15%{opacity:1}100%{opacity:0;translate:var(--x) -14cqw;rotate:calc(var(--x) * 3deg)}}
.ss-board{position:absolute;left:50%;top:7.5cqw;width:56cqw;height:20cqw;translate:-50% 0;z-index:21;border-radius:.8cqw;pointer-events:none;
  background:radial-gradient(circle at 20% 30%,rgba(255,255,255,.08) 0 .3cqw,transparent .4cqw) 0 0/2.2cqw 2.2cqw,linear-gradient(160deg,#9a6a3f,#7b4f2b);
  box-shadow:0 0 0 .5cqw #e0b84a,0 0 0 .75cqw #8a5a12,0 1.6cqw 3cqw rgba(30,0,30,.55)}
.ss-board.fresh{animation:ss-board-in .5s cubic-bezier(.2,.9,.3,1.2) both}
.ss-board.onplate{left:0;top:0;width:100%;height:100%;translate:none;background:none;box-shadow:none;border-radius:0}
.ss-board.onplate.fresh{animation:none}
.ss-board.onplate .sbc{font-size:var(--fs);padding:.3cqw .4cqw}
.ss-board.onplate .sbf{aspect-ratio:1;width:auto}
.ss-board svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ss-board line{stroke:#d61f3c;stroke-width:.35;vector-effect:non-scaling-stroke;stroke-width:2.2px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))}
.sbc{position:absolute;width:21%;min-height:28%;translate:-50% -50%;rotate:var(--r);display:grid;place-items:center;padding:.5cqw .7cqw;box-sizing:border-box;
  background:#fff8e4;border-radius:.25cqw;box-shadow:0 .4cqw .8cqw rgba(0,0,0,.35);font:600 .95cqw/1.15 Archivo,sans-serif;color:#3a2340;text-align:center;transition:scale .3s,box-shadow .3s}
.sbc::before{content:'';position:absolute;top:-.45cqw;left:50%;width:.9cqw;height:.9cqw;translate:-50% 0;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff8aa0,#c2185b)}
.sbc.on{scale:1.18;z-index:2;box-shadow:0 0 0 .25cqw #ffd54a,0 0 2cqw rgba(255,213,74,.8)}
.sbc.pop{animation:ss-card-pin .7s cubic-bezier(.2,1.6,.4,1) both}
.sbf{position:absolute;top:13%;width:3.6cqw;aspect-ratio:1;translate:-50% -50%;border-radius:50%;overflow:hidden;background:var(--c);box-shadow:0 0 0 .25cqw #fff,0 .4cqw .8cqw rgba(0,0,0,.4);z-index:3}
.sbf i{position:absolute;inset:0;display:grid;place-items:center;font:700 1.6cqw 'SSAachen',sans-serif;font-style:normal;color:#fff}
.sbf img{position:relative;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.sbf.pop{animation:ss-card-pin .7s .2s cubic-bezier(.2,1.6,.4,1) both}
@keyframes ss-board-in{from{opacity:0;translate:-50% -2cqw}to{opacity:1;translate:-50% 0}}
@keyframes ss-card-pin{0%{scale:2.2;opacity:0;rotate:-25deg}100%{scale:1;opacity:1}}
.ss-thermal{position:absolute;inset:0;z-index:19;pointer-events:none;background:linear-gradient(180deg,rgba(40,0,160,.55),rgba(0,170,200,.4) 35%,rgba(120,230,60,.35) 55%,rgba(255,200,0,.4) 75%,rgba(255,40,20,.5));mix-blend-mode:hard-light}
.ss-thermal i{position:absolute;right:2cqw;top:14cqw;width:1.2cqw;height:22cqw;border-radius:.6cqw;background:linear-gradient(0deg,#2800a0,#00aac8,#78e63c,#ffc800,#ff2814);box-shadow:0 0 0 .2cqw #fff}
.ss-thermal b{position:absolute;right:1.2cqw;top:11.4cqw;font:700 1cqw 'Chakra Petch',sans-serif;letter-spacing:.2cqw;color:#fff}
.ss-carry{position:absolute;width:5.2cqw;aspect-ratio:5/7;z-index:24;pointer-events:none}
.ss-carry:not([data-placed]){visibility:hidden}
.ss-carry .cc{width:100%;height:100%;box-sizing:border-box;border-radius:.6cqw;background:linear-gradient(160deg,#fffdf6,#f7ecd2);border:.32cqw solid #e0b84a;
  box-shadow:0 .8cqw 1.6cqw rgba(40,0,40,.45),0 0 1.4cqw rgba(255,214,80,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4cqw;
  animation:ss-carry-bob 2.4s ease-in-out infinite;position:relative;overflow:hidden}
.ss-carry .cc::after{content:'';position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.85) 50%,transparent 60%);animation:ss-carry-shine 2.6s ease-in-out infinite}
.ss-carry .cc img{width:62%}
.ss-carry .cc i{font:700 .78cqw/1 'SSAachen',sans-serif;font-style:normal;letter-spacing:.08em;color:#c2185b}
.ss-carry.fresh.m-out{animation:ss-carry-in 1.15s cubic-bezier(.2,.8,.25,1) both}
.ss-carry.fresh.m-pass{animation:ss-carry-pass 1.2s cubic-bezier(.45,0,.2,1) .25s both}
.ss-carry.fresh.m-pocket{animation:ss-carry-pocket 1.3s ease-in .3s both}
.ss-carry.m-hold .cc{animation:ss-carry-wave .9s ease-in-out infinite alternate}
@keyframes ss-carry-in{0%{translate:-34cqw -22cqw;rotate:-40deg;scale:.35;opacity:0}35%{opacity:1}70%{rotate:12deg;scale:1.15}100%{translate:0 0;rotate:-6deg;scale:1}}
@keyframes ss-carry-pass{0%{translate:var(--dx,0) var(--dy,0);rotate:-6deg}50%{translate:calc(var(--dx,0px) / 2) calc(var(--dy,0px) / 2 - 6cqw);rotate:180deg;scale:1.15}100%{translate:0 0;rotate:366deg;scale:1}}
@keyframes ss-carry-pocket{0%{opacity:1}40%{scale:1.08;rotate:-8deg}100%{translate:0 4cqw;scale:.2;rotate:20deg;opacity:0}}
@keyframes ss-carry-bob{0%,100%{translate:0 0}50%{translate:0 -.6cqw}}
@keyframes ss-carry-wave{from{rotate:-10deg;translate:0 -.4cqw}to{rotate:10deg;translate:0 -1.6cqw}}
@keyframes ss-carry-shine{0%,55%{translate:-60% 0}100%{translate:60% 0}}
.ss-lights{position:absolute;inset:0;z-index:23;pointer-events:none;overflow:hidden}
.ss-lights i{position:absolute;top:-6%;width:9%;height:118%;transform-origin:50% 0;clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);filter:blur(.5cqw);
  background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(255,255,255,.55) 40%,rgba(255,255,255,0) 95%);opacity:.75;animation:ss-beam 1.4s ease-in-out infinite alternate}
.ss-lights i:nth-child(1){left:4%;animation-delay:-.3s}.ss-lights i:nth-child(2){left:20%;animation-delay:-1s;background:linear-gradient(180deg,#ff3ea5,rgba(255,62,165,.5) 40%,transparent 95%)}
.ss-lights i:nth-child(3){left:37%;animation-delay:-.6s}.ss-lights i:nth-child(4){left:54%;animation-delay:-1.3s;background:linear-gradient(180deg,#19d3c5,rgba(25,211,197,.5) 40%,transparent 95%)}
.ss-lights i:nth-child(5){left:71%;animation-delay:-.1s}.ss-lights i:nth-child(6){left:87%;animation-delay:-.9s;background:linear-gradient(180deg,#ffd43b,rgba(255,212,59,.5) 40%,transparent 95%)}
.ss-lights.boo i{background:linear-gradient(180deg,#ff3355,rgba(255,51,85,.45) 40%,transparent 95%)}
.ss-lights b{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 70%,rgba(255,255,255,.55),transparent 60%);animation:ss-strobe .5s steps(2) 6}
.ss-lights.boo b{background:radial-gradient(ellipse at 50% 70%,rgba(255,40,60,.35),transparent 60%)}
@keyframes ss-beam{from{rotate:-28deg}to{rotate:28deg}}
@keyframes ss-strobe{0%{opacity:1}100%{opacity:0}}
.ss-party{position:absolute;inset:0;z-index:22;pointer-events:none;overflow:hidden;mix-blend-mode:screen}
.ss-party i{position:absolute;top:-30%;width:40%;height:160%;transform-origin:50% 0;filter:blur(2.4cqw);opacity:.55;animation:ss-sweep 3.4s ease-in-out infinite alternate}
.ss-party i:nth-child(1){left:5%;background:linear-gradient(180deg,rgba(255,62,165,.9),transparent 70%)}
.ss-party i:nth-child(2){left:30%;background:linear-gradient(180deg,rgba(25,211,197,.85),transparent 70%);animation-duration:2.6s;animation-delay:-1s}
.ss-party i:nth-child(3){left:55%;background:linear-gradient(180deg,rgba(124,92,255,.9),transparent 70%);animation-duration:3s;animation-delay:-2s}
.ss-party b{position:absolute;left:50%;top:-2cqw;width:7cqw;aspect-ratio:1;translate:-50% 0;border-radius:50%;
  background:repeating-conic-gradient(#fff 0 10deg,#b9b4d6 10deg 20deg);box-shadow:0 0 3cqw #fff,0 0 8cqw rgba(255,255,255,.6);animation:sst-spin 4s linear infinite}
@keyframes ss-sweep{from{rotate:-28deg}to{rotate:28deg}}
.bbx .stage.ss:has(.ss-party) .gt:not(.bgp) .tile{animation:ss-dance .52s ease-in-out infinite alternate;animation-delay:var(--ph,0s)}
.bbx .stage.ss:has(.ss-party) .gt:nth-child(2n) .tile{animation-duration:.46s}
.bbx .stage.ss:has(.ss-party) .gt:nth-child(3n) .tile{animation-duration:.6s}
@keyframes ss-dance{0%{transform:translateY(0) rotate(-4deg)}100%{transform:translateY(-1.4cqw) rotate(4deg)}}
.ss-red{position:absolute;inset:0;z-index:57;pointer-events:none;overflow:hidden;background:rgba(255,0,40,.18);mix-blend-mode:multiply;animation:ss-red .7s ease-in-out infinite alternate}
.ss-red::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(200,0,30,.75) 100%);mix-blend-mode:normal}
.ss-red-beam{position:absolute;left:50%;top:-40%;width:160%;aspect-ratio:1;translate:-50% 0;background:conic-gradient(from 0deg,rgba(255,40,60,.55) 0 22deg,transparent 22deg 180deg,rgba(255,40,60,.55) 180deg 202deg,transparent 202deg);animation:sst-spin 1.4s linear infinite;mix-blend-mode:screen}
.ss-red b{position:absolute;left:50%;top:16%;translate:-50% 0;font:8cqw 'SSAachen',sans-serif;color:#fff;letter-spacing:.12em;-webkit-text-stroke:.25cqw #b0001e;text-shadow:0 0 3cqw #ff1a3c;mix-blend-mode:normal;animation:ss-red-t .35s steps(2) infinite}
.ss-red:not(.fresh) b{display:none}
@keyframes ss-red{from{background:rgba(255,0,40,.14)}to{background:rgba(255,0,40,.42)}}
@keyframes ss-red-t{50%{opacity:.35}}
@keyframes sst-spin{to{rotate:360deg}}
/* the secret card */
/* (the card turns by squashing and growing again: a 3D back face does not hide reliably inside the stage) */
.ssc{position:absolute;z-index:27;left:50%;top:13cqw;width:34cqw;height:19cqw;transform:translateX(-50%)}
.ssc-in{position:relative;width:100%;height:100%}
.ssc.shown .ssc-front{display:none}
.ssc.fresh .ssc-in{animation:ss-cardin .45s cubic-bezier(.2,1.3,.4,1) both}
.ssc.fresh .ssc-front{animation:ss-turnout .28s .75s ease-in forwards}
.ssc.fresh .ssc-back{transform:scaleX(0);animation:ss-turnin .32s 1.03s cubic-bezier(.2,1.4,.4,1) forwards}
.ssc-f{position:absolute;inset:0;border-radius:1.8cqw;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.6cqw;text-align:center;
  box-shadow:0 0 0 .35cqw var(--ssg),0 2cqw 4cqw rgba(0,0,0,.5)}
.ssc-front{background:linear-gradient(135deg,var(--ssm),var(--ssp))}
.bbx .stage .ssc-front img{width:10cqw}.ssc-front b{font:700 2.4cqw 'SSAachen',sans-serif;color:#fff;letter-spacing:.3em}
.ssc-back{background:linear-gradient(180deg,#fff,var(--ssc))}
.ssc-back i{font:800 1.1cqw 'SSNunito',sans-serif;letter-spacing:.2em;color:var(--ssm);font-style:normal;text-transform:uppercase}
.ssc-back b{font:700 2.3cqw/1.25 'SSAachen',sans-serif;color:var(--ssi);margin-top:.6cqw}
.ssc-back em{position:absolute;right:1.4cqw;bottom:1.2cqw;font:700 2cqw 'SSAachen',sans-serif;font-style:normal;letter-spacing:.12em;padding:.3cqw 1cqw;border:.3cqw solid;border-radius:.6cqw;transform:rotate(-12deg)}
.ssc.evidence .ssc-back em,.ssc.clue .ssc-back em{color:#3bb3ff}.ssc.found .ssc-back em{color:#e11d48}.ssc.wrong .ssc-back em{color:#6b7280}.ssc.kept .ssc-back em{color:#0d9488}
.ssc.fresh .ssc-back em{animation:ss-stamp .4s 1.5s cubic-bezier(.2,1.6,.4,1) both}
/* the toast is a ribbon above the action (centred, it sat under the props) */
.bbx .stage.ss .toast{top:21cqw;height:6.4cqw;transform:translateY(-50%) rotate(-2deg);left:-2cqw;right:-2cqw;box-shadow:0 .6cqw 1.6cqw rgba(0,0,0,.35)}
.bbx .stage.ss .toast b{font:700 4cqw 'SSAachen',sans-serif!important;letter-spacing:.3cqw}
/* Big Brother's chips, in Secret Story's words */
.bbx .stage.ss .chipx.hoh,.bbx .stage.ss .chipx.veto,.bbx .stage.ss .chipx.spent{display:none}
.bbx .stage.ss .chipx.out{font-size:0}.bbx .stage.ss .chipx.out::after{content:'Eliminated';font-size:.9cqw}
/* CALL IT */
.ssa{position:absolute;z-index:32;left:50%;top:6.2cqw;transform:translateX(-50%);max-width:70cqw;background:linear-gradient(135deg,rgba(43,13,63,.95),rgba(110,14,96,.93));
  border:.22cqw solid var(--ssg);border-radius:1.6cqw;padding:1cqw 1.4cqw 1.2cqw;box-shadow:0 1.4cqw 3.4cqw rgba(0,0,0,.45);cursor:default;animation:ss-askin .5s cubic-bezier(.2,1.3,.4,1)}
.ssa-h{text-align:center}
.ssa-h i{display:block;font:800 .9cqw 'SSNunito',sans-serif;letter-spacing:.32em;color:var(--ssg);font-style:normal}
.ssa-h b{display:block;font:700 1.9cqw 'SSAachen',sans-serif;color:#fff;margin:.2cqw 0}
.ssa-h span{display:block;font:700 .95cqw 'SSNunito',sans-serif;color:rgba(255,255,255,.75)}
.ssa-os{display:flex;flex-wrap:wrap;justify-content:center;gap:.7cqw;margin-top:.8cqw}
.ssa-o{display:flex;align-items:center;gap:.5cqw;border:0;cursor:pointer;background:#fff;color:var(--ssi);border-radius:3cqw;padding:.35cqw 1.1cqw .35cqw .35cqw;
  font:700 1.2cqw 'SSAachen',sans-serif;box-shadow:0 .3cqw 0 var(--ssm);transition:transform .15s}
.ssa-o:not([disabled]):hover{transform:translateY(-.2cqw) scale(1.05);background:var(--sst)}
.ssa-o.on{background:var(--ssg);transform:scale(1.08);box-shadow:0 0 1.4cqw var(--ssg)}
.ssa-o[disabled]:not(.on){opacity:.4;cursor:default}
.ssa-f{width:2.6cqw;height:2.6cqw;border-radius:50%;overflow:hidden;background:var(--c);flex:none}
.ssa-f img{width:100%;height:100%;object-fit:cover}
.ssa.settled{display:none}
.sss{position:absolute;z-index:34;left:50%;top:40%;transform:translate(-50%,-50%);text-align:center;padding:1.6cqw 3cqw;border-radius:2cqw;pointer-events:none;
  animation:ss-win 2.6s cubic-bezier(.2,1.3,.4,1) forwards}
.sss.win{background:linear-gradient(135deg,var(--ssg),#ffde7a);box-shadow:0 0 5cqw rgba(245,197,66,.8)}
.sss.lose{background:linear-gradient(135deg,#4b5563,#1f2937);animation-name:ss-lose}
.sss i{display:block;font:800 1.2cqw 'SSNunito',sans-serif;letter-spacing:.3em;font-style:normal;color:var(--ssi)}
.sss.lose i,.sss.lose span{color:#fff}
.sss b{display:block;font:700 5cqw/1 'SSAachen',sans-serif;color:var(--ssi)}.sss.lose b{color:#fda4af}
.sss span{font:700 1.1cqw 'SSNunito',sans-serif;color:var(--ssi)}
.sss-coins img{position:absolute;left:50%;top:50%;width:3cqw;animation:ss-coin 1.1s var(--d) cubic-bezier(.1,.8,.3,1) forwards;transform:translate(-50%,-50%)}
/* the Eye opens on a new screen */
@property --ssr{syntax:'<percentage>';inherits:false;initial-value:0%}
.ss-sw{position:absolute;inset:0;z-index:70;pointer-events:none;overflow:hidden;
  background:radial-gradient(ellipse at 50% 50%,#ff8fd0 0%,#ff3ea5 30%,#c8137a 60%,#2b0d3f 100%);
  -webkit-mask:radial-gradient(circle at 50% 50%,transparent var(--ssr),#000 calc(var(--ssr) + .6%));mask:radial-gradient(circle at 50% 50%,transparent var(--ssr),#000 calc(var(--ssr) + .6%));
  animation:ss-sw-open 1.2s cubic-bezier(.7,0,.25,1) forwards}
.ss-sw::before{content:"";position:absolute;inset:-30%;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.16) 0 5deg,transparent 5deg 14deg);animation:ss-rays 6s linear infinite}
.ss-sw-eye{position:absolute;left:50%;top:50%;width:30cqw;translate:-50% -50%;filter:drop-shadow(0 1cqw 2.4cqw rgba(40,0,40,.5));animation:ss-sw-eye 1.2s cubic-bezier(.6,0,.3,1) forwards}
@keyframes ss-sw-open{0%,40%{--ssr:0%}100%{--ssr:125%}}
@keyframes ss-sw-eye{0%{transform:scale(.6,.04);opacity:0}12%{opacity:1;transform:scale(1,.06)}26%{transform:scale(1,1.08)}34%{transform:scale(1,1)}42%{transform:scale(1.05)}100%{transform:scale(10);opacity:.2}}
@keyframes ss-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}
@keyframes ss-pulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}
@keyframes ss-slidein{from{transform:translateX(-2cqw);opacity:0}}
@keyframes ss-boxin{from{transform:translateY(2cqw) scale(.97);opacity:0}}
@keyframes ss-fade{from{opacity:0;transform:translateY(.8cqw)}}
@keyframes ss-voicein{from{opacity:0;transform:scale(.92);filter:blur(.6cqw)}}
@keyframes ss-ripple{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.5);opacity:0}}
@keyframes ss-bob{50%{transform:translateY(.35cqw)}}
@keyframes ss-float{50%{transform:translateY(-1cqw) rotate(-2deg)}}
@keyframes ss-propin{from{transform:translateX(-50%) translateY(6cqw) scale(calc(var(--sc,1) * .5));opacity:0}}
@keyframes ss-throb{50%{transform:scale(1.06);filter:drop-shadow(0 0 2cqw #ff2e4d)}}
@keyframes ss-press{to{transform:scaleY(.86) translateY(1cqw);filter:drop-shadow(0 0 4cqw #ff2e4d) brightness(1.3)}}
@keyframes ss-ring{0%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}100%{transform:rotate(-6deg)}}
@keyframes ss-lift{to{transform:translateY(-6cqw) rotate(-18deg);opacity:0}}
@keyframes ss-open{to{transform:scale(1.25);opacity:0;filter:brightness(2)}}
@keyframes ss-strobe{50%{opacity:0}}
@keyframes ss-cardin{from{transform:scale(.5) rotate(-6deg);opacity:0}}
@keyframes ss-turnout{to{transform:scaleX(0)}}
@keyframes ss-turnin{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes ss-stamp{from{transform:rotate(-12deg) scale(3);opacity:0}}
@keyframes ss-askin{from{transform:translateX(-50%) translateY(-2cqw);opacity:0}}
@keyframes ss-win{0%{transform:translate(-50%,-50%) scale(.3);opacity:0}15%{transform:translate(-50%,-50%) scale(1.1);opacity:1}25%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-60%)}}
@keyframes ss-lose{0%{transform:translate(-50%,-50%) scale(.6);opacity:0}15%{opacity:1;transform:translate(-50%,-50%) rotate(-3deg)}20%{transform:translate(-50%,-50%) rotate(3deg)}25%{transform:translate(-50%,-50%)}80%{opacity:1}100%{opacity:0}}
@keyframes ss-coin{to{transform:translate(calc(-50% + cos(var(--a)) * 22cqw),calc(-50% + sin(var(--a)) * 14cqw)) rotate(360deg);opacity:0}}
/* the dossier */
.bbx .ssds{padding:7px 0;border-top:1px solid rgba(255,255,255,.08)}
.bbx .ssds-w{display:flex;align-items:center;gap:4px}.bbx .ssds-w b{font:700 12.5px 'SSAachen',sans-serif;margin-left:4px}
.bbx .ssds q{display:block;font:italic 600 12.5px/1.35 'SSNunito',sans-serif;color:#f6d6ea;margin:4px 0 2px}
.bbx .ssds span{font:800 10px 'SSNunito',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#19d3c5}
.bbx .ssds.found span{color:#ff5c8a}.bbx .ssds.told span{color:#9ca3af}.bbx .ssds.found q,.bbx .ssds.told q{opacity:.6;text-decoration:line-through}
/* the kitties: columns of coins, the amount rolling (an animated integer, counter()) */
@property --ssn{syntax:'<integer>';inherits:false;initial-value:0}
.ssk{position:absolute;z-index:23;left:6cqw;right:6cqw;top:9cqw;bottom:16cqw;display:flex;flex-direction:column;align-items:center;
  background:linear-gradient(180deg,rgba(43,13,63,.88),rgba(90,10,80,.82));border-radius:2cqw;box-shadow:0 0 0 .25cqw var(--ssg),0 2cqw 4cqw rgba(0,0,0,.45);padding:1.2cqw 2cqw}
.ssk.fresh{animation:ss-boxin .5s cubic-bezier(.2,1.3,.4,1)}
.ssk-h{font:700 2.2cqw 'SSAachen',sans-serif;color:var(--ssg);letter-spacing:.2em}
.ssk-r{flex:1;width:100%;display:flex;align-items:flex-end;justify-content:space-around;gap:1cqw;margin-top:.6cqw}
.ssk-c{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;color:#fff}
.ssk-stack{position:relative;width:62%;flex:1;display:flex;align-items:flex-end}
.ssk-stack i{display:block;width:100%;height:var(--h);border-radius:.6cqw .6cqw .2cqw .2cqw;
  background:repeating-linear-gradient(0deg,#b8860b 0 .25cqw,#f5c542 .25cqw 1.1cqw);box-shadow:0 0 1.4cqw rgba(245,197,66,.55)}
.ssk.fresh .ssk-stack i{animation:ss-grow 1.4s calc(var(--i) * .08s) cubic-bezier(.2,1,.3,1) both}
.ssk-n{font:700 1.5cqw 'SSAachen',sans-serif;margin-top:.4cqw;--ssn:var(--to);counter-reset:k var(--ssn)}
/* the semi-final's validation: a stamp slams onto each kitty in turn */
.ssk-c{position:relative}
.ssk-v{position:absolute;left:50%;top:38%;translate:-50% 0;rotate:-14deg;font:700 1.15cqw 'SSAachen',sans-serif;font-style:normal;letter-spacing:.12em;color:#f5c542;
  border:.25cqw solid #f5c542;border-radius:.5cqw;padding:.2cqw .7cqw;background:rgba(43,13,63,.75);box-shadow:0 .3cqw 1cqw rgba(0,0,0,.45);
  animation:ssk-stamp .45s calc(1.5s + var(--i) * .35s) cubic-bezier(.2,1.6,.4,1) both}
@keyframes ssk-stamp{0%{opacity:0;scale:2.6}100%{opacity:1;scale:1}}
/* (a counter cannot print a thousands separator: it rolls, then the amount as the show writes it takes over) */
.ssk-n{display:inline-grid}.ssk-n::before,.ssk-n::after{grid-area:1/1;justify-self:center}
.ssk-n::before{content:'$' counter(k);opacity:0}.ssk-n::after{content:attr(data-v)}
.ssk.fresh .ssk-n{animation:ss-count 1.8s calc(var(--i) * .08s) cubic-bezier(.2,.9,.3,1) both}
.ssk.fresh .ssk-n::before{animation:ss-swapout 1.8s calc(var(--i) * .08s) step-end both}
.ssk.fresh .ssk-n::after{animation:ss-swapin 1.8s calc(var(--i) * .08s) step-end both}
@keyframes ss-swapout{from{opacity:1}to{opacity:0}}@keyframes ss-swapin{from{opacity:0}to{opacity:1}}
.ssk-c em{font:800 .95cqw 'SSNunito',sans-serif;font-style:normal}.ssk-c em.up{color:#4ade80}.ssk-c em.down{color:#fb7185}
.ssk-f{width:3.4cqw;height:3.4cqw;border-radius:50%;overflow:hidden;background:var(--c);margin-top:.4cqw;box-shadow:0 0 0 .18cqw #fff}
.ssk-f img{width:100%;height:100%;object-fit:cover}
.ssk-c b{font:700 1cqw 'SSAachen',sans-serif;margin-top:.2cqw;white-space:nowrap}
@keyframes ss-grow{from{height:0}}
@keyframes ss-count{from{--ssn:var(--from)}to{--ssn:var(--to)}}
/* coins changing hands */
.ssf{position:absolute;inset:0;z-index:24;pointer-events:none}
.bbx .stage .ssf img{position:absolute;bottom:22cqw;left:var(--a);width:2.6cqw;opacity:0;animation:ss-fly 1.1s var(--d) cubic-bezier(.4,0,.2,1) forwards}
@keyframes ss-fly{0%{left:var(--a);transform:translateY(0) scale(.6);opacity:0}15%{opacity:1}50%{transform:translateY(calc(-8cqw - var(--y))) scale(1.1)}100%{left:var(--b);transform:translateY(0) scale(.7);opacity:0}}
/* the Oops signs */
.sso{position:absolute;z-index:23;bottom:31cqw;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center}
.sso b{font:700 2.2cqw 'SSAachen',sans-serif;color:#fff;background:#e11d48;padding:.5cqw 1.4cqw;border-radius:.6cqw;border:.25cqw solid #fff;box-shadow:0 .5cqw 1cqw rgba(0,0,0,.4)}
.sso i{width:.4cqw;height:3cqw;background:#f5deb3;border-radius:.2cqw}
.sso.fresh{animation:ss-signup .55s calc(var(--i) * .12s) cubic-bezier(.2,1.6,.4,1) both}
@keyframes ss-signup{from{transform:translateX(-50%) translateY(6cqw) rotate(-12deg);opacity:0}}
/* (under the dialogue box: the host reads it, the line stays on top) */
.ssha{position:absolute;bottom:19.4cqw;width:2.2cqw;height:2.2cqw;margin-left:-1.1cqw;z-index:12;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff,#ffc2df 60%,#ff3ea5);box-shadow:0 0 0 .2cqw #fff,0 0 1.2cqw rgba(255,62,165,.8);animation:ss-fade .6s calc(var(--i) * .12s) both}
.ssmg{position:absolute;inset:0;z-index:26;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4cqw;overflow:hidden;
  background:radial-gradient(ellipse at 50% 45%,#ff3ea5 0%,#c8137a 30%,#5b0d4f 62%,#1a0626 100%)}
.ssmg-rays{position:absolute;inset:-30%;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.1) 0 6deg,transparent 6deg 15deg);animation:sst-spin 30s linear infinite}
.ssmg-eye{position:absolute;width:44cqw;opacity:.12;filter:blur(.2cqw)}
.ssmg-tag{position:relative;font:800 1.2cqw 'SSNunito',sans-serif;letter-spacing:.4em;color:#fff;background:rgba(0,0,0,.35);padding:.5cqw 1.4cqw;border-radius:2cqw;box-shadow:0 0 0 .15cqw rgba(255,255,255,.5)}
.ssmg-t{position:relative;max-width:84%;text-align:center;font:700 6.4cqw/1 'SSAachen',sans-serif;color:#fff;text-transform:uppercase;letter-spacing:.02em;
  text-shadow:.4cqw .4cqw 0 #c8137a,-.15cqw -.15cqw 0 #19d3c5,0 0 3cqw rgba(255,255,255,.55)}
.ssmg-s{position:relative;font:800 1.7cqw 'SSNunito',sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#ffe14d}
.ssmg.fresh .ssmg-t{animation:ssmg-in .9s cubic-bezier(.2,1.3,.4,1) both}
.ssmg-ps{position:relative;display:flex;align-items:center;gap:2cqw;margin-bottom:.4cqw}
.ssmg-p{position:relative;width:15cqw;aspect-ratio:4/5;border-radius:1.6cqw;overflow:hidden;background:var(--c);box-shadow:0 0 0 .5cqw #fff,0 1.6cqw 3cqw rgba(60,0,60,.45);rotate:calc(var(--d) * 6deg);animation:ssmg-bob 3s ease-in-out infinite;animation-delay:calc(var(--i) * -1.1s)}
.ssmg-ps.n4 .ssmg-p{width:12cqw}
.ssmg-p img{width:100%;height:100%;object-fit:cover;object-position:50% 14%;display:block}
.ssmg-p em{position:absolute;left:0;right:0;bottom:0;padding:.4cqw 0 .3cqw;text-align:center;font:1.4cqw 'SSAachen',sans-serif;font-style:normal;color:#fff;letter-spacing:.06em;text-transform:uppercase;background:linear-gradient(0deg,rgba(43,13,63,.9),transparent)}
.ssmg-sym{font:5cqw 'SSAachen',sans-serif;font-style:normal;color:#fff;-webkit-text-stroke:.2cqw #c8137a;text-shadow:0 0 2cqw #ff3ea5}
.ssmg.fresh .ssmg-p{animation:ssmg-slide .8s cubic-bezier(.2,1.3,.4,1) both,ssmg-bob 3s .8s ease-in-out infinite;animation-delay:calc(var(--i) * .12s),calc(.8s + var(--i) * -1.1s)}
.ssmg.fresh .ssmg-sym{animation:ssmg-in .6s .5s cubic-bezier(.2,1.6,.4,1) both}
@keyframes ssmg-slide{from{translate:calc(var(--d) * 60cqw) 0;opacity:0}}
@keyframes ssmg-bob{50%{translate:0 -.8cqw}}
.ssmg.fresh .ssmg-s,.ssmg.fresh .ssmg-tag{animation:ss-fade .6s .5s both}
.ssmg.fresh{animation:ssmg-flash .5s ease-out}
@keyframes ssmg-in{0%{opacity:0;transform:scale(2.4);filter:blur(1cqw)}60%{opacity:1;filter:blur(0)}100%{transform:scale(1)}}
@keyframes ssmg-flash{0%{filter:brightness(3)}100%{filter:brightness(1)}}
@keyframes sst-spin{to{rotate:360deg}}
.ssbk{position:absolute;inset:0;z-index:45;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:radial-gradient(ellipse at 50% 45%,#ff5fb7 0%,#c8137a 35%,#4a0a52 75%,#1a0626 100%)}
.ssbk-rays{position:absolute;inset:-30%;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.14) 0 6deg,transparent 6deg 15deg);animation:ss-rays 12s linear infinite}
.ssbk-ring{position:absolute;left:50%;top:36%;width:27cqw;aspect-ratio:1;translate:-50% -50%;border-radius:50%;border:.5cqw solid rgba(255,255,255,.85);box-shadow:0 0 3cqw #fff,inset 0 0 3cqw #ff9fd8}
.ssbk-eye{position:relative;width:24cqw;margin-top:-6cqw;filter:drop-shadow(0 1.2cqw 2.4cqw rgba(40,0,40,.5));animation:ss-blink 3s 2.2s infinite;transform-origin:50% 55%}
.ssbk-t{position:relative;margin-top:1.6cqw;font-size:5cqw}
.ssbk-n{position:relative;display:flex;flex-direction:column;align-items:center;gap:.5cqw;margin-top:1.2cqw}
.ssbk-n i{font:800 1.2cqw 'SSNunito',sans-serif;font-style:normal;letter-spacing:.35em;color:#fff;opacity:.9}
.ssbk-n b{font:2.2cqw 'SSAachen',sans-serif;color:#fff;letter-spacing:.06em;background:rgba(43,13,63,.55);padding:.3cqw 1.4cqw;border-radius:2cqw}
.ssbk.fresh .ssbk-rays{animation:ss-rays 12s linear infinite,ssbk-in .5s ease both}
.ssbk.fresh .ssbk-ring{animation:ssbk-ring 1.1s cubic-bezier(.2,1.4,.4,1) both}
.ssbk.fresh .ssbk-eye{animation:ssbk-eye 1.3s cubic-bezier(.2,1.3,.3,1) both,ss-blink 3s 2.2s infinite}
.ssbk.fresh .ssbk-t{animation:ss-boxin .6s .9s cubic-bezier(.2,1.4,.4,1) both}
.ssbk.fresh .ssbk-n{animation:ss-fade .5s 1.4s both}
@keyframes ssbk-in{from{opacity:0}}
@keyframes ssbk-ring{0%{transform:scale(.1);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes ssbk-eye{0%{transform:scale(.05) rotate(-200deg);opacity:0}55%{transform:scale(1.18) rotate(8deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.ssls,.ssvc{position:absolute;inset:0;z-index:24;overflow:hidden;display:flex;flex-direction:column;align-items:center}
.ssls-sky,.ssvc-sky{position:absolute;inset:0;background:
  radial-gradient(ellipse 38% 22% at 12% 92%,#fff 0 40%,transparent 70%),radial-gradient(ellipse 34% 20% at 88% 96%,#ffe9f6 0 40%,transparent 70%),
  radial-gradient(ellipse 30% 16% at 50% 104%,#fff 0 50%,transparent 75%),radial-gradient(ellipse 40% 24% at 8% 6%,rgba(255,255,255,.75) 0 30%,transparent 70%),
  radial-gradient(ellipse 36% 20% at 92% 10%,rgba(255,230,250,.8) 0 30%,transparent 70%),
  linear-gradient(180deg,#7c5cff 0%,#ff5fb7 38%,#ff8fc7 62%,#ffd0e6 100%)}
.ssls-sky::after,.ssvc-sky::after{content:"";position:absolute;inset:-20%;background:repeating-conic-gradient(from 0deg at 50% 0%,rgba(255,255,255,.12) 0 4deg,transparent 4deg 12deg);animation:ss-rays 30s linear infinite}
@keyframes ss-rays{to{transform:rotate(8deg)}}
.ssls.fresh,.ssvc.fresh{animation:ss-fade .5s ease}
.ssls-h{position:relative;margin-top:5.6cqw;display:flex;flex-direction:column;align-items:center;font:700 4.2cqw/0.95 'SSAachen',sans-serif;letter-spacing:.02em}
.ssls-h span{background:linear-gradient(90deg,#19d3c5,#3bb3ff 30%,#7c5cff 55%,#ff3ea5 80%,#ff7a59);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(.25cqw .25cqw 0 #fff) drop-shadow(-.12cqw -.12cqw 0 #fff) drop-shadow(0 .6cqw 1cqw rgba(124,92,255,.5))}
.ssls.fresh .ssls-h{animation:ss-boxin .6s cubic-bezier(.2,1.4,.4,1) both}
.ssls-r{position:relative;margin-top:1.2cqw;width:56cqw;display:flex;flex-direction:column;gap:.9cqw}
.ssls-row{position:relative;display:flex;align-items:center;min-height:3.8cqw}
.ssls-p{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;min-height:3.8cqw;padding:.4cqw 2.4cqw;border-radius:3cqw;
  font:800 1.45cqw/1.15 'SSNunito',sans-serif;text-transform:uppercase;color:#fff;box-shadow:0 0 0 .25cqw rgba(255,255,255,.9),0 .8cqw 1.6cqw rgba(124,92,255,.35)}
.ssls-row.g0 .ssls-p{background:linear-gradient(90deg,#fff,#ffe3f3);color:#c8137a}
.ssls-row.g1 .ssls-p{background:linear-gradient(90deg,#3bb3ff,#7c5cff 50%,#ff3ea5)}
.ssls-row.g2 .ssls-p{background:linear-gradient(90deg,#7c5cff,#ff3ea5 55%,#ff7a59)}
.ssls-row.g3 .ssls-p{background:linear-gradient(90deg,#ff3ea5,#ff7a59 60%,#f5c542)}
.ssls.fresh .ssls-row{animation:ss-pill .5s calc(.25s + var(--i) * .12s) cubic-bezier(.2,1.4,.4,1) both}
.ssls-row.new .ssls-p{animation:ss-glow 1.6s ease-in-out infinite}
@keyframes ss-pill{from{opacity:0;transform:translateX(-6cqw) scale(.9)}}
@keyframes ss-glow{50%{box-shadow:0 0 0 .25cqw #fff,0 0 2.4cqw #fff}}
.ssls-who{position:absolute;left:-1.6cqw;top:50%;translate:-100% -50%;display:flex;align-items:center;gap:.5cqw;z-index:2}
.ssls-f{width:3.8cqw;height:3.8cqw;border-radius:50%;overflow:hidden;background:var(--c);box-shadow:0 0 0 .3cqw #fff,0 1cqw 2cqw rgba(0,0,0,.25)}
.ssls-f img{width:100%;height:100%;object-fit:cover;object-position:50% 15%}
.ssls-f+.ssls-f{margin-left:-1.5cqw}
/* the whole list, every time (the user, 2026-10-29): past six rows, two columns, the faces inside the row */
.ssls:has(.ssls-r.many) .ssls-h{margin-top:3.6cqw;font-size:2.8cqw}
.ssls-r.many{display:grid;grid-template-columns:1fr 1fr;gap:.6cqw 1.6cqw;width:88cqw;margin-top:.8cqw}
.ssls-r.many .ssls-row,.ssls-r.many .ssls-p{min-height:2.7cqw}
.ssls-r.many .ssls-p{font-size:1cqw;padding:.25cqw 1.4cqw}
.ssls-r.many .ssls-who{position:static;translate:none;margin-right:.5cqw;gap:.3cqw}
.ssls-r.many .ssls-who em{display:none}
.ssls-r.many .ssls-f{width:2.7cqw;height:2.7cqw;box-shadow:0 0 0 .2cqw #fff}
.ssls-r.many .ssls-f+.ssls-f{margin-left:-1cqw}
.ssls-who em{order:-1;font:700 1.2cqw 'SSAachen',sans-serif;font-style:normal;color:#fff;background:linear-gradient(90deg,#ff3ea5,#7c5cff);padding:.15cqw .8cqw;border-radius:2cqw;box-shadow:0 0 0 .18cqw #fff}
.ssls-eye{position:absolute;right:2.4cqw;bottom:1.6cqw;width:7cqw;filter:drop-shadow(0 .6cqw 1cqw rgba(0,0,0,.25))}
.ssls.carded .ssls-r{filter:blur(.25cqw);opacity:.35}
.ssls-card{position:absolute;z-index:3;left:50%;top:53%;translate:-50% -50%;width:46cqw;min-height:22cqw;padding:3cqw 3.4cqw 3.4cqw;border-radius:2.4cqw;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4cqw;text-align:center;
  background:linear-gradient(160deg,#fff 0%,#ffe6f4 60%,#f3dcff 100%);box-shadow:0 0 0 .45cqw #fff,0 0 0 .8cqw #ff3ea5,0 2cqw 5cqw rgba(60,0,60,.45)}
.ssls-card i{font:1.5cqw 'SSAachen',sans-serif;font-style:normal;letter-spacing:.3em;color:#fff;background:linear-gradient(90deg,#7c5cff,#ff3ea5);padding:.4cqw 1.6cqw;border-radius:2cqw}
.ssls-card b{font:800 2.9cqw/1.2 'SSNunito',sans-serif;text-transform:uppercase;color:#c8137a}
.ssls-card em{font:1.1cqw 'SSAachen',sans-serif;font-style:normal;letter-spacing:.25em;color:#7c5cff}
.ssls-card img{position:absolute;right:-2.2cqw;top:-2.6cqw;width:7cqw;rotate:12deg;filter:drop-shadow(0 .6cqw 1cqw rgba(0,0,0,.3))}
.ssls-card.fresh{animation:ss-cardin .8s cubic-bezier(.2,1.3,.4,1) both}
.ssls-card.fresh b{animation:ss-fade .5s .45s both}
@keyframes ss-cardin{0%{opacity:0;transform:perspective(60cqw) rotateY(-100deg) scale(.6)}60%{opacity:1}100%{transform:perspective(60cqw) rotateY(0) scale(1)}}
.ssvc-r{position:relative;margin-top:8cqw;display:flex;gap:1.6cqw;justify-content:center;align-items:flex-end;width:92%}
.ssvc-c{position:relative;flex:0 1 11cqw;margin-left:3.4cqw;display:flex;flex-direction:column;align-items:center}
.ssvc-n{position:absolute;top:-3.4cqw;left:-4.6cqw;font:700 11cqw/1 'SSAachen',sans-serif;color:#ff8fd0;-webkit-text-stroke:.3cqw #fff;text-shadow:0 .6cqw 1.4cqw rgba(124,92,255,.55);z-index:0}
.ssvc-f{position:relative;z-index:1;width:100%;aspect-ratio:3/4;border-radius:1.4cqw 1.4cqw .6cqw .6cqw;overflow:hidden;background:linear-gradient(180deg,var(--c),#fff0);box-shadow:0 1.2cqw 2.4cqw rgba(124,92,255,.35)}
.ssvc-f img{width:100%;height:100%;object-fit:cover;object-position:50% 12%}
.ssvc-c em{position:relative;z-index:2;margin-top:-1.4cqw;font:700 1.9cqw 'SSAachen',sans-serif;font-style:normal;text-transform:uppercase;color:#fff;
  background:linear-gradient(90deg,#3bb3ff,#7c5cff,#ff3ea5);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(.18cqw .18cqw 0 #fff) drop-shadow(-.1cqw -.1cqw 0 #fff)}
.ssvc.fresh .ssvc-c{animation:ss-pill .55s calc(.2s + var(--i) * .1s) cubic-bezier(.2,1.4,.4,1) both}
.ssvc-how{position:relative;margin-top:1.8cqw;width:72%;display:flex;flex-direction:column;align-items:center;gap:.2cqw;padding:1cqw 2cqw;border-radius:1.4cqw;
  background:linear-gradient(90deg,rgba(124,92,255,.85),rgba(200,19,122,.85));box-shadow:0 0 0 .2cqw rgba(255,255,255,.7);font:800 1.6cqw/1.25 'SSNunito',sans-serif;color:#fff;text-align:center}
.ssvc-how b{color:#ffe14d}.ssvc-how small{font-size:1cqw;opacity:.85;letter-spacing:.1em;text-transform:uppercase}
@media (prefers-reduced-motion:reduce){.ss-sw,.sss-coins{display:none}.ssh-eye,.ssv-eye img,.ssrest-eye{animation:none}}
`;

// ── the dossier (the side panel) ────────────────────────────────────────
/**
 * Every secret the public was told at the launch, and what has become of it by the end of week
 * `upTo`: found by a buzz (by whom, which week), told on leaving, or still kept. Built from the
 * aired weeks only, so a replayed week never shows what happened after it.
 */
export function ssDossierOf(rows, upTo) {
  const aired = (rows || []).filter(r => (r?.num || 0) <= upTo);
  const launch = aired.flatMap(r => r.acts || []).find(a => a?.type === 'ss-secrets');
  if (!launch) return null;
  const out = (launch.secrets || []).map(s => ({ holders: [...(s.holders || [])], text: s.text, state: 'kept', by: null, week: null }));
  const gone = new Set();
  for (const r of aired) {
    for (const a of r.acts || []) {
      if (a?.type === 'ss-buzz' && a.outcome === 'right') {
        const s = out.find(x => x.state === 'kept' && x.holders.includes(a.target));
        if (s) Object.assign(s, { state: 'found', by: a.by, week: r.num });
      }
    }
    if (r.evicted) gone.add(r.evicted);
  }
  for (const s of out) if (s.state === 'kept' && s.holders.every(h => gone.has(h))) s.state = 'told';
  return out;
}

/** The side panel on a Secret Story week: the week, and the dossier of secrets. `mini(n)` is a small portrait. */
export function ssSideHtml(L, S, D, mini) {
  const row = (n, tag, cls) => `<div class="bbx-row">${mini(n)}<b>${esc(n)}</b><span class="bbx-tag ${cls}">${tag}</span></div>`;
  const week = `<div class="bbx-panel"><h4>Week ${esc(S.week)}</h4>
    ${L.hoh ? row(L.hoh, "Voice's game", 'hoh') : '<div class="bbx-pend">No game won yet this week.</div>'}
    ${L.nom.map(n => row(n, L.out.includes(n) ? 'Eliminated' : 'Nominated', L.out.includes(n) ? 'out' : 'nom')).join('')}</div>`;
  if (!D) return week;
  const kept = D.filter(s => s.state === 'kept').length;
  const items = D.map(s => `<div class="ssds ${s.state}"><div class="ssds-w">${s.holders.map(h => mini(h)).join('')}<b>${esc(s.holders.join(' & '))}</b></div>
    <q>${esc(s.text)}</q><span>${s.state === 'found' ? `Found by ${esc(s.by)} · week ${esc(s.week)}` : s.state === 'told' ? 'Told on leaving' : 'Kept'}</span></div>`).join('');
  return `${week}<div class="bbx-panel ssds-p"><h4>The secrets · only the public knows</h4><div class="bbx-pend" style="margin-bottom:6px">${kept} of ${D.length} still kept</div>${items}</div>`;
}
