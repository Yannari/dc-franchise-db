// ══════════════════════════════════════════════════════════════════════
// dr/data/brief-voices.js — the announcement, in this challenge's words
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The same bug as the runway, one screen earlier, and it was found the same
// way: by reading a real episode. This is a Talent Show Extravaganza — every
// queen does a solo act on a bare stage with one rehearsal slot — and the
// reactions that printed under it were:
//
//   "...somewhere she is casting and choreographing and picking fabric..."
//   "...a plan, arriving fully formed..."
//   "...she is already building her approach..."
//
// Nobody is casting anybody. There is no fabric and no choreography and no
// team to build an approach with. Those sentences were written for a girl
// group number and they print, word for word, under a stand-up set, a
// makeover, a photoshoot and a Snatch Game, because `announce-reaction` was
// tiered on how well the week suited her and knew nothing whatsoever about
// what the week WAS.
//
// It is the same failure `familyForChallenge` was invented to fix one screen
// later, where a collapse on a Snatch Game is being stuck in a chair unable
// to drop the character and a collapse on a Rusical is being off-key in front
// of a live band. The announcement deserves the same treatment: the challenge
// is named in the brief and then never referred to again by anybody reacting
// to it.
//
// ── THE TWO POOLS ─────────────────────────────────────────────────────
//
//   BRIEF_VOICES      how the host explains THIS challenge.  17 families × 1.
//   REACTION_VOICES   how it lands on HER.  17 families × 3 aptitudes.
//
// Both key on the same family list as js/dr/data/maxi-performance.js, and
// `familyForChallenge` is the same function, so a challenge that has a
// performance family automatically has a brief and a set of reactions.
//
// ── THE THREE APTITUDES ARE RANKED, NOT SCORED ────────────────────────
//
// stage.js ranks the room on how well each queen's craft suits THIS
// challenge's own scoring blend — the same blend the performance is judged
// on, so "this is her week" means what the engine means by it — and cuts the
// field three ways. Only a handful of queens react out loud; it is not a
// register of the whole room.
//
//   delighted  top of the room for this brief. It is hers and she knows it.
//   braced     the middle. She can do it. She is not thrilled about it.
//   dreading   the bottom. This is the week she was afraid of.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// THIRD PERSON HERE, unlike the runway pools. This is the werk room with a
// camera in it rather than her voiceover over her own walk, and the register
// of the werk room is already established — intimate, funny, watching people
// who have not yet had to perform.
//
// Placeholders:
//   {a}  the queen reacting. REACTION lines only — the brief is addressed to
//        the room and must not single anybody out.
//   {c}  the challenge, by name, e.g. Talent Show Extravaganza.
//
// SAY WHAT SHE IS ACTUALLY GOING TO HAVE TO DO. That is the whole instruction
// and it is the entire reason for the file. A delighted reaction to a Snatch
// Game is her already knowing which character she is doing; to a Rusical it is
// a trained singer hearing there is a live band; to a Talent Show it is a
// woman who has had the same eight-minute act since she was twenty-two and
// has finally been asked for it. Three different reactions to the same tier,
// because they are three different weeks. A line that would print correctly
// under any family is a line that has not been written yet.
//
// Same rules as every other pool, all enforced by tests: no real people, this
// show's vocabulary only, never quote a stat by number, four variants minimum
// per tier, prose rather than captions.

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The three cuts, best to worst. Do not add to it. */
export const APTITUDE_IDS = ['delighted', 'braced', 'dreading'];

/**
 * The families, and what each one asks of a queen.
 *
 * `solo` is on every entry because it is the thing the old pool got most
 * visibly wrong — a reaction about casting and building an approach printed
 * under a challenge where she stands on a stage by herself. A writer filling
 * a solo family must never reach for a team.
 */
const fam = (family, solo, note, brief, reactions) => ({
  family, solo, note, brief, reactions,
});

const REACT = (delighted, braced, dreading) => [
  tier('delighted', delighted), tier('braced', braced), tier('dreading', dreading),
];

