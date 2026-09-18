// ══════════════════════════════════════════════════════════════════════
// js/vp-tr/conclave-chalice.js — the library, on a chalice night
// ══════════════════════════════════════════════════════════════════════
//
// A chalice night has NO conclave: no climb, no cloaks, no argument. The
// conclave screen still has to draw something, and drawing the ordinary turret
// for it made the most distinctive night in the catalogue look exactly like
// every other night — the complaint that produced this file.
//
// So this is a stage, in the sense js/vp-tr/mission-stage.js means it: a
// full-width scene above the beats that moves one step per reveal. Five steps,
// and the last one branches on whether the poison was the slow kind.
//
//   0  the library      shelves, a lantern, dust, nobody looking yet
//   1  the search       books come out; the chalice answers the light
//   2  the pour         the bottle tips and the cup fills
//   3  the hand-over    the glass crosses the room to a name
//   4  the morning      an empty chair, or an hourglass and a row of coffins
//
// Everything is SVG and CSS keyframes keyed off `data-ch` on the stage root,
// which `_reapplyVisibility` writes on every click. No timers: a reader who
// jumps to the end with Reveal All gets the end state, not a replay.

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// The fold carries its own behaviour and remembers itself in the same key the
// mission stages use: one choice per viewer, not one per screen.
const FOLD = "(function(b){var s=b.closest('.ch-stage');var m=s.classList.toggle('ch-min');"
  + "b.innerHTML=m?'&#9656; show':'&#9662; hide';"
  + "try{localStorage.setItem('tr_stage_min',m?'1':'0')}catch(e){}})(this)";

function stageFolded() {
  try { return localStorage.getItem('tr_stage_min') === '1'; } catch { return false; }
}

/** How many stage steps there are. The caller maps beats onto this. */
export const CHALICE_STEPS = 5;

/**
 * Which stage step a revealed beat index sits on.
 *
 * The beat stream is built from the record and its length varies with how many
 * Traitors are in the room, so the mapping is proportional rather than a table
 * of indices: the stage always opens on the library and always ends on the
 * morning, whatever the night's beat count turns out to be.
 */
export function chaliceStep(idx, total) {
  if (!(total > 1)) return 0;
  const at = Math.max(0, Math.min(idx, total - 1));
  return Math.max(0, Math.min(CHALICE_STEPS - 1,
    Math.round((at / (total - 1)) * (CHALICE_STEPS - 1))));
}

const CAPTIONS = [
  ['I. The Library', 'No stair, no cloaks. The pact is sent to the shelves.'],
  ['II. The Search', '{finder} takes the plays down one at a time.'],
  ['III. The Pour', 'Something is put in the cup that was not in it before.'],
  ['IV. The Hand-Over', '{who} carries it across the room to {victim}.'],
  ['V. The Morning', ''],
];

function _caption(i, d, rec) {
  const [h, p] = CAPTIONS[i];
  const last = i === CHALICE_STEPS - 1;
  // Step III is where the night's one real decision is, so it says whether the
  // pact was behind it. `agreed` is undefined on a record written before the
  // library became a conversation; those keep the neutral line.
  const pour = d.agreed === false
    ? 'Somebody else wanted a different name. {who} is the one holding the cup.'
    : d.agreed === true && (d.overruled || []).length === 0
      ? 'They came to the same name before the cup was even found.'
      : p;
  const tail = i === 2 ? pour : last
    ? (rec.blocked
      ? 'The glass is drunk and nothing happens to the person holding it.'
      : d.slow
        ? 'Nobody falls down. It takes a day, and the castle will be told at a graveside.'
        : 'The chair is empty by breakfast, and the room is told whose it was.')
    : p;
  return '<div class="ch-cap"><b>' + h + '</b><span>'
    + _esc(tail.replace('{finder}', d.searcher || 'The pact')
      .replace('{who}', d.pourer || 'A Traitor')
      .replace('{victim}', rec.target || 'somebody')) + '</span></div>';
}

/** One shelf of books: widths and tilts hashed off the seed, not drawn at random. */
function _shelf(y, seed, n) {
  let x = 6, out = '', h = seed;
  for (let i = 0; i < n; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const w = 5 + (h % 7);
    if (x + w > 118) break;
    const tall = 26 + ((h >> 4) % 9);
    const lean = ((h >> 8) % 5) === 0;
    out += '<rect class="ch-book" x="' + x + '" y="' + (y - tall) + '" width="' + w
      + '" height="' + tall + '" rx="1"'
      + (lean ? ' transform="rotate(-7 ' + x + ' ' + y + ')"' : '')
      + ' style="--bk:' + (0.1 + ((h >> 12) % 5) * 0.045) + '"/>';
    x += w + 1.5;
  }
  return out;
}

