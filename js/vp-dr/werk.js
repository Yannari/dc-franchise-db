// ══════════════════════════════════════════════════════════════════════
// vp-dr/werk.js — the room, before and after the stage
// ══════════════════════════════════════════════════════════════════════
//
// Four screens: the cold open, the morning, elimination day, and (in
// arrivals.js) the premiere's entrances. All four take their words from
// `scene.text` and their consequences from `row.dr.events`. NOTHING here
// recomputes anything — a screen that calls a simulation function shows
// tonight's answer on a replay of episode four, which is the bug class the
// manual's §11.5B is entirely about.
//
// ── THE ROOM, DRAWN AS THE ROOM ───────────────────────────────────────
//
// Every device is a real thing in the real werk room, off the Fandom wiki:
//
//   MIRROR STATIONS   each queen has one, framed in bulbs. Here the bulbs
//                     IGNITE around her portrait as her card arrives —
//                     `@property` makes the glow animatable, which a plain
//                     custom property is not.
//   THE MIRROR        the departing queen writes on it in lipstick. The
//                     cold open draws that message stroke by stroke.
//   THE EMPTY STATION one chair with the bulbs dark. It is the first thing
//                     the room notices and the first thing this screen shows.
//   THE SHADE TREE    the confessional. Given a camera frame and a REC dot,
//                     because a talking head is not a scene in the room.
//   THE STATUETTES    one leaves with each queen. The shelf dims as they go.
//
// ── AND IT USES THE CURRENT CSS, WITH FALLBACKS ───────────────────────
//
// `@property` for animatable glows, `:has()` for the two-portrait layout,
// `color-mix()` for accent tints, container queries so a panel reflows to
// its own width rather than the viewport's, `@starting-style` for enter
// animations that do not need a class toggle, `text-wrap: balance/pretty`,
// and `animation-timeline: view()` so cards also settle as they scroll into
// frame. Every one of them degrades to the plain rule underneath: the
// click-to-reveal is what actually governs, and none of this is load-bearing.
import { _shell, _portrait, _icon, _note } from './style.js';
import { _controls } from './reveal.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const WERK_CSS = `
@property --dr-glow{syntax:'<number>';inherits:false;initial-value:0}

/* ── THE MIRROR STATION ── bulbs ignite around her as the card lands ── */
.dr-mirror{position:relative;display:inline-block;--dr-glow:0}
.dr-vis .dr-mirror{animation:drIgnite .7s ease forwards}
@keyframes drIgnite{from{--dr-glow:0}to{--dr-glow:1}}
.dr-mirror::before{content:"";position:absolute;inset:-7px;pointer-events:none;
  background:
    radial-gradient(circle at 50% 0,rgba(255,240,200,1) 0 1.8px,transparent 2.4px) 0 0/11px 11px repeat-x,
    radial-gradient(circle at 50% 100%,rgba(255,240,200,1) 0 1.8px,transparent 2.4px) 0 100%/11px 11px repeat-x,
    radial-gradient(circle at 0 50%,rgba(255,240,200,1) 0 1.8px,transparent 2.4px) 0 0/11px 11px repeat-y,
    radial-gradient(circle at 100% 50%,rgba(255,240,200,1) 0 1.8px,transparent 2.4px) 100% 0/11px 11px repeat-y;
  opacity:calc(.25 + var(--dr-glow) * .75);
  filter:drop-shadow(0 0 calc(var(--dr-glow) * 7px) rgba(255,214,140,.9))}
/* Her station goes dark when she does. */
.dr-mirror.dr-dark::before{opacity:.12;filter:none}
.dr-mirror.dr-dark img{filter:grayscale(1) brightness(.4)}

/* ── THE MIRROR MESSAGE ── written in lipstick, drawn on reveal ── */
.dr-mirrormsg{position:relative;margin:2px 0 0;padding:18px 20px;
  background:linear-gradient(160deg,rgba(255,255,255,.09),rgba(255,255,255,.02));
  border:1px solid rgba(255,255,255,.20);
  box-shadow:inset 0 0 60px rgba(255,255,255,.06)}
