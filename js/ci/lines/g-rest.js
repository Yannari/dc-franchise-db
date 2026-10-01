// Photo, team, gift, rival and flirt games, beat by beat (Plan 3a+). Data only.
// photo: `choose` — a picks from the private albums; `round` — a posts, b
// reacts; `tag` — a gives b's photo a hashtag (warm: a likes b); `winner`.
// team: `captains` — a and b are named captains (fresh: they arrived today);
// `scout.*` — a reads b's profile and wants b or not; `pick` — a's first pick
// b; `picks` — a picks b later on; `last` — a picked last by b; `question.*`
// — a answers {q} with {x} for captain b, the score is {n}; `result` — a's
// team beat b's, {n}. gift: `choose` — a picks b; `round` — a's gift to b is
// revealed; `thanks` — a thanks b; `noticed` — a notices b and c picked each
// other; `none` — nobody picked a. rival: `round` — a names b; `reply` — b's
// thoughts on it, aloud later (a is the one named, b the namer); `react` — a,
// named by {n}; `observe` — a on b. flirt: `round` — a's line to b; `answer` —
// a's line back to b; `react` — a watches b and c; `vote` — a picks b; `date`.
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const s1 = (a, beat) => ({ turns: [{ by: 'a', say: a }], ...(beat ? { beat } : {}) });
const r1 = (a, beat) => ({ turns: [{ by: 'a', react: a }], ...(beat ? { beat } : {}) });
const ab = (a, b, beat) => ({ turns: [{ by: 'a', react: a }, { by: 'b', react: b }], ...(beat ? { beat } : {}) });

