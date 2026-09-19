// ══════════════════════════════════════════════════════════════════════
// dr/data/legacy-weigh.js — the counter, before she decides
// ══════════════════════════════════════════════════════════════════════
//
// The lipstick ceremony was ONE line of deliberation and one of confession.
// So every night she weighed two names in a single sentence, the viewer never
// saw the weighing, and a season of ceremonies read the same — "boring and
// repetitive", with no sense of the struggle, or of the absence of one.
//
// This is the weighing. Three things it has to carry that a single line
// cannot:
//
//   WHETHER IT IS HARD    js/dr/legacy.js returns `close` — the gap between
//                         the name she wrote and the one she nearly wrote,
//                         scaled against the pool. A dead heat and a foregone
//                         conclusion are different nights of television.
//   WHAT EACH NAME IS     one beat per queen in that bottom, chosen from what
//                         is actually true about her tonight: the threat, the
//                         friendship, the plea she made in Untucked, the
//                         times she has already been carried.
//   WHAT IT COSTS         said after, to camera, once she has watched it land.
//
// {h} is the holder. {x} is the queen the beat is about, {y} the other one.
// Every pool here is drawn without replacement across the season, like the
// rest of the ceremony (js/dr/data/legacy-beats.js).

export const WEIGH_BEATS = {
  /* HOW SHE ARRIVES AT THAT COUNTER. */
  open: {
    close: [
      '{h} puts both tubes on the counter and looks at them for a long time. Neither of them is easier than the other, and that is the problem.',
      'Somewhere out there a room is waiting, and in here {h} has picked one up, put it down, and picked up the other one twice.',
      '"I genuinely do not know," {h} says out loud, to a mirror that has no opinion about it.',
      '{h} has been in this competition long enough to know exactly what this is going to cost her, and she still cannot pick.',
      'Two names, and one of them goes home because of something {h} decides in the next ninety seconds. She keeps starting the sentence and stopping.',
      '{h} tries to imagine walking back out with each of them, and watches herself flinch at both.',
      'The producer asks if she needs another minute. {h} says yes, which she has never done before.',
      '{h} is not deliberating so much as negotiating, and the person she is negotiating with is herself.',
    ],
    clear: [
      '{h} does not need the time she is given and takes it anyway, because walking straight back out would look like something.',
      'The decision was made somewhere around the critiques. This part is paperwork.',
      '{h} picks up the one she came in for. The other tube does not get touched.',
      'There is no deliberating happening at that counter. There is a woman confirming something she already knew.',
      '{h} is out of there fast enough that the crew asks her to wait, and she waits, and she looks entirely unbothered.',
      'She knew on the runway. She knew during the critiques. {h} is standing at that counter out of politeness.',
      '{h} reads both names once, the way you check a receipt you have already paid.',
      'Whatever this is supposed to be, it is not difficult for {h}, and she is not going to pretend otherwise for the camera.',
    ],
  },

  /* WHAT EACH OF THEM IS TO HER. One beat per queen, by what is salient. */
  queen: {
    threat: [
      '{h} looks at {x}’s name and sees a finale. That is the whole problem with {x} and it has been for weeks.',
      '"{x} is going to win something soon," {h} says quietly. "Everybody in that room can feel it."',
      '{x} is the one queen down there {h} does not want across from her in a final lip sync, and {x} probably knows it.',
      'The thing about {x} is that tonight was the worst she has been, and she was still not bad.',
      '{h} turns {x}’s tube over. A queen with that record does not usually get handed to you like this.',
      '"She is better than me at one of the things they judge," {h} says about {x}, "and I am not going to get a second chance to say so."',
    ],
    friend: [
      '{h} picks up {x}’s tube and her whole face changes. This is the one she cannot do.',
      'She and {x} have got each other through weeks of this. {h} holds that tube for a second and puts it down like it is hot.',
      '"Not her," {h} says, to nobody in particular. "Anybody but her."',
      '{h} thinks about {x} crying at her station on day three, and about who sat down next to her, and it was {h}.',
      'There is a version of this where {h} writes {x}’s name. She cannot find her way into it.',
      '{h} says {x}’s name out loud once, to hear how it sounds. It sounds terrible.',
    ],
    pleaded: [
      '{x} asked her. Out loud, in front of everybody, in that lounge, and {h} can still hear exactly how it sounded.',
      '{h} keeps hearing {x} say please. It is doing more work than {x} knows.',
      '"{x} came to me," {h} says. "She did not send somebody. She came herself."',
      '{h} weighs a promise she half-made an hour ago against a season she is trying to win.',
      '"I told {x} I would think about it." {h} looks at the tube. "This is me thinking about it."',
    ],
    spared: [
      '{x} has been handed a pass before. {h} has not forgotten it and neither has anybody else in that room.',
      '"How many lives does {x} get?" {h} asks the mirror. The mirror does not have a number either.',
      '{h} counts what {x} has already survived, and does not love the total.',
      'Somebody keeps carrying {x}. {h} is deciding whether it is going to be her.',
    ],
    'panel-last': [
      '{x} was last tonight and everybody heard the judges say so. {h} does not have to build a case for that one.',
      'On the board, {x} is the easy answer. {h} looks at the easy answer for a while.',
      '{h} does not have to think hard about {x}. The panel did it out loud, twenty minutes ago.',
      '"They told us," {h} says, looking at {x}’s name. "They could not have been clearer."',
    ],
    cold: [
      'There is no love lost with {x}, and {h} does not pretend otherwise, not even to a mirror.',
      '{h} and {x} have not had a real conversation in two weeks and both of them know why.',
      '{x}’s tube is the one {h} keeps coming back to, and it is not entirely about the challenge.',
      '{h} allows herself about three seconds of enjoying this, with {x}’s tube in her hand.',
    ],
    plain: [
      '{x} is just there. No history, no threat, no particular reason — which is its own kind of dangerous when somebody is holding one of these.',
      '{h} does not have much to say about {x}, and that is exactly {x}’s problem.',
      'Nothing about {x} makes this harder, and {h} notices that, and does not love what it says about {x}’s season.',
    ],
  },

  /* ── AND THE NIGHT BOTH OF THEM WON IT (AS4) ──────────────────────
     Two queens, two tubes, and neither of them knows what the other wrote
     until they are turned around together. {h} is the first holder, {g} the
     second, {x} the name that went home and {y} the other one. */
  double: {
    /* The host tells them, and the bottom works out what it means. */
    both: [
      '"I could not separate you," the host says. "So I am not going to. You BOTH won that lip sync — and you both have the power."',
      '"Two winners." The host lets it sit. "Two lipsticks. Ladies, the rest of you might want to hold onto something."',
      '"{h}. {g}. Neither of you lost that." The host smiles. "Which means neither of you is walking away empty-handed, and somebody down there is going to feel it."',
      '"In the herstory of this competition that has happened exactly once," the host says. "Congratulations. You are about to make it twice."',
      'Nobody in the bottom moves. Two lipsticks and this many of them standing there is arithmetic anybody can do.',
    ],
    /* They wrote the same name. One queen goes home, and the room has just
       watched two women arrive at her independently. */
    agreed: [
      'Both tubes come around at the same time, and they say the same thing. {x} closes her eyes before the host can.',
      'Two lipsticks, one name. {h} and {g} look at each other and neither of them looks surprised.',
      '"Well," the host says, looking at the two of them. "You did not need to discuss it, did you."',
      'The room makes a noise, because the room has just watched two queens who never compared notes reach the exact same conclusion about {x}.',
      '"{x}." "{x}." It lands twice and it only needed to land once.',
      '{y} works out what has happened about a second before anybody else does, and the relief goes through her like weather.',
    ],
    /* Two names. Two queens go. */
    split: [
      'The tubes come around and there are two different names on them. The bottom does the arithmetic and the arithmetic is bad.',
      '"{x}." A beat. "And {y}." The host does not soften it. "Ladies, I am sorry. Both of you."',
      'Two lipsticks, two names, and nobody in that line-up had worked out this was possible until exactly now.',
      '{h} wrote one name and {g} wrote another and neither of them knew, and that is how this competition loses two queens in a night.',
      '"That is not what I expected either," the host says quietly, looking at the two tubes.',
      'Somewhere behind the two of them a queen who was on neither lipstick sits down, because her legs have stopped working.',
    ],
  },

  /* AND WHAT IT COSTS HER, after the room has seen her do it. */
  cost: {
    friend: [
      '"She is not going to look at me the same way." {h} is quiet for a second. "I know that. I did it anyway."',
      '"I have to walk back into that room in an hour." {h} exhales. "Everybody in it watched me do that."',
      '"People keep saying it is just a game." {h} shakes her head. "I still have to be somebody tomorrow."',
      '"I would like to apologise to her." A beat. "I am not going to, because that would just be me feeling better."',
      '"I lost something tonight as well," {h} says. "Nobody is going to put that on the chart."',
    ],
    strategy: [
      '"Everybody in that room just learned something about me." {h} nods. "Good. I would rather they knew."',
      '"They are going to come for me next week and they should." {h} shrugs. "That is the trade."',
      '"I did not spend that to be liked." A beat. "I spent it to win."',
      '"Somebody in there will hold this against me for the rest of the season." {h} smiles. "Only one of us is still in the competition, though."',
      '"That is the most useful thing I have done since I got here," {h} says, and does not blink.',
    ],
    room: [
      '"The room is going to be weird for a couple of days." {h} says it like a weather report. "It always is."',
      '"Half of them would have done exactly what I did and will not say so out loud."',
      '"I am not explaining myself to anybody in there." {h} pauses. "I might explain it to one of them."',
      '"Everybody is going to be very nice to me tonight," {h} says. "Watch."',
    ],
    none: [
      '"Honestly, the hardest part was the walk," {h} says. "Not the choosing."',
      '"I am not going to sit here and perform being torn up about it."',
      '"If that had been me standing there, she writes my name and does not blink. So."',
      '"It is a competition. I keep waiting to feel worse about that and it keeps not happening."',
    ],
  },
};
