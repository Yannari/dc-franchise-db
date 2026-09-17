// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-theme-roulette.js — candlelight, crystal and green baize
// ══════════════════════════════════════════════════════════════════════
//
// The Roulette THEME for js/vp-tr/mission-bespoke.js, reproducing the approved
// mockup (mockup/mockup-tr-roulette.html): the long dinner table with everyone
// seated, a chip in front of each place, and the wheel at the head of it.
//
// THE STAGE PLAYS THE SPIN IN THREE BEATS — the glasses going up or flat, the
// wheel turning with the ball on the rim, and the pocket it drops into. Reveal
// all and a fresh mount land on the end state; nothing is drawn before the card
// that shows it.
import { players } from '../core.js';
import { playerAvatarUrl } from '../players.js';
import { STAGE_CSS, stageShell, stageFor, reducedMotion, stageEvents } from './mission-stage.js';

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const _cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
const _gbp = n => '£' + Math.round(Number(n) || 0).toLocaleString('en-GB');
const _url = name => playerAvatarUrl((players || []).find(p => p && p.name === name) || { name });
const _face = name => '<img class="ro-av" src="' + _esc(_url(name)) + '" alt="' + _esc(name) + '" title="'
  + _esc(name) + '" onerror="this.style.visibility=&quot;hidden&quot;">';

const isSpin = c => /argued for /.test(c.text || '');
const spinResultOf = c => (/green/.test(c.text || '') ? 'green'
  : /came back as|wheel paid|doubled to/.test(c.text || '') ? 'win' : 'lose');

function _roKind(c, ph) {
  if (c.relic) return 'green';
  if (isSpin(c)) return 'spin';
  if (c.isSocial) return c.behaviour === 'suspicious' ? 'quarrel' : c.behaviour === 'selfish' || c.behaviour === 'impressive' ? 'big' : 'scene';
  if (ph.id === 'dinner') return c.tone === 'bad' ? 'sour' : 'toast';
  return 'count';
}
const RO_CAP = { dinner: ['Part one', 'The Dinner'], wheel: ['Part two', 'The Wheel'],
  reckoning: ['Part three', 'The Reckoning'] };

const ICONS = {
  glass: '<path d="M10 5h16l-2 12a6 6 0 0 1-12 0z" fill="#7c1f2e" stroke="#dfeae6"/><path d="M18 17v10M12 31h12" stroke="#dfeae6" stroke-width="2"/>',
  chip: '<circle cx="18" cy="18" r="13" fill="#12452f" stroke="#c9a227" stroke-width="3"/><path d="M18 5v6M18 25v6M5 18h6M25 18h6" stroke="#c9a227" stroke-width="3"/>',
  win: '<circle cx="18" cy="18" r="14" fill="none" stroke="#f3d97a" stroke-width="2"/><path d="M10 18l6 6 10-12" fill="none" stroke="#f3d97a" stroke-width="3"/>',
  lose: '<circle cx="18" cy="18" r="14" fill="none" stroke="#c8465a" stroke-width="2"/><path d="M12 12l12 12M24 12L12 24" stroke="#c8465a" stroke-width="3"/>',
  shield: '<path d="M18 3l12 4v9c0 8-5 14-12 17C11 30 6 24 6 16V7z" fill="#f0cd5c" stroke="#7b6224"/><circle cx="18" cy="17" r="5" fill="#12452f"/>',
  talk: '<path d="M4 8h18v12H12l-6 5v-5H4z" fill="#4d6f8a"/><path d="M14 16h18v12h-2v5l-6-5H14z" fill="#dfeae6" opacity=".85"/>',
};

// ══════════════════════════════════════════════════════════════════════
// THE STAGE
// ══════════════════════════════════════════════════════════════════════
function _roLayout(v) {
  const seats = (v.tally.table || []).map(x => x.n);
  const n = Math.max(1, seats.length);
  const gap = Math.min(104, 880 / n);
  const x0 = 500 - ((n - 1) * gap) / 2;
  return { seats, gap, at: seats.map((nm, i) => ({ n: nm, x: x0 + i * gap })) };
}

