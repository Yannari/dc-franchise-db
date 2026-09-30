// ══════════════════════════════════════════════════════════════════════
// vp-tr/arrival-stage.js — the Arrival, played on the gravel and at the table
// ══════════════════════════════════════════════════════════════════════
//
// Plays the Arrival page's own beats (`arrivalStageData`) as two places. The
// front of the castle first: each car rolls up the gravel, and each person
// steps out of it and takes a place along the terrace while the camera goes
// in close on them. Then the great doors, and the chamber: everybody finds a
// chair round the Round Table, the host speaks from the head of it (the camera
// goes to them for every rule), and on the last beat a folded blindfold lands
// in front of every chair.
//
// Like every other file in this directory it imports no engine state.
import { arrivalStageData } from './arrival.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face } from './castle-stage.js';
import { TRScenery } from './cutaway-scenery.js';
import { beatLines } from './stage-lines.js';
import { footCard, playCard, CARD_CSS } from './stage-cards.js';
import { trPlay } from './sfx.js';
import { cutIn as cutInCard } from './stage-cutin.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

// ON THE STAGE AN ARRIVAL IS WHAT THEY DO AND SAY, NOT WHAT THE NARRATOR
// THINKS OF THEM. The page gives every person their entrance, a confessional,
// three reads of their game and the first exchange on the gravel; played one
// at a time the reads are a hundred steps of analysis before anybody reaches
// the table. So the stage plays the entrance (under their name), what they say
// to camera, and what is said between them and whoever they walk into — and
// leaves the reads (`data-k` profile/personality/threat/record) to the page.
const READS = new Set(['establish', 'profile', 'personality', 'threat', 'record']);
const unq = t => clean(t).replace(/^[“"]+|[”"]+$/g, '');

function parse(data) {
  // the host's stage directions: the first sets the scene, the rest are on
  // the page (the stage already shows the host speaking)
  let hostActs = 0;
  const steps = beatLines(data.beats, (n, part) => {
    if (part === 'sums' || part === 'who') return [];
    if (n.tagName === 'P' && READS.has(n.dataset.k)) return [];
    if (part === 'cam') {
      return [{ t: 'cam', who: clean(n.querySelector('cite')?.textContent), text: unq(n.querySelector('.ar-cam-txt')?.textContent) }];
    }
    if (part === 'host') {
      const out = [];
      const act = clean(n.querySelector('.ar-host-do')?.textContent);
      if (act && !hostActs++) out.push({ t: 'narr', tag: 'The host', text: act });
      const line = unq(n.querySelector('.ar-host-line')?.textContent);
      if (line) out.push({ t: 'host', text: line });
      return out;
    }
    return null;
  });
  // the entrance carries the person's name
  return steps.map((st, i) => (st.kind === 'intro' && (steps[i - 1] || {}).beat !== st.beat
    ? { ...st, tag: st.meta.name } : st));
}

export function arrivalStageScreen(ep, observer, pageHtml) {
  const rec = ep && ep.tr && ep.tr.arrival;
  if (!rec || !(rec.introductions || []).length) return pageHtml;
  const init = () => {
    const data = arrivalStageData(ep, observer);
    return data ? { data, steps: parse(data) } : { steps: [] };
  };
  const uid = 'tra-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: 'The Arrival',
    day: (ep.tr && ep.tr.ep) || ep.num, pot: null, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="tpa"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CSS), pageHtml);
}

// ── THE RING (as selection-stage.js) ─────────────────────────────────────
const TABLE_CY = .44;
function ring(slots, W, H) {
  const cx = W * .5, cy = H * TABLE_CY, rx = W * .4, ry = H * .24, N = 720;
  const ang = [], len = [0];
  let px = cx + rx * Math.cos(-Math.PI / 2), py = cy + ry * Math.sin(-Math.PI / 2);
  for (let i = 0; i <= N; i++) {
    const a = -Math.PI / 2 + i / N * Math.PI * 2;
    const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
    ang.push(a);
    if (i) len.push(len[i - 1] + Math.hypot(x - px, y - py));
    px = x; py = y;
  }
  const total = len[N];
  const at = (f, out = 1) => {
    const want = ((f % 1) + 1) % 1 * total;
    let lo = 0, hi = N;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (len[mid] < want) lo = mid + 1; else hi = mid; }
    const a = ang[lo];
    return { x: cx + rx * out * Math.cos(a), y: cy + ry * out * Math.sin(a) };
  };
  return { at, gap: total / slots };
}

