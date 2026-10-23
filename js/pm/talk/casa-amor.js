// ══════════════════════════════════════════════════════════════════════
// pm/talk/casa-amor.js — Casa Amor: the goodbye, the return, the photos
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%").
//   casa-text     [a, (b)]   the text that splits the villa. `of`: f (the girls go) · m
//   casa-goodbye  [a, b]     a couple say goodbye before Casa
//   casa-return   [a, (b)]   `of`, `choice` (a's), `theirs` (the partner's):
//     returned · stick · theirs stick   a walks back in alone; b, the partner, waited alone
//     returned · stick · theirs twist   a walks back in alone; b, the partner, has someone new
//     returned · twist · taken          a walks in with new b; {pa} waited (theirs: stick · twist)
//     returned · stick · withB false    a walks back in single, and was single
//     returned · twist · taken false    single a walks in with b
//     stayed · stick · taken            a waits alone on the bench for {pa}
//     stayed · stick · taken false      a waits, with nobody to wait for
//     stayed · twist · withB            a waits beside new b
//   casa-react    [a, b, (c)]  the face at the fire pit. `of`: relief (b came back alone) ·
//                  devastated (b came back with c) · both (a waited with someone too; c is b's) ·
//                  turned (a came back alone to b sitting with c)
//   casa-row      [a, b]     a stuck, b didn't. `of`: own-it · deny · walk-off
//   photo-text    [a]        the postcards arrive
//   photos        [a, b]     a is holding a photo of b at Casa. `of`: kiss · bed (else a closeness)
//   photo-row     [a, b]     `of`: own-it · deny · walk-off
//   photo-split   [a, b]     a ends it with b
import { build } from './build.js';

const BIG = { tiered: false };
const C3 = { cast: 3 };

export const CASA_TEXT = build('casa-text', {
  ...BIG,
  plans: { featured: ['text', 'react?'], short: ['text'] },
  moves: {
    text: [
      { when: { of: 'f' }, stage: "{a}'s phone goes off in the dressing room.", turns: [['a', "'Girls, pack your bags. You're going on a little trip. #CasaAmor.' Casa. It's Casa. Oh my God, it's actually Casa."]] },
      { when: { of: 'm' }, stage: "{a}'s phone goes off on the terrace.", turns: [['a', "'Boys, pack your bags. You're going on a little trip. #CasaAmor.' Boys. Boys. It's Casa."]] },
      { stage: "{a}'s phone goes off, and the whole villa knows what it is before {a} reads it.", turns: [['a', "'Islanders, pack your bags. Some of you are going on a little trip. #CasaAmor.'"]] },
    ],
    react: [
      { when: { cast: 2 }, turns: [['b', "I knew it. I knew it was coming. I didn't know it was coming today."], ['a', "Nobody ever knows it's coming today."]] },
      { when: { cast: 2 }, turns: [['b', "Right. Nobody panic. Everybody panic a little bit. That's fine."]] },
    ],
  },
});

export const CASA_GOODBYE = build('casa-goodbye', {
  ...BIG,
  plans: { featured: ['hold', 'promise', 'land'], short: ['hold', 'land'] },
  moves: {
    hold: [
      { stage: "{a} and {b} hold on to each other by the gate, while everyone else drags their bags past.", turns: [['b', "Don't forget about me."], ['a', "As if I could. It's a few days. It's a few days."]] },
      { stage: "The bags are packed. {a} doesn't let go of {b}'s hand until the very last second.", turns: [['a', "I hate this. I hate this so much. I've only just got you."]] },
    ],
    promise: [
      { turns: [['b', "Promise me something. Whatever happens over there, you'll tell me. Even if it's bad. Especially if it's bad."], ['a', "I promise. And you'll tell me."], ['b', "I'll tell you."]] },
      { turns: [['a', "I'm going to be so good. I'm going to be the most boring person at Casa. I'll be in bed by ten."], ['b', "You've never been in bed by ten in your life."]] },
      { turns: [['b', "They're going to send in people who are exactly our type. That's the whole point of it."], ['a', "Then I'll look the other way. I'll look at the wall."]] },
    ],
    land: [
      { turns: [], beat: "One last kiss at the gate, and then it shuts." },
      { turns: [], beat: "{b} watches the gate long after it's closed." },
    ],
  },
});

