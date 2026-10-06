// ══════════════════════════════════════════════════════════════════════
// td/script/lines/plans.js — endgame plans (camp-events.js generateIntentionStoryEvents)
// ══════════════════════════════════════════════════════════════════════
//
// plan.private.<ending> — {a} tells the camera who {a.sub} wants close and who
//   is in the way. Nobody else hears it. ending: 'both' ({ally} and {target}),
//   'ally' (only {ally}), 'target' (only {target}), 'open' (no plan yet).
//   {ally} or {target} may be on the other tribe; a line never puts them in the room.
// plan.probe.any — {a} sounds {b} out about the long game without offering a
//   deal. Neither promises anything.
// deal.end.<ending> — {a} withdraws a final {size} promise from {b}. 'face':
//   {a} says so to {b}. 'cold': {a} just stops acting like it is real.
// deal.broken.<ending> — {a} finds out {b} wrote {a}'s name despite their
//   final {size}. 'confront': {b} is here and {a} says it. 'alone': {a} only
//   tells the camera. Ids: 'pl.'.
const PRIVATE_BOTH = [
  { id: 'pl.b1', turns: [
    { by: 'a', conf: "If I'm being smart, I keep {ally} close and I keep an eye on {target}." },
    { by: 'a', conf: "{ally} is someone I can actually work with. {target} is someone I'll have to deal with sooner or later." },
  ] },
  { id: 'pl.b2', turns: [
    { by: 'a', conf: "Here's my plan. Stick with {ally}. Watch {target}." },
    { by: 'a', conf: "I'm not telling anyone that, obviously. But that's the plan." },
  ] },
  { id: 'pl.b3', turns: [
    { by: 'a', conf: "The person I want next to me is {ally}. The person in my way is {target}." },
    { by: 'a', conf: "Everything else I can figure out as I go." },
  ] },
  { id: 'pl.b4', turns: [
    { by: 'a', conf: "I've thought about this a lot. {ally} I trust, mostly. {target} I don't." },
    { by: 'a', conf: "So I stay friendly with everyone, and I wait for the right moment to go after {target}." },
  ] },
  { id: 'pl.b5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I need {ally}'s vote, so {ally} stays close." },
    { by: 'a', conf: "{target} is the one who could actually beat me. So {target} goes first, if I can make it happen." },
  ] },
  { id: 'pl.b6', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I really like {ally}. I think we could go far together." },
    { by: 'a', conf: "{target} worries me, though. I don't want to be mean about it, but I'm going to be careful." },
  ] },
  { id: 'pl.b7', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "{ally}'s my person. {target}? I don't trust {target.obj} at all." },
    { by: 'a', conf: "First chance I get, {target}'s gone. I'm just waiting for the numbers." },
  ] },
  { id: 'pl.b8', turns: [
    { by: 'a', conf: "Two names matter to me right now. {ally}, because I trust {ally.obj}. {target}, because I don't trust {target.obj}." },
  ] },
  { id: 'pl.b9', turns: [
    { by: 'a', conf: "{ally} and me against {target}. That's how I see it." },
    { by: 'a', conf: "{ally} doesn't know that's how I see it. Not yet." },
  ] },
  { id: 'pl.b10', when: { merged: true }, turns: [
    { by: 'a', conf: "Now that everyone's together, I need to be smart. {ally} is my safest bet." },
    { by: 'a', conf: "And {target} is the one I'd most like to see gone before the end." },
  ] },
];
const PRIVATE_ALLY = [
  { id: 'pl.a1', turns: [
    { by: 'a', conf: "Right now, the safest person for me is {ally}." },
    { by: 'a', conf: "I'm going to keep {ally} close and see where it goes." },
  ] },
  { id: 'pl.a2', turns: [
    { by: 'a', conf: "If I could pick one person to go to the end with, it'd be {ally}." },
    { by: 'a', conf: "I haven't said that to {ally} yet. Maybe I will. Maybe I won't." },
  ] },
  { id: 'pl.a3', turns: [
    { by: 'a', conf: "I don't have a big master plan. I just know {ally} is someone I can trust." },
    { by: 'a', conf: "That's worth a lot out here." },
  ] },
  { id: 'pl.a4', turns: [
    { by: 'a', conf: "Everyone's looking for someone to lean on. Mine is {ally}." },
    { by: 'a', conf: "As long as we've got each other, I think I'm okay." },
  ] },
  { id: 'pl.a5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{ally} thinks we're friends. We are, kind of." },
    { by: 'a', conf: "But mostly {ally} is the best shield I've got right now." },
  ] },
  { id: 'pl.a6', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I'm not great at the strategy stuff. But I know I feel safe around {ally}." },
    { by: 'a', conf: "So that's where I'm starting." },
  ] },
  { id: 'pl.a7', turns: [
    { by: 'a', conf: "I've got one person I really trust here. {ally}." },
    { by: 'a', conf: "Everyone else, I'm still working out." },
  ] },
  { id: 'pl.a8', turns: [
    { by: 'a', conf: "If things go wrong for me, I think {ally} would have my back." },
    { by: 'a', conf: "I really hope I'm right about that." },
  ] },
  { id: 'pl.a9', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "I win challenges. {ally} handles the people. We'd make a good team." },
  ] },
  { id: 'pl.a10', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Most people here drive me crazy. Not {ally}. {ally}'s alright." },
    { by: 'a', conf: "So {ally} is who I'm sticking with." },
  ] },
];
const PRIVATE_TARGET = [
  { id: 'pl.t1', turns: [
    { by: 'a', conf: "I don't have a final two or anything like that. I'm just trying to survive." },
    { by: 'a', conf: "And the person I need to survive is {target}." },
  ] },
  { id: 'pl.t2', turns: [
    { by: 'a', conf: "I don't know who I'm taking to the end yet. I do know who I want gone." },
    { by: 'a', conf: "{target}." },
  ] },
  { id: 'pl.t3', turns: [
    { by: 'a', conf: "{target} is the biggest problem in my game right now." },
    { by: 'a', conf: "I'm not saying that out loud to anyone. Not yet." },
  ] },
  { id: 'pl.t4', turns: [
    { by: 'a', conf: "Everyone's friendly with {target}. I'm friendly with {target}." },
    { by: 'a', conf: "But if I get the chance, I'm voting {target.obj} out." },
  ] },
  { id: 'pl.t5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "I'll be honest, I can't stand {target}." },
    { by: 'a', conf: "I'm keeping my mouth shut for now. But I'm not going to forget it." },
  ] },
  { id: 'pl.t6', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "{target} is playing a better game than people realise." },
    { by: 'a', conf: "Which is exactly why {target} can't be here much longer." },
  ] },
];
const PRIVATE_OPEN = [
  { id: 'pl.o1', turns: [
    { by: 'a', conf: "People keep asking me what my plan is. Honestly? I don't have one yet." },
    { by: 'a', conf: "I'm just taking it one vote at a time." },
  ] },
  { id: 'pl.o2', turns: [
    { by: 'a', conf: "I don't have a final two. I don't have a target. I just want to get through the next vote." },
  ] },
  { id: 'pl.o3', turns: [
    { by: 'a', conf: "I keep getting asked what my plan is. I don't have one yet." },
    { by: 'a', conf: "I'd rather wait and see who I can trust than rush into something stupid." },
  ] },
  { id: 'pl.o4', turns: [
    { by: 'a', conf: "I'm still working out who I can trust. It's harder than I thought it would be." },
  ] },
  { id: 'pl.o5', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I don't really know what I'm doing yet. I'm trying to watch and learn." },
  ] },
  { id: 'pl.o6', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "My plan is to win challenges. If I keep winning, nobody can vote me out." },
    { by: 'a', conf: "The social stuff I'll figure out later." },
  ] },
];

