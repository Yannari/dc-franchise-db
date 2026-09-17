// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-theme-wicker-beasts.js — straw, woad and fire
// ══════════════════════════════════════════════════════════════════════
//
// The Wicker Beasts THEME for js/vp-tr/mission-bespoke.js, reproducing the
// approved mockup (mockup/mockup-tr-wicker-beasts.html): the field in profile
// (debris, river, two giant beasts), rope meters, diggers and rowers with
// faces, the wicker hare's Shield box, and first/second prize lines.
//
// THE SIDEBAR KNOWS ONLY WHAT HAS BEEN SHOWN. Rope fills during the debris,
// the boats cross during the river, the fuses grow during the fuse, and each
// beast catches on the card that shows it catching.
import { players } from '../core.js';
import { playerAvatarUrl } from '../players.js';
import { STAGE_CSS, stageShell, stageFor, reducedMotion, stageEvents } from './mission-stage.js';

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
const _gbp = n => '£' + Number(n || 0).toLocaleString('en-GB');
const _url = name => playerAvatarUrl((players || []).find(p => p && p.name === name) || { name });
const _face = name => '<img class="wb-av" src="' + _esc(_url(name)) + '" alt="' + _esc(name) + '" title="'
  + _esc(name) + '" onerror="this.style.visibility=&quot;hidden&quot;">';
const _frac = (n, a, b) => (b > a ? Math.max(0, Math.min(1, (n - a) / (b - a))) : (n >= b ? 1 : 0));
const TEAM_COL = ['#7ea2c9', '#e0735f'];
const BOAT_COL = ['#3f6c9b', '#c2362b'];

function _prog(v) {
  let s = 0;
  return v.phases.map(p => { const o = { start: s, end: s + p.cards.length }; s += p.cards.length; return o; });
}
function _stepOf(v, test) {
  let i = 0;
  for (const p of v.phases) for (const c of p.cards) { if (test(c)) return i; i++; }
  return -1;
}

const TAGS = {
  'debris:good': 'Long coil', 'debris:bad': 'Rotten', 'debris:steady': 'Rope',
  'river:good': 'Strong oar', 'river:bad': 'Circles', 'river:steady': 'Rowing',
  'fuse:good': 'Tight knots', 'fuse:bad': 'Loose knot', 'fuse:steady': 'Tied',
};
const ICONS = {
  rope: '<ellipse cx="18" cy="20" rx="13" ry="9" fill="none" stroke="#e2b95a" stroke-width="3"/><ellipse cx="18" cy="20" rx="7" ry="4.5" fill="none" stroke="#8f6e2c" stroke-width="2.5"/><path d="M30 18c3-6 3-10 0-14" fill="none" stroke="#e2b95a" stroke-width="2.5"/>',
  fray: '<path d="M4 18h12" stroke="#e2b95a" stroke-width="3"/><path d="M20 18l6-5M20 18l7 0M20 18l6 5" stroke="#c2362b" stroke-width="2"/>',
  hare: '<path d="M8 28c0-8 6-12 12-12 5 0 8 4 8 8 0 3-2 4-4 4z" fill="#8f6e2c" stroke="#e2b95a" stroke-width="1.2"/><path d="M20 16c-2-6-1-12 1-13 2 2 2 8 1 13M24 17c1-6 4-11 6-11 1 3-1 8-4 12" fill="#8f6e2c" stroke="#e2b95a" stroke-width="1"/><circle cx="16" cy="24" r="4" fill="#f3cf5c"/>',
  oar: '<path d="M4 26c5 2 23 2 28 0l-3 5H7z" fill="#3f6c9b"/><path d="M6 6l20 20" stroke="#e2b95a" stroke-width="2.4"/><ellipse cx="27.5" cy="27.5" rx="3" ry="5" transform="rotate(-45 27.5 27.5)" fill="#e2b95a"/>',
  wet: '<rect x="16" y="14" width="4" height="20" fill="#6b4a22"/><path d="M18 6c3 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1-4 4-7z" fill="#555"/><path d="M8 6v6M28 4v6M12 2v4" stroke="#3f6c9b" stroke-width="2" stroke-linecap="round"/>',
  knot: '<path d="M2 18h10c4 0 4-8 8-8s4 8 0 8-4 8 0 8 4-8 8-8h6" fill="none" stroke="#e2b95a" stroke-width="3"/>',
  fire: '<path d="M18 2c7 8 11 12 11 19a11 11 0 0 1-22 0c0-6 3-9 6-12 1 4 3 5 4 5-1-5-1-8 1-12z" fill="#ff8a2a"/><path d="M18 16c3 3 5 5 5 8a5 5 0 0 1-10 0c0-3 2-5 5-8z" fill="#ffd66b"/>',
};
const isFire = c => /went up with|caught at last|still standing\. /.test(c.text);


// ══════════════════════════════════════════════════════════════════════
// THE STAGE — the field, played (js/vp-tr/mission-stage.js)
// ══════════════════════════════════════════════════════════════════════
//
// Rope comes out of the debris, the boats cross for the torch, the fuses grow
// along the grass, and a beast catches. Each on the card that says so.
function _wbKind(c, ph) {
  if (isFire(c)) return /went up with/.test(c.text) ? 'fire1' : /caught at last/.test(c.text) ? 'fire2' : 'unlit';
  if (c.relic) return 'hare';
  if (c.isSocial) return 'scene';
  if (ph.id === 'debris') return c.tone === 'bad' ? 'rotten' : 'rope';
  if (ph.id === 'river') return c.tone === 'bad' ? 'circles' : 'row';
  return c.tone === 'bad' ? 'loose' : 'knot';
}
const WB_CAP = { debris: ['Part one', 'The Debris'], river: ['Part two', 'The River'],
  fuse: ['Part three', 'The Fuse'] };
const WB_TEAM = ['#e2b95a', '#c2362b'];

