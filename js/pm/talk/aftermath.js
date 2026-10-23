// ══════════════════════════════════════════════════════════════════════
// pm/talk/aftermath.js — saying sorry, taking someone back, and the votes
// that leave a grudge; and the very first walk into the villa
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%").
//   apology           [a, b]     a says sorry to b. `of`: sincere · half
//   apology-rejected  [a, b]     b says no. `of`: not-yet · final
//   reunite           [a, b]     b takes a back. `of`: warm · mugged (the villa thinks b's mad)
//   vote-fallout      [a, b, c]  a goes for b, whose vote got c dumped. `of`: threat · grudge · tactical
//   vote-callout      [a, b]     a survived b's vote against them. `of`: threat · grudge · tactical
//   grudge-cold       [a, b]     a is still cold to b over that vote
//   grudge-end        [a, b]     `of`: truce · spark · never
//   first-arrival     [a, (b)]   the first walk in. `of`: first (a is first, alone) · arrive (b already here)
import { build } from './build.js';

export const APOLOGY = build('apology', {
  tiered: false,
  plans: { featured: ['ask', 'sorry', 'answer', 'land?'], short: ['ask', 'sorry'] },
  moves: {
    ask: [
      { stage: "{a} finds {b} alone on the terrace, and stops a careful distance away.", turns: [['a', "Can I talk to you? You don't have to say anything. Just let me say it."], ['b', "Go on."]] },
      { stage: "The daybeds, late. Everyone else has gone to bed.", turns: [['a', "Can I have two minutes?"], ['b', "You've got one."]] },
      { turns: [['a', "I've been trying to work out how to say this all day."], ['b', "Then just say it."]] },
    ],
    sorry: [
      { when: { of: 'sincere' }, turns: [['a', "I was wrong. There's no excuse, and I'm not going to stand here and make one. You deserved better than what I did, and I knew it while I was doing it."]] },
      { when: { of: 'sincere' }, turns: [['a', "I'm sorry. Properly sorry. Not sorry I got caught. Sorry I did it. I've thought about it every night, and every night it's worse."]] },
      { when: { of: 'sincere' }, turns: [['a', "I miss you. I know I don't get to say that. I did it, and I lost you, and it's the worst thing I've done in here. I'm not asking for anything. I just needed you to know I know."]] },
      { when: { of: 'half' }, turns: [['a', "Look, I'm sorry if you were upset."], ['b', "If I was upset?"], ['a', "You know what I mean."], ['b', "I know exactly what you mean. That's the problem."]] },
      { when: { of: 'half' }, turns: [['a', "I'm sorry. I am. But you were being a bit off with me as well, if we're being honest."], ['b', "So it's my fault now?"], ['a', "That's not what I said."], ['b', "It's exactly what you said."]] },
      { when: { of: 'half' }, turns: [['a', "Can we just move on? I said sorry. It wasn't that deep."], ['b', "It was deep to me."]] },
    ],
    answer: [
      { when: { of: 'sincere' }, turns: [['b', "Why should I believe you?"], ['a', "You shouldn't. Not yet. Let me show you instead of telling you."]] },
      { when: { of: 'sincere' }, turns: [['b', "That's the first honest thing you've said to me all week."], ['a', "I know. I want the next one to be honest too."]] },
      { when: { of: 'half' }, turns: [['b', "That's not an apology. That's you wanting this conversation to be over."]] },
      { when: { of: 'half' }, turns: [['b', "Sorry's meant to be about how it was for me. Not about how annoying it is for you."]] },
    ],
    land: [
      { when: { of: 'sincere' }, turns: [], beat: "{b} doesn't say yes. {b} doesn't walk away, either." },
      { when: { of: 'half' }, turns: [], beat: "{b} walks off, and {a} looks genuinely confused about why." },
    ],
  },
});