function _roScene(v, s) {
  const e = v.epNum;
  const L = s.L;
  const seats = L.at.map(q => '<g class="ro-seat" data-s="' + _esc(q.n) + '" transform="translate(' + q.x.toFixed(0) + ',312)">'
    + '<circle r="22" fill="#0a1712" stroke="#33463e" stroke-width="2"/>'
    + '<image href="' + _esc(_url(q.n)) + '" x="-20" y="-20" width="40" height="40" clip-path="url(#ro-c-' + e + ')"/>'
    + '<g class="ro-glass" data-g="' + _esc(q.n) + '" transform="translate(28,-4)"><g class="lift">'
    + '<path d="M-6 -16h12l-1.5 9a4.5 4.5 0 0 1-9 0z" fill="#7c1f2e" stroke="#dfeae6" stroke-width="1.2"/>'
    + '<path d="M0 -7v8M-4 2h8" stroke="#dfeae6" stroke-width="1.4"/></g></g></g>').join('');
  const chips = L.at.map(q => '<g class="ro-chip" data-c="' + _esc(q.n) + '" transform="translate(' + q.x.toFixed(0) + ',268)"><g class="lift">'
    + '<ellipse rx="14" ry="6" fill="#12452f" stroke="#c9a227" stroke-width="2"/>'
    + '<ellipse cy="-5" rx="14" ry="6" fill="#17563a" stroke="#c9a227" stroke-width="2"/></g></g>').join('');
  let pockets = '';
  for (let i = 0; i < 18; i++) {
    const a0 = (i * 20 - 90) * Math.PI / 180, a1 = ((i + 1) * 20 - 90) * Math.PI / 180;
    const f = x => x.toFixed(1);
    const p = [[196 + 52 * Math.cos(a0), 196 + 52 * Math.sin(a0)], [196 + 150 * Math.cos(a0), 196 + 150 * Math.sin(a0)],
      [196 + 150 * Math.cos(a1), 196 + 150 * Math.sin(a1)], [196 + 52 * Math.cos(a1), 196 + 52 * Math.sin(a1)]];
    const fill = i === 0 ? '#1e5c3a' : (i % 2 ? '#7c1f2e' : '#141b18');
    pockets += '<path class="ro-pocket' + (i === 0 ? ' green' : '') + (s.hit === i ? ' hit' : '') + '" data-pk="' + i
      + '" fill="' + fill + '" stroke="#c9a227" stroke-width="1.5" d="M' + p[0].map(f).join(' ')
      + ' L' + p[1].map(f).join(' ') + ' A150 150 0 0 1 ' + p[2].map(f).join(' ')
      + ' L' + p[3].map(f).join(' ') + ' A52 52 0 0 0 ' + p[0].map(f).join(' ') + 'Z"/>';
  }
  const candles = [150, 330, 510, 690].map(x =>
    '<g transform="translate(' + x + ',236)"><rect x="-4" y="0" width="8" height="26" fill="#e8e2cf"/>'
    + '<path d="M0 -14c5 7 6 10 6 13a6 6 0 0 1-12 0c0-3 1-6 6-13z" fill="#ffca6b"/></g>').join('');
  return '<ellipse cx="500" cy="268" rx="470" ry="104" fill="url(#ro-baize-' + e + ')" stroke="#4a3a1c" stroke-width="6"/>'
    + '<ellipse cx="500" cy="268" rx="440" ry="88" fill="none" stroke="rgba(201,162,39,.25)" stroke-width="2"/>'
    + candles + chips + seats
    + '<g transform="translate(582,-6) scale(.62)">'
    + '<ellipse cx="196" cy="196" rx="170" ry="52" fill="#0a1712" opacity=".7"/>'
    + '<g class="ro-wheel"><circle cx="196" cy="196" r="150" fill="#1b120c" stroke="#c9a227" stroke-width="6"/>'
    + pockets
    + '<circle cx="196" cy="196" r="52" fill="#12452f" stroke="#c9a227" stroke-width="4"/>'
    + '<path d="M196 148 L214 196 L196 244 L178 196Z" fill="#c9a227" opacity=".85"/></g>'
    + '<g class="ro-ball"><circle cx="196" cy="62" r="9" fill="#dfeae6"/></g></g>';
}

