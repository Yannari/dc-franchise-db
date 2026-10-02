// ══════════════════════════════════════════════════════════════════════
// vp-tr/offer-stage.js — the Offer, played in the bedroom corridor
// ══════════════════════════════════════════════════════════════════════
//
// The Offer (recruitment.js) was the one story screen with no stage (the
// user, 2026-10-02: "the offer doesnt have a viewer screens"). This plays the
// page's own beats in the corridor where it happens, a painted render
// (tools/blender/traitors-corridor.py):
//
//   - THE ULTIMATUM: a hooded figure comes down the passage to the door, and
//     the face in the hood is the recruiter's, when this layer knows it;
//   - THE NOTE: a sealed sheet slides under the door, and all anybody sees of
//     who brought it is a cloak at the far end of the passage, going;
//   - THE ANSWER: on a yes the cloak settles on the one who was asked; on a
//     fatal no the passage goes red; on a survivable no the note burns.
//
// The words are the page's; a player layer gets the page's gates (no face in
// the hood when they never learned it). Like every other file in this
// directory it imports no engine state.
import { recruitmentStageData } from './recruitment.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face } from './castle-stage.js';
import { beatLines } from './stage-lines.js';
import { footCard, playCard, CARD_CSS } from './stage-cards.js';
import { trPlay } from './sfx.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const clean = x => String(x || '').replace(/\s+/g, ' ').trim();

// THE CORRIDOR (tools/blender/traitors-corridor.py `measure()`): where a
// person stands, as fractions of the 1920x1080 render — feet and the top of
// the head — at the door the offer is made at, and at the two points the
// recruiter walks between.
const PLATE = 'assets/sets/traitors/corridor.webp';
const CLOAK_IMG = 'assets/sets/traitors/cloak.webp';
const OF = {
  door: { foot: [0.6063, 0.7479], head: [0.6066, 0.4704], sill: [0.6491, 0.7441] },
  near: { foot: [0.5295, 0.7816], head: [0.5296, 0.459] },
  far: { foot: [0.4869, 0.6183], head: [0.4869, 0.4744] },
};
function box(W, H) {
  const k = Math.max(W / 1920, H / 1080), dw = 1920 * k, dh = 1080 * k, ox = (W - dw) / 2, oy = (H - dh) / 2;
  return { dw, dh, x: f => ox + f * dw, y: f => oy + f * dh };
}
/** A cloaked figure's box for a spot: the cloak render spans 0.5m to 2.0m of a 1.7m person. */
function cloakBox(spot, b) {
  const perM = (spot.foot[1] - spot.head[1]) / 1.7;          // fraction of the height per metre
  const hFr = 1.5 * perM, bottom = spot.foot[1] - 0.5 * perM;
  const h = hFr * b.dh, w = h * 600 / 900;
  return { left: b.x(spot.foot[0]) - w / 2, top: b.y(bottom) - h, w, h };
}
/** An unhooded person: their portrait at head height, about shoulder-wide. */
function faceBox(spot, b) {
  const perM = (spot.foot[1] - spot.head[1]) / 1.7;
  const w = 0.5 * perM * b.dh;
  return { cx: b.x(spot.head[0]), cy: b.y(spot.head[1] + 0.22 * perM), w };
}

export function offerStageScreen(ep, observer, pageHtml) {
  if (!(ep && ep.tr && ep.tr.recruitment)) return pageHtml;
  const init = () => {
    const data = recruitmentStageData(ep, observer);
    if (!data) return { steps: [] };
    const steps = beatLines(data.beats, (n, part) => {
      if (part === 'who' || part === 'sums' || part === 'observer') return [];
      if (part === 'vellum') return [{ t: 'narr', tag: data.v.mode === 'note' ? 'The note' : 'The terms', text: clean(n.textContent) }];
      if (part === 'verdict') {
        const s = n.querySelector('.nt-verdict-s');
        return [{ t: 'narr', tag: data.v.accepted ? 'Yes' : 'No', text: clean(s ? s.textContent : n.textContent) }];
      }
      return null;
    });
    return { data, steps };
  };
  const uid = 'tof-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: 'The Offer',
    day: (ep.tr && ep.tr.ep) || ep.num, pot: ep.tr && ep.tr.pot, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="tof"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CSS), pageHtml);
}

