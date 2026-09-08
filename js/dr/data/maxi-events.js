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
    lines: [
      "The seam goes first. {a} feels it give as she turns and for a second she thinks she can hold it together with posture, but the fabric has its own plan and the plan is to separate from her body on the runway in front of the panel. She puts a hand on her hip — casually, like it is a choice — and the hand is the only thing between her and a disaster with witnesses.",
      "Something at the waist buckles and {a}'s face does not change, which is the face of somebody who has trained herself not to react when something goes wrong in public. The look is unravelling. She can feel it at the shoulder and the hip and she has about thirty seconds to walk the rest of the runway before the construction gives out entirely.",
      "The hot glue surrenders somewhere between the third turn and the fourth. {a} catches the piece that falls and tucks it behind the bodice in one motion that would look intentional to somebody who was not looking closely, but the panel is looking closely and the panel always looks closely.",
      "It is not a collapse — it is a slow-motion negotiation between {a} and a garment that no longer wants to be on her body. The stitching pulls. The hem drops on one side. She walks like nothing is wrong because the walk is the only thing she has left, and the walk cannot fix what the construction already broke.",
    ],
  }),
  e({
    id: 'showstopper', from: 'ball', cast: 'solo',
    note: 'What she built out of the fabric on the wall is genuinely extraordinary, and the room knows before it walks.',
    lines: [
      "{a} walks out and the look she built this morning stops the room. She had the same fabric as everybody else and the same glue guns and the same number of hours, and what she made out of those materials is so far beyond what the brief asked for that one of the judges mouths something to the other that does not get picked up by the mic.",
      "The garment she built is the garment nobody believed she could build. The construction is clean, the concept is fully realised, and the walk sells it with the authority of somebody wearing couture rather than something she hot-glued together at dawn. The panel leans forward. The queens backstage go quiet.",
      "Whatever {a} did in the werk room, she did it at a level that makes the ball her night. The look is structured, it moves correctly, and the finishing is so clean that the judges are going to have to ask her how she did it, because the materials on the wall do not explain what is on the runway.",
      "She built something extraordinary and the room knows it before she reaches the end of the runway. The proportions are right, the silhouette is right, and the thing she made out of unconventional materials looks like it was made out of exactly the right materials. The ball has a winner and the winner just walked.",
    ],
  }),

  // ══ GIRL GROUP, RUMIX, MUSIC VIDEO ═══════════════════════════════════
  e({
    id: 'spotlight-hog', from: 'girl-group', cast: 'pair',
    note: '{a} takes the front of the number for herself. It works for her and every queen behind her pays for it.',
    lines: [
      "It is subtle enough to be deniable and obvious enough that everybody sees it. {a} drifts half a step forward on every formation, so by the final chorus she is not in the line, she is in front of it, and the rest of the group is choreographed into being her backing. She says she did not plan it. She did it four times.",
      "\"Can I just — sorry — can I take this bit?\" It is phrased as a question the first time. By the third time it is not phrased at all, {a} simply takes the bit, and the queen it belonged to stands there holding a verse she is no longer singing.",
      "{a} decides somewhere in rehearsal that this is her number, and once she has decided it the rest of the team is furniture. Every adjustment she suggests moves her forward. Every note she gives somebody else moves them back. It is a masterclass, and it is going to cost her.",
      "The number is good. It is good because {a} is very good and she is at the front of all of it, and the queens behind her know exactly how that happened. Nobody says anything in the rehearsal room. Everybody says something afterwards.",
    ],
  }),
  e({
    id: 'carried', from: 'girl-group', cast: 'pair',
    note: '{b} is out of her depth and {a} covers for her all the way through. The room can see both halves of that.',
    lines: [
      "{a} adjusts her choreography three times during rehearsal and every adjustment is designed to make {b} look better without {b} knowing it. She feeds lines, she covers positions, and when {b} misses a step {a} improvises around it so smoothly that the edit will look like the choreography always went that way.",
      "The number works because {a} makes it work, and {a} makes it work by giving {b} the easy parts and taking the hard parts and acting like both of those things were always the plan. {b} is grateful. The panel sees exactly what happened. Both of those things are true.",
      "{a} spends her own rehearsal time on {b}'s verse, {b}'s blocking, and {b}'s confidence, and by the time the number runs {b} looks competent because {a} built a structure around her that competence could live in. The room can see the scaffolding. The room also respects it.",
      "Every time {b} drifts offbeat, {a} is already there — adjusting, covering, making the mistake look like a choice. She carries {b} through the entire number without once making it obvious, which is the part that takes real skill. Carrying somebody is easy. Carrying somebody while both of you look good is not.",
    ],
  }),
  e({
    id: 'bad-verse', from: 'girl-group', cast: 'solo',
    note: 'What she wrote does not work, and she has to perform it anyway.',
    lines: [
      "{a}'s verse does not work and she has to perform it anyway, which means she has to stand on a stage and deliver words she already knows are wrong. The rhyme is forced, the concept is thin, and the worst part is not the verse — it is the four seconds of silence after it where the room is supposed to react and does not.",
      "She wrote it at three in the morning and it sounded like something then. Under the lights, in front of the panel, delivered at full volume to a backing track that deserves better, {a}'s verse sounds like a first draft that never became a second one. She performs it hard. The performing does not save it.",
      "The verse arrives and the verse is the weakest part of the number and everybody on the stage knows it because everybody on the stage heard the rehearsal. {a} delivers it with commitment, which is the only available strategy when the material is not there, and the commitment highlights the gap rather than covering it.",
      "{a} has eight bars and six of them feel like she is reaching for a concept that keeps moving further away. The words are there, the melody is there, but the thing that makes a verse land — the point, the personality, the reason it belongs to her and nobody else — is missing, and no amount of stage presence fills a hole that shape.",
    ],
  }),
  e({
    id: 'verse-of-the-week', from: 'girl-group', cast: 'solo',
    note: 'She wrote the line everybody will repeat afterwards.',
    lines: [
      "{a} drops a line in her verse that makes the room scream. Not a good line — THE line, the one that sticks, the one queens will be quoting in confessionals for the rest of the season. She knows it landed because the reaction is too loud to be polite, and the smile she allows herself is the smile of somebody who just won a moment.",
      "One bar. {a} writes one bar that is so sharp it cuts through the rest of the number and becomes the thing the night is remembered for. The delivery is perfect, the timing is perfect, and the lyric is the kind of thing that sounds obvious after you hear it and impossible before.",
      "The verse is solid but the line — one line, eight words, delivered with an energy that makes the backing track feel like it was written for this moment — is the thing that separates a good girl group night from a great one. {a} wrote it and she delivered it and the room will be repeating it tomorrow.",
      "She hits a bar in her verse that lands differently from everything around it. The choreography stops mattering, the formation stops mattering, and for four seconds {a} is the only person on the stage because the line she wrote is the line that nobody else thought of and the room can hear the difference.",
    ],
  }),
  e({
    id: 'booth', from: 'girl-group', cast: 'solo',
    note: 'The recording booth, where either she can sing or the room finds out she cannot.',
    lines: [
      "The booth closes and {a} puts on the headphones and the backing track starts and this is the moment where either she can sing or the room on the other side of the glass finds out she cannot. She takes a breath. She opens her mouth. What comes out answers the question for everybody.",
      "{a} steps into the booth and the producer counts her in and the first note comes out and the queens on the other side of the glass either relax or wince, and whichever one they do they do it immediately, because a recording booth hides nothing and amplifies everything.",
      "The booth is the loneliest part of a girl group week. {a} is behind glass with a mic and a track and nobody to cover for her. She sings her verse and the queens outside watch the producer's face, because the producer's face is how you know before the playback whether it worked.",
      "She goes into the booth with her verse memorised and her confidence at whatever level it has been at since the brief, and thirty seconds later the room knows whether {a} can sing, because a recording booth is a room-sized lie detector for vocal ability and {a} just took the test.",
    ],
  }),

  // ══ THE RUSICAL ══════════════════════════════════════════════════════
  e({
    id: 'live-vocal', from: 'rusical', cast: 'solo',
    note: 'She chose to sing it live rather than lip sync to the recording. The biggest voluntary risk in a maxi challenge.',
    lines: [
      "{a} tells the room she is singing it live and the room goes quiet because singing live in a rusical is the biggest voluntary risk available to her, and the decision says either \"I can do this\" or \"I have no idea what I just committed to\" and the performance will answer which one it was.",
      "Live vocal. {a} steps up to the mic and the backing track drops in and she opens her mouth and the note that comes out is either the bravest thing she has done this season or the most reckless, depending on how the next three minutes go. The band is playing. There is no safety net.",
      "She chose live. The pre-recorded track is right there and she chose live, which means every note is hers and every missed note is hers too. {a} sings and the room holds its breath because a live vocal in a rusical is either the thing that wins the week or the thing that ends the run.",
      "{a} announces she will sing it live and the queens exchange a look that says everything about the risk. The band counts in. She takes a breath. What follows is either extraordinary bravery or a mistake she will relive in every confessional from now until the finale — there is no version of live vocals that is just fine.",
    ],
  }),
  e({
    id: 'invisible', from: 'rusical', cast: 'solo',
    note: 'She is in the ensemble and she disappears into it. The note the panel gives is that they did not see her.',
    lines: [
      "{a} is in the number and the number runs and {a} is in it for all of it and none of it lands. She hits her marks, she mouths the words, she does the choreography, and at no point during the entire run does anybody on the panel look at her, because there is nothing to look at. She is present and invisible and on this night those are the same thing.",
      "The worst note the panel can give is not \"you were bad.\" The worst note is \"I did not see you.\" {a} is in the ensemble and the ensemble performs and {a} performs inside it and the performing disappears into the formation the way a single instrument disappears into an orchestra that is not listening for it.",
      "She is there. She is in every scene she is supposed to be in, in every position she was given, wearing the costume, doing the choreography. And the critique that is coming — the critique that will sit in her chest for the rest of the week — is that none of that mattered, because the panel did not notice she was on stage.",
      "{a} does the rusical and the rusical does not need her. She sings her lines, she hits her spots, and she produces a performance that is technically correct and completely forgettable, which on a night where everybody else is fighting for camera time is the same as not being there at all.",
    ],
  }),

  // ══ THE MAKEOVER ═════════════════════════════════════════════════════
  e({
    id: 'dressed-herself-better', from: 'makeover', cast: 'solo',
    note: 'Her own look is far better than the one she built for her partner, and on this night that is a loss rather than a flex.',
    lines: [
      "{a} walks out looking extraordinary and her partner walks out looking like {a} ran out of time, and on makeover night that gap is not a compliment — it is the critique. She dressed herself first, or she dressed herself better, and the panel can see the difference standing right next to each other.",
      "The problem is not that {a} looks bad. The problem is that {a} looks incredible and her partner looks like the version of {a} that was built with the leftover fabric. The pair walks together and the contrast between them is the note the judges are going to give, because family resemblance only works when both relatives are dressed.",
      "Two people walk out and one of them is drag and the other is wearing drag, and the one wearing drag is not {a}. She put her best work on herself and her second-best work on her partner and the distance between best and second-best is the distance between winning and being read for selfishness.",
      "{a} looks stunning. Her partner looks like {a} built her in the last forty minutes, which is because {a} built her in the last forty minutes. On any other night the look {a} is wearing is a win. On makeover night it is evidence of misplaced priorities, and the panel is about to present that evidence.",
    ],
  }),
  e({
    id: 'reunion', from: 'makeover', cast: 'pair',
    note: 'Her makeover partner is a queen who went home earlier this season, and they were close.',
    lines: [
      "{a} sees {b} walk through the door and the reaction is immediate and real — a sound, not a word, the kind of noise people make when somebody they missed is suddenly in the room again. {b} is back for the makeover and {a} is going to be the one dressing her, and the hug lasts longer than either of them planned.",
      "The makeover partner is {b}, and {a}'s face when she sees her tells the room everything about what they were to each other before {b} left. The hug is tight. The conversation is fast and layered and full of things that only make sense if you were there for the weeks they shared, and {a} has already decided she is going to make {b} look better than she has ever looked.",
      "{b} walks in and {a} freezes for a second and then the second breaks and she is across the room. They were close. {b} leaving was the week that hit {a} hardest, and now {b} is back for one night and {a} is the one responsible for how she looks, which means this makeover is not about the challenge — it is about proving something she has been carrying since {b} went.",
      "Of all the queens who could have walked through that door, it is {b}. {a} puts both hands over her mouth. The room watches the reunion and the reunion is not performed — it is two people who missed each other finding each other again in a werk room, and whatever {a} builds tonight she is building it with love, which is either an advantage or a way to put too much pressure on herself.",
    ],
  }),

  // ══ THE ROAST AND STAND-UP ═══════════════════════════════════════════
  e({
    id: 'bombed', from: 'roast', cast: 'solo',
    note: 'All three of her bits died. She is on stage with a microphone and a room that has stopped helping.',
    lines: [
      "The first bit dies. {a} pushes through to the second. The second dies harder. She gets to the third with the energy of somebody walking into a door she already knows is locked, and the third one produces a silence so specific that {a} breaks character and laughs at herself, which is the last resort of a set that has nothing left.",
      "Three bits and three silences and the silences get longer each time. {a} is on stage with a microphone and a room full of people who were helping her five minutes ago and are not helping her now. She delivers her closer to a room that has already decided, and the closer does not change the decision.",
      "{a} bombs. Not a partial bomb — a full, material-wide, room-emptying bomb where every joke she wrote sounds like a sentence she is reading off a card because by the third one that is exactly what she is doing. The microphone feels heavier with every bit that dies and by the end she is holding it like evidence.",
      "She has material. The material does not work. {a} can feel it not working from the first beat — the timing is off, or the targets are wrong, or the room has decided she is not funny and a room that has decided that is a room you cannot un-decide. She finishes. The finishing is the bravest part.",
    ],
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
    lines: [
      "{a} heard {b} working through a bit in the werk room — a specific angle, a specific target, a specific punchline — and when {a}'s set starts the angle is in it. Not reworded. Not reimagined. Taken, used, and delivered with the confidence of somebody who has decided that being good tonight matters more than being honest about where the material came from.",
      "The bit {a} opens with is {b}'s bit. {b} knows it immediately because {b} said it out loud four hours ago at her station, and {a} was three chairs away pretending not to listen. {a} gets the laugh. {b} gets the experience of watching somebody else land her joke.",
      "{b} workshopped it in the room where everybody could hear and {a} heard it and filed it and when {a} stands at the microphone the angle she opens with is the angle {b} was saving for her closer. The room does not know. {b} knows. The look {b} gives the monitor backstage is the look of somebody calculating what this is going to cost.",
      "\"That was mine.\" {b} says it to nobody in particular while watching the monitor, and the queen next to her looks at the screen and then back at {b} and says nothing, because {a} is on stage right now delivering {b}'s material and delivering it well, which is the worst version of this.",
    ],
  }),

  // ══ THE TALENT SHOW ══════════════════════════════════════════════════
  e({
    id: 'stunt-landed', from: 'talent-show', cast: 'solo',
    note: 'She went for something genuinely dangerous and landed it.',
    lines: [
      "{a} goes for it and the room holds its breath and the breath is released as a scream because she landed it. The stunt was real — high, fast, dangerous, and performed with the kind of commitment that means she either practised it a thousand times or does not care what happens, and neither answer is small.",
      "The act builds to a moment that should not work on a stage this size and {a} lands it clean. The panel reacts before they can compose themselves — one judge stands up, another puts both hands on the table — and {a} holds the landing with the composure of somebody who just proved something she has been waiting all season to prove.",
      "{a} does something genuinely dangerous and the danger is the point and the landing is the payoff and both of those things happen in front of a panel that was not expecting it. The room erupts. The act was a risk and the risk paid and the payment is a moment the season will carry to the finale.",
      "She goes for the stunt and the stunt works and the working changes the temperature of the room. What {a} just did was not safe, was not easy, and was not something any other queen in the building could have attempted, and the gap between her and everybody else just widened by the exact width of a skill nobody knew she had.",
    ],
  }),
  e({
    id: 'stunt-failed', from: 'talent-show', cast: 'solo',
    note: 'She went for it and it did not work, in front of everybody.',
    lines: [
      "She goes for it and it does not work. The stunt fails mid-execution and {a} is left on stage in the aftermath of something that was supposed to be the moment, and the panel watches with the silence of people who can see the gap between what she attempted and what she achieved.",
      "{a} commits to the stunt and the stunt does not commit to her. The landing is wrong, or the timing is wrong, or the prop does not do what the prop is supposed to do, and she is left standing in front of the panel with nothing between her and the failure except the three seconds it takes to compose her face.",
      "The act builds to a stunt that {a} has clearly been building toward all night and the stunt misfires in front of everybody. She recovers — she stands, she smiles, she finishes the act — but the recovery is a different act from the one she planned, and the difference between those two acts is going to be the note.",
      "It fails. {a} goes for the big moment and the big moment goes wrong and the wrongness is visible from every seat in the room. She does not stop. She picks up the act from where the stunt dropped it and carries it to the end, and the carrying is brave but the failure is what the panel saw first.",
    ],
  }),
  e({
    id: 'wrong-talent', from: 'talent-show', cast: 'solo',
    note: 'Not a failure of execution — she chose an act she was never going to be able to do.',
    lines: [
      "The problem is not that {a} did it badly. The problem is that {a} chose it. The act requires a skill she does not have at the level a talent show demands, and the choice to attempt it anyway is either confidence or denial and the performance answers which one before the first minute is over.",
      "{a} picked an act that belongs to a queen who has been doing it for a decade, and {a} has not been doing it for a decade. The attempt is genuine and the genuineness makes it worse, because she is really trying and the trying is what reveals the gap between having a talent and choosing a talent.",
      "It is not an execution problem. {a} chose the wrong act and the wrong act is the kind of mistake that cannot be fixed by trying harder, because trying harder at something you cannot do just produces a louder version of not being able to do it.",
      "Somewhere between the werk room and the stage, {a} made a decision that the act would work, and the decision was wrong. She can dance, or she can sing, or she can do a dozen other things that would have landed, and she chose the one thing she cannot do, and the choosing is the critique the panel is going to give her.",
    ],
  }),

  // ══ THE BRACKET ══════════════════════════════════════════════════════
  e({
    id: 'assassin', from: 'lalaparuza', cast: 'solo',
    note: 'Three lip syncs won in one night. The room has learned something about her.',
    lines: [
      "Three lip syncs. Three wins. {a} walks off the stage the third time and the room looks at her differently because three in a row is not luck and three in a row is not adrenaline — three in a row is a queen who can perform at that level every single time she is asked to, and the room just learned that about her.",
      "{a} wins her first one and the room thinks she is good. She wins her second one and the room thinks she is dangerous. She wins her third one and the room stops thinking and starts recalculating, because a queen who can win three lip syncs in one night is a queen you do not put in the bottom under any circumstances.",
      "The bracket belongs to {a}. She tears through three opponents in one night with the energy of somebody who has been waiting for a format that rewards the thing she is best at, and the format just arrived. Every queen backstage watching the monitor is having the same thought: do not end up across from her.",
      "Three lip syncs won and she barely looks tired. {a} comes off the stage after the third with the composure of somebody who does this — not somebody who did this, somebody who does this, present tense, routinely — and the rest of the room adjusts its understanding of who she is.",
    ],
  }),
  e({
    id: 'picked-on', from: 'lalaparuza', cast: 'pair',
    note: 'More than one queen named her as the one they wanted to face. She heard all of it.',
    lines: [
      "More than one queen named {a} as their preferred opponent, which means more than one queen looked at the bracket and decided she was the easiest win available. {a} heard all of it. She heard every name that said hers, and her face while she heard it was the face of somebody building a list.",
      "They chose her. Not one of them — several of them — and {a} stood there while they said it and the standing-there is the part the cameras caught. {b} said it first, and {b} said it like it was obvious, which means {b} thinks {a} is beatable, and {a} is about to find out whether {b} is right.",
      "{a} watches queen after queen name her as the one they want to face and each name lands on her like a small, precise insult. They think she is weak. They said so out loud, to her face, in a room with cameras. Whatever happens in the bracket, she is not performing to survive — she is performing to make a point.",
      "\"I want to go against {a}.\" {b} says it, and then somebody else says it, and {a} is standing right there while they say it. Her jaw tightens. The room has decided she is the path of least resistance and she heard the room decide it and the hearing is going to fuel whatever she does next.",
    ],
  }),

  // ══ THE DESIGN FAMILY ════════════════════════════════════════════════
  e({
    id: 'glue-gun', from: 'design', cast: 'solo',
    note: 'A burn, mid-build, and she keeps working.',
    lines: [
      "The glue gun catches the inside of {a}'s finger and she says a word that will need to be bleeped and then she keeps working. She does not stop. She does not look at it. She presses the seam with the hand that is not burned because the clock is running and the clock does not care about skin, and the seam holds, which is more than the skin did.",
      "{a} burns herself on the glue gun and the burn is visible — a red line on the knuckle that she does not acknowledge because acknowledging it would mean stopping and stopping is not available tonight. She wraps the finger in a scrap of fabric and keeps building and the scrap turns into part of the garment because wasting material is also not available.",
      "A burn. Mid-build, with three hours on the clock and a bodice that is not finished. {a} flinches, holds the flinch for half a second, and goes back to the seam. The queens on either side look over. {a} does not look up. The burn is a fact and the garment is a priority and the priority wins.",
      "The glue gun gets her and {a} says \"ow\" in a voice that is so flat it sounds like she is reading it off a card, and then she does not stop. She keeps the gun in her hand and the hand on the fabric and the fabric on the form because a burn heals and a garment that is not finished by the runway does not.",
    ],
  }),

  // ══ THE WERK ROOM, UNDER ANY CHALLENGE ═══════════════════════════════
  e({
    id: 'help', from: 'prep', cast: 'pair',
    note: '{a} is strong at tonight\'s craft and spends her own time on {b}, who is not.',
    lines: [
      "{a} looks over at {b}'s station and sees the problem before {b} does. She does not say \"do you need help\" because that question has a wrong answer on this show. She says \"let me show you something\" and crosses the room and spends forty minutes of her own prep time fixing something {b} did not know was broken.",
      "{a} is good at this. {b} is not. {a} can see {b} struggling from three stations away and could keep working on her own piece and let the challenge sort it out, and instead she walks over and quietly rebuilds {b}'s construction from the inside while {b} watches and learns and does not quite know how to say thank you.",
      "She has her own work to finish and she puts it down and walks to {b}'s station. {a} is strong at tonight's craft and {b} is drowning in it and {a} decides that {b} drowning is not something she is willing to watch. The help is specific and practical and costs {a} time she does not have, and she gives it anyway.",
      "{a} spends an hour on {b}'s piece and forty minutes on her own. The maths does not work and {a} knows the maths does not work and she does it anyway because {b} is going to be on that stage tonight and {a} is not going to be the queen who watched her go out there with something unfinished.",
    ],
  }),
  e({
    id: 'sabotage', from: 'prep', cast: 'pair',
    note: '{a} quietly makes {b} worse at the thing she is about to be judged on.',
    lines: [
      "{a} offers {b} a suggestion and the suggestion is wrong. Not obviously wrong — wrong in the way that will only become visible under the stage lights, when the proportions read differently and the hem sits where it should not — and {a} offers it with the warmth of somebody who is helping and the precision of somebody who is not.",
      "It is subtle. {a} moves something at {b}'s station while {b} is in the bathroom, and the something is small enough that {b} will not notice until the runway, and by the runway it is too late. The room does not see it. The cameras might. {a} goes back to her station and keeps working with the focus of somebody who has just done something she is not going to talk about.",
      "{a} tells {b} that the colour is wrong and {b} should change it, and {b} changes it, and the new colour is worse. {a} knows it is worse. {a} chose it because it is worse. The exchange looks like mentorship and functions like sabotage and the distance between those two things is the distance {a} has decided she is willing to travel this week.",
      "\"I think you should take that in,\" {a} says, and {b} takes it in, and the taking-in ruins the silhouette in a way that will not be obvious until {b} is standing in front of the panel. {a} watches {b} make the alteration and nods encouragingly. The nod is the worst part.",
    ],
  }),
  e({
    id: 'shunned', from: 'prep', cast: 'solo',
    note: 'The room is helping each other and nobody is helping her. An event, not an absence.',
    lines: [
      "The room is helping each other. Queens are crossing to other stations, offering advice, lending tools, checking hems. Nobody crosses to {a}'s station. Nobody offers. Nobody checks. The absence is loud enough that {a} can hear it, and the hearing changes the way she works — faster, quieter, and facing the mirror instead of the room.",
      "{a} asks for help and the room gives her the specific silence of people who heard the question and chose not to answer it. It is not cruelty — it is calculation, a whole room deciding independently that helping {a} is not in their interest tonight, and the independence is what makes it worse than a conspiracy.",
      "Three queens walk past {a}'s station while she is struggling with something and all three of them keep walking. She does not ask again. She figures it out on her own, and the figuring-out takes twice as long as it would have taken with one person's help, and the room knows this and the room is fine with it.",
      "The room has decided, without discussing it, that {a} is on her own tonight. The decision is visible in the traffic pattern — help flows in every direction except toward her station — and {a} is aware of the pattern and the awareness settles into her work like a weight she is building under.",
    ],
  }),
  e({
    id: 'walkthrough', from: 'prep', cast: 'solo',
    note: 'The host walks the room and gives her a note. Whether she hears it and whether she acts on it are two different things.',
    lines: [
      "The host stops at {a}'s station and looks at what she is building and says one thing. The thing is specific and correct and delivered with the casual authority of somebody who has watched a thousand queens make a thousand versions of this mistake. {a} nods. Whether the nod means \"I hear you\" or \"I hear you and I am going to do it anyway\" is a question the runway will answer.",
      "\"Can I be honest with you?\" The host says it to {a} and {a} says \"yes\" and the honesty arrives as a note about the concept that {a} has been building for two days. The note is right. {a} can feel it being right. Whether she can rebuild around it with four hours left is a different question from whether the note is right.",
      "The walkthrough reaches {a}'s station and the host looks at the work and pauses, and the pause is the note. {a} watches the host's face and reads the pause and the reading tells her everything the host says afterwards, which is kind and specific and amounts to: this is not going to work the way you think it will.",
      "{a} gets a note during the walkthrough and the note is the note she did not want. She smiles, she thanks the host, she watches the host walk to the next station, and then she stands at her station for thirty seconds deciding whether to rebuild or to trust her own vision against the advice of somebody who has been right about this more times than she has been alive.",
    ],
  }),

  // ══ THE HAND-OUT ═════════════════════════════════════════════════════
  /* THE REACTION, WHICH IS NOT THE CONFLICT. `contest` below is the fact —
     two queens wanted one thing and one of them got it — and it fires once
     per contested thing, which is right: ten queens losing the same slot to
     the same queen is one story. What each of those ten DOES about it is ten
     stories, and the draft had none of them.
     Which one fires is a weighted roll in js/dr/assign.js off the bond
     between the pair, the loser's temperament and boldness, and both
     archetypes — so a hothead is likelier to say something rather than
     certain to, and most drafts produce nothing at all. */
  e({
    id: 'contest-said-it', from: 'assign', cast: 'pair',
    note: '{a} lost it to {b} and says so, out loud, in the room.',
    lines: [
      "{a} does not wait until she is at her station. \"So we are just taking whatever we want,\" she says, to nobody, at a volume that is clearly for {b}, and {b} turns around because the alternative is pretending not to have heard it and the room already knows she heard it. Nobody else says anything. Everybody else is delighted.",
      "\"You knew.\" {a} says it flatly and {b} says \"I picked first\" and {a} says \"you knew\" again, the same two words, which is worse the second time. The exchange lasts nine seconds and will be replayed by both of them for the rest of the week.",
      "{a} lets out one short laugh with nothing funny in it. \"Of course,\" she says. \"Of course that is how that goes.\" {b} offers a shrug that is meant to be friendly and lands as something else entirely, and the temperature in the room drops about four degrees.",
      "It comes out before {a} has decided to say it. \"That was mine and you knew it was mine.\" The room goes quiet in the specific way a room goes quiet when two queens are about to have the argument everybody has been waiting for. {b} puts her hands up. {a} is not finished.",
    ],
  }),
  e({
    id: 'contest-old-grudge', from: 'assign', cast: 'pair',
    note: 'Of every queen in the room it had to be {b}. There was history before this.',
    lines: [
      "Of all the queens in the room it had to be {b}. {a} does not say anything, which is the loudest thing she could have done — the two of them have been circling each other since the first day and this is the first time the competition has handed one of them something the other wanted.",
      "{a} watches {b} take it and the watching is the whole event. There is history between these two and the history has a shape now: a slot, a pick order, and a queen who was always going to end up on the wrong side of it. {a} goes back to her station and does not speak for twenty minutes.",
      "This would be survivable from anybody else. From {b} it is not, and {a} knows that about herself and hates it, and the knowing does not change the fact that she is now building a performance out of spite instead of out of a plan.",
      "\"Naturally.\" {a} says the single word to her own reflection and it carries further than she meant it to. She and {b} have not been right since the second day and the draft has just poured something on it. {b} hears it. {b} decides, visibly, not to respond, which is its own kind of response.",
    ],
  }),
  e({
    id: 'contest-took-it', from: 'assign', cast: 'pair',
    note: '{a} knew {b} wanted it, took it anyway, and is not pretending otherwise.',
    lines: [
      "{a} knew. That is the part {b} cannot get past — {a} knew, because {b} had said it out loud two days ago, and {a} picked it anyway and did not blink. \"I am not here to be polite,\" {a} says pleasantly, to the room rather than to {b}, and goes to her station.",
      "{a} takes it and holds the look with {b} for exactly one second longer than she needs to, which converts an accident into a statement. She is not apologising and she is not going to, and the room reads the whole transaction correctly and files it.",
      "\"Somebody was going to,\" {a} says, which is true and is not the point, and she says it with the ease of a queen who has already decided that being disliked this early is a price rather than a problem. {b} says nothing. {b} will remember it.",
      "{a} does not take it quietly. She takes it, turns, and asks {b} — sweetly, loudly, in front of everybody — whether she had her eye on it too. {b} says no. Everybody knows that is a lie, including {a}, who asked precisely so that {b} would have to tell it.",
    ],
  }),
  e({
    id: 'contest-friendly-fire', from: 'assign', cast: 'pair',
    note: '{a} lost it to a friend, and is not going to make {b} feel bad about it.',
    lines: [
      "{a} wanted it and {b} got it and the first thing {a} does is tell {b} she is going to be incredible in it, which is true and is also costing {a} something to say. {b} knows exactly what it cost. That is what makes them friends and what is going to make this week complicated.",
      "The pick lands and {a} laughs, genuinely, and says \"of course you did,\" and hugs her. The disappointment arrives about forty minutes later at her own station with nobody watching, which is when {a} deals with everything.",
      "{b} takes it and immediately looks at {a}, because {b} knew {a} wanted it too, and {a} shakes her head before {b} can start. \"Do not. It is fine. It is genuinely fine.\" It is mostly fine. The gap between mostly and genuinely is where the rest of the week lives.",
      "They both wanted it and they are friends and the friendship absorbs it in about four seconds — a look, a shrug, a hand on an arm — but everybody who has been watching these two knows a small thing just got put in a drawer rather than thrown away.",
    ],
  }),
  e({
    id: 'contest-let-it-go', from: 'assign', cast: 'pair',
    note: '{a} lost it to {b} and decides it does not matter. She means it.',
    lines: [
      "{a} loses it to {b} and the reaction is a shrug that is not performed. She wanted it; she does not have it; the day is still eight hours long. She is at her station working on the alternative before {b} has finished celebrating, which the room notices even if nobody says so.",
      "\"It is a slot,\" {a} says, to a queen who asked whether she is alright. \"It is not the week.\" She says it evenly and she goes back to work and the evenness is either enormous maturity or an excellent impression of it, and this early nobody can tell which.",
      "{b} takes it and {a} does not spend one second on it. No look, no comment, no muttering to the queen next to her — she reads what is left, picks the best of it, and starts. Somebody at the next station says \"you are very calm\" and {a} says \"I am very busy.\"",
      "The pick goes to {b} and {a} lets it go so completely that two queens check on her about it, which annoys her more than losing the pick did. \"I am fine,\" she says. \"I promise you I am fine.\" She is. It is the most disarming thing she does all day.",
    ],
  }),
  e({
    id: 'contest', from: 'assign', cast: 'pair',
    note: 'Both of them wanted the same character, part or material. {a} got it because she picked first.',
    lines: [
      "{a} picks first and takes the part {b} wanted, and {b}'s face when the pick is announced tells the room everything about what just happened. {a} does not apologise. A draft is a draft and the order is the order and sympathy does not exist at the pick stage — it exists afterwards, at the station, when {a} is building the thing {b} wanted.",
      "They both wanted it. {a} got it. The moment the pick lands, {b} looks at {a} with an expression that is not anger — it is the thing that comes before anger, which is the recalculation of a plan that just lost its centre. {a} takes the pick and walks to her station and does not look back because looking back would be acknowledging what she took.",
      "{b} reaches for the same part at the same time and {a} gets there first and the getting-there-first is the whole event. {b} composes herself. {b} picks something else. {b} will spend the rest of the week building a version of the challenge that is not the version she wanted, while {a} builds the version {b} designed in her head.",
      "The pick goes to {a} and {b} says \"that is fine\" in a tone that is not fine. {a} hears the tone and files it. They both wanted the same thing and {a} won the toss and winning a toss is a small advantage that carries the specific weight of knowing somebody else lost it.",
    ],
  }),
  e({
    id: 'dump', from: 'assign', cast: 'pair',
    note: '{a} is a captain and makes sure {b} ends up on the other team. The room notices.',
    lines: [
      "{a} has the picks and uses them precisely enough that {b} ends up on the other team without {a} ever having to say why. The room watches the draft happen and the room can count and the counting tells the room that {b}'s placement is not an accident — it is a decision, made by a captain who does not want that queen's energy near her work.",
      "Captain {a} picks around {b} with the surgical precision of somebody who has already decided {b} is a liability and has constructed a draft order that delivers {b} to the other side of the room without ever naming the reason. {b} ends up on the other team. The other team's captain looks at {b} and then at {a} and understands exactly what just happened.",
      "{a} drafts her whole team and {b} is not on it, and the not-being-on-it is the tell. {b} walks to the other team and the walk has the energy of somebody who was not rejected — she was redirected, deliberately, by a captain who smiled while doing it.",
      "The draft unfolds and {a} makes sure {b} is the other captain's problem. She does it with picks, not words — choosing around {b} in a pattern that leaves {b} standing on the wrong side of the room when the music stops. The room notices. {b} notices. {a} is already talking to her team.",
    ],
  }),

  // ══ THE MINI ═════════════════════════════════════════════════════════
  e({
    id: 'read-landed', from: 'mini', cast: 'pair',
    note: '{a} read {b} and it was genuinely brutal and genuinely funny.',
    lines: [
      "{a} turns to {b} and delivers something so precise that the room pauses before it laughs. The read is brutal — specific, accurate, and aimed at exactly the thing {b} is most sensitive about — and it is also very funny, which is the only thing that makes it acceptable. {b} takes it like a queen. {b} does not have a choice.",
      "The read lands and the landing shakes the room. {a} goes for {b} with material that is clearly premeditated and clearly brilliant and {b}'s face does the thing where it decides between laughing and crying and picks laughing because the cameras are on. The room howls. The read was earned and the earning does not make it hurt less.",
      "{a} reads {b} with something she has obviously been saving and the saving paid off because the delivery is perfect and the target is correct and the room erupts in the way that means somebody just said the unsayable. {b} clutches her chest and screams and the screaming is half performance and half real shock.",
      "\"I am not going to say it,\" {a} says, and then says it, and what she says about {b} is so specifically, devastatingly accurate that {b} puts her head down on the table. The room is gone. {a} has just won the mini with one sentence and the sentence will be in every recap of this episode.",
    ],
  }),
  e({
    id: 'read-missed', from: 'mini', cast: 'pair',
    note: '{a} went for {b} and it did not land, which is worse than not going.',
    lines: [
      "{a} goes for {b} and the room gives her nothing. The read is not wrong — it is just not funny, which is worse than wrong because wrong can be reclaimed and unfunny cannot. {b} stares at {a} with the expression of somebody who was bracing for a hit and received a push, and the push is the insult.",
      "The read misses. {a} delivers it with confidence and the confidence makes the miss louder because the room expected something to land and what landed was silence. {b} looks at {a} and {a} looks at {b} and neither of them can make this better. The read is over and the read did not work.",
      "{a} tries to read {b} and the reading slides off. The material is weak, or the delivery is flat, or the target does not care enough to react, and a read without a reaction is just somebody being mean in an empty room. {a} moves on quickly. Not quickly enough.",
      "She swings for {b} and misses by enough that the miss becomes the moment instead of the read. {a} can feel the room deciding not to laugh and the not-laughing is louder than anything she said. Going for somebody and landing is art. Going for somebody and missing is footage of a different kind.",
    ],
  }),
  e({
    id: 'pulled-the-punch', from: 'mini', cast: 'pair',
    note: '{a} had something on {b} and would not use it, because they are close. {b} notices.',
    lines: [
      "{a} has material on {b} and everybody in the room knows she has material on {b} because {a} has been sitting next to {b} for four weeks and has seen everything. She does not use it. She reads {b} gently, on something surface, something safe, and {b} looks at her and knows exactly what {a} chose not to say, and the not-saying bonds them.",
      "The read is soft. {a} goes for something easy about {b} and the room laughs a little and {a} moves on, and {b} catches her eye afterwards and the look says \"thank you\" because {b} knows what {a} was holding. They are close enough that the real material would have been devastating and {a} decided devastating was not worth the win.",
      "{a} could destroy {b} right now. She has the material — specific, earned, drawn from weeks of proximity — and she puts it away and reads {b} on something light instead. The room gets a medium laugh. {a} gets something the room cannot give her, which is {b} looking at her afterwards and knowing she was protected.",
      "Everybody expects {a} to go hard on {b} because {a} has been three chairs away from {b} for the entire season. She does not. The read is kind. The kindness is the read, because in a room full of queens going for each other, the decision not to go is the loudest thing {a} does.",
    ],
  }),
  e({
    id: 'did-her-proud', from: 'mini', cast: 'pair',
    note: 'They styled each other and both of them look good because of it.',
    lines: [
      "{a} and {b} styled each other and both of them look better than they walked in, which is the point and also the hardest thing to do in a room full of queens who are all fighting for attention. The looks match without being identical, the references land, and both of them walk with the confidence of somebody who trusts the person who dressed them.",
      "The styling is mutual and the mutuality produced something neither of them would have built alone. {a} dressed {b} like she knows her — the proportions are right, the palette is right, the wig is a choice that only works if you understand {b}'s face — and {b} returned the favour with the same precision. They walk out as a pair and the pair reads.",
      "{a} and {b} look good. Not fine, not acceptable — good, in the specific way that means somebody else cared about how they looked. {a} put thought into {b}'s look and {b} put thought into {a}'s look and the thought is visible in the details: the hem length, the earring, the lip colour that matches the eye.",
      "Both of them walk out looking like queens who were dressed by somebody who loves them, which on this show is the difference between styling somebody and dressing somebody. {a} and {b} styled each other. The result is two people who look like a pair because they were built as a pair, and the building shows.",
    ],
  }),
  e({
    id: 'did-her-dirty', from: 'mini', cast: 'pair',
    note: 'They styled each other and neither of them is going to let it go.',
    lines: [
      "{a} and {b} styled each other and the results are an argument. {a} looks at what {b} put her in and {b} looks at what {a} put her in and the looking produces a silence that is worse than yelling because the silence means they are both deciding how to say \"what did you do to me\" without starting a war on camera.",
      "The styling was mutual and the mutuality produced two queens who are both furious about what happened to their faces. {a} gave {b} a look that does not suit her and {b} returned the favour with interest. They walk out together and the together is a formality — the looks say two people who stopped caring about each other somewhere around the foundation.",
      "Neither of them looks good and both of them know it is the other one's fault. {a} is wearing something {b} put together with what feels like contempt, and {b} is wearing something {a} assembled with what feels like indifference, and the distance between contempt and indifference is the argument they are about to have as soon as the cameras are not between them.",
      "{a} and {b} styled each other and the result is a pair of queens who look like they were dressed by somebody who was thinking about something else. The wigs are wrong, the palettes clash, and both of them walk the runway with the stiff posture of people who are wearing an insult and know it.",
    ],
  }),

  // ══ THE SNATCH GAME DESK, NOW THAT THE HOST IS AT IT ═════════════════
  e({
    id: 'host-played-along', from: 'snatch-game', cast: 'solo',
    note: 'The host came at her directly and she took the setup and ran with it. The exchange is better than anything scripted.',
    lines: [
      "The host turns to {a} mid-panel and throws her a setup and {a} catches it and sends it back harder and faster and the exchange that follows is better than anything scripted — two people riffing in real time, building off each other's timing, until the panel is watching a scene that was not in the format and is better than the format.",
      "He comes at her. Not a softball, not a layup — a real setup, aimed at the character, and {a} takes it and turns it into something the writers could not have written because the writers were not in the room when it happened. The exchange lasts eight seconds and the eight seconds are the best Snatch Game moment of the season.",
      "{a}'s character catches the host's eye and the host goes at her directly and the directly produces something extraordinary — an improvised exchange between two people who are both performing and both genuinely funny and the intersection of those two things is a moment the room will replay.",
      "The host feeds {a} a line and {a} feeds back something better and the volley goes on for three exchanges and by the end of it the host is laughing with her rather than at her, which is the distinction between a good Snatch Game and the Snatch Game the season is remembered for.",
    ],
  }),
  e({
    id: 'left-to-hang', from: 'snatch-game', cast: 'solo',
    note: 'The host came at her and she had nothing to give back, so he let the silence sit and then moved on to somebody else.',
    lines: [
      "The host turns to {a} and throws her a setup and {a} has nothing. Not a weak answer — nothing. The pause stretches and the host lets it stretch, which is worse than moving on immediately because the stretching is a choice and the choice says the host wanted to see if something was coming and now knows that nothing is. He moves on. {a} sits in the chair.",
      "He comes at her and she freezes. The character is gone — not thin, gone — and what is left is {a} sitting behind a desk with a wig on, mouth slightly open, producing silence into a room that expected a joke. The host waits. The waiting is a cruelty the format allows. Then he turns to the next queen.",
      "{a} gets the host's attention and has no idea what to do with it. He feeds her a setup. She blinks. The blink becomes a pause and the pause becomes a silence and the silence becomes the specific kind of dead air that tells the panel everything they need to know about whether this Snatch Game is working. The host moves on without comment, which is the comment.",
      "The setup arrives and nothing comes back. {a} opens her mouth and the character is not there and the silence that follows is the worst sound a Snatch Game can produce — a queen with the host's attention and nothing to say. He lets the beat land, then pivots to somebody who has something, and the pivoting is louder than anything {a} could have said.",
    ],
  }),

  // ══ THE ACTING SET ═══════════════════════════════════════════════════
  e({
    id: 'dropped-a-line', from: 'acting', cast: 'solo',
    note: 'She loses the line on camera. There is no second take.',
    lines: [
      "{a} drops the line. Not a stumble, not a paraphrase — a full stop, mid-sentence, on camera, with the scene still running around her. There is no second take. The cameras keep rolling and {a} stands in the middle of a scene she is no longer in, mouth open, reaching for words that were in her head ten seconds ago and are not there now.",
      "The line is gone. {a} had it in rehearsal, she had it in the walk-through, and it left her the moment the camera was live. She stops. The scene does not stop. The other queens keep acting and {a} is standing in the frame like a person who walked into the wrong room.",
      "She forgets the line on camera and there is no second take and the forgetting becomes part of the scene — a character who was supposed to speak and instead produced three seconds of visible panic that will be in the edit because the edit does not have anything else to cut to.",
      "{a} opens her mouth and the line is not there. The scene continues past her like a train she was supposed to be on and is now watching leave. No second take. No reset. She stands in the shot and the standing is what makes it into the final cut.",
    ],
  }),
  e({
    id: 'stepped-on-her', from: 'acting', cast: 'pair',
    note: '{a} talks straight over {b} in a shared scene. It works for {a} on screen and {b} has to stand there.',
    lines: [
      "{a} talks straight over {b} in the middle of their scene. Not a half-beat overlap — a full steamroll, {a}'s line landing on top of {b}'s, and the camera stays on {a} because {a} is the one still talking. {b} stands there with the unfinished sentence still in her mouth and nowhere to put it.",
      "The scene belongs to both of them and {a} takes it. She talks over {b}'s line, takes the focus, and delivers the rest of the scene as if the interruption was scripted. It was not scripted. {b} adjusts, which means {b} stops talking, which means {b}'s performance just became a reaction shot to {a}'s.",
      "{a} steps on {b}'s line and the stepping works — for {a}. The energy reads as confident, the timing reads as bold, and the camera catches {a} delivering while {b} is left standing in the frame with nothing to do and no way to get the scene back without looking like she is fighting for it.",
      "In the shared scene, {a} talks over {b} and the talking-over is not subtle. {b}'s line disappears under {a}'s delivery. On screen it looks like {a} is commanding the scene. Off screen, {b} is swallowing the rest of a line she rehearsed and will not get to say.",
    ],
  }),
  e({
    id: 'one-note', from: 'acting', cast: 'solo',
    note: 'She plays the part exactly the way she plays everything. The panel has a word for this and will use it.',
    lines: [
      "{a} plays the part exactly the way she plays everything. The same energy, the same cadence, the same face she makes when she is being funny in the werk room, brought to a character that is supposed to be somebody else. The panel has a word for this. The word is one-note. They will use it.",
      "The character is {a}. Not a version of {a} filtered through the part — just {a}, in a costume, saying lines in the same voice she uses for everything. The performance does not transform. It occupies. And the occupying is the note the judges are going to give her.",
      "She brings herself to the part and nothing else. {a} plays the role the way she would play any role — the same register, the same timing, the same defaults — and the result is a performance that tells the panel she has one gear and the gear is not what this scene needed.",
      "{a} delivers the lines and the delivery is identical to every other delivery she has given in every other scene she has been in. The part asked for a character. {a} brought herself. The distance between those two things is the distance between acting and reading words out loud in a costume.",
    ],
  }),
  e({
    id: 'ignored-the-note', from: 'acting', cast: 'solo',
    note: 'The director gave her a good note and she heard it and did it her way anyway.',
    lines: [
      "The director gives {a} a note. A good note — specific, actionable, aimed at the thing in the performance that is not landing. {a} nods. {a} does it her way anyway. The take runs and the thing the note was about is still there, unchanged, and the director watches the monitor knowing the note was heard and ignored.",
      "{a} gets a direction and does not take it. She heard it — she was looking at the person saying it, she was nodding — but when the cameras roll the performance is identical to the one before the note, which means she either did not understand it or understood it and chose herself over it.",
      "The note was good. {a} ignored it. The director told her to pull back and she pushed forward, or the director told her to find the joke and she found the drama, and the result is a performance shaped by the queen's instinct rather than the direction, and the instinct is wrong.",
      "She hears the note and does the opposite. {a} is given a clear direction between takes and the next take comes out identical to the last one, which is the specific kind of stubbornness that looks like confidence from the inside and looks like not listening from the panel.",
    ],
  }),
  e({
    id: 'took-a-bad-note', from: 'acting', cast: 'solo',
    note: 'She was given a bad note and followed it, because it came from the person holding the clipboard.',
    lines: [
      "{a} takes a bad note. She takes it because it came from the person holding the clipboard, and the clipboard is authority, and {a} follows authority even when the authority is steering the scene into a wall. The take comes back worse than the one before it and {a} delivered the worse version with the confidence of somebody who was told to.",
      "The direction was wrong and {a} followed it anyway. She was told to go bigger. She goes bigger. The bigger is worse. But the note came from the person directing the scene, so {a} commits to the bigger with the trust of a queen who has decided that the person behind the camera knows better than the person in front of it.",
      "Somebody gave {a} a bad note and she took it to the letter. The performance shifts in the direction the note pointed and the direction is wrong and {a} does not know it is wrong because the note came from somebody she trusts more than her own instincts. The take that results is worse than the one she gave unprompted.",
      "{a} is given a note that does not serve the scene and follows it with full commitment, because she was told to. The performance pivots in the direction of the note and the pivot is visible and the visibility is the problem — a queen doing something she does not believe in, on instruction, with the energy of obedience rather than conviction.",
    ],
  }),

  // ══ THE COMMERCIAL ═══════════════════════════════════════════════════
  e({
    id: 'found-the-angle', from: 'commercial', cast: 'solo',
    note: 'The product has an obvious approach that never works, and she found the other one.',
    lines: [
      "The product has an obvious angle — the angle every queen sees, the angle that never works — and {a} finds the other one. She sells the thing sideways, through character or absurdity or deadpan commitment to a bit that should not work and does, and the thirty seconds she gets are the thirty seconds the panel will replay.",
      "Every other queen sells the product straight. {a} sells it wrong, on purpose, and the wrongness is the angle. She finds the read of the product that nobody else saw — the one that makes it funny rather than just loud — and delivers it with the timing of somebody who knew the obvious approach would fail.",
      "{a} finds the angle. The product is ridiculous and the obvious play is to be ridiculous with it and every queen who plays it obvious will be forgettable. {a} plays it specific. She finds the one thing about the product that can be turned, and turns it, and the turning is what makes the commercial work.",
      "The product is unsellable and {a} sells it anyway. Not by being louder or sillier or more desperate than the obvious approach — by finding the angle nobody else found, the read of the product that makes it genuinely funny, and committing to that read for the full thirty seconds with the precision of somebody who knew what she was doing before the camera rolled.",
    ],
  }),
  e({
    id: 'tagline-died', from: 'commercial', cast: 'solo',
    note: 'The line the whole spot was built to land on gets nothing.',
    lines: [
      "The tagline dies. {a} builds the whole thirty seconds toward it — the setup is there, the energy is there, the camera is in the right place — and the line lands on the room like a stone landing in a dry well. Nothing comes back. The spot was built for that moment and the moment produced silence.",
      "She delivers the tagline and nothing happens. The line that the entire commercial was constructed around hits the air and falls out of it. {a}'s face in the half-second after she says it is the face of somebody who heard the silence before anyone else did.",
      "The line dies on arrival. {a} has been selling for twenty-five seconds and the sell was building to the tagline and the tagline comes out flat and strange and lands in a place where laughter was supposed to be. The spot crumbles backward from the punchline — without it, the setup is just a queen talking.",
      "{a}'s tagline gets nothing. Not a groan, not a courtesy laugh — the specific silence that means the room heard the line and decided it was not funny and the deciding happened faster than the line took to say. The whole commercial was a runway to that moment and the moment was a wall.",
    ],
  }),

  // ══ IMPROV, WITH NO PREPARATION AT ALL ═══════════════════════════════
  e({
    id: 'froze', from: 'improv', cast: 'solo',
    note: 'She is handed a premise cold and nothing comes. The pause is on camera.',
    lines: [
      "{a} is handed a premise cold and nothing comes. She stands on the stage with the setup in her hands and no idea what to do with it and the pause is on camera — three seconds, four seconds, five — and the silence has a texture that everybody in the room recognises because it is the texture of a queen who has been asked to invent something and cannot.",
      "The premise arrives and {a} freezes. Not a pause-for-effect freeze — a genuine, visible, I-have-nothing freeze, the kind where her eyes go flat and her mouth opens and the room waits and the waiting turns into the scene because the scene she was supposed to create is not coming.",
      "Nothing comes. {a} is given a setup and the setup produces a blank and the blank is on camera and the camera is patient and the patience is cruel. She stands there. The premise sits in the air between her and the audience like a question nobody is going to answer.",
      "{a} gets the premise and the premise gets silence. She opens her mouth and closes it and the closing is visible from the panel because the closing means she had a thought and the thought was not good enough and now she has no thought at all. The pause stretches. The cameras do not cut.",
    ],
  }),
  e({
    id: 'ran-with-it', from: 'improv', cast: 'solo',
    note: 'She commits to a premise she was given seconds ago and builds something out of nothing.',
    lines: [
      "{a} is handed a premise she has never seen before and commits to it instantly and the committing builds something out of nothing — a character, a scene, a bit that escalates with every beat because she is not thinking, she is reacting, and the reacting is faster than thought and funnier than preparation.",
      "The premise arrives cold and {a} runs with it. She does not pause. She does not plan. She opens her mouth and the premise becomes a scene and the scene becomes the best thing on the stage because nerve is a skill and {a} has more of it than anybody else in the room.",
      "She builds something out of nothing. {a} gets a setup she was given seconds ago and turns it into a bit that escalates and the escalation has the quality of someone who is genuinely funny in real time — not performing funny, not reciting funny, inventing funny, right now, with no preparation and no safety net.",
      "{a} commits. The premise is strange and cold and she has never seen it before and none of that matters because she is already inside it, building a scene out of nerve and instinct, and the scene works because she trusts the premise more than the premise deserves and the trust becomes its own material.",
    ],
  }),

  // ══ THE PHOTOSHOOT, THE STUDIO, THE BAND, THE THREE WALKS ════════════
  e({ id: 'used-the-set', from: 'photoshoot', cast: 'solo',
    note: 'The set was fighting her and she used it instead of resisting it. One frame, and it is the frame.',
    lines: [
      "The set was fighting her — wind, water, a prop that was not cooperating — and {a} used it instead of resisting it. She leaned into the wind, she let the water hit her, she turned the uncooperative prop into a character choice, and the frame that came back is the frame. One image, and it is the image the panel holds up during the critique.",
      "{a} stops fighting the set and starts using it. The moment she does, the shoot changes — the elements that were making every other queen rigid and defensive become the composition, and the frame she delivers from inside the difficulty is the best image of the night.",
      "The set is not cooperating and {a} decides to cooperate with the set instead. She leans into the wind, she lets the water change the shape of the garment, and the frame she gets out of the not-cooperating is better than any frame she would have gotten out of ideal conditions. She used the difficulty. The using is the shot.",
      "One frame, and it is the frame. {a} takes a set that was designed to make queens struggle and finds the image inside the struggle — the wind becomes movement, the water becomes texture, and the frame that comes back has the quality of something planned rather than something survived.",
    ],
  }),
  e({ id: 'blank-frame', from: 'photoshoot', cast: 'solo',
    note: 'Four frames and nothing behind the eyes in any of them.',
    lines: [
      "Four frames and nothing behind the eyes. {a} stands on the set and gives the camera four images and in every one of them the face is doing the same thing, which is nothing — no presence, no command, no moment. The costume is there. The wig is there. The queen is elsewhere.",
      "{a} delivers four blank frames. The poses change, the angles change, and the thing behind the eyes does not change because the thing behind the eyes is nothing. The panel sets the images down with the specific quiet of people who cannot find anything to discuss.",
      "The photoshoot produces four frames and all four have the same absence in them. {a} is on the set and she is in the frame and she is not in the image. The distinction is the critique — present in body, absent in performance, four times, with nothing to show for any of them.",
      "Nothing behind the eyes in any of them. {a} gives the camera four frames and the camera gives the panel four photographs of a queen who was there and was not present, and the distance between being there and being present is the distance between a photograph and a blank.",
    ],
  }),
  e({ id: 'blew-the-formation', from: 'choreography', cast: 'solo',
    note: 'She goes the wrong way in a formation and takes the shape of the routine with her.',
    lines: [
      "{a} goes the wrong way. Left when the formation goes right, and the going-wrong takes the shape of the routine with her — the queens on either side adjust, the queens behind them adjust to the adjustment, and for four counts the formation is a mess that started with one person in the wrong place.",
      "The formation breaks because {a} breaks it. She goes left and the routine goes right and the queens around her scatter to avoid the collision and the scattering is visible from the back of the room. One queen in the wrong place at the wrong time, and the wrong ripples outward through the number.",
      "{a} takes the formation down with her. She moves the wrong direction in a transition and the queens on either side have to choose between the choreography and the collision, and they choose to avoid the collision, and the avoiding turns a clean formation into a mess that takes three counts to recover.",
      "She goes the wrong way and the formation goes with her. {a} turns left in a transition where the routine turns right, and the turn takes the shape of the number apart — the queens next to her break their positions, the line behind them wobbles, and for a moment the entire routine is a group of people trying to find where they were supposed to be.",
    ],
  }),
  e({ id: 'nailed-the-solo', from: 'choreography', cast: 'solo',
    note: 'The eight counts written for her alone, and she takes them.',
    lines: [
      "The solo comes and {a} takes it. Eight counts written for her alone — the formation opens, the stage clears, and {a} fills it with eight counts of choreography that the room will remember longer than the routine around it. She dances the solo like she has been waiting for it, which she has.",
      "{a}'s solo is the best thing in the number. The formation parts and she steps forward and the eight counts she is given are the eight counts the routine was built for — she performs them with the authority of a queen who does not need anybody else on stage to hold attention.",
      "Eight counts alone on stage and {a} nails every one of them. The solo section opens and she takes the space and fills it with choreography that is cleaner, sharper, and more committed than anything she did in the formation. The formation was the job. The solo was the moment.",
      "The solo is hers. {a} steps out of the formation and takes her eight counts and the eight counts are the clip — sharp, full-bodied, performed with the energy of somebody who has been holding back in the group work because the group work was not where she was going to shine. This is where she shines.",
    ],
  }),
  e({ id: 'lost-in-rehearsal', from: 'choreography', cast: 'solo',
    note: 'She cannot pick the material up in the room, hours before she has to do it in front of people.',
    lines: [
      "{a} cannot pick the choreography up in the room. The choreographer walks it, the queens around her walk it, and {a} stands in the rehearsal space watching her own feet do the wrong thing. She is hours away from performing this in front of people and she does not have it. The not-having is visible to everybody in the room and nobody is saying it out loud.",
      "She is lost in rehearsal. {a} watches the choreographer demonstrate the routine and her body does not reproduce what her eyes are seeing. She is a count behind, a step behind, and the behind is growing rather than shrinking. The queens around her start giving her cues. The cues are not helping.",
      "The rehearsal room is where {a} finds out she cannot do this. The choreography is taught, the queens around her learn it, and {a} stands in the formation doing a version of the moves that is close enough to recognise and far enough from correct to be a problem. She has hours. The hours are not going to be enough.",
      "{a} cannot pick the material up. The choreographer gives the count, the formation moves, and {a} moves approximately — the right direction, the wrong timing, the right arms, the wrong feet — and the approximately is the thing the choreographer sees and the thing {a} sees and the thing neither of them is going to fix before tonight.",
    ],
  }),
  e({ id: 'cracked-a-note', from: 'singing', cast: 'solo',
    note: 'Live, with a band, and the note goes. Everybody hears it.',
    lines: [
      "The note cracks live. {a} reaches for it and the voice breaks and the break is audible over the band and the band is still playing and the playing continues while the cracked note sits in the room like a dropped glass. Everybody hears it. There is no version of a cracked note that is not heard by everybody.",
      "{a} hits the note and the note does not hold. The crack is live — with a band behind her, with the room listening, with the cameras recording — and the cracking is the kind of vocal moment that cannot be undone because it happened in real time in front of people who know what the note was supposed to sound like.",
      "Live, with a band, and the note goes. {a} reaches for the pitch and the pitch is not there and the not-being-there produces a sound the room hears all at once — a crack, a break, the specific vocal failure that happens when a queen attempts a note her voice cannot reach tonight. The band keeps playing underneath it.",
      "The crack is audible from the back of the room. {a} sings the note live and the note gives out and the giving-out is on top of a band that does not stop because the band cannot stop, and the crack hangs in the air for a beat before the next line arrives to cover it. The next line does not cover it.",
    ],
  }),
  e({ id: 'forgot-the-lyric', from: 'singing', cast: 'solo',
    note: 'The words leave her while the band keeps playing.',
    lines: [
      "The words leave her. {a} is singing live and the lyric disappears — not a stumble, not a swap, a gap, a bar of nothing while the band plays the song she is supposed to be singing. She mouths something. The something is not the lyric. The band fills the space her voice used to occupy.",
      "{a} forgets the lyric mid-song and the forgetting is on camera with a band still playing. She opens her mouth and the words that come out are not the words of the song and the not-being-the-words is visible to the panel because the panel knows the song and the panel is watching.",
      "The lyric goes. {a} is singing live and the words leave her somewhere in the second verse and what follows is a queen standing at a microphone making sounds that are not lyrics while a band plays the correct song underneath her. She reaches for the chorus. The chorus may or may not arrive.",
      "She loses the lyric while the band keeps playing. {a} is mid-song and the words disappear — gone, not wrong, gone — and the band fills the bar she leaves empty and the filling is louder than her silence but not louder than the panel's silence, which is the silence of people watching a queen forget a song in front of them.",
    ],
  }),
  e({ id: 'sang-it-out', from: 'singing', cast: 'solo',
    note: 'She can actually sing, and the room finds out in about four bars.',
    lines: [
      "{a} can actually sing. The room finds out in about four bars — she opens her mouth and the voice that comes out is not a drag voice, it is a voice, and the distinction between those two things is the distinction between performing a song and singing one. The band behind her adjusts to follow her. The band does not follow queens who cannot sing.",
      "She sings and the room changes. {a} delivers a vocal that is genuinely good — on pitch, in control, with the breath support and the phrasing of somebody who has been singing before she was doing drag — and the panel watches a queen reveal a skill the room did not know she had.",
      "Four bars in and the room knows. {a} can sing — not attempt to sing, not approximate singing, sing — and the singing has the quality of a real vocal performance delivered by a queen who happens to be on a stage in full drag rather than a queen in drag who happens to be attempting a vocal.",
      "{a} opens her mouth and the voice is real. Not a surprise act, not a novelty — a genuine vocal delivered live with a band, on pitch, with the kind of control that only exists in a person who has been doing this for years. The room finds out she can sing in about four bars. The four bars change the room.",
    ],
  }),
  e({ id: 'repeated-herself', from: 'runway-challenge', cast: 'solo',
    note: 'Three categories and she has given the panel the same look three times.',
    lines: [
      "Three categories and {a} has given the panel the same look three times. Different colours, different accessories, the same silhouette, the same mood, the same queen dressed the same way for three different briefs. The panel sees it on the second walk. By the third walk the panel is writing the critique.",
      "{a} walks three categories and the categories get the same answer. The silhouette does not change. The reference does not change. The energy does not change. What changes is the colour, and a colour change across three identical shapes is not range — it is one look that owns three hangers.",
      "She repeats herself. Three categories, three walks, and {a} delivers the same silhouette three times with the confidence of a queen who either does not know she is repeating or does not think the panel will notice. The panel notices. The panel always notices.",
      "The same look walks three times in three different colours and {a} is inside it every time. The runway asks for range and she gives it a garment she is comfortable in, presented three ways that are not different enough to be three looks. One look. Three times. The panel's note will be short.",
    ],
  }),
];

export const MAXI_EVENT_IDS = MAXI_EVENTS.map(x => x.id);

export function unwrittenMaxiEvents() {
  return MAXI_EVENTS.filter(x => !x.lines || x.lines.length < 4).map(x => x.id);
}
