// Making up — a couple's first warm scene after they rowed earlier the same
// day (`rowedToday`, which leads the choice: pm/script.js). Cast: [a, b],
// coupled together. Either of them may have started it, so neither line
// assumes who; the row itself is "earlier", which is always true here.
const R = { rowedToday: true };
export const MAKING_UP = {
  chat: [
    { id: 'chat.up1', when: R,
      turns: [
        ['a', 'Are we alright? After earlier?'],
        { by: 'b', vary: [
          { turns: [['b', "We're alright. I don't like it when we're like that."], ['a', 'Me neither.']],
            beat: '{b} takes {a.posAdj} hand.' },
          { when: { attachment: 'avoidant' },
            turns: [['b', "We're fine. Can we just not go over it again?"], ['a', 'Okay.']],
            beat: "They sit together, but not as close as usual." },
          { when: { archetype: 'hothead' },
            turns: [['b', "I said some stuff I didn't mean. I get like that."], ['a', 'I know you do.']],
            beat: '{b} puts an arm round {a.obj}.' },
        ] },
      ] },
    { id: 'chat.up2', when: R,
      stage: '{b} sits down next to {a} without saying anything.',
      turns: [
        ['a', 'Is this you saying sorry?'],
        ['b', "It's me trying to."],
        ['a', "That'll do."],
      ] },
    { id: 'chat.up3', when: { ...R, phase: 'evening' },
      turns: [
        ['a', "I don't want to go to bed on an argument."],
        ['b', "Then let's not."],
        ['a', "I'm sorry I snapped."],
        ['b', "I'm sorry I didn't listen."],
      ],
      beat: 'They stay out on the daybed until the lights go off.' },
    { id: 'chat.up4', when: R,
      turns: [
        ['a', 'Can we just start again?'],
        ['b', 'From where?'],
        ['a', 'From before I opened my mouth.'],
      ],
      beat: '{b} laughs for the first time since, and moves up to make room.' },
    { id: 'chat.up5', when: R,
      turns: [
        ['a', 'I was out of order before.'],
        { by: 'b', vary: [
          { turns: [['b', 'You were a bit.'], ['a', 'I know. I am sorry.'], ['b', "Okay. Come here."]] },
          { when: { attachment: 'anxious' },
            turns: [['b', "I thought you were going to end it."], ['a', 'Over that? No. Never over that.']],
            beat: '{b} holds on to {a.posAdj} arm.' },
        ] },
      ] },
    { id: 'chat.up6', when: R,
      turns: [
        ['a', 'Everyone heard us, didn\'t they?'],
        ['b', 'Everyone heard us.'],
        ['a', "Then everyone can see us sorting it out."],
      ],
      beat: '{a} kisses {b.obj} on the cheek, in front of all of them.' },
  ],
  kiss: [
    { id: 'kiss.up1', when: R,
      turns: [
        ['a', "Truce?"],
        ['b', 'Truce.'],
      ],
      beat: "They kiss, and that's the end of it." },
    { id: 'kiss.up2', when: R,
      turns: [
        ['a', 'I hate fighting with you.'],
        ['b', 'Me too. Come here.'],
      ],
      beat: '{b} pulls {a} in and kisses {a.obj}.' },
    { id: 'kiss.up3', when: R,
      stage: '{a} finds {b} by the pool once the villa has calmed down.',
      turns: [
        ['a', "I'm sorry about earlier."],
        ['b', 'Me too.'],
      ],
      beat: 'They kiss, quietly, with nobody watching for once.' },
  ],
  'deep-chat': [
    { id: 'deep-chat.up1', when: R,
      turns: [
        ['a', "Can I tell you why I got so upset before?"],
        ['b', 'Please.'],
        ['a', "Because I care what you think of me. More than I've cared about anyone in here."],
        ['b', "Then say that next time. Before the shouting."],
      ] },
    { id: 'deep-chat.up2', when: R,
      turns: [
        ['a', "When we argue, I go straight back to the last time someone hurt me. That's not your fault."],
        ['b', "Then tell me when it's happening, and I'll know it's not about me."],
      ],
      beat: '{a} nods, and leans into {b.obj}.' },
  ],
  'challenge-win': [
    { id: 'challenge-win.up1', when: R,
      turns: [
        ['a', 'We just won, and earlier we were barely talking.'],
        ['b', "That's us, isn't it."],
      ],
      beat: 'They hug for a long time.' },
  ],
};
