// ══════════════════════════════════════════════════════════════════════
// td/script/lines/blind.js — trusting the wrong person (bonds.js perceived bonds)
// ══════════════════════════════════════════════════════════════════════
//
//   blind.ally.any       a's alliance has quietly turned on a, and a has no idea. Alone.
//   blind.denial.any     b voted against a, a's ally; a still treats b as an ally
//   blind.showmance.any  a thinks a and b, a couple, go to the end together; b is playing
//                        a game a doesn't know about
//
// The viewer knows; {a} does not. A line {a} says never knows it (a believes the old story);
// only {b}'s confessional, or a stage direction, tells the truth.
//
// Ids: 'bl.'.

const ALLY = [
  { id: 'bl.a1', turns: [
    { beat: '{a} sits with the alliance at dinner, laughing at the same jokes as always.' },
    { by: 'a', conf: "I've got my people. For the first time in this game, I can actually relax." },
  ] },
  { id: 'bl.a2', turns: [
    { by: 'a', conf: "I checked in with everybody this morning. Same answers as always. We're solid." },
    { beat: 'Behind {a}, two of the alliance trade a look.' },
  ] },
  { id: 'bl.a3', turns: [
    { by: 'a', conf: "Honestly, I'm sleeping better than I have all game. Nobody's coming for me. Why would they?" },
  ] },
  { id: 'bl.a4', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I love my alliance. Like, actually love them. We're going to do this together." },
  ] },
  { id: 'bl.a5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I know where every vote is going. I always know. That's my whole game." },
    { beat: 'The plan being made right now does not include {a}.' },
  ] },
  { id: 'bl.a6', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Anybody who wants to come at me has to go through my alliance first. Good luck with that." },
  ] },
  { id: 'bl.a7', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "For once I'm on the inside. It feels really nice. I hope it lasts." },
  ] },
  { id: 'bl.a8', turns: [
    { beat: '{a} heads to bed early.' },
    { by: 'a', conf: "Not worried. Not even a little. I'll see everybody in the morning." },
  ] },
];

const DENIAL = [
  { id: 'bl.d1', turns: [
    { beat: '{a} sits down next to {b} at the fire, same as always.' },
    { by: 'a', say: "Crazy vote, huh? Somebody's playing both sides." },
    { by: 'b', say: "Yeah. Crazy." },
    { by: 'b', conf: "{a} still thinks it wasn't me. I'm not going to be the one to fix that." },
  ] },
  { id: 'bl.d2', turns: [
    { by: 'a', say: "People keep telling me you voted for me." },
    { by: 'b', say: "And you believe them?" },
    { by: 'a', say: "No. Of course not. You'd never." },
    { by: 'b', conf: "I did." },
  ] },
  { id: 'bl.d3', turns: [
    { by: 'a', conf: "Maybe {b} had no choice. Maybe it wasn't even {b}. There's an explanation. There has to be." },
    { beat: 'Across camp, {b} won\'t meet {a}\'s eyes.' },
  ] },
  { id: 'bl.d4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I saved you some breakfast." },
    { by: 'b', say: "...Thanks, {a}." },
    { by: 'b', conf: "I wrote {a.posAdj} name down. And {a} saved me breakfast. I feel like garbage." },
  ] },
  { id: 'bl.d5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "If I find out who voted for me, they're done." },
    { by: 'b', say: "Totally. Done." },
    { by: 'b', conf: "So, that's going to be a problem one day." },
  ] },
  { id: 'bl.d6', turns: [
    { by: 'a', say: "We're still good, right? You and me?" },
    { by: 'b', say: "Always." },
    { by: 'b', conf: "It's easier to say yes than explain. For now." },
  ] },
  { id: 'bl.d7', when: { registerB: 'schemer' }, turns: [
    { by: 'a', say: "You're the one person here I don't have to worry about." },
    { by: 'b', say: "That's sweet." },
    { by: 'b', conf: "Never tell anybody that out here. Especially not me." },
  ] },
];

const SHOWMANCE = [
  { id: 'bl.s1', turns: [
    { by: 'a', say: "Final two. You and me. Then we split it and go on a really long vacation." },
    { by: 'b', say: "Sounds perfect." },
    { by: 'b', conf: "I like {a}. I do. I also like winning." },
  ] },
  { id: 'bl.s2', turns: [
    { beat: '{a} has {a.posAdj} head on {b}\'s shoulder.' },
    { by: 'a', say: "Where'd you go this afternoon?" },
    { by: 'b', say: "Just walking." },
    { by: 'b', conf: "I was making a deal that doesn't include {a}. That's... a long walk, I guess." },
  ] },
  { id: 'bl.s3', turns: [
    { by: 'a', conf: "{b} and I are going to the end together. Everybody knows it. I don't even have to think about it." },
    { by: 'b', conf: "{a} doesn't think about it. I think about it all the time." },
  ] },
  { id: 'bl.s4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I carved our initials into the log. Look." },
    { by: 'b', say: "Aw. That's cute." },
    { by: 'b', conf: "Initials don't vote. Just saying." },
  ] },
  { id: 'bl.s5', turns: [
    { by: 'a', say: "Promise me you'd tell me if you were ever worried about us." },
    { by: 'b', say: "I promise." },
    { by: 'b', conf: "I'm not worried about us. I'm worried about me." },
  ] },
  { id: 'bl.s6', when: { registerB: 'schemer' }, turns: [
    { by: 'a', say: "I trust you more than anybody out here." },
    { by: 'b', say: "I know." },
    { by: 'b', conf: "That's exactly why this works." },
  ] },
  { id: 'bl.s7', turns: [
    { by: 'b', say: "Do you ever think about what happens if it's just us two and one has to go?" },
    { by: 'a', say: "Never. It won't come to that." },
    { by: 'b', conf: "It always comes to that." },
  ] },
];

export default { 'blind.ally.any': ALLY, 'blind.denial.any': DENIAL, 'blind.showmance.any': SHOWMANCE };