export const APOLOGY_REJECTED = build('apology-rejected', {
  tiered: false,
  plans: { featured: ['no', 'land?'], short: ['no'] },
  moves: {
    no: [
      { when: { of: 'not-yet' }, turns: [['b', "I hear you. I do. I'm just not there yet."], ['a', "Will you ever be?"], ['b', "I don't know. Ask me another day. Not today."]] },
      { when: { of: 'not-yet' }, turns: [['b', "Sorry isn't enough. Not yet."], ['a', "Then what is?"], ['b', "Time. And you not doing it again. And me actually believing that you won't."]] },
      { when: { of: 'not-yet' }, turns: [['b', "I want to believe you."], ['a', "Then believe me."], ['b', "It's not a switch. I can't just turn it back on because you've said the right words."]] },
      { when: { of: 'final' }, turns: [['b', "Stop. Please. I've said no, and I mean it. I'm not going to keep having this conversation."], ['a', "I'll stop. I'm sorry."]] },
      { when: { of: 'final' }, turns: [['b', "We're done. Really done. You need to let it go, for both of us."], ['a', "Okay. I'm sorry. For all of it."]] },
      { when: { of: 'final' }, turns: [['b', "I don't want an apology. I want you to leave me alone. That's the only thing you can do for me now."]] },
    ],
    land: [
      { when: { of: 'final' }, turns: [], beat: "{a} nods, and goes to the other end of the villa without looking back." },
      { when: { of: 'not-yet' }, turns: [], beat: "{a} doesn't push it. That might be the first thing {a} has got right." },
    ],
  },
});

export const REUNITE = build('reunite', {
  tiered: false,
  plans: { featured: ['yes', 'land'], short: ['yes', 'land'] },
  moves: {
    yes: [
      { when: { of: 'warm' }, turns: [['b', "One chance. That's it. One. You don't get another one after this."], ['a', "That's all I need. I swear, that's all I need."]] },
      { when: { of: 'warm' }, turns: [['b', "I've missed you, you idiot."], ['a', "I've missed you more."], ['b', "You don't get to win this one."]] },
      { when: { of: 'warm' }, turns: [['b', "If you ever do that again..."], ['a', "I won't. I promise you I won't."], ['b', "Okay. Okay. Come here."]] },
      { when: { of: 'mugged' }, turns: [['b', "I know what everyone's going to say. I know what they're saying already."], ['a', "Who cares what they say?"], ['b', "I do, a bit. I'm doing it anyway."]] },
      { when: { of: 'mugged' }, turns: [['b', "Everyone thinks I'm mad for this."], ['a', "Are you?"], ['b', "Probably. Don't make me regret it."]] },
    ],
    land: [
      { when: { of: 'warm' }, turns: [], beat: "{a} pulls {b} into a hug, and the villa, watching from the kitchen, cheers." },
      { when: { of: 'warm' }, turns: [], beat: "They kiss by the fire pit, and somebody wolf-whistles." },
      { when: { of: 'mugged' }, turns: [], beat: "Two of the islanders exchange a look. Nobody in the kitchen cheers." },
      { when: { of: 'mugged' }, turns: [], beat: "{b} takes {a.posAdj} hand anyway, and holds it a little too tight." },
    ],
  },
});

export const VOTE_FALLOUT = build('vote-fallout', {
  tiered: false,
  plans: { featured: ['open', 'answer', 'land?'], short: ['open', 'answer'] },
  moves: {
    open: [
      { when: { of: 'threat' }, stage: "The morning after. {a} walks straight up to {b} in the kitchen.", turns: [['a', "You got {c} dumped because you felt threatened. Say it. Just say it."]] },
      { when: { of: 'threat' }, stage: "On the terrace, {a} sits down across from {b}, and doesn't say hello.", turns: [['a', "Is your couple really that weak that you had to get rid of {c} to keep it?"]] },
      { when: { of: 'grudge' }, stage: "{a} finds {b} by the pool.", turns: [['a', "That wasn't a vote. That was personal. You've had it in for {c} since day one."]] },
      { when: { of: 'grudge' }, stage: "In the dressing room, {a} turns round to face {b}.", turns: [['a', "You couldn't wait, could you? First chance you got, you went for {c}."]] },
      { when: { of: 'tactical' }, stage: "At the kitchen table, {a} puts {a.posAdj} cup down and looks straight at {b}.", turns: [['a', "All that about not seeing their connection grow? Come on. That was tactical, and everyone at this table knows it."]] },
      { when: { of: 'tactical' }, stage: "By the fire pit, {a} catches {b} on {b.posAdj} own.", turns: [['a', "You got rid of {c} because it helps you. Not because of anything {c} did."]] },
    ],
    answer: [
      { when: { of: 'threat' }, turns: [['b', "I was protecting my couple. I'm allowed to do that."], ['a', "{c} never did anything to you."], ['b', "I wasn't going to wait until {c} did."]] },
      { when: { of: 'threat' }, turns: [['b', "That's not fair."], ['a', "Neither was your vote."]] },
      { when: { of: 'grudge' }, turns: [['b', "It was honest. That's what we were asked for."], ['a', "You got someone I cared about dumped because you don't like them."], ['b', "Yeah. I did. And {c} gave me every reason."]] },
      { when: { of: 'tactical' }, turns: [['b', "It wasn't tactical. It was my honest opinion."], ['a', "Then why {c}? Why the strongest couple in here?"], ['b', "That's a big thing to say."], ['a', "It's a big thing to do."]] },
    ],
    land: [
      { turns: [], beat: "{b} gets up and goes inside, and {a} lets {b.obj} go." },
      { turns: [], beat: "The whole pool has gone quiet, and stays quiet." },
    ],
  },
});

