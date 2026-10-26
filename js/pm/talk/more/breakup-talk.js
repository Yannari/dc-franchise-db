// ══════════════════════════════════════════════════════════════════════
// pm/talk/more/breakup-talk.js — break-ups as they really happen (pm/breakups.js)
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-26: not every break-up is friendly, and the one on the
// receiving end doesn't always take it well. Every break-up now has a reason
// and a reaction, and these are the words for them:
//   DOUBT_END_REASONS   the doubt's end says WHY (`why`: ick · eyes · triangle ·
//                       played) and how {b} takes it (`took`: friends · hurt · bitter)
//   EX_STING            the ex is with somebody new ({x}): stung (to a friend) · snipe (at the ex)
//   EX_COLD             bitter exes: cold · bed (still coupled)
//   CASA_REACT_STUNG    an ex walks back in from Casa with somebody new
//   BLOWUP_DUMPED       a bitter ex finally says it (`cause: 'moved'`: there is a {x})
//   VENT_REASONS        the doubt's confide, for the two new reasons
const W = (when, ...turns) => ({ when, turns });

// "Not feeling it" and "behind" keep the old say lines; a reason of their own for the rest.
const LIGHT = ['ick', 'eyes', 'behind', 'cooling'];

export const DOUBT_END_REASONS = {
  moves: {
    // A triangle walk-out comes with no talk the day before (triangle.js walkOut).
    open: [
      { when: { of: 'friends', why: 'triangle' }, stage: "{a} finds {b} by the pool, and doesn't sit down.", turns: [['b', "What's wrong?"], ['a', "You know what's wrong. Everybody knows what's wrong."]] },
      { when: { of: 'friends', why: 'triangle' }, stage: "{a} has watched {b} and {x} all afternoon, and has had enough.", turns: [['a', "Can I have a word? Just us."], ['b', "Now?"], ['a', "Now."]] },
    ],
    say: [
      W({ of: 'friends', why: 'ick' }, ['a', "I don't think we work. Every day it's something. The way we talk to each other, the way we wind each other up. I don't want to spend the rest of this in a fight with you."], ['b', "So that's it?"], ['a', "I think it has to be."]),
      W({ of: 'friends', why: 'ick' }, ['a', "Can I be honest? We clash. All the time. And I've tried to ignore it, but I can't any more. I think we're better off not being a couple."]),
      W({ of: 'friends', why: 'eyes' }, ['a', "I owe you the truth. My head's been somewhere else. With {x}. Nothing's happened, but I can't stand next to you and pretend it hasn't been turned. That's not fair on you."], ['b', "{x}. Right."]),
      W({ of: 'friends', why: 'eyes' }, ['a', "I'd rather tell you now than have you hear it from someone else. I've been thinking about {x}. A lot. And I can't keep being in this with you while I'm doing that."]),
      W({ of: 'friends', why: 'triangle' }, ['a', "I'm not doing this any more. You're stuck between me and {x}, and I'm sitting here every day waiting to find out if I'm the one you pick. I'm not somebody's maybe. I'm taking myself out of it."], ['b', "I never asked you to wait."], ['a', "No. You just let me."]),
      W({ of: 'friends', why: 'triangle' }, ['a', "I can't be in a triangle. I won't. Whatever you've got going on with {x}, you sort it out on your own, because I'm done being one side of it."]),
      W({ of: 'friends', why: 'played' }, ['a', "I know what you've been doing. Everyone's told me, and I didn't want to believe it, but I do now. You've been playing a game with me. So this is over."], ['b', "That's not what it was."], ['a', "Then what was it?"]),
      W({ of: 'friends', why: 'played' }, ['a', "I was the safe option, wasn't I? The one everyone likes, so you'd be fine at the recoupling. I'm not going to be your strategy any more."]),
    ],
    answer: [
      W({ of: 'friends', took: 'friends', why: LIGHT }, ['b', "Honestly? I've been feeling it too. I just didn't want to be the one to say it."], ['a', "Really?"], ['b', "Really. I'm almost relieved."]),
      W({ of: 'friends', took: 'friends', why: LIGHT }, ['b', "I'm not going to pretend I'm devastated. We were always better as friends than anything else."], ['a', "Friends, then?"], ['b', "Friends."]),
      W({ of: 'friends', took: 'hurt', why: LIGHT }, ['b', "I'm not going to lie and say I'm fine. I'm not. But I'm not going to beg you either."], ['a', "I'm sorry."], ['b', "I know. Just give me some space."]),
      W({ of: 'friends', took: 'hurt', why: LIGHT }, ['b', "Okay. Okay. I'll be all right. I just need a minute."]),
      W({ of: 'friends', took: 'bitter', why: LIGHT }, ['b', "Don't say friends. Don't you dare say friends to me right now."], ['a', "I wasn't going to."], ['b', "Good. Because I've got enough of them in here."]),
      W({ of: 'friends', took: 'bitter', why: LIGHT }, ['b', "You know what, thanks for letting me know. Really. Very kind of you. Enjoy the rest of your summer."]),
      W({ of: 'friends', why: 'triangle' }, ['b', "If that's what you want."], ['a', "It's not what I want. It's what I need."]),
      W({ of: 'friends', why: 'played' }, ['b', "You've got it wrong. Whatever they've told you, you've got it wrong."], ['a', "Then why can't you look at me?"]),
    ],
    close: [
      W({ of: 'friends', took: 'friends', why: LIGHT }, ['a', "Come here."]),
      W({ of: 'friends', took: 'bitter' }),
      W({ of: 'friends', why: ['triangle', 'played'] }),
    ].map((e, i) => (i === 0 ? { ...e, beat: "They hug, and for once it's easy." }
      : i === 1 ? { ...e, beat: "{b} walks off before {a} can say anything else, and doesn't look back." }
        : { ...e, beat: "{a} gets up and walks back inside without waiting for an answer." })),
  },
};

