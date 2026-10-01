// Circle Chat, the one room with everybody in it. Data only.
// a, b and c are the first three to post. `circle.theory`: a says in public
// that b is not who they say they are (the engine made that claim public).
export const CIRCLE = {
  // Day 1: the very first Circle Chat. Strangers, a blank screen, and
  // nobody wants to be the first to type (spec: US 1 Ep 1 opens this way).
  'circle.first': [
    { id: 'circle.first.01', turns: [
      { by: 'a', react: "'Circle Chat is now open.' Oh my God. Okay. Everybody's gonna be in there." },
      { by: 'b', send: "HELLO EVERYONE!!! {e:party} So happy to be here with you all" },
      { by: 'a', react: "Okay, {b} went first. Thank God.", send: "Heyyy everybody! Can't wait to get to know you all {e:heart}" },
      { by: 'c', send: "Hi hi hi!! Circle fam {e:hug} {t:DayOne}" },
    ], beat: '{a} lets out a breath and sits back on the couch.' },
    { id: 'circle.first.02', turns: [
      { by: 'a', send: "Okay I'll say it. Is everybody else as nervous as me right now?? {e:sweat}" },
      { by: 'b', send: "SO nervous lol. My hands are shaking" },
      { by: 'c', react: "Nervous. Everybody's nervous. Good. Nobody's playing yet.", send: "Same!! We're all in this together {e:heart}" },
    ] },
    { id: 'circle.first.03', turns: [
      { by: 'a', react: "Don't be first. Never be first. Let somebody else set the tone." },
      { by: 'b', send: "Well somebody has to break the ice so... hi!! {e:smile}" },
      { by: 'c', send: "Hi!! I love that you went first lol" },
      { by: 'a', react: "Okay, the ice is broken.", send: "Hey guys! So excited to meet everybody {e:smile}" },
    ] },
    { id: 'circle.first.04', turns: [
      { by: 'a', send: "Quick question for the group: what are we all eating tonight? First impressions matter {e:laugh}" },
      { by: 'b', send: "Honestly just snacks. I'm too nervous to cook" },
      { by: 'c', send: "Pizza. Always pizza. Judge me {e:laugh}" },
      { by: 'a', react: "Pizza. I like {c} already." },
    ] },
    { id: 'circle.first.05', turns: [
      { by: 'a', send: "Hey everybody! Let's make this the nicest group chat in Circle history {e:heart} {t:GoodVibesOnly}" },
      { by: 'b', react: "'Good vibes only.' Says every single person who's about to stab somebody in the back.", send: "Love that!! Good vibes {e:clap}" },
      { by: 'c', send: "Good vibes only {e:hug}" },
    ], beat: '{b} raises an eyebrow at the screen and says nothing more.' },
    { id: 'circle.first.06', turns: [
      { by: 'a', react: "Everybody's typing at once. Okay. Read the room. Who's loud, who's quiet." },
      { by: 'b', send: "WHAT'S UP CIRCLE {e:fire}{e:fire}" },
      { by: 'c', send: "Hi everyone :) nice to meet you all" },
      { by: 'a', react: "{b} is loud, {c} is careful. Noted." },
    ] },
  ],
  'circle.open': [
    { id: 'circle.open.01', when: { time: 'morning' }, turns: [
      { by: 'a', react: "'Circle Chat is now open.' Okay. I'm not gonna be the first one to talk." },
      { by: 'b', send: "What's poppin' everybody?? {e:party}" },
      { by: 'a', react: "Of course it's {b}. Okay, go.", send: "Morning everyone! How's everybody doing?" },
      { by: 'c', send: "Surviving lol {e:sweat}" },
    ] },
    { id: 'circle.open.02', when: { time: ['day', 'evening'] }, turns: [
      { by: 'a', send: "Okay who else is sick of their own cooking already {e:laugh}" },
      { by: 'b', send: "ME. I've had cereal three times today" },
      { by: 'c', send: "Three?? Respect {e:clap}" },
    ], beat: '{a} laughs at the screen, the first real laugh of the day.' },
    { id: 'circle.open.03', turns: [
      { by: 'a', send: "Can we just take a second and say we're all doing great in here {e:heart} {t:CircleFam}" },
      { by: 'b', react: "Oh, here we go.", send: "We love a group hug {e:hug}" },
      { by: 'c', send: "Circle fam!! {e:heart}" },
    ] },
    { id: 'circle.open.04', turns: [
      { by: 'a', send: "Question for the group. Best thing you've done in here so far?" },
      { by: 'b', send: "Took a two hour bath. No regrets" },
      { by: 'c', send: "Learned the dance from the music video channel lol" },
      { by: 'a', send: "Okay we need to see that dance {e:laugh}" },
    ] },
    { id: 'circle.open.05', when: { time: 'morning' }, turns: [
      { by: 'a', say: "Say something, but don't say too much.", send: "Hey everyone! Hope you all slept better than me lol" },
      { by: 'b', send: "I slept like a baby honestly {e:halo}" },
      { by: 'a', react: "Of course {b.sub} did." },
    ] },
    { id: 'circle.open.06', turns: [
      { by: 'a', send: "Is it just me or is everyone being SO nice in here?? {e:eyes}" },
      { by: 'b', react: "What's that supposed to mean?", send: "Nice is good! Nice is the vibe lol" },
      { by: 'c', send: "Too nice maybe {e:detective}" },
    ], beat: 'For a moment nobody types anything.' },
    // The hour it opens at (feed.js runCircleChat `when`).
    { id: 'circle.open.m1', when: { time: 'morning' }, turns: [
      { by: 'a', send: "Good morning Circle {e:sun} Who's actually awake?" },
      { by: 'b', send: "Awake is a strong word. I'm vertical" },
      { by: 'c', send: "Coffee first. Then personality {e:laugh}" },
    ] },
    { id: 'circle.open.m2', when: { time: 'morning' }, turns: [
      { by: 'a', react: "'Circle Chat is now open.' Before breakfast? Okay.", send: "Morning fam! Did anybody else dream about this place??" },
      { by: 'b', send: "I dreamed I got blocked and woke up screaming lol" },
      { by: 'a', send: "Okay that's dark {e:shock}" },
    ] },
    { id: 'circle.open.m3', when: { time: 'morning' }, turns: [
      { by: 'a', send: "Rise and shine everybody! New day, new chances {e:sparkle}" },
      { by: 'b', react: "Who has this much energy in the morning?", send: "Love the energy. Can't match it yet" },
      { by: 'c', send: "Give me ten minutes and a coffee and I'll be right there with you" },
    ] },
    { id: 'circle.open.m4', when: { time: 'morning' }, turns: [
      { by: 'a', send: "Breakfast check. What's everybody eating?" },
      { by: 'b', send: "Leftover pizza. Cold. No regrets" },
      { by: 'c', send: "That's the best breakfast and I'll fight anyone on it" },
    ] },
    { id: 'circle.open.m5', when: { time: 'morning' }, turns: [
      { by: 'a', say: "Morning chat. Be light. Be likeable.", send: "Hi everyone {e:smile} How did we all sleep?" },
      { by: 'b', send: "Like a rock. This bed is incredible" },
      { by: 'c', send: "Badly. Too much to think about lol" },
    ] },
    { id: 'circle.open.m6', when: { time: 'morning' }, turns: [
      { by: 'a', send: "It's way too early for Circle Chat and I love it" },
      { by: 'b', send: "Still in my pajamas and proud of it {e:laugh}" },
      { by: 'c', send: "Pajama gang reporting for duty" },
    ] },
    { id: 'circle.open.e1', when: { time: 'evening' }, turns: [
      { by: 'a', send: "Evening Circle! How was everybody's day?" },
      { by: 'b', send: "Long. So long. But good {e:smile}" },
      { by: 'c', send: "I talked to a TV for twelve hours. Normal day" },
    ] },
    { id: 'circle.open.e2', when: { time: 'evening' }, turns: [
      { by: 'a', send: "Okay who's already in bed?" },
      { by: 'b', send: "Me. Under the covers. Typing from the dark lol" },
      { by: 'a', react: "Same, honestly." },
    ] },
    { id: 'circle.open.e3', when: { time: 'evening' }, turns: [
      { by: 'a', react: "'Circle Chat is now open.' At this hour?", send: "Late night Circle Chat?? I'm here for it {e:eyes}" },
      { by: 'b', send: "Night owls unite" },
      { by: 'c', send: "I was literally about to fall asleep. Now I'm wide awake lol" },
    ] },
    { id: 'circle.open.e4', when: { time: 'evening' }, turns: [
      { by: 'a', send: "Dinner check. What did everybody make tonight?" },
      { by: 'b', send: "Pasta. Again. It's a lifestyle" },
      { by: 'c', send: "I made a sandwich and called it cooking" },
    ] },
    { id: 'circle.open.e5', when: { time: 'evening' }, turns: [
      { by: 'a', say: "End of the day. Don't say anything you'll regret at 2 a.m.", send: "Long day in here. Sending love to everybody {e:heart}" },
      { by: 'b', react: "Sending love. Hm.", send: "Love back!" },
      { by: 'c', send: "Group hug through the screens {e:heart}" },
    ] },
  ],
  'circle.party': [
    { id: 'circle.party.01', turns: [
      { by: 'a', send: "PARTY IN THE CIRCLE {e:party} {e:party} {t:LetsGetThisPartyStarted}" },
      { by: 'b', send: "I'm already three drinks in don't judge me {e:laugh}" },
      { by: 'c', send: "Never have I ever lied in this game {e:devil}" },
      { by: 'a', react: "Oh no. Oh, {c} went there." },
    ], beat: 'In every apartment, music gets turned up at the same time.' },
    { id: 'circle.party.02', turns: [
      { by: 'a', send: "Who's dancing right now? Be honest" },
      { by: 'b', send: "Me. On the coffee table. Don't tell anyone" },
      { by: 'a', send: "Your secret's safe {e:wink}" },
    ], beat: '{b} climbs down off the coffee table, slowly.' },
    { id: 'circle.party.03', turns: [
      { by: 'a', say: "Party mode. Be fun. Don't say anything stupid.", send: "Okay who's the best dancer in here, I need a dance-off" },
      { by: 'b', send: "It's me. Obviously {e:crown}" },
      { by: 'c', send: "Prove it lol" },
      { by: 'b', send: "Can't. No cameras. Just trust me {e:laugh}" },
    ] },
  ],
  'circle.final': [
    { id: 'circle.final.01', turns: [
      { by: 'a', send: "I just want to say I love every single one of you. No matter what {e:heart}" },
      { by: 'b', send: "We did it!! Final five!! {e:party}" },
      { by: 'c', send: "Cheers to the realest people in the Circle {e:party} {t:FinalFive}" },
    ], beat: 'In five apartments, five glasses go up at the same time.' },
    { id: 'circle.final.02', turns: [
      { by: 'a', send: "Whatever happens tonight, this was the craziest experience of my life" },
      { by: 'b', send: "Same. I'm gonna miss talking to a TV lol" },
      { by: 'c', send: "Can't wait to finally see all your faces {e:eyes}" },
    ] },
    { id: 'circle.final.03', turns: [
      { by: 'a', say: "Last chance to say something that sticks.", send: "No matter who wins, we all made it here. That's something" },
      { by: 'b', send: "Love you all. Really {e:heart}" },
      { by: 'c', send: "Group hug in real life tomorrow {e:hug}" },
    ] },
  ],
  'circle.theory': [
    { id: 'circle.theory.01', turns: [
      { by: 'a', say: "I'm saying it. In front of everyone.", send: "I'm just gonna say it. I don't think {b} is who {b.sub} says {b.sub} is" },
      { by: 'b', react: "Excuse me?", send: "Wow. In the group chat? Really?" },
      { by: 'a', send: "I'm just being honest" },
    ], beat: 'Every apartment goes quiet.' },
    { id: 'circle.theory.02', turns: [
      { by: 'a', send: "Is anyone else getting catfish vibes from {b} or is it just me {e:detective}" },
      { by: 'b', react: "Oh, so we're doing this.", send: "I'm literally right here lol. I'm 100% real" },
    ], beat: '{b} gets up and walks a lap of the apartment before coming back to the screen.' },
    { id: 'circle.theory.03', turns: [
      { by: 'a', send: "Not to start drama but something about {b} doesn't add up" },
      { by: 'b', send: "Say it to my face. Oh wait, you can't {e:side}" },
      { by: 'a', send: "Lol okay" },
    ], beat: 'Somewhere in the building, somebody gasps out loud.' },
  ],
};
