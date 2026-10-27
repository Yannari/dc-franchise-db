// ══════════════════════════════════════════════════════════════════════
// ss/secret-pool.js — the personal secrets a Secret Story housemate can hide
// ══════════════════════════════════════════════════════════════════════
//
// The real show's secrets were facts about a life: "I survived the tsunami",
// "I was swapped at birth", "I'm a chess grandmaster", "I have lived with the
// lungs of somebody else" (docs/research/secret-story-france.md). This pool is
// written in that spirit for housemates who have no franchise history to draw
// a secret from. A drawn secret becomes canon for the character once the
// season starts (js/ss/casting.js), so nothing here is ever handed to two
// people.
//
// Rules for an entry (the user, 2026-10-22: no brand names):
//   · never a real celebrity, brand, team or place. "A famous footballer",
//     never a name; "a capital in the north", never a city.
//   · CLUES are things the Voice can hide in the house or hand out: an object,
//     a word, a picture, a sound. Concrete, and each one only half a step.
//   · TELLS are what the holder does that gives it away to somebody watching.
//   · DIFFICULTY 0..1: how far the clues are from the answer.
//   · `tags` say who it suits (stats, archetypes, age). A tag is a preference
//     for the draw, never a requirement: anybody can hold any secret.

/** The kinds a secret can be. A secret you write yourself picks one, which
 *  gives it clues and tells (KIND_KIT below). */
export const SECRET_KINDS = [
  { id: 'survived', label: 'Survived something' },
  { id: 'talent', label: 'A hidden talent' },
  { id: 'record', label: 'A record or a title' },
  { id: 'job', label: 'An unexpected job' },
  { id: 'body', label: 'Something about my body' },
  { id: 'family', label: 'A family story' },
  { id: 'past', label: 'A past life' },
  { id: 'belief', label: 'Something I believe or can do' },
  { id: 'love', label: 'A love story' },
  { id: 'money', label: 'Money' },
];

const S = (id, kind, text, clues, tells, difficulty, tags = []) => ({ id, kind, text, clues, tells, difficulty, tags });

