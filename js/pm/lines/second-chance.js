// pm/lines/second-chance.js — the second-chance night (pm/arrivals.js
// secondChance). Data only.
//
//   sc-arrive  [a, b, …]  the dumped walk back in together (only {a} and {b} named:
//                         two to four come back)
//   sc-rules   []         the host: who decides, and one of each side stays. `of`: public · villa
//   sc-vote    [a, b]     a votes to keep b
//   sc-stay    [a]        a is back in the villa. `of`: public · villa
//   sc-leave   [a]        a goes home again
export const SECOND_CHANCE_LINES = {
  'sc-arrive': [
    { id: 'sca.01', stage: 'The villa doors open, and the dumped islanders walk back in, {a} and {b} at the front.', turns: [
      ['a', "Did you miss us?"], ['b', "Don't all get up at once."]], beat: 'Half the villa screams. The other half goes very quiet.' },
    { id: 'sca.02', stage: 'A text sends everyone to the lawn. Walking down the steps: faces they thought they had seen the last of. {a} is first.', turns: [
      ['a', "Surprise."], ['b', "We're back. For now."]], beat: 'Somebody drops a glass.' },
    { id: 'sca.03', stage: 'The music stops. {a} and {b} walk in with the others who were dumped.', turns: [
      ['b', "Look at their faces."], ['a', "Some of them are happy to see us."], ['b', "Some of them."]] },
    { id: 'sca.04', stage: 'The fire pit. The doors open behind the islanders, and they turn round to see {a}, {b} and the rest.', turns: [
      ['a', "Hello again."]], beat: 'Nobody says anything for a moment. Then everybody does.' },
  ],
  'sc-rules': [
    { id: 'scr.p.01', when: { of: 'public' }, turns: [['dior', "Islanders, these islanders have been given a second chance. The public have been voting for who they want back in the villa."],
      ['dior', "One girl and one boy will stay. The rest will leave again tonight."]], beat: 'Everyone on the benches looks at everyone else.' },
    { id: 'scr.p.02', when: { of: 'public' }, turns: [['dior', "Good evening. Some familiar faces tonight. The public have decided which of them deserves a second chance."],
      ['dior', "Only one boy and one girl can stay."]] },
    { id: 'scr.v.01', when: { of: 'villa' }, turns: [['dior', "Islanders, these islanders have come back for a second chance. And you're going to decide who stays."],
      ['dior', "One at a time, you'll tell us who you want back. One girl and one boy will stay, and the rest will go home again."]], beat: 'A few of the islanders look very uncomfortable.' },
    { id: 'scr.v.02', when: { of: 'villa' }, turns: [['dior', "The dumped islanders are back, and the choice is yours tonight. Pick who you want in the villa. Choose carefully."]] },
  ],
  'sc-vote': [
    { id: 'scv.01', turns: [['a', "I'm voting for {b} to stay. The villa hasn't been the same without {b}."]] },
    { id: 'scv.02', turns: [['a', "This is hard, but I want {b} back. I think {b}'s story in here isn't finished."]] },
    { id: 'scv.03', turns: [['a', "I've got to go with {b}. I've missed {b} every day."]], beat: '{b} puts a hand on {b.posAdj} heart.' },
    { id: 'scv.04', turns: [['a', "My vote is for {b}. Honestly, I think {b} was dumped too soon."]] },
    { id: 'scv.05', turns: [['a', "I'm keeping {b}. No hesitation."]], beat: 'Somebody on the benches cheers.' },
    { id: 'scv.06', turns: [['a', "I want {b} to stay, because I never got to know {b} properly."]] },
  ],
  'sc-stay': [
    { id: 'scs.p.01', when: { of: 'public' }, turns: [['dior', "The public have voted, and staying in the villa is… {a}."]], beat: '{a} screams, and the whole villa runs over.' },
    { id: 'scs.p.02', when: { of: 'public' }, turns: [['dior', "With the most votes from the public… {a}, you're back in the villa."], ['a', "I can't believe it."]] },
    { id: 'scs.p.03', when: { of: 'public' }, turns: [['dior', "{a}. The public want you back."], ['a', "Thank you. Thank you so much."]], beat: '{a} is in tears.' },
    { id: 'scs.v.01', when: { of: 'villa' }, turns: [['dior', "The islanders have made their choice. {a}, welcome back."], ['a', "Oh my God."]], beat: 'The villa cheers.' },
    { id: 'scs.v.02', when: { of: 'villa' }, turns: [['dior', "With the most votes from the islanders, {a} is staying."], ['a', "I'm not wasting it this time."]] },
    { id: 'scs.v.03', when: { of: 'villa' }, turns: [['a', "I didn't think anyone would pick me."]], beat: '{a} hugs everyone who voted, and a few who didn\'t.' },
  ],
  'sc-leave': [
    { id: 'scl.01', turns: [['a', "It was nice to see everyone. Good luck, all of you."]], beat: '{a} waves, and walks back out through the doors.' },
    { id: 'scl.02', turns: [['a', "It hurts, but I got to say goodbye properly this time."]], beat: '{a} hugs a few of the others on the way out.' },
    { id: 'scl.03', turns: [['a', "I'll be watching. Behave."]], beat: 'Everyone laughs, and {a} goes.' },
    { id: 'scl.04', turns: [['a', "At least I got one more night."]], beat: '{a} walks out without looking back.' },
  ],
};
