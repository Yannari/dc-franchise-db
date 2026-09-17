// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-theme-traitors-chess.js — marble and candlelight
// ══════════════════════════════════════════════════════════════════════
//
// The Traitors' Chess THEME for js/vp-tr/mission-bespoke.js, reproducing the
// approved mockup (mockup/mockup-tr-traitors-chess.html): the board seen from
// above with a face on every square, the hooded statue, five pieces, a
// five-question tracker and the Gambit box.
//
// THE SIDEBAR KNOWS ONLY WHAT HAS BEEN SHOWN. A piece lands when the card that
// argues its question is revealed, and falls (gold) or leaves the statue on the
// true square (red) on the card that shows the statue moving.
import { players } from '../core.js';
import { playerAvatarUrl } from '../players.js';
import { STAGE_CSS, stageShell, stageFor, reducedMotion, stageEvents } from './mission-stage.js';

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
const _gbp = n => '£' + Number(n || 0).toLocaleString('en-GB');
const _url = name => playerAvatarUrl((players || []).find(p => p && p.name === name) || { name });
const _face = name => '<img class="tc-av" src="' + _esc(_url(name)) + '" alt="' + _esc(name) + '" title="'
  + _esc(name) + '" onerror="this.style.visibility=&quot;hidden&quot;">';

const PIECES = {
  wolf: '<path d="M8 32h20l-2-6H10z M10 26c0-6 2-10 4-12l-3-8 6 5 3-6 2 7 5-2-3 7c2 2 3 6 3 9z" fill="#5f8a78" stroke="#efe9dc" stroke-width="1"/><circle cx="16" cy="17" r="1.2" fill="#efe9dc"/>',
  fox: '<path d="M8 32h20l-2-6H10z M11 26c0-5 1-9 3-12L10 5l7 6h2l7-6-4 9c2 3 3 7 3 12z" fill="#b8733c" stroke="#efe9dc" stroke-width="1"/><path d="M15 20l3 3 3-3" stroke="#efe9dc" fill="none"/>',
  owl: '<path d="M8 32h20l-2-6H10z M11 26c-1-8 1-16 7-18 6 2 8 10 7 18z" fill="#7d7a70" stroke="#efe9dc" stroke-width="1"/><circle cx="15" cy="15" r="2.6" fill="#efe9dc"/><circle cx="21" cy="15" r="2.6" fill="#efe9dc"/><circle cx="15" cy="15" r="1" fill="#0b0b0d"/><circle cx="21" cy="15" r="1" fill="#0b0b0d"/>',
  lamb: '<path d="M8 32h20l-2-6H10z M10 26c-2-4 0-8 3-9-1-4 3-7 6-5 3-2 7 1 6 5 3 1 5 5 3 9z" fill="#efe9dc" stroke="#7d7a70" stroke-width="1"/><circle cx="16" cy="18" r="1" fill="#0b0b0d"/><circle cx="20" cy="18" r="1" fill="#0b0b0d"/>',
  crown: '<path d="M8 32h20l-2-6H10z M10 26l-2-14 6 6 4-10 4 10 6-6-2 14z" fill="#d8b25a" stroke="#efe9dc" stroke-width="1"/><circle cx="18" cy="8" r="1.8" fill="#efe9dc"/>',
};
const ICONS = {
  debate: '<path d="M4 8h18v12H12l-6 5v-5H4z" fill="#8a7fb0"/><path d="M14 16h18v12h-2v5l-6-5H14z" fill="#efe9dc" opacity=".85"/>',
  right: '<circle cx="18" cy="18" r="15" fill="none" stroke="#d8b25a" stroke-width="2"/><path d="M10 18l6 6 10-12" fill="none" stroke="#d8b25a" stroke-width="3"/>',
  wrong: '<circle cx="18" cy="18" r="15" fill="none" stroke="#c0443a" stroke-width="2"/><path d="M12 12l12 12M24 12L12 24" stroke="#c0443a" stroke-width="3"/>',
  gambit: '<path d="M18 3l12 4v9c0 8-5 14-12 17C11 30 6 24 6 16V7z" fill="#f0cf62" stroke="#7b6224" stroke-width="1.2"/><path d="M12 22h12l-1-3H13z M14 19c0-4 1-6 2-7l-1-4 3 2 3-2-1 4c1 1 2 3 2 7z" fill="#7b6224"/>',
  eye: '<path d="M2 18c6-9 26-9 32 0-6 9-26 9-32 0z" fill="none" stroke="#8a7fb0" stroke-width="2"/><circle cx="18" cy="18" r="5" fill="#8a7fb0"/>',
};

