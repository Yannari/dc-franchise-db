// ══════════════════════════════════════════════════════════════════════
// dr/data/legacy-beats.js — the lipstick ceremony's lines
// ══════════════════════════════════════════════════════════════════════
//
// Its own file rather than js/dr/data/stage-beats.js, which is already ~1100
// lines with a guard suite walking all of it: a ritual only one season shape
// runs should be separable from the ones every season runs.
//
// `{h}` is the queen holding the lipstick, `{x}` the queen she names, `{p}`
// the bottom she chose out of. Names are filled at render time — never write
// one into a pool.
export const LEGACY_BEATS = {
  /* SHE GOES BACKSTAGE ALONE. Keyed by the reason js/dr/legacy.js actually
     returned, so the deliberation cannot argue for a different decision from
     the one the night recorded. */
  deliberate: {
    threat: [
      '{h} turns the two tubes over in her hands. One of these names is the only queen down there who could take this from her.',
      'Backstage, {h} is not thinking about tonight. She is thinking about the four weeks after it.',
      '{h} lines the lipsticks up on the counter and looks at them the way you look at a bill you have to pay.',
    ],
    panel: [
      '{h} does not have to think for long. The panel said who the weakest of them was, out loud, twenty minutes ago.',
      '{h} weighs the tubes and finds the choice already made for her: the room ranked them, and she agrees with the room.',
      '"I’m not going to pretend this is hard," {h} says to the mirror. "They told us."',
    ],
    grudge: [
      '{h} has waited a long time to hold one of these with {x}’s name on the other end of it.',
      'Backstage, {h} is very calm, and that is the part that should worry {x}.',
      '{h} picks one up without looking at the other.',
    ],
  },
  /* THE WALK BACK OUT, AND THE TUBE TURNED AROUND. */
  reveal: [
    '{h} walks back out with the lipstick closed in her fist, holds it up, and turns it around. It says {x}.',
    'The tube turns. {x}.',
    '{h} lets the room look at the back of her hand a moment longer than it needs, then shows it: {x}.',
    '{h} holds it out at arm’s length, and the name on it is {x}.',
  ],
  /* HOW THE ROOM TAKES IT. Nobody sang, so there is nothing to blame but her. */
  roomAnswer: [
    'Nobody moves. There was no song to lose, so there is nothing to say about it.',
    'A sound goes through the room that is not quite a gasp — the bottom knew one of them was going and none of them knew which.',
    '{x} nods, once, like she had already worked it out.',
    'Somebody down the line breathes out. It carries.',
  ],
  /* HER LAST WORDS, AND WHY THEY ARE NOT `sashay-words`.
     That pool is written for a queen who just lip synced for her life and
     lost it. This queen performed nothing: she stood in a line and somebody
     else chose. It is a different exit and it needs its own voice. */
  lastWords: [
    '"I didn’t get to fight for it," {x} says. "That’s the part I’ll be chewing on."',
    '"{h} played it exactly the way I’d have played it," {x} says, and almost means it.',
    '"No song, no chance, no hard feelings," {x} says. Two of those are true.',
    '"I came back to prove something and I got sent home by somebody’s strategy," {x} says. "Put that on the poster."',
    '"She had to pick somebody," {x} says, with a shrug that costs her something.',
  ],
};

/** One line, names filled. */
export function legacyLine(pool, vars = {}, rng = Math.random) {
  const list = Array.isArray(pool) ? pool : [];
  if (!list.length) return '';
  const line = list[Math.floor(rng() * list.length) % list.length];
  return String(line).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}
