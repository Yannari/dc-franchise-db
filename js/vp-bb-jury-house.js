// ══════════════════════════════════════════════════════════════════════
// vp-bb-jury-house.js — the lodge, and the board nobody in it can see
// ══════════════════════════════════════════════════════════════════════
//
// Every other screen in this catalogue is a room inside the Big Brother house:
// hard light, concrete, cameras in the walls, a countdown running somewhere.
// This one is deliberately the opposite of all of that, because the jury house
// is the opposite of all of that — it is warm, wooden, lamplit and slow, and
// the people in it have stopped playing. Nothing here is on a clock.
//
// The identity is a LODGE AT NIGHT. A long window with a lamp behind it, one
// pane per juror, and the lamp brightening as the room fills across the season.
// No competition furniture, no block, no wall screen: the only mechanism on the
// page is a table of opinions.
//
// That table is the point. THE BOARD is every juror's current read of every
// person still playing, and it is the only place in the simulator where the
// jury's mind is visible while it is still being changed. It draws from
// `readsBefore` until the roundtable card is turned over and from `reads`
// afterwards — so the audience watches the argument first and sees what it did
// second. Showing the final numbers from the top would be the same spoiler as
// printing the vote above the ballots.

import { _shell, _deps, _key, _init, _hidden, _card, _faces } from './vp-bb-twists.js';

const JH_CSS = `
.bbjh{--jh-warm:#e8c98a;--jh-ink:#efe4d2;--jh-dim:#8e8371;--jh-line:#3d3428;--jh-glass:#1a1712}
.bbjh-title{font-family:var(--font-display);font-size:clamp(24px,4.4vw,42px);letter-spacing:3px;text-align:center;
  color:var(--jh-ink);text-shadow:0 0 26px rgba(232,201,138,.28);margin:0 0 2px;line-height:1}
.bbjh-sub{font-family:var(--font-mono);text-align:center;font-size:9.5px;letter-spacing:2.4px;color:var(--jh-dim);
  text-transform:uppercase;margin-bottom:14px}

/* ── the lodge ── */
.bbjh-stage{max-width:940px;margin:0 auto 18px;border:1px solid var(--jh-line);border-radius:4px;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 8%,rgba(232,201,138,.10),transparent 60%),
    linear-gradient(180deg,#15130f 0%,#100e0b 100%)}
.bbjh-lodge{display:block;width:100%;height:auto}
.bbjh-lamp{animation:bbjhFlicker 6s ease-in-out infinite}
@keyframes bbjhFlicker{0%,100%{opacity:.92}42%{opacity:1}67%{opacity:.85}}

/* ── the board ── */
.bbjh-board{border-top:1px solid var(--jh-line);padding:10px 12px 12px;background:rgba(0,0,0,.28)}
.bbjh-bh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;
  font-family:var(--font-mono);font-size:8.5px;letter-spacing:2.2px;color:var(--jh-dim);text-transform:uppercase}
.bbjh-bh b{color:var(--jh-warm);font-weight:400}
.bbjh-row{display:grid;grid-template-columns:112px 1fr;gap:8px;align-items:center;padding:4px 0;
  border-top:1px dashed rgba(255,255,255,.05)}
.bbjh-row:first-of-type{border-top:0}
.bbjh-who{display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:10px;color:var(--jh-ink)}
.bbjh-who .bb-av{border:1px solid rgba(232,201,138,.22)}
.bbjh-reads{display:flex;flex-wrap:wrap;gap:5px}
.bbjh-chip{display:inline-flex;align-items:center;gap:5px;padding:2px 7px;border:1px solid var(--jh-line);border-radius:2px;
  font-family:var(--font-mono);font-size:9px;letter-spacing:.6px;color:#c9bfae;background:rgba(255,255,255,.02)}
.bbjh-chip i{width:5px;height:5px;border-radius:50%;background:#6a6255;font-style:normal}
.bbjh-chip.up{border-color:#4d6a3c;color:#bcd8a6}.bbjh-chip.up i{background:#8fc46a}
.bbjh-chip.dn{border-color:#6a3a34;color:#e0b0a8}.bbjh-chip.dn i{background:#c9584c}
.bbjh-chip s{opacity:.55;text-decoration:none;font-size:8px;letter-spacing:1.4px;text-transform:uppercase}
.bbjh-sealed{font-family:var(--font-mono);font-size:9.5px;letter-spacing:1.6px;color:var(--jh-dim);text-align:center;padding:10px 0}

/* ── the roundtable card ── */
.bbjh-table{border:1px solid #6a5a34;border-radius:3px;padding:0;overflow:hidden;background:rgba(232,201,138,.05)}
.bbjh-tname{display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid var(--jh-line);
  background:rgba(232,201,138,.09);font-family:var(--font-display);font-size:15px;letter-spacing:1.6px;color:var(--jh-ink)}
.bbjh-side{display:grid;grid-template-columns:56px 1fr;gap:9px;padding:9px 10px;font-size:11.5px;line-height:1.55}
.bbjh-side+.bbjh-side{border-top:1px dashed rgba(255,255,255,.07)}
.bbjh-tag{font-family:var(--font-mono);font-size:8px;letter-spacing:1.6px;text-transform:uppercase;padding-top:2px}
.bbjh-side.for .bbjh-tag{color:#8fc46a}
.bbjh-side.against .bbjh-tag{color:#c9584c}
.bbjh-side p{margin:0;color:#d6cbb8}
@media(prefers-reduced-motion:reduce){.bbjh-lamp{animation:none}}
`;

