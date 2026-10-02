// ══════════════════════════════════════════════════════════════════════
// vp-tr/castle-stage.js — the castle day, played on a stage
// ══════════════════════════════════════════════════════════════════════
//
// The castle-day screens were long documents: every scene a card, read top to
// bottom. This plays the SAME scenes (castle-day.js `castleDayScenes`, the
// same composition and the same keys as the page) inside a cutaway of the
// castle: the camera flies to the room a scene is in, the people in it step
// in, the lines are typed out over whoever says them, a confessional cuts to
// the alcove, and what the scene moved rises as a notice. The old page stays
// underneath as the written transcript.
//
// ── THE LOOK ───────────────────────────────────────────────────────────
// The old viewer's own world, made to move: the lantern/vellum/wax tokens,
// Fraunces for titles, IM Fell for anything spoken, Cormorant for narration,
// the day as a clock, not a paragraph. The castle and its rooms are
// cutaway-scenery.js. Nothing here is borrowed from another show's stage.
//
// ── HOW IT RUNS ────────────────────────────────────────────────────────
// Perfect Match's pattern (vp-pm/screens.js): the markup is inert containers;
// state lives in `window.__trStage[uid]`; `paint` draws the WHOLE of step idx
// every time, so Next, Reveal all, a re-render and a resize all land on the
// same picture, and the one-shot motion (the fly-in, the typing, a notice
// rising) plays only on a fresh step.
//
// THE STATIC MARKUP CARRIES NO WORDS. Every label is drawn when the screen
// mounts. The text backlog reads each screen's markup as narration
// (screens.js `screenNarration`), and a stage whose chrome was in the string
// would print "Restart Next Reveal all" and the clock into the season's prose.
// The words the stage shows are the scene's own, already in the transcript
// underneath.
//
// Like every other file in this directory it imports no engine state.
import { castleDayScenes, castleDayChips } from './castle-day.js';
import { scriptParts } from './tidy.js';
import { playerAvatarUrl } from '../players.js';
import { TRScenery } from './cutaway-scenery.js';
// a cycle (stage-cutin imports this file's helpers), safe because both sides
// only read the other's bindings when a screen is built, never at load
import { cutIn, CUTIN_CSS } from './stage-cutin.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const reg = () => (typeof window !== 'undefined' ? (window.__trStage ||= {}) : {});
const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };

// ── THE CASTLE, in 1600 × 900 world units ────────────────────────────────
// A five-storey entrance tower with the turret and the alcove in it, a wing
// either side: bedrooms under the roof, the day rooms below. `grounds` is not a
// room — it frames the terrace and the gravel in front of the door.
const ROOMS = {
  turret: { x: 700, y: 170, w: 220, h: 120, type: 'turret', label: 'The turret' },
  alcove: { x: 700, y: 300, w: 220, h: 130, type: 'alcove', label: 'The alcove' },
  bedL1: { x: 200, y: 330, w: 240, h: 110, type: 'bed', label: 'A bedroom' },
  bedL2: { x: 450, y: 330, w: 240, h: 110, type: 'bed', label: 'A bedroom' },
  bedR1: { x: 930, y: 330, w: 240, h: 110, type: 'bed', label: 'A bedroom' },
  bedR2: { x: 1180, y: 330, w: 230, h: 110, type: 'bed', label: 'A bedroom' },
  library: { x: 200, y: 450, w: 240, h: 160, type: 'library', label: 'The library' },
  drawing: { x: 450, y: 450, w: 240, h: 160, type: 'drawing', label: 'The drawing room' },
  landing: { x: 700, y: 440, w: 220, h: 170, type: 'landing', label: 'The landing' },
  hall: { x: 930, y: 450, w: 480, h: 160, type: 'hall', label: 'The great hall' },
  kitchen: { x: 200, y: 620, w: 490, h: 165, type: 'kitchen', label: 'The kitchen' },
  front: { x: 700, y: 620, w: 220, h: 165, type: 'front', label: 'The front hall' },
  billiard: { x: 930, y: 620, w: 240, h: 165, type: 'billiard', label: 'The billiard room' },
  table: { x: 1180, y: 620, w: 230, h: 165, type: 'table', label: 'The Round Table' },
};
const GROUNDS = { x: 520, y: 700, w: 580, h: 200 };
const BEDS = ['bedL1', 'bedL2', 'bedR1', 'bedR2'];

// Every place the engine writes (a census of six seasons found 31), to where
// the stage films it. A place not in the list falls back by the hour: the
// road if it happened on the way to or from the mission, the great hall if not.
const PLACE = {
  'the library': 'library', 'the drawing room': 'drawing', 'the billiard room': 'billiard',
  'the kitchen': 'kitchen', 'the scullery': 'kitchen',
  'the landing': 'landing', 'the window seat on the stairs': 'landing', 'the stairs': 'landing',
  'the back stairs': 'landing', 'the upstairs corridor': 'landing', 'the linen store': 'landing',
  'the window at the end of the passage': 'landing', 'the corridor outside the bedrooms': 'landing',
  'the bottom of the stairs': 'front', 'the front hall': 'front', 'the boot room': 'front',
  'the fire in the great hall': 'hall', 'the long table': 'hall', 'the far end of the long table': 'hall',
  'the bedroom under the eaves': 'bed',
  'the gravel outside the doors': 'set:grounds', 'the terrace steps': 'set:grounds', 'the drive': 'set:grounds',
  'the courtyard': 'set:grounds', 'the woodpile': 'set:woodpile',
  'the minibus': 'set:minibus',
  'the lane home': 'set:lane', 'the last field before the gates': 'set:lane', 'the lane': 'set:lane',
  'the track below the gates': 'set:lane', 'the top of the hill': 'set:lane',
};
const ROAD = new Set(['journey-out', 'journey-back']);
const LIGHT = { dawn: 'day', morning: 'day', 'journey-out': 'day', 'journey-back': 'day',
  evening: 'evening', 'after-table': 'night', night: 'night' };
const CLOCK = [['breakfast', 'Breakfast'], ['morning', 'Morning'], ['mission', 'Mission'],
  ['evening', 'Evening'], ['table', 'Round Table'], ['night', 'Night']];
const CLOCK_OF = { dawn: 'morning', morning: 'morning', 'journey-out': 'mission', 'journey-back': 'mission',
  evening: 'evening', 'after-table': 'night', night: 'night' };
const SEGMENT_TITLE = { morning: 'The Morning', afternoon: 'The Afternoon', night: 'The Night' };

