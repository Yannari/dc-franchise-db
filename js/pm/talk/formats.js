// ══════════════════════════════════════════════════════════════════════
// pm/talk/formats.js — the formats a season books now and then: other
// ways to couple up on night one, other ways for a new arrival to land,
// the secret mission, the sleepover, immunity, a walk-out, the envelope
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%"). Dior hosts where the show
// has a host speak; everything else is the islanders.
//   first-look       [a, b]       night one, before the coupling. `of`: spark (b is into a) · polite
//   profile-pick     [a, b]       night one: a picks b from a dating profile
//   public-couple    [a, b]       night one: the public put a with b
//   ranking-couple   [a, b]       night one: the same place in the ranking. `rank`: top · lower
//   stand-up         [a, b, (c)]  a stands up for new arrival b; c is a's partner (`taken`)
//   stand-up-pick    [a, b, (c)]  new arrival a chooses b; `stoleFrom`: c was b's partner
//   save-setup       [a, b]       a and b are single and at risk; a new arrival decides. `of`: dump · kept
//   bombshell-save   [a, b, c]    new arrival a keeps b; c is not chosen. `of`: dump · kept
//   public-match     [a, b, (c)]  the public couple new arrival a with b; `stoleFrom`: c was b's
//   return-ex        [a, b, (c)]  returnee a faces ex b; `stoleFrom`: b is with c now
//   mission-brief    [a]          new arrival a is given a secret task
//   mission-dump     [a, b, c]    a names b and c to be dumped
//   mission-return   [a, b]       a and b are given a second chance
//   sleepover-invite [a, b, c]    new arrival a takes b to the sleepover villa; c is b's partner
//   sleepover-night  [a, b]       a and b, two nights away
//   sleepover-single [a]          nobody chose a
//   sleepover-choice [a, b, (c)]  `choice` stick: b is a's partner · twist: b is the arrival, c is left
//   immunity-win     [a, b]       a and b win, and are safe tonight
//   walk             [a] / [a, b] a walks (`cause`: heartbreak · homesick · solidarity, with b)
//   walk-doubt       [a, b, (c), (d)] a tells friend b; c is a's ex, d the ex's new partner.
//                                `of`: moved-on · heartbreak · with-them · homesick
//   walk-goodbye     [a, b]       friend b walks a to the steps. `of`: the cause
//   walk-after       [a, b, c]    ex a and friend b, after c walked. `of`: moved-on · with-them · heartbreak
//   envelope         [a, b]       the final's envelope: a holds it. `choice`: split · steal
//   save-tie         [a, b]       tied saves; the public's vote breaks it, for a
import { build } from './build.js';

const ONE = { tiered: false };

export const FIRST_LOOK = build('first-look', {
  plans: { featured: ['meet', 'talk'], short: ['meet'] },
  moves: {
    meet: [
      { when: { of: 'spark' }, stage: "Once everyone has arrived, {a} and {b} end up talking by the pool.", turns: [['a', "So what's your type? On paper."], ['b', "Honestly? Someone a bit like you."], ['a', "Okay. I like that answer. I like it a lot."]] },
      { when: { of: 'spark' }, stage: "{a} can't stop looking at {b} across the terrace, and finally goes over.", turns: [['a', "I've been trying to work up the nerve to come and say hello for about twenty minutes."], ['b', "I was hoping you would. I was about to come to you."]] },
      { when: { of: 'polite' }, stage: "{a} goes over to {b}, full of confidence.", turns: [['a', "I'm just going to say it. You're my type on paper."], ['b', "That's sweet. Let's see how the night goes."]] },
      { when: { of: 'polite' }, stage: "{a} and {b} sit together on the daybeds, a polite distance apart.", turns: [['a', "So. Nice to meet you."], ['b', "You too. Lovely. This is all lovely."]] },
    ],
    talk: [
      { when: { of: 'spark' }, turns: [['b', "I'm not going to lie, you're the first person I noticed. From the top of the steps."], ['a', "Same. Is that mad? That's mad."], ['b', "It's a bit mad."]] },
      { when: { of: 'polite' }, turns: [['b', "What are you looking for in here?"], ['a', "Someone who gets my sense of humour."], ['b', "And what's your sense of humour?"], ['a', "Still working that out."]] },
    ],
  },
});