.dr-mirrormsg::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(115deg,transparent 42%,rgba(255,255,255,.16) 50%,transparent 58%)}
.dr-lip{font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;font-size:21px;
  color:#FF6FA3;text-shadow:0 0 16px rgba(255,41,75,.75);text-wrap:pretty;
  display:inline-block;overflow:hidden;white-space:pre-wrap}
.dr-vis .dr-lip{animation:drWrite 1.5s steps(48,end) forwards;clip-path:inset(0 100% 0 0)}
@keyframes drWrite{to{clip-path:inset(0 0 0 0)}}
.dr-kiss{color:#FF294B;font-size:26px;line-height:1;margin-left:6px;
  text-shadow:0 0 20px rgba(255,41,75,.9)}

/* ── THE SHADE TREE ── the confessional is not a scene in the room ── */
.dr-confess{--dr-accent:#FF7BC8;position:relative;
  background:radial-gradient(120% 100% at 50% 0,rgba(255,123,200,.16),rgba(10,2,7,.9))}
.dr-confess::after{content:"";position:absolute;inset:0;pointer-events:none;
  box-shadow:inset 0 0 70px rgba(0,0,0,.85);
  background:repeating-linear-gradient(180deg,transparent 0 3px,rgba(0,0,0,.10) 3px 4px)}
