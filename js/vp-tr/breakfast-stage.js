// ══════════════════════════════════════════════════════════════════════
// vp-tr/breakfast-stage.js — breakfast, played in the breakfast room
// ══════════════════════════════════════════════════════════════════════
//
// The page (cold-open.js) is a run of cards. This plays the same cards
// (`coldOpenStageData`, the page's own beats and host lines) in the room: the
// long table laid for everybody who went up to bed, each person dropping into
// their OWN place as they come down (the page's seating, which is cast order),
// the places still empty counted in the corner, and — only once the page has
// reached the beat that finds it, the same gate the page keeps — the cup
// turned over at the place nobody is coming down to.
//
// Like every other file in this directory it imports no engine state.
import { coldOpenStageData } from './cold-open.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face } from './castle-stage.js';
import { trPlay } from './sfx.js';
import { beatLines } from './stage-lines.js';
import { footCard, playCard, CARD_CSS } from './stage-cards.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const GAP_KINDS = new Set(['gap', 'told', 'after', 'flash', 'chair', 'grief', 'eyes', 'sit']);

export function breakfastStageScreen(ep, observer, pageHtml) {
  if (!(ep && ep.tr && ep.tr.dawn)) return pageHtml;
  // LAZY — read at mount, see castle-stage.js `mount`.
  const init = () => {
    const data = coldOpenStageData(ep, observer);
    return data && data.laid.length ? { data, steps: beatLines(data.beats) } : { steps: [] };
  };
  const uid = 'trb-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: ep.tr.arrival ? 'The Arrival' : 'Breakfast',
    day: (ep.tr && ep.tr.ep) || ep.num, pot: ep.tr && ep.tr.pot, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="trb"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CSS), pageHtml);
}

// Who is down, and whether the room has found the gap yet, at step idx.
// THE STAIR BEAT SEATS PEOPLE ON THE LINE THAT NAMES THEM. A 'down' beat
// carries everybody down by its end, but its first line is the host asking
// the room to wait; seating the whole group there put them at the table
// before anybody had come down. Within a stair beat, a person sits when a line
// names them, and anybody the beat carries whom no line names sits on its last.
const named = (n, text) => {
  const i = String(text || '').indexOf(n);
  return i >= 0 && !/[A-Za-z]/.test(String(text).charAt(i - 1) || '') && !/[A-Za-z]/.test(String(text).charAt(i + n.length) || '');
};
function stateAt(S) {
  let down = new Set(), prev = new Set(), gapShown = false, whole = false;
  for (let k = 0; k <= S.idx; k++) {
    const st = S.steps[k], m = st.meta || {};
    if (k === S.idx) prev = new Set(down);
    if (Array.isArray(m.down)) {
      if (m.kind === 'down' || m.kind === 'relief') {
        const last = (S.steps[k + 1] || {}).beat !== st.beat;
        for (const n of m.down) if (last || named(n, st.text)) down.add(n);
      } else down = new Set(m.down);
    }
    if (GAP_KINDS.has(m.kind) || (m.kind === 'day' && (m.gap || []).length)) gapShown = true;
    if (m.kind === 'whole') whole = true;
  }
  const arriving = [...down].filter(n => !prev.has(n));
  return { down, arriving: new Set(arriving), gapShown, whole };
}