/** One beast, big enough to burn: a wicker body, horns, and three flames. */
function _wbBeast(ti, s, e) {
  const lit = s.lit[ti] ? ' lit' : '';
  const first = s.lit[ti] && s.first && s.first.indexOf(ti === 0 ? 'Stag' : 'Boar') === 0 ? ' first' : '';
  const at = ti === 0 ? 'translate(830,150) scale(1.5)' : 'translate(972,176) scale(1.3)';
  const body = ti === 0
    // a stag: deep chest, long legs, head up, antlers
    ? '<path class="body" d="M-30 6 C-34 -10 -20 -18 -6 -18 L14 -18 C28 -18 34 -8 32 4 C30 16 18 22 4 22 L-14 22 C-24 22 -28 16 -30 6 Z"/>'
      + '<path class="body" d="M26 -14 C34 -26 40 -34 42 -46 L50 -44 C48 -30 42 -20 36 -10 Z"/>'
      + '<path class="horn" d="M44 -46 L38 -66 M44 -46 L54 -64 M40 -58 L30 -62 M50 -56 L60 -60 M38 -66 L32 -74 M54 -64 L60 -72"/>'
      + '<path class="leg" d="M-18 22 L-20 60 M-4 22 L-6 60 M14 22 L16 60 M26 20 L28 60"/>'
    // a boar: heavy shoulders, low head, tusks
    : '<path class="body" d="M-34 10 C-36 -6 -22 -16 -6 -16 L10 -16 C26 -16 34 -6 32 8 C30 20 16 24 2 24 L-16 24 C-28 24 -32 20 -34 10 Z"/>'
      + '<path class="body" d="M30 -6 C42 -8 52 0 52 8 C52 16 42 20 32 18 Z"/>'
      + '<path class="horn" d="M50 12 C56 10 58 4 56 -2 M46 16 C52 16 55 12 55 8"/>'
      + '<path class="leg" d="M-22 24 L-24 56 M-6 24 L-8 56 M10 24 L12 56 M24 22 L26 56"/>';
  const fire = '<g class="fire" transform="translate(0,26)"><path class="f" d="M-22 34c-6-26 6-44 10-64 8 22 16 38 8 64z" fill="#ff8a2a"/>'
    + '<path class="f" d="M-2 34c-6-32 8-54 12-78 10 26 16 48 6 78z" fill="#ffd66b"/>'
    + '<path class="f" d="M16 34c-4-22 6-34 10-50 6 18 10 32 4 50z" fill="#ff8a2a"/></g>';
  // The fire burns BEHIND the willow, so the beast is still a beast while it goes.
  return '<g class="ms-wb-beast' + lit + first + '" data-t="' + ti + '" transform="' + at + '">' + fire + body + '</g>';
}

function _wbScene(v, s) {
  const e = v.epNum;
  const coils = [0, 1].map(ti => Array.from({ length: 6 }, (_, i) =>
    '<ellipse class="ms-wb-coil' + (i < s.rope[ti] ? '' : ' off') + '" data-c="' + ti + '-' + i + '" cx="'
    + (86 + i * 40) + '" cy="' + (250 + ti * 44) + '" rx="15" ry="9" fill="none" stroke="' + WB_TEAM[ti]
    + '" stroke-width="4"/>').join('')).join('');
  const boats = [0, 1].map(ti => {
    const x = 696 - (s.boat[ti] - 100) * 1.8;
    return '<g class="ms-wb-boat' + (s.boat[ti] === 150 ? ' doused' : '') + '" data-b="' + ti
      + '" transform="translate(' + x.toFixed(0) + ',' + (250 + ti * 44) + ')">'
      + '<path d="M-26 0 h52 l-8 14 h-36 z" fill="#1d1a13" stroke="' + WB_TEAM[ti] + '" stroke-width="2"/>'
      + '<g class="torch"><rect x="-2" y="-26" width="4" height="26" fill="#6b4a22"/>'
      + '<path d="M0 -40c7 9 9 14 9 19a9 9 0 0 1-18 0c0-5 2-10 9-19z" fill="#ff8a2a"/></g></g>';
  }).join('');
  const fuses = [0, 1].map(ti =>
    '<path class="ms-wb-fuse" data-f="' + ti + '" d="M' + (360 + ti * 10) + ' ' + (280 + ti * 34)
    + ' C 520 ' + (268 + ti * 30) + ', 700 ' + (250 + ti * 20) + ', ' + (ti ? 958 : 812) + ' ' + (ti ? 200 : 208)
    + '" fill="none" stroke="' + WB_TEAM[ti] + '" stroke-width="3" pathLength="100"'
    + ' style="stroke-dasharray:100;stroke-dashoffset:' + (100 - s.fuse[ti]) + '"/>').join('');
  return '<rect width="1080" height="360" fill="url(#ms-wb-sky-' + e + ')"/>'
    + '<path d="M0 214 C180 196 320 226 520 210 C700 196 860 220 1080 202 V360 H0Z" fill="#232a18"/>'
    + '<path d="M0 232 C200 220 340 246 540 232 C740 218 880 240 1080 226 V360 H0Z" fill="#2a3a1c"/>'
    + '<path d="M548 210 C566 260 566 310 556 360 H706 C694 310 694 258 712 210 Z" fill="#223e5c" opacity=".92"/>'
    + '<g class="ms-wb-ripple"><path d="M556 258 q24 -8 48 0 t48 0 t48 0" fill="none" stroke="#3f6c9b" stroke-width="2"/>'
    + '<path d="M552 310 q26 -8 52 0 t52 0 t52 0" fill="none" stroke="#3f6c9b" stroke-width="2"/></g>'
    + '<path d="M40 300 L120 210 L196 268 L268 196 L346 300 Z" fill="#3a3122" stroke="#6b5b3a" stroke-width="2"/>'
    + coils
    + '<g class="ms-wb-hare' + (s.hare ? ' taken' : '') + '" transform="translate(196,248)">'
    + '<path d="M-14 12c0-12 8-18 16-18 8 0 12 6 12 12 0 4-2 6-6 6z" fill="#8f6e2c" stroke="#e2b95a" stroke-width="1.6"/>'
    + '<path d="M2 -6c-4-12-2-24 2-26 4 4 4 16 2 26 M10 -4c2-12 8-22 12-22 2 6-2 16-8 24" fill="#8f6e2c" stroke="#e2b95a" stroke-width="1.4"/>'
    + '<circle class="glow" cx="-4" cy="6" r="7" fill="#f3cf5c"/></g>'
    + fuses + boats
    + '<g class="ms-wb-far"><rect x="742" y="286" width="6" height="34" fill="#6b4a22"/>'
    + '<path d="M745 268c8 10 10 16 10 22a10 10 0 0 1-20 0c0-6 2-12 10-22z" fill="#ff8a2a"/></g>'
    + _wbBeast(0, s, e) + _wbBeast(1, s, e);
}