.dr-rec{position:absolute;top:10px;right:12px;display:flex;align-items:center;gap:6px;
  font-size:9px;letter-spacing:.2em;color:#ffb8dd;z-index:2}
.dr-rec i{width:8px;height:8px;border-radius:50%;background:#FF294B;
  animation:drRec 1.6s ease-in-out infinite}
@keyframes drRec{0%,100%{opacity:1}50%{opacity:.25}}

/* ── SCENE CARDS ── container-queried, so they reflow to their own width ── */
.dr-room{container-type:inline-size;position:relative}

/* ══ THE STATIONS ══ the room, and who the night reached ══
   A row of mirrors with a queen at each one. Sticky, because the room does
   not leave while you read about it, and each mirror is DARK until the
   night reaches that queen — so the screen shows you who it has been about
   and, by the last card, who it forgot. */
.dr-stations{position:sticky;top:0;z-index:6;display:flex;flex-wrap:wrap;gap:10px;
  justify-content:center;padding:15px 16px 13px;margin:0 0 18px;
  background:linear-gradient(180deg,#1a0713,#0b0309 78%,rgba(6,2,5,.96));
  border-bottom:1px solid rgba(255,233,168,.2);
  box-shadow:0 16px 34px -22px rgba(0,0,0,.95)}
.dr-st-rail{position:absolute;left:14px;right:14px;top:6px;height:2px;
  background:linear-gradient(90deg,transparent,rgba(255,233,168,.22),transparent)}
.dr-station{position:relative;width:66px;text-align:center;opacity:.3;
  filter:grayscale(1);transition:opacity .4s,filter .4s,transform .4s}
.dr-station.on{opacity:1;filter:none;transform:translateY(-2px)}
.dr-station .dr-por{border:1px solid rgba(255,255,255,.18);margin:0 auto;display:block}
.dr-station b{display:block;margin-top:4px;font-size:9px;font-weight:600;color:#e3cfdd;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* The bulbs over her mirror, lit only when she is. */
.dr-st-bulbs{display:block;height:3px;margin:0 auto 5px;width:80%;border-radius:2px;
  background:rgba(255,233,168,.14);transition:background .4s,box-shadow .4s}
.dr-station.on .dr-st-bulbs{background:#FFE9A8;box-shadow:0 0 14px rgba(255,200,61,.75)}
/* The cards scroll under a sticky board, so they reserve its room. */
.dr-room .dr-step{scroll-margin-top:170px}
@media(max-width:760px){.dr-stations{position:static}.dr-station{width:52px}}
@media(prefers-reduced-motion:reduce){.dr-station,.dr-st-bulbs{transition:none}}

/* ══ THE WERK ROOM ══ one set, four times of day ══
   A wall of mirrors with bulbs around them, a bench of stations along the
   bottom, and the sign on the wall. Absolute inside the content column so
   the room is the screen rather than the browser window, and it runs the
   full length of the night. */
.dr-shop{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;
  overflow:hidden}
.dr-shop i{position:absolute;display:block}
/* The bulbs around the mirror wall. */
.dr-shop-mirrors{top:10px;left:6%;right:6%;height:210px;opacity:.5;
  background:
    repeating-linear-gradient(90deg,rgba(255,233,168,.5) 0 7px,transparent 7px 46px) top/100% 4px no-repeat,
    repeating-linear-gradient(90deg,rgba(255,233,168,.5) 0 7px,transparent 7px 46px) bottom/100% 4px no-repeat,
    linear-gradient(180deg,rgba(255,255,255,.05),transparent 70%);
  border-left:1px solid rgba(255,255,255,.07);
  border-right:1px solid rgba(255,255,255,.07)}
/* The bench of stations along the bottom. */
.dr-shop-bench{left:0;right:0;bottom:0;height:26%;
  background:linear-gradient(180deg,transparent,rgba(0,0,0,.5));
  border-top:1px solid rgba(255,255,255,.08)}
/* The sign. */
.dr-shop-sign{top:34px;right:9%;width:120px;height:3px;background:#FF3D9A;
  box-shadow:0 0 26px 7px rgba(255,61,154,.45)}

/* THE HOUR. Same room, different light. */
.dr-shop-cold{background:linear-gradient(180deg,rgba(140,170,210,.13),transparent 45%)}
.dr-shop-cold .dr-shop-mirrors{opacity:.28}
.dr-shop-day{background:radial-gradient(100% 60% at 50% 0%,rgba(255,233,168,.10),transparent 60%)}
.dr-shop-work{background:radial-gradient(90% 55% at 50% 100%,rgba(255,61,154,.13),transparent 68%)}
.dr-shop-work .dr-shop-bench{background:linear-gradient(180deg,transparent,rgba(255,61,154,.14))}
.dr-shop-mirror{background:linear-gradient(180deg,rgba(255,233,168,.16),transparent 38%),
  linear-gradient(0deg,rgba(0,0,0,.55),transparent 55%)}
.dr-shop-mirror .dr-shop-mirrors{opacity:1}
.dr-card{display:grid;grid-template-columns:auto 1fr;gap:15px;align-items:start;
  padding:15px 17px 15px 21px}
.dr-card p{margin:6px 0 0;color:#f4e3ed;text-wrap:pretty}
.dr-card h3{margin:0;font-size:17px;text-wrap:balance}
@container (max-width:430px){.dr-card{grid-template-columns:1fr}}
/* A scene naming two queens IS a social card — decided by the markup it has
   rather than by a flag somebody has to remember to pass. */
.dr-card:has(.dr-two){border-style:dashed;
  background:color-mix(in srgb, var(--dr-accent,#7B2FF7) 9%, transparent)}
/* ══ TWO QUEENS, AND WHAT THE SCENE DID TO THEM ══
   A pair card draws the bond as a line between the faces: green where the
   scene brought them together, red where it did not. The delta is already
   on the event and was only ever spent on a chip underneath the prose, so
   the shape of the room had to be read rather than seen. */
.dr-two{position:relative;display:flex;gap:14px;align-items:center}
.dr-pair .dr-two::before{content:"";position:absolute;left:50%;top:50%;
  width:14px;height:2px;transform:translate(-50%,-50%);
  background:rgba(255,255,255,.22);border-radius:2px}
.dr-pair.dr-warm .dr-two::before{background:#3BE08A;
  box-shadow:0 0 10px rgba(59,224,138,.8)}
.dr-pair.dr-cold .dr-two::before{background:#FF294B;
  box-shadow:0 0 10px rgba(255,41,75,.8)}
/* The line draws itself as the card lands. */
.dr-step.dr-vis .dr-pair .dr-two::before{animation:drTie .45s ease-out both .15s}
@keyframes drTie{from{transform:translate(-50%,-50%) scaleX(0)}
  to{transform:translate(-50%,-50%) scaleX(1)}}
/* A pair that fell out leans away from each other. */
.dr-pair.dr-cold .dr-two .dr-bust:first-child{transform:rotate(-2.5deg)}
.dr-pair.dr-cold .dr-two .dr-bust:last-child{transform:rotate(2.5deg)}

/* ══ A CONFESSIONAL IS A CAMERA LOOKING AT HER ══
   Corner marks and a tally, so a piece to camera reads as one rather than
   as another paragraph with a red dot in the corner. */
.dr-confess{position:relative}
.dr-vf{position:absolute;width:14px;height:14px;border:2px solid rgba(255,184,221,.5);
  pointer-events:none}
.dr-vf-tl{top:7px;left:7px;border-right:0;border-bottom:0}
.dr-vf-tr{top:7px;right:7px;border-left:0;border-bottom:0}
.dr-vf-bl{bottom:7px;left:7px;border-right:0;border-top:0}
.dr-vf-br{bottom:7px;right:7px;border-left:0;border-top:0}

/* The consequence lands after the sentence that caused it. */
.dr-step.dr-vis .dr-bond-row{animation:drChip .4s ease-out both .28s}
@keyframes drChip{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

@media(prefers-reduced-motion:reduce){
  .dr-step.dr-vis .dr-pair .dr-two::before,
  .dr-step.dr-vis .dr-bond-row{animation:none}
}
.dr-note{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#C9A6BC}

/* ── BOND ARROWS ── what the scene actually cost ── */
.dr-bond-row{display:flex;align-items:center;gap:9px;margin-top:10px;flex-wrap:wrap}
.dr-arrow{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;font-size:11px;
  font-weight:700;border:1px solid currentColor}
.dr-up{color:#3BE08A}.dr-down{color:#FF294B}
.dr-arrow svg{width:13px;height:13px}
.dr-vis .dr-arrow svg path{stroke-dasharray:22;stroke-dashoffset:22;
  animation:drDraw .5s ease .25s forwards}
@keyframes drDraw{to{stroke-dashoffset:0}}

/* ── THE CATEGORY BANNER ── elimination day has a subject ── */
.dr-cat{padding:16px 20px;margin-bottom:14px;text-align:center;
  background:linear-gradient(180deg,rgba(255,61,154,.20),rgba(10,2,7,.6));
  border:1px solid rgba(255,61,154,.45)}
.dr-cat small{display:block;font-size:9px;letter-spacing:.3em;color:#ffc9e5;margin-bottom:4px}
.dr-cat b{font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;font-weight:400;
  font-size:27px;text-wrap:balance}

/* ── THE STATUETTE SHELF ── one leaves with each queen ── */
.dr-shelf{display:flex;gap:6px;align-items:flex-end;margin-top:12px}
.dr-statuette{width:12px;height:28px;background:linear-gradient(180deg,#FFC83D,#7a5300)}
.dr-statuette.dr-gone{opacity:.15}

/* ── READY CHECKLIST ── the rail on elimination day ── */
.dr-check{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:12.5px}
.dr-check i{width:14px;height:14px;border:1px solid rgba(255,255,255,.4);display:inline-block;
  position:relative;flex:0 0 14px}
.dr-check.dr-ready i{background:#3BE08A;border-color:#3BE08A}
.dr-check.dr-ready i::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;
  border:2px solid #06210f;border-top:0;border-left:0;transform:rotate(42deg)}

/* Cards also settle as they scroll into frame, where the browser supports it.
   The click-to-reveal is what governs; this is polish and nothing depends
   on it. */
@supports (animation-timeline: view()){
  @media (prefers-reduced-motion: no-preference){
    .dr-vis .dr-card{animation:drSettle linear both;animation-timeline:view();
      animation-range:entry 0% entry 55%}
    @keyframes drSettle{from{opacity:.35;transform:translateY(18px) scale(.985)}
      to{opacity:1;transform:none}}
  }
}
@media(prefers-reduced-motion:reduce){
  .dr-vis .dr-mirror,.dr-vis .dr-lip,.dr-vis .dr-arrow svg path{animation:none}
  .dr-mirror{--dr-glow:1}
  .dr-vis .dr-lip{clip-path:none}
}
`;

const ARROW_UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V5m0 0l-6 6m6-6l6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const ARROW_DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15m0 0l6-6m-6 6l-6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

/** A queen at her station: portrait in a bulb frame that lights as she lands. */
function station(name, ep, { size = 62, dark = false } = {}) {
  return `<span class="dr-mirror${dark ? ' dr-dark' : ''}">${
    _portrait(name, ep, { size })}</span>`;
}

/**
 * What this scene actually cost, from the row's own events.
 *
 * Matched on the scene's KIND, because `dr.events` carries the same kind
 * string. Nothing is recomputed and nothing is inferred from the prose.
 */
/** The engine event this scene narrates, if it has one. */
function eventFor(row, sc) {
  return (row?.dr?.events || []).find(e => (e.type || e.kind) === sc.kind
    && String((e.players || []).join()) === String((sc?.data?.players || []).join()));
}

function consequences(row, sc) {
  const ev = eventFor(row, sc);
  if (!ev) return '';
  const bits = [];
  for (const [a, b, d] of ev.bond || []) {
    const up = Number(d) > 0;
    bits.push(`<span class="dr-arrow ${up ? 'dr-up' : 'dr-down'}">${up ? ARROW_UP : ARROW_DOWN}
      ${esc(a)} &amp; ${esc(b)} ${up ? '+' : ''}${esc(d)}</span>`);
  }
  for (const [who, d] of Object.entries(ev.pop || {})) {
    const up = Number(d) > 0;
    bits.push(`<span class="dr-arrow ${up ? 'dr-up' : 'dr-down'}">${up ? ARROW_UP : ARROW_DOWN}
      ${esc(who)} · audience ${up ? '+' : ''}${esc(d)}</span>`);
  }
  return bits.length ? `<div class="dr-bond-row">${bits.join('')}</div>` : '';
}

/** One scene, as a card. Two players make it a social card via `:has()`. */
function sceneCard(sc, i, suffix, ep, row, { accent = 'dr-a-room' } = {}) {
  const players = sc?.data?.players || [];
  const confess = /confess|shade-tree|talking/.test(sc.kind || '');
  const busts = players.length
    ? `<span class="${players.length > 1 ? 'dr-two' : ''}">${
      players.slice(0, 2).map(n => station(n, ep, { size: players.length > 1 ? 50 : 62 })).join('')
    }</span>`
    : '';
  const first = String(players[0] || '');
  const opens = first && String(sc.text || '').split(/(?<=[.!?])\s/)[0].includes(first);

  /* WHAT KIND OF SCENE THIS IS, drawn rather than described. Every card in
     the werk room looked the same whatever was happening in it — a
     confessional to camera, two queens falling out, and one queen sewing
     alone are three different shots and the screen gave them one frame.
     A CONFESSIONAL is a camera looking at her: a viewfinder, corner marks
     and a running tally light. A PAIR is two faces with the bond between
     them drawn as a line — green when the scene brought them together, red
     when it did not — so you can read the room from the shapes before you
     read a word. */
  const ev = eventFor(row, sc);
  const bondDelta = Number((ev?.bond || [])[0]?.[2]) || 0;
  const pairCls = players.length > 1
    ? ` dr-pair${bondDelta > 0 ? ' dr-warm' : bondDelta < 0 ? ' dr-cold' : ''}` : '';

  return `<div class="dr-step" id="dr-step-${suffix}-${i}">
    <div class="dr-panel ${accent} dr-card${confess ? ' dr-confess' : ''}${pairCls}">
      ${confess ? `<span class="dr-rec"><i></i>REC</span>
        <span class="dr-vf dr-vf-tl"></span><span class="dr-vf dr-vf-tr"></span>
        <span class="dr-vf dr-vf-bl"></span><span class="dr-vf dr-vf-br"></span>` : ''}
      ${busts}
      <div>
        ${players.length ? `<h3 class="dr-disp">${esc(players.join(' & '))}</h3>` : ''}
        ${_note(sc) ? `<span class="dr-note">${esc(_note(sc))}</span>` : ''}
        <p>${!players.length || opens ? '' : ''}${esc(sc.text || '')}</p>
        ${consequences(row, sc)}
      </div>
    </div></div>`;
}

/** Everybody still here, for a rail. */
const livingOf = row => row?.dr?.living || [];

function railWho(row, ep, title) {
  const rows = livingOf(row).map(n => `<div class="dr-slot">${_portrait(n, ep, { size: 34 })}
      <div><div class="dr-nm">${esc(n)}</div></div><span></span></div>`).join('');
  return `<h4 class="dr-disp">${esc(title)} · ${livingOf(row).length}</h4>${rows}`;
}

const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });

/**
 * The werk room, drawn once and lit four ways.
 *
 * FOUR SCREENS HAPPEN IN THIS ROOM — the cold open, the morning, prep and
 * elimination day — and all four were the same purple gradient as the main
 * stage, which is somewhere else entirely. It is one room: a wall of
 * mirrors with bulbs around them, a row of stations, a neon sign.
 *
 * What separates the four is the LIGHT, because what separates them in the
 * show is the time of day. The cold open is the harsh morning after a night
 * somebody left; the morning is flat working light; prep is late and warm
 * with the machines running; elimination day is the mirrors lit for makeup
 * and everything else dark. Same set, four hours of the day, which is the
 * cheapest honest way to make four screens feel like four moments.
 */
const SHOP_LIGHT = {
  coldopen: 'cold', morning: 'day', prep: 'work', elimday: 'mirror',
};
const shop = suffix => `<div class="dr-shop dr-shop-${SHOP_LIGHT[suffix] || 'day'}"
    aria-hidden="true">
    <i class="dr-shop-sign"></i>
    <i class="dr-shop-mirrors"></i>
    <i class="dr-shop-bench"></i>
  </div>`;

function screen(row, { suffix, phase, title, subtitle, scenes, sidebar, lead = '' }) {
  const ep = epOf(row);
  const steps = scenes.map((sc, i) => sceneCard(sc, i, suffix, ep, row)).join('');

  /* ── THE STATIONS ──
     A werk room IS a row of mirrors with a queen at each one, and all four
     of these screens drew a column of cards in front of a wall. The wall was
     right and the room was missing: you could not see who was in it, or
     which of them the night had been about.
     One station per queen, sticky above the cards, and HER MIRROR LIGHTS
     WHEN THE NIGHT REACHES HER — so a screen that spends four cards on two
     queens looks like what it is, and by the last click you can see who the
     episode forgot. That is the same fact the aftermath's screen-time
     numbers carry, drawn where somebody watching will notice it. */
  const room = livingOf(row);
  const board = room.length ? `<div class="dr-stations" id="dr-stations-${suffix}">
      <div class="dr-st-rail"></div>
      ${room.map(n => `<div class="dr-station" data-queen="${esc(n)}">
        <i class="dr-st-bulbs"></i>
        ${_portrait(n, ep, { size: 34 })}
        <b>${esc(n)}</b>
      </div>`).join('')}
    </div>` : '';

  /* Who the night has reached, per step, read off the step itself — the
     same hook the crowning, the smackdown and the entrances use. */
  if (typeof window !== 'undefined') {
    const upTo = [];
    const seen = new Set();
    for (const sc of scenes) {
      for (const n of (sc?.data?.players || [])) seen.add(n);
      upTo.push([...seen]);
    }
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra[suffix] = (idx) => {
      const lit = new Set(upTo[Math.max(0, Math.min(idx, upTo.length - 1))] || []);
      for (const el of document.querySelectorAll(`#dr-stations-${suffix} .dr-station`)) {
        el.classList.toggle('on', idx >= 0 && lit.has(el.getAttribute('data-queen')));
      }
    };
  }

  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar[suffix] = scenes.map(() => sidebar);
  }
  return `<style>${WERK_CSS}</style>${_shell(
    `<div class="dr-room">${shop(suffix)}${board}${lead}${steps}</div>`, ep,
    { phase, title, subtitle, sidebar },
  )}${_controls(suffix, scenes.length, ep.num)}`;
}

const sectionScenes = (row, opener, stopAt) => {
  const all = row?.dr?.scenes || [];
  const start = all.findIndex(s => s.kind === opener);
  if (start === -1) return [];
  const rest = all.slice(start + 1);
  const end = rest.findIndex(s => stopAt.includes(s.kind));
  return (end === -1 ? rest : rest.slice(0, end)).filter(s => s.text);
};

/**
 * The cold open: the mirror message, the empty station, and what the room
 * does about it.
 */
export function rpBuildColdOpen(row) {
  const ep = epOf(row);
  const scenes = sectionScenes(row, 'cold-open', ['werk-morning', 'mini', 'maxi-announce']);
  const open = (row?.dr?.scenes || []).find(s => s.kind === 'cold-open');
  const gone = open?.data?.gone || (row?.exits || []).map(x => x.name);
  /* THE WERK ROOM'S MESSAGE, NOT THE STAGE'S. This matched any scene whose
     kind contained "mirror-message" — which includes `stage:mirror-message`,
     written by TONIGHT's eliminated queen at the END of the episode. So the
     cold open opened on a message from a queen who had not left yet, over a
     card naming the queen who had: a spoiler and a contradiction in the same
     three lines. The cold open only ever knows the werk room's version. */
  const msg = (row?.dr?.scenes || []).find(s => (s.kind || '').startsWith('werk:')
    && /mirror-message/.test(s.kind));

  const lead = gone.length ? `<div class="dr-step dr-vis" id="dr-step-coldopen-lead">
    <div class="dr-panel dr-a-lip dr-card">
      ${station(gone[0], ep, { size: 62, dark: true })}
      <div>
        <h3 class="dr-disp">${esc(gone.join(' &amp; '))} — the empty station</h3>
        <span class="dr-note">the bulbs are off and nobody has said so out loud</span>
        <div class="dr-mirrormsg">
          <span class="dr-lip">${esc(msg?.text || 'The mirror still has her handwriting on it.')}</span>
          <span class="dr-kiss dr-disp">&times;</span>
        </div>
        <div class="dr-shelf">${livingOf(row).map(() => '<span class="dr-statuette"></span>').join('')}${
  gone.map(() => '<span class="dr-statuette dr-gone"></span>').join('')}</div>
      </div>
    </div></div>` : '';

  return screen(row, {
    suffix: 'coldopen', phase: 'werk', title: 'Cold Open',
    subtitle: 'the room, before anything',
    scenes, lead,
    sidebar: railWho(row, ep, 'Still here'),
  });
}

/** The morning: the room at work, and what it costs them. */
export function rpBuildWerkMorning(row) {
  const ep = epOf(row);
  const scenes = sectionScenes(row, 'werk-morning', ['mini', 'maxi-announce', 'chal:mini-announce']);
  return screen(row, {
    suffix: 'morning', phase: 'werk', title: 'The Werk Room', subtitle: 'morning',
    scenes,
    sidebar: railWho(row, ep, 'In the room'),
  });
}

/**
 * Elimination day: getting ready, with the runway category named at the top
 * so the room's talk has a subject.
 */
export function rpBuildWerkElimDay(row) {
  const ep = epOf(row);
  const scenes = sectionScenes(row, 'werk-elim-day', ['main-stage', 'stage:entrance']);
  const cat = row?.dr?.runway?.category;
  const lead = cat ? `<div class="dr-cat">
      <small>tonight's category is</small><b>${esc(cat)}</b></div>` : '';

  // Ready when she has a scene on this screen; the rest are still at it.
  const named = new Set(scenes.flatMap(s => s?.data?.players || []));
  const rail = `<h4 class="dr-disp">Getting ready</h4>${
    livingOf(row).map(n => `<div class="dr-check ${named.has(n) ? 'dr-ready' : ''}">
      <i></i>${_portrait(n, ep, { size: 26 })} ${esc(n)}</div>`).join('')}`;

  return screen(row, {
    suffix: 'elimday', phase: 'werk', title: 'Elimination Day',
    subtitle: 'the last hour in the room', scenes, lead, sidebar: rail,
  });
}

export { station as _station, WERK_CSS as _WERK_CSS };
