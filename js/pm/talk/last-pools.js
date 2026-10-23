// ══════════════════════════════════════════════════════════════════════
// pm/talk/last-pools.js — the last of the old pools: an ex walking in, the
// islanders who came in together, the second-chance night, night one's
// kissing games, and a vote grudge that flares up again
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%").
//   ex-text         [a, (b)]   the text: a new arrival knows someone here
//   ex-reveal       [a, b]     a, in the villa, sees ex b walk in. `of`: cold · spark
//   ex-partner      [a, b, c]  a's partner b turns out to be the ex of new arrival c. `of`: cold · spark
//   ex-confront     [a, b]     exes a (here first) and b, alone. `of`: cold · spark
//   pair-text       [a]        two new arrivals are coming, together
//   kin-entrance    [a, b]     the two walk in. `of`: twins · family · friends
//   kin-goodbye     [a, b]     a watches b, a's relative or friend, dumped. `of`: family · friends
//   kin-walk        [a, b]     a leaves with b. `of`: family · friends
//   sc-arrive       [a, b, …]  the dumped walk back in for a second chance
//   sc-rules        []         Dior: who decides. `of`: public · villa
//   sc-vote         [a, b]     a votes to keep b
//   sc-stay         [a]        a is back. `of`: public · villa
//   sc-leave        [a]        a goes home again
//   icebreaker      [a, b]     a smashed the ice, read {card}, kissed b. `choice`: spark · flat
//   kiss-pick       [a, b]     a couples with b. `choice`: spark · flat · other (no kiss)
//   lady-luck-kiss  [a, b]     `nth`: first · next. `choice`: spark · flat
//   lady-luck-pick  [a, b, c]  a couples with b, not c. `choice`: spark · flat · passed-up · only-one
//   grudge-clash    [a, b]     the vote grudge comes out again
// Never a gendered word for a relation (kin.js): "my twin", "family", "my best friend".
import { build } from './build.js';

const ONE = { tiered: false };

export const EX_TEXT = build('ex-text', {
  ...ONE,
  plans: { featured: ['text', 'react?'], short: ['text'] },
  moves: {
    text: [
      { stage: "{a}'s phone goes off.", turns: [['a', "'Islanders, a new arrival is on the way, and one of you is about to get a blast from the past. #Awkward.' Who's got a past? Everyone's got a past."]] },
      { stage: "Everyone crowds round {a} and the phone.", turns: [['a', "'Islanders, tonight someone new walks in, and they're no stranger to one of you. #HistoryRepeats.'"]] },
    ],
    react: [
      { when: { cast: 2 }, turns: [['b', "What does that mean? What does that mean? Somebody tell me what that means."]] },
      { when: { cast: 2 }, turns: [['b', "Right. I'm going to need everyone to tell me about every ex they've ever had. Now."]] },
    ],
  },
});

export const EX_REVEAL = build('ex-reveal', {
  ...ONE,
  plans: { featured: ['see', 'words', 'land'], short: ['see', 'land'] },
  moves: {
    see: [
      { when: { of: 'cold' }, stage: "{a} sees who's at the top of the steps, and the smile drops.", turns: [['a', "No. No way. You have got to be kidding me."]] },
      { when: { of: 'cold' }, stage: "{a} stands up, sits back down, and stands up again.", turns: [['a', "That's my ex. That is actually my ex. Walking down those steps."]] },
      { when: { of: 'spark' }, stage: "{a} sees who it is, and goes completely still.", turns: [['a', "Oh my God. Oh my God. It's {b}."]] },
    ],
    words: [
      { when: { of: 'cold' }, turns: [['b', "Hi, {a}. Long time."], ['a', "Not long enough."]] },
      { when: { of: 'cold' }, turns: [['b', "Nice to see you too."], ['a', "I didn't say it was nice."]] },
      { when: { of: 'spark' }, turns: [['b', "Hello, you."], ['a', "Hello. Hi. What are you doing here? Why are you here?"]] },
      { when: { of: 'spark' }, turns: [['b', "Did you miss me?"], ['a', "I'm not answering that. Not in front of everyone."]] },
    ],
    land: [
      { turns: [], beat: "The whole lawn turns to look at {a}, and then at {b}, and then back at {a}." },
      { when: { of: 'spark' }, turns: [], beat: "{a} touches {a.posAdj} hair without meaning to, and somebody notices." },
    ],
  },
});

