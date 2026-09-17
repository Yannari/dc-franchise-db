// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-theme-church-match.js — stained glass and candle wax
// ══════════════════════════════════════════════════════════════════════
//
// The Church Match THEME for js/vp-tr/mission-bespoke.js, reproducing the
// approved mockup (mockup/mockup-tr-church-match.html): a rose window of twelve
// panes (six per team), the double confessional with each team's reader, the
// pew of masked figures, and the Kneeling box.
//
// THE SIDEBAR KNOWS ONLY WHAT HAS BEEN SHOWN. Riddles are read as the Book
// phase is revealed, panes light and crack as the Congregation is revealed,
// and the hub turns gold on the card that shows the Kneeling.
import { players } from '../core.js';
import { playerAvatarUrl } from '../players.js';
import { STAGE_CSS, stageShell, stageFor, reducedMotion, stageEvents } from './mission-stage.js';

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
const _gbp = n => '£' + Number(n || 0).toLocaleString('en-GB');
const _url = name => playerAvatarUrl((players || []).find(p => p && p.name === name) || { name });
const _face = name => '<img class="cm-av" src="' + _esc(_url(name)) + '" alt="' + _esc(name) + '" title="'
  + _esc(name) + '" onerror="this.style.visibility=&quot;hidden&quot;">';
const _frac = (n, a, b) => (b > a ? Math.max(0, Math.min(1, (n - a) / (b - a))) : (n >= b ? 1 : 0));
const TEAM_CLS = ['candle', 'bell'];

function _prog(v) {
  let s = 0;
  return v.phases.map(p => { const o = { start: s, end: s + p.cards.length }; s += p.cards.length; return o; });
}
function _stepOf(v, test) {
  let i = 0;
  for (const p of v.phases) for (const c of p.cards) { if (test(c)) return i; i++; }
  return -1;
}

const isCalled = c => /called .+ forward/.test(c.text || '');
const isTouch = c => /lifted the edge|brushed a sleeve/.test(c.text || '');

const ICONS = {
  book: '<path d="M4 8c5-2 10-2 14 1 4-3 9-3 14-1v20c-5-2-10-2-14 1-4-3-9-3-14-1z" fill="#e8dfca" stroke="#6b5c3a"/><path d="M18 9v20" stroke="#6b5c3a"/><path d="M7 13h8M7 17h8M21 13h8M21 17h6" stroke="#b8263a" stroke-width="1.2"/>',
  lost: '<path d="M4 8c5-2 10-2 14 1 4-3 9-3 14-1v20c-5-2-10-2-14 1-4-3-9-3-14-1z" fill="#e8dfca" stroke="#6b5c3a" opacity=".6"/><circle cx="24" cy="22" r="7" fill="none" stroke="#d05050" stroke-width="2"/><path d="M29 27l5 5" stroke="#d05050" stroke-width="2.4"/>',
  mask: '<path d="M4 14c4-4 10-4 14 0 4-4 10-4 14 0-1 8-6 11-9 9-2-1-3-3-5-3s-3 2-5 3c-3 2-8-1-9-9z" fill="#0a0a0c" stroke="#ece4d2" stroke-width="1"/><circle cx="11" cy="16" r="2.4" fill="#ece4d2"/><circle cx="25" cy="16" r="2.4" fill="#ece4d2"/><path d="M8 11c-2-3-1-6 1-8" stroke="#b8263a" stroke-width="1.6" fill="none"/>',
  found: '<path d="M4 14c4-4 10-4 14 0 4-4 10-4 14 0-1 8-6 11-9 9-2-1-3-3-5-3s-3 2-5 3c-3 2-8-1-9-9z" fill="#0a0a0c" stroke="#f1e3b6" stroke-width="1"/><path d="M15 26l3 6 3-6z" fill="#f1e3b6"/><circle cx="18" cy="25" r="2.4" fill="#f1e3b6"/>',
  hand: '<path d="M12 30V14c0-2 3-2 3 0v6-10c0-2 3-2 3 0v10-12c0-2 3-2 3 0v12-9c0-2 3-2 3 0v13c0 5-3 8-8 8h-2c-3 0-5-2-6-4l-4-6c-1-2 1-3 3-2z" fill="#e8dfca" stroke="#6b5c3a"/><path d="M6 6l24 24" stroke="#d05050" stroke-width="2.6"/>',
  kneel: '<path d="M18 3l12 4v9c0 8-5 14-12 17C11 30 6 24 6 16V7z" fill="#f1cd5f" stroke="#7b6224" stroke-width="1.2"/><path d="M18 9v17M12 15h12" stroke="#7b6224" stroke-width="2"/>',
  candle: '<rect x="14" y="14" width="8" height="18" rx="1" fill="#f1e3b6"/><path d="M18 3c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" fill="#ffb347"/><path d="M10 32h16" stroke="#6b5c3a" stroke-width="2"/>',
};

