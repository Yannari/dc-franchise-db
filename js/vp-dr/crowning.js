// ══════════════════════════════════════════════════════════════════════
// vp-dr/crowning.js — the crowning, staged
// ══════════════════════════════════════════════════════════════════════
//
// The last screen of a season was a stack of cards: a bracket, a list of
// placements, a portrait with the word WINNER over it. Everything it needed
// to say was on it and none of it felt like anything, because a ceremony is
// not a summary of a ceremony — it is a room, a line of people who have to
// stand in it, and a result that takes a long time to arrive.
//
// ── WHAT THIS DRAWS ───────────────────────────────────────────────────
//
// A STAGE, and it is sticky: the line of finalists stays at the top of the
// screen while the ceremony scrolls underneath, so the reader is looking at
// the room the whole time rather than at a card that has scrolled away.
//
// Each finalist stands on a lit PLINTH — her portrait under a lamp, her name
// in the display face, her season's record in the track record's own colours
// beneath it. The portraits are the point: this is the one night the whole
// cast is in one room and you want to see who is in it.
//
// As the ceremony reveals, the plinths go dark from the bottom up. The queen
// called fourth loses her light, greys out and takes her placement; then
// third; and the stage narrows to two, and then to one, and the last one
// gets the crown, the gold, and the confetti. THE STAGE IS THE PROGRESS BAR
// — you can see how far into the ceremony you are by how many lamps are
// still lit.
//
// ── HOW THE STAGE KNOWS ───────────────────────────────────────────────
//
// Through the reveal hook in js/vp-dr/reveal.js: every step carries the
// state of the room AFTER it, as a data attribute, and the hook reads the
// current step's attribute and repaints the plinths from it. Nothing is
// rebuilt — the same rule as every other screen here, because a rebuild
// loses the reader's place and any scroll they had. It repaints the whole
// line every time rather than patching the newest plinth, which is what
// makes it survive a tab switch.
//
// ── WHAT IT MAY NOT DO ────────────────────────────────────────────────
//
// SHOW THE RESULT BEFORE IT IS REVEALED. The version this replaces printed
// every duel, the whole finishing order, the crown and Miss Congeniality at
// 0 / 5 — on the one screen in the season whose entire job is withholding
// exactly those four things. tests/dr-vp-spoilers.test.js reads this screen
// the way a viewer opens it and fails if any of that is legible at rest.
// The line of plinths is drawn in ALPHABETICAL order for the same reason:
// placement order would print the result along the top of the screen in the
// arrangement of the plinths themselves.
import { _shell, _portrait, _icon } from './style.js';
import { _controls } from './reveal.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* The record letters, in the chart's own colours, so a résumé on this stage
   and the same résumé on the track record are recognisably one object. */
const REC = {
  WIN: '#38bdf8', HIGH: '#7dd3fc', SAFE: '#4b5563', LOW: '#fb923c',
  BTM: '#fca5a5', BTM2: '#f87171', ELIM: '#7f1d1d',
  WINNER: '#facc15', FINALIST: '#c4b5fd',
};

