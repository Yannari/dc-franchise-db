// ══════════════════════════════════════════════════════════════════════
// bb/bonus-life.js — the second chance nobody spent
// ══════════════════════════════════════════════════════════════════════
//
// The Bonus Life was BB20's strangest power app, and the reason it is worth
// simulating is that it is the only one whose most likely outcome is nothing
// at all. Sam Bledsoe held it for four weeks, never used it, watched the fuse
// run out, watched it go off on somebody she had not chosen — and watched
// that person lose the competition and leave anyway. The power did exactly
// what it promised and changed nothing.
//
// So this is not a return mechanic with a decision bolted on. It is a
// DECISION mechanic that sometimes opens a door:
//
//   1. Every eviction night the power is live, the holder decides whether to
//      spend it on the person who just walked. Spending it on somebody else
//      is charity; sitting on it is greed; and both are readable.
//   2. If the window closes unspent, it fires ANYWAY on that night's evictee,
//      whoever that is. The holder does not get to opt out of their own power,
//      which is the rule that makes hoarding it a gamble rather than a wait.
//   3. Whoever it lands on gets ONE competition, alone, against a standard
//      rather than against a field. Losing sends them home for good.
//
// The competition is deliberately losable. The canonical one was failed, and a
// return that always lands would make the four weeks of agonising pointless.
//
// Reuses applyReturn from battle-back.js: a reversed eviction is a reversed
// eviction however it was won, and the grudge ledger it writes — the returnee
// arriving knowing exactly whose ballots had their name on — is most of the
// value of putting anybody back in the house at all.

import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond } from '../bonds.js';
import { aptitude, clamp } from '../bb-comps/_shared.js';
import { applyReturn } from './battle-back.js';
import { BB_POWER_DEFINITIONS, activePowersAt, usePower } from './powers.js';
import { allyStake } from './shared-strategy.js';

/** What the re-entry competition asks of somebody. Broad on purpose. */
const REENTRY_MIX = Object.freeze({ endurance: 0.32, mental: 0.26, physical: 0.22, temperament: 0.2 });

/**
 * How good you have to be. Tuned so a middling houseguest is around a coin
 * flip and a strong one is a clear favourite without ever being safe — the
 * aired one was failed outright, and a door that always opens is not a door.
 */
const REENTRY_STANDARD = 5.9;

// Beats are plain facts with a `part`; the words are written by
// bb/script/ceremony.js from lines/blact.js (and lines/bkact.js for the return).
const beat = (text, players, badgeText, badgeClass = 'twist', part = null, extra = {}) =>
  ({ type: 'bonus-life', text, players: [...players].filter(Boolean), badgeText, badgeClass, ...(part ? { part } : {}), ...extra });

const noise = (rng, amt = 2.5) => (rng() - 0.5) * amt * 2;
const round2 = v => Math.round(v * 100) / 100;

/**
 * Does the holder spend it on tonight's evictee?
 *
 * Proportional, never gated. Saving your own skin is automatic; saving
 * somebody else is bought with how much you actually value them, how boldly
 * you play, and how close the fuse is to going off on a stranger — a holder
 * running out of window would rather aim it than have it aimed for them.
 */
function spendRead(instance, evicted, week, rng) {
  const holder = instance.holder;
  if (evicted === holder) return { spend: true, reason: 'self' };

  const hst = pStats(holder);
  const bond = getPerceivedBond(holder, evicted);
  const lastChance = week >= instance.expiresAfterWeek;

  // `bond * 0.075` and nothing else, so an alliance the holder had sworn to
  // bought its members no chance at all: the Life went to whoever the holder
  // happened to like, and the group they had built their game on was worth the
  // same as a pleasant stranger. allyStake counts the alliance, and counts it
  // biggest.
  const stake = (() => { try { return allyStake(holder, evicted); } catch { return 0; } })();
  const pull = stake
    + hst.loyalty * 0.018
    + hst.boldness * 0.012
    + (lastChance ? 0.22 : 0)
    - Math.max(0, -bond) * 0.05;

  return { spend: rng() < clamp(pull, 0, 0.9), reason: 'ally', bond: round2(bond) };
}

