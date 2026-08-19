// Pronouns, from a gender alone.
//
// The simulator's `pronouns()` lives in js/players.js, which imports core.js and
// therefore the whole engine — so nothing outside the sim could ask, and the
// life layer wrote every sentence in singular they. "Brick left their job" and
// "Cody changed their hair" over characters whose gender is on the roster: 25
// of 170 canon events, on wiki pages and Dramagram captions.
//
// Same rule, same shape, no dependencies. players.js delegates to it rather
// than keeping a second copy, exactly as it does for js/attraction.js.
//
// `nb` and unknown both give they/them. They are not the same thing — one is a
// fact about somebody and the other is a gap in the roster — but they produce
// the same sentence, and the alternative is guessing.

const SETS = {
  m: { sub: 'he', obj: 'him', pos: 'his', posAdj: 'his', ref: 'himself', Sub: 'He', Obj: 'Him', PosAdj: 'His' },
  f: { sub: 'she', obj: 'her', pos: 'hers', posAdj: 'her', ref: 'herself', Sub: 'She', Obj: 'Her', PosAdj: 'Her' },
  nb: { sub: 'they', obj: 'them', pos: 'theirs', posAdj: 'their', ref: 'themselves', Sub: 'They', Obj: 'Them', PosAdj: 'Their' },
};

/** Pronouns for a gender: 'm', 'f', or anything else. */
export function pronounsOf(gender) {
  return SETS[gender] || SETS.nb;
}

/**
 * Whether a verb should agree in the singular.
 *
 * "They were expecting" against "she was expecting" — the pronoun is only half
 * of it, and a sentence that gets the pronoun right and the verb wrong reads
 * worse than one that was in they/them all along.
 */
export function agrees(gender, singular, plural) {
  return gender === 'm' || gender === 'f' ? singular : plural;
}
