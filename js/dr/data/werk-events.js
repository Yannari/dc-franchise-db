// ══════════════════════════════════════════════════════════════════════
// dr/data/werk-events.js — what happens in the room
// ══════════════════════════════════════════════════════════════════════
//
// ── FOR WHOEVER WRITES THE LINES ──────────────────────────────────────
//
// Every event below is fully specified EXCEPT its `lines`. The structure, the
// eligibility and the consequences are settled; what is missing is the prose.
// Fill the `lines` array and change nothing else — the ids and effects are
// referenced by the engine and the tests.
//
// Rules the lines have to keep, all of them enforced by tests:
//
//  1. PLACEHOLDERS. `{a}` is the queen the event is about, `{b}` the other one
//     in a pair event. Never write a name. Never use `{b}` in a solo event —
//     that is how the Traitors pool ended up with half its lines ineligible.
//  2. NO REAL PEOPLE. This universe has no celebrities outside its own shows.
//     No real queens, no real songs' artists, no real cities.
//  3. THE SHOW'S OWN WORDS. She is a `queen`, she `sashays away`, the contest
//     is a `maxi challenge`. Never "houseguest", "castaway", "tribe",
//     "eviction", "immunity" — a vocabulary guard rejects those outright.
//  4. NO STATS BY NAME. "she cannot sew" is right; "her design is 3" is not.
//  5. WRITE THE REGISTER. This is a werk room: shade, camp, warmth, reading
//     each other for filth and then fixing each other's zippers. Funny and
//     bitchy and suddenly sincere. It is not a house of strategists — there is
//     no vote here, so nothing is ever about numbers.
//  6. FOUR VARIANTS MINIMUM per event, and make them genuinely different
//     beats rather than the same sentence reworded.
//
// ── THE SCHEMA ────────────────────────────────────────────────────────
//
//   id       stable, referenced by tests and the transcript
//   slot     which werk room scene it can fill (see SLOTS)
//   cast     'solo' | 'pair'  — how many queens it needs
//   note     what actually happens, for the writer
//   when     eligibility, given `facts`. Deliberately LOOSE: a pool that
//            filters down to three eligible events on a typical night reads
//            worse than a smaller pool that always applies.
//   arcs     families this is TYPICAL of. Not a gate — it raises the weight,
//            so a villain gets villain scenes more often without a hero
//            being barred from a rare bad day.
//   weight   base likelihood before the arc bonus
//   effects  what it changes. NOTHING IS COSMETIC: every event moves a bond,
//            a popularity number or a state flag, and a test refuses one that
//            does not.
//   lines    the prose. `{a}`, `{b}`.
import { dragOf } from '../queen.js';

/** The four werk room scenes in a week. ~45 draws across a season. */
export const SLOTS = ['cold-open', 'werk-morning', 'prep', 'werk-elim-day'];

const ev = o => ({ cast: 'solo', weight: 1, arcs: [], lines: [], ...o });

/** Shorthands for the eligibility tests, so they read as English. */
const d = p => dragOf(p);
const st = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? n : 5;
};
const weakAt = (p, k) => d(p)[k] <= 4;
const strongAt = (p, k) => d(p)[k] >= 7;

