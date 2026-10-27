// ══════════════════════════════════════════════════════════════════════
// pm/talk/enemies.js — the islanders who can't stand each other (pm/enemies.js)
// ══════════════════════════════════════════════════════════════════════
//
// Every one of these says what it is about (user, 2026-10-26: "what are they
// fighting about, it's so vague"). `grudge` is what a holds against b:
//   steal  b took a's partner ({x}, when still with b)   vote   b voted {x}, a's friend, out
//   told   b told on a                                    said   b said something about a, and a heard
//   sided  b took {x}'s side against a in a fight         rival  both want {x}
//   fake · loud · moody · cocky   nothing happened: what a can't stand about b
// {x} is named only behind `hasWith` (there is somebody it was over).
//   enemy-snipe   [a, b, (c)]  a has a go at b in front of people. `of`: bites · ignores
//   enemy-bitch   [a, b, c]    a on c, to b, behind c's back
//   enemy-clash   [a, b, (c)]  it comes out properly. `of`: walks · stays · pulled-apart (c steps in)
//   enemy-freeze  [a, b, c]    a freezes b out; c sees it
//   enemy-truce   [a, b]       they talk it out. `of`: peace · refused
import { build } from './build.js';

const X = { hasWith: true };

export const ENEMY_SNIPE = build('enemy-snipe', {
  tiered: false,
  plans: { featured: ['dig', 'back', 'land'], short: ['dig', 'land'] },
  moves: {
    dig: [
      { stage: "The kitchen. {b} reaches for the last clean glass, and {a} gets there first.", turns: [['a', "Sorry. Did you want that? I didn't see you there. I never do, to be fair."]] },
      { stage: "{b} sits down on the daybeds, and {a} moves along without a word, all the way to the other end.", turns: [['a', "No, carry on. There's loads of room. I'll just be over here."]] },
      { when: { grudge: 'steal', ...X }, stage: "{b} and {x} walk past the sunbeds holding hands, and {a} looks up.", turns: [['a', "Enjoy it. I did, for a whole week, before you came along."]] },
      { when: { grudge: 'steal' }, stage: "{b} is telling the kitchen a story, and {a} cuts across it.", turns: [['a', "Go on, tell them the one where you took somebody else's partner at a recoupling. That's my favourite."]] },
      { when: { grudge: 'vote', ...X }, stage: "Somebody mentions {x} on the lawn, and {a} looks straight at {b}.", turns: [['a', "Funny, isn't it? {x} would still be here if some people had voted with their heads."]] },
      { when: { grudge: 'told' }, stage: "{b} leans in to whisper something to someone on the lawn, and {a} says it loud enough for everyone.", turns: [['a', "Careful. Whatever you say near {b} ends up in somebody else's ear by dinner."]] },
      { when: { grudge: 'said' }, stage: "{b} says hello to {a} by the pool, all smiles.", turns: [['a', "Oh, are we being nice today? I can never tell with you. It depends if there's a camera on you, doesn't it?"]] },
      { when: { grudge: 'sided', ...X }, stage: "{b} offers to make {a} a drink.", turns: [['a', "I'm fine, thanks. Go and make one for {x}. That's who you're looking after, isn't it?"]] },
      { when: { grudge: 'rival', ...X }, stage: "{b} laughs at something {x} says, and {a} rolls {a.posAdj} eyes.", turns: [['a', "It wasn't that funny. You don't have to laugh at everything just because it's {x} saying it."]] },
      { when: { grudge: 'fake' }, stage: "{b} is hugging everybody on the lawn, one after another.", turns: [['a', "Look at that. Everyone's best friend. Until they're not in the room."]] },
      { when: { grudge: 'loud' }, stage: "{b} is telling a story at the top of {b.posAdj} voice, and {a} puts {a.posAdj} sunglasses on.", turns: [['a', "Could you do that a bit louder? I don't think the next villa heard."]] },
      { when: { grudge: 'moody' }, stage: "{b} comes out to the garden with a face like thunder.", turns: [['a', "Oh, good. Who's upset {b} today? Should we all just go back inside?"]] },
      { when: { grudge: 'cocky' }, stage: "{b} is going on about how well {b.posAdj} chat went last night.", turns: [['a', "Everyone wants you. We know. You've told us. Every day."]] },
    ],
    back: [
      { when: { of: 'bites' }, turns: [['b', "Have you got something you want to say to me? Because say it properly, or don't say it."], ['a', "I think I just did."]] },
      { when: { of: 'bites' }, turns: [['b', "You've been like this with me for days, and I'm sick of it."], ['a', "Then do something about it."]] },
      { when: { of: 'bites', grudge: 'steal' }, turns: [['b', "It was a recoupling. I picked who I wanted. You'd have done exactly the same."], ['a', "I'd never have done it to someone in my own villa. That's the difference."]] },
      { when: { of: 'ignores' }, turns: [['b', "Okay."]], beat: "{b} carries on as if {a} hasn't said anything, which only makes {a} angrier." },
      { when: { of: 'ignores' }, turns: [], beat: "{b} doesn't even look up. Somebody nearby pretends very hard to be reading." },
    ],
    land: [
      { when: { cast: 3 }, turns: [], beat: "{c} looks from one of them to the other, and quietly leaves the kitchen." },
      { turns: [], beat: "The whole lawn has gone quiet, and then everyone starts talking at once, about anything else." },
      { when: { of: 'bites' }, turns: [], beat: "Neither of them backs down, and neither of them moves." },
    ],
  },
});

