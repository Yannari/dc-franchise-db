// The season's last words: the champions looking back at how they won (js/ch/final.js pathOf).
//   a (and b, when there are two) = the champions; {target} = who a's path was about, {alt} = who b's was about
//   path / pathB: showmance | survival | challenge | strategy | drama | friendship | social | grind
// Three ways to say each path; with two champions, each speaks their own path, in a different version from the other.
const A = {
  showmance: [
    "I came here for the money, and I'm leaving with the money and {target}. I still can't believe I get to say both.",
    "Everybody told me a showmance would get me sent home. {target} is the reason I'm standing here instead.",
    "People will say {target} was a distraction. {target} was the only thing in that house that kept me sane.",
  ],
  survival: [
    "They sent me into that Arena again and again. Every time, they thought it was the last time. I'm standing here because I refused to go home.",
    "I lost count of how many times the house said my name. I never lost count of how many times I walked back in.",
    "Every week, somebody decided I was the easy one to get rid of. Every week, I proved them wrong. This is the last time I have to.",
  ],
  challenge: [
    "I won daily after daily, and everybody kept saying it would catch up with me. It never did. I'm the best competitor in that house, and now it's official.",
    "I didn't talk my way to this. I ran, I climbed, I swam, and I won. Nobody can say I didn't earn it.",
    "They kept waiting for me to have a bad day. I had a few. I just never had one when it mattered.",
  ],
  strategy: [
    "I never once went into the Arena. People will say I got lucky. I didn't get lucky. I made sure my name was never the easy one to say.",
    "Every vote this season went where I wanted it to. Most of them didn't even know I was the one steering it.",
    "I played the whole house without ever standing in that Arena. People will call it luck. I played it that way.",
  ],
  drama: [
    "I fought with half the house. I'm not going to pretend I was easy to live with. But I never pretended to be somebody I'm not, and I won anyway.",
    "Everybody said my temper would send me home. My temper is the reason I never backed down, from anybody.",
    "I made enemies. A lot of them. Not one of them is holding this trophy.",
  ],
  friendship: [
    "I couldn't have done this without {target}. There were nights I wanted to go home, and {target} wouldn't let me.",
    "The first person I'm calling is {target}. This is half theirs, and I don't care who knows it.",
    "Everybody plays this game alone. I didn't. I had {target}, and that's why I'm here.",
  ],
  social: [
    "Everybody in that house liked me, and people kept saying that would be my downfall. It turns out being liked is a strategy too.",
    "I never had to fight anybody to get here. People wanted me around. In this game, that's worth more than muscle.",
    "Nobody ever wanted to say my name at a vote. I worked on that every single day, and it paid off.",
  ],
  grind: [
    "Nobody picked me to win this. Not TJ, not the house, not me on the first day. I just kept showing up, every day, until there was nobody left to beat.",
    "I wasn't the strongest, or the smartest, or the most popular. I was the one still standing at the end, and that's all that counts.",
    "There wasn't one big moment. There were a hundred small ones where I didn't quit. That's how I won.",
  ],
};
const B = Object.fromEntries(Object.entries(A).map(([k, v]) => [k, v.map(t => t.replace(/\{target\}/g, '{alt}'))]));
const CLOSE = [
  'If you told me on day one that I would be sitting here, I would have laughed at you. I am a champion of The Challenge.',
  'I will watch this season back one day, and I will remember every single thing it cost to be the one sitting here.',
  'This is the best day of my life. I know people say that. I mean it.',
];
const turnA = k => Object.entries(A).map(([path, v]) => ({ by: 'a', conf: v[k % 3], when: { path }, ...(/\{target\}/.test(v[k % 3]) ? { opt: 1 } : {}) }));
const turnB = k => Object.entries(B).map(([path, v]) => ({ by: 'b', conf: v[k % 3], when: { pathB: path }, ...(/\{alt\}/.test(v[k % 3]) ? { opt: 1 } : {}) }));
const OPEN2 = [
  [{ beat: '{a} and {b} sit together at the finish line, trophies in their laps, too tired to stand.' }],
  [{ beat: 'The sun is coming up over the finish line, and the two champions are still sitting there.' }, { by: 'b', say: 'So. How does it feel?' }, { by: 'a', say: "Ask me in a week. I don't think it's real yet." }],
  [{ beat: 'TJ has gone. The crew is packing up. {a} and {b} have not moved from the finish line.' }],
];
const CLOSE2 = [
  [{ by: 'a', say: 'Can you believe it? Both of us.' }, { by: 'b', say: "I can't believe any of it." }, { by: 'b', conf: 'Two champions. Two completely different seasons. Same finish line.' }],
  [{ by: 'a', conf: "I'm a champion of The Challenge. I'm going to make everybody back home call me that for at least a year." }],
  [{ by: 'b', say: 'We should get up.' }, { by: 'a', say: 'In a minute. Just one more minute.' }],
];

export default {
  'champion-reflect.one': Object.entries(A).flatMap(([path, v]) => v.map((text, k) => ({ id: `cr1.${path}.${k}`, when: { path }, turns: [
    { beat: ['The camp is quiet. {a} sits alone at the finish line with the trophy, looking out at the water.',
      '{a} walks back out to the finish line after everybody has gone, just to stand there for a minute.',
      'The crew is packing up around {a}, who has not let go of the trophy once.'][k] },
    { by: 'a', conf: text },
    { by: 'a', conf: CLOSE[k] },
  ] }))),
  'champion-reflect.two': [0, 1, 2].map(k => ({ id: `cr2.${k}`, turns: [...OPEN2[k], ...turnA(k), ...turnB(k + 1), ...CLOSE2[k]] })),
};
