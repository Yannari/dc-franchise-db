// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-hud.js — Secret Story on the stage: its own look, and a game to play
// ══════════════════════════════════════════════════════════════════════
//
// Part 4 (the user, 2026-10-28: "grandiose, like playing a visual novel and a video game at
// the same time... super animated and interactive"). On a Secret Story week the stepped
// viewer drops Big Brother's broadcast skin and wears the House of Secrets':
//
// - the HUD: the show's lettering (Fredoka, Nunito: assets/fonts), the Eye, the room
//   in English, and YOUR KITTY;
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
const roomOf = S => { const p = S.plate || ''; for (const [re, n] of ROOM_OF_PLATE) if (re.test(p)) return n; return S.room || ''; };

/** The top of the screen: the show's bug, the room, the day, the viewer's kitty. */
export function ssHudHtml(S, st, fresh, o) {
  const isDr = st && st.k === 'dr';
  const room = isDr ? 'Confessional' : roomOf(S);
  const b = bankOf(o?.ssKey);
  return `<div class="ssh">
    <div class="ssh-bug"><img class="ssh-eye" src="${EYE}" alt=""><div class="ssh-wm">SECRET STORY<span>WEEK ${esc(S.week)} · DAY ${esc(S.day)}</span></div>
      ${/LIVE/i.test(String(S.time || '')) ? '<span class="ssh-live">LIVE</span>' : `<span class="ssh-time">${esc(S.time || '')}</span>`}
      <span class="ssh-room ${fresh ? 'fresh' : ''}">${esc(String(room))}</span></div>
    <div class="ssh-bank" title="Your kitty: call what happens next to grow it"><img src="${PROPS}/kitty-stand.webp" alt=""><div><i>YOUR KITTY</i><b>${money(b.kitty)}</b></div></div>
  </div>`;
}