const PROBE = [
  { id: 'pl.p1', turns: [
    { by: 'a', say: "Can I ask you something hypothetical?" },
    { by: 'b', say: "Sure." },
    { by: 'a', say: "If it came down to the last few of us, where do you think you'd be?" },
    { by: 'b', say: "I don't know. Hopefully still here." },
    { by: 'a', say: "Me too. I'm just saying, we'd be good together at the end." },
    { by: 'b', say: "Maybe. Let's see how it goes." },
  ] },
  { id: 'pl.p2', turns: [
    { by: 'a', say: "Who do you see going far in this game?" },
    { by: 'b', say: "Honestly? I haven't thought about it much." },
    { by: 'a', say: "I have. And I keep thinking you're one of them." },
    { by: 'b', say: "Is that a compliment or a warning?" },
    { by: 'a', say: "A compliment. I promise." },
    { beat: 'They both laugh, and leave it there.' },
  ] },
  { id: 'pl.p3', turns: [
    { by: 'a', say: "Do you think about the end much?" },
    { by: 'b', say: "Sometimes. Why?" },
    { by: 'a', say: "No reason. I just think we'd work well together." },
    { by: 'b', say: "Are you asking me for a deal?" },
    { by: 'a', say: "No. Not yet. I'm just saying it." },
  ] },
  { id: 'pl.p4', turns: [
    { by: 'a', say: "We don't talk game much, do we?" },
    { by: 'b', say: "Not really." },
    { by: 'a', say: "Maybe we should. Not today. Just... sometime." },
    { by: 'b', say: "Okay. Sometime." },
  ] },
  { id: 'pl.p5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'll be honest with you. I'm looking at who I want to keep around." },
    { by: 'b', say: "And?" },
    { by: 'a', say: "And you're on the list. That's all I'm saying for now." },
    { by: 'b', say: "That's not much." },
    { by: 'a', say: "It's a start. We can talk more later." },
  ] },
  { id: 'pl.p6', when: { band: 'friends' }, turns: [
    { by: 'a', say: "Can I say something without it being weird?" },
    { by: 'b', say: "Go for it." },
    { by: 'a', say: "If we both make it far, I'd want to be up there with you." },
    { by: 'b', say: "That's not weird. I'd want that too." },
    { by: 'a', say: "Okay. Good. That's all." },
  ] },
  { id: 'pl.p7', turns: [
    { by: 'b', say: "What are you smiling about?" },
    { by: 'a', say: "Just thinking. You're easy to talk to. That matters at the end." },
    { by: 'b', say: "At the end? We're not even close to the end." },
    { by: 'a', say: "I know. I'm just thinking ahead." },
  ] },
  { id: 'pl.p8', turns: [
    { by: 'a', say: "Can I ask you something weird?" },
    { by: 'b', say: "That depends how weird." },
    { by: 'a', say: "If you had to pick one person to trust here, who would it be?" },
    { by: 'b', say: "I don't know. Why, who would you pick?" },
    { by: 'a', say: "I'm still deciding. You're in the running, though." },
  ] },
  { id: 'pl.p9', turns: [
    { by: 'a', say: "Do you have anyone you're really close with here?" },
    { by: 'b', say: "Not really. Do you?" },
    { by: 'a', say: "Not yet. Maybe that could change." },
    { by: 'b', say: "Maybe." },
    { beat: 'Neither of them says anything more about it.' },
  ] },
  { id: 'pl.p10', turns: [
    { by: 'a', say: "I've been watching how you play." },
    { by: 'b', say: "Should I be worried?" },
    { by: 'a', say: "No. I like it. You don't make enemies." },
    { by: 'b', say: "I try not to." },
    { by: 'a', say: "That's the kind of person I want around later." },
  ] },
  { id: 'pl.p11', when: { merged: true }, turns: [
    { by: 'a', say: "Now that we're merged, it's a whole new game." },
    { by: 'b', say: "Tell me about it." },
    { by: 'a', say: "I'm going to need people I can count on. I think you might be one of them." },
    { by: 'b', say: "We'll see. Let's talk again after the next vote." },
  ] },
  { id: 'pl.p12', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um, can I ask you something about the game?" },
    { by: 'b', say: "Sure." },
    { by: 'a', say: "Do you think we could... look out for each other? Not a deal. Just, you know." },
    { by: 'b', say: "Yeah. I think we could do that." },
  ] },
];