export const VOTE_CALLOUT = build('vote-callout', {
  tiered: false,
  plans: { featured: ['open', 'answer'], short: ['open', 'answer'] },
  moves: {
    open: [
      { when: { of: 'threat' }, stage: "{a} finds {b} on the lawn the next day.", turns: [['a', "You voted for me. You said it was about your partner. Do you really think I'd do that to you?"]] },
      { when: { of: 'threat' }, stage: "In the kitchen, {a} stands right next to {b}.", turns: [['a', "I'm still here, by the way. In case you hadn't noticed."]] },
      { when: { of: 'grudge' }, stage: "{a} sits down right next to {b} on the daybed.", turns: [['a', "You tried to get me dumped."]] },
      { when: { of: 'grudge' }, stage: "At the fire pit the next night, {a} stares across at {b}.", turns: [['a', "Surprised to see me?"]] },
      { when: { of: 'tactical' }, stage: "{a} catches {b} by the pool.", turns: [['a', "Your reason for voting for me was rubbish, and you know it."]] },
    ],
    answer: [
      { when: { of: 'threat' }, turns: [['b', "I don't know you well enough to know. That's the honest answer."], ['a', "Then get to know me before you try and send me home."]] },
      { when: { of: 'threat' }, turns: [['b', "I can see that."], ['a', "And I'm not after your partner. I never was."], ['b', "Good."]] },
      { when: { of: 'grudge' }, turns: [['b', "I said what I thought."], ['a', "Well, the villa didn't agree with you."], ['b', "Not this time."]] },
      { when: { of: 'grudge' }, turns: [['b', "Not really."], ['a', "I heard every word you said about me."], ['b', "Good. I meant every one."]] },
      { when: { of: 'tactical' }, turns: [['b', "It was my reason."], ['a', "It was your cover story."]] },
    ],
  },
});

export const GRUDGE_COLD = build('grudge-cold', {
  plans: { featured: ['snub', 'land?'], short: ['snub'] },
  moves: {
    snub: [
      { stage: "{b} says good morning to {a} in the kitchen. {a} walks past without a word.", turns: [['b', "Are we really doing this?"], ['a', "Doing what?"], ['b', "Ignoring me."], ['a', "I'm not ignoring you. I've just got nothing to say to you."]] },
      { stage: "At dinner, {a} moves to the other end of the table when {b} sits down.", turns: [['b', "Wow. Okay."], ['a', "I'd just rather sit here."]] },
      { stage: "On the daybeds, {b} tries to join the conversation.", turns: [['b', "What are we talking about?"], ['a', "Nothing you'd care about."], ['b', "That's a bit much."], ['a', "So was your vote."]] },
    ],
    land: [
      { turns: [], beat: "The whole table notices, and pretends not to." },
    ],
  },
});

