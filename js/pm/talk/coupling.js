// ══════════════════════════════════════════════════════════════════════
// pm/talk/coupling.js — the first night's step-forward coupling, a steal,
// a group arriving, and an ex's visit
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%").
//   step-forward    [a, (b)]       a walks in; `of`: one (only b stepped) · nobody
//   step-reveal     [a, b, c, (d)] b, c (and d) all stepped forward for a. `of`: two · three
//   step-choose     [a, b, c, (d)] a picks b; c (and d) were passed over. `of`: two · three
//   step-back       [a, b]         a stepped forward, b was picked; a steps back
//   step-last       [a, b]         the last two left are put together
//   steal           [a, b, c]      new arrival a takes b; c is left on the bench
//   group-entrance  [a, b, ...]    a group of new arrivals, a and b at the front
//   visit-arrive    [a, b, c]      a, dumped, visits; b (a's ex in here) is with c
//   visit-confront  [a, b]         `of`: hurt · furious
//   visit-leave     [a, b, c]      a goes again
//   return-entrance [a]            a dumped islander comes back for good
// The first coupling is night one: nobody here has a partner yet.
import { build } from './build.js';

export const STEP_FORWARD = build('step-forward', {
  tiered: false,
  plans: { featured: ['walk', 'meet', 'land?'], short: ['walk', 'meet'] },
  moves: {
    walk: [
      { when: { of: 'one' }, stage: "{a} walks down to the fire pit. The line waits. Only {b} steps forward.", turns: [] },
      { when: { of: 'one' }, stage: "{b} steps forward the second {a} comes into view, before anyone else has even moved.", turns: [] },
      { when: { of: 'one' }, stage: "{a} reaches the fire pit, and {b} takes one step forward, a little nervously.", turns: [] },
      { when: { of: 'nobody' }, stage: "{a} walks down to the fire pit with a big smile, and nobody in the line moves.", turns: [] },
      { when: { of: 'nobody' }, stage: "{a} stops in front of the line. The line looks at its feet.", turns: [] },
    ],
    meet: [
      { when: { of: 'one' }, turns: [['a', "Well, that makes it easy. Hello, {b}."], ['b', "Hi. I had a good feeling about you the second you walked in."]] },
      { when: { of: 'one' }, turns: [['b', "I'm not going to play it cool. I like you. There. I've said it."], ['a', "Good. Because I was hoping it'd be you."]] },
      { when: { of: 'one' }, turns: [['a', "Just you?"], ['b', "Just me. Is that a problem?"], ['a', "Not at all. Not even slightly."]] },
      { when: { of: 'one' }, turns: [['b', "Sorry. I didn't even wait. I just went."], ['a', "I'm glad you did. It saves me pretending to choose."]] },
      { when: { of: 'nobody' }, turns: [['a', "Oh. Okay. That's fine. I'll just stand here, then. Looking great. On my own."]] },
      { when: { of: 'nobody' }, turns: [['a', "Tough crowd. Honestly, tough crowd. I've had warmer welcomes at the dentist."]] },
    ],
    land: [
      { when: { of: 'one' }, turns: [], beat: "They both laugh, and it breaks the ice." },
      { when: { of: 'nobody' }, turns: [], beat: "{a} goes and stands at the side, still smiling, which takes some doing." },
    ],
  },
});

export const STEP_REVEAL = build('step-reveal', {
  tiered: false,
  plans: { featured: ['step', 'react'], short: ['step', 'react'] },
  moves: {
    step: [
      { when: { of: 'two' }, stage: "{a} reaches the fire pit, and {b} and {c} both step forward at exactly the same moment. Then they look at each other.", turns: [] },
      { when: { of: 'two' }, stage: "{c} steps forward first. A second later, so does {b}.", turns: [['c', "Oh, it's like that, is it?"], ['b', "It's a free country."]] },
      { when: { of: 'three' }, stage: "{b}, {c} and {d} all step forward before {a} has even reached the bottom of the steps.", turns: [] },
      { when: { of: 'three' }, stage: "{b} steps forward. Then {c}. Then, after a long pause, {d}.", turns: [['d', "What? It's worth a try."]] },
    ],
    react: [
      { when: { of: 'two' }, turns: [['a', "Two of you? Okay. I wasn't expecting that. This is already awkward, and I've been here ten seconds."]] },
      { when: { of: 'two' }, turns: [['a', "Right. Okay. Wow. No pressure, then."]] },
      { when: { of: 'three' }, turns: [['a', "Three? Are you serious? Three of you? I don't know where to look."]] },
      { when: { of: 'three' }, turns: [['a', "Three. Okay. I did not expect three. I expected one, on a good day."]] },
    ],
  },
});

