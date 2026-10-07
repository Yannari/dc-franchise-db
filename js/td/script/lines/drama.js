// ══════════════════════════════════════════════════════════════════════
// td/script/lines/drama.js — camp drama: blow-ups, digs, power plays, the thaw after
// ══════════════════════════════════════════════════════════════════════
//
// Every event here was decided by camp-events.js (who, the bond hit, the band the
// engine read: how hot the temper, whether the prank landed). These are the words.
//
// drama.bomb.<arrogant|hothead> — {a} says the thing nobody should say out loud, in
//   front of {b} (the one most offended, who will react next).
// drama.read.<arrogant|hothead> — {a} (the witness) on what {b} just did.
// drama.fight.<erupt|snap|tense|rare> — {a} and {b} fight; the band is {a}'s temper:
//   erupt (no fuse at all), snap, tense (controlled, barely), rare ({a} never does this).
// drama.dispute.<callout|press|precise|plain> — {a} and {b} disagree about the game.
// drama.clash.any — {a} and {b} both try to run camp.
// drama.explode.<erupt|snap|crack> — {a} unloads on {b}.
// drama.meltdown.<total|crack|rare> — {a} falls apart in front of the camp.
// drama.food.any — {a} takes more than a fair share; {b} catches it.
// drama.intimidate.<physical|presence> — {a} unnerves {b}.
// drama.prank.<well|badly> — {a} pranks {b}; it lands or it really doesn't.
// drama.showboat.any — {a} brags; {b} has to listen.
// drama.dig.any — {a} takes a passive-aggressive shot at {b} in front of people.
// drama.jealous.any — {a} resents {b}'s challenge wins.
// drama.thaw.<talk|blowup|small> — rivals {a} and {b} soften.
// drama.truce.<plain|gesture|slow> — {a} makes peace with {b}.
// drama.stir.<bold|sly> — {a} sets {b} and {c} against each other.
// Ids: 'dr.'.

// ── the social bomb ───────────────────────────────────────────────────
const BOMB_ARROGANT = [
  { id: 'dr.ba1', turns: [
    { beat: 'Everyone is around the fire. {a} leans back like the fire belongs to {a.obj}.' },
    { by: 'a', say: "Can I be honest? Half of you are only still here because nobody's bothered to vote you out yet." },
    { by: 'b', say: "Wow." },
    { by: 'a', say: "What? I said half." },
    { by: 'b', conf: "{a} thinks being honest and being a jerk are the same thing. They are not." },
  ] },
  { id: 'dr.ba2', turns: [
    { by: 'a', say: "Let's be real. If this was a real competition, I'd have won it already." },
    { by: 'b', say: "It is a real competition." },
    { by: 'a', say: "Then I'm winning it. Same thing." },
    { beat: 'Nobody laughs. {a} does not seem to notice.' },
  ] },
  { id: 'dr.ba3', turns: [
    { by: 'a', say: "I'm just saying, some people here are carrying and some people are being carried." },
    { by: 'b', say: "And which one are you?" },
    { by: 'a', say: "Do you really need me to answer that?" },
    { by: 'b', conf: "Everyone heard it. Everyone. And {a} walked off smiling like {a} told a great joke." },
  ] },
  { id: 'dr.ba4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Honestly, I don't even need an alliance. I just need the rest of you to keep being predictable." },
    { by: 'b', say: "Did you just say that out loud?" },
    { by: 'a', say: "Relax. It's a compliment. You're reliable." },
    { by: 'b', conf: "That's the moment I stopped trusting {a}. Not slowly. All at once." },
  ] },
  { id: 'dr.ba5', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Next challenge, everybody just stay out of my way and we'll win." },
    { by: 'b', say: "Everybody?" },
    { by: 'a', say: "Mostly you." },
    { by: 'b', conf: "{a} wins one challenge and suddenly the rest of us are furniture." },
  ] },
  { id: 'dr.ba6', turns: [
    { by: 'a', say: "Here's my read on everybody. Want it? You're getting it." },
    { beat: '{a} goes around the circle, one person at a time. Nobody comes out of it well.' },
    { by: 'b', say: "Are you done?" },
    { by: 'a', say: "I skipped myself. I'm perfect." },
  ] },
  { id: 'dr.ba7', when: { age: 'older' }, turns: [
    { by: 'a', say: "With respect, I've been doing this kind of thing longer than most of you have been alive." },
    { by: 'b', say: "Doing what? Being voted for?" },
    { by: 'a', say: "Winning. Kid." },
    { by: 'b', conf: "The second {a} called me kid, {a} lost my vote. Not that {a} ever had it." },
  ] },
];
const BOMB_HOTHEAD = [
  { id: 'dr.bh1', turns: [
    { beat: "Somebody moves {a}'s bag to make room by the fire. That's all it takes." },
    { by: 'a', say: "DON'T touch my stuff! Is that so hard?!" },
    { by: 'b', say: "It was a bag. We needed the space." },
    { by: 'a', say: "Then ASK!" },
    { by: 'b', conf: "We all saw it. Over a bag. Imagine what {a} is like over a vote." },
  ] },
  { id: 'dr.bh2', turns: [
    { by: 'a', say: "You know what? I'm sick of all of you." },
    { beat: 'The whole camp goes quiet.' },
    { by: 'b', say: "All of us?" },
    { by: 'a', say: "Yeah. All of you. Pretty much." },
    { by: 'b', conf: "{a} can't take that back. And honestly? I don't think {a} wants to." },
  ] },
  { id: 'dr.bh3', turns: [
    { by: 'b', say: "Hey, can you keep it down? Some of us are trying to sleep." },
    { by: 'a', say: "Some of us are trying to WIN!" },
    { by: 'b', say: "At midnight?" },
    { by: 'a', say: "At ALL HOURS!" },
    { by: 'b', conf: "Every camp has one person who yells at midnight. Ours is {a}." },
  ] },
  { id: 'dr.bh4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Oh, I'm sorry, did I say something wrong? Did I hurt everybody's FEELINGS?" },
    { by: 'b', say: "Yes. You did." },
    { by: 'a', say: "GOOD!" },
    { beat: '{a} stomps off. Nobody follows.' },
    { by: 'b', conf: "{a} won that argument. {a} also lost every vote in this camp." },
  ] },
  { id: 'dr.bh5', turns: [
    { beat: '{a} was fine all morning. Then the fire goes out.' },
    { by: 'a', say: "Who was on fire duty?! Seriously, WHO?" },
    { by: 'b', say: "You were." },
    { beat: 'A very long pause.' },
    { by: 'a', say: "Well, somebody should've reminded me!" },
  ] },
  { id: 'dr.bh6', turns: [
    { by: 'a', say: "Everybody here is so fake it makes me want to scream." },
    { by: 'b', say: "You are screaming." },
    { by: 'a', say: "BECAUSE OF HOW FAKE EVERYBODY IS!" },
    { by: 'b', conf: "{a} said the quiet part loud. Then louder. Then really loud." },
  ] },
  { id: 'dr.bh7', when: { age: 'teen' }, turns: [
    { by: 'a', say: "Stop treating me like a baby! I'm not a baby!" },
    { by: 'b', say: "Nobody said you were a baby." },
    { by: 'a', say: "You said it with your FACE!" },
    { by: 'b', conf: "I didn't say anything. Apparently my face did. My face is in trouble now." },
  ] },
];
const READ_ARROGANT = [
  { id: 'dr.ra1', turns: [
    { by: 'a', conf: "{b} just told a whole fire circle that we're all dead weight. Okay. Noted. Noted by everyone." },
  ] },
  { id: 'dr.ra2', turns: [
    { beat: '{a} keeps a straight face while {b} talks. Then catches somebody\'s eye across the fire.' },
    { by: 'a', conf: "I didn't say a word. I didn't have to. Everyone was thinking the same thing I was." },
  ] },
  { id: 'dr.ra3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I love it when people do my job for me. {b} just made the easiest case I'll ever have to make." },
  ] },
  { id: 'dr.ra4', turns: [
    { by: 'a', say: "Hey, {b}? That speech. Really inspiring." },
    { by: 'b', say: "Thanks!" },
    { by: 'a', conf: "{b} thought that was a compliment. That tells you everything about {b}." },
  ] },
  { id: 'dr.ra5', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I try to see the best in everyone. With {b} today, I really had to squint." },
  ] },
  { id: 'dr.ra6', turns: [
    { by: 'a', conf: "{b} talks like the money's already in the bank. That's usually right before somebody takes it away." },
  ] },
  { id: 'dr.ra7', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "I wanted to throw a coconut at {b}'s head. I didn't. I'm saving it for the vote." },
  ] },
];
const READ_HOTHEAD = [
  { id: 'dr.rh1', turns: [
    { by: 'a', conf: "I've seen people lose it before. {b} didn't just lose it. {b} set it on fire." },
  ] },
  { id: 'dr.rh2', turns: [
    { beat: "{a} waits until {b} is out of earshot, then quietly checks in with the others." },
    { by: 'a', say: "Is everybody okay?" },
    { by: 'a', conf: "I didn't campaign. I just asked people if they were okay. That was enough." },
  ] },
  { id: 'dr.rh3', turns: [
    { by: 'a', conf: "If {b} acts like that over a bag, what happens when there's a vote on the line? I don't want to find out." },
  ] },
  { id: 'dr.rh4', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "I didn't react. Reacting is what {b} wanted. Not reacting is what's going to get {b.obj} voted out." },
  ] },
  { id: 'dr.rh5', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "Part of me feels bad for {b}. The bigger part of me is scared to sit next to {b.obj}." },
  ] },
  { id: 'dr.rh6', turns: [
    { by: 'a', say: "You okay, {b}?" },
    { by: 'b', say: "I'm FINE." },
    { by: 'a', conf: "Not fine. Very not fine." },
  ] },
];

