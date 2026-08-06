// ══════════════════════════════════════════════════════════════════════
// bb/eviction-powers.js — the Halting Hex
// ══════════════════════════════════════════════════════════════════════
//
// BB19, and the power Jessica Graf took out of the Den of Temptation. It
// cancels one of the next four evictions outright: the votes are read out and
// then thrown away, and nobody goes home.
//
// The rule people misremember is that it is not protection. It stops the
// NIGHT, not the nomination — everybody on that block is a legal nominee again
// the following week with the Hex already spent, which is why using it early
// on somebody else is a much bigger decision than it looks.
//
// It resolves before anybody is removed from the roster, because the whole
// power is that the removal does not happen.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { activePowersAt, usePower } from './powers.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: players.filter(Boolean), badgeText, badgeClass });

/**
 * Does the Hex get played tonight?
 *
 * Nobody spends a power to save a stranger. The holder plays it when the
 * person about to leave is THEM or somebody they need, and the pressure rises
 * as the window closes — an unspent Hex on its last night is worth nothing at
 * all, which is the only reason a marginal save ever gets made.
 *
 * @returns {object|null} the act, or null when the night proceeds
 */
export function resolveHaltingHex({ week, evicted, nominees = [], hoh, rng = Math.random }) {
  if (!evicted) return null;
  const [inst] = activePowersAt('eviction-night', week.num, 'halting-hex');
  if (!inst) return null;
  const holder = inst.holder;
  if (!(gs.activePlayers || []).includes(holder)) return null;

  const st = pStats(holder);
  const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
  const lastWeek = week.num >= inst.expiresAfterWeek;

  // Saving yourself is not a decision. Saving somebody else is.
  let pull;
  if (evicted === holder) pull = 1;
  else {
    const worth = Math.max(0, bond(holder, evicted)) * 0.085;
    // Spending it is loud: the whole house learns a power existed and that
    // the person holding it was willing to burn it on somebody else.
    const exposure = 0.05 * Math.max(0.5, (10 - (st.boldness || 5)) / 5);
    pull = worth + (lastWeek ? 0.22 : 0) - exposure;
  }
  if (rng() >= Math.min(0.92, pull)) return null;

  usePower(inst, week.num);
  inst.revealed = true;
  const p = pronouns(holder);
  const selfSave = evicted === holder;
  const beats = [beat(
    selfSave
      ? `The vote is read out and ${evicted} is leaving. ${evicted} does not stand up. `
        + `${p.Sub} ${p.sub === 'they' ? 'produce' : 'produces'} the Hex instead, and the eviction stops where it is.`
      : `The vote is read out and ${evicted} is leaving — and then ${holder} stops the night. `
        + `Nobody is going home. ${holder} has just told this entire house that ${p.sub} `
        + `${p.sub === 'they' ? 'were' : 'was'} holding something, and spent it on somebody else.`,
    // Deduped: on a self-save the holder and the person leaving are the same
    // houseguest, and the card drew their face twice side by side.
    [...new Set([holder, evicted])], 'THE EVICTION IS CANCELLED', 'gold'),
  beat(
    `${nominees.filter(Boolean).join(' and ')} come off the block by default. Every vote cast tonight `
      + 'is now a matter of public record and no consequence, which is its own problem for the people who cast them.',
    nominees.filter(Boolean), 'THE VOTES STAND, THE RESULT DOES NOT', 'grey')];

  return {
    type: 'halting-hex', week: week.num, holder, spared: evicted,
    selfSave, nominees: [...nominees].filter(Boolean), hoh: hoh || null,
    beats,
  };
}
