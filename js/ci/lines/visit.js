// The visit (spec §11): a blocked Player walks into one apartment before
// leaving. Data only. In `visit.choose.*` and `visit.talk.*`, a is the blocked
// Player and b the one visited; the motive is the engine's. In `visit.wait*`,
// a is a Player waiting and b the one who was blocked. In `visit.door.*`, a
// opens the door and b is at it — `.catfish` when b's profile was not b.
// `visit.hand`: a tells b that c is not real. `report`: a, who was visited,
// tells b that the visit warned about c — a lie.
export const VISIT = {
  'visit.choose.friend': [
    { id: 'visit.choose.friend.01', turns: [
      { by: 'a', react: "'You may visit one Player before you leave.' I know exactly who." },
      { by: 'a', say: "{b} was my person in here. I'm not leaving without a hug." },
    ] },
    { id: 'visit.choose.friend.02', turns: [
      { by: 'a', say: "I just want to meet {b}. That's it. No game. Just a friend." },
    ], beat: '{a} grabs a jacket on the way out.' },
    { id: 'visit.choose.friend.03', turns: [
      { by: 'a', say: "I'm going to see {b}. I need {b.obj} to know I'm rooting for {b.obj}." },
    ] },
  ],
  'visit.choose.answers': [
    { id: 'visit.choose.answers.01', turns: [
      { by: 'a', say: "{b} blocked me. I want to look {b.obj} in the eye and hear why." },
    ], beat: '{a} walks out of the apartment without looking back.' },
    { id: 'visit.choose.answers.02', turns: [
      { by: 'a', react: "Oh, I'm going to see an Influencer. You'd better believe it." },
      { by: 'a', say: "{b} gets to explain this one in person." },
    ] },
    { id: 'visit.choose.answers.03', turns: [
      { by: 'a', say: "I'm not mad. Okay, I'm a little mad. I'm going to see {b}." },
    ] },
    { id: 'visit.choose.answers.04', turns: [
      { by: 'a', say: "I'm not leaving without looking {b} in the eye." },
    ], beat: '{a} puts on shoes without sitting down.' },
    { id: 'visit.choose.answers.05', turns: [
      { by: 'a', react: "I know who's getting a knock on the door tonight." },
      { by: 'a', say: "{b} is gonna explain this to my face." },
    ] },
    { id: 'visit.choose.answers.06', turns: [
      { by: 'a', say: "It's {b}. {b} made this decision. {b} can own it." },
    ] },
  ],
  'visit.choose.truth': [
    { id: 'visit.choose.truth.01', turns: [
      { by: 'a', say: "I've had a feeling about {b} since day one. Now I get to find out." },
    ] },
    { id: 'visit.choose.truth.02', turns: [
      { by: 'a', say: "If I'm leaving, I'm leaving with an answer. Is {b} who {b.sub} says {b.sub} is?" },
    ], beat: '{a} ties {a.posAdj} shoes, fast.' },
    { id: 'visit.choose.truth.03', turns: [
      { by: 'a', react: "Oh, I know who I'm visiting. I'm going to find out if {b} is real." },
    ] },
  ],
  'visit.choose.apology': [
    { id: 'visit.choose.apology.01', turns: [
      { by: 'a', say: "{b} deserves to hear it from me, face to face. I owe {b.obj} that." },
    ] },
    { id: 'visit.choose.apology.02', turns: [
      { by: 'a', say: "I'm going to see {b}. I need to say sorry before I go." },
    ], beat: '{a} takes a breath at the door before opening it.' },
    { id: 'visit.choose.apology.03', turns: [
      { by: 'a', say: "{b} was nothing but good to me, and I wasn't always straight with {b.obj}. That has to change tonight." },
    ] },
  ],
  'visit.wait': [
    { id: 'visit.wait.01', turns: [
      { by: 'a', react: "'The blocked Player is on their way to visit one of you.' Oh no. Oh no, no, no." },
    ], beat: '{a} runs around the apartment picking up clothes from the floor.' },
    { id: 'visit.wait.02', turns: [
      { by: 'a', react: "Is {b} coming here? Please don't come here." },
    ], beat: '{a} sits very still on the couch, staring at the door.' },
    { id: 'visit.wait.03', turns: [
      { by: 'a', say: "If {b} walks through that door, what do I say? 'Hi, sorry I didn't save you'?" },
    ], beat: '{a} practices a smile in the mirror.' },
    { id: 'visit.wait.04', turns: [
      { by: 'a', react: "I'm not even wearing pants. Why am I not wearing pants?" },
    ], beat: '{a} sprints to the bedroom.' },
    { id: 'visit.wait.05', turns: [
      { by: 'a', react: "Every sound in this building is the door. That's the door. Is that the door?" },
    ] },
    { id: 'visit.wait.06', turns: [
      { by: 'a', react: "If it's me, I'm just gonna say sorry. For everything. Just in case." },
    ], beat: '{a} fixes the pillows on the couch three times.' },
    { id: 'visit.wait.07', turns: [
      { by: 'a', react: "Somebody's walking the halls right now. What if it's to my door?" },
    ], beat: '{a} turns off the TV to listen for footsteps.' },
    { id: 'visit.wait.08', turns: [
      { by: 'a', say: "Okay. Hair, fine. Kitchen, disaster. No time." },
    ], beat: '{a} throws the dirty dishes into the oven.' },
  ],
  'visit.wait.catfish': [
    { id: 'visit.wait.catfish.01', turns: [
      { by: 'a', react: "If {b} knocks on my door, my whole game is over." },
    ], beat: '{a} stands up, sits down, and stands up again.' },
    { id: 'visit.wait.catfish.02', turns: [
      { by: 'a', say: "{b} opens that door, sees me, and it's done. Please go somewhere else. Anywhere else." },
    ] },
    { id: 'visit.wait.catfish.03', turns: [
      { by: 'a', react: "Okay. If it's me, I just tell the truth. That's all I can do." },
    ], beat: '{a} holds a pillow over {a.posAdj} face.' },
    { id: 'visit.wait.catfish.04', turns: [
      { by: 'a', react: "I have never been this scared of a door in my life." },
    ] },
  ],
  'visit.door.real': [
    { id: 'visit.door.real.01', turns: [
      { by: 'a', react: "Somebody's in the hallway. Oh my God." },
      { by: 'b', react: "Hi!" },
      { by: 'a', react: "It's you! It's really you!" },
    ], beat: '{a} and {b} hug in the doorway.' },
    { id: 'visit.door.real.02', turns: [
      { by: 'b', react: "Hey. It's me." },
      { by: 'a', react: "Oh my God, you look exactly like your pictures. Come in." },
    ] },
    { id: 'visit.door.real.03', turns: [
      { by: 'a', react: "{b}? Get in here!" },
      { by: 'b', react: "This is so weird. You have a real voice." },
    ], beat: '{b} walks in and looks around the apartment.' },
  ],
  'visit.door.catfish': [
    { id: 'visit.door.catfish.01', stage: '{b.real} is standing at the door, not the face from the profile.', turns: [
      { by: 'a', react: "Hi. Can I help you?" },
      { by: 'b', react: "It's me. {b}." },
      { by: 'a', react: "No. No way. You're {b}?" },
    ] },
    { id: 'visit.door.catfish.02', stage: 'The door opens on {b.real}.', turns: [
      { by: 'a', react: "Wait. Who are you?" },
      { by: 'b', react: "Surprise. I'm {b}. Well, I was." },
      { by: 'a', react: "Stop. Stop! Come in, you have to explain this." },
    ] },
    { id: 'visit.door.catfish.03', stage: '{b.real} waves from the hallway.', turns: [
      { by: 'b', react: "Hi. Please don't be mad." },
      { by: 'a', react: "You're {b}? The whole time?" },
      { by: 'b', react: "The whole time." },
    ], beat: '{a} laughs and pulls {b.real} inside.' },
  ],
  // a is the visitor; b opened the door, and b's profile was not b.
  'visit.door.caught': [
    { id: 'visit.door.caught.01', stage: 'The person who opens the door is {b.real}.', turns: [
      { by: 'a', react: "Hold on. You're {b}?" },
      { by: 'b', react: "Please keep your voice down. Yes. I'm {b}." },
    ] },
    { id: 'visit.door.caught.02', stage: '{b.real} opens the door, already wincing.', turns: [
      { by: 'b', react: "Hi. So. This is awkward." },
      { by: 'a', react: "No way. {b}? I knew it. I knew it!" },
    ] },
    { id: 'visit.door.caught.03', stage: '{b.real} is in the doorway, not the face from the profile.', turns: [
      { by: 'a', react: "Okay. Nobody in this game is who they say they are." },
      { by: 'b', react: "I can explain. Come in. Please come in." },
    ] },
  ],
  // Both profiles were fake: a opens the door, b is at it, and neither is who
  // the other expected.
  'visit.door.both': [
    { id: 'visit.door.both.01', stage: '{a.real} opens the door to {b.real}. Neither of them looks like a profile picture.', turns: [
      { by: 'b', react: "Wait. You're {a}?" },
      { by: 'a', react: "And you're {b}? Oh my God. Get in here before somebody sees." },
    ] },
    { id: 'visit.door.both.02', stage: '{b.real} knocks, and {a.real} opens the door.', turns: [
      { by: 'a', react: "Hi. I'm {a}. Kind of." },
      { by: 'b', react: "Yeah? I'm {b}. Kind of." },
    ], beat: '{a} and {b} burst out laughing in the doorway.' },
    { id: 'visit.door.both.03', stage: 'The door opens, and {a.real} and {b.real} stare at each other.', turns: [
      { by: 'b', react: "Okay, you are not what I expected." },
      { by: 'a', react: "Look who's talking." },
    ] },
  ],
  'visit.talk.friend': [
    { id: 'visit.talk.friend.01', turns: [
      { by: 'a', say: "I just wanted you to know you were my favorite person in here." },
      { by: 'b', say: "Stop. You're gonna make me cry. You're my favorite too." },
    ], beat: '{a} and {b} sit on the couch like old friends.' },
    { id: 'visit.talk.friend.02', turns: [
      { by: 'a', say: "Win this for me, okay? I mean it." },
      { by: 'b', say: "I'll try. I promise I'll try." },
    ] },
    { id: 'visit.talk.friend.03', turns: [
      { by: 'b', say: "I didn't want this for you. I swear." },
      { by: 'a', say: "I know. I'm not here about the game. I'm here because I like you." },
    ] },
  ],
  'visit.talk.answers': [
    { id: 'visit.talk.answers.01', turns: [
      { by: 'a', say: "So. Why me?" },
      { by: 'b', say: "Honestly? It was a game move. It wasn't personal." },
      { by: 'a', say: "It feels pretty personal from here." },
    ] },
    { id: 'visit.talk.answers.02', turns: [
      { by: 'a', say: "I thought we were good. What happened?" },
      { by: 'b', say: "We were. I just had to protect my people." },
      { by: 'a', say: "I thought I was your people." },
    ], beat: '{b} looks at the floor.' },
    { id: 'visit.talk.answers.03', turns: [
      { by: 'b', say: "I figured you'd come here." },
      { by: 'a', say: "Of course I came here. You owe me an answer." },
      { by: 'b', say: "It came down to numbers. I'm sorry." },
    ] },
    { id: 'visit.talk.answers.04', when: { sole: false }, turns: [
      { by: 'a', say: "Just be honest with me. Was it you?" },
      { by: 'b', say: "It was both of us. I'm not gonna lie to your face." },
      { by: 'a', say: "Okay. I respect that more than you know." },
    ] },
    { id: 'visit.talk.answers.05', turns: [
      { by: 'b', say: "I know you're mad. You're allowed to be mad." },
      { by: 'a', say: "I'm not mad. I'm hurt. There's a difference." },
    ], beat: '{a} and {b} sit on opposite ends of the couch.' },
    { id: 'visit.talk.answers.06', turns: [
      { by: 'a', say: "Why me? Tell me the truth." },
      { by: 'b', say: "Because you were good at this. Too good." },
      { by: 'a', say: "That's the nicest mean thing anybody's ever said to me." },
    ] },
  ],
  'visit.talk.truth': [
    { id: 'visit.talk.truth.01', turns: [
      { by: 'a', say: "I had to see for myself. I had my doubts about you." },
      { by: 'b', say: "Well? Here I am." },
    ] },
    { id: 'visit.talk.truth.02', turns: [
      { by: 'a', say: "I've wondered about you since day one." },
      { by: 'b', say: "And now you know. Was it worth it?" },
      { by: 'a', say: "Honestly? Yes." },
    ] },
    { id: 'visit.talk.truth.03', turns: [
      { by: 'a', say: "I'm leaving, so I don't need to play anymore. I just wanted the truth." },
      { by: 'b', say: "That's fair. That's really fair." },
    ], beat: '{a} and {b} look at each other and laugh.' },
  ],
  'visit.talk.apology': [
    { id: 'visit.talk.apology.01', turns: [
      { by: 'a', say: "I need to say sorry. I wasn't always honest with you." },
      { by: 'b', say: "Okay. Thank you for saying that." },
    ] },
    { id: 'visit.talk.apology.02', turns: [
      { by: 'a', say: "You were so good to me, and I played you. I'm sorry." },
      { by: 'b', say: "It's a game. I get it. It still stings a little." },
    ], beat: '{a} reaches out and {b} takes {a.posAdj} hand.' },
    { id: 'visit.talk.apology.03', turns: [
      { by: 'a', say: "I came here to apologize, not to explain. You didn't deserve that." },
      { by: 'b', say: "Hey. Come here." },
    ], beat: '{a} and {b} hug for a long time.' },
  ],
  'visit.hand': [
    { id: 'visit.hand.01', turns: [
      { by: 'a', say: "One more thing. Watch out for {c}. I don't think {c} is real." },
      { by: 'b', say: "You think {c} is a catfish?" },
      { by: 'a', say: "I'm sure of it." },
    ] },
    { id: 'visit.hand.02', turns: [
      { by: 'a', say: "Can I give you some advice? Be careful with {c}. Something doesn't add up." },
      { by: 'b', say: "I've kind of felt that too." },
    ] },
    { id: 'visit.hand.03', turns: [
      { by: 'a', say: "Before I go. {c}. I don't believe a word of that profile." },
      { by: 'b', say: "Okay. I'll keep my eyes open." },
    ], beat: '{b} nods slowly.' },
  ],
  'visit.kiss': [
    { id: 'visit.kiss.01', turns: [
      { by: 'b', say: "So, I have to say this. You're even cuter in person." },
      { by: 'a', say: "Yeah? Come here, then." },
    ], beat: '{a} and {b} kiss, and neither one looks at the cameras.' },
    { id: 'visit.kiss.02', turns: [
      { by: 'a', say: "I've been wanting to do this for days." },
      { by: 'b', say: "Then do it." },
    ], beat: '{a} and {b} kiss in the middle of the living room.' },
    { id: 'visit.kiss.03', turns: [
      { by: 'b', say: "This is so weird. We've never even heard each other's voices." },
      { by: 'a', say: "Then stop talking." },
    ], beat: '{a} kisses {b}, and {b} laughs into it.' },
  ],
  'visit.bye': [
    { id: 'visit.bye.01', turns: [
      { by: 'a', say: "Okay. I have to go. Go win this." },
      { by: 'b', say: "I'll see you on the outside." },
    ], beat: 'The door closes, and {b} stands in the quiet apartment for a while.' },
    { id: 'visit.bye.02', turns: [
      { by: 'b', say: "I'm really glad it was you." },
      { by: 'a', say: "Me too. Bye, {b}." },
    ] },
    { id: 'visit.bye.03', turns: [
      { by: 'a', say: "Don't let them get you." },
      { by: 'b', say: "I won't. Bye." },
    ], beat: '{a} waves from the hallway until the door shuts.' },
    { id: 'visit.bye.04', turns: [
      { by: 'b', say: "Thank you for coming. Really." },
      { by: 'a', say: "Of course. Now go make me proud." },
    ], beat: '{a} gives one last wave on the way out.' },
    { id: 'visit.bye.05', turns: [
      { by: 'a', say: "Okay. That's my time. Good luck in there." },
      { by: 'b', say: "Thank you. For all of it." },
    ] },
    { id: 'visit.bye.06', turns: [
      { by: 'b', say: "Text me when you're out. I mean it." },
      { by: 'a', say: "You don't even have a phone." },
      { by: 'b', say: "I will someday!" },
    ], beat: 'The door shuts on both of them laughing.' },
  ],
  'report': [
    { id: 'report.01', turns: [
      { by: 'a', say: "It's not exactly what I was told. But it's close enough.", send: "I need to tell you something from my visit {e:eyes}" },
      { by: 'b', send: "Okay you're scaring me. What?" },
      { by: 'a', send: "I was told {c} has been talking about you. Like, a lot" },
      { by: 'b', react: "I knew it. I knew something was off with {c}." },
    ] },
    { id: 'report.02', turns: [
      { by: 'a', say: "Nobody knows what happened at that visit but me. So I decide what happened.", send: "Can I be honest about my visit?" },
      { by: 'b', send: "Of course. Tell me" },
      { by: 'a', send: "The last thing I heard before the door closed was to watch out for {c}. For your sake" },
      { by: 'b', send: "Wow. Thank you for telling me {e:pray}" },
    ] },
    { id: 'report.03', turns: [
      { by: 'a', say: "Time to use this visit.", send: "Just so you know, {c} is not on your side. I heard it straight from my visit" },
      { by: 'b', react: "Seriously? {c}?", send: "Are you sure??" },
      { by: 'a', send: "100%. I wouldn't lie to you" },
    ], beat: '{a} smiles at the screen after hitting send.' },
  ],
};