export const GRUDGE_END = build('grudge-end', {
  tiered: false,
  plans: { featured: ['moment', 'land?'], short: ['moment'] },
  moves: {
    moment: [
      { when: { of: 'truce' }, stage: "{b} brings {a} a tea and sits down without asking.", turns: [['b', "I'm sorry it hurt you. It wasn't about you. It really wasn't."], ['a', "I know. I think I just needed someone to be angry at."], ['b', "Truce?"], ['a', "Truce."]] },
      { when: { of: 'truce' }, stage: "{a} finds {b} on the swing seat.", turns: [['a', "I'm done being angry. I'm exhausted. It's not what they'd want, anyway."], ['b', "Yeah?"], ['a', "Yeah."]] },
      { when: { of: 'spark' }, stage: "On the roof terrace, late, the row runs out of steam.", turns: [['a', "I really want to hate you."], ['b', "And?"], ['a', "And it's getting harder every day. That's annoying."], ['b', "Me too."]] },
      { when: { of: 'spark' }, stage: "By the fire pit, {a} and {b} are the last two up.", turns: [['b', "Can I say something mad?"], ['a', "You always do."], ['b', "I think I like you."], ['a', "That is mad."], ['b', "I know."]] },
      { when: { of: 'never' }, stage: "{b} tries one last time by the pool.", turns: [['b', "Can we just move on? Please?"], ['a', "You can. I'm not going to."]] },
      { when: { of: 'never' }, stage: "In the kitchen, {b} holds out a hand.", turns: [['b', "Friends?"], ['a', "No."]] },
    ],
    land: [
      { when: { of: 'truce' }, turns: [], beat: "They shake hands, and then, after a second, they hug." },
      { when: { of: 'spark' }, turns: [], beat: "Neither of them moves away." },
      { when: { of: 'never' }, turns: [], beat: "{b} lowers the hand, and {a} gets up and leaves." },
    ],
  },
});

export const FIRST_ARRIVAL = build('first-arrival', {
  tiered: false,
  plans: { featured: ['walk', 'hello', 'more?'], short: ['walk', 'hello'] },
  moves: {
    walk: [
      { when: { of: 'first' }, stage: "{a} is the very first islander to walk into the villa.", turns: [] },
      { when: { of: 'first' }, stage: "{a} walks down the steps into an empty villa, and does a little spin by the pool.", turns: [] },
      { when: { of: 'arrive', cast: 2 }, stage: "{a} walks into the villa, and {b} runs over for a hug before {a} has put the bag down.", turns: [] },
      { when: { of: 'arrive', cast: 2 }, stage: "{a} comes down the steps, and {b} waves from the daybeds.", turns: [] },
      { when: { of: 'arrive', cast: 2 }, stage: "{a} walks in, trying very hard to look calm. {b} can tell.", turns: [] },
      { when: { of: 'arrive', cast: 2 }, stage: "{a} arrives with a suitcase in each hand, and {b} goes to help.", turns: [] },
      { when: { of: 'arrive', cast: 1 }, stage: "{a} walks into the villa and takes a long look around.", turns: [] },
    ],
    hello: [
      { when: { of: 'first' }, turns: [['a', "Oh my God. Look at this place. I'm actually here. Hello? Anyone? Okay. Just me, then. I'll wait. I'll just stand here, looking good, and wait."]] },
      { when: { of: 'first' }, turns: [['a', "First one in. That has to mean something. It probably means I was early. I'm never early."]] },
      { when: { of: 'arrive', cast: 2 }, turns: [['b', "Hiya! I'm {b}. Oh my God, you look amazing."], ['a', "Stop, so do you! I'm {a}. I've been so nervous all day, I nearly turned round."]] },
      { when: { of: 'arrive', cast: 2 }, turns: [['b', "Come and sit down! How are you feeling?"], ['a', "Honestly? Like I'm dreaming. Give me a second to take it all in. Is it always this hot?"], ['b', "I've been here an hour, so I've got no idea."]] },
      { when: { of: 'arrive', cast: 2 }, turns: [['b', "You alright? You look like you're about to be sick."], ['a', "I'm fine. I'm totally fine. Is it hot out here, or is it me?"], ['b', "It's both."]] },
      { when: { of: 'arrive', cast: 2 }, turns: [['a', "I packed for a year."], ['b', "You might need it. Nobody knows how long anyone's here for."]] },
      { when: { of: 'arrive', cast: 2, persona: 'wallflower' }, turns: [['b', "Don't be shy. We're all as nervous as you are, I promise."], ['a', "That's actually really good to hear."]] },
      { when: { of: 'arrive', cast: 2, persona: 'messy' }, turns: [['a', "Did everyone see that? I nearly fell down the stairs."], ['b', "We all saw. It was a great start. Iconic, honestly."]] },
      { when: { of: 'arrive', cast: 1 }, turns: [['a', "Okay. This is real now. This is actually real."]] },
    ],
    more: [
      { when: { cast: 2 }, turns: [['a', "Right. What have I missed?"], ['b', "Nothing yet. You're just in time for all of it."]] },
      { when: { cast: 2 }, turns: [['b', "I love your outfit."], ['a', "Thank you! I changed three times. In the car."]] },
    ],
  },
});
