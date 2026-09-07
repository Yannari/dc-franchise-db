// ══════════════════════════════════════════════════════════════════════
// dr/data/entrances.js — the walk through the door, and the room's answer
// ══════════════════════════════════════════════════════════════════════
//
// The premiere's entrance is the one line every queen is remembered by
// before she has done anything, and until now this show did not have any.
// The arrivals screen was borrowing her first scene of the season, which is
// a scene about something else with her name in it.
//
// ── WHAT DECIDES THE LINE ─────────────────────────────────────────────
//
// Her DRAG STYLE picks the pool and her ATTITUDE picks within it. That order
// matters and it is the honest one: an entrance is a brand statement, and a
// pageant queen and a punk do not make the same one however bold they are.
// Attitude then decides whether she says it loud, dry, or barely at all.
//
//   style      one of the ten in js/dr/queen.js — the pool
//   attitude   'big'   boldness and star power high: she plays to camera
//              'dry'   low temperament or a schemer: she underplays it
//              'warm'  high social, low boldness: she arrives friendly
//
// Everything is PROPORTIONAL, as the project requires: attitude is picked
// from a weighted roll on her stats, never a threshold, so the same queen
// can arrive differently in two seasons and no stat line locks a bucket.
//
// ── AND THE ROOM ANSWERS ──────────────────────────────────────────────
//
// A line nobody reacts to is a line delivered to an empty room. The reaction
// pool is keyed by how it LANDED, which is her delivery against the room's
// appetite — not by whether the line was "good", which nothing can measure.
//
// `{a}` is the arriving queen. `{b}` is whoever was already standing there.

