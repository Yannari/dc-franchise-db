// The proportional half of the coaches twist: awe, agendas, and who gets a
// session. Pure functions with no gs access, so they can be tested to death
// without a game — which matters, because this is the part that needs tuning.
//
// EVERY TABLE HERE IS A BIAS, NEVER AN ASSIGNMENT. Archetype leans; the stats
// decide how far. Two coaches sharing an archetype must not behave the same.

/** How receptive each archetype is to fame. Negative reads it as a threat. */
const AWE_BIAS = {
  goat: 1.0, 'loyal-soldier': 0.9, underdog: 0.85,
  'social-butterfly': 0.6, showmancer: 0.6, floater: 0.55, hothead: 0.5, wildcard: 0.5,
  'challenge-beast': 0.25, 'chaos-agent': 0.25,
  hero: 0.5,
  // A résumé, not a hero. The same gap that makes a goat deferential makes
  // these four target him sooner.
  mastermind: -0.8, schemer: -0.7, villain: -0.7, 'perceptive-player': -0.9,
};

/**
 * How impressed one contestant is by one coach.
 *
 * Positive is deference, negative is "I know exactly what that record means".
 * The three stat terms do most of the work, so a goat with strategic 8 is much
 * harder to impress than a goat with strategic 2, and a mastermind with
 * intuition 2 can be caught looking up to somebody in spite of himself.
 */
export function aweOf({ gap, stats, archetype }) {
  if (!gap) return 0;
  const bias = AWE_BIAS[archetype] ?? 0.5;
  return gap * bias
    * ((10 - stats.strategic) / 10)
    * ((10 - stats.boldness) / 10)
    * ((10 - stats.intuition) / 10);
}