function _shelves() {
  let out = '';
  for (let i = 0; i < 4; i++) {
    const y = 42 + i * 40;
    out += '<rect class="ch-plank" x="0" y="' + y + '" width="124" height="4"/>'
      + _shelf(y, 7919 + i * 131, 12);
  }
  return out;
}

/** The pact's reader, in silhouette, with an arm that reaches on step 1. */
const FIGURE = '<g class="ch-figure">'
  + '<ellipse cx="0" cy="-62" rx="10" ry="11"/>'
  + '<path d="M-15 -50 Q0 -56 15 -50 L18 0 L-18 0 Z"/>'
  + '<g class="ch-arm"><rect x="9" y="-50" width="7" height="30" rx="3.5"/></g>'
  + '</g>';

const CUP = '<g class="ch-cup">'
  + '<path class="ch-cup-bowl" d="M-11 -20 L11 -20 L8 -4 Q0 2 -8 -4 Z"/>'
  + '<rect class="ch-cup-stem" x="-1.6" y="-4" width="3.2" height="12"/>'
  + '<ellipse class="ch-cup-foot" cx="0" cy="9" rx="8" ry="2.6"/>'
  + '<path class="ch-fill" d="M-10 -9 L10 -9 L8 -4 Q0 2 -8 -4 Z"/>'
  + '</g>';

const BOTTLE = '<g class="ch-bottle">'
  + '<path d="M-6 0 L-6 -18 L-2.4 -26 L-2.4 -34 L2.4 -34 L2.4 -26 L6 -18 L6 0 Z"/>'
  + '<rect class="ch-cork" x="-3" y="-38" width="6" height="4" rx="1"/>'
  + '</g>';

const COFFIN = '<path class="ch-coffin" d="M0 0 L7 5 L5 22 L-5 22 L-7 5 Z"/>';

const GLASS_SLIDE = '<g class="ch-glass">'
  + '<path d="M-7 -14 L7 -14 L5 0 L-5 0 Z"/>'
  + '<path class="ch-glass-fill" d="M-6 -6 L6 -6 L5 0 L-5 0 Z"/>'
  + '</g>';

/**
 * The stage itself. `rec` is the conclave record; `rec.vdata` carries the
 * chalice facts. Safe on a record with no `vdata` — the screen then draws the
 * scene without names in the captions.
 */