export const ENEMY_BITCH = build('enemy-bitch', {
  tiered: false,
  plans: { featured: ['open', 'say', 'answer', 'land?'], short: ['say', 'answer'] },
  moves: {
    open: [
      { stage: "The dressing room. {a} shuts the door behind {b}, and checks the hallway first.", turns: [['a', "Can I say something? It doesn't leave this room."], ['b', "Go on."]] },
      { stage: "{a} and {b} are on the swing seat, keeping their voices down.", turns: [] },
    ],
    say: [
      { when: { grudge: 'steal', ...X }, turns: [['a', "I can't even look at {c}. Every time I see {c} with {x}, I think, that was mine a week ago. And {c} walks round like nothing happened."]] },
      { when: { grudge: 'steal' }, turns: [['a', "{c} took my partner at a recoupling, and now {c} wants to be friends. No. I'm not doing that."]] },
      { when: { grudge: 'vote', ...X }, turns: [['a', "{c} voted {x} out. I know {c} did. And now {c} comes up to me like we're friends. I haven't forgotten."]] },
      { when: { grudge: 'told' }, turns: [['a', "Don't tell {c} anything. I'm serious. I told {c} one thing, and the whole villa knew it by dinner."]] },
      { when: { grudge: 'said' }, turns: [['a', "After what {c} said about me, I'm done being polite. I'll be civil. That's all {c} is getting."]] },
      { when: { grudge: 'sided', ...X }, turns: [['a', "When it all kicked off, {c} stood right next to {x} and didn't say a word to me. I'll remember that."]] },
      { when: { grudge: 'rival', ...X }, turns: [['a', "{c} knows I like {x}. Everyone knows. And {c} is all over {x} the second I'm not there."]] },
      { when: { grudge: 'fake' }, turns: [['a', "There's something about {c} I don't trust. {c} is lovely to everyone's face, and I've heard what {c} says when they walk off."]] },
      { when: { grudge: 'fake' }, turns: [['a', "Watch {c} at the fire pit tonight. Every time someone gets picked, {c} hugs them, and then {c} goes off and picks them apart."]] },
      { when: { grudge: 'fake' }, turns: [['a', "{c} asked me how I was this morning like {c} actually cared. I know for a fact {c} called me boring two days ago."]] },
      { when: { grudge: 'loud' }, turns: [['a', "I've tried with {c}. I really have. But {c} doesn't talk to people, {c} talks at them. Every conversation becomes about {c}."]] },
      { when: { grudge: 'loud' }, turns: [['a', "I sat down to tell everyone about my day, and {c} took over in about four seconds. It happens every single time."]] },
      { when: { grudge: 'loud' }, turns: [['a', "Is it just me, or can nobody have a quiet conversation in here any more without {c} turning up and making it about {c}?"]] },
      { when: { grudge: 'moody' }, turns: [['a', "I'm tired of tiptoeing round {c}. You never know which {c} you're getting when you wake up."]] },
      { when: { grudge: 'moody' }, turns: [['a', "{c} bit my head off this afternoon for asking if {c} wanted a drink. A drink. I'm not asking again."]] },
      { when: { grudge: 'cocky' }, turns: [['a', "{c} thinks {c} is the main character in here. Honestly, {c} hasn't asked me one question about myself since I walked in."]] },
      { when: { grudge: 'cocky' }, turns: [['a', "Did you hear {c} at dinner? 'I could have anyone in here.' Could you, though? Could you?"]] },
      { when: { grudge: 'steal' }, turns: [['a', "Every time {c} laughs at the fire pit, I think about that recoupling. I can't help it."]] },
      { when: { grudge: 'told' }, turns: [['a', "I'm never telling {c} anything again. Not what I had for breakfast. Nothing."]] },
      { when: { grudge: 'said' }, turns: [['a', "I keep thinking about what {c} said. I keep thinking, how long has {c} felt like that, and smiled at me anyway?"]] },
      { when: { grudge: 'rival', ...X }, turns: [['a', "I'm not saying {c} can't talk to {x}. I'm saying {c} doesn't have to do it every time I'm about to."]] },
    ],
    answer: [
      { turns: [['b', "I'm not saying you're wrong."], ['a', "You're not saying I'm right, either."], ['b', "I'm saying be careful who hears you."]] },
      { turns: [['b', "Honestly? I've noticed it too. I just didn't want to be the one to say it."]] },
      { turns: [['b', "Have you said any of this to {c}?"], ['a', "What would be the point? {c} wouldn't listen."]] },
      { turns: [['b', "You know if this gets back to {c}, it's going to blow up."], ['a', "Then it blows up. I'm not scared of {c}."]] },
    ],
    land: [
      { when: { heard: true }, turns: [], beat: "Neither of them notices the bathroom door is open, or who is standing just behind it." },
      { when: { heard: false }, turns: [], beat: "{b} says nothing, but {b} looks at {c} differently at dinner." },
      { turns: [], beat: "Somebody comes in for a hairdryer, and the conversation turns into one about hairdryers." },
    ],
  },
});
ENEMY_BITCH.facts = (state, ev) => ({ heard: !!ev.extra?.heard });

