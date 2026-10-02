// ══════════════════════════════════════════════════════════════════════
// vp-tr/armoury-stage.js — the Armoury, played in the undercroft
// ══════════════════════════════════════════════════════════════════════
//
// The Armoury (armoury.js) had a drawn page and no stage (the user,
// 2026-10-02: "the armoury i guess too"). This plays the page in its room, a
// painted render (tools/blender/traitors-armoury.py): a vaulted cellar and an
// oak press of twelve numbered doors. The entrants wait at the foot of the
// stair; each walks to the door the page says they opened, and the door opens
// on what this layer is allowed to see — a shield, an empty niche, or (for a
// player who was not that entrant) a door that stays shut and only glows.
//
// The press renders three times from one camera (doors shut, doors gone,
// shields in), so opening ONE door is showing that door's rectangle of a
// different plate. The words are read out of the page's own markup, so the
// stage says exactly what the page says and keeps every gate it keeps.
//
// Like every other file in this directory it imports no engine state.
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face } from './castle-stage.js';
import { footCard, playCard, CARD_CSS } from './stage-cards.js';
import { trPlay } from './sfx.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const clean = x => String(x || '').replace(/\s+/g, ' ').trim();
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// THE ROOM (traitors-armoury.py `measure()`), as fractions of the render:
// each door's box [x0, y0, x1, y1] (lower row first, then the upper), and
// where somebody stands in front of each of the six columns.
const PLATE = 'assets/sets/traitors/armoury.webp';
const PLATE_OPEN = 'assets/sets/traitors/armoury-open.webp';
const PLATE_SHIELD = 'assets/sets/traitors/armoury-shield.webp';
const AM = {
  doors: [[0.2245, 0.4864, 0.304, 0.6641], [0.319, 0.4864, 0.398, 0.6641], [0.4135, 0.4864, 0.492, 0.6641],
    [0.508, 0.4864, 0.586, 0.6641], [0.6026, 0.4864, 0.68, 0.6641], [0.6971, 0.4864, 0.7741, 0.6641],
    [0.2227, 0.2669, 0.3027, 0.447], [0.3178, 0.2669, 0.3973, 0.447], [0.413, 0.2669, 0.4919, 0.447],
    [0.5081, 0.2669, 0.5866, 0.447], [0.6032, 0.2669, 0.6812, 0.447], [0.6984, 0.2669, 0.7758, 0.447]],
  stand: [[0.2223, 0.8185, 0.4612], [0.3334, 0.8185, 0.4612], [0.4445, 0.8185, 0.4612],
    [0.5555, 0.8185, 0.4612], [0.6666, 0.8185, 0.4612], [0.7777, 0.8185, 0.4612]],
};
// I-VI along the top row, VII-XII along the bottom: the box for a numeral
const doorOf = numeral => { const k = Math.max(0, NUMERALS.indexOf(numeral)); return k < 6 ? 6 + k : k - 6; };
function box(W, H) {
  const k = Math.max(W / 1920, H / 1080), dw = 1920 * k, dh = 1080 * k, ox = (W - dw) / 2, oy = (H - dh) / 2;
  return { ox, oy, dw, dh, x: f => ox + f * dw, y: f => oy + f * dh };
}

/** The page, read back: who went up, in what order, to which door, and what this layer saw. */
function readPage(html) {
  if (typeof document === 'undefined') return null;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const q = (sel, root = tpl.content) => root.querySelector(sel);
  const turns = [...tpl.content.querySelectorAll('.am-step')].filter(n => q('.am-turn', n)).map(n => {
    const ord = clean(q('.am-turn-ord', n)?.textContent);
    const out = q('.am-turn-out', n);
    const said = clean(out?.textContent);
    return {
      name: clean(q('.am-turn-nm', n)?.textContent),
      numeral: (/door ([IVX]+)/.exec(ord) || [])[1] || 'I',
      ord,
      // a find this layer is entitled to, nothing this layer saw, or nothing it may know
      seen: said === 'Shield' ? 'shield' : said === 'Nothing' ? 'empty' : 'unknown',
      approach: clean(q('.am-beat:not(.am-beat-2)', n)?.textContent),
      after: clean(q('.am-beat-2', n)?.textContent),
    };
  });
  if (!turns.length) return null;
  return {
    turns,
    intro: clean(q('.am-sub')?.textContent),
    earned: clean(q('.am-earned-p')?.textContent),
    silenceH: clean(q('.am-silence-h')?.textContent),
    silence: clean(q('.am-silence-p')?.textContent),
    note: clean(q('.am-note')?.textContent),
    truthTag: clean(q('.am-truth-tag')?.textContent),
    truth: clean(q('.am-truth-txt')?.textContent),
  };
}

