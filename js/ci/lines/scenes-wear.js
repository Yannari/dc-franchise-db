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

  // ── Circle Chat ────────────────────────────────────────────────────────
  ...E('circle.more', [
    msg("Is anybody else's apartment freezing or is it just me", "Just you lol. Mine's a sauna", "I'll trade you"),
    msg("What's everybody doing tonight {e:eyes}", "Same thing as every night. Talking to a screen", "Living the dream {e:laugh}"),
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