/** Entrance lines, by drag style, then by attitude. Six of each: 180 lines. */
export const ENTRANCE_LINES = {
  pageant: {
    big: [
      "Ladies, the competition just walked in and she's wearing a crown she has not been given yet.",
      'I have three national titles and a suitcase full of rhinestones. Somebody move.',
      'They said bring your best. I brought my best, my second best, and a spare.',
      "I've been runner-up twice and I have absolutely no intention of making it three.",
      'Somewhere there is a sash with my name on it and I have come to collect the rest of the outfit.',
      'You can always tell the pageant girl. She is the one who ironed the inside of the bag.',
    ],
    dry: [
      "I've done this before. Not this — but something with the same lighting.",
      'Twelve years of pageants and the carpet is still the worst part.',
      "I'm not here to make friends. I'm here on a schedule.",
      'I have a binder. It has tabs. That is all you need to know about me.',
      'My talent is winning things politely. It upsets people.',
      "I peaked in an interview round in 2019 and I've been chasing it ever since.",
    ],
    warm: [
      "Hello! I've watched every season and I have already cried once in the car.",
      "Oh, this room is BEAUTIFUL. Hello. Hi. I'm going to hug everybody.",
      "I brought snacks. I don't know why. I always bring snacks.",
      'Hi! If anybody needs a safety pin, a steamer or a pep talk, I am fully stocked.',
      "My mother is watching this and she will notice if I don't say hello properly. Hello properly!",
      "I'm the girl who compliments your shoes and means it. Your shoes are incredible.",
    ],
  },
  comedy: {
    big: [
      "I'd tell you I'm nervous but I've been rehearsing this walk since I was eleven.",
      'Somebody call the fire department. Not for me — I set something off backstage and left.',
      "I'm the funny one. You can all relax, the role's taken.",
      "I've got forty minutes of material and about nine seconds of look. Let's begin.",
      "They told me to make an entrance. I've made three. That was the third.",
      'I am here to be a problem, and I have brought jokes about being one.',
    ],
    dry: [
      "Hi. I'm going to be very funny in about four days, once I'm comfortable.",
      'I had a great entrance line and I left it in the van.',
      "I'm here, I'm tired, and I'm going to be hilarious about it.",
      "That's the entrance. I'm not doing another one, this is what you get.",
      'I do comedy, which means I will be unbearable in exactly one week.',
      "Somebody laugh so I know the room works. Thank you. That's all I needed.",
    ],
    warm: [
      'Oh good, other people. I was worried it was just me and the mirrors.',
      "Hi! I'm the one who talks too much. You'll get used to it or you won't.",
      'I already love it here and I have been here for nine seconds.',
      "Hello! I'm going to laugh at everything anybody says today out of pure nerves.",
      "Hi — I've decided we're all friends. You had no say. It's done.",
      'I brought a bit. I brought several bits. I have no other personality traits.',
    ],
  },
  fashion: {
    big: [
      'The reference is obscure, the tailoring is not, and neither of them is for you.',
      "I didn't come to compete. I came to be photographed.",
      "This is drag as a discipline. Take notes or don't, I'll be busy.",
      'Everything I am wearing was made by me, and everything you are wearing was not.',
      "There's a silhouette in this room now. There wasn't one before.",
      'I have a point of view. Some of you have a wig and a hope.',
    ],
    dry: [
      "I made this on a train. Please don't touch the shoulder.",
      "Yes, it's a look. No, it doesn't have a theme. That's the theme.",
      "I'll be the one in the corner not saying much and out-dressing everybody.",
      'The hem is raw on purpose. Everything about me is raw on purpose.',
      'I own four colours and I have brought all of them.',
      'I would explain the construction but you would have to care about darts.',
    ],
    warm: [
      'Hi — sorry, is anybody else obsessed with that wallpaper? No? Just me.',
      "Hello! I want to see everybody's garments immediately, this is my favourite part.",
      "I'm so happy to be here I might actually sit down before I fall down.",
      'Hi! If your zip goes, come to me. I am extremely good at other people’s emergencies.',
      'Oh, the FABRIC in this room. Hello. Sorry. Hello properly.',
      "I've been sewing since I was nine and I still can't do a buttonhole. Hi!",
    ],
  },
  camp: {
    big: [
      'The circus is in town and I am every act in it.',
      'I am STUPID and I am EXPENSIVE and those are both compliments.',
      "You wanted high art? Wrong door. This one's got a whoopee cushion behind it.",
      'I have never had a subtle thought in my life and it has served me beautifully.',
      'Somebody said tone it down once. I ate them.',
      'This is not a costume. This is a lifestyle and it has a support group.',
    ],
    dry: [
      "I'm dressed as a feeling. You'll work out which one.",
      'Everything I own is ridiculous. That was the plan.',
      "I'd explain the outfit but honestly the explanation is worse.",
      'There is a joke happening on my body and it is not finished yet.',
      'I look like a mistake somebody committed to. Correct.',
      'I dress like this at home. That is the frightening part.',
    ],
    warm: [
      "HELLO! Yes. That's it. That's the entrance. I peaked already.",
      "I brought joy and also a small horn. Don't ask about the horn yet.",
      "Oh, look at all of you. We're going to be so annoying together.",
      'Hi! I make things out of foam and love and neither is structural.',
      'I have three costume changes and no plan. Hello!',
      'Everybody say hello to the thing on my head. It has a name and feelings.',
    ],
  },
  'club-kid': {
    big: [
      "It's four in the morning somewhere and that somewhere is inside my head.",
      "I don't do pretty. I do memorable, and you'll be seeing this in your sleep.",
      "The club called. It said I'm not allowed back until I win something.",
      'I have removed my own face and replaced it with a better idea.',
      'Nobody here is going to out-weird me. Several of you will try. I encourage it.',
      'This is what happens when nobody stops you. Nobody stopped me.',
    ],
    dry: [
      "This took nine hours. I'd like everyone to know that and then never mention it.",
      "I'm made of foam and spite. Mostly foam.",
      "Nobody at home understands what I do either. Let's get on with it.",
      'I cannot sit down in this. I have made peace with standing all day.',
      'Yes, it lights up. No, I did not test it near water.',
      'I have been described as a warning sign, and I took it well.',
    ],
    warm: [
      'Hi! Sorry if I bump into you, I genuinely cannot see out of this.',
      'Oh my god, the LIGHTS in here. Hello. I’m obsessed. Hello.',
      "I'm going to touch everybody's outfit with permission, one at a time.",
      'Hello! I look terrifying and I am extremely delicate, please be gentle.',
      'Hi! Somebody help me through the door, I have a wingspan situation.',
      'I made this at 3am and I still like it, which never happens. Hi!',
    ],
  },
  spooky: {
    big: [
      "Something died to make this look and it isn't finished dying.",
      "I've come from somewhere much darker and the flight was fine, thank you.",
      "You smell that? That's fear. Or the glue. It's mostly the glue.",
      'I was buried in this. Somebody dug me up for the competition.',
      'The lights in here are too kind to me. Fix that.',
      'I am the reason your parents checked the closet. Hello.',
    ],
    dry: [
      "Yes, there's blood. No, it's not mine. It's syrup, calm down.",
      "I'm the scary one. I'm also extremely polite, which people find worse.",
      'I was going to do something gentle and then I remembered who I am.',
      'I have one aesthetic and it is bad news. It works.',
      'Everything I make is upsetting and beautifully finished.',
      'I do horror. It is a service industry.',
    ],
    warm: [
      'Hi! I know I look like a warning. I’m actually very easy to get on with.',
      'Hello, gorgeous people. Ignore the teeth, they come off.',
      'I make horrible things and I am delighted to be here making them near you.',
      'Hi! If anybody needs fake blood I have brought an unreasonable amount.',
      'Hello! I am the friendliest ghoul you will meet this year, genuinely.',
      'Oh, everyone is so PRETTY. I’m going to ruin that and we’ll all have fun.',
    ],
  },
  broadway: {
    big: [
      'I have been preparing for this since a school production nobody asked about.',
      "Somebody give me a key change. I'll do the rest.",
      "I'm a triple threat and one of the three is being extremely loud.",
      'The lip sync is a formality and I would like that noted now.',
      'I sing live. I am going to keep saying that until it becomes a problem.',
      'I have the range, the belt and the stamina. Two of those are threats.',
    ],
    dry: [
      "I'll be doing my own vocals, which will become relevant later.",
      "I know every word to everything. It's a burden and a talent.",
      "I've been on tour. This dressing room is nicer, which is worrying.",
      'I have a warm-up routine and I will be doing it where you can hear me.',
      "I peaked as a understudy and I've been furious ever since.",
      'Musical theatre ruined my personality and built my career.',
    ],
    warm: [
      'Hello! Does anybody want to warm up with me? Anybody? I’ll go alone.',
      "Oh, I'm going to cry, and then I'm going to belt, and then I'll cry again.",
      "Hi! I'm the one who'll organise a group number nobody asked for.",
      'Hello! I have already worked out our harmonies. All of ours. You’re welcome.',
      'Hi! I will be singing constantly and I apologise in advance and not really.',
      'Oh this is a STAGE. Sorry. Hello. This is a stage though.',
    ],
  },
  dancer: {
    big: [
      "Save your knees, ladies. Mine are already gone and I'm still going to win.",
      'I don’t need a good song. I need a floor and about six seconds.',
      "Every one of you should be worried about the lip sync. That's all I'll say.",
      'I have never lost a lip sync and I am not planning to start on television.',
      'You can teach a look. You cannot teach this.',
      'Somebody put a song on. Any song. I am not joking.',
    ],
    dry: [
      "I'll be stretching in the corner. Not for a bit — for the whole time.",
      'I move well and talk badly. You’ll see both today.',
      'I’m here for the part where somebody has to actually perform.',
      'I have two speeds and neither of them is conversation.',
      'My knees have a countdown on them. Let’s use the time.',
      'I do one thing extremely well and I have built a whole life on it.',
    ],
    warm: [
      'Hi! If anybody wants choreography help, genuinely, come and find me.',
      "Hello! I'm so ready. I've been so ready. I couldn't sleep.",
      'Oh, hi — sorry, I’m bouncing. I bounce when I’m happy.',
      'Hi! I will teach anybody anything. I love a group number. I have no shame.',
      'Hello! Please stretch. I mean it. I will be so annoying about this.',
      'I’m going to be jumping around all season, do not let it worry you.',
    ],
  },
  glamour: {
    big: [
      'Beauty is a job and I am extremely employed.',
      "I'm the prettiest thing in this room and that was true in the parking lot too.",
      "You'll all get used to being photographed next to this.",
      'I do not have a bad angle. I have looked. Thoroughly.',
      'Somebody dim these lights before I embarrass everybody.',
      'I am here to be gorgeous professionally, which is harder than it looks.',
    ],
    dry: [
      'This face took two hours. Please act accordingly.',
      'I do one thing and I do it perfectly. That is a strategy.',
      "I'll be gorgeous and quiet until it becomes a problem for somebody.",
      'Yes, it’s all mine. No, none of it is real. Both things are true.',
      'I have been called one-note. It is a very good note.',
      'I contour for a living and I will be doing it in this room at volume.',
    ],
    warm: [
      'Hello! Everyone looks incredible and I mean that and I hate it.',
      "Hi! I'm going to compliment all of you and I'll mean about eighty per cent of it.",
      'Oh, this is real. This is real, isn’t it. Hi. Hello.',
      'Hello! If anybody wants their face done, I have brought far too much of everything.',
      'Hi! I’m so nervous I have applied lashes twice. These are the second ones.',
      'Everybody is stunning and I am going to be insufferable about all of you.',
    ],
  },
  art: {
    big: [
      'You will not understand this immediately and that is entirely correct.',
      "Drag is a question. I'm not here to answer it, I'm here to ask it louder.",
      "I've made something nobody asked for and it is the best thing here.",
      'I have never been the prettiest and I have always been the one you remember.',
      'This is not for the front row. This is for whoever is still thinking about it tomorrow.',
      'I do not do looks. I do arguments you can wear.',
    ],
    dry: [
      "It's a concept. There's a whole document. I won't be sharing the document.",
      "I'd tell you what it means but then it would mean that.",
      "I'm the weird one. Somebody has to be, and I volunteered years ago.",
      'Half of this is deliberate. I will not be saying which half.',
      'I have been told this is not drag. By people, out loud, to my face.',
      'It’s about my childhood. Everything is about my childhood.',
    ],
    warm: [
      'Hi! I’ve brought a lot of ideas and about half of them are good.',
      'Hello! Please ask me what this is. Nobody ever asks and I get sad.',
      'Oh I like all of you already. This is going to be a lovely disaster.',
      'Hi! I want to know what everybody is scared of. Immediately. Sorry.',
      'Hello! I make strange things and I am extremely normal, I promise.',
      'I have a mood board. It has eleven pages. Would anybody like to see it?',
    ],
  },
};

