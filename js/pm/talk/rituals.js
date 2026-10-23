// ══════════════════════════════════════════════════════════════════════
// pm/talk/rituals.js — the villa's own set pieces: the families, the
// anonymous notes, the heart-rate challenge, Snog Marry Pie
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%").
//   families        [a, b]        a's family meet a's partner b. `verdict`: good · bad · unsure
//   notes           [a, b]        a wrote the note; it is read out about b. `guessed`: b knows it was a
//   heart-rate      [a, b]        a's monitor spikes highest for b. `coupled`: b is a's partner;
//                                 else `taken` ({pa} is a's partner, watching)
//   snog-marry-pie  [a, b, c, d]  a's snog b, marry c, pie d. `full` when all three are there.
import { build } from './build.js';

export const FAMILIES = build('families', {
  tiered: false,
  plans: { featured: ['meet', 'talk', 'after', 'land?'], short: ['meet', 'after'] },
  moves: {
    meet: [
      { when: { verdict: 'good' }, stage: "{a}'s family have come to the villa. An hour with {b}, and they're all laughing on the daybeds.", turns: [] },
      { when: { verdict: 'good' }, stage: "A video from {a}'s family plays on the big screen, and {b} is in the first sentence.", turns: [] },
      { when: { verdict: 'bad' }, stage: "{a}'s family are polite to {b}. Very polite. Painfully polite.", turns: [] },
      { when: { verdict: 'bad' }, stage: "{a}'s family take {a} aside on the terrace, away from {b}, and keep their voices low.", turns: [] },
      { when: { verdict: 'unsure' }, stage: "{a}'s family meet {b} for the first time, and give away nothing at all.", turns: [] },
    ],
    talk: [
      { when: { verdict: 'good' }, turns: [['b', "They asked me how we met, and I told them the whole story, and they laughed in all the right places."], ['a', "They never laugh in the right places. They like you. They actually like you."]] },
      { when: { verdict: 'good' }, turns: [['a', "They took me to one side and said, 'Don't you dare mess this one up.' That's the nicest thing they've ever said about anyone I've brought home."]] },
      { when: { verdict: 'bad' }, turns: [['a', "They've watched everything. Every row. Every fire pit. They've seen it all on {~telly}, and they're not sure about you."], ['b', "What did they say? Tell me exactly."]] },
      { when: { verdict: 'bad' }, turns: [['b', "They hate me."], ['a', "They don't hate you. They're protective. They saw me get hurt in here, and they're scared it'll happen again."]] },
      { when: { verdict: 'unsure' }, turns: [['b', "How did I do? Honestly."], ['a', "Honestly? I can't tell. They were impossible to read. They shook your hand for quite a long time. That's either very good or very bad."]] },
      { when: { verdict: 'unsure' }, turns: [['a', "They're still making their minds up. That's normal. That's what they're like with everyone."], ['b', "Everyone?"], ['a', "Everyone. It took them about three years to like my friends."]] },
    ],
    after: [
      { when: { verdict: 'good' }, turns: [['a', "I've never brought anyone home before. Not really. I think this counts."], ['b', "I think this counts."]] },
      { when: { verdict: 'bad' }, turns: [['b', "So what happens now?"], ['a', "Now I show them they're wrong. Now we show them."]] },
      { when: { verdict: 'bad' }, turns: [['a', "They'll come round. They will. They just need to see what I see."], ['b', "Will they?"]] },
      { when: { verdict: 'unsure' }, turns: [['b', "Did they say anything when they left?"], ['a', "Somebody winked on the way out. I don't know what the wink meant. I'm going to think about the wink all night."]] },
    ],
    land: [
      { when: { verdict: 'good' }, turns: [], beat: "{b} cries harder than {a} does, and they both laugh about it." },
      { when: { verdict: 'bad' }, turns: [], beat: "{b} nods, and looks down at the floor for a long time." },
      { when: { verdict: 'unsure' }, turns: [], beat: "{a} squeezes {b}'s hand, and neither of them is sure who's reassuring who." },
    ],
  },
});

export const NOTES = build('notes', {
  plans: { featured: ['read', 'answer', 'land'], short: ['read', 'land'] },
  moves: {
    read: [
      { stage: "An anonymous note is read out to the whole villa. It's about {b}: somebody thinks {b} is two-faced.", turns: [] },
      { stage: "The note says {b} is only in the villa for the followers. The whole fire pit hears it.", turns: [] },
      { stage: "The note says {b} talks a big game about loyalty and doesn't play it. Everyone looks at {b}.", turns: [] },
      { stage: "An anonymous note about {b} is read out, word for word, with {b} sitting right there.", turns: [] },
    ],
    answer: [
      { when: { guessed: true }, turns: [['b', "I know who wrote that. I know exactly who wrote that."], ['a', "Don't look at me."], ['b', "I'm looking at you because it was you."]] },
      { when: { guessed: true, archetype: 'hothead' }, turns: [['b', "{a}. That was you. I know it was you. I know how you talk."], ['a', "I don't know what you're talking about."]] },
      { when: { guessed: false }, turns: [['b', "Whoever wrote that, you could have just said it to my face. That's all. You could have just said it."]] },
      { when: { guessed: false }, turns: [['b', "Wow. Okay. That's nice. That's a lovely thing to hear in front of everyone. Thanks, whoever you are."]] },
    ],
    land: [
      { when: { guessed: true }, turns: [], beat: "{b} is looking straight at {a}. {a} has suddenly found the fire very interesting." },
      { when: { guessed: true }, turns: [], beat: "{a} doesn't meet {b.posAdj} eye, and that's as good as a signature." },
      { when: { guessed: false }, turns: [], beat: "{b} guesses the wrong person. {a} keeps a perfectly straight face." },
      { when: { guessed: false }, turns: [], beat: "{a} says nothing, and claps along when somebody else gets the blame." },
    ],
  },
});

