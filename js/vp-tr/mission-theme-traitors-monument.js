// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-theme-traitors-monument.js — granite, lichen and iron
// ══════════════════════════════════════════════════════════════════════
//
// The Traitors' Monument THEME for js/vp-tr/mission-bespoke.js, reproducing
// the approved mockup (mockup/mockup-tr-traitors-monument.html): the stone with
// two faces of pigpen panels, six hooded figures round its base, the roll of
// the murdered, the sword in the boulder, and the Shield-or-money bargain.
//
// THE SIDEBAR KNOWS ONLY WHAT HAS BEEN SHOWN. Panels light across the Cipher,
// figures answer across the Figures, the door opens on the card that shows it
// opening, and the sword rises on the card that shows it drawn.
import { players } from '../core.js';
import { playerAvatarUrl } from '../players.js';
import { STAGE_CSS, stageShell, stageFor, reducedMotion, stageEvents } from './mission-stage.js';

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
const _gbp = n => '£' + Number(n || 0).toLocaleString('en-GB');
const _url = name => playerAvatarUrl((players || []).find(p => p && p.name === name) || { name });
const _face = (name, cls = '') => '<img class="tm-av' + (cls ? ' ' + cls : '') + '" data-who="' + _esc(name) + '" src="' + _esc(_url(name)) + '" alt="' + _esc(name) + '" title="'
  + _esc(name) + '" onerror="this.style.visibility=&quot;hidden&quot;">';
const _frac = (n, a, b) => (b > a ? Math.max(0, Math.min(1, (n - a) / (b - a))) : (n >= b ? 1 : 0));
const TEAM_CLS = ['raven', 'serpent'];

function _prog(v) {
  let s = 0;
  return v.phases.map(p => { const o = { start: s, end: s + p.cards.length }; s += p.cards.length; return o; });
}
function _stepOf(v, test) {
  let i = 0;
  for (const p of v.phases) for (const c of p.cards) { if (test(c)) return i; i++; }
  return -1;
}

const isOpen = c => /monument slid back/.test(c.text || '');
const isShut = c => /monument stayed shut\. /.test(c.text || '');
const isBargain = c => /drew the sword/.test(c.text || '');
const isRoll = c => /named them all, first night to last|only name there was to say/.test(c.text || '');

/** A pigpen letter: sides of a 3x3 cell, with a dot on the odd ones. */
function _glyph(n) {
  const k = (n >> 1) % 9;
  const sides = [['R', 'B'], ['L', 'R', 'B'], ['L', 'B'], ['T', 'R', 'B'], ['T', 'R', 'B', 'L'], ['T', 'L', 'B'], ['T', 'R'], ['T', 'L', 'R'], ['T', 'L']][k];
  const d = { T: 'M4 4H20', B: 'M4 20H20', L: 'M4 4V20', R: 'M20 4V20' };
  return '<path class="g" d="' + sides.map(x => d[x]).join(' ') + '" fill="none" stroke-width="2.2" stroke-linecap="round"/>'
    + (n % 2 ? '<circle class="g" cx="12" cy="12" r="1.8"/>' : '');
}

const ICONS = {
  cipher: '<rect x="4" y="4" width="28" height="28" rx="3" fill="#262b2e" stroke="#5d676d"/><path d="M10 10v8h8M26 10h-8v8M10 26h8v-8M26 26v-8h-8" fill="none" stroke="#b8f07a" stroke-width="2"/><circle cx="22" cy="22" r="1.6" fill="#b8f07a"/>',
  misread: '<rect x="4" y="4" width="28" height="28" rx="3" fill="#262b2e" stroke="#5d676d"/><path d="M10 10v8h8M26 10h-8v8" fill="none" stroke="#6d4a3c" stroke-width="2"/><path d="M12 22l12 8M24 22l-12 8" stroke="#e0714c" stroke-width="2.4"/>',
  figure: '<path d="M18 2 L26 18 Q29 24 28 28 L32 34 H4 L8 28 Q7 24 10 18 Z" fill="#a5482c" stroke="#5d2e22"/><ellipse cx="18" cy="17" rx="4.5" ry="6" fill="#0d0f10"/><circle cx="18" cy="28" r="3" fill="#b8f07a"/>',
  turned: '<path d="M18 2 L26 18 Q29 24 28 28 L32 34 H4 L8 28 Q7 24 10 18 Z" fill="#3a1f18" stroke="#5d2e22"/><path d="M11 18l14 12M25 18l-14 12" stroke="#e0714c" stroke-width="2.4"/>',
  roll: '<path d="M8 5h20v26H8z" fill="#e6dfcc" stroke="#6c777c"/><path d="M12 11h12M12 16h12M12 21h9M12 26h7" stroke="#5d676d" stroke-width="1.6"/><path d="M5 5h26" stroke="#a5482c" stroke-width="3"/>',
  sword: '<path d="M4 30c4-6 24-6 28 0z" fill="#3a4043" stroke="#5d676d"/><path d="M17 2h2v22h-2z" fill="#cfd8dc"/><path d="M12 22h12v2H12z" fill="#a5482c"/><path d="M16.5 24h3v4h-3z" fill="#5d2e22"/>',
  bargain: '<path d="M18 3l12 4v9c0 8-5 14-12 17C11 30 6 24 6 16V7z" fill="#f0cd5c" stroke="#7b6224" stroke-width="1.2"/><path d="M17 8h2v16h-2z" fill="#7b6224"/><path d="M13 20h10v2H13z" fill="#7b6224"/>',
  open: '<rect x="9" y="4" width="18" height="28" fill="#3a4043" stroke="#8a969c"/><path d="M13 32V14a5 5 0 0 1 10 0v18z" fill="#2d3f1e" stroke="#b8f07a"/>',
  coin: '<circle cx="18" cy="18" r="13" fill="#2d3f1e" stroke="#b8f07a" stroke-width="2"/><path d="M14 12h7a3 3 0 0 1 0 6h-6a3 3 0 0 0 0 6h7M18 9v18" fill="none" stroke="#b8f07a" stroke-width="1.8"/>',
};
const SYM = {
  raven: '<path d="M-4 1c2-4 6-4 8-1-2 0-3 1-4 3-1-2-2-2-4-2z"/>',
  eye: '<path d="M-5 0a5 2.6 0 0 0 10 0 5 2.6 0 0 0-10 0z"/>',
  key: '<circle cx="-2" r="2.2"/><path d="M0 -.6h5v1.2H0z"/>',
  hand: '<path d="M-3 -3h6v6h-6z"/>',
  moon: '<path d="M-1 -4a4 4 0 1 0 0 8 3 3 0 1 1 0-8z"/>',
  serpent: '<path d="M-4 2c2-4 3 0 4-2s2-2 4 0" fill="none" stroke-width="1.6"/>',
};
const FIG_POS = [[26, 172], [56, 198], [88, 216], [204, 216], [234, 198], [60, 122]];


