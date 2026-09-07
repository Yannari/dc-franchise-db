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
.dr-entrance{--dr-face:88px;
  display:grid;grid-template-columns:var(--dr-face) 1fr;gap:20px;align-items:start;
  padding:20px 22px}
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
    return `<div class="dr-step" id="dr-step-arrivals-${i}">
      <div class="dr-panel dr-a-room dr-entrance">
        <span class="dr-door">${_station(name, ep, { size: 84 })}</span>
        <div>
          <span class="dr-order">QUEEN ${String(i + 1).padStart(2, '0')} THROUGH THE DOOR</span>
          <h3 class="dr-disp">${esc(name)}</h3>
          ${style ? `<span class="dr-style">${esc(style.replace('-', ' '))}</span>` : ''}
          ${walk ? `<p class="dr-line">${esc(walk.text)}</p>` : ''}
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

  return `<style>${WERK_CSS}${ARRIVALS_CSS}</style>${_shell(
    `<div class="dr-room">${steps}${hostStep}</div>`, ep,
    {
      phase: 'werk',
      title: 'Entrances',
      subtitle: `${cast.length} queens, one door`,
      sidebar: _seedRail('arrivals', '<h4 class="dr-disp">In the room · 0</h4>'),
    },
  )}${_controls('arrivals', cast.length + (hostBeat ? 1 : 0), ep.num)}`;
}