/** One wedge of the rose window, clockwise from the top. */
function _pane(i) {
  const a0 = (i * 30 - 90) * Math.PI / 180, a1 = ((i + 1) * 30 - 90) * Math.PI / 180;
  const r0 = 26, r1 = 98;
  const f = x => x.toFixed(2);
  const p = [[r0 * Math.cos(a0), r0 * Math.sin(a0)], [r1 * Math.cos(a0), r1 * Math.sin(a0)],
    [r1 * Math.cos(a1), r1 * Math.sin(a1)], [r0 * Math.cos(a1), r0 * Math.sin(a1)]].map(q => q.map(f).join(' '));
  const mid = (a0 + a1) / 2;
  return '<path class="cm-pane" data-pane="' + i + '" d="M' + p[0] + ' L' + p[1] + ' A98 98 0 0 1 ' + p[2] + ' L' + p[3] + ' A26 26 0 0 0 ' + p[0] + 'Z"/>'
    + '<path class="cm-crackline" data-crack="' + i + '" d="M' + f(45 * Math.cos(mid)) + ' ' + f(45 * Math.sin(mid)) + ' l8 6 -6 8 9 7" stroke="#d05050" stroke-width="2" fill="none"/>'
    + '<circle cx="' + f(62 * Math.cos(mid)) + '" cy="' + f(62 * Math.sin(mid)) + '" r="7" fill="none" stroke="#0a0a0c" stroke-width="2"/>';
}
/** Pane class for team t's k-th pane (Candle fills the right half, Bell the left). */
function _paneFor(s) {
  const out = {};
  for (let t = 0; t < 2; t++) {
    for (let k = 0; k < 6; k++) {
      const id = t === 0 ? 5 - k : 6 + k;
      const named = s.named[t], lost = s.lost[t];
      out[id] = k < named ? 'lit ' + TEAM_CLS[t] : k < named + lost ? 'crack' : '';
    }
  }
  return out;
}


// ══════════════════════════════════════════════════════════════════════
// THE STAGE — the church, played (js/vp-tr/mission-stage.js)
// ══════════════════════════════════════════════════════════════════════
//
// The nave: the rose window over the altar, a double confessional at the back
// with a reader behind each grille, twelve masked figures in the pews, and a
// kneeler at the front. Panes light as items are named and crack when a riddle
// is lost; a mask lights when its item is found; the kneeler takes the Shield.
function _cmKind(c, ph) {
  if (c.relic) return 'kneel';
  if (isCalled(c)) return 'called';
  if (c.isSocial) return c.behaviour === 'selfish' ? 'snub' : 'scene';
  if (ph.id === 'book') return c.tone === 'bad' ? 'lostpage' : 'read';
  if (ph.id === 'pews') return c.tone === 'good' ? 'named' : isTouch(c) ? 'touched' : 'wrongmask';
  return 'other';
}
const CM_CAP = { book: ['Part one', 'The Book'], pews: ['Part two', 'The Congregation'],
  kneel: ['Part three', 'The Kneeling'] };

function _cmPane(i, cls) {
  const a0 = (i * 30 - 90) * Math.PI / 180, a1 = ((i + 1) * 30 - 90) * Math.PI / 180;
  const r0 = 22, r1 = 76;
  const f = x => x.toFixed(1);
  const p = [[r0 * Math.cos(a0), r0 * Math.sin(a0)], [r1 * Math.cos(a0), r1 * Math.sin(a0)],
    [r1 * Math.cos(a1), r1 * Math.sin(a1)], [r0 * Math.cos(a1), r0 * Math.sin(a1)]].map(q => q.map(f).join(' '));
  return '<path class="ms-cm-pane ' + cls + '" data-cp="' + i + '" d="M' + p[0] + ' L' + p[1]
    + ' A76 76 0 0 1 ' + p[2] + ' L' + p[3] + ' A22 22 0 0 0 ' + p[0] + 'Z"/>';
}

function _cmScene(v, s) {
  const e = v.epNum;
  const names = v.teams.map(x => x.name);
  const t = v.tally.teams || {};
  const masks = v.tally.masks || [];
  // the rose window: six panes a team, Candle on the right, Bell on the left
  let rose = '';
  for (let ti = 0; ti < 2; ti++) {
    for (let k = 0; k < 6; k++) {
      const id = ti === 0 ? 5 - k : 6 + k;
      const named = s.named[ti], lost = s.lost[ti];
      rose += _cmPane(id, k < named ? 'lit ' + (ti ? 'bell' : 'candle') : k < named + lost ? 'crack' : '');
    }
  }
  const booths = names.map((nm, i) => {
    const reader = (t[nm] || {}).reader;
    const x = i ? 866 : 134;
    return '<g class="ms-cm-booth ' + (i ? 'bell' : 'candle') + '" transform="translate(' + x + ',196)">'
      + '<path d="M-56 120 V-30 a56 56 0 0 1 112 0 V120 Z" fill="#16100c" stroke="#4a3828" stroke-width="3"/>'
      + '<path d="M-34 44 V-20 a34 34 0 0 1 68 0 V44 Z" fill="#0b0a0c"/>'
      + (reader ? '<image href="' + _esc(_url(reader)) + '" x="-26" y="-22" width="52" height="52" clip-path="url(#ms-cm-c-' + e + ')"/>' : '')
      + '<path class="grille" d="M-34 -20 h68 M-34 -6 h68 M-34 8 h68 M-34 22 h68 M-20 -46 v90 M-6 -46 v90 M8 -46 v90 M22 -46 v90" stroke="rgba(0,0,0,.6)" stroke-width="3"/>'
      + '<text class="lbl" y="86" text-anchor="middle">' + _esc(nm.toUpperCase()) + '</text>'
      + '<text class="cnt" data-booth="' + i + '" y="106" text-anchor="middle">' + _esc(s.booth[i]) + '</text></g>';
  }).join('');
  const pew = masks.map((mk, i) => {
    const col = i % 6, row = Math.floor(i / 6);
    const x = 314 + col * 92, y = 252 + row * 66;
    return '<g class="ms-cm-mask' + (s.found[i] ? ' found' : '') + '" data-cm="' + i + '" transform="translate(' + x + ',' + y + ')">'
      + '<path class="face" d="M-22 -6c6-8 16-8 22 0 6-8 16-8 22 0-2 14-10 18-15 15-3-2-5-5-7-5s-4 3-7 5c-5 3-13-1-15-15z"/>'
      + '<circle class="eye" cx="-13" cy="-3" r="3.4"/><circle class="eye" cx="9" cy="-3" r="3.4"/>'
      + '<path class="item" d="M-3 14 l3 9 l3-9z"/></g>';
  }).join('');
  const sh = v.shield || {};
  return '<rect width="1080" height="360" fill="#141518"/>'
    + '<g class="ms-cm-arches" stroke="#2c2f36" stroke-width="8" fill="none">'
    + '<path d="M228 360 V150 Q290 66 352 150 V360"/><path d="M728 360 V150 Q790 66 852 150 V360"/></g>'
    + '<path d="M0 0 H1080 V360 H0Z" fill="url(#ms-cm-light-' + e + ')"/>'
    + '<g class="ms-cm-rose" transform="translate(540,96)"><circle r="82" fill="#0a0a0c"/>' + rose
    + '<circle class="ms-cm-hub' + (s.won ? ' on' : '') + '" r="18" fill="#23252b" stroke="#0a0a0c" stroke-width="3"/>'
    + '<path d="M0 -11l8 3v5c0 6-4 9-8 11-4-2-8-5-8-11v-5z" fill="#0a0a0c" opacity=".7"/>'
    + '<circle r="82" fill="none" stroke="#3a3e46" stroke-width="4"/></g>'
    + booths + pew
    + '<g class="ms-cm-kneel' + (s.won ? ' on' : '') + '" transform="translate(540,300)">'
    + '<path d="M-46 40 h92 v10 h-92z M-36 40 v-22 h72 v22" fill="#2a1f18" stroke="#6b5c3a" stroke-width="2"/>'
    + (sh.holder ? '<g class="holder" transform="translate(0,-26)"><circle r="24" fill="#111014" stroke="#f1cd5f" stroke-width="3"/>'
      + '<image href="' + _esc(_url(sh.holder)) + '" x="-22" y="-22" width="44" height="44" clip-path="url(#ms-cm-h-' + e + ')"/></g>' : '')
    + '</g>';
}

