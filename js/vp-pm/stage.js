// ══════════════════════════════════════════════════════════════════════
// vp-pm/stage.js — the visual-novel stage (Plan 5)
// ══════════════════════════════════════════════════════════════════════
//
// Mockup v2's stage, driven by vp-pm/steps.js. `paintStage(el, screen, idx)`
// paints the WHOLE state of step idx every time (ADDING-A-SHOW §6.5): a jump,
// "Reveal all" and a re-render all land on the same picture, and the one-shot
// business (a bust sliding in, the dialogue typing, a pop rising, a toast, a
// shake, the neon striking) plays only on a fresh step.
//
// At rest (idx -1) the stage shows the set and the screen's name, and nobody:
// no bust, no line, no board (the spoiler rules).
import { playerAvatarUrl } from '../players.js';
import { SHOWS } from '../shows.js';
import { voiceTick, stingFor, playSting, moodStep } from './sound.js';

// The host is not a player: no catalogue entry, one portrait (shows.js, HOSTS_BY_FORMAT).
const HOST_PORTRAIT = 'assets/avatars/dior.jpg';
const hostName = () => SHOWS['perfect-match'].words.host;
const P = c => `pmv-${c}`;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const HEART = 'M0,-3 C-6,-13 -19,-3 0,11 C19,-3 6,-13 0,-3Z';
export const IC = {
  heart: `<svg viewBox="-20 -14 40 27"><path d="${HEART}"/></svg>`,
  heartW: `<svg viewBox="-20 -14 40 27"><path d="${HEART}" fill="#fff"/></svg>`,
  crack: `<svg viewBox="-20 -14 40 27"><path d="${HEART}" fill="#fff"/><path d="M-1 -4 l4 5 -4 4 4 5" stroke="#b91c1c" stroke-width="2.4" fill="none"/></svg>`,
  spark: `<svg viewBox="0 0 24 24"><path d="M12 1l2.6 7.4L22 11l-7.4 2.6L12 21l-2.6-7.4L2 11l7.4-2.6z" fill="#fff"/></svg>`,
  eye: `<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="#fff"/></svg>`,
  star: `<svg viewBox="0 0 24 24"><path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z" fill="#fff"/></svg>`,
  next: `<svg viewBox="0 0 16 16"><path d="M4 2l8 6-8 6z" fill="currentColor"/></svg>`,
  scissors: `<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="6" cy="18" r="3" fill="none" stroke="#fff" stroke-width="2"/><circle cx="6" cy="6" r="3" fill="none" stroke="#fff" stroke-width="2"/><path d="M8.5 7.5L21 19M8.5 16.5L21 5" stroke="#fff" stroke-width="2"/></svg>`,
  sun: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></g></svg>`,
  moon: `<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z" fill="currentColor"/></svg>`,
};

// ── faces ──────────────────────────────────────────────────────────────
export function portraitUrl(name) {
  if (name === hostName()) return HOST_PORTRAIT;
  try { return playerAvatarUrl(name) || null; } catch { return null; }
}
// Every islander has a colour pair of their own, from their name.
const PALETTE = [['#f59e0b', '#b45309'], ['#60a5fa', '#2563eb'], ['#34d399', '#047857'], ['#f472b6', '#be185d'],
  ['#818cf8', '#4338ca'], ['#2dd4bf', '#0f766e'], ['#22d3ee', '#0e7490'], ['#fb923c', '#c2410c'], ['#d6a36b', '#8a5a2b'],
  ['#f87171', '#b91c1c'], ['#fcd34d', '#b45309'], ['#f9a8d4', '#db2777'], ['#a3e635', '#4d7c0f'], ['#c084fc', '#7e22ce']];