export function chaliceStage(rec, step = 0, faces = {}) {
  const d = (rec && rec.vdata) || {};
  const min = stageFolded();
  // THE FACES SIT OVER THE SILHOUETTES, not inside the SVG: the portraits are
  // HTML (js/vp-tr/portrait.js) and a <foreignObject> would drag the whole
  // avatar stack into the scene graph. The viewBox is 400x200 and the stage is
  // locked to 2/1, so a percentage lands exactly where the figure's head is.
  const face = (html, cls, x, y) => (html
    ? '<div class="ch-face ' + cls + '" style="left:' + x + '%;top:' + y + '%">'
      + html + '</div>' : '');
  const coffins = (d.coffins || []).length || 3;
  let graves = '';
  for (let i = 0; i < Math.min(coffins, 6); i++) {
    graves += '<g class="ch-grave" style="--i:' + i + '" transform="translate('
      + (196 + i * 32) + ',112) scale(1.5)"><g class="ch-lift">' + COFFIN + '</g></g>';
  }
  return '<div class="ch-stage' + (min ? ' ch-min' : '') + '" data-ch="' + step + '"'
    + (rec && rec.blocked ? ' data-blocked="1"' : '')
    + (d.slow ? ' data-slow="1"' : '') + '>'
    + '<svg class="ch-svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice"'
    + ' aria-hidden="true">'
    + '<defs>'
    + '<radialGradient id="ch-lamp" cx="50%" cy="50%">'
    + '<stop offset="0%" stop-color="#e0a049" stop-opacity=".62"/>'
    + '<stop offset="100%" stop-color="#e0a049" stop-opacity="0"/>'
    + '</radialGradient>'
    + '<linearGradient id="ch-floor" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#241b14"/><stop offset="100%" stop-color="#0d0a08"/>'
    + '</linearGradient>'
    + '</defs>'
    + '<rect x="0" y="0" width="400" height="200" fill="#120e0b"/>'
    + '<g class="ch-case" transform="translate(6,6)">' + _shelves() + '</g>'
    + '<g class="ch-case ch-case-r" transform="translate(270,6)">' + _shelves() + '</g>'
    + '<rect class="ch-floor" x="0" y="170" width="400" height="30" fill="url(#ch-floor)"/>'
    // the chalice, still on the shelf, answering the lantern
    + '<circle class="ch-glow" cx="88" cy="116" r="44" fill="url(#ch-lamp)"/>'
    + '<g class="ch-hidden" transform="translate(88,124) scale(.8)">' + CUP + '</g>'
    + '<g class="ch-reader" transform="translate(146,170)">' + FIGURE + '</g>'
    // the table: the pour, then the hand-over
    + '<g class="ch-table" transform="translate(200,152)">'
    + '<rect class="ch-top" x="-52" y="0" width="104" height="6" rx="2"/>'
    + '<rect class="ch-leg" x="-42" y="6" width="5" height="14"/>'
    + '<rect class="ch-leg" x="37" y="6" width="5" height="14"/>'
    + '<g transform="translate(-14,-9)">' + CUP + '</g>'
    + '<g class="ch-pourer" transform="translate(16,-9)">' + BOTTLE + '</g>'
    + '<path class="ch-stream" d="M-14 -38 L-14 -20"/>'
    + '</g>'
    + '<g class="ch-hand" transform="translate(236,170)">' + FIGURE + '</g>'
    + '<g class="ch-taker" transform="translate(330,170) scale(-1,1)">' + FIGURE + '</g>'
    + '<g class="ch-cross" transform="translate(186,146)">' + GLASS_SLIDE + '</g>'
    // the morning
    + '<g class="ch-morning">'
    + '<rect class="ch-chair" x="44" y="128" width="40" height="5" rx="2"/>'
    + '<rect class="ch-chair" x="46" y="133" width="5" height="37" rx="2"/>'
    + '<rect class="ch-chair" x="77" y="133" width="5" height="37" rx="2"/>'
    + '<rect class="ch-chair" x="44" y="86" width="5" height="44" rx="2"/>'
    + '<rect class="ch-chair" x="79" y="86" width="5" height="44" rx="2"/>'
    + '<rect class="ch-chair" x="44" y="88" width="40" height="4" rx="2"/>'
    + '<g class="ch-hour" transform="translate(136,126)">'
    + '<path d="M-13 -21 L13 -21 L1.4 0 L13 21 L-13 21 L-1.4 0 Z"/>'
    + '<rect x="-16" y="-25" width="32" height="4" rx="2"/>'
    + '<rect x="-16" y="21" width="32" height="4" rx="2"/>'
    + '<circle class="ch-sand" cx="0" cy="6" r="2.4"/>'
    + '</g>' + graves + '</g>'
    + '<rect class="ch-dark" x="0" y="0" width="400" height="200"/>'
    + '</svg>'
    + '<div class="ch-caps">'
    + CAPTIONS.map((_, i) => '<div class="ch-cap-slot" data-i="' + i + '">'
      + _caption(i, d, rec || {}) + '</div>').join('')
    + '</div>'
    + face(faces.searcher, 'ch-face-find', 36.5, 54)
    + face(faces.pourer, 'ch-face-pour', 59, 54)
    + face(faces.victim, 'ch-face-take', 82.5, 54)
    + face(faces.victim, 'ch-face-gone', 16, 55)
    + '<div class="ch-ticks">' + CAPTIONS.map((_, i) =>
      '<i class="ch-tick" data-i="' + i + '"></i>').join('') + '</div>'
    + '<button type="button" class="ch-fold" onclick="' + FOLD + '">'
    + (min ? '&#9656; show' : '&#9662; hide') + '</button>'
    + '</div>';
}

