// The big moments, in full (Plan 3a+ Task 11). Data only.
// circle.more — a, b, c keep the Circle Chat going; circle.react — a, in the
// apartment, reacts to what b posted. ratings.done / ratings.wait — a has
// sent a ranking / waits for the results. final.open / final.done — the last
// ratings. block.wait — a, at risk, waits for the name; block.typing — a,
// an Influencer, about to type c's name. visit.talk2.<motive> — the visit
// goes on (a visitor, b visited); visit.after — a (visited) after b leaves.
// goodbye.after — a, a friend of b, after b's video. meet.first — a, first
// into the studio; meet.react — a, already there, as b walks in. party.* —
// a dancing alone; a's party photo, liked by b and {n} in all; a and b
// flirting; a and b joking; a at the end of the night.
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const s1 = (a, extra = {}) => ({ turns: [{ by: 'a', say: a }], ...extra });
const r1 = (a, extra = {}) => ({ turns: [{ by: 'a', react: a }], ...extra });
const talk = (a, b, extra = {}) => ({ turns: [{ by: 'a', say: a }, { by: 'b', say: b }], ...extra });

export const SCENES_MORE = {
  ...E('circle.more', [
    { turns: [{ by: 'a', send: "Okay but who's cooking tonight because it's not me lol" }, { by: 'b', send: "Cereal for dinner gang {e:laugh}" }, { by: 'c', send: "Cereal gang represent" }] },
    { turns: [{ by: 'a', send: "Real talk, how is everybody holding up?" }, { by: 'b', send: "Surviving. Barely. Lol" }, { by: 'c', send: "Thriving honestly {e:sparkle}" }] },
    { turns: [{ by: 'a', send: "Shoutout to everybody still in here. We made it this far {e:clap}" }, { by: 'b', send: "{t:CircleFam} forever" }, { by: 'c', send: "Group hug {e:hug}" }], when: { early: false } },
    { turns: [{ by: 'a', send: "Can we play a game in here? Two truths and a lie. Go" }, { by: 'b', send: "I've never been on a plane, I love pineapple on pizza, I can juggle" }, { by: 'c', send: "The plane one is the lie. Easy" }], beat: '{b} laughs at the screen and does not confirm it.' },
    { turns: [{ by: 'a', send: "Is it just me or is today dragging" }, { by: 'b', send: "Dragging so hard {e:sweat}" }, { by: 'c', send: "Speak for yourselves, I had a nap {e:cool}" }] },
    { turns: [{ by: 'a', send: "What's everybody wearing right now, be honest" }, { by: 'b', send: "Sweatpants. Always sweatpants" }, { by: 'c', send: "Full outfit. I don't know why. Nobody can see me" }] },
    { turns: [{ by: 'a', send: "Who else has been talking to their plants in here lol" }, { by: 'b', send: "Mine has a name now" }, { by: 'c', send: "I'm scared to ask what it's called {e:laugh}" }] },
  ]),
  ...E('circle.react', [
    r1("Of course {b} said that. Of course."),
    r1("I did not expect that from {b}."),
    r1("Okay, {b} is trying way too hard today."),
    r1("I love {b}'s energy in the group chat.", { when: { friends: true } }),
    r1("Every time {b} posts, I roll my eyes. Every time.", { when: { rivals: true } }),
    r1("Hm. {b} is being extra nice today. Why?"),
    r1("{b} always has something to say in there."),
    r1("I'm not saying anything in there. I'm just watching."),
    r1("That's the most {b} message I've ever read."),
  ]),
  ...E('ratings.done', [
    s1("Okay. That's done. I feel sick."),
    s1("Rankings sent. No take-backs. Oh God."),
    s1("I just ranked real people like a list of pizza toppings. What is this place?"),
    s1("Done. Now I wait. I hate waiting.", { beat: '{a} lies on the floor and stares at the ceiling.' }),
    s1("I went with my heart. I hope my heart knows what it's doing."),
    s1("I went with my head. My heart is gonna be mad at me."),
  ]),
  ...E('ratings.wait', [
    r1("'The results are in.' Oh no. Oh no, no, no."),
    r1("Please don't be last. Please don't be last."),
    r1("I can't look. Circle, I can't look. Show me anyway."),
    r1("My heart is beating so fast right now.", { beat: '{a} holds a pillow over {a.posAdj} face.' }),
    r1("This is the worst part. The waiting is the worst part."),
    r1("Whatever it is, it is. Okay. Okay. Show me."),
  ]),
  ...E('final.open', [
    r1("'For the last time, you must rate your fellow Players.' The last time. Wow."),
    r1("This is it. The final ratings. Whoever I put first, I'm saying they deserve to win."),
    s1("Do I rate with my heart or with my head? It's the last one. Heart."),
    r1("Final ratings. I can't believe we made it here."),
    s1("No more strategy. Just who deserves it."),
  ]),
  ...E('final.done', [
    s1("That's it. That was my last rating ever."),
    s1("I'm at peace with it. Whatever happens, happens."),
    s1("I just helped decide who wins this whole thing. That's crazy."),
    s1("Done. Now there's nothing left to do but wait.", { beat: '{a} sits on the edge of the couch with both hands over {a.posAdj} mouth.' }),
    s1("I hope they rated me the way I rated them."),
  ]),
  ...E('block.wait', [
    r1("Please don't be me. Please don't be me."),
    r1("Why are they typing so slow? Just say it!"),
    r1("If it's me, it's me. I played my game.", { beat: '{a} holds very still.' }),
    r1("I'm shaking. I'm actually shaking."),
    r1("Dot, dot, dot? Why the dots? Who taught them the dots?"),
    r1("I can't breathe until I see the name."),
    r1("It's me. I know it's me. It's not me. It's me."),
    r1("Just type it. Just type the name."),
  ]),
  ...E('block.typing', [
    s1("Here we go. Every word of this counts."),
    s1("I'm about to change somebody's life. That's heavy."),
    s1("Make it quick. Make it kind. Get it over with."),
    s1("I'm gonna make them wait. Just a little. Dot, dot, dot."),
    s1("I wish it wasn't {c}. It has to be {c}."),
    s1("Deep breath. Circle, message."),
  ]),
  ...E('visit.talk2.friend', [
    talk("I'm gonna miss our chats.", "Me too. Nobody else in here gets me like you do."),
    talk("You're really like this in real life. That's the best part.", "What you see is what you get."),
    talk("Stay true to yourself in there, okay?", "I will. I'll do it for both of us."),
    talk("Can I tell you who to watch out for?", "Please. Tell me everything."),
  ]),
  ...E('visit.talk2.answers', [
    talk("If you could do it again, would you?", "Honestly? I don't know. Probably."),
    talk("Who else was in on it?", "It was just the two of us. I promise.", { when: { sole: false } }),
    talk("Was there anything I could have done?", "Talk to more people. That's it. That's the whole thing."),
    talk("At least you told me to my face.", "You deserved that much."),
  ]),
  ...E('visit.talk2.truth', [
    talk("Everything you told me. Was any of it real?", "The feelings were real. Everything else… mostly."),
    talk("I knew something was off. I just couldn't prove it.", "You were closer than anybody."),
    talk("Now that I know, you're even more interesting.", "Please don't tell anybody. Please."),
    talk("So what else should I know?", "That's everything. I swear."),
  ]),
  ...E('visit.talk2.apology', [
    talk("I'm sorry I wasn't straight with you.", "I appreciate you coming here to say it."),
    talk("You were one of the good ones. I should have treated you better.", "We're good. We're really good."),
    talk("I hope you win this. I mean it.", "Thank you. That means more than you know."),
    talk("Can we start over when you're out?", "We can start over right now."),
  ]),
  ...E('visit.after', [
    r1("That was so weird. I just met a real person.", { beat: '{a} sits in the quiet apartment for a long time.' }),
    s1("That changes everything. Everything."),
    s1("I can't tell anybody what just happened. Or can I?"),
    s1("I'm gonna miss {b}. I didn't expect that."),
    s1("Okay. Back to the game. The game doesn't stop."),
  ]),
  ...E('goodbye.after', [
    s1("{b} was my person in here. It's quiet without {b}."),
    s1("I'm gonna play this for {b} now."),
    s1("That video got me. I'm not gonna lie."),
    s1("{b} deserved better. I'm gonna remember who did this."),
    s1("I'll see {b} on the outside. That's what I keep telling myself."),
  ]),
  ...E('meet.first', [
    { turns: [{ by: 'a', react: "I'm the first one here. Okay. Okay. Where do I sit?" }, { by: 'a', say: "What if nobody's who they said they were?" }, { by: 'a', say: "What if I'm the only real one?" }], beat: '{a} laughs nervously, alone in the room.' },
    { turns: [{ by: 'a', react: "Hello? Oh. It's just me." }, { by: 'a', say: "Every door that opens, I'm gonna scream." }, { by: 'a', say: "Okay. Sit like a normal person. Normal." }], beat: '{a} fixes {a.posAdj} hair in the reflection of the screen.' },
    { turns: [{ by: 'a', react: "First one in. I'm so nervous I can't feel my hands." }, { by: 'a', say: "In a minute, everybody's gonna be real." }, { by: 'a', say: "What if they don't like the real me?" }], beat: '{a} sits, stands up, and sits again.' },
    { turns: [{ by: 'a', say: "I've never met any of these people. I know all of them." }, { by: 'a', say: "I know their jokes. I don't know their faces." }, { by: 'a', react: "Somebody's coming. Somebody's coming!" }], beat: '{a} jumps to {a.posAdj} feet.' },
  ]),
  ...E('meet.react', [
    r1("{b}! You're real!", { when: { catfish: false } }),
    r1("Wait. That's {b}? That's not the {b} I know.", { when: { catfish: true } }),
    r1("Get in here, {b}!"),
    r1("Oh my God, {b}. You look exactly like I pictured."),
    r1("{b}? Stop. Stop it!"),
    r1("I knew it. I knew it!", { when: { catfish: true } }),
    r1("There you are!"),
    r1("Finally. Come here."),
  ]),
  // The last Circle Chat: a finalist looks back, to the one closest to them (b).
  ...E('circle.final.look', [
    { turns: [{ by: 'a', say: "I have to say this to {b} before it's over.", send: "{b}, I don't even know what you look like and you're one of my favorite people" }, { by: 'b', send: "Stop, I'm gonna cry {e:cry}" }] },
    { turns: [{ by: 'a', send: "Shoutout to {b} for keeping me sane in here {e:heart}" }, { by: 'b', send: "Right back at you. Every single day" }] },
    { turns: [{ by: 'a', say: "Deep breath. Don't cry in the group chat.", send: "I came in here thinking I'd trust nobody. Then there was {b}" }, { by: 'b', send: "Okay now I'm crying {e:cry}" }, { by: 'a', send: "Lol same" }] },
    { turns: [{ by: 'a', send: "{b}, whatever the screen says tonight, you won me over" }, { by: 'b', send: "That means more than the money. Almost {e:laugh}" }] },
    { turns: [{ by: 'a', say: "Keep it short. Keep it real.", send: "Real ones stay till the end. {b} is a real one" }, { by: 'b', send: "{e:heart} {e:heart} {e:heart}" }] },
    { turns: [{ by: 'a', send: "Gonna miss our chats so much {b}" }, { by: 'b', send: "Who says they have to stop? {e:wink}" }, { by: 'a', send: "Okay good because I have your number now. Kind of" }] },
    { turns: [{ by: 'a', send: "{b}, thank you for being exactly who you said you were" }, { by: 'b', send: "Always. Can't wait to hug you for real" }] },
    { turns: [{ by: 'a', say: "Last chance to say it.", send: "If I win tonight, part of it is because of {b}" }, { by: 'b', send: "And if I win, you're getting a vacation lol" }, { by: 'a', send: "Holding you to that {e:laugh}" }] },
  ]),
  // A shared profile walks into the finale as two people (a is the profile,
  // b already in the room). meet.found.shared: a walks in and finds the pair
  // b waiting. meet.react.shared: a, in the room, takes it in.
  ...E('meet.arrive.shared', [
    { stage: '{a.face} walks in first. Then {a.brain} walks in right behind.', turns: [
      { by: 'face', say: "Hi! It's me. It's us." },
      { by: 'b', say: "Wait. Us? There's two of you?" },
      { by: 'brain', say: "There were always two of us." },
    ], beat: 'The room goes silent, then loud.' },
    { stage: 'The door opens, and two people step through it together.', turns: [
      { by: 'face', say: "Surprise!" },
      { by: 'b', say: "No. No way. Which one of you is {a}?" },
      { by: 'brain', say: "Both of us. That's the whole point." },
    ] },
    { stage: '{a.face} and {a.brain} come in side by side, grinning.', turns: [
      { by: 'b', say: "{a}? Is that... is that two {a}s?" },
      { by: 'face', say: "Don't be mad!" },
      { by: 'brain', say: "Be a little mad. We earned it." },
    ], beat: '{b} covers {b.posAdj} mouth with both hands.' },
    { stage: '{a.face} walks in waving. {a.brain} follows, holding the door.', turns: [
      { by: 'face', say: "Okay, before anybody says anything, we can explain." },
      { by: 'b', say: "We? What do you mean, we?" },
    ], beat: 'Everyone on the couch stands up at once.' },
  ]),
  ...E('meet.found.shared', [
    { turns: [
      { by: 'a', say: "Hi! Oh. Hi. Hi, both of you?" },
      { by: 'b', say: "Surprise. You've been talking to two people." },
    ], beat: '{a} stops dead in the doorway.' },
    { turns: [
      { by: 'a', say: "I'm looking for {b}. Which one of you is {b}?" },
      { by: 'b', say: "Yes." },
    ], beat: '{a} looks from one face to the other and bursts out laughing.' },
    { turns: [
      { by: 'a', say: "Why are there two people on the couch?" },
      { by: 'b', say: "Sit down. This is gonna take a minute." },
    ] },
  ]),
  ...E('meet.react.shared', [
    r1("Two people. The whole time. I talked to two people."),
    r1("That's why the messages were so different some days!"),
    r1("I did not see that coming. A whole extra person!"),
    r1("Okay, so which one of you was I actually talking to?"),
    r1("I'm not even mad. That's genius."),
    r1("Every late-night chat, there were two of you reading it? Oh my God."),
  ]),
  ...E('meet.explain.shared', [
    { turns: [
      { by: 'brain', say: "{a.face} is the face, I'm the brain. That was the deal." },
      { by: 'face', say: "And we fought about every single message." },
      { by: 'brain', say: "Every single one." },
    ] },
    { turns: [
      { by: 'face', say: "I wanted to send everything. {a.brain} wanted to send nothing." },
      { by: 'brain', say: "So we met in the middle. That's why we were slow." },
    ] },
    { turns: [
      { by: 'brain', say: "We figured two heads would be harder to trap than one." },
      { by: 'face', say: "It worked. Mostly. Except when it didn't." },
    ], beat: '{a.face} and {a.brain} bump fists.' },
  ]),
  ...E('circle.leave', [
    r1("Okay, I'm out. Circle, exit the chat."),
    r1("That's enough group chat for one day.", { beat: '{a} closes the chat and flops back onto the couch.' }),
    r1("Leaving on a high note. Circle, close the chat."),
    s1("I said just enough. Now I get out before I say too much."),
    r1("Bye, everybody. Circle, take me home."),
  ]),
  ...E('rate.middle', [
    s1("{b} goes right in the middle. Safe. For now."),
    s1("Middle of my list: {b}. I like {b}. I just like other people more."),
    s1("{b}, you're in the middle. Don't take it personally."),
    s1("I don't know where to put {b}. The middle. The middle is fine."),
    s1("{b} is right in the middle. That could go either way next time."),
    s1("Circle, put {b} in the middle. Not a statement. Just the middle."),
    s1("{b}'s in the middle. We haven't talked enough for anything else."),
    s1("Middle for {b}. Solid. Steady. Middle."),
  ]),
  ...E('block.after', [
    s1("I hated doing that. I really did."),
    s1("It's done. It had to be {b}. I have to live with it."),
    s1("I feel sick. Is that normal? That has to be normal.", { beat: '{a} sits down on the floor next to the couch.' }),
    s1("{b} is gonna hate me. That's okay. It's a game."),
    s1("Okay. Now everybody knows who I am in this game."),
    s1("I just hope {b} doesn't come knocking on my door."),
  ]),
  ...E('visit.walk', [
    s1("Down the hall. Up the stairs. Every door looks the same.", { beat: '{a} walks the hallway slowly, reading the names on the doors.' }),
    s1("I'm actually walking through the building. I'm actually doing this."),
    s1("Deep breath. Here's the door. Knock."),
    s1("I've talked to these people every day and I've never seen this hallway."),
    s1("My heart is pounding. Why is my heart pounding? I'm the one who got blocked."),
  ]),
  ...E('meet.settle', [
    talk("I need to sit down. My legs don't work.", "Sit, sit. Oh my God."),
    talk("You're all so much taller than I thought.", "You're so much louder than I thought!"),
    { turns: [{ by: 'a', react: "This is so weird. Good weird. So weird." }], beat: 'Everyone in the room is talking at once.' },
    talk("I can't believe I'm finally hearing your voice.", "Is it what you expected?"),
    { turns: [{ by: 'a', react: "Okay. Okay. I'm here. Who's next?" }], beat: '{a} squeezes onto the couch between the others.' },
  ]),
  ...E('party.dance', [
    s1("Nobody can see me. I'm dancing like nobody can see me.", { beat: '{a} dances on the couch.' }),
    r1("This is my song! This is my song!"),
    s1("Nobody can see me dance. This is the most free I have ever been."),
    s1("I've been saving these moves for a special occasion."),
    r1("Turn it up! Circle, turn it up!", { beat: '{a} spins around the kitchen counter.' }),
    s1("If they could see me right now, I'd win the whole game."),
    r1("Dance break! Dance break!"),
    s1("I'm dancing with a lamp. The lamp is a great dancer."),
  ]),
  ...E('party.photo', [
    { turns: [{ by: 'a', say: "Party pic. Make it look like I'm having the best night.", post: "Party of one but make it iconic {e:party}" }, { by: 'b', react: "Okay, {a}! Circle, like that." }] },
    { turns: [{ by: 'a', post: "Dressed up with nowhere to go {e:sparkle} {t:CircleParty}" }, { by: 'b', react: "{a} really committed to the theme. I love it." }] },
    { turns: [{ by: 'a', post: "Tonight's look {e:fire}" }, { by: 'b', react: "Oh, {a} came to party." }], beat: '{a} checks the likes: {n}.' },
    { turns: [{ by: 'a', say: "Post it. Everybody else is posting.", post: "Who's still up?? {e:eyes}" }, { by: 'b', react: "Me! Me, {a}!" }] },
    { turns: [{ by: 'a', post: "Me and my props {e:laugh}" }, { by: 'b', react: "Ha! That's so {a}." }] },
    { turns: [{ by: 'a', post: "Best party I've ever been to and I'm alone {e:party}" }, { by: 'b', react: "Same energy, {a}. Same energy." }] },
  ]),
  ...E('party.flirt', [
    { turns: [{ by: 'a', send: "Save me a dance {e:wink}" }, { by: 'b', send: "Every dance is yours {e:hearteyes}" }] },
    { turns: [{ by: 'a', send: "You'd be the first person I'd dance with if we could" }, { by: 'b', send: "I'd step on your feet the whole time lol" }, { by: 'a', send: "Worth it" }] },
    { turns: [{ by: 'a', send: "Is it the party or are you extra cute tonight {e:fire}" }, { by: 'b', send: "It's both {e:kiss}" }] },
    { turns: [{ by: 'a', react: "I'm gonna message {b}. It's a party. It's allowed.", send: "Hey party person" }, { by: 'b', send: "Hey yourself {e:wink}" }] },
    { turns: [{ by: 'a', send: "If this were a real party I'd be next to you right now" }, { by: 'b', send: "Then I'd be the luckiest person there" }] },
  ]),
  ...E('party.banter', [
    { turns: [{ by: 'a', send: "Who's winning the dance-off? Me. I'm winning" }, { by: 'b', send: "Nobody's even competing lol" }] },
    { turns: [{ by: 'a', send: "I'm three snacks deep and it's not even ten" }, { by: 'b', send: "Rookie numbers {e:laugh}" }] },
    { turns: [{ by: 'a', send: "Best party we've never been to together" }, { by: 'b', send: "Honestly top five" }] },
    { turns: [{ by: 'a', send: "Rate the party out of ten" }, { by: 'b', send: "Eleven. The props carried" }] },
    { turns: [{ by: 'a', send: "Who's staying up latest tonight?" }, { by: 'b', send: "Not me. I'm already in bed lol" }] },
  ]),
  ...E('party.end', [
    s1("Okay. Party's over. I'm in bed. Still wearing the wig.", { beat: '{a} falls asleep with the lights on.' }),
    s1("Best night in here so far. And I didn't leave the apartment."),
    s1("My feet hurt. From dancing. Alone. In socks."),
    s1("Tonight was fun. Tomorrow, the game comes back."),
    s1("I said too much tonight. I just know I said too much."),
  ]),
};
