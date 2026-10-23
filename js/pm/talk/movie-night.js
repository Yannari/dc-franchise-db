// ══════════════════════════════════════════════════════════════════════
// pm/talk/movie-night.js — the villa around Movie Night (pm/movie-night.js)
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%"). The clips themselves are
// never written here: a clip is the real scene's own lines, replayed. Nothing
// below says what was on the screen (a chat, a kiss): the clip says that.
//   movie-text   [a, (b)]    a reads the text out; the first line IS the text
//   movie-seat   [a, b]      a couple sits down. `of`: guilty (a has something on the reel) · easy
//   movie-react  [a, b, (c)] a watched b on screen; c is beside a. `of`: hurt · fury · relief
//   movie-row    [a, b]      a confronts b after. `of`: own-it · deny · walk-off
//   movie-split  [a, b]      a ends it with b
import { build } from './build.js';

const C3 = { cast: 3 };

export const MOVIE_TEXT = build('movie-text', {
  tiered: false,
  plans: { featured: ['text', 'react?', 'land?'], short: ['text', 'land?'] },
  moves: {
    text: [
      { stage: "{a}'s phone buzzes at dinner, and the table goes quiet.", turns: [['a', "'Islanders, tonight it's Movie Night. Grab your popcorn and take your seats. #LightsCameraAction.'"]] },
      { turns: [['a', "I got a text! 'Islanders, the cinema is open. Tonight, you'll see what the cameras saw. #RollTheTape.'"]] },
      { stage: "The whole villa gathers round {a} in the kitchen.", turns: [['a', "'Islanders, it's Movie Night. Some of you are about to become stars. #NowShowing.'"]] },
      { turns: [['a', "'Islanders, it's time for Movie Night. Don't forget the tissues. #SpoilerAlert.' Why would we need tissues? Why would we need tissues?"]] },
    ],
    react: [
      { when: { cast: 2 }, turns: [['b', "Oh no. Oh no, no, no. What the cameras saw. Brilliant. Great. Love that."]] },
      { when: { cast: 2 }, turns: [['b', "Is anyone else suddenly feeling really sick? Just me? Fine."]] },
      { when: { cast: 2 }, turns: [['b', "Stars of what, though? That's what I want to know. Stars of what?"]] },
    ],
    land: [
      { turns: [], beat: "Every couple in the villa looks at each other at exactly the same moment." },
      { turns: [], beat: "Somebody groans. Somebody else laughs far too loudly, and that's the one everyone watches." },
    ],
  },
});

export const MOVIE_SEAT = build('movie-seat', {
  plans: { featured: ['sit', 'talk'], short: ['talk'] },
  stages: [{ stage: "The lawn has become an outdoor cinema: a huge screen, beanbags, blankets, popcorn.", turns: [] }],
  moves: {
    sit: [
      { stage: "The lawn has become an outdoor cinema: a huge screen, beanbags, blankets and far too much popcorn.", turns: [] },
      { stage: "Couples find their beanbags in front of the big screen, and the fairy lights dim.", turns: [] },
    ],
    talk: [
      { when: { of: 'guilty' }, turns: [['b', "You're very quiet."], ['a', "Just tired."], ['b', "You're holding that popcorn like it's going to save you."]] },
      { when: { of: 'guilty' }, turns: [['b', "Is there anything on there I should know about?"], ['a', "No. Nothing. Why would there be?"], ['b', "You said 'nothing' three times."]] },
      { when: { of: 'guilty' }, turns: [['a', "Whatever's on there, just remember it's edited. They cut things. They make things look different."], ['b', "Why are you saying that before it's even started?"]] },
      { when: { of: 'guilty' }, turns: [['b', "Why are you sitting so far away?"], ['a', "I'm not."], ['b', "You're practically on the next beanbag."]] },
      { when: { of: 'easy' }, turns: [['a', "I'm not worried at all. Bring it on. Show me everything."], ['b', "That's because you've got nothing to hide."], ['a', "Exactly. Pass the popcorn."]] },
      { when: { of: 'easy' }, turns: [['b', "Do you think there's anything on there about us?"], ['a', "Only good things. Probably me snoring. That's the worst it gets."]] },
      { when: { of: 'easy' }, turns: [['a', "This is going to be carnage for somebody. Not us. Somebody."], ['b', "Don't jinx it."]] },
    ],
  },
});

