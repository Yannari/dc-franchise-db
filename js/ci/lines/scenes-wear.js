// More of the big moments' lines (Plan 3a+ Task 12). Data only. Merged into
// the same pools as ratings.js, blocking.js, visit.js, goodbye.js and
// scenes-more.js: the spec audit showed each of these airing one sentence up
// to eight times a season once the scenes ran in full. Slots and facts are
// the same as the pools they join (see the comments at the top of those files).
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.w${String(i + 1).padStart(2, '0')}`, ...x })) });
const s1 = (a, extra = {}) => ({ turns: [{ by: 'a', say: a }], ...extra });
const r1 = (a, extra = {}) => ({ turns: [{ by: 'a', react: a }], ...extra });
const msg = (a, b, c, extra = {}) => ({ turns: [{ by: 'a', send: a }, { by: 'b', send: b }, ...(c ? [{ by: 'c', send: c }] : [])], ...extra });

export const SCENES_WEAR = {
  // ── Ratings ────────────────────────────────────────────────────────────
  ...E('rate.middle', [
    s1("{b} in the middle. I need more time with {b.obj}."),
    s1("Circle, {b} goes right in the middle. That's honest."),
    s1("{b} is somewhere in the middle, and that's on both of us."),
    s1("Middle spot: {b}. Not a warning. Not a gift."),
    s1("I could move {b} up. I could move {b} down. Middle it is."),
    s1("{b}, you're in the middle. Talk to me more and that changes."),
    s1("The middle is for people I like but don't know yet. Hi, {b}."),
    s1("Circle, put {b} in the middle. Next time, who knows."),
    s1("Right in the middle, {b}. Safe with me. For tonight."),
    s1("{b} goes in the middle. We've had one good chat. One."),
    s1("I keep moving {b} around. Middle. Final answer."),
    s1("Middle of the list. {b}, I'm still figuring you out."),
  ]),
  ...E('rate.affection.top', [
    s1("{b}. Obviously {b}. Circle, first place."),
    s1("Circle, put {b} at the top. {b} has never made me feel small in here."),
    s1("First place is {b}, and I hope {b} put me up there too."),
    s1("{b} gets my first spot. That's loyalty. That's what I do."),
    s1("If {b} ever needs me, I'm there. First place."),
    s1("Circle, first position: {b}. No speech needed."),
  ]),
  ...E('rate.affection.bottom', [
    s1("{b}, it's not hate. It's just not love either. Last."),
    s1("Circle, {b} goes in last. I've got nothing to go on with {b}."),
    s1("Last place. {b}. We should talk more. We won't, but we should."),
    s1("{b} at the bottom. I don't feel anything when {b} posts."),
  ]),
  ...E('rate.threat.top', [
    s1("Keep your friends close. {b} is first."),
    s1("If {b} is an Influencer, I want to be the one {b} protects. First."),
    s1("Circle, {b} goes first. Strategy, not feelings. Mostly strategy."),
  ]),
  ...E('rate.threat.bottom', [
    s1("{b} has too many friends in here. Somebody has to say it. Last."),
    s1("Circle, put {b} at the bottom. I'm not scared. I'm careful."),
    s1("If {b} gets another week at the top, it's over. Last place."),
    s1("{b}, nothing against you. Everything against your game. Bottom."),
    s1("Everybody sees {b} as a sweetheart. I see a threat. Last."),
    s1("Circle, {b} goes last. It hurts a little. It has to be done."),
  ]),
  ...E('rate.suspicion.bottom', [
    s1("Something about {b} doesn't add up. Circle, last position."),
    s1("{b} dodges every real question. Bottom."),
    s1("If {b} is real, I'll apologize at the end. Last place."),
  ]),
  ...E('ratings.done', [
    s1("Sent. I'd do it the same way again. I think."),
    s1("Okay. Rankings are in. I need a snack.", { beat: '{a} walks straight to the fridge.' }),
    s1("That was harder than last time. It gets harder every time."),
    s1("I just made some people very happy and some people very mad."),
  ]),
  ...E('ratings.wait', [
    r1("Circle, I'm ready. I'm not ready. Show me."),
    r1("Top half. Top half. Just give me top half."),
    r1("If I'm last, I'm just gonna lie down on the floor."),
    r1("It's quiet in here. Too quiet."),
  ]),
  ...E('result.middle', [
    r1("The middle again. Invisible. Maybe that's the move."),
    r1("Not the top, not the bottom. I'll take it and keep going."),
    r1("Middle. I can live with middle. For now."),
    r1("Okay. Nobody hates me. Nobody loves me either. Noted."),
  ]),
  ...E('result.bottom', [
    r1("Bottom of the list. That's a wake-up call."),
    r1("Did everybody meet up and agree on this? What?", { beat: '{a} stares at the screen with {a.posAdj} mouth open.' }),
    r1("I'm down there. Okay. Okay. Nobody panic. Especially me."),
  ]),

  // ── Blocking ───────────────────────────────────────────────────────────
  ...E('block.wait', [
    r1("Circle, just tell me. I can't take the dots.", { beat: '{a} pulls {a.posAdj} knees up to {a.posAdj} chest.' }),
    r1("Whoever it is, please don't be me. I'm not ready.", { beat: '{a} grips the edge of the couch.' }),
    r1("Every single one of those dots is taking a year off my life.", { beat: '{a} watches the screen through {a.posAdj} fingers.' }),
    r1("I'm not breathing. I'm not breathing until I see a name."),
    r1("Please don't be me. Please don't be me.", { beat: '{a} rocks back and forth on the couch.' }),
    r1("If it's me, I'm going out with my head up. Maybe.", { beat: '{a} sits up straight, then slumps again.' }),
  ]),
  ...E('block.after', [
    s1("It's done. I can't take it back now."),
    s1("I made the call. Now I live with it."),
    s1("Everybody knows who did it now. Good. I stand by it."),
    s1("That was the hardest message I've ever sent."),
  ]),
  ...E('block.react.relief', [
    r1("Oh my God. Okay. Okay. I'm still here.", { beat: '{a} lies flat on the floor.' }),
    r1("I'm safe. I'm so sorry, {b}. But I'm safe.", { beat: '{a} covers {a.posAdj} face with both hands.' }),
    r1("{b}. Wow. I did not see that coming.", { beat: '{a} stares at the name on the screen.' }),
    r1("I feel bad for {b}. I also feel amazing. Is that bad?"),
    r1("Another week. Thank you, Circle. Thank you.", { beat: '{a} blows a kiss at the screen.' }),
    r1("That was way too close.", { beat: '{a} presses a hand to {a.posAdj} chest.' }),
    r1("{b}? Oh, that's gonna shake up the whole building."),
    r1("I'm still in this. I'm still in this!", { beat: '{a} jumps up and does a lap of the living room.' }),
    r1("Not me. Poor {b}, though. Really."),
    r1("Okay, breathe. You're safe. Breathe.", { beat: '{a} breathes in through {a.posAdj} nose, slowly.' }),
  ]),

  // ── The visit ──────────────────────────────────────────────────────────
  ...E('visit.wait', [
    r1("Please walk past my door. Please walk past my door.", { beat: '{a} stands in the middle of the room, perfectly still.' }),
    r1("If {b} comes here, I'm opening that door with a smile. Right?", { beat: '{a} practices the smile. It looks terrified.' }),
    r1("{b} is out there somewhere. In the building. Right now.", { beat: '{a} peeks through the peephole.' }),
    r1("I haven't done anything wrong. So why am I sweating?", { beat: '{a} fans {a.ref} with a magazine.' }),
    r1("Okay. If it's me, I'm offering {b} a drink. Hospitality.", { beat: '{a} lines up two glasses on the counter.' }),
    r1("I hear footsteps. I definitely hear footsteps.", { beat: '{a} tiptoes toward the door and presses an ear to it.' }),
  ]),
  ...E('visit.wait.catfish', [
    r1("If that door opens, {b} is gonna see someone {b.sub} has never seen before.", { beat: '{a} paces between the couch and the kitchen.' }),
    r1("Hide? Can I hide? Where would I even hide?", { beat: '{a} looks at the closet, then back at the door.' }),
    r1("Please. Anybody but me. My face is not my profile.", { beat: '{a} turns off every lamp in the apartment, then turns them all back on.' }),
    r1("If it's me, I'm explaining everything. Fast.", { beat: '{a} mouths a speech to the empty room.' }),
    r1("All this work, and one knock could end it.", { beat: '{a} sits on the floor with {a.posAdj} back against the couch.' }),
  ]),

  // visit.sit — a (the visitor) and b (visited) sit down before either says why.
  ...E('visit.sit', [
    { turns: [{ by: 'b', say: 'Sit. Please. Do you want some water?' }, { by: 'a', say: "I'm okay. I just want to talk." }],
      beat: '{a} and {b} sit down on the same couch, not quite looking at each other.' },
    { turns: [{ by: 'b', say: 'This is so weird. Come in, come in.' }, { by: 'a', say: 'Weird is one word for it.' }],
      beat: '{b} clears a pile of pillows off the couch.' },
    { turns: [{ by: 'a', say: 'So this is your apartment.' }, { by: 'b', say: "It's exactly like yours, isn't it?" },
      { by: 'a', say: 'Exactly like mine. Except you have snacks.' }], beat: 'They both laugh, a little too loud.' },
    { turns: [{ by: 'b', say: 'Okay. Hi. For real this time.' }, { by: 'a', say: 'Hi. For real.' }],
      beat: '{a} and {b} sit facing each other, knees almost touching.' },
    { turns: [{ by: 'a', say: "I don't have long, so I'm just gonna say it." }, { by: 'b', say: 'Okay. Go.' }],
      beat: '{b} sits on the edge of the coffee table.' },
    { turns: [{ by: 'b', say: "I don't even know what to say to you." }, { by: 'a', say: "Then let me start." }],
      beat: '{a} takes a deep breath.' },
    { turns: [{ by: 'a', say: 'Can I sit?' }, { by: 'b', say: 'Of course. Of course. Sit.' }],
      beat: 'For a second, neither of them says anything.' },
    { turns: [{ by: 'b', say: "You look exactly like your pictures. That's a relief." }, { by: 'a', say: "Thanks. That's the nicest thing anyone's said to me all day." }],
      beat: '{a} sinks into the armchair.', when: { catfish: false } },
  ]),

  // ── The goodbye video ──────────────────────────────────────────────────
  ...E('goodbye.guess', [
    r1("Please be who you said you were, {b}.", { beat: '{a} crosses {a.posAdj} fingers on both hands.' }),
    r1("Here we go. The truth about {b}.", { beat: '{a} leans so close to the screen {a.posAdj} nose almost touches it.' }),
    r1("I'm so nervous. Why am I nervous? I'm not the one leaving.", { beat: '{a} bounces one knee.' }),
    r1("{b} has a message for us. Of course {b} does.", { beat: '{a} settles in with a bowl of popcorn.' }),
    r1("If {b} says my name in this, I'm hiding under the blanket.", { beat: '{a} pulls a blanket up to {a.posAdj} chin.' }),
    r1("Real or fake. Real or fake. Come on, {b}.", { beat: '{a} drums on the coffee table.' }),
    r1("Okay, Circle. Hit play before I lose my mind.", { beat: '{a} squeezes a pillow tight.' }),
    r1("Whatever {b} says, everybody's gonna hear it at the same time.", { beat: 'In every apartment, the room goes quiet.' }),
    r1("Whatever this is, {b} deserves to be heard. Play it.", { beat: '{a} turns the volume up.' }),
    r1("I have a feeling about this one. A bad feeling. Or a good one. A feeling.", { beat: '{a} squints at the screen.' }),
  ]),
  ...E('goodbye.react.surprised', [
    r1("That was classy, {b}. Really classy.", { beat: '{a} claps slowly at the screen.' }),
    r1("I did not expect to get emotional over that.", { beat: '{a} wipes {a.posAdj} eyes with a sleeve.' }),
    r1("And just like that, {b} is gone.", { beat: '{a} looks around the quiet apartment.' }),
    r1("That's the part nobody tells you. People actually leave.", { beat: '{a} pulls a blanket over {a.posAdj} shoulders.' }),
    r1("Okay, {b}. I heard you. I heard all of it.", { beat: '{a} nods slowly at the blank screen.' }),
    r1("It's so weird. {b} was right here yesterday.", { beat: '{a} scrolls back through the old chats.' }),
  ]),

  // ── Private chats: getting to know each other ─────────────────────────
  ...E('chat.bond.warm', [
    { turns: [{ by: 'a', send: "Okay be honest. How are you actually doing in here?" }, { by: 'b', send: "Honestly? Better now that you asked {e:smile}" },
      { by: 'a', send: "Good. That's what I'm here for" }, { by: 'b', send: "You're sweet. I mean that" }] },
    { turns: [{ by: 'a', send: "What's the song stuck in your head right now" }, { by: 'b', send: "Don't laugh. A cereal commercial" },
      { by: 'a', send: "I'm laughing so hard {e:laugh}" }, { by: 'b', send: "It's catchy!! I stand by it" }] },
    { turns: [{ by: 'a', send: "I feel like we'd be friends on the outside. Is that weird to say?" }, { by: 'b', send: "Not weird. I was thinking the same thing" },
      { by: 'a', send: "Okay good. Friends then {e:handshake}" }] },
    { turns: [{ by: 'a', send: "Quick. Best thing that happened to you today" }, { by: 'b', send: "This message lol" },
      { by: 'a', send: "Stop {e:heart}" }, { by: 'b', send: "I'm serious! Today was long" }] },
    { turns: [{ by: 'a', send: "Rate your apartment snack situation 1-10" }, { by: 'b', send: "Solid 4. I ate all the good stuff day one" },
      { by: 'a', send: "Same. Rookie mistake {e:grimace}" }] },
    { turns: [{ by: 'a', send: "Can I tell you something? You're one of the easiest people to talk to in here" }, { by: 'b', send: "That means a lot. Seriously" },
      { by: 'a', send: "Just wanted you to know {e:smile}" }, { by: 'b', send: "Right back at you" }] },
    { turns: [{ by: 'a', send: "Dance break. Are you dancing right now or am I alone" }, { by: 'b', send: "I'm dancing. Badly. But I'm dancing" },
      { by: 'a', send: "That's all that matters {e:party}" }] },
    { turns: [{ by: 'a', send: "Do you ever just stare at the ceiling in here" }, { by: 'b', send: "Every day. I've named the cracks" },
      { by: 'a', send: "Okay you need more messages. I'm on it" }, { by: 'b', send: "Please {e:laugh}" }] },
    { turns: [{ by: 'a', send: "What's something that makes you laugh every time" }, { by: 'b', send: "People falling over. I'm sorry. I can't help it" },
      { by: 'a', send: "Same and I hate that it's same {e:laugh}" }] },
    { turns: [{ by: 'a', send: "Okay I need a hype message. Go" }, { by: 'b', send: "You're doing amazing and everybody in here likes you" },
      { by: 'a', send: "Okay I'm crying. Thank you {e:cry}" }, { by: 'b', send: "Anytime. Literally anytime" }] },
    { turns: [{ by: 'a', send: "If you could have one thing delivered to your apartment right now what is it" }, { by: 'b', send: "A pizza. Obviously" },
      { by: 'a', send: "Correct answer. The only answer {e:fire}" }] },
    { turns: [{ by: 'a', send: "I just wanted to say hi. That's it. That's the message" }, { by: 'b', send: "Hi back. Best message I got today {e:heart}" }] },
  ]),

  // chat.bond.cold — a reaches out, and b isn't having it.
  ...E('chat.bond.cold', [
    { turns: [{ by: 'a', send: "Hi! Figured I'd say hello since we haven't talked yet" }, { by: 'b', send: 'Hey' },
      { by: 'a', say: "'Hey.' That's it. That's the whole message." }] },
    { turns: [{ by: 'a', send: "What's your favorite thing about being in here so far?" }, { by: 'b', send: "Honestly? The quiet" },
      { by: 'a', react: 'Okay. I can take a hint.' }] },
    { turns: [{ by: 'a', send: 'Wanna play twenty questions?' }, { by: 'b', send: "Maybe later. I'm in the middle of something" },
      { by: 'a', send: 'Oh okay no worries' }], beat: '{a} stares at the screen a little longer than {a.sub} needs to.' },
    { turns: [{ by: 'a', send: 'Hey {b}! Loved your status this morning' }, { by: 'b', send: 'Thanks' },
      { by: 'a', react: 'One word. Wow.' }] },
    { turns: [{ by: 'a', say: "Let's try this again.", send: 'How are you holding up?' }, { by: 'b', send: "I'm good. You?" },
      { by: 'a', send: 'Good!' }, { by: 'a', react: "And that's where it died." }] },
    { turns: [{ by: 'a', send: "I feel like I don't know you at all yet" }, { by: 'b', send: "Yeah it's been a busy few days" },
      { by: 'a', send: 'Totally. Maybe tomorrow?' }, { by: 'b', send: 'Maybe' }] },
  ]),

  // chat.compare.warm — a and b compare what they have been told, and find it doesn't match.
  ...E('chat.compare.warm', [
    { turns: [{ by: 'a', send: 'Can I ask you something weird? Did anyone tell you I was coming after you?' }, { by: 'b', send: '...Maybe. Why?' },
      { by: 'a', send: "Because I wasn't. Somebody is stirring" }, { by: 'b', send: 'Okay now I need to know who {e:eyes}' }] },
    { turns: [{ by: 'a', say: "Put the stories side by side.", send: "Let's compare notes. What did you hear today?" },
      { by: 'b', send: 'You first' }, { by: 'a', send: 'Fine. I heard you ranked me last' }, { by: 'b', send: 'I ranked you second. Somebody lied to you' }] },
    { turns: [{ by: 'a', send: "Somebody told me you don't trust me" }, { by: 'b', send: "That's funny, because somebody told ME you don't trust ME" },
      { by: 'a', send: 'Same person, I bet' }, { by: 'b', send: 'I bet too {e:detective}' }] },
    { turns: [{ by: 'a', send: 'I think we are being played. Both of us' }, { by: 'b', send: 'By who?' },
      { by: 'a', send: 'Whoever keeps telling us different things' }, { by: 'b', send: 'Okay. From now on we check with each other first' }] },
    { turns: [{ by: 'a', send: 'Be honest. Did you say anything bad about me in a chat?' }, { by: 'b', send: 'Never. Did you about me?' },
      { by: 'a', send: 'Never' }, { by: 'b', send: "Then somebody's making things up" }] },
  ]),

  // chat.compare.neutral — they compare notes and it goes nowhere clear.
  ...E('chat.compare.neutral', [
    { turns: [{ by: 'a', send: 'Can we compare notes real quick?' }, { by: 'b', send: 'Sure. What have you heard?' },
      { by: 'a', send: 'Honestly? Not much. You?' }, { by: 'b', send: "Same. Everybody's being careful" }] },
    { turns: [{ by: 'a', send: 'Anything weird come your way today?' }, { by: 'b', send: "Not really. It's been quiet" },
      { by: 'a', send: 'Quiet makes me nervous' }] },
    { turns: [{ by: 'a', send: 'Did anyone say anything about me?' }, { by: 'b', send: 'Not to me. Why, what did you hear?' },
      { by: 'a', send: 'Nothing. Just checking' }, { by: 'b', send: 'Okay, now I\'m suspicious lol' }] },
    { turns: [{ by: 'a', say: 'See what they know without giving anything away.', send: 'What do you think is going on in here?' },
      { by: 'b', send: "I think everybody's playing nice until they don't" }] },
  ]),

  // chat.ally.warm — a asks b to team up, and b says yes.
  ...E('chat.ally.warm', [
    { turns: [{ by: 'a', say: 'Time to lock this in.', send: "Real question. If it comes down to it, are you with me?" },
      { by: 'b', send: "I'm with you. I've been with you" }, { by: 'a', send: "Good. Then it's us {e:handshake}" }] },
    { turns: [{ by: 'a', send: "I don't want to just be friends in here. I want us to be a team" }, { by: 'b', send: "A team. I like that" },
      { by: 'a', send: "We rate each other high. We tell each other everything" }, { by: 'b', send: "Everything. Deal {e:muscle}" }] },
    { turns: [{ by: 'a', say: "{b} is the one. I can feel it.", send: "I trust you more than anybody in here. Is that crazy?" },
      { by: 'b', send: "Not crazy. I was gonna say the same thing" }, { by: 'a', send: "Then let's make it count" }] },
    { turns: [{ by: 'a', send: "People are starting to pick sides. I want to be on yours" }, { by: 'b', send: "You already are. I just didn't say it out loud" },
      { by: 'a', send: "Say it out loud then {e:eyes}" }, { by: 'b', send: "You and me. There. I said it" }] },
    { turns: [{ by: 'a', send: "If one of us gets power, we keep the other one safe. Yes?" }, { by: 'b', send: "Yes. Without question" },
      { by: 'a', send: "Okay. I feel so much better now {e:heart}" }] },
    { turns: [{ by: 'a', say: "Don't sound desperate. Sound sure.", send: "I think we should have each other's backs. Officially" },
      { by: 'b', send: "Officially? Okay. I like official" }, { by: 'a', send: "Nobody else hears about this" }, { by: 'b', send: "Our secret {e:detective}" }] },
  ]),

  // ── Circle Chat ────────────────────────────────────────────────────────
  ...E('circle.more', [
    msg("Is anybody else's apartment freezing or is it just me", "Just you lol. Mine's a sauna", "I'll trade you"),
    msg("What's everybody doing later {e:eyes}", "Same thing as every night. Talking to a screen", "Living the dream {e:laugh}"),
    msg("Rate your day 1-10. Go", "7. Would be 10 with pizza", "8 because I talked to you guys {e:heart}"),
    msg("Okay who's the early riser in here", "Not me. Never me", "Me. I've been up since six {e:sun}"),
    msg("Group workout tomorrow? Everybody in their own apartment lol", "I'll be there in spirit", "My couch and I will be cheering"),
    msg("Does anybody else talk to the Circle like it's a person", "Every day. It's my best friend now", "Circle, you're doing amazing {e:laugh}"),
    msg("Just wanna say this group is weirdly wholesome", "Weirdly is the right word lol", "Don't jinx it {e:grimace}"),
    msg("Okay real question. Pineapple on pizza. Yes or no", "Yes and I'll fight about it", "Absolutely not {e:grimace}"),
  ]),
  ...E('circle.react', [
    r1("{b} always knows what to say in there. That's either sweet or scary."),
    r1("Okay, {b}. I see you."),
    r1("{b} sounds happy today. Good for {b}."),
    r1("I wanna know what {b} really meant by that."),
    r1("{b} is the glue of that group chat. Honestly."),
    r1("Hm. That's a very careful message, {b}."),
    r1("Every time {b} posts, the whole chat perks up."),
    r1("I'm keeping my mouth shut and my eyes on {b}."),
    r1("Of course {b} was first to answer. Of course."),
  ]),
  ...E('circle.leave', [
    r1("Okay, that was fun. Circle, close the chat."),
    r1("I'm out before somebody asks me something hard."),
    r1("Circle, exit the chat. My face hurts from smiling."),
  ]),
};
