// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/stage.js — the Ridonculous Race stage, painted for step N
// ══════════════════════════════════════════════════════════════════════
//
// DETERMINISTIC: a screen is drawn from its steps up to `idx` (steps.js staged where
// everybody is after every step), so going back and jumping draw the same picture. Only
// the newest step animates: the team walking onto the mat, the hop to the next stone, the
// swim with its splashes, the cab driving in, the tip card flying out of the Don Box, the
// slam. Every avatar idles; whoever is talking bounces.
import { plateUrl, raceUrl, propUrl } from './plates.js';
import { PLACES } from '../rr/places.js';
import { intelAt } from './steps.js';
import { liveGL } from '../vp-td-ep/glplate.js';

const ORD = ['', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH', '11TH', '12TH', '13TH', '14TH'];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rnd = seed => { let s = seed >>> 0 || 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const hash = str => { let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// a stranger's face: an inline SVG silhouette (no portrait exists for a local)
const LOCAL_SVG = `<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#2a3557"/><circle cx="50" cy="40" r="18" fill="#c9d3ea"/>
  <path d="M18 100c2-22 16-34 32-34s30 12 32 34z" fill="#c9d3ea"/><path d="M30 34c2-14 12-20 20-20s18 6 20 20c-6-6-14-8-20-8s-14 2-20 8z" fill="#7c8bb2"/></svg>`;

function compassSVG() {
  const pts = [];
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 18 : i % 4 ? 30 : 46; pts.push([50 + Math.sin(a) * r, 62 - Math.cos(a) * r]); }
  return `<svg class="compass" viewBox="0 0 100 112"><g fill="none" stroke="#4fb6c4" stroke-width="1.6"><circle cx="50" cy="62" r="40"/><circle cx="50" cy="62" r="46" opacity=".5"/></g>
    <polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="#2d8f9c" stroke="#7fd6e0" stroke-width="1"/>
    <path d="M50 2 L58 20 L50 16 L42 20 Z" fill="#4fb6c4"/></svg>`;
}
// the logo's globe: tilted panes of colour in a glowing ring (seeded, so it never flickers)
function globeSVG(seed = 7) {
  const r = rnd(seed); let panes = '';
  const C = ['#ff4fa3', '#ffd23f', '#3fd0ff', '#7a5cff', '#ff7a1a', '#4fe08b', '#ff3b3b', '#5aa8ff', '#ffe9f2'];
  for (let i = 0; i < 46; i++) {
    const x = r() * 100, y = r() * 100, w = 14 + r() * 22, h = 7 + r() * 12;
    panes += `<rect x="${(x - w / 2).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${C[i % C.length]}" transform="rotate(${(r() * 50 - 25).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" stroke="#fff" stroke-width="1.3"/>`;
  }
  return `<svg class="globe" viewBox="0 0 100 100"><defs><clipPath id="gc${seed}"><circle cx="50" cy="50" r="47"/></clipPath></defs>
    <circle cx="50" cy="50" r="47" fill="#fff"/><g clip-path="url(#gc${seed})">${panes}</g><circle cx="50" cy="50" r="47" fill="none" stroke="#bfe8ff" stroke-width="2.4"/></svg>`;
}

const HOT = new Set(['red-sand-desert', 'tomb-sands', 'red-outback']);
const AMBIENT = { 'rock-north': 'snow', 'red-sand-desert': 'mote', 'tomb-sands': 'mote', 'red-outback': 'mote', 'fire-mountain-isle': 'ember',
  'great-wall-hills': 'mote', 'savanna-falls': 'mote', 'treasure-isles': 'spark', 'torch-statue-harbour': 'mote', 'iron-tower-city': 'spark', 'skyline-finale': 'mote', 'home-city': 'mote' };

