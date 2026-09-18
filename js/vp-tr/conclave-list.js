// ══════════════════════════════════════════════════════════════════════
// js/vp-tr/conclave-list.js — the sheet of paper, on an On Trial night
// ══════════════════════════════════════════════════════════════════════
//
// One stage, two nights, because it is one object: the list is written on the
// first night and crossed off on the second, and the whole twist is what
// happens to that piece of paper in between.
//
//   MODE `named` — the night they write it
//     0  the paper      a sheet, a quill, a candle, nothing on it yet
//     1  the argument   two of them either side of it, still nothing on it
//     2  the names      the names appear, one line at a time
//     3  no letter      the quill goes down and nobody is sealed
//
//   MODE `taken` — the night they come back for it
//     0  the list       the same sheet, all the names still on it
//     1  the day        the names the castle took are struck out
//     2  the argument   the pact over what is left of their own list
//     3  the name       one line goes through in red
//
// Everything is keyed off `data-ls` on the root, written per BEAT by the
// conclave screen (`_reapplyVisibility`), so the paper keeps step with the
// argument however long it runs.
//
// THE NAMES ARE SVG `<text>`, not HTML over the top. They have to sit on the
// ruled lines of the sheet and be struck through by a path that lands exactly
// on them, and a percentage-positioned overlay cannot promise that at two
// aspect ratios. The portraits still ride above as HTML, the way every other
// stage in this show does them.
//
// THE EXIT VERB IS PASSED IN, never written here. This show has two of them and
// every screen takes them from js/shows.js; a stage that typed one would be the
// defect tests/tr-vp.test.js exists to catch.

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const FOLD = "(function(b){var s=b.closest('.ls-stage');var m=s.classList.toggle('ls-min');"
  + "b.innerHTML=m?'&#9656; show':'&#9662; hide';"
  + "try{localStorage.setItem('tr_stage_min',m?'1':'0')}catch(e){}})(this)";

function stageFolded() {
  try { return localStorage.getItem('tr_stage_min') === '1'; } catch { return false; }
}

export const LIST_STEPS = 4;

const CAPTIONS = {
  named: [
    ['I. The Paper', 'No letter tonight. Something else is going to be written.'],
    ['II. The Argument', ''],
    ['III. The Names', ''],
    ['IV. No Seal', ''],
  ],
  taken: [
    ['I. The List', ''],
    ['II. What The Day Did', ''],
    ['III. The Argument', 'They argue over what is left of their own handwriting.'],
    ['IV. The Name', ''],
  ],
};

function _caption(mode, i, d, rec, verb) {
  const [h, p] = CAPTIONS[mode][i];
  const names = d.names || [];
  const lost = d.lost || [];
  let tail = p;
  if (mode === 'named') {
    if (i === 1) {
      tail = 'They are choosing who goes on it, which is not the same as choosing who dies.';
    } else if (i === 2) {
      tail = (names.length > 3 ? 'Four' : 'Three')
        + ' names, and one of them does not see the night after next.';
    } else {
      tail = 'The quill goes down. Nobody is ' + verb + ' tonight, and nobody off '
        + 'this paper can be ' + verb + ' tomorrow.';
    }
  } else if (i === 0) {
    tail = 'The same sheet, a day older. ' + (names.length > 3 ? 'Four' : 'Three')
      + ' names went on it, and the castle has had all day with them.';
  } else if (i === 1) {
    tail = lost.length
      ? (lost.length > 1 ? lost.join(' and ') + ' are' : lost[0] + ' is')
        + ' gone, and the pact has that much less to choose from.'
      : 'Nothing came off it. Every name they wrote is still in the castle.';
  } else if (i === 3) {
    tail = rec.blocked
      ? 'They come for a name on their own list and something stops them.'
      : (d.taken || 'One of them') + ' is the one they come back for.';
  }
  return '<div class="ls-cap"><b>' + h + '</b><span>' + _esc(tail) + '</span></div>';
}

// A hand, a quill, and the sheet it is working on.
const QUILL = '<g class="ls-quill">'
  + '<path d="M0 0 L2.6 -3.4 L26 -34 Q30 -39 33 -36 Q36 -33 31 -29 L4 -3 Z" fill="#d9cfbc"/>'
  + '<path d="M0 0 L5.4 -4.4 L3 -1.6 Z" fill="#3a2d1d"/>'
  + '</g>';

