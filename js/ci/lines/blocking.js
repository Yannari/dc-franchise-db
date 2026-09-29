// The blocking (spec §10). Data only. In `block.announce.*`, a is the
// Influencer who types the name into Circle Chat and c is the Player blocked;
// the reason is the one the Influencers agreed on. In `block.react.*`, a
// reacts and b is the blocked Player (in `.self`, a is the one blocked).
export const BLOCKING = {
  'block.announce.fake': [
    { id: 'block.announce.fake.01', turns: [
      { by: 'a', say: "Message: 'This was the hardest decision.' No. Just say it.", send: "We've decided to block someone we don't believe is being real with us. The person we are blocking is... {c}" },
    ], beat: 'Every apartment waits on the dots.' },
    { id: 'block.announce.fake.02', turns: [
      { by: 'a', send: "We just couldn't shake the feeling that this person wasn't who they said they were. We are blocking... {c}" },
    ] },
    { id: 'block.announce.fake.03', turns: [
      { by: 'a', say: "Dot, dot, dot. Make them sweat.", send: "The Circle is about being real. We're sorry, but we're blocking... {c} {e:fish}" },
    ] },
  ],
  'block.announce.threat': [
    { id: 'block.announce.threat.01', turns: [
      { by: 'a', send: "This person is one of the strongest players in here, and that's exactly why. We are blocking... {c}" },
    ], beat: 'Every apartment waits on the dots.' },
    { id: 'block.announce.threat.02', turns: [
      { by: 'a', say: "Be nice about it. It's not personal.", send: "This is strategy, not personal. We love you, but we're blocking... {c}" },
    ] },
    { id: 'block.announce.threat.03', turns: [
      { by: 'a', send: "Everybody loves this person. Including us. Which is why we had to do it. We are blocking... {c}" },
    ] },
  ],
  'block.announce.grudge': [
    { id: 'block.announce.grudge.01', turns: [
      { by: 'a', send: "This person hasn't been straight with us, and we can't move forward like that. We are blocking... {c}" },
    ], beat: 'Every apartment waits on the dots.' },
    { id: 'block.announce.grudge.02', turns: [
      { by: 'a', say: "Don't make it ugly. Just say it.", send: "Some bridges were burned in here. We're blocking... {c}" },
    ] },
    { id: 'block.announce.grudge.03', turns: [
      { by: 'a', send: "Trust is everything in this game, and we lost it with this person. We are blocking... {c}" },
    ] },
  ],
  'block.announce.noBond': [
    { id: 'block.announce.noBond.01', turns: [
      { by: 'a', send: "This was the hardest thing we've done in here. We just didn't get the chance to connect. We are blocking... {c} {e:broken}" },
    ], beat: 'Every apartment waits on the dots.' },
    { id: 'block.announce.noBond.02', turns: [
      { by: 'a', say: "This is awful. There's no good way to type this.", send: "We're so sorry. We wish we'd gotten to know you better. We are blocking... {c}" },
    ] },
    { id: 'block.announce.noBond.03', turns: [
      { by: 'a', send: "We had to protect the people we're closest to. The person we're blocking is... {c}" },
    ] },
  ],
  'block.react.self': [
    { id: 'block.react.self.01', turns: [
      { by: 'a', react: "Me? It's me?" },
      { by: 'a', say: "I really thought I was safe. I really did." },
    ], beat: '{a} stares at the screen without blinking.' },
    { id: 'block.react.self.02', turns: [
      { by: 'a', react: "No. Oh, come on." },
    ], beat: '{a} laughs once and puts a hand over {a.posAdj} mouth.' },
    { id: 'block.react.self.03', turns: [
      { by: 'a', react: "Wow. Okay. Okay. I get it. It's a game." },
      { by: 'a', say: "I'm not mad. I'm just sad I don't get to finish it." },
    ] },
    { id: 'block.react.self.04', turns: [
      { by: 'a', react: "Are you serious? After everything?" },
    ], beat: '{a} gets up and walks to the window.' },
  ],
  'block.react.friend': [
    { id: 'block.react.friend.01', turns: [
      { by: 'a', react: "No! Not {b}! {b} was my person in here!" },
    ], beat: '{a} covers {a.posAdj} face with both hands.' },
    { id: 'block.react.friend.02', turns: [
      { by: 'a', react: "They took {b}. That's so cold." },
      { by: 'a', say: "Whoever did this, I'm coming for them." },
    ] },
    { id: 'block.react.friend.03', turns: [
      { by: 'a', react: "Oh, {b}. I'm so sorry." },
    ], beat: '{a} sits down on the floor.' },
  ],
  'block.react.rival': [
    { id: 'block.react.rival.01', turns: [
      { by: 'a', react: "{b}? Oh, bye!" },
    ], beat: '{a} does a little shimmy on the couch, then remembers the cameras.' },
    { id: 'block.react.rival.02', turns: [
      { by: 'a', react: "Well. I'm not gonna cry about that one." },
    ] },
    { id: 'block.react.rival.03', turns: [
      { by: 'a', react: "{b}. Wow. I didn't even have to lift a finger." },
    ] },
  ],
  'block.react.relief': [
    { id: 'block.react.relief.01', turns: [
      { by: 'a', react: "Not me. Not me. Oh, thank God." },
    ], beat: '{a} falls back into the couch cushions.' },
    { id: 'block.react.relief.02', turns: [
      { by: 'a', react: "Poor {b}. But I'm still here." },
    ] },
    { id: 'block.react.relief.03', turns: [
      { by: 'a', react: "My heart was pounding so hard. {b}. Wow." },
    ] },
  ],
};
