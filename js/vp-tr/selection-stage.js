// ══════════════════════════════════════════════════════════════════════
// vp-tr/selection-stage.js — the Selection, played at the Round Table
// ══════════════════════════════════════════════════════════════════════
//
// The real format: the cast sit round the Round Table, blindfolded, and the
// host walks slowly round behind the chairs; a hand on the shoulder makes a
// Traitor. This plays the Selection page's own beats (`selectionStageData`)
// in the chamber, and the motion carries it rather than the text: the
// blindfolds slide on round the ring, the host WALKS behind the chairs with a
// candle and stops where the page says a hand landed, the shoulder takes the
// tap, the bands come off, and the camera cuts to the turret where the chosen
// arrive one at a time. A tap this observer never learned has no name, and
// the host simply stops somewhere and walks on.
//
// Like every other file in this directory it imports no engine state.
import { selectionStageData } from './selection.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face, trsLater as later } from './castle-stage.js';
import { TRScenery } from './cutaway-scenery.js';
import { beatLines } from './stage-lines.js';
import { footCard, playCard, CARD_CSS } from './stage-cards.js';
import { trPlay } from './sfx.js';
import { confessional, cutIn as cutInCard } from './stage-cutin.js';
import { CLOAK, TRC_PLATE, TRC_PLATE_TABLE, trcSeatAt, trcOnPlate } from './conclave-stage.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

// parts of the page this stage draws itself, or that are furniture here
const SKIP_PARTS = new Set(['sums', 'place', 'who', 'three', 'both', 'anon']);
function parse(data) {
  return beatLines(data.beats, (n, part) => {
    if (part === 'both') {
      const cap = n.querySelector('.tp-both-cap');
      return cap ? [{ t: 'narr', tag: 'What you now have', text: clean(cap.textContent), aud: true }] : [];
    }
    if (SKIP_PARTS.has(part)) return [];
    if (part === 'cam') {
      return [{ t: 'cam', who: clean(n.querySelector('cite')?.textContent),
        text: clean(n.querySelector('.tp-cam-txt')?.textContent).replace(/^[“"]+|[”"]+$/g, '') }];
    }
    if (part === 'veil') {
      const p = n.querySelector('p');
      return [{ t: 'narr', tag: clean(n.querySelector('.tp-veil-h')?.textContent), text: clean(p?.textContent) }];
    }
    return null;
  });
}

export function selectionStageScreen(ep, observer, pageHtml) {
  const rec = ep && ep.tr && ep.tr.selection;
  if (!rec || !(rec.taps || []).length) return pageHtml;
  const init = () => {
    const data = selectionStageData(ep, observer);
    return data ? { data, steps: parse(data) } : { steps: [] };
  };
  const uid = 'trp-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: 'The Selection',
    day: (ep.tr && ep.tr.ep) || ep.num, pot: null, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="tps"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CSS), pageHtml);
}

// ── THE RING: equal distances round the edge (see table-stage.js) ────────
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
  // a point on the ring at fraction f round it (0 = the head), pushed out by `out`
  const at = (f, out = 1) => {
    const want = ((f % 1) + 1) % 1 * total;
    let lo = 0, hi = N;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (len[mid] < want) lo = mid + 1; else hi = mid; }
    const a = ang[lo];
    return { x: cx + rx * out * Math.cos(a), y: cy + ry * out * Math.sin(a) };
  };
  return { at, gap: total / slots, seat: k => k / slots };
}

