// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-theme-beacon-lighting.js — peat-black water and fire
// ══════════════════════════════════════════════════════════════════════
//
// The Beacon Lighting THEME for js/vp-tr/mission-bespoke.js, reproducing the
// approved mockup (mockup/mockup-tr-beacon-lighting.html): a loch at night
// seen from above, faces tied to poles, bottles on the shore, a shield-shaped
// beacon on the raft, three Shield slots, and a fire only when everybody is
// out of the water.
//
// THE SIDEBAR KNOWS ONLY WHAT HAS BEEN SHOWN. Ropes come off during phase I,
// bottles light during phase II, people come ashore during phase III, a
// Shield slot fills on the card that shows it being taken, and the fire lights
// on the last reveal and only if the record says it burned.
import { players } from '../core.js';
import { playerAvatarUrl } from '../players.js';

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
const _gbp = n => '£' + Number(n || 0).toLocaleString('en-GB');
const TEAM_COL = ['#8f6fb3', '#c9a877'];
const _url = name => playerAvatarUrl((players || []).find(p => p && p.name === name) || { name });
const _face = (name, cls) => '<img class="bl-av' + (cls ? ' ' + cls : '') + '" src="' + _esc(_url(name))
  + '" alt="' + _esc(name) + '" title="' + _esc(name) + '" onerror="this.style.visibility=&quot;hidden&quot;">';
const _frac = (n, a, b) => (b > a ? Math.max(0, Math.min(1, (n - a) / (b - a))) : (n >= b ? 1 : 0));

function _prog(v) {
  let s = 0;
  return v.phases.map(p => { const o = { start: s, end: s + p.cards.length }; s += p.cards.length; return o; });
}
/** Stream index of each relic card, in order: the hunts in slot order. */
function _relicSteps(v) {
  const out = [];
  let i = 0;
  for (const p of v.phases) for (const c of p.cards) { if (c.relic) out.push(i); i++; }
  return out;
}

const TAGS = {
  'poles:good': 'Free first', 'poles:bad': 'Stuck', 'poles:steady': 'Free',
  'bottles:good': 'Read it', 'bottles:bad': 'Wrong way', 'bottles:steady': 'Carried',
  'beacon:good': 'Last piece', 'beacon:bad': 'Last in', 'beacon:steady': 'Ashore',
};
const ICONS = {
  rope: '<rect x="16" y="2" width="4" height="32" rx="2" fill="#3b5560"/><path d="M8 12c6-4 14-4 20 0M8 18c6-4 14-4 20 0M8 24c6-4 14-4 20 0" fill="none" stroke="#c9a877" stroke-width="2.2"/>',
  cut: '<rect x="16" y="2" width="4" height="32" rx="2" fill="#3b5560"/><path d="M6 14c4-3 8-3 10-2M20 12c3-1 7-1 10 2" fill="none" stroke="#c9a877" stroke-width="2.2"/><path d="M9 26l6-6M15 26l-6-6" stroke="#7fb3a0" stroke-width="2"/>',
  bottle: '<path d="M15 3h6v6l3 5v17a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V14l3-5z" fill="#2e5a4a" stroke="#aab7bc" stroke-width=".8"/><rect x="14" y="17" width="8" height="9" fill="#f1eadb"/><path d="M15 20h6M15 23h4" stroke="#4d3a66" stroke-width="1"/>',
  piece: '<path d="M6 6h24v12c0 8-6 12-12 14C12 30 6 26 6 18z" fill="#6d4d2c" stroke="#c9a877" stroke-width="1.2"/><path d="M18 6v26M6 16h24" stroke="#c9a877" stroke-width="1" stroke-dasharray="2 2"/>',
  shield: '<path d="M18 3l12 4v9c0 8-5 14-12 17C11 30 6 24 6 16V7z" fill="#f2cc5b" stroke="#8a6b1a" stroke-width="1.2"/><path d="M18 9v18M11 16h14" stroke="#8a6b1a" stroke-width="1.4"/>',
  swim: '<path d="M2 24c4-3 8 3 12 0s8 3 12 0 8 3 10 1" fill="none" stroke="#4f8fa6" stroke-width="2"/><circle cx="20" cy="15" r="4" fill="#f1eadb"/><path d="M8 20l10-4 8 2" stroke="#f1eadb" stroke-width="2.2" fill="none"/>',
  fire: '<path d="M18 3c6 7 10 11 10 18a10 10 0 0 1-20 0c0-5 3-8 5-11 1 4 3 5 4 5-1-5-1-8 1-12z" fill="#ff5a1f"/><path d="M18 16c3 3 5 5 5 8a5 5 0 0 1-10 0c0-3 2-5 5-8z" fill="#ffe08a"/>',
};
const SHAPE = [[-30, 0, 20, 16], [-10, 0, 20, 16], [10, 0, 20, 16], [-30, 16, 20, 16],
  [-10, 16, 20, 16], [10, 16, 20, 16], [-20, 32, 20, 14], [0, 32, 20, 14]];
