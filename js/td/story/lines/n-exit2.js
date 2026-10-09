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
      { by: 'h', say: "Let's wrap it up, the boat is not getting any younger." },
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
      { by: 'h', say: "Five more seconds of feelings, and then the boat leaves with or without you." },
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
      { by: 'h', say: "Okay! That's enough of that. {a}, the boat. Now." },
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
      { by: 'h', say: "And that's why we keep the boat running. {a}, go." },
    ] },
    { id: 'nx2.k4', when: { voice: ['calm', 'dry', 'schemer'] }, turns: [
      { by: 'a', say: "Well played, {b}." },
      { by: 'b', say: "That's it? No speech?" },
      { by: 'a', say: "The speech is everybody in there watching you tomorrow, trying to work out who you'll do it to next." },
      { by: 'b', say: "...That's a good speech, actually." },
      { by: 'a', say: "I know. Bye." },
    ] },
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
