// ══════════════════════════════════════════════════════════════════════
// pm/talk/rekindle.js — "are they back on?" (pm/threads.js rekindleBeat)
// ══════════════════════════════════════════════════════════════════════
//
// Two who ended it as friends (pm/just-friends.js). `of`:
//   moment   [a, b]     a moment that isn't quite a friend's
//   noticed  [f, b, a]  {a}, a friend of {b}'s, saw it and asks {b} about {c}
//   yes      [x, y]     {a} asks if they could try again; {b} says yes
//   no       [x, y]     {a} asks; {b} says no, kindly, and means it
//   open     how it starts
//   middle   the heart of it
//   close    how it's left
import { build } from './build.js';

const MOMENT = { of: 'moment' }, NOTICED = { of: 'noticed' }, YES = { of: 'yes' }, NO = { of: 'no' };

export const REKINDLE = build('rekindle', {
  stages: [
    { when: MOMENT, stage: "{a} and {b} are the last two left at the fire pit." },
    { when: NOTICED, stage: "{a} drags {b} off to the dressing room." },
    { when: YES, stage: "{a} asks {b} for a word on the swing seat." },
    { when: NO, stage: "{a} asks {b} for a word on the swing seat." },
  ],
  plans: {
    featured: ['open', 'middle', 'close'],
    short: ['middle', 'close'],
  },
  moves: {
    open: [
      { when: MOMENT, stage: "{a} and {b} end up on the same daybed, and neither of them moves.", turns: [
        ['a', "Remember when we used to do this every afternoon?"],
        ['b', "Before you decided we were better as friends? Yes, I remember."],
      ] },
      { when: MOMENT, stage: "{a} and {b} end up on the same daybed, and neither of them moves.", turns: [
        ['a', "This is nice. Is this allowed?"],
        ['b', "Friends sit on daybeds. I've seen it."],
      ] },
      { when: MOMENT, stage: "{a} and {b} are on washing-up duty, and {a} flicks water at {b}.", turns: [
        ['b', "Do that again and see what happens."],
        ['a', "What happens?"],
      ] },
      { when: NOTICED, turns: [
        ['a', "Right. What was that yesterday?"],
        ['b', "What was what?"],
        ['a', "You and {c}. Don't do that face."],
      ] },
      { when: NOTICED, turns: [
        ['a', "Can I ask you something, and you won't get annoyed?"],
        ['b', "No promises."],
        ['a', "Is something going on with you and {c} again?"],
      ] },
      { when: { of: ['yes', 'no'] }, turns: [
        ['b', "That's a serious face. Should I be worried?"],
        ['a', "No. Maybe. Just sit down."],
      ] },
      { when: { of: ['yes', 'no'] }, turns: [
        ['a', "I've been trying to work out how to say this all day."],
        ['b', "Just say it. I'm not going anywhere."],
      ] },
    ],
    middle: [
      { when: MOMENT, turns: [
        ['b', "You laughed at that. You haven't laughed at my jokes in a week."],
        ['a', "Maybe I've missed them."],
        ['b', "Careful. That sounded like something."],
        ['a', "It might have been."],
      ] },
      { when: MOMENT, turns: [
        ['a', "Can I tell you something weird?"],
        ['b', "Always."],
        ['a', "I keep looking for you. In the kitchen, at the pool. And then I remember we're just friends, and I don't know what to do with that."],
        ['b', "I've been doing the same thing. I thought it was just me."],
      ] },
      { when: MOMENT, turns: [
        ['b', "We're good at this, aren't we? The talking."],
        ['a', "We were always good at the talking. That was never the problem."],
        ['b', "What was the problem?"],
        ['a', "I'm not sure any more."],
      ] },
      { when: NOTICED, turns: [
        ['b', "Nothing's going on. We're friends. We had a nice chat."],
        ['a', "You were looking at each other like the first week."],
        ['b', "Were we?"],
        ['a', "Yes! Everyone saw it."],
      ] },
      { when: NOTICED, turns: [
        ['b', "I don't know. Honestly, I don't. I thought I was over it, and then yesterday it just felt easy again."],
        ['a', "Easy like friends, or easy like before?"],
        ['b', "That's the bit I don't know."],
      ] },
      { when: YES, turns: [
        ['a', "When we called it off, I thought it was the right thing. And maybe it was, then. But I've had time to miss you, and I do. Not as a friend. Would you want to try again? For real this time."],
        ['b', "Do you have any idea how long I've wanted you to say that?"],
        ['a', "Is that a yes?"],
        ['b', "That's a yes."],
      ] },
      { when: YES, turns: [
        ['a', "I'm just going to say it. I think we gave up too early. I want to give us another go."],
        ['b', "You're not just saying that because it's nearly the end?"],
        ['a', "I'm saying it because it's true. I should have said it days ago."],
        ['b', "Then yes. Let's try again."],
      ] },
      { when: NO, turns: [
        ['a', "I've been thinking about us. About trying again."],
        ['b', "I wondered if this was coming."],
        ['a', "And?"],
        ['b', "And I love what we've got now. I don't want to lose it by going back. I'm sorry. It's a no."],
      ] },
      { when: NO, turns: [
        ['a', "Is there any part of you that wants to try again?"],
        ['b', "A small part, some days. But the rest of me knows we were right the first time. I don't want to go round in circles with you."],
        ['a', "Okay. That's fair."],
      ] },
    ],
    close: [
      { when: MOMENT, turns: [], beat: "Somebody calls them in for dinner, and they both get up a beat too slowly." },
      { when: MOMENT, turns: [], beat: "{a} goes inside first. {b} watches {a.obj} go, and then pretends not to have." },
      { when: NOTICED, turns: [['a', "Just be careful. I don't want to pick you up off the floor again."], ['b', "I know. I'll be careful."]] },
      { when: NOTICED, turns: [['a', "Whatever it is, I'm on your side. You know that."]], beat: "{b} doesn't answer, which is an answer." },
      { when: YES, turns: [], beat: "They kiss, and somebody on the terrace shouts, \"Finally!\"" },
      { when: YES, turns: [['b', "Don't make me regret this."], ['a', "I won't."]], beat: "They walk back in holding hands, and the villa goes quiet, then loud." },
      { when: NO, turns: [['a', "Still friends?"], ['b', "Always. That was never the question."]], beat: "They hug, and this time it really is just a hug." },
      { when: NO, turns: [], beat: "{a} nods, and stays on the swing seat a little longer after {b} has gone." },
    ],
  },
  notes: [
    { when: MOMENT, stage: "{a} and {b} share a look across the pool, and both of them look away." },
    { when: NOTICED, stage: "{a} asks {b} what's going on with {c}." },
    { when: YES, stage: "{a} and {b} are giving it another go." },
    { when: NO, stage: "{a} asks {b} about trying again. {b} says no." },
  ],
});