// ══════════════════════════════════════════════════════════════════════
// THE STAGE — the moor, played (js/vp-tr/mission-stage.js)
// ══════════════════════════════════════════════════════════════════════
//
// The stone stands in the middle with its panels dark, six hooded figures
// round it, and the sword in the boulder beyond. Panels light as they are
// read, a figure drops its hood or turns its back on the card that answers
// it, the door opens, and the sword comes out.
function _tmKind(c, ph) {
  if (c.relic) return 'bargain';
  if (isOpen(c)) return 'opens';
  if (isShut(c)) return 'shut';
  if (isBargain(c)) return 'bargain';
  if (isRoll(c)) return 'roll';
  if (c.isSocial) return 'scene';
  if (ph.id === 'cipher') return c.tone === 'bad' ? 'misread' : 'read';
  if (ph.id === 'figures') return c.tone === 'bad' ? 'turned' : 'answered';
  return 'pull';
}
const TM_CAP = { cipher: ['Part one', 'The Cipher'], figures: ['Part two', 'The Figures'],
  sword: ['Part three', 'The Sword'] };
// six hoods in an arc round the stone
const TM_FIG = [[228, 244], [292, 296], [372, 330], [712, 330], [792, 296], [856, 244]];

function _tmScene(v, s) {
  const e = v.epNum;
  const names = v.teams.map(x => x.name);
  const figs = v.tally.figures || [];
  let panels = '';
  for (let t = 0; t < 2; t++) {
    for (let k = 0; k < 3; k++) {
      const x = t ? 552 : 464, y = 116 + k * 62;
      panels += '<g class="ms-tm-panel ' + (s.panel[t][k] || '') + '" data-tp="' + t + '-' + k
        + '" transform="translate(' + x + ',' + y + ')">'
        + '<rect class="slab" width="64" height="52" rx="3"/>'
        + '<g transform="translate(20,14) scale(1.8)">' + _glyph(3 + t * 5 + k * 3) + '</g></g>';
    }
  }
  const hoods = figs.map((f, i) => '<g class="ms-tm-fig ' + (s.fig[i] || '') + '" data-tf="' + i
    + '" transform="translate(' + TM_FIG[i][0] + ',' + TM_FIG[i][1] + ') scale(1.5)">'
    + '<path class="robe" d="M0 -34 L8 -18 Q11 -10 10 -4 L15 16 H-15 L-10 -4 Q-11 -10 -8 -18 Z" stroke-width="1"/>'
    + '<ellipse cx="0" cy="-15" rx="4.5" ry="6" fill="#0d0f10"/>'
    + '<path d="M-3 -16h6v2.5h-6z" fill="#e6dfcc" opacity=".8"/>'
    + '<g class="sym" transform="translate(0,4)">' + (SYM[f.sym] || '') + '</g>'
    + '<path class="x" d="M-6 -4l12 12M6 -4l-12 12" stroke="#e0714c" stroke-width="2"/></g>').join('');
  const fallen = (v.tally.fallen || []).map((nm, i) =>
    '<g class="ms-tm-fallen' + (s.said ? ' said' : '') + '" transform="translate(' + (70 + i * 54) + ',312)">'
    + '<circle r="21" fill="#15181a" stroke="#454d51" stroke-width="2"/>'
    + '<image href="' + _esc(_url(nm)) + '" x="-19" y="-19" width="38" height="38" clip-path="url(#ms-tm-c-' + e + ')"/></g>').join('');
  return '<rect width="1080" height="360" fill="url(#ms-tm-sky-' + e + ')"/>'
    + '<circle cx="150" cy="60" r="34" fill="rgba(230,223,204,.12)"/><circle cx="150" cy="60" r="15" fill="rgba(230,223,204,.4)"/>'
    + '<path d="M0 214 C140 196 240 224 380 210 C520 196 640 222 780 208 C900 196 1000 216 1080 204 V360 H0Z" fill="#141a18"/>'
    + '<g fill="#101513"><path d="M96 300 V236 c-18-6-12-52 12-60 24 8 30 54 12 60 V300Z"/>'
    + '<path d="M1000 300 V244 c-16-6-10-46 10-54 20 8 26 48 10 54 V300Z"/></g>'
    + '<g class="ms-tm-stone"><path d="M440 320 L452 64 Q540 26 628 64 L640 320 Z" fill="url(#ms-tm-g-' + e + ')" stroke="#5d676d" stroke-width="2"/>'
    + '<path d="M440 320 L452 64 Q462 58 474 53 L466 320Z" fill="rgba(143,174,90,.16)"/>'
    + '<line x1="540" y1="52" x2="540" y2="320" stroke="#1d2123" stroke-width="2"/>'
    + '<text x="492" y="96" text-anchor="middle" font-family="Red Hat Mono" font-size="11" fill="#a9b9c4" letter-spacing="2">' + _esc(String(names[0] || '').toUpperCase()) + '</text>'
    + '<text x="590" y="96" text-anchor="middle" font-family="Red Hat Mono" font-size="11" fill="#8fae5a" letter-spacing="2">' + _esc(String(names[1] || '').toUpperCase()) + '</text>'
    + panels
    + '<path class="ms-tm-door' + (s.open ? ' open' : '') + '" d="M506 320 V270 a34 34 0 0 1 68 0 V320 Z" stroke="#5d676d" stroke-width="2"/></g>'
    + hoods
    + '<g transform="translate(900,250)"><path d="M-54 62c4-28 24-44 54-44s50 16 54 44z" fill="#3a4043" stroke="#5d676d" stroke-width="2"/>'
    + '<g class="ms-tm-sword' + (s.drawn ? ' drawn' : '') + '"><path class="blade" d="M-3 -62h6v86h-6z" fill="#cfd8dc"/>'
    + '<path d="M-16 -62h32v6h-32z" fill="#a5482c"/><path d="M-4 -78h8v18h-8z" fill="#5d2e22"/><circle cy="-82" r="6" fill="#a5482c"/></g></g>'
    + fallen;
}

