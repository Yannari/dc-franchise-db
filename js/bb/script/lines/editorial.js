// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/editorial.js — ordinary rooms, strategic moments (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/editorial-social.js.
//
//   editorial.bedroom     a and b fight over beds; c watches (bedroom)            scene
//   editorial.whisper     a and b whispering; c walks in                          scene
//   editorial.latenight   a, b and c up at 2 a.m. (kitchen)                       scene
//   editorial.spill       a lets slip b's secret; c hears it                      scene
//   editorial.orbit       a won't leave the HOH room; b waits; c is the HOH       scene
//   editorial.apology     a apologises to b                                       lands | fails
//   editorial.spark       a and b flirt in the backyard                           scene
//   editorial.flip        a, b and c plan to flip the vote onto {target} (bedroom)   scene
//   editorial.roast       a jokes about b; c laughs                               lands | cuts
//   editorial.breakdown   a breaks down; b finds a (storage room)                 scene
//   editorial.meeting     a walks in on b and c's meeting (bedroom)               scene
//   editorial.standoff    a freezes b out (kitchen)                               scene

export default {
  'editorial.bedroom.scene': [
    { id: 'eb.1', turns: [{ by: 'b', say: "I was saving that bed." }, { by: 'a', say: "You weren't sleeping in it." }, { beat: '{a} keeps unpacking. {c} watches from across the room.' }] },
    { id: 'eb.2', turns: [{ by: 'a', say: "I think we should all swap beds. Make the rooms more balanced." }, { by: 'b', say: "Who put you in charge of beds?" }, { by: 'c', dr: "{a} wants a better bed. That's all this is." }] },
    { id: 'eb.3', turns: [{ by: 'b', say: "Is that your charger in my socket?" }, { by: 'a', say: "It's not your socket." }, { by: 'b', say: "It's right next to my bed!" }] },
    { id: 'eb.4', turns: [{ by: 'a', say: "Who took the extra pillows?" }, { by: 'b', say: "Check under your own bed." }, { beat: '{c} tries not to laugh, and fails.' }] },
    { id: 'eb.5', turns: [{ by: 'c', dr: "{a} and {b} have been fighting over a bed for twenty minutes. Nobody has even mentioned the vote." }] },
    { id: 'eb.6', turns: [{ by: 'a', say: "That's my drawer." }, { by: 'b', say: "It was empty." }, { by: 'a', say: "It was empty because I hadn't filled it yet." }] },
    { id: 'eb.7', turns: [{ by: 'b', dr: "{a} moved my things onto the floor. Who does that?" }] },
    { id: 'eb.8', turns: [{ by: 'c', say: "Can you two please go to sleep?" }, { by: 'a', say: "Tell {b}." }, { by: 'b', say: "Tell {a}." }] },
  ],
  'editorial.whisper.scene': [
    { id: 'ew.1', turns: [{ beat: '{a} and {b} stop talking the second {c} walks in.' }, { by: 'c', say: "What?" }, { by: 'a', say: "Nothing." }, { by: 'b', say: "Nothing." }] },
    { id: 'ew.2', turns: [{ by: 'a', say: "...so we can't tell {c}." }, { beat: '{c} is standing in the doorway.' }] },
    { id: 'ew.3', turns: [{ by: 'c', dr: "I walked in and {a} and {b} went silent. You don't go silent unless you're talking about someone in the room." }] },
    { id: 'ew.4', turns: [{ beat: '{c} walks in on {a} and {b}, heads close together.' }, { by: 'a', say: "Anyway, what should we make for dinner?" }, { by: 'c', say: "Nice try." }] },
    { id: 'ew.5', turns: [{ beat: '{c} lies very still in the next room, listening.' }, { by: 'c', dr: "They said my name. Twice." }] },
    { id: 'ew.6', turns: [{ by: 'b', say: "Were you listening?" }, { by: 'c', say: "Should I have been?" }] },
    { id: 'ew.7', turns: [{ by: 'c', dr: "Every time I walk into a room, {a} and {b} stop talking. Every single time." }] },
    { id: 'ew.8', turns: [{ by: 'a', say: "Hey, {c}! We were just..." }, { by: 'c', say: "Just what?" }, { by: 'a', say: "...Talking." }] },
  ],
  'editorial.latenight.scene': [
    { id: 'el.1', turns: [{ beat: '{a} burns a quesadilla at two in the morning.' }, { by: 'b', say: "I'll eat it." }, { by: 'c', say: "You'll eat anything." }, { by: 'b', say: "It's two in the morning. Yes." }] },
    { id: 'el.2', turns: [{ by: 'a', say: "What's left in the fridge?" }, { by: 'b', say: "Eggs, half an onion and some cheese." }, { by: 'c', say: "So, omelettes." }] },
    { id: 'el.3', turns: [{ by: 'c', say: "What time is it?" }, { by: 'a', say: "No idea." }, { by: 'b', say: "Late. Who cares." }, { beat: 'They keep talking anyway.' }] },
    { id: 'el.4', turns: [{ by: 'b', say: "Can I tell you something? I told you a little lie on day one." }, { by: 'a', say: "About what?" }, { by: 'b', say: "Nothing important. I just want to start fresh." }] },
    { id: 'el.5', turns: [{ by: 'c', dr: "Two in the morning in the kitchen is the best part of this house. Nobody's playing. We just talk." }] },
    { id: 'el.6', turns: [{ beat: '{c} does an impression of {a}. {a} walks in halfway through.' }, { by: 'a', say: "Is that meant to be me?" }, { by: 'c', say: "...Yes." }, { by: 'a', say: "Do it again. I want to see." }] },
    { id: 'el.7', turns: [{ by: 'a', say: "Keep it down. Production will tell us off." }, { by: 'c', say: "Too late." }] },
    { id: 'el.8', turns: [{ by: 'b', dr: "{a}, {c} and I ate cereal at the counter until it got light. I'll remember that more than any comp." }] },
  ],
  'editorial.spill.scene': [
    { id: 'es.1', turns: [{ by: 'a', say: "When {b} told me..." }, { beat: '{a} stops.' }, { by: 'b', say: "Don't." }, { by: 'c', dr: "Too late. I heard it." }] },
    { id: 'es.2', turns: [{ by: 'a', say: "Wait till you hear what {b} said yesterday." }, { by: 'b', say: "That was private." }, { beat: '{c} is listening from the sofa.' }] },
    { id: 'es.3', turns: [{ by: 'a', say: "...our final three..." }, { beat: 'Nobody speaks.' }, { by: 'c', say: "Our what?" }] },
    { id: 'es.4', turns: [{ by: 'b', say: "How did you find out about the plan?" }, { by: 'a', say: "{c} told me." }, { by: 'c', say: "I did not!" }] },
    { id: 'es.5', turns: [{ by: 'b', dr: "I told {a} one thing in private. Now {c} knows. Great." }] },
    { id: 'es.6', turns: [{ by: 'c', dr: "{a} let something slip about {b}. I'm going to hold on to that." }] },
    { id: 'es.7', turns: [{ by: 'b', say: "Can you keep anything to yourself?" }, { by: 'a', say: "I didn't mean to say it!" }, { by: 'b', say: "But you did." }] },
  ],
  'editorial.orbit.scene': [
    { id: 'eo.1', turns: [{ by: 'a', say: "Knock knock! Have you seen my water bottle?" }, { by: 'c', say: "That's the fourth time today, {a}. What do you actually want?" }] },
    { id: 'eo.2', turns: [{ beat: '{a} stretches out on the HOH bed. {b} walks past the open door twice.' }, { by: 'b', dr: "I just want five minutes alone with {c}. {a} won't leave." }] },
    { id: 'eo.3', turns: [{ by: 'a', say: "I brought you a coffee." }, { by: 'c', say: "Thanks." }, { by: 'b', say: "Can I talk to you after?" }, { by: 'c', say: "...Sure." }] },
    { id: 'eo.4', turns: [{ by: 'b', dr: "{a} has spent all afternoon in the HOH room. {a} has barely spoken to anyone else." }] },
    { id: 'eo.5', turns: [{ by: 'c', dr: "{a} keeps coming up here. {b} keeps waiting outside. Being HOH is a full-time job." }] },
    { id: 'eo.6', turns: [{ by: 'b', say: "Is {a} ever going to leave?" }, { by: 'c', say: "I honestly don't know." }] },
    { id: 'eo.7', turns: [{ by: 'a', say: "I'll get out of your way." }, { beat: '{a} does not get out of the way.' }, { by: 'b', dr: "Of course not." }] },
    { id: 'eo.8', turns: [{ by: 'b', dr: "Everyone saw how long {a} was up there with {c}. People are talking." }] },
  ],
  'editorial.apology.lands': [
    { id: 'ea.l1', turns: [{ by: 'a', say: "I was wrong. I shouldn't have snapped at you." }, { by: 'b', say: "...Thank you." }] },
    { id: 'ea.l2', turns: [{ beat: '{a} brings {b} a coffee.' }, { by: 'a', say: "I'm sorry. No excuses." }, { by: 'b', say: "I didn't expect that." }] },
    { id: 'ea.l3', turns: [{ by: 'a', say: "Can I have five minutes? I won't argue. I just want to say sorry." }, { by: 'b', say: "Go on." }] },
    { id: 'ea.l4', turns: [{ by: 'a', say: "It got personal and I took it too far." }, { by: 'b', say: "Yes, you did." }, { by: 'a', say: "I'm sorry." }, { by: 'b', say: "Okay. Let's start again." }] },
    { id: 'ea.l5', turns: [{ by: 'b', dr: "{a} apologised properly. I can tell when someone means it. {a} meant it." }] },
    { id: 'ea.l6', turns: [{ by: 'a', dr: "Saying sorry to {b} was hard. But it was the right thing to do." }] },
  ],
  'editorial.apology.fails': [
    { id: 'ea.f1', turns: [{ by: 'a', say: "I'm sorry. But you have to understand why I did it." }, { by: 'b', say: "Do I?" }] },
    { id: 'ea.f2', turns: [{ by: 'a', say: "It was just game." }, { by: 'b', say: "It didn't feel like game." }] },
    { id: 'ea.f3', turns: [{ by: 'a', say: "I'm sorry you took it that way." }, { by: 'b', say: "Stop. Come back when you can say what you actually did." }] },
    { id: 'ea.f4', turns: [{ by: 'a', say: "I'm sorry. So, are we good for the vote?" }, { by: 'b', say: "Wow. So that's what this was about." }] },
    { id: 'ea.f5', turns: [{ by: 'b', dr: "{a} said sorry and then explained why it wasn't {a.posAdj} fault. That's not an apology." }] },
    { id: 'ea.f6', turns: [{ by: 'a', dr: "I tried to apologise to {b}. It didn't go well." }] },
  ],
  'editorial.spark.scene': [
    { id: 'ek.1', turns: [{ by: 'a', say: "We're meant to be cleaning the pool." }, { by: 'b', say: "We are. Slowly." }, { beat: 'Their feet stay in the water for an hour.' }] },
    { id: 'ek.2', turns: [{ beat: '{a} takes {b}\'s sunglasses and runs.' }, { by: 'b', say: "Give them back!" }, { by: 'a', say: "Come and get them." }] },
    { id: 'ek.3', turns: [{ by: 'a', say: "Want me to do your shoulders? You're burning." }, { by: 'b', say: "...Sure." }, { beat: 'The conversation nearby trails off.' }] },
    { id: 'ek.4', turns: [{ beat: '{b} makes {a} laugh so hard {a} snorts.' }, { by: 'a', say: "Never tell anyone about that." }, { by: 'b', say: "I promise." }, { beat: '{b} is still laughing.' }] },
    { id: 'ek.5', turns: [{ by: 'a', dr: "I came in here to play a game. Spending all afternoon with {b} wasn't part of the plan." }] },
    { id: 'ek.6', turns: [{ by: 'b', dr: "Everyone in the backyard was watching me and {a}. I didn't even notice until later." }] },
    { id: 'ek.7', turns: [{ by: 'a', say: "You're trouble." }, { by: 'b', say: "You like it." }] },
  ],
  'editorial.flip.scene': [
    { id: 'ef.1', turns: [{ by: 'a', say: "The votes are there to get {target} out." }, { by: 'b', say: "Name them." }, { by: 'a', say: "Us, and {c} said..." }, { by: 'c', say: "I never said that." }] },
    { id: 'ef.2', turns: [{ by: 'a', say: "Who's the swing vote?" }, { by: 'b', say: "{c}." }, { by: 'c', say: "Me? I thought it was you." }] },
    { id: 'ef.3', turns: [{ beat: '{b} shuts the bedroom door.' }, { by: 'b', say: "If we're flipping this, I need both of you." }, { by: 'c', say: "Who else knows?" }] },
    { id: 'ef.4', turns: [{ by: 'a', say: "Getting {target} out is better for all three of us." }, { by: 'b', say: "Agreed." }, { by: 'c', say: "That was quick, {b}." }] },
    { id: 'ef.5', turns: [{ by: 'c', dr: "{a} and {b} want to flip the vote onto {target}. I'm not committing until I know who else is in." }] },
    { id: 'ef.6', turns: [{ by: 'a', dr: "If the three of us flip, {target} goes home. Now I just need them to stick to it." }] },
    { id: 'ef.7', turns: [{ by: 'b', say: "If this goes wrong, we're all next." }, { by: 'a', say: "It won't go wrong." }, { by: 'c', say: "That's what everyone says." }] },
  ],
  'editorial.roast.lands': [
    { id: 'er.l1', turns: [{ by: 'a', say: "This is {b} walking into a strategy talk." }, { beat: '{a} does the walk.' }, { by: 'c', say: "That's exactly it!" }, { by: 'b', say: "...Okay, that's fair." }] },
    { id: 'er.l2', turns: [{ by: 'a', say: "And the award for most dramatic veto speech goes to... {b}!" }, { by: 'b', say: "I want a recount!" }] },
    { id: 'er.l3', turns: [{ beat: '{a} pulls {b}\'s face for when someone has a bad plan.' }, { by: 'b', say: "I don't do that face." }, { beat: '{b} does the face.' }] },
    { id: 'er.l4', turns: [{ by: 'c', dr: "{a} did an impression of {b} and I nearly fell off the sofa. Even {b} laughed." }] },
    { id: 'er.l5', turns: [{ by: 'b', say: "Do me again." }, { by: 'a', say: "No. Once is enough." }] },
    { id: 'er.l6', turns: [{ by: 'b', dr: "{a} roasted me at dinner. I'll get {a} back. But it was funny." }] },
  ],
  'editorial.roast.cuts': [
    { id: 'er.c1', turns: [{ by: 'a', say: "{b} wins 'most likely to turn any conversation into a meeting'!" }, { beat: '{b} forces a smile.' }] },
    { id: 'er.c2', turns: [{ beat: 'Everyone laughs at {a}\'s joke about {b}. {b} goes quiet.' }, { by: 'c', dr: "That joke went too far. Everyone saw {b}'s face." }] },
    { id: 'er.c3', turns: [{ by: 'b', say: "Okay, that's enough." }, { by: 'a', say: "One more!" }, { by: 'b', say: "I said that's enough." }] },
    { id: 'er.c4', turns: [{ beat: '{b} leaves the table.' }, { by: 'c', say: "Nice one, {a}." }, { by: 'a', say: "What? It was a joke." }] },
    { id: 'er.c5', turns: [{ by: 'b', dr: "{a} thought that was funny. Making fun of me in front of everyone isn't funny." }] },
    { id: 'er.c6', turns: [{ by: 'a', dr: "I might have taken the joke about {b} a bit far." }] },
  ],
  'editorial.breakdown.scene': [
    { id: 'ed.1', turns: [{ beat: '{a} is crying in the storage room. {b} walks in, stops, then closes the door and sits down.' }, { by: 'b', say: "Hey. I'm here." }] },
    { id: 'ed.2', turns: [{ by: 'a', say: "This house is getting to me." }, { by: 'b', say: "I know. Talk to me." }, { beat: '{b} does not mention the game once.' }] },
    { id: 'ed.3', turns: [{ by: 'a', say: "I just miss home." }, { by: 'b', say: "I know. Take as long as you need." }] },
    { id: 'ed.4', turns: [{ by: 'a', say: "I'm scared I'm going home this week." }, { by: 'b', say: "Then say it out loud. It helps." }] },
    { id: 'ed.5', turns: [{ by: 'a', dr: "I cried in the storage room. {b} found me, and sat with me until I was ready to go back out." }] },
    { id: 'ed.6', turns: [{ by: 'b', dr: "I found {a} in tears in the storage room. I wasn't going to leave {a} like that." }] },
    { id: 'ed.7', turns: [{ by: 'b', say: "Want me to get you anything?" }, { by: 'a', say: "Just sit here a minute." }, { by: 'b', say: "Okay." }] },
  ],
  'editorial.meeting.scene': [
    { id: 'em.1', turns: [{ beat: '{a} opens the door without knocking. {b} and {c} stop talking and move apart.' }, { by: 'a', say: "Am I interrupting?" }, { by: 'b', say: "No!" }, { by: 'c', say: "No." }] },
    { id: 'em.2', turns: [{ by: 'b', say: "Perfect timing!" }, { beat: '{c} suddenly starts folding clothes.' }, { by: 'a', dr: "Perfect timing for what?" }] },
    { id: 'em.3', turns: [{ beat: '{a} sits down next to {b} and {c} and waits.' }, { by: 'b', say: "...Nice weather today." }, { by: 'a', dr: "They talked about the weather for ten minutes. We can't even see outside." }] },
    { id: 'em.4', turns: [{ by: 'a', dr: "{b} and {c} were counting votes. I saw them hide it when I walked in." }] },
    { id: 'em.5', turns: [{ by: 'a', say: "What were you two talking about?" }, { by: 'c', say: "Nothing much." }, { by: 'a', say: "It didn't look like nothing much." }] },
    { id: 'em.6', turns: [{ by: 'b', dr: "{a} walked in at the worst moment. Now {a} knows something is going on." }] },
    { id: 'em.7', turns: [{ by: 'a', say: "Don't stop on my account." }, { by: 'b', say: "We weren't doing anything." }, { by: 'a', say: "Right." }] },
  ],
  'editorial.standoff.scene': [
    { id: 'eq.1', turns: [{ beat: '{a} pours coffee for everyone except {b}.' }, { by: 'b', dr: "Fine. I can pour my own coffee." }] },
    { id: 'eq.2', turns: [{ beat: '{a} and {b} wipe opposite ends of the counter. They meet in the middle. Neither moves.' }, { by: 'a', say: "Excuse me." }, { by: 'b', say: "No, excuse me." }] },
    { id: 'eq.3', turns: [{ by: 'b', say: "Anyone want to use the pool?" }, { beat: '{a} answers somebody else.' }, { by: 'b', dr: "Everyone noticed {a} ignore me. Good." }] },
    { id: 'eq.4', turns: [{ beat: '{a} changes seats when {b} sits down.' }, { by: 'b', say: "Is there a problem?" }, { by: 'a', say: "No." }] },
    { id: 'eq.5', turns: [{ by: 'a', dr: "I'm not speaking to {b}. {b} knows why." }] },
    { id: 'eq.6', turns: [{ by: 'b', dr: "{a} has been freezing me out for days. Two can play that game." }] },
    { id: 'eq.7', turns: [{ by: 'b', say: "Can you pass the milk?" }, { beat: '{a} slides it across without looking up.' }] },
  ],
};
