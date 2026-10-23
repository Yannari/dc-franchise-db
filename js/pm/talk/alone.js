// ══════════════════════════════════════════════════════════════════════
// pm/talk/alone.js — the scenes with one islander in them, and the two
// that are one islander's feeling with the other barely there
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%"). A person alone does not
// make speeches: a place, a few broken lines, what their body does.
//   breakdown        [a]     `of`: heartbreak · stress · lonely · guilt · jealousy · homesick
//   overthinking     [a]     a, going over it. {pa} is the partner.
//   jealous-sulk     [a]     a goes quiet; `noticed` if the partner saw.
//   head-turned      [a]     a can't stop looking at somebody new.
//   torch            [a, b]  a still has feelings for b, off to the Hideaway with someone else. b does not speak.
//   double-standard  [a, b]  after Movie Night: a was judged harder than b.
import { build } from './build.js';

const T = { taken: true };

export const BREAKDOWN = build('breakdown', {
  tiered: false,
  plans: { featured: ['where', 'words', 'more?', 'land'], short: ['where', 'words', 'land'] },
  moves: {
    where: [
      { when: { of: 'heartbreak' }, stage: "The bathroom. The door is locked and the tap is running, so nobody hears.", turns: [] },
      { when: { of: 'heartbreak' }, stage: "The daybeds, late. {a} is curled up under a blanket that isn't {a.posAdj}.", turns: [] },
      { when: { of: 'heartbreak' }, stage: "{a} walks away from the fire pit before anyone notices, and doesn't come back.", turns: [] },
      { when: { of: 'stress' }, stage: "The roof terrace. {a} is sitting on the floor with {a.posAdj} knees pulled up.", turns: [] },
      { when: { of: 'stress' }, stage: "The bathroom. {a} is gripping the edge of the sink.", turns: [] },
      { when: { of: 'lonely' }, stage: "The fire pit, empty. {a} is on the bench on {a.posAdj} own, where the couples usually sit.", turns: [] },
      { when: { of: 'lonely' }, stage: "{a} sits on the edge of the pool, feet in the water, while the villa laughs behind {a.obj}.", turns: [] },
      { when: { of: 'guilt' }, stage: "The bathroom. {a} is staring at {a.posAdj} own reflection and not liking it.", turns: [] },
      { when: { of: 'guilt' }, stage: "The terrace, late. {a} has {a.posAdj} head in {a.posAdj} hands.", turns: [] },
      { when: { of: 'jealousy' }, stage: "The dressing room floor. {a} can still hear the laughing from the daybeds.", turns: [] },
      { when: { of: 'homesick' }, stage: "The bedroom. {a} is packing and unpacking the same bag, for no reason.", turns: [] },
      { when: { of: 'homesick' }, stage: "The terrace, looking out at nothing, holding a letter from home.", turns: [] },
      { when: { of: 'heartbreak', gender: 'f' }, stage: "The dressing room. {a} is sitting in front of the mirror, make-up running.", turns: [] },
    ],
    words: [
      { when: { of: 'heartbreak' }, turns: [['a', "I'm fine. I'm fine. I'm fine. I'm so stupid. I really thought it was going somewhere. I really, really did."]] },
      { when: { of: 'heartbreak' }, turns: [['a', "Five minutes. I just need five minutes. Then I'll go back out there and smile, and nobody will know."]] },
      { when: { of: 'heartbreak' }, turns: [['a', "I let myself believe it. That's the bit that hurts. I knew better, and I let myself believe it anyway."]] },
      { when: { of: 'stress' }, turns: [['a', "I can't breathe. Every night there's something. Every single night. I can't switch off in here. There's nowhere to switch off."]] },
      { when: { of: 'stress' }, turns: [['a', "Everyone's watching everything. Every word. I can't do anything right. I can't even make a cup of tea right."]] },
      { when: { of: 'stress' }, turns: [['a', "I don't know who to trust any more. I don't know who's safe. I don't know if I'm safe."]] },
      { when: { of: 'lonely' }, turns: [['a', "Everyone's got someone. Everyone. And I'm just here, every night, being nice about it."]] },
      { when: { of: 'lonely' }, turns: [['a', "I go to sleep on my own and I wake up on my own. What am I even doing here? I could do this at home."]] },
      { when: { of: 'lonely' }, turns: [['a', "Nobody's going to pick me. I know that. I just have to stop pretending I don't know it."]] },
      { when: { of: 'guilt' }, turns: [['a', "What have I done? What have I actually done? I keep telling myself it wasn't that bad. It was that bad."]] },
      { when: { of: 'guilt' }, turns: [['a', "I'm not this person. I've never been this person. I don't know when I turned into this person."]] },
      { when: { of: 'jealousy' }, turns: [['a', "Every time they laugh together, I feel sick. I hate it. I hate feeling like this. I'm not a jealous person. I never used to be."]] },
      { when: { of: 'jealousy' }, turns: [['a', "I know nothing's happened. I know. My head knows. Nobody's told the rest of me."]] },
      { when: { of: 'homesick' }, turns: [['a', "I miss my {~mum}. I miss my own bed. I miss being normal, and having a phone, and nobody caring what I had for breakfast."]] },
      { when: { of: 'homesick' }, turns: [['a', "I just want to hear one voice from home. Just one. Just for a minute."]] },
    ],
    more: [
      { turns: [['a', "Sorry. Sorry. I'm alright. Give me a second."]] },
      { turns: [['a', "Don't let anyone come in. Please. I don't want anyone seeing me like this."]] },
      { turns: [['a', "Why is this so hard? It's meant to be fun. It's meant to be the summer of my life."]] },
      { when: { of: ['heartbreak', 'lonely'] }, turns: [['a', "Maybe it's me. Maybe there's something about me. Everyone else makes it look so easy."]] },
    ],
    land: [
      { turns: [], beat: "{a} puts {a.posAdj} face in {a.posAdj} hands, and lets it all come." },
      { turns: [], beat: "The tears come all at once, the way they do after days of holding them in." },
      { turns: [], beat: "{a} cries quietly, so nobody outside the door will hear. Somebody outside the door hears." },
      { turns: [], beat: "{a} wipes {a.posAdj} face, takes a breath, and doesn't get up yet." },
    ],
  },
});