/** Stream steps: where each question's piece lands and where the statue answers. */
function _steps(v) {
  const qs = v.tally.questions || [];
  const cards = [];
  for (const p of v.phases) for (const c of p.cards) cards.push(c);
  return qs.map(q => {
    let placed = -1, revealed = -1;
    cards.forEach((c, i) => {
      if (placed < 0 && (c.text || '').startsWith('“' + q.ask + '”')) placed = i;
    });
    if (placed >= 0) {
      if (q.gambit) revealed = placed;
      else {
        for (let i = placed + 1; i < cards.length; i++) {
          const t = cards[i].text || '';
          // The statue's card follows its question's card; the reveal line
          // does not always name the piece.
          if (/statue/i.test(t) && !t.startsWith('“')) { revealed = i; break; }
        }
      }
    }
    return { ...q, placed, revealed };
  });
}


// ══════════════════════════════════════════════════════════════════════
// THE STAGE — the board, played (js/vp-tr/mission-stage.js)
// ══════════════════════════════════════════════════════════════════════
//
// A marble hall seen from above: the board with a face on every square, the
// hooded statue at its head, and five pieces waiting at the side. A piece
// walks to the square the room argued for; when the statue answers, the piece
// falls gold if the room was right, and the true square lights red if it was
// not. The Gambit's square is the one somebody stood on alone.
function _tcKind(c, ph) {
  if (c.relic) return 'gambit';
  if (c.kind === 'right') return 'right';
  if (c.kind === 'wrong') return 'wrong';
  if ((c.text || '').startsWith('“')) return 'ask';
  if (c.isSocial) return 'scene';
  return 'argue';
}
const TC_CAP = { owl: ['Part one', 'The Owl'], pack: ['Part two', 'The Pack'],
  crown: ['Part three', 'The Crown'] };

function _tcLayout(v) {
  const board = v.tally.board || [];
  // Wide rather than deep: the stage is 360 tall and the board must fit in it.
  const cols = Math.max(4, Math.min(9, Math.ceil(board.length / 3)));
  const rows = Math.ceil(board.length / cols);
  const size = Math.max(40, Math.min(70, Math.min(700 / cols, 250 / rows)));
  const w = cols * size, h = rows * size;
  const x0 = 540 - w / 2, y0 = 196 - h / 2;
  return { board, cols, size, rows,
    at: board.map((nm, i) => ({ n: nm, x: x0 + (i % cols) * size, y: y0 + Math.floor(i / cols) * size })) };
}

function _tcScene(v, s) {
  const e = v.epNum;
  const L = s.L;
  const qs = v.tally.questions || [];
  const squares = L.at.map((q, i) => {
    const shade = ((Math.floor(i / L.cols) + i) % 2) ? 'dark' : 'light';
    const cls = [s.truth.includes(q.n) ? 'truth' : '', s.gambitSq === q.n ? 'gambit' : ''].join(' ');
    return '<g class="ms-tc-sq ' + shade + ' ' + cls + '" data-sq="' + _esc(q.n) + '" transform="translate(' + q.x.toFixed(0) + ',' + q.y.toFixed(0) + ')">'
      + '<rect width="' + L.size + '" height="' + L.size + '"/>'
      + '<image href="' + _esc(_url(q.n)) + '" x="' + (L.size / 2 - 20) + '" y="' + (L.size / 2 - 24) + '" width="40" height="40" clip-path="url(#ms-tc-c-' + e + ')"/>'
      + '<text x="' + (L.size / 2) + '" y="' + (L.size - 7) + '" text-anchor="middle">' + _esc(q.n) + '</text></g>';
  }).join('');
  const pieces = qs.map((q, i) => {
    const st = s.piece[q.piece];
    const on = st && st.on;
    const sq = on ? L.at.find(a => a.n === on) : null;
    const x = sq ? sq.x + L.size / 2 : 92;
    const y = sq ? sq.y + 8 : 120 + i * 48;
    return '<g class="ms-tc-piece' + (st ? ' on' : '') + (st && st.fell ? ' fell' : '') + '" data-pc="' + q.piece
      + '" transform="translate(' + x.toFixed(0) + ',' + y.toFixed(0) + ') scale(1.2)">'
      + '<g transform="translate(-18,-18)">' + (PIECES[q.piece] || '') + '</g></g>';
  }).join('');
  return '<rect width="1080" height="360" fill="url(#ms-tc-hall-' + e + ')"/>'
    + '<g opacity=".12" fill="#efe9dc"><rect x="0" y="0" width="1080" height="360" fill="url(#ms-tc-floor-' + e + ')"/></g>'
    + '<g class="ms-tc-statue" transform="translate(540,14) scale(1.05)">'
    + '<path d="M0 4c14 0 22 11 22 25v11l11 52H-33l11-52V29C-22 15-14 4 0 4z" fill="#2f4a40" stroke="#5f8a78" stroke-width="2"/>'
    + '<path d="M0 12c10 0 15 8 15 18v8h-30v-8c0-10 5-18 15-18z" fill="#0b0b0d"/>'
    + '<circle class="eye" cx="-6" cy="30" r="2" fill="#c0443a"/><circle class="eye" cx="6" cy="30" r="2" fill="#c0443a"/></g>'
    + '<rect x="' + (540 - (L.cols * L.size) / 2 - 6) + '" y="' + (196 - (L.rows * L.size) / 2 - 6) + '" width="' + (L.cols * L.size + 12)
    + '" height="' + (L.rows * L.size + 12) + '" fill="none" stroke="#7b6224" stroke-width="6"/>'
    + squares + pieces
    + '<g class="ms-tc-candles"><circle cx="72" cy="310" r="8" fill="#ffd66b"/><circle cx="1008" cy="310" r="8" fill="#ffd66b"/></g>';
}