export const BRIEF_FAMILIES = [
  fam('snatch-game', true,
    'The celebrity impersonation game. She picks a character, sits at a desk '
    + 'and has to be funny in someone else\'s voice for as long as it takes.',
    tier('brief', 'The host explains the game, the desk, and the picking of a character.', [
      'This week is {c} — each queen picks a character, sits behind a desk and has to be funny in somebody else\'s voice for as long as it takes.',
      'For {c}, the host lays out the rules: pick a character, commit to the voice, and be funny on command while the cameras roll and the desk is the only thing to hide behind.',
      '{c} is the simplest game on the show and the hardest to survive — a desk, a character and a queen who has to make the panel laugh without breaking.',
      'The host announces {c}: one character each, chosen today, performed at a desk with nothing scripted and nowhere to go when the bit stops working.',
    ]),
    [
      tier('delighted',
        'An impressionist who has had a character ready since the day she was cast.', [
        '{a} already has a character — has had one since the cast list dropped — and she is doing the voice under her breath before the host finishes talking.',
        'The brief lands and {a} grins, because she has been workshopping this impression in her hotel room for weeks and finally gets to use it.',
        '{a} has been waiting for this week the way a singer waits for a vocal challenge — the character is chosen, the voice is locked, and the desk is just furniture.',
        'This is {a}\'s week and everybody in the werk room knows it, because she has been doing bits at the mirror since day one and all of them were auditions for this.',
      ]),
      tier('braced',
        'She has one character she can do and is about to find out if it is enough.', [
        '{a} has a character — one character, rehearsed in the mirror, never tested in front of anybody who was not already laughing — and she is betting the week on it.',
        'There is a voice {a} can do, passably, in short bursts, and the question is whether passably survives a full game under panel lights.',
        '{a} nods and reaches for the safe choice, the character she can hold for five minutes without dropping, which is not the same as being funny for five minutes.',
        '{a} has done this impression at brunch and it killed, but brunch is three mimosas deep and forgiving in ways a panel desk is not.',
      ]),
      tier('dreading',
        'She cannot do voices, has never been able to do voices, and everybody knows.', [
        '{a} does not do impressions — has never done impressions, has no instinct for them — and the brief is a door closing on the only week she cannot prepare for.',
        'The game requires a voice that is not hers, and {a} has only ever had the one voice, delivered at one volume, which was fine until today.',
        '{a} sits with the brief and tries to think of a single character she could hold for longer than a sentence, and the list stays empty.',
        'Every queen in the room is already naming characters, and {a} is staring at the desk assignment trying to remember a single impression she has ever landed.',
      ]),
    ]),
  fam('girl-group', false,
    'A track, a verse each and choreography, in a group. Writing, singing and '
    + 'dancing at once, and a team that can sink her.',
    tier('brief', 'A song, verses to write, choreography to learn, and teams.', [
      'This week is {c} — a track, a verse each, choreography to learn together, and teams that will share a stage and a score.',
      'For {c}, every queen writes her own verse, learns the group choreography and performs it live, and the teams are drawn today.',
      '{c} asks for three things at once: write a verse that sounds like her, learn choreography that was not made for her body, and do both inside a team she did not choose.',
      'The host announces {c}: a song split into verses, choreography taught this morning and performed tonight, and the teams living or dying together.',
    ]),
    [
      tier('delighted',
        'She writes, she dances, and a group is where she has always been best.', [
        '{a} writes, she dances, and a group number is where all of it comes together — she has been the anchor of ensembles since before she auditioned for this.',
        'The brief is three skills and {a} has all three, and the team format means she can lift whoever lands beside her instead of carrying alone.',
        '{a} hears group number and her whole posture changes — writing is her language, choreography is her body, and a team is where she has always done her best work.',
        'For {a}, a verse and a dance in a group is the most natural week the competition could have handed her, and she is already humming structure.',
      ]),
      tier('braced',
        'Two of the three, and she is hoping the third is somebody else\'s verse.', [
        '{a} can write and she can move, or she can move and she can perform — two of the three, and the third is going to depend entirely on who else is on her team.',
        'There are queens in this room who do all three, and {a} is not one of them, but she can fake the weakest leg if the team covers her.',
        '{a} is already calculating which role she can claim before somebody assigns her the one she cannot do, because a group number exposes the gap fast.',
        'Two of the three skills {a} has, solidly, and the verse she is about to write will either hide the third or put a spotlight on it.',
      ]),
      tier('dreading',
        'She cannot dance and the verse has to be written by tonight.', [
        '{a} cannot dance — has never been able to, not even passably — and a group number puts that on a stage beside queens who can, which is worse than doing it alone.',
        'The choreography alone would sink {a}, but the verse has to be written by tonight and she has never written lyrics under pressure, and the team will feel both.',
        '{a} is looking at a week built from her three weakest skills, performed live in a group that will know exactly who dragged it down.',
        'A group number means a team, and a team means witnesses, and {a} is about to be the reason the choreography looks uneven and everybody in the room can do that math.',
      ]),
    ]),
  fam('rumix', true,
    'A track, and a verse each to write and record. Writing is the challenge; '
    + 'the booth decides what survives it, and she performs it live.',
    tier('brief', 'A verse to write, a booth to record it in, and a live stage tonight.', [
      'This week is {c} — every queen writes her own verse to one track, records it in the booth, and performs it live on the main stage tonight. No teams. No partners. The verse is the challenge.',
      'For {c}, every queen writes four bars, records them with a vocal coach, and then performs the whole thing live. The track is shared. The verse is hers. The booth is the test and the stage is the proof.',
      '{c} asks for a verse. Written today. Recorded today. Performed tonight. The host explains the order — write, booth, stage — and the room does the maths on how many hours that leaves for four bars.',
      'The host announces {c}: a verse challenge. Write the bars. Record them. Stand on the stage alone and perform them live to the track. \"You are all solo this week,\" she says. \"There is nobody to hide behind.\"',
    ]),
    [
      tier('delighted', 'She writes, and a verse is the one thing here she can do alone.', [
        '{a} writes. She has always written. A verse challenge is the week she packed for — bars come naturally, the booth is a formality, and the stage is where she gets to prove it. She is already scribbling.',
        'The brief lands and {a} is grinning. She writes bars the way other queens sew gowns — fast, confident, and with a style the room recognises. This is her week and she knows it before the host finishes talking.',
        '{a} hears verse challenge and exhales. This is the one. No teams to carry her, no teams to drag her. Just her words, her voice, her stage. \"Finally,\" she mouths.',
        'A verse is the one thing {a} can do alone, and alone is how she does her best work. She has four bars in her head before the host has finished the brief. The booth will be a formality.',
      ]),
      tier('braced', 'She can write or she can sing, and this asks for both in one day.', [
        '{a} can write. She cannot sing, exactly, but she can sell a verse if the verse is strong enough. The brief is manageable. The booth is the part she is worried about.',
        'The verse she can handle. The booth is the question mark. {a} has written bars before — not professionally, not under pressure — and a vocal coach watching her record them is a different thing from writing them alone at a mirror.',
        '{a} nods through the brief. She can do this. She has enough rhythm to scan four bars and enough nerve to stand on a stage alone. Whether the booth turns that into a verse the panel wants to hear is the question she cannot answer yet.',
        'A verse challenge. {a} can write, and she can perform, and the recording session in between is the part where either of those skills might fail to translate. \"I just need the bars to be good,\" she tells herself. The bars have to be good.',
      ]),
      tier('dreading', 'She has never written a bar in her life and it is going on tape.', [
        '{a} has never written a verse. Not a bar. Not a hook. Not a line. She is a queen who performs other people\'s words and today the words have to come from her and they have to come by tonight.',
        'The brief drops and {a} goes quiet. She cannot write lyrics. She has never been able to. The booth is going to record whatever she manages to put on paper and the panel is going to hear the recording and the recording is going to be honest.',
        '{a} picks up a pen and puts it down. The pen is the problem. The verse is the problem. She is a performer, not a writer, and a solo verse challenge is the week that makes that distinction into a verdict.',
        'A verse. Written today. Recorded today. Performed tonight. {a} is staring at a blank page and the page is going to be on tape in six hours. \"Girl,\" she says to nobody. That is all she says.',
      ]),
    ]),
  fam('music-video', true,
    'One video for the whole cast, parts handed out by the host, and a day on '
    + 'set with a director who will tell the panel how she was.',
    tier('brief', 'A video, parts she does not get to choose, and a day in front of a camera.', [
      'This week is {c} — a music video for the whole cast. The host hands out the parts. A director runs the set. The panel watches the playback, and the director tells them how the day went.',
      'For {c}, the cast shoots a video together. Parts are assigned by the host — lead down to ensemble — and the director runs the set. She is on the panel, and what she saw on that set is what the judges hear about.',
      '{c} is a shoot day. The host casts it, the director runs it, and the tape is what the panel judges. \"The camera does not lie,\" the host says. \"And neither does the director.\"',
      'The host announces {c}: one video, one day on set, and a call sheet she did not write. The parts are handed out, not chosen. The director is watching. The panel will hear her notes.',
    ]),
    [
      tier('delighted', 'She is a camera queen and somebody is finally pointing one at her.', [
        '{a} is a camera queen. She has always been a camera queen. A video shoot is the week she has been waiting for — a lens instead of a panel, a director instead of an audience, and finally somebody is going to see what she looks like on tape.',
        'The brief lands and {a} lights up. A camera. A director. A set. This is the week that plays to everything she knows how to do — she has been shooting content since before the show, and a professional set is the upgrade she has been wanting.',
        '{a} hears music video and her posture changes. She knows how to find a lens. She knows what her face does on camera. \"This is MY week,\" she says. She is not wrong.',
        'A shoot day. {a} has been waiting for a camera week since episode one. Stage queens project. Camera queens calibrate. {a} calibrates, and a director is about to see the difference.',
      ]),
      tier('braced', 'She can act or she can dance, and the part she is given decides which.', [
        '{a} can do this. Probably. It depends on the part. She can act, she can move, but a camera is not a stage and the adjustment is the thing she is not sure about. \"What is my part?\" That is the question.',
        'The brief is manageable if the part is right. {a} can perform — on a stage, for an audience. For a lens, with a director calling the shot? She will find out today.',
        '{a} nods. A video. She can work with that. She is not a camera queen but she is not afraid of one. The part she gets will decide whether this is a good week or a long day.',
        'A music video. {a} has done photoshoots. She has done acting challenges. A video is both at once, plus a director she has never met. \"I can do this,\" she says. The \"can\" is doing a lot of work.',
      ]),
      tier('dreading', 'She is sized for a stage and a lens will make that obvious.', [
        '{a} performs for the back row. She always has. A camera two feet from her face is the opposite of everything she knows how to do, and a director telling her to be smaller is going to sound like a director telling her to be worse.',
        'The brief drops and {a} is calculating how to survive a day she is not built for. She is a stage queen. She fills rooms. A lens does not need to be filled — it needs to be found, and finding it is a skill she does not have.',
        '{a} has never been good on camera. She knows this. Every queen who has seen her content knows this. A whole challenge built around a lens is the week she was hoping would not arrive.',
        'A video shoot. {a} looks at the queens around her — the ones who do content every day, the ones who know their angles — and knows she is starting this week behind them. \"I just need a part I can act,\" she says. She might not get one.',
      ]),
    ]),
  fam('rusical', false,
    'A staged musical number with a live vocal and a live band. The most '
    + 'technical week of the season and the least forgiving.',
    tier('brief', 'A musical, a part to be cast in, and a live vocal.', [
      'This week is {c} — a full musical number with a live vocal, a part to be cast in, and choreography that does not stop while she sings.',
      'For {c}, every queen auditions for a role, learns her part, sings live and dances at the same time, in front of a band that will not cover her.',
      '{c} is the most technical week of the season — a staged musical with live vocals, a live band, choreography, and a part she may or may not have chosen.',
      'The host announces {c}: a musical production, parts assigned today, live singing over a live band, and the choreographer watching from the wings.',
    ]),
    [
      tier('delighted',
        'A trained singer hearing the words "live band" and going somewhere else.', [
        '{a} hears live band and her eyes go somewhere else entirely — she trained for this, years of it, and a musical is the only week where all of it counts.',
        'The brief is a musical with a live vocal and {a} is a singer first, has always been a singer first, and this is the week the competition finally scores on that.',
        '{a} is already running scales under her breath because a live vocal is the one thing she does not have to worry about, which frees her to worry about everything else.',
        'A live band, a choreographed number, a part to sing — {a} has done this in theatres and the only difference is the judging panel, which she considers an improvement.',
      ]),
      tier('braced',
        'She can hold a tune. Holding it while dancing is a different question.', [
        '{a} can sing — not trained, not polished, but on pitch and in time — and the question is whether she can hold it while hitting choreography she learned this morning.',
        'The vocal is fine. {a} can carry a tune in a room. Carrying it while moving, in costume, under lights, on a stage she has never rehearsed on, is the part she cannot answer for.',
        '{a} has the voice for it, barely, and the dancing for it, barely, and the week is going to come down to whether barely-and-barely adds up to enough.',
        '{a} nods through the brief and files the live vocal under manageable, which leaves the choreography and the acting to fight over which one she panics about first.',
      ]),
      tier('dreading',
        'She does not sing, and this is the week where not singing is audible.', [
        '{a} does not sing — not in a room, not in a car, not anywhere someone could hear and form an opinion — and the band is live and there is nowhere to hide.',
        'The brief is a musical and {a} has never carried a tune in her life, and a live band is the most honest accompaniment a bad singer can receive.',
        '{a} sits with the reality that a live vocal means a live vocal, no track to lean on, no mix to save her, just her pitch against a band that is going to be in tune.',
        'A staged musical with choreography would have been hard enough, but the live vocal turns it into the week {a} has been dreading since the cast list was announced.',
      ]),
    ]),
  /* ── THE STAND-UP, WHICH USED TO BE THE ROAST ──
     One voice served both until a played episode 13 narrated five queens
     roasting under a screen headed "Stand-Up Challenge". The difference is
     the target: a roast has one — a guest, the panel, each other, sitting in
     the room hearing it — and a stand-up has nobody to aim at at all. Five
     minutes of her own material, and the thing being judged is whether she is
     funny with no victim to hide behind.
     EMPTY POOLS, NOTES WRITTEN. `briefLinesFor` returns null for an unwritten
     family and the renderer falls back to the neutral `the-brief` beat, so
     the screen says the challenge's name and not somebody else's challenge.
     docs/PROSE-PROMPT-dr-stand-up.md is the brief for filling them. */
  fam('stand-up', true,
    'Five minutes of her own material to a live audience, about her own life. '
    + 'No target, no scene partner, no character to hide behind — the one '
    + 'challenge where being funny ABOUT somebody is not an option.',
    tier('brief', 'A stand-up set: her own jokes, five minutes, and nobody to aim them at.', []),
    REACT(
      'A comic who has been waiting for five minutes and a microphone.',
      'She is funny in a room. Five minutes alone on a stage is a different skill and she knows it.',
      'She is funny AT people. Take the target away and she does not know what she is.')),
  fam('roast', true,
    'Stand-up, on a stage, to a live audience, about people sitting in front '
    + 'of her. Her own material, her own timing, nowhere to hide.',
    tier('brief', 'A roast: her own jokes, a live room, and the people she is roasting in it.', [
      'This week is {c} — stand-up on the main stage, her own material, a live audience, and the people she is roasting sitting in the front row.',
      'For {c}, every queen writes her own set, walks out alone and delivers it to a room full of people who are allowed to not laugh.',
      '{c} is comedy with no safety net: her own jokes, her own timing, a microphone and a room that will tell her in real time whether she is funny.',
      'The host announces {c}: each queen writes her own material and performs it live, to a panel that includes the people she is roasting, who will also be scoring.',
    ]),
    [
      tier('delighted',
        'A comedian who has been waiting all season to be given a microphone.', [
        '{a} has been waiting all season for a microphone and a room, and the brief is both at once — she writes comedy, she has always written comedy, and a roast is a homecoming.',
        'The brief lands and {a} is already writing in her head, because stand-up is the one thing she does not have to learn and the only thing she has wanted to be scored on.',
        '{a} is a comedian before she is a queen, and a roast is the week where that finally matters more than whether she can sew.',
        'A live room and her own material — {a} has done this in bars smaller than the werk room, and the only difference is that tonight the stakes are real.',
      ]),
      tier('braced',
        'She is funny in a room. A stage is not a room and she knows the difference.', [
        '{a} is funny — genuinely, reliably funny in conversation — but a microphone and a stage turn funny into stand-up, and stand-up is a different discipline.',
        'She is the funniest person in most rooms she walks into, and {a} is trying to decide if that holds when the room has a spotlight and a panel.',
        '{a} can land a joke when she is talking. Scripting one, timing it, and delivering it to a room that paid to judge her is the gap she is staring at.',
        '{a} has the instinct — she is quick, she reads a room, she has timing — but writing a set is not the same as being funny, and she has never written a set.',
      ]),
      tier('dreading',
        'She has never written a joke and now has an afternoon to write seven.', [
        '{a} has never written a joke on purpose in her life, and the brief is asking her to write an entire set by tonight and deliver it standing alone on a stage.',
        'The brief asks for her own material, and {a} does not have material — has never had material, has never needed it — and an afternoon is not enough to invent a voice.',
        '{a} is not funny on command, has never been funny on command, and a roast is the purest form of funny-on-command the competition offers.',
        'Writing jokes is not a skill {a} has ever practiced, and the roast is tomorrow, and the distance between those two facts is wider than anything she can close overnight.',
      ]),
    ]),
  fam('makeover', false,
    'She has to drag somebody else and make them her sister. Somebody else\'s '
    + 'face, body and nerve, and a look built for two.',
    tier('brief', 'A stranger to paint, dress and turn into family, then walk with.', [
      'This week is {c} — each queen is paired with a stranger she has to paint, style and transform into her drag sister, then walk the runway together.',
      'For {c}, somebody who has never been in drag walks into the werk room, and each queen has to turn that person into family by tonight.',
      '{c} is the most personal challenge the show does — a face that is not hers, a body she did not choose, and a look that has to read as the same queen twice.',
      'The host announces {c}: each queen receives a partner, paints a face she has never painted, builds a look for a body she has never dressed, and walks beside the result.',
    ]),
    [
      tier('delighted',
        'A queen with drag daughters, being asked to do the only thing she loves more.', [
        '{a} has drag daughters — has painted faces and built looks and walked girls through their first night for years — and this is not a challenge, it is a Tuesday.',
        'The brief says transform a stranger and {a} is already planning the mug, because she has turned civilians into queens before and she knows exactly how the face changes a person.',
        '{a} lights up because a makeover is not about her paint — it is about whether she can read somebody else\'s face, and reading faces is the thing she does best.',
        'For {a}, putting somebody in drag for the first time is the single most rewarding thing about being a queen, and the competition has finally asked for it.',
      ]),
      tier('braced',
        'She can paint a face. Getting a stranger to walk is the part she cannot rehearse.', [
        '{a} can paint — she paints her own face well enough to be here — but a stranger\'s bone structure and a stranger\'s confidence are two variables she cannot control.',
        'The mug is manageable. {a} can get a face done. Getting a stranger to walk in heels and sell it on the runway is the half of this week that no amount of skill covers.',
        '{a} knows her own paint and her own proportions and her own walk, and the brief is asking her to export all three to somebody who has never done any of it.',
        'She can do the look. {a} can build a look for another body if she has the time. The question is whether the person inside it can carry it, and that is out of her hands.',
      ]),
      tier('dreading',
        'She can barely paint her own face and now there are two of them.', [
        '{a} has one face she can paint — her own, on a good day, with three hours — and the brief is telling her to do it twice, on a stranger, by tonight.',
        'The makeover requires a mug she is not confident in on her own face, applied to a face she has never seen, and {a} is already doing the math on how badly this goes.',
        '{a} paints herself by muscle memory, in an order she cannot explain, and translating that to a stranger\'s face is not a skill she has — it is a prayer.',
        'Two looks, two mugs, one of them on a person who has never worn lashes, and {a} is not certain she can get her own right under this kind of pressure.',
      ]),
    ]),
  fam('ball', true,
    'Three looks in one night, at least one of them sewn from scratch. The '
    + 'week that is decided by how much she can physically make.',
    tier('brief', 'Three categories, three looks, and one of them built from nothing.', [
      'This week is {c} — three categories, three looks, and at least one of them constructed from scratch in the werk room.',
      'For {c}, every queen walks the runway three separate times, in three different looks, and the one she builds here is the one that decides the week.',
      '{c} is the week that separates the queens who sew from the queens who pack — three categories, three walks, and the one she makes from scratch carries the most weight.',
      'The host announces {c}: three runway categories, three complete looks, and nobody is getting through this week on what she brought in her luggage alone.',
    ]),
    [
      tier('delighted',
        'A seamstress being told to sew, which is the whole reason she came.', [
        '{a} is a seamstress — has been sewing since before she started doing drag — and a ball is the only week where that matters more than her personality.',
        'The brief says build a look and {a} is already sketching, because her hands are the strongest tool she brought and a ball is the week they finally count.',
        '{a} has packed for the other two walks and she already knows what she is building for the third, because she has been planning this garment since she got the call.',
        'A ball is the week {a} was cast for and she knows it — three looks is not a challenge, it is a showcase, and the construction walk is where she intends to end the conversation.',
      ]),
      tier('braced',
        'Two looks she packed and one she has to make, and the making is the risk.', [
        '{a} packed two strong looks and can build something for the third — not fast, not elegantly, but enough to stand beside the two she is confident in.',
        'The two packed categories {a} has covered. The construction is the variable, and she is running the clock in her head, figuring out which ambition fits inside the hours she has.',
        '{a} can sew, slowly, if the design is simple and the fabric cooperates, and a ball is about to test whether slowly is fast enough.',
        'Two looks ready, one to build, and {a} is already scaling back her design to something she can finish rather than something she would be proud of.',
      ]),
      tier('dreading',
        'She does not sew, and there is no version of this week where that is hidden.', [
        '{a} does not sew, has never sewn, and a ball puts that on the runway beside queens who build gowns for a living.',
        'The brief says construct a look and {a} is staring at a sewing machine she has used exactly once, in a mini challenge, badly.',
        'Three looks, one from scratch, and {a} cannot cut a pattern — the two she packed might save her, but the third is going to be whatever she can glue together by morning.',
        '{a} has survived every week on performance and personality, and a ball is the one week where neither of those can cover for a garment that falls apart on the walk.',
      ]),
    ]),
  fam('design', true,
    'Build a garment out of what she is given, against the clock, and walk in '
    + 'it. Judged on the building.',
    tier('brief', 'An unlikely material, a machine, and a runway at the end of it.', [
      'This week is {c} — build a garment out of what is in the room, against the clock, and walk the runway in whatever she manages to make.',
      'For {c}, every queen gets the same unconventional material, the same tools and the same deadline, and the runway will show exactly who can construct and who cannot.',
      '{c} strips the week down to building — no concept to hide behind, no help to share the load, just a material, a machine and a clock running down.',
      'The host announces {c}: an unlikely material, a workstation, and a finished garment due on the runway by tonight, judged entirely on what she built.',
    ]),
    [
      tier('delighted',
        'She sews, and a challenge scored on sewing is a challenge she has already won.', [
        '{a} sews — sews well, sews fast, sews under pressure — and a design challenge is the only week where that is the whole score.',
        'The brief says build a garment and {a} is already at the machine, because construction is the one thing she trusts completely and this week asks for nothing else.',
        '{a} looks at the material and sees a garment in it before anybody else has touched theirs, because this is what her hands were trained for.',
        'A design challenge is the purest week {a} could ask for — no acting, no comedy, no vocals, just whether she can build something that walks.',
      ]),
      tier('braced',
        'She can put a garment together. Whether it survives a walk is another matter.', [
        '{a} can use a machine and she can cut a shape, and the question is whether what she makes in the time she has will hold together under lights.',
        'She can build something. {a} has enough technique to get a garment on a mannequin, but the walk is where construction shows its seams, literally.',
        '{a} knows the machine and knows the material well enough to start, and the design will have to be whatever her skill level can finish by the deadline.',
        '{a} has the basics — she can stitch, she can drape, she can get something on her body — and the brief is about to find out where the basics end.',
      ]),
      tier('dreading',
        'A machine she cannot use and a deadline she cannot move.', [
        '{a} cannot sew and the brief is build a garment, which is the shortest distance between a queen and the bottom the competition offers.',
        'The machine is a stranger to {a}, the material is hostile, and the deadline is fixed, and she is already calculating how little garment she can walk in.',
        '{a} does not build things — she buys them, borrows them, commissions them — and this is the week where all three of those options are gone.',
        'A design challenge with no team and no rescue, and {a} is standing in front of a workstation she does not know how to use while the clock starts.',
      ]),
    ]),
  fam('talent-show', true,
    'ALONE, ON A BARE STAGE, WITH ONE REHEARSAL SLOT. Whatever she can do, '
    + 'done live, with no brief to interpret and no team to blame. THE FAMILY '
    + 'THIS FILE WAS WRITTEN FOR — the old generic reactions had her casting '
    + 'and choreographing, and there is nobody to cast and nothing to '
    + 'choreograph that she is not doing herself.',
    tier('brief', 'One act each, her own choosing, same stage and same time for everybody.', [
      'This week is {c} — one act each, performed live on the main stage, with one rehearsal slot and nothing between her and the panel.',
      'For {c}, every queen steps onto a bare stage and delivers whatever she does best, alone, with one rehearsal and one shot at it.',
      '{c} is as simple as it gets and as exposing — one queen, one stage, one act she chose herself, and the panel watching every second of it.',
      'The host announces {c}: each queen gets one rehearsal slot and one performance, alone on the main stage, doing whatever she believes is worth four minutes.',
    ]),
    [
      tier('delighted',
        'She has had the same act since she was twenty-two and has finally been asked for it.', [
        '{a} does not even flinch — she has been doing this act in clubs for years and has been waiting all season for somebody to ask.',
        'The brief lands and {a} is already running the act in her head, marking transitions she has hit a thousand times in rooms louder than this one.',
        '{a} lights up the way only a queen with a road-tested act can — she packed for this week and she packed heavy.',
        'For {a}, this is the week the competition finally asks for the thing she actually does, and her relief is visible from across the werk room.',
      ]),
      tier('braced',
        'She has something she can do. She is not sure it is worth four minutes.', [
        '{a} has something — a number, a bit, a skill she has never performed for a panel — and she is running the math on whether it fills the stage.',
        'There is an act in {a} somewhere, and the next few hours are about finding out whether it survives being done on purpose, under lights, alone.',
        '{a} nods slowly, already editing the act down in her head, cutting everything that needs a crowd reaction she cannot guarantee.',
        '{a} knows what she can do — she is less certain it translates to a stage, alone, with nothing but a spotlight and a time limit.',
      ]),
      tier('dreading',
        'Asked what her talent is, and genuinely not knowing what to say.', [
        '{a} goes very still, because the one thing every queen dreads is being asked what she does best and having no answer ready.',
        'The brief hits {a} like a wall — no script to memorize, no choreography to follow, no partner to lean on, just her, doing something she has not identified yet.',
        '{a} is already scanning the room for queens who look excited, and placing herself on the wrong side of that line.',
        'Every queen has a thing, and {a} is standing in the werk room trying to remember what hers is while the rehearsal slot creeps closer.',
      ]),
    ]),
  fam('lalaparuza', true,
    'Lip syncs, one after another, in a bracket. No garment, no script, no '
    + 'preparation that helps — only whether she can perform a song.',
    tier('brief', 'A bracket of lip syncs, and everybody is in it.', [
      'This week is {c} — a bracket of lip syncs, every queen against every queen, and the stage is the only thing that matters.',
      'For {c}, the panel clears out, the songs go up, and every queen in the room lip syncs head to head until the bracket decides who is left standing.',
      '{c} is the rawest week the show does — no garment, no script, no preparation that helps, just whether she can perform a song better than the queen across from her.',
      'The host announces {c}: a lip sync bracket, no construction, no comedy, no concept — just performance, song after song, until somebody wins.',
    ]),
    [
      tier('delighted',
        'A performer who would lip sync every week if they let her.', [
        '{a} would lip sync every week if they let her — she lives on a stage, she performs to a song the way other queens perform to a mirror, and a bracket is a gift.',
        'The brief is pure performance and {a} is a performer, has always been a performer, and a bracket full of songs is the only format where she cannot lose on a technicality.',
        '{a} grins because a lip sync bracket strips away every advantage the other queens have — the sewing, the writing, the painting — and leaves only the one she has.',
        'A bracket of lip syncs is {a}\'s home court, and she has never been more relieved to hear a brief in her life.',
      ]),
      tier('braced',
        'She can do a lip sync. Doing four of them is a different ask.', [
        '{a} can do a lip sync — has done one, survived it, knows the mechanics — but a bracket is not one song, it is several, back to back, and stamina is a different skill.',
        'One lip sync {a} can handle. A full bracket means doing it again and again, each time against somebody who is also tired, and she is not sure her energy holds.',
        '{a} has the performance instinct to survive a single song, and the bracket is asking whether that instinct holds when the songs keep coming and the adrenaline runs out.',
        'She can perform. {a} is not worried about the first lip sync — she is worried about the third one, when her body remembers how many songs she has already given everything to.',
      ]),
      tier('dreading',
        'She survives on craft and craft is not in this room tonight.', [
        '{a} survives on craft — her construction, her paint, her concepts — and a lip sync bracket has removed every one of those tools and left only the stage.',
        'The brief strips away everything {a} is good at and replaces it with the one thing she has been avoiding all season: a song and a stage and nothing else.',
        '{a} has survived lip syncs by never being in one, and the bracket just put her in the thing she has spent the whole competition trying to dodge.',
        'A bracket of lip syncs, and {a}\'s entire strategy has been built on never having to do one — craft, concepts, garments, anything that keeps her off that stage.',
      ]),
    ]),
  fam('acting', false,
    'A scripted scene, on camera, with a director watching and lines to '
    + 'remember. Timing, character, and doing it again when it is wrong.',
    tier('brief', 'A script, a part, a camera and a director who will stop her.', [
      'This week is {c} — a scripted scene, on camera, with a director watching and parts assigned today.',
      'For {c}, every queen gets a part, learns lines, and performs on camera with a director who will call cut and make her do it again until it works.',
      '{c} puts every queen on a set with a script, a co-star, a camera and a director who is not going to let a bad take slide.',
      'The host announces {c}: a scripted scene to learn, a camera to perform for, and a director who has the authority to stop everything and start over.',
    ]),
    [
      tier('delighted',
        'An actor being handed a script, which is the only thing she has ever wanted.', [
        '{a} takes the script and she is already reading — she acts, she has always acted, and a camera and a director is the only thing she has wanted all season.',
        'The brief is scripted and {a} is an actor first, a queen second, and a week with lines and a director is the closest this competition gets to her real life.',
        '{a} reads the part once and starts marking her beats, because she has done this on sets before and the format is the only one in the competition that does not scare her.',
        'A script and a director — {a} has trained for this, literally, and the brief is the first one all season that asks for a skill she does not have to fake.',
      ]),
      tier('braced',
        'She can hit a line. She has never been directed and is about to be.', [
        '{a} can memorize lines and deliver them — she has done that much in skits and shows — but a director calling cut and asking for it differently is new territory.',
        'She can learn the part. {a} has the memory for lines and the ear for delivery, but performing on camera with somebody else controlling the pacing is a skill she has not tested.',
        '{a} knows her lines will be clean — memorization is not the problem. The problem is taking direction, adjusting on the spot, and doing it again without the energy dropping.',
        'The script is manageable. {a} can hit a mark and say a line. Whether she can do it on the third take, differently, because the director did not like the first two, is the question.',
      ]),
      tier('dreading',
        'She cannot remember lines and the camera does not forgive it.', [
        '{a} cannot remember lines under pressure — has never been able to, not even short ones — and the camera is going to record every blank stare and fumbled cue.',
        'The script is in her hands and {a} is already counting pages, because memorization has always been her weakest skill and a camera does not edit around it.',
        '{a} reads the part and the lines swim — she learns by doing, by moving, by feeling, and a script on a page is the opposite of how her brain works.',
        'A camera, a script and a director who will stop her, and {a} is the queen in the room least equipped to survive any of those three things.',
      ]),
    ]),
  fam('commercial', false,
    'Sell something absurd, on camera, in under a minute, with a co-star and '
    + 'a director. Charm compressed into a very small space.',
    tier('brief', 'A product, a camera, a co-star and almost no time.', [
      'This week is {c} — each queen sells something absurd, on camera, with a co-star, in under a minute, and charm is the only skill that matters.',
      'For {c}, the product is fake, the pitch is real, the camera is rolling, and every queen has one shot to be the most convincing person in the room.',
      '{c} compresses everything into a minute: a product nobody needs, a camera that does not wait, a co-star sharing the frame, and a sell that has to land immediately.',
      'The host announces {c}: a ridiculous product, a partner, a camera, and almost no time to sell something she does not believe in to a panel that is scoring the sell.',
    ]),
    [
      tier('delighted',
        'A natural salesman finding out the product is ridiculous, which is better.', [
        '{a} was born for a camera and a sell — she has the charm, the timing, the shamelessness — and a ridiculous product is funnier than a real one, which is better.',
        'The brief says sell something absurd and {a} is already pitching it in her head, because she has been the loudest, most convincing person in every room since she was twelve.',
        '{a} hears commercial and lights up — the more ridiculous the product, the more room she has to play, and playing on camera is the thing she does best.',
        'A camera, a sell and a minute to fill — {a} has the kind of energy that reads through a lens and she has been waiting for a week that rewards it.',
      ]),
      tier('braced',
        'She can be charming. She has never been charming to a lens on a count.', [
        '{a} is charming in person — she knows that, has always known that — but charm directed at a camera lens on a countdown is a translation she has never had to make.',
        'She can sell. {a} can be funny and warm and persuasive in a room, and the question is whether all of that survives the camera and the clock.',
        '{a} has the personality for it but not the technique — she has never performed to a lens, never taken direction on timing, and a commercial asks for both at once.',
        'The sell is not the problem. {a} can pitch. The camera and the countdown and the co-star sharing the frame are the three variables she cannot rehearse for.',
      ]),
      tier('dreading',
        'She freezes on camera and this is entirely camera.', [
        '{a} freezes on camera — has always frozen, every time, the red light goes on and the words disappear — and this week is nothing but camera.',
        'The brief is a commercial and {a} has no camera presence, no ability to sell to a lens, and no amount of preparation that fixes the fundamental problem of a red light turning on.',
        '{a} is a queen who works live, in person, feeding off a crowd, and a camera does not give anything back and she has never known what to do with that.',
        'A camera, a product and a sell, and {a} is the queen in the room who would rather lip sync than look into a lens and pretend to be natural.',
      ]),
    ]),
  fam('improv', false,
    'No script. A premise, a partner and a live audience, and whatever she '
    + 'says is what happens.',
    tier('brief', 'A premise, a scene partner and nothing written down.', [
      'This week is {c} — a premise, a scene partner, a live audience, and nothing scripted, nothing rehearsed, nothing to fall back on.',
      'For {c}, every queen gets a partner and a premise and has to be funny on the spot, in front of an audience, with no lines written and no safety net.',
      '{c} is unscripted, unrehearsable and live — a scene, a partner, and whatever she says next is what happens.',
      'The host announces {c}: a scene partner, a premise, a live audience, and the only preparation that matters is whether she can think on her feet.',
    ]),
    [
      tier('delighted',
        'Quick, unwriteable and finally in the week that rewards it.', [
        '{a} is quick — inhumanly, reliably quick — and an improv scene is the first challenge all season that scores on the thing she actually does in every room she walks into.',
        'The brief says nothing is scripted and {a} relaxes, because her brain works fastest when there is nothing written down and no time to second-guess.',
        '{a} has been the funniest person in the werk room since day one and none of it has counted until now — improv is the only format where fast and funny is the whole score.',
        'No script, no prep, no lines to learn — {a} hears the brief and exhales, because the absence of structure is the only structure she has ever thrived in.',
      ]),
      tier('braced',
        'She is funny when she has thought about it, which is the problem.', [
        '{a} is funny — she has proven that — but her funny is crafted, thought about, revised, and improv does not give her the time she needs to be good.',
        'She can do a scene. {a} can listen and respond and keep a bit going, but her instinct is to edit, and editing in real time is not the same as editing on paper.',
        '{a} is the kind of funny that needs a draft, and a live scene with no script is the one format that does not let her have one.',
        'The brief says unscripted and {a} nods, already planning bits she can steer toward, because her comedy has always been about preparation and this week has taken it away.',
      ]),
      tier('dreading',
        'She needs a script and has been told there is not one.', [
        '{a} needs a script — has always needed one, has never been able to think and be funny at the same time — and the brief has just told her there is not one.',
        'There is no script, no lines, no structure, and {a} is a queen who has survived every performance week by memorizing her way through it.',
        '{a} goes quiet, because improv requires the one skill she does not have — the ability to say something funny right now, not in ten minutes when she has thought of it.',
        'The brief is unscripted and {a} is already dreading the silence, the one where her scene partner says something and she has no response and the audience watches it happen.',
      ]),
    ]),
  fam('photoshoot', true,
    'Stills. A photographer, a concept and a body that has to say the whole '
    + 'thing without moving or speaking.',
    tier('brief', 'A concept, a photographer, and a still image that has to carry it.', [
      'This week is {c} — a concept, a photographer, and a single still image that has to say everything her body and her face can say without moving.',
      'For {c}, every queen steps in front of a camera and has to sell the concept in one frame, with no movement, no voice and no second chance.',
      '{c} is the week where the body is the only instrument — a photographer, a concept, and a still image that lives or dies on what her face does in the fraction of a second the shutter is open.',
      'The host announces {c}: a concept to embody, a photographer directing, and a single image that either captures something or captures nothing.',
    ]),
    [
      tier('delighted',
        'A face and a body that have never once let her down in front of a lens.', [
        '{a} photographs beautifully and she knows it — her face finds the light, her body finds the angle, and a still camera is the only audience she has never had to work for.',
        'The brief is a photoshoot and {a} has modelled, has shot editorials, has stood in front of a lens enough times to know exactly what her face does under one.',
        '{a} hears camera and concept and her posture changes immediately — she has been doing this longer than she has been doing drag, and a lens is the one thing she trusts.',
        'A photoshoot is the week {a} has been waiting for, because everything that matters here — face, body, angles, stillness — is everything she has spent years perfecting.',
      ]),
      tier('braced',
        'She photographs well enough. Directing herself is the harder half.', [
        '{a} photographs well enough — she looks good in pictures, she knows her angles — but a directed concept shoot is not a selfie, and directing herself is the half she has not practised.',
        'She can stand in front of a camera. {a} has done it before and the results were fine, but fine in a selfie and fine on a directed shoot are two different conversations.',
        '{a} knows what her face can do from the front, and the brief is asking her to do it on command, in a concept she did not choose, for a photographer she has not met.',
        'The camera is manageable. {a} can be still and she can be present, but selling a concept in a single frame requires a kind of control she has not been asked for yet.',
      ]),
      tier('dreading',
        'She is a performer and this week has taken away everything she performs with.', [
        '{a} is a performer — she moves, she talks, she fills a room — and a photoshoot has taken away every tool she uses to perform and left her with a face and a frame.',
        'The brief is a still image and {a} has never known what to do without movement, without sound, without the energy of a crowd to feed off of.',
        '{a} does not know her angles, does not know her light, and does not know how to sell a concept without her voice, her walk and the thirty other things a photograph strips away.',
        'A photoshoot asks for stillness and control, and {a} is a queen whose entire drag is built on energy and motion, neither of which a still camera can capture.',
      ]),
    ]),
  fam('choreography', false,
    'Learn it, hit it, and be on the count. A choreographer teaching in the '
    + 'morning and judging in the evening.',
    tier('brief', 'A routine to learn today and perform tonight, on the count.', [
      'This week is {c} — a choreographed routine taught this morning and performed tonight, on the count, with a choreographer who is also scoring.',
      'For {c}, the choreographer teaches the routine once, drills it all day, and tonight every queen performs it live — on the music, on the count, no faking.',
      '{c} is the most physical week of the season — a routine learned from scratch today, performed tonight, and the choreographer sitting in the front row knowing exactly who missed the count.',
      'The host announces {c}: a full routine to learn, a choreographer to impress, and a performance tonight where being off by half a beat is visible from every seat.',
    ]),
    [
      tier('delighted',
        'A dancer being asked to dance, at last, by somebody who can tell.', [
        '{a} is a dancer — trained, disciplined, years of it — and a choreography challenge is the only week where someone in the room can actually tell the difference.',
        'The brief is choreography and {a} is already stretching, because she picks up movement the way other queens pick up lyrics, and a trained choreographer is the judge she has been wanting.',
        '{a} has been waiting all season for a week that scores on her body and her count, and a choreography challenge is exactly that and nothing else.',
        'A routine to learn and perform — {a} has been doing this since she was young, and the brief is the first one that asks for the skill she spent the most years building.',
      ]),
      tier('braced',
        'She picks up choreography slowly and there is not much time to be slow in.', [
        '{a} can learn choreography — she has proven that — but she learns it slowly, by repetition, and the timeline between teach and perform is not built for slow learners.',
        'She can hit a count. {a} can get her body where it needs to be if she has enough time to drill it, and the question is whether today is enough time.',
        '{a} picks up movement in pieces, not whole phrases, and a routine taught in the morning and performed at night does not leave room for the way she learns.',
        'The choreography will come. {a} is not worried about whether she can do it — she is worried about whether she can do it by tonight, clean, on the count, without thinking.',
      ]),
      tier('dreading',
        'She does not dance, and being off the count is the one thing that shows.', [
        '{a} does not dance — not trained, not practised, not naturally coordinated — and a choreography challenge is the one week where that is visible from every angle.',
        'The brief is a routine and {a} has never been on a count in her life, and a choreographer scoring from the front row is going to see every missed beat.',
        '{a} cannot move the way dancers move — she knows this, has always known it — and a choreography challenge puts that knowledge on a stage beside queens who can.',
        'A routine, a count, a choreographer scoring — {a} is a queen who works from the neck up, and this week is asking for everything below it.',
      ]),
    ]),
  fam('singing', false,
    'A live vocal, unhidden. A track she has to actually sing, in front of '
    + 'people who will know immediately if she cannot.',
    tier('brief', 'A song, sung live, with nothing to hide behind.', [
      'This week is {c} — a live vocal, no track to lean on, no mix to hide in, just her voice in a room full of people who will hear everything.',
      'For {c}, every queen sings live, with her own voice, in front of the panel, and the microphone does not lie.',
      '{c} strips away every other skill and asks the one question that cannot be faked: can she sing, live, right now, in front of people who know what they are listening to.',
      'The host announces {c}: a song performed live, no playback, no arrangement generous enough to cover a voice that is not there.',
    ]),
    [
      tier('delighted',
        'A live vocalist hearing the only brief she has been waiting for.', [
        '{a} is a vocalist — a real one, trained, tested, confident — and a live singing challenge is the one week where the competition finally measures what she is best at.',
        'The brief says sing live and {a} exhales, because her voice is the single strongest thing about her drag and nobody has asked for it until now.',
        '{a} has been singing live in venues for years and the brief is the first one all season that asks for the skill she is most certain of.',
        'A live vocal — {a} hears those words and her whole body relaxes, because this is the week where the gap between her and the queens who cannot sing becomes audible.',
      ]),
      tier('braced',
        'She can carry a tune in a bar. This is not a bar.', [
        '{a} can sing — she has done it at shows, at events, in rooms where the crowd was kind — and the question is whether kind-room singing survives a panel and a spotlight.',
        'She can carry a tune. {a} has the pitch and the breath control to get through a song, but a live vocal on a main stage is louder and less forgiving than anywhere she has sung before.',
        '{a} can hold a note and she can feel a melody, and the gap between that and a live vocal performance scored by the panel is a gap she is about to measure in real time.',
        'The brief is a live vocal and {a} is somewhere between confident and terrified — she can sing, she just has never sung where the singing was the entire point.',
      ]),
      tier('dreading',
        'She cannot sing and there is no arrangement in the world that fixes it.', [
        '{a} cannot sing — she knows it, has always known it, has built her entire drag around never being asked to — and the brief is the one she cannot prepare for.',
        'The brief says sing live and {a}\'s stomach drops, because there is no technique, no rehearsal and no arrangement that teaches a voice to carry a note it has never carried.',
        '{a} has survived every week on performance, construction, comedy, personality — anything that is not a voice — and this week has taken all of it away and left only the voice.',
        'A live vocal with no track, no mix, no mercy, and {a} is the queen in the room whose voice has never once been the reason she was safe.',
      ]),
    ]),
  fam('runway-challenge', true,
    'The runway IS the challenge. No performance, no team, no script — only '
    + 'what she brought and what she does with it.',
    tier('brief', 'No maxi to hide inside. The looks are the whole week.', [
      'This week is {c} — no maxi challenge, no performance, no script. The runway is the entire score and the looks are the only thing that matters.',
      'For {c}, the competition strips away everything except what she brought and how she walks in it — the runway is not a supplement this week, it is the whole thing.',
      '{c} is the purest fashion week the show does — no maxi to hide a weak runway inside, no performance to distract from a bad look, just what she walks in and how it reads.',
      'The host announces {c}: the maxi is cancelled, the performance is cancelled, and what she packed is the only thing standing between her and the bottom.',
    ]),
    [
      tier('delighted',
        'A look queen finding out the week is only looks.', [
        '{a} is a look queen and the week is only looks — no acting to fumble, no comedy to bomb, no choreography to miss, just what she packed and how she wears it.',
        'The brief says the runway is the challenge and {a}\'s luggage is the deepest in the room — she packed for this week specifically, whether she knew it was coming or not.',
        '{a} lives on the runway — it is where her drag makes the most sense, where her taste reads loudest — and a week scored entirely on looks is the only fair fight she has wanted.',
        'A pure fashion week, and {a} is the queen who has been carrying every weak maxi on the strength of her runway — and this time the runway is all there is.',
      ]),
      tier('braced',
        'She packed well. She did not pack for this to be the entire challenge.', [
        '{a} packed well — strong looks, good variety, nothing embarrassing — but she packed as a supplement to a performance, not as the performance itself.',
        'The looks are fine. {a} has looks. She did not pack with the expectation that the looks would be everything, and the difference between a good runway and a winning runway is real.',
        '{a} has runway confidence, enough of it, but a week where the panel scores nothing else puts a weight on the walk she has never had to carry alone.',
        'She brought good looks and she walks well, and {a} is trying to decide if good and well are enough when there is nothing else to be scored on.',
      ]),
      tier('dreading',
        'She wins weeks on personality and personality does not walk.', [
        '{a} wins weeks on performance, comedy, charm and presence, and a pure runway week has stripped away every one of those tools and left only the garment.',
        'The brief says the looks are the score and {a}\'s drag has never been about the look — it has been about what she does while wearing it, and this week does not ask for that.',
        '{a} packed adequately, not strategically, and a week scored entirely on fashion is the one format where adequately is another word for bottom.',
        'A runway-only week, and {a} is the queen who has been saved by her performance in every challenge that her garment should have sunk her in.',
      ]),
    ]),
  fam('generic', true,
    'FALLBACK, for a challenge with no family of its own. The line may use '
    + '{c} but must assume NOTHING about what {c} involves — no stage, no '
    + 'team, no sewing, no script — because it could be any of them. Write '
    + 'about how she takes news, not about what the news is.',
    tier('brief', 'A challenge this file does not know the shape of.', [
      'This week is {c}, and the brief lays out what is expected — the format, the scoring, the deadline — and every queen hears it differently.',
      'For {c}, the host explains the challenge, the rules settle over the room, and every queen starts calculating where she stands.',
      '{c} lands in the werk room and the brief is clear enough — what is asked, when it is due, how it will be scored — and the reactions split the room immediately.',
      'The host announces {c}: the format is explained, the expectations are set, and every queen in the room is already sorting herself into confident or concerned.',
    ]),
    [
      tier('delighted',
        'It suits her, whatever it is, and she can tell from the first sentence.', [
        '{a} hears the brief and knows before the host finishes talking — whatever this asks for, it asks for something she has, and her confidence is immediate and visible.',
        'The brief lands and {a} is already planning, because the challenge plays to her strengths and she can feel it in the first sentence.',
        '{a} lights up because the week suits her — she can feel it clicking, the skills it asks for lining up with the skills she brought, and the relief is audible.',
        'Whatever this challenge is, {a} likes the shape of it — the brief reads like a list of things she can do, and she is already ahead of the room.',
      ]),
      tier('braced',
        'She could go either way on this one and knows it.', [
        '{a} listens to the brief and lands somewhere in the middle — she can do this, probably, if nothing goes sideways, and the margin between fine and bottom is thin.',
        'The challenge is neither her best week nor her worst, and {a} knows it — she has the skills to survive but not enough of any one of them to relax.',
        '{a} nods through the brief with the face of someone calculating odds — she could do well, she could struggle, and the outcome depends on variables she cannot control yet.',
        'It is a manageable week, and {a} is doing the math on whether manageable is enough when the queens who are thriving are thriving visibly.',
      ]),
      tier('dreading',
        'It is not her week and she worked that out before the host finished.', [
        '{a} knew before the host finished talking — the brief asks for something she does not have, and there is not enough time between now and the stage to build it.',
        'The challenge is not her strength, and {a} worked that out in the first sentence and has been sitting with it since, doing the arithmetic on how far her weaknesses carry her.',
        '{a} listens to the full brief and nothing improves — it is the week she has been dreading, the one that asks for the skill she has been getting by without.',
        'It is not her week and {a} can tell, because the brief feels like it was written for every other queen in the room and not for her.',
      ]),
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP — how stage.js turns a challenge into a voice
// ══════════════════════════════════════════════════════════════════════

/**
 * The brief and reactions for a family.
 *
 * `familyForChallenge` in maxi-performance.js already maps every challenge id
 * to a family and falls back to `generic`, so this takes the family it
 * returns rather than duplicating that mapping and letting the two drift.
 */
export function briefFamily(family) {
  return BRIEF_FAMILIES.find(f => f.family === family)
    || BRIEF_FAMILIES.find(f => f.family === 'generic');
}

/**
 * How the host explains this challenge, or null.
 *
 * Null rather than a fallback line, for the same reason the runway pools hand
 * back null: this file ships empty and is filled a family at a time, and an
 * unwritten family keeps the generic beat in challenge-beats.js exactly as it
 * reads today rather than printing a blank.
 */
export function briefLinesFor(family) {
  const f = briefFamily(family);
  return f && f.brief.lines.length ? f.brief.lines : null;
}

/** How the brief lands on a queen at this aptitude, or null. */
export function reactionLinesFor(family, aptitude) {
  const f = briefFamily(family);
  const t = f && f.reactions.find(x => x.id === aptitude);
  return t && t.lines.length ? t.lines : null;
}

/** Every (family, tier) pair still waiting on prose. */
export function unwrittenBriefVoices() {
  const out = [];
  for (const f of BRIEF_FAMILIES) {
    if (f.brief.lines.length < 4) out.push(`brief:${f.family}`);
    for (const t of f.reactions) {
      if (t.lines.length < 4) out.push(`reaction:${f.family}/${t.id}`);
    }
  }
  return out;
}

/** How many tiers exist across both pools, for the progress report. */
export function briefVoiceTierCount() {
  return BRIEF_FAMILIES.reduce((n, f) => n + 1 + f.reactions.length, 0);
}