export const EX_STING = {
  // Short or long, it opens on what was seen: a sting with no {x} in it is a mood, not a scene.
  plans: { featured: ['open', 'middle', 'close'], short: ['open', 'middle'] },
  stages: [
    { when: { of: 'stung' }, stage: "{a} and {b} are on the daybeds. Across the garden, {c} is with {x}." },
    { when: { of: 'snipe' }, stage: "{a} catches {b} on the way back from the kitchen." },
  ],
  moves: {
    open: [
      { when: { of: 'stung' }, stage: "{a} has gone quiet on the daybeds. {b} follows {a.posAdj} eyes across the garden, to {c} and {x}.", turns: [['b', "Oh. Are you okay?"], ['a', "I'm fine. I'm absolutely fine."]] },
      { when: { of: 'stung' }, stage: "{a} drags {b} into the dressing room and shuts the door.", turns: [['a', "Did you see that? {c} and {x}?"], ['b', "I saw."]] },
      { when: { of: 'snipe' }, stage: "{a} waits until {b} is on {b.posAdj} own by the pool.", turns: [['a', "That didn't take you long, did it?"], ['b', "Here we go."]] },
      { when: { of: 'snipe' }, turns: [['a', "{x}. Really?"], ['b', "What about {x}?"]] },
    ],
    middle: [
      { when: { of: 'stung', ago: 'today' }, turns: [['a', "We only finished this morning. This morning. And I'm meant to just sit here and watch it."], ['b', "You don't have to watch anything. Come inside with me."]] },
      { when: { of: 'stung', ago: 'days' }, turns: [['a', "It's been days. I know it's been days. I know I'm meant to be over it."], ['b', "There's no rule. It takes as long as it takes."]] },
      { when: { of: 'stung' }, turns: [['a', "I'm not even angry. That's the worst part. I just wish it didn't still hurt."], ['b', "It will stop. Not today, but it will."]] },
      { when: { of: 'snipe', ago: 'today' }, turns: [['a', "We were together this morning. This morning. And now it's {x}."], ['b', "We weren't together. You know we weren't. That's the whole point."], ['a', "Clearly."]] },
      { when: { of: 'snipe' }, turns: [['b', "I don't owe you anything. We're not together any more."], ['a', "No, you made that very clear. I just didn't think you'd be making it this clear."]] },
      { when: { of: 'snipe', cause: ['cheated', 'played'] }, turns: [['a', "At least you're not hiding it this time."], ['b', "That's low."], ['a', "You'd know."]] },
    ],
    close: [
      { when: { of: 'stung' }, turns: [], beat: "{b} puts an arm round {a}, and neither of them looks back across the garden." },
      { when: { of: 'stung' }, turns: [['a', "I'm going to bed."], ['b', "It's four in the afternoon."], ['a', "I'm going to bed."]] },
      { when: { of: 'snipe' }, turns: [], beat: "{a} walks off, and {b} stands there with everyone pretending not to have heard." },
      { when: { of: 'snipe' }, turns: [['b', "Are you done?"], ['a', "Yes. I'm done."]] },
    ],
  },
  notes: [
    { when: { of: 'stung' }, stage: "{a} watches {c} and {x} across the garden, and {b} takes {a} inside." },
    { when: { of: 'snipe' }, stage: "{a} makes a pointed comment to {b} about {x}." },
  ],
};

