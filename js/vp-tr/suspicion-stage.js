// ══════════════════════════════════════════════════════════════════════
// vp-tr/suspicion-stage.js — the voting plans, played on the portrait wall
// ══════════════════════════════════════════════════════════════════════
//
// The castle hangs a portrait of everybody in it, and the programme uses that
// wall: a face in a gilt frame is the unit the audience thinks in. So this
// stage IS the wall. Every living player hangs in a frame; the page's plans
// shoot out as red string, one Faithful after another, each pinned into the
// face they mean to send to the table, and the faces that collect string start
// to burn. Then the page's own beats play over it: each name the castle
// suspects is lit and brought forward, and on the last line of its card the
// truth is stamped across the frame; each head the page opens throws its own
// reads out as thread; the Traitors, when the page says what they know, are
// linked to each other in blood; and at the gap every string turns gold where
// it found a Traitor and goes dead where it did not.
//
// The words are the page's. A player layer gets their own lean, their own
// board and no truth, exactly as the page does.
//
// Like every other file in this directory it imports no engine state.
import { suspicionStageData } from './suspicion.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face } from './castle-stage.js';
import { TRScenery } from './cutaway-scenery.js';
import { beatLines } from './stage-lines.js';
import { footCard, playCard, CARD_CSS } from './stage-cards.js';
import { trPlay } from './sfx.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const clean = x => String(x || '').replace(/\s+/g, ' ').trim();
const SKIP = new Set(['sums', 'sum', 'weigh', 'rows', 'row', 'meter', 'wall-wrap']);

export function suspicionStageScreen(ep, observer, pageHtml) {
  if (!(ep && ep.tr && ep.tr.beliefs)) return pageHtml;
  const init = () => {
    const data = suspicionStageData(ep, observer);
    if (!data) return { steps: [] };
    // the page's sn-said paragraphs are narration, not quotes
    const steps = beatLines(data.beats, (n, part) => (SKIP.has(part) ? []
      : part === 'said' ? (clean(n.textContent) ? [{ t: 'narr', text: clean(n.textContent) }] : []) : null));
    return { data, steps };
  };
  const uid = 'trv-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: 'Voting Plans',
    day: (ep.tr && ep.tr.ep) || ep.num, pot: ep.tr && ep.tr.pot, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="trv"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CSS), pageHtml);
}

// THE WALL: one, two or three rows of frames, centred, above the foot card
function layout(n, W, H) {
  const rows = n <= 8 ? 1 : n <= 16 ? 2 : 3;
  const cols = Math.ceil(n / rows);
  const fw = Math.min(W * .84 / cols * .74, (H * .64 / rows) * .62);
  const top = H * .1, band = H * .64 / rows;
  return (i) => {
    const r = Math.floor(i / cols), inRow = r < rows - 1 ? cols : n - cols * (rows - 1);
    const c = i - r * cols;
    const x = W / 2 + (c - (inRow - 1) / 2) * (W * .84 / cols);
    return { x, y: top + band * (r + .45), w: fw };
  };
}