/** The title card before a screen's first line. */
export function ssRestHtml(S) {
  return `<div class="ssrest"><img class="ssrest-eye" src="${EYE}" alt=""><div class="k">${esc(S.kicker)}</div><div class="t">${esc(S.title)}</div><div class="s">${esc(S.sub)}</div><div class="go">▶ PLAY</div></div>`;
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
      <div class="ssv-body"><b>THE VOICE</b><div class="ssv-tx">${esc(st.t)}</div></div></div>`;
  }
  if (st.k === 'beat') return `<div class="ssn ${fresh ? 'fresh' : ''}"><span>${esc(st.t)}</span></div>`;
  const c = H.col(st.by);
  const tx = `<div class="tx" data-full="${esc(st.t)}" data-emph="${esc(H.emph(st.t, H.names))}">${fresh ? '' : H.emph(st.t, H.names)}</div>`;
  if (st.k === 'dr') {
    return `<div class="ssd ${fresh ? 'fresh' : ''}" style="--c:${c}"><div class="ssd-plate"><img src="${EYE}" alt=""><b>${esc(st.by)}</b><i>CONFESSIONAL</i></div>
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

/** Props, the secret card, the call and its payoff, for step `st` (`o` = the stage's options). */
export function ssPiecesHtml(S, st, idx, fresh, o, H) {
  if (!st) return '';
  let h = '';
  // a new screen opens through the Eye
  if (fresh && idx === 0) h += '<div class="ss-iris"></div>';
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
    if (fresh && !st.press && P.snd) setTimeout(() => sfx(P.snd), 60);
  }
  if (st.card) {
    const C = st.card;
    h += `<div class="ssc ${fresh ? 'fresh' : 'shown'} ${esc(C.state || '')}"><div class="ssc-in">
      <div class="ssc-f ssc-front"><img src="${EYE}" alt=""><b>SECRET</b></div>
      <div class="ssc-f ssc-back"><i>${esc(C.who || '')}</i><b>“${esc(C.text || '')}”</b>${C.state ? `<em>${C.state === 'found' ? 'FOUND' : C.state === 'wrong' ? 'WRONG' : C.state === 'kept' ? 'NEVER FOUND' : ''}</em>` : ''}</div>
    </div></div>`;
  }
  // the kitties: every housemate's money rolls up (or down) from where the week began, coins stacked by size
  if (st.kitties) {
    const top = Math.max(1, ...st.kitties.map(r => r.to));
    h += `<div class="ssk ${fresh ? 'fresh' : ''}"><b class="ssk-h">THE KITTIES</b><div class="ssk-r">${st.kitties.map((r, i) => {
      const up = r.to - r.from;
      return `<div class="ssk-c" style="--i:${i};--h:${Math.max(4, Math.round(r.to / top * 100))}%"><div class="ssk-stack"><i></i></div>
        <span class="ssk-n" style="--from:${Math.round(r.from)};--to:${Math.round(r.to)}" data-v="${money(r.to)}"></span>${up ? `<em class="${up > 0 ? 'up' : 'down'}">${up > 0 ? '+' : '−'}${money(Math.abs(up)).slice(1)}</em>` : ''}
        <span class="ssk-f" style="--c:${H.col(r.n)}">${H.img(r.n)}</span><b>${esc(r.n)}</b></div>`;
    }).join('')}</div></div>`;
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
  if (st.ask) h += askHtml(st.ask, o, H);
  if (st.settle && fresh) {
    const r = settleCall(o?.ssKey, st.settle.id, st.settle.answer, st.settle.n || 2);
    if (r.picked != null) {
      setTimeout(() => sfx(r.right ? 'coin' : 'lose'), 120);
      h += `<div class="sss ${r.right ? 'win' : 'lose'}"><i>${r.right ? 'YOU CALLED IT' : 'WRONG CALL'}</i><b>${money(r.delta)}</b><span>Your kitty: ${money(r.kitty)}</span>
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
  sfx(snd);
  const root = el.closest('.bbx');
  const st = el.closest('.stage');
  st?.classList.add(snd === 'buzz' ? 'ss-alarm' : 'ss-pop');
  const uid = root?.getAttribute('data-uid');
  setTimeout(() => { if (uid && typeof globalThis.bbxNext === 'function') globalThis.bbxNext(uid); }, snd === 'buzz' ? 900 : 500);
}
if (typeof window !== 'undefined') Object.assign(window, { ssCall, ssPress });

// ── the look ────────────────────────────────────────────────────────────
export const SS_CSS = `
@font-face{font-family:'SSFredoka';src:url('assets/fonts/Fredoka.woff2') format('woff2');font-weight:300 700;font-display:swap}
@font-face{font-family:'SSNunito';src:url('assets/fonts/Nunito.woff2') format('woff2');font-weight:200 1000;font-display:swap}
.bbx .stage.ss{--ssp:#ff3ea5;--ssm:#c8137a;--sst:#19d3c5;--ssi:#2b0d3f;--ssg:#f5c542;--ssc:#fff6fb;font-family:'SSNunito',system-ui,sans-serif}
.bbx .stage.ss .grain{opacity:.35}
.bbx .stage.ss .toast b{font-family:'SSFredoka',sans-serif;font-weight:700;letter-spacing:.02em}
.bbx .stage.ss .bigrev b,.bbx .stage.ss .bigrev i{font-family:'SSFredoka',sans-serif}
.bbx .stage.ss .fboard{font-family:'SSNunito',sans-serif;border-radius:1.4cqw;background:linear-gradient(160deg,rgba(43,13,63,.92),rgba(80,12,70,.9));box-shadow:0 0 0 .25cqw var(--ssp),0 1.5cqw 4cqw rgba(0,0,0,.45)}
.bbx .stage.ss .fboard .fh{font-family:'SSFredoka',sans-serif;color:var(--ssg)}
/* (the board's amount is .ft, a class Big Brother's camera thumbnails also style as a 16:9 box) */
.bbx .stage.ss .fboard .ft{width:auto;aspect-ratio:auto;box-shadow:none;opacity:1;overflow:visible;margin-left:auto;padding-left:1.4cqw;font:700 1.6cqw 'SSFredoka',sans-serif;color:#fff}
.bbx .stage.ss .fboard .fbr b{font:700 1.3cqw 'SSFredoka',sans-serif;color:#fff}
/* the HUD */
.ssh{position:absolute;inset:0 0 auto 0;z-index:30;display:flex;justify-content:space-between;align-items:flex-start;padding:1.4cqw 1.6cqw;pointer-events:none}
.ssh-bug{display:flex;align-items:center;gap:.9cqw}
.ssh-eye{width:5.6cqw;filter:drop-shadow(0 .3cqw .6cqw rgba(0,0,0,.4));animation:ss-blink 6s infinite;transform-origin:50% 55%}
.ssh-wm{font-family:'SSFredoka',sans-serif;font-weight:700;font-size:2.5cqw;line-height:.95;color:#fff;letter-spacing:.03em;
  text-shadow:0 0 .1cqw var(--ssm),.15cqw .15cqw 0 var(--ssm),-.1cqw -.1cqw 0 var(--ssm),0 .4cqw 1cqw rgba(200,19,122,.6)}
.ssh-wm span{display:block;font-family:'SSNunito',sans-serif;font-weight:800;font-size:1cqw;letter-spacing:.18em;color:#fff;text-shadow:0 .1cqw .3cqw rgba(0,0,0,.6);margin-top:.3cqw}
.ssh-live{font:800 1cqw 'SSNunito',sans-serif;letter-spacing:.14em;color:#fff;background:var(--ssp);padding:.35cqw .8cqw;border-radius:2cqw;box-shadow:0 0 1.2cqw var(--ssp);animation:ss-pulse 1.6s infinite}
.ssh-time{font:800 1.1cqw 'SSNunito',sans-serif;color:#fff;background:rgba(43,13,63,.7);padding:.35cqw .8cqw;border-radius:2cqw}
.ssh-room{font:800 1cqw 'SSNunito',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--ssi);background:var(--sst);padding:.35cqw .9cqw;border-radius:2cqw}
.ssh-room.fresh{animation:ss-slidein .5s cubic-bezier(.2,1.4,.4,1)}
.ssh-bank{display:flex;align-items:center;gap:.6cqw;background:linear-gradient(135deg,rgba(43,13,63,.88),rgba(120,16,90,.85));border:.18cqw solid var(--ssg);
  border-radius:1.2cqw;padding:.45cqw 1cqw .45cqw .5cqw;box-shadow:0 .5cqw 1.4cqw rgba(0,0,0,.35)}
.ssh-bank img{width:3cqw}
.ssh-bank i{display:block;font:800 .8cqw 'SSNunito',sans-serif;letter-spacing:.18em;color:var(--ssg);font-style:normal}
.ssh-bank b{display:block;font:700 1.7cqw 'SSFredoka',sans-serif;color:#fff}
/* the title card */
.ssrest{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;
  background:radial-gradient(60cqw 40cqw at 50% 45%,rgba(255,62,165,.55),rgba(43,13,63,.92) 70%)}
.ssrest-eye{width:16cqw;animation:ss-blink 4s infinite,ss-float 5s ease-in-out infinite;filter:drop-shadow(0 1cqw 2cqw rgba(0,0,0,.5))}
.ssrest .k{font:800 1.2cqw 'SSNunito',sans-serif;letter-spacing:.24em;color:var(--sst);text-transform:uppercase;margin-top:1.4cqw}
.ssrest .t{font:700 5.2cqw 'SSFredoka',sans-serif;line-height:1;text-shadow:.25cqw .25cqw 0 var(--ssm),0 .8cqw 2cqw rgba(0,0,0,.5);margin:.6cqw 0}
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
.ssl-tab b{font:700 2cqw 'SSFredoka',sans-serif;letter-spacing:.01em}
.ssl-tab i{font:800 .85cqw 'SSNunito',sans-serif;letter-spacing:.18em;font-style:normal;opacity:.92}
.ssl.host{--c:#7c3aed}
.ssl-next{position:absolute;right:2.2cqw;bottom:1.2cqw;color:var(--c);font-size:1.3cqw;animation:ss-bob 1s ease-in-out infinite}
.ssl.fresh,.ssd.fresh{animation:ss-boxin .38s cubic-bezier(.2,1.3,.4,1)}
.ssd{left:30cqw;right:3cqw}
.ssd-plate{position:absolute;left:-26cqw;bottom:.6cqw;width:24cqw;display:flex;flex-direction:column;align-items:flex-start;gap:.2cqw}
.ssd-plate img{width:6cqw;animation:ss-blink 5s infinite}
.ssd-plate b{font:700 3.4cqw/1 'SSFredoka',sans-serif;color:#fff;background:linear-gradient(90deg,var(--ssm),var(--ssp));padding:.6cqw 1.6cqw .8cqw;border-radius:1cqw;
  box-shadow:.35cqw .35cqw 0 var(--ssi),0 1cqw 2cqw rgba(0,0,0,.35);transform:rotate(-2deg)}
.ssd-plate i{font:800 1cqw 'SSNunito',sans-serif;letter-spacing:.3em;font-style:normal;color:#fff;background:var(--ssi);padding:.3cqw .9cqw;border-radius:.6cqw;margin-left:1cqw}
.ssd.fresh .ssd-plate b{animation:ss-plate .55s cubic-bezier(.2,1.5,.4,1)}
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
.ssv-body b{font:700 1.3cqw 'SSFredoka',sans-serif;letter-spacing:.3em;color:var(--ssg)}
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
.bbx .stage .ssc-front img{width:10cqw}.ssc-front b{font:700 2.4cqw 'SSFredoka',sans-serif;color:#fff;letter-spacing:.3em}
.ssc-back{background:linear-gradient(180deg,#fff,var(--ssc))}
.ssc-back i{font:800 1.1cqw 'SSNunito',sans-serif;letter-spacing:.2em;color:var(--ssm);font-style:normal;text-transform:uppercase}
.ssc-back b{font:700 2.3cqw/1.25 'SSFredoka',sans-serif;color:var(--ssi);margin-top:.6cqw}
.ssc-back em{position:absolute;right:1.4cqw;bottom:1.2cqw;font:700 2cqw 'SSFredoka',sans-serif;font-style:normal;letter-spacing:.12em;padding:.3cqw 1cqw;border:.3cqw solid;border-radius:.6cqw;transform:rotate(-12deg)}
.ssc.found .ssc-back em{color:#e11d48}.ssc.wrong .ssc-back em{color:#6b7280}.ssc.kept .ssc-back em{color:#0d9488}
.ssc.fresh .ssc-back em{animation:ss-stamp .4s 1.5s cubic-bezier(.2,1.6,.4,1) both}
/* the toast is a ribbon above the action (centred, it sat under the props) */
.bbx .stage.ss .toast{top:21cqw;height:6.4cqw;transform:translateY(-50%) rotate(-2deg);left:-2cqw;right:-2cqw;box-shadow:0 .6cqw 1.6cqw rgba(0,0,0,.35)}
.bbx .stage.ss .toast b{font:700 4cqw 'SSFredoka',sans-serif!important;letter-spacing:.3cqw}
/* Big Brother's chips, in Secret Story's words */
.bbx .stage.ss .chipx.hoh,.bbx .stage.ss .chipx.veto,.bbx .stage.ss .chipx.spent{display:none}
.bbx .stage.ss .chipx.out{font-size:0}.bbx .stage.ss .chipx.out::after{content:'Eliminated';font-size:.9cqw}
/* CALL IT */
.ssa{position:absolute;z-index:32;left:50%;top:6.2cqw;transform:translateX(-50%);max-width:70cqw;background:linear-gradient(135deg,rgba(43,13,63,.95),rgba(110,14,96,.93));
  border:.22cqw solid var(--ssg);border-radius:1.6cqw;padding:1cqw 1.4cqw 1.2cqw;box-shadow:0 1.4cqw 3.4cqw rgba(0,0,0,.45);cursor:default;animation:ss-askin .5s cubic-bezier(.2,1.3,.4,1)}
.ssa-h{text-align:center}
.ssa-h i{display:block;font:800 .9cqw 'SSNunito',sans-serif;letter-spacing:.32em;color:var(--ssg);font-style:normal}
.ssa-h b{display:block;font:700 1.9cqw 'SSFredoka',sans-serif;color:#fff;margin:.2cqw 0}
.ssa-h span{display:block;font:700 .95cqw 'SSNunito',sans-serif;color:rgba(255,255,255,.75)}
.ssa-os{display:flex;flex-wrap:wrap;justify-content:center;gap:.7cqw;margin-top:.8cqw}
.ssa-o{display:flex;align-items:center;gap:.5cqw;border:0;cursor:pointer;background:#fff;color:var(--ssi);border-radius:3cqw;padding:.35cqw 1.1cqw .35cqw .35cqw;
  font:700 1.2cqw 'SSFredoka',sans-serif;box-shadow:0 .3cqw 0 var(--ssm);transition:transform .15s}
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
.sss b{display:block;font:700 5cqw/1 'SSFredoka',sans-serif;color:var(--ssi)}.sss.lose b{color:#fda4af}
.sss span{font:700 1.1cqw 'SSNunito',sans-serif;color:var(--ssi)}
.sss-coins img{position:absolute;left:50%;top:50%;width:3cqw;animation:ss-coin 1.1s var(--d) cubic-bezier(.1,.8,.3,1) forwards;transform:translate(-50%,-50%)}
/* the Eye opens on a new screen */
.ss-iris{position:absolute;inset:0;z-index:70;pointer-events:none;background:var(--ssi);animation:ss-iris .75s cubic-bezier(.6,0,.2,1) forwards}
@keyframes ss-iris{0%{clip-path:ellipse(80% 0% at 50% 50%);background:var(--ssp)}1%{clip-path:ellipse(80% 60% at 50% 50%)}100%{clip-path:ellipse(80% 0% at 50% 50%);opacity:.9}}
@keyframes ss-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}
@keyframes ss-pulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}
@keyframes ss-slidein{from{transform:translateX(-2cqw);opacity:0}}
@keyframes ss-boxin{from{transform:translateY(2cqw) scale(.97);opacity:0}}
@keyframes ss-plate{from{transform:rotate(-14deg) scale(.4);opacity:0}}
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
.bbx .ssds-w{display:flex;align-items:center;gap:4px}.bbx .ssds-w b{font:700 12.5px 'SSFredoka',sans-serif;margin-left:4px}
.bbx .ssds q{display:block;font:italic 600 12.5px/1.35 'SSNunito',sans-serif;color:#f6d6ea;margin:4px 0 2px}
.bbx .ssds span{font:800 10px 'SSNunito',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#19d3c5}
.bbx .ssds.found span{color:#ff5c8a}.bbx .ssds.told span{color:#9ca3af}.bbx .ssds.found q,.bbx .ssds.told q{opacity:.6;text-decoration:line-through}
/* the kitties: columns of coins, the amount rolling (an animated integer, counter()) */
@property --ssn{syntax:'<integer>';inherits:false;initial-value:0}
.ssk{position:absolute;z-index:23;left:6cqw;right:6cqw;top:9cqw;bottom:16cqw;display:flex;flex-direction:column;align-items:center;
  background:linear-gradient(180deg,rgba(43,13,63,.88),rgba(90,10,80,.82));border-radius:2cqw;box-shadow:0 0 0 .25cqw var(--ssg),0 2cqw 4cqw rgba(0,0,0,.45);padding:1.2cqw 2cqw}
.ssk.fresh{animation:ss-boxin .5s cubic-bezier(.2,1.3,.4,1)}
.ssk-h{font:700 2.2cqw 'SSFredoka',sans-serif;color:var(--ssg);letter-spacing:.2em}
.ssk-r{flex:1;width:100%;display:flex;align-items:flex-end;justify-content:space-around;gap:1cqw;margin-top:.6cqw}
.ssk-c{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;color:#fff}
.ssk-stack{position:relative;width:62%;flex:1;display:flex;align-items:flex-end}
.ssk-stack i{display:block;width:100%;height:var(--h);border-radius:.6cqw .6cqw .2cqw .2cqw;
  background:repeating-linear-gradient(0deg,#b8860b 0 .25cqw,#f5c542 .25cqw 1.1cqw);box-shadow:0 0 1.4cqw rgba(245,197,66,.55)}
.ssk.fresh .ssk-stack i{animation:ss-grow 1.4s calc(var(--i) * .08s) cubic-bezier(.2,1,.3,1) both}
.ssk-n{font:700 1.5cqw 'SSFredoka',sans-serif;margin-top:.4cqw;--ssn:var(--to);counter-reset:k var(--ssn)}
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
.ssk-c b{font:700 1cqw 'SSFredoka',sans-serif;margin-top:.2cqw;white-space:nowrap}
@keyframes ss-grow{from{height:0}}
@keyframes ss-count{from{--ssn:var(--from)}to{--ssn:var(--to)}}
/* coins changing hands */
.ssf{position:absolute;inset:0;z-index:24;pointer-events:none}
.bbx .stage .ssf img{position:absolute;bottom:22cqw;left:var(--a);width:2.6cqw;opacity:0;animation:ss-fly 1.1s var(--d) cubic-bezier(.4,0,.2,1) forwards}
@keyframes ss-fly{0%{left:var(--a);transform:translateY(0) scale(.6);opacity:0}15%{opacity:1}50%{transform:translateY(calc(-8cqw - var(--y))) scale(1.1)}100%{left:var(--b);transform:translateY(0) scale(.7);opacity:0}}
/* the Oops signs */
.sso{position:absolute;z-index:23;bottom:31cqw;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center}
.sso b{font:700 2.2cqw 'SSFredoka',sans-serif;color:#fff;background:#e11d48;padding:.5cqw 1.4cqw;border-radius:.6cqw;border:.25cqw solid #fff;box-shadow:0 .5cqw 1cqw rgba(0,0,0,.4)}
.sso i{width:.4cqw;height:3cqw;background:#f5deb3;border-radius:.2cqw}
.sso.fresh{animation:ss-signup .55s calc(var(--i) * .12s) cubic-bezier(.2,1.6,.4,1) both}
@keyframes ss-signup{from{transform:translateX(-50%) translateY(6cqw) rotate(-12deg);opacity:0}}
@media (prefers-reduced-motion:reduce){.ss-iris,.sss-coins{display:none}.ssh-eye,.ssv-eye img,.ssrest-eye{animation:none}}
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