export const SECRET_POOL = [
  // ── survived ──
  S('plane-crash', 'survived', 'I survived a plane crash',
    ['a seat belt buckle', 'a toy aeroplane with a broken wing', 'the word "altitude"', 'a boarding pass with no name'],
    ['goes quiet whenever anybody mentions flying', 'checks where the exits are in every room'], 0.6, ['endurance', 'temperament']),
  S('avalanche', 'survived', 'I was buried by an avalanche for four hours',
    ['a snow globe', 'a ski glove', 'a stopwatch stopped at 4:00', 'the word "breath"'],
    ['cannot stand being cold', 'talks about luck more than anybody'], 0.55, ['endurance']),
  S('shark', 'survived', 'I was bitten by a shark and kept surfing',
    ['a surfboard fin', 'a jar of sea water', 'a scar drawn on paper', 'the word "fin"'],
    ['never goes in the deep end of the pool', 'hides one leg under a blanket'], 0.5, ['physical', 'boldness']),
  S('lightning', 'survived', 'I was struck by lightning twice',
    ['a cloud cut out of paper', 'the number 2', 'a burnt match', 'a weather report'],
    ['flinches at every thunderclap', 'jokes that nothing can kill them'], 0.6, ['boldness']),
  S('coma', 'survived', 'I woke up from a coma that lasted a year',
    ['an alarm clock', 'a calendar with every page blank', 'a pillow', 'the word "awake"'],
    ['gets dates and old songs wrong', 'hates sleeping late'], 0.65, ['temperament']),
  S('fire', 'survived', 'I carried my neighbours out of a burning building',
    ['a fireman\'s helmet', 'a smoke alarm', 'a key ring with six keys', 'the word "stairs"'],
    ['first to notice the smell of burning in the kitchen', 'never takes credit for anything'], 0.5, ['hero', 'physical']),
  S('desert', 'survived', 'I was lost in the desert for three days',
    ['a compass', 'an empty water bottle', 'a pinch of sand', 'the number 3'],
    ['drinks water constantly', 'always knows which way north is'], 0.55, ['endurance', 'intuition']),

  // ── talent ──
  S('chess', 'talent', 'I am a chess grandmaster',
    ['a black knight', 'a clock with two faces', 'the letters "Gm"', 'a squared tablecloth'],
    ['thinks several moves ahead out loud', 'stares at the board game cupboard'], 0.45, ['mental', 'strategic']),
  S('memory', 'talent', 'I can remember every day of my life',
    ['a diary with every page full', 'a date in red ink', 'an elephant figurine', 'the word "yesterday"'],
    ['quotes what people said word for word', 'knows what everybody ate on day one'], 0.5, ['mental', 'perceptive-player']),
  S('voice', 'talent', 'I can imitate any voice I hear',
    ['a microphone', 'a parrot feather', 'a cassette with the label torn off', 'a mirror'],
    ['slips into other people\'s accents', 'repeats lines from the confessional too well'], 0.5, ['social', 'wildcard']),
  S('pickpocket', 'talent', 'I can take anything out of anybody\'s pocket',
    ['a wallet tied with string', 'a glove with no fingers', 'a coin that vanishes', 'the word "light"'],
    ['things go missing near them and come back', 'always fidgeting with something small'], 0.55, ['schemer', 'boldness']),
  S('ventriloquist', 'talent', 'I am a ventriloquist',
    ['a puppet\'s hand', 'a pair of glasses with no lenses', 'a closed mouth drawn on a card', 'the word "throw"'],
    ['voices nobody can place in the room', 'talks to objects as a joke'], 0.6, ['wildcard', 'chaos-agent']),
  S('opera', 'talent', 'I sing opera at a professional level',
    ['a music stand', 'a scarf around a bottle', 'the word "aria"', 'a high note drawn as a mountain'],
    ['warms up their voice in the shower', 'protects their throat from the cold'], 0.45, ['social']),
  S('knives', 'talent', 'I throw knives in a travelling show',
    ['a target with one hole', 'a blindfold', 'a red balloon', 'the word "aim"'],
    ['juggles cutlery', 'never misses the bin from across the room'], 0.55, ['physical', 'boldness']),
  S('dice', 'talent', 'I can count cards and I have been banned from a casino',
    ['an ace of hearts', 'a pair of dice', 'a ban letter with the name blacked out', 'the number 21'],
    ['counts everything without meaning to', 'wins every card game in the house'], 0.5, ['mental', 'strategic']),

  // ── record / title ──
  S('marathon', 'record', 'I hold a record for running backwards',
    ['a running shoe worn at the heel', 'a rear-view mirror', 'a medal on a ribbon', 'the word "reverse"'],
    ['walks backwards without noticing', 'up at dawn to run'], 0.6, ['physical', 'endurance']),
  S('eating', 'record', 'I am a speed-eating champion',
    ['a stopwatch', 'a stack of plates', 'a paper bib', 'the word "seconds"'],
    ['finishes every meal first', 'never full'], 0.45, ['endurance']),
  S('arm-wrestling', 'record', 'I am a national arm-wrestling champion',
    ['an elbow pad', 'a chalk bag', 'two hands clasped, drawn', 'the word "grip"'],
    ['challenges people at the table for fun', 'handshake like a vice'], 0.4, ['physical', 'challenge-beast']),
  S('spelling', 'record', 'I won a national spelling contest as a child',
    ['a dictionary with one page folded', 'a trophy shaped like a letter', 'the letters "B-E-E"', 'a buzzer'],
    ['corrects everybody\'s words', 'spells words out under their breath'], 0.5, ['mental']),
  S('youngest-pilot', 'record', 'I became a pilot at sixteen',
    ['a pair of wings pin', 'a headset', 'the number 16', 'a paper aeroplane'],
    ['knows every cloud by name', 'reads the sky before the weather report'], 0.5, ['boldness', 'mental']),
  S('dance-title', 'record', 'I am a world champion in a dance nobody here has heard of',
    ['a dance shoe with a metal tip', 'a sequin', 'a gold rosette', 'the word "spin"'],
    ['dances when nobody is watching', 'perfect posture all day'], 0.5, ['physical', 'social']),
  S('quiz', 'record', 'I won a television quiz and never told anybody',
    ['a buzzer with no wire', 'a question card', 'a cheque cut in half', 'the word "final"'],
    ['answers every trivia question first', 'refuses to play quiz games'], 0.55, ['mental']),

  // ── job ──
  S('undertaker', 'job', 'I work as an undertaker',
    ['a black tie', 'a white lily', 'a measuring tape', 'the word "rest"'],
    ['completely calm around anything gruesome', 'very good at comforting people'], 0.5, ['temperament', 'loyal-soldier']),
  S('bodyguard', 'job', 'I was the bodyguard of a very famous person',
    ['an earpiece', 'dark glasses', 'a guest list', 'the word "shadow"'],
    ['always sits facing the door', 'notices everybody who comes in'], 0.45, ['physical', 'intuition']),
  S('detective', 'job', 'I am a private detective',
    ['a magnifying glass', 'a notebook with names crossed out', 'a hat', 'the word "file"'],
    ['asks questions and never answers them', 'remembers who was where'], 0.5, ['intuition', 'perceptive-player']),
  S('lion-tamer', 'job', 'I worked with lions in a circus',
    ['a whip with no lash', 'a stool with three legs', 'a tuft of yellow fur', 'the word "roar"'],
    ['completely fearless with the house\'s animals', 'talks about cats a lot'], 0.55, ['boldness']),
  S('nun', 'job', 'I spent three years in a convent',
    ['a rosary', 'a candle', 'a bell', 'the word "silence"'],
    ['up before everybody for a quiet minute', 'knows hymns by heart'], 0.6, ['loyalty', 'hero']),
  S('magician-assistant', 'job', 'I was sawn in half every night for two years',
    ['a box with a line painted round it', 'a top hat', 'a white glove', 'a saw made of cardboard'],
    ['folds into small spaces', 'knows how every trick is done'], 0.55, ['physical', 'social']),
  S('stunt-double', 'job', 'I am a stunt double in action films',
    ['a crash mat', 'a clapperboard', 'a wig', 'the word "fall"'],
    ['falls over on purpose to make people laugh', 'bruises nobody can explain'], 0.45, ['physical', 'boldness']),
  S('perfume', 'job', 'I am a professional nose: I invent perfumes',
    ['a glass vial', 'a strip of white card', 'a flower pressed in a book', 'the word "note"'],
    ['can tell who was in a room by the smell', 'sniffs everything before eating it'], 0.5, ['intuition']),
  S('spy-school', 'job', 'I used to teach people how to lie',
    ['a polygraph needle', 'a smiling mask', 'a deck of cards with two jokers', 'the word "tell"'],
    ['spots everybody else\'s lies', 'never looks away when talking'], 0.6, ['strategic', 'mastermind']),

  // ── body ──
  S('twelve-fingers', 'body', 'I was born with twelve fingers',
    ['a glove with six fingers', 'the number 12', 'a ring', 'a hand drawn on paper'],
    ['keeps their hands in their pockets', 'hates having their hands photographed'], 0.55, []),
  S('transplant', 'body', 'I live with the heart of somebody else',
    ['a heart drawn in two colours', 'a hospital bracelet', 'a thank-you letter', 'the word "beat"'],
    ['careful with the hardest physical games', 'very emotional about strangers being kind'], 0.6, ['temperament']),
  S('no-pain', 'body', 'I cannot feel pain',
    ['a feather', 'a pin cushion', 'a thermometer', 'the word "nothing"'],
    ['never flinches when hurt', 'checks themselves for injuries after every game'], 0.65, ['endurance', 'challenge-beast']),
  S('reconstructed', 'body', 'Half of my face was rebuilt after an accident',
    ['a mirror cut in half', 'a mould of a cheek', 'a photo with half torn away', 'the word "symmetry"'],
    ['always photographed from one side', 'touches one cheek when nervous'], 0.6, []),
  S('one-kidney', 'body', 'I gave a kidney to my brother',
    ['a bean', 'two names on one card', 'a gift ribbon', 'the word "half"'],
    ['protective of their side in contact games', 'talks about their brother constantly'], 0.5, ['loyalty', 'hero']),
  S('colour-blind', 'body', 'I cannot see colours at all',
    ['a black and white photo', 'a red and a green card', 'a paint brush', 'the word "grey"'],
    ['asks what colour things are', 'clothes that never match'], 0.45, []),

  // ── family ──
  S('swapped', 'family', 'I was swapped at birth',
    ['two baby bracelets', 'a cradle', 'a family photo with a stranger in it', 'the word "mistake"'],
    ['strange about their own birthday', 'says family is who you choose'], 0.6, ['loyalty']),
  S('sixteen-siblings', 'family', 'I am the eldest of sixteen brothers and sisters',
    ['a pile of sixteen socks', 'a very long dinner table', 'the number 16', 'a whistle'],
    ['organises the kitchen like a general', 'cannot sleep in a quiet room'], 0.45, ['social', 'loyal-soldier']),
  S('lost-twin', 'family', 'I only found out I had a twin when I was twenty',
    ['two halves of one photo', 'a birth certificate with a second name', 'a mirror', 'the number 2'],
    ['talks about "the other me" as a joke', 'stares at people who look alike'], 0.6, ['intuition']),
  S('royal', 'family', 'I am descended from a royal family',
    ['a paper crown', 'a family tree', 'a signet ring', 'the word "heir"'],
    ['impeccable table manners', 'uses words nobody else uses'], 0.5, ['villain', 'social']),
  S('famous-parent', 'family', 'My father is a famous athlete',
    ['a whistle', 'a signed shirt with the name cut out', 'a trophy', 'the word "legacy"'],
    ['knows far too much about one sport', 'goes quiet when anybody talks about famous families'], 0.45, ['physical']),
  S('adopted-by-circus', 'family', 'I was raised by a circus family',
    ['a red nose', 'a tent peg', 'a tightrope', 'the word "travel"'],
    ['can balance on anything', 'has lived in a hundred towns'], 0.55, ['physical', 'wildcard']),

  // ── past ──
  S('child-star', 'past', 'I was a child star in a soap opera',
    ['a script with one line underlined', 'a clapperboard', 'a baby photo in make-up', 'the word "episode"'],
    ['knows exactly where the camera is', 'cries on cue'], 0.45, ['social', 'showmancer']),
  S('prison', 'past', 'I was born in a prison',
    ['a key', 'a barred window drawn on paper', 'a baby blanket', 'the word "visit"'],
    ['very private about their childhood', 'never complains about the house being locked'], 0.6, ['underdog']),
  S('homeless', 'past', 'I lived in my car for a year',
    ['a car key', 'a sleeping bag', 'a road map', 'the word "parked"'],
    ['sleeps anywhere', 'never wastes food'], 0.55, ['underdog', 'endurance']),
  S('cult', 'past', 'I escaped from a cult',
    ['a white robe', 'a broken necklace', 'a closed door', 'the word "free"'],
    ['suspicious of anybody who leads a group', 'hates chanting games'], 0.6, ['intuition']),
  S('rich-to-zero', 'past', 'I was a millionaire at twenty and broke at twenty-two',
    ['an empty wallet', 'a gold card cut in two', 'a toy sports car', 'the number 22'],
    ['knows how expensive things are', 'careful with the kitty'], 0.5, ['strategic']),
  S('former-monk', 'past', 'I lived a year in total silence',
    ['a finger on lips, drawn', 'a bell', 'a closed book', 'the word "quiet"'],
    ['can stay silent for hours', 'meditates in the garden'], 0.55, ['temperament']),

  // ── belief / ability ──
  S('ghosts', 'belief', 'I hunt ghosts for a living',
    ['a torch', 'an old radio', 'a white sheet', 'the word "presence"'],
    ['hears noises at night nobody else hears', 'asks about the house\'s history'], 0.5, ['wildcard', 'chaos-agent']),
  S('medium', 'belief', 'I speak to the dead',
    ['a crystal ball', 'a candle', 'a deck of tarot cards', 'the word "beyond"'],
    ['reads people\'s futures as a party trick', 'says they had a dream about somebody'], 0.45, ['intuition', 'wildcard']),
  S('aliens', 'belief', 'I have been abducted by aliens',
    ['a tin-foil hat', 'a star map', 'a green light', 'the word "contact"'],
    ['watches the sky every night', 'very interested in lights'], 0.5, ['chaos-agent']),
  S('sleepwalker', 'belief', 'I sleepwalk, and I have done strange things asleep',
    ['a pillow', 'a moon', 'a pair of slippers on the wrong feet', 'the word "night"'],
    ['found somewhere else in the morning', 'locks their own door at night'], 0.55, []),
  S('lucky', 'belief', 'I have won the lottery twice',
    ['a four-leaf clover', 'two tickets', 'a horseshoe', 'the number 7'],
    ['insanely lucky at every game of chance', 'superstitious about everything'], 0.55, []),

  // ── love ──
  S('married-ten', 'love', 'I have been married five times',
    ['five rings on a string', 'a wedding veil', 'a divorce stamp', 'the number 5'],
    ['knows every wedding tradition', 'says "never again" too often'], 0.5, ['showmancer']),
  S('love-letters', 'love', 'I have written love letters to the same person every day for ten years',
    ['an envelope with no stamp', 'a fountain pen', 'a ribbon tying a stack of paper', 'the word "daily"'],
    ['writes in a notebook every night', 'sighs at the post'], 0.55, ['loyalty', 'showmancer']),
  S('engaged-tv', 'love', 'I proposed on live television and was refused',
    ['a ring box, empty', 'a microphone', 'a red rose', 'the word "no"'],
    ['awkward whenever anybody mentions proposals', 'romantic but careful'], 0.5, ['showmancer']),
  S('arranged', 'love', 'I am engaged to somebody I have never met',
    ['a photo with the face covered', 'an invitation with no date', 'a ring on the wrong finger', 'the word "promise"'],
    ['refuses every flirt politely', 'talks about "the future" vaguely'], 0.6, ['loyalty']),

  // ── money ──
  S('treasure', 'money', 'I found a treasure buried in my garden',
    ['a shovel', 'a gold coin', 'a map with an X', 'the word "dig"'],
    ['digs in the garden for no reason', 'knows about old coins'], 0.5, ['boldness']),
  S('heir', 'money', 'I will inherit a fortune if I stay single until thirty',
    ['a will', 'a calendar with one date circled', 'a locked chest', 'the number 30'],
    ['refuses romance with real effort', 'very interested in birthdays'], 0.6, ['strategic']),
  S('gave-away', 'money', 'I gave away all the money I had won',
    ['an open hand drawn on paper', 'a charity receipt', 'a piggy bank, broken', 'the word "share"'],
    ['generous with the kitty', 'not tempted by money dilemmas'], 0.5, ['hero', 'loyalty']),
];