// ── fights ────────────────────────────────────────────────────────────
const FIGHT_ERUPT = [
  { id: 'dr.fe1', turns: [
    { by: 'a', say: "MOVE!" },
    { by: 'b', say: "What did I even do?!" },
    { by: 'a', say: "You're in my WAY! You're always in my way!" },
    { beat: "{b} stands there, stunned. The whole camp watches." },
    { by: 'b', conf: "I was carrying firewood. That's it. That's the crime." },
  ] },
  { id: 'dr.fe2', turns: [
    { beat: '{b} says good morning. {a} answers by throwing the water bucket.' },
    { by: 'b', say: "Are you serious right now?!" },
    { by: 'a', say: "I didn't sleep! Don't talk to me!" },
    { by: 'b', conf: "Good morning is apparently fighting words now." },
  ] },
  { id: 'dr.fe3', turns: [
    { by: 'a', say: "I've had it with you!" },
    { by: 'b', say: "Had it with WHAT?" },
    { by: 'a', say: "EVERYTHING!" },
    { by: 'b', say: "That's not an answer!" },
    { by: 'a', conf: "I don't know what set me off. I know it felt amazing for about two seconds." },
  ] },
  { id: 'dr.fe4', when: { strong: true }, turns: [
    { beat: '{a} kicks over the log {b} is sitting on. {b} ends up in the dirt.' },
    { by: 'b', say: "WHAT is your problem?!" },
    { by: 'a', say: "You are!" },
    { by: 'b', conf: "{a} is scary when {a} is mad. And {a} is always mad." },
  ] },
  { id: 'dr.fe5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Say that one more time. I dare you." },
    { by: 'b', say: "I said, could you pass the rice." },
    { by: 'a', say: "IN THAT TONE?" },
    { by: 'b', conf: "There was no tone. There was rice." },
  ] },
  { id: 'dr.fe6', turns: [
    { beat: '{a} explodes at {b} out of nowhere. The rest of camp backs away from the fire.' },
    { by: 'b', say: "Whoa, whoa. Where is this coming from?" },
    { by: 'a', say: "From EVERYTHING you've done since day one!" },
    { by: 'b', conf: "I don't even know what I did. I don't think {a} knows either." },
  ] },
];
const FIGHT_SNAP = [
  { id: 'dr.fs1', turns: [
    { by: 'b', say: "You're doing it wrong. Let me show you." },
    { by: 'a', say: "Don't. Touch it." },
    { by: 'b', say: "I'm just trying to help." },
    { by: 'a', say: "Then help somewhere else." },
    { by: 'b', conf: "Okay. Noted. {a} has a fuse about an inch long." },
  ] },
  { id: 'dr.fs2', turns: [
    { by: 'a', say: "Could you not? For once in your life, could you not?" },
    { by: 'b', say: "Not what?" },
    { by: 'a', say: "Talk! Just stop talking!" },
    { beat: 'The camp goes very quiet.' },
    { by: 'a', conf: "I'm not apologising. Somebody had to say it." },
  ] },
  { id: 'dr.fs3', turns: [
    { by: 'b', say: "You've been in a mood all day." },
    { by: 'a', say: "Gee, I wonder why. Maybe because SOMEBODY ate my share of the fish." },
    { by: 'b', say: "That was an accident!" },
    { by: 'a', say: "Accidents don't chew!" },
  ] },
  { id: 'dr.fs4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You know what your problem is? You think you're smarter than everyone here." },
    { by: 'b', say: "And you don't?" },
    { by: 'a', say: "I KNOW I am. That's different." },
    { by: 'b', conf: "{a} snapped, and for one second the mask came off. I saw it." },
  ] },
  { id: 'dr.fs5', turns: [
    { by: 'b', say: "Hey, relax, it's just a game." },
    { by: 'a', say: "Don't tell me to relax." },
    { by: 'b', say: "I'm just saying—" },
    { by: 'a', say: "And don't just say!" },
    { by: 'b', conf: "Never tell {a} to relax. I'm writing that down for everybody." },
  ] },
  { id: 'dr.fs6', when: { gap: 'older' }, turns: [
    { by: 'b', say: "Okay, boomer." },
    { by: 'a', say: "Excuse me? What did you just call me?" },
    { by: 'b', say: "It's a joke." },
    { by: 'a', say: "It's disrespectful, is what it is." },
    { by: 'a', conf: "I've got socks older than {b}. I don't need lip from {b.obj}." },
  ] },
  { id: 'dr.fs7', when: { gap: 'younger' }, turns: [
    { by: 'b', say: "When you're a bit older, you'll understand." },
    { by: 'a', say: "Don't do that. Don't talk down to me." },
    { by: 'b', say: "I wasn't—" },
    { by: 'a', say: "You were. You always do." },
    { by: 'b', conf: "{a} has a chip on {a.posAdj} shoulder about age. I just found it." },
  ] },
];
const FIGHT_TENSE = [
  { id: 'dr.ft1', turns: [
    { by: 'a', say: "I'm going to say this once, calmly." },
    { by: 'b', say: "Here we go." },
    { by: 'a', say: "Stop going behind my back." },
    { by: 'b', say: "I'm not. And I don't like the accusation." },
    { by: 'a', conf: "Neither of us raised our voices. That made it worse." },
  ] },
  { id: 'dr.ft2', turns: [
    { beat: '{a} and {b} keep their voices low, but their jaws are tight.' },
    { by: 'b', say: "I don't appreciate how you talked to me earlier." },
    { by: 'a', say: "And I don't appreciate you acting like you're in charge." },
    { by: 'b', say: "Then I guess we're even." },
    { by: 'b', conf: "We smiled the whole time. Anyone watching from far away would think we were friends." },
  ] },
  { id: 'dr.ft3', turns: [
    { by: 'a', say: "Can I give you some advice?" },
    { by: 'b', say: "Is it actually advice?" },
    { by: 'a', say: "Stop interrupting me in front of everybody." },
    { by: 'b', say: "Stop saying things worth interrupting." },
    { by: 'a', conf: "Controlled. Barely. If {b} had said one more word, I don't know." },
  ] },
  { id: 'dr.ft4', when: { register: 'cool' }, turns: [
    { by: 'a', say: "You're frustrated. I get it. But don't take it out on me." },
    { by: 'b', say: "I'm not frustrated." },
    { by: 'a', say: "You threw a stick at the fire." },
    { by: 'b', say: "The fire deserved it." },
  ] },
  { id: 'dr.ft5', turns: [
    { by: 'b', say: "Why do you always have to be right?" },
    { by: 'a', say: "Why do you always have to be wrong?" },
    { beat: 'They stare at each other. Somebody else quietly takes over the cooking.' },
    { by: 'b', conf: "It didn't blow up. It's just sitting there now. Waiting." },
  ] },
  { id: 'dr.ft6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'm trying really hard to be nice to you right now." },
    { by: 'b', say: "You could try a little harder." },
    { by: 'a', say: "This IS harder!" },
    { by: 'a', conf: "I don't fight with people. {b} is making me learn how." },
  ] },
];
const FIGHT_RARE = [
  { id: 'dr.fr1', turns: [
    { by: 'a', say: "No. Actually, no. I'm not okay with that." },
    { beat: 'The camp turns to stare. {a} never pushes back on anything.' },
    { by: 'b', say: "Okay, wow. Where did that come from?" },
    { by: 'a', say: "From the last eight times I let it go." },
    { by: 'b', conf: "When {a} finally snaps, you know it's bad." },
  ] },
  { id: 'dr.fr2', turns: [
    { by: 'a', say: "I don't usually say anything. Today I'm saying something." },
    { by: 'b', say: "Go ahead." },
    { by: 'a', say: "You've been treating everyone here like they work for you." },
    { by: 'b', conf: "{a} has been quiet for weeks. That's why it hit so hard." },
  ] },
  { id: 'dr.fr3', when: { calm: true }, turns: [
    { beat: "{a}, the calmest person in camp, sets down {a.posAdj} bowl very carefully." },
    { by: 'a', say: "Please stop." },
    { by: 'b', say: "Stop what?" },
    { by: 'a', say: "All of it. I'm asking nicely. I won't ask nicely again." },
    { by: 'b', conf: "Never heard {a} talk like that. I stopped. Immediately." },
  ] },
  { id: 'dr.fr4', turns: [
    { by: 'b', say: "Since when do you get mad?" },
    { by: 'a', say: "Since you started taking credit for my work." },
    { by: 'b', say: "That's not fair." },
    { by: 'a', say: "No. It isn't." },
    { by: 'a', conf: "I hate fighting. I hate being walked on more." },
  ] },
  { id: 'dr.fr5', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Hey. That was mean. What you said." },
    { by: 'b', say: "Oh, come on, it was a joke." },
    { by: 'a', say: "It wasn't funny." },
    { by: 'a', conf: "My hands were shaking the whole time. But I said it." },
  ] },
  { id: 'dr.fr6', turns: [
    { by: 'a', say: "I've been patient. I've been so patient." },
    { by: 'b', say: "And?" },
    { by: 'a', say: "And I'm done being patient with you." },
    { by: 'b', conf: "Even {a} has a limit. Turns out I found it." },
  ] },
];