function _roStage(v, states, n) {
  const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
  const e = v.epNum;
  const defs = '<clipPath id="ro-c-' + e + '"><circle r="20"/></clipPath>'
    + '<radialGradient id="ro-baize-' + e + '" cx=".5" cy=".4"><stop offset="0" stop-color="#17563a"/>'
    + '<stop offset="1" stop-color="#0b2e1f"/></radialGradient>';
  return stageShell({ epNum: e, defs, scene: _roScene(v, s),
    cap: [s.capK, (RO_CAP[s.capPhase] || RO_CAP.dinner)[1]],
    potLabel: 'On the table', pot: s.left,
    vars: '--ms-mono:\'Share Tech Mono\',monospace;--ms-accent:#f3d97a;--ms-ink:#dfeae6;--cv-display:\'Yeseva One\',serif',
    label: 'The dinner table, staged' });
}

function _roSettle(st, v, s) {
  st.phase(s.watch && s.watch.length ? 'watch' : 'rest');
  st.qa('.ro-pocket').forEach(p => p.setAttribute('class', 'ro-pocket'
    + (p.getAttribute('data-pk') === '0' ? ' green' : '') + (s.hit === Number(p.getAttribute('data-pk')) ? ' hit' : '')));
  st.qa('.ro-chip').forEach(c => c.setAttribute('class', 'ro-chip'));
  st.qa('.ro-glass').forEach(g => g.setAttribute('class', 'ro-glass'));
  st.qa('.ro-seat').forEach(g => g.classList.toggle('lit', (s.watch || []).includes(g.getAttribute('data-s'))));
  st.cap(s.capK, (RO_CAP[s.capPhase] || RO_CAP.dinner)[1]);
  st.pot(s.left, false);
  st.clearStamp();
}

function _roPlay(st, v, prev, s) {
  _roSettle(st, v, prev);
  const e = s.ev;
  if (!e) { _roSettle(st, v, s); return; }
  const land = (fn, ms) => st.later(fn, ms);
  if (e.k === 'spin' || e.k === 'green') {
    const sp = s.spin;
    if (!sp) { _roSettle(st, v, s); return; }
    st.phase('ask');
    st.cap(prev.capK, RO_CAP.wheel[1]);
    // the glasses, one at a time
    (s.L.seats || []).forEach((nm, i) => land(() => {
      const g = st.q('.ro-glass[data-g="' + (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(nm) : nm) + '"]');
      const up = (sp.stakers || []).includes(nm);
      if (g) g.setAttribute('class', 'ro-glass ' + (up ? 'raised' : 'covered'));
      if (up) {
        const c = st.q('.ro-chip[data-c="' + (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(nm) : nm) + '"]');
        if (c) c.setAttribute('class', 'ro-chip staked');
      }
    }, 240 + i * 110));
    const votes = 300 + (s.L.seats || []).length * 110;
    land(() => st.phase('spin'), votes + 200);
    land(() => {
      _roSettle(st, v, s);
      st.phase(sp.result === 'lose' ? 'bad' : 'win');
      st.flash('58%', '34%');
      if (sp.result === 'win') {
        st.stamp('THE CASTLE’S COLOUR · ' + _gbp(sp.stake * 2), 'gold');
        st.burst(18, 58, 34, 150, 'rgba(243,217,122,.95)');
      } else if (sp.result === 'lose') {
        st.qa('.ro-chip.staked').forEach(c => c.setAttribute('class', 'ro-chip gone'));
        st.stamp('GONE · ' + _gbp(sp.stake), 'bad');
      } else {
        st.stamp('THE GREEN POCKET · A SHIELD', 'gold');
        st.burst(20, 58, 34, 160, 'rgba(91,224,138,.95)');
      }
      land(() => st.pot(s.left, true), 900);
    }, votes + 2400);
  } else if (e.k === 'toast' || e.k === 'sour' || e.k === 'scene' || e.k === 'quarrel' || e.k === 'big') {
    _roSettle(st, v, s);
    st.phase('watch');
    if (e.k === 'quarrel') land(() => st.stamp('WHOSE IDEA WAS THAT', 'bad'), 800);
    if (e.k === 'big') land(() => st.stamp('THE BIGGEST BET', 'cool'), 800);
  } else if (e.k === 'count') {
    st.phase('hold');
    land(() => {
      _roSettle(st, v, s);
      st.phase('win');
      st.stamp(_gbp(v.tally.kept) + ' INTO THE POT', v.tally.kept > v.tally.purse / 2 ? 'gold' : 'bad');
      land(() => st.pot(v.tally.kept, true), 900);
    }, 1500);
  } else {
    _roSettle(st, v, s);
  }
}

