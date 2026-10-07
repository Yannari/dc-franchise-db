// ══════════════════════════════════════════════════════════════════════
// td/script/lines/aside.js — the talk after a moment the engine only narrated
// ══════════════════════════════════════════════════════════════════════
//
// Challenges and twists leave camp events that are one narrator's sentence (js/chal/*.js:
// "Leshawna pulled Courtney from the icy water during the crossing"). The sentence stays as
// the viewer's insight (the opening stage direction); these are what the people in it then
// SAY about it (td/script/write.js scriptLooseEvents). The lines never restate the event:
// the insight already did. They react to it.
//
//   aside.<tone>.any   a is who it happened to or who did it; b is the other person in it
//                      (reason: pair) or the person closest to a, who saw it (reason: watch).
//                      ending: chal (it happened in the challenge) | camp
//   tones: warm (a did something good or kind), tense (a and b clashed, or a did b wrong),
//          shame (a messed up or was embarrassed), romance (a and b, a romantic moment),
//          scheme (a is working an angle), strain (a is hurt, worn out or sick),
//          rally (a pulls everyone together), plain (anything else)
//
// Ids: 'as.'.

const WARM = [
  { id: 'as.w1', turns: [
    { by: 'b', say: "That was really something, {a}." },
    { by: 'a', say: "It was nothing." },
    { by: 'b', say: "It wasn't nothing. People noticed." },
  ] },
  { id: 'as.w2', when: { reason: 'pair' }, turns: [
    { by: 'b', say: "I don't think I said thank you." },
    { by: 'a', say: "You don't have to." },
    { by: 'b', say: "I'm saying it anyway. Thank you." },
  ] },
  { id: 'as.w3', turns: [
    { by: 'a', conf: "I didn't do it for the cameras. I did it because somebody had to." },
    { by: 'b', say: "You're kind of a good person, you know that?" },
    { by: 'a', say: "Don't tell anyone." },
  ] },
  { id: 'as.w4', turns: [
    { by: 'b', say: "Everyone's talking about you." },
    { by: 'a', say: "Good talking or bad talking?" },
    { by: 'b', say: "Good. For once." },
  ] },
  { id: 'as.w5', when: { ending: 'chal' }, turns: [
    { by: 'b', say: "We'd have lost without you out there." },
    { by: 'a', say: "We'd have lost without all of us." },
    { by: 'b', conf: "Humble, too. Ugh. It's hard to vote out someone like that." },
  ] },
  { id: 'as.w6', when: { ending: 'chal' }, turns: [
    { by: 'b', say: "How did you even do that?" },
    { by: 'a', say: "Honestly? I have no idea. I just didn't stop." },
  ] },
  { id: 'as.w7', when: { ending: 'chal', reason: 'pair' }, turns: [
    { by: 'a', say: "Is my arm supposed to bend like this?" },
    { by: 'b', say: "No. But you were amazing." },
    { by: 'a', say: "Worth it." },
  ] },
  { id: 'as.w8', when: { ending: 'camp', reason: 'pair' }, turns: [
    { by: 'b', say: "You didn't have to do that." },
    { by: 'a', say: "I know. I wanted to." },
  ] },
  { id: 'as.w9', when: { reason: 'pair' }, turns: [
    { by: 'b', say: "Okay, I owe you one." },
    { by: 'a', say: "I'm writing that down." },
  ] },
  { id: 'as.w10', when: { reason: 'pair' }, turns: [
    { by: 'b', say: "I won't forget that." },
    { by: 'a', say: "You'd do the same for me." },
    { by: 'b', say: "I would now." },
  ] },
  { id: 'as.w11', when: { reason: 'watch' }, turns: [
    { by: 'b', say: "I saw what you did." },
    { by: 'a', say: "Don't make it a thing." },
    { by: 'b', say: "Too late. It's a thing." },
  ] },
];

