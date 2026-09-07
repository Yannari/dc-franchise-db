// ══════════════════════════════════════════════════════════════════════
// dr/data/maxi-events.js — the moments a challenge actually produces
// ══════════════════════════════════════════════════════════════════════
//
// ── WHAT THIS FIXES ───────────────────────────────────────────────────
//
// The challenge modules already decide everything. A girl group really does
// split into teams, draft a part per queen, write a verse and produce a queen
// who takes the front at everybody else's expense. Snatch Game really does
// draft characters and run six rounds in which somebody dies on the panel.
//
// And every one of those modules emits its scenes with DATA and no text. So
// the mechanics were per-challenge and the episode read the same either way —
// a Snatch Game and a Rusical produced identical prose, because the narration
// came from a generic performance tier that did not know which night it was.
//
// This is the prose for the specific moments. It is the half of the gap that
// matters most: "she died on the panel" and "she took the front and the team
// paid for it" are what make a challenge memorable, far more than a graded
// description of how well she did.
//
// ── THE SCHEMA ────────────────────────────────────────────────────────
//
//   id       the event type the engine fires, exactly as spelled there
//   from     which challenge it comes out of, for the writer's context
//   cast     'solo' | 'pair'
//   note     what actually happened, and what it cost
//   lines    the prose. {a} is the queen it is about, {b} the other one.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Same rules as every other pool, all enforced by tests: never a real name,
// never {b} in a solo event, this show's vocabulary only, no stat quoted by
// number, four genuinely different variants each, prose rather than captions.
//
// THE REGISTER. These are the beats a fan would clip. Write them like the
// thing everybody will be talking about afterwards — specific, physical, and
// with the consequence visible in the writing rather than stated.

const e = o => ({ cast: 'solo', lines: [], ...o });