function _tcStage(v, states, n) {
  const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
  const e = v.epNum;
  const defs = '<clipPath id="ms-tc-c-' + e + '"><circle cx="20" cy="20" r="20"/></clipPath>'
    + '<linearGradient id="ms-tc-hall-' + e + '" x1="0" x2="0" y1="0" y2="1">'
    + '<stop offset="0" stop-color="#141418"/><stop offset="1" stop-color="#0b0b0d"/></linearGradient>'
    + '<pattern id="ms-tc-floor-' + e + '" width="120" height="120" patternUnits="userSpaceOnUse">'
    + '<rect width="60" height="60" fill="#efe9dc" opacity=".5"/><rect x="60" y="60" width="60" height="60" fill="#efe9dc" opacity=".5"/></pattern>';
  return stageShell({ epNum: e, defs, scene: _tcScene(v, s),
    cap: [s.right + ' of 5 right', (TC_CAP[s.capPhase] || TC_CAP.owl)[1]],
    pot: v.potBefore + (s.done ? v.earned : 0),
    vars: '--ms-mono:\'Sometype Mono\',monospace;--ms-accent:#d8b25a;--ms-ink:#efe9dc',
    label: 'The board, staged' });
}

function _tcSettle(st, v, s) {
  st.phase(s.watch && s.watch.length ? 'watch' : 'rest');
  const L = s.L;
  st.qa('.ms-tc-sq').forEach(g => {
    const nm = g.getAttribute('data-sq');
    const i = L.board.indexOf(nm);
    const shade = ((Math.floor(i / L.cols) + i) % 2) ? 'dark' : 'light';
    g.setAttribute('class', 'ms-tc-sq ' + shade + ' ' + (s.truth.includes(nm) ? 'truth ' : '') + (s.gambitSq === nm ? 'gambit' : ''));
  });
  st.qa('.ms-tc-piece').forEach((g, i) => {
    const pc = g.getAttribute('data-pc');
    const stp = s.piece[pc];
    const sq = stp && stp.on ? L.at.find(a => a.n === stp.on) : null;
    const x = sq ? sq.x + L.size / 2 : 92;
    const y = sq ? sq.y + 8 : 120 + i * 48;
    g.setAttribute('class', 'ms-tc-piece' + (stp ? ' on' : '') + (stp && stp.fell ? ' fell' : ''));
    g.setAttribute('transform', 'translate(' + x.toFixed(0) + ',' + y.toFixed(0) + ') scale(1.2)');
  });
  st.cap(s.right + ' of 5 right', (TC_CAP[s.capPhase] || TC_CAP.owl)[1]);
  st.pot(v.potBefore + (s.done ? v.earned : 0), false);
  st.clearStamp();
}

function _tcPlay(st, v, prev, s) {
  _tcSettle(st, v, prev);
  const e = s.ev;
  if (!e) { _tcSettle(st, v, s); return; }
  const land = (fn, ms) => st.later(fn, ms);
  if (e.k === 'ask' || e.k === 'argue') {
    st.phase('ask');
    land(() => { _tcSettle(st, v, s); st.phase('rest'); }, 1300);
  } else if (e.k === 'right') {
    st.phase('hold');
    land(() => {
      _tcSettle(st, v, s); st.phase('win');
      st.flash('50%', '52%'); st.burst(18, 50, 52, 150, 'rgba(216,178,90,.95)');
      st.stamp('RIGHT', 'gold');
    }, 1700);
  } else if (e.k === 'wrong') {
    st.phase('hold');
    land(() => {
      _tcSettle(st, v, s); st.phase('bad');
      st.stamp('THE STATUE MOVED', 'bad');
    }, 1700);
  } else if (e.k === 'gambit') {
    st.phase('hold');
    land(() => {
      _tcSettle(st, v, s);
      if (s.won) { st.phase('win'); st.flash('50%', '52%'); st.burst(20, 50, 52, 160, 'rgba(240,207,98,.95)'); st.stamp('THE GAMBIT · A SHIELD', 'gold'); }
      else { st.phase('bad'); st.stamp('THE GAMBIT · ALONE AND WRONG', 'bad'); }
    }, 1800);
  } else if (e.k === 'scene') {
    _tcSettle(st, v, s); st.phase('watch');
  } else {
    _tcSettle(st, v, s);
  }
}

