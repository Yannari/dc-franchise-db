// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-rel.js — the reasons that are about somebody else
// ══════════════════════════════════════════════════════════════════════
// alliances.js relationalTargetMod / relationalReason, said by director.js planTalk:
//   isolate  {target} is {keep}'s ride-or-die, and {keep} is with us: cut {target}, and {keep} has
//            nobody left but us
//   pledge   {target} said out loud they'd never write {protects}'s name: {target} is {protects}'s
//            shield, so {target} goes first
// vp2.<case> is the whole plan scene (a runs it, b, c with a); vp.case / vp.solo.case the beats;
// booth2.lead / booth2.with the ballot. Ids: 'nrl.'.

export default {
  'vp2.isolate': [
    { id: 'nrl.i1', turns: [
      { beat: "{a} waits until {keep} has gone down to the water before sitting down with {b}." },
      { by: 'a', say: "I want to talk about {target}, and I don't want {keep} to hear it." },
      { by: 'b', say: "{target}? {keep} would lose it." },
      { by: 'a', say: "{keep} would be upset, sure. And then {keep} would look around and realise the only people left are us." },
      { by: 'b', say: "That's cold." },
      { by: 'a', say: "It's smart. As long as {target} is here, {keep} has somebody to run to. Take that away, and {keep} is ours." },
      { by: 'b', say: "And if {keep} figures out it was us?" },
      { by: 'a', say: "Then we're the ones holding {keep}'s hand when it happens. That's the whole trick." },
      { by: 'b', conf: "{a} doesn't want to get rid of {keep}. {a} wants {keep} to need us. That's honestly scarier." },
    ] },
    { id: 'nrl.i2', when: { voice: ['warm', 'earnest', 'anxious'] }, turns: [
      { by: 'b', say: "Why {target}? {target} hasn't done anything to us." },
      { by: 'a', say: "I know. I actually like {target}." },
      { by: 'b', say: "Then why?" },
      { by: 'a', say: "Because {keep} and {target} are a pair, and pairs make it to the end. I'd rather {keep} make it to the end with us." },
      { by: 'b', say: "{keep} is going to be heartbroken." },
      { by: 'a', say: "I know. I'll be there for {keep}. I mean that." },
      { by: 'a', conf: "It feels terrible to break up the best friendship in this camp. It would feel worse to lose to it." },
    ] },
    { id: 'nrl.i3', when: { third: true }, turns: [
      { beat: "{a}, {b} and {c} sit in a tight huddle behind the {quarters}." },
      { by: 'a', say: "Okay. {target} tonight." },
      { by: 'c', say: "Not {keep}?" },
      { by: 'a', say: "No, {keep} stays. We need {keep}. We just need {keep} without {target} in {keep.posAdj} ear." },
      { by: 'b', say: "So we're breaking them up." },
      { by: 'a', say: "We're giving {keep} new best friends. Us." },
      { by: 'c', say: "That's either genius or evil." },
      { by: 'a', say: "Why can't it be both?" },
      { by: 'c', conf: "Tonight isn't about who's the biggest threat. It's about making sure {keep} has nobody to turn to but us." },
    ] },
  ],
  'vp2.pledge': [
    { id: 'nrl.p1', turns: [
      { by: 'a', say: "Did you hear what {target} said the other day? That {target} would never write {protects}'s name, no matter what?" },
      { by: 'b', say: "I heard." },
      { by: 'a', say: "Then {target} just told us exactly who's standing between us and {protects}." },
      { by: 'b', say: "So we go through {target}." },
      { by: 'a', say: "We go through {target} first. Then {protects} doesn't have a shield anymore." },
      { by: 'b', say: "{target} is going to feel so stupid for saying it out loud." },
      { by: 'a', conf: "Loyalty is a great quality. Announcing it to the whole camp is a terrible strategy." },
    ] },
    { id: 'nrl.p2', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [
      { by: 'a', say: "People should be more careful about what promises they make in public." },
      { by: 'b', say: "This is about {target}." },
      { by: 'a', say: "{target} promised {protects} a vote, out loud, in front of me. That's not a vote anymore, that's a wall." },
      { by: 'b', say: "And walls come down." },
      { by: 'a', say: "Tonight, this one does." },
      { by: 'b', conf: "{target} thought standing by {protects} would make {target} look good. It just made {target} the first name." },
    ] },
  ],
  'vp.case.isolate': [
    { id: 'nrl.c1', turns: [{ by: 'a', say: "It's {target}. {keep} and {target} are glued together, and I want {keep} on our side without {target} in the way." }] },
  ],
  'vp.case.pledge': [
    { id: 'nrl.c2', turns: [{ by: 'a', say: "It's {target}. {target} said out loud they'd never vote {protects}, so {target} is the shield, and the shield goes first." }] },
  ],
  'vp.solo.case.isolate': [
    { id: 'nrl.s1', turns: [{ by: 'a', conf: "If {target} goes tonight, {keep} has nobody left in this game but me. That's not cruel. That's just good planning." }] },
  ],
  'vp.solo.case.pledge': [
    { id: 'nrl.s2', turns: [{ by: 'a', conf: "{target} told everybody that {protects} is untouchable as long as {target} is here. Fine. Then {target} won't be here." }] },
  ],
  'booth2.lead.isolate': [
    { id: 'nrl.b1', turns: [{ by: 'a', conf: "{target}, I'm sorry. This isn't about you, it's about {keep} needing me more than {keep} needs you." }] },
    { id: 'nrl.b2', when: { voice: ['schemer', 'cruel', 'calm'] }, turns: [{ by: 'a', conf: "Cut the friend, keep the player. {target}." }] },
  ],
  'booth2.lead.pledge': [
    { id: 'nrl.b3', turns: [{ by: 'a', conf: "You said you'd never vote {protects}, {target}. That's very sweet, and it's exactly why it's you." }] },
  ],
  'booth2.with.isolate': [
    { id: 'nrl.b4', turns: [{ by: 'a', conf: "{leader} wants {keep} with us and {target} out of the picture. I get it. I don't love it. {target}." }] },
  ],
  'booth2.with.pledge': [
    { id: 'nrl.b5', turns: [{ by: 'a', conf: "{target} made a promise in front of everybody, and {leader} says that's what puts {target} on top. So it's {target}." }] },
  ],
};
