// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/drinks.js — the night the house gets alcohol (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/drinks-night.js.
//
//   drinks.open       the drinks arrive; a stays sober, b gets loud (kitchen)   scene
//   drinks.confess    a says too much to b                                    close | wrong
//   drinks.grievance  a has it out with b; c saw it (kitchen)                 scene
//   drinks.sharp      a stays sober and listens                               scene

export default {
  'drinks.open.scene': [
    { id: 'dk.o1', turns: [{ beat: 'A case of beer and a bottle of wine arrive for the whole house.' }, { by: 'b', say: "Finally!" }, { by: 'a', dr: "{b} was three drinks in before I'd finished one. I'm holding mine and not drinking it." }] },
    { id: 'dk.o2', turns: [{ by: 'b', say: "Cheers, everyone!" }, { beat: 'Everyone cheers. {a} barely sips.' }] },
    { id: 'dk.o3', turns: [{ by: 'a', dr: "One night a week, everyone stops being careful. I'm not going to be one of them." }] },
    { id: 'dk.o4', turns: [{ by: 'b', say: "Someone make a toast! Fine, I will. To us!" }, { beat: 'It comes out more sincere than {b} meant.' }] },
    { id: 'dk.o5', turns: [{ by: 'a', dr: "{b} is already saying things {b} wouldn't say at lunchtime. I'm listening." }] },
    { id: 'dk.o6', turns: [{ by: 'b', say: "Why aren't you drinking?" }, { by: 'a', say: "I am." }, { beat: '{a}\'s glass is still full.' }] },
  ],
  'drinks.confess.close': [
    { id: 'dk.c1', turns: [{ by: 'a', say: "Can I tell you something?" }, { by: 'b', say: "Course." }, { by: 'a', say: "I don't trust half the people in this house." }, { by: 'b', say: "...Which half?" }] },
    { id: 'dk.c2', turns: [{ by: 'a', say: "I wasn't going to tell anyone this. But it's you." }, { by: 'b', say: "I won't say a word." }] },
    { id: 'dk.c3', turns: [{ by: 'a', dr: "I told {b} who I actually trust. I wasn't going to. I'm glad I did." }] },
    { id: 'dk.c4', turns: [{ by: 'b', dr: "{a} told me more tonight than in the whole season. I'm keeping all of it safe." }] },
    { id: 'dk.c5', turns: [{ by: 'a', say: "You're the only person in here I'd say this to." }, { by: 'b', say: "Then say it." }] },
    { id: 'dk.c6', turns: [{ by: 'a', say: "I've been pretending all week. I'm tired." }, { by: 'b', say: "You don't have to pretend with me." }] },
  ],
  'drinks.confess.wrong': [
    { id: 'dk.w1', turns: [{ by: 'a', say: "Can I tell you something?" }, { by: 'b', say: "Go on." }, { beat: '{a} tells {b} far too much.' }] },
    { id: 'dk.w2', turns: [{ by: 'a', dr: "I meant to say one small thing to {b}. I said four big ones. I knew while it was happening." }] },
    { id: 'dk.w3', turns: [{ by: 'b', dr: "{a} told me exactly who {a} trusts and who {a} doesn't. I didn't even have to ask." }] },
    { id: 'dk.w4', turns: [{ by: 'a', say: "Forget I said that." }, { by: 'b', say: "Said what?" }, { by: 'a', dr: "{b} will not forget." }] },
    { id: 'dk.w5', turns: [{ by: 'b', dr: "Tonight {a} gave me the best information I've had all season. And {a} was only trying to be nice." }] },
    { id: 'dk.w6', turns: [{ by: 'a', dr: "Why did I tell {b} that? Why did I tell {b} that?" }] },
  ],
  'drinks.grievance.scene': [
    { id: 'dk.g1', turns: [{ by: 'a', say: "You want to know what I really think of you, {b}?" }, { by: 'b', say: "Not really." }, { by: 'a', say: "Too bad." }] },
    { id: 'dk.g2', turns: [{ by: 'a', say: "No, I'm not joking." }, { beat: 'The room goes quiet.' }, { by: 'a', say: "I mean it." }] },
    { id: 'dk.g3', turns: [{ by: 'a', say: "Just say it. You wanted me gone." }, { by: 'b', say: "You're drunk." }, { by: 'a', say: "That's not a denial." }] },
    { id: 'dk.g4', turns: [{ by: 'a', say: "I've been fine about it for days. I'm not fine about it now." }, { by: 'b', say: "Clearly." }] },
    { id: 'dk.g5', turns: [{ by: 'a', say: "Just answer the question." }, { by: 'b', say: "Not like this." }, { by: 'a', say: "Like what?" }] },
    { id: 'dk.g6', when: { third: true }, turns: [{ by: 'c', dr: "{a} has been holding that in all week. Tonight it all came out at {b}." }] },
    { id: 'dk.g7', turns: [{ by: 'b', dr: "{a} came at me in front of everyone. Drunk or not, I heard every word." }] },
  ],
  'drinks.sharp.scene': [
    { id: 'dk.s1', turns: [{ by: 'a', dr: "Same drink all night. Both ears open. By two in the morning, I knew who's working with who." }] },
    { id: 'dk.s2', turns: [{ by: 'a', dr: "Everyone thinks I'm drinking because I'm holding a cup. I'm not." }] },
    { id: 'dk.s3', turns: [{ by: 'a', dr: "I kept topping everyone else up. Never my own glass." }] },
    { id: 'dk.s4', turns: [{ by: 'a', dr: "Best decision I made all week: staying sober tonight." }] },
    { id: 'dk.s5', turns: [{ by: 'a', dr: "People talk when they drink. I just listened." }] },
    { id: 'dk.s6', turns: [{ by: 'a', dr: "I learned three things tonight that I didn't know at dinner." }] },
  ],
};
