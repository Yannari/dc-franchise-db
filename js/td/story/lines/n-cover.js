// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-cover.js — the cover plan: what the room is told, and what it isn't
// ══════════════════════════════════════════════════════════════════════
// director.js coverTalk, tribal.js, threads.js (alliances.js planCoverVotes decides it all).
//   cover.meet    a, who runs the vote, tells b (and c) it's {cover} tonight. It isn't, and a knows
//                 it. b believes it; saw: b senses something is off. Never says the real name.
//   cover.tease   a and b, the two who know: the plan is real, the name is not said. {told}: who's
//                 being kept out. two: more than one person is.
//   cover.doubt   a, in on it, doesn't like lying to {told1}; b runs it.
//   after.cover   a's confessional after the vote: everybody was told {cover}; {lastBoot} was the
//                 plan the whole time; {told} wrote the cover.
//   after.misled  a wrote {cover} because b told them to, and just watched {lastBoot} go.
//   thr.misled.*  later: a was lied to by b at a vote ({lastBoot} went home that night, when set)
// Ids: 'ncv.'.

export default {
  'cover.meet': [
    { id: 'ncv.m1', turns: [
      { beat: "{a} waves {b} over to the far end of the beach, away from the shelter." },
      { by: 'a', say: "Okay. Tonight. It's {cover}." },
      { by: 'b', say: "{cover}? I thought people were talking about somebody else." },
      { by: 'a', say: "People talk. That's why I'm telling you myself. It's {cover}, and everybody's on it." },
      { by: 'b', say: "Everybody?" },
      { by: 'a', say: "Everybody who matters. Just write {cover} and don't make a big thing of it at camp." },
      { by: 'b', say: "Okay. {cover}." },
      { by: 'b', say: "...You're sure, though? Something about today feels weird.", when: { saw: true } },
      { by: 'a', say: "I'm sure. Trust me." },
      { by: 'a', conf: "{b} is a great person. {b} is also way too close to the wrong people to hear the real plan." },
    ] },
    { id: 'ncv.m2', when: { third: true }, turns: [
      { beat: "{a} gets {b} and {c} together by the water pump, all three of them pretending to fill bottles." },
      { by: 'a', say: "Quick, before anybody comes over. Tonight's {cover}." },
      { by: 'c', say: "Since when?" },
      { by: 'a', say: "Since this afternoon. The numbers are there, I've already counted them twice." },
      { by: 'b', say: "I'm fine with {cover}. I never really liked {cover} anyway." },
      { by: 'c', say: "Okay. If you've counted it, I'm in." },
      { by: 'a', say: "Good. And keep it quiet. The less it gets talked about, the better it goes." },
      { by: 'a', conf: "Two people walked away from that pump completely sure about tonight. Neither of them knows what tonight actually is." },
    ] },
    { id: 'ncv.m3', when: { voice: ['warm', 'goofy'] }, turns: [
      { by: 'a', say: "Hey, you. Can I steal you for a second?" },
      { by: 'b', say: "Steal away." },
      { by: 'a', say: "So, tonight's going to be easy, I promise. We're all writing {cover}." },
      { by: 'b', say: "Oh, thank goodness. I was so worried it was going to be messy." },
      { by: 'a', say: "Not messy at all. In and out, nobody gets hurt. Well, except {cover}." },
      { by: 'b', say: "Poor {cover}." },
      { by: 'a', say: "Poor {cover}. Anyway, you did great today. Go relax." },
      { by: 'a', conf: "I smiled the whole way through that. I'm going to have to smile the whole way through the vote too." },
    ] },
  ],
  'cover.tease': [
    { id: 'ncv.t1', turns: [
      { beat: "{a} and {b} walk the long way back from the firewood pile." },
      { by: 'b', say: "So? Are you going to tell me who it really is?" },
      { by: 'a', say: "Not here. Not yet. When we're in the booth, you'll know." },
      { by: 'b', say: "And {told}?" },
      { by: 'a', say: "{told} thinks it's somebody else. That's the point.", when: { two: false } },
      { by: 'a', say: "They think it's somebody else. That's the point.", when: { two: true } },
      { by: 'b', say: "That's cold." },
      { by: 'a', say: "That's careful. If the name gets out, it doesn't happen." },
      { by: 'b', conf: "Luckily, {a} has a plan. Unluckily, {a} won't tell me all of it yet, and I'm the one {a} trusts." },
    ] },
    { id: 'ncv.t2', when: { voice: ['schemer', 'calm', 'dry', 'cruel'] }, turns: [
      { by: 'a', say: "Everything's set." },
      { by: 'b', say: "You're sure {told} bought it?" },
      { by: 'a', say: "I'm sure. People believe whatever makes them feel safe." },
      { by: 'b', say: "And if somebody says something?" },
      { by: 'a', say: "Then I'll know exactly who talked, because only three people know the real name, and two of them are standing here." },
      { by: 'b', say: "Who's the third?" },
      { by: 'a', say: "Nobody you need to worry about." },
      { by: 'a', conf: "The best plans in this game are the ones half the people voting don't even know they're part of." },
    ] },
    { id: 'ncv.t3', when: { voice: ['anxious', 'warm', 'earnest'] }, turns: [
      { by: 'b', say: "Are we really doing this? Lying to {told}?" },
      { by: 'a', say: "We're not lying. We're just not telling everybody everything." },
      { by: 'b', say: "That's lying with extra steps." },
      { by: 'a', say: "I feel bad about it too. I really do. But if the real name gets out, we're the ones going home." },
      { by: 'b', say: "...Okay. Okay. I just want it to be over." },
      { by: 'a', conf: "I hate this part of the game. I'm still doing it, because hating it doesn't help me stay." },
    ] },
  ],
  'cover.doubt': [
    { id: 'ncv.d1', turns: [
      { by: 'a', say: "Can I say something? I don't love this." },
      { by: 'b', say: "Don't love what?" },
      { by: 'a', say: "Lying to {told1}. {told1} is my friend." },
      { by: 'b', say: "And {told1} is also close to the wrong person. You know what happens if {told1} finds out." },
      { by: 'a', say: "I know. I just don't want {told1} to find out it was me." },
      { by: 'b', say: "Then don't be the one who tells {told1}." },
      { by: 'a', conf: "I'm going to write the name. I just hope {told1} doesn't look at me when it's read, because I won't be able to look back." },
    ] },
    { id: 'ncv.d2', when: { voice: ['tough', 'blunt', 'loud'] }, turns: [
      { by: 'a', say: "Just so you know, if this blows up, I'm telling {told1} it was your idea." },
      { by: 'b', say: "It was my idea." },
      { by: 'a', say: "Good. Then we agree." },
      { by: 'b', say: "Are you in or not?" },
      { by: 'a', say: "I'm in. I just don't have to like it." },
      { by: 'a', conf: "I don't mind voting people out. I mind lying to my friends about it. Tonight I'm doing both." },
    ] },
  ],
  // a wrote the cover name {target} because {leader} gave it to them (the viewer knows better)
  'booth2.misled.any': [
    { id: 'ncv.b1', turns: [{ by: 'a', conf: "{leader} told me it's {target} tonight, and I trust {leader}, so it's {target}.", v: {"anxious":"{leader} said {target}, and {leader} has never steered me wrong. {target}."} }] },
    { id: 'ncv.b2', turns: [{ by: 'a', conf: "This one's easy. Everybody's on {target}, {leader} made sure of that, so it's {target}." }] },
    { id: 'ncv.b3', when: { band: ['friends', 'neutral'] }, turns: [{ by: 'a', conf: "{target}, sorry. {leader} says the numbers are all there, and I'm not going to be the one who messes it up." }] },
    { id: 'ncv.b4', turns: [{ by: 'a', conf: "I'm writing {target} because {leader} asked me to, and honestly, I'm just glad it isn't me.", v: {"tough":"{leader} called it, so it's {target}. Done."} }] },
    { id: 'ncv.b5', turns: [{ by: 'a', conf: "Everybody I trust said {target}. I didn't ask too many questions, so it's {target}.", v: {"dry":"I was told {target}. I'm doing what I'm told, for once. {target}."} }] },
  ],
  'after.cover.any': [
    { id: 'ncv.a1', turns: [{ by: 'a', conf: "Everybody thought it was {cover}. That was the whole point. {lastBoot} was the plan from the very start, and only the people who needed to know knew." }] },
    { id: 'ncv.a2', turns: [{ by: 'a', conf: "{told} wrote {cover} because I told them to. I feel a little bad about that. Not bad enough to wish I hadn't done it." }] },
    { id: 'ncv.a3', when: { voice: ['schemer', 'calm', 'dry', 'cruel'] }, turns: [{ by: 'a', conf: "A vote nobody saw coming doesn't happen by accident. You tell half the room one name, you write another, and you smile at both halves the whole time." }] },
    { id: 'ncv.a4', when: { voice: ['anxious', 'warm', 'earnest'] }, turns: [{ by: 'a', conf: "It worked. I'm so relieved it worked. And now I have to go back to camp and look {told} in the face." }] },
  ],
  'after.misled.any': [
    { id: 'ncv.x1', turns: [{ by: 'a', conf: "I wrote {cover}. I wrote {cover} because {b} told me to, and then they read {lastBoot}'s name instead. I wasn't part of the plan. I was part of the cover." }] },
    { id: 'ncv.x2', when: { voice: ['tough', 'loud', 'blunt', 'competitive'] }, turns: [{ by: 'a', conf: "{b} looked me in the eye and said {cover}. Okay. Fine. Now I know exactly what {b}'s word is worth." }] },
    { id: 'ncv.x3', when: { voice: ['warm', 'emotional', 'anxious', 'earnest'] }, turns: [{ by: 'a', conf: "I thought I was on the inside. Turns out I was the person they were most scared would ruin it. That hurts more than losing {lastBoot}." }] },
  ],
  'thr.misled.1': [
    { id: 'ncv.h1', turns: [
      { beat: "{a} waits for {b} at the water pump and doesn't bother pretending to fill a bottle." },
      { by: 'a', say: "You told me it was somebody else." },
      { by: 'b', say: "I know." },
      { by: 'a', say: "You looked me right in the face and gave me a fake name." },
      { by: 'b', say: "Because if I'd told you the real one, you'd have warned them." },
      { by: 'a', say: "Maybe I would have. That should've been my choice." },
      { by: 'b', say: "It was my vote to protect. Not yours." },
      { by: 'a', say: "Then don't expect me to protect yours." },
      { by: 'a', conf: "{b} decided I couldn't be trusted with the truth. Fine. Now {b} gets to find out what it's like when I don't trust {b} either." },
    ] },
    { id: 'ncv.h2', when: { voice: ['warm', 'earnest', 'emotional'] }, turns: [
      { by: 'b', say: "Can we talk? About the other night?" },
      { by: 'a', say: "I don't know. Can we? Or are you going to tell me something that isn't true again?" },
      { by: 'b', say: "That's fair. I deserve that." },
      { by: 'a', say: "I thought we were friends." },
      { by: 'b', say: "We are. I just couldn't risk the plan." },
      { by: 'a', say: "You could risk me, though." },
      { by: 'b', conf: "I lied to {a} to make the vote work. The vote worked. Now I have to figure out if {a} ever trusts me again." },
    ] },
  ],
  'thr.misled.2': [
    { id: 'ncv.h3', turns: [
      { by: 'b', say: "You're still angry." },
      { by: 'a', say: "I'm still careful. There's a difference." },
      { by: 'b', say: "Careful how?" },
      { by: 'a', say: "Careful like I check everything you tell me with somebody else now." },
      { by: 'b', say: "That's going to make working together pretty hard." },
      { by: 'a', say: "You made it hard. I'm just keeping up." },
      { by: 'b', conf: "{a} hasn't forgiven me for the fake name. And {a} knows things about my plans now that I really wish {a} didn't." },
    ] },
  ],
  'thr.misled.mend': [
    { id: 'ncv.h4', turns: [
      { by: 'b', say: "This time, I'm telling you first. Before anybody else." },
      { by: 'a', say: "Telling me what?" },
      { by: 'b', say: "The real name. Not a cover. The real one." },
      { by: 'a', say: "...Why?" },
      { by: 'b', say: "Because I owe you that after last time." },
      { by: 'a', say: "Okay. Then tell me." },
      { by: 'a', conf: "{b} gave me the real plan this time, before anyone. I'm not saying we're fixed. I'm saying it's a start." },
    ] },
  ],
  'thr.misled.war': [
    { id: 'ncv.h5', turns: [
      { beat: "{a} doesn't wait until they're alone." },
      { by: 'a', say: "Just so everybody here knows, {b} lies to their own alliance." },
      { by: 'b', say: "Are you serious right now?" },
      { by: 'a', say: "Ask me what name I wrote at the last vote. Go on, ask me who told me to write it." },
      { by: 'c', say: "Wait, is that true?", opt: true },
      { by: 'b', say: "It was the plan. It worked." },
      { by: 'a', say: "It worked on me. Watch it not work on anybody else." },
      { by: 'b', conf: "{a} just told the whole camp about the cover. Every person here is going to wonder what I've told them." },
    ] },
  ],
  'thr.misled.fade': [
    { id: 'ncv.h6', turns: [{ by: 'a', conf: "I don't talk about the fake name anymore. I just never ask {b} for the plan. I find out from somebody else, every time." }] },
  ],
};
