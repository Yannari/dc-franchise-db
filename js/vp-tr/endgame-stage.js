// ══════════════════════════════════════════════════════════════════════
// vp-tr/endgame-stage.js — the endgame, played at the fire
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-03: "the endgame doesnt have a viewer", then "i want
// something wow and grandiose with a beautful scene like the real show". The
// place is the one the repo's mockup settled on (mockup/mockup-tr-fire-of-
// truth.html): one firepit, at night, in front of the lit castle — a painted
// render (tools/blender/traitors-endgame.py) — and every beat happens AT it.
//
// THE FIRE IS THE STATUS DISPLAY, drawn live over the plate:
//   the question     everyone throws a folded slip into it, and it flares
//   the count        it ROARS when hands ask for another, SETTLES gold on "end it"
//   a table          the one sent home walks out of the light into the dark
//   the held breath  it drops nearly out
//   turning over     a Traitor burns it RED; a Faithful burns it pale gold
//   the box          the strongbox breaks open in light, and gold falls
//
// The words are the page's (endgame.js `_buildBeats`), read by the shared
// line reader, so the stage says exactly what the page says and keeps its
// gates: a player layer sees a slip sealed where the page seals it. Like
// every other file in this directory it imports no engine state.
import { endgameStageData } from './endgame.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face } from './castle-stage.js';
import { beatLines } from './stage-lines.js';
import { footCard, playCard, CARD_CSS } from './stage-cards.js';
import { trPlay } from './sfx.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const clean = x => String(x || '').replace(/\s+/g, ' ').trim();

// THE FORECOURT (traitors-endgame.py `measure()`), fractions of the render
const PLATE = 'assets/sets/traitors/endgame.webp';
const EG = {
  pit: { base: [0.4912, 0.8456], top: [0.4913, 0.664], left: 0.4034, right: 0.5794 },
  box: { base: [0.6883, 0.8211], top: [0.6874, 0.7378] },
  // nine places in an arc behind the fire, left to right as you look
  stand: [[0.3241, 0.8732, 0.6685], [0.3547, 0.8578, 0.666], [0.3964, 0.8467, 0.6642], [0.4447, 0.8401, 0.6631],
    [0.4959, 0.8381, 0.6628], [0.5467, 0.8407, 0.6632], [0.5939, 0.8478, 0.6643], [0.6337, 0.8595, 0.6662], [0.6614, 0.8754, 0.6688]],
};
function box(W, H) {
  const k = Math.max(W / 1920, H / 1080), dw = 1920 * k, dh = 1080 * k, ox = (W - dw) / 2, oy = (H - dh) / 2;
  return { dw, dh, x: f => ox + f * dw, y: f => oy + f * dh };
}
/** Where the k-th of n stands: spread evenly along the whole arc, between its measured places. */
function placeOf(k, n) {
  const t = n <= 1 ? 4 : .4 + (7.2 * k) / (n - 1), i = Math.min(7, Math.floor(t)), f = t - i;
  const a = EG.stand[i], b2 = EG.stand[i + 1];
  return [a[0] + (b2[0] - a[0]) * f, a[1] + (b2[1] - a[1]) * f, a[2] + (b2[2] - a[2]) * f];
}

