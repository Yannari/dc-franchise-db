// ══════════════════════════════════════════════════════════════════════
// td/script/lines/caught.js — a flip the alliance caught (camp-events.js DETECTED BETRAYAL RECKONING)
// ══════════════════════════════════════════════════════════════════════
//
// Written in two parts (write.js scriptEventParts):
//   caught.face.<approach>   — {b} confronts {a}, who answers the way the engine
//     decided (alliances.js resolveAllianceRepair): 'apology', 'explain' (the
//     strategic case), 'refusal' (won't apologise), 'denial', 'none' (no attempt).
//     The part stops before anyone decides anything.
//   caught.verdict.<outcome> — {b} gives the group's answer: 'forgiven', 'truce'
//     (they'll vote with {a} when they must, but no more plans), 'fracture',
//     'rejected', 'none'.
//   caught.alone.<outcome>   — nobody from the alliance is left in camp to say it,
//     so {a} tells the camera where it stands.
// result 'victim': {b} is the ally {a} voted against ("you wrote MY name").
// Optional names: {group} (the alliance's name), {wrote}, {plan}, {fallen} (the
// ally who went home because of it). Ids: 'cg.'.
const V = { result: 'victim' };

const FACE_APOLOGY = [
  { id: 'cg.a1', turns: [
    { by: 'b', say: "So. Are you going to say anything, or just pretend last night didn't happen?" },
    { by: 'a', say: "I'm sorry. I really am. I panicked, and I made the wrong call." },
    { by: 'b', say: "You think 'sorry' fixes it?" },
    { by: 'a', say: "No. But I'm saying it anyway, because I mean it." },
  ] },
  { id: 'cg.a2', when: V, turns: [
    { by: 'b', say: "You wrote my name. MY name." },
    { by: 'a', say: "I know. And I hate that I did it." },
    { by: 'b', say: "Then why did you?" },
    { by: 'a', say: "Because I was scared and I wasn't thinking. I'm sorry. I'm so sorry." },
  ] },
  { id: 'cg.a3', turns: [
    { beat: '{a} walks straight up to {b} before {b} can walk away.' },
    { by: 'a', say: "Before you say anything: I messed up. I broke the plan, and I own that." },
    { by: 'b', say: "Wow. Okay. I was not expecting that." },
    { by: 'a', say: "I'd rather be honest than keep sneaking around." },
  ] },
  { id: 'cg.a4', when: { group: true }, turns: [
    { by: 'b', say: "{group} trusted you. We all did." },
    { by: 'a', say: "I know. And I broke that. I'm not going to make excuses." },
    { by: 'b', say: "Good, because I'm not in the mood for excuses." },
    { by: 'a', say: "Then here's the truth. I'm sorry, and it won't happen again." },
  ] },
  { id: 'cg.a5', when: { fallen: true }, turns: [
    { by: 'b', say: "{fallen} is gone because of you." },
    { by: 'a', say: "I know. I think about it every second." },
    { by: 'b', say: "Good. You should." },
    { by: 'a', say: "I'm sorry. To you, and to {fallen}." },
  ] },
  { id: 'cg.a6', turns: [
    { by: 'b', say: "Why? Just tell me why." },
    { by: 'a', say: "Because I thought it was me or them, and I chose me. And it was wrong." },
    { by: 'b', say: "At least you're admitting it." },
    { by: 'a', say: "I'm sorry. That's all I've got." },
  ] },
];
const FACE_EXPLAIN = [
  { id: 'cg.e1', turns: [
    { by: 'b', say: "Give me one good reason I shouldn't vote you out next." },
    { by: 'a', say: "I'll give you three. I needed to make a move, it worked, and I'm still more use to you than against you." },
    { by: 'b', say: "That's not an apology." },
    { by: 'a', say: "It's not meant to be. It's the truth." },
  ] },
  { id: 'cg.e2', when: { plan: true }, turns: [
    { by: 'b', say: "We said {plan}. You knew we said {plan}." },
    { by: 'a', say: "And {plan} would've come back to bite us. I saw something you didn't." },
    { by: 'b', say: "So you decided for all of us?" },
    { by: 'a', say: "Somebody had to." },
  ] },
  { id: 'cg.e3', turns: [
    { by: 'b', say: "You broke the plan." },
    { by: 'a', say: "I changed the plan. There's a difference." },
    { by: 'b', say: "Not from where I'm standing." },
    { by: 'a', say: "Then stand somewhere else for a minute and actually think about it." },
  ] },
  { id: 'cg.e4', when: V, turns: [
    { by: 'b', say: "You voted for me. Explain that." },
    { by: 'a', say: "It was a safety vote. You were never going home. I knew that." },
    { by: 'b', say: "That's a fancy way of saying you voted for me." },
    { by: 'a', say: "It's the way the game works. I'm not going to pretend it isn't." },
  ] },
  { id: 'cg.e5', turns: [
    { by: 'b', say: "Do you even feel bad about it?" },
    { by: 'a', say: "Honestly? I feel like I made the right call. Ask me again in a week." },
    { by: 'b', say: "Unbelievable." },
    { by: 'a', say: "Look, I'm still here, and so are you. That was the point." },
  ] },
  { id: 'cg.e6', when: { group: true }, turns: [
    { by: 'b', say: "{group} had a plan, and you blew it up." },
    { by: 'a', say: "{group} had a bad plan. I fixed it." },
    { by: 'b', say: "Nobody asked you to fix anything!" },
    { by: 'a', say: "That's exactly why I had to." },
  ] },
];
const FACE_REFUSAL = [
  { id: 'cg.r1', turns: [
    { by: 'b', say: "Don't you think you owe us an apology?" },
    { by: 'a', say: "No." },
    { by: 'b', say: "No?!" },
    { by: 'a', say: "I made a move. It's a game. I'm not sorry, so I'm not going to say I am." },
  ] },
  { id: 'cg.r2', turns: [
    { by: 'b', say: "Everyone knows what you did." },
    { by: 'a', say: "Good. Saves me explaining it." },
    { by: 'b', say: "That's all you've got to say?" },
    { by: 'a', say: "Yep." },
  ] },
  { id: 'cg.r3', when: V, turns: [
    { by: 'b', say: "You wrote my name, and you're just going to sit there eating?" },
    { by: 'a', say: "I'm hungry. What do you want me to do, cry?" },
    { by: 'b', say: "An apology would be a start!" },
    { by: 'a', say: "Well, you're not getting one." },
  ] },
  { id: 'cg.r4', turns: [
    { by: 'b', say: "So you're not even going to try to explain?" },
    { by: 'a', say: "Why would I? You've already made up your mind." },
    { by: 'b', say: "Maybe I'd change it if you said something." },
    { by: 'a', say: "Doubt it." },
  ] },
  { id: 'cg.r5', when: { group: true }, turns: [
    { by: 'b', say: "{group} wants an explanation." },
    { by: 'a', say: "{group} can want whatever it likes." },
    { by: 'b', say: "Are you serious right now?" },
    { by: 'a', say: "Completely. I did what I did. Deal with it." },
  ] },
  { id: 'cg.r6', turns: [
    { by: 'b', say: "Say sorry. Just say it." },
    { by: 'a', say: "I'm not sorry, though. That'd be lying, and you hate liars, right?" },
    { by: 'b', say: "Oh, don't you DARE." },
    { beat: '{a} shrugs and goes back to eating.' },
  ] },
];
const FACE_DENIAL = [
  { id: 'cg.d1', turns: [
    { by: 'b', say: "We know you flipped." },
    { by: 'a', say: "What? I didn't flip! I voted with you!" },
    { by: 'b', say: "The votes say otherwise." },
    { by: 'a', say: "Then somebody else is lying, because it wasn't me." },
  ] },
  { id: 'cg.d2', when: V, turns: [
    { by: 'b', say: "You voted for me." },
    { by: 'a', say: "I would never vote for you! Who told you that?" },
    { by: 'b', say: "Nobody had to tell me. I can count." },
    { by: 'a', say: "Then you counted wrong!" },
  ] },
  { id: 'cg.d3', turns: [
    { by: 'b', say: "Just admit it." },
    { by: 'a', say: "There's nothing to admit!" },
    { by: 'b', say: "Everyone knows. You're the only one who doesn't seem to." },
    { by: 'a', say: "Because it didn't happen!" },
  ] },
  { id: 'cg.d4', when: { plan: true }, turns: [
    { by: 'b', say: "Everyone wrote {plan}. Except you." },
    { by: 'a', say: "I wrote {plan}! I swear on my life!" },
    { by: 'b', say: "Your life's not worth much around here right now." },
    { by: 'a', say: "I'm telling the truth!" },
  ] },
  { id: 'cg.d5', turns: [
    { by: 'b', say: "Look me in the eye and tell me you didn't flip." },
    { by: 'a', say: "I didn't flip." },
    { by: 'b', say: "You looked at my forehead." },
    { by: 'a', say: "That's... close to your eye!" },
  ] },
  { id: 'cg.d6', when: { group: true }, turns: [
    { by: 'b', say: "{group} knows it was you." },
    { by: 'a', say: "{group} is wrong. Somebody's setting me up." },
    { by: 'b', say: "Who? Who would bother?" },
    { by: 'a', say: "I don't know! But it wasn't me!" },
  ] },
];
// No repair: the alliance is gone or has already cut {a} loose. One full scene, verdict included.
const FACE_NONE = [
  { id: 'cg.n1', turns: [
    { by: 'b', say: "We know what you did last night." },
    { beat: "{a} doesn't say anything." },
    { by: 'b', say: "Nothing? Really? Not even a fake apology?" },
    { by: 'a', say: "Would it change anything?" },
    { by: 'b', say: "No. You're out. Don't bother sitting with us." },
  ] },
  { id: 'cg.n2', turns: [
    { by: 'b', say: "You broke the alliance." },
    { by: 'a', say: "I don't want to talk about it." },
    { by: 'b', say: "Good, because we're done talking to you." },
    { beat: '{b} turns {b.posAdj} back on {a}.' },
  ] },
  { id: 'cg.n3', turns: [
    { by: 'b', say: "Everyone knows you flipped." },
    { by: 'a', say: "Okay." },
    { by: 'b', say: "'Okay'? That's it? You blew everything up, and all you've got is 'okay'?" },
    { by: 'a', say: "What do you want me to say?" },
    { by: 'b', say: "Nothing. There's nothing left to say. You're on your own." },
  ] },
  { id: 'cg.n4', when: V, turns: [
    { by: 'b', say: "You wrote my name." },
    { beat: '{a} looks away.' },
    { by: 'b', say: "Can't even look at me. Great." },
    { by: 'a', say: "It was just a vote." },
    { by: 'b', say: "Then I hope you enjoy the next one. Because you're not voting with us." },
  ] },
  { id: 'cg.n5', turns: [
    { by: 'b', say: "So you're just going to walk around like nothing happened?" },
    { by: 'a', say: "Pretty much." },
    { by: 'b', say: "Fine. Then nothing's going to happen for you anymore. No deals. No plans. Nothing." },
    { by: 'a', say: "I'll survive." },
    { by: 'b', say: "We'll see about that." },
  ] },
  { id: 'cg.n6', turns: [
    { by: 'b', say: "Are you going to explain last night or what?" },
    { by: 'a', say: "No." },
    { by: 'b', say: "Fine. Then I'll explain it to everybody else." },
    { beat: '{b} heads straight for the others. {a} watches {b.obj} go.' },
  ] },
  { id: 'cg.n7', when: { fallen: true }, turns: [
    { by: 'b', say: "{fallen} went home because of you." },
    { by: 'a', say: "{fallen} would've done the same to me." },
    { by: 'b', say: "No, {fallen} wouldn't. That's the difference between you two." },
    { beat: '{b} walks away. Nobody else comes over to sit with {a}.' },
  ] },
  { id: 'cg.n8', when: { register: 'schemer' }, turns: [
    { by: 'b', say: "We know it was you." },
    { by: 'a', say: "Congratulations. Do you want a prize?" },
    { by: 'b', say: "I want you gone. And I'm going to get it." },
    { by: 'a', say: "Good luck with that." },
  ] },
];

