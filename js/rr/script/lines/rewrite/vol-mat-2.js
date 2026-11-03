// More of Don checking teams in at the Chill Zone (the pool that repeats most). Quick hits in his voice: the placing
// said like a host who loves his job, one quick tease, and the team's honest reaction. The arriving team is a and b.
// Gated on matPlace (first, top, mid, bottom) so the line fits the placing. Written again 2026-11-03: these had gone
// back to the bored deadpan Don is not ("You tell me. I was eating", "Then you're very loud agreers").
const don = say => ({ by: 'don', say });

export default {
  retire: [],
  pools: {
    'don-place.plain': [
      // first
      { id: 'vm2.f1', when: { matPlace: 'first' }, turns: [
        don("{team}! You are the first team to arrive!"),
        { by: 'a', say: "Oh my God. Are you serious? First?" },
        don("Dead serious, and I'll be honest, I had my money on somebody else."),
      ] },
      { id: 'vm2.f2', when: { matPlace: 'first' }, turns: [
        { beat: '{a} and {b} arrive at a walk, looking around for the other teams.' },
        don("You can stop looking, because there's nobody else here. {team}, you're first!"),
        { by: 'b', say: "No way. We thought we'd gone the wrong way!" },
      ] },
      { id: 'vm2.f3', when: { matPlace: 'first' }, turns: [
        don("{team}, you're first! Say something humble for the camera."),
        { by: 'a', say: "Honestly? We just got lucky." },
        don("Nobody believes that, but I love that you tried."),
      ] },
      // near the top
      { id: 'vm2.t1', when: { matPlace: 'top' }, turns: [
        don("{team}! You're the {placing} team to arrive!"),
        { by: 'b', say: "{placing}? We'll take it! We'll totally take it!" },
        don("So close to the top, you can almost smell it."),
      ] },
      { id: 'vm2.t2', when: { matPlace: 'top' }, turns: [
        don("{team}, you're {placing}! You were leading for a while there."),
        { by: 'a', say: "We were? What happened?" },
        don("The rest of the race happened. Still, {placing}! Very nice."),
      ] },
      { id: 'vm2.t3', when: { matPlace: 'top' }, turns: [
        { beat: '{a} steps on the mat; {b} is still a few steps back, bent over with {b.posAdj} hands on {b.posAdj} knees.' },
        don("Both of you on the mat, please! There we go! {team}, you're {placing}!"),
        { by: 'b', say: "Oh, thank God. Can I sit down now?" },
      ] },
      { id: 'vm2.t4', when: { matPlace: 'top' }, turns: [
        don("{team}, you're {placing}! The team ahead of you got here about a minute ago."),
        { by: 'a', say: "A minute? Are you kidding me?" },
        don("Maybe less! Something to think about tonight."),
      ] },
      // the middle
      { id: 'vm2.m1', when: { matPlace: 'mid' }, turns: [
        don("{team}! You're {placing}, right in the middle of the pack."),
        { by: 'b', say: "Middle's good. Middle means we're safe." },
        don("You are safe and sound, for now anyway!"),
      ] },
      { id: 'vm2.m2', when: { matPlace: 'mid' }, turns: [
        don("{team}, you're the {placing} team to arrive. Rough day?"),
        { by: 'a', say: "So much happened. You have no idea." },
        don("Oh, I have some idea. There were cameras."),
      ] },
      { id: 'vm2.m3', when: { matPlace: 'mid' }, turns: [
        { beat: '{a} and {b} walk on, arguing in whispers, and stop when they see Don.' },
        don("Don't stop on my account! {team}, you're {placing}."),
        { by: 'b', say: "We weren't arguing. We were... talking." },
      ] },
      { id: 'vm2.m4', when: { matPlace: 'mid' }, turns: [
        don("{team}! You're {placing}!"),
        { by: 'a', say: "Is that good? I honestly can't tell anymore." },
        don("It's not first, and it's not last. I'd call that a win."),
      ] },
      { id: 'vm2.m5', when: { matPlace: 'mid' }, turns: [
        don("{team}, you are the {placing} team to arrive!"),
        { by: 'b', say: "We'll take that. We will absolutely take that." },
        don("Good, because you don't get a choice!"),
      ] },
      // the bottom
      { id: 'vm2.b1', when: { matPlace: 'bottom' }, turns: [
        don("{team}, you're {placing}, and you're still in the race!"),
        { by: 'a', say: "Oh, thank God. Thank God." },
        don("You made it, so go and sit down before your legs give out!"),
      ] },
      { id: 'vm2.b2', when: { matPlace: 'bottom' }, turns: [
        { beat: '{a} and {b} come in at a stagger and practically fall onto the mat.' },
        don("Careful! That's a mat, not a bed. {team}, you're {placing}, and you're still racing."),
        { by: 'b', say: "Can we just lie here for a minute?" },
      ] },
      { id: 'vm2.b3', when: { matPlace: 'bottom' }, turns: [
        don("{team}, you're {placing}, and I'd almost stopped expecting you!"),
        { by: 'a', say: "We got lost. Really, really lost." },
        don("I could tell, so go and sit down before you get lost again."),
      ] },
      { id: 'vm2.b4', when: { matPlace: 'bottom' }, turns: [
        don("{team}, you're {placing}, and that was not your best day, huh?"),
        { by: 'b', say: "Not even close. But we're still here." },
        don("That's the spirit! Still here is all that counts."),
      ] },
      { id: 'vm2.b5', when: { matPlace: 'bottom' }, turns: [
        don("{team}, you're {placing}, and you're still in the race! Say it with me: still in the race!"),
        { by: 'a', say: "Still in the race." },
        don("You don't sound like you believe it. Work on that."),
      ] },
    ],
  },
};
