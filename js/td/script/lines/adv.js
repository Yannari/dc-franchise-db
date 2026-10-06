// ══════════════════════════════════════════════════════════════════════
// td/script/lines/adv.js — idols and advantages: searching, finding, sharing, losing
// ══════════════════════════════════════════════════════════════════════
//
// adv.search.any — {a} sneaks off to look for an idol and comes back empty-handed.
// adv.found.<what> — {a} finds something, alone with the camera: idol,
//   extravote, legacy, kip (Knowledge is Power), amulet, secondlife,
//   idol-totem (the gift ceremony's totem), beware (an idol that costs {a} the
//   vote until every tribe finds theirs), auction (bought with auction money),
//   beware-live (every Beware is found: {a}'s idol is live and the vote is back).
// adv.exposed.<mode> — on the way to the vote, {a}, holding an idol, reads the
//   room: 'countermove' (somebody knows, and {target} is at the centre of it),
//   'panic' (nobody knows, but it feels like everybody does), 'unaware' (people
//   know; {a} has no idea), 'unsure'.
// adv.handover.any — {a}, a schemer, talks {b} into handing over {b.posAdj}
//   idol before the vote. Only {a}'s confessional says what comes next.
// adv.flush.any — {a} plants a fear in {b}, who holds an idol, so {b} plays it
//   for nothing. {b} believes it.
// adv.share.<close|ally> — {a} gives {b} an idol before the vote.
// host.gotcha.any — {host} promises {a} and {b} a reward. It isn't one.
// This camp votes tonight for every adv.exposed/handover/flush/share. Ids: 'ad.'.
const C = (id, ...lines) => ({ id, turns: lines.map(l => ({ by: 'a', conf: l })) });
const Cw = (id, when, ...lines) => ({ id, when, turns: lines.map(l => ({ by: 'a', conf: l })) });

