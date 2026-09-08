// ══════════════════════════════════════════════════════════════════════
// vp-dr/arrivals.js — the premiere's entrances
// ══════════════════════════════════════════════════════════════════════
//
// The one screen that exists on exactly one episode, and the only one built
// from the CAST rather than from scenes: the engine emits no `arrivals`
// marker, so a screen waiting for one would never have drawn. It walks
// `houseAtStart` in order — which IS the order they came through the door —
// and gives each queen her first scene of the season if she has one.
//
// The bulbs of her station ignite as she lands, one queen at a time. That is
// the whole gag of a Drag Race entrance and it is the reason this screen
// reveals per queen rather than per card.
import { _shell, _portrait } from './style.js';
import { _controls, _seedRail } from './reveal.js';
import { WERK_CSS, _station } from './werk.js';
import { _judgePortrait } from './style.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const _judgeBust = () => _judgePortrait('rupaul', { stage: false, size: 84 });

export const ARRIVALS_CSS = `
/* ══════════════════════════════════════════════════════════════════════
   THE DOOR, AND THE ROOM BEHIND IT
   ══════════════════════════════════════════════════════════════════════
   A premiere is a door opening twelve times. This screen drew a stack of
   bios — the same card with a different face — so the one genuinely
   theatrical thing in the format was the flattest screen in the build.

   Sticky, because the door does not go anywhere; its light spills down the
   page behind the cards; and the room beside it fills up, which is the part
   that actually builds. The twelfth queen walks into a completely different
   room from the first and now you can see her do it. */
.dr-arrivals{position:relative}
.dr-doorframe{position:sticky;top:0;z-index:6;display:grid;
  grid-template-columns:170px 1fr;gap:22px;align-items:end;
  padding:18px 20px 16px;margin:0 0 22px;
  background:linear-gradient(180deg,#1b0713,#0c0309 76%,rgba(6,2,5,.96));
  border-bottom:1px solid rgba(255,200,61,.26);
  box-shadow:0 18px 40px -24px rgba(0,0,0,.95)}

/* The arch itself. The frame and its bulbs are the SVG; the box behind them
   only holds the light. The border and radius that used to draw the arch are
   gone — two arches, one CSS and one drawn, never quite agreed. */
.dr-df-arch{position:relative;height:132px;overflow:visible}
.dr-arch-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
/* THE BULBS. Warm, glowing, and idling out of step with each other so the
   frame breathes rather than pulsing as one object. */
.dr-bulb{fill:#FFE9A8;filter:drop-shadow(0 0 5px rgba(255,200,61,.95));
  animation:drBulb 3.6s ease-in-out infinite}
@keyframes drBulb{0%,100%{opacity:.9}50%{opacity:.55}}
/* Somebody is coming through: the whole frame surges. */
.dr-doorframe.open .dr-bulbs{animation:drBulbSurge .85s ease-out}
@keyframes drBulbSurge{0%{filter:brightness(2.1)}100%{filter:none}}
.dr-df-glow{position:absolute;inset:6px 6px 0;border-radius:78px 78px 2px 2px;
  background:radial-gradient(70% 100% at 50% 100%,rgba(255,233,168,.55),transparent 72%);
  transition:opacity .5s;opacity:.55}
/* The light the open door throws onto the floor of the page. */
.dr-df-spill{position:absolute;top:100%;left:50%;width:230px;height:200px;
  transform:translateX(-50%);pointer-events:none;
  background:linear-gradient(180deg,rgba(255,233,168,.16),transparent 76%);
  clip-path:polygon(36% 0,64% 0,100% 100%,0 100%);opacity:.5;transition:opacity .5s}
/* Somebody just came through it. */
.dr-doorframe.open .dr-df-glow{animation:drDoorFlare .85s ease-out}
.dr-doorframe.open .dr-df-spill{animation:drSpill .85s ease-out}
@keyframes drDoorFlare{0%{opacity:1;filter:brightness(1.9)}100%{opacity:.55;filter:none}}
@keyframes drSpill{0%{opacity:1}100%{opacity:.5}}

/* The room, filling. */
.dr-df-k{font-size:9px;letter-spacing:.26em;text-transform:uppercase;color:#b892a8}
.dr-df-count{font-size:34px;line-height:1;color:#FFC83D;margin:2px 0 8px}
.dr-df-row{display:flex;flex-wrap:wrap;gap:5px}
.dr-df-q{opacity:.16;filter:grayscale(1);transform:scale(.9);
  transition:opacity .45s,filter .45s,transform .45s cubic-bezier(.2,1.4,.4,1)}
.dr-df-q.in{opacity:1;filter:none;transform:none}
.dr-df-q .dr-por{border:1px solid rgba(255,255,255,.2)}

/* ══ THE ENTRANCE CARD ══
   She comes IN FROM THE DOOR — from the left, where the door is — rather
   than fading upward like every other card in the build. It is the one
   screen where the movement means something specific. */
.dr-arrivals .dr-step{transform:translate3d(-38px,10px,0) scale(.99)}
.dr-arrivals .dr-step.dr-vis{transform:none}
.dr-entrance{padding:22px 24px 20px}
.dr-ent-head{display:grid;grid-template-columns:auto var(--dr-face,88px) 1fr;
  gap:18px;align-items:center}
/* Her number in the running order, big, like a call sheet. */
.dr-ent-no{font-size:40px;line-height:1;color:rgba(255,200,61,.32)}
.dr-ent-id h3{margin:2px 0 0;font-size:30px;line-height:1;text-wrap:balance}
.dr-order{display:block;font-size:9px;letter-spacing:.24em;text-transform:uppercase;
  color:#b892a8}
/* THE LINE. The most quoted thing she says all season, at the size of one. */
.dr-entrance .dr-line{font-size:25px;line-height:1.34;color:#FFE9A8;
  margin:18px 0 0;padding:0 0 0 18px;border-left:3px solid rgba(255,200,61,.5);
  text-wrap:pretty}
.dr-ent-body{margin-top:14px;color:#e9d5e2;font-size:14px;line-height:1.62}
.dr-ent-body p{margin:0 0 9px;max-width:74ch}

@media(max-width:760px){
  .dr-doorframe{position:static;grid-template-columns:1fr}
  .dr-df-arch{height:80px}
  .dr-ent-head{grid-template-columns:auto 1fr;gap:12px}
  .dr-ent-head .dr-door{display:none}
  .dr-entrance .dr-line{font-size:20px}
}
@media(prefers-reduced-motion:reduce){
  .dr-arrivals .dr-step{transform:none}
  .dr-df-q,.dr-df-glow,.dr-df-spill{transition:none}
  .dr-bulb{animation:none}
  .dr-doorframe.open .dr-bulbs{animation:none}
  .dr-doorframe.open .dr-df-glow,.dr-doorframe.open .dr-df-spill{animation:none}
}

/* ── THE ENTRANCE CARD ──
   Rebuilt after looking at it. The portrait was 84px with a decorative arch
   drawn behind it at 104x96, offset up by 12 — so a 20px lip of arch stuck
   out on every side of the face and the whole frame read as broken rather
   than decorative. The doorway is the PORTRAIT now: it takes the arch shape
   itself, and the glow behind is sized from the same variable, so the two can
   never disagree again.
   The row also centred the portrait against a block of text five paragraphs
   tall, which floated it into the middle of nowhere. It starts at the top,
   beside her name, where a face belongs. */
/* BLOCK, NOT A TWO-COLUMN GRID. This card used to be portrait-then-text, so
   it was a grid of two; it is now a header row, then the line, then the
   body, and under the old rule those three were poured into the two columns
   — the biography ended up in the 88px portrait track, one word per line.
   The same bug the maxi had: children laid into a grid built for a
   different structure. The header keeps its own grid, below. */
.dr-entrance{--dr-face:88px;display:block;padding:20px 22px}
.dr-entrance h3{margin:2px 0 0;font-size:26px;line-height:1.05;text-wrap:balance}
.dr-entrance .dr-line{font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;
  font-size:18px;line-height:1.45;color:#ffd8ec;margin:10px 0 0;text-wrap:pretty}
.dr-order{display:block;font-size:9.5px;letter-spacing:.22em;color:#b892a8}

/* The doorway she walks through — the frame IS the portrait. */
.dr-door{position:relative;width:var(--dr-face);display:block}
.dr-door .dr-bust,.dr-door .dr-por,.dr-door .dr-initials{
  width:var(--dr-face)!important;height:calc(var(--dr-face) * 1.12)!important;display:block}
.dr-door .dr-por,.dr-door .dr-initials{
  border-radius:calc(var(--dr-face) / 2) calc(var(--dr-face) / 2) 8px 8px;
  object-fit:cover;object-position:50% 12%;
  border:1px solid rgba(255,224,190,.45)}
.dr-door::before{content:"";position:absolute;left:-9px;right:-9px;top:-9px;bottom:-9px;
  border-radius:calc(var(--dr-face) / 1.6) calc(var(--dr-face) / 1.6) 12px 12px;
  background:linear-gradient(180deg,rgba(255,236,205,.18),transparent 62%);
  z-index:0;pointer-events:none}
.dr-door .dr-bust{position:relative;z-index:1}

/* Her drag style. A chip, not a debug label: lower case with a small caps
   feel, so it reads as a caption on the photograph rather than a build tag. */
.dr-style{display:inline-block;margin:8px 0 0;padding:3px 10px;
  font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;
  border:1px solid rgba(255,200,61,.45);border-radius:2px;
  background:rgba(255,200,61,.08);color:#FFC83D}

.dr-entrance .dr-intro{margin:10px 0 0;color:#f6e8f1;line-height:1.6;text-wrap:pretty}
.dr-entrance .dr-back{margin:8px 0 0;color:#dcc4d5;font-size:14.5px;line-height:1.6;text-wrap:pretty}
.dr-entrance .dr-reaction{margin:12px 0 0;padding:2px 0 2px 14px;font-size:13.5px;
  color:#c3a2b7;border-left:2px solid rgba(255,200,61,.45);text-wrap:pretty}

/* The first impression: the one thing the premiere actually costs. */
.dr-impression{margin:12px 0 0;font-size:13.5px;line-height:1.6;text-wrap:pretty}
.dr-impression.dr-nice{color:#bff0d4}
.dr-impression.dr-shady{color:#ffc9d2}
.dr-impression .dr-arrow{display:inline-block;margin-right:8px;padding:2px 9px;
  font-size:11px;font-weight:700;border:1px solid currentColor;border-radius:2px;
  vertical-align:1px}
.dr-impression .dr-up{color:#3BE08A}
.dr-impression .dr-down{color:#FF294B}

@media(max-width:640px){
  .dr-entrance{--dr-face:64px;gap:14px;padding:16px}
  .dr-entrance h3{font-size:21px}
  .dr-entrance .dr-line{font-size:16px}
}
`;

