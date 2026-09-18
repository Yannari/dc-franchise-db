// ══════════════════════════════════════════════════════════════════════
// dr/data/revenge-beats.js — the night the eliminated queens come back
// ══════════════════════════════════════════════════════════════════════
//
// Revenge of the Queens (AS2 ep 5). Its own file rather than stage-beats.js,
// which every season walks: this is one night, once, on one season shape.
//
// `{a}` the returning queen, `{b}` the queen she is paired with, `{c}` a
// third name where a line needs one, `{n}` a number.
export const REVENGE_BEATS = {
  /* THE HOST SAYS IT BEFORE ANYBODY SEES THEM. The cold open of the night,
     and the room has no idea. */
  open: [
    '"Before we begin," the host says, and the room knows that sentence. "There is somebody at the door. Well. There are several somebodies."',
    'The queens file in expecting a mini challenge and find the workroom set for twice as many people. Nobody says anything. Everybody has worked it out.',
    '"You have all been sending queens home for weeks," the host says pleasantly. "Today they would like a word."',
  ],
  /* ONE AT A TIME, IN THE ORDER THEY LEFT, LAST OUT FIRST. */
  walk: [
    '{a} comes through that door for the second time and the room makes a sound it has not made since the premiere.',
    '{a} walks back in like she never left, which is a performance, and everybody watching knows it is a performance, and it works anyway.',
    'The door opens on {a}. Somewhere behind the screaming, three queens are doing arithmetic.',
    '{a} steps in, says nothing for a beat, and lets the room look at her. "Miss me?"',
    '{a} is back, and the first thing she does is find the queen who was in the bottom with her and hug her like a funeral.',
  ],
  /* AND THE ROOM ANSWERS, which is where the drama actually is. */
  room: [
    '{b} gets to her first and holds on. They were in the bottom together and only one of them came out of it.',
    '{b} claps with everybody else and her face does something else entirely.',
    'The hug between {a} and {b} lasts exactly as long as the cameras need it to.',
    '"I am happy for her," {b} says to nobody. She says it again, later, to a camera.',
  ],
  /* THE PAIRING: they are not here to watch. */
  rule: [
    '"Each of you is taking one of them," the host says. "You will perform together, and the panel will judge you as a pair. And then two of these queens will lip sync for a place back in this competition."',
    '"They are not guests," the host says. "They are your partners, and one of them is going to be your problem again."',
  ],
  pair: [
    '{a} and {b} are paired, and neither of them has to pretend to be pleased about it.',
    '{a} takes her place beside {b}. They have done this before, on a season that ended badly for one of them.',
    '{a} and {b} together. The room notices. Of course the room notices.',
    '{a} gets {b}, and within a minute they are talking like the weeks in between did not happen.',
  ],
  /* THE COUPLES THE PANEL PUT FIRST. */
  couples: [
    '"The top two couples of the night," the host says, "are {a} with {b}, and {c} with {d}."',
    'Two couples are called out and stand there being told they were the best thing on that stage. Two of the four have nothing to lose and it shows.',
  ],
  /* THE SONG THEY SING FOR THE SEASON BACK. */
  song: [
    '"{a}. {c}. Two of you came back tonight to fight for something. This is it."',
    'The two returning queens take the stage and the queens still in the competition watch from the back, because one of these two is about to be their problem.',
  ],
  win: [
    '{a} wins it and she is back in the competition. Her record, her chart row, her season — all of it picks up exactly where it stopped.',
    'The host lets it hang. "{a}. Welcome back to the competition." The room comes apart.',
  ],
  /* AND WHAT SHE WON BESIDES A SEASON. The winner of this song holds the
     lipstick — a queen the room eliminated decides who leaves tonight — and
     the queen she was paired with takes the week off the back of it. */
  power: [
    '"And {a}," the host says, "since you won tonight, you win tonight." The lipstick is hers, and every queen in that bottom works out what that means at the same moment.',
    'The host hands {a} the lipstick. She was sent home by somebody standing in that room and now she is holding the thing that sends one of them home.',
    '"One more thing," the host says, and the room goes quiet before he finishes the sentence, because it already knows. {a} is holding the power tonight.',
  ],
  couple: [
    'And the win goes to the couple: {c} takes the week on the strength of the queen she was handed at the top of the night.',
    '"{c}," the host says. "Your partner just won you this challenge. Condragulations." She laughs like somebody who cannot believe her luck, which is what she is.',
    '{c} wins the maxi challenge without singing a note of it — the couple was judged as one thing and the couple won.',
  ],
  both: [
    'The host does not choose. "I cannot separate you two, and I am not going to try. {a}. {c}. BOTH of you are back in this competition." The room loses whatever composure it had left.',
    '"Two queens went home," the host says. "Two queens are coming back. {a}, {c} — you are both in."',
  ],
  lost: [
    '{a} takes it standing up, hugs the queen who beat her, and goes back out the door she came in through. Twice is harder than once.',
    'For {a} it ends a second time, in front of the same people, which is a particular kind of cruelty nobody in the room is enjoying.',
  ],
};