export const CASA_RETURN = build('casa-return', {
  ...BIG,
  plans: { featured: ['walk', 'words', 'land'], short: ['walk', 'land'] },
  moves: {
    walk: [
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, stage: "The Casa Amor recoupling. {b} is waiting at the fire pit, alone. A figure at the top of the steps. Also alone: {a}.", turns: [['a', "I came back on my own."], ['b', "You came back on your own. You actually came back on your own."]] },
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, stage: "{a} appears at the top of the steps, and stops to find {b} in the crowd.", turns: [['a', "Is that seat still mine?"], ['b', "It's been yours the whole time. Get down here."]] },
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, stage: "{a} walks back in, alone, grinning before {a} has even reached the bottom step.", turns: [['a', "Nobody over there even came close. Not one of them."], ['b', "Good. Get over here."]] },
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'twist' }, stage: "{a} walks in alone, smiling, and then sees {b} on the bench with somebody new.", turns: [['a', "Oh."], ['b', "I'm sorry. I'm so sorry. I didn't know what you'd do."]] },
      { when: { of: 'returned', choice: 'twist', taken: true, theirs: 'stick' }, stage: "{a} walks in holding hands with {b}. {pa} is waiting at the fire pit, alone.", turns: [['a', "I'm sorry. I'm really sorry. I had to follow my heart. I couldn't come back and pretend."]] },
      { when: { of: 'returned', choice: 'twist', taken: true, theirs: 'twist' }, stage: "{a} walks in holding hands with {b}, and stops dead. {pa} is on the bench with somebody new.", turns: [['a', "Oh. Okay. So that's how it is."]] },
      { when: { of: 'returned', choice: 'stick', withB: false }, stage: "{a} walks back into the villa on {a.posAdj} own.", turns: [['a', "Nobody at Casa was for me. I'd rather come back single than walk in with somebody I don't mean."]] },
      { when: { of: 'returned', choice: 'twist', taken: false }, stage: "{a} walks back in with {b}, grinning.", turns: [['a', "I was single when I left, and I'm not single now. Everyone, this is {b}."]] },
      { when: { of: 'stayed', choice: 'stick', taken: true }, stage: "{a} sits alone on the fire pit bench, staring at the steps.", turns: [['a', "I stuck. Whatever happens now, whoever walks down those steps, I stuck. Nobody can take that off me."]] },
      { when: { of: 'stayed', choice: 'stick', taken: true }, stage: "{a} is on the bench, hands clasped so tight the knuckles have gone white.", turns: [['a', "Come on, {pa}. Come on. Please be on your own. Please be on your own."]] },
      { when: { of: 'stayed', choice: 'stick', taken: false }, stage: "{a} sits at the end of the bench. Nobody is coming back for {a.obj} tonight.", turns: [['a', "I've got nobody to wait for. I just want to see who walks in with who. Is that terrible? It's a bit terrible."]] },
      { when: { of: 'stayed', choice: 'twist', withB: true }, stage: "{a} sits at the fire pit, and {b} sits down right beside {a.obj}.", turns: [['a', "I know what this looks like. I've made my choice. I just have to sit here while it lands."]] },
    ],
    words: [
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, turns: [['a', "All that time, and I didn't even look at anyone. I just counted the days."], ['b', "I counted them too. I counted them out loud."]] },
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick', mood: 'guilty' }, turns: [['b', "Thank you. Thank you for coming back to me."], ['a', "Of course. Of course I came back."]] },
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'twist' }, turns: [['a', "You didn't know what I'd do? I told you. I told you at the gate."], ['b', "I know you did."]] },
      { when: { of: 'returned', choice: 'twist', taken: true, theirs: 'stick' }, turns: [['b', "Hi, everyone."]] },
      { when: { of: 'returned', choice: 'twist', taken: true, persona: 'fuckboy' }, turns: [['a', "Look, I'm not going to lie. I had a great time at Casa. I'm not going to stand here and say I didn't."]] },
      { when: { of: 'returned', choice: 'twist', taken: true, theirs: 'twist' }, turns: [['a', "At least we both know where we stand."]] },
      { when: { of: 'returned', choice: 'stick', withB: false }, turns: [['a', "I'm back. Single, but back. Did I miss anything? I feel like I missed something."]] },
      { when: { of: 'returned', choice: 'twist', taken: false }, turns: [['b', "Hi, everyone. I've heard so much about you all."]] },
      { when: { of: 'stayed', choice: 'stick', taken: true }, turns: [['a', "Can somebody hold my hand? Not like that. Just hold it. My legs have gone."]] },
      { when: { of: 'stayed', choice: 'stick', taken: true }, turns: [['a', "Every night I said it out loud, so I'd believe it. We're fine. We're solid. We're about to find out."]] },
      { when: { of: 'stayed', choice: 'stick', taken: false }, turns: [['a', "Front row seat. Somebody pass me a drink. This is going to be carnage."]] },
      { when: { of: 'stayed', choice: 'twist', withB: true }, turns: [['b', "Are you okay?"], ['a', "Ask me in five minutes."]] },
    ],
    land: [
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, turns: [], beat: "{b} runs at {a}, and they nearly knock each other into the fire pit." },
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, turns: [], beat: "{a} holds {b} so tight that somebody has to remind them the recoupling isn't finished." },
      { when: { of: 'returned', choice: 'stick', withB: true, theirs: 'twist' }, turns: [], beat: "The smile goes, all at once, and the whole fire pit watches it go." },
      { when: { of: 'returned', choice: 'twist', taken: true, theirs: 'stick' }, turns: [], beat: "{pa} gets up and walks straight into the villa without a word." },
      { when: { of: 'returned', choice: 'twist', taken: true, theirs: 'twist' }, turns: [], beat: "{pa} shrugs, and neither of them looks away first." },
      { when: { of: 'returned', choice: 'stick', withB: false }, turns: [], beat: "The villa claps, and somebody shuffles up to make room on the bench." },
      { when: { of: 'returned', choice: 'twist', taken: false }, turns: [], beat: "The villa cheers for them, louder than for anyone else tonight." },
      { when: { of: 'stayed' }, turns: [], beat: "Footsteps on the stairs. Every head turns at once." },
    ],
  },
});

