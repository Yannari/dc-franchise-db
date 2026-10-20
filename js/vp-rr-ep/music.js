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
  'coast-palace': {
    name: 'Coast Palace', feel: 'the glamorous coast: lounge piano and bossa guitars on a yacht deck, a surf-rock twang for the sharks',
    search: 'lounge, bossa nova, riviera, surf rock, cocktail jazz',
    moments: {
      opener: 'a bright, grooving lounge piano: the palace gates and the sea',
      travel: 'a bouncy café groove along the coast',
      challenge: 'surf-rock guitar and organ: the shark and the sand palace',
      struggle: 'a dark spy groove: a fin going past, a palace slumping',
      'chill-zone': 'a relaxed bossa guitar on the harbour',
      elimination: 'a simple, sombre solo piano',
      recap: 'a quick surf-guitar riff',
      interview: 'a soft bossa nova under the voice',
    },
  },
  'geyser-island': {
    name: 'Geyser Island', feel: 'the icy north: celesta and cold strings, glass marimba and low brass, eerie and clear as ice',
    search: 'ice, frost, celesta, eerie, nordic, mystical, cold',
    moments: {
      opener: 'a mysterious celesta and strings theme, snow on the peaks',
      travel: 'a cold, grooving synth pulse on the mountain road',
      challenge: 'a dark, driving, slightly comic orchestra: the geysers and the feast',
      struggle: 'eerie glass marimba and flutes: steam, ice and a phrase nobody remembers',
      'chill-zone': 'a calm, bright northern pad',
      elimination: 'slow, somber low brass',
      recap: 'quick dark strings and celesta',
      interview: 'a light, mystical celesta and clarinet',
    },
  },
  'carnival-rainforest': {
    name: 'Carnival Rainforest', feel: 'carnival in the rainforest: samba percussion, surdo and tamborim, a parade with horns',
    search: 'samba, carnival, batucada, latin percussion, salsa',
    moments: {
      opener: 'a bright carnival samba',
      travel: 'a laid-back samba groove through the jungle',
      challenge: 'carnival percussion at full tempo: vines, coconuts, costumes',
      struggle: 'a deep, dark, thick samba: the ants',
      'chill-zone': 'a classy samba piano on the beach',
      elimination: 'an acoustic guitar and soft latin percussion, slow',
      recap: 'a hideously happy latin parade',
      interview: 'a soft jazz samba under the voice',
    },
  },
  'haunted-castle': {
    name: 'Haunted Castle', feel: 'a gothic castle at night: pipe organ, dark strings, a theremin in the graveyard',
    search: 'pipe organ, gothic, spooky, halloween, dark strings, horror comedy',
    moments: {
      opener: 'a great pipe organ toccata: the castle on the hill',
      travel: 'a comedically spooky organ and theremin groove',
      challenge: 'dark, driving strings and organs: coffins and horses',
      struggle: 'mournful, tense strings: the beam, the vault, the coach',
      'chill-zone': 'a mysterious celesta and tuba waltz under the moon',
      elimination: 'a sparse, dark piano',
      recap: 'quick organ, choir and orchestra',
      interview: 'a soft, spooky vibraphone',
    },
  },
  'lei-island': {
    name: 'Lei Island', feel: 'the island of flower garlands: ukulele, marimba, tongue drum and slack-key guitar',
    search: 'ukulele, island, marimba, tropical, relaxed',
    moments: {
      opener: 'a bright marimba and ukulele morning',
      travel: 'a cheery mid-tempo ukulele along the coast road',
      challenge: 'a driving tongue drum and percussion: the ring, the coals',
      struggle: 'a mysterious island groove: deep water, hot coals',
      'chill-zone': 'a calm ukulele by the tiki hut',
      elimination: 'a slow, sad ukulele and flutes',
      recap: 'quick ukulele and glockenspiel',
      interview: 'a soft, flowing guitar and ukulele',
    },
  },
  'glass-tower-gulf': {
    name: 'Glass Tower Gulf', feel: 'the glass city in the desert: sleek electronic pop, a saz-like pluck, cool downtempo',
    search: 'electronic, techno-pop, downtempo, desert city, sleek',
    moments: {
      opener: 'a bright, fast techno-pop skyline',
      travel: 'a light synth groove on the desert highway',
      challenge: 'driving electronic percussion: the gondola and the tennis machine',
      struggle: 'a cool downtempo with heavy percussion: heights and a robot that never misses',
      'chill-zone': 'a dark, grooving piano electronica at the gold market',
      elimination: 'a calm, slow electric piano',
      recap: 'a quick saz-and-bass groove',
      interview: 'a slow, mystical dub under the voice',
    },
  },
  'swamp-prison': {
    name: 'Swamp Prison', feel: 'the old prison in the swamp: blues, a harmonica, slide guitar and a slow organ',
    search: 'blues, harmonica, deep south, swamp, slide',
    moments: {
      opener: 'a grooving harmonica blues: the old prison',
      travel: 'a deep-south harmonica and accordion along the swamp road',
      challenge: 'a rolling blues riff: the cell and the raft',
      struggle: 'a slow, mysterious blues: a spoon against a wall',
      'chill-zone': 'a relaxed slow blues on the dock',
      elimination: 'a lonely guitar and harmonica',
      recap: 'a quick boogie-woogie',
      interview: 'a basic, relaxed 12-bar blues',
    },
  },
  'outback-farm': {
    name: 'Outback Farm', feel: 'a farm in the bush: a bush band, banjo and fiddle, flute, a didgeridoo drone',
    search: 'bush band, folk, banjo, fiddle, didgeridoo',
    moments: {
      opener: 'a bouncy banjo and flute: the farm',
      travel: 'a bright banjo and fiddle swing down the dirt road',
      challenge: 'a comedic banjo romp: ten rabbits loose',
      struggle: 'a dark didgeridoo drone and strings',
      'chill-zone': 'a calm fiddle and harp over the valley',
      elimination: 'slow, sombre pipes',
      recap: 'a quick hammered dulcimer and whistle',
      interview: 'soft percussion, a world groove under the voice',
    },
  },
  'fjord-peaks': {
    name: "Fjord Peaks", feel: "the mountains over the gorge: soaring strings, horns and a low choir",
    search: "epic strings, choir, mountains, mystical",
    moments: {
      opener: "a big choir and brass rising over the peaks",
      travel: "harp, choir and flute on the train through the valleys",
      challenge: "driving strings and choir: the bridge and the dance stage",
      struggle: "eerie strings and a low choir: the drop below",
      'chill-zone': "lush, calm voices by the lake",
      elimination: "a solemn choir and cellos",
      recap: "quick percussion, brass and choir",
      interview: "soft strings and a distant choir",
    },
  },
  'prairie-ranch': {
    name: "Prairie Ranch", feel: "a ranch on the prairie: honky-tonk piano, country guitars and a western edge",
    search: "country, western, honky-tonk, saloon, cowboy",
    moments: {
      opener: "fast, upbeat country guitars and mandolin",
      travel: "a saloon ragtime romp down the prairie road",
      challenge: "a driving, grooving western: beans and the bull",
      struggle: "a dark, tense western guitar",
      'chill-zone': "a slow country sing-along on the cliff top",
      elimination: "a lonely western harp",
      recap: "a short western sting",
      interview: "big drums and an exposed western guitar",
    },
  },
  'ice-floe': {
    name: "Ice Floe", feel: "the ice at the top of the world: sparse glassy ambient, drones, the wind",
    search: "ambient, drone, cold, sparse, mysterious",
    moments: {
      opener: "a slow, mystical bass flute over the ice",
      travel: "a drifting drone, the plane over the tundra",
      challenge: "sharp subtle percussion: the rings and the igloo",
      struggle: "dark, unsettled synths: the cold getting in",
      'chill-zone': "a calm, shimmering ambience",
      elimination: "a slow viol over a drone",
      recap: "a chordal, dark soundscape",
      interview: "a soft, long drone",
    },
  },
  'dragon-isle': {
    name: "Dragon Isle", feel: "the island of dragons: gamelan, marimba and kalimba over tense jungle drums",
    search: "gamelan, marimba, kalimba, jungle percussion, mysterious",
    moments: {
      opener: "a mystical gamelan",
      travel: "a dark grooving marimba and kalimba",
      challenge: "aggressive drums and kalimba: the dragons",
      struggle: "a confused, unnerving percussion groove",
      'chill-zone': "a calm koto and strings at sunset",
      elimination: "a minimal, droning piano",
      recap: "quick tribal percussion and voices",
      interview: "soft plucked strings and rain",
    },
  },
  'neon-desert': {
    name: "Neon Desert", feel: "a neon strip in the desert: lounge brass, ska horns, a slot-machine shimmer",
    search: "lounge, brass, ska, cocktail, strip",
    moments: {
      opener: "a TV street-party brass band",
      travel: "a driving sax and synth theme off the strip",
      challenge: "bright, bouncing ska horns: the buggy and the lion",
      struggle: "an uneasy lounge groove, vibraphone and trumpet",
      'chill-zone': "a relaxed tremolo-guitar lounge",
      elimination: "a dark, somber acoustic guitar",
      recap: "a quick funky horn hit",
      interview: "a light swinging beat",
    },
  },
  'pyramid-coast': {
    name: "Pyramid Coast", feel: "the coast below the step pyramid: trumpets and guitars, accordion and marimba",
    search: "trumpet, latin guitar, accordion, marimba, festive",
    moments: {
      opener: "a sleepy, bouncing trumpet band",
      travel: "accordion and marimba along the coast road",
      challenge: "a driving, intense guitar: peppers and the cliff",
      struggle: "a dark guitar and sax",
      'chill-zone': "laid-back reverbed guitars at the pyramid",
      elimination: "a guitar and lute by the fire",
      recap: "a quick, dark brass circus",
      interview: "a soft classical guitar and harp",
    },
  },
  'stilt-river': {
    name: "Stilt River", feel: "a river of stilt villages and temples: marimba and bells, hand drums, flute over the water",
    search: "marimba, bells, hand drum, flute, river, mystical",
    moments: {
      opener: "a mysterious club groove of marimba and bells",
      travel: "hand drums, bells and a river flute up the river",
      challenge: "a bright marimba groove: the catfish",
      struggle: "a mysterious marimba waltz and choir: the tunnels",
      'chill-zone': "a calm marimba at the temple",
      elimination: "slow drums and bells",
      recap: "a quick, mischievous dulcimer and xylophone",
      interview: "a soft flute over running water",
    },
  },
  'frozen-mine': {
    name: "Frozen Mine", feel: "a mine on a frozen lake: plucked harps and zither, glockenspiel, cold pads",
    search: "harp, zither, plucked strings, glockenspiel, cold",
    moments: {
      opener: "a bright, mystical glockenspiel and harp",
      travel: "a grooving zither and strings on the snowy road",
      challenge: "an adventurous harp and bassoon: the yachts and the shaft",
      struggle: "a dark little xylophone and bassoon",
      'chill-zone': "a calm autoharp in the sauna",
      elimination: "a slow harp meditation",
      recap: "a quick lute and strings",
      interview: "a soft harp and pads",
    },
  },
  'tea-hills': {
    name: "Tea Hills", feel: "tea terraces in the morning: sitar, tabla and bansuri, a steam train chuffing",
    search: "sitar, tabla, bansuri, raga, morning",
    moments: {
      opener: "a grooving sitar, tambura and bansuri",
      travel: "a super-groovy sitar and percussion up the hill road",
      challenge: "driving drums and shakers: the baskets and the train",
      struggle: "an intense, psychedelic sitar",
      'chill-zone': "drums and harp at the station",
      elimination: "a sarod melody over a drone",
      recap: "four big drums",
      interview: "a soft tongue drum and strings",
    },
  },
  'pampas-ranch': {
    name: "Pampas Ranch", feel: "a tango city and the grasslands: piano and accordion tango, open acoustic guitars",
    search: "tango, accordion, acoustic guitar, folk, grasslands",
    moments: {
      opener: "a tango in two chords",
      travel: "flowing acoustic guitars out to the grasslands",
      challenge: "an intense guitar waltz: the dance and the emu",
      struggle: "a dark folk round on guitar and violin",
      'chill-zone': "slower, warm acoustic guitars at the cliff",
      elimination: "an intimate guitar dance",
      recap: "a bright little guitar groove",
      interview: "an easy guitar waltz",
    },
  },
  'game-show-city': {
    name: "Game Show City", feel: "a giant game show: hyper chiptune jingles, arcade synths and a studio band",
    search: "chiptune, arcade, game show, synth pop",
    moments: {
      opener: "a bright, uplifting arcade synth",
      travel: "a chiptune groove on the bullet train",
      challenge: "a manic balloon-game loop: human pinball",
      struggle: "a pulsing synth groove",
      'chill-zone': "a relaxed space jazz on the stage",
      elimination: "a calm synth canon",
      recap: "a frantic game-show band",
      interview: "a blip-bloop screen saver",
    },
  },
  'ice-river': {
    name: "Ice River", feel: "a frozen river at the edge of the world: low brass, plucked harps and cold, sparse strings",
    search: "low brass, harp, sparse, cold, somber",
    moments: {
      opener: "a dark, mysterious tuba and horns",
      travel: "a harp solo over the snow",
      challenge: "a comic plucked-strings plan: floes and the sled",
      struggle: "dark, eerie strings and clarinet",
      'chill-zone': "a mystical autoharp at the finish",
      elimination: "a slow bassoon and harp",
      recap: "a quick epic horn and hurdy-gurdy",
      interview: "a soft harp and pennywhistle",
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