export const CROWN_CSS = `
.cr-wrap{--cr-gold:#FFC83D;--cr-warm:#FFE9A8;--cr-deep:#12030A;--cr-dark:#1D0710}

/* ══ THE HOUSE ══ a lit proscenium behind everything, fixed to the page ══ */
.cr-house{position:fixed;inset:46px 0 0;z-index:0;pointer-events:none;overflow:hidden}
.cr-house::before{content:"";position:absolute;inset:0;
  background:radial-gradient(120% 80% at 50% 0%,rgba(255,200,61,.13),transparent 62%),
    radial-gradient(90% 60% at 50% 110%,rgba(255,61,154,.10),transparent 70%)}
/* The back wall: a slow sweep, like a follow-spot crossing it. */
.cr-sweep{position:absolute;top:-20%;left:-30%;width:60%;height:140%;
  background:linear-gradient(100deg,transparent,rgba(255,233,168,.09),transparent);
  animation:crSweep 17s ease-in-out infinite}
@keyframes crSweep{0%{transform:translateX(0) rotate(6deg)}
  50%{transform:translateX(180%) rotate(6deg)}100%{transform:translateX(0) rotate(6deg)}}

/* ══ THE STAGE ══ sticky, because the room does not scroll away ══ */
/* THE HEADROOM IS FOR THE CROWN. It sits at top:-34px on the winner's
   plinth and the plinth's top is the stage's padding edge, so with the
   16px this had the crown was sliced off along its band — the one object
   the entire screen builds towards, clipped by its own container. */
.cr-stage{position:sticky;top:0;z-index:6;margin:0 0 20px;padding:16px 18px 18px;
  background:radial-gradient(130% 100% at 50% -20%,rgba(255,200,61,.17),transparent 60%),
    linear-gradient(180deg,var(--cr-dark),var(--cr-deep) 72%,rgba(8,2,5,.97));
  border-bottom:1px solid rgba(255,200,61,.3);
  box-shadow:0 20px 44px -24px rgba(0,0,0,.96)}
/* The lighting rig over the line. */
.cr-truss{position:relative;display:flex;justify-content:center;gap:14px;
  padding-bottom:12px;margin-bottom:26px}
.cr-truss::before{content:"";position:absolute;left:8%;right:8%;top:0;height:3px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)}
.cr-lamp{width:22px;height:6px;border-radius:0 0 3px 3px;background:rgba(255,200,61,.2);
  transition:background .4s,box-shadow .4s}
.cr-lamp.lit{background:var(--cr-warm);box-shadow:0 8px 30px rgba(255,200,61,.8)}

.cr-line{display:flex;justify-content:center;align-items:flex-end;gap:16px;flex-wrap:wrap}

/* ══ ONE FINALIST, ON A PLINTH ══ */
.cr-plate{position:relative;width:150px;padding:14px 12px 12px;text-align:center;
  border:1px solid rgba(255,255,255,.15);border-radius:2px;
  background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(0,0,0,.45));
  transition:opacity .5s,filter .5s,transform .5s cubic-bezier(.2,1.1,.4,1),
    border-color .5s,box-shadow .5s}
/* Her beam, drawn behind her and dimmed with her. */
.cr-plate::before{content:"";position:absolute;left:50%;bottom:100%;
  width:130px;height:190px;transform:translateX(-50%);pointer-events:none;
  background:linear-gradient(180deg,rgba(255,233,168,.32),transparent 78%);
  clip-path:polygon(40% 0,60% 0,100% 100%,0 100%);transition:opacity .5s}
.cr-plate .dr-por{margin:0 auto;border:2px solid rgba(255,233,168,.45);
  box-shadow:0 0 26px -4px rgba(255,200,61,.5);transition:filter .5s,border-color .5s}
.cr-name{margin-top:9px;font-size:18px;line-height:1.05;color:#fff6fb;text-wrap:balance}
.cr-rec{display:flex;justify-content:center;gap:3px;margin-top:8px;flex-wrap:wrap}
.cr-rec i{width:7px;height:7px;border-radius:1px;display:block}
.cr-place{position:absolute;top:7px;right:8px;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:#C9A6BC;opacity:0;transition:opacity .4s}

/* OUT: her light goes, she greys, the plinth settles back. */
.cr-plate.out{opacity:.42;transform:translateY(8px) scale(.9);
  border-color:rgba(255,255,255,.07)}
.cr-plate.out .dr-por{filter:grayscale(1) brightness(.55);
  border-color:rgba(255,255,255,.12);box-shadow:none}
.cr-plate.out::before{opacity:0}
.cr-plate.out .cr-place{opacity:1}

/* THE LAST TWO: the rest of the stage is dark, so these come up. */
.cr-plate.finaltwo{border-color:rgba(255,200,61,.55);transform:translateY(-3px)}
.cr-plate.finaltwo::before{background:linear-gradient(180deg,rgba(255,233,168,.52),transparent 78%)}

/* THE CROWN LANDS. */
.cr-plate.crowned{border-color:var(--cr-gold);transform:translateY(-12px) scale(1.1);
  background:linear-gradient(180deg,rgba(255,200,61,.28),rgba(0,0,0,.5));
  box-shadow:0 0 70px -6px rgba(255,200,61,.7)}
.cr-plate.crowned .cr-name{color:var(--cr-gold)}
.cr-plate.crowned .dr-por{border-color:var(--cr-gold);
  box-shadow:0 0 46px -2px rgba(255,200,61,.85)}
.cr-plate.crowned::before{background:linear-gradient(180deg,rgba(255,233,168,.8),transparent 84%)}
.cr-crown{position:absolute;left:50%;top:-34px;width:56px;
  transform:translate(-50%,-18px) rotate(-8deg);opacity:0;
  transition:opacity .5s,transform .7s cubic-bezier(.2,1.6,.35,1)}
.cr-plate.crowned .cr-crown{opacity:1;transform:translate(-50%,0) rotate(0deg)}

/* The gold flash across the whole stage when it happens. */
.cr-stage.flash{animation:crFlash 1.1s ease-out}
@keyframes crFlash{0%{box-shadow:0 0 0 rgba(255,200,61,0)}
  22%{box-shadow:0 0 140px 40px rgba(255,200,61,.5)}
  100%{box-shadow:0 20px 44px -24px rgba(0,0,0,.96)}}

/* Confetti, cheap and CSS-only: one strip per lamp, falling once. */
.cr-conf{position:absolute;inset:0;overflow:hidden;pointer-events:none;opacity:0}
.cr-stage.flash .cr-conf{opacity:1}
.cr-conf i{position:absolute;top:-14px;width:5px;height:12px;border-radius:1px;
  animation:crFall 2.6s linear forwards}
@keyframes crFall{to{transform:translateY(300px) rotate(540deg);opacity:0}}

/* ══ THE CEREMONY ══ two registers: he says it, or it happens ══ */
/* THE STAGE IS STICKY AND OPAQUE, so a beat scrolled to sits behind it
   unless it reserves the room the stage occupies. scrollIntoView respects
   scroll-margin-top; without it the reveal centres a card the stage is
   covering and the reader sees the bottom half of a sentence. */
.cr-beat{margin:0 0 16px;position:relative;z-index:1;scroll-margin-top:290px}
@media(max-width:760px){.cr-beat{scroll-margin-top:12px}}

/* THE RAIL DIMS WITH THE STAGE. These two classes are defined in
   screens.js, which only the generic section builder pulls in — this screen
   has its own builder, so it shipped the markup with no styling behind it
   and the rail showed every queen at full strength beside a heading that
   said two were left. A screen that names a class has to carry it. */
.dr-waiting{opacity:.42}
.dr-waiting .dr-por{filter:grayscale(1) brightness(.6)}
.dr-up{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--cr-gold)}
.cr-said{position:relative;padding:24px 26px;text-align:center;
  border-top:1px solid rgba(255,200,61,.32);border-bottom:1px solid rgba(255,200,61,.32);
  background:linear-gradient(180deg,rgba(255,200,61,.08),transparent)}
.cr-said q{display:block;font-family:Didot,'Bodoni MT',Georgia,serif;font-size:21px;
  line-height:1.5;color:#fff6fb;quotes:none;text-wrap:pretty;max-width:62ch;margin:0 auto}
.cr-said q::before,.cr-said q::after{content:none}
.cr-who{display:block;margin-bottom:10px;font-size:9px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--cr-gold)}
.cr-told{display:grid;grid-template-columns:auto 1fr;gap:15px;align-items:start;
  padding:16px 20px;border-left:3px solid rgba(255,255,255,.16);background:rgba(0,0,0,.3)}
.cr-told:not(:has(.dr-por)){grid-template-columns:1fr}
.cr-told p{margin:0;color:#f4e3ed;line-height:1.65;text-wrap:pretty;max-width:74ch}
.cr-told .dr-por{border:2px solid rgba(255,255,255,.2)}

/* CARD PHYSICS, one per register. A ceremony where every beat arrives the
   same way has no shape; these are what a ceremony's beats actually do. */
.dr-step.dr-vis .cr-said{animation:crSpeak .55s cubic-bezier(.2,.9,.3,1) both}
@keyframes crSpeak{from{opacity:0;transform:scaleX(.86)}to{opacity:1;transform:scaleX(1)}}
.dr-step.dr-vis .cr-told{animation:crTell .45s ease-out both}
@keyframes crTell{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
/* THE NAME. It does not arrive, it lands. */
.dr-step.dr-vis .cr-said.cr-name-beat{animation:crSlam .5s cubic-bezier(.2,1.7,.35,1) both}
@keyframes crSlam{from{opacity:0;transform:scale(1.14)}to{opacity:1;transform:scale(1)}}
.cr-name-beat q{font-size:26px;color:var(--cr-gold)}

/* THE HOLD. The beat where nothing happens gets room to happen in, and
   arrives slower than anything else on the screen. */
.cr-hold{padding:52px 26px;text-align:center;
  background:radial-gradient(80% 120% at 50% 50%,rgba(255,200,61,.1),transparent 70%)}
.cr-hold p{margin:0 auto;max-width:56ch;font-family:Didot,'Bodoni MT',Georgia,serif;
  font-size:19px;font-style:italic;line-height:1.65;color:#ffd0e8}
.dr-step.dr-vis .cr-hold{animation:crHold 1.5s ease-out both}
@keyframes crHold{from{opacity:0}60%{opacity:.35}to{opacity:1}}

/* THE SASH — the one award the panel had no say in. */
.cr-sash{display:flex;align-items:center;justify-content:center;gap:18px;
  padding:20px;border:1px solid rgba(255,200,61,.38);
  background:linear-gradient(100deg,rgba(255,200,61,.15),transparent 70%)}
.cr-sash .dr-por{border:2px solid var(--cr-gold);box-shadow:0 0 30px -6px rgba(255,200,61,.7)}
.cr-sash-k{font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:#C9A6BC}
.cr-sash b{display:block;font-size:27px;color:var(--cr-gold);line-height:1.1}

/* ══ THE RECORD OF THE NIGHT ══ the last two clicks ══ */
.cr-record{padding:16px 20px;border:1px solid rgba(255,200,61,.26);
  background:rgba(0,0,0,.34)}
.cr-record h4{margin:0 0 12px;font-size:12px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--cr-gold)}
.cr-duel,.cr-place-row{display:flex;align-items:center;gap:10px;padding:7px 0;
  border-bottom:1px solid rgba(255,255,255,.08);flex-wrap:wrap}
.cr-duel b,.cr-place-row b{font-size:14px;color:#f0dfe9}
.cr-vs{color:#FF294B;font-size:15px}
.cr-song{color:#C9A6BC;font-size:12px;font-style:italic;margin-left:auto}
.cr-took{color:var(--cr-gold);font-size:12px;letter-spacing:.1em;
  text-transform:uppercase;margin-left:auto}
.cr-n{min-width:22px;font-variant-numeric:tabular-nums;color:#C9A6BC;font-size:15px}
.cr-record .dr-por{border:1px solid rgba(255,255,255,.2)}

@media(max-width:760px){
  .cr-stage{position:static}
  .cr-plate{width:112px;padding:11px 8px 9px}
  .cr-name{font-size:15px}
  .cr-said q{font-size:18px}
}
@media(prefers-reduced-motion:reduce){
  .cr-plate,.cr-plate::before,.cr-crown,.cr-sweep,.cr-conf i,
  .dr-step.dr-vis .cr-said,.dr-step.dr-vis .cr-told,.dr-step.dr-vis .cr-hold,
  .cr-stage.flash{animation:none;transition:none}
}
`;