function _wbStage(v, states, n) {
  const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
  const e = v.epNum;
  const defs = '<linearGradient id="ms-wb-sky-' + e + '" x1="0" x2="0" y1="0" y2="1">'
    + '<stop offset="0" stop-color="#2a1f12"/><stop offset=".6" stop-color="#1d1a13"/><stop offset="1" stop-color="#14110c"/></linearGradient>';
  return stageShell({ epNum: e, defs, scene: _wbScene(v, s),
    cap: [s.time + ' left', (WB_CAP[s.capPhase] || WB_CAP.debris)[1]],
    pot: v.potBefore + (s.done ? v.earned : 0),
    vars: '--ms-mono:\'Cutive Mono\',monospace;--ms-accent:#e2b95a;--ms-ink:#f3ead2',
    label: 'The field, staged' });
}

function _wbSettle(st, v, s) {
  st.phase(s.watch.length ? 'watch' : 'rest');
  st.qa('.ms-wb-coil').forEach(c => {
    const [ti, i] = c.getAttribute('data-c').split('-').map(Number);
    c.setAttribute('class', 'ms-wb-coil' + (i < s.rope[ti] ? '' : ' off'));
  });
  st.qa('.ms-wb-boat').forEach(b => {
    const ti = Number(b.getAttribute('data-b'));
    b.setAttribute('class', 'ms-wb-boat' + (s.boat[ti] === 150 ? ' doused' : ''));
    b.setAttribute('transform', 'translate(' + (696 - (s.boat[ti] - 100) * 1.8).toFixed(0) + ',' + (250 + ti * 44) + ')');
  });
  st.qa('.ms-wb-fuse').forEach(f => { f.style.strokeDashoffset = 100 - s.fuse[Number(f.getAttribute('data-f'))]; });
  st.qa('.ms-wb-beast').forEach(g => {
    const ti = Number(g.getAttribute('data-t'));
    g.setAttribute('class', 'ms-wb-beast' + (s.lit[ti] ? ' lit' : '')
      + (s.lit[ti] && s.first && s.first.indexOf(ti === 0 ? 'Stag' : 'Boar') === 0 ? ' first' : ''));
  });
  const hare = st.q('.ms-wb-hare'); if (hare) hare.setAttribute('class', 'ms-wb-hare' + (s.hare ? ' taken' : ''));
  st.cap(s.time + ' left', (WB_CAP[s.capPhase] || WB_CAP.debris)[1]);
  st.pot(v.potBefore + (s.done ? v.earned : 0), false);
  st.clearStamp();
}

function _wbPlay(st, v, prev, s) {
  _wbSettle(st, v, prev);
  const e = s.ev;
  if (!e) { _wbSettle(st, v, s); return; }
  const land = (fn, ms) => st.later(fn, ms);
  if (e.k === 'rope' || e.k === 'row' || e.k === 'knot') {
    st.phase('hold');
    land(() => {
      _wbSettle(st, v, s);
      if (e.k === 'rope') st.burst(12, 18, 70, 90, 'rgba(226,185,90,.9)');
      if (e.k === 'row') st.burst(10, 52, 74, 80, 'rgba(63,108,155,.9)');
    }, 1000);
  } else if (e.k === 'rotten' || e.k === 'circles' || e.k === 'loose') {
    st.phase('hold');
    land(() => {
      _wbSettle(st, v, s);
      st.phase('bad');
      st.stamp(e.k === 'rotten' ? 'ROTTEN ROPE' : e.k === 'circles' ? 'ROUND IN CIRCLES' : 'THE KNOT HELD THE FLAME', 'bad');
    }, 1200);
  } else if (e.k === 'scene') {
    _wbSettle(st, v, s); st.phase('watch');
  } else if (e.k === 'hare') {
    st.phase('hold');
    land(() => {
      _wbSettle(st, v, s);
      if (e.found) {
        st.phase('win'); st.flash('18%', '69%'); st.burst(18, 18, 69, 150, 'rgba(243,207,92,.95)');
        st.stamp('A SHIELD IN THE HARE', 'gold');
      } else { st.phase('rest'); st.stamp('ONLY STRAW', 'bad'); }
    }, 1400);
  } else if (e.k === 'fire1' || e.k === 'fire2') {
    st.phase('hold');
    land(() => {
      _wbSettle(st, v, s);
      st.phase('win');
      const ti = /Stag/.test(e.text || '') ? 0 : 1;
      st.flash(ti ? '89%' : '75%', '45%', 'rgba(255,138,42,.85)');
      st.burst(24, ti ? 89 : 75, 45, 200, 'rgba(255,138,42,.95)');
      st.fall(16, '#ff8a2a');
      st.stamp(e.k === 'fire1' ? 'FIRST TO BURN' : 'SECOND · HALF THE MONEY', 'gold');
      land(() => st.pot(v.potBefore + v.earned, true), 1300);
    }, 1800);
  } else if (e.k === 'unlit') {
    st.phase('hold');
    land(() => { _wbSettle(st, v, s); st.phase('bad'); st.stamp('STILL STANDING', 'bad'); }, 1600);
  } else {
    _wbSettle(st, v, s);
  }
}