const V_FORGIVEN = [
  { id: 'cg.vf1', turns: [
    { by: 'b', say: "Okay. One more chance. One." },
    { by: 'a', say: "That's all I need." },
  ] },
  { id: 'cg.vf2', turns: [
    { by: 'b', say: "I'm still mad at you. But I get it. We're okay." },
    { beat: '{a} lets out a breath {a.sub} had been holding.' },
  ] },
  { id: 'cg.vf3', turns: [
    { by: 'b', say: "Everyone talked about it. We're giving you another shot." },
    { by: 'a', say: "Thank you. Really." },
    { by: 'b', say: "Don't make us regret it." },
  ] },
  { id: 'cg.vf4', turns: [
    { by: 'b', say: "Fine. You're forgiven. Mostly." },
    { by: 'a', say: "I'll take mostly." },
  ] },
  { id: 'cg.vf5', turns: [
    { by: 'b', say: "If you'd lied to me, I'd be done. But you didn't. So we're good." },
    { by: 'a', say: "We're good?" },
    { by: 'b', say: "We're good. For now." },
  ] },
  { id: 'cg.vf6', when: { group: true }, turns: [
    { by: 'b', say: "{group} is still {group}. You're still in it." },
    { by: 'a', say: "Thank you. I won't mess it up again." },
  ] },
];
const V_TRUCE = [
  { id: 'cg.vt1', turns: [
    { by: 'b', say: "We'll still vote with you when we need the numbers. But you're not hearing our plans anymore." },
    { by: 'a', say: "That's fair, I guess." },
  ] },
  { id: 'cg.vt2', turns: [
    { by: 'b', say: "Half of us want you gone. The other half think we still need you." },
    { by: 'a', say: "And which half are you?" },
    { by: 'b', say: "Still deciding." },
  ] },
  { id: 'cg.vt3', turns: [
    { by: 'b', say: "We can work together. We just can't be friends anymore." },
    { beat: "{b} walks away. {a} doesn't follow." },
  ] },
  { id: 'cg.vt4', turns: [
    { by: 'b', say: "You're useful. That's the only reason you're still in." },
    { by: 'a', say: "I'll take it." },
  ] },
  { id: 'cg.vt5', turns: [
    { by: 'b', say: "We'll keep you around. But you're on probation." },
    { by: 'a', say: "Probation. Seriously." },
    { by: 'b', say: "Seriously." },
  ] },
  { id: 'cg.vt6', when: { group: true }, turns: [
    { by: 'b', say: "You're still technically in {group}. Emphasis on technically." },
    { by: 'a', say: "Got it." },
  ] },
];
const V_FRACTURE = [
  { id: 'cg.vx1', turns: [
    { by: 'b', say: "We're done. Don't talk to me about the vote ever again." },
    { beat: '{b} storms off.' },
  ] },
  { id: 'cg.vx2', turns: [
    { by: 'b', say: "You know what? Don't bother. Nobody believes you anymore." },
    { by: 'a', say: "Fine. Your loss." },
  ] },
  { id: 'cg.vx3', turns: [
    { by: 'b', say: "Whatever we had, it's over." },
    { by: 'a', say: "Wow. Okay." },
    { by: 'b', say: "You did this. Not me." },
  ] },
  { id: 'cg.vx4', turns: [
    { by: 'b', say: "I used to trust you. Now I don't even want to sit near you." },
    { beat: '{b} picks up {b.posAdj} things and moves across the camp.' },
  ] },
  { id: 'cg.vx5', turns: [
    { by: 'b', say: "You're out. Of everything." },
    { by: 'a', say: "You can't just—" },
    { by: 'b', say: "Watch me." },
  ] },
  { id: 'cg.vx6', when: { group: true }, turns: [
    { by: 'b', say: "As far as {group} is concerned, you don't exist." },
    { by: 'a', say: "Fine. I didn't need {group} anyway." },
  ] },
];
const V_REJECTED = [
  { id: 'cg.vr1', turns: [
    { by: 'b', say: "I don't believe a word you're saying." },
    { by: 'a', say: "Then I don't know what else to tell you." },
  ] },
  { id: 'cg.vr2', turns: [
    { by: 'b', say: "Nice try. Nobody's buying it." },
    { beat: '{b} turns and leaves {a} standing there.' },
  ] },
  { id: 'cg.vr3', turns: [
    { by: 'b', say: "Save it. We're not talking strategy with you anymore." },
    { by: 'a', say: "So that's it?" },
    { by: 'b', say: "That's it." },
  ] },
  { id: 'cg.vr4', turns: [
    { by: 'b', say: "You had your chance to explain. That wasn't it." },
    { by: 'a', say: "Come on!" },
  ] },
  { id: 'cg.vr5', turns: [
    { by: 'b', say: "I'm not angry. I'm just never telling you anything again." },
    { by: 'a', say: "That's worse." },
    { by: 'b', say: "I know." },
  ] },
  { id: 'cg.vr6', when: { group: true }, turns: [
    { by: 'b', say: "{group} heard you out. The answer's no." },
    { beat: '{a} watches {b} go.' },
  ] },
];