export const CASA_REACT = build('casa-react', {
  ...BIG,
  plans: { featured: ['face', 'words?', 'land'], short: ['face', 'land'] },
  moves: {
    face: [
      { when: { of: 'relief' }, stage: "{b} is alone at the top of the steps, and {a} can't breathe.", turns: [['a', "Oh my God. Oh my God. On your own. You're on your own."]] },
      { when: { of: 'relief' }, turns: [['a', "I knew it. I knew it. I didn't know it. I hoped it. Come here."]] },
      { when: { of: 'devastated', ...C3 }, stage: "{b} walks in holding {c}'s hand, and {a}'s face just goes.", turns: [['a', "No. No. Are you serious? Are you actually serious?"]] },
      { when: { of: 'devastated', ...C3 }, turns: [['a', "I sat here every night. Every night. Loyal. And you walk in holding {c}'s hand."]] },
      { when: { of: 'both', ...C3 }, stage: "{b} walks in with {c}. {a} is sitting next to somebody new as well.", turns: [['a', "Well. I suppose we've both made our choices, then."], ['b', "I suppose we have."]] },
      { when: { of: 'turned', ...C3 }, stage: "{a} walked back in alone, proud, and {b} is sitting on the bench beside {c}.", turns: [['a', "Are you joking? I came back for you. I came back on my own, for you."]] },
    ],
    words: [
      { when: { of: 'relief' }, turns: [['b', "Did you doubt me?"], ['a', "Every second. Every single second. I'm sorry. Never again."]] },
      { when: { of: 'devastated', ...C3 }, turns: [['b', "I'm sorry. I didn't plan it. I didn't want it to happen like this."], ['a', "How did you want it to happen?"]] },
      { when: { of: 'turned', ...C3 }, turns: [['b', "I didn't know. I didn't know what you'd do. Nobody told us anything."], ['a', "You should have known. That's the point. You should have known me."]] },
    ],
    land: [
      { when: { of: 'relief' }, turns: [], beat: "{a} is up and running before {b} has reached the bottom step." },
      { when: { of: 'devastated' }, turns: [], beat: "{a} sits very still, and two of the others move closer without being asked." },
      { when: { of: 'both' }, turns: [], beat: "Neither of them gets up. Neither of them looks away." },
      { when: { of: 'turned' }, turns: [], beat: "{a} stands there on {a.posAdj} own while the whole fire pit tries to find somewhere else to look." },
    ],
  },
});

