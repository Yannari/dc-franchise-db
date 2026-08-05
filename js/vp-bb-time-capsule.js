// ══════════════════════════════════════════════════════════════════════
// vp-bb-time-capsule.js — a door, and two things on the other side of it
// ══════════════════════════════════════════════════════════════════════
//
// The Care Package screen is a delivery: a crate comes down, a label gets a
// name on it, everybody watches. This one is the opposite shape and has to
// look it — a sealed door the favourite walks through alone, with the house
// left outside unable to see what is being asked of them.
//
// So the stage is a hatch with a status light, and the light is the whole
// screen: amber while they are in there, green if they come out holding
// something, red if they come out wearing it. The viewer learns which; the
// house only ever learns that the capsule was beaten or was not.
//
// The punishment card is the one that matters. It says what the costume COSTS
// rather than what it looks like, because the costume is a number subtracted
// from every pitch they make for a week and the screen should say so plainly.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const TC_CSS = `
.bbtc-title{font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#c4b5fd;text-shadow:0 0 18px rgba(196,181,253,.3);margin-bottom:4px}
.bbtc-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}
.bbtc-stage{max-width:430px;margin:0 auto 18px}
.bbtc-hatch{display:block;width:100%;max-width:280px;height:auto;margin:0 auto}
.bbtc-lamp{animation:bbtc-pulse 1.8s ease-in-out infinite}
@keyframes bbtc-pulse{0%,100%{opacity:.35}50%{opacity:1}}
.bbtc-stencil{font-size:8.5px;letter-spacing:1.6px;font-family:var(--font-mono,monospace)}
.bbtc-name{font-family:var(--font-display);font-size:15px;letter-spacing:1.4px;fill:#e6edf3}
@media(prefers-reduced-motion:reduce){.bbtc-lamp{animation:none;opacity:1}}
`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `time-capsule` act
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBTimeCapsule(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'tc');
  const state = _init(stateKey);
  const beats = act.beats || [];
  // Framing, then the play-by-play, then what it actually costs — the same
  // order the other twist screens settled on.
  const steps = [{ kind: 'vote' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'cost' }];
  const total = steps.length;
  const opened = state.idx >= total - 1;

  const lamp = opened ? (act.won ? '#4ade80' : '#f87171') : '#f0a500';
  const status = opened ? (act.won ? 'BEATEN' : 'NOT BEATEN') : 'OCCUPIED';
  const HATCH = `<svg class="bbtc-hatch" viewBox="0 0 220 190" role="img"
      aria-label="The Time Capsule hatch">
    <rect x="14" y="10" width="192" height="170" rx="10" fill="rgba(24,20,40,.95)" stroke="#4c3f7a" stroke-width="1.8"/>
    <rect x="30" y="26" width="160" height="120" rx="8" fill="rgba(196,181,253,.05)" stroke="#4c3f7a" stroke-width="1.4"/>
    <circle cx="110" cy="86" r="42" fill="none" stroke="#4c3f7a" stroke-width="2.2"/>
    <circle cx="110" cy="86" r="30" fill="rgba(196,181,253,.06)" stroke="#4c3f7a" stroke-width="1"/>
    <path d="M110 44 v12 M110 116 v12 M68 86 h12 M140 86 h12" stroke="#4c3f7a" stroke-width="2.4" stroke-linecap="round"/>
    <text class="bbtc-name" x="110" y="92" text-anchor="middle">${esc(act.favourite || '')}</text>
    <text class="bbtc-stencil" x="110" y="140" text-anchor="middle" style="fill:#6b5fa8">ONE TRIP EACH</text>
    <circle class="${opened ? '' : 'bbtc-lamp'}" cx="76" cy="163" r="5" fill="${lamp}"/>
    <text class="bbtc-stencil" x="90" y="167" style="fill:${lamp}">${status}</text>
  </svg>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'vote') {
      return _card('THE VOTE IS NOT A GIFT',
        `The audience votes one houseguest in, and that is where the generosity stops. Whoever they
         choose goes through that door alone to attempt a challenge nobody outside the room can see.
         <br><br>Beat it and they come out holding a power from a past season. Fail it and they come out
         wearing a punishment from one — and the house is only ever told which of those happened, never
         what it was.`, 'gold', '', [act.favourite]);
    }
    if (step.kind === 'beat') return _beatCard(step.b);
    // What the week actually costs, which is the point of the whole twist.
    if (act.won) {
      return _card('WHAT THE HOUSE KNOWS',
        `${esc(act.favourite)} beat it, and is holding ${esc(act.power || 'something')}.
         <br><br>You know that. The house does not. All they were told is that somebody the country likes
         went into a room and came out of it better off, which is enough to start counting — and not
         nearly enough to act on.`, 'gold', 'is-final', [act.favourite]);
    }
    return _card('WHAT IT ACTUALLY COSTS',
      `${esc(act.favourite)} is in ${esc(act.punishment || 'a costume')} for the week.
       <br><br>This is not scenery. It comes off every pitch they make until it comes off them — every
       attempt to recruit a vote, every campaign from the block — so the week the country picked them as
       its favourite is also the week they are least able to play.
       ${act.tetheredTo ? `<br><br>${esc(act.tetheredTo)} is attached to them throughout, and never
         did anything to deserve it.` : ''}`,
      'red', 'is-final', [act.favourite, act.tetheredTo]);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbtc', css: TC_CSS,
    title: 'THE BB TIME CAPSULE',
    sub: 'America picks who goes in. The room decides what comes out.',
    stage: `<div class="bbtc-stage">${HATCH}</div>`,
    cards: steps.map(card).join(''),
    firstLabel: 'The vote',
  });
}
