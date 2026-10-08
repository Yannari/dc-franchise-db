// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-advplay.js — the room, when somebody plays an advantage
// ══════════════════════════════════════════════════════════════════════
//
// td/story/tribal.js playReactions (header there). It plays BEFORE the votes are read: nobody yet
// knows whether it worked, except a voter whose own vote just died (c, fact cWasted), who knows
// what they wrote. a played it; b is who it's on; c is the one it hits hardest; h is the host.
// Ids: 'nap.'.

export default {
  'adv.idol.saved': [
    { id: 'nap.i1', when: { cWasted: true }, turns: [
      { by: 'a', say: "I'm going to play this for myself. I'm not taking any chances tonight.", v: { loud: "Yeah, I'm playing it! For ME!", calm: "I'll play this for myself, thank you.", anxious: "I'm sorry, I have to. I'm playing it for me." } },
      { beat: "{c}'s face goes completely white." },
      { by: 'c', say: "Oh no.", v: { tough: "You've got to be kidding me.", dry: "Well. That's not ideal." } },
      { by: 'h', say: "Interesting reaction, {c}. Anything you'd like to share?" },
      { by: 'c', say: "Nope. Nothing. I'm fine." },
    ] },
    { id: 'nap.i2', when: { cWasted: true }, turns: [
      { beat: "{a} stands up and walks to the host with something in {a.posAdj} hand." },
      { by: 'a', say: "I've been carrying this around for days, waiting for the right night, and I think it's tonight." },
      { by: 'c', say: "Where did you even find that?" },
      { by: 'a', say: "Somewhere you didn't look." },
    ] },
  ],
  'adv.idol.nothing': [
    { id: 'nap.n1', turns: [
      { by: 'a', say: "I'm playing this for myself. Better safe than sorry, right?", v: { anxious: "I can't risk it. I'm sorry. I'm playing it.", schemer: "Just in case." } },
      { beat: "A few people look at each other. Nobody looks worried." },
      { by: 'c', opt: true, say: "Huh. Okay.", v: { dry: "Bold choice." } },
      { by: 'a', conf: "Maybe I wasted it. Maybe I didn't. I'd rather waste an idol than go home holding one." },
    ] },
  ],
  'adv.idolfor.saved': [
    { id: 'nap.f1', when: { cWasted: true }, turns: [
      { by: 'a', say: "I want to play this for {b}." },
      { by: 'b', say: "Wait, what? For me?", v: { emotional: "Oh my god. Oh my god, you're doing this for me?", tough: "...Why?" } },
      { by: 'a', say: "Because you'd do it for me." },
      { beat: "{c} stares at {a}, then at {b}, and doesn't say anything at all." },
      { by: 'b', conf: "{a} had an idol the whole time and used it on me. I'm never going to forget that, not for the rest of the game." },
    ] },
    { id: 'nap.f2', when: { cWasted: true }, turns: [
      { by: 'h', say: "{a}, you're giving it away? Are you sure?" },
      { by: 'a', say: "I'm sure. {b} needs it more than I do tonight." },
      { by: 'c', say: "How would you even know that?", v: { cruel: "Wow. Somebody told you." } },
      { by: 'a', say: "I pay attention." },
    ] },
  ],
  'adv.idolfor.nothing': [
    { id: 'nap.fn1', turns: [
      { by: 'a', say: "I'm playing this for {b}. Just in case." },
      { by: 'b', say: "I really don't think I need it.", v: { anxious: "Do I need it? Should I be scared? Am I in danger?" } },
      { by: 'a', say: "Then it costs us nothing, and you'll owe me one." },
    ] },
  ],
  'adv.misplay.any': [
    { id: 'nap.m1', turns: [
      { by: 'a', say: "I'm going to play this. I have a really bad feeling about tonight." },
      { beat: "Somebody across the fire quietly lets out a breath." },
      { by: 'a', conf: "Was that the right move? I don't know. My gut said play it, so I played it." },
    ] },
  ],
  'adv.fake.any': [
    { id: 'nap.k1', turns: [
      { by: 'a', say: "I've been waiting all game for this. I'm playing my idol." },
      { by: 'h', say: "Let me take a look at that... Hmm." },
      { beat: "The host turns it over, slowly, and looks back up at {a}." },
      { by: 'h', say: "This is not a Hidden Immunity Idol." },
      { by: 'a', say: "What? No. No, that's not possible.", v: { loud: "WHAT? Who did this? WHO DID THIS?", quiet: "...Oh." } },
      { by: 'c', opt: true, conf: "I've never seen anybody's face fall that fast. Whoever made that fake, I would not want to be them right now." },
    ] },
  ],
  'adv.extra.any': [
    { id: 'nap.e1', when: { target: true }, turns: [
      { by: 'a', say: "I've got an Extra Vote, and I'm using it tonight.", v: { schemer: "I'll be casting two votes tonight. Just so everybody knows.", tough: "Two votes. Both of them have the same name on them." } },
      { by: 'h', say: "Two votes for {a}. That could change everything." },
      { by: 'c', say: "Of course {a} has an Extra Vote. Of course.", v: { anxious: "Wait, that's two votes? Against who? Oh no." } },
      { by: 'a', conf: "I wasn't going to leave tonight to chance. One extra vote on {target} and I can breathe." },
    ] },
    { id: 'nap.e2', turns: [
      { by: 'a', say: "Before we start, I'm playing an Extra Vote." },
      { beat: "Everyone around the fire starts quietly counting on their fingers." },
      { by: 'c', say: "Where did you get that?" },
      { by: 'a', say: "Does it matter?", v: { warm: "I found it a while ago. I didn't want to use it, honestly." } },
    ] },
  ],
  'adv.steal.any': [
    { id: 'nap.s1', when: { pair: true }, turns: [
      { by: 'a', say: "I've got a Vote Steal, and I'm taking {b}'s vote." },
      { by: 'b', say: "Mine? Why mine?", v: { tough: "Are you serious? Give it back.", emotional: "No, no, that's not fair, that's my vote! Why me?" } },
      { by: 'a', say: "Because I know exactly where your vote was going." },
      { by: 'h', say: "{b}, you are not voting tonight." },
      { by: 'b', conf: "I had my vote taken away in front of everybody. I've never felt so useless in my life." },
    ] },
    { id: 'nap.s2', when: { pair: true }, turns: [
      { by: 'h', say: "{a}, whose vote are you taking?" },
      { by: 'a', say: "{b}'s." },
      { beat: "{b} looks at {c}. {c} looks away." },
      { by: 'b', say: "Wow. Okay. Now I know where I stand." },
    ] },
  ],
  'adv.block.any': [
    { id: 'nap.b1', when: { pair: true }, turns: [
      { by: 'a', say: "I'm playing a Vote Block. {b} doesn't get to vote tonight." },
      { by: 'b', say: "You're blocking me? I didn't even do anything to you!", v: { dry: "Ah. Love that." } },
      { by: 'a', say: "Not yet you didn't." },
      { by: 'c', opt: true, say: "This is getting ugly fast." },
    ] },
  ],
  'adv.sole.any': [
    { id: 'nap.o1', turns: [
      { by: 'a', say: "I'm playing the Sole Vote. Tonight, my vote is the only one that counts." },
      { by: 'h', say: "That means nobody else votes. {a} decides who goes home. Alone." },
      { by: 'c', say: "You can't be serious.", v: { tough: "So we just sit here? That's it?", anxious: "Oh my god. Oh my god, it could be any of us." } },
      { by: 'a', conf: "I've spent this whole game letting other people decide. Tonight it's just me." },
    ] },
  ],
  'adv.safety.any': [
    { id: 'nap.y1', turns: [
      { by: 'a', say: "I'm going to play Safety Without Power. I'm leaving." },
      { by: 'h', say: "You're sure? You won't vote tonight." },
      { by: 'a', say: "I'm sure. Good luck, everybody." },
      { beat: "{a} stands up and walks out of the ceremony. Nobody knows where to look." },
      { by: 'c', opt: true, conf: "{a} just walked out on all of us. Whatever happens tonight, {a} made sure it wasn't going to be {a.obj}." },
    ] },
  ],
  'adv.kip.any': [
    { id: 'nap.p1', when: { pair: true }, turns: [
      { by: 'a', say: "I've got something called Knowledge is Power. {b}, do you have an advantage?" },
      { by: 'b', say: "...No.", v: { loud: "No! Why would I have an advantage?", calm: "I don't know what you mean." } },
      { by: 'a', say: "I think you do, and I'm taking it." },
      { by: 'b', conf: "{a} knew. Somebody told {a}, and when I find out who, they're done." },
    ] },
  ],
};