export const CASA_ROW = build('casa-row', {
  ...BIG,
  plans: { featured: ['open', 'answer', 'land'], short: ['open', 'land'] },
  moves: {
    open: [
      { stage: "The terrace, after the recoupling. {a} has been waiting for this all night.", turns: [['a', "I need you to explain it. Not now, everyone's looking. Actually, now. Right now."]] },
      { stage: "The kitchen, later. {b} comes in for water, and {a} is already there.", turns: [['a', "Was it worth it? Honestly. Was it worth it?"]] },
    ],
    answer: [
      { when: { of: 'own-it' }, turns: [['b', "I'm not going to make excuses. I met someone, and I felt something, and I couldn't pretend I didn't."], ['a', "You could have. For me. I did."]] },
      { when: { of: 'own-it' }, turns: [['b', "I was wrong to do it like that. In front of everyone. You deserved better than finding out at a fire pit."], ['a', "I deserved better than a lot of things."]] },
      { when: { of: 'deny' }, turns: [['b', "It's not what you think. Nothing really happened over there. We just got close."], ['a', "Close enough to walk in holding hands."]] },
      { when: { of: 'walk-off' }, turns: [['b', "Can we talk about it?"], ['a', "No. Not tonight. Maybe not ever. I don't know yet."]] },
    ],
    land: [
      { when: { of: 'own-it' }, turns: [], beat: "{a} nods, very slowly, and walks back inside." },
      { when: { of: 'deny' }, turns: [], beat: "{a} laughs, and it isn't a nice laugh." },
      { when: { of: 'walk-off' }, turns: [], beat: "{a} goes to bed. {b} stays on the terrace until the lights go off." },
    ],
  },
});

export const PHOTO_TEXT = build('photo-text', {
  ...BIG,
  plans: { featured: ['text'], short: ['text'] },
  moves: {
    text: [
      { stage: "{a}'s phone goes off at the fire pit.", turns: [['a', "'Islanders, the postcards from Casa Amor have arrived. #WishYouWereHere.' Oh no. Oh no, no, no."]] },
      { stage: "An envelope is waiting on the fire pit bench. {a} picks it up first.", turns: [['a', "It's photos. It's the photos from Casa. Who wants to go first? Nobody? Brilliant."]] },
    ],
  },
});