// What is true at step idx: outside or in, who is out of the cars, which car
// is on the gravel, whether the blindfolds are down.
function stateAt(S) {
  let inside = false, car = null, cars = 0, out = [], cloths = false, newest = null;
  for (let k = 0; k <= S.idx; k++) {
    const m = S.steps[k].meta || {};
    if (m.kind === 'car') { car = m.id; cars++; newest = null; }
    if (m.kind === 'intro' && !out.includes(m.name)) { out.push(m.name); newest = m.name; }
    if (m.kind === 'gather' || m.kind === 'briefing' || m.kind === 'rule' || m.kind === 'line') inside = true;
    if (m.kind === 'line') cloths = true;
  }
  return { inside, car, cars, out, cloths, newest };
}

// the terrace line: arrivals stand along the gravel in the order they came
function terraceAt(i, n, W, H) {
  const per = Math.min(W * .075, (W * .84) / Math.max(1, n));
  const x0 = W / 2 - per * (n - 1) / 2;
  return { x: x0 + per * i, y: H * (.7 + (i % 2) * .045), w: Math.min(H * .1, per * .86) };
}

const CAR = `<svg viewBox="0 0 220 80" width="100%" height="100%"><defs>
  <linearGradient id="tpaBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3140"/><stop offset=".6" stop-color="#0e121a"/><stop offset="1" stop-color="#05070b"/></linearGradient>
  <radialGradient id="tpaLamp"><stop offset="0" stop-color="#fff6d8"/><stop offset=".4" stop-color="rgba(255,226,160,.6)"/><stop offset="1" stop-color="rgba(255,226,160,0)"/></radialGradient></defs>
  <path d="M8 54 L14 38 Q20 30 40 28 L66 12 Q74 8 92 8 L150 8 Q166 8 176 20 L190 30 Q210 32 214 44 L214 56 Q214 62 206 62 L14 62 Q8 62 8 54Z" fill="url(#tpaBody)"/>
  <path d="M72 14 L92 12 L92 30 L52 30Z M98 12 L146 12 Q158 12 166 22 L172 30 L98 30Z" fill="#8fa3bd" opacity=".35"/>
  <path d="M14 42 L210 42" stroke="rgba(255,255,255,.08)"/>
  <circle cx="52" cy="62" r="13" fill="#050608"/><circle cx="52" cy="62" r="6" fill="#3a4250"/>
  <circle cx="170" cy="62" r="13" fill="#050608"/><circle cx="170" cy="62" r="6" fill="#3a4250"/>
  <circle cx="211" cy="44" r="16" fill="url(#tpaLamp)"/><rect x="205" y="41" width="8" height="5" rx="2" fill="#fff6d8"/>
  <rect x="8" y="42" width="5" height="6" fill="#c9283c"/></svg>`;

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.tpa');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const D = S.data, slots = D.names.length + 1, R = ring(slots, W, H);
  root.querySelectorAll('.trs-seg').forEach(s => { s.classList.remove('trs-done'); s.classList.toggle('trs-now', S.idx >= 0); });
  if (!el.querySelector('.tpa-out') || el.dataset.w !== String(W)) {
    el.dataset.w = String(W);
    el.innerHTML = '<div class="tpa-out"><div class="tpa-cam"><div class="tpa-set"></div><div class="tpa-car"></div><div class="tpa-folk"></div></div></div>'
      + '<div class="tpa-in"><div class="tpa-cam"><div class="tpa-set"></div><div class="tpa-cloths"></div><div class="tpa-ring"></div><div class="tpa-host"></div></div></div>'
      + '<div class="tpa-hud"></div>';
    el.querySelector('.tpa-out .tpa-set').innerHTML = TRScenery.facade();
    el.querySelector('.tpa-in .tpa-set').innerHTML = TRScenery.roundTableSet(W, H)
      + TRScenery.roundTable(W * .5, H * (TABLE_CY + .005), W * .3, H * .16, slots);
    const hp = R.at(0, 1.12);
    const hostEl = el.querySelector('.tpa-host');
    hostEl.style.left = hp.x + 'px'; hostEl.style.top = hp.y + 'px';
    hostEl.innerHTML = `<div class="tpa-glow"></div><div class="tpa-hav">${face(D.host.name, D.host.slug)}</div><div class="tpa-nm tpa-hnm">${esc(D.host.name)}</div>`;
    S.lastCars = 0; S.wasInside = false; S.wasCloths = false;
  }
  const outEl = el.querySelector('.tpa-out'), inEl = el.querySelector('.tpa-in'), hud = el.querySelector('.tpa-hud');
  const camOut = outEl.querySelector('.tpa-cam'), camIn = inEl.querySelector('.tpa-cam');
  const carEl = outEl.querySelector('.tpa-car'), folk = outEl.querySelector('.tpa-folk');
  const ringEl = inEl.querySelector('.tpa-ring'), cloths = inEl.querySelector('.tpa-cloths');
  const start = root.querySelector('.trs-start');
  const r = S.idx >= 0 ? stateAt(S) : { inside: false, car: null, cars: 0, out: [], cloths: false, newest: null };
  const st = S.idx >= 0 ? S.steps[S.idx] : null;
  const m = (st && st.meta) || {};
  const firstOfBeat = st && (S.steps[S.idx - 1] || {}).beat !== st.beat;

  // ── OUTSIDE: the car, the people out of it ──────────────────────────
  const carW = Math.min(W * .3, 300);
  carEl.style.width = carW + 'px'; carEl.style.height = carW * 80 / 220 + 'px';
  carEl.style.top = (H * .79) + 'px';
  if (!carEl.firstChild) carEl.innerHTML = CAR;
  if (r.cars > S.lastCars && fresh && m.kind === 'car') {
    // the next car in: it rolls up from the left and stops at the door
    carEl.classList.remove('tpa-roll'); void carEl.offsetWidth; carEl.classList.add('tpa-roll');
    trPlay('tr-gravel');
  }
  S.lastCars = r.cars;
  const n = Math.max(1, D.names.length);
  folk.innerHTML = r.out.map((name, i) => {
    const p = terraceAt(i, n, W, H);
    const isNew = name === r.newest && fresh && m.kind === 'intro' && firstOfBeat;
    return `<div class="tpa-p${name === r.newest ? ' tpa-now' : ''}${isNew ? ' tpa-step' : ''}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;`
      + `--fx:${(W * .5 - p.x).toFixed(0)}px;z-index:${Math.round(p.y)}">`
      + `<div class="tpa-av">${face(name)}</div><div class="tpa-nm">${esc(name)}</div></div>`;
  }).join('');
  if (fresh && m.kind === 'intro' && firstOfBeat) trPlay('tr-footsteps', 250);
  // camera: in close on whoever just stepped out; back for a car or the drive
  const k = 1.7;
  if (!r.inside && r.newest && m.kind === 'intro') {
    const p = terraceAt(r.out.indexOf(r.newest), n, W, H);
    const tx = W / 2 - p.x * k, ty = H * .42 - p.y * k;
    camOut.style.transform = `translate(${Math.min(0, Math.max(W - W * k, tx))}px,${Math.min(0, Math.max(H - H * k, ty))}px) scale(${k})`;
    camOut.classList.add('tpa-close');
  } else { camOut.style.transform = ''; camOut.classList.remove('tpa-close'); }

  // ── INSIDE: the chamber ────────────────────────────────────────────
  outEl.classList.toggle('tpa-gone', r.inside);
  inEl.classList.toggle('tpa-on', r.inside);
  const cutIn = r.inside && !S.wasInside && fresh;
  if (cutIn) trPlay('tr-door');
  const pw = Math.min(H * .085, R.gap * .56);
  ringEl.innerHTML = r.inside ? D.names.map((name, i) => {
    const p = R.at((i + 1) / slots);
    return `<div class="tpa-seat${cutIn ? ' tpa-sit' : ''}" style="left:${p.x}px;top:${p.y}px;width:${pw}px;z-index:${100 + Math.round(p.y)};--d:${(0.5 + i * 0.07).toFixed(2)}s">`
      + `<div class="tpa-av">${face(name)}</div><div class="tpa-nm">${esc(name)}</div></div>`;
  }).join('') : '';
  const clothsFresh = r.cloths && !S.wasCloths && fresh;
  cloths.innerHTML = r.cloths ? D.names.map((_, i) => {
    const p = R.at((i + 1) / slots, .78);
    return `<i class="tpa-cloth${clothsFresh ? ' tpa-drop' : ''}" style="left:${p.x}px;top:${p.y}px;--d:${(i * 0.08).toFixed(2)}s"></i>`;
  }).join('') : '';
  if (clothsFresh) trPlay('tr-hush');
  S.wasInside = r.inside; S.wasCloths = r.cloths;
  // camera: the host holds the room while they speak
  const hostSpeaks = r.inside && st && st.t === 'host';
  if (hostSpeaks) {
    const hp = R.at(0, 1.12), kk = 1.45;
    const tx = W / 2 - hp.x * kk, ty = H * .36 - hp.y * kk;
    camIn.style.transform = `translate(${Math.min(0, Math.max(W - W * kk, tx))}px,${Math.min(0, Math.max(H - H * kk, ty))}px) scale(${kk})`;
  } else camIn.style.transform = '';
  inEl.querySelector('.tpa-host').classList.toggle('tpa-speak', !!hostSpeaks);

  if (!st) {
    hud.innerHTML = '';
    start.innerHTML = `<b>The Arrival</b><span>${D.names.length} coming up the drive · press Next, or click the view</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  // SAID ON THE GRAVEL, OR TO CAMERA: a cut-in, the other one in the exchange
  // waiting on the right, the drive gone soft behind them
  let cut = '';
  if (st.t === 'say' || st.t === 'cam') {
    const prev = S.steps[S.idx - 1] || {}, next = S.steps[S.idx + 1] || {};
    const partner = [prev, next].find(x => x.beat === st.beat && x.t === 'say' && x.who && x.who !== st.who);
    cut = cutInCard({ who: st.who, fresh, tone: st.t === 'cam' ? 'cam' : 'morning', label: st.t === 'cam' ? 'To camera' : null,
      with: st.t === 'say' && partner ? partner.who : null,
      quick: st.t === 'say' && prev.t === 'say' && prev.beat === st.beat });
  }
  outEl.classList.toggle('tpa-dim', !!cut);
  hud.innerHTML = cut + footCard(st, D.host);
  playCard(hud, st, S, fresh);
  const corner = root.querySelector('.trs-corner');
  corner.innerHTML = r.inside ? `The Round Table · <b>${r.cloths ? 'Blindfolds' : 'The rules'}</b>`
    : `The front door · <b>${r.out.length} of ${D.names.length} here</b>`;
  corner.classList.add('trs-in');
}

const CSS = `
.tpa{position:absolute;inset:0;overflow:hidden;background:#05070d}
.tpa-out,.tpa-in,.tpa-hud{position:absolute;inset:0}
.tpa-cam{position:absolute;inset:0;transform-origin:0 0;transition:transform 1.2s cubic-bezier(.65,0,.25,1)}
.tpa-set,.tpa-folk,.tpa-ring,.tpa-cloths{position:absolute;inset:0}
.tpa-hud{pointer-events:none;z-index:3000}.tpa-hud>*{pointer-events:auto}
/* the cut: the front of the castle falls away and the chamber comes up */
.tpa-out{transition:opacity 1.1s ease,filter 1.1s ease}
.tpa-out.tpa-dim .tpa-cam{filter:brightness(.42) blur(2px)}
.tpa-out.tpa-gone{opacity:0;filter:blur(4px) brightness(.4);pointer-events:none}
.tpa-in{opacity:0;transition:opacity 1.4s ease .5s;pointer-events:none}
.tpa-in.tpa-on{opacity:1;pointer-events:auto}
/* the lit door, and the gravel */
.tpa-door{position:absolute;width:9%;height:26%;transform:translate(-50%,-10%);border-radius:50% 50% 0 0/22% 22% 0 0;
  background:radial-gradient(80% 90% at 50% 100%,#ffe2a0,#e0a049 45%,#6a3a12);box-shadow:0 0 60px 20px rgba(255,200,120,.3);animation:tpaFlick 3.2s ease-in-out infinite}
@keyframes tpaFlick{50%{box-shadow:0 0 70px 26px rgba(255,200,120,.38)}}
.tpa-gravel{position:absolute;left:0;right:0;top:64%;bottom:0;background:linear-gradient(180deg,#3a342c,#1c1914);
  background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1.5px);background-size:7px 6px;opacity:.95}
/* the car: rolls in from the left and stops at the door */
.tpa-car{position:absolute;left:50%;transform:translate(-50%,-100%);opacity:0;z-index:5;filter:drop-shadow(0 10px 8px rgba(0,0,0,.75))}
/* in from the left, a stop at the door with the brake lights on, and away to the right */
.tpa-car.tpa-roll{animation:tpaRoll 6.5s cubic-bezier(.3,.6,.3,1) both}
@keyframes tpaRoll{0%{opacity:1;transform:translate(-50%,-100%) translateX(-120vw)}
  26%{transform:translate(-50%,-100%) translateX(10px)}30%{transform:translate(-50%,-100%)}
  72%{opacity:1;transform:translate(-50%,-100%)}100%{opacity:1;transform:translate(-50%,-100%) translateX(120vw)}}
/* the people on the gravel */
.tpa-p{position:absolute;transform:translate(-50%,-50%);text-align:center;transition:filter .6s}
.tpa-p.tpa-step{animation:tpaStep 1.1s cubic-bezier(.2,.8,.3,1) both}
@keyframes tpaStep{from{transform:translate(-50%,-50%) translateX(var(--fx)) scale(.7);opacity:0}to{transform:translate(-50%,-50%);opacity:1}}
.tpa-cam.tpa-close .tpa-p:not(.tpa-now){filter:brightness(.4) blur(1px)}
.tpa-p.tpa-now .tpa-av{box-shadow:0 0 0 2px #ffdb95,0 0 26px rgba(255,219,149,.55),0 8px 20px rgba(0,0,0,.8)}
.tpa-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#141922;
  box-shadow:0 0 0 2px rgba(222,214,196,.35),0 8px 20px rgba(0,0,0,.8)}
.tpa-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.tpa-nm{display:inline-block;margin-top:4px;padding:2px 7px;white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:9.5px;
  letter-spacing:.14em;text-transform:uppercase;color:#ded6c4;background:rgba(4,7,5,.74);border:1px solid rgba(222,214,196,.17)}
/* the chamber */
.tpa-seat{position:absolute;transform:translate(-50%,-50%);text-align:center}
.tpa-seat.tpa-sit{animation:tpaSit .8s cubic-bezier(.2,.8,.3,1) both;animation-delay:var(--d)}
@keyframes tpaSit{from{opacity:0;transform:translate(-50%,-50%) translateY(-26px)}to{opacity:1;transform:translate(-50%,-50%)}}
.tpa-host{position:absolute;width:66px;transform:translate(-50%,-50%);z-index:90;text-align:center}
.tpa-hnm{color:#ffdb95;border-color:rgba(255,219,149,.35);position:relative}
.tpa-glow{position:absolute;left:50%;top:50%;width:380px;height:380px;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(255,210,140,.26),rgba(255,210,140,.07) 45%,transparent 70%);transition:opacity .8s}
.tpa-hav{position:relative;width:66px;height:74px;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#141922;
  box-shadow:0 0 0 2px #fff3d2,0 0 26px rgba(255,219,149,.6)}
.tpa-hav img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.tpa-host.tpa-speak .tpa-glow{animation:tpaBreathe 2.4s ease-in-out infinite}
@keyframes tpaBreathe{50%{transform:translate(-50%,-50%) scale(1.12)}}
/* a folded blindfold in front of every chair */
.tpa-cloth{position:absolute;width:26px;height:9px;transform:translate(-50%,-50%) rotate(-8deg);border-radius:2px;z-index:95;
  background:linear-gradient(180deg,#26262a,#050506);box-shadow:0 2px 5px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.08)}
.tpa-cloth.tpa-drop{animation:tpaDrop .7s cubic-bezier(.3,1.4,.5,1) both;animation-delay:var(--d)}
@keyframes tpaDrop{from{opacity:0;transform:translate(-50%,-50%) translateY(-40px) rotate(-30deg)}to{opacity:1;transform:translate(-50%,-50%) rotate(-8deg)}}
@media (prefers-reduced-motion:reduce){.tpa-car,.tpa-p,.tpa-seat,.tpa-cloth{animation:none!important}.tpa-cam{transition:none}}
`;