function _tmStage(v, states, n) {
  const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
  const e = v.epNum;
  const defs = '<clipPath id="ms-tm-c-' + e + '"><circle r="19"/></clipPath>'
    + '<linearGradient id="ms-tm-g-' + e + '" x1="0" x2="1"><stop offset="0" stop-color="#454d51"/>'
    + '<stop offset=".5" stop-color="#363d40"/><stop offset="1" stop-color="#262b2e"/></linearGradient>'
    + '<linearGradient id="ms-tm-sky-' + e + '" x1="0" x2="0" y1="0" y2="1">'
    + '<stop offset="0" stop-color="#1a2126"/><stop offset=".6" stop-color="#141a1d"/><stop offset="1" stop-color="#0f1213"/></linearGradient>';
  return stageShell({ epNum: e, defs, scene: _tmScene(v, s),
    cap: [s.answered + ' of 6 answered', (TM_CAP[s.capPhase] || TM_CAP.cipher)[1]],
    pot: v.potBefore + (s.done && !v.tally.tookShield ? v.earned : 0),
    vars: '--ms-mono:\'Red Hat Mono\',monospace;--ms-accent:#b8f07a;--ms-ink:#e6dfcc',
    label: 'The monument, staged' });
}

function _tmSettle(st, v, s) {
  st.phase(s.watch && s.watch.length ? 'watch' : 'rest');
  st.qa('.ms-tm-panel').forEach(g => {
    const [t, k] = g.getAttribute('data-tp').split('-').map(Number);
    g.setAttribute('class', 'ms-tm-panel ' + (s.panel[t][k] || ''));
  });
  st.qa('.ms-tm-fig').forEach(g => { g.setAttribute('class', 'ms-tm-fig ' + (s.fig[Number(g.getAttribute('data-tf'))] || '')); });
  const door = st.q('.ms-tm-door'); if (door) door.setAttribute('class', 'ms-tm-door' + (s.open ? ' open' : ''));
  const sw = st.q('.ms-tm-sword'); if (sw) sw.setAttribute('class', 'ms-tm-sword' + (s.drawn ? ' drawn' : ''));
  st.qa('.ms-tm-fallen').forEach(g => g.setAttribute('class', 'ms-tm-fallen' + (s.said ? ' said' : '')));
  st.cap(s.answered + ' of 6 answered', (TM_CAP[s.capPhase] || TM_CAP.cipher)[1]);
  st.pot(v.potBefore + (s.done && !v.tally.tookShield ? v.earned : 0), false);
  st.clearStamp();
}

function _tmPlay(st, v, prev, s) {
  _tmSettle(st, v, prev);
  const e = s.ev;
  if (!e) { _tmSettle(st, v, s); return; }
  const land = (fn, ms) => st.later(fn, ms);
  if (e.k === 'read' || e.k === 'answered') {
    st.phase('hold');
    land(() => {
      _tmSettle(st, v, s);
      st.burst(12, 50, 48, 110, 'rgba(184,240,122,.9)');
    }, 1200);
  } else if (e.k === 'misread' || e.k === 'turned') {
    st.phase('hold');
    land(() => {
      _tmSettle(st, v, s); st.phase('bad');
      st.stamp(e.k === 'misread' ? 'READ IT WRONG' : 'IT TURNS ITS BACK', 'bad');
    }, 1400);
  } else if (e.k === 'roll') {
    st.phase('hold');
    land(() => {
      _tmSettle(st, v, s);
      st.stamp('THE ROLL OF THE DEAD', 'cool');
      st.burst(14, 20, 86, 120, 'rgba(184,240,122,.8)');
    }, 1600);
  } else if (e.k === 'opens') {
    st.phase('hold');
    land(() => {
      _tmSettle(st, v, s); st.phase('win');
      st.flash('50%', '80%'); st.burst(22, 50, 84, 180, 'rgba(184,240,122,.95)');
      st.stamp('THE STONE OPENS', 'good');
    }, 1800);
  } else if (e.k === 'shut') {
    st.phase('hold');
    land(() => { _tmSettle(st, v, s); st.phase('bad'); st.stamp('IT STAYED SHUT', 'bad'); }, 1800);
  } else if (e.k === 'pull') {
    st.phase('hold');
    land(() => { _tmSettle(st, v, s); st.stamp('IT DID NOT MOVE', 'cool'); }, 1400);
  } else if (e.k === 'bargain') {
    st.phase('hold');
    land(() => {
      _tmSettle(st, v, s); st.phase('win');
      st.flash('83%', '52%'); st.burst(20, 83, 52, 150, 'rgba(207,216,220,.95)');
      st.stamp(v.tally.tookShield ? 'THE SHIELD · THE MONEY STAYS' : 'DREW IT · LEFT THE SHIELD',
        v.tally.tookShield ? 'gold' : 'good');
      land(() => st.pot(v.potBefore + (v.tally.tookShield ? 0 : v.earned), true), 1400);
    }, 2000);
  } else if (e.k === 'scene') {
    _tmSettle(st, v, s); st.phase('watch');
  } else {
    _tmSettle(st, v, s);
  }
}