const END_FACE = [
  { id: 'pl.e1', turns: [
    { by: 'a', say: "Can we talk? About our deal." },
    { by: 'b', say: "What about it?" },
    { by: 'a', say: "I don't think it's real anymore. Not after everything." },
    { by: 'b', say: "You're serious?" },
    { by: 'a', say: "I'd rather tell you than pretend." },
    { beat: '{b} stares at {a}, then walks away.' },
  ] },
  { id: 'pl.e2', turns: [
    { by: 'a', say: "I need to be honest with you. The final {size} thing. I can't do it." },
    { by: 'b', say: "Since when?" },
    { by: 'a', say: "Since we stopped getting along. You know we have." },
    { by: 'b', say: "Fine. Then it's off." },
  ] },
  { id: 'pl.e3', turns: [
    { by: 'b', say: "You've been avoiding me." },
    { by: 'a', say: "Yeah. Because I don't know how to say this." },
    { by: 'b', say: "Say what?" },
    { by: 'a', say: "The deal's off. I'm sorry." },
    { by: 'b', say: "Wow. Okay." },
  ] },
  { id: 'pl.e4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Let's stop pretending, okay? Our deal is done." },
    { by: 'b', say: "Excuse me?" },
    { by: 'a', say: "You heard me. We don't even like each other anymore." },
    { by: 'b', say: "Fine. Good. I didn't want to sit next to you at the end anyway." },
  ] },
  { id: 'pl.e5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "This is really hard to say. I don't think our deal works anymore." },
    { by: 'b', say: "Are you breaking up with me? Game-wise?" },
    { by: 'a', say: "Kind of. I'm sorry. I didn't want to lie to you." },
    { by: 'b', say: "Well, at least you told me." },
  ] },
  { id: 'pl.e6', turns: [
    { by: 'a', say: "Remember our final {size}?" },
    { by: 'b', say: "Yeah." },
    { by: 'a', say: "I'm calling it off." },
    { by: 'b', say: "Just like that?" },
    { by: 'a', say: "It hasn't felt real for a while. You know that." },
    { beat: '{b} doesn\'t answer.' },
  ] },
];
const END_COLD = [
  { id: 'pl.c1', turns: [
    { by: 'b', say: "Hey. Are we good?" },
    { by: 'a', say: "Yeah. We're fine." },
    { beat: '{a} walks off before {b} can say anything else.' },
    { by: 'a', conf: "I made a final {size} with {b}. I don't feel like keeping it anymore." },
  ] },
  { id: 'pl.c2', turns: [
    { by: 'a', conf: "{b} still thinks we have a deal. I don't." },
    { by: 'a', conf: "I'm not going to make a big scene about it. I'm just done." },
  ] },
  { id: 'pl.c3', turns: [
    { by: 'b', say: "You sat with everyone else at dinner." },
    { by: 'a', say: "So?" },
    { by: 'b', say: "So nothing. Just noticed." },
    { by: 'a', conf: "Our final {size} isn't a thing anymore. {b} will figure it out eventually." },
  ] },
  { id: 'pl.c4', turns: [
    { by: 'a', conf: "I promised {b} a final {size}. That was before we started fighting." },
    { by: 'a', conf: "I'm not telling {b.obj} it's over. I'm just not counting on {b.obj} anymore." },
  ] },
  { id: 'pl.c5', turns: [
    { by: 'b', say: "We're still okay, right? Our deal?" },
    { by: 'a', say: "Sure." },
    { by: 'b', say: "That didn't sound very sure." },
    { by: 'a', say: "I said sure." },
    { by: 'b', conf: "Something's off with {a}. I don't know what, but something's off." },
  ] },
  { id: 'pl.c6', turns: [
    { by: 'a', conf: "{b} and I had a deal. Then {b} kept getting on my nerves." },
    { by: 'a', conf: "I don't owe {b} anything now." },
  ] },
];