function _cmStage(v, states, n) {
  const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
  const e = v.epNum;
  const defs = '<clipPath id="ms-cm-c-' + e + '"><circle r="26"/></clipPath>'
    + '<clipPath id="ms-cm-h-' + e + '"><circle r="22"/></clipPath>'
    + '<linearGradient id="ms-cm-light-' + e + '" x1="0" x2="1" y1="0" y2="1">'
    + '<stop offset="0" stop-color="rgba(184,38,58,.10)"/><stop offset=".5" stop-color="rgba(42,79,179,.08)"/>'
    + '<stop offset="1" stop-color="rgba(47,138,93,.08)"/></linearGradient>';
  return stageShell({ epNum: e, defs, scene: _cmScene(v, s),
    cap: [s.total + ' items named', (CM_CAP[s.capPhase] || CM_CAP.book)[1]],
    pot: v.potBefore + (s.done ? v.earned : 0),
    vars: '--ms-mono:\'Anonymous Pro\',monospace;--ms-accent:#f1e3b6;--ms-ink:#ece4d2',
    label: 'The church, staged' });
}

function _cmSettle(st, v, s) {
  st.phase(s.watch && s.watch.length ? 'watch' : 'rest');
  const panes = {};
  for (let ti = 0; ti < 2; ti++) {
    for (let k = 0; k < 6; k++) {
      const id = ti === 0 ? 5 - k : 6 + k;
      panes[id] = k < s.named[ti] ? 'lit ' + (ti ? 'bell' : 'candle') : k < s.named[ti] + s.lost[ti] ? 'crack' : '';
    }
  }
  st.qa('.ms-cm-pane').forEach(p => p.setAttribute('class', 'ms-cm-pane ' + (panes[p.getAttribute('data-cp')] || '')));
  st.qa('.ms-cm-mask').forEach(m => m.setAttribute('class', 'ms-cm-mask' + (s.found[Number(m.getAttribute('data-cm'))] ? ' found' : '')));
  st.qa('[data-booth]').forEach(b => { b.textContent = s.booth[Number(b.getAttribute('data-booth'))]; });
  const hub = st.q('.ms-cm-hub'); if (hub) hub.setAttribute('class', 'ms-cm-hub' + (s.won ? ' on' : ''));
  const kn = st.q('.ms-cm-kneel'); if (kn) kn.setAttribute('class', 'ms-cm-kneel' + (s.won ? ' on' : ''));
  st.cap(s.total + ' items named', (CM_CAP[s.capPhase] || CM_CAP.book)[1]);
  st.pot(v.potBefore + (s.done ? v.earned : 0), false);
  st.clearStamp();
}

function _cmPlay(st, v, prev, s) {
  _cmSettle(st, v, prev);
  const e = s.ev;
  if (!e) { _cmSettle(st, v, s); return; }
  const land = (fn, ms) => st.later(fn, ms);
  if (e.k === 'read' || e.k === 'named') {
    st.phase('hold');
    land(() => {
      _cmSettle(st, v, s);
      st.burst(12, 50, 28, 120, 'rgba(241,227,182,.9)');
    }, 1200);
  } else if (e.k === 'lostpage' || e.k === 'wrongmask' || e.k === 'touched') {
    st.phase('hold');
    land(() => {
      _cmSettle(st, v, s); st.phase('bad');
      st.stamp(e.k === 'touched' ? 'A HAND ON A MASK' : e.k === 'lostpage' ? 'THE WRONG PAGE' : 'THE WRONG FIGURE', 'bad');
    }, 1400);
  } else if (e.k === 'called') {
    st.phase('hold');
    land(() => {
      _cmSettle(st, v, s);
      st.stamp('CALLED FORWARD', 'cool');
      st.burst(14, 50, 82, 130, 'rgba(241,227,182,.8)');
    }, 1500);
  } else if (e.k === 'kneel') {
    st.phase('hold');
    land(() => {
      _cmSettle(st, v, s); st.phase('win');
      st.flash('50%', '26%'); st.burst(22, 50, 30, 170, 'rgba(241,205,95,.95)');
      st.stamp('THE KNEELING', 'gold');
      land(() => st.pot(v.potBefore + v.earned, true), 1300);
    }, 1800);
  } else if (e.k === 'snub') {
    _cmSettle(st, v, s); st.phase('watch');
    land(() => st.stamp('PASSED OVER', 'bad'), 900);
  } else if (e.k === 'scene') {
    _cmSettle(st, v, s); st.phase('watch');
  } else {
    _cmSettle(st, v, s);
  }
}