/**
 * The lodge, drawn rather than described.
 *
 * One lit pane per juror, so the window fills up across the season and the
 * screen carries the number without a caption. SVG, not divs — a window built
 * out of borders and gradients reads as a table with ambitions.
 */
function lodge(residents) {
  const panes = Math.max(1, Math.min(7, residents.length));
  const w = 44, gap = 8, total = panes * w + (panes - 1) * gap;
  const x0 = (620 - total) / 2;
  return `<svg class="bbjh-lodge" viewBox="0 0 620 190" role="img"
      aria-label="A lit lodge window at night, one pane for each juror">
    <defs>
      <linearGradient id="jhSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0d1018"/><stop offset="1" stop-color="#14110d"/>
      </linearGradient>
      <radialGradient id="jhGlow" cx="50%" cy="55%" r="55%">
        <stop offset="0" stop-color="rgba(232,201,138,.55)"/>
        <stop offset="1" stop-color="rgba(232,201,138,0)"/>
      </radialGradient>
    </defs>
    <rect width="620" height="190" fill="url(#jhSky)"/>
    ${[...Array(9)].map((_, i) => `<circle cx="${34 + i * 68}" cy="${16 + (i % 4) * 11}" r="1.1" fill="#cfd6e4" opacity=".5"/>`).join('')}
    <!-- treeline -->
    <path d="M0 150 L34 96 L58 150 L92 88 L120 150 L150 104 L178 150 L214 92 L246 150 L620 150 Z"
      fill="#0a0c0a" opacity=".85"/>
    <path d="M620 150 L586 100 L560 150 L520 90 L490 150 L452 106 L424 150 Z" fill="#0a0c0a" opacity=".85"/>
    <!-- lodge wall -->
    <rect x="${x0 - 26}" y="46" width="${total + 52}" height="104" rx="3" fill="#1d1a15" stroke="#3d3428"/>
    ${[...Array(5)].map((_, i) => `<path d="M${x0 - 26} ${58 + i * 20} h${total + 52}" stroke="#241f18" stroke-width="1"/>`).join('')}
    <ellipse class="bbjh-lamp" cx="310" cy="98" rx="${Math.max(120, total * 0.9)}" ry="66" fill="url(#jhGlow)"/>
    <!-- the panes -->
    ${residents.slice(0, 7).map((_, i) => `<g class="bbjh-lamp" style="animation-delay:${(i % 3) * 1.4}s">
      <rect x="${x0 + i * (w + gap)}" y="62" width="${w}" height="60" rx="2"
        fill="#e8c98a" opacity=".82" stroke="#7a6234"/>
      <path d="M${x0 + i * (w + gap) + w / 2} 62 v60 M${x0 + i * (w + gap)} 92 h${w}" stroke="#7a6234" stroke-width="1.1" opacity=".8"/>
    </g>`).join('')}
    <!-- porch -->
    <rect x="${x0 - 26}" y="146" width="${total + 52}" height="6" fill="#0f0d0a"/>
  </svg>`;
}

