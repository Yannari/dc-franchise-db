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
  { when: { count: 'tight' }, turns: [
    { by: 'a', say: "Okay, let's actually count. We've got {votes}, and they've got {them}, maybe." },
    { by: 'b', say: "That's basically even." },
    { by: 'a', say: "Which means one person decides tonight, and I want to know who that person is before we walk in." },
    { by: 'b', say: "And if it ties?" },
    { by: 'a', say: "Then it's a revote, and in a revote, people get scared and go with the safe name. We need to be the safe name." },
    { by: 'a', conf: "It's {votes} against {them}. In a vote that close, the plan doesn't matter. The one person who changes their mind matters." },
  ] },
  { when: { count: 'close' }, turns: [
    { by: 'a', say: "Here's the math: we've got {votes} on {target}, and their side's got {them}." },
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
const out = {};
for (const c of CASES) {
  out[`vp2.${c}`] = [
    ...GLUE.map((e, i) => ({ id: `nvs.g${i + 1}.${c}`, ...e })),
    ...MATH.map((e, i) => ({ id: `nvs.m${i + 1}.${c}`, ...e })),
  ];
}
export default out;