export const PROFILE_PICK = build('profile-pick', {
  ...ONE,
  plans: { featured: ['pick', 'meet'], short: ['pick'] },
  moves: {
    pick: [
      { stage: "{a} walks along the row of dating profiles and stops at {b}'s.", turns: [['a', "This one sounds like trouble. In a good way. I'm sold."]] },
      { stage: "{a} reads every profile twice before standing by {b}'s.", turns: [['a', "The quote made me laugh. That's all I'm going on. That's enough, isn't it?"]] },
      { stage: "{a} hovers between two profiles for a long time, then picks {b}'s.", turns: [['a', "It says hopeless romantic. We'll see about that."]] },
    ],
    meet: [
      { turns: [['b', "Is that a good face or a bad face?"], ['a', "That's a 'thank God' face."], ['b', "I'll take a 'thank God' face."]] },
      { turns: [['b', "So you picked me from a piece of paper."], ['a', "A very good piece of paper. Better in person, though."]] },
    ],
  },
});

export const PUBLIC_COUPLE = build('public-couple', {
  ...ONE,
  plans: { featured: ['reveal', 'talk'], short: ['reveal'] },
  moves: {
    reveal: [
      { stage: "{b} walks down the steps, and the public's choice for {a} is revealed.", turns: [['a', "Oh, the country knows me. The country actually knows me."]] },
      { stage: "The public put {a} with {b}, and they shake hands like it's a job interview.", turns: [['a', "Nice to meet you. I'm your {a.gf}, apparently."]] },
      { stage: "{b} is the last one down the steps, and walks straight over to {a}.", turns: [['b', "I've been told you're mine."], ['a', "That's one way to say hello."]] },
    ],
    talk: [
      { turns: [['b', "Do you think we'd have picked each other?"], ['a', "Maybe. We'll never know now. Let's just say yes."]] },
      { turns: [['a', "The public have put a lot of faith in us."], ['b', "No pressure, then."], ['a', "None at all."]] },
    ],
  },
});

export const RANKING_COUPLE = build('ranking-couple', {
  ...ONE,
  plans: { featured: ['read', 'talk?'], short: ['read'] },
  moves: {
    read: [
      { when: { rank: 'top' }, turns: [['dior', "At the top of both rankings: {a} and {b}. You are our first couple."], ['a', "First. We came first. Did everyone hear that?"]] },
      { when: { rank: 'lower' }, stage: "The ranking pairs {a} with {b}, the same place on both lists.", turns: [['a', "Right. Let's show everyone they got the order wrong."]] },
      { when: { rank: 'lower' }, stage: "{a} and {b} walk over to each other when their positions are read out.", turns: [['a', "Hello, partner."], ['b', "Hello. This is so strange. I've never been ranked before."]] },
      { stage: "{a} and {b} meet in the middle when their places are read out.", turns: [['b', "Honestly, I'd have picked you anyway."]] },
    ],
    talk: [
      { turns: [['b', "Does it bother you, where we came?"], ['a', "Ask me again at the final."]] },
    ],
  },
});

export const STAND_UP = build('stand-up', {
  plans: { featured: ['stand', 'react?'], short: ['stand'] },
  moves: {
    stand: [
      { when: { taken: false }, stage: "The new arrival asks who would like to get to know them. {a} is on {a.posAdj} feet first.", turns: [['a', "I'm single. Why not? I've got nothing to lose."]] },
      { when: { taken: false }, stage: "{a} stands up almost before the question is finished.", turns: [['a', "Me. Hi. I'm standing. I'm definitely standing."]] },
      { when: { taken: true }, stage: "Slowly, {a} stands up. {c} is still sitting on the bench.", turns: [['c', "Seriously?"], ['a', "I just want to see. That's all. I just want to see."]] },
      { when: { taken: true, persona: 'game-player' }, stage: "{a} stands up and doesn't look at {c} once.", turns: [['a', "I'm keeping my options open. That's what the show's for."]] },
    ],
    react: [
      { when: { taken: true }, turns: [['c', "Wow. Okay. Good to know."]] },
      { when: { taken: false }, turns: [['b', "Thank you. I appreciate that."]] },
    ],
  },
});

