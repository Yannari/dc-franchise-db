// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-tqa4.js — the questions at the vote, wider (n-tqa.js has the header)
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-12: "it's very repetitive across seasons, always the same discussion, boring", and "the
// structure spoiled who is eliminated". Measured over four played seasons: 81% of the questions asked had already
// been asked, word for word, in an earlier season ('burned' had two versions and was asked 18 times), and the
// boot was singled out (tribal.js tribalQA, header there). The danger questions now go to whoever is in danger,
// the one going home or the one who survives it, so nothing here may say or hint which one a is:
//   tqa.confident  a has at least one vote coming tonight and doesn't know it; b is writing a's name (close)
//   tqa.scramble   a has heard their name and pushes {target}, the name a writes; b is {target}
//                  (onA: 'no' when nobody is in fact writing a's name: a is sure of something that isn't so)
//   tqa.nervous    a is scared and nobody is writing a's name; b is a's closest (close: a real friend)
// And the classic Tribal's moments (vp-screens.js rpBuildTribal), said at the fire:
//   tqa.overplay   a is caught working the room before the vote; b is one of the people it puts off
//                  (two: more than one of them)
//   tqa.disrupt    a (a temper, a target) goes after b, who is organizing against a. helped: the room turns
//                  on b's plan; else it confirms what people feared about a
//   tqa.checkedout a was seen checked out at camp today; b, the sharpest eye in the room, noticed
// After the reading (tribal.js):
//   room.mixup.any   a meant to write {intended} with {group} and wrote {actual}; b is on that plan with a
//   after.split.<idol|plain>  a, on a plan that split its votes between {primary} and {secondary}, to camera
// Ids: 'nt4.'.