function placeOf(sc) {
  let p = PLACE[String(sc.location || '').toLowerCase().trim()];
  if (!p) p = ROAD.has(sc.window) ? 'set:lane' : 'hall';
  if (p === 'bed') p = BEDS[hash((sc.participants || [])[0] || sc.id) % BEDS.length];
  return p;
}
const cap1 = s => String(s || '').replace(/^./, c => c.toUpperCase());

function face(name, slug) {
  let u = null;
  try { u = playerAvatarUrl(slug ? { slug } : name); } catch { u = null; }
  const ini = esc(String(name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase());
  return (u ? `<img src="${esc(u)}" alt="" onerror="this.remove()">` : '') + `<span class="trs-ini">${ini}</span>`;
}

// ── THE STEPS ────────────────────────────────────────────────────────────
// One click, one beat. A scene opens on its establishing line (the camera
// arrives), each line of its script is a click, the thread's history is a
// click, and what it moved closes it. The people in a scene are its
// participants plus anybody its script gives a line to, four at most.
function buildSteps(scenes, chips) {
  const steps = [];
  scenes.forEach((sc, si) => {
    const layerStream = sc.observerText || {};
    const stream = layerStream.audience || layerStream.public || Object.values(layerStream)[0] || [];
    const place = placeOf(sc);
    const cast = [...(sc.participants || [])];
    const lines = [];
    for (const b of stream) {
      if (b.kind === 'establish' || b.kind === 'consequence' || b.role === 'recall') continue;
      for (const p of scriptParts(b.text)) {
        lines.push(p);
        if (p.kind === 'say' && p.who && !cast.includes(p.who) && cast.length < 4) cast.push(p.who);
      }
    }
    const base = { si, place, cast: cast.slice(0, 4), when: sc.when || '', window: sc.window,
      title: cap1(sc.location || 'the castle'), heard: sc.layer && sc.layer !== 'full' };
    let first = true;
    const push = st => { steps.push({ ...base, ...st, enter: first }); first = false; };
    for (const b of stream) {
      if (b.kind === 'establish') push({ kind: 'narr', text: b.text });
      else if (b.role === 'recall') push({ kind: 'recall', text: b.text });
      else if (b.kind === 'consequence') push({ kind: 'result', text: b.say || b.text, tone: b.tone,
        chips: ((chips[si] || {}).chips || []).map(c => ({ ...c })) });
      else for (const p of scriptParts(b.text)) push({ kind: p.kind, who: p.who || null, text: p.text });
    }
  });
  return steps;
}

// ── THE SCREEN ───────────────────────────────────────────────────────────
/**
 * `castleStageHTML(ep, observer, segment)` — the stage for one castle
 * segment, or '' when there is nothing to play (the caller then shows the page
 * alone). Registers the screen's state; the markup is inert until mounted.
 */
export function castleStageHTML(ep, observer = 'audience', segment = null) {
  // LAZY: nothing is composed until the stage mounts in the viewer. The text
  // backlog builds every screen (twice) and never mounts one, so a stage that
  // composed its day at build time doubled the transcript's cost for nothing.
  const init = () => {
    const scenes = castleDayScenes(ep, observer, segment);
    return { steps: scenes.length ? buildSteps(scenes, castleDayChips(ep, observer, segment)) : [] };
  };
  const truth = (ep.tr && ep.tr.beliefs && ep.tr.beliefs.truth) || {};
  const isAudience = observer === 'audience';
  const traitors = isAudience ? Object.keys(truth).filter(n => truth[n] === 'traitor') : [];
  const uid = 'trs-' + String(ep.num) + '-' + (segment || 'day') + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, segment, traitors, isAudience,
    day: (ep.tr && ep.tr.ep) || ep.num, pot: ep.tr && ep.tr.pot, timers: [] };
  return stageShell(uid, '<div class="trs-sky trs-day"></div><div class="trs-sky trs-eve"></div><div class="trs-sky trs-night"></div>'
    + '<div class="trs-stars"></div><div class="trs-moon"></div>'
    + '<svg class="trs-hills" viewBox="0 0 1600 360" preserveAspectRatio="xMidYMax slice"></svg>'
    + '<div class="trs-mist"></div>'
    + '<div class="trs-world"><svg class="trs-castle" viewBox="0 0 1600 900" width="1600" height="900"></svg><div class="trs-rooms"></div></div>'
    + '<div class="trs-set"></div>'
    + '<div class="trs-scene"></div><div class="trs-caption"></div>'
    + '<div class="trs-loc"><div class="trs-loc-e"></div><div class="trs-loc-t"></div><div class="trs-gem"></div></div>'
    + '<div class="trs-corner"></div><div class="trs-lb"></div><div class="trs-pops"></div>'
    + '<div class="trs-start"></div>');
}

/**
 * The frame every stage shares: the title band, the day clock, the view (its
 * contents are the caller's), the controls. Inert, and carrying no words.
 */
function stageShell(uid, viewInner, extraCss = '') {
  return `<style>${CSS}${CUTIN_CSS}${extraCss}</style><div class="trs" data-uid="${esc(uid)}">`
    + '<div class="trs-band"><div class="trs-band-l"><div class="trs-eyebrow"></div><div class="trs-title"></div></div>'
    + '<div class="trs-fund"><b></b><span></span></div></div>'
    + '<div class="trs-clock"></div>'
    + `<div class="trs-view" onclick="trStageNext('${esc(uid)}')">` + viewInner + '</div>'
    + '<div class="trs-ctrl">'
    + `<button type="button" class="trs-btn" data-l="restart" onclick="trStageReset('${esc(uid)}')"></button>`
    + `<button type="button" class="trs-btn trs-next" data-l="next" onclick="trStageNext('${esc(uid)}')"></button>`
    + `<button type="button" class="trs-btn" data-l="all" onclick="trStageAll('${esc(uid)}')"></button>`
    + `<button type="button" class="trs-btn" data-l="text" onclick="trStageTranscript('${esc(uid)}')"></button>`
    + '<span class="trs-count"></span></div>'
    + '</div>';
}

// ── PAINTING ─────────────────────────────────────────────────────────────
const $ = (root, c) => root.querySelector('.trs-' + c);
function rootOf(uid) {
  return typeof document === 'undefined' ? null : document.querySelector(`.trs[data-uid="${uid}"]`);
}
function clearTimers(S) { (S.timers || []).forEach(t => clearTimeout(t) || clearInterval(t)); S.timers = []; }
function later(S, fn, ms) { const t = setTimeout(fn, ms); S.timers.push(t); return t; }