const ORDER = ['approach', 'asker', 'ask', 'weigh', 'answer', 'after'];
function reached(S) {
  let at = -1;
  for (let k = 0; k <= S.idx; k++) {
    const i = ORDER.indexOf(((S.steps[k] || {}).meta || {}).kind);
    if (i > at) at = i;
  }
  return at;
}

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.tof');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const v = S.data.v, b = box(W, H);
  root.querySelectorAll('.trs-seg').forEach(s => {
    s.classList.toggle('trs-done', S.idx >= 0 && s.dataset.k !== 'night');
    s.classList.toggle('trs-now', S.idx >= 0 && s.dataset.k === 'night');
  });
  const start = root.querySelector('.trs-start');
  const st = S.idx >= 0 ? S.steps[S.idx] : null;
  const at = st ? reached(S) : -1;
  const kind = st ? ((st.meta || {}).kind || '') : '';
  const firstOfBeat = st && (S.steps[S.idx - 1] || {}).beat !== st.beat;
  const answered = at >= ORDER.indexOf('answer');
  const speaker = st && st.t === 'say' ? st.who : null;
  let h = '<div class="tof-world"><img class="tof-plate" src="' + PLATE + '" alt="" draggable="false">';

  // THE ONE WHO WAS ASKED, at the door: a face, and from a yes on, a cloak
  const tf = faceBox(OF.door, b);
  if (answered && v.accepted) {
    const c = cloakBox(OF.door, b);
    h += `<div class="tof-fig tof-cloaked${fresh && kind === 'answer' && firstOfBeat ? ' tof-robe' : ''}${speaker === v.target ? ' tof-speak' : ''}" `
      + `style="left:${c.left}px;top:${c.top}px;width:${c.w}px;height:${c.h}px">`
      + `<img src="${CLOAK_IMG}" alt="" draggable="false"><div class="tof-hoodface">${face(v.target)}</div></div>`;
  } else {
    h += `<div class="tof-person${speaker === v.target ? ' tof-speak' : ''}${at >= ORDER.indexOf('weigh') ? ' tof-lit' : ''}" `
      + `style="left:${tf.cx}px;top:${tf.cy}px;width:${tf.w}px"><div class="tof-av">${face(v.target)}</div>`
      + `<div class="tof-nm">${esc(v.target)}</div></div>`;
  }
  // THE HAND. Ultimatum: a hood walking down the passage to the door. Note: a
  // hood at the far end, going, and never a face on it.
  if (v.mode === 'ultimatum') {
    const spot = at >= ORDER.indexOf('ask') ? OF.near : OF.far;
    const c = cloakBox(spot, b);
    const showFace = v.recruiterKnown && at >= ORDER.indexOf('asker');
    h += `<div class="tof-fig tof-asker${fresh && kind === 'ask' && firstOfBeat ? ' tof-walk' : ''}${speaker && speaker === v.recruiter ? ' tof-speak' : ''}" `
      + `style="left:${c.left}px;top:${c.top}px;width:${c.w}px;height:${c.h}px">`
      + `<img src="${CLOAK_IMG}" alt="" draggable="false">`
      + (showFace ? `<div class="tof-hoodface">${face(v.recruiter)}</div>` : '<div class="tof-hoodface tof-void"></div>')
      + (showFace ? `<div class="tof-fnm">${esc(v.recruiter)}</div>` : '') + '</div>';
  } else if (at <= ORDER.indexOf('asker')) {
    const c = cloakBox(OF.far, b);
    h += `<div class="tof-fig tof-asker tof-going" style="left:${c.left}px;top:${c.top}px;width:${c.w}px;height:${c.h}px">`
      + `<img src="${CLOAK_IMG}" alt="" draggable="false"><div class="tof-hoodface tof-void"></div></div>`;
  }
  // THE NOTE: slid under the door, read, and on a refusal burnt
  // (the note says "destroy this note": on a yes it is gone)
  if (v.mode === 'note' && at >= 0 && !(answered && v.accepted)) {
    const nx = b.x(OF.door.sill[0]), ny = b.y(OF.door.sill[1]), nw = tf.w * .7;
    const burn = answered && !v.accepted;
    const read = at >= ORDER.indexOf('ask');
    h += `<div class="tof-note${fresh && kind === 'approach' && firstOfBeat ? ' tof-slide' : ''}${read ? ' tof-read' : ''}${burn ? ' tof-burn' : ''}" `
      + `style="left:${read ? tf.cx : nx}px;top:${read ? tf.cy + tf.w * 1.05 : ny}px;width:${nw}px">${NOTE_SVG}</div>`;
  }
  h += '</div>';
  // a fatal refusal: the passage goes red from the edges
  if (answered && !v.accepted && v.mode === 'ultimatum') h += `<div class="tof-bleed${fresh && kind === 'answer' && firstOfBeat ? ' tof-fresh' : ''}"></div>`;
  if (S.idx === 0 && fresh) h += `<div class="tof-title" data-a="${v.mode === 'note' ? 'The Note' : 'The Ultimatum'}" data-b="Night ${esc(S.day)}"></div>`;
  if (!st) {
    el.innerHTML = h;
    start.innerHTML = `<b>${v.mode === 'note' ? 'The Note' : 'The Ultimatum'}</b><span>The bedroom corridor, after dark · press Next, or click the passage</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  h += footCard(st, S.data.host || { name: '', slug: null });
  el.innerHTML = h;
  playCard(el, st, S, fresh);
  // THE CAMERA: in on the door once it is a question for the one behind it
  const world = el.querySelector('.tof-world');
  let cam = 'translate(0px,0px) scale(1)';
  if (at >= ORDER.indexOf('weigh') && at < ORDER.indexOf('after')) {
    const k = 1.25, tx = Math.min(0, Math.max(W - W * k, W / 2 - tf.cx * k)), ty = Math.min(0, Math.max(H - H * k, H * .42 - tf.cy * k));
    cam = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k})`;
  }
  world.style.setProperty('--cam', cam);
  world.style.setProperty('--cam0', fresh ? (S.cam || cam) : cam);
  if (fresh) world.classList.add('tof-move');
  S.cam = cam;
  if (fresh && firstOfBeat) {
    if (kind === 'approach') trPlay(v.mode === 'note' ? 'tr-footsteps' : 'tr-door');
    else if (kind === 'ask') trPlay(v.mode === 'note' ? 'tr-quill' : 'tr-footsteps');
    else if (kind === 'weigh') trPlay('tr-heartbeat');
    else if (kind === 'answer') trPlay(v.accepted ? 'tr-wax' : (v.mode === 'ultimatum' ? 'tr-strike' : 'tr-slate'), 400);
  }
  const corner = root.querySelector('.trs-corner');
  corner.innerHTML = `The bedroom corridor · <b>${answered ? (v.accepted ? 'Yes' : 'No') : at >= ORDER.indexOf('weigh') ? 'The pause'
    : at >= ORDER.indexOf('ask') ? 'The offer' : v.mode === 'note' ? 'Under the door' : 'In the passage'}</b>`;
  corner.classList.add('trs-in');
}