// What the page has reached at step idx.
function stateAt(S) {
  const r = { plans: false, plansAt: -1, focus: null, stamped: new Set(), read: null, wall: false, gap: false };
  for (let k = 0; k <= S.idx; k++) {
    const st = S.steps[k], m = st.meta || {};
    const lastOfBeat = (S.steps[k + 1] || {}).beat !== st.beat;
    if (m.kind === 'plans' && !r.plans) { r.plans = true; r.plansAt = k; }
    r.focus = m.kind === 'name' ? m.name : null;
    r.read = m.kind === 'read' ? m.name : null;
    if (m.kind === 'name' && lastOfBeat && m.truth) r.stamped.add(m.name);
    if (m.kind === 'wall') r.wall = true;
    if (m.kind === 'gap') r.gap = true;
  }
  return r;
}

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.trv');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const D = S.data, n = D.living.length, at = layout(n, W, H);
  root.querySelectorAll('.trs-seg').forEach(s => {
    s.classList.toggle('trs-done', S.idx >= 0 && ['breakfast', 'morning', 'mission'].includes(s.dataset.k));
    s.classList.toggle('trs-now', S.idx >= 0 && s.dataset.k === 'evening');
  });
  const start = root.querySelector('.trs-start');
  const st = S.idx >= 0 ? S.steps[S.idx] : null;
  const r = st ? stateAt(S) : { plans: false, stamped: new Set() };
  const m = (st && st.meta) || {};
  const firstOfBeat = st && (S.steps[S.idx - 1] || {}).beat !== st.beat;
  const pos = name => { const i = D.living.indexOf(name); return i < 0 ? null : at(i); };
  // how much string each face is holding
  const heat = {};
  if (r.plans) for (const p of D.plans) heat[p.target] = (heat[p.target] || 0) + 1;
  const hot = Math.max(1, ...Object.values(heat));
  const truth = D.truth || {};
  let h = '<div class="trv-world">' + TRScenery.room('hall', W, H, true) + '<div class="trv-shade"></div>';
  // THE STRING
  const drawPlans = r.plans && fresh && S.idx === r.plansAt;
  let strings = '';
  if (r.plans) D.plans.forEach((p, i) => {
    const a = pos(p.observer), b = pos(p.target);
    if (!a || !b) return;
    const x1 = a.x, y1 = a.y + a.w * .62, x2 = b.x, y2 = b.y;
    const sag = Math.min(90, Math.abs(x2 - x1) * .18 + 24);
    const cls = ['trv-str', drawPlans ? 'trv-draw' : '',
      r.gap ? (truth[p.target] === 'traitor' ? 'trv-hit' : 'trv-miss') : '',
      r.focus && p.target !== r.focus ? 'trv-faint' : '', r.focus === p.target ? 'trv-lit' : ''].join(' ');
    strings += `<path class="${cls}" pathLength="100" style="--d:${(.6 + i * .32).toFixed(2)}s" d="M${x1},${y1} Q${(x1 + x2) / 2},${Math.max(y1, y2) + sag} ${x2},${y2}"/>`
      + `<circle class="trv-pin${drawPlans ? ' trv-draw' : ''}" style="--d:${(.6 + i * .32 + .4).toFixed(2)}s" cx="${x2}" cy="${y2}" r="4"/>`;
  });
  // one head's reads, thrown out as amber thread
  if (r.read && D.reads[r.read]) D.reads[r.read].forEach((t, i) => {
    const a = pos(r.read), b = pos(t);
    if (!a || !b) return;
    strings += `<path class="trv-read${fresh && firstOfBeat ? ' trv-draw' : ''}" pathLength="100" style="--d:${(.3 + i * .25).toFixed(2)}s;--w:${4 - i * .7}px" `
      + `d="M${a.x},${a.y} Q${(a.x + b.x) / 2},${Math.min(a.y, b.y) - 60} ${b.x},${b.y}"/>`;
  });
  // the pact, linked in blood
  if (r.wall && D.traitors.length > 1) {
    for (let i = 0; i < D.traitors.length; i++) {
      const a = pos(D.traitors[i]), b = pos(D.traitors[(i + 1) % D.traitors.length]);
      if (!a || !b || (D.traitors.length === 2 && i === 1)) continue;
      strings += `<path class="trv-blood${fresh && m.kind === 'wall' && firstOfBeat ? ' trv-draw' : ''}" pathLength="100" style="--d:${(.4 + i * .4).toFixed(2)}s" `
        + `d="M${a.x},${a.y} Q${(a.x + b.x) / 2},${(a.y + b.y) / 2 - 80} ${b.x},${b.y}"/>`;
    }
  }
  // THE FRAMES
  let frames = '';
  D.living.forEach((name, i) => {
    const p = at(i), ht = heat[name] || 0;
    const cls = ['trv-f', r.focus === name || r.read === name ? 'trv-on' : ((r.focus || r.read) ? 'trv-off' : ''),
      r.wall && D.traitors.includes(name) ? 'trv-pact' : '',
      r.stamped.has(name) ? (truth[name] === 'traitor' ? 'trv-isT' : 'trv-isF') : '',
      fresh && r.focus === name && (S.steps[S.idx + 1] || {}).beat !== st.beat && m.truth ? 'trv-stamp' : '',
      D.watcher === name ? 'trv-me' : ''].join(' ');
    frames += `<div class="${cls}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;--heat:${(ht / hot).toFixed(2)};z-index:${r.focus === name ? 60 : 10}"`
      + (ht ? ` data-h="${ht}"` : '') + `>`
      + `<div class="trv-pic">${face(name)}</div><div class="trv-nm" data-n="${esc(name)}"></div>`
      + (r.stamped.has(name) ? `<i class="trv-mark" data-w="${truth[name] === 'traitor' ? 'Traitor' : 'Faithful'}"></i>` : '')
      + '</div>';
  });
  h += `<svg class="trv-strings" viewBox="0 0 ${W} ${H}">${strings}</svg>` + frames + '</div>';
  if (S.idx === 0 && fresh) h += `<div class="trv-title" data-a="Voting Plans" data-b="Day ${esc(S.day)}"></div>`;
  if (!st) {
    el.innerHTML = h;
    start.innerHTML = `<b>Voting Plans</b><span>${n} faces on the wall · press Next, or click the wall</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  h += footCard(st, { name: '', slug: null });
  el.innerHTML = h;
  playCard(el, st, S, fresh);
  // THE CAMERA: forward onto the lit face, back for the wall
  const world = el.querySelector('.trv-world');
  const fp = pos(r.focus || r.read);
  let cam = 'translate(0px,0px) scale(1)';
  if (fp) {
    const k = 1.35;
    const tx = Math.min(0, Math.max(W - W * k, W / 2 - fp.x * k)), ty = Math.min(0, Math.max(H - H * k, H * .38 - fp.y * k));
    cam = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k})`;
  }
  world.style.setProperty('--cam', cam);
  world.style.setProperty('--cam0', fresh ? (S.cam || cam) : cam);
  if (fresh) world.classList.add('trv-move');
  S.cam = cam;
  // THE SOUND OF IT
  if (fresh) {
    if (drawPlans) D.plans.forEach((_, i) => trPlay('tr-tap', 1000 + i * 320));
    else if (m.kind === 'name' && firstOfBeat) trPlay('tr-footsteps');
    else if (m.kind === 'wall' && firstOfBeat) trPlay('tr-heartbeat', 300);
    if (el.querySelector('.trv-stamp')) trPlay(truth[r.focus] === 'traitor' ? 'tr-clang' : 'tr-slate', 350);
  }
  const corner = root.querySelector('.trs-corner');
  corner.innerHTML = `The portrait wall · <b>${r.gap ? 'Hits and misses' : r.wall ? 'The pact' : r.read ? 'Inside one head' : r.focus ? 'A name' : r.plans ? 'Who means to move' : 'Before the table'}</b>`;
  corner.classList.add('trs-in');
}

