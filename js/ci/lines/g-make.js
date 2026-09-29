// Make-and-judge games, beat by beat (Plan 3a+). Data only.
// `props` — a opens the delivery; `build.<tier>` — a making it (b is the
// subject in portrait games; family lines never name b); `timeup`; `item` —
// b reacts to a's creation (n likes); `jab`/`kind` — a's portrait of b, and
// b's reaction; `tally` — a reads the likes, b leads with {n}; `result` — a won.
// Every game has its own `g.<game>.*` lines: a cake is not a mannequin.
const e = (id, turns, extra = {}) => ({ id, turns, ...extra });
const s1 = (a, beat) => ({ turns: [{ by: 'a', say: a }], ...(beat ? { beat } : {}) });
const r1 = (a, beat) => ({ turns: [{ by: 'a', react: a }], ...(beat ? { beat } : {}) });
const two = (a, b) => ({ turns: [{ by: 'a', say: a }, { by: 'b', react: b }] });
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

export const G_MAKE = {
  // ── family ────────────────────────────────────────────────────────────
  ...E('game.make.props', [
    r1("There's a delivery at my door. Oh, this is real."),
    r1("Everything I need is in this box. I don't know what half of it is."),
    r1("Okay, supplies. Let's see what we're working with.", '{a} dumps the whole box out on the kitchen table.'),
    s1("I have never done this in my life. Let's go!"),
  ]),
  ...E('game.make.plan', [
    s1("I have a plan. It's a bad plan, but it's a plan."),
    s1("Keep it simple. Simple wins."),
    s1("I'm going big. Go big or go home. Well. Go big or get blocked."),
    s1("Okay. Deep breath. What would a professional do?", '{a} looks at the instructions for a long time.'),
    s1("I'm gonna make everybody laugh. That's my strategy."),
  ]),
  ...E('g.portrait-mode.plan', [
    s1("I got {b}. I'm gonna make {b} look like a star."),
    s1("{b}. Okay. Big eyes, big smile, that's {b}."),
  ]),
  ...E('g.paint-the-player.plan', [
    s1("It's anonymous, and I got {b}. Interesting."),
    s1("I know exactly how I see {b}. Let's see if it comes out."),
  ]),
  ...E('g.goat.plan', [
    s1("{b} as a goat. What is {b} the greatest at?"),
    s1("Goat {b}. I need the perfect superlative for {b}."),
  ]),
  ...E('g.poor-traits.plan', [
    s1("{b}'s worst trait. Do I go honest or do I go nice?"),
    s1("I have to paint {b}'s worst trait. I know it. Everybody knows it."),
  ]),
  ...E('g.rap-it-up.plan', [
    s1("A rap about {b}. What do I know about {b}? Enough."),
    s1("{b} is getting bars. Friendly bars. Mostly."),
  ]),
  ...E('g.head-to-head.plan', [
    s1("A diss track about {b}. I have to go hard or go home."),
    s1("{b}. I got {b}. I have material."),
  ]),
  ...E('g.roast.plan', [
    s1("I'm roasting {b}. Lovingly. Mostly lovingly."),
    s1("{b} has given me so much material this week."),
  ]),
  ...E('g.single-pringles.plan', [
    s1("{b}'s dating profile. What does {b} actually want in a person?"),
    s1("I'm gonna make {b} sound irresistible. Or hilarious. We'll see."),
  ]),
  ...E('g.nailed-it.plan', [
    s1("The picture looks easy. It's not easy. It's never easy."),
    s1("Layers first. Then the colors. Then pray."),
  ]),
  ...E('g.batter-up.plan', [
    s1("A pancake lion. How hard can a pancake lion be?"),
    s1("Start with the head. The head is the whole animal."),
  ]),
  ...E('g.glammequins.plan', [
    s1("She needs a look. A full look. Smoky eye, bold lip."),
    s1("I'm gonna give her the glow-up of her life."),
  ]),
  ...E('g.poetry-slam.plan', [
    s1("It has to rhyme, and it has to save me. No pressure."),
    s1("Speak from the heart. That's the plan. Speak from the heart."),
  ]),
  ...E('game.make.build.disaster', [
    s1("No. No, no, no, no. That's not what it's supposed to look like.", '{a} stares at the mess, then keeps going anyway.'),
    s1("Okay, this is a disaster. A beautiful disaster.", ''),
    s1("I'm gonna dismember this a little and call it unique."),
    s1("Why is this piece so much bigger than everything else?", '{a} gets it everywhere. Everywhere.'),
  ].map(x => (x.beat === '' ? { turns: x.turns } : x))),
  ...E('game.make.build.ok', [
    s1("It's not perfect. It's mine."),
    s1("Okay, that's not bad. That's actually not bad."),
    s1("I wish I wasn't a perfectionist. I'd be done by now."),
    s1("It looks like something. I'm not sure what. But something."),
  ]),
  ...E('game.make.build.proud', [
    s1("Look at that. Look at that! I'm a genius.", '{a} steps back and admires it from across the room.'),
    s1("That's it. Get in there, baby. That's it!"),
    s1("Oh, I'm winning this. I'm definitely winning this."),
    s1("I surprised myself. Honestly. I surprised myself."),
  ]),
  ...E('game.make.timeup', [
    r1("'Time's up.' Already? I needed five more minutes!"),
    r1("Time's up! Hands off, hands off."),
    r1("That's time. It is what it is.", '{a} takes a photo of it before it can fall apart.'),
    r1("Time's up! Okay. It's done. It's art now."),
  ]),
  ...E('game.make.upload', [
    r1("'All Players should now go to the Newsfeed.' Oh no. Oh, here we go."),
    r1("Everybody's uploading. Time to see what everybody made.", '{a} pulls a blanket up and gets comfortable.'),
    r1("Circle, take me to the Newsfeed. I need to see these."),
    r1("It's reveal time. Please don't let mine be the worst. Please."),
  ]),
  ...E('game.make.comment', [
    { turns: [{ by: 'a', react: "{b}'s got {n} likes. Honestly? Deserved." }], when: { many: true } },
    { turns: [{ by: 'a', react: "{b}'s isn't getting much love. That's rough." }], when: { many: false } },
    { turns: [{ by: 'a', react: "What is {b}'s? I can't tell what it is. I love it anyway." }] },
    { turns: [{ by: 'a', react: "Okay, {b} actually tried. I respect effort." }] },
    { turns: [{ by: 'a', react: "{b}, what happened? What happened, {b}?" }], when: { tier: 'disaster' } },
    { turns: [{ by: 'a', react: "{b} is secretly an artist. Who knew?" }], when: { tier: 'proud' } },
    { turns: [{ by: 'a', react: "Circle, like {b}'s. That's the one." }], when: { warm: true } },
    { turns: [{ by: 'a', react: "{n} likes for that? Come on." }], when: { warm: false, many: true } },
  ]),
  ...E('game.make.item', [
    two("Here it is. Be nice.", "Okay, that's actually really good, {a}."),
    two("It's my masterpiece. Don't look too closely.", "Oh no. Oh, {a}."),
    two("I tried. That's what matters.", "What is that? I love it. What is it?"),
    two("Posting it before I change my mind.", "That's so {a}."),
  ]),
  ...E('game.make.last', [
    { turns: [{ by: 'a', react: "{n} likes. Mine got {n} likes. Wow." }, { by: 'a', say: "I'm not crying. Something's in my eye." }] },
    { turns: [{ by: 'a', react: "The fewest likes. Okay. Art is subjective." }] },
    { turns: [{ by: 'a', react: "Last place. At least I made them laugh." }], beat: '{a} stares at the Newsfeed for a long time.' },
    { turns: [{ by: 'a', react: "I knew it was bad. I didn't know it was that bad." }], when: { tier: 'disaster' } },
    { turns: [{ by: 'a', react: "Only {n}? I thought mine was good! People have no taste." }], when: { tier: 'proud' } },
  ]),
  // a (the subject of an anonymous portrait) guesses who made it: b.
  ...E('game.make.whodunit.right', [
    { turns: [{ by: 'a', say: "I know exactly who painted this. It's {b}. It has {b}'s energy all over it." }] },
    { turns: [{ by: 'a', say: "Anonymous, sure. That's {b}. I'd know {b}'s work anywhere." }] },
    { turns: [{ by: 'a', say: "It's {b}. I'm sure of it. And I'm not forgetting it." }], when: { jab: true } },
    { turns: [{ by: 'a', say: "{b} painted me. I can tell. And honestly? I love {b} for it." }], when: { jab: false } },
    { turns: [{ by: 'a', say: "Only {b} would do this. Only {b}." }], beat: '{a} writes a name on the notepad and circles it.' },
    { turns: [{ by: 'a', say: "It's {b}. Nobody else paints like that." }] },
    { turns: [{ by: 'a', say: "{b}. I'd bet my apartment on it." }] },
    { turns: [{ by: 'a', say: "That's {b}'s work. I know {b} too well by now." }] },
  ]),
  ...E('game.make.whodunit.wrong', [
    { turns: [{ by: 'a', say: "Who did this? My money's on {b}." }] },
    { turns: [{ by: 'a', say: "It has to be {b}. Right? It has to be {b}." }] },
    { turns: [{ by: 'a', say: "I'm guessing {b}. I'm probably wrong, but I'm guessing {b}." }] },
    { turns: [{ by: 'a', say: "{b}, you're my prime suspect." }], when: { jab: true } },
    { turns: [{ by: 'a', say: "Circle, I'm guessing {b}. Something about the brushstrokes." }] },
    { turns: [{ by: 'a', say: "Is it {b}? It feels like {b}. I don't know." }] },
    { turns: [{ by: 'a', say: "My gut says {b}. My gut has been wrong before." }] },
    { turns: [{ by: 'a', say: "Whoever did this, I'll find out. My first guess is {b}." }] },
    { turns: [{ by: 'a', say: "{b}? No. Yes. Maybe {b}." }], beat: '{a} squints at the painting, then at the list of names.' },
    { turns: [{ by: 'a', say: "I have no idea. I'm saying {b} just to say something." }] },
  ]),
  ...E('game.make.tally', [
    { turns: [{ by: 'a', react: "{b} has {n} likes. {n}! Nobody's catching that." }] },
    { turns: [{ by: 'a', react: "Let's see the likes. {b} is winning. Of course." }] },
    { turns: [{ by: 'a', react: "{n} likes for {b}. That's the one everybody loved." }] },
    { turns: [{ by: 'a', react: "It's {b}. It was always gonna be {b}." }] },
  ]),

  // ── Nailed It / Failed It (1×04): copy a colorful cake in 30 minutes ───
  ...E('g.nailed-it.props', [
    r1("Fondant? Molding chocolate? What is this? I got a bowl, and I don't know what that is."),
    r1("A cake. They want me to make a cake. I have never made a cake in my life."),
  ]),
  ...E('g.nailed-it.build.disaster', [
    s1("Oh, flour. It's snowing. No, no, no, no, no.", 'Flour settles over the whole kitchen.'),
    s1("There's cake everywhere. On the floor. On me. In my hair."),
  ]),
  ...E('g.nailed-it.build.ok', [
    s1("It's leaning. It's a leaning cake. It's a style."),
    s1("I don't even know what color that is. But it's on the cake."),
  ]),
  ...E('g.nailed-it.build.proud', [
    s1("Look at those layers. I'm a baker now. This is my career.", '{a} holds the cake up to the camera like a trophy.'),
    s1("It's a magnificent work of art, if I do say so myself."),
  ]),
  ...E('g.nailed-it.item', [
    two("Here's my cake. It looked better in my head.", "Oh no. Oh, that's a Failed It."),
    two("Nailed it. I nailed it.", "Wait. {a}'s cake actually looks like the cake."),
  ]),

  // ── Batter Up (2×06): an animal made of pancakes ──────────────────────
  ...E('g.batter-up.props', [
    r1("Pancake mix, a skillet and a picture of an animal. Don't flip out? Too late."),
    r1("A pancake animal. I can barely make a regular pancake."),
  ]),
  ...E('g.batter-up.build.disaster', [
    s1("That was supposed to be a lion. It's a puddle.", 'The smoke alarm goes off in {a}\'s kitchen.'),
    s1("I flipped it. It flipped onto the floor. Great."),
  ]),
  ...E('g.batter-up.build.ok', [
    s1("It's a bear. It's a sad bear. But it's a bear."),
    s1("Two ears, one face. Close enough to a bunny."),
  ]),
  ...E('g.batter-up.build.proud', [
    s1("A pancake giraffe with a long neck. I'm a pancake artist."),
    s1("Blueberry eyes. Whipped cream mane. This lion is perfect."),
  ]),
  ...E('g.batter-up.item', [
    two("Meet my pancake cat.", "That's not a cat. That's a potato. I love it."),
    two("It's a turtle. Don't ask me why it has five legs.", "Five legs, {a}? Five?"),
  ]),

  // ── Glammequins (2×07): a mannequin head makeover ─────────────────────
  ...E('g.glammequins.props', [
    r1("There's a head at my door. A mannequin head. Hi, gorgeous."),
    r1("A mannequin head and a makeup kit. Oh, I was born for this."),
  ]),
  ...E('g.glammequins.build.disaster', [
    s1("Why does she look like she's seen a ghost? Eyebrows. I need eyebrows.", '{a} wipes it all off and starts again.'),
    s1("That lipstick is on her chin. Why is it on her chin?"),
  ]),
  ...E('g.glammequins.build.ok', [
    s1("She's giving… something. I'm not sure what."),
    s1("Okay, she's cute. A little scary. Mostly cute."),
  ]),
  ...E('g.glammequins.build.proud', [
    s1("Contour, highlight, lashes. She's ready for a red carpet."),
    s1("I named her. Her name is Sparkle. She's perfect."),
  ]),
  ...E('g.glammequins.item', [
    two("This is Sparkle. Be nice to her.", "Sparkle is terrifying. Sparkle is amazing."),
    two("My glammequin. Not my best work.", "Why is she winking? {a}, why is she winking?"),
  ]),

  // ── portrait games: Portrait Mode (1×08), Paint the Player (4×11) ──────
  ...E('g.portrait-mode.props', [
    r1("A canvas, brushes and paint. And a name. I have to paint another Player."),
    r1("'Paint a portrait of another Player.' I can't draw a stick figure."),
  ]),
  ...E('g.portrait-mode.build.disaster', [
    s1("Why does {b} have three eyes? I only meant to paint two.", '{a} steps back and tilts {a.posAdj} head.'),
    s1("I made {b}'s head too big. Now the body has to be bigger. Now it's all big."),
  ]),
  ...E('g.portrait-mode.build.ok', [
    s1("It looks like {b}. If you squint. From across the room."),
    s1("I'm focusing on the smile. {b} has a great smile."),
  ]),
  ...E('g.portrait-mode.build.proud', [
    s1("I'm a whole artist. Look at {b}'s face. That's {b}!"),
    s1("I captured {b}'s soul. I'm not even kidding."),
  ]),
  ...E('g.portrait-mode.kind', [
    two("{b} has been there for me. This has to be good.", "Oh my God. That's me? I'm going to cry."),
    two("Ladies and gentlemen, I present to you: {b}!", "{a}, you're a whole artist. Exclamation point."),
  ]),
  ...E('g.portrait-mode.jab', [
    two("I painted {b} exactly how I see {b}.", "Why do I look like that? Why are my eyes like that?"),
    two("Is it a portrait or is it a message? Both.", "That's not art, {a}. That's a statement."),
  ]),
  ...E('g.paint-the-player.props', [
    r1("Anonymous portraits. Oh, this is gonna get messy."),
    r1("'Your portraits will remain anonymous.' Oh, somebody's getting roasted."),
  ]),
  ...E('g.paint-the-player.build.disaster', [
    s1("{b}'s face is melting. I didn't mean to melt {b}."),
    s1("Okay, green was a choice. Green was a mistake."),
  ]),
  ...E('g.paint-the-player.build.ok', [
    s1("Nobody's gonna know it's mine. Good. It's not great."),
    s1("It's {b}. Sort of. Mostly the hair."),
  ]),
  ...E('g.paint-the-player.build.proud', [
    s1("This is the best thing I've ever painted, and I can't even sign it."),
    s1("{b} is gonna love this. And never know it was me."),
  ]),
  ...E('g.paint-the-player.kind', [
    two("I painted {b} with a halo. Because that's what I see.", "A halo? Whoever did this, I love you."),
    two("Soft colors. Kind eyes. That's {b}.", "That's so sweet. I don't even know who to thank."),
  ]),
  ...E('g.paint-the-player.jab', [
    two("A snake. I painted {b} as a snake. It's anonymous, so.", "A snake? Somebody painted me as a snake?"),
    two("Two faces. One for the chat, one for the Ratings. That's {b}.", "Two faces? Oh, somebody's coming for me."),
  ]),
  // ── G.O.A.T. (7×8): another Player, as a goat, with a superlative ─────
  ...E('g.goat.props', [
    r1("Paint another Player as a goat. As a goat? Okay."),
    r1("A goat. The Circle wants me to paint somebody as a goat. Love that."),
  ]),
  ...E('g.goat.build.disaster', [
    s1("Is this a goat? It looks like a dog. It looks like a dog with horns."),
    s1("{b}'s goat has one horn. It's a unicorn goat now. Moving on."),
  ]),
  ...E('g.goat.build.ok', [
    s1("It's a goat. It's clearly a goat. It's {b} as a goat."),
    s1("Now the superlative. What's {b} the greatest at?"),
  ]),
  ...E('g.goat.build.proud', [
    s1("Greatest Of All Time. {b} the goat. This is beautiful."),
    s1("Look at that little goat face. That's {b}!"),
  ]),
  ...E('g.goat.kind', [
    two("'Greatest Friend of All Time.' That's {b}.", "Greatest friend? Stop. I love my goat."),
    two("{b}, the goat of good vibes.", "I'm a goat! A good goat!"),
  ]),
  ...E('g.goat.jab', [
    two("'Greatest Liar of All Time.' Sorry, {b}.", "Greatest liar? Whoever painted this goat, I'm coming for you."),
    two("{b} the goat. The goat of drama.", "Drama goat. Rude. Honestly rude."),
  ]),
  // ── Poor-Traits (6×5): another Player's worst trait ────────────────────
  ...E('g.poor-traits.props', [
    r1("'Paint another Player's worst trait.' Oh, zero drama. Zero."),
    r1("This is gonna be so harsh. I love it. I hate it."),
  ]),
  ...E('g.poor-traits.build.disaster', [
    s1("I don't even know {b}'s worst trait. I'm painting a question mark."),
    s1("It's supposed to be a mouth talking. It looks like a pizza."),
  ]),
  ...E('g.poor-traits.build.ok', [
    s1("{b} is always late to the Circle Chat. So I painted a clock."),
    s1("It's honest. That's all I'll say."),
  ]),
  ...E('g.poor-traits.build.proud', [
    s1("It's mean, but it's accurate, and it's beautiful."),
    s1("Everybody's gonna know exactly who this is."),
  ]),
  ...E('g.poor-traits.kind', [
    two("{b}'s worst trait? Caring too much. I painted a giant heart.", "Caring too much? Aw. That's not a bad trait!"),
    two("{b} is too nice to everybody. That's the worst trait I can find.", "Whoever did this, thank you."),
  ]),
  ...E('g.poor-traits.jab', [
    two("{b}'s worst trait is being fake. So I painted a mask.", "A mask? Somebody thinks I'm fake."),
    two("{b} talks too much. So: a giant mouth.", "A giant mouth. Okay. Noted. Very noted."),
  ]),
  // ── Rap It Up (6×2): a rap about another Player ────────────────────────
  ...E('g.rap-it-up.props', [
    r1("A rap? About another Player? I've never rapped in my life."),
    r1("'Write a rap about another Player.' Okay. Okay. I got bars."),
  ]),
  ...E('g.rap-it-up.build.disaster', [
    s1("What rhymes with {b}? Nothing rhymes with {b}.", '{a} paces the room, mumbling.'),
    s1("My first line rhymes 'Circle' with 'Circle.' That's allowed, right?"),
  ]),
  ...E('g.rap-it-up.build.ok', [
    s1("It's got a beat. Sort of. I'll clap the beat."),
    s1("Verse one is done. There is no verse two."),
  ]),
  ...E('g.rap-it-up.build.proud', [
    s1("These bars are fire. These bars are actually fire."),
    s1("Drop the beat. {b} isn't ready for this."),
  ]),
  ...E('g.rap-it-up.kind', [
    two("'{b} came in hot, but {b} kept it real, that's a friend you can trust, that's the whole deal.'", "That's about me? That's actually fire!"),
    two("A love song, but in rap form. For {b}.", "Stop! Somebody wrote me a love rap!"),
  ]),
  ...E('g.rap-it-up.jab', [
    two("'{b}'s got a smile, but I see the game, every message you send says the same thing, same name.'", "Oh, that's a diss. That's a straight-up diss."),
    two("Gloves off. This one's for {b}.", "Did {a} just diss me in a rap? In front of everybody?"),
  ]),
  // ── Poetry Slam (2×2): the at-risk write a poem to be saved ───────────
  ...E('g.poetry-slam.props', [
    r1("Fifteen minutes to write a poem that saves me? No pressure."),
    r1("A poem. My life in here depends on a poem."),
  ]),
  ...E('g.poetry-slam.build.disaster', [
    s1("Roses are red, violets are blue, please don't block me. That's all I've got."),
    s1("Nothing rhymes. Nothing rhymes in this whole language."),
  ]),
  ...E('g.poetry-slam.build.ok', [
    s1("It's a poem. It has lines. Some of them rhyme."),
    s1("I'll read it with feeling. Feeling covers a lot."),
  ]),
  ...E('g.poetry-slam.build.proud', [
    s1("'I'm begging you, please, to keep me in this game.' No. 'To keep me in the frame.' Yes."),
    s1("This is the best thing I've ever written, and I wrote it in fifteen minutes."),
  ]),
  ...E('g.poetry-slam.item', [
    two("'Choose me from the others, and an ally you will make.'", "Okay, {a}. That was actually beautiful."),
    two("Here goes nothing. Here goes my whole game.", "{a} put their heart into that."),
  ]),
  // ── Head to Head (3×5): diss tracks ───────────────────────────────────
  ...E('g.head-to-head.props', [
    r1("A diss track. Oh, I've been waiting my whole life for this."),
    r1("'Each writes a diss track about another Player.' Somebody's getting hurt tonight."),
  ]),
  ...E('g.head-to-head.build.disaster', [
    s1("I can't diss {b}. I like {b}. Why did I get {b}?"),
    s1("Every line I write is a compliment. This is a terrible diss track."),
  ]),
  ...E('g.head-to-head.build.ok', [
    s1("It's a diss, but it's a friendly diss. A friendly fire."),
    s1("I've got three lines on {b}. Three good lines."),
  ]),
  ...E('g.head-to-head.build.proud', [
    s1("{b} is gonna need a minute after this one."),
    s1("This track is going on the radio when I get out."),
  ]),
  ...E('g.head-to-head.kind', [
    two("I tried to diss {b}. I couldn't. It's basically a love song.", "That's the nicest diss track ever written."),
    two("'You're too nice for this game' is the whole diss.", "Ha! I'll take it."),
  ]),
  ...E('g.head-to-head.jab', [
    two("'{b} plays nice in the chat, but I've seen the stats…' Mic drop.", "Oh, it's on. It is on."),
    two("I held nothing back. Nothing.", "Wow. {a} went there. {a} actually went there."),
  ]),
  // ── Roast (4×6) ───────────────────────────────────────────────────────
  ...E('g.roast.props', [
    r1("A roast. Tonight, nobody's safe."),
    r1("I have to write a roast joke about somebody. Oh, I have material."),
  ]),
  ...E('g.roast.build.disaster', [
    s1("Every joke I write about {b} is too mean or not funny. There's no middle."),
    s1("I'm not a comedian. I'm a person with a pen and fear."),
  ]),
  ...E('g.roast.build.ok', [
    s1("It's a little mean. It's roast mean. That's allowed."),
    s1("One joke. One good joke. That's all you need."),
  ]),
  ...E('g.roast.build.proud', [
    s1("This joke is going to destroy {b}. Lovingly."),
    s1("I've been saving this one since day one."),
  ]),
  ...E('g.roast.kind', [
    two("'{b} is so nice, the Circle had to invent a word for it.'", "Is that a roast? That's a compliment!"),
    two("A gentle roast. For {b}. With love.", "Ha! Okay, that was cute."),
  ]),
  ...E('g.roast.jab', [
    two("'{b}'s profile picture has more filters than a water plant.'", "Oh, that one stung. That one stung."),
    two("'{b} has been in the Circle five days and still hasn't said anything real.'", "Wow. The whole building heard that."),
  ]),
  // ── Single Pringles (5×4): a dating profile for another Player ─────────
  ...E('g.single-pringles.props', [
    r1("A dating profile. For somebody else. Anonymously. Oh, this is gonna go down."),
    r1("I'm writing somebody else's dating profile? I have power now."),
  ]),
  ...E('g.single-pringles.build.disaster', [
    s1("'{b} likes long walks and…' I don't know anything about {b}."),
    s1("I wrote 'loves food.' Everybody loves food. That's not a personality."),
  ]),
  ...E('g.single-pringles.build.ok', [
    s1("'Fun, loyal and a great cook.' That's a solid profile."),
    s1("I'm making {b} sound like a catch. {b} is a catch, kind of."),
  ]),
  ...E('g.single-pringles.build.proud', [
    s1("If I read this profile, I'd swipe right. {b} is lucky."),
    s1("This is the best dating profile ever written. {b} should pay me."),
  ]),
  ...E('g.single-pringles.kind', [
    two("'{b}: your future favorite person.' That's the headline.", "Whoever wrote this, will you be my wingman forever?"),
    two("I made {b} sound like a dream, because {b} is.", "I would date me after reading that."),
  ]),
  ...E('g.single-pringles.jab', [
    two("'{b}: looking for someone to lie to.' It's anonymous. It's fine.", "Looking for someone to lie to? Who wrote this?"),
    two("'{b} will text you back in three to five business days.'", "Rude! Funny, but rude."),
  ]),
};