export const EX_COLD = {
  plans: { featured: ['open', 'middle', 'close'], short: ['middle', 'close'] },
  stages: [
    { when: { of: 'cold' }, stage: "Breakfast. {a} and {b} end up at the same end of the table." },
    { when: { of: 'bed', phase: 'evening' }, stage: "Lights out, and {a} and {b} are still in the same bed." },
  ],
  moves: {
    open: [
      { when: { of: 'cold' }, stage: "{b} sits down at the table. {a} picks up {a.posAdj} plate and moves to the other end.", turns: [['b', "Seriously?"]] },
      { when: { of: 'cold' }, stage: "{a} and {b} reach for the kettle at the same time.", turns: [['a', "After you."], ['b', "No, go on."], ['a', "I said after you."]] },
      { when: { of: 'bed', phase: 'evening' }, stage: "{a} builds a wall of pillows down the middle of the bed without a word.", turns: [['b', "Is that really necessary?"], ['a', "Yes."]] },
    ],
    middle: [
      { when: { of: 'cold', cause: ['cheated', 'played'] }, turns: [['b', "Are we going to talk at some point?"], ['a', "You did your talking. With somebody else."]] },
      { when: { of: 'cold' }, turns: [['b', "We can't go on like this. We're in the same villa."], ['a', "Watch me."]] },
      { when: { of: 'cold' }, turns: [['b', "You can't ignore me forever."], ['a', "I'm not ignoring you. I just don't have anything to say to you."]] },
      { when: { of: 'bed', cause: ['cheated', 'played'], phase: 'evening' }, turns: [['b', "Can we at least talk?"], ['a', "No. I have to share a bed with you until the next recoupling. I don't have to talk to you."]] },
      { when: { of: 'bed', phase: 'evening' }, turns: [['b', "Goodnight, then."], ['a', "Mm."]] },
    ],
    close: [
      { when: { of: 'cold' }, turns: [], beat: "Two people at the far end of the table share a look, and say nothing." },
      { when: { of: 'cold' }, turns: [], beat: "{a} leaves the rest of {a.posAdj} breakfast and walks out to the pool." },
      { when: { of: 'bed', phase: 'evening' }, turns: [], beat: "They sleep back to back, as close to the edges as they can get." },
    ],
  },
  notes: [
    { when: { of: 'cold' }, stage: "{a} won't sit anywhere near {b}." },
    { when: { of: 'bed', phase: 'evening' }, stage: "{a} and {b} share a bed and not a single word." },
  ],
};

export const CASA_REACT_STUNG = {
  moves: {
    face: [
      { when: { of: 'stung' }, stage: "{a} watches {b} come down the steps with {c}, and keeps {a.posAdj} face very still.", turns: [['a', "Well. Good for you."]] },
      { when: { of: 'stung' }, turns: [['a', "We weren't together any more. I know that. I still didn't want to see it."]] },
    ],
    words: [
      { when: { of: 'stung' }, turns: [['b', "We'd finished. You know we had."], ['a', "I know. I'm not asking you for anything."]] },
    ],
    land: [
      { when: { of: 'stung' }, turns: [], beat: "{a} claps with everyone else, and nobody believes it." },
    ],
  },
};