function chrome(root, S) {
  $(root, 'eyebrow').textContent = 'The Traitors · Day ' + S.day;
  $(root, 'title').textContent = S.title || SEGMENT_TITLE[S.segment] || 'The Castle';
  const fund = $(root, 'fund');
  if (S.pot != null) {
    fund.querySelector('b').textContent = '£' + Math.round(S.pot).toLocaleString('en-GB');
    fund.querySelector('span').textContent = 'in the prize fund';
  }
  $(root, 'clock').innerHTML = CLOCK.map(([k, l]) => `<div class="trs-seg" data-k="${k}">${l}</div>`).join('');
  const L = { restart: 'Restart', next: 'Next', all: 'Skip to the end', text: 'Transcript' };
  root.querySelectorAll('.trs-btn').forEach(b => { b.textContent = L[b.dataset.l] || ''; });
  const stars = $(root, 'stars');
  if (stars) stars.innerHTML = Array.from({ length: 60 }, (_, i) =>
    `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 100}%;animation-delay:-${(i % 7) * .4}s"></i>`).join('');
}

function drawOutside(root, S, night) {
  if (S.lastNight === night) return;
  S.lastNight = night;
  $(root, 'castle').innerHTML = TRScenery.castle(night);
  $(root, 'hills').innerHTML = TRScenery.land(night);
}

function drawRooms(root, active, night) {
  $(root, 'rooms').innerHTML = Object.entries(ROOMS).map(([id, r]) => {
    const lit = id === active;
    return `<div class="trs-room${lit ? ' trs-here trs-lit' : ''}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px">`
      + `<div class="trs-glow">${TRScenery.room(r.type, r.w, r.h, night && !lit)}</div>`
      + `<span class="trs-lbl">${esc(r.label)}</span></div>`;
  }).join('');
}

// The camera. `null` pulls back to the whole castle; a room fills the frame.
function camTo(root, place) {
  const view = $(root, 'view'), world = $(root, 'world');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return null;
  if (!place || String(place).startsWith('set:')) {
    world.classList.remove('trs-zoomed');
    const k = Math.min(W / 1320, H / 760);
    world.style.transform = `translate(${W / 2 - 805 * k}px,${H / 2 - 470 * k}px) scale(${k})`;
    return null;
  }
  const r = place === 'grounds' ? GROUNDS : ROOMS[place];
  const k = Math.min(W * 0.94 / r.w, H * (place === 'grounds' ? 1 : 0.84) / r.h);
  const tx = W / 2 - (r.x + r.w / 2) * k, ty = H / 2 - (r.y + r.h / 2) * k;
  world.style.transform = `translate(${tx}px,${ty}px) scale(${k})`;
  world.classList.toggle('trs-zoomed', place !== 'grounds');
  return { floor: ty + (r.y + r.h) * k - 6, h: r.h * k };
}

function drawSet(root, place, light) {
  const set = $(root, 'set'), view = $(root, 'view');
  if (!String(place).startsWith('set:')) { set.classList.remove('trs-on'); return; }
  const kind = place.slice(4);
  if (set.dataset.k !== kind + light) {
    set.innerHTML = TRScenery.backdrop(kind, view.clientWidth || 1200, view.clientHeight || 675, light);
    set.dataset.k = kind + light;
  }
  set.classList.add('trs-on');
}

function drawPeople(root, S, st, geo, fresh) {
  const scene = $(root, 'scene'), view = $(root, 'view');
  const W = view.clientWidth, H = view.clientHeight;
  const cam = st.kind === 'cam';
  const people = cam ? [st.who] : st.cast;
  const speaker = st.kind === 'say' || cam ? st.who : null;
  const onSet = String(st.place).startsWith('set:') || st.place === 'grounds';
  const g = geo && !onSet ? geo : { floor: H * 0.95, h: H * 0.62 };
  const n = Math.max(1, people.length);
  // Everybody stands above the caption band, and nobody is taller than a
  // little under half the frame: a face fills the stage only in a close-up.
  const figW = Math.min(W * (n > 3 ? 0.12 : 0.145), g.h * 0.62 * 3 / 4, H * 0.4 * 3 / 4);
  const floor = Math.min(g.floor, H * (cam ? 0.84 : 0.78));
  const xs = { 1: [0.5], 2: [0.32, 0.68], 3: [0.24, 0.5, 0.76], 4: [0.17, 0.39, 0.61, 0.83] }[n];
  scene.innerHTML = people.map((p, i) => {
    const cls = ['trs-fig', speaker === p ? 'trs-speak' : (speaker ? 'trs-quiet' : ''),
      S.traitors.includes(p) ? 'trs-traitor' : '', fresh && st.enter ? '' : 'trs-in'].join(' ');
    return `<div class="${cls}" style="left:${xs[i] * 100}%;width:${figW}px;bottom:${H - floor}px">`
      + `<div class="trs-av">${face(p)}</div><div class="trs-nm">${esc(p)}${S.traitors.includes(p) ? '<em> · Traitor</em>' : ''}</div></div>`;
  }).join('');
  if (fresh && st.enter) later(S, () => scene.querySelectorAll('.trs-fig').forEach(f => f.classList.add('trs-in')), 60);
  // A SPOKEN LINE IS A CUT-IN (stage-cutin.js): the speaker's bust slides in
  // over the room on their colour, the room goes soft behind them, and the
  // line sits under the bust. A confessional keeps its own letterboxed look.
  const cutting = false;   // live talk: the room and the bubble (see stage-cutin.js)
  view.classList.toggle('trs-cutting', cutting);
  if (cutting) {
    const night = /trs-night/.test(view.className);
    const prev = S.steps[S.idx - 1];
    const others = people.filter(p => p !== speaker);
    scene.insertAdjacentHTML('beforeend', cutIn({ who: speaker, fresh,
      quick: !!(prev && prev.kind === 'say' && prev.si === st.si),
      with: others.length === 1 ? others[0] : null,
      tone: S.traitors.includes(speaker) ? 'blood' : night ? 'steel' : 'morning' }));
  }
  // the line, pinned over whoever says it (under the bust, in a cut-in)
  if (speaker) {
    const i = Math.max(0, people.indexOf(speaker));
    const top = floor - figW * 4 / 3 - 26;
    const el = document.createElement('div');
    el.className = 'trs-line' + (cam ? ' trs-camline' : '') + (S.traitors.includes(speaker) ? ' trs-traitor' : '') + (cutting ? ' trs-cutline' : '');
    el.style.left = cutting ? '56%' : Math.min(Math.max(xs[i] * 100, 26), 74) + '%';
    el.style.top = cutting ? (H * 0.94) + 'px' : Math.max(top, H * 0.22) + 'px';
    el.innerHTML = `<div class="trs-card"><div class="trs-who"><i></i>${esc(speaker)}${cam ? ' · to camera' : ''}</div><p></p></div>`;
    scene.appendChild(el);
    const p = el.querySelector('p'), txt = '“' + String(st.text).replace(/^["“]|["”]$/g, '') + '”';
    if (fresh) {
      requestAnimationFrame(() => el.classList.add('trs-in'));
      words(p, txt, 120);
    } else { el.classList.add('trs-in'); p.textContent = txt; }
  }
}

