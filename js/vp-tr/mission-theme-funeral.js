// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-theme-funeral.js — jet, crepe and lilies
// ══════════════════════════════════════════════════════════════════════
//
// The Funeral THEME for js/vp-tr/mission-bespoke.js, reproducing the approved
// mockup (mockup/mockup-tr-funeral.html): a full-width STAGE above the cards
// (the procession behind a glass hearse, then the coffins at the grave), and
// the procession sidebar.
//
// THE STAGE PLAYS EACH STEP IN TWO BEATS. On Next, the step's suspense runs
// (a clue card turning over, a heartbeat, coffins rattling) and the answer
// lands a second or so later. Reveal all and a fresh mount land straight on
// the end state. Every state is derived from the record; nothing is drawn
// before the card that shows it.
import { players } from '../core.js';
import { playerAvatarUrl } from '../players.js';

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const _cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
const _gbp = n => '£' + Number(n || 0).toLocaleString('en-GB');
const _url = name => playerAvatarUrl((players || []).find(p => p && p.name === name) || { name });
const _face = name => '<img class="fu-av" src="' + _esc(_url(name)) + '" alt="' + _esc(name) + '" title="'
  + _esc(name) + '" onerror="this.style.visibility=&quot;hidden&quot;">';

// Which card is which. Matched on the engine's own sentences (js/tr/missions/funeral.js).
const K = {
  clue: c => /^"The (one|name of the one) who is safe/.test(c.text || ''),
  solved: c => /carriage door opened/.test(c.text || ''),
  shake: c => /shook .* head before anyone/.test(c.text || ''),
  gate: c => /cemetery gate/.test(c.text || ''),
  line: c => /lined up at the graveside/.test(c.text || ''),
  first: c => /laid a lily on it/.test(c.text || ''),
  sure: c => /without looking at the others/.test(c.text || ''),
  argue: c => /argued in whispers/.test(c.text || ''),
  counted: c => /The lilies went down one at a time/.test(c.text || ''),
  open: c => /lid came off, and/.test(c.text || ''),
  back: c => /handed it back/.test(c.text || ''),
  dead: c => /^The last lid came off/.test(c.text || ''),
  grave: c => /stayed at the graveside/.test(c.text || ''),
};
const kindOf = c => Object.keys(K).find(k => k !== 'solved' && K[k](c)) || 'other';

const ICONS = {
  carriage: '<path d="M5 12h26v14H5z" fill="#111014" stroke="#b08d4a"/><path d="M8 15h20v8H8z" fill="#3a3641" opacity=".7"/><circle cx="11" cy="29" r="4" fill="none" stroke="#b08d4a" stroke-width="1.5"/><circle cx="25" cy="29" r="4" fill="none" stroke="#b08d4a" stroke-width="1.5"/><path d="M14 8h8l2 4H12z" fill="#6e4f86"/>',
  wrong: '<rect x="6" y="5" width="24" height="27" fill="#f4f1e8" stroke="#6e4f86" opacity=".6"/><path d="M11 12l14 14M25 12L11 26" stroke="#9b2d3c" stroke-width="2.6"/>',
  lily: '<path d="M18 34V18" stroke="#5a7a4a" stroke-width="2"/><path d="M18 18c-8-2-12-8-10-14 4 2 8 6 10 14z M18 18c8-2 12-8 10-14-4 2-8 6-10 14z M18 18c-3-6-3-12 0-16 3 4 3 10 0 16z" fill="#f4f1e8" stroke="#b7b3bd" stroke-width=".8"/>',
  shield: '<path d="M18 3l12 4v9c0 8-5 14-12 17C11 30 6 24 6 16V7z" fill="#efcb5f" stroke="#7b6224" stroke-width="1.2"/><path d="M18 26V14" stroke="#5a7a4a" stroke-width="1.6"/><path d="M18 14c-4-1-6-4-5-7 2 1 4 3 5 7z M18 14c4-1 6-4 5-7-2 1-4 3-5 7z" fill="#f4f1e8"/>',
  open: '<path d="M12 8h12l5 9-3 16H10L7 17z" fill="#2a2a24" stroke="#f4f1e8"/><path d="M12 3h12l5 5" fill="none" stroke="#b08d4a" stroke-width="2"/><circle cx="18" cy="20" r="4" fill="#f4f1e8"/>',
  dead: '<path d="M12 8h12l5 9-3 16H10L7 17z" fill="#2c1f36" stroke="#b394d0"/><path d="M12 3h12l5 5" fill="none" stroke="#b08d4a" stroke-width="2"/><path d="M18 14v14M13 19h10" stroke="#b394d0" stroke-width="2"/>',
  eye: '<path d="M2 18c6-9 26-9 32 0-6 9-26 9-32 0z" fill="none" stroke="#6e4f86" stroke-width="2"/><circle cx="18" cy="18" r="5" fill="#6e4f86"/>',
  gate: '<path d="M6 32V10M30 32V10M6 12h24M6 20h24M12 12v20M18 12v20M24 12v20" stroke="#b08d4a" stroke-width="1.6" fill="none"/><circle cx="18" cy="6" r="3" fill="#6e4f86"/>',
};

// ══════════════════════════════════════════════════════════════════════
// THE STEP MODEL — what each card does to the stage
// ══════════════════════════════════════════════════════════════════════
function _events(v) {
  const t = v.tally || {};
  const out = [];
  let clueN = 0;
  for (const p of v.phases) {
    for (const c of p.cards) {
      const k = kindOf(c);
      const ev = { k, phase: p.id, who: [...(c.who || [])] };
      if (k === 'clue') {
        const cl = (t.clues || []).find(x => c.text.indexOf(x.text) >= 0 && x.by === c.who[0]) || (t.clues || [])[clueN];
        ev.clue = cl || null; ev.n = clueN++;
      }
      if (k === 'open') ev.name = c.who[0];
      out.push(ev);
    }
  }
  return out;
}

function _layout(v) {
  const t = v.tally || {};
  const missing = t.missing || [];
  const mourners = t.mourners || [];
  const coffins = t.coffins || [];
  const k = coffins.length;
  const cx = coffins.map((_, i) => 540 + (i - (k - 1) / 2) * Math.min(150, 700 / Math.max(1, k - 1 || 1)));
  const n = mourners.length;
  const mx = mourners.map((_, i) => (n <= 1 ? 540 : 180 + i * (720 / (n - 1))));
  const walkX = mourners.map((_, i) => (n <= 1 ? 250 : 50 + i * (420 / (n - 1))));
  const gapO = missing.length > 5 ? 92 : 100;
  const ovals = missing.map((nm, i) => ({ n: nm, x: 120 + i * gapO, y: 108 }));
  const cleared = (t.clues || []).filter(c => c.solved).map(c => c.about);
  const wins = {};
  cleared.forEach((nm, i) => { wins[nm] = [579 + i * 62, 245]; });
  return { missing, mourners, coffins, cx, mx, walkX, ovals, wins };
}

