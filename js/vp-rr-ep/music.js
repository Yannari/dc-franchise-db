// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/music.js — what the Ridonculous Race sounds like, place by place, moment by moment
// ══════════════════════════════════════════════════════════════════════
//
// DATA ONLY (no DOM, no audio): the viewer's sound module (sound.js), the shopping list
// (assets/audio/rr/README.md, written from this file by tools/rr-vp-music.mjs) and the tests
// read it. The user's rule (2026-10-19): "different music for each place and in each place
// for each specific moment". Every place has its own sound (spec §9.6: the sound depends on
// the place), and each moment of a leg has its own track there:
//
//   assets/audio/rr/<place>/<moment>.mp3      (a bed, looped under the screens of that moment)
//   assets/audio/rr/race/<sting>.mp3          (the race's own stings, the same in every place)
//
// A missing file is silence, or the race-wide bed for that moment (assets/audio/rr/race/<moment>.mp3),
// or, where it genuinely fits the place, an ambience already in the repo (AMBIENCE below).
// Never a Total Drama bed: the race has its own sound or none.

export const MOMENTS = {
  opener:       { when: 'the title card of the place, Don at the start line, the first look at the place', len: '40-60 s loop', shape: 'bright, confident, the place in its first bars' },
  travel:       { when: 'on the road: the airport arrival, cabs, rides and runs between the tasks', len: '60 s loop', shape: 'moving, steady pulse, 100-130 bpm, never heavy' },
  challenge:    { when: 'at a task: the Don Box tip, teams starting and working at it', len: '60 s loop', shape: 'driving, building, percussion forward, 110-140 bpm' },
  struggle:     { when: 'a team failing, retrying, freezing, quitting, a task going wrong', len: '45 s loop', shape: 'tense, low, ticking, unresolved (strings or the place\'s drums, minor)' },
  'chill-zone': { when: 'the Chill Zone: Don on the mat, the teams checked in, the placements', len: '45 s loop', shape: 'relief and a little swagger, mid-tempo, warm' },
  elimination:  { when: 'the last team is out: Don\'s verdict and the goodbye', len: '30-45 s loop', shape: 'sombre and short, slow, sparse, one or two instruments' },
  recap:        { when: '"Previously" over the world map and last time\'s clips', len: '30-40 s loop', shape: 'quick, punchy, recap energy, the place still in it' },
  interview:    { when: 'the confessionals in front of the map', len: '40 s loop', shape: 'light, low, under a voice: soft pulse, no melody fighting the words' },
};

// The race's own sounds, the same in every place.
export const RACE_SOUNDS = {
  logo:        { kind: 'sting', when: 'the show open: the logo slams in', want: 'a 3-5 s punchy rock or orchestral hit, big drums, a riser into a hit', search: 'logo sting, rock hit, intro stinger, epic hit' },
  title:       { kind: 'sting', when: 'the place\'s title card lands', want: 'a 2-3 s whoosh-and-hit, bright', search: 'whoosh hit, transition sting, title hit' },
  donbox:      { kind: 'sting', when: 'the tip card flies out of the Don Box', want: 'a 2-3 s quirky reveal: a pizzicato or marimba flourish', search: 'reveal sting, quirky flourish, pizzicato sting' },
  boomerang:   { kind: 'sting', when: 'BOOMERANG!', want: 'a 2-3 s comic brass stab or a spinning whoosh into a hit', search: 'comic brass stab, cartoon hit' },
  penalty:     { kind: 'sting', when: 'PENALTY, YIELD, ZIP IT, SPEED BUMP, MEDEVAC', want: 'a 2-3 s low brass "uh-oh" hit', search: 'dramatic hit, low brass sting, uh oh' },
  eliminated:  { kind: 'sting', when: 'ELIMINATED', want: 'a 3-4 s dark hit with a long tail', search: 'dramatic sting, dark hit, sad sting' },
  safe:        { kind: 'sting', when: 'NON-ELIMINATION, SAVE', want: 'a 2-3 s bright relief chord', search: 'success sting, relief, bright chord' },
  placement:   { kind: 'sting', when: 'Don reads a placement on the mat', want: 'a 1-2 s drum hit or cymbal swell into a hit', search: 'drum hit, impact sting' },
  winners:     { kind: 'sting', when: 'THE WINNERS!', want: 'a 4-6 s fanfare, brass and cymbals', search: 'victory fanfare, triumph sting' },
  flight:      { kind: 'bed', when: 'in the air: the cabin, the galley, the map with the plane', want: 'a calm 60 s loop, airy pads and a soft beat', search: 'lounge, airy, chill electronic, travel' },
  finale:      { kind: 'bed', when: 'the final mat: the winners crowned', want: 'a 60 s anthem loop, rock or orchestra, triumphant', search: 'triumphant anthem, epic victory, uplifting rock' },
  theme:       { kind: 'bed', when: 'the show open and NEXT TIME', want: 'a 40 s loop of upbeat pop-rock, the race\'s own theme feel', search: 'upbeat rock, adventure pop rock, energetic' },
};