export const ENEMY_CLASH = build('enemy-clash', {
  tiered: false,
  plans: { featured: ['open', 'answer', 'push', 'land'], short: ['open', 'answer', 'land'] },
  moves: {
    open: [
      { when: { grudge: 'steal', ...X }, stage: "It starts in the kitchen and ends up in the middle of the lawn.", turns: [['a', "You took {x} off me at a recoupling, in front of everyone, and you've never once said sorry. Not once."]] },
      { when: { grudge: 'steal' }, stage: "It starts at the pool and gets louder from there.", turns: [['a', "You stood up at that recoupling and took my partner. And you've been smiling at me every day since like we're fine."]] },
      { when: { grudge: 'vote', ...X }, stage: "{a} finds {b} on the terrace, and doesn't sit down.", turns: [['a', "You voted {x} out. {x} was my best friend in here, and you sent {x} home, and then you came and hugged me after."]] },
      { when: { grudge: 'told' }, stage: "{a} walks straight up to {b} on the lawn.", turns: [['a', "I told you something in confidence, and you went and told the whole villa. Why? What did you get out of that?"]] },
      { when: { grudge: 'said' }, stage: "{a} has been waiting all day, and now {a} doesn't wait any more.", turns: [['a', "I've been biting my tongue since Movie Night. I'm done. You said all that about me, and then you sat next to me at breakfast."]] },
      { when: { grudge: 'sided', ...X }, stage: "{a} catches {b} at the fire pit, before anyone else is out.", turns: [['a', "When it all kicked off, you went straight to {x}. You didn't even ask me what happened. You just picked a side."]] },
      { when: { grudge: 'rival', ...X }, stage: "It boils over by the pool.", turns: [['a', "You know how I feel about {x}. I told you. And every time I go over to {x}, you're already there."]] },
      { when: { grudge: 'fake' }, stage: "It comes out on the daybeds, with half the villa listening.", turns: [['a', "I'm going to say it, because nobody else will. You're two-faced. You're nice to everyone's face, and then you go and say what you really think somewhere else."]] },
      { when: { grudge: 'loud' }, stage: "It starts as a joke at dinner and stops being one.", turns: [['a', "Can I finish one sentence? One? Every time anyone talks, you talk over them. It's every single day."]] },
      { when: { grudge: 'moody' }, stage: "It starts over nothing, in the kitchen.", turns: [['a', "I'm not walking on eggshells round you any more. You snap at everyone, and we're all meant to pretend it's fine."]] },
      { when: { grudge: 'cocky' }, stage: "It starts by the pool, and it gets loud fast.", turns: [['a', "You think you're better than everyone in here. You don't even try to hide it."]] },
    ],
    answer: [
      { when: { grudge: 'steal' }, turns: [['b', "It was a recoupling. That's the game. I didn't do anything you wouldn't have done."], ['a', "Don't tell me what I'd have done."]] },
      { when: { grudge: 'vote' }, turns: [['b', "We all had to vote for somebody. I voted with my head. I'm not going to say sorry for that."], ['a', "Nobody asked you to say sorry. I asked you to stop pretending you care about me."]] },
      { when: { grudge: 'told' }, turns: [['b', "I didn't go round telling people. Somebody asked me straight out, and I wasn't going to lie for you."], ['a', "So it's my fault now?"]] },
      { when: { grudge: 'said' }, turns: [['b', "I was angry when I said it. I'm allowed to be angry about you, the same as you are about me."], ['a', "Then say it to my face, like I'm doing now."]] },
      { when: { grudge: 'sided' }, turns: [['b', "I didn't pick a side. I just didn't pick yours."], ['a', "That's the same thing."]] },
      { when: { grudge: 'rival', ...X }, turns: [['b', "You don't own anybody in here. If {x} wants to talk to me, {x} can talk to me."], ['a', "Don't act like you don't know what you're doing."]] },
      { when: { grudge: ['fake', 'loud', 'moody', 'cocky'] }, turns: [['b', "Where's this come from? I've never done anything to you."], ['a', "You've done it every day. You just haven't noticed."]] },
      { when: { grudge: ['fake', 'loud', 'moody', 'cocky'] }, turns: [['b', "You don't even know me. You've never sat down with me for five minutes."], ['a', "I don't need five minutes. I've watched you for a week."]] },
    ],
    push: [
      { turns: [['b', "Are you finished?"], ['a', "No. I'm not finished. I've been holding this in for days."]] },
      { turns: [['a', "Everyone in here thinks it. I'm just the one saying it."], ['b', "Then let everyone say it. Not just you."]] },
      { turns: [['b', "Do you know what, I don't need this. I came in here to have a good time."], ['a', "So did I. Then I met you."]] },
    ],
    land: [
      { when: { of: 'walks' }, turns: [], beat: "{a} walks off before {b} can answer, and the door to the dressing room slams." },
      { when: { of: 'stays' }, turns: [], beat: "They stand there, a few feet apart, and neither of them is the first to move." },
      { when: { of: 'pulled-apart', cast: 3 }, turns: [['c', "Okay. Enough. Both of you. Not like this."]], beat: "{c} steers {a} away by the arm, and {b} is left on the lawn on {b.posAdj} own." },
    ],
  },
});

