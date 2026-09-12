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
    id: 'sewing-rescue', slot: 'prep', cast: 'pair', weight: 2, needs: 'design',
    note: '{b} cannot make the garment work and {a} sits down and fixes it for her.',
    arcs: ['hero'],
    when: f => strongAt(f.a, 'design') && weakAt(f.b, 'design') && f.bond >= 0,
    effects: { bond: 1.5, pop: { a: 2 } },
    lines: [
      "{b} has been fighting the same seam for an hour. {a} watches, says nothing, then just pulls up a stool and takes the whole thing out of her hands. Rips it back to the shoulder, restarts. {b} goes \"you do not have to —\" and {a} says \"girl, hush\" and keeps sewing.",
      "\"Give me that before you cry on it.\" {a} holds her hand out and {b} puts the garment in it and {a} rebuilds the bodice in ten minutes flat. {b} just watches. \"How did you —\" \"Do not ask questions, just say thank you.\" \"{b} says thank you.\"",
      "{b} is about to lose it. The whole room can see it. {a} walks over, flips the fabric inside out, finds the problem in four seconds. \"Okay, mama, this is fixable. Sit down.\" First time all day {b} has taken a full breath.",
      "Nobody asks {a} to help. She just shows up at {b}'s station with pins in her mouth, fixes the whole mess, and when {b} starts thanking her she waves it off. \"Girl, you would do it for me.\" She would not — {b} cannot sew — but it is a kind lie.",
    ],
  }),
  ev({
    id: 'fabric-hoard', slot: 'prep', cast: 'pair', weight: 1, needs: 'design',
    note: '{a} takes more than her share off the fabric wall and {b} notices.',
    arcs: ['villain'], when: f => f.canScheme && f.bond <= 2,
    effects: { bond: -1.5, pop: { a: -2 } },
    lines: [
      "{a} takes four bolts off the wall. Everybody else took two. {b} counts from across the table and says nothing — just files it. {a} does not even look guilty. Girl walks back to her station like she paid for it.",
      "The fabric wall is supposed to be shared. {a} did not get that memo. {b} watches her carry it all back in two trips and mutters \"the nerve\" under her breath. {a} hears it. Does not turn around.",
      "\"She took the whole bolt,\" {b} says to the room. {a} is laying out enough fabric for three outfits on one station. She hears {b} and keeps cutting. No tea, no shade — just total shamelessness.",
      "{b} goes to the wall for the stretch velvet. Gone. All of it. {a} is cutting into it across the room like it was always hers. {b} looks at the empty hook, looks at {a}, walks back to her station without a word. She will remember this.",
    ],
  }),
  ev({
    id: 'machine-jam', slot: 'prep', cast: 'solo', weight: 1, needs: 'design',
    note: 'Her machine eats the fabric and she loses time she did not have.',
    when: f => !strongAt(f.a, 'design'),
    effects: { pop: { a: 1 }, state: 'lostTime' },
    lines: [
      "The machine eats the chiffon and {a} just sits there staring at it. She pulls it out — fabric tears. \"No. No no no.\" That is twenty minutes she is not getting back and everybody in the room heard the rip.",
      "{a} hears it before she sees it — that crunch of the needle hitting something wrong. She lifts the presser foot and the whole thing comes out mangled. She says a word the cameras will bleep. Starts over from nothing.",
      "The bobbin jams. {a} spends ten minutes fighting it with a seam ripper and her nails before somebody says \"girl, just rethread it.\" By then the damage is done. The skirt is bunched and she does not have time to cut another.",
      "One second {a} is sewing. Next second she is holding two pieces of fabric that are no longer attached. \"Are you KIDDING me?\" The machine decided it was done for the day. {a} has not.",
    ],
  }),
  ev({
    id: 'mirror-check', slot: 'werk-elim-day', cast: 'pair', weight: 2,
    note: 'Two queens getting into drag beside each other, talking to the mirror rather than to each other.',
    when: f => true,
    effects: { bond: 0.5 },
    lines: [
      "{a} and {b} are side by side at the mirrors beating their faces. They talk to each other's reflections — last night, today, nothing much. Nobody turns around. It is the most relaxed either of them has been all week.",
      "{b} glances at {a}'s contour and says \"teach me that.\" No ego. {a} shows her, they do the same cheekbone at the same time, and for five minutes it is just two queens getting ready. Not two queens fighting for a crown. Just two queens.",
      "{a} catches {b}'s eye in the mirror and pulls the face — full ugly-cry drag face, chin forward, nostrils wide. {b} does one back. They go back and forth until {b} breaks and laughs so hard the eyeliner goes on crooked. \"Girl, you RUINED my wing.\"",
      "Not much talking. {a} is blending. {b} is gluing a brow. They pass the setting spray without asking — been beside each other long enough to know the routine. The room is loud behind them but the mirror is quiet.",
    ],
  }),
  ev({
    id: 'borrowed-jewels', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: '{b} lends {a} something for the runway because {a} has nothing that works.',
    arcs: ['hero', 'fashion'], when: f => weakAt(f.a, 'runway') && f.bond >= 2,
    effects: { bond: 1, pop: { b: 1 } },
    lines: [
      "{a} is staring at her accessories like they owe her money. {b} crosses the room, drops a pair of earrings and a chain on the table. \"Wear these. Give them back tomorrow.\" {a} starts to say she cannot — {b} is already walking away.",
      "\"What are you wearing with that?\" {b} asks. {a} holds up her only option. {b}'s face says everything. She goes to her own case, comes back with a belt and a pair of cuffs, and {a}'s outfit goes from \"girl, no\" to stage-ready in thirty seconds.",
      "{b} sees {a} holding two brooches against the neckline, hating both. Opens her own jewellery roll. \"Pick one.\" {a} picks the biggest. {b} laughs — \"I KNEW you would\" — and lets her take it anyway.",
      "{a} has nothing for her neck and the dress is begging for something. {b} unclasps her own choker, drops it in {a}'s hand. \"Do not lose it, it was my grandmother's.\" It was not her grandmother's. They both know that. {a} wears it like it was.",
    ],
  }),
  ev({
    id: 'glue-gun-burn', slot: 'prep', cast: 'solo', weight: 1, needs: 'design',
    note: 'She burns herself on the glue gun and keeps going.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} burns two fingers on the glue gun. \"Ow.\" She blows on them once and goes right back to glueing. The room looks over. She waves the hand. \"I am FINE.\" She is not fine. She finishes the headpiece anyway.",
      "The glue gun gets {a} on the thumb. She drops it on the table — glue on the table — glue on the fabric — \"NO.\" She peels it off, trims the edge, keeps going with a blister forming under the tape.",
      "Hot glue lands on {a}'s wrist and she does the full silent scream — mouth open, no sound. Funnier than it should be given that it actually left a mark. She wraps it in a paper towel and does not stop working.",
      "{a} pulls the trigger and the glue comes out sideways onto her finger. She watches it harden on her skin. \"Well, that is going to scar.\" Picks up the next rhinestone with the other hand. The outfit has to be finished. The finger will heal.",
    ],
  }),
  ev({
    id: 'padding-panic', slot: 'werk-elim-day', cast: 'solo', weight: 1,
    note: 'Something structural fails while she is getting into it, minutes before the stage.',
    when: f => true, effects: { pop: { a: -1 }, state: 'lostTime' },
    lines: [
      "The hip pad shifts during the final zip and the whole silhouette goes sideways. {a} sees it in the mirror, unzips, starts rebuilding the padding from the waist down. Fifteen minutes on the clock. Her hands are shaking but her face says she has done this before.",
      { needs: 'design', line: "{a} bends to check the hem and something gives in the back — not a seam, something structural. The whole top half of the dress changes shape. She catches it in the mirror. Says a word the cameras will bleep. Starts taping from the inside out." },
      "The breast plate shifts during the final tuck. Neckline sitting wrong on one side. {a} tries to pull it back without undoing everything else — she cannot. Takes the whole top off, resets it, puts it back together in the time it takes most queens to do their lips.",
      { needs: 'design', line: "Five minutes before places and {a}’s waist cincher snaps a hook. Not bends — snaps. The metal kind. The load-bearing one. She holds the garment together with one hand, digs through her kit with the other, and builds a safety-pin fix that will last exactly long enough if she does not breathe too deep." },
    ],
  }),
  ev({
    id: 'wig-emergency', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: '{a} styles {b} hair because {b} own plan has collapsed.',
    arcs: ['hero', 'pageant'], when: f => strongAt(f.a, 'runway') && f.bond >= 0,
    effects: { bond: 1, pop: { a: 1 } },
    lines: [
      "{b}’s wig is not happening. Lace lifting, part crooked, glue not setting. {a} watches for thirty seconds, puts down her own brush, walks over. \"Sit.\" Takes the whole thing off, reglues the lace, pins the back, hands {b} a wig that looks like it grew there.",
      "The plan was a high pony and the high pony has fallen and it is not going back up. {b} is holding it like it owes her money. {a} comes over, looks at what is left. \"We are doing a bob now.\" Cuts it, styles it, pins it, done. Looks better than the pony would have.",
      "{b}’s wig cap is showing through the front. {a} sits her down, pulls the hairline forward, blends the lace with concealer and a tiny brush. Talks her through it so she can do it herself next time. She will not be able to do it herself next time — but it is kind that {a} pretends she will.",
      "\"Your hair looks insane,\" {a} says, and not as a compliment. She lifts {b}’s wig off the styling head, resets the curl pattern with a flat iron and three pins, puts it on {b}’s head like she is crowning somebody. {b} looks in the mirror. First time all night she looks like she might survive the runway.",
    ],
  }),

  // ══ READING, SHADE, THE ROOM'S TEETH ═════════════════════════════════
  ev({
    id: 'reading-for-filth', slot: 'werk-morning', cast: 'pair', weight: 2,
    note: 'Affectionate reading that everybody enjoys, including the one being read.',
    arcs: ['narrator'], when: f => f.bond >= 1 && d(f.a).comedy >= 6,
    effects: { bond: 1, pop: { a: 2 } },
    lines: [
      "{a} has been waiting all morning to use this one. You can tell. She waits until the room is quiet, looks {b} up and down slow, and delivers it with ten years of club timing. {b} SCREAMS. The room screams. {b} does not have a comeback, which is the part she will think about later.",
      "\"I am not going to say anything about that outfit.\" {a} then says three things about the outfit. {b} takes it like a pro — hand on chest, head back, howling — because the alternative is admitting it landed.",
      "It starts as nothing. One comment across the room. Then {a} finds the angle and will not let it go. By the third read {b} is on the floor. By the fifth she is going \"okay, okay, you GOT me\" through actual tears. The room has decided {a} is funny, and that is worth more than a challenge win some weeks.",
      "{a} reads {b} so precisely that {b}'s first reaction is not to laugh — it is \"how long have you been sitting on that?\" Honest answer? Since the moment {b} walked in wearing it.",
    ],
  }),
  ev({
    id: 'read-lands-wrong', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'A joke goes too far and the room goes quiet.',
    arcs: ['villain'], when: f => f.bond <= 2,
    effects: { bond: -2, pop: { a: -2 } },
    lines: [
      "{a} goes for the joke and gets the angle wrong. Too specific. Too soon. Aimed at something {b} is actually insecure about. The room goes quiet — you can hear the air conditioning. {b} smiles but the smile does not reach her eyes. {a} knows immediately she miscalculated.",
      "It starts funny. First line lands. Second one is sharper. The third one is where {b} stops laughing and says \"okay\" in a voice that means stop. {a} does stop — but the room already decided what it saw, and what it saw was mean.",
      "{a} reads {b} about the wig, then the outfit, then the walk, and somewhere between the second and the third it stops being a read and starts being a list. {b} turns back to her mirror. The room does not laugh. {a} says \"I was joking\" into a silence that does not believe her.",
      "\"Girl, that silhouette is —\" and {a} finishes the sentence with a face instead of a word. {b} sees it. Everyone sees it. That is not shade — that is just unkind, and the difference matters. {a} goes back to her station. The room lets her go without a word, which is the loudest thing they could have done.",
    ],
  }),
  ev({
    id: 'shade-behind-back', slot: 'prep', cast: 'pair', weight: 1,
    note: '{a} says something about {b} to the room while {b} is out of it.',
    arcs: ['villain'], when: f => f.canScheme && f.bond <= 0,
    effects: { bond: -1, pop: { a: -1 } },
    lines: [
      "{b} goes to the bathroom and {a} waits about four seconds. Turns to the nearest queen and says what she has been holding in all morning. It is not vicious — it is precise, which is worse. {b}’s runway, {b}’s attitude, {b}’s chances. She lays it all out like she is being helpful.",
      "\"I am just going to say it.\" {a} checks the doorway, confirms {b} is not in it, and says the thing. The room listens. Some of them agree. None of them will repeat it. {a} knows that — that is why she said it here and not to {b}’s face.",
      "{a} does not even lower her voice. That is the brazen part. She talks about {b}’s performance like {b} is somebody on a different show she is reviewing from home. Two queens laugh. One does not. {a} does not notice which one.",
      "The second {b} steps out, {a} goes \"am I the only one seeing this?\" and then answers her own question for ninety seconds. She is funny about it, which makes it land harder — the room is laughing at things they probably should not be laughing at.",
    ],
  }),
  ev({
    id: 'overheard', slot: 'prep', cast: 'pair', weight: 1,
    note: '{b} walks back in on the tail end of it. Nobody says anything.',
    arcs: ['villain'], when: f => f.bond <= -2,
    effects: { bond: -2.5, state: 'frost' },
    lines: [
      "{b} comes back in and the sentence {a} was in the middle of just stops. Everybody hears it stop. {b} looks around the room once, slow, sits back down. Does not ask what they were talking about. She does not need to ask.",
      "The room is mid-laugh when {b} walks through the door. The laugh dies in the kind of way that answers every question at once. {a} picks up her brush. Somebody says \"anyway.\" {b} sits at her station and does not look at anyone.",
      "{a} does not see {b} come back in. She is still going — the sentence, the gesture, the impression — and the queen facing the door tries to warn her with her eyes. {a} is mid-word when she turns and sees {b} standing there. The silence that follows has a texture.",
      "{b} catches the last three words. Not the whole thing. Just enough. She puts her bag down very carefully, sits down very carefully, and goes \"are we having fun\" in a voice that is not asking. {a} says nothing. The room gets very interested in their own stations.",
    ],
  }),
  ev({
    id: 'nickname', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: '{a} gives {b} a nickname and it sticks for the rest of the season.',
    arcs: ['narrator'], when: f => d(f.a).comedy >= 5,
    effects: { bond: 1, pop: { a: 1, b: 1 } },
    lines: [
      "{a} calls {b} something offhand — a play on the look, the walk, the way she holds her coffee — and {b} screams. By lunch the whole room is using it. By the next day it is just what {b} is called. {a} never lets her forget who gave it to her.",
      "It comes out of nowhere. {a} watches {b} do something perfectly ordinary, says two words that have no business being that funny, and the name sticks like glitter. The whole season every queen will call {b} that. {b} pretends to hate it. She obviously does not.",
      "{b} is mid-sentence and {a} interrupts with the name. Just drops it flat. No setup. {b} stops talking, processes it, then laughs so hard she puts her head on the table. \"That is my name now, is it not.\" It is her name now.",
      "\"You know what you remind me of?\" What follows is so specific and so accurate that {b} cannot even be offended. The room picks it up immediately. {b} tries to give {a} one back. It does not land, which only makes the first one stick harder.",
    ],
  }),
  ev({
    id: 'not-here-to-make-friends', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She says the quiet part out loud and the room recalibrates around her.',
    arcs: ['villain'], when: f => f.canScheme && st(f.a, 'boldness') >= 7,
    effects: { pop: { a: -1 }, state: 'declared' },
    lines: [
      "Nobody asks. {a} just says it, mid-morning, while everyone is working. \"I did not come here to be liked.\" The room keeps moving but the queens stop talking. That silence is the sound of twelve people recalculating where {a} sits in the room.",
      "\"Let me be honest.\" Then she is. What she thinks of the level in here, what she plans to do about it, how sorry she is not going to be. Two queens look at each other. One mouths \"wow.\" {a} goes back to her work like she said something ordinary.",
      "{a} says it to herself in the mirror, but loud enough for the room. \"I am here to win. I am not here to hold hands. If that makes me the villain then fine.\" Does not turn around. Does not have to. Everyone heard it.",
      "The room is talking about how they are all in this together and {a} lets the sentence finish and then goes \"no we are not\" with a cheerfulness that makes it worse. She means it. She is not performing. {a} goes back to glueing like the temperature did not just drop four degrees.",
    ],
  }),

  // ══ THE CHALLENGE, BEFORE AND AFTER ══════════════════════════════════
  ev({
    id: 'idea-theft-accusation', slot: 'prep', cast: 'pair', weight: 1, needs: 'design',
    note: '{a} accuses {b} of taking her concept. Whether it is true is left open.',
    arcs: ['villain', 'relationship'], when: f => f.bond <= 1,
    effects: { bond: -2, pop: { a: -1 } },
    lines: [
      "\"That is my concept.\" {a} says it across the room and means it. {b} looks up confused — the concepts are not that similar — but {a} has decided they are and {a} is loud about it. Three rounds of back and forth before somebody changes the subject.",
      "{a} sees {b}'s sketch and stops working. \"Are you kidding me.\" {b} did not copy it — anyone can see that — but {a} has convinced herself, and a convinced {a} does not listen. The argument is short, ugly, settles nothing.",
      "Same colour palette. That is enough for {a}. She holds up her fabric, holds up {b}'s, goes \"explain this\" like a prosecutor. {b} tries. {a} does not hear any of it. The room has opinions but nobody wants to be in the middle.",
      "{a} walks past {b}'s station, looks down. \"Oh, you are doing that too.\" Sweet voice. Teeth in it. {b} says she came up with it herself. {a} says \"sure.\" {b} says she did. {a} says \"I said sure\" and walks away, which is not the same as believing her.",
    ],
  }),
  ev({
    id: 'talking-herself-out', slot: 'prep', cast: 'solo', weight: 2, needs: 'design',
    note: 'She has an idea, hears herself describe it, and abandons it for something safe.',
    arcs: ['filler', 'weakness'], when: f => st(f.a, 'boldness') <= 5,
    effects: { pop: { a: -1 }, state: 'playedSafe' },
    lines: [
      "{a} starts describing the concept out loud and you can hear her talk herself out of it in real time. \"I am going to do a whole —\" ends with \"actually I will just do a gown.\" The room watches the ambition leave her body.",
      "{a} had a vision. Drew it on the back of the brief and everything. Then she held it up, tilted her head, put it face down on the table. \"It is too much.\" Starts cutting a safe silhouette she knows she can finish. The judges will not see what {a} almost did.",
      "{a} pitches the idea to herself in the mirror and does not like what she hears back. Scraps the headpiece. Simplifies the shape. Ends up with an outfit nobody will hate and nobody will remember — the exact kind of safe that puts you in the middle of the pack.",
      "\"What if I —\" {a} stops. \"No.\" Picks up the scissors and cuts something predictable. Somewhere between the idea and the fabric it got smaller, and by the time she is sewing she has forgotten the version that might have won.",
    ],
  }),
  ev({
    id: 'doubling-down', slot: 'prep', cast: 'solo', weight: 1, needs: 'design',
    note: 'Everyone tells her the concept will not read. She does it anyway.',
    arcs: ['fashion', 'villain'], when: f => st(f.a, 'boldness') >= 7,
    effects: { pop: { a: 2 }, state: 'committed' },
    lines: [
      "Three queens tell {a} it will not work. {a} listens to all three, nods politely, keeps cutting the same pattern. She has either seen something they have not or she is about to crash. The room will have to wait until the runway to find out which.",
      "\"That is going to look crazy.\" {a} says \"good\" without looking up. The concept is enormous, impractical, probably impossible to walk in. She is building it anyway. The room has stopped trying to talk her out of it. {a} is not listening.",
      "The whole room thinks it is a mistake. {a} knows they think it is a mistake. She finishes the third panel, holds it up. \"Trust me.\" Nobody does. {a} does not care — in her head, this is already on the runway.",
      "{a} describes the concept and watches the faces go through concern, confusion, and something close to pity. She takes it all in, smiles. \"Watch.\" By the time she is halfway through building it, two queens who doubted her are watching from across the room. Not helping. Just watching.",
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
      "{a} sees {b}'s concept board and her face drops. That is her concept — or close enough. They both know only one of them can do it. Neither moves. Polite, then firm, then polite again, and at the end of it they are both still doing the same thing.",
      "\"We cannot both do this.\" {a} says it first, which is supposed to mean {b} should change. {b} does not change. {a} does not change. They spend the next hour working on identical ideas three stations apart, pretending the other one is not there.",
      "{b} holds up the reference photo. {a} holds up hers. Close enough that the room winces. Somebody suggests one of them pivot. Both say they had it first. The word \"first\" gets said four more times and settles nothing.",
      "They figure it out at the same time — {a} looks at {b}'s station, {b} looks at {a}'s. That look. The one where you realise the room just got smaller. Neither will admit who had it first, so they both keep going. The runway is going to be awkward.",
    ],
  }),
  ev({
    id: 'coaching-through-it', slot: 'prep', cast: 'pair', weight: 2,
    note: '{a} runs {b} lines or steps until {b} has it.',
    arcs: ['hero'], when: f => f.bond >= 1,
    effects: { bond: 1.5, pop: { a: 1 } },
    /* ── EVERY LINE HERE IS A PERFORMANCE, SO EVERY LINE IS TAGGED ──
       "Lines or steps" is the note, and a design week has neither. All four
       were untagged and the choreo one was drawn over a Design Challenge:
       one queen walking another through the steps of a number nobody is
       performing.
       Tagged per LINE rather than gated with a single `needs`, because the
       event is good on every performance night and each night wants a
       different sentence — the steps on a dance week, the line reading on an
       acting week, the lyrics on a singing week. With all four tagged it
       simply has nothing to say on a design night, and `drawWerkScene` will
       not pick an event with nothing to say — the same outcome a whole-event
       gate gives, while keeping it alive on the three nights it belongs to. */
    lines: [
      { needs: 'dance', line: "{a} runs the choreo with {b} four times. First three are bad. Fourth time something clicks — {b} hits the step and {a} screams like she won something. \"Again.\" {b} does it again. This time she does not need to be told where her arms go." },
      { needs: 'acting', line: "\"Say the line like you mean it.\" {b} says the line. \"No — like you MEAN it.\" {b} says it again. {a} shakes her head, does the line herself. The difference between how it sounds when {a} does it and when {b} does it is the whole lesson. Third try, {b} gets closer." },
      { needs: 'singing', line: "{a} catches {b} mouthing the lyrics wrong. Instead of laughing she pulls her aside and walks through it line by line, slow, until {b} has it. Twenty minutes {a} should be spending on her own performance. She spends them anyway." },
      { needs: 'acting', line: "They are in the corner going through the blocking and {a} is patient in a way she is not patient about anything else. Adjusts {b}'s stance, moves her shoulders back. \"There.\" Makes her hold it until it feels natural. Fifth run, {b} looks like a different queen. {a} says nothing about it — which is the compliment." },
    ],
  }),
  ev({
    id: 'panic-the-night-before', slot: 'prep', cast: 'solo', weight: 1, needs: 'design',
    note: 'She is nowhere near finished and the room can see it.',
    when: f => st(f.a, 'temperament') <= 5, effects: { pop: { a: -1 }, state: 'unfinished' },
    lines: [
      "It is late and {a} is still cutting. Bodice not right. Sleeves not right. Hem not started. She keeps picking things up and putting them down without finishing any of them. The queens still awake are watching without saying anything — there is nothing to say.",
      "{a} has a pile of fabric that is supposed to be a garment and a garment that is supposed to be finished. Neither thing is true. She is sewing fast — fast sewing is scared sewing, scared sewing makes mistakes, and mistakes take time she does not have.",
      "The room is emptying out and {a} is still at her station. Nine hours. The left side of the dress looks good. The right side does not exist yet. She is going to have to choose between finishing it badly or not finishing it. Everyone can see the math except her.",
      "Somebody asks {a} if she needs help. She says no too quickly. She does need help. The outfit is half-built, the challenge is tomorrow, and her eyes have the look of someone who knows exactly how far behind she is and is pretending she does not.",
    ],
  }),
  ev({
    id: 'winner-glow', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'Last week she won, and she walks back into the room differently.',
    arcs: ['frontrunner'], when: f => f.lastCall === 'WIN',
    effects: { pop: { a: 1 }, state: 'confident' },
    lines: [
      "{a} walks back into the room and does not need to say a word. The way she puts her bag down, looks at the mirror, takes her time — everything says she won last week and she knows it. A couple queens say congratulations. {a} thanks them like she expected it.",
      "Different energy to {a} this morning. Arrived first, set up without rushing, been humming since she sat down. She looks lighter. She looks like a queen who proved something last week and is still carrying the proof.",
      "{a} is glowing. The annoying kind — looks good without trying, answers questions without worrying, walks into the room like it was built for her. She earned it. That does not stop the rest of the room from noticing.",
      "Last week {a} was wound tight. This week she is loose, easy, smiling at things she would normally let pass. A win will do that. The judges said her name and everything heavy about the week before just lifted. She works with the posture of a queen who got told she is good at this.",
    ],
  }),
  ev({
    id: 'target-on-her-back', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'The room has noticed {a} keeps winning, and {b} says so, not entirely kindly.',
    arcs: ['frontrunner'], when: f => f.winsA >= 2,
    effects: { bond: -1, pop: { a: 1 } },
    lines: [
      "\"You are always up there,\" {b} says. Technically a compliment. Technically not. {a} takes it with a smile that says she heard the second part. The room has noticed {a} keeps winning. {b} is the one who said it out loud, and saying it out loud changes things.",
      "{b} watches {a} unpack her win from last week. \"Must be nice.\" Enough sugar on it that it could go either way. {a} chooses to take it well. {b} chooses to let her. But the line has been drawn and both of them know where it is.",
      "\"How many is that now?\" {b} asks — and she knows the answer, which is why the question is not really a question. {a} does not take the bait. She is smart enough to hear the edge underneath it. The room files this one away.",
      "\"You have been on a run.\" The way {b} says \"run\" sounds a lot like \"must be nice to keep being the favourite\" and {a} is not deaf. She says thank you. Does not say anything else. The room goes quiet a beat longer than it should.",
    ],
  }),
  ev({
    id: 'safe-again', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'Safe for the fourth time. She is starting to find that worse than being in the bottom.',
    arcs: ['filler', 'weakness'], when: f => f.safesA >= 3,
    effects: { pop: { a: -1 }, state: 'restless' },
    lines: [
      "Safe. Again. {a} sits at her station and does not celebrate because there is nothing to celebrate. Not bad enough to be in danger, not good enough to be noticed. That middle ground is starting to feel like quicksand.",
      "{a} is doing the maths. Four weeks of safe means four weeks the judges did not need to say her name. She has survived every week by being invisible, and she is starting to realise invisible is not a strategy — it is a symptom.",
      "\"I would rather be in the bottom than safe again.\" {a} means it. The room is not sure if that is brave or reckless. Being safe is supposed to be good. {a} does not feel good. She feels like she is on a show and nobody is watching her.",
      "Another week, another time the judges looked past her. {a} smiles because smiling is what you do, but the smile is getting thinner. She came here to be memorable. Instead she is furniture.",
    ],
  }),
  ev({
    id: 'bottom-hangover', slot: 'cold-open', cast: 'solo', weight: 2,
    /* BTM2, NOT BTM. The note says she survived the lip sync, and since the
       call was split into "named in the bottom and saved" (BTM) and "lip
       synced and survived" (BTM2) this gate had been firing for exactly the
       queens who never sang. The prose and the trigger described different
       nights for two plans. */
    note: 'She survived the lip sync and has to walk back in and be normal.',
    arcs: ['performance'], when: f => f.lastCall === 'BTM2',
    effects: { pop: { a: 1 }, state: 'rattled' },
    lines: [
      "{a} walks back in like someone who nearly did not walk back in. Puts her stuff down, sits at her station, stares at nothing for thirty seconds. \"You alright?\" \"Yeah.\" She is holding together with effort. She survived the lip sync. She has not finished processing that.",
      "The door opens and the room goes quiet — everyone wants to know who is coming back through it. {a}. She looks tired in a way makeup will not fix. Sits down, puts her hands flat on the table, breathes. \"That was close.\" It was.",
      "{a} is back and trying to be normal about it, which means she is not normal about it. Laughs too hard at the first joke, works too fast, talks too much. The lip sync was last night and it is still in her body — the adrenaline, the relief, the fear she will be back there next week.",
      "\"I am never doing that again,\" {a} says. Meaning the bottom two. Meaning the lip sync. Meaning the part where she stood on that stage and did not know if it was over. She might do it again. But the version that walked out last night and the version that walked in this morning are not the same queen.",
    ],
  }),

  // ══ THE EMOTIONAL REGISTER ═══════════════════════════════════════════
  ev({
    id: 'breakdown', slot: 'prep', cast: 'solo', weight: 1,
    note: 'It all arrives at once and she cannot hold it.',
    arcs: ['narrator', 'representation'], when: f => st(f.a, 'temperament') <= 4,
    effects: { pop: { a: 2 }, state: 'fragile' },
    lines: [
      "It comes out of nowhere. {a} is fine and then she is not fine — no transition. Puts her brush down, hands over her face, and cries in a way that has been building longer than today. The room does not rush over. Somebody puts a hand on her back and lets it stay.",
      "{a} tries to keep working through it and that is the part that breaks the room. The tears are running and she is still going, hands shaking too much for anything to land. She puts it down eventually. She has to. The work can wait. This cannot.",
      "She starts to say something about home and the sentence collapses halfway through. {a} sits on the floor — not a chair, the floor — and the room gets very quiet. Nobody tells her she is strong. They let it happen because it needs to happen.",
      "The mug {a} spent forty minutes on is gone in ninety seconds. Crying, laughing about crying, saying \"I am sorry\" to nobody. The queen next to her goes \"do not be sorry\" and means it. {a} will redo her face. She will be fine. Right now she is not fine and that is allowed.",
    ],
  }),
  ev({
    id: 'comforting', slot: 'prep', cast: 'pair', weight: 2,
    note: '{a} sits down next to {b}, who is not okay, and does not try to fix it.',
    arcs: ['hero'], when: f => f.bond >= 0,
    effects: { bond: 2, pop: { a: 2 } },
    lines: [
      "{b} is crying at her station and pretending she is not, which is somehow worse. {a} does not ask what is wrong. Sits on the floor next to the chair, close enough their shoulders touch, and stays. After a while {b} starts talking. {a} mostly says \"mm\" and \"yeah\" and does not once try to make it better. That is the correct thing to do.",
      "\"Do you want me to talk you out of it or do you want me to sit here?\" {b} says sit here. So {a} sits there, for a long time, and neither of them says much. At the end of it {b} is able to put her face back on.",
      "Middle of the afternoon and {b} has gone very quiet — which is louder than crying. {a} clocks it from across the room. Brings over two waters, puts one down, does not mention it, starts talking about absolutely nothing until {b} laughs — properly, wetly — and goes \"I hate you.\" She means thank you.",
      "{a} finds {b} in the corner and does not do the thing where you tell somebody they are strong. \"Yeah. This is hard. It is supposed to be hard.\" Lets it be true. {b} will remember that longer than she will remember what she was crying about.",
    ],
  }),
  ev({
    id: 'family-story', slot: 'prep', cast: 'pair', weight: 1,
    note: 'She tells the room about home. Not a sad story necessarily — a real one.',
    arcs: ['representation'], when: f => st(f.a, 'loyalty') >= 6,
    effects: { bond: 1.5, pop: { a: 3 } },
    lines: [
      "{a} starts telling {b} about where she grew up. Not the rehearsed version. Messy, specific, full of people the room will never meet. {b} listens without performing the listening, which is why {a} keeps going. By the end the room is quieter than it has been all day.",
      "\"My mother —\" {a} starts, then corrects herself. The correction tells {b} more than the rest of the story. Not sad, exactly. Real. A kitchen, a smell, a thing someone used to say. {b} nods because she has a version of this too.",
      "{a} tells {b} about the town and the bar and the first person who told her she was good at this. Tells it like she is seeing it again. The room slows down. Queens who were not listening start listening. {a} does not notice. She is somewhere else.",
      "{b} asks where {a} is from and {a} gives an answer that is longer and truer than either of them expected. The people who raised her, the ones who did not understand, the one who did. {b} does not say much. The right thing to do is not say much.",
    ],
  }),
  ev({
    id: 'the-first-time', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She talks about the first time she did drag, and it is not a polished anecdote.',
    arcs: ['representation', 'underdog'], when: f => true,
    effects: { pop: { a: 2 } },
    lines: [
      "{a} tells the room about the first night she did drag. Not the polished origin story. A borrowed wig, the wrong shoes, a bar where nobody knew her name. She did not look good. She did not feel good. But she went back the next week, and the week after that, and somewhere in the repetition she became this.",
      "\"I was terrible,\" {a} says, grinning. The first wig — crooked, cheap, wrong colour. The first lip sync — forgot the words, tripped over the monitor cable. The room is laughing because the queen telling the story is not that person anymore. Except she is.",
      "Somebody asks {a} when she started and she goes quiet for a second. A friend who dared her. A night that changed everything. A mirror that showed her someone she did not know she could be. She says it simply, no performance, and the room lets the sentence sit.",
      "{a} describes the first time she got into drag in a bathroom she should not have been in, using products borrowed from someone she has lost touch with, headed to a venue she was scared to walk into. She does not make it sound brave. She makes it sound necessary — which is different, and harder to say out loud.",
    ],
  }),
  ev({
    id: 'imposter', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She says out loud that she does not think she belongs here.',
    arcs: ['underdog'], when: f => st(f.a, 'temperament') <= 6,
    effects: { pop: { a: 1 }, state: 'fragile' },
    lines: [
      "{a} says it while she is working, not performing, which is how the room knows she means it. \"I do not think I am supposed to be here.\" Nobody argues. Somebody should. They let the sentence hang and {a} keeps working like she did not just say the truest thing she has said all week.",
      "\"Everyone in here is better than me.\" {a} says it flat, to the mirror. She is not fishing — she believes it. A couple queens try to correct her. {a} nods like she heard them, keeps working. She did not hear them.",
      "{a} looks at the row of stations and names, in her head, what every other queen is good at. Gets to her own station and draws a blank. She does not say it out loud. She does not have to. The way she is sitting says it — small, careful, taking up less room than she needs.",
      "It comes out mid-conversation, almost offhand: \"I keep waiting for them to realise they let the wrong person in.\" {a} laughs after she says it. The laugh is supposed to make it a joke. It is not a joke. The queen next to her knows it, squeezes her arm once, and they both go back to work.",
    ],
  }),
  ev({
    id: 'body-talk', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: 'Two queens getting undressed together, talking about their bodies without performing about it.',
    arcs: ['representation'], when: f => f.bond >= 2,
    effects: { bond: 1.5, pop: { a: 1, b: 1 } },
    lines: [
      "{a} and {b} are both getting padded and neither of them is performing about it. They talk about hips the way you talk about hips when nobody is watching — what works, what does not, what they wish they could change. The most ordinary conversation in the room and also the most honest one.",
      "They are getting undressed side by side and {a} says something about her body that is not a joke. {b} says something back that is not a joke either. For about three minutes they are two people being truthful about what they see in the mirror. Not a moment. Just real.",
      "{b} is taping and {a} is taping. \"I hate this part.\" \"Me too.\" They both laugh, but underneath it is a conversation about what it costs to do this — the discomfort, the negotiation with the body you have, the body you build on top of it.",
      "{a} catches {b} looking at herself in the mirror. Not the drag version — the in-between version. \"You look good,\" {a} says, and means the person, not the outfit. {b} says \"shut up\" but does not mean shut up. They go back to getting ready. Something shifted.",
    ],
  }),
  ev({
    id: 'apology', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'One of them apologises properly for something from last week.',
    arcs: ['villain', 'relationship'], when: f => f.bond <= -2,
    effects: { bond: 3, pop: { a: 2 }, state: 'mended' },
    lines: [
      "{a} pulls {b} aside before the room fills up. No preamble. \"I was wrong last week and I am sorry.\" Does not explain it, qualify it, or make it about herself. Says it and waits. {b} takes a breath, nods. The thing that was between them is smaller now.",
      "\"I owe you an apology.\" {a} says it looking at {b}, not the floor. Names the specific thing she did, says why it was wrong, does not ask for forgiveness — because asking is making it about you. {b} says \"thank you for saying that\" and they both go back to work.",
      "{a} sits at {b}'s station first thing in the morning with two coffees. Puts one down. \"I was terrible to you and I know it.\" {b} picks up the coffee. They talk for a few minutes, quiet, and by the end something between them has unclenched.",
      "{a} does not do it in front of the room. Waits until they are side by side at the mirrors, leans over. \"I should not have said that about you. I am sorry.\" {b} looks at her for a long time, then nods. Not forgiveness yet. The door to forgiveness opening.",
    ],
  }),
  ev({
    id: 'apology-refused', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'The apology is offered and not accepted.',
    arcs: ['relationship'], when: f => f.bond <= -5,
    effects: { bond: -1, pop: { b: -1 }, state: 'frost' },
    lines: [
      "{a} tries. Sits down, says the words, means them. {b} listens to the whole thing, waits until {a} is finished, and says \"okay\" in a tone that closes a door. {a} nods, stands up, walks back to her station. The apology was offered. It was not accepted. The room felt both.",
      "\"I hear you.\" The most devastating version of not accepting an apology — it acknowledges the words happened without agreeing they were enough. {a} does not push it. There is nothing to push against. {b} goes back to her mirror and the distance between their stations feels wider.",
      "{a} says she is sorry and {b} says \"I appreciate you saying that\" with the flattest delivery the room has heard all season. Not unkind. Just done. {b} has moved past the anger into something colder, and cold does not forgive the way hot does.",
      "{a} starts the apology and gets two sentences in before {b} holds up a hand. \"Not now.\" {a} stops. \"Not now\" might mean later. Might mean never. The way {b} says it does not clarify which. They both go back to work. The room exhales very quietly.",
    ],
  }),

  // ══ THE FUNNY ONES ═══════════════════════════════════════════════════
  ev({
    id: 'the-bit', slot: 'werk-morning', cast: 'solo', weight: 2,
    note: 'She starts a bit that runs all day and the whole room joins in.',
    arcs: ['narrator'], when: f => d(f.a).comedy >= 7,
    effects: { pop: { a: 3 }, state: 'roomBit' },
    lines: [
      "{a} starts a character voice at nine in the morning and by noon the entire room is doing it. Some persona — an assistant, a weather announcer, something specific — and everyone keeps adding to it. The bit has layers now. {a} started it but the room owns it.",
      "It begins when {a} narrates her own walk to the mirror in a voice that has no business being that funny. Third time she does it, two queens are answering in character. By lunch the room has a whole scene going that nobody planned and nobody wants to stop.",
      "{a} holds up a wig and pretends to be a judge critiquing it. The impression is so sharp the room loses ten minutes doing their own versions. It becomes the thing of the day — every decision narrated in the judge voice, every critique delivered with the same hand gesture.",
      "Nobody asked {a} to be the entertainment but she decided today she is. Assigns everyone a character from a show that does not exist, and within an hour the room is performing it — plot, villain, dramatic exit that gets more elaborate every time someone adds to it.",
    ],
  }),
  ev({
    id: 'impression', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: '{a} does an impression of {b} and it is devastatingly accurate.',
    arcs: ['narrator'], when: f => d(f.a).comedy >= 7,
    effects: { bond: 0.5, pop: { a: 2 } },
    lines: [
      "{a} does {b}. The walk. The hand on the hip. The way she says \"absolutely\" when she means maybe. Three seconds long and it is perfect. {b}'s face goes through six stages before landing on laughter, because the alternative is admitting how accurate it was.",
      "\"You know what you do?\" Then {a} does it — the exact way {b} checks her reflection, the exact pause before she answers a question. The room erupts. {b} goes \"I do NOT do that\" and every queen says \"you do that\" at the same time.",
      "{a} stands up, puts her shoulders back, tilts her chin, and becomes {b}. The posture, the voice, the little thing with the hands. Ten seconds. Devastating. {b} watches it happen and says \"I hate you\" with a grin that means she cannot believe how good it was.",
      "It starts with the walk. {a} crosses the room the way {b} does — deliberate, slow, the pause at the end — and by the time she turns around the room is dying. {b} is trying not to laugh. Failing. \"Am I really like that?\" The silence is the answer.",
    ],
  }),
  ev({
    id: 'joke-dies', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She tries for the room and gets nothing.',
    when: f => d(f.a).comedy <= 5, effects: { pop: { a: -1 } },
    lines: [
      "{a} goes for the joke and the room gives her nothing. Not silence — worse. The polite half-laugh that says we heard it but we are not going to pretend. {a} sits back down and does not try again all morning, which is its own kind of loud.",
      "Long setup. Confident delivery. The punchline lands on a room that does not react. {a} watches it die in real time. \"Okay.\" Turns back to her station. Comedy is timing and the timing was wrong and she knows it.",
      "{a} tells a joke that needed the room and the room was not in on it. Two queens smile. Nobody laughs. {a} tries to save it with a second pass — the second pass is worse, which is the rule. The rescue attempt always costs more than the original failure.",
      "\"You had to be there\" — except they were there and it still did not land. {a} delivers the line, waits for the reaction, gets a room full of queens looking at their mirrors. She learns something about her comedy she did not want to learn today.",
    ],
  }),
  ev({
    id: 'chaotic-good', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She does something completely unhinged and harmless and everyone loves it.',
    arcs: ['narrator'], when: f => st(f.a, 'boldness') >= 6,
    effects: { pop: { a: 2 } },
    lines: [
      "{a} arrives wearing the wig from last night’s runway as a hat — upside down, sunglasses perched on top. Acts like nothing is unusual. Pours coffee into a mug that says something unprintable. Starts the day like this is a normal person doing a normal thing.",
      { needs: 'design', line: "Nobody sees {a} do it, but when the room comes back from break every single mannequin head is facing the wall. {a} is at her station looking innocent. The investigation takes ten minutes. The laughter takes longer. She never admits it." },
      "{a} walks into the room on her knees, robe over her shoulders like a cape, doing a royal wave. Fully committed, absolutely insane. The room is screaming before she gets to her station. She stands up, dusts off her knees. \"Good morning.\"",
      "Somebody left a pair of heels unattended and {a} puts them on, adds a feather boa from the wall, and does a full runway walk around the room narrating her own critiques in both voices. So stupid and so committed the whole room stops working. When she is done she puts everything back exactly where she found it.",
    ],
  }),

  // ══ AFTER THE ELIMINATION ════════════════════════════════════════════
  ev({
    id: 'the-empty-station', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'She looks at the station of whoever went home last night.',
    when: f => f.someoneLeft, effects: { pop: { a: 1 }, state: 'sober' },
    lines: [
      "One station emptier and nobody has said so. {a} keeps almost looking at it. When she finally does, it is only for a second, then she picks her own brush up like nothing happened. That is what the room does now.",
      "Somebody already tidied the empty station, which is the worst part — looks like nobody was ever there. {a} stands in front of it on her way past. \"She should not have gone.\" Says it to nobody. Sits down.",
      "{a} is the first one back in the room. Has it to herself for ninety seconds. Uses them standing at the empty mirror, reading the message left on it, not touching anything. When the others come in she is already at her own station with her back to it.",
      "\"It is getting real now.\" {a} says it and the room does not answer, because everybody is thinking the same thing and saying it twice would make it heavier. The empty chair stays empty all day.",
    ],
  }),
  ev({
    id: 'the-mirror-message', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She reads the message the eliminated queen left in lipstick.',
    when: f => f.someoneLeft, effects: { pop: { a: 1 }, state: 'sober' },
    lines: [
      "{a} finds the message on the mirror before anyone else. Lipstick, the way queens do when they go — a couple of words and a name. She reads it twice. Does not wipe it off. Leaves it for the room, because it was meant for all of them.",
      "The lipstick is smudged where somebody wrote too fast. {a} stands there trying to make out the last word. When she gets it she does not say anything. Puts her hand on the glass for a second, right next to the writing, then walks away and starts her day.",
      "{a} is the one who reads the mirror message out loud, because someone has to. Reads it clearly, no commentary, and the room is quiet for a moment that belongs to the queen who left it. Nobody touches the mirror for the rest of the morning.",
      "There is a heart drawn in lipstick where her name used to be. {a} sees it first, calls the others over. They stand around the mirror reading the words she left. Short. Kind. {a} sits down and the room moves on because the room has to move on.",
    ],
  }),
  ev({
    id: 'relief-and-guilt', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She is glad it was not her and hates being glad.',
    when: f => f.someoneLeft && (f.lastCall === 'BTM' || f.lastCall === 'BTM2' || f.lastCall === 'LOW'),
    effects: { pop: { a: 1 }, state: 'sober' },
    lines: [
      "{a} is relieved and she hates that she is relieved. She survived and someone else did not. The maths is simple and ugly — their loss is her gain. She puts her face on and pretends she is not thinking about it. The mirror knows she is.",
      "First thing {a} feels sitting down this morning is glad. Second thing is ashamed of being glad. She was in the bottom. She stayed. The other queen went home. Somewhere in the middle of that is a person who is grateful it was not her, and she does not like that person very much right now.",
      "{a} should be celebrating — she is still here — but the way she is still here is by being the one who was slightly less bad. That is not the kind of victory that feels good. She is quiet all morning. Works. Does not talk about last night.",
      "Morning after and {a} is alive the way you are alive after something almost went wrong. She catches herself being happy and corrects it, then catches herself correcting it. The queen who left was her friend. {a} is still here. Both things are true and neither cancels the other.",
    ],
  }),
  ev({
    id: 'one-less-friend', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'The queen who went home was the one she was closest to.',
    arcs: ['relationship'], when: f => f.lostAFriend,
    effects: { pop: { a: 2 }, state: 'adrift' },
    lines: [
      "The queen who went home was the one {a} sat with, ate with, talked to at the end of every day. {a} looks at the empty station and does not cry, which is somehow more noticeable. She moves through the morning like she is looking for someone who is not there. Because she is.",
      "{a} keeps turning to say something to a station that is empty. Does it three times before she stops. Each time the pause where the answer would have been is longer. The room notices. Nobody fills the space. It was not their space to fill.",
      "\"She was my person in here.\" {a} says it once, early, and does not say it again. Works alone all day. Eats alone. She is not upset, exactly — she is recalibrating. Figuring out who she is in a room that no longer has the one person who made it make sense.",
      "The hardest part is not the missing queen. The hardest part is the room keeps going. {a} watches everyone work and laugh and argue and she wonders when she stopped being someone who could do that. The answer is last night, when her closest friend sashayed away.",
    ],
  }),
  ev({
    id: 'one-less-enemy', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'The queen who went home was the one she could not stand, and she is not pretending otherwise.',
    arcs: ['villain'], when: f => f.lostAnEnemy,
    effects: { pop: { a: -1 } },
    lines: [
      "{a} walks into the room, looks at the empty station, and does not pretend to be sad. \"Good.\" Under her breath but not far enough under. A couple queens hear it. Nobody challenges her — they all know who left and how {a} felt about her.",
      "The station is empty and {a} is lighter this morning. Physically lighter, like she has been carrying something that just got put down. She does not say anything unkind. She does not have to. The absence of grief is loud enough.",
      "{a} sits down, looks at the gap, sips her coffee with the energy of someone who has been waiting for this specific chair to be empty. Not cruel about it. Just honest. The honesty is that the room is better for her now.",
      "\"I am not going to pretend.\" And she does not. The queen who left made her life difficult every single day. Now she is gone and {a} is not hiding the relief. A few queens exchange looks. {a} does not care about the looks. She cares about having her room back.",
    ],
  }),

  // ══ THE ROOM AS A GROUP ══════════════════════════════════════════════
  ev({
    id: 'top-girls', slot: 'prep', cast: 'pair', weight: 1,
    note: 'Two queens who keep placing high quietly acknowledge that they are the two to beat.',
    arcs: ['frontrunner'], when: f => f.winsA >= 1 && f.winsB >= 1,
    effects: { bond: 1, pop: { a: -1, b: -1 } },
    lines: [
      "{a} and {b} are working near each other and they both know they are the two. Nobody else has their record. They do not say it — saying it makes them targets — but the way they glance at each other's work has changed from curiosity to measurement.",
      "\"You know it is going to be us at the end.\" {a} says it quiet enough the room does not hear. {b} does not argue. Nods once. They go back to their stations and work harder than before. The respect is real, which is exactly why it is also dangerous.",
      "{b} and {a} end up at the mirror at the same time. \"I am glad you are still here,\" {b} says, and means it. The part she does not say is she is glad because she wants to beat {a} when it matters, not have her go early to someone worse. {a} hears both parts.",
      "Having coffee, talking about nothing. {a} says \"I think we are the ones who make it.\" {b} says \"I think so too.\" For a second they are allies and rivals in the same breath. Neither will say this in front of the group.",
    ],
  }),
  ev({
    id: 'the-underestimated', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: '{b} says something dismissive about {a} that {a} decides to keep.',
    arcs: ['underdog'], when: f => f.bond <= 2,
    effects: { bond: -1, pop: { a: 2 }, state: 'fuel' },
    lines: [
      "{b} says it to the room, not to {a}, which is the part that stings. \"I do not see it.\" Four words about {a}'s chances, said while {a} is right there, said like it is obvious. {a} hears it. Files it. Will use it later, on the runway, when it matters.",
      "\"She is sweet but she is not a threat.\" {a} is standing close enough to hear every word. Does not correct her. Goes back to her station and works with the kind of focus you only get from someone who just got told she cannot do the thing she is about to do.",
      "{b} ranks the queens out loud — a game, not meant to be cruel — and puts {a} near the bottom. {a} laughs along. Does not argue. But the way she picks up her scissors afterwards is different. If {b} were watching she would see it. {b} is not watching, which is {b}'s mistake.",
      "{a} overhears {b} telling someone she is not ready for this level. The sentence does not make {a} angry — it makes her quiet, which is worse. She tucks the words away in the part of her brain where fuel lives. She will pull them out the night she needs them most.",
    ],
  }),
  ev({
    id: 'group-singalong', slot: 'prep', cast: 'solo', weight: 1,
    note: 'The whole room ends up singing along to something and forgetting the competition for four minutes.',
    when: f => true, effects: { pop: { a: 1 }, state: 'roomWarm' },
    lines: [
      "{a} starts humming. Someone joins in. Someone else joins in. Ninety seconds and the whole room is singing the same song. Nobody planned it. For four minutes there is no challenge, no judges, no runway — just queens making noise together.",
      "{a} plays something on her phone and the first queen who hears it starts singing. By the chorus every station has stopped working. Singing, badly, happily, at a volume that makes the mirrors shake. When it ends somebody says \"one more\" and they do one more.",
      "The room is tense. Then {a} starts singing under her breath, somebody picks it up, somebody harmonises, and within a minute the whole room is doing the thing where you sing together and nobody is performing it. Just being loud about something that is not the challenge.",
      "{a} does a run — an actual, full, vocal run — and the queen next to her gasps. \"Do that again.\" {a} does it again. The whole room applauds like they are at a different show. For a few minutes the machines are quiet and nobody remembers what they were worried about.",
    ],
  }),
  ev({
    id: 'the-critique-post-mortem', slot: 'werk-morning', cast: 'pair', weight: 2,
    note: 'They rehash what the judges said last week, and disagree about it.',
    when: f => f.episode > 1, effects: { bond: -0.5, pop: { a: 1 } },
    lines: [
      { needs: 'design', line: "\"Did you hear what the judges said about the construction?\" {b} heard. They disagree about what it meant. {a} thinks proportion. {b} thinks fabric choice. Ten minutes of back and forth and neither changes the other's mind." },
      "{a} thinks the judges were wrong about {b}. {b} does not think the judges were wrong about {b}. Awkward thing to disagree about — one of them is saying \"you deserved better\" and the other is saying \"no, I earned that.\"",
      "\"They clocked you for the same thing they praised her for.\" {b} looks up, because {a} is right and it is the kind of right that makes the whole judging feel uneven. They talk about it — not loud, but with enough heat that the queens nearby start listening.",
      "{b} replays the judges' comments word by word. {a} offers a different reading — not better, just different — and it turns into a debate about whether the judges even saw the same outfit {b} sent down the runway. By the end they have not agreed on anything, but they both feel heard.",
    ],
  }),
  ev({
    id: 'settling-in', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'Early season. She is still working out who everybody is.',
    when: f => f.phase < 0.45, effects: { pop: { a: 1 } },
    lines: [
      "{a} is still learning who everyone is. Watches from her station — who talks to whom, who works alone, who fills the silence, who sits in it. She has not figured out where she fits yet. The not-knowing is exciting and uncomfortable, like the first week of any room.",
      "The room is full of people {a} does not know yet. She is paying attention the way you do when everything is new. Who is funny, who is serious, who takes up space, who gives it away. By the end of the week she will have a map.",
      "{a} is still in the phase where she laughs at every joke, agrees with every opinion, mirrors whoever she is next to. She has not found her voice in the room yet. Still borrowing everyone else's, and the room is too new for anyone to notice.",
      "Early days. {a} is being careful — opinions, humour, how much space she takes. The room has not settled yet. Nobody knows who is an ally and who is a rival. Until that shakes out she is going to keep being polite and watching.",
    ],
  }),
  ev({
    id: 'the-getting-close-talk', slot: 'werk-elim-day', cast: 'solo', weight: 1,
    note: 'Late season. The number left is small enough to say out loud now.',
    when: f => f.phase > 0.6 && f.roomSize <= 6,
    effects: { pop: { a: 1 }, state: 'endgame' },
    lines: [
      "{a} counts the stations out loud and does not like the answer. The room that started full now fits in a glance. \"It is getting small in here.\" She means it both ways — the room is the same size but the space to hide has gone.",
      "\"There are not many of us left.\" {a} says it to the mirror. The number sits in the room like furniture. Small enough that everyone knows where they stand and nobody can pretend they do not.",
      "{a} looks at the queens who are left and realises she likes every one of them, which is a problem — some of them are going home and she is going to have to watch. The room is warmer now than at the start. Also more dangerous. She can feel both.",
      "The room is small enough that {a} can hear every conversation from her station. Who is nervous, who is confident, who is pretending. No hiding at this stage. Every choice is visible. Every runway is a statement. The weight of that shows in how carefully she works.",
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
      "{a} is the first one back. Turns the lights on, walks past the stations, sits at hers in the quiet. Empty chairs, silent machines, mirrors that are just mirrors when nobody is in front of them. Different room without people in it.",
      "The door opens and {a} walks into a room with nobody in it yet. Puts her bag down, sets up her station the way she likes it, and has ninety seconds of peace. She uses them to breathe, to think about nothing, to be a person before she has to be a queen.",
      "{a} arrives before the call and the werkroom is hers alone. No music, no chatter, no machines. She walks the length of the mirrors, touches the edge of her station, sits down in the kind of silence that only exists when you are the first person somewhere.",
      "There is a version of the room that only exists at this hour, before the rest arrive. {a} has it to herself. She sits. Breathes. Looks at the mirrors like a menu for a day that has not started. When the first voice comes through the door the room changes — but for one minute it was hers.",
    ],
  }),
  ev({
    id: 'coffee-and-silence', slot: 'werk-morning', cast: 'pair', weight: 2,
    note: 'Two queens who are not really awake yet, being companionable about it.',
    when: f => true, effects: { bond: 0.5 },
    lines: [
      "{a} and {b} are both holding coffee and neither is talking. Close enough that it is companionable, far enough that it is not a conversation. One sighs. The other nods. That is all the communication the morning requires.",
      "Too early for words. {a} and {b} are at their stations with their mugs. Not performing, just existing side by side in that pre-drag state where the wig is off and the defences are down. One yawns. The other yawns back. That is the whole scene.",
      "{b} puts a coffee on {a}'s station without being asked. {a} drinks it without saying thank you — at this hour \"thank you\" is too many syllables and the coffee says it better. They sit in the quiet and let the morning happen around them.",
      "{a} and {b} are both non-morning people and they have found each other the way non-morning people do — by the coffee, by the silence, by the understanding that nothing said before the second cup actually counts.",
    ],
  }),
  ev({
    id: 'unpacking-the-night', slot: 'cold-open', cast: 'pair', weight: 2,
    note: 'They go back over what happened on the main stage, still processing it.',
    when: f => f.episode > 1, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "{a} and {b} are still processing last night. \"Did you see her face when they called the bottom?\" They go through it moment by moment — the call, the reaction, the lip sync, the decision — trying to make sense of it now that the adrenaline is gone.",
      "\"I thought they were going to say my name.\" {a} says it. {b} says \"me too\" and the honesty opens the conversation. What the judges saw, what they missed, whether last night changed anything. By the end they are both looking at today differently.",
      "\"Last night was wild.\" {a} agrees. They pick apart the critiques, the moment when the whole room held its breath. The kind of analysis that only makes sense when you are in it. Outside this room it would sound obsessive. In here it is just morning.",
      "They are both replaying it. {a} goes through what the judges said and {b} interrupts with what the judges meant. They disagree, and the disagreement is useful — shows them both angles they did not have last night. The main stage always looks different the morning after.",
    ],
  }),
  ev({
    id: 'still-in-last-nights-face', slot: 'werk-morning', cast: 'solo', weight: 1,
    note: 'She never took the makeup off and the room can tell what kind of night she had.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} walks in still in last night's face. Lashes off but the foundation is there, liner smudged. She sits down, stares at the mirror, and does not start getting ready. She starts getting present.",
      "The eyeliner from the runway is still on and {a} has not tried to fix it. That tells the room everything about the kind of night she had. She sat in bed going over every second of the main stage. She will take it off. She will get ready. But right now she is still in last night.",
      "{a} arrives looking like a queen who fell asleep in her makeup, because she did. One side of the liner is sharp. The other side is on the pillow somewhere. She does not rush to fix it. Lets the room see her like this — either vulnerability or exhaustion, and this morning they are the same thing.",
      "Glitter in {a}'s hairline. Lipstick smudge on her jaw. She walks in like neither exists. The room clocks it immediately. \"Rough night?\" {a} says \"I do not want to talk about it\" with a grin that means she absolutely wants to talk about it. Just not yet.",
    ],
  }),
  ev({
    id: 'counting-the-chairs', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She works out how many are left and says the number out loud.',
    when: f => f.episode > 2 && f.someoneLeft, effects: { pop: { a: 1 }, state: 'sober' },
    lines: [
      "{a} counts the chairs. Out loud, pointing at each one. Gets to the number and says it again. The room does not need her to explain what it means. Everyone has been counting. She is just the one who said it.",
      "\"How many are we now?\" {a} counts before anyone answers. The number is smaller than it was. Always smaller. She says it with the tone of someone realising for the first time that she might actually win this thing.",
      "{a} looks at the empty stations and the occupied ones and says a number into the room. Nobody responds because the number does not need a response. Fewer of them than there used to be. Every week the fact gets heavier.",
      "{a} scans the room, counts the queens in it, nods to herself. The nod says: this is real now. The number is small enough that everyone left is someone she knows, someone she has worked beside, someone she will have to beat.",
    ],
  }),
  ev({
    id: 'tuck-and-tape', slot: 'werk-elim-day', cast: 'pair', weight: 2,
    note: 'The unglamorous mechanics of getting into drag, done side by side.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "{a} and {b} are side by side doing the unglamorous part — taping, tucking, padding. The part nobody puts on a poster. Passing the tape without looking, complaining about the same things they always complain about. Routine. Also the most intimate the room gets.",
      "\"Hand me the tape.\" {b} does not specify which tape. {a} knows which tape. That is what happens when two queens get into drag next to each other long enough — shorthand replaces the sentence. \"Higher.\" \"Hold this.\" \"Zip me.\"",
      "{a} is padding and {b} is taping and neither is performing about it. The process of turning into a drag queen is mechanical, sweaty, and involves a lot of medical tape. Doing it next to someone means you have seen them at their least glamorous, which is its own kind of bond.",
      "They are in the in-between stage — not boy, not queen, somewhere in the middle where the padding is on but the face is not. {b} goes \"I look insane\" and {a} says \"you look exactly how I look\" and they both laugh at the absurdity of what they are about to become. Getting into drag is ridiculous. They love it.",
    ],
  }),
  ev({
    id: 'last-look', slot: 'werk-elim-day', cast: 'solo', weight: 2,
    note: 'Fully painted, alone with the mirror for a second before the stage.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} is fully painted, fully dressed, and alone with the mirror for the first time all day. She looks at herself — not the way you check makeup, deeper than that, the way you look at a person you built. Adjusts one thing. Stops adjusting. Just looks. The queen in the mirror looks back.",
      "Everyone else is still getting ready. {a} is done. She stands in front of the mirror in the finished look — the wig, the jewellery, the silhouette, the thing she imagined when she cut the first pattern. Not perfect. Close. She nods once to herself. That nod is the moment before the stage.",
      "{a} turns in the mirror, checks the back, checks the side, faces forward and holds still. This is the version of herself she is sending out tonight. For a second she is not a queen in a challenge — she is a person looking at what she made, and it is enough.",
      "The room is chaos behind her. {a} does not hear it. Standing at the mirror with her eyes on her own eyes. The look she gives herself is not vanity — it is recognition. She knows what she looks like. She knows what it cost. Breathes in, breathes out, turns to walk to the stage.",
    ],
  }),
  ev({
    id: 'zip-me-up', slot: 'werk-elim-day', cast: 'pair', weight: 2,
    note: 'The smallest favour in the room, asked of somebody she is not close to.',
    when: f => true, effects: { bond: 1 },
    lines: [
      "\"Zip me up?\" {b} is the closest queen. Not the closest friend — the closest body. {b} zips. {a} says thanks. {b} says you are welcome. Smallest interaction in the room. Means almost nothing, except they are in the same place doing the same thing, and that counts.",
      { needs: 'design', line: "{a} cannot reach the back of the dress. Turns to {b}, who she has barely spoken to all week. \"Can you get this?\" {b} pulls the zipper up, smooths the fabric without being asked, pats her shoulder once. They do not discuss it. Just a thing queens do for each other." },
      "Zipper stuck. {a} is twisting in front of the mirror trying to reach it. {b} sees her, comes over without being asked, works it loose. \"You have something caught in it — there.\" Thanks. Shrug. Back to their stations. Fifteen seconds.",
      "{a} holds the back of her dress closed and looks around for anyone. {b} catches her eye. \"Please.\" {b} walks over, zips it, says \"you look good\" — not a compliment, a fact — and walks back. {a} did not expect kindness from that direction. Zipper up. Wall between them slightly down.",
    ],
  }),
  ev({
    id: 'good-luck-she-means-it', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: 'One of them wishes the other luck and it is not a performance.',
    when: f => f.bond >= 1, effects: { bond: 1, pop: { a: 1 } },
    lines: [
      "{a} touches {b}'s arm on the way past. \"Good luck tonight.\" Quiet, no audience. {b} says it back. They hold eye contact a second longer than they need to. The moment is real, and then they are both walking to the stage.",
      "\"You are going to be amazing.\" Not the throwaway version. {a} stops, looks at {b}, says it with the weight of someone who watched her work all week. {b} does not know what to do with sincerity this close to the runway. She hugs {a} instead of answering.",
      "{a} catches {b} before the door. \"I hope you get what you deserve tonight.\" Means it as kindness, which {b} can tell — the unkind version sounds completely different. {b} smiles. They walk out together. The room is behind them now.",
      "{a} says \"hey\" — just that — and {b} looks back. \"Kill it.\" Two words. No performance. {b} nods and the nod has gratitude in it. They go out separately because this is still a challenge, but for a second it was just two queens who wanted the best for each other.",
    ],
  }),
  ev({
    id: 'good-luck-she-does-not', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: 'Same words, entirely different meaning, and both of them know it.',
    arcs: ['villain'], when: f => f.bond <= -1,
    effects: { bond: -1, pop: { a: -1 } },
    lines: [
      "\"Good luck.\" {a} says it to {b} with the kind of smile that means I hope you need it. {b} smiles back the same way. They both know what just happened. Words right, meaning wrong, and neither is going to break the performance.",
      "{a} squeezes {b}'s shoulder. \"You got this.\" Warmth so convincing anyone watching would think they were friends. They are not friends. The squeeze is a message — I am better than you and we both know it — wrapped in a gesture nobody can call unkind.",
      "\"I really hope it goes well for you tonight.\" Sweet, sincere, directly to {b}'s face. {b} thanks her. The room sees a nice moment. The room is wrong. {a} hopes nothing of the sort. The sweetness was a weapon.",
      "{a} wishes {b} luck right before they walk out — timing deliberate, too close to the stage for {b} to respond properly, far enough that the room sees {a} being gracious. {b} says \"thanks\" through a smile holding back something sharper.",
    ],
  }),
  ev({
    id: 'running-late', slot: 'werk-elim-day', cast: 'solo', weight: 1,
    note: 'The call comes and she is nowhere near ready.',
    when: f => true, effects: { pop: { a: -1 }, state: 'lostTime' },
    lines: [
      "The call comes and {a} is holding one shoe. The other shoe is somewhere. Wig on but the lace is not glued. Left earring in, right one on the floor. \"No no no no no\" — the sound of a queen who is running and knows she is running.",
      { needs: 'design', line: "{a} hears \"places\" and freezes. The garment is not steamed. Accessories not chosen. She grabs the first thing she can reach, clips the second, and walks to the door still adjusting her neckline." },
      { needs: 'design', line: "Everyone else is lined up. {a} is still at her station, still pinning, still making decisions that should have been made an hour ago. Finishes the last pin as the door opens, grabs her clutch, walks out still adjusting the neckline. Will adjust it all the way to the stage." },
      "\"I need five minutes.\" {a} does not have five minutes. She has ninety seconds and uses them like a person defusing something — fast, precise, no wasted movement. Wig on. Jewellery on. One last look she does not have time for. {a} walks to the stage wearing an outfit that was still being built ten seconds ago.",
    ],
  }),
  ev({
    id: 'the-quiet-before', slot: 'werk-morning', cast: 'solo', weight: 2,
    note: 'She has a plan for today and is turning it over before saying it to anyone.',
    when: f => true, effects: { pop: { a: 1 } },
    lines: [
      "{a} is at her station before the room wakes up, turning a thought over. A plan for today — not flashy, just clear — rehearsing it in her head before she says it to anyone. Coffee getting cold. She does not notice. Already inside the challenge.",
      "The brief is on the table and {a} has read it three times. Nobody else is reading it three times. Chin on fist, looking at something that is not on the wall. \"What are you thinking?\" \"I am still thinking.\" That is the end of the conversation.",
      "{a} is quiet this morning and the quiet is not worried — it is planning. Sketches something on the back of a page, crosses it out, sketches it again. She has not spoken to anyone yet but she will once she has something worth saying.",
      "Everyone else is chatting. {a} is not. She is working something out — mouthing words, counting on her fingers, staring at the brief like it owes her money. She will talk to the room when she has a plan. Right now she has a hunch.",
    ],
  }),
  ev({
    id: 'who-is-the-threat', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'They talk about who is actually good at this, and one name keeps coming up.',
    arcs: ['frontrunner'], when: f => f.episode > 2,
    effects: { bond: 0.5, pop: { a: -1 } },
    lines: [
      "\"Who do you think is going to take it?\" {a} asks. {b} gives the honest answer, and the honest answer is a name they both keep circling back to. The track record, the consistency, the way the judges look at her. Neither says \"it should be me instead\" but they are both thinking it.",
      "{a} and {b} are ranking the room and they keep agreeing, which is worse than disagreeing because it means the answer is obvious. There is a queen in here who is better than both of them and they can see it.",
      "\"She is going to win.\" {a} says it not bitter, just clear. {b} does not argue. They talk about the queen they are both watching, the one whose name keeps coming up. The conversation is honest and a little bruising and neither of them feels better for having it.",
      "{b} says a name and {a} nods. They have both been thinking it. The room has a frontrunner and everyone knows who it is. This is the version of the conversation where you admit it quietly, away from the mirrors, where the admission cannot be used against you.",
    ],
  }),
  ev({
    id: 'sizing-up-the-brief', slot: 'prep', cast: 'pair', weight: 2,
    note: 'Two queens reading the challenge brief and arriving at opposite conclusions.',
    when: f => true, effects: { bond: 0.5, pop: { a: 1 } },
    lines: [
      "{a} and {b} read the brief at the same time and arrive at completely different conclusions. {a} thinks one thing. {b} thinks the opposite. They argue — not angrily, productively — and neither changes their mind. At least one of them is going to be wrong on the runway.",
      "\"That is not what this means.\" {b} points at the brief. {a} points at the same line — \"that is exactly what it means.\" They read it out loud together, word by word, and by the end they are more confused than at the start. Back to their stations having learned nothing and gained a conversation.",
      "{a} reads the brief and sees an opportunity. {b} reads it and sees a trap. They compare notes over coffee and realise they are reading the same words differently. The runway will tell them which reading was right.",
      "\"What do you think they want?\" {b} says what she thinks. {a} says \"I thought the opposite\" and they both laugh — neither is sure. The brief is deliberately open, which means the queen who reads it bravely will either win or crash. The one who reads it cautiously will be safe and forgotten.",
    ],
  }),
  ev({
    id: 'head-down-working', slot: 'prep', cast: 'solo', weight: 2, needs: 'design',
    note: 'No drama. She works, and it is going well, and that is the scene.',
    when: f => true, effects: { pop: { a: 1 }, state: 'onTrack' },
    lines: [
      "No drama. {a} is working and it is working. Seams straight, vision clear, humming to herself while the room does the room's thing around her. Sometimes the story is not a crisis. Sometimes it is a queen who knows what she is doing, doing it.",
      "{a} has her head down and her hands moving. The outfit is taking shape the way outfits are supposed to — steadily, piece by piece, no panic. She does not need help. Does not need encouragement. Needs to be left alone. The room obliges.",
      "The room is loud. {a} is in the middle of it, sewing. If you did not look closely you would think she was not paying attention to anything except the fabric. She is paying attention to everything. She just does not need to react to any of it.",
      "{a} is having the kind of day where the garment cooperates and the machine behaves and the concept she drew on the napkin is becoming the thing she drew on the napkin. Boring to describe. Best feeling in the room. She will not talk about it — talking about it is how you ruin it.",
    ],
  }),

  // ══ WHAT THE TRACK RECORD DOES TO A ROOM ═════════════════════════════
  //
  // Being the frontrunner, being permanently safe, and living in the bottom
  // are the three states this competition puts a queen in, and each one costs
  // her something socially. Before these, six of sixty-two werk room events
  // read the record at all and they fired about four times a season between
  // them — the chart was a scoreboard nobody in the room reacted to.
  //
  // Every one of these takes its trigger from `state.record`, so the drama
  // follows the season that actually happened rather than a die roll.

  // ── the frontrunner ──
  ev({
    id: 'frontrunner-iced-out', slot: 'werk-morning', cast: 'pair', weight: 2,
    note: '{a} keeps winning and the room has quietly stopped including her.',
    arcs: ['frontrunner'], when: f => f.winsA >= 2 && f.bond <= 1,
    effects: { bond: -1, pop: { a: -1 } },
    lines: [
      "{a} walks over to where {b} and two others are talking. The conversation does not stop — it changes shape. Goes polite, general, about nothing. She stands in it for a minute and goes back to her station. Nobody was rude. That is somehow worse.",
      "It takes {a} three days to notice nobody asks her opinion any more. She asks {b} a question about the challenge, gets a real answer, conversation ends, {b} goes back to the group. Winning has made her a competitor and stopped making her a friend.",
      "\"We were just going to get food,\" {b} says, past tense, about a thing that has not happened yet. {a} says have fun. Sits back down with her back to the room and keeps working on something that does not need more work.",
      "The room has divided into people who are winning and people who are not, and {a} is the entire first category. {b} is polite to her and warm to everyone else. The difference is about four degrees. More than enough for {a} to feel it every time.",
    ],
  }),
  ev({
    id: 'frontrunner-asked-for-help', slot: 'prep', cast: 'pair', weight: 2, needs: 'design',
    note: '{b} swallows her pride and asks the queen who keeps beating her for help.',
    arcs: ['frontrunner'], when: f => f.winsA >= 2 && f.neverTopA === false && f.bottomsB >= 1,
    effects: { bond: 2, pop: { a: 2 } },
    lines: [
      "{b} has been staring at the same seam for an hour and finally walks over to the queen who has beaten her twice. Asks for help, which costs her something. {a} does not make her ask twice. Takes the garment, fixes it, hands it back.",
      "\"I hate that I am asking you this.\" {b} says it flat, holding a bodice that is not working. {a} laughs — \"ask me anyway\" — then spends forty minutes on it. Neither says the thing about competing. Understood and set aside.",
      "{a} sees {b} struggling from across the room and waits — offering would be worse than being asked — until {b} looks up. Then she comes over. Does not fix it for her. Shows her how, which takes longer and matters more.",
      "The frontrunner helping the bottom queen could read as condescension. It does not, because {a} does it without an audience and does not mention it afterwards. {b} notices that too. She will remember it when the room turns.",
    ],
  }),
  ev({
    id: 'frontrunner-cooling', slot: 'cold-open', cast: 'solo', weight: 2,
    note: 'She was the one to beat and has not been called in weeks.',
    arcs: ['frontrunner'],
    when: f => (f.winsA >= 2 && f.sinceTopA >= 2) || (f.winsA >= 1 && f.sinceTopA >= 3),
    effects: { pop: { a: -1 }, state: 'slipping' },
    lines: [
      "{a} won twice early and has not been called since. She is doing the arithmetic in the mirror this morning. Nobody has said anything. Nobody needs to. She knows what a cooling frontrunner looks like.",
      "There is a version of this season where {a} was the one to beat, and it was two weeks ago. She can feel the room's attention having moved somewhere else. Does not like how much she misses it.",
      "\"I peaked.\" {a} says it to the mirror, half-joking, entirely serious. Two wins in the first half and nothing since. She gets to work earlier than anyone and stays longer — either the fix or the panic.",
      "The queens winning now were nowhere when {a} was winning. She is trying very hard to be gracious about that. Mostly managing it. Mostly. She has caught herself watching the runway looks at the other stations more closely than she used to.",
    ],
  }),

  // ── the one who is always safe ──
  ev({
    id: 'coasting-called-out', slot: 'werk-morning', cast: 'pair', weight: 2,
    note: '{b} tells {a} she is coasting, and she is not entirely wrong.',
    arcs: ['filler', 'weakness'], when: f => f.safesA >= 3 && f.neverTopA,
    effects: { bond: -1, pop: { a: -1 } },
    lines: [
      "\"You have not been in the bottom once.\" Pause. \"You have not been in the top once either.\" {a} says that is called consistency. {b} says it is called invisible — then apologises for how that came out. Does not take it back.",
      "{b} means it kindly and it does not land kindly. \"I could not tell you what you did last week.\" {a} could. She remembers exactly what she did. The problem is nobody else does, and {b} just proved it out loud.",
      "The word {b} uses is \"safe\" and she uses it four times in one sentence. By the fourth one it has stopped being a category and started being a verdict. {a} takes it standing. She has been thinking it herself for a fortnight.",
      "\"When are you going to actually go for something?\" Fair question. {b} has no right to ask it. Both of those are true. {a} does not answer. Goes back to her station and takes the safe idea off the rack and puts it away.",
    ],
  }),
  ev({
    id: 'safe-pact', slot: 'prep', cast: 'pair', weight: 2,
    note: 'Two queens who have never been called agree to stop playing it safe.',
    arcs: ['filler'], when: f => f.safesA >= 2 && f.neverTopA && f.bond >= 1,
    effects: { bond: 2, pop: { a: 1 } },
    lines: [
      "{a} and {b} have both been safe every single week and they have both had enough. The conversation starts as a complaint and turns into a plan: neither plays it safe again. They shake on it, which is ridiculous. They both mean it.",
      "\"We are going to get sent home being boring.\" {a} says \"yes\" with real feeling. So they make each other a promise — the riskier idea, every week, from here. Most decisive either of them has been all season.",
      "Nobody has mentioned {a} or {b} in a critique yet, and at eleven at night they agree that being forgettable is a worse way to go home than being wrong. They swap the ideas they were each too scared to try. Both are better than what they had.",
      "The pact is simple. No more middle. {a} shows {b} the sketch she talked herself out of. {b} tells her to make that one, then shows {a} hers. Neither of them sleeps much afterwards.",
    ],
  }),
  ev({
    id: 'never-in-the-bottom', slot: 'cold-open', cast: 'solo', weight: 1,
    note: 'She has never stood in the bottom, and it has started to frighten her.',
    arcs: ['filler', 'frontrunner'], when: f => f.neverBottomA && f.roomSize <= 8,
    effects: { pop: { a: 1 }, state: 'untested' },
    lines: [
      "{a} has never been in the bottom. Not once. She used to say that with her chest. This morning she says it to the mirror and hears how it sounds: untested. Everyone left has fought for her spot at least once. She has not.",
      "The thing nobody tells you about never being in the bottom is you never find out whether you can win a lip sync. {a} knows every word of every song they have played this season. She has never had to prove it. That is starting to sit badly.",
      "\"I have never done it.\" {a} means the lip sync. The thing that decides everything. She has been safe or high every week and she is proud of that — and also aware it is the one line on her résumé with nothing written next to it.",
      "The room is down to a handful and {a} is the only one who has never stood on that stage waiting to be saved. It ought to be a comfort. This morning it feels like a debt she has not paid.",
    ],
  }),

  // ── the bottom ──
  ev({
    id: 'bottom-written-off', slot: 'werk-morning', cast: 'pair', weight: 2,
    note: '{b} has stopped treating {a} like somebody who will be here next week.',
    arcs: ['weakness'], when: f => f.bottomsA >= 2,
    effects: { bond: -2, pop: { b: -1 } },
    lines: [
      "{b} asks {a} for her mirror \"since you probably will not need it long\" and laughs like it was a joke. Lands as a joke for about a second and a half. {a} laughs too. Then she does not. The room is very busy looking at something else.",
      "It is in the small things. {b} plans around {a} rather than with her, talks about next week like {a} is not in it, started using the past tense. {a} notices every single one and says nothing. Files all of it.",
      "\"No offence\" — having already caused it — \"but you have been in the bottom twice.\" It is true. That is what makes it unanswerable. That is why {a} is still thinking about it at two in the morning.",
      "{b} does not think she has written {a} off. She would deny it. But she has stopped asking {a}'s opinion, stopped including her past Friday, started talking about the top five like the count is settled. {a} is not deaf and {a} is not stupid.",
    ],
  }),
  ev({
    id: 'bottom-defiance', slot: 'werk-elim-day', cast: 'solo', weight: 2,
    note: 'She has been in the bottom before and refuses to go quietly.',
    arcs: ['weakness', 'performance'], when: f => f.bottomsA >= 2,
    effects: { pop: { a: 2 }, state: 'defiant' },
    lines: [
      "{a} has stood in that bottom twice and survived it twice. She is putting her face on this evening like somebody who intends to do it a third time. \"They keep putting me down there. They keep having to keep me.\"",
      "There is a way queens look on elimination day when they know it might be them. {a} is not doing that. She is doing the other thing — harder look, bolder mouth, the song she actually knows. If it is her tonight, it will not be quiet.",
      "\"I am not scared of that stage any more.\" {a} says it flat. Not bravado. She has been on it twice and come back. Whatever happens tonight, the thing she used to be frightened of has already happened to her and she is still here.",
      "{a} does her mug slower than usual tonight. Harder. She has been in the bottom enough times to know exactly what it feels like to hear her name, and she has decided that if she hears it again she is going to make somebody work for it.",
    ],
  }),
  ev({
    id: 'bottom-solidarity', slot: 'cold-open', cast: 'pair', weight: 2,
    note: 'Two queens who have both been down there find each other.',
    arcs: ['weakness'], when: f => f.bottomsA >= 1 && f.bottomsB >= 1,
    effects: { bond: 3, pop: { a: 1 } },
    lines: [
      "{a} and {b} have both stood in that bottom and neither has to explain what the walk back feels like. They end up at the same station at the same hour for the third morning running. Neither planned it. Both needed it.",
      "\"You too?\" That is the whole conversation. {a} and {b} have both survived a lip sync and there is a version of friendship that only exists between people who have done the same frightening thing. This is it.",
      "The other queens ask what a lip sync is like. {a} and {b} do not have to ask — they have both been down there. They compare notes: the walk, the wait, the moment the music starts. It is a conversation nobody else in the room can join.",
      "There is a quiet at the far end of the room where {a} and {b} have started sitting. Not a strategic alliance. Not a friendship exactly. Two people who have both been told to fight for their lives, keeping each other company.",
    ],
  }),
  ev({
    id: 'bottom-blames-the-panel', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'She has been in the bottom twice and has opinions about why.',
    arcs: ['weakness'], when: f => f.bottomsA >= 2 && f.canScheme,
    effects: { bond: -1, pop: { a: -2 } },
    lines: [
      "\"They have decided who they like and it is not me.\" Unanswerable, unprovable, slightly poisonous. {b} makes a face that {a} chooses not to read. The panel did not decide anything. {a} was in the bottom because she was bad.",
      "{a} has a theory about why she keeps being in the bottom and the theory has nothing to do with {a}. {b} listens to ninety seconds of it before saying \"or the look was not finished\" — which lands badly, because it is the true answer.",
      { needs: 'design', line: "The story {a} is telling herself is that there is a narrative and she is on the wrong side of it. She tells it to {b} at length. {b} can hear, quite clearly, that {a} is describing her own hemline as a conspiracy." },
      "\"Twice. Twice, for things other people did worse.\" {b} does not agree and does not say so. The not-saying-so is loud enough that {a} stops talking. The complaint does not stay in that corner of the room either.",
    ],
  }),

  // ══ ROMANCE, WHICH IS NOT WHAT THIS SHOW IS ABOUT ════════════════════
  //
  // Deliberately small. Total Drama has a showmance pipeline because Total
  // Drama is partly about that; this show is about the work, and a drag season
  // that turned into a dating format would be the wrong show. What is true is
  // that people locked in a room together for two months sometimes fall for
  // each other, and it changes how they work.
  //
  // Every one is gated on `compatible` — the franchise's own attraction rule,
  // shared with the life layer, so drag never pairs people the rest of the
  // franchise would not — and on `romanceOpen`, which caps a season at two.
  // `alreadyPaired` stops a queen running three of them at once.
  ev({
    id: 'something-there', slot: 'prep', cast: 'pair', weight: 1,
    note: 'Two queens keep ending up at the same end of the room.',
    arcs: ['bond'],
    when: f => f.compatible && f.romanceOpen && !f.alreadyPaired
      && f.bond >= 3 && f.episode >= 2,
    effects: { bond: 2, pop: { a: 1 }, state: 'romance' },
    lines: [
      "{a} and {b} have been ending up next to each other in the werkroom every day this week. Neither of them is moving her station. Neither of them is saying anything about it.",
      { needs: 'design', line: "{a} and {b} keep finding excuses. A zip that needs doing up. A second opinion on a hemline that was fine. Everyone else worked it out a week before they did. Everyone else is being very kind about not saying so." },
      { needs: 'design', line: "\"You are in my light,\" {b} says, not moving. {a} does not move either. It goes on slightly too long to be nothing. Then somebody drops a glue gun and the moment goes wherever those go." },
      "Neither has said anything. {a} has started doing her face at the station next to {b}, which is further from the good mirror. {b} has noticed and has not mentioned it. That is roughly where they are.",
    ],
  }),
  ev({
    id: 'quiet-thing', slot: 'werk-elim-day', cast: 'pair', weight: 1,
    note: 'Whatever this is, it is happening on the worst possible night.',
    arcs: ['bond'],
    // THE CAP IS ON EVERY EVENT THAT STARTS ONE, not just the first.
    // This and `competing-with-her` both write `state: 'romance'` and
    // neither checked `romanceOpen` or `alreadyPaired`, so the season
    // limit only ever bound on one of the three ways in — a leak that
    // stayed invisible while the werk room drew four scenes a slot and
    // produced a third pairing the moment the rooms were sized to the cast.
    when: f => f.compatible && f.romanceOpen && !f.alreadyPaired
      && f.bond >= 5 && f.roomSize <= 9,
    effects: { bond: 2, pop: { a: 1 }, state: 'romance' },
    lines: [
      "Elimination day is a bad day to work out what you feel about somebody and {a} and {b} are doing it anyway. In a corner, quietly, one eye on the clock. \"If it is me tonight —\" \"Do not.\" That is the closest either gets to the actual sentence.",
      "They are competing against each other. Almost nobody left to hide behind. Extremely stupid time for this. {a} says so. {b} agrees. Neither moves away.",
      "{a} does {b}'s back zip on elimination day and it takes longer than a zip takes. Nothing is said. The room is loud at the other end. This corner is not.",
      "\"When this is over —\" {b} does not finish the sentence. {a} says \"yeah\" as though she had. Whatever this is, it has a date on it now. The date is after one of them goes home.",
    ],
  }),
  ev({
    id: 'competing-with-her', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'The thing between them is now a problem, because one of them has to lose.',
    arcs: ['bond', 'weakness'],
    when: f => f.compatible && f.romanceOpen && !f.alreadyPaired
      && f.bond >= 5 && f.bottomsB >= 1,
    effects: { bond: -1, pop: { a: 1 }, state: 'romance' },
    lines: [
      "{b} was in the bottom last week and {a} was not. This morning that fact sits between them like a third person. {a} tries to help. {b} lets her, hates letting her. Neither enjoys the ten minutes it takes.",
      "It was easier when they were both safe. Now {b} is fighting for her place and {a} is not, and every kind thing {a} says lands slightly wrong. \"Do not do that,\" {b} says. About nothing in particular. Meaning all of it.",
      "\"I cannot want you to do well.\" {b} says it plainly, no cruelty. \"I want you to do well and I cannot afford to.\" {a} says she knows. They work at opposite ends of the room for the rest of the morning.",
      "The problem with whatever {a} and {b} have is that one of them is going home first. This morning both are visibly aware of which one it currently looks like. Neither says it. It makes everything they do say sound careful.",
    ],
  }),
  ev({
    id: 'called-out-for-it', slot: 'werk-morning', cast: 'pair', weight: 1,
    note: 'A third queen has noticed, and does not think it is cute.',
    arcs: ['bond'], when: f => f.alreadyPaired && f.canScheme && f.bond <= 2,
    effects: { bond: -2, pop: { a: -1 } },
    lines: [
      "\"Are we all just going to pretend that is not happening?\" {a} says it to the room. The room does not answer, which is its own answer. Not really about them. About {a} deciding there is a bloc and wanting it named.",
      "{a} thinks it is convenient, and says so. \"Convenient\" is a much worse word than it looks. {b} tells her to leave it. {a} does not leave it. By lunchtime three people have heard the word and one has repeated it.",
      "{a} has counted the times those two queens helped each other this week. She has the number ready. Delivers it like evidence. Nobody asked for evidence. Now nobody can un-hear it.",
      "\"It is a race.\" {a} says it to nobody, loudly enough. Everybody knows exactly which two queens the remark is about. The room gets four degrees colder and stays there.",
    ],
  }),


  /* ══ THE ROOM, RATHER THAN TWO PEOPLE IN IT ═══════════════════════════
     Every event above is one queen or two, which is why a room of thirteen
     read as a series of private conversations happening in the same building.
     Most of what happens in a werk room happens in FRONT of people: a fight
     has an audience, a joke has a table, and being the queen who watched two
     others go at it is its own scene with its own consequences.
     `cast: 'group'` draws three or four — {a} and {b} are the two it is about
     and {c}, and sometimes {d}, are the rest of the room. The third is often
     just there, and just being there is the point. */
  ev({
    id: 'table-of-them', slot: 'werk-morning', cast: 'group', weight: 1.4,
    note: 'Three or four of them at one station, and it is genuinely funny.',
    arcs: ['bond'],
    when: f => f.groupSize >= 3,
    effects: { bond: 1, pop: { a: 1, b: 1 }, state: 'group-fun' },
    lines: [
      "{a} says something to {b} that was not meant to be funny. {c} repeats it back wrong from across the room — ten times funnier. {b} is on the floor. {a} is yelling \"that is NOT what I said\" through tears and {c} is already doing it again with a hand on her hip. No work gets done for fifteen minutes. Nobody cares.",
      "{b} and {c} are arguing about wigs. Not this week's wigs — wigs as a concept, the philosophy of wigs. {a} gets dragged in as judge, takes it so seriously she stands up and delivers a verdict with her hand out like she is on the panel. {c} screams. {b} throws a sponge. The whole station is chaos.",
      "{c} starts doing {a}'s runway walk across the room and {b} loses it — full-body, hands-on-knees, gasping. \"I do NOT walk like that.\" {c} does it again. Slower. With the exact pause {a} does at the end. {a} tries to be mad and cannot, because it is perfect.",
      "Worst gigs. {a} opens with a venue that did not have a stage. {c} tops it — venue did not have a door. {b} waits, sips her coffee, tells one about a bar where she was the entertainment AND the bouncer AND the sound system broke during her number. {a} and {c} put their brushes down. No beating that.",
      { needs: 'design', line: "{a} plays something on her phone and {c} starts doing the choreography — full out, heels on, knocking into {b}'s mannequin. {b} joins in. Then {a} joins her own song. Three queens in full padding doing a routine between two sewing machines. The rest of the room is screaming." },
    ],
  }),
  ev({
    id: 'watched-it-happen', slot: 'prep', cast: 'group', weight: 1.3,
    note: 'Two of them go at it and {c} is standing right there for all of it.',
    arcs: ['rivalry'],
    when: f => f.groupSize >= 3 && f.bond <= 0,
    effects: { bond: -1.5, pop: { a: -1, b: -1 }, state: 'group-fight' },
    lines: [
      { needs: 'design', line: "{a} and {b} go at it right there — voices up, fingers pointing — and {c} is four feet away holding a glue gun. She looks at the exit. Looks at her garment. Puts the glue gun down very carefully. Suddenly her hemline needs urgent attention on the far side of her station." },
      { needs: 'design', line: "{a} says something sharp to {b}. {b} fires back. It escalates in about three sentences. {c} is standing right there trying to thread a needle like her life depends on it. \"I can hear you,\" {c} goes, to nobody. Nobody hears her." },
      "{b} raises her voice at {a} and the whole room flinches except {c}, who keeps her face perfectly blank — not calm, blank, the drag queen version of a poker face. Everybody clocks that. Later both of them will corner {c} separately and ask \"so who was right\" and {c} will give two different answers and mean neither.",
      "\"Can we NOT do this right now?\" {c} says it loud enough that {a} and {b} both turn and look at her, and for one second she thinks it worked, and then {a} says \"this does not involve you\" and {b} says \"stay out of it\" and they go right back to it. {c} picks up her coffee and moves to the other end of the room.",
      "The fight between {a} and {b} is short and loud and ugly and {c} is trapped between their stations pretending to count rhinestones. When it ends — not because it is resolved, because they both run out of air — {c} exhales and {a} looks at her and says \"sorry you had to hear that\" and {c} says \"girl, the whole building heard that.\"",
    ],
  }),
  ev({
    id: 'pulled-into-it', slot: 'prep', cast: 'group', weight: 1.1,
    note: '{c} is dragged into a fight that was never hers.',
    arcs: ['rivalry'],
    when: f => f.groupSize >= 3 && f.bond <= -2,
    effects: { bond: -1, pop: { a: -1 }, state: 'group-drag-in' },
    lines: [
      "\"Ask {c}. Go on, ask her.\" {a} waves a hand at {c} like she is exhibit A, and {c} freezes with a pin in her mouth because she did NOT volunteer for this. {b} looks at her. {a} looks at her. {c} takes the pin out very slowly and says \"I am going to get coffee\" and walks away from both of them, which is the smartest thing anyone does all day.",
      "{a} turns to {c} mid-sentence — \"you were THERE, tell her\" — and {c}'s face does the thing where every possible answer is wrong. She heard it. She knows {a} is right. But saying so means {b} never speaks to her again, so she says \"I do not remember\" in a voice that convinces nobody.",
      { needs: 'design', line: "\"Everybody thinks so,\" {b} says, and {a} goes \"everybody?\" and stares directly at {c}, and {c} is suddenly the deciding vote in an election she did not know was happening. She says \"leave me out of this\" and {a} says \"that IS a side\" and {c} says \"girl, I have a GARMENT to finish\" and goes back to her station shaking her head." },
      "{a} drags {c} into it by name — \"even {c} said it\" — and {c} drops her scissors because she said nothing of the kind, or at least nothing she meant to be repeated in the middle of a screaming match. {b} turns to her. \"You said that?\" {c} mouths the words \"I am going to kill you\" at {a} over {b}'s shoulder.",
    ],
  }),
  ev({
    id: 'room-goes-quiet', slot: 'prep', cast: 'group', weight: 1.0,
    note: 'One of them is struggling and the whole room adjusts around her.',
    arcs: ['bond'],
    when: f => f.groupSize >= 3 && f.bottomsA >= 1,
    effects: { bond: 1.5, pop: { a: 1 }, state: 'group-care' },
    lines: [
      "{a} is not okay and the room knows it before {a} does. {b} turns the music down without being asked. {c} moves her stuff to the station next to {a}'s like she always works there. Nobody says \"are you alright\" because that question would make {a} have to answer it.",
      "{b} puts a water bottle on {a}'s table. {c} picks up the pattern piece {a} has been staring at for ten minutes and starts cutting it for her. \"I am fine,\" {a} goes. {b} goes \"obviously\" in a voice that means the opposite. {c} keeps cutting.",
      "{c} is the one who clocks it first — {a} has been at her station for an hour and has not picked up a single tool. {c} nudges {b}. {b} goes over with two coffees, sits down, and starts talking about absolutely nothing — her wig, her weekend, a thing her cat did — until {a} is laughing, wetly, without knowing when she started.",
      { needs: 'design', line: "\"Go take a walk,\" {b} says. {a} says she does not need to. \"Go take a walk,\" {c} says. {a} looks at both of them and her chin wobbles and she goes, and when she comes back her face is washed and {b} has reorganised her station and {c} has steamed the garment. Nobody mentions it. {a} sits down and gets back to work." },
    ],
  }),
  ev({
    id: 'three-way-read', slot: 'werk-morning', cast: 'group', weight: 1.2,
    note: 'A reading session that is affectionate right up until it is not.',
    arcs: ['rivalry', 'bond'],
    when: f => f.groupSize >= 3 && f.phase >= 1,
    effects: { bond: -0.5, pop: { a: 1, b: 1 }, state: 'group-read' },
    lines: [
      "{a} reads {b} and {b} screams. {b} reads {c} and {c} howls. {c} reads {a} and it is funny and sharp and everyone is dying — and then {a} fires one back at {c} that goes past the wig and into something real and the laugh comes half a beat late. {c} says \"okay\" in a voice that means we are done now.",
      "{b} and {c} are going back and forth — quick, vicious, funny, the whole room is living — and {a} jumps in with one that misjudges the room by exactly one notch. The other two keep smiling but the smiles have gone careful. \"Girl,\" {b} says, and the way she says it is a warning {a} does not hear.",
      "The reads are FLYING. {a} lands three in a row. {c} fires back with one so good that {b} has to sit down. For ten minutes this is the funniest room any of them has ever been in. Then {c} makes one about {a}'s drag — not {a}, her DRAG — and the air changes, because drag was not on the table.",
      "{a} takes her read well. {b} takes hers well. {c} laughs when hers lands but the laugh has no eyes in it and {a} catches it and {b} catches it and they both pivot to something safe so fast you would think they rehearsed it. {c} goes back to her mirror. The session is over.",
    ],
  }),
  ev({
    id: 'strategy-huddle', slot: 'werk-elim-day', cast: 'group', weight: 1.2,
    note: 'Three of them talking about who is going home, in the room where she is.',
    arcs: ['rivalry'],
    when: f => f.groupSize >= 3 && f.canScheme,
    effects: { bond: 1, pop: { a: -1 }, state: 'group-huddle' },
    lines: [
      "{a}, {b} and {c} are huddled at the far station talking elimination and they all keep checking the door. {a} says a name. {b} nods. {c} says \"I did not say anything\" while literally standing in the huddle. They are not as quiet as they think they are, and at least two other queens have already clocked the huddle.",
      { needs: 'design', line: "\"Who do you think it is tonight?\" {a} asks, and {b} says a name without hesitating, and {c} says \"same\" without looking up from her sewing, and suddenly three queens agree about a fourth and the fourth is ten feet away gluing rhinestones with no idea her name just came out of three mouths at once." },
      "{a} leans over to {b} and {c} and says \"between us\" — which on this show means the cameras, the editors, and every viewer at home will hear it — and lays out who she thinks is going. {b} winces because it is accurate. {c} says \"do not put this on me\" and then adds her own theory anyway.",
      "{c} keeps watch while {a} and {b} run the numbers out loud: who has been low, who the panel keeps saving, who is due. The maths is cold and correct and would destroy someone if overheard. \"We are terrible people,\" {b} says, and {a} says \"we are realistic people\" and {c} says \"we are both\" and goes back to work.",
    ],
  }),
  ev({
    id: 'someone-is-missing', slot: 'cold-open', cast: 'group', weight: 1.3,
    note: 'The morning after, and the room is arranged around a gap.',
    arcs: ['bond'],
    when: f => f.someoneLeft && f.groupSize >= 3,
    effects: { bond: 1, pop: { a: 1 }, state: 'group-gap' },
    lines: [
      "The station is still there. {a} sets her bag down two stations over and does not look at it. {b} puts a coffee on the empty counter like it is an altar offering and {c} says \"girl, she is not dead\" but does not move it, and by lunch somebody has parked a wig head on the chair wearing sunglasses and nobody admits to doing it.",
      { needs: 'design', line: "{a} walks in, says \"morning\" to the room and her voice hits the gap where one person used to answer. {b} is already at her station pretending to organise brushes. {c} reads the lipstick message on the mirror out loud — somebody had to — and when she finishes, all three of them start fussing with fabric at the same time like they rehearsed it." },
      { needs: 'design', line: "{b} says \"so\" and lets it hang there for about eight seconds. {a} picks up a garment and puts it back down. {c} finally says \"I keep turning around to ask her something\" and {a} says \"me too\" and {b} says \"she would hate this energy, let us work\" and they do, but the room stays quieter than it should be for another hour." },
      "{a} catches herself using the past tense inside ninety seconds and stops mid-sentence. {c} says \"you just said was\" and {a} says \"I know\" and {b} says \"we are all doing it, it is fine\" and then nobody talks for a while, which is the most honest thing any of them does all morning.",
    ],
  }),
  ev({
    id: 'everybody-in', slot: 'prep', cast: 'group', weight: 1.0, needs: 'design',
    note: 'The whole end of the room stops to help one queen finish.',
    arcs: ['bond'],
    when: f => f.groupSize >= 3 && f.bottomsA >= 1,
    effects: { bond: 2, pop: { a: 1, b: 1 }, state: 'group-rescue' },
    lines: [
      "{a} is staring at a garment that is not going to make it. {b} walks over, picks up the hem without asking. \"I am not being nice, I just cannot watch this.\" {c} is already threading a needle. {a} keeps her jaw tight because if she looks at either of them right now she is going to lose it.",
      "\"Give it here,\" {b} says, hand out, and {a} hesitates for exactly one second before handing the bodice over. {c} grabs the glue gun and says \"nobody talk to me for ten minutes\" and the three of them get a look onto a rail that {a} could not have finished alone and every single one of them knows it.",
      "The last hour turns into a factory floor — {a} stitching, {b} cutting, {c} pressing — and {b} says \"this is not charity, a room where someone walks out empty-handed is a worse room for all of us\" and {c} says \"also your taste is better when you are panicking\" and {a} laughs for the first time in three hours.",
      "{c} does the thing nobody wants to do: she unpicks twenty minutes of {a}'s work because it was wrong. {a} watches her rip every stitch and says nothing. {b} bites her lip because she called it an hour ago and the restraint of not saying so is the kindest thing anyone does all day. They finish with four minutes on the clock.",
    ],
  }),

  /* ══ MORE OF ALL THREE ═══════════════════════════════════════════════
     The rooms were sized to the cast and the pool became the ceiling: a
     thirteen-queen prep asks for thirteen scenes and gets eight, because
     eight is all that is eligible. These widen every room and every cast —
     solo, pair, and the couch — so the draw has somewhere to go.
     {a} and {b} are who it is about; {c} and {d} are the rest of the room. */

  // ── the morning ──
  ev({
    id: 'alone-in-the-room-early', slot: 'werk-morning', cast: 'solo', weight: 1.2,
    note: '{a} is in the room before anybody else and works in the quiet for '
      + 'twenty minutes, which is either discipline or not wanting to talk to '
      + 'anybody yet, and she is not saying which.',
    when: f => f.neverBottomA || f.winsA >= 1,
    effects: { pop: { a: 1 }, state: 'early' },
    lines: [
      { needs: 'design', line: "{a} is in the room before anybody else. Garment already on the form, tools already out. She sews for twenty straight minutes without a word. By the time the door opens she is a whole hour ahead." },
      { needs: 'design', line: "The lights are on and {a} is already at her station. Her coffee is cold — girl has been here a WHILE. No music, no mirror, just the machine going. She is getting it done before the room fills up and the real show starts." },
      "{a} walks in when the room is empty and sets up like she has done this a hundred times. No talking, no playlist. Just work. By the time the second queen walks in {a} has a full hour on everybody and it shows.",
      { needs: 'design', line: "Nobody sees {a} arrive. She is just there — station set, garment pinned, head down. She does not want company. She wants a head start, and by the time the room wakes up she already has one." },
    ],
  }),
  ev({
    id: 'naming-the-frontrunner', slot: 'werk-morning', cast: 'group', weight: 1.3,
    note: '{a}, {b} and {c} work out loud about who is actually winning this '
      + 'season, and the queen they name is not in the conversation, and one '
      + 'of the three of them is quietly offended not to have been named.',
    when: f => f.groupSize >= 3 && f.phase >= 1,
    effects: { bond: 0.5, pop: { a: 1 }, state: 'threat-talk' },
    lines: [
      "{a} says a name out loud — the queen she thinks is winning this whole thing. {b} goes \"oh one hundred percent.\" {c} nods. The queen they are talking about is across the room gluing rhinestones, no idea. {c} goes quiet after — girl just realised her name did not come up.",
      "\"Be honest. Who is taking this?\" {b} says a name without blinking. {c} goes \"same.\" {a} goes \"same.\" Three queens agree on a fourth and none of them are her. {c} thought she was in this conversation as a candidate, not a voter.",
      { needs: 'design', line: "{a}, {b} and {c} are ranking the season out loud at the far station. Track record, who the panel keeps saving, who is peaking. They all land on the same queen — and she is ten feet away sewing, does not hear a word. {b} goes \"it is not even close.\"" },
      "\"She is going to win,\" {a} goes, about a queen who is not in the room. {b} laughs. \"Obviously.\" {c} does not say anything for a few seconds — just recalculating. Her name was not the one they said and she felt that.",
    ],
  }),
  ev({
    id: 'unsolicited-advice', slot: 'werk-morning', cast: 'pair', weight: 1.2,
    note: '{a} tells {b} what she should be doing differently. {b} did not '
      + 'ask. The advice is correct, which is the annoying part.',
    when: f => f.bottomsB >= 1,
    effects: { bond: -1, pop: { a: -1 }, state: 'advice' },
    lines: [
      "{a} walks over to {b}'s station. \"Can I say something?\" She is going to say it regardless. Tells {b} exactly what is wrong, no sugarcoating. {b} goes \"thank you\" in a voice that means the dead opposite and goes back to work.",
      "\"You should change the neckline.\" {a} just says it, unprompted, from three stations away. {b} stares at her. The neckline IS wrong. That is the annoying part — {a} is right and {b} did not ask.",
      "{a} gives {b} a note on her construction. {b} did not ask for a note. \"I am trying to help,\" {a} goes. \"I know,\" {b} goes — coldest two syllables of the morning. The advice is correct. {b} will never admit that.",
      { needs: 'design', line: "{a} leans over and tells {b} what is wrong with her garment. Not mean about it — just blunt. {b} does not respond. Changes it later, in silence, when {a} is not watching, because the advice was right and saying so out loud is not happening." },
    ],
  }),
  ev({
    id: 'the-early-favourite', slot: 'werk-morning', cast: 'group', weight: 1.1,
    note: 'Somebody says out loud that {b} is going to win the whole thing '
      + 'and {b} has to stand there while {a} and {c} agree about her in the '
      + 'third person. It is a compliment and it is a target.',
    when: f => f.groupSize >= 3 && f.winsB >= 1,
    effects: { bond: 0.5, pop: { b: -1 }, state: 'painted-target' },
    lines: [
      { needs: 'design', line: "\"Let us be real — {b} is winning this.\" {a} says it right in front of {b}. {c} nods. {b} is standing there holding a glue gun while two queens discuss her in the third person. {b} goes \"stop\" and laughs but that laugh has teeth." },
      "\"She is the one to beat.\" {a} says it about {b}, to {c}, while {b} is three feet away. {b} goes \"I can hear you.\" {a} goes \"I know.\" That is the whole bit — a compliment and a target in the same sentence.",
      "{a} and {c} agree out loud that {b} is going to take the whole thing. \"You are making me a target,\" {b} goes. \"Girl, you made yourself a target the first week,\" {a} goes. {c} goes \"she is not wrong.\" {b} goes back to work.",
      "{a} calls {b} the frontrunner in front of {c}. {c} agrees immediately. {b}'s face cannot decide between grateful and panicked. \"Thank you and also stop talking,\" {b} goes — being named the favourite in this room is a bullseye and a compliment at the same time.",
    ],
  }),

  // ── prep ──
  ev({
    id: 'borrowed-and-not-returned', slot: 'prep', cast: 'pair', weight: 1.2, needs: 'design',
    note: '{a} has something of {b}\'s — a tool, a fabric, a wig cap — and has '
      + 'had it for two hours, and {b} needs it now and is being very polite '
      + 'about needing it now.',
    when: f => f.bond <= 2,
    effects: { bond: -1, pop: { a: -1 }, state: 'borrowed' },
    lines: [
      "{a} has had {b}'s scissors for two hours. {b} needs them. \"Whenever you are done\" — which means NOW — and {a} does not put them down for another ten minutes. {b} ends up cutting fabric with her teeth rather than asking twice.",
      "\"Sorry, can I just grab my — \" {b} reaches across {a}'s station. Borrowed at nine. It is past eleven. {a} goes \"oh, was that yours?\" Girl. {b} takes it back with a look that could strip paint.",
      "{b} has been waiting for her steamer back since morning. Three glances, two almost-asks, one very polite \"do you still need that.\" {a} hands it over like she is doing {b} a favour. THAT is the part that sticks.",
      "{a} borrowed {b}'s heat gun two hours ago. {b} needs it. \"Take your time,\" {b} goes, in a voice that means the OPPOSITE of take your time. {a} either does not hear the tone or does not care. {b} goes back to her station and improvises with a lighter.",
    ],
  }),
  ev({
    id: 'second-guessing-out-loud', slot: 'prep', cast: 'solo', weight: 1.3, needs: 'design',
    note: '{a} asks the room whether it is working. Nobody answers honestly, '
      + 'which she notices, and the not-answering tells her more than an '
      + 'answer would have.',
    when: f => f.bottomsA >= 1 || f.neverTopA,
    effects: { pop: { a: -1 }, state: 'doubting' },
    lines: [
      "{a} holds the garment up. \"Is this working?\" The room goes quiet. One queen goes \"it is a direction\" — which is the least helpful thing you can say and the most honest thing anybody is willing to offer. {a} hears it. She heard the silence too.",
      "\"Somebody tell me the truth.\" {a} says it to the room. Three queens look at her garment. Two go \"I like it.\" One says nothing. The one who says nothing is the one {a} trusts, and the nothing is the answer.",
      "{a} asks if the concept is reading and the room gives her a round of \"yeah\"s that do not convince anybody. She can hear it. Goes back to her station knowing more from the silence than the words.",
      "\"Be honest with me.\" {a} holds the look up. The room is not honest with her — just polite. She puts the garment back on the form and stares at it. The polite \"I like it\"s told her more than any real answer would have.",
    ],
  }),
  ev({
    id: 'the-loud-one', slot: 'prep', cast: 'group', weight: 1.2,
    note: '{a} has been talking for an hour and {b} and {c} have both stopped '
      + 'responding and she has not noticed. Somebody is going to say '
      + 'something eventually and it will not be kind.',
    when: f => f.groupSize >= 3,
    effects: { bond: -1, pop: { a: -1 }, state: 'too-loud' },
    lines: [
      "{a} has been giving a TED talk about herself for forty-five minutes. {b} stopped responding twenty minutes ago. {c} stopped ten before that. {a} is still going. She has not paused long enough for either of them to leave.",
      { needs: 'design', line: "\"And THEN — \" {a} launches into another story. {b} has fully glazed over. {c} is sewing without looking up. {a} does not notice she lost the room because {a} does not check for the room. Girl is performing to an audience of herself and the audience is delighted." },
      "{a} is talking and talking and talking. {b} is giving her the \"mmhmm\" that means nothing. {c} has put one headphone in — the polite version of two. {a} reads this as encouragement. Somebody is going to snap and it is going to be {c}.",
      "The room has a narrator and it is {a}. The story started with her wig and has now reached her childhood and shows no signs of landing. {b} catches {c}'s eye across the room — one look that says \"somebody has to say something\" and another that says \"it is not going to be me.\"",
    ],
  }),
  ev({
    id: 'she-can-actually-sew', slot: 'prep', cast: 'group', weight: 1.1, needs: 'design',
    note: 'A queue forms at {a}\'s machine because {a} is the only one who '
      + 'genuinely knows what she is doing, and she helps {b} and {c} and '
      + 'loses two hours of her own day doing it.',
    when: f => f.groupSize >= 3,
    effects: { bond: 1.5, pop: { a: 2 }, state: 'the-seamstress' },
    lines: [
      "{a} is the only queen in this room who can actually sew and everybody knows it. A queue forms at her station — {b} first with a busted zipper, then {c} with a hem that is doing something architectural. {a} fixes both. Loses two hours of her own time and does not complain once.",
      "\"Can you just — \" {b} brings her bodice to {a}'s machine. {a} looks at it, goes \"sit down,\" fixes it in four minutes. {c} sees this and brings her own disaster over. {a} fixes that too. Her station is a walk-in clinic now and {a} lets it happen because she cannot say no to fabric in distress.",
      "{a} can sew. Actually sew — French seams, invisible zippers, the works. The room has figured this out. {b} is at her station with a busted dart. {c} is behind {b} holding something that USED to be a sleeve. {a} helps them both and her own look suffers for it.",
      "There is a line at {a}'s machine because she is the only one who knows what a serger is. {b} needs edges finished. {c} needs a whole new panel. {a} spends two hours being everybody's mama when she should be working on her own lewk. The room does not notice what it costs her.",
    ],
  }),
  ev({
    id: 'copying-her-idea', slot: 'prep', cast: 'pair', weight: 1.1, needs: 'design',
    note: '{a} looks at what {b} is building and changes her own to be closer '
      + 'to it. Not a copy exactly. Close enough that {b} sees it happen.',
    when: f => f.canScheme,
    effects: { bond: -1.5, pop: { a: -1 }, state: 'copied' },
    lines: [
      "{a} walks past {b}'s station three times. {b} clocks it — girl is not walking past, she is SHOPPING. Fourth pass {a} goes back to her own station and starts reworking her silhouette. The new silhouette looks a LOT like {b}'s. {b} sees it happen and says nothing.",
      "\"That is cute,\" {a} goes about {b}'s concept. Forty minutes later {a}'s concept has changed direction and the new direction looks real familiar. {b} watches it happen. Not a copy exactly — but close enough that the runway is going to notice.",
      "{a} glances at {b}'s fabric wall. Goes back to her station. Cuts something new. When {a} holds up the new piece the shape is {b}'s shape in different fabric. {b} puts her iron down and stares at the ceiling because the other option is saying something she cannot take back.",
      "{b} built her concept from scratch and {a} saw it and liked it and has now adjusted her own to match. Not stolen — \"inspired.\" But two of the same thing on the runway makes both worse, and the one who had it first does not always get the credit.",
    ],
  }),
  ev({
    id: 'talking-about-home', slot: 'prep', cast: 'pair', weight: 1.2,
    note: 'The work goes quiet and {a} tells {b} something real about her life '
      + 'outside this room, and {b} puts her glue gun down to listen properly.',
    when: f => f.bond >= 1,
    effects: { bond: 2, pop: { a: 1 }, state: 'real-talk' },
    lines: [
      "The glue guns go quiet and {a} tells {b} something about her life outside this room. Not the drag part — the part before drag. {b} puts her work down and just listens.",
      { needs: 'design', line: "{a} starts talking about home and her voice changes. The performing voice drops and the real one comes in. {b} stops sewing. This is not werkroom banter — {a} is trusting {b} with something she does not give to everybody." },
      "\"I never told anyone in here this.\" {a} says it to {b} and then says it — her family, the town she left, who she was before all this. {b} does not interrupt. She just lets {a} talk.",
      "{b} asks {a} something small about home and {a} gives her the whole answer. The real one. {b} does not say anything for a moment — just takes it in. She knows what it costs to say that stuff on camera.",
    ],
  }),
  ev({
    id: 'nobody-helps-her', slot: 'prep', cast: 'group', weight: 1.2, needs: 'design',
    note: '{a} is visibly behind and {b} and {c} both see it and both stay at '
      + 'their own stations. Nobody is cruel. Nobody moves either.',
    when: f => f.groupSize >= 3 && f.bond <= 0,
    effects: { bond: -1, pop: { a: 1 }, state: 'left-to-it' },
    lines: [
      "{a} is behind and everyone can see it. Fabric not cut, form empty, clock loud. {b} sees it. Stays at her station. {c} sees it. Stays at hers. Nobody is being cruel. Nobody is moving either.",
      "The room can hear {a}'s sewing machine jamming. Nobody walks over. {b} glances once and looks away. {c} does not glance at all. {a} unjams it herself — twelve minutes she does not have. The room stays where it is.",
      "{a} is drowning. Fabric everywhere, pattern pieces on the floor, form still naked at half-time. {b} and {c} are both close enough to help and far enough away to pretend they did not see. It is not that they do not care. It is that caring costs time they already spent.",
      "\"Does anyone have a — \" {a} starts to ask and does not finish because the room gives her the silence that means no. {b} has extra fabric and does not offer it. {c} has extra time and does not share it. {a} goes back to work alone.",
    ],
  }),
  ev({
    id: 'the-mirror-pep-talk', slot: 'prep', cast: 'solo', weight: 1.1,
    note: '{a} gives herself the talk in the mirror, out loud, and does not '
      + 'realise how many people can hear her doing it.',
    when: f => f.bottomsA >= 1,
    effects: { pop: { a: 1 }, state: 'pep-talk' },
    lines: [
      "{a} is in the mirror giving herself the talk. \"You belong here. You are THAT girl. You did not come this far to go home fourth.\" She does not realise the mirror is in full view of three stations. The pep talk is working on her. The eavesdropping is working on the room.",
      "\"Get it together.\" {a} says it to her own reflection. Fixes her hair. Says it again louder — \"GET it together.\" Somebody three stations over exchanges a look because {a} is coaching herself out loud and the coaching has VOLUME.",
      "{a} stands at the mirror and runs through every reason she deserves to be here. Says them all out loud. She thinks she is talking to herself — but every word carries. The whole room heard her pep talk and nobody is going to tell her.",
      "The mirror gets the whole speech — the fear, the comeback, the \"I am not going home tonight\" delivered like a promise to her own face. {a} thinks she is alone. She is not. Two queens are pretending not to hear and one is not pretending at all.",
    ],
  }),

  // ── elimination day ──
  ev({
    id: 'packing-early', slot: 'werk-elim-day', cast: 'solo', weight: 1.2,
    note: '{a} starts packing before she has been told anything, which is '
      + 'either realism or giving up, and the room cannot tell which and does '
      + 'not want to ask.',
    when: f => f.bottomsA >= 1,
    effects: { pop: { a: -1 }, state: 'packing' },
    lines: [
      "{a} starts folding wigs into her suitcase before the judges have said a word. The room notices. Nobody asks if it is preparation or surrender because the answer might be honest.",
      { needs: 'design', line: "The suitcase is open and {a} is putting things in it. Slowly. Carefully. The way you pack when you are packing for real. The room pretends not to see. What do you say to someone folding garment bags before she has been told to go." },
      "{a} is packing. Not for camera — just quietly putting her things in order, shoes in first the way she always does. The calm is the part that makes the room uncomfortable. If she were crying it would be easier to watch. The calm packing is worse.",
      "Nobody has said anything yet and {a} is already zipping compartments. Folds a robe, puts it in the case. The case is half full. The judges have not even deliberated yet. The room cannot decide if this is self-awareness or giving up.",
    ],
  }),
  ev({
    id: 'the-promise', slot: 'werk-elim-day', cast: 'pair', weight: 1.3,
    note: '{a} and {b} promise each other something about the top of the '
      + 'season — final two, or that neither will name the other — and one of '
      + 'them means it more than the other.',
    when: f => f.bond >= 3,
    effects: { bond: 2, pop: { a: 1 }, state: 'the-promise' },
    lines: [
      "\"Final two. You and me.\" {a} says it. {b} says it back. They shake on it. One of them means it more than the other and neither knows which one that is yet.",
      "{a} and {b} find a corner and make the pact. Top two. No matter what. They will drag each other to the end if they have to. The words are serious. One of them will break it eventually because this race breaks everything eventually.",
      "\"Promise me something.\" {a} grabs {b}'s hand. The promise is the big one — the end, the final two, the we-will-get-there-together. {b} promises it and means it right now. Whether she means it in week seven when it costs something is a different question.",
      "{a} tells {b} she wants them both at the end. {b} goes \"obviously\" like it was already decided. The promise is real today. Whether it survives the season is the question neither of them is asking out loud.",
    ],
  }),

  // ── the cold open ──
  ev({
    id: 'reading-the-mirror', slot: 'cold-open', cast: 'group', weight: 1.4,
    note: '{a} reads the mirror message out loud to {b} and {c} because '
      + 'somebody has to, and gets most of the way through it before her '
      + 'voice does something she was not expecting.',
    when: f => f.someoneLeft && f.groupSize >= 3,
    effects: { bond: 1.5, pop: { a: 1 }, state: 'mirror-read' },
    lines: [
      "{a} reads the lipstick message on the mirror out loud. The goodbye, the love-you, the see-you-on-the-outside. She gets through most of it before her voice catches. {b} puts a hand on her shoulder. {c} stands close.",
      "\"I will read it.\" {a} volunteers before anyone asks. Reads it to {b} and {c}. Steady at first — then she hits the part that names someone in the room and her voice drops half a register. Everyone pretends not to hear the drop.",
      "{a} stands at the mirror and reads the words left behind. The thank you. The fight-for-me. The smiley face drawn in lipstick. She makes it through the first sentence fine. Second sentence fine. Third sentence is where the voice goes.",
      "The mirror has writing on it and {a} reads it out loud because somebody has to. {b} leans against {c}. {a} finishes the message and the room sits with it for a moment before anybody speaks.",
    ],
  }),
  ev({
    id: 'relief-badly-hidden', slot: 'cold-open', cast: 'solo', weight: 1.1,
    note: '{a} is relieved that it was not her and is not hiding it as well '
      + 'as she thinks she is, and somebody clocks it.',
    when: f => f.someoneLeft && f.lastCall === 'BTM2',
    effects: { pop: { a: -1 }, state: 'relieved' },
    lines: [
      "{a} hears the name and it is not hers. The relief hits before the face can catch up — full exhale, shoulders drop, smile pressed flat a second too late. Somebody across the room sees all of it.",
      "It is not her name and {a} KNOWS it is not her name and you can see the knowing on her face. She recovers. Makes the sad face. But the relief came first and at least one queen clocked the order.",
      "{a}'s shoulders drop two inches when the other name is called. Visible from across the room. She tries to rearrange her face into something sympathetic and it takes a beat too long. The sympathy arrives. It arrives second.",
      "The name is not {a}'s and her whole body goes \"thank god\" before her mouth can go \"oh no.\" That gap is about one second. In that second everyone nearby reads the real headline — {a} is glad it is not her and is doing a bad job of hiding it.",
    ],
  }),
  ev({
    id: 'the-empty-chair', slot: 'cold-open', cast: 'pair', weight: 1.2,
    note: '{a} and {b} both look at the station and neither of them takes it, '
      + 'and the not-taking goes on for the rest of the day.',
    when: f => f.someoneLeft,
    effects: { bond: 1, pop: { a: 1 }, state: 'empty-chair' },
    lines: [
      "The station is empty. {a} and {b} both look at it. Neither moves toward it. Wigs gone, mirror wiped, chair pushed in. The pushed-in chair is the part that gets you — somebody took the time to push it in before she left.",
      "{a} walks past the empty station and stops. {b} stops with her. Clean mirror, bare counter, the space where somebody used to be. Neither takes the spot. The station stays empty for the rest of the day.",
      "The chair is there and nobody is in it. {a} and {b} both see it at the same time. Hits different when it is real — the person who sat there yesterday is gone and the room is one voice quieter. They look at each other. Look away.",
      "{b} catches {a} staring at the empty station. Does not ask if she is okay because the answer is obvious. Just stands next to her. They both look at the chair. Nobody says anything.",
    ],
  }),

  /* ══ FAMILY ══════════════════════════════════════════════════════════
     Two of them arrived already related — see js/dr/family.js — and the room
     finds out in one of two ways, which are two different scenes.
     A LINE IS OBVIOUS. Two queens with the same surname walk in and somebody
     asks before the door has closed, in front of everybody, and the answer is
     a small event in the life of the season.
     A HOUSE IS NOT. Two club kids out of the same bar look like two club
     kids, and the room only learns it because one of them says so — which
     makes it a confession rather than a question, and worth more.
     `familyFacts` puts `inFamily`, `relation`, `sameFamily`, `familyKind` and
     `familyObvious` on every werk-room fact set, and they are false on a
     season with no families, so nothing here fires by accident.
     A family is a PRE-ALLIANCE: warm, useful, and no protection at all from a
     panel that has never heard of it. */
  ev({
    id: 'same-name-question', slot: 'werk-morning', cast: 'pair', weight: 2.2,
    note: 'THE DETECTION. Somebody has noticed {a} and {b} have the same name '
      + 'and asks the room the obvious question. Both of them have been '
      + 'waiting for it and one of them enjoys it more than the other. Only '
      + 'fires for a line, because a house has no name to give it away.',
    arcs: ['bond'],
    when: f => f.sameFamily && f.familyObvious && f.phase === 0,
    effects: { bond: 1, pop: { a: 1, b: 1 }, state: 'family-revealed' },
    lines: [
      "Somebody goes \"wait — are y'all related?\" {a} and {b} look at each other. {a} goes \"she is my sister.\" The room erupts. {b} just stands there smiling because she has been waiting for somebody to clock it all day.",
      "\"Hold on. Same last name?\" A queen points at {a} and then at {b}. {a} goes \"yeah, she is my family.\" {b} nods. The room goes loud. Two queens start asking questions at the same time and neither waits for an answer.",
      "{a} and {b} get asked the question before the first hour is up. \"Are you two — \" \"Yes.\" {a} says it flat. {b} grins. The room reacts like it is a twist reveal on the main stage. {a} goes \"girl, it is not that serious\" but it kind of is.",
      "A queen clocks the name and goes \"wait a minute.\" {a} goes \"yeah. That is my sister.\" {b} waves from across the room. The energy shifts — every queen in earshot is recalculating what these two mean as a pair.",
    ],
  }),
  ev({
    id: 'the-house-confession', slot: 'prep', cast: 'pair', weight: 1.6,
    note: 'THE OTHER DETECTION. Nobody could have guessed — {a} and {b} came '
      + 'up in the same bar and look like two queens who happen to do the '
      + 'same kind of drag. One of them says it out loud, and saying it is a '
      + 'decision: it makes both of them a target as a bloc.',
    arcs: ['bond'],
    when: f => f.sameFamily && !f.familyObvious && f.phase >= 1,
    effects: { bond: 1.5, pop: { a: 1 }, state: 'family-revealed' },
    lines: [
      "{a} tells {b} they came up in the same bar and {b} goes \"I KNEW it.\" She did not know it. But the drag makes sense now — the references, the silhouettes, the way they both paint. {a} goes \"we did not want it to be a thing\" but it is already a thing.",
      "\"Can I tell you something?\" {a} pulls {b} aside and tells her — same scene, same city, same mama. {b}'s eyes go wide. \"Girl, why did you not SAY that?\" {a} goes \"because then it becomes a target.\" {b} goes quiet because {a} is right.",
      "{a} drops it casual — \"yeah, we are from the same place\" — and {b} stops what she is doing. \"The same PLACE place?\" Same bar. Same crew. {b} looks at {a} different after that. The drag she has been watching suddenly has context.",
      "{a} decides to tell {b} they are from the same scene. She does it quiet, away from the group. {b} goes \"shut UP\" and then goes \"wait, does everyone know?\" {a} goes \"no, and I would like to keep it that way.\" {b} nods. The secret sits between them now.",
    ],
  }),
  ev({
    id: 'mother-teaching', slot: 'prep', cast: 'pair', weight: 1.8, needs: 'design',
    note: '{a} is {b}\'s drag mother and does what a drag mother does — takes '
      + 'the thing out of her hands and shows her, without being asked and '
      + 'without softening it. Nobody else in this room could say it to {b} '
      + 'that way and both of them know it.',
    arcs: ['bond'],
    when: f => f.relation === 'daughter',
    effects: { bond: 1.5, pop: { a: 1, b: 1 }, state: 'mothered' },
    lines: [
      "{a} takes the garment out of {b}'s hands. Does not ask. Just takes it, looks at it, goes \"no\" and starts fixing the seam herself. {b} stands there watching because when your drag mama says no she means no and you learn more in the silence than the lecture.",
      "{a} walks over to {b}'s station and starts adjusting her padding without a word. {b} goes \"I had it\" and {a} goes \"you did not\" and that is the end of that conversation. Nobody else in this room could talk to {b} like that. {a} can because {a} made her.",
      "\"Sit down.\" {a} says it to {b} and {b} sits. {a} takes apart the neckline {b} spent an hour on. Rebuilds it in ten minutes. {b} watches and does not argue because when your drag mother teaches you something you shut up and learn.",
      "{a} looks at what {b} is building and goes \"baby, no.\" Takes the fabric, flips it, shows her the grain. {b} goes \"I knew that\" and {a} goes \"then why was it backwards.\" The room watches a drag mother do what a drag mother does — fix it without softening it.",
    ],
  }),
  ev({
    id: 'out-of-her-shadow', slot: 'werk-morning', cast: 'pair', weight: 1.4,
    note: '{a} is tired of being introduced as {b}\'s daughter. She did not '
      + 'come here to be somebody\'s anything. It is the first crack in a '
      + 'family and it is a real one, because she is right.',
    arcs: ['rivalry'],
    when: f => f.relation === 'mother' && f.phase >= 1,
    effects: { bond: -2, pop: { a: 1 }, state: 'family-strain' },
    lines: [
      "{a} is tired of being introduced as {b}'s daughter. She did not come here to be somebody's anything. \"I have my own drag,\" she goes to nobody in particular, loud enough that {b} hears it from across the room. {b} does not respond. The not responding says plenty.",
      "A queen asks {a} about {b} and {a} goes \"can we talk about literally anything else.\" She is done being the daughter. She is here as herself. {b} catches the tone from two stations over and her face does something complicated.",
      "\"She is not the reason I am here.\" {a} says it flat, about {b}, to a queen who asked a simple question. The edge in her voice is real. She came here to be {a}, not {b}'s kid, and every time someone connects them she feels smaller.",
      "{a} snaps when somebody calls her a mini-{b}. \"I am not mini anything.\" The room goes quiet. {b} looks at her and does not say a word. It is the first real crack between them and it is a real one because {a} is right — she has her own name and her own drag and her own reason to be here.",
    ],
  }),
  ev({
    id: 'the-room-notices-the-bloc', slot: 'werk-elim-day', cast: 'group', weight: 1.5,
    note: '{a} and {b} are family and {c} has worked out that they will never '
      + 'be a problem for each other, which makes them a bloc whether they '
      + 'meant to be one or not. Nobody accuses anybody. Everybody adjusts.',
    arcs: ['rivalry'],
    when: f => f.sameFamily && f.groupSize >= 3 && f.phase >= 1,
    effects: { bond: -1, pop: { a: -1, b: -1 }, state: 'bloc-noticed' },
    lines: [
      "{c} has figured out that {a} and {b} are never going to be a problem for each other. Nobody accuses anyone. {c} just adjusts — starts thinking about them as a pair instead of two singles. That changes the maths for everybody.",
      "{c} watches {a} and {b} work together and goes quiet. She does not say it out loud but you can see her doing the calculation — those two are never going to come for each other, which means they are a bloc whether they meant to be or not.",
      "\"They are always going to pick each other,\" {c} says, about {a} and {b}, not to them but near enough that the words carry. Nobody argues. {a} and {b} exchange a look. {c} just named the thing everybody was thinking.",
      "{c} clocks {a} helping {b} for the third time this week and the pattern is loud now. Those two are a unit. Nobody accuses anyone of anything but {c} starts moving different — she is thinking about them as a pair and that changes who is a threat.",
    ],
  }),

];

/** Ids only, for guards and the transcript. */
export const WERK_IDS = WERK_EVENTS.map(e => e.id);

/** What is still unwritten, so the gap is visible rather than silent. */
export function unwrittenWerkEvents() {
  return WERK_EVENTS.filter(e => !e.lines || e.lines.length < 4).map(e => e.id);
}

/* The romance thread's own ids, exported so readers do not keyword-match.
   `js/ratings.js` looked for /showmance|romance|spark|flirt|kiss/ in an event
   type and these are called things like `something-there` — a reader guessing
   at names is how a signal reads zero while the events fire. */
export const ROMANCE_EVENT_IDS = WERK_EVENTS
  .filter(e => e.effects?.state === 'romance').map(e => e.id);