export const EX_PARTNER = build('ex-partner', {
  ...ONE,
  plans: { featured: ['find', 'push', 'land?'], short: ['find', 'push'] },
  moves: {
    find: [
      { turns: [['a', "Wait. You two know each other?"], ['b', "We used to go out."], ['a', "And you didn't think to mention that?"]] },
      { stage: "{a} looks from {b} to {c} and back again.", turns: [['a', "So that's your ex. That's your actual ex, standing there."]] },
    ],
    push: [
      { turns: [['b', "It was a long time ago."], ['a', "It didn't look like a long time ago."]] },
      { turns: [['a', "Is there anything else I should know? Anyone else about to walk in?"], ['b', "It's not a big deal."], ['a', "It's a big deal to me."]] },
      { when: { of: 'spark' }, turns: [['a', "You looked at {c} like you'd forgotten I was standing next to you."], ['b', "That's not fair."], ['a', "I was there. I saw it."]] },
      { when: { of: 'cold' }, turns: [['b', "Trust me, there's nothing there. There's a reason it ended."], ['a', "Then why won't you look at me?"]] },
    ],
    land: [
      { turns: [], beat: "{c} watches the two of them from across the lawn, and doesn't look sorry at all." },
    ],
  },
});

export const EX_CONFRONT = build('ex-confront', {
  ...ONE,
  plans: { featured: ['open', 'talk', 'land?'], short: ['open', 'talk'] },
  moves: {
    open: [
      { stage: "{a} finds {b} by the pool, away from everyone else.", turns: [['a', "What are you actually doing here?"]] },
      { stage: "The terrace, late. {a} and {b} end up alone, which neither of them planned.", turns: [['b', "Can we talk? Just us?"]] },
    ],
    talk: [
      { when: { of: 'cold' }, turns: [['b', "I didn't come in for you, if that's what you're asking."], ['a', "Good."], ['b', "Can we at least be civil?"], ['a', "Civil I can do. Friends, I'm not sure."]] },
      { when: { of: 'cold' }, turns: [['a', "Please don't make this weird."], ['b', "You made it weird when you ended it."], ['a', "We both ended it."], ['b', "That's not how I remember it."]] },
      { when: { of: 'spark' }, turns: [['a', "I thought I was over it. Then you walked down those steps."], ['b', "I know. Me too."], ['a', "So what do we do?"], ['b', "I don't know. I really don't know."]] },
      { when: { of: 'spark' }, turns: [['b', "Do you ever think about it? Us?"], ['a', "Every day for about a year. Then less. Then you walked in."]] },
    ],
    land: [
      { when: { of: 'cold' }, turns: [], beat: "They go back to the others separately, and sit at opposite ends of the daybeds." },
      { when: { of: 'spark' }, turns: [], beat: "Neither of them moves to leave, for a long time." },
    ],
  },
});

export const PAIR_TEXT = build('pair-text', {
  ...ONE,
  plans: { featured: ['text'], short: ['text'] },
  moves: {
    text: [
      { stage: "{a} reads the text out, and then reads it again.", turns: [['a', "'Islanders, not one, but two new arrivals are about to walk in. #DoubleTrouble.' Two. Together. As in, they know each other?"]] },
      { stage: "A text arrives at the fire pit.", turns: [['a', "'Islanders, get ready. Two new islanders are on their way, and they're coming as a pair.' A pair of what?"]] },
    ],
  },
});

export const KIN_ENTRANCE = build('kin-entrance', {
  ...ONE,
  plans: { featured: ['walk', 'hello'], short: ['walk', 'hello'] },
  moves: {
    walk: [
      { when: { of: 'twins' }, stage: "{a} and {b} walk down the steps side by side, and the whole villa does a double take.", turns: [] },
      { when: { of: 'family' }, stage: "{a} and {b} walk in arm in arm, and it's obvious they've known each other for ever.", turns: [] },
      { when: { of: 'friends' }, stage: "{a} and {b} come down the steps together, already laughing at something.", turns: [] },
    ],
    hello: [
      { when: { of: 'twins' }, turns: [['a', "Hi, everyone! Yes, we're twins."], ['b', "And no, you can't tell us apart. Don't even try."]] },
      { when: { of: 'twins' }, turns: [['b', "We share everything."], ['a', "Except the people we {~fancy}. We absolutely do not share those."]] },
      { when: { of: 'family' }, turns: [['a', "Hi, everyone. This is my family. Be nice to us, or we'll both be annoyed with you."]] },
      { when: { of: 'family' }, turns: [['b', "We came in together, so you'll have to win over both of us."], ['a', "Good luck."]] },
      { when: { of: 'friends' }, turns: [['a', "This is my best friend. We've been through everything together."], ['b', "Everything. Including some things we're not allowed to say on television."]] },
    ],
  },
});

