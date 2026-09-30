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
    if (m.kind === 'turret' || m.kind === 'count' || m.kind === 'both' || m.kind === 'close') turret = true;
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
      tur.innerHTML = TRScenery.turretSet(W, H) + '<div class="tps-cloaks">' + D.turret.map((n, i) =>
        `<div class="tps-cloak" style="--d:${(0.8 + i * 0.9).toFixed(1)}s"><div class="tps-hood"></div><div class="tps-cav">${face(n)}</div><div class="tps-cnm">${esc(n)}</div></div>`).join('') + '</div>';
      tur.classList.add('tps-on');
      if (fresh) { trPlay('tr-door'); D.turret.forEach((_, i) => trPlay('tr-footsteps', 800 + i * 900)); }
    }
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
  hud.innerHTML = footCard(st, D.host, { over: r.turret });
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
.tps-cloaks{position:absolute;left:50%;top:50%;transform:translate(-50%,-55%);display:flex;gap:40px}
.tps-cloak{position:relative;width:110px;text-align:center;opacity:0;animation:tpsArrive 1s ease forwards;animation-delay:var(--d)}
@keyframes tpsArrive{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.tps-hood{position:absolute;left:-22%;right:-22%;top:-18%;height:92%;border-radius:50% 50% 30% 30%/60% 60% 20% 20%;z-index:2;pointer-events:none;
  background:radial-gradient(60% 70% at 50% 62%,transparent 50%,#2a0508 53%,#12030a 100%)}
.tps-cav{position:relative;width:110px;height:122px;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#140608;
  box-shadow:0 0 0 2px rgba(201,40,60,.7),0 0 40px rgba(142,21,38,.6)}
.tps-cav img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.tps-cnm{margin-top:10px;font-family:var(--v-display);font-weight:700;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#f3dcd8}
@media (prefers-reduced-motion:reduce){.tps-seat .tps-band{animation:none!important}.tps-cloak{animation:none;opacity:1}}
`;
