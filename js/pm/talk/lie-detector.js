// ══════════════════════════════════════════════════════════════════════
// pm/talk/lie-detector.js — before the chair, and after the red light
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%"). The chair itself is built
// from parts (pm/lines/lie-detector.js: the ask, the answer, the light, the
// room); these are the conversations either side of it.
//   lie-write  [a, b, c]  a tells friend b what they'll ask partner c.
//              `of` the worry: fancy-other · behind-back · love · tempted
//   lie-row    [a, b]     after a red light: a was in the chair, b asked.
//              `of`: own-it (a confesses; `what` the secret was: kiss · bed ·
//              pull · promise · said) · deny · broken (a says the machine's wrong)
import { build } from './build.js';

export const LIE_WRITE = build('lie-write', {
  plans: { featured: ['card', 'doubt', 'land?'], short: ['card', 'doubt'] },
  stages: [
    { stage: "The dressing room. {a} has a pen, a card, and a face like it's an exam.", turns: [] },
    { stage: "Sitting on the end of the bed, the card balanced on {a.posAdj} knee.", turns: [] },
  ],
  moves: {
    card: [
      { when: { of: 'fancy-other' }, turns: [
        ['b', "Go on, what are you putting?"],
        ['a', "I'm asking if {c} still has feelings for someone else in here. I know. I know what you're going to say."],
      ] },
      { when: { of: 'fancy-other' }, turns: [
        ['a', "I keep seeing the way {c} looks over at someone when they think I'm not watching. So I'm asking. Straight out."],
        ['b', "Babe."],
      ] },
      { when: { of: 'behind-back' }, turns: [
        ['a', "I'm going to ask if {c}'s done anything behind my back. Since we coupled up. Anything at all."],
        ['b', "Why? Has someone said something to you?"],
        ['a', "No. Nobody's said anything. It's just a feeling, and it won't go away."],
      ] },
      { when: { of: 'behind-back' }, turns: [
        ['a', "If {c}'s been lying to me, I'd rather find out now, on a machine, than on the outside, from a stranger."],
      ] },
      { when: { of: 'tempted' }, turns: [
        ['a', "In here it's easy. It's out there I'm worried about. So I'm asking if {c} would be tempted when we get out."],
        ['b', "Everyone says no to that one."],
        ['a', "That's why there's a machine."],
      ] },
      { when: { of: 'love' }, turns: [
        ['a', "I'm keeping it simple. Does {c} actually love me. That's it. One question."],
        ['b', "That's not simple. That's the biggest one there is."],
      ] },
      { when: { of: 'love' }, stage: "The dressing room. {a} has written one line, and crossed it out twice.", turns: [
        ['a', "What if I ask, and it's not what I want to hear? What do I do then, in front of everyone?"],
      ] },
    ],
    doubt: [
      { turns: [
        ['b', "Do you actually want to know the answer, though? Because you can't un-know it."],
        ['a', "No. But I need to. Those are different things."],
      ] },
      { turns: [
        ['b', "And if it goes red?"],
        ['a', "Then it goes red, and at least I'll know I wasn't going mad."],
      ] },
      { turns: [
        ['b', "Just remember those machines get it wrong. Everyone knows they get it wrong."],
        ['a', "Then it can get it wrong in my favour. Pass me the pen."],
      ] },
      { turns: [
        ['b', "You could write something easy. Something nice. Favourite food."],
        ['a', "I'm not wasting it on favourite food."],
      ] },
    ],
    land: [
      { turns: [], beat: "{a} folds the card in half, and then in half again." },
      { turns: [], beat: "{b} gives {a} a squeeze, and doesn't say good luck, because they both know it isn't luck." },
    ],
  },
});

export const LIE_ROW = build('lie-row', {
  tiered: false,
  plans: { featured: ['open', 'answer', 'push', 'land'], short: ['open', 'answer', 'land'] },
  moves: {
    open: [
      { stage: "The daybeds, straight after. {b} walks off, and {a} follows.", turns: [['b', "Don't. Don't follow me. Not yet."], ['a', "Please. Just let me talk."], ['b', "Fine. Talk. Why did it go red?"]] },
      { stage: "The terrace, after. {a} is still pulling the tape off {a.posAdj} fingers.", turns: [['b', "Why did it go red?"]] },
      { stage: "By the pool. The rest of the villa is very carefully pretending not to listen.", turns: [['b', "Just tell me. Now. Why did that light go red?"]] },
    ],
    answer: [
      { when: { of: 'own-it', what: 'kiss' }, turns: [['a', "I kissed someone. Before. It was stupid, and it was once, and I've regretted it every day since. I should have told you myself."]] },
      { when: { of: 'own-it', what: 'bed' }, turns: [['a', "At Casa. I shared a bed with someone. I told myself it was nothing. It wasn't nothing, or I'd have told you."]] },
      { when: { of: 'own-it', what: ['pull', 'promise'] }, turns: [['a', "There was a chat. More than a chat. I let somebody get closer than I should have, and I didn't say anything because I didn't want to lose you."]] },
      { when: { of: 'own-it', what: 'said' }, turns: [['a', "I said things about us. About you. To other people. Things I'd never say to your face. And the machine knew it."]] },
      { when: { of: 'own-it' }, turns: [['a', "I'm not going to keep lying. The machine's right. There was something, and I should have told you the first day."]] },
      { when: { of: 'deny' }, turns: [['a', "Because I was nervous! Everyone was staring at me. You'd go red with wires on your fingers and the whole villa watching."]] },
      { when: { of: 'deny' }, turns: [['a', "It's a machine. It's for television. You can't trust a box over me. Not after everything."]] },
      { when: { of: 'broken' }, turns: [['a', "I was telling the truth. I swear on everything. I swear on my family. I don't know why it went red."]] },
      { when: { of: 'broken' }, turns: [['a', "That thing is broken. Everyone knows those machines get it wrong. Maybe I wanted it to be green so much, it panicked."]] },
    ],
    push: [
      { when: { of: 'own-it' }, turns: [['b', "How long were you going to let me not know? A week? The whole summer?"], ['a', "I was scared."], ['b', "You should have been."]] },
      { when: { of: 'own-it' }, turns: [['b', "You lied about it with wires on your hands. In front of everyone. You'd rather lie to a machine than tell me."]] },
      { when: { of: 'deny' }, turns: [['b', "Look me in the eye and tell me it was wrong."], ['a', "It was wrong."], ['b', "You took a long time to say it."]] },
      { when: { of: 'deny' }, turns: [['b', "You didn't look nervous. You looked like someone who knew exactly what was coming."], ['a', "I'm telling you the truth."]] },
      { when: { of: 'broken' }, turns: [['b', "I want to believe you. I really, really want to believe you."], ['a', "Then believe me. Please."]] },
      { when: { of: 'broken' }, turns: [['b', "Are we okay?"], ['a', "We're okay. I promise you. It was wrong."]] },
    ],
    land: [
      { when: { of: 'own-it' }, turns: [], beat: "By the end of it, {b} is shaking, and {a} has run out of things to say." },
      { when: { of: 'own-it' }, turns: [], beat: "{b} walks off to the dressing room. Three people follow. Nobody follows {a}." },
      { when: { of: 'deny' }, turns: [], beat: "{b} wants to believe it, and doesn't look sure." },
      { when: { of: 'broken' }, turns: [], beat: "{b} leans into {a}, but keeps glancing back at the chair." },
    ],
  },
});