export const WERK_EVENTS = [
  // ══ THE ROOM ITSELF: craft, mirrors, machines ════════════════════════
  ev({
    id: 'sewing-rescue', slot: 'prep', cast: 'pair', weight: 2,
    note: '{b} cannot make the garment work and {a} sits down and fixes it for her.',
    arcs: ['hero'],
    when: f => strongAt(f.a, 'design') && weakAt(f.b, 'design') && f.bond >= 0,
    effects: { bond: 1.5, pop: { a: 2 } },
    lines: [
      "{b} has been fighting the same seam for an hour and it is winning. {a} watches for a while, then pulls up a stool without being asked, takes the whole thing out of her hands and starts again from the shoulder. She does not say anything about it. She just does it.",
      "\"Give it to me before you cry on it.\" {a} does not even look up when she says it — she just holds a hand out until {b} puts the garment in it, and then she rebuilds the bodice in the time it took {b} to ruin it.",
      "{b} is close to giving up and everyone in the room can see it. {a} comes over, turns the fabric inside out, finds the problem in about four seconds and says \"okay, this is fixable, sit down.\" It is the first time all day {b} has breathed properly.",
      "Nobody asks {a} to help. She just ends up at {b}'s station with pins in her mouth, doing the thing {b} could not do, and when {b} starts to thank her she waves it off — \"you would do it for me\" — which is generous, because {b} probably could not.",
    ],
  }),
  ev({
    id: 'fabric-hoard', slot: 'prep', cast: 'pair', weight: 1,
    note: '{a} takes more than her share off the fabric wall and {b} notices.',
    arcs: ['villain'], when: f => f.canScheme && f.bond <= 2,
    effects: { bond: -1.5, pop: { a: -2 } },
    lines: [
      "{a} takes four bolts off the wall when everybody else took two, and does it like she is the only person in the room. She is not. {b} counts them from across the table and says nothing, which is louder than saying something.",
      "The fabric wall is supposed to be shared. {a} does not seem to have heard about that, or has heard and has decided she does not care. {b} watches her carry it all back to her station in two trips and makes a note she will keep for later.",
      "\"She took the whole bolt,\" {b} says to nobody in particular, watching {a} lay out enough fabric for three outfits on a station built for one. {a} hears it and does not turn around, which is a choice {b} also files away.",
      "{b} goes to the wall for the stretch velvet and it is gone. All of it. {a} is cutting into it at her station like it was always hers. {b} stands there for a second, looks at the empty hook, looks at {a}, and walks back without a word.",
    ],
  }),
  ev({
    id: 'machine-jam', slot: 'prep', cast: 'solo', weight: 1,
    note: 'Her machine eats the fabric and she loses time she did not have.',
    when: f => !strongAt(f.a, 'design'),
    effects: { pop: { a: 1 }, state: 'lostTime' },
    lines: [
      "The machine eats the chiffon about halfway through the second panel and {a} sits there staring at it like it has personally betrayed her. She pulls it out, the fabric tears, and that is twenty minutes she is not getting back.",
      "{a} hears the sound before she sees it — that awful crunch of the needle hitting something it should not have hit. She lifts the presser foot and the whole thing comes out mangled. She says a word the cameras will have to bleep and starts again from nothing.",
      "The bobbin jams and {a} spends ten minutes trying to fix it with a seam ripper and her fingernails before somebody tells her to just rethread it. By then the damage is done — the skirt is bunched in the middle and she does not have time to cut a new one.",
      "There is a moment where {a} is sewing and then a moment where {a} is holding two pieces of fabric that are no longer attached to each other, and the moment between those two moments was the machine deciding it had done enough for today.",
    ],
  }),
  ev({
    id: 'mirror-check', slot: 'werk-elim-day', cast: 'pair', weight: 2,
    note: 'Two queens getting into drag beside each other, talking to the mirror rather than to each other.',
    when: f => true,
    effects: { bond: 0.5 },
    lines: [
      "{a} and {b} are side by side at the mirrors doing their faces, and the conversation happens the way it does when you are both looking straight ahead. Nobody turns. They talk to each other's reflections about last night, about today, about nothing much. It is the most relaxed either of them has been all week.",
      "They are both contouring and {b} glances over at {a}'s technique and says \"teach me that\" without any ego about it. {a} shows her, they do the same cheekbone at the same time, and for about five minutes it is two queens getting ready, not two queens in a challenge.",
      "{a} catches {b}'s eye in the mirror and pulls a face — the full ugly-cry drag face, chin forward, nostrils wide — and {b} does one back. They go back and forth until one of them breaks, and breaking is laughing so hard the eyeliner goes on crooked.",
      "Neither of them says much. {a} is blending. {b} is gluing down a brow. They pass the setting spray back and forth without asking for it, because they have been beside each other long enough to know the routine. The room is loud behind them but the mirror is quiet.",
    ],
  }),
  ev({
    id: 'borrowed-jewels', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: '{b} lends {a} something for the runway because {a} has nothing that works.',
    arcs: ['hero', 'fashion'], when: f => weakAt(f.a, 'runway') && f.bond >= 2,
    effects: { bond: 1, pop: { b: 1 } },
    lines: [
      "{a} is staring at her accessories like they personally let her down, and {b} crosses the room with a pair of earrings and a necklace and puts them on the table without ceremony. \"Wear these. Give them back tomorrow.\" {a} starts to say she cannot and {b} is already walking away.",
      "\"What are you wearing with that?\" {b} asks, and {a} holds up her only option, and {b}'s face says everything her mouth is too polite to say. She goes to her own case and comes back with a belt and a pair of cuffs that turn {a}'s outfit into something that belongs on the stage.",
      "{b} sees {a} holding two brooches against the neckline and hating both. She comes over, opens her own jewellery roll, and says \"pick one.\" {a} picks the biggest. {b} laughs and says \"I knew you would\" and lets her take it anyway.",
      "{a} has nothing for her neck and the dress needs something for the neck. {b} unclasps her own choker, drops it into {a}'s hand, and says \"do not lose it, it was my grandmother's.\" It was not her grandmother's. They both know that. {a} wears it like it was.",
    ],
  }),
  ev({
    id: 'glue-gun-burn', slot: 'prep', cast: 'solo', weight: 1,
    note: 'She burns herself on the glue gun and keeps going.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} burns two fingers on the glue gun and says \"ow\" in a voice that means it really hurt, and then she blows on them once and goes right back to glueing. The room looks over. She waves the hand. \"I am fine.\" She is not fine. She finishes the headpiece anyway.",
      "The glue gun gets {a} on the thumb and she drops it on the table, which gets glue on the table, which gets glue on the fabric, which gets the word \"no\" said very loudly to an empty room. She peels it off, trims the edge, and keeps going with a blister forming under the tape.",
      "A string of hot glue lands on {a}'s wrist and she does a full silent scream — mouth open, no sound — which is funnier than it should be given that it actually left a mark. She wraps it in a paper towel and does not stop working.",
      "{a} pulls the trigger on the glue gun and it comes out sideways onto her finger. She stares at it hardening on her skin, says \"well that is going to scar,\" and picks up the next rhinestone with the other hand. The outfit has to be finished. The finger will heal.",
    ],
  }),
  ev({
    id: 'padding-panic', slot: 'werk-elim-day', cast: 'solo', weight: 1,
    note: 'Something structural fails while she is getting into it, minutes before the stage.',
    when: f => true, effects: { pop: { a: -1 }, state: 'lostTime' },
  }),
  ev({
    id: 'wig-emergency', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: '{a} styles {b} hair because {b} own plan has collapsed.',
    arcs: ['hero', 'pageant'], when: f => strongAt(f.a, 'runway') && f.bond >= 0,
    effects: { bond: 1, pop: { a: 1 } },
  }),

  // ══ READING, SHADE, THE ROOM'S TEETH ═════════════════════════════════
  ev({
    id: 'reading-for-filth', slot: 'werk-morning', cast: 'pair', weight: 2,
    note: 'Affectionate reading that everybody enjoys, including the one being read.',
    arcs: ['narrator'], when: f => f.bond >= 1 && d(f.a).comedy >= 6,
    effects: { bond: 1, pop: { a: 2 } },
    lines: [
      "{a} has been waiting all morning to use this one and you can tell. She waits until the room is quiet, looks {b} up and down very slowly, and delivers it with the timing of somebody who has done this in a club for ten years. {b} screams. Everybody screams. {b} also does not have a comeback, which is the part she will think about later.",
      "\"I am not going to say anything about that outfit,\" says {a}, and then says three things about the outfit. {b} takes it like a professional — hand on chest, head back, howling — because the alternative is admitting it landed.",
      "It starts as nothing, one comment across the room, and then {a} finds the angle and will not let it go. By the third one {b} is on the floor. By the fifth {b} is saying \"okay, okay, you got me\" through actual tears, and the room has decided {a} is funny, which is worth more than a challenge win some weeks.",
      "{a} reads {b} so precisely that {b}'s first reaction is not to laugh but to say \"how long have you been sitting on that?\" — and the honest answer is since the moment {b} walked in wearing it.",
    ],
  }),
  ev({
    id: 'read-lands-wrong', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'A joke goes too far and the room goes quiet.',
    arcs: ['villain'], when: f => f.bond <= 2,
    effects: { bond: -2, pop: { a: -2 } },
  }),
  ev({
    id: 'shade-behind-back', slot: 'prep', cast: 'pair', weight: 1,
    note: '{a} says something about {b} to the room while {b} is out of it.',
    arcs: ['villain'], when: f => f.canScheme && f.bond <= 0,
    effects: { bond: -1, pop: { a: -1 } },
  }),
  ev({
    id: 'overheard', slot: 'prep', cast: 'pair', weight: 1,
    note: '{b} walks back in on the tail end of it. Nobody says anything.',
    arcs: ['villain'], when: f => f.bond <= -2,
    effects: { bond: -2.5, state: 'frost' },
  }),
  ev({
    id: 'nickname', slot: 'cold-open', cast: 'pair', weight: 1,
    note: '{a} gives {b} a nickname and it sticks for the rest of the season.',
    arcs: ['narrator'], when: f => d(f.a).comedy >= 5,
    effects: { bond: 1, pop: { a: 1, b: 1 } },
  }),
  ev({
    id: 'not-here-to-make-friends', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She says the quiet part out loud and the room recalibrates around her.',
    arcs: ['villain'], when: f => f.canScheme && st(f.a, 'boldness') >= 7,
    effects: { pop: { a: -1 }, state: 'declared' },
  }),

  // ══ THE CHALLENGE, BEFORE AND AFTER ══════════════════════════════════
  ev({
    id: 'idea-theft-accusation', slot: 'prep', cast: 'pair', weight: 1,
    note: '{a} accuses {b} of taking her concept. Whether it is true is left open.',
    arcs: ['villain', 'relationship'], when: f => f.bond <= 1,
    effects: { bond: -2, pop: { a: -1 } },
  }),
  ev({
    id: 'talking-herself-out', slot: 'prep', cast: 'solo', weight: 2,
    note: 'She has an idea, hears herself describe it, and abandons it for something safe.',
    arcs: ['filler', 'weakness'], when: f => st(f.a, 'boldness') <= 5,
    effects: { pop: { a: -1 }, state: 'playedSafe' },
  }),
  ev({
    id: 'doubling-down', slot: 'prep', cast: 'solo', weight: 1,
    note: 'Everyone tells her the concept will not read. She does it anyway.',
    arcs: ['fashion', 'villain'], when: f => st(f.a, 'boldness') >= 7,
    effects: { pop: { a: 2 }, state: 'committed' },
  }),
  ev({
    id: 'rehearsal-collision', slot: 'prep', cast: 'pair', weight: 1,
    // `sameTeam` was in this gate and nothing ever set it, so the scene was
    // written, registered and drawn zero times in thirty seasons. The werk
    // room is drawn before the challenge hands out its teams, so team
    // membership is not a fact this slot can have — the scene is about two
    // queens wanting the same idea, which needs no team at all.
    note: 'Two queens land on the same idea and neither of them will move off it.',
    arcs: ['relationship'], when: f => f.bond <= 3,
    effects: { bond: -1.5, pop: { a: -1 } },
  }),
  ev({
    id: 'coaching-through-it', slot: 'prep', cast: 'pair', weight: 2,
    note: '{a} runs {b} lines or steps until {b} has it.',
    arcs: ['hero'], when: f => f.bond >= 1,
    effects: { bond: 1.5, pop: { a: 1 } },
  }),
  ev({
    id: 'panic-the-night-before', slot: 'prep', cast: 'solo', weight: 1,
    note: 'She is nowhere near finished and the room can see it.',
    when: f => st(f.a, 'temperament') <= 5, effects: { pop: { a: -1 }, state: 'unfinished' },
  }),
  ev({
    id: 'winner-glow', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'Last week she won, and she walks back into the room differently.',
    arcs: ['frontrunner'], when: f => f.lastCall === 'WIN',
    effects: { pop: { a: 1 }, state: 'confident' },
  }),
  ev({
    id: 'target-on-her-back', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'The room has noticed {a} keeps winning, and {b} says so, not entirely kindly.',
    arcs: ['frontrunner'], when: f => f.winsA >= 2,
    effects: { bond: -1, pop: { a: 1 } },
  }),
  ev({
    id: 'safe-again', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'Safe for the fourth time. She is starting to find that worse than being in the bottom.',
    arcs: ['filler', 'weakness'], when: f => f.safesA >= 3,
    effects: { pop: { a: -1 }, state: 'restless' },
  }),
  ev({
    id: 'bottom-hangover', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'She survived the lip sync and has to walk back in and be normal.',
    arcs: ['performance'], when: f => f.lastCall === 'BTM',
    effects: { pop: { a: 1 }, state: 'rattled' },
  }),

  // ══ THE EMOTIONAL REGISTER ═══════════════════════════════════════════
  ev({
    id: 'breakdown', slot: 'prep', cast: 'solo', weight: 1,
    note: 'It all arrives at once and she cannot hold it.',
    arcs: ['narrator', 'representation'], when: f => st(f.a, 'temperament') <= 4,
    effects: { pop: { a: 2 }, state: 'fragile' },
  }),
  ev({
    id: 'comforting', slot: 'prep', cast: 'pair', weight: 2,
    note: '{a} sits down next to {b}, who is not okay, and does not try to fix it.',
    arcs: ['hero'], when: f => f.bond >= 0,
    effects: { bond: 2, pop: { a: 2 } },
    lines: [
      "{b} is crying at her station and pretending she is not, which is somehow worse. {a} does not ask what is wrong. She sits down on the floor next to the chair, close enough that their shoulders touch, and stays there. After a while {b} starts talking. {a} mostly says \"mm\" and \"yeah\" and does not once try to make it better, which is exactly the correct thing to do.",
      "\"Do you want me to talk you out of it or do you want me to sit here?\" {b} says sit here. So {a} sits there, for a long time, and neither of them says anything much, and at the end of it {b} is able to put her face back on.",
      "It is the middle of the afternoon and {b} has gone very quiet, which is louder than crying. {a} clocks it from across the room. She brings over two waters, puts one down, does not mention it, and starts talking about absolutely nothing until {b} laughs — properly, wetly — and says \"I hate you.\" She means thank you.",
      "{a} finds {b} in the corner and does not do the thing where you tell somebody they are strong. She says \"yeah, this is hard, it is supposed to be hard,\" and lets it be true. {b} will remember that longer than she will remember what she was crying about.",
    ],
  }),
  ev({
    id: 'family-story', slot: 'prep', cast: 'pair', weight: 1,
    note: 'She tells the room about home. Not a sad story necessarily — a real one.',
    arcs: ['representation'], when: f => st(f.a, 'loyalty') >= 6,
    effects: { bond: 1.5, pop: { a: 3 } },
  }),
  ev({
    id: 'the-first-time', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She talks about the first time she did drag, and it is not a polished anecdote.',
    arcs: ['representation', 'underdog'], when: f => true,
    effects: { pop: { a: 2 } },
  }),
  ev({
    id: 'imposter', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She says out loud that she does not think she belongs here.',
    arcs: ['underdog'], when: f => st(f.a, 'temperament') <= 6,
    effects: { pop: { a: 1 }, state: 'fragile' },
  }),
  ev({
    id: 'body-talk', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: 'Two queens getting undressed together, talking about their bodies without performing about it.',
    arcs: ['representation'], when: f => f.bond >= 2,
    effects: { bond: 1.5, pop: { a: 1, b: 1 } },
  }),
  ev({
    id: 'apology', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'One of them apologises properly for something from last week.',
    arcs: ['villain', 'relationship'], when: f => f.bond <= -2,
    effects: { bond: 3, pop: { a: 2 }, state: 'mended' },
  }),
  ev({
    id: 'apology-refused', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'The apology is offered and not accepted.',
    arcs: ['relationship'], when: f => f.bond <= -5,
    effects: { bond: -1, pop: { b: -1 }, state: 'frost' },
  }),

  // ══ THE FUNNY ONES ═══════════════════════════════════════════════════
  ev({
    id: 'the-bit', slot: 'werk-morning', cast: 'solo', weight: 2,
    note: 'She starts a bit that runs all day and the whole room joins in.',
    arcs: ['narrator'], when: f => d(f.a).comedy >= 7,
    effects: { pop: { a: 3 }, state: 'roomBit' },
  }),
  ev({
    id: 'impression', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: '{a} does an impression of {b} and it is devastatingly accurate.',
    arcs: ['narrator'], when: f => d(f.a).comedy >= 7,
    effects: { bond: 0.5, pop: { a: 2 } },
  }),
  ev({
    id: 'joke-dies', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She tries for the room and gets nothing.',
    when: f => d(f.a).comedy <= 5, effects: { pop: { a: -1 } },
  }),
  ev({
    id: 'chaotic-good', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She does something completely unhinged and harmless and everyone loves it.',
    arcs: ['narrator'], when: f => st(f.a, 'boldness') >= 6,
    effects: { pop: { a: 2 } },
  }),

  // ══ AFTER THE ELIMINATION ════════════════════════════════════════════
  ev({
    id: 'the-empty-station', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'She looks at the station of whoever went home last night.',
    when: f => f.someoneLeft, effects: { pop: { a: 1 }, state: 'sober' },
    lines: [
      "The room is one station emptier than it was and nobody has said so out loud. {a} keeps almost looking at it. When she finally does, it is only for a second, and then she picks her own brush up again like nothing happened. That is what the room does now.",
      "Somebody has already tidied the empty station, which is somehow the worst part — it looks like nobody was ever there. {a} stands in front of it for a moment on her way past. \"She should not have gone,\" she says, to nobody, and then goes and sits down.",
      "{a} is the first one back in the room and she has it to herself for about ninety seconds. She uses them standing at the empty mirror, reading the message left on it, not touching anything. When the others come in she is already at her own station with her back to it.",
      "\"It is getting real now.\" {a} says it to the room and the room does not answer, because everybody is thinking the same thing and saying it twice would make it heavier. The empty chair stays empty all day. Nobody moves their stuff into the space.",
    ],
  }),
  ev({
    id: 'the-mirror-message', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She reads the message the eliminated queen left in lipstick.',
    when: f => f.someoneLeft, effects: { pop: { a: 1 }, state: 'sober' },
  }),
  ev({
    id: 'relief-and-guilt', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She is glad it was not her and hates being glad.',
    when: f => f.lastCall === 'BTM' || f.lastCall === 'LOW',
    effects: { pop: { a: 1 }, state: 'sober' },
  }),
  ev({
    id: 'one-less-friend', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'The queen who went home was the one she was closest to.',
    arcs: ['relationship'], when: f => f.lostAFriend,
    effects: { pop: { a: 2 }, state: 'adrift' },
  }),
  ev({
    id: 'one-less-enemy', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'The queen who went home was the one she could not stand, and she is not pretending otherwise.',
    arcs: ['villain'], when: f => f.lostAnEnemy,
    effects: { pop: { a: -1 } },
  }),

  // ══ THE ROOM AS A GROUP ══════════════════════════════════════════════
  ev({
    id: 'top-girls', slot: 'prep', cast: 'pair', weight: 1,
    note: 'Two queens who keep placing high quietly acknowledge that they are the two to beat.',
    arcs: ['frontrunner'], when: f => f.winsA >= 1 && f.winsB >= 1,
    effects: { bond: 1, pop: { a: -1, b: -1 } },
  }),
  ev({
    id: 'the-underestimated', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: '{b} says something dismissive about {a} that {a} decides to keep.',
    arcs: ['underdog'], when: f => f.bond <= 2,
    effects: { bond: -1, pop: { a: 2 }, state: 'fuel' },
  }),
  ev({
    id: 'group-singalong', slot: 'prep', cast: 'solo', weight: 1,
    note: 'The whole room ends up singing along to something and forgetting the competition for four minutes.',
    when: f => true, effects: { pop: { a: 1 }, state: 'roomWarm' },
  }),
  ev({
    id: 'the-critique-post-mortem', slot: 'werk-morning', cast: 'pair', weight: 2,
    note: 'They rehash what the judges said last week, and disagree about it.',
    when: f => f.episode > 1, effects: { bond: -0.5, pop: { a: 1 } },
  }),
  ev({
    id: 'settling-in', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'Early season. She is still working out who everybody is.',
    when: f => f.phase < 0.45, effects: { pop: { a: 1 } },
  }),
  ev({
    id: 'the-getting-close-talk', slot: 'werk-elim-day', cast: 'solo', weight: 1,
    note: 'Late season. The number left is small enough to say out loud now.',
    when: f => f.phase > 0.6 && f.roomSize <= 6,
    effects: { pop: { a: 1 }, state: 'endgame' },
  }),
  // ── FILLING THE THIN SLOTS ───────────────────────────────────────────
  //
  // Added after the guard measured what was actually ELIGIBLE rather than what
  // was written: an ordinary mid-season morning offered only two cold opens,
  // because almost every one of them was gated on last week having gone badly.
  // A slot needs a floor of scenes that can happen on any night at all.
  ev({
    id: 'first-one-in', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'She is the first back in the room and has it to herself for a minute.',
    when: f => true, effects: { pop: { a: 1 } },
  }),
  ev({
    id: 'coffee-and-silence', slot: 'cold-open', cast: 'pair', weight: 2,
    note: 'Two queens who are not really awake yet, being companionable about it.',
    when: f => true, effects: { bond: 0.5 },
  }),
  ev({
    id: 'unpacking-the-night', slot: 'cold-open', cast: 'pair', weight: 2,
    note: 'They go back over what happened on the main stage, still processing it.',
    when: f => f.episode > 1, effects: { bond: 0.5, pop: { a: 1 } },
  }),
  ev({
    id: 'still-in-last-nights-face', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She never took the makeup off and the room can tell what kind of night she had.',
    when: f => true, effects: { pop: { a: 1 } },
  }),
  ev({
    id: 'counting-the-chairs', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She works out how many are left and says the number out loud.',
    when: f => f.episode > 2, effects: { pop: { a: 1 }, state: 'sober' },
  }),
  ev({
    id: 'tuck-and-tape', slot: 'werk-elim-day', cast: 'pair', weight: 2,
    note: 'The unglamorous mechanics of getting into drag, done side by side.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
  }),
  ev({
    id: 'last-look', slot: 'werk-elim-day', cast: 'solo', weight: 2,
    note: 'Fully painted, alone with the mirror for a second before the stage.',
    when: f => true, effects: { pop: { a: 1 } },
  }),
  ev({
    id: 'zip-me-up', slot: 'werk-elim-day', cast: 'pair', weight: 2,
    note: 'The smallest favour in the room, asked of somebody she is not close to.',
    when: f => true, effects: { bond: 1 },
  }),
  ev({
    id: 'good-luck-she-means-it', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: 'One of them wishes the other luck and it is not a performance.',
    when: f => f.bond >= 1, effects: { bond: 1, pop: { a: 1 } },
  }),
  ev({
    id: 'good-luck-she-does-not', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: 'Same words, entirely different meaning, and both of them know it.',
    arcs: ['villain'], when: f => f.bond <= -1,
    effects: { bond: -1, pop: { a: -1 } },
  }),
  ev({
    id: 'running-late', slot: 'werk-elim-day', cast: 'solo', weight: 1,
    note: 'The call comes and she is nowhere near ready.',
    when: f => true, effects: { pop: { a: -1 }, state: 'lostTime' },
  }),
  ev({
    id: 'the-quiet-before', slot: 'werk-morning', cast: 'solo', weight: 2,
    note: 'She has a plan for today and is turning it over before saying it to anyone.',
    when: f => true, effects: { pop: { a: 1 } },
  }),
  ev({
    id: 'who-is-the-threat', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'They talk about who is actually good at this, and one name keeps coming up.',
    arcs: ['frontrunner'], when: f => f.episode > 2,
    effects: { bond: 0.5, pop: { a: -1 } },
  }),
  ev({
    id: 'sizing-up-the-brief', slot: 'prep', cast: 'pair', weight: 2,
    note: 'Two queens reading the challenge brief and arriving at opposite conclusions.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
  }),
  ev({
    id: 'head-down-working', slot: 'prep', cast: 'solo', weight: 2,
    note: 'No drama. She works, and it is going well, and that is the scene.',
    when: f => true, effects: { pop: { a: 1 }, state: 'onTrack' },
  }),
];

/** Ids only, for guards and the transcript. */
export const WERK_IDS = WERK_EVENTS.map(e => e.id);

/** What is still unwritten, so the gap is visible rather than silent. */
export function unwrittenWerkEvents() {
  return WERK_EVENTS.filter(e => !e.lines || e.lines.length < 4).map(e => e.id);
}
