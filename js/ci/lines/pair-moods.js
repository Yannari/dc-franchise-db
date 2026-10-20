// Two people, one profile, and how they get along (the user, 2026-10-20:
// "duo profiles, do they have interactions between each other depending on
// their relationship?"). Data only. ci/shared.js gives every pair a bond and a
// lean; pairMood reads them as close, bickering, one-leads or steady, and
// ci/script.js picks these over the general lines most of the time
// (PAIR_MOOD_SHARE) when the mood is anything but steady.
//
// Roles speaking: face / brain, older / younger, and boss / follower (who runs
// the profile, and the other one). Slots {a.boss} {a.follower} {a.face}
// {a.brain} {a.older} {a.younger} are first names.
//
//   pair.cowrite.mood.<mood>         two lines before a message goes; `wins` types it
//   shared.argue.mood.<mood>.<won>   the argument over a message, by who won it
//                                    (close/bickering: faceWins, brainWins;
//                                    lead: boss, or follower for once)
//   pair.answer.<moment>.<mood>      the other one's answer, out loud (close and
//                                    bickering only: a boss line can't know which
//                                    of the two is speaking)
//   life.pair.mood.<mood>            the two of them, alone in the apartment
//   life.pair.shift.<mood>           the night how they get along changed:
//                                    making up (close), falling out (bickering;
//                                    .low after a bad night), one taking over
//                                    (lead), calming down (steady)
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.d${String(i + 1).padStart(2, '0')}`, ...x })) });
const A = text => ({ turns: [{ by: 'a', react: text }] });
const C = (r1, s1, r2, s2, wins) => ({ turns: [{ by: r1, say: s1 }, { by: r2, say: s2 }], wins });
const T = (...turns) => ({ turns: turns.map(([by, text]) => ({ by, say: text })) });
const B = (x, beat) => ({ ...x, beat });
const ST = (stage, x) => ({ ...x, stage });

export const PAIR_MOODS = {
  // ── the host, at the pair's apartment ───────────────────────────────────
  ...E('host.pair', [
    { turns: [{ by: 'host', say: "Meanwhile, in the apartment with two people in it, {a.real} are home for the night." }] },
    { turns: [{ by: 'host', say: "Two people, one apartment, one remote. Let's check in on {a.real}." }] },
    { turns: [{ by: 'host', say: "Over at the shared apartment, {a.real} have the evening to themselves." }] },
    { turns: [{ by: 'host', say: "Let's see what {a.real} are up to. It's never boring in there." }] },
    { turns: [{ by: 'host', say: "One profile, two people, and a very small couch. Here's {a.real}." }] },
    { turns: [{ by: 'host', say: "Next door to everybody, {a.real} are winding down. Sort of." }] },
  ]),
  ...E('host.pair.shift.close', [
    { turns: [{ by: 'host', say: "After a rough few days, {a.real} might finally be on the same side again." }] },
    { turns: [{ by: 'host', say: "Something has thawed in the shared apartment. {a.real} are talking again." }] },
    { turns: [{ by: 'host', say: "Tonight, {a.real} remember why they came in here together." }] },
    { turns: [{ by: 'host', say: "Good news from the shared apartment: {a.real} have stopped arguing. For now." }] },
  ]),
  ...E('host.pair.shift.bickering', [
    { turns: [{ by: 'host', say: "Uh-oh. In the shared apartment, {a.real} are not speaking." }] },
    { turns: [{ by: 'host', say: "One apartment. Two people. Zero patience. It's a long night for {a.real}." }] },
    { turns: [{ by: 'host', say: "The ratings are in, and {a.real} are taking it out on each other." }] },
    { turns: [{ by: 'host', say: "Things are getting tense between {a.real}. And there's nowhere to go." }] },
  ]),
  ...E('host.pair.shift.lead', [
    { turns: [{ by: 'host', say: "In the shared apartment tonight, one of {a.real} is taking charge." }] },
    { turns: [{ by: 'host', say: "Something's changed for {a.real}. Somebody's calling the shots now." }] },
    { turns: [{ by: 'host', say: "Tonight, {a.real} decide who's really running their profile." }] },
    { turns: [{ by: 'host', say: "A change of plan in the shared apartment. {a.real} are getting a new boss." }] },
  ]),
  ...E('host.pair.shift.steady', [
    { turns: [{ by: 'host', say: "It's a quieter night for {a.real}. They need one." }] },
    { turns: [{ by: 'host', say: "After all that, {a.real} just want a normal evening." }] },
    { turns: [{ by: 'host', say: "The shared apartment is calm tonight. {a.real} are catching their breath." }] },
    { turns: [{ by: 'host', say: "No fireworks for {a.real} tonight. Just two tired people." }] },
  ]),

  // ── writing a message together ─────────────────────────────────────────
  ...E('pair.cowrite.mood.close', [
    C('face', "You want to say it or should I?", 'brain', "You say it. You were already typing it in your head.", 'face'),
    C('brain', "I know exactly what you're going to write.", 'face', "Then you know it's good.", 'face'),
    C('face', "Same thing we said yesterday, but nicer?", 'brain', "Perfect. That's the one.", 'face'),
    C('brain', "Keep it short. They'll like short.", 'face', "Already did. Look.", 'face'),
    C('face', "Okay, read it. Honest opinion.", 'brain', "Honest opinion? It sounds like us. Send it.", 'face'),
    C('brain', "Let me take this one.", 'face', "Go for it. I trust you.", 'brain'),
    C('face', "Do we add a heart?", 'brain', "We always add a heart. Add the heart.", 'face'),
    C('brain', "Same page?", 'face', "Same page. Same sentence, probably.", 'brain'),
  ]),
  ...E('pair.cowrite.mood.bickering', [
    C('face', "Give me the remote.", 'brain', "No. You'll ruin it like you ruined the last one.", 'brain'),
    C('brain', "Don't you dare send that.", 'face', "Too late. Already sent.", 'face'),
    C('face', "Why are you reading over my shoulder?", 'brain', "Because you can't spell.", 'brain'),
    C('older', "My turn.", 'younger', "It's been your turn all day.", 'younger'),
    C('brain', "That's a terrible message.", 'face', "Then write your own terrible message.", 'brain'),
    C('younger', "You're typing it wrong.", 'older', "There's no wrong way to type a message.", 'older'),
    C('face', "Can you not breathe on me while I type?", 'brain', "Can you not type like a toddler?", 'face'),
    C('brain', "Delete that. Now.", 'face', "Make me.", 'brain'),
  ]),
  ...E('pair.cowrite.mood.lead', [
    C('follower', "What if we said...", 'boss', "No. I've got it. Watch.", 'boss'),
    C('boss', "I'm writing this one.", 'follower', "You write all of them.", 'boss'),
    C('follower', "Can I at least pick the emoji?", 'boss', "Fine. One emoji. Make it count.", 'boss'),
    C('boss', "Sit back. I know what to say.", 'follower', "Sure. You always do.", 'boss'),
    C('follower', "I think we should be nicer.", 'boss', "Nicer loses. Trust me.", 'boss'),
    C('boss', "Here. Read it and tell me it's perfect.", 'follower', "It's perfect. Obviously.", 'boss'),
    C('follower', "Can I write one? Just one?", 'boss', "Okay. Go. Don't make me regret it.", 'follower'),
    C('boss', "I've been thinking about this all morning.", 'follower', "Of course you have.", 'boss'),
  ]),

  // ── the argument over a message ────────────────────────────────────────
  ...E('shared.argue.mood.close.faceWins', [
    T(['brain', "You sure?"], ['face', "Totally sure."], ['brain', "Then I'm sure too."]),
    B(T(['face', "Can I do it my way?"], ['brain', "You don't even have to ask."]), '{a.brain} hands over the remote without a word.'),
    T(['brain', "That's not how I'd say it."], ['face', "But is it okay?"], ['brain', "It's better, honestly."]),
    T(['face', "Trust me on this one?"], ['brain', "I always do."]),
    B(T(['brain', "Ha. Okay, yeah. That's good."], ['face', "I know."]), '{a.face} and {a.brain} share a grin.'),
  ]),
  ...E('shared.argue.mood.close.brainWins', [
    T(['face', "Your way's better. Go."], ['brain', "Thank you."], ['face', "Don't get used to it."]),
    T(['brain', "Can I change one word?"], ['face', "Change two. I don't mind."]),
    B(T(['face', "Wait, you're right. Do yours."], ['brain', "We'll do yours next time."]), '{a.face} leans on {a.brain}\'s shoulder while {a.brain} types.'),
    T(['brain', "Let's make it a bit more careful."], ['face', "Yeah. Good call."]),
    T(['face', "I trust you. Write it."], ['brain', "I'll make it sound like both of us."]),
  ]),
  ...E('shared.argue.mood.bickering.faceWins', [
    B(T(['brain', "That's wrong."], ['face', "It's not wrong, it's mine."], ['brain', "Same thing."]), '{a.face} sends it anyway, staring at {a.brain} the whole time.'),
    T(['face', "I'm sending it. Deal with it."], ['brain', "I'll remember this."], ['face', "You remember everything."]),
    B(T(['brain', "Can you listen to me for once?"], ['face', "I listened. I didn't agree."]), '{a.brain} throws a pillow across the room.'),
    T(['face', "Stop grabbing the remote!"], ['brain', "Stop typing garbage!"], ['face', "Sent. Done. Bye."]),
    T(['brain', "We agreed we'd be careful."], ['face', "You agreed. I nodded."]),
  ]),
  ...E('shared.argue.mood.bickering.brainWins', [
    B(T(['face', "Fine! Your way! Happy?"], ['brain', "Very."]), '{a.face} sulks on the far end of the couch.'),
    T(['brain', "Give it here."], ['face', "You're so annoying."], ['brain', "And right. Annoying and right."]),
    B(T(['face', "Why do you always win these?"], ['brain', "Because I'm the one who thinks first."]), '{a.face} groans into a pillow.'),
    T(['brain', "No. Absolutely not."], ['face', "Then you write it."], ['brain', "I am writing it."]),
    T(['face', "I hate this."], ['brain', "You hate losing. That's different."]),
  ]),
  ...E('shared.argue.mood.lead.boss', [
    B(T(['follower', "Can we talk about it first?"], ['boss', "We just did. Sending."]), '{a.follower} sighs and lets it go.'),
    T(['boss', "I've got this."], ['follower', "You've always got it."], ['boss', "Because I do."]),
    T(['follower', "I'd say it differently."], ['boss', "I know. That's why I'm saying it."]),
    B(T(['boss', "Hand it over."], ['follower', "Here. Again."]), '{a.boss} takes the remote, and {a.follower} sinks back into the couch.'),
    T(['follower', "Do I get a vote?"], ['boss', "You get a say. I get the vote."]),
    T(['boss', "Watch and learn."], ['follower', "I've been watching for days."]),
  ]),
  ...E('shared.argue.mood.lead.follower', [
    B(T(['follower', "No. This time we do it my way."], ['boss', "...Okay. Fine. Go."]), '{a.boss} looks genuinely surprised.'),
    T(['follower', "I'm typing this one, and you're not stopping me."], ['boss', "Wow. Okay. Look at you."]),
    T(['boss', "That's not what I'd—"], ['follower', "I know. It's what I'd say. Sending."]),
    B(T(['follower', "Give me the remote."], ['boss', "Since when do you—"], ['follower', "Since now."]), '{a.follower} grabs the remote first for once.'),
  ]),

  // ── the other one answers ──────────────────────────────────────────────
  ...E('pair.answer.down.close', [
    A("Hey. We're okay. We're always okay."),
    A("Come here. We'll figure it out together, like always."),
    A("I don't care where we landed. I'm glad it's us in here."),
    A("Bad night. Good team. We'll fix it."),
    A("Look at me. It's not you. It's not me either."),
    A("We've had worse days than this. Remember?"),
  ]),
  ...E('pair.answer.down.bickering', [
    A("Well, I wonder whose message did that."),
    A("Don't look at me. I said not to send it."),
    A("Great. Fantastic. Your plan, by the way."),
    A("If you'd listened to me this morning, we wouldn't be here."),
    A("I'm not saying I told you so. I'm thinking it really loudly."),
    A("Oh, now you want to talk strategy?"),
  ]),
  ...E('pair.answer.up.close', [
    A("That's us! That's both of us!"),
    A("See? We make a good team."),
    A("I knew we'd be okay. I knew it."),
    A("High five. No, both hands."),
    A("We did that together. Don't forget it."),
    A("Okay, I'm proud of us. Really proud."),
  ]),
  ...E('pair.answer.up.bickering', [
    A("You're welcome, by the way. That was my idea."),
    A("Don't let it go to your head."),
    A("Good. Now maybe you'll listen to me next time."),
    A("Fine. That went well. Despite you."),
    A("Okay, we're good tonight. We're still not friends."),
    A("I'll take that. I'm still mad about earlier."),
  ]),
  ...E('pair.answer.wait.close', [
    A("Hold my hand. Whatever it says, it says it to both of us."),
    A("Breathe with me. In. Out."),
    A("Whatever happens, I'm glad you're here."),
    A("We've got this. And if we don't, we've got each other."),
    A("Come sit by me. Closer."),
    A("I'm nervous too. That's okay."),
  ]),
  ...E('pair.answer.wait.bickering', [
    A("Stop tapping your foot. It's driving me crazy."),
    A("If it's bad, I'm blaming you."),
    A("Can you sit somewhere else? You're making me nervous."),
    A("You're doing the thing with your hands again."),
    A("Quiet. I can't think with you sighing like that."),
    A("Whatever it is, it's your fault."),
  ]),
  ...E('pair.answer.plan.close', [
    A("Yes. That's exactly what I was thinking."),
    A("We're on the same page. Again."),
    A("I like it. Let's do it."),
    A("You're good at this, you know that?"),
    A("Okay, I'm in. Whatever you think."),
    A("Love that plan. Love you. Go."),
  ]),
  ...E('pair.answer.plan.bickering', [
    A("That's the worst plan I've ever heard."),
    A("No. Absolutely not. Next idea."),
    A("Sure, if you want us out by Friday."),
    A("Did you even think about that, or did you just say it?"),
    A("We are not doing that. I don't care how you say it."),
    A("Fine. But when it goes wrong, it's on you."),
  ]),
  ...E('pair.answer.react.close', [
    A("Ha! I was about to say the same thing."),
    A("You read my mind."),
    A("That's exactly what I thought."),
    A("We have to talk about that later. Just us."),
    A("You saw it too? Okay, good."),
    A("Right? I had the exact same face."),
  ]),
  ...E('pair.answer.react.bickering', [
    A("That's not what it means and you know it."),
    A("You always read it the wrong way."),
    A("Oh, come on. That's obviously not about us."),
    A("No. You're overthinking it. Again."),
    A("Can you not say everything out loud?"),
    A("Wow. You're really going with that?"),
  ]),

  // ── the two of them, alone in the apartment ────────────────────────────
  ...E('life.pair.mood.close', [
    B(T(['face', "I'm really glad we did this together."], ['brain', "Me too. I couldn't do this with anybody else."]), '{a.face} and {a.brain} share one blanket on the couch.'),
    ST('{a.face} and {a.brain} are making dinner together, passing things without asking.', T(['brain', "Salt."], ['face', "Already in."])),
    T(['brain', "Whatever happens, we go home together."], ['face', "That's the only thing I care about."]),
    B(T(['face', "Remember when we thought we'd fight the whole time?"], ['brain', "We haven't fought once."], ['face', "Don't jinx it."]), 'Both of them knock on the wooden table at the same time.'),
    ST('{a.face} falls asleep on {a.brain}\'s shoulder halfway through a movie.', T(['brain', "Don't worry. I'll tell you how it ends."])),
    T(['face', "You know what the best part of this is?"], ['brain', "The snacks?"], ['face', "You. Then the snacks."]),
    B(T(['brain', "We should come up with a handshake."], ['face', "We already have one. Watch."]), '{a.face} and {a.brain} do a very long handshake.'),
    T(['face', "I keep forgetting it's a game. With you, it just feels like a sleepover."], ['brain', "A sleepover with cameras."], ['face', "Best sleepover ever."]),
  ]),
  ...E('life.pair.mood.bickering', [
    B(T(['older', "You left your socks on the couch again."], ['younger', "And you left your attitude everywhere."]), 'The two of them sit at opposite ends of the couch.'),
    T(['face', "Can you chew quieter?"], ['brain', "Can you exist quieter?"]),
    ST('{a.face} and {a.brain} both reach for the last cookie at the same time.', T(['face', "Mine."], ['brain', "I saw it first."], ['face', "I don't care."])),
    B(T(['brain', "You took my pillow."], ['face', "It's not your pillow. It's the apartment's pillow."]), '{a.brain} takes it back anyway.'),
    T(['older', "We're stuck in here together for who knows how long."], ['younger', "Don't remind me."]),
    ST('There is a line of tape down the middle of the couch.', T(['face', "That's my side."], ['brain', "You're breathing on my side."])),
    T(['brain', "Is it possible for you to not hum all day?"], ['face', "Is it possible for you to not complain all day?"]),
    B(T(['face', "I'm going to shower."], ['brain', "Good. Take your time. Take all day."]), 'The bathroom door shuts a little too hard.'),
  ]),
  ...E('life.pair.mood.lead', [
    B(T(['boss', "Okay. Tomorrow we talk to three people. I've got a list."], ['follower', "Of course you have a list."]), '{a.boss} holds up a notepad covered in names.'),
    T(['follower', "Do we ever get a day off from the plan?"], ['boss', "The plan is the day off."]),
    ST('{a.boss} is pacing, talking strategy. {a.follower} is eating cereal and nodding.', T(['follower', "Mm-hm. Yep. Great plan."])),
    T(['boss', "Don't message anybody without me."], ['follower', "I wasn't going to."], ['boss', "I know. I'm just saying."]),
    B(T(['follower', "What if I just ran one chat tomorrow?"], ['boss', "Which one?"], ['follower', "Any one. Just one."]), '{a.boss} thinks about it for a long time.'),
    T(['boss', "We're doing great because we have a system."], ['follower', "We have your system."], ['boss', "Same thing."]),
    ST('{a.boss} rearranges the fridge into a very specific order.', T(['follower', "I'm scared to touch anything now."])),
    T(['follower', "You know I have ideas too, right?"], ['boss', "Of course. Tell me tomorrow."]),
  ]),

  // ── the night it changed ───────────────────────────────────────────────
  ...E('life.pair.shift.close', [
    B(T(['face', "I'm sorry about this week."], ['brain', "Me too. Truce?"], ['face', "Truce."]), '{a.face} and {a.brain} hug in the middle of the kitchen.'),
    T(['brain', "We've been awful to each other."], ['face', "We have. Let's stop."], ['brain', "Deal. Starting now."]),
    ST('{a.face} makes {a.brain} a cup of tea without being asked.', T(['brain', "What's this for?"], ['face', "For putting up with me."])),
    B(T(['face', "Tonight felt like us again."], ['brain', "Yeah. I missed us."]), 'They fall asleep on the couch, both of them, for once.'),
    T(['brain', "That went well because we did it together."], ['face', "So let's keep doing it together."]),
  ]),
  ...E('life.pair.shift.bickering', [
    B(T(['face', "I can't do one more day of this."], ['brain', "Then stop fighting me on everything."]), 'The two of them go to bed without saying good night.'),
    T(['brain', "We used to be good at this."], ['face', "You used to listen."], ['brain', "You used to make sense."]),
    ST('{a.face} and {a.brain} have stopped talking. The only sound is the TV.', T(['face', "Fine."], ['brain', "Fine."])),
    B(T(['face', "Why are you being like this?"], ['brain', "Why are YOU being like this?"]), 'Neither of them backs down.'),
    T(['brain', "This place is getting to us."], ['face', "No. You're getting to me."]),
  ]),
  ...E('life.pair.shift.bickering.low', [
    B(T(['face', "That was your message. That was all you."], ['brain', "Oh, so it's my fault now?"], ['face', "Whose else would it be?"]), '{a.brain} walks to the bedroom and shuts the door.'),
    T(['brain', "We're near the bottom because you flirt with everybody."], ['face', "We're near the bottom because you're so cold in every chat."]),
    ST('{a.face} and {a.brain} are on opposite sides of the room, both staring at the ratings.', T(['face', "Don't even start."], ['brain', "I didn't say anything."], ['face', "You were thinking it."])),
    B(T(['brain', "I told you not to send it."], ['face', "And I told you to stop telling me what to do."]), 'The apartment goes very quiet.'),
    T(['face', "One bad night and you turn on me."], ['brain', "It's not one bad night. It's every night."]),
  ]),
  ...E('life.pair.shift.lead', [
    B(T(['boss', "From now on, I'm running the chats. All of them."], ['follower', "All of them?"], ['boss', "All of them. We can't afford mistakes."]), '{a.follower} nods slowly.'),
    T(['follower', "Okay. You take over. You're better at this."], ['boss', "I'll get us through. I promise."]),
    ST('{a.boss} writes out a plan for tomorrow on the fridge whiteboard.', T(['follower', "When did you get a whiteboard?"], ['boss', "When I took over."])),
    B(T(['boss', "Trust me. Just this once, let me do it my way."], ['follower', "It's always your way."], ['boss', "Then this once won't feel different."]), '{a.follower} hands over the remote for good.'),
    T(['follower', "So you're in charge now."], ['boss', "Somebody has to be."]),
  ]),
  ...E('life.pair.shift.steady', [
    B(T(['face', "Okay. We're fine. We're just tired."], ['brain', "Yeah. Let's sleep on it."]), 'The two of them call it a night.'),
    T(['brain', "Can we just have a normal day tomorrow?"], ['face', "A normal day sounds amazing."]),
    ST('{a.face} and {a.brain} watch TV in silence, but a comfortable one.', T(['face', "This is nice."], ['brain', "It is."])),
    T(['face', "We're doing okay, right?"], ['brain', "We're doing okay."]),
    B(T(['brain', "No big talks tonight."], ['face', "Agreed. Snacks and sleep."]), 'They split a bag of chips and go to bed.'),
  ]),
};
