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
    lines: [
      "The hip pad shifts during the final zip and the whole silhouette goes sideways. {a} stands in the mirror, sees it, unzips, and starts rebuilding the padding from the waist down with fifteen minutes on the clock. Her hands are shaking but her face says she has done this before.",
      "{a} bends to check the hem and something in the back gives — not a seam, something structural, the boning or the corset lacing — and the whole top half of the dress changes shape. She catches it in the mirror, says a word she will not repeat, and starts taping from the inside out.",
      "The breast plate shifts during the final tuck and suddenly the neckline is sitting wrong on one side. {a} tries to pull it back without undoing everything else and cannot. She takes the whole top off, resets it, and puts it back together in the time it takes most people to do their lips.",
      "Five minutes before places and {a}’s waist cincher snaps a hook. Not bends — snaps, the metal kind, the load-bearing one. She holds the garment together with one hand, digs through her kit for a safety pin with the other, and builds a fix that will last exactly long enough if she does not breathe too deeply.",
    ],
  }),
  ev({
    id: 'wig-emergency', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: '{a} styles {b} hair because {b} own plan has collapsed.',
    arcs: ['hero', 'pageant'], when: f => strongAt(f.a, 'runway') && f.bond >= 0,
    effects: { bond: 1, pop: { a: 1 } },
    lines: [
      "{b}’s wig is not happening. The lace is lifting, the part is crooked, and the glue is not setting. {a} watches for about thirty seconds, puts down her own brush, walks over and says \"sit.\" She takes the whole thing off, reglues the lace, pins the back, and hands {b} a wig that looks like it grew there.",
      "The plan was a high pony and the high pony has fallen and it is not going back up. {b} is holding it in one hand and staring at it like it owes her money. {a} comes over, looks at what is left, and says \"we are doing a bob now\" — cuts it, styles it, pins it, done. It looks better than the pony would have.",
      "{b}’s wig cap is showing through the front and she does not know how to fix it. {a} sits her down, pulls the hairline forward, blends the lace with concealer and a tiny brush, and talks her through it so she can do it herself next time. She will not be able to do it herself next time, but it is kind that {a} pretends she will.",
      "\"Your hair looks insane,\" {a} says, and she does not mean it as a compliment. She lifts {b}’s wig off its styling head, resets the curl pattern with a flat iron and three pins, and puts it on {b}’s head like she is crowning someone. {b} looks in the mirror and for the first time tonight she looks like she might survive the runway.",
    ],
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
    lines: [
      "{a} goes for the joke and gets the angle wrong — too specific, too soon, aimed at something {b} is actually insecure about. The room goes quiet in that way where you can hear the sewing machines. {b} smiles but the smile does not reach her eyes, and {a} knows immediately that she has miscalculated.",
      "It starts funny. The first line lands. The second one is sharper. The third one is the one where {b} stops laughing and says \"okay\" in a voice that means stop. {a} does stop, but the room has already decided what it saw, and what it saw was mean.",
      "{a} reads {b} about the wig and then about the outfit and then about the walk, and somewhere between the second and the third one it stops being a read and starts being a list of complaints. {b} turns back to her mirror. The room does not laugh. {a} says \"I was joking\" into a silence that does not believe her.",
      "\"Girl, that silhouette is —\" and {a} finishes the sentence with a face instead of a word. {b} sees it. Everyone sees it. It is not shade, it is just unkind, and the difference matters. {a} goes back to her station and the room lets her go without anyone saying anything, which is the loudest thing they could have done.",
    ],
  }),
  ev({
    id: 'shade-behind-back', slot: 'prep', cast: 'pair', weight: 1,
    note: '{a} says something about {b} to the room while {b} is out of it.',
    arcs: ['villain'], when: f => f.canScheme && f.bond <= 0,
    effects: { bond: -1, pop: { a: -1 } },
    lines: [
      "{b} goes to the bathroom and {a} waits about four seconds before turning to the nearest queen and saying what she has been holding in all morning. It is not vicious — it is precise, which is worse. She lays out exactly what is wrong with {b}’s runway, {b}’s attitude, and {b}’s chances, and she does it like she is being helpful.",
      "\"I am just going to say it.\" {a} checks the doorway, confirms {b} is not in it, and says the thing. The room listens. Some of them agree. None of them will repeat it. {a} knows that, which is why she said it here and not to {b}’s face.",
      "{a} does not even lower her voice, which is the brazen part. She talks about {b}’s performance like {b} is somebody on a different show she is reviewing from home. Two queens laugh. One does not. {a} does not notice which one.",
      "The second {b} steps out, {a} says \"am I the only one seeing this?\" and then answers her own question for about ninety seconds. She is funny about it, which makes it land harder, because the room is laughing at things they probably should not be laughing at.",
    ],
  }),
  ev({
    id: 'overheard', slot: 'prep', cast: 'pair', weight: 1,
    note: '{b} walks back in on the tail end of it. Nobody says anything.',
    arcs: ['villain'], when: f => f.bond <= -2,
    effects: { bond: -2.5, state: 'frost' },
    lines: [
      "{b} comes back in and the sentence {a} was in the middle of just stops. Everybody hears it stop. {b} looks around the room once, slowly, and sits back down without asking what they were talking about. She does not need to ask. She knows.",
      "The room is mid-laugh when {b} walks through the door, and the laugh dies in the kind of way that answers every question at once. {a} picks up her brush. Somebody says \"anyway.\" {b} sits at her station and does not look at anyone, because looking at someone means having to decide whether to say something.",
      "{a} does not see {b} come back in. She is still going — the sentence, the gesture, the impression — and the queen facing the door tries to warn her with her eyes, but {a} is mid-word when she turns and sees {b} standing there. The silence that follows has a texture.",
      "{b} catches the last three words. Not the whole thing. Just enough. She hangs up her garment bag very carefully, sits down very carefully, and says \"are we having fun\" in a voice that is not asking. {a} says nothing. Nobody says anything. The room gets very interested in sewing.",
    ],
  }),
  ev({
    id: 'nickname', slot: 'cold-open', cast: 'pair', weight: 1,
    note: '{a} gives {b} a nickname and it sticks for the rest of the season.',
    arcs: ['narrator'], when: f => d(f.a).comedy >= 5,
    effects: { bond: 1, pop: { a: 1, b: 1 } },
    lines: [
      "{a} calls {b} something offhand — a play on the look, the walk, the way she holds her coffee — and {b} screams laughing. By lunch everyone in the room is using it. By the next day it is just what {b} is called, and {b} loves it, and {a} never lets her forget who gave it to her.",
      "It comes out of nowhere. {a} watches {b} do something perfectly ordinary, says two words that have no business being that funny, and the name sticks to {b} like glitter. For the rest of the season every queen in the room will call {b} by the nickname and {b} will pretend to hate it and obviously does not.",
      "{b} is mid-sentence and {a} interrupts with the name. Just drops it, flat, no setup. {b} stops talking, processes it, and then laughs so hard she puts her head on the table. \"That is my name now, isn't it.\" It is her name now.",
      "\"You know what you remind me of?\" {a} says, and what follows is so specific and so accurate that {b} cannot even be offended. The room picks it up immediately. {b} tries to give {a} one back and it does not land, which only makes the first one stick harder.",
    ],
  }),
  ev({
    id: 'not-here-to-make-friends', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She says the quiet part out loud and the room recalibrates around her.',
    arcs: ['villain'], when: f => f.canScheme && st(f.a, 'boldness') >= 7,
    effects: { pop: { a: -1 }, state: 'declared' },
    lines: [
      "Nobody asks. {a} just says it, to the room, mid-morning, while everyone is working. \"I did not come here to be liked.\" The sewing machines keep going but the queens stop talking, and the silence that follows is the sound of twelve people recalculating where {a} sits in the room.",
      "\"Let me be honest,\" {a} says, and then she is. She lays out what she thinks of the level in here, what she plans to do about it, and how sorry she is not going to be about doing it. Two queens look at each other. One of them mouths \"wow.\" {a} goes back to her work like she said something ordinary.",
      "{a} says it in the mirror, to herself, but loud enough for the room: \"I am here to win, I am not here to hold anyone's hand, and if that makes me the villain then fine.\" She does not turn around. She does not have to. Everyone heard it.",
      "The room is talking about how they are all in this together and {a} lets the sentence finish and then says \"no we are not\" with a cheerfulness that makes it worse. She means it. She is not performing. The room adjusts, and {a} goes back to glueing like the temperature did not just drop four degrees.",
    ],
  }),

  // ══ THE CHALLENGE, BEFORE AND AFTER ══════════════════════════════════
  ev({
    id: 'idea-theft-accusation', slot: 'prep', cast: 'pair', weight: 1,
    note: '{a} accuses {b} of taking her concept. Whether it is true is left open.',
    arcs: ['villain', 'relationship'], when: f => f.bond <= 1,
    effects: { bond: -2, pop: { a: -1 } },
    lines: [
      "\"That is my concept.\" {a} says it across the room and means it. {b} looks up, confused, because the concepts are not that similar, but {a} has decided they are and {a} is loud about it. The room watches them go back and forth for three rounds before somebody changes the subject.",
      "{a} sees {b}'s sketch and stops working. \"Are you kidding me?\" {b} did not copy it — anyone looking can see that — but {a} has convinced herself otherwise, and a convinced {a} is not somebody who listens. The argument that follows is short and ugly and settles nothing.",
      "It is the same colour palette and that is enough for {a}. She holds up her fabric, holds up {b}'s fabric, and says \"explain this\" like she is a prosecutor. {b} tries. {a} does not hear any of it. The room has opinions about who is right but nobody wants to be in the middle.",
      "{a} walks past {b}'s station, looks down, and says \"oh you are doing that too\" with a sweetness that has teeth in it. {b} says she came up with it herself. {a} says \"sure.\" {b} says she did. {a} says \"I said sure\" and walks away, which is not the same as believing her.",
    ],
  }),
  ev({
    id: 'talking-herself-out', slot: 'prep', cast: 'solo', weight: 2,
    note: 'She has an idea, hears herself describe it, and abandons it for something safe.',
    arcs: ['filler', 'weakness'], when: f => st(f.a, 'boldness') <= 5,
    effects: { pop: { a: -1 }, state: 'playedSafe' },
    lines: [
      "{a} starts describing the concept out loud and you can hear her talk herself out of it in real time. The sentence begins big — \"I am going to do a whole —\" and ends with \"actually I will just do a gown.\" The room watches the ambition leave her body.",
      "She had a vision. She drew it on the back of the brief and everything. Then she held it up, tilted her head, and put it face down on the table. \"It is too much,\" she says, and starts cutting a safe silhouette she knows she can finish. {a} will not remember the vision. The judges will not see it.",
      "{a} pitches the idea to herself in the mirror and does not like what she hears back. She scraps the headpiece, simplifies the shape, and ends up with an outfit that nobody will hate but nobody will remember, which is exactly the kind of decision that puts a queen in the middle of the pack.",
      "\"What if I —\" {a} says, and then stops, and then says \"no,\" and then picks up the scissors and cuts something predictable. Somewhere between the idea and the fabric it got smaller, and by the time she is sewing she has forgotten the version that might have won.",
    ],
  }),
  ev({
    id: 'doubling-down', slot: 'prep', cast: 'solo', weight: 1,
    note: 'Everyone tells her the concept will not read. She does it anyway.',
    arcs: ['fashion', 'villain'], when: f => st(f.a, 'boldness') >= 7,
    effects: { pop: { a: 2 }, state: 'committed' },
    lines: [
      "Three queens tell {a} it will not work. {a} listens to all three of them, nods politely, and keeps cutting the same pattern she was cutting before they opened their mouths. She has either seen something they have not or she is about to crash, and the room is going to have to wait until the runway to find out which.",
      "\"That is going to look crazy,\" somebody says, and {a} says \"good\" without looking up. She has committed. The concept is enormous, impractical, probably impossible to walk in, and she is building it anyway. The room has stopped trying to talk her out of it. {a} is not listening.",
      "The whole room thinks it is a mistake. {a} knows the whole room thinks it is a mistake. She finishes the third panel, holds it up, and says \"trust me\" to nobody in particular. Nobody does. {a} does not care. She has been here before — in her head, this is already on the runway.",
      "{a} describes the concept and watches the faces around her go through concern, confusion, and something close to pity. She takes it all in, smiles, and says \"watch.\" By the time she is halfway through building it, two of the queens who doubted her are watching from across the room, not helping, just watching.",
    ],
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
    lines: [
      "{a} sees {b}'s concept board and her face drops, because it is her concept, or close enough. They both know only one of them can do it. Neither of them moves. The conversation that follows is polite and then firm and then polite again, and at the end of it they are both still doing the same thing.",
      "\"We cannot both do this.\" {a} says it first, which is supposed to mean {b} should be the one to change. {b} does not change. {a} does not change. They spend the next hour working on identical ideas three stations apart, both pretending the other one is not there.",
      "{b} holds up the reference photo and {a} holds up hers and they are close enough that the room winces. Somebody suggests one of them pivot. Both of them say they had it first. The word \"first\" gets said four more times and settles nothing.",
      "They figure it out at the same time — {a} looks at {b}'s station, {b} looks at {a}'s — and the look they share is the one where you realise the room just got smaller. Neither is willing to admit who had it first, so they both keep going, and the runway is going to be awkward.",
    ],
  }),
  ev({
    id: 'coaching-through-it', slot: 'prep', cast: 'pair', weight: 2,
    note: '{a} runs {b} lines or steps until {b} has it.',
    arcs: ['hero'], when: f => f.bond >= 1,
    effects: { bond: 1.5, pop: { a: 1 } },
    lines: [
      "{a} runs the choreography with {b} four times, and the first three times are bad, and the fourth time something clicks. {b} does the step right and {a} screams like she just won something. \"Again,\" she says, and {b} does it again, and this time she does not need to be told where her arms go.",
      "\"Say the line like you mean it.\" {b} says the line. \"No, like you MEAN it.\" {b} says it again. {a} shakes her head, sits down, does the line herself, and the difference between how it sounds when {a} does it and how it sounds when {b} does it is the whole lesson. {b} tries a third time and gets closer.",
      "{a} catches {b} mouthing the lyrics wrong and instead of laughing she pulls her aside and walks through it line by line, slow, until {b} has it. It takes twenty minutes that {a} should be spending on her own performance. She spends them anyway.",
      "They are in the corner going through the blocking and {a} is patient in a way she is not patient about anything else. She adjusts {b}'s stance, moves her shoulders back, says \"there,\" and makes her hold it until it feels natural. By the fifth run {b} looks like a different queen. {a} says nothing about it, which is the compliment.",
    ],
  }),
  ev({
    id: 'panic-the-night-before', slot: 'prep', cast: 'solo', weight: 1,
    note: 'She is nowhere near finished and the room can see it.',
    when: f => st(f.a, 'temperament') <= 5, effects: { pop: { a: -1 }, state: 'unfinished' },
    lines: [
      "It is late and {a} is still cutting. The bodice is not right, the sleeves are not right, and the hem is not started. She keeps picking things up and putting them down without finishing any of them, and the queens who are still awake are watching without saying anything, because there is nothing to say.",
      "{a} has a pile of fabric that is supposed to be a garment and a garment that is supposed to be finished and neither thing is true. She is sewing fast, which is the problem — fast sewing is scared sewing, and scared sewing makes mistakes, and mistakes take time she does not have.",
      "The room is emptying out and {a} is still at her station. She has been at her station for nine hours. The left side of the dress looks good. The right side of the dress does not exist yet. She is going to have to choose between finishing it badly or not finishing it, and everyone can see the math except her.",
      "Somebody asks {a} if she needs help and she says no too quickly. She does need help. The outfit is half-built and the challenge is tomorrow and her eyes have the look of someone who knows exactly how far behind she is and is pretending she does not.",
    ],
  }),
  ev({
    id: 'winner-glow', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'Last week she won, and she walks back into the room differently.',
    arcs: ['frontrunner'], when: f => f.lastCall === 'WIN',
    effects: { pop: { a: 1 }, state: 'confident' },
    lines: [
      "{a} walks back into the room and does not need to say a word. The way she puts her bag down, the way she looks at the mirror, the way she takes her time — everything about her says she won last week and she knows it. The room knows it too. A couple of queens say congratulations. {a} thanks them like she expected it.",
      "There is a different energy to {a} this morning. She arrived first, set up without rushing, and has been humming to herself since she sat down. She looks lighter. She looks like a queen who proved something last week and is still carrying the proof.",
      "{a} is glowing and it is the annoying kind of glowing — the kind where she looks good without trying, answers questions without worrying, and walks into the room like it was built for her. She earned it. That does not stop the rest of the room from noticing.",
      "Last week {a} was wound tight. This week she is loose, easy, smiling at things she would normally let pass. A win will do that. The judges said her name and everything that was heavy about the week before just lifted. She sews with the posture of a queen who got told she is good at this, because she did.",
    ],
  }),
  ev({
    id: 'target-on-her-back', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'The room has noticed {a} keeps winning, and {b} says so, not entirely kindly.',
    arcs: ['frontrunner'], when: f => f.winsA >= 2,
    effects: { bond: -1, pop: { a: 1 } },
    lines: [
      "\"You are always up there,\" {b} says, and it is technically a compliment and technically not. {a} takes it with a smile that says she heard the second part. The room has noticed that {a} keeps winning, and {b} is the one who said it out loud, and saying it out loud changes something.",
      "{b} watches {a} unpack her win from last week and says \"must be nice\" with enough sugar on it that it could go either way. {a} chooses to take it well. {b} chooses to let her. But the line has been drawn and both of them know where it is.",
      "\"How many is that now?\" {b} asks, and she knows the answer, which is why the question is not really a question. {a} does not take the bait, because {a} is smart enough to hear the edge underneath it. The room files this one away for later.",
      "{b} brings it up like she is making conversation — \"you have been on a run\" — but the way she says \"run\" sounds a lot like \"must be nice to keep being the favourite\" and {a} is not deaf. She says thank you. She does not say anything else. The room goes quiet for a beat longer than it should.",
    ],
  }),
  ev({
    id: 'safe-again', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'Safe for the fourth time. She is starting to find that worse than being in the bottom.',
    arcs: ['filler', 'weakness'], when: f => f.safesA >= 3,
    effects: { pop: { a: -1 }, state: 'restless' },
    lines: [
      "Safe. Again. {a} sits at her station and does not celebrate because there is nothing to celebrate. She was not bad enough to be in danger and not good enough to be noticed, and that middle ground is starting to feel like quicksand. She picks up her brush and looks at herself and does not know what to change.",
      "{a} is doing the maths and it is not good maths. Four weeks of safe means four weeks the judges did not need to say her name. She has survived every elimination by being invisible, and she is starting to realise that invisible is not a strategy, it is a symptom.",
      "\"I would rather be in the bottom than safe again,\" {a} says, and she means it, and the room is not sure whether that is brave or reckless. Being safe is supposed to be good. {a} does not feel good. She feels like she is on a show and nobody is watching her.",
      "Another week, another time the judges looked past her. {a} smiles about it because smiling is what you do, but the smile is getting thinner. She came here to be memorable and instead she is furniture. The mirror does not tell her anything she does not already know.",
    ],
  }),
  ev({
    id: 'bottom-hangover', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'She survived the lip sync and has to walk back in and be normal.',
    arcs: ['performance'], when: f => f.lastCall === 'BTM',
    effects: { pop: { a: 1 }, state: 'rattled' },
    lines: [
      "{a} walks back in like someone who nearly did not walk back in. She puts her stuff down, sits at her station, and stares at nothing for about thirty seconds. When somebody asks if she is alright she says \"yeah\" in a voice that is holding together with effort. She survived the lip sync. She has not finished processing that.",
      "The door opens and the room goes quiet because everyone wants to know who is coming back through it. It is {a}. She looks tired in a way that makeup will not fix. She sits down, puts her hands flat on the table, and breathes. \"That was close,\" she says, to nobody. It was.",
      "{a} is back and trying to be normal about it, which means she is not normal about it. She laughs too hard at the first joke someone makes, works too fast, talks too much. The lip sync was last night and it is still in her body — the adrenaline, the relief, the fear that she will be back there next week.",
      "\"I am never doing that again,\" {a} says, meaning the bottom two, meaning the lip sync, meaning the part where she stood on that stage and did not know if it was over. She is lying. She might do it again. But the version of her that walked out last night and the version that walked in this morning are not the same queen.",
    ],
  }),

  // ══ THE EMOTIONAL REGISTER ═══════════════════════════════════════════
  ev({
    id: 'breakdown', slot: 'prep', cast: 'solo', weight: 1,
    note: 'It all arrives at once and she cannot hold it.',
    arcs: ['narrator', 'representation'], when: f => st(f.a, 'temperament') <= 4,
    effects: { pop: { a: 2 }, state: 'fragile' },
    lines: [
      "It comes out of nowhere. {a} is fine and then she is not fine and there is no transition between the two. She puts her brush down, puts her hands over her face, and cries in a way that sounds like it has been building for longer than today. The room does not rush over. The room gives her space. Somebody puts a hand on her back and lets it stay.",
      "{a} tries to keep working through it and that is the part that breaks the room. The tears are running and she is still sewing, still trying to get the seam straight, and her hands are shaking too much for the line to hold. She puts it down eventually. She has to. The garment can wait. This cannot.",
      "She starts to say something about home and the sentence collapses halfway through. {a} sits down on the floor — not a chair, the floor — and the room gets very quiet. Nobody tells her she is strong. Nobody tells her anything. They let it happen because it needs to happen and everybody in the room knows it.",
      "The makeup {a} spent forty minutes on is gone in about ninety seconds. She is crying and laughing about crying and saying \"I am sorry\" to nobody, and the queen next to her says \"do not be sorry\" and means it. {a} will redo her face. She will be fine. But right now she is not fine and that is allowed.",
    ],
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
    lines: [
      "{a} starts telling {b} about where she grew up, and it is not a rehearsed version. It is messy, specific, full of people the room will never meet. {b} listens without performing the listening, which is why {a} keeps going. By the end of it the room is quieter than it has been all day.",
      "\"My mother —\" {a} starts, and then corrects herself, and the correction tells {b} more than the rest of the story. It is not sad, exactly. It is real. {a} describes a kitchen, a smell, a thing someone used to say, and {b} nods because she has a version of this too.",
      "{a} tells {b} about the town and the bar and the first person who told her she was good at this, and she tells it like she is seeing it again. The room slows down. Queens who were not listening start listening. {a} does not notice. She is somewhere else.",
      "It starts with a question — {b} asks where {a} is from — and {a} gives an answer that is longer and truer than either of them expected. She talks about the people who raised her, the ones who did not understand, the one who did. {b} does not say much. The right thing to do is not say much.",
    ],
  }),
  ev({
    id: 'the-first-time', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She talks about the first time she did drag, and it is not a polished anecdote.',
    arcs: ['representation', 'underdog'], when: f => true,
    effects: { pop: { a: 2 } },
    lines: [
      "{a} tells the room about the first night she did drag and it is not the polished origin story. It is a borrowed wig, the wrong shoes, a bar where nobody knew her name. She did not look good. She did not feel good. But she went back the next week, and the week after that, and somewhere in the repetition she became this.",
      "\"I was terrible,\" {a} says, grinning. She describes the first wig — crooked, cheap, wrong colour — and the first lip sync — forgot the words, tripped over the monitor cable — and the room is laughing because the queen telling the story is not that person anymore, except she is.",
      "Somebody asks {a} when she started and {a} goes quiet for a second before she answers. She talks about a friend who dared her, a night that changed everything, and a mirror that showed her someone she did not know she could be. She says it simply, without performing it, and the room lets the sentence sit.",
      "{a} describes the first time she got into drag in a bathroom she should not have been in, using products she borrowed from someone she has lost touch with, and went to a venue she was scared to walk into. She does not make it sound brave. She makes it sound necessary, which is different and harder to say out loud.",
    ],
  }),
  ev({
    id: 'imposter', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She says out loud that she does not think she belongs here.',
    arcs: ['underdog'], when: f => st(f.a, 'temperament') <= 6,
    effects: { pop: { a: 1 }, state: 'fragile' },
    lines: [
      "{a} says it while she is working, not while she is performing, which is how the room knows she means it: \"I do not think I am supposed to be here.\" Nobody argues with her. Somebody should. Instead they let the sentence hang there, and {a} keeps sewing like she did not just say the truest thing she has said all week.",
      "\"Everyone in here is better than me.\" {a} says it flat, to the mirror, not looking for a response. She is not fishing — she believes it, and the room can hear the belief. A couple of queens try to correct her. {a} nods like she heard them and keeps working. She did not hear them.",
      "{a} looks at the row of stations and names, in her head, what every other queen is good at, and then she gets to her own station and draws a blank. She does not say any of this out loud. She does not have to. The way she is sitting says it for her — small, careful, taking up less room than she takes.",
      "It comes out mid-conversation, casual, almost offhand: \"I keep waiting for them to realise they let the wrong person in.\" {a} laughs after she says it. The laugh is supposed to make it a joke. It is not a joke. The queen sitting next to her knows it is not a joke and squeezes her arm, once, and they both go back to work.",
    ],
  }),
  ev({
    id: 'body-talk', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: 'Two queens getting undressed together, talking about their bodies without performing about it.',
    arcs: ['representation'], when: f => f.bond >= 2,
    effects: { bond: 1.5, pop: { a: 1, b: 1 } },
    lines: [
      "{a} and {b} are both getting padded and neither of them is performing about it. They talk about hips the way you talk about hips when nobody is watching — what works, what does not, what they wish they could change. It is the most ordinary conversation in the room and also the most honest one.",
      "They are getting undressed side by side and {a} says something about her body that is not a joke, and {b} says something back that is not a joke either, and for about three minutes they are two people being truthful about what they see in the mirror. It is not a moment. It is just real.",
      "{b} is taping and {a} is taping and {b} says \"I hate this part\" and {a} says \"me too\" and they both laugh, but underneath the laugh is a conversation about what it costs to do this — the discomfort, the negotiation with the body you have, the body you build on top of it.",
      "{a} catches {b} looking at herself in the mirror, not the drag version, the in-between version, and {a} says \"you look good\" and means the person, not the outfit. {b} says \"shut up\" but she does not mean shut up. They go back to getting ready and neither of them mentions it again, but something shifted.",
    ],
  }),
  ev({
    id: 'apology', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'One of them apologises properly for something from last week.',
    arcs: ['villain', 'relationship'], when: f => f.bond <= -2,
    effects: { bond: 3, pop: { a: 2 }, state: 'mended' },
    lines: [
      "{a} pulls {b} aside before the room fills up and says it without preamble: \"I was wrong last week and I am sorry.\" She does not explain it or qualify it or make it about herself. She says it, and then she waits. {b} takes a breath, nods, and that is it. The thing that was between them is smaller now.",
      "\"I owe you an apology.\" {a} says it looking at {b}, not at the floor, and the room pretends not to listen. She names the specific thing she did, says why it was wrong, and does not ask for forgiveness because asking for forgiveness is making it about you. {b} says \"thank you for saying that,\" and they both go back to work.",
      "{a} sits at {b}'s station first thing in the morning with two coffees. She puts one down and says \"I was terrible to you and I know it.\" {b} picks up the coffee. They talk for a few minutes, quietly, and by the end of it something between them has unclenched.",
      "It is not a performance. {a} does not do it in front of the room. She waits until they are side by side at the mirrors, leans over, and says \"I should not have said that about you. I am sorry.\" {b} looks at her for a long time, then nods. It is not forgiveness yet. It is the door to forgiveness opening.",
    ],
  }),
  ev({
    id: 'apology-refused', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'The apology is offered and not accepted.',
    arcs: ['relationship'], when: f => f.bond <= -5,
    effects: { bond: -1, pop: { b: -1 }, state: 'frost' },
    lines: [
      "{a} tries. She sits down, says the words, means them. {b} listens to the whole thing, waits until {a} is finished, and says \"okay\" in a tone that closes a door rather than opening one. {a} nods, stands up, and walks back to her station. The apology was offered. It was not accepted. The room felt both.",
      "\"I hear you,\" {b} says, and it is the most devastating version of not accepting an apology, because it acknowledges that the words happened without agreeing that the words were enough. {a} does not push it. There is nothing to push against. {b} goes back to her mirror and the distance between their stations feels wider than before.",
      "{a} says she is sorry and {b} says \"I appreciate you saying that\" with the flattest delivery the room has heard all season. It is not unkind. It is just done. {b} has moved past the anger and into something colder, and cold does not forgive the way hot does.",
      "{a} starts the apology and gets about two sentences in before {b} holds up a hand. \"Not now.\" {a} stops. \"Not now\" might mean later and it might mean never, and the way {b} says it does not clarify which. {a} goes back to work. {b} goes back to work. The room exhales very quietly.",
    ],
  }),

  // ══ THE FUNNY ONES ═══════════════════════════════════════════════════
  ev({
    id: 'the-bit', slot: 'werk-morning', cast: 'solo', weight: 2,
    note: 'She starts a bit that runs all day and the whole room joins in.',
    arcs: ['narrator'], when: f => d(f.a).comedy >= 7,
    effects: { pop: { a: 3 }, state: 'roomBit' },
    lines: [
      "{a} starts a character voice at nine in the morning and by noon the entire room is doing it. She created a persona — an assistant, a weather announcer, something fictional and very specific — and everyone keeps adding to it. The bit has layers now. {a} started it, but the room owns it.",
      "It begins when {a} narrates her own walk to the fabric wall in a voice that is not hers and has no business being that funny. By the time she does it a third time, two other queens are answering in character, and by lunch the room has a whole scene going that nobody planned and nobody wants to stop.",
      "{a} holds up a piece of fabric and pretends to be a judge critiquing it, and the impression is so sharp that the room loses ten minutes to doing their own versions. It becomes the thing of the day — every decision is narrated in the judge voice, every critique is delivered with the same hand gesture.",
      "Nobody asked {a} to be the entertainment but she has decided that today she is. She assigns everyone a character from a made-up show that does not exist, and within an hour the room is performing it, complete with a plot, a villain, and a dramatic elimination that gets more elaborate every time someone adds to it.",
    ],
  }),
  ev({
    id: 'impression', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: '{a} does an impression of {b} and it is devastatingly accurate.',
    arcs: ['narrator'], when: f => d(f.a).comedy >= 7,
    effects: { bond: 0.5, pop: { a: 2 } },
    lines: [
      "{a} does {b}. The walk. The hand on the hip. The way she says \"absolutely\" when she means maybe. It is three seconds long and it is perfect, and {b}'s face goes through six stages before landing on laughter because the alternative is admitting how accurate it was.",
      "\"You know what you do?\" {a} says, and then she does it — the exact way {b} checks her reflection, the exact pause before {b} answers a question — and the room erupts. {b} says \"I do not do that\" and everyone in the room says \"you do that\" at the same time.",
      "{a} stands up, puts her shoulders back, tilts her chin, and becomes {b}. The posture, the voice, the little thing she does with her hands when she is thinking. It lasts ten seconds and it is devastating. {b} watches it happen and says \"I hate you\" with a grin that means she cannot believe how good it was.",
      "It starts with the walk. {a} crosses the room the way {b} crosses the room — deliberate, slow, with the pause at the end — and by the time she turns around the entire room is dying. {b} is trying not to laugh and failing. \"Am I really like that?\" she asks, and the silence that follows is the answer.",
    ],
  }),
  ev({
    id: 'joke-dies', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She tries for the room and gets nothing.',
    when: f => d(f.a).comedy <= 5, effects: { pop: { a: -1 } },
    lines: [
      "{a} goes for the joke and the room gives her nothing. Not silence — worse than silence, the polite half-laugh that says we heard it but we are not going to pretend. {a} sits back down and does not try again for the rest of the morning, which is its own kind of loud.",
      "The setup is long. The delivery is confident. The punchline lands on a room that does not react, and {a} watches it die in real time. She says \"okay\" to herself, picks up her needle, and goes back to work. Comedy is timing and the timing was wrong and she knows it.",
      "{a} tells a joke that needed the room and the room was not in on it. Two queens smile. Nobody laughs. {a} tries to save it with a second pass and the second pass is worse, which is the rule about saving jokes — the rescue attempt always costs more than the original failure.",
      "\"You had to be there\" is the thing you say when a joke does not land, except they were there and it still did not land. {a} delivers the line, waits for the reaction, gets a room full of queens looking at their sewing, and learns something about her comedy that she did not want to learn today.",
    ],
  }),
  ev({
    id: 'chaotic-good', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She does something completely unhinged and harmless and everyone loves it.',
    arcs: ['narrator'], when: f => st(f.a, 'boldness') >= 6,
    effects: { pop: { a: 2 } },
    lines: [
      "{a} arrives wearing the wig from last night’s runway as a hat, upside down, with sunglasses perched on top of it, and acts like nothing is unusual. She sits at her station, pours coffee into a mug she brought from home that says something unprintable, and starts the day like this is a normal person doing a normal thing.",
      "Nobody sees {a} do it, but when the room comes back from the break, every single mannequin head is facing the wall. {a} is at her station looking innocent. The investigation takes ten minutes. The laughter takes longer. She never admits it.",
      "{a} walks into the room on her knees, wearing a robe over her shoulders like a cape, doing a royal wave. It is fully committed, absolutely insane, and the room is screaming before she gets to her station. She stands up, dusts off her knees, and says \"good morning\" like a person who did not just enter a room on all fours.",
      "Somebody left a pair of heels unattended and {a} puts them on, adds a feather boa from the accessories wall, and does a full runway walk around the room, narrating her own critiques in both voices. It is so stupid and so committed that the whole room stops working to watch, and when she is done she puts everything back exactly where she found it.",
    ],
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
    lines: [
      "{a} finds the message on the mirror before anyone else does — written in lipstick, the way queens do when they go, a couple of words and a name. She reads it twice. She does not wipe it off. She leaves it for the room to find, because it was meant for all of them.",
      "The lipstick on the mirror is smudged where somebody wrote too fast, and {a} stands there trying to make out the last word. When she gets it, she does not say anything. She puts her hand on the glass for a second, right next to the writing, and then she walks away and starts her day.",
      "{a} is the one who reads the mirror message out loud, because someone has to. She reads it clearly, without commentary, and then the room is quiet for a moment that belongs to the queen who left it. Nobody touches the mirror for the rest of the morning.",
      "There is a heart drawn in lipstick where her name used to be. {a} sees it first and calls the others over, and they all stand around the mirror reading the words she left behind. It is short. It is kind. {a} takes a photo of it with her eyes and sits down, and the room moves on because the room has to move on.",
    ],
  }),
  ev({
    id: 'relief-and-guilt', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She is glad it was not her and hates being glad.',
    when: f => f.lastCall === 'BTM' || f.lastCall === 'LOW',
    effects: { pop: { a: 1 }, state: 'sober' },
    lines: [
      "{a} is relieved and she hates that she is relieved. She survived and someone else did not and the maths of that is simple and ugly: their loss is her gain. She puts her face on and pretends she is not thinking about it, but she is thinking about it, and the mirror knows.",
      "The first thing {a} feels when she sits down this morning is glad, and the second thing she feels is ashamed of being glad. She was in the bottom and she stayed and the other queen went home and somewhere in the middle of all that is a person who is grateful it was not her, and she does not like that person very much right now.",
      "{a} should be celebrating — she is still here — but the way she is still here is by being the one who was slightly less bad, and that is not the kind of victory that feels good. She is quiet all morning. She works. She does not talk about last night. The relief is real and the guilt is real and they sit together badly.",
      "It is the morning after and {a} is alive in the way you are alive after something almost went wrong. She catches herself being happy and corrects it, then catches herself correcting it and wonders if that is worse. The queen who left was her friend. {a} is still here. Both things are true and neither one cancels the other.",
    ],
  }),
  ev({
    id: 'one-less-friend', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'The queen who went home was the one she was closest to.',
    arcs: ['relationship'], when: f => f.lostAFriend,
    effects: { pop: { a: 2 }, state: 'adrift' },
    lines: [
      "The queen who went home was the one {a} sat with, ate with, talked to at the end of every day. {a} looks at the empty station and does not cry, which is somehow more noticeable. She moves through the morning like she is looking for someone who is not there, because she is.",
      "{a} keeps turning to say something to a station that is empty. She does it three times before she stops doing it, and each time the pause where the answer would have been is longer. The room notices. Nobody fills the space. It was not their space to fill.",
      "\"She was my person in here.\" {a} says it once, early, and does not say it again. She works alone all day. She eats alone. She is not upset, exactly — she is recalibrating, figuring out who she is in a room that no longer has the one person who made it make sense.",
      "The hardest part is not the missing queen. The hardest part is that the room keeps going. {a} sits at her station and watches everyone work and laugh and argue and she wonders when she stopped being someone who could do that, and the answer is last night, when her closest friend sashayed away.",
    ],
  }),
  ev({
    id: 'one-less-enemy', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'The queen who went home was the one she could not stand, and she is not pretending otherwise.',
    arcs: ['villain'], when: f => f.lostAnEnemy,
    effects: { pop: { a: -1 } },
    lines: [
      "{a} walks into the room, looks at the empty station, and does not pretend to be sad about it. \"Good,\" she says, under her breath but not far enough under. A couple of queens hear it. Nobody challenges her, because they all know exactly who left and they all know exactly how {a} felt about her.",
      "The station is empty and {a} is lighter this morning, physically lighter, like she has been carrying something that has been put down. She does not say anything unkind. She does not have to. The absence of grief is loud enough.",
      "{a} sits down, looks at the gap in the row of stations, and sips her coffee with the energy of someone who has been waiting for this specific chair to be empty. She is not cruel about it. She is just honest, and the honesty is that the room is better for her now.",
      "\"I am not going to pretend,\" {a} says, and she does not pretend. The queen who left was the one who made her life difficult every single day and now that queen is gone and {a} is not hiding the relief. A few queens exchange looks. {a} does not care about the looks. She cares about having her room back.",
    ],
  }),

  // ══ THE ROOM AS A GROUP ══════════════════════════════════════════════
  ev({
    id: 'top-girls', slot: 'prep', cast: 'pair', weight: 1,
    note: 'Two queens who keep placing high quietly acknowledge that they are the two to beat.',
    arcs: ['frontrunner'], when: f => f.winsA >= 1 && f.winsB >= 1,
    effects: { bond: 1, pop: { a: -1, b: -1 } },
    lines: [
      "{a} and {b} are working near each other and they both know they are the two. Nobody else in the room has their record. They do not say it — saying it would make them targets — but the way they glance at each other's work has changed from curiosity to measurement.",
      "\"You know it is going to be us at the end,\" {a} says, quiet enough that the room does not hear. {b} does not argue. She nods once. They go back to their stations and work harder than they were working before, and the respect between them is real, which is exactly why it is also dangerous.",
      "{b} and {a} end up at the mirror at the same time and {b} says \"I am glad you are still here\" and means it, and the part she does not say is that she is glad because she wants to beat {a} when it matters, not have her go early to someone worse. {a} hears both parts.",
      "They are having coffee and talking about nothing when {a} says \"I think we are the ones who make it\" and {b} says \"I think so too\" and for a second they are allies and rivals in the same breath. Neither of them will say this in front of the group. The group does not need to know.",
    ],
  }),
  ev({
    id: 'the-underestimated', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: '{b} says something dismissive about {a} that {a} decides to keep.',
    arcs: ['underdog'], when: f => f.bond <= 2,
    effects: { bond: -1, pop: { a: 2 }, state: 'fuel' },
    lines: [
      "{b} says it to the room, not to {a}, which is the part that stings: \"I do not see it.\" Four words about {a}'s chances, said while {a} is right there, said like it is obvious. {a} hears it. {a} files it. {a} will use it later, on the runway, when it matters more than anything {b} has ever sewn.",
      "\"She is sweet but she is not a threat,\" {b} says, and {a} is standing close enough to hear every word. {a} does not correct her. She goes back to her station and works with the kind of focus you only get from someone who has just been told she cannot do the thing she is about to do.",
      "{b} ranks the queens out loud — a game, not meant to be cruel — and puts {a} near the bottom. {a} laughs along. She does not argue. But the way she picks up her scissors afterwards is different, and the way she cuts is different, and if {b} were watching she would see it, but {b} is not watching, which is {b}'s mistake.",
      "{a} overhears {b} telling someone that {a} is not ready for this level, and the sentence does not make {a} angry — it makes {a} quiet, which is worse. She tucks the words away in the part of her brain where fuel lives, and she will pull them out on the night she needs them most.",
    ],
  }),
  ev({
    id: 'group-singalong', slot: 'prep', cast: 'solo', weight: 1,
    note: 'The whole room ends up singing along to something and forgetting the competition for four minutes.',
    when: f => true, effects: { pop: { a: 1 }, state: 'roomWarm' },
    lines: [
      "It starts with {a} humming something and then someone joins in and then someone else joins in and within ninety seconds the whole room is singing along to the same song. Nobody planned it. Nobody remembers who started it. For about four minutes there is no challenge, no judges, no elimination — just a room full of queens making noise together.",
      "{a} plays something on her phone and the first queen who hears it starts singing. By the chorus every station in the room has stopped working. They are all singing, badly, happily, at a volume that makes the mirrors shake. When it ends somebody says \"one more\" and they do one more.",
      "The room is tense and then {a} starts singing under her breath and somebody picks it up and somebody else harmonises and within a minute the whole room is doing the thing where you sing a song together and nobody is performing it. They are just in a room, together, being loud about something that is not the challenge.",
      "{a} does a run — an actual, full, vocal run — and the queen next to her gasps and says \"do that again,\" and {a} does it again, and the whole room applauds like they are at a show that is not this show. For a few minutes the sewing machines are quiet and the room is warm and nobody remembers what they were worried about.",
    ],
  }),
  ev({
    id: 'the-critique-post-mortem', slot: 'werk-morning', cast: 'pair', weight: 2,
    note: 'They rehash what the judges said last week, and disagree about it.',
    when: f => f.episode > 1, effects: { bond: -0.5, pop: { a: 1 } },
    lines: [
      "\"Did you hear what the judges said about the construction?\" {a} asks, and {b} heard, and they disagree about what it meant. {a} thinks the critique was about proportion. {b} thinks it was about fabric choice. They go back and forth about it for ten minutes and neither of them changes the other's mind.",
      "{a} and {b} are going over last week's critiques and {a} thinks the judges were wrong about {b}. {b} does not think the judges were wrong about {b}. This is an awkward thing to disagree about, because one of them is saying \"you deserved better\" and the other is saying \"no, I earned that.\"",
      "\"They clocked you for the same thing they praised her for,\" {a} says, and {b} looks up, because {a} is right and it is the kind of right that makes the whole judging feel uneven. They talk about it, not loudly, but with enough heat that the queens nearby start listening.",
      "{b} replays the judges' comments word by word and {a} offers a different reading — not better, just different — and the conversation turns into a debate about whether the judges even saw the same outfit {b} sent down the runway. By the end of it they have not agreed on anything, but they both feel heard.",
    ],
  }),
  ev({
    id: 'settling-in', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'Early season. She is still working out who everybody is.',
    when: f => f.phase < 0.45, effects: { pop: { a: 1 } },
    lines: [
      "{a} is still learning who everyone is. She watches from her station — who talks to whom, who works alone, who fills the silence and who sits in it. She has not figured out where she fits yet, and the not-knowing is both exciting and uncomfortable, like the first week of any room you have ever walked into.",
      "The room is full of people {a} does not know yet, and she is paying attention in the way you pay attention when everything is new. Who is funny, who is serious, who takes up space and who gives it away. She files it all without writing any of it down, and by the end of the week she will have a map.",
      "{a} is still in the phase where she laughs at every joke, agrees with every opinion, and mirrors whoever she is sitting next to. She has not found her voice in the room yet. She is still borrowing everyone else's, and the room is too new for anyone to notice.",
      "Early days. {a} is being careful — careful with her opinions, careful with her humour, careful with how much space she takes. The room has not settled yet. Nobody knows who is an ally and who is a rival, and until that shakes out, {a} is going to keep being polite and watching.",
    ],
  }),
  ev({
    id: 'the-getting-close-talk', slot: 'werk-elim-day', cast: 'solo', weight: 1,
    note: 'Late season. The number left is small enough to say out loud now.',
    when: f => f.phase > 0.6 && f.roomSize <= 6,
    effects: { pop: { a: 1 }, state: 'endgame' },
    lines: [
      "{a} counts the stations out loud. Six. She can see everyone from where she is sitting. The room that started with thirteen queens now fits in a glance, and {a} says \"it is getting small in here\" and means it both ways — the physical room is the same, but the space to hide has gone.",
      "\"There are six of us left.\" {a} says it to the mirror and the mirror does not answer, but the number sits in the room like furniture. It is a small number. It is the number where everyone knows where they stand and nobody can pretend they do not.",
      "{a} looks at the queens who are left and realises she likes every one of them, which is a problem, because some of them are going home and she is going to have to watch. The room is warmer now than it was at the start. It is also more dangerous, and {a} can feel both things at once.",
      "The room is small enough that {a} can hear every conversation from her station. She can hear who is nervous and who is confident and who is pretending. There is no hiding at this stage. Every choice is visible. Every runway is a statement. {a} knows this is the part that counts, and the weight of it shows in how carefully she works.",
    ],
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
    lines: [
      "{a} is the first one back in the room and she has it to herself for a minute before anyone else arrives. She turns the lights on, walks past the stations, and sits at hers in the quiet. She looks at the empty chairs and the silent machines and the mirrors that are just mirrors when nobody is in front of them. It is a different room without people in it.",
      "The door opens and {a} walks into a room that does not have anyone in it yet. She puts her bag down slowly, sets up her station the way she likes it, and has about ninety seconds of peace. She uses them to breathe, to think about nothing, to be a person in a room before she has to be a queen in a challenge.",
      "{a} arrives before the call and the werkroom is hers alone. No music, no chatter, no machines. She walks the length of the mirrors, touches the edge of her station, and sits down in the kind of silence that only exists when you are the first person somewhere. When the door opens again, she is ready.",
      "There is a version of the room that only exists at this hour, before the rest of them arrive, and {a} has it to herself. She sits. She breathes. She looks at the fabric wall like it is a menu for a day that has not started. When the first voice comes through the door, the room changes, but for one minute it was hers.",
    ],
  }),
  ev({
    id: 'coffee-and-silence', slot: 'cold-open', cast: 'pair', weight: 2,
    note: 'Two queens who are not really awake yet, being companionable about it.',
    when: f => true, effects: { bond: 0.5 },
    lines: [
      "{a} and {b} are both holding coffee and neither of them is talking. They are sitting close enough that it is companionable and far enough apart that it is not a conversation. Every now and then one of them sighs, and the other one nods, and that is all the communication the morning requires.",
      "It is too early for words. {a} and {b} are at their stations with their mugs, not making eye contact, not performing, just existing side by side in that pre-drag state where the wig is off and the defences are down. One of them yawns. The other one yawns back. That is the whole scene.",
      "{b} puts a coffee on {a}'s station without being asked. {a} drinks it without saying thank you, because at this hour \"thank you\" is too many syllables and the coffee says it better anyway. They sit in the quiet and let the morning happen around them.",
      "Neither of them is a morning person and they have found each other, the way non-morning people do — by the coffee, by the silence, by the mutual understanding that nothing said before the second cup actually counts. {a} and {b} sit together and do not speak, and it is the most social either of them will be for an hour.",
    ],
  }),
  ev({
    id: 'unpacking-the-night', slot: 'cold-open', cast: 'pair', weight: 2,
    note: 'They go back over what happened on the main stage, still processing it.',
    when: f => f.episode > 1, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "{a} and {b} are still processing last night. \"Did you see her face when they called the bottom?\" {b} asks, and {a} did, and they go through it moment by moment — the call, the reaction, the lip sync, the decision — trying to make sense of it now that the adrenaline is gone.",
      "\"I thought they were going to say my name,\" {a} says, and {b} says \"me too\" and the honesty of that opens the conversation up. They talk about what the judges saw, what they missed, and whether last night changed anything, and by the end of it they are both looking at today differently.",
      "{b} brings it up first: \"Last night was wild.\" {a} agrees. They pick apart the elimination, the critiques, the moment when the whole room held its breath, and the conversation turns into the kind of analysis that only makes sense when you are in it. Outside this room it would sound obsessive. In here it is just morning.",
      "They are both replaying it. {a} goes through what the judges said and {b} interrupts with what the judges meant, and they disagree, and the disagreement is useful because it shows them both angles they did not have last night. The main stage always looks different the morning after.",
    ],
  }),
  ev({
    id: 'still-in-last-nights-face', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She never took the makeup off and the room can tell what kind of night she had.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} walks in and she is still in last night's face. The lashes are off but the foundation is there, the liner is smudged, and the look on her face says she either could not sleep or chose not to. She sits down, stares at the mirror, and does not start getting ready. She starts getting present.",
      "The eyeliner from the runway is still on and {a} has not tried to fix it, which tells the room everything about the kind of night she had. She sits at her station with the look of someone who lay in bed going over every second of the main stage. She will take it off. She will get ready. But right now she is still in last night.",
      "{a} arrives looking like a queen who fell asleep in her makeup, because she did. One side of the liner is sharp and the other side is on the pillow somewhere. She does not rush to fix it. She lets the room see her like this, which is either vulnerability or exhaustion, and this morning they are the same thing.",
      "There is glitter in {a}'s hairline and a smudge of lipstick on her jaw and she walks in like neither of those things exist. The room clocks it immediately. Somebody says \"rough night?\" and {a} says \"I do not want to talk about it\" with a grin that means she absolutely wants to talk about it, just not yet.",
    ],
  }),
  ev({
    id: 'counting-the-chairs', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She works out how many are left and says the number out loud.',
    when: f => f.episode > 2, effects: { pop: { a: 1 }, state: 'sober' },
    lines: [
      "{a} counts the chairs. Out loud, pointing at each one, like a child counting something important. She gets to the number and says it again. The room does not need her to explain what the number means. Everyone has been counting. She is just the one who said it.",
      "\"How many are we now?\" {a} asks, and then counts before anyone answers. The number is smaller than it was. It is always smaller than it was. She says it with the tone of someone who is realising for the first time that this is a game she might actually win, and the thought sits on her face for a long time.",
      "{a} looks at the empty stations and the occupied ones and says a number into the room. Nobody responds because the number does not need a response. It is a fact. The fact is that there are fewer of them than there used to be, and every week the fact gets heavier.",
      "She does not do it dramatically. {a} just scans the room, counts the queens who are in it, and nods to herself. The nod says: this is real now. The number is small enough that everyone left is someone she knows, someone she has worked beside, someone she will have to beat. She picks up her brush and starts.",
    ],
  }),
  ev({
    id: 'tuck-and-tape', slot: 'werk-elim-day', cast: 'pair', weight: 2,
    note: 'The unglamorous mechanics of getting into drag, done side by side.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "{a} and {b} are side by side doing the unglamorous part — the taping, the tucking, the padding, the part nobody puts on a poster. They do it like people who have done this a thousand times, passing the tape back and forth without looking, complaining about the same things they always complain about. It is routine. It is also the most intimate the room gets.",
      "\"Hand me the tape.\" {b} does not specify which tape. {a} knows which tape. This is what happens when two queens have been getting into drag next to each other long enough — the shorthand replaces the sentence. They work in near-silence, taping and tucking, and the only conversation is functional: \"higher,\" \"hold this,\" \"zip me.\"",
      "{a} is padding and {b} is taping and neither of them is performing about it. The process of turning into a drag queen is mechanical and sweaty and involves a lot of medical tape, and doing it next to someone means you have seen them at their least glamorous, which is its own kind of bond.",
      "They are both in the in-between stage — not boy, not queen, somewhere in the middle where the padding is on but the face is not — and {b} says \"I look insane\" and {a} says \"you look exactly how I look\" and they both laugh at the absurdity of what they are about to become. Getting into drag is ridiculous. They love it.",
    ],
  }),
  ev({
    id: 'last-look', slot: 'werk-elim-day', cast: 'solo', weight: 2,
    note: 'Fully painted, alone with the mirror for a second before the stage.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} is fully painted, fully dressed, and alone with the mirror for the first time all day. She looks at herself, not the way you check your makeup — deeper than that, the way you look at a person you have built. She adjusts one thing. Then she stops adjusting and just looks. The queen in the mirror looks back.",
      "Everyone else is still getting ready. {a} is done. She stands in front of the mirror in the finished look and takes it in — the wig, the jewellery, the silhouette, the thing she was imagining when she cut the first pattern. It is not perfect. It is close. She nods once, to herself, and that nod is the moment before the stage.",
      "{a} turns in the mirror, checks the back, checks the side, and then faces forward and holds still. This is the version of herself she is sending out tonight. For a second she is not a queen in a challenge — she is a person looking at what she made of herself, and it is enough. It is going to have to be enough.",
      "The room is chaos behind her. {a} does not hear it. She is standing at the mirror with her eyes on her own eyes, and the look she gives herself is not vanity — it is recognition. She knows what she looks like. She knows what it cost. She breathes in, breathes out, and turns to walk to the stage.",
    ],
  }),
  ev({
    id: 'zip-me-up', slot: 'werk-elim-day', cast: 'pair', weight: 2,
    note: 'The smallest favour in the room, asked of somebody she is not close to.',
    when: f => true, effects: { bond: 1 },
    lines: [
      "\"Zip me up?\" {a} asks, and {b} is the closest queen, not the closest friend, just the closest body. {b} zips. {a} says thanks. {b} says you are welcome. It is the smallest interaction in the room and it means almost nothing, except that it means they are in the same place doing the same thing, and that counts.",
      "{a} cannot reach the back of the dress. She turns to {b}, who she has barely spoken to all week, and says \"can you get this?\" {b} gets it. She pulls the zipper up, smooths the fabric without being asked, and pats {a} on the shoulder once. They do not discuss it. It is just a thing queens do for each other.",
      "The zipper is stuck and {a} is twisting in front of the mirror trying to reach it. {b} sees her struggling, comes over without being asked, and works it loose. \"You have something caught in it — there.\" {a} says thanks. {b} shrugs. They go back to their own stations. The whole exchange takes fifteen seconds.",
      "{a} holds the back of her dress closed and looks around the room for anyone. {b} catches her eye. \"Please.\" {b} walks over, zips it, and says \"you look good\" — not as a compliment, as a fact — and walks back. {a} did not expect kindness from that direction. The zipper is up. The wall between them is slightly down.",
    ],
  }),
  ev({
    id: 'good-luck-she-means-it', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: 'One of them wishes the other luck and it is not a performance.',
    when: f => f.bond >= 1, effects: { bond: 1, pop: { a: 1 } },
    lines: [
      "{a} touches {b}'s arm on the way past and says \"good luck tonight\" and the way she says it — quiet, without an audience — tells {b} she means it. {b} says it back. They hold eye contact for a second longer than they need to, and the moment is real, and then they are both walking to the stage.",
      "\"You are going to be amazing,\" {a} says, and it is not the throwaway version. She stops what she is doing, looks at {b}, and says it with the weight of someone who has watched {b} work all week and knows what {b} has built. {b} does not know what to do with sincerity this close to the runway, so she hugs {a} instead of answering.",
      "{a} catches {b} before the door and says \"I hope you get what you deserve tonight\" and means it as kindness, which {b} can tell, because the unkind version of that sentence sounds completely different. {b} smiles. They walk out together. The room is behind them now.",
      "They are both about to walk to the stage and {a} says \"hey\" — just that — and {b} looks back, and {a} says \"kill it.\" Two words. No performance. {b} nods and the nod has gratitude in it, and they go out separately because this is still a challenge but for a second it was just two queens who wanted the best for each other.",
    ],
  }),
  ev({
    id: 'good-luck-she-does-not', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: 'Same words, entirely different meaning, and both of them know it.',
    arcs: ['villain'], when: f => f.bond <= -1,
    effects: { bond: -1, pop: { a: -1 } },
    lines: [
      "\"Good luck,\" {a} says to {b}, and the smile that comes with it is the kind of smile that means I hope you need it. {b} smiles back the same way. They both know what just happened. The words were right and the meaning was wrong and neither of them is going to be the one who breaks the performance.",
      "{a} squeezes {b}'s shoulder and says \"you got this\" with a warmth so convincing that anyone watching would think they were friends. They are not friends. {b} knows they are not friends. The squeeze is a message and the message is I am better than you and we both know it, wrapped in a gesture nobody can call unkind.",
      "\"I really hope it goes well for you tonight.\" {a} says it sweetly, sincerely, directly to {b}'s face, and {b} thanks her, and the room sees a nice moment between two queens, and the room is wrong. {a} hopes nothing of the sort. The hope was theatre. The sweetness was a weapon.",
      "{a} wishes {b} luck right before they walk out, and the timing is deliberate — too close to the stage for {b} to respond properly, just far enough away that the room sees {a} being gracious. {b} says \"thanks\" through a smile that is holding back something sharper, and they walk to the stage side by side like queens who get along.",
    ],
  }),
  ev({
    id: 'running-late', slot: 'werk-elim-day', cast: 'solo', weight: 1,
    note: 'The call comes and she is nowhere near ready.',
    when: f => true, effects: { pop: { a: -1 }, state: 'lostTime' },
    lines: [
      "The call comes and {a} is holding one shoe. The other shoe is somewhere. The wig is on but the lace is not glued. The left earring is in and the right one is on the floor. She is running and she knows she is running and the panic has a sound to it — the sound of a queen saying \"no no no\" very quickly to herself.",
      "{a} hears \"places\" and her face does the thing faces do when someone says a word that means you are out of time. The garment is not steamed. The accessories are not chosen. She grabs the first thing she can reach, clips the second, and walks to the door with the confidence of a queen who is absolutely not ready.",
      "Everyone else is lined up. {a} is still at her station, still pinning, still making decisions that should have been made an hour ago. She finishes the last pin as the door opens, grabs her clutch, and walks out still adjusting the neckline. She will adjust it all the way to the stage. She will still not be happy with it.",
      "\"I need five minutes.\" {a} does not have five minutes. She has about ninety seconds and she uses them like a person defusing something — fast, precise, no wasted movement. Wig on. Jewellery on. One last look in the mirror that she does not have time to take. She walks to the stage wearing an outfit that was still being built ten seconds ago.",
    ],
  }),
  ev({
    id: 'the-quiet-before', slot: 'werk-morning', cast: 'solo', weight: 2,
    note: 'She has a plan for today and is turning it over before saying it to anyone.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} is sitting at her station before the room wakes up, turning a thought over. She has a plan for today — not a flashy one, just a clear one — and she is rehearsing it in her head before she says it to anyone. The coffee is getting cold. She does not notice. She is already inside the challenge.",
      "The brief is on the table and {a} has read it three times. Nobody else is reading it three times. She is sitting with her chin on her fist, looking at something on the wall that is not actually on the wall, running the idea forward and backward until it settles. When somebody asks what she is thinking she says \"I am still thinking\" and that is the end of the conversation.",
      "{a} is quiet this morning and the quiet is not worried — it is planning. She sketches something on the back of a page, crosses it out, sketches it again. She has not spoken to anyone yet. She will, when the shape is right. Right now the shape is still forming and she is letting it form without interrupting it.",
      "Everyone else is chatting. {a} is not. She is working something out behind her eyes, the way you work out a problem you need to get right before you can afford to get it wrong in front of people. She will share the plan when it is a plan. Right now it is a direction, and directions need quiet.",
    ],
  }),
  ev({
    id: 'who-is-the-threat', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'They talk about who is actually good at this, and one name keeps coming up.',
    arcs: ['frontrunner'], when: f => f.episode > 2,
    effects: { bond: 0.5, pop: { a: -1 } },
    lines: [
      "\"Who do you think is going to take it?\" {a} asks, and {b} gives the honest answer, and the honest answer is a name they both keep circling back to. They talk about why — the track record, the consistency, the way the judges look at her — and neither of them says \"it should be me instead\" but they are both thinking it.",
      "{a} and {b} are ranking the room and they keep agreeing, which is worse than disagreeing because it means the answer is obvious. There is a queen in here who is better than both of them and they can see it and saying it out loud does not make it less true.",
      "\"She is going to win,\" {a} says, not bitter, just clear. {b} does not argue. They talk about the queen they are both watching, the one whose name keeps coming up, the one who makes everything look easy. The conversation is honest and a little bruising and neither of them feels better for having it.",
      "{b} says a name and {a} nods, because they have both been thinking it. The room has a frontrunner and everyone knows who it is, and {a} and {b} are having the version of the conversation where you admit it to each other quietly, away from the mirrors, where the admission cannot be used against you.",
    ],
  }),
  ev({
    id: 'sizing-up-the-brief', slot: 'prep', cast: 'pair', weight: 2,
    note: 'Two queens reading the challenge brief and arriving at opposite conclusions.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "{a} and {b} read the challenge brief at the same time and arrive at completely different conclusions. {a} thinks the brief is asking for one thing. {b} thinks it is asking for the opposite. They argue about it — not angrily, productively — and neither of them changes their mind, which means at least one of them is going to be wrong on the runway.",
      "\"That is not what this means,\" {b} says, pointing at the brief. {a} points at the same line and says \"that is exactly what it means.\" They read it out loud together, word by word, and by the end of the sentence they are more confused than they were at the start. They go back to their stations having learned nothing and gained a conversation.",
      "{a} reads the brief and sees an opportunity. {b} reads the brief and sees a trap. They compare notes over coffee and realise they are reading the same words differently, which is the interesting part — the brief has not changed, but their brains have given it two different shapes, and the runway will tell them which shape was right.",
      "\"What do you think they want?\" {a} asks, and {b} says what she thinks, and {a} says \"I thought the opposite\" and they both laugh because neither of them is sure. The brief is deliberately open, which means the queen who reads it bravely will either win or crash, and the queen who reads it cautiously will be safe and forgotten.",
    ],
  }),
  ev({
    id: 'head-down-working', slot: 'prep', cast: 'solo', weight: 2,
    note: 'No drama. She works, and it is going well, and that is the scene.',
    when: f => true, effects: { pop: { a: 1 }, state: 'onTrack' },
    lines: [
      "No drama. {a} is working and it is working. The seams are straight, the vision is clear, and she is humming something to herself while the room does the room's thing around her. Sometimes the story is not a crisis. Sometimes it is a queen who knows what she is doing, doing it.",
      "{a} has her head down and her hands moving and the outfit is taking shape the way outfits are supposed to take shape — steadily, piece by piece, without a single moment of panic. She does not need help. She does not need encouragement. She needs to be left alone, and the room obliges.",
      "The room is loud and {a} is in the middle of it, sewing, and if you did not look closely you would think she was not paying attention to anything except the fabric. She is paying attention to everything. She just does not need to react to any of it, because her hands know what to do and her brain is free to listen.",
      "{a} is having the kind of day where the garment cooperates and the machine behaves and the concept she drew on the napkin is turning into the thing she drew on the napkin. It is boring to describe. It is the best feeling in the room. She will not talk about it, because talking about it is how you ruin it.",
    ],
  }),
];

/** Ids only, for guards and the transcript. */
export const WERK_IDS = WERK_EVENTS.map(e => e.id);

/** What is still unwritten, so the gap is visible rather than silent. */
export function unwrittenWerkEvents() {
  return WERK_EVENTS.filter(e => !e.lines || e.lines.length < 4).map(e => e.id);
}