const CANDLE = '<g class="ls-candle">'
  + '<rect x="-4" y="-26" width="8" height="26" rx="1.5" fill="#e8dcc0"/>'
  + '<rect x="-7" y="0" width="14" height="4" rx="1.5" fill="#6d5730"/>'
  + '<path class="ls-flame" d="M0 -38c2.8 3.2 4.2 5 4.2 7.4a4.2 4.2 0 0 1-8.4 0c0-2.4 1.4-4.2 4.2-7.4z"'
  + ' fill="#ffe6a8"/>'
  + '</g>';

const FIGURE = '<g class="ls-figure">'
  + '<ellipse cx="0" cy="-58" rx="9.4" ry="10.4"/>'
  + '<path d="M-14 -47 Q0 -52 14 -47 L17 0 L-17 0 Z"/>'
  + '</g>';

/**
 * The stage. `rec` is the conclave record; `rec.vdata` carries the list.
 */
export function listStage(rec, step = 0, faces = {}, verb = 'taken') {
  const d = (rec && rec.vdata) || {};
  const mode = d.phase === 'named' ? 'named' : 'taken';
  const names = (d.names || []).slice(0, 4);
  const lost = d.lost || [];
  const min = stageFolded();

  // The ruled lines of the sheet, and a name on each one.
  const top = 74;
  const gap = 23;
  let rows = '';
  names.forEach((n, i) => {
    const y = top + i * gap;
    const cls = ['ls-row', lost.includes(n) ? 'ls-gone' : '',
      n === d.taken ? 'ls-took' : '', n === d.cover ? 'ls-cover' : ''].filter(Boolean).join(' ');
    rows += '<g class="' + cls + '" style="--i:' + i + '">'
      + '<path class="ls-rule" d="M148 ' + (y + 6) + ' H320"/>'
      + '<text class="ls-name" x="152" y="' + y + '">' + _esc(n) + '</text>'
      // struck by the castle during the day
      + '<path class="ls-strike" d="M150 ' + (y - 4) + ' L' + (156 + n.length * 7.2)
      + ' ' + (y - 6) + '"/>'
      // and the red one, on the night they come back
      + '<path class="ls-kill" d="M148 ' + (y - 3) + ' L' + (160 + n.length * 7.2)
      + ' ' + (y - 7) + '"/>'
      + '</g>';
  });

  const face = (html, cls, x, y) => (html
    ? '<div class="ls-face ' + cls + '" style="left:' + x + '%;top:' + y + '%">'
      + html + '</div>' : '');
  // The portraits ride beside their own line on the sheet.
  const nameFaces = names.map((n, i) => face(faces[n],
    'ls-face-row ls-face-' + i + (lost.includes(n) ? ' ls-fgone' : '')
    + (n === d.taken ? ' ls-ftook' : ''),
    33, ((top + i * gap - 5) / 200) * 100)).join('');

  return '<div class="ls-stage' + (min ? ' ls-min' : '') + '" data-ls="' + step + '"'
    + ' data-mode="' + mode + '"' + (rec && rec.blocked ? ' data-blocked="1"' : '') + '>'
    + '<svg class="ls-svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice"'
    + ' aria-hidden="true">'
    + '<defs>'
    + '<radialGradient id="ls-lamp" cx="50%" cy="46%">'
    + '<stop offset="0%" stop-color="#e0a049" stop-opacity=".46"/>'
    + '<stop offset="100%" stop-color="#e0a049" stop-opacity="0"/>'
    + '</radialGradient>'
    + '</defs>'
    + '<rect x="0" y="0" width="400" height="200" fill="#100c0a"/>'
    + '<ellipse cx="200" cy="120" rx="210" ry="120" fill="url(#ls-lamp)"/>'
    // the table
    + '<rect class="ls-table" x="0" y="168" width="400" height="32"/>'
    // the sheet
    + '<g class="ls-sheet">'
    + '<path class="ls-paper" d="M126 30 L332 26 L338 176 L120 172 Z"/>'
    + '<path class="ls-fold" d="M128 52 L334 48"/>'
    + rows
    + '</g>'
    + '<g class="ls-hand" transform="translate(330,150)">' + QUILL + '</g>'
    + '<g transform="translate(74,166)">' + CANDLE + '</g>'
    + '<g class="ls-left" transform="translate(52,190) scale(.82)">' + FIGURE + '</g>'
    + '<g class="ls-right" transform="translate(360,190) scale(.82) "><g transform="scale(-1,1)">'
    + FIGURE + '</g></g>'
    + '<rect class="ls-dark" x="0" y="0" width="400" height="200"/>'
    + '</svg>'
    + '<div class="ls-caps">'
    + CAPTIONS[mode].map((_, i) => '<div class="ls-cap-slot" data-i="' + i + '">'
      + _caption(mode, i, d, rec || {}, verb) + '</div>').join('')
    + '</div>'
    + nameFaces
    + '<div class="ls-ticks">' + CAPTIONS[mode].map((_, i) =>
      '<i class="ls-tick" data-i="' + i + '"></i>').join('') + '</div>'
    + '<button type="button" class="ls-fold" onclick="' + FOLD + '">'
    + (min ? '&#9656; show' : '&#9662; hide') + '</button>'
    + '</div>';
}