export const STAND_UP_PICK = build('stand-up-pick', {
  ...ONE,
  plans: { featured: ['pick', 'land?'], short: ['pick'] },
  moves: {
    pick: [
      { when: { stoleFrom: true }, turns: [['a', "I know it's a lot to ask. But you stood up, and that told me something. {b}, I'm choosing you."], ['c', "I hope you meant it, then."]] },
      { when: { stoleFrom: true }, turns: [['a', "{b}. You stood up for me, so I hope you meant it."], ['b', "I meant it."]] },
      { when: { stoleFrom: false }, turns: [['a', "Thank you to everyone who stood up. Honestly. But there's one person I want to get to know, and that's {b}."]] },
    ],
    land: [
      { when: { stoleFrom: true }, turns: [], beat: "{b} walks across the fire pit. {c} doesn't move." },
      { when: { stoleFrom: false }, turns: [], beat: "{b} grins and goes to sit next to {a}." },
    ],
  },
});

export const SAVE_SETUP = build('save-setup', {
  ...ONE,
  plans: { featured: ['news', 'talk'], short: ['news'] },
  moves: {
    news: [
      { turns: [['dior', "{a}. {b}. You're both single, so you're vulnerable. And the person who decides what happens to you hasn't even met you yet."]] },
      { when: { of: 'dump' }, stage: "A text arrives for the single islanders.", turns: [['a', "'A new arrival is going to take you on dates, and then choose one of you to save.'"], ['b', "And the rest of us go home?"]] },
      { when: { of: 'kept' }, stage: "A text arrives for the single islanders.", turns: [['a', "'A new arrival is taking you on dates, and then choosing one of you to couple up with.'"], ['b', "And the rest of us stay single. And vulnerable."]] },
    ],
    talk: [
      { turns: [['b', "Well. May the best one win."], ['a', "Don't. I feel sick. I don't even know what they look like."]] },
      { turns: [['a', "So we're competing for someone we've never met."], ['b', "Welcome to the villa."]] },
    ],
  },
});

export const BOMBSHELL_SAVE = build('bombshell-save', {
  ...ONE,
  plans: { featured: ['pick', 'after?'], short: ['pick'] },
  moves: {
    pick: [
      { turns: [['a', "I had a really nice time with both of you. Honestly. But the person I want to get to know is {b}."]] },
      { when: { of: 'dump' }, turns: [['a', "This is so hard, because it means someone goes home. {c}, you're lovely, and I'm so sorry. {b}, I'm saving you."]] },
      { when: { of: 'kept' }, turns: [['a', "I had a great time with both of you. But I want to couple up with {b}."], ['dior', "{c}, you're staying in the villa tonight. But you're single, and very vulnerable."]] },
    ],
    after: [
      { when: { of: 'dump' }, turns: [['c', "It's fine. I get it. I'd have done the same."]] },
      { turns: [['b', "Thank you. I wasn't sure. I really wasn't sure."]] },
    ],
  },
});

export const PUBLIC_MATCH = build('public-match', {
  ...ONE,
  plans: { featured: ['read', 'react'], short: ['read'] },
  moves: {
    read: [
      { turns: [['dior', "The public have been voting for who our new arrival should couple up with. {a}, you are now coupled up with {b}."]] },
      { stage: "A text arrives: the public have chosen who {a} will couple up with. {b} reads it out.", turns: [['b', "The public have coupled me up with {a}! Me!"]] },
    ],
    react: [
      { when: { stoleFrom: true }, turns: [['c', "Of course it's you."], ['b', "I didn't choose this."], ['c', "You didn't exactly fight it."]] },
      { when: { stoleFrom: false }, turns: [['a', "Well, the public have good taste."], ['b', "They really do."]] },
    ],
  },
});

