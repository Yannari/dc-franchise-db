// ══════════════════════════════════════════════════════════════════════
// bb/rewind.js — the Rewind
// ══════════════════════════════════════════════════════════════════════
//
// BB16. A gold button in the have-not room with nothing written on it; they
// pressed it, a timer appeared, and nobody knew what they had done until the
// eviction stopped mid-vote and the week was rewound — the block cleared, the
// crown gone, and the two houseguests who had spent three days sitting there
// free to play for the next Head of Household.
//
// It is not the Halting Hex with a bigger name. The Hex stops the NIGHT and
// leaves the week standing: the block empties, the Head of Household keeps
// their reign, and next week proceeds with them barred from competing as
// usual. This erases the WEEK. The reign goes with it, which is the part that
// actually changes a season — the person who built that block starts the next
// one from the same line as the people they put on it.
//
// THE VOTES ARE READ FIRST, and that is the price rather than the theatre.
// Every ballot becomes public knowledge — including the holder's — with every
// person who was betrayed still in the house and now eligible to win. There is
// no quiet way to use this, and a holder who flipped this week is spending the
// power to publish their own name.
import { gs } from '../core.js';
import { addBond, getPerceivedBond } from '../bonds.js';
import { pStats, pronouns } from '../players.js';
import { BB_POWER_DEFINITIONS, usePower, spendPull } from './powers.js';
import { allyStake, rememberBBStrategy, setBBTarget } from './shared-strategy.js';
import { learnBBVote } from './knowledge.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...new Set((players || []).filter(Boolean))], badgeText, badgeClass });

const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
const stake = (a, b) => { try { return allyStake(a, b); } catch { return 0; } };

/** The one live Rewind, or null. */
function liveRewind(week) {
  for (const inst of gs.bb?.powers || []) {
    if (inst.used || inst.disposed) continue;
    if (week > inst.expiresAfterWeek) continue;
    if (BB_POWER_DEFINITIONS[inst.powerId]?.rules?.rewindWeek) return inst;
  }
  return null;
}

/**
 * How exposed the holder is by their own ballot.
 *
 * The decision nothing else on the shelf has to make. Reading the votes out
 * publishes the holder too, so somebody who spent this week voting against
 * their own alliance is buying a rewind with their reputation — and the more
 * they had to lose by it, the less they want to press it.
 *
 * @returns 0..1, how much their own vote costs them
 */
export function selfExposure(holder, ballots = []) {
  const mine = ballots.find(b => b?.voter === holder);
  if (!mine?.voted) return 0;
  // Voting out somebody you are sworn to is the thing the room would notice.
  return Math.min(1, stake(holder, mine.voted));
}

/**
 * Does the holder spend it tonight?
 *
 * Being the one leaving is not a dilemma. Everything else is weighed: an ally
 * on the way out, a week that went badly, and — uniquely — what the holder's
 * own ballot says about them once it is read aloud.
 */
export function rewindPull({ holder, evicted, ballots = [], weeksLeft = 0, hoh = null } = {}) {
  const st = pStats(holder) || {};
  const nerve = (st.boldness || 5) / 10;
  const selfSave = evicted === holder;
  let need = selfSave ? 0.99 : Math.min(0.85, stake(holder, evicted));
  // Losing the crown is not free for the holder either: if THEY are the Head of
  // Household, rewinding throws away their own week.
  if (holder === hoh) need *= 0.35;
  // What it costs to have your own ballot read out. Never enough to stop
  // somebody saving their own life — a public flip beats an eviction.
  if (!selfSave) need *= (1 - selfExposure(holder, ballots) * 0.55);
  return spendPull({ need, weeksLeft, nerve });
}

const STOP = [
  (h) => 'The votes have been read. The house is sitting there with the count in the air and '
    + `nobody standing up yet, and then it does not happen. ${h} has stopped the night.`,
  (h) => `Everybody has heard everybody. Chairs are already moving — and then the screen in the `
    + `living room goes gold, and ${h} is holding something nobody knew was in this building.`,
  (h) => `The count is announced. It stands for about four seconds. ${h} spends the biggest thing `
    + 'in the game to make sure it stands for no longer than that.',
];

/**
 * Fire it: void the eviction, erase the reign, publish every ballot.
 *
 * Called at the same seam as the Halting Hex — before anybody is removed from
 * the roster, because the whole power is that the removal does not happen. If
 * the Hex has already stopped the night there is nothing here to stop, and this
 * declines rather than spending itself on an eviction that is not happening.
 *
 * @returns {object|null} the act, or null when the night proceeds
 */