const ALONE_FORGIVEN = [
  { id: 'cg.lf1', turns: [
    { by: 'a', conf: "They caught me. I said sorry. And somehow, they forgave me." },
    { by: 'a', conf: "I'm not going to waste it." },
  ] },
  { id: 'cg.lf2', turns: [
    { by: 'a', conf: "I thought I was finished. Turns out people can be nicer than I deserve." },
  ] },
  { id: 'cg.lf3', turns: [
    { by: 'a', conf: "Everyone knows I flipped. And they're letting it go. Mostly." },
    { by: 'a', conf: "I'll take mostly." },
  ] },
  { id: 'cg.lf4', turns: [
    { by: 'a', conf: "I owned it, and it worked. Being honest out here is weird. But it worked." },
  ] },
  { id: 'cg.lf5', when: { group: true }, turns: [
    { by: 'a', conf: "{group} gave me a second chance. I didn't think they would." },
  ] },
  { id: 'cg.lf6', turns: [
    { by: 'a', conf: "Second chances don't come around much in this game. I just got one." },
  ] },
];
const ALONE_TRUCE = [
  { id: 'cg.lt1', turns: [
    { by: 'a', conf: "They'll still vote with me. They just won't tell me anything." },
    { by: 'a', conf: "It's a start. A bad start, but a start." },
  ] },
  { id: 'cg.lt2', turns: [
    { by: 'a', conf: "I'm still in the alliance. On paper." },
  ] },
  { id: 'cg.lt3', turns: [
    { by: 'a', conf: "Nobody's kicking me out. Nobody's inviting me in, either." },
  ] },
  { id: 'cg.lt4', turns: [
    { by: 'a', conf: "They need my vote, so they're putting up with me. That's fine. I need theirs too." },
  ] },
  { id: 'cg.lt5', when: { group: true }, turns: [
    { by: 'a', conf: "{group} and I still vote together. That's all it is now." },
  ] },
  { id: 'cg.lt6', turns: [
    { by: 'a', conf: "Every conversation stops when I walk up. But they still sit with me. Weird." },
  ] },
];
const ALONE_FRACTURE = [
  { id: 'cg.lx1', turns: [
    { by: 'a', conf: "So that's over. Everyone I used to work with won't even look at me." },
    { by: 'a', conf: "Time to find new friends. Fast." },
  ] },
  { id: 'cg.lx2', turns: [
    { by: 'a', conf: "I tried to explain. It didn't work. Now I'm on my own." },
  ] },
  { id: 'cg.lx3', turns: [
    { by: 'a', conf: "I burned that bridge. Completely. There's nothing left of it." },
  ] },
  { id: 'cg.lx4', turns: [
    { by: 'a', conf: "They're done with me. Honestly? I might be done with them too." },
  ] },
  { id: 'cg.lx5', when: { group: true }, turns: [
    { by: 'a', conf: "I'm out of {group}. Officially. They made sure everyone knows." },
  ] },
  { id: 'cg.lx6', turns: [
    { by: 'a', conf: "Lesson learned. If you're going to flip, don't get caught." },
  ] },
];
const ALONE_REJECTED = [
  { id: 'cg.lr1', turns: [
    { by: 'a', conf: "I told them my side. They didn't believe me." },
    { by: 'a', conf: "So now I'm the bad guy. Great." },
  ] },
  { id: 'cg.lr2', turns: [
    { by: 'a', conf: "Nobody's listening to me anymore. Doesn't matter what I say." },
  ] },
  { id: 'cg.lr3', turns: [
    { by: 'a', conf: "I explained everything. They just looked at me like I was lying." },
  ] },
  { id: 'cg.lr4', turns: [
    { by: 'a', conf: "They've decided what happened. My version doesn't count." },
  ] },
  { id: 'cg.lr5', when: { group: true }, turns: [
    { by: 'a', conf: "{group} heard me out and said no. I'm officially on the outside." },
  ] },
  { id: 'cg.lr6', turns: [
    { by: 'a', conf: "I'd try again, but I don't think anybody would even let me finish a sentence." },
  ] },
];
const ALONE_NONE = [
  { id: 'cg.ln1', turns: [
    { by: 'a', conf: "Everyone knows I flipped. I'm not going to beg." },
  ] },
  { id: 'cg.ln2', turns: [
    { by: 'a', conf: "I got caught. Oh well. I'd do it again." },
  ] },
  { id: 'cg.ln3', turns: [
    { by: 'a', conf: "People keep staring at me. Let them stare." },
  ] },
  { id: 'cg.ln4', turns: [
    { by: 'a', conf: "I knew there'd be fallout. I didn't think it would be this cold, though." },
  ] },
  { id: 'cg.ln5', when: { group: true }, turns: [
    { by: 'a', conf: "{group} knows what I did. I'm not explaining myself to anybody." },
  ] },
  { id: 'cg.ln6', turns: [
    { by: 'a', conf: "Yeah, I flipped. Yeah, they know. Next question." },
  ] },
];

export default {
  'caught.face.apology': FACE_APOLOGY,
  'caught.face.explain': FACE_EXPLAIN,
  'caught.face.refusal': FACE_REFUSAL,
  'caught.face.denial': FACE_DENIAL,
  'caught.face.none': FACE_NONE,
  'caught.verdict.forgiven': V_FORGIVEN,
  'caught.verdict.truce': V_TRUCE,
  'caught.verdict.fracture': V_FRACTURE,
  'caught.verdict.rejected': V_REJECTED,
  'caught.alone.forgiven': ALONE_FORGIVEN,
  'caught.alone.truce': ALONE_TRUCE,
  'caught.alone.fracture': ALONE_FRACTURE,
  'caught.alone.rejected': ALONE_REJECTED,
  'caught.alone.none': ALONE_NONE,
};
