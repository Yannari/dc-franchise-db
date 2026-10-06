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
//   tells the camera. 'gone': {b} has already left the game. Ids: 'pl.'.
//
// The voice (spec §5.1): a confessional is one sharp thought in the speaker's
// own words; a scene has something going on under it, pushback and attitude.
const PRIVATE_BOTH = [
  { id: 'pl.b1', turns: [
    { by: 'a', conf: "Keep {ally} close. Keep an eye on {target}." },
    { by: 'a', conf: "It's a simple plan. Everyone who tried a complicated one is already on their way home." },
  ] },
  { id: 'pl.b2', turns: [
    { by: 'a', conf: "{ally} is my person. {target} is my problem." },
    { by: 'a', conf: "I'm going to be really nice to my problem until I can get rid of it." },
  ] },
  { id: 'pl.b3', turns: [
    { by: 'a', conf: "If I could pick who goes to the end with me, it's {ally}. If I could pick who goes home next, it's {target}." },
    { by: 'a', conf: "I can't pick either. Yet." },
  ] },
  { id: 'pl.b4', turns: [
    { by: 'a', conf: "I trust {ally}. Mostly. I don't trust {target} at all." },
    { by: 'a', conf: "So I smile at everyone, and I wait for {target} to slip up." },
  ] },
  { id: 'pl.b5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I need {ally}'s vote, so {ally} stays close." },
    { by: 'a', conf: "{target} is the one who could actually beat me. So {target} goes first, if I can make it happen. And I can." },
  ] },
  { id: 'pl.b6', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I really like {ally}. I think we could go far together." },
    { by: 'a', conf: "{target} kind of scares me, though. I don't want to be mean about it, but I'm watching {target.obj}." },
  ] },
  { id: 'pl.b7', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "{ally}'s my person. {target}? I don't trust {target.obj} as far as I could throw {target.obj}." },
    { by: 'a', conf: "First chance I get, {target}'s gone. I'm just waiting for the numbers." },
  ] },
  { id: 'pl.b8', turns: [
    { by: 'a', conf: "Two names matter right now. {ally}, because I trust {ally.obj}. {target}, because I don't." },
  ] },
  { id: 'pl.b9', turns: [
    { by: 'a', conf: "{ally} and me against {target}. That's how I see it." },
    { by: 'a', conf: "{ally} doesn't know that's how I see it. Not yet." },
  ] },
  { id: 'pl.b10', when: { merged: true }, turns: [
    { by: 'a', conf: "Now that everyone's living together, I need to be smart. {ally} is my safest bet." },
    { by: 'a', conf: "And {target} is the last person I want sitting next to me at the end." },
  ] },
  { id: 'pl.b11', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "{ally} has my back. {target} is the one I have to beat." },
    { by: 'a', conf: "I don't mind. I like a challenge." },
  ] },
];
const PRIVATE_ALLY = [
  { id: 'pl.a1', turns: [
    { by: 'a', conf: "Right now, the safest place for me is right next to {ally}." },
    { by: 'a', conf: "Like, literally. I'm sitting next to {ally} at every meal." },
  ] },
  { id: 'pl.a2', turns: [
    { by: 'a', conf: "If I could pick one person to go to the end with, it'd be {ally}." },
    { by: 'a', conf: "I haven't told {ally} that yet. I'm waiting for the right moment. Or for my nerve." },
  ] },
  { id: 'pl.a3', turns: [
    { by: 'a', conf: "I don't have some big master plan. I just know {ally} has my back." },
    { by: 'a', conf: "Out here, that's worth more than a plan." },
  ] },
  { id: 'pl.a4', turns: [
    { by: 'a', conf: "Everyone's looking for someone to lean on. Mine is {ally}." },
    { by: 'a', conf: "As long as {ally} doesn't lean away, I'm okay." },
  ] },
  { id: 'pl.a5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{ally} thinks we're friends. We are, kind of." },
    { by: 'a', conf: "But mostly {ally} is standing between me and the vote. And I like it that way." },
  ] },
  { id: 'pl.a6', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I'm not great at the strategy stuff. But I feel safe around {ally}." },
    { by: 'a', conf: "That's a start. Right?" },
  ] },
  { id: 'pl.a7', turns: [
    { by: 'a', conf: "One person here I actually trust. {ally}." },
    { by: 'a', conf: "Everybody else, I'm still working out." },
  ] },
  { id: 'pl.a8', turns: [
    { by: 'a', conf: "If things go wrong for me, I think {ally} would have my back." },
    { by: 'a', conf: "I really, really hope I'm right about that." },
  ] },
  { id: 'pl.a9', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "I win challenges. {ally} handles the people. Together, we're unstoppable." },
  ] },
  { id: 'pl.a10', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Most people here drive me up the wall. Not {ally}. {ally}'s alright." },
    { by: 'a', conf: "So {ally} is who I'm sticking with. End of story." },
  ] },
];
const PRIVATE_TARGET = [
  { id: 'pl.t1', turns: [
    { by: 'a', conf: "I don't have a final two or anything like that. I'm just trying to survive." },
    { by: 'a', conf: "And the person I need to survive is {target}." },
  ] },
  { id: 'pl.t2', turns: [
    { by: 'a', conf: "I don't know who I'm taking to the end yet. But I know who I want gone." },
    { by: 'a', conf: "{target}. Next question." },
  ] },
  { id: 'pl.t3', turns: [
    { by: 'a', conf: "{target} is the biggest problem in my game right now." },
    { by: 'a', conf: "I'm not saying that out loud to anyone. Except you guys. Hi." },
  ] },
  { id: 'pl.t4', turns: [
    { by: 'a', conf: "Everyone's friendly with {target}. I'm friendly with {target}." },
    { by: 'a', conf: "And the second I get the chance, I'm writing {target}'s name down." },
  ] },
  { id: 'pl.t5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "I'll be honest. I can't stand {target}." },
    { by: 'a', conf: "I'm keeping my mouth shut for now. Which, if you know me, is really, really hard." },
  ] },
  { id: 'pl.t6', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "{target} is playing a better game than people realise." },
    { by: 'a', conf: "Which is exactly why {target} can't be here much longer." },
  ] },
];
const PRIVATE_OPEN = [
  { id: 'pl.o1', turns: [
    { by: 'a', conf: "People keep asking me what my plan is. Honestly? I don't have one yet." },
    { by: 'a', conf: "I'm taking it one vote at a time. And praying." },
  ] },
  { id: 'pl.o2', turns: [
    { by: 'a', conf: "No final two. No target. I just want to get through the next vote." },
  ] },
  { id: 'pl.o3', turns: [
    { by: 'a', conf: "I keep getting asked what my plan is. I don't have one yet." },
    { by: 'a', conf: "I'd rather wait and see who I can trust than rush into something stupid." },
  ] },
  { id: 'pl.o4', turns: [
    { by: 'a', conf: "I'm still working out who I can trust. It's way harder than it looks on TV." },
  ] },
  { id: 'pl.o5', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I don't really know what I'm doing yet. I'm watching and learning." },
    { by: 'a', conf: "Mostly watching." },
  ] },
  { id: 'pl.o6', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "My plan is to win challenges. If I keep winning, nobody can vote me out." },
    { by: 'a', conf: "The social stuff I'll figure out later. Probably." },
  ] },
];

