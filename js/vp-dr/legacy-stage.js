// ══════════════════════════════════════════════════════════════════════
// vp-dr/legacy-stage.js — the lipstick wall
// ══════════════════════════════════════════════════════════════════════
//
// The All Stars ceremony, built out of what it physically IS rather than
// another card stack with a new accent colour: a dressing-room counter, one
// lipstick standing for every queen in the bottom, and the winner of the song
// alone with them. She picks one up, walks out, and turns it around.
//
// ── THE SPOILER RULE (docs/ADDING-A-SHOW.md §6.5) ─────────────────────
//
// Nothing is lit at rest and NO TUBE CARRIES A NAME until it is turned. The
// bottom queens' names are on the counter because the host said them out loud
// at the call — that is the format — but the name on the chosen lipstick is
// the one secret this screen holds, so it is not in the markup at rest and no
// tube has the `chosen` class until the reveal step.
//
// The tube is inline SVG. A lipstick made of divs is a coloured rectangle.
import {
  FINALE_STAGE_CSS, shell, engine, face, quoteHtml, wireStage,
} from './finale-stage.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export { wireStage };

/* One lipstick: the bullet, the tube, the base. `--tilt` and the classes do
   the rest. Drawn once per queen in the bottom. */
const TUBE = `<svg class="lgx-tube" viewBox="0 0 34 92" aria-hidden="true">
  <defs>
    <linearGradient id="lgx-metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6b6257"/><stop offset=".35" stop-color="#e9dcc3"/>
      <stop offset=".62" stop-color="#b9a887"/><stop offset="1" stop-color="#5d5449"/>
    </linearGradient>
    <linearGradient id="lgx-wax" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9c0f3a"/><stop offset=".4" stop-color="#ff2b6d"/>
      <stop offset="1" stop-color="#8d0c33"/>
    </linearGradient>
  </defs>
  <path class="lgx-wax" d="M11 30 L11 14 Q11 7 17 4 Q23 7 23 14 L23 30 Z" fill="url(#lgx-wax)"/>
  <rect x="9" y="29" width="16" height="9" rx="2" fill="url(#lgx-metal)"/>
  <rect x="7" y="37" width="20" height="50" rx="3" fill="url(#lgx-metal)"/>
  <rect x="7" y="52" width="20" height="3" opacity=".45" fill="#2b2119"/>
  <rect x="10" y="41" width="3" height="42" rx="1.5" fill="#fff" opacity=".22"/>
</svg>`;