const BROKEN_CONFRONT = [
  { id: 'pl.k1', turns: [
    { by: 'a', say: "You wrote my name." },
    { by: 'b', say: "What? Who told you that?" },
    { by: 'a', say: "Doesn't matter. You did, didn't you?" },
    { by: 'b', say: "...It was just a vote." },
    { by: 'a', say: "We had a final {size}. That's not 'just a vote'." },
    { beat: '{a} walks away.' },
  ] },
  { id: 'pl.k2', turns: [
    { by: 'a', say: "So that's what our deal was worth." },
    { by: 'b', say: "I can explain." },
    { by: 'a', say: "Go on then. Explain why my name was on your ballot." },
    { by: 'b', say: "I didn't think it would matter. You were safe." },
    { by: 'a', say: "That's not the point, and you know it." },
  ] },
  { id: 'pl.k3', turns: [
    { by: 'b', say: "Hey, you okay?" },
    { by: 'a', say: "No. I know you voted for me." },
    { beat: "{b} doesn't say anything." },
    { by: 'a', say: "Our final {size} is over. Don't bother." },
    { beat: '{b} opens {b.posAdj} mouth, then closes it again.' },
  ] },
  { id: 'pl.k4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Are you kidding me? You voted for ME?" },
    { by: 'b', say: "Keep your voice down—" },
    { by: 'a', say: "No! We had a deal! Final {size}! And you wrote my name down!" },
    { by: 'b', say: "It wasn't personal." },
    { by: 'a', say: "It's very personal to me." },
  ] },
  { id: 'pl.k5', when: { register: 'cool' }, turns: [
    { by: 'a', say: "I know you voted for me." },
    { by: 'b', say: "I—" },
    { by: 'a', say: "I'm not going to yell. I just want you to know that I know." },
    { by: 'b', say: "Okay." },
    { by: 'a', say: "Our deal's off." },
  ] },
  { id: 'pl.k6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I really thought we were in this together." },
    { by: 'b', say: "We were. We are." },
    { by: 'a', say: "Then why was my name on your ballot?" },
    { by: 'b', say: "I'm sorry. I panicked." },
    { by: 'a', say: "I don't know if I can trust you again." },
  ] },
];
const BROKEN_ALONE = [
  { id: 'pl.l1', turns: [
    { by: 'a', conf: "I found out {b} voted for me. We had a final {size}." },
    { by: 'a', conf: "So that's over. Now I know where I stand." },
  ] },
  { id: 'pl.l2', turns: [
    { by: 'a', conf: "{b} wrote my name down. After promising me a final {size}." },
    { by: 'a', conf: "I'm not going to say anything. I'm just going to remember it." },
  ] },
  { id: 'pl.l3', turns: [
    { by: 'a', conf: "I really trusted {b}. I thought we were going to the end together." },
    { by: 'a', conf: "And then I find out {b} voted for me. I feel stupid." },
  ] },
  { id: 'pl.l4', turns: [
    { by: 'a', conf: "Our deal is over. {b} ended it the moment {b} wrote my name." },
    { by: 'a', conf: "{b} just doesn't know I know yet." },
  ] },
  { id: 'pl.l5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "{b} voted for me! We had a deal!" },
    { by: 'a', conf: "Okay. Fine. If that's how {b} wants to play, that's how we'll play." },
  ] },
  { id: 'pl.l6', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{b} broke our deal. Good to know." },
    { by: 'a', conf: "I'll let {b} think I don't know. That's more useful to me." },
  ] },
];