export function funeralStates(v, total) {
  const t = v.tally || {};
  const evs = _events(v);
  const L = _layout(v);
  const out = [];
  for (let n = 0; n <= total; n++) {
    const seen = evs.slice(0, n);
    const atGrave = seen.some(e => e.phase !== 'procession');
    const riders = [], cracked = [];
    for (const e of seen) {
      if (e.k === 'clue' && e.clue) (e.clue.solved ? riders : cracked).push(e.clue.about);
    }
    if (atGrave) {
      // The walk is over: every clue has landed, whether or not its card was shown.
      for (const c of (t.clues || [])) {
        if (c.solved && !riders.includes(c.about)) riders.push(c.about);
        if (!c.solved && !cracked.includes(c.about)) cracked.push(c.about);
      }
    }
    const firstSeen = seen.some(e => e.k === 'first');
    // The first lily goes down on its own card; the rest on the counting card.
    const allLaid = seen.some(e => e.k === 'counted');
    const laid = allLaid ? (t.lilies || []).map(l => ({ ...l }))
      : firstSeen ? (t.lilies || []).filter(l => l.by === t.first).map(l => ({ ...l })) : [];
    const backSeen = seen.some(e => e.k === 'back');
    const opened = seen.filter(e => e.k === 'open').map(e => e.name);
    const deadSeen = seen.some(e => e.k === 'dead');
    if (deadSeen) for (const d of L.coffins) if (d !== t.victim && !opened.includes(d)) opened.push(d);
    let returned = null;
    if (backSeen) {
      const backEv = seen.filter(e => e.k === 'back').pop();
      returned = backEv && backEv.who[1] ? backEv.who[1] : null;
    }
    const lilies = laid.filter(l => l.by !== returned);
    const counts = Object.fromEntries(L.coffins.map(c => [c, lilies.filter(l => l.on === c).length]));
    const last = seen[seen.length - 1] || null;
    const lastClue = [...seen].reverse().find(e => e.k === 'clue');
    out.push({
      n, ev: last, scene: atGrave ? 'grave' : 'proc',
      clueN: lastClue ? lastClue.n : 0,
      clue: lastClue && lastClue.clue ? lastClue.clue : ((t.clues || [])[0] || null),
      riders, cracked, lilies, counts, opened, dead: deadSeen,
      shield: firstSeen && !!(v.shield && v.shield.holder),
      watched: last && (last.k === 'shake' || last.k === 'gate') ? last.who : [],
      argue: last && last.k === 'argue' ? last.who : [],
      returned,
      petals: seen.some(e => e.k === 'grave'),
      paid: deadSeen,
      cap: deadSeen || opened.length ? ['Part three', 'The Opening'] : atGrave ? ['Part two', 'The Lilies'] : ['Part one', 'The Procession'],
      done: n >= total,
      L,
    });
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════
// THE STAGE — markup
// ══════════════════════════════════════════════════════════════════════
// The fold button carries its own behaviour: no global, no rebuild.
const FU_FOLD = "(function(b){var s=b.closest('.fx');var m=s.classList.toggle('fx-min');"
  + "b.innerHTML=m?'&#9656; show':'&#9662; hide';"
  + "try{localStorage.setItem('tr_stage_min',m?'1':'0')}catch(e){}})(this)";
function _folded() { try { return localStorage.getItem('tr_stage_min') === '1'; } catch { return false; } }

function _stage(v, states, n) {
  const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
  const folded = _folded();
  const L = s.L;
  const e = v.epNum;
  const t = v.tally || {};
  let y1 = '', y2 = '', kerb = '';
  for (let k = 0; k < 20; k++) {
    y1 += '<path d="M' + (k * 108) + ' 300V150c-26-8-18-80 16-92 34 12 42 84 16 92V300z"/>';
    y2 += '<path d="M' + (k * 60 + 20) + ' 300V210c-16-6-10-50 10-58 20 8 26 52 10 58V300z"/>';
    kerb += 'M' + (k * 54) + ' 300h30';
  }
  const walkers = L.mourners.map((nm, i) => '<g class="fx-walker" data-n="' + _esc(nm) + '" transform="translate(' + L.walkX[i].toFixed(1) + ',' + (268 + (i % 2) * 18) + ')">'
    + '<g class="fx-walk" style="--dl:' + (i * -0.2) + 's"><path d="M-16 40c0-26 8-34 16-34s16 8 16 34z" fill="#0a090c"/>'
    + '<circle r="19" fill="#1b1a1f" stroke="#3a3641" stroke-width="2"/><image href="' + _esc(_url(nm)) + '" x="-18" y="-18" width="36" height="36" clip-path="url(#fx-c18-' + e + ')"/></g></g>').join('');
  const ovals = L.ovals.map((p, i) => '<g class="fx-oval" data-o="' + _esc(p.n) + '" style="--dl:' + (i * -0.3) + 's" transform="translate(' + p.x + ',' + p.y + ')"><g class="sway">'
    + '<path d="M0 -60v24" stroke="#b08d4a"/><ellipse rx="30" ry="36" fill="#111014"/>'
    + '<image href="' + _esc(_url(p.n)) + '" x="-24" y="-30" width="48" height="60" clip-path="url(#fx-c26-' + e + ')" class="gray"/>'
    + '<ellipse class="rim" rx="30" ry="36"/><text class="q" x="16" y="32">?</text>'
    + '<path class="fx-crackline" d="M-12 -30l8 16-10 10 14 12-6 24" stroke="#ff5f75" stroke-width="2.5" fill="none"/></g></g>').join('');
  const windows = Object.keys(L.wins).map((nm, i) => '<rect class="fx-window" data-w="' + _esc(nm) + '" x="' + (34 + i * 62) + '" y="224" width="50" height="42" rx="4"/>').join('')
    || '<rect class="fx-window" x="34" y="224" width="50" height="42" rx="4"/>';
  const cones = L.cx.map(x => '<path class="fx-cone" d="M' + (x - 14) + ' 0h28l60 300h-148z" fill="url(#fx-conel-' + e + ')"/>').join('');
  const coffins = L.coffins.map((nm, i) => '<g class="fx-coffin" data-c="' + _esc(nm) + '" transform="translate(' + L.cx[i].toFixed(1) + ',206)"><g class="shk">'
    + '<path class="fx-body" d="M-26 -64h52l18 30-10 104h-68l-10-104z" fill="#1b1a1f" stroke="#b08d4a" stroke-width="2"/>'
    + '<g class="fx-inner"><image href="' + _esc(_url(nm)) + '" x="-24" y="-30" width="48" height="60" clip-path="url(#fx-c26-' + e + ')"/>'
    + '<path class="fx-ribbon" d="M-28 -26l20 20M-22 -30l20 20" stroke="#111014" stroke-width="6"/></g>'
    + '<g class="fx-lid"><path d="M-26 -64h52l18 30-10 104h-68l-10-104z" fill="#111014" stroke="#b08d4a" stroke-width="2"/>'
    + '<path d="M0 -44v70M-18 -20h36" stroke="#b08d4a" stroke-width="3"/></g></g>'
    + '<g class="fx-count" data-cc="' + _esc(nm) + '" transform="translate(0,-92)"><g class="bb"><circle r="16" fill="#f4f1e8"/>'
    + '<text y="6" text-anchor="middle" font-family="Spline Sans Mono" font-size="16" font-weight="600" fill="#111014">0</text></g></g></g>').join('');
  const mourners = L.mourners.map((nm, i) => '<g class="fx-mface" data-m="' + _esc(nm) + '" transform="translate(' + L.mx[i].toFixed(1) + ',352)"><circle r="15" fill="#1b1a1f" stroke="#3a3641" stroke-width="2"/>'
    + '<image href="' + _esc(_url(nm)) + '" x="-14" y="-14" width="28" height="28" clip-path="url(#fx-c14-' + e + ')"/></g>').join('');
  const lilies = L.mourners.map((nm, i) => '<g class="fx-lily" data-l="' + _esc(nm) + '" transform="translate(' + L.mx[i].toFixed(1) + ',330)">'
    + '<path d="M0 0c-8-3-12-9-10-16 5 2 9 7 10 16z M0 0c8-3 12-9 10-16-5 2-9 7-10 16z M0 0c-3-7-3-13 0-18 3 5 3 11 0 18z" fill="#f4f1e8" stroke="#b7b3bd" stroke-width=".8"/></g>').join('');
  const holder = v.shield && v.shield.holder;
  return '<section class="fx' + (folded ? ' fx-min' : '') + '" id="fx-' + e + '" data-scene="' + s.scene + '" data-phase="rest" aria-label="The funeral, staged">'
    + '<svg class="fx-scene" viewBox="0 0 1080 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>'
    + '<clipPath id="fx-c18-' + e + '"><circle r="18"/></clipPath><clipPath id="fx-c14-' + e + '"><circle r="14"/></clipPath>'
    + '<clipPath id="fx-c26-' + e + '"><ellipse rx="24" ry="30"/></clipPath>'
    + '<linearGradient id="fx-road-' + e + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1c1a20"/><stop offset="1" stop-color="#0b0a0d"/></linearGradient>'
    + '<linearGradient id="fx-conel-' + e + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgba(244,241,232,.34)"/><stop offset="1" stop-color="rgba(244,241,232,0)"/></linearGradient>'
    + '<linearGradient id="fx-glass-' + e + '" x1="0" x2="1"><stop offset="0" stop-color="rgba(244,241,232,.12)"/><stop offset=".5" stop-color="rgba(244,241,232,.02)"/><stop offset="1" stop-color="rgba(244,241,232,.14)"/></linearGradient>'
    + '</defs>'
    + '<g class="fx-proc">'
    + '<circle cx="960" cy="60" r="46" fill="rgba(230,223,204,.10)"/><circle cx="960" cy="60" r="20" fill="rgba(230,223,204,.35)"/>'
    + '<g class="fx-par1" fill="#16141b">' + y1 + '</g><g class="fx-par2" fill="#0f0d12">' + y2 + '</g>'
    + '<rect x="0" y="292" width="1080" height="88" fill="url(#fx-road-' + e + ')"/>'
    + '<g class="fx-par2" stroke="#2a2730" stroke-width="2"><path d="' + kerb + '"/></g>'
    + '<g transform="translate(700,0)">'
    + '<g class="fx-horse"><path d="M232 238c10-18 30-22 44-14l12-14 6 6-6 14c4 10 2 22-6 28l2 34h-8l-4-26h-26l-4 26h-8l2-34c-6-4-10-12-4-20z" fill="#0a090c" stroke="#3a3641"/>'
    + '<path class="fx-plume" d="M288 204c-4-14 2-24 10-26-2 10 0 18-4 26z" fill="#6e4f86"/></g>'
    + '<g class="fx-horse b"><path d="M252 244c10-18 30-22 44-14l12-14 6 6-6 14c4 10 2 22-6 28l2 34h-8l-4-26h-26l-4 26h-8l2-34c-6-4-10-12-4-20z" fill="#0a090c" opacity=".7"/></g>'
    + '<path d="M60 198h150l12 18v62H48v-62z" fill="#0d0c10" stroke="#b08d4a" stroke-width="1.5"/>'
    + '<rect x="62" y="206" width="146" height="58" fill="url(#fx-glass-' + e + ')" stroke="#b08d4a"/>'
    + '<path d="M84 250h100l8-8H92z" fill="#1b1a1f" stroke="#b08d4a"/>'
    + '<g fill="#f4f1e8" opacity=".85"><circle cx="110" cy="240" r="4"/><circle cx="120" cy="238" r="4"/><circle cx="130" cy="240" r="4"/><circle cx="150" cy="239" r="4"/><circle cx="160" cy="238" r="4"/></g>'
    + '<path d="M70 190h130l-8-12H78z" fill="#6e4f86"/>'
    + '<path class="fx-plume" d="M78 178c-4-14 0-24 6-26 0 10 2 18-2 26z" fill="#0a090c"/><path class="fx-plume" d="M192 178c-4-14 0-24 6-26 0 10 2 18-2 26z" fill="#0a090c"/>'
    + '<g class="fx-wheel"><circle cx="80" cy="288" r="20" fill="none" stroke="#b08d4a" stroke-width="3"/><path d="M80 268v40M60 288h40M66 274l28 28M94 274l-28 28" stroke="#b08d4a" stroke-width="1.5"/></g>'
    + '<g class="fx-wheel"><circle cx="186" cy="288" r="20" fill="none" stroke="#b08d4a" stroke-width="3"/><path d="M186 268v40M166 288h40M172 274l28 28M200 274l-28 28" stroke="#b08d4a" stroke-width="1.5"/></g>'
    + '</g>'
    + '<g transform="translate(520,0)"><path d="M20 214h140v64H20z" fill="#0d0c10" stroke="#b08d4a" stroke-width="1.5"/>' + windows
    + '<path d="M26 214h128l-10-14H36z" fill="#1b1a1f" stroke="#b08d4a"/>'
    + '<g class="fx-wheel"><circle cx="46" cy="290" r="16" fill="none" stroke="#b08d4a" stroke-width="3"/><path d="M46 274v32M30 290h32" stroke="#b08d4a"/></g>'
    + '<g class="fx-wheel"><circle cx="134" cy="290" r="16" fill="none" stroke="#b08d4a" stroke-width="3"/><path d="M134 274v32M118 290h32" stroke="#b08d4a"/></g></g>'
    + walkers + ovals
    + '<g class="fx-sweep"><ellipse cx="' + (L.ovals[0] ? L.ovals[0].x : 160) + '" cy="108" rx="60" ry="70" fill="rgba(244,241,232,.13)"/></g>'
    + '<g class="fx-card" transform="translate(816,112)"><g class="flip">'
    + '<rect x="-120" y="-66" width="240" height="132" fill="#f4f1e8" stroke="#111014" stroke-width="6"/>'
    + '<rect x="-120" y="-66" width="240" height="24" fill="#111014"/>'
    + '<text x="0" y="-49" text-anchor="middle" font-family="Spline Sans Mono" font-size="11" fill="#e2c47e" letter-spacing="3" class="fx-card-h">THE FIRST CLUE</text>'
    + '<foreignObject x="-106" y="-36" width="212" height="96"><div xmlns="http://www.w3.org/1999/xhtml" class="fx-card-t"></div></foreignObject>'
    + '</g></g>'
    + '</g>'
    + '<g class="fx-grave"><path d="M0 300 Q540 256 1080 300 V380 H0Z" fill="#0d0c10"/>'
    + cones + coffins + mourners + lilies
    + (holder ? '<g class="fx-shield" transform="translate(540,86)"><g class="rise">'
      + '<path d="M0 -58l44 14v32c0 30-18 50-44 62-26-12-44-32-44-62v-32z" fill="#efcb5f" stroke="#7b6224" stroke-width="3"/>'
      + '<image href="' + _esc(_url(holder)) + '" x="-24" y="-30" width="48" height="60" clip-path="url(#fx-c26-' + e + ')"/></g></g>' : '')
    + '</g></svg>'
    + '<div class="fx-layer fx-rays"></div><div class="fx-layer fx-dust"></div><div class="fx-layer fx-petal"></div>'
    + '<div class="fx-layer fx-flash"></div><div class="fx-layer fx-vig"></div><div class="fx-layer fx-grain"></div>'
    + '<div class="fx-cap"><span class="fx-cap-k">' + _esc(s.cap[0]) + '</span><b class="fx-cap-t">' + _esc(s.cap[1]) + '</b></div>'
    + '<div class="fx-pot">In the pot<b class="fx-potv">' + _gbp(v.potBefore + (s.paid ? v.earned : 0)) + '</b></div>'
    + '<div class="fx-stamp"></div>'
    + '<button type="button" class="fx-fold" onclick="' + FU_FOLD + '">'
    + (folded ? '&#9656; show' : '&#9662; hide') + '</button>'
    + '</section>';
}

// ══════════════════════════════════════════════════════════════════════
// THE STAGE — painting
// ══════════════════════════════════════════════════════════════════════
const TIMERS = {};
function _q(root, sel) { return root.querySelector(sel); }
function _qa(root, sel) { return Array.from(root.querySelectorAll(sel)); }
function _css(s) { return (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }
function _restart(el, cls) { if (!el) return; el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); }

function _setClue(root, clue, n) {
  const h = _q(root, '.fx-card-h'); const tx = _q(root, '.fx-card-t');
  if (h) h.textContent = ['THE FIRST CLUE', 'THE SECOND CLUE', 'THE THIRD CLUE'][n] || 'THE CLUE';
  if (tx) tx.textContent = clue ? clue.text : '';
}
function _flyLily(root, s, l, first) {
  const g = _q(root, '.fx-lily[data-l="' + _css(l.by) + '"]'); if (!g) return;
  const i = s.L.mourners.indexOf(l.by), c = s.L.coffins.indexOf(l.on);
  if (c < 0) return;
  g.setAttribute('class', 'fx-lily fly' + (first ? ' first' : ''));
  g.setAttribute('transform', 'translate(' + (s.L.cx[c] + ((i % 3) - 1) * 14).toFixed(1) + ',' + (150 + (i % 2) * 12) + ') rotate(' + (i % 2 ? 24 : -24) + ')');
}
function _lilyHome(root, s, name) {
  const g = _q(root, '.fx-lily[data-l="' + _css(name) + '"]'); if (!g) return;
  const i = s.L.mourners.indexOf(name);
  g.setAttribute('class', 'fx-lily');
  g.setAttribute('transform', 'translate(' + s.L.mx[i].toFixed(1) + ',330)');
}
function _count(root, name, v, bump) {
  const c = _q(root, '.fx-count[data-cc="' + _css(name) + '"]'); if (!c) return;
  c.querySelector('text').textContent = v;
  c.setAttribute('class', 'fx-count' + (v ? ' on' : ''));
  if (bump) { void c.getBoundingClientRect(); c.setAttribute('class', 'fx-count on bump'); }
}
function _stamp(root, text, cls) {
  const s = _q(root, '.fx-stamp'); if (!s) return;
  s.textContent = text; s.className = 'fx-stamp ' + cls; void s.offsetWidth; s.classList.add('go');
}
function _flash(root, violet, x, y) {
  const f = _q(root, '.fx-flash'); if (!f) return;
  f.classList.toggle('violet', !!violet); f.style.setProperty('--fx-fx', x); f.style.setProperty('--fx-fy', y);
  _restart(f, 'go');
}
function _spread(n, seed) {
  let s = seed; const out = [];
  for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; const a = s / 2147483647; s = (s * 16807) % 2147483647; out.push([a, s / 2147483647]); }
  return out;
}
function _burst(root, n, cx, cy, px) {
  const host = _q(root, '.fx-dust'); if (!host) return;
  host.innerHTML = _spread(n, 11 + Math.round(cx)).map(r =>
    '<i style="left:' + cx + '%;top:' + cy + '%;--w:' + (3 + r[0] * 6) + 'px;--x:' + ((r[0] - 0.5) * px) + 'px;--y:' + ((r[1] - 0.8) * px) + 'px;--t:' + (0.8 + r[1]) + 's;--dl:' + (r[0] * 0.2) + 's"></i>').join('');
  _restart(host, 'go');
}
function _petals(root) {
  const host = _q(root, '.fx-petal'); if (!host) return;
  host.innerHTML = _spread(28, 5).map(r =>
    '<i style="left:' + (r[0] * 100) + '%;--w:' + (6 + r[1] * 8) + 'px;--x:' + ((r[1] - 0.5) * 160) + 'px;--t:' + (3 + r[0] * 3) + 's;--dl:' + (r[1] * 2) + 's"></i>').join('');
  _restart(host, 'go');
}
function _ride(root, s, name) {
  const g = _q(root, '.fx-oval[data-o="' + _css(name) + '"]'); const w = s.L.wins[name];
  if (!g || !w) return;
  g.setAttribute('transform', 'translate(' + w[0] + ',' + w[1] + ') scale(.5)');
  g.setAttribute('class', 'fx-oval gone');
  const win = _q(root, '.fx-window[data-w="' + _css(name) + '"]'); if (win) win.setAttribute('class', 'fx-window lit');
}
function _open(root, name, cls) {
  const g = _q(root, '.fx-coffin[data-c="' + _css(name) + '"]'); if (g) g.setAttribute('class', 'fx-coffin open ' + cls);
}
function _shake(root, name, on) {
  const g = _q(root, '.fx-coffin[data-c="' + _css(name) + '"]'); if (g) g.setAttribute('data-shake', on ? '1' : '0');
}
function _pctX(s, name) { const i = s.L.coffins.indexOf(name); return i < 0 ? 50 : (s.L.cx[i] / 10.8); }

/** Draw state `s` with no motion. */
function _settle(root, s, v) {
  root.dataset.scene = s.scene;
  root.dataset.phase = s.watched.length ? 'glance' : 'rest';
  _qa(root, '.fx-bubble').forEach(b => b.remove());
  _qa(root, '.fx-oval.named').forEach(o => o.classList.remove('named'));
  _qa(root, '.fx-coffin .pick').forEach(p => p.remove());
  _qa(root, '.fx-mface').forEach(m => m.classList.toggle('arguing', s.argue.includes(m.getAttribute('data-m'))));
  root.classList.toggle('has-shield', s.shield);
  for (const o of s.L.ovals) {
    const g = _q(root, '.fx-oval[data-o="' + _css(o.n) + '"]'); if (!g) continue;
    g.setAttribute('transform', 'translate(' + o.x + ',' + o.y + ')');
    g.setAttribute('class', 'fx-oval' + (s.cracked.includes(o.n) ? ' crack' : ''));
  }
  _qa(root, '.fx-window').forEach(w => w.setAttribute('class', 'fx-window'));
  for (const r of s.riders) _ride(root, s, r);
  _setClue(root, s.clue, s.clueN);
  _qa(root, '.fx-walker').forEach(g => g.classList.toggle('watched', s.watched.includes(g.getAttribute('data-n'))));
  for (const m of s.L.mourners) _lilyHome(root, s, m);
  for (const l of s.lilies) _flyLily(root, s, l, l.by === (v.tally || {}).first);
  for (const c of s.L.coffins) {
    _count(root, c, s.counts[c] || 0, false);
    const g = _q(root, '.fx-coffin[data-c="' + _css(c) + '"]');
    if (g) { g.setAttribute('data-shake', '0'); g.setAttribute('class', 'fx-coffin'); }
  }
  for (const c of s.opened) _open(root, c, 'alive');
  if (s.dead) _open(root, (v.tally || {}).victim, 'dead');
  const cap = _q(root, '.fx-cap-k'); if (cap) cap.textContent = s.cap[0];
  const capt = _q(root, '.fx-cap-t'); if (capt) capt.textContent = s.cap[1];
  const pot = _q(root, '.fx-potv'); if (pot) pot.textContent = _gbp(v.potBefore + (s.paid ? v.earned : 0));
  const st = _q(root, '.fx-stamp'); if (st) st.className = 'fx-stamp';
}

/** A mourner calls out a name: a bubble over their head, the portrait lights. */
function _say(root, by, name, last) {
  const w = _q(root, '.fx-walker[data-n="' + _css(by) + '"]'); if (!w) return;
  _qa(root, '.fx-bubble').forEach(b => b.classList.add('old'));
  const NS = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'fx-bubble' + (last ? ' last' : ''));
  const label = String(name);
  const wdt = 16 + label.length * 8.4;
  g.innerHTML = '<g class="pop"><rect x="' + (-wdt / 2) + '" y="-78" width="' + wdt + '" height="28" rx="14"/>'
    + '<path d="M-6 -51 L0 -40 L6 -51Z"/><text x="0" y="-59" text-anchor="middle">' + _esc(label) + '?</text></g>';
  w.appendChild(g);
  _qa(root, '.fx-oval.named').forEach(o => o.classList.remove('named'));
  const o = _q(root, '.fx-oval[data-o="' + _css(name) + '"]'); if (o) o.classList.add('named');
}
/** A pointer from a coffin's rim, in the arguing mourner's colour. */
function _pick(root, coffin, i) {
  const g = _q(root, '.fx-coffin[data-c="' + _css(coffin) + '"]'); if (!g) return;
  const NS = 'http://www.w3.org/2000/svg';
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('class', 'pick ' + (i ? 'b' : 'a'));
  p.setAttribute('d', 'M-30 -68h60l20 34-11 108h-78l-11-108z');
  g.appendChild(p);
}

