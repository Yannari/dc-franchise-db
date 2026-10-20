// The Roast (US 4×6, the Circle Roast), beat by beat. Data only.
//
// A joke is not a painting: this family has none of the make games' lines
// (user, 2026-10-20: "the roast joke game doesn't even have roast, it plays
// like a drawing game"). Every joke is SENT, with the writer's name on it,
// and the target answers out loud.
//
//   props   — a reacts to the alert
//   plan    — a says who they're roasting (b) and how (tone)
//   draft   — a writing it (tone, tier: bombed | ok | killed)
//   mic     — the host opens the roast
//   joke    — a sends the joke about b; b reacts. `when` { tone, angle }:
//             tone tease | savage | soft; angle is what the joke is about
//             (games.js angleFor): catfish flirt power bottom quiet chatty
//             old young job general (soft has its own)
//   laugh   — a, watching, on b's joke (tier; savage has its own)
//   last    — a got the fewest likes (tier)
//   tally   — a reads the likes; b leads with {n}
//   winner  — a won the roast
//   sting   — a, roasted for real, about b once it's over
//
// Second person in the jokes ("{b}, you…"): a joke is said TO somebody, and
// it keeps every pronoun out of a sentence that has to agree with it.
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const s1 = (a, beat) => ({ turns: [{ by: 'a', say: a }], ...(beat ? { beat } : {}) });
const r1 = (a, beat) => ({ turns: [{ by: 'a', react: a }], ...(beat ? { beat } : {}) });
const host = t => ({ turns: [{ by: 'host', say: t }] });
const when = (x, w) => ({ ...x, when: w });
// The joke goes up; the target answers.
const joke = (tone, angle, send, react) => ({ turns: [{ by: 'a', send }, { by: 'b', react }], when: { tone, angle } });