const TENSE = [
  { id: 'as.t1', turns: [
    { by: 'b', say: "What was THAT about?" },
    { by: 'a', say: "Don't start." },
    { by: 'b', say: "Oh, I'm starting." },
  ] },
  { id: 'as.t2', turns: [
    { by: 'a', say: "I'm not apologizing." },
    { by: 'b', say: "Nobody asked you to." },
    { by: 'a', say: "Good." },
    { beat: 'Neither of them moves.' },
  ] },
  { id: 'as.t3', turns: [
    { by: 'b', conf: "I'm going to remember that. Maybe not today. But I'm going to remember it." },
    { by: 'a', say: "You've got something to say to me?" },
    { by: 'b', say: "Not yet." },
  ] },
  { id: 'as.t4', turns: [
    { by: 'a', say: "Are we going to have a problem?" },
    { by: 'b', say: "We already have one." },
  ] },
  { id: 'as.t5', when: { reason: 'pair' }, turns: [
    { by: 'b', say: "You did that on purpose." },
    { by: 'a', say: "Prove it." },
    { by: 'b', say: "I don't have to. Everybody saw." },
  ] },
  { id: 'as.t6', when: { reason: 'pair' }, turns: [
    { by: 'b', say: "Back off, {a}." },
    { by: 'a', say: "Or what?" },
    { by: 'b', say: "Keep pushing and find out." },
  ] },
  { id: 'as.t7', when: { reason: 'pair', hot: true }, turns: [
    { by: 'a', say: "You want to go? Let's GO!" },
    { by: 'b', say: "Sit down, {a}. You're embarrassing yourself." },
  ] },
  { id: 'as.t8', when: { reason: 'watch' }, turns: [
    { by: 'b', say: "That's going to come back on you." },
    { by: 'a', say: "Let it." },
    { by: 'b', conf: "{a} has no idea how many people just changed their minds about {a.obj}." },
  ] },
  { id: 'as.t9', when: { reason: 'watch' }, turns: [
    { by: 'b', say: "You okay? That got ugly." },
    { by: 'a', say: "I'm fine. I'm FINE." },
    { by: 'b', say: "Sure." },
  ] },
  { id: 'as.t10', when: { ending: 'chal' }, turns: [
    { by: 'b', say: "We're a team. Or we were, five minutes ago." },
    { by: 'a', say: "Then act like it." },
    { by: 'b', say: "You first." },
  ] },
  { id: 'as.t11', when: { ending: 'camp' }, turns: [
    { by: 'b', say: "This camp is too small for this." },
    { by: 'a', say: "Then stay out of my way." },
  ] },
];

const SHAME = [
  { id: 'as.s1', turns: [
    { by: 'b', say: "So... that happened." },
    { by: 'a', say: "Please don't." },
    { by: 'b', say: "I said nothing!" },
    { by: 'a', say: "You said it with your face." },
  ] },
  { id: 'as.s2', turns: [
    { by: 'a', conf: "If anyone asks, that never happened. If anyone has footage, it also never happened." },
    { by: 'b', say: "Hey. Everyone has bad days." },
    { by: 'a', say: "Not THAT bad." },
  ] },
  { id: 'as.s3', turns: [
    { by: 'b', say: "On a scale of one to ten, how bad do you feel?" },
    { by: 'a', say: "Eleven." },
    { by: 'b', say: "Honestly? Fair." },
  ] },
  { id: 'as.s4', turns: [
    { by: 'a', say: "Is everybody laughing at me?" },
    { by: 'b', say: "Not everybody." },
    { by: 'a', say: "That's not a no." },
  ] },
  { id: 'as.s5', when: { ending: 'chal' }, turns: [
    { by: 'b', say: "It's one challenge. People forget." },
    { by: 'a', say: "People don't forget. People vote." },
    { by: 'b', conf: "{a} isn't wrong." },
  ] },
  { id: 'as.s6', when: { ending: 'chal' }, turns: [
    { by: 'a', say: "I swear I'm better than that." },
    { by: 'b', say: "I know. Just... be better than that tomorrow." },
  ] },
  { id: 'as.s7', when: { ending: 'camp' }, turns: [
    { by: 'b', say: "We are never talking about this again." },
    { by: 'a', say: "Agreed. Ever." },
    { by: 'b', conf: "I'm going to talk about this forever." },
  ] },
  { id: 'as.s8', when: { reason: 'watch', register: 'shy' }, turns: [
    { by: 'a', say: "I just want to disappear." },
    { by: 'b', say: "Then who would I sit with at breakfast?" },
    { by: 'a', say: "...Okay. Fine. I'll stay." },
  ] },
  { id: 'as.s9', when: { reason: 'pair' }, turns: [
    { by: 'b', say: "That was partly my fault." },
    { by: 'a', say: "It was MOSTLY your fault." },
    { by: 'b', say: "Let's say partly." },
  ] },
  { id: 'as.s10', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Whoever laughs first is sleeping outside." },
    { by: 'b', say: "Nobody's laughing." },
    { beat: '{b} is very obviously trying not to laugh.' },
  ] },
];