// a folded sheet, sealed in red
const NOTE_SVG = '<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M6 10 L114 6 L116 72 L4 76Z" fill="#efe3c4" stroke="#b9a57a" stroke-width="1.5"/>'
  + '<path d="M6 10 L60 44 L114 6" fill="none" stroke="#c8b48a" stroke-width="1.5"/>'
  + '<circle cx="60" cy="44" r="11" fill="#8e1526"/><circle cx="60" cy="44" r="6.5" fill="none" stroke="#5a0c14" stroke-width="1.6"/></svg>';

const CSS = `
.tof{position:absolute;inset:0;overflow:hidden;background:#05060a}
.tof-world{position:absolute;inset:0;transform-origin:0 0;transform:var(--cam)}
.tof-world.tof-move{animation:tofCam 1.2s cubic-bezier(.6,0,.2,1) both}
@keyframes tofCam{from{transform:var(--cam0)}to{transform:var(--cam)}}
.tof-plate{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none}
.tof-fig{position:absolute;z-index:10;transition:filter .5s}
.tof-fig img{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 14px 18px rgba(0,0,0,.85))}
.tof-hoodface{position:absolute;left:26%;top:16%;width:48%;aspect-ratio:1/1.1;overflow:hidden;border-radius:50% 50% 44% 44%;background:#0a0204;z-index:2;
  box-shadow:0 0 18px rgba(0,0,0,.9) inset}
.tof-hoodface img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;filter:saturate(.85) brightness(.88)}
.tof-hoodface::after{content:"";position:absolute;inset:0;background:radial-gradient(70% 60% at 50% 60%,transparent 55%,rgba(7,1,3,.85))}
.tof-void{background:radial-gradient(60% 60% at 50% 55%,#000,#0a0204)}
.tof-fnm,.tof-nm{position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;padding:2px 8px;font-family:var(--v-display);font-weight:700;font-size:10px;
  letter-spacing:.18em;text-transform:uppercase;color:#f3dcd8;background:rgba(14,4,6,.8);border:1px solid rgba(201,40,60,.4)}
.tof-fnm{top:-8%}
.tof-nm{top:104%;color:#ded6c4;border-color:rgba(222,214,196,.2)}
.tof-person{position:absolute;transform:translate(-50%,-50%);z-index:12;transition:filter .5s}
.tof-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#0b0e14;
  box-shadow:0 0 0 2px rgba(222,214,196,.3),0 10px 24px rgba(0,0,0,.85)}
.tof-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%}
.tof-person.tof-lit .tof-av{box-shadow:0 0 0 2px #fff3d2,0 0 34px rgba(255,214,150,.45),0 10px 24px rgba(0,0,0,.85)}
.tof-speak{filter:drop-shadow(0 0 22px rgba(255,214,150,.6))}
.tof-asker.tof-walk{animation:tofWalk 1.6s cubic-bezier(.4,0,.2,1) both}
@keyframes tofWalk{from{opacity:.2;transform:translateY(-6%) scale(.55)}to{opacity:1;transform:none}}
.tof-going{opacity:.55;animation:tofGo 6s ease-in forwards}
@keyframes tofGo{to{opacity:0;transform:translateY(-4%) scale(.85)}}
.tof-cloaked.tof-robe{animation:tofRobe 1.4s cubic-bezier(.2,1,.3,1) both}
@keyframes tofRobe{from{opacity:0;transform:translateY(-12%);filter:brightness(2) blur(4px)}to{opacity:1;transform:none;filter:none}}
.tof-note{position:absolute;transform:translate(-50%,-50%);z-index:14;transition:left 1s,top 1s,transform 1s}
.tof-note svg{display:block;width:100%;filter:drop-shadow(0 6px 10px rgba(0,0,0,.8))}
.tof-note.tof-slide{animation:tofSlide 1.6s cubic-bezier(.3,0,.2,1) both}
@keyframes tofSlide{from{opacity:0;transform:translate(10%,-50%) scaleY(.4)}to{opacity:1}}
.tof-note.tof-read{transform:translate(-50%,-50%) rotate(-6deg) scale(1.25)}
.tof-note.tof-burn{animation:tofBurn 2.4s ease forwards}
@keyframes tofBurn{0%{filter:none}35%{filter:sepia(1) saturate(4) brightness(1.4) drop-shadow(0 0 16px #ff7a2a)}100%{opacity:0;filter:brightness(.2) blur(3px);transform:translate(-50%,-80%) scale(.6)}}
.tof-bleed{position:absolute;inset:0;z-index:25;pointer-events:none;box-shadow:inset 0 0 180px 70px rgba(120,8,20,.8)}
.tof-bleed.tof-fresh{animation:tofBleed 2.4s ease both}
@keyframes tofBleed{from{box-shadow:inset 0 0 0 0 rgba(120,8,20,0)}}
.tof-title{position:absolute;inset:0;z-index:3500;display:grid;place-items:center;pointer-events:none;animation:tofTitle 2.8s ease both}
.tof-title::before{content:attr(data-a);grid-area:1/1;transform:translateY(-18%);font-family:var(--v-display);font-weight:900;font-size:clamp(40px,7vw,100px);
  letter-spacing:.14em;text-transform:uppercase;color:#f3e3c4;text-shadow:0 0 40px rgba(201,40,60,.7),0 8px 0 rgba(0,0,0,.6)}
.tof-title::after{content:attr(data-b);grid-area:1/1;transform:translateY(160%);font-family:var(--v-display);font-weight:700;font-size:13px;letter-spacing:.6em;text-transform:uppercase;color:#c9283c}
@keyframes tofTitle{0%{opacity:0;transform:scale(1.6);filter:blur(10px)}14%{opacity:1;transform:none;filter:none}70%{opacity:1}100%{opacity:0;transform:scale(.96)}}
@media (prefers-reduced-motion:reduce){.tof-world,.tof-asker,.tof-cloaked,.tof-note,.tof-bleed,.tof-title,.tof-going{animation:none!important}}
`;