/**
 * Her arrival beats, in order.
 *
 * The engine writes these now (js/dr/arrivals.js): the walk, the room's
 * answer, and — once the pools are written — her introduction and her
 * backstory. This screen reads them and invents nothing; an entrance line
 * made up here would be the one sentence on the screen the engine did not
 * write, and it would drift from the transcript the moment either changed.
 */
function beatsOf(row, name) {
  // NOT filtered on `text`. The first impression is a bond with no sentence
  // for it yet, and dropping it here would hide the one consequence the
  // premiere actually produces.
  return (row?.dr?.scenes || []).filter(s => s.step === 'arrivals'
    && (s?.data?.players || []).includes(name));
}

/** The impression somebody already in the room formed of her. */
function impressionOf(beats, name) {
  const sc = beats.find(b => b.kind === 'arrival:impression'
    && (b.data?.players || [])[1] === name);
  if (!sc) return '';
  const [, , d] = (sc.bond || [])[0] || [];
  const nice = Number(d) > 0;
  const who = (sc.data?.players || [])[0] || '';
  return `<p class="dr-impression ${nice ? 'dr-nice' : 'dr-shady'}">
    <span class="dr-arrow ${nice ? 'dr-up' : 'dr-down'}">${esc(who)} ${nice ? '+' : ''}${esc(d)}</span>
    ${esc(sc.text || (nice ? `${who} decides she likes her.` : `${who} decides she does not.`))}
  </p>`;
}