/** The crown, drawn rather than typed — no emoji anywhere on this screen. */
const CROWN_SVG = `<svg class="cr-crown" viewBox="0 0 64 42" aria-hidden="true">
  <defs><linearGradient id="crg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFF3CF"/><stop offset="1" stop-color="#D8990F"/>
  </linearGradient></defs>
  <path d="M4 34 L2 7 L18 20 L32 2 L46 20 L62 7 L60 34 Z"
    fill="url(#crg)" stroke="#7A4E00" stroke-width="1.2" stroke-linejoin="round"/>
  <rect x="3" y="33" width="58" height="7" rx="1.5"
    fill="url(#crg)" stroke="#7A4E00" stroke-width="1.2"/>
  <circle cx="32" cy="12" r="3.4" fill="#FF3D9A" stroke="#7A4E00" stroke-width="1"/>
  <circle cx="12" cy="18" r="2.3" fill="#38bdf8" stroke="#7A4E00" stroke-width="1"/>
  <circle cx="52" cy="18" r="2.3" fill="#38bdf8" stroke="#7A4E00" stroke-width="1"/>
</svg>`;

const CONFETTI_COLOURS = ['#FFC83D', '#FF3D9A', '#38bdf8', '#3BE08A', '#fff6fb'];
const confetti = () => `<div class="cr-conf">${
  Array.from({ length: 34 }, (_, i) => {
    const left = Math.round((i * 37) % 100);
    const delay = ((i * 13) % 90) / 100;
    const c = CONFETTI_COLOURS[i % CONFETTI_COLOURS.length];
    return `<i style="left:${left}%;background:${c};animation-delay:${delay}s"></i>`;
  }).join('')}</div>`;