export const MOVIE_REACT = build('movie-react', {
  tiered: false,
  plans: { featured: ['first', 'then?', 'land'], short: ['first', 'land'] },
  moves: {
    first: [
      { when: { of: 'hurt' }, turns: [['a', "Wow. Okay. Wow."]] },
      { when: { of: 'hurt' }, turns: [['a', "Can someone pause it? I need a second. Can we just pause it?"]] },
      { when: { of: 'hurt' }, turns: [['a', "You looked me in the eye every day, and you never said a word. Not one word."]] },
      { when: { of: 'hurt', ...C3 }, turns: [['c', "Are you okay?"], ['a', "No. I'm really not."]] },
      { when: { of: 'hurt', ...C3 }, turns: [['a', "Did you know about this?"], ['c', "No. I swear I didn't. I swear on my life."]] },
      { when: { of: 'fury' }, turns: [['a', "Are you joking? Are you actually joking? Rewind that. I want to see it again."], ['b', "Please don't."]] },
      { when: { of: 'fury' }, turns: [['a', "That's what you do when I'm not there? That?"], ['b', "It's not what it looks like."], ['a', "It's exactly what it looks like! It's on a screen the size of a bus!"]] },
      { when: { of: 'fury', ...C3 }, turns: [['a', "Do you see this? Are you all seeing this?"], ['c', "We're all seeing it."]] },
      { when: { of: 'relief' }, turns: [['a', "You said no. You actually said no."], ['b', "Of course I did. What did you think I was going to do?"]] },
      { when: { of: 'relief' }, turns: [['a', "I didn't even know that happened."], ['b', "I didn't think it was worth mentioning."], ['a', "It was worth mentioning! That's the best thing I've ever seen on a screen."]] },
    ],
    then: [
      { when: { of: ['hurt', 'fury'] }, turns: [['a', "Don't touch me. Don't even look at me right now. I'm watching the rest of this, and then we're talking."]] },
      { when: { of: ['hurt', 'fury'] }, turns: [['b', "Can we talk about this after?"], ['a', "Oh, we're going to talk about it after. Don't worry about that."]] },
      { when: { of: 'relief' }, turns: [['b', "Did you think I'd done something?"], ['a', "No. Maybe. A tiny bit. I'm sorry. Come here."]] },
    ],
    land: [
      { when: { of: 'hurt' }, turns: [], beat: "{a} stares at the screen long after the clip has ended." },
      { when: { of: 'hurt' }, turns: [], beat: "The popcorn goes down, untouched, and nobody nearby is eating theirs either." },
      { when: { of: 'hurt', ...C3 }, turns: [], beat: "{c} takes {a.posAdj} hand. {b} doesn't look up." },
      { when: { of: 'fury' }, turns: [], beat: "The whole cinema turns round, and nobody turns back." },
      { when: { of: 'fury' }, turns: [], beat: "{b} takes {b.posAdj} arm back from round {a}, very slowly." },
      { when: { of: 'relief' }, turns: [], beat: "{a} kisses {b} in front of the whole cinema, and the villa cheers." },
      { when: { of: 'relief' }, turns: [], beat: "{a} pulls {b} into a hug and doesn't let go for the rest of the film." },
    ],
  },
});