export const LIST_CSS = `
.ls-stage{position:sticky;top:54px;z-index:20;width:100%;aspect-ratio:2/1;max-height:290px;
  border:1px solid rgba(224,160,73,.18);border-radius:10px;overflow:clip;
  background:#0d0b09;margin:0 0 22px;box-shadow:0 18px 44px rgba(0,0,0,.66);
  transition:max-height .45s cubic-bezier(.4,0,.2,1)}
.ls-stage.ls-min{max-height:74px}
.ls-stage.ls-min .ls-svg,.ls-stage.ls-min .ls-face{opacity:0}
.ls-fold{position:absolute;right:14px;bottom:10px;z-index:9;cursor:pointer;
  border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.5);color:#e8e2d8;
  border-radius:999px;padding:3px 10px;font:600 10px/1 system-ui;letter-spacing:.1em;
  text-transform:uppercase;opacity:.72}
.ls-fold:hover{opacity:1}
.ls-face{position:absolute;width:5.4%;aspect-ratio:1;transform:translate(-50%,-50%);
  border-radius:50%;overflow:hidden;opacity:0;pointer-events:none;
  box-shadow:0 0 0 1.5px rgba(224,160,73,.5),0 3px 10px rgba(0,0,0,.7);
  transition:opacity .5s ease,filter .5s ease}
.ls-face .cv-av{width:100%!important;height:100%!important;display:block;border-radius:50%}
.ls-face .cv-av img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.ls-svg{position:absolute;inset:0;width:100%;height:100%}
.ls-table{fill:#241a12}
.ls-paper{fill:#e9dfc6;stroke:#b8a986;stroke-width:1}
.ls-fold{}
.ls-sheet .ls-fold{stroke:#cbbc9c;stroke-width:1;fill:none}
.ls-rule{stroke:#c9b998;stroke-width:.8;fill:none;opacity:.7}
.ls-name{fill:#2a2118;font:italic 600 15px/1 Georgia,serif;opacity:0;
  transition:opacity .5s ease}
.ls-strike,.ls-kill{fill:none;stroke-linecap:round;opacity:0;
  stroke-dasharray:200;stroke-dashoffset:200}
.ls-strike{stroke:#2a2118;stroke-width:1.8}
.ls-kill{stroke:#b32633;stroke-width:2.6}
.ls-figure{fill:#050403}
.ls-left,.ls-right{opacity:0;transition:opacity .7s ease}
.ls-hand{opacity:0;transition:opacity .5s ease,transform .8s ease}
.ls-flame{transform-origin:0 -34px}
.ls-dark{fill:#050403;opacity:.36;transition:opacity 1s ease}

/* ── the paper is lit from the first step; the flame always moves ──── */
.ls-flame{animation:ls-flicker 2.4s ease-in-out infinite}

/* ── mode: the night they write it ─────────────────────────────────── */
.ls-stage[data-mode="named"][data-ls="1"] .ls-left,
.ls-stage[data-mode="named"][data-ls="1"] .ls-right,
.ls-stage[data-mode="named"][data-ls="2"] .ls-left,
.ls-stage[data-mode="named"][data-ls="2"] .ls-right{opacity:1}
.ls-stage[data-mode="named"][data-ls="2"] .ls-hand,
.ls-stage[data-mode="named"][data-ls="3"] .ls-hand{opacity:1}
.ls-stage[data-mode="named"][data-ls="2"] .ls-hand{
  animation:ls-write 2.6s ease-in-out}
.ls-stage[data-mode="named"][data-ls="2"] .ls-name,
.ls-stage[data-mode="named"][data-ls="3"] .ls-name{opacity:1}
.ls-stage[data-mode="named"][data-ls="2"] .ls-name{
  animation:ls-ink .5s ease-out backwards;animation-delay:calc(var(--i) * .55s)}
.ls-stage[data-mode="named"][data-ls="3"] .ls-dark{opacity:.2}
.ls-stage[data-mode="named"][data-ls="3"] .ls-hand{transform:translate(348px,182px) rotate(34deg)}
.ls-stage[data-mode="named"]:not([data-ls="0"]) .ls-face-row{opacity:1}
.ls-stage[data-mode="named"][data-ls="0"] .ls-name{opacity:0}

/* ── mode: the night they come back ────────────────────────────────── */
.ls-stage[data-mode="taken"] .ls-name{opacity:1}
.ls-stage[data-mode="taken"] .ls-face-row{opacity:1}
.ls-stage[data-mode="taken"][data-ls="1"] .ls-gone .ls-strike,
.ls-stage[data-mode="taken"][data-ls="2"] .ls-gone .ls-strike,
.ls-stage[data-mode="taken"][data-ls="3"] .ls-gone .ls-strike{opacity:1;
  animation:ls-draw .6s ease-out forwards}
.ls-stage[data-mode="taken"][data-ls="1"] .ls-gone .ls-name,
.ls-stage[data-mode="taken"][data-ls="2"] .ls-gone .ls-name,
.ls-stage[data-mode="taken"][data-ls="3"] .ls-gone .ls-name{opacity:.45}
.ls-stage[data-mode="taken"][data-ls="1"] .ls-fgone,
.ls-stage[data-mode="taken"][data-ls="2"] .ls-fgone,
.ls-stage[data-mode="taken"][data-ls="3"] .ls-fgone{opacity:.25;filter:grayscale(1)}
.ls-stage[data-mode="taken"][data-ls="2"] .ls-left,
.ls-stage[data-mode="taken"][data-ls="2"] .ls-right,
.ls-stage[data-mode="taken"][data-ls="3"] .ls-left,
.ls-stage[data-mode="taken"][data-ls="3"] .ls-right{opacity:1}
.ls-stage[data-mode="taken"][data-ls="3"]:not([data-blocked]) .ls-took .ls-kill{
  opacity:1;animation:ls-draw .7s ease-out .2s forwards}
.ls-stage[data-mode="taken"][data-ls="3"] .ls-ftook{
  box-shadow:0 0 0 1.5px rgba(179,38,51,.9),0 3px 10px rgba(0,0,0,.7)}
.ls-stage[data-mode="taken"][data-ls="3"] .ls-dark{opacity:.5}

@keyframes ls-ink{from{opacity:0}to{opacity:1}}
@keyframes ls-draw{to{stroke-dashoffset:0}}
@keyframes ls-write{0%{transform:translate(200px,120px) rotate(-6deg)}
  50%{transform:translate(260px,146px) rotate(-2deg)}
  100%{transform:translate(330px,150px) rotate(0)}}
@keyframes ls-flicker{0%,100%{transform:scaleY(1) scaleX(1);opacity:.95}
  50%{transform:scaleY(1.12) scaleX(.94);opacity:1}}

/* ── captions + ticks ───────────────────────────────────────────────── */
.ls-caps{position:absolute;left:0;right:0;bottom:0;padding:14px 16px 16px;
  background:linear-gradient(to top,rgba(5,4,3,.92),rgba(5,4,3,0))}
.ls-cap-slot{display:none}
.ls-cap b{display:block;font:700 11px/1.5 var(--tr-ui,system-ui);letter-spacing:.18em;
  text-transform:uppercase;color:#e0a049}
.ls-cap span{display:block;font:400 14px/1.5 var(--tr-body,Georgia,serif);color:#d8cfc2}
.ls-ticks{position:absolute;top:12px;right:14px;display:flex;gap:6px}
.ls-tick{width:16px;height:2px;border-radius:1px;background:rgba(224,160,73,.22)}
.ls-stage[data-ls="0"] .ls-cap-slot[data-i="0"],
.ls-stage[data-ls="1"] .ls-cap-slot[data-i="1"],
.ls-stage[data-ls="2"] .ls-cap-slot[data-i="2"],
.ls-stage[data-ls="3"] .ls-cap-slot[data-i="3"]{display:block}
.ls-stage[data-ls="0"] .ls-tick[data-i="0"],
.ls-stage[data-ls="1"] .ls-tick[data-i="1"],
.ls-stage[data-ls="2"] .ls-tick[data-i="2"],
.ls-stage[data-ls="3"] .ls-tick[data-i="3"]{background:#e0a049}

@media (prefers-reduced-motion:reduce){
  .ls-stage *{animation:none!important;transition:none!important}
  .ls-stage[data-mode="taken"] .ls-gone .ls-strike{stroke-dashoffset:0}
  .ls-stage[data-mode="taken"][data-ls="3"] .ls-took .ls-kill{stroke-dashoffset:0}
}
`;