/**
 * The board: what the jury currently thinks of everybody still playing.
 *
 * The chips are labels — LOCKED, LEANING, TOSS-UP — because a raw signed float
 * is not something an audience reads, and because the labels are what the
 * engine treats as narrative anyway. The arrow tells you which way tonight
 * moved it, which is the only part of this that is actually news.
 */
function board(record, showAfter, esc, avatar) {
  const before = record.readsBefore || {};
  const after = record.reads || {};
  const source = showAfter ? after : before;
  const jurors = record.residents || [];
  const players = [...new Set(Object.values(source).flatMap(r => Object.keys(r || {})))];
  if (!jurors.length || !players.length) {
    return `<div class="bbjh-board"><div class="bbjh-sealed">The room has not said anything yet.</div></div>`;
  }
  const label = v => v >= 3.5 ? 'locked' : v >= 1.2 ? 'leaning' : v <= -3.5 ? 'hostile'
    : v <= -1.2 ? 'cooling' : 'toss-up';
  return `<div class="bbjh-board">
    <div class="bbjh-bh"><span>The board — how the jury reads the house</span>
      <b>${showAfter ? 'AFTER TONIGHT' : 'BEFORE TONIGHT'}</b></div>
    ${jurors.map(j => `<div class="bbjh-row">
      <span class="bbjh-who">${avatar(j, 22)}${esc(j)}</span>
      <span class="bbjh-reads">${players.map(p => {
    const now = Number(source[j]?.[p]) || 0;
    const was = Number(before[j]?.[p]) || 0;
    const moved = showAfter ? now - was : 0;
    const dir = moved > 0.12 ? 'up' : moved < -0.12 ? 'dn' : '';
    return `<span class="bbjh-chip ${dir}"><i></i>${esc(p)} <s>${label(now)}</s></span>`;
  }).join('')}</span>
    </div>`).join('')}
  </div>`;
}

/**
 * A week in the jury house.
 *
 * Arrival weeks are one act and full weeks are four; the screen does not care
 * which — it walks whatever acts the engine produced and puts the roundtable in
 * its own furniture when it finds one.
 */
export function rpBuildBBJuryHouse(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc || (v => String(v ?? ''));
  const avatar = deps.avatar || (() => '');
  const stateKey = _key(ep, `jh${act.week || 0}`);
  const state = _init(stateKey);

  // One step per beat, plus one per person argued over at the roundtable.
  const steps = [];
  for (const a of act.acts || []) {
    for (const b of a.beats || []) steps.push({ kind: 'beat', title: a.title, b });
    for (const line of a.roundtable?.lines || []) steps.push({ kind: 'table', title: a.title, line });
  }
  if (!steps.length) return '';
  const total = steps.length;
  const firstTable = steps.findIndex(s => s.kind === 'table');
  // The board turns over the moment the argument that moved it has been heard.
  const showAfter = firstTable < 0 ? state.idx >= total - 1 : state.idx >= firstTable;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'table') {
      const l = step.line;
      return `<div class="bbns-card is-open bbjh-table">
        <div class="bbjh-tname">${avatar(l.player, 26)}${esc(l.player)}</div>
        <div class="bbjh-side for"><span class="bbjh-tag">For</span>
          <p>${_faces([l.backer])}${esc(l.backText)}</p></div>
        <div class="bbjh-side against"><span class="bbjh-tag">Against</span>
          <p>${_faces([l.doubter])}${esc(l.doubtText)}</p></div>
      </div>`;
    }
    return _card(step.b.tag || step.title || 'THE LODGE', esc(step.b.text),
      step.b.tag === 'GRUDGE' ? 'red'
        : step.b.tag === 'CONFIRMED' || step.b.tag === 'CORRECTED' ? 'blue'
          : step.b.tag === 'WORKING THE ROOM' ? 'grey' : 'gold',
      '', step.b.players || []);
  };

  return _shell({
    ep, stateKey, total,
    title: 'The Jury House',
    sub: act.full
      ? `${(act.residents || []).length} out there · the roundtable`
      : `${(act.residents || []).length} out there · a new arrival`,
    cls: 'bbjh', css: JH_CSS,
    stage: `<div class="bbjh-stage">${lodge(act.residents || [])}${board(act, showAfter, esc, avatar)}</div>`,
    cards: steps.map(card).join(''),
    firstLabel: 'Open the door',
  });
}
