// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/slop.js — the have-not week (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/havenot-life.js and house-life's have-nots event.
// {nth} is how many weeks a has been on slop, as a word ("second"); intent
// repeat when it is two or more.
//
//   slop.picked      a and b move into the have-not room; {group} is everyone on slop   scene
//   slop.argument    a and b, both on slop, fight over food (kitchen)                 scene
//   slop.snap        a, on slop, snaps at b, who is eating properly (kitchen)         scene
//   slop.solidarity  a and b, both on slop, get through it together (washroom)        scene
//   slop.resent      a, on slop, blames b, the HOH who picked; {partner} just missed it   scene; intent lucky
//   slop.kitchen     a, on slop, watches the house eat; b keeps a company (kitchen)   scene

export default {
  'slop.picked.scene': [
    { id: 'sl2.p1', turns: [{ beat: '{group} carry their bags into the have-not room.' }, { by: 'a', say: "Is this bed made of metal?" }, { by: 'b', say: "Yes." }] },
    { id: 'sl2.p2', turns: [{ beat: 'The slop comes out.' }, { by: 'a', say: "It's... fine." }, { by: 'b', say: "You haven't tasted it yet." }, { by: 'a', say: "...It's not fine." }] },
    { id: 'sl2.p3', turns: [{ by: 'a', dr: "Cold showers, terrible beds, and a week of watching everyone else eat. Great." }] },
    { id: 'sl2.p4', when: { intent: 'repeat' }, turns: [{ by: 'a', say: "This is my {nth} week on slop." }, { beat: '{b} stops joking.' }] },
    { id: 'sl2.p5', turns: [{ by: 'a', say: "The slop's fine." }, { beat: '{a} has one spoonful and pushes the bowl away.' }, { by: 'b', say: "Here. Have some water." }] },
    { id: 'sl2.p6', turns: [{ by: 'b', say: "At least we're in it together." }, { by: 'a', say: "That's the only good thing about it." }] },
  ],
  'slop.argument.scene': [
    { id: 'sl2.a1', turns: [{ by: 'a', say: "There's one packet of flavouring left." }, { by: 'b', say: "And?" }, { by: 'a', say: "And it's mine." }, { by: 'b', say: "Says who?" }] },
    { id: 'sl2.a2', turns: [{ by: 'a', say: "You had the last of it yesterday." }, { by: 'b', say: "I did not." }, { beat: 'It turns out {b} did not.' }, { by: 'a', say: "...Sorry." }] },
    { id: 'sl2.a3', turns: [{ beat: '{a} measures out the slop very carefully.' }, { by: 'b', say: "That bowl's bigger." }, { by: 'a', say: "It is not." }, { by: 'b', say: "It is." }] },
    { id: 'sl2.a4', turns: [{ by: 'a', say: "I was saving that jar of pickles." }, { by: 'b', say: "I didn't know!" }, { by: 'a', say: "It was behind the milk. On purpose." }] },
    { id: 'sl2.a5', turns: [{ beat: '{b} eats standing up to avoid talking.' }, { by: 'a', say: "We need to talk about the slop." }, { by: 'b', say: "Do we, though?" }] },
    { id: 'sl2.a6', when: { intent: 'repeat' }, turns: [{ by: 'b', say: "Cheer up. It's only slop." }, { by: 'a', say: "It's my {nth} week of it. Don't." }] },
    { id: 'sl2.a7', turns: [{ by: 'b', dr: "We're fighting over pickles. This is what slop does to people." }] },
  ],
  'slop.snap.scene': [
    { id: 'sl2.s1', turns: [{ by: 'b', say: "Have you seen my blue top?" }, { by: 'a', say: "Do I look like I know where your top is?" }, { beat: 'The kitchen goes quiet.' }] },
    { id: 'sl2.s2', turns: [{ beat: '{b} is cooking something that smells amazing.' }, { by: 'a', say: "Could you not do that in here?" }, { by: 'b', say: "It's the kitchen." }] },
    { id: 'sl2.s3', turns: [{ by: 'a', dr: "I've been awake since half four on a metal bed. {b} said good morning far too cheerfully." }] },
    { id: 'sl2.s4', turns: [{ by: 'b', dr: "{a} bit my head off over a sandwich. I'm adding that to the list." }] },
    { id: 'sl2.s5', turns: [{ by: 'a', say: "Sorry. I'm sorry. It's the slop." }, { by: 'b', say: "It's fine." }, { by: 'b', dr: "It's not fine." }] },
    { id: 'sl2.s6', turns: [{ by: 'b', say: "Good morning!" }, { by: 'a', say: "Is it?" }] },
  ],
  'slop.solidarity.scene': [
    { id: 'sl2.d1', turns: [{ beat: '{a} comes out of the cold shower unable to speak.' }, { by: 'b', say: "My turn, isn't it?" }, { by: 'a', say: "...Good luck." }] },
    { id: 'sl2.d2', turns: [{ by: 'a', say: "Thirty seconds in, thirty seconds out." }, { by: 'b', say: "That doesn't help." }, { by: 'a', say: "No. But it's a system." }] },
    { id: 'sl2.d3', turns: [{ by: 'b', say: "The worst part isn't the cold. It's knowing it's coming all day." }, { by: 'a', say: "Exactly." }] },
    { id: 'sl2.d4', turns: [{ by: 'a', dr: "Nobody else in this house knows what this is like. {b} does." }] },
    { id: 'sl2.d5', turns: [{ by: 'a', say: "First meal when we get out?" }, { by: 'b', say: "Burger. A huge one." }, { by: 'a', say: "Chips?" }, { by: 'b', say: "Obviously." }] },
    { id: 'sl2.d6', turns: [{ by: 'a', say: "At least it's you in here with me." }, { by: 'b', say: "...Yeah. Same." }] },
    { id: 'sl2.d7', when: { intent: 'repeat' }, turns: [{ by: 'b', say: "Another week in here together." }, { by: 'a', say: "We should get a plaque." }] },
  ],
  'slop.resent.scene': [
    { id: 'sl2.r1', turns: [{ by: 'a', dr: "The comp decided the bottom. But {b} still had to write the names down." }] },
    { id: 'sl2.r2', turns: [{ by: 'b', say: "It's not personal." }, { by: 'a', say: "Mm." }, { by: 'a', dr: "Three nights on a metal bed. It's personal." }] },
    { id: 'sl2.r3', turns: [{ by: 'a', dr: "I'm not going to complain, or I'm the one who moaned about slop. I'm just going to remember {b}." }] },
    { id: 'sl2.r4', turns: [{ by: 'a', dr: "{b} hasn't been into the have-not room once this week." }] },
    { id: 'sl2.r5', when: { intent: 'lucky' }, turns: [{ by: 'a', dr: "{partner} finished one place above me and is eating a proper dinner. I've thought about that a lot today." }] },
    { id: 'sl2.r6', turns: [{ by: 'a', dr: "I won't forget who put me down here." }] },
    { id: 'sl2.r7', when: { again: true }, turns: [{ by: 'a', dr: "This is my {nth} week on slop. {b} picked me for this one." }] },
  ],
  'slop.kitchen.scene': [
    { id: 'sl2.k1', turns: [{ beat: 'Midnight. Everyone is eating except {a}.' }, { by: 'b', say: "Budge up." }, { beat: '{b} sits down next to {a} without a plate.' }] },
    { id: 'sl2.k2', turns: [{ by: 'b', say: "Want some company?" }, { by: 'a', say: "Only if you're not eating." }, { by: 'b', say: "I'm not." }] },
    { id: 'sl2.k3', turns: [{ by: 'a', say: "I'm fine, honestly. I don't mind watching." }, { beat: '{b} takes {b.posAdj} plate into another room to eat.' }] },
    { id: 'sl2.k4', turns: [{ by: 'a', dr: "{b} stayed up with me until two in the morning. No plate, no reason. Just company." }] },
    { id: 'sl2.k5', turns: [{ by: 'b', say: "Sorry, I'll stop describing my dinner." }, { by: 'a', say: "Please do." }, { beat: 'They talk about anything else.' }] },
    { id: 'sl2.k6', turns: [{ by: 'a', dr: "I'll remember two things about this week. The cold, and {b} keeping me company." }] },
  ],
};
