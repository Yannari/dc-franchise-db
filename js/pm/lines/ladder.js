// pm/lines/ladder.js — the ladder's scenes (Plan 3, Task 3). Data only.
//
// Cast: [a, b]. a is the one who moves (asks, says it, closes off); b is the
// one it is said to. The engine has already decided the answer — `yes` on an
// ask, `ask-declined` when it was no — and these only say it.
//
// A refusal is b's own: "not yet" from somebody who cares (`feels` some or
// strong, read from b's side), a real no from somebody who doesn't. `of` says
// which ask was refused. {b.gf} is girlfriend / boyfriend / partner from the
// roster, never guessed.
export const LADDER = {
  'exclusive-ask': [
    { id: 'exclusive-ask.01',
      stage: '{a} waits until the two of them are alone on the terrace.',
      turns: [
        ['a', 'Can I ask you something? You can say no.'],
        ['b', 'Go on.'],
        ['a', "I don't want to get to know anyone else. I want it to be just us. Will you be exclusive with me?"],
        { by: 'b', vary: [
          { turns: [['b', "Yes. Obviously, yes. I was wondering when you'd ask."]],
            beat: '{b} kisses {a.obj} before {a} can say anything else.' },
          { when: { persona: 'wallflower' },
            turns: [['b', '…Yes. Yes, I will.']],
            beat: "{b} can't stop smiling." },
          { when: { attachment: 'avoidant' },
            turns: [['b', "Yes. I'm a bit scared, but yes."]],
            beat: '{a} takes {b.posAdj} hand, and {b} lets {a.obj}.' },
        ] },
      ] },
    { id: 'exclusive-ask.02',
      turns: [
        ['a', "I've been thinking about this all day. I don't want you talking to anyone else."],
        ['b', 'Are you asking me to be exclusive?'],
        ['a', "I'm asking you to be exclusive."],
        ['b', 'Then yes.'],
      ],
      beat: 'They tell the villa at dinner, and the whole table cheers.' },
  ],
  'official-ask': [
    { id: 'official-ask.01',
      stage: 'With the villa\'s help, {a} has covered the terrace in candles and petals.',
      turns: [
        ['a', "I know we're already exclusive. But I want to do this properly."],
        ['a', 'Will you be my {b.gf}?'],
        { by: 'b', vary: [
          { turns: [['b', 'Yes. A hundred times, yes.']],
            beat: 'The whole villa has been watching from the kitchen, and they all come running out.' },
          { when: { persona: 'hopeless-romantic' },
            turns: [['b', "…Yes. I can't believe you did all this."]],
            beat: '{b} cries a bit, and then laughs at {b.ref} for crying.' },
          { when: { attachment: 'avoidant' },
            turns: [['b', "Yes. Now get me out of here before everyone sees me like this."]],
            beat: '{a} laughs, and holds on to {b.obj} a bit longer anyway.' },
        ] },
      ] },
  ],
  'ask-declined': [
    { id: 'ask-declined.01', when: { of: 'exclusive-ask' },
      turns: [
        ['a', "I don't want to share you. Be exclusive with me."],
        { by: 'b', vary: [
          { turns: [['b', '…'], ['a', 'That pause is an answer, by the way.'],
            ['b', "I'm not there yet. I'd rather say that than tell you what you want to hear."]],
            beat: '{a} nods. Neither of them says anything else for a while.' },
          { when: { feels: 'little' },
            turns: [['b', "I can't. I'm sorry."], ['a', "Can't, or don't want to?"],
              ['b', "…Don't want to. I'm really sorry."]],
            beat: '{a} gets up and goes inside. {b} stays on the daybed on {b.posAdj} own.' },
        ] },
      ] },
    { id: 'ask-declined.02', when: { of: 'official-ask' },
      stage: '{a} has set up the terrace for the question.',
      turns: [
        ['a', 'Will you be my {b.gf}?'],
        { by: 'b', vary: [
          { turns: [['b', "I really like you. I do. But I'm not ready for that yet."], ['a', "Okay. That's… okay."]],
            beat: '{a} blows out the candles on the way back in.' },
          { when: { feels: 'little' },
            turns: [['b', "I can't say yes to that. Not when I don't feel it."], ['a', 'Right.']],
            beat: "{a} walks back in without looking at anyone." },
        ] },
      ] },
  ],
  'love-said': [
    { id: 'love-said.01',
      turns: [
        ['a', "I need to tell you something, and I'm scared."],
        ['b', 'You can tell me anything.'],
        ['a', "I'm falling in love with you."],
        { by: 'b', vary: [
          { turns: [['b', "…I'm falling in love with you too."]],
            beat: 'They hold on to each other, and neither of them moves to go in.' },
          { when: { persona: 'villa-clown' },
            turns: [['b', "Oh, thank God. I've been trying to say that for two days."]],
            beat: '{a} laughs into {b.posAdj} shoulder.' },
        ] },
      ] },
  ],
  'love-hanging': [
    { id: 'love-hanging.01',
      turns: [
        ['a', "I think I'm falling in love with you."],
        { by: 'b', vary: [
          { turns: [['b', "…You're amazing, you know that?"], ['a', "That's not really what I said, though."]],
            beat: '{b} leans in and kisses {a}. {a} kisses back, but pulls away first.' },
          { when: { attachment: 'avoidant' },
            turns: [['b', 'Can we talk about this tomorrow?'], ['a', 'Sure.']],
            beat: '{a} rolls over and faces the wall.' },
          { when: { feels: 'some' },
            turns: [['b', 'I really, really like you.'], ['a', "That's not the same."], ['b', "I know. I'm sorry."]],
            beat: "{a} nods, and doesn't say it again." },
        ] },
      ] },
  ],
};