// What is true at step idx: blindfolded, who has been tapped, where the host
// is heading, whether we are upstairs.
function stateAt(S) {
  const D = S.data;
  let blind = false, turret = false, walking = false, host = 0, tapped = [], lastTap = null;
  const slots = D.line.length + 1;
  const seatOf = name => { const i = D.line.indexOf(name); return i < 0 ? null : (i + 1) / slots; };
  for (let k = 0; k <= S.idx; k++) {
    const s = S.steps[k], m = s.meta || {};
    const first = (S.steps[k - 1] || {}).beat !== s.beat;
    if (m.kind === 'blindfold' || m.kind === 'rank') blind = true;
    if (m.kind === 'walk' && first) { walking = true; host = Math.max(host, 0.5 / slots); }
    if (m.kind === 'tap' && first) {
      const t = D.taps.find(x => x.order === m.order) || {};
      if (t.name && seatOf(t.name) != null) { host = seatOf(t.name); tapped.push(t.name); lastTap = t.name; }
      else host = Math.min(0.98, host + 0.17);
    } else if (walking && !turret && s.t === 'host' && m.kind !== 'tap' && blind) {
      host = Math.min(0.98, host + 0.35 / slots);
    }
    if (m.kind === 'unmask' || m.kind === 'veil') { blind = false; walking = false; host = 0; }
    if (m.kind === 'turret' || m.kind === 'meeting' || m.kind === 'tcams' || m.kind === 'count' || m.kind === 'both' || m.kind === 'close') turret = true;
  }
  const cur = S.steps[S.idx] || {};
  const freshTap = (cur.meta || {}).kind === 'tap' && (S.steps[S.idx - 1] || {}).beat !== cur.beat ? lastTap : null;
  return { blind, turret, walking, host, tapped, freshTap };
}

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.tps');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const D = S.data, slots = D.line.length + 1, R = ring(slots, W, H);
  root.querySelectorAll('.trs-seg').forEach(s => { s.classList.remove('trs-done'); s.classList.toggle('trs-now', S.idx >= 0 && s.dataset.k === 'table'); });
  // persistent layers, so the host's walk and the cut to the turret animate
  if (!el.querySelector('.tps-host') || el.dataset.w !== String(W)) {
    el.dataset.w = String(W);
    el.innerHTML = '<div class="tps-set"></div><div class="tps-ring"></div><div class="tps-host"></div>'
      + '<div class="tps-turret"></div><div class="tps-hud"></div>';
    el.querySelector('.tps-set').innerHTML = TRScenery.roundTableSet(W, H)
      + TRScenery.roundTable(W * .5, H * (TABLE_CY + .005), W * .3, H * .16, slots);
    el.querySelector('.tps-host').innerHTML = `<div class="tps-glow"></div><div class="tps-hav">${face(D.host.name, D.host.slug)}</div>`;
    S.hostF = 0;
  }
  const ringEl = el.querySelector('.tps-ring'), hostEl = el.querySelector('.tps-host'),
    tur = el.querySelector('.tps-turret'), hud = el.querySelector('.tps-hud');
  const start = root.querySelector('.trs-start');
  const r = S.idx >= 0 ? stateAt(S) : { blind: false, turret: false, host: 0, tapped: [], freshTap: null };
  const st = S.idx >= 0 ? S.steps[S.idx] : null;
  // THE SEATS
  const pw = Math.min(H * .085, R.gap * .56);
  const firstOfBeat = st && (S.steps[S.idx - 1] || {}).beat !== st.beat;
  const bandsFresh = fresh && st && firstOfBeat && (st.meta || {}).kind === 'blindfold';
  const unmaskFresh = fresh && st && firstOfBeat && (st.meta || {}).kind === 'unmask';
  ringEl.innerHTML = D.line.map((n, i) => {
    const p = R.at((i + 1) / slots);
    const marked = D.isAudience && r.tapped.includes(n);
    const cls = ['tps-seat', r.blind ? 'tps-blind' : '', marked ? 'tps-marked' : '',
      fresh && r.freshTap === n ? 'tps-tapnow' : '', bandsFresh ? 'tps-bandin' : '', unmaskFresh ? 'tps-bandout' : ''].join(' ');
    return `<div class="${cls}" style="left:${p.x}px;top:${p.y}px;width:${pw}px;z-index:${100 + Math.round(p.y)};--d:${(i * 0.09).toFixed(2)}s">`
      + `<div class="tps-av">${face(n)}<i class="tps-band"></i></div><div class="tps-nm">${esc(n)}</div></div>`;
  }).join('');
  // THE HOST, walking behind the chairs, from where they were to where they go
  const target = r.host;
  const from = S.hostF == null ? 0 : S.hostF;
  const place = f => { const p = R.at(f, 1.2); hostEl.style.left = p.x + 'px'; hostEl.style.top = p.y + 'px'; hostEl.style.zIndex = String(100 + Math.round(p.y)); };
  if (S.walkRaf) cancelAnimationFrame(S.walkRaf);
  if (fresh && Math.abs(target - from) > 0.002 && !r.turret) {
    const dist = Math.abs(target - from), dur = Math.max(900, dist * 9000), t0 = performance.now();
    hostEl.classList.add('tps-walking');
    let lastStep = -1;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      place(from + (target - from) * e);
      const step = Math.floor((now - t0) / 1300);
      if (step !== lastStep && k < 1) { lastStep = step; trPlay('tr-footsteps'); }
      if (k < 1) S.walkRaf = requestAnimationFrame(tick);
      else { hostEl.classList.remove('tps-walking'); if (r.freshTap) { trPlay('tr-tap'); ringEl.querySelector('.tps-tapnow')?.classList.add('tps-landed'); } }
    };
    S.walkRaf = requestAnimationFrame(tick);
  } else {
    place(target);
    hostEl.classList.remove('tps-walking');
    if (r.freshTap && fresh) { trPlay('tr-tap', 300); later(S, () => ringEl.querySelector('.tps-tapnow')?.classList.add('tps-landed'), 300); }
    else ringEl.querySelectorAll('.tps-tapnow').forEach(x => x.classList.add('tps-landed'));
  }
  S.hostF = target;
  hostEl.classList.toggle('tps-away', !!r.turret);
  // THE TURRET: the chosen, arriving one at a time under the lamp
  if (r.turret && D.turret && D.turret.length) {
    if (!tur.classList.contains('tps-on')) {
      // THE SAME TURRET AS THE CONCLAVE (assets/sets/traitors): the room, the
      // chosen standing round the far side of the table, and the table in front
      const pw = trcOnPlate(0, 0, W, H).k * 1080 * .21, ph = pw * 1.5;
      tur.innerHTML = `<img class="tps-plate" src="${TRC_PLATE}" alt="">` + '<div class="tps-cloaks">' + D.turret.map((n, i) => {
        const p = trcSeatAt(i, D.turret.length, W, H);
        return `<div class="tps-cloak" data-n="${esc(n)}" style="left:${p.x - pw / 2}px;top:${p.y - ph / 2}px;width:${pw}px">`
          + `${CLOAK}<div class="tps-cav">${face(n)}</div><div class="tps-cnm">${esc(n)}</div></div>`;
      }).join('') + '</div>' + `<img class="tps-plate tps-front" src="${TRC_PLATE_TABLE}" alt="">`;
      tur.classList.add('tps-on');
      if (fresh) trPlay('tr-door');
    }
    // WHO IS UP THE STAIR YET: through the first meeting, a cloak is there
    // once its owner has spoken or is about to be spoken to; before it, the
    // room is empty; after it, everybody is in it
    const meetIdx = S.steps.map((x, k) => (x.t === 'say' && (x.meta || {}).kind === 'turret' ? k : -1)).filter(k => k >= 0);
    let here;
    if (!meetIdx.length || S.idx > meetIdx[meetIdx.length - 1]) here = new Set(D.turret);
    else here = new Set(S.steps.slice(0, S.idx + 2).filter((x, k) => meetIdx.includes(k)).map(x => x.who));
    tur.querySelectorAll('.tps-cloak').forEach(c => {
      const was = c.classList.contains('tps-here'), now = here.has(c.dataset.n);
      c.classList.toggle('tps-here', now);
      c.classList.toggle('tps-new', now && !was && fresh);
      if (now && !was && fresh) trPlay('tr-footsteps');
    });
  } else { tur.classList.remove('tps-on'); tur.innerHTML = ''; }
  // sounds of the ring
  if (bandsFresh) trPlay('tr-hush');
  if (unmaskFresh) trPlay('tr-letter');
  if (!st) {
    hud.innerHTML = '';
    start.innerHTML = `<b>The Selection</b><span>${D.line.length} at the table · press Next, or click the room</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  // TO CAMERA: a Traitor upstairs under the hood, a Faithful downstairs in blue
  const prevSt = S.steps[S.idx - 1] || {};
  let cut = st.t === 'cam' ? confessional({ who: st.who, fresh: fresh && prevSt.t !== 'cam' }) : '';
  // THE FIRST MEETING IS A BIG MOMENT: each line gets the band, under the hood,
  // the one it is said to waiting opposite
  if (st.t === 'say' && (st.meta || {}).kind === 'turret') {
    const next = S.steps[S.idx + 1] || {};
    const other = [prevSt, next].find(x => x.beat === st.beat && x.t === 'say' && x.who && x.who !== st.who);
    cut = cutInCard({ who: st.who, fresh, tone: 'blood', hood: true, with: other ? other.who : null,
      quick: prevSt.t === 'say' && prevSt.beat === st.beat });
  }
  // the first meeting is live: the one speaking steps forward in the turret
  tur.querySelectorAll('.tps-cloak').forEach(c => {
    c.classList.toggle('tps-speaking', st.t === 'say' && c.dataset.n === st.who);
    c.classList.toggle('tps-listen', st.t === 'say' && c.dataset.n !== st.who);
  });
  tur.classList.toggle('tps-dim', !!cut);
  hud.innerHTML = cut + footCard(st, D.host, { over: r.turret });
  playCard(hud, st, S, fresh);
  const corner = root.querySelector('.trs-corner');
  corner.innerHTML = r.turret ? 'The turret · <b>The chosen</b>'
    : `The Round Table · <b>${r.blind ? (r.tapped.length || r.walking ? 'The walk' : 'Blindfolds on') : 'The Selection'}</b>`;
  corner.classList.add('trs-in');
}

const CSS = `
.tps{position:absolute;inset:0;overflow:hidden}
.tps-set,.tps-ring,.tps-turret,.tps-hud{position:absolute;inset:0}
.tps-hud{pointer-events:none}.tps-hud>*{pointer-events:auto}
.tps-seat{position:absolute;transform:translate(-50%,-50%);text-align:center;transition:filter .5s}
.tps-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#141922;
  box-shadow:0 0 0 2px rgba(222,214,196,.35),0 8px 20px rgba(0,0,0,.8)}