export const OVERTHINKING = build('overthinking', {
  plans: { featured: ['where', 'spiral', 'catch', 'land?'], short: ['where', 'spiral'] },
  moves: {
    where: [
      { when: T, stage: "The dressing room. {a} is going over it out loud, to nobody, again.", turns: [] },
      { when: T, stage: "Lights out. {a} is lying awake, and {pa} is fast asleep beside {a.obj}.", turns: [] },
      { when: T, stage: "{a} has been sitting with the same cup of tea for twenty minutes. It's gone cold.", turns: [] },
      { when: T, stage: "The daybeds. {a} is talking to the friend on the next sunbed, who hasn't said a word yet.", turns: [] },
    ],
    spiral: [
      { when: T, turns: [['a', "{pa} said 'we'll see' about the recoupling. 'We'll see.' What does 'we'll see' mean? Nobody says 'we'll see' about something they're sure of."]] },
      { when: T, turns: [['a', "Why did {pa} go quiet at dinner? Was that me? Did I say something? I went back through everything I said, and I can't find it."]] },
      { when: T, turns: [['a', "{pa} laughed really hard at someone's joke earlier. Harder than {pa} laughs at mine. I'm not counting. I'm just noticing."]] },
      { when: T, turns: [['a', "Do you think {pa} is going off me? Be honest. Actually, don't be honest. Lie to me. I'll know if you're lying, but lie."]] },
      { when: T, turns: [['a', "We were fine this morning. Weren't we? We were fine. I'm going to stop. I'm going to stop thinking about it right now."]] },
    ],
    catch: [
      { turns: [['a', "This is mad. Nothing's happened. Literally nothing. I've just built a whole thing out of a look."]] },
      { turns: [['a', "I'm going to ask. I'm not going to ask. I'm definitely not going to ask. I might ask."]] },
      { turns: [['a', "This place does this to you. Everything feels like a sign. Even the weather feels like a sign."]] },
    ],
    land: [
      { turns: [], beat: "{a} tells {a.ref} to stop, and doesn't." },
      { turns: [], beat: "{a} turns over, and stares at the ceiling, and keeps going." },
    ],
  },
});

export const JEALOUS_SULK = build('jealous-sulk', {
  plans: { featured: ['where', 'sulk', 'land'], short: ['where', 'sulk'] },
  moves: {
    where: [
      { when: T, stage: "{a} is on {a.posAdj} own at the far end of the garden, while {pa} is laughing on the daybeds.", turns: [] },
      { when: T, stage: "Dinner. {a} gives one-word answers to everything {pa} says.", turns: [] },
      { when: { ...T, noticed: true }, stage: "{pa} sits down next to {a}, and {a} moves along a bit.", turns: [] },
      { when: { ...T, noticed: false }, stage: "{a} is sitting in the one spot of the garden everyone can see. {pa} hasn't looked over once.", turns: [] },
    ],
    sulk: [
      { when: T, turns: [['a', "I'm fine. I just want some space. Is that allowed? Can I have some space?"]] },
      { when: T, turns: [['a', "{~Yeah}. Fine. Whatever. No, honestly. Have a lovely time. I'm absolutely fine over here."]] },
      { when: { ...T, noticed: true }, turns: [['a', "I don't want to talk about it. If you can't work out why, I'm not going to tell you."]] },
      { when: { ...T, noticed: false }, turns: [['a', "Don't worry about me. Nobody else is. Clearly."]] },
    ],
    land: [
      { when: { ...T, noticed: true }, turns: [], beat: "{pa} doesn't leave. {a} doesn't ask {pa.obj} to." },
      { when: { ...T, noticed: false }, turns: [], beat: "{pa} still hasn't noticed. That's making it worse." },
      { when: T, turns: [], beat: "{a} folds {a.posAdj} arms a bit tighter." },
    ],
  },
});