export const STEP_CHOOSE = build('step-choose', {
  tiered: false,
  plans: { featured: ['think', 'pick', 'land?'], short: ['pick'] },
  moves: {
    think: [
      { stage: "{a} walks slowly along the ones who stepped forward, and back again.", turns: [['a', "This is the hardest decision I've had to make all day. And I made a lot of decisions about outfits."]] },
      { stage: "{a} looks from {b} to {c} for a long time.", turns: [] },
    ],
    pick: [
      { when: { of: 'two' }, turns: [['a', "You both look amazing. I'm really sorry, {c}. {b}, would you like to couple up with me?"], ['b', "Yes!"]] },
      { when: { of: 'two' }, turns: [['a', "{c}, you're gorgeous. But {b} caught my eye the second I walked in. I'm going with my gut. {b}."], ['c', "Fair enough."]] },
      { when: { of: 'three' }, turns: [['a', "I'm so sorry, {c}. Sorry, {d}. {b}. Do you want to couple up?"], ['b', "I thought you'd never ask."]] },
      { when: { of: 'three' }, turns: [['a', "Three of you, and I've got to pick one. {b}, I'm going with you."], ['c', "Brutal."]] },
    ],
    land: [
      { when: { of: 'two' }, turns: [], beat: "{b} walks over, and {c} steps back into the line." },
      { when: { of: 'three' }, turns: [], beat: "{c} and {d} step back into the line together, and pretend it's fine." },
    ],
  },
});

export const STEP_BACK = build('step-back', {
  plans: { featured: ['back', 'land?'], short: ['back'] },
  moves: {
    back: [
      { stage: "{a} steps back into the line, face burning.", turns: [['a', "It's fine. Honestly. It's day one. The next one's mine. Watch."]] },
      { turns: [['a', "Well, that was embarrassing."], ['b', "Sorry!"], ['a', "Don't be. You'd have done exactly the same."]] },
      { stage: "{a} gives {b} a smile that doesn't quite reach {a.posAdj} eyes.", turns: [['a', "Congratulations. Genuinely. I mean it. Mostly."]] },
      { turns: [['a', "Story of my life. Step forward, step back. I should do it as a dance."]] },
    ],
    land: [
      { turns: [], beat: "One of the others in the line squeezes {a.posAdj} arm." },
    ],
  },
});

export const STEP_LAST = build('step-last', {
  plans: { featured: ['left', 'talk'], short: ['left', 'talk'] },
  moves: {
    left: [
      { stage: "Everyone else has coupled up. That leaves {a} and {b}.", turns: [] },
      { stage: "The last two standing at the fire pit are {a} and {b}, and nobody else to choose from.", turns: [] },
    ],
    talk: [
      { turns: [['b', "Looks like it's you and me."], ['a', "Could be worse!"], ['b', "Could it?"], ['a', "Give it a day."]] },
      { turns: [['a', "Hi. So. We're a couple now."], ['b', "Apparently so. Let's give it a go. Stranger things have happened."]] },
      { turns: [['b', "So. It's us."], ['a', "It's us. Don't look so worried."], ['b', "I'm not worried. This is just my face."]] },
      { turns: [['a', "At least we'll have a lot to talk about."], ['b', "Like how nobody stepped forward for either of us?"], ['a', "Like that. We'll start with that."]] },
      { turns: [['b', "Well, this wasn't the plan."], ['a', "Plans are overrated. Mine was rubbish anyway."]] },
    ],
  },
});

export const STEAL = build('steal', {
  tiered: false,
  plans: { featured: ['pick', 'land'], short: ['pick', 'land'] },
  moves: {
    pick: [
      { stage: "At the fire pit, {a} has to choose who to couple up with.", turns: [['a', "I'm really sorry to do this. But I came in here for {b}, and I'd be lying to everyone if I picked anyone else."]] },
      { stage: "At the fire pit, {a} stands up, and the whole bench holds its breath.", turns: [['a', "I've only been here a day. But from the moment I walked in, it's been {b}. I'm sorry, {c}. I really am."]] },
      { when: { persona: 'game-player' }, stage: "At the fire pit.", turns: [['a', "I know this is going to cause drama. I've made my peace with that. {b}."]] },
      { stage: "At the fire pit.", turns: [['a', "I don't want to ruin anyone's couple. I genuinely don't. But I have to follow my gut, and my gut says {b}."], ['c', "Right."]] },
    ],
    land: [
      { turns: [], beat: "{b} gets up and walks over. {c} is left sitting alone on the bench." },
      { turns: [], beat: "{c} stares at the ground. {b} doesn't look at {c}." },
      { turns: [], beat: "{b} squeezes {c}'s arm on the way past, which somehow makes it worse." },
    ],
  },
});