/** Every lily not yet down flies to its coffin, one after another. */
function _layAll(root, s, t, prev, later, skipFirst) {
  root.dataset.phase = 'lay';
  const counts = { ...prev.counts };
  (t.lilies || []).filter(l => !prev.lilies.some(p => p.by === l.by)).forEach((l, i) => {
    later(() => {
      _flyLily(root, s, l, false);
      later(() => { counts[l.on] = (counts[l.on] || 0) + 1; _count(root, l.on, counts[l.on], true); }, 1050);
    }, i * 380);
  });
}

/** Play the step that lands on state `s`, from `prev`. */
function _play(root, prev, s, v, key) {
  const later = (fn, ms) => TIMERS[key].push(setTimeout(fn, ms));
  _settle(root, prev, v);
  const e = s.ev; const t = v.tally || {};
  if (!e) return _settle(root, s, v);
  if (e.k === 'clue' && e.clue) {
    _setClue(root, e.clue, e.n);
    root.dataset.phase = 'ask';
    const voices = [...(e.clue.voices || []), { by: e.clue.by, name: e.clue.guess, last: true }];
    voices.forEach((g, j) => later(() => _say(root, g.by, g.name, !!g.last), 1500 + j * 1300));
    later(() => {
      _qa(root, '.fx-bubble').forEach(b => b.remove());
      _qa(root, '.fx-oval.named').forEach(o => o.classList.remove('named'));
      if (e.clue.solved) {
        root.dataset.phase = 'safe'; _ride(root, s, e.clue.about); _flash(root, false, '56%', '64%');
        _stamp(root, 'SAFE · ' + e.clue.about.toUpperCase(), 'safe');
      } else {
        root.dataset.phase = 'miss';
        const g = _q(root, '.fx-oval[data-o="' + _css(e.clue.about) + '"]'); if (g) g.setAttribute('class', 'fx-oval crack');
        _flash(root, true, '30%', '25%'); _stamp(root, 'WRONG NAME', 'wrong');
      }
    }, 1500 + voices.length * 1300 + 700);
  } else if (e.k === 'shake' || e.k === 'gate') {
    _settle(root, s, v);
  } else if (e.k === 'line') {
    root.dataset.scene = 'grave'; root.dataset.phase = 'hold';
    const cap = _q(root, '.fx-cap-t'); if (cap) cap.textContent = 'The Lilies';
    const k2 = _q(root, '.fx-cap-k'); if (k2) k2.textContent = 'Part two';
  } else if (e.k === 'argue') {
    _settle(root, s, v);
    root.dataset.phase = 'argue';
    s.argue.forEach((m, i) => {
      const l = (t.lilies || []).find(x => x.by === m);
      if (l) later(() => _pick(root, l.on, i), 500 + i * 700);
    });
  } else if (e.k === 'counted') {
    root.dataset.scene = 'grave';
    _layAll(root, s, t, prev, later, !!t.first);
    const n = (t.lilies || []).length;
    later(() => _stamp(root, s.L.coffins.map(c => s.counts[c] || 0).join(' · '), 'safe'), n * 380 + 1500);
  } else if (e.k === 'first') {
    root.dataset.scene = 'grave'; root.dataset.phase = 'hold';
    later(() => {
      const l = (t.lilies || []).find(x => x.by === t.first);
      if (l) _flyLily(root, s, l, true);
      later(() => {
        _count(root, t.victim, 1, true);
        if (s.shield) { root.dataset.phase = 'first'; root.classList.add('has-shield'); _flash(root, false, '50%', '24%'); _stamp(root, 'THE FIRST LILY', 'gold'); } else root.dataset.phase = 'rest';
      }, 1100);
    }, 1300);
  } else if (e.k === 'sure') {
    _settle(root, s, v);
    root.dataset.phase = 'hold';
    later(() => { root.dataset.phase = 'rest'; }, 1600);
  } else if (e.k === 'open') {
    root.dataset.phase = 'hold';
    const k2 = _q(root, '.fx-cap-k'); if (k2) k2.textContent = 'Part three';
    const cap = _q(root, '.fx-cap-t'); if (cap) cap.textContent = 'The Opening';
    _shake(root, e.name, true);
    later(() => {
      _shake(root, e.name, false); root.dataset.phase = 'open';
      _open(root, e.name, 'alive'); _burst(root, 18, _pctX(s, e.name), 50, 170);
      _stamp(root, 'ALIVE · ' + e.name.toUpperCase(), 'safe');
    }, 2200);
  } else if (e.k === 'back') {
    root.dataset.phase = 'rest';
    if (s.returned) {
      _lilyHome(root, s, s.returned);
      later(() => { for (const c of s.L.coffins) _count(root, c, s.counts[c] || 0, false); }, 700);
    }
  } else if (e.k === 'dead') {
    root.dataset.phase = 'hold';
    const rest = s.L.coffins.filter(c => c !== t.victim && !prev.opened.includes(c));
    rest.forEach(c => { _open(root, c, 'alive'); });
    _shake(root, t.victim, true);
    later(() => {
      _shake(root, t.victim, false); root.dataset.phase = 'dead';
      _open(root, t.victim, 'dead'); _flash(root, true, _pctX(s, t.victim) + '%', '52%');
      _burst(root, 24, _pctX(s, t.victim), 50, 220);
      _stamp(root, 'MURDERED · ' + String(t.victim).toUpperCase(), 'dead');
      later(() => {
        const pot = _q(root, '.fx-potv');
        if (pot) { pot.textContent = _gbp(v.potBefore + v.earned); _restart(pot, 'tick'); }
      }, 1400);
    }, 3000);
  } else if (e.k === 'grave') {
    _settle(root, s, v);
    root.dataset.phase = 'mourn'; _petals(root);
  } else {
    _settle(root, s, v);
  }
}

