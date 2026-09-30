// How a ratings night ends (Plan 3b). Data only.
// alert.<format> — a reads the Circle's alert out loud; b reacts.
// hangout.solo.* — a, a sole Influencer, alone in the apartment; c is the
// player being weighed (view) or the one they block (decide).
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

export const FORMAT_LINES = {
  ...E('alert.sole', [
    { turns: [{ by: 'a', react: "'Tonight, only the top-rated Player will become an Influencer.' Only one?" },
      { by: 'b', react: 'One person. Deciding alone. That is terrifying.' }], beat: '{a} reads it twice to be sure.' },
    { turns: [{ by: 'a', react: "'There will be only one Influencer tonight.' Oh, that changes everything." },
      { by: 'b', say: 'No Hangout? No second opinion? Wow.' }] },
    { turns: [{ by: 'a', react: "'The top-rated Player will block alone.' Okay. Whoever that is, I feel for them." },
      { by: 'b', react: "Please don't be me. Actually, please be me." }], beat: '{b} hugs a pillow.' },
    { turns: [{ by: 'a', react: "'Only one Influencer.' So nobody to blame but yourself." },
      { by: 'b', say: 'Every person in this building is doing math right now.' }] },
  ]),
  // block.announce.solo.<reason> — a sole Influencer sends the name ({c}) alone.
  ...E('block.announce.solo.threat', [
    { turns: [{ by: 'a', send: "This was my call and only mine. You're too strong to leave in. I am blocking... {c}" }], beat: 'Every apartment waits on the dots.' },
    { turns: [{ by: 'a', send: "I had to think about who could beat me. I am blocking... {c}" }] },
    { turns: [{ by: 'a', send: "Nothing personal. It's the game, and I'm the one playing it tonight. I'm blocking... {c}" }] },
  ]),
  ...E('block.announce.solo.fake', [
    { turns: [{ by: 'a', send: "I have to trust my gut. And my gut says this person isn't real. I'm blocking... {c}" }], beat: 'Every apartment waits on the dots.' },
    { turns: [{ by: 'a', send: "If I'm wrong, I'll own it. I'm blocking... {c}" }] },
    { turns: [{ by: 'a', send: "Something never added up for me. I'm blocking... {c}" }] },
  ]),
  ...E('block.announce.solo.grudge', [
    { turns: [{ by: 'a', send: "You know what you did. I'm blocking... {c}" }], beat: 'Every apartment waits on the dots.' },
    { turns: [{ by: 'a', send: "Loyalty matters to me. I'm blocking... {c}" }] },
    { turns: [{ by: 'a', send: "I gave you a chance. I'm blocking... {c}" }] },
  ]),
  ...E('block.announce.solo.noBond', [
    { turns: [{ by: 'a', send: "I have to protect the people who have my back. I'm blocking... {c}" }], beat: 'Every apartment waits on the dots.' },
    { turns: [{ by: 'a', send: "We never really connected, and I'm sorry for that. I'm blocking... {c}" }] },
    { turns: [{ by: 'a', send: "This was the hardest decision I've made in here. I'm blocking... {c}" }] },
  ]),
  // a is the one and only Influencer tonight.
  ...E('result.sole', [
    { turns: [{ by: 'a', react: "First place. And that means... it's all on me." }], beat: '{a} stares at the screen, frozen.' },
    { turns: [{ by: 'a', react: "Top of the ratings. Sole Influencer. I wanted this. Did I want this?" }] },
    { turns: [{ by: 'a', react: "Me? Alone? Okay. Okay. Deep breaths." }], beat: '{a} fans {a.ref} with both hands.' },
    { turns: [{ by: 'a', react: "Number one. That feels amazing for exactly one second." },
      { by: 'a', say: 'Now I have to block somebody by myself.' }] },
  ]),
  ...E('hangout.solo.open', [
    { turns: [{ by: 'a', react: "'You are the sole Influencer.' Me. Just me. Okay." },
      { by: 'a', say: 'No one to talk it through with. It has to be my call.' }], beat: '{a} sits down slowly on the couch.' },
    { turns: [{ by: 'a', react: 'It\'s me. I have to do this alone.' },
      { by: 'a', say: 'Whatever happens next, everybody will know it was me.' }], beat: '{a} pulls the tablet onto {a.posAdj} knees.' },
    { turns: [{ by: 'a', react: "Sole Influencer. That's the best and worst news I've ever gotten." }], beat: '{a} laughs, then stops laughing.' },
    { turns: [{ by: 'a', say: 'Okay, Circle. Show me who is at risk.' },
      { by: 'a', react: 'Every single one of these faces is a person I talk to.' }], beat: '{a} scrolls through the names.' },
  ]),
  ...E('hangout.solo.view.threat.cut', [
    { turns: [{ by: 'a', say: '{c} is the strongest player in here. If I leave {c.obj} in, {c.sub} wins.' }] },
    { turns: [{ by: 'a', say: 'Everybody loves {c}. That is exactly the problem.' }], beat: '{a} taps {c}\'s picture.' },
    { turns: [{ by: 'a', say: "{c} would block me in a second if {c.sub} had this power. I know it." }] },
  ]),
  ...E('hangout.solo.view.fake.cut', [
    { turns: [{ by: 'a', say: "I don't think {c} is real. I haven't thought it since day one." }] },
    { turns: [{ by: 'a', say: 'Something about {c} has never added up for me.' }], beat: '{a} zooms in on {c}\'s profile picture.' },
    { turns: [{ by: 'a', say: "If {c} is a catfish and I leave {c.obj} in here, that's on me." }] },
  ]),
  ...E('hangout.solo.view.grudge.cut', [
    { turns: [{ by: 'a', say: "{c} came for me. I haven't forgotten." }] },
    { turns: [{ by: 'a', say: '{c} made this personal. Now I get to answer.' }], beat: '{a}\'s jaw sets.' },
    { turns: [{ by: 'a', say: "I tried with {c}. {c} didn't try back." }] },
  ]),
  ...E('hangout.solo.view.noBond.cut', [
    { turns: [{ by: 'a', say: "{c} and I barely talk. I don't owe {c.obj} anything." }] },
    { turns: [{ by: 'a', say: "I don't know {c}. And {c} never made the effort to know me." }] },
    { turns: [{ by: 'a', say: "Who's actually in my corner? Not {c}." }], beat: '{a} shrugs at the screen.' },
  ]),
  ...E('hangout.solo.view.noBond.keep', [
    { turns: [{ by: 'a', say: "{c} is safe with me. {c}'s always been good to me." }] },
    { turns: [{ by: 'a', say: "Not {c}. I couldn't do that to {c.obj}." }] },
    { turns: [{ by: 'a', say: "{c}? No. {c.Sub}'s not the one." }], beat: '{a} moves on to the next picture.' },
    { turns: [{ by: 'a', say: "I'd never forgive myself if I blocked {c}." }] },
    { turns: [{ by: 'a', say: "{c} stays. We made a promise, and I keep my promises." }] },
  ]),
  ...E('hangout.solo.decide', [
    { turns: [{ by: 'a', say: "It has to be {c}. I hate it. But it has to be {c}." }], beat: '{a} takes a long breath.' },
    { turns: [{ by: 'a', say: 'Okay. I know who it is. I knew all along.' }, { by: 'a', react: 'Sorry, {c}.' }] },
    { turns: [{ by: 'a', say: "Circle, I've made my decision. It's {c}." }], beat: '{a} sets the tablet down very carefully.' },
    { turns: [{ by: 'a', react: "{c}. Final answer. Don't overthink it." }, { by: 'a', say: 'I will overthink it for the rest of my life.' }] },
  ]),
};