export const RETURN_EX = build('return-ex', {
  ...ONE,
  plans: { featured: ['meet', 'talk'], short: ['meet'] },
  moves: {
    meet: [
      { when: { stoleFrom: true }, stage: "{a} finds {b} on the daybed with {c}.", turns: [['a', "Wow. That didn't take you long."], ['b', "What was I supposed to do? You were gone."]] },
      { when: { stoleFrom: false }, stage: "{a} and {b} sit down together for the first time since {a} left.", turns: [['b', "I thought I'd never see you again."], ['a', "Well. Here I am."]] },
    ],
    talk: [
      { when: { stoleFrom: true }, turns: [['a', "I saw everything, {b}. You were with {c} before I'd even got home."], ['b', "It's not like that."], ['a', "It looked exactly like that."]] },
      { when: { stoleFrom: false }, turns: [['a', "Did you wait for me?"], ['b', "Of course I did. Every single day."]] },
    ],
  },
});

export const MISSION_BRIEF = build('mission-brief', {
  ...ONE,
  plans: { featured: ['brief', 'react'], short: ['brief'] },
  moves: {
    brief: [
      { stage: "That night, a text arrives for {a} alone.", turns: [['a', "'Within the next 48 hours, you must choose one boy and one girl to dump from the island.' Oh my God."]] },
      { turns: [['dior', "{a}, you have a secret task. Two islanders are going home, and you are going to choose them."]] },
    ],
    react: [
      { turns: [['a', "Right. Nobody can know about this. Nobody. I'm going to have to be very, very normal."]] },
      { turns: [['a', "I've been here five minutes, and I've got to send two people home. That's going to make me so popular."]] },
    ],
  },
});

export const MISSION_DUMP = build('mission-dump', {
  ...ONE,
  plans: { featured: ['name', 'react'], short: ['name'] },
  moves: {
    name: [
      { stage: "At the fire pit, {a} stands up with the secret everyone now knows about.", turns: [['a', "I've had to make the hardest decision since I walked in. I'm dumping {b} and {c}."]] },
      { turns: [['a', "This isn't personal. I need you all to know it isn't personal. {b}. {c}. I'm so sorry."]] },
    ],
    react: [
      { turns: [['b', "You've known us two days."], ['a', "I know. That's why it had to be someone."]] },
      { turns: [['c', "Wow. Okay. Good luck, everyone."]] },
    ],
  },
});

export const MISSION_RETURN = build('mission-return', {
  ...ONE,
  plans: { featured: ['back'], short: ['back'] },
  moves: {
    back: [
      { turns: [['a', "We're back? We're actually back?"], ['b', "I'd already packed. I'd packed everything."]] },
      { turns: [['b', "Second chance. Let's not waste it."], ['a', "Not a single day of it."]] },
    ],
  },
});

export const SLEEPOVER_INVITE = build('sleepover-invite', {
  ...ONE,
  plans: { featured: ['invite', 'goodbye?'], short: ['invite'] },
  moves: {
    invite: [
      { stage: "{a} has chosen who to take to the sleepover villa for two nights.", turns: [['a', "{b}, grab your bag. You're coming with me."], ['c', "Two nights? Seriously?"]] },
      { turns: [['dior', "{b}, you are going to spend the next 48 hours in a separate villa with {a}. {c}, you'll be staying here."]] },
    ],
    goodbye: [
      { stage: "{b} kisses {c} goodbye before leaving with {a}.", turns: [['c', "Behave."], ['b', "Always. Two nights. That's nothing."]] },
    ],
  },
});

export const SLEEPOVER_NIGHT = build('sleepover-night', {
  plans: { featured: ['talk', 'more?'], short: ['talk'] },
  stages: [{ stage: "The sleepover villa, late. Just the two of them, and a lot of quiet.", turns: [] }],
  moves: {
    talk: [
      { turns: [['b', "It's so weird being away from everyone."], ['a', "Good weird or bad weird?"], ['b', "I'll tell you tomorrow."]] },
      { turns: [['a', "Can I ask you something? Honestly. Do you think about going back to them?"], ['b', "Every hour."], ['a', "And the rest of the hour?"], ['b', "The rest of the hour is complicated."]] },
      { turns: [['b', "This is the first time I've heard myself think in days."], ['a', "And what are you thinking?"], ['b', "That I didn't expect to like you this much."]] },
    ],
    more: [
      { turns: [['a', "Whatever you decide, I'll be fine. I want you to know that."], ['b', "That's the nicest thing anyone's said to me in here."]] },
    ],
  },
});

