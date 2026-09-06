// ══════════════════════════════════════════════════════════════════════
// dr/rules.js — the predicates every challenge module shares
// ══════════════════════════════════════════════════════════════════════
//
// A LEAF, on purpose. `js/dr/prep.js` needs these and so does every module in
// `js/dr/chal/`, and prep.js is itself imported by the generic module — so
// putting them anywhere else makes an import cycle. Cycles in ES modules
// sometimes work and sometimes hand you an undefined function at load time
// depending on which file was reached first, which is not a thing to leave
// lying around under a simulator that runs for a season before anybody looks.
//
// THE ARCHETYPE LAW LIVES HERE AND NOWHERE ELSE. It is one rule; a module
// writing its own copy of it is how a hero comes to sabotage a sewing machine.

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAINOUS = new Set(['villain', 'mastermind', 'schemer']);

/**
 * May this queen sabotage, steal or scheme?
 *
 * Villains always; nice archetypes never; the neutral ones only when they are
 * both calculating and disloyal enough to have decided to be.
 */
export function canScheme(player) {
  const a = player?.archetype;
  if (VILLAINOUS.has(a)) return true;
  if (NICE.has(a)) return false;
  const s = player?.stats || {};
  return (Number(s.strategic) || 0) >= 6 && (Number(s.loyalty) ?? 10) <= 4;
}

/** Anybody can help. A function so no module tests an archetype itself. */
export function canHelp() { return true; }

/**
 * Build an event.
 *
 * AN EVENT THAT CHANGES NOTHING IS NOT AN EVENT. `applyEvents` throws on one,
 * so this shape exists to make that obvious at every call site: if you cannot
 * name a bond, a popularity number or a state flag it moves, what you have is
 * a sentence, and sentences belong in Plan 3's pools.
 */
export function evt(type, { players = [], bond = [], pop = {}, state = {}, data = {} } = {}) {
  return { type, players, bond, pop, state, data };
}

/** The craft a challenge leans on hardest — who counts as a pro at it. */
export function heaviestStat(maxi) {
  return Object.entries(maxi.blend).sort((a, b) => b[1] - a[1])[0][0];
}
