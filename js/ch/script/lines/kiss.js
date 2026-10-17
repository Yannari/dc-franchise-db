// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/kiss.js — the drunk kiss, and the morning after it
// ══════════════════════════════════════════════════════════════════════
//
// party.js nightDrama (5) and kissFallout. The partner is called by name, never "boyfriend" or "girlfriend":
// the roster does not always say.
//   party-kiss.single   a kisses b at the club; neither is anybody's
//   party-kiss.cheat    a is with {target}, who is in the house and did not see it
//   party-kiss.home     a has {home} waiting outside the show
//   party-kiss.caught   c, a's partner, saw it at the club
//   party-kiss.blowup   c saw it, and it went off in the middle of the club
//   kiss-fallout.*      the next morning: a was cheated on, b kissed a's partner c, d saw it and told (d may be gone).
//                       breakup: a ends it with c. stays: they stay together, and b is a's enemy now.
export default {
  'party-kiss.single': [
    { id: 'ks.s1', turns: [
      { beat: 'On the dance floor, {a} and {b} get a little closer with every song.' },
      { by: 'b', say: "You're a terrible dancer, you know that?" },
      { by: 'a', say: "Then why are you still dancing with me?" },
      { beat: '{a} kisses {b}. The people around them start cheering.' },
      { by: 'b', say: "Okay. That just happened." },
      { by: 'a', say: "Yeah. It did." },
      { by: 'a', conf: "I've had a few drinks, but I meant it. I'll find out tomorrow if {b} did." },
    ] },
    { id: 'ks.s2', turns: [
      { beat: 'Outside the club, waiting for the cars, {a} and {b} sit on the curb.' },
      { by: 'a', say: "Can I tell you something stupid?" },
      { by: 'b', say: "You always do." },
      { by: 'a', say: "I've wanted to do this for about two weeks." },
      { beat: '{a} leans over and kisses {b}.' },
      { by: 'b', say: "That wasn't stupid." },
      { by: 'b', conf: "{a} kissed me outside a club in front of half the house. Tomorrow everybody is going to have an opinion about it, and I don't care." },
    ] },
    { id: 'ks.s3', turns: [
      { beat: 'The DJ puts on a slow song. {a} holds out a hand, and {b} takes it.' },
      { by: 'b', say: "I don't slow dance." },
      { by: 'a', say: "You're doing it right now." },
      { by: 'b', say: "Because you're very persuasive after four shots of tequila." },
      { beat: 'Halfway through the song, {a} kisses {b}.' },
      { by: 'b', say: "Okay. I didn't see that coming." },
      { by: 'a', conf: "Tequila, a slow song, and {b}. I'm still working out which one of those was the bad idea." },
      { by: 'b', conf: "It wasn't a bad idea. It was a drunk idea. Those are different things, and I'd do it again." },
    ] },
  ],
  'party-kiss.cheat': [
    { id: 'ks.c1', turns: [
      { beat: 'In a dark corner of the club, {a} and {b} are standing much too close.' },
      { by: 'b', say: "What about {target}?" },
      { by: 'a', say: "{target} isn't here." },
      { by: 'b', say: "That's not what I asked." },
      { beat: '{a} kisses {b} anyway.' },
      { by: 'a', conf: "I'm with {target}. I just kissed {b}. I'm going to wake up tomorrow and hate myself, and I still did it." },
    ] },
    { id: 'ks.c2', turns: [
      { by: 'a', say: "Nobody's watching." },
      { by: 'b', say: "Somebody is always watching in this place." },
      { beat: 'They kiss by the bathrooms, and then {b} pulls away first.' },
      { by: 'b', conf: "{a} is with {target}. Everybody knows that. {a} kissed me anyway, and I let it happen. Now I'm scared of breakfast." },
    ] },
  ],
  'party-kiss.home': [
    { id: 'ks.h1', turns: [
      { beat: 'At the back of the club, {a} and {b} are standing very close.' },
      { by: 'a', say: "This is a terrible idea." },
      { by: 'b', say: "Then stop." },
      { beat: '{a} does not stop. {a} kisses {b}.' },
      { by: 'a', conf: "{home} is at home, and {home} is going to watch this. I knew that when I did it. I did it anyway." },
    ] },
    { id: 'ks.h2', turns: [
      { beat: 'Late in the night, {a} pulls {b} onto the dance floor and kisses {b} in the middle of it.' },
      { by: 'b', say: "What about {home}?" },
      { by: 'a', say: "Please don't say that name right now." },
      { by: 'b', conf: "{a} has {home} at home, and {a} kissed me in front of everybody. I'm not the one who has to explain that." },
    ] },
  ],
  'party-kiss.caught': [
    { id: 'ks.k1', turns: [
      { beat: '{a} kisses {b} at the bar. When {a} turns round, {c} is standing right there.' },
      { by: 'c', say: "Seriously, {a}?" },
      { by: 'a', say: "{c}, it's not what it looks like." },
      { by: 'c', say: "It's exactly what it looks like." },
      { beat: '{c} walks out of the club without another word.' },
      { by: 'b', conf: "I knew {a} and {c} were together. I didn't know {c} was still in the club. I don't think {a} did either." },
    ] },
    { id: 'ks.k2', turns: [
      { beat: '{a} kisses {b} by the bar, just as {c} comes back through the crowd.' },
      { by: 'c', say: "I went to the bathroom. I was gone for five minutes." },
      { by: 'a', say: "I'm sorry. I'm drunk. It didn't mean anything." },
      { by: 'c', say: "It meant something to me." },
      { by: 'b', say: "I'm going to go." },
      { by: 'c', say: "Yeah. You are." },
      { by: 'c', conf: "{a} kissed {b} with me in the same room. I don't know what I'm supposed to do with that, and I don't want to find out tonight." },
    ] },
  ],
  'party-kiss.blowup': [
    { id: 'ks.b1', turns: [
      { beat: '{c} sees {a} kiss {b} and crosses the club in about three steps.' },
      { by: 'c', say: "Are you KIDDING me?" },
      { by: 'b', say: "Whoa. Back up." },
      { by: 'c', say: "Back up? You knew we were together, and you kissed {a}!" },
      { by: 'a', say: "{c}, stop. Everybody is looking." },
      { by: 'c', say: "Let them look!" },
      { beat: 'Somebody steps in and steers {c} toward the door before it gets any worse.' },
      { by: 'c', conf: "{b} knew exactly who {a} was with. {b} sat next to me at breakfast this morning and smiled at me. Never again." },
    ] },
    { id: 'ks.b2', turns: [
      { beat: '{a} and {b} are kissing on the dance floor when {c} pushes through the crowd.' },
      { by: 'c', say: "You've got to be joking." },
      { by: 'a', say: "Can we talk about this outside?" },
      { by: 'c', say: "No. We can talk about it right here, in front of everybody, the way you kissed {b} in front of everybody." },
      { by: 'b', say: "This has nothing to do with me." },
      { by: 'c', say: "You were kissing {a}. It has everything to do with you." },
      { beat: 'The music is still playing. Nobody on the dance floor is dancing anymore.' },
      { by: 'a', conf: "One kiss. One drunk, stupid kiss, and now the whole house saw {c} scream at me in the middle of a club." },
    ] },
  ],
  'kiss-fallout.breakup': [
    { id: 'kf.b1', turns: [
      { beat: '{a} walks into the kitchen, where {b} is making breakfast.' },
      { by: 'd', opt: 1, say: "{a}, I'm sorry. I had to tell you." },
      { by: 'a', say: "I know what happened last night." },
      { by: 'b', say: "{a}, listen..." },
      { by: 'a', say: "You kissed {c}. You knew we were together, and you kissed {c}." },
      { by: 'b', say: "{c} kissed me." },
      { by: 'a', say: "I don't care who started it." },
      { beat: '{c} comes down the stairs and stops in the doorway.' },
      { by: 'a', say: "And you. We're done." },
      { by: 'c', say: "Can we at least talk?" },
      { by: 'a', conf: "{c} and I are over. {b} can have {c}. I hope they're very happy together, and I hope they're both in the Arena by next week." },
    ] },
    { id: 'kf.b2', turns: [
      { by: 'd', opt: 1, say: "{a}, I have to tell you something, and you're going to hate me for it." },
      { by: 'a', opt: 'd', say: "Just say it." },
      { by: 'd', opt: 1, say: "Last night, at the club, {c} kissed {b}. I saw it." },
      { beat: '{a} goes straight upstairs to find {c}.' },
      { by: 'a', say: "Is it true?" },
      { by: 'c', say: "Who told you?" },
      { by: 'a', say: "That's not an answer." },
      { by: 'c', say: "Yes. It's true." },
      { by: 'a', say: "Then we're done." },
      { by: 'b', conf: "I didn't plan any of it. Now {a} hates me, and I can't even say {a} is wrong to." },
    ] },
  ],
  'kiss-fallout.stays': [
    { id: 'kf.s1', turns: [
      { beat: '{a} sits down across from {c} on the bed and does not say anything for a while.' },
      { by: 'a', say: "I heard about you and {b}." },
      { by: 'c', say: "It was one stupid kiss. I was drunk." },
      { by: 'a', say: "That's not an excuse." },
      { by: 'c', say: "I know. It's just the truth." },
      { by: 'a', say: "You get one. That was it." },
      { by: 'a', conf: "I'm staying with {c}. That doesn't mean I've forgotten. And {b} is at the top of my list now." },
    ] },
    { id: 'kf.s2', turns: [
      { beat: '{a} finds {b} alone by the pool.' },
      { by: 'a', say: "Stay away from {c}." },
      { by: 'b', say: "It was one kiss." },
      { by: 'a', say: "Then it'll be easy to stay away." },
      { by: 'b', say: "You should be having this conversation with {c}, not me." },
      { by: 'a', say: "I already did. Now I'm having it with you." },
      { by: 'b', conf: "{a} forgave {c} in about an hour. I'm the one who gets to be the villain. That's not fair, but nobody here cares about fair." },
    ] },
  ],
};