/**
 * Resolve the Bonus Life for tonight's eviction. Returns an act, or null when
 * there is nothing live to resolve.
 *
 * Called AFTER the eviction is on the books, for the same reason the battle
 * back is: the person it saves is the person who just lost the vote.
 */
export function resolveBonusLife({ week, evicted, rng = Math.random } = {}) {
  if (!evicted) return null;
  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  const live = activePowersAt('eviction-night', weekNum, 'bonus-life');
  if (!live.length) return null;

  const instance = live[0];
  const def = BB_POWER_DEFINITIONS['bonus-life'];
  const holder = instance.holder;
  const say = () => rng();   // each beat's wording used to be one draw here; the draw stays
  const beats = [];

  const read = spendRead(instance, evicted, weekNum, rng);
  const expiring = weekNum >= instance.expiresAfterWeek;
  // The fuse. An unspent power at the end of its window fires itself rather
  // than being binned — canonical, and the only reason hoarding it has a cost.
  const auto = !read.spend && expiring && def.autoFiresAtExpiry;

  if (!read.spend && !auto) {
    // Nothing happens, and the fact that nothing happened is the beat. The
    // holder is secret, so this act is for the Debug panel and the viewer.
    return {
      type: 'bonus-life', week: weekNum, fired: false, hoarded: true,
      holder, evicted, secret: instance.visibility !== 'public',
      beats: [(say(), beat(`${holder} keeps the Bonus Life and lets ${evicted} go.`, [holder, evicted], 'NOT PLAYED', 'grey', 'hoard'))],
    };
  }

  const beneficiary = read.spend ? evicted : evicted;
  usePower(instance, weekNum);
  instance.revealed = true;
  instance.beneficiary = beneficiary;

  if (auto) {
    say();
    beats.push(beat(`The unused Bonus Life goes off on ${beneficiary}.`, [beneficiary, holder], 'FUSE RUNS OUT', 'gold', 'auto'));
  } else if (read.reason === 'self') {
    say();
    beats.push(beat(`${holder} plays the Bonus Life on themselves.`, [holder], 'BONUS LIFE', 'gold', 'self'));
  } else {
    say();
    beats.push(beat(`${holder} plays the Bonus Life on ${beneficiary}.`, [holder, beneficiary], 'BONUS LIFE', 'gold', 'ally'));
  }

  // ── One competition, alone, against a standard ──
  const score = round2(aptitude(beneficiary, REENTRY_MIX) + noise(rng, 2.6));
  const won = score >= REENTRY_STANDARD;
  beats.push(beat(`${beneficiary} plays the re-entry competition alone and scores ${score} against ${REENTRY_STANDARD}.`,
    [beneficiary], 'RE-ENTRY', 'challenge', 'reentry', { score, standard: REENTRY_STANDARD }));

  const act = {
    type: 'bonus-life', week: weekNum, fired: true, hoarded: false,
    holder, beneficiary, evicted, auto,
    self: read.reason === 'self' && !auto,
    secret: instance.visibility !== 'public',
    competition: { score, standard: REENTRY_STANDARD, won },
    returned: won ? beneficiary : null,
    beats,
  };

  if (won) {
    say();
    beats.push(beat(`${beneficiary} beats the standard.`, [beneficiary], 'RE-ENTRY WON', 'gold', 'won'));
    applyReturn(beneficiary, act, weekNum);
    gs.bb ||= {};
    (gs.bb.returns || []).forEach(r => { if (r.name === beneficiary && r.week === weekNum) r.style = 'bonus-life'; });
  } else {
    say();
    beats.push(beat(`${beneficiary} misses the standard.`, [beneficiary], 'RE-ENTRY LOST', 'red', 'lost'));
    // The holder wore this in public if the power was public, and the house
    // remembers a big swing that missed either way it was spent.
    if (!act.self && holder && (gs.activePlayers || []).includes(holder)) {
      gs.popularity ||= {};
      gs.popularity[holder] = (gs.popularity[holder] || 0) + (act.auto ? 0 : 1);
    }
  }

  return act;
}