const SEARCH = [
  C('ad.s1', "Everybody thinks I went to get water. I went to look for an idol.", "I didn't find one. I did get water, though, so the story holds up."),
  C('ad.s2', "I've checked under every rock near camp. Twice. Where is it?"),
  C('ad.s3', "I'm not giving up. That idol is out there, and I'm going to find it before anyone else does."),
  Cw('ad.s4', { register: 'fiery' }, "I've been digging for an hour! There's nothing here but dirt and a very angry crab!"),
  C('ad.s5', "I said I was going for a walk. A walk with a lot of looking under things."),
  Cw('ad.s6', { register: 'schemer' }, "I don't need to find the idol. I just need everybody to think I might have."),
  C('ad.s7', "Nothing today. But I've crossed off about half the places it could be."),
];
const FOUND = {
  idol: [
    C('ad.i1', "Oh my gosh. Oh my gosh. It's an idol. It's an actual idol!", "Okay. Calm face. Calm face. Nobody can know."),
    C('ad.i2', "I found a Hidden Immunity Idol. And nobody knows. Nobody's going to know."),
    C('ad.i3', "I've been looking for days, and there it was. Right under my nose the whole time."),
    Cw('ad.i4', { register: 'schemer' }, "An idol. Now the game is really mine."),
    Cw('ad.i5', { register: 'shy' }, "I found an idol. Me. I'm shaking. I can't believe it."),
    Cw('ad.i6', { register: 'fiery' }, "YES! An idol! I mean... yes. Quietly. Yes."),
  ],
  extravote: [
    C('ad.e1', "I found an extra vote. Two votes at the next Tribal. That could change everything."),
    C('ad.e2', "An extra vote. I'm keeping this to myself until the exact right moment."),
    C('ad.e3', "Two votes instead of one. People are going to wish they'd been nicer to me."),
    Cw('ad.e4', { register: 'schemer' }, "An extra vote is worth more than a friend out here. Trust me."),
    C('ad.e5', "I read the note three times to make sure. Extra vote. It's real."),
    C('ad.e6', "Nobody saw me find it. Nobody's going to know until it's too late."),
  ],
  legacy: [
    C('ad.l1', "I found the Legacy Advantage. It only works late in the game, so I just have to get there."),
    C('ad.l2', "It's not an idol. Not yet. But at the right moment, it might as well be."),
    C('ad.l3', "The Legacy Advantage. Now I've got a reason to make it to the end."),
    C('ad.l4', "I'm going to keep this so quiet. It's no use if people know about it before it works."),
    Cw('ad.l5', { register: 'schemer' }, "A safety net for later. I'll take it."),
    C('ad.l6', "I'll be honest, I had to read the rules twice. But I get it now. And I like it."),
  ],
  kip: [
    C('ad.k1', "Knowledge is Power. I can take somebody else's advantage at the vote. If I guess right."),
    C('ad.k2', "Now I just need to figure out who's hiding what. No pressure."),
    C('ad.k3', "This could steal somebody's idol right out of their hand. I need to be sure, though."),
    Cw('ad.k4', { register: 'schemer' }, "Everybody's secrets just became my business."),
    C('ad.k5', "If I ask the wrong person, it's wasted. So I'm going to watch everybody very closely."),
    C('ad.k6', "This is the scariest thing I've ever found. In a good way. Mostly."),
  ],
  amulet: [
    C('ad.a1', "I found an amulet. It's weak right now, but it gets stronger the longer it stays in the game."),
    C('ad.a2', "Other people have these too. Every time one of them leaves, mine gets better."),
    C('ad.a3', "It's not much yet. But I'm patient."),
    Cw('ad.a4', { register: 'schemer' }, "So the more amulet holders go home, the stronger mine gets? I can work with that."),
    C('ad.a5', "I'm keeping this hidden. If people know, they'll want it gone before it gets strong."),
    C('ad.a6', "It's a slow advantage. I just have to last long enough to use it."),
  ],
  secondlife: [
    C('ad.f1', "If they vote me out, I get one more chance. A duel. Against whoever I pick."),
    C('ad.f2', "A second life. I hope I never need it. But I'm glad I've got it."),
    C('ad.f3', "If they come for me, I'm not going quietly. I'm taking somebody with me into a duel."),
    Cw('ad.f4', { register: 'competitor' }, "A duel? Please. I'd love a duel."),
    C('ad.f5', "Nobody knows I have this. When I use it, their faces are going to be priceless."),
    C('ad.f6', "This is my insurance. Now I can play a little bolder."),
  ],
  'idol-totem': [
    C('ad.t1', "I picked the totem. It's a real idol. Now I just need a cover story for what I picked."),
    C('ad.t2', "Everyone thinks I chose something boring. I chose an idol."),
    C('ad.t3', "I came back to camp with a straight face and a live idol in my pocket."),
    Cw('ad.t4', { register: 'schemer' }, "I told them I picked the boring gift. I'm very convincing when I need to be."),
    C('ad.t5', "No digging, no searching. Just a choice. And I made the right one."),
    C('ad.t6', "My hands were shaking when I opened it. They're still shaking a little."),
  ],
  beware: [
    C('ad.b1', "I found an idol. With a catch. I can't vote until every tribe finds one too."),
    C('ad.b2', "Is losing my vote worth a live idol later? I think so. I hope so."),
    C('ad.b3', "I kept it. No vote for now. But when it switches on, I'm untouchable."),
    Cw('ad.b4', { register: 'fiery' }, "No vote?! Fine. FINE. It's still an idol."),
    C('ad.b5', "I'm going to have to explain why I'm not voting. I'm going to need a really good story."),
    C('ad.b6', "A powerful idol for the price of a little silence. I'll take that deal."),
  ],
  auction: [
    C('ad.u1', "I spent my auction money on a clue. Everybody laughed. Then I followed it. Nobody's laughing now. Well, they don't know yet."),
    C('ad.u2', "Best money I ever spent. I've got an idol."),
    C('ad.u3', "They bought food. I bought a clue. Guess who's safe now?"),
    C('ad.u4', "The clue was right. I've got an idol. I came back to camp very quiet."),
    Cw('ad.u5', { register: 'schemer' }, "I let everyone think I wasted my money. I didn't."),
    C('ad.u6', "I'm still hungry. But I'm hungry and armed."),
  ],
  'beware-live': [
    C('ad.v1', "Every tribe found theirs. My idol is live, and I get my vote back."),
    C('ad.v2', "It's switched on. I've got a real idol now. Finally."),
    C('ad.v3', "No more sitting out the vote. And now I've got an idol in my pocket. Good day."),
    Cw('ad.v4', { register: 'fiery' }, "I can vote again! And I've got an idol! Watch out, everybody!"),
    C('ad.v5', "All that waiting was worth it. It's a real idol now."),
    C('ad.v6', "My vote's back, and so is my confidence."),
  ],
};
const EXPOSED = {
  countermove: [
    C('ad.x1', "Conversations stop when I walk over. And {target} is in the middle of every one of them.", "Somebody knows about my idol. I'm pretty sure it's {target}."),
    C('ad.x2', "My idol isn't a secret anymore. I can feel it. And {target} keeps looking at my bag."),
    C('ad.x3', "I don't know the whole plan. But {target} knows something, and that something is about me."),
    Cw('ad.x4', { register: 'fiery' }, "{target} knows. I KNOW {target} knows!"),
    C('ad.x5', "If {target} knows about my idol, they're going to try to flush it. I need to be smart tonight."),
    C('ad.x6', "Somebody blabbed. {target} is acting very interested in me all of a sudden."),
  ],
  panic: [
    C('ad.p1', "Nobody's said anything. But I feel like everybody knows about my idol."),
    C('ad.p2', "Every whisper sounds like it's about me. And my idol. I know that's crazy. It feels true."),
    C('ad.p3', "I keep checking my pocket. Like someone's going to take it. Nobody's going to take it. Right?"),
    Cw('ad.p4', { register: 'fiery' }, "Why is everyone being so quiet?! Do they know? They know. They don't know. I don't know!"),
    C('ad.p5', "I should play it tonight. Or I shouldn't. I can't tell if I'm being smart or scared."),
    C('ad.p6', "It still feels like a secret. It just doesn't feel safe."),
  ],
  unaware: [
    C('ad.n1', "Nobody knows about my idol. I've been so careful."),
    C('ad.n2', "My idol is my secret. Nobody suspects a thing. I'm in a great spot."),
    C('ad.n3', "Tonight's going to be easy. Nobody even knows what I've got."),
    Cw('ad.n4', { register: 'schemer' }, "I've kept my idol completely hidden. Not one person knows."),
    C('ad.n5', "I'm so relaxed. My secret is safe. I can feel it."),
    C('ad.n6', "Honestly, I'm not even nervous. They don't know I'm holding anything."),
  ],
  unsure: [
    C('ad.q1', "Something feels off. I don't know if somebody knows about my idol. I'm keeping it close."),
    C('ad.q2', "Maybe somebody knows. Maybe nobody does. I can't tell, and that's the worst part."),
    C('ad.q3', "I'm not sure my idol is still a secret. I'm not sure it isn't, either."),
    C('ad.q4', "I've got a feeling. Not a good one. My idol might not be as hidden as I thought."),
    Cw('ad.q5', { register: 'cool' }, "I can't prove anyone knows. I'm going to act like they do."),
    C('ad.q6', "Whatever happens tonight, I'm keeping my hand near my pocket."),
  ],
};
const HANDOVER = [
  { id: 'ad.h1', turns: [
    { by: 'a', say: "Listen. If you play it, everyone knows you had it. Give it to me. I'll play it for you." },
    { by: 'b', say: "You'd do that?" },
    { by: 'a', say: "Of course. We're a team." },
    { beat: '{b} hands it over.' },
    { by: 'a', conf: "I'm not playing it for {b}. I'm playing it for me. And {b} is going home tonight." },
  ] },
  { id: 'ad.h2', turns: [
    { by: 'a', say: "Let me hold onto it. Nobody will suspect me. You're the one they're watching." },
    { by: 'b', say: "I don't know..." },
    { by: 'a', say: "Do you trust me or not?" },
    { by: 'b', say: "...I trust you." },
    { by: 'a', conf: "{b} just handed me the only thing keeping {b.obj} safe. I almost feel bad. Almost." },
  ] },
  { id: 'ad.h3', turns: [
    { by: 'a', say: "Give it to me. We'll cover each other tonight." },
    { by: 'b', say: "Promise?" },
    { by: 'a', say: "Promise." },
    { beat: '{b} passes the idol over. {a} pockets it without a word.' },
    { by: 'a', conf: "I promised. I didn't mean it. {b} is going home tonight." },
  ] },
  { id: 'ad.h4', turns: [
    { by: 'b', say: "I'm scared to play it. What if I play it wrong?" },
    { by: 'a', say: "Then let me decide. Give it here." },
    { by: 'b', say: "Okay. You know what you're doing." },
    { by: 'a', conf: "I do know what I'm doing. That's the problem for {b}." },
  ] },
  { id: 'ad.h5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You trust me, don't you?" },
    { by: 'b', say: "More than anyone." },
    { by: 'a', say: "Then let me keep it safe for you." },
    { beat: '{b} hands it over.' },
    { by: 'a', conf: "It's very safe now. In my pocket. Where it's staying." },
  ] },
  { id: 'ad.h6', turns: [
    { by: 'a', say: "If they search your bag, it's over. Let me carry it." },
    { by: 'b', say: "Okay. Yeah. Good idea." },
    { by: 'a', conf: "Nobody was going to search {b}'s bag. But now it's my idol." },
  ] },
];
const FLUSH = [
  { id: 'ad.f7', turns: [
    { by: 'a', say: "I've been hearing things. You should be careful tonight." },
    { by: 'b', say: "Careful how?" },
    { by: 'a', say: "Just... if you've got anything, I'd think about using it." },
    { by: 'b', say: "Okay. Thanks." },
    { by: 'a', conf: "Nobody's voting for {b}. But if {b} plays that idol tonight, it's gone, and so is {b}'s safety net." },
  ] },
  { id: 'ad.f8', turns: [
    { by: 'a', say: "Your name's out there. Just so you know." },
    { by: 'b', say: "Seriously? How bad?" },
    { by: 'a', say: "Bad enough that I'd be worried." },
    { by: 'a', conf: "{b}'s name isn't out there at all. But now {b} is going to waste that idol." },
  ] },
  { id: 'ad.f9', turns: [
    { by: 'b', say: "Do you think I'm safe tonight?" },
    { by: 'a', say: "Honestly? I'm not sure anybody is. Especially you." },
    { by: 'b', say: "Oh no." },
    { by: 'a', conf: "{b} was completely safe. Not anymore. Not after {b} burns that idol for nothing." },
  ] },
  { id: 'ad.f10', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'd never forgive myself if you got blindsided tonight." },
    { by: 'b', say: "Am I going to get blindsided?" },
    { by: 'a', say: "I can't say. Just protect yourself." },
    { by: 'a', conf: "One idol, flushed. And I didn't even have to cast a vote." },
  ] },
  { id: 'ad.f11', turns: [
    { by: 'a', say: "Watch out tonight. I don't want to say more." },
    { by: 'b', say: "You have to say more!" },
    { by: 'a', say: "I can't. Just be ready." },
    { by: 'a', conf: "There's nothing to be ready for. That's the whole trick." },
  ] },
  { id: 'ad.f12', turns: [
    { by: 'a', say: "If I were you, I wouldn't walk into that vote with nothing." },
    { by: 'b', say: "What makes you think I've got something?" },
    { by: 'a', say: "I'm just saying." },
    { by: 'a', conf: "{b} has an idol. And {b} is going to play it, tonight, for no reason at all." },
  ] },
];
const SHARE_CLOSE = [
  { id: 'ad.c1', turns: [
    { by: 'a', say: "Take this. Don't argue." },
    { by: 'b', say: "Is that what I think it is?" },
    { by: 'a', say: "I trust you more than I trust luck tonight." },
    { by: 'b', say: "I won't let you down. I promise." },
  ] },
  { id: 'ad.c2', turns: [
    { beat: '{a} presses something into {b}\'s hand on the way to the vote.' },
    { by: 'b', say: "Wait, why are you giving me this?" },
    { by: 'a', say: "Because if anyone's going home tonight, it's not going to be you." },
    { by: 'b', say: "I don't know what to say." },
    { by: 'a', say: "Then don't say anything. Just hide it." },
  ] },
  { id: 'ad.c3', turns: [
    { by: 'a', say: "You're the one person here I'd give this to." },
    { by: 'b', say: "Your idol? Are you sure?" },
    { by: 'a', say: "I've never been more sure." },
    { beat: '{b} hugs {a} tight.' },
  ] },
  { id: 'ad.c4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I want you to have it. I'd rather lose it than lose you." },
    { by: 'b', say: "That's the nicest thing anyone's ever done for me out here." },
  ] },
  { id: 'ad.c5', turns: [
    { by: 'a', say: "Here. If they come for you, play it." },
    { by: 'b', say: "And if they come for you?" },
    { by: 'a', say: "Then I'll deal with it. I'd rather it was me than you." },
  ] },
  { id: 'ad.c6', turns: [
    { by: 'b', say: "Why are you looking at me like that?" },
    { by: 'a', say: "Because I'm about to do something stupid. Hold out your hand." },
    { beat: '{a} drops the idol into {b}\'s palm.' },
    { by: 'b', say: "That's not stupid. That's the best thing you've ever done." },
  ] },
];
const SHARE_ALLY = [
  { id: 'ad.a7', turns: [
    { by: 'a', say: "I think you need this more than I do tonight." },
    { by: 'b', say: "You're giving me your idol?" },
    { by: 'a', say: "We're allies. This is what allies do." },
    { by: 'b', say: "I owe you. Big time." },
  ] },
  { id: 'ad.a8', turns: [
    { by: 'a', say: "Hold onto this for me. Just in case." },
    { by: 'b', say: "In case of what?" },
    { by: 'a', say: "In case they come for you instead of me." },
  ] },
  { id: 'ad.a9', turns: [
    { by: 'a', say: "I've got a feeling about tonight. Take this." },
    { by: 'b', say: "Are you sure?" },
    { by: 'a', say: "Sure enough." },
    { by: 'a', conf: "If I keep {b} safe tonight, {b} keeps me safe next week. That's the deal in my head." },
  ] },
  { id: 'ad.a10', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "This is a gift. Remember it." },
    { by: 'b', say: "I'll never forget it." },
    { by: 'a', conf: "{b} owes me forever now. Best trade I've ever made." },
  ] },
  { id: 'ad.a11', turns: [
    { by: 'a', say: "I don't think they're coming for me. I think they're coming for you." },
    { by: 'b', say: "So what do I do?" },
    { by: 'a', say: "You take this." },
  ] },
  { id: 'ad.a12', turns: [
    { beat: '{a} catches up with {b} on the walk to the vote.' },
    { by: 'a', say: "Put this somewhere safe. Don't look at it." },
    { by: 'b', say: "Is that—" },
    { by: 'a', say: "Don't look at it!" },
  ] },
];
const GOTCHA = [
  { id: 'ad.g1', turns: [
    { by: 'a', say: "{host} said it was a spa day!" },
    { by: 'b', say: "This is a mud pit." },
    { by: 'a', say: "It's a spa day for pigs!" },
    { beat: '{a} and {b} sit in the mud and laugh until they can\'t breathe.' },
  ] },
  { id: 'ad.g2', turns: [
    { by: 'a', say: "'Letters from home', {host} said. It's my own phone bill!" },
    { by: 'b', say: "Mine's a parking ticket!" },
    { by: 'a', say: "Read it out loud. Do it. Do the voice." },
    { beat: '{b} reads it out loud, in the voice. They both lose it.' },
  ] },
  { id: 'ad.g3', turns: [
    { by: 'b', say: "A feast. {host} said a feast." },
    { by: 'a', say: "It's the same slop. With a bow on it." },
    { by: 'b', say: "To being lied to by {host}." },
    { by: 'a', say: "Cheers." },
  ] },
  { id: 'ad.g4', turns: [
    { by: 'a', say: "Why did we run three laps for a 'surprise'?" },
    { by: 'b', say: "Because the surprise was us running three laps." },
    { by: 'a', say: "I hate {host} so much." },
    { beat: 'They flop down in the dirt, too tired to stop laughing.' },
  ] },
  { id: 'ad.g5', turns: [
    { by: 'a', say: "I really thought it was going to be pizza." },
    { by: 'b', say: "We both did. That's what makes it worse." },
    { by: 'a', say: "Next time {host} says 'reward', we hide." },
  ] },
  { id: 'ad.g6', turns: [
    { by: 'b', say: "Let me guess. Another 'reward'?" },
    { by: 'a', say: "It's a bucket. Of water. Thrown at us." },
    { by: 'b', say: "Refreshing, I guess?" },
    { by: 'a', say: "Don't you dare defend {host}." },
  ] },
];

export default {
  'adv.search.any': SEARCH,
  ...Object.fromEntries(Object.entries(FOUND).map(([k, v]) => [`adv.found.${k}`, v])),
  ...Object.fromEntries(Object.entries(EXPOSED).map(([k, v]) => [`adv.exposed.${k}`, v])),
  'adv.handover.any': HANDOVER,
  'adv.flush.any': FLUSH,
  'adv.share.close': SHARE_CLOSE,
  'adv.share.ally': SHARE_ALLY,
  'host.gotcha.any': GOTCHA,
};

export const GUARANTEED = Object.fromEntries([
  ...Object.keys(EXPOSED).map(k => `adv.exposed.${k}`), 'adv.handover.any', 'adv.flush.any', 'adv.share.close', 'adv.share.ally',
].map(k => [k, ['tribal']]));