/**
 * What the room does with it.
 *
 * Keyed by how the line LANDED — her delivery against the room's appetite —
 * rather than by whether it was "good", which nothing can measure. `{b}` is
 * whoever was already standing there when she came through.
 */
export const ENTRANCE_REACTIONS = {
  roars: [
    'The room goes up. {b} screams first and loudest, which {a} clocks and files away.',
    '{b} is on her feet before {a} finishes the sentence. That is the whole welcome, right there.',
    'Every queen in the room makes the same noise at the same time. {a} does not stop walking.',
    '{b} says "oh, we have a PROBLEM" and means it as the highest possible compliment.',
    'Somebody drops something. Nobody picks it up. {b} is already halfway across the room.',
    'It lands so hard that {b} has to say it back twice before anybody can hear her.',
    'The noise the room makes is the one it will spend the rest of the season trying to top.',
    '{b} points at {a}, points at the door, and points at {a} again, having lost the ability to speak.',
  ],
  warm: [
    '{b} laughs properly — not the polite one — and comes over to look at the garment.',
    'A real welcome. {b} gets to her first and the hug lasts a beat longer than a hug for a stranger.',
    'The room warms by a degree. {b} says the name back, testing it, and decides she likes it.',
    '{b} nods slowly, the way you nod at somebody you have just decided to keep an eye on kindly.',
    'Two or three of them laugh at once, which is more than most people get. {b} makes room at the mirror.',
    '{b} says "okay, she came to PLAY" to nobody in particular, and the room agrees with her.',
    'It goes down well. {a} gets a proper look-over from {b} and passes it.',
    '{b} grins and says the line back at her, badly, which is how you know it worked.',
  ],
  polite: [
    'A few laughs, one of them generous. {b} is already looking at the shoes rather than the face.',
    'The room says hello and goes back to what it was doing. {a} notices exactly how long that took.',
    '{b} smiles with her mouth. {a} has been doing this long enough to know the difference.',
    'Somebody says "cute" from behind a mirror and does not come out to say it properly.',
    'It lands about halfway. {b} gives her the nod you give a stranger in a lift.',
    'One laugh, slightly late. {a} takes it, because one is not none.',
    '{b} says hello warmly and immediately turns back to her bag.',
    'A hum of hellos. Nobody moves toward her, and she puts her case down herself.',
  ],
  cool: [
    'Nothing. Two seconds of nothing, which in this room is a paragraph.',
    '{b} looks up, looks back down, and keeps unpacking. {a} keeps the smile on anyway.',
    'The line lands in a room that was mid-conversation and stays there, unclaimed.',
    'A single "hi" from somewhere near the back. {a} decides not to hear the tone of it.',
    'It goes quiet in the way that means everybody heard it and nobody is helping.',
    '{b} says "hi" without turning round. {a} walks the rest of the way on her own.',
    'The room is eleven queens deep and has already made that noise eleven times. It does not make it again.',
    'Somebody laughs, realises they are the only one, and stops. {a} pretends not to have heard that either.',
  ],
};

