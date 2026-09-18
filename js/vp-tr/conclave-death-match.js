// ══════════════════════════════════════════════════════════════════════
// js/vp-tr/conclave-death-match.js — the card table, on a death match night
// ══════════════════════════════════════════════════════════════════════
//
// The pact still meets and still argues, so unlike the chalice this night HAS
// a conclave — but the conclave does not choose the body. It buys a chair. The
// screen therefore draws the argument in the beats, the way every other night
// does, and hangs the GAME above them: four chairs, eight cards, and the two
// who end up looking at each other.
//
// Seven steps, and the middle three are the only animation in this show that
// is allowed to be suspenseful about a result the viewer has not been told
// yet. The card that flips is always the card that flipped in the engine
// (js/tr/murder-variants.js `playDeathMatch`); nothing here decides anything.
//
//   0  the summons     four seats, a table, nobody has touched a card
//   1  the deal        eight cards, two each, face down
//   2  first round     one card turns gold; that chair is safe and empties
//   3  second round    again, and now there are two
//   4  the circle      all eight go back face down in a ring
//   5  the last card   one of the two turns it over, with N still to go
//   6  face to face    the other chair, and what walks up behind it
//
// Everything is keyed off `data-dm` on the root, written by the conclave
// screen's `_reapplyVisibility` from the BEAT, so the table keeps step with
// the argument however long the pact makes it.
//
// THE CSS-OVER-SVG TRAP IS WHY EVERY MOVING PIECE IS NESTED. A CSS `transform`
// silently overrides an SVG `transform` attribute, so a card that carries its
// dealt position as an attribute cannot also be animated — it snaps to the
// origin. Each card is an outer `<g>` holding its seat position and an inner
// `<g>` holding the motion, with the ring offset passed in as a custom
// property. Same bug, same fix, third screen.

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const FOLD = "(function(b){var s=b.closest('.dm-stage');var m=s.classList.toggle('dm-min');"
  + "b.innerHTML=m?'&#9656; show':'&#9662; hide';"
  + "try{localStorage.setItem('tr_stage_min',m?'1':'0')}catch(e){}})(this)";

function stageFolded() {
  try { return localStorage.getItem('tr_stage_min') === '1'; } catch { return false; }
}

/** How many stage steps there are. The builder maps each beat onto one. */
export const DEATH_MATCH_STEPS = 7;

// Where the four sit, in viewBox units (400x200). The two at the back are
// smaller and higher: it is a round table seen from slightly above, which is
// the only way to draw four people and eight cards without a pile-up.
const SEATS = [
  { x: 58, y: 136, s: 0.78 },
  { x: 152, y: 102, s: 0.6 },
  { x: 248, y: 102, s: 0.6 },
  { x: 342, y: 136, s: 0.78 },
];

// Two cards per seat, dealt onto the cloth in front of them.
const CARDS = [
  { x: 96, y: 128 }, { x: 116, y: 136 },
  { x: 160, y: 106 }, { x: 180, y: 102 },
  { x: 220, y: 102 }, { x: 240, y: 106 },
  { x: 284, y: 136 }, { x: 304, y: 128 },
];

/** The ring the last eight go into, centred on the table. */
function _ring(i) {
  const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
  return { x: 200 + Math.cos(a) * 62, y: 124 + Math.sin(a) * 24 };
}

const FIGURE = '<g class="dm-figure">'
  + '<ellipse cx="0" cy="-62" rx="10" ry="11"/>'
  + '<path d="M-15 -50 Q0 -56 15 -50 L18 0 L-18 0 Z"/>'
  + '</g>';

// What comes for the loser, and it is the only thing on this stage that is not
// furniture: the murder is face to face, so the cloaks are IN the room.
const CLOAK = '<g class="dm-cloak">'
  + '<path d="M0 -74 Q16 -70 18 -46 L22 0 L-22 0 L-18 -46 Q-16 -70 0 -74 Z"/>'
  + '<path class="dm-hood" d="M-11 -58 Q0 -78 11 -58 Q0 -50 -11 -58 Z"/>'
  + '</g>';