function drawCaption(root, st) {
  const cap = $(root, 'caption');
  if (st.kind === 'narr' || st.kind === 'recall' || st.kind === 'result') {
    cap.className = 'trs-caption trs-in trs-c-' + st.kind + (st.kind === 'result' ? ' trs-t-' + (st.tone || 'neutral') : '');
    const tag = st.kind === 'recall' ? '<span class="trs-tag">The story so far</span>'
      : st.kind === 'result' ? '<span class="trs-tag">What it changed</span>' : '';
    cap.innerHTML = tag + esc(st.text);
  } else cap.className = 'trs-caption';
}

// What the scene moved, as it moves: kept for the rest of the scene.
function drawPops(root, S, st) {
  const pops = $(root, 'pops');
  const scene = S.steps.slice(0, S.idx + 1).filter(s => s.si === st.si && s.kind === 'result');
  const chips = scene.flatMap(s => s.chips || []);
  if (st.kind === 'cam' || !chips.length) { pops.innerHTML = ''; return; }
  pops.innerHTML = chips.slice(-3).map(c => {
    const up = c.dir > 0, arrow = c.dir > 0 ? '▲' : c.dir < 0 ? '▼' : '■';
    const faces = [c.a, c.b].filter(Boolean).map(n => `<span class="trs-pf">${face(n)}</span>`).join('');
    const word = c.type === 'bond' ? 'Trust' : c.type === 'suspicion' ? (c.dir < 0 ? 'Doubt easing' : 'A hunch hardens')
      : 'Popularity';
    return `<div class="trs-pop"><span class="trs-pfs">${faces}</span>${word} <span class="${up ? 'trs-up' : 'trs-dn'}">${arrow}</span></div>`;
  }).join('');
}

function paint(uid, fresh) {
  const S = reg()[uid], root = rootOf(uid);
  if (!S || !root) return;
  clearTimers(S);
  root.dataset.idx = String(S.idx);
  $(root, 'count').textContent = `${Math.max(0, S.idx + 1)} / ${S.steps.length}`;
  if (S.painter) { S.painter(root, S, fresh); return; }
  const view = $(root, 'view');
  if (S.idx < 0) {
    // AT REST: the castle, and nobody in it
    drawOutside(root, S, false);
    view.className = 'trs-view';
    drawRooms(root, null, false);
    camTo(root, null);
    $(root, 'set').classList.remove('trs-on');
    ['scene', 'pops'].forEach(c => { $(root, c).innerHTML = ''; });
    $(root, 'caption').className = 'trs-caption';
    $(root, 'corner').classList.remove('trs-in');
    $(root, 'lb').classList.remove('trs-on');
    const scenes = new Set(S.steps.map(s => s.si)).size;
    $(root, 'start').innerHTML = `<b>${esc(SEGMENT_TITLE[S.segment] || 'The Castle')}</b><span>${scenes} ${scenes === 1 ? 'scene' : 'scenes'} · press Next, or click the castle</span>`;
    $(root, 'start').classList.add('trs-in');
    root.querySelectorAll('.trs-seg').forEach(el => { el.classList.remove('trs-now', 'trs-done'); });
    return;
  }
  $(root, 'start').classList.remove('trs-in');
  const st = S.steps[S.idx], prev = S.steps[S.idx - 1];
  const light = LIGHT[st.window] || 'day';
  view.className = 'trs-view trs-' + light;
  drawOutside(root, S, light === 'night');
  const cam = st.kind === 'cam';
  const place = cam ? 'alcove' : st.place;
  drawRooms(root, String(place).startsWith('set:') ? null : place, light === 'night');
  // the clock
  const order = CLOCK.map(c => c[0]), cur = order.indexOf(CLOCK_OF[st.window] || 'morning');
  root.querySelectorAll('.trs-seg').forEach(el => {
    const me = order.indexOf(el.dataset.k);
    el.classList.toggle('trs-done', me < cur); el.classList.toggle('trs-now', me === cur);
  });
  $(root, 'lb').classList.toggle('trs-on', cam);
  const corner = $(root, 'corner');
  corner.innerHTML = cam ? 'The alcove · <b>Confessional</b>' : `${esc(st.title)} · <b>${esc(cap1(String(st.when).toLowerCase()))}</b>`
    + (st.heard ? ' · <b>overheard</b>' : '');
  corner.classList.add('trs-in');
  const newScene = fresh && st.enter;
  const loc = $(root, 'loc');
  if (newScene) {
    // pull back to the castle, fly in, title card, then the people
    $(root, 'scene').innerHTML = '';
    $(root, 'pops').innerHTML = '';
    $(root, 'caption').className = 'trs-caption';
    $(root, 'set').classList.remove('trs-on');
    camTo(root, null);
    later(S, () => {
      const geo = camTo(root, place);
      drawSet(root, place, light);
      $(root, 'loc-e').textContent = String(st.when).toUpperCase();
      $(root, 'loc-t').textContent = st.title;
      loc.classList.add('trs-in');
      later(S, () => loc.classList.remove('trs-in'), 1400);
      later(S, () => { drawPeople(root, S, st, geo, true); drawCaption(root, st); drawPops(root, S, st); }, 1350);
    }, 700);
    return;
  }
  const geo = camTo(root, place);
  drawSet(root, place, light);
  loc.classList.remove('trs-in');
  // a cut to the alcove and back is a cut, not a flight
  const cut = fresh && prev && ((prev.kind === 'cam') !== cam);
  const world = $(root, 'world');
  if (cut) { world.style.transition = 'none'; later(S, () => { world.style.transition = ''; }, 50); }
  drawPeople(root, S, st, geo, fresh && !cut ? true : fresh);
  drawCaption(root, st);
  drawPops(root, S, st);
}

