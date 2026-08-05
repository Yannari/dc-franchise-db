// ══════════════════════════════════════════════════════════════════════
// vp-bb-safety-suite.js — the board everybody is keeping in their head
// ══════════════════════════════════════════════════════════════════════
//
// The only twist in this catalogue whose material is arithmetic, so the screen
// is a scoreboard: every houseguest, and the ones who have spent their entry
// struck through for the rest of the season.
//
// That board is the thing the house is actually playing off by week three, and
// it is the one piece of state no other twist screen here carries — a fact
// about the SEASON rather than about the week. Everything else on this screen
// is in service of it.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const SS_CSS = `
.bbss-title{font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#86efac;text-shadow:0 0 18px rgba(134,239,172,.25);margin-bottom:4px}
.bbss-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}
.bbss-stage{max-width:520px;margin:0 auto 18px}
.bbss-door{display:block;width:100%;max-width:240px;height:auto;margin:0 auto 14px}
.bbss-clock{font-size:9px;letter-spacing:1.4px;font-family:var(--font-mono,monospace)}
.bbss-board{display:flex;flex-wrap:wrap;gap:5px;justify-content:center}
.bbss-pass{font-size:10.5px;letter-spacing:.5px;padding:3px 9px;border-radius:3px;border:1px solid rgba(134,239,172,.4);color:#86efac;background:rgba(134,239,172,.07)}
.bbss-pass.is-spent{opacity:.45;text-decoration:line-through;border-style:dashed;color:#8b949e;border-color:rgba(139,148,158,.3);background:none}
.bbss-legend{text-align:center;font-size:9px;letter-spacing:1.2px;color:#64748b;margin-top:10px}
`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `safety-suite` act
 * @param {object} deps {tvState, reveal, esc} from vp-screens.js
 */
export function rpBuildBBSafetySuite(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'ss');
  const state = _init(stateKey);
  const beats = act.beats || [];
  // Framing first, then the engine's play-by-play, then the board. Putting the
  // summary cards up front announced the winner and THEN narrated people
  // walking in to compete, which is the result spoiling its own scene.
  const steps = [{ kind: 'offer' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'board' }];
  const total = steps.length;
  const run = state.idx >= total - 1;

  // Entering spends the entry whether or not it wins, so anybody who walked in
  // this week joins the struck list — but only once the offer has been
  // revealed. Ungated, the board struck their names through before the viewer
  // had been told anybody swiped, which gave the week away on arrival.
  // Houseguests who ran out in EARLIER weeks are struck from the start: that is
  // public history, not this week's news.
  const spent = new Set([...(act.exhausted || []),
    ...(state.idx >= 0 ? (act.entrants || []) : [])]);
  const roster = [...new Set([...(act.entrants || []), ...(act.held || []),
    ...(act.exhausted || [])])];

  const clock = run ? (act.winner ? 'CLOCK BEATEN' : 'CLOCK WINS') : 'ONE ENTRY EACH';
  const clockCol = run ? (act.winner ? '#4ade80' : '#f87171') : '#4ade80';
  const DOOR = `<svg class="bbss-door" viewBox="0 0 180 132" role="img"
      aria-label="The Safety Suite door">
    <rect x="16" y="8" width="148" height="116" rx="6" fill="rgba(18,30,24,.92)" stroke="#2f4f3c" stroke-width="1.6"/>
    <rect x="28" y="20" width="124" height="72" rx="4" fill="rgba(134,239,172,.05)" stroke="#2f4f3c" stroke-width="1.2"/>
    <path d="M90 20 v72" stroke="#2f4f3c" stroke-width="1.6"/>
    <circle cx="81" cy="58" r="2.6" fill="#4ade80"/><circle cx="99" cy="58" r="2.6" fill="#4ade80"/>
    <rect x="60" y="99" width="60" height="7" rx="2" fill="none" stroke="#2f4f3c" stroke-width="1.2"/>
    <text class="bbss-clock" x="90" y="119" text-anchor="middle" style="fill:${clockCol}">${clock}</text>
  </svg>`;

  const BOARD = `<div class="bbss-board">${roster.map(n =>
    `<span class="bbss-pass ${spent.has(n) ? 'is-spent' : ''}">${esc(n)}</span>`).join('')}</div>
    <div class="bbss-legend">STRUCK THROUGH = NO ENTRY LEFT, FOR THE REST OF THE SEASON</div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'offer') {
      return _card('ONE ENTRY, ONE SEASON',
        `The suite is open for an hour. Anybody except the Head of Household may walk in, once, for the
         entire season — and then never again.
         <br><br>Spending it is a public statement that you do not believe you can survive an ordinary
         week. Holding it is a bet that a worse one is coming and that you will still have this when it
         does. Nobody gets a second.`, 'gold');
    }
    if (step.kind === 'board') {
      if (!act.winner) {
        return _card('THE CLOCK WINS',
          act.solo
            ? `The lone entrant had nobody to beat and still did not beat the clock. No safety, no entry
               left, and an empty room to have done it in — the worst outcome this twist has.`
            : 'Nobody beats the clock. Every one of those entries is spent, and not one of them is safe.',
          'red', 'is-final');
      }
      return _card('AND THE BOARD, AFTER',
        `${esc(act.winner)} is safe${act.plusOne
    ? `, and so is ${esc(act.plusOne)} — at the price of ${esc(act.punishmentLabel || 'a punishment')}`
    : ''}.
         <br><br>${(act.entrants || []).length
    ? `${esc((act.entrants || []).join(', '))} will never be able to do this again. `
    : ''}That list is the thing the house is really playing off by week three: everybody knows exactly
         who has nothing left to buy their way out with.`, 'gold', 'is-final');
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbss', css: SS_CSS,
    title: 'THE SAFETY SUITE',
    sub: 'One entry per houseguest. For the whole season.',
    stage: `<div class="bbss-stage">${DOOR}${BOARD}</div>`,
    cards: steps.map(card).join(''),
    firstLabel: 'The offer',
  });
}
