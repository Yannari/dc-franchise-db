// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-teach.js — a teaching moment that says what they're doing and why
// ══════════════════════════════════════════════════════════════════════
// camp-events.js teachingMoment: a (strong in the stat: physical, strategic or mental, 7+) teaches
// b (5 or less in it); ending is the stat. The engine moves the bond (+0.5 each way). The user,
// 2026-10-08: "does the teaching moment have a setup? There was no context of what they were
// doing". So each scene opens on the actual thing (a climb, a carry, a knot, a memory trick, a
// vote count), says why now (b keeps struggling at it, the next challenge), and ends on what it
// means between them. Venue-neutral. Ids: 'nte.'.

export default {
  'long.friend.teach.physical': [
    { id: 'nte.p1', turns: [
      { beat: "{b} is trying to haul the full water container back to camp and has had to put it down three times. {a} catches up." },
      { by: 'a', say: "You're carrying it with your arms. That's why you keep stopping." },
      { by: 'b', say: "What else am I supposed to carry it with?" },
      { by: 'a', say: "Your legs. Bend down, keep it close to your chest, and stand up with your back straight." },
      { by: 'b', say: "That sounds like a lot of instructions for a bucket." },
      { by: 'a', say: "Try it once." },
      { beat: "{b} tries it. The container comes up off the ground without a fight." },
      { by: 'b', say: "Oh, that's so much easier. Why is that so much easier?" },
      { by: 'a', say: "Because you're not fighting it anymore. Do that in the next challenge and you won't be the one we're waiting for." },
      { by: 'b', say: "Was I the one you were waiting for last time?" },
      { by: 'a', say: "...A little. Not after today." },
      { by: 'b', conf: "{a} could have just let me struggle and used it against me at a vote. Instead {a} showed me how to lift a bucket. I'm not forgetting that." },
    ] },
    { id: 'nte.p2', turns: [
      { beat: "{b} has been trying to climb the same tree for a coconut, or anything, for ten minutes, and keeps sliding back down." },
      { by: 'a', say: "Stop. You're climbing with your hands." },
      { by: 'b', say: "That's how climbing works." },
      { by: 'a', say: "Your hands hold on. Your feet do the climbing. Push up with your feet, then move your hands." },
      { by: 'b', say: "Feet, then hands." },
      { by: 'a', say: "Feet, then hands. Slowly. You're not racing anybody." },
      { beat: "{b} gets twice as high as before, then looks down and grips the trunk." },
      { by: 'b', say: "Okay, I'm high, I'm very high, and I did it." },
      { by: 'a', say: "You did it. Now come down the same way, feet first." },
      { by: 'a', conf: "If {b} gets better at this stuff, the whole team gets better. That's not charity. That's just me wanting to win." },
    ] },
    { id: 'nte.p3', when: { voice: ['tough', 'competitive', 'bossy'] }, turns: [
      { beat: "Early morning. {a} has {b} running the same stretch of camp, back and forth." },
      { by: 'b', say: "How many more?" },
      { by: 'a', say: "Until you stop slowing down at the turn." },
      { by: 'b', say: "Everybody slows down at the turn!" },
      { by: 'a', say: "And everybody loses a second there. You're losing three. Lean into it." },
      { by: 'b', say: "Are you training me or punishing me?" },
      { by: 'a', say: "Both. Now do it again." },
      { beat: "{b} runs it again and takes the turn without slowing down." },
      { by: 'a', say: "There, that's it, that's the one." },
      { by: 'b', conf: "{a} is a nightmare coach, and I'm faster than I was yesterday. I hate that those are both true." },
    ] },
  ],
  'long.friend.teach.mental': [
    { id: 'nte.m1', turns: [
      { beat: "{b} is muttering a list of words under {b.posAdj} breath, then losing track halfway, over and over." },
      { by: 'a', say: "What are you doing?" },
      { by: 'b', say: "Practising for when they make us memorise something. I always lose it after five." },
      { by: 'a', say: "Don't remember a list. Make it a story." },
      { by: 'b', say: "A story?" },
      { by: 'a', say: "The red rock walks to the big tree to meet the blue shell. Now it's one thing, not three." },
      { by: 'b', say: "That's so stupid." },
      { by: 'a', say: "It's stupid, and you'll remember it tomorrow. Try it." },
      { beat: "{b} makes up a ridiculous story about ten things and gets all ten, in order." },
      { by: 'b', conf: "{a} turned shells into a soap opera and now I can remember things. I don't understand how, and I don't care, because it works." },
    ] },
    { id: 'nte.m2', turns: [
      { beat: "{b} is staring at a scrap of puzzle {b} has drawn in the dirt with a stick." },
      { by: 'b', say: "I don't get puzzles. I never have." },
      { by: 'a', say: "Can I show you something? Don't look at the whole thing. Find the corners first." },
      { by: 'b', say: "There are four corners. That's not the hard part." },
      { by: 'a', say: "Exactly. Do the easy part first, so the hard part gets smaller." },
      { by: 'b', say: "That's it? That's the secret?" },
      { by: 'a', say: "That's most of it. The rest is not panicking when you're stuck." },
      { by: 'b', say: "I always panic when I'm stuck." },
      { by: 'a', say: "Then next time, look at me, and I'll make a face at you until you stop." },
      { by: 'b', conf: "Nobody's ever explained puzzles to me like that before. Or made a face at me to help. {a} did both." },
    ] },
  ],
  'long.friend.teach.strategic': [
    { id: 'nte.s1', turns: [
      { beat: "{b} has been asking everybody the same question all morning. {a} pulls {b} aside." },
      { by: 'a', say: "You've asked four people who they're voting for today." },
      { by: 'b', say: "I just want to know where I stand." },
      { by: 'a', say: "And now four people know you're scared. Don't ask what they're doing. Ask what they're worried about." },
      { by: 'b', say: "What's the difference?" },
      { by: 'a', say: "People lie about what they're doing. They tell the truth about what scares them, and that tells you everything." },
      { by: 'b', say: "That's actually really smart." },
      { by: 'a', say: "Don't tell anybody I told you." },
      { by: 'b', conf: "{a} just taught me more about this game in five minutes than I've learned all week. I should probably be worried about how good {a} is at it." },
      { by: 'a', conf: "If {b} plays smarter, {b} is more use to me. And if {b} remembers who taught {b.obj}, even better." },
    ] },
    { id: 'nte.s2', turns: [
      { by: 'b', say: "Can you explain the votes to me? Like, how you know who's going?" },
      { by: 'a', say: "Sit down. Who did everybody sit with at dinner last night?" },
      { by: 'b', say: "I don't know. I wasn't watching." },
      { by: 'a', say: "Start watching. Who sits with who, who goes for walks, who stops talking when you come over." },
      { by: 'b', say: "And that tells you the vote?" },
      { by: 'a', say: "It tells you the groups. Count the groups, and the vote counts itself." },
      { by: 'b', say: "So who's in my group?" },
      { by: 'a', say: "Right now? Mostly me." },
      { by: 'b', conf: "{a} taught me how to count a vote, and then told me I'm only safe because of {a.obj}. I think that was the real lesson." },
    ] },
  ],
};
