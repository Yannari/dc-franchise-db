// pm/talk/more/small-pools-volume.js — the small pools a season wore through
// (the user, 2026-10-22: "address the repeats by increasing the volume of the
// dialogue ALOT"): the families' visit, the pile-in, and the stage lines of the
// debrief, the vent and the advice, some heard 13 times a season. Same facts
// and gates as each kind's own file.
const LATER = { of: ['robbed', 'stole', 'twisted-on', 'twisted', 'miss', 'blame', 'next', 'eyeing', 'bomb-threat', 'bomb-fancy', 'picked', 'meh'] };

export const FAMILIES_VOLUME = {
  moves: {
    talk: [
      { when: { verdict: 'good' }, turns: [['b', "They made me feel like part of the family straight away."], ['a', "That's because you are. They've decided. There's no going back now."]] },
      { when: { verdict: 'good' }, turns: [['a', "They kept saying you're even nicer than you look on {~telly}."], ['b', "Is that a compliment?"], ['a', "From them, it's the biggest one there is."]] },
      { when: { verdict: 'bad' }, turns: [['b', "Did I say something wrong?"], ['a', "No. They're just scared I'll get hurt. They've seen me get hurt before."]] },
      { when: { verdict: 'bad' }, turns: [['a', "They asked me if I'm sure. More than once."], ['b', "And are you?"], ['a', "I am. They're not, yet."]] },
      { when: { verdict: 'unsure' }, turns: [['b', "They were nice. Polite. Very polite."], ['a', "Polite's good. Polite's a start."]] },
      { when: { verdict: 'unsure' }, turns: [['a', "They want to get to know you on the outside. Properly. Without the cameras."], ['b', "That's fair. So do I."]] },
    ],
    after: [
      { when: { verdict: 'good' }, turns: [['b', "I really like them."], ['a', "They really like you. I'm almost jealous."]] },
      { when: { verdict: 'good' }, turns: [['a', "That went better than I could have dreamed."], ['b', "I was so nervous."], ['a', "You were perfect. Honestly."]] },
      { when: { verdict: 'good' }, turns: [['a', "They're already planning a dinner for when we get out."], ['b', "A dinner? With all of them?"], ['a', "All of them. Brace yourself."]] },
      { when: { verdict: 'bad' }, turns: [['b', "I'll win them round."], ['a', "I know you will. It just might take a while."]] },
      { when: { verdict: 'bad' }, turns: [['a', "I don't care what they think. Well, I do. But I care what I think more."]] },
      { when: { verdict: 'unsure' }, turns: [['b', "What do I do now?"], ['a', "Just keep being you. That's what they'll come round to."]] },
      { when: { verdict: 'unsure' }, turns: [['a', "One of them gave you a thumbs up on the way out. I saw it."], ['b', "A thumbs up? That's something."], ['a', "That's a lot, from them."]] },
    ],
  },
};

export const PILE_IN_VOLUME = {
  moves: {
    step: [
      { turns: [['a', "Hey. Hey. Both of you, stop. {c}, that's enough."], ['c', "Who asked you?"]] },
      { turns: [['a', "I've been sitting over there listening to this, and I'm not doing it any more. {b} doesn't deserve that."]] },
      { stage: "{a} gets up from the daybeds and walks straight over.", turns: [['a', "Can everyone just calm down for a second? {c}, I'm talking to you."]] },
      { turns: [['a', "{c}, you're not being fair. And you know you're not."], ['c', "Stay out of it."]] },
      { turns: [['a', "That's out of order, {c}. Everyone heard you. Everyone."]] },
      { stage: "{a} steps in between {b} and {c}.", turns: [['a', "Right. Enough. This isn't helping anyone."]] },
      { turns: [['a', "I'm with {b} on this one. Sorry, {c}. I am."]] },
    ],
    push: [
      { turns: [['c', "This has nothing to do with you."], ['a', "It does when you're shouting at my friend in front of everyone."]] },
      { turns: [['c', "Why is everyone taking {b}'s side?"], ['a', "Maybe because {b} is right. Have you thought about that?"]] },
      { turns: [['a', "Walk away, {c}. Just walk away for five minutes."], ['c', "Don't tell me what to do."], ['a', "Then tell yourself."]] },
      { turns: [['c', "Oh, here we go. The bodyguard's arrived."], ['a', "Somebody had to."]] },
      { turns: [['a', "{b}, come on. You don't need this."], ['b', "I'm fine."], ['a', "You're not. Come on."]] },
      { turns: [['c', "I'm entitled to say what I think."], ['a', "Not like that, you're not."]] },
    ],
    land: [
      { turns: [], beat: "The villa splits right down the middle, and everyone can see which side is which." },
      { turns: [], beat: "{c} stares at {a} for a long moment, then turns away." },
      { turns: [], beat: "{a} puts an arm round {b} and walks {b.obj} away from it." },
      { turns: [], beat: "Two more islanders get up off the daybeds. This isn't a fight between two people any more." },
      { turns: [], beat: "{c} is left standing on {c.posAdj} own, with half the villa looking at {c.obj}." },
    ],
  },
};

export const DEBRIEF_STAGES = [
  { when: LATER, stage: "{Where}, {a} and {b} sit down together after the ceremony." },
  { when: LATER, stage: "{Where}, {a} kicks off {a.posAdj} shoes and sits next to {b}." },
  { when: LATER, stage: "{Where}, {b} pulls {a} aside the second they're back from the fire pit." },
  { when: LATER, stage: "{Where}, {a} and {b} talk it all through, quietly, while the others get ready for bed." },
  { when: LATER, stage: "{Where}, {a} sits on the end of {b}'s bed, still in {a.posAdj} outfit." },
  { when: LATER, stage: "{Where}, {a} and {b} share the last bit of a drink and go over the night." },
];

export const VENT_STAGES = [
  { stage: "{a} takes {b} up to the roof terrace, away from everyone." },
  { stage: "{a} and {b} sit at the far end of the garden." },
  { stage: "{a} finds {b} in the dressing room and shuts the door." },
  { stage: "{a} and {b} sit on the swing seat, {a} talking quietly." },
  { stage: "{a} and {b} lie by the pool, {a} doing most of the talking." },
];

export const ADVICE_STAGES = [
  { stage: "{a} and {b} sit on the swing seat, away from the others." },
  { stage: "{a} finds {b} by the pool and sits down next to {b.obj}." },
  { stage: "{a} and {b} talk quietly at the end of the kitchen counter." },
  { stage: "{a} and {b} sit together on the roof terrace." },
];