export const MAXI_EVENTS = [
  // ══ SNATCH GAME ══════════════════════════════════════════════════════
  e({
    id: 'dying', from: 'snatch-game', cast: 'solo',
    note: 'Three answers in a row landed on silence. She is still in the chair with four questions to go and nowhere to hide.',
    lines: [
      "The third one dies the way the first two died — she delivers it, she waits, and the room gives her nothing at all. There are four questions left. She cannot leave the chair, she cannot drop the character, and she has to sit there being someone she can no longer make funny while everybody watches her decide whether to keep trying.",
      "It is not that the jokes are bad. It is that the character has stopped existing somewhere around the second question and what is left is {a} in a wig, answering as herself, hoping the host moves on quickly. The host does not move on quickly. The host has never moved on quickly in his life.",
      "You can watch the exact moment {a} realises it is not coming back. Her timing goes first, then her voice drops out of the character, and by the fourth answer she is doing the thing where you laugh at your own line to tell the room it was a line. Nobody joins in.",
      "Silence, three times, in a format built entirely out of not being silent. {a} keeps going because there is no version of this where she stops, and the going is the painful part — every answer smaller than the last, delivered to a panel that has started being kind, which is worse than anything they could say.",
    ],
  }),
  e({
    id: 'double-act', from: 'snatch-game', cast: 'pair',
    note: 'Two queens sitting next to each other start building on each other and the whole taping lifts for both.',
    lines: [
      "It starts as an accident — {b} answers something and {a} reacts in character, and the reaction is funnier than the answer. Then they do it again. By the fourth question they have invented a relationship that is not in anybody's notes, and the host has stopped asking questions and started just letting them go.",
      "{a} and {b} find each other about ten minutes in and after that the taping belongs to them. Every answer either sets the other one up or knocks her down, and the room gets the specific delight of watching two people discover mid-performance that they are a double act.",
      "Nobody plans this. {b} throws something out, {a} catches it and throws it back harder, and the two characters start talking to each other instead of to the host. It is the best material of the night and neither of them wrote a word of it.",
      "The best thing in the taping is not a joke, it is a look — {a} turning to {b} after something ridiculous with an expression that says *are you hearing this*. The room screams. They do it four more times and it works four more times.",
    ],
  }),

  // ══ THE BALL ═════════════════════════════════════════════════════════
  e({
    id: 'wardrobe-malfunction', from: 'ball', cast: 'solo',
    note: 'The look she built is coming apart, and there is no time left to fix it.',
  }),
  e({
    id: 'showstopper', from: 'ball', cast: 'solo',
    note: 'What she built out of the fabric on the wall is genuinely extraordinary, and the room knows before it walks.',
  }),

  // ══ GIRL GROUP, RUMIX, MUSIC VIDEO ═══════════════════════════════════
  e({
    id: 'spotlight-hog', from: 'girl-group', cast: 'pair',
    note: '{a} takes the front of the number for herself. It works for her and every queen behind her pays for it.',
    lines: [
      "It is subtle enough to be deniable and obvious enough that everybody sees it. {a} drifts half a step forward on every formation, so by the final chorus she is not in the line, she is in front of it, and four queens are choreographed into being her backing. She says she did not plan it. She did it four times.",
      "\"Can I just — sorry — can I take this bit?\" It is phrased as a question the first time. By the third time it is not phrased at all, {a} simply takes the bit, and the queen it belonged to stands there holding a verse she is no longer singing.",
      "{a} decides somewhere in rehearsal that this is her number, and once she has decided it the rest of the team is furniture. Every adjustment she suggests moves her forward. Every note she gives somebody else moves them back. It is a masterclass, and it is going to cost her.",
      "The number is good. It is good because {a} is very good and she is at the front of all of it, and the queens behind her know exactly how that happened. Nobody says anything in the rehearsal room. Everybody says something afterwards.",
    ],
  }),
  e({
    id: 'carried', from: 'girl-group', cast: 'pair',
    note: '{b} is out of her depth and {a} covers for her all the way through. The room can see both halves of that.',
  }),
  e({
    id: 'bad-verse', from: 'girl-group', cast: 'solo',
    note: 'What she wrote does not work, and she has to perform it anyway.',
  }),
  e({
    id: 'verse-of-the-week', from: 'girl-group', cast: 'solo',
    note: 'She wrote the line everybody will repeat afterwards.',
  }),
  e({
    id: 'booth', from: 'girl-group', cast: 'solo',
    note: 'The recording booth, where either she can sing or the room finds out she cannot.',
  }),

  // ══ THE RUSICAL ══════════════════════════════════════════════════════
  e({
    id: 'live-vocal', from: 'rusical', cast: 'solo',
    note: 'She chose to sing it live rather than lip sync to the recording. The biggest voluntary risk in a maxi challenge.',
  }),
  e({
    id: 'invisible', from: 'rusical', cast: 'solo',
    note: 'She is in the ensemble and she disappears into it. The note the panel gives is that they did not see her.',
  }),

  // ══ THE MAKEOVER ═════════════════════════════════════════════════════
  e({
    id: 'dressed-herself-better', from: 'makeover', cast: 'solo',
    note: 'Her own look is far better than the one she built for her partner, and on this night that is a loss rather than a flex.',
  }),
  e({
    id: 'reunion', from: 'makeover', cast: 'pair',
    note: 'Her makeover partner is a queen who went home earlier this season, and they were close.',
  }),

  // ══ THE ROAST AND STAND-UP ═══════════════════════════════════════════
  e({
    id: 'bombed', from: 'roast', cast: 'solo',
    note: 'All three of her bits died. She is on stage with a microphone and a room that has stopped helping.',
  }),
  e({
    id: 'roasted-the-panel', from: 'roast', cast: 'solo',
    note: 'She turned on the judges themselves and had the material to get away with it.',
    lines: [
      "She has been building to it the whole set and the room does not see it coming until she turns, very slowly, and addresses the panel directly. There is a half-second where it could go either way. Then the joke lands, and the judges are laughing at themselves, and {a} has done the single most dangerous thing available to her and walked away with it.",
      "Everybody roasts each other. {a} roasts the people holding the clipboards. The first one gets a gasp. The second gets a scream. By the third the panel has given up pretending to be above it and one of them is wiping an eye, and every queen backstage is realising they played it too safe.",
      "The material about the other queens is fine. The material about the judges is a different event entirely — sharper, riskier, and delivered with the specific confidence of somebody who has decided that being remembered is worth more than being liked. The room agrees with her.",
      "\"And finally,\" says {a}, and turns to face the panel, and the temperature in the room changes. What follows is not gentle. It is also extremely funny, and the difference between those two facts is the only reason she is not in serious trouble.",
    ],
  }),
  e({
    id: 'stole-a-bit', from: 'roast', cast: 'pair',
    note: '{a} heard {b} workshopping something better than anything she has, and used the angle herself.',
  }),

  // ══ THE TALENT SHOW ══════════════════════════════════════════════════
  e({
    id: 'stunt-landed', from: 'talent-show', cast: 'solo',
    note: 'She went for something genuinely dangerous and landed it.',
  }),
  e({
    id: 'stunt-failed', from: 'talent-show', cast: 'solo',
    note: 'She went for it and it did not work, in front of everybody.',
  }),
  e({
    id: 'wrong-talent', from: 'talent-show', cast: 'solo',
    note: 'Not a failure of execution — she chose an act she was never going to be able to do.',
  }),

  // ══ THE BRACKET ══════════════════════════════════════════════════════
  e({
    id: 'assassin', from: 'lalaparuza', cast: 'solo',
    note: 'Three lip syncs won in one night. The room has learned something about her.',
  }),
  e({
    id: 'picked-on', from: 'lalaparuza', cast: 'pair',
    note: 'More than one queen named her as the one they wanted to face. She heard all of it.',
  }),

  // ══ THE DESIGN FAMILY ════════════════════════════════════════════════
  e({
    id: 'glue-gun', from: 'design', cast: 'solo',
    note: 'A burn, mid-build, and she keeps working.',
  }),

  // ══ THE WERK ROOM, UNDER ANY CHALLENGE ═══════════════════════════════
  e({
    id: 'help', from: 'prep', cast: 'pair',
    note: '{a} is strong at tonight\'s craft and spends her own time on {b}, who is not.',
  }),
  e({
    id: 'sabotage', from: 'prep', cast: 'pair',
    note: '{a} quietly makes {b} worse at the thing she is about to be judged on.',
  }),
  e({
    id: 'shunned', from: 'prep', cast: 'solo',
    note: 'The room is helping each other and nobody is helping her. An event, not an absence.',
  }),
  e({
    id: 'walkthrough', from: 'prep', cast: 'solo',
    note: 'The host walks the room and gives her a note. Whether she hears it and whether she acts on it are two different things.',
  }),

  // ══ THE HAND-OUT ═════════════════════════════════════════════════════
  e({
    id: 'contest', from: 'assign', cast: 'pair',
    note: 'Both of them wanted the same character, part or material. {a} got it because she picked first.',
  }),
  e({
    id: 'dump', from: 'assign', cast: 'pair',
    note: '{a} is a captain and makes sure {b} ends up on the other team. The room notices.',
  }),

  // ══ THE MINI ═════════════════════════════════════════════════════════
  e({
    id: 'read-landed', from: 'mini', cast: 'pair',
    note: '{a} read {b} and it was genuinely brutal and genuinely funny.',
  }),
  e({
    id: 'read-missed', from: 'mini', cast: 'pair',
    note: '{a} went for {b} and it did not land, which is worse than not going.',
  }),
  e({
    id: 'pulled-the-punch', from: 'mini', cast: 'pair',
    note: '{a} had something on {b} and would not use it, because they are close. {b} notices.',
  }),
  e({
    id: 'did-her-proud', from: 'mini', cast: 'pair',
    note: 'They styled each other and both of them look good because of it.',
  }),
  e({
    id: 'did-her-dirty', from: 'mini', cast: 'pair',
    note: 'They styled each other and neither of them is going to let it go.',
  }),
];

export const MAXI_EVENT_IDS = MAXI_EVENTS.map(x => x.id);

export function unwrittenMaxiEvents() {
  return MAXI_EVENTS.filter(x => !x.lines || x.lines.length < 4).map(x => x.id);
}
