// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-returnee.js — returnees: the past they bring back, as scenes
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-09: "we don't have returnee dialogue, only first timer, that's a big overhaul".
// A returnee season read: of 184 scenes with a returnee in them, 7 mentioned they'd played before.
// camp-events.js decides each moment from the ledger (the franchise-meta block, with consequences);
// these are the scenes. Everything named is real (td/past.js): never an invented past.
//   {lastSeason} {lastPlace} {lastBy} {lastPartner}  a's last season (lastBy: who blindsided or
//     betrayed a; gated `pastBy: true`), and the same with B for b, T for {target}
//   facts: past / pastB = won | final | early | blindsided | mid | none; returnee / returneeB
// Every entry is `past: true`: a scene about last season may say "voted" and "last time" before
// this season's first vote (write.js). Ids: 'nrt.'.

const P = e => ({ ...e, past: true });

export default {
  // ── a grudge from last season: a was wronged by b ──
  'long.ret.grudge.blindside': [
    P({ id: 'nrt.g1', turns: [
      { beat: "{a} has been watching {b} all morning. When {b} finally walks past, {a} doesn't move out of the way." },
      { by: 'b', say: "Are we really doing this on day one?" },
      { by: 'a', say: "You blindsided me on {lastSeason}. I think day one is exactly when we do this." },
      { by: 'b', say: "It was a vote. Everybody was voting somebody out." },
      { by: 'a', say: "Everybody else told me to my face. You smiled at me at breakfast and wrote my name at night." },
      { by: 'b', say: "And you'd have done the same to me if you'd thought of it first." },
      { by: 'a', say: "Maybe. But I didn't. You did." },
      { by: 'b', say: "So what now? You spend the whole season getting even?" },
      { by: 'a', say: "Now I watch you. Every single day." },
      { by: 'a', conf: "I went home from {lastSeason} without seeing it coming, and {b} was the reason. I'm not going to make it easy for {b} to do it twice." },
      { by: 'b', conf: "{a} still hasn't let it go. I get it. I'd be mad too. But this is a new season, and I'm not apologising for playing the game." },
    ] }),
    P({ id: 'nrt.g2', when: { voiceB: ['warm', 'earnest', 'anxious', 'emotional'] }, turns: [
      { by: 'b', say: "Can I say something before you say anything?" },
      { by: 'a', say: "Go on." },
      { by: 'b', say: "I'm sorry about last time. I really am. I watched it back, and the way it happened to you was awful." },
      { by: 'a', say: "You watched it back. I lived it. I sat there while they read my name and you couldn't even look at me." },
      { by: 'b', say: "I know. I couldn't look at you because I felt sick about it." },
      { by: 'a', say: "Feeling sick didn't stop you writing it." },
      { by: 'b', say: "No. It didn't. I'm not asking you to forgive me, I'm just telling you I'm sorry." },
      { by: 'a', say: "...Okay. I heard you." },
      { by: 'a', conf: "{b} apologised, and I think {b} meant it. I still remember what it felt like to walk out of there, and an apology doesn't make me forget it." },
    ] }),
    P({ id: 'nrt.g3', when: { voiceB: ['schemer', 'cruel', 'proud', 'dry', 'calm'] }, turns: [
      { by: 'a', say: "So we're not going to talk about {lastSeason}?" },
      { by: 'b', say: "What's there to talk about? I made a move and it worked." },
      { by: 'a', say: "On me. The move was on me." },
      { by: 'b', say: "Somebody had to be the move. It happened to be you." },
      { by: 'a', say: "Do you hear yourself?" },
      { by: 'b', say: "I hear somebody who's still upset about a game." },
      { by: 'a', say: "And I hear somebody who'd do it again." },
      { by: 'b', say: "Of course I would. That's what you should be worried about, not what happened last time." },
      { by: 'a', conf: "{b} isn't sorry. {b} isn't even pretending to be sorry. Good. At least now I know exactly who I'm dealing with." },
    ] }),
  ],
  'long.ret.grudge.betrayal': [
    P({ id: 'nrt.b1', turns: [
      { beat: "{a} and {b} are on water duty together, which nobody on the team planned on purpose." },
      { by: 'a', say: "Do you remember what you said to me on {lastSeason}? The night we made the deal?" },
      { by: 'b', say: "I remember." },
      { by: 'a', say: "You said we'd go to the end together. You said it twice, because I asked you twice." },
      { by: 'b', say: "I meant it when I said it." },
      { by: 'a', say: "And then you didn't. That's the part I keep coming back to." },
      { by: 'b', say: "Things changed. The numbers changed. I had to choose." },
      { by: 'a', say: "You chose you. Fine. Just don't ever ask me for a deal again." },
      { by: 'a', conf: "{b} broke a promise to me last time. The thing about a broken promise is that it doesn't come with a new season." },
      { by: 'b', conf: "{a} has every right to be angry. I just hope {a} is angry enough to make a mistake." },
    ] }),
    P({ id: 'nrt.b2', when: { voiceB: ['warm', 'earnest', 'goofy', 'emotional'] }, turns: [
      { by: 'b', say: "Hey. Can we please talk about it, instead of just glaring?" },
      { by: 'a', say: "I'm not glaring." },
      { by: 'b', say: "You've been glaring since the boat. I turned on you last time, I know I did, and I hated it." },
      { by: 'a', say: "Then why did you do it?" },
      { by: 'b', say: "Because I panicked. Everybody said it was you or me, and I believed them." },
      { by: 'a', say: "Were they right?" },
      { by: 'b', say: "I don't know. I never got to find out, because I went home two votes later." },
      { by: 'a', say: "...So it didn't even work." },
      { by: 'b', say: "It didn't even work. That's the stupidest part." },
      { by: 'a', conf: "I wanted to hate {b} for this whole season. It's a lot harder when {b} keeps being honest about it." },
    ] }),
  ],

  // ── back together: old allies, or a couple that lasted ──
  'long.ret.reunion.allies': [
    P({ id: 'nrt.r1', turns: [
      { beat: "{a} spots {b} across camp and grins. {b} is already grinning back." },
      { by: 'a', say: "Tell me you're on my team. Please tell me you're on my team." },
      { by: 'b', say: "I'm on your team." },
      { by: 'a', say: "Yes! Same as last time?" },
      { by: 'b', say: "Same as last time, except we don't let anybody split us up at the end." },
      { by: 'a', say: "That was the plan last time too." },
      { by: 'b', say: "Then this time we actually do it." },
      { by: 'a', say: "Deal. And we keep it quiet. Everybody watched us play together." },
      { by: 'b', conf: "{a} and I went a long way together on {lastSeason}. I don't need to start from zero with anybody, because I've already got {a}." },
      { by: 'a', conf: "The new people are going to see us together and panic, and they'd be right to." },
    ] }),
    P({ id: 'nrt.r2', when: { voice: ['schemer', 'calm', 'dry', 'competitive'] }, turns: [
      { by: 'a', say: "Don't come over here." },
      { by: 'b', say: "What? We're friends." },
      { by: 'a', say: "Everybody knows we're friends. That's why you shouldn't come over here, at least not where they can see." },
      { by: 'b', say: "So we pretend we don't like each other?" },
      { by: 'a', say: "We pretend we're not a pair. We were a pair on {lastSeason}, and pairs get split up." },
      { by: 'b', say: "That's so sad. And smart." },
      { by: 'a', say: "Meet me at the water after dinner. Then we can be friends." },
      { by: 'a', conf: "{b} is my best shot in this game, so the best thing I can do for both of us is pretend we barely know each other." },
    ] }),
  ],
  'long.ret.reunion.couple': [
    P({ id: 'nrt.c1', turns: [
      { beat: "{a} and {b} are sharing a log by the fire, closer than anybody else on the team is sitting to anyone." },
      { by: 'b', say: "Everybody keeps looking at us." },
      { by: 'a', say: "Let them look. We were together at the end of {lastSeason}, and we're still together." },
      { by: 'b', say: "That's sweet. It's also a problem. We're two votes everybody wants to split." },
      { by: 'a', say: "Then nobody gets to split us. If it ever comes down to one of us, we talk first." },
      { by: 'b', say: "Every time?" },
      { by: 'a', say: "Every single time." },
      { by: 'b', say: "Okay. I love you, and I'm also going to win this." },
      { by: 'a', say: "I'd expect nothing less." },
      { by: 'b', conf: "Coming back as a couple is the best and worst thing about this season. I get to be here with {a}, and everybody here has a reason to vote out one of us." },
    ] }),
    P({ id: 'nrt.c2', when: { voice: ['flirty', 'goofy', 'warm', 'loud'] }, turns: [
      { by: 'a', say: "Remember last time, when you tried to pretend you didn't like me for a whole week?" },
      { by: 'b', say: "That was strategy." },
      { by: 'a', say: "You lasted three days." },
      { by: 'b', say: "It was a very good three days." },
      { by: 'a', say: "Want to try it again? Pretend we're not together, see if anybody buys it?" },
      { by: 'b', say: "Nobody is going to buy it. They watched the whole thing." },
      { by: 'a', say: "Fine. Then we're the couple, and we're proud of it." },
      { by: 'b', conf: "{a} makes everything feel like a joke, which is why I love {a.obj}, and also why I have to do the worrying for both of us." },
    ] }),
  ],

  // ── awkward: old rivals, or exes ──
  'long.ret.awkward.rivals': [
    P({ id: 'nrt.w1', turns: [
      { beat: "{a} and {b} get assigned the same chore. They stand on opposite sides of the woodpile and don't move." },
      { by: 'a', say: "So you're back too." },
      { by: 'b', say: "Looks like it." },
      { by: 'a', say: "I thought after {lastSeason} you'd never come near this place again." },
      { by: 'b', say: "I thought the same about you. Guess we were both wrong." },
      { by: 'a', say: "Truce? Just for the chores?" },
      { by: 'b', say: "Just for the chores. After that, all bets are off." },
      { by: 'a', say: "Same as last time, then." },
      { by: 'a', conf: "{b} and I fought the whole way through {lastSeason}. We're older now. We're not any nicer to each other." },
    ] }),
  ],
  'long.ret.awkward.exes': [
    P({ id: 'nrt.x1', turns: [
      { beat: "{a} is filling a bottle at the water when {b} walks up with an empty one. They both stop." },
      { by: 'b', say: "Hi." },
      { by: 'a', say: "Hi." },
      { by: 'b', say: "This is weird." },
      { by: 'a', say: "It's really weird. Last time I saw you, you weren't speaking to me." },
      { by: 'b', say: "Last time you saw me, you'd just told me it was over in front of the whole camp." },
      { by: 'a', say: "...Yeah. That wasn't my best moment." },
      { by: 'b', say: "It wasn't. But it was a long time ago. Can we just be on the same team?" },
      { by: 'a', say: "I can do that. I think." },
      { by: 'b', conf: "Everybody here watched us break up on {lastSeason}. Every time we're in the same place, I can feel them waiting for round two." },
    ] }),
    P({ id: 'nrt.x2', when: { voice: ['cruel', 'proud', 'blunt', 'dry'] }, turns: [
      { by: 'b', say: "So we're just going to ignore each other the whole season?" },
      { by: 'a', say: "That was the plan, yes. You're ruining it." },
      { by: 'b', say: "We dated. We broke up. It's not a war." },
      { by: 'a', say: "It's not a war because I'm not fighting. I just don't want to talk to you." },
      { by: 'b', say: "Fine." },
      { by: 'a', say: "Fine." },
      { by: 'b', conf: "{a} still can't be in a room with me without getting cold. I'd say I'm over it. I'm mostly over it." },
    ] }),
  ],

  // ── the returnee as the threat: a (new) to b (new), about {target} ──
  'long.ret.threat.won': [
    P({ id: 'nrt.t1', place: 'secret', turns: [
      { beat: "{a} waits until {target} is out of earshot, then pulls {b} aside." },
      { by: 'a', say: "Can we talk about the fact that {target} has already won this game?" },
      { by: 'b', say: "Everybody knows that." },
      { by: 'a', say: "Everybody knows it, and everybody's acting like it doesn't matter. It matters. Winners know how to win." },
      { by: 'b', say: "Maybe {target} just got lucky." },
      { by: 'a', say: "Nobody gets lucky for a whole season. {target} won {lastSeasonT} because {target} is good at this, better than us." },
      { by: 'b', say: "So what do we do?" },
      { by: 'a', say: "We don't let {target} get comfortable. The second there's a chance, it's {target}." },
      { by: 'b', conf: "I came here a fan of {target}. Now I'm sitting here plotting against my favourite player. This show is so weird." },
      { by: 'a', conf: "If {target} wins twice, the rest of us were just extras. I didn't come here to be an extra." },
    ] }),
  ],
  'long.ret.threat.final': [
    P({ id: 'nrt.t2', place: 'secret', turns: [
      { by: 'a', say: "Doesn't it bother you that {target} got all the way to the end last time?" },
      { by: 'b', say: "{target} lost at the end, though." },
      { by: 'a', say: "{target} lost at the very end. {lastPlaceT}. One vote off winning the whole thing." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "And somebody that close doesn't come back to have fun. {target} came back to finish it." },
      { by: 'b', say: "Okay, when you put it like that, it's creepy." },
      { by: 'a', say: "Then let's not be the ones sitting next to {target} at the end, clapping." },
      { by: 'a', conf: "{target} knows exactly how close it was on {lastSeasonT}. That kind of person doesn't make the same mistake twice, so we have to make sure {target} doesn't get the chance." },
    ] }),
  ],
  'long.ret.threat.other': [
    P({ id: 'nrt.t3', place: 'secret', turns: [
      { by: 'a', say: "Has anybody here actually been watching {target}?" },
      { by: 'b', say: "Not really. Why?" },
      { by: 'a', say: "That's my point. {target} has done this before, and everybody's treating {target} like the furniture." },
      { by: 'b', say: "{target} seems nice, though." },
      { by: 'a', say: "Seeming nice is how you get far. {target} finished {lastPlaceT} last time by seeming nice." },
      { by: 'b', say: "So you want to go after {target}?" },
      { by: 'a', say: "I want us to remember {target} is the only one here who's not guessing." },
      { by: 'a', conf: "Everybody else is still figuring out where the water is. {target} already knows where the bodies are buried, because {target} helped bury some." },
    ] }),
  ],

  // ── a known schemer offers a deal; a has watched the tapes ──
  'long.ret.distrust.any': [
    P({ id: 'nrt.d1', turns: [
      { by: 'b', say: "I've been watching you, you know. In a good way. You're smart." },
      { by: 'a', say: "Thanks." },
      { by: 'b', say: "I mean it. You and me could go a long way together." },
      { by: 'a', say: "I watched your last season." },
      { by: 'b', say: "Ah. So you've seen the highlights." },
      { by: 'a', say: "I've seen what happened to everybody who went a long way with you." },
      { by: 'b', say: "That was a different cast. Different game." },
      { by: 'a', say: "Same you, though." },
      { by: 'b', conf: "I can't escape my own tapes. Fine. I'll just have to be somebody nobody's seen yet." },
      { by: 'a', conf: "{b} said all the right things. That's exactly what scares me. I've seen {b} say all the right things before, on TV, to people who went home." },
    ] }),
    P({ id: 'nrt.d2', when: { voiceB: ['schemer', 'calm', 'dry', 'proud', 'cruel'] }, turns: [
      { by: 'b', say: "I'm going to be straight with you, because I think you'd see through anything else." },
      { by: 'a', say: "Okay." },
      { by: 'b', say: "I need a number. You need somebody who knows how this works. We both win." },
      { by: 'a', say: "That's what you told everybody last time." },
      { by: 'b', say: "And most of them did very well, for a while." },
      { by: 'a', say: "For a while is the part I'm worried about." },
      { by: 'b', say: "Fair. Think about it." },
      { by: 'a', conf: "{b} doesn't even pretend. I almost respect it. I'm still not getting anywhere near it." },
      { by: 'b', conf: "Everybody here has seen me play, so nobody's ever going to trust me first. Fine. I'll be the second person they trust." },
    ] }),
    P({ id: 'nrt.d3', when: { voiceB: ['warm', 'earnest', 'goofy', 'loud', 'emotional'] }, turns: [
      { by: 'b', say: "Hey! We haven't really talked yet. I'd love to." },
      { by: 'a', say: "Sure. As long as it's just talking." },
      { by: 'b', say: "What else would it be?" },
      { by: 'a', say: "I've seen you play. Everybody who just talked to you ended up voting with you." },
      { by: 'b', say: "Is that so bad? People like me." },
      { by: 'a', say: "People liked you right up until you sent them home." },
      { by: 'b', say: "...Okay. That's fair, but it's also a little mean." },
      { by: 'a', conf: "{b} is lovely, and I mean that. That's exactly how {b} got so far last time, and I'm not going to be one of the lovely conversations." },
    ] }),
  ],

  // ── an old flame, warming up again ──
  'long.ret.rekindle.any': [
    P({ id: 'nrt.k1', turns: [
      { beat: "{a} and {b} are the last two still sitting up, a careful arm's length apart." },
      { by: 'a', say: "Do you ever think about last time?" },
      { by: 'b', say: "Which part?" },
      { by: 'a', say: "The good part. Before it went wrong." },
      { by: 'b', say: "...Sometimes. More than I'd like." },
      { by: 'a', say: "Me too." },
      { by: 'b', say: "We said we were going to keep this about the game." },
      { by: 'a', say: "We did say that." },
      { beat: "Neither of them moves away." },
      { by: 'b', conf: "I came back for the game, I swear I did. And then {a} sat down next to me, and suddenly it's {lastSeason} all over again." },
    ] }),
  ],

  // ── a newcomer asks a returnee about last time (a returnee, b new) ──
  'long.ret.asked.won': [
    P({ id: 'nrt.a1', turns: [
      { by: 'b', say: "Okay, I have to ask. You actually won? Like, the whole thing?" },
      { by: 'a', say: "The whole thing." },
      { by: 'b', say: "That's amazing! What was it like?" },
      { by: 'a', say: "Honestly? The best day of my life, and then the hardest year." },
      { by: 'b', say: "Then why would you come back?" },
      { by: 'a', say: "Because people kept saying I got lucky, and I'd like to win it again just to see their faces." },
      { by: 'b', say: "You know everybody here wants to beat you, right?" },
      { by: 'a', say: "I know. I'd want to beat me too." },
      { by: 'a', conf: "Every new person asks me about winning. Then they go away and work out how to send me home. I can see it on their faces." },
      { by: 'b', conf: "{a} is so nice. That's the scary part. You can see exactly how {a} won." },
    ] }),
    P({ id: 'nrt.a2', when: { voice: ['proud', 'competitive', 'loud', 'bossy', 'blunt'] }, turns: [
      { by: 'b', say: "So you're the one who won it before." },
      { by: 'a', say: "I'm the one who won it." },
      { by: 'b', say: "Any advice?" },
      { by: 'a', say: "Don't sit next to me at the end." },
      { by: 'b', say: "That's not advice, that's a threat." },
      { by: 'a', say: "It's both. Welcome to the show." },
      { by: 'a', conf: "I won {lastSeason}. I'm not going to pretend to be modest about it. Let them be scared. Scared people make mistakes." },
    ] }),
  ],
  'long.ret.asked.final': [
    P({ id: 'nrt.a3', turns: [
      { by: 'b', say: "You were on before, right? How far did you get?" },
      { by: 'a', say: "{lastPlace}. All the way to the very end." },
      { by: 'b', say: "That's so close! What happened?" },
      { by: 'a', say: "The jury happened. I played the game, and they liked somebody else more." },
      { by: 'b', say: "That must still sting." },
      { by: 'a', say: "Every single day. That's why I'm back." },
      { by: 'b', say: "What would you do differently?" },
      { by: 'a', say: "I'd stop worrying about being liked and start worrying about the people voting for me." },
      { by: 'a', conf: "I finished {lastPlace} on {lastSeason}. I don't want to get close again. Close is the worst feeling in the world." },
    ] }),
  ],
  'long.ret.asked.early': [
    P({ id: 'nrt.a4', turns: [
      { by: 'b', say: "Wait, you were on the show before? I'm sorry, I don't remember you." },
      { by: 'a', say: "Nobody does. I went home almost straight away." },
      { by: 'b', say: "Oh no. What happened?" },
      { by: 'a', say: "I talked too much, too early, to the wrong people." },
      { by: 'b', say: "And you came back anyway?" },
      { by: 'a', say: "I came back because of it. I've been thinking about those few days ever since." },
      { by: 'b', say: "Well, at least nobody's scared of you." },
      { by: 'a', say: "That's the plan." },
      { by: 'a', conf: "I finished {lastPlace} on {lastSeason}. Everybody else came back as somebody. I came back as a stranger, and that might be the best thing I've got going for me." },
    ] }),
    P({ id: 'nrt.a5', when: { voice: ['anxious', 'emotional', 'quiet', 'earnest'] }, turns: [
      { by: 'b', say: "Is it weird, being back?" },
      { by: 'a', say: "So weird. Last time I was out before I'd even learned everybody's name." },
      { by: 'b', say: "That's awful." },
      { by: 'a', say: "It was. I cried the whole way home. I watched every episode after I left, and it was like watching a party I wasn't invited to." },
      { by: 'b', say: "Well, you're invited now." },
      { by: 'a', say: "I'm invited now. I just have to stay longer than a few days this time." },
      { by: 'a', conf: "Every night I think, just one more vote. Last time I didn't make it past three. That's my whole goal right now: get past three." },
    ] }),
  ],
  'long.ret.asked.blindsided': [
    P({ id: 'nrt.a6', when: { pastBy: true }, turns: [
      { by: 'b', say: "How did you go out last time? If you don't mind me asking." },
      { by: 'a', say: "{lastBy} blindsided me." },
      { by: 'b', say: "Ouch." },
      { by: 'a', say: "I walked in thinking it was somebody else, and I was the only one who didn't know." },
      { by: 'b', say: "Did you see it coming at all?" },
      { by: 'a', say: "Not even a little. That's the part that still gets me. I trusted {lastBy}." },
      { by: 'b', say: "So who do you trust now?" },
      { by: 'a', say: "Nobody, yet. Ask me again in a week." },
      { by: 'a', conf: "{lastBy} sent me home without me ever seeing it. I'm going to see everything this time. Every look, every whisper." },
    ] }),
    P({ id: 'nrt.a7', turns: [
      { by: 'b', say: "What's the one thing you learned from last time?" },
      { by: 'a', say: "That the person telling you you're safe is usually the one writing your name." },
      { by: 'b', say: "That's very dark." },
      { by: 'a', say: "I got blindsided on {lastSeason}. It's a dark lesson." },
      { by: 'b', say: "So if I tell you you're safe..." },
      { by: 'a', say: "Then I'll smile and say thank you, and I'll watch you very closely." },
      { by: 'a', conf: "Last time I believed everybody. This time I'm going to believe what people do, not what they say." },
    ] }),
  ],
  'long.ret.asked.mid': [
    P({ id: 'nrt.a8', turns: [
      { by: 'b', say: "So, last time. How did it go?" },
      { by: 'a', say: "{lastPlace}. Not first out, not the final. Right in the middle." },
      { by: 'b', say: "What went wrong?" },
      { by: 'a', say: "I waited. I kept thinking there'd be a better time to make my move, and then there wasn't one." },
      { by: 'b', say: "And this time?" },
      { by: 'a', say: "This time I'm not waiting for anything." },
      { by: 'b', say: "That sounds like a warning." },
      { by: 'a', say: "It's a promise. To myself, mostly." },
      { by: 'a', conf: "I finished {lastPlace} on {lastSeason} because I played it safe. Safe got me sent home. So no more safe." },
    ] }),
  ],

  // ── two returnees agree to look out for each other ──
  'long.ret.bloc.allies': [
    P({ id: 'nrt.o1', place: 'secret', turns: [
      { beat: "{a} and {b} end up at the edge of camp, watching the new people argue over the fire." },
      { by: 'a', say: "Look at them. They've never done this before." },
      { by: 'b', say: "And every one of them knows we have." },
      { by: 'a', say: "Which means every one of them is going to want us gone." },
      { by: 'b', say: "So we do what we did last time. We stick together." },
      { by: 'a', say: "Quietly, though. If they see us whispering, we're done." },
      { by: 'b', say: "Then we don't whisper where they can see." },
      { by: 'b', conf: "{a} and I had each other's backs on {lastSeason}. With all these new faces, that's worth more than it ever was." },
    ] }),
  ],
  'long.ret.bloc.none': [
    P({ id: 'nrt.o2', place: 'secret', turns: [
      { by: 'a', say: "We weren't exactly friends last time." },
      { by: 'b', say: "We weren't enemies, either. We just never talked." },
      { by: 'a', say: "Well, right now we're the only two people here who've done this before." },
      { by: 'b', say: "And everybody else knows it." },
      { by: 'a', say: "Exactly. The new people are going to want the returnees gone, one at a time." },
      { by: 'b', say: "Unless the returnees stick together." },
      { by: 'a', say: "Unless the returnees stick together." },
      { by: 'b', say: "Okay. Allies. We can work on friends later." },
      { by: 'b', conf: "{a} and I barely knew each other on {lastSeason}. Now we're on a team full of strangers, and suddenly {a} is the closest thing to an old friend I've got." },
    ] }),
  ],

  // ── two newcomers agree {target} has to go before settling in ──
  'long.ret.target.won': [
    P({ id: 'nrt.v1', place: 'secret', turns: [
      { by: 'a', say: "Can I say something that's going to sound crazy this early?" },
      { by: 'b', say: "Sure." },
      { by: 'a', say: "We have to get rid of {target}. Not later. As soon as we lose." },
      { by: 'b', say: "{target} has barely done anything yet." },
      { by: 'a', say: "{target} has already won this whole thing once. {target} doesn't need to do anything yet, that's the point." },
      { by: 'b', say: "People are going to say we're scared of {target}." },
      { by: 'a', say: "We are scared of {target}. That's not an insult, that's just good sense." },
      { by: 'b', say: "...Fine. If we lose, it's {target}." },
      { by: 'b', conf: "I was going to keep my head down for a week. {a} wants to take out the champion this early. Honestly, {a} might be right." },
    ] }),
  ],
  'long.ret.target.final': [
    P({ id: 'nrt.v2', place: 'secret', turns: [
      { by: 'a', say: "{target} got all the way to the end last time." },
      { by: 'b', say: "I know, I watched it." },
      { by: 'a', say: "Then you know nobody here should be sitting next to {target} at the end." },
      { by: 'b', say: "So you want {target} out first." },
      { by: 'a', say: "Before {target} makes a single friend. Once {target} has friends, it's too late." },
      { by: 'b', say: "Okay. {target}, the first chance we get." },
      { by: 'a', conf: "The new people have to stick together. The returnees already know how. That's the whole game for us right now." },
    ] }),
  ],
  'long.ret.target.many': [
    P({ id: 'nrt.v3', place: 'secret', turns: [
      { by: 'a', say: "Have you noticed the returnees always end up next to each other?" },
      { by: 'b', say: "At every single meal, yeah." },
      { by: 'a', say: "They're building something. They've done this before, they know how to find each other." },
      { by: 'b', say: "So what, we just vote out all of them?" },
      { by: 'a', say: "One at a time, starting with {target}, before they finish building whatever they're building." },
      { by: 'b', say: "And if they figure out what we're doing?" },
      { by: 'a', say: "Then there are still more of us than them. That's the only advantage we have, so let's use it." },
      { by: 'b', conf: "{a} is right. The returnees have experience, and we have numbers. If we wait, they'll have both." },
    ] }),
  ],
  'long.ret.target.one': [
    P({ id: 'nrt.v4', place: 'secret', turns: [
      { by: 'a', say: "{target} is the only one here who knows how this game actually works." },
      { by: 'b', say: "Isn't that a reason to keep {target} around? We could learn from {target}." },
      { by: 'a', say: "Learn fast, then. Because I want {target} gone before {target} teaches anybody anything." },
      { by: 'b', say: "That's harsh." },
      { by: 'a', say: "It's harsh, but everybody else here is guessing. {target} isn't. Every day {target} is here, {target} gets further ahead." },
      { by: 'b', say: "...Okay. You've convinced me." },
      { by: 'b', conf: "I actually like {target}. But {a} is right. We're all playing this for the first time, and {target} is playing it for the second." },
    ] }),
  ],

  // ── a returnee alone with the camera, on what last time means now (psyche.js 'redemption'; td/past.js) ──
  'psy.redemption': [
    P({ id: 'nrt.p1', when: { moment: 'quiet', past: 'won' }, turns: [
      { by: 'a', conf: "I won {lastSeason}. Everybody here knows it, and every conversation I have, I can see them doing the math on how to get rid of me." },
      { by: 'a', conf: "Winning once was the dream. Winning twice is about proving it wasn't a fluke, and honestly, that's scarier." },
    ] }),
    P({ id: 'nrt.p2', when: { moment: 'votes', past: 'won' }, turns: [
      { by: 'a', conf: "My name came up last night. Of course it did, I'm the one who already won." },
      { by: 'a', conf: "When I won, nobody saw me coming. This time everybody saw me walk in. I have to win a completely different way." },
    ] }),
    P({ id: 'nrt.p3', when: { moment: 'bottom', past: 'won' }, turns: [
      { by: 'a', conf: "I'm on the bottom, and it's because I've won this before. Nobody's even pretending it's about anything else." },
      { by: 'a', conf: "Fine. I won one way. I can win from the bottom too." },
    ] }),
    P({ id: 'nrt.p4', when: { moment: 'quiet', past: 'final' }, turns: [
      { by: 'a', conf: "I finished {lastPlace} on {lastSeason}. All the way to the end and then, not quite." },
      { by: 'a', conf: "I think about that last night every single day. I didn't come back for a good run. I came back for the part I didn't get." },
    ] }),
    P({ id: 'nrt.p5', when: { moment: 'votes', past: 'final' }, turns: [
      { by: 'a', conf: "Last time I got to the very end by being careful. Tonight my name was out there, and being careful isn't going to save me." },
      { by: 'a', conf: "I've already lost at the last step once. I'm not losing at the first ones." },
    ] }),
    P({ id: 'nrt.p6', when: { moment: 'quiet', past: 'early' }, turns: [
      { by: 'a', conf: "Last time I went home {lastPlace}. I barely got to unpack." },
      { by: 'a', conf: "Every day I'm still here is a day I never had last time. I know that sounds small. It's huge to me." },
    ] }),
    P({ id: 'nrt.p7', when: { moment: 'votes', past: 'early' }, turns: [
      { by: 'a', conf: "I've already lasted longer than last time, and I still almost cried when they didn't read my name." },
      { by: 'a', conf: "Nobody here remembers me from {lastSeason}, which is the best thing that could have happened. I want to keep it that way." },
    ] }),
    P({ id: 'nrt.p8', when: { moment: 'quiet', past: 'blindsided', pastBy: true }, turns: [
      { by: 'a', conf: "{lastBy} blindsided me on {lastSeason}. I've watched that vote back more times than I'd ever admit." },
      { by: 'a', conf: "What gets me is how nice everybody was that day. So now when somebody's really nice to me, I count the votes." },
    ] }),
    P({ id: 'nrt.p9', when: { moment: 'quiet', past: 'mid' }, turns: [
      { by: 'a', conf: "I finished {lastPlace} last time, and the honest reason is that I never made a move. I just kept waiting for a better one." },
      { by: 'a', conf: "I'm not waiting this time. If I go home, I want it to be because I tried something." },
    ] }),
    P({ id: 'nrt.p10', when: { moment: 'lost', lastBoot: true, past: 'won' }, turns: [
      { by: 'a', conf: "{lastBoot} went home last night instead of me, and I know exactly why. They're saving me for later, because I'm the big one." },
      { by: 'a', conf: "Being the big target means everybody else goes first, right up until it doesn't." },
    ] }),
  ],

  // ── at the vote: the host brings up last time (td/story/tribal.js 'returnee'; b is somebody new, when there is one) ──
  'tqa.returnee.any': [
    P({ id: 'nrt.q1', when: { past: 'won', pair: true }, turns: [
      { by: 'h', say: "{a}, you won {lastSeason}. Does everybody here want to be the one who takes you out?" },
      { by: 'a', say: "I'd be offended if they didn't." },
      { by: 'h', say: "{b}, is {a} right?" },
      { by: 'b', say: "Everybody likes {a}. Everybody also remembers how that season ended." },
      { by: 'a', say: "That's the most polite threat I've ever heard." },
    ] }),
    P({ id: 'nrt.q2', when: { past: 'won' }, turns: [
      { by: 'h', say: "{a}, you've won this game before. How does this vote feel?" },
      { by: 'a', say: "Different. When I won, nobody was looking at me. Now everybody is." },
      { by: 'h', say: "And you're okay with that?" },
      { by: 'a', say: "I have to be. It comes with the title." },
    ] }),
    P({ id: 'nrt.q3', when: { past: 'final', pair: true }, turns: [
      { by: 'h', say: "{a}, you finished {lastPlace} last time, one step from winning. Do people here see you as somebody who knows how to get to the end?" },
      { by: 'a', say: "I hope they see me as somebody who knows how close is not enough." },
      { by: 'h', say: "{b}, does that make {a} dangerous?" },
      { by: 'b', say: "It makes {a} somebody I'm watching." },
    ] }),
    P({ id: 'nrt.q4', when: { past: 'early' }, turns: [
      { by: 'h', say: "{a}, last time you went home {lastPlace}. You've already lasted longer this time. How does that feel?" },
      { by: 'a', say: "Honestly? Like every vote I survive is a little win nobody else in this room understands." },
      { by: 'h', say: "Are you going to survive this one?" },
      { by: 'a', say: "Ask me in ten minutes." },
    ] }),
    P({ id: 'nrt.q5', when: { past: 'blindsided', pastBy: true }, turns: [
      { by: 'h', say: "{a}, last time you walked in here thinking you were safe, and {lastBy} sent you home. Do you feel safe tonight?" },
      { by: 'a', say: "I haven't felt safe since that night." },
      { by: 'h', say: "That's a yes or a no?" },
      { by: 'a', say: "That's a 'I'm watching everybody's face very closely right now'." },
    ] }),
    P({ id: 'nrt.q6', when: { past: ['blindsided', 'mid'], pair: true }, turns: [
      { by: 'h', say: "{a}, what did you learn last time that you're using tonight?" },
      { by: 'a', say: "That the vote you're sure about is the one that gets you." },
      { by: 'h', say: "{b}, are you sure about tonight's vote?" },
      { by: 'b', say: "...I was, until about five seconds ago." },
    ] }),
    P({ id: 'nrt.q7', when: { past: 'mid' }, turns: [
      { by: 'h', say: "{a}, you finished {lastPlace} on {lastSeason}. What's different this time?" },
      { by: 'a', say: "Last time I waited for the right moment and it never came. This time I'm not waiting." },
      { by: 'h', say: "Is tonight the moment?" },
      { by: 'a', say: "You'll find out when everybody else does." },
    ] }),
  ],

  // ── the vote, when the target is a returnee (write.js: targetPast, {lastSeasonT}, {lastPlaceT}; targetWronged:
  // the target is who blindsided or betrayed a last time) ──
  'story.vote.plan.threat': [
    P({ id: 'nrt.vt1', when: { targetPast: 'won' }, turns: [
      { beat: "{a} waits until {target} is well out of earshot, then sits down next to {b} {here}." },
      { by: 'a', say: "It has to be {target} tonight." },
      { by: 'b', say: "{target} hasn't done anything to us." },
      { by: 'a', say: "{target} doesn't need to. {target} won {lastSeasonT}. Everybody here is playing for second until {target} is gone." },
      { by: 'b', say: "People will say we panicked." },
      { by: 'a', say: "Let them. We've got {votes}. That's not panic, that's the only chance we're going to get." },
      { by: 'b', say: "And if it doesn't work?" },
      { by: 'a', say: "Then {target} knows we tried, and we're next. So it has to work." },
      { by: 'b', say: "...Okay. {target}." },
      { by: 'a', conf: "You don't let a winner settle in. The longer {target} stays, the more it looks like the last season all over again." },
    ] }),
    P({ id: 'nrt.vt2', when: { targetPast: 'final' }, turns: [
      { by: 'a', say: "Can we talk about {target} for a second?" },
      { by: 'b', say: "What about {target}?" },
      { by: 'a', say: "{target} finished {lastPlaceT} last time. All the way to the end. And nobody here is even watching {target}." },
      { by: 'b', say: "Because {target} is easy to like." },
      { by: 'a', say: "Exactly, and that's how {target} got to the end last time. Easy to like, right up until the jury votes." },
      { by: 'b', say: "So tonight?" },
      { by: 'a', say: "Tonight. We've got {votes}, and I don't know if we'll have them next week." },
      { by: 'b', say: "Fine. {target}." },
      { by: 'a', conf: "{target} has already been one vote from winning this. I'm not going to be the one who lets {target} get that close again." },
    ] }),
  ],
  'story.vote.plan.grudge': [
    P({ id: 'nrt.vg1', when: { targetWronged: true, past: ['won', 'final', 'early', 'blindsided', 'mid'] }, turns: [
      { by: 'a', say: "I need you with me on {target} tonight." },
      { by: 'b', say: "Is this about last season?" },
      { by: 'a', say: "{target} turned on me on {lastSeason}. Smiled at me all day and wrote my name at night." },
      { by: 'b', say: "That was a different game." },
      { by: 'a', say: "Same person, though. And I'm not going to sit next to {target} and wait for it to happen twice." },
      { by: 'b', say: "Is it the right vote, or just the one you want?" },
      { by: 'a', say: "Tonight it's both. We've got {votes}." },
      { by: 'b', say: "Okay. I'm in." },
      { by: 'a', conf: "I've waited a whole season to write {target}'s name down. I'm going to enjoy every letter.", v: { warm: "I don't want to enjoy this. I just want to stop looking over my shoulder at {target}.", anxious: "My hand's going to shake writing it. It shook last time too, when it was my name." } },
    ] }),
  ],
  'vp.solo.case.threat': [
    P({ id: 'nrt.vs1', when: { targetPast: 'won' }, turns: [{ by: 'a', conf: "{target} won {lastSeasonT}. I'm not going to be the one who helps {target} do it twice." }] }),
    P({ id: 'nrt.vs2', when: { targetPast: 'final' }, turns: [{ by: 'a', conf: "{target} finished {lastPlaceT} last time. Somebody who's been that close knows exactly how to get there again." }] }),
  ],
  'vp.solo.case.grudge': [
    P({ id: 'nrt.vs3', when: { targetWronged: true, past: ['won', 'final', 'early', 'blindsided', 'mid'] }, turns: [{ by: 'a', conf: "{target} turned on me on {lastSeason}. This one is for me." }] }),
  ],
  'vp.solo.case.numbers': [
    P({ id: 'nrt.vs4', when: { targetPast: ['won', 'final', 'blindsided', 'mid', 'early'] }, turns: [{ by: 'a', conf: "Everybody's going for the returnee tonight. I'm not going to be the one vote that keeps {target} here." }] }),
  ],

  // ── the entrance, as what really happened last time (td/story/arrival.js 'arrive.back'; h is the host) ──
  'arrive.back.any': [
    P({ id: 'nrt.e1', when: { past: 'won' }, turns: [
      { by: 'a', say: "Thank you, thank you. Please, hold your applause until I win again." },
      { by: 'h', say: "Confident." },
      { by: 'a', say: "I've done it once. I know the way." },
      { by: 'a', conf: "Everybody on that dock clapped for me. Every single one of them is already working out how to beat me. That's what it means to come back as the winner." },
    ] }),
    P({ id: 'nrt.e2', when: { past: 'won', voice: ['anxious', 'warm', 'emotional', 'quiet', 'earnest'] }, turns: [
      { by: 'h', say: "So how does it feel, coming back as the champion?" },
      { by: 'a', say: "Terrifying, honestly. When I won, nobody expected anything from me." },
      { by: 'h', say: "And this time?" },
      { by: 'a', say: "This time everybody here expects me to win, and everybody here wants me to lose." },
      { by: 'a', conf: "Winning {lastSeason} changed my life. Coming back might be the stupidest thing I've ever done, and I couldn't say no." },
    ] }),
    P({ id: 'nrt.e3', when: { past: 'final' }, turns: [
      { by: 'h', say: "So, back for the rest of it?" },
      { by: 'a', say: "Back for the part I didn't get to finish." },
      { by: 'h', say: "No pressure." },
      { by: 'a', say: "There's nothing but pressure. That's fine. I've been carrying it since the finale." },
      { by: 'a', conf: "I've watched that finale more times than anybody should. I know exactly what I did wrong at the end. I'm not doing it again." },
    ] }),
    P({ id: 'nrt.e4', when: { past: 'early' }, turns: [
      { by: 'a', say: "Before anybody says it, yes, I'm the one who went home almost straight away." },
      { by: 'h', say: "I wasn't going to say anything." },
      { by: 'a', say: "You were absolutely going to say something." },
      { by: 'h', say: "Fine. Try to stay long enough for me to learn your name this time." },
      { by: 'a', say: "Learn it now. I'm staying." },
      { by: 'a', conf: "I went home {lastPlace} last time. Everybody else on that dock came back as somebody. I came back as a punchline, and I'm going to turn that into an advantage." },
    ] }),
    P({ id: 'nrt.e5', when: { past: 'blindsided', pastBy: true }, turns: [
      { by: 'h', say: "Last time didn't end so well, did it?" },
      { by: 'a', say: "{lastBy} blindsided me, if that's what you mean." },
      { by: 'h', say: "That's exactly what I mean." },
      { by: 'a', say: "Then yes, it ended badly. This time it won't." },
      { by: 'a', conf: "I came back for a lot of reasons. One of them is that I never want to be that surprised again in my life." },
    ] }),
    P({ id: 'nrt.e6', when: { past: 'mid' }, turns: [
      { by: 'h', say: "{lastPlace} is solid, you know. Not memorable, but solid." },
      { by: 'a', say: "Did you just call me not memorable?" },
      { by: 'h', say: "I'm paid to be honest." },
      { by: 'a', say: "You're paid to be mean." },
      { by: 'a', conf: "{lastPlace} on {lastSeason}. Nobody remembers {lastPlace}. This time I'm going to make sure they remember me." },
    ] }),
  ],

  // ── the host brings a returnee back on (td/story/arrival.js: in place of the first-timer's 'arrive.host') ──
  'arrive.hostback.any': [
    P({ id: 'nrt.h1', when: { past: 'won' }, turns: [{ by: 'h', say: "And here comes the winner of {lastSeason}! {a}, everybody! Try to act surprised when {a} wins again." }] }),
    P({ id: 'nrt.h2', when: { past: 'won' }, turns: [{ by: 'h', say: "{a} has walked away from this show with the money before. Let's see if anybody remembers how to beat {a.obj}." }] }),
    P({ id: 'nrt.h3', when: { past: 'final' }, turns: [{ by: 'h', say: "Here's {a}, who finished {lastPlace} on {lastSeason} and has been very normal about it ever since. Very normal." }] }),
    P({ id: 'nrt.h4', when: { past: 'final' }, turns: [{ by: 'h', say: "{a} is back! One vote from winning last time. I'm sure that doesn't keep {a} up at night." }] }),
    P({ id: 'nrt.h5', when: { past: 'early' }, turns: [{ by: 'h', say: "Remember {a}? No? That's fair, {a} was gone {lastPlace} on {lastSeason}. Second chances, people!" }] }),
    P({ id: 'nrt.h6', when: { past: 'early' }, turns: [{ by: 'h', say: "{a} is back for another go, after a very, very short first one." }] }),
    P({ id: 'nrt.h7', when: { past: 'blindsided', pastBy: true }, turns: [{ by: 'h', say: "Here's {a}, who last time found out at the vote that {lastBy} had other plans. Awkward!" }] }),
    P({ id: 'nrt.h8', when: { past: ['blindsided', 'mid'] }, turns: [{ by: 'h', say: "{a}! {lastPlace} on {lastSeason}, back for more. Some people never learn." }] }),
    P({ id: 'nrt.h9', when: { past: 'mid' }, turns: [{ by: 'h', say: "Welcome back, {a}! {lastPlace} last time. This time, try to do something I'll remember." }] }),
    P({ id: 'nrt.h10', turns: [{ by: 'h', say: "Look who's back! {a}, everybody. Some of you have seen {a} play. The rest of you are about to." }] }),
    P({ id: 'nrt.h11', turns: [{ by: 'h', say: "{a}! I said I'd never have {a} back on this show. Then the ratings came in." }] }),
    P({ id: 'nrt.h12', turns: [{ by: 'h', say: "Welcome back, {a}! Some of you are about to find out why the rest of us remember {a.obj}." }] }),
    P({ id: 'nrt.h13', turns: [{ by: 'h', say: "And look who couldn't stay away. {a}, everybody!" }] }),
    P({ id: 'nrt.h14', turns: [{ by: 'h', say: "{a} is back. Newbies, take notes. Or run. Either is fine." }] }),
    P({ id: 'nrt.h15', turns: [{ by: 'h', say: "Here's a face some of you know. {a}, back for round two!" }] }),
    P({ id: 'nrt.h16', turns: [{ by: 'h', say: "{a}! Our producers begged. I said no. They begged harder." }] }),
    P({ id: 'nrt.h17', turns: [{ by: 'h', say: "Everybody, {a} has done this before. Try not to look too scared." }] }),
  ],

  // ── on the dock: a new player recognises a returnee who is already there (a new, b returnee) ──
  // The old one had every returnee answer "I went home", the season's winner included (the user, 2026-10-10:
  // "the writing is horrendous"). Each is what really happened to b (td/past.js pastB).
  'arrive.meet.fan-of-them': [
    P({ id: 'nrt.f1', when: { pastB: 'won' }, turns: [
      { by: 'a', say: "Hang on. You're {b}. You won {lastSeasonB}." },
      { by: 'b', say: "Guilty.", v: { proud: "I did. Thank you for noticing.", dry: "That's what they tell me." } },
      { by: 'a', say: "I watched that finale twice. I couldn't believe how that jury voted." },
      { by: 'b', say: "Neither could I, honestly." },
      { by: 'a', say: "So you've done this already. Any advice?" },
      { by: 'b', say: "Plenty. I'm just not giving it to the competition on day one." },
      { by: 'b', conf: "Every new player who recognises me has already decided I'm the one to beat. I'd rather they worked that out a little later." },
    ] }),
    P({ id: 'nrt.f2', when: { pastB: 'final' }, turns: [
      { by: 'a', say: "Oh my gosh, you're {b}! You came {lastPlaceB} last time. You were so close!" },
      { by: 'b', say: "Thanks. I'd almost forgotten.", v: { warm: "I know. I think about it more than I should.", loud: "Don't remind me! I'm still not over it!" } },
      { by: 'a', say: "Sorry. I was rooting for you, for what it's worth." },
      { by: 'b', say: "Everybody says that afterwards. Nobody on that jury did." },
      { by: 'a', conf: "{b} got to the very end last time and lost. I don't know if that makes {b.obj} dangerous or desperate. Probably both." },
    ] }),
    P({ id: 'nrt.f3', when: { pastB: 'early' }, turns: [
      { by: 'a', say: "Wait, weren't you on the show before?" },
      { by: 'b', say: "For about three days, yeah." },
      { by: 'a', say: "Oh, right. I remember now. That vote was rough." },
      { by: 'b', say: "It was. I've had a long time to think about what I'd do differently." },
      { by: 'a', say: "And?" },
      { by: 'b', say: "And I'm not telling you on the dock." },
      { by: 'b', conf: "Hardly anybody remembers my first season. That's the best thing about it." },
    ] }),
    P({ id: 'nrt.f4', when: { pastB: 'blindsided' }, turns: [
      { by: 'a', say: "You're {b}. I watched you get blindsided last time. I actually yelled at my TV." },
      { by: 'b', say: "You and me both." },
      { by: 'a', say: "You really didn't see it coming?" },
      { by: 'b', say: "Not even a little. That's why I'm going to see everything coming this time." },
      { by: 'b', conf: "Every new player here watched me go out the worst way possible. Some of them feel sorry for me. I'm going to use that." },
    ] }),
    P({ id: 'nrt.f5', when: { pastB: 'mid' }, turns: [
      { by: 'a', say: "You're {b}! You were really good last time." },
      { by: 'b', say: "I finished {lastPlaceB}. 'Really good' is generous." },
      { by: 'a', say: "Well, I liked you." },
      { by: 'b', say: "Then you're going to be very easy to talk to." },
      { by: 'a', conf: "{b} was nice to me, but I can't tell if that was {b} being nice, or {b} playing already." },
    ] }),
  ],

  // ── on the dock: a returnee arrives and a new player already there recognises them (a returnee, b new) ──
  'arrive.meet.fan': [
    P({ id: 'nrt.m1', when: { past: 'won' }, turns: [
      { beat: "{b}, already on {landing}, stops talking mid-sentence as {a} steps off." },
      { by: 'b', say: "No way. That's {a}. That's the actual winner." },
      { by: 'a', say: "Hi. Please don't make it weird." },
      { by: 'b', say: "It's already weird. I'm sorry. Hi." },
      { by: 'a', conf: "I've been on this dock thirty seconds and the new players are already looking at me like a target with a nice smile." },
    ] }),
    P({ id: 'nrt.m2', when: { past: ['final', 'mid', 'blindsided'] }, turns: [
      { beat: "{b}, already on {landing}, goes very still as {a} steps off." },
      { by: 'b', say: "That's {a}. I watched your whole season." },
      { by: 'a', say: "The whole thing? Even the end?" },
      { by: 'b', say: "Especially the end." },
      { by: 'a', conf: "The new ones all know how my last season went. That's great for my ego and terrible for my game." },
    ] }),
    P({ id: 'nrt.m3', when: { past: 'early' }, turns: [
      { by: 'b', say: "Wait, I know you. Weren't you the one who went home right at the start?" },
      { by: 'a', say: "{lastPlace}, thank you. Nice to meet you too." },
      { by: 'b', say: "Sorry! I didn't mean it like that." },
      { by: 'a', say: "Yes, you did. It's fine. I'd have said it too." },
      { by: 'a', conf: "Everybody else came back as somebody. I came back as the one who went home first. Fine. Nobody's scared of that one." },
    ] }),
  ],
};