const PROBE = [
  { id: 'pl.p1', when: { spot: 'dock' }, turns: [
    { beat: '{a} and {b} are lying on the dock, staring at the clouds.' },
    { by: 'a', say: "Can I ask you something hypothetical?" },
    { by: 'b', say: "If it's about which cloud looks like Chef, it's that one." },
    { by: 'a', say: "Not that. If it came down to the last few of us, where do you think you'd be?" },
    { by: 'b', say: "Hopefully still here." },
    { by: 'a', say: "Me too. I'm just saying. We'd be good together at the end." },
    { by: 'b', say: "Maybe. Ask me again when there's fewer of us." },
  ] },
  { id: 'pl.p2', turns: [
    { by: 'a', say: "Who do you see going far in this game?" },
    { by: 'b', say: "Honestly? I haven't thought about it." },
    { by: 'a', say: "I have. And I keep thinking you're one of them." },
    { by: 'b', say: "Is that a compliment or a warning?" },
    { by: 'a', say: "A compliment. Relax." },
    { by: 'b', say: "Now I'm definitely worried." },
  ] },
  { id: 'pl.p3', turns: [
    { by: 'a', say: "Do you think about the end much?" },
    { by: 'b', say: "Sometimes. Why?" },
    { by: 'a', say: "No reason. I just think we'd work well together." },
    { by: 'b', say: "Are you asking me for a deal?" },
    { by: 'a', say: "No. Not yet. I'm just putting it out there." },
    { by: 'b', say: "Okay. Consider it out there." },
  ] },
  { id: 'pl.p4', turns: [
    { by: 'a', say: "We never talk game, do we?" },
    { by: 'b', say: "Nope. It's kind of nice, actually." },
    { by: 'a', say: "Maybe we should. Not today. Just... sometime." },
    { by: 'b', say: "Sure. Sometime." },
  ] },
  { id: 'pl.p5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'll be honest with you. I'm working out who I want to keep around." },
    { by: 'b', say: "And?" },
    { by: 'a', say: "And you're on the list. That's all I'm saying for now." },
    { by: 'b', say: "That's not much." },
    { by: 'a', say: "It's a start. We can talk more later." },
  ] },
  { id: 'pl.p6', when: { band: 'friends' }, turns: [
    { by: 'a', say: "Can I say something without it being weird?" },
    { by: 'b', say: "It's you. It's going to be weird." },
    { by: 'a', say: "Rude. If we both make it far, I'd want to be up there with you." },
    { by: 'b', say: "Okay, that's not weird. I'd want that too." },
  ] },
  { id: 'pl.p7', turns: [
    { by: 'b', say: "What are you smiling about?" },
    { by: 'a', say: "Just thinking. You're easy to talk to. That matters at the end." },
    { by: 'b', say: "The end? We're nowhere near the end." },
    { by: 'a', say: "I know. I like to think ahead." },
    { by: 'b', say: "Well, think ahead quieter. People are looking." },
  ] },
  { id: 'pl.p8', turns: [
    { by: 'a', say: "Can I ask you something weird?" },
    { by: 'b', say: "That depends on how weird." },
    { by: 'a', say: "If you had to pick one person to trust here, who would it be?" },
    { by: 'b', say: "Nice try. You first." },
    { by: 'a', say: "I'm still deciding. You're in the running, though." },
  ] },
  { id: 'pl.p9', turns: [
    { by: 'a', say: "Do you have anyone you're really close with here?" },
    { by: 'b', say: "Not really. Do you?" },
    { by: 'a', say: "Not yet. Maybe that could change." },
    { by: 'b', say: "Maybe." },
    { beat: 'Neither of them says anything more about it, but neither of them leaves either.' },
  ] },
  { id: 'pl.p10', turns: [
    { by: 'a', say: "I've been watching how you play." },
    { by: 'b', say: "Should I be worried?" },
    { by: 'a', say: "No. I like it. You don't make enemies." },
    { by: 'b', say: "I try not to." },
    { by: 'a', say: "That's the kind of person I want around later." },
  ] },
  { id: 'pl.p11', when: { merged: true }, turns: [
    { by: 'a', say: "Now that the teams are gone, it's a whole new game." },
    { by: 'b', say: "Tell me about it. I don't know who to trust anymore." },
    { by: 'a', say: "Well, I'm going to need people I can count on. You might be one of them." },
    { by: 'b', say: "Might be?" },
    { by: 'a', say: "Let's see how the next vote goes." },
  ] },
  { id: 'pl.p12', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um, can I ask you something about the game?" },
    { by: 'b', say: "Sure." },
    { by: 'a', say: "Do you think we could look out for each other? Not a deal. Just, you know." },
    { by: 'b', say: "Yeah. I think we could do that." },
    { beat: '{a} looks very relieved.' },
  ] },
  { id: 'pl.p13', when: { threat: true }, turns: [
    { by: 'a', say: "Be honest. Who do you think wins this thing?" },
    { by: 'b', say: "If the challenges keep going like this? {threat}." },
    { by: 'a', say: "That's what I'm afraid of. Unless people start working together." },
    { by: 'b', say: "Are you saying you and me?" },
    { by: 'a', say: "I'm not saying anything. Yet." },
  ] },
];