/** One finalist on her plinth: her face under a lamp, her name, her season. */
function plinth(name, record, ep) {
  const chips = (record || []).map(r =>
    `<i style="background:${REC[r] || '#4b5563'}" title="${esc(r)}"></i>`).join('');
  return `<div class="cr-plate" id="cr-plate-${esc(name)}" data-queen="${esc(name)}">
    ${CROWN_SVG}
    <span class="cr-place"></span>
    ${_portrait(name, ep, { size: 92, station: true })}
    <div class="cr-name dr-disp">${esc(name)}</div>
    <div class="cr-rec">${chips}</div>
  </div>`;
}

/* WHICH BEATS ARE SPOKEN. The host's lines are set as speech — centred,
   serif, ruled above and below — and the narrator's are set as prose beside
   a portrait. A ceremony where both look the same is a ceremony in which
   nobody is talking. */
const SPOKEN = new Set(['crown-summon', 'crown-congeniality', 'crown-address',
  'crown-place', 'crown-envelope', 'crown-name', 'crown-prance',
  'finale-congeniality', 'finale-runnerup', 'finale-crowning', 'finale-prance']);

/** The ids that end the season on the winner being named. */
const NAME_BEATS = new Set(['crown-name', 'finale-crowning']);

/**
 * The crowning.
 *
 * Every step carries `data-stage`: the state of the room after that beat, as
 * "out:Name,Name|two:Name,Name|crown:Name". The reveal hook reads the
 * current step's and repaints the line from it — so the stage is always
 * exactly as far along as the reader is, including after a tab switch, when
 * the DOM is fresh and every class the earlier clicks added is gone.
 */