export const HEART_RATE = build('heart-rate', {
  plans: { featured: ['spike', 'answer', 'land?'], short: ['spike', 'answer'] },
  moves: {
    spike: [
      { when: { coupled: true }, stage: "The heart-rate challenge. {a}'s monitor goes wild for one person, and it's {b}.", turns: [] },
      { when: { coupled: true }, stage: "{a}'s heart rate jumps the moment {b} starts dancing, and the screen shows everyone.", turns: [] },
      { when: { coupled: false, taken: true }, stage: "{a}'s heart rate spikes highest for {b}. Not for {pa}. It's on the big screen.", turns: [] },
      { when: { coupled: false, taken: true }, stage: "The biggest spike of {a}'s whole afternoon is for {b}, and {pa} is sitting right there.", turns: [] },
      { when: { coupled: false, taken: false }, stage: "{a}'s heart goes for {b}, and the whole villa turns round to look.", turns: [] },
    ],
    answer: [
      { when: { coupled: true }, turns: [['b', "Obviously."], ['a', "Don't look so smug about it. You're unbearable when you're smug."], ['b', "I'm always smug. Now I've got evidence."]] },
      { when: { coupled: true }, turns: [['a', "I can't help it. I'm not even embarrassed. Look at the number. That's love, that is. That's science."]] },
      { when: { coupled: false, taken: true }, turns: [['a', "That doesn't mean anything. It's a machine. It measures a heart, not a person."]] },
      { when: { coupled: false, taken: true }, turns: [['a', "It was the dancing. It was very good dancing. Anyone would have."], ['b', "Thank you."], ['a', "Don't thank me. Don't make it worse."]] },
      { when: { coupled: false, taken: false }, turns: [['a', "Oh no. Well. Now everyone knows. Great. Brilliant. Hello, {b}."], ['b', "Hello."]] },
      { when: { coupled: false, taken: false, persona: 'wallflower' }, turns: [['a', "Can we move on? Please? Can somebody else go now? Anyone?"]] },
    ],
    land: [
      { when: { coupled: false, taken: true }, turns: [], beat: "{pa} looks at the screen, and then at {a}, and doesn't laugh." },
      { when: { coupled: true }, turns: [], beat: "The villa groans, and {b} takes a little bow." },
      { when: { coupled: false, taken: false }, turns: [], beat: "{a} goes bright red, and the villa whoops." },
    ],
  },
});

export const SNOG_MARRY_PIE = build('snog-marry-pie', {
  plans: { featured: ['stand', 'call', 'land'], short: ['call', 'land'] },
  moves: {
    stand: [
      { stage: "{a} stands up with the three cards, and the villa leans in.", turns: [['a', "Right. I've thought about this a lot. More than I've thought about anything in here, honestly."]] },
      { stage: "The pie is ready on the table. {a} looks at it, and then at everyone.", turns: [['a', "I hate this game. I hate it. Okay. Here we go."]] },
    ],
    call: [
      { when: { full: true }, turns: [['a', "Snog, {b}. Marry, {c}, obviously. And pie..."], ['a', "Sorry, {d}. Nothing personal. It's a bit personal."]] },
      { when: { full: true }, turns: [['a', "I'd marry {c}. I'd snog {b}, just the once, to see. And the pie is for {d}, who knows exactly why."], ['d', "I don't know why!"]] },
      { when: { full: true, taken: true }, turns: [['a', "Marry, {c}. Snog..."], ['a', "{b}. And {d}, I'm really sorry about this."]] },
      { when: { full: true, persona: 'messy' }, turns: [['a', "Snog, {b}. Marry, {c}. And pie goes to {d}, for reasons I'll explain later, in private, with a lawyer."]] },
      { when: { full: false }, turns: [['a', "I'm not playing this properly. I can't. I'm just going to pie somebody and run."]] },
    ],
    land: [
      { when: { full: true }, turns: [], beat: "{d} takes a face full of cream, and takes it remarkably well." },
      { when: { full: true }, turns: [], beat: "The whole villa goes 'ooooh', and {d} licks the cream off with great dignity." },
      { when: { full: true, taken: true }, turns: [], beat: "{pa} goes very quiet when the snog is called." },
      { when: { full: false }, turns: [], beat: "The cream goes everywhere, and on almost everyone." },
    ],
  },
});