const CAPTIONS = [
  ['I. The Summons', 'Four names are read out. None of them were told why.'],
  ['II. The Deal', 'Eight cards between them. One of the eight lets you leave.'],
  ['III. First Round', ''],
  ['IV. Second Round', ''],
  ['V. The Circle', 'All eight go back face down, and they draw in turn.'],
  ['VI. The Last Card', ''],
  ['VII. Face To Face', ''],
];

function _caption(i, d, rec) {
  const [h, p] = CAPTIONS[i];
  const rounds = d.rounds || [];
  const winner = d.winner || 'the other one';
  const loser = d.loser || rec.target || 'somebody';
  const toGo = rounds[2] && rounds[2].toGo;
  let tail = p;
  if (i === 2) {
    tail = rounds[0] ? rounds[0].won + ' turns over the life card and walks out of the game.'
      : 'One of the four turns over the life card and walks out of the game.';
  } else if (i === 3) {
    tail = rounds[1] ? rounds[1].won + ' finds the second one. Two chairs left, and eight cards.'
      : 'Another one goes. Two chairs left, and eight cards.';
  } else if (i === 5) {
    tail = winner + ' turns it over'
      + (toGo ? ' with ' + toGo + ' card' + (toGo === 1 ? '' : 's') + ' still to go' : '')
      + '. ' + loser + ' does not.';
  } else if (i === 6) {
    // THE ONLY BRANCH THAT MATTERS, and it is the fact the pool downstairs is
    // split on too: whether the cards agreed with the pact.
    tail = rec.blocked
      ? loser + ' lost the game, and the night could not collect.'
      : d.kind === 'fellow'
        ? 'The chair belongs to one of their own. They have to do it anyway, and in front of everybody.'
        : d.kind === 'aimed'
          ? 'It is the name they argued about upstairs. The cards simply agreed.'
          : 'It is not the name they argued about upstairs. It is the one the cards gave them.';
  }
  return '<div class="dm-cap"><b>' + h + '</b><span>' + _esc(tail) + '</span></div>';
}

/**
 * The stage. `rec` is the conclave record; `rec.vdata` carries the game.
 * Safe on a record with no `vdata` — it then draws an unplayed table.
 */
