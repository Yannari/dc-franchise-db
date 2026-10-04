// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/teamact.js — Team America, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Three houseguests the audience made a secret team, sent a mission a week
// (written by bb/script/ceremony.js). Anything about the team or the mission
// is said in the Diary Room. What a mission DOES happens in the open house,
// so those scenes are the house's, and nobody in them knows they were steered.
//
//   teamact.opening   a, b, c are told they are a team (DR)              scene
//   teamact.mission   a hears the week's mission (DR)                    scene
//   teamact.done      a pulled it off (DR); b is a teammate              scene
//   teamact.failed    a could not make it work (DR)                      scene
//   teamact.noticed   a has sensed somebody steering the house           scene
//   teamact.effect    what the mission did, played by the people in it   rumour | saboteur | block | argument | costume | meeting | expose | deal

export default {
  'teamact.opening.scene': [
    { id: 'ta7.o1', turns: [{ by: 'a', dr: "America put me on a team with {b} and {c}. I didn't pick them. Nobody's supposed to know." }] },
    { id: 'ta7.o2', turns: [{ by: 'a', dr: "Me, {b} and {c}? We've barely spoken. Now we're a secret team." }] },
    { id: 'ta7.o3', turns: [{ by: 'a', dr: "A team I didn't choose, missions I can't refuse, and a house I can't tell. Okay." }] },
  ],
  'teamact.mission.scene': [
    { id: 'ta7.m1', turns: [{ by: 'a', dr: "New mission. If we pull it off, we get paid. If we get caught, we're in trouble." }] },
    { id: 'ta7.m2', turns: [{ by: 'a', dr: "This week's mission is a hard one. We'll have to be careful." }] },
    { id: 'ta7.m3', turns: [{ by: 'a', dr: "Another mission. The more we pull off, the more we look like a group. That's the problem." }] },
  ],
  'teamact.done.scene': [
    { id: 'ta7.d1', turns: [{ by: 'a', dr: "Mission complete. Nobody in the house has any idea we did it." }] },
    { id: 'ta7.d2', turns: [{ by: 'a', dr: "{b} and I pulled it off. Getting paid for something nobody even noticed. I love this." }] },
    { id: 'ta7.d3', turns: [{ by: 'a', dr: "Done. I'm getting good at this, which is a little worrying." }] },
  ],
  'teamact.failed.scene': [
    { id: 'ta7.f1', turns: [{ by: 'a', dr: "I got it almost all the way there. Almost doesn't count." }] },
    { id: 'ta7.f2', turns: [{ by: 'a', dr: "That one didn't work. We'll get the next one." }] },
  ],
  'teamact.noticed.scene': [
    { id: 'ta7.n1', turns: [{ by: 'a', dr: "Something's off this week. It feels like someone's pulling strings. I just don't know who." }] },
    { id: 'ta7.n2', turns: [{ by: 'a', say: "Has anyone else noticed how weird this week has been?" }] },
  ],
  'teamact.effect.rumour': [
    { id: 'ta7.r1', turns: [{ by: 'a', say: "Did you hear about {c}?" }, { by: 'b', say: "No. What about {c}?" }, { by: 'b', dr: "That's the rumour we started. It came back to me." }] },
    { id: 'ta7.r2', turns: [{ by: 'a', say: "Apparently {c} has been lying to everyone." }, { by: 'b', say: "Really? Who told you that?" }] },
  ],
  'teamact.effect.saboteur': [
    { id: 'ta7.s1', turns: [{ by: 'a', say: "Why is everyone looking at me like that?" }, { by: 'b', dr: "The house thinks {a} is working against it. Perfect." }] },
    { id: 'ta7.s2', turns: [{ by: 'a', dr: "Everyone's decided I'm the one causing trouble. I haven't done anything!" }] },
  ],
  'teamact.effect.block': [
    { id: 'ta7.b1', turns: [{ by: 'a', say: "Me? Nobody even mentioned my name this week." }, { by: 'c', say: "It was my decision." }] },
    { id: 'ta7.b2', turns: [{ by: 'b', dr: "I was sure I was going up. Then {c} named {a} instead. I'll take it." }] },
  ],
  'teamact.effect.argument': [
    { id: 'ta7.a1', turns: [{ by: 'a', say: "You said what about me?" }, { by: 'b', say: "I didn't say anything!" }, { beat: 'The kitchen goes quiet.' }] },
    { id: 'ta7.a2', turns: [{ by: 'b', say: "Don't talk to me like that." }, { by: 'a', say: "Then stop talking about me!" }] },
  ],
  'teamact.effect.costume': [
    { id: 'ta7.c1', turns: [{ by: 'b', say: "I'm wearing this all day. It was my idea." }, { by: 'a', dr: "It was not {b}'s idea." }] },
    { id: 'ta7.c2', turns: [{ by: 'b', say: "Honestly, I think it suits me." }] },
  ],
  'teamact.effect.meeting': [
    { id: 'ta7.e1', turns: [{ by: 'a', say: "So, what's everyone doing later?" }, { by: 'b', say: "Nothing much." }, { by: 'c', say: "Same." }, { by: 'a', dr: "Ten minutes, in front of everybody. Nobody blinked." }] },
  ],
  'teamact.effect.expose': [
    { id: 'ta7.x1', turns: [{ by: 'a', say: "Wait. You two have a final two?" }, { by: 'b', say: "Who told you that?" }] },
    { id: 'ta7.x2', turns: [{ by: 'a', dr: "{b} and {c} promised each other the end. Now I know." }] },
  ],
  'teamact.effect.deal': [
    { id: 'ta7.l1', turns: [{ by: 'a', say: "Final two?" }, { by: 'b', say: "Final two." }, { by: 'a', say: "Say it again." }, { by: 'b', say: "Final two." }] },
    { id: 'ta7.l2', turns: [{ by: 'b', dr: "{a} and I shook on the end. I don't even remember whose idea it was." }] },
  ],
};