// THE ROOM IS A RENDER (tools/blender/traitors-breakfast.py), drawn
// object-fit: cover; everything on it is placed in the render's own
// perspective. These numbers are that script's `measure()` and sprite boxes
// (fractions of the 1920x1080 render): where a seated head and a laid place
// fall on each side of the table, and how far a metre along it moves across
// the picture (further on the near side, which is closer to us).
export const BK_PLATE = 'assets/sets/traitors/breakfast.webp';
const BK = {
  far:  { head: 0.4691, seat: 0.5669, place: 0.567, perM: 0.09002, placePerM: 0.09443 },
  near: { head: 0.64,   // over the chair's back, not the seated head (0.6222)
          seat: 0.7409, place: 0.6358, perM: 0.11463, placePerM: 0.1043 },
  // each sprite's box, rendered at the middle of the table: [x0, y0, x1, y1]
  sprite: {"chair-far": [0.4716, 0.4034, 0.5284, 0.6552], "chair-near": [0.4641, 0.5754, 0.5359, 0.8514], "place-far": [0.4757, 0.5407, 0.5308, 0.5821], "place-near": [0.4737, 0.6157, 0.5339, 0.6543], "turned-far": [0.4757, 0.5418, 0.5308, 0.5821], "turned-near": [0.4737, 0.6157, 0.5339, 0.6543]},
  run: 4.7,                                   // seats run 4.7m either side of the middle
};
/** The render's box in the view's pixels (cover), and a point on it. */
function bkBox(W, H) {
  const k = Math.max(W / 1920, H / 1080), dw = 1920 * k, dh = 1080 * k, ox = (W - dw) / 2, oy = (H - dh) / 2;
  return { ox, oy, dw, dh, x: f => ox + f * dw, y: f => oy + f * dh };
}

