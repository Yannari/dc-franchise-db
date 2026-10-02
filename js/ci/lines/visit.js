// The visit (spec §11): a blocked Player walks into one apartment before
// leaving. Data only. In `visit.choose.*` and `visit.talk.*`, a is the blocked
// Player and b the one visited; the motive is the engine's. In `visit.wait*`,
// a is a Player waiting and b the one who was blocked. In `visit.door.*`, a
// opens the door and b is at it — `.catfish` when b's profile was not b.
// `visit.hand`: a tells b that c is not real. `report`: a, who was visited,
// tells b that the visit warned about c — a lie.
export const VISIT = {
  // The show keeps WHO for the knock: the blocked player says why, never the
  // name (user, 2026-10-01: "always respect the show"). {b} is still cast,
  // for the visit itself; these lines must not use it.
  'visit.choose.friend': [
    { id: 'visit.choose.friend.01', turns: [
      { by: 'a', react: "'You may visit one Player before you leave.' I know exactly who." },
      { by: 'a', say: "There's one person in here who was really my person. I'm not leaving without a hug." },
    ] },
    { id: 'visit.choose.friend.02', turns: [
      { by: 'a', say: "I just want to meet my friend. That's it. No game." },
    ], beat: '{a} grabs a jacket on the way out.' },
    { id: 'visit.choose.friend.03', turns: [
      { by: 'a', say: "Somebody in here needs to know I'm rooting for them. In person." },
    ] },
  ],
  'visit.choose.answers': [
    { id: 'visit.choose.answers.01', turns: [
      { by: 'a', say: "Somebody blocked me. I want to look them in the eye and hear why." },
    ], beat: '{a} walks out of the apartment without looking back.' },
    { id: 'visit.choose.answers.02', turns: [
      { by: 'a', react: "Oh, I'm going to see an Influencer. You'd better believe it." },
      { by: 'a', say: "Somebody gets to explain this one in person." },
    ] },
    { id: 'visit.choose.answers.03', turns: [
      { by: 'a', say: "I'm not mad. Okay, I'm a little mad. And I know whose door I'm knocking on." },
    ] },
    { id: 'visit.choose.answers.04', turns: [
      { by: 'a', say: "I'm not leaving without looking one of them in the eye." },
    ], beat: '{a} puts on shoes without sitting down.' },
    { id: 'visit.choose.answers.05', turns: [
      { by: 'a', react: "I know who's getting a knock on the door tonight." },
      { by: 'a', say: "And they're gonna explain this to my face." },
    ] },
    { id: 'visit.choose.answers.06', turns: [
      { by: 'a', say: "They made this decision. They can own it. Face to face." },
    ] },
  ],
  'visit.choose.truth': [
    { id: 'visit.choose.truth.01', turns: [
      { by: 'a', say: "I've had a feeling about one profile since day one. Now I get to find out." },
    ] },
    { id: 'visit.choose.truth.02', turns: [
      { by: 'a', say: "If I'm leaving, I'm leaving with an answer. Is that profile real or not?" },
    ], beat: '{a} ties {a.posAdj} shoes, fast.' },
    { id: 'visit.choose.truth.03', turns: [
      { by: 'a', react: "Oh, I know who I'm visiting. I'm going to find out who's really behind that screen." },
    ] },
  ],
  'visit.choose.apology': [
    { id: 'visit.choose.apology.01', turns: [
      { by: 'a', say: "Somebody deserves to hear it from me, face to face. I owe them that." },
    ] },
    { id: 'visit.choose.apology.02', turns: [
      { by: 'a', say: "I have one more thing to do. I need to say sorry before I go." },
    ], beat: '{a} takes a breath at the door before opening it.' },
    { id: 'visit.choose.apology.03', turns: [
      { by: 'a', say: "Somebody was nothing but good to me, and I wasn't always straight with them. That changes tonight." },
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
      { by: 'a', say: "If {b} walks through that door, what do I say? 'Hi, sorry you got blocked'?" },
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
    { id: 'visit.talk.friend.04', turns: [
      { by: 'a', say: "I didn't come here to talk about the game." },
      { by: 'b', say: "Thank God. I'm so tired of the game." },
    ], beat: '{a} and {b} kick their shoes off and sink into the couch.' },
    { id: 'visit.talk.friend.05', turns: [
      { by: 'b', say: "You came to see me? Out of everybody?" },
      { by: 'a', say: "Out of everybody. It wasn't even close." },
    ] },
    { id: 'visit.talk.friend.06', turns: [
      { by: 'a', say: "You're even funnier in person. That's not fair." },
      { by: 'b', say: "Wait till you hear my real laugh. It's embarrassing." },
    ], beat: '{b} laughs, and {a} was right: it is.' },
    { id: 'visit.talk.friend.07', turns: [
      { by: 'b', say: "I'm so mad they did this to you." },
      { by: 'a', say: "Don't be mad. Be smart. Stay in this." },
    ] },
    { id: 'visit.talk.friend.08', turns: [
      { by: 'a', say: "I needed one real hug before I go." },
      { by: 'b', say: "Come here. You get two." },
    ], beat: '{a} and {b} hug for a long time.' },
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
    { id: 'visit.talk.answers.07', turns: [
      { by: 'b', say: "Come in. I know why you're here." },
      { by: 'a', say: "Then you know I'm not leaving without a straight answer." },
      { by: 'b', say: "You had the most people in your corner. That scared me." },
    ] },
    { id: 'visit.talk.answers.08', turns: [
      { by: 'a', say: "Was it something I said?" },
      { by: 'b', say: "It was what you didn't say. I never knew where you stood." },
      { by: 'a', say: "I stood with you. That's where I stood." },
    ] },
    { id: 'visit.talk.answers.09', when: { sole: false }, turns: [
      { by: 'a', say: "Whose idea was it? Yours or theirs?" },
      { by: 'b', say: "We both got there. I'm not gonna hide behind anybody." },
    ] },
    { id: 'visit.talk.answers.10', when: { sole: true }, turns: [
      { by: 'a', say: "So it was all you. Nobody else to blame." },
      { by: 'b', say: "Nobody else. I made the call, and I'm owning it." },
    ] },
    { id: 'visit.talk.answers.11', turns: [
      { by: 'b', say: "Before you say anything, I'm sorry." },
      { by: 'a', say: "Don't be sorry. Just tell me why." },
      { by: 'b', say: "You were close to too many people. I couldn't beat that later." },
    ] },
    { id: 'visit.talk.answers.12', turns: [
      { by: 'a', say: "Did you even think about it, or was it easy?" },
      { by: 'b', say: "It was the hardest thing I've done in here." },
      { by: 'a', say: "Good. It should have been." },
    ] },
    { id: 'visit.talk.answers.13', turns: [
      { by: 'a', say: "You were so sweet to me in every chat." },
      { by: 'b', say: "I meant all of it. This part was the game." },
      { by: 'a', say: "Yeah, well. The game feels pretty mean right now." },
    ], beat: '{a} sits down without taking {a.posAdj} eyes off {b}.' },
    { id: 'visit.talk.answers.14', turns: [
      { by: 'a', say: "I would have kept you safe. You know that, right?" },
      { by: 'b', say: "I know. That's what makes this so bad." },
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
    { id: 'report.04', turns: [
      { by: 'a', say: "The blocked can't argue. That's the beauty of it.", send: "Okay so my visit said something I can't stop thinking about" },
      { by: 'b', send: "Now you HAVE to tell me" },
      { by: 'a', send: "They said {c} was the one pushing hardest to get you out" },
      { by: 'b', react: "{c}? Of all people? Wow.", send: "That actually makes so much sense" },
    ] },
    { id: 'report.05', turns: [
      { by: 'a', send: "Sitting across from someone who just got blocked teaches you things {e:think}" },
      { by: 'b', send: "Like what?" },
      { by: 'a', send: "Like who's been two-faced this whole time. It's {c}. Be careful" },
      { by: 'b', react: "I defended {c} in the group chat. Great. Love that for me." },
    ], beat: '{a} leans back and watches the typing dots.' },
    { id: 'report.06', turns: [
      { by: 'a', say: "Say it like you don't want to say it. That's how people believe you.", send: "I wasn't going to say anything but it's been eating at me" },
      { by: 'b', send: "Say it. Please" },
      { by: 'a', send: "My visit named {c}. Said {c} rates you low every time" },
      { by: 'b', react: "Every time?", send: "That's so messed up {e:broken}" },
    ] },
    { id: 'report.07', turns: [
      { by: 'a', send: "Real question. How close are you and {c}?" },
      { by: 'b', send: "Close?? Why" },
      { by: 'a', send: "Because the person who visited me did NOT think so. Just saying {e:eyes}" },
      { by: 'b', react: "Oh no. Oh, I don't like that." },
      { by: 'a', say: "Planted. Now let it grow." },
    ] },
    { id: 'report.08', turns: [
      { by: 'a', say: "Nobody can check this. Nobody.", send: "My visit was wild. I found out a LOT" },
      { by: 'b', send: "Spill {e:eyes}" },
      { by: 'a', send: "{c} has been playing you. That came straight from the source" },
      { by: 'b', send: "Thank you for telling me. Seriously" },
    ], beat: '{a} closes the chat and stretches like a cat in the sun.' },
    { id: 'report.09', turns: [
      { by: 'a', send: "I owe you this. My visit warned me about {c}. Warned me about {c} and YOU" },
      { by: 'b', react: "Me? What did I do?" },
      { by: 'a', send: "Nothing. {c} just wants us both gone. So we stick together" },
      { by: 'b', send: "Deal. We stick together {e:handshake}" },
    ] },
    { id: 'report.10', turns: [
      { by: 'a', say: "Half true is still true. Sort of.", send: "Okay I'm only telling you because I trust you" },
      { by: 'b', send: "You can trust me. Go" },
      { by: 'a', send: "The person who knocked on my door said {c} is the snake in here {e:snake}" },
      { by: 'b', react: "A snake. In the Circle. What a shock." },
    ] },
    { id: 'report.11', turns: [
      { by: 'a', send: "Don't freak out but my visit mentioned you" },
      { by: 'b', send: "I'm already freaking out" },
      { by: 'a', send: "Only because {c} has been saying stuff about you. Behind your back" },
      { by: 'b', react: "Behind my back. In a building where nobody has a back to go behind." },
    ] },
    { id: 'report.12', turns: [
      { by: 'a', say: "One message and {c} is done with {b}. Let's go.", send: "Hey. Something from my visit you should know" },
      { by: 'b', send: "Uh oh. Okay" },
      { by: 'a', send: "{c} isn't who you think. My visit made that really clear" },
      { by: 'b', send: "I had a feeling honestly {e:grimace}" },
    ] },
  ],
};