export const G_ROAST = {
  ...E('game.roast.props', [
    r1("A roast? Somebody is getting hurt tonight, and I need it to not be me."),
    r1("Comedy. In here. With these people. Okay."),
    r1("I've been holding in jokes for days. Finally, a legal outlet.", '{a} cracks {a.posAdj} knuckles at the screen.'),
    r1("A roast means everybody gets roasted. Including me. Oh no."),
    r1("With our names on it? So no hiding. Great. Love that."),
  ]),

  ...E('game.roast.plan', [
    when(s1("I'm roasting {b}. Lovingly. Mostly lovingly."), { tone: 'tease' }),
    when(s1("{b} has given me so much material already. Thank you, {b}."), { tone: 'tease' }),
    s1("{b}. Okay. What do I know about {b} that everybody else knows too? That's the joke."),
    s1("It's {b}. Of course it's {b}. Okay. Think."),
    s1("I got {b}. Now I need a joke that's funny and won't get me blocked."),
    when(s1("Roasting {b}. Gently. Golden brown, not on fire."), { tone: 'tease' }),
    when(s1("I got {b}, and I already have three jokes. Two of them are even nice."), { tone: 'tease' }),
    when(s1("{b} is going to laugh at this. I think. I hope. Probably."), { tone: 'tease' }),
    when(s1("I got {b}. Okay. Keep it light. Keep it funny. Don't make enemies."), { tone: 'tease' }),
    when(s1("{b}. Of course I got {b}. I've been waiting for this."), { tone: 'savage' }),
    when(s1("I have one joke about {b}, and it's not really a joke."), { tone: 'savage' }),
    when(s1("A roast is just the truth with a laugh track. {b}, I'm sorry. Not really."), { tone: 'savage' }),
    when(s1("I got {b}. I can't roast {b}. {b} is lovely. This is a problem."), { tone: 'soft' }),
    when(s1("How do you roast somebody who's been nothing but nice to you? Asking for me."), { tone: 'soft' }),
  ]),

  ...E('game.roast.draft', [
    s1("Write. Delete. Write. Delete. This is comedy, apparently."),
    s1("Is it mean if it's true? Asking for myself."),
    s1("Okay. The joke is done. Don't overthink it. I'm overthinking it.", '{a} reads it back with one eye closed.'),
    when(s1("I've written six jokes about {b}, and they're all just facts. That's not comedy, that's a report."), { tier: 'bombed' }),
    when(s1("Is this funny? I can't tell anymore. I've read it forty times.", '{a} reads the joke out loud to an empty room.'), { tier: 'bombed' }),
    when(s1("Okay, I'm not a comedian. I'm a person with a keyboard and fear."), { tier: 'bombed' }),
    when(s1("It's a little mean. It's roast mean. That's allowed."), { tier: 'ok' }),
    when(s1("One joke. One good joke. That's all I need."), { tier: 'ok' }),
    when(s1("Not my best work. Not my worst. It's a solid B-minus joke."), { tier: 'ok' }),
    when(s1("Oh. Oh, this one's good. {b} is going to feel this one in {b.posAdj} bones."), { tier: 'killed' }),
    when(s1("I just made myself laugh. That never happens. Send it before I chicken out."), { tier: 'killed' }),
    when(s1("This joke has been living in my head since the day I moved in, and it's finally paying rent."), { tier: 'killed' }),
    when(s1("Too far? No. Just far enough.", '{a} hovers over the send button, grinning.'), { tone: 'savage' }),
  ]),

  ...E('game.roast.mic', [
    host("The jokes are in. Every one of them goes up with a name on it, so nobody gets to hide behind anonymous tonight."),
    host("Roast time! Players, your jokes are about to hit every screen in the building. Your friendships may not survive. Let's go."),
    host("Welcome to the Circle Roast, where everybody's a comedian and nobody's ready for it."),
    host("The jokes are locked in. Some are funny. Some are mean. A couple are both. Let's read them."),
  ]),

  // ── the jokes ─────────────────────────────────────────────────────────
  ...E('game.roast.joke', [
    // a profile the room isn't sure about
    joke('tease', 'catfish', "{b}, your profile pic is so good, even you've never seen it in person {e:laugh}", "Okay, that's funny. But I'm REAL. Mostly."),
    joke('tease', 'catfish', "{b} has been 'about to send a selfie' since day one. We're still waiting {e:eyes}", "Ha! The lighting's never right in here!"),
    joke('tease', 'catfish', "Hey {b}, quick question. Who's the person in your pictures? {e:detective}", "Ha! Me! It's me! Mostly me."),
    joke('savage', 'catfish', "{b}, I'd call you two-faced, but nobody in here has even seen one of them", "Wow. You really went there. In front of everybody."),
    joke('savage', 'catfish', "{b}'s bio is the best fiction I've read all year", "Fiction? Okay. I'll remember that one."),
    joke('savage', 'catfish', "{b} has the most realistic profile in the Circle. Somebody worked really hard on it", "That's not a joke. That's an accusation."),
    // a flirt
    joke('tease', 'flirt', "{b} has flirted with every profile in this building. The Circle had to install a speed bump {e:laugh}", "I'm just friendly! Very friendly. Okay, fair."),
    joke('tease', 'flirt', "{b}, you've typed 'you're cute' more times than you've typed your own name {e:hearteyes}", "Okay but they WERE all cute."),
    joke('tease', 'flirt', "If flirting was a game, {b} would already have won it. Twice. With different people {e:wink}", "No comment. My lawyer says no comment."),
    joke('savage', 'flirt', "{b} flirts with everybody. That's not charm, that's a strategy, and it's not even a good one", "Okay. Somebody's jealous."),
    joke('savage', 'flirt', "{b} has more crushes in here than real conversations", "Wow. Okay. Noted. Very noted."),
    joke('tease', 'flirt', "{b}'s DMs are a romance novel. Every chapter has a different love interest {e:laugh}", "And every chapter is a page-turner."),
    joke('tease', 'flirt', "{b} doesn't say 'good morning.' {b} says 'good morning, gorgeous' to six different people {e:sun}", "Seven. You missed one."),
    joke('savage', 'flirt', "{b}, you're not looking for love in here. You're looking for votes with a winky face", "Wow. Okay. Takes one to know one."),
    // somebody who has held power
    joke('tease', 'power', "{b} was an Influencer once and still signs every message like it's a press release {e:crown}", "That is... a little bit true."),
    joke('tease', 'power', "{b} had one night of power and now expects a parade every morning {e:party}", "Would it kill you to throw me one?"),
    joke('savage', 'power', "{b} blocked somebody and called it 'the hardest decision of my life.' It took four minutes", "It took six minutes, actually."),
    joke('savage', 'power', "{b}, the power went straight to your head, and it's still up there, looking for company", "Wow. And I was going to keep you safe."),
    // rated low last time
    joke('tease', 'bottom', "I'd roast {b}, but the ratings already did that for me {e:grimace}", "Okay, OUCH. But fair."),
    joke('tease', 'bottom', "{b}, don't worry about the ratings. This joke is the most attention you've had in days {e:hug}", "Thank you? I think?"),
    joke('savage', 'bottom', "{b}, even the ratings are trying to send you home. Take the hint", "Kicking somebody when they're down. Classy."),
    joke('savage', 'bottom', "{b} is the only Player the Circle rates by accident", "Wow. Okay. Just wow."),
    // quiet
    joke('tease', 'quiet', "{b} types so little, the Circle keeps sending wellness checks {e:laugh}", "I'm thinking! It's called thinking!"),
    joke('tease', 'quiet', "{b}'s last Circle Chat message was 'lol.' A true poet {e:clap}", "Lol."),
    joke('savage', 'quiet', "{b} has said nothing for days and somehow made it this far. Teach me the trick", "The trick is not talking. Try it sometime."),
    joke('savage', 'quiet', "{b} isn't mysterious. {b} just doesn't have anything to say", "And yet here I am. Still here."),
    joke('tease', 'quiet', "{b} is so quiet in Circle Chat, I thought {b} was the Circle's screensaver {e:laugh}", "I'm saving my words for something important."),
    joke('tease', 'quiet', "Somebody check on {b}. Blink twice if you've been kidnapped by your own couch {e:eyes}", "Blink. Blink."),
    // never stops typing
    joke('tease', 'chatty', "{b}, you've sent so many messages, the Circle asked for a raise {e:laugh}", "I have a lot of feelings! They need somewhere to go!"),
    joke('tease', 'chatty', "{b} doesn't do private chats. {b} does three-hour podcasts with one listener", "And every episode is a banger."),
    joke('savage', 'chatty', "{b} talks to everybody about everybody. Ask me how I know", "Wow. Throwing me under the bus in a ROAST?"),
    joke('savage', 'chatty', "{b} has sent a thousand messages in here and not one of them was true", "That's a lie. Some of them were true."),
    // the oldest in the room
    joke('tease', 'old', "{b} is the only Player who reads every message out loud. Slowly. With reading glasses {e:laugh}", "My eyes are fine! Mostly!"),
    joke('tease', 'old', "{b} sends 'lol' like it's a word {b} just learned this week", "I learned it last week, thank you very much."),
    joke('savage', 'old', "{b} is old enough to remember when catfish were just fish", "I'm aged like a fine wine, and you're aged like milk."),
    joke('savage', 'old', "{b}, you're not the mom of the group. You're the group's babysitter, and nobody asked", "Somebody has to be the adult in here."),
    // the youngest
    joke('tease', 'young', "{b} is so young, this is the first time {b} has ever been away from {b.posAdj} group chat {e:laugh}", "Hey! I'm an adult! Legally!"),
    joke('tease', 'young', "{b} just asked the Circle what a landline is {e:shock}", "Okay, I did NOT. I knew. Mostly."),
    joke('savage', 'young', "{b} plays this game like a group project nobody else wanted to do", "Bold talk from somebody I could outlast."),
    joke('savage', 'young', "{b}, you have the strategy of somebody who still gets an allowance", "Okay, that one actually hurt a little."),
    // the day job ({x})
    joke('tease', 'job', "Day job: {x}. Circle job: professional overthinker. {b}, you're overqualified for both {e:laugh}", "I'll put that on my resume."),
    joke('tease', 'job', "{b} put '{x}' on the profile. In here, {b} is a full-time snack eater {e:laugh}", "It's a demanding job! Somebody has to do it!"),
    joke('tease', 'job', "{b}'s profile says {x}. I've seen how {b} types. I have follow-up questions {e:detective}", "Ha! Typing is not in the job description!"),
    joke('savage', 'job', "{b}'s profile says {x}. {b}'s messages say otherwise", "Okay. You want to see my diploma?"),
    joke('savage', 'job', "{b} put '{x}' on the profile, and it's the most believable thing {b} has said all week", "Wow. Okay. That one had teeth."),
    joke('tease', 'job', "Day job: {x}. Circle job: refreshing the Newsfeed every eleven seconds. Only one of those pays, {b} {e:laugh}", "And it's not the fun one."),
    // anything else
    joke('tease', 'general', "{b}, you say 'I'm just here to have fun' like it's a threat {e:laugh}", "It IS a threat. Watch me have fun."),
    joke('tease', 'general', "{b} sends a good-morning message every single day. At this point it's a hostage situation {e:sun}", "You love my good-morning messages!"),
    joke('tease', 'general', "{b}'s whole strategy is being nice to everybody. Bold. Brave. Never been done {e:clap}", "It's working, isn't it?"),
    joke('tease', 'general', "{b} has been about to make a big move since day one. We're all still waiting {e:eyes}", "It's coming. Any day now. Probably."),
    joke('tease', 'general', "{b} can read a message for twenty minutes and still reply 'haha what' {e:laugh}", "Haha what."),
    joke('savage', 'general', "{b}, the nicest thing I can say about your game is that it's almost over", "Oh, you'd better hope I'm not an Influencer tomorrow."),
    joke('savage', 'general', "{b} is everybody's best friend in here. Everybody's. That's not a friendship, that's a mailing list", "Wow. Tell me how you really feel."),
    joke('savage', 'general', "{b} smiles in every message. It's the smile you give somebody right before you block them", "Okay. I'll remember who wrote that."),
    joke('savage', 'general', "I wanted to roast {b}, but you can't roast something that's already this cooked", "Cooked? We'll see who's cooked."),
    joke('tease', 'general', "{b} rates people the way {b} texts: with way too many feelings and no plan {e:laugh}", "My feelings ARE the plan."),
    joke('tease', 'general', "{b}, you've said 'honestly' so many times in here, I'm starting to think you're not {e:side}", "Honestly? Rude."),
    joke('tease', 'general', "{b} talks to the Circle like it's an old friend. 'Circle, my love, send.' Calm down {e:laugh}", "The Circle and I have something special."),
    joke('savage', 'general', "{b}, you've been playing it safe for so long, the Circle filed you under furniture", "Furniture that's still here. Think about that."),
    joke('savage', 'general', "{b} agrees with everybody in Circle Chat. Somebody please tell {b} it's okay to have an opinion", "Here's my opinion: you're next."),
    joke('savage', 'general', "{b} thinks nobody notices the strategy. {b}, we all notice the strategy", "Then why are you so scared of it?"),
    // any writer, any target (when nothing more particular fits)
    { turns: [{ by: 'a', send: "{b}, I tried to write a roast about you, but the Circle said it was too long {e:laugh}" }, { by: 'b', react: "Fair. I'm a lot." }] },
    { turns: [{ by: 'a', send: "{b} is the only person in here who reads the rules out loud for fun {e:eyes}" }, { by: 'b', react: "They're very well written!" }] },
    { turns: [{ by: 'a', send: "{b}, if overthinking was a game, you'd be the Influencer every single night {e:crown}" }, { by: 'b', react: "And then I'd overthink who to block." }] },
    // a writer who couldn't do it
    joke('soft', 'soft', "I tried. I really tried. {b}, you're too nice to roast. That's the joke. That's the whole joke {e:heart}", "That's not a roast, that's a hug."),
    joke('soft', 'soft', "{b}'s biggest flaw is making everybody else in here feel welcome. Disgusting behavior {e:smile}", "Aww. That's the worst roast I've ever heard. I love it."),
    joke('soft', 'soft', "{b} is so sweet, the Circle had to turn the screen brightness down {e:sparkle}", "Okay, that's not a roast. But thank you."),
    joke('soft', 'soft', "{b}, your only problem is you make the rest of us look bad. Please stop {e:pray}", "Ha! I'll try to be worse. For you."),
    joke('soft', 'soft', "Roast: {b} is honestly great. I'm sorry. I don't know how comedy works {e:sweat}", "That's the nicest roast in history."),
  ]),

  // ── the room: a laughs at b's joke, or doesn't ────────────────────────
  ...E('game.roast.laugh', [
    r1("Ha! Okay, {b}. I see you."),
    r1("Everybody is reading {b}'s joke twice. I can feel it."),
    r1("{b} went for it. Respect for going for it.", '{a} leans back and laughs.'),
    when(r1("I just spat my water out. {b}, how?", '{a} wipes the screen with a sleeve.'), { tier: 'killed' }),
    when(r1("That's the one. That's the joke of the night. {b}, take a bow."), { tier: 'killed' }),
    when(r1("Oh my God. {b} came here to WIN."), { tier: 'killed' }),
    when(r1("I'm crying. I'm actually crying. {b}, who hurt you? Never mind, don't answer."), { tier: 'killed' }),
    when(r1("Ha. Okay, {b}. That's cute."), { tier: 'ok' }),
    when(r1("I chuckled. One chuckle. {b} gets one chuckle."), { tier: 'ok' }),
    when(r1("Not bad, {b}. Not great. But not bad."), { tier: 'ok' }),
    when(r1("Was that the joke? Was that the whole joke?"), { tier: 'bombed' }),
    when(r1("Crickets. I can hear the crickets from my apartment.", '{a} stares at the screen, waiting for a punchline.'), { tier: 'bombed' }),
    when(r1("{b}, I love you, but no."), { tier: 'bombed' }),
    when(r1("Okay, that's actually funny. I hate that it's funny."), { tier: 'killed' }),
    when(r1("{b} is wasted in here. {b} should have a comedy special.", '{a} slaps the arm of the couch.'), { tier: 'killed' }),
    when(r1("I laughed so hard I scared myself. {b}, stop."), { tier: 'killed' }),
    when(r1("Oh, that's going in the group chat when we get out. {b}, legend."), { tier: 'killed' }),
    when(r1("Circle, like it. Like it twice if you can. That was perfect, {b}."), { tier: 'killed' }),
    when(r1("Solid. That's a solid joke, {b}. Not a classic. Solid."), { tier: 'ok' }),
    when(r1("Ha! Okay. That one gets a like from me, {b}."), { tier: 'ok' }),
    when(r1("I smiled. I didn't laugh, but I smiled. Partial credit, {b}."), { tier: 'ok' }),
    when(r1("That's a dad joke, {b}. A good dad joke. Still a dad joke."), { tier: 'ok' }),
    when(r1("Okay, {b} has jokes. Small jokes. But jokes."), { tier: 'ok' }),
    when(r1("Cute, {b}. Safe. Very safe. Nobody's getting hurt by that one."), { tier: 'ok' }),
    when(r1("{b} typed that, read it, and pressed send anyway. Brave."), { tier: 'bombed' }),
    when(r1("Somebody explain {b}'s joke to me. Slowly.", '{a} squints at the screen.'), { tier: 'bombed' }),
    when(r1("Oof. {b}, that landed like a dropped phone."), { tier: 'bombed' }),
    when(r1("I think that was a joke? The emoji says it was a joke."), { tier: 'bombed' }),
    when(r1("{b}, I'm going to pretend I didn't read that. For both of us."), { tier: 'bombed' }),
    when(r1("Oh, that's not a joke. That's a grudge with a punchline."), { tone: 'savage' }),
    when(r1("{b} has been waiting days to send that. Days."), { tone: 'savage' }),
    when(r1("Ooh. Somebody's sleeping with one eye open tonight, and it isn't {b}."), { tone: 'savage', tier: 'killed' }),
    when(r1("Aww. {b} couldn't do it. {b} is soft. I respect it."), { tone: 'soft' }),
  ]),

  ...E('game.roast.last', [
    when(s1("My joke got the fewest likes. In a ROAST. I'm not funny. I've been lied to my whole life."), { tier: 'bombed' }),
    when(s1("Last? Okay. Comedy is subjective. Very, very subjective."), { tier: 'bombed' }),
    s1("Fewest likes? It was a GOOD joke. This room has no taste."),
    s1("Last place in a joke contest. My mom always said I was funny. My mom lied."),
    s1("The fewest likes. Fine. My joke was ahead of its time.", '{a} turns the screen off for a second.'),
  ]),

  ...E('game.roast.tally', [
    s1("{n} likes for {b}'s joke. That's the one everybody loved."),
    s1("{b} with {n} likes. The room has spoken, and the room is laughing."),
    s1("How did {b} get {n} likes? Okay, it was funny. It was really funny."),
  ]),

  ...E('game.roast.winner', [
    s1("I won the roast! I'm officially the funniest person in a building full of strangers."),
    s1("Funniest in the Circle. Put it on my tombstone. Actually, put it on my profile."),
    s1("I WON? Comedy is my calling. Forget everything else I've ever done.", '{a} takes a bow to the empty apartment.'),
    s1("The people have spoken, and the people think I'm hilarious. As they should."),
  ]),

  // ── after: the ones who got roasted for real ──────────────────────────
  ...E('game.roast.sting', [
    s1("{b} wrote that about me with a smile. I'll remember it with a smile."),
    s1("Funny, {b}. Really funny. I'm laughing on the inside, where I keep my list."),
    s1("That wasn't a joke. {b} meant that. Everybody saw {b} mean that."),
    s1("A roast, sure. With {b}'s name on it. I can read, {b}."),
  ]),

  // ── the roast comes back in a later chat ──────────────────────────────
  ...E('callback.roasted.theirs', [
    { turns: [{ by: 'a', send: "Still thinking about your joke in {game}. Hilarious. Really {e:side}" }, { by: 'b', send: "Lol come on, it was a roast! That's the game" }] },
    { turns: [{ by: 'a', say: "I have to ask. I just have to." }, { by: 'a', send: "Be honest. Was the {game} joke a joke?" }, { by: 'b', send: "Mostly a joke. Like 80% joke lol" }] },
    { turns: [{ by: 'a', send: "Funny how you knew exactly where to aim in {game}" }, { by: 'b', send: "It's a roast! I'd have done it to anybody" }] },
  ]),
  ...E('callback.roasted.mine', [
    { turns: [{ by: 'a', say: "I went a little hard in that roast. I should say something." }, { by: 'a', send: "Hey, about {game}. I went a little hard. You good?" }, { by: 'b', send: "I'm fine. My ego is in the hospital but I'm fine" }] },
    { turns: [{ by: 'a', send: "No hard feelings about {game}, right? {e:grimace}" }, { by: 'b', send: "None. I'm already writing mine for next time though" }] },
    { turns: [{ by: 'a', send: "It was just a roast, in {game}. You know I love you" }, { by: 'b', send: "Sure. Love. That's what that was" }] },
  ]),
  ...E('callback.roast-kind.theirs', [
    { turns: [{ by: 'a', send: "Your {game} joke about me was the nicest roast in history lol {e:heart}" }, { by: 'b', send: "I couldn't do it! You're too likable" }] },
    { turns: [{ by: 'a', say: "{b} went easy on me. I noticed." }, { by: 'a', send: "I saw what you wrote in {game}. Thank you for being gentle {e:hug}" }, { by: 'b', send: "Don't tell anybody I'm soft" }] },
    { turns: [{ by: 'a', send: "Okay your {game} joke made me laugh. In a nice way {e:laugh}" }, { by: 'b', send: "That's the only way I know how lol" }] },
  ]),
  ...E('callback.roast-kind.mine', [
    { turns: [{ by: 'a', send: "Did you like your roast? I went easy on you {e:wink}" }, { by: 'b', send: "Easy? My mom roasts me harder than that lol" }] },
    { turns: [{ by: 'a', send: "Okay my {game} joke wasn't my best. You're hard to roast!" }, { by: 'b', send: "I'll take that as a compliment {e:smile}" }] },
    { turns: [{ by: 'a', say: "Make sure {b} knew it was all love." }, { by: 'a', send: "That joke in {game} was all love, by the way {e:heart}" }, { by: 'b', send: "I know. I could tell {e:hug}" }] },
  ]),
};