export const ENEMY_FREEZE = build('enemy-freeze', {
  tiered: false,
  plans: { featured: ['scene', 'notice', 'land?'], short: ['scene', 'notice'] },
  moves: {
    scene: [
      { stage: "{b} sits down at the lunch table, and {a} picks up {a.posAdj} plate and goes and eats by the pool.", turns: [] },
      { stage: "{b} asks if anybody wants a tea. Everyone says yes except {a}, who gets up and makes {a.posAdj} own.", turns: [] },
      { stage: "Everyone's getting ready in the dressing room, and {a} is chatting away to all of them. When {b} walks in, {a} goes quiet.", turns: [] },
      { stage: "{b} says hello to {a}. {a} says hello to the person standing next to {b}.", turns: [] },
    ],
    notice: [
      { turns: [['c', "Did you see that?"], ['b', "I see it every day. I've stopped saying anything."]] },
      { turns: [['b', "What have I done? Honestly, has anyone got any idea what I've done?"], ['c', "I think you'd have to ask {a} that."]] },
      { turns: [['c', "Are you two okay?"], ['b', "Ask {a}. {a} hasn't said a word to me in two days."]] },
    ],
    land: [
      { turns: [], beat: "{c} looks over at {a}. {a} is suddenly very busy with a hairbrush." },
      { turns: [], beat: "{b} laughs it off, and then doesn't eat anything else." },
    ],
  },
});