const END_FACE = [
  { id: 'pl.e1', turns: [
    { by: 'a', say: "Can we talk? About our deal." },
    { by: 'b', say: "Uh oh. That's never good." },
    { by: 'a', say: "I don't think it's real anymore. Not after everything." },
    { by: 'b', say: "You're serious?" },
    { by: 'a', say: "I'd rather tell you to your face than pretend." },
    { beat: '{b} stares at {a}, then walks away.' },
  ] },
  { id: 'pl.e2', turns: [
    { by: 'a', say: "I need to be honest with you. The final {size} thing. I can't do it." },
    { by: 'b', say: "Since when?" },
    { by: 'a', say: "Since we stopped getting along. Don't pretend we haven't." },
    { by: 'b', say: "Fine. Then it's off. Happy?" },
    { by: 'a', say: "Not really." },
  ] },
  { id: 'pl.e3', turns: [
    { by: 'b', say: "You've been avoiding me all day." },
    { by: 'a', say: "Yeah. Because I don't know how to say this." },
    { by: 'b', say: "Just say it." },
    { by: 'a', say: "The deal's off. I'm sorry." },
    { by: 'b', say: "Wow. Okay. Good to know." },
  ] },
  { id: 'pl.e4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Let's stop pretending, okay? Our deal is done." },
    { by: 'b', say: "Excuse me?" },
    { by: 'a', say: "You heard me. We can't even sit at the same table anymore." },
    { by: 'b', say: "Fine! I didn't want to sit next to you at the end anyway!" },
    { by: 'a', say: "Great! Then we agree on something!" },
  ] },
  { id: 'pl.e5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "This is really hard to say. I don't think our deal works anymore." },
    { by: 'b', say: "Are you breaking up with me? Game-wise?" },
    { by: 'a', say: "Kind of. I'm sorry. I didn't want to lie to you." },
    { by: 'b', say: "Well, at least you told me. I guess." },
  ] },
  { id: 'pl.e6', turns: [
    { by: 'a', say: "Remember our final {size}?" },
    { by: 'b', say: "Yeah." },
    { by: 'a', say: "I'm calling it off." },
    { by: 'b', say: "Just like that?" },
    { by: 'a', say: "It hasn't felt real for a while. You know that." },
    { beat: "{b} doesn't answer." },
  ] },
];
const END_COLD = [
  { id: 'pl.c1', turns: [
    { by: 'b', say: "Hey. Are we good?" },
    { by: 'a', say: "Yeah. We're fine." },
    { beat: '{a} walks off before {b} can say anything else.' },
    { by: 'a', conf: "I made a final {size} with {b}. That was before {b} started getting on my last nerve." },
  ] },
  { id: 'pl.c2', turns: [
    { by: 'a', conf: "{b} still thinks we have a deal. We don't." },
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
    { by: 'b', conf: "Something's off with {a}. I don't know what, but something's definitely off." },
  ] },
  { id: 'pl.c6', turns: [
    { by: 'a', conf: "{b} and I had a deal. Then {b} kept getting on my nerves." },
    { by: 'a', conf: "So now we don't. {b} just hasn't noticed yet." },
  ] },
];

