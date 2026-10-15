// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-vp-specific.js — vote talk that says the specific thing: the glue, the math
// ══════════════════════════════════════════════════════════════════════
// The user's Disventure Camp read, 2026-10-10: the game talk there is concrete. "Aiden connects Gabby and
// Tom to Lake and Rosa. Cut him out, and that group is toast." "As long as we all vote Fiore, the worst
// case is a tiebreaker any of us could win." Ours said "{target} has to go" and why, loosely.
//   glue  the target is close to {glueA} and {glueB}, who aren't close to each other (director.js voteTalk)
//   count 'tight' / 'close' / 'enough' / 'all': our {votes} against their {them}
// The same scenes sit in every reason's pool (a reason's own pool is tried before any '.any'), each with
// its own id; the fact gates keep them to the nights they're true.

const GLUE = [
  { when: { glue: true }, turns: [
    { by: 'a', say: "Think about who {target} actually is in this game, not as a person, but as a position." },
    { by: 'b', say: "What do you mean, the position?" },
    { by: 'a', say: "{glueA} and {glueB} barely talk to each other. The only thing they have in common is {target}." },
    { by: 'b', say: "So if {target} goes..." },
    { by: 'a', say: "Then {glueA} and {glueB} are just two people who don't trust each other, and that whole group falls apart." },
    { by: 'b', say: "That's actually kind of brilliant." },
    { by: 'a', say: "It's not brilliant. It's just looking at who's holding the thing together." },
    { by: 'a', conf: "You don't beat a group by voting out its loudest person. You find the one person everybody's connected through, and you cut there." },
  ] },
  { when: { glue: true }, turns: [
    { by: 'b', say: "Why {target}? {target} hasn't done anything to us." },
    { by: 'a', say: "Because {target} is the glue. Watch who {target} eats with: {glueA} at breakfast, and {glueB} at dinner." },
    { by: 'b', say: "And {glueA} and {glueB} never sit together, do they?" },
    { by: 'a', say: "Never. {target} is the bridge between them, and if you take out the bridge, everybody's stuck on their own side." },
    { by: 'b', say: "Okay, I see it now. I really do." },
    { by: 'b', conf: "I thought we'd go after somebody loud. Instead we're going after the one person holding the other side together, and honestly, that's scarier." },
  ] },
];
const MATH = [
  { when: { count: 'behind' }, turns: [
    { by: 'a', say: "Okay, let's actually count. It's {us}, so that's {votes}. They've got {theirSide}, so that's {them}." },
    { by: 'b', say: "That's not close. That's bad." },
    { by: 'a', say: "I know. So we don't need a better plan, we need more people." },
    { by: 'b', say: "From where?" },
    { by: 'a', say: "From their side. Somebody over there is scared of being next, and we have to find them before tonight." },
    { by: 'a', conf: "It's {votes} against {them}. Unless somebody over there flips, this vote isn't ours to decide." },
  ] },
  { when: { count: 'tight' }, turns: [
    { by: 'a', say: "Okay, let's actually count. It's {us}, so that's {votes}. They've got {theirSide}, so that's {them}, maybe." },
    { by: 'b', say: "That's basically even." },
    { by: 'a', say: "Which means one person decides tonight, and I want to know who that person is before we walk in." },
    { by: 'b', say: "And if it ties?" },
    { by: 'a', say: "Then it's a revote, and in a revote, people get scared and go with the safe name. We need to be the safe name." },
    { by: 'a', conf: "It's {votes} against {them}. In a vote that close, the plan doesn't matter. The one person who changes their mind matters." },
  ] },
  { when: { count: 'close' }, turns: [
    { by: 'a', say: "Here's the math. It's {us} on {target}, that's {votes}. And they've got {theirSide}, so {them}." },
    { by: 'b', say: "So we're fine." },
    { by: 'a', say: "We're fine if nobody moves. One flip and it's a tie, and two flips means it's one of us." },
    { by: 'b', say: "So who's the one most likely to flip?" },
    { by: 'a', say: "That's the question I'm going to spend the rest of the afternoon answering." },
    { by: 'b', conf: "{a} has counted the vote about forty times today. I'm glad somebody has, honestly." },
  ] },
  { when: { count: ['enough', 'all'] }, turns: [
    { by: 'a', say: "Even if one of ours flips, we've still got the numbers. Worst case, it's {target} by one." },
    { by: 'b', say: "And best case?" },
    { by: 'a', say: "Best case, {target} doesn't even see it coming, and we don't have to talk about it tomorrow." },
    { by: 'b', say: "I like that case." },
    { by: 'a', conf: "I like a vote with a little room in it. If somebody gets cold feet, we still win, and they still look like they were with us." },
  ] },
];
const CASES = ['threat', 'numbers', 'group', 'grudge', 'outsider', 'sank', 'pair', 'coming', 'idol'];
// A side the viewer has never seen form (director.js planTalk, fact sides false): instead of counting it, the
// scene forms it, on camera. a says who the side is ({us}), and who the other side is ({theirSide}). The user,
// 2026-10-10: "how is the viewer supposed to know who those 5 and 4 are? We didn't get a setup event."
const FORM = {
  'vp.form.duo': [
    // (the first two episodes only: these are about a camp splitting before anybody has a voting record. Read 2026-10-14:
    // "Everybody's going to say they didn't play the game on day one" aired in episode 6, 2.3 times a season)
    { id: 'nvs.f1', when: { early: true, sideBig: true }, turns: [
      { by: 'a', say: "Can I be honest with you? I think this camp is already splitting in two.", v: { sharp: "Let's not pretend. This camp is already picking sides.", loud: "Okay, real talk. There are two groups out here now, and I want to be in the right one.", soft: "Can I tell you something? I think people are already picking sides, and it scares me a little.", dry: "So, there are two groups now. Nobody announced it, but there are." } },
      { by: 'b', say: "Already? How can you tell?" },
      { by: 'a', say: "Because {theirSide} have barely left each other's side all day. Watch them. They eat together, they whisper together." },
      { by: 'b', say: "So what are you saying?" },
      { by: 'a', say: "I'm saying it should be {us}. We stick together, we vote together, and we're not the easy vote.", v: { sharp: "I'm saying it's {us}, starting right now. We vote together, and they don't get to pick us off.", soft: "I'm saying I'd feel a lot better if it was {us}. Together. Like, for real.", loud: "I'm saying it's {us}! Team! Right now!" } },
      { by: 'b', say: "That's {votes} of us.", v: { dry: "That's {votes}. Not exactly a crowd.", anxious: "That's {votes}. Is {votes} enough?" } },
      { by: 'a', say: "It's {votes} today. By tonight, it's whoever we can get." },
      { by: 'b', say: "Okay. I'm in." },
      { by: 'a', conf: "Everybody's going to say they didn't play this early. I'd rather be the one who did." },
    ] },
    { id: 'nvs.f2', when: { early: true, sideBig: true }, turns: [
      { by: 'b', say: "Why do you keep looking over at {theirSide}?" },
      { by: 'a', say: "They're a group. A real one. They've stuck together from the start, and nobody else has noticed." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "And if we don't do the same thing, they're going to vote us out one at a time, and they'll be nice about it.", v: { sharp: "And if we don't make our own, they'll pick us off one at a time and smile while they do it.", loud: "And if we don't do the same thing, we're toast! Both of us!", soft: "And if we don't look out for each other, nobody else is going to." } },
      { by: 'b', say: "So who's ours?" },
      { by: 'a', say: "It's {us}. That's {votes}. It's not a lot, but it's a start." },
      { by: 'b', say: "Fine. But if this goes wrong, I'm blaming you." },
      { by: 'a', say: "Deal." },
      { by: 'b', conf: "I came out here thinking I'd make friends first and play later. {a} just skipped the friends part." },
    ] },
    // later in the game a side forms from what everybody has watched happen at the votes, not from a first impression
    { id: 'nvs.f3', when: { early: false, sideVoted: true }, turns: [
      { by: 'a', say: "Have you noticed {theirSide} always end up writing the same name?" },
      { by: 'b', say: "Now that you say it, yeah. Every time." },
      { by: 'a', say: "That's not luck. They're voting as a group, and nobody's been calling it that." },
      { by: 'b', say: "So what do we do about it?" },
      { by: 'a', say: "We do the same thing. It's {us}, the same name every time, and tonight that name is {target}." },
      { by: 'b', say: "And if they find out?" },
      { by: 'a', say: "Then they find out when the votes are read." },
      { by: 'a', conf: "Everybody else is still voting on their own, and that's why {theirSide} keep getting their way. Not tonight." },
    ] },
    { id: 'nvs.f4', when: { early: false, sideVoted: true }, turns: [
      { by: 'b', say: "Why do you keep watching who sits with who?" },
      { by: 'a', say: "Because {theirSide} sit together every night, and they vote together every night too." },
      { by: 'b', say: "And we don't." },
      { by: 'a', say: "Not yet. It's {us}, starting now, and our name is {target}." },
      { by: 'b', say: "That's {votes}. Is that enough?" },
      { by: 'a', say: "It's enough if nobody gets cold feet." },
      { by: 'b', conf: "I didn't know I was in an alliance until about a minute ago. Apparently I am." },
    ] },
  ],
  'vp.form.group': [
    { id: 'nvs.fg1', when: { early: true, sideBig: true }, turns: [
      { beat: "{a} waits until everybody else is busy, then pulls {b} and the others away from camp." },
      { by: 'a', say: "Okay, I'm just going to say it. I think we should stick together.", v: { sharp: "I'll keep this short. We're a group now, if you're smart.", loud: "Okay, huddle up. We're a team now. A real one.", soft: "I don't want to be weird about this, but I think we should look out for each other." } },
      { by: 'b', say: "Like an alliance? Already? It's way too early." },
      { by: 'a', say: "Exactly. Because {theirSide} already are one, and they didn't wait around." },
      { by: 'b', say: "How do you know that?" },
      { by: 'a', say: "Because I watched them do it. Same spot at lunch, same whispering, same looks when we walk by." },
      { by: 'a', say: "It's {us}. That's {votes}. If we vote together, nobody picks us off." },
      { by: 'b', say: "...Okay. Yeah. I'm in.", v: { dry: "Fine. It's better than being the first one out.", loud: "I'm in! Let's go!", anxious: "Okay. Yes. I'm in. Please let this work." } },
      { by: 'a', conf: "This early, and I've already got {votes} people. Later they'll all say they didn't want to play this fast. They'll be lying." },
    ] },
    { id: 'nvs.fg2', when: { sideBig: true }, turns: [
      { by: 'b', say: "Why did you drag me all the way out here?" },
      { by: 'a', say: "Because I didn't want {theirSide} to hear this." },
      { by: 'b', say: "Hear what?" },
      { by: 'a', say: "That they're already a group, and if we don't become one too, we're the ones going home." },
      { by: 'b', say: "That's a little paranoid, isn't it?" },
      { by: 'a', say: "Maybe. But I'd rather be paranoid with {votes} people than relaxed on my own. It's {us}. Are we doing this or not?", v: { sharp: "Paranoid is what people call you right before you win. It's {us}. Yes or no?", soft: "Maybe I am. But I'd feel so much safer if it was {us}. Please?" } },
      { by: 'b', say: "We're doing this." },
      { by: 'b', conf: "{a} has a whole plan already. Honestly, I'm a little scared of {a}. But I'd rather be scared on the same side." },
    ] },
    { id: 'nvs.fg3', when: { early: false, sideVoted: true }, turns: [
      { beat: "{a} gets {b} and the others away from camp for a minute." },
      { by: 'a', say: "Every vote so far, {theirSide} have stuck together, and we haven't. That's the whole difference." },
      { by: 'b', say: "So we stick together." },
      { by: 'a', say: "Starting tonight. It's {us}, and the name is {target}." },
      { by: 'b', say: "That's {votes} of us. Okay. I can work with that." },
      { by: 'a', conf: "We've been losing the vote one person at a time. Tonight we vote as a group." },
    ] },
  ],
};

const out = { ...FORM };
for (const c of CASES) {
  out[`vp2.${c}`] = [
    // (one id per reason; the season's once-only rule also reads a scene by its words, write.js keyUses, so a scene used
    // under one reason is used for all: read 2026-10-14, these aired 2.4 times a season)
    ...GLUE.map((e, i) => ({ id: `nvs.g${i + 1}.${c}`, ...e })),
    ...MATH.map((e, i) => ({ id: `nvs.m${i + 1}.${c}`, ...e })),
  ];
}
export default out;
