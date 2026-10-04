// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/engine2.js — the last engine beats in week.js (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
//   engine.samecase    a made one case to b, then the same to c (and more: {group}); nobody moved   two | many
//   alliance.betrayal  a voted out {target}, the only other member of {alliance}                  alone
//   alliance.repair    a has nobody left in {alliance} to explain the vote to ({target} is gone)  alone

export default {
  'engine.samecase.two': [
    { id: 'en2.t1', turns: [{ by: 'b', say: "I hear you. I'm not changing my vote." }, { beat: 'Later, {a} makes the same case to {c}.' }, { by: 'c', say: "Sorry. I'm staying where I am." }] },
    { id: 'en2.t2', turns: [{ by: 'b', say: "I'll think about it." }, { by: 'a', dr: "I said the same thing to {c} an hour later. Same answer. Neither of them is moving." }] },
    { id: 'en2.t3', turns: [{ by: 'b', say: "No." }, { beat: '{a} tries {c} next, with the same words.' }, { by: 'c', say: "Also no." }] },
    { id: 'en2.t4', turns: [{ by: 'b', say: "I've made up my mind." }, { by: 'c', dr: "{a} gave me a speech. It sounded like a speech {a} had already given today." }] },
    { id: 'en2.t5', turns: [{ by: 'b', say: "Good pitch. Still no." }, { by: 'a', dr: "Two people, the same pitch, the same no. I need a new argument." }] },
    { id: 'en2.t6', turns: [{ by: 'b', say: "Have you been round everyone with this?" }, { by: 'a', say: "...Maybe." }, { by: 'b', say: "Thought so." }] },
  ],
  'engine.samecase.many': [
    { id: 'en2.m1', turns: [{ by: 'b', say: "Not this week." }, { by: 'a', dr: "I made that case to {group}. One at a time. Not one of them moved." }] },
    { id: 'en2.m2', turns: [{ by: 'b', say: "I'm not moving." }, { beat: '{a} goes room to room with the same pitch.' }, { by: 'c', say: "Same answer as everyone else, I'm afraid." }] },
    { id: 'en2.m3', turns: [{ by: 'b', say: "Sorry." }, { by: 'c', dr: "{a} is going room to room tonight. I could tell I wasn't the first." }] },
    { id: 'en2.m4', turns: [{ by: 'b', say: "Am I the first person you've said this to?" }, { by: 'a', say: "...No." }, { by: 'b', say: "Then my answer's probably the same as theirs." }] },
    { id: 'en2.m5', turns: [{ by: 'a', dr: "I said the same thing to {group}. I'm running out of people and out of arguments." }] },
    { id: 'en2.m6', turns: [{ by: 'b', say: "No." }, { by: 'c', say: "No." }, { by: 'a', dr: "That's everyone. Nobody's moving." }] },
  ],
  'alliance.betrayal.alone': [
    { id: 'en2.b1', turns: [{ by: 'a', dr: "{target} and I were {alliance}. Just the two of us. And I voted {target} out." }] },
    { id: 'en2.b2', turns: [{ by: 'a', dr: "There's nobody left in {alliance} to be angry with me. That doesn't make it feel any better." }] },
    { id: 'en2.b3', turns: [{ by: 'a', dr: "I voted out my only ally. It had to be done. I'll find out at the jury if {target} agrees." }] },
    { id: 'en2.b4', turns: [{ by: 'a', dr: "{alliance} is over. I ended it. I'd do it again, but I won't pretend it was easy." }] },
    { id: 'en2.b5', turns: [{ by: 'a', dr: "{target} trusted me. I wrote {target}'s name down anyway. That's the game." }] },
    { id: 'en2.b6', turns: [{ by: 'a', dr: "It's just me now. {alliance} is a name for an alliance with one person in it." }] },
  ],
  'alliance.repair.alone': [
    { id: 'en2.r1', turns: [{ by: 'a', dr: "There's nobody left in {alliance} to explain my vote to. I'm explaining it to myself." }] },
    { id: 'en2.r2', turns: [{ by: 'a', dr: "I keep running the apology in my head. The only person it was for has gone." }] },
    { id: 'en2.r3', turns: [{ by: 'a', dr: "No meeting, no fallout. {alliance} just stopped existing when I voted." }] },
    { id: 'en2.r4', turns: [{ by: 'a', dr: "I'd love to say sorry. There's nobody here to say it to." }] },
    { id: 'en2.r5', turns: [{ by: 'a', dr: "I'll have to make this up to {target} at the jury. If I make it that far." }] },
    { id: 'en2.r6', turns: [{ by: 'a', dr: "My alliance is gone and I'm the reason. Nobody's here to tell me off. That's almost worse." }] },
  ],
};