export function rpBuildCrowning(row) {
  const ep = { num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} };
  const fin = row?.dr?.finale;
  if (!fin) return '';

  const placements = fin.placements || [];
  const record = row?.dr?.record || {};

  // Alphabetical, deliberately — see the note at the top of the file.
  const line = [...placements].sort((a, b) => a.localeCompare(b));

  const stage = `<div class="cr-stage" id="cr-stage">
    ${confetti()}
    <div class="cr-truss">${line.map(() => '<i class="cr-lamp lit"></i>').join('')}</div>
    <div class="cr-line">${line.map(n => plinth(n, record[n], ep)).join('')}</div>
  </div>`;

  /* The scenes, in the order the engine wrote them. `crowning:` is the
     ceremony pool; the `finale:` ids are the five-line version it replaces,
     still drawn while a tier of the new pool is unwritten. */
  const scenes = (row.dr.scenes || []).filter(s =>
    (s.step === 'crowning'
      || /^finale:(finale-congeniality|finale-runnerup|finale-crowning|finale-speech|finale-prance)$/
        .test(s.kind || ''))
    && s.text);
  if (!scenes.length) return '';

  // The room's state accumulates as the beats go by.
  const out = [];
  let crowned = null;
  const steps = scenes.map((sc, i) => {
    const beat = sc.data?.beat || String(sc.kind || '').split(':')[1] || '';
    const who = (sc.data?.players || [])[0];

    if (beat === 'crown-place' && who) out.push(who);
    if (NAME_BEATS.has(beat) && who) crowned = who;

    const standing = line.filter(n => !out.includes(n));
    const attr = `out:${out.join(',')}|two:${
      standing.length === 2 && !crowned ? standing.join(',') : ''}|crown:${crowned || ''}`;

    let body;
    if (beat === 'crown-final-two') {
      body = `<div class="cr-hold"><p>${esc(sc.text)}</p></div>`;
    } else if (beat === 'crown-congeniality' || beat === 'finale-congeniality') {
      body = `<div class="cr-sash">
        ${who ? _portrait(who, ep, { size: 72, station: true }) : ''}
        <div><span class="cr-sash-k">The cast chose her</span>
          <b class="dr-disp">${esc(who || '')}</b></div>
      </div>
      <div class="cr-said" style="border-top:0"><q>${esc(sc.text)}</q></div>`;
    } else if (SPOKEN.has(beat)) {
      body = `<div class="cr-said${NAME_BEATS.has(beat) ? ' cr-name-beat' : ''}">
        <span class="cr-who">The host</span><q>${esc(sc.text)}</q></div>`;
    } else {
      body = `<div class="cr-told">
        ${who ? _portrait(who, ep, { size: 56, station: true }) : ''}
        <p>${esc(sc.text)}</p></div>`;
    }

    return `<div class="dr-step cr-beat" id="dr-step-fincrown-${i}"
      data-stage="${esc(attr)}" data-crownbeat="${NAME_BEATS.has(beat) ? '1' : ''}">
      ${body}</div>`;
  }).join('');

  /* ── THE RECORD OF THE NIGHT, at the end where it belongs ──
     The screen this replaces drew the crown lip sync bracket and the
     finishing order at the TOP, ungated, which is how it gave away the
     season. Cutting them entirely is the other half of that mistake and one
     this file has already made once: the finishing order stopped reaching
     the transcript, which is a written record of a season that no longer
     said who came where. tests/dr-vp-summary.test.js caught it.
     So they stay, as the last two clicks — after the ceremony has actually
     announced everything on them. */
  const afterCrown = `out:${line.filter(n => n !== crowned).join(',')}|two:|crown:${crowned || ''}`;
  const duels = (fin.rounds || []).map(r => `<div class="cr-duel">
      ${_portrait(r.a, ep, { size: 34 })}<b class="dr-disp">${esc(r.a)}</b>
      <span class="cr-vs">vs</span>
      <b class="dr-disp">${esc(r.b)}</b>${_portrait(r.b, ep, { size: 34 })}
      <span class="cr-song">${esc(r.song || '')}</span>
      <span class="cr-took dr-disp">${esc(r.winner || '')} takes it</span>
    </div>`).join('');
  const places = placements.map((n, idx) => `<div class="cr-place-row">
      <span class="cr-n dr-disp">${idx + 1}</span>
      ${_portrait(n, ep, { size: 34 })}
      <b class="dr-disp">${esc(n)}</b>
      ${idx === 0 ? '<span class="cr-took dr-disp">crowned</span>' : ''}
    </div>`).join('');

  let n = scenes.length;
  const tail = (duels ? `<div class="dr-step cr-beat" id="dr-step-fincrown-${n++}"
      data-stage="${esc(afterCrown)}">
      <div class="cr-record"><h4 class="dr-disp">For the crown</h4>${duels}</div></div>` : '')
    + `<div class="dr-step cr-beat" id="dr-step-fincrown-${n++}"
      data-stage="${esc(afterCrown)}">
      <div class="cr-record"><h4 class="dr-disp">Placements</h4>${places}</div></div>`;
  const total = n;

  /* THE HOOK. Reads the current step's `data-stage` and repaints the whole
     line from it, every time, rather than patching the newest plinth — see
     the note at the top of reveal.js for why the cheap version breaks on a
     tab switch. `placeOf` is looked up rather than counted, so a plinth
     always shows the placement the season actually recorded. */
  if (typeof window !== 'undefined') {
    const placeOf = {};
    placements.forEach((n, idx) => { placeOf[n] = idx + 1; });
    const ord = n => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.fincrown = (idx) => {
      const step = document.getElementById(`dr-step-fincrown-${idx}`);
      const attr = step?.getAttribute('data-stage') || 'out:|two:|crown:';
      const part = k => (attr.split('|').find(x => x.startsWith(`${k}:`)) || '')
        .slice(k.length + 1).split(',').filter(Boolean);
      const gone = part('out'); const two = part('two'); const win = part('crown')[0];

      let lit = 0;
      for (const el of document.querySelectorAll('.cr-plate')) {
        const n = el.getAttribute('data-queen');
        const isOut = gone.includes(n) || (win && n !== win);
        el.classList.toggle('out', !!isOut);
        el.classList.toggle('finaltwo', two.includes(n));
        el.classList.toggle('crowned', n === win);
        if (!isOut) lit += 1;
        const tag = el.querySelector('.cr-place');
        if (tag) tag.textContent = gone.includes(n) && placeOf[n] ? ord(placeOf[n]) : '';
      }
      // The rig dims with the room.
      const lamps = [...document.querySelectorAll('.cr-lamp')];
      lamps.forEach((l, j) => l.classList.toggle('lit', j < Math.max(1, lit)));

      /* THE FLASH FIRES ONCE, on the beat that names her, and is removed
         when the reader steps back — otherwise stepping backwards and
         forwards again would replay the confetti on a beat that is not the
         crowning. */
      const stageEl = document.getElementById('cr-stage');
      if (stageEl) {
        const isNameBeat = step?.getAttribute('data-crownbeat') === '1';
        if (isNameBeat && !stageEl.classList.contains('flash')) {
          stageEl.classList.add('flash');
        } else if (!win) {
          stageEl.classList.remove('flash');
        }
      }
    };
  }

  /* THE RAIL: who is still standing, and it shrinks. Gated by step, so it
     never shows a plinth going dark before the beat that darkens it. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    const gone = [];
    let won = null;
    window._drSidebar.fincrown = scenes.map(sc => {
      const beat = sc.data?.beat || String(sc.kind || '').split(':')[1] || '';
      const who = (sc.data?.players || [])[0];
      if (beat === 'crown-place' && who) gone.push(who);
      if (NAME_BEATS.has(beat) && who) won = who;
      const left = line.filter(n => !gone.includes(n));
      return `<h4 class="dr-disp">Still standing · ${won ? 1 : left.length}</h4>${
        line.map(n => {
          const dark = gone.includes(n) || (won && n !== won);
          return `<div class="dr-slot${dark ? ' dr-waiting' : ''}">
            ${_portrait(n, ep, { size: 32 })}
            <div><div class="dr-nm">${esc(n)}</div></div>
            <span class="dr-up">${n === won ? 'crowned' : ''}</span></div>`;
        }).join('')}`;
    });
    // The two record cards keep the last panel rather than blanking the rail.
    const last = window._drSidebar.fincrown[window._drSidebar.fincrown.length - 1] || '';
    window._drSidebar.fincrown.push(last, last);
  }

  const house = '<div class="cr-house"><div class="cr-sweep"></div></div>';
  const rail = `<h4 class="dr-disp">Still standing · ${line.length}</h4>${
    line.map(n => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
      <div><div class="dr-nm">${esc(n)}</div></div><span></span></div>`).join('')}`;

  return `<style>${CROWN_CSS}</style>${_shell(
    `<div class="cr-wrap">${house}${stage}${steps}${tail}</div>`, ep, {
      phase: 'stage', title: 'The Crowning', subtitle: 'the last queen standing',
      sidebar: rail,
    })}${_controls('fincrown', Math.max(1, total), ep.num)}`;
}
