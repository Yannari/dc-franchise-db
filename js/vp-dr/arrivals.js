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
import { _controls } from './reveal.js';
import { WERK_CSS, _station } from './werk.js';
import { _judgePortrait } from './style.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const _judgeBust = () => _judgePortrait('rupaul', { stage: false, size: 84 });

export const ARRIVALS_CSS = `
.dr-entrance{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center;
  padding:18px 20px 18px 24px}
.dr-entrance h3{margin:0 0 2px;font-size:24px;text-wrap:balance}
.dr-entrance .dr-line{font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;
  font-size:18px;color:#ffd0e8;text-wrap:pretty}
.dr-order{font-size:10px;letter-spacing:.24em;color:#C9A6BC}
.dr-style{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;
  padding:3px 9px;margin:6px 0;border:1px solid rgba(255,200,61,.6);color:#FFC83D}
.dr-entrance .dr-intro{margin:8px 0 0;color:#f4e3ed;text-wrap:pretty}
.dr-entrance .dr-back{margin:6px 0 0;color:#e3cfdd;font-size:14px;text-wrap:pretty}
.dr-entrance .dr-reaction{margin:10px 0 0;padding-left:12px;font-size:13.5px;color:#C9A6BC;
  border-left:2px solid rgba(255,200,61,.5);text-wrap:pretty}
/* The first impression: the one thing the premiere actually costs. */
.dr-impression{margin:9px 0 0;font-size:13px;display:flex;align-items:center;gap:9px;
  flex-wrap:wrap;text-wrap:pretty}
.dr-impression.dr-nice{color:#bff0d4}
.dr-impression.dr-shady{color:#ffc9d2}
.dr-impression .dr-arrow{padding:2px 9px;font-size:11px;font-weight:700;border:1px solid currentColor}
.dr-impression .dr-up{color:#3BE08A}
.dr-impression .dr-down{color:#FF294B}
/* The doorway she walks through, behind the portrait. */
.dr-door{position:relative}
.dr-door::before{content:"";position:absolute;left:50%;top:-12px;transform:translateX(-50%);
  width:104px;height:96px;border-radius:52px 52px 0 0;
  background:linear-gradient(180deg,rgba(255,240,210,.20),transparent 70%);
  border:1px solid rgba(255,240,200,.4);border-bottom:none;z-index:-1}
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
      sidebar: '<h4 class="dr-disp">In the room · 0</h4>',
    },
  )}${_controls('arrivals', cast.length + (hostBeat ? 1 : 0), ep.num)}`;
}
