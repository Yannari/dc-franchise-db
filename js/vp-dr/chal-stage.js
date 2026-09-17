// ══════════════════════════════════════════════════════════════════════
// vp-dr/chal-stage.js — the week's challenge, staged
// ══════════════════════════════════════════════════════════════════════
//
// The same pinned stage as every other screen, for the challenge half of the
// week. One state per reveal step; nothing at rest says a result.
//
//   miniStage   the reader, an arrow to the queen she reads and whether it
//               landed; a vote round as a live tally; the winner with a
//               trophy and confetti.
//   briefStage  the host walks in with the challenge's title card, and the
//               room's faces take the colour of how each queen took it, with
//               a meter of the room's mood.
//   draftStage  a board of seats, each pick flipping in on her card, and a
//               head-to-head marked when somebody got there first.
//   perfStage   the performance: the queen centre stage, her score filling,
//               a standout or a flop called out, and the queens who have
//               gone lined up with their scores.
import { _portrait } from './style.js';
import { FINALE_STAGE_CSS, shell, engine, face } from './finale-stage.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const clip = (t, n) => {
  const s = String(t || '');
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 20)).trimEnd()}…`;
};

export const CHAL_STAGE_CSS = `${FINALE_STAGE_CSS}
.chx-cards .dr-step{scroll-margin-top:440px}
.chx-line{display:flex;justify-content:center;gap:5px;flex-wrap:wrap;margin-top:8px}
.chx-q{display:flex;flex-direction:column;align-items:center;gap:2px;width:50px;filter:brightness(.6);transition:filter .4s,transform .4s}
.chx-q .fsx-face{width:34px;height:34px}
.chx-q b{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.chx-q i{font-style:normal;font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;min-height:10px;color:var(--tk,#bba)}
.chx-q.on{filter:none;transform:translateY(-3px)}
.chx-q.on .fsx-face{box-shadow:0 0 0 2px var(--fx),0 0 16px var(--fx)}
.chx-q.took{filter:none}
.chx-q.took .fsx-face{box-shadow:0 0 0 2px var(--tk)}
.chx-focus{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:140px;margin-top:8px}
.chx-in{display:flex;align-items:center;justify-content:center;gap:12px;animation:chx-in .5s cubic-bezier(.2,1.3,.4,1)}
@keyframes chx-in{from{transform:translateY(16px);opacity:0}}
.chx-one{display:flex;flex-direction:column;align-items:center;gap:4px}
.chx-one .fsx-face{width:88px;height:88px;box-shadow:0 0 0 3px var(--fx),0 10px 30px rgba(0,0,0,.6)}
.chx-one.sm .fsx-face{width:62px;height:62px}
.chx-one b{font:400 15px/1 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.chx-arrow{width:90px;height:24px}
.chx-arrow path{stroke-dasharray:110;stroke-dashoffset:110;animation:chx-draw .6s .3s forwards}
@keyframes chx-draw{to{stroke-dashoffset:0}}
.chx-verdict{font:400 14px/1 'Anton','Impact',sans-serif;letter-spacing:.14em;text-transform:uppercase;padding:3px 10px;border-radius:99px;
  opacity:0;animation:chx-pop .4s .9s forwards}
.chx-verdict.hit{background:#3be08a;color:#062012}.chx-verdict.miss{background:#ff294b;color:#fff}.chx-verdict.meh{background:rgba(255,255,255,.15)}
@keyframes chx-pop{from{opacity:0;transform:scale(1.8)}to{opacity:1;transform:none}}
.chx-tally{display:flex;flex-direction:column;gap:4px;min-width:min(360px,90%)}
.chx-tally .row{display:grid;grid-template-columns:90px 1fr 26px;gap:8px;align-items:center;font-size:12px}
.chx-tally .row b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chx-tally .bar{height:10px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
.chx-tally .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--fx),#fff);animation:chx-fill .9s forwards;animation-delay:var(--dl)}
.chx-tally .row.named b{color:#ff8fa3}.chx-tally .row.named .bar i{background:linear-gradient(90deg,#ff294b,#ffb3c0)}
@keyframes chx-fill{to{width:var(--w)}}
.chx-q-text{max-width:520px;text-align:center;font:italic 15px/1.35 Didot,'Bodoni MT',Georgia,serif}
.chx-trophy{width:64px;height:74px;filter:drop-shadow(0 0 16px rgba(255,214,107,.7));animation:chx-bob 1.8s ease-in-out infinite}
@keyframes chx-bob{50%{transform:translateY(-6px)}}
/* the brief */
.brx-card{position:relative;margin-top:8px;padding:10px 16px;border-radius:14px;text-align:center;overflow:hidden;
  background:linear-gradient(135deg,rgba(125,249,255,.12),rgba(255,123,200,.12));border:1px solid rgba(125,249,255,.3)}
.brx-card small{display:inline-block;padding:2px 10px;border-radius:99px;background:var(--fx);color:#041418;font-size:10px;letter-spacing:.24em;text-transform:uppercase}
.brx-card b{display:block;margin-top:4px;font:400 clamp(24px,4.4vw,40px)/1 'Anton','Impact',sans-serif;letter-spacing:.04em;text-transform:uppercase;
  background:linear-gradient(90deg,#fff,var(--fx),#fff);-webkit-background-clip:text;background-clip:text;color:transparent;background-size:200% 100%;
  animation:brx-shine 3s linear infinite}
@keyframes brx-shine{to{background-position:-200% 0}}
.brx-card p{margin:6px auto 0;max-width:620px;font-size:12px;line-height:1.4;color:#cfe;opacity:0;max-height:0;overflow:hidden;transition:opacity .5s,max-height .6s}
.fsx.told .brx-card p{opacity:1;max-height:80px}
.brx-mood{display:flex;align-items:center;gap:8px;justify-content:center;margin-top:8px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#bbd}
.brx-mood .bar{position:relative;width:min(260px,60%);height:8px;border-radius:99px;background:linear-gradient(90deg,#ff294b,#ffc83d 50%,#3be08a)}
.brx-mood .bar i{position:absolute;top:50%;left:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#fff;box-shadow:0 0 12px #fff;transition:left .6s cubic-bezier(.2,1.4,.4,1)}
/* the draft */
.dfx-pick{perspective:500px}
.dfx-card{min-width:150px;padding:10px 14px;border-radius:12px;text-align:center;background:linear-gradient(135deg,#fff8e6,#ffd6ea);color:#240a18;
  font:400 17px/1.1 'Anton','Impact',sans-serif;letter-spacing:.04em;text-transform:uppercase;animation:dfx-flip .7s .2s both}
.dfx-card small{display:block;font:600 9px/1 system-ui,sans-serif;letter-spacing:.2em;color:#8a3a5e;margin-bottom:4px}
@keyframes dfx-flip{from{transform:rotateY(90deg);opacity:0}to{transform:none;opacity:1}}
.dfx-lost{display:flex;align-items:center;gap:6px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#ff8fa3;opacity:0;animation:chx-pop .4s 1s forwards}
.dfx-lost .fsx-face{width:30px;height:30px;box-shadow:0 0 0 2px #ff294b}
/* the performance */
.pfx-hall{position:relative;min-height:170px;margin-top:8px;border-radius:14px;overflow:hidden;
  background:radial-gradient(50% 70% at 50% 0,rgba(255,255,255,.12),transparent 70%),radial-gradient(70% 50% at 50% 110%,rgba(255,123,200,.2),transparent 70%),#07030a}
.pfx-hall::before{content:'';position:absolute;left:50%;top:-10px;width:260px;height:260px;transform:translateX(-50%);
  background:linear-gradient(180deg,rgba(255,244,220,.28),transparent 80%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%)}
.pfx-q{display:none;position:relative;flex-direction:column;align-items:center;gap:5px;padding:16px 8px 10px}
.pfx-q.cur{display:flex;animation:chx-in .7s cubic-bezier(.2,1.3,.4,1)}
.pfx-q .fsx-face{width:96px;height:96px;box-shadow:0 0 0 4px var(--fx),0 0 40px rgba(255,123,200,.4)}
.pfx-q b{font:400 19px/1 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.pfx-role{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--fx)}
.pfx-meter{width:190px;height:10px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden}
.pfx-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff7bc8,#ffd66b);transition:width 1.3s cubic-bezier(.2,1,.3,1) .5s}
.pfx-q.cur .pfx-meter i{width:var(--w)}
.pfx-num{font:700 18px/1 ui-monospace,Menlo,monospace;color:#ffd66b;opacity:0;transition:opacity .4s 1.4s}
.pfx-q.cur .pfx-num{opacity:1}
.pfx-room{display:none;padding:18px 8px}
.pfx-room.cur{display:flex;justify-content:center}
@media (max-width:640px){
  .chx-one .fsx-face{width:64px;height:64px}.chx-arrow{width:56px}
  .chx-tally .row{grid-template-columns:70px 1fr 22px}
  .pfx-q .fsx-face{width:72px;height:72px}
}
@media (prefers-reduced-motion: reduce){
  .chx-verdict,.dfx-lost{opacity:1}.chx-tally .bar i{width:var(--w)}
}
/* Last, so it wins over the base sizes above. */
@media (max-height: 999px){
  .chx-q .fsx-face{width:28px;height:28px}.chx-line{margin-top:4px}
  .chx-focus{min-height:104px;margin-top:4px}.chx-one .fsx-face{width:62px;height:62px}.chx-one.sm .fsx-face{width:46px;height:46px}
  .brx-card{padding:6px 12px}.brx-card b{font-size:24px}
  .pfx-hall{min-height:130px}.pfx-q{padding:10px 6px 6px}.pfx-q .fsx-face{width:66px;height:66px}
  .chx-cards .dr-step{scroll-margin-top:320px}
}
`;

const ARROW = (hit = true) => `<svg class="chx-arrow" viewBox="0 0 90 24"><path d="M3 12 H78 M66 3 L82 12 L66 21" fill="none" stroke="${hit ? '#ffd66b' : '#9aa0b4'}" stroke-width="3.5" stroke-linecap="round"/></svg>`;
const TROPHY = `<svg class="chx-trophy" viewBox="0 0 64 74" aria-hidden="true"><defs><linearGradient id="chxg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3cf"/><stop offset="1" stop-color="#d8990f"/></linearGradient></defs>
  <path d="M14 4h36v16c0 12-8 22-18 22S14 32 14 20z" fill="url(#chxg)" stroke="#7a4e00" stroke-width="1.5"/>
  <path d="M14 10H4c0 10 5 16 12 16M50 10h10c0 10-5 16-12 16" fill="none" stroke="#d8990f" stroke-width="3"/>
  <rect x="27" y="42" width="10" height="12" fill="#d8990f"/><rect x="16" y="54" width="32" height="8" rx="2" fill="url(#chxg)" stroke="#7a4e00"/>
  <rect x="12" y="62" width="40" height="8" rx="2" fill="#6b1d3b"/><circle cx="32" cy="18" r="5" fill="#ff3d9a"/></svg>`;

const one = (n, ep, sm = false) => `<div class="chx-one${sm ? ' sm' : ''}">${face(n, ep, sm ? 62 : 88)}<b>${esc(n)}</b></div>`;
/* `names: false` on a screen whose result is a queen: the line is every face
   in the room, and a line of names at rest contains the winner's. */
const lineOf = (room, ep, names = true) => `<div class="chx-line">${room.map(n => `<span class="chx-q" data-q="${esc(n)}" title="${esc(n)}">${face(n, ep, 34)}${names ? `<b>${esc(n)}</b>` : ''}<i></i></span>`).join(' ')}</div>`;

/** The shared paint: the line, and a focus area rebuilt only when it changes. */
function paintFocus(el, st, memo) {
  for (const q of el.querySelectorAll('.chx-q')) {
    const n = q.dataset.q;
    q.classList.toggle('on', !!st && (st.on || []).includes(n));
    const tk = st?.tags?.[n];
    q.classList.toggle('took', !!tk);
    q.style.setProperty('--tk', tk?.c || '#bba');
    q.querySelector('i').textContent = tk?.t || '';
  }
  const f = el.querySelector('[data-focus]');
  const html = st?.focus || '';
  if (memo.html !== html) { f.innerHTML = html; memo.html = html; }
}

// ══════════════════════════════════════════════════════════════════════

/**
 * `list`: { t: 'read', who, at, tier } | { t: 'say', who } |
 * { t: 'vote', text, tally, named, owner, count, of } | { t: 'win', who }.
 */
export function miniStage(row, list, { ep, room = [], name = '', prize = '', uid = 'x' } = {}) {
  const states = list.map(s => {
    const st = { phase: 'mini', on: [s.who, s.at].filter(Boolean), tags: {} };
    if (s.t === 'read' && s.at) {
      const hit = s.tier === 'nailed';
      const miss = s.tier === 'passed';
      st.focus = `<div class="chx-in">${one(s.who, ep)}${ARROW(!miss)}${one(s.at, ep, true)}</div>
        <span class="chx-verdict ${hit ? 'hit' : miss ? 'miss' : 'meh'}">${hit ? 'It lands' : miss ? 'Nothing' : 'A read'}</span>`;
      if (hit) { st.stars = true; st.mood = 'gold'; }
      if (miss) { st.shake = true; st.mood = 'red'; }
    } else if (s.t === 'vote') {
      const rows = Object.entries(s.tally || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      const top = Math.max(1, ...rows.map(r => r[1]));
      st.on = [s.named, s.owner].filter(Boolean);
      st.focus = `<div class="chx-q-text">${esc(clip(s.text, 140))}</div><div class="chx-tally">${rows.map(([n, v], j) =>
        `<div class="row${n === s.named ? ' named' : ''}"><b>${esc(n)}</b><div class="bar"><i style="--w:${Math.round((v / top) * 100)}%;--dl:${(j * 0.12).toFixed(2)}s"></i></div><span>${v}</span></div>`).join('')}</div>`;
      st.banner = s.named ? { text: s.named, sub: `${s.count} of ${s.of} said her name`, red: true } : s.owner ? { text: `It was ${s.owner}'s`, sub: `${s.count} of ${s.of} knew` } : null;
      st.shake = !!s.named;
    } else if (s.t === 'win') {
      st.focus = `<div class="chx-in">${TROPHY}${one(s.who, ep)}</div>`;
      st.banner = { text: 'Mini winner', sub: s.who };
      st.burst = true;
      st.mood = 'gold';
      st.tags[s.who] = { t: 'winner', c: '#ffd66b' };
    } else if (s.who) {
      st.focus = `<div class="chx-in">${one(s.who, ep)}</div>`;
    }
    return st;
  });
  const body = `${lineOf(room, ep, false)}<div class="chx-focus" data-focus></div>`;
  const html = shell({ id: `mnx-${uid}`, title: name || 'The mini', sub: prize ? `for ${prize}` : 'mini challenge', body, theme: 'werk' });
  const memo = {};
  const apply = engine(`mnx-${uid}`, states, (el, st) => paintFocus(el, st, memo));
  return { html, apply, states };
}

const MOOD_OF = { delighted: 1, braced: 0, dreading: -1 };
const TIER_C = { delighted: '#3BE08A', braced: '#FFC83D', dreading: '#FF294B' };

/** `list`: { t: 'host' } | { t: 'react', who, tier } | { t: 'other', who }. */
export function briefStage(row, list, { ep, room = [], name = '', format = '', desc = '', uid = 'x' } = {}) {
  const tags = {};
  let mood = 0;
  let told = false;
  let first = true;
  const states = list.map(s => {
    const st = { phase: 'brief', on: s.who ? [s.who] : [] };
    if (s.t === 'host') {
      st.hostOn = true;
      told = true;
      if (first) { st.banner = { text: name, sub: format || 'the maxi challenge' }; st.stars = true; first = false; }
    } else if (s.t === 'react' && s.tier) {
      tags[s.who] = { t: s.tier, c: TIER_C[s.tier] || '#bba' };
      mood += MOOD_OF[s.tier] || 0;
      if (s.tier === 'dreading') st.mood = 'red';
      if (s.tier === 'delighted') st.mood = 'gold';
      st.focus = `<div class="chx-in">${one(s.who, ep)}</div><span class="chx-verdict ${s.tier === 'delighted' ? 'hit' : s.tier === 'dreading' ? 'miss' : 'meh'}">${esc(s.tier)}</span>`;
    } else if (s.who) {
      st.focus = `<div class="chx-in">${one(s.who, ep)}</div>`;
    }
    st.tags = { ...tags };
    st.mood2 = mood;
    st.told = told;
    return st;
  });
  const body = `<div class="brx-card"><small>${esc(format || 'maxi challenge')}</small><b>${esc(name)}</b><p>${esc(clip(desc, 240))}</p></div>
    ${lineOf(room, ep)}<div class="chx-focus" data-focus></div>
    <div class="brx-mood"><span>dreading</span><div class="bar"><i data-mood></i></div><span>delighted</span></div>`;
  const html = shell({ id: `brx-${uid}`, title: 'The brief', sub: 'the host walks in', body, theme: 'werk' });
  const memo = {};
  const apply = engine(`brx-${uid}`, states, (el, st) => {
    el.classList.toggle('told', !!st?.told);
    paintFocus(el, st, memo);
    const n = Math.max(1, room.length);
    el.querySelector('[data-mood]').style.left = `${clamp(50 + ((st?.mood2 || 0) / n) * 50, 4, 96)}%`;
  });
  return { html, apply, states };
}

/** `list`: { who, took, lostTo, pairedBy } per card, in order. */
export function draftStage(row, list, { ep, room = [], title = 'The draft', sub = '', uid = 'x' } = {}) {
  const tags = {};
  const states = list.map(s => {
    const st = { phase: 'draft', on: [s.who, s.lostTo].filter(Boolean) };
    if (s.who && s.took) tags[s.who] = { t: s.took, c: s.lostTo ? '#ff8fa3' : '#ffd66b' };
    if (s.who) {
      st.focus = `<div class="chx-in">${one(s.who, ep)}<div class="dfx-pick"><div class="dfx-card"><small>${s.pairedBy ? `paired by ${esc(s.pairedBy)}` : 'takes'}</small>${esc(s.took || 'no pick')}</div></div></div>
        ${s.lostTo ? `<div class="dfx-lost">${face(s.lostTo, ep, 30)}${esc(s.lostTo)} got there first</div>` : ''}`;
    }
    if (s.lostTo) { st.shake = true; st.mood = 'red'; st.banner = { text: 'Head-to-head', sub: `${s.lostTo} beat ${s.who} to it`, red: true }; }
    st.tags = { ...tags };
    return st;
  });
  const body = `${lineOf(room, ep)}<div class="chx-focus" data-focus></div>`;
  const html = shell({ id: `dfx-${uid}`, title, sub, body, theme: 'werk', hostChip: false });
  const memo = {};
  const apply = engine(`dfx-${uid}`, states, (el, st) => paintFocus(el, st, memo));
  return { html, apply, states };
}

/**
 * `running`: [{ who, perf, role, moment }] in order, then `extra` more
 * steps of the room between performances ({ players }).
 */
export function perfStage(row, running, extra, { ep, title, sub, uid = 'x' } = {}) {
  const done = [];
  const tags = {};
  const states = running.map(p => {
    done.push(p.who);
    tags[p.who] = { t: p.perf.toFixed(1), c: p.perf >= 8 ? '#ffd66b' : p.perf < 4 ? '#ff5a6e' : '#cfd8ff' };
    const big = p.perf >= 8;
    const flop = p.perf < 4;
    return {
      phase: 'perf', cur: p.who, on: [p.who], tags: { ...tags },
      mood: big ? 'gold' : flop ? 'red' : '',
      banner: big ? { text: 'Standout', sub: p.who } : flop ? { text: 'It is not working', sub: p.who, red: true } : p.moment ? { text: 'A moment', sub: p.who } : null,
      burst: big, stars: !big && !!p.moment, shake: flop,
    };
  }).concat(extra.map((x, i) => ({
    phase: 'room', cur: `room${i}`, on: x.players || [], tags: { ...tags },
  })));
  const perfHtml = running.map(p => `<div class="pfx-q" data-c="${esc(p.who)}" style="--w:${clamp(p.perf * 10, 4, 100)}%">
      ${face(p.who, ep, 96)}<b>${esc(p.who)}</b>${p.role ? `<span class="pfx-role">${esc(p.role)}</span>` : ''}
      <div class="pfx-meter"><i></i></div><span class="pfx-num" data-v="${p.perf.toFixed(1)}"></span></div>`).join('');
  const roomHtml = extra.map((x, i) => `<div class="pfx-room" data-c="room${i}"><div class="chx-in">${(x.players || []).slice(0, 2).map(n => one(n, ep, true)).join('')}</div></div>`).join('');
  const room = running.map(p => p.who);
  const body = `<div class="pfx-hall">${perfHtml}${roomHtml}</div>${lineOf(room, ep)}`;
  const html = shell({ id: `pfx-${uid}`, title, sub, body, theme: 'stage', hostChip: false });
  const apply = engine(`pfx-${uid}`, states, (el, st) => {
    for (const c of el.querySelectorAll('[data-c]')) {
      const cur = !!st && st.cur === c.dataset.c;
      c.classList.toggle('cur', cur);
      // A score is written in only when her performance is on the stage.
      const num = c.querySelector('.pfx-num');
      if (num) num.textContent = cur ? num.dataset.v : '';
    }
    for (const q of el.querySelectorAll('.chx-q')) {
      const n = q.dataset.q;
      q.classList.toggle('on', !!st && st.on.includes(n));
      const tk = st?.tags?.[n];
      q.classList.toggle('took', !!tk && st.cur !== n);
      q.style.setProperty('--tk', tk?.c || '#bba');
      q.querySelector('i').textContent = tk && st.cur !== n ? tk.t : '';
    }
  });
  return { html, apply, states };
}

export { _portrait };