/**
 * The doorway, with its bulbs.
 *
 * A lit dome read as a doorway and nothing more — the least detailed thing
 * on a screen built around it. A stage door on this show is a FRAME with
 * bulbs around it, the same object as a dressing-room mirror, so it gets
 * one: the arch drawn as a path and the bulbs placed along it by angle
 * rather than guessed at, which is the only way they sit evenly on a curve.
 *
 * SVG because the project's rule is SVG for anything with a shape — a ring
 * of bulbs following a semicircle is not something CSS can place.
 *
 * They idle at slightly different rates so the frame breathes instead of
 * pulsing as one object, and the whole thing surges when the door opens.
 */
function doorArch() {
  const W = 170; const H = 132; const R = 78; const CX = 85; const CY = 82;
  const bulbs = [];
  // Around the arc, from one shoulder to the other.
  const ARC = 13;
  for (let i = 0; i < ARC; i++) {
    const a = Math.PI * (i / (ARC - 1));
    bulbs.push([CX - Math.cos(a) * R, CY - Math.sin(a) * R]);
  }
  // Down both jambs to the floor.
  for (let i = 1; i <= 3; i++) {
    const y = CY + (H - CY) * (i / 3.2);
    bulbs.push([CX - R, y], [CX + R, y]);
  }
  const dots = bulbs.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}"
    r="3.1" class="dr-bulb" style="animation-delay:${(i % 7) * 0.42}s"/>`).join('');
  return `<svg class="dr-arch-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <defs>
      <radialGradient id="drDoorLight" cx="50%" cy="100%" r="80%">
        <stop offset="0" stop-color="#FFE9A8" stop-opacity=".55"/>
        <stop offset="1" stop-color="#FFC83D" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <path d="M${CX - R} ${H} L${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY} L${CX + R} ${H} Z"
      fill="url(#drDoorLight)"/>
    <path d="M${CX - R} ${H} L${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY} L${CX + R} ${H}"
      fill="none" stroke="rgba(255,200,61,.45)" stroke-width="2"/>
    <g class="dr-bulbs">${dots}</g>
  </svg>`;
}

export function rpBuildArrivals(row) {
  const ep = { num: row?.num ?? row?.dr?.ep ?? 1, format: 'drag-race', dr: row?.dr || {} };
  const cast = row?.houseAtStart || row?.dr?.living || [];
  if (!cast.length) return '';

  const steps = cast.map((name, i) => {
    const beats = beatsOf(row, name);
    const walk = beats.find(b => b.kind === 'arrival:walk');
    const room = beats.find(b => b.kind === 'arrival:room');
    const intro = beats.find(b => b.kind === 'arrival:intro');
    const back = beats.find(b => b.kind === 'arrival:backstory');
    const style = walk?.data?.style;
    /* HER LINE IS THE HERO. An entrance line is the single most quoted thing
       a queen says all season and it was set at 18px above four paragraphs
       of biography, which is a bio with a quote on it rather than an
       entrance. It leads now, in the fashion serif, at the size of a
       headline — and the bio sits under it in small text where a bio goes. */
    return `<div class="dr-step" id="dr-step-arrivals-${i}">
      <div class="dr-panel dr-a-room dr-entrance">
        <div class="dr-ent-head">
          <span class="dr-ent-no dr-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="dr-door">${_station(name, ep, { size: 84 })}</span>
          <div class="dr-ent-id">
            <span class="dr-order">through the door</span>
            <h3 class="dr-disp">${esc(name)}</h3>
            ${style ? `<span class="dr-style">${esc(style.replace('-', ' '))}</span>` : ''}
          </div>
        </div>
        ${walk ? `<p class="dr-line dr-fash">${esc(walk.text)}</p>` : ''}
        <div class="dr-ent-body">
          ${intro ? `<p class="dr-intro">${esc(intro.text)}</p>` : ''}
          ${back ? `<p class="dr-back">${esc(back.text)}</p>` : ''}
          ${room ? `<p class="dr-reaction">${esc(room.text)}</p>` : ''}
          ${impressionOf(beats, name)}
        </div>
      </div></div>`;
  }).join('');

  /* THE HOST CLOSES IT. She arrives once the room is full, which is what
     turns a row of introductions into the start of a season. Skipped
     silently while her pool is unwritten — a blank card would be worse. */
  const hostBeat = (row?.dr?.scenes || []).find(s => s.kind === 'arrival:host');
  const hostStep = hostBeat ? `<div class="dr-step" id="dr-step-arrivals-${cast.length}">
      <div class="dr-panel dr-a-lip dr-entrance">
        <span class="dr-door">${_judgeBust()}</span>
        <div><span class="dr-order">AND THEN</span>
          <h3 class="dr-disp">RuPaul</h3>
          <p class="dr-line">${esc(hostBeat.text)}</p></div>
      </div></div>` : '';

  /* THE RAIL SHOWS ONLY WHO HAS WALKED IN. One panel per step, each listing
     the queens up to that point — so the cast list fills as the door opens
     rather than spoiling the room before anybody has arrived. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar.arrivals = cast.map((_, i) => `<h4 class="dr-disp">In the room · ${i + 1}</h4>${
      cast.slice(0, i + 1).map(n => `<div class="dr-slot">${_portrait(n, ep, { size: 34 })}
        <div><div class="dr-nm">${esc(n)}</div></div><span></span></div>`).join('')}`);
  }

  /* ── THE DOOR ──
     Sticky, and the whole screen hangs off it. An entrance is a door opening
     and one person coming through it into a room that is already watching,
     and this drew a stack of bios: the same card twelve times with a
     different face. The door stays at the top while they arrive, its light
     spills down the page, and the ROOM BESIDE IT FILLS UP — which is the
     part that actually builds, because the twelfth queen walks into a
     completely different room from the first. */
  const doorway = `<div class="dr-doorframe" id="dr-doorframe">
      <div class="dr-df-arch">${doorArch()}<i class="dr-df-glow"></i><i class="dr-df-spill"></i></div>
      <div class="dr-df-side">
        <div class="dr-df-k dr-disp">In the room</div>
        <div class="dr-df-count dr-num" id="dr-df-count">0</div>
        <div class="dr-df-row" id="dr-df-row">${cast.map(n =>
    `<span class="dr-df-q" data-queen="${esc(n)}">${_portrait(n, ep, { size: 30 })}</span>`).join('')}</div>
      </div>
    </div>`;

  /* Each arrival lights her into the room strip. Same hook the crowning and
     the smackdown use: the state of the room after this step, read off the
     step itself, so it survives a tab switch. */
  if (typeof window !== 'undefined') {
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.arrivals = (idx) => {
      const inRoom = cast.slice(0, Math.min(idx + 1, cast.length));
      for (const el of document.querySelectorAll('.dr-df-q')) {
        el.classList.toggle('in', inRoom.includes(el.getAttribute('data-queen')));
      }
      const c = document.getElementById('dr-df-count');
      if (c) c.textContent = String(inRoom.length);
      const frame = document.getElementById('dr-doorframe');
      // The door flares as somebody comes through it, once per click.
      if (frame) {
        frame.classList.remove('open');
        void frame.offsetWidth;
        if (idx >= 0 && idx < cast.length) frame.classList.add('open');
      }
    };
  }

  return `<style>${WERK_CSS}${ARRIVALS_CSS}</style>${_shell(
    `<div class="dr-room dr-arrivals">${doorway}${steps}${hostStep}</div>`, ep,
    {
      phase: 'werk',
      title: 'Entrances',
      subtitle: `${cast.length} queens, one door`,
      sidebar: _seedRail('arrivals', '<h4 class="dr-disp">In the room · 0</h4>'),
    },
  )}${_controls('arrivals', cast.length + (hostBeat ? 1 : 0), ep.num)}`;
}