const ROMANCE = [
  { id: 'as.r1', turns: [
    { by: 'b', say: "So... that happened." },
    { by: 'a', say: "Yeah. It did." },
    { by: 'b', say: "Do you want it to happen again?" },
    { by: 'a', say: "...Maybe." },
  ] },
  { id: 'as.r2', turns: [
    { by: 'a', say: "Everyone's staring at us." },
    { by: 'b', say: "Let them." },
  ] },
  { id: 'as.r3', turns: [
    { by: 'a', conf: "I did not plan on liking anybody out here. That plan is going really badly." },
    { by: 'b', say: "What are you smiling about?" },
    { by: 'a', say: "Nothing. You." },
  ] },
  { id: 'as.r4', when: { reason: 'pair' }, turns: [
    { by: 'b', say: "Are we a thing now?" },
    { by: 'a', say: "Do you want to be a thing?" },
    { by: 'b', say: "I asked first." },
  ] },
  { id: 'as.r5', when: { reason: 'pair' }, turns: [
    { by: 'a', say: "I've wanted to do that for days." },
    { by: 'b', say: "Then why did you wait?" },
    { by: 'a', say: "I'm an idiot, apparently." },
  ] },
  { id: 'as.r6', when: { reason: 'watch' }, turns: [
    { by: 'b', say: "Soooo. You and...?" },
    { by: 'a', say: "Don't." },
    { by: 'b', say: "I'm so happy for you!" },
  ] },
  { id: 'as.r7', when: { reason: 'watch' }, turns: [
    { by: 'b', say: "Be careful. Showmances make you a target." },
    { by: 'a', say: "I know." },
    { by: 'b', say: "Do you, though?" },
  ] },
  { id: 'as.r8', when: { ending: 'chal' }, turns: [
    { by: 'b', say: "In the middle of a challenge? Really?" },
    { by: 'a', say: "It was a moment!" },
    { by: 'b', say: "It was a VERY public moment." },
  ] },
];

const SCHEME = [
  { id: 'as.c1', turns: [
    { by: 'a', say: "Keep this between us." },
    { by: 'b', say: "Keep what between us?" },
    { by: 'a', say: "Exactly." },
  ] },
  { id: 'as.c2', turns: [
    { by: 'b', say: "What are you up to?" },
    { by: 'a', say: "Me? Nothing." },
    { by: 'b', conf: "{a} is never up to nothing." },
  ] },
  { id: 'as.c3', turns: [
    { by: 'a', conf: "Everybody else is thinking about today. I'm thinking about three votes from now." },
    { by: 'b', say: "You've got that look again." },
    { by: 'a', say: "What look?" },
  ] },
  { id: 'as.c4', turns: [
    { by: 'b', say: "So what's the plan?" },
    { by: 'a', say: "The plan is nobody knows there's a plan." },
  ] },
  { id: 'as.c5', when: { reason: 'pair' }, turns: [
    { by: 'a', say: "You and me. We play this smart." },
    { by: 'b', say: "I'm in. Who else?" },
    { by: 'a', say: "Nobody else. That's the smart part." },
  ] },
  { id: 'as.c6', when: { reason: 'pair' }, turns: [
    { by: 'b', say: "If this goes wrong..." },
    { by: 'a', say: "It won't." },
    { by: 'b', say: "But if it does, I never heard of you." },
  ] },
  { id: 'as.c7', when: { reason: 'watch' }, turns: [
    { by: 'b', say: "I see you working, {a}." },
    { by: 'a', say: "I don't know what you mean." },
    { by: 'b', say: "Sure you don't." },
  ] },
  { id: 'as.c8', when: { ending: 'chal' }, turns: [
    { by: 'a', say: "That challenge just told me everything I need to know about who's useful." },
    { by: 'b', say: "And am I useful?" },
    { by: 'a', say: "For now." },
  ] },
  { id: 'as.c9', when: { ending: 'camp' }, turns: [
    { by: 'b', say: "You've been talking to a lot of people today." },
    { by: 'a', say: "I'm friendly." },
    { by: 'b', say: "You're something." },
  ] },
];

const PLAIN = [
  { id: 'as.p1', turns: [
    { by: 'b', say: "Did you see that?" },
    { by: 'a', say: "I was kind of in it." },
    { by: 'b', say: "Right. How was it?" },
  ] },
  { id: 'as.p2', turns: [
    { by: 'a', say: "Today has been a lot." },
    { by: 'b', say: "Every day here is a lot." },
  ] },
  { id: 'as.p3', turns: [
    { by: 'b', say: "What do you think that means for us?" },
    { by: 'a', say: "No idea. Ask me tomorrow." },
  ] },
  { id: 'as.p4', turns: [
    { by: 'a', conf: "Weird day. Not good, not bad. Just weird." },
    { by: 'b', say: "You good?" },
    { by: 'a', say: "Ask me after dinner." },
  ] },
  { id: 'as.p5', when: { ending: 'chal' }, turns: [
    { by: 'b', say: "Who comes up with these challenges?" },
    { by: 'a', say: "Someone who hates us." },
    { by: 'b', say: "Definitely someone who hates us." },
  ] },
  { id: 'as.p6', when: { ending: 'chal' }, turns: [
    { by: 'a', say: "I'm going to be sore for a week." },
    { by: 'b', say: "Same. Worth it, though?" },
    { by: 'a', say: "Ask me in a week." },
  ] },
  { id: 'as.p7', when: { ending: 'camp' }, turns: [
    { by: 'b', say: "Is it just me or is everyone acting strange today?" },
    { by: 'a', say: "Everyone's always acting strange here." },
  ] },
  { id: 'as.p8', when: { reason: 'watch' }, turns: [
    { by: 'b', say: "What was all that about?" },
    { by: 'a', say: "Honestly? I'm still working it out." },
  ] },
  { id: 'as.p9', when: { reason: 'pair' }, turns: [
    { by: 'a', say: "Well, that was something." },
    { by: 'b', say: "Something is one word for it." },
  ] },
];