export const SLEEPOVER_SINGLE = build('sleepover-single', {
  ...ONE,
  plans: { featured: ['single'], short: ['single'] },
  moves: {
    single: [
      { turns: [['dior', "{a}, nobody chose to couple up with you, so you are now single. You'll stay in the villa, but you are very vulnerable."]] },
      { stage: "{a} carries {a.posAdj} bag back into the main villa alone.", turns: [['a', "Two nights, and I'm walking back in single. Fine. I've still got time to turn some heads."]] },
      { stage: "At the fire pit, {a} is the only one left standing.", turns: [['a', "I took a chance on someone who wasn't ready to move on. That's on me. I'd do it again."]] },
    ],
  },
});

export const SLEEPOVER_CHOICE = build('sleepover-choice', {
  ...ONE,
  plans: { featured: ['back', 'land?'], short: ['back'] },
  moves: {
    back: [
      { when: { choice: 'stick' }, stage: "{a} walks back into the main villa alone.", turns: [['a', "I had a nice time. I did. But I knew the whole time who I wanted to come back to. {b}."], ['b', "I was so scared you weren't coming back."]] },
      { when: { choice: 'stick' }, stage: "{a} comes back from the sleepover villa and finds {b} waiting at the door.", turns: [['a', "Nothing happened. I promise. I just wanted to come home."], ['b', "This is home?"], ['a', "You're home."]] },
      { when: { choice: 'twist' }, stage: "{a} walks back in holding hands with {b}. {c} sees them from across the garden.", turns: [['c', "Oh, you're joking."], ['a', "I'm sorry. I felt something, and I have to see where it goes."]] },
    ],
    land: [
      { when: { choice: 'stick' }, turns: [], beat: "{b} runs over and nearly knocks {a} off {a.posAdj} feet." },
      { when: { choice: 'twist' }, turns: [], beat: "{c} walks straight into the villa and shuts the door." },
    ],
  },
});

export const IMMUNITY_WIN = build('immunity-win', {
  ...ONE,
  plans: { featured: ['win', 'after'], short: ['win'] },
  moves: {
    win: [
      { turns: [['dior', "Congratulations, {a} and {b}. You've won tonight's challenge, which means you are safe from the dumping."]] },
      { stage: "{a} and {b} win the challenge by a mile.", turns: [['a', "We're safe! We're actually safe!"]] },
    ],
    after: [
      { turns: [['b', "I have never tried so hard at anything in my life."], ['a', "You were incredible. You were terrifying, but incredible."]] },
      { turns: [['b', "That's us, then. We can relax."], ['a', "You can relax. I'm going to sit back and watch everyone else panic."]] },
    ],
  },
});

export const WALK = build('walk', {
  ...ONE,
  plans: { featured: ['gather', 'say', 'land'], short: ['say', 'land'] },
  moves: {
    gather: [
      { stage: "{a} asks to speak to everyone at the fire pit.", turns: [] },
      { stage: "{a} has packed in the night, and gathers everyone in the kitchen.", turns: [] },
      { when: { cause: 'solidarity', withB: true }, stage: "{b} is leaving, and {a} stands up.", turns: [] },
    ],
    say: [
      { when: { cause: 'heartbreak' }, turns: [['a', "I can't stay here and watch it every day. I've tried. I really have. I'm going home."]] },
      { when: { cause: 'heartbreak', mood: 'heartbroken' }, turns: [['a', "Every morning I wake up and the first thing I see is the thing that hurts. I can't do it any more. I'm sorry."]] },
      { when: { cause: 'homesick' }, turns: [['a', "I miss home. I've given this everything, and I've got nothing left to give. I love you all."]] },
      { when: { cause: 'homesick' }, turns: [['a', "I'm not happy, and I don't want to pretend for the cameras. You all deserve better than a pretend version of me."]] },
      { when: { cause: 'solidarity', withB: true }, turns: [['a', "I'm going with {b}. There's nothing in here for me without {b.obj}. I came in for this, and this is leaving."]] },
      { when: { cause: 'solidarity', withB: false }, turns: [['a', "The person I came in here for has gone. I'm not staying to pretend I'm fine. I'm going to find them."]] },
    ],
    land: [
      { turns: [], beat: "Nobody tries to talk {a} out of it. Somebody starts crying." },
      { when: { cause: 'solidarity', withB: true }, turns: [], beat: "The villa watches the two of them walk up the steps together." },
    ],
  },
});

