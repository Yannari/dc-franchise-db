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
      { when: { of: 'devastated', ...C3 }, stage: "{a} hasn't moved from the bench. {a.PosAdj} face has just gone.", turns: [['a', "No. No. Are you serious? Are you actually serious?"]] },
      { when: { of: 'devastated', ...C3 }, turns: [['a', "I sat here every night. Every night. Loyal. And you walk in holding {c}'s hand."]] },
      { when: { of: 'both', ...C3 }, stage: "{a} looks at {b}, then at {c}, then back at {b}.", turns: [['a', "Well. I suppose we've both made our choices, then."], ['b', "I suppose we have."]] },
      { when: { of: 'turned', ...C3 }, stage: "{a} still hasn't sat down. Nobody on the bench knows where to look.", turns: [['a', "Are you joking? I came back for you. I came back on my own, for you."]] },
    ],
    words: [
      { when: { of: 'relief' }, turns: [['b', "Did you doubt me?"], ['a', "Every second. Every single second. I'm sorry. Never again."]] },
      { when: { of: 'devastated', ...C3 }, turns: [['b', "I'm sorry. I didn't plan it. I didn't want it to happen like this."], ['a', "How did you want it to happen?"]] },
      // (Not "I didn't know what you'd do": the walk-in has just said it — season 1, Dante, twice in a minute.)
      { when: { of: 'turned', ...C3 }, turns: [['b', "I'm sorry. I made a choice, and I'm not going to pretend I didn't."], ['a', "You should have known me. That's the point. You should have known me."]] },
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

// The photos night is now the postcards, faced: they came during Casa
// (pm/postcards.js), and back in one villa {a} puts {b}'s in front of {b}.
// `of`: kiss · bed · pull · game (a challenge kiss sent with no context).
export const PHOTOS = build('photos', {
  ...BIG,
  plans: { featured: ['look', 'answer', 'land'], short: ['look', 'land'] },
  moves: {
    look: [
      { when: { of: ['kiss', 'bed', 'pull'] }, stage: "At the fire pit, {a} puts the postcard down in front of {b}.", turns: [['a', "I've been carrying this around since the night it came. Do you want to explain it, or shall I?"]] },
      { when: { of: 'kiss' }, stage: "{a} still has the postcard. In it, {b} is kissing somebody else.", turns: [['a', "You kissed someone. You stood at the gate and promised me, and you kissed someone."]] },
      { when: { of: 'bed' }, stage: "{a} still has the postcard: {b} at Casa, in bed, not alone.", turns: [['a', "You shared a bed. You said nothing happened. That's a bed, {b}. That's not nothing."]] },
      { when: { of: 'pull' }, stage: "{a} lays the postcard on the bench: {b}, at Casa, sitting far too close to somebody new.", turns: [['a', "I looked at this every night you were gone. Every night. Tell me what I'm looking at."]] },
      { when: { of: 'game' }, stage: "At the fire pit, {a} puts the postcard down in front of {b}: {b}, mid-kiss, at Casa.", turns: [['a', "I nearly didn't wait for you because of this. Tell me what it is."]] },
      { when: { archetype: 'hothead', of: ['kiss', 'bed', 'pull'] }, stage: "{a} takes the postcard out, looks at it one more time, and throws it straight into the fire pit.", turns: [['a', "There. That's what I think of it. Now talk."]] },
      { when: { attachment: 'anxious', of: ['kiss', 'bed', 'pull'] }, stage: "{a} holds the postcard of {b} with both hands, and keeps staring at it.", turns: [['a', "I knew it. I knew something would happen. I said it every night, and everyone told me I was being mad."]] },
      { when: { attachment: 'avoidant', of: ['kiss', 'bed', 'pull'] }, stage: "{a} looks at the postcard of {b} for a second, and puts it face down.", turns: [['a', "Fine. It's fine. I'm not doing this here."]] },
    ],
    answer: [
      { when: { of: ['kiss', 'bed', 'pull'] }, turns: [['b', "It's not what it looks like."], ['a', "It's a photo. It looks exactly like what it is."]] },
      { when: { of: ['kiss', 'bed', 'pull'] }, turns: [['b', "Can we talk about this privately? Please?"], ['a', "Now you want privacy. Now."]] },
      { when: { of: 'game' }, turns: [['b', "It was a challenge. It was a dare, and everybody at Casa had to do it. I didn't even want to."], ['a', "Then why didn't anyone tell me that? I sat with that photo for a whole night."]] },
      { when: { of: 'game' }, turns: [['b', "It was a game. That's all it was. I slept outside every night after."], ['a', "You slept outside?"], ['b', "Every night. Ask anyone."]] },
      { when: { of: ['kiss', 'bed'] }, turns: [['b', "I was going to tell you. Tonight. I swear I was going to tell you tonight."], ['a', "And now you don't have to."]] },
    ],
    land: [
      { when: { of: ['kiss', 'bed', 'pull'] }, turns: [], beat: "Nobody at the fire pit says a word." },
      { when: { of: ['kiss', 'bed', 'pull'] }, turns: [], beat: "The postcard goes round the circle, and every face that sees it changes." },
      { when: { of: 'game' }, turns: [], beat: "{a} looks at the postcard again, and for the first time since it came, laughs." },
      { when: { of: 'game' }, turns: [], beat: "{a} tears the postcard in half, and leaves the pieces in the fire pit." },
    ],
  },
});

// ── the postcards, during Casa (pm/postcards.js) ──────────────────────
//   postcard-text [a]           the text, in one villa (`atCasa`: which)
//   postcard      [a, b, c, d]  a opens a postcard of b, in the other villa;
//                               c is the friend beside a; d is in the photo with b.
//                               `of`: kiss · bed · pull · game · close · alone
// b and d are in the other villa: talked about, looked at, never spoken to.
export const POSTCARD_TEXT = build('postcard-text', {
  ...BIG,
  plans: { featured: ['text', 'land?'], short: ['text'] },
  moves: {
    text: [
      { when: { atCasa: false }, stage: "{a}'s phone goes off on the daybeds, and everyone stops talking.", turns: [['a', "'Islanders, you've got post. Your partners have been busy at Casa Amor. #WishYouWereHere.'"]] },
      { when: { atCasa: false }, stage: "An envelope is waiting on the kitchen counter, with everyone's names on it.", turns: [['a', "It's postcards. From Casa. Of them. Who wants to open theirs first?"]] },
      { when: { atCasa: true }, stage: "At Casa Amor, {a}'s phone goes off by the pool.", turns: [['a', "'Islanders, there's post from the main villa. #WishYouWereHere.' No. I don't want post. I'm not ready for post."]] },
      { when: { atCasa: true }, stage: "A stack of postcards is waiting on the table at Casa, each one with a name on it.", turns: [['a', "They've sent us photos of what's going on back at the main villa. Brilliant. Just what everyone needed tonight."]] },
    ],
    land: [
      { turns: [], beat: "Nobody moves for a second. Then everybody moves at once." },
      { turns: [], beat: "Somebody says they're not going to look at theirs. Everybody looks at theirs." },
    ],
  },
});

const HURT = ['kiss', 'bed', 'pull', 'game'];
export const POSTCARD = build('postcard', {
  ...BIG,
  plans: { featured: ['open?', 'look', 'talk?', 'land'], short: ['look', 'land'] },
  moves: {
    open: [
      { when: { cast: [3, 4] }, stage: "{c} hands {a} the postcard with {a.posAdj} name on it. {a} doesn't turn it over straight away.", turns: [['a', "I don't want to look."], ['c', "You don't have to."], ['a', "I do, though. I have to."]] },
      { stage: "{a} turns the postcard over before anyone can say anything.", turns: [] },
    ],
    look: [
      { when: { of: 'kiss', cast: 4 }, stage: "It's {b}, at the other villa, kissing {d}.", turns: [['a', "That's {b}. That's {b} kissing someone. That's {b} kissing someone else."]] },
      { when: { of: 'kiss' }, stage: "It's {b}, kissing somebody {a} has never seen before.", turns: [['a', "Who is that? Who even is that?"]] },
      { when: { of: 'bed' }, stage: "It's {b}, in a bed at the other villa, and {b} isn't on {b.posAdj} own.", turns: [['a', "That's a bed. That's {b} in a bed with somebody. I can't do this."]] },
      { when: { of: 'pull', cast: 4 }, stage: "It's {b} on a daybed at the other villa, and {d} is sitting much too close.", turns: [['a', "Look at {b}'s face. I know that face. That's the face {b} used to make at me."]] },
      { when: { of: 'pull' }, stage: "It's {b} at the other villa, deep in conversation with somebody new.", turns: [['a', "That's not a chat. I know what {b} looks like when it's just a chat."]] },
      { when: { of: 'game', cast: 4 }, stage: "It's {b}, mid-kiss with {d}. There's nothing else in the photo to say why.", turns: [['a', "{b} said {b} would be good. {b} looked me in the eye and said it."]] },
      { when: { of: 'game' }, stage: "It's {b}, kissing somebody new. Just that, and nothing else.", turns: [['a', "So that's what {b}'s been doing. Good. Great. Glad I know."]] },
      { when: { of: 'close', cast: 4 }, stage: "It's {b}, by the pool at the other villa, in fits of laughter with {d}.", turns: [['a', "Okay. It's a laugh. People laugh. Why does it feel like that, then?"]] },
      { when: { of: 'close' }, stage: "It's {b}, laughing with somebody new.", turns: [['a', "It's only a photo of {b} laughing. I don't know why my stomach's just dropped."]] },
      { when: { of: 'alone' }, stage: "It's {b}, on {b.posAdj} own on a sunbed, while the party goes on behind.", turns: [['a', "Look at that face. That's the face of somebody who misses me."]] },
      { when: { of: 'alone' }, stage: "It's {b}, turning away from somebody leaning in for a kiss.", turns: [['a', "{b} turned them down. {b} actually turned them down."]] },
    ],
    talk: [
      { when: { of: HURT, cast: [3, 4] }, turns: [['c', "Maybe it's not what it looks like."], ['a', "What else could it look like? Tell me what else it could be."]] },
      { when: { of: HURT, cast: [3, 4] }, turns: [['c', "Do you want me to take it off you?"], ['a', "No. I want to keep looking at it until it stops being true."]] },
      { when: { of: HURT, cast: [3, 4] }, turns: [['a', "Tomorrow I've got to decide whether I wait for {b}. And they send me this the night before."], ['c', "That's exactly why they send it."]] },
      { when: { of: 'close', cast: [3, 4] }, turns: [['c', "It's a photo of {b} laughing. That's all it is."], ['a', "I know it is. I just wish it was me making {b} laugh."]] },
      { when: { of: 'alone', cast: [3, 4] }, turns: [['c', "See? I told you. {b}'s coming back for you."], ['a', "Don't say it. I'll believe it."]] },
    ],
    land: [
      { when: { of: HURT }, turns: [], beat: "{a} puts the photo face down on the counter, and nobody picks it up." },
      { when: { of: HURT }, turns: [], beat: "{a} doesn't say another word for the rest of the night." },
      { when: { of: 'close' }, turns: [], beat: "{a} looks at the photo again, longer than anyone should look at a photo of somebody laughing." },
      { when: { of: 'alone' }, turns: [], beat: "{a} keeps the photo, and tucks it under {a.posAdj} pillow." },
    ],
  },
});
// b and d are in the other villa, and only ever in the photo.
POSTCARD.facts = () => ({ cAway: false, dAway: false });

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
