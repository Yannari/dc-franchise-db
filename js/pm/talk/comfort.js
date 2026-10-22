// ══════════════════════════════════════════════════════════════════════
// pm/talk/comfort.js — {a} goes to {b}, who is in tears
// ══════════════════════════════════════════════════════════════════════
//
// After a breakdown (pm/breakdown.js). Who comes is `of`: friend · partner ·
// unexpected (somebody from the other side of a feud). Why {b} broke down is
// the breakdown's own cause (`why`: heartbreak · stress · lonely · guilt ·
// jealousy · homesick), and {x} is who broke {b.posAdj} heart, when somebody did.
//   find      {a} finds {b}
//   why       {b} says what it is — the long turn
//   hold      {a}'s comfort
//   lift      a laugh, to bring {b} back
//   close     how they leave it
import { build } from './build.js';
import { emo } from '../emotions.js';

const cryingOf = (state, ev) => (state._today || []).filter(e => e.ep === state.ep && e.kind === 'breakdown' && e.players[0] === ev.players[1]).pop();

export const COMFORT = build('comfort', {
  facts: (state, ev) => {
    const b = cryingOf(state, ev);
    const from = emo(state, ev.players[1]).heartbreakFrom;
    return { why: b?.extra?.of || null, hasWith: !!from && from !== ev.players[0] };
  },
  slots: (state, ev) => {
    const from = emo(state, ev.players[1]).heartbreakFrom;
    return from && from !== ev.players[0] ? { x: from } : {};
  },
  plans: {
    featured: ['find', 'why', 'hold', 'lift?', 'close'],
    short: ['find', 'hold'],
  },
  moves: {
    find: [
      { stage: "{a} finds {b} crying on the bathroom floor and sits down next to {b.obj}.", turns: [
        ['a', "Hey. Hey. Come here. What's going on?"],
        ['b', "I'm fine. I'm fine. I'm just being stupid."],
        ['a', "You're not being stupid. Talk to me."],
      ] },
      { stage: "{a} finds {b} on {b.posAdj} own on the terrace, in tears.", turns: [
        ['a', "I've been looking everywhere for you. Are you okay?"],
        ['b', "No. Not really."],
        ['a', "Okay. That's okay. I'm here."],
      ] },
      { when: { of: 'partner' }, stage: "{a} comes and wraps {a.posAdj} arms round {b} on the daybed.", turns: [
        ['a', "Why didn't you come and get me?"],
        ['b', "I didn't want you to see me like this."],
        ['a', "I want to see you like this. I want to see you every way you are."],
      ] },
      { when: { of: 'unexpected' }, stage: "{a}, of all people, sits down next to {b}.", turns: [
        ['b', "What are you doing here?"],
        ['a', "Whatever's gone on between us, I'm not going to walk past someone crying. Budge up."],
        ['b', "I didn't think you'd care."],
        ['a', "Neither did I, honestly."],
      ] },
    ],
    why: [
      { when: { why: 'heartbreak', hasWith: true }, turns: [
        ['b', "It's {x}. I know I should be over it, I know everyone thinks I should have moved on. But I really thought it was going somewhere. I let myself believe it. And now I see {x} every day, laughing like nothing happened, and I just can't do it anymore."],
        ['a', "Of course you can't. Nobody could."],
      ] },
      { when: { why: 'heartbreak' }, turns: [
        ['b', "I just feel so stupid. I put everything into it, and it meant nothing. Like, nothing. I keep going over it in my head, trying to work out what I did wrong."],
        ['a', "You didn't do anything wrong."],
        ['b', "Then why does it feel like I did?"],
      ] },
      { when: { why: 'stress' }, turns: [
        ['b', "It's everything. It's all of it at once. The recouplings, the drama, never knowing if you're going home. I can't switch off. Even when I'm asleep I'm not asleep. And today it just all came out at once."],
        ['a', "That's so much to carry."],
        ['b', "I didn't even know I was carrying it until it fell on me."],
      ] },
      { when: { why: 'lonely' }, turns: [
        ['b', "I just feel really on my own. Everyone's got someone. Everyone's coupled up and happy, and I'm just... here. And I know I've got friends, I know I have. But at night, when everyone's in bed, it's really lonely."],
        ['a', "You're not on your own. I promise you're not."],
      ] },
      { when: { why: 'guilt' }, turns: [
        ['b', "I've done something I'm not proud of, and I can't take it back, and I can't stop thinking about it. Every time I look at someone, I feel like they can see it on my face."],
        ['a', "Whatever it is, you're not a bad person."],
        ['b', "I'm not sure about that today."],
      ] },
      { when: { why: 'jealousy' }, turns: [
        ['b', "I'm so jealous, and I hate it. I hate being like this. I'll see something tiny, a look, a laugh, and my head just goes. And then I'm sitting here crying over a look. Who cries over a look?"],
        ['a', "People who care. That's who."],
      ] },
      { when: { why: 'homesick' }, turns: [
        ['b', "I just miss home. I miss my bed, I miss my friends, I miss being able to go for a walk on my own. I miss people who've known me my whole life. In here, everyone's only known me five minutes."],
        ['a', "I know. It's so hard."],
        ['b', "I'm not even sad about anything. I just want to go home for an hour and come back."],
      ] },
      { turns: [
        ['b', "I don't even know why I'm crying. It's just all of it. I've been holding it in for days, and then someone said something nice to me at lunch, and that's what set me off. Something nice."],
        ['a', "That's usually how it goes."],
      ] },
    ],
    hold: [
      { turns: [
        ['a', "Listen to me. You are one of the best people in this villa. Everyone thinks so. And whatever's happening right now, it's not going to feel like this forever. Tomorrow's going to be easier, and the day after that's going to be easier again. I'm not going anywhere."],
        ['b', "Thank you."],
        ['a', "You don't have to thank me."],
      ] },
      { when: { of: 'partner' }, turns: [
        ['a', "Whatever's going on, we're in it together. You don't have to be strong for me. You don't have to put a face on. You can just be sad, and I'll still be here when you're done."],
        ['b', "I don't deserve you."],
        ['a', "You do. You deserve way more than me, actually."],
      ] },
      { when: { of: 'unexpected' }, turns: [
        ['a', "Look, I know we've had our differences. And I'm not saying we're best friends now. But nobody should feel like this on their own. And if you need someone to sit here and say nothing, I'm good at saying nothing."],
        ['b', "That's really kind of you."],
        ['a', "Don't tell anyone."],
      ] },
      { turns: [
        ['a', "Let it out. Honestly. Get it all out. You've been holding everyone else together since day one. You're allowed to fall apart for five minutes."],
        ['b', "It's been more than five minutes."],
        ['a', "Then ten. Take as long as you need."],
      ] },
      { when: { why: 'heartbreak' }, turns: [
        ['a', "Someone who walks away from you doesn't know what they had. That's on them, not you. And one day, someone's going to look at you the way you deserve, and you're going to forget this ever hurt."],
        ['b', "I hope so."],
        ['a', "I know so."],
      ] },
    ],
    lift: [
      { turns: [
        ['a', "Do you want me to go and push someone in the pool for you? Anyone. You pick."],
        ['b', "Don't make me laugh, I'm trying to cry."],
        ['a', "You can do both. It's called multitasking."],
      ] },
      { turns: [
        ['a', "Right. Here's the plan. Tissues, a cup of tea, and then we're going to sit on the daybeds and slag off everyone's outfits."],
        ['b', "That's a good plan."],
        ['a', "I'm full of good plans."],
      ] },
      { when: { bGender: 'f' }, turns: [
        ['a', "Your mascara's gone everywhere, by the way."],
        ['b', "Oh God."],
        ['a', "It's a look. Very dramatic. You'd win an award."],
      ] },
    ],
    close: [
      { turns: [], beat: "{a} holds {b} until the crying stops." },
      { turns: [['b', "Can we just stay here a bit longer?"], ['a', "As long as you want."]] },
      { turns: [], beat: "When they come back downstairs, {a} doesn't leave {b}'s side all evening." },
    ],
  },
  notes: [
    { stage: "{a} sits with {b} until {b} feels better." },
    { when: { of: 'partner' }, stage: "{a} comforts {b} on the daybed." },
  ],
});