export const LEGACY_STAGE_CSS = `
.lgx-counter{position:relative;display:flex;flex-direction:column;align-items:center;gap:16px;
  padding:6px 0 10px;contain:inline-size;min-width:0;max-width:100%}
.lgx-mirror{position:relative;display:flex;align-items:center;justify-content:center;gap:12px;
  padding:10px 18px;border-radius:14px;min-width:0;
  background:linear-gradient(180deg,rgba(255,235,245,.08),rgba(0,0,0,.25));
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
.lgx-mirror::before{content:'';position:absolute;inset:-6px -10px;border-radius:18px;pointer-events:none;
  background:radial-gradient(60% 120% at 50% 0,rgba(255,214,107,.28),transparent 70%);opacity:0;transition:opacity .5s}
.fsx.thinking .lgx-mirror::before{opacity:1}
.lgx-mirror .fsx-face{width:78px;height:78px}
.lgx-mirror b{font:400 16px/1.15 'Anton','Impact',sans-serif;letter-spacing:.05em;text-transform:uppercase;
  color:#ffe9f2;min-width:0;overflow-wrap:anywhere}
.lgx-bulbs{display:flex;gap:7px;margin-bottom:2px}
.lgx-bulbs i{width:7px;height:7px;border-radius:50%;background:#fff3cf;opacity:.25;transition:opacity .4s}
.fsx.lit .lgx-bulbs i{opacity:.9}
.fsx.lit .lgx-bulbs i:nth-child(2n){opacity:.55}

.lgx-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;
  gap:clamp(14px,5vw,52px);padding:14px 0 10px;max-width:100%}
.lgx-one{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;
  transition:transform .5s cubic-bezier(.2,1.3,.4,1),filter .4s,opacity .4s}
.lgx-tube{width:clamp(38px,9vw,54px);height:auto;display:block;
  filter:drop-shadow(0 6px 10px rgba(0,0,0,.5));
  transform-origin:50% 100%;transition:transform .6s cubic-bezier(.2,1.3,.4,1),filter .4s}
.lgx-name{font:600 11px/1.25 var(--font-body,system-ui),sans-serif;letter-spacing:.05em;text-transform:uppercase;
  color:#f3d9e4;opacity:.8;max-width:14ch;text-align:center;
  /* Whole words: overflow-wrap:anywhere broke Julia Sugarbaker into
     SUGARBAK / ER. */
  overflow-wrap:break-word;word-break:normal;hyphens:none}
.lgx-card{display:block;margin-top:3px;min-height:16px;
  font:400 14px/1 'Anton','Impact',sans-serif;letter-spacing:.07em;text-transform:uppercase;
  color:#ff9ebb;opacity:0;transition:opacity .45s}
/* The counter is a shelf the tubes stand on, not a border under each. */
.lgx-row::after{content:'';position:absolute;left:6%;right:6%;bottom:0;height:2px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)}
.lgx-row{position:relative}

.fsx.any .lgx-one:not(.chosen){filter:brightness(.6) saturate(.7);opacity:.85}
.lgx-one.held .lgx-tube{transform:translateY(-10px) rotate(-8deg)}
.lgx-one.chosen{transform:translateY(-12px) scale(1.07)}
.lgx-one.chosen .lgx-tube{transform:translateY(-14px) rotate(0);filter:drop-shadow(0 0 18px rgba(255,43,109,.75))}
.lgx-one.chosen .lgx-card{opacity:1;color:#fff}
.lgx-one.spared{opacity:.6}
.lgx-one.spared .lgx-card{opacity:.85;color:#9ee6bb}

/* ══ WHAT SHE IS WEIGHING ══ under each tube, while she deliberates ══
   The chips are the facts the viewer has already been given — the call, the
   bonds, Untucked — put where the decision is made. They are not on screen
   at rest, and they say nothing about which tube she picks up. */
.lgx-weigh{display:none;flex-wrap:wrap;justify-content:center;gap:3px;max-width:15ch;margin-top:2px}
.fsx.weighing .lgx-weigh,.fsx.holding .lgx-weigh{display:flex}
.lgx-weigh i{font-style:normal;font-size:8px;letter-spacing:.1em;text-transform:uppercase;
  padding:2px 5px;border-radius:3px;color:#d9c6d2;
  background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
.lgx-weigh i.hot{color:#ff9ebb;box-shadow:inset 0 0 0 1px rgba(255,43,109,.5)}
.lgx-weigh i.warm{color:#9ee6bb;box-shadow:inset 0 0 0 1px rgba(62,224,138,.45)}
/* Staggered in, so the row reads as a queen going along the counter. */
.fsx.weighing .lgx-one .lgx-weigh i{animation:lgx-chip .4s ease both}
.lgx-one:nth-child(2) .lgx-weigh i{animation-delay:.12s}
.lgx-one:nth-child(3) .lgx-weigh i{animation-delay:.24s}
@keyframes lgx-chip{from{opacity:0;transform:translateY(4px)}}

/* ══ THE SECOND BEFORE ══ she is holding one and the room does not know
   which. Every tube goes down, the bulbs drop, and the counter waits. */
.fsx.holding .lgx-row{filter:brightness(.42) saturate(.55)}
.fsx.holding .lgx-one .lgx-tube{transform:none}
.fsx.holding .lgx-bulbs i{animation:lgx-pulse 1.6s ease-in-out infinite}
.lgx-bulbs i:nth-child(3){animation-delay:.2s}
.lgx-bulbs i:nth-child(5){animation-delay:.4s}
.lgx-bulbs i:nth-child(7){animation-delay:.6s}
@keyframes lgx-pulse{0%,100%{opacity:.18}50%{opacity:.75}}
.fsx.holding .lgx-counter::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(60% 60% at 50% 40%,transparent,rgba(0,0,0,.55) 90%)}
.lgx-counter{position:relative}

/* ══ HER REASON ══ after the name, never before it. */
.lgx-why{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;justify-content:center;
  max-width:44ch;margin-top:2px;padding:8px 14px;border-radius:12px;
  background:rgba(255,43,109,.10);box-shadow:inset 0 0 0 1px rgba(255,43,109,.35);
  animation:lgx-chip .5s .25s ease both}
.lgx-why-k{flex:0 0 auto;font:400 11px/1 'Anton','Impact',sans-serif;letter-spacing:.18em;
  text-transform:uppercase;color:#ff9ebb}
.lgx-why q{font-size:13px;line-height:1.45;color:#ffe9f2;font-style:italic}

/* The reveal itself: she turns it around. The tube used to spin on its own
   with no perspective, which reads as a wobble rather than a turn — the row
   has depth now, the tube lifts out of the line, and the name lands with it.
   One-shot, so it plays on the step and not on every repaint. */
.lgx-row{perspective:900px}
.lgx-one.turn{animation:lgx-step-out .9s cubic-bezier(.2,1.1,.3,1) both}
.lgx-one.turn .lgx-tube{animation:lgx-turn 1.15s cubic-bezier(.3,1.05,.3,1) both;transform-style:preserve-3d}
.lgx-one.turn .lgx-name{animation:lgx-chip .4s .85s ease both}
@keyframes lgx-step-out{
  0%{transform:translateY(0) scale(1)}
  30%{transform:translateY(-6px) scale(1.02)}
  100%{transform:translateY(-12px) scale(1.07)}
}
@keyframes lgx-turn{
  0%{transform:translateY(-6px) rotateY(0) rotate(-8deg)}
  18%{transform:translateY(-26px) rotateY(0) rotate(-12deg)}
  /* the long half-second where it is edge-on and unreadable */
  55%{transform:translateY(-30px) rotateY(90deg) rotate(0);filter:brightness(1.5)}
  78%{transform:translateY(-18px) rotateY(200deg) rotate(3deg)}
  100%{transform:translateY(-14px) rotateY(180deg) rotate(0)}
}
/* The room takes the light off everybody else as it lands. */
.fsx.any .lgx-row{transition:filter .6s .5s}
.lgx-hand{position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);
  font:400 12px/1 'Anton','Impact',sans-serif;letter-spacing:.08em;text-transform:uppercase;
  color:#ffd66b;opacity:0;transition:opacity .4s;white-space:nowrap}
.lgx-one.held .lgx-hand{opacity:.9}

@media (prefers-reduced-motion: reduce){
  .lgx-one,.lgx-tube,.lgx-card{transition:none}
  .lgx-one.turn .lgx-tube{animation:none}
}
@media (max-height: 999px){
  .lgx-mirror .fsx-face{width:58px;height:58px}
  .lgx-tube{width:clamp(30px,7vw,40px)}
  .lgx-row{gap:clamp(10px,4vw,30px);padding:8px 0 6px}
  .lgx-counter{gap:10px}
}`;