// ══════════════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════════════
function _side(v, s) {
  const t = v.tally || {};
  const clues = (t.clues || []).map((c, i) => {
    const shown = s.riders.includes(c.about) || s.cracked.includes(c.about);
    return '<div class="fu-cl' + (shown ? (c.solved ? ' solved' : ' missed') : '') + '" data-clue="' + i + '">'
      + _face(c.about) + '<span>clue ' + (i + 1) + ' · ' + (shown ? (c.solved ? _esc(c.about) + ' · safe' : 'missed · ' + _esc(c.about) + ' stays') : 'unread') + '</span></div>';
  }).join('');
  const right = s.counts[t.victim] || 0;
  return '<div class="fu-clues">' + clues + '</div>'
    + '<div class="fu-tally">'
    + '<div class="fu-row"><span>Missing at breakfast</span><b>' + (t.missing || []).length + '</b></div>'
    + '<div class="fu-row"><span>In the carriage</span><b data-k="car">' + s.riders.length + '</b></div>'
    + '<div class="fu-row"><span>Coffins at the grave</span><b data-k="cof">' + ((t.missing || []).length - s.riders.length) + '</b></div>'
    + '<div class="fu-row"><span>Lilies on the right coffin</span><b data-k="lil">' + (s.dead ? right + ' of ' + t.voters : s.lilies.length ? '?' : '—') + '</b></div>'
    + '</div>'
    + (t.offered === false ? '' : '<div class="fu-lilybox' + (s.shield ? ' on' : '') + '">'
      + '<div class="lbl">The First Lily</div>'
      + (v.shield && v.shield.holder ? '<div class="holder">' + _face(v.shield.holder) + '</div>' : '')
      + '<div class="val">' + (s.shield ? _esc(v.shield.holder) + ' · first on the right coffin' : 'no lily has been laid') + '</div></div>')
    + '<div class="fu-pot">'
    + '<div class="r"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
    + '<div class="r"><span>Majority right</span><b>' + (s.dead ? (t.majority ? 'yes' : 'no') + ' · ' + right + ' of ' + t.voters : '&mdash;') + '</b></div>'
    + '<div class="r"><span>Earned today</span><b>' + (s.dead ? _gbp(v.earned) : '&mdash;') + '</b></div>'
    + '<div class="big">' + _gbp(v.potBefore + (s.dead ? v.earned : 0)) + '</div></div>';
}