export const CHESS = {
  id: 'traitors-chess', prefix: 'tc', ownShield: true,
  shieldBeat: /Once, and only once|Shield is yours/,
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: () => '<h1 class="tc-title">The Traitors\' <span>Chess</span></h1>',
  sub: () => 'Last night the Traitors answered five questions about every one of you. Today you guess what they said, on a board with your names on it.',
  chips: v => [
    { text: 'One room · ' + (v.tally.board || []).length + ' players' },
    { text: 'Five questions' },
    { text: 'Money for every right answer' },
    v.tally.offered === false ? { text: 'No Shield today' } : { text: 'The Gambit · a Shield for one answer alone', shield: true },
  ],
  phaseNum: roman => '<span class="tc-phase-n"><b>' + roman + '</b></span>',
  cardClass: c => (c.relic ? 'relic'
    : c.kind === 'right' ? 'right' : c.kind === 'wrong' ? 'wrongq'
      : (c.isSocial ? 'social ' : '') + (c.tone === 'bad' ? 'bad' : c.tone === 'good' ? 'good' : 'plain')),
  cardTag: c => (c.relic ? 'The Gambit'
    : c.kind === 'right' ? 'Right' : c.kind === 'wrong' ? 'Wrong'
      : c.kind === 'strong' ? 'Made the case' : c.kind === 'weak' ? 'Talked round'
        : c.isSocial ? _cap(c.behaviour || 'moment') : _cap(c.kind)),
  icon: c => {
    const ic = c.relic ? 'gambit' : c.kind === 'right' ? 'right' : c.kind === 'wrong' ? 'wrong'
      : c.behaviour === 'suspicious' ? 'eye' : 'debate';
    return '<span class="tc-ico"><svg viewBox="0 0 36 36" aria-hidden="true">' + ICONS[ic] + '</svg></span>';
  },

  stage: (v, states, n) => _tcStage(v, states, n),

  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const board = v.tally.board || [];
    const qs = v.tally.questions || [];
    const sh = v.shield || {};
    const squares = board.map((name, i) => {
      const cls = [s.truth.includes(name) ? 'truth' : '', s.gambitSq === name ? 'gambit' : ''].join(' ');
      const pieces = qs.map(q => {
        const st = s.piece[q.piece];
        const on = st && st.on === name;
        return '<svg class="piece' + (on ? ' on' : '') + (on && st.fell ? ' fell' : '') + '" viewBox="0 0 36 36" data-piece="' + q.piece
          + '" data-sq="' + _esc(name) + '">' + PIECES[q.piece] + '</svg>';
      }).join('');
      const shade = ((Math.floor(i / 4) + i) % 2) ? 'dark' : 'light';
      return '<div class="tc-sq ' + shade + ' ' + cls + '" data-name="' + _esc(name) + '">' + _face(name)
        + '<small>' + _esc(name) + '</small>' + pieces + '</div>';
    }).join('');
    const track = qs.map(q => '<div class="tc-slot ' + (s.slot[q.piece] || '') + '" data-slot="' + q.piece + '">'
      + '<svg viewBox="0 0 36 36">' + PIECES[q.piece] + '</svg><small>' + _esc(q.label) + '</small></div>').join('');
    return '<div class="tc-panel"><h3>The Board</h3>'
      + '<svg class="tc-statue" viewBox="0 0 70 74" aria-hidden="true">'
      + '<path d="M35 4c10 0 16 8 16 18v8l8 38H11l8-38v-8C19 12 25 4 35 4z" fill="#2f4a40" stroke="#5f8a78" stroke-width="1.5"/>'
      + '<path d="M35 10c7 0 11 6 11 13v6H24v-6c0-7 4-13 11-13z" fill="#0b0b0d"/>'
      + '<circle cx="31" cy="22" r="1.4" fill="#c0443a"/><circle cx="39" cy="22" r="1.4" fill="#c0443a"/>'
      + '<path d="M11 68h48v4H11z" fill="#7b6224"/></svg>'
      + '<div class="tc-board">' + squares + '</div>'
      + '<div class="tc-track">' + track + '</div>'
      + (v.tally.offered === false ? '' : '<div class="tc-gambit' + (s.won ? ' on' : '') + '">'
        + '<div class="lbl">The Gambit</div>'
        + (sh.holder ? '<div class="holder">' + _face(sh.holder) + '</div>' : '')
        + '<div class="val">' + _esc(s.gambitVal) + '</div></div>')
      + '<div class="tc-pot">'
      + '<div class="r"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="r"><span>Right answers</span><b class="tc-right">' + s.right + ' of 5</b></div>'
      + '<div class="r"><span>Earned today</span><b>' + (s.done ? _gbp(v.earned) : '&mdash;') + '</b></div>'
      + '<div class="big">' + _gbp(v.potBefore + (s.done ? v.earned : 0)) + '</div></div></div>';
  },

  sideStates(v, total) {
    const evs = stageEvents(v, _tcKind);
    const L = _tcLayout(v);
    const steps = _steps(v);
    const sh = v.shield || {};
    const out = [];
    for (let n = 0; n <= total; n++) {
      const piece = {};
      const slot = {};
      const truth = [];
      let right = 0;
      let gambitSq = null;
      for (const q of steps) {
        if (q.placed >= 0 && n > q.placed) {
          piece[q.piece] = { on: q.guess, fell: false };
          if (q.gambit) gambitSq = q.guess;
        }
        if (q.revealed >= 0 && n > q.revealed) {
          if (q.right) { right++; piece[q.piece] = { on: q.guess, fell: true }; slot[q.piece] = 'right'; }
          else { truth.push(q.truth); slot[q.piece] = 'wrong'; }
        }
      }
      const g = steps.find(q => q.gambit);
      const seen = g && g.placed >= 0 && n > g.placed;
      const ev = evs[n - 1] || null;
      out.push({
        // the stage's own reading of the same step
        L, ev, capPhase: ev ? ev.phase : 'owl',
        watch: ev && ev.k === 'scene' ? ev.who : [],
        v: { epNum: v.epNum, potBefore: v.potBefore, earned: v.earned, tally: v.tally, shield: v.shield },
        piece, slot, truth, right, gambitSq, done: n >= total,
        won: !!(seen && sh.found),
        gambitVal: !g ? 'nobody stepped onto the board'
          : !seen ? 'nobody has stepped onto the board'
            : sh.found ? sh.holder + ' · answered alone, and won' : g.by + ' · answered alone, and lost the money' });
    }
    return out;
  },

  paintSide(prefix, states, n, mode) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const st = stageFor(s.v.epNum);
    if (st) {
      st.clear();
      if (mode === 'next' && n > 0 && !reducedMotion()) _tcPlay(st, s.v, states[n - 1], s);
      else _tcSettle(st, s.v, s);
    }
    const panel = document.querySelector('.tc-panel'); if (!panel) return;
    panel.querySelectorAll('.tc-sq').forEach(sq => {
      const name = sq.getAttribute('data-name');
      sq.classList.toggle('truth', s.truth.includes(name));
      sq.classList.toggle('gambit', s.gambitSq === name);
    });
    panel.querySelectorAll('.piece').forEach(p => {
      const st = s.piece[p.getAttribute('data-piece')];
      const on = !!st && st.on === p.getAttribute('data-sq');
      p.setAttribute('class', 'piece' + (on ? ' on' : '') + (on && st.fell ? ' fell' : ''));
    });
    panel.querySelectorAll('.tc-slot').forEach(sl => { sl.className = 'tc-slot ' + (s.slot[sl.getAttribute('data-slot')] || ''); });
    const g = panel.querySelector('.tc-gambit');
    if (g) { g.classList.toggle('on', s.won); g.querySelector('.val').textContent = s.gambitVal; }
    const r = panel.querySelector('.tc-right'); if (r) r.textContent = s.right + ' of 5';
  },

  atmosphere: () => '<div class="tc-hall"></div><div class="tc-floor"></div><div class="tc-candles"></div>',

  css: `
@import url('https://fonts.googleapis.com/css2?family=Marcellus&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Sometype+Mono:wght@400;600&display=swap');
.tc-root{--tc-ivory:#efe9dc;--tc-bronze:#5f8a78;--tc-gilt:#d8b25a;--tc-gilt-lo:#7b6224;--tc-wrong:#c0443a;--tc-mist:#a7a39a;--tc-shield:#f0cf62;
  --cv-display:'Marcellus',serif;
  background:#0b0b0d;color:var(--tc-mist);font-family:'EB Garamond',Georgia,serif;font-size:19px;line-height:1.5;padding-bottom:120px;position:relative;overflow:hidden}
.tc-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.tc-hall{position:absolute;inset:0;background:radial-gradient(50% 40% at 50% 0%,rgba(216,178,90,.12),transparent 70%),linear-gradient(180deg,#141418,#0b0b0d 60%)}
.tc-floor{position:absolute;left:-20%;right:-20%;bottom:-10%;height:55%;opacity:.14;background:conic-gradient(var(--tc-ivory) 25%,transparent 0 50%,var(--tc-ivory) 0 75%,transparent 0) 0 0/120px 120px;transform:perspective(420px) rotateX(62deg);transform-origin:bottom}
.tc-candles{position:absolute;inset:0;background:radial-gradient(6px 10px at 8% 30%,rgba(255,214,120,.9),transparent),radial-gradient(40px 60px at 8% 30%,rgba(255,190,90,.12),transparent),radial-gradient(6px 10px at 92% 34%,rgba(255,214,120,.9),transparent),radial-gradient(40px 60px at 92% 34%,rgba(255,190,90,.12),transparent);animation:tc-flicker 3s ease-in-out infinite}
@keyframes tc-flicker{0%,100%{opacity:.85}45%{opacity:1}60%{opacity:.7}}
.tc-shell{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:26px 16px 40px}
.tc-body{position:relative;z-index:2}
.tc-hero{position:relative;padding:32px 26px 24px;text-align:center;overflow:hidden;border:1px solid var(--tc-gilt-lo);
  background:linear-gradient(115deg,transparent 40%,rgba(207,200,184,.08) 42%,transparent 46%),linear-gradient(65deg,transparent 60%,rgba(207,200,184,.06) 61%,transparent 64%),linear-gradient(180deg,#1f1f24,#0f0f12);
  box-shadow:inset 0 0 0 6px #0b0b0d,inset 0 0 0 7px var(--tc-gilt-lo),0 20px 50px rgba(0,0,0,.6)}
.tc-kicker{font:12px/1 'Sometype Mono',monospace;letter-spacing:.32em;text-transform:uppercase;color:var(--tc-bronze)}
.tc-title{font-family:'Marcellus',serif;font-weight:400;color:var(--tc-ivory);font-size:clamp(40px,8vw,86px);line-height:1;margin:.14em 0 .1em;letter-spacing:.02em}
.tc-title span{color:var(--tc-gilt)}
.tc-sub{color:#9c978d;max-width:58ch;margin:0 auto;font-style:italic}
.tc-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}
.tc-chip{font:11px/1 'Sometype Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--tc-ivory);border:1px solid #3a3a40;padding:6px 11px;background:rgba(0,0,0,.4)}
.tc-chip.shield{border-color:var(--tc-shield);color:var(--tc-shield)}
.tc-hero .mb-roster{justify-content:center;text-align:left}
.tc-hero .mb-rname{font-family:'Sometype Mono',monospace;color:var(--tc-bronze)}
.tc-av{width:34px;height:34px;border-radius:50%;object-fit:cover;object-position:50% 20%;background:#1f1f24;border:2px solid #3a3a40;box-shadow:0 2px 8px rgba(0,0,0,.6);display:inline-block;vertical-align:middle}
.tc-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px;margin-top:24px;align-items:start}
@media(max-width:940px){.tc-grid{grid-template-columns:minmax(0,1fr)}}
.tc-brief{background:rgba(15,15,18,.92);border:1px solid #26262b;border-top:3px solid var(--tc-gilt);padding:20px 20px 16px}
.tc-brief h2,.tc-phase-name{font-family:'Marcellus',serif;font-weight:400;color:var(--tc-ivory)}
.tc-brief h2{font-size:30px;margin:0}
.tc-staging{font-style:italic;color:#8c887f;border-bottom:1px solid #26262b;padding-bottom:12px;margin:8px 0 14px}
.tc-beat{margin:0 0 11px}
.tc-beat p{margin:0}
.tc-beat.do p{font:14.5px/1.5 'Sometype Mono',monospace;color:#7a766d}
.tc-beat.say p{color:var(--tc-ivory);padding-left:14px;border-left:1px solid var(--tc-gilt-lo)}
.tc-beat.shield p{border-left:2px solid var(--tc-shield);color:#fbe9b6}
.tc-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.tc-rule{font:10.5px/1 'Sometype Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#8c887f;border:1px solid #2e2e34;padding:5px 8px}
.tc-rule b{color:var(--tc-gilt);font-weight:600;margin-right:4px}
.tc-phase{margin-top:28px}
.tc-phase-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:6px;border-bottom:1px solid #26262b}
.tc-phase-n{width:34px;height:34px;display:grid;place-items:center;font:600 14px/1 'Sometype Mono',monospace;color:#0b0b0d;background:conic-gradient(var(--tc-ivory) 25%,#2a2a30 0 50%,var(--tc-ivory) 0 75%,#2a2a30 0) 0 0/17px 17px;border:1px solid var(--tc-gilt-lo)}
.tc-phase-n b{background:var(--tc-gilt);padding:2px 5px}
.tc-phase-name{font-size:32px;line-height:1}
.tc-phase-stats{margin-left:auto;display:flex;gap:6px}
.tc-stat{font:10.5px/1 'Sometype Mono',monospace;font-style:normal;text-transform:uppercase;letter-spacing:.12em;color:#bdb8ad;background:#1a1a1f;padding:5px 8px}
.tc-setting{font-style:italic;color:#8c887f;margin:8px 0 12px}
.tc-card{position:relative;margin:0 0 12px;padding:14px 16px 13px 66px;background:linear-gradient(120deg,transparent 45%,rgba(207,200,184,.04) 47%,transparent 50%),linear-gradient(180deg,#1b1b20,#121215);border:1px solid #2a2a30;opacity:0;transform:translateY(-14px) scale(1.02);transition:opacity .35s ease,transform .45s cubic-bezier(.3,1.4,.5,1)}
.tc-card.on{opacity:1;transform:none}
.tc-card.good{border-left:3px solid var(--tc-bronze)}
.tc-card.bad{border-left:3px solid var(--tc-wrong)}
.tc-card.social{border-left:3px solid #8a7fb0}
.tc-card.right{border:1px solid var(--tc-gilt);box-shadow:0 0 18px rgba(216,178,90,.12)}
.tc-card.wrongq{border:1px solid var(--tc-wrong)}
.tc-card.relic{border:1px solid var(--tc-shield);box-shadow:0 0 24px rgba(240,207,98,.18)}
.tc-ico{position:absolute;left:14px;top:14px;width:38px;height:38px}
.tc-ico svg{width:100%;height:100%;display:block}
.tc-tag{float:right;font:10.5px/1 'Sometype Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:#8c887f;margin:4px 0 0 10px}
.tc-card.good .tc-tag,.tc-card.right .tc-tag{color:var(--tc-gilt)}.tc-card.bad .tc-tag,.tc-card.wrongq .tc-tag{color:#e0766c}.tc-card.relic .tc-tag{color:var(--tc-shield)}
.tc-who{font-weight:600;color:var(--tc-ivory);letter-spacing:.02em}
.tc-card .mb-avs .cv-av{width:34px;height:34px;border:2px solid #3a3a40}
.tc-card.right .cv-av,.tc-card.relic .cv-av{border-color:var(--tc-gilt)}.tc-card.wrongq .cv-av,.tc-card.bad .cv-av{border-color:var(--tc-wrong)}
.tc-txt{margin-top:4px}
.tc-conf{margin-top:10px;padding:9px 12px;background:rgba(0,0,0,.35);border-left:2px solid #8a7fb0;font-style:italic;color:#ddd8cc}
.tc-conf small{display:block;font:10.5px/1.4 'Sometype Mono',monospace;font-style:normal;letter-spacing:.14em;text-transform:uppercase;color:#a79cd0}
.tc-fx{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.tc-fx span{font:10.5px/1 'Sometype Mono',monospace;color:#bdb8ad;border:1px solid #2e2e34;padding:4px 7px}
.tc-summary{margin-top:24px;padding:18px 20px;border:1px solid var(--tc-gilt-lo);background:rgba(15,15,18,.95);transition:opacity .4s}
.tc-summary small{display:block;font:10.5px/1.4 'Sometype Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--tc-gilt);margin-bottom:4px}
.tc-side{position:sticky;top:60px}
.tc-panel{background:rgba(10,10,12,.96);border:1px solid #26262b;padding:14px}
.tc-panel h3{font:400 26px/1 'Marcellus',serif;color:var(--tc-ivory);margin:0 0 10px;text-align:center;letter-spacing:.06em}
.tc-statue{display:block;width:70px;height:74px;margin:0 auto -6px;position:relative;z-index:2}
.tc-board{display:grid;grid-template-columns:repeat(4,1fr);border:3px solid var(--tc-gilt-lo);box-shadow:0 0 0 1px #000,0 10px 30px rgba(0,0,0,.6)}
.tc-sq{position:relative;aspect-ratio:1;display:grid;place-items:center;transition:box-shadow .5s}
.tc-sq.light{background:linear-gradient(135deg,#efe9dc,#d8d1c1)}
.tc-sq.dark{background:linear-gradient(135deg,#26262c,#131316)}
.tc-sq .tc-av{width:38px;height:38px}
.tc-sq small{position:absolute;bottom:2px;left:0;right:0;text-align:center;font:9px/1 'Sometype Mono',monospace;color:#8c887f;text-shadow:0 1px 0 #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tc-sq .piece{position:absolute;top:-8px;right:-8px;width:34px;height:34px;opacity:0;transform:translateY(-18px);transition:all .45s cubic-bezier(.3,1.5,.5,1);filter:drop-shadow(0 3px 3px rgba(0,0,0,.7));pointer-events:none}
.tc-sq .piece.on{opacity:1;transform:none}
.tc-sq .piece.fell{transform:rotate(80deg) translate(4px,-4px);filter:sepia(1) saturate(5) brightness(1.1) drop-shadow(0 0 6px rgba(216,178,90,.9))}
.tc-sq.truth{box-shadow:inset 0 0 0 3px var(--tc-wrong)}
.tc-sq.gambit{box-shadow:inset 0 0 0 3px var(--tc-shield)}
.tc-track{display:flex;justify-content:space-between;gap:6px;margin-top:14px}
.tc-slot{flex:1;text-align:center;padding:6px 2px;border:1px solid #2a2a30;background:rgba(0,0,0,.35);transition:all .4s}
.tc-slot svg{width:24px;height:24px;display:block;margin:0 auto}
.tc-slot small{display:block;font:9.5px/1.2 'Sometype Mono',monospace;color:#6b675f;margin-top:3px;text-transform:uppercase}
.tc-slot.right{border-color:var(--tc-gilt)}.tc-slot.right small{color:var(--tc-gilt)}
.tc-slot.wrong{border-color:var(--tc-wrong)}.tc-slot.wrong small{color:#e0766c}
.tc-gambit{margin-top:12px;padding:11px 12px;border:1px dashed #6b5b2a;text-align:center;transition:all .5s}
.tc-gambit .lbl{font:10.5px/1 'Sometype Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a7a4a}
.tc-gambit .val{margin-top:6px;font-style:italic;color:#8c887f}
.tc-gambit .holder{display:none;margin:8px auto 0}
.tc-gambit .holder .tc-av{width:44px;height:44px;border-color:var(--tc-shield);box-shadow:0 0 14px rgba(240,207,98,.45)}
.tc-gambit.on{border:1px solid var(--tc-shield)}
.tc-gambit.on .holder{display:block}
.tc-gambit.on .lbl,.tc-gambit.on .val{color:var(--tc-shield);font-style:normal}
.tc-pot{margin-top:12px;border-top:1px solid #26262b;padding-top:10px}
.tc-pot .r{display:flex;justify-content:space-between;font-size:16px;color:#8c887f}
.tc-pot .r b{font:13px/1.7 'Sometype Mono',monospace;color:var(--tc-ivory);font-weight:400}
.tc-pot .big{font:30px/1.1 'Sometype Mono',monospace;color:var(--tc-gilt);text-align:right;margin-top:4px}
.tc-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 16px;background:linear-gradient(0deg,#060607 60%,rgba(6,6,7,0))}
.tc-btn{font:600 16px/1 'EB Garamond',serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;padding:12px 26px;color:#0b0b0d;background:linear-gradient(180deg,#f2dc98,var(--tc-gilt));border:1px solid var(--tc-gilt-lo)}
.tc-btn[disabled]{opacity:.4;cursor:default}
.tc-btn.ghost{background:transparent;color:var(--tc-ivory);border:1px solid #3a3a40}
.tc-counter{font:12px/1 'Sometype Mono',monospace;color:#7a766d;letter-spacing:.1em}

/* ── THE STAGE: the board ────────────────────────────────────────────── */
.ms-tc-sq rect{transition:box-shadow .6s}
.ms-tc-sq.light rect{fill:#d8d1c1}
.ms-tc-sq.dark rect{fill:#26262c}
.ms-tc-sq text{font:9px 'Sometype Mono',monospace;fill:#8c887f}
.ms-tc-sq.light text{fill:#3a3730}
.ms-tc-sq.truth rect{stroke:#c0443a;stroke-width:4}
.ms-tc-sq.gambit rect{stroke:#f0cf62;stroke-width:4}
.ms-tc-piece{opacity:.45;transition:transform 1.1s cubic-bezier(.3,1.3,.5,1),opacity .6s,filter .6s}
.ms-tc-piece.on{opacity:1;filter:drop-shadow(0 4px 4px rgba(0,0,0,.8))}
.ms-tc-piece.fell{filter:sepia(1) saturate(5) brightness(1.1) drop-shadow(0 0 10px rgba(216,178,90,.9))}
.ms-tc-statue{transition:transform .8s}
.ms[data-phase=ask] .ms-tc-statue{animation:ms-tc-lean 1.2s ease-in-out infinite alternate}
@keyframes ms-tc-lean{to{transform:translate(540px,20px) scale(1.08)}}
.ms-tc-statue .eye{animation:ms-tc-eye 2.4s ease-in-out infinite}
@keyframes ms-tc-eye{50%{opacity:.35}}
.ms-tc-candles circle{animation:ms-tc-flick .5s ease-in-out infinite alternate}
@keyframes ms-tc-flick{to{opacity:.6;r:9}}
.ms[data-phase=watch] .ms-tc-sq{filter:brightness(.5)}
.ms[data-phase=bad] .ms-vig{box-shadow:inset 0 0 160px 60px rgba(50,8,8,.85)}
@media(prefers-reduced-motion:reduce){.tc-root *,.tc-root *::before,.tc-root *::after{animation:none !important;transition:none !important}.tc-card{opacity:1;transform:none}}
` + STAGE_CSS,
};

export default CHESS;