export const KIN_GOODBYE = build('kin-goodbye', {
  ...ONE,
  plans: { featured: ['hold', 'land?'], short: ['hold'] },
  moves: {
    hold: [
      { when: { of: 'family' }, stage: "{a} holds on to {b} for a long time.", turns: [['a', "I don't know how to do this without you."], ['b', "Yes, you do. Go and win it. Win it for both of us."]] },
      { when: { of: 'family' }, stage: "{a} walks {b} all the way to the top of the steps.", turns: [['a', "Tell everyone at home I love them."], ['b', "Tell them yourself. At the final."]] },
      { when: { of: 'friends' }, stage: "{a} hugs {b} at the steps, and doesn't want to let go.", turns: [['a', "This place won't be the same."], ['b', "Good. Make it worse without me. I'll be watching."]] },
      { when: { of: 'friends' }, turns: [['b', "Promise me you'll look after yourself in here."], ['a', "I promise. I'll see you on the outside. First thing."]] },
    ],
    land: [
      { turns: [], beat: "{a} cries into {b.posAdj} shoulder, and nobody tells {a.obj} to stop." },
    ],
  },
});

export const KIN_WALK = build('kin-walk', {
  ...ONE,
  plans: { featured: ['go', 'land'], short: ['go', 'land'] },
  moves: {
    go: [
      { when: { of: 'family' }, stage: "{a} stands up before {b} has even reached the steps.", turns: [['a', "I'm going with {b}."], ['b', "No. Stay. Please."], ['a', "I'm not doing this without you. We came in together, and we're leaving together."]] },
      { when: { of: 'friends' }, turns: [['a', "If you're going, I'm going."], ['b', "You're mad."], ['a', "I know. Come on."]] },
    ],
    land: [
      { turns: [], beat: "The villa watches in silence as they walk out together, hand in hand." },
    ],
  },
});

export const SC_ARRIVE = build('sc-arrive', {
  ...ONE,
  plans: { featured: ['walk', 'hello'], short: ['walk', 'hello'] },
  moves: {
    walk: [
      { stage: "The villa doors open, and the dumped islanders walk back in, {a} and {b} at the front.", turns: [] },
      { stage: "A text sends everyone to the lawn. Walking down the steps: faces they thought they'd seen the last of. {a} is first.", turns: [] },
    ],
    hello: [
      { turns: [['a', "Did you miss us?"], ['b', "Don't all get up at once."]] },
      { turns: [['b', "Look at their faces."], ['a', "Some of them are happy to see us."], ['b', "Some of them."]] },
    ],
  },
});

export const SC_RULES = build('sc-rules', {
  ...ONE,
  plans: { featured: ['rules'], short: ['rules'] },
  moves: {
    rules: [
      { when: { of: 'public' }, turns: [['dior', "Islanders, the public have been voting for which of the dumped islanders deserve a second chance. One of each will be coming back for good. The rest will be leaving again tonight."]] },
      { when: { of: 'villa' }, turns: [['dior', "Islanders, it's in your hands. You'll vote for which of the dumped islanders get a second chance. One of each will stay. The rest will be leaving again tonight."]] },
    ],
  },
});

export const SC_VOTE = build('sc-vote', {
  ...ONE,
  plans: { featured: ['vote'], short: ['vote'] },
  moves: {
    vote: [
      { turns: [['a', "I'm voting for {b} to stay. The villa hasn't been the same without {b}."]] },
      { turns: [['a', "This is hard. But I want {b} back. I don't think {b}'s story in here is finished yet."]] },
      { turns: [['a', "I've got to go with {b}. I've missed {b} every single day."]] },
    ],
  },
});

export const SC_STAY = build('sc-stay', {
  ...ONE,
  plans: { featured: ['stay'], short: ['stay'] },
  moves: {
    stay: [
      { when: { of: 'public' }, turns: [['dior', "The islander the public want back is {a}."], ['a', "Me? Thank you. Thank you so much. I'm not wasting this."]] },
      { when: { of: 'villa' }, turns: [['dior', "The villa has voted, and {a}, you're staying."], ['a', "I'm back. I'm actually back. Somebody pinch me."]] },
    ],
  },
});

export const SC_LEAVE = build('sc-leave', {
  ...ONE,
  plans: { featured: ['go'], short: ['go'] },
  moves: {
    go: [
      { turns: [['a', "It was nice to see everyone. Really. Good luck, all of you."]], beat: "{a} waves, and walks back out through the doors." },
      { turns: [['a', "It hurts, but I got to say goodbye this time. Last time I didn't."]], beat: "{a} hugs a few of the others on the way out." },
      { turns: [['a', "I'll be watching. Behave. I mean it."]], beat: "Everyone laughs, and {a} goes." },
    ],
  },
});