/* A secret you write yourself gets the clues and tells of its kind, so the
   hunt has something to work with even though nobody wrote them for it. */
export const KIND_KIT = {
  survived: { clues: ['a newspaper clipping with the headline cut out', 'a scar drawn on paper', 'the word "lucky"'], tells: ['goes quiet when anybody tells a near-miss story'] },
  talent: { clues: ['a medal with no ribbon', 'a practice timetable', 'the word "gift"'], tells: ['very good at something nobody asked them to do'] },
  record: { clues: ['a trophy', 'a certificate with the name blacked out', 'the word "first"'], tells: ['competitive about the one thing they never mention'] },
  job: { clues: ['a work badge with the photo torn off', 'a uniform button', 'the word "shift"'], tells: ['handles some tasks like a professional'] },
  body: { clues: ['an X-ray', 'a mirror', 'the word "different"'], tells: ['careful about one part of themselves'] },
  family: { clues: ['a family photo with a face cut out', 'a birth certificate', 'the word "blood"'], tells: ['strange about their family when it comes up'] },
  past: { clues: ['an old key', 'a photo from years ago', 'the word "before"'], tells: ['avoids talking about a whole stretch of their life'] },
  belief: { clues: ['a candle', 'a crystal', 'the word "sign"'], tells: ['sees meaning in coincidences'] },
  love: { clues: ['a ring', 'a love letter', 'the word "forever"'], tells: ['awkward about romance in the house'] },
  money: { clues: ['a coin', 'a wallet', 'the word "fortune"'], tells: ['strange about the kitty'] },
};