export default {
  'tqa.confident.any': [
    { id: 'nt4.c1', turns: [
      { by: 'h', say: "{a}, you've been smiling since you sat down. What do you know that we don't?" },
      { by: 'a', say: "Nothing. I just had a good day, and I think people know I'm a good person to have around.", v: { dry: "I know dinner was rice again. That's about it.", schemer: "I know I did my homework today. That's all I'll say.", anxious: "I'm smiling because if I stop smiling I'll start panicking." } },
      { by: 'h', say: "{b}, is {a} right to be smiling?" },
      { by: 'b', say: "I think everybody should enjoy tonight while they can.", v: { blunt: "Smiling is free.", warm: "I hope so. I really do." } },
    ] },
    { id: 'nt4.c2', turns: [
      { by: 'h', say: "{a}, if you're wrong about tonight, who's the person who fooled you?" },
      { by: 'a', say: "I'm not wrong. I've talked to everybody here, and I trust what they told me.", v: { tough: "Nobody fooled me. If I'm wrong, I'm wrong on my own.", warm: "Nobody. I'd rather trust people and be wrong than trust nobody." } },
      { by: 'h', say: "Everybody, {a} trusts all of you. How does that make you feel?" },
      { by: 'b', say: "That's nice to hear.", v: { quiet: "...Yeah. That's nice." } },
      { beat: "Nobody else says anything." },
    ] },
    { id: 'nt4.c3', when: { close: true }, turns: [
      { by: 'h', say: "{a}, {b} has been sitting next to you all night. Is that on purpose?" },
      { by: 'a', say: "{b}'s my person out here. Where else would {b.sub} sit?" },
      { by: 'b', say: "I sit where there's room.", v: { warm: "I'll always sit next to you, {a}. You know that.", dry: "It's the only bit of log without a splinter." } },
      { by: 'h', say: "That's very sweet. Very sweet." },
    ] },
    { id: 'nt4.c4', turns: [
      { by: 'h', say: "{a}, what did you do today to stay safe tonight?" },
      { by: 'a', say: "Honestly, not much. I didn't think I needed to.", v: { schemer: "Enough. I had the conversations I needed to have.", tough: "I didn't beg anybody, if that's what you're asking." } },
      { by: 'h', say: "{b}, should {a} have done more?" },
      { by: 'b', say: "Everybody should always do more out here. Me included." },
    ] },
    { id: 'nt4.c5', turns: [
      { by: 'h', say: "{a}, what's the name you're expecting to hear tonight?" },
      { by: 'a', say: "I'm not saying it out loud. That person is sitting right there, and I'm not cruel.", v: { cruel: "Do you want me to point? Because I'll point.", goofy: "I'd tell you, but then I'd have to sit next to them on the walk back." } },
      { by: 'b', say: "That's a lot of confidence for a night like this." },
      { by: 'a', say: "It's not confidence if you've counted the votes." },
    ] },
    { id: 'nt4.c6', when: { close: false }, turns: [
      { by: 'h', say: "{b}, you've barely looked at {a} all night. Any reason?" },
      { by: 'b', say: "I'm looking at the fire. It's a nice fire.", v: { blunt: "I don't have to look at anybody to vote.", anxious: "I'm not avoiding anybody! I'm just tired." } },
      { by: 'a', say: "It's fine. {b} and I aren't exactly close." },
      { by: 'h', say: "And yet you look pretty relaxed about that, {a}." },
      { by: 'a', say: "Because not being close isn't the same as being a target." },
    ] },
  ],
  'tqa.scramble.any': [
    { id: 'nt4.s1', turns: [
      { by: 'h', say: "{a}, word is you were going tent to tent this afternoon. What was that about?" },
      { by: 'a', say: "I heard my name, and I wasn't going to sit there and wait. So yes, I talked to everybody.", v: { anxious: "I panicked, okay? I heard my name, and I panicked, and I talked to literally everyone.", tough: "I heard my name. I don't wait around for things to happen to me." } },
      { by: 'h', say: "And what did you tell them?" },
      { by: 'a', say: "That {target} is the one they should be scared of." },
      { by: 'b', say: "You told everybody that? I wondered why people kept looking at me funny.", v: { cruel: "Cute. I hope it worked out for you.", calm: "Okay. Then I guess we'll see who they believed." } },
    ] },
    { id: 'nt4.s2', turns: [
      { by: 'h', say: "{a}, you look like you've got something to get off your chest." },
      { by: 'a', say: "I do. {target} has been telling people I'm a threat, so I'd like everybody to ask why {target} cares so much." },
      { by: 'b', say: "I never said that.", v: { schemer: "I said a lot of things today. That wasn't one of them.", loud: "I never said that! Who told you that?" } },
      { by: 'a', say: "You didn't have to say it to me. Other people did." },
      { by: 'h', say: "Ooh. The plot thickens." },
    ] },
    { id: 'nt4.s3', when: { onA: 'no' }, turns: [
      { by: 'h', say: "{a}, you seem certain your name is out there tonight. Why?" },
      { by: 'a', say: "Because nobody would look me in the eye at lunch. That's never a good sign.", v: { dry: "Because I've seen this show before.", anxious: "Because everybody went quiet when I walked into the shelter." } },
      { by: 'h', say: "So who should the tribe write instead?" },
      { by: 'a', say: "{target}. I'm not going to pretend otherwise." },
      { by: 'b', say: "And you think saying it here helps you?" },
      { by: 'a', say: "I think staying quiet definitely doesn't." },
    ] },
    { id: 'nt4.s4', turns: [
      { by: 'h', say: "{a}, what's the one thing you'd want this tribe to know before they vote?" },
      { by: 'a', say: "That {target} has made a deal with almost everybody sitting here, and those deals can't all be real." },
      { by: 'b', say: "I talk to people. That's not a crime." },
      { by: 'a', say: "Talking isn't. Promising everybody the same thing is." },
      { beat: "A couple of people look at each other." },
    ] },
    { id: 'nt4.s5', turns: [
      { by: 'h', say: "{b}, {a} has been pointing at you all day. How does that feel?" },
      { by: 'b', say: "Like {a} is scared and needed somebody to point at.", v: { cruel: "Flattering. {a} thinks about me a lot.", warm: "Honestly, it hurts. I thought we were fine." } },
      { by: 'a', say: "I'm not scared. I'm paying attention." },
      { by: 'h', say: "Those can look very similar from where I'm sitting." },
    ] },
  ],
  'tqa.nervous.any': [
    { id: 'nt4.n1', turns: [
      { by: 'h', say: "{a}, you've been fidgeting since you sat down. Are you worried?" },
      { by: 'a', say: "I'm always worried. That's kind of my thing out here.", v: { tough: "I'm not worried. I'm just... alert.", loud: "Worried? Me? Absolutely terrified, thanks for asking!" } },
      { by: 'h', say: "{b}, should {a} be worried?" },
      { by: 'b', say: "Everybody should be a little worried. But I haven't heard anything about {a}.", v: { warm: "I'd tell {a} if I'd heard anything. I haven't." } },
      { by: 'a', say: "You'd say that either way." },
    ] },
    { id: 'nt4.n2', when: { close: true }, turns: [
      { by: 'h', say: "{a}, if you could have one guarantee tonight, what would it be?" },
      { by: 'a', say: "That I get to walk back to camp with {b}. That's all I want." },
      { by: 'b', say: "You're going to be fine. I told you that this afternoon." },
      { by: 'a', say: "You tell me that every time." },
      { by: 'b', say: "And I've been right every time." },
    ] },
    { id: 'nt4.n3', turns: [
      { by: 'h', say: "{a}, you didn't eat much today. Nerves?" },
      { by: 'a', say: "Something like that. Every time I walked up, people stopped talking.", v: { dry: "Partly nerves. Mostly the food.", anxious: "I couldn't. Everybody was whispering, and I was sure it was about me." } },
      { by: 'b', say: "People stop talking when anybody walks up. It's not just you." },
      { by: 'h', say: "Does that make you feel better, {a}?" },
      { by: 'a', say: "Not really, no." },
    ] },
    { id: 'nt4.n4', when: { close: false }, turns: [
      { by: 'h', say: "{a}, who would you go to tonight if you needed help?" },
      { by: 'a', say: "I don't know. That's sort of the problem." },
      { by: 'h', say: "{b}?" },
      { by: 'b', say: "I mean, you could have come to me. You never did.", v: { tough: "You never asked. People out here have to ask." } },
      { by: 'a', say: "I'm asking now, I guess." },
    ] },
    { id: 'nt4.n5', turns: [
      { by: 'h', say: "On a scale of one to ten, {a}, how safe do you feel?" },
      { by: 'a', say: "Four. Maybe a three.", v: { loud: "Negative two! I've been sweating since lunch!", schemer: "A solid six. I never say higher than six." } },
      { by: 'h', say: "{b}, what number would you give {a}?" },
      { by: 'b', say: "Higher than {a} would.", v: { warm: "Way higher. {a} is overthinking this." } },
    ] },
  ],
  'tqa.overplay.any': [
    { id: 'nt4.o1', turns: [
      { beat: "{a} is leaning across the log, whispering to anybody who'll lean in." },
      { by: 'h', say: "Whoa, whoa. {a}, are you campaigning right now? At my fire?" },
      { by: 'a', say: "I'm just talking. People are allowed to talk.", v: { anxious: "I'm just making sure everybody's on the same page! That's all!", schemer: "I'm clarifying a few things." } },
      { by: 'b', say: "You've been clarifying things to me for an hour, {a}.", v: { blunt: "You're doing it again. You've been doing it all day." } },
      { by: 'h', say: "{b} does not look like somebody who enjoyed the clarifying." },
    ] },
    { id: 'nt4.o2', turns: [
      { by: 'h', say: "{b}, I couldn't help noticing {a} pulled you aside on the way in. Anything you want to share?" },
      { by: 'b', say: "{a} made me a few promises. Big ones. Some of them I've heard {a} make to other people.", v: { tough: "Just that {a} will say anything right now. Anything at all." } },
      { by: 'a', say: "I meant every word I said to you." },
      { by: 'b', say: "That's what worries me." },
    ] },
    { id: 'nt4.o3', when: { two: true }, turns: [
      { by: 'h', say: "{a}, you've talked to half this tribe since you sat down. Is something wrong?" },
      { by: 'a', say: "Nothing's wrong. I just want to make sure we're doing the right thing tonight.", v: { loud: "Everything's fine! I'm just being social! I'm a social person!" } },
      { by: 'b', say: "{a} has been doing the right thing at me since the trail.", v: { dry: "We've been told about the right thing several times now." } },
      { beat: "Somebody further down the log nods." },
      { by: 'h', say: "I'm sensing a theme." },
    ] },
    { id: 'nt4.o4', turns: [
      { by: 'a', say: "Can I just say, before anybody votes, that we had a deal, and deals matter out here?" },
      { by: 'h', say: "Who had a deal, {a}?" },
      { by: 'a', say: "Everybody knows who." },
      { by: 'b', say: "I think a few of us thought the deal was with us.", v: { cruel: "Which deal? You've made about four today." } },
      { beat: "{a} opens {a.posAdj} mouth, and then closes it again." },
    ] },
    { id: 'nt4.o5', turns: [
      { by: 'h', say: "{a}, deep breath. You've been talking for about three minutes straight." },
      { by: 'a', say: "Because nobody is listening! I'm trying to save this tribe from a bad decision!", v: { calm: "I'm sorry. I just think it's important everybody hears this.", emotional: "Because I'm scared, okay? I'm scared and I'm trying!" } },
      { by: 'b', say: "We're listening, {a}. That's kind of the problem." },
    ] },
  ],
  'tqa.disrupt.any': [
    { id: 'nt4.d1', when: { helped: true }, turns: [
      { by: 'h', say: "{a}, you've been staring at {b} since you sat down. Want to say something?" },
      { by: 'a', say: "Yeah, I do. {b} has been going around all day telling people to write my name, and {b} hasn't got the guts to say it here.", v: { loud: "YES. {b} has been going behind my back all day, and I'm done pretending I don't know!" } },
      { by: 'b', say: "Calm down. Nobody said anything about you.", v: { schemer: "That's a big accusation, {a}. Can you back it up?" } },
      { by: 'a', say: "Ask anybody here who {b} talked to this afternoon. Go on, ask them." },
      { beat: "Nobody answers. But a few people are looking at {b} now, not {a}." },
      { by: 'h', say: "Well. That got interesting." },
    ] },
    { id: 'nt4.d2', when: { helped: true }, turns: [
      { by: 'a', say: "I'm sorry, I can't sit here and be quiet. {b}, you told me this morning I was safe, and then you went straight to everybody else." },
      { by: 'b', say: "That's not what happened.", v: { anxious: "That's... that's not what happened, okay?" } },
      { by: 'a', say: "Then why does everybody here know your plan except me?" },
      { by: 'h', say: "{b}? Anything to add?" },
      { by: 'b', say: "I've said what I'm going to say." },
      { beat: "It is not the answer of somebody with nothing to hide, and the room heard that." },
    ] },
    { id: 'nt4.d3', when: { helped: true }, turns: [
      { by: 'h', say: "{a}, you look like you're about to explode." },
      { by: 'a', say: "Because I am! {b} is running this whole vote, and everybody's just letting it happen!" },
      { by: 'b', say: "Nobody is running anything." },
      { by: 'a', say: "Then why is it your name I keep hearing every time somebody makes a plan?" },
      { beat: "{b} starts to answer, and then thinks better of it. Somebody at the end of the log shifts in their seat." },
    ] },
    { id: 'nt4.d4', when: { helped: false }, turns: [
      { by: 'h', say: "{a}, you've been glaring at {b} all night. Something you want to get off your chest?" },
      { by: 'a', say: "{b} knows exactly what {b.sub} did. Snake. You're a snake, {b}.", v: { loud: "You're a SNAKE, {b}! Everybody here knows it!" } },
      { by: 'b', say: "I haven't said a word to you all night." },
      { by: 'a', say: "That's what snakes do!" },
      { by: 'h', say: "Okay, okay. Sit down, {a}. Sit down." },
      { beat: "{a} sits. Around the fire, people are looking at the ground, and nobody is looking at {b}." },
    ] },
    { id: 'nt4.d5', when: { helped: false }, turns: [
      { by: 'a', say: "You know what? Fine. {b}, you want me gone, just say it. Say it to my face!" },
      { by: 'b', say: "I don't want anything. You're the one shouting." },
      { by: 'a', say: "Because you've been lying all day!" },
      { by: 'h', say: "{a}, nobody else is shouting. Just you." },
      { beat: "{a} looks round the fire, and sees that's true." },
    ] },
    { id: 'nt4.d6', when: { helped: false }, turns: [
      { by: 'h', say: "{a}, you seem tense tonight." },
      { by: 'a', say: "Tense? I'm not tense, I'm sick of {b} acting like the nicest person here after stabbing me in the back all week!" },
      { by: 'b', say: "This. This is what I've been dealing with." },
      { by: 'h', say: "Is that true, everybody? Is this what you've been dealing with?" },
      { beat: "Two or three people nod before they can stop themselves." },
    ] },
  ],
  'tqa.checkedout.any': [
    { id: 'nt4.k1', turns: [
      { by: 'h', say: "{a}, where were you today? Because the cameras mostly caught you lying in the shelter." },
      { by: 'a', say: "Resting. You've seen the challenges. I needed it.", v: { dry: "Thinking. It looks a lot like napping.", tough: "I don't need to run around to know where I stand." } },
      { by: 'h', say: "{b}, did you notice {a} was missing?" },
      { by: 'b', say: "I noticed. I think a few of us noticed." },
      { by: 'a', say: "What's that supposed to mean?" },
    ] },
    { id: 'nt4.k2', turns: [
      { by: 'h', say: "{b}, who here has been the least involved today?" },
      { by: 'b', say: "I don't want to point anybody out.", v: { blunt: "{a}. I'm not trying to be mean. It's just true." } },
      { by: 'h', say: "But if you had to?" },
      { by: 'b', say: "I'd say {a} had a pretty quiet afternoon." },
      { by: 'a', say: "Quiet isn't the same thing as lazy." },
    ] },
    { id: 'nt4.k3', turns: [
      { by: 'h', say: "{a}, what do you think everybody was talking about today?" },
      { by: 'a', say: "Honestly? No idea. I was down by the water most of the day.", v: { schemer: "The usual. I didn't need to be there for it." } },
      { by: 'b', say: "Most of the day." },
      { by: 'h', say: "{b} said that like it means something." },
      { by: 'b', say: "It means a lot happened while {a} was down by the water." },
    ] },
    { id: 'nt4.k4', turns: [
      { by: 'h', say: "{a}, you look very calm. Calm, or checked out?" },
      { by: 'a', say: "Calm. Definitely calm.", v: { goofy: "Is there a difference? Genuinely asking.", anxious: "Calm! Calm. Why, do I look checked out?" } },
      { by: 'b', say: "You didn't come to the fire when we were all talking this afternoon." },
      { by: 'a', say: "I didn't know I had to sign in." },
    ] },
  ],
  'tqa.leader.any': [
    { id: 'nt4.l1', turns: [
      { by: 'h', say: "{b}, who decides how this tribe votes?" },
      { by: 'b', say: "It's supposed to be all of us. I'm not sure it is.", v: { blunt: "{a}. Everybody knows it's {a}." } },
      { by: 'h', say: "{a}, does that sound fair?" },
      { by: 'a', say: "I share my opinion. If people like it, that's up to them.", v: { bossy: "Somebody has to say something sensible. It may as well be me." } },
      { by: 'b', say: "People always seem to like it, though." },
    ] },
    { id: 'nt4.l2', turns: [
      { by: 'h', say: "{a}, how many conversations did you have about tonight?" },
      { by: 'a', say: "A normal number.", v: { dry: "I stopped counting at lunch.", schemer: "As many as I needed." } },
      { by: 'h', say: "{b}, what's a normal number for {a}?" },
      { by: 'b', say: "All of them. {a} was in all of them." },
    ] },
    { id: 'nt4.l3', turns: [
      { by: 'h', say: "{a}, if this tribe were a company, what would your job title be?" },
      { by: 'a', say: "Team player. Just a regular team player.", v: { goofy: "Snack manager. Unpaid.", proud: "Probably the one who actually gets things done." } },
      { by: 'b', say: "That's funny, I'd have said boss." },
      { by: 'a', say: "Then you don't know me very well, {b}." },
      { by: 'b', say: "I know you well enough." },
    ] },
    { id: 'nt4.l4', turns: [
      { by: 'h', say: "{b}, you've been quiet. Do you feel like you have a say in tonight?" },
      { by: 'b', say: "Honestly? Not much. It feels like it was decided somewhere I wasn't." },
      { by: 'h', say: "Decided by who?" },
      { by: 'b', say: "I'll let {a} answer that." },
      { by: 'a', say: "I don't know why I'm getting dragged into this.", v: { calm: "I'm happy to answer. Nobody decided anything without everybody." } },
    ] },
    { id: 'nt4.l5', turns: [
      { by: 'h', say: "{a}, people keep glancing at you before they answer me. Have you noticed?" },
      { by: 'a', say: "They're glancing at the fire. I'm just sitting next to it." },
      { by: 'b', say: "We're glancing at you, {a}." },
      { by: 'h', say: "There we go." },
    ] },
  ],
  'tqa.burned.any': [
    { id: 'nt4.b1', turns: [
      { by: 'h', say: "{a}, last vote you wrote a name, and it wasn't {lastBoot}. What did you learn?" },
      { by: 'a', say: "That the people who smile at you at lunch aren't always telling you the truth.", v: { dry: "That I should stop believing anybody before dinner.", warm: "That I trust too easily. I'm working on it." } },
      { by: 'h', say: "And do you know where the votes are going tonight?" },
      { by: 'a', say: "I know where I think they're going. Last time I thought that too." },
    ] },
    { id: 'nt4.b2', turns: [
      { by: 'h', say: "{a}, when {lastBoot}'s name came out last time, you looked shocked. Are you over it?" },
      { by: 'a', say: "Over being shocked, yes. Over being lied to, not really.", v: { tough: "I'm over it. I'm also not forgetting it.", emotional: "Not really. I think about it every time someone tells me something." } },
      { by: 'h', say: "Does it change how you play tonight?" },
      { by: 'a', say: "It changes who I believe." },
    ] },
    { id: 'nt4.b3', turns: [
      { by: 'h', say: "{a}, you were on the losing side when {lastBoot} went home. Did anybody explain it to you afterwards?" },
      { by: 'a', say: "A couple of people said sorry. Nobody explained anything.", v: { schemer: "I didn't need anybody to explain it. I worked it out myself." } },
      { by: 'h', say: "And did you believe the sorries?" },
      { by: 'a', say: "Some of them." },
    ] },
    { id: 'nt4.b4', turns: [
      { by: 'h', say: "Let's talk about last time. {a}, you didn't see {lastBoot} going. Who did you think it was?" },
      { by: 'a', say: "I'm not going to say. That person's sitting here, and we've talked about it." },
      { by: 'h', say: "You've made up?" },
      { by: 'a', say: "We've talked about it. That's not quite the same thing." },
    ] },
    { id: 'nt4.b5', turns: [
      { by: 'h', say: "{a}, you got blindsided last time with {lastBoot}. Is anybody sitting here responsible for that?" },
      { by: 'a', say: "Probably most of you.", v: { warm: "I don't blame anybody. It's a game. It still stung.", loud: "Yes! And they know who they are!" } },
      { beat: "A couple of people suddenly find the fire very interesting." },
      { by: 'h', say: "Tough crowd." },
    ] },
    { id: 'nt4.b6', turns: [
      { by: 'h', say: "{a}, if tonight goes the way last time went, what does that mean for you?" },
      { by: 'a', say: "It means I'm on the outside, and I need to stop pretending I'm not.", v: { tough: "It means I start making my own plans instead of joining other people's.", anxious: "It means I'm in big trouble, so please let tonight be different." } },
      { by: 'h', say: "Fair enough. Honest, at least." },
    ] },
  ],
  'tqa.pair.any': [
    { id: 'nt4.p1', turns: [
      { by: 'h', say: "{a} and {b}. You two have barely been apart. Is that strategy or friendship?" },
      { by: 'a', say: "Friendship. Strategy's what everybody else is doing.", v: { schemer: "Both. Is that allowed?", dry: "Mostly it's that {b} has the warmer side of the shelter." } },
      { by: 'b', say: "Mostly friendship." },
      { by: 'h', say: "Mostly. Got it." },
    ] },
    { id: 'nt4.p2', turns: [
      { by: 'h', say: "{b}, has {a} ever voted differently from you?" },
      { by: 'b', say: "I don't actually know. We don't always talk about it.", v: { blunt: "No. And I don't expect that to change." } },
      { by: 'a', say: "We talk about plenty of other things." },
      { by: 'h', say: "But not votes. Interesting." },
    ] },
    { id: 'nt4.p3', turns: [
      { by: 'h', say: "If anybody here wanted to break up {a} and {b}, how would they do it?" },
      { by: 'b', say: "Send one of us home, I guess. That's the only way." },
      { by: 'a', say: "Can we not give people ideas?" },
      { by: 'h', say: "Too late." },
    ] },
    { id: 'nt4.p4', turns: [
      { by: 'h', say: "{a}, if {b} were sitting on the other side of a vote from you, what would you do?" },
      { by: 'a', say: "Talk to {b} first. I wouldn't do anything without talking to {b} first.", v: { tough: "That's not going to happen, so I'm not answering it." } },
      { by: 'b', say: "Same. Always." },
    ] },
  ],
  'tqa.room.any': [
    { id: 'nt4.r1', turns: [
      { by: 'h', say: "Everybody, quick show of hands. Who here has been lied to this week?" },
      { beat: "{a} puts a hand up straight away. {b} follows. {c} keeps both hands in {c.posAdj} lap." },
      { by: 'h', say: "{c}, nobody's lied to you?" },
      { by: 'c', say: "Nobody I know of.", v: { dry: "Not that I've caught yet." } },
      { by: 'a', say: "That's what they all say." },
    ] },
    { id: 'nt4.r2', turns: [
      { by: 'h', say: "If you could change one thing about this tribe, what would it be? {a}?" },
      { by: 'a', say: "Fewer secrets.", v: { goofy: "Better food. Then fewer secrets." } },
      { by: 'b', say: "More honesty. Which I guess is the same thing." },
      { by: 'c', say: "Nothing. I'd just like to still be in it tomorrow.", v: { blunt: "Nothing. It's a game, not a family." } },
    ] },
    { id: 'nt4.r3', turns: [
      { by: 'h', say: "Who here thinks tonight is going to be a surprise?" },
      { beat: "{a} and {b} raise their hands at the same moment, then look at each other." },
      { by: 'c', say: "Okay, now I'm worried." },
      { by: 'h', say: "As you should be. As you all should be." },
    ] },
  ],
  'tqa.immune.any': [
    { id: 'nt4.i1', turns: [
      { by: 'h', say: "{a}, the necklace is around your neck. Who came to talk to you this afternoon?" },
      { by: 'a', say: "Pretty much everybody.", v: { schemer: "The people who needed to.", dry: "Everybody. It's amazing how popular you get." } },
      { by: 'b', opt: true, say: "I didn't." },
      { by: 'a', opt: true, say: "No, you didn't. I noticed that." },
    ] },
    { id: 'nt4.i2', turns: [
      { by: 'h', say: "{a}, you're safe. If you could give the necklace to somebody here, would you?" },
      { by: 'a', say: "No. I worked hard for this.", v: { warm: "I thought about it, honestly. But no.", goofy: "Only if they ask nicely. Nobody's asked nicely." } },
      { by: 'b', opt: true, say: "Worth a try." },
    ] },
    { id: 'nt4.i3', turns: [
      { by: 'h', say: "{a}, does winning today make you a bigger target next time?" },
      { by: 'a', say: "Probably. I'll worry about next time next time." },
      { by: 'b', opt: true, say: "That's what everybody says right before next time." },
    ] },
  ],
  'tqa.outsider.any': [
    { id: 'nt4.u1', turns: [
      { by: 'h', say: "{a}, who did you eat lunch with today?" },
      { by: 'a', say: "Myself, mostly. It's fine.", v: { dry: "A crab. We didn't talk much.", emotional: "Nobody. Nobody asked me." } },
      { by: 'b', say: "You could have come and sat with us." },
      { by: 'a', say: "Nobody said I could." },
    ] },
    { id: 'nt4.u2', turns: [
      { by: 'h', say: "{b}, how well do you actually know {a}?" },
      { by: 'b', say: "Not as well as I should, honestly. That's on me as much as {a}." },
      { by: 'a', say: "That's nice of you to say." },
      { by: 'h', say: "Is it too late to fix?" },
      { by: 'b', say: "I hope not." },
    ] },
    { id: 'nt4.u3', turns: [
      { by: 'h', say: "{a}, what's it like playing this game without a group?" },
      { by: 'a', say: "Quiet. You hear a lot more when nobody's talking to you.", v: { tough: "Lonely, but at least nobody can stab me in the back.", anxious: "Scary. Really scary, actually." } },
      { by: 'b', say: "What do you hear?" },
      { by: 'a', say: "Enough." },
    ] },
  ],
  'tqa.endgame.any': [
    { id: 'nt4.e1', turns: [
      { by: 'h', say: "There aren't many of you left. {a}, does it still feel like a tribe?" },
      { by: 'a', say: "Not really. It feels like a group of people who are each counting." },
      { by: 'b', say: "Counting what?" },
      { by: 'a', say: "Each other, {b}." },
    ] },
    { id: 'nt4.e2', turns: [
      { by: 'h', say: "{a}, is there anybody here you'd never vote out?" },
      { by: 'a', say: "There used to be. It's getting harder to say that and mean it.", v: { warm: "{b}. I'd go home before I wrote {b}'s name.", schemer: "There's nobody I'd never vote out. That's why I'm still here." } },
      { by: 'b', say: "I'm going to pretend I didn't hear that." },
    ] },
    { id: 'nt4.e3', turns: [
      { by: 'h', say: "{b}, who's the biggest threat to win sitting here?" },
      { by: 'b', say: "If I say it, I'm making a target, so I'll just look at {a}." },
      { by: 'a', say: "Thanks for that, {b}.", v: { dry: "Very subtle. Thank you." } },
      { by: 'h', say: "The look said it all." },
    ] },
  ],
  'tqa.merge.any': [
    { id: 'nt4.m1', turns: [
      { by: 'h', say: "{a}, {b}, you two were rivals a week ago. Are you allies now?" },
      { by: 'a', say: "We're getting to know each other.", v: { schemer: "We're figuring out if we're useful to each other." } },
      { by: 'b', say: "Slowly." },
      { by: 'h', say: "Slowly. Good word for a merge." },
    ] },
    { id: 'nt4.m2', turns: [
      { by: 'h', say: "{b}, did you spend today with your old tribe or your new friends?" },
      { by: 'b', say: "Both. I'm trying not to make anybody nervous." },
      { by: 'a', say: "That's what makes people nervous." },
      { by: 'b', say: "Then I can't win." },
    ] },
    { id: 'nt4.m3', turns: [
      { by: 'h', say: "{a}, is there a name tonight that's just about the old tribe lines?" },
      { by: 'a', say: "I hope not. That would be a very boring way to play.", v: { blunt: "Probably. People like what they know." } },
      { by: 'b', say: "Boring works, though." },
    ] },
  ],
  'tqa.fight.any': [
    { id: 'nt4.f1', turns: [
      { by: 'h', say: "{a}, {b}, I'm told today got heated. Who started it?" },
      { by: 'a', say: "{b}.", v: { warm: "Honestly? Me. I said something I shouldn't have." } },
      { by: 'b', say: "{a}." },
      { by: 'h', say: "Glad that's cleared up." },
    ] },
    { id: 'nt4.f2', turns: [
      { by: 'h', say: "{b}, have you and {a} talked since the argument?" },
      { by: 'b', say: "No. I don't think there's anything left to say.", v: { warm: "A little. We're okay. I think we're okay." } },
      { by: 'a', say: "There's plenty left to say. Just not here." },
    ] },
    { id: 'nt4.f3', turns: [
      { by: 'h', say: "Everybody heard {a} and {b} today. Did anybody pick a side?" },
      { by: 'a', say: "I didn't ask anybody to pick a side." },
      { by: 'b', say: "You didn't have to ask. You were loud enough." },
      { by: 'h', say: "Ooh. Round two, right here, live." },
    ] },
  ],
  'tqa.sank.any': [
    { id: 'nt4.k5', when: { defends: true }, turns: [
      { by: 'h', say: "{a}, the challenge didn't go your way today." },
      { by: 'a', say: "No, it didn't. I'm not going to make excuses." },
      { by: 'b', say: "{a} carried us in the last one. People forget that fast." },
      { by: 'h', say: "Do they, {b}?" },
      { by: 'b', say: "Some people do." },
    ] },
    { id: 'nt4.k6', when: { defends: false }, turns: [
      { by: 'h', say: "{b}, did the challenge today change anything about tonight?" },
      { by: 'b', say: "It made some things clearer.", v: { blunt: "Yeah. We saw who could and who couldn't." } },
      { by: 'a', say: "You can say my name, {b}. I was there." },
      { by: 'b', say: "I didn't need to." },
    ] },
    { id: 'nt4.k7', turns: [
      { by: 'h', say: "{a}, if you could redo one moment of today's challenge, which would it be?" },
      { by: 'a', say: "All of it. Every second.", v: { dry: "The part where I agreed to be here.", tough: "None of it. I'd do better next time, not again." } },
      { by: 'b', say: "We all had bad moments." },
      { by: 'a', say: "Mine was on camera, though." },
    ] },
  ],
  'tqa.idol.any': [
    { id: 'nt4.x1', turns: [
      { by: 'h', say: "{a}, I've heard you've been spending a lot of time in the woods. Find anything?" },
      { by: 'a', say: "Firewood. Lots of firewood.", v: { goofy: "A very nice stick. I've named it." } },
      { by: 'b', say: "That's a lot of firewood for someone who never carries any back." },
      { by: 'a', say: "I'm a slow carrier." },
    ] },
    { id: 'nt4.x2', turns: [
      { by: 'h', say: "{b}, do you think somebody here is holding something tonight?" },
      { by: 'b', say: "I think somebody here is very relaxed for no reason." },
      { by: 'a', say: "You keep looking at me when you say that." },
      { by: 'b', say: "Do I?" },
    ] },
  ],
  'room.mixup.any': [
    // (caught at the reading only where the votes are read aloud, fact count: at a marshmallow ceremony nobody hears who
    // wrote what; read 2026-10-14, "You wrote Courtney?" at the campfire)
    { id: 'nt4.mx1', when: { count: true }, turns: [
      { by: 'b', say: "Wait, who wrote {actual}? That wasn't the plan." },
      { beat: "{a} goes very still." },
      { by: 'a', say: "...I thought it was {actual}. Wasn't it {actual}?", v: { anxious: "Oh no. Oh, no, no. Was it {intended}? It was {intended}, wasn't it?" } },
      { by: 'b', say: "It was {intended}, {a}. It was always {intended}." },
    ] },
    { id: 'nt4.mx2', when: { count: true }, turns: [
      { beat: "{b} turns to look down the log at {a}." },
      { by: 'b', say: "You wrote {actual}?" },
      { by: 'a', say: "I wrote what we said. Didn't we say {actual}?", v: { tough: "I wrote what I heard. If somebody said it wrong, that's not on me." } },
      { by: 'b', say: "We said {intended}. We said it twice." },
    ] },
    { id: 'nt4.mx3', when: { count: true }, turns: [
      { by: 'a', conf: "I had one job tonight. Write {intended}. I wrote {actual}. I don't even know how it happened. I think I'm going to be hearing about this for a long time." },
      { by: 'b', conf: "{a} wrote the wrong name. On the night it mattered. I can't even be angry, I'm too busy being amazed." },
    ] },
    // where nobody hears the votes, only the one who wrote it knows
    { id: 'nt4.mx4', when: { count: false }, turns: [
      { by: 'a', conf: "We all said {intended}. I wrote {actual}. I don't even know how. Nobody heard the votes, so nobody knows but me, and I'm keeping it that way." },
    ] },
    { id: 'nt4.mx5', when: { count: false }, turns: [
      { by: 'a', conf: "I think I wrote {actual}. The plan was {intended}. If anybody ever finds out, I was confused. Which is true." },
    ] },
  ],
  'after.split.idol': [
    { id: 'nt4.sp1', turns: [
      { by: 'a', conf: "We split the votes between {primary} and {secondary} in case of an idol, and the idol came out. That's the only reason tonight worked." },
    ] },
    { id: 'nt4.sp2', turns: [
      { by: 'a', conf: "Everybody laughed when I said we should split it. Nobody's laughing now. {primary} played the idol, and {secondary} went home anyway." },
    ] },
  ],
  'after.split.plain': [
    { id: 'nt4.sp3', turns: [
      { by: 'a', conf: "We put some votes on {secondary} just in case {primary} had an idol. {primary} didn't. Better safe than sorry, and tonight we were safe." },
    ] },
    { id: 'nt4.sp4', turns: [
      { by: 'a', conf: "Splitting the vote between {primary} and {secondary} was insurance. We never needed it, but I'd do it again tomorrow." },
    ] },
  ],
};