export const WALK_DOUBT = build('walk-doubt', {
  ...ONE,
  plans: { featured: ['open', 'say', 'plea?'], short: ['open', 'say'] },
  moves: {
    open: [
      { stage: "{a} pulls {b} to one side, away from everyone.", turns: [['a', "I can't do it any more."], ['b', "Do what?"]] },
      { stage: "On the terrace, {a} is packing things into a bag, then stopping.", turns: [['b', "What are you doing?"]] },
      { turns: [['b', "You've been quiet all day. What's going on?"]] },
    ],
    say: [
      { when: { of: 'moved-on', cast: 4 }, turns: [['a', "Watch {c} with {d}. Every single day. I wake up, and they're the first thing I see."], ['b', "It'll get easier."], ['a', "It hasn't. It's got worse."]] },
      { when: { of: 'moved-on', cast: 4 }, turns: [['a', "{c} is happy with {d}. Good for them. Honestly. I just can't be here for it."]] },
      { when: { of: 'heartbreak', cast: 3 }, turns: [['a', "I haven't been right since {c} and me ended. Every time {c} walks past, it starts all over again."], ['b', "So what do you want to do?"], ['a', "I think I want to go home."]] },
      { when: { of: 'with-them', cast: 3 }, turns: [['a', "It's {c}. I can't be in the same villa as {c} any more. Not after everything."]] },
      { when: { of: 'homesick' }, turns: [['a', "I miss home so much it hurts. Everyone here is amazing, and I still just want my own bed."]] },
      { turns: [['a', "I think I'm going to go home. I've been thinking about it for days."]] },
    ],
    plea: [
      { turns: [['b', "Please don't do anything tonight. Sleep on it. For me."], ['a', "I've slept on it. I've slept on it every night."]] },
      { turns: [['b', "You've got people in here who love you."], ['a', "I know. That's the only reason I stayed this long."]] },
    ],
  },
});

export const WALK_GOODBYE = build('walk-goodbye', {
  ...ONE,
  plans: { featured: ['steps', 'land'], short: ['steps', 'land'] },
  moves: {
    steps: [
      { stage: "The suitcase is by the steps. {b} walks {a} to it.", turns: [['b', "I can't believe you're going."], ['a', "I'll see you on the outside. First thing."], ['b', "You'd better."]] },
      { turns: [['a', "Thank you for everything. You kept me going in here. You don't even know how much."], ['b', "I'm going to miss you so much."]] },
      { when: { of: 'homesick' }, turns: [['b', "Give your family a hug from me."], ['a', "I will. They're going to be so happy."], ['b', "So would I be, if I were them."]] },
    ],
    land: [
      { turns: [], beat: "They hug for a long time before {a} lets go." },
      { turns: [], beat: "{a} waves once from the top of the steps, and then {a} is gone." },
    ],
  },
});

