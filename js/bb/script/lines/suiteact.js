// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/suiteact.js — the Safety Suite act, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// What houseguests say while the suite runs. Big Brother's own lines (the
// rules, "the suite is closed") are the format's words and live in the
// viewer's steps; these are the people. Written by bb/script/ceremony.js.
//
//   suiteact.open     a is thinking about swiping; b is the HOH          hoh | plain
//   suiteact.enter    a says why, then swipes                           first | next
//   suiteact.hold     a keeps the pass (Diary Room)                     scene
//   suiteact.short    a ran it and came up short                       scene
//   suiteact.slow     a beat the clock, but somebody was faster          scene
//   suiteact.clock    a, the best of them, still lost to the clock      solo | many
//   suiteact.safe     a beat the clock                                  scene
//   suiteact.plus     a names b as the Plus One; b hears the price      slop | costume | solitary | chore
//   suiteact.passed   a was next on b's list and was not picked (DR)    scene
//   suiteact.none     nobody swiped; a explains why not (DR)            scene

export default {
  'suiteact.open.hoh': [
    { id: 'sv7.o1', turns: [{ by: 'b', say: "Not me, obviously. I'm already safe." }, { by: 'a', say: "Thanks for that." }] },
    { id: 'sv7.o2', turns: [{ by: 'a', say: "One pass for the whole season? So if I use it now, it's gone." }, { by: 'b', say: "Sounds like a you problem." }] },
    { id: 'sv7.o3', turns: [{ by: 'b', say: "Good luck, everyone. I mean it. Mostly." }, { by: 'a', dr: "Easy for the HOH to say. Nobody can touch {b} this week." }] },
    { id: 'sv7.o4', turns: [{ by: 'a', say: "Whoever swipes is basically saying they think they're going up." }, { by: 'b', say: "I'll be watching who swipes, then." }] },
    { id: 'sv7.o5', turns: [{ by: 'a', dr: "If I swipe, {b} knows I'm scared. If I don't, I might not need to be scared. I hate this." }] },
    { id: 'sv7.o6', turns: [{ by: 'b', say: "Take your time. I've got all week." }, { by: 'a', say: "Very funny." }] },
  ],
  'suiteact.open.plain': [
    { id: 'sv7.p1', turns: [{ by: 'a', say: "One pass for the whole season? So if I use it now, it's gone." }] },
    { id: 'sv7.p2', turns: [{ by: 'a', dr: "Whoever swipes is telling the house they think they're going up." }] },
    { id: 'sv7.p3', turns: [{ by: 'a', say: "Nobody move. Let's see who blinks first." }] },
    { id: 'sv7.p4', turns: [{ by: 'a', dr: "One hour to decide whether this is the worst week I'll have. No pressure." }] },
    { id: 'sv7.p5', turns: [{ by: 'a', say: "So who's going first?" }, { beat: 'Nobody answers.' }] },
    { id: 'sv7.p6', turns: [{ by: 'a', dr: "Use it now, and I've got nothing left later. Save it, and I might not make it to later." }] },
  ],
  'suiteact.enter.first': [
    { id: 'sv7.e1', turns: [{ by: 'a', say: "I'd rather spend it now than go home with it in my pocket." }] },
    { id: 'sv7.e2', turns: [{ by: 'a', say: "Somebody has to go first. Fine. Me." }] },
    { id: 'sv7.e3', turns: [{ by: 'a', dr: "Everyone's going to read this as me being scared. They're right." }] },
    { id: 'sv7.e4', turns: [{ by: 'a', say: "Don't look at me like that. I'm not waiting around to find out." }] },
    { id: 'sv7.e5', turns: [{ by: 'a', dr: "I know where I stand with the HOH this week. That's why I'm swiping." }] },
    { id: 'sv7.e6', turns: [{ by: 'a', say: "Here goes my one chance." }] },
  ],
  'suiteact.enter.next': [
    { id: 'sv7.n1', turns: [{ by: 'a', say: "If they're going in, I'm going in." }] },
    { id: 'sv7.n2', turns: [{ by: 'a', dr: "I watched who swiped before me. Now I know who I'm up against." }] },
    { id: 'sv7.n3', turns: [{ by: 'a', say: "Yeah, all right. Me too." }] },
    { id: 'sv7.n4', turns: [{ by: 'a', say: "I'm not sitting out while everyone else plays for safety." }] },
    { id: 'sv7.n5', turns: [{ by: 'a', dr: "This might be a mistake. I'm doing it anyway." }] },
    { id: 'sv7.n6', turns: [{ by: 'a', say: "Save me a spot." }] },
  ],
  'suiteact.hold.scene': [
    { id: 'sv7.h1', turns: [{ by: 'a', dr: "Mine's still in my pocket. If I go up this week, I can win the vote. I'm saving this for a worse week." }] },
    { id: 'sv7.h2', turns: [{ by: 'a', dr: "Everyone who swiped just told the house they're scared. I didn't tell anyone anything." }] },
    { id: 'sv7.h3', turns: [{ by: 'a', dr: "One pass. One season. This isn't the week." }] },
    { id: 'sv7.h4', turns: [{ by: 'a', dr: "I want to swipe so badly. I'm not going to. Ask me again in a month." }] },
    { id: 'sv7.h5', turns: [{ by: 'a', dr: "If I'm wrong about this week, I'll regret it. I don't think I'm wrong." }] },
    { id: 'sv7.h6', turns: [{ by: 'a', dr: "Keeping it. A pass is worth more when everyone else has used theirs." }] },
  ],
  'suiteact.short.scene': [
    { id: 'sv7.s1', turns: [{ by: 'a', say: "Come on, come on— no!" }, { by: 'a', dr: "I spent my only pass on that." }] },
    { id: 'sv7.s2', turns: [{ by: 'a', say: "You're kidding me. That close?" }] },
    { id: 'sv7.s3', turns: [{ by: 'a', say: "No, no, no!" }, { by: 'a', dr: "No pass, no safety. Brilliant week." }] },
    { id: 'sv7.s4', turns: [{ by: 'a', dr: "I wasn't fast enough. And now I've got nothing left for the rest of the season." }] },
    { id: 'sv7.s5', turns: [{ by: 'a', say: "That clock was not fair." }] },
    { id: 'sv7.s6', turns: [{ by: 'a', dr: "I'll be nominated now, won't I. And I can't even try again." }] },
  ],
  'suiteact.slow.scene': [
    { id: 'sv7.w1', turns: [{ by: 'a', say: "I beat the clock! Wait. Somebody beat it faster?" }] },
    { id: 'sv7.w2', turns: [{ by: 'a', dr: "I beat the clock and I'm still not safe. Second fastest gets you nothing." }] },
    { id: 'sv7.w3', turns: [{ by: 'a', say: "That was fast enough. Just not fast enough." }] },
    { id: 'sv7.w4', turns: [{ by: 'a', dr: "My pass is gone, I beat the clock, and somebody else is safe. Great." }] },
    { id: 'sv7.w5', turns: [{ by: 'a', say: "So close." }, { by: 'a', dr: "Beating the clock doesn't matter if somebody beats you." }] },
    { id: 'sv7.w6', turns: [{ by: 'a', dr: "I did everything right in there. Somebody just did it quicker." }] },
  ],
  'suiteact.clock.solo': [
    { id: 'sv7.c1', turns: [{ by: 'a', say: "Nobody to beat but the clock, and I still lost." }, { by: 'a', dr: "No safety, no pass. What a week." }] },
    { id: 'sv7.c2', turns: [{ by: 'a', dr: "I was the only one in there. I still couldn't do it." }] },
    { id: 'sv7.c3', turns: [{ by: 'a', say: "Seriously? One person, one clock, and the clock wins?" }] },
    { id: 'sv7.c4', turns: [{ by: 'a', dr: "I walked in alone and walked out with nothing." }] },
    { id: 'sv7.c5', turns: [{ by: 'a', say: "Don't. Nobody say anything." }] },
    { id: 'sv7.c6', turns: [{ by: 'a', dr: "I gambled my only pass and lost to a clock." }] },
  ],
  'suiteact.clock.many': [
    { id: 'sv7.m1', turns: [{ by: 'a', say: "None of us beat it? None?" }, { by: 'a', dr: "Every pass in that room, gone for nothing." }] },
    { id: 'sv7.m2', turns: [{ by: 'a', dr: "I was the fastest in there, and I'm still not safe." }] },
    { id: 'sv7.m3', turns: [{ by: 'a', say: "Best of a bad bunch. Great." }] },
    { id: 'sv7.m4', turns: [{ by: 'a', dr: "The clock beat all of us. Nobody walks out of there safe this week." }] },
    { id: 'sv7.m5', turns: [{ by: 'a', say: "So that was a waste of everyone's pass." }] },
    { id: 'sv7.m6', turns: [{ by: 'a', dr: "I came closest. That counts for absolutely nothing." }] },
  ],
  'suiteact.safe.scene': [
    { id: 'sv7.y1', turns: [{ by: 'a', say: "Yes! Yes!" }] },
    { id: 'sv7.y2', turns: [{ by: 'a', say: "I did it. I actually did it." }, { by: 'a', dr: "Safe. Nobody can put me up this week." }] },
    { id: 'sv7.y3', turns: [{ by: 'a', dr: "Best use of a pass anyone's ever made in this house." }] },
    { id: 'sv7.y4', turns: [{ by: 'a', say: "Safe! I'm safe!" }] },
    { id: 'sv7.y5', turns: [{ by: 'a', dr: "I didn't look at the clock once. Didn't need to." }] },
    { id: 'sv7.y6', turns: [{ by: 'a', say: "Oh, thank goodness." }, { by: 'a', dr: "Now I just have to pick someone to save. That's the hard part." }] },
  ],
  'suiteact.plus.slop': [
    { id: 'sv7.l1', turns: [{ by: 'a', say: "{b}. You're my Plus One." }, { by: 'b', say: "Slop. For a whole week." }, { by: 'a', say: "You're welcome?" }, { by: 'b', say: "No, thank you. Really. I'm just hungry already." }] },
    { id: 'sv7.l2', turns: [{ by: 'a', say: "{b}, you're safe with me." }, { by: 'b', say: "And on slop, apparently." }, { by: 'a', say: "Safe and on slop beats nominated." }] },
    { id: 'sv7.l3', turns: [{ by: 'a', say: "I'm picking {b}." }, { by: 'b', say: "Thank you. I'll be thinking of you every time I eat that." }] },
    { id: 'sv7.l4', turns: [{ by: 'a', say: "{b}. Sorry about the food." }, { by: 'b', say: "I'll live. That's the point." }] },
    { id: 'sv7.l5', turns: [{ by: 'a', say: "My Plus One is {b}." }, { by: 'b', dr: "A week of slop to stay off the block. Worth it." }] },
    { id: 'sv7.l6', turns: [{ by: 'a', say: "{b}, you're coming with me." }, { by: 'b', say: "Where? To the slop?" }, { by: 'a', say: "To safety. Via the slop." }] },
  ],
  'suiteact.plus.costume': [
    { id: 'sv7.k1', turns: [{ by: 'a', say: "{b}. You're my Plus One." }, { by: 'b', say: "And I have to wear that?" }, { by: 'a', say: "All week." }] },
    { id: 'sv7.k2', turns: [{ by: 'a', say: "{b}, you're safe." }, { by: 'b', say: "In a costume." }, { by: 'a', say: "Safe in a costume." }] },
    { id: 'sv7.k3', turns: [{ by: 'a', say: "I'm picking {b}." }, { by: 'b', dr: "Everyone's going to laugh at me all week. Better than everyone voting me out." }] },
    { id: 'sv7.k4', turns: [{ by: 'a', say: "{b}. Sorry about the outfit." }, { by: 'b', say: "You're not sorry." }, { by: 'a', say: "I'm a little bit sorry." }] },
    { id: 'sv7.k5', turns: [{ by: 'a', say: "My Plus One is {b}." }, { by: 'b', say: "I'll wear it with pride. Sort of." }] },
    { id: 'sv7.k6', turns: [{ by: 'a', say: "{b}, you're with me." }, { by: 'b', dr: "Safe, and dressed like an idiot. I'll take it." }] },
  ],
  'suiteact.plus.solitary': [
    { id: 'sv7.t1', turns: [{ by: 'a', say: "{b}. You're my Plus One." }, { by: 'b', say: "A night on my own. Fine." }] },
    { id: 'sv7.t2', turns: [{ by: 'a', say: "{b}, you're safe." }, { by: 'b', say: "And locked away for a night." }, { by: 'a', say: "One night. Then you're back, and safe." }] },
    { id: 'sv7.t3', turns: [{ by: 'a', say: "I'm picking {b}." }, { by: 'b', dr: "A night away from every conversation. I'll miss a lot. I'll still be here." }] },
    { id: 'sv7.t4', turns: [{ by: 'a', say: "{b}. Sorry about the night alone." }, { by: 'b', say: "I've spent worse nights in here." }] },
    { id: 'sv7.t5', turns: [{ by: 'a', say: "My Plus One is {b}." }, { by: 'b', say: "Bring me back some gossip." }] },
    { id: 'sv7.t6', turns: [{ by: 'a', say: "{b}, you're with me." }, { by: 'b', dr: "I'll be on my own all night, wondering what everyone's saying. Still safe, though." }] },
  ],
  'suiteact.plus.chore': [
    { id: 'sv7.r1', turns: [{ by: 'a', say: "{b}. You're my Plus One." }, { by: 'b', say: "And every dish in the house." }, { by: 'a', say: "Every single one." }] },
    { id: 'sv7.r2', turns: [{ by: 'a', say: "{b}, you're safe." }, { by: 'b', say: "And on chores. By myself." }, { by: 'a', say: "Think of it as a workout." }] },
    { id: 'sv7.r3', turns: [{ by: 'a', say: "I'm picking {b}." }, { by: 'b', dr: "I'll be scrubbing pans all week. On the plus side, I won't be on the block." }] },
    { id: 'sv7.r4', turns: [{ by: 'a', say: "{b}. Sorry about the washing up." }, { by: 'b', say: "Everyone's going to use every plate on purpose now." }] },
    { id: 'sv7.r5', turns: [{ by: 'a', say: "My Plus One is {b}." }, { by: 'b', say: "Fine. Nobody touch the kitchen." }] },
    { id: 'sv7.r6', turns: [{ by: 'a', say: "{b}, you're with me." }, { by: 'b', dr: "Every chore in the house. It's worth it." }] },
  ],
  'suiteact.passed.scene': [
    { id: 'sv7.x1', turns: [{ by: 'a', dr: "The next name on that list was mine. I could see it on {b}'s face. Now I'm not safe, and {b} knows I know." }] },
    { id: 'sv7.x2', turns: [{ by: 'a', dr: "{b} had one person to save, and it wasn't me. Good to know where I stand." }] },
    { id: 'sv7.x3', turns: [{ by: 'a', dr: "I thought {b} might pick me. I was wrong." }] },
    { id: 'sv7.x4', turns: [{ by: 'a', dr: "Second choice doesn't count for anything in this house." }] },
    { id: 'sv7.x5', turns: [{ by: 'a', dr: "{b} picked someone else. I'll remember that when it's my turn to pick." }] },
    { id: 'sv7.x6', turns: [{ by: 'a', dr: "Not picked. Not safe. Not happy." }] },
  ],
  'suiteact.none.scene': [
    { id: 'sv7.z1', turns: [{ by: 'a', dr: "Nobody swiped. Everyone in this house thinks they're fine this week. Someone's wrong." }] },
    { id: 'sv7.z2', turns: [{ by: 'a', dr: "An hour of everyone staring at each other. Not one person went in." }] },
    { id: 'sv7.z3', turns: [{ by: 'a', dr: "I wasn't going to be the first one to look scared. Neither was anyone else." }] },
    { id: 'sv7.z4', turns: [{ by: 'a', dr: "My pass is still in my pocket. So is everyone's. That says a lot about this house." }] },
    { id: 'sv7.z5', turns: [{ by: 'a', dr: "Not this week. I'm saving it." }] },
    { id: 'sv7.z6', turns: [{ by: 'a', dr: "Whoever goes up this week is going to wish they'd swiped." }] },
  ],
};
