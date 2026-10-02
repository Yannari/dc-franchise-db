// ══════════════════════════════════════════════════════════════════════
// vp-ci/visit-stage.js — the visit: the hallway, the apartments, the door
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "the hallway is really ugly ... too black, the doors don't
// even look like doors"; "whose door? we should be in their apartment each
// time someone prepares themselves"; "the music should change after the door
// opens". Mockup: mockup/mockup-circle-blocking-visit.html (approved, with
// "more lights, like the Circle's animated neon").
//
//   the walk     the rendered hallway: a real camera move down it (below)
//   the waiting  each player in their own apartment (the room they moved into,
//                all season), their numbered door in view; a strip of who
//                is still waiting; the last one is the knock
//   the visit    the visited player's apartment, the door open behind, the
//                two of them on the couch
//
// The apartments are Blender renders too (2026-10-02; twelve rooms, each its
// own place; the user on the stylized 3D look: "yeah i love this"). Each has
// a closed-door shot and an open-door shot with the couch; the number plate
// and the knock sit on positions measured from the camera (parts.js ROOM_GEO).
import { esc, faceUrl, nameOf, realOf, isCatfish, bg, aptNo, roomImg, ROOM_GEO, geoStyle, dlg, cam, where, upTo } from './parts.js';
import { faceOf } from './steps.js';

// ── the hallway ───────────────────────────────────────────────────────
// Rendered in Blender (2026-10-02; user: the SVG hallway was "ugly ... the
// doors don't even look like doors"; the render, "I like it"). The walk is a
// real camera move down the hall (doors pass, the ring grows), played once
// and held on its last frame; scaling a still only wobbled in place. The clip
// is carried across redraws (stage.js paintStage keeps `video[data-keep]`), so
// it keeps walking while the lines advance. At rest it is a still: the start
// before the walk has begun, the end once it has.
export const HALL = { film: 'assets/sets/circle/hallway-walk.mp4', start: 'assets/sets/circle/hallway.webp', end: 'assets/sets/circle/hallway-end.webp' };
export function hallwayFilm(fresh, begun) {
  if (fresh) return `<video class="cvh-film" data-keep="ci-hall-walk" src="${HALL.film}" poster="${HALL.start}" autoplay muted playsinline preload="auto" aria-hidden="true"></video>`;
  return `<img class="cvh-film" src="${begun ? HALL.end : HALL.start}" alt="" aria-hidden="true">`;
}

// ── an apartment: the render, its number on the door, the knock ───────
function aptSet(row, h, { open = false, knock = false } = {}) {
  return `<img class="cva-set" src="${roomImg(row, h, open)}" alt="" aria-hidden="true">${open ? ''
    : `<div class="cva-plate" style="${geoStyle(ROOM_GEO.plate)}">${String(aptNo(row, h)).padStart(2, '0')}</div>`}${knock
    ? `<div class="cva-knock" style="${geoStyle(ROOM_GEO.door)}"></div>` : ''}`;
}

const WAIT = /^visit\.wait/;
const TOGETHER = /^visit\.(door|sit|talk|power|hand|kiss|bye|inperson\.bye)/;

/** The visit, from the walk to the goodbye. */
export function visitStage(row, screen, idx, fresh) {
  const st = idx >= 0 ? screen.steps[idx] : null;
  const [visitor, visited] = screen.who;
  const k = st?.key || '';
  const doorAt = screen.steps.findIndex(x => TOGETHER.test(x.key || ''));
  const together = doorAt >= 0 && idx >= doorAt && !/^visit\.(after|inperson\.after)/.test(k);
  // The door opened, the two of them in the visited player's apartment.
  if (together || /^visit\.(after|inperson\.after)/.test(k)) {
    const host = visited;
    const opening = fresh && idx === doorAt;
    const after = !together;
    const person = h => `<div class="cva-person${h === st?.who ? ' talk' : ''}">${cam(row, h, 'big', realOf(row, h).toUpperCase())}
      ${isCatfish(row, h) ? `<div class="cva-was fake">played as <b>${esc(nameOf(row, h))}</b> · catfish</div>` : `<div class="cva-was">the real ${esc(nameOf(row, h))}</div>`}</div>`;
    const who = after ? [st?.who || host] : [visitor, host];
    return `<div class="civ-layer cva visit${opening ? ' open' : ''}">${aptSet(row, host, { open: !after })}
      <div class="cva-two${after ? ' one' : ''}">${who.map(person).join('')}</div>
      ${opening ? '<div class="cva-flash"></div>' : ''}
      ${where(after ? 'AFTER THE VISIT' : `FACE TO FACE · ${realOf(row, host).toUpperCase()}'S APARTMENT`)}${dlg(row, st, fresh)}</div>`;
  }
  // Waiting: whoever the line is about, in their own apartment.
  const seen = upTo(screen, idx);
  const waiters = [...new Set(seen.filter(x => WAIT.test(x.key || '')).map(x => x.who).filter(Boolean))];
  // A stage direction in the wait keeps the camera in that apartment.
  const waiting = WAIT.test(k) ? (st.who || waiters.at(-1) || null) : null;
  if (waiting) {
    const lastWait = screen.steps.map(x => WAIT.test(x.key || '')).lastIndexOf(true);
    const knock = idx === lastWait && waiting === visited;
    const all = [...new Set(screen.steps.filter(x => WAIT.test(x.key || '')).map(x => x.who).filter(Boolean))];
    const strip = all.map(h => { const u = faceUrl(faceOf(row, h, 'cam')); return `<span class="${h === waiting ? 'on' : waiters.includes(h) ? 'seen' : ''}"${bg(u)}>${u ? '' : esc(realOf(row, h)[0] || '?')}</span>`; }).join('');
    return `<div class="civ-layer cva${fresh ? ' cut' : ''}">${aptSet(row, waiting, { knock })}
      <div class="cva-whose"><small>APARTMENT ${aptNo(row, waiting)}</small>${knock ? 'KNOCK KNOCK' : 'Whose door?'}</div>
      <div class="cva-strip">${strip}</div>
      <div class="cva-waitcam">${cam(row, waiting, '', `CAM ${aptNo(row, waiting)} · ${realOf(row, waiting).toUpperCase()}`)}</div>
      ${where('A VISIT · EVERYBODY WAITS')}${dlg(row, st, fresh)}</div>`;
  }
  // The walk: down the hallway, centred, the camera pushing in.
  return `<div class="civ-layer cvh">${hallwayFilm(fresh, idx >= 0)}
    <div class="cvh-walker">${cam(row, visitor, '', `THE HALLWAY · ${realOf(row, visitor).toUpperCase()}`)}</div>
    ${where('A VISIT · THE BLOCKED PLAYER WALKS')}${dlg(row, st, fresh)}</div>`;
}

