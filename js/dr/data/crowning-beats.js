// ══════════════════════════════════════════════════════════════════════
// js/dr/data/crowning-beats.js — the ceremony, slowed down
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The crowning ran in five lines and was over. A season builds for ten
// episodes and its payoff arrived and left inside one screen-scroll: the
// sash, the runner-up, the crown, a speech, the sign-off. Five paragraphs
// for the only thing the whole season is for.
//
// It read like a summary of a ceremony rather than a ceremony. What a
// crowning actually is, on this show and every show like it, is THEATRE
// WITH A HOLD IN IT — a room that has been assembled, a line of people who
// have to stand there while it happens to them, and a host whose entire
// craft on that night is making a known result take a long time to arrive.
//
// So this pool is not "more lines". It is the beats of a ceremony in the
// order a ceremony runs them, with the pauses given their own beats, because
// a pause that is not written is a pause that does not happen.
//
// ── HOW IT DIFFERS FROM finale-beats.js ───────────────────────────────
//
// `finale-beats.js` covers the whole finale EPISODE: the cast returning, the
// eleganza runway, the interviews, the showcase, the cut, the crown lip
// sync. This file covers only the last ten minutes of it — from the moment
// the lip sync is over and the host has the result in his hand.
//
// The two overlap deliberately at three ids, and this file wins where they
// do. `finale-congeniality`, `finale-runnerup`, `finale-crowning`,
// `finale-speech` and `finale-prance` in the older file are the FIVE LINES
// this exists to replace: js/dr/finale.js draws from here first and falls
// back to those only while a tier is still unwritten.
//
// ── THE STAGING THIS IS WRITTEN AGAINST ───────────────────────────────
//
// js/vp-dr/crowning.js draws the room as a stage: a line of lit name plates,
// one per finalist, and a spotlight that moves. The plates go dark one at a
// time as placements are called, from the bottom up, until two are lit; then
// one. The prose here is the sound over that picture, so it can assume the
// reader can SEE who is still standing — it never has to list them.
//
// The screen also draws the season's record under each name. A line does not
// need to recite a resume the reader is looking at.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// FILL lines. CHANGE NOTHING ELSE — not an id, not a tier, not a note, not
// the order. Every id here is named by js/dr/finale.js and by the screen; a
// renamed one silently stops being drawn, which is this project's oldest and
// quietest bug.
//
// An EMPTY lines array is safe: an unwritten tier emits no scene at all
// rather than an empty card, and the older five-line version carries the
// night until you replace it. So the file can be filled a beat at a time.
// unwrittenCrowningTiers() at the bottom lists what is still empty, and
// npm run audit:dr-spec prints it.
//
// THE RULES, all enforced by existing tests:
//
//   . Placeholders are {a} and {b} and nothing else. Never a real name,
//     never an invented queen name. {b} only where a beat has two subjects
//     — the note on each beat says what {a} and {b} are.
//   . SIX variants minimum per tier; TEN for crown-place, which fires once
//     per finalist and is the beat a reader sees most. Genuinely different
//     ones — a different angle, a different detail, a different register.
//     The repetition ceiling in this project has never been the number of
//     events, it has always been too few distinct lines inside one of them.
//   . Prose, not captions. Several full sentences. The register is the rest
//     of the show's: close third person, specific, unsentimental, earning
//     the emotion by describing behaviour instead of naming feelings.
//   . NEVER state a cast size or a number of queens — no "the other three",
//     no "eight queens". The cast is configurable and the finale can be a
//     top two, three, four or five. tests/dr-prose-counts.test.js fails the
//     build on this and it is the single easiest rule to break here, because
//     a ceremony wants to count.
//   . This show's words only. Queens, the werk room, the main stage, the
//     panel, sashay, lip sync. Never a houseguest, a camper, a tribe, a
//     jury, an eviction or a vote — THERE IS NO VOTE IN THIS SHOW. The
//     panel ranks and the host decides.
//     AND NOT "THE HOUSE", even in the theatrical sense of the auditorium.
//     It is correct English for the seats out front and it is Big Brother's
//     central noun, so a Drag Race transcript carrying it reads as the wrong
//     show. The first fill of this file used it five times and the
//     vocabulary guard caught every one. Say the seats, the front rows, the
//     audience, out front.
//   . The host's own catchphrases are quoted exactly, never paraphrased.
//     Vary everything around them. Getting these slightly wrong is the tell
//     that nobody checked.
//   . No backticks anywhere in this file. This repo has been broken three
//     times by one inside a template literal.

const tier = (id, note, lines = []) => ({ id, note, lines });