export const BLOWUP_DUMPED = {
  moves: {
    open: [
      { when: { of: 'dumped' }, stage: "{a} has been quiet for days, and then {b} laughs at something across the kitchen.", turns: [['a', "Funny, is it?"], ['b', "What's your problem?"], ['a', "You. You're my problem."]] },
      { when: { of: 'dumped', cause: 'moved' }, stage: "By the pool. {b} and {x} have their heads together again.", turns: [['a', "Have you got a minute? Or are you too busy with {x}?"], ['b', "Not now."]] },
    ],
    charge: [
      W({ of: 'dumped' }, ['a', "You ended it like it was nothing. Like I was nothing. And then you went straight back to normal, laughing, like none of it happened."]),
      W({ of: 'dumped', cause: 'moved' }, ['a', "You told me it wasn't working. It was working fine. It just wasn't working with me, because you'd already decided on {x}."]),
      W({ of: 'dumped' }, ['a', "Do you know what it's like, sitting at that table every day, watching you act like I was never here?"]),
    ],
    defend: [
      W({ of: 'dumped' }, ['b', "I was honest with you. Would you rather I'd strung you along?"], ['a', "I'd rather you hadn't made me feel stupid for believing it."]),
      W({ of: 'dumped' }, ['b', "We broke up. People do. I can't stop living because you're upset with me."], ['a', "Nobody's asking you to stop living. I'm asking you to stop rubbing it in."]),
    ],
  },
};

// Picking an ex at a recoupling (moments.js exPick): the speech says which it is.
export const RECOUPLE_EX = {
  moves: {
    speech: [
      W({ exPick: 'rekindled' }, ['a', "I know what everyone's thinking. We tried this, it didn't work, and we said we were better off apart. But I've had time to think, and I don't want to be apart. I want to give it another go, properly this time."]),
      W({ exPick: 'rekindled' }, ['a', "Some things don't go away just because you decide they should. I tried. It didn't work. So I'm going back to the person I never really stopped thinking about."]),
      W({ exPick: 'hoping' }, ['a', "I'm not going to stand here and pretend I'm over it, because I'm not. It didn't work out between us, and I know where they stand. But I'm not ready to give up. Not yet."]),
      W({ exPick: 'hoping' }, ['a', "Everyone's going to say I'm mad. Maybe I am. But the person I'm picking still means more to me than anyone else in this villa, whatever happened between us."]),
      W({ exPick: 'friend' }, ['a', "This might surprise a few people. I'm picking someone I trust. We know exactly where we stand with each other. We're friends, and right now that's what I need."]),
      W({ exPick: 'friend' }, ['a', "I'm not picking this person because of what we were. I'm picking them because of what we are now, which is friends. Good ones."]),
    ],
    react: [
      { when: { exPick: 'rekindled' }, turns: [['b', "I was hoping you'd say that."]], beat: "{b} is already on {b.posAdj} feet before {a} has finished, and the fire pit goes up." },
      { when: { exPick: 'rekindled' }, turns: [], beat: "{b} laughs, shakes {b.posAdj} head, and walks straight over to {a}." },
      { when: { exPick: 'hoping' }, turns: [['b', "Thank you. Really."]], beat: "{b} hugs {a}, a little carefully, and they sit down with a gap between them." },
      { when: { exPick: 'hoping' }, turns: [], beat: "{b} gets up slowly. Nobody on the benches quite knows where to look." },
      { when: { exPick: 'friend' }, turns: [['b', "Friends?"], ['a', "Friends."]], beat: "They fist-bump, and the fire pit laughs." },
      { when: { exPick: 'friend' }, turns: [], beat: "{b} grins and sits down next to {a} like it's the most normal thing in the world." },
    ],
  },
};

export const VENT_REASONS = {
  moves: {
    moan: [
      { when: { why: 'triangle' }, turns: [
        ['a', "{pa} can't decide between me and {x}. And I'm meant to sit here and wait to find out if I'm the one? I'm not doing it. I'm not being somebody's maybe."],
        ['b', "Have you said that to {pa}?"],
        ['a', "Not yet. I'm going to."],
      ] },
      { when: { why: 'played' }, turns: [
        ['a', "Everyone keeps telling me {pa} is playing me. I didn't want to believe it. But the more I watch, the more I think they're right."],
        ['b', "What are you going to do?"],
        ['a', "I don't know yet. But I'm not going to be anybody's game."],
      ] },
    ],
  },
};
