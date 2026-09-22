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
    { id: 'pull.01', when: { bTaken: true },
      turns: [
        ['a', 'Can I be honest with you? Properly honest.'],
        ['b', 'Go on.'],
        ['a', "If you'd walked in on day one, I don't think you'd be sat on that bed with them."],
        ['b', "You can't say stuff like that to me."],
        ['a', "I know. I've said it now."],
      ],
      beat: "{b} doesn't get up." },
    { id: 'pull.02', when: { bombshell: true, early: true },
      turns: [
        ['a', "I've been here a day and you're the only person I've wanted to talk to properly."],
        ['b', "You've been here a day. You haven't talked to anyone properly."],
        ['a', "Fair. But I'm talking to you now, aren't I?"],
        ['b', '…Go on, then. What do you want to know?'],
      ],
      beat: '{b} moves up on the daybed to make room.' },
    { id: 'pull.03', when: { persona: 'fuckboy' },
      turns: [
        ['a', 'What are you doing tonight?'],
        ['b', "What's anyone doing tonight? We're in a villa."],
        ['a', 'Then do nothing with me. On the terrace, later.'],
        ['b', "That's the worst chat-up line I've ever heard."],
        ['a', "And you're still smiling."],
      ],
      beat: '{b} laughs and tells {a.obj} to get lost.' },
    { id: 'pull.04', when: { persona: 'game-player', bTaken: true },
      turns: [
        ['a', "Can I be straight with you? I think we'd be good together, and I think you know it."],
        ['b', "I'm coupled up."],
        ['a', "You're coupled up with someone who's been looking at the door since day two."],
        ['b', "That's not fair."],
        ['a', "I'm not saying it to be fair. I'm saying it because it's true."],
      ],
      beat: '{b} looks across the lawn to where {b.posAdj} partner is sitting.' },
    { id: 'pull.05',
      turns: [
        ['a', 'Can I borrow you for a minute?'],
        ['b', 'What sort of chat?'],
        ['a', 'A normal one. I promise.'],
        ['b', "There's no such thing in here."],
      ],
      beat: '{b} goes with {a.obj} anyway, out to the daybeds.' },
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
    { id: 'argument.02', when: { coupled: true, mood: 'jealous' },
      stage: '{a} finds {b} at the fire pit.',
      turns: [
        ['a', 'Were you going to tell me, or was I meant to hear it from someone else?'],
        ['b', 'Tell you what? Nothing happened.'],
        ['a', 'Then why is everyone being weird with me?'],
        ['b', "Because you're being weird with everyone. I've not done anything."],
      ],
      beat: '{a} starts to answer, then heads up to bed instead.' },
    { id: 'argument.03', when: { mood: 'stressed' },
      turns: [
        ['b', "You've bitten my head off three times today."],
        ['a', "Because you keep asking me if I'm alright."],
        ['b', "Because you're clearly not."],
        ['a', "I'm tired, I'm hot, and I've been stuck in here for three weeks. I'm allowed to be in a mood."],
        ['b', "You are. You're just not allowed to take it out on me."],
      ],
      beat: '{a} goes quiet and starts clearing the plates.' },
    { id: 'argument.04', when: { coupled: false },
      stage: 'It starts over who used the last of the hot water.',
      turns: [
        ['a', "Five minutes. That's all I'm asking. Five minutes in the shower like a normal person."],
        ['b', 'I was in there ten minutes, tops.'],
        ['a', "You were in there so long I thought you'd moved in."],
        ['b', 'Say it to my face next time, instead of to the whole kitchen.'],
        ['a', 'I am saying it to your face.'],
      ],
      beat: 'Half the villa has stopped eating to watch.' },
    { id: 'argument.05', when: { persona: 'messy' },
      turns: [
        ['a', "No, we're doing this now. In front of everyone. I don't care."],
        ['b', 'Can we not? Please. Not here.'],
        ['a', 'Why, so you can tell your side first?'],
        ['b', "There aren't sides. I just don't want to do this with everyone watching."],
      ],
      beat: '{b} gets up and walks inside. {a} follows, still talking.' },
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
