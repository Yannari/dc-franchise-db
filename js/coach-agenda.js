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

/** Which way each archetype leans. Multiplied against stats, never consulted alone. */
const AGENDA_BIAS = {
  mastermind:          { control: 1.0, win: 0.5, support: 0.2, survive: 0.4, disrupt: 0.2 },
  schemer:             { control: 0.95, win: 0.4, support: 0.2, survive: 0.5, disrupt: 0.3 },
  villain:             { control: 0.9, win: 0.4, support: 0.1, survive: 0.4, disrupt: 0.5 },
  'challenge-beast':   { control: 0.3, win: 1.0, support: 0.4, survive: 0.3, disrupt: 0.2 },
  hero:                { control: 0.3, win: 0.6, support: 1.0, survive: 0.3, disrupt: 0.1 },
  'loyal-soldier':     { control: 0.2, win: 0.5, support: 1.0, survive: 0.4, disrupt: 0.1 },
  'social-butterfly':  { control: 0.4, win: 0.3, support: 0.9, survive: 0.4, disrupt: 0.2 },
  showmancer:          { control: 0.3, win: 0.3, support: 0.9, survive: 0.4, disrupt: 0.3 },
  goat:                { control: 0.1, win: 0.2, support: 0.5, survive: 1.0, disrupt: 0.2 },
  floater:             { control: 0.2, win: 0.3, support: 0.5, survive: 0.9, disrupt: 0.3 },
  underdog:            { control: 0.3, win: 0.4, support: 0.6, survive: 0.9, disrupt: 0.2 },
  'chaos-agent':       { control: 0.3, win: 0.2, support: 0.2, survive: 0.3, disrupt: 1.0 },
  hothead:             { control: 0.3, win: 0.5, support: 0.3, survive: 0.3, disrupt: 0.9 },
  wildcard:            { control: 0.3, win: 0.3, support: 0.3, survive: 0.3, disrupt: 0.9 },
  'perceptive-player': { control: 0.7, win: 0.4, support: 0.5, survive: 0.6, disrupt: 0.2 },
};

const DEFAULT_BIAS = { control: 0.4, win: 0.4, support: 0.4, survive: 0.4, disrupt: 0.4 };

/**
 * The five things a coach can spend influence on, all at once.
 *
 * `vulnerability` is 0..1 — how close this coach is to being voted out. It
 * lifts `survive` for everybody, which is why any coach drifts toward
 * self-preservation as the vote nears, whatever they came in wanting.
 */
export function agendaMix({ stats, archetype, vulnerability = 0 }) {
  const b = AGENDA_BIAS[archetype] || DEFAULT_BIAS;
  return {
    control: (stats.strategic / 10) * ((10 - stats.loyalty) / 10) * b.control,
    support: (stats.loyalty / 10) * (stats.social / 10) * b.support,
    win:     (stats.mental / 10) * (stats.intuition / 10) * b.win,
    survive: Math.min(1, vulnerability) * b.survive,
    disrupt: (stats.boldness / 10) * ((10 - stats.temperament) / 10) * b.disrupt,
  };
}

export function dominantAgenda(mix) {
  return Object.entries(mix).sort((a, b) => b[1] - a[1])[0][0];
}