export const G_REST = {
  // ── photo ─────────────────────────────────────────────────────────────
  ...E('game.photo.choose', [
    s1("Circle, take me to my private albums. Not that one. Not that one. That one.", '{a} scrolls through the album three times.'),
    s1("I need the one that says 'fun' but not 'too much.'"),
    s1("This photo. It's the one. My mom hates this photo. I love it."),
    s1("Pick the photo people will remember. Okay. This one."),
  ]),
  ...E('game.photo.tag', [
    { turns: [{ by: 'a', react: "Okay, {b}'s photo. Hashtag…", send: "{t:MainCharacterEnergy} {e:fire}" }] },
    { turns: [{ by: 'a', react: "What do I give {b}?", send: "{t:Iconic} {e:clap}" }] },
    { turns: [{ by: 'a', send: "{t:WhoIsThis} lol {e:eyes}" }] },
    { when: { warm: true }, turns: [{ by: 'a', react: "Aw, {b}!", send: "{t:BestieVibes} {e:heart}" }] },
    { when: { warm: false }, turns: [{ by: 'a', react: "Hm. {b}.", send: "{t:TryingTooHard} {e:side}" }] },
    { turns: [{ by: 'a', send: "{t:GoalsHonestly} {e:hearteyes}" }] },
  ]),
  ...E('game.photo.winner', [
    ab("The most likes? My photo? Stop it.", "Of course {a} won. Look at that photo."),
    ab("{n} likes! People love me. Or the photo. Either way.", "{a} deserved that, honestly."),
    ab("Top of the Newsfeed. I'm framing this moment.", "Okay, {a}. We see you."),
  ]),
  // Hashtag This (1×05): the room hashtags your photo.
  ...E('g.hashtag-this.choose', [
    s1("The room gives it a hashtag. So I need a photo that gets a good one."),
    s1("If they give me a mean hashtag, I'll know exactly who it was."),
  ]),
  ...E('g.hashtag-this.tag', [
    { turns: [{ by: 'a', react: "{b} in a hoodie with a dog.", send: "{t:SmarterThanYourBoyfriend} {e:laugh}" }] },
    { turns: [{ by: 'a', send: "{t:WantYourBadBromance} {e:hearteyes}" }] },
  ]),
  // Two Faced (2×05): a naughty photo and a nice photo.
  ...E('g.two-faced.choose', [
    s1("A naughty one and a nice one. The nice one is easy. The naughty one…"),
    s1("Do I go naughty-naughty or cute-naughty? Cute-naughty. We're still early."),
  ]),
  ...E('g.two-faced.round', [
    { turns: [{ by: 'a', post: "Nice {e:halo} vs naughty {e:devil} {t:TwoFaced}" }, { by: 'b', react: "Okay, the naughty one. The naughty one, {a}!" }] },
    { turns: [{ by: 'a', say: "Show them both sides.", post: "Angel by day {e:halo} {t:TwoFaced}" }, { by: 'b', react: "Which one is the real {a}? Both?" }] },
  ]),
  // Throwback Thirsty (7×2): the steamiest old photo; emoji reactions.
  ...E('g.throwback-thirsty.choose', [
    s1("My steamiest old photo. Mom, if you're watching, close your eyes."),
    s1("This is from that summer. You know the summer. Everybody has that summer."),
  ]),
  ...E('g.throwback-thirsty.round', [
    { turns: [{ by: 'a', post: "Throwback to when I had abs {e:sweat} {t:ThrowbackThirsty}" }, { by: 'b', react: "Had? Okay, {a}. Fire emoji. Two fire emojis." }] },
    { turns: [{ by: 'a', post: "Don't @ me {e:fire}" }, { by: 'b', react: "I'm @-ing you. {a}!" }] },
  ]),
  // This Is Me (3×2): a photo that means something, and its story.
  ...E('g.this-is-me.choose', [
    s1("A photo that means something. There's only one. This one."),
    s1("Do I share this? I'm sharing this. It's who I am."),
  ]),
  ...E('g.this-is-me.round', [
    { turns: [{ by: 'a', say: "This is the day everything changed for me.", post: "The day I decided to bet on myself {e:pray} {t:ThisIsMe}" }, { by: 'b', react: "Oh. That's a real story. {a} is real." }] },
    { turns: [{ by: 'a', post: "My grandma's kitchen. Where I learned everything {e:heart}" }, { by: 'b', react: "Okay, I'm crying. I'm not crying. I'm crying." }] },
  ]),

  // ── team ──────────────────────────────────────────────────────────────
  ...E('game.team.captains', [
    ab("'You will be leading one of the teams as their Team Captain.' Oh my gosh, I'm gonna be a great captain!", "Captain {b}? Okay. Game on."),
    ab("A captain! Me? Okay, pressure.", "I'm the other captain. Let's go, {a}."),
    ab("I get to pick my own team? Oh, I'm picking smart.", "And I'm picking smarter. Sorry, {a}."),
    { when: { fresh: true }, turns: [{ by: 'a', react: "'The other Captain is also a new Player who joined today.' I've been here twelve minutes!" }, { by: 'b', react: "Twelve minutes and I'm a captain. Let's go." }] },
  ]),
  ...E('game.team.scout.want', [
    s1("Circle, take me to {b}'s profile. That's a confident smile. That's a 'I know trivia' smile."),
    s1("{b} seems smart. I want {b} on my team, not against me."),
    s1("{b} looks like someone who reads. I need a reader."),
    s1("I kind of want {b}. {b} could bring the team together."),
  ]),
  ...E('game.team.scout.pass', [
    s1("{b}? Looks like {b} is trying a little hard. I don't know."),
    s1("I'm not feeling {b} for trivia. Sorry, {b}."),
    s1("{b} would be fun. But fun doesn't win trivia."),
    s1("Hm. {b}. Maybe later. Maybe much later."),
  ]),
  ...E('game.team.picks', [
    s1("Next pick. {b}."),
    s1("I'll take {b}. {b} gets it."),
    s1("{b}, you're with me. Don't let me down."),
    s1("Okay, {b}. Welcome to the team."),
  ]),
  ...E('game.team.trash', [
    { turns: [{ by: 'a', send: "Good luck tonight {b}. You'll need it {e:side}" }, { by: 'b', send: "Luck? I have brains. Big difference" }] },
    { turns: [{ by: 'a', send: "My team is stacked. Just saying {e:muscle}" }, { by: 'b', send: "Stacked with what lol" }] },
    { turns: [{ by: 'a', react: "Captain {b}. My rival for the night." }, { by: 'b', react: "{a} thinks {a.sub}'s winning this. Cute." }] },
    { turns: [{ by: 'a', send: "May the smartest team win {e:handshake}" }, { by: 'b', send: "Oh, it will {e:crown}" }] },
  ]),
  ...E('game.team.banter', [
    { turns: [{ by: 'a', react: "Of course {b} knew that. Of course." }], when: { right: true } },
    { turns: [{ by: 'a', react: "Lucky guess, {b}. That was a lucky guess." }], when: { right: true } },
    { turns: [{ by: 'a', react: "Thank you, {b}! Keep missing, {b}!" }], when: { right: false } },
    { turns: [{ by: 'a', react: "Oh no, {b}. Oh no." }], beat: '{a} is laughing too hard to sit up.', when: { right: false } },
    { turns: [{ by: 'a', react: "Okay, this is getting close. Too close." }] },
    { turns: [{ by: 'a', react: "We need this next one. We need it." }] },
    { turns: [{ by: 'a', react: "I knew that one! Why didn't they ask me that one?" }] },
  ]),
  ...E('game.team.question.right', [
    { turns: [{ by: 'a', react: "'{q}' Oh, I know this. {x}!" }, { by: 'b', react: "Yes! That's my team! {n}!" }] },
    { turns: [{ by: 'a', react: "'{q}' Easy. {x}." }, { by: 'b', react: "Brains! I picked brains! {n}." }] },
    { turns: [{ by: 'a', react: "'{q}' Is it… {x}? It's {x}." }, { by: 'b', react: "It's right! We're {n}!" }] },
    { turns: [{ by: 'a', react: "'{q}' {x}. Next question." }], beat: '{a} does not even blink.' },
  ]),
  ...E('game.team.question.wrong', [
    { turns: [{ by: 'a', react: "'{q}' Oh no. Um. {x}?" }, { by: 'b', react: "No! It's not {x}! It's {n}." }] },
    { turns: [{ by: 'a', react: "'{q}' {x}. I'm sure. I'm so sure." }, { by: 'b', react: "Wrong. So wrong. We're at {n}." }] },
    { turns: [{ by: 'a', react: "'{q}' I don't know this. {x}? Please?" }, { by: 'b', react: "It's okay. It's okay. It's not okay. {n}." }] },
    { turns: [{ by: 'a', react: "'{q}' {x}!" }], beat: 'In another apartment, somebody screams the right answer at the screen.' },
  ]),
  // Trivia Night (1×07), Geek Chic (2×09), Let's Get Quizzical (5×07)
  ...E('g.trivia-night.captains', [
    ab("'Tonight, you will meet your fellow Players at The Circle Trivia Night.' I'm awesome at trivia. I know everything about everything.", "I'm a captain too? Oh God. I'm not good at trivia."),
    ab("Team Captain at Trivia Night! Brains. I'm here for brains.", "Captain {b} reporting for duty."),
  ]),
  ...E('g.geek-chic.captains', [
    ab("The Geek Chic Quiz. Space, math, science. My people.", "Math? Don't pick me for math. I'm a captain, I can't not pick me."),
    ab("Geek Chic! I finally get to be the nerd I am.", "Okay, {a}. Nerd versus nerd."),
  ]),
  ...E('g.quizzical.captains', [
    ab("'You should collect your team outfits now.' Outfits! This is serious.", "My team has better outfits. That's half the battle."),
    ab("Let's Get Quizzical! I'm choosing the categories. I'm so ready.", "Bring it, {a}."),
  ]),

  // ── gift ──────────────────────────────────────────────────────────────
  ...E('game.gift.choose', [
    s1("Who deserves it? That's easy. {b}."),
    s1("Everybody's gonna see who I pick. It has to be {b}."),
    s1("I'm picking {b}. {b} has been real with me from the start.", '{a} hits send before second-guessing it.'),
    { when: { flirty: true }, turns: [{ by: 'a', say: "{b}. Is that too obvious? It's too obvious. It's {b}." }] },
  ]),
  ...E('game.gift.thanks', [
    { turns: [{ by: 'a', react: "{b} picked me!", send: "Thank-you note: you're the best {e:heart} {t:ThankYouBestie}" }] },
    { turns: [{ by: 'a', send: "{b} I owe you one. A big one {e:hug}" }] },
    { turns: [{ by: 'a', react: "I didn't expect that from {b}. At all.", send: "Thank you {b}!! That means so much" }] },
    { turns: [{ by: 'a', send: "{b}!!! You did NOT have to do that {e:hearteyes}" }] },
    { turns: [{ by: 'a', react: "Okay, now I have to be nice to {b} forever.", send: "Thank you {b}. Seriously. You made my day" }] },
    { turns: [{ by: 'a', send: "Best gift in the building and it's not close. Thanks {b} {e:crown}" }] },
    { turns: [{ by: 'a', react: "Me? {b} picked me?", send: "I'm keeping this forever. Thank you {b} {e:heart}" }] },
    { turns: [{ by: 'a', send: "{b} you're too sweet. I owe you a real gift when we get out {e:party}" }] },
  ]),
  ...E('game.gift.noticed', [
    s1("{b} and {c} picked each other. That's an alliance. That's a whole alliance."),
    s1("Interesting. {b} went straight to {c}. Noted."),
    s1("{b} and {c}. I see you two."),
  ]),
  // Night of Endless Heartbreak (6×11): a big night in; one gift each.
  ...E('g.endless-heartbreak.choose', [
    s1("A breakup night, and I get to send someone a gift. {b}. {b} needs it most."),
    s1("Everybody's heart is a little broken in here. I'm sending mine to {b}."),
  ]),
  ...E('g.endless-heartbreak.round', [
    { turns: [{ by: 'a', say: "Ice cream and a love letter. For {b}." }, { by: 'b', react: "Ice cream? From {a}? I'm healed." }] },
    { turns: [{ by: 'a', say: "My gift goes to {b}. Everybody gets over heartbreak with a friend." }, { by: 'b', react: "{a}! Okay, this night got better." }] },
  ]),
  // Bake for Your Bestie (3×8): a cake for your closest friend.
  ...E('g.bake-bestie.choose', [
    s1("Bake for my bestie. My bestie is {b}. It's not even close."),
    s1("Twenty minutes to bake for my best friend in here. That's {b}."),
  ]),
  ...E('g.bake-bestie.round', [
    { turns: [{ by: 'a', say: "It's lopsided, but it's full of love. For {b}." }, { by: 'b', react: "{a} made me a cake? {a} is my bestie too!" }] },
    { turns: [{ by: 'a', say: "Frosting that says {b}'s name. Spelled right, mostly." }, { by: 'b', react: "A cake with my name! I'm not okay." }] },
  ]),
  // Democracy Day (2×10): a vote for who gets the presidential package.
  ...E('g.democracy-day.choose', [
    s1("'Vote for the Player you wish to bestow a great gift upon.' My vote goes to {b}."),
    s1("A presidential package. Who's my president? {b}."),
  ]),
  ...E('g.democracy-day.round', [
    { turns: [{ by: 'a', say: "Circle, my vote: {b}." }, { by: 'b', react: "{a} voted for me? Thank you, {a}!" }] },
    { turns: [{ by: 'a', say: "I'm voting {b}. I hope everybody sees it." }, { by: 'b', react: "Okay, {a}. I'll remember that." }] },
  ]),

  // ── rival ─────────────────────────────────────────────────────────────
  ...E('game.rival.reply', [
    s1("{b} doesn't know me from a hole in the wall. You don't know what I've been through.", '{a} paces the kitchen.'),
    s1("{b} named me. Okay. That's a declaration of war."),
    s1("I respect {b} for saying it. I don't like it, but I respect it."),
    { when: { mutual: true }, turns: [{ by: 'a', say: "{b} said me, I said {b}. At least we're honest." }] },
  ]),
  ...E('game.rival.react', [
    s1("{n} people named me their rival. {n}. That's a target on my back."),
    s1("Everybody thinks I'm the one to beat. That's a compliment and a threat."),
    s1("I'm everybody's rival. Great. Love that for me."),
  ]),
  ...E('game.rival.observe', [
    s1("Everybody named {b}. {b} is the one to beat, and now everybody knows it."),
    s1("{b} got named {n} times. That's not a rival. That's a target."),
    s1("If I were {b}, I'd be scared right now."),
  ]),

  // ── flirt ─────────────────────────────────────────────────────────────
  ...E('game.flirt.practice', [
    s1("Okay. Pickup line. Practice it in the mirror first.", '{a} says it to the mirror three times, then laughs at {a.ref}.'),
    s1("It has to be smooth. And a little stupid. Smooth and stupid."),
    s1("If this line doesn't work on {b}, nothing will."),
    s1("I've been saving this line my whole life. My whole life."),
  ]),
  ...E('game.flirt.answer', [
    { turns: [{ by: 'a', send: "Is your name Wi-Fi? Because I'm feeling a connection {e:wink}" }] },
    { turns: [{ by: 'a', send: "Did it hurt when you fell from the Newsfeed? {e:hearteyes}" }, { by: 'b', send: "Only a little lol" }] },
    { turns: [{ by: 'a', react: "My turn.", send: "I'd tell you a joke about the Circle but you'd block me {e:laugh}" }] },
    { turns: [{ by: 'a', send: "Are you a camera? Because every time I look at you, I smile {e:smile}" }] },
  ]),
  ...E('game.flirt.react', [
    s1("{b} and {c}? Oh, there's something there."),
    s1("Get a room, {b}. Oh wait, you can't."),
    s1("That was so bad. That was so good. I don't know."),
  ]),
  ...E('game.flirt.vote', [
    s1("Best pickup line? {b}. It was terrible and I loved it."),
    s1("I'm voting {b}. That one got me."),
    s1("{b}. No contest."),
  ]),
  ...E('game.flirt.date', [
    ab("A date in the Hangout. With {b}. I'm nervous. Why am I nervous?", "Okay, {a}. Let's see what you've got."),
    ab("I won a date with {b}! Circle, what do I wear to a date with a screen?", "A virtual date with {a}. This is the best day in here."),
    ab("{b} and me, alone in the Hangout. Finally.", "Finally is right."),
  ]),
};