export const CHALICE_CSS = `
.ch-stage{position:sticky;top:54px;z-index:20;width:100%;aspect-ratio:2/1;max-height:290px;
  border:1px solid rgba(224,160,73,.18);border-radius:10px;overflow:clip;
  background:#0d0b09;margin:0 0 22px;
  box-shadow:0 18px 44px rgba(0,0,0,.66);
  transition:max-height .45s cubic-bezier(.4,0,.2,1)}
.ch-stage.ch-min{max-height:74px}
.ch-stage.ch-min .ch-svg,.ch-stage.ch-min .ch-face{opacity:0}
.ch-fold{position:absolute;right:14px;bottom:10px;z-index:9;cursor:pointer;
  border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.5);color:#e8e2d8;
  border-radius:999px;padding:3px 10px;font:600 10px/1 system-ui;letter-spacing:.1em;
  text-transform:uppercase;opacity:.72}
.ch-fold:hover{opacity:1}
.ch-face{position:absolute;width:6.4%;aspect-ratio:1;transform:translate(-50%,-50%);
  border-radius:50%;overflow:hidden;opacity:0;pointer-events:none;
  box-shadow:0 0 0 1.5px rgba(224,160,73,.5),0 4px 14px rgba(0,0,0,.7);
  transition:opacity .5s ease,transform .8s ease}
.ch-face .cv-av{width:100%!important;height:100%!important;display:block;border-radius:50%}
.ch-face .cv-av img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.ch-svg{position:absolute;inset:0;width:100%;height:100%}
.ch-plank{fill:#2a1f16}
.ch-book{fill:#8a6a44;opacity:calc(.6 + var(--bk));transition:transform .5s ease}
.ch-case-r .ch-book{opacity:.45}
.ch-dark{fill:#050403;opacity:.34;transition:opacity 1.1s ease}
.ch-glow{opacity:0;transition:opacity .9s ease}
.ch-hidden{opacity:0;transition:opacity .7s ease .25s}
.ch-hidden .ch-cup-bowl,.ch-hidden .ch-cup-stem,.ch-hidden .ch-cup-foot{fill:#c9a227}
.ch-hidden .ch-fill{opacity:0}
.ch-figure{fill:#050403}
.ch-arm{transform-origin:10px -42px;transition:transform .6s cubic-bezier(.4,1.5,.5,1)}
.ch-reader{opacity:0;transition:opacity .6s ease,transform .9s ease}
.ch-taker,.ch-hand{opacity:0;transition:opacity .7s ease}
.ch-table{opacity:0;transition:opacity .6s ease}
.ch-top,.ch-leg{fill:#2a1f16}
.ch-cup-bowl,.ch-cup-stem{fill:#8a6f3c}
.ch-cup-foot{fill:#6d5730}
.ch-fill{fill:#6f9a5a;opacity:0;transform-origin:0 2px;transform:scaleY(0)}
.ch-bottle{fill:#1d2a1c}
.ch-cork{fill:#4a3a22}
.ch-pourer{transform-origin:0 0;transition:transform .8s cubic-bezier(.4,1.4,.5,1)}
.ch-stream{stroke:#6f9a5a;stroke-width:2;fill:none;opacity:0;
  stroke-dasharray:20;stroke-dashoffset:20}
.ch-cross{opacity:0}
.ch-glass{fill:#8a6f3c}
.ch-glass-fill{fill:#6f9a5a}
.ch-morning{opacity:0;transition:opacity .8s ease}
.ch-chair{fill:#4a3a28}
.ch-hour{fill:#8a6a44;opacity:0}
.ch-sand{fill:#6f9a5a}
.ch-coffin{fill:#2a2018;stroke:#8a6a44;stroke-width:1.2}
.ch-grave{opacity:0}

/* ── step 1: the search ─────────────────────────────────────────────── */
.ch-stage[data-ch="1"] .ch-dark,.ch-stage[data-ch="2"] .ch-dark,
.ch-stage[data-ch="3"] .ch-dark,.ch-stage[data-ch="4"] .ch-dark{opacity:.3}
.ch-stage[data-ch="1"] .ch-reader,.ch-stage[data-ch="2"] .ch-reader{opacity:1}
.ch-stage[data-ch="1"] .ch-arm{transform:rotate(-52deg)}
.ch-stage[data-ch="1"] .ch-glow{opacity:1;animation:ch-breathe 2.6s ease-in-out infinite}
.ch-stage[data-ch="1"] .ch-hidden{opacity:1;animation:ch-gleam 2.2s ease-in-out infinite}
.ch-stage[data-ch="1"] .ch-case .ch-book:nth-child(4n+3){transform:translateY(-6px)}

/* ── step 2: the pour ───────────────────────────────────────────────── */
.ch-stage[data-ch="2"] .ch-table,.ch-stage[data-ch="3"] .ch-table{opacity:1}
.ch-stage[data-ch="2"] .ch-reader{transform:translate(-40px,0);opacity:.5}
.ch-stage[data-ch="2"] .ch-pourer{transform:translate(-26px,-26px) rotate(-118deg)}
.ch-stage[data-ch="2"] .ch-stream{opacity:1;animation:ch-pour 1.1s ease-in .45s forwards}
.ch-stage[data-ch="2"] .ch-fill{opacity:1;animation:ch-fill 1.2s ease-out .7s forwards}
.ch-stage[data-ch="3"] .ch-fill{opacity:1;transform:scaleY(1)}

/* ── step 3: the hand-over ──────────────────────────────────────────── */
.ch-stage[data-ch="3"] .ch-cross{opacity:1;animation:ch-cross 1.6s ease-in-out forwards}
.ch-stage[data-ch="2"] .ch-hand,.ch-stage[data-ch="3"] .ch-hand{opacity:1}
.ch-stage[data-ch="3"] .ch-taker{opacity:1}
.ch-stage[data-ch="3"] .ch-taker .ch-arm{transform:rotate(-38deg)}
.ch-stage[data-ch="3"] .ch-hand .ch-arm{transform:rotate(44deg)}
/* the faces follow the bodies they sit on */
.ch-stage[data-ch="1"] .ch-face-find,.ch-stage[data-ch="2"] .ch-face-find{opacity:1}
.ch-stage[data-ch="2"] .ch-face-find{transform:translate(-50%,-50%) translateX(-10%);opacity:.5}
.ch-stage[data-ch="2"] .ch-face-pour,.ch-stage[data-ch="3"] .ch-face-pour{opacity:1}
.ch-stage[data-ch="3"] .ch-face-take{opacity:1}
.ch-stage[data-ch="4"] .ch-face-gone{opacity:.42;filter:grayscale(1)}

/* ── step 4: the morning ────────────────────────────────────────────── */
.ch-stage[data-ch="4"] .ch-case,.ch-stage[data-ch="4"] .ch-table,
.ch-stage[data-ch="4"] .ch-hidden,.ch-stage[data-ch="4"] .ch-glow,
.ch-stage[data-ch="4"] .ch-reader,.ch-stage[data-ch="4"] .ch-taker,
.ch-stage[data-ch="4"] .ch-hand{opacity:0}
.ch-stage[data-ch="4"] .ch-morning{opacity:1}
.ch-stage[data-ch="4"][data-slow] .ch-hour{opacity:1}
.ch-stage[data-ch="4"][data-slow] .ch-sand{animation:ch-sand 2.4s linear infinite}
.ch-stage[data-ch="4"][data-slow] .ch-grave{opacity:1}
.ch-stage[data-ch="4"][data-slow] .ch-lift{
  animation:ch-rise .7s ease-out both;animation-delay:calc(.4s + var(--i) * .18s)}
.ch-stage[data-ch="4"][data-blocked] .ch-morning{opacity:.35}

@keyframes ch-breathe{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes ch-gleam{0%,100%{filter:none}50%{filter:brightness(1.7)}}
@keyframes ch-pour{to{stroke-dashoffset:0}}
@keyframes ch-fill{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes ch-cross{from{transform:translate(186px,146px)}to{transform:translate(310px,152px)}}
@keyframes ch-sand{0%{transform:translateY(-10px);opacity:0}
  20%{opacity:1}100%{transform:translateY(12px);opacity:0}}
@keyframes ch-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

/* ── captions + ticks ───────────────────────────────────────────────── */
.ch-caps{position:absolute;left:0;right:0;bottom:0;padding:14px 16px 16px;
  background:linear-gradient(to top,rgba(5,4,3,.92),rgba(5,4,3,0))}
.ch-cap-slot{display:none}
.ch-cap b{display:block;font:700 11px/1.5 var(--tr-ui,system-ui);letter-spacing:.18em;
  text-transform:uppercase;color:#e0a049}
.ch-cap span{display:block;font:400 14px/1.5 var(--tr-body,Georgia,serif);color:#d8cfc2}
.ch-ticks{position:absolute;top:12px;right:14px;display:flex;gap:6px}
.ch-tick{width:16px;height:2px;border-radius:1px;background:rgba(224,160,73,.22)}
.ch-stage[data-ch="0"] .ch-cap-slot[data-i="0"],
.ch-stage[data-ch="1"] .ch-cap-slot[data-i="1"],
.ch-stage[data-ch="2"] .ch-cap-slot[data-i="2"],
.ch-stage[data-ch="3"] .ch-cap-slot[data-i="3"],
.ch-stage[data-ch="4"] .ch-cap-slot[data-i="4"]{display:block}
.ch-stage[data-ch="0"] .ch-tick[data-i="0"],
.ch-stage[data-ch="1"] .ch-tick[data-i="1"],
.ch-stage[data-ch="2"] .ch-tick[data-i="2"],
.ch-stage[data-ch="3"] .ch-tick[data-i="3"],
.ch-stage[data-ch="4"] .ch-tick[data-i="4"]{background:#e0a049}

@media (prefers-reduced-motion:reduce){
  .ch-stage *{animation:none!important;transition:none!important}
  .ch-stage[data-ch="2"] .ch-fill,.ch-stage[data-ch="3"] .ch-fill{transform:scaleY(1)}
  .ch-stage[data-ch="4"][data-slow] .ch-lift{opacity:1;transform:none}
}
`;
