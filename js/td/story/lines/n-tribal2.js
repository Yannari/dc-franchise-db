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
      { by: 'b', say: "I'm sorry. It wasn't personal, I swear.", v: {warm: "I'm so sorry. I hated doing it, I really did.",cruel: "Don't look at me like that. You'd have done the same thing.",quiet: "...I'm sorry.",anxious: "I'm sorry, I'm so sorry, I didn't know what else to do."} },
      { by: 'a', say: "Unbelievable. After everything.", v: {loud: "After EVERYTHING? Are you kidding me?",calm: "Okay. I'll remember that.",tough: "You'd better hope I never get the chance to pay you back.",emotional: "I trusted you. I actually trusted you."} },
      { by: 'c', say: "Oh no. Oh no, this is bad.", v: {dry: "Well, that's going to make the walk back awkward.",anxious: "Wait, then who's next? Is it me?"}, opt: true },
    ] },
    { id: 'nn.r2', turns: [
      { beat: "The name is read. {a} turns slowly to look at {b}." },
      { by: 'a', move: 'shocked' },
      { by: 'b', say: "It was a game move." },
      { by: 'a', say: "Don't call it a game move. You looked me in the eye this morning.", v: {tough: "A game move. Sure. Remember that when it's your turn.",warm: "I know it's a game. It still hurts, okay?"} },
      { by: 'a', move: 'shot' },
    ] },
    { id: 'nn.r3', turns: [
      { by: 'a', move: 'shocked' },
      { by: 'c', say: "I really thought I'd make it further than this.", v: {tough: "Whatever. It's fine. I'm fine.",emotional: "I don't want to go. I really don't want to go.",dry: "Well. That's that, then.",teen: "This is so unfair. I was having so much fun."}, opt: true },
      { by: 'a', say: "Who? Who did this?" },
      { beat: "Nobody answers. {b} is staring at the ground." },
      { by: 'a', say: "{b}. Look at me." },
      { by: 'b', say: "I don't know what you want me to say.", v: {schemer: "Nobody here owes you an explanation.",anxious: "I... I can't do this right now, I'm sorry."} },
    ] },
  ],
  'reveal.expected': [
    { id: 'nn.e1', turns: [
      { by: 'a', say: "Yeah. I kind of saw it coming.", v: {calm: "That's fair. I'd probably have done the same.",loud: "Yeah, yeah, okay, I get it!",dry: "Can't say I'm shocked."} },
      { by: 'b', say: "I'm sorry. It wasn't personal, I swear.", v: {warm: "I'm so sorry. I hated doing it, I really did.",cruel: "Don't look at me like that. You'd have done the same thing.",quiet: "...I'm sorry.",anxious: "I'm sorry, I'm so sorry, I didn't know what else to do."} },
      { by: 'a', say: "It's fine. It's the game.", v: {cruel: "Whatever. Go.",warm: "It's okay. Really. I'm not angry."} },
    ] },
    { id: 'nn.e2', turns: [
      { beat: "{a} hears the name and nods. {a} was expecting it." },
      { by: 'a', say: "Yeah. I figured." },
      { by: 'b', say: "You played a really good game, you know that?", v: {warm: "You were the best part of this for me. I mean it.",tough: "Keep your head up. You went down swinging."} },
      { by: 'a', move: 'parting' },
    ] },
    { id: 'nn.e3', turns: [
      { by: 'a', say: "I really thought I'd make it further than this.", v: {tough: "Whatever. It's fine. I'm fine.",emotional: "I don't want to go. I really don't want to go.",dry: "Well. That's that, then.",teen: "This is so unfair. I was having so much fun."} },
      { by: 'c', say: "I'm sorry. It wasn't personal, I swear.", v: {warm: "I'm so sorry. I hated doing it, I really did.",cruel: "Don't look at me like that. You'd have done the same thing.",quiet: "...I'm sorry.",anxious: "I'm sorry, I'm so sorry, I didn't know what else to do."}, opt: true },
      { by: 'b', say: "You played a good game." },
      { by: 'a', say: "Thank you. I needed to hear that from you.", v: {tough: "Thanks. Don't make it weird.",emotional: "Thank you. I'm going to cry. I'm already crying."} },
    ] },
  ],
  'exit.friend': [
    { id: 'nn.f1', turns: [
      { beat: "{a} stops at {b} on the way out." },
      { by: 'b', say: "I really thought I'd make it further than this.", v: {tough: "Whatever. It's fine. I'm fine.",emotional: "I don't want to go. I really don't want to go.",dry: "Well. That's that, then.",teen: "This is so unfair. I was having so much fun."} },
      { by: 'a', move: 'goodbye' },
      { by: 'b', say: "I will. I promise." },
      { by: 'a', move: 'parting', asConf: true },
    ] },
    { id: 'nn.f2', turns: [
      { by: 'a', say: "Come here." },
      { beat: "{a} and {b} hug for a long time." },
      { by: 'a', move: 'goodbye' },
      { by: 'b', say: "You played a really good game, you know that?", v: {warm: "You were the best part of this for me. I mean it.",tough: "Keep your head up. You went down swinging."} },
    ] },
    { id: 'nn.f3', when: { bVoted: 'boot' }, turns: [
      { by: 'b', say: "{a}, wait. I'm sorry." },
      { by: 'a', say: "You voted for me." },
      { by: 'b', say: "I'm sorry. It wasn't personal, I swear.", v: {warm: "I'm so sorry. I hated doing it, I really did.",cruel: "Don't look at me like that. You'd have done the same thing.",quiet: "...I'm sorry.",anxious: "I'm sorry, I'm so sorry, I didn't know what else to do."} },
      { by: 'a', move: 'shot' },
      { beat: "{a} walks off. {b} doesn't follow." },
    ] },
    { id: 'nn.f4', when: { bVoted: 'other' }, turns: [
      { by: 'b', say: "I didn't write your name. I need you to know that." },
      { by: 'a', say: "I know you didn't." },
      { by: 'a', move: 'goodbye' },
      { by: 'b', say: "I'll miss you too. A lot.", v: {tough: "Yeah. Me too. Go on, before I say something soft.",dry: "I'll miss you too. Mostly."} },
      { by: 'a', move: 'parting', asConf: true },
    ] },
  ],
  'exit.shot': [
    { id: 'nn.s1', turns: [
      { beat: "{a} turns around on the way out and finds {b}." },
      { by: 'a', move: 'shot' },
      { by: 'b', say: "It's fine. It's the game.", v: {cruel: "Whatever. Go.",warm: "It's okay. Really. I'm not angry."} },
    ] },
    { id: 'nn.s2', turns: [
      { by: 'a', say: "Oh, and {b}?" },
      { by: 'a', move: 'shot' },
      { by: 'b', say: "Don't call it a game move. You looked me in the eye this morning.", v: {tough: "A game move. Sure. Remember that when it's your turn.",warm: "I know it's a game. It still hurts, okay?"} },
      { by: 'a', move: 'parting', asConf: true },
    ] },
  ],
  'exit.alone': [
    { id: 'nn.a1', turns: [
      { by: 'a', move: 'parting', asConf: true },
      { by: 'a', conf: "I really thought I'd make it further than this.", v: {tough: "Whatever. It's fine. I'm fine.",emotional: "I don't want to go. I really don't want to go.",dry: "Well. That's that, then.",teen: "This is so unfair. I was having so much fun."} },
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
    { id: 'nn.u1', turns: [{ by: 'a', conf: "I wrote {lastBoot}'s name tonight." }, { by: 'a', conf: "I really thought I'd make it further than this.", v: {tough: "Whatever. It's fine. I'm fine.",emotional: "I don't want to go. I really don't want to go.",dry: "Well. That's that, then.",teen: "This is so unfair. I was having so much fun."} }] },
  ],
};