export const MOVIE_ROW = build('movie-row', {
  tiered: false,
  // Walking off is the refusal: said once, not three times.
  plans: {
    featured: [{ when: { of: 'walk-off' }, plan: ['open', 'answer', 'land'] }, { plan: ['open', 'answer', 'push', 'land'] }],
    short: ['open', 'answer', 'land'],
  },
  moves: {
    open: [
      { when: { of: ['own-it', 'deny'] }, stage: "After the screening, on the daybeds.", turns: [['a', "Say something. Anything. You've been quiet since the lights came up."]] },
      { when: { of: ['own-it', 'deny'] }, stage: "The garden, the minute the screen goes dark.", turns: [['a', "Explain that. Go on. I'm listening. I've never listened so hard in my life."]] },
      { when: { of: ['own-it', 'deny'] }, stage: "By the pool, away from the others, though not far enough.", turns: [['a', "Was any of it a lie? Any of it? Because it didn't look like a lie."]] },
      { when: { of: 'walk-off' }, stage: "{a} is up and walking before the credits.", turns: [['b', "Can we talk?"], ['a', "Not tonight."]] },
    ],
    answer: [
      { when: { of: 'own-it' }, turns: [['b', "I'm sorry. I should have told you. I knew it would look like this, and I didn't tell you, and that's worse."], ['a', "It looks like this because it is this."]] },
      { when: { of: 'own-it' }, turns: [['b', "I'm not going to pretend it was edited. It happened. All of it. I messed up."], ['a', "At least you're honest now."], ['b', "I should have been honest then."]] },
      { when: { of: 'deny' }, turns: [['b', "It was edited. They've made it look worse than it was. You only saw a bit of it."], ['a', "I saw enough of it."], ['b', "Out of context."]] },
      { when: { of: 'deny' }, turns: [['b', "Nothing happened. I'm telling you nothing happened."], ['a', "I just watched it happen. On a screen. With twenty people."]] },
      { when: { of: 'walk-off' }, turns: [['b', "Please. Five minutes."], ['a', "I said not tonight. I can't look at you tonight."]] },
      { when: { of: 'walk-off' }, turns: [['b', "Where are you going?"], ['a', "Anywhere you're not."]] },
    ],
    push: [
      { when: { of: 'own-it' }, turns: [['a', "And I had to find out on a massive screen. In front of everyone. With popcorn."], ['b', "That's the worst part, isn't it?"], ['a', "That's the worst part."]] },
      { when: { of: 'own-it' }, turns: [['b', "What do you want me to do?"], ['a', "I want you to give me some space. And I want you to have told me. You can only do one of those."]] },
      { when: { of: 'deny' }, turns: [['a', "What context makes that okay? Tell me. I'll wait."], ['b', "You're overreacting."], ['a', "Don't you dare tell me I'm overreacting."]] },
      { when: { of: 'deny' }, turns: [['a', "Look me in the eye and tell me that's not what it looked like."], ['b', "It's not what it looked like."], ['a', "You can't even look at me when you say it."]] },
      { when: { of: 'walk-off' }, turns: [['b', "Say something. Anything."], ['a', "I've got nothing to say to you. That's the problem."]] },
    ],
    land: [
      { when: { of: 'own-it' }, turns: [], beat: "{a} walks off to the dressing room, and doesn't look back." },
      { when: { of: 'deny' }, turns: [], beat: "Half the villa is listening in, and none of them believe {b} either." },
      { when: { of: 'walk-off' }, turns: [], beat: "{a} takes a pillow and sleeps on the daybed. {b} is left standing on the lawn on {b.posAdj} own." },
      { turns: [], beat: "The big screen is still glowing on the lawn, showing nothing at all." },
    ],
  },
});

export const MOVIE_SPLIT = build('movie-split', {
  tiered: false,
  plans: { featured: ['end', 'answer', 'land'], short: ['end', 'land'] },
  moves: {
    end: [
      { turns: [['a', "I can't do this any more. I've thought about it all night. We're done."]] },
      { turns: [['a', "I trusted you more than anyone in here. More than anyone. And I'm not letting you make a fool of me again."]] },
      { turns: [['a', "I'm ending this. Tonight. I'm not sleeping next to you and pretending."]] },
    ],
    answer: [
      { turns: [['b', "You don't mean that."], ['a', "I've never meant anything more."]] },
      { turns: [['b', "Over one clip?"], ['a', "Over what that clip showed me about you."]] },
      { turns: [['b', "So that's it? After everything?"], ['a', "After everything. That's exactly why."]] },
    ],
    land: [
      { turns: [], beat: "The villa goes completely silent." },
      { turns: [], beat: "{b} watches {a} walk away, and nobody goes after either of them for a while." },
    ],
  },
});