const SLOT_POS = { 'water-a': [70, 42], land: [150, 226], 'water-b': [252, 62] };
const SLOT_WORD = { water: 'in the water', land: 'on land' };

export const BEACON = {
  id: 'beacon-lighting', prefix: 'bl', ownShield: true,
  shieldBeat: /\bShields?\b|not out of it/,
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: () => '<h1 class="bl-title">Beacon <span>Lighting</span></h1>',
  sub: () => 'Every one of you starts tied to a pole in the loch. Forty minutes to get free, build the beacon from the plans in the bottles, get out of the water, and set it on fire.',
  chips: v => [
    { text: v.teams.map(t => t.name).join(' · ') },
    { text: (v.tally.clock || 40) + ' minutes' },
    { text: 'Money only if it burns' },
    v.tally.offered === false ? { text: 'No Shields today' }
      : { text: 'Three Shields · two in the water, one on land', shield: true },
  ],
  phaseNum: roman => '<span class="bl-phase-n">' + roman + '</span>',
  cardClass: c => (c.relic ? 'relic'
    : /went up|torch back|clock ran out/.test(c.text) && c.isSocial ? 'fire'
      : (c.isSocial ? 'social ' : '') + (c.tone === 'bad' ? 'bad' : c.tone === 'good' ? 'good' : 'plain')),
  cardTag: (c, ph) => (c.relic ? (c.behaviour === 'impressive' ? 'Shield' : 'Came back empty')
    : /went up/.test(c.text) ? 'Lit' : /clock ran out/.test(c.text) ? 'Not lit'
      : c.isSocial ? _cap(c.behaviour || 'moment')
        : (TAGS[ph.id + ':' + c.tone] || _cap(c.kind))),
  icon: (c, ph) => {
    let ic = 'piece';
    if (c.relic) ic = /land|boathouse|bottle/.test(c.text) ? 'shield' : 'swim';
    else if (/went up|clock ran out/.test(c.text)) ic = 'fire';
    else if (ph.id === 'poles') ic = c.tone === 'bad' ? 'rope' : 'cut';
    else if (ph.id === 'bottles') ic = c.tone === 'good' ? 'bottle' : 'piece';
    return '<span class="bl-ico"><svg viewBox="0 0 36 36" aria-hidden="true">' + ICONS[ic] + '</svg></span>';
  },

  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const e = v.epNum;
    const poles = [];
    v.teams.forEach((t, ti) => t.members.forEach((who, i) => {
      poles.push({ who, x: ti === 0 ? 20 + (i % 4) * 26 : 202 + (i % 4) * 26, y: 110 + Math.floor(i / 4) * 26 });
    }));
    const poleSvg = poles.map((p, i) => '<g class="bl-pole ' + (s.pole[p.who] || '') + '" id="bl-p-' + e + '-' + i
      + '" data-who="' + _esc(p.who) + '" transform="translate(' + p.x + ',' + p.y + ')">'
      + '<circle class="ring" r="11" fill="#0c1a20" stroke="#c9a877" stroke-width="2"/>'
      + '<image class="face" href="' + _esc(_url(p.who)) + '" x="-9" y="-9" width="18" height="18" clip-path="url(#bl-cf-' + e + ')" preserveAspectRatio="xMidYMin slice"/>'
      + '<path class="rope" d="M-11 -3 L11 3 M-11 3 L11 -3" stroke="#c9a877" stroke-width="1.6"/></g>').join('');
    const bottles = Array.from({ length: 6 }, (_, b) => '<rect class="bl-bottle' + (b < s.bottles ? ' read' : '')
      + '" id="bl-b-' + e + '-' + b + '" x="' + (40 + b * 42) + '" y="212" width="7" height="16" rx="2" fill="#2e5a4a"/>').join('');
    const pieces = SHAPE.map((sh, i) => '<rect class="bl-piece' + (i < s.pieces ? ' set' : '') + '" id="bl-pc-' + e + '-' + i
      + '" x="' + sh[0] + '" y="' + sh[1] + '" width="' + sh[2] + '" height="' + sh[3] + '" rx="2"/>').join('');
    const slots = (v.tally.shields || []);
    const markers = slots.map((sl, i) => {
      const pos = SLOT_POS[sl.slot] || [150, 120];
      return '<g class="bl-sh' + (s.taken[i] ? ' taken' : '') + '" id="bl-sm-' + e + '-' + i + '" transform="translate(' + pos[0] + ',' + pos[1] + ')">'
        + '<path class="gem" d="M0 -10l8 3v6c0 5-3 9-8 11-5-2-8-6-8-11v-6z" fill="#f2cc5b" stroke="#8a6b1a"/>'
        + (sl.holder ? '<image class="face" href="' + _esc(_url(sl.holder)) + '" x="-8" y="-8" width="16" height="16" clip-path="url(#bl-cf-' + e + ')"/>' : '')
        + '</g>';
    }).join('');
    const rows = v.teams.map((t, ti) => '<div class="bl-team"><div class="bl-team-head"><span><i class="sw" style="background:'
      + TEAM_COL[ti] + '"></i>' + _esc(t.name) + '</span><b id="bl-r-' + e + '-' + ti + '">' + _esc(s.rows[ti]) + '</b></div>'
      + '<div class="bl-team-faces">' + t.members.map(m => _face(m, s.pole[m] && /out/.test(s.pole[m]) ? 'dry'
        : s.pole[m] && /free/.test(s.pole[m]) ? 'wet' : 'tied')).join('') + '</div></div>').join('');
    const shieldRow = slots.map((sl, i) => '<div class="bl-shslot' + (s.taken[i] ? ' on' : '') + '" id="bl-s-' + e + '-' + i + '">'
      + '<svg viewBox="0 0 36 36">' + ICONS.shield + '</svg>'
      + (sl.holder ? _face(sl.holder) : '')
      + '<small>' + _esc(s.taken[i] && !sl.holder ? 'not found' : SLOT_WORD[sl.where] || sl.where) + '</small></div>').join('');
    return '<div class="bl-panel"><h3>The Loch</h3>'
      + '<div class="bl-clock"><div class="bl-fuse"><i id="bl-fuse-' + e + '" style="width:' + s.fuse + '%"></i></div>'
      + '<div class="bl-time" id="bl-time-' + e + '">' + s.time + '</div></div>'
      + '<svg class="bl-map" viewBox="0 0 300 250" role="img" aria-label="The loch from above">'
      + '<defs><radialGradient id="bl-lochg-' + e + '" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#12262e"/><stop offset="1" stop-color="#081116"/></radialGradient>'
      + '<clipPath id="bl-cf-' + e + '"><circle cx="0" cy="0" r="9"/></clipPath></defs>'
      + '<rect width="300" height="250" fill="url(#bl-lochg-' + e + ')"/>'
      + '<path d="M0 196 C60 186 110 204 160 194 C210 184 250 200 300 190 V250 H0 Z" fill="#2a2a22"/>'
      + '<path d="M0 196 C60 186 110 204 160 194 C210 184 250 200 300 190" fill="none" stroke="#5a5a44" stroke-width="2"/>'
      + bottles + poleSvg
      + '<g class="bl-beacon' + (s.lit ? ' lit' : '') + '" id="bl-beacon-' + e + '" transform="translate(150,70)">'
      + '<rect x="-40" y="-8" width="80" height="62" rx="4" fill="#3a2a1a" stroke="#6d4d2c"/>' + pieces
      + '<g class="flames">'
      + '<path class="bl-flame" d="M-38 46c-4-26 4-40 10-62 8 22 14 36 8 62z" fill="#ff5a1f"/>'
      + '<path class="bl-flame" d="M-20 46c-6-34 6-54 14-84 10 30 16 52 8 84z" fill="#ffb347"/>'
      + '<path class="bl-flame" d="M-4 46c-6-38 6-62 16-96 10 34 16 60 6 96z" fill="#ff5a1f"/>'
      + '<path class="bl-flame" d="M0 46c-4-26 4-42 10-64 7 24 11 40 4 64z" fill="#ffe08a"/>'
      + '<path class="bl-flame" d="M16 46c-4-30 4-48 12-74 8 26 12 46 4 74z" fill="#ffb347"/>'
      + '<path class="bl-flame" d="M28 46c-2-20 4-32 8-50 6 18 8 30 2 50z" fill="#ff5a1f"/></g></g>'
      + markers + '</svg>'
      + '<div class="bl-legend"><span>loch</span><span>raft · beacon</span><span>shore</span></div>'
      + '<div class="bl-teams">' + rows + '</div>'
      + (slots.length && v.tally.offered !== false ? '<div class="bl-shields"><div class="lbl">The Shields</div><div class="bl-shields-row">' + shieldRow + '</div></div>' : '')
      + '<div class="bl-pot">'
      + '<div class="r"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="r"><span>Pieces set</span><b id="bl-pot-p-' + e + '">' + s.pieces + ' of 8</b></div>'
      + '<div class="r"><span>Earned today</span><b id="bl-pot-e-' + e + '">' + (s.done ? _gbp(v.earned) : '&mdash;') + '</b></div>'
      + '<div class="big" id="bl-pot-a-' + e + '">' + _gbp(v.potBefore + (s.done ? v.earned : 0)) + '</div></div></div>';
  },

  sideStates(v, total) {
    const pr = _prog(v);
    const clock = v.tally.clock || 40;
    const used = Math.min(clock, v.tally.minutesUsed || clock);
    const relics = _relicSteps(v);
    const searchers = (v.tally.shields || []);
    const hunted = searchers.filter(s => s.searcher);
    const everyone = v.teams.flatMap(t => t.members);
    const lastIn = (searchers.find(s => s.slot === 'water-b') || {}).searcher || null;
    const out = [];
    for (let n = 0; n <= total; n++) {
      const c1 = _frac(n, pr[0].start, pr[0].end);
      const c2 = _frac(n, pr[1].start, pr[1].end);
      const c3 = _frac(n, pr[2].start, pr[2].end);
      const freeN = Math.round(everyone.length * c1);
      const order = [...(v.tally.freeOrder || []), ...everyone.filter(x => !(v.tally.freeOrder || []).includes(x))];
      const ashoreN = Math.round((everyone.length - (lastIn ? 1 : 0)) * c3);
      const ashoreOrder = order.filter(x => x !== lastIn);
      const pole = {};
      order.slice(0, freeN).forEach(x => { pole[x] = 'free'; });
      ashoreOrder.slice(0, ashoreN).forEach(x => { pole[x] = 'free out'; });
      if (n >= total && (v.tally.lit || !lastIn)) everyone.forEach(x => { pole[x] = 'free out'; });
      else if (n >= total && lastIn) pole[lastIn] = 'free';
      const taken = searchers.map(sl => {
        const k = hunted.indexOf(sl);
        return k >= 0 && relics[k] != null && n > relics[k];
      });
      const done = n >= total;
      const pieces = done ? (v.tally.piecesSet || 0)
        : Math.min(8, Math.round((v.tally.piecesSet || 0) * Math.max(0, c2 * 0.6 + c3 * 0.4)));
      const rows = v.teams.map(t => {
        const tied = t.members.filter(x => !pole[x]).length;
        const dry = t.members.filter(x => /out/.test(pole[x] || '')).length;
        return tied ? tied + ' tied' : dry + ' of ' + t.members.length + ' ashore';
      });
      const left = Math.round(clock - used * Math.min(1, n / Math.max(1, total)));
      out.push({ pole, taken, pieces, bottles: Math.round(6 * c2), rows, done,
        lit: done && !!v.tally.lit,
        time: String(Math.max(0, left)).padStart(2, '0') + ':00',
        fuse: Math.max(1, Math.round(100 * left / clock)) });
    }
    return out;
  },

  paintSide(prefix, states, n) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    document.querySelectorAll('.bl-pole').forEach(g => {
      g.setAttribute('class', 'bl-pole ' + (s.pole[g.getAttribute('data-who')] || ''));
    });
    const root = document.querySelector('.bl-panel');
    if (!root) return;
    root.querySelectorAll('.bl-bottle').forEach((b, i) => b.setAttribute('class', 'bl-bottle' + (i < s.bottles ? ' read' : '')));
    root.querySelectorAll('.bl-piece').forEach((p, i) => p.setAttribute('class', 'bl-piece' + (i < s.pieces ? ' set' : '')));
    const beacon = root.querySelector('.bl-beacon');
    if (beacon) beacon.setAttribute('class', 'bl-beacon' + (s.lit ? ' lit' : ''));
    root.querySelectorAll('.bl-sh').forEach((g, i) => g.setAttribute('class', 'bl-sh' + (s.taken[i] ? ' taken' : '')));
    root.querySelectorAll('.bl-shslot').forEach((g, i) => g.classList.toggle('on', !!s.taken[i]));
    root.querySelectorAll('.bl-team').forEach((row, ti) => {
      const b = row.querySelector('b'); if (b) b.textContent = s.rows[ti];
      row.querySelectorAll('.bl-av').forEach(img => {
        const st = s.pole[img.getAttribute('alt')] || '';
        img.className = 'bl-av ' + (/out/.test(st) ? 'dry' : /free/.test(st) ? 'wet' : 'tied');
      });
    });
    const t = root.querySelector('.bl-time'); if (t) t.textContent = s.time;
    const f = root.querySelector('.bl-fuse i'); if (f) f.style.width = s.fuse + '%';
    const pp = root.querySelector('[id^="bl-pot-p-"]'); if (pp) pp.textContent = s.pieces + ' of 8';
  },

  atmosphere: () => '<div class="bl-water"></div>'
    + '<svg class="bl-hills" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">'
    + '<path d="M0 0 H1200 V120 C1100 150 1040 90 960 120 C880 150 820 60 720 100 C620 140 560 70 470 110 C380 150 300 80 200 120 C120 150 60 110 0 130 Z" fill="#050a0c"/>'
    + '<path d="M0 0 H1200 V70 C1080 100 980 40 860 80 C760 110 680 30 560 70 C460 100 360 40 240 80 C150 110 70 60 0 90 Z" fill="#0a151a" opacity=".8"/></svg>'
    + '<div class="bl-sparks"></div>',

  css: `
@import url('https://fonts.googleapis.com/css2?family=Uncial+Antiqua&family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Overpass+Mono:wght@400;600&display=swap');
.bl-root{--bl-heather:#8f6fb3;--bl-heather-lo:#4d3a66;--bl-bone:#f1eadb;--bl-mist:#aab7bc;--bl-flame:#ffb347;--bl-flame-hi:#ffe08a;
  --bl-ember:#ff5a1f;--bl-rope:#c9a877;--bl-shield:#f2cc5b;--bl-bad:#d0654c;--cv-display:'Uncial Antiqua',serif;
  background:#070d10;color:var(--bl-mist);font-family:'Alegreya Sans',sans-serif;font-size:18px;line-height:1.5;padding-bottom:120px;position:relative;overflow:hidden}
.bl-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.bl-water{position:absolute;inset:0;background:radial-gradient(60% 40% at 50% 100%,rgba(255,138,51,.18) 0%,transparent 70%),repeating-linear-gradient(178deg,rgba(170,183,188,.035) 0 2px,transparent 2px 26px),linear-gradient(180deg,#0a151a 0%,#070d10 70%)}
.bl-hills{position:absolute;left:0;right:0;top:0;height:30%;width:100%;opacity:.8}
.bl-sparks{position:absolute;inset:0;opacity:.7;background-image:radial-gradient(1.6px 1.6px at 20% 90%,var(--bl-flame),transparent),radial-gradient(1.2px 1.2px at 46% 80%,var(--bl-flame-hi),transparent),radial-gradient(1.8px 1.8px at 70% 95%,var(--bl-ember),transparent),radial-gradient(1.2px 1.2px at 85% 85%,var(--bl-flame),transparent);background-size:500px 500px;animation:bl-rise 14s linear infinite}
@keyframes bl-rise{from{background-position:0 0}to{background-position:40px -500px}}
.bl-shell{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:26px 16px 40px}
.bl-body{position:relative;z-index:2}
.bl-hero{position:relative;padding:32px 26px 24px;text-align:center;overflow:hidden;background:linear-gradient(180deg,rgba(18,38,46,.92),rgba(7,13,16,.95));border:1px solid #1d3540;border-radius:4px;box-shadow:0 20px 50px rgba(0,0,0,.6)}
.bl-hero::before{content:'';position:absolute;inset:8px;border:2px solid transparent;pointer-events:none;border-image:repeating-linear-gradient(45deg,var(--bl-heather-lo) 0 6px,transparent 6px 12px) 8}
.bl-hero::after{content:'';position:absolute;left:0;right:0;bottom:0;height:5px;background:linear-gradient(90deg,transparent,var(--bl-ember),var(--bl-flame-hi),var(--bl-ember),transparent);animation:bl-flick 2.6s ease-in-out infinite}
@keyframes bl-flick{0%,100%{opacity:.6}40%{opacity:1}70%{opacity:.8}}
.bl-kicker{font:12px/1 'Overpass Mono',monospace;letter-spacing:.34em;text-transform:uppercase;color:var(--bl-heather)}
.bl-title{font-family:'Uncial Antiqua',serif;font-weight:400;color:var(--bl-bone);font-size:clamp(40px,8vw,86px);line-height:1;margin:.16em 0 .08em;text-shadow:0 0 30px rgba(255,138,51,.25)}
.bl-title span{color:var(--bl-flame);text-shadow:0 0 22px rgba(255,138,51,.7)}
.bl-sub{color:#93a4aa;max-width:58ch;margin:0 auto;font-style:italic}
.bl-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}
.bl-chip{font:11px/1 'Overpass Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--bl-mist);border:1px solid #28424c;padding:6px 11px;background:rgba(0,0,0,.35);border-radius:20px}
.bl-chip.shield{border-color:var(--bl-shield);color:var(--bl-shield)}
.bl-hero .mb-roster{justify-content:center;text-align:left}
.bl-hero .mb-rname{color:var(--bl-heather);font-family:'Overpass Mono',monospace}
.bl-av{width:28px;height:28px;border-radius:50%;object-fit:cover;object-position:50% 20%;background:#12262e;border:1.5px solid #28424c;box-shadow:0 2px 8px rgba(0,0,0,.6);display:inline-block;vertical-align:middle}
.bl-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px;margin-top:24px;align-items:start}
@media(max-width:940px){.bl-grid{grid-template-columns:minmax(0,1fr)}}
.bl-brief{background:rgba(7,13,16,.88);border:1px solid #1d3540;border-left:4px solid var(--bl-heather);padding:20px 20px 16px}
.bl-brief h2,.bl-phase-name{font-family:'Uncial Antiqua',serif;font-weight:400;color:var(--bl-bone)}
.bl-brief h2{font-size:30px;margin:0 0 4px}
.bl-staging{font-style:italic;color:#7f9095;border-bottom:1px solid #1d3540;padding-bottom:12px;margin:8px 0 14px}
.bl-beat{margin:0 0 11px}
.bl-beat p{margin:0}
.bl-beat.do p{font:14px/1.5 'Overpass Mono',monospace;color:#6f8288}
.bl-beat.say p{color:var(--bl-bone);padding-left:14px;border-left:2px solid var(--bl-heather-lo)}
.bl-beat.shield p{border-left-color:var(--bl-shield);color:#fbe7b2}
.bl-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.bl-rule{font:10.5px/1 'Overpass Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#7f9095;border:1px solid #28424c;padding:5px 8px;border-radius:12px}
.bl-rule b{color:var(--bl-flame);font-weight:600;margin-right:4px}
.bl-phase{margin-top:28px}
.bl-phase-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:6px;border-bottom:1px solid #1d3540}
.bl-phase-n{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;border:2px solid var(--bl-heather);font:600 14px/1 'Overpass Mono',monospace;color:var(--bl-bone);background:rgba(143,111,179,.15)}
.bl-phase-name{font-size:32px;line-height:1}
.bl-phase-stats{margin-left:auto;display:flex;gap:6px}
.bl-stat{font:10.5px/1 'Overpass Mono',monospace;font-style:normal;text-transform:uppercase;letter-spacing:.12em;color:#93a4aa;background:#0f2027;padding:5px 9px;border-radius:12px}
.bl-setting{font-style:italic;color:#7f9095;margin:8px 0 12px}
.bl-card{position:relative;margin:0 0 12px;padding:14px 16px 13px 64px;overflow:hidden;background:linear-gradient(180deg,rgba(18,38,46,.9),rgba(10,20,25,.94));border:1px solid #1d3540;border-radius:6px;opacity:0;transform:translateY(26px);transition:opacity .45s ease,transform .6s cubic-bezier(.2,.9,.25,1.1)}
.bl-card.on{opacity:1;transform:none}
.bl-card.good{border-left:3px solid #7fb3a0}
.bl-card.bad{border-left:3px solid var(--bl-bad)}
.bl-card.social{border-left:3px solid var(--bl-heather)}
.bl-card.relic{border:1px solid var(--bl-shield);box-shadow:0 0 24px rgba(242,204,91,.15)}
.bl-card.fire{border:1px solid var(--bl-flame);box-shadow:0 0 34px rgba(255,138,51,.25);background:linear-gradient(180deg,rgba(70,30,10,.85),rgba(20,12,8,.95))}
.bl-ico{position:absolute;left:14px;top:14px;width:36px;height:36px}
.bl-ico svg{width:100%;height:100%;display:block}
.bl-tag{float:right;font:10.5px/1 'Overpass Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#7f9095;margin:4px 0 0 10px}
.bl-card.good .bl-tag{color:#7fb3a0}.bl-card.bad .bl-tag{color:var(--bl-bad)}.bl-card.relic .bl-tag{color:var(--bl-shield)}.bl-card.fire .bl-tag{color:var(--bl-flame)}
.bl-who{font-weight:700;letter-spacing:.04em;color:var(--bl-bone)}
.bl-card .mb-avs .cv-av{width:34px;height:34px;border:2px solid #28424c}
.bl-card.good .cv-av{border-color:#7fb3a0}.bl-card.bad .cv-av{border-color:var(--bl-bad)}.bl-card.relic .cv-av{border-color:var(--bl-shield)}
.bl-txt{margin-top:6px}
.bl-conf{margin-top:10px;padding:9px 12px;background:rgba(0,0,0,.3);border-left:2px solid var(--bl-heather);font-style:italic;color:#d6dcdc;border-radius:0 4px 4px 0}
.bl-conf small{display:block;font:10.5px/1.4 'Overpass Mono',monospace;font-style:normal;letter-spacing:.14em;text-transform:uppercase;color:var(--bl-heather)}
.bl-fx{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.bl-fx span{font:10.5px/1 'Overpass Mono',monospace;color:#93a4aa;border:1px solid #28424c;padding:4px 8px;border-radius:12px}
.bl-summary{margin-top:24px;padding:18px 20px;border:1px solid #1d3540;background:rgba(7,13,16,.9);border-radius:6px;transition:opacity .4s}
.bl-summary small{display:block;font:10.5px/1.4 'Overpass Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--bl-flame);margin-bottom:4px}
.bl-side{position:sticky;top:60px}
.bl-panel{background:rgba(5,10,12,.94);border:1px solid #1d3540;border-radius:6px;padding:14px}
.bl-panel h3{font:400 26px/1 'Uncial Antiqua',serif;color:var(--bl-bone);margin:0 0 10px}
.bl-clock{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.bl-fuse{flex:1;height:8px;border-radius:4px;background:#1a2a30;overflow:hidden;position:relative}
.bl-fuse i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,var(--bl-rope),var(--bl-ember));transition:width .7s ease}
.bl-time{font:26px/1 'Overpass Mono',monospace;color:var(--bl-flame);min-width:78px;text-align:right}
.bl-map{width:100%;display:block;border-radius:4px}
.bl-pole .rope{transition:opacity .6s}
.bl-pole.free .rope{opacity:0}
.bl-pole .ring{transition:stroke .5s}
.bl-pole.free .ring{stroke:#7fb3a0}
.bl-pole.out .face{opacity:.35}
.bl-pole.out .ring{stroke:#3b4a4e}
.bl-bottle{transition:fill .5s}
.bl-bottle.read{fill:var(--bl-flame)}
.bl-sh .gem{transition:opacity .6s}
.bl-sh.taken .gem{opacity:.15}
.bl-sh .face{opacity:0;transition:opacity .6s}
.bl-sh.taken .face{opacity:1}
.bl-piece{fill:#1a2a30;stroke:#3b5560;stroke-width:1;transition:fill .6s}
.bl-piece.set{fill:#6d4d2c;stroke:var(--bl-rope)}
.bl-beacon .flames{opacity:0;transition:opacity .8s}
.bl-beacon.lit .flames{opacity:1}
.bl-beacon.lit .bl-piece.set{fill:var(--bl-ember)}
.bl-flame{animation:bl-lick 1.2s ease-in-out infinite alternate;transform-origin:50% 100%}
@keyframes bl-lick{from{transform:scaleY(.85) skewX(-4deg)}to{transform:scaleY(1.1) skewX(4deg)}}
.bl-legend{display:flex;justify-content:space-between;font:10px/1 'Overpass Mono',monospace;letter-spacing:.1em;color:#5a6a70;text-transform:uppercase;margin:6px 0 10px}
.bl-teams{border-top:1px solid #1d3540;padding-top:6px}
.bl-team{padding:7px 0;border-bottom:1px dashed #16282e}
.bl-team-head{display:flex;justify-content:space-between;align-items:center}
.bl-team-head b{font:12.5px/1 'Overpass Mono',monospace;color:var(--bl-bone);font-weight:400}
.bl-team-head .sw{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px}
.bl-team-faces{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.bl-team-faces .tied{filter:grayscale(.8) brightness(.55);border-style:dashed}
.bl-team-faces .wet{border-color:#4f8fa6}
.bl-team-faces .dry{border-color:#7fb3a0}
.bl-shields{margin-top:12px;padding:11px 12px;border:1px dashed #6b5b2a;border-radius:6px}
.bl-shields .lbl{font:10.5px/1 'Overpass Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a7a4a}
.bl-shields-row{display:flex;gap:10px;margin-top:8px}
.bl-shslot{flex:1;text-align:center;padding:8px 4px;border-radius:6px;background:rgba(0,0,0,.35);border:1px solid #2a2a20;transition:all .5s}
.bl-shslot svg{width:26px;height:26px;display:block;margin:0 auto}
.bl-shslot small{display:block;font:10px/1.3 'Overpass Mono',monospace;color:#7f9095;margin-top:4px}
.bl-shslot .bl-av{width:30px;height:30px;border-color:var(--bl-shield);display:none;margin:0 auto}
.bl-shslot.on{border-color:var(--bl-shield);box-shadow:0 0 14px rgba(242,204,91,.25)}
.bl-shslot.on svg{display:none}
.bl-shslot.on .bl-av{display:block}
.bl-shslot.on small{color:var(--bl-shield)}
.bl-pot{margin-top:12px;border-top:1px solid #1d3540;padding-top:10px}
.bl-pot .r{display:flex;justify-content:space-between;font-size:15px;color:#7f9095}
.bl-pot .r b{font:13px/1.6 'Overpass Mono',monospace;color:var(--bl-mist);font-weight:400}
.bl-pot .big{font:30px/1.1 'Overpass Mono',monospace;color:var(--bl-flame);text-align:right;margin-top:4px}
.bl-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 16px;background:linear-gradient(0deg,#04080a 60%,rgba(4,8,10,0))}
.bl-btn{font:700 15px/1 'Alegreya Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;padding:12px 24px;border-radius:24px;color:#1a0d05;background:linear-gradient(180deg,var(--bl-flame-hi),var(--bl-flame));border:0;box-shadow:0 0 20px rgba(255,138,51,.35)}
.bl-btn[disabled]{opacity:.4;cursor:default}
.bl-btn.ghost{background:transparent;color:var(--bl-mist);border:1px solid #28424c;box-shadow:none}
.bl-counter{font:12px/1 'Overpass Mono',monospace;color:#7f9095;letter-spacing:.1em}
@media(prefers-reduced-motion:reduce){.bl-root *,.bl-root *::before,.bl-root *::after{animation:none !important;transition:none !important}.bl-card{opacity:1;transform:none}.bl-sparks{display:none}}
`,
};

export default BEACON;