// The places: two rows along the table, alternating sides in seating order.
function placeAt(i, n, W, H) {
  const cols = Math.ceil(n / 2), col = Math.floor(i / 2), far = i % 2 === 0;
  const row = far ? BK.far : BK.near, b = bkBox(W, H);
  // metres along the table; the near side sits half a place along from the far
  const m = Math.min(BK.run + .2, -BK.run + (col + .5) / cols * 2 * BK.run + (far ? 0 : BK.run / cols));
  return { x: b.x(.5 + m * row.perM), y: b.y(row.head), far, m, row, b };
}

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.trb');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const D = S.data;
  const order = ['breakfast', 'morning', 'mission', 'evening', 'table', 'night'];
  root.querySelectorAll('.trs-seg').forEach(s => {
    const me = order.indexOf(s.dataset.k);
    s.classList.toggle('trs-done', false); s.classList.toggle('trs-now', S.idx >= 0 && me === 0);
  });
  const start = root.querySelector('.trs-start');
  const setHtml = `<img class="trb-plate" src="${BK_PLATE}" alt="" draggable="false">`;
  // THE CAMERA. The room and the people live on a layer that persists between
  // steps, so a move from one framing to the next animates; the counter and
  // the line card sit on a fixed layer over it.
  let cam = el.querySelector('.trb-cam'), hud = el.querySelector('.trb-hud');
  if (!cam || !hud) {
    el.innerHTML = '<div class="trb-cam"></div><div class="trb-hud"></div>';
    cam = el.querySelector('.trb-cam'); hud = el.querySelector('.trb-hud');
  }
  const frame = (who, instant, zoom) => {
    const i = who ? D.laid.indexOf(who) : -1;
    cam.style.transition = instant ? 'none' : '';
    if (i < 0) { cam.style.transform = 'translate(0px,0px) scale(1)'; cam.classList.remove('trb-close'); return; }
    // IN CLOSE ON WHOEVER IS SPEAKING, the way the castle day flies to a room:
    // their place brought to the middle of the frame, a little above centre
    // so the line card below does not cover them.
    const p = placeAt(i, D.laid.length, W, H), k = zoom || 1.4;
    const tx = W / 2 - p.x * k, ty = H * 0.45 - p.y * k;
    cam.style.transform = `translate(${Math.min(0, Math.max(W - W * k, tx))}px,${Math.min(0, Math.max(H - H * k, ty))}px) scale(${k})`;
    cam.classList.add('trb-close');
  };
  if (S.idx < 0) {
    cam.innerHTML = setHtml + places(D, { down: new Set(), arriving: new Set(), gapShown: false }, W, H, null, false);
    hud.innerHTML = '';
    frame(null, true);
    start.innerHTML = `<b>${esc(D.arrival ? 'The Arrival' : 'Breakfast')}</b><span>${D.laid.length} places laid · press Next, or click the room</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  const st = S.steps[S.idx], r = stateAt(S);
  const speaker = st.t === 'say' ? st.who : st.react ? st.who : null;
  cam.innerHTML = setHtml + places(D, r, W, H, speaker, fresh);
  const m = st.meta || {};
  const firstOfBeat = (S.steps[S.idx - 1] || {}).beat !== st.beat;
  const gone = D.laid.filter(n => D.missing.includes(n) || D.hidden.includes(n));
  // THE CAMERA: dialogue pulls in on the speaker; the empty place, once the
  // room has found it, holds the frame; narration pulls back to the room
  const onGap = r.gapShown && m.kind === 'gap' && st.t !== 'say' && gone.length;
  // a render can be pushed in only so far before it goes soft
  if (onGap) frame(gone[0], !fresh, 1.3);
  else frame(st.t === 'say' || (st.react && st.who) ? speaker : null, !fresh, 1.4);
  cam.classList.toggle('trb-dread', !!onGap);
  let h = '';
  // THE DOOR: whoever has just come down arrives as a framed portrait through
  // the door, the way the programme cuts to each face walking in, and then
  // takes their place at the table
  if (fresh && r.arriving.size && (m.kind === 'down' || m.kind === 'relief')) {
    const list = [...r.arriving];
    h += `<div class="trb-entry" style="--n:${list.length}">` + list.map((n, i) =>
      `<div class="trb-frame" style="--i:${i}"><div class="trb-fav">${face(n)}</div><div class="trb-fnm" data-n="${esc(n)}"></div></div>`).join('') + '</div>';
    trPlay('tr-door'); trPlay('tr-footsteps', 350);
  }
  // THE PORTRAIT ON THE WALL: through the host's words for the murdered, the
  // framed face hangs over the room; on the beat the frame comes down, it
  // falls, cracks and goes grey
  const frameBeat = S.steps.find(x => x.tag === 'The Frame Comes Down');
  if (frameBeat && gone.length && st.beat === frameBeat.beat) {
    const dropNow = st.tag === 'The Frame Comes Down';
    const dropped = dropNow || S.steps.slice(0, S.idx).some(x => x.beat === st.beat && x.tag === 'The Frame Comes Down');
    h += `<div class="trb-memorial${dropped ? ' trb-dropped' : ''}${dropNow && fresh ? ' trb-drop' : ''}">`
      + `<div class="trb-mframe"><div class="trb-mav">${face(gone[0])}</div><i class="trb-crack"></i></div>`
      + `<div class="trb-mnm" data-n="${esc(gone[0])}"></div></div>`;
    if (dropNow && fresh) trPlay('tr-frame-drop', 500);
  }
  // the count in the corner: down, and the places nobody is coming down to
  const empty = D.laid.filter(n => !r.down.has(n)).length;
  const goneN = r.gapShown ? gone.length : 0;
  h += `<div class="trb-count"><span><b>${r.down.size}</b> / ${D.room.length} down</span>`
    + (empty && !r.gapShown ? `<span>${empty} ${empty === 1 ? 'place' : 'places'} still empty</span>` : '')
    + (goneN ? `<span class="trb-hot">${goneN} not coming down</span>` : '')
    + (r.whole ? '<span class="trb-good">A full table</span>' : '') + '</div>';
  h += footCard(st, D.host);
  hud.innerHTML = h;
  playCard(hud, st, S, fresh);
  // THE SOUND OF IT, once per beat, on a fresh step.
  if (fresh && (S.steps[S.idx - 1] || {}).beat !== st.beat) {
    const k = (st.meta || {}).kind;
    if (k === 'down') {}
    else if (k === 'gap') trPlay('tr-cup');
    else if (k === 'count' && /last|places/i.test(String(st.tag || ''))) trPlay('tr-heartbeat');
  }
  const corner = root.querySelector('.trs-corner');
  corner.innerHTML = `${D.arrival ? 'The arrival' : 'The breakfast room'} · <b>${r.gapShown ? 'A cup turned over' : r.down.size ? 'Coming down' : 'Before anybody'}</b>`;
  corner.classList.add('trs-in');
}

function places(D, r, W, H, speaker, fresh) {
  const n = D.laid.length;
  const gone = new Set([...D.missing, ...D.hidden]);
  // a sprite of the render, moved along the table by m metres
  const sprite = (key, m, perM, b, cls, z) => {
    const [x0, y0, x1, y1] = BK.sprite[key], dx = m * perM;
    return `<img class="trb-sp ${cls}" src="assets/sets/traitors/bk-${key}.webp" alt="" draggable="false" style="left:${b.x(x0 + dx)}px;top:${b.y(y0)}px;`
      + `width:${(x1 - x0) * b.dw}px;height:${(y1 - y0) * b.dh}px;z-index:${z}">`;
  };
  let out = '', seats = '';
  D.laid.forEach((name, i) => {
    const p = placeAt(i, n, W, H), side = p.far ? 'far' : 'near';
    // a face about the width of a person's shoulders at that distance
    const pw = .55 * p.row.perM * p.b.dw;
    const turned = r.gapShown && gone.has(name);
    const isDown = r.down.has(name);
    // the place laid on the cloth, its cup turned over once the room has found the gap
    out += sprite((turned ? 'turned-' : 'place-') + side, p.m, p.row.placePerM, p.b, turned ? 'trb-turn' : '', p.far ? 8 : 20);
    // an empty place is its chair; a far chair stands behind whoever sits in it
    // EVERY PLACE HAS ITS CHAIR, and whoever is down sits in it: the face over
    // the chair's back (a near face with no chair floated on the cloth)
    out += sprite('chair-' + side, p.m, p.row.perM, p.b, turned ? 'trb-chair-gone' : '', p.far ? 5 : 25);
    const cls = ['trb-seat', p.far ? 'trb-far' : 'trb-near', isDown ? 'trb-down' : 'trb-empty',
      fresh && r.arriving.has(name) ? 'trb-arrive' : '', speaker === name ? 'trb-speak' : (speaker ? 'trb-quiet' : ''),
      turned ? 'trb-gone' : ''].join(' ');
    if (!isDown && !turned) return;
    seats += `<div class="${cls}" style="left:${p.x}px;top:${p.y}px;width:${pw}px;z-index:${p.far ? 10 : 30}">`
      + (isDown ? `<div class="trb-av">${face(name)}</div><div class="trb-nm">${esc(name)}</div>`
        : `<div class="trb-nm trb-nm-gone">${esc(name)}</div>`)
      + '</div>';
  });
  return out + seats;
}