const CSS = `
.trv{position:absolute;inset:0;overflow:hidden;background:#07090c}
.trv-world{position:absolute;inset:0;transform-origin:0 0;transform:var(--cam)}
.trv-world.trv-move{animation:trvCam 1.1s cubic-bezier(.6,0,.2,1) both}
@keyframes trvCam{from{transform:var(--cam0)}to{transform:var(--cam)}}
.trv-shade{position:absolute;inset:0;background:radial-gradient(70% 70% at 50% 40%,rgba(8,6,8,.35),rgba(4,3,4,.85))}
.trv-strings{position:absolute;inset:0;width:100%;height:100%;overflow:visible;z-index:20;pointer-events:none}
.trv-str{fill:none;stroke:#d8283a;stroke-width:2.6;stroke-linecap:round;filter:drop-shadow(0 2px 3px rgba(0,0,0,.8));stroke-dasharray:100;stroke-dashoffset:0;transition:opacity .5s,stroke .6s}
.trv-str.trv-draw{stroke-dashoffset:100;animation:trvDraw .55s cubic-bezier(.5,0,.3,1) var(--d) forwards}
@keyframes trvDraw{to{stroke-dashoffset:0}}
.trv-str.trv-faint{opacity:.15}
.trv-str.trv-lit{stroke:#ff5a68;stroke-width:3.4;filter:drop-shadow(0 0 6px rgba(255,60,80,.9))}
.trv-str.trv-hit{stroke:#f3c867;filter:drop-shadow(0 0 6px rgba(243,200,103,.9))}
.trv-str.trv-miss{stroke:#5a5a62;opacity:.5}
.trv-pin{fill:#f3dcd8;stroke:#8e1526;stroke-width:1.5}
.trv-pin.trv-draw{opacity:0;animation:trvPin .25s ease var(--d) forwards}
@keyframes trvPin{from{opacity:0;transform:scale(3);transform-box:fill-box;transform-origin:center}to{opacity:1}}
.trv-read{fill:none;stroke:#e0a049;stroke-width:var(--w);stroke-linecap:round;stroke-dasharray:4 5;filter:drop-shadow(0 0 5px rgba(224,160,73,.8))}
.trv-read.trv-draw{stroke-dasharray:100;stroke-dashoffset:100;animation:trvDraw .6s ease var(--d) forwards}
.trv-blood{fill:none;stroke:#8e1526;stroke-width:5;stroke-linecap:round;filter:drop-shadow(0 0 10px rgba(201,40,60,.9));stroke-dasharray:100}
.trv-blood.trv-draw{stroke-dashoffset:100;animation:trvDraw .9s ease var(--d) forwards}
.trv-f{position:absolute;transform:translate(-50%,-50%);text-align:center;transition:filter .5s,transform .5s}
.trv-pic{position:relative;aspect-ratio:3/4;overflow:hidden;background:#141922;border:7px solid transparent;
  border-image:linear-gradient(135deg,#f3d58a,#9a6a22 30%,#f7e2a6 50%,#8a5a18 72%,#e8c270) 1;
  box-shadow:0 0 0 1px #3a2208,0 14px 30px rgba(0,0,0,.85),0 0 calc(var(--heat) * 44px) calc(var(--heat) * 8px) rgba(220,40,60,calc(var(--heat) * .85))}
.trv-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 16%;z-index:1}
.trv-pic .trs-ini{font-size:18px}
.trv-f[data-h]::after{content:attr(data-h);position:absolute;right:-8px;top:-8px;z-index:5;min-width:22px;height:22px;padding:0 5px;border-radius:11px;
  font-family:var(--v-display);font-weight:900;font-size:12px;line-height:22px;color:#fff;background:#c9283c;box-shadow:0 0 12px rgba(201,40,60,.8)}
.trv-nm::before{content:attr(data-n);display:inline-block;margin-top:5px;padding:2px 7px;white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:9.5px;
  letter-spacing:.14em;text-transform:uppercase;color:#241b11;background:linear-gradient(180deg,#f7e2a6,#c99a48)}
.trv-f.trv-off{filter:brightness(.4) saturate(.6)}
.trv-f.trv-on{transform:translate(-50%,-50%) scale(1.25);filter:drop-shadow(0 0 30px rgba(255,220,160,.5))}
.trv-f.trv-me .trv-pic{box-shadow:0 0 0 3px #ffdb95,0 14px 30px rgba(0,0,0,.85)}
.trv-f.trv-pact .trv-pic{box-shadow:0 0 0 3px #c9283c,0 0 30px rgba(201,40,60,.8),0 14px 30px rgba(0,0,0,.85)}
.trv-f.trv-isT .trv-pic img{filter:sepia(.4) saturate(1.3) hue-rotate(-20deg)}
.trv-f.trv-isF .trv-pic img{filter:grayscale(.2)}
.trv-mark{position:absolute;left:50%;top:74%;z-index:6;transform:translate(-50%,-50%) rotate(-8deg)}
.trv-mark::before{content:attr(data-w);display:block;padding:3px 9px;white-space:nowrap;font-family:var(--v-display);font-weight:900;font-size:clamp(9px,.95vw,13px);
  letter-spacing:.18em;text-transform:uppercase;border:2px solid currentColor;background:rgba(8,4,5,.82)}
.trv-f.trv-isT .trv-mark,.trv-f .trv-mark[data-w="Traitor"]{color:#ff4a5a;text-shadow:0 0 12px rgba(201,40,60,.9)}
.trv-f .trv-mark[data-w="Faithful"]{color:#fff3d2;text-shadow:0 0 12px rgba(255,219,149,.8)}
.trv-f.trv-stamp .trv-mark{animation:trvStamp .5s cubic-bezier(.2,1.6,.4,1) 1.2s both}
@keyframes trvStamp{from{opacity:0;transform:translate(-50%,-50%) rotate(-8deg) scale(3);filter:blur(6px)}to{opacity:1;transform:translate(-50%,-50%) rotate(-8deg);filter:none}}
.trv-title{position:absolute;inset:0;z-index:3500;display:grid;place-items:center;pointer-events:none;animation:trvTitle 2.6s ease both}
.trv-title::before{content:attr(data-a);grid-area:1/1;transform:translateY(-18%);font-family:var(--v-display);font-weight:900;font-size:clamp(40px,7vw,100px);
  letter-spacing:.14em;text-transform:uppercase;color:#fff3d2;text-shadow:0 0 40px rgba(201,40,60,.7),0 8px 0 rgba(0,0,0,.6)}
.trv-title::after{content:attr(data-b);grid-area:1/1;transform:translateY(160%);font-family:var(--v-display);font-weight:700;font-size:13px;letter-spacing:.6em;text-transform:uppercase;color:#e0a049}
@keyframes trvTitle{0%{opacity:0;transform:scale(1.6);filter:blur(10px)}14%{opacity:1;transform:none;filter:none}70%{opacity:1}100%{opacity:0;transform:scale(.96)}}
@media (prefers-reduced-motion:reduce){.trv-world,.trv-str,.trv-pin,.trv-read,.trv-blood,.trv-mark,.trv-title{animation:none!important}}
`;
