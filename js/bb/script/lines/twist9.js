// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist9.js — the Den of Temptation (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/temptation.js. Whoever took the offer is never named
// as the taker; a guess being right shows only on the badge.
//
//   tempt.carries   a was nominated by the curse; b is a friend           loud | banking
//   tempt.hunt      a is sure b took the offer; c is told                  scene; third
//   tempt.innocent  b blames a, who took nothing; c backs a                scene; third
//   tempt.debate    would you take it? a says yes, b says no               scene
//   tempt.perform   a took the offer (never said); b watches; {cursed} paid   overplayed | quiet
//   tempt.refused   a turned the offer down; b is a friend                 scene; intent told
//   tempt.after     a week on, a is still wary; b was cursed               scene

export default {
  'tempt.carries.loud': [
    { id: 'tp9.l1', turns: [{ by: 'a', say: "I didn't lose anything. I wasn't even playing!" }, { beat: '{a} says it in every room {a} walks into.' }] },
    { id: 'tp9.l2', when: { intent: 'told' }, turns: [{ by: 'a', say: "Somebody in this house got a present and I got the bill." }, { by: 'b', say: "I know. It's not fair." }] },
    { id: 'tp9.l3', turns: [{ beat: '{a} kicks a cupboard door.' }, { by: 'a', say: "Sorry, cupboard." }, { by: 'a', dr: "I got nominated by a coin toss. I'm allowed to be angry." }] },
    { id: 'tp9.l4', turns: [{ by: 'a', dr: "Nobody nominated me. Nobody can save me. Somebody took a deal and I'm paying for it." }] },
    { id: 'tp9.l5', when: { intent: 'told' }, turns: [{ by: 'b', dr: "{a} is right about all of it. I'm just staying out of the way." }] },
    { id: 'tp9.l6', turns: [{ by: 'a', say: "Whoever did this, I hope it was worth it!" }, { beat: 'Nobody answers.' }] },
  ],
  'tempt.carries.banking': [
    { id: 'tp9.b1', turns: [{ by: 'a', dr: "I'm not going to argue. I'm going to sit in that chair and remember." }] },
    { id: 'tp9.b2', when: { intent: 'told' }, turns: [{ by: 'a', say: "It's fine. It's the game." }, { by: 'b', dr: "{a} has said that twice. It's not fine." }] },
    { id: 'tp9.b3', turns: [{ by: 'a', dr: "Nominated by nobody. Saved by nobody. Owed by everybody." }] },
    { id: 'tp9.b4', when: { intent: 'told' }, turns: [{ by: 'b', say: "Aren't you angry?" }, { by: 'a', say: "I'm calm." }, { by: 'b', dr: "That's worse." }] },
    { id: 'tp9.b5', turns: [{ by: 'a', dr: "Shouting won't get me off the block. Staying calm might." }] },
    { id: 'tp9.b6', turns: [{ by: 'a', dr: "Someone took a deal and left me with the bill. I'll find out who. Quietly." }] },
  ],
  'tempt.hunt.scene': [
    { id: 'tp9.h1', turns: [{ by: 'a', dr: "Somebody came out of this week with something. I think it was {b}." }] },
    { id: 'tp9.h2', turns: [{ by: 'a', say: "Somebody agreed to this." }, { beat: '{a} looks at {b} every time {a} says it.' }] },
    { id: 'tp9.h3', when: { third: true }, turns: [{ by: 'a', say: "Think about who was quiet that day." }, { by: 'c', say: "You mean {b}?" }, { by: 'a', say: "I didn't say that." }] },
    { id: 'tp9.h4', turns: [{ by: 'a', dr: "I can't find who did it. So I'm going with who looks most like they would. That's {b}." }] },
    { id: 'tp9.h5', when: { third: true }, turns: [{ by: 'c', dr: "{a} has told me the theory about {b} twice before lunch." }] },
    { id: 'tp9.h6', turns: [{ by: 'b', dr: "{a} keeps looking at me like I did something. Everyone's looking at me now." }] },
  ],
  'tempt.innocent.scene': [
    { id: 'tp9.i1', turns: [{ by: 'a', dr: "I didn't take anything. I didn't agree to anything. I can't prove a thing I didn't do." }] },
    { id: 'tp9.i2', turns: [{ by: 'a', say: "If it was me, I'd be bragging about it. It'd be a good move!" }, { by: 'b', say: "That's what you'd say." }] },
    { id: 'tp9.i3', turns: [{ by: 'a', say: "What's your evidence?" }, { by: 'b', say: "You were quiet. You went to bed early. You looked guilty." }, { by: 'a', say: "That's not evidence." }] },
    { id: 'tp9.i4', when: { third: true }, turns: [{ by: 'c', say: "{a} didn't do it." }, { by: 'b', say: "How do you know?" }, { by: 'c', say: "Because I know {a}." }] },
    { id: 'tp9.i5', turns: [{ by: 'a', dr: "It's not a theory any more. People think it's a fact. Nobody remembers who said it first." }] },
    { id: 'tp9.i6', when: { third: true }, turns: [{ by: 'c', dr: "{a} is being blamed for something {a} didn't do. There's no worse position in here." }] },
  ],
  'tempt.debate.scene': [
    { id: 'tp9.d1', turns: [{ by: 'b', say: "Would you take it, knowing someone else pays?" }, { by: 'a', say: "Yes." }, { by: 'b', say: "I wouldn't." }] },
    { id: 'tp9.d2', turns: [{ by: 'a', say: "Somebody was always going to pay. It just wasn't going to be me." }, { by: 'b', dr: "{a} wasn't even offered it, and {a} is that sure." }] },
    { id: 'tp9.d3', turns: [{ by: 'b', say: "You'd have to look at whoever paid every day afterwards." }, { by: 'a', say: "I look at everyone every day anyway." }] },
    { id: 'tp9.d4', turns: [{ by: 'a', say: "It's not even a decision." }, { by: 'b', say: "It is for me." }] },
    { id: 'tp9.d5', turns: [{ by: 'b', dr: "{a} said yes before I finished the question. I'll remember that." }] },
    { id: 'tp9.d6', turns: [{ by: 'a', dr: "{b} says no. Easy to say no to something you were never offered." }] },
  ],
  'tempt.perform.overplayed': [
    { id: 'tp9.o1', turns: [{ by: 'b', dr: "{a} wasn't nominated, wasn't involved, and is the most upset person in the house about {cursed}. I'm counting." }] },
    { id: 'tp9.o2', turns: [{ by: 'b', dr: "{a} has brought {cursed} tea twice and told three people how unfair it is. That's a lot." }] },
    { id: 'tp9.o3', turns: [{ by: 'a', say: "Whoever did this to {cursed}, it's horrible." }, { by: 'b', dr: "People who did nothing just say 'weird week'." }] },
    { id: 'tp9.o4', turns: [{ by: 'a', say: "Poor {cursed}." }, { by: 'b', say: "Mm." }, { by: 'b', dr: "{a} keeps saying that." }] },
    { id: 'tp9.o5', turns: [{ by: 'b', say: "You seem really upset about {cursed}." }, { by: 'a', say: "Aren't you?" }] },
    { id: 'tp9.o6', turns: [{ by: 'b', dr: "{a} cares a lot about {cursed} all of a sudden. I'd like to know why." }] },
  ],
  'tempt.perform.quiet': [
    { id: 'tp9.q1', turns: [{ by: 'a', say: "Bad luck for {cursed}." }, { by: 'b', say: "Yeah." }, { beat: 'They talk about something else.' }] },
    { id: 'tp9.q2', turns: [{ by: 'b', say: "Who do you think took it?" }, { by: 'a', say: "No idea. Someone sneaky." }, { beat: '{a} shrugs.' }] },
    { id: 'tp9.q3', turns: [{ by: 'a', dr: "I said the right amount about {cursed}. Not much." }] },
    { id: 'tp9.q4', turns: [{ by: 'b', dr: "{a} doesn't seem bothered by the whole thing. Fair enough." }] },
    { id: 'tp9.q5', turns: [{ by: 'a', say: "Weird week." }, { by: 'b', say: "Very weird week." }] },
    { id: 'tp9.q6', turns: [{ by: 'a', dr: "Everyone's talking about the curse. I'm talking about dinner." }] },
  ],
  'tempt.refused.scene': [
    { id: 'tp9.r1', turns: [{ by: 'a', dr: "As far as this house knows, nothing happened this week. I'm the only one who knows I said no." }] },
    { id: 'tp9.r2', turns: [{ by: 'a', dr: "I was offered something for free. Somebody else would have paid. So I said no. Nobody will ever know." }] },
    { id: 'tp9.r3', when: { intent: 'told' }, turns: [{ by: 'a', say: "Can I tell you something?" }, { by: 'b', say: "Of course." }, { by: 'a', say: "Actually, never mind." }] },
    { id: 'tp9.r4', turns: [{ by: 'a', dr: "I keep going over it. I'd say no again. I think." }] },
    { id: 'tp9.r5', when: { intent: 'told' }, turns: [{ by: 'b', say: "You've been quiet today." }, { by: 'a', say: "Just thinking." }] },
    { id: 'tp9.r6', turns: [{ by: 'a', dr: "Nobody's going to thank me for saying no. That's fine." }] },
  ],
  'tempt.after.scene': [
    { id: 'tp9.a1', turns: [{ by: 'a', dr: "Things get handed out in this house that someone else pays for. Why would it only happen once?" }] },
    { id: 'tp9.a2', turns: [{ by: 'a', dr: "Ever since {b}'s week, I don't trust the word 'offer'." }] },
    { id: 'tp9.a3', turns: [{ by: 'a', say: "Whoever took that offer is still in this house." }, { beat: 'The room goes quiet.' }] },
    { id: 'tp9.a4', turns: [{ by: 'a', dr: "Every time someone gets good news without a reason, I think about {b}." }] },
    { id: 'tp9.a5', turns: [{ by: 'b', dr: "People still bring up my week. I'm glad someone remembers." }] },
    { id: 'tp9.a6', turns: [{ by: 'a', say: "Still angry about it?" }, { by: 'b', say: "What do you think?" }] },
  ],
};