// ══════════════════════════════════════════════════════════════════════

export const ROULETTE = {
  id: 'roulette', prefix: 'ro', ownShield: true,
  shieldBeat: /green pocket|wanted the big bet/,
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: () => '<h1 class="ro-title">The <span>Roulette</span></h1>',
  sub: v => 'Dinner, and a wheel brought in on a trolley. ' + _gbp(v.tally.purse)
    + ' on the table, four spins, and a room that has to agree how much of it to risk.',
  chips: v => [
    { text: (v.tally.spins || []).length + ' spins' },
    { text: 'The table stakes together' },
    { text: 'A win pays double · a loss burns it' },
    v.tally.offered === false ? { text: 'No Shield tonight' }
      : { text: 'The green pocket · a Shield instead of money', shield: true },
  ],
  phaseNum: roman => '<span class="ro-phase-n">' + roman + '</span>',
  cardClass: c => {
    const k = _roKind(c, c._ph || {});
    if (c.relic || k === 'green') return 'relic';
    if (k === 'spin') { const r = spinResultOf(c); return r === 'win' ? 'win' : r === 'lose' ? 'lose' : 'relic'; }
    return (c.isSocial ? 'social ' : '') + (c.tone === 'bad' ? 'lose' : c.tone === 'good' ? 'win' : 'plain');
  },
  cardTag: (c, ph) => {
    const k = _roKind(c, ph);
    if (k === 'green' || c.relic) return 'The green pocket';
    if (k === 'spin') { const r = spinResultOf(c); return r === 'win' ? 'Spin · won' : r === 'lose' ? 'Spin · lost' : 'Spin · green'; }
    if (k === 'count') return 'The reckoning';
    if (c.isSocial) return _cap(c.behaviour || 'moment');
    return k === 'sour' ? 'A long dinner' : 'At the table';
  },
  icon: (c, ph) => {
    const k = _roKind(c, ph);
    const ic = (c.relic || k === 'green') ? 'shield'
      : k === 'spin' ? (spinResultOf(c) === 'win' ? 'win' : spinResultOf(c) === 'lose' ? 'lose' : 'shield')
        : k === 'count' ? 'chip' : k === 'quarrel' || k === 'big' ? 'talk' : 'glass';
    return '<span class="ro-ico"><svg viewBox="0 0 36 36" aria-hidden="true">' + ICONS[ic] + '</svg></span>';
  },

  stage: (v, states, n) => _roStage(v, states, n),

  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const spins = v.tally.spins || [];
    const rows = spins.map((sp, i) => {
      const seen = s.spinsSeen > i;
      return '<div class="ro-spin' + (seen ? (sp.result === 'win' ? ' won' : sp.result === 'lose' ? ' lost' : ' green') : '') + '">'
        + '<span>spin ' + (i + 1) + '</span><b>'
        + (seen ? (sp.result === 'win' ? '+' + _gbp(sp.stake) : sp.result === 'lose' ? '−' + _gbp(sp.stake) : 'a Shield')
          : '—') + '</b></div>';
    }).join('');
    const holder = v.tally.holder;
    return '<div class="ro-panel"><h3>The Table</h3>'
      + '<div class="ro-spins">' + rows + '</div>'
      + '<div class="ro-bar"><i style="width:' + Math.round(100 * s.left / Math.max(1, v.tally.purse)) + '%"></i></div>'
      + '<div class="ro-barlab"><span>on the table</span><span>' + _gbp(s.left) + ' of ' + _gbp(v.tally.purse) + '</span></div>'
      + (v.tally.offered === false ? '' : '<div class="ro-shieldbox' + (s.shieldSeen ? ' on' : '') + '">'
        + '<div class="lbl">The Green Pocket</div>'
        + (holder ? '<div class="holder">' + _face(holder) + '</div>' : '')
        + '<div class="val">' + (s.shieldSeen && holder ? _esc(holder) + ' · argued that stake up'
          : 'the ball has not found it') + '</div></div>')
      + '<div class="ro-pot">'
      + '<div class="r"><span>Pot at dinner</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="r"><span>Burned tonight</span><b class="down">' + (s.done ? _gbp(v.tally.burned) : '—') + '</b></div>'
      + '<div class="r"><span>Into the pot</span><b class="up">' + (s.done ? _gbp(v.earned) : '—') + '</b></div>'
      + '<div class="big">' + _gbp(v.potBefore + (s.done ? v.earned : 0)) + '</div></div></div>';
  },

  sideStates(v, total) {
    const evs = stageEvents(v, _roKind);
    const L = _roLayout(v);
    const spins = v.tally.spins || [];
    const out = [];
    for (let n = 0; n <= total; n++) {
      const seen = evs.slice(0, n);
      const spinsSeen = seen.filter(e => e.k === 'spin' || e.k === 'green').length;
      const sp = spins[spinsSeen - 1] || null;
      const ev = evs[n - 1] || null;
      const left = sp ? sp.left + sp.kept : v.tally.purse;
      const done = n >= total;
      out.push({
        L, ev, spin: sp, spinsSeen, done,
        capPhase: ev ? ev.phase : 'dinner',
        capK: spinsSeen ? 'spin ' + spinsSeen + ' of ' + spins.length : 'before the wheel',
        left: done ? v.tally.kept : left,
        hit: sp && spinsSeen === (ev && (ev.k === 'spin' || ev.k === 'green') ? spinsSeen : -1)
          ? (sp.result === 'green' ? 0 : sp.result === 'win' ? 4 : 5) : null,
        shieldSeen: !!v.tally.holder && spins.findIndex(x => x.result === 'green') < spinsSeen
          && spins.some(x => x.result === 'green'),
        watch: ev && (ev.k === 'scene' || ev.k === 'quarrel' || ev.k === 'big' || ev.k === 'toast' || ev.k === 'sour')
          ? ev.who : [],
        v: { epNum: v.epNum, potBefore: v.potBefore, earned: v.earned, tally: v.tally, shield: v.shield },
      });
    }
    return out;
  },

  paintSide(prefix, states, n, mode) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const st = stageFor(s.v.epNum);
    if (st) {
      st.clear();
      if (mode === 'next' && n > 0 && !reducedMotion()) _roPlay(st, s.v, states[n - 1], s);
      else _roSettle(st, s.v, s);
    }
  },

  atmosphere: () => '<div class="ro-room"></div><div class="ro-smoke"></div>',

  css: `
@import url('https://fonts.googleapis.com/css2?family=Yeseva+One&family=Petrona:ital,wght@0,400;0,600;1,400&family=Share+Tech+Mono&display=swap');
.ro-root{--ro-night:#0d1412;--ro-baize:#12452f;--ro-brass:#c9a227;--ro-brass-hi:#f3d97a;--ro-crystal:#dfeae6;
  --ro-wine:#7c1f2e;--ro-wine-hi:#c8465a;--ro-ash:#9aa8a2;--ro-shield:#f0cd5c;--cv-display:'Yeseva One',serif;
  background:#0d1412;color:var(--ro-ash);font-family:'Petrona',Georgia,serif;font-size:18px;line-height:1.55;padding-bottom:120px;position:relative;overflow:clip}
.ro-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.ro-room{position:absolute;inset:0;background:radial-gradient(60% 45% at 50% 40%,rgba(201,162,39,.13),transparent 70%),repeating-linear-gradient(90deg,rgba(255,255,255,.012) 0 1px,transparent 1px 90px),linear-gradient(180deg,#16211d,#0d1412 65%)}
.ro-smoke{position:absolute;left:-10%;right:-10%;top:0;height:50%;opacity:.3;background:radial-gradient(40% 50% at 30% 40%,rgba(223,234,230,.18),transparent 70%),radial-gradient(40% 50% at 70% 60%,rgba(223,234,230,.12),transparent 70%);animation:ro-drift 26s ease-in-out infinite alternate}
@keyframes ro-drift{from{transform:translateX(-30px)}to{transform:translateX(30px)}}
.ro-shell{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:26px 16px 40px}
.ro-body{position:relative;z-index:2}
.ro-hero{position:relative;padding:34px 26px 26px;text-align:center;border:1px solid #2a3a33;
  background:radial-gradient(70% 60% at 50% 0%,rgba(201,162,39,.16),transparent 70%),linear-gradient(180deg,#16211d,#0d1412);
  box-shadow:inset 0 0 0 6px #0d1412,inset 0 0 0 7px #2a3a33,0 20px 50px rgba(0,0,0,.6)}
.ro-kicker{font:13px/1 'Share Tech Mono',monospace;letter-spacing:.3em;text-transform:uppercase;color:var(--ro-brass-hi)}
.ro-title{font-family:'Yeseva One',serif;color:var(--ro-crystal);font-size:clamp(38px,8vw,84px);line-height:1;margin:.12em 0 .06em}
.ro-title span{color:var(--ro-brass)}
.ro-sub{color:#b3c0ba;max-width:58ch;margin:0 auto;font-style:italic}
.ro-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}
.ro-chip{font:12px/1 'Share Tech Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--ro-crystal);border:1px solid #33463e;padding:6px 11px;background:rgba(0,0,0,.35)}
.ro-chip.shield{border-color:var(--ro-shield);color:var(--ro-shield)}
.ro-hero .mb-roster{justify-content:center;text-align:left}
.ro-hero .mb-rname{font-family:'Share Tech Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--ro-brass-hi)}
.ro-av{width:34px;height:34px;border-radius:50%;object-fit:cover;object-position:50% 20%;background:#16211d;border:2px solid #33463e;box-shadow:0 2px 8px rgba(0,0,0,.6);display:inline-block;vertical-align:middle}
.ro-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px;margin-top:24px;align-items:start}
@media(max-width:940px){.ro-grid{grid-template-columns:minmax(0,1fr)}}
.ro-brief{background:linear-gradient(180deg,#14251f,#0e1a16);border:1px solid #2a3a33;border-left:6px solid var(--ro-brass);padding:22px 22px 16px}
.ro-brief h2{font-family:'Yeseva One',serif;font-size:30px;margin:0;color:var(--ro-crystal)}
.ro-brief .mb-hostname{font:12px/1.4 'Share Tech Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#7d8c86}
.ro-staging{font-style:italic;color:#8b9a94;border-bottom:1px dashed #2a3a33;padding-bottom:12px;margin:8px 0 14px}
.ro-beat{margin:0 0 11px}.ro-beat p{margin:0}
.ro-beat.do p{font:14.5px/1.5 'Share Tech Mono',monospace;color:#7d8c86}
.ro-beat.say p{color:var(--ro-crystal);padding-left:14px;border-left:2px solid #33463e}
.ro-beat.shield p{border-left-color:var(--ro-shield);color:#f7e6b0}
.ro-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.ro-rule{font:11px/1 'Share Tech Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:#8b9a94;border:1px solid #2a3a33;padding:5px 8px}
.ro-rule b{color:var(--ro-brass);margin-right:4px}
.ro-phase{margin-top:28px}
.ro-phase-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:6px;border-bottom:1px solid #2a3a33}
.ro-phase-n{width:38px;height:38px;display:grid;place-items:center;border-radius:50%;font:17px/1 'Yeseva One',serif;color:#0d1412;background:var(--ro-brass)}
.ro-phase-name{font-family:'Yeseva One',serif;font-size:30px;line-height:1;color:var(--ro-crystal)}
.ro-phase-stats{margin-left:auto;display:flex;gap:6px}
.ro-stat{font:11px/1 'Share Tech Mono',monospace;font-style:normal;text-transform:uppercase;letter-spacing:.1em;color:#b3c0ba;background:#16211d;padding:5px 8px}
.ro-setting{font-style:italic;color:#8b9a94;margin:8px 0 12px}
.ro-card{position:relative;margin:0 0 12px;padding:14px 16px 13px 66px;background:linear-gradient(180deg,#16211d,#101a16);border:1px solid #2a3a33;
  opacity:0;transform:translateY(8px);transition:opacity .6s,transform .6s;scroll-margin-top:440px}
.ro-card.on{opacity:1;transform:none}
.ro-card.win{border-left:4px solid var(--ro-brass)}
.ro-card.lose{border-left:4px solid var(--ro-wine)}
.ro-card.social{border-left:4px solid #4d6f8a}
.ro-card.relic{border:1px solid var(--ro-shield);box-shadow:0 0 24px rgba(240,205,92,.16)}
.ro-ico{position:absolute;left:14px;top:14px;width:38px;height:38px}
.ro-ico svg{width:100%;height:100%;display:block}
.ro-tag{float:right;font:11px/1 'Share Tech Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#7d8c86;margin:4px 0 0 10px}
.ro-card.win .ro-tag{color:var(--ro-brass-hi)}.ro-card.lose .ro-tag{color:var(--ro-wine-hi)}.ro-card.relic .ro-tag{color:var(--ro-shield)}
.ro-who{font-weight:600;color:var(--ro-crystal)}
.ro-card .mb-avs .cv-av{width:34px;height:34px;border:2px solid #33463e}
.ro-card.relic .cv-av{border-color:var(--ro-shield)}
.ro-txt{margin-top:6px}
.ro-conf{margin-top:10px;padding:9px 12px;background:rgba(0,0,0,.35);border-left:2px solid #4d6f8a;font-style:italic;color:#dfeae6}
.ro-conf small{display:block;font:11px/1.4 'Share Tech Mono',monospace;font-style:normal;letter-spacing:.12em;text-transform:uppercase;color:#7fa7c4}
.ro-fx{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.ro-fx span{font:11px/1 'Share Tech Mono',monospace;color:#b3c0ba;border:1px solid #2a3a33;padding:4px 7px}
.ro-summary{margin-top:24px;padding:18px 20px;border:1px solid #2a3a33;border-left:6px solid var(--ro-brass);background:#101a16;transition:opacity .4s}
.ro-summary small{display:block;font:11px/1.4 'Share Tech Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--ro-brass);margin-bottom:4px}
.ro-side{position:relative}
.ro-panel{background:rgba(8,14,12,.96);border:1px solid #2a3a33;padding:14px}
.ro-panel h3{font:400 24px/1 'Yeseva One',serif;color:var(--ro-crystal);margin:0 0 10px;text-align:center}
.ro-spin{display:flex;align-items:center;gap:8px;padding:7px 9px;border:1px solid #2a3a33;margin-bottom:6px;font:12px/1.3 'Share Tech Mono',monospace;color:#6f7f79;transition:all .5s}
.ro-spin b{margin-left:auto;font-weight:400}
.ro-spin.won{border-color:var(--ro-brass);color:var(--ro-brass-hi)}
.ro-spin.lost{border-color:var(--ro-wine);color:var(--ro-wine-hi)}
.ro-spin.green{border-color:#5be08a;color:#5be08a}
.ro-bar{height:10px;background:#16211d;border:1px solid #2a3a33;margin:10px 0 4px;position:relative}
.ro-bar i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,var(--ro-brass),var(--ro-brass-hi));transition:width .8s}
.ro-barlab{display:flex;justify-content:space-between;font:10.5px/1 'Share Tech Mono',monospace;color:#6f7f79;text-transform:uppercase;letter-spacing:.12em}
.ro-shieldbox{margin-top:12px;padding:11px 12px;border:1px dashed #6b5b2a;text-align:center;transition:all .5s}
.ro-shieldbox .lbl{font:11px/1 'Share Tech Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a7a4a}
.ro-shieldbox .val{margin-top:6px;font-style:italic;color:#8b9a94}
.ro-shieldbox .holder{display:none;margin:8px auto 0}
.ro-shieldbox .holder .ro-av{width:44px;height:44px;border-color:var(--ro-shield);box-shadow:0 0 14px rgba(240,205,92,.45)}
.ro-shieldbox.on{border:1px solid var(--ro-shield)}
.ro-shieldbox.on .holder{display:block}
.ro-shieldbox.on .lbl,.ro-shieldbox.on .val{color:var(--ro-shield);font-style:normal}
.ro-pot{margin-top:12px;border-top:1px solid #2a3a33;padding-top:10px}
.ro-pot .r{display:flex;justify-content:space-between;font-size:15px;color:#8b9a94}
.ro-pot .r b{font:13px/1.7 'Share Tech Mono',monospace;color:var(--ro-crystal);font-weight:400}
.ro-pot .r b.up{color:var(--ro-brass-hi)}.ro-pot .r b.down{color:var(--ro-wine-hi)}
.ro-pot .big{font:30px/1.1 'Share Tech Mono',monospace;color:var(--ro-brass-hi);text-align:right;margin-top:4px}
.ro-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 16px;background:linear-gradient(0deg,#070b0a 60%,rgba(7,11,10,0))}
.ro-btn{font:18px/1 'Yeseva One',serif;cursor:pointer;padding:11px 26px;color:#0d1412;background:linear-gradient(180deg,var(--ro-brass-hi),var(--ro-brass));border:1px solid #6b5b2a}
.ro-btn[disabled]{opacity:.4;cursor:default}
.ro-btn.ghost{background:transparent;color:var(--ro-crystal);border:1px solid #33463e}
.ro-counter{font:13px/1 'Share Tech Mono',monospace;color:#5f6f69;letter-spacing:.08em}
/* ── THE STAGE: the table ────────────────────────────────────────────── */
.ro-wheel{transform-box:fill-box;transform-origin:50% 50%}
.ms[data-phase=spin] .ro-wheel{animation:ro-spinw 1.1s linear infinite}
@keyframes ro-spinw{to{transform:rotate(360deg)}}
.ro-ball{transform-box:view-box;transform-origin:196px 196px;opacity:0;transition:opacity .4s}
.ms[data-phase=spin] .ro-ball,.ms[data-phase=win] .ro-ball,.ms[data-phase=bad] .ro-ball{opacity:1}
.ms[data-phase=spin] .ro-ball{animation:ro-orbit .55s linear infinite}
@keyframes ro-orbit{to{transform:rotate(-360deg)}}
.ro-pocket{transition:fill .4s,filter .4s}
.ro-pocket.hit{fill:#f3d97a;filter:drop-shadow(0 0 10px rgba(243,217,122,.95))}
.ro-pocket.green.hit{fill:#5be08a;filter:drop-shadow(0 0 12px rgba(91,224,138,.95))}
.ro-chip .lift{transform-box:fill-box;transform-origin:50% 50%;transition:transform .9s cubic-bezier(.3,1.2,.4,1),opacity .5s}
.ro-chip.staked .lift{transform:translateY(-84px)}
.ro-chip.gone .lift{opacity:0;transform:translateY(-130px) scale(.6)}
.ro-glass .lift{transform-box:fill-box;transform-origin:50% 100%;transition:transform .6s,opacity .5s}
.ro-glass.raised .lift{transform:translateY(-18px) rotate(-8deg)}
.ro-glass.covered .lift{opacity:.3}
.ro-seat{transition:filter .5s}
.ms[data-phase=watch] .ro-seat:not(.lit){filter:brightness(.35)}
.ro-seat.lit{filter:drop-shadow(0 0 10px rgba(243,217,122,.9))}
.ms[data-phase=bad] .ms-vig{box-shadow:inset 0 0 160px 60px rgba(60,10,16,.85)}
@media(prefers-reduced-motion:reduce){.ro-root *,.ro-root *::before,.ro-root *::after{animation:none !important;transition:none !important}.ro-card{opacity:1;transform:none}}
` + STAGE_CSS,
};

export default ROULETTE;