export function endgameStageScreen(ep, observer, pageHtml, seg = 'all') {
  if (!(ep && ep.tr && ep.tr.endgame) || !pageHtml) return pageHtml;
  const init = () => {
    const data = endgameStageData(ep, observer, seg);
    if (!data) return { steps: [] };
    const steps = beatLines(data.beats, (n, part, ctx) => {
      // the slates and the tally are drawn by the count sentence after them; read raw they are names and digits
      if (['sums', 'winners', 'lost', 'pot', 'vote', 'tally', 'trow', 'slate', 'trail'].includes(part)) return [];
      if (part === 'answer') {
        const m = ctx.meta || {};
        const note = clean(n.querySelector('.lt-answer-note')?.textContent);
        const word = clean(n.querySelector('.lt-slip-w')?.textContent);
        return [{ t: 'narr', who: m.name || null, react: !!m.name, tag: (m.name || '') + ' · ' + word, text: note || word }];
      }
      if (part === 'count') {
        return [{ t: 'narr', tag: 'The count', text: clean(n.querySelector('.lt-count-n')?.textContent) + ' — ' + clean(n.querySelector('.lt-count-s')?.textContent) }];
      }
      if (part === 'turn') {
        return [{ t: 'narr', tag: clean(n.querySelector('.lt-turn-nm')?.textContent) + ' · ' + clean(n.querySelector('.lt-turn-role')?.textContent),
          text: clean(n.querySelector('.lt-turn-tx')?.textContent) }];
      }
      if (part === 'sent') {
        return [...n.querySelectorAll('.lt-sent-row')].map(r => ({ t: 'narr', who: clean(r.querySelector('.lt-sent-nm')?.textContent),
          tag: clean(r.querySelector('.lt-sent-nm')?.textContent) + ' · ' + clean(r.querySelector('.lt-sent-role')?.textContent),
          text: clean(r.querySelector('.lt-sent-say')?.textContent), react: true }));
      }
      if (part === 'verdict') {
        return [{ t: 'narr', tag: clean(n.querySelector('.lt-verdict-k')?.textContent),
          text: [clean(n.querySelector('.lt-verdict-h')?.textContent), clean(n.querySelector('.lt-verdict-s')?.textContent)].filter(Boolean).join('. ') }];
      }
      if (part === 'act') {
        return [{ t: 'narr', tag: clean(n.querySelector('.ft-act-h')?.textContent), text: clean(n.querySelector('.ft-act-sub')?.textContent) }];
      }
      if (part === 'void') {
        return [{ t: 'narr', tag: clean(n.querySelector('.lt-void-w')?.textContent), text: clean(n.querySelector('.lt-void-s')?.textContent) }];
      }
      return null;
    });
    return { data, steps };
  };
  const uid = 'teg-' + String(ep.num) + '-' + String(seg).replace(/\W/g, '') + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: String(seg).startsWith('fire:') ? 'The Fire Of Truth' : 'The Endgame',
    day: (ep.tr && ep.tr.ep) || ep.num, pot: ep.tr && ep.tr.pot, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="teg"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CSS), pageHtml);
}

