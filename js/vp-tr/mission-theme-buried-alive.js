// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-theme-buried-alive.js — wet loam and lamplight
// ══════════════════════════════════════════════════════════════════════
//
// The Buried Alive THEME for js/vp-tr/mission-bespoke.js, reproducing the
// approved mockup (mockup/mockup-tr-buried-alive.html): a churchyard at dusk, a
// headstone for a title, a section through the ground for a sidebar, a lych-gate
// bell for a clock, and faces everywhere (the user's note on approval).
//
// In its own file rather than in mission-bespoke-themes.js because the
// missions from the wiki arrive one at a time, and one file per world keeps
// each one readable.
//
// THE SIDEBAR MAY NOT KNOW WHAT THE PAGE HAS NOT SHOWN. Every state below is
// computed per reveal step: clue plots open during phase I, coffins light as
// phase II is read, and come up in the order the record says they did during
// phase III. The envelope box stays sealed until the card that shows somebody
// staying down.
import { players } from '../core.js';
import { playerAvatarUrl } from '../players.js';

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
const _gbp = n => '£' + Number(n || 0).toLocaleString('en-GB');
const TEAM_COL = ['#8fae7e', '#b0543c', '#e8d27a', '#8fb3c9'];

function _url(name) {
  return playerAvatarUrl((players || []).find(p => p && p.name === name) || { name });
}
/** A plain face for the sidebar; a missing file hides itself. */
function _face(name, cls, extra) {
  return '<img class="ba-av' + (cls ? ' ' + cls : '') + '" src="' + _esc(_url(name)) + '" alt="'
    + _esc(name) + '" title="' + _esc(name) + '"' + (extra || '')
    + ' onerror="this.style.visibility=&quot;hidden&quot;">';
}

function _prog(v) {
  let s = 0;
  return v.phases.map(p => { const o = { start: s, end: s + p.cards.length }; s += p.cards.length; return o; });
}
function _relicStep(v) {
  let i = 0;
  for (const p of v.phases) { for (const c of p.cards) { if (c.relic) return i; i++; } }
  return -1;
}
const _frac = (n, a, b) => (b > a ? Math.max(0, Math.min(1, (n - a) / (b - a))) : (n >= b ? 1 : 0));
const _slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

const TAGS = {
  'clues:good': 'Read it', 'clues:bad': 'Lost', 'coffins:steady': 'Steady', 'coffins:bad': 'Panicked',
  'lift:good': 'Clean lift', 'lift:steady': 'Up', 'lift:bad': 'Still down',
};

