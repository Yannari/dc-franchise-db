// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/dq.js — the night a fight got physical, and TJ's hearing
// ══════════════════════════════════════════════════════════════════════
//
// party.js dqDebate and exits.js disqualify. The user, 2026-10-17: "the disqualification is rather short; a debate,
// some drama before TJ decides: grudges, witnesses, people trying to calm the group, people shouting, or calmer
// sometimes". Nobody but a and b is certain to be there, so every other part is optional and nobody's line needs
// somebody who might be missing.
//   dq-debate.heated / .calm   a hit b. c is a's friend defending a, d is b's friend who saw it, x is calming it down.
//   disqualified.hearing       the next morning: TJ hears from c, a witness, then sends b home (a is the one hit).
export default {
  'dq-debate.heated': [
    { id: 'dqd.h1', turns: [
      { beat: 'The front door bangs open. {a} and {b} are still shouting as the rest of the house comes in from the cars.' },
      { by: 'b', say: "You put your hands on me! Everybody saw it!" },
      { by: 'a', say: "You pushed me to it. You've been pushing me all night." },
      { by: 'c', opt: 1, say: "{b} was in {a}'s face the whole night. Don't act like that didn't happen." },
      { by: 'd', opt: 1, say: "I was standing right there. {a} grabbed {b} first. I'm not going to pretend I didn't see it." },
      { by: 'x', opt: 1, say: "Everybody stop! Shouting about it at two in the morning isn't going to change what happened." },
      { by: 'b', say: "TJ is going to hear about this." },
      { by: 'a', say: "Then let TJ hear all of it, not just your side." },
      { by: 'a', conf: "Everybody in this house has already decided what happened. Nobody wants to hear why." },
    ] },
    { id: 'dqd.h2', turns: [
      { beat: 'In the kitchen, half the house is talking at once.' },
      { by: 'd', opt: 1, say: "I saw it. I'm not going to lie for anybody." },
      { by: 'a', say: "Nobody's asking anybody to lie. Just say the whole thing." },
      { by: 'b', say: "The whole thing is you lost it." },
      { by: 'x', opt: 1, say: "Can we all take a breath before somebody says something they can't take back?" },
      { by: 'a', say: "It's a bit late for that." },
      { by: 'c', opt: 1, say: "{a} isn't like this. Every one of you knows {a} isn't like this." },
      { by: 'b', conf: "I'm still shaking. I don't know if it's anger, or if it's because nobody has ever done that to me before." },
    ] },
    { id: 'dqd.h3', turns: [
      { by: 'b', say: "You're done. You know that, right?" },
      { by: 'a', say: "Say that again." },
      { beat: 'Somebody steps in between them before either of them can move.' },
      { by: 'b', say: "I'm not scared of you." },
      { by: 'a', say: "You should have thought about that before you started it." },
      { by: 'x', opt: 1, say: "Both of you, go to bed. Please." },
      { by: 'a', conf: "I know the rule. I know what TJ is going to do. I still think {b} started it, and I'll still think that on the plane." },
    ] },
  ],
  'dq-debate.calm': [
    { id: 'dqd.c1', turns: [
      { beat: 'Back at the villa, nobody turns the music on. The house sits around the kitchen table.' },
      { by: 'x', opt: 1, say: "Is everybody okay?" },
      { by: 'b', say: "I'm fine. I just want to sleep." },
      { by: 'a', say: "{b}, I'm sorry. I mean it. That wasn't me." },
      { by: 'b', say: "It was you, though. That's the problem." },
      { by: 'd', opt: 1, say: "TJ is going to find out. You both know that." },
      { by: 'c', opt: 1, say: "Let's not decide anything tonight. Everybody's had too much to drink." },
      { by: 'a', conf: "It's very quiet in here. That's worse than the shouting. Everybody is already looking at me like I'm gone." },
    ] },
    { id: 'dqd.c2', turns: [
      { beat: '{a} sits alone on the stairs. {b} has gone straight to bed.' },
      { by: 'x', opt: 1, say: "Do you want to talk about it?" },
      { by: 'a', say: "What is there to say? Everybody saw it." },
      { by: 'c', opt: 1, say: "I'll tell TJ that {b} was in your face all night. Because that's the truth." },
      { by: 'a', opt: 'c', say: "Thanks. I don't think it's going to matter." },
      { by: 'a', conf: "I worked so hard to get here, and I think I just ended it in about five seconds." },
      { by: 'b', conf: "I don't want anybody sent home. I also don't want to pretend it didn't happen." },
    ] },
  ],
  // nobody came to say goodbye (party.js expelledGoodbye found no friend): a packs alone
  'expelled-goodbye.alone': [
    { id: 'xga.1', turns: [
      { beat: '{a} packs in an empty bedroom. Nobody comes upstairs.' },
      { by: 'a', conf: "I thought somebody would at least come and say goodbye. Nobody did. I guess that tells me what this house thought of me." },
      { beat: '{a} zips the bag and carries it down the stairs alone.' },
      { by: 'a', conf: "I'm not proud of last night. I'm also not going to cry in front of people who were happy to watch me go." },
    ] },
    { id: 'xga.2', turns: [
      { beat: 'The car is outside. {a} walks through the common room, and nobody looks up.' },
      { by: 'a', conf: "One moment. That's all it took, and now I'm leaving a house full of people who won't even look at me." },
      { by: 'a', conf: "Whatever they're saying about me after I go, I hope they say I was a competitor. Because I was." },
    ] },
  ],
  'disqualified.hearing': [
    { id: 'dqh.1', turns: [
      { beat: 'TJ is waiting in the common room the next morning. Nobody sits down until he tells them to.' },
      { by: 'tj', say: "Before I say anything, I want to hear it from somebody who was there. {c}?" },
      { by: 'c', say: "{b} grabbed {a}. Hard. I saw the whole thing." },
      { by: 'b', say: "{a} was in my face all night. Nobody is saying that part." },
      { by: 'tj', say: "I heard that part too. Being in somebody's face is not putting your hands on them." },
      { by: 'tj', say: "{b}, you're disqualified. Pack your bags." },
      { by: 'a', conf: "I didn't want it to end like this for anybody. But {c} told the truth, and TJ listened." },
    ] },
    { id: 'dqh.2', turns: [
      { by: 'tj', say: "I have talked to everybody who was at that club last night. Every single one of you." },
      { by: 'tj', say: "{c}, tell the house what you told me." },
      { by: 'c', say: "I saw {b} put hands on {a}. I'm not happy about saying it." },
      { by: 'b', say: "So that's it? One person's word?" },
      { by: 'tj', say: "We have the footage, we have {c}, and we have the rules. You're going home, {b}." },
      { by: 'b', say: "This is a joke." },
      { by: 'tj', say: "There's nothing funny about it. Say your goodbyes." },
      { by: 'c', conf: "{b} is never going to forgive me for saying it out loud. I'd still say it again." },
    ] },
  ],
};
