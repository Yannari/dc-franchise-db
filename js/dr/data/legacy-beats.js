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

/* ── THE CAMPAIGN, IN THIS ERA'S WORDS ───────────────────────────────
   The save's campaign pools are reused for the legacy night's lobbying —
   pitch, pushback, answer, all the same moves — but a handful of them are
   written for a mechanic that does not run here. There is no save and no
   song for the bottom: she is asking not to be SENT HOME, and "one bad night
   shouldn't send me to the lip sync" describes a stage she will never stand
   on.

   Found by dumping a season and reading it, which is where every prose defect
   on this show has come from. Keyed by the same ids, so anything without an
   entry falls through to SAVE_BEATS unchanged.
   `{a}` is the queen pitching, `{b}` the queen she is working, `{c}` a rival,
   `{n}` her wins. */
export const LEGACY_CAMPAIGN = {
  'pitch-record': [
    '"I have {n} on my record," {a} says. "One bad night should not end my season."',
    '"Look at what I have done here," {a} says. "All of it, against one bad runway."',
  ],
  'pitch-no-threat': [
    '"Keep me and you keep the easiest queen in the room," {a} tells {b}. "Think about it."',
    '{a} makes the cold case. "I am not the one who beats you. You know which one is."',
  ],
  'pitch-friend': [
    '"We came in together," {a} says to {b}. "Do not make tonight the night that stops mattering."',
    '{a} does not make a case. She just stands next to {b} and lets the friendship do it.',
  ],
  'pitch-deserve': [
    '"I was the best of those three tonight and everybody in this room knows it," {a} says.',
    '"If you are keeping whoever did the best work," {a} says, "then this is not a hard one."',
  ],
  'pitch-my-turn': [
    '"You have held this before," {a} says to {b}. "You have never once held it over me."',
    '"Everybody in that bottom has had a break except me," {a} says.',
  ],
  promise: [
    '{a} leans in. "Keep me tonight and I will hand you this exact moment back."',
    '"You keep me," {a} says quietly to {b}, "and you have somebody in this room. That is worth more than the win."',
  ],
  'rebut-threat': [
    '{c} leans over. "You keep {a}, you are keeping the queen who beats you in the finale."',
    '"She is asking you to walk her to the crown," {c} says. "Politely."',
  ],
  'rebut-record': [
    '"{a} has a record," {c} says. "That is the reason to end her, not the reason to keep her."',
    '"Her résumé is the argument against her," {c} says. "Think about who you are sitting beside at the end."',
  ],
  'debt-called': [
    '"I have carried you twice," {a} says to {b}. "I am asking once."',
    '{a} does not raise her voice. "You owe me this, and you know exactly what for."',
  ],
};

/** One line, names filled. */
export function legacyLine(pool, vars = {}, rng = Math.random) {
  const list = Array.isArray(pool) ? pool : [];
  if (!list.length) return '';
  const line = list[Math.floor(rng() * list.length) % list.length];
  return String(line).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}