export const BURIED = {
  id: 'buried-alive', prefix: 'ba',
  shieldBeat: /\bShield\b|not yet/,
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: () => '<h1 class="ba-title">Buried <span>Alive</span></h1>',
  sub: v => {
    const coffins = (v.tally.plots || []).filter(p => p.kind === 'coffin').length;
    return `${coffins} of you go into the ground. The rest have forty-five minutes, `
      + `${(v.tally.plots || []).length} plots and a spade each to work out which are theirs.`;
  },
  chips: v => [
    { text: 'Three teams · ' + v.teams.map(t => t.name).join(' · ') },
    { text: (v.tally.clock || 45) + ' minutes' },
    { text: 'Money for every player out before the bell' },
    v.shield && v.shield.offered === false
      ? { text: 'No Shield today' }
      : { text: 'One Shield, sealed inside a coffin', shield: true },
  ],
  phaseNum: roman => '<span class="ba-phase-n">' + roman + '</span>',
  cardClass: c => c.relic ? 'relic' : ((c.isSocial ? 'social ' : '') + (c.tone === 'bad' ? 'bad' : c.tone === 'good' ? 'good' : 'plain')),
  cardTag: (c, ph) => c.relic ? (c.behaviour === 'impressive' ? 'Shield' : 'Not yet')
    : c.isSocial ? _cap(c.behaviour || 'moment')
      : (TAGS[ph.id + ':' + c.tone] || TAGS[ph.id + ':' + c.kind] || _cap(c.kind)),
  icon: (c, ph) => {
    let ic = 'spade';
    if (c.relic) ic = c.behaviour === 'impressive' ? 'seal' : 'lamp';
    else if (ph.id === 'clues') ic = c.tone === 'bad' || c.behaviour === 'suspicious' ? 'wrong' : 'clue';
    else if (ph.id === 'coffins') ic = 'coffin';
    else if (ph.id === 'lift') ic = c.behaviour === 'suspicious' && !/rope|slip|coffin went/i.test(c.text) ? 'coffin' : 'rope';
    return '<span class="ba-ico"><svg viewBox="0 0 36 36" aria-hidden="true">' + ICONS[ic] + '</svg></span>';
  },

  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const plots = v.tally.plots || [];
    const w = Math.max(300, plots.length * 32 + 12);
    const step = (w - 12) / Math.max(1, plots.length);
    const teamIdx = name => Math.max(0, v.teams.findIndex(t => t.name === name));
    const plotSvg = plots.map((p, i) => {
      const x = 6 + step * (i + 0.5);
      let g = '<g class="ba-plot ' + (s.plot[i] || '') + '" id="ba-plot-' + i + '" transform="translate(' + x.toFixed(1) + ',0)">'
        + '<path class="soil" d="M-13 34 q13 -12 26 0 z" fill="#4a3a2c"/>'
        + '<path class="spoil" d="M-14 32 q7 -16 14 -10 q7 -8 14 10 z" fill="#b0543c"/>'
        + '<text x="0" y="196" text-anchor="middle" class="ba-pn">' + p.n + '</text>';
      if (p.kind === 'clue') {
        g += '<rect x="-6" y="120" width="12" height="9" rx="1" fill="#5d6a6e" stroke="#b9bdb4" stroke-width=".6"/>';
      } else {
        const clip = 'bf-' + v.epNum + '-' + i;
        g += '<g class="coffin"><path class="lid" d="M-8 100 h16 l4 12 -3 50 h-18 l-3 -50 z" fill="#2a211a" stroke-width="1.6"/>'
          + '<clipPath id="' + clip + '"><circle cx="0" cy="122" r="8"/></clipPath>'
          + '<image class="face" href="' + _esc(_url(p.who)) + '" x="-8" y="114" width="16" height="16" clip-path="url(#' + clip + ')" preserveAspectRatio="xMidYMin slice"/>'
          + '<circle class="lamp" cx="0" cy="142" r="4" fill="#e8d27a"/>'
          + '<rect x="-2" y="164" width="4" height="4" fill="' + TEAM_COL[teamIdx(p.team)] + '"/></g>';
      }
      return g + '</g>';
    }).join('');
    const rows = v.teams.map((t, i) => {
      const diggers = t.members.filter(m => !(t.buried || []).includes(m));
      return '<div class="ba-team"><div class="ba-team-head"><span><i class="sw" style="background:'
        + TEAM_COL[i] + '"></i>' + _esc(t.name) + '</span><b id="ba-r-' + i + '">' + _esc(s.rows[i]) + '</b></div>'
        + '<div class="ba-team-faces">' + diggers.map(d => _face(d)).join('')
        + ((t.buried || []).length ? '<span class="sep"></span>' : '')
        + (t.buried || []).map(b => _face(b, 'under' + (s.out.includes(b) ? ' out' : '')
          + (s.left.includes(b) ? ' left' : ''), ' id="ba-u-' + v.epNum + '-' + _slug(b) + '"')).join('')
        + '</div></div>';
    }).join('');
    const sh = v.shield || {};
    return '<div class="ba-panel"><h3>The Churchyard</h3>'
      + '<div class="ba-clock"><svg class="ba-bell" id="ba-bell" viewBox="0 0 46 46" aria-hidden="true">'
      + '<path d="M23 4v5" stroke="#b9bdb4" stroke-width="2"/>'
      + '<path d="M12 32c0-12 4-21 11-21s11 9 11 21l3 4H9z" fill="#8c7a34" stroke="#e8d27a" stroke-width="1"/>'
      + '<circle cx="23" cy="39" r="3" fill="#e8d27a"/></svg>'
      + '<div class="ba-time"><span id="ba-time">' + s.time + '</span><small>left on the bell</small></div></div>'
      + '<svg class="ba-ground" viewBox="0 0 ' + w + ' 200" role="img" aria-label="Section through the churchyard">'
      + '<defs><linearGradient id="ba-soil-' + v.epNum + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2d22"/><stop offset="1" stop-color="#1c1510"/></linearGradient></defs>'
      + '<rect x="0" y="0" width="' + w + '" height="34" fill="#141b18"/>'
      + '<rect x="0" y="34" width="' + w + '" height="166" fill="url(#ba-soil-' + v.epNum + ')"/>'
      + '<path d="M0 34h' + w + '" stroke="#4f6b4a" stroke-width="4"/>' + plotSvg + '</svg>'
      + '<div class="ba-legend"><span>turf</span><span>' + plots.length + ' plots</span><span>4 ft</span></div>'
      + '<div class="ba-rows">' + rows
      + '<div class="ba-row"><span>Wrong plots dug</span><b id="ba-r-wrong">' + s.wrong + '</b></div></div>'
      + '<div class="ba-shieldbox' + (s.won ? ' on' : '') + '" id="ba-shieldbox">'
      + '<div class="lbl">The Envelopes</div>'
      + '<div class="val" id="ba-shieldval">' + _esc(s.shieldVal) + '</div>'
      + '<div class="holder"' + (s.won && sh.holder ? '' : ' hidden') + ' id="ba-holder">'
      + (sh.holder ? _face(sh.holder) + '<span>' + _esc(sh.holder) + ' holds it until the next murder</span>' : '')
      + '</div>'
      + '<div class="cost" id="ba-shieldcost">' + _esc(s.shieldCost) + '</div></div>'
      + '<div class="ba-pot">'
      + '<div class="r"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="r"><span>Out before the bell</span><b id="ba-pot-n">' + (s.shown ? s.upCount + ' of ' + s.coffins : '&mdash;') + '</b></div>'
      + '<div class="r"><span>Earned today</span><b id="ba-pot-e">' + (s.shown ? _gbp(s.earned) : '&mdash;') + '</b></div>'
      + '<div class="big" id="ba-pot-a">' + _gbp(s.potAfter) + '</div></div></div>';
  },

  sideStates(v, total) {
    const pr = _prog(v);
    const plots = v.tally.plots || [];
    const clock = v.tally.clock || 45;
    const used = Math.max(0, ...Object.values(v.tally.minutes || {}), 0);
    const order = v.tally.order || [];
    const coffins = plots.filter(p => p.kind === 'coffin').length;
    const relic = _relicStep(v);
    const sh = v.shield || null;
    const out = [];
    for (let n = 0; n <= total; n++) {
      const c1 = _frac(n, pr[0].start, pr[0].end);
      const c2 = _frac(n, pr[1] ? pr[1].start : total, pr[1] ? pr[1].end : total);
      const c3 = _frac(n, pr[2] ? pr[2].start : total, pr[2] ? pr[2].end : total);
      // PHASE I: clue plots open, in plot order; wrong plots are revealed once
      // the phase is over, because the cards that name them are in it.
      const clues = plots.map((p, i) => ({ p, i })).filter(x => x.p.kind === 'clue');
      const cluesOpen = Math.round(clues.length * c1);
      const plot = plots.map(() => '');
      clues.slice(0, cluesOpen).forEach(x => { plot[x.i] = 'dug'; });
      if (c1 >= 1) plots.forEach((p, i) => { if (p.dugBy) plot[i] = 'dug wrong'; });
      // PHASE II: the rescued coffins are FOUND as the lids are read.
      const found = Math.round(order.length * c2);
      order.slice(0, found).forEach(o => {
        const i = plots.findIndex(p => p.who === o.who);
        if (i >= 0) plot[i] = (plot[i] ? plot[i] + ' ' : '') + 'found';
      });
      if (sh && sh.searcher && relic >= 0 && n > relic) {
        const i = plots.findIndex(p => p.who === sh.searcher);
        if (i >= 0 && !/found/.test(plot[i])) plot[i] = (plot[i] ? plot[i] + ' ' : '') + 'found';
        if (i >= 0) plot[i] += ' lit';
      }
      // PHASE III: up, in the order they came up.
      const upN = Math.round(order.length * c3);
      const up = order.slice(0, upN).map(o => o.who);
      up.forEach(who => { const i = plots.findIndex(p => p.who === who); if (i >= 0) plot[i] += ' up'; });
      const done = n >= total;
      const left = done ? Object.values(v.tally.left || {}).flat() : [];
      const rows = v.teams.map(t => {
        const b = (t.buried || []).length;
        if (!b) return 'digging';
        return up.filter(w => (t.buried || []).includes(w)).length + ' of ' + b + ' up';
      });
      const wrong = c1 >= 1 ? Object.values(v.tally.wrong || {}).reduce((a, x) => a + x, 0) : 0;
      const mins = Math.round(clock - used * Math.min(1, n / Math.max(1, total)));
      const time = String(Math.max(0, done ? clock - used : mins)).padStart(2, '0') + ':00';
      const seen = sh && sh.searcher && relic >= 0 && n > relic;
      const won = seen && sh.found;
      const shieldVal = !sh || sh.offered === false ? 'no riddles under the lids today'
        : won ? sh.holder + ' · solved the riddle'
          : seen ? sh.searcher + ' asked their team for more time'
            : 'sealed; nobody above ground knows';
      const shieldCost = seen
        ? ('cost ' + (sh.delay || 0) + ' minutes of digging'
          + (won ? ' · seen by ' + (sh.witnesses ? sh.witnesses.length : 0) : ''))
        : '';
      const earned = done ? v.earned : Math.round(v.earned * (up.length / Math.max(1, order.length)) * c3);
      out.push({ plot, rows, out: up, left, wrong, time, won, shieldVal, shieldCost,
        upCount: up.length, coffins, earned, potAfter: v.potBefore + earned, shown: n > 0 });
    }
    return out;
  },

  paintSide(prefix, states, n) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const $ = id => document.getElementById(id);
    s.plot.forEach((cls, i) => { const g = $('ba-plot-' + i); if (g) g.setAttribute('class', 'ba-plot ' + cls); });
    s.rows.forEach((r, i) => { const el = $('ba-r-' + i); if (el) el.textContent = r; });
    document.querySelectorAll('.ba-team-faces .under').forEach(el => {
      const name = el.getAttribute('alt');
      el.classList.toggle('out', s.out.includes(name));
      el.classList.toggle('left', s.left.includes(name));
    });
    const t = $('ba-time'); if (t) t.textContent = s.time;
    const bell = $('ba-bell');
    if (bell) { bell.classList.remove('ring'); void bell.getBoundingClientRect(); if (n > 0) bell.classList.add('ring'); }
    const wr = $('ba-r-wrong'); if (wr) wr.textContent = s.wrong;
    const sb = $('ba-shieldbox'); if (sb) sb.classList.toggle('on', s.won);
    const sv = $('ba-shieldval'); if (sv) sv.textContent = s.shieldVal;
    const sc = $('ba-shieldcost'); if (sc) sc.textContent = s.shieldCost;
    const h = $('ba-holder'); if (h) h.hidden = !(s.won && h.children.length);
    const pn = $('ba-pot-n'); if (pn) pn.textContent = s.shown ? s.upCount + ' of ' + s.coffins : '—';
    const pe = $('ba-pot-e'); if (pe) pe.textContent = s.shown ? _gbp(s.earned) : '—';
    const pa = $('ba-pot-a'); if (pa) pa.textContent = _gbp(s.potAfter);
  },

  atmosphere: () => '<div class="ba-sky"></div>'
    + '<svg class="ba-yews" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">'
    + '<path d="M0 300 V210 C40 160 70 140 90 90 C110 140 130 170 150 205 C170 150 200 120 220 60 C245 130 270 170 300 215 C320 180 345 160 360 120 C380 170 400 190 430 230 L430 300 Z" fill="#070a09"/>'
    + '<path d="M760 300 V220 C790 180 810 150 830 100 C850 150 880 180 905 210 C930 160 950 130 975 70 C1000 140 1030 180 1060 220 C1085 185 1110 160 1130 115 C1150 170 1175 200 1200 225 V300 Z" fill="#070a09"/>'
    + '<g fill="#0b100e"><path d="M470 300 V246 a22 22 0 0 1 44 0 V300 Z"/><path d="M540 300 V252 h30 v48 Z"/>'
    + '<path d="M600 300 V236 h8 v-16 h8 v16 h8 v64 Z"/><path d="M660 300 V250 a18 18 0 0 1 36 0 V300 Z"/></g></svg>'
    + '<div class="ba-rain"></div>',

  css: `
@import url('https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@500;700;900&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Share+Tech+Mono&display=swap');
.ba-root{--ba-moss:#4f6b4a;--ba-moss-hi:#8fae7e;--ba-clay:#6b4f36;--ba-stone:#b9bdb4;--ba-bone:#ece6d6;
  --ba-lamp:#e8d27a;--ba-lamp-lo:#8c7a34;--ba-wrong:#b0543c;--ba-shield:#e9c65b;--cv-display:'Grenze Gotisch',serif;
  background:#0d1210;color:var(--ba-stone);font-family:'Crimson Pro',Georgia,serif;font-size:18px;line-height:1.55;
  padding-bottom:120px;position:relative;overflow:hidden}
.ba-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.ba-sky{position:absolute;inset:0;background:radial-gradient(40% 30% at 78% 12%,rgba(232,210,122,.16) 0%,transparent 70%),linear-gradient(180deg,#17201d 0%,#0f1513 45%,#0a0e0c 100%)}
.ba-yews{position:absolute;left:0;right:0;bottom:0;height:38%;width:100%;opacity:.55}
.ba-rain{position:absolute;inset:0;opacity:.18;background-image:repeating-linear-gradient(104deg,transparent 0 22px,rgba(185,189,180,.55) 22px 23px,transparent 23px 60px);background-size:220px 220px;animation:ba-rain 1.1s linear infinite}
@keyframes ba-rain{from{background-position:0 0}to{background-position:-40px 220px}}
.ba-shell{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:26px 16px 40px}
.ba-body{position:relative;z-index:2}
.ba-hero{position:relative;padding:34px 26px 26px;overflow:hidden;text-align:center;
  background:linear-gradient(170deg,#3b4441 0%,#262d2b 60%,#1b201f 100%);
  border-radius:120px 120px 6px 6px / 70px 70px 6px 6px;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.08),inset 0 -30px 60px rgba(0,0,0,.35),0 18px 40px rgba(0,0,0,.55)}
.ba-hero::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.35;background:
  radial-gradient(18px 12px at 12% 22%,var(--ba-moss) 0 60%,transparent 62%),radial-gradient(26px 16px at 88% 70%,var(--ba-moss) 0 60%,transparent 62%),
  radial-gradient(12px 9px at 70% 18%,var(--ba-moss-hi) 0 60%,transparent 62%),radial-gradient(30px 14px at 20% 88%,var(--ba-moss) 0 60%,transparent 62%)}
.ba-kicker{font:12px/1 'Share Tech Mono',monospace;letter-spacing:.34em;text-transform:uppercase;color:var(--ba-lamp)}
.ba-title{font-family:'Grenze Gotisch',serif;font-weight:900;color:var(--ba-bone);font-size:clamp(46px,9vw,96px);line-height:.9;margin:.12em 0 .1em}
.ba-title span{color:var(--ba-lamp)}
.ba-sub{color:#a6aca2;max-width:58ch;margin:0 auto;font-style:italic}
.ba-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:18px}
.ba-chip{font:11.5px/1 'Share Tech Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--ba-stone);border:1px solid #56605b;padding:6px 11px;background:rgba(0,0,0,.28);border-radius:3px}
.ba-chip.shield{border-color:var(--ba-shield);color:var(--ba-shield)}
.ba-hero .mb-roster{justify-content:center;text-align:left}
.ba-grid{display:grid;grid-template-columns:minmax(0,1fr) 318px;gap:22px;margin-top:24px;align-items:start}
@media(max-width:920px){.ba-grid{grid-template-columns:minmax(0,1fr)}}
.ba-brief{background:rgba(11,15,13,.86);border:1px solid #29322e;border-top:4px solid var(--ba-moss);padding:22px 20px 18px}
.ba-brief h2,.ba-phase-name{font-family:'Grenze Gotisch',serif;font-weight:700;color:var(--ba-bone)}
.ba-brief h2{font-size:32px;margin:0 0 4px}
.ba-staging{font-style:italic;color:#88918a;border-bottom:1px dashed #2f3935;padding-bottom:12px;margin:0 0 14px}
.ba-beat{display:flex;gap:12px;margin:0 0 10px}
.ba-beat p{margin:0}
.ba-beat::before{flex:0 0 22px;font:12px/1.9 'Share Tech Mono',monospace;color:#5d6a63}
.ba-beat.do::before{content:'~'}
.ba-beat.say::before{content:'\\201C';font:700 30px/1 'Grenze Gotisch',serif;color:var(--ba-lamp-lo)}
.ba-beat.do p{color:#8c958e;font-style:italic}
.ba-beat.say p{color:var(--ba-bone)}
.ba-beat.shield p{color:var(--ba-shield)}
.ba-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;padding-top:12px;border-top:1px dashed #2f3935}
.ba-rule{font:11px/1 'Share Tech Mono',monospace;letter-spacing:.08em;color:#8d968f;border:1px solid #33403a;padding:5px 8px;border-radius:2px}
.ba-rule b{color:var(--ba-moss-hi);font-weight:400;margin-right:4px;text-transform:uppercase}
.ba-phase{margin-top:26px}
.ba-phase-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;border-bottom:1px solid #2d3632;padding-bottom:6px}
.ba-phase-n{font:13px/1 'Share Tech Mono',monospace;color:var(--ba-lamp);border:1px solid var(--ba-lamp-lo);padding:4px 7px;border-radius:2px}
.ba-phase-name{font-size:34px;line-height:1}
.ba-phase-stats{margin-left:auto;display:flex;gap:6px}
.ba-stat{font:11px/1 'Share Tech Mono',monospace;font-style:normal;text-transform:uppercase;letter-spacing:.12em;color:#9aa39c;background:#1a211e;padding:5px 8px;border-radius:2px}
.ba-setting{font-style:italic;color:#7f8982;margin:8px 0 12px}
.ba-card{position:relative;margin:0 0 12px;padding:14px 16px 13px 64px;background:linear-gradient(180deg,rgba(33,40,37,.95),rgba(20,25,23,.95));
  border:1px solid #2c3531;border-left:3px solid #3b4742;border-radius:3px;opacity:0;transform:translateY(22px);clip-path:inset(100% 0 0 0);
  transition:opacity .35s ease,transform .55s cubic-bezier(.2,.9,.25,1.15),clip-path .55s ease}
.ba-card.on,.ba-card[data-on="1"]{opacity:1;transform:none;clip-path:inset(0 0 0 0)}
.ba-card.good{border-left-color:var(--ba-moss-hi)}
.ba-card.bad{border-left-color:var(--ba-wrong)}
.ba-card.social{border-left-color:var(--ba-lamp)}
.ba-card.relic{border:1px solid var(--ba-shield);box-shadow:0 0 22px rgba(233,198,91,.14)}
.ba-ico{position:absolute;left:14px;top:14px;width:36px;height:36px}
.ba-ico svg{width:100%;height:100%;display:block}
.ba-tag{float:right;font:11px/1 'Share Tech Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#8d968f;margin:3px 0 0 10px}
.ba-card.good .ba-tag{color:var(--ba-moss-hi)} .ba-card.bad .ba-tag{color:var(--ba-wrong)} .ba-card.relic .ba-tag{color:var(--ba-shield)}
.ba-who{font:600 15px/1.2 'Crimson Pro',serif;letter-spacing:.06em;text-transform:uppercase;color:var(--ba-bone)}
.ba-who .cv-av{border:2px solid #3c4a43}
.ba-card.good .ba-who .cv-av{border-color:var(--ba-moss-hi)} .ba-card.bad .ba-who .cv-av{border-color:var(--ba-wrong)}
.ba-card.relic .ba-who .cv-av{border-color:var(--ba-shield)}
.ba-card .mb-avs .cv-av{width:34px;height:34px}
.ba-txt{margin-top:6px}
.ba-conf{margin-top:10px;padding:9px 12px;background:rgba(0,0,0,.28);border-left:2px solid var(--ba-lamp-lo);font-style:italic;color:#cfd2c8}
.ba-conf small{display:block;font:11px/1.4 'Share Tech Mono',monospace;font-style:normal;letter-spacing:.14em;text-transform:uppercase;color:var(--ba-lamp)}
.ba-fx{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.ba-fx span{font:11px/1 'Share Tech Mono',monospace;color:#9aa39c;border:1px dashed #3b4742;padding:4px 7px;border-radius:2px}
.ba-summary{margin-top:24px;padding:18px 20px;border:1px solid #2d3632;background:rgba(11,15,13,.86);transition:opacity .4s}
.ba-summary small{display:block;font:11px/1.4 'Share Tech Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--ba-lamp);margin-bottom:4px}
.ba-side{position:sticky;top:60px}
.ba-panel{background:rgba(9,12,11,.92);border:1px solid #29322e;padding:14px}
.ba-panel h3{font:700 26px/1 'Grenze Gotisch',serif;color:var(--ba-bone);margin:0 0 10px}
.ba-clock{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.ba-bell{width:46px;height:46px;transform-origin:50% 8%}
.ba-bell.ring{animation:ba-ring .9s ease-in-out}
@keyframes ba-ring{0%,100%{transform:rotate(0)}25%{transform:rotate(16deg)}60%{transform:rotate(-12deg)}85%{transform:rotate(5deg)}}
.ba-time{font:30px/1 'Share Tech Mono',monospace;color:var(--ba-lamp)}
.ba-time small{display:block;font-size:11px;letter-spacing:.18em;color:#6f7a73;text-transform:uppercase;margin-top:4px}
.ba-ground{width:100%;display:block;border-radius:2px}
.ba-pn{font:10px 'Share Tech Mono',monospace;fill:#66716a}
.ba-plot .soil{transition:transform .8s ease,opacity .8s ease}
.ba-plot.dug .soil{transform:translateY(-14px);opacity:.25}
.ba-plot .lid{stroke:#1b1510;transition:stroke .5s}
.ba-plot.found .lid{stroke:var(--ba-lamp)}
.ba-plot .coffin{transition:transform .9s cubic-bezier(.3,1.3,.5,1)}
.ba-plot.up .coffin{transform:translateY(-30px)}
.ba-plot .spoil{opacity:0;transition:opacity .5s}
.ba-plot.wrong .spoil{opacity:1}
.ba-plot .face{opacity:0;transition:opacity .6s}
.ba-plot.found .face,.ba-plot.up .face{opacity:1}
.ba-plot .lamp{opacity:0;transition:opacity .6s}
.ba-plot.lit .lamp{opacity:1}
.ba-legend{display:flex;justify-content:space-between;font:10.5px/1 'Share Tech Mono',monospace;letter-spacing:.1em;color:#66716a;text-transform:uppercase;margin:6px 0 12px}
.ba-rows{border-top:1px dashed #2f3935;padding-top:4px}
.ba-row{display:flex;justify-content:space-between;align-items:center;font-size:15.5px;padding:6px 0 3px}
.ba-row b{font:13px/1 'Share Tech Mono',monospace;color:var(--ba-bone);font-weight:400}
.ba-av{width:28px;height:28px;border-radius:50%;object-fit:cover;object-position:50% 20%;background:#1a211e;border:1.5px solid #3c4a43;box-shadow:0 2px 6px rgba(0,0,0,.5)}
.ba-team{padding:7px 0;border-bottom:1px dashed #232b27}
.ba-team-head{display:flex;justify-content:space-between;align-items:center;font-size:15.5px}
.ba-team-head b{font:13px/1 'Share Tech Mono',monospace;color:var(--ba-bone);font-weight:400}
.ba-team-head .sw,.ba-row .sw{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px}
.ba-team-faces{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-top:6px}
.ba-team-faces .sep{width:1px;height:22px;background:#3b4742;margin:0 4px}
.ba-team-faces .under{filter:grayscale(1) brightness(.45);border-style:dashed;transition:filter .6s}
.ba-team-faces .under.out{filter:none;border-style:solid;border-color:var(--ba-lamp)}
.ba-team-faces .under.left{border-color:var(--ba-wrong)}
.ba-shieldbox{margin-top:12px;padding:11px 12px;border:1px dashed #4b554f;transition:all .5s}
.ba-shieldbox .lbl{font:11px/1 'Share Tech Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#6f7a73}
.ba-shieldbox .val{margin-top:5px;color:#8d968f;font-style:italic}
.ba-shieldbox .cost{margin-top:4px;font:12px/1.35 'Share Tech Mono',monospace;color:#8d968f}
.ba-shieldbox.on{border:1px solid var(--ba-shield);box-shadow:0 0 18px rgba(233,198,91,.16)}
.ba-shieldbox.on .lbl,.ba-shieldbox.on .val{color:var(--ba-shield);font-style:normal}
.ba-shieldbox .holder{display:flex;align-items:center;gap:10px;margin-top:6px}
.ba-shieldbox .holder[hidden]{display:none}
.ba-shieldbox .holder .ba-av{width:42px;height:42px;border-color:var(--ba-shield);box-shadow:0 0 12px rgba(233,198,91,.45)}
.ba-pot{margin-top:12px;border-top:1px solid #2d3632;padding-top:10px}
.ba-pot .r{display:flex;justify-content:space-between;font-size:15px;color:#8d968f}
.ba-pot .r b{font:13px/1.6 'Share Tech Mono',monospace;color:var(--ba-stone);font-weight:400}
.ba-pot .big{font:32px/1.1 'Share Tech Mono',monospace;color:var(--ba-lamp);text-align:right;margin-top:4px}
.ba-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:center;align-items:center;gap:14px;
  padding:12px 16px;background:linear-gradient(0deg,#070a09 60%,rgba(7,10,9,0));flex-wrap:wrap}
.ba-btn{font:600 16px/1 'Crimson Pro',serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;padding:12px 22px;color:#11150f;
  background:var(--ba-lamp);border:0;border-radius:2px;box-shadow:0 0 18px rgba(232,210,122,.25)}
.ba-btn[disabled]{opacity:.4;cursor:default}
.ba-btn.ghost{background:transparent;color:var(--ba-stone);border:1px solid #4b554f;box-shadow:none}
.ba-counter{font:13px/1 'Share Tech Mono',monospace;color:#7f8982;letter-spacing:.1em}
@media(prefers-reduced-motion:reduce){.ba-root *,.ba-root *::before,.ba-root *::after{animation:none !important;transition:none !important}.ba-card{opacity:1;transform:none;clip-path:none}.ba-rain{display:none}}
`,
};