export const WICKER = {
  id: 'wicker-beasts', prefix: 'wb', ownShield: true,
  shieldBeat: /wicker hare|shorter for it/,
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: () => '<h1 class="wb-title">Wicker <span>Beasts</span></h1>',
  sub: () => 'A stag and a boar made of willow, a river between you and the only torch, and half an hour to set yours on fire before the other team sets theirs.',
  chips: v => [
    { text: v.teams.map(t => t.name).join(' v ') },
    { text: (v.tally.clock || 30) + ' minutes' },
    { text: 'First to burn pays most · second half' },
    v.tally.offered === false ? { text: 'No Shield today' } : { text: 'A Shield inside a wicker hare', shield: true },
  ],
  phaseNum: roman => '<span class="wb-phase-n">' + roman + '</span>',
  cardClass: c => (isFire(c) ? 'fire' : c.relic ? 'relic'
    : (c.isSocial ? 'social ' : '') + (c.tone === 'bad' ? 'bad' : c.tone === 'good' ? 'good' : 'plain')),
  cardTag: (c, ph) => (isFire(c) ? (/went up with/.test(c.text) ? 'First to burn' : /caught at last/.test(c.text) ? 'Second' : 'Not lit')
    : c.relic ? (c.behaviour === 'impressive' ? 'The hare' : 'Empty straw')
      : c.isSocial ? _cap(c.behaviour || 'moment')
        : (TAGS[ph.id + ':' + c.tone] || _cap(c.kind))),
  icon: (c, ph) => {
    let ic = 'rope';
    if (isFire(c)) ic = 'fire';
    else if (c.relic) ic = 'hare';
    else if (ph.id === 'debris') ic = c.tone === 'bad' ? 'fray' : 'rope';
    else if (ph.id === 'river') ic = /torch/.test(c.text) ? 'wet' : 'oar';
    else if (ph.id === 'fuse') ic = 'knot';
    return '<span class="wb-ico"><svg viewBox="0 0 36 36" aria-hidden="true">' + ICONS[ic] + '</svg></span>';
  },

  stage: (v, states, n) => _wbStage(v, states, n),

  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const e = v.epNum;
    const roles = v.tally.roles || {};
    const sh = v.shield || {};
    const coils = v.teams.map((t, ti) => Array.from({ length: 6 }, (_, i) =>
      '<ellipse class="wb-coil' + (i < s.rope[ti] ? '' : ' off') + '" cx="' + (12 + i * 9) + '" cy="' + (158 + ti * 12)
      + '" rx="4" ry="2.5" fill="none" stroke="' + (ti ? '#c2362b' : '#e2b95a') + '" stroke-width="2"/>').join('')).join('');
    const boats = v.teams.map((t, ti) => {
      const rower = ((roles[t.name] || {}).rowers || [])[0];
      return '<g class="wb-boat" transform="translate(' + s.boat[ti] + ',' + (158 + ti * 20) + ')">'
        + '<path d="M-12 0 h24 l-4 6 h-16 z" fill="' + BOAT_COL[ti] + '" stroke="#e2b95a"/>'
        + (rower ? '<image href="' + _esc(_url(rower)) + '" x="-6" y="-12" width="12" height="12" clip-path="url(#wb-cf-' + e + ')"/>' : '') + '</g>';
    }).join('');
    const rows = v.teams.map((t, ti) => {
      const r = roles[t.name] || { diggers: [], rowers: [] };
      return '<div class="wb-team"><div class="wb-team-head"><span style="color:' + TEAM_COL[ti] + '">' + _esc(t.name)
        + '</span><b>' + _esc(s.rows[ti]) + '</b></div>'
        + '<div class="wb-meter">' + Array.from({ length: 6 }, (_, i) => '<i class="' + (i < s.rope[ti] ? 'on' : '') + '"></i>').join('') + '</div>'
        + '<div class="wb-roles"><div><small>diggers</small><span class="wb-faces">' + r.diggers.map(_face).join('') + '</span></div>'
        + '<div><small>rowers</small><span class="wb-faces">' + r.rowers.map(_face).join('') + '</span></div></div></div>';
    }).join('');
    return '<div class="wb-panel"><h3>The Field</h3>'
      + '<div class="wb-clock"><span>left</span><div class="wb-time">' + s.time + '</div></div>'
      + '<svg class="wb-field" viewBox="0 0 300 200" role="img" aria-label="The field in profile">'
      + '<defs><clipPath id="wb-cf-' + e + '"><circle cx="0" cy="-6" r="6"/></clipPath>'
      + '<clipPath id="wb-hf-' + e + '"><circle cx="0" cy="0" r="8"/></clipPath>'
      + '<pattern id="wb-weave-' + e + '" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0M-1 1L1 -1M5 7L7 5" stroke="#e2b95a" stroke-width="1"/><path d="M0 0L6 6" stroke="#8f6e2c" stroke-width="1"/></pattern></defs>'
      + '<rect width="300" height="200" fill="#1d1a13"/><path d="M0 150 H300 V200 H0 Z" fill="#2a3a1c"/>'
      + '<path d="M6 150 L22 118 L36 132 L50 110 L66 150 Z" fill="#3a3122"/><path d="M14 140 L60 124 M20 128 L48 146" stroke="#6b5b3a" stroke-width="2"/>'
      + coils
      + '<g class="wb-hare' + (s.hare ? ' taken' : '') + '" transform="translate(36,136)">'
      + '<path class="wicker" d="M-8 6c0-6 4-9 8-9 4 0 6 3 6 6 0 2-1 3-3 3z M0 -3c-1-5 0-9 1-10 1 1 1 6 0 10" fill="url(#wb-weave-' + e + ')" stroke="#e2b95a" stroke-width="1"/>'
      + (sh.holder ? '<image class="face" href="' + _esc(_url(sh.holder)) + '" x="-8" y="-8" width="16" height="16" clip-path="url(#wb-hf-' + e + ')"/>' : '')
      + '</g>'
      + '<path d="M92 150 C110 146 150 154 176 150 L176 200 L92 200 Z" fill="#223e5c"/>'
      + '<path d="M96 162 c8-3 16 3 24 0 s16 3 24 0 16 3 24 0" fill="none" stroke="#3f6c9b" stroke-width="1.4"/>'
      + boats
      + '<rect x="170" y="126" width="3" height="24" fill="#6b4a22"/><path d="M171.5 116c4 4 5 6 5 8a5 5 0 0 1-10 0c0-2 1-4 5-8z" fill="#ff8a2a"/>'
      + '<path class="wb-fuse" d="M176 146 C184 140 192 150 200 146" fill="none" stroke="#e2b95a" stroke-width="2" pathLength="100" style="stroke-dasharray:100;stroke-dashoffset:' + (100 - s.fuse[0]) + '"/>'
      + '<path class="wb-fuse" d="M176 150 C200 158 226 146 252 150" fill="none" stroke="#c2362b" stroke-width="2" pathLength="100" style="stroke-dasharray:100;stroke-dashoffset:' + (100 - s.fuse[1]) + '"/>'
      + _beast(0, s, e) + _beast(1, s, e)
      + '</svg>'
      + '<div class="wb-legend"><span>debris</span><span>river</span><span>beasts</span></div>'
      + '<div class="wb-teams">' + rows + '</div>'
      + (v.tally.offered === false ? '' : '<div class="wb-shieldbox' + (s.hare && sh.holder ? ' on' : '') + '">'
        + '<div class="lbl">The Hare</div>'
        + (sh.holder ? '<div class="holder">' + _face(sh.holder) + '</div>' : '')
        + '<div class="val">' + _esc(s.hareVal) + '</div>'
        + '<div class="cost">' + _esc(s.hareCost) + '</div></div>')
      + '<div class="wb-pot">'
      + '<div class="r"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="r"><span>First to burn</span><b>' + _esc(s.first || '—') + '</b></div>'
      + '<div class="r"><span>Second</span><b>' + _esc(s.second || '—') + '</b></div>'
      + '<div class="big">' + _gbp(v.potBefore + (s.done ? v.earned : 0)) + '</div></div></div>';
  },

  sideStates(v, total) {
    const pr = _prog(v);
    const evs = stageEvents(v, _wbKind).map(e => ({ ...e,
      found: /unpick|came back with|in the hare/i.test(e.text || '') && !/straw|nothing|empty/i.test(e.text || '') }));
    const names = v.teams.map(t => t.name);
    const clock = v.tally.clock || 30;
    const order = v.tally.order || [];
    const ropeUsed = v.tally.ropeUsed || {};
    const rope = v.tally.rope || {};
    const doused = v.tally.doused || {};
    const litAt = names.map(nm => _stepOf(v, c => isFire(c) && c.text.includes(nm) && !/still standing/.test(c.text)));
    const hareAt = _stepOf(v, c => c.relic);
    const sh = v.shield || {};
    const out = [];
    for (let n = 0; n <= total; n++) {
      const c1 = _frac(n, pr[0].start, pr[0].end);
      const c2 = _frac(n, pr[1].start, pr[1].end);
      const c3 = _frac(n, pr[2].start, pr[2].end);
      const lit = names.map((nm, i) => litAt[i] >= 0 && n > litAt[i]);
      const hare = hareAt >= 0 && n > hareAt;
      const done = n >= total;
      const firstName = order[0], secondName = order[1];
      out.push({
        rope: names.map(nm => Math.round((rope[nm] || 0) * c1)),
        boat: names.map(nm => {
          if (c2 <= 0) return 100;
          if (doused[nm] && c2 > 0.5 && c2 < 1) return 150;
          return 100 + Math.round(68 * Math.min(1, c2 * 1.4));
        }),
        fuse: names.map(nm => Math.round(100 * ((ropeUsed[nm] || 0) / 6) * c3)),
        lit,
        first: firstName && lit[names.indexOf(firstName)] ? firstName + ' · first' : '',
        second: secondName && lit[names.indexOf(secondName)] ? secondName + ' · half' : '',
        rows: names.map((nm, i) => (lit[i] ? (order[0] === nm ? 'burning' : 'burning, second')
          : done ? 'still standing'
            : c1 > 0 ? Math.round((rope[nm] || 0) * c1) + ' of 6 lengths' : 'no rope yet')),
        hare,
        hareVal: !hare ? 'somewhere in the debris'
          : sh.holder ? sh.holder + ' · unpicked it in the debris' : (sh.searcher || 'somebody') + ' · found only straw',
        hareCost: hare ? 'cost ' + (sh.searcher ? 'a length of rope' : 'nothing') + (sh.holder ? ' · seen by ' + (sh.witnesses || []).length : '') : '',
        done,
        time: String(Math.max(0, Math.round(clock - clock * Math.min(1, n / Math.max(1, total)) * 0.9))).padStart(2, '0') + ':00',
        // the stage's own reading of the same step
        ev: evs[n - 1] || null, capPhase: evs[n - 1] ? evs[n - 1].phase : 'debris',
        watch: evs[n - 1] && evs[n - 1].k === 'scene' ? evs[n - 1].who : [],
        v: { epNum: v.epNum, potBefore: v.potBefore, earned: v.earned, tally: v.tally },
      });
    }
    return out;
  },

  paintSide(prefix, states, n, mode) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const st = stageFor(s.v.epNum);
    if (st) {
      st.clear();
      if (mode === 'next' && n > 0 && !reducedMotion()) _wbPlay(st, s.v, states[n - 1], s);
      else _wbSettle(st, s.v, s);
    }
    const panel = document.querySelector('.wb-panel'); if (!panel) return;
    // The sidebar is small and entirely derived: rebuild its parts in place.
    const coils = panel.querySelectorAll('.wb-coil');
    coils.forEach((c, i) => { const ti = Math.floor(i / 6), k = i % 6; c.setAttribute('class', 'wb-coil' + (k < s.rope[ti] ? '' : ' off')); });
    panel.querySelectorAll('.wb-meter').forEach((m, ti) => [...m.children].forEach((b, k) => { b.className = k < s.rope[ti] ? 'on' : ''; }));
    panel.querySelectorAll('.wb-boat').forEach((b, ti) => b.setAttribute('transform', 'translate(' + s.boat[ti] + ',' + (158 + ti * 20) + ')'));
    panel.querySelectorAll('.wb-fuse').forEach((f, ti) => { f.style.strokeDashoffset = 100 - s.fuse[ti]; });
    panel.querySelectorAll('.wb-beast').forEach((g, ti) => g.setAttribute('class', 'wb-beast' + (s.lit[ti] ? ' lit' : '') + (s.lit[ti] && s.first.startsWith(g.getAttribute('data-team')) ? ' first' : '')));
    panel.querySelectorAll('.wb-team-head b').forEach((b, ti) => { b.textContent = s.rows[ti]; });
    const hare = panel.querySelector('.wb-hare'); if (hare) hare.setAttribute('class', 'wb-hare' + (s.hare ? ' taken' : ''));
    const box = panel.querySelector('.wb-shieldbox');
    if (box) {
      box.classList.toggle('on', s.hare && !!box.querySelector('.holder'));
      box.querySelector('.val').textContent = s.hareVal;
      box.querySelector('.cost').textContent = s.hareCost;
    }
    const pots = panel.querySelectorAll('.wb-pot .r b');
    if (pots[1]) pots[1].textContent = s.first || '—';
    if (pots[2]) pots[2].textContent = s.second || '—';
    const t = panel.querySelector('.wb-time'); if (t) t.textContent = s.time;
  },

  atmosphere: () => '<div class="wb-sky"></div><div class="wb-weave"></div>',

  css: `
@import url('https://fonts.googleapis.com/css2?family=Almendra+Display&family=Spectral:ital,wght@0,400;0,600;1,400&family=Cutive+Mono&display=swap');
.wb-root{--wb-straw:#e2b95a;--wb-straw-lo:#8f6e2c;--wb-woad:#3f6c9b;--wb-moss:#5d7a3d;--wb-cream:#f3ead2;--wb-ash:#b5ab97;
  --wb-ribbon:#c2362b;--wb-fire:#ff8a2a;--wb-shield:#f3cf5c;--cv-display:'Almendra Display',serif;
  background:#16130e;color:var(--wb-ash);font-family:'Spectral',Georgia,serif;font-size:18px;line-height:1.55;padding-bottom:120px;position:relative;overflow:hidden}
.wb-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.wb-sky{position:absolute;inset:0;background:radial-gradient(70% 45% at 30% 0%,rgba(226,185,90,.10),transparent 70%),linear-gradient(180deg,#26221a 0%,#1a1711 50%,#110f0b 100%)}
.wb-weave{position:absolute;inset:0;opacity:.07;background:repeating-linear-gradient(45deg,var(--wb-straw) 0 2px,transparent 2px 14px),repeating-linear-gradient(-45deg,var(--wb-straw) 0 2px,transparent 2px 14px)}
.wb-shell{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:26px 16px 40px}
.wb-body{position:relative;z-index:2}
.wb-hero{position:relative;padding:34px 26px 26px;text-align:center;overflow:hidden;border-radius:8px;
  background:repeating-linear-gradient(45deg,rgba(226,185,90,.08) 0 3px,transparent 3px 12px),repeating-linear-gradient(-45deg,rgba(226,185,90,.08) 0 3px,transparent 3px 12px),linear-gradient(180deg,#3a2f1c,#1d1810);
  border:2px solid var(--wb-straw-lo);box-shadow:0 18px 44px rgba(0,0,0,.6)}
.wb-hero::before,.wb-hero::after{content:'';position:absolute;top:-6px;width:14px;height:70px;background:var(--wb-ribbon);clip-path:polygon(0 0,100% 0,100% 100%,50% 86%,0 100%)}
.wb-hero::before{left:34px}.wb-hero::after{right:34px}
.wb-kicker{font:13px/1 'Cutive Mono',monospace;letter-spacing:.3em;text-transform:uppercase;color:var(--wb-straw)}
.wb-title{font-family:'Almendra Display',serif;font-weight:400;color:var(--wb-cream);font-size:clamp(46px,9vw,98px);line-height:.95;margin:.12em 0 .06em;text-shadow:2px 2px 0 #000,0 0 26px rgba(255,138,42,.25)}
.wb-title span{color:var(--wb-straw)}
.wb-sub{color:#c3b79c;max-width:58ch;margin:0 auto;font-style:italic}
.wb-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}
.wb-chip{font:12px/1 'Cutive Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--wb-cream);border:1px solid var(--wb-straw-lo);padding:6px 11px;background:rgba(0,0,0,.35)}
.wb-chip.shield{border-color:var(--wb-shield);color:var(--wb-shield)}
.wb-hero .mb-roster{justify-content:center;text-align:left}
.wb-hero .mb-rname{font-family:'Cutive Mono',monospace;color:var(--wb-straw)}
.wb-av{width:26px;height:26px;border-radius:50%;object-fit:cover;object-position:50% 20%;background:#2a241a;border:1.5px solid var(--wb-straw-lo);box-shadow:0 2px 8px rgba(0,0,0,.6);display:inline-block;vertical-align:middle}
.wb-faces{display:inline-flex}
.wb-faces .wb-av+.wb-av{margin-left:-7px}
.wb-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px;margin-top:24px;align-items:start}
@media(max-width:940px){.wb-grid{grid-template-columns:minmax(0,1fr)}}
.wb-brief{background:rgba(22,19,14,.9);border:1px solid #3a3122;border-top:4px solid var(--wb-straw);padding:20px 20px 16px}
.wb-brief h2,.wb-phase-name{font-family:'Almendra Display',serif;font-weight:400;color:var(--wb-cream)}
.wb-brief h2{font-size:34px;margin:0}
.wb-staging{font-style:italic;color:#9b917c;border-bottom:1px solid #3a3122;padding-bottom:12px;margin:8px 0 14px}
.wb-beat{margin:0 0 11px}
.wb-beat p{margin:0}
.wb-beat.do p{font:15px/1.5 'Cutive Mono',monospace;color:#8a806c}
.wb-beat.say p{color:var(--wb-cream);padding-left:14px;border-left:3px double var(--wb-straw-lo)}
.wb-beat.shield p{border-left-color:var(--wb-shield);color:#fbe8b0}
.wb-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.wb-rule{font:11px/1 'Cutive Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#9b917c;border:1px dashed #5b4f39;padding:5px 8px}
.wb-rule b{color:var(--wb-straw);font-weight:400;margin-right:4px}
.wb-phase{margin-top:28px}
.wb-phase-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:6px;border-bottom:2px dotted #5b4f39}
.wb-phase-n{font:15px/1 'Cutive Mono',monospace;color:#16130e;background:var(--wb-straw);padding:6px 9px;transform:rotate(-3deg)}
.wb-phase-name{font-size:34px;line-height:1}
.wb-phase-stats{margin-left:auto;display:flex;gap:6px}
.wb-stat{font:11px/1 'Cutive Mono',monospace;font-style:normal;text-transform:uppercase;letter-spacing:.1em;color:#c3b79c;background:#2a241a;padding:5px 8px}
.wb-setting{font-style:italic;color:#9b917c;margin:8px 0 12px}
.wb-card{position:relative;margin:0 0 12px;padding:14px 16px 13px 64px;overflow:hidden;background:linear-gradient(180deg,rgba(42,36,26,.95),rgba(26,22,16,.96));border:1px solid #3a3122;opacity:0;transform:translateX(-26px);transition:opacity .45s ease,transform .6s cubic-bezier(.2,.9,.25,1.1)}
.wb-card::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:0;background:repeating-linear-gradient(45deg,rgba(226,185,90,.18) 0 2px,transparent 2px 10px);transition:opacity 1.2s ease}
.wb-card.on{opacity:1;transform:none}
.wb-card.on::before{opacity:.25}
.wb-card.good{border-left:4px solid var(--wb-moss)}
.wb-card.bad{border-left:4px solid var(--wb-ribbon)}
.wb-card.social{border-left:4px solid var(--wb-woad)}
.wb-card.relic{border:1px solid var(--wb-shield);box-shadow:0 0 22px rgba(243,207,92,.16)}
.wb-card.fire{border:1px solid var(--wb-fire);box-shadow:0 0 30px rgba(255,138,42,.22);background:linear-gradient(180deg,rgba(80,34,10,.9),rgba(30,16,8,.96))}
.wb-ico{position:absolute;left:14px;top:14px;width:36px;height:36px}
.wb-ico svg{width:100%;height:100%;display:block}
.wb-tag{float:right;font:11px/1 'Cutive Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:#9b917c;margin:4px 0 0 10px}
.wb-card.good .wb-tag{color:#9dbb74}.wb-card.bad .wb-tag{color:#e0735f}.wb-card.relic .wb-tag{color:var(--wb-shield)}.wb-card.fire .wb-tag{color:var(--wb-fire)}
.wb-who{font-weight:600;color:var(--wb-cream);position:relative}
.wb-card .mb-avs .cv-av{width:34px;height:34px;border:2px solid var(--wb-straw-lo)}
.wb-card.good .cv-av{border-color:#9dbb74}.wb-card.bad .cv-av{border-color:var(--wb-ribbon)}.wb-card.relic .cv-av{border-color:var(--wb-shield)}.wb-card.fire .cv-av{border-color:var(--wb-fire)}
.wb-txt{margin-top:6px;position:relative}
.wb-conf{position:relative;margin-top:10px;padding:9px 12px;background:rgba(0,0,0,.32);border-left:3px double var(--wb-woad);font-style:italic;color:#e3dbc7}
.wb-conf small{display:block;font:11px/1.4 'Cutive Mono',monospace;font-style:normal;letter-spacing:.12em;text-transform:uppercase;color:#7ea2c9}
.wb-fx{position:relative;display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.wb-fx span{font:11px/1 'Cutive Mono',monospace;color:#c3b79c;border:1px dashed #5b4f39;padding:4px 7px}
.wb-summary{margin-top:24px;padding:18px 20px;border:2px solid var(--wb-straw-lo);background:rgba(22,19,14,.92);transition:opacity .4s}
.wb-summary small{display:block;font:11px/1.4 'Cutive Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--wb-straw);margin-bottom:4px}
.wb-side{position:sticky;top:60px}
.wb-panel{background:rgba(14,12,9,.95);border:2px solid #3a3122;padding:14px}
.wb-panel h3{font:400 30px/1 'Almendra Display',serif;color:var(--wb-cream);margin:0 0 10px}
.wb-clock{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.wb-clock span{font:12px/1 'Cutive Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#8a806c}
.wb-time{font:28px/1 'Cutive Mono',monospace;color:var(--wb-straw)}
.wb-field{width:100%;display:block;background:#1d1a13}
.wb-coil{transition:opacity .5s}
.wb-coil.off{opacity:.12}
.wb-boat{transition:transform 1s cubic-bezier(.3,.8,.3,1)}
.wb-fuse{transition:stroke-dashoffset .9s ease}
.wb-beast .fire{opacity:0;transition:opacity .8s}
.wb-beast.lit .fire{opacity:1}
.wb-beast .rib{opacity:0;transition:opacity .6s}
.wb-beast.first .rib{opacity:1}
.wb-flick{animation:wb-lick 1.1s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
@keyframes wb-lick{from{transform:scaleY(.85) skewX(-5deg)}to{transform:scaleY(1.12) skewX(5deg)}}
.wb-hare .wicker{transition:opacity .6s}
.wb-hare.taken .wicker{opacity:.2}
.wb-hare .face{opacity:0;transition:opacity .6s}
.wb-hare.taken .face{opacity:1}
.wb-legend{display:flex;justify-content:space-between;font:11px/1 'Cutive Mono',monospace;letter-spacing:.08em;color:#6b6252;text-transform:uppercase;margin:6px 0 10px}
.wb-teams{border-top:2px dotted #3a3122;padding-top:6px}
.wb-team{padding:8px 0;border-bottom:1px dashed #2a241a}
.wb-team-head{display:flex;justify-content:space-between;align-items:center;font-weight:600;color:var(--wb-cream)}
.wb-team-head b{font:13px/1 'Cutive Mono',monospace;font-weight:400;color:var(--wb-straw)}
.wb-meter{display:flex;gap:3px;margin-top:7px}
.wb-meter i{flex:1;height:7px;background:#2a241a;transition:background .5s}
.wb-meter i.on{background:var(--wb-straw)}
.wb-roles{display:flex;justify-content:space-between;gap:8px;margin-top:7px}
.wb-roles small{display:block;font:10.5px/1.3 'Cutive Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:#6b6252;margin-bottom:3px}
.wb-shieldbox{margin-top:12px;padding:11px 12px;border:1px dashed #6b5b2a;text-align:center;transition:all .5s}
.wb-shieldbox .lbl{font:11px/1 'Cutive Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a7a4a}
.wb-shieldbox .val{margin-top:6px;font-style:italic;color:#9b917c}
.wb-shieldbox .holder{display:none;margin:8px auto 0}
.wb-shieldbox .holder .wb-av{width:44px;height:44px;border-color:var(--wb-shield);box-shadow:0 0 14px rgba(243,207,92,.45)}
.wb-shieldbox.on{border:1px solid var(--wb-shield);box-shadow:0 0 18px rgba(243,207,92,.15)}
.wb-shieldbox.on .holder{display:block}
.wb-shieldbox.on .lbl,.wb-shieldbox.on .val{color:var(--wb-shield);font-style:normal}
.wb-shieldbox .cost{margin-top:4px;font:12px/1.35 'Cutive Mono',monospace;color:#8a806c}
.wb-pot{margin-top:12px;border-top:2px dotted #3a3122;padding-top:10px}
.wb-pot .r{display:flex;justify-content:space-between;font-size:15px;color:#9b917c}
.wb-pot .r b{font:14px/1.6 'Cutive Mono',monospace;color:var(--wb-cream);font-weight:400}
.wb-pot .big{font:32px/1.1 'Cutive Mono',monospace;color:var(--wb-straw);text-align:right;margin-top:4px}
.wb-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 16px;background:linear-gradient(0deg,#0d0b08 60%,rgba(13,11,8,0))}
.wb-btn{font:600 16px/1 'Spectral',serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;padding:12px 24px;color:#16130e;background:var(--wb-straw);border:0;box-shadow:3px 3px 0 #000}
.wb-btn[disabled]{opacity:.4;cursor:default}
.wb-btn.ghost{background:transparent;color:var(--wb-cream);border:1px solid var(--wb-straw-lo);box-shadow:none}
.wb-counter{font:13px/1 'Cutive Mono',monospace;color:#8a806c;letter-spacing:.08em}

/* ── THE STAGE: the field ────────────────────────────────────────────── */
.ms-wb-coil{transition:opacity .6s,stroke .6s}
.ms-wb-coil.off{opacity:.18}
.ms-wb-boat{transition:transform 1.2s cubic-bezier(.3,.9,.4,1)}
.ms-wb-boat .torch{transition:opacity .5s}
.ms-wb-boat.doused .torch{opacity:.25}
.ms-wb-boat .torch path{transform-box:fill-box;transform-origin:50% 100%;animation:ms-wb-flick .45s ease-in-out infinite alternate}
@keyframes ms-wb-flick{to{transform:scale(1.1,.92)}}
.ms-wb-ripple path{animation:ms-wb-wave 5s ease-in-out infinite alternate}
@keyframes ms-wb-wave{to{transform:translateX(-26px)}}
.ms-wb-fuse{transition:stroke-dashoffset 1.1s ease-out;filter:drop-shadow(0 0 3px rgba(255,138,42,.5))}
.ms-wb-beast .body{fill:#3a3122;stroke:#e2b95a;stroke-width:2;transition:fill .8s}
.ms-wb-beast .horn,.ms-wb-beast .leg{stroke:#e2b95a;stroke-width:2.4;fill:none;stroke-linecap:round}
.ms-wb-beast .fire{opacity:0;transition:opacity .9s}
.ms-wb-beast.lit .fire{opacity:1}
.ms-wb-beast.lit .body{fill:#5a3a14}
.ms-wb-beast.lit .f{transform-box:fill-box;transform-origin:50% 100%;animation:ms-wb-flick .4s ease-in-out infinite alternate}
.ms-wb-beast.first .body{filter:drop-shadow(0 0 16px rgba(255,138,42,.7))}
.ms-wb-hare .glow{opacity:0;transition:opacity .6s}
.ms-wb-hare.taken .glow{opacity:.85;animation:ms-wb-glow 1.4s ease-in-out infinite}
@keyframes ms-wb-glow{50%{opacity:.3}}
.ms[data-phase=watch] .ms-wb-beast,.ms[data-phase=watch] .ms-wb-boat{filter:brightness(.4)}
.ms[data-phase=bad] .ms-vig{box-shadow:inset 0 0 160px 60px rgba(60,10,0,.8)}
@media(prefers-reduced-motion:reduce){.wb-root *,.wb-root *::before,.wb-root *::after{animation:none !important;transition:none !important}.wb-card{opacity:1;transform:none}}
` + STAGE_CSS,
};