export const GROUP_ENTRANCE = build('group-entrance', {
  tiered: false,
  plans: { featured: ['walk', 'hello'], short: ['walk', 'hello'] },
  moves: {
    walk: [
      { stage: "The door opens again, and the rest of the new arrivals walk in together, {a} and {b} at the front.", turns: [] },
      { stage: "A whole group of new faces comes down the steps at once, led by {a}.", turns: [] },
      { stage: "{a}, {b} and the others arrive together, still laughing about something from the car.", turns: [] },
    ],
    hello: [
      { turns: [['a', "Hi, everyone! We're the fun ones."], ['b', "Speak for yourself."]] },
      { turns: [['a', "Don't mind us. We're just going to get to know absolutely everyone."], ['b', "Some more than others."]] },
      { turns: [['b', "We've only known each other an hour, and we're already best friends."], ['a', "Best friends. Possibly rivals. We'll see."]] },
    ],
  },
});

export const VISIT_ARRIVE = build('visit-arrive', {
  tiered: false,
  plans: { featured: ['walk', 'words', 'land?'], short: ['walk', 'words'] },
  moves: {
    walk: [
      { stage: "The villa doors open, and {a} walks back in. {b} is sitting with {c}.", turns: [] },
      { stage: "Heads turn on the lawn. {a} is back, just for tonight, and walks straight past everyone to {b}.", turns: [] },
    ],
    words: [
      { turns: [['a', "Surprise."], ['b', "{a}? What are you doing here?"], ['a', "I heard you were doing fine without me. I wanted to see for myself."]] },
      { turns: [['a', "Didn't take you long."], ['b', "It's not what it looks like."], ['a', "It looks exactly like what it is."]] },
      { turns: [['a', "Hello, everyone. Hello, {b}."], ['b', "Hi."], ['c', "Oh no."]] },
    ],
    land: [
      { turns: [], beat: "{c} lets go of {b}'s hand, very slowly." },
    ],
  },
});

export const VISIT_CONFRONT = build('visit-confront', {
  tiered: false,
  plans: { featured: ['open', 'answer'], short: ['open', 'answer'] },
  moves: {
    open: [
      { when: { of: 'hurt' }, stage: "{a} and {b}, alone on the terrace.", turns: [['a', "You told me you'd wait for me. You said it at the fire pit, with everyone listening."]] },
      { when: { of: 'hurt' }, stage: "On the swing seat, {a} can't look at {b}.", turns: [['a', "I watched it all from outside. Every day of it."]] },
      { when: { of: 'furious' }, stage: "In front of the whole villa, {a} lets {b} have it.", turns: [['a', "You couldn't even wait a week!"]] },
      { when: { of: 'furious' }, stage: "By the pool, {a} is shaking.", turns: [['a', "Everything you said to me, you meant it for about five minutes."]] },
    ],
    answer: [
      { when: { of: 'hurt' }, turns: [['b', "I know. I'm sorry. I didn't plan any of it."], ['a', "That's what makes it worse. You didn't even have to try."]] },
      { when: { of: 'hurt' }, turns: [['b', "I didn't think you'd see it like that."], ['a', "How else was I going to see it? It was on every screen."]] },
      { when: { of: 'furious' }, turns: [['b', "Can we talk about this privately?"], ['a', "No. You didn't do it privately."]] },
      { when: { of: 'furious' }, turns: [['b', "That's not true."], ['a', "Then prove it. Oh, wait. You can't."]] },
    ],
  },
});

export const VISIT_LEAVE = build('visit-leave', {
  tiered: false,
  plans: { featured: ['go', 'land?'], short: ['go'] },
  moves: {
    go: [
      { stage: "The villa doors. {a} picks up {a.posAdj} bag again.", turns: [['a', "Enjoy it, {b}."], ['b', "{a}, wait."], ['a', "No. I've said what I came to say."]] },
      { stage: "{a} stops at the steps and turns back.", turns: [['a', "Good luck, {c}. You'll need it."], ['c', "Wow."]] },
      { stage: "{a} hugs a few of the others on the way out, and not {b}.", turns: [['b', "Are you not even going to say goodbye?"], ['a', "I just did. To the people who deserved it."]] },
    ],
    land: [
      { turns: [], beat: "{a} walks out. {c} watches {b} watch {a} go." },
      { turns: [], beat: "{a} is gone. {b} sits down on the steps, and stays there." },
    ],
  },
});

export const RETURN_ENTRANCE = build('return-entrance', {
  tiered: false,
  plans: { featured: ['walk', 'hello'], short: ['walk', 'hello'] },
  moves: {
    walk: [
      { stage: "A text arrives: \"Islanders, you have a visitor.\" Then {a} walks back down the steps.", turns: [] },
      { stage: "{a} walks back into the garden, suitcase and all.", turns: [] },
    ],
    hello: [
      { turns: [['a', "Did you miss me? Because I missed you. Some of you. A few of you."]] },
      { turns: [['a', "I'm back. And this time, I know exactly what I'm doing."]] },
      { turns: [['a', "I've watched everything since I left. Everything. So let's all be very nice to each other."]] },
    ],
  },
});