// strain: a is hurting, worn out or sick; b checks on a
const STRAIN = [
  { id: 'as.x1', turns: [
    { by: 'b', say: "You okay?" },
    { by: 'a', say: "I'm fine." },
    { by: 'b', say: "You don't look fine." },
    { by: 'a', say: "I said I'm fine." },
  ] },
  { id: 'as.x2', turns: [
    { by: 'b', say: "Sit down for a second. Drink something." },
    { by: 'a', say: "If I sit down, I'm not getting back up." },
  ] },
  { id: 'as.x3', turns: [
    { by: 'a', conf: "Everything hurts. Things I didn't know I had hurt." },
    { by: 'b', say: "Need a hand?" },
    { by: 'a', say: "I need a new body." },
  ] },
  { id: 'as.x4', turns: [
    { by: 'b', say: "Nobody's going to think less of you if you take a break." },
    { by: 'a', say: "Everybody's going to think less of me. That's how this game works." },
  ] },
  { id: 'as.x5', when: { ending: 'chal' }, turns: [
    { by: 'b', say: "You can stop, you know." },
    { by: 'a', say: "Not until it's over." },
    { by: 'b', conf: "Stubborn. I respect it. I'm also worried about it." },
  ] },
  { id: 'as.x6', when: { ending: 'chal' }, turns: [
    { by: 'a', say: "How much longer is this thing?" },
    { by: 'b', say: "Don't ask. It's worse if you know." },
  ] },
  { id: 'as.x7', when: { ending: 'camp' }, turns: [
    { by: 'b', say: "Go lie down. I'll cover for you." },
    { by: 'a', say: "Thanks. I owe you." },
  ] },
  { id: 'as.x8', when: { reason: 'watch', register: 'fiery' }, turns: [
    { by: 'b', say: "Need anything?" },
    { by: 'a', say: "Yeah. For everyone to stop asking if I need anything." },
  ] },
];

// rally: a pulls everyone together; b answers
const RALLY = [
  { id: 'as.y1', turns: [
    { by: 'b', say: "Okay. That was a good speech." },
    { by: 'a', say: "It wasn't a speech." },
    { by: 'b', say: "It was a little bit of a speech." },
  ] },
  { id: 'as.y2', turns: [
    { by: 'b', say: "Do you actually believe that, or are you just saying it?" },
    { by: 'a', say: "Does it matter? It's working." },
  ] },
  { id: 'as.y3', turns: [
    { by: 'b', say: "I'd follow you." },
    { by: 'a', say: "Into what?" },
    { by: 'b', say: "Don't ruin it." },
  ] },
  { id: 'as.y4', turns: [
    { by: 'b', conf: "When {a} talks like that, people listen. That's either great for us, or a reason to worry." },
    { by: 'a', say: "Come on, everybody. Let's go!" },
  ] },
  { id: 'as.y5', when: { ending: 'chal' }, turns: [
    { by: 'a', say: "We're not done yet!" },
    { by: 'b', say: "You heard {a.obj}. Move!" },
  ] },
  { id: 'as.y6', when: { ending: 'chal' }, turns: [
    { by: 'b', say: "Where did that come from?" },
    { by: 'a', say: "Somebody had to say it." },
  ] },
  { id: 'as.y7', when: { ending: 'camp' }, turns: [
    { by: 'b', say: "You should be a coach or something." },
    { by: 'a', say: "Or something." },
  ] },
  { id: 'as.y8', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "People love a leader. People also vote out leaders. I just need them to love me a little longer." },
    { by: 'b', say: "Great pep talk, {a}." },
  ] },
];

export default {
  'aside.warm.any': WARM, 'aside.tense.any': TENSE, 'aside.shame.any': SHAME,
  'aside.romance.any': ROMANCE, 'aside.scheme.any': SCHEME, 'aside.plain.any': PLAIN,
  'aside.strain.any': STRAIN, 'aside.rally.any': RALLY,
};
