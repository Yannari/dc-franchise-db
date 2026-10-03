// ══════════════════════════════════════════════════════════════════════
// vp-tr/reunion-stage.js — the reunion, played back in the Round Table room
// ══════════════════════════════════════════════════════════════════════
//
// Everybody who played, in two curved rows in the painted Round Table room
// (assets/sets/traitors/roundtable.webp), months later. The host asks; whoever
// is answering is lit and brought forward, and the people the question is
// about are lit with them. The words are the page's (reunion.js), read by the
// shared line reader. Like every other file in this directory it imports no
// engine state.
import { reunionStageData } from './reunion.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face } from './castle-stage.js';
import { beatLines } from './stage-lines.js';
import { footCard, playCard, CARD_CSS } from './stage-cards.js';
import { trPlay } from './sfx.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const PLATE = 'assets/sets/traitors/roundtable.webp';

export function reunionStageScreen(ep, observer, pageHtml) {
  if (!(ep && ep.tr && ep.tr.reunion) || !pageHtml) return pageHtml;
  const init = () => {
    const data = reunionStageData(ep);
    if (!data) return { steps: [] };
    const steps = beatLines(data.beats, (n, part) => (part === 'faces' ? [] : null));
    return { data, steps };
  };
  const uid = 'tru-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: 'The Reunion',
    day: (ep.tr && ep.tr.ep) || ep.num, pot: null, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="tru"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CSS), pageHtml);
}

// two curved rows, the back row higher and smaller
function seatOf(i, n, W, H) {
  const back = n > 10 ? Math.ceil(n / 2) : n, row = i < back ? 0 : 1, k = row ? i - back : i, m = row ? n - back : back;
  const t = m <= 1 ? .5 : k / (m - 1);
  const x = W * (.12 + .76 * t), y = H * (row ? .6 : .44) + Math.sin(t * Math.PI) * H * -.05;
  return { x, y, w: Math.min(H * (row ? .09 : .075), W * .7 / Math.max(6, m)) };
}

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.tru');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const R = S.data.R;
  root.querySelectorAll('.trs-seg').forEach(s => { s.classList.toggle('trs-done', S.idx >= 0); s.classList.remove('trs-now'); });
  const start = root.querySelector('.trs-start');
  const st = S.idx >= 0 ? S.steps[S.idx] : null;
  const m = (st && st.meta) || {};
  const speaker = st && st.t === 'say' ? st.who : null;
  const focus = speaker || m.focus || null;
  const traitors = new Set(R.traitors || []), takers = new Set(R.takers || []);
  let h = '<div class="tru-world"><img class="tru-plate" src="' + PLATE + '" alt="" draggable="false"><div class="tru-shade"></div>';
  R.cast.forEach((n, i) => {
    const p = seatOf(i, R.cast.length, W, H);
    const cls = ['tru-p', n === speaker ? 'tru-speak' : (speaker ? 'tru-quiet' : ''), n === focus && !speaker ? 'tru-lit' : '',
      traitors.has(n) ? 'tru-t' : '', takers.has(n) ? 'tru-w' : ''].join(' ');
    h += `<div class="${cls}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;z-index:${n === speaker ? 50 : 10}">`
      + `<div class="tru-av">${face(n)}</div><div class="tru-nm">${esc(n)}</div></div>`;
  });
  h += '</div>';
  if (S.idx === 0 && fresh) h += '<div class="tru-title" data-a="The Reunion" data-b="Everybody is back"></div>';
  if (!st) {
    el.innerHTML = h;
    start.innerHTML = `<b>The Reunion</b><span>${R.cast.length} back in the room · press Next, or click the room</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  h += footCard(st, S.data.host || { name: '', slug: null });
  el.innerHTML = h;
  playCard(el, st, S, fresh);
  if (fresh && speaker && (S.steps[S.idx - 1] || {}).who !== speaker) trPlay('tr-slate');
  const corner = root.querySelector('.trs-corner');
  corner.innerHTML = 'The reunion · <b>' + esc(st.tag || (speaker ? speaker : 'The room')) + '</b>';
  corner.classList.add('trs-in');
}

const CSS = `
.tru{position:absolute;inset:0;overflow:hidden;background:#06050a}
.tru-world{position:absolute;inset:0}
.tru-plate{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.7) saturate(.9)}
.tru-shade{position:absolute;inset:0;background:radial-gradient(70% 60% at 50% 45%,rgba(0,0,0,.05),rgba(0,0,0,.6))}
.tru-p{position:absolute;transform:translate(-50%,-50%);text-align:center;transition:filter .45s,transform .45s}
.tru-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#0b0e14;
  box-shadow:0 0 0 2px rgba(222,214,196,.3),0 8px 18px rgba(0,0,0,.85)}
.tru-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%}
.tru-nm{display:inline-block;margin-top:3px;padding:1px 6px;white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:9px;
  letter-spacing:.12em;text-transform:uppercase;color:#ded6c4;background:rgba(4,5,8,.78)}
.tru-p.tru-t .tru-av{box-shadow:0 0 0 2px #c9283c,0 8px 18px rgba(0,0,0,.85)}
.tru-p.tru-w .tru-av{box-shadow:0 0 0 2px #e8c270,0 0 16px rgba(232,194,112,.5),0 8px 18px rgba(0,0,0,.85)}
.tru-p.tru-quiet{filter:brightness(.5) saturate(.7)}
.tru-p.tru-speak{transform:translate(-50%,-62%) scale(1.6)}
.tru-p.tru-speak .tru-av{box-shadow:0 0 0 2px #fff3d2,0 0 34px rgba(255,214,150,.6),0 8px 18px rgba(0,0,0,.85)}
.tru-p.tru-lit{transform:translate(-50%,-55%) scale(1.25)}
.tru-title{position:absolute;inset:0;z-index:3500;display:grid;place-items:center;pointer-events:none;animation:truTitle 3s ease both}
.tru-title::before{content:attr(data-a);grid-area:1/1;transform:translateY(-18%);font-family:var(--v-display);font-weight:900;font-size:clamp(40px,7vw,100px);
  letter-spacing:.16em;text-transform:uppercase;color:#f3e3c4;text-shadow:0 0 40px rgba(201,162,74,.6),0 8px 0 rgba(0,0,0,.6)}
.tru-title::after{content:attr(data-b);grid-area:1/1;transform:translateY(170%);font-family:var(--v-display);font-weight:700;font-size:13px;letter-spacing:.6em;text-transform:uppercase;color:#c9a24a}
@keyframes truTitle{0%{opacity:0;transform:scale(1.6);filter:blur(10px)}14%{opacity:1;transform:none;filter:none}70%{opacity:1}100%{opacity:0;transform:scale(.96)}}
@media (prefers-reduced-motion:reduce){.tru-title{animation:none!important}}
`;