export const MONUMENT = {
  id: 'traitors-monument', prefix: 'tm', ownShield: true,
  shieldBeat: /Sacred Sword|if they take it/,
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: () => '<h1 class="tm-title">Traitors\' <span>Monument</span></h1>'
    + '<div class="tm-glyphrow">' + [3, 8, 11, 4, 15, 6, 9, 2, 13].map(n => '<svg viewBox="0 0 24 24">' + _glyph(n) + '</svg>').join('') + '</div>',
  sub: () => 'A stone written in a code nobody at breakfast could read, six hooded figures who each know one thing, and a sword in a boulder that belongs to whoever can pull it.',
  chips: v => [
    { text: v.teams.map(t => t.name).join(' v ') },
    { text: 'Six figures · six riddles' },
    { text: 'Money for every riddle answered' },
    v.tally.offered === false ? { text: 'The Sacred Sword' } : { text: 'The Sacred Sword · a Shield, or the money', shield: true },
  ],
  phaseNum: roman => '<span class="tm-phase-n">' + roman + '</span>',
  cardClass: c => {
    if (c.relic) return 'relic';
    if (isOpen(c) || (isBargain(c) && !c.relic)) return 'open';
    const tm = String(c.team || '').toLowerCase();
    const side = TEAM_CLS.includes(tm) ? tm + ' ' : '';
    return side + (c.isSocial ? 'social ' : '') + (c.tone === 'bad' ? 'bad' : c.tone === 'good' ? 'good' : 'plain');
  },
  cardTag: (c, ph) => {
    if (c.relic) return 'Took the Shield';
    if (isOpen(c)) return 'The stone opens';
    if (isShut(c)) return 'Stayed shut';
    if (isBargain(c)) return /left it/.test(c.text) ? 'Left the Shield' : 'Drew the sword';
    if (isRoll(c)) return 'The roll of the dead';
    if (c.isSocial) return _cap(c.behaviour || 'moment');
    if (ph.id === 'cipher') return c.tone === 'bad' ? 'Misread' : 'Read it';
    if (ph.id === 'figures') return c.tone === 'good' ? 'Answered' : c.tone === 'bad' ? 'Turned away' : 'Waiting';
    return c.tone === 'bad' ? 'Stayed shut' : 'Would not budge';
  },
  icon: (c, ph) => {
    let ic = 'figure';
    if (c.relic) ic = 'bargain';
    else if (isOpen(c) || isShut(c)) ic = 'open';
    else if (isBargain(c)) ic = /left it/.test(c.text) ? 'coin' : 'sword';
    else if (isRoll(c)) ic = 'roll';
    else if (/said so, loudly/.test(c.text || '')) ic = 'coin';
    else if (ph.id === 'cipher') ic = c.tone === 'bad' ? 'misread' : 'cipher';
    else if (ph.id === 'figures') ic = c.tone === 'bad' ? 'turned' : 'figure';
    else if (ph.id === 'sword') ic = 'sword';
    return '<span class="tm-ico"><svg viewBox="0 0 36 36" aria-hidden="true">' + ICONS[ic] + '</svg></span>';
  },

  stage: (v, states, n) => _tmStage(v, states, n),

  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const names = v.teams.map(x => x.name);
    const figs = v.tally.figures || [];
    const fallen = v.tally.fallen || [];
    const pulls = v.tally.pulls || [];
    const all = v.teams.flatMap(t => t.members);
    const rest = all.filter(x => !pulls.includes(x));
    let panels = '';
    for (let t = 0; t < 2; t++) {
      for (let k = 0; k < 3; k++) {
        const x = t ? 149 : 115, y = 48 + k * 44;
        panels += '<g class="tm-panelg ' + (s.panel[t][k] || '') + '" data-panel="' + t + '-' + k + '" transform="translate(' + x + ',' + y + ')">'
          + '<rect class="tm-panelglyph" width="26" height="34" rx="2"/>'
          + '<g transform="translate(1,5)">' + _glyph(3 + t * 5 + k * 3) + '</g></g>';
      }
    }
    const figures = figs.map((f, i) => '<g class="tm-fig ' + (s.fig[i] || '') + '" data-fig="' + i + '" transform="translate(' + FIG_POS[i][0] + ',' + FIG_POS[i][1] + ')">'
      + '<path class="robe" d="M0 -34 L8 -18 Q11 -10 10 -4 L15 16 H-15 L-10 -4 Q-11 -10 -8 -18 Z" stroke-width="1"/>'
      + '<ellipse cx="0" cy="-15" rx="4.5" ry="6" fill="#0d0f10"/>'
      + '<path d="M-3 -16h6v2.5h-6z" fill="#e6dfcc" opacity=".8"/>'
      + '<g class="sym" transform="translate(0,4)">' + (SYM[f.sym] || '') + '</g>'
      + '<path class="x" d="M-6 -4l12 12M6 -4l-12 12" stroke="#e0714c" stroke-width="2"/></g>').join('');
    const roll = fallen.length
      ? '<div class="tm-roll"><small>the roll of the murdered</small><ol>' + fallen.map(nm => '<li class="' + (s.said ? 'said' : '') + '">' + _face(nm) + _esc(nm) + '</li>').join('') + '</ol></div>'
      : '';
    const rows = names.map((nm, i) => '<div class="tm-row"><span><i class="sw ' + TEAM_CLS[i] + '"></i>' + _esc(nm)
      + '</span><b data-row="' + i + '">' + _esc(s.rows[i]) + '</b></div>').join('');
    const draw = v.tally.opened
      ? '<div class="tm-draw">' + pulls.map(nm => _face(nm, s.drawCls[nm] || '')).join('') + rest.map(nm => _face(nm)).join('') + '</div>'
      : '';
    const bargain = v.tally.offered === false || !v.tally.opened ? ''
      : '<div class="tm-bargain' + (s.drawn ? ' on' : '') + '"><div class="lbl">The Sacred Sword</div>'
        + '<div class="tm-scales">'
        + '<div class="tm-pan' + (s.drawn && v.tally.tookShield ? ' chosen' : '') + '" data-pan="s"><svg viewBox="0 0 36 36">' + ICONS.bargain + '</svg>a Shield</div>'
        + '<span class="or">or</span>'
        + '<div class="tm-pan money' + (s.drawn && !v.tally.tookShield ? ' chosen' : '') + '" data-pan="m"><svg viewBox="0 0 36 36">' + ICONS.coin + '</svg>the money</div>'
        + '</div><div class="val">' + _esc(s.bargainVal) + '</div></div>';
    return '<div class="tm-panel"><h3>The Monument</h3>'
      + '<svg class="tm-stone" viewBox="0 0 290 260" role="img" aria-label="The monument and the figures around it">'
      + '<defs><linearGradient id="tm-g-' + v.epNum + '" x1="0" x2="1"><stop offset="0" stop-color="#454d51"/><stop offset=".5" stop-color="#363d40"/><stop offset="1" stop-color="#262b2e"/></linearGradient></defs>'
      + '<ellipse cx="145" cy="228" rx="136" ry="24" fill="#15181a"/>'
      + '<path d="M104 214 L110 36 Q145 12 180 36 L186 214 Z" fill="url(#tm-g-' + v.epNum + ')" stroke="#5d676d" stroke-width="1.5"/>'
      + '<path d="M104 214 L110 36 Q116 32 122 29 L118 214Z" fill="rgba(143,174,90,.18)"/>'
      + '<line x1="145" y1="22" x2="145" y2="214" stroke="#1d2123" stroke-width="1.5"/>'
      + '<text x="127" y="44" text-anchor="middle" fill="#a9b9c4" font-family="Red Hat Mono" font-size="6.5">' + _esc(String(names[0] || '').toUpperCase()) + '</text>'
      + '<text x="162" y="44" text-anchor="middle" fill="#8fae5a" font-family="Red Hat Mono" font-size="6.5">' + _esc(String(names[1] || '').toUpperCase()) + '</text>'
      + panels
      + '<path class="tm-door' + (s.open ? ' open' : '') + '" d="M133 214 V186 a12 12 0 0 1 24 0 V214 Z" stroke="#5d676d"/>'
      + figures
      + '<g transform="translate(250,196)"><path d="M-26 30c2-14 12-22 26-22s24 8 26 22z" fill="#3a4043" stroke="#5d676d"/>'
      + '<g class="tm-sword' + (s.drawn ? ' drawn' : '') + '"><path class="blade" d="M-1.5 -30h3v42h-3z" fill="#cfd8dc"/>'
      + '<path d="M-8 -30h16v3h-16z" fill="#a5482c"/><path d="M-2 -40h4v10h-4z" fill="#5d2e22"/><circle cy="-42" r="3" fill="#a5482c"/></g></g>'
      + '</svg>'
      + roll
      + '<div class="tm-teams">' + rows + '</div>'
      + draw + bargain
      + '<div class="tm-pot">'
      + '<div class="r"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="r"><span>Riddles answered</span><b class="tm-pot-n">' + s.answered + ' of 6</b></div>'
      + '<div class="r"><span>' + (v.tally.tookShield ? 'Left in the stone' : 'Earned today') + '</span><b class="tm-pot-e' + (s.drawn && v.tally.tookShield ? ' lost' : '') + '">'
      + (s.done ? _gbp(v.tally.tookShield ? v.tally.forfeited : v.earned) : '&mdash;') + '</b></div>'
      + '<div class="big">' + _gbp(v.potBefore + (s.done ? v.earned : 0)) + '</div></div></div>';
  },

  sideStates(v, total) {
    const pr = _prog(v);
    const evs = stageEvents(v, _tmKind);
    const t = v.tally.teams || {};
    const names = v.teams.map(x => x.name);
    const figs = v.tally.figures || [];
    const pulls = v.tally.pulls || [];
    const drawer = v.tally.drawer;
    const openAt = _stepOf(v, isOpen);
    const drawAt = _stepOf(v, c => isBargain(c));
    const rollIdx = figs.findIndex(f => f.kind === 'roll');
    const out = [];
    for (let n = 0; n <= total; n++) {
      const c1 = _frac(n, pr[0].start, pr[0].end);
      const c2 = _frac(n, pr[1].start, pr[1].end);
      const done = n >= total;
      const panel = names.map(nm => {
        const read = Math.round(((t[nm] || {}).read || 0) * c1);
        const miss = Math.round(((t[nm] || {}).misread || 0) * c1);
        return [0, 1, 2].map(k => (k < read ? 'read' : k < read + miss ? 'miss' : ''));
      });
      const fig = figs.map((f, i) => {
        if (!f.by) return c1 >= 1 && f.state === 'lost' ? 'failed' : '';
        return c2 >= (i + 1) / 6 ? (f.state === 'solved' ? 'solved' : 'failed') : '';
      });
      const shown = names.map((nm, ti) => fig.slice(ti * 3, ti * 3 + 3).filter(x => x === 'solved').length);
      const open = openAt >= 0 && n > openAt;
      const drawn = drawAt >= 0 && n > drawAt;
      const drawCls = {};
      for (const p of pulls) drawCls[p] = drawn && p === drawer ? 'pulled' : open ? 'tried' : '';
      const ev = evs[n - 1] || null;
      out.push({
        // the stage's own reading of the same step
        ev, capPhase: ev ? ev.phase : 'cipher',
        watch: ev && ev.k === 'scene' ? ev.who : [],
        v: { epNum: v.epNum, potBefore: v.potBefore, earned: v.earned, tally: v.tally },
        panel, fig, open, drawn, drawCls, done,
        said: rollIdx >= 0 && fig[rollIdx] === 'solved',
        answered: shown[0] + (shown[1] || 0),
        rows: names.map((nm, i) => panel[i].filter(x => x === 'read').length + ' read · ' + shown[i] + ' answered'),
        bargainVal: drawn ? (drawer + (v.tally.tookShield ? ' · took the Shield' : ' · left it for the pot'))
          : open ? pulls.length + ' in line for the sword' : 'the sword is still in the stone',
      });
    }
    return out;
  },

  paintSide(prefix, states, n, mode) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const st = stageFor(s.v.epNum);
    if (st) {
      st.clear();
      if (mode === 'next' && n > 0 && !reducedMotion()) _tmPlay(st, s.v, states[n - 1], s);
      else _tmSettle(st, s.v, s);
    }
    const panel = document.querySelector('.tm-panel'); if (!panel) return;
    panel.querySelectorAll('.tm-panelg').forEach(g => {
      const [t, k] = g.getAttribute('data-panel').split('-').map(Number);
      g.setAttribute('class', 'tm-panelg ' + (s.panel[t][k] || ''));
    });
    panel.querySelectorAll('.tm-fig').forEach(g => { g.setAttribute('class', 'tm-fig ' + (s.fig[+g.getAttribute('data-fig')] || '')); });
    const door = panel.querySelector('.tm-door'); if (door) door.setAttribute('class', 'tm-door' + (s.open ? ' open' : ''));
    const sw = panel.querySelector('.tm-sword'); if (sw) sw.setAttribute('class', 'tm-sword' + (s.drawn ? ' drawn' : ''));
    panel.querySelectorAll('.tm-roll li').forEach(li => { li.className = s.said ? 'said' : ''; });
    panel.querySelectorAll('[data-row]').forEach(b => { b.textContent = s.rows[+b.getAttribute('data-row')]; });
    panel.querySelectorAll('.tm-draw .tm-av').forEach(a => { a.className = 'tm-av ' + (s.drawCls[a.getAttribute('data-who')] || ''); });
    const bg = panel.querySelector('.tm-bargain');
    if (bg) {
      bg.classList.toggle('on', s.drawn);
      bg.querySelector('.val').textContent = s.bargainVal;
      if (!s.drawn) bg.querySelectorAll('.tm-pan').forEach(p => p.classList.remove('chosen'));
    }
    const pn = panel.querySelector('.tm-pot-n'); if (pn) pn.textContent = s.answered + ' of 6';
  },

  atmosphere: () => '<div class="tm-sky"></div>'
    + '<svg class="tm-stones" viewBox="0 0 1200 300" preserveAspectRatio="none"><g fill="#1c2123" stroke="#2b3134" stroke-width="3">'
    + '<path d="M60 300 L70 150 Q90 120 110 150 L118 300Z"/><path d="M180 300 L186 190 Q200 170 214 190 L222 300Z"/>'
    + '<path d="M960 300 L968 170 Q990 140 1010 170 L1016 300Z"/><path d="M1080 300 L1090 120 Q1110 96 1130 120 L1136 300Z"/></g>'
    + '<path d="M0 290 Q300 262 600 284 T1200 276 V300 H0Z" fill="#101415"/></svg>'
    + '<div class="tm-mist"></div>',

  css: `
@import url('https://fonts.googleapis.com/css2?family=Metamorphous&family=Alegreya:ital,wght@0,400;0,600;1,400&family=Red+Hat+Mono:wght@400;600&display=swap');
.tm-root{--tm-bone:#e6dfcc;--tm-moon:#a9b9c4;--tm-lichen:#8fae5a;--tm-glow:#b8f07a;--tm-rust:#a5482c;--tm-rust-hi:#e0714c;--tm-steel:#cfd8dc;--tm-shield:#f0cd5c;
  --cv-display:'Metamorphous',serif;
  background:#121517;color:var(--tm-moon);font-family:'Alegreya',Georgia,serif;font-size:18px;line-height:1.55;padding-bottom:120px;position:relative;overflow:clip}
.tm-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.tm-sky{position:absolute;inset:0;background:radial-gradient(160px 160px at 82% 12%,rgba(230,223,204,.20),transparent 70%),radial-gradient(40px 40px at 82% 12%,rgba(230,223,204,.55),transparent 70%),linear-gradient(180deg,#1a2126 0%,#141a1d 45%,#0f1213 100%)}
.tm-stones{position:absolute;left:0;right:0;bottom:0;width:100%;height:34vh;opacity:.55}
.tm-mist{position:absolute;left:-10%;right:-10%;bottom:0;height:30vh;opacity:.35;background:radial-gradient(40% 60% at 30% 100%,rgba(169,185,196,.35),transparent 70%),radial-gradient(40% 60% at 75% 100%,rgba(169,185,196,.28),transparent 70%);animation:tm-mist 24s ease-in-out infinite alternate}
@keyframes tm-mist{from{transform:translateX(-3%)}to{transform:translateX(3%)}}
.tm-shell{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:26px 16px 40px}
.tm-body{position:relative;z-index:2}
.tm-hero{position:relative;padding:34px 26px 26px;text-align:center;overflow:hidden;
  background:radial-gradient(3px 3px at 12% 30%,rgba(143,174,90,.5),transparent),radial-gradient(5px 4px at 88% 70%,rgba(143,174,90,.45),transparent),radial-gradient(30% 40% at 0% 100%,rgba(143,174,90,.18),transparent 70%),repeating-linear-gradient(35deg,rgba(255,255,255,.018) 0 2px,transparent 2px 9px),linear-gradient(180deg,#3a4043,#262b2e);
  border:2px solid #4a5256;box-shadow:inset 0 2px 0 rgba(255,255,255,.06),inset 0 -8px 20px rgba(0,0,0,.4),0 20px 50px rgba(0,0,0,.6);clip-path:polygon(2% 0,98% 0,100% 12%,100% 100%,0 100%,0 12%)}
.tm-kicker{font:13px/1 'Red Hat Mono',monospace;letter-spacing:.3em;text-transform:uppercase;color:var(--tm-lichen)}
.tm-title{font-family:'Metamorphous',serif;font-weight:400;color:var(--tm-bone);font-size:clamp(34px,7.4vw,80px);line-height:1.02;margin:.14em 0 .08em;text-shadow:0 -1px 0 rgba(0,0,0,.8),0 1px 0 rgba(255,255,255,.12)}
.tm-title span{color:var(--tm-lichen)}
.tm-glyphrow{display:flex;justify-content:center;gap:6px;margin:4px 0 10px}
.tm-glyphrow svg{width:22px;height:22px;stroke:var(--tm-lichen);fill:var(--tm-lichen)}
.tm-sub{color:#aeb9c0;max-width:58ch;margin:0 auto;font-style:italic}
.tm-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}
.tm-chip{font:12px/1 'Red Hat Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--tm-bone);border:1px solid #4a5256;padding:6px 11px;background:rgba(0,0,0,.35)}
.tm-chip.shield{border-color:var(--tm-shield);color:var(--tm-shield)}
.tm-hero .mb-roster{justify-content:center;text-align:left}
.tm-hero .mb-rname{font-family:'Red Hat Mono',monospace;letter-spacing:.2em;text-transform:uppercase}
.tm-hero .mb-rteam[data-side="0"] .mb-rname{color:var(--tm-moon)}
.tm-hero .mb-rteam[data-side="1"] .mb-rname{color:var(--tm-lichen)}
.tm-av{width:34px;height:34px;border-radius:50%;object-fit:cover;object-position:50% 20%;background:#2f3437;border:2px solid #4a5256;box-shadow:0 2px 8px rgba(0,0,0,.6);display:inline-block;vertical-align:middle}
.tm-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px;margin-top:24px;align-items:start}
@media(max-width:940px){.tm-grid{grid-template-columns:minmax(0,1fr)}}
.tm-brief{background:linear-gradient(180deg,rgba(38,43,46,.95),rgba(26,30,32,.96));border:1px solid #3b4245;border-left:6px solid var(--tm-lichen);padding:22px 22px 16px}
.tm-brief h2{font-family:'Metamorphous',serif;font-weight:400;font-size:30px;margin:0;color:var(--tm-bone)}
.tm-staging{font-style:italic;color:#909ca2;border-bottom:1px dashed #3b4245;padding-bottom:12px;margin:8px 0 14px}
.tm-beat{margin:0 0 11px}
.tm-beat p{margin:0}
.tm-beat.do p{font:14.5px/1.5 'Red Hat Mono',monospace;color:#7d8a90}
.tm-beat.say p{color:var(--tm-bone);padding-left:14px;border-left:2px solid #4a5256}
.tm-beat.shield p{border-left-color:var(--tm-shield);color:#f7e6b0}
.tm-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.tm-rule{font:11px/1 'Red Hat Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:#909ca2;border:1px solid #3b4245;padding:5px 8px}
.tm-rule b{color:var(--tm-lichen);margin-right:4px}
.tm-phase{margin-top:28px}
.tm-phase-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:6px;border-bottom:1px solid #3b4245}
.tm-phase-n{width:40px;height:40px;display:grid;place-items:center;font:17px/1 'Metamorphous',serif;color:var(--tm-bone);background:linear-gradient(160deg,#4a5256,#262b2e);border:1px solid #5d676d;border-radius:6px 6px 14px 14px;box-shadow:inset 0 -3px 0 rgba(143,174,90,.5)}
.tm-phase-name{font-family:'Metamorphous',serif;font-size:30px;line-height:1;color:var(--tm-bone)}
.tm-phase-stats{margin-left:auto;display:flex;gap:6px}
.tm-stat{font:11px/1 'Red Hat Mono',monospace;font-style:normal;text-transform:uppercase;letter-spacing:.1em;color:#b3bec4;background:#2a2f32;padding:5px 8px}
.tm-setting{font-style:italic;color:#8a969c;margin:8px 0 12px}
.tm-card{position:relative;margin:0 0 12px;padding:14px 16px 13px 66px;background:linear-gradient(180deg,#262b2e,#1b1f21);border:1px solid #363d40;opacity:0;filter:blur(3px);transform:scale(.985);transition:opacity .5s ease,filter .6s ease,transform .6s ease}
.tm-card.on{opacity:1;filter:none;transform:none}
.tm-card.raven{border-left:4px solid var(--tm-moon)}
.tm-card.serpent{border-left:4px solid var(--tm-lichen)}
.tm-card.bad{box-shadow:inset 0 0 0 1px rgba(224,113,76,.35)}
.tm-card.relic{border:1px solid var(--tm-shield);box-shadow:0 0 24px rgba(240,205,92,.18)}
.tm-card.open{border:1px solid var(--tm-glow);box-shadow:0 0 24px rgba(184,240,122,.12)}
.tm-ico{position:absolute;left:14px;top:14px;width:38px;height:38px}
.tm-ico svg{width:100%;height:100%;display:block}
.tm-tag{float:right;font:11px/1 'Red Hat Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#8a969c;margin:4px 0 0 10px}
.tm-card.good .tm-tag,.tm-card.open .tm-tag{color:var(--tm-glow)}.tm-card.bad .tm-tag{color:var(--tm-rust-hi)}.tm-card.relic .tm-tag{color:var(--tm-shield)}
.tm-who{font-weight:600;color:var(--tm-bone)}
.tm-card .mb-avs .cv-av{width:34px;height:34px;border:2px solid #4a5256}
.tm-card.raven .cv-av{border-color:var(--tm-moon)}.tm-card.serpent .cv-av{border-color:var(--tm-lichen)}.tm-card.relic .cv-av{border-color:var(--tm-shield)}
.tm-txt{margin-top:6px}
.tm-conf{margin-top:10px;padding:9px 12px;background:rgba(0,0,0,.35);border-left:2px solid var(--tm-rust);font-style:italic;color:#dfe4e6}
.tm-conf small{display:block;font:11px/1.4 'Red Hat Mono',monospace;font-style:normal;letter-spacing:.12em;text-transform:uppercase;color:var(--tm-rust-hi)}
.tm-fx{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.tm-fx span{font:11px/1 'Red Hat Mono',monospace;color:#b3bec4;border:1px solid #3b4245;padding:4px 7px}
.tm-summary{margin-top:24px;padding:18px 20px;border:1px solid #4a5256;border-left:6px solid var(--tm-lichen);background:rgba(26,30,32,.96);transition:opacity .4s}
.tm-summary small{display:block;font:11px/1.4 'Red Hat Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--tm-lichen);margin-bottom:4px}
.tm-side{position:sticky;top:60px}
.tm-panel{background:rgba(14,17,18,.96);border:1px solid #363d40;padding:14px}
.tm-panel h3{font:400 24px/1 'Metamorphous',serif;color:var(--tm-bone);margin:0 0 8px;text-align:center}
.tm-stone{display:block;width:100%;max-width:290px;margin:0 auto}
.tm-panelglyph{fill:#1d2123;stroke:#454d51;stroke-width:1;transition:all .6s}
.tm-panelg .g{stroke:#566064;fill:#566064;transition:stroke .6s,fill .6s,filter .6s}
.tm-panelg path.g{fill:none}
.tm-panelg.read .tm-panelglyph{fill:#1f2a1a;stroke:var(--tm-lichen)}
.tm-panelg.read .g{stroke:var(--tm-glow);fill:var(--tm-glow);filter:drop-shadow(0 0 3px rgba(184,240,122,.9))}
.tm-panelg.read path.g{fill:none}
.tm-panelg.miss .tm-panelglyph{fill:#2a1a15;stroke:var(--tm-rust)}
.tm-panelg.miss .g{stroke:#6d4a3c;fill:#6d4a3c}
.tm-panelg.miss path.g{fill:none}
.tm-fig .robe{fill:#3a1f18;stroke:#5d2e22;transition:fill .6s}
.tm-fig .sym{fill:#555e62;stroke:#555e62;transition:fill .6s,filter .6s}
.tm-fig.solved .robe{fill:var(--tm-rust)}
.tm-fig.solved .sym{fill:var(--tm-glow);stroke:var(--tm-glow);filter:drop-shadow(0 0 4px rgba(184,240,122,.9))}
.tm-fig.failed .sym{fill:#6d4a3c;stroke:#6d4a3c}
.tm-fig .x{opacity:0;transition:opacity .5s}
.tm-fig.failed .x{opacity:1}
.tm-door{fill:#15181a;transition:fill .8s}
.tm-door.open{fill:#2d3f1e;filter:drop-shadow(0 0 8px rgba(184,240,122,.6))}
.tm-sword{transition:transform .9s cubic-bezier(.3,1.4,.5,1)}
.tm-sword.drawn{transform:translateY(-26px)}
.tm-sword.drawn .blade{filter:drop-shadow(0 0 5px rgba(207,216,220,.9))}
.tm-roll{margin:10px 0 4px;padding:8px 10px;background:#15181a;border:1px solid #363d40}
.tm-roll small{display:block;text-align:center;font:10.5px/1 'Red Hat Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#6c777c;margin-bottom:6px}
.tm-roll ol{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
.tm-roll li{display:flex;align-items:center;gap:4px;font:12px/1 'Red Hat Mono',monospace;color:#6c777c;padding:3px 6px 3px 3px;border:1px solid #2c3235;border-radius:20px;transition:all .5s}
.tm-roll li .tm-av{width:20px;height:20px;border-width:1px;filter:grayscale(1)}
.tm-roll li.said{color:var(--tm-bone);border-color:var(--tm-lichen)}
.tm-roll li.said .tm-av{filter:none}
.tm-teams{border-top:1px solid #363d40;padding-top:6px;margin-top:8px}
.tm-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;color:var(--tm-bone)}
.tm-row b{font:13px/1 'Red Hat Mono',monospace;color:var(--tm-bone);font-weight:400}
.tm-row .sw{display:inline-block;width:9px;height:9px;margin-right:7px}
.tm-row .sw.raven{background:var(--tm-moon)}.tm-row .sw.serpent{background:var(--tm-lichen)}
.tm-draw{margin-top:10px;display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap}
.tm-draw .tm-av{width:24px;height:24px;border-width:1.5px;opacity:.35;transition:opacity .4s}
.tm-draw .tm-av.tried{opacity:1;filter:grayscale(.7)}
.tm-draw .tm-av.pulled{opacity:1;filter:none;border-color:var(--tm-steel);box-shadow:0 0 10px rgba(207,216,220,.7)}
.tm-bargain{margin-top:12px;padding:11px 12px;border:1px dashed #6b5b2a;text-align:center;transition:all .5s}
.tm-bargain .lbl{font:11px/1 'Red Hat Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a7a4a}
.tm-scales{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-top:8px}
.tm-pan{padding:6px 4px;border:1px solid #363d40;font:12px/1.3 'Red Hat Mono',monospace;color:#6c777c;transition:all .5s}
.tm-pan svg{width:26px;height:26px;display:block;margin:0 auto 3px}
.tm-pan.chosen{border-color:var(--tm-shield);color:var(--tm-shield);box-shadow:0 0 12px rgba(240,205,92,.25)}
.tm-pan.chosen.money{border-color:var(--tm-glow);color:var(--tm-glow);box-shadow:0 0 12px rgba(184,240,122,.2)}
.tm-bargain .or{font:italic 15px/1 'Alegreya',serif;color:#6c777c}
.tm-bargain .val{margin-top:8px;font-style:italic;color:#8a969c}
.tm-bargain.on{border:1px solid var(--tm-shield)}
.tm-bargain.on .lbl,.tm-bargain.on .val{color:var(--tm-shield);font-style:normal}
.tm-pot{margin-top:12px;border-top:1px solid #363d40;padding-top:10px}
.tm-pot .r{display:flex;justify-content:space-between;font-size:15px;color:#8a969c}
.tm-pot .r b{font:13px/1.7 'Red Hat Mono',monospace;color:var(--tm-bone);font-weight:400}
.tm-pot .r b.lost{color:var(--tm-rust-hi);text-decoration:line-through}
.tm-pot .big{font:30px/1.1 'Red Hat Mono',monospace;color:var(--tm-lichen);text-align:right;margin-top:4px}
.tm-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 16px;background:linear-gradient(0deg,#0a0c0d 60%,rgba(10,12,13,0))}
.tm-btn{font:16px/1 'Metamorphous',serif;letter-spacing:.06em;cursor:pointer;padding:12px 26px;color:#101314;background:linear-gradient(180deg,#c9dca2,var(--tm-lichen));border:1px solid #4d6230}
.tm-btn[disabled]{opacity:.4;cursor:default}
.tm-btn.ghost{background:transparent;color:var(--tm-bone);border:1px solid #4a5256}
.tm-counter{font:13px/1 'Red Hat Mono',monospace;color:#5d676d;letter-spacing:.08em}

/* ── THE STAGE: the moor ─────────────────────────────────────────────── */
.ms-tm-panel .slab{fill:#1d2123;stroke:#454d51;stroke-width:2;transition:fill .7s,stroke .7s}
.ms-tm-panel .g{stroke:#566064;fill:none;transition:stroke .7s,filter .7s}
.ms-tm-panel circle.g{fill:#566064}
.ms-tm-panel.read .slab{fill:#1f2a1a;stroke:#8fae5a}
.ms-tm-panel.read .g{stroke:#b8f07a;filter:drop-shadow(0 0 4px rgba(184,240,122,.9))}
.ms-tm-panel.read circle.g{fill:#b8f07a}
.ms-tm-panel.miss .slab{fill:#2a1a15;stroke:#a5482c}
.ms-tm-panel.miss .g{stroke:#6d4a3c}
.ms-tm-fig .robe{fill:#3a1f18;stroke:#5d2e22;transition:fill .7s}
.ms-tm-fig .sym{fill:#555e62;stroke:#555e62;transition:fill .7s,filter .7s}
.ms-tm-fig.solved .robe{fill:#a5482c}
.ms-tm-fig.solved .sym{fill:#b8f07a;stroke:#b8f07a;filter:drop-shadow(0 0 6px rgba(184,240,122,.9))}
.ms-tm-fig.failed{transform-box:fill-box}
.ms-tm-fig.failed .sym{fill:#6d4a3c;stroke:#6d4a3c}
.ms-tm-fig .x{opacity:0;transition:opacity .5s}
.ms-tm-fig.failed .x{opacity:1}
.ms-tm-door{fill:#15181a;transition:fill .9s,filter .9s}
.ms-tm-door.open{fill:#2d3f1e;filter:drop-shadow(0 0 14px rgba(184,240,122,.7))}
.ms-tm-sword{transition:transform 1.1s cubic-bezier(.3,1.4,.5,1)}
.ms-tm-sword.drawn{transform:translateY(-48px)}
.ms-tm-sword.drawn .blade{filter:drop-shadow(0 0 8px rgba(207,216,220,.95))}
.ms-tm-fallen{opacity:.25;transition:opacity .7s}
.ms-tm-fallen.said{opacity:1;filter:drop-shadow(0 0 6px rgba(184,240,122,.6))}
.ms[data-phase=watch] .ms-tm-fig,.ms[data-phase=watch] .ms-tm-stone{filter:brightness(.45)}
.ms[data-phase=bad] .ms-vig{box-shadow:inset 0 0 160px 60px rgba(50,14,8,.85)}
@media(prefers-reduced-motion:reduce){.tm-root *,.tm-root *::before,.tm-root *::after{animation:none !important;transition:none !important}.tm-card{opacity:1;filter:none}}
` + STAGE_CSS,
};

export default MONUMENT;