export const CHURCH = {
  id: 'church-match', prefix: 'cm', ownShield: true,
  shieldBeat: /kneel at the altar|Only one of you/,
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: () => '<h1 class="cm-title">Church <span>Match</span></h1>',
  sub: () => 'A double confessional, a book of riddles you cannot see the congregation from, and a pew full of masked strangers, each wearing the answer to one of them.',
  chips: v => [
    { text: v.teams.map(t => t.name).join(' v ') },
    { text: (v.tally.perTeam || 6) + ' riddles a team' },
    { text: 'Money for every item named' },
    v.tally.offered === false ? { text: 'No Shield today' } : { text: 'The best team kneels · one of them takes a Shield', shield: true },
  ],
  phaseNum: roman => '<span class="cm-phase-n">' + roman + '</span>',
  cardClass: c => {
    const tm = String(c.team || '').toLowerCase();
    const side = TEAM_CLS.includes(tm) ? tm + ' ' : '';
    if (c.relic) return 'relic';
    if (isCalled(c)) return 'win';
    return side + (c.isSocial ? 'social ' : '') + (c.tone === 'bad' ? 'bad' : c.tone === 'good' ? 'good' : 'plain');
  },
  cardTag: (c, ph) => {
    if (c.relic) return 'The Kneeling';
    if (isCalled(c)) return 'Called forward';
    if (c.isSocial) return c.behaviour === 'selfish' ? 'Passed over' : _cap(c.behaviour || 'moment');
    if (ph.id === 'book') return c.tone === 'bad' ? 'Lost the page' : 'Read clean';
    if (ph.id === 'pews') return c.tone === 'good' ? 'Named' : isTouch(c) ? 'Touched' : 'Wrong mask';
    return _cap(c.kind);
  },
  icon: (c, ph) => {
    let ic = 'candle';
    if (c.relic || c.behaviour === 'selfish') ic = 'kneel';
    else if (isCalled(c)) ic = 'candle';
    else if (c.behaviour === 'suspicious') ic = 'mask';
    else if (ph.id === 'book') ic = c.tone === 'bad' ? 'lost' : 'book';
    else if (ph.id === 'pews') ic = c.behaviour === 'cowardly' ? 'mask' : c.tone === 'good' ? 'found' : isTouch(c) ? 'hand' : 'mask';
    return '<span class="cm-ico"><svg viewBox="0 0 36 36" aria-hidden="true">' + ICONS[ic] + '</svg></span>';
  },

  stage: (v, states, n) => _cmStage(v, states, n),

  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const t = v.tally.teams || {};
    const names = v.teams.map(x => x.name);
    const sh = v.shield || {};
    const votes = v.tally.votes || {};
    const voters = sh.holder ? Object.keys(votes).filter(k => votes[k] === sh.holder) : [];
    const panes = _paneFor(s);
    let rose = '';
    for (let i = 0; i < 12; i++) rose += _pane(i);
    rose = rose.replace(/class="cm-pane" data-pane="(\d+)"/g, (m, i) => 'class="cm-pane ' + (panes[i] || '') + '" data-pane="' + i + '"');
    const booth = names.map((nm, i) => '<div class="cm-cell ' + TEAM_CLS[i] + '"><i class="grille"></i>'
      + ((t[nm] || {}).reader ? _face(t[nm].reader) : '')
      + '<small>' + _esc(nm) + ' · reader</small><b data-booth="' + i + '">' + _esc(s.booth[i]) + '</b></div>').join('');
    const pew = (v.tally.masks || []).map((mk, i) => '<div class="cm-mask' + (s.found[i] ? ' found' : '') + '" data-mask="' + i + '" title="' + _esc(s.found[i] ? mk.item : 'a masked figure') + '">'
      + '<svg viewBox="0 0 36 36"><path d="M4 14c4-4 10-4 14 0 4-4 10-4 14 0-1 8-6 11-9 9-2-1-3-3-5-3s-3 2-5 3c-3 2-8-1-9-9z" fill="#23252b"/><path class="item" d="M15 26l3 6 3-6z" fill="#3a3e46"/></svg></div>').join('');
    const rows = names.map((nm, i) => '<div class="cm-row"><span><i class="sw ' + TEAM_CLS[i] + '"></i>' + _esc(nm)
      + '</span><b data-row="' + i + '">' + _esc(s.rows[i]) + '</b></div>').join('');
    return '<div class="cm-panel"><h3>The Rose Window</h3>'
      + '<svg class="cm-rose" viewBox="-110 -110 220 220" role="img" aria-label="Rose window, twelve panes">'
      + '<circle r="104" fill="#0a0a0c"/>' + rose
      + '<circle class="cm-hub' + (s.won ? ' on' : '') + '" r="22" fill="#23252b" stroke="#0a0a0c" stroke-width="3"/>'
      + '<path d="M0 -14l10 4v6c0 7-5 11-10 13-5-2-10-6-10-13v-6z" fill="#0a0a0c" opacity=".7"/>'
      + '<circle r="104" fill="none" stroke="#3a3e46" stroke-width="4"/></svg>'
      + '<div class="cm-booth">' + booth + '</div>'
      + '<div class="cm-pew">' + pew + '</div><div class="cm-pewlbl">the congregation</div>'
      + '<div class="cm-teams">' + rows + '</div>'
      + (v.tally.offered === false ? '' : '<div class="cm-kneel' + (s.won ? ' on' : '') + '">'
        + '<div class="lbl">The Kneeling</div>'
        + (sh.holder ? '<div class="holder">' + _face(sh.holder) + '</div>' : '')
        + '<div class="val">' + _esc(s.kneelVal) + '</div>'
        + (voters.length ? '<div class="votes">' + voters.map(_face).join('') + '</div>' : '') + '</div>')
      + '<div class="cm-pot">'
      + '<div class="r"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="r"><span>Items named</span><b class="cm-pot-n">' + s.total + '</b></div>'
      + '<div class="r"><span>Earned today</span><b class="cm-pot-e">' + (s.done ? _gbp(v.earned) : '&mdash;') + '</b></div>'
      + '<div class="big">' + _gbp(v.potBefore + (s.done ? v.earned : 0)) + '</div></div></div>';
  },

  sideStates(v, total) {
    const pr = _prog(v);
    const evs = stageEvents(v, _cmKind);
    const t = v.tally.teams || {};
    const names = v.teams.map(x => x.name);
    const per = v.tally.perTeam || 6;
    const masks = v.tally.masks || [];
    const calledAt = _stepOf(v, isCalled);
    const kneelAt = _stepOf(v, c => c.relic);
    const sh = v.shield || {};
    const winner = v.tally.winner || '';
    const votes = v.tally.votes || {};
    const nVotes = sh.holder ? Object.values(votes).filter(x => x === sh.holder).length : 0;
    const out = [];
    for (let n = 0; n <= total; n++) {
      const c1 = _frac(n, pr[0].start, pr[0].end);
      const c2 = _frac(n, pr[1].start, pr[1].end);
      const done = n >= total;
      const read = names.map(nm => Math.round(((t[nm] || {}).read || 0) * c1));
      const unread = names.map(nm => Math.round((per - ((t[nm] || {}).read || 0)) * c1));
      const named = names.map(nm => Math.round(((t[nm] || {}).named || 0) * c2));
      const wrong = names.map(nm => Math.round((((t[nm] || {}).lost || 0) - (per - ((t[nm] || {}).read || 0))) * c2));
      const lost = names.map((nm, i) => unread[i] + wrong[i]);
      // Light each team's found masks in order, as many as it has named so far.
      const seen = {};
      const found = masks.map(mk => {
        if (!mk.found) return false;
        const i = names.indexOf(mk.team);
        seen[mk.team] = (seen[mk.team] || 0) + 1;
        return i >= 0 && seen[mk.team] <= named[i];
      });
      const called = calledAt >= 0 && n > calledAt;
      const won = kneelAt >= 0 && n > kneelAt;
      const ev = evs[n - 1] || null;
      out.push({
        // the stage's own reading of the same step
        ev, capPhase: ev ? ev.phase : 'book',
        watch: ev && (ev.k === 'scene' || ev.k === 'snub') ? ev.who : [],
        v: { epNum: v.epNum, potBefore: v.potBefore, earned: v.earned, tally: v.tally, shield: v.shield },
        named, lost, found, done, won,
        total: named[0] + (named[1] || 0),
        booth: names.map((nm, i) => (c1 <= 0 ? 'waiting' : read[i] + ' of ' + per + ' read')),
        rows: names.map((nm, i) => named[i] + ' named · ' + lost[i] + ' lost'),
        kneelVal: won && sh.holder ? sh.holder + ' · chosen by ' + nVotes + ' of ' + winner
          : called ? winner + ' has been called forward' : 'no team has been called forward',
      });
    }
    return out;
  },

  paintSide(prefix, states, n, mode) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const st = stageFor(s.v.epNum);
    if (st) {
      st.clear();
      if (mode === 'next' && n > 0 && !reducedMotion()) _cmPlay(st, s.v, states[n - 1], s);
      else _cmSettle(st, s.v, s);
    }
    const panel = document.querySelector('.cm-panel'); if (!panel) return;
    const panes = _paneFor(s);
    panel.querySelectorAll('.cm-pane').forEach(p => {
      p.setAttribute('class', 'cm-pane ' + (panes[p.getAttribute('data-pane')] || ''));
    });
    panel.querySelectorAll('.cm-crackline').forEach(k => {
      k.setAttribute('class', 'cm-crackline' + (panes[k.getAttribute('data-crack')] === 'crack' ? ' on' : ''));
    });
    const hub = panel.querySelector('.cm-hub'); if (hub) hub.setAttribute('class', 'cm-hub' + (s.won ? ' on' : ''));
    panel.querySelectorAll('[data-booth]').forEach(b => { b.textContent = s.booth[+b.getAttribute('data-booth')]; });
    panel.querySelectorAll('[data-row]').forEach(b => { b.textContent = s.rows[+b.getAttribute('data-row')]; });
    panel.querySelectorAll('.cm-mask').forEach(m => { m.classList.toggle('found', !!s.found[+m.getAttribute('data-mask')]); });
    const k = panel.querySelector('.cm-kneel');
    if (k) { k.classList.toggle('on', s.won); k.querySelector('.val').textContent = s.kneelVal; }
    const pn = panel.querySelector('.cm-pot-n'); if (pn) pn.textContent = s.total;
  },

  atmosphere: () => '<div class="cm-nave"></div>'
    + '<svg class="cm-arches" viewBox="0 0 1200 300" preserveAspectRatio="none"><g fill="none" stroke="#2c2f36" stroke-width="10">'
    + '<path d="M40 300 V120 Q140 0 240 120 V300"/><path d="M280 300 V120 Q380 0 480 120 V300"/>'
    + '<path d="M720 300 V120 Q820 0 920 120 V300"/><path d="M960 300 V120 Q1060 0 1160 120 V300"/></g></svg>'
    + '<div class="cm-motes"></div>',

  css: `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Anonymous+Pro:wght@400;700&display=swap');
.cm-root{--cm-parch:#ece4d2;--cm-ruby:#b8263a;--cm-ruby-hi:#ff5c72;--cm-cobalt:#2a4fb3;--cm-cobalt-hi:#6f96ff;--cm-emerald:#2f8a5d;--cm-wax:#f1e3b6;--cm-lead:#0a0a0c;--cm-shield:#f1cd5f;
  --cv-display:'Cinzel Decorative',serif;
  background:#141518;color:#9aa0a8;font-family:'Lora',Georgia,serif;font-size:18px;line-height:1.55;padding-bottom:120px;position:relative;overflow:hidden}
.cm-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.cm-nave{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(184,38,58,.10) 34%,transparent 42%),linear-gradient(105deg,transparent 48%,rgba(42,79,179,.10) 52%,transparent 60%),linear-gradient(95deg,transparent 64%,rgba(47,138,93,.08) 67%,transparent 74%),repeating-linear-gradient(0deg,rgba(255,255,255,.015) 0 1px,transparent 1px 44px),repeating-linear-gradient(90deg,rgba(255,255,255,.012) 0 1px,transparent 1px 88px),linear-gradient(180deg,#1b1d22,#0f1013)}
.cm-arches{position:absolute;left:0;right:0;top:0;width:100%;height:40vh;opacity:.6}
.cm-motes{position:absolute;inset:0;opacity:.5;background-image:radial-gradient(1.4px 1.4px at 20% 30%,var(--cm-wax),transparent),radial-gradient(1.2px 1.2px at 60% 50%,var(--cm-wax),transparent),radial-gradient(1.6px 1.6px at 80% 20%,var(--cm-wax),transparent);background-size:420px 420px;animation:cm-drift 30s linear infinite}
@keyframes cm-drift{from{background-position:0 0}to{background-position:60px 420px}}
.cm-shell{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:26px 16px 40px}
.cm-body{position:relative;z-index:2}
.cm-hero{position:relative;padding:40px 26px 26px;text-align:center;overflow:hidden;border-radius:50% 50% 6px 6px / 90px 90px 6px 6px;
  background:radial-gradient(60% 50% at 20% 10%,rgba(184,38,58,.28),transparent 70%),radial-gradient(60% 50% at 80% 10%,rgba(42,79,179,.28),transparent 70%),linear-gradient(180deg,#23252b,#121317);
  border:3px solid #2c2f36;box-shadow:inset 0 0 0 2px #000,0 20px 50px rgba(0,0,0,.6)}
.cm-kicker{font:13px/1 'Anonymous Pro',monospace;letter-spacing:.3em;text-transform:uppercase;color:var(--cm-wax)}
.cm-title{font-family:'Cinzel Decorative',serif;font-weight:700;color:var(--cm-parch);font-size:clamp(38px,7.6vw,82px);line-height:1.02;margin:.14em 0 .08em;text-shadow:0 0 24px rgba(241,227,182,.18)}
.cm-title span{color:var(--cm-wax)}
.cm-sub{color:#a7acb4;max-width:58ch;margin:0 auto;font-style:italic}
.cm-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}
.cm-chip{font:12px/1 'Anonymous Pro',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--cm-parch);border:1px solid #3a3e46;padding:6px 11px;background:rgba(0,0,0,.4)}
.cm-chip.shield{border-color:var(--cm-shield);color:var(--cm-shield)}
.cm-hero .mb-roster{justify-content:center;text-align:left}
.cm-hero .mb-rteam[data-side="0"] .mb-rname{color:var(--cm-ruby-hi)}
.cm-hero .mb-rteam[data-side="1"] .mb-rname{color:var(--cm-cobalt-hi)}
.cm-hero .mb-rname{font-family:'Anonymous Pro',monospace;letter-spacing:.2em;text-transform:uppercase}
.cm-av{width:34px;height:34px;border-radius:50%;object-fit:cover;object-position:50% 20%;background:#23252b;border:2px solid #3a3e46;box-shadow:0 2px 8px rgba(0,0,0,.6);display:inline-block;vertical-align:middle}
.cm-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px;margin-top:24px;align-items:start}
@media(max-width:940px){.cm-grid{grid-template-columns:minmax(0,1fr)}}
.cm-brief{background:linear-gradient(180deg,#e8dfca,#d9ceb4);color:#2a2419;border:1px solid #6b5c3a;padding:22px 22px 16px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.cm-brief h2{font-family:'Cinzel Decorative',serif;font-weight:700;font-size:28px;margin:0;color:#3a0f16}
.cm-brief .mb-host small,.cm-brief small{color:#6b5c3a}
.cm-staging{font-style:italic;color:#5a4e38;border-bottom:1px solid #b7a882;padding-bottom:12px;margin:8px 0 14px}
.cm-beat{margin:0 0 11px}
.cm-beat p{margin:0}
.cm-beat.do p{font:15px/1.5 'Anonymous Pro',monospace;color:#6b5c3a}
.cm-beat.say p{color:#231d13}
.cm-beat.say p::first-letter{font-family:'Cinzel Decorative',serif;font-weight:700;color:var(--cm-ruby);font-size:1.4em}
.cm-beat.shield p{color:#5c3f00;border-left:3px solid #b8901f;padding-left:10px}
.cm-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.cm-rule{font:11px/1 'Anonymous Pro',monospace;letter-spacing:.08em;text-transform:uppercase;color:#5a4e38;border:1px solid #b7a882;padding:5px 8px}
.cm-rule b{color:var(--cm-ruby);margin-right:4px}
.cm-phase{margin-top:28px}
.cm-phase-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:6px;border-bottom:1px solid #2c2f36}
.cm-phase-n{width:36px;height:44px;display:grid;place-items:center;font:700 15px/1 'Cinzel Decorative',serif;color:var(--cm-parch);background:linear-gradient(180deg,var(--cm-ruby),var(--cm-cobalt));clip-path:polygon(50% 0,100% 22%,100% 100%,0 100%,0 22%)}
.cm-phase-name{font-family:'Cinzel Decorative',serif;font-weight:700;font-size:30px;line-height:1;color:var(--cm-parch)}
.cm-phase-stats{margin-left:auto;display:flex;gap:6px}
.cm-stat{font:11px/1 'Anonymous Pro',monospace;font-style:normal;text-transform:uppercase;letter-spacing:.1em;color:#b3b8c0;background:#23252b;padding:5px 8px}
.cm-setting{font-style:italic;color:#8a9098;margin:8px 0 12px}
.cm-card{position:relative;margin:0 0 12px;padding:14px 16px 13px 66px;overflow:hidden;background:linear-gradient(180deg,#1f2126,#16171b);border:1px solid #2c2f36;opacity:0;transition:opacity .6s ease}
.cm-card::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 1.4s ease;background:linear-gradient(110deg,rgba(184,38,58,.18),rgba(42,79,179,.14) 50%,rgba(47,138,93,.10))}
.cm-card.on{opacity:1}
.cm-card.on::before{opacity:.35}
.cm-card.candle{border-left:4px solid var(--cm-ruby)}
.cm-card.bell{border-left:4px solid var(--cm-cobalt)}
.cm-card.bad{box-shadow:inset 0 0 0 1px rgba(208,80,80,.35)}
.cm-card.relic{border:1px solid var(--cm-shield);box-shadow:0 0 24px rgba(241,205,95,.18)}
.cm-card.win{border:1px solid var(--cm-wax);box-shadow:0 0 24px rgba(241,227,182,.12)}
.cm-ico{position:absolute;left:14px;top:14px;width:38px;height:38px}
.cm-ico svg{width:100%;height:100%;display:block}
.cm-tag{position:relative;float:right;font:11px/1 'Anonymous Pro',monospace;letter-spacing:.12em;text-transform:uppercase;color:#8a9098;margin:4px 0 0 10px}
.cm-card.good .cm-tag{color:#7fc49a}.cm-card.bad .cm-tag{color:#e07b7b}.cm-card.relic .cm-tag{color:var(--cm-shield)}.cm-card.win .cm-tag{color:var(--cm-wax)}
.cm-who{position:relative;font-weight:600;color:var(--cm-parch)}
.cm-card .mb-avs .cv-av{width:34px;height:34px;border:2px solid #3a3e46}
.cm-card.candle .cv-av{border-color:var(--cm-ruby)}.cm-card.bell .cv-av{border-color:var(--cm-cobalt)}.cm-card.relic .cv-av{border-color:var(--cm-shield)}
.cm-txt{position:relative;margin-top:6px}
.cm-conf{position:relative;margin-top:10px;padding:9px 12px;background:rgba(0,0,0,.35);border-left:2px solid var(--cm-emerald);font-style:italic;color:#dcdfe3}
.cm-conf small{display:block;font:11px/1.4 'Anonymous Pro',monospace;font-style:normal;letter-spacing:.12em;text-transform:uppercase;color:#7fc49a}
.cm-fx{position:relative;display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.cm-fx span{font:11px/1 'Anonymous Pro',monospace;color:#b3b8c0;border:1px solid #3a3e46;padding:4px 7px}
.cm-summary{margin-top:24px;padding:18px 20px;border:1px solid #6b5c3a;background:linear-gradient(180deg,#e8dfca,#d9ceb4);color:#2a2419;transition:opacity .4s}
.cm-summary small{display:block;font:11px/1.4 'Anonymous Pro',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--cm-ruby);margin-bottom:4px}
.cm-side{position:sticky;top:60px}
.cm-panel{background:rgba(12,12,15,.96);border:1px solid #2c2f36;padding:14px}
.cm-panel h3{font:700 24px/1 'Cinzel Decorative',serif;color:var(--cm-parch);margin:0 0 10px;text-align:center}
.cm-rose{display:block;width:100%;max-width:260px;margin:0 auto}
.cm-pane{fill:#1a1c22;stroke:var(--cm-lead);stroke-width:2;transition:fill .7s ease,filter .7s ease}
.cm-pane.lit.candle{fill:var(--cm-ruby);filter:drop-shadow(0 0 5px rgba(255,92,114,.8))}
.cm-pane.lit.bell{fill:var(--cm-cobalt);filter:drop-shadow(0 0 5px rgba(111,150,255,.8))}
.cm-pane.crack{fill:#2a1c1c}
.cm-crackline{opacity:0;transition:opacity .5s}
.cm-crackline.on{opacity:1}
.cm-hub{transition:fill .7s}
.cm-hub.on{fill:var(--cm-shield)}
.cm-booth{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
.cm-cell{position:relative;padding:8px 6px 6px;text-align:center;background:linear-gradient(180deg,#2a1f18,#16100c);border:1px solid #4a3828;border-radius:40px 40px 2px 2px}
.cm-cell .grille{position:absolute;left:18%;right:18%;top:10px;height:50px;border-radius:24px 24px 2px 2px;background:repeating-linear-gradient(90deg,rgba(0,0,0,.45) 0 2px,transparent 2px 7px),repeating-linear-gradient(0deg,rgba(0,0,0,.45) 0 2px,transparent 2px 7px);pointer-events:none}
.cm-cell .cm-av{width:40px;height:40px;margin-top:6px}
.cm-cell small{display:block;font:11px/1.3 'Anonymous Pro',monospace;letter-spacing:.1em;text-transform:uppercase;margin-top:4px}
.cm-cell.candle small{color:var(--cm-ruby-hi)}.cm-cell.bell small{color:var(--cm-cobalt-hi)}
.cm-cell b{display:block;font:700 15px/1.2 'Anonymous Pro',monospace;color:var(--cm-parch)}
.cm-pew{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin:6px 0 4px}
.cm-mask{position:relative;aspect-ratio:1;border-radius:50%;background:#0c0c0f;border:1px solid #2c2f36;display:grid;place-items:center;transition:all .5s}
.cm-mask svg{width:80%;height:80%}
.cm-mask.found{border-color:var(--cm-wax);box-shadow:0 0 8px rgba(241,227,182,.5)}
.cm-mask.found svg path.item{fill:var(--cm-wax)}
.cm-pewlbl{text-align:center;font:10.5px/1 'Anonymous Pro',monospace;letter-spacing:.14em;text-transform:uppercase;color:#646a73;margin-bottom:10px}
.cm-teams{border-top:1px solid #2c2f36;padding-top:6px}
.cm-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;color:var(--cm-parch)}
.cm-row b{font:14px/1 'Anonymous Pro',monospace;color:var(--cm-parch);font-weight:400}
.cm-row .sw{display:inline-block;width:9px;height:9px;margin-right:7px}
.cm-row .sw.candle{background:var(--cm-ruby)}.cm-row .sw.bell{background:var(--cm-cobalt)}
.cm-kneel{margin-top:12px;padding:11px 12px;border:1px dashed #6b5b2a;text-align:center;transition:all .5s}
.cm-kneel .lbl{font:11px/1 'Anonymous Pro',monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a7a4a}
.cm-kneel .val{margin-top:6px;font-style:italic;color:#8a9098}
.cm-kneel .holder{display:none;margin:8px auto 0}
.cm-kneel .holder .cm-av{width:44px;height:44px;border-color:var(--cm-shield);box-shadow:0 0 14px rgba(241,205,95,.45)}
.cm-kneel .votes{display:none;justify-content:center;gap:4px;margin-top:6px}
.cm-kneel .votes .cm-av{width:24px;height:24px;border-width:1.5px}
.cm-kneel.on{border:1px solid var(--cm-shield)}
.cm-kneel.on .holder{display:block}
.cm-kneel.on .votes{display:flex}
.cm-kneel.on .lbl,.cm-kneel.on .val{color:var(--cm-shield);font-style:normal}
.cm-pot{margin-top:12px;border-top:1px solid #2c2f36;padding-top:10px}
.cm-pot .r{display:flex;justify-content:space-between;font-size:15px;color:#8a9098}
.cm-pot .r b{font:14px/1.6 'Anonymous Pro',monospace;color:var(--cm-parch);font-weight:400}
.cm-pot .big{font:30px/1.1 'Anonymous Pro',monospace;color:var(--cm-wax);text-align:right;margin-top:4px}
.cm-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 16px;background:linear-gradient(0deg,#08080a 60%,rgba(8,8,10,0))}
.cm-btn{font:700 15px/1 'Cinzel Decorative',serif;letter-spacing:.08em;cursor:pointer;padding:12px 26px;color:#1a0d10;background:linear-gradient(180deg,#f6ebc6,var(--cm-wax));border:1px solid #8a7a4a}
.cm-btn[disabled]{opacity:.4;cursor:default}
.cm-btn.ghost{background:transparent;color:var(--cm-parch);border:1px solid #3a3e46}
.cm-counter{font:13px/1 'Anonymous Pro',monospace;color:#646a73;letter-spacing:.08em}

/* ── THE STAGE: the nave ─────────────────────────────────────────────── */
.ms-cm-pane{fill:#1a1c22;stroke:#0a0a0c;stroke-width:2;transition:fill .8s,filter .8s}
.ms-cm-pane.lit.candle{fill:#b8263a;filter:drop-shadow(0 0 7px rgba(255,92,114,.85))}
.ms-cm-pane.lit.bell{fill:#2a4fb3;filter:drop-shadow(0 0 7px rgba(111,150,255,.85))}
.ms-cm-pane.crack{fill:#2a1c1c}
.ms-cm-hub{transition:fill .8s,filter .8s}
.ms-cm-hub.on{fill:#f1cd5f;filter:drop-shadow(0 0 16px rgba(241,205,95,.8))}
.ms-cm-booth .lbl{font:11px 'Anonymous Pro',monospace;letter-spacing:.2em;fill:#8a9098}
.ms-cm-booth .cnt{font:13px 'Anonymous Pro',monospace;fill:#ece4d2}
.ms-cm-booth.candle .lbl{fill:#ff5c72}.ms-cm-booth.bell .lbl{fill:#6f96ff}
.ms-cm-mask .face{fill:#0c0c0f;stroke:#2c2f36;stroke-width:2;transition:stroke .6s,filter .6s}
.ms-cm-mask .eye{fill:#3a3e46;transition:fill .6s}
.ms-cm-mask .item{fill:#3a3e46;transition:fill .6s,filter .6s}
.ms-cm-mask.found .face{stroke:#f1e3b6;filter:drop-shadow(0 0 8px rgba(241,227,182,.6))}
.ms-cm-mask.found .eye{fill:#ece4d2}
.ms-cm-mask.found .item{fill:#f1e3b6;filter:drop-shadow(0 0 6px rgba(241,227,182,.9))}
.ms-cm-kneel .holder{opacity:0;transform:translateY(16px);transition:opacity .7s,transform .9s cubic-bezier(.2,1.4,.4,1)}
.ms-cm-kneel.on .holder{opacity:1;transform:translateY(-26px)}
.ms[data-phase=watch] .ms-cm-mask,.ms[data-phase=watch] .ms-cm-booth{filter:brightness(.4)}
.ms[data-phase=bad] .ms-vig{box-shadow:inset 0 0 160px 60px rgba(60,8,16,.85)}
@media(prefers-reduced-motion:reduce){.cm-root *,.cm-root *::before,.cm-root *::after{animation:none !important;transition:none !important}.cm-card{opacity:1}}
` + STAGE_CSS,
};

export default CHURCH;