.tps-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.tps-nm{display:inline-block;margin-top:4px;padding:2px 7px;white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:9.5px;
  letter-spacing:.14em;text-transform:uppercase;color:#ded6c4;background:rgba(4,7,5,.74);border:1px solid rgba(222,214,196,.17)}
/* the blindfold: black cloth across the eyes, tied at the back */
.tps-band{position:absolute;left:-6%;right:-6%;top:27%;height:17%;z-index:3;transform:scaleX(0);transform-origin:0 50%;
  background:linear-gradient(180deg,#1a1a1c,#050506 60%,#1a1a1c);box-shadow:0 2px 6px rgba(0,0,0,.7);border-radius:3px}
.tps-seat.tps-blind .tps-band{transform:scaleX(1)}
.tps-seat.tps-bandin .tps-band{animation:tpsBandIn .6s cubic-bezier(.2,.9,.3,1) both;animation-delay:var(--d)}
@keyframes tpsBandIn{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.tps-seat.tps-bandout .tps-band{animation:tpsBandOut .7s ease both;animation-delay:var(--d)}
@keyframes tpsBandOut{from{transform:scaleX(1);opacity:1}to{transform:translateY(-40%) scaleX(1);opacity:0}}
.tps-seat.tps-blind{filter:brightness(.8) saturate(.8)}
/* the audience's knowledge: a thin red rim on the tapped */
.tps-seat.tps-marked .tps-av{box-shadow:0 0 0 2px rgba(201,40,60,.85),0 0 18px rgba(201,40,60,.45),0 8px 20px rgba(0,0,0,.8)}
/* the hand landing */
.tps-seat.tps-tapnow::after{content:"";position:absolute;left:50%;top:44%;width:0;height:0;border-radius:50%;transform:translate(-50%,-50%);opacity:0}
.tps-seat.tps-tapnow.tps-landed::after{animation:tpsTap 1.1s ease-out}
@keyframes tpsTap{0%{opacity:1;width:10px;height:10px;box-shadow:0 0 0 2px rgba(255,219,149,.95),0 0 30px rgba(255,219,149,.8)}
  100%{opacity:0;width:190%;height:190%;box-shadow:0 0 0 2px rgba(255,219,149,0),0 0 30px rgba(255,219,149,0)}}
.tps-seat.tps-tapnow.tps-landed{animation:tpsJolt .35s ease}
@keyframes tpsJolt{30%{transform:translate(-50%,-46%)}}
/* the host, behind the chairs, carrying the only light */
.tps-host{position:absolute;width:64px;transform:translate(-50%,-50%);transition:opacity .8s}
.tps-host.tps-away{opacity:0}
.tps-glow{position:absolute;left:50%;top:50%;width:360px;height:360px;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(255,210,140,.28),rgba(255,210,140,.08) 45%,transparent 70%)}
.tps-hav{position:relative;width:64px;height:72px;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#141922;
  box-shadow:0 0 0 2px #fff3d2,0 0 26px rgba(255,219,149,.6)}
.tps-hav img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.tps-host.tps-walking .tps-hav{animation:tpsStep .65s ease-in-out infinite}
@keyframes tpsStep{50%{transform:translateY(-4px)}}
/* the turret */
.tps-turret{opacity:0;transition:opacity 1s;pointer-events:none;z-index:2000}
.tps-turret.tps-on{opacity:1}
.tps-plate{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none}
.tps-front{z-index:3}
.tps-cloaks{position:absolute;inset:0}
.tps-cloak{position:absolute;aspect-ratio:100/150;text-align:center;opacity:0;transition:opacity .4s}
.tps-cloak.tps-here{opacity:1}
.tps-cloak.tps-new{animation:tpsArrive 1s ease both}
.tps-cloak.tps-speaking{transform:scale(1.14);filter:drop-shadow(0 0 26px rgba(201,40,60,.8));z-index:2}
.tps-cloak.tps-listen{filter:brightness(.55)}
.tps-cloak{transition:opacity .4s,transform .4s,filter .4s}
.tps-turret.tps-dim .tps-cloaks,.tps-turret.tps-dim>.tps-plate{filter:brightness(.45) blur(2px);transition:filter .5s}
.tps-cloak .trc-cloak{position:absolute;left:0;top:0;width:100%;height:auto;filter:drop-shadow(0 14px 18px rgba(0,0,0,.8))}
@keyframes tpsArrive{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.tps-hood{position:absolute;left:-22%;right:-22%;top:-18%;height:92%;border-radius:50% 50% 30% 30%/60% 60% 20% 20%;z-index:2;pointer-events:none;
  background:radial-gradient(60% 70% at 50% 62%,transparent 50%,#2a0508 53%,#12030a 100%)}
.tps-cav{position:absolute;left:26%;top:16%;width:48%;aspect-ratio:1/1.1;overflow:hidden;border-radius:50% 50% 44% 44%;background:#140608;box-shadow:0 0 18px rgba(0,0,0,.9) inset}
.tps-cav img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.tps-cnm{position:absolute;left:50%;top:-9%;transform:translateX(-50%);white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#f3dcd8}
@media (prefers-reduced-motion:reduce){.tps-seat .tps-band{animation:none!important}.tps-cloak{animation:none!important}}
`;