/* ══════════════════════════════════════════════════════════════════
   THE REST OF THE ARRIVAL — SCHEMA ONLY, PROSE PENDING
   ══════════════════════════════════════════════════════════════════

   A premiere arrival is not a one-liner. Each queen walks in, the room
   answers, and then she TELLS THEM WHO SHE IS: what she does, how long
   she has been doing drag, where she is from, and the thing about her
   that is not on the CV. Then, when the room is full, the host arrives
   and the season starts.

   So an arrival is FOUR beats per queen plus one for the host:

     arrival:walk       her entrance line + the room's reaction   [WRITTEN]
     arrival:intro      name, city, what she does, years in drag  [PENDING]
     arrival:backstory  the thing that is not on the CV           [PENDING]
     arrival:room       how the others take her, once she settles [PENDING]
     arrival:host       RuPaul comes through the door             [PENDING]

   The two written pools are above. The three below are DELIBERATELY
   EMPTY AND EXPORTED, with their shape and placeholders fixed here, so
   the engine and the screen can be built and tested against them now and
   the prose drops in without either being touched.

   `arrivalBeats` treats an empty pool as "this beat does not happen
   yet" rather than rendering a blank — so nothing on screen is a hole
   waiting for text, and the day a pool is filled the beat simply starts
   appearing. See docs/drag-race-arrivals-brief.md for the writing brief.

   ── PLACEHOLDERS EVERY POOL BELOW MAY USE ──
     {a}      the arriving queen's name
     {b}      a queen already in the room
     {city}   where she is from
     {job}    what she does out of drag
     {years}  how long she has been doing drag, as a numeral
     {style}  her drag style, in words ("a pageant queen")
*/