const ICONS = {
  spade: '<path d="M17 3h2v17h-2z" fill="#b9bdb4"/><path d="M11 20h14l-2 10c-1 3-9 3-10 0z" fill="#8c958e" stroke="#ece6d6" stroke-width=".8"/><rect x="14" y="1" width="8" height="3" rx="1.5" fill="#6b4f36"/>',
  clue: '<rect x="7" y="6" width="22" height="26" rx="2" fill="#ece6d6"/><path d="M11 12h14M11 16h14M11 20h9" stroke="#3a2d22" stroke-width="1.4"/><circle cx="24" cy="26" r="4" fill="#b0543c"/>',
  wrong: '<path d="M4 30c4-10 9-14 14-14s10 4 14 14z" fill="#6b4f36"/><path d="M13 9l10 10M23 9L13 19" stroke="#b0543c" stroke-width="2.4" stroke-linecap="round"/>',
  coffin: '<path d="M12 3h12l5 8-3 22H10L7 11z" fill="#3a2d22" stroke="#ece6d6" stroke-width="1"/><path d="M18 9v12M14 13h8" stroke="#e8d27a" stroke-width="1.4"/>',
  rope: '<path d="M8 4c6 6-6 10 0 16s-6 10 0 14M28 4c-6 6 6 10 0 16s6 10 0 14" fill="none" stroke="#b69770" stroke-width="2.2"/><rect x="6" y="28" width="24" height="6" rx="1" fill="#3a2d22"/>',
  lamp: '<path d="M13 8h10l2 4H11z" fill="#5d6a6e"/><rect x="12" y="12" width="12" height="16" rx="2" fill="rgba(232,210,122,.25)" stroke="#5d6a6e" stroke-width="1.4"/><path d="M18 15c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7z" fill="#e8d27a"/><rect x="11" y="28" width="14" height="3" fill="#5d6a6e"/>',
  seal: '<circle cx="18" cy="18" r="12" fill="#e9c65b"/><circle cx="18" cy="18" r="8.5" fill="none" stroke="#8c7a34" stroke-width="1.4"/><path d="M18 11l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" fill="#8c7a34"/>',
};

export default BURIED;