const CSS = `
.trb{position:absolute;inset:0;overflow:hidden}
.trb-cam{position:absolute;inset:0;transform-origin:0 0;transition:transform 1.1s cubic-bezier(.65,0,.25,1)}
.trb-hud{position:absolute;inset:0;pointer-events:none}
.trb-hud>*{pointer-events:auto}
/* in close, the rest of the room goes soft behind the speaker */
.trb-cam.trb-close .trb-seat:not(.trb-speak){filter:brightness(.45) blur(1px)}
.trb-plate{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none}
.trb-sp{position:absolute;pointer-events:none;user-select:none}
.trb-sp.trb-turn{animation:trbTurn .8s cubic-bezier(.2,1.4,.4,1)}
@keyframes trbTurn{from{opacity:0;transform:translateY(-30%) rotate(-25deg)}}
.trb-sp.trb-chair-gone{filter:drop-shadow(0 0 14px rgba(201,40,60,.75))}
.trb-cam.trb-dread .trb-sp.trb-chair-gone{animation:trbDread 1.4s ease-in-out infinite}
.trb-seat{position:absolute;transform:translate(-50%,-50%);text-align:center;transition:filter .45s,transform .45s}
.trb-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;
  background:linear-gradient(162deg,#252b37,#080b11);box-shadow:0 0 0 2px rgba(222,214,196,.35),0 8px 20px rgba(0,0,0,.8)}
.trb-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.trb-nm{display:inline-block;margin-top:4px;padding:2px 7px;white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:9.5px;
  letter-spacing:.14em;text-transform:uppercase;color:#ded6c4;background:rgba(4,7,5,.74);border:1px solid rgba(222,214,196,.17)}
.trb-nm-gone{color:#e87a82;border-color:rgba(201,40,60,.5);text-decoration:line-through}
.trb-chair{width:62%;margin:0 auto;aspect-ratio:1/1.3;border-radius:40% 40% 6% 6%/30% 30% 6% 6%;background:linear-gradient(180deg,#3a2414,#1a0d06);
  box-shadow:inset 0 0 0 2px rgba(138,90,46,.5),0 6px 14px rgba(0,0,0,.6);opacity:.85}
.trb-seat.trb-gone .trb-chair{background:linear-gradient(180deg,#2a0a10,#120406);box-shadow:inset 0 0 0 2px rgba(201,40,60,.6),0 0 24px rgba(201,40,60,.35)}
.trb-seat.trb-arrive{animation:trbArrive .7s cubic-bezier(.2,1.2,.4,1) 2.3s both}
@keyframes trbArrive{from{opacity:0;transform:translate(-50%,-30%) scale(.8)}}
.trb-seat.trb-quiet{filter:brightness(.55) saturate(.75)}
.trb-seat.trb-speak{transform:translate(-50%,-50%) scale(1.16);z-index:60!important}
.trb-seat.trb-speak .trb-av{box-shadow:0 0 0 2px #fff3d2,0 0 34px rgba(255,243,210,.55),0 8px 20px rgba(0,0,0,.8)}
.trb-count{position:absolute;right:14px;top:14px;z-index:100;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.trb-count span{padding:6px 12px;background:rgba(4,5,8,.82);box-shadow:0 0 0 1px rgba(224,160,73,.3);font-family:var(--v-display);font-size:10.5px;
  font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#e8ddc1}
.trb-count b{font-size:15px;color:#ffdb95}
.trb-count .trb-hot{color:#e87a82;box-shadow:0 0 0 1px rgba(201,40,60,.6);animation:trbPulse 1.6s infinite}
.trb-count .trb-good{color:#8fd19e}
/* ── THE BREAKFAST ROOM, PLAYED (2026-09-30) ─────────────────────────── */
.trb-cam.trb-dim{filter:brightness(.5) blur(2px)}
.trb-cam.trb-dread{filter:saturate(.7)}
@keyframes trbDread{50%{filter:drop-shadow(0 0 30px rgba(255,70,90,.95))}}
/* the door: framed portraits walking in */
.trb-entry{position:absolute;inset:0;z-index:2100;display:flex;align-items:center;justify-content:center;gap:3%;pointer-events:none;
  background:linear-gradient(90deg,rgba(4,3,2,0),rgba(4,3,2,.72) 30%,rgba(4,3,2,.72) 70%,rgba(4,3,2,0));animation:trbEntryBg 3.2s ease both}
@keyframes trbEntryBg{0%{opacity:0}12%{opacity:1}78%{opacity:1}100%{opacity:0}}
.trb-frame{width:min(19%,190px);opacity:0;text-align:center;animation:trbWalk 3.2s cubic-bezier(.2,.9,.3,1) both;animation-delay:calc(var(--i) * .22s)}
@keyframes trbWalk{0%{opacity:0;transform:translateX(60vw) rotate(4deg)}18%{opacity:1;transform:translateX(-8px) rotate(-1deg)}24%{transform:none}
  76%{opacity:1;transform:none}100%{opacity:0;transform:translateY(40px) scale(.7)}}
.trb-fav{position:relative;aspect-ratio:3/4;overflow:hidden;background:#141922;
  border:10px solid transparent;border-image:linear-gradient(135deg,#f3d58a,#9a6a22 30%,#f7e2a6 50%,#8a5a18 72%,#e8c270) 1;
  box-shadow:0 0 0 2px #3a2208,0 24px 60px rgba(0,0,0,.9),0 0 50px rgba(255,210,140,.25)}
.trb-fav img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 16%;z-index:1}
.trb-fav .trs-ini{font-size:30px}
.trb-fnm::before{content:attr(data-n);display:inline-block;margin-top:10px;padding:4px 12px;font-family:var(--v-display);font-weight:900;font-size:clamp(11px,1.2vw,15px);
  letter-spacing:.2em;text-transform:uppercase;color:#241b11;background:linear-gradient(180deg,#f7e2a6,#c99a48)}
/* the portrait of the murdered */
.trb-memorial{position:absolute;left:50%;top:44%;width:min(24%,230px);transform:translate(-50%,-50%);z-index:2050;text-align:center;pointer-events:none;
  animation:trbHang 1s ease both}
@keyframes trbHang{from{opacity:0;transform:translate(-50%,-58%)}}
.trb-mframe{position:relative;aspect-ratio:3/4;overflow:hidden;background:#141922;
  border:12px solid transparent;border-image:linear-gradient(135deg,#f3d58a,#9a6a22 30%,#f7e2a6 50%,#8a5a18 72%,#e8c270) 1;
  box-shadow:0 0 0 2px #3a2208,0 30px 70px rgba(0,0,0,.95),0 0 80px rgba(255,210,140,.2)}
.trb-mav{position:absolute;inset:0}
.trb-mav img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 16%;z-index:1;transition:filter 1.2s}
.trb-mnm::before{content:attr(data-n);display:inline-block;margin-top:12px;padding:4px 14px;font-family:var(--v-display);font-weight:900;font-size:clamp(12px,1.3vw,17px);
  letter-spacing:.22em;text-transform:uppercase;color:#f3dcd8;background:rgba(40,6,10,.9);border:1px solid rgba(201,40,60,.6)}
.trb-crack{position:absolute;inset:0;z-index:3;opacity:0;background:
  linear-gradient(62deg,transparent 48.6%,rgba(255,255,255,.85) 49.2%,transparent 49.8%),
  linear-gradient(-38deg,transparent 58.6%,rgba(255,255,255,.7) 59.1%,transparent 59.7%),
  linear-gradient(12deg,transparent 30.5%,rgba(255,255,255,.6) 31%,transparent 31.5%)}
.trb-memorial.trb-dropped .trb-mav img{filter:grayscale(1) brightness(.75)}
.trb-memorial.trb-dropped .trb-crack{opacity:1}
.trb-memorial.trb-dropped{transform:translate(-50%,-50%) rotate(-7deg) translateY(10%)}
.trb-memorial.trb-drop{animation:trbFall 1.3s cubic-bezier(.5,0,.8,.4) both}
@keyframes trbFall{0%{transform:translate(-50%,-50%)}25%{transform:translate(-50%,-50%) rotate(3deg)}
  70%{transform:translate(-50%,-50%) rotate(-9deg) translateY(12%)}80%{transform:translate(-50%,-50%) rotate(-6deg) translateY(9%)}100%{transform:translate(-50%,-50%) rotate(-7deg) translateY(10%)}}
.trb-memorial.trb-drop .trb-crack{animation:trbCrack .2s steps(1) .95s both}
@keyframes trbCrack{from{opacity:0}to{opacity:1}}
.trb-memorial.trb-drop .trb-mav img{filter:none;animation:trbGrey 1s ease 1s forwards}
@keyframes trbGrey{to{filter:grayscale(1) brightness(.75)}}
@media (prefers-reduced-motion:reduce){.trb-entry,.trb-frame,.trb-memorial{animation:none!important;opacity:1}}
@keyframes trbPulse{50%{box-shadow:0 0 0 1px rgba(201,40,60,.6),0 0 18px rgba(201,40,60,.5)}}
`;