/**
 * The ceremony, one state per reveal step.
 *
 * `list` is the section's scenes in order: `{ kind, who, target, text }`.
 * `bottom` is the queens standing there, alphabetical — the order the host
 * named them in would leak the panel's ranking.
 *
 * The chosen name is absent from every state before the reveal, so a reader
 * who inspects the DOM mid-ceremony finds nothing to spoil.
 */
export function lipstickStage(row, list, {
  ep, bottom = [], holder = null, uid = 'x',
  /* WHAT SHE WEIGHED AND WHY, from js/dr/legacy.js by way of the row. */
  weighed = [], reason = '', why = '', spared = null,
} = {}) {
  const line = [...bottom].sort((a, b) => a.localeCompare(b));
  const states = list.map(s => {
    const st = {
      phase: 'cer', hostOn: false, banner: null, quote: '', mood: '',
      chosen: null, spared: [], held: false, thinking: false, turn: false,
      weigh: false, hold: false, why: false,
    };
    if (s.kind === 'legacy:deliberate') {
      st.thinking = true;
      st.held = true;
      /* WHAT SHE IS ACTUALLY WEIGHING, on the screen where she weighs it.
         The ceremony used to deliberate behind a closed door and then assert
         a name, so the viewer never saw a decision being made — reported as
         "we never get the reasoning as to why someone chose the lipstick". */
      st.weigh = true;
      st.banner = { text: 'The choice', sub: `${line.length} on the stage, one lipstick` };
    } else if (s.kind === 'legacy:hold') {
      /* ── THE SECOND BEFORE ── every tube is down, the counter is dark, one
         of them is in her hand and the screen does not say which. */
      st.hold = true;
      st.mood = 'dark';
      st.banner = { text: 'She has decided', sub: 'and she has not said it yet' };
    } else if (s.kind === 'legacy:reveal') {
      st.chosen = s.target || null;
      st.turn = true;
      st.mood = 'red';
      st.why = true;
      st.banner = { text: 'The name on the lipstick', sub: s.target || '', red: true };
    } else if (s.kind === 'legacy:room') {
      st.chosen = s.target || null;
      st.spared = line.filter(q => q !== s.target);
      st.mood = 'red';
      st.why = true;
    } else if (s.kind === 'legacy:confessional') {
      /* ── AND THE CAMERA CUTS AWAY ──────────────────────────────────
         The counter is not where she says this: she is in the booth, after,
         on her own. The stage went on showing the lipstick wall while she
         talked, so the screen said "still in the room" over a line that only
         exists because she is not. */
      st.chosen = s.target || null;
      st.spared = line.filter(q => q !== s.target);
      st.mood = 'red';
      st.why = true;
      st.phase = 'quote';
      st.quote = quoteHtml({
        name: s.who || holder, ep,
        label: `${s.who || holder} · confessional`, text: s.text,
      });
    } else if (s.kind === 'legacy:last-words') {
      st.chosen = s.target || null;
      st.spared = line.filter(q => q !== s.target);
      st.phase = 'quote';
      st.quote = quoteHtml({ name: s.target, ep, label: `${s.target} · her last words`, text: s.text });
    }
    return st;
  });

  /* ── THE CHIPS UNDER EACH TUBE ──────────────────────────────────────
     Everything the holder is actually weighing about this queen, as facts
     she already knows and the viewer has already been shown: how dangerous
     she is, where the panel put her, whether they are close, whether she
     asked, and whether she has been carried through this before.
     NOT A SPOILER: none of it says which tube she picks up. It is the same
     information from the call and from Untucked, gathered in one place. */
  const byQ = Object.fromEntries((weighed || []).map(w => [w.q, w]));
  const chips = q => {
    const w = byQ[q];
    if (!w) return '';
    const out = [];
    if (w.threat >= 0.66) out.push('<i class="hot">biggest threat</i>');
    else if (w.threat <= 0.34) out.push('<i>no threat to her</i>');
    if (w.panel >= 0.99) out.push('<i class="hot">panel ranked her last</i>');
    if (w.bond >= 4) out.push('<i class="warm">her friend</i>');
    else if (w.bond <= -4) out.push('<i class="hot">no love lost</i>');
    if (w.ally) out.push('<i class="warm">in her circle</i>');
    if (w.pleaded > 0) out.push('<i class="warm">asked her for it</i>');
    if (w.spared > 0) out.push(`<i>spared ${w.spared === 1 ? 'once' : `${w.spared} times`}</i>`);
    return `<span class="lgx-weigh">${out.join('')}</span>`;
  };

  const tubes = line.map(q => `<div class="lgx-one" data-q="${esc(q)}">
    <span class="lgx-hand">in her hand</span>
    ${TUBE}
    <span class="lgx-name">${esc(q)}</span>
    ${chips(q)}
    <span class="lgx-card" data-card></span>
  </div>`).join(' ');

  /* HER REASON, IN HER OWN WORDS, and it does not exist in the markup before
     the name does: it names the queen she protected. */
  const WHY_K = {
    threat: 'Competition', panel: 'The panel', grudge: 'History',
    turn: 'Fairness', friend: 'Friendship', bloc: 'Her circle', plea: 'A promise',
  };
  const body = `<div class="lgx-counter">
    <div class="lgx-bulbs">${'<i></i>'.repeat(9)}</div>
    <div class="lgx-mirror">${holder ? face(holder, ep, 78) : ''}<b>${esc(holder || '')}</b></div>
    <div class="lgx-row">${tubes}</div>
    ${reason ? `<div class="lgx-why" data-why hidden>
      <span class="lgx-why-k">${esc(WHY_K[why] || 'Why')}</span>
      <q>${esc(reason)}</q>
    </div>` : ''}
  </div>`;

  const html = shell({
    id: `lgx-${uid}`, title: 'The lipstick', sub: 'the winner of the song decides', body,
  });

  const apply = engine(`lgx-${uid}`, states, (el, st, fresh) => {
    el.classList.toggle('thinking', !!st?.thinking);
    el.classList.toggle('any', !!st?.chosen);
    el.classList.toggle('weighing', !!st?.weigh);
    el.classList.toggle('holding', !!st?.hold);
    const whyBox = el.querySelector('[data-why]');
    if (whyBox) whyBox.hidden = !st?.why;
    for (const one of el.querySelectorAll('.lgx-one')) {
      const nm = one.dataset.q;
      const isChosen = !!st && st.chosen === nm;
      const isSpared = !!st && (st.spared || []).includes(nm);
      one.classList.toggle('chosen', isChosen);
      one.classList.toggle('spared', isSpared);
      /* "In her hand" belongs to nobody until she has picked one, so during
         the deliberation it is the whole row that stirs, not one tube. */
      one.classList.toggle('held', !!st?.held);
      const card = one.querySelector('[data-card]');
      /* The card says what HAPPENED to her. It used to repeat her name, which
         the plate under the tube and the banner both already carry -- the
         chosen queen read "MK / MK". */
      card.textContent = isChosen ? 'Sashays' : isSpared ? 'Stays' : '';
      // One-shot: the turn plays on arrival at the reveal, not on a repaint.
      if (fresh && isChosen && st.turn) {
        one.classList.remove('turn');
        void one.offsetWidth;
        one.classList.add('turn');
      } else if (!isChosen) one.classList.remove('turn');
    }
  });

  return { html, apply, states };
}

export { FINALE_STAGE_CSS };