export const WALK_AFTER = build('walk-after', {
  ...ONE,
  plans: { featured: ['after', 'land?'], short: ['after'] },
  moves: {
    after: [
      { stage: "The villa is quiet after the steps.", turns: [['a', "That was because of me, wasn't it?"], ['b', "You tell me."], ['a', "I didn't want {c} to leave."], ['b', "You didn't make it easy for {c} to stay, either."]] },
      { when: { of: 'moved-on' }, turns: [['b', "I hope you're happy."], ['a', "That's not fair. I didn't do anything wrong."], ['b', "You moved on right in front of {c}. Every day."], ['a', "What was I supposed to do? Stay single for ever?"]] },
      { when: { of: 'with-them' }, turns: [['a', "{c} didn't even say it was because of me."], ['b', "{c} didn't have to."], ['a', "I thought we were getting through it."], ['b', "You were. {c} wasn't."]] },
      { when: { of: 'heartbreak' }, turns: [['a', "Is {c} okay?"], ['b', "What do you think?"], ['a', "I feel awful."], ['b', "Good."]] },
    ],
    land: [
      { turns: [], beat: "{a} sits on {a.posAdj} own by the pool for the rest of the night." },
      { turns: [], beat: "Half the villa has heard it, and half of them agree with {b}." },
    ],
  },
});

export const ENVELOPE = build('envelope', {
  ...ONE,
  plans: { featured: ['hold', 'open', 'land'], short: ['open', 'land'] },
  moves: {
    hold: [
      { turns: [['dior', "{a}, inside that envelope is the prize money. You can split it with {b}, or you can steal it all. Split, or steal?"]] },
      { stage: "{a} holds the envelope, and the whole villa goes silent.", turns: [] },
    ],
    open: [
      { when: { choice: 'split' }, turns: [['a', "There was never any question. Never. I'm splitting it."], ['b', "Stop it. Stop it, I can't breathe."]] },
      { when: { choice: 'split' }, turns: [['a', "Split. Obviously. I'd have split it with {b} on day one."]] },
      { when: { choice: 'split' }, turns: [['a', "We did this together. We're sharing it together."]] },
      { when: { choice: 'steal' }, turns: [['a', "I'm sorry. I've thought about it a lot. I'm stealing it."], ['b', "You're joking. Tell me you're joking."]] },
      { when: { choice: 'steal' }, turns: [['a', "Steal."], ['b', "After everything? After everything you said at the fire pit?"]] },
    ],
    land: [
      { when: { choice: 'split' }, turns: [], beat: "{b} is crying before {a} has finished the sentence, and hits {a.obj} on the arm, and kisses {a.obj}." },
      { when: { choice: 'steal' }, turns: [], beat: "The whole villa gasps. {b} lets go of {a}'s hand." },
    ],
  },
});

// A dumping vote level between two or three: the public's votes settle it,
// and {a} is the one they voted for least (pm/villa-vote.js tally).
export const DUMP_TIE = build('dump-tie', {
  ...ONE,
  plans: { featured: ['tie', 'land?'], short: ['tie'] },
  moves: {
    tie: [
      { when: { cast: 2 }, turns: [['dior', "We have a tie. {a} and {b} have the same number of votes. So it goes back to the public. And of the two of you, the public voted least for {a}."]] },
      { when: { cast: 2 }, turns: [['dior', "It's level. The villa can't split {a} and {b}. The public can. {a}, of the two of you, you had the fewest votes."]] },
      { when: { cast: 3 }, turns: [['dior', "One vote each. Nobody in this villa can decide between {a}, {b} and {c}. So it comes down to the public's votes. And of the three of you, the fewest went to {a}."]] },
    ],
    land: [
      { turns: [], beat: "{a} closes {a.posAdj} eyes. {b} doesn't know where to look." },
      { turns: [], beat: "Nobody on the benches moves. {a} nods, very slowly." },
    ],
  },
});

export const SAVE_TIE = build('save-tie', {
  ...ONE,
  plans: { featured: ['tie', 'land?'], short: ['tie'] },
  moves: {
    tie: [
      { turns: [['dior', "We have a tie. {a} and {b} have the same number of saves. So the public's votes decide. And the islander the public saved is {a}."]] },
      { turns: [['dior', "It's level. Nobody in the villa can split {a} and {b}. The public can. Of the two, they voted for {a}."]] },
      { turns: [['dior', "{a}, {b}: a tie. Which means it comes down to the public. {a}, you are safe."]] },
    ],
    land: [
      { turns: [], beat: "{a} breathes out. {b} gets a hug from the islanders either side." },
      { turns: [], beat: "{b} nods slowly, and manages a smile. Just." },
    ],
  },
});
