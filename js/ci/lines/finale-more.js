// ══════════════════════════════════════════════════════════════════════
// ci/lines/finale-more.js — more ways to say the finale's moments
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-04): "try to avoid repetitions a lot, we need a lot of
// variants too." Every pool here already exists (finale.js, finale-night.js,
// scenes-more.js); lines/index.js adds these entries to it. Same casts and
// rules as the pool they extend: {a.real} only in the staging or in a's own
// mouth; a reveal.suspense line never names who is coming.
const M = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.m${String(i + 1).padStart(2, '0')}`, ...x })) });
const host = (t, extra = {}) => ({ turns: [{ by: 'host', say: t }], ...extra });
const say = (t, extra = {}) => ({ turns: [{ by: 'a', say: t }], ...extra });

export const FINALE_MORE = {
  // ── The final ratings: why they put somebody first ────────────────
  ...M('final.rate.trust', [
    say("When everyone else was playing games, {b} told me the truth. First."),
    say("I'd trust {b} with my phone and every password on it. First place."),
    say("{b} kept every secret I ever told. Circle, {b} goes first."),
    say("Trust is the hardest thing to find in here. I found it with {b}. First place."),
  ]),
  ...M('final.rate.obligation', [
    say("{b} pulled me out of the bottom when nobody else would. First."),
    say("I made it to the final because of {b}. So {b} gets my top spot."),
    say("Some debts you pay back on the last day. {b}, first place."),
    say("{b} took a risk for me once. I haven't forgotten. First."),
  ]),
  ...M('final.rate.pact', [
    say("Day one, {b} and I shook hands on it. I'm not breaking that now. First."),
    say("Our alliance made it all the way. {b} gets my first place."),
    say("I promised {b} the top spot if we got here. We got here."),
    say("{b} and I said final two in our heads since the start. First place."),
  ]),
  ...M('final.rate.protection', [
    say("Every time I was in danger, {b} stepped in. First place."),
    say("{b} protected me when it could have cost them the game. That's first."),
    say("I'm still here because {b} kept me here. {b}, first."),
    say("{b} was my shield in this game. First position."),
  ]),
  ...M('final.rate.threat', [
    say("{b} played the strongest game in the building. I can't deny it. First."),
    say("I spent weeks worrying about {b}. That tells you who deserves it. First."),
    say("Love {b} or fear {b}, you can't ignore {b}. First place."),
    say("{b} was a step ahead of all of us. First position."),
  ]),
  ...M('final.rate.suspicion', [
    say("I've never been sure {b} is who they say. Still, {b} played the best. First."),
    say("Catfish or not, {b} ran this game. First place."),
    say("Something about {b} never added up. And {b} still beat everyone. First."),
    say("Whoever {b} really is, they earned it. First."),
  ]),
  ...M('final.rate.grudge', [
    say("{b} and I clashed. A lot. But I'm not petty. First place."),
    say("I don't have to like {b} to admit {b} played well. First."),
    say("Leaving the drama at the door. {b}, first position."),
    say("This one hurts a little. {b} gets my first place anyway."),
  ]),
  ...M('final.rate.deserves', [
    say("If anyone in here earned the money, it's {b}. First."),
    say("Honestly, {b} played this better than I did. First place."),
    say("{b} was kind, smart and real. That's a winner. First."),
    say("No second thoughts. {b} deserves to win The Circle."),
  ]),
  ...M('final.rate.tease', [
    say("Number one? That's for me to know and you to find out tonight."),
    say("My first place is locked in. I'm not telling a soul.", { beat: '{a} zips {a.posAdj} lips.' }),
    say("Circle, first place goes to... you know who. Shh."),
    say("I'll say this. My number one is going to be very happy tonight."),
  ]),
  ...M('final.video.friend', [
    { turns: [{ by: 'b', video: "I got blocked, but I'm still in this with you. Bring it home." }, { by: 'a', react: "{b}! I miss you so much!" }] },
    { turns: [{ by: 'b', video: "Remember everything we talked about. Now go win the whole thing." }, { by: 'a', say: "I will. I promise." }], beat: '{a} wipes {a.posAdj} eyes.' },
    { turns: [{ by: 'b', video: "I'm wearing your colors in the audience tonight. Don't let me down." }, { by: 'a', react: "Oh, I love that." }] },
    { turns: [{ by: 'b', video: "Hey, it's me! I've watched everything. You were amazing." }, { by: 'a', react: "Wait, you watched EVERYTHING?" }] },
  ]),
  ...M('final.video.home', [
    { stage: "{a}'s little cousins wave at the camera, shouting over each other.", turns: [{ by: 'a', react: "Look at them! They're so big!" }] },
    { stage: "A message from {a}'s grandmother plays on the screen.", turns: [{ by: 'a', react: "Grandma! Oh, I'm going to lose it." }], beat: '{a} presses both hands to {a.posAdj} chest.' },
    { stage: "{a}'s friends from home cheer on the screen, holding up a banner.", turns: [{ by: 'a', say: "These are my people. I'm coming home soon." }] },
    { stage: "{a}'s dog barks at the camera while someone at home laughs.", turns: [{ by: 'a', react: "My baby! Hi, baby!" }] },
  ]),

  // ── The meeting ───────────────────────────────────────────────────
  ...M('meet.arrive.real', [
    { turns: [{ by: 'b', react: "There you are!" }, { by: 'a', react: "Here I am! In real life!" }], beat: '{a} drops {a.posAdj} bag and runs in.' },
    { turns: [{ by: 'a', say: "Hello, real people!" }, { by: 'b', react: "{a}! You look exactly the same!" }] },
    { turns: [{ by: 'b', react: "Oh, it's really you." }, { by: 'a', say: "It's really me. Every picture, every message." }], beat: 'They hug and spin around.' },
    { turns: [{ by: 'a', react: "I'm shaking. I'm actually shaking." }, { by: 'b', say: "Get over here, {a}!" }] },
    { turns: [{ by: 'b', say: "I knew you'd be real. I just knew it." }, { by: 'a', react: "Real since day one, baby!" }] },
  ]),
  ...M('meet.arrive.catfish', [
    { stage: '{a.real} steps in, and nobody recognizes the face.', turns: [{ by: 'b', react: "Hi? Are you lost?" }, { by: 'a', react: "No. I'm {a}." }, { by: 'b', react: "You're WHAT?" }] },
    { stage: '{a.real} walks in with both hands up.', turns: [{ by: 'a', react: "Don't be mad! It's me. {a}." }, { by: 'b', react: "Oh my God. Oh my GOD." }] },
    { stage: '{a.real} pauses in the doorway, smiling nervously.', turns: [{ by: 'b', react: "Okay, who is this?" }, { by: 'a', react: "Hi. I'm the person you've been calling {a}." }], beat: 'Everyone in the room screams.' },
    { stage: 'The door swings open on {a.real}.', turns: [{ by: 'a', react: "So. I might not look like my pictures." }, { by: 'b', react: "Wait, are you {a}?" }, { by: 'a', react: "Guilty." }] },
    { stage: '{a.real} walks in slowly, and the room goes quiet.', turns: [{ by: 'b', react: "Hi. Can I help you?" }, { by: 'a', react: "It's {a}. Surprise." }] },
  ]),
  ...M('meet.found', [
    { stage: '{a.real} walks in and finds {b.real} on the couch.', turns: [{ by: 'a', react: "Hi! Sorry, I'm looking for {b}." }, { by: 'b', react: "You found {b}." }, { by: 'a', react: "Shut UP." }] },
    { stage: '{b.real} jumps up as the door opens.', turns: [{ by: 'b', react: "Okay, before you scream, it's me. {b}." }, { by: 'a', react: "I'm screaming anyway!" }] },
    { stage: '{b.real} gives a small wave to {a.real}.', turns: [{ by: 'a', react: "And you are?" }, { by: 'b', react: "{b}. Hi." }], beat: '{a} has to hold on to the doorframe.' },
  ]),
  ...M('meet.both', [
    { stage: '{a.real} walks in, and {b.real} bursts out laughing.', turns: [{ by: 'b', react: "Oh no. You too?" }, { by: 'a', react: "Me too. Hi, {b}." }] },
    { stage: '{b.real} and {a.real} point at each other at the same time.', turns: [{ by: 'a', react: "You're not {b}!" }, { by: 'b', react: "And you're not {a}!" }], beat: 'They fall onto the couch laughing.' },
    { stage: '{a.real} walks in to find {b.real} waiting.', turns: [{ by: 'b', react: "Well, this is awkward." }, { by: 'a', react: "Two catfish, one room. Amazing." }] },
  ]),
  ...M('meet.explain.strategic', [
    { turns: [{ by: 'a', say: "I'm {a.real}. I picked a face I thought people would trust fast." }, { by: 'b', say: "It worked on me, that's for sure." }] },
    { turns: [{ by: 'b', say: "So it was all a strategy." }, { by: 'a', say: "The profile was. The friendships weren't." }] },
    { turns: [{ by: 'a', say: "My name is {a.real}. I came here to win, and {a} was my best shot." }, { by: 'b', react: "I respect it. I hate it, but I respect it." }] },
    { turns: [{ by: 'a', say: "I'm {a.real}. Honestly, I didn't think anyone would believe me as myself." }, { by: 'b', say: "We'd have believed you." }] },
  ]),
  ...M('meet.explain.protective', [
    { turns: [{ by: 'a', say: "I'm {a.real}. People always judge me on how I look. I wanted one game where they couldn't." }, { by: 'b', say: "That makes so much sense." }] },
    { turns: [{ by: 'b', say: "Why hide?" }, { by: 'a', say: "Because out here, people stop listening before I finish a sentence." }], beat: '{b} squeezes {a}’s hand.' },
    { turns: [{ by: 'a', say: "My name is {a.real}. I needed you to know my heart before you saw my face." }, { by: 'b', say: "And I love your heart." }] },
    { turns: [{ by: 'a', say: "I'm {a.real}. I've been underestimated my whole life. Not in here." }, { by: 'b', react: "Not anymore, either." }] },
  ]),
  ...M('meet.explain.experimental', [
    { turns: [{ by: 'a', say: "I'm {a.real}. I wanted to know what it's like to be somebody else for a while." }, { by: 'b', say: "And what was it like?" }, { by: 'a', say: "Easier. That's the sad part." }] },
    { turns: [{ by: 'b', say: "So you were testing us." }, { by: 'a', say: "A little. You all passed, mostly." }] },
    { turns: [{ by: 'a', say: "My name is {a.real}. I wanted to see how far a different face would take me." }, { by: 'b', say: "All the way to the final, apparently." }] },
    { turns: [{ by: 'a', say: "I'm {a.real}. I was curious if people would be kinder to {a}." }, { by: 'b', say: "And were we?" }, { by: 'a', say: "Much kinder. We need to talk about that." }] },
  ]),
  ...M('meet.explain.family', [
    { turns: [{ by: 'a', say: "I'm {a.real}. Those are pictures of someone in my family. I wanted to make them proud." }, { by: 'b', react: "That's so sweet." }] },
    { turns: [{ by: 'b', say: "So whose face is it?" }, { by: 'a', say: "Someone I grew up with. I know how they talk, how they joke. So I played them." }] },
    { turns: [{ by: 'a', say: "My name is {a.real}. I played as someone I love, and I tried to do them justice." }, { by: 'b', say: "You did. Trust me." }] },
  ]),
  ...M('meet.explain.family.kin', [
    { turns: [{ by: 'a', say: "I'm {a.real}. That's my {q} in the pictures. My {q} is going to be so famous now." }, { by: 'b', react: "Your {q}!" }] },
    { turns: [{ by: 'b', say: "Who is that in your profile?" }, { by: 'a', say: "My {q}. I know my {q} better than anybody, so I played as them." }] },
    { turns: [{ by: 'a', say: "My name is {a.real}, and that face belongs to my {q}." }, { by: 'b', react: "Oh my God, that's adorable." }] },
  ]),
  ...M('meet.settle', [
    { turns: [{ by: 'a', say: "Okay, everybody stop looking at me. I'm sweating." }, { by: 'b', say: "We're all sweating." }] },
    { turns: [{ by: 'a', react: "Can I touch your face? Just to check it's real?" }, { by: 'b', react: "Go ahead." }], beat: 'Everyone laughs.' },
    { turns: [{ by: 'a', say: "I've hugged more people in five minutes than in five weeks." }, { by: 'b', say: "Get used to it." }] },
    { turns: [{ by: 'b', say: "Sit next to me. I've been saving you a spot for weeks." }, { by: 'a', react: "Literally weeks!" }] },
  ]),
  ...M('meet.talk.knewit', [
    { turns: [{ by: 'a', say: "You used the same joke three times. That's when I knew." }, { by: 'b', react: "Seriously? That's what did it?" }, { by: 'a', say: "That's what did it." }] },
    { turns: [{ by: 'b', say: "How did you know?" }, { by: 'a', say: "Your pictures were too perfect. Nobody's that perfect." }] },
  ]),
  ...M('meet.talk.wrongsuspect', [
    { turns: [{ by: 'a', say: "I told people you were fake. I'm so embarrassed." }, { by: 'b', say: "Good. You should be." }], beat: 'They both start laughing.' },
    { turns: [{ by: 'b', say: "Real. Hundred percent. Want to see my ID?" }, { by: 'a', react: "No! I believe you! I'm sorry!" }] },
  ]),
  ...M('meet.talk.flirt.spark', [
    { turns: [{ by: 'a', say: "Okay, the voice. Nobody told me about the voice." }, { by: 'b', say: "Is that a good thing?" }, { by: 'a', say: "A very good thing." }] },
    { turns: [{ by: 'b', say: "We have a date. You promised in the chat." }, { by: 'a', say: "I keep my promises." }], beat: 'The others start whistling.' },
  ]),
  ...M('meet.talk.flirt.awkward', [
    { turns: [{ by: 'a', say: "Hi. So. Wow. Okay." }, { by: 'b', say: "Yeah. Wow. Okay." }], beat: 'Nobody knows what to do with their hands.' },
    { turns: [{ by: 'b', say: "You were a lot smoother in the messages." }, { by: 'a', say: "I had time to edit in the messages." }] },
  ]),
  ...M('meet.talk.rival.clear', [
    { turns: [{ by: 'b', say: "Honestly? You're way nicer in person." }, { by: 'a', say: "So are you. Weird, right?" }] },
    { turns: [{ by: 'a', say: "Let's start over. Hi, nice to meet you." }, { by: 'b', say: "Nice to meet you too." }], beat: 'They shake hands, laughing.' },
  ]),
  ...M('meet.talk.rival.clash', [
    { turns: [{ by: 'b', say: "Still not a fan." }, { by: 'a', say: "Still don't care." }], beat: 'The rest of the room pretends not to listen.' },
    { turns: [{ by: 'a', say: "I'm going to be polite for the cameras." }, { by: 'b', say: "That'll be a first." }] },
  ]),
  ...M('meet.talk.ally', [
    { turns: [{ by: 'a', say: "Every chat with you was the best part of my day." }, { by: 'b', say: "Same. Every single one." }] },
  ]),
  ...M('meet.talk.kin', [
    { turns: [{ by: 'a', say: "I could not stop thinking about you down the hall." }, { by: 'b', say: "And now we never have to text again." }] },
  ]),
  ...M('meet.talk.kin.tense.thaw', [
    { turns: [{ by: 'a', say: "I'm glad you're here. I didn't think I'd say that." }, { by: 'b', say: "Me neither." }] },
    { turns: [{ by: 'b', say: "Truce? For tonight?" }, { by: 'a', say: "Truce. Maybe longer." }] },
    { turns: [{ by: 'a', react: "Come here." }], beat: '{a} hugs {b}, and neither of them lets go first.' },
  ]),
  ...M('meet.talk.kin.tense.cold', [
    { turns: [{ by: 'b', say: "Hi." }, { by: 'a', say: "Hi." }], beat: 'That is the whole conversation.' },
    { turns: [{ by: 'a', say: "Can we not do this right now?" }, { by: 'b', say: "Fine by me." }] },
    { turns: [{ by: 'b', say: "You haven't changed." }, { by: 'a', say: "Neither have you." }] },
  ]),
  ...M('meet.all', [
    { turns: [{ by: 'a', say: "Group photo! Real faces only!" }, { by: 'b', react: "Wait, I need to fix my hair!" }, { by: 'c', say: "No time! Everybody squeeze in!" }] },
    { turns: [{ by: 'b', say: "I want to say something. Every one of you made this the best experience of my life." }, { by: 'a', react: "Stop, you'll make me cry." }, { by: 'c', react: "Too late." }] },
    { turns: [{ by: 'c', say: "Okay, everyone say one thing they lied about." }, { by: 'a', react: "Absolutely not!" }], beat: 'The whole room bursts out laughing.' },
    { turns: [{ by: 'a', say: "Whoever wins tonight, we're all going on vacation together." }, { by: 'b', react: "Deal!" }, { by: 'c', react: "Deal!" }], beat: 'They pile onto the couch together.' },
  ]),

  // ── Finale night ──────────────────────────────────────────────────
  ...M('reveal.board', [
    host("Finalists, these ratings were made by all of you. Let's see how you rated each other."),
    host("The final board is ready. We'll start at the bottom."),
    host("Here we go. One last time, the ratings."),
    host("The Circle has counted every last rating. Let's begin."),
  ]),
  ...M('reveal.open', [
    host("Good evening and welcome to the finale. Somebody walks out of here a winner tonight."),
    host("It's finale night, everybody! Let's get straight to it."),
    host("Welcome to the last night of The Circle. Finalists, are you ready?"),
  ]),
  ...M('reveal.suspense', [
    host("Okay. Deep breath, everyone. The next name is..."),
    host("Coming in next..."),
    host("The Player in this spot is..."),
    host("Here we go. Next on the board..."),
    host("I'm going to make you wait for this one."),
  ]),
  ...M('reveal.place', [
    { turns: [{ by: 'host', say: "{a.aka}, you finished in {x} place." }] },
    { turns: [{ by: 'host', say: "In {x} place, it's {a.aka}!" }] },
    { turns: [{ by: 'host', say: "{x} place goes to {a.aka}." }] },
    { turns: [{ by: 'host', say: "Finishing {x}, {a.aka}." }] },
  ]),
  ...M('reveal.react.proud', [
    { turns: [{ by: 'a', say: "I'm proud of that. Really proud." }], beat: '{a} nods and smiles at the others.' },
    { turns: [{ by: 'a', say: "I made it this far with my heart on my sleeve. That's enough for me." }] },
    { turns: [{ by: 'a', react: "Okay! I can live with that!" }], beat: 'The audience applauds.' },
  ]),
  ...M('reveal.react.surprised', [
    { turns: [{ by: 'a', react: "Me? Over all of them?" }], beat: '{a} covers {a.posAdj} mouth.' },
    { turns: [{ by: 'a', say: "I honestly didn't know you all felt that way. Thank you." }] },
    { turns: [{ by: 'a', react: "Wait, that can't be right!" }, { by: 'a', say: "Okay, I'll take it. I'll take it!" }] },
  ]),
  ...M('reveal.react.gutted', [
    { turns: [{ by: 'a', say: "I gave everything in there. I'm still proud. It just hurts a bit." }] },
    { turns: [{ by: 'a', react: "Wow. Okay." }], beat: '{a} takes a long breath and claps for the others anyway.' },
    { turns: [{ by: 'a', say: "I thought more of you were with me. I guess not." }] },
  ]),
  ...M('reveal.react.shocked', [
    { turns: [{ by: 'a', say: "You knew I lied about my face, and you still put me there. Thank you." }] },
    { turns: [{ by: 'a', react: "I'm a catfish! You rated a catfish that high!" }], beat: 'The whole room laughs.' },
    { turns: [{ by: 'a', say: "I was so scared to walk in today. I didn't need to be." }] },
    { turns: [{ by: 'a', react: "Oh, I'm going to cry." }, { by: 'a', say: "You guys saw the real me after all." }] },
  ]),
  ...M('reveal.witness.smirk', [
    { turns: [{ by: 'a', say: "No comment. None." }], beat: '{a} smiles into {a.posAdj} glass.' },
    { turns: [{ by: 'a', react: "Interesting." }], beat: '{a} raises an eyebrow at {b}.' },
    { turns: [{ by: 'a', say: "Sometimes the Circle gets it right." }] },
  ]),
  ...M('reveal.witness.cheer', [
    { turns: [{ by: 'a', react: "Yes! Yes! That's my friend!" }], beat: '{a} jumps out of {a.posAdj} seat.' },
    { turns: [{ by: 'a', say: "{b}, I'm so happy for you." }] },
    { turns: [{ by: 'a', react: "Woo! Go, {b}!" }], beat: '{a} claps the loudest.' },
  ]),
  ...M('reveal.final2', [
    { turns: [{ by: 'host', say: "{a}, {b}. You're the last two standing." }, { by: 'b', react: "Oh, I'm going to faint." }], beat: '{a} and {b} grab each other’s hands.' },
    { turns: [{ by: 'host', say: "Only {a} and {b} are left. In second place..." }], beat: 'The room goes completely silent.' },
    { turns: [{ by: 'host', say: "{a} and {b}, whatever happens next, you should both be proud." }, { by: 'a', react: "Just say it!" }] },
    { turns: [{ by: 'host', say: "The final two. {a}. {b}. One of you is about to change your life." }], beat: 'The audience holds its breath.' },
  ]),
  ...M('reveal.react.second', [
    { turns: [{ by: 'a', say: "{b} deserves it. I mean that." }], beat: '{a} is the first to hug {b}.' },
    { turns: [{ by: 'a', react: "Oh, so close!" }, { by: 'a', say: "Go, {b}! You earned it!" }] },
    { turns: [{ by: 'a', say: "Second place in The Circle. My family is going to frame that." }] },
    { turns: [{ by: 'a', say: "I'm not even sad. If I lose, I want to lose to {b}." }] },
  ]),
  ...M('reveal.react.win', [
    { turns: [{ by: 'a', react: "WHAT? What? WHAT?" }], beat: '{a} spins around, hands on {a.posAdj} head.' },
    { turns: [{ by: 'a', react: "Oh my God. Oh my God. Oh my God." }], beat: 'Confetti lands in {a.posAdj} hair.' },
    { turns: [{ by: 'a', react: "Somebody pinch me!" }], beat: 'Everyone piles on top of {a}.' },
    { turns: [{ by: 'a', react: "I can't feel my legs!" }], beat: '{a} sinks back onto the couch, laughing and crying.' },
  ]),
  ...M('reveal.speech', [
    { turns: [{ by: 'a', say: "I walked in here knowing nobody. I'm walking out with a family." }, { by: 'a', say: "{b}, you were with me every single day. Thank you." }, { by: 'a', say: "And thank you, Circle. I'll miss talking to my TV." }] },
    { turns: [{ by: 'a', say: "I always thought nice people finish last. Not tonight." }, { by: 'a', say: "{b}, this is for you too. You believed in me first." }] },
    { turns: [{ by: 'a', say: "I'm going to cry the whole way through this. Sorry." }, { by: 'a', say: "Mom, Dad, everybody at home: we did it." }, { by: 'a', say: "And {b}. I love you. That's it. That's the speech." }] },
    { turns: [{ by: 'a', say: "I played it real, and real won. That means so much to me." }, { by: 'a', say: "{b}, thank you for being my person in there." }] },
  ]),
  ...M('reveal.speech.catfish', [
    { turns: [{ by: 'a', say: "My name is {a.real}. You voted for {a}, but every word came from me." }, { by: 'a', say: "{b}, you're the reason I kept going. Thank you." }] },
    { turns: [{ by: 'a', say: "I was so scared you'd hate the real me. Thank you for proving me wrong." }, { by: 'a', say: "{b}, I'm sorry I couldn't tell you sooner. This is for you too." }] },
    { turns: [{ by: 'a', say: "I'm {a.real}. Tonight I learned people care about who you are, not what you look like." }, { by: 'a', say: "{b}, thank you for being my friend, whatever face I had." }] },
  ]),
  ...M('reveal.fan', [
    { turns: [{ by: 'host', say: "America has voted for its favorite Player, and it's {a}!" }, { by: 'a', react: "No way! Thank you, America!" }] },
    { turns: [{ by: 'host', say: "The fans at home fell in love with one Player this season. {a}, you're the Fan Favorite!" }, { by: 'a', react: "I'm going to cry again!" }] },
    { turns: [{ by: 'host', say: "And the Fan Favorite, chosen by you at home, is {a}!" }, { by: 'a', say: "This means everything. Thank you." }], beat: 'Everyone stands and cheers for {a}.' },
  ]),
  ...M('reveal.winner', [
    { turns: [{ by: 'host', say: "The winner of The Circle is... {a.aka}!" }], beat: 'The whole studio explodes.' },
    { turns: [{ by: 'host', say: "Taking home the prize tonight is {a.aka}!" }], beat: 'Confetti rains down on the couch.' },
    { turns: [{ by: 'host', say: "In first place, and the winner of The Circle... {a.aka}!" }], beat: 'The audience jumps to its feet.' },
  ]),
  ...M('reunion.enter.one', [
    { turns: [{ by: 'host', say: "Finalists, one blocked Player is here tonight. Welcome back, {a}!" }, { by: 'a', say: "Miss me?" }] },
    { turns: [{ by: 'c', react: "Is that {a}? It's {a}!" }, { by: 'a', react: "It's me!" }], beat: '{a} waves on the way in.' },
    { turns: [{ by: 'a', say: "I got blocked, but I didn't miss a thing." }, { by: 'c', react: "Get over here!" }], beat: '{a} walks in to a big cheer.' },
  ]),
};
