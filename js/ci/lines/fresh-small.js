// More words for the smaller pools a season wears out fastest (the user,
// 2026-10-20: "it's getting repetitive"). Data only; each list joins the pool
// of the same key.
//
// Measured on six roster seasons, after batches 1 to 3: group.check.open aired
// 7 blocks a season from 4 lines, welcome.warm 7 from 5, party.flirt 7 from 5,
// arrival, arrival.alert and block.build.clue.threat 5 from 4,
// goodbye.warning.distrusts 4 from 3, style.mismatch.suspicious 7 from 6.
//
//   group.check.*      a group chat ({game} is its name) checks in / plans; c is the target
//   group.form.*       a starts a group chat with b and c / they name it {game}
//   welcome.warm       a welcomes b, the new Player
//   party.*            at a party: a flirts with b; a posts a photo and b reacts;
//                      a dances; a asks Never Have I Ever ({q}) and b owns up
//   arrival*           a new Player arrives (a); the alert; a worried; a likes b
//   style.mismatch.suspicious  a thinks b doesn't type like b looks
//   aside.sweet.warm   a, about b, after a sweet chat
//   result.influencers a and b find out they're the Influencers
//   hangout.open       a and b open the Hangout
//   host.cold.night    the host opens the episode after a Ratings night
//   block.build.*      an Influencer starts the blocking message / gives a clue
//   goodbye.warning.distrusts  a, blocked, on video, warns everybody about c
//   visit.after        a, after the visit
//   rate.callback.good a puts b high for something b did in {game}
const F = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.f${String(i + 1).padStart(2, '0')}`, ...x })) });
const S = (text, beat) => ({ turns: [{ by: 'a', say: text }], ...(beat ? { beat } : {}) });
const R = (text, beat) => ({ turns: [{ by: 'a', react: text }], ...(beat ? { beat } : {}) });
const H = text => ({ turns: [{ by: 'host', say: text }] });
const V = text => ({ turns: [{ by: 'a', video: text }] });
const M = text => ({ turns: [{ by: 'a', send: text }] });
const T = (...turns) => ({ turns: turns.map(([by, kind, text, more]) => ({ by, [kind]: text, ...(more || {}) })) });
const B = (x, beat) => ({ ...x, beat });

export const FRESH_SMALL = {
  // ── group chats ───────────────────────────────────────────────────────
  ...F('group.check.open', [
    T(['a', 'send', "{game}, roll call! Everybody okay?"], ['b', 'send', "Present. Barely awake, but present"]),
    T(['a', 'send', "Just checking on my {game} family {e:heart}"], ['b', 'send', "Love this group so much"]),
    T(['a', 'send', "{game} meeting. Anything new?"], ['b', 'send', "Nothing yet. Quiet day"], ['c', 'send', "Too quiet if you ask me"]),
    T(['a', 'send', "Morning, {game}! How did everybody sleep?"], ['b', 'send', "Like a baby. A stressed baby"]),
    T(['a', 'send', "Hey {game}, just making sure we're still solid"], ['b', 'send', "Totally solid {e:handshake}"]),
    T(['a', 'send', "{game} check-in. Anybody hear anything about us?"], ['b', 'send', "Nope. We're good. For now"]),
    T(['a', 'send', "Group hug, {game} {e:hug}"], ['b', 'send', "Hugging back"], ['c', 'send', "Group hug accepted"]),
    T(['a', 'send', "Okay {game}, how are we feeling about tonight?"], ['b', 'send', "Nervous. Very nervous"]),
    T(['a', 'send', "{game}, I missed you guys today"], ['b', 'send', "We were literally talking this morning lol"], ['a', 'send', "Still missed you"]),
    T(['a', 'send', "Anybody else in {game} feeling weird today?"], ['b', 'send', "So weird. Something's off in the building"]),
    T(['a', 'send', "Daily {game} reminder: we have each other's backs"], ['b', 'send', "Always {e:muscle}"]),
    T(['a', 'send', "{game} update: I survived another day"], ['b', 'send', "Proud of you lol"], ['c', 'send', "Same here. We're still standing"]),
    T(['a', 'send', "Quick {game} check. Everybody still trusts everybody?"], ['b', 'send', "Yes. Why, did something happen?"], ['a', 'send', "No! Just checking"]),
    T(['a', 'send', "{game} is the only chat I actually look forward to"], ['b', 'send', "Same. The rest are exhausting"]),
  ]),
  ...F('group.check.plan', [
    T(['a', 'send', "Real talk. {c} keeps coming up. We need a plan"], ['b', 'send', "{c} goes low from all of us. Agreed?"], ['a', 'send', "Agreed"]),
    T(['a', 'send', "I don't trust {c}. Do you guys?"], ['b', 'send', "Not even a little"]),
    T(['a', 'send', "If one of us is an Influencer, {c} is the first conversation"], ['b', 'send', "Deal"]),
    T(['a', 'send', "{c} has been asking about us. I don't like it"], ['b', 'send', "Me neither. That's a red flag"]),
    T(['a', 'send', "Tonight we all put {c} near the bottom. Same page?"], ['b', 'send', "Same page"], ['c', 'send', "Same page {e:handshake}"]),
    T(['b', 'send', "Am I crazy or is {c} trying to split us up?"], ['a', 'send', "You're not crazy. I see it too"]),
    T(['a', 'send', "We vote together or we go home separately"], ['b', 'send', "Together. Always"]),
    T(['a', 'send', "{c} is getting too close to everybody. That's a problem for us"], ['b', 'send', "Then we make it a problem for {c}"]),
    T(['a', 'send', "Plan for tonight. Keep it simple. {c} low"], ['b', 'send', "Simple works. Done"]),
    T(['a', 'send', "If anybody asks, we barely talk. Okay?"], ['b', 'send', "Barely talk. Got it {e:eyes}"]),
  ]),
  ...F('group.form.pitch', [
    T(['a', 'say', "Okay. Three people I actually trust. Let's see if they trust me back.", { send: "You two are the people I talk to most in here. Can I be honest?" }], ['b', 'send', "Always"], ['a', 'send', "I think the three of us should stick together. For real"]),
    T(['a', 'send', "Surprise! A group chat {e:party}"], ['b', 'send', "Ooh. I love a surprise"], ['a', 'send', "I want us to look out for each other. All the way"]),
    T(['a', 'send', "I've been thinking. We three have something good going"], ['c', 'send', "I've been thinking the same thing"], ['a', 'send', "Then let's make it official"]),
    T(['a', 'send', "This is a safe space. Nothing leaves this chat"], ['b', 'send', "Okay, now I'm intrigued {e:eyes}"], ['a', 'send', "I want to build something with you two"]),
    T(['a', 'say', "Big move. Small chat. Here goes.", { send: "Can I trust you two? Like, really trust you?" }], ['b', 'send', "Yes. Obviously"], ['c', 'send', "You know you can"]),
    T(['a', 'send', "Hey you two. I have an idea"], ['b', 'send', "Your ideas are usually good. Go"], ['a', 'send', "An alliance. The three of us. Nobody else"]),
    T(['a', 'send', "Everybody's teaming up. I want my team to be you two"], ['c', 'send', "Okay that's really sweet"], ['b', 'send', "I'm in. Obviously"]),
    T(['a', 'send', "Welcome to the only group chat that matters {e:crown}"], ['b', 'send', "Lol what's going on"], ['a', 'send', "I'm choosing you two. Let's protect each other"]),
  ]),
  ...F('group.form.name', [
    T(['a', 'send', "We need a name. I vote {game}"], ['b', 'send', "{game}. Yes"], ['c', 'send', "Love it. {game} it is"]),
    T(['b', 'send', "Wait, are we a real alliance now?"], ['a', 'send', "We're {game}. That's as real as it gets"], ['c', 'send', "{game}. I like how that sounds"]),
    T(['a', 'send', "Okay, official name: {game}"], ['b', 'send', "{game} forever"], ['c', 'send', "{game}. Don't tell a soul"]),
    T(['a', 'send', "Every alliance needs a name. How about {game}?"], ['b', 'send', "That's perfect"], ['c', 'send', "Done. We're {game}"]),
    T(['c', 'send', "What do we call ourselves?"], ['a', 'send', "{game}"], ['b', 'send', "{game}. I'm getting it tattooed. Kidding"]),
    T(['a', 'send', "I've decided we're {game}"], ['b', 'send', "You decided? Lol okay"], ['c', 'send', "{game} works for me"]),
    T(['a', 'send', "Name ideas? I've got one. {game}"], ['b', 'send', "No other ideas needed"], ['c', 'send', "{game}. It's perfect"]),
    T(['b', 'send', "This needs a name before it's real"], ['a', 'send', "{game}"], ['c', 'send', "Okay {game} is kind of iconic"]),
  ]),
  ...F('welcome.warm', [
    T(['a', 'send', "Welcome {b}! I'm so happy you're here"], ['b', 'send', "Aw, thank you! I'm so nervous"], ['a', 'send', "Don't be. We'll take care of you"]),
    T(['a', 'send', "Hi {b}! Ask me anything. I mean it"], ['b', 'send', "Okay, everything. Tell me everything"], ['a', 'send', "Lol let's start slow {e:smile}"]),
    T(['a', 'send', "{b}! Welcome to the craziest building in the world"], ['b', 'send', "I can already tell lol"]),
    T(['a', 'send', "Hey {b}, welcome! It gets easier, I promise"], ['b', 'send', "Thank you. That's exactly what I needed to hear"]),
    T(['a', 'send', "New friend alert! Hi {b} {e:wave}"], ['b', 'send', "Hi!! You're so sweet"], ['a', 'send', "I try lol. Welcome"]),
    T(['a', 'send', "Welcome to the Circle, {b}. Your profile is great"], ['b', 'send', "Stop! Thank you!"]),
    T(['a', 'send', "{b}, welcome! I wanted to say hi before everybody else does"], ['b', 'send', "You're the first! I'll remember that"]),
    T(['a', 'send', "Hi {b}! How are you feeling?"], ['b', 'send', "Honestly? Overwhelmed. In a good way"], ['a', 'send', "That's the right feeling. Welcome"]),
    T(['a', 'send', "Welcome {b}! If you need a friend in here, I'm right here"], ['b', 'send', "That means so much. Thank you"]),
    T(['a', 'send', "Hey {b}! Quick tip: be yourself. It works"], ['b', 'send', "Noted. Thank you!"]),
    T(['a', 'send', "Welcome, {b}! We've been waiting for you"], ['b', 'send', "No pressure then lol"], ['a', 'send', "None at all {e:wink}"]),
    T(['a', 'send', "Hi {b}! I'm so glad there's somebody new"], ['b', 'send', "Me too. Hi!"]),
  ]),

  // ── parties ───────────────────────────────────────────────────────────
  ...F('party.flirt', [
    T(['a', 'send', "You look amazing tonight. I can tell"], ['b', 'send', "You can't even see me lol"], ['a', 'send', "I can tell anyway"]),
    T(['a', 'send', "Wish I could see your dance moves right now"], ['b', 'send', "No you don't {e:laugh}"]),
    T(['a', 'send', "If this was a real party, I'd be standing next to you all night"], ['b', 'send', "I'd let you {e:wink}"]),
    T(['a', 'send', "Best part of this party is getting to talk to you"], ['b', 'send', "Okay that's smooth"]),
    T(['a', 'send', "Save the last dance for me?"], ['b', 'send', "It's already yours"]),
    T(['a', 'send', "You're the reason I put on a nice shirt tonight"], ['b', 'send', "Nobody can see your shirt lol"], ['a', 'send', "I know. Still did it"]),
    T(['a', 'send', "Tell me what you're wearing. For the party. Obviously"], ['b', 'send', "Obviously lol {e:eyes}"]),
    T(['a', 'send', "Is it hot in here or is it just this chat"], ['b', 'send', "It's the chat {e:fire}"]),
    T(['a', 'send', "If we ever meet, I owe you a real party"], ['b', 'send', "I'm holding you to that"]),
    T(['a', 'send', "Dancing in my kitchen and thinking about you. Normal stuff"], ['b', 'send', "Very normal. I'm doing the same lol"]),
    T(['a', 'send', "Okay I'm a little tipsy on party vibes. You're cute"], ['b', 'send', "You're cute too. Sober or not"]),
    T(['a', 'send', "Just wanted to say: you're my favorite person at this party"], ['b', 'send', "You're mine too {e:hearteyes}"]),
  ]),
  ...F('party.photo', [
    T(['a', 'post', "Dressed up with nowhere to go {e:sparkle}"], ['b', 'react', "Okay, {a} looks great. Like."]),
    T(['a', 'post', "Party in apartment {e:party} Population: me"], ['b', 'react', "Ha! {a} is having fun with it."]),
    T(['a', 'post', "Gave it my all tonight {e:fire} {t:CircleParty}"], ['b', 'react', "{a} went all out. I respect it."]),
    T(['a', 'say', "Okay, best angle. Go.", { post: "Party face on {e:cool}" }], ['b', 'react', "Look at {a} showing off."]),
    T(['a', 'post', "The costume took longer than my whole morning {e:laugh}"], ['b', 'react', "It shows, {a}. In a good way."]),
    T(['a', 'post', "Tonight's mood {e:party} {t:PartyAllNight}"], ['b', 'react', "{a} is the life of this party and we're not even in the same room."]),
    T(['a', 'post', "Me and my dance partner, the couch {e:laugh}"], ['b', 'react', "{a}, that's the best post tonight."]),
    T(['a', 'post', "Feeling myself tonight {e:fire}"], ['b', 'react', "As you should, {a}. As you should."]),
    T(['a', 'post', "I don't know the theme but I'm committed {e:laugh}"], ['b', 'react', "Committed is right. Good for {a}."]),
    T(['a', 'post', "Party photo. Don't zoom in {e:sweat}"], ['b', 'react', "Zooming in. Sorry, {a}."]),
    T(['a', 'post', "Main dance floor: my kitchen {e:party}"], ['b', 'react', "{a}'s kitchen looks like more fun than mine."]),
    T(['a', 'post', "Glow up for the party {e:sparkle} {t:CircleNights}"], ['b', 'react', "Wow. {a} cleans up nice."]),
  ]),
  ...F('party.dance', [
    S("I'm dancing like nobody's watching. Everybody's watching.", '{a} does a spin and almost hits the lamp.'),
    R("Turn it up! Turn it all the way up!", '{a} jumps up on the couch.'),
    S("This is the most fun I've had in here. And I'm alone.", '{a} dances across the kitchen.'),
    S("I'm a terrible dancer. I'm also a committed dancer.", '{a} does the robot. Badly.'),
    R("This song! This is my song!", '{a} sings into a hairbrush.'),
    S("Okay, this party is a lot better than I expected.", '{a} sways with a drink in hand.'),
    S("If anybody could see me right now, I'd be blocked immediately.", '{a} does a move that does not have a name.'),
    R("Dance break! Mandatory dance break!", '{a} waves both arms in the air.'),
    S("I'm getting my steps in. This is cardio.", '{a} jogs on the spot to the beat.'),
    S("I came to play the game, but I'm staying for the parties.", '{a} twirls into the bedroom and back.'),
    R("Nobody is ever going to see these moves. Except millions of people.", '{a} slides across the floor in socks.'),
    S("This is exactly what I needed tonight.", '{a} dances with {a.posAdj} eyes closed.'),
  ]),
  ...F('party.nhie', [
    T(['a', 'send', "{q}"], ['b', 'send', "Pass. I mean guilty. I mean pass"]),
    T(['a', 'send', "Okay, next one. {q} {e:eyes}"], ['b', 'react', "Why is everybody looking at me? Nobody can see me.", { send: "Fine. Guilty" }]),
    T(['a', 'send', "{q} Be honest!"], ['b', 'send', "Honestly? Yes. More than once {e:grimace}"]),
    T(['a', 'send', "Here's a good one. {q}"], ['b', 'send', "I'm not answering that. Okay, yes"]),
    T(['a', 'send', "{q} {e:laugh}"], ['b', 'react', "Oh no. Not this one.", { send: "Guilty as charged" }]),
    T(['a', 'send', "{q} No lying"], ['b', 'send', "I would never lie. Yes, I have {e:sweat}"]),
    T(['a', 'send', "Alright, spicy round. {q}"], ['b', 'send', "This game is getting dangerous lol. Yes"]),
    T(['a', 'send', "{q} Hands up if you have"], ['b', 'send', "Hand up. Slowly. Reluctantly"]),
    T(['a', 'send', "{q} {e:devil}"], ['b', 'send', "Do I have to answer? Fine. Yes"]),
    T(['a', 'send', "Let's see who's honest. {q}"], ['b', 'react', "I'm going to regret this.", { send: "Me. It was me" }]),
    T(['a', 'send', "{q} Come on, somebody has"], ['b', 'send', "Okay, it was me. Don't make it a thing {e:laugh}"]),
    T(['a', 'send', "Last one before I get in trouble. {q}"], ['b', 'send', "Too late, we're all in trouble lol. Yes"]),
  ]),

  // ── a new Player ──────────────────────────────────────────────────────
  ...F('arrival', [
    T(['a', 'react', "I'm here! I'm actually here!"], ['a', 'say', "Okay. Everybody already has friends. I need to catch up."]),
    S("Late to the party, but I'm going to make an entrance.", '{a.real} looks around the apartment, grinning.'),
    S("Everybody in here has a head start. That's fine. I'm fast."),
    T(['a', 'react', "This apartment is so nice. Okay, focus."], ['a', 'say', "Find out who's in charge. Make friends with them. Simple."]),
    S("New person energy. They're all going to want to talk to me.", '{a.real} drops {a.posAdj} bags by the door.'),
    S("I've watched this show a hundred times. Now it's me."),
    T(['a', 'react', "Wow. Okay. It's real."], ['a', 'say', "Be nice. Be curious. Don't say too much."]),
    S("Everybody's going to be suspicious of the new person. I have to win them over fast.", '{a.real} sits down in front of the screen.'),
    S("I came in late. That means nobody's had time to hate me yet."),
    T(['a', 'react', "Hi, Circle. It's me. I'm the new one."], ['a', 'say', "Let's see who's worth my time."]),
  ]),
  ...F('arrival.alert', [
    R("'Alert! A new Player has entered The Circle.' No. Not now!", 'Every apartment hears the same chime.'),
    R("A new Player? Who? Show me!", 'Up and down the building, everybody leans toward a screen.'),
    R("'A new Player has entered The Circle.' Great. One more person to win over.", 'Somebody upstairs groans out loud.'),
    R("Wait, a new Player? Now? Today?", 'Every screen flashes at once.'),
    R("New Player! Okay, everybody be cool. I'm not being cool.", 'Down the hall, somebody claps.'),
    R("Oh, a new face! I love a new face.", 'The alert chimes in every apartment.'),
    R("'A new Player has entered The Circle.' That changes everything.", 'The building goes quiet.'),
    R("A new Player? I just figured everybody out!", 'Somebody drops a spoon in the next apartment.'),
    R("Ooh, new blood. Let's see what we're working with.", 'In every apartment, a screen lights up.'),
    R("Somebody new? Please be nice. Please be on my side.", 'The whole building turns toward the screens.'),
  ]),
  ...F('arrival.react.worried', [
    S("A new Player means a new vote. I can't afford to lose any more votes."),
    R("Great. Somebody fresh, and I'm still struggling. Perfect timing."),
    S("Everybody's going to fall in love with the new person. I can feel it."),
    R("Another person to impress. I'm tired."),
    S("New people always shake things up. I don't need things shaken up right now."),
    R("Oh no. What if {b} likes everybody but me?"),
    S("A new face in here is never good news for whoever's at the bottom."),
    R("Okay. New person. I have to get to {b.obj} first."),
    S("If the new person sides with the wrong people, I'm in trouble."),
    R("More competition. Wonderful."),
  ]),
  ...F('arrival.react.crush', [
    R("Okay, {b} is very, very cute.", '{a} sits up straight.'),
    S("{b} just walked into the Circle and my whole strategy changed."),
    R("Hello, {b}. Welcome. Please stay forever."),
    S("I'm not here to date. I wasn't here to date. Hi, {b}."),
    R("Who is that? {b}? Okay. I'm messaging {b} first.", '{a} leans so close to the screen {a.posAdj} nose almost touches it.'),
    S("That smile. Circle, why did you do this to me?"),
    R("{b} is trouble. The best kind of trouble."),
    S("I need to play it cool with {b}. I don't know how to play it cool."),
    R("Oh, I'm in trouble. {b} is exactly my type."),
    S("New Player, new crush. That was fast. That was really fast."),
  ]),
  ...F('style.mismatch.suspicious', [
    R("{b} doesn't type the way that face looks. I can't explain it.", '{a} squints at {b}\'s profile picture.'),
    S("Every time I talk to {b}, I picture somebody completely different."),
    R("Hm. {b} uses words nobody that age uses."),
    S("Something about {b}'s messages doesn't match the pictures. I'm writing it down."),
    R("Is {b} really {b}? I'm starting to wonder."),
    S("The way {b} talks feels older. Or younger. Just different from the photos."),
    R("{b}'s profile says one thing. {b}'s typing says another.", '{a} reads the last message out loud, slowly.'),
    S("I've talked to {b} enough to know something's not adding up."),
    R("That doesn't sound like the person in those pictures. At all."),
    S("If {b} is a catfish, the typing is what gives it away."),
  ]),
  ...F('aside.sweet.warm', [
    S("I really like {b}. Like, outside-of-this-game like."),
    S("Talking to {b} feels easy. Nothing in here feels easy."),
    S("{b} is one of the good ones. I can tell."),
    S("If I go home tomorrow, I'm glad I met {b}."),
    S("That chat with {b} made my whole day better."),
    S("{b} and I are going to be friends for a long time. I can feel it."),
    S("Every time I talk to {b}, I forget this is a game."),
    S("I trust {b}. I don't trust a lot of people in here."),
    S("{b} just gets me. No explaining needed."),
    S("Okay, {b} is officially my favorite person to talk to."),
  ]),

  // ── the Influencers and the blocking ──────────────────────────────────
  ...F('result.influencers', [
    T(['a', 'react', "Me? An Influencer? I need to sit down."], ['b', 'react', "Oh no. Oh no. I have to block somebody."]),
    T(['a', 'react', "Influencer! Wait. That means I have to choose."], ['b', 'react', "This is a nightmare dressed as a compliment."]),
    T(['a', 'react', "People actually like me. That's wild."], ['b', 'react', "And now everybody's going to watch everything I do."]),
    T(['a', 'react', "'You are now The Circle Influencers.' I'm shaking."], ['b', 'react', "Me too? Okay. Breathe. Just breathe."]),
    B(T(['a', 'react', "Top two! I can't believe it."], ['b', 'react', "I've never been top two at anything. Ever."]), 'Two apartments light up at the same moment.'),
    T(['a', 'react', "Power. I have power. I don't want power."], ['b', 'react', "Okay. Somebody's going home because of me tonight. That's heavy."]),
    T(['a', 'react', "An Influencer! Mom, I'm an Influencer!"], ['b', 'react', "I have to be so careful now."]),
    B(T(['a', 'react', "No way. No way!"], ['b', 'react', "Wait, I'm the other one? Oh my God."]), 'In one apartment, a scream. In the other, silence.'),
  ]),
  ...F('hangout.open', [
    T(['a', 'react', "The Hangout. Okay. Me and {b}."], ['a', 'send', "Hi partner. This is so stressful"], ['b', 'send', "The worst. Let's just talk it through"]),
    T(['a', 'send', "Hey {b}. Congrats. I think?"], ['b', 'send', "Congrats? This is torture lol"], ['a', 'send', "Torture with a crown {e:crown}"]),
    T(['a', 'say', "Whatever I say in here, {b} can use later. Careful.", { send: "Hey! So. This is happening" }], ['b', 'send', "It really is. Where do you want to start?"], ['a', 'send', "With the hardest name. Get it over with"]),
    T(['a', 'send', "I'm glad it's you in here with me"], ['b', 'send', "Me too. Seriously"], ['a', 'send', "Okay. Let's be honest with each other"]),
    T(['a', 'send', "Hi! I haven't stopped shaking since the results"], ['b', 'send', "Same. My hands are a mess"]),
    T(['a', 'send', "Well. Here we are"], ['b', 'send', "Here we are. The two most stressed people in the building"]),
    T(['a', 'send', "Okay, I need this to be a team effort"], ['b', 'send', "Team effort. Totally"], ['a', 'send', "Good. Because I don't want to do this alone"]),
    T(['a', 'send', "Hey {b}! Did you see that coming?"], ['b', 'send', "Not at all. You?"], ['a', 'send', "Not even a little"]),
  ]),
  ...F('host.cold.night', [
    H("Last time on the Circle, the ratings came in. Tonight, they start to cost something."),
    H("Welcome back. Every Player in this building is still thinking about one number."),
    H("We left the Circle at the ratings, and nobody has slept since."),
    H("Previously on the Circle: everybody ranked everybody, and everybody is pretending they're fine."),
    H("The ratings are in, and the building is very, very quiet."),
    H("Last night, the Circle found out who's popular. Today, it finds out what that means."),
    H("Welcome back to the Circle, where the ratings never really end."),
    H("We're back, and the Players are still recovering from those ratings."),
  ]),
  ...F('block.build.open', [
    M("Hi everyone. We didn't take this lightly. Not for one second"),
    M("Okay, everybody. This is the part we've been dreading all day"),
    M("First, we want to say we love every single person in here"),
    M("Hey Circle. We're going to be honest about how we made this decision"),
    M("This was the longest conversation of our lives"),
    M("We want everybody to know this wasn't easy. Not even close"),
    M("Hi all. Before the name, we want to explain"),
    M("This is the hardest message we'll ever send in here"),
    M("We went back and forth for a long time. A really long time"),
    M("Okay. Deep breath, everybody. Here's how this went"),
  ]),
  ...F('block.build.clue.threat', [
    M("The person we're blocking is somebody everybody likes. That's the problem"),
    M("This is somebody who's very good at this game"),
    M("We're blocking someone we think could win"),
    M("The person we're blocking has a friend in every single chat"),
    M("This person is too strong to keep around. Sorry"),
    M("It's somebody we'd never want to face in the final"),
    M("We think this person is running more of the game than anybody knows"),
    M("This is somebody we're genuinely scared of. In the nicest way"),
  ]),

  // ── the goodbye and the visit ─────────────────────────────────────────
  ...F('goodbye.warning.distrusts', [
    V("And everybody: be careful with {c}. Really careful."),
    V("{c}, I know what you did. Everybody else, keep an eye on {c}."),
    V("Last thing. {c} is not your friend. Trust me on that."),
    V("If I can give one piece of advice: don't believe everything {c} tells you."),
    V("Watch {c}. That's all. Just watch."),
    V("{c}, you're good. Too good. Everybody, remember that."),
    V("And {c}? I'll be watching. Everybody else, be smarter than I was."),
    V("Don't let {c} fool you like {c} fooled me."),
  ]),
  ...F('visit.after', [
    S("I just met somebody from the Circle. In person. My brain can't handle it.", '{a} sits on the floor for a while.'),
    R("Okay. That happened. That really happened."),
    S("I know something nobody else in this building knows."),
    S("That conversation is going to change how I play.", '{a} paces slowly across the room.'),
    R("I need to lie down. I need to lie down right now."),
    S("Do I tell anybody? I don't think I tell anybody."),
    R("Meeting {b} for real. That's the craziest part."),
    S("I'll never forget this day. Not ever.", '{a} stares at the door for a long time.'),
    S("Back to the game. But nothing feels the same."),
    R("My heart is still going. Is it ever going to stop?"),
  ]),
  ...F('rate.callback.good', [
    S("{b} had my back in {game}. I don't forget that."),
    S("After what {b} did in {game}, {b} goes high."),
    S("{b} was kind to me in {game}. That's worth a lot."),
    S("{game} showed me who {b} really is, and I liked it."),
    S("I remember {game}. {b} looked out for me."),
    S("{b} was the only one who picked me in {game}. I owe {b}."),
    S("{game} told me everything I needed to know about {b}."),
    S("{b} came through in {game}. Now I come through for {b}."),
  ]),
};
