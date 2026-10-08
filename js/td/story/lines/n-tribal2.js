// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-tribal2.js — the reading and last words, in the speaker's own voice
// ══════════════════════════════════════════════════════════════════════
//
// The user: last words in their own voice too. The same keys and parts as n-tribal.js
// (td/story/tribal.js): reveal.<blindside|expected> (a = the one going home, b = the closest
// voter / closest person, c = another), exit.<friend|shot|alone> (b = their person / the one
// they blame), after.<architect|friend|guilty> (a, to camera). Lines for a and b are moves
// (td/story/phrase.js): the shock, the goodbye, the parting shot and the last word come out in
// each person's own voice and age. asConf: a move said to the camera. Ids: 'nn.'.

export default {
  'reveal.blindside': [
    { id: 'nn.r1', turns: [
      { by: 'a', move: 'shocked' },
      { by: 'a', say: "{b}? Did you write my name?" },
      { by: 'b', move: 'apologize' },
      { by: 'a', move: 'angry' },
      { by: 'c', move: 'worry', opt: true },
    ] },
    { id: 'nn.r2', turns: [
      { beat: "The name is read. {a} turns slowly to look at {b}." },
      { by: 'a', move: 'shocked' },
      { by: 'b', say: "It was a game move." },
      { by: 'a', move: 'pushback' },
      { by: 'a', move: 'shot' },
    ] },
    { id: 'nn.r3', turns: [
      { by: 'a', move: 'shocked' },
      { by: 'c', move: 'sad', opt: true },
      { by: 'a', say: "Who? Who did this?" },
      { beat: "Nobody answers. {b} is staring at the ground." },
      { by: 'a', say: "{b}. Look at me." },
      { by: 'b', move: 'deflect' },
    ] },
  ],
  'reveal.expected': [
    { id: 'nn.e1', turns: [
      { by: 'a', move: 'agree.reluctant' },
      { by: 'b', move: 'apologize' },
      { by: 'a', move: 'dismiss' },
    ] },
    { id: 'nn.e2', turns: [
      { beat: "{a} hears the name and nods. {a} was expecting it." },
      { by: 'a', say: "Yeah. I figured." },
      { by: 'b', move: 'reassure' },
      { by: 'a', move: 'parting' },
    ] },
    { id: 'nn.e3', turns: [
      { by: 'a', move: 'sad' },
      { by: 'c', move: 'apologize', opt: true },
      { by: 'b', say: "You played a good game." },
      { by: 'a', move: 'thanks' },
    ] },
  ],
  'exit.friend': [
    { id: 'nn.f1', turns: [
      { beat: "{a} stops at {b} on the way out." },
      { by: 'b', move: 'sad' },
      { by: 'a', move: 'goodbye' },
      { by: 'b', say: "I will. I promise." },
      { by: 'a', move: 'parting', asConf: true },
    ] },
    { id: 'nn.f2', turns: [
      { by: 'a', say: "Come here." },
      { beat: "{a} and {b} hug for a long time." },
      { by: 'a', move: 'goodbye' },
      { by: 'b', move: 'reassure' },
    ] },
    { id: 'nn.f3', when: { bVoted: 'boot' }, turns: [
      { by: 'b', say: "{a}, wait. I'm sorry." },
      { by: 'a', say: "You voted for me." },
      { by: 'b', move: 'apologize' },
      { by: 'a', move: 'shot' },
      { beat: "{a} walks off. {b} doesn't follow." },
    ] },
    { id: 'nn.f4', when: { bVoted: 'other' }, turns: [
      { by: 'b', say: "I didn't write your name. I need you to know that." },
      { by: 'a', say: "I know you didn't." },
      { by: 'a', move: 'goodbye' },
      { by: 'b', move: 'agree' },
      { by: 'a', move: 'parting', asConf: true },
    ] },
  ],
  'exit.shot': [
    { id: 'nn.s1', turns: [
      { beat: "{a} turns around on the way out and finds {b}." },
      { by: 'a', move: 'shot' },
      { by: 'b', move: 'dismiss' },
    ] },
    { id: 'nn.s2', turns: [
      { by: 'a', say: "Oh, and {b}?" },
      { by: 'a', move: 'shot' },
      { by: 'b', move: 'pushback' },
      { by: 'a', move: 'parting', asConf: true },
    ] },
  ],
  'exit.alone': [
    { id: 'nn.a1', turns: [
      { by: 'a', move: 'parting', asConf: true },
      { by: 'a', move: 'sad', asConf: true },
    ] },
    { id: 'nn.a2', turns: [
      { beat: "{a} walks away with the bag over one shoulder and doesn't look back." },
      { by: 'a', move: 'parting', asConf: true },
    ] },
  ],
  'after.architect': [
    { id: 'nn.g1', turns: [{ by: 'a', move: 'gloat', asConf: true }] },
    { id: 'nn.g2', turns: [{ by: 'a', conf: "{lastBoot} never saw it coming." }, { by: 'a', move: 'gloat', asConf: true }] },
  ],
  'after.friend': [
    { id: 'nn.m1', turns: [{ by: 'a', move: 'mourn', asConf: true }] },
    { id: 'nn.m2', turns: [{ by: 'a', conf: "{lastBoot} is gone." }, { by: 'a', move: 'mourn', asConf: true }] },
  ],
  'after.guilty': [
    { id: 'nn.u1', turns: [{ by: 'a', conf: "I wrote {lastBoot}'s name tonight." }, { by: 'a', move: 'sad', asConf: true }] },
  ],
};