// ── disputes about the game ───────────────────────────────────────────
const DISPUTE_CALLOUT = [
  { id: 'dr.dc1', turns: [
    { by: 'a', say: "Let's just say it out loud, since everybody's thinking it. {b} is playing everybody." },
    { by: 'b', say: "Excuse me?" },
    { by: 'a', say: "You heard me. In front of everyone, so you can't twist it later." },
    { by: 'b', conf: "{a} just blew up the whole camp to get to me. That's not strategy. That's a tantrum with a plan." },
  ] },
  { id: 'dr.dc2', turns: [
    { by: 'a', say: "I know what you've been saying about me." },
    { by: 'b', say: "I haven't said anything about you." },
    { by: 'a', say: "Then why does everybody keep repeating it?" },
    { by: 'a', conf: "I don't do whispers. If I've got a problem, everybody gets to hear it." },
  ] },
  { id: 'dr.dc3', turns: [
    { beat: '{a} stands up in the middle of lunch and points at {b}.' },
    { by: 'a', say: "This one's been lying to all of you." },
    { by: 'b', say: "Sit down." },
    { by: 'a', say: "Make me." },
    { by: 'b', conf: "Nobody saw that coming. Including me. Especially me." },
  ] },
  { id: 'dr.dc4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You want to play games? Fine. Let's play. Right here, right now." },
    { by: 'b', say: "Nobody's playing games." },
    { by: 'a', say: "Then why'd my name come up yesterday?!" },
    { by: 'b', conf: "{a} has no indoor voice and no outdoor filter." },
  ] },
  { id: 'dr.dc5', turns: [
    { by: 'a', say: "You've had it out for me since day one and I'm sick of pretending you haven't." },
    { by: 'b', say: "Wow. Okay. Any proof?" },
    { by: 'a', say: "The way you're looking at me right now." },
    { by: 'b', conf: "That's not proof. That's my face." },
  ] },
  { id: 'dr.dc6', when: { sly: true }, turns: [
    { by: 'a', say: "I'm going to save everyone some time. {b} has a target. It's me. And {b} has been lying about it." },
    { by: 'b', say: "That is not true." },
    { by: 'a', say: "Then who is it?" },
    { beat: '{b} opens {b.posAdj} mouth. Closes it.' },
    { by: 'a', conf: "Silence is an answer. Everybody heard it." },
  ] },
];
const DISPUTE_PRESS = [
  { id: 'dr.dp1', turns: [
    { by: 'a', say: "Who are you actually voting for? Not the answer you give everyone. The real one." },
    { by: 'b', say: "I haven't decided." },
    { by: 'a', say: "You always say that. You always have decided." },
    { by: 'b', conf: "{a} pushes and pushes. I'm not telling {a.obj} anything." },
  ] },
  { id: 'dr.dp2', turns: [
    { beat: '{a} pulls {b} away from the others.' },
    { by: 'a', say: "Your read on the game is wrong. Completely wrong." },
    { by: 'b', say: "Thanks for the vote of confidence." },
    { by: 'a', say: "I'm trying to save you from yourself." },
    { by: 'b', conf: "We walked off in different directions. Different plans, too." },
  ] },
  { id: 'dr.dp3', turns: [
    { by: 'a', say: "Answer me one thing. Straight. Are we still good?" },
    { by: 'b', say: "Of course we're good." },
    { by: 'a', say: "You said 'of course' way too fast." },
    { by: 'a', conf: "I asked one question. Got the wrong answer the right way." },
  ] },
  { id: 'dr.dp4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'll ask once. If I find out you lied, I'll know." },
    { by: 'b', say: "Is that a threat?" },
    { by: 'a', say: "It's information." },
    { by: 'b', conf: "{a} talks like a movie villain. The bad part is, it kind of works." },
  ] },
  { id: 'dr.dp5', turns: [
    { by: 'b', say: "Why are you grilling me?" },
    { by: 'a', say: "Because your name is the one I keep hearing." },
    { by: 'b', say: "Hearing from who?" },
    { by: 'a', say: "Nice try." },
    { by: 'b', conf: "{a} is fishing. I'm not biting. I'm also a little scared." },
  ] },
  { id: 'dr.dp6', turns: [
    { by: 'a', say: "You keep deflecting." },
    { by: 'b', say: "I keep answering. You just don't like the answers." },
    { by: 'a', say: "Then give me a better one." },
    { by: 'a', conf: "{b} has a plan that doesn't include me. I can feel it." },
  ] },
];
const DISPUTE_PRECISE = [
  { id: 'dr.dq1', turns: [
    { by: 'a', say: "Walk me through your plan. Step by step." },
    { by: 'b', say: "Okay. We take out the strongest player." },
    { by: 'a', say: "And then?" },
    { by: 'b', say: "And then... we see." },
    { by: 'a', conf: "{b} doesn't have a plan. {b} has a wish. I just made everybody see it." },
  ] },
  { id: 'dr.dq2', turns: [
    { by: 'a', say: "Your idea has one problem." },
    { by: 'b', say: "Which is?" },
    { by: 'a', say: "It needs four votes and you have two." },
    { by: 'b', conf: "{a} didn't raise {a.posAdj} voice once. Somehow I still lost." },
  ] },
  { id: 'dr.dq3', turns: [
    { by: 'b', say: "You're overthinking it." },
    { by: 'a', say: "You're underthinking it." },
    { by: 'b', say: "Is that even a word?" },
    { by: 'a', say: "It is now, and it's about you." },
  ] },
  { id: 'dr.dq4', when: { register: 'cool' }, turns: [
    { by: 'a', say: "I want to understand your logic. Genuinely." },
    { beat: '{b} explains. {a} nods slowly. Then asks one question that takes the whole thing apart.' },
    { by: 'b', conf: "One question. That's all it took. I hate that." },
  ] },
  { id: 'dr.dq5', turns: [
    { by: 'a', say: "Let's think about who that vote actually helps." },
    { by: 'b', say: "Us." },
    { by: 'a', say: "No. It helps the other side. You just haven't counted." },
    { by: 'a', conf: "Calm voice. Big knife. That's how you win an argument out here." },
  ] },
  { id: 'dr.dq6', when: { brainy: true }, turns: [
    { by: 'a', say: "You've made three assumptions and two of them are wrong." },
    { by: 'b', say: "Which two?" },
    { by: 'a', say: "Do you want me to list them, or do you want to keep your dignity?" },
    { by: 'b', conf: "I asked for the list. I should not have asked for the list." },
  ] },
];
const DISPUTE_PLAIN = [
  { id: 'dr.dl1', turns: [
    { by: 'a', say: "I'm not voting the way you want me to." },
    { by: 'b', say: "Since when?" },
    { by: 'a', say: "Since right now." },
    { by: 'b', conf: "First real crack between us. I felt it." },
  ] },
  { id: 'dr.dl2', turns: [
    { by: 'b', say: "I heard my name. Where'd that come from?" },
    { by: 'a', say: "Not from me." },
    { by: 'b', say: "That's what everybody says." },
    { by: 'a', say: "And sometimes it's true." },
    { by: 'b', conf: "{a} looked me in the eye and said no. I don't believe {a.obj}." },
  ] },
  { id: 'dr.dl3', turns: [
    { by: 'a', say: "Who's actually calling the shots here? You or me?" },
    { by: 'b', say: "Nobody's calling shots." },
    { by: 'a', say: "Then stop acting like you are." },
    { by: 'a', conf: "It was a quiet fight. But it was a fight." },
  ] },
  { id: 'dr.dl4', turns: [
    { by: 'b', say: "We said we'd go after the same person." },
    { by: 'a', say: "Things change." },
    { by: 'b', say: "Things or you?" },
    { by: 'b', conf: "If {a} is flipping, I need to know before I'm the one who gets flipped on." },
  ] },
  { id: 'dr.dl5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I don't want to fight about this." },
    { by: 'b', say: "Then just agree with me." },
    { by: 'a', say: "I can't. I think you're wrong." },
    { by: 'a', conf: "Saying no to {b} was the hardest thing I've done all game." },
  ] },
  { id: 'dr.dl6', turns: [
    { by: 'a', say: "I'm not your sidekick." },
    { by: 'b', say: "Nobody said you were." },
    { by: 'a', say: "You treat me like one." },
    { by: 'b', conf: "Everything was fine until it wasn't. Now it really isn't." },
  ] },
];

