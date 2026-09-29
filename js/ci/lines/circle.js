// Circle Chat, the one room with everybody in it. Data only.
// a, b and c are the first three to post. `circle.theory`: a says in public
// that b is not who they say they are (the engine made that claim public).
export const CIRCLE = {
  'circle.open': [
    { id: 'circle.open.01', turns: [
      { by: 'a', react: "'Circle Chat is now open.' Okay. I'm not gonna be the first one to talk." },
      { by: 'b', send: "What's poppin' everybody?? {e:party}" },
      { by: 'a', react: "Of course it's {b}. Okay, go.", send: "Morning everyone! How's everybody doing?" },
      { by: 'c', send: "Surviving lol {e:sweat}" },
    ] },
    { id: 'circle.open.02', turns: [
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
    { id: 'circle.open.05', turns: [
      { by: 'a', say: "Say something, but don't say too much.", send: "Hey everyone! Hope you all slept better than me lol" },
      { by: 'b', send: "I slept like a baby honestly {e:halo}" },
      { by: 'a', react: "Of course {b.sub} did." },
    ] },
    { id: 'circle.open.06', turns: [
      { by: 'a', send: "Is it just me or is everyone being SO nice in here?? {e:eyes}" },
      { by: 'b', react: "What's that supposed to mean?", send: "Nice is good! Nice is the vibe lol" },
      { by: 'c', send: "Too nice maybe {e:detective}" },
    ], beat: 'For a moment nobody types anything.' },
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
      { by: 'a', react: "'Before the winner is revealed, you are invited to one last Circle Chat.' This is it." },
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
