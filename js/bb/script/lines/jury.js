// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/jury.js — the weeks either side of the jury (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/jury-bubble.js. {left} is how many evictions until
// the jury opens, as a word; intent one | many says whether it is one.
//
//   jury.countdown   a counts the evictions left                       scene; intent one | many
//   jury.writeoff    a tells b that {target} is not making jury        scene
//   jury.face        a tells b to b's face (kitchen)                   scene
//   jury.nerves      a, in danger on the bubble                        quiet | bold
//   jury.payment     a offers b a jury seat for a vote (storage room)  scene
//   jury.bury        a and b want {target} out before {target} votes   scene
//   jury.crossed     the jury has opened; a has things to take back    scene

export default {
  'jury.countdown.scene': [
    { id: 'jc.1', when: { intent: 'many' }, turns: [{ by: 'a', say: "Only {left} more evictions until jury." }, { beat: 'Nobody at the table says anything.' }] },
    { id: 'jc.2', when: { intent: 'one' }, turns: [{ by: 'a', say: "One more eviction and everyone who leaves gets a vote." }, { beat: 'The table goes quiet.' }] },
    { id: 'jc.3', when: { intent: 'many' }, turns: [{ by: 'a', dr: "I've been counting. We're {left} evictions away from jury. I need to be one of the ones who makes it." }] },
    { id: 'jc.4', when: { intent: 'many' }, turns: [{ by: 'a', dr: "We're {left} evictions away from jury. Everyone at this table is doing the same maths." }] },
    { id: 'jc.5', when: { intent: 'one' }, turns: [{ by: 'a', dr: "One more eviction, and every person who leaves gets a vote. That changes everything." }] },
    { id: 'jc.6', turns: [{ by: 'a', dr: "Not long now until jury. Everyone can feel it." }] },
    { id: 'jc.7', turns: [{ by: 'a', dr: "I counted the chairs at dinner. Some of these people are going home with nothing. I don't want to be one of them." }] },
    { id: 'jc.8', turns: [{ by: 'a', dr: "Jury is close. People are being very nice to each other all of a sudden." }] },
  ],
  'jury.writeoff.scene': [
    { id: 'jw.1', turns: [{ by: 'a', say: "{target} isn't making jury." }, { by: 'b', say: "You sound very sure." }, { by: 'a', say: "I am." }] },
    { id: 'jw.2', turns: [{ by: 'a', say: "Don't get attached to {target}." }, { by: 'b', say: "...Why not?" }, { by: 'a', say: "You know why." }] },
    { id: 'jw.3', turns: [{ by: 'a', dr: "I've already worked out when {target} goes home. And how." }] },
    { id: 'jw.4', turns: [{ by: 'b', dr: "{a} has {target} going home before jury. {a} didn't even say 'if'." }] },
    { id: 'jw.5', turns: [{ by: 'a', say: "Here's who makes jury." }, { beat: '{a} lists the names. {target} is not on the list.' }, { by: 'b', say: "...Okay." }] },
    { id: 'jw.6', turns: [{ by: 'b', say: "Does {target} know?" }, { by: 'a', say: "Not yet." }] },
  ],
  'jury.face.scene': [
    { id: 'jf.1', turns: [{ by: 'a', say: "You know you're not making jury, right?" }, { beat: 'The kitchen goes silent.' }] },
    { id: 'jf.2', turns: [{ by: 'b', say: "Where do I stand with you?" }, { by: 'a', say: "Honestly? You're going home before jury." }, { by: 'b', say: "...Thanks for being honest." }] },
    { id: 'jf.3', turns: [{ by: 'a', say: "I'd start writing your goodbye message." }, { by: 'b', say: "Wow." }] },
    { id: 'jf.4', turns: [{ by: 'a', say: "Nobody in this house will even remember you were here." }, { by: 'b', say: "Say that again." }, { by: 'a', say: "You heard me." }] },
    { id: 'jf.5', turns: [{ by: 'b', dr: "{a} told me to my face I'm not making jury. Now I've got something to prove." }] },
    { id: 'jf.6', turns: [{ by: 'b', say: "I'm making jury. Just to spite you." }, { by: 'a', say: "We'll see." }] },
  ],
  'jury.nerves.quiet': [
    { id: 'jn.q1', turns: [{ by: 'a', dr: "I've stopped arguing with anyone. With jury this close, boring is safe." }] },
    { id: 'jn.q2', turns: [{ beat: '{a} does the dishes for the second time today.' }, { by: 'a', dr: "If I'm helpful, I'm harder to vote out." }] },
    { id: 'jn.q3', turns: [{ by: 'a', dr: "I'm agreeing with everyone right now. It's not a strategy. Okay, it's a strategy." }] },
    { id: 'jn.q4', turns: [{ by: 'a', dr: "I laughed at a joke that wasn't funny. That's how nervous I am. I'm going to bed." }] },
    { id: 'jn.q5', turns: [{ by: 'a', dr: "So close to jury. I just need to keep my head down a bit longer." }] },
    { id: 'jn.q6', turns: [{ by: 'a', dr: "Nobody nominates the person who keeps the kitchen clean. I hope." }] },
  ],
  'jury.nerves.bold': [
    { id: 'jn.b1', turns: [{ by: 'a', dr: "Sitting quietly is how people go home one week before jury. Not me." }] },
    { id: 'jn.b2', turns: [{ by: 'a', dr: "If I'm going out, I'm going out doing something. Not being polite." }] },
    { id: 'jn.b3', turns: [{ by: 'a', dr: "I'm not spending the next few weeks being someone's spare vote. I'm making a move." }] },
    { id: 'jn.b4', turns: [{ by: 'a', dr: "I've stopped asking people what they think. I'm telling them what's happening." }] },
    { id: 'jn.b5', turns: [{ by: 'a', dr: "This is either my best week in here or my last one. Either way, I'm going for it." }] },
    { id: 'jn.b6', turns: [{ by: 'a', dr: "Playing it safe is too risky now. Time to make some noise." }] },
  ],
  'jury.payment.scene': [
    { id: 'jp.1', turns: [{ by: 'a', say: "Vote how I need you to and you'll make jury. That's the deal." }, { by: 'b', say: "...Deal." }] },
    { id: 'jp.2', turns: [{ by: 'a', say: "You're not winning this. But I can still get you to jury." }, { by: 'b', say: "That's a horrible thing to say." }, { by: 'b', dr: "It's also true." }] },
    { id: 'jp.3', turns: [{ by: 'a', say: "A few more weeks. That's what I can give you." }, { by: 'b', say: "And what do you want?" }, { by: 'a', say: "One vote, when I ask for it." }] },
    { id: 'jp.4', turns: [{ by: 'b', dr: "{a} offered me a jury seat for my vote. I'd like to be insulted. Mostly I'm relieved." }] },
    { id: 'jp.5', turns: [{ by: 'a', dr: "{b} wants to make jury. I want votes. It's a fair trade." }] },
    { id: 'jp.6', turns: [{ beat: '{a} and {b} shake hands in the storage room.' }, { by: 'b', dr: "I think I got the better deal. {a} thinks the same." }] },
  ],
  'jury.bury.scene': [
    { id: 'jb.1', turns: [{ by: 'a', say: "{target} hates me. And {target} can't vote yet." }, { by: 'b', say: "So we get {target} out before {target} can." }] },
    { id: 'jb.2', turns: [{ by: 'a', say: "It's now, or {target} decides this at the end." }, { by: 'b', say: "...Now, then." }] },
    { id: 'jb.3', turns: [{ by: 'a', dr: "If {target} makes jury, {target} votes against me. Simple. {target} has to go first." }] },
    { id: 'jb.4', turns: [{ by: 'b', dr: "{a} wants {target} gone before jury. I wasn't planning to agree. I agree." }] },
    { id: 'jb.5', turns: [{ by: 'a', say: "Do you want {target} on the jury?" }, { by: 'b', say: "No." }, { by: 'a', say: "Then we're done talking." }] },
    { id: 'jb.6', turns: [{ by: 'a', dr: "The worst thing that could happen to me is {target} on that jury. So that's not happening." }] },
  ],
  'jury.crossed.scene': [
    { id: 'jx.1', turns: [{ by: 'a', dr: "From tonight, everyone who leaves gets a vote. I've said a lot of things I can't take back." }] },
    { id: 'jx.2', turns: [{ by: 'a', dr: "Jury's open. I've been rude to a lot of people. That's a problem now." }] },
    { id: 'jx.3', turns: [{ beat: 'Somebody says, "Careful what you say now."' }, { by: 'a', dr: "Everyone laughed. I laughed a second too late." }] },
    { id: 'jx.4', turns: [{ by: 'a', dr: "I've started being nice to people I haven't been nice to in weeks. I know how it looks." }] },
    { id: 'jx.5', turns: [{ by: 'a', dr: "Every eviction now hands someone a vote. I need to start fixing some friendships." }] },
    { id: 'jx.6', turns: [{ by: 'a', dr: "The jury's open. Everyone I've annoyed could be deciding my game. That's a lot of people." }] },
  ],
};
