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
// THE STUDIO (tools/blender/traitors-reunion.py): a castle great hall dressed
// as a studio, the cast on two curved velvet tiers, the host in a wingback
// chair at the front. Head positions per seat, as fractions of the render,
// front tier then back tier, left to right; and the host's chair.
const PLATE = 'assets/sets/traitors/reunion.webp';
const SEATS = [[0.1985, 0.6295, 0], [0.2547, 0.6138, 0], [0.3102, 0.6021, 0], [0.3651, 0.5938, 0], [0.4193, 0.5887, 0], [0.4731, 0.5863, 0], [0.5266, 0.5867, 0], [0.5803, 0.5897, 0], [0.6342, 0.5956, 0], [0.6885, 0.6047, 0], [0.7433, 0.6173, 0], [0.7983, 0.6343, 0], [0.1319, 0.5631, 1], [0.2055, 0.5496, 1], [0.2752, 0.5399, 1], [0.342, 0.5332, 1], [0.4067, 0.5291, 1], [0.4702, 0.5272, 1], [0.5333, 0.5275, 1], [0.5968, 0.5299, 1], [0.6615, 0.5347, 1], [0.7281, 0.5421, 1], [0.7977, 0.5526, 1], [0.8709, 0.5672, 1]];
const HOST = [0.1121, 0.7067];
function box(W, H) {
  const k = Math.max(W / 1920, H / 1080), dw = 1920 * k, dh = 1080 * k, ox = (W - dw) / 2, oy = (H - dh) / 2;
  return { dw, dh, x: f => ox + f * dw, y: f => oy + f * dh };
}

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

// the cast on the sofas: spread over the seats (front tier first), each face
// a little above where a seated head is, sized for its tier
function seatOf(i, n, W, H) {
  const b = box(W, H), front = SEATS.filter(s => s[2] === 0), back = SEATS.filter(s => s[2] === 1);
  const nf = Math.min(front.length, Math.ceil(n / 2) + (n > 20 ? 1 : 0)), nb = n - nf;
  const pick = (row, k, m) => row[Math.round((row.length - 1) * (m <= 1 ? .5 : k / (m - 1)))];
  const s = i < nf ? pick(front, i, nf) : pick(back, i - nf, nb);
  const w = b.dw * (s[2] === 0 ? .042 : .036);
  return { x: b.x(s[0]), y: b.y(s[1]) - w * .2, w };
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
  // the host, in the wingback
  { const b = box(W, H), w = b.dw * .05, hostSpeaking = st && st.t === 'host';
    h += `<div class="tru-p tru-host${hostSpeaking ? ' tru-speak' : (speaker ? ' tru-quiet' : '')}" style="left:${b.x(HOST[0])}px;top:${b.y(HOST[1]) - w * .2}px;width:${w}px;z-index:${hostSpeaking ? 50 : 12}">`
      + `<div class="tru-av">${S.data.host && S.data.host.slug ? face(S.data.host.name, S.data.host.slug) : ''}</div><div class="tru-nm">${esc((S.data.host || {}).name || 'The host')}</div></div>`; }
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
.tru-plate{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.tru-shade{position:absolute;inset:0;background:radial-gradient(80% 70% at 50% 50%,transparent,rgba(0,0,0,.45));pointer-events:none}
.tru-p.tru-host .tru-av{box-shadow:0 0 0 2px #c9a24a,0 8px 18px rgba(0,0,0,.85)}
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
