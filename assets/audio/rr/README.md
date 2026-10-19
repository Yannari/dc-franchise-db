# The Ridonculous Race: the music list

Written by `node tools/rr-vp-music.mjs` from `js/vp-rr-ep/music.js` (edit that file, then run this again).
Every place has its own sound and every moment of a leg its own track there (the user, 2026-10-19:
"different music for each place and in each place for each specific moment"). The viewer
(`js/vp-rr-ep/sound.js`) plays a file from the step being painted. A file that is missing plays
the race-wide bed for that moment (`race/<moment>.mp3`) if there is one, then an ambience already
in the repo where it really fits the place, and otherwise silence. A Total Drama bed never plays.

**Filled: 108 of 108 slots.**

**The rules for a file**
- Royalty-free only: CC0 or public domain, the Pixabay Content License, or CC-BY with the credit in
  `CREDITS.md`. Never the real show's soundtrack, never a commercial track.
- A bed is a loop: 30-90 s, cut on a bar so the end runs back into the start, mono or stereo mp3 at
  64-128 kbps, levelled to about -17 dB (beds) or -14 dB (stings). `tools/rr-vp-audio.py` does the cut,
  the crossfade at the loop point, the level and the encode.
- No real country or city on screen. The words here describe a style of music, nothing more.
- Mix: music > voices > ambience. A bed sits under the lines; the stings are short.

**Search sites**: incompetech.com (Kevin MacLeod, CC-BY 4.0), pixabay.com/music (Pixabay License),
freemusicarchive.org (filter by CC-BY or CC0), opengameart.org (filter by CC0).

## The moments