export const ENEMY_TRUCE = build('enemy-truce', {
  tiered: false,
  plans: { featured: ['open', 'say', 'answer', 'land'], short: ['say', 'answer', 'land'] },
  moves: {
    open: [
      { stage: "{a} finds {b} on the terrace, and for once, doesn't look like {a} is about to start something.", turns: [['a', "Can we talk? Properly. Not like last time."]] },
      { stage: "Late at night, {a} sits down on the other end of the daybed from {b}.", turns: [['a', "I'm not here to have a go. I promise."]] },
    ],
    say: [
      { when: { grudge: 'steal' }, turns: [['a', "I've been angry with you since that recoupling. And I think I'm angry because it hurt, not because of anything you did on purpose."]] },
      { when: { grudge: 'vote' }, turns: [['a', "I know everyone had to vote for somebody. I just needed someone to blame, and it was easier if it was you."]] },
      { when: { grudge: ['told', 'said'] }, turns: [['a', "I've been holding on to what happened, and it's making me miserable. I don't want to spend the rest of this hating somebody."]] },
      { when: { grudge: ['rival', 'sided'] }, turns: [['a', "I've been horrible to you, and it's not really about you. It's about how I feel about everything else in here."]] },
      { when: { grudge: ['fake', 'loud', 'moody', 'cocky'] }, turns: [['a', "I think I decided I didn't like you before I'd even had a real conversation with you. That's not fair on you."]] },
    ],
    answer: [
      { when: { of: 'peace' }, turns: [['b', "I've not exactly been easy either. Can we just start again?"], ['a', "I'd like that."]] },
      { when: { of: 'peace' }, turns: [['b', "Thank you for saying that. Honestly. I didn't think you would."], ['a', "Neither did I."]] },
      { when: { of: 'refused' }, turns: [['b', "I appreciate you coming over. I do. But I'm not ready to act like the last week didn't happen."], ['a', "Okay. That's fair."]] },
      { when: { of: 'refused' }, turns: [['b', "You've been on at me for days, and now you want to be friends because it's got awkward?"], ['a', "That's not why."], ['b', "It looks like why."]] },
    ],
    land: [
      { when: { of: 'peace' }, turns: [], beat: "They hug, a bit awkwardly, and someone on the lawn actually claps." },
      { when: { of: 'peace' }, turns: [], beat: "By dinner, they're sitting next to each other, and nobody can quite believe it." },
      { when: { of: 'refused' }, turns: [], beat: "{a} nods, and goes back inside. It's a start, or it isn't." },
    ],
  },
});

// {x} is who the grudge was over, when there is somebody (pm/enemies.js).
for (const t of [ENEMY_SNIPE, ENEMY_BITCH, ENEMY_CLASH, ENEMY_FREEZE, ENEMY_TRUCE]) {
  const own = t.facts;
  t.facts = (state, ev) => ({ hasWith: !!ev.extra?.about, ...(own ? own(state, ev) : {}) });
  t.slots = (state, ev) => (ev.extra?.about ? { x: ev.extra.about } : {});
}