function _beast(ti, s, e) {
  const lit = s.lit[ti] ? ' lit' : '';
  const first = s.lit[ti] && s.first && ti === (s.first.startsWith('Stag') ? 0 : 1) ? ' first' : '';
  const team = ti === 0 ? 'Stag' : 'Boar';
  if (ti === 0) {
    return '<g class="wb-beast' + lit + first + '" data-team="' + team + '" transform="translate(206,66) scale(1.4)">'
      + '<path class="body" d="M-16 60 L-14 30 L-22 10 L-10 12 L-8 0 L6 0 L10 12 L18 12 L14 30 L16 60 Z" fill="url(#wb-weave-' + e + ')" stroke="#e2b95a" stroke-width="1.5"/>'
      + '<path d="M-8 0 L-16 -18 M-12 -10 L-22 -12 M6 0 L14 -18 M10 -10 L20 -12" stroke="#e2b95a" stroke-width="2"/>'
      + '<g class="fire"><path class="wb-flick" d="M-14 60c-4-20 4-34 8-50 6 16 12 30 6 50z" fill="#ff8a2a"/><path class="wb-flick" d="M-4 60c-4-26 6-44 10-64 8 22 12 40 4 64z" fill="#ffd66b"/><path class="wb-flick" d="M6 60c-2-18 4-28 8-42 5 14 8 26 2 42z" fill="#ff8a2a"/></g>'
      + '<path class="rib" d="M14 -4 l6 0 l0 16 l-3 -3 l-3 3 z" fill="#c2362b"/></g>';
  }
  return '<g class="wb-beast' + lit + first + '" data-team="' + team + '" transform="translate(274,102) scale(1.4)">'
    + '<path class="body" d="M-26 34 L-24 14 L-30 8 L-22 0 L10 0 L18 8 L18 34 Z" fill="url(#wb-weave-' + e + ')" stroke="#e2b95a" stroke-width="1.5"/>'
    + '<path d="M-30 8 L-36 12 M-28 12 l-6 -2" stroke="#e2b95a" stroke-width="2"/>'
    + '<g class="fire"><path class="wb-flick" d="M-22 34c-4-16 4-26 8-38 6 12 10 24 4 38z" fill="#ff8a2a"/><path class="wb-flick" d="M-8 34c-4-22 6-36 10-52 8 18 12 32 4 52z" fill="#ffd66b"/><path class="wb-flick" d="M6 34c-2-14 4-22 8-32 5 10 8 20 2 32z" fill="#ff8a2a"/></g>'
    + '<path class="rib" d="M12 -6 l6 0 l0 16 l-3 -3 l-3 3 z" fill="#c2362b"/></g>';
}

export default WICKER;