export function colourOf(name) {
  if (name === hostName()) return ['#ff8cc6', '#ff2e88'];
  let h = 7;
  for (const ch of String(name)) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
const initials = n => String(n || '?').slice(0, 2).toUpperCase();
const img = n => { const u = portraitUrl(n); return u ? `<img src="${esc(u)}" alt="" onerror="this.remove()">` : ''; };
export const mini = n => `<span class="${P('mini')}" title="${esc(n)}">${img(n) || esc(initials(n))}</span>`;

// ── the sets: light, never drawings ────────────────────────────────────
function sceneHtml(bg) {
  const rnd = (i, m) => ((i * 9301 + 49297) % 233280) / 233280 * m;
  const bokeh = (n, cls, y0, y1, size) => `<div class="${P('bokeh')} ${cls ? P(cls) : ''}">${Array.from({ length: n }, (_, i) =>
    `<i style="left:${rnd(i + 1, 100).toFixed(1)}%;top:${(y0 + rnd(i + 7, y1 - y0)).toFixed(1)}%;width:${(size * (0.5 + rnd(i + 3, 1))).toFixed(1)}%;aspect-ratio:1;--o:${(.3 + rnd(i + 5, .6)).toFixed(2)};--t:${(4 + rnd(i + 2, 5)).toFixed(1)}s;--d:${(-rnd(i + 4, 6)).toFixed(1)}s"></i>`).join('')}</div>`;
  const string = y => `<div class="${P('bokeh')} ${P('string')}">${Array.from({ length: 16 }, (_, i) => {
    const t = i / 15, sag = Math.sin(t * Math.PI) * 9;
    return `<i style="left:${(t * 100).toFixed(1)}%;top:${(y + sag).toFixed(1)}%;width:2.2%;aspect-ratio:1;--o:.9;--t:${(2 + (i % 3)).toFixed(1)}s;--d:-${(i % 4) * .5}s"></i>`; }).join('')}</div>`;
  const embers = `<div class="${P('bokeh')} ${P('embers')}">${Array.from({ length: 22 }, (_, i) =>
    `<i style="left:${(38 + rnd(i + 1, 24)).toFixed(1)}%;bottom:4%;width:${(.4 + rnd(i + 2, .5)).toFixed(2)}%;aspect-ratio:1;--x:${(rnd(i + 3, 80) - 40).toFixed(0)}px;--t:${(2.4 + rnd(i + 4, 2.4)).toFixed(1)}s;--d:-${rnd(i + 5, 4).toFixed(1)}s"></i>`).join('')}</div>`;
  const inner = {
    day: `<div class="${P('sun')}"></div><div class="${P('shimmer')}"></div>${bokeh(14, '', 5, 50, 5)}${string(6)}`,
    terrace: `${bokeh(26, 'string', 4, 60, 4)}`,
    night: `${bokeh(18, '', 2, 40, 1.6)}<div class="${P('glow')}"></div>${embers}${string(5)}`,
    hut: `<div class="${P('weave')}"></div>${bokeh(8, 'string', 10, 50, 6)}`,
    casa: `${bokeh(24, '', 5, 80, 3)}`,
    // The intro tape: a studio, not the villa — a colour wall, the show's
    // heart outlined huge behind them, stripes of light going past.
    vt: `<div class="${P('vt-stripes')}"></div><svg class="${P('vt-heart')}" viewBox="-20 -14 40 27"><path d="${HEART}"/></svg>${bokeh(10, '', 5, 90, 5)}`,
    final: `<div class="${P('beams')}"></div>${bokeh(20, 'string', 5, 70, 3)}`,
    // The final date: golden hour, a low sun over the water, lights strung above.
    date: `<div class="${P('sun')}"></div><div class="${P('shimmer')}"></div>${string(8)}${bokeh(12, '', 5, 45, 3)}`,
    // Movie Night: an outdoor cinema on the lawn — the projector's beam from
    // behind the audience, fairy lights, and the beanbags in rows.
    cinema: `<div class="${P('beam')}"></div>${string(4)}${bokeh(10, '', 2, 30, 1.4)}<div class="${P('beanbags')}"><i></i><i></i><i></i><i></i><i></i></div>`,
  }[bg] || '';
  return `<div class="${P('scene')} ${P('sc-' + bg)}">${inner}</div>`;
}

const petalsHtml = () => Array.from({ length: 30 }, (_, i) => {
  const a = i * 137.5 * Math.PI / 180, d = 160 + (i % 5) * 70;
  return `<i style="--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d * .7 - 40).toFixed(0)}px;--r:${(i * 53) % 360}deg;--dl:${(i % 8) * 50}ms;--pk:${['#ff4fa0', '#ffc15e', '#ff7a59', '#fff'][i % 4]}">${IC.heart}</i>`;
}).join('');

function frame(bg, hud, board) {
  const screen = bg === 'cinema' ? `<div class="${P('bigscreen')}"><div class="${P('bs-in')}"><b>Movie Night</b></div><div class="${P('bs-rec')}"></div><div class="${P('bs-sub')}"></div></div>
    <div class="${P('poster')}"><small>Now showing</small><b></b></div>` : '';
  return `<div class="${P('cam')}">${sceneHtml(bg)}${screen}<div class="${P('busts')}"></div></div>
    <div class="${P('vign')}"></div><div class="${P('grain')}"></div>
    <div class="${P('neon')} ${P('off')}"></div>
    <svg class="${P('ecg')}" viewBox="0 0 1000 100" preserveAspectRatio="none"><polyline/></svg><div class="${P('bpm')}"></div>
    <div class="${P('deal')}"></div>
    ${board ? `<div class="${P('board')} ${P('hide')}"><h5>Vote for your Perfect Match</h5>${board.map(([n, p]) =>
      `<div class="${P('row')}"><span>${esc(n)}</span><span class="${P('pc')}">${p}%</span><div class="${P('bar')}"><i></i></div></div>`).join('')}</div>` : ''}
    <svg class="${P('env')}" viewBox="0 0 200 150"><g class="${P('envcard')}"><rect x="30" y="24" width="140" height="92" rx="8" fill="#fffdf7" stroke="#ff2e88" stroke-width="3"/>
      <text class="${P('envword')}" x="100" y="80" text-anchor="middle" font-family="Bebas Neue" font-size="40" fill="#ff2e88"></text></g>
      <rect x="8" y="44" width="184" height="100" rx="12" fill="#ff4fa0" stroke="#fff" stroke-width="3"/>
      <path class="${P('flap')}" d="M8 44 L100 106 L192 44Z" fill="#ff2e88" stroke="#fff" stroke-width="3"/><path d="${HEART}" transform="translate(100 104) scale(.9)" fill="#fff"/></svg>
    <div class="${P('phone')}"><div class="${P('scr')}"><h4>I got a text!</h4><div class="${P('tag')}"></div><p></p></div></div>
    <div class="${P('polaroid')}"><div class="${P('pol-photo')}"></div><div class="${P('pol-cap')}"></div></div>
    <div class="${P('crack')}"></div>
    <svg class="${P('tri')}" viewBox="0 0 300 226" preserveAspectRatio="xMidYMid meet"></svg>
    <div class="${P('poly')}"><div class="${P('poly-scr')}"><svg viewBox="0 0 200 60" preserveAspectRatio="none"><polyline class="${P('poly-trace')}"/></svg><small></small></div><div class="${P('poly-lamp')}"><i></i><b></b></div></div>
    <div class="${P('tug')}"><div class="${P('tug-a')}"></div><div class="${P('tug-bar')}"><i></i></div><div class="${P('tug-b')}"></div></div>
    <div class="${P('petals')}">${petalsHtml()}</div>
    <div class="${P('kissfx')}"></div>
    <svg class="${P('curve')}" viewBox="0 0 320 170"></svg>
    <div class="${P('fireworks')}">${fireworksHtml()}</div>
    <div class="${P('pops')}"></div>
    <div class="${P('toast')}"></div>
    <div class="${P('caption')}"></div>
    <div class="${P('l3')}"><small></small><b></b></div>
    <div class="${P('dlg')} ${P('hide')}"><div class="${P('plate')}"></div><div class="${P('txt')}"></div><div class="${P('beat')}"></div><span class="${P('nxt')}">${IC.next}</span></div>
    <div class="${P('hud')}"><span class="${P('pill')}">${esc(hud)}</span><span class="${P('pill')} ${P('air')}"><span class="${P('scissors')}">${IC.scissors}</span><span class="${P('airtxt')}">On air</span></span></div>
    <div class="${P('headline')}"></div>
    <div class="${P('wipe')}"><svg viewBox="-20 -14 40 27"><path d="${HEART}"/></svg></div>
    <div class="${P('switch')}"><i></i><span></span></div>`;
}

/** The stage at rest: the set, the HUD and the screen's name. Nobody on it. */
export function stageHtml(id, screen, hud) {
  const board = screen.steps.find(s => s.board)?.board || null;
  return `<div class="${P('stage')}" id="${esc(id)}" data-bg="${esc(screen.bg)}">${frame(screen.bg, hud, board)
    .replace(`<div class="${P('headline')}"></div>`, `<div class="${P('headline')} ${P('on')}">${esc(screen.label)}</div>`)}</div>`;
}

// ── the kiss ──────────────────────────────────────────────────────────
// What pops between the two, by the kind of kiss (steps.js kissOf): a heart
// and a spray of small ones for a kiss that landed, the sparkle and a name
// for a couple's first, one small heart for a peck, a blush for the cheek,
// and a heart that cracks in two when only one of them wanted it.
const heartSvg = (cls, fill) => `<svg class="${cls}" viewBox="-20 -14 40 27"><path d="${HEART}" fill="${fill}" stroke="#fff" stroke-width="1.6"/></svg>`;
function kissFxHtml(size) {
  const minis = n => Array.from({ length: n }, (_, i) => `<i style="--x:${((i - (n - 1) / 2) * 34).toFixed(0)}px;--d:${i * 90}ms">${heartSvg('', ['#ff4fa0', '#ff7a59', '#ffc15e'][i % 3])}</i>`).join('');
  if (size === 'awkward') return `<div class="${P('kcrack')}">${heartSvg(P('kl'), '#ff7aa8')}${heartSvg(P('kr'), '#ff7aa8')}</div>`;
  if (size === 'cheek') return `<div class="${P('kblush')}"><b></b><b></b></div>${heartSvg(P('kbig'), '#ff9cc2')}`;
  if (size === 'peck') return heartSvg(P('kbig'), '#ff4fa0');
  const ring = size === 'first' ? `<div class="${P('kring')}"></div><div class="${P('kname')}">First kiss</div>` : '';
  return `${ring}${heartSvg(P('kbig'), '#ff2e88')}<div class="${P('kminis')}">${minis(size === 'first' ? 7 : 5)}</div>`;
}

// The winners: fireworks over the villa, five bursts at their own heights and times.
const fireworksHtml = () => [[22, 26, 0], [70, 20, 350], [46, 12, 700], [84, 34, 1100], [12, 38, 1450]].map(([x, y, d], k) =>
  `<div class="${P('fw')}" style="left:${x}%;top:${y}%;--d:${d}ms">${Array.from({ length: 14 }, (_, i) => {
    const a = i / 14 * Math.PI * 2, r = 70 + (k % 2) * 25;
    return `<i style="--x:${(Math.cos(a) * r).toFixed(0)}px;--y:${(Math.sin(a) * r).toFixed(0)}px;--c:${['#ff4fa0', '#ffc15e', '#fff', '#7dd3fc', '#ff7a59'][(i + k) % 5]}"></i>`;
  }).join('')}</div>`).join('');

const timers = new WeakMap();
const later = (el, ms, fn) => { const t = setTimeout(fn, ms); (timers.get(el) || timers.set(el, []).get(el)).push(t); };
function clearTimers(el) { for (const t of timers.get(el) || []) clearTimeout(t); timers.set(el, []); }

/** Paint step `idx` of `screen` onto the stage element: the whole state. */
export function paintStage(el, screen, idx, { fresh = false, hud = '' } = {}) {
  if (!el) return;
  clearTimers(el);
  const st = screen.steps[idx] || null;
  const prev = idx > 0 ? screen.steps[idx - 1] : null;
  const board = screen.steps.find(s => s.board)?.board || null;
  el.innerHTML = frame(st?.bg || screen.bg, hud, board);
  const q = s => el.querySelector('.' + P(s));
  el.classList.toggle(P('fresh'), !!(fresh && st));
  el.classList.toggle(P('raw'), !!(st?.raw || st?.fx?.raw));
  el.classList.remove(P('shake'));
  // A teaser: quick cuts, each line cut off, the break's bug in the corner.
  el.classList.toggle(P('teaser'), !!st?.fx?.teaser);
  el.classList.remove(P('flash'));
  if (fresh && st?.fx?.teaser) { void el.offsetWidth; el.classList.add(P('flash')); }
  const hl = q('headline');
  if (!st) { hl.textContent = screen.label; hl.classList.add(P('on')); return; }
  const tape = st.bg === 'vt';
  el.classList.toggle(P('vt'), tape);
  q('airtxt').textContent = tape ? 'Intro tape' : st.raw ? 'Unaired footage' : st.fx?.raw ? 'Aired at last' : 'On air';
  // Between the intro tape and the villa: a channel switch, not a wipe —
  // static, a roll, and where we are now.
  const from = prev ? prev.bg : screen.bg;
  const switched = fresh && from !== st.bg && (tape || from === 'vt');
  // The moment's sting, the one the staging calls for (vp-pm/sound.js).
  if (fresh) { playSting(stingFor(st, { switched })); moodStep(st); }
  if (switched) {
    const sw = q('switch');
    sw.querySelector('span').textContent = tape ? 'Meet the islander' : 'In the villa';
    sw.classList.add(P('go'));
  } else if (fresh && prev && prev.bg !== st.bg) q('wipe').classList.add(P('go'));
  if (st.vt) {
    const l3 = q('l3');
    l3.querySelector('small').textContent = st.vt.tag;
    l3.querySelector('b').textContent = st.vt.name;
    if (fresh && st.sceneStart) later(el, 500, () => l3.classList.add(P('on'))); else l3.classList.add(P('on'));
  }

  // the busts
  const busts = q('busts');
  busts.innerHTML = st.cast.map(([n, x, mode]) => {
    const [c1, c2] = colourOf(n);
    const cls = [P('bust'), mode === 'speak' ? P('speak') : '', mode === 'back' ? P('back') : '', mode === 'hurt' ? `${P('hurt')} ${P('back')}` : '',
      st.seated ? P('seated') : ''].join(' ');
    // A new face slides in from its side on a fresh step; a jump lands it in place.
    const enters = fresh && st.sceneStart;
    return `<div class="${cls}" data-n="${esc(n)}" style="left:${enters ? (x < 50 ? -15 : x > 50 ? 115 : x) : x}%;--c1:${c1};--c2:${c2}">
      <div class="${P('frame')}">${img(n) || `<div class="${P('ini')}">${esc(initials(n))}</div>`}</div><div class="${P('rim')}"></div></div>`;
  }).join('');
  // The bombshell: a silhouette at the top of the steps under a spotlight,
  // then the lights come up on the face (fresh only; a jump lands lit).
  el.classList.toggle(P('revealing'), !!(fresh && st.fx?.reveal && st.sceneStart));
  if (fresh && st.sceneStart) requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const [n, x] of st.cast) { const b = busts.querySelector(`[data-n="${CSS.escape(n)}"]`); if (b) b.style.left = x + '%'; }
  }));

  // THE KISS: the two slide together and lean in, then the heart. For a kiss
  // only one of them wanted, the other leans away.
  if (st.kiss && fresh) {
    const at = n => st.cast.find(c => c[0] === n)?.[1];
    const xa = at(st.kiss.a), xb = at(st.kiss.b);
    const ba = busts.querySelector(`[data-n="${CSS.escape(st.kiss.a)}"]`), bb = busts.querySelector(`[data-n="${CSS.escape(st.kiss.b)}"]`);
    if (ba && bb && xa != null && xb != null) {
      const size = st.kiss.size || 'spark';
      const mid = (xa + xb) / 2, gap = size === 'awkward' ? 8.5 : size === 'cheek' ? 6.5 : 5.2;
      const [L, R] = xa <= xb ? [ba, bb] : [bb, ba];
      later(el, 450, () => {
        L.style.left = (mid - gap) + '%'; R.style.left = (mid + gap) + '%';
        L.classList.add(P('kissL')); R.classList.add(P('kissR'));
        if (size === 'awkward') bb.classList.add(P('kissAway'));
        if (size === 'cheek') bb.classList.add(P('kissBlush'));
        const fx = q('kissfx');
        fx.className = `${P('kissfx')} ${P('k-' + size)}`;
        fx.style.left = mid + '%';
        fx.innerHTML = kissFxHtml(size);
        later(el, 520, () => { fx.classList.add(P('go')); playSting(size === 'awkward' ? 'pm-kiss-awkward' : 'pm-kiss'); });
      });
    }
  }

  // the camera pushes in on the speaker
  const cam = q('cam');
  const sp = st.cast.find(c => c[2] === 'speak');
  cam.style.setProperty('--ox', (sp ? sp[1] : 50) + '%');
  if (st.close || (st.fx && st.big)) { if (fresh) later(el, 250, () => cam.classList.add(P('close'))); else cam.classList.add(P('close')); }
  if (st.fx?.shake && fresh) later(el, 350, () => el.classList.add(P('shake')));

  // the caption (the staging) and the dialogue
  const cap = q('caption');
  // A clip's caption is its title, and the marquee already says it.
  if (st.caption && !st.clipOn && !st.fx?.polaroid && !st.fx?.sides && !st.fx?.triangle && !st.vt) { cap.textContent = st.caption; cap.classList.add(P('on')); }
  const dlg = q('dlg');
  dlg.classList.remove(P('hide'));
  const voice = st.voice || '';
  for (const v of ['dior', 'narrator', 'hut', 'stagev']) dlg.classList.toggle(P(v), voice === v || (v === 'stagev' && voice === 'stage'));
  const plate = q('plate');
  const [c1, c2] = colourOf(st.who || '');
  plate.style.setProperty('--pc1', c1); plate.style.setProperty('--pc2', c2);
  const tag = { hut: 'Beach hut', narrator: 'Voiceover', dior: 'Host', text: 'Text', clip: 'On screen' }[voice];
  plate.innerHTML = `${esc(st.who || '')}${tag ? `<em>${tag}</em>` : ''}`;
  const txt = q('txt');
  txt.classList.toggle(P('narr'), voice === 'narrator' || voice === 'stage');
  if (fresh) {
    let k = 0; txt.textContent = '';
    const text = st.text || '';
    // Each letter as it types, and a voice blip every few (vp-pm/sound.js).
    const tick = () => { txt.textContent = text.slice(0, ++k); voiceTick(st.who, voice, text[k - 1], k, text); if (k < text.length) later(el, 16, tick); };
    tick();
  } else txt.textContent = st.text || '';
  const beat = q('beat');
  beat.textContent = st.beat || '';

  // Movie Night's screen: the clip plays inside it, in its own words.
  const bs = q('bigscreen');
  if (bs) {
    el.classList.toggle(P('playing'), !!st.clipOn);
    if (st.clipOn) {
      const faces = [...new Set(st.clipOn.faces)].slice(0, 3);
      bs.querySelector('.' + P('bs-in')).innerHTML = faces.map(n => `<span class="${P('bs-face')}${n === st.clipOn.speaker ? ' ' + P('on') : ''}">${img(n) || `<i>${esc(initials(n))}</i>`}</span>`).join('');
      bs.querySelector('.' + P('bs-rec')).textContent = `REC${st.clipOn.ep != null ? ` · Episode ${st.clipOn.ep}` : ''}`;
      bs.querySelector('.' + P('bs-sub')).textContent = st.text ? `${st.who ? st.who + ': ' : ''}${st.text}` : '';
    }
    // The marquee: the clip's title, on the first line of it.
    if (st.fx?.poster && fresh) {
      const po = q('poster'); po.querySelector('b').textContent = st.fx.poster;
      po.classList.add(P('go'));
    }
  }
  if (st.fx?.flash && fresh) { el.classList.remove(P('flash')); void el.offsetWidth; el.classList.add(P('flash')); }
  // A blow-up: the villa takes sides. The tug of war fills face by face and
  // leans to the bigger camp; a red crack splits the stage down the middle.
  el.classList.toggle(P('divided'), !!st.fx?.sides);
  el.classList.toggle(P('tears'), st.fx?.tears === true);
  el.classList.toggle(P('warmth'), st.fx?.tears === 'warm');
  if (st.fx?.sides) {
    const tug = q('tug');
    const { A = [], B = [] } = st.fx.sides;
    tug.querySelector('.' + P('tug-a')).innerHTML = A.map(mini).join('');
    tug.querySelector('.' + P('tug-b')).innerHTML = B.map(mini).join('');
    const share = A.length / Math.max(1, A.length + B.length);
    tug.querySelector('.' + P('tug-bar') + ' i').style.left = `${Math.round(share * 100)}%`;
    tug.classList.add(P('on'));
    if (fresh) { tug.classList.remove(P('pulse')); void tug.offsetWidth; tug.classList.add(P('pulse')); }
  }
  // The lie detector: the needle while the question is asked and answered,
  // then the light. The trace is jumpier on a lie — the machine's reading, not
  // the viewer's spoiler: it only shows on the reading's own line.
  if (st.poly) {
    const pg = q('poly'), L = st.poly.light;
    let d = '';
    for (let i = 0; i <= 80; i++) {
      const x = i * 2.5, amp = L === 'red' ? 22 : L ? 9 : 14;
      d += `${x},${(30 + Math.sin(i * 0.9) * amp * Math.sin(i * 0.23) + ((i * 37) % 11 - 5) * (L === 'red' ? 1.4 : 0.6)).toFixed(1)} `;
    }
    pg.querySelector('.' + P('poly-trace')).setAttribute('points', d);
    pg.querySelector('small').textContent = st.poly.who;
    pg.classList.add(P('on'));
    pg.dataset.light = L || 'reading';
    pg.querySelector('b').textContent = { green: 'Truth', red: 'Lie', blue: 'Unsure' }[L] || 'Reading';
    if (fresh && L) { pg.classList.remove(P('flash')); void pg.offsetWidth; pg.classList.add(P('flash')); }
  }
  // The love triangle: three faces, the one in the middle at the top, a line
  // to each as thick as the pull, and the teams counted under each side.
  if (st.fx?.triangle) {
    const T = st.fx.triangle, svg = q('tri');
    const pts = { h: [150, 38], x: [58, 160], y: [242, 160] };
    const w = v => (1 + 1.1 * Math.max(0, v || 0)).toFixed(1);
    const line = (a, b, v, cls) => `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}" stroke-width="${w(v)}" class="${P(cls)}"/>`;
    const face = (k, n) => { const u = portraitUrl(n); const [cx, cy] = pts[k];
      return `<clipPath id="tri-${k}"><circle cx="${cx}" cy="${cy}" r="24"/></clipPath>
        <circle cx="${cx}" cy="${cy}" r="27" class="${P(T.won === n ? 'tri-won' : 'tri-ring')}"/>
        ${u ? `<image href="${esc(u)}" x="${cx - 24}" y="${cy - 24}" width="48" height="48" clip-path="url(#tri-${k})" preserveAspectRatio="xMidYMid slice"/>` : `<circle cx="${cx}" cy="${cy}" r="24" fill="#3b2140"/><text x="${cx}" y="${cy + 6}" text-anchor="middle" class="${P('tri-ini')}">${esc(initials(n))}</text>`}
        <text x="${cx}" y="${cy + 42}" text-anchor="middle" class="${P('tri-name')}">${esc(n)}</text>`; };
    const teams = T.teams ? `<text x="58" y="222" text-anchor="middle" class="${P('tri-team')}">Team ${esc(T.x)} · ${T.teams.X.length}</text>
      <text x="242" y="222" text-anchor="middle" class="${P('tri-team')}">Team ${esc(T.y)} · ${T.teams.Y.length}</text>` : '';
    svg.innerHTML = `${line('h', 'x', T.ax, 'tri-pull')}${line('h', 'y', T.ay, 'tri-pull')}${line('x', 'y', 3, 'tri-rival')}
      ${face('h', T.h)}${face('x', T.x)}${face('y', T.y)}${teams}`;
    svg.classList.add(P('on'));
    if (fresh) { svg.classList.remove(P('draw')); void svg.getBoundingClientRect(); svg.classList.add(P('draw')); }
  }
  // The Casa photo: a Polaroid of the real moment, dropped on the stage, developing.
  if (st.fx?.polaroid) {
    const po = q('polaroid');
    po.querySelector('.' + P('pol-photo')).innerHTML = st.fx.polaroid.faces.slice(0, 2)
      .map(n => `<span>${img(n) || `<i>${esc(initials(n))}</i>`}</span>`).join('');
    po.querySelector('.' + P('pol-cap')).textContent = st.fx.polaroid.caption
      || `Casa Amor${st.fx.polaroid.ep != null ? ` · Episode ${st.fx.polaroid.ep}` : ''}`;
    po.classList.add(P('on'));
    if (fresh) po.classList.add(P('develop'));
  }

  // The chart at the end of a couple's film: how each felt about the other,
  // episode by episode — the ups and downs, drawn left to right.
  const cv = q('curve');
  cv.classList.remove(P('on'), P('draw'));
  if (st.fx?.curve) {
    const { a, b, pts } = st.fx.curve;
    const n = pts.length, x = i => 28 + (n > 1 ? i / (n - 1) : 0) * 272, y = v => 138 - Math.max(0, Math.min(10, v ?? 0)) * 11.5;
    const line = k => pts.map((p, i) => `${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ');
    const [ca] = colourOf(a), [cb] = colourOf(b);
    cv.innerHTML = `<rect x="0" y="0" width="320" height="170" rx="14" fill="rgba(20,10,20,.88)"/>
      <text x="16" y="20" class="${P('cv-t')}">How they felt, episode by episode</text>
      <line x1="28" y1="138" x2="300" y2="138" stroke="#fff4" /><line x1="28" y1="23" x2="28" y2="138" stroke="#fff2"/>
      <polyline class="${P('cv-l')}" points="${line(1)}" stroke="${ca}"/>
      <polyline class="${P('cv-l')} ${P('cv-l2')}" points="${line(2)}" stroke="${cb}"/>
      <text x="28" y="156" class="${P('cv-k')}" fill="${ca}">${esc(a)} → ${esc(b)}</text>
      <text x="300" y="156" text-anchor="end" class="${P('cv-k')}" fill="${cb}">${esc(b)} → ${esc(a)}</text>
      <text x="28" y="166" class="${P('cv-e')}">Ep ${pts[0][0]}</text><text x="300" y="166" text-anchor="end" class="${P('cv-e')}">Ep ${pts[n - 1][0]}</text>`;
    cv.classList.add(P('on'));
    if (fresh) later(el, 350, () => cv.classList.add(P('draw'))); else cv.classList.add(P('draw'));
  }

  // the neon, for the night's moment
  const ne = st.fx?.neon || st.fx?.neonDie;
  if (ne) {
    const nn = q('neon');
    nn.style.setProperty('--glow', ne[1]);
    nn.innerHTML = [...ne[0]].map((ch, k) => `<i style="--k:${k}">${ch === ' ' ? '&nbsp;' : esc(ch)}</i>`).join('');
    nn.className = `${P('neon')} ${P('on')}${fresh ? ' ' + P('fresh') : ''}${st.fx.neonDie && !fresh ? ' ' + P('off') : ''}`;
    if (st.fx.neonDie && fresh) later(el, 900, () => nn.classList.add(P('dying')));
  }
  // the text
  if (st.fx?.phone) {
    const [to, msg] = st.fx.phone, ph = q('phone');
    ph.querySelector('.' + P('tag')).textContent = `To: ${to}`;
    ph.querySelector('p').textContent = msg;
    if (fresh) later(el, 300, () => { ph.classList.add(P('up')); ph.classList.add(P('buzz')); }); else ph.classList.add(P('up'));
  }
  // the heart rate
  if (st.fx?.ecg) {
    const pts = [];
    for (let x = 0; x <= 1000; x += 8) { const t = x % 160, spike = x > 520;
      pts.push(`${x},${t === 80 ? (spike ? 2 : 22) : t === 88 ? (spike ? 98 : 80) : t === 72 ? 64 : 55 + Math.sin(x / 11) * 2}`); }
    q('ecg').querySelector('polyline').setAttribute('points', pts.join(' '));
    q('ecg').classList.add(P('on'));
    const bpm = q('bpm'); bpm.textContent = `${st.fx.ecg[0]}`; bpm.classList.add(P('on'));
  }
  // cards dealt: a ballot, or one stick / twist
  const deal = q('deal');
  const cards = st.fx?.deal ? st.fx.deal.map(([v, t]) => ({ who: `${v} votes`, face: t, what: t, cls: '' }))
    : st.fx?.deal1 ? [{ who: st.fx.deal1[0], face: st.fx.deal1[0], what: st.fx.deal1[1].toUpperCase(), cls: st.fx.deal1[1] }] : [];
  if (cards.length) {
    deal.innerHTML = cards.map((c, k) => `<div class="${P('gc')} ${fresh ? P('in') : P('flip')}" style="--dl:${k * 180}ms"><div><div class="${P('f')}">${IC.heart}</div>
      <div class="${P('b')}"><div><div class="${P('face')}">${img(c.face)}</div><div class="${P('who')}">${esc(c.who)}</div><div class="${P('what')} ${c.cls ? P(c.cls) : ''}">${esc(c.what)}</div></div></div></div></div>`).join('');
    if (fresh) deal.querySelectorAll('.' + P('gc')).forEach((g, k) => later(el, 900 + k * 520, () => g.classList.add(P('flip'))));
  }
  // the final's board
  if (st.fx?.board != null && board) {
    const bd = q('board'); bd.classList.remove(P('hide'));
    const rows = [...bd.querySelectorAll('.' + P('row'))], n = st.fx.board;
    const show = upto => rows.forEach((r, k) => { const on = k < upto; r.classList.toggle(P('shown'), on);
      r.classList.toggle(P('win'), on && k === rows.length - 1 && upto === rows.length);
      r.querySelector('i').style.width = on ? board[k][1] * 1.9 + '%' : '0'; });
    if (fresh) { show(n - 1); later(el, 400, () => show(n)); } else show(n);
  }
  if (st.fx?.env) {
    const env = q('env'); env.querySelector('.' + P('envword')).textContent = st.fx.env;
    env.classList.add(P('on')); if (fresh) later(el, 300, () => env.classList.add(P('open'))); else env.classList.add(P('open'));
  }
  if (st.fx?.petals && fresh) later(el, 500, () => q('petals').classList.add(P('go')));
  if (st.fx?.fireworks && fresh) later(el, 300, () => q('fireworks').classList.add(P('go')));
  if (st.fx?.toast && fresh) {
    const t = q('toast'); t.innerHTML = `${esc(st.fx.toast[1])}<small>${esc(st.fx.toast[0])}</small>`; later(el, 600, () => t.classList.add(P('go')));
  }
  // pops rise from the busts they belong to
  if (fresh && st.pops?.length) {
    q('pops').innerHTML = st.pops.map(([n, t, style, icon], k) => {
      const c = st.cast.find(x => x[0] === n), x = c ? c[1] : 50;
      return `<div class="${P('pop')} ${style ? P(style) : ''}" style="left:${x}%;top:${22 + (k % 2) * 8}%;--d:${.7 + k * .35}s">${IC[icon] || IC.heartW}${esc(t)}</div>`;
    }).join('');
  }
  hl.textContent = st.headline || screen.label; hl.classList.add(P('on'));
}