export const ICEBREAKER = build('icebreaker', {
  ...ONE,
  plans: { featured: ['card', 'kiss'], short: ['card', 'kiss'] },
  moves: {
    card: [
      { stage: "{a} smashes the ice and fishes out the card: \"{card}\"", turns: [] },
      { stage: "The ice takes {a} three goes to break. The card inside says: \"{card}\"", turns: [] },
    ],
    kiss: [
      { when: { choice: 'spark' }, turns: [['a', "Oh, that's easy. {b}, come here."]], beat: "They kiss, and when they pull apart, {b} is grinning." },
      { when: { choice: 'spark' }, turns: [['a', "I've known since I walked in. {b}."], ['b', "Me? Go on, then."]], beat: "The kiss lasts longer than anyone expected, and the fire pit starts cheering." },
      { when: { choice: 'flat' }, turns: [['a', "Okay. {b}, I suppose."], ['b', "You suppose?"]], beat: "It's a quick kiss, and they both laugh about it afterwards." },
      { when: { choice: 'flat' }, turns: [['a', "{b}. Come on. For the game."]], beat: "The kiss is polite, and that's about all it is." },
    ],
  },
});

export const KISS_PICK = build('kiss-pick', {
  ...ONE,
  plans: { featured: ['pick'], short: ['pick'] },
  moves: {
    pick: [
      { when: { choice: 'spark' }, stage: "{a} stands up at the fire pit.", turns: [['a', "I only needed one kiss to know. I'd like to couple up with {b}."], ['b', "Good answer."]] },
      { when: { choice: 'spark' }, turns: [['a', "The kiss said it all. {b}, will you couple up with me?"], ['b', "Obviously."]] },
      { when: { choice: 'flat' }, turns: [['a', "The kiss wasn't fireworks, if I'm honest. But I want to get to know {b}, so it's {b}."], ['b', "Wow. Thanks."]] },
      { when: { choice: 'other' }, turns: [['a', "We didn't kiss, but I'd like to change that. {b}, couple up with me?"], ['b', "Go on, then."]] },
    ],
  },
});

export const LADY_LUCK_KISS = build('lady-luck-kiss', {
  ...ONE,
  plans: { featured: ['kiss'], short: ['kiss'] },
  moves: {
    kiss: [
      { when: { nth: 'first', choice: 'spark' }, stage: "{a} walks along the line and stops in front of {b}.", turns: [['a', "You're my first."]], beat: "The kiss lands, and {b} is still smiling after {a} has moved on." },
      { when: { nth: 'first', choice: 'spark' }, stage: "{a} goes straight to {b}.", turns: [['b', "No hesitation. I like that."]], beat: "It's a long kiss, and the bench starts whooping." },
      { when: { nth: 'first', choice: 'flat' }, stage: "For the first kiss, {a} chooses {b}.", turns: [['a', "Okay. That was nice."], ['b', "Just nice?"]] },
      { when: { nth: 'next', choice: 'spark' }, stage: "{a}'s second kiss is {b}, and it's very clearly the better one.", turns: [['b', "Well. Hello."]], beat: "Somebody on the bench fans themselves." },
      { when: { nth: 'next', choice: 'flat' }, stage: "{a}'s second kiss is {b}.", turns: [['a', "Thank you. That was lovely."], ['b', "You said that like a thank-you card."]] },
    ],
  },
});

export const LADY_LUCK_PICK = build('lady-luck-pick', {
  ...ONE,
  plans: { featured: ['pick'], short: ['pick'] },
  moves: {
    pick: [
      { when: { choice: 'spark' }, turns: [['a', "I kissed {b} and I kissed {c}. The one I can't stop thinking about is {b}."], ['c', "No, fair enough. I saw that kiss."]] },
      { when: { choice: 'flat' }, turns: [['a', "Neither of them was fireworks, honestly. But I want to see where it goes with {b}."]], beat: "{c} sits back down, and doesn't seem too upset." },
      { when: { choice: 'passed-up' }, turns: [['a', "{c}'s kiss was the better one. I know it was. But my head says {b}."], ['c', "Your head?"], ['a', "My head."]] },
      { when: { choice: 'only-one' }, turns: [['a', "{b}. You're the one I want to get to know."]], beat: "{b} steps forward, grinning." },
    ],
  },
});

export const GRUDGE_CLASH = build('grudge-clash', {
  plans: { featured: ['clash', 'land?'], short: ['clash'] },
  moves: {
    clash: [
      { stage: "It starts in the kitchen, over nothing, and spreads to the lawn.", turns: [['a', "Every time I look at you, I think about that fire pit."], ['b', "Then stop looking at me."], ['a', "I would if you weren't everywhere."], ['b', "It's a villa! Where do you want me to go?"]] },
      { stage: "By the pool, {a} snaps at {b}.", turns: [['a', "You don't get to act like nothing happened."], ['b', "It was a vote. It's done."], ['a', "It's not done for me. It won't be done for a long time."]] },
      { stage: "On the terrace, {a} and {b} end up face to face.", turns: [['b', "How long are you going to hate me for?"], ['a', "I haven't decided."], ['b', "Well, let me know."], ['a', "You'll be the first."]] },
    ],
    land: [
      { turns: [], beat: "Two of the others step in, and steer them to opposite ends of the garden." },
      { turns: [], beat: "Neither of them looks away first." },
    ],
  },
});