export function armouryStageScreen(ep, observer, pageHtml) {
  if (!(ep && ep.tr && ep.tr.armoury && (ep.tr.armoury.entrants || []).length) || !pageHtml) return pageHtml;
  const init = () => {
    const d = readPage(pageHtml);
    if (!d) return { steps: [] };
    const steps = [];
    if (d.intro) steps.push({ t: 'narr', tag: 'The Armoury', text: d.intro, meta: { kind: 'intro' } });
    if (d.earned) steps.push({ t: 'narr', tag: 'Who earned it', text: d.earned, meta: { kind: 'queue' } });
    d.turns.forEach((tn, i) => {
      steps.push({ t: 'narr', tag: tn.name + ' · door ' + tn.numeral, text: tn.approach, meta: { kind: 'go', i } });
      steps.push({ t: 'narr', tag: tn.seen === 'shield' ? 'A shield' : tn.seen === 'empty' ? 'Nothing' : 'Says nothing',
        text: tn.after, meta: { kind: 'open', i } });
    });
    if (d.silence) steps.push({ t: 'narr', tag: d.silenceH || 'On the way out', text: d.silence, meta: { kind: 'out' } });
    if (d.note) steps.push({ t: 'narr', tag: 'The rule', text: d.note, meta: { kind: 'out' } });
    if (d.truth) steps.push({ t: 'narr', tag: d.truthTag || 'Audience only', text: d.truth, aud: true, meta: { kind: 'out' } });
    steps.forEach((s, k) => { s.beat = k; s.kind = s.meta.kind; });
    return { data: d, steps };
  };
  const uid = 'tam-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: 'The Armoury',
    day: (ep.tr && ep.tr.ep) || ep.num, pot: ep.tr && ep.tr.pot, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="tam"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CSS), pageHtml);
}

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.tam');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const D = S.data, b = box(W, H), n = D.turns.length;
  root.querySelectorAll('.trs-seg').forEach(s => {
    s.classList.toggle('trs-done', S.idx >= 0 && ['breakfast', 'morning'].includes(s.dataset.k));
    s.classList.toggle('trs-now', S.idx >= 0 && s.dataset.k === 'mission');
  });
  const start = root.querySelector('.trs-start');
  const st = S.idx >= 0 ? S.steps[S.idx] : null;
  const m = (st && st.meta) || {};
  // whose turn it is, and which doors have been opened so far
  let cur = -1, opened = new Set(), out = false;
  for (let k = 0; k <= S.idx; k++) {
    const mm = S.steps[k].meta || {};
    if (mm.kind === 'go') cur = mm.i;
    if (mm.kind === 'open') { cur = mm.i; opened.add(mm.i); }
    if (mm.kind === 'out') { out = true; cur = -1; }
  }
  let h = '<div class="tam-world"><img class="tam-plate" src="' + PLATE + '" alt="" draggable="false">';
  // THE DOORS THAT HAVE BEEN OPENED: that door's rectangle of the open plate
  D.turns.forEach((tn, i) => {
    if (!opened.has(i)) return;
    const r = AM.doors[doorOf(tn.numeral)];
    const x = b.x(r[0]), y = b.y(r[1]), w = (r[2] - r[0]) * b.dw, hh = (r[3] - r[1]) * b.dh;
    if (tn.seen === 'unknown') {
      h += `<div class="tam-shut" style="left:${x}px;top:${y}px;width:${w}px;height:${hh}px"></div>`;
      return;
    }
    const src = tn.seen === 'shield' ? PLATE_SHIELD : PLATE_OPEN;
    const fr = fresh && m.kind === 'open' && m.i === i;
    h += `<div class="tam-open${fr ? ' tam-swing' : ''}${tn.seen === 'shield' ? ' tam-found' : ''}" style="left:${x}px;top:${y}px;width:${w}px;height:${hh}px;`
      + `background-image:url(${src});background-size:${b.dw}px ${b.dh}px;background-position:${-(x - b.ox)}px ${-(y - b.oy)}px"></div>`;
  });
  // THE NUMERALS on the brass plates
  NUMERALS.forEach(nm => {
    const r = AM.doors[doorOf(nm)];
    h += `<span class="tam-num" style="left:${b.x((r[0] + r[2]) / 2)}px;top:${b.y(r[1]) + (r[3] - r[1]) * b.dh * .06}px">${nm}</span>`;
  });
  // THE PEOPLE: waiting at the stair (left), the one whose turn it is in front
  // of their door, and the ones who have been, back by the right-hand wall
  const pw = (AM.stand[0][1] - AM.stand[0][2]) * b.dh * .2;
  const person = (name, x, y, cls) => `<div class="tam-p ${cls}" style="left:${x}px;top:${y}px;width:${pw}px">`
    + `<div class="tam-av">${face(name)}</div><div class="tam-nm">${esc(name)}</div></div>`;
  let waitK = 0, doneK = 0;
  D.turns.forEach((tn, i) => {
    if (i === cur && !out) {
      const col = doorOf(tn.numeral) % 6, s = AM.stand[col];
      // at the foot of the press, below the doors, so the one they open stays in view
      h += person(tn.name, b.x(s[0]), b.y(s[2] + (s[1] - s[2]) * .8), 'tam-up' + (fresh && m.kind === 'go' && m.i === i ? ' tam-walk' : ''));
    } else if (out || i < cur) {
      h += person(tn.name, b.x(.93 - doneK * .075), b.y(.62), 'tam-done');
      doneK++;
    } else {
      h += person(tn.name, b.x(.07 + waitK * .075), b.y(.62), 'tam-wait');
      waitK++;
    }
  });
  h += '</div>';
  if (S.idx === 0 && fresh) h += `<div class="tam-title" data-a="The Armoury" data-b="${n} turns · ${esc('Night ' + S.day)}"></div>`;
  if (!st) {
    el.innerHTML = h;
    start.innerHTML = `<b>The Armoury</b><span>${n} at the foot of the stair · press Next, or click the room</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  h += footCard(st, { name: '', slug: null });
  el.innerHTML = h;
  playCard(el, st, S, fresh);
  // THE CAMERA: in on the press while a door is being opened
  const world = el.querySelector('.tam-world');
  let cam = 'translate(0px,0px) scale(1)';
  if ((m.kind === 'go' || m.kind === 'open') && cur >= 0) {
    const r = AM.doors[doorOf(D.turns[cur].numeral)], cx = b.x((r[0] + r[2]) / 2), cy = b.y((r[1] + r[3]) / 2);
    const k = 1.3, tx = Math.min(0, Math.max(W - W * k, W / 2 - cx * k)), ty = Math.min(0, Math.max(H - H * k, H * .4 - cy * k));
    cam = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k})`;
  }
  world.style.setProperty('--cam', cam);
  world.style.setProperty('--cam0', fresh ? (S.cam || cam) : cam);
  if (fresh) world.classList.add('tam-move');
  S.cam = cam;
  if (fresh) {
    if (m.kind === 'go') trPlay('tr-footsteps');
    else if (m.kind === 'open') trPlay(D.turns[m.i].seen === 'shield' ? 'tr-clang' : 'tr-door');
  }
  const corner = root.querySelector('.trs-corner');
  corner.innerHTML = `The undercroft · <b>${out ? 'On the way out' : cur >= 0 ? esc(D.turns[cur].name) + ' · door ' + esc(D.turns[cur].numeral) : 'The foot of the stair'}</b>`;
  corner.classList.add('trs-in');
}