/** Everything that has happened by step idx: who is still at the fire, what the fire is doing. */
function stateAt(S) {
  const v = S.data.v;
  const r = { gone: new Set(), turned: {}, fire: 'low', slip: null, thrown: false, money: false, dark: false, kind: '', party: false };
  for (let k = 0; k <= S.idx; k++) {
    const st = S.steps[k], m = st.meta || {};
    const first = (S.steps[k - 1] || {}).beat !== st.beat;
    r.kind = m.kind || '';
    r.slip = null; r.thrown = false;
    if (m.kind === 'ask') { r.fire = 'flare'; if (first) r.thrown = k; }
    // EVERY POUCH BURNS ITS COLOUR as it lands (the US format): green to end,
    // red to banish again; the count leaves the fire on the answer
    if (m.kind === 'answer') { r.slip = { who: m.name, shown: m.shown }; r.fire = m.shown === 'banish' ? 'redflame' : m.shown === 'end' ? 'green' : 'flare'; }
    if (m.kind === 'count') r.fire = m.unanimous ? 'green' : 'redflame';
    if (m.kind === 'celebrate') r.party = true;
    if (m.kind === 'table' && m.chosen) r.gone.add(m.chosen);
    if (m.kind === 'suspense') { r.fire = 'dim'; r.dark = true; }
    if (m.kind === 'unmask-open') { r.fire = 'low'; r.dark = false; }
    if (m.kind === 'unmask' && m.name) { r.turned[m.name] = m.role; r.fire = m.role === 'traitor' ? 'red' : 'pale'; }
    if (m.kind === 'money') { if (!m.act) { r.money = true; r.fire = 'gold'; r.dark = false; } }
  }
  return r;
}

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.teg');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const v = S.data.v, b = box(W, H);
  root.querySelectorAll('.trs-seg').forEach(s => {
    s.classList.toggle('trs-done', S.idx >= 0 && s.dataset.k !== 'night');
    s.classList.toggle('trs-now', S.idx >= 0 && s.dataset.k === 'night');
  });
  const start = root.querySelector('.trs-start');
  const st = S.idx >= 0 ? S.steps[S.idx] : null;
  const r = st ? stateAt(S) : { gone: new Set(), turned: {}, fire: 'low', slip: null, thrown: false, money: false, dark: false, kind: '' };
  const m = (st && st.meta) || {};
  const firstOfBeat = st && (S.steps[S.idx - 1] || {}).beat !== st.beat;
  // WHO IS AT THIS FIRE: the people asked this time, or (the finale) whoever is still standing
  const seg = S.data.seg || 'all';
  const fireN = String(seg).startsWith('fire:') ? Number(String(seg).split(':')[1]) || 0 : -1;
  const room = (fireN >= 0 ? ((v.asks[fireN] || {}).living || v.room)
    : seg === 'finale' && (v.reveals || []).length ? v.reveals.map(x => x.name) : v.room).slice(0, 9);
  const takers = new Set(v.takers || []);
  const speaker = st && (st.t === 'say' || st.react) ? st.who : null;

  let h = '<div class="teg-world"><img class="teg-plate" src="' + PLATE + '" alt="" draggable="false">';
  // THE FIRELIGHT, over everything it touches
  h += `<div class="teg-light teg-${r.fire}" style="--px:${(EG.pit.base[0] * 100).toFixed(1)}%;--py:${((b.y(EG.pit.base[1]) / H) * 100).toFixed(1)}%"></div>`;
  // THE PEOPLE, in the arc behind the fire
  const pw = Math.max(44, Math.min(H * .08, W * .5 / Math.max(3, room.length)));
  room.forEach((name, i) => {
    const s = placeOf(i, room.length), x = b.x(s[0]), y = b.y(s[2]) - pw * .45;
    const gone = r.gone.has(name), role = r.turned[name];
    const leaving = gone && st && m.kind === 'table' && m.chosen === name && fresh && firstOfBeat;
    if (gone && !leaving) return;
    const cls = ['teg-p', speaker === name ? 'teg-speak' : (speaker ? 'teg-quiet' : ''), leaving ? 'teg-leave' : '',
      role ? 'teg-turned teg-' + role : '', fresh && m.kind === 'unmask' && m.name === name ? 'teg-flip' : '',
      r.money ? (takers.has(name) ? 'teg-take' : 'teg-lose') : ''].join(' ');
    h += `<div class="${cls}" style="left:${x}px;top:${y}px;width:${pw}px">`
      + `<div class="teg-av">${face(name)}</div><div class="teg-nm">${esc(name)}</div>`
      + (role ? `<div class="teg-role">${role === 'traitor' ? 'Traitor' : 'Faithful'}</div>` : '')
      + (r.slip && r.slip.who === name
        ? `<div class="teg-slip teg-pouch${fresh ? ' teg-unfold' : ''}" data-c="${esc(r.slip.shown)}">${r.slip.shown === 'banish' ? 'Red' : r.slip.shown === 'end' ? 'Green' : 'Sealed'}</div>` : '')
      + '</div>';
    // a slip thrown into the fire, from every hand still here
    if (r.thrown !== false && S.idx === r.thrown && fresh) {
      const fx = b.x(EG.pit.base[0]) - x, fy = b.y(EG.pit.base[1]) - y;
      h += `<i class="teg-throw" style="left:${x}px;top:${y}px;--dx:${fx.toFixed(0)}px;--dy:${fy.toFixed(0)}px;animation-delay:${(i * .18).toFixed(2)}s"></i>`;
    }
  });
  // THE FIRE ITSELF: layered flame and rising sparks, coloured by the state of the game
  const fw = (EG.pit.right - EG.pit.left) * b.dw * .9, fh = (EG.pit.base[1] - EG.pit.top[1]) * b.dh;
  h += `<div class="teg-fire teg-${r.fire}${fresh && (m.kind === 'count' || m.kind === 'unmask' || m.kind === 'ask') && firstOfBeat ? ' teg-burst' : ''}" `
    + `style="left:${b.x(EG.pit.base[0])}px;top:${b.y(EG.pit.base[1]) - fh * .08}px;width:${fw}px;height:${fh}px">`
    + '<i class="f1"></i><i class="f2"></i><i class="f3"></i><i class="f4"></i>'
    + Array.from({ length: 16 }, (_, i) => `<b style="left:${20 + (hash('s' + i) % 60)}%;animation-delay:-${(hash('d' + i) % 30) / 10}s;animation-duration:${2.2 + (hash('t' + i) % 18) / 10}s"></b>`).join('')
    + '</div>';
  // THE STRONGBOX: shut until the end, then light pours out of it
  if (r.money) {
    const bx = b.x(EG.box.base[0]), by = b.y(EG.box.top[1]);
    h += `<div class="teg-boxlight${fresh && firstOfBeat ? ' teg-open' : ''}" style="left:${bx}px;top:${by}px"></div>`;
    if (fresh && firstOfBeat) h += '<div class="teg-gold">' + Array.from({ length: 34 }, (_, i) =>
      `<i style="left:${(hash('g' + i) % 100)}%;animation-delay:${(i % 11) * .12}s;animation-duration:${2.2 + (hash('h' + i) % 14) / 10}s"></i>`).join('') + '</div>';
  }
  h += '</div>';
  if (r.dark) h += '<div class="teg-dark"></div>';
  // THE FIREWORKS, over the castle, for the winners
  if (r.party) {
    const cols = v.winner === 'traitors' ? ['#ff3a4a', '#ffd760', '#ff8a2a'] : ['#ffd760', '#9fe8ff', '#ffffff', '#7dff9a'];
    h += '<div class="teg-fw">' + Array.from({ length: 7 }, (_, k) => {
      const c = cols[k % cols.length];
      return `<div class="teg-burst" style="left:${12 + (hash('fx' + k) % 76)}%;top:${8 + (hash('fy' + k) % 26)}%;--c:${c};animation-delay:${(k * .55).toFixed(2)}s">`
        + Array.from({ length: 18 }, (_, j) => `<i style="--a:${j * 20}deg"></i>`).join('') + '</div>';
    }).join('') + '</div>';
  }
  // the pot, once it is the subject
  if (r.money) h += `<div class="teg-pot"><span>In the box</span><b>£${Number(v.pot || 0).toLocaleString('en-GB')}</b>`
    + `<em>${v.takers.length === 1 ? 'one of them takes it all' : v.takers.length + ' ways'}</em></div>`;
  if (S.idx === 0 && fresh) h += `<div class="teg-title" data-a="The Endgame" data-b="The fire · the last question"></div>`;
  if (!st) {
    el.innerHTML = h;
    start.innerHTML = `<b>The Endgame</b><span>${room.length} at the fire · press Next, or click the fire</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  h += footCard(st, S.data.host || { name: '', slug: null });
  el.innerHTML = h;
  playCard(el, st, S, fresh);
  // THE CAMERA: in on whoever has the floor; back out for the fire and the box
  const world = el.querySelector('.teg-world');
  let cam = 'translate(0px,0px) scale(1)';
  const focusName = speaker || (m.kind === 'unmask' ? m.name : null) || (r.slip && r.slip.who);
  const fi = focusName ? room.indexOf(focusName) : -1;
  if (fi >= 0 && !r.money) {
    const s = placeOf(fi, room.length), fx = b.x(s[0]), fy = b.y(s[2]);
    const k = 1.35, tx = Math.min(0, Math.max(W - W * k, W / 2 - fx * k)), ty = Math.min(0, Math.max(H - H * k, H * .42 - fy * k));
    cam = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k})`;
  } else if (r.money) {
    const fx = b.x(EG.box.base[0]), fy = b.y(EG.box.top[1]);
    const k = 1.18, tx = Math.min(0, Math.max(W - W * k, W / 2 - fx * k)), ty = Math.min(0, Math.max(H - H * k, H * .5 - fy * k));
    cam = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k})`;
  }
  world.style.setProperty('--cam', cam);
  world.style.setProperty('--cam0', fresh ? (S.cam || cam) : cam);
  if (fresh) world.classList.add('teg-move');
  S.cam = cam;
  if (fresh && firstOfBeat) {
    if (m.kind === 'ask') trPlay('tr-quill');
    else if (m.kind === 'count') trPlay(m.unanimous ? 'tr-wax' : 'tr-heartbeat');
    else if (m.kind === 'table') trPlay('tr-footsteps');
    else if (m.kind === 'suspense') trPlay('tr-heartbeat', 300);
    else if (m.kind === 'unmask') trPlay(m.role === 'traitor' ? 'tr-clang' : 'tr-slate', 300);
    else if (m.kind === 'money' && !m.act) trPlay('tr-coins', 400);
    else if (m.kind === 'celebrate') trPlay('tr-coins', 200);
  }
  const corner = root.querySelector('.trs-corner');
  corner.innerHTML = `The fire · <b>${r.money ? 'The box' : r.kind === 'unmask' ? 'Turning over' : r.dark ? 'The held breath'
    : r.kind === 'table' || r.kind === 'vote' ? 'A name' : r.kind === 'count' ? 'The count' : r.kind === 'answer' ? 'The word' : r.kind === 'ask' ? 'The question' : 'The last night'}</b>`;
  corner.classList.add('trs-in');
}

const CSS = `
.teg{position:absolute;inset:0;overflow:hidden;background:#03040a}
.teg-world{position:absolute;inset:0;transform-origin:0 0;transform:var(--cam)}
.teg-world.teg-move{animation:tegCam 1.3s cubic-bezier(.6,0,.2,1) both}
@keyframes tegCam{from{transform:var(--cam0)}to{transform:var(--cam)}}
.teg-plate{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none}
/* the firelight: a wash over the whole forecourt, its colour the fire's */
.teg-light{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;transition:background 1.2s,opacity 1.2s;
  background:radial-gradient(38% 34% at var(--px) var(--py),var(--lc,rgba(255,140,50,.38)),transparent 75%);animation:tegFlick 2.6s steps(10) infinite}
.teg-light.teg-roar{--lc:rgba(255,110,30,.6)}
.teg-light.teg-settle{--lc:rgba(255,200,110,.32)}
.teg-light.teg-red{--lc:rgba(220,30,50,.62)}
.teg-light.teg-pale{--lc:rgba(255,236,190,.45)}
.teg-light.teg-gold{--lc:rgba(255,206,90,.62)}
.teg-light.teg-dim{opacity:.15}
@keyframes tegFlick{0%,100%{opacity:.85}25%{opacity:1}45%{opacity:.7}70%{opacity:.95}}
/* THE FIRE: four tongues and the sparks, scaled and coloured by state */
.teg-fire{position:absolute;transform:translate(-50%,-100%);z-index:15;pointer-events:none;--s:1;--c1:#fff3c4;--c2:#ffb340;--c3:#e8531c;transition:filter 1s}
.teg-fire i{position:absolute;left:50%;bottom:0;border-radius:50% 50% 45% 45%/70% 70% 30% 30%;transform-origin:50% 100%;mix-blend-mode:screen;filter:blur(3px)}
.teg-fire .f1{width:62%;height:calc(70% * var(--s));margin-left:-31%;background:radial-gradient(60% 70% at 50% 85%,var(--c2),var(--c3) 55%,transparent 72%);animation:tegF 1.1s ease-in-out infinite alternate}
.teg-fire .f2{width:44%;height:calc(92% * var(--s));margin-left:-28%;background:radial-gradient(55% 70% at 50% 85%,var(--c2),var(--c3) 50%,transparent 70%);animation:tegF 1.4s ease-in-out -.4s infinite alternate}
.teg-fire .f3{width:40%;height:calc(84% * var(--s));margin-left:-8%;background:radial-gradient(55% 70% at 50% 85%,var(--c2),var(--c3) 50%,transparent 70%);animation:tegF 1.25s ease-in-out -.8s infinite alternate}
.teg-fire .f4{width:30%;height:calc(52% * var(--s));margin-left:-15%;background:radial-gradient(55% 65% at 50% 80%,var(--c1),var(--c2) 55%,transparent 75%);animation:tegF .9s ease-in-out -.2s infinite alternate}
@keyframes tegF{0%{transform:scaleY(.9) scaleX(1.04) skewX(-3deg)}50%{transform:scaleY(1.08) scaleX(.95) skewX(2deg)}100%{transform:scaleY(.96) scaleX(1.02) skewX(-1deg)}}
.teg-fire b{position:absolute;bottom:20%;width:4px;height:4px;border-radius:50%;background:var(--c1);box-shadow:0 0 8px var(--c2);opacity:0;animation:tegSpark 3s linear infinite}
@keyframes tegSpark{0%{opacity:0;transform:translate(0,0)}10%{opacity:1}100%{opacity:0;transform:translate(calc(var(--s) * 30px),calc(var(--s) * -260px))}}
.teg-fire.teg-low{--s:.75}
.teg-fire.teg-flare{--s:1.05}
.teg-fire.teg-roar{--s:1.7;--c2:#ff9a2a;--c3:#d63a12}
.teg-fire.teg-settle{--s:.85;--c1:#fff8dc;--c2:#ffd27a;--c3:#e8a040}
.teg-fire.teg-dim{--s:.25;filter:brightness(.6)}
.teg-fire.teg-red{--s:1.6;--c1:#ffd0d0;--c2:#ff3a4a;--c3:#8e0a1a}
.teg-fire.teg-redflame{--s:1.75;--c1:#ffe0d8;--c2:#ff3b30;--c3:#a3101a}
.teg-fire.teg-green{--s:1.35;--c1:#eaffe8;--c2:#5dff7a;--c3:#138a3a}
.teg-light.teg-redflame{--lc:rgba(230,40,40,.62)}
.teg-light.teg-green{--lc:rgba(70,230,110,.5)}
.teg-slip.teg-pouch{font-family:var(--v-display);font-weight:900;font-size:clamp(12px,1.2vw,16px);letter-spacing:.2em;text-transform:uppercase;border-radius:40% 40% 14% 14%}
.teg-slip.teg-pouch[data-c="banish"]{color:#fff;background:linear-gradient(170deg,#e0353a,#8e1018);box-shadow:0 0 22px rgba(230,40,40,.8),0 8px 18px rgba(0,0,0,.7)}
.teg-slip.teg-pouch[data-c="end"]{color:#08260f;background:linear-gradient(170deg,#7dff9a,#2a9a4a);box-shadow:0 0 22px rgba(70,230,110,.8),0 8px 18px rgba(0,0,0,.7)}
.teg-fw{position:absolute;inset:0;z-index:45;pointer-events:none;overflow:hidden}
.teg-burst{position:absolute;width:2px;height:2px;animation:tegBurstGo 3.6s ease-out infinite}
.teg-burst i{position:absolute;left:0;top:0;width:5px;height:5px;margin:-2px;border-radius:50%;background:var(--c);box-shadow:0 0 10px var(--c),0 0 20px var(--c);
  transform:rotate(var(--a)) translateX(0);opacity:0;animation:inherit;animation-name:tegSpark2}
@keyframes tegBurstGo{0%{opacity:1}100%{opacity:1}}
@keyframes tegSpark2{0%{opacity:0;transform:rotate(var(--a)) translateX(0)}8%{opacity:1}70%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) translateX(clamp(60px,9vw,130px)) translateY(30px)}}
.teg-fire.teg-pale{--s:1.15;--c1:#ffffff;--c2:#fff1c8;--c3:#e8c270}
.teg-fire.teg-gold{--s:1.5;--c1:#fffbe6;--c2:#ffd760;--c3:#e8a020}
.teg-fire.teg-burst{animation:tegBurst 1.2s ease-out}
@keyframes tegBurst{0%{filter:brightness(2.2) saturate(1.4)}100%{filter:none}}
/* the people */
.teg-p{position:absolute;transform:translate(-50%,-50%);z-index:17;text-align:center;transition:filter .5s,transform .5s}
.teg-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#0b0e14;
  box-shadow:0 0 0 2px rgba(255,200,130,.45),0 0 26px rgba(255,140,50,.35),0 10px 22px rgba(0,0,0,.85)}
.teg-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;filter:sepia(.18) saturate(1.08)}
.teg-nm{display:inline-block;margin-top:4px;padding:2px 7px;white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:9.5px;
  letter-spacing:.14em;text-transform:uppercase;color:#f3e3c4;background:rgba(8,5,3,.78);border:1px solid rgba(255,190,110,.3)}
.teg-p.teg-quiet{filter:brightness(.55) saturate(.8)}
.teg-p.teg-speak{transform:translate(-50%,-50%) scale(1.18);z-index:30}
.teg-p.teg-speak .teg-av{box-shadow:0 0 0 2px #fff3d2,0 0 34px rgba(255,190,110,.7),0 10px 22px rgba(0,0,0,.85)}
.teg-p.teg-leave{animation:tegLeave 2.4s ease-in forwards}
@keyframes tegLeave{0%{opacity:1}30%{filter:grayscale(1) brightness(.7)}100%{opacity:0;transform:translate(-50%,-30%) scale(.6);filter:grayscale(1) brightness(.2)}}
.teg-role{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-7deg);z-index:5;white-space:nowrap;padding:2px 8px;
  font-family:var(--v-display);font-weight:900;font-size:clamp(9px,.9vw,12px);letter-spacing:.18em;text-transform:uppercase;border:2px solid currentColor;background:rgba(8,4,5,.85)}
.teg-p.teg-traitor .teg-role{color:#ff4a5a;text-shadow:0 0 12px rgba(201,40,60,.9)}
.teg-p.teg-traitor .teg-av{box-shadow:0 0 0 3px #c9283c,0 0 36px rgba(201,40,60,.85),0 10px 22px rgba(0,0,0,.85)}
.teg-p.teg-faithful .teg-role{color:#fff3d2;text-shadow:0 0 12px rgba(255,219,149,.8)}
.teg-p.teg-flip .teg-av{animation:tegFlip 1.1s cubic-bezier(.3,0,.2,1)}
@keyframes tegFlip{0%{transform:rotateY(0)}50%{transform:rotateY(90deg);filter:brightness(2.5)}100%{transform:rotateY(0)}}
.teg-p.teg-flip .teg-role{animation:tegStamp .5s cubic-bezier(.2,1.6,.4,1) .7s both}
@keyframes tegStamp{from{opacity:0;transform:translate(-50%,-50%) rotate(-7deg) scale(3);filter:blur(5px)}}
.teg-p.teg-take{z-index:25}
.teg-p.teg-take .teg-av{box-shadow:0 0 0 3px #f3c867,0 0 40px rgba(255,210,100,.95),0 10px 22px rgba(0,0,0,.85)}
.teg-p.teg-lose{filter:grayscale(.7) brightness(.55)}
/* a word, held up over a head */
.teg-slip{position:absolute;left:50%;bottom:112%;transform:translateX(-50%) rotate(-4deg);z-index:6;white-space:nowrap;padding:6px 12px;
  font-family:'Caveat',var(--v-hand),cursive;font-weight:700;font-size:clamp(16px,1.6vw,22px);color:#3a1a10;
  background:linear-gradient(170deg,#f3e8cc,#d8c69e);box-shadow:0 8px 18px rgba(0,0,0,.7)}
.teg-slip[data-c="banish"]{color:#8e1526}
.teg-slip[data-c="sealed"]{color:transparent;background:linear-gradient(170deg,#d8c69e,#b9a57a)}
.teg-slip[data-c="sealed"]::after{content:"";position:absolute;left:50%;top:50%;width:16px;height:16px;margin:-8px;border-radius:50%;background:#8e1526}
.teg-slip.teg-unfold{animation:tegUnfold .6s cubic-bezier(.2,1.3,.4,1) both}
@keyframes tegUnfold{from{opacity:0;transform:translateX(-50%) rotate(-4deg) scaleY(.1) translateY(20px)}}
.teg-throw{position:absolute;z-index:16;width:14px;height:10px;margin:-5px -7px;background:#efe3c4;box-shadow:0 0 6px rgba(255,220,160,.8);opacity:0;
  animation:tegThrow 1.2s cubic-bezier(.4,0,.6,1) forwards}
@keyframes tegThrow{0%{opacity:1;transform:translate(0,0) rotate(0)}60%{opacity:1;transform:translate(calc(var(--dx) * .6),calc(var(--dy) * .6 - 60px)) rotate(200deg)}
  100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(400deg) scale(.4);background:#ff8a2a}}
/* the held breath */
.teg-dark{position:absolute;inset:0;z-index:20;pointer-events:none;background:radial-gradient(40% 40% at 50% 80%,rgba(0,0,0,.2),rgba(0,0,0,.82));animation:tegDark 1.4s ease both}
@keyframes tegDark{from{opacity:0}}
/* the box */
.teg-boxlight{position:absolute;z-index:18;width:2px;height:2px;pointer-events:none;box-shadow:0 0 120px 60px rgba(255,214,110,.85),0 0 260px 140px rgba(255,190,80,.45)}
.teg-boxlight::before{content:"";position:absolute;left:-60px;bottom:0;width:120px;height:520px;background:linear-gradient(0deg,rgba(255,220,130,.75),transparent);
  clip-path:polygon(35% 100%,65% 100%,100% 0,0 0);filter:blur(6px)}
.teg-boxlight.teg-open{animation:tegOpen 1.6s ease-out both}
@keyframes tegOpen{from{opacity:0;transform:scale(.2)}}
.teg-gold{position:absolute;inset:0;z-index:40;pointer-events:none;overflow:hidden}
.teg-gold i{position:absolute;top:-6%;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff6c8,#e8b440 55%,#8a5a12);
  box-shadow:0 0 10px rgba(255,214,110,.8);animation:tegCoin 2.6s cubic-bezier(.4,0,.8,1) both}
@keyframes tegCoin{from{transform:translateY(0) rotateX(0)}to{transform:translateY(118vh) rotateX(1080deg)}}
.teg-pot{position:absolute;right:16px;top:14px;z-index:100;text-align:right;padding:8px 14px;background:rgba(6,4,2,.82);box-shadow:0 0 0 1px rgba(255,200,110,.4),0 0 40px rgba(255,190,80,.3)}
.teg-pot span{display:block;font-family:var(--v-display);font-weight:700;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#e8c270}
.teg-pot b{display:block;font-family:var(--v-display);font-weight:900;font-size:clamp(22px,2.6vw,36px);color:#ffe7a8;text-shadow:0 0 20px rgba(255,200,90,.6)}
.teg-pot em{font-family:var(--v-hand);font-size:12px;color:#d8c69e}
.teg-title{position:absolute;inset:0;z-index:3500;display:grid;place-items:center;pointer-events:none;animation:tegTitle 3.2s ease both}
.teg-title::before{content:attr(data-a);grid-area:1/1;transform:translateY(-18%);font-family:var(--v-display);font-weight:900;font-size:clamp(46px,8vw,120px);
  letter-spacing:.16em;text-transform:uppercase;color:#ffe7b8;text-shadow:0 0 50px rgba(255,140,40,.8),0 8px 0 rgba(0,0,0,.6)}
.teg-title::after{content:attr(data-b);grid-area:1/1;transform:translateY(170%);font-family:var(--v-display);font-weight:700;font-size:13px;letter-spacing:.6em;text-transform:uppercase;color:#ffb340}
@keyframes tegTitle{0%{opacity:0;transform:scale(1.6);filter:blur(12px)}14%{opacity:1;transform:none;filter:none}72%{opacity:1}100%{opacity:0;transform:scale(.96)}}
@media (prefers-reduced-motion:reduce){.teg-world,.teg-fire i,.teg-fire b,.teg-light,.teg-p,.teg-slip,.teg-throw,.teg-dark,.teg-boxlight,.teg-gold i,.teg-title{animation:none!important}}
`;
