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

/* THE SUITE. A door you may walk through once in a season, and a rope with a
   pass on it for every houseguest who still could. The drama is the rope: you
   can see at a glance who has already spent theirs and can never come back. */
.bbss-room{position:relative;max-width:600px;margin:0 auto 20px;padding:22px 18px 18px;
  border-radius:12px;overflow:hidden;
  background:radial-gradient(120% 80% at 50% -8%,rgba(134,239,172,.10),rgba(4,10,8,.96) 60%);
  border:1px solid rgba(134,239,172,.22);box-shadow:inset 0 0 60px rgba(0,0,0,.7)}
.bbss-room::after{content:'';position:absolute;left:50%;top:0;width:190px;height:150px;
  transform:translateX(-50%);pointer-events:none;
  background:radial-gradient(ellipse at top,rgba(134,239,172,.18),transparent 70%)}
.bbss-door{display:block;width:100%;max-width:190px;height:auto;margin:0 auto 6px;position:relative;z-index:1}
.bbss-clock{font-size:9px;letter-spacing:1.4px;font-family:var(--font-mono,monospace)}

/* the two who walk out safe, chained together */
.bbss-safe{display:flex;align-items:center;justify-content:center;gap:12px;margin:12px 0 4px;
  position:relative;z-index:1}
.bbss-safe .bbss-who{text-align:center;width:92px}
.bbss-medal{position:relative;width:66px;height:66px;margin:0 auto;border-radius:50%;
  overflow:hidden;border:2px solid #4ade80;
  box-shadow:0 0 0 3px rgba(74,222,128,.16),0 0 26px -4px rgba(74,222,128,.9);
  animation:bbss-glow 2.8s ease-in-out infinite}
.bbss-medal img,.bbss-medal .bb-av,.bbss-medal .rp-portrait{width:100%;height:100%;object-fit:cover}
@keyframes bbss-glow{0%,100%{box-shadow:0 0 0 3px rgba(74,222,128,.14),0 0 20px -6px rgba(74,222,128,.7)}
  50%{box-shadow:0 0 0 4px rgba(74,222,128,.24),0 0 34px 0 rgba(74,222,128,1)}}
.bbss-link{width:26px;height:2px;background:repeating-linear-gradient(90deg,#4ade80 0 5px,transparent 5px 9px);
  opacity:.75;flex:none}
.bbss-role{font-family:var(--font-mono,ui-monospace,monospace);font-size:8px;letter-spacing:1.3px;
  color:#4ade80;margin-top:5px}
.bbss-nm{font-size:11px;color:#e6edf3;font-weight:600;margin-top:3px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbss-pun{display:block;font-family:var(--font-mono,monospace);font-size:8px;letter-spacing:.8px;
  color:#fbbf24;margin-top:3px}

/* the rope: one pass per houseguest, struck when it is gone for good */
.bbss-rope{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px;
  position:relative;z-index:1}
.bbss-pass{width:52px;text-align:center;opacity:.95}
.bbss-face{position:relative;width:40px;height:40px;margin:0 auto;border-radius:4px;overflow:hidden;
  border:1px solid rgba(134,239,172,.45);background:#0b1a12}
.bbss-face img,.bbss-face .bb-av,.bbss-face .rp-portrait{width:100%;height:100%;object-fit:cover}
.bbss-pass.is-spent{opacity:.4}
.bbss-pass.is-spent .bbss-face{filter:grayscale(1);border-style:dashed;border-color:rgba(139,148,158,.35)}
.bbss-pass.is-spent .bbss-face::after{content:'';position:absolute;left:-4px;right:-4px;top:50%;
  height:1.5px;background:#8b949e;transform:rotate(-24deg)}
.bbss-tag{font-size:8.5px;color:#86efac;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbss-pass.is-spent .bbss-tag{color:#64748b}
.bbss-legend{text-align:center;font-size:9px;letter-spacing:1.2px;color:#64748b;margin-top:12px}
@media(prefers-reduced-motion:reduce){.bbss-medal{animation:none}}
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
  const AV = (n, px) => (typeof deps.avatar === 'function' ? deps.avatar(n, px) : '');

  const DOOR = `<svg class="bbss-door" viewBox="0 0 180 132" role="img"
      aria-label="The Safety Suite door">
    <rect x="16" y="8" width="148" height="116" rx="6" fill="rgba(18,30,24,.92)" stroke="#2f4f3c" stroke-width="1.6"/>
    <rect x="28" y="20" width="124" height="72" rx="4" fill="rgba(134,239,172,.05)" stroke="#2f4f3c" stroke-width="1.2"/>
    <path d="M90 20 v72" stroke="#2f4f3c" stroke-width="1.6"/>
    <circle cx="81" cy="58" r="2.6" fill="#4ade80"/><circle cx="99" cy="58" r="2.6" fill="#4ade80"/>
    <rect x="60" y="99" width="60" height="7" rx="2" fill="none" stroke="#2f4f3c" stroke-width="1.2"/>
    <text class="bbss-clock" x="90" y="119" text-anchor="middle" style="fill:${clockCol}">${clock}</text>
  </svg>`;

  // The two who walk out of it safe, and the chain between them. A plus-one is
  // not a second winner — they are safe BECAUSE somebody chose them, and they
  // pay a punishment for it, so the medal carries the price underneath.
  const SAFE = (run && act.winner) ? `<div class="bbss-safe">
      <div class="bbss-who">
        <div class="bbss-medal">${AV(act.winner, 66)}</div>
        <div class="bbss-role">BEAT THE CLOCK</div>
        <div class="bbss-nm">${esc(act.winner)}</div>
      </div>
      ${act.plusOne ? `<span class="bbss-link"></span>
      <div class="bbss-who">
        <div class="bbss-medal">${AV(act.plusOne, 66)}</div>
        <div class="bbss-role">PLUS ONE</div>
        <div class="bbss-nm">${esc(act.plusOne)}</div>
        ${act.punishment ? `<span class="bbss-pun">${esc(act.punishment)}</span>` : ''}
      </div>` : ''}
    </div>` : '';

  // The rope. Every houseguest who could still walk through that door, and
  // every one who never can again — which is the fact this twist is actually
  // about, and it was a list of struck-through words.
  const ROPE = `<div class="bbss-rope">${roster.map(n => `
    <div class="bbss-pass ${spent.has(n) ? 'is-spent' : ''}" title="${esc(n)}">
      <div class="bbss-face">${AV(n, 40)}</div>
      <div class="bbss-tag">${esc(n)}</div>
    </div>`).join('')}</div>
    <div class="bbss-legend">STRUCK THROUGH = NO ENTRY LEFT, FOR THE REST OF THE SEASON</div>`;

  const ROOM = `<div class="bbss-room">${DOOR}${SAFE}${ROPE}</div>`;

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
         who has nothing left to buy their way out with.`, 'gold', 'is-final',
        [act.winner, act.plusOne]);
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbss', css: SS_CSS,
    title: 'THE SAFETY SUITE',
    sub: 'One entry per houseguest. For the whole season.',
    stage: ROOM,
    cards: steps.map(card).join(''),
    firstLabel: 'The offer',
  });
}
