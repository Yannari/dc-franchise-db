// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-exit2.js — the walk out, carrying the night
// ══════════════════════════════════════════════════════════════════════
// td/story/tribal.js writeExit (header there). a is going home; b walks them down (their friend) or
// is who they turn round to (shot); h the host. Endings: how the reading landed (blindside,
// surprised, expected, any). bVoted: 'boot' when b wrote a's name. blame / {blame}: who a blames,
// when a has a reason to know. crash: a just had it out at the fire. The host has already said it
// is time to go: his lines here only hurry them along. Ids: 'nx2.'.

export default {
  // ── a friend walks them down ──
  'exit2.friend.blindside': [
    { id: 'nx2.b1', when: { bVoted: 'other', crash: false }, turns: [
      { beat: "{b} catches up with {a} halfway down the path." },
      { by: 'a', say: "Did you know?" },
      { by: 'b', say: "No. I swear on everything, I had no idea." },
      { by: 'a', say: "Then nobody told either of us. That means they don't trust you either." },
      { by: 'b', say: "I know. I thought of that the second your name came out of the urn.", v: { anxious: "I know. I've been thinking about it since the last vote was read and I feel sick." } },
      { by: 'a', say: "Then you have to be smarter than I was. Starting tomorrow morning." },
      { by: 'b', say: "I will. I'm going to find out who did this." },
      { by: 'h', say: "Let's wrap it up, we're on a schedule here." },
    ] },
    { id: 'nx2.b2', when: { bVoted: 'other', blame: true }, turns: [
      { by: 'b', say: "{a}, I'm so sorry. I didn't see it coming." },
      { by: 'a', say: "Neither did I, but I know whose idea it was. It was {blame}." },
      { by: 'b', say: "You're sure?" },
      { by: 'a', say: "I'm sure. Watch {blame}. Don't tell {blame} anything you don't want the whole camp to know by lunch." },
      { by: 'b', say: "Okay. I'll watch {blame}." },
      { by: 'a', say: "And don't let them see you upset about tonight. They'll use it." },
      { by: 'b', conf: "{a} told me exactly who to look out for on the way out. I'm not going to waste that." },
    ] },
    { id: 'nx2.b3', when: { bVoted: 'boot' }, turns: [
      { beat: "{b} walks {a} down, and neither of them says anything for a long time." },
      { by: 'a', say: "You wrote my name, didn't you." },
      { by: 'b', say: "...Yes." },
      { by: 'a', say: "Why?" },
      { by: 'b', say: "Because if I didn't, it was going to be me next. I'm not proud of it." },
      { by: 'a', say: "You walked me down here anyway." },
      { by: 'b', say: "I didn't want the last thing you saw to be me hiding." },
      { by: 'a', conf: "I don't forgive {b}. Not yet. But at least {b} looked me in the eye. That's more than the rest of them did." },
    ] },
  ],
  'exit2.friend.surprised': [
    { id: 'nx2.s1', when: { blame: false, crash: false }, turns: [
      { by: 'a', say: "I don't even know what happened. One minute it was a normal day." },
      { by: 'b', say: "Nobody said your name to me. Not once.", when: { bVoted: 'other' } },
      { by: 'b', say: "I should have said something. I didn't think it would actually happen.", when: { bVoted: 'boot' } },
      { by: 'a', say: "That's the worst part. I can't even be angry at anybody, because I don't know who to be angry at." },
      { by: 'b', say: "Be angry at all of them. That's what I'm going to do." },
      { by: 'a', say: "Don't. Be nice to all of them, and then beat all of them." },
      { by: 'h', say: "Touching, really. Wrap it up." },
    ] },
    { id: 'nx2.s2', when: { voice: ['goofy', 'chaotic', 'teen'] }, turns: [
      { by: 'a', say: "I can't believe I'm leaving before the food got any better." },
      { by: 'b', say: "The food was never going to get better." },
      { by: 'a', say: "I know. I just wanted to be here when it didn't." },
      { by: 'b', say: "I'm going to miss you. Like, actually." },
      { by: 'a', say: "Obviously. I'm very missable." },
      { beat: "{b} laughs, and then {b} doesn't, and they hug." },
    ] },
    { id: 'nx2.s3', when: { voice: ['warm', 'emotional', 'earnest', 'anxious'] }, turns: [
      { beat: "{a} is crying before they've even reached the end of the path. {b} puts an arm round {a.obj}." },
      { by: 'a', say: "I'm sorry. I'm being so dramatic." },
      { by: 'b', say: "You're allowed. You just got voted out." },
      { by: 'a', say: "Promise me you'll still be nice to people. Even when it's hard." },
      { by: 'b', say: "I promise." },
      { by: 'a', say: "And eat my share of breakfast. Somebody should." },
      { by: 'b', conf: "{a} got voted out and the first thing {a} worried about was me. That's who's leaving tonight. They have no idea." },
    ] },
  ],
  'exit2.friend.expected': [
    { id: 'nx2.e1', turns: [
      { by: 'a', say: "Well. I knew it was coming." },
      { by: 'b', say: "I'm so sorry. I didn't know what they were planning, I swear.", when: { bVoted: 'other' } },
      { by: 'b', say: "I'm sorry. The numbers were never going to change.", when: { bVoted: 'boot' } },
      { by: 'a', say: "I know you didn't. You were the only one I never worried about." },
      { by: 'b', say: "What do I do now?" },
      { by: 'a', say: "You find a new person, fast. Don't be alone in there, not even for one day." },
      { by: 'h', say: "Five more seconds of feelings, and then you're leaving, goodbye or no goodbye." },
    ] },
    { id: 'nx2.e2', when: { blame: true }, turns: [
      { by: 'a', say: "Just so you know, it was {blame}. I heard about it this afternoon." },
      { by: 'b', say: "Then why didn't you do something?" },
      { by: 'a', say: "I tried, but nobody would flip. {blame} had them locked." },
      { by: 'b', say: "Then I'll unlock them." },
      { by: 'a', say: "Carefully. If {blame} finds out you're coming, you're next." },
      { by: 'b', conf: "I've got a name now. Thanks to {a}, I know who's really running this camp." },
    ] },
    { id: 'nx2.e3', when: { voice: ['tough', 'competitive', 'proud', 'loud'] }, turns: [
      { by: 'a', say: "Don't look at me like that. I'm fine." },
      { by: 'b', say: "You're not fine." },
      { by: 'a', say: "Okay, I'm not fine, I'm furious, but I'm not going to give them the satisfaction." },
      { by: 'b', say: "Then I'll be furious for you. Loudly." },
      { by: 'a', say: "Good. And win something. Win everything." },
      { by: 'h', say: "As inspiring as this is, I have a schedule." },
    ] },
  ],
  'exit2.friend.any': [
    { id: 'nx2.a1', when: { crash: true }, turns: [
      { by: 'b', say: "That was a lot back there." },
      { by: 'a', say: "Somebody had to say it." },
      { by: 'b', say: "You know they're all going to be talking about it at breakfast." },
      { by: 'a', say: "Good, let them talk. Somebody should be talking about it." },
      { by: 'b', say: "I'm the one who has to go back in there, you know." },
      { by: 'a', say: "...I know, and I'm sorry. Keep your head down for a day or two." },
      { by: 'b', conf: "{a} lit the whole camp on fire on the way out, and now I'm the one standing in it." },
    ] },
  ],

  // ── the one they blame ──
  'exit2.shot.any': [
    { id: 'nx2.k1', when: { crash: true }, turns: [
      { beat: "{a} stops at the end of the path and turns round. {b} has followed {a.obj} down." },
      { by: 'b', say: "I just wanted to say—" },
      { by: 'a', say: "No. You don't get to do the nice goodbye after what you did back there." },
      { by: 'b', say: "What I did was vote. That's the whole game." },
      { by: 'a', say: "What you did was lie to me for days." },
      { by: 'b', say: "Then I guess you should have caught me sooner.", v: { warm: "I know, and I'm sorry. I really am.", cruel: "And you fell for every single one of them." } },
      { by: 'h', say: "Okay! That's enough of that. {a}, time to go. Now." },
    ] },
    { id: 'nx2.k2', turns: [
      { by: 'a', say: "Hey, {b}. One more thing." },
      { by: 'b', say: "What?" },
      { by: 'a', say: "Everybody in there is going to remember you did this. Every time you smile at one of them, they're going to wonder if they're next." },
      { by: 'b', say: "I'll take my chances." },
      { by: 'a', say: "You'll need them." },
      { by: 'b', conf: "{a} wanted to leave me rattled. I'm not rattled. Okay, I'm a little rattled." },
    ] },
    { id: 'nx2.k3', when: { voice: ['loud', 'tough', 'competitive', 'blunt'] }, turns: [
      { by: 'a', say: "You couldn't even beat me at a challenge, so you did it like this!" },
      { by: 'b', say: "It worked, didn't it?" },
      { by: 'a', say: "For tonight. Enjoy tonight." },
      { by: 'b', say: "I will. I really, really will." },
      { by: 'h', say: "Okay, okay, save it for the Aftermath. {a}, time to go." },
    ] },
    { id: 'nx2.k4', when: { voice: ['calm', 'dry', 'schemer'] }, turns: [
      { by: 'a', say: "Well played, {b}." },
      { by: 'b', say: "That's it? No speech?" },
      { by: 'a', say: "The speech is everybody in there watching you tomorrow, trying to work out who you'll do it to next." },
      { by: 'b', say: "...That's a good speech, actually." },
      { by: 'a', say: "I know. Bye." },
    ] },
  ],

  // ── a Save Card night (td/story/tribal.js): nobody voted {a} out. Every counted vote said {coach}, the card kept
  // {coach}, and {coach} named {a} to go instead. Endings: friend (b, a's person, walks a down) or alone (a and the host).
  // voted: somebody did write a's name; coached: {coach} ever ran a session with a. Ids: 'nxc.'.
  'exit2.card.friend': [
    { id: 'nxc.f1', when: { voted: false }, turns: [
      { beat: "{b} walks {a} down to the end of the path." },
      { by: 'a', say: "Nobody wrote my name. Not one person." },
      { by: 'b', say: "I know. I counted." },
      { by: 'a', say: "And {coach} looks down the whole row and picks me." },
      { by: 'b', say: "Because you never needed {coach} for anything. That's the only reason I can think of." },
      { by: 'a', say: "Then make {coach} regret it. Every challenge, every vote. Can you do that?" },
      { by: 'b', say: "I can do that." },
      { by: 'a', conf: "I didn't lose a vote tonight. I lost to a coach who never once picked me for anything, and then picked me for this." },
    ] },
    { id: 'nxc.f2', when: { voted: true }, turns: [
      { by: 'a', say: "Somebody wrote my name, fine. Everybody else wrote {coach}, and I'm the one walking." },
      { by: 'b', say: "That's not how it's supposed to work." },
      { by: 'a', say: "It is now. That card was always going to cost somebody. I just didn't think it would be me." },
      { by: 'b', say: "If it helps, you're the one I wanted to keep." },
      { by: 'a', say: "It helps a little. Now go make sure {coach} doesn't get to do that twice." },
      { by: 'a', conf: "I could have lived with losing the vote. Losing to the card feels like losing to a rule." },
    ] },
    { id: 'nxc.f3', when: { voice: ['loud', 'tough', 'blunt', 'competitive', 'bossy'] }, turns: [
      { by: 'a', say: "Unbelievable. The whole tribe wanted {coach} gone, and {coach} gets to stay and send me instead." },
      { by: 'b', say: "This isn't on any of us. Everybody wanted {coach} gone." },
      { by: 'a', say: "I know. It's on {coach}. Say that every day until the merge." },
      { by: 'b', say: "I won't have to. Everybody saw {coach} do it." },
      { by: 'h', say: "Okay, that's enough. Time to go." },
    ] },
    { id: 'nxc.f4', when: { voice: ['warm', 'anxious', 'earnest', 'emotional'] }, turns: [
      { by: 'a', say: "I keep thinking I did something wrong. But I didn't even get the chance to." },
      { by: 'b', say: "You didn't do anything wrong. {coach} needed a name, that's all." },
      { by: 'a', say: "And mine was the one {coach} could do without. Somehow that's worse." },
      { by: 'b', say: "Not to me it isn't." },
      { beat: "They hug at the end of the path for a long time." },
      { by: 'a', conf: "If they'd voted me out, I could be angry at them. Who do I even be angry at? A coach and a piece of card." },
    ] },
    { id: 'nxc.f5', when: { voice: ['schemer', 'calm', 'dry', 'cruel', 'proud'] }, turns: [
      { by: 'a', say: "Well. That's a new way to go out." },
      { by: 'b', say: "I'm sorry. Nobody saw the card coming for you." },
      { by: 'a', say: "{coach} did. {coach} had the whole read to decide, and picked the one person {coach} never bothered to get to know." },
      { by: 'b', say: "Then everybody {coach} did get to know should be worried." },
      { by: 'a', say: "Tell them that. Exactly like that." },
      { by: 'a', conf: "I was never one of {coach}'s people. Tonight I found out exactly what that costs." },
    ] },
    { id: 'nxc.f6', when: { coached: false }, turns: [
      { by: 'b', say: "Did {coach} ever even train you?" },
      { by: 'a', say: "Not once. Not one session. And tonight {coach} finally knew my name." },
      { by: 'b', say: "That's so cold." },
      { by: 'a', say: "It's the game. Just don't let {coach} do it to you next." },
      { by: 'a', conf: "Every morning I watched {coach} pick somebody else. I should have seen that this is where it ends." },
    ] },
  ],
  'exit2.card.alone': [
    { id: 'nxc.l1', when: { voted: false }, turns: [
      { by: 'h', say: "Rough one. Nobody even voted for you." },
      { by: 'a', say: "Yeah. I noticed." },
      { by: 'h', say: "If it makes you feel better, it was great television." },
      { by: 'a', say: "It doesn't." },
      { by: 'a', conf: "Everybody in that circle wanted {coach} gone. {coach} is still sitting there, and I'm out here holding a torch." },
    ] },
    { id: 'nxc.l2', when: { coached: false }, turns: [
      { beat: "{a} walks down to the end alone." },
      { by: 'h', say: "Any last thoughts on {coach}?" },
      { by: 'a', say: "{coach} never trained me once. I guess {coach} was saving me for tonight." },
      { by: 'a', conf: "I wasn't voted out. I was picked. I'm going to be thinking about the difference for a long time." },
    ] },
    { id: 'nxc.l3', turns: [
      { by: 'h', say: "You're taking this pretty well." },
      { by: 'a', say: "What am I supposed to do, yell at a piece of card?" },
      { by: 'h', say: "People have." },
      { by: 'a', conf: "The card did exactly what it says. Somebody goes home instead. I just never thought the somebody would be me." },
    ] },
  ],
  // after a Save Card night: {coach} (a) on why it was {lastBoot}, and {lastBoot}'s friend (a) on {coach}.
  // coached: the coach ever trained {lastBoot}; voted: {lastBoot} wrote the coach's name tonight.
  'after.card.coach': [
    { id: 'nxc.c1', when: { coached: false }, turns: [{ by: 'a', conf: "I never coached {lastBoot}. Not once. If I'm honest, that made it easier, and I'm not proud of that." }] },
    { id: 'nxc.c2', when: { voted: true }, turns: [{ by: 'a', conf: "{lastBoot} wrote my name too. They all did. I had to pick one of them, and {lastBoot} was the one I knew least." }] },
    { id: 'nxc.c3', when: { voice: ['schemer', 'calm', 'dry', 'cruel', 'proud'] }, turns: [{ by: 'a', conf: "People will say that was cold. It was. The card only works if you're willing to use it, and I was willing." }] },
    { id: 'nxc.c4', when: { voice: ['warm', 'anxious', 'earnest', 'emotional'] }, turns: [{ by: 'a', conf: "I have to sit with the rest of them at breakfast now. I picked {lastBoot} because I couldn't have picked anybody else and still looked them in the eye." }] },
    { id: 'nxc.c5', when: { voice: ['loud', 'tough', 'blunt', 'competitive', 'bossy'] }, turns: [{ by: 'a', conf: "They all came for me tonight, and I'm still here. {lastBoot} isn't. I didn't make the rules, I just read them." }] },
    { id: 'nxc.c6', turns: [{ by: 'a', conf: "I'm still here because of that card, and {lastBoot} is gone because of me. Both of those are true, and I have to carry both of them tomorrow." }] },
  ],
  'after.card.friend': [
    { id: 'nxc.m1', turns: [{ by: 'a', conf: "Everybody voted for {coach}. Everybody. And {coach} got to choose who paid for it, and chose {lastBoot}. I'm not letting that go." }] },
    { id: 'nxc.m2', when: { voice: ['loud', 'tough', 'blunt', 'competitive', 'bossy'] }, turns: [{ by: 'a', conf: "That card's gone now. The next time the votes land on {coach}, there's nothing to hide behind, and I'm making sure they land." }] },
    { id: 'nxc.m3', when: { voice: ['warm', 'anxious', 'earnest', 'emotional'] }, turns: [{ by: 'a', conf: "I keep looking at {lastBoot}'s empty spot. {coach} did that. I don't know how I'm supposed to let {coach} coach me after tonight." }] },
    { id: 'nxc.m4', when: { voice: ['schemer', 'calm', 'dry', 'cruel', 'proud'] }, turns: [{ by: 'a', conf: "{coach} spent the card and made an enemy in the same minute. The card doesn't come back. I'm still here." }] },
    { id: 'nxc.m5', turns: [{ by: 'a', conf: "{lastBoot} didn't lose a vote tonight. {coach} just decided {lastBoot} was worth less than {coach}. I'll remember who decided that." }] },
  ],

  // ── nobody comes ──
  'exit2.alone.blindside': [
    { id: 'nx2.l1', turns: [
      { beat: "{a} walks down to the end alone. Nobody follows." },
      { by: 'h', say: "Nobody's coming to say goodbye, huh?" },
      { by: 'a', say: "Looks like it." },
      { by: 'h', say: "Ouch. I'd say I'm sorry, but this is great television." },
      { by: 'a', conf: "I thought I had friends in there. I had people who were nice to me until they weren't." },
    ] },
  ],
  'exit2.alone.surprised': [
    { id: 'nx2.l2', when: { crash: false }, turns: [
      { by: 'a', say: "Can I ask you something? Did you know?" },
      { by: 'h', say: "I know everything. That's my job. Also, I'm not telling you." },
      { by: 'a', say: "Of course you're not." },
      { by: 'a', conf: "Even the host knew before I did. That's how bad I read this one." },
    ] },
  ],
  'exit2.alone.expected': [
    { id: 'nx2.l3', turns: [
      { by: 'h', say: "You don't look surprised." },
      { by: 'a', say: "I'm not. I've known since lunch." },
      { by: 'h', say: "And you didn't do anything about it?" },
      { by: 'a', say: "I did everything about it. It just didn't work." },
      { by: 'a', conf: "Some days you can talk your way out of it. Today wasn't one of those days." },
    ] },
  ],
  'exit2.alone.any': [
    { id: 'nx2.l4', when: { crash: true }, turns: [
      { by: 'h', say: "That was some exit speech back there." },
      { by: 'a', say: "Somebody had to say it." },
      { by: 'h', say: "Oh, absolutely. And thank you, because the ratings are going to be incredible." },
      { by: 'a', conf: "I don't regret a word. If I was going home anyway, I wanted them to go home thinking about it too." },
    ] },
  ],
};