export function deathMatchStage(rec, step = 0, faces = {}) {
  const d = (rec && rec.vdata) || {};
  const seated = d.players || [];
  const rounds = d.rounds || [];
  const min = stageFolded();
  // WHICH CHAIR EMPTIES WHEN. Carried as a class per seat rather than as a
  // number, because CSS cannot compare one attribute against another and a
  // rule set written per (step, seat) pair is the thing that actually has to
  // be read six months from now.
  const outAt = {};
  if (rounds[0]) outAt[rounds[0].won] = 'dm-out-2';
  if (rounds[1]) outAt[rounds[1].won] = 'dm-out-3';
  const winner = d.winner || (rounds[2] && rounds[2].won) || null;
  const loser = d.loser || null;

  let seats = '';
  seated.slice(0, 4).forEach((name, i) => {
    const s = SEATS[i];
    const cls = [outAt[name] || '', name === winner ? 'dm-win' : '',
      name === loser ? 'dm-lose' : ''].filter(Boolean).join(' ');
    seats += '<g class="dm-seat ' + cls + '" data-i="' + i + '" transform="translate('
      + s.x + ',' + s.y + ') scale(' + s.s + ')">'
      + '<g class="dm-sway">' + FIGURE + '</g>'
      + '<rect class="dm-safe-tag" x="-20" y="-96" width="40" height="13" rx="6"/>'
      + '<text class="dm-safe-txt" x="0" y="-86.5" text-anchor="middle">SAFE</text>'
      + '</g>';
  });

  // The cards. Outer g holds the dealt position; the inner one does the moving
  // (see the header), with the ring offset handed over as a custom property.
  let cards = '';
  CARDS.forEach((c, i) => {
    const r = _ring(i);
    const owner = seated[Math.floor(i / 2)];
    // ONE CARD PER WINNER, AND IT IS THEIR FIRST. The engine does not say which
    // of a player's two cards it was — it says who found it — so the screen
    // picks a card to be the one rather than inventing a fact.
    const first = i % 2 === 0;
    const cls = first && owner === (rounds[0] || {}).won ? 'dm-f1'
      : first && owner === (rounds[1] || {}).won ? 'dm-f2' : '';
    cards += '<g class="dm-card ' + cls + '" data-i="' + i + '" transform="translate('
      + c.x + ',' + c.y + ')">'
      + '<g class="dm-slide" style="--dx:' + (r.x - c.x).toFixed(1) + 'px;--dy:'
      + (r.y - c.y).toFixed(1) + 'px;--i:' + i + '">'
      + '<g class="dm-flip">'
      + '<rect class="dm-back" x="-9" y="-13" width="18" height="26" rx="2.5"/>'
      + '<path class="dm-pip" d="M0 -7 L4 0 L0 7 L-4 0 Z"/>'
      + '<g class="dm-life">'
      + '<rect x="-9" y="-13" width="18" height="26" rx="2.5"/>'
      + '<path class="dm-life-mark" d="M0 -6 L3 -1 L0 7 L-3 -1 Z"/>'
      + '</g></g></g></g>';
  });

  // The final card, drawn in the middle of the ring: the one the last two are
  // actually reaching for. It only exists from step 5.
  const finalCard = '<g class="dm-final" transform="translate(200,124)">'
    + '<g class="dm-flip">'
    + '<rect class="dm-back" x="-11" y="-16" width="22" height="32" rx="3"/>'
    + '<g class="dm-life"><rect x="-11" y="-16" width="22" height="32" rx="3"/>'
    + '<path class="dm-life-mark" d="M0 -8 L4 -1 L0 9 L-4 -1 Z"/></g>'
    + '</g></g>';

  const face = (html, cls, x, y) => (html
    ? '<div class="dm-face ' + cls + '" style="left:' + x + '%;top:' + y + '%">'
      + html + '</div>' : '');
  const seatFaces = seated.slice(0, 4).map((name, i) => {
    const s = SEATS[i];
    const cls = ['dm-face-seat', 'dm-face-' + i, outAt[name] ? 'dm-fout' : '',
      name === loser ? 'dm-flose' : ''].filter(Boolean).join(' ');
    return face(faces[name], cls, (s.x / 400) * 100, ((s.y - 62 * s.s) / 200) * 100);
  }).join('');

  return '<div class="dm-stage' + (min ? ' dm-min' : '') + '" data-dm="' + step + '"'
    + (rec && rec.blocked ? ' data-blocked="1"' : '')
    + ' data-kind="' + _esc(d.kind || 'missed') + '">'
    + '<svg class="dm-svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice"'
    + ' aria-hidden="true">'
    + '<defs>'
    + '<radialGradient id="dm-lamp" cx="50%" cy="34%">'
    + '<stop offset="0%" stop-color="#e0a049" stop-opacity=".5"/>'
    + '<stop offset="100%" stop-color="#e0a049" stop-opacity="0"/>'
    + '</radialGradient>'
    + '<linearGradient id="dm-cloth" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#3a1418"/><stop offset="100%" stop-color="#1b0b0d"/>'
    + '</linearGradient>'
    + '</defs>'
    + '<rect x="0" y="0" width="400" height="200" fill="#100c0a"/>'
    + '<ellipse class="dm-pool" cx="200" cy="118" rx="200" ry="110" fill="url(#dm-lamp)"/>'
    // the table, and the four of them around it
    + '<ellipse class="dm-shadow" cx="200" cy="154" rx="132" ry="18"/>'
    + '<ellipse class="dm-table" cx="200" cy="124" rx="124" ry="42" fill="url(#dm-cloth)"/>'
    + '<ellipse class="dm-rim" cx="200" cy="124" rx="124" ry="42"/>'
    + seats
    + cards
    + finalCard
    + '<g class="dm-cloak-l" transform="translate(300,178) scale(.8)">' + CLOAK + '</g>'
    + '<g class="dm-cloak-r" transform="translate(356,178) scale(.8)">' + CLOAK + '</g>'
    + '<rect class="dm-dark" x="0" y="0" width="400" height="200"/>'
    + '</svg>'
    + '<div class="dm-caps">'
    + CAPTIONS.map((_, i) => '<div class="dm-cap-slot" data-i="' + i + '">'
      + _caption(i, d, rec || {}) + '</div>').join('')
    + '</div>'
    + seatFaces
    + '<div class="dm-ticks">' + CAPTIONS.map((_, i) =>
      '<i class="dm-tick" data-i="' + i + '"></i>').join('') + '</div>'
    + '<button type="button" class="dm-fold" onclick="' + FOLD + '">'
    + (min ? '&#9656; show' : '&#9662; hide') + '</button>'
    + '</div>';
}