export const VISIT_CSS = `
.cvh{background:#f4f2fa;overflow:hidden}
.cvh-film,.cva-set{position:absolute;inset:0;width:100%;height:100%}
.cva-set{object-fit:cover}
.cvh-film{object-fit:cover}
/* bottom-left, like every set's camera card: the walk heads for the ring, so nothing sits in front of it */
.cvh-walker{position:absolute;left:3%;bottom:5%;width:15cqw;z-index:5;animation:cvhStep 1.7s ease-in-out infinite}
.cvh-walker .civ-mcam{position:relative;width:100%;aspect-ratio:4/5}
@keyframes cvhStep{50%{transform:translateY(-1.2%)}}
.cva{overflow:hidden;background:#2a1a10}
.cva.cut{animation:cvaCut .45s ease-out both}
@keyframes cvaCut{from{filter:brightness(1.8)}}
.cva-plate{position:absolute;z-index:2;display:grid;place-items:center;font-weight:900;font-size:1.25cqw;letter-spacing:.04em;color:#3a2600}
.cva-knock{position:absolute;z-index:2;border-radius:.3cqw;box-shadow:0 0 3cqw 1cqw rgba(255,210,63,.55),inset 0 0 2cqw rgba(255,210,63,.35);animation:cvaKnock .5s ease-in-out 2,cvhBreathe 1s ease-in-out infinite}
@keyframes cvaKnock{25%{transform:translateX(.4%)}75%{transform:translateX(-.4%)}}
@keyframes cvhBreathe{50%{opacity:.45}}
.cva-whose{position:absolute;left:36%;top:56%;z-index:6;font-weight:900;font-size:3cqw;letter-spacing:.03em;text-shadow:0 0 2cqw rgba(0,0,0,.6)}
.cva-whose small{display:block;font-size:1cqw;letter-spacing:.2em;color:#ffe08a;margin-bottom:.4cqw}
.cva-strip{position:absolute;left:36%;top:72%;z-index:6;display:flex;gap:.8cqw}
.cva-strip span{display:grid;place-items:center;font-weight:900;font-size:1.6cqw;width:4.6cqw;aspect-ratio:4/5;border-radius:.6cqw;border:.2cqw solid rgba(255,255,255,.6);background:#1b1f45 center 22%/cover;opacity:.4}
.cva-strip span.seen{opacity:.7}.cva-strip span.on{opacity:1;box-shadow:0 0 1.4cqw #ffd23f;border-color:#ffd23f}
.cva-waitcam{position:absolute;right:7%;top:12%;width:18cqw;z-index:5}
.cva-waitcam .civ-mcam{position:relative;width:100%;aspect-ratio:4/5}
.cva-two{position:absolute;left:30%;right:30%;top:27%;z-index:5;display:flex;justify-content:space-between}
.cva-two.one{justify-content:center}
.cva-person{width:15cqw;transition:transform .4s}
.cva-person .civ-mcam{position:relative;width:100%;aspect-ratio:4/5}
.cva-person.talk{transform:translateY(-3%)}
.cva-was{margin:.6cqw auto 0;width:max-content;font-size:1cqw;font-weight:700;background:rgba(10,12,40,.75);border-radius:99px;padding:.25cqw .8cqw}
.cva-was.fake{background:rgba(120,10,60,.85)}.cva-was b{color:#ff9ad4}
.cva-flash{position:absolute;inset:0;z-index:20;background:#fff8e6;pointer-events:none;animation:civFbFlash .8s ease-out both}
.cva.open .cva-person{animation:civUp .6s .15s both}
@media (prefers-reduced-motion: reduce){.cvh-walker,.cva-knock{animation:none}}
`;