export const PHOTOS = build('photos', {
  ...BIG,
  plans: { featured: ['look', 'answer', 'land'], short: ['look', 'land'] },
  moves: {
    look: [
      { stage: "At the fire pit, the photos from Casa Amor are handed round. {a} is holding one of {b}.", turns: [['a', "I'm going to be sick. I think I'm actually going to be sick."]] },
      { when: { of: 'kiss' }, stage: "{a} turns the photo over. It's {b}, at Casa, kissing somebody else.", turns: [['a', "You kissed someone. You stood at the gate and promised me, and you kissed someone."]] },
      { when: { of: 'bed' }, stage: "{a}'s photo is {b} at Casa, in bed, not alone.", turns: [['a', "You shared a bed. You said nothing happened. That's a bed, {b}. That's not nothing."]] },
      { when: { archetype: 'hothead' }, stage: "{a} takes one look at the photo of {b}, and throws it straight into the fire pit.", turns: [['a', "Brilliant. Absolutely brilliant. Anyone else got one for me?"]] },
      { when: { attachment: 'anxious' }, stage: "{a} holds the photo of {b} with both hands, and keeps staring at it.", turns: [['a', "I knew it. I knew something would happen. I said it every night, and everyone told me I was being mad."]] },
      { when: { attachment: 'avoidant' }, stage: "{a} looks at the photo of {b} for a second, and puts it face down.", turns: [['a', "Fine. It's fine. I'm not doing this here."]] },
    ],
    answer: [
      { turns: [['b', "It's not what it looks like."], ['a', "It's a photo. It looks exactly like what it is."]] },
      { turns: [['b', "Can we talk about this privately? Please?"], ['a', "Now you want privacy. Now."]] },
      { when: { of: ['kiss', 'bed'] }, turns: [['b', "I was going to tell you. Tonight. I swear I was going to tell you tonight."], ['a', "And now you don't have to."]] },
    ],
    land: [
      { turns: [], beat: "Nobody at the fire pit says a word." },
      { turns: [], beat: "The photo goes round the circle, and every face that sees it changes." },
    ],
  },
});

export const PHOTO_ROW = build('photo-row', {
  ...BIG,
  plans: { featured: ['open', 'answer', 'land'], short: ['open', 'land'] },
  moves: {
    open: [
      { stage: "The daybeds, straight after the photos.", turns: [['a', "When were you going to tell me? Honestly. When?"]] },
      { stage: "{a} is sitting on the end of the bed, still holding the photo.", turns: [['a', "I keep looking at it, hoping it'll change. It doesn't change."]] },
    ],
    answer: [
      { when: { of: 'own-it' }, turns: [['b', "I should have told you the second I walked back in. I know that. I was scared of exactly this."], ['a', "This is happening anyway. It's just happening worse."]] },
      { when: { of: 'deny' }, turns: [['b', "It's one photo. One moment. I'm not letting one photo end this."], ['a', "You don't get to decide that. Not any more."]] },
      { when: { of: 'walk-off' }, turns: [['b', "Please. Talk to me."], ['a', "I can't look at you right now. I'm sorry. I just can't."]] },
    ],
    land: [
      { when: { of: 'own-it' }, turns: [], beat: "{a} hands the photo back, and walks off without it." },
      { when: { of: 'deny' }, turns: [], beat: "{a} tears the photo in half, and then in half again." },
      { when: { of: 'walk-off' }, turns: [], beat: "{a} walks off, and {b} is left holding the photo." },
    ],
  },
});

export const PHOTO_SPLIT = build('photo-split', {
  ...BIG,
  plans: { featured: ['end', 'land'], short: ['end'] },
  moves: {
    end: [
      { turns: [['a', "I can't do this. I can't sleep next to you knowing what's in that photo. We're done."], ['b', "Please don't."]] },
      { turns: [['a', "I stuck for you. I stuck, and you didn't. That's all I need to know. It's over."]] },
      { turns: [['a', "I'm not going to be the person who forgave that. Not in front of everyone. Not in front of me."]] },
    ],
    land: [
      { turns: [], beat: "{a} walks back to the fire pit alone, and sits on the other end of the bench." },
      { turns: [], beat: "{b} doesn't follow. Nobody expects {b.obj} to." },
    ],
  },
});