export const DEATH_MATCH_CSS = `
.dm-stage{position:sticky;top:54px;z-index:20;width:100%;aspect-ratio:2/1;max-height:290px;
  border:1px solid rgba(224,160,73,.18);border-radius:10px;overflow:clip;
  background:#0d0b09;margin:0 0 22px;box-shadow:0 18px 44px rgba(0,0,0,.66);
  transition:max-height .45s cubic-bezier(.4,0,.2,1)}
.dm-stage.dm-min{max-height:74px}
.dm-stage.dm-min .dm-svg,.dm-stage.dm-min .dm-face{opacity:0}
.dm-fold{position:absolute;right:14px;bottom:10px;z-index:9;cursor:pointer;
  border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.5);color:#e8e2d8;
  border-radius:999px;padding:3px 10px;font:600 10px/1 system-ui;letter-spacing:.1em;
  text-transform:uppercase;opacity:.72}
.dm-fold:hover{opacity:1}
.dm-face{position:absolute;width:6.4%;aspect-ratio:1;transform:translate(-50%,-50%);
  border-radius:50%;overflow:hidden;opacity:0;pointer-events:none;
  box-shadow:0 0 0 1.5px rgba(224,160,73,.5),0 4px 14px rgba(0,0,0,.7);
  transition:opacity .5s ease,filter .6s ease,box-shadow .5s ease}
.dm-face-1,.dm-face-2{width:5%}
.dm-face .cv-av{width:100%!important;height:100%!important;display:block;border-radius:50%}
.dm-face .cv-av img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.dm-svg{position:absolute;inset:0;width:100%;height:100%}
.dm-shadow{fill:#000;opacity:.5}
.dm-rim{fill:none;stroke:#8a6a44;stroke-width:1.4;opacity:.5}
.dm-pool{opacity:.7}
.dm-dark{fill:#050403;opacity:.4;transition:opacity 1s ease}
.dm-figure{fill:#050403}
.dm-seat{transition:opacity .7s ease}
.dm-sway{transform-origin:0 -30px}
.dm-safe-tag{fill:#2e4a2c;stroke:#6f9a5a;stroke-width:1;opacity:0;transition:opacity .5s ease}
.dm-safe-txt{fill:#a8cf99;font:700 8px/1 system-ui;letter-spacing:.12em;opacity:0;
  transition:opacity .5s ease}
.dm-card{opacity:0;transition:opacity .5s ease}
.dm-slide{transition:transform .8s cubic-bezier(.4,0,.2,1)}
.dm-flip{transform-origin:0 0;transition:transform .5s ease}
.dm-back{fill:#1c2c3c;stroke:#6f8aa8;stroke-width:.8}
.dm-pip{fill:#3d5a76}
.dm-life{opacity:0;transition:opacity .25s ease .25s}
.dm-life rect{fill:#e0a049;stroke:#f3d9a8;stroke-width:.9}
.dm-life-mark{fill:#5a3a12}
.dm-final{opacity:0;transition:opacity .5s ease}
.dm-cloak{fill:#08060a;stroke:#3a2630;stroke-width:1}
.dm-hood{fill:#000}
.dm-cloak-l,.dm-cloak-r{opacity:0;transition:opacity .8s ease,transform .8s ease}

/* ── step 1: the deal ───────────────────────────────────────────────── */
.dm-stage[data-dm="1"] .dm-dark,.dm-stage[data-dm="2"] .dm-dark,
.dm-stage[data-dm="3"] .dm-dark,.dm-stage[data-dm="4"] .dm-dark,
.dm-stage[data-dm="5"] .dm-dark{opacity:.3}
.dm-stage[data-dm="1"] .dm-card,.dm-stage[data-dm="2"] .dm-card,
.dm-stage[data-dm="3"] .dm-card,.dm-stage[data-dm="4"] .dm-card,
.dm-stage[data-dm="5"] .dm-card{opacity:1}
.dm-stage[data-dm="1"] .dm-card{animation:dm-deal .5s ease-out backwards;
  animation-delay:calc(var(--i,0) * .07s)}
.dm-stage[data-dm="1"] .dm-sway{animation:dm-sway 3.4s ease-in-out infinite}

/* ── steps 2-3: the two rounds ──────────────────────────────────────── */
.dm-stage[data-dm="2"] .dm-f1 .dm-life,
.dm-stage[data-dm="3"] .dm-f1 .dm-life,.dm-stage[data-dm="3"] .dm-f2 .dm-life{opacity:1}
.dm-stage[data-dm="2"] .dm-f1 .dm-flip,
.dm-stage[data-dm="3"] .dm-f1 .dm-flip,.dm-stage[data-dm="3"] .dm-f2 .dm-flip{
  animation:dm-flip .5s ease-out}
.dm-stage[data-dm="2"] .dm-out-2,
.dm-stage[data-dm="3"] .dm-out-2,.dm-stage[data-dm="3"] .dm-out-3,
.dm-stage[data-dm="4"] .dm-out-2,.dm-stage[data-dm="4"] .dm-out-3,
.dm-stage[data-dm="5"] .dm-out-2,.dm-stage[data-dm="5"] .dm-out-3,
.dm-stage[data-dm="6"] .dm-out-2,.dm-stage[data-dm="6"] .dm-out-3{opacity:.2}
.dm-stage[data-dm="2"] .dm-out-2 .dm-safe-tag,.dm-stage[data-dm="2"] .dm-out-2 .dm-safe-txt,
.dm-stage[data-dm="3"] .dm-out-3 .dm-safe-tag,.dm-stage[data-dm="3"] .dm-out-3 .dm-safe-txt{
  opacity:1}

/* ── step 4: all eight back in the circle ───────────────────────────── */
.dm-stage[data-dm="4"] .dm-slide,.dm-stage[data-dm="5"] .dm-slide{
  transform:translate(var(--dx),var(--dy))}
.dm-stage[data-dm="4"] .dm-life,.dm-stage[data-dm="5"] .dm-card .dm-life{opacity:0}
.dm-stage[data-dm="4"] .dm-sway{animation:dm-sway 2.2s ease-in-out infinite}

/* ── step 5: the last card ──────────────────────────────────────────── */
.dm-stage[data-dm="5"] .dm-final,.dm-stage[data-dm="6"] .dm-final{opacity:1}
.dm-stage[data-dm="5"] .dm-final .dm-life,.dm-stage[data-dm="6"] .dm-final .dm-life{opacity:1}
.dm-stage[data-dm="5"] .dm-final .dm-flip{animation:dm-flip .6s ease-out}
.dm-stage[data-dm="5"] .dm-win,.dm-stage[data-dm="6"] .dm-win{opacity:1}
.dm-stage[data-dm="5"] .dm-lose .dm-figure{fill:#2a0d10}

/* ── step 6: face to face ───────────────────────────────────────────── */
.dm-stage[data-dm="6"] .dm-dark{opacity:.58}
.dm-stage[data-dm="6"] .dm-card{opacity:.25}
.dm-stage[data-dm="6"] .dm-lose{opacity:.28}
.dm-stage[data-dm="6"] .dm-cloak-l{opacity:1;transform:translate(300px,178px) scale(.8)}
.dm-stage[data-dm="6"] .dm-cloak-r{opacity:1;transform:translate(356px,178px) scale(.8)}
.dm-stage[data-dm="6"]:not([data-blocked]) .dm-flose{opacity:.4;filter:grayscale(1)}
.dm-stage[data-dm="6"][data-blocked] .dm-cloak-l,
.dm-stage[data-dm="6"][data-blocked] .dm-cloak-r{opacity:.35}

/* the four faces come up with their chairs and go down with them */
.dm-stage:not([data-dm="0"]) .dm-face-seat{opacity:1}
.dm-stage[data-dm="2"] .dm-out-2.dm-fout,
.dm-stage[data-dm="3"] .dm-fout,.dm-stage[data-dm="4"] .dm-fout,
.dm-stage[data-dm="5"] .dm-fout,.dm-stage[data-dm="6"] .dm-fout{opacity:.22;filter:grayscale(1)}
.dm-stage[data-dm="5"] .dm-flose,.dm-stage[data-dm="6"] .dm-flose{
  box-shadow:0 0 0 1.5px rgba(179,38,51,.85),0 4px 14px rgba(0,0,0,.7)}

@keyframes dm-deal{from{opacity:0;transform:translate(0,-28px) rotate(-14deg)}
  to{opacity:1;transform:none}}
@keyframes dm-flip{0%{transform:scaleX(1)}50%{transform:scaleX(.06)}100%{transform:scaleX(1)}}
@keyframes dm-sway{0%,100%{transform:rotate(-1.1deg)}50%{transform:rotate(1.1deg)}}

/* ── captions + ticks ───────────────────────────────────────────────── */
.dm-caps{position:absolute;left:0;right:0;bottom:0;padding:14px 16px 16px;
  background:linear-gradient(to top,rgba(5,4,3,.92),rgba(5,4,3,0))}
.dm-cap-slot{display:none}
.dm-cap b{display:block;font:700 11px/1.5 var(--tr-ui,system-ui);letter-spacing:.18em;
  text-transform:uppercase;color:#e0a049}
.dm-cap span{display:block;font:400 14px/1.5 var(--tr-body,Georgia,serif);color:#d8cfc2}
.dm-ticks{position:absolute;top:12px;right:14px;display:flex;gap:6px}
.dm-tick{width:16px;height:2px;border-radius:1px;background:rgba(224,160,73,.22)}
.dm-stage[data-dm="0"] .dm-cap-slot[data-i="0"],
.dm-stage[data-dm="1"] .dm-cap-slot[data-i="1"],
.dm-stage[data-dm="2"] .dm-cap-slot[data-i="2"],
.dm-stage[data-dm="3"] .dm-cap-slot[data-i="3"],
.dm-stage[data-dm="4"] .dm-cap-slot[data-i="4"],
.dm-stage[data-dm="5"] .dm-cap-slot[data-i="5"],
.dm-stage[data-dm="6"] .dm-cap-slot[data-i="6"]{display:block}
.dm-stage[data-dm="0"] .dm-tick[data-i="0"],
.dm-stage[data-dm="1"] .dm-tick[data-i="1"],
.dm-stage[data-dm="2"] .dm-tick[data-i="2"],
.dm-stage[data-dm="3"] .dm-tick[data-i="3"],
.dm-stage[data-dm="4"] .dm-tick[data-i="4"],
.dm-stage[data-dm="5"] .dm-tick[data-i="5"],
.dm-stage[data-dm="6"] .dm-tick[data-i="6"]{background:#e0a049}

@media (prefers-reduced-motion:reduce){
  .dm-stage *{animation:none!important;transition:none!important}
}
`;