// ── power clash, food, intimidation, pranks, bragging, digs ───────────
const CLASH = [
  { id: 'dr.cl1', turns: [
    { by: 'a', say: "Okay, everybody. Firewood first, then water, then food." },
    { by: 'b', say: "No. Water first. Obviously water first." },
    { by: 'a', say: "Firewood. We need fire to boil the water." },
    { by: 'b', say: "We need water to boil, genius!" },
    { beat: 'The rest of the camp quietly goes and does nothing at all.' },
  ] },
  { id: 'dr.cl2', turns: [
    { by: 'b', say: "Who put you in charge?" },
    { by: 'a', say: "Nobody. Somebody had to be." },
    { by: 'b', say: "Then why not me?" },
    { by: 'a', say: "Because I got up first." },
    { by: 'b', conf: "Two people trying to lead one camp. Zero people actually working." },
  ] },
  { id: 'dr.cl3', turns: [
    { by: 'a', say: "You take the left side, you take the right side—" },
    { by: 'b', say: "Actually, scratch that. Everybody with me." },
    { by: 'a', say: "Excuse me, I was talking." },
    { by: 'b', say: "And now I am." },
    { by: 'a', conf: "{b} can't stand anyone else being in charge. Funny. Neither can I." },
  ] },
  { id: 'dr.cl4', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "I led us to a win last time. I'm leading again." },
    { by: 'b', say: "You led us to one win and three losses." },
    { by: 'a', say: "The win was the important one." },
    { by: 'b', conf: "{a} remembers every win and none of the losses. Must be nice." },
  ] },
  { id: 'dr.cl5', turns: [
    { by: 'a', say: "Can we agree on a plan for once?" },
    { by: 'b', say: "Sure. Mine." },
    { by: 'a', say: "That's not agreeing, that's winning." },
    { by: 'b', say: "Same thing." },
    { by: 'a', conf: "By noon nothing was done and both of us were furious. Great day." },
  ] },
  { id: 'dr.cl6', when: { age: 'older' }, turns: [
    { by: 'a', say: "I've managed teams of fifty people. I think I can handle a fire." },
    { by: 'b', say: "This isn't an office." },
    { by: 'a', say: "Clearly. An office would have a plan." },
    { by: 'b', conf: "{a} keeps bringing up real-world experience. Out here we're all just hungry." },
  ] },
  { id: 'dr.cl7', turns: [
    { beat: '{a} hands out jobs. {b} walks behind {a} and hands out different jobs.' },
    { by: 'a', say: "Stop reassigning my jobs!" },
    { by: 'b', say: "Stop assigning bad jobs!" },
    { by: 'b', conf: "Nobody did either job. Everybody just watched us argue." },
  ] },
];
const FOOD = [
  { id: 'dr.fo1', turns: [
    { beat: '{a} scrapes the last of the rice into {a.posAdj} bowl. {b} watches the whole thing.' },
    { by: 'b', say: "Hungry?" },
    { by: 'a', say: "Starving. Why?" },
    { by: 'b', say: "No reason. Some of us haven't eaten yet. No reason." },
    { by: 'b', conf: "I counted every bite. I'll remember every bite." },
  ] },
  { id: 'dr.fo2', turns: [
    { by: 'b', say: "Were you cooking extra rice? At night? While everyone was asleep?" },
    { by: 'a', say: "It was a snack." },
    { by: 'b', say: "It was half the rice!" },
    { by: 'a', say: "A big snack." },
    { by: 'b', conf: "We're all starving and {a} is having midnight snacks. Unbelievable." },
  ] },
  { id: 'dr.fo3', turns: [
    { by: 'a', say: "Is there more?" },
    { by: 'b', say: "You've had two portions." },
    { by: 'a', say: "I'm a growing person." },
    { by: 'b', say: "Grow less." },
  ] },
  { id: 'dr.fo4', when: { strong: true }, turns: [
    { by: 'a', say: "I need more food. I'm the one carrying everything in challenges." },
    { by: 'b', say: "We're all doing the challenges." },
    { by: 'a', say: "Not like I am." },
    { by: 'b', conf: "{a} thinks muscles come with a bigger portion. They don't." },
  ] },
  { id: 'dr.fo5', turns: [
    { by: 'a', say: "Let's ration. Small portions. Everybody." },
    { beat: 'That night, {b} catches {a} eating straight out of the pot.' },
    { by: 'b', say: "How's the rationing going?" },
    { by: 'a', say: "This is a different thing." },
    { by: 'b', conf: "Rationing for thee, not for {a}." },
  ] },
  { id: 'dr.fo6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Oh no. Did I take too much? I'm so sorry." },
    { by: 'b', say: "You did take too much." },
    { by: 'a', say: "Here, you can have some of mine." },
    { by: 'b', say: "You already ate yours." },
    { by: 'b', conf: "{a} is sweet. {a} is also eating for three." },
  ] },
  { id: 'dr.fo7', turns: [
    { beat: "The coconuts are missing. {b} finds the shells behind {a}'s bag." },
    { by: 'b', say: "Funny. These look familiar." },
    { by: 'a', say: "The wind must have blown them there." },
    { by: 'b', conf: "The wind ate four coconuts. Sure." },
  ] },
];
const INTIMIDATE_PHYSICAL = [
  { id: 'dr.ip1', turns: [
    { beat: "{a} picks up the log {b} couldn't move yesterday, carries it across camp, and drops it right at {b}'s feet." },
    { by: 'a', say: "There you go." },
    { by: 'b', conf: "{a} didn't say anything mean. {a} didn't have to." },
  ] },
  { id: 'dr.ip2', turns: [
    { beat: '{a} and {b} meet on the narrow path to the water. {a} does not move.' },
    { by: 'b', say: "Excuse me." },
    { by: 'a', say: "Sure." },
    { beat: '{a} still does not move. {b} squeezes past.' },
    { by: 'b', conf: "Message received." },
  ] },
  { id: 'dr.ip3', turns: [
    { by: 'a', say: "Arm wrestle? Loser fetches the water for a week." },
    { by: 'b', say: "That's a lot of water." },
    { by: 'a', say: "Then don't lose." },
    { beat: 'It takes {a} about two seconds.' },
    { by: 'b', conf: "My arm still hurts. My pride hurts worse." },
  ] },
  { id: 'dr.ip4', when: { arch: 'challenge-beast' }, turns: [
    { beat: '{a} does pull-ups on a branch right next to where {b} is trying to relax.' },
    { by: 'a', say: "Forty-nine. Fifty. Want a turn?" },
    { by: 'b', say: "I'm good." },
    { by: 'b', conf: "I don't know if {a} is training or sending a message. I think both." },
  ] },
  { id: 'dr.ip5', turns: [
    { by: 'a', say: "You're on my side in the next challenge, right?" },
    { by: 'b', say: "Sure." },
    { by: 'a', say: "Good. I'd hate to have to run you over." },
    { by: 'b', conf: "{a} said it with a smile. I'm not smiling." },
  ] },
  { id: 'dr.ip6', turns: [
    { beat: '{a} cracks a coconut open with one hand and hands half to {b}.' },
    { by: 'a', say: "Hungry?" },
    { by: 'b', say: "Not anymore." },
    { by: 'b', conf: "That was a coconut. It could've been my head. That's what I was thinking." },
  ] },
];
const INTIMIDATE_PRESENCE = [
  { id: 'dr.is1', turns: [
    { beat: '{a} has been watching {b} all day. Every time {b} looks up, {a} is looking back.' },
    { by: 'b', say: "Can I help you?" },
    { by: 'a', say: "Nope. Just thinking." },
    { by: 'b', conf: "Thinking about what? About me? Why about me?" },
  ] },
  { id: 'dr.is2', turns: [
    { by: 'a', say: "Bet you can't name everyone who voted for you last time." },
    { by: 'b', say: "Can you?" },
    { by: 'a', say: "Every single one." },
    { by: 'b', conf: "{a} knows more than {a} should. That scares me more than any muscle could." },
  ] },
  { id: 'dr.is3', turns: [
    { beat: "During a group talk, {a} stares at {b} and doesn't stop. {b} looks away first." },
    { by: 'a', conf: "First one to look away loses. {b} always looks away." },
  ] },
  { id: 'dr.is4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Funny, isn't it? How quickly things change out here." },
    { by: 'b', say: "What's that supposed to mean?" },
    { by: 'a', say: "Nothing. Just funny." },
    { by: 'b', conf: "It wasn't a threat. It was worse than a threat." },
  ] },
  { id: 'dr.is5', turns: [
    { by: 'a', say: "Small bet. I'll be here longer than you." },
    { by: 'b', say: "What do I get if I win?" },
    { by: 'a', say: "You won't." },
    { by: 'b', conf: "I didn't take the bet. Maybe I should have. I was too nervous." },
  ] },
  { id: 'dr.is6', when: { sharp: true }, turns: [
    { by: 'a', say: "You do this thing with your hands when you lie. Did you know that?" },
    { beat: '{b} stops moving {b.posAdj} hands.' },
    { by: 'a', say: "Yeah. That thing." },
    { by: 'b', conf: "Now I don't know what to do with my hands. Ever." },
  ] },
];
const PRANK_WELL = [
  { id: 'dr.pw1', turns: [
    { beat: "{b} reaches into {b.posAdj} bag and pulls out a crab. A live one." },
    { by: 'b', say: "{a}!" },
    { by: 'a', say: "Gotcha!" },
    { beat: '{b} chases {a} around the fire, laughing. The whole camp joins in.' },
    { by: 'b', conf: "Okay, it was good. I'm getting {a} back. But it was good." },
  ] },
  { id: 'dr.pw2', turns: [
    { beat: "{a} sets up a bucket of water over {b}'s sleeping spot. {b} walks right into it." },
    { by: 'b', say: "Oh, you're DEAD." },
    { by: 'a', say: "You should see your face!" },
    { by: 'b', conf: "Full prank war. Starting now. {a} has no idea what's coming." },
  ] },
  { id: 'dr.pw3', turns: [
    { by: 'a', say: "Hey, {b}, the host said the challenge is cancelled and we get pizza." },
    { by: 'b', say: "Really?!" },
    { by: 'a', say: "No." },
    { beat: '{b} throws a shoe. Everybody laughs, including {b}.' },
  ] },
  { id: 'dr.pw4', when: { register: 'fiery' }, turns: [
    { beat: "{a} hides all of {b}'s shoes in a tree." },
    { by: 'b', say: "Where are my shoes?!" },
    { by: 'a', say: "Look up." },
    { by: 'b', say: "How did you even— okay. Okay, that's funny." },
  ] },
  { id: 'dr.pw5', turns: [
    { beat: "{a} draws a moustache on {b} while {b} naps. {b} wears it all day without knowing." },
    { by: 'b', say: "Why does everybody keep smiling at me?" },
    { by: 'a', say: "You just look really good today." },
    { by: 'b', conf: "I found out at dinner. I kept the moustache. It's grown on me." },
  ] },
  { id: 'dr.pw6', turns: [
    { by: 'a', say: "Truce?" },
    { by: 'b', say: "Never." },
    { beat: "{a} and {b} spend the whole afternoon in a prank war. The camp watches like it's a sport." },
    { by: 'a', conf: "We're not even playing the game today. We're playing a better game." },
  ] },
];
const PRANK_BADLY = [
  { id: 'dr.pb1', turns: [
    { beat: "{a} hides {b}'s bag as a joke. {b} spends an hour looking for it, getting more and more upset." },
    { by: 'a', say: "Relax, it was a joke!" },
    { by: 'b', say: "It's not funny. Everything I have is in there." },
    { by: 'a', conf: "I thought it'd be funny. It was not funny." },
  ] },
  { id: 'dr.pb2', turns: [
    { beat: '{a} jumps out from behind a tree. {b} screams, falls, and lands hard.' },
    { by: 'a', say: "Oh no. Are you okay?" },
    { by: 'b', say: "Do I LOOK okay?" },
    { by: 'b', conf: "{a} thought it was a joke. My knee doesn't think it's a joke." },
  ] },
  { id: 'dr.pb3', turns: [
    { by: 'a', say: "Come on, you have to admit that was a little funny." },
    { by: 'b', say: "I have to admit nothing." },
    { by: 'a', say: "Not even a little?" },
    { by: 'b', say: "Walk away." },
    { by: 'a', conf: "Right prank. Wrong person. Wrong day." },
  ] },
  { id: 'dr.pb4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "It was a harmless joke. Why are you being so sensitive?" },
    { by: 'b', say: "Because you did it in front of everyone." },
    { by: 'a', say: "That's what makes it funny." },
    { by: 'b', conf: "That wasn't a prank. That was a message. And I got it." },
  ] },
  { id: 'dr.pb5', turns: [
    { beat: "{a} puts sand in {b}'s water. {b} drinks it and chokes." },
    { by: 'b', say: "What is WRONG with you?" },
    { by: 'a', say: "It's just sand!" },
    { by: 'b', say: "It's my WATER!" },
    { by: 'b', conf: "Out here, water isn't a joke. {a} found that out the hard way." },
  ] },
  { id: 'dr.pb6', turns: [
    { by: 'a', say: "Okay, I'm sorry. It went too far." },
    { by: 'b', say: "Yeah. It did." },
    { by: 'a', conf: "I meant it as a joke. {b} took it personally. Now there's a thing between us." },
  ] },
];
const SHOWBOAT = [
  { id: 'dr.sb1', turns: [
    { by: 'a', say: "And THEN, right at the end, I just flew up that wall. Like, flew." },
    { by: 'b', say: "We know. We were there." },
    { by: 'a', say: "But did you SEE it?" },
    { by: 'b', say: "Three times now." },
    { by: 'b', conf: "If {a} tells that story one more time, I'm walking into the ocean." },
  ] },
  { id: 'dr.sb2', turns: [
    { by: 'a', say: "Honestly, if I was in charge, we'd be undefeated." },
    { by: 'b', say: "You'd be in charge of what?" },
    { by: 'a', say: "Everything. Obviously." },
    { by: 'b', conf: "{a} has a plan for everything. Mostly it's \"let {a} do it\"." },
  ] },
  { id: 'dr.sb3', turns: [
    { by: 'a', say: "Let me rate everybody's game. I give myself a nine." },
    { by: 'b', say: "And me?" },
    { by: 'a', say: "Solid four. Room to grow." },
    { by: 'b', conf: "I'm a four, apparently. A four with a vote. Let's see how that goes." },
  ] },
  { id: 'dr.sb4', when: { register: 'competitor' }, turns: [
    { beat: '{a} narrates {a.posAdj} own morning like a sports commentator.' },
    { by: 'a', say: "And {a} picks up the firewood. Incredible form. The crowd goes wild." },
    { by: 'b', say: "There is no crowd." },
    { by: 'a', say: "The crowd is in my heart." },
  ] },
  { id: 'dr.sb5', turns: [
    { by: 'a', say: "Not to brag, but I've basically got this game figured out." },
    { by: 'b', say: "That is bragging." },
    { by: 'a', say: "It's not bragging if it's true." },
    { by: 'b', conf: "Everyone smiled and nodded. Then everyone went and talked about {a} behind the trees." },
  ] },
  { id: 'dr.sb6', when: { age: 'teen' }, turns: [
    { by: 'a', say: "Honestly, I'm the youngest one here and I'm still winning. Kind of embarrassing for all of you." },
    { by: 'b', say: "Kind of embarrassing for you to say that." },
    { by: 'b', conf: "{a} has the confidence of someone who's never been voted out. Yet." },
  ] },
  { id: 'dr.sb7', when: { strong: true }, turns: [
    { beat: '{a} flexes in front of the camp, slowly, while explaining the last challenge.' },
    { by: 'a', say: "See this? This is why we won." },
    { by: 'b', say: "We lost." },
    { by: 'a', say: "This is why we almost won." },
  ] },
];
const DIG = [
  { id: 'dr.dg1', turns: [
    { by: 'a', say: "No, that's a great idea, {b}. Really. Super creative." },
    { beat: '{b} closes {b.posAdj} mouth. Somebody else stares at the ground.' },
    { by: 'b', conf: "{a} said great. {a} meant stupid. Everybody heard stupid." },
  ] },
  { id: 'dr.dg2', turns: [
    { by: 'a', say: "Do you want help with that? It's okay if you can't do it on your own." },
    { by: 'b', say: "I've got it." },
    { by: 'a', say: "Of course you do. Of course." },
    { by: 'b', conf: "It's not what {a} says. It's how {a} says it. Every single time." },
  ] },
  { id: 'dr.dg3', turns: [
    { by: 'a', say: "Remember three days ago, when you said you'd 'carry us'? How's that going?" },
    { by: 'b', say: "That was a joke." },
    { by: 'a', say: "Oh, was it? I couldn't tell. Nobody could tell." },
    { by: 'b', conf: "{a} saved that up for three days. Who does that?" },
  ] },
  { id: 'dr.dg4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I just think it's brave, how you don't care what people think of you." },
    { by: 'b', say: "Thanks?" },
    { by: 'a', conf: "I didn't mean it as a compliment. I said it in a way that sounded like one. That counts." },
  ] },
  { id: 'dr.dg5', turns: [
    { by: 'a', say: "Love that you're so relaxed about the challenges. Must be nice." },
    { by: 'b', say: "What's that supposed to mean?" },
    { by: 'a', say: "Nothing! Nothing at all." },
    { by: 'b', conf: "It meant something. It always means something with {a}." },
  ] },
  { id: 'dr.dg6', when: { gap: 'older' }, turns: [
    { by: 'a', say: "Oh, you're so sweet. You remind me of myself at your age. Before I knew anything." },
    { by: 'b', say: "Thanks. I think." },
    { by: 'b', conf: "I got insulted and complimented in one sentence. {a} is very efficient." },
  ] },
  { id: 'dr.dg7', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'm sure everyone trusts you completely, {b}. Totally." },
    { beat: 'A couple of people glance at {b}.' },
    { by: 'a', conf: "I didn't say anything bad. I just said it out loud. That was enough." },
  ] },
];
const JEALOUS = [
  { id: 'dr.jl1', turns: [
    { beat: 'Everyone crowds around {b} after the challenge. {a} claps along, slowly.' },
    { by: 'a', say: "Yay. Great job. Again." },
    { by: 'a', conf: "{b} wins again. Good for {b}. I'm thrilled. Can't you tell how thrilled I am?" },
  ] },
  { id: 'dr.jl2', turns: [
    { by: 'a', say: "Must be nice, winning every challenge." },
    { by: 'b', say: "It's not every challenge." },
    { by: 'a', say: "It feels like it." },
    { by: 'b', conf: "{a} isn't happy for me. {a} is counting." },
  ] },
  { id: 'dr.jl3', turns: [
    { by: 'a', say: "Just saying, if anyone's a threat in this camp, it's {b}. Everybody knows that." },
    { beat: '{a} says it a little too eagerly.' },
    { by: 'a', conf: "It's not jealousy. It's strategy. Okay, it's a little bit jealousy." },
  ] },
  { id: 'dr.jl4', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "You got lucky. That's all." },
    { by: 'b', say: "Twice?" },
    { by: 'a', say: "Very lucky." },
    { by: 'a', conf: "I trained harder than {b}. I KNOW I did. Then why does {b} keep winning?" },
  ] },
  { id: 'dr.jl5', turns: [
    { by: 'b', say: "Did you want to try the puzzle next time?" },
    { by: 'a', say: "Oh, no. You do it. You're the star." },
    { by: 'b', conf: "{a} said it like a compliment. It landed like a dirty look." },
  ] },
  { id: 'dr.jl6', when: { age: 'older' }, turns: [
    { by: 'a', conf: "{b} is half my age and winning everything. I used to be that person. I miss being that person." },
  ] },
];
const THAW_TALK = [
  { id: 'dr.tt1', turns: [
    { beat: '{a} and {b} end up alone at the water, away from camp. Neither leaves.' },
    { by: 'a', say: "So. We should probably stop circling each other." },
    { by: 'b', say: "Probably." },
    { by: 'a', say: "Want to talk? Not about the game." },
    { by: 'b', conf: "We talked for an hour. Nothing changed. Everything changed a little." },
  ] },
  { id: 'dr.tt2', turns: [
    { by: 'b', say: "I don't hate you, you know." },
    { by: 'a', say: "Could've fooled me." },
    { by: 'b', say: "I just don't trust you." },
    { by: 'a', say: "That's fair. I don't trust you either." },
    { by: 'a', conf: "First honest conversation we've ever had. It was weirdly nice." },
  ] },
  { id: 'dr.tt3', turns: [
    { by: 'a', say: "Truce? For one afternoon?" },
    { by: 'b', say: "What's in it for me?" },
    { by: 'a', say: "Somebody to talk to who isn't lying to you." },
    { by: 'b', conf: "I didn't expect {a} to say that. I didn't expect to believe it." },
  ] },
  { id: 'dr.tt4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You and I are the only ones out here actually playing. We might as well talk." },
    { by: 'b', say: "That's either a compliment or a trap." },
    { by: 'a', say: "Can't it be both?" },
    { by: 'b', conf: "I'll talk to {a}. I'll just count my fingers after." },
  ] },
  { id: 'dr.tt5', turns: [
    { by: 'b', say: "Why are we even fighting?" },
    { by: 'a', say: "I honestly don't remember anymore." },
    { by: 'b', say: "Me neither." },
    { by: 'a', conf: "Weeks of drama and neither of us knows why. Maybe it's time to stop." },
  ] },
  { id: 'dr.tt6', turns: [
    { by: 'a', say: "Can I say something without you biting my head off?" },
    { by: 'b', say: "Depends what it is." },
    { by: 'a', say: "You were good in that challenge." },
    { by: 'b', say: "...Thanks." },
    { by: 'b', conf: "We're not friends. But something loosened today." },
  ] },
];
const THAW_BLOWUP = [
  { id: 'dr.tb1', turns: [
    { by: 'a', say: "You are SO annoying!" },
    { by: 'b', say: "YOU are so annoying!" },
    { beat: 'They glare at each other. Then {b} snorts. Then {a} cracks up too.' },
    { by: 'a', say: "Why are we like this?" },
    { by: 'b', conf: "We yelled until we laughed. Not friends. But we reset something." },
  ] },
  { id: 'dr.tb2', turns: [
    { by: 'b', say: "Just say it. Whatever you've been wanting to say for days." },
    { by: 'a', say: "Fine! You drive me crazy!" },
    { by: 'b', say: "You drive ME crazy!" },
    { by: 'a', say: "Great! Glad we cleared that up!" },
    { by: 'a', conf: "Weirdly, I feel better. We both said it. Now it's out." },
  ] },
  { id: 'dr.tb3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You know what your problem is?!" },
    { by: 'b', say: "What?!" },
    { by: 'a', say: "You're exactly like me!" },
    { beat: 'Silence. Then both of them start laughing.' },
    { by: 'b', conf: "That's the worst thing anybody's ever said to me. It's also true." },
  ] },
  { id: 'dr.tb4', turns: [
    { by: 'a', say: "I'm done fighting with you." },
    { by: 'b', say: "You just started fighting with me again!" },
    { by: 'a', say: "And now I'm done! Officially!" },
    { by: 'b', conf: "We screamed our way into a truce. That's how we do things." },
  ] },
  { id: 'dr.tb5', turns: [
    { by: 'b', say: "Okay. Okay. I was wrong about the fire." },
    { by: 'a', say: "And I was wrong about the water." },
    { by: 'b', say: "And the rice?" },
    { by: 'a', say: "Don't push it." },
  ] },
  { id: 'dr.tb6', turns: [
    { beat: '{a} and {b} have their loudest fight yet. It ends with both of them sitting in the sand, exhausted.' },
    { by: 'b', say: "That felt good." },
    { by: 'a', say: "Weirdly, yeah." },
    { by: 'a', conf: "I think we needed to get it all out. Every last bit." },
  ] },
];
const THAW_SMALL = [
  { id: 'dr.ts1', turns: [
    { beat: "{b} hands {a} a cup of water without being asked. {a} looks at it for a second, then takes it." },
    { by: 'a', say: "Thanks." },
    { by: 'b', say: "Don't make it weird." },
    { by: 'a', conf: "One cup of water. I stopped treating {b} like an enemy. It's stupid how small it was." },
  ] },
  { id: 'dr.ts2', turns: [
    { by: 'b', say: "I fixed your bag strap. It was ripping." },
    { by: 'a', say: "You didn't have to do that." },
    { by: 'b', say: "I know." },
    { by: 'a', conf: "{b} did something decent. It doesn't fit the version of {b} I've been carrying around." },
  ] },
  { id: 'dr.ts3', turns: [
    { beat: '{a} and {b} eat dinner next to each other, in silence. It is not an angry silence.' },
    { by: 'b', conf: "We didn't talk. We didn't fight either. For us, that's progress." },
  ] },
  { id: 'dr.ts4', turns: [
    { by: 'a', say: "Hey. You were right. About the rain." },
    { by: 'b', say: "I usually am." },
    { by: 'a', say: "Don't ruin it." },
    { by: 'b', conf: "{a} admitted I was right. I want it in writing." },
  ] },
  { id: 'dr.ts5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I saved you the last piece of fish. As a peace offering." },
    { by: 'b', say: "Is it poisoned?" },
    { by: 'a', say: "Only a little." },
    { beat: '{b} laughs. Takes it.' },
  ] },
  { id: 'dr.ts6', turns: [
    { beat: "{a} catches {b} comforting someone who's having a bad day." },
    { by: 'a', conf: "I didn't think {b} had that in them. Maybe I've been wrong about {b.obj}. A little." },
  ] },
];
const TRUCE_PLAIN = [
  { id: 'dr.tp1', turns: [
    { by: 'a', say: "I was wrong. About what I said. I'm sorry." },
    { by: 'b', say: "Okay." },
    { by: 'a', say: "Okay?" },
    { by: 'b', say: "Okay. Thank you. I mean it." },
    { by: 'b', conf: "No excuses. No 'but'. Just sorry. I didn't know {a} could do that." },
  ] },
  { id: 'dr.tp2', turns: [
    { by: 'a', say: "Can we start over?" },
    { by: 'b', say: "From where?" },
    { by: 'a', say: "From before I was an idiot." },
    { by: 'b', say: "That's pretty far back." },
    { by: 'a', conf: "{b} laughed. That's a yes." },
  ] },
  { id: 'dr.tp3', when: { calm: true }, turns: [
    { by: 'a', say: "I don't want to keep fighting. It's exhausting, and it's not helping either of us." },
    { by: 'b', say: "Agreed." },
    { beat: 'They shake hands. It feels awkward and right at the same time.' },
  ] },
  { id: 'dr.tp4', turns: [
    { by: 'a', say: "I owe you an apology. A real one." },
    { by: 'b', say: "I'm listening." },
    { by: 'a', say: "I took it out on you. You didn't deserve that." },
    { by: 'b', conf: "{a} didn't make me ask for it. That's what got me." },
  ] },
  { id: 'dr.tp5', turns: [
    { by: 'b', say: "Are we good?" },
    { by: 'a', say: "We're good. I'm sorry I made it a thing." },
    { by: 'b', say: "I made it a thing too." },
    { by: 'a', conf: "Two stubborn people apologising at once. Rare. Very rare." },
  ] },
  { id: 'dr.tp6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I hate that we're fighting. Can we not be fighting?" },
    { by: 'b', say: "Yeah. I'd like that." },
    { beat: '{a} hugs {b}. {b} lets {a.obj}.' },
  ] },
];
const TRUCE_GESTURE = [
  { id: 'dr.tg1', turns: [
    { beat: "{a} leaves a cracked coconut by {b}'s spot. No note. No words." },
    { by: 'b', say: "Was this you?" },
    { by: 'a', say: "Maybe." },
    { by: 'b', conf: "{a} doesn't do sorry. That coconut was sorry." },
  ] },
  { id: 'dr.tg2', turns: [
    { by: 'a', say: "I'll take your water run today. And tomorrow." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "Because I was a jerk. And I'm bad at saying it." },
    { by: 'b', conf: "Two water runs. That's a lot of sorry, from {a}." },
  ] },
  { id: 'dr.tg3', turns: [
    { by: 'a', say: "Here. You can have the good spot by the fire." },
    { by: 'b', say: "Is this an apology?" },
    { by: 'a', say: "It's a spot by the fire." },
    { by: 'b', conf: "It was an apology." },
  ] },
  { id: 'dr.tg4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Look, I'm not good at this. You know I'm not good at this." },
    { by: 'b', say: "Good at what?" },
    { by: 'a', say: "Just— here. Take the fish. We're even." },
    { by: 'b', conf: "Peace treaty, signed in fish." },
  ] },
  { id: 'dr.tg5', turns: [
    { beat: "{a} quietly fixes the clothesline {b} knocked down yesterday." },
    { by: 'b', say: "You didn't have to fix that." },
    { by: 'a', say: "I know." },
    { by: 'b', conf: "I could've stayed mad. I didn't. {a} made it hard to." },
  ] },
  { id: 'dr.tg6', turns: [
    { by: 'a', say: "I told everyone you were right about the challenge." },
    { by: 'b', say: "You did?" },
    { by: 'a', say: "Don't let it go to your head." },
    { by: 'b', conf: "Admitting I was right in public? That's {a}'s version of a hug." },
  ] },
];
const TRUCE_SLOW = [
  { id: 'dr.tw1', turns: [
    { beat: '{a} walks over to {b}, stops, walks away, comes back.' },
    { by: 'a', say: "Hey. So. About before." },
    { by: 'b', say: "Yeah?" },
    { by: 'a', say: "I don't want it to be a thing anymore." },
    { by: 'b', conf: "It took {a} all day to say twelve words. They were good words." },
  ] },
  { id: 'dr.tw2', turns: [
    { by: 'a', say: "I'm not saying sorry." },
    { by: 'b', say: "Okay." },
    { by: 'a', say: "But I'm done fighting." },
    { by: 'b', say: "That's basically sorry." },
    { by: 'a', say: "It's basically not." },
  ] },
  { id: 'dr.tw3', turns: [
    { beat: '{a} and {b} end up alone by the fire. Nobody says anything for a long time.' },
    { by: 'b', say: "This is weird." },
    { by: 'a', say: "Yeah. Weird good or weird bad?" },
    { by: 'b', say: "Weird okay." },
    { by: 'b', conf: "Not friends. Not war. Something in between. I'll take it." },
  ] },
  { id: 'dr.tw4', when: { register: 'shy' }, turns: [
    { by: 'a', say: "I, um. I'm not mad anymore. Just so you know." },
    { by: 'b', say: "Oh. Me neither." },
    { by: 'a', say: "Okay. Good. Cool." },
    { by: 'a', conf: "I practised that for an hour. It came out in four seconds." },
  ] },
  { id: 'dr.tw5', turns: [
    { by: 'b', say: "Did you just say something nice to me?" },
    { by: 'a', say: "Don't make it a thing." },
    { by: 'b', say: "I'm making it a thing." },
    { by: 'a', conf: "The cold war's over. Nobody won. That's fine." },
  ] },
  { id: 'dr.tw6', turns: [
    { by: 'a', say: "We don't have to be friends. But we can stop this." },
    { by: 'b', say: "Deal." },
    { beat: 'The rest of camp exhales.' },
  ] },
];
const STIR_BOLD = [
  { id: 'dr.st1', turns: [
    { by: 'a', say: "Hey, {b}, did you hear what {c} said about you?" },
    { by: 'b', say: "No. What?" },
    { by: 'a', say: "I shouldn't say. Ask {c}." },
    { beat: '{b} marches over to {c}. {a} sits back and watches.' },
    { by: 'c', say: "I never said anything!" },
    { by: 'a', conf: "{c} didn't say anything. But {b} believes it now. That's all I need." },
  ] },
  { id: 'dr.st2', turns: [
    { by: 'a', say: "Funny how {c} always picks the best spot by the fire. Right, {b}?" },
    { by: 'b', say: "Yeah. Actually, yeah. Every night." },
    { by: 'c', say: "Are you two seriously ganging up on me about a spot?" },
    { by: 'a', conf: "Thirty seconds. That's all it took. Now {b} and {c} are at war and I'm eating dinner." },
  ] },
  { id: 'dr.st3', turns: [
    { by: 'a', say: "{c}, {b} thinks you're coasting." },
    { by: 'b', say: "I did not say that!" },
    { by: 'c', say: "Did you, though?" },
    { by: 'b', say: "I said maybe a little!" },
    { by: 'a', conf: "I didn't lie. I just rounded up." },
  ] },
  { id: 'dr.st4', when: { arch: 'chaos-agent' }, turns: [
    { by: 'a', say: "Okay, hypothetically, if {b} and {c} had to fight a bear, who'd throw who at the bear first?" },
    { by: 'b', say: "I'd throw {c}." },
    { by: 'c', say: "Wow. Okay. Noted." },
    { by: 'a', conf: "I wanted to see what would happen. Now I know. Fun." },
  ] },
  { id: 'dr.st5', turns: [
    { by: 'a', say: "I'm just surprised, {b}. I thought you and {c} were close." },
    { by: 'b', say: "We are close." },
    { by: 'a', say: "Huh. Then why'd {c} vote with the others?" },
    { by: 'c', say: "That's not what happened!" },
    { by: 'b', conf: "{c} says it's not true. But why would {a} make it up?" },
  ] },
  { id: 'dr.st6', turns: [
    { beat: '{a} drops a comment into the fire circle and leans back.' },
    { by: 'a', say: "Someone here's been eating extra rice. Not saying who." },
    { by: 'b', say: "{c}, you were up late." },
    { by: 'c', say: "Getting water!" },
    { by: 'a', conf: "I didn't name anybody. They did the rest themselves." },
  ] },
];
const STIR_SLY = [
  { id: 'dr.ss1', turns: [
    { by: 'a', say: "{b}, didn't you say {c} was a bit lazy yesterday? Or was that someone else?" },
    { by: 'b', say: "I... might have said that." },
    { by: 'c', say: "You said WHAT?" },
    { by: 'a', conf: "Oops. Did I say that out loud? I did. On purpose." },
  ] },
  { id: 'dr.ss2', turns: [
    { by: 'a', say: "Weird how {c} always goes quiet when {b} talks." },
    { by: 'c', say: "I don't!" },
    { by: 'b', say: "You kind of do." },
    { by: 'a', conf: "One little comment. Now {b} and {c} are watching each other all day." },
  ] },
  { id: 'dr.ss3', turns: [
    { by: 'a', say: "{b}, I'm sure {c} didn't mean it when {c} said you were the weak link." },
    { by: 'b', say: "{c} said WHAT?" },
    { by: 'c', say: "I never said that!" },
    { by: 'a', say: "Oh. Never mind, then." },
  ] },
  { id: 'dr.ss4', turns: [
    { by: 'a', say: "Has anyone noticed that {b} and {c} always disagree about everything?" },
    { by: 'b', say: "We don't always." },
    { by: 'c', say: "We do kind of always." },
    { by: 'b', say: "See, you're doing it now!" },
    { by: 'a', conf: "I just pointed it out. They're doing all the work." },
  ] },
  { id: 'dr.ss5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I trust you both. I just wish you trusted each other." },
    { by: 'b', say: "What's that supposed to mean?" },
    { by: 'c', say: "Yeah. Who doesn't trust who?" },
    { by: 'a', conf: "I didn't answer. I didn't need to." },
  ] },
  { id: 'dr.ss6', turns: [
    { beat: '{a} mentions something {c} said, without context, right as {b} walks by.' },
    { by: 'b', say: "Wait, {c} said that?" },
    { by: 'c', say: "Out of context!" },
    { by: 'a', conf: "Context is overrated. Out here, nobody checks." },
  ] },
];