| Moment | When it plays | Length | What it should do |
|---|---|---|---|
| `opener` | the title card of the place, Don at the start line, the first look at the place | 40-60 s loop | bright, confident, the place in its first bars |
| `travel` | on the road: the airport arrival, cabs, rides and runs between the tasks | 60 s loop | moving, steady pulse, 100-130 bpm, never heavy |
| `challenge` | at a task: the Don Box tip, teams starting and working at it | 60 s loop | driving, building, percussion forward, 110-140 bpm |
| `struggle` | a team failing, retrying, freezing, quitting, a task going wrong | 45 s loop | tense, low, ticking, unresolved (strings or the place's drums, minor) |
| `chill-zone` | the Chill Zone: Don on the mat, the teams checked in, the placements | 45 s loop | relief and a little swagger, mid-tempo, warm |
| `elimination` | the last team is out: Don's verdict and the goodbye | 30-45 s loop | sombre and short, slow, sparse, one or two instruments |
| `recap` | "Previously" over the world map and last time's clips | 30-40 s loop | quick, punchy, recap energy, the place still in it |
| `interview` | the confessionals in front of the map | 40 s loop | light, low, under a voice: soft pulse, no melody fighting the words |

## The race's own sounds (`assets/audio/rr/race/`)

| File | Kind | When | Look for | Search | Filled |
|---|---|---|---|---|---|
| `race/logo.mp3` | sting | the show open: the logo slams in | a 3-5 s punchy rock or orchestral hit, big drums, a riser into a hit | logo sting, rock hit, intro stinger, epic hit | [x] "Discovery Hit" (Kevin MacLeod), 39 KB |
| `race/title.mp3` | sting | the place's title card lands | a 2-3 s whoosh-and-hit, bright | whoosh hit, transition sting, title hit | [x] "NewsSting" (Kevin MacLeod), 28 KB |
| `race/donbox.mp3` | sting | the tip card flies out of the Don Box | a 2-3 s quirky reveal: a pizzicato or marimba flourish | reveal sting, quirky flourish, pizzicato sting | [x] "Loping Sting" (Kevin MacLeod), 36 KB |
| `race/boomerang.mp3` | sting | BOOMERANG! | a 2-3 s comic brass stab or a spinning whoosh into a hit | comic brass stab, cartoon hit | [x] "Danse Macabre - Big Hit 1" (Kevin MacLeod), 36 KB |
| `race/penalty.mp3` | sting | PENALTY, YIELD, ZIP IT, SPEED BUMP, MEDEVAC | a 2-3 s low brass "uh-oh" hit | dramatic hit, low brass sting, uh oh | [x] "Der Kleber Sting" (Kevin MacLeod), 47 KB |
| `race/eliminated.mp3` | sting | ELIMINATED | a 3-4 s dark hit with a long tail | dramatic sting, dark hit, sad sting | [x] "Darkness Speaks" (Kevin MacLeod), 47 KB |
| `race/safe.mp3` | sting | NON-ELIMINATION, SAVE | a 2-3 s bright relief chord | success sting, relief, bright chord | [x] "Light Sting" (Kevin MacLeod), 39 KB |
| `race/placement.mp3` | sting | Don reads a placement on the mat | a 1-2 s drum hit or cymbal swell into a hit | drum hit, impact sting | [x] "Gustav Sting" (Kevin MacLeod), 20 KB |
| `race/winners.mp3` | sting | THE WINNERS! | a 4-6 s fanfare, brass and cymbals | victory fanfare, triumph sting | [x] "The Curtain Rises" (Kevin MacLeod), 55 KB |
| `race/flight.mp3` | bed | in the air: the cabin, the galley, the map with the plane | a calm 60 s loop, airy pads and a soft beat | lounge, airy, chill electronic, travel | [x] "Airport Lounge" (Kevin MacLeod), 391 KB |
| `race/finale.mp3` | bed | the final mat: the winners crowned | a 60 s anthem loop, rock or orchestra, triumphant | triumphant anthem, epic victory, uplifting rock | [x] "At Launch" (Kevin MacLeod), 391 KB |
| `race/theme.mp3` | bed | the show open and NEXT TIME | a 40 s loop of upbeat pop-rock, the race's own theme feel | upbeat rock, adventure pop rock, energetic | [x] "Cool Rock" (Kevin MacLeod), 313 KB |

A race-wide bed for a moment (`race/opener.mp3`, `race/struggle.mp3`...) is the fallback for any place without its own.

## Home City (`home-city/`)

**Sound of the place**: the start line: a big modern city, bright pop-rock, electric guitars, handclaps.  
**Search**: upbeat pop rock, indie rock, city, energetic.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `home-city/opener.mp3` | opener | bright pop-rock with handclaps, the race about to begin; bright, confident, the place in its first bars | 40-60 s loop | upbeat pop rock, indie rock, bright | [x] "Motivator" (Kevin MacLeod), 352 KB |
| `home-city/travel.mp3` | travel | a running indie-rock groove, the dash to the tower; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | upbeat pop rock, indie rock, moving | [x] "Delay Rock" (Kevin MacLeod), 391 KB |
| `home-city/challenge.mp3` | challenge | driving rock with a big beat: the stairs or the sky-deck; driving, building, percussion forward, 110-140 bpm | 60 s loop | upbeat pop rock, indie rock, driving | [x] "Hotrock" (Kevin MacLeod), 391 KB |
| `home-city/struggle.mp3` | struggle | tense electric pulses, a ticking hi-hat: heights, a zipline nobody wants; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | upbeat pop rock, indie rock, tense | [x] "I Can Feel it Coming" (Kevin MacLeod), 352 KB |
| `home-city/chill-zone.mp3` | chill-zone | laid-back funky pop, relief; relief and a little swagger, mid-tempo, warm | 45 s loop | upbeat pop rock, indie rock, relief and a little swagger | [x] "Funky Chunk" (Kevin MacLeod), 352 KB |
| `home-city/elimination.mp3` | elimination | a slow solo piano or guitar, two minutes too long for the first leg; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | upbeat pop rock, indie rock, sombre and short | [x] "Heartbreaking" (Kevin MacLeod), 274 KB |
| `home-city/recap.mp3` | recap | quick, punchy pop-rock; quick, punchy, recap energy, the place still in it | 30-40 s loop | upbeat pop rock, indie rock, quick | [x] "Chipper" (Kevin MacLeod), 235 KB |
| `home-city/interview.mp3` | interview | a soft electronic pulse under the voice; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | upbeat pop rock, indie rock, light | [x] "Chill Wave" (Kevin MacLeod), 313 KB |

## Red Sand Desert (`red-sand-desert/`)

**Sound of the place**: desert market: oud, darbuka and hand drums, ney flute, a spice-market bustle.  
**Search**: oud, middle eastern percussion, darbuka, desert, bazaar.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `red-sand-desert/opener.mp3` | opener | oud melody over hand drums, sunlit and wide; bright, confident, the place in its first bars | 40-60 s loop | oud, middle eastern percussion, bright | [x] "Tabuk" (Kevin MacLeod), 352 KB |
| `red-sand-desert/travel.mp3` | travel | a camel-gait groove on frame drums and oud; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | oud, middle eastern percussion, moving | [x] "Finding the Balance" (Kevin MacLeod), 391 KB |
| `red-sand-desert/challenge.mp3` | challenge | a busy bazaar: fast darbuka, oud runs, shakers; driving, building, percussion forward, 110-140 bpm | 60 s loop | oud, middle eastern percussion, driving | [x] "Ibn Al-Noor" (Kevin MacLeod), 391 KB |
| `red-sand-desert/struggle.mp3` | struggle | low drones and tense hand drums, the heat getting to them; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | oud, middle eastern percussion, tense | [x] "Old Road" (Kevin MacLeod), 352 KB |
| `red-sand-desert/chill-zone.mp3` | chill-zone | a relaxed oud groove in the shade; relief and a little swagger, mid-tempo, warm | 45 s loop | oud, middle eastern percussion, relief and a little swagger | [x] "Desert City" (Kevin MacLeod), 352 KB |
| `red-sand-desert/elimination.mp3` | elimination | a slow, lonely ney flute or oud solo; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | oud, middle eastern percussion, sombre and short | [x] "Teller of the Tales" (Kevin MacLeod), 274 KB |
| `red-sand-desert/recap.mp3` | recap | quick percussion with an oud hook; quick, punchy, recap energy, the place still in it | 30-40 s loop | oud, middle eastern percussion, quick | [x] "Derp Nugget" (Kevin MacLeod), 235 KB |
| `red-sand-desert/interview.mp3` | interview | soft frame drum and a drone; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | oud, middle eastern percussion, light | [x] "Vadodora Chill Mix" (Kevin MacLeod), 313 KB |

## Iron Tower City (`iron-tower-city/`)

**Sound of the place**: old-world city: accordion, musette waltz, café jazz, pizzicato strings; the catacombs spooky.  
**Search**: accordion, musette, cafe, waltz, gypsy jazz.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `iron-tower-city/opener.mp3` | opener | a jaunty accordion waltz; bright, confident, the place in its first bars | 40-60 s loop | accordion, musette, bright | [x] "Bushwick Tarantella" (Kevin MacLeod), 352 KB |
| `iron-tower-city/travel.mp3` | travel | café jazz swing, a cab through cobbled streets; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | accordion, musette, moving | [x] "Sidewalk Shade" (Kevin MacLeod), 391 KB |
| `iron-tower-city/challenge.mp3` | challenge | quick pizzicato and accordion, comic and busy; driving, building, percussion forward, 110-140 bpm | 60 s loop | accordion, musette, driving | [x] "Le Grand Chase" (Kevin MacLeod), 391 KB |
| `iron-tower-city/struggle.mp3` | struggle | the catacombs: creeping low strings and a music box; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | accordion, musette, tense | [x] "Miri's Magic Dance" (Kevin MacLeod), 352 KB |
| `iron-tower-city/chill-zone.mp3` | chill-zone | a gentle café accordion; relief and a little swagger, mid-tempo, warm | 45 s loop | accordion, musette, relief and a little swagger | [x] "Suave Standpipe" (Kevin MacLeod), 352 KB |
| `iron-tower-city/elimination.mp3` | elimination | a slow, sad accordion or solo cello; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | accordion, musette, sombre and short | [x] "Duet Musette" (Kevin MacLeod), 274 KB |
| `iron-tower-city/recap.mp3` | recap | a quick swinging gypsy-jazz turn; quick, punchy, recap energy, the place still in it | 30-40 s loop | accordion, musette, quick | [x] "One-eyed Maestro" (Kevin MacLeod), 235 KB |
| `iron-tower-city/interview.mp3` | interview | soft café guitar; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | accordion, musette, light | [x] "Parisian" (Kevin MacLeod), 301 KB |

## Great Wall Hills (`great-wall-hills/`)

**Sound of the place**: mountain wall and old streets: guzheng, erhu, pentatonic flutes, big drums.  
**Search**: guzheng, erhu, asian, pentatonic, oriental drums.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `great-wall-hills/opener.mp3` | opener | a sweeping pentatonic theme on plucked strings and flute; bright, confident, the place in its first bars | 40-60 s loop | guzheng, erhu, bright | [x] "Shenyang" (Kevin MacLeod), 352 KB |
| `great-wall-hills/travel.mp3` | travel | a light bowed-string melody over a walking beat, the rickshaw road; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | guzheng, erhu, moving | [x] "Guzheng City" (Kevin MacLeod), 391 KB |
| `great-wall-hills/challenge.mp3` | challenge | big drums and plucked strings, a skydive and bug skewers; driving, building, percussion forward, 110-140 bpm | 60 s loop | guzheng, erhu, driving | [x] "Mountain Emperor" (Kevin MacLeod), 391 KB |
| `great-wall-hills/struggle.mp3` | struggle | tense low drums and a bending bowed string; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | guzheng, erhu, tense | [x] "Asian Drums" (Kevin MacLeod), 352 KB |
| `great-wall-hills/chill-zone.mp3` | chill-zone | calm plucked strings, a garden at dusk; relief and a little swagger, mid-tempo, warm | 45 s loop | guzheng, erhu, relief and a little swagger | [x] "Ishikari Lore" (Kevin MacLeod), 352 KB |
| `great-wall-hills/elimination.mp3` | elimination | a slow, sad bamboo flute solo; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | guzheng, erhu, sombre and short | [x] "Nu Flute" (Kevin MacLeod), 274 KB |
| `great-wall-hills/recap.mp3` | recap | quick drums with a pentatonic hook; quick, punchy, recap energy, the place still in it | 30-40 s loop | guzheng, erhu, quick | [x] "Big Mojo" (Kevin MacLeod), 235 KB |
| `great-wall-hills/interview.mp3` | interview | soft plucked strings, sparse; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | guzheng, erhu, light | [x] "Ripples" (Kevin MacLeod), 313 KB |

## Rock North (`rock-north/`)

**Sound of the place**: the snowy north: fiddle and folk drums, icy bells, and a heavy-rock streak (air guitar).  
**Search**: nordic folk, fiddle, celtic, icy, heavy rock, viking.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `rock-north/opener.mp3` | opener | a stomping folk fiddle tune, cold air and drums; bright, confident, the place in its first bars | 40-60 s loop | nordic folk, fiddle, bright | [x] "Achaidh Cheide" (Kevin MacLeod), 352 KB |
| `rock-north/travel.mp3` | travel | a running folk reel, snow on the cab; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | nordic folk, fiddle, moving | [x] "Fiddles McGinty" (Kevin MacLeod), 391 KB |
| `rock-north/challenge.mp3` | challenge | heavy guitar rock: the sauna and the air guitar; driving, building, percussion forward, 110-140 bpm | 60 s loop | nordic folk, fiddle, driving | [x] "Burn The World Waltz" (Kevin MacLeod), 391 KB |
| `rock-north/struggle.mp3` | struggle | icy bells and a low drone: the frozen river; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | nordic folk, fiddle, tense | [x] "Spider Eyes" (Kevin MacLeod), 352 KB |
| `rock-north/chill-zone.mp3` | chill-zone | a warm folk tune by the fire; relief and a little swagger, mid-tempo, warm | 45 s loop | nordic folk, fiddle, relief and a little swagger | [x] "Galway" (Kevin MacLeod), 352 KB |
| `rock-north/elimination.mp3` | elimination | a slow, lonely fiddle lament; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | nordic folk, fiddle, sombre and short | [x] "Moorland" (Kevin MacLeod), 274 KB |
| `rock-north/recap.mp3` | recap | a quick rock riff; quick, punchy, recap energy, the place still in it | 30-40 s loop | nordic folk, fiddle, quick | [x] "Metalmania" (Kevin MacLeod), 235 KB |
| `rock-north/interview.mp3` | interview | soft bells and a low pad; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | nordic folk, fiddle, light | [x] "Frost Waltz" (Kevin MacLeod), 313 KB |

## Savanna Falls (`savanna-falls/`)

**Sound of the place**: the savanna and the falls: marimba, kalimba, djembe and log drums, a choir in the distance.  
**Search**: african percussion, marimba, kalimba, djembe, safari, tribal.  
**Fallback ambience** (only while a file is missing): `assets/audio/ch/amb-jungle.mp3`.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `savanna-falls/opener.mp3` | opener | marimba and djembe, sunrise over the plain; bright, confident, the place in its first bars | 40-60 s loop | african percussion, marimba, bright | [x] "AngloZulu" (Kevin MacLeod), 352 KB |
| `savanna-falls/travel.mp3` | travel | a bouncing jeep groove on shakers and log drums; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | african percussion, marimba, moving | [x] "Allada" (Kevin MacLeod), 391 KB |
| `savanna-falls/challenge.mp3` | challenge | driving djembe and log drums, the selfie over the edge; driving, building, percussion forward, 110-140 bpm | 60 s loop | african percussion, marimba, driving | [x] "Sauropod Spotting" (Kevin MacLeod), 391 KB |
| `savanna-falls/struggle.mp3` | struggle | tense low drums, the rhino too close; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | african percussion, marimba, tense | [x] "Drums of the Deep" (Kevin MacLeod), 352 KB |
| `savanna-falls/chill-zone.mp3` | chill-zone | a happy kalimba groove; relief and a little swagger, mid-tempo, warm | 45 s loop | african percussion, marimba, relief and a little swagger | [x] "Zanzibar" (Kevin MacLeod), 352 KB |
| `savanna-falls/elimination.mp3` | elimination | a slow kalimba or soft choir; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | african percussion, marimba, sombre and short | [x] "Kalimba Relaxation Music" (Kevin MacLeod), 274 KB |
| `savanna-falls/recap.mp3` | recap | quick drums and marimba; quick, punchy, recap energy, the place still in it | 30-40 s loop | african percussion, marimba, quick | [x] "Dentaneosuchus Hunt" (Kevin MacLeod), 235 KB |
| `savanna-falls/interview.mp3` | interview | a soft kalimba pattern; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | african percussion, marimba, light | [x] "Expeditionary" (Kevin MacLeod), 313 KB |

## Treasure Isles (`treasure-isles/`)

**Sound of the place**: pirate islands: sea-shanty accordion and fiddle, steel drums, calypso.  
**Search**: pirate, sea shanty, calypso, steel drum, caribbean.  
**Fallback ambience** (only while a file is missing): `assets/audio/td/amb/island-day.ogg`.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `treasure-isles/opener.mp3` | opener | a swaggering pirate shanty; bright, confident, the place in its first bars | 40-60 s loop | pirate, sea shanty, bright | [x] "Beachfront Celebration" (Kevin MacLeod), 352 KB |
| `treasure-isles/travel.mp3` | travel | a calypso groove, a jet ski over the bay; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | pirate, sea shanty, moving | [x] "Island Meet and Greet" (Kevin MacLeod), 391 KB |
| `treasure-isles/challenge.mp3` | challenge | a fast shanty jig: X marks the map; driving, building, percussion forward, 110-140 bpm | 60 s loop | pirate, sea shanty, driving | [x] "Arroz Con Pollo" (Kevin MacLeod), 391 KB |
| `treasure-isles/struggle.mp3` | struggle | deep-water tension: low strings and bubbles, the dive for gold; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | pirate, sea shanty, tense | [x] "Invariance" (Kevin MacLeod), 352 KB |
| `treasure-isles/chill-zone.mp3` | chill-zone | steel drums in the sun; relief and a little swagger, mid-tempo, warm | 45 s loop | pirate, sea shanty, relief and a little swagger | [x] "Paradise Found" (Kevin MacLeod), 352 KB |
| `treasure-isles/elimination.mp3` | elimination | a slow sailor's lament on accordion; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | pirate, sea shanty, sombre and short | [x] "With the Sea" (Kevin MacLeod), 274 KB |
| `treasure-isles/recap.mp3` | recap | a quick jig; quick, punchy, recap energy, the place still in it | 30-40 s loop | pirate, sea shanty, quick | [x] "Notanico Merengue" (Kevin MacLeod), 235 KB |
| `treasure-isles/interview.mp3` | interview | soft steel drum or ukulele; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | pirate, sea shanty, light | [x] "Beach Party" (Kevin MacLeod), 313 KB |

## Tomb Sands (`tomb-sands/`)

**Sound of the place**: the ancient tombs: low strings, ney and darbuka, a mystery, an adventure film's sand and torches.  
**Search**: ancient, mysterious, middle eastern, adventure, archaeology.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `tomb-sands/opener.mp3` | opener | a grand ancient-mystery theme; bright, confident, the place in its first bars | 40-60 s loop | ancient, mysterious, bright | [x] "Return of the Mummy" (Kevin MacLeod), 352 KB |
| `tomb-sands/travel.mp3` | travel | a rolling camel-ride groove, drums and a drone; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | ancient, mysterious, moving | [x] "Desert of Lost Souls" (Kevin MacLeod), 391 KB |
| `tomb-sands/challenge.mp3` | challenge | an adventure-film chase: strings and big drums, over or under the pyramid; driving, building, percussion forward, 110-140 bpm | 60 s loop | ancient, mysterious, driving | [x] "Curse of the Scarab" (Kevin MacLeod), 391 KB |
| `tomb-sands/struggle.mp3` | struggle | the tomb: dark, creeping, a mummy in the dark; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | ancient, mysterious, tense | [x] "Hidden Wonders" (Kevin MacLeod), 352 KB |
| `tomb-sands/chill-zone.mp3` | chill-zone | a calm river at dusk, a soft drone and oud; relief and a little swagger, mid-tempo, warm | 45 s loop | ancient, mysterious, relief and a little swagger | [x] "Opium" (Kevin MacLeod), 352 KB |
| `tomb-sands/elimination.mp3` | elimination | a slow, dark lament; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | ancient, mysterious, sombre and short | [x] "Ancient Rite" (Kevin MacLeod), 274 KB |
| `tomb-sands/recap.mp3` | recap | quick drums with a mystery hook; quick, punchy, recap energy, the place still in it | 30-40 s loop | ancient, mysterious, quick | [x] "East of Tunesia" (Kevin MacLeod), 235 KB |
| `tomb-sands/interview.mp3` | interview | a soft low drone; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | ancient, mysterious, light | [x] "Mystery Bazaar" (Kevin MacLeod), 313 KB |

## Torch Statue Harbour (`torch-statue-harbour/`)

**Sound of the place**: the big harbour city: brass-band funk, jazz, a boom-bap beat.  
**Search**: funk, brass, jazz, hip hop beat, big band, urban.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `torch-statue-harbour/opener.mp3` | opener | big-band brass, the statue in the harbour; bright, confident, the place in its first bars | 40-60 s loop | funk, brass, bright | [x] "Highlight Reel" (Kevin MacLeod), 352 KB |
| `torch-statue-harbour/travel.mp3` | travel | a funky bass line, a boat across the harbour; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | funk, brass, moving | [x] "Style Funk" (Kevin MacLeod), 391 KB |
| `torch-statue-harbour/challenge.mp3` | challenge | brassy funk at full tilt: up to the crown; driving, building, percussion forward, 110-140 bpm | 60 s loop | funk, brass, driving | [x] "Sax, Rock, and Roll" (Kevin MacLeod), 391 KB |
| `torch-statue-harbour/struggle.mp3` | struggle | the sewer: a dark, dripping beat; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | funk, brass, tense | [x] "Griphop" (Kevin MacLeod), 352 KB |
| `torch-statue-harbour/chill-zone.mp3` | chill-zone | smooth jazz-hop; relief and a little swagger, mid-tempo, warm | 45 s loop | funk, brass, relief and a little swagger | [x] "Jazz Brunch" (Kevin MacLeod), 352 KB |
| `torch-statue-harbour/elimination.mp3` | elimination | a slow, sad jazz piano; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | funk, brass, sombre and short | [x] "Night on the Docks - Sax" (Kevin MacLeod), 274 KB |
| `torch-statue-harbour/recap.mp3` | recap | a quick funk break; quick, punchy, recap energy, the place still in it | 30-40 s loop | funk, brass, quick | [x] "Private Eye" (Kevin MacLeod), 235 KB |
| `torch-statue-harbour/interview.mp3` | interview | a soft lo-fi beat; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | funk, brass, light | [x] "Cool Vibes" (Kevin MacLeod), 313 KB |

## Red Outback (`red-outback/`)

**Sound of the place**: the red outback: didgeridoo and clapsticks, twangy guitar, banjo.  
**Search**: didgeridoo, country, banjo, bluegrass, outback, western.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `red-outback/opener.mp3` | opener | a twangy guitar and banjo over a drone; bright, confident, the place in its first bars | 40-60 s loop | didgeridoo, country, bright | [x] "Lord of the Rangs" (Kevin MacLeod), 352 KB |
| `red-outback/travel.mp3` | travel | a galloping bluegrass groove, the emu ride; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | didgeridoo, country, moving | [x] "Still Pickin" (Kevin MacLeod), 391 KB |
| `red-outback/challenge.mp3` | challenge | fast banjo and stomps: catch your ride; driving, building, percussion forward, 110-140 bpm | 60 s loop | didgeridoo, country, driving | [x] "River Valley Breakdown" (Kevin MacLeod), 391 KB |
| `red-outback/struggle.mp3` | struggle | didgeridoo drone and tense clapsticks: the bungee; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | didgeridoo, country, tense | [x] "Chee Zee Jungle" (Kevin MacLeod), 352 KB |
| `red-outback/chill-zone.mp3` | chill-zone | a lazy campfire guitar; relief and a little swagger, mid-tempo, warm | 45 s loop | didgeridoo, country, relief and a little swagger | [x] "Fireflies and Stardust" (Kevin MacLeod), 352 KB |
| `red-outback/elimination.mp3` | elimination | a slow, lonely harmonica or slide guitar; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | didgeridoo, country, sombre and short | [x] "Crossing the Divide" (Kevin MacLeod), 274 KB |
| `red-outback/recap.mp3` | recap | a quick banjo run; quick, punchy, recap energy, the place still in it | 30-40 s loop | didgeridoo, country, quick | [x] "Corncob" (Kevin MacLeod), 235 KB |
| `red-outback/interview.mp3` | interview | soft fingerpicked guitar; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | didgeridoo, country, light | [x] "Cattails" (Kevin MacLeod), 313 KB |

## Fire-Mountain Isle (`fire-mountain-isle/`)

**Sound of the place**: the volcano island: ukulele and slack-key guitar, log drums, and lava rumbling under it.  
**Search**: ukulele, hawaiian, tiki, tropical, island, log drums.  
**Fallback ambience** (only while a file is missing): `assets/audio/ch/amb-jungle.mp3`.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `fire-mountain-isle/opener.mp3` | opener | a sunny ukulele and slack-key theme; bright, confident, the place in its first bars | 40-60 s loop | ukulele, hawaiian, bright | [x] "Carefree" (Kevin MacLeod), 352 KB |
| `fire-mountain-isle/travel.mp3` | travel | a jungle trek on log drums and shakers; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | ukulele, hawaiian, moving | [x] "Rite of Passage" (Kevin MacLeod), 391 KB |
| `fire-mountain-isle/challenge.mp3` | challenge | driving island drums: lava or falls; driving, building, percussion forward, 110-140 bpm | 60 s loop | ukulele, hawaiian, driving | [x] "Firebrand" (Kevin MacLeod), 391 KB |
| `fire-mountain-isle/struggle.mp3` | struggle | deep rumbling drums and tense strings: the lava rocks; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | ukulele, hawaiian, tense | [x] "Tikopia" (Kevin MacLeod), 352 KB |
| `fire-mountain-isle/chill-zone.mp3` | chill-zone | a lazy tiki-bar ukulele; relief and a little swagger, mid-tempo, warm | 45 s loop | ukulele, hawaiian, relief and a little swagger | [x] "Tiki Bar Mixer" (Kevin MacLeod), 352 KB |
| `fire-mountain-isle/elimination.mp3` | elimination | a slow, soft slack-key guitar; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | ukulele, hawaiian, sombre and short | [x] "When The Wind Blows" (Kevin MacLeod), 274 KB |
| `fire-mountain-isle/recap.mp3` | recap | quick island drums; quick, punchy, recap energy, the place still in it | 30-40 s loop | ukulele, hawaiian, quick | [x] "Arcane" (Kevin MacLeod), 235 KB |
| `fire-mountain-isle/interview.mp3` | interview | soft ukulele; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | ukulele, hawaiian, light | [x] "Moonlight Beach" (Kevin MacLeod), 313 KB |

## Skyline City (`skyline-finale/`)

**Sound of the place**: the final leg: an anthem, epic orchestra and rock, the city skyline at the end of the world.  
**Search**: epic, orchestral, anthem, triumphant, cinematic rock.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `skyline-finale/opener.mp3` | opener | an epic, rising orchestral theme; bright, confident, the place in its first bars | 40-60 s loop | epic, orchestral, bright | [x] "Our Story Begins" (Kevin MacLeod), 352 KB |
| `skyline-finale/travel.mp3` | travel | a driving cinematic rock pulse, the drive into the city; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | epic, orchestral, moving | [x] "Hiding Your Reality" (Kevin MacLeod), 391 KB |
| `skyline-finale/challenge.mp3` | challenge | big orchestral action: the stairs and the buoys; driving, building, percussion forward, 110-140 bpm | 60 s loop | epic, orchestral, driving | [x] "Five Armies" (Kevin MacLeod), 391 KB |
| `skyline-finale/struggle.mp3` | struggle | tense, building strings: everything on one task; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | epic, orchestral, tense | [x] "Impending Boom" (Kevin MacLeod), 352 KB |
| `skyline-finale/chill-zone.mp3` | chill-zone | a proud, warm anthem: the midpoint; relief and a little swagger, mid-tempo, warm | 45 s loop | epic, orchestral, relief and a little swagger | [x] "Pennsylvania Rose" (Kevin MacLeod), 352 KB |
| `skyline-finale/elimination.mp3` | elimination | a slow, bittersweet orchestral cue; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | epic, orchestral, sombre and short | [x] "Rumination" (Kevin MacLeod), 274 KB |
| `skyline-finale/recap.mp3` | recap | a quick epic montage; quick, punchy, recap energy, the place still in it | 30-40 s loop | epic, orchestral, quick | [x] "Heroic Age" (Kevin MacLeod), 235 KB |
| `skyline-finale/interview.mp3` | interview | a soft cinematic pad; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | epic, orchestral, light | [x] "Airship Serenity" (Kevin MacLeod), 313 KB |