// ── MOUNTING AND THE BUTTONS ─────────────────────────────────────────────
// A screen the page has just drawn is at rest, whatever it was last time.
function mount(root) {
  const uid = root.dataset.uid, S = reg()[uid];
  if (!S || root.dataset.mounted) return;
  root.dataset.mounted = '1';
  // The page is read into steps now, at the one moment somebody is watching.
  if (!S.steps && S.init) {
    try { Object.assign(S, S.init()); } catch { S.steps = []; }
  }
  // Nothing to play (a night that is only confessionals): the stage steps
  // aside and the written page underneath opens in its place.
  if (!S.steps || !S.steps.length) {
    const opt = root.closest('.trs-opt');
    if (opt) opt.style.display = 'none';
    return;
  }
  S.idx = -1; S.lastNight = null;
  chrome(root, S);
  paint(uid, false);
}
export function trStageMountAll() {
  if (typeof document === 'undefined') return;
  // A stage folded away behind its Watch button mounts when it is opened.
  _applyAlways();
  document.querySelectorAll('.trs[data-uid]').forEach(root => { if (!root.closest('[hidden]')) mount(root); });
}
export function trStageNext(uid) {
  const S = reg()[uid];
  if (!S) return;
  if (S.idx >= S.steps.length - 1) {
    if (typeof window !== 'undefined' && typeof window.vpNext === 'function') window.vpNext();
    return;
  }
  S.idx++;
  paint(uid, true);
}
export function trStageAll(uid) {
  const S = reg()[uid];
  if (!S) return;
  S.idx = S.steps.length - 1;
  paint(uid, false);
}
export function trStageReset(uid) {
  const S = reg()[uid];
  if (!S) return;
  S.idx = -1;
  paint(uid, false);
}
/** Folds the stage away again, back to the written page it sits above. */
export function trStageTranscript(uid) {
  const root = rootOf(uid);
  const box = root && root.closest('.trs-watchbox');
  if (!box) return;
  box.hidden = true;
  const btn = box.closest('.trs-opt') && box.closest('.trs-opt').querySelector('.trs-watchbtn');
  if (btn) btn.classList.remove('trs-on');
  _watching(box.closest('.trs-opt'));
}
// WHILE THE STAGE PLAYS, THE WRITTEN PAGE STEPS AWAY. Its Continue button
// drives the transcript, not the stage, and a second set of controls under the
// one being watched read as the stage's own (the user, 2026-09-30).
function _watching(opt) {
  if (!opt) return;
  const box = opt.querySelector('.trs-watchbox');
  opt.classList.toggle('trs-watching', !!box && !box.hidden);
}
/** The Watch button: opens the stage over the written page, or folds it away. */
export function trStageWatch(btn) {
  const opt = btn && btn.closest('.trs-opt');
  const box = opt && opt.querySelector('.trs-watchbox');
  if (!box) return;
  box.hidden = !box.hidden;
  btn.classList.toggle('trs-on', !box.hidden);
  _watching(opt);
  if (box.hidden) return;
  const root = box.querySelector('.trs[data-uid]');
  if (!root) return;
  if (!root.dataset.mounted) mount(root);
  else trStageReset(root.dataset.uid);
}
if (typeof document !== 'undefined' && !globalThis.__trStageHooks) {
  globalThis.__trStageHooks = true;
  document.addEventListener('vp:screen', () => trStageMountAll());
  window.addEventListener('resize', () => {
    document.querySelectorAll('.trs[data-mounted]').forEach(root => {
      const uid = root.dataset.uid, S = reg()[uid];
      if (S) { S.set = null; const set = $(root, 'set'); if (set) set.dataset.k = ''; paint(uid, false); }
    });
  });
}

/**
 * THE WRITTEN PAGE IS THE SCREEN; THE STAGE IS OPTIONAL. The user tried the
 * stages and preferred the transcript ("really static and boring… I prefer the
 * transcript version"), so every screen opens on its page again and the stage
 * waits behind a Watch button above it. The button's label is CSS content, so
 * no word of it reaches the text backlog, which reads this markup as narration.
 */
export function trsFold(stage, pageHtml) {
  return '<div class="trs-opt"><div class="trs-optbar">'
    + '<button type="button" class="trs-alwaysbtn" onclick="trStageAlways(this)"></button>'
    + '<button type="button" class="trs-watchbtn" onclick="trStageWatch(this)"></button></div>'
    + '<div class="trs-watchbox" hidden>' + stage + '</div></div>' + pageHtml;
}

// "ALWAYS WATCH IT PLAYED" — a per-viewer preference (this browser only):
// with it on, every Traitors screen that has a stage opens straight into it.
const ALWAYS_KEY = 'tr-watch-always';
function _always() {
  try { return localStorage.getItem(ALWAYS_KEY) === '1'; } catch (e) { return false; }
}
/** Opens every folded stage on the screen when the preference is on, and
 *  shows the toggle's state. Called on every screen mount. */
function _applyAlways() {
  const on = _always();
  document.querySelectorAll('.trs-opt').forEach(opt => {
    const t = opt.querySelector('.trs-alwaysbtn');
    if (t) t.classList.toggle('trs-on', on);
    if (!on) return;
    const box = opt.querySelector('.trs-watchbox'), btn = opt.querySelector('.trs-watchbtn');
    if (box && box.hidden) { box.hidden = false; if (btn) btn.classList.add('trs-on'); }
    _watching(opt);
  });
}
export function trStageAlways(btn) {
  const on = !_always();
  try { localStorage.setItem(ALWAYS_KEY, on ? '1' : '0'); } catch (e) { /* storage blocked: session only */ }
  if (btn) btn.classList.toggle('trs-on', on);
  if (on) { _applyAlways(); trStageMountAll(); }
}

/** The castle segment screen: its page, with the stage folded above it. */
export function castleStageScreen(ep, observer, segment, pageHtml) {
  const stage = castleStageHTML(ep, observer, segment);
  if (!stage) return pageHtml;
  if (typeof queueMicrotask === 'function' && typeof document !== 'undefined') queueMicrotask(trStageMountAll);
  return trsFold(stage, pageHtml);
}