export const FUNERAL = {
  id: 'funeral', prefix: 'fu', ownShield: true,
  shieldBeat: /first lily|too quickly/,
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: () => '<h1 class="fu-title">The Funeral</h1>',
  sub: v => 'Nobody was told who died last night. ' + _cap(['no', 'one', 'two', 'three', 'four', 'five', 'six'][(v.tally.missing || []).length] || 'several')
    + ' chairs were empty at breakfast, one murder among them, and this afternoon the castle walks behind a hearse to find out whose.',
  chips: v => [
    { text: 'One procession' },
    { text: (v.tally.clues || []).length + ((v.tally.clues || []).length === 1 ? ' clue' : ' clues') + ' · ' + (v.tally.missing || []).length + ' missing' },
    { text: 'Money if the majority is right' },
    v.tally.offered === false ? { text: 'No Shield today' } : { text: 'The first lily on the right coffin · a Shield', shield: true },
  ],
  phaseNum: roman => '<span class="fu-phase-n"><b>' + roman + '</b></span>',
  cardClass: c => {
    const k = kindOf(c);
    if (c.relic) return 'relic';
    if (k === 'dead') return 'dead';
    if (k === 'open') return 'open';
    return (c.isSocial ? 'social ' : '') + (c.tone === 'bad' ? 'bad' : c.tone === 'good' ? 'good' : 'plain');
  },
  cardTag: c => {
    const k = kindOf(c);
    if (c.relic) return 'The first lily';
    if (k === 'clue') return K.solved(c) ? 'Into the carriage' : 'Wrong name';
    if (k === 'line') return 'At the graveside';
    if (k === 'open') return 'Alive';
    if (k === 'dead') return 'Murdered';
    if (k === 'first') return 'The first lily';
    return c.isSocial ? _cap(c.behaviour || 'moment') : _cap(c.kind);
  },
  icon: c => {
    const k = kindOf(c);
    const ic = c.relic || k === 'first' ? 'shield' : k === 'clue' ? (K.solved(c) ? 'carriage' : 'wrong')
      : k === 'open' ? 'open' : k === 'dead' ? 'dead' : k === 'gate' ? 'gate'
        : (k === 'shake' || k === 'sure') ? 'eye' : 'lily';
    return '<span class="fu-ico"><svg viewBox="0 0 36 36" aria-hidden="true">' + ICONS[ic] + '</svg></span>';
  },

  stage: (v, states, n) => _stage(v, states, n),

  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    return '<div class="fu-panel" data-ep="' + v.epNum + '"><h3>The Procession</h3><div class="fu-sidebody">' + _side(v, s) + '</div></div>';
  },

  sideStates(v, total) {
    const states = funeralStates(v, total);
    // The screen keeps the view for the painter: the record is plain data.
    for (const s of states) s.v = { epNum: v.epNum, potBefore: v.potBefore, earned: v.earned, tally: v.tally, shield: v.shield };
    return states;
  },

  paintSide(prefix, states, n, mode) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const v = s.v;
    const body = document.querySelector('.fu-panel[data-ep="' + v.epNum + '"] .fu-sidebody');
    if (body) body.innerHTML = _side(v, s);
    const root = document.getElementById('fx-' + v.epNum); if (!root) return;
    const key = 'fx-' + v.epNum;
    (TIMERS[key] || []).forEach(clearTimeout); TIMERS[key] = [];
    const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (mode === 'next' && n > 0 && !reduced) _play(root, states[n - 1], s, v, key);
    else _settle(root, s, v);
  },

  atmosphere: () => '<div class="fu-sky"></div>'
    + '<svg class="fu-trees" viewBox="0 0 1200 300" preserveAspectRatio="none"><g fill="#15141a">'
    + '<path d="M40 300 V120 C10 110 20 40 60 30 C100 40 110 110 80 120 V300Z"/><path d="M200 300 V140 C170 130 180 60 220 50 C260 60 270 130 240 140 V300Z"/>'
    + '<path d="M960 300 V140 C930 130 940 60 980 50 C1020 60 1030 130 1000 140 V300Z"/><path d="M1120 300 V120 C1090 110 1100 40 1140 30 C1180 40 1190 110 1160 120 V300Z"/></g></svg>'
    + '<div class="fu-petals"></div>',

  css: `
@import url('https://fonts.googleapis.com/css2?family=Italiana&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Spline+Sans+Mono:wght@400;600&display=swap');
.fu-root{--fu-jet:#0c0b0d; --fu-crepe:#1b1a1f; --fu-crepe2:#26242b; --fu-lily:#f4f1e8; --fu-violet:#6e4f86; --fu-violet-hi:#b394d0; --fu-brass:#b08d4a; --fu-brass-hi:#e2c47e; --fu-ash:#9c98a3; --fu-blood:#9b2d3c; --fu-shield:#efcb5f; --fu-nav:46px; --cv-display:'Italiana',serif;background:var(--fu-jet);color:var(--fu-ash);font-family:'Old Standard TT',Georgia,serif;font-size:18px;line-height:1.55;padding-bottom:120px;position:relative;overflow:clip}
/* ── ATMOSPHERE: an overcast avenue, falling petals ───────────────── */
.fu-sky{position:absolute;inset:0;
  background:radial-gradient(70% 40% at 50% 0%,rgba(156,152,163,.12),transparent 70%),
    repeating-linear-gradient(90deg,rgba(255,255,255,.012) 0 1px,transparent 1px 120px),
    linear-gradient(180deg,#17161a,#0c0b0d 60%)}
.fu-trees{position:absolute;left:0;right:0;top:0;width:100%;height:50vh;opacity:.35}
.fu-petals{position:absolute;inset:0;opacity:.5;
  background-image:radial-gradient(3px 2px at 15% 20%,var(--fu-lily),transparent),radial-gradient(2px 3px at 55% 60%,var(--fu-lily),transparent),radial-gradient(3px 2px at 85% 35%,var(--fu-lily),transparent);
  background-size:380px 380px;animation:fu-fall 40s linear infinite}
@keyframes fu-fall{from{background-position:0 0}to{background-position:-80px 380px}}

.fu-shell{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:26px 16px 40px}
.fu-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.fu-body{position:relative;z-index:2}

/* ── HERO: an order of service ────────────────────────────────────── */
.fu-hero{position:relative;padding:36px 26px 26px;text-align:center;
  background:linear-gradient(180deg,#1f1d24,#121115);border:1px solid #2e2b34;
  box-shadow:inset 0 0 0 8px #0c0b0d,inset 0 0 0 9px var(--fu-brass),0 20px 50px rgba(0,0,0,.6)}
.fu-hero::before{content:'';position:absolute;left:50%;top:0;bottom:0;width:26px;margin-left:-13px;background:linear-gradient(180deg,var(--fu-violet),#3e2b4d);opacity:.25}
.fu-kicker{position:relative;font:12.5px/1 'Spline Sans Mono',monospace;letter-spacing:.3em;text-transform:uppercase;color:var(--fu-brass-hi)}
.fu-title{position:relative;font-family:'Italiana',serif;font-weight:400;color:var(--fu-lily);font-size:clamp(46px,9vw,100px);line-height:1;margin:.14em 0 .06em;letter-spacing:.06em}
.fu-sub{position:relative;color:#b7b3bd;max-width:58ch;margin:0 auto;font-style:italic}
.fu-meta{position:relative;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}
.fu-chip{font:11.5px/1 'Spline Sans Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--fu-lily);border:1px solid #3a3641;padding:6px 11px;background:rgba(0,0,0,.45)}
.fu-chip.shield{border-color:var(--fu-shield);color:var(--fu-shield)}
.fu-roster{position:relative;display:flex;justify-content:center;gap:34px;flex-wrap:wrap;margin-top:18px}
.fu-rteam small{display:block;font:11.5px/1 'Spline Sans Mono',monospace;letter-spacing:.2em;text-transform:uppercase;margin-bottom:7px}
.fu-rteam.walk small{color:var(--fu-lily)}.fu-rteam.gone small{color:var(--fu-violet-hi)}
.fu-rteam.gone .fu-av{filter:grayscale(1) brightness(.7)}

.fu-av{width:34px;height:34px;border-radius:50%;object-fit:cover;object-position:50% 20%;background:#26242b;
  border:2px solid #3a3641;box-shadow:0 2px 8px rgba(0,0,0,.6);display:inline-block;vertical-align:middle}
.fu-faces{display:inline-flex}
.fu-faces .fu-av+.fu-av{margin-left:-8px}
.fu-q{position:relative;display:inline-block}
.fu-q::after{content:'?';position:absolute;right:-3px;bottom:-3px;width:15px;height:15px;border-radius:50%;background:var(--fu-violet);color:var(--fu-lily);
  font:700 10px/15px 'Spline Sans Mono',monospace;text-align:center}

.fu-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px;margin-top:24px;align-items:start}
@media(max-width:940px){.fu-grid{grid-template-columns:minmax(0,1fr)}}

/* ── BRIEFING: a black-edged card ─────────────────────────────────── */
.fu-brief{background:var(--fu-lily);color:#231f28;padding:22px 22px 16px;border:10px solid #111014;box-shadow:0 0 0 1px var(--fu-brass),0 10px 30px rgba(0,0,0,.5)}
.fu-brief h2{font-family:'Italiana',serif;font-weight:400;font-size:32px;margin:0;color:#111014;letter-spacing:.04em}
.fu-host{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.fu-host .fu-av{width:46px;height:46px;border-color:#111014}
.fu-host small{display:block;font:11.5px/1.4 'Spline Sans Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#6e6875}
.fu-staging{font-style:italic;color:#4f4a56;border-bottom:1px solid #cfc9bd;padding-bottom:12px;margin:8px 0 14px}
.fu-beat{margin:0 0 11px}
.fu-beat p{margin:0}
.fu-beat.do p{font:14px/1.5 'Spline Sans Mono',monospace;color:#6e6875}
.fu-beat.say p{color:#1a171e}
.fu-beat.shield p{color:#5c4300;border-left:3px solid #b8901f;padding-left:10px}
.fu-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.fu-rule{font:10.5px/1 'Spline Sans Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:#4f4a56;border:1px solid #cfc9bd;padding:5px 8px}
.fu-rule b{color:var(--fu-violet);margin-right:4px}
.fu-rule.shield b{color:#8a6a10}

/* ── PHASES ───────────────────────────────────────────────────────── */
.fu-phase{margin-top:28px}
.fu-phase-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:6px;border-bottom:1px solid #2e2b34}
.fu-phase-n{width:38px;height:38px;display:grid;place-items:center;font:20px/1 'Italiana',serif;color:var(--fu-lily);
  border:1px solid var(--fu-brass);transform:rotate(45deg)}
.fu-phase-n b{transform:rotate(-45deg);font-weight:400}
.fu-phase-name{font-family:'Italiana',serif;font-size:34px;line-height:1;color:var(--fu-lily);letter-spacing:.04em}
.fu-phase-stats{margin-left:auto;display:flex;gap:6px}
.fu-stat{font:10.5px/1 'Spline Sans Mono',monospace;font-style:normal;text-transform:uppercase;letter-spacing:.1em;color:#b7b3bd;background:#1f1d24;padding:5px 8px}
.fu-setting{font-style:italic;color:#8a8690;margin:8px 0 12px}

/* ── CARDS: laid down slowly ──────────────────────────────────────── */
.fu-card{position:relative;margin:0 0 12px;padding:14px 16px 13px 66px;scroll-margin-top:460px;
  background:linear-gradient(180deg,#1d1b21,#141317);border:1px solid #2e2b34;border-left:4px solid #3a3641;
  opacity:0;transform:translateY(10px);transition:opacity 1.1s ease,transform 1.1s ease}
.fu-card.on{opacity:1;transform:none}
.fu-card.good{border-left-color:var(--fu-lily)}
.fu-card.bad{border-left-color:var(--fu-blood)}
.fu-card.social{border-left-color:var(--fu-violet)}
.fu-card.relic{border:1px solid var(--fu-shield);box-shadow:0 0 24px rgba(239,203,95,.16)}
.fu-card.open{border:1px solid var(--fu-lily);box-shadow:0 0 24px rgba(244,241,232,.08)}
.fu-card.dead{border:1px solid var(--fu-violet);box-shadow:0 0 26px rgba(110,79,134,.3)}
.fu-ico{position:absolute;left:14px;top:14px;width:38px;height:38px}
.fu-ico svg{width:100%;height:100%;display:block}
.fu-tag{float:right;font:10.5px/1 'Spline Sans Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#8a8690;margin:4px 0 0 10px}
.fu-card.good .fu-tag,.fu-card.open .fu-tag{color:var(--fu-lily)}.fu-card.bad .fu-tag{color:#e07b86}.fu-card.relic .fu-tag{color:var(--fu-shield)}
.fu-card.social .fu-tag,.fu-card.dead .fu-tag{color:var(--fu-violet-hi)}
.fu-who{display:flex;align-items:center;gap:9px;font-weight:700;color:var(--fu-lily)}
.fu-who i{font-style:normal;font-weight:400;color:#8a8690}
.fu-card.relic .fu-av{border-color:var(--fu-shield)}.fu-card.dead .fu-av{border-color:var(--fu-violet)}
.fu-txt{margin-top:6px}
.fu-clue{margin-top:8px;padding:9px 12px;background:var(--fu-lily);color:#231f28;font-style:italic;border-left:4px solid var(--fu-violet)}
.fu-clue small{display:block;font:10.5px/1.3 'Spline Sans Mono',monospace;font-style:normal;letter-spacing:.1em;text-transform:uppercase;color:#6e6875}
.fu-conf{margin-top:10px;padding:9px 12px;background:rgba(0,0,0,.35);border-left:2px solid var(--fu-violet);font-style:italic;color:#e3e0e6}
.fu-conf small{display:block;font:10.5px/1.4 'Spline Sans Mono',monospace;font-style:normal;letter-spacing:.12em;text-transform:uppercase;color:var(--fu-violet-hi)}
.fu-fx{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.fu-fx span{font:10.5px/1 'Spline Sans Mono',monospace;color:#b7b3bd;border:1px solid #3a3641;padding:4px 7px}
.fu-votes{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.fu-vote{display:flex;align-items:center;gap:6px;font:12px/1 'Spline Sans Mono',monospace;color:#b7b3bd}
.fu-vote .fu-av{width:26px;height:26px}
.fu-summary{margin-top:24px;padding:18px 20px;border:10px solid #111014;box-shadow:0 0 0 1px var(--fu-brass);background:var(--fu-lily);color:#231f28;transition:opacity .4s}
.fu-summary small{display:block;font:10.5px/1.4 'Spline Sans Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--fu-violet);margin-bottom:4px}

/* ── SIDEBAR: the procession ─────────────────────────────────────── */
.fu-side{position:relative}
.fu-panel{background:rgba(10,9,11,.96);border:1px solid #2e2b34;padding:14px}
.fu-panel h3{font:400 28px/1 'Italiana',serif;color:var(--fu-lily);margin:0 0 10px;text-align:center;letter-spacing:.06em}
.fu-road{display:block;width:100%}
.fu-walker{transition:transform 1.2s ease,opacity .6s}
.fu-rider{opacity:0;transition:opacity .8s}
.fu-rider.on{opacity:1}
.fu-coffin .box{fill:#1b1a1f;stroke:var(--fu-brass);stroke-width:1.2;transition:fill .8s}
.fu-coffin .lid{transition:transform .9s ease;transform-origin:50% 0%;transform-box:fill-box}
.fu-coffin.open .lid{transform:translate(16px,-22px) rotate(28deg);opacity:.35}
.fu-coffin .face{opacity:0;transition:opacity .8s}
.fu-coffin.open .face{opacity:1}
.fu-coffin.open .cross{opacity:0}
.fu-coffin.dead .box{fill:#2c1f36;stroke:var(--fu-violet-hi)}
.fu-coffin.alive .box{fill:#2a2a24}
.fu-coffin .lily{opacity:0;transition:opacity .5s}
.fu-coffin .lily.on{opacity:1}
.fu-coffin .lily.first{filter:drop-shadow(0 0 4px rgba(239,203,95,.9))}
.fu-clues{margin-top:10px}
.fu-cl{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid #2e2b34;margin-bottom:5px;font:12px/1.3 'Spline Sans Mono',monospace;color:#6c6873;transition:all .5s}
.fu-cl .fu-av{width:24px;height:24px;border-width:1.5px;opacity:.2}
.fu-cl.solved{border-color:var(--fu-lily);color:var(--fu-lily)}
.fu-cl.solved .fu-av{opacity:1}
.fu-cl.missed{border-color:var(--fu-blood);color:#e07b86}
.fu-tally{margin-top:10px;border-top:1px solid #2e2b34;padding-top:6px}
.fu-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;color:var(--fu-lily);font-size:16px}
.fu-row b{font:12.5px/1 'Spline Sans Mono',monospace;font-weight:400}
.fu-lilybox{margin-top:12px;padding:11px 12px;border:1px dashed #6b5b2a;text-align:center;transition:all .5s}
.fu-lilybox .lbl{font:10.5px/1 'Spline Sans Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a7a4a}
.fu-lilybox .val{margin-top:6px;font-style:italic;color:#8a8690}
.fu-lilybox .holder{display:none;margin:8px auto 0}
.fu-lilybox .holder .fu-av{width:44px;height:44px;border-color:var(--fu-shield);box-shadow:0 0 14px rgba(239,203,95,.45)}
.fu-lilybox.on{border:1px solid var(--fu-shield)}
.fu-lilybox.on .holder{display:block}
.fu-lilybox.on .lbl,.fu-lilybox.on .val{color:var(--fu-shield);font-style:normal}
.fu-pot{margin-top:12px;border-top:1px solid #2e2b34;padding-top:10px}
.fu-pot .r{display:flex;justify-content:space-between;font-size:15px;color:#8a8690}
.fu-pot .r b{font:12.5px/1.8 'Spline Sans Mono',monospace;color:var(--fu-lily);font-weight:400}
.fu-pot .big{font:30px/1.1 'Spline Sans Mono',monospace;color:var(--fu-brass-hi);text-align:right;margin-top:4px}

.fu-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;
  padding:12px 16px;background:linear-gradient(0deg,#060507 60%,rgba(6,5,7,0))}
.fu-btn{font:20px/1 'Italiana',serif;letter-spacing:.1em;cursor:pointer;padding:11px 28px;color:#111014;
  background:linear-gradient(180deg,#fffdf6,var(--fu-lily));border:1px solid var(--fu-brass)}
.fu-btn:disabled{opacity:.4;cursor:default}
.fu-btn.ghost{background:transparent;color:var(--fu-lily);border:1px solid #3a3641}
.fu-btn:focus-visible{outline:2px solid var(--fu-lily);outline-offset:2px}
.fu-counter{font:12.5px/1 'Spline Sans Mono',monospace;color:#5f5b66;letter-spacing:.08em}

/* ══ THE STAGE — one scene, driven by the reveal ═══════════════════════
   Each step carries a state. A result lands in two beats: the ASK (spot
   sweeps, heartbeat, a card turning over) and, a second later, the ANSWER
   (a flash, a face flying, a stamp). Reveal all lands straight on answers. */
@property --fu-spin{syntax:'<angle>';inherits:false;initial-value:0deg}
.fx{position:sticky;top:54px;z-index:20;margin:22px 0 0;height:380px;border-radius:18px;overflow:hidden;isolation:isolate;
  background:radial-gradient(120% 90% at 50% 120%,#231a2c 0,#110e15 55%,#060507 100%);
  box-shadow:0 30px 80px -30px rgba(0,0,0,.95),inset 0 0 0 1px rgba(226,196,126,.18)}
.fx svg.fx-scene{position:absolute;inset:0;width:100%;height:100%}
.fx-layer{position:absolute;inset:0;pointer-events:none}
.fx-vig{box-shadow:inset 0 0 140px 50px rgba(0,0,0,.9);opacity:.7;transition:opacity .6s}
.fx-grain{opacity:.07;background-image:repeating-radial-gradient(circle at 23% 31%,#fff 0 1px,transparent 1px 3px);mix-blend-mode:overlay}
.fx-flash{opacity:0;background:radial-gradient(circle at var(--fx-fx,50%) var(--fx-fy,45%),#fff,rgba(244,241,232,.7) 22%,transparent 64%)}
.fx-flash.violet{background:radial-gradient(circle at var(--fx-fx,50%) var(--fx-fy,45%),#f1e4ff,rgba(179,148,208,.8) 24%,transparent 66%)}
.fx-flash.go{animation:fx-flash 1.2s ease-out}
@keyframes fx-flash{0%{opacity:0}10%{opacity:1}100%{opacity:0}}
.fx-rays{opacity:0;background:repeating-conic-gradient(from var(--fu-spin) at 50% 26%,rgba(239,203,95,.36) 0 6deg,transparent 6deg 18deg);
  -webkit-mask:radial-gradient(circle at 50% 26%,#000 0,#000 12%,transparent 55%);mask:radial-gradient(circle at 50% 26%,#000 0,#000 12%,transparent 55%);transition:opacity .6s}
.fx[data-phase=first] .fx-rays{opacity:1;animation:fx-spin 9s linear infinite}
@keyframes fx-spin{to{--fu-spin:360deg}}
.fx[data-phase=hold] .fx-vig,.fx[data-phase=ask] .fx-vig{opacity:1;animation:fx-heart 1s ease-in-out infinite}
@keyframes fx-heart{0%,100%{box-shadow:inset 0 0 140px 50px rgba(0,0,0,.9)}14%{box-shadow:inset 0 0 190px 90px rgba(40,10,50,.96)}28%{box-shadow:inset 0 0 140px 50px rgba(0,0,0,.9)}42%{box-shadow:inset 0 0 170px 70px rgba(40,10,50,.92)}}
.fx-cap{position:absolute;left:18px;top:14px;z-index:6;font:11px/1 'Spline Sans Mono',monospace;letter-spacing:.24em;text-transform:uppercase;color:var(--fu-brass-hi)}
.fx-cap b{display:block;margin-top:6px;font:400 30px/1 'Italiana',serif;letter-spacing:.06em;color:var(--fu-lily);text-transform:none}

.fx-proc,.fx-grave{transition:opacity .9s ease}
.fx[data-scene=grave] .fx-proc{opacity:0}
.fx[data-scene=proc] .fx-grave{opacity:0}
.fx-par1{animation:fx-par 26s linear infinite}
.fx-par2{animation:fx-par 14s linear infinite}
@keyframes fx-par{from{transform:translateX(0)}to{transform:translateX(-540px)}}
.fx-horse{animation:fx-trot .9s ease-in-out infinite}
.fx-horse.b{animation-delay:-.45s}
@keyframes fx-trot{50%{transform:translateY(-4px)}}
.fx-wheel{transform-box:fill-box;transform-origin:50% 50%;animation:fx-roll 2.4s linear infinite}
@keyframes fx-roll{to{transform:rotate(-360deg)}}
.fx-plume{transform-box:fill-box;transform-origin:50% 100%;animation:fx-plume 1.8s ease-in-out infinite}
@keyframes fx-plume{50%{transform:rotate(8deg)}}
.fx-walk{animation:fx-walk 1.2s ease-in-out infinite;animation-delay:var(--dl)}
@keyframes fx-walk{50%{transform:translateY(-5px)}}

.fx-oval{transition:transform 1.1s cubic-bezier(.3,1.2,.4,1),opacity .6s,filter .6s}
.fx-oval .rim{fill:none;stroke:var(--fu-brass);stroke-width:2.5}
.fx-oval .q{font:700 16px 'Spline Sans Mono',monospace;fill:var(--fu-lily)}
.fx[data-phase=ask] .fx-oval:not(.gone):not(.crack) .sway{animation:fx-sway 1.6s ease-in-out infinite;animation-delay:var(--dl)}
@keyframes fx-sway{50%{transform:rotate(4deg)}}
.fx-oval .sway{transform-box:view-box;transform-origin:0 -58px}
.fx-oval.gone .q{opacity:0}
.fx-oval.gone .rim{stroke:var(--fu-lily);filter:drop-shadow(0 0 6px #fff)}
.fx-oval.gone image{filter:none !important}
.fx-oval.crack .rim{stroke:var(--fu-blood)}
.fx-oval.crack .sway{animation:fx-shake .12s linear 5}
@keyframes fx-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.fx-crackline{opacity:0;transition:opacity .3s .2s}
.fx-oval.crack .fx-crackline{opacity:1}
.fx-sweep{opacity:0}
.fx[data-phase=ask] .fx-sweep{opacity:1;animation:fx-sweep 1.4s ease-in-out infinite alternate}
@keyframes fx-sweep{from{transform:translateX(0)}to{transform:translateX(440px)}}
.fx-card{opacity:0;transition:opacity .4s}
.fx-card .flip{transform-box:fill-box;transform-origin:50% 50%}
.fx[data-phase=ask] .fx-card,.fx[data-phase=safe] .fx-card,.fx[data-phase=miss] .fx-card{opacity:1}
.fx[data-phase=ask] .fx-card .flip{animation:fx-flip .8s cubic-bezier(.3,1.4,.5,1)}
@keyframes fx-flip{0%{transform:scaleX(0)}100%{transform:none}}
.fx-window{fill:#26242b;transition:fill .6s}
.fx-window.lit{fill:#3a3444;filter:drop-shadow(0 0 8px rgba(244,241,232,.7))}
.fx-eye{opacity:0;transition:opacity .4s}
.fx[data-phase=glance] .fx-eye{opacity:1}
.fx[data-phase=glance] .fx-eye .lidd{animation:fx-blink 1.4s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}
@keyframes fx-blink{45%,55%{transform:scaleY(.1)}}
.fx-walker{transition:filter .5s}
.fx[data-phase=glance] .fx-walker:not(.watched){filter:brightness(.3)}
.fx-walker.watched{filter:drop-shadow(0 0 12px rgba(179,148,208,1))}

.fx-cone{opacity:0;transition:opacity .8s}
.fx[data-scene=grave] .fx-cone{opacity:.9}
.fx[data-phase=hold] .fx-cone{animation:fx-flick .3s steps(2) infinite}
@keyframes fx-flick{50%{opacity:.5}}
.fx-lid{transition:transform 1s cubic-bezier(.3,1.3,.5,1),opacity 1s}
.fx-coffin.open .fx-lid{transform:translate(-60px,-90px) rotate(-38deg);opacity:0}
.fx-inner{opacity:0;transition:opacity .6s .3s,transform .9s cubic-bezier(.2,1.4,.4,1) .3s}
.fx-coffin.open .fx-inner{opacity:1;transform:translateY(-10px)}
.fx-coffin.dead .fx-body{fill:#2c1f36;stroke:var(--fu-violet-hi)}
.fx-coffin.alive .fx-body{fill:#2a2a24;stroke:var(--fu-lily)}
.fx-ribbon{opacity:0;transition:opacity .6s .6s}
.fx-coffin.dead .fx-ribbon{opacity:1}
.fx-coffin .shk{transform-box:fill-box;transform-origin:50% 100%}
.fx-coffin[data-shake="1"] .shk{animation:fx-rattle .12s linear infinite}
@keyframes fx-rattle{50%{transform:translateY(-1px) rotate(.8deg)}}
.fx-count{opacity:0;transition:opacity .3s}
.fx-count.on{opacity:1}
.fx-count .bb{transform-box:fill-box;transform-origin:50% 50%}
.fx-count.bump .bb{animation:fx-bump .5s cubic-bezier(.3,1.8,.5,1)}
@keyframes fx-bump{0%{transform:scale(1.9)}100%{transform:scale(1)}}
.fx-lily{transition:transform 1.1s cubic-bezier(.35,.1,.3,1),opacity .4s;opacity:0}
.fx-lily.fly{opacity:1}
.fx-lily.first path{fill:#ffe9a3;filter:drop-shadow(0 0 6px rgba(239,203,95,1))}
.fx-dust i,.fx-petal i{position:absolute;display:block;opacity:0}
.fx-dust i{width:var(--w);height:var(--w);border-radius:50%;background:rgba(214,200,180,.85)}
.fx-dust.go i{animation:fx-burst var(--t) cubic-bezier(.1,.7,.3,1) var(--dl) forwards}
@keyframes fx-burst{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--x),var(--y))}}
.fx-petal i{top:-20px;width:var(--w);height:calc(var(--w) * .6);border-radius:60% 40% 60% 40%;background:#f4f1e8}
.fx-petal.go i{animation:fx-fall var(--t) linear var(--dl) forwards}
@keyframes fx-fall{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:1}100%{opacity:0;transform:translate(var(--x),420px) rotate(540deg)}}
.fx-shield{opacity:0;transition:opacity .5s}
.fx-shield .rise{transform-box:fill-box;transform-origin:50% 50%;transform:translateY(60px) scale(.5);transition:transform 1s cubic-bezier(.2,1.5,.4,1)}
.fx.has-shield .fx-shield{opacity:1}
.fx.has-shield .fx-shield .rise{transform:none}
.fx-stamp{position:absolute;z-index:7;left:50%;top:84%;padding:8px 18px;border:4px solid currentColor;border-radius:8px;white-space:nowrap;
  font:400 28px/1 'Italiana',serif;letter-spacing:.12em;background:rgba(10,6,14,.86);opacity:0;transform:translate(-50%,-50%) rotate(-4deg) scale(3);pointer-events:none}
.fx-stamp.go{animation:fx-slam .45s cubic-bezier(.2,1.6,.4,1) forwards}
@keyframes fx-slam{0%{opacity:0;transform:translate(-50%,-50%) rotate(-4deg) scale(3)}100%{opacity:1;transform:translate(-50%,-50%) rotate(-4deg) scale(1)}}
.fx-stamp.safe{color:var(--fu-lily)}.fx-stamp.wrong{color:#ff5f75}.fx-stamp.dead{color:var(--fu-violet-hi)}.fx-stamp.gold{color:var(--fu-shield)}
.fx-pot{position:absolute;right:18px;top:14px;z-index:6;text-align:right;font:11px/1 'Spline Sans Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a8690}
.fx-pot b{display:block;margin-top:6px;font:600 26px/1 'Spline Sans Mono',monospace;letter-spacing:0;color:var(--fu-brass-hi)}
.fx-pot b.tick{animation:fx-tick .8s ease-out}
@keyframes fx-tick{0%{transform:scale(1.5);color:#fff}100%{transform:scale(1)}}
@media(max-width:700px){.fx{height:250px}.fx-cap b{font-size:22px}.fx-stamp{font-size:22px}}
@media (prefers-reduced-motion: reduce){.fx *,.fx{animation:none !important;transition:none !important}}
@media (prefers-reduced-motion: reduce){
  .fu-petals{animation:none}
  .fu-card{transition:none}
}

.fu-hero .mb-roster{justify-content:center;text-align:left;position:relative}
.fu-hero .mb-rname{font-family:'Spline Sans Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--fu-lily)}
.fu-brief .mb-hostname{font:11.5px/1.4 'Spline Sans Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#6e6875}
.fu-card .mb-avs .cv-av{width:34px;height:34px;border:2px solid #3a3641}
.fu-card.relic .cv-av{border-color:var(--fu-shield)}.fu-card.dead .cv-av{border-color:var(--fu-violet)}
.fu-sidebody{min-height:40px}
.fx-oval image.gray{filter:grayscale(1) brightness(.7)}
.fx-oval.gone image.gray{filter:none}
.fx-card-t{font:italic 16px/1.35 'Old Standard TT',serif;color:#231f28}
.fx{transition:height .4s cubic-bezier(.3,1,.4,1)}
.fx.fx-min{height:56px}
.fx.fx-min .fx-scene,.fx.fx-min .fx-layer,.fx.fx-min .fx-stamp{opacity:0;pointer-events:none}
.fx.fx-min .fx-cap b{font-size:17px;display:inline;margin-left:10px}
.fx.fx-min .fx-pot b{font-size:15px;display:inline;margin-left:8px}
.fx-fold{position:absolute;right:18px;bottom:12px;z-index:8;cursor:pointer;border:1px solid rgba(255,255,255,.2);
  background:rgba(0,0,0,.45);color:var(--fu-lily);border-radius:20px;padding:5px 12px;font:10.5px/1 'Spline Sans Mono',monospace;
  letter-spacing:.16em;text-transform:uppercase;opacity:.65;transition:opacity .3s}
.fx-fold:hover{opacity:1}
.fx-bubble .pop{transform-box:fill-box;transform-origin:50% 100%;animation:fx-pop .45s cubic-bezier(.3,1.7,.5,1)}
@keyframes fx-pop{0%{transform:scale(0)}100%{transform:scale(1)}}
.fx-bubble rect{fill:#f4f1e8;stroke:#6e4f86;stroke-width:2}
.fx-bubble path{fill:#f4f1e8}
.fx-bubble text{font:600 15px 'Spline Sans Mono',monospace;fill:#231f28}
.fx-bubble.old{opacity:.35}
.fx-bubble.last rect{fill:#efcb5f;stroke:#7b6224}
.fx-bubble.last path{fill:#efcb5f}
.fx-oval.named .rim{stroke:#efcb5f;stroke-width:4;filter:drop-shadow(0 0 10px rgba(239,203,95,1))}
.fx-oval.named image.gray{filter:grayscale(.3) brightness(1)}
.fx-coffin .pick{fill:none;stroke-width:4;opacity:0;animation:fx-pickin .6s ease-out forwards}
.fx-coffin .pick.a{stroke:#e2c47e}.fx-coffin .pick.b{stroke:#b394d0}
@keyframes fx-pickin{from{opacity:0;transform:scale(1.2)}to{opacity:1;transform:none}}
.fx-mface{transition:filter .4s}
.fx[data-phase=argue] .fx-mface:not(.arguing){filter:brightness(.3)}
.fx-mface.arguing{filter:drop-shadow(0 0 10px rgba(226,196,126,1))}
@media(prefers-reduced-motion:reduce){.fu-root *,.fu-root *::before,.fu-root *::after{animation:none !important;transition:none !important}.fu-card{opacity:1;transform:none}}
`,
};

export default FUNERAL;
