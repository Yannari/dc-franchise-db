// pm/lines/hideaway.js — the Hideaway night (pm/villa-day.js hideawayNight). Data only.
//
//   hideaway-text     [a, b]        the text: one couple gets the Hideaway, the villa decides
//   hideaway-vote     [a, b, c, d]  a and b's pick is c and d
//   hideaway-win      [a, b]        the winners, and the villa cheering
//   hideaway-snub     [a, b]        the couple most into each other who got no votes
//   hideaway-morning  [a, b, c]     the next morning: a grills b about the night with c
export const HIDEAWAY_LINES = {
  'hideaway-text': [
    { id: 'hw.t1', stage: "{a}'s phone goes off, and the villa crowds round.", turns: [['a', "I got a text! Islanders, tonight one lucky couple will be spending the night in the Hideaway. #BehindClosedDoors"], ['a', "And you get to decide who."]], beat: 'Every couple looks at every other couple.' },
    { id: 'hw.t2', turns: [['a', "Islanders, the Hideaway is open tonight, and it is up to you which couple gets the keys. #DoNotDisturb"], ['b', "Oh, this is going to cause drama."]] },
    { id: 'hw.t3', stage: '{a} reads the text out, grinning.', turns: [['a', "Islanders, please gather on the terrace. Tonight, you will vote for the couple you think deserves a night in the Hideaway. #PrivateTime"], ['b', "Please be us. Please be us."]] },
  ],
  'hideaway-vote': [
    { id: 'hw.v1', turns: [['a', "We've both said the same couple straight away. {c} and {d}. You two are actually made for each other."], ['b', "It's obvious. Look at them."]], beat: '{c} and {d} are both blushing.' },
    { id: 'hw.v2', turns: [['b', "We want to give it to a couple who've had a hard week and come out stronger. That's {c} and {d}."]] },
    { id: 'hw.v3', turns: [['a', "{c} and {d}. If anyone's earned a night without the rest of us snoring, it's them."]], beat: 'The villa laughs.' },
    { id: 'hw.v4', turns: [['a', "This is so hard. But we're going with {c} and {d}."], ['b', "They look at each other like nobody else is here."]] },
    { id: 'hw.v5', turns: [['b', "Our vote goes to {c} and {d}, because they've been there for us since day one."]], beat: '{d} blows them a kiss.' },
    { id: 'hw.v6', turns: [['a', "We'd love it to be us, obviously. But it's {c} and {d}."], ['c', "Thank you!"]] },
    { id: 'hw.v7', turns: [['b', "We think {c} and {d} need some time on their own, just the two of them. So it's them."], ['c', "Is that a compliment?"], ['b', "Mostly."]] },
  ],
  'hideaway-win': [
    { id: 'hw.w1', stage: "The votes are in, and the villa has chosen: {a} and {b}.", turns: [['a', "Us? Really?"], ['b', "Come on, before they change their minds."]], beat: 'The whole villa cheers them all the way up the stairs.' },
    { id: 'hw.w2', stage: '{a} and {b} have the most votes, and the terrace erupts.', turns: [['b', "I'm not going to lie, I really wanted this."], ['a', "Me too."]], beat: 'Somebody wolf-whistles as they go.' },
    { id: 'hw.w3', stage: "It's {a} and {b}. The villa goes wild.", turns: [['a', "Thank you, everyone. We won't tell you anything tomorrow."]], beat: 'Nobody believes that for a second.' },
  ],
  'hideaway-snub': [
    { id: 'hw.s1', stage: '{a} and {b} did not get a single vote.', turns: [['a', "Not one. Not one vote."], ['b', "It doesn't matter what they think."], ['a', "It matters a bit."]] },
    { id: 'hw.s2', turns: [['b', "I thought we were the obvious couple."], ['a', "Apparently not."]], beat: '{b} goes to bed early.' },
    { id: 'hw.s3', stage: 'While the villa celebrates, {a} and {b} sit a little apart from everyone.', turns: [['a', "We'll get our turn."], ['b', "Will we?"]] },
  ],
  'hideaway-morning': [
    { id: 'hw.m1', stage: 'Breakfast. {b} comes down, and the whole kitchen goes quiet.', turns: [['a', "So?"], ['b', "So what?"], ['a', "How was the Hideaway?"], ['b', "I'm not telling you anything."]] },
    { id: 'hw.m2', turns: [['a', "You've been smiling since you came down."], ['b', "It was just nice to get a good night's sleep."], ['a', "A good night's sleep. Sure."]], beat: 'The kitchen laughs.' },
    { id: 'hw.m3', stage: '{a} corners {b} by the coffee machine.', turns: [['a', "Details. Now."], ['b', "We talked. For hours. That's all you're getting."]] },
    { id: 'hw.m4', turns: [['a', "Did {c} snore?"], ['b', "I'm not answering that."], ['a', "That's a yes."]] },
  ],
};
