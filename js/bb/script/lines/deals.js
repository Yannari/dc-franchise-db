// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/deals.js — promises kept, broken and found out (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for the rest of bb-events/deals.js. Each event keeps its casting,
// weight and consequences; the ENDING is what it decided first.
//
//   deals.exposed      deals-exposed          a works out that b and c have an endgame deal
//                      found; `reason` is the deal's tier: final-two | final-three
//   deals.defection    deals-defection        a tries to pull b out of b's alliance
//                      refused | tempted
//   deals.broken       deals-broken-promise   a calls b out, in front of people, on a promise b broke
//                      confronted
//   deals.jury-manage  deals-jury-management  a lays groundwork with b, a future juror
//                      smooth | botched
//   deals.final-three  deals-final-three-pact a, b and c agree to the last three chairs
//                      made
//   deals.competing    deals-competing        a has promised the end to both b and c
//                      collide
//   deals.hedged       deals-hedged           a takes a second final two, with b, on top of one with c
//                      hedged
//   deals.jury-pact    deals-jury-pact        a and b promise to make jury together
//                      made
//   deals.vote-flip    deals-vote-flip        a promised b a vote this week
//                      kept | flipped

export default {
  // ── an endgame deal, found out ─────────────────────────────────────
  'deals.exposed.found': [
    { id: 'de.f1', turns: [
      { by: 'a', dr: "{b} and {c} have come out of the same room, one after the other, four times this week. Nobody does that by accident." },
    ] },
    { id: 'de.f2', when: { room: ['kitchen'] }, turns: [
      { beat: '{c} is halfway through a sentence in the kitchen, sees {a}, and stops.' },
      { by: 'a', dr: "{c} stopped talking the second I walked in. {b} and {c} are working together, and they don't want anyone to know." },
    ] },
    { id: 'de.f3', turns: [
      { by: 'a', dr: "I asked {b} a simple question, and {b} lied. I could tell. {b} and {c} are going to the end together. I'd bet anything on it." },
    ] },
    { id: 'de.f4', turns: [
      { by: 'a', dr: "Everybody thinks {b} and {c} barely talk. I think they do it on purpose, so nobody suspects them." },
    ] },
    { id: 'de.f5', turns: [
      { by: 'a', dr: "I'm not going to confront them. I'm going to tell three people, and let the house do the rest." },
    ] },
    { id: 'de.f6', turns: [
      { beat: '{a} watches {b} and {c} pass each other in the hallway without a word, and then exchange a look.' },
      { by: 'a', dr: "They didn't say a word to each other. They didn't need to. They're working together." },
    ] },
    { id: 'de.f7', turns: [
      { by: 'a', dr: "{b} defended {c} at dinner. Out of nowhere. Nobody had even said {c}'s name. That's not friendship. That's a deal." },
    ] },
    { id: 'de.f8', turns: [
      { by: 'a', dr: "Once you see it, you can't stop seeing it. {b} and {c} vote together, sit together and cover for each other." },
    ] },
    { id: 'de.f9', when: { reason: 'final-two' }, turns: [
      { by: 'a', dr: "{b} and {c} have a final two. I'd put money on it. And if I'm right, everybody else in this house is just playing for third." },
    ] },
    { id: 'de.f10', when: { reason: 'final-two' }, turns: [
      { by: 'a', dr: "{b} and {c} have a final two. And I'm going to make sure everyone knows." },
    ] },
    { id: 'de.f11', when: { reason: 'final-two' }, turns: [
      { by: 'a', dr: "If {b} and {c} get to the end together, the rest of us have no chance. I'm not letting that happen." },
    ] },
    { id: 'de.f12', when: { reason: 'final-three' }, turns: [
      { by: 'a', dr: "{b}, {c} and somebody else have a final three. I'm sure of it. And I'm not in it." },
    ] },
    { id: 'de.f13', when: { reason: 'final-three' }, turns: [
      { by: 'a', dr: "{b} and {c} are in a group of three. That's a lot of votes. That's a problem for me." },
    ] },
    { id: 'de.f14', when: { register: 'schemer' }, turns: [
      { by: 'a', dr: "I know {b} and {c} have a deal. That's very useful to me. I just need to pick who to tell." },
    ] },
    { id: 'de.f15', when: { register: 'cool' }, turns: [
      { by: 'a', dr: "I've watched every vote. {b} and {c} have never once been on opposite sides. That isn't a coincidence. It's a plan." },
    ] },
    { id: 'de.f16', when: { register: 'fiery' }, turns: [
      { by: 'a', dr: "They think they're so clever, {b} and {c}. They're not clever. They're obvious. And I'm about to tell everybody." },
    ] },
  ],

  // ── an offer to leave your alliance ────────────────────────────────
  'deals.defection.refused': [
    { id: 'df.r1', turns: [
      { by: 'a', say: "You're fourth in that group, and you know it." },
      { by: 'b', say: "Maybe. But it's my group." },
      { by: 'a', say: "Fourth with people you know?" },
      { by: 'b', say: "Is still better than second with you." },
    ] },
    { id: 'df.r2', turns: [
      { by: 'a', say: "Come with us. We'd take you further than they will." },
      { by: 'b', say: "No. Thank you, but no." },
      { by: 'b', dr: "I said no straight away. Then I lay awake thinking about it for two hours. Which is exactly what {a} wanted." },
    ] },
    { id: 'df.r3', turns: [
      { by: 'a', say: "I'm just saying, there's room for you with us." },
      { by: 'b', say: "And I'm just saying, I'm going to tell my people you asked." },
      { by: 'a', say: "...Fair enough." },
    ] },
    { id: 'df.r4', turns: [
      { by: 'a', say: "Think about it. That's all I'm asking." },
      { by: 'b', say: "I've thought about it. The answer's no." },
      { by: 'a', say: "That was quick." },
      { by: 'b', say: "Loyalty usually is." },
    ] },
    { id: 'df.r5', turns: [
      { by: 'a', say: "They'll cut you the second it suits them." },
      { by: 'b', say: "Maybe. But they haven't. And you're asking me to cut them first." },
      { by: 'b', dr: "{a} makes a good point. That's what worries me. I'm still saying no." },
    ] },
    { id: 'df.r6', turns: [
      { by: 'a', say: "You'd be safe with us. Properly safe." },
      { by: 'b', say: "I'm safe now." },
      { by: 'a', say: "For how long?" },
      { by: 'b', say: "Long enough. Goodnight, {a}." },
    ] },
    { id: 'df.r7', turns: [
      { by: 'b', say: "Did you really just try to recruit me in the bathroom?" },
      { by: 'a', say: "It's the only room without your friends in it." },
      { by: 'b', say: "And I'll be telling them about it in about five minutes." },
    ] },
    { id: 'df.r8', turns: [
      { by: 'a', say: "Just keep an open mind." },
      { by: 'b', say: "My mind's open. My vote isn't." },
    ] },
  ],
  'deals.defection.tempted': [
    { id: 'df.t1', turns: [
      { by: 'a', say: "Let me show you where you actually are in that group." },
      { by: 'b', say: "Go on." },
      { by: 'a', say: "Fourth. Maybe fifth. And they'll take you exactly that far." },
      { by: 'b', dr: "I didn't enjoy how right that sounded." },
    ] },
    { id: 'df.t2', turns: [
      { by: 'a', say: "They'll take you to fourth and no further." },
      { by: 'b', say: "...I know." },
      { by: 'a', say: "Then why are you still with them?" },
      { by: 'b', say: "I don't know. Habit." },
    ] },
    { id: 'df.t3', turns: [
      { by: 'a', say: "I'm not asking for an answer tonight." },
      { by: 'b', say: "Good. Because I haven't got one." },
      { by: 'a', dr: "{b} didn't say yes. But {b} didn't say no either. In here, that usually means yes." },
    ] },
    { id: 'df.t4', turns: [
      { by: 'a', say: "With us, you're second. With them, you're the spare." },
      { by: 'b', say: "That's a horrible way of putting it." },
      { by: 'a', say: "Is it wrong?" },
      { by: 'b', say: "...No." },
    ] },
    { id: 'df.t5', when: { early: false }, turns: [
      { by: 'b', say: "If I came with you, what happens to the others?" },
      { by: 'a', say: "Nothing, this week. After that, we'll see." },
      { by: 'b', dr: "\"We'll see\". I've been hearing \"we'll see\" from my own group for a month." },
    ] },
    { id: 'df.t6', turns: [
      { by: 'a', say: "When did they last tell you a plan before it happened?" },
      { by: 'b', say: "...I'm trying to remember." },
      { by: 'a', say: "Exactly." },
    ] },
    { id: 'df.t7', turns: [
      { by: 'a', say: "I'll be honest. We need one more vote, and I'd rather it was you." },
      { by: 'b', say: "That's the most honest pitch anyone's given me in here." },
      { by: 'b', dr: "My own alliance has never been that honest with me. I don't know what to do with that." },
    ] },
    { id: 'df.t8', turns: [
      { by: 'b', say: "Why me?" },
      { by: 'a', say: "Because you're the only one in that group they don't listen to." },
      { by: 'b', say: "...Ouch." },
      { by: 'a', say: "I'm listening, though." },
    ] },
  ],

  // ── a broken promise, called out in public ──────────────────────────
  'deals.broken.confronted': [
    { id: 'db.c1', turns: [
      { by: 'a', say: "You gave me your word." },
      { by: 'b', say: "Things changed." },
      { by: 'a', say: "Your word didn't come with an expiry date." },
      { by: 'b', say: "Everything in this game has an expiry date." },
    ] },
    { id: 'db.c2', turns: [
      { by: 'a', say: "I'm not angry." },
      { by: 'b', say: "You're clearly angry." },
      { by: 'a', say: "I'm disappointed. Angry would mean I expected better from you." },
      { beat: 'Nobody in the room says anything. Two people suddenly find something else to do.' },
    ] },
    { id: 'db.c3', turns: [
      { by: 'a', say: "Let's talk about the promise you made me. In front of everyone, since you made it in private." },
      { by: 'b', say: "Seriously? Here?" },
      { by: 'a', say: "Here. Now." },
      { by: 'b', say: "It meant something different at the time." },
      { by: 'a', say: "It meant exactly what you said. You just didn't think I'd remember." },
    ] },
    { id: 'db.c4', turns: [
      { by: 'b', say: "Let me explain." },
      { by: 'a', say: "Go on. I'd love to hear this." },
      { by: 'b', say: "The promise was about last week. Not this week." },
      { by: 'a', dr: "{b} explained for five minutes. I came out of it sure of exactly one thing: {b} is a liar." },
    ] },
    { id: 'db.c5', turns: [
      { by: 'a', say: "You looked me in the eye and promised me." },
      { by: 'b', say: "I know." },
      { by: 'a', say: "Then why?" },
      { by: 'b', say: "Because it was you or me. And I picked me." },
      { by: 'a', say: "At least that's honest. Finally." },
    ] },
    { id: 'db.c6', turns: [
      { by: 'a', say: "Everybody should know this. {b} made me a promise. Then {b} went back on it." },
      { by: 'b', say: "That's not the whole story." },
      { by: 'a', say: "Then tell them the whole story." },
      { beat: '{b} doesn\'t say anything. Everyone notices.' },
    ] },
    { id: 'db.c7', turns: [
      { by: 'a', say: "Do you remember what you said to me? The exact words?" },
      { by: 'b', say: "Not exactly." },
      { by: 'a', say: "I do. Every single one." },
      { by: 'b', dr: "{a} has a very good memory. That's going to be a problem for me." },
    ] },
    { id: 'db.c8', turns: [
      { by: 'a', say: "I trusted you. That was my mistake." },
      { by: 'b', say: "Don't make this bigger than it is." },
      { by: 'a', say: "You broke a promise in a game where promises are all we've got. It's exactly as big as it is." },
    ] },
    { id: 'db.c9', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "LIAR! You're a liar, {b}, and everyone's going to know it!" },
      { by: 'b', say: "Calm down!" },
      { by: 'a', say: "Calm down? You promised me!" },
    ] },
    { id: 'db.c10', when: { register: 'cool' }, turns: [
      { by: 'a', say: "I'm not going to shout. I just want everyone here to know what your promises are worth." },
      { by: 'b', say: "That's a low blow." },
      { by: 'a', say: "Lower than breaking one?" },
    ] },
  ],

  // ── laying groundwork with a future juror ───────────────────────────
  'deals.jury-manage.smooth': [
    { id: 'dj.s1', turns: [
      { by: 'a', say: "Whatever happens to either of us, I want you to think I played it straight." },
      { by: 'b', say: "Why are you telling me this now?" },
      { by: 'a', say: "Because now is when it's true. Later it would just sound like a speech." },
      { by: 'b', dr: "I know what that was. {a} is trying to get my jury vote early. I'll remember it." },
    ] },
    { id: 'dj.s2', turns: [
      { by: 'a', say: "I just want you to know where I've been all game. No surprises." },
      { by: 'b', say: "That's fair. Go on." },
      { beat: '{a} walks {b} through every vote, calmly, as if none of it matters yet.' },
    ] },
    { id: 'dj.s3', turns: [
      { by: 'a', say: "You've played a good game. I mean that." },
      { by: 'b', say: "Thank you. Why does that sound like a goodbye?" },
      { by: 'a', say: "It isn't. It's just true." },
    ] },
    { id: 'dj.s4', turns: [
      { by: 'a', dr: "Everyone forgets about the jury until it's too late. I'm not going to. I'm being nice to the people who'll vote at the end." },
    ] },
    { id: 'dj.s5', turns: [
      { by: 'a', say: "If I ever have to make a move against you, I'll tell you to your face. That's a promise." },
      { by: 'b', say: "That's more than most people in here would offer." },
      { by: 'a', say: "Most people in here don't think about what happens after." },
    ] },
    { id: 'dj.s6', turns: [
      { by: 'b', say: "You've been really nice to me lately." },
      { by: 'a', say: "I've always been nice to you." },
      { by: 'b', say: "Lately, you've been nice on purpose." },
      { by: 'a', dr: "{b} sees right through it. That's fine. I'd rather the jury knows I was playing properly." },
    ] },
    { id: 'dj.s7', turns: [
      { by: 'a', say: "Can I ask you something? What would you want from someone sitting in the final two?" },
      { by: 'b', say: "Honesty. About everything they did." },
      { by: 'a', say: "Good. Then you'll get it from me." },
    ] },
  ],
  'deals.jury-manage.botched': [
    { id: 'dj.b1', turns: [
      { by: 'a', say: "If it ever comes to it, no hard feelings, yeah?" },
      { by: 'b', say: "If what comes to it?" },
      { by: 'a', say: "...Nothing. Just in general." },
      { by: 'b', dr: "So {a} has already thought about getting rid of me. Good to know." },
    ] },
    { id: 'dj.b2', turns: [
      { by: 'a', say: "If you go before me, I hope you'd still respect the move." },
      { by: 'b', say: "\"If\"?" },
      { by: 'a', say: "When. I mean if. I mean... it's just a thing people say." },
      { by: 'b', say: "It's really not." },
    ] },
    { id: 'dj.b3', turns: [
      { beat: '{a} spends twenty minutes explaining {a.posAdj} whole game to {b}, unprompted.' },
      { by: 'b', dr: "I came away with a very clear idea of who I'm not voting for at the end." },
    ] },
    { id: 'dj.b4', turns: [
      { by: 'a', say: "I just want you to know I'd never vote you out personally." },
      { by: 'b', say: "Only strategically?" },
      { by: 'a', say: "Yes! Exactly!" },
      { by: 'b', say: "That's worse, {a}." },
    ] },
    { id: 'dj.b5', turns: [
      { by: 'a', say: "When you're on the jury, remember I was nice to you." },
      { by: 'b', say: "When I'm on the jury?" },
      { by: 'a', say: "If! If you're on the jury!" },
      { by: 'b', dr: "{a} has already sent me home in {a.posAdj} head. That's useful information." },
    ] },
    { id: 'dj.b6', turns: [
      { by: 'a', say: "No matter what happens, we're cool, right?" },
      { by: 'b', say: "What's going to happen?" },
      { by: 'a', say: "Nothing. Probably." },
      { by: 'b', say: "\"Probably\" is doing a lot of work there." },
    ] },
    { id: 'dj.b7', turns: [
      { by: 'a', dr: "I'm laying groundwork with {b}. Being subtle about it." },
      { beat: 'Ten minutes later, {b} is telling two people that {a} just apologised in advance for voting {b.obj} out.' },
    ] },
  ],

  // ── a final three ─────────────────────────────────────────────────
  'deals.final-three.made': [
    { id: 'd3.m1', turns: [
      { by: 'a', say: "Three. Us three. All the way to the end." },
      { by: 'b', say: "All the way." },
      { by: 'c', say: "I'm in." },
      { by: 'c', dr: "There are three of us, and only one can win. Nobody said it, but we were all thinking it." },
    ] },
    { id: 'd3.m2', turns: [
      { by: 'b', say: "What if it's just the three of us at the end?" },
      { by: 'a', say: "Then we've done it right." },
      { by: 'c', say: "And then?" },
      { by: 'a', say: "And then may the best one win." },
    ] },
    { id: 'd3.m3', turns: [
      { beat: '{a}, {b} and {c} find themselves alone in the same room for the first time all week.' },
      { by: 'a', say: "We should make this official." },
      { by: 'c', say: "Make what official?" },
      { by: 'a', say: "Us. A final three. Before anyone else notices how well we work." },
    ] },
    { id: 'd3.m4', turns: [
      { by: 'b', say: "I'll protect you two. You protect me. Until it's three chairs." },
      { by: 'a', say: "Until it's three chairs." },
      { by: 'c', say: "Deal." },
      { by: 'b', dr: "It's the easiest deal I've ever made in here. That's what worries me about it." },
    ] },
    { id: 'd3.m5', turns: [
      { by: 'a', say: "Hands in." },
      { by: 'c', say: "We're not a sports team." },
      { by: 'a', say: "Hands in, {c}." },
      { beat: 'Three hands go in. One of them goes in slightly slower than the other two.' },
    ] },
    { id: 'd3.m6', turns: [
      { by: 'c', say: "Can we just agree on something right now? The three of us, to the end." },
      { by: 'a', say: "I thought you'd never ask." },
      { by: 'b', say: "To the end." },
    ] },
    { id: 'd3.m7', turns: [
      { by: 'a', say: "Nobody else knows about this. Nobody." },
      { by: 'b', say: "Who would we even tell?" },
      { by: 'c', say: "You'd be amazed who people tell in here." },
      { by: 'a', dr: "Three people keeping a secret in this house? I really hope we can do it." },
    ] },
    { id: 'd3.m8', when: { late: true }, turns: [
      { by: 'a', say: "Look around. There's barely anybody left. It could actually be us three." },
      { by: 'b', say: "Then let's make sure it is." },
      { by: 'c', say: "Final three. Shake on it." },
    ] },
    { id: 'd3.m9', turns: [
      { by: 'b', say: "I like this. Three is safer than two." },
      { by: 'c', say: "Until it isn't." },
      { by: 'a', say: "Let's worry about \"until it isn't\" when we get there." },
    ] },
    { id: 'd3.m10', turns: [
      { by: 'c', say: "So who goes when it's the four of us?" },
      { by: 'a', say: "Whoever isn't one of us three." },
      { by: 'b', say: "I like that answer." },
      { by: 'c', dr: "Easy answer. The hard part is what happens when it's just the three of us. Nobody wanted to talk about that." },
    ] },
  ],

  // ── two final twos, about to collide ───────────────────────────────
  'deals.competing.collide': [
    { id: 'dc.c1', turns: [
      { by: 'b', say: "Still final two, right?" },
      { by: 'a', say: "Of course." },
      { by: 'a', dr: "{c} asked me the exact same thing four hours ago, in almost the exact same words. I'm in trouble." },
    ] },
    { id: 'dc.c2', turns: [
      { by: 'b', say: "Who goes after this week?" },
      { by: 'a', say: "Erm... the plan, the usual plan." },
      { by: 'a', dr: "I've told {b} one order and {c} a different one. I've genuinely forgotten which one {b} got." },
    ] },
    { id: 'dc.c3', turns: [
      { by: 'a', dr: "I promised a final two to two different people. Both of them believe me. That's a problem." },
    ] },
    { id: 'dc.c4', turns: [
      { by: 'b', say: "{c} seems really sure of you lately." },
      { by: 'a', say: "Does {c}?" },
      { by: 'b', say: "Should I be worried?" },
      { by: 'a', say: "No. Not at all." },
      { by: 'a', dr: "{b} should be very worried. So should {c}. So should I." },
    ] },
    { id: 'dc.c5', turns: [
      { beat: '{b} and {c} are deep in conversation. {a} walks in, sees them together, and walks straight back out.' },
      { by: 'a', dr: "If those two ever compare notes, I'm finished." },
    ] },
    { id: 'dc.c6', turns: [
      { by: 'a', dr: "Two final twos is one too many. Sooner or later one of them is going to find out about the other." },
    ] },
  ],

  // ── a second final two, on top of the first ──────────────────────
  'deals.hedged.hedged': [
    { id: 'dh.h1', turns: [
      { by: 'b', say: "Final two. Me and you." },
      { by: 'a', say: "Yes. Absolutely." },
      { by: 'a', dr: "I already said yes to {c}. One of those conversations was a lie. I just don't know which one yet." },
    ] },
    { id: 'dh.h2', turns: [
      { by: 'b', say: "So? Final two, or not?" },
      { by: 'a', say: "Final two." },
      { by: 'a', dr: "It's insurance, not a lie. That's what everybody who does this tells themselves. Including me." },
    ] },
    { id: 'dh.h3', turns: [
      { by: 'b', say: "Me and you at the end. Who goes before us?" },
      { by: 'a', say: "Let's not get ahead of ourselves." },
      { by: 'a', dr: "If I'd named who goes first, I'd have had to leave {c} out of it. So I didn't name anybody." },
    ] },
    { id: 'dh.h4', turns: [
      { by: 'a', say: "Final two. Shake on it." },
      { beat: 'They shake on it. {a} walks out looking worried.' },
      { by: 'a', dr: "Two deals. One seat. Somebody finds out eventually. I'd rather it wasn't this week." },
    ] },
    { id: 'dh.h5', turns: [
      { by: 'b', say: "I've never had a final two before." },
      { by: 'a', say: "Well, now you do." },
      { by: 'a', dr: "{b} has one final two. I have two. I'm not sure that's the brag it sounds like." },
    ] },
    { id: 'dh.h6', turns: [
      { by: 'b', say: "Promise me I'm the only one." },
      { by: 'a', say: "You're the only one." },
      { by: 'a', dr: "That's the first lie I've told {b}. It probably won't be the last." },
    ] },
  ],

  // ── a promise to make jury ─────────────────────────────────────────
  'deals.jury-pact.made': [
    { id: 'dp.m1', turns: [
      { by: 'a', say: "I'm not asking you to take me to the end. I'm asking you not to be the reason I miss jury." },
      { by: 'b', say: "That I can do." },
      { by: 'a', say: "Same goes for you." },
    ] },
    { id: 'dp.m2', turns: [
      { by: 'a', say: "Jury's close. If we both get there, we're both still in it." },
      { by: 'b', say: "Then let's both get there." },
      { beat: 'They shake on it. Neither of them says anything about the final two.' },
    ] },
    { id: 'dp.m3', turns: [
      { by: 'b', say: "How many more evictions before jury?" },
      { by: 'a', say: "Not many. We can survive not many." },
      { by: 'b', say: "Together?" },
      { by: 'a', say: "Together." },
    ] },
    { id: 'dp.m4', turns: [
      { by: 'a', say: "Whatever else happens, neither of us writes the other's name down before jury." },
      { by: 'b', say: "Deal. And after jury?" },
      { by: 'a', say: "After jury, we talk again." },
    ] },
    { id: 'dp.m5', turns: [
      { by: 'a', dr: "{b} and I aren't a final two. We both know that. But I'd rather be voting at the end than watching from home." },
    ] },
    { id: 'dp.m6', turns: [
      { by: 'b', say: "I'd hate to go home just before jury." },
      { by: 'a', say: "So would I. So let's make sure neither of us does." },
      { by: 'b', say: "Shake on it?" },
      { by: 'a', say: "Shake on it." },
    ] },
  ],

  // ── a promised vote, kept or flipped ──────────────────────────────
  // b is on the block and was promised a's vote.
  'deals.vote-flip.kept': [
    { id: 'dv.k1', turns: [
      { by: 'a', dr: "I told {b} I'd vote to keep {b.obj}. The whole house has moved since. I haven't. I said what I said." },
    ] },
    { id: 'dv.k2', turns: [
      { by: 'b', say: "Are you still with me? Honestly?" },
      { by: 'a', say: "I gave you my word. I'm keeping it." },
      { by: 'b', say: "Even now?" },
      { by: 'a', say: "Especially now." },
    ] },
    { id: 'dv.k3', turns: [
      { by: 'a', dr: "It's going to cost me. I know it is. I'm keeping my promise to {b} anyway, because that's who I want to be in here." },
    ] },
    { id: 'dv.k4', turns: [
      { by: 'b', say: "Everyone's turning on me." },
      { by: 'a', say: "Not everyone. I'm not." },
      { by: 'b', dr: "One vote won't save me. But it's one person in this house I don't have to doubt." },
    ] },
    { id: 'dv.k5', turns: [
      { by: 'a', dr: "I promised {b} my vote. I'm keeping that promise." },
    ] },
    { id: 'dv.k6', turns: [
      { by: 'a', say: "People keep asking me to change my vote." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "And I keep telling them no." },
    ] },
  ],
  'deals.vote-flip.flipped': [
    { id: 'dv.f1', turns: [
      { by: 'a', dr: "I promised {b} my vote. I'm not giving it. Now I just need to avoid being alone with {b.obj} until Thursday." },
    ] },
    { id: 'dv.f2', turns: [
      { by: 'b', say: "We're still good for Thursday, right?" },
      { by: 'a', say: "Yeah. Course." },
      { by: 'a', dr: "That's the worst \"course\" I've ever said." },
    ] },
    { id: 'dv.f3', turns: [
      { by: 'a', dr: "The house changed its mind, and so did I. {b} is going to call that a betrayal." },
    ] },
    { id: 'dv.f4', turns: [
      { by: 'a', dr: "When I made that promise to {b}, the house looked completely different. That's what I'll say if anybody asks. Nobody will ask." },
    ] },
    { id: 'dv.f5', turns: [
      { beat: '{b} walks in. {a} suddenly remembers something urgent in another room.' },
      { by: 'a', dr: "I can't look {b} in the eye this week. That should tell you everything." },
    ] },
    { id: 'dv.f6', turns: [
      { by: 'b', say: "You've been avoiding me." },
      { by: 'a', say: "I haven't. It's just been a busy day." },
      { by: 'b', say: "In this house? Busy?" },
      { by: 'a', dr: "{b} is starting to work it out." },
    ] },
  ],
};