export function resolveRewind({ week, evicted, nominees = [], hoh, house = [],
  ballots = [], rng = Math.random } = {}) {
  if (!evicted) return null;
  const weekNum = Number(week?.num) || 0;
  const inst = liveRewind(weekNum);
  if (!inst) return null;
  const holder = inst.holder;
  if (!(gs.activePlayers || []).includes(holder)) return null;

  const pull = rewindPull({ holder, evicted, ballots, hoh,
    weeksLeft: Math.max(0, inst.expiresAfterWeek - weekNum) });
  if (rng() >= pull) return null;

  usePower(inst, weekNum);
  inst.revealed = true;

  const p = pronouns(holder);
  const beats = [beat(STOP[Math.floor(rng() * STOP.length)](holder),
    [holder, evicted], 'THE NIGHT STOPS', 'gold')];

  // ── the week goes ──
  beats.push(beat(
    `${evicted} does not leave. The block clears, the veto goes back in the box, and ${hoh || 'the Head of Household'} `
      + 'is not Head of Household any more — not deposed, not overruled, simply never crowned. '
      + `Three days of work on a week that no longer exists.`,
    [evicted, hoh], 'THE WEEK IS ERASED', 'red'));
  beats.push(beat(
    `In the morning ${[...nominees].filter(Boolean).join(' and ') || 'everybody'} will play for Head `
      + `of Household, and so will ${hoh || 'the last one'}. Nobody is barred from anything. This `
      + 'house starts the week again from a standing start, except for one thing.',
    [...nominees, hoh], 'EVERYBODY PLAYS', 'blue'));

  // ── AND THE ONE THING: the ballots are public now ──
  //
  // The votes were read before the stop, so this is not a rumour or a read —
  // it is the count, out loud, with every person it names still in the house.
  // `learnBBVote` is the same channel the count already uses; the difference is
  // that it fires for EVERY listener rather than for whoever was paying
  // attention, because there was nothing to pay attention to. It was said.
  const exposed = [];
  for (const b of ballots) {
    if (!b?.voter || !b?.voted) continue;
    for (const listener of house) {
      if (listener === b.voter) continue;
      try { learnBBVote(listener, b.voter, b.voted, weekNum, () => 0); } catch { /* belief store */ }
    }
    // A vote against somebody you were sworn to, with that person still sitting
    // there. This is the whole social payload of the twist.
    const betrayed = stake(b.voter, b.voted);
    if (betrayed >= 0.25) {
      exposed.push({ voter: b.voter, voted: b.voted, weight: betrayed });
      addBond(b.voted, b.voter, -(1.4 + betrayed * 3));
      try { setBBTarget(b.voted, b.voter, 'voted me out where I could hear it', { week: weekNum }); } catch { /* texture */ }
      for (const n of house) {
        if (n === b.voter) continue;
        try { rememberBBStrategy(n, b.voter, 'crossed-an-ally', 1.6 * betrayed, { victim: b.voted, week: weekNum }); } catch { /* texture */ }
      }
    }
  }
  exposed.sort((a, b2) => b2.weight - a.weight);

  if (exposed.length) {
    const worst = exposed[0];
    beats.push(beat(
      `Every ballot in that room was read out before the button landed, and now nobody is going `
        + `home to be angry about it. ${worst.voter} voted to evict ${worst.voted}, who is still `
        + `standing there, and who now knows.`,
      [worst.voter, worst.voted], 'THE COUNT IS PUBLIC', 'red'));
    if (exposed.length > 1) {
      beats.push(beat(
        `${exposed.slice(1, 4).map(e => e.voter).join(', ')} ${exposed.length > 2 ? 'were' : 'was'} `
          + 'named in the same count, out loud, with a week now standing between them and any '
          + 'chance to explain it away.',
        exposed.slice(1, 4).map(e => e.voter), 'AND THE REST OF THEM', 'red'));
    }
  }

  // The holder paid for it in public too, which is the catch.
  const cost = selfExposure(holder, ballots);
  if (cost >= 0.25) {
    const mine = ballots.find(b => b?.voter === holder);
    beats.push(beat(
      `${holder} is in that count as well. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} just spent `
        + `the biggest thing in this game to keep ${evicted} in the house, and published ${p.posAdj} `
        + `own vote against ${mine?.voted} doing it.`,
      [holder, mine?.voted], 'INCLUDING THEIRS', 'red'));
  }

  // Saved, and they know exactly who by.
  if (evicted !== holder) {
    addBond(evicted, holder, 3);
    try { setBBTarget(evicted, hoh, 'put me up in a week that got erased', { week: weekNum }); } catch { /* texture */ }
  }

  return {
    type: 'rewind', week: weekNum, holder, spared: evicted,
    deposed: hoh || null, nominees: [...nominees].filter(Boolean),
    exposed: exposed.map(e => ({ voter: e.voter, voted: e.voted })),
    selfExposed: cost >= 0.25,
    powerId: inst.powerId, name: BB_POWER_DEFINITIONS[inst.powerId]?.name || 'The Rewind',
    visibility: inst.visibility,
    detail: `${holder} rewound the week: ${evicted} stays, the block clears, and ${hoh || 'the Head of Household'} loses the reign.`,
    beats,
  };
}