// ── THE LOOK ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');
.trs{--v-void:#040508;--v-lantern:#e0a049;--v-lantern-hot:#ffdb95;--v-vellum:#e8ddc1;--v-vellum-2:#c9ba95;--v-ink:#241b11;
  --v-wax:#75121e;--v-wax-hot:#b32633;--v-moon:#8fa6c2;--v-mute:#6a7484;--v-rule:rgba(224,160,73,.22);
  --v-display:'Fraunces',Georgia,serif;--v-hand:'IM Fell English',Georgia,serif;--v-body:'Cormorant Garamond',Georgia,serif;
  max-width:1280px;margin:0 auto;padding:10px 6px 18px;color:var(--v-vellum);font-family:var(--v-body);background:#000;border-radius:6px}
.trs *{box-sizing:border-box}
.trs button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
.trs-band{display:flex;align-items:flex-end;gap:18px;padding:6px 8px 12px;border-bottom:1px solid var(--v-rule)}
.trs-band-l{flex:1}
.trs-eyebrow{font-family:var(--v-display);font-size:11px;font-weight:700;letter-spacing:.42em;color:var(--v-vellum-2);text-transform:uppercase}
.trs-title{font-family:var(--v-display);font-weight:900;font-size:clamp(24px,3vw,40px);color:#f7ecd2;text-shadow:0 0 22px rgba(255,219,149,.35),0 2px 0 rgba(0,0,0,.6);line-height:1.05}
.trs-fund{text-align:right}
.trs-fund b{display:block;font-family:var(--v-display);font-weight:900;font-size:24px;color:var(--v-lantern-hot);text-shadow:0 0 16px rgba(224,160,73,.4)}
.trs-fund span{font-size:10.5px;letter-spacing:.3em;color:var(--v-mute);font-family:var(--v-display);font-weight:700;text-transform:uppercase}
.trs-clock{display:flex;margin:12px 0 10px}
.trs-seg{flex:1;position:relative;text-align:center;font-family:var(--v-display);font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#4e5666;padding-top:18px;transition:color .6s}
.trs-seg::before{content:"";position:absolute;left:0;right:0;top:6px;height:2px;background:rgba(224,160,73,.12)}
.trs-seg::after{content:"";position:absolute;left:50%;top:1px;width:12px;height:12px;margin-left:-6px;transform:rotate(45deg);background:#141922;border:1px solid rgba(224,160,73,.25);transition:.6s}
.trs-seg.trs-done{color:var(--v-vellum-2)}.trs-seg.trs-done::before{background:rgba(224,160,73,.45)}
.trs-seg.trs-done::after{background:var(--v-lantern);border-color:var(--v-lantern-hot)}
.trs-seg.trs-now{color:var(--v-lantern-hot)}
.trs-seg.trs-now::after{background:var(--v-lantern-hot);box-shadow:0 0 14px var(--v-lantern),0 0 30px rgba(224,160,73,.5);animation:trsPulse 1.6s infinite}
.trs-seg[data-k="night"].trs-now::after{background:var(--v-wax-hot);border-color:#ff8a8a;box-shadow:0 0 16px var(--v-wax-hot)}
@keyframes trsPulse{50%{transform:rotate(45deg) scale(1.25)}}

.trs-view{position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:4px;isolation:isolate;cursor:pointer;
  box-shadow:0 0 0 1px rgba(224,160,73,.18),0 0 90px rgba(0,0,0,.9),0 30px 80px rgba(0,0,0,.8);background:var(--v-void)}
.trs-sky{position:absolute;inset:0;transition:opacity 1.6s;opacity:0}
.trs-sky.trs-day{background:radial-gradient(30% 22% at 16% 58%,rgba(255,196,120,.85),rgba(255,140,80,.25) 45%,transparent 70%),radial-gradient(60% 40% at 50% 64%,rgba(240,130,90,.35),transparent 70%),linear-gradient(180deg,#1c2340 0%,#3a3a60 30%,#7a5a78 52%,#d98a6a 66%,#e9a878 72%,#3a3040 100%)}
.trs-sky.trs-eve{background:radial-gradient(40% 30% at 80% 62%,rgba(255,150,80,.8),transparent 70%),linear-gradient(180deg,#141633 0%,#3a2a50 35%,#8a4a5a 58%,#e08a5a 72%,#2a2030 100%)}
.trs-sky.trs-night{background:radial-gradient(40% 30% at 78% 18%,rgba(143,166,194,.25),transparent 70%),linear-gradient(180deg,#05070d 0%,#0b1120 55%,#10131b 100%)}
.trs-view.trs-day .trs-sky.trs-day,.trs-view:not(.trs-evening):not(.trs-night) .trs-sky.trs-day,.trs-view.trs-evening .trs-sky.trs-eve,.trs-view.trs-night .trs-sky.trs-night{opacity:1}
.trs-stars{position:absolute;inset:0 0 40% 0;opacity:0;transition:opacity 2s}
.trs-stars i{position:absolute;width:2px;height:2px;border-radius:50%;background:#dfe7f5;animation:trsTw 3s infinite alternate}
@keyframes trsTw{to{opacity:.2}}
.trs-moon{position:absolute;right:18%;top:10%;width:54px;height:54px;border-radius:50%;background:radial-gradient(circle at 40% 40%,#f3f1e6,#b8bfcc);box-shadow:0 0 60px rgba(223,231,245,.45);opacity:0;transition:opacity 2s}
.trs-view.trs-night .trs-stars,.trs-view.trs-night .trs-moon{opacity:1}
.trs-hills{position:absolute;left:0;right:0;bottom:0;width:100%;height:40%}
.trs-mist{position:absolute;left:-20%;right:-20%;bottom:10%;height:18%;background:radial-gradient(50% 50% at 50% 50%,rgba(200,210,225,.16),transparent 70%);filter:blur(10px);animation:trsMist 26s linear infinite alternate}
@keyframes trsMist{from{transform:translateX(-6%)}to{transform:translateX(6%)}}
.trs-world{position:absolute;left:0;top:0;width:1600px;height:900px;transform-origin:0 0;transition:transform 1.2s cubic-bezier(.65,0,.25,1)}
.trs-castle{position:absolute;inset:0}
.trs-rooms{position:absolute;inset:0}
.trs-room{position:absolute;overflow:hidden;background:#07090d;box-shadow:0 0 0 6px #4a2418,0 0 0 8px #2a120c,inset 0 0 30px rgba(0,0,0,.6);transition:filter 1s}
.trs-glow{position:absolute;inset:0}
.trs-room.trs-here{box-shadow:0 0 0 6px #4a2418,inset 0 0 0 2px rgba(255,219,149,.55),inset 0 0 40px rgba(0,0,0,.7)}
.trs-lbl{position:absolute;left:10px;top:8px;font-family:var(--v-display);font-size:11px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:rgba(232,221,193,.6);transition:opacity .4s}
.trs-world.trs-zoomed .trs-lbl{opacity:0}
.trs-world.trs-zoomed .trs-room:not(.trs-here){filter:brightness(.28) saturate(.5)}
.trs-view.trs-night .trs-room:not(.trs-lit){filter:brightness(.55) saturate(.6)}
.trs-view.trs-evening .trs-world{filter:sepia(.18) saturate(1.1)}
.trs .flick{animation:trsFlick 3s infinite alternate}
@keyframes trsFlick{0%{opacity:1}40%{opacity:.86}70%{opacity:.95}100%{opacity:.9}}
.trs-set{position:absolute;inset:0;opacity:0;transition:opacity .9s;pointer-events:none}
.trs-set.trs-on{opacity:1}
.trs-set .trs-pass{animation:trsPass 22s linear infinite}
@keyframes trsPass{to{transform:translateX(-100%)}}

.trs-scene{position:absolute;inset:0;pointer-events:none;z-index:5}
.trs-fig{position:absolute;transform:translate(-50%,24px);opacity:0;transition:transform .6s cubic-bezier(.2,.9,.3,1.2),opacity .5s,filter .45s}
.trs-fig.trs-in{transform:translate(-50%,0);opacity:1}
.trs-av{position:relative;width:100%;aspect-ratio:3/4;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;
  background:linear-gradient(162deg,#252b37,#080b11);box-shadow:0 0 0 2px rgba(224,160,73,.45),0 16px 40px rgba(0,0,0,.8)}
.trs-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.trs-ini{position:absolute;inset:0;display:grid;place-items:center;font-family:var(--v-display);font-weight:900;font-size:26px;color:rgba(232,221,193,.5)}
.trs-nm{margin-top:8px;text-align:center;white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--v-vellum-2);text-shadow:0 2px 8px #000}
.trs-nm em{font-style:normal;color:#e0606a}
.trs-fig.trs-quiet{filter:brightness(.42) saturate(.6)}
.trs-fig.trs-speak .trs-av{box-shadow:0 0 0 2px var(--v-lantern-hot),0 0 40px rgba(224,160,73,.55),0 16px 40px rgba(0,0,0,.8)}
.trs-fig.trs-speak .trs-nm{color:var(--v-lantern-hot)}
.trs-fig.trs-traitor .trs-av::after{content:"";position:absolute;inset:0;z-index:2;border-radius:inherit;box-shadow:inset 0 0 0 2px rgba(179,38,51,.9),inset 0 -40px 50px -20px rgba(117,18,30,.7)}
.trs-line{position:absolute;max-width:46%;transform:translate(-50%,-100%) scale(.96);opacity:0;transition:transform .35s cubic-bezier(.2,1.4,.4,1),opacity .25s;z-index:7}
.trs-line.trs-in{transform:translate(-50%,-100%) scale(1);opacity:1}
.trs-line.trs-cutline{max-width:62%;z-index:2100}
.trs-line.trs-cutline .trs-card::before,.trs-line.trs-cutline .trs-card::after{display:none}
.trs-view.trs-cutting .trs-world,.trs-view.trs-cutting .trs-set,.trs-view.trs-cutting .trs-fig{filter:brightness(.42) blur(2px);transition:filter .5s}
.trs-card{position:relative;padding:13px 18px 12px;border-radius:3px;background:linear-gradient(170deg,#efe5cc,#d9cba6);color:var(--v-ink);box-shadow:0 14px 30px rgba(0,0,0,.6),inset 0 0 30px rgba(120,90,40,.18)}
.trs-card::after{content:"";position:absolute;left:50%;bottom:-8px;width:16px;height:16px;margin-left:-8px;transform:rotate(45deg);background:#dacca8}
.trs-who{font-family:var(--v-display);font-weight:700;font-size:10.5px;letter-spacing:.28em;text-transform:uppercase;color:#6b4a1f;margin-bottom:4px;display:flex;gap:6px;align-items:center}
.trs-who i{width:8px;height:8px;border-radius:50%;background:var(--v-wax)}
.trs-card p{margin:0;font-family:var(--v-hand);font-size:clamp(15px,1.5vw,20px);line-height:1.35}
.trs-camline .trs-card{background:linear-gradient(170deg,#1a2230,#0f141d);color:#dfe7f2;box-shadow:0 14px 30px rgba(0,0,0,.7),0 0 0 1px rgba(143,166,194,.4)}
.trs-camline .trs-card::after{background:#131a26}
.trs-camline .trs-who{color:var(--v-moon)}
.trs-camline.trs-traitor .trs-card{background:linear-gradient(170deg,#3a0a12,#1c0509);box-shadow:0 14px 30px rgba(0,0,0,.7),0 0 0 1px rgba(179,38,51,.6);color:#f3dcd8}
.trs-camline.trs-traitor .trs-card::after{background:#2a070d}
.trs-camline.trs-traitor .trs-who{color:#e87a82}
.trs-caption{position:absolute;left:50%;bottom:4%;transform:translate(-50%,10px);opacity:0;width:max-content;max-width:74%;text-align:center;z-index:7;
  font-family:var(--v-body);font-style:italic;font-size:clamp(16px,1.6vw,22px);line-height:1.35;color:#f1e6cc;padding:10px 24px;
  background:linear-gradient(90deg,transparent,rgba(4,5,8,.86) 14%,rgba(4,5,8,.86) 86%,transparent);transition:.4s;pointer-events:none}
.trs-caption.trs-in{opacity:1;transform:translate(-50%,0)}
.trs-tag{display:block;margin-bottom:3px;font-family:var(--v-display);font-style:normal;font-size:9.5px;font-weight:700;letter-spacing:.34em;text-transform:uppercase;color:var(--v-lantern)}
.trs-c-recall{color:#dfe7f2}.trs-c-recall .trs-tag{color:var(--v-moon)}
.trs-c-result .trs-tag{color:var(--v-vellum-2)}
.trs-c-result.trs-t-adverse .trs-tag{color:#e87a82}
.trs-c-result.trs-t-smooth .trs-tag{color:#8fd19e}
.trs-loc{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) scale(.9);text-align:center;opacity:0;z-index:8;transition:opacity .5s,transform .8s cubic-bezier(.2,.9,.3,1);pointer-events:none}
.trs-loc.trs-in{opacity:1;transform:translate(-50%,-50%) scale(1)}
.trs-loc-e{font-family:var(--v-display);font-size:12px;font-weight:700;letter-spacing:.46em;color:var(--v-vellum-2);text-shadow:0 2px 10px #000}
.trs-loc-t{font-family:var(--v-display);font-weight:900;font-size:clamp(30px,4.6vw,64px);color:#f7ecd2;text-shadow:0 0 30px rgba(255,219,149,.45),0 3px 0 rgba(0,0,0,.6),0 0 40px #000}
.trs-gem{width:14px;height:14px;margin:12px auto 0;transform:rotate(45deg);background:var(--v-wax-hot);box-shadow:0 0 18px var(--v-wax-hot)}
.trs-corner{position:absolute;left:16px;top:14px;z-index:8;font-family:var(--v-display);font-weight:700;font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;
  color:var(--v-vellum-2);padding:7px 12px;background:rgba(4,5,8,.72);box-shadow:0 0 0 1px rgba(224,160,73,.25);opacity:0;transition:opacity .5s}
.trs-corner.trs-in{opacity:1}
.trs-corner b{color:var(--v-lantern-hot);font-weight:700}
.trs-lb::before,.trs-lb::after{content:"";position:absolute;left:0;right:0;height:10%;background:#000;z-index:9;transition:transform .6s}
.trs-lb::before{top:0;transform:translateY(-100%)}.trs-lb::after{bottom:0;transform:translateY(100%)}
.trs-lb.trs-on::before,.trs-lb.trs-on::after{transform:none}
.trs-pops{position:absolute;right:14px;top:14px;z-index:10;display:flex;flex-direction:column;gap:8px;align-items:flex-end}
.trs-pop{display:flex;align-items:center;gap:10px;padding:7px 14px 7px 7px;background:rgba(4,5,8,.84);box-shadow:0 0 0 1px rgba(224,160,73,.3),0 10px 24px rgba(0,0,0,.6);
  font-family:var(--v-display);font-size:10.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--v-vellum);animation:trsPop .55s cubic-bezier(.2,1.5,.4,1)}
.trs-pfs{display:flex}
.trs-pf{position:relative;display:block;width:26px;height:26px;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#141922}
.trs-pf+.trs-pf{margin-left:-8px}
.trs-pf img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
.trs-pf .trs-ini{font-size:10px}
.trs-up{color:#8fd19e}.trs-dn{color:#e87a82}
@keyframes trsPop{from{transform:translateX(30px);opacity:0}}
/* a line arrives a word at a time, every word already in its place */
.trs-w{display:inline-block;opacity:0;animation:trsWord .42s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes trsWord{from{opacity:0;transform:translateY(.35em);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}
@media (prefers-reduced-motion:reduce){.trs-w{animation:none;opacity:1}}
.trs-start{position:absolute;left:50%;bottom:8%;transform:translate(-50%,8px);opacity:0;transition:.5s;z-index:3300;text-align:center;pointer-events:none;
  padding:12px 26px;background:linear-gradient(90deg,transparent,rgba(4,5,8,.86) 16%,rgba(4,5,8,.86) 84%,transparent)}
.trs-start.trs-in{opacity:1;transform:translate(-50%,0)}
.trs-start b{display:block;font-family:var(--v-display);font-weight:900;font-size:clamp(22px,2.6vw,34px);color:#f7ecd2}
.trs-start span{font-family:var(--v-display);font-size:10.5px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--v-vellum-2)}
.trs-ctrl{display:flex;justify-content:center;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap}
.trs-btn{padding:11px 20px;font-family:var(--v-display)!important;font-weight:700;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--v-vellum-2)!important;
  background:linear-gradient(180deg,#141922,#0b0e14)!important;box-shadow:0 0 0 1px rgba(224,160,73,.3)}
.trs-btn:hover{color:var(--v-lantern-hot)!important}
.trs-next{padding:11px 44px;color:var(--v-ink)!important;background:linear-gradient(180deg,#f0c77a,#b8863e)!important;box-shadow:0 0 0 1px #ffdb95,0 0 24px rgba(224,160,73,.4)}
.trs-count{min-width:70px;font-family:var(--v-display);font-size:10.5px;letter-spacing:.2em;color:var(--v-mute)}
.trs-opt.trs-watching~*{display:none!important}
.trs-opt{display:flex;flex-direction:column;align-items:flex-end;gap:10px;margin:0 0 12px}
.trs-watchbox{width:100%}
.trs-watchbox[hidden]{display:none}
.trs-watchbtn{padding:8px 16px;border:0;cursor:pointer;font-family:'Fraunces',Georgia,serif;font-weight:700;font-size:10.5px;letter-spacing:.28em;
  text-transform:uppercase;color:#c9ba95;background:linear-gradient(180deg,#141922,#0b0e14);box-shadow:0 0 0 1px rgba(224,160,73,.3)}
.trs-watchbtn::before{content:"Watch it played"}
.trs-optbar{display:flex;gap:8px;align-items:center}
.trs-alwaysbtn{padding:8px 12px;border:0;cursor:pointer;font-family:'Fraunces',Georgia,serif;font-weight:700;font-size:9.5px;letter-spacing:.2em;
  text-transform:uppercase;color:#6a7484;background:transparent;box-shadow:0 0 0 1px rgba(224,160,73,.18)}
.trs-alwaysbtn::before{content:"Always watch: off"}
.trs-alwaysbtn.trs-on{color:#ffdb95;box-shadow:0 0 0 1px rgba(224,160,73,.55)}
.trs-alwaysbtn.trs-on::before{content:"Always watch: on"}
.trs-alwaysbtn:hover{color:#c9ba95}
.trs-watchbtn.trs-on::before{content:"Close the stage"}
.trs-watchbtn:hover{color:#ffdb95}
@media (max-width:700px){
  .trs-band{flex-wrap:wrap}.trs-seg{font-size:0;letter-spacing:0}
  .trs-line{max-width:72%}.trs-caption{max-width:92%;font-size:15px}
  .trs-btn{padding:10px 12px;font-size:10px;letter-spacing:.18em}.trs-next{padding:10px 24px}
}
`;

// Shared with table-stage.js under prefixed names: main.js hangs every exported
// function on `window`, and a bare `esc` or `face` there would replace
// somebody else's.
/**
 * THE LINE, SHOWN WHOLE AND LIT A WORD AT A TIME.
 *
 * It used to be typed a character at a time, and a centred card re-centred
 * itself on every letter: the sentence grew out of the middle both ways and
 * the line under it jumped as it wrapped. Every word is laid out now, at once
 * and invisible, and fades up where it already sits -- nothing moves. The
 * whole line is lit in about a second whatever its length.
 */
function words(el, txt, delay = 0) {
  if (!el) return;
  const parts = String(txt == null ? '' : txt).split(/(\s+)/);
  const n = parts.filter(w => w.trim()).length || 1;
  const step = Math.max(14, Math.min(55, 1100 / n));
  let i = 0;
  el.innerHTML = parts.map(w => (!w.trim() ? w
    : '<span class="trs-w" style="animation-delay:' + Math.round(delay + (i++) * step) + 'ms">'
      + esc(w) + '</span>')).join('');
}

export { esc as trsEsc, reg as trsReg, face as trsFace, later as trsLater, stageShell as trsStageShell,
  words as trsWords };
