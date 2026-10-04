// ══════════════════════════════════════════════════════════════════════
// bb/nightmare-power.js — the ceremony is over, and then it is not
// ══════════════════════════════════════════════════════════════════════
//
// BB21's Nightmare Power, and the first thing in this engine that can UNDO a
// ceremony that has already happened. From the wiki:
//
//   "After the Head of Household makes their nominations, the winner would be
//    able to activate the power to nullify the nominations and wake everyone
//    up in the middle of the night and force the Head of Household to name two
//    new nominees on the spot. This power lasts for the first six nomination
//    ceremonies."
//
// ── WHAT CANON DOES NOT SAY, AND THE CALLS MADE HERE ───────────────────
//
// It was never used on the broadcast. Ovi Kabir won it and was evicted still
// holding it, so every detail below the wiki's two sentences is a decision
// rather than a reconstruction, and they are written down as decisions:
//
//   THE ORIGINAL TWO ARE SAFE FROM THE REDO. "Two NEW nominees" is the only
//   phrase in the rule that constrains the second ceremony at all, and a redo
//   that could seat the same people would make the power a no-op in the exact
//   case somebody would spend it — you play this to get your own name off a
//   board, and a re-run that can put it straight back is worth nothing.
//
//   THE HOLDER IS NEVER NAMED. Whacktivity winners are told in private and the
//   house is told nothing, so the USE is loud (everybody is woken up, the wall
//   changes) and the HAND is not. That is the same shape the Coin of Destiny
//   already runs, and it reuses the same machinery — the house is left with a
//   rewritten block, a list of everybody who was in that room three weeks ago,
//   and no way to tell which of them did it.
//
//   THE HEAD OF HOUSEHOLD STILL CHOOSES. The power does not take the pen, it
//   takes the PAGE: the nominations are voided and the same person has to write
//   two different names, in the middle of the night, in front of everybody,
//   with no time to plan and their first two choices off the table. It is the
//   only power here that makes the Head of Household do their own job twice.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { getPerceivedBond, addBond } from '../bonds.js';
import { nominationScore } from './strategy.js';
import { clamp } from '../bb-comps/_shared.js';

// Beats are plain facts with a `part`; the words are written by
// bb/script/ceremony.js from lines/nmact.js. The holder is in none of them.
const beat = (text, players, badgeText, badgeClass = 'gold', part = null) =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass, ...(part ? { part } : {}) });

/**
 * Whether the holder spends it on this ceremony.
 *
 * A READ, like every other power on this shelf — the holder cannot see the
 * plan, only the wall. Which makes this one unusually clean to model, because
 * by the time it can be played the nominations have ALREADY HAPPENED: there is
 * nothing to read. Either your name is up there or it is not.
 *
 * So the decision is almost entirely "am I on the block", with an expiring
 * window pushing a holder to spend it on somebody else's week rather than
 * carry it into the seventh ceremony where it dies. Saving an ally is real but
 * much rarer — it costs you the only power you have for somebody else's
 * problem, and the house never even learns you did it.
 */
export function nightmarePull(holder, { nominees = [], weeksLeft = 0, rng = Math.random } = {}) {
  const st = pStats(holder) || {};
  if (nominees.includes(holder)) {
    // Your name is on the wall and this takes it off. Nearly always.
    return clamp(0.93 - (st.temperament ?? 5) * 0.01, 0.7, 0.97);
  }
  // Somebody you would spend a power to protect.
  let closest = 0;
  for (const n of nominees) {
    let b = 0;
    try { b = getPerceivedBond(holder, n); } catch { b = 0; }
    closest = Math.max(closest, b);
  }
  const ally = clamp((closest - 4) / 6, 0, 1) * 0.45;
  // The last ceremony it exists for. Burning it on a week that does not need
  // it buys nothing, but it costs nothing either — nobody knows you had it.
  const dying = weeksLeft <= 0 ? 0.35 : 0;
  const nerve = ((st.boldness ?? 5) / 10) * 0.12;
  return clamp(ally + dying + nerve, 0.02, 0.9);
}

/**
 * Void the ceremony and make the Head of Household do it again.
 *
 * @param {object} opts
 * @param {string[]} opts.nominees the two who were just nominated
 * @param {string[]} opts.untouchable anybody who cannot be seated at all
 * @returns {object|null} `{ nominees, act }` — the NEW two, or null when the
 *   house cannot field two fresh names, in which case the ceremony stands.
 */
export function runNightmarePower({ week, house, hoh, holder, nominees = [],
  untouchable = [], rng = Math.random } = {}) {
  const room = (house || []).filter(Boolean);
  // ── THE ORIGINAL TWO ARE OFF THE TABLE, AND SO IS THE HEAD OF HOUSEHOLD ──
  //
  // The holder is NOT excluded. They are not safe — they bought a redo, not
  // immunity, and a holder who takes their own name down and watches it go
  // back up is a better outcome than a power that quietly protects them. It
  // simply cannot happen on the same night, because the original two are the
  // ones barred.
  const blocked = [hoh, ...nominees, ...untouchable].filter(Boolean);
  const pool = room.filter(n => !blocked.includes(n));
  // Two FRESH names or nothing. A house that cannot field them keeps the
  // ceremony it already had — the same rule the veto uses when no legal
  // replacement exists, rather than a new one invented here.
  if (pool.length < 2) return null;

  const named = [...pool]
    .map(name => ({ name, score: nominationScore(hoh, name, rng) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(x => x.name);

  // Three draws, where the three beats' wording used to be picked.
  rng(); rng(); rng();
  const beats = [
    beat('The house is woken in the middle of the night and called to the living room.', [hoh], 'THREE IN THE MORNING', 'red', 'woken'),
    beat(`The nominations are void: ${nominees[0]} and ${nominees[1]} are safe.`, [...nominees], 'NOMINATIONS VOID', 'gold', 'voided'),
    beat(`${hoh} must nominate again, and names ${named[0]} and ${named[1]}.`, [hoh, ...named], 'AND AGAIN', 'red', 'redone'),
  ];

  // ── WHAT IT COSTS, AND WHO PAYS ──
  //
  // The two new nominees are angry at the only person in the room who said
  // their names out loud, which is the Head of Household — who did not choose
  // to be standing there. That misdirection is the point of the power and the
  // reason it is worth having: it spends somebody else's credibility.
  for (const name of named) {
    try { addBond(name, hoh, -1.5); } catch { /* no bond, no grievance */ }
  }
  // And the two who came down owe nobody, because nobody will admit to it.
  for (const name of nominees) {
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[name] = (gs.popularity[name] || 0) + 1;
  }
  beats.push(beat(`${named[0]} and ${named[1]} blame ${hoh}, who did not choose to nominate again.`,
    [named[0], hoh, named[1]], 'THE WRONG PERSON IS BLAMED', 'red', 'blamed'));

  return {
    nominees: named,
    act: {
      type: 'nightmare-power',
      week: week?.num || 0,
      secret: true,
      hoh: hoh || null,
      holder,                       // stored, never rendered
      voided: [...nominees],
      nominees: [...named],
      beats,
    },
  };
}