// {b} wrote {a}'s name and has since left the game. {a} only finds out now.
const BROKEN_GONE = [
  { id: 'pl.g1', turns: [
    { by: 'a', conf: "I found out {b} voted for me before {b.sub} left. We had a final {size}." },
    { by: 'a', conf: "I guess it doesn't matter now. It still hurts, though." },
  ] },
  { id: 'pl.g2', turns: [
    { by: 'a', conf: "So {b} wrote my name down. The same {b} who promised me a final {size}." },
    { by: 'a', conf: "I'm kind of glad {b}'s gone now." },
  ] },
  { id: 'pl.g3', turns: [
    { by: 'a', conf: "I was sad when {b} went home. Then I found out {b} voted for me." },
    { by: 'a', conf: "Now I don't know what to feel about it." },
  ] },
  { id: 'pl.g4', turns: [
    { by: 'a', conf: "Our final {size} was never real. {b} voted for me. I just didn't know it until now." },
    { by: 'a', conf: "Lesson learned. I'm not trusting anyone that easily again." },
  ] },
  { id: 'pl.g5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "{b} voted for me? After everything?" },
    { by: 'a', conf: "Good thing {b}'s gone, because I'd have a few things to say." },
  ] },
  { id: 'pl.g6', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I found out {b} voted for me. I really thought we were friends." },
    { by: 'a', conf: "Maybe we were. Maybe it was just a game to {b}. I'll never know now." },
  ] },
];

export default {
  'plan.private.both': PRIVATE_BOTH,
  'plan.private.ally': PRIVATE_ALLY,
  'plan.private.target': PRIVATE_TARGET,
  'plan.private.open': PRIVATE_OPEN,
  'plan.probe.any': PROBE,
  'deal.end.face': END_FACE,
  'deal.end.cold': END_COLD,
  'deal.broken.confront': BROKEN_CONFRONT,
  'deal.broken.alone': BROKEN_ALONE,
  'deal.broken.gone': BROKEN_GONE,
};
