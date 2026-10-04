// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/intact.js — the Interrogation and the Deepfake (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// A secret power takes the Head of Household's week (written by
// bb/script/ceremony.js). The Interrogation: the deposed HOH (b) questions
// each houseguest (a) one at a time, then names who they think took it. The
// Deepfake: nobody is told anything, so only the taker speaks, and only in
// the Diary Room. {who} is the name an answer points at.
//
//   intact.dethroned  a has just lost HOH and will question the house    scene
//   intact.room       a answers b's questions                            tells | covers | reads | guesses | silent | denies | deniesplain
//   intact.name       a, the deposed HOH, gives one name                  named | none
//   intact.caught     a took it and b named a                            scene
//   intact.wrong      a was named by b and did not do it                 named | none
//   intact.deepfake   a took b's HOH and the wall will use b's voice     scene
//   intact.ally       a spent the power to protect b                     scene

export default {
  'intact.dethroned.scene': [
    { id: 'it7.d1', turns: [{ by: 'a', say: "Someone in this house took my Head of Household. I'm going to find out who." }] },
    { id: 'it7.d2', turns: [{ by: 'a', dr: "One minute I'm HOH. The next, somebody's taken it off me. I want a name." }] },
    { id: 'it7.d3', turns: [{ by: 'a', say: "I'm talking to every single one of you. One at a time." }] },
    { id: 'it7.d4', turns: [{ by: 'a', dr: "If I get the right name, I get my week back. So I'm getting the right name." }] },
  ],
  'intact.room.tells': [
    { id: 'it7.t1', turns: [{ by: 'b', say: "Who took it?" }, { by: 'a', say: "{who}. I'm sure." }] },
    { id: 'it7.t2', turns: [{ by: 'b', say: "Do you know anything?" }, { by: 'a', say: "I know it was {who}. I'm not protecting anyone." }] },
    { id: 'it7.t3', turns: [{ by: 'a', say: "It was {who}." }, { by: 'a', dr: "{who} is going to hate me for that. I don't care." }] },
    { id: 'it7.t4', turns: [{ by: 'b', say: "Be honest with me." }, { by: 'a', say: "Honestly? {who}. No question." }] },
  ],
  'intact.room.covers': [
    { id: 'it7.c1', turns: [{ by: 'b', say: "Who took it?" }, { by: 'a', say: "If I had to guess? {who}." }, { by: 'a', dr: "I know exactly who it was. And it wasn't {who}." }] },
    { id: 'it7.c2', turns: [{ by: 'a', say: "Look at {who}. That's all I'm saying." }, { by: 'a', dr: "I just lied for a friend. I hope it's worth it." }] },
    { id: 'it7.c3', turns: [{ by: 'b', say: "Do you know anything?" }, { by: 'a', say: "No idea. Maybe {who}?" }, { by: 'a', dr: "I know. I'm not telling." }] },
    { id: 'it7.c4', turns: [{ by: 'a', say: "My money's on {who}." }, { by: 'a', dr: "That's the first time I've lied straight to someone's face in here." }] },
  ],
  'intact.room.reads': [
    { id: 'it7.r1', turns: [{ by: 'b', say: "Who do you think?" }, { by: 'a', say: "{who}. Just watch how {who} has been acting since the competition." }] },
    { id: 'it7.r2', turns: [{ by: 'a', say: "I don't know anything. But my gut says {who}." }] },
    { id: 'it7.r3', turns: [{ by: 'b', say: "Any idea?" }, { by: 'a', say: "Who's the most relaxed person in the house right now? {who}." }] },
    { id: 'it7.r4', turns: [{ by: 'a', say: "I've got nothing solid. If it were me, I'd look at {who}." }] },
  ],
  'intact.room.guesses': [
    { id: 'it7.g1', turns: [{ by: 'b', say: "Who took it?" }, { by: 'a', say: "{who}. Has to be." }] },
    { id: 'it7.g2', turns: [{ by: 'a', say: "It's {who}. I'd bet anything." }, { by: 'a', dr: "I have no idea if it's {who}. I just don't like {who}." }] },
    { id: 'it7.g3', turns: [{ by: 'b', say: "Any idea?" }, { by: 'a', say: "{who}, probably." }] },
    { id: 'it7.g4', turns: [{ by: 'a', say: "Honestly? I think {who}." }] },
  ],
  'intact.room.silent': [
    { id: 'it7.s1', turns: [{ by: 'b', say: "Who took it?" }, { by: 'a', say: "I'm not giving you a name." }] },
    { id: 'it7.s2', turns: [{ by: 'a', say: "I don't know, and if I did, I wouldn't say." }, { by: 'b', say: "Great. Thanks." }] },
    { id: 'it7.s3', turns: [{ by: 'a', dr: "If I name someone and you get your HOH back, I'm the one going up. No thanks." }] },
    { id: 'it7.s4', turns: [{ by: 'b', say: "Anything at all?" }, { by: 'a', say: "Nothing. Sorry." }] },
  ],
  'intact.room.denies': [
    { id: 'it7.n1', turns: [{ by: 'b', say: "Was it you?" }, { by: 'a', say: "Me? No. Have you asked {who}?" }] },
    { id: 'it7.n2', turns: [{ by: 'a', say: "It wasn't me. If I were you, I'd look at {who}." }, { by: 'a', dr: "It was me." }] },
    { id: 'it7.n3', turns: [{ by: 'b', say: "Look me in the eye. Was it you?" }, { by: 'a', say: "No. It's {who}, if you want my opinion." }] },
  ],
  'intact.room.deniesplain': [
    { id: 'it7.p1', turns: [{ by: 'b', say: "Was it you?" }, { by: 'a', say: "No. Why would I do that to you?" }] },
    { id: 'it7.p2', turns: [{ by: 'a', say: "It wasn't me. I promise." }, { by: 'a', dr: "It was me." }] },
    { id: 'it7.p3', turns: [{ by: 'b', say: "Did you take it?" }, { by: 'a', say: "No." }, { by: 'a', dr: "Keep it short. Long answers sound like lies." }] },
  ],
  'intact.name.named': [
    { id: 'it7.m1', turns: [{ by: 'a', say: "I've talked to everyone. I think it was {who}." }] },
    { id: 'it7.m2', turns: [{ by: 'a', say: "My answer is {who}." }, { beat: 'Everyone turns to look at {who}.' }] },
    { id: 'it7.m3', turns: [{ by: 'a', say: "I'm going with {who}." }] },
  ],
  'intact.name.none': [
    { id: 'it7.z1', turns: [{ by: 'a', say: "I can't do it. I don't know." }] },
    { id: 'it7.z2', turns: [{ by: 'a', dr: "Everybody gave me a different name. I can't pick one." }] },
  ],
  'intact.caught.scene': [
    { id: 'it7.k1', turns: [{ by: 'b', say: "It was you." }, { by: 'a', say: "Yeah. It was me." }] },
    { id: 'it7.k2', turns: [{ by: 'a', dr: "Caught. The power's gone, and now everyone knows I'd do something like that." }] },
    { id: 'it7.k3', turns: [{ by: 'b', say: "I knew it." }, { by: 'a', say: "Congratulations. You've got your week back." }] },
    { id: 'it7.k4', turns: [{ by: 'a', say: "Fine. It was me." }, { beat: 'The room goes quiet.' }] },
  ],
  'intact.wrong.named': [
    { id: 'it7.w1', turns: [{ by: 'a', say: "It wasn't me! I didn't do anything!" }] },
    { id: 'it7.w2', turns: [{ by: 'a', dr: "I got named for something I didn't do, in front of the whole house. Great." }] },
    { id: 'it7.w3', turns: [{ by: 'a', say: "Me? Seriously?" }, { by: 'b', say: "I had to say someone." }] },
    { id: 'it7.w4', turns: [{ by: 'a', say: "You got it wrong. And now everyone's looking at me." }] },
  ],
  'intact.wrong.none': [
    { id: 'it7.x1', turns: [{ by: 'a', dr: "I didn't name anyone, so whoever did this is HOH now. And I'll never know who." }] },
  ],
  'intact.deepfake.scene': [
    { id: 'it7.f1', turns: [{ by: 'a', dr: "I'm Head of Household this week, and nobody knows. The wall is going to say it was {b}." }] },
    { id: 'it7.f2', turns: [{ by: 'a', dr: "{b} is going to get blamed for my nominations. I feel a bit bad. A bit." }] },
    { id: 'it7.f3', turns: [{ by: 'a', dr: "I'm picking the nominees, and {b} is taking the heat. Perfect." }] },
    { id: 'it7.f4', turns: [{ by: 'a', dr: "Nobody saw me take it. Nobody will ever know. That's the best part." }] },
  ],
  'intact.ally.scene': [
    { id: 'it7.a1', turns: [{ by: 'a', dr: "I didn't do this for me. {b} was going on the block, and I couldn't let that happen." }] },
    { id: 'it7.a2', turns: [{ by: 'a', dr: "{b} has no idea what I just did. I'd do it again." }] },
    { id: 'it7.a3', turns: [{ by: 'a', dr: "I spent my power to protect {b}. {b} will never know." }] },
  ],
};