const CSS = `
.tam{position:absolute;inset:0;overflow:hidden;background:#06070a}
.tam-world{position:absolute;inset:0;transform-origin:0 0;transform:var(--cam)}
.tam-world.tam-move{animation:tamCam 1.2s cubic-bezier(.6,0,.2,1) both}
@keyframes tamCam{from{transform:var(--cam0)}to{transform:var(--cam)}}
.tam-plate{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none}
.tam-open{position:absolute;z-index:5;background-repeat:no-repeat}
.tam-open.tam-swing{animation:tamSwing 1.1s cubic-bezier(.3,0,.2,1) .2s both}
@keyframes tamSwing{from{clip-path:inset(0 0 0 100%)}to{clip-path:inset(0 0 0 0)}}
.tam-open.tam-found{box-shadow:0 0 34px 8px rgba(255,190,110,.55);animation:tamSwing 1.1s cubic-bezier(.3,0,.2,1) .2s both,tamGlow 2.4s ease-in-out 1.3s infinite}
@keyframes tamGlow{50%{box-shadow:0 0 54px 14px rgba(255,200,120,.75)}}
.tam-shut{position:absolute;z-index:5;box-shadow:inset 0 0 0 2px rgba(216,180,106,.65),0 0 26px rgba(216,180,106,.4);animation:tamShut 2s ease-in-out infinite}
@keyframes tamShut{50%{box-shadow:inset 0 0 0 2px rgba(216,180,106,.25),0 0 10px rgba(216,180,106,.15)}}
.tam-num{position:absolute;z-index:6;transform:translateX(-50%);font-family:var(--v-display);font-weight:900;font-size:clamp(8px,.75vw,11px);letter-spacing:.08em;
  color:#3a2208;text-shadow:0 1px 0 rgba(255,230,170,.5);pointer-events:none}
.tam-p{position:absolute;transform:translate(-50%,-50%);z-index:20;text-align:center;transition:filter .5s}
.tam-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#0b0e14;
  box-shadow:0 0 0 2px rgba(216,180,106,.5),0 10px 22px rgba(0,0,0,.85)}
.tam-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%}
.tam-nm{display:inline-block;margin-top:4px;padding:2px 7px;white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:9.5px;
  letter-spacing:.14em;text-transform:uppercase;color:#ded6c4;background:rgba(4,5,7,.78);border:1px solid rgba(216,180,106,.25)}
.tam-p.tam-wait,.tam-p.tam-done{filter:brightness(.6) saturate(.8)}
.tam-p.tam-up{z-index:30;filter:drop-shadow(0 0 22px rgba(255,214,150,.5))}
.tam-p.tam-up .tam-av{box-shadow:0 0 0 2px #fff3d2,0 0 30px rgba(255,214,150,.5),0 10px 22px rgba(0,0,0,.85)}
.tam-p.tam-walk{animation:tamWalk 1.2s cubic-bezier(.3,0,.2,1) both}
@keyframes tamWalk{from{opacity:0;transform:translate(-160%,-30%) scale(.8)}to{opacity:1}}
.tam-title{position:absolute;inset:0;z-index:3500;display:grid;place-items:center;pointer-events:none;animation:tamTitle 2.8s ease both}
.tam-title::before{content:attr(data-a);grid-area:1/1;transform:translateY(-18%);font-family:var(--v-display);font-weight:900;font-size:clamp(40px,7vw,100px);
  letter-spacing:.14em;text-transform:uppercase;color:#f3e3c4;text-shadow:0 0 40px rgba(216,180,106,.6),0 8px 0 rgba(0,0,0,.6)}
.tam-title::after{content:attr(data-b);grid-area:1/1;transform:translateY(160%);font-family:var(--v-display);font-weight:700;font-size:13px;letter-spacing:.5em;text-transform:uppercase;color:#d8b46a}
@keyframes tamTitle{0%{opacity:0;transform:scale(1.6);filter:blur(10px)}14%{opacity:1;transform:none;filter:none}70%{opacity:1}100%{opacity:0;transform:scale(.96)}}
@media (prefers-reduced-motion:reduce){.tam-world,.tam-open,.tam-shut,.tam-p,.tam-title{animation:none!important}}
`;