// Every place: its instruments and mood (the README's headline), and what each moment wants there.
// The README must not name a real country or city; nor may anything on screen.
export const PLACE_MUSIC = {
  'home-city': {
    name: 'Home City', feel: 'the start line: a big modern city, bright pop-rock, electric guitars, handclaps',
    search: 'upbeat pop rock, indie rock, city, energetic',
    moments: {
      opener: 'bright pop-rock with handclaps, the race about to begin',
      travel: 'a running indie-rock groove, the dash to the tower',
      challenge: 'driving rock with a big beat: the stairs or the sky-deck',
      struggle: 'tense electric pulses, a ticking hi-hat: heights, a zipline nobody wants',
      'chill-zone': 'laid-back funky pop, relief',
      elimination: 'a slow solo piano or guitar, two minutes too long for the first leg',
      recap: 'quick, punchy pop-rock',
      interview: 'a soft electronic pulse under the voice',
    },
  },
  'red-sand-desert': {
    name: 'Red Sand Desert', feel: 'desert market: oud, darbuka and hand drums, ney flute, a spice-market bustle',
    search: 'oud, middle eastern percussion, darbuka, desert, bazaar',
    moments: {
      opener: 'oud melody over hand drums, sunlit and wide',
      travel: 'a camel-gait groove on frame drums and oud',
      challenge: 'a busy bazaar: fast darbuka, oud runs, shakers',
      struggle: 'low drones and tense hand drums, the heat getting to them',
      'chill-zone': 'a relaxed oud groove in the shade',
      elimination: 'a slow, lonely ney flute or oud solo',
      recap: 'quick percussion with an oud hook',
      interview: 'soft frame drum and a drone',
    },
  },
  'iron-tower-city': {
    name: 'Iron Tower City', feel: 'old-world city: accordion, musette waltz, café jazz, pizzicato strings; the catacombs spooky',
    search: 'accordion, musette, cafe, waltz, gypsy jazz',
    moments: {
      opener: 'a jaunty accordion waltz',
      travel: 'café jazz swing, a cab through cobbled streets',
      challenge: 'quick pizzicato and accordion, comic and busy',
      struggle: 'the catacombs: creeping low strings and a music box',
      'chill-zone': 'a gentle café accordion',
      elimination: 'a slow, sad accordion or solo cello',
      recap: 'a quick swinging gypsy-jazz turn',
      interview: 'soft café guitar',
    },
  },
  'great-wall-hills': {
    name: 'Great Wall Hills', feel: 'mountain wall and old streets: guzheng, erhu, pentatonic flutes, big drums',
    search: 'guzheng, erhu, asian, pentatonic, oriental drums',
    moments: {
      opener: 'a sweeping pentatonic theme on plucked strings and flute',
      travel: 'a light bowed-string melody over a walking beat, the rickshaw road',
      challenge: 'big drums and plucked strings, a skydive and bug skewers',
      struggle: 'tense low drums and a bending bowed string',
      'chill-zone': 'calm plucked strings, a garden at dusk',
      elimination: 'a slow, sad bamboo flute solo',
      recap: 'quick drums with a pentatonic hook',
      interview: 'soft plucked strings, sparse',
    },
  },
  'rock-north': {
    name: 'Rock North', feel: 'the snowy north: fiddle and folk drums, icy bells, and a heavy-rock streak (air guitar)',
    search: 'nordic folk, fiddle, celtic, icy, heavy rock, viking',
    moments: {
      opener: 'a stomping folk fiddle tune, cold air and drums',
      travel: 'a running folk reel, snow on the cab',
      challenge: 'heavy guitar rock: the sauna and the air guitar',
      struggle: 'icy bells and a low drone: the frozen river',
      'chill-zone': 'a warm folk tune by the fire',
      elimination: 'a slow, lonely fiddle lament',
      recap: 'a quick rock riff',
      interview: 'soft bells and a low pad',
    },
  },
  'savanna-falls': {
    name: 'Savanna Falls', feel: 'the savanna and the falls: marimba, kalimba, djembe and log drums, a choir in the distance',
    search: 'african percussion, marimba, kalimba, djembe, safari, tribal',
    moments: {
      opener: 'marimba and djembe, sunrise over the plain',
      travel: 'a bouncing jeep groove on shakers and log drums',
      challenge: 'driving djembe and log drums, the selfie over the edge',
      struggle: 'tense low drums, the rhino too close',
      'chill-zone': 'a happy kalimba groove',
      elimination: 'a slow kalimba or soft choir',
      recap: 'quick drums and marimba',
      interview: 'a soft kalimba pattern',
    },
  },
  'treasure-isles': {
    name: 'Treasure Isles', feel: 'pirate islands: sea-shanty accordion and fiddle, steel drums, calypso',
    search: 'pirate, sea shanty, calypso, steel drum, caribbean',
    moments: {
      opener: 'a swaggering pirate shanty',
      travel: 'a calypso groove, a jet ski over the bay',
      challenge: 'a fast shanty jig: X marks the map',
      struggle: 'deep-water tension: low strings and bubbles, the dive for gold',
      'chill-zone': 'steel drums in the sun',
      elimination: 'a slow sailor\'s lament on accordion',
      recap: 'a quick jig',
      interview: 'soft steel drum or ukulele',
    },
  },
  'tomb-sands': {
    name: 'Tomb Sands', feel: 'the ancient tombs: low strings, ney and darbuka, a mystery, an adventure film\'s sand and torches',
    search: 'ancient, mysterious, middle eastern, adventure, archaeology',
    moments: {
      opener: 'a grand ancient-mystery theme',
      travel: 'a rolling camel-ride groove, drums and a drone',
      challenge: 'an adventure-film chase: strings and big drums, over or under the pyramid',
      struggle: 'the tomb: dark, creeping, a mummy in the dark',
      'chill-zone': 'a calm river at dusk, a soft drone and oud',
      elimination: 'a slow, dark lament',
      recap: 'quick drums with a mystery hook',
      interview: 'a soft low drone',
    },
  },
  'torch-statue-harbour': {
    name: 'Torch Statue Harbour', feel: 'the big harbour city: brass-band funk, jazz, a boom-bap beat',
    search: 'funk, brass, jazz, hip hop beat, big band, urban',
    moments: {
      opener: 'big-band brass, the statue in the harbour',
      travel: 'a funky bass line, a boat across the harbour',
      challenge: 'brassy funk at full tilt: up to the crown',
      struggle: 'the sewer: a dark, dripping beat',
      'chill-zone': 'smooth jazz-hop',
      elimination: 'a slow, sad jazz piano',
      recap: 'a quick funk break',
      interview: 'a soft lo-fi beat',
    },
  },
  'red-outback': {
    name: 'Red Outback', feel: 'the red outback: didgeridoo and clapsticks, twangy guitar, banjo',
    search: 'didgeridoo, country, banjo, bluegrass, outback, western',
    moments: {
      opener: 'a twangy guitar and banjo over a drone',
      travel: 'a galloping bluegrass groove, the emu ride',
      challenge: 'fast banjo and stomps: catch your ride',
      struggle: 'didgeridoo drone and tense clapsticks: the bungee',
      'chill-zone': 'a lazy campfire guitar',
      elimination: 'a slow, lonely harmonica or slide guitar',
      recap: 'a quick banjo run',
      interview: 'soft fingerpicked guitar',
    },
  },
  'fire-mountain-isle': {
    name: 'Fire-Mountain Isle', feel: 'the volcano island: ukulele and slack-key guitar, log drums, and lava rumbling under it',
    search: 'ukulele, hawaiian, tiki, tropical, island, log drums',
    moments: {
      opener: 'a sunny ukulele and slack-key theme',
      travel: 'a jungle trek on log drums and shakers',
      challenge: 'driving island drums: lava or falls',
      struggle: 'deep rumbling drums and tense strings: the lava rocks',
      'chill-zone': 'a lazy tiki-bar ukulele',
      elimination: 'a slow, soft slack-key guitar',
      recap: 'quick island drums',
      interview: 'soft ukulele',
    },
  },
  'skyline-finale': {
    name: 'Skyline City', feel: 'the final leg: an anthem, epic orchestra and rock, the city skyline at the end of the world',
    search: 'epic, orchestral, anthem, triumphant, cinematic rock',
    moments: {
      opener: 'an epic, rising orchestral theme',
      travel: 'a driving cinematic rock pulse, the drive into the city',
      challenge: 'big orchestral action: the stairs and the buoys',
      struggle: 'tense, building strings: everything on one task',
      'chill-zone': 'a proud, warm anthem: the midpoint',
      elimination: 'a slow, bittersweet orchestral cue',
      recap: 'a quick epic montage',
      interview: 'a soft cinematic pad',
    },
  },
};

export const PLACE_IDS = Object.keys(PLACE_MUSIC);
export const MOMENT_IDS = Object.keys(MOMENTS);
export const RR_AUDIO = 'assets/audio/rr/';
export const placeFile = (place, moment) => `${RR_AUDIO}${place}/${moment}.mp3`;
export const raceFile = name => `${RR_AUDIO}race/${name}.mp3`;

// Ambience already in the repo that genuinely fits a place, used only when that place's music file is missing
// (the sea and the gulls on an island, the jungle on the savanna). Nowhere else: a wrong ambience is worse than silence.
export const AMBIENCE = {
  'treasure-isles': 'assets/audio/td/amb/island-day.ogg',
  'fire-mountain-isle': 'assets/audio/ch/amb-jungle.mp3',
  'savanna-falls': 'assets/audio/ch/amb-jungle.mp3',
};
