// The Circle's games (spec §13; Plan 3a). Data only.
// `game.open`: a reads the alert and the rules aloud; {game} is the game's
// name and {q} the Circle's first rule, word for word. In round keys {q} is
// the prompt. The register is 1×01: "Circle, open Ice Breaker app." — the
// rule read out in quotes — "Agree." — "Hell no. What?"
export const GAME_LINES = {
  'game.open': [
    { id: 'game.open.01', turns: [
      { by: 'a', react: "Oh my God, a game! Circle, open {game}." },
      { by: 'a', react: "'{q}' Okay. Let's go!" },
    ] },
    { id: 'game.open.02', turns: [
      { by: 'a', react: "'{game}'? What does that mean? Circle, open it." },
      { by: 'a', react: "'{q}' Oh, this is gonna get juicy." },
    ], beat: '{a} pulls a chair right up to the screen.' },
    { id: 'game.open.03', turns: [
      { by: 'a', react: "A game! Finally, something to do. Circle, open {game}." },
      { by: 'a', react: "'{q}' Oh no. Oh, this is dangerous." },
    ] },
    { id: 'game.open.04', turns: [
      { by: 'a', react: "'{q}'" },
      { by: 'a', say: "It's never just a game in here. Somebody's gonna get exposed." },
    ], beat: '{a} cracks {a.posAdj} knuckles.' },
    { id: 'game.open.05', turns: [
      { by: 'a', react: "Circle, open {game}. Please be easy. Please be easy." },
      { by: 'a', react: "'{q}' It's not easy." },
    ] },
    { id: 'game.open.06', turns: [
      { by: 'a', react: "{game}! I love a game." },
      { by: 'a', react: "'{q}' Okay, I love this game a little less now." },
    ] },
    { id: 'game.open.07', turns: [
      { by: 'a', react: "Ooh, the Circle wants to play. Circle, open {game}." },
      { by: 'a', react: "'{q}' This is where it gets real." },
    ], beat: '{a} sits up very straight on the couch.' },
    { id: 'game.open.08', turns: [
      { by: 'a', react: "'{q}' Everybody's gonna see everything. Great." },
    ], beat: '{a} laughs and hides behind a pillow.' },
    { id: 'game.open.09', turns: [
      { by: 'a', say: "A game is a chance. People show you who they are without meaning to.", react: "Circle, open {game}. '{q}'" },
    ] },
  ],

  // ── statement: a answers aloud; b sees it ────────────────────────────────
  'game.statement.agree': [
    { id: 'game.statement.agree.01', turns: [
      { by: 'a', react: "'{q}' {ans}. Easy." },
      { by: 'b', react: "{a} said \"{ans}\"? Okay, {a}. I see you." },
    ] },
    { id: 'game.statement.agree.02', turns: [
      { by: 'a', react: "'{q}' Is that a trick? No. {ans}." },
      { by: 'b', react: "Wait. {a} said \"{ans}\" to that?" },
    ] },
    { id: 'game.statement.agree.03', turns: [
      { by: 'a', react: "'{q}' Circle, mark \"{ans}.\" And I'm not ashamed." },
      { by: 'b', react: "Ha. Of course {a} did." },
    ] },
    { id: 'game.statement.agree.04', turns: [
      { by: 'a', react: "'{q}' Honestly? {ans}." },
      { by: 'b', react: "Honest. I respect it, {a}." },
    ] },
    { id: 'game.statement.agree.05', turns: [
      { by: 'a', react: "'{q}' Who wouldn't say that? {ans}." },
      { by: 'b', react: "Let me see the answers. {a}. Interesting." },
    ] },
    { id: 'game.statement.agree.06', turns: [
      { by: 'a', say: "Do I answer honestly or do I answer smart? Honestly.", react: "'{q}' {ans}." },
      { by: 'b', react: "Okay, {a}. Noted." },
    ] },
    { id: 'game.statement.agree.07', turns: [
      { by: 'a', react: "'{q}' Absolutely. {ans}." },
      { by: 'b', react: "{a} didn't even hesitate on that one." },
    ], beat: '{b} writes something on the notepad.' },
    { id: 'game.statement.agree.08', turns: [
      { by: 'a', react: "'{q}' I'm gonna regret this. {ans}." },
      { by: 'b', react: "{a} is bold. I'll give {a.obj} that." },
    ] },
  ],
  'game.statement.disagree': [
    { id: 'game.statement.disagree.01', turns: [
      { by: 'a', react: "'{q}' Absolutely not. {ans}." },
      { by: 'b', react: "{a} said \"{ans}\"? Really?" },
    ] },
    { id: 'game.statement.disagree.02', turns: [
      { by: 'a', react: "'{q}' Hell no. What? {ans}." },
      { by: 'b', react: "Okay, {a} is strict. Good to know." },
    ] },
    { id: 'game.statement.disagree.03', turns: [
      { by: 'a', react: "'{q}' No, no, no. Circle, mark \"{ans}.\"" },
      { by: 'b', react: "Of course {a} said \"{ans}.\" That tracks." },
    ] },
    { id: 'game.statement.disagree.04', turns: [
      { by: 'a', react: "'{q}' I was raised better than that. {ans}." },
      { by: 'b', react: "Look at {a}, taking the high road." },
    ] },
    { id: 'game.statement.disagree.05', turns: [
      { by: 'a', say: "If I say yes, somebody's gonna judge me.", react: "'{q}' {ans}." },
      { by: 'b', react: "Hm. I didn't expect that from {a}." },
    ] },
    { id: 'game.statement.disagree.06', turns: [
      { by: 'a', react: "'{q}' Nope. Not me. {ans}." },
      { by: 'b', react: "{a} said \"{ans}.\" Sure, {a}. Sure." },
    ], beat: '{b} squints at the screen.' },
    { id: 'game.statement.disagree.07', turns: [
      { by: 'a', react: "'{q}' {ans}. That's my answer." },
      { by: 'b', react: "Let me see the answers. {a}: \"{ans}.\" Okay." },
    ] },
    { id: 'game.statement.disagree.08', turns: [
      { by: 'a', react: "'{q}' {ans}, and I'm not changing it." },
      { by: 'b', react: "{a} feels very strongly about this." },
    ] },
  ],
  // a notices that b was the only one to answer that way.
  'game.statement.lone': [
    { id: 'game.statement.lone.01', turns: [
      { by: 'a', react: "Wait. {b} is the only one who answered that way?" },
      { by: 'a', say: "That's raising some flags in my head." },
    ] },
    { id: 'game.statement.lone.02', turns: [
      { by: 'a', react: "Everybody else said the same thing, and then there's {b}." },
    ], beat: '{a} leans back and folds {a.posAdj} arms.' },
    { id: 'game.statement.lone.03', turns: [
      { by: 'a', react: "Only {b}? Why is {b} the only one?" },
      { by: 'a', say: "I'm not saying anything. I'm just saying." },
    ] },
    { id: 'game.statement.lone.04', turns: [
      { by: 'a', react: "{b}, you're on your own with that one, honey." },
    ] },
    { id: 'game.statement.lone.05', when: { suspects: true }, turns: [
      { by: 'a', react: "Of course it's {b}. One more thing that doesn't fit." },
    ], beat: '{a} adds a line to the notepad.' },
    { id: 'game.statement.lone.06', turns: [
      { by: 'a', react: "I'm shocked {b} said that. I'm shocked." },
      { by: 'a', say: "Either {b} is really honest or {b} doesn't know how the rest of us think." },
    ] },
  ],

  // ── name: a names b, in front of everyone ───────────────────────────────
  'game.name.good': [
    { id: 'game.name.good.01', turns: [
      { by: 'a', react: "'{q}' That's a no-brainer. {b}." },
      { by: 'b', react: "Me? Stop it. You guys!", send: "Wow, thank you so much guys {e:heart}" },
    ] },
    { id: 'game.name.good.02', turns: [
      { by: 'a', react: "'{q}' {b}. For sure." },
      { by: 'b', react: "Everybody said me? Oh my God.", send: "I'm not crying, you're crying {e:cry}" },
    ] },
    { id: 'game.name.good.03', turns: [
      { by: 'a', react: "'{q}' Easy. {b}." },
      { by: 'b', react: "Okay, now I have to live up to that." },
    ], beat: '{b} does a little dance in the kitchen.' },
    { id: 'game.name.good.04', turns: [
      { by: 'a', react: "'{q}' I would put {b}. Honestly, {b}." },
      { by: 'b', send: "Love you guys. That means a lot {e:hug}" },
    ] },
    { id: 'game.name.good.05', turns: [
      { by: 'a', say: "Say {b}. It's a compliment, and {b} will remember it.", react: "'{q}' {b}." },
      { by: 'b', react: "Aw. That's so nice." },
    ] },
    { id: 'game.name.good.06', turns: [
      { by: 'a', react: "'{q}' Come on. It's {b}." },
      { by: 'b', react: "Wait, is that a good thing? It's a good thing.", send: "You all are too sweet {e:smile}" },
    ] },
    { id: 'game.name.good.07', when: { friends: true }, turns: [
      { by: 'a', react: "'{q}' My {b}! Obviously." },
      { by: 'b', react: "That's my person right there." },
    ] },
    { id: 'game.name.good.08', turns: [
      { by: 'a', react: "'{q}' Everybody's gonna say {b}, so I'm saying {b}." },
      { by: 'b', react: "Everybody said me. Okay. Now I'm scared." },
    ], beat: '{b} stops smiling after a second.' },
  ],
  'game.name.bad': [
    { id: 'game.name.bad.01', turns: [
      { by: 'a', react: "'{q}' Sorry, but that's {b}." },
      { by: 'b', react: "Me? Are you serious?", send: "Wow. Okay. Didn't see that coming" },
    ] },
    { id: 'game.name.bad.02', turns: [
      { by: 'a', react: "'{q}' {b}. I'm not gonna pretend." },
      { by: 'b', react: "Who said me? I need names." },
    ], beat: '{b} scrolls back to see every answer.' },
    { id: 'game.name.bad.03', turns: [
      { by: 'a', say: "This is my chance to say it without saying it.", react: "'{q}' {b}." },
      { by: 'b', react: "Oh, so that's how it is." },
    ] },
    { id: 'game.name.bad.04', turns: [
      { by: 'a', react: "'{q}' That's {b}, and {b} knows it." },
      { by: 'b', send: "Lol I'm gonna remember that {e:side}" },
    ] },
    { id: 'game.name.bad.05', turns: [
      { by: 'a', react: "'{q}' I hate this game. {b}." },
      { by: 'b', react: "That hurts. That actually hurts." },
    ] },
    { id: 'game.name.bad.06', when: { rivals: true }, turns: [
      { by: 'a', react: "'{q}' Oh, that's {b}. Next question." },
      { by: 'b', react: "Of course {a} said me. Of course." },
    ] },
    { id: 'game.name.bad.07', turns: [
      { by: 'a', react: "'{q}' I'm going with {b}. It's just a game." },
      { by: 'b', react: "Just a game. Sure it is.", send: "I'll take it lol. Somebody's gotta be the villain" },
    ] },
  ],
  'game.name.funny': [
    { id: 'game.name.funny.01', turns: [
      { by: 'a', react: "'{q}' {b}. I'm sorry, but it's {b}." },
      { by: 'b', react: "Rude! Accurate, but rude.", send: "I'm offended and also you're right {e:laugh}" },
    ] },
    { id: 'game.name.funny.02', turns: [
      { by: 'a', react: "'{q}' Ha! {b}, a hundred percent." },
      { by: 'b', react: "Why is everybody saying me?" },
    ], beat: '{b} laughs so hard {b.sub} has to sit down.' },
    { id: 'game.name.funny.03', turns: [
      { by: 'a', react: "'{q}' It's gotta be {b}." },
      { by: 'b', send: "Okay that is a little bit true {e:sweat}" },
    ] },
    { id: 'game.name.funny.04', turns: [
      { by: 'a', react: "'{q}' {b}, and I say that with love." },
      { by: 'b', react: "With love. Okay. I'll allow it." },
    ] },
    { id: 'game.name.funny.05', turns: [
      { by: 'a', react: "'{q}' That's so {b}." },
      { by: 'b', react: "I can't even argue with that." },
    ] },
  ],

  // ── ask: a asks b anonymously; b answers in front of everyone ────────────
  'game.ask.friendly': [
    { id: 'game.ask.friendly.01', when: { anon: true }, turns: [
      { by: 'a', react: "I am now in anonymous mode.", send: "What's the one thing you wish everybody in here knew about you?" },
      { by: 'b', react: "Aw. Okay, that's a nice one.", send: "That I'm way more of a softie than my pictures look {e:smile}" },
    ] },
    { id: 'game.ask.friendly.02', when: { anon: true }, turns: [
      { by: 'a', say: "I barely know {b}. Let's fix that.", send: "What do you miss most from home?" },
      { by: 'b', react: "Who asked that? That's sweet.", send: "My family. And my bed. Mostly my family lol" },
    ] },
    { id: 'game.ask.friendly.03', turns: [
      { by: 'a', send: "What's the best advice anyone ever gave you?" },
      { by: 'b', react: "Ooh, a deep one.", send: "Never let anybody tell you who you are. My grandma said that" },
    ] },
    { id: 'game.ask.friendly.04', turns: [
      { by: 'a', send: "If you win, what's the first thing you do with the money?" },
      { by: 'b', react: "Easy.", send: "Pay off my mom's mortgage. Then a vacation {e:sun}" },
    ], beat: '{b} smiles at the screen for a long time.' },
    { id: 'game.ask.friendly.05', turns: [
      { by: 'a', send: "What's something you're proud of that you never talk about?" },
      { by: 'b', react: "Okay, now I'm emotional.", send: "I was the first in my family to finish college" },
    ] },
    { id: 'game.ask.friendly.06', turns: [
      { by: 'a', say: "Keep it nice. Nice gets remembered.", send: "Who's your biggest inspiration?" },
      { by: 'b', send: "My dad. He worked two jobs my whole childhood" },
    ] },
    { id: 'game.ask.friendly.07', when: { anon: false }, turns: [
      { by: 'a', react: "The wheel landed on {b}. Okay, let's keep it nice.", send: "What's something that always makes you laugh?" },
      { by: 'b', send: "My little cousins. They're chaos and I love them {e:laugh}" },
    ] },
    { id: 'game.ask.friendly.08', when: { anon: false }, turns: [
      { by: 'a', send: "{b}, the question is yours. What's your biggest guilty pleasure?" },
      { by: 'b', react: "In front of everybody? Fine.", send: "Reality TV. All of it. No shame" },
    ] },
  ],
  'game.ask.barbed': [
    { id: 'game.ask.barbed.01', when: { anon: true }, turns: [
      { by: 'a', say: "Nobody will know it's me. Let's have some fun.", send: "Are you really this nice, or is it an act for the ratings?" },
      { by: 'b', react: "Whoa. Okay. Somebody's coming for me.", send: "It's not an act. I'm nice. Whoever asked this, maybe try it sometime" },
    ] },
    { id: 'game.ask.barbed.02', when: { anon: true }, turns: [
      { by: 'a', send: "Do you actually have friends in here, or just people you use?" },
      { by: 'b', react: "Excuse me? Who sent this?", send: "I have real friends in here. You know who you are {e:heart}" },
    ], beat: '{b} reads it again with {b.posAdj} mouth open.' },
    { id: 'game.ask.barbed.03', turns: [
      { by: 'a', send: "Why do you always say what everyone wants to hear?" },
      { by: 'b', react: "That's a shot. That's a straight-up shot.", send: "I say what I think. Sorry it's not what you wanted to hear" },
    ] },
    { id: 'game.ask.barbed.04', turns: [
      { by: 'a', send: "You flirt with everybody. Is any of it real?" },
      { by: 'b', react: "Oh, somebody's jealous.", send: "All of it's real lol. I'm just a friendly person" },
    ] },
    { id: 'game.ask.barbed.05', turns: [
      { by: 'a', say: "{b} needs to be knocked down a peg.", send: "Do you think you're better than everybody in here?" },
      { by: 'b', react: "Okay, this is personal.", send: "No. But I think I'm better than whoever asked this {e:side}" },
    ] },
    { id: 'game.ask.barbed.06', turns: [
      { by: 'a', send: "Who in here are you pretending to like?" },
      { by: 'b', react: "I'm not answering that. I'm answering it.", send: "Nobody. If I don't like you, you'll know" },
    ] },
  ],
  // A question built to catch a catfish; the room watches the answer.
  'game.ask.catfish.pass': [
    { id: 'game.ask.catfish.pass.01', turns: [
      { by: 'a', say: "If {b} is fake, this will get {b.obj}.", send: "What's something only people from your hometown would know?" },
      { by: 'b', react: "Oh, that's easy.", send: "The best pizza place closes at nine and everybody still shows up at nine-fifteen" },
      { by: 'a', react: "That's way too specific to be made up." },
    ] },
    { id: 'game.ask.catfish.pass.02', turns: [
      { by: 'a', send: "Are you really shy, or is that a front?" },
      { by: 'b', react: "Somebody thinks I'm fake.", send: "Growing up my sister did all the talking for me. So no, it's not a front" },
      { by: 'a', react: "Okay. That was real." },
    ], beat: '{b} lets out a breath after hitting send.' },
    { id: 'game.ask.catfish.pass.03', turns: [
      { by: 'a', send: "Walk us through a normal day at your job" },
      { by: 'b', react: "Finally, an easy one.", send: "Up at five, coffee, twelve hours on my feet, home, sleep, repeat {e:laugh}" },
      { by: 'a', react: "Fine. That sounds like a real job." },
    ] },
    { id: 'game.ask.catfish.pass.04', turns: [
      { by: 'a', send: "What did you get in trouble for as a kid?" },
      { by: 'b', send: "I cut my own bangs the night before picture day. My mom still has the photo" },
      { by: 'a', react: "Okay, I believe that one." },
    ] },
  ],
  'game.ask.catfish.dodge': [
    { id: 'game.ask.catfish.dodge.01', turns: [
      { by: 'a', send: "What's something only people from your hometown would know?" },
      { by: 'b', react: "Don't overthink it. Keep it short.", send: "Lol everybody knows everybody. It's that kind of place" },
      { by: 'a', react: "That's not an answer. That's a dodge." },
    ] },
    { id: 'game.ask.catfish.dodge.02', turns: [
      { by: 'a', send: "What's your favorite thing about your job, really?" },
      { by: 'b', react: "Careful.", send: "Honestly the people. Can we talk about something fun? {e:laugh}" },
      { by: 'a', react: "Changing the subject. Noted." },
    ] },
    { id: 'game.ask.catfish.dodge.03', turns: [
      { by: 'a', send: "What's your go-to order at your favorite restaurant?" },
      { by: 'b', send: "Depends on the day! I'm a mood eater lol" },
      { by: 'a', react: "Everybody has a go-to order. Everybody." },
    ], beat: '{a} underlines something on the notepad.' },
    { id: 'game.ask.catfish.dodge.04', turns: [
      { by: 'a', send: "Tell us about your last relationship" },
      { by: 'b', react: "Nope. Not getting into that.", send: "It ended, I grew, I'm here now {e:pray}" },
      { by: 'a', react: "Very vague. Very, very vague." },
    ] },
  ],
  'game.ask.catfish.fail': [
    { id: 'game.ask.catfish.fail.01', turns: [
      { by: 'a', send: "What year did you graduate?" },
      { by: 'b', react: "Do the math. Do the math.", send: "Uh, like 2016? Or 17. Time is weird in here" },
      { by: 'a', react: "You don't forget the year you graduated." },
    ] },
    { id: 'game.ask.catfish.fail.03', turns: [
      { by: 'a', send: "What's your favorite thing about your hometown?" },
      { by: 'b', send: "The food! Wait, no. The people. The people and the food" },
      { by: 'a', react: "Which one is it?" },
    ], beat: 'Somewhere else in the building, somebody else reads that twice.' },
    { id: 'game.ask.catfish.fail.04', turns: [
      { by: 'a', send: "How old were you when you learned to drive?" },
      { by: 'b', react: "Oh no. How old am I supposed to be?", send: "Like, nineteen? I was a late bloomer lol" },
      { by: 'a', react: "That answer took way too long." },
    ] },
    { id: 'game.ask.catfish.fail.05', turns: [
      { by: 'a', send: "What's something you'd never say in front of your mom?" },
      { by: 'b', send: "Probably half my messages in here lol" },
      { by: 'a', react: "That's not a real answer from a real person." },
    ] },
  ],

  // a's answer in a game gave something away, or looked like it did to b.
  'game.slip': [
    { id: 'game.slip.01', turns: [
      { by: 'b', react: "Hold on. That answer from {a} doesn't sit right with me." },
    ], beat: '{b} writes a question mark next to a name.' },
    { id: 'game.slip.02', turns: [
      { by: 'b', react: "Did {a} just say that? That's not something {a} would say." },
      { by: 'b', say: "Or it's exactly what {a} would say, and I don't know {a} at all." },
    ] },
    { id: 'game.slip.03', turns: [
      { by: 'a', say: "Why did I answer like that? Why did I answer like that?" },
      { by: 'b', react: "Hm. Interesting answer, {a}." },
    ] },
    { id: 'game.slip.04', when: { misread: false }, turns: [
      { by: 'a', react: "Oh no. That was a me answer, not a {a} answer." },
      { by: 'b', react: "That's the second weird thing today." },
    ], beat: '{a} covers {a.posAdj} face with a pillow.' },
    { id: 'game.slip.05', turns: [
      { by: 'b', react: "Everybody else answered like a normal person. And then {a}." },
    ] },
  ],

  // ── make ────────────────────────────────────────────────────────────────
  // a made something unflattering of b, and posted it.
  'game.make.jab': [
    { id: 'game.make.jab.01', turns: [
      { by: 'a', say: "For {game}, I got {b}. Oh, this is gonna be fun." },
      { by: 'b', react: "Is that supposed to be me? Really?" },
    ], beat: '{b} zooms in on the picture, slowly.' },
    { id: 'game.make.jab.02', turns: [
      { by: 'a', say: "It's anonymous, right? It's anonymous." },
      { by: 'b', react: "Somebody really doesn't like me. Wow." },
    ] },
    { id: 'game.make.jab.03', turns: [
      { by: 'a', say: "I'm just being honest. {b} can take it." },
      { by: 'b', react: "That's not art. That's a message." },
    ] },
    { id: 'game.make.jab.04', turns: [
      { by: 'a', say: "I'll make it look like a joke. It's not a joke." },
      { by: 'b', react: "Ha. Ha. Very funny. Who did this?" },
    ], beat: '{b} does not laugh.' },
  ],
  // a made something kind of b.
  'game.make.kind': [
    { id: 'game.make.kind.01', turns: [
      { by: 'a', say: "I got {b}. I'm gonna make {b} look like a star." },
      { by: 'b', react: "That's me? Oh my God. I love it." },
    ] },
    { id: 'game.make.kind.02', turns: [
      { by: 'a', say: "{b} has been so good to me. This has to be good." },
      { by: 'b', react: "Whoever made this, you're making me cry." },
    ], beat: '{b} holds a hand over {b.posAdj} heart.' },
    { id: 'game.make.kind.03', turns: [
      { by: 'b', react: "Wait, that's me? That's so sweet." },
      { by: 'a', react: "{b} loves it. Yes!" },
    ] },
    { id: 'game.make.kind.04', turns: [
      { by: 'a', say: "Is it good? No. Is it made with love? Yes." },
      { by: 'b', react: "Okay, it looks nothing like me, and I love it." },
    ] },
  ],
  // a's creation got the most likes.
  'game.make.result': [
    { id: 'game.make.result.01', turns: [
      { by: 'a', react: "The most likes? Me? I've never done this in my life!" },
      { by: 'b', react: "Of course {a} won. Of course." },
    ] },
    { id: 'game.make.result.02', turns: [
      { by: 'a', react: "I won {game}? Let's go!" },
    ], beat: '{a} runs a victory lap around the kitchen.' },
    { id: 'game.make.result.03', turns: [
      { by: 'a', react: "People actually liked it! I had no idea what I was doing." },
      { by: 'b', react: "How did {a} pull that off?" },
    ] },
    { id: 'game.make.result.04', turns: [
      { by: 'a', react: "Top of the Newsfeed. Who knew?" },
      { by: 'b', react: "Okay, {a} deserved that one." },
    ] },
  ],
  'game.photo.round': [
    { id: 'game.photo.round.01', turns: [
      { by: 'a', say: "Pick a good one. Not too much. Just enough.", post: "Throwback to my favorite summer {e:sun} {t:NoFilter}" },
      { by: 'b', react: "Okay, {a}! Hello!" },
    ] },
    { id: 'game.photo.round.02', turns: [
      { by: 'a', post: "This one means a lot to me {e:heart}" },
      { by: 'b', react: "Aw. That's a real picture. I like that." },
    ] },
    { id: 'game.photo.round.03', turns: [
      { by: 'a', say: "This is gonna get likes. I know it.", post: "Just a little something {e:fire} {t:TBT}" },
      { by: 'b', react: "Ooh. {a} came to play." },
    ], beat: '{b} fans {b.ref} with a magazine.' },
    { id: 'game.photo.round.04', turns: [
      { by: 'a', post: "Me at my happiest {e:laugh} {t:ThisIsMe}" },
      { by: 'b', react: "That's such a {a} picture." },
    ] },
    { id: 'game.photo.round.05', turns: [
      { by: 'a', post: "Don't judge me {e:sweat}" },
      { by: 'b', react: "Oh, we're judging. We're judging a little." },
    ] },
    { id: 'game.photo.round.06', when: { flirty: true }, turns: [
      { by: 'a', post: "Found this one in the archives {e:wink}" },
      { by: 'b', react: "Okay. Okay! Circle, like that. Twice." },
    ] },
  ],

  // ── team ────────────────────────────────────────────────────────────────
  // a is a captain; b is their first pick.
  'game.team.pick': [
    { id: 'game.team.pick.01', turns: [
      { by: 'a', say: "{b} looks smart. I want {b} on my team.", send: "First pick: {b}! {e:crown}" },
      { by: 'b', react: "First pick! Yes!", send: "Let's gooo, Captain! {e:muscle}" },
    ] },
    { id: 'game.team.pick.02', turns: [
      { by: 'a', say: "I don't want {b} to be competition. I want us on the same team.", send: "I'm taking {b}" },
      { by: 'b', react: "Picked first. I'll take it." },
    ] },
    { id: 'game.team.pick.03', turns: [
      { by: 'a', say: "Circle, show me {b}'s profile. Okay. That's a smart smile.", send: "My first pick is {b}" },
      { by: 'b', react: "Captain {a} knows what's up." },
    ] },
    { id: 'game.team.pick.04', turns: [
      { by: 'a', send: "{b}, you're with me" },
      { by: 'b', send: "Yes, Captain! We're winning this {e:fire}" },
    ] },
  ],
  // a was picked last; b is their captain.
  'game.team.last': [
    { id: 'game.team.last.01', turns: [
      { by: 'a', react: "Last? Picked last. Wow." },
      { by: 'a', say: "This is middle school gym class all over again." },
    ], beat: '{a} stares at the ceiling.' },
    { id: 'game.team.last.02', turns: [
      { by: 'a', react: "I'm the last one. Cool. Cool, cool." },
      { by: 'b', react: "I had to take somebody last. It's not personal." },
    ] },
    { id: 'game.team.last.03', turns: [
      { by: 'a', react: "Everybody got picked and then me. Noted, {b}." },
    ] },
    { id: 'game.team.last.04', turns: [
      { by: 'a', say: "Picked last. Fine. I'll be the one who wins it for them." },
    ], beat: '{a} cracks {a.posAdj} knuckles.' },
  ],
  // a's team won; b's team lost.
  'game.team.result': [
    { id: 'game.team.result.01', turns: [
      { by: 'a', react: "We won! We won!" },
      { by: 'b', react: "We lost? To them?" },
    ], beat: '{a} runs around the apartment with both arms up.' },
    { id: 'game.team.result.02', turns: [
      { by: 'a', react: "Teamwork makes the dream work!" },
      { by: 'b', react: "I knew that last answer was wrong. I knew it." },
    ] },
    { id: 'game.team.result.03', turns: [
      { by: 'a', react: "Winning is so good! Oh my God!" },
      { by: 'b', react: "Good game. I guess." },
    ] },
    { id: 'game.team.result.04', turns: [
      { by: 'a', react: "That's my team! That's my team!" },
      { by: 'b', react: "Rigged. That was rigged." },
    ] },
  ],

  // ── gift ────────────────────────────────────────────────────────────────
  'game.gift.round': [
    { id: 'game.gift.round.01', turns: [
      { by: 'a', say: "My gift goes to {b}. {b} has been there for me.", send: "This one's for you, {b} {e:heart}" },
      { by: 'b', react: "Me? Aw!", send: "Thank you!! You didn't have to {e:hug}" },
    ] },
    { id: 'game.gift.round.02', turns: [
      { by: 'a', send: "{b}, you deserve something nice today" },
      { by: 'b', react: "{a} picked me. Okay, I'm emotional." },
    ] },
    { id: 'game.gift.round.03', turns: [
      { by: 'a', say: "Everybody's gonna see who I picked. Good. Let them.", send: "Gift for {b}! {e:party}" },
      { by: 'b', send: "Stop!! Thank you, {a}!" },
    ] },
    { id: 'game.gift.round.04', turns: [
      { by: 'b', react: "Who sent me a gift? {a}! Of course it was {a}." },
      { by: 'b', send: "Thank-you note: you're the best {e:heart} {t:ThankYouBestie}" },
    ] },
  ],
  'game.gift.none': [
    { id: 'game.gift.none.01', turns: [
      { by: 'a', react: "Nobody picked me. Nobody." },
    ], beat: '{a} pulls a blanket over {a.posAdj} head.' },
    { id: 'game.gift.none.02', turns: [
      { by: 'a', react: "Everybody got something except me." },
      { by: 'a', say: "Okay. That's information. That's useful information." },
    ] },
    { id: 'game.gift.none.03', turns: [
      { by: 'a', react: "Oh. Wow. Not one." },
    ], beat: '{a} goes to the kitchen and eats ice cream straight from the tub.' },
  ],

  // ── rival: a names b in front of everyone; b answers ────────────────────
  'game.rival.round': [
    { id: 'game.rival.round.01', turns: [
      { by: 'a', say: "Let's just lay it all out there.", send: "My biggest rival is {b}, because everybody loves {b.obj}. I deserve it more because I've taken the risks" },
      { by: 'b', react: "Excuse me?", send: "With respect, you don't know what I've been through" },
    ] },
    { id: 'game.rival.round.02', turns: [
      { by: 'a', send: "My biggest rival is {b}. {b} is smart, and that scares me" },
      { by: 'b', react: "Well, that's kind of a compliment.", send: "Right back at you {e:handshake}" },
    ] },
    { id: 'game.rival.round.03', turns: [
      { by: 'a', say: "In here, your best friends are your rivals too.", send: "It's {b}. Nothing personal. You're just really good at this" },
      { by: 'b', react: "Nothing personal. Everybody says that." },
    ] },
    { id: 'game.rival.round.04', turns: [
      { by: 'a', send: "{b}, you're my rival. I've been more real than you from day one" },
      { by: 'b', react: "Oh, it's on now.", send: "More real? Okay. We'll see about that" },
    ] },
    { id: 'game.rival.round.05', when: { friends: true }, turns: [
      { by: 'a', say: "This is terrible. It has to be {b}.", send: "My biggest rival is {b}, and it hurts to say it" },
      { by: 'b', react: "Aw. Me too, honestly." },
    ] },
  ],

  // ── flirt ───────────────────────────────────────────────────────────────
  'game.flirt.round': [
    { id: 'game.flirt.round.01', turns: [
      { by: 'a', say: "Pickup line. Make it good.", send: "{b}, are you a parking ticket? Because you've got fine written all over you {e:wink}" },
      { by: 'b', react: "Oh, that's so bad. I love it." },
    ] },
    { id: 'game.flirt.round.02', turns: [
      { by: 'a', send: "Life without you is like a broken pencil. Pointless" },
      { by: 'b', react: "Pointless. I'm dead.", send: "Okay that one got me {e:laugh}" },
    ] },
    { id: 'game.flirt.round.03', turns: [
      { by: 'a', send: "I'd tell you a joke about the Hangout, but I'd rather take you there {e:hearteyes}" },
      { by: 'b', react: "Smooth. Very smooth." },
    ], beat: '{b} fans {b.ref} with both hands.' },
    { id: 'game.flirt.round.04', turns: [
      { by: 'a', send: "Do you believe in love at first profile picture?" },
      { by: 'b', send: "I do now {e:kiss}" },
    ] },
  ],

  // ── prizes ──────────────────────────────────────────────────────────────
  'game.prize.party': [
    { id: 'game.prize.party.01', turns: [
      { by: 'a', react: "'Tonight, there will be a party!' A party!" },
    ], beat: '{a} starts dancing before the music is even on.' },
    { id: 'game.prize.party.02', turns: [
      { by: 'a', react: "We won a party? We won a party!" },
    ] },
    { id: 'game.prize.party.03', turns: [
      { by: 'a', react: "The prize is a party. Okay, I need to find an outfit." },
    ], beat: '{a} is in the closet within seconds.' },
    { id: 'game.prize.party.04', turns: [
      { by: 'a', react: "Party tonight! Everybody's gonna be loose. Everybody's gonna talk." },
    ] },
  ],
  'game.prize.photo': [
    { id: 'game.prize.photo.01', turns: [
      { by: 'a', react: "I get a new profile picture? Circle, take me to my private albums." },
    ] },
    { id: 'game.prize.photo.02', turns: [
      { by: 'a', react: "A new photo! This one has to be perfect." },
    ], beat: '{a} scrolls through the album three times.' },
    { id: 'game.prize.photo.03', turns: [
      { by: 'a', react: "New profile picture. Okay. Time to show them a different side." },
    ] },
    { id: 'game.prize.photo.04', turns: [
      { by: 'a', react: "That's the prize? Yes! My first picture was a mistake." },
    ] },
  ],
  'game.prize.video': [
    { id: 'game.prize.video.01', turns: [
      { by: 'a', react: "'The winners will each receive a video message from home!' What?!" },
    ], beat: '{a} is crying before the message even starts.' },
    { id: 'game.prize.video.02', turns: [
      { by: 'a', react: "A video from home. I'm gonna cry. I already know I'm gonna cry." },
      { by: 'a', say: "Winning is so good!" },
    ] },
    { id: 'game.prize.video.03', turns: [
      { by: 'a', react: "We get videos from home? That's the best prize ever." },
    ] },
    { id: 'game.prize.video.04', turns: [
      { by: 'a', react: "Please be my mom. Please be my mom." },
    ] },
  ],
  'game.prize.immunity': [
    { id: 'game.prize.immunity.01', turns: [
      { by: 'a', react: "'You are immune from the next blocking.' Immune! I'm immune!" },
    ], beat: '{a} lies flat on the floor and laughs.' },
    { id: 'game.prize.immunity.02', turns: [
      { by: 'a', react: "Safe. I'm safe. Nobody can touch me." },
    ] },
    { id: 'game.prize.immunity.03', turns: [
      { by: 'a', react: "Safe from the next blocking? Oh, thank God. I needed that." },
      { by: 'a', say: "Now I can say what I really think for a day." },
    ] },
    { id: 'game.prize.immunity.04', turns: [
      { by: 'a', react: "I'm safe, and everybody knows it. Now I'm the one they come to." },
    ] },
  ],
  'game.prize.gift': [
    { id: 'game.prize.gift.01', turns: [
      { by: 'a', react: "I get to send somebody a gift? Oh, I know who." },
    ] },
    { id: 'game.prize.gift.02', turns: [
      { by: 'a', react: "A gift to give away. Everybody's gonna see who I pick." },
    ] },
    { id: 'game.prize.gift.03', turns: [
      { by: 'a', react: "My prize is making somebody else happy. I love that." },
    ] },
  ],
};