export const HEAD_TURNED = build('head-turned', {
  plans: { featured: ['where', 'caught', 'land?'], short: ['where', 'caught'] },
  moves: {
    where: [
      { stage: "{a} is watching the new arrival from across the lawn, and not listening to a word anyone's saying.", turns: [] },
      { stage: "The dressing room. {a} is talking to the mirror more than to anyone else.", turns: [] },
      { stage: "Breakfast. {a} keeps looking up every time someone walks past the kitchen.", turns: [] },
    ],
    caught: [
      { turns: [['a', "Sorry, what? I was miles away. What were we talking about? Sun cream. Right. Yes. Sun cream."]] },
      { turns: [['a', "I'm happy where I am. I am. I'm just thinking about someone else a lot. Is that the same thing? It's not the same thing."]] },
      { turns: [['a', "What? Nothing. I'm just tired. I'm allowed to be tired and look in a direction."]] },
      { when: T, turns: [['a', "{pa} is lovely. {pa} is so lovely. Why am I even looking? I need to stop looking."]] },
    ],
    land: [
      { turns: [], beat: "{a} looks over again. Somebody notices this time." },
      { turns: [], beat: "{a} makes {a.ref} look at the pool instead. It lasts about a minute." },
    ],
  },
});

export const TORCH = build('torch', {
  plans: { featured: ['watch', 'words', 'land'], short: ['watch', 'words'] },
  moves: {
    watch: [
      { stage: "{a} watches {b} walk to the Hideaway with someone else, and keeps watching after the door shuts.", turns: [] },
      { stage: "Round the fire pit, after {b} has gone to the Hideaway. {a} is very interested in {a.posAdj} drink.", turns: [] },
      { stage: "{a} is looking at the Hideaway door long after it has shut.", turns: [] },
    ],
    words: [
      { turns: [['a', "Good for them. Honestly. Good for them. I'm happy for {b}. I'm going to keep saying it until it's true."]] },
      { turns: [['a', "I'm fine. I just thought, for a bit, it might have been me in there. That's all. That's not a crime."]] },
      { turns: [['a', "What? No. I'm not looking at anything. I'm just tired. It's a nice door. I like the door."]] },
      { when: { persona: 'hopeless-romantic' }, turns: [['a', "I used to think everyone gets their person in the end. I still think it. I just didn't think mine would walk off with someone else first."]] },
    ],
    land: [
      { turns: [], beat: "{a} goes to bed before anyone else, and doesn't sleep." },
      { turns: [], beat: "Somebody puts an arm round {a}. Nobody says {b}'s name for the rest of the night." },
    ],
  },
});

export const DOUBLE_STANDARD = build('double-standard', {
  plans: { featured: ['open', 'answer', 'land'], short: ['open', 'answer'] },
  moves: {
    open: [
      { stage: "After Movie Night. {a} catches {b} in the kitchen, away from the others.", turns: [
        ['a', "When it was you on that screen, everyone laughed. When it was me, I'm the worst person in here. Explain that to me."],
      ] },
      { stage: "The terrace. {a} has been quiet since the films finished.", turns: [
        ['a', "You did the same thing as me. The same thing. And nobody's said a word to you. Not one."],
      ] },
      { turns: [
        ['a', "Can I ask you something? Why is it a scandal when it's me, and a laugh when it's you?"],
      ] },
    ],
    answer: [
      { turns: [['b', "I know. I'm not going to pretend that's fair. It's not fair."], ['a', "Then say something. Say it to them."]] },
      { turns: [['b', "That's not on me. I didn't decide how people reacted."], ['a', "No. But you didn't stop it, either."]] },
      { turns: [['b', "Maybe because of how you reacted after. People remember that bit."], ['a', "So I'm meant to be calm while everyone's having a go at me?"]] },
    ],
    land: [
      { turns: [], beat: "{b} doesn't have an answer for that." },
      { turns: [], beat: "Nobody else in the kitchen is pretending not to listen any more." },
    ],
  },
});