const BROKEN_CONFRONT = [
  { id: 'pl.k1', turns: [
    { by: 'a', say: "You wrote my name." },
    { by: 'b', say: "What? Who told you that?" },
    { by: 'a', say: "Doesn't matter. You did, didn't you?" },
    { by: 'b', say: "It was just a vote." },
    { by: 'a', say: "We had a final {size}. That's not 'just a vote'." },
    { beat: '{a} storms off.' },
  ] },
  { id: 'pl.k2', turns: [
    { by: 'a', say: "So that's what our deal was worth." },
    { by: 'b', say: "I can explain." },
    { by: 'a', say: "Go on, then. Explain why my name was on your ballot." },
    { by: 'b', say: "I didn't think it would matter. You were safe!" },
    { by: 'a', say: "That's not the point, and you know it." },
  ] },
  { id: 'pl.k3', turns: [
    { by: 'b', say: "Hey, you okay?" },
    { by: 'a', say: "No. I know you voted for me." },
    { beat: "{b} doesn't say anything." },
    { by: 'a', say: "Our final {size} is over. Don't even try." },
    { beat: '{b} opens {b.posAdj} mouth, then closes it again.' },
  ] },
  { id: 'pl.k4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Are you kidding me? You voted for ME?" },
    { by: 'b', say: "Keep your voice down—" },
    { by: 'a', say: "No! We had a deal! Final {size}! And you wrote my name down!" },
    { by: 'b', say: "It wasn't personal!" },
    { by: 'a', say: "It's VERY personal to me!" },
  ] },
  { id: 'pl.k5', when: { register: 'cool' }, turns: [
    { by: 'a', say: "I know you voted for me." },
    { by: 'b', say: "I—" },
    { by: 'a', say: "I'm not going to yell. I just want you to know that I know." },
    { by: 'b', say: "Okay." },
    { by: 'a', say: "Our deal's off. Enjoy the rest of your day." },
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
    { by: 'a', conf: "So that's over. At least now I know where I stand." },
  ] },
  { id: 'pl.l2', turns: [
    { by: 'a', conf: "{b} wrote my name down. After promising me a final {size}." },
    { by: 'a', conf: "I'm not going to say anything. I'm just going to remember it." },
  ] },
  { id: 'pl.l3', turns: [
    { by: 'a', conf: "I really trusted {b}. I thought we were going to the end together." },
    { by: 'a', conf: "And then I find out {b} voted for me. I feel so stupid." },
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
    { by: 'a', conf: "I'll let {b} think I don't know. That's much more useful to me." },
  ] },
];
const BROKEN_GONE = [
  { id: 'pl.g1', turns: [
    { by: 'a', conf: "I found out {b} voted for me before {b} left. We had a final {size}." },
    { by: 'a', conf: "I guess it doesn't matter now. It still stings, though." },
  ] },
  { id: 'pl.g2', turns: [
    { by: 'a', conf: "So {b} wrote my name down. The same {b} who promised me a final {size}." },
    { by: 'a', conf: "Honestly? I'm glad {b}'s gone now." },
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