/**
 * "I'm {a}, I'm from {city}, I've been doing drag {years} years."
 *
 * Keyed by attitude, same three buckets as the entrance line, because the
 * queen who arrives dry introduces herself dry.
 */
export const ARRIVAL_INTROS = { big: [], dry: [], warm: [] };

/**
 * The thing that is not on the CV.
 *
 * Keyed by drag style, because what a pageant queen volunteers about
 * herself and what an art queen volunteers are different confessions.
 */
export const ARRIVAL_BACKSTORY = {
  pageant: [], comedy: [], fashion: [], camp: [], 'club-kid': [],
  spooky: [], broadway: [], dancer: [], glamour: [], art: [],
};

/**
 * The host's arrival, once the room is full.
 *
 * Keyed by how the room is feeling when she walks in — a room that has
 * been screaming for twenty minutes and a room that has gone quiet get
 * different first words.
 */
export const ARRIVAL_HOST = { loud: [], nervous: [], ready: [] };

/**
 * The first impression — the moment somebody already in the room decides
 * something about the queen who just walked in.
 *
 * `{b}` is the one doing the deciding and `{a}` is the new arrival, which is
 * the reverse of every other pool here: this is HER read of the room, not the
 * room's read of her. Keyed by which way it went. The bond it moves is
 * already real whether or not this pool has a line — see js/dr/arrivals.js —
 * so a line here is the SENTENCE for a thing that already happened.
 */
export const ARRIVAL_IMPRESSIONS = { nice: [], shady: [] };

/**
 * Her attitude, PROPORTIONALLY.
 *
 * A weighted roll on boldness, social and temperament — never a threshold,
 * so a bold queen usually arrives big and sometimes arrives dry, and nothing
 * about a stat line locks a bucket. Returns 'big' | 'dry' | 'warm'.
 */
export function entranceAttitude(stats = {}, rng = Math.random) {
  const n = k => Math.max(1, Math.min(10, Number(stats[k]) || 5));
  const weights = {
    big: n('boldness') * 1.2 + n('social') * 0.4,
    dry: (11 - n('social')) * 0.7 + (11 - n('temperament')) * 0.8 + n('strategic') * 0.5,
    warm: n('social') * 1.1 + n('temperament') * 0.6 + (11 - n('boldness')) * 0.4,
  };
  const total = weights.big + weights.dry + weights.warm;
  let roll = rng() * total;
  for (const [k, w] of Object.entries(weights)) {
    roll -= w;
    if (roll <= 0) return k;
  }
  return 'warm';
}

/**
 * How hard the line landed, PROPORTIONALLY.
 *
 * Her delivery (boldness, social, and the star power the show has already
 * decided it wants) against a room that gets harder to impress as it fills
 * up: the twelfth queen through the door walks into a room that has already
 * made that noise eleven times.
 */
export function entranceLanding(stats = {}, { star = 5, position = 0, castSize = 12 } = {}, rng = Math.random) {
  const n = k => Math.max(1, Math.min(10, Number(stats[k]) || 5));
  const fatigue = castSize > 1 ? (position / (castSize - 1)) * 2.4 : 0;
  const score = n('boldness') * 0.34 + n('social') * 0.3 + Number(star || 5) * 0.36
    - fatigue + (rng() - 0.5) * 3.2;
  if (score >= 7.4) return 'roars';
  if (score >= 5.6) return 'warm';
  if (score >= 4.0) return 'polite';
  return 'cool';
}