export default {
  'drama.bomb.arrogant': BOMB_ARROGANT, 'drama.bomb.hothead': BOMB_HOTHEAD,
  'drama.read.arrogant': READ_ARROGANT, 'drama.read.hothead': READ_HOTHEAD,
  'drama.fight.erupt': FIGHT_ERUPT, 'drama.fight.snap': FIGHT_SNAP, 'drama.fight.tense': FIGHT_TENSE, 'drama.fight.rare': FIGHT_RARE,
  'drama.dispute.callout': DISPUTE_CALLOUT, 'drama.dispute.press': DISPUTE_PRESS, 'drama.dispute.precise': DISPUTE_PRECISE, 'drama.dispute.plain': DISPUTE_PLAIN,
  'drama.clash.any': CLASH, 'drama.food.any': FOOD,
  'drama.intimidate.physical': INTIMIDATE_PHYSICAL, 'drama.intimidate.presence': INTIMIDATE_PRESENCE,
  'drama.prank.well': PRANK_WELL, 'drama.prank.badly': PRANK_BADLY,
  'drama.showboat.any': SHOWBOAT, 'drama.dig.any': DIG, 'drama.jealous.any': JEALOUS,
  'drama.thaw.talk': THAW_TALK, 'drama.thaw.blowup': THAW_BLOWUP, 'drama.thaw.small': THAW_SMALL,
  'drama.truce.plain': TRUCE_PLAIN, 'drama.truce.gesture': TRUCE_GESTURE, 'drama.truce.slow': TRUCE_SLOW,
  'drama.stir.bold': STIR_BOLD, 'drama.stir.sly': STIR_SLY,
};