export const CROWNING_BEATS = [
  // ══ THE ROOM, BEFORE ANYTHING ════════════════════════════════════════
  /* ── THE ONE NIGHT THERE ARE TWO ──
     All Stars 4 crowned Trinity the Tuck and Monet X Change together: the
     only double crown in the show's history, announced by voiceover, the two
     never shown on stage together because the call was made late.
     The season simulates it only when the last lip sync is a genuine dead
     heat and the option is switched on, so it is rare — twice in sixty
     seasons measured. But `crown-name` says "you are THE winner of this
     season of Drag Race", singular, and on that night the ceremony would say
     it to one of two queens who both won. This beat replaces it.
     {a} and {b} are the two, and the prose must not rank them: there is no
     first and no second, which is the whole point and the whole controversy. */
  {
    id: 'crown-double', step: 'crowning', scope: 'once', speaker: 'host',
    variants: 6,
    note: 'The host crowns BOTH. {a} and {b} are the two winners and neither '
      + 'placed above the other.',
    writerNote: 'He cannot separate them, and he says so. The catchphrase is '
      + 'the same words made plural — "Con-drag-ulations, you are BOTH the '
      + 'winners of this season of Drag Race" — and everything around it '
      + 'varies. Write the room taking a second to understand, because a '
      + 'double crown is not a thing anybody in that room expected to hear. '
      + 'Do not rank them, do not hint that one was closer: they tied, and a '
      + 'line that leaks an order takes away the only thing this beat is.',
    tierBy: 'always',
    tiers: [tier('double', 'Two queens, one crown each.', [
      "\"I cannot separate you.\" The host says it and the room takes a second to understand what it means. \"Con-drag-ulations — {a} and {b}, you are BOTH the winners of this season of Drag Race.\" Two crowns. Two scepters. The room erupts because it has never seen this before and the novelty is louder than anything that has happened all night.",
      "The host looks at {a} and looks at {b} and makes no distinction between them. \"I have one crown to give and tonight I am giving it twice.\" The room goes silent and then goes very loud. \"{a} and {b} — con-drag-ulations, you are both America's Next Drag Superstars.\" The plural lands and the landing is history.",
      "\"Tonight I am doing something I have never done.\" The host holds the pause until the room is silent enough to hear what comes next. \"Con-drag-ulations — {a} and {b}, you are both the winners of this season of Drag Race.\" {a} grabs {b}'s hand and neither of them lets go and the room comes apart.",
      "\"I cannot choose between you and I will not pretend I can.\" The host is direct about it. \"You both earned this crown and you will both wear it.\" He says their names together — \"{a} and {b}\" — and the together is the point. Two crowns are placed. The room holds both of them.",
      "\"For the first time in Drag Race history —\" the host lets the room catch up to the sentence — \"I am crowning two winners.\" He looks at {a} and {b} and the looking treats them as a single verdict, because that is what they are. \"Con-drag-ulations, both of you.\" The noise that follows is the noise of a room rewriting its expectations in real time.",
      "The host does not rank them. \"Con-drag-ulations, {a} and {b} — you are both the winners.\" The words arrive and the room needs a full second to process them, and in that second {a} and {b} turn to each other with faces that say the same thing: did he just say both of us? He did. Two crowns. One night. The cast floods the stage.",
    ])],
  },

  {
    id: 'crown-hall', step: 'crowning', scope: 'once', speaker: 'narrator',
    note: 'The hall before the ceremony starts. No {a}.',
    writerNote: 'Set the SCALE, because nothing else in the season has this '
      + 'scale and the reader has spent ten episodes in a workroom. The lit '
      + 'stage, the returned cast seated out front, the crew who have gone '
      + 'quiet, the finalists waiting in the wings where they cannot see '
      + 'each other. Nobody has been named yet. Establish that this room is '
      + 'going to take its time.',
    tiers: [tier('hall', 'The room, assembled and waiting.', [
      "The stage is set the way it has not been set for anything else this season. The name plates are lit. The returned cast sits in the front rows in the best drag they own, faces forward, most of them holding hands with somebody they competed against. The crew has stopped moving. Backstage the finalists are standing in separate wings, unable to see each other, each one doing the mathematics of her own season. The room is full and the room is quiet and the quiet is the point.",
      "A season of drag has come down to a lit stage and a row of plates. The audience — every queen this competition sent home — is dressed for it, seated in a half-circle, and nobody is looking at their phone. The finalists are backstage in the wings and cannot see each other; they can hear the room, and the room is not making noise, and the silence is worse than any noise would have been. The host has not appeared. Nobody moves until he does.",
      "The hall looks different tonight. The work room lights are up, the runway is extended, and the name plates are arranged in a line across the stage with a spotlight on each one that turns the rest of the set dark. Every queen who appeared this season is in the audience, and none of them are competing any more, which changes the way they sit. There is nothing left to win from this chair. There is only watching somebody else win it.",
      "Everything about this room says ceremony. The stage floor has been re-laid. The name plates are polished and lit from below. The finalists' records are printed underneath them — wins, highs, lows — and the audience can read every line. Backstage the finalists are in full finale drag, separated from each other by a partition, and the waiting is doing what waiting always does on this show: it is making everything that follows heavier than it would have been if it came quickly.",
      "The crew have cleared the stage of everything except the name plates and they stand in a line across the front of it, lit, with nothing behind them. The returned cast fills the audience and the volume of the room is the volume of a room that knows what is coming and does not want to rush it. One queen in the back row who went home in the second week is sitting perfectly still and watching the stage like she is memorising what it looks like from outside the competition, because she will not see it from the inside again.",
      "The last ten minutes of a season always look the same from out front. The plates are lit, the host is offstage, the finalists are somewhere behind the curtain in separate wings, breathing, not talking. The returned cast sits in the audience and several of them are already crying and nothing has happened yet. The stage is a line of names that will go dark one at a time until one is left, and everybody in the building knows the shape of what is coming and nobody knows the content.",
    ])],
  },

  // ══ THE LINE-UP ══════════════════════════════════════════════════════
  {
    id: 'crown-summon', step: 'crowning', scope: 'once', speaker: 'host',
    note: 'The host calls the finalists out to their marks. No {a}.',
    writerNote: 'They walk out and they stand there, and standing there is '
      + 'the job for the next ten minutes. Nobody sits. Write the walk out '
      + 'and the arrangement of them — the host putting them where he wants '
      + 'them — and the fact that from this point none of them can leave the '
      + 'stage until they are told to.',
    tiers: [tier('summon', 'Out to their marks, and nobody sits.', [
      "The host walks out first and lets the room give him what it needs to give him, and then he calls them out. The finalists come through the curtain one at a time and each one gets a reaction that would end any other night, and tonight it is the least important thing that will happen to them. He puts them on their marks — behind the lit plates, facing the seats — and they stand, and standing is the job now. Nobody sits for what comes next.",
      "\"Come out, queens.\" The host says it simply, like it is a small thing, and each finalist walks to her plate and stands behind it and does not know what to do with her hands. The audience watches them arrange themselves. The host adjusts one, moves another half a step to the left, and the care he takes with the staging tells the room the speed this is going to run at, which is slow.",
      "They come through the curtain together and the audience rises and stays standing. The host waves them to their marks — the lit plates, the line across the stage — and waits until each one is still. \"You look incredible,\" he says, and means it, and it is the last light thing he will say before the placements begin. From this point the finalists are fixed. The stage belongs to the host and to whatever is in his hand.",
      "The finalists walk out to their plates and the room answers every entrance. The host does not speak until they are all in position. He looks at each of them, left to right, taking his time with it, and the silence that settles once the applause dies is the most deliberate silence the season has produced. These queens cannot step off their marks until the host releases them. That is the deal and they know it.",
      "\"Take your marks, ladies.\" The host's voice carries without a microphone and the finalists walk to their plates one by one. Each one looks at the name printed underneath hers — wins, lows, the entire season in a line of numbers — and then looks up at the rows in front of her. They are standing in a line and the line will get shorter and they are the ones who will leave it. Nobody sits. Nobody moves. The ceremony has started.",
      "The host brings them out with a gesture, not a speech. They file through the curtain in finale drag, cross the stage, and find the lit plate with their name on it. The last one through has to walk the furthest and the room watches every step. When they are all in position the host stands at the end of the line and lets the room take in the picture: the finalists, the plates, the light. \"Here we are,\" he says. Nothing else.",
    ])],
  },

  // ══ THE SASH ═════════════════════════════════════════════════════════
  {
    id: 'crown-congeniality', step: 'crowning', scope: 'once', speaker: 'host',
    note: '{a} is Miss Congeniality. She is almost never a finalist.',
    writerNote: 'GIVE IT ITS OWN WEIGHT, and do not write it as a runner-up '
      + 'prize. It is chosen by the cast, which makes it the only thing on '
      + 'this stage the panel had no say in, and it usually goes to somebody '
      + 'who is sitting in the audience rather than standing in the line. '
      + 'That is the whole texture of it: she is called up out of the crowd. '
      + 'One of these should be about what the cast are doing while she '
      + 'walks up, because their reaction IS the award.',
    tiers: [tier('sash', 'The cast chose her, and the panel had no say.', [
      "\"Before we go any further,\" the host says, \"there is one title that does not belong to me.\" The cast chose it. The panel had no say. Miss Congeniality — {a}. Her name comes out of his mouth and the cast is already on its feet before the sentence is finished. She stands up from her seat in the audience with both hands over her face and the queens around her push her toward the stage. The sash goes on and she holds it with the grip of somebody who did not expect to hold anything tonight.",
      "The host reads the name and {a} laughs — the startled kind, the kind that sounds like a question. She is in the audience, not in the line, and the walk to the stage is longer than she thought it would be. The cast shout her name. Every one of them. She takes the sash and puts it on and says \"thank you\" four times because she cannot find a second word. The host lets her have the moment. The moment is hers and nobody else's.",
      "Miss Congeniality is announced and the cast starts chanting {a}'s name before the host finishes reading it. She was sitting in the back row. The queens beside her are already pulling her to her feet and pointing at the stage. She walks up and the reaction she gets from the returning cast is louder than anything the finalists received, and the difference is that this noise is unanimous. Nobody had to judge this. The cast just agreed.",
      "\"This award belongs to the queens themselves,\" the host says. \"Miss Congeniality — {a}.\" She rises out of the audience and makes it halfway to the stage before a queen she competed against weeks ago intercepts her with a hug that stops her walking. The sash is waiting. She gets there eventually. The cast are still standing and they are still making noise and the noise is the award — the sash is just the thing you hold.",
      "{a} is named Miss Congeniality and looks at the finalists before she looks at the host, because the finalists are people she lived with and one of them is grinning at her so hard the composure is gone. She climbs the stage steps in a gown that was not designed for stairs and takes the sash and puts it on backwards. Somebody from the crew steps in to fix it. The audience laughs and the laughter is warm and the warmth is what this title is.",
      "The host calls {a}'s name for the sash and the cast reacts before she does. The queen beside her grabs her arm. The queen two seats over is already crying. {a} walks to the stage through a row of people who are reaching for her as she passes, and by the time she reaches the host she is holding the sash and two different people's hands. \"They chose you,\" the host says. \"Not me. Them.\" She looks at the cast. The cast looks back. That exchange is the whole award.",
    ])],
  },

  // ══ THE ADDRESS ══════════════════════════════════════════════════════
  {
    id: 'crown-address', step: 'crowning', scope: 'once', speaker: 'host',
    note: 'The host speaks to the whole line before naming anybody. No {a}.',
    writerNote: 'The calm before. He talks about the season rather than the '
      + 'result — what they walked in as, what the competition took out of '
      + 'them, what he is looking at now. It has to be warm without being '
      + 'soft, and it has to make the delay feel intentional rather than '
      + 'like padding, because the delay IS the beat.',
    tiers: [tier('address', 'The season, said out loud, before the result.', [
      "The host turns to the line and does not name a placement. Not yet. He talks about the season — what he saw the first day, what the competition did to the people standing in front of him, and what it looks like from the end rather than the middle. He is not stalling. He is putting a frame around what is about to happen so that when the names come, they come inside a context everybody shares. The finalists listen and the audience listens and the delay is deliberate.",
      "\"I want to say something before I start,\" the host says, and looks at the line of queens on their marks. He talks about what they walked in as. He talks about the version of them he is looking at now and what changed between the two. He does not name the difference; he lets it hang there, visible in the way each of them is standing. The finalists shift on their marks. One of them blinks rapidly. He sees it. He lets it pass.",
      "The host takes a breath that the microphone picks up and nobody pretends not to hear. He addresses the finalists as a group — not about the result, not about who he is going to name first or last, but about what they showed the panel over the course of a season. \"Every one of you came here with something to prove,\" he says. \"I do not know if you proved it. But I know you showed it.\" He lets that sit. The room does too.",
      "Before any name, the host speaks to the whole line. He talks about risk — about the queens who played it safe early and then stopped, about the ones who came in swinging and had to learn when to pull back. He does not point at any of them. He does not need to. The finalists know who he means, and the knowledge is in the way each of them receives the sentence. The host watches them receive it. Then he is ready.",
      "\"You are standing on this stage because you earned it,\" the host says. \"Not because you were the loudest or the prettiest or the most dramatic — although some of you were all of those things.\" A laugh crosses the line and dies quickly because the room can feel what is coming. The host lets the laugh go and does not replace it with another. The seriousness is the signal.",
      "The host looks at the finalists the way he has looked at nothing else this season: slowly, individually, with a weight that makes each of them straighten. \"I have watched you become the queens you are right now,\" he says. \"The queen you were in week one is not the queen I am looking at.\" A pause. \"I need you to know that before I say anything else.\" The finalists hold still. The address is over. The placements are next.",
    ])],
  },

  // ══ THE PLACEMENTS, CALLED FROM THE BOTTOM ═══════════════════════════
  {
    id: 'crown-place', step: 'crowning', scope: 'per-placement', speaker: 'host',
    note: '{a} is the queen being placed. {b} is her placement as a word — '
      + '"fourth", "third" — already rendered, so never write the number.',
    writerNote: 'THE BEAT THAT MAKES THE CEREMONY A CEREMONY, and the one '
      + 'that fires most, so it needs the most variants — ten, and they have '
      + 'to be properly different. Each time, one queen is named in the '
      + 'lowest place still open and steps back out of the line, and the '
      + 'line gets shorter and the light gets tighter. Write the different '
      + 'ways a person takes that: the one who knew, the one who did not, '
      + 'the one who is genuinely fine, the one who is performing being fine, '
      + 'the one whose face goes before she can stop it, the one who hugs '
      + 'the queens still standing on her way back. Use {b} — being told you '
      + 'came fourth is a different sentence from being told you came '
      + 'second, and a few of these should turn on that.',
    tiers: [tier('place', 'Named in the lowest place still open.', [
      "{a} hears her name and her placement — {b} — and her face does two things at once. The mouth smiles. The eyes do not. She steps back from her plate and the light behind it goes dark and the line is shorter now. She hugs the queens still standing on her way past them, one at a time, and each hug lasts exactly long enough to say something in an ear. Then she is in the wings and the stage belongs to the queens who are left.",
      "The host says {a}'s name and says {b}, and the room watches her receive it. She nods. One nod, slow, the kind that contains a season's worth of assessment compressed into a single movement. She knew. She may have known since the lip sync, or since the showcase, or since a week she has not stopped thinking about. She steps off her mark, turns to the audience, and gives them a wave that is more graceful than anything she managed on the runway.",
      "{b}. The word lands on {a} and she catches it cleanly. No flinch, no crack, no visible arithmetic. She turns to the queen beside her and takes both her hands and holds them for a beat that is too long to be planned and too short to be a performance. Then she steps back. Her plate goes dark. She walks to the wings without looking at the audience, and the not-looking is a choice she is making in real time.",
      "{a} is placed {b} and the sound she makes is a laugh — quiet, brief, directed at herself. \"Okay,\" she says, and the microphone catches it, and the okay is not permission and not acceptance and not resignation. It is the word you say when you have spent weeks imagining every version of this moment and the actual version is none of them. She steps off her plate. The light goes dark. She keeps the laugh on her face until she is out of sight.",
      "The host holds the pause before {a}'s name and when it comes the placement comes with it — {b} — delivered flat, without softening, because softening it would be a kindness that makes it worse. {a} takes a breath. She mouths something to the host that the cameras do not catch. He mouths something back. Then she steps off her mark, and the stage loses a light, and the line of queens still standing is thinner than it was a sentence ago.",
      "{a} placed {b} and the first thing she does is look at the queens still on their marks. Not the audience, not the host, not the audience again — the queens who are still in it. She studies them for a second longer than is comfortable and then she smiles, and the smile is complicated, and she steps back from her plate and lets the dark take it. Walking off the stage she straightens the gown she will never wear in this competition again.",
      "When the host says {b}, {a} closes her eyes. One second. Two. When she opens them she is already composed, already smiling, already turning to applaud the queens who are left, and the speed of the recovery is its own kind of performance. She hugs the queen nearest her — a real hug, the kind where the bodies make contact — and whispers something that makes the other queen's composure wobble. Then she is gone and her light is off.",
      "{a} is named {b} and does not react visibly, which is its own reaction. She stands on her mark for three seconds longer than she needs to, as though the mark is hers for as long as she is willing to stand on it, and then she steps back. The plate goes dark. She does not hug anybody on the way off. She raises one hand to the audience, palm open, and takes the walk alone. The queens still standing watch her go.",
      "The placement lands — {b} — and {a}'s chin goes up. It is the gesture of a person who has decided how this will look, and it will look like somebody who came to compete and competed and finished where she finished and is not going to perform being wounded for anybody. She steps off the stage cleanly. The audience gives her something loud and sustained and she takes it without stopping. Her plate goes dark behind her.",
      "{a} takes {b} the way she has taken everything this competition has given her, which is squarely. She looks at the host. She looks at the queens still lit. She looks at the audience. Then she walks to the queen she was closest to all season and hugs her hard enough to move both their wigs and says, loud enough for the room to hear, \"win it.\" The plate behind her goes dark and the hug breaks and the line has one fewer person in it.",
    ])],
  },

  // ══ THE LAST TWO ═════════════════════════════════════════════════════
  {
    id: 'crown-final-two', step: 'crowning', scope: 'once', speaker: 'narrator',
    note: 'Two are left standing. {a} and {b} are the two, in no order — do '
      + 'not imply which one wins.',
    writerNote: 'THE LONGEST PAUSE IN THE SEASON. The stage is nearly empty, '
      + 'the light is on two people, and neither of them knows. Write the '
      + 'hold: what they do with their hands, whether they look at each '
      + 'other, what the room sounds like, how long it goes on. Nothing '
      + 'happens in this beat, on purpose. NOTHING HERE MAY HINT AT THE '
      + 'RESULT — this line is drawn before the name and a reader who can '
      + 'guess from it has been robbed of the next one.',
    tiers: [tier('hold', 'Two left, and the room stops.', [
      "The stage is nearly empty. The plates that were lit a minute ago are dark now and only two remain — {a} and {b}, standing in the light, separated by the space where the other queens stood until a few minutes ago. Neither of them moves. Neither of them looks at the other. The host has the result and is holding it, and the holding is visible in every second that passes without a name. The room is silent. Not quiet — silent. The kind of silence you can hear the air conditioning through.",
      "{a} and {b} stand on their marks and the room around them has gone still. The cast in the audience is holding its breath. A queen in the front row has both hands pressed over her mouth. The host stands between the two lit plates and does nothing — he is letting the moment exist, because a moment like this one does not arrive on its own and does not leave on its own and the space between the two of those is the entire point of a ceremony.",
      "Two plates lit. The rest dark. {a} and {b} are standing close enough to touch and neither of them reaches. One of them is looking at the host. The other is looking at the floor. The audience does not know which one to watch and some of them have stopped trying to choose. The pause extends past where it should end and then past where it should end again. Something is about to happen and nothing has happened yet and the nothing is louder than the something will be.",
      "The stage holds. {a} and {b} are the last ones standing and they know it and the room knows it and nobody is willing to move the moment forward by a single second. {b} shifts her weight from one foot to the other. {a}'s hands are clasped in front of her so tightly the knuckles are showing. The host has the envelope and has not looked at it yet, or has looked at it and is performing the not-looking, and from the front rows it is impossible to tell which.",
      "{a} is on her plate and {b} is on hers and the gap between them feels wider than it did when the line was full. The audience is in the particular silence that means everybody wants to say something and nobody will. One of the finalists glances at the other. The other does not glance back. The host watches both of them. He has done this before. He knows the value of this pause. He lets it run.",
      "Two people left under two lights on an empty stage, and neither of them breathing normally. {a} and {b} have stood together in this competition for weeks — in challenges, in the werk room, in the moments between moments — and this is the first time they have stood together with nothing between them and the result. The host has not spoken. The room has not moved. The season is balanced on a name that has not been said yet.",
    ])],
  },

  // ══ THE MOMENT BEFORE THE NAME ═══════════════════════════════════════
  {
    id: 'crown-envelope', step: 'crowning', scope: 'once', speaker: 'host',
    note: 'The beat immediately before the name. {a} and {b} are the final '
      + 'two, in no order. Tiered by the SEASON SHAPE, which the host never '
      + 'says out loud — it colours the writing, it is not dialogue.',
    writerNote: 'Three tiers, and the tier is about how the season looked '
      + 'coming in, not about anything anybody announces. Landslide: one of '
      + 'them has dominated and the room half-knows. Close: nobody in the '
      + 'building could call it. Upset: the one about to win is not the one '
      + 'the season pointed at, so write the room being wrong without saying '
      + 'so. Still no name in any of them.',
    tiers: [
      tier('landslide', 'The season pointed one way and the room can feel it.', [
        "The host looks at {a} and looks at {b} and the room has already done the maths of the season and the maths points in a direction. He picks up the card. The audience shifts — the collective lean of a room that believes it knows what is about to happen and is waiting to be right. The host reads the card. His face gives nothing. He looks up. The next word is a name.",
        "One of them had the season. The room can feel it. The host has the card and the card has the name and the audience is not breathing and most of them are leaning the same direction, because one of these queens won more, survived more, and delivered more, and the numbers are printed on the plates they are standing behind. The host takes his time. He always takes his time. Tonight the time belongs to the room.",
        "{a} and {b} stand in the light and the room is not neutral. The season told a story and the story had a shape and the shape pointed at somebody, and that somebody is standing on one of those plates. The host opens the card. He reads it. He does not look at either queen yet. The cast in the audience sits in the particular silence of people who think they know what is coming and are waiting to find out if they are right.",
        "The host opens the envelope slowly, because he has earned the speed. The room half-knows. The season has been running in one direction for weeks and the finalists' records are printed below their names for anybody who needs reminding. {a} and {b} are still. The card is open. The host looks at it, looks at the two of them, and takes one more breath before the name.",
        "The card is in his hand and the room has an expectation, because a season of evidence built one, and the evidence is written on the plates behind the finalists. The host reads the name on the card. He gives nothing away and does not need to — the room is already leaning. {a} is still. {b} is still. The air between them is the last second before the season has a winner.",
        "The host has the name and the audience has a guess and the guess has been forming for weeks. One of these queens dominated and the room watched her do it, and the room is sitting in the confidence of its own arithmetic. The host looks at the card. Looks at the line. He lifts his head and the next sound in this room will be a name.",
      ]),
      tier('close', 'Nobody in the building could call this.', [
        "The host opens the card and nobody in the room could call this. Not the cast, not the panel, not the queens standing on the plates. The season was that close and the records under their names prove it — win for win, high for high, a race that ran together the whole way. The host reads the name. His face does not change. The room is holding its breath and it has been holding it for too long.",
        "The host takes the card out and holds it and the room is split. There is no clear direction in the audience. The returning cast is divided and trying not to show it and showing it anyway, because a close season produces a divided room and a divided room cannot lean. {a} and {b} are on their marks. The host has the only piece of information that matters. He is not sharing it yet.",
        "The card is open and the host looks at it and there is a flicker — something in his face that might be surprise or might be satisfaction, and from the front rows it is impossible to tell. The season was close. The record was close. The lip sync was close. Everything this competition measured came back with the same answer: too close to see from here. The host lifts his head.",
        "{a} and {b} are standing under their lights and neither of them looks like she knows. The host opens the envelope. The room cannot guess — has been unable to guess all season — and the uncertainty in the audience is visible as motion: people shifting, glancing at each other, trying to read the host's face. His face gives nothing. He has done this before and he is very good at giving nothing.",
        "The host opens the card and takes a breath that fills the silence. This is a season the panel argued about. The judges argued, the audience argued, the queens in the back row have been arguing since they sat down. The records are even. The showcases were even. The host holds the card and looks at two queens who have run the same race and the next word out of his mouth will put one of them ahead for the first and only time.",
        "Nobody in the building could call this. The host opens the envelope and the room is still, not because it is waiting to be right but because it genuinely does not know, and the not-knowing is more electric than any certainty. {a} and {b} are motionless. The host reads the card. His expression does not change. The name is coming and the room is not ready for it because the room has not decided which name it wants to hear.",
      ]),
      tier('upset', 'The room is about to be wrong.', [
        "The room thinks it knows. You can see the lean in the audience — the cast angled slightly toward one plate, the expectation visible in posture before it is visible in sound. The host opens the card. He reads it. And something changes in his face — not surprise, because he does not do surprise, but a recalibration of how the next sentence is going to land. He looks at the two queens. He does not look at the audience. The name is coming and it is not the name the room expected.",
        "The host opens the envelope and the audience has picked a direction and they are wrong, and the host knows they are wrong, and the three seconds between his reading the card and lifting his head are the three seconds where the season's story is about to revise itself. {a} and {b} are still on their marks. One of them is about to hear something she did not believe she would hear. The host looks up.",
        "The card is open. The host reads it and holds his face still, which takes effort, because the name on the card is not the name the season pointed at and he can feel the room's expectation and the expectation is about to be undone. {a} and {b} are motionless under their lights. The returning cast is leaning one way. The host is about to lean the other. The next word will be the most surprising sound this room has made all season.",
        "There is a direction the season seemed to go and a direction the season actually went, and the two of them diverge on this card. The host reads it. He keeps his composure, which is notable because a man who has done this many times still has to work at keeping it on a night when the card says something the room did not predict. He looks at {a}. He looks at {b}. He looks at the card one more time, as though confirming what he read. He lifts his head.",
        "The host takes the card out and reads the name and his eyebrows do something he cannot quite control. The room has a favourite. The card does not agree. {a} and {b} are on their plates, each one running her own version of the season's maths, and one of them is running it correctly without knowing she is. The host has the answer and the answer is about to redraw the shape of this entire season in a single word.",
        "The room is about to be wrong and the host can feel it. He opens the card and his face stays neutral but his breathing changes — one visible adjustment of how this is going to be delivered, because the delivery matters more when the answer is not the expected one. {a} and {b} stand in the light. The audience sits in a certainty that is about to be corrected. The host lifts the card and takes one last look at the two queens before the name comes out.",
      ]),
    ],
  },

  // ══ THE NAME ═════════════════════════════════════════════════════════
  {
    id: 'crown-name', step: 'crowning', scope: 'once', speaker: 'host',
    note: '{a} is the winner. This is the sentence the season is for.',
    writerNote: 'The catchphrase is quoted EXACTLY and is never paraphrased: '
      + '"Con-drag-ulations, you are the winner of this season of Drag '
      + 'Race." Everything around it varies — how he leads in, where he '
      + 'breaks, what he does with the pause before the name, what happens '
      + 'in the room the instant it lands. Several of these should spend '
      + 'most of their length on the half-second BEFORE the name and very '
      + 'little after it.',
    tiers: [tier('name', 'The name, and the catchphrase, exactly.', [
      "The host looks at the line and says, \"The winner...\" and lets the word hang there, suspended, while the room leans forward and the two queens on their marks stop breathing at the same time. \"...of this season of Drag Race...\" Another pause, longer than the first, long enough that somebody in the audience makes a sound. \"...{a}. Con-drag-ulations, you are the winner of this season of Drag Race.\" The room goes up and the queen on the plate goes to her knees.",
      "He starts with the name. No lead-in, no preamble, no delay — just \"{a}\" and then the rest of it, delivered flat: \"Con-drag-ulations, you are the winner of this season of Drag Race.\" The speed of it catches the room off guard. There is a half-second of silence and then the noise arrives all at once, and {a} is standing on her plate with her hands over her mouth and the other queen is already reaching for her.",
      "\"The winner of this season...\" The host pauses. Looks at one plate. Looks at the other. The room is making no sound at all. \"...is...\" Another pause, stretched to the point where it becomes its own kind of cruelty. \"{a}.\" The name lands and the room cracks open. \"Con-drag-ulations, {a}. You are the winner of this season of Drag Race.\" Confetti falls. The queen on the plate cannot move. The cast is on its feet.",
      "The host takes one step forward and looks at {a} and says her name before anything else. \"{a}.\" A beat. \"Con-drag-ulations. You are the winner of this season of Drag Race.\" The sentence arrives in pieces and each piece lands separately — the name, the congratulations, the title — and by the time the last word is out the room has already erupted and {a} is shaking and the host is smiling for the first time in the ceremony.",
      "\"Con-drag-ulations...\" The word comes out alone and the room freezes on it because the name has not come yet. The host holds it. He holds it longer than is kind. \"{a}. You are the winner of this season of Drag Race.\" The name breaks the hold and the noise that follows is the kind that comes from a room that has been silent too long. {a}'s plate is the only one still lit and the light is hers.",
      "The host opens his mouth and everything in the room stops. \"The winner of this season of Drag Race —\" He looks at {a}. \"— is {a}. Con-drag-ulations.\" The catchphrase arrives at the end rather than the beginning and the effect is that the room erupts on the name and the congratulations come after, spoken into noise, and {a} hears them anyway. She hears them because she has been listening for them for the entire season.",
    ])],
  },

  // ══ THE OTHER ONE ════════════════════════════════════════════════════
  {
    id: 'crown-runnerup', step: 'crowning', scope: 'once', speaker: 'narrator',
    note: '{a} is the runner-up, in the same second the other queen wins. '
      + 'Never name the winner here — the beat is {a} and only {a}.',
    writerNote: 'The hardest beat in the file and the one most often written '
      + 'badly. She is not a saint and she is not a sore loser; she is a '
      + 'person who has just been told, in front of everybody she has lived '
      + 'with for ten episodes, that she came second by a margin nobody will '
      + 'ever show her. Write the SECOND, not the sentiment: what her face '
      + 'does first and what she makes it do next, whether the hug is real, '
      + 'how long she takes. Range across the variants — one of these should '
      + 'be genuinely delighted for the winner and one should very obviously '
      + 'not be, and neither should be judged by the prose.',
    tiers: [tier('runnerup', 'Second, in front of everybody.', [
      "{a} hears the other name. Her face breaks for one second and she puts it back together. She turns to the winner and the hug is immediate and full. When she steps back her face is composed and the room can see what that composure is costing her.",
      "The name that is not {a}'s comes out of the host's mouth and {a} is already applauding before the sentence is finished. She crosses the stage to the winner and the embrace is genuine — you can see the genuineness in the way her shoulders drop — and she says something in the winner's ear that nobody else hears. Then she steps back and her face is perfectly fine and she looks at the audience and her face is still perfectly fine and the audience loves her for the performance of being fine even if they do not entirely believe it.",
      "{a} came second by a margin she will never see and the news arrives in the form of someone else's name. She does not react. One second. Two seconds. Then she smiles, and the smile is the complicated kind — the kind that is real and performed at the same time and contains a season's worth of work being weighed against a result she cannot change. She walks to the winner. The hug lasts. When it breaks she stands next to the winner and looks at the room and her jaw is set.",
      "The runner-up is {a} and she takes it standing, which is a choice, and she takes it dry-eyed, which is another choice, and she takes it by turning to the winner with both arms open before the confetti has reached the stage. The hug is the realest thing she has done all season. She whispers something. She laughs. She steps back and raises the winner's hand and the room cheers and {a} is cheering too and whether the cheering is for the winner or for herself is a question that has no wrong answer.",
      "{a} loses the crown and the thing her face does is nothing. Not composure — absence. The news arrives and lands somewhere she is not allowing anybody to see and for three full seconds she is a person holding very still in a room full of noise. Then the hug. The hug is hard and fast and she buries her face in the winner's shoulder and whatever she does there — crying, breathing, both — she does it out of the camera's line and when she comes back up her face is dry and she is smiling the smile that will carry her through the next hour.",
      "The name comes out and it is not hers and {a}'s first reaction is to laugh. Not a performance laugh — a real one, the kind that escapes before you can decide what your face is doing. She laughs and then she walks to the winner and the hug is immediate and she says, loud enough for the front row to hear, \"you better wear that crown every day.\" The room laughs with her. She raises both hands to the audience. The applause she gets is its own kind of crown and she takes it the way she takes everything, which is completely.",
    ])],
  },

  // ══ THE CROWN ITSELF ═════════════════════════════════════════════════
  {
    id: 'crown-regalia', step: 'crowning', scope: 'once', speaker: 'narrator',
    note: '{a} is the winner. The physical crown and sceptre going on.',
    writerNote: 'PHYSICAL, not symbolic. It has weight, it has pins, it sits '
      + 'wrong until somebody fixes it, the sceptre is heavier than it '
      + 'looks and she does not know which hand to hold it in. The crown is '
      + 'an object before it is a meaning, and writing the object is what '
      + 'makes the meaning land. Somebody on the crew steps in to seat it '
      + 'properly in at least one of these.',
    tiers: [tier('regalia', 'An object, with weight, going onto a person.', [
      "The crown comes out on a velvet cushion and {a} watches it approach and the watching is the first moment where the result becomes a physical thing rather than a word. The host places it on her head and it sits wrong — it always sits wrong the first time, because a crown is designed for a head that is not moving and her head is shaking — and somebody from the crew steps in and adjusts it with two pins and a gentleness that has nothing to do with television. The sceptre goes into her right hand. She switches it to her left. She switches it back.",
      "The host lifts the crown off the cushion and it catches the stage light and sends it somewhere it was not designed to go. He places it on {a}'s head and she reaches up to hold it on with one hand because the fit is not perfect and she is not about to let it fall on the biggest night of her career. The sceptre is heavier than it looks — you can see the surprise in her wrist — and she grips it and stands there holding two things she has wanted since she was cast and neither of them is comfortable.",
      "{a} bends slightly so the host can place the crown and the bending is the first unglamorous thing she has done all night. The crown goes on. It tilts. A crew member appears from the side of the stage with pins and fixes it while {a} stands perfectly still, holding her breath, not because the moment is emotional but because the pins are near her scalp. The sceptre arrives in her other hand. She holds it the way you hold something you have never held before and are terrified of dropping.",
      "The crown goes on and {a} goes still. Not the stillness of composure — the stillness of a person adjusting to a weight she has never carried. It is heavier than she expected. The host seats it properly and steps back and {a} reaches up and touches it with one finger, as though confirming it is there. The sceptre is placed in her hand by a crew member whose face says she has done this before and finds the moment unremarkable, and the unremarkableness is oddly grounding.",
      "The crown is placed on {a}'s head and it is a physical object with a weight and a tilt and a tendency to catch in her wig, and the host spends four seconds adjusting it while she holds still and the room watches a king dress a queen. The sceptre follows. She takes it in her right hand, shifts her grip twice, and decides this is how she holds a sceptre. Her hands are shaking. The sceptre is shaking. The crown is not, because it is pinned, and the difference between the things that are shaking and the thing that is not is the whole picture.",
      "{a} stands on her mark and the crown comes toward her on a cushion carried by a stage hand, and the cushion is more ornate than the crown, which is a detail only somebody who has held both would notice. The host takes the crown. He places it on her head. She flinches — not from emotion, from the weight — and then she straightens, and the straightening is the moment the room reacts to. The sceptre arrives in her hand. She grips it too tightly. Later, in a photograph, the white knuckles will be the detail everybody talks about.",
    ])],
  },

  // ══ THE SPEECH ═══════════════════════════════════════════════════════
  {
    id: 'crown-speech', step: 'crowning', scope: 'once', speaker: 'narrator',
    note: '{a} is the winner, speaking.',
    writerNote: 'Three tiers by what kind of speech it is. Prepared: she has '
      + 'had the words for weeks and gets through them. Unprepared: she has '
      + 'nothing and says something better than anything she could have '
      + 'written. Overcome: she does not really get one out, and the room '
      + 'finishes it for her. Quote her directly in most of these — this is '
      + 'the only beat in the file where the winner speaks at length, and a '
      + 'summary of a speech is not a speech.',
    tiers: [
      tier('prepared', 'She has had the words for weeks.', [
        "{a} takes the microphone and says what she came to say. \"I wrote this down,\" she says, and pulls a folded piece of paper from inside the gown. She reads it, and the reading is steady, and the steadiness is the thing the preparation bought her. She thanks the cast. She thanks the panel. She thanks a person whose name means nothing to the room and everything to her. The paper goes back in the gown. \"That is all of it,\" she says. \"I have been saying it in the shower for weeks.\"",
        "The speech is prepared and it shows and the showing is not a flaw. {a} takes the microphone and delivers sentences she has been rehearsing since she was cast. \"I came here knowing I would say these words if I won,\" she says. \"I did not know they would be this hard to say out loud.\" She gets through it. She thanks her drag mother. She thanks the queens who went home. She thanks the runner-up by looking at her rather than naming her, and the look says more than the name would have.",
        "{a} has a speech and she gives it. It is short. It is specific. She talks about the first gig she ever booked — the bar, the fifteen people in it, the queen who told her afterwards that she should keep doing this. \"I kept doing it,\" she says. \"I am still doing it. The crown is very heavy and I am not putting it down.\" The cast laughs. She was hoping they would laugh. The laugh lets her get through the rest without her voice breaking.",
        "\"I have had this speech ready for weeks and I am going to get through it,\" {a} says, and the room laughs, and the laughter gives her the runway she needs. She talks about what this competition took from her and what it gave back. She talks about the version of herself she arrived as and the version she is leaving as. She reads the last line off her hand, where she wrote it in marker before the show, and the marker has smeared but the words are legible. She says them. The room answers.",
        "{a} reaches into her gown and produces a crumpled piece of paper that has clearly been folded and unfolded many times. \"I wrote this the night before I flew out,\" she says. She reads it. The handwriting is difficult and she squints at her own words more than once. The speech is about the person who taught her to sew. She gets through it without stopping. She folds the paper and puts it back and the room gives her a sound that is worth every week she spent in this competition.",
        "The winner's speech is a list. {a} takes the microphone and names every person she wants to thank, in order, with one sentence about each. She has been carrying this list in her head since the first challenge and the rehearsal shows — the sentences are clean, the pauses are measured, and she does not lose her place once. The last name on the list is her own, and she says it the way you say your own name when you have finally become the version of yourself you intended to be.",
      ]),
      tier('unprepared', 'She has nothing, and it is better.', [
        "{a} takes the microphone and has nothing. \"I did not prepare anything,\" she says, \"because I did not want to jinx it.\" Then she talks, and what comes out is better than anything she could have written, because it is happening to her in real time and the room can hear the thinking. She talks about the first time she put on a wig. She talks about standing in this competition and being scared every single week. \"I was never not scared,\" she says. \"I just got better at doing things scared.\"",
        "\"I don't have a speech,\" {a} says, and then she gives one anyway. It is about the queens in this room — not the finalists, the ones in the audience, the ones who went home. She talks about the things they taught her in the werk room that the panel never saw. She talks about a conversation she had at three in the morning that changed how she thought about her drag. She does not name the queen she had it with. She looks at her. The queen in the audience knows.",
        "{a} takes the microphone and opens her mouth and closes it and opens it again. \"Right,\" she says. \"Okay.\" She has nothing prepared and the nothing turns out to be a story about her grandmother, who she has not mentioned all season, and who is the reason she does drag, and who does not know she is here tonight. \"I am going to call her,\" she says. \"I am going to call her with this crown on my head.\" The room gives her the noise and she lets it carry the rest.",
        "The winner has no speech and the absence of one is more eloquent than any speech could have been. {a} takes the microphone and stands in it — the silence, the crowd, the weight of the crown — and says, \"I don't know what to say. I genuinely don't know what to say.\" She looks at the sceptre in her hand. She looks at the room. \"I just want everyone to know that I tried as hard as I could.\" It is not a grand statement. It is better than a grand statement.",
        "{a} is handed the microphone and laughs at herself for not having anything to say on the one night she should have had something to say. \"I was so busy trying to win that I forgot to write a speech,\" she says. The cast laughs. She laughs. Then she gets quiet and says, \"The truth is I did not think it would be me. I hoped, but I did not think.\" She holds the sceptre tighter. \"And it is me. And I do not know what to do with that yet.\"",
        "\"I should have written something down,\" {a} says, and then she talks for two minutes without stopping, and what she says is a season in miniature: the challenge that broke her, the week she came back from the bottom, the queen she fought with and made up with and is looking at right now. \"You made me better,\" she says, to the room rather than to a person. \"I came in here good. I am leaving here better.\" She hands the microphone back and does not realise she is crying until somebody tells her.",
      ]),
      tier('overcome', 'She does not get one out, and nobody minds.', [
        "{a} takes the microphone and gets one word out. One. Then her face goes and the word is swallowed by the sound she makes instead, which is not quite crying and not quite laughing and is entirely honest. She tries again. She gets two words this time. The host puts a hand on her shoulder. The cast starts chanting her name and the chanting does the job the speech was supposed to do.",
        "The microphone goes to {a} and she holds it and nothing comes out. She stands in the light with the crown on her head and the sceptre in her hand and she is shaking too hard to form a sentence and the room loves her for it. The cast takes over — they start clapping, rhythmic, insistent, her name on every beat — and {a} mouths \"thank you\" into the microphone and that is the speech. It is enough.",
        "{a} opens her mouth and what comes out is a sound she was not planning to make. She covers her face with the hand that is not holding the sceptre. The host steps in and says, \"take your time,\" and she nods and tries and fails and tries again and gets out, \"I just — I can't —\" and the sentence goes nowhere and the audience fills the space with the loudest cheer of the night. The speech she did not give is the one the room will remember.",
        "The winner's speech does not happen. {a} takes the microphone and holds it and looks at the room and the looking is the speech — her face doing every sentence she cannot say, the tears arriving before the words and staying after the words give up. A queen in the front row stands and starts applauding and the rest of the cast follows and {a} stands there in the crown and in the noise and mouths \"I love you\" to a specific person in the audience and hands the microphone back.",
        "{a} tries. She takes the microphone and starts a sentence and the sentence breaks on the third word and she laughs at herself and tries again and it breaks again. \"I'm sorry,\" she says, and the host says, \"do not apologise for this,\" and the audience agrees with him at volume. She stands there holding the sceptre and the microphone and the crown and she cannot hold all of them and speak at the same time. She chooses the crown. The room speaks for her.",
        "The microphone is in {a}'s hand and the speech is not in her mouth. She is crying. She has been crying since the name and the crying has not stopped and she has given up fighting it. She manages \"thank you\" and \"I love this\" and both of them are broken in half by the kind of crying that starts in the chest and arrives at the eyes already finished. The host takes the microphone gently. The cast is standing. Nobody needs the speech. The face was the speech.",
      ]),
    ],
  },

  // ══ THE ROOM ═════════════════════════════════════════════════════════
  {
    id: 'crown-cast', step: 'crowning', scope: 'once', speaker: 'narrator',
    note: 'The returned cast, watching. No {a}: this beat is the room.',
    writerNote: 'THE SEASON IS IN ONE ROOM FOR THE LAST TIME and this is the '
      + 'only beat that looks at it. The queens who went home early, the '
      + 'ones who nearly made it, the rivalries that have gone soft and the '
      + 'one that has not. Write what the room does rather than what it '
      + 'feels: who is on their feet first, who is crying and pretending '
      + 'not to, who is watching the runner-up instead of the winner.',
    tiers: [tier('cast', 'The whole season, in one room, for the last time.', [
      "The cast is on its feet. All of them. The queen who went home first and the queen who went home last and every queen between them, standing in the audience of a season they lived through, watching the end of it. One of them is crying openly and not wiping her face. Another is filming on a phone she is not supposed to have. A queen near the back is watching the runner-up instead of the winner, and the watching has a tenderness to it that says more about their season together than any confessional ever did.",
      "The room after the name is a season in miniature. The early boots are screaming. The mid-season cuts are on their feet. The queen who placed just outside the finale is sitting very still in her chair, holding her clutch bag with both hands, and the stillness is its own kind of statement. Two queens who spent most of the season on opposite sides of the werk room are holding hands, and neither of them seems to have noticed.",
      "Somebody in the front row is ugly-crying and making no attempt to hide it. The queen beside her is trying to hand her a tissue and being waved away because the crying is intentional. A rivalry that ran hot for most of the season has gone quiet — the two queens it belonged to are sitting next to each other and one of them has put her head on the other's shoulder, and the gesture is so small and so specific that it could only exist between people who have been through something together.",
      "The returned cast watches the crowning from their seats and every one of them is processing a different season. The queen who went home on a design challenge is thinking about what she would have made. The queen who was sent home on the same night as her closest friend is sitting next to that friend and their reactions are in sync — the same lean, the same clap, the same breath. A queen in the back row who has barely spoken all night stands up first and the standing is so decisive it pulls the rest of the room to its feet.",
      "The audience is a room full of people who competed for the same thing and the thing has gone to somebody else and the room is generous about it, genuinely, and the generosity is visible in the speed of the standing ovation and in the noise and in the specific way certain queens look at the winner. One queen in the front row mouths a word at the stage that is either a name or a prayer and from the back of the room it is impossible to tell which.",
      "The cast in the audience is a season laid out in chairs. The first boot sits next to the biggest threat and neither of them is competing any more and you can see the relief in both of them. A queen who spent most of her run in the bottom is on her feet first, screaming, hands above her head. The queen who placed just short of the finale is watching with an expression that contains everything she will not say tonight and may never say. The room is standing. The season, for one last moment, is whole.",
    ])],
  },

  // ══ THE LAST LINE ════════════════════════════════════════════════════
  {
    id: 'crown-prance', step: 'crowning', scope: 'once', speaker: 'host',
    note: 'The last thing said this season. No {a}.',
    writerNote: 'The host closes it with his own words, quoted exactly: '
      + '"Now let the music play" and "Now prance, my queens." Vary the '
      + 'lead-in and what the room does as the music starts, never the '
      + 'phrases. This is the last paragraph of the season, so it should '
      + 'end on the room rather than on the host — the season closes on the '
      + 'queens, which is who it was about.',
    tiers: [tier('prance', 'The music, and the season ends.', [
      "\"If you can't love yourself,\" the host says, \"how in the hell are you gonna love somebody else?\" The room gives him the response one last time and he lets it land and then he lifts his arms. \"Now let the music play!\" The cast floods the stage — all of them, winner and runner-up and every queen this season sent home — and the host steps back and watches them take the stage that used to be his. \"Now prance, my queens! Prance!\" The season ends the way every season ends: dancing, together, in the best drag they own.",
      "The host takes the centre of the stage for the last time this season. \"Now let the music play!\" The track drops and the cast comes forward and the winner is somewhere in the middle of them with the crown on and the sceptre up and the queens on either side of her are holding her hands and pulling her into a dance she did not choreograph. \"Prance, my queens!\" the host calls, and they prance, and the prancing is the last thing this season does, and it is the right last thing.",
      "\"If you can't love yourself, how in the hell are you gonna love somebody else?\" The room answers and the answer is the loudest sound the season has made. The host smiles — really smiles, the smile of a man who built a thing and is watching it work — and raises his voice one final time. \"Now let the music play!\" The queens take the stage. Every one of them. \"Prance, my queens. PRANCE!\" The music carries them out and the season closes on a stage full of queens who are done competing and are not done dancing.",
      "The host says the words he always says and they mean what they always mean and tonight they mean it more. \"If you can't love yourself, how in the hell are you gonna love somebody else?\" The amen comes back. He takes a breath. \"Now let the music play!\" The cast comes together — finalists and audience, the whole season in one group — and the host watches from the side and says it one more time: \"Now prance, my queens.\" The queens prance. The lights come up on the whole room. The season is over.",
      "\"Now let the music play!\" The music starts and the host steps back and the stage fills with queens and the filling is the closing and the closing is what this show does best. The winner is dancing with the runner-up. The first boot is dancing with the last boot. Two queens who spent the season fighting are dancing near each other, carefully, and the carefulness is its own kind of reconciliation. \"Prance, my queens!\" the host says. The queens do. The season ends on them.",
      "The last words of the season belong to the host and the host gives them gladly. \"If you can't love yourself,\" he begins, and the room finishes it before he can, because they know the words and the words are theirs now too. \"Now let the music play!\" The track is the best one they have played all year and the cast takes the stage and the queen with the crown is holding somebody's hand — it does not matter whose, because tonight every hand in this room belongs to the same season. \"Prance, my queens. Prance!\" They prance. They always prance. The season ends dancing.",
    ])],
  },
];

export const CROWNING_IDS = CROWNING_BEATS.map(b => b.id);

/** A tier with no lines written — the gap check, and the writer's to-do list. */
export function unwrittenCrowningTiers() {
  const out = [];
  for (const b of CROWNING_BEATS) {
    for (const t of b.tiers || []) if (!t.lines?.length) out.push(`${b.id}/${t.id}`);
  }
  return out;
}

/** How many variants each tier has, for the audit's coverage line. */
export function crowningTierCounts() {
  const out = {};
  for (const b of CROWNING_BEATS) {
    for (const t of b.tiers || []) out[`${b.id}/${t.id}`] = (t.lines || []).length;
  }
  return out;
}