export function createStage(holder, { faceOf, legLabel }) {
  holder.innerHTML = `<div class="rr-frame" id="rr-frame"><div class="stage" id="rr-stage">
    <div id="rr-cam"><div id="rr-lift"><div id="rr-world"><div class="plate" id="rr-pA"></div><div class="plate" id="rr-pB"></div><div class="layer" id="rr-gl"></div>
      <div class="layer" id="rr-under"></div><div class="layer" id="rr-toks"></div><div class="layer" id="rr-fx"></div></div></div></div>
    <div class="vignette"></div><div class="rr-replay"><span>◂◂ LAST TIME</span></div><div class="layer" id="rr-ui"></div><div class="layer" id="rr-amb" style="z-index:31;pointer-events:none"></div>
    <div class="beatcard" id="rr-beat"></div><div class="hud-leg" id="rr-leg"></div><div class="hud-task" id="rr-task"></div>
  </div>
  <div class="vn" id="rr-vn"><img class="av" id="rr-vnav" alt=""><div class="tx"><span class="nm" id="rr-vnnm"></span><span class="tm" id="rr-vntm"></span><div class="ln" id="rr-vnln"></div></div><div class="more">▼</div></div></div>`;
  const $ = id => holder.querySelector('#' + id);
  const stage = $('rr-stage'), frame = $('rr-frame'), cam = $('rr-cam'), under = $('rr-under'), toks = $('rr-toks'), fx = $('rr-fx'), ui = $('rr-ui'), amb = $('rr-amb');
  let curLift = 0, timers = [], flip = false, cur = { ep: null, si: -1, idx: -1 }, typer = null, side = 'left', lastWho = null, ambTimer = null;
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; clearInterval(typer); };

  // ── pieces ──
  // the slow push on a plate moves the whole world with it, so feet stay on the ground they stand on
  function setPlate(url, kb) {
    const w = $('rr-world');
    if (kb !== undefined) { w.className = ''; void w.offsetWidth; w.className = kb || ''; }
    const a = flip ? $('rr-pA') : $('rr-pB'), b = flip ? $('rr-pB') : $('rr-pA');
    if ((b.dataset.url || '') === (url || '') && b.classList.contains('on')) return;
    flip = !flip;
    a.className = 'plate'; a.dataset.url = url || ''; a.style.backgroundImage = url ? `url("${url}")` : 'none';
    void a.offsetWidth; a.className = 'plate on'; b.classList.remove('on');
    // the plate alive (js/vp-td-ep/glplate.js): its own pixels moved by the motion map read off its paint
    // (tools/rr-vp-motion.py): water ripples and glints, leaves flutter, lava shimmers, lamps twinkle
    const glw = $('rr-gl');
    glw.innerHTML = url ? `<canvas class="tdx-gl" data-src="${url.replace(/\.webp$/, '')}" data-grade="${HOT.has(placeOfUrl(url)) ? 'hot' : 'day'}"></canvas>` : '';
    if (url) liveGL(glw);
  }
  const placeOfUrl = u => (String(u).match(/assets\/sets\/rr\/([^/]+)\//) || [])[1];
  const plateOf = s => (s.plate?.race ? raceUrl(s.plate.f) : s.plate?.f ? plateUrl(s.plate.place || s.place, s.plate.f) : null);
  const teamOf = (ep, id) => ep.res.state.teams[id];

  function tokenEl(ep, s, id, pos, opts = {}) {
    const t = teamOf(ep, id), c = ep.color[id];
    const e = document.createElement('div');
    const as = opts.as || s.as?.[id] || 'stand';
    const work = opts.work !== undefined ? opts.work : (s.work && s.teams?.[0] === id ? s.work : s.work ? 'watch' : null);
    e.className = `tok ${as}${work ? ' w-' + work : ''}${opts.extraCls ? ' ' + opts.extraCls : ''}`;
    e.dataset.team = id;
    e.style.setProperty('--c', c);
    e.style.setProperty('--sz', (opts.size || s.size || 8) + 'cqw');
    e.style.setProperty('--d', (-(hash(id) % 2600) / 1000).toFixed(2) + 's');
    e.style.left = pos[0] + '%'; e.style.top = pos[1] + '%';
    let veh = '';
    const pl = s.plate || {};
    if (['ride', 'zip', 'para'].includes(as) && pl.prop && s.mode === 'act') veh = `<img class="veh" src="${propUrl(s.plate.place || s.place, pl.prop)}" alt="">`;
    if (pl.prop && String(pl.prop).match(/^(camel|emu)/)) e.classList.add(pl.prop.split('@')[0]);
    // a rickshaw is pulled at a run; a raft on a walk is carried over their heads
    if (as === 'ride' && /^rickshaw/.test(pl.prop || '') && s.mode === 'act') e.classList.add('rickshaw', 'running', 'ltr');
    if (as === 'walk' && /^raft/.test(pl.prop || '') && s.mode === 'act') veh = `<img class="veh carry" src="${propUrl(s.plate.place || s.place, pl.prop)}" alt="">`;
    e.innerHTML = `<div class="pair">${[t.a, t.b].map(n => `<img data-p="${esc(n)}" src="${faceOf(n)}" alt="">`).join('')}</div>${veh}<div class="shadow"></div><div class="lab">${esc(t.name)}</div>`;
    toks.appendChild(e);
    return e;
  }
  function swimmerEl(ep, s, id, name, pos, k) {
    const c = ep.color[id], e = document.createElement('div');
    e.className = 'swim' + (s.plate.mode === 'dive' ? ' dive' : '');
    e.dataset.team = id;
    e.style.setProperty('--c', c); e.style.setProperty('--sz', Math.max(5, (s.size || 8) * 0.85) + 'cqw');
    const gap = Math.max(5, (s.size || 8) * 0.95); e.style.left = (pos[0] + k * gap) + '%'; e.style.top = (pos[1] + k * 1.5) + '%';
    e.innerHTML = `<div class="ripple"></div><img data-p="${esc(name)}" src="${faceOf(name)}" alt=""><span class="lab">${esc(name)}</span>`;
    toks.appendChild(e);
    return e;
  }
  // the rest of the race, behind the team the shot is about: smaller, a little dimmer, never a rank
  function crowdEl(ep, s, c, k) {
    const at = c.pos[k];
    if (!at) return null;
    const z = s.crowdSize || (s.size || 8) * 0.7;
    if (c.as === 'swim' || c.as === 'dive') {
      const t = teamOf(ep, c.team), col = ep.color[c.team], gap = Math.max(4, z * 0.95);
      const els = [t.a, t.b].map((n, j) => {
        const e = document.createElement('div');
        e.className = 'swim crowd' + (c.as === 'dive' ? ' dive' : ''); e.dataset.team = c.team; e.dataset.crowd = '1';
        e.style.setProperty('--c', col); e.style.setProperty('--sz', Math.max(3.5, z * 0.85) + 'cqw');
        e.style.left = (at[0] + j * gap) + '%'; e.style.top = (at[1] + j * 1.2) + '%';
        e.innerHTML = `<div class="ripple"></div><img data-c="${esc(n)}" src="${faceOf(n)}" alt="">`;
        toks.appendChild(e); return e;
      });
      return els[0];
    }
    const st = c.st[k];
    const e = tokenEl(ep, s, c.team, at, { as: c.as === 'run' ? 'stand' : c.as, size: z, work: c.work && st !== 'gone' ? c.work : null,
      extraCls: `crowd st-${st}${c.as === 'run' ? ' running ' + (c.ltr ? 'ltr' : 'rtl') : ''}` });
    e.dataset.crowd = '1';
    e.querySelectorAll('img[data-p]').forEach(i => { i.dataset.c = i.dataset.p; delete i.dataset.p; });
    if (['ride', 'zip', 'para'].includes(c.as) && s.plate?.prop && !e.querySelector('.veh')) {
      const v = document.createElement('img'); v.className = 'veh'; v.src = propUrl(s.plate.place || s.place, s.plate.prop); v.alt = ''; e.appendChild(v);
    }
    return e;
  }
  function personEl(name, pos, sz, { local = false, label = null } = {}) {
    const d = document.createElement('div');
    d.className = 'don' + (local ? ' local' : '');
    d.dataset.p = name;
    d.style.setProperty('--sz', sz + 'cqw');
    d.style.left = pos[0] + '%'; d.style.top = pos[1] + '%';
    d.innerHTML = (local ? LOCAL_SVG : `<img src="${raceUrl('don')}" alt="">`) + `<span class="lab">${esc(label || name)}</span>`;
    fx.appendChild(d);
    return d;
  }
  function prop(src, pos, w, z = 8) {
    const p = document.createElement('img'); p.className = 'prop'; p.src = src; p.style.left = pos[0] + '%'; p.style.top = pos[1] + '%'; p.style.width = w + 'cqw'; p.style.zIndex = z;
    under.appendChild(p); return p;
  }
  function stamp(x, y, txt, cls = '') { const s = document.createElement('div'); s.className = 'stamp ' + cls; s.style.left = Math.max(12, Math.min(88, x)) + '%'; y = Math.max(18, y); s.style.top = y + '%'; s.textContent = txt; ui.appendChild(s); return s; }
  function particles(kind, x, y, n = 10, spread = 8) {
    for (let i = 0; i < n; i++) {
      const m = document.createElement('div'); m.className = 'fxp ' + kind;
      if (kind === 'note') m.textContent = i % 2 ? '♪' : '♫';
      m.style.left = x + '%'; m.style.top = y + '%'; fx.appendChild(m);
      const a = Math.random() * Math.PI * 2, r = spread * (0.4 + Math.random());
      const up = ['steam', 'note', 'bubble', 'spark', 'dust'].includes(kind) ? -4 - Math.random() * 8 : -2;
      const dx = kind === 'steam' || kind === 'bubble' ? (Math.random() - 0.5) * 3 : Math.cos(a) * r;
      const dy = kind === 'drop' ? -Math.random() * 5 : kind === 'log' ? -6 : up + Math.sin(a) * (kind === 'ember' ? r : 2);
      m.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}cqw,${dy}cqw) scale(${kind === 'steam' ? 2.2 : 0.6})`, opacity: 0 }],
        { duration: 900 + Math.random() * 900, delay: i * 40, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' }).finished.then(() => m.remove()).catch(() => {});
    }
  }
  function splash(x, y, n = 9) {
    particles('drop', x, y, n, 4);
    const w = document.createElement('div'); w.className = 'wake'; w.style.left = x + '%'; w.style.top = (y + 1.5) + '%'; fx.appendChild(w);
    w.animate([{ width: '2cqw', opacity: 0.9 }, { width: '9cqw', opacity: 0 }], { duration: 1100, fill: 'forwards' }).finished.then(() => w.remove()).catch(() => {});
  }
  function flash(x, y) { const f = document.createElement('div'); f.className = 'flash'; f.style.setProperty('--x', x + '%'); f.style.setProperty('--y', y + '%'); fx.appendChild(f); later(800, () => f.remove()); }
  const FXK = { splash: 'drop', steam: 'steam', dust: 'dust', sparkle: 'spark', embers: 'ember', notes: 'note', bubbles: 'bubble', wool: 'wool', logs: 'log', spice: 'dust', sweat: 'drop', wind: 'dust', snow: 'snow', darts: 'spark' };
  function workFx(s, pos) {
    const k = s.plate?.fx; if (!k || !pos) return;
    if (k === 'splash') splash(pos[0], pos[1] - 1, 8);
    else if (k === 'flash') flash(pos[0], pos[1] - 8);
    else particles(FXK[k] || 'spark', pos[0], pos[1] - (s.size || 8) * 0.8, k === 'notes' ? 6 : 10);
  }

  function ambient(placeId) {
    clearInterval(ambTimer); amb.innerHTML = '';
    const kind = AMBIENT[placeId];
    if (!kind) return;
    ambTimer = setInterval(() => {
      if (document.hidden) return;
      const m = document.createElement('div'); m.className = 'fxp ' + kind;
      const x = Math.random() * 100;
      m.style.left = x + '%'; m.style.top = (kind === 'ember' ? 100 : -2) + '%';
      amb.appendChild(m);
      const fall = kind === 'ember' ? -60 : 60;
      m.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 0.9, offset: 0.15 }, { transform: `translate(${(Math.random() - 0.5) * 12}cqw,${fall * 0.5625}cqw)`, opacity: 0 }],
        { duration: 5000 + Math.random() * 4000, easing: 'linear', fill: 'forwards' }).finished.then(() => m.remove()).catch(() => {});
    }, kind === 'snow' ? 140 : 380);
  }

  // ── the lift: the bar sits over the bottom of the picture, so a shot whose people stand low is raised
  // just clear of it (steps.js liftFor); a climb is followed step by step. Under the picture (a narrow
  // window) nothing is lifted.
  // ── the camera (steps.js planCamera decides every shot): the world point (x, y) at the frame's top-left, at zoom s.
  // Wide is the whole plate lifted clear of the bar; a close-up frames its subject above the bar. Under the picture
  // (a narrow window, the bar below it) a wide shot is not lifted and a close-up keeps inside the plate.
  let curCam = '';
  function camera(s, k, fresh) {
    const c = (s.kind === 'world' && s.steps[k]?.cam) || { shot: 'wide', s: 1, x: 0, y: 0 };
    const overlaid = getComputedStyle($('rr-vn')).position === 'absolute';
    const sc = c.s || 1;
    let { x, y } = c;
    if (!overlaid) y = c.shot === 'wide' ? 0 : Math.max(0, Math.min(100 - 100 / sc, y));
    const t = `translate(${(-sc * x).toFixed(2)}%,${(-sc * y).toFixed(2)}%) scale(${sc})`;
    const key = t;
    $('rr-lift').style.transform = '';
    if (!fresh || key === curCam) { cam.style.transition = 'none'; cam.style.transform = t; void cam.offsetWidth; cam.style.transition = ''; curCam = key; cam.dataset.shot = c.shot; return; }
    const step = s.steps[k];
    // a slam is a quick push-in; a follow moves with its subject; anything else eases over
    cam.style.transition = `transform ${step?.slam ? 0.45 : c.shot === 'follow' ? 1.3 : 1.1}s cubic-bezier(.45,.05,.2,1)`;
    cam.style.transform = t; curCam = key; cam.dataset.shot = c.shot;
    curLift = c.shot === 'wide' ? y : 0;
  }

  // ── the dialogue box ──
  function vn(ep, s, step, fresh) {
    const box = $('rr-vn'), av = $('rr-vnav'), L = $('rr-vnln');
    clearInterval(typer);
    const bc = $('rr-beat');
    bc.className = 'beatcard';
    if (step?.part === 'beat' && step.text) {
      // no speaker: the line is a caption in the middle of the picture, and the bar steps aside
      bc.textContent = step.text; bc.className = 'beatcard on' + (fresh ? ' fresh' : '');
      box.className = 'vn'; lastWho = null; L.textContent = ''; $('rr-vnnm').textContent = ''; $('rr-vntm').textContent = ''; return;
    }
    if (!step || ['card', 'tip'].includes(step.part) || (step.part !== 'pause' && !step.text)) {
      box.className = 'vn'; lastWho = null; L.textContent = ''; $('rr-vnnm').textContent = ''; $('rr-vntm').textContent = ''; return;
    }
    const iv = s.kind === 'iv';
    const by = step.by;
    const team = step.team;
    const c = by === 'Don' ? '#f7c948' : team ? ep.color[team] : '#c9d3ea';
    if (by !== lastWho) side = by === 'Don' ? 'left' : (lastWho && side === 'left' ? 'right' : 'left');
    lastWho = by;
    const beat = step.part === 'beat';
    box.className = `vn on ${iv || beat ? '' : side}${beat ? ' beat' : ''}${step.part === 'pause' ? ' pause' : ''}${fresh ? ' fresh' : ''}`;
    box.style.setProperty('--c', c);
    av.style.display = iv || beat ? 'none' : '';
    if (!iv && !beat) {
      av.src = by === 'Don' ? raceUrl('don') : team ? faceOf(by) : 'data:image/svg+xml;utf8,' + encodeURIComponent(LOCAL_SVG);
      if (fresh) { av.classList.remove('pop'); void av.offsetWidth; av.classList.add('pop'); }
    }
    $('rr-vnnm').textContent = beat ? '' : String(by || '').toUpperCase();
    $('rr-vnnm').style.display = beat ? 'none' : '';
    $('rr-vntm').textContent = beat ? '' : iv ? 'interview' : by === 'Don' ? 'host' : team ? teamOf(ep, team).name : 'local';
    const text = step.text || '';
    box.classList.toggle('long', text.length > 150);
    if (!fresh || step.part === 'pause') { L.textContent = text; return; }
    L.textContent = ''; let i = 0;
    typer = setInterval(() => { i += 2; L.textContent = text.slice(0, i); if (i >= text.length) clearInterval(typer); }, 16);
  }
  function speaking(name) {
    frame.querySelectorAll('.speaking').forEach(e => e.classList.remove('speaking'));
    if (!name) return null;
    const el = stage.querySelector(`img[data-p="${CSS.escape(name)}"]`) || stage.querySelector(`.don[data-p="${CSS.escape(name)}"]`);
    if (el) el.classList.add('speaking');
    return el;
  }

  // ── where a team is at step k of a screen ──
  function posAt(s, id, k) {
    if (s.pos?.[k]?.[id]) return s.pos[k][id];
    if (s.hiddenUntil?.[id] != null) {
      if (k < s.hiddenUntil[id]) return null;
      if (k === s.hiddenUntil[id]) return s.matAt;
    }
    return s.marks?.[id] || null;
  }

  // ── screens ──
  function hud(ep, s) {
    const legEl = $('rr-leg');
    legEl.innerHTML = s.hud ? `<span class="num">${ep.kind === 'final' ? 'FINAL' : 'LEG ' + ep.n}</span><span class="name">${esc((ep.placeName || '').toUpperCase())}</span>` : '';
    const t = $('rr-task');
    const bits = [s.hud?.task ? `<span>${esc(s.hud.task)}</span>` : '', s.hud?.clock ? `<span class="clk">${esc(s.hud.clock)}</span>` : ''].join('');
    t.innerHTML = bits; t.classList.toggle('on', !!bits);
  }

  function titleCard(s, fresh, seed) {
    const T = s.title;
    if (s.kind === 'logo') return `<div class="title ${fresh ? 'fresh' : ''}" style="top:14%"><img class="logo" src="${raceUrl('logo')}" alt=""><div class="sub">${esc(s.steps[0].text)}</div></div>`;
    if (s.kind === 'end' && T.pre === 'NEXT TIME') return `<div class="title ${fresh ? 'fresh' : ''}" style="top:8%"><img class="logo" src="${raceUrl('logo')}" alt=""><div class="sub">${T.big ? 'Next leg · ' + esc(T.big) : ''}</div></div>`;
    return `<div class="title ${fresh ? 'fresh' : ''}">${globeSVG(seed)}<div class="stack"><div class="pre">${esc(T.pre)}</div><br><div class="band"><div class="big">${esc(T.big)}</div></div><div class="sub">${esc(T.sub)}</div></div></div>`;
  }

  function mapScreen(ep, s, fresh) {
    const from = PLACES[s.from]?.map, to = PLACES[s.to]?.map || { x: 50, y: 50 };
    const a = from || to;
    const ctrl = [(a.x + to.x) / 2, Math.min(a.y, to.y) - 12];
    under.innerHTML = `<div class="mapwrap ${fresh ? 'fresh' : ''}"><div class="mapbg" style="background-image:url('${raceUrl('worldmap')}')"></div>
      <svg viewBox="0 0 100 56.25" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;z-index:3;overflow:visible">
        <path id="rr-route" d="M${a.x} ${a.y * 0.5625} Q${ctrl[0]} ${ctrl[1] * 0.5625} ${to.x} ${to.y * 0.5625}" fill="none" stroke="#e8433a" stroke-width=".45" stroke-linecap="round" stroke-dasharray="1.2 .8"/></svg>
      ${from ? `<div class="pin" style="left:${a.x}%;top:${a.y}%"></div><div class="pinlab" style="left:${a.x}%;top:${a.y}%">${esc((PLACES[s.from]?.name || '').toUpperCase())}</div>` : ''}
      <div class="pin to" style="left:${to.x}%;top:${to.y}%"></div><div class="pinlab" style="left:${to.x}%;top:${to.y}%">${esc((PLACES[s.to]?.name || '').toUpperCase())}</div>
      <img class="plane" id="rr-plane" src="${raceUrl('plane')}" style="left:${to.x}%;top:${to.y}%" alt=""></div>`;
    const r = under.querySelector('#rr-route'), p = under.querySelector('#rr-plane');
    if (!r || !p || !from) return;
    const len = r.getTotalLength(), pts = [];
    for (let i = 0; i <= 30; i++) {
      const A = r.getPointAtLength(len * i / 30), B = r.getPointAtLength(Math.min(len, len * i / 30 + 0.4));
      const ang = Math.atan2(B.x - A.x, -(B.y - A.y)) * 180 / Math.PI;
      pts.push({ left: A.x + '%', top: (A.y / 0.5625) + '%', transform: `translate(-50%,-50%) rotate(${ang}deg)` });
    }
    if (fresh) {
      r.style.strokeDasharray = len; r.style.strokeDashoffset = len;
      r.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 3400, fill: 'forwards', easing: 'ease-in-out' });
      p.animate(pts, { duration: 3400, fill: 'forwards', easing: 'ease-in-out' });
    } else { const last = pts.at(-1); Object.assign(p.style, { left: last.left, top: last.top, transform: last.transform }); }
  }

  function interview(ep, s, fresh) {
    const team = s.team ? teamOf(ep, s.team) : null;
    const c = s.team ? ep.color[s.team] : '#f7c948';
    const seat = (n, cls, d) => `<div class="cf ${cls}" style="--c:${c};--d:${d}s"><img data-p="${esc(n)}" src="${n === 'Don' ? raceUrl('don') : faceOf(n)}" alt=""></div>`;
    let h = compassSVG();
    h += s.solo || s.people.length === 1 ? seat(s.solo || s.people[0], 'solo', -0.4) : seat(s.people[0], 'L', -0.2) + seat(s.people[1], 'R', -1.4);
    if (s.caption && team) {
      const nm = s.solo ? s.solo : `${team.a} &amp; ${team.b}`;
      h += `<div class="lower ${fresh ? 'fresh' : ''}"><div class="nm">${s.solo ? esc(nm) : nm.split(' &amp; ').map(esc).join(' &amp; ')}</div><div class="tm">${esc(team.name)}</div></div>`;
    }
    const d = document.createElement('div'); d.className = 'iv' + (fresh ? ' fresh' : '');
    d.style.backgroundImage = `url('${raceUrl('confess')}')`;
    d.innerHTML = h; under.appendChild(d);
  }

  function world(ep, s, k, fresh) {
    const pl = s.plate;
    // the mat, the Don Box, the task's prop
    if (s.mode === 'mat' && s.matAt && !pl.mat) {
      const m = document.createElement('img'); m.className = 'matimg' + (pl.bronze ? ' bronze' : ''); m.src = raceUrl('c-mat');
      m.style.cssText += `left:${s.matAt[0]}%;top:${s.matAt[1]}%;width:${(s.size || 8) * 2.8}cqw`;
      under.appendChild(m);
      if (fresh && k === 0) m.animate([{ transform: 'translate(-50%,-50%) scale(0)' }, { transform: 'translate(-50%,-50%) scale(1.06)', offset: 0.7 }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 700, easing: 'ease-out' });
    }
    if (s.boxAt) {
      const opened = s.steps.slice(0, k + 1).some(x => x.part === 'tip') || k > 0;
      const b = prop(raceUrl(opened ? 'c-donbox-tip' : 'c-donbox'), s.boxAt, (s.size || 8) * 0.42, 9);
      if (fresh && k === 0) b.animate([{ transform: 'translate(-50%,-260%)' }, { transform: 'translate(-50%,-92%)', offset: 0.7 }, { transform: 'translate(-50%,-104%)', offset: 0.85 }, { transform: 'translate(-50%,-100%)' }], { duration: 900, easing: 'ease-in' });
    }
    if (s.work && pl.prop) {
      const anchor = s.marks[s.teams[0]] || [50, pl.g];
      const off = (s.size || 8) * 1.9 + 4;
      const px = anchor[0] + (anchor[0] > 55 ? -off : off);
      const pp = prop(propUrl(pl.place || s.place, pl.prop), [Math.max(6, Math.min(94, px)), Array.isArray(pl.g) ? pl.g[1] : pl.g], (s.size || 8) * 1.5, 7);
      if (s.work === 'chase' && fresh) pp.animate([{ transform: 'translate(-50%,-100%)' }, { transform: 'translate(-30%,-104%) scaleX(-1)' }, { transform: 'translate(-50%,-100%)' }], { duration: 900, iterations: 3 });
    }
    // Don and the locals
    if (s.don && s.donStand) personEl('Don', s.donStand, (s.size || 8) * 0.95);
    for (const [nm, at] of Object.entries(s.localAt || {})) personEl(nm, at, (s.size || 8) * 0.85, { local: true, label: nm.replace(/^(A|The) /i, '') });
    // the rest of the race, behind them
    if (!(s.exitAt === k && !fresh)) for (const c of s.crowd || []) crowdEl(ep, s, c, k);
    // the teams
    const it = intelAt(ep, cur.si, k);
    for (const id of s.teams) {
      const at = posAt(s, id, k);
      if (!at) continue;
      if (s.exitAt === k && !fresh) continue;           // GO! they are gone
      if (s.swimmers?.[id]) {
        s.swimmers[id].forEach((n, j) => swimmerEl(ep, s, id, n, at, j));
        continue;
      }
      const e = tokenEl(ep, s, id, at, { extraCls: it.out[id] ? 'out' : '' });
      const place = s.mode === 'mat' ? it.placed[id] : null;
      if (place) {
        const r = document.createElement('div');
        const fr = fresh && s.steps[k]?.rank?.team === id;
        r.className = 'rank' + (place === 1 ? ' gold' : '') + (it.out[id] ? ' out' : '') + (fr ? ' fresh' : '');
        r.textContent = it.out[id] ? 'OUT' : ORD[place] || place + 'TH';
        e.querySelector('.pair').appendChild(r);
      }
    }
    // the watchers of a Botch in the water
    if (s.inset) {
      const b = document.createElement('div'); b.className = 'inset';
      b.innerHTML = `<h4>${esc(s.inset.title)}</h4>` + s.inset.people.map(n => {
        const id = Object.keys(s.members || {}).find(t => s.members[t].includes(n));
        return `<div class="ppl" style="--c:${ep.color[id]}"><img data-p="${esc(n)}" src="${faceOf(n)}" alt=""><span>${esc(n)}</span></div>`;
      }).join('');
      ui.appendChild(b);
    }
  }

  // the newest step's motion
  function animateStep(ep, s, k) {
    const pl = s.plate || {};
    const step = s.steps[k];
    // entrances on the first step
    if (k === 0 && s.kind === 'world') {
      toks.querySelectorAll('.tok,.swim').forEach((e, i) => {
        const id = e.dataset.team, to = posAt(s, id, 0);
        if (!to) return;
        let from;
        if (s.mode === 'act' && pl.mode === 'ride') from = [pl.path[0][0] < 0 ? pl.path[0][0] : -14, to[1]];
        else if (s.mode === 'act' && pl.mode === 'para') from = [to[0] - 10, -10];
        else if (s.mode === 'act') from = pl.path ? pl.path[0] : to;
        else if (s.mode === 'mat' && (s.arriving || []).includes(id)) from = [-10, to[1]];
        else if (s.enter?.[id]) from = [s.enter[id] === 'right' ? 110 : -10, to[1]];
        else from = null;
        if (e.dataset.crowd) return;
        if (from && (from[0] !== to[0] || from[1] !== to[1])) {
          const run = s.mode === 'mat' || s.enter?.[id];
          const d = s.mode === 'mat' ? 1000 : run ? 1250 : 1400;
          if (run) { e.classList.add('running', from[0] > to[0] ? 'rtl' : 'ltr'); later(d + i * 120, () => e.classList.remove('running', 'rtl', 'ltr')); dustTrail(from, to, d, i * 120); }
          e.animate([{ left: from[0] + '%', top: from[1] + '%' }, { left: to[0] + '%', top: to[1] + '%' }], { duration: d, delay: i * 120, easing: run ? 'cubic-bezier(.3,.1,.4,1)' : 'ease-out', fill: 'backwards' });
        } else {
          e.animate([{ transform: 'translate(-50%,-60%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-100%) scale(1)', opacity: 1 }], { duration: 380, delay: i * 70, easing: 'cubic-bezier(.3,1.6,.5,1)', fill: 'backwards' });
        }
        if (s.as?.[id] === 'ride' && pl.fx === 'splash') for (let q = 0; q < 4; q++) later(300 + q * 300, () => splash(lerpPos(from || to, to, q / 4)[0], to[1] - 1, 6));
        if (s.as?.[id] === 'ride' && pl.fx === 'dust') for (let q = 0; q < 4; q++) later(300 + q * 300, () => particles('dust', lerpPos(from || to, to, q / 4)[0], to[1] - 1, 4, 3));
      });
      if (s.work) later(500, () => workFx(s, s.marks[s.teams[0]]));
    }
    // the move from the step before
    if (k > 0 && s.pos) {
      for (const id of s.teams) {
        const a = s.pos[k - 1]?.[id], b = s.pos[k]?.[id];
        if (!a || !b || (a[0] === b[0] && a[1] === b[1])) continue;
        const els = toks.querySelectorAll(`[data-team="${id}"]`);
        const hop = pl.mode === 'hop';
        const kf = hop ? [{ left: a[0] + '%', top: a[1] + '%' }, { left: (a[0] + b[0]) / 2 + '%', top: Math.min(a[1], b[1]) - 9 + '%' }, { left: b[0] + '%', top: b[1] + '%' }]
          : [{ left: a[0] + '%', top: a[1] + '%' }, { left: b[0] + '%', top: b[1] + '%' }];
        els.forEach((e, j) => {
          const off = e.classList.contains('swim') ? [j * Math.max(5, (s.size || 8) * 0.95), j * 1.5] : [0, 0];
          e.animate(kf.map(f => ({ left: parseFloat(f.left) + off[0] + '%', top: parseFloat(f.top) + off[1] + '%' })), { duration: hop ? 650 : 1300, easing: hop ? 'ease-in-out' : 'ease-in-out', fill: 'backwards' });
        });
        if (['swim', 'dive'].includes(pl.mode) || pl.fx === 'splash') for (let q = 0; q < 4; q++) later(q * 320, () => splash(lerpPos(a, b, q / 4)[0] + 1.5, lerpPos(a, b, q / 4)[1] - 1, pl.mode === 'dive' ? 0 : 6));
        if (pl.mode === 'dive') later(200, () => particles('bubble', b[0], b[1] - 3, 8));
        if (hop && pl.fx === 'embers') later(600, () => particles('ember', b[0], b[1], 8, 5));
        if (hop && pl.fx === 'splash') later(600, () => splash(b[0], b[1] + 1, 6));
      }
    }
    if (k > 0 && s.pos && !['swim', 'dive', 'ride', 'hop'].includes(pl.mode)) for (const id of s.teams) {
      const a = s.pos[k - 1]?.[id], b = s.pos[k]?.[id];
      if (a && b && (a[0] !== b[0] || a[1] !== b[1])) {
        dustTrail(a, b, 1300, 0);
        // a slip back down is fast and loose; going up is the climb's own motion
        if (b[1] > a[1] + 8 && pl.mode === 'climb') toks.querySelectorAll(`[data-team="${id}"]:not([data-crowd])`).forEach(e => e.animate([{ left: a[0] + '%', top: a[1] + '%' }, { left: b[0] + '%', top: b[1] + '%' }], { duration: 650, easing: 'cubic-bezier(.6,0,.9,.6)', fill: 'backwards' }));
      }
    }
    crowdMoves(ep, s, k);
    // a slip on a failed try, a quit
    if (s.plan?.fail === k) {
      const id = s.teams[0], at = posAt(s, id, k) || s.marks[id];
      if (at) { stamp(at[0], Math.max(10, at[1] - 22), 'TRY AGAIN'); }
      toks.querySelectorAll(`[data-team="${id}"]`).forEach(e => e.animate([{ transform: 'translate(-50%,-100%) rotate(0)' }, { transform: 'translate(-54%,-100%) rotate(-8deg)' }, { transform: 'translate(-46%,-100%) rotate(8deg)' }, { transform: 'translate(-50%,-100%) rotate(0)' }], { duration: 420, iterations: 2 }));
      if (pl.fx === 'splash' || ['swim', 'dive', 'hop'].includes(pl.mode)) splash(at?.[0] ?? 50, (at?.[1] ?? 70), 14);
    }
    if (s.plan?.quit === k) { const at = s.marks[s.teams[0]]; if (at) stamp(at[0], Math.max(10, at[1] - 22), 'QUIT'); }
    // the work, on every beat of an in-place task (the cooking, the search, the build)
    if (k > 0 && s.work && (step.part === 'beat' || k === s.steps.length - 1)) workFx(s, s.marks[s.teams[0]]);
    // done
    if (k === s.steps.length - 1 && s.mode === 'act' && ['task-done'].includes(s.seg) || (k === s.steps.length - 1 && s.seg === 'task-try' && s.ending !== 'quit' && s.mode === 'act')) {
      const id = s.teams[0], at = posAt(s, id, k);
      if (at) later(300, () => stamp(at[0], Math.max(10, at[1] - 22), 'DONE!', 'gold'));
    }
    // the mat: a team steps on as Don checks it in
    if (s.mode === 'mat' && step?.arrive && s.hiddenUntil) {
      const id = step.arrive, e = toks.querySelector(`[data-team="${id}"]`);
      if (e) {
        e.classList.add('running', 'ltr'); later(950, () => e.classList.remove('running', 'ltr'));
        e.animate([{ left: '-10%', top: s.matAt[1] + '%' }, { left: (s.matAt[0] - 4) + '%', top: s.matAt[1] + '%', offset: 0.8 }, { left: s.matAt[0] + '%', top: (s.matAt[1] - 4) + '%', offset: 0.9 }, { left: s.matAt[0] + '%', top: s.matAt[1] + '%' }], { duration: 1000, easing: 'ease-out', fill: 'backwards' });
        dustTrail([-10, s.matAt[1]], s.matAt, 900, 0);
        later(1000, () => particles('dust', s.matAt[0], s.matAt[1], 8, 4));
      }
    }
    // GO! the teams sprint off to the race
    if (s.exitAt === k) toks.querySelectorAll('.tok').forEach((e, i) => {
      const x = parseFloat(e.style.left), y = parseFloat(e.style.top);
      e.classList.add('running', 'ltr');
      e.animate([{ left: x + '%', top: y + '%' }, { left: (112 + i * 3) + '%', top: y + '%' }], { duration: 1300 + i * 90, delay: 250 + i * 70, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' });
      later(250 + i * 70, () => dustTrail([x, y], [x + 25, y], 600, 0));
    });
    // a bungee drop: off the edge, down on the cord, back up, and again smaller
    if (s.work === 'bungee' && k > 0) {
      const id = s.teams[0], e = toks.querySelector(`[data-team="${id}"]:not([data-crowd])`), at = s.marks[id];
      if (e && at) e.animate([{ left: at[0] + '%', top: at[1] + '%' }, { left: (at[0] + 8) + '%', top: (at[1] - 6) + '%', offset: 0.15 }, { left: (at[0] + 14) + '%', top: Math.min(97, at[1] + 34) + '%', offset: 0.42 },
        { left: (at[0] + 13) + '%', top: (at[1] + 6) + '%', offset: 0.62 }, { left: (at[0] + 13) + '%', top: Math.min(97, at[1] + 20) + '%', offset: 0.78 }, { left: at[0] + '%', top: at[1] + '%' }], { duration: 2600, easing: 'ease-in-out' });
    }
    // done: a jump for joy; a celebration scene starts with one
    if ((s.seg === 'celebrate' && k === 0) || (k === s.steps.length - 1 && s.seg === 'task-done')) {
      toks.querySelectorAll(`[data-team="${s.teams[0]}"]:not([data-crowd]) .pair`).forEach(p => p.animate(JUMP, { duration: 900, delay: 200, iterations: 2 }));
      const at = posAt(s, s.teams[0], k); if (at) later(300, () => particles('spark', at[0], at[1] - (s.size || 8) * 1.4, 12, 6));
    }
  }
  const JUMP = [{ transform: 'translateY(0)' }, { transform: 'translateY(-2.2cqw) scale(1.05)', offset: 0.35 }, { transform: 'translateY(0) scaleY(.92)', offset: 0.7 }, { transform: 'translateY(0)' }];
  // puffs of dust along a run (a plate of water gets a splash instead)
  function dustTrail(a, b, dur, delay) {
    if (!a || !b) return;
    const water = cur.ep && cur.ep.screens[cur.si]?.plate?.water;
    for (let q = 1; q <= 4; q++) later(delay + dur * q / 5, () => {
      const p = lerpPos(a, b, q / 5);
      if (p[0] < -2 || p[0] > 102) return;
      if (water) splash(p[0], p[1], 4); else particles('dust', p[0], p[1] - 0.5, 3, 2.5);
    });
  }
  // the rest of the race between two steps: moving on, coming in, leaving, failing and trying again
  function crowdMoves(ep, s, k) {
    for (const c of s.crowd || []) {
      const a = k > 0 ? c.pos[k - 1] : null, b = c.pos[k];
      const els = [...toks.querySelectorAll(`[data-team="${c.team}"][data-crowd]`)];
      const water = ['swim', 'dive'].includes(c.as) || s.plate?.water;
      if (b && els.length) {
        let from = a;
        if (!from) {
          // in: a runner at a run, a rider from off the side; anybody else pops in where they are
          if (c.as === 'run') from = [c.ltr ? -10 : 110, b[1]];
          else if (c.as === 'ride') from = [b[0] < 50 ? -18 : 118, b[1]];
        }
        if (from && (from[0] !== b[0] || from[1] !== b[1])) {
          const run = c.as === 'run' || c.as === 'stand';
          els.forEach((e, j) => {
            const off = e.classList.contains('swim') ? [j * Math.max(4, (s.crowdSize || 6) * 0.95), j * 1.2] : [0, 0];
            const kf = c.as === 'hop' ? [{ left: from[0] + '%', top: from[1] + '%' }, { left: (from[0] + b[0]) / 2 + '%', top: Math.min(from[1], b[1]) - 7 + '%' }, { left: b[0] + '%', top: b[1] + '%' }]
              : [{ left: from[0] + off[0] + '%', top: from[1] + off[1] + '%' }, { left: b[0] + off[0] + '%', top: b[1] + off[1] + '%' }];
            e.animate(kf, { duration: run ? 1500 : 1300, easing: 'ease-in-out', fill: 'backwards' });
          });
          if (water) for (let q = 0; q < 3; q++) later(q * 380, () => { const p = lerpPos(from, b, q / 3); splash(p[0], p[1], 4); });
          else if (c.as !== 'zip' && c.as !== 'para') dustTrail(from, b, 1300, 0);
        } else if (!a) els.forEach(e => e.animate([{ opacity: 0, transform: 'translate(-50%,-80%) scale(.7)' }, { opacity: 1, transform: e.classList.contains('swim') ? 'translate(-50%,-50%)' : 'translate(-50%,-100%)' }], { duration: 420, easing: 'ease-out', fill: 'backwards' }));
        // what the attempt did: a failed try shakes and slips, a success jumps
        const st = c.st[k];
        if (st === 'fail') { els.forEach(e => e.animate(SHAKE, { duration: 420, iterations: 2, delay: 500 })); later(700, () => (water ? splash(b[0], b[1], 8) : particles('dust', b[0], b[1], 6, 4))); }
        if (st === 'done' && c.st[k - 1] !== 'done') els.forEach(e => e.querySelector('.pair')?.animate(JUMP, { duration: 900, delay: 400, iterations: 2 }));
      } else if (a && !b && c.st[k] === 'gone') {
        // out of the shot at a run: a ghost of them that leaves and is gone
        const g = crowdEl(ep, s, { ...c, pos: [a], st: ['run'] }, 0);
        if (!g) continue;
        const to = c.as === 'ride' ? [a[0] + 40, a[1]] : [c.ltr === false ? -12 : 112, a[1]];
        [...toks.querySelectorAll(`[data-team="${c.team}"][data-crowd]`)].forEach(e => {
          e.classList.add('running', to[0] < a[0] ? 'rtl' : 'ltr');
          e.animate([{ left: a[0] + '%', top: a[1] + '%', opacity: 1 }, { left: to[0] + '%', top: to[1] + '%', opacity: 0.9 }], { duration: 1500, easing: 'ease-in', fill: 'forwards' })
            .finished.then(() => e.remove()).catch(() => {});
        });
        if (!water) dustTrail(a, to, 1300, 0);
      }
    }
  }
  const SHAKE = [{ transform: 'translate(-50%,-100%) rotate(0)' }, { transform: 'translate(-56%,-100%) rotate(-9deg)' }, { transform: 'translate(-44%,-100%) rotate(9deg)' }, { transform: 'translate(-50%,-100%) rotate(0)' }];
  // the one listening: a nod, a shake, a jump, a laugh, a tilt of the head, a slump
  const REACT = {
    nod: [{ transform: 'translateY(0)' }, { transform: 'translateY(.5cqw) rotate(2deg)' }, { transform: 'translateY(0)' }, { transform: 'translateY(.4cqw)' }, { transform: 'translateY(0)' }],
    shake: [{ transform: 'rotate(0)' }, { transform: 'rotate(-11deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(0)' }],
    jump: [{ transform: 'translateY(0)' }, { transform: 'translateY(-1.8cqw) scale(1.08)', offset: 0.4 }, { transform: 'translateY(0) scaleY(.9)', offset: 0.75 }, { transform: 'translateY(0)' }],
    laugh: [{ transform: 'rotate(0)' }, { transform: 'translateY(-.4cqw) rotate(-6deg)' }, { transform: 'translateY(0) rotate(5deg)' }, { transform: 'translateY(-.4cqw) rotate(-5deg)' }, { transform: 'rotate(0)' }],
    tilt: [{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)', offset: 0.3 }, { transform: 'rotate(-14deg)', offset: 0.7 }, { transform: 'rotate(0)' }],
    slump: [{ transform: 'translateY(0)' }, { transform: 'translateY(1cqw) scale(.94)', offset: 0.4 }, { transform: 'translateY(.9cqw) scale(.95)', offset: 0.85 }, { transform: 'translateY(0)' }],
  };
  function react(s, k) {
    const r = s.steps[k]?.react;
    if (!r) return;
    const imgs = r.who ? [...stage.querySelectorAll(`img[data-p="${CSS.escape(r.who)}"]`)] : [...toks.querySelectorAll(`[data-team="${r.team}"]:not([data-crowd]) img`)];
    imgs.forEach((im, j) => im.animate(REACT[r.how] || REACT.nod, { duration: r.how === 'jump' ? 800 : r.how === 'tilt' ? 1400 : 900, delay: 350 + j * 90, easing: 'ease-in-out', iterations: r.how === 'laugh' ? 2 : 1 }));
  }
  const lerpPos = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  function overlays(ep, s, k, fresh) {
    const step = s.steps[k];
    if (step?.part === 'tip' && step.tip) {
      const t = step.tip;
      const c = document.createElement('div'); c.className = 'tipcard' + (fresh ? '' : ' still');
      c.innerHTML = `<img class="card" src="${raceUrl('c-tip')}" alt=""><div class="in"><div class="k">${esc(t.kind)}</div><div class="lb">${esc(t.label)}</div><div class="b">${esc(t.desc)}</div>${t.sides.length ? `<div class="os">${t.sides.map(x => `<div class="o">${esc(x)}</div>`).join('')}</div>` : ''}</div>`;
      ui.appendChild(c);
    }
    if (step?.slam) {
      const sl = document.createElement('div'); sl.className = `slam ${step.slam.cls || ''}${fresh ? ' fresh' : ''}`;
      sl.innerHTML = `<div class="band"><div class="big">${esc(step.slam.text)}</div></div>${step.slam.cls === 'boom' ? `<br><img src="${raceUrl('c-boomerang')}" alt="">` : ''}`;
      ui.appendChild(sl);
      if (fresh) { const at = s.matAt || [50, 50]; if (step.slam.cls === 'gold') for (let q = 0; q < 3; q++) later(q * 250, () => particles('spark', 30 + Math.random() * 40, 30, 14, 14)); else flash(at[0], 30); }
    }
    ui.querySelectorAll('.clip').forEach(e => e.remove());
    if (step?.clip && s.kind === 'map') {
      // last time, on screen: the one saying it, framed as a clip over the map
      const team = step.team, c = team ? ep.color[team] : '#c9d3ea';
      const d = document.createElement('div'); d.className = 'clip' + (fresh ? ' fresh' : ''); d.style.setProperty('--c', c);
      d.innerHTML = `<div class="cl-h">LAST TIME</div><img data-p="${esc(step.by)}" src="${team ? faceOf(step.by) : 'data:image/svg+xml;utf8,' + encodeURIComponent(LOCAL_SVG)}" alt=""><div class="cl-n">${esc(step.by)}${team ? ' · ' + esc(teamOf(ep, team).name) : ''}</div>`;
      ui.appendChild(d);
    }
    if (fresh && k === 0 && s.timecard) {
      const tc = document.createElement('div'); tc.className = 'timecard'; tc.textContent = s.timecard; stage.appendChild(tc); later(2300, () => tc.remove());
    }
  }


  // ── the one entry point ──
  function paint(ep, si, k, fresh = false) {
    const s = ep.screens[si];
    const same = cur.ep === ep && cur.si === si;
    const stepFresh = fresh && same && k === cur.idx + 1;
    const screenFresh = fresh && !same && k === 0;
    clearTimers();
    if (!same || !stepFresh) {
      // draw the screen from scratch, as it stands after step k
      toks.innerHTML = ''; fx.innerHTML = ''; under.innerHTML = ''; ui.innerHTML = '';
      stage.querySelectorAll('.timecard').forEach(e => e.remove());
      if (!same) { lastWho = null; side = 'left'; }
      cur = { ep, si, idx: k };
      hud(ep, s);
      stage.classList.toggle('replay', !!s.replay);
      const kb = ['kb-in', 'kb-pan', 'kb-out'][hash(s.id) % 3];
      if (s.kind === 'iv') { setPlate(null, ''); interview(ep, s, screenFresh); }
      else if (s.kind === 'map' || s.kind === 'flight') { setPlate(null, ''); mapScreen(ep, s, screenFresh); }
      else { setPlate(plateOf(s), !same ? kb : undefined); }
      if (['logo', 'title', 'end'].includes(s.kind)) ui.innerHTML = titleCard(s, screenFresh, hash(ep.place) % 1000 + 3);
      if (s.kind === 'world') world(ep, s, k, screenFresh);
      if (s.mode === 'landing') {
        const pl = document.createElement('img'); pl.className = 'prop'; pl.src = raceUrl('plane'); pl.style.cssText += 'left:50%;top:40%;width:7cqw;z-index:12';
        fx.appendChild(pl);
        pl.animate([{ left: '-8%', top: '6%', transform: 'translate(-50%,-50%) rotate(118deg) scale(.6)' }, { left: '50%', top: '40%', transform: 'translate(-50%,-50%) rotate(100deg) scale(1)', offset: 0.7 },
          { left: '96%', top: '46%', transform: 'translate(-50%,-50%) rotate(90deg) scale(1.1)', opacity: 0 }], { duration: screenFresh ? 3400 : 1, fill: 'forwards', easing: 'ease-out' });
      }
      if (!same) ambient(s.kind === 'world' || s.kind === 'title' ? (s.plate?.place || s.place) : null);
      if (screenFresh) animateStep(ep, s, 0);
    } else {
      cur.idx = k;
      ui.querySelectorAll('.tipcard,.slam,.stamp').forEach(e => e.remove());
      // what changes with this step: positions, ranks and who is out are redrawn from the staging
      if (s.kind === 'world') { toks.innerHTML = ''; fx.querySelectorAll('.don').forEach(e => e.remove()); ui.querySelectorAll('.inset').forEach(e => e.remove()); under.querySelectorAll('.prop').forEach(e => e.remove()); world(ep, s, k, true); }
      animateStep(ep, s, k);
    }
    const step = s.steps[k];
    overlays(ep, s, k, fresh);
    vn(ep, s, step, fresh);
    speaking(step?.part === 'pause' ? 'Don' : step?.by);
    camera(s, k, stepFresh);
    if (stepFresh || screenFresh) react(s, k);
  }

  return { paint, el: frame, stop: () => { clearTimers(); clearInterval(ambTimer); } };
  void legLabel;
}
