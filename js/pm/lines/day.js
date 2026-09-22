// pm/lines/day.js — the villa's day-to-day scenes (Plan 3, Task 2).
// Data only. Shape: { id, when?, stage?, turns: [[speaker, text]], beat? }.
// Speakers: a, b, c, dior, narrator. Names and pronouns are placeholders —
// {a}, {b.obj}, {c.posAdj} — filled at render time. Never a name, never a
// guessed gender. A closing beat shows an action; it does not comment on it.
//
// Until Task 2 fills them, each kind carries Plan 1's placeholder lines as
// staging only, so every event still renders.
const stub = (kind, lines) => lines.map((stage, i) => ({ id: `${kind}.p${i + 1}`, stage }));

export const DAY = {
  chat: stub('chat', ['{a} and {b} talk on the daybeds about home.', '{a} and {b} have a quiet chat by the pool.']),
  'deep-chat': stub('deep-chat', ['{a} opens up to {b} about the last time {a} got hurt.', '{a} tells {b} this feels different.']),
  kiss: stub('kiss', ['{a} and {b} kiss on the terrace.', '{b} pulls {a} in for a kiss under the fairy lights.']),
  pull: [
    ...stub('pull', ['{a} pulls {b} for a chat.']),
    { id: 'pull.01',
      turns: [
        ['a', 'Can I be honest with you? Properly honest.'],
        ['b', 'Go on.'],
        ['a', "If you'd walked in on day one, I don't think you'd be sat on that bed with them."],
        ['b', "You can't say stuff like that to me."],
        ['a', "I know. I've said it now."],
      ],
      beat: "{b} doesn't get up." },
  ],
  loyalty: stub('loyalty', ['{a} turns {b} down and says nothing is going to happen.', '{a} tells {b} straight that nothing is happening.']),
  argument: [
    ...stub('argument', ['{a} and {b} row on the terrace.']),
    { id: 'argument.01',
      turns: [
        ['b', "Don't tell me how I should feel."],
        ['a', "I'm not doing that, I'm just saying—"],
        ['b', 'You are. Every time. You decide what the problem is, then you tell me I\'m the problem for having it.'],
        ['a', "Alright. Then tell me what it is, because I've been guessing all day."],
      ],
      beat: "{b} walks off toward the kitchen. {a} doesn't follow." },
  ],
  friendship: [
    ...stub('friendship', ['{a} and {b} make breakfast together.']),
    { id: 'friendship.01',
      turns: [
        ['a', "You've been quiet all morning."],
        ['b', "I'm fine."],
        ['a', "You said \"I'm fine\" to the toaster. I heard you."],
        ['b', "…It's the recoupling. I don't know where I stand."],
        ['a', "Then we'll work it out. Sit down, I'm doing your eggs."],
      ],
      beat: '{b} sits down and eats.' },
  ],
  gossip: [
    { id: 'gossip.01', when: { knows: true },
      stage: '{a} waits until the terrace is empty.',
      turns: [
        ['a', "I wasn't going to say anything, but I'd want to know if it was me."],
        ['b', 'Say what?'],
        ['a', "Last night, on the daybeds. {c} was all over someone else, and it wasn't a chat."],
        ['b', '{c}? You saw that?'],
        ['a', 'I was sat right there.'],
      ],
      beat: '{b} looks over at the pool, where {c} is laughing at something.' },
    { id: 'gossip.p1', when: { knows: true }, stage: '{a} sits {b} down and tells {b.obj} what {c} did.' },
  ],
  comedy: [
    ...stub('comedy', ['{a} does an impression of the whole villa at breakfast.']),
    { id: 'comedy.01',
      turns: [['a', "Quick announcement. Whoever keeps putting the empty milk back in the fridge: I know it's you, and so does God."]] },
  ],
  ick: stub('ick', ['{a} gets the ick when {b} does that laugh again.', '{a} tells a friend that {b} has given {a.obj} the ick.']),
  'challenge-kiss': stub('challenge-kiss', ['In the challenge, {a} picks {b} to kiss.', '{a} kisses {b} for the points, and the villa screams.']),
  'challenge-win': stub('challenge-win', ['{a} and {b} win the challenge.', '{a} and {b} take the points and a night in the hideaway.']),
};
