// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-exile.js — the Exile Duel, as the people in it talk
// ══════════════════════════════════════════════════════════════════════
//
// td/story/twist.js writeExile and director.js duelReturn:
//   exile.sent.foe / .friend   the night a goes to Exile instead of home, at the table: a says what
//                              they'll do with it; b answers ('foe': wrote a's name, likes a least;
//                              'friend': a's closest friend there). b may be missing.
//   exile.faceoff.rivals / .friends / .strangers
//                              duel night, before it: a (just voted out) and b (back from Exile).
//                              Nobody knows who wins.
//   exile.back.exiled / .survived
//                              the morning after: a won the duel and walks into camp ('exiled': a
//                              was the one waiting on Exile; 'survived': a was voted out last night
//                              and won it back). b wrote a's name (may be missing); c is a's friend
//                              (may be missing). {other} lost the duel and is gone.
// Ids: 'nex.'.

export default {
  'exile.sent.foe': [
    { id: 'nex.s1', turns: [
      { by: 'a', say: "Enjoy it while it lasts, {b}, because I'm coming back." },
      { by: 'b', say: "Good luck with that." },
      { by: 'a', say: "I won't need luck. I'll have all those days out there thinking about you." },
      { by: 'b', say: "That's a little creepy, honestly." },
      { by: 'a', say: "It's meant to be. Keep my spot warm." },
      { by: 'a', conf: "They think they got rid of me, but all they did was give me time to get angry." },
    ] },
    { id: 'nex.s2', when: { voice: ['tough', 'competitive', 'loud', 'proud'] }, turns: [
      { by: 'a', say: "Whoever's next, I hope it's you, {b}. I really do." },
      { by: 'b', say: "It won't be." },
      { by: 'a', say: "We'll see. You've got a lot of friends right now. Friends change." },
      { by: 'b', say: "Is that supposed to scare me?" },
      { by: 'a', say: "It's supposed to give you something to think about while I'm gone." },
      { by: 'b', conf: "{a} looked right at me when {a.sub} said that, and honestly, I'm a little nervous now." },
    ] },
    { id: 'nex.s3', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [
      { by: 'a', say: "Thanks for the vacation, everybody. I'll see one of you soon." },
      { by: 'b', move: 'dismiss' },
      { by: 'a', say: "Don't look so relieved, {b}. You wrote my name, and I can count." },
      { by: 'b', say: "Lots of people wrote your name." },
      { by: 'a', say: "And I'll remember every one of them. You're just the one I'm looking at." },
      { by: 'a', conf: "I'm going to sit on that island and think about every single person who wrote my name, and one of them is going to have to come and face me." },
    ] },
    { id: 'nex.s4', when: { voice: ['emotional', 'warm', 'earnest'] }, turns: [
      { by: 'a', say: "I can't believe you did that, {b}. I really thought we were okay." },
      { by: 'b', say: "It wasn't personal." },
      { by: 'a', say: "It's always personal. You looked me in the eye this morning and told me I was safe." },
      { by: 'b', say: "I thought you were. Things changed fast." },
      { by: 'a', say: "Then I hope things change fast for you too." },
      { by: 'a', conf: "I'm hurt, I'm really hurt, but I'm not done, and I'm going to fight my way back in." },
    ] },
  ],
  'exile.sent.friend': [
    { id: 'nex.f1', turns: [
      { by: 'b', say: "Win it, okay? Win it and come back." },
      { by: 'a', say: "I'm going to. Just stay alive until I'm back." },
      { by: 'b', say: "Easy for you to say. You're the only one in there who talks to me." },
      { by: 'a', say: "Then keep your head down, keep your mouth shut, and don't let anybody near your name." },
      { by: 'b', say: "That sounds like a terrible few days." },
      { by: 'a', say: "It'll be a short few days. I promise." },
      { by: 'a', conf: "I've got one friend left in there, and I'm going to win this duel for both of us." },
    ] },
    { id: 'nex.f2', when: { voice: ['emotional', 'warm', 'earnest', 'anxious'] }, turns: [
      { beat: "{a} hugs {b} for a long time before following {host}'s crew out." },
      { by: 'a', say: "Don't let them get you while I'm gone." },
      { by: 'b', say: "I won't. You just come back." },
      { by: 'a', say: "Save me a spot by the fire, okay? The good one." },
      { by: 'b', say: "Nobody's sitting there until you're back. I'll fight them for it." },
      { by: 'a', say: "You'd lose." },
      { by: 'b', say: "I'd lose, but I'd fight them." },
      { by: 'b', conf: "Watching {a} walk away like that was horrible, but at least it's not goodbye, not yet." },
    ] },
    { id: 'nex.f3', turns: [
      { by: 'a', conf: "I'm not going home, I'm going to Exile, and that's not the same thing at all." },
      { by: 'a', conf: "Whoever they vote out next has to go through me, and I'm going to be ready.", v: { anxious: "Whoever they vote out next has to go through me, and I really, really hope I'm ready.", competitive: "Whoever's next, I hope they're good, because I'm going to be better." } },
    ] },
  ],
  'exile.faceoff.rivals': [
    { id: 'nex.r1', turns: [
      { by: 'b', say: "Of course it's you. I was hoping it would be you." },
      { by: 'a', say: "Good, because I've wanted to beat you since day one." },
      { by: 'b', say: "You've had plenty of chances, and you haven't managed it once." },
      { by: 'a', say: "Everything before tonight was practice." },
      { by: 'b', say: "Then let's go." },
      { by: 'a', conf: "Out of everybody they could have sent me to face, it had to be {b}, and honestly? I wouldn't want anybody else." },
    ] },
    { id: 'nex.r2', when: { voice: ['loud', 'tough', 'competitive', 'proud'] }, turns: [
      { by: 'a', say: "One of us is leaving tonight, and it's not going to be me." },
      { by: 'b', say: "You said that at tribal too. How did that go?" },
      { by: 'a', say: "Keep talking. It makes this even better." },
      { by: 'b', say: "I'll keep talking all the way to the finish, and then some." },
      { by: 'a', say: "Then save your breath. You're going to need it." },
      { by: 'b', conf: "{a} has hated me this whole game, so beating {a.obj} tonight is going to feel amazing." },
    ] },
    { id: 'nex.r3', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [
      { by: 'b', say: "I'd say it's nice to see you, but it really isn't." },
      { by: 'a', say: "Same. Let's just get this over with." },
      { by: 'b', say: "In a hurry? You've only just got here." },
      { by: 'a', say: "I've seen enough of this island already, and enough of you." },
      { by: 'b', say: "You'll have plenty more time to see it, after tonight." },
      { by: 'b', conf: "I've had days on this island to think about this. {a} had about ten minutes." },
    ] },
  ],
  'exile.faceoff.friends': [
    { id: 'nex.p1', turns: [
      { by: 'a', say: "Oh no. Not you. Anybody but you.", v: { emotional: "No, no, not you, this isn't fair!", dry: "Oh, great. They sent me to fight my friend. Love that." } },
      { by: 'b', say: "I know. I'm sorry." },
      { by: 'a', say: "Don't be sorry. Just... let's do our best, okay?" },
      { by: 'b', say: "Okay. No hard feelings, whatever happens." },
      { by: 'a', conf: "I'd beat anybody else in that game without even thinking about it, but {b}? This is going to hurt either way." },
    ] },
    { id: 'nex.p2', when: { voice: ['competitive', 'tough', 'proud'] }, turns: [
      { by: 'b', say: "I'm not going to go easy on you." },
      { by: 'a', say: "I'd be mad if you did." },
      { by: 'b', say: "Whoever wins, they get back in there and finish what we started." },
      { by: 'a', say: "Deal." },
    ] },
  ],
  'exile.faceoff.strangers': [
    { id: 'nex.n1', turns: [
      { by: 'b', say: "So you're the one they sent me.", v: { dry: "So you're my opponent. They could've sent worse, I guess.", loud: "Oh, it's YOU! Okay, okay, let's do this!" } },
      { by: 'a', say: "Yeah, lucky me." },
      { by: 'b', say: "Nothing personal. I just really want to get back in there." },
      { by: 'a', say: "So do I." },
      { by: 'a', conf: "I barely know {b}. That makes this easier, because I don't care at all what happens to {b} after tonight." },
    ] },
    { id: 'nex.n2', when: { voice: ['anxious', 'emotional', 'earnest'] }, turns: [
      { by: 'a', say: "I'm going to be honest, I'm terrified right now." },
      { by: 'b', say: "Don't be. It's just one challenge." },
      { by: 'a', say: "One challenge for my whole game." },
      { by: 'b', say: "And mine. We're in exactly the same place, if that helps." },
      { by: 'a', say: "It doesn't, really. But thanks for trying." },
      { by: 'b', say: "Good luck. I mean it, kind of." },
      { by: 'b', conf: "{a} is scared, and scared people make mistakes, so good." },
    ] },
    { id: 'nex.n3', turns: [
      { by: 'b', conf: "I've been alone on Exile for days, eating nothing, talking to myself, and all of it was for tonight." },
      { by: 'a', conf: "Twenty minutes ago I got voted out, and now I have one shot to undo it. I'm taking it." },
    ] },
  ],
  'exile.back.exiled': [
    { id: 'nex.b1', when: { pair: true }, turns: [
      { beat: "{a} walks back into camp. Everybody stops what they're doing." },
      { by: 'a', say: "Miss me?" },
      { by: 'b', say: "You beat {other}?" },
      { by: 'a', say: "I did, so now it's my turn to vote." },
      { by: 'b', say: "Welcome back, then. Seriously, welcome back." },
      { by: 'a', say: "Thanks. I'm sure you mean that, {b}. I'm sure you all do." },
      { beat: "{a} looks around the camp, one face at a time." },
      { by: 'b', conf: "I wrote {a}'s name to get rid of {a.obj}, and now {a}'s back, and I'm the first person {a.sub}'ll come after." },
    ] },
    { id: 'nex.b2', when: { third: true }, turns: [
      { by: 'c', say: "{a}! You made it!", v: { emotional: "{a}! Oh my god, you're back!", dry: "Well, look who couldn't stay away." } },
      { by: 'a', say: "I told you I'd come back." },
      { by: 'c', say: "What happened to {other}?" },
      { by: 'a', say: "{other} is gone. It's just me now." },
      { by: 'c', conf: "Having {a} back changes everything, because I'm not alone in here anymore." },
    ] },
    { id: 'nex.b3', turns: [
      { by: 'a', conf: "Exile was awful, the worst days of my life, and I'd do it again, because it brought me back here." },
      { by: 'a', conf: "Everybody here thinks I'm a goner. I'm going to use that.", v: { schemer: "Nobody here takes me seriously anymore, and that's going to be their mistake.", anxious: "Everybody's looking at me like I'm a ghost, and honestly, I kind of feel like one." } },
    ] },
  ],
  'exile.back.survived': [
    { id: 'nex.v1', when: { pair: true }, turns: [
      { beat: "{a} walks back into camp the morning after being voted out." },
      { by: 'b', say: "Wait, what are you doing here?" },
      { by: 'a', say: "I beat {other}, that's what I'm doing here." },
      { by: 'b', say: "Wow. Okay. That's... great. That's really great." },
      { by: 'a', say: "Is it? You looked a lot happier last night." },
      { by: 'b', say: "Last night was the game. This is... also the game, I guess." },
      { by: 'a', conf: "{b} voted me out last night, and now {b} gets to look at me every single day. I love that for {b.obj}." },
    ] },
    { id: 'nex.v2', when: { third: true }, turns: [
      { by: 'c', say: "I didn't think I'd ever see you again." },
      { by: 'a', say: "Neither did I, honestly." },
      { by: 'c', say: "So what now?" },
      { by: 'a', say: "Now we find out who voted me out, and we make sure it doesn't happen twice." },
    ] },
    { id: 'nex.v3', turns: [
      { by: 'a', conf: "Last night I got voted out, and this morning I'm back, because I beat {other} when it mattered." },
      { by: 'a', conf: "Whoever voted for me, I know about you now, and I'm not going anywhere." },
    ] },
  ],
};