/** A secret written by the user, given what the hunt needs from its kind. */
export function ownSecret(text, kind) {
  const k = KIND_KIT[kind] ? kind : 'past';
  return { id: null, kind: k, text: String(text || '').trim(), clues: [...KIND_KIT[k].clues],
    tells: [...KIND_KIT[k].tells], difficulty: 0.55, tags: [] };
}

/** How well an entry suits a player: 1, plus a little per matching tag. A
 *  preference for the draw, never a requirement. */
export function secretFit(entry, player) {
  if (!entry || !player) return 1;
  const st = player.stats || {};
  let w = 1;
  for (const t of entry.tags || []) {
    if (t === player.archetype) w += 1.5;
    else if (Number.isFinite(Number(st[t]))) w += Math.max(0, Number(st[t]) - 5) * 0.25;
  }
  return w;
}

/**
 * Draw a secret for a player: weighted by fit, never one in `taken` (ids
 * already held by somebody, in this cast or as anybody's canon).
 */
export function drawSecret(player, { rng = Math.random, taken = new Set() } = {}) {
  const open = SECRET_POOL.filter(e => !taken.has(e.id));
  if (!open.length) return null;
  const weights = open.map(e => secretFit(e, player));
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < open.length; i++) { r -= weights[i]; if (r <= 0) return { ...open[i] }; }
  return { ...open[open.length - 1] };
}
