// More of Don checking teams in at the Chill Zone (the pool that repeats most: 17 a season of 83 aired, 2026-10-20).
// Quick hits in his voice: a jab aimed at where they came in, the team answers, Don has the last word. The arriving
// team is a and b. Gated on matPlace (first, top, mid, bottom) so the jab fits the placing.
const don = say => ({ by: 'don', say });

export default {
  retire: [],
  pools: {
    'don-place.plain': [
      // first
      { id: 'vm2.f1', when: { matPlace: 'first' }, turns: [
        don("{team}. First. I had money on somebody else. Not a lot. But some."),
        { by: 'a', say: "Who?" },
        don("Not telling. They're still out there, and they can hear me."),
      ] },
      { id: 'vm2.f2', when: { matPlace: 'first' }, turns: [
        { beat: '{a} and {b} arrive at a walk, looking around for the other teams.' },
        don("You can stop looking. There's nobody here. You're first."),
        { by: 'b', say: "We thought we'd gone the wrong way." },
        don("You did. It was shorter. Don't tell anyone."),
      ] },
      { id: 'vm2.f3', when: { matPlace: 'first' }, turns: [
        don("{team}, first place. Say something humble for the camera."),
        { by: 'a', say: "We got lucky." },
        don("Nobody believes you, but thank you for trying."),
      ] },
      // near the top
      { id: 'vm2.t1', when: { matPlace: 'top' }, turns: [
        don("{team}. {placing}. Close. Not close enough to get anything, but close."),
        { by: 'b', say: "What does first get?" },
        don("A better spot on the mat. You're standing on the worse one."),
      ] },
      { id: 'vm2.t2', when: { matPlace: 'top' }, turns: [
        don("{placing}, {team}. You were in the lead for a while. I was watching. Then I wasn't."),
        { by: 'a', say: "What happened?" },
        don("You tell me. I was eating."),
      ] },
      { id: 'vm2.t3', when: { matPlace: 'top' }, turns: [
        { beat: '{a} steps on the mat; {b} is still bent over with hands on knees a few steps back.' },
        don("Both feet, both of you. There. {team}, {placing}."),
        { by: 'b', say: "Could you say it again? I missed it." },
        don("No. Ask your partner. Off you go."),
      ] },
      { id: 'vm2.t4', when: { matPlace: 'top' }, turns: [
        don("{team}. {placing} team to arrive. The team ahead of you got here about a minute ago."),
        { by: 'a', say: "A minute?" },
        don("Maybe less. Something to think about tonight."),
      ] },
      // the middle
      { id: 'vm2.m1', when: { matPlace: 'mid' }, turns: [
        don("{team}. {placing}. Right in the middle. The safest place to be, and the hardest to remember."),
        { by: 'b', say: "We'll take safe." },
        don("Everyone says that until they've been safe for five legs."),
      ] },
      { id: 'vm2.m2', when: { matPlace: 'mid' }, turns: [
        don("{placing}, {team}. Not a word about it from me. Nothing happened. You arrived."),
        { by: 'a', say: "A lot happened, actually." },
        don("Not on my mat it didn't. Next."),
      ] },
      { id: 'vm2.m3', when: { matPlace: 'mid' }, turns: [
        { beat: '{a} and {b} walk on, arguing in whispers, and stop when they see Don.' },
        don("Finish it. I've got all day. Actually, no. {team}, {placing}. Finish it over there."),
        { by: 'b', say: "We weren't arguing." },
        don("Then you're very loud agreers."),
      ] },
      { id: 'vm2.m4', when: { matPlace: 'mid' }, turns: [
        don("{team}, you're {placing}. Which is exactly where I'd have put you."),
        { by: 'a', say: "Is that a compliment?" },
        don("It's a placing. Compliments are extra."),
      ] },
      { id: 'vm2.m5', when: { matPlace: 'mid' }, turns: [
        don("{team}. {placing} team to arrive. I'd clap, but I've been clapping all afternoon and my hands are tired."),
        { by: 'b', say: "We'll clap for ourselves." },
        don("Please don't. Just stand there and be {placing}."),
      ] },
      // the bottom
      { id: 'vm2.b1', when: { matPlace: 'bottom' }, turns: [
        don("{team}. You're {placing}. You're still in. And I'm as surprised as you are."),
        { by: 'a', say: "We're not surprised." },
        don("Then one of us wasn't watching, and it wasn't me."),
      ] },
      { id: 'vm2.b2', when: { matPlace: 'bottom' }, turns: [
        { beat: '{a} and {b} come in at a stagger and fall onto the mat more than step on it.' },
        don("That's a mat, not a bed. {team}, {placing}. Still racing. Barely."),
        { by: 'b', say: "Can we lie here a minute?" },
        don("Thirty seconds. Then the next team lands on you."),
      ] },
      { id: 'vm2.b3', when: { matPlace: 'bottom' }, turns: [
        don("{team}. {placing}. I'll be honest, I'd stopped expecting you."),
        { by: 'a', say: "We got lost. Twice." },
        don("Once is a story. Twice is a habit. Go sit down before you get lost again."),
      ] },
      { id: 'vm2.b4', when: { matPlace: 'bottom' }, turns: [
        don("{placing}, {team}. Nobody behind you is having a good day. Which makes this your good day."),
        { by: 'b', say: "That's bleak." },
        don("That's the back of the pack. Welcome to it."),
      ] },
      { id: 'vm2.b5', when: { matPlace: 'bottom' }, turns: [
        don("{team}, you're {placing}. Still in the race. Say it with me: still in the race."),
        { by: 'a', say: "Still in the race." },
        don("Didn't sound like you believed it. Work on that."),
      ] },
    ],
  },
};
