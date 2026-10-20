# The Ridonculous Race: the music list

Written by `node tools/rr-vp-music.mjs` from `js/vp-rr-ep/music.js` (edit that file, then run this again).
Every place has its own sound and every moment of a leg its own track there (the user, 2026-10-19:
"different music for each place and in each place for each specific moment"). The viewer
(`js/vp-rr-ep/sound.js`) plays a file from the step being painted. A file that is missing plays
the race-wide bed for that moment (`race/<moment>.mp3`) if there is one, then an ambience already
in the repo where it really fits the place, and otherwise silence. A Total Drama bed never plays.

**Filled: 300 of 300 slots.**

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

## Coast Palace (`coast-palace/`)

**Sound of the place**: the glamorous coast: lounge piano and bossa guitars on a yacht deck, a surf-rock twang for the sharks.  
**Search**: lounge, bossa nova, riviera, surf rock, cocktail jazz.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `coast-palace/opener.mp3` | opener | a bright, grooving lounge piano: the palace gates and the sea; bright, confident, the place in its first bars | 40-60 s loop | lounge, bossa nova, bright | [x] "Backbay Lounge" (Kevin MacLeod), 352 KB |
| `coast-palace/travel.mp3` | travel | a bouncy café groove along the coast; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | lounge, bossa nova, moving | [x] "Zazie" (Kevin MacLeod), 391 KB |
| `coast-palace/challenge.mp3` | challenge | surf-rock guitar and organ: the shark and the sand palace; driving, building, percussion forward, 110-140 bpm | 60 s loop | lounge, bossa nova, driving | [x] "Surf Shimmy" (Kevin MacLeod), 391 KB |
| `coast-palace/struggle.mp3` | struggle | a dark spy groove: a fin going past, a palace slumping; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | lounge, bossa nova, tense | [x] "Spy Groove" (Kevin MacLeod), 352 KB |
| `coast-palace/chill-zone.mp3` | chill-zone | a relaxed bossa guitar on the harbour; relief and a little swagger, mid-tempo, warm | 45 s loop | lounge, bossa nova, relief and a little swagger | [x] "Bossa Antigua" (Kevin MacLeod), 352 KB |
| `coast-palace/elimination.mp3` | elimination | a simple, sombre solo piano; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | lounge, bossa nova, sombre and short | [x] "Danse Morialta" (Kevin MacLeod), 274 KB |
| `coast-palace/recap.mp3` | recap | a quick surf-guitar riff; quick, punchy, recap energy, the place still in it | 30-40 s loop | lounge, bossa nova, quick | [x] "Beach Bum" (Kevin MacLeod), 235 KB |
| `coast-palace/interview.mp3` | interview | a soft bossa nova under the voice; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | lounge, bossa nova, light | [x] "BossaBossa" (Kevin MacLeod), 313 KB |

## Geyser Island (`geyser-island/`)

**Sound of the place**: the icy north: celesta and cold strings, glass marimba and low brass, eerie and clear as ice.  
**Search**: ice, frost, celesta, eerie, nordic, mystical, cold.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `geyser-island/opener.mp3` | opener | a mysterious celesta and strings theme, snow on the peaks; bright, confident, the place in its first bars | 40-60 s loop | ice, frost, bright | [x] "The Snow Queen" (Kevin MacLeod), 352 KB |
| `geyser-island/travel.mp3` | travel | a cold, grooving synth pulse on the mountain road; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | ice, frost, moving | [x] "Ice Flow" (Kevin MacLeod), 391 KB |
| `geyser-island/challenge.mp3` | challenge | a dark, driving, slightly comic orchestra: the geysers and the feast; driving, building, percussion forward, 110-140 bpm | 60 s loop | ice, frost, driving | [x] "Krampus Workshop" (Kevin MacLeod), 391 KB |
| `geyser-island/struggle.mp3` | struggle | eerie glass marimba and flutes: steam, ice and a phrase nobody remembers; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | ice, frost, tense | [x] "Myst on the Moor" (Kevin MacLeod), 352 KB |
| `geyser-island/chill-zone.mp3` | chill-zone | a calm, bright northern pad; relief and a little swagger, mid-tempo, warm | 45 s loop | ice, frost, relief and a little swagger | [x] "Northern Glade" (Kevin MacLeod), 352 KB |
| `geyser-island/elimination.mp3` | elimination | slow, somber low brass; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | ice, frost, sombre and short | [x] "The Ice Giants" (Kevin MacLeod), 274 KB |
| `geyser-island/recap.mp3` | recap | quick dark strings and celesta; quick, punchy, recap energy, the place still in it | 30-40 s loop | ice, frost, quick | [x] "The Path of the Goblin King v2" (Kevin MacLeod), 235 KB |
| `geyser-island/interview.mp3` | interview | a light, mystical celesta and clarinet; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | ice, frost, light | [x] "Enchanted Valley" (Kevin MacLeod), 313 KB |

## Carnival Rainforest (`carnival-rainforest/`)

**Sound of the place**: carnival in the rainforest: samba percussion, surdo and tamborim, a parade with horns.  
**Search**: samba, carnival, batucada, latin percussion, salsa.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `carnival-rainforest/opener.mp3` | opener | a bright carnival samba; bright, confident, the place in its first bars | 40-60 s loop | samba, carnival, bright | [x] "Leblon" (Kevin MacLeod), 352 KB |
| `carnival-rainforest/travel.mp3` | travel | a laid-back samba groove through the jungle; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | samba, carnival, moving | [x] "Lagoa v1" (Kevin MacLeod), 391 KB |
| `carnival-rainforest/challenge.mp3` | challenge | carnival percussion at full tempo: vines, coconuts, costumes; driving, building, percussion forward, 110-140 bpm | 60 s loop | samba, carnival, driving | [x] "Lagoa v2" (Kevin MacLeod), 391 KB |
| `carnival-rainforest/struggle.mp3` | struggle | a deep, dark, thick samba: the ants; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | samba, carnival, tense | [x] "Suvaco do Cristo" (Kevin MacLeod), 352 KB |
| `carnival-rainforest/chill-zone.mp3` | chill-zone | a classy samba piano on the beach; relief and a little swagger, mid-tempo, warm | 45 s loop | samba, carnival, relief and a little swagger | [x] "Samba Isobel" (Kevin MacLeod), 352 KB |
| `carnival-rainforest/elimination.mp3` | elimination | an acoustic guitar and soft latin percussion, slow; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | samba, carnival, sombre and short | [x] "Sancho Panza gets a Latte" (Kevin MacLeod), 274 KB |
| `carnival-rainforest/recap.mp3` | recap | a hideously happy latin parade; quick, punchy, recap energy, the place still in it | 30-40 s loop | samba, carnival, quick | [x] "Peppy Pepe" (Kevin MacLeod), 235 KB |
| `carnival-rainforest/interview.mp3` | interview | a soft jazz samba under the voice; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | samba, carnival, light | [x] "Modern Jazz Samba" (Kevin MacLeod), 313 KB |

## Haunted Castle (`haunted-castle/`)

**Sound of the place**: a gothic castle at night: pipe organ, dark strings, a theremin in the graveyard.  
**Search**: pipe organ, gothic, spooky, halloween, dark strings, horror comedy.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `haunted-castle/opener.mp3` | opener | a great pipe organ toccata: the castle on the hill; bright, confident, the place in its first bars | 40-60 s loop | pipe organ, gothic, bright | [x] "Toccata and Fugue in D Minor" (Kevin MacLeod), 352 KB |
| `haunted-castle/travel.mp3` | travel | a comedically spooky organ and theremin groove; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | pipe organ, gothic, moving | [x] "Graveyard Shift" (Kevin MacLeod), 391 KB |
| `haunted-castle/challenge.mp3` | challenge | dark, driving strings and organs: coffins and horses; driving, building, percussion forward, 110-140 bpm | 60 s loop | pipe organ, gothic, driving | [x] "Grim Idol" (Kevin MacLeod), 391 KB |
| `haunted-castle/struggle.mp3` | struggle | mournful, tense strings: the beam, the vault, the coach; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | pipe organ, gothic, tense | [x] "Gloom Horizon" (Kevin MacLeod), 352 KB |
| `haunted-castle/chill-zone.mp3` | chill-zone | a mysterious celesta and tuba waltz under the moon; relief and a little swagger, mid-tempo, warm | 45 s loop | pipe organ, gothic, relief and a little swagger | [x] "Moonlight Hall" (Kevin MacLeod), 352 KB |
| `haunted-castle/elimination.mp3` | elimination | a sparse, dark piano; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | pipe organ, gothic, sombre and short | [x] "Ghost Dance" (Kevin MacLeod), 274 KB |
| `haunted-castle/recap.mp3` | recap | quick organ, choir and orchestra; quick, punchy, recap energy, the place still in it | 30-40 s loop | pipe organ, gothic, quick | [x] "Unholy Knight" (Kevin MacLeod), 235 KB |
| `haunted-castle/interview.mp3` | interview | a soft, spooky vibraphone; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | pipe organ, gothic, light | [x] "Ghost Story" (Kevin MacLeod), 313 KB |

## Lei Island (`lei-island/`)

**Sound of the place**: the island of flower garlands: ukulele, marimba, tongue drum and slack-key guitar.  
**Search**: ukulele, island, marimba, tropical, relaxed.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `lei-island/opener.mp3` | opener | a bright marimba and ukulele morning; bright, confident, the place in its first bars | 40-60 s loop | ukulele, island, bright | [x] "Rainbows" (Kevin MacLeod), 352 KB |
| `lei-island/travel.mp3` | travel | a cheery mid-tempo ukulele along the coast road; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | ukulele, island, moving | [x] "Life of Riley" (Kevin MacLeod), 391 KB |
| `lei-island/challenge.mp3` | challenge | a driving tongue drum and percussion: the ring, the coals; driving, building, percussion forward, 110-140 bpm | 60 s loop | ukulele, island, driving | [x] "Journey To Ascend" (Kevin MacLeod), 391 KB |
| `lei-island/struggle.mp3` | struggle | a mysterious island groove: deep water, hot coals; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | ukulele, island, tense | [x] "Secret of Tiki Island" (Kevin MacLeod), 352 KB |
| `lei-island/chill-zone.mp3` | chill-zone | a calm ukulele by the tiki hut; relief and a little swagger, mid-tempo, warm | 45 s loop | ukulele, island, relief and a little swagger | [x] "Daily Beetle" (Kevin MacLeod), 352 KB |
| `lei-island/elimination.mp3` | elimination | a slow, sad ukulele and flutes; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | ukulele, island, sombre and short | [x] "Leaving Home" (Kevin MacLeod), 274 KB |
| `lei-island/recap.mp3` | recap | quick ukulele and glockenspiel; quick, punchy, recap energy, the place still in it | 30-40 s loop | ukulele, island, quick | [x] "Glitter Blast" (Kevin MacLeod), 235 KB |
| `lei-island/interview.mp3` | interview | a soft, flowing guitar and ukulele; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | ukulele, island, light | [x] "Fretless" (Kevin MacLeod), 313 KB |

## Glass Tower Gulf (`glass-tower-gulf/`)

**Sound of the place**: the glass city in the desert: sleek electronic pop, a saz-like pluck, cool downtempo.  
**Search**: electronic, techno-pop, downtempo, desert city, sleek.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `glass-tower-gulf/opener.mp3` | opener | a bright, fast techno-pop skyline; bright, confident, the place in its first bars | 40-60 s loop | electronic, techno-pop, bright | [x] "Shiny Tech" (Kevin MacLeod), 352 KB |
| `glass-tower-gulf/travel.mp3` | travel | a light synth groove on the desert highway; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | electronic, techno-pop, moving | [x] "Aerosol of my Love" (Kevin MacLeod), 391 KB |
| `glass-tower-gulf/challenge.mp3` | challenge | driving electronic percussion: the gondola and the tennis machine; driving, building, percussion forward, 110-140 bpm | 60 s loop | electronic, techno-pop, driving | [x] "Blown Away" (Kevin MacLeod), 391 KB |
| `glass-tower-gulf/struggle.mp3` | struggle | a cool downtempo with heavy percussion: heights and a robot that never misses; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | electronic, techno-pop, tense | [x] "Severe Tire Damage" (Kevin MacLeod), 352 KB |
| `glass-tower-gulf/chill-zone.mp3` | chill-zone | a dark, grooving piano electronica at the gold market; relief and a little swagger, mid-tempo, warm | 45 s loop | electronic, techno-pop, relief and a little swagger | [x] "Thinking Out Loud" (Kevin MacLeod), 352 KB |
| `glass-tower-gulf/elimination.mp3` | elimination | a calm, slow electric piano; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | electronic, techno-pop, sombre and short | [x] "Mana Two - Part 3" (Kevin MacLeod), 274 KB |
| `glass-tower-gulf/recap.mp3` | recap | a quick saz-and-bass groove; quick, punchy, recap energy, the place still in it | 30-40 s loop | electronic, techno-pop, quick | [x] "Cantina Blues" (Kevin MacLeod), 235 KB |
| `glass-tower-gulf/interview.mp3` | interview | a slow, mystical dub under the voice; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | electronic, techno-pop, light | [x] "Dub Eastern" (Kevin MacLeod), 313 KB |

## Swamp Prison (`swamp-prison/`)

**Sound of the place**: the old prison in the swamp: blues, a harmonica, slide guitar and a slow organ.  
**Search**: blues, harmonica, deep south, swamp, slide.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `swamp-prison/opener.mp3` | opener | a grooving harmonica blues: the old prison; bright, confident, the place in its first bars | 40-60 s loop | blues, harmonica, bright | [x] "Matt's Blues" (Kevin MacLeod), 352 KB |
| `swamp-prison/travel.mp3` | travel | a deep-south harmonica and accordion along the swamp road; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | blues, harmonica, moving | [x] "Bama Country" (Kevin MacLeod), 391 KB |
| `swamp-prison/challenge.mp3` | challenge | a rolling blues riff: the cell and the raft; driving, building, percussion forward, 110-140 bpm | 60 s loop | blues, harmonica, driving | [x] "Hustle" (Kevin MacLeod), 391 KB |
| `swamp-prison/struggle.mp3` | struggle | a slow, mysterious blues: a spoon against a wall; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | blues, harmonica, tense | [x] "Dirt Rhodes" (Kevin MacLeod), 352 KB |
| `swamp-prison/chill-zone.mp3` | chill-zone | a relaxed slow blues on the dock; relief and a little swagger, mid-tempo, warm | 45 s loop | blues, harmonica, relief and a little swagger | [x] "Nile's Blues" (Kevin MacLeod), 352 KB |
| `swamp-prison/elimination.mp3` | elimination | a lonely guitar and harmonica; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | blues, harmonica, sombre and short | [x] "Porch Blues" (Kevin MacLeod), 274 KB |
| `swamp-prison/recap.mp3` | recap | a quick boogie-woogie; quick, punchy, recap energy, the place still in it | 30-40 s loop | blues, harmonica, quick | [x] "Boogie Party" (Kevin MacLeod), 235 KB |
| `swamp-prison/interview.mp3` | interview | a basic, relaxed 12-bar blues; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | blues, harmonica, light | [x] "OctoBlues" (Kevin MacLeod), 313 KB |

## Outback Farm (`outback-farm/`)

**Sound of the place**: a farm in the bush: a bush band, banjo and fiddle, flute, a didgeridoo drone.  
**Search**: bush band, folk, banjo, fiddle, didgeridoo.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `outback-farm/opener.mp3` | opener | a bouncy banjo and flute: the farm; bright, confident, the place in its first bars | 40-60 s loop | bush band, folk, bright | [x] "Kings of Tara" (Kevin MacLeod), 352 KB |
| `outback-farm/travel.mp3` | travel | a bright banjo and fiddle swing down the dirt road; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | bush band, folk, moving | [x] "Hillbilly Swing" (Kevin MacLeod), 391 KB |
| `outback-farm/challenge.mp3` | challenge | a comedic banjo romp: ten rabbits loose; driving, building, percussion forward, 110-140 bpm | 60 s loop | bush band, folk, driving | [x] "DarxieLand" (Kevin MacLeod), 391 KB |
| `outback-farm/struggle.mp3` | struggle | a dark didgeridoo drone and strings; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | bush band, folk, tense | [x] "Dragon and Toast" (Kevin MacLeod), 352 KB |
| `outback-farm/chill-zone.mp3` | chill-zone | a calm fiddle and harp over the valley; relief and a little swagger, mid-tempo, warm | 45 s loop | bush band, folk, relief and a little swagger | [x] "Skye Cuillin" (Kevin MacLeod), 352 KB |
| `outback-farm/elimination.mp3` | elimination | slow, sombre pipes; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | bush band, folk, sombre and short | [x] "Hidden Past" (Kevin MacLeod), 274 KB |
| `outback-farm/recap.mp3` | recap | a quick hammered dulcimer and whistle; quick, punchy, recap energy, the place still in it | 30-40 s loop | bush band, folk, quick | [x] "Celtic Impulse" (Kevin MacLeod), 235 KB |
| `outback-farm/interview.mp3` | interview | soft percussion, a world groove under the voice; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | bush band, folk, light | [x] "Lotus" (Kevin MacLeod), 313 KB |

## Fjord Peaks (`fjord-peaks/`)

**Sound of the place**: the mountains over the gorge: soaring strings, horns and a low choir.  
**Search**: epic strings, choir, mountains, mystical.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `fjord-peaks/opener.mp3` | opener | a big choir and brass rising over the peaks; bright, confident, the place in its first bars | 40-60 s loop | epic strings, choir, bright | [x] "Magistar" (Kevin MacLeod), 352 KB |
| `fjord-peaks/travel.mp3` | travel | harp, choir and flute on the train through the valleys; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | epic strings, choir, moving | [x] "Ascending the Vale" (Kevin MacLeod), 391 KB |
| `fjord-peaks/challenge.mp3` | challenge | driving strings and choir: the bridge and the dance stage; driving, building, percussion forward, 110-140 bpm | 60 s loop | epic strings, choir, driving | [x] "Killers" (Kevin MacLeod), 391 KB |
| `fjord-peaks/struggle.mp3` | struggle | eerie strings and a low choir: the drop below; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | epic strings, choir, tense | [x] "Lost Frontier" (Kevin MacLeod), 352 KB |
| `fjord-peaks/chill-zone.mp3` | chill-zone | lush, calm voices by the lake; relief and a little swagger, mid-tempo, warm | 45 s loop | epic strings, choir, relief and a little swagger | [x] "Heart of Nowhere" (Kevin MacLeod), 352 KB |
| `fjord-peaks/elimination.mp3` | elimination | a solemn choir and cellos; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | epic strings, choir, sombre and short | [x] "Night Vigil" (Kevin MacLeod), 274 KB |
| `fjord-peaks/recap.mp3` | recap | quick percussion, brass and choir; quick, punchy, recap energy, the place still in it | 30-40 s loop | epic strings, choir, quick | [x] "Burnt Spirit" (Kevin MacLeod), 235 KB |
| `fjord-peaks/interview.mp3` | interview | soft strings and a distant choir; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | epic strings, choir, light | [x] "Ever Mindful" (Kevin MacLeod), 313 KB |

## Prairie Ranch (`prairie-ranch/`)

**Sound of the place**: a ranch on the prairie: honky-tonk piano, country guitars and a western edge.  
**Search**: country, western, honky-tonk, saloon, cowboy.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `prairie-ranch/opener.mp3` | opener | fast, upbeat country guitars and mandolin; bright, confident, the place in its first bars | 40-60 s loop | country, western, bright | [x] "Guts and Bourbon" (Kevin MacLeod), 352 KB |
| `prairie-ranch/travel.mp3` | travel | a saloon ragtime romp down the prairie road; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | country, western, moving | [x] "Hyperfun" (Kevin MacLeod), 391 KB |
| `prairie-ranch/challenge.mp3` | challenge | a driving, grooving western: beans and the bull; driving, building, percussion forward, 110-140 bpm | 60 s loop | country, western, driving | [x] "Robo-Western" (Kevin MacLeod), 391 KB |
| `prairie-ranch/struggle.mp3` | struggle | a dark, tense western guitar; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | country, western, tense | [x] "Smoking Gun" (Kevin MacLeod), 352 KB |
| `prairie-ranch/chill-zone.mp3` | chill-zone | a slow country sing-along on the cliff top; relief and a little swagger, mid-tempo, warm | 45 s loop | country, western, relief and a little swagger | [x] "Drankin Song" (Kevin MacLeod), 352 KB |
| `prairie-ranch/elimination.mp3` | elimination | a lonely western harp; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | country, western, sombre and short | [x] "Pale Rider" (Kevin MacLeod), 274 KB |
| `prairie-ranch/recap.mp3` | recap | a short western sting; quick, punchy, recap energy, the place still in it | 30-40 s loop | country, western, quick | [x] "Cowboy Sting" (Kevin MacLeod), 235 KB |
| `prairie-ranch/interview.mp3` | interview | big drums and an exposed western guitar; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | country, western, light | [x] "Neo Western" (Kevin MacLeod), 313 KB |

## Ice Floe (`ice-floe/`)

**Sound of the place**: the ice at the top of the world: sparse glassy ambient, drones, the wind.  
**Search**: ambient, drone, cold, sparse, mysterious.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `ice-floe/opener.mp3` | opener | a slow, mystical bass flute over the ice; bright, confident, the place in its first bars | 40-60 s loop | ambient, drone, bright | [x] "Thunderbird" (Kevin MacLeod), 352 KB |
| `ice-floe/travel.mp3` | travel | a drifting drone, the plane over the tundra; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | ambient, drone, moving | [x] "Mirage" (Kevin MacLeod), 391 KB |
| `ice-floe/challenge.mp3` | challenge | sharp subtle percussion: the rings and the igloo; driving, building, percussion forward, 110-140 bpm | 60 s loop | ambient, drone, driving | [x] "Static Motion" (Kevin MacLeod), 391 KB |
| `ice-floe/struggle.mp3` | struggle | dark, unsettled synths: the cold getting in; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | ambient, drone, tense | [x] "Controlled Chaos" (Kevin MacLeod), 352 KB |
| `ice-floe/chill-zone.mp3` | chill-zone | a calm, shimmering ambience; relief and a little swagger, mid-tempo, warm | 45 s loop | ambient, drone, relief and a little swagger | [x] "New Direction" (Kevin MacLeod), 352 KB |
| `ice-floe/elimination.mp3` | elimination | a slow viol over a drone; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | ambient, drone, sombre and short | [x] "Virtutes Instrumenti" (Kevin MacLeod), 274 KB |
| `ice-floe/recap.mp3` | recap | a chordal, dark soundscape; quick, punchy, recap energy, the place still in it | 30-40 s loop | ambient, drone, quick | [x] "Thunder Dreams" (Kevin MacLeod), 235 KB |
| `ice-floe/interview.mp3` | interview | a soft, long drone; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | ambient, drone, light | [x] "Drone in D" (Kevin MacLeod), 313 KB |

## Dragon Isle (`dragon-isle/`)

**Sound of the place**: the island of dragons: gamelan, marimba and kalimba over tense jungle drums.  
**Search**: gamelan, marimba, kalimba, jungle percussion, mysterious.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `dragon-isle/opener.mp3` | opener | a mystical gamelan; bright, confident, the place in its first bars | 40-60 s loop | gamelan, marimba, bright | [x] "Mystic Force" (Kevin MacLeod), 352 KB |
| `dragon-isle/travel.mp3` | travel | a dark grooving marimba and kalimba; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | gamelan, marimba, moving | [x] "Artifact" (Kevin MacLeod), 391 KB |
| `dragon-isle/challenge.mp3` | challenge | aggressive drums and kalimba: the dragons; driving, building, percussion forward, 110-140 bpm | 60 s loop | gamelan, marimba, driving | [x] "Blue Scorpion" (Kevin MacLeod), 391 KB |
| `dragon-isle/struggle.mp3` | struggle | a confused, unnerving percussion groove; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | gamelan, marimba, tense | [x] "Confused State" (Kevin MacLeod), 352 KB |
| `dragon-isle/chill-zone.mp3` | chill-zone | a calm koto and strings at sunset; relief and a little swagger, mid-tempo, warm | 45 s loop | gamelan, marimba, relief and a little swagger | [x] "Finding Movement" (Kevin MacLeod), 352 KB |
| `dragon-isle/elimination.mp3` | elimination | a minimal, droning piano; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | gamelan, marimba, sombre and short | [x] "Immersed" (Kevin MacLeod), 274 KB |
| `dragon-isle/recap.mp3` | recap | quick tribal percussion and voices; quick, punchy, recap energy, the place still in it | 30-40 s loop | gamelan, marimba, quick | [x] "Trouble with Tribals" (Kevin MacLeod), 235 KB |
| `dragon-isle/interview.mp3` | interview | soft plucked strings and rain; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | gamelan, marimba, light | [x] "Eastminster" (Kevin MacLeod), 313 KB |

## Neon Desert (`neon-desert/`)

**Sound of the place**: a neon strip in the desert: lounge brass, ska horns, a slot-machine shimmer.  
**Search**: lounge, brass, ska, cocktail, strip.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `neon-desert/opener.mp3` | opener | a TV street-party brass band; bright, confident, the place in its first bars | 40-60 s loop | lounge, brass, bright | [x] "Street Party" (Kevin MacLeod), 352 KB |
| `neon-desert/travel.mp3` | travel | a driving sax and synth theme off the strip; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | lounge, brass, moving | [x] "Miami Nights - Extended Theme" (Kevin MacLeod), 391 KB |
| `neon-desert/challenge.mp3` | challenge | bright, bouncing ska horns: the buggy and the lion; driving, building, percussion forward, 110-140 bpm | 60 s loop | lounge, brass, driving | [x] "Blue Ska" (Kevin MacLeod), 391 KB |
| `neon-desert/struggle.mp3` | struggle | an uneasy lounge groove, vibraphone and trumpet; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | lounge, brass, tense | [x] "Port Horizon" (Kevin MacLeod), 352 KB |
| `neon-desert/chill-zone.mp3` | chill-zone | a relaxed tremolo-guitar lounge; relief and a little swagger, mid-tempo, warm | 45 s loop | lounge, brass, relief and a little swagger | [x] "Bummin on Tremelo" (Kevin MacLeod), 352 KB |
| `neon-desert/elimination.mp3` | elimination | a dark, somber acoustic guitar; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | lounge, brass, sombre and short | [x] "Just As Soon" (Kevin MacLeod), 274 KB |
| `neon-desert/recap.mp3` | recap | a quick funky horn hit; quick, punchy, recap energy, the place still in it | 30-40 s loop | lounge, brass, quick | [x] "I Got a Stick Arr Bryan Teoh" (Kevin MacLeod), 221 KB |
| `neon-desert/interview.mp3` | interview | a light swinging beat; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | lounge, brass, light | [x] "Vicious" (Kevin MacLeod), 313 KB |

## Pyramid Coast (`pyramid-coast/`)

**Sound of the place**: the coast below the step pyramid: trumpets and guitars, accordion and marimba.  
**Search**: trumpet, latin guitar, accordion, marimba, festive.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `pyramid-coast/opener.mp3` | opener | a sleepy, bouncing trumpet band; bright, confident, the place in its first bars | 40-60 s loop | trumpet, latin guitar, bright | [x] "Mariachi Snooze" (Kevin MacLeod), 296 KB |
| `pyramid-coast/travel.mp3` | travel | accordion and marimba along the coast road; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | trumpet, latin guitar, moving | [x] "Del Rio Bravo" (Kevin MacLeod), 391 KB |
| `pyramid-coast/challenge.mp3` | challenge | a driving, intense guitar: peppers and the cliff; driving, building, percussion forward, 110-140 bpm | 60 s loop | trumpet, latin guitar, driving | [x] "El Magicia" (Kevin MacLeod), 391 KB |
| `pyramid-coast/struggle.mp3` | struggle | a dark guitar and sax; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | trumpet, latin guitar, tense | [x] "As I Figure" (Kevin MacLeod), 352 KB |
| `pyramid-coast/chill-zone.mp3` | chill-zone | laid-back reverbed guitars at the pyramid; relief and a little swagger, mid-tempo, warm | 45 s loop | trumpet, latin guitar, relief and a little swagger | [x] "Laid Back Guitars" (Kevin MacLeod), 352 KB |
| `pyramid-coast/elimination.mp3` | elimination | a guitar and lute by the fire; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | trumpet, latin guitar, sombre and short | [x] "Midnight Tale" (Kevin MacLeod), 274 KB |
| `pyramid-coast/recap.mp3` | recap | a quick, dark brass circus; quick, punchy, recap energy, the place still in it | 30-40 s loop | trumpet, latin guitar, quick | [x] "Circus of Freaks" (Kevin MacLeod), 235 KB |
| `pyramid-coast/interview.mp3` | interview | a soft classical guitar and harp; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | trumpet, latin guitar, light | [x] "Morning" (Kevin MacLeod), 313 KB |

## Stilt River (`stilt-river/`)

**Sound of the place**: a river of stilt villages and temples: marimba and bells, hand drums, flute over the water.  
**Search**: marimba, bells, hand drum, flute, river, mystical.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `stilt-river/opener.mp3` | opener | a mysterious club groove of marimba and bells; bright, confident, the place in its first bars | 40-60 s loop | marimba, bells, bright | [x] "Ethernight Club" (Kevin MacLeod), 352 KB |
| `stilt-river/travel.mp3` | travel | hand drums, bells and a river flute up the river; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | marimba, bells, moving | [x] "River Fire" (Kevin MacLeod), 391 KB |
| `stilt-river/challenge.mp3` | challenge | a bright marimba groove: the catfish; driving, building, percussion forward, 110-140 bpm | 60 s loop | marimba, bells, driving | [x] "Ave Marimba" (Kevin MacLeod), 391 KB |
| `stilt-river/struggle.mp3` | struggle | a mysterious marimba waltz and choir: the tunnels; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | marimba, bells, tense | [x] "Ancient Mystery Waltz (Allegro)" (Kevin MacLeod), 352 KB |
| `stilt-river/chill-zone.mp3` | chill-zone | a calm marimba at the temple; relief and a little swagger, mid-tempo, warm | 45 s loop | marimba, bells, relief and a little swagger | [x] "Silver Flame" (Kevin MacLeod), 352 KB |
| `stilt-river/elimination.mp3` | elimination | slow drums and bells; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | marimba, bells, sombre and short | [x] "Spirit of the Girl" (Kevin MacLeod), 274 KB |
| `stilt-river/recap.mp3` | recap | a quick, mischievous dulcimer and xylophone; quick, punchy, recap energy, the place still in it | 30-40 s loop | marimba, bells, quick | [x] "Mischief Maker" (Kevin MacLeod), 235 KB |
| `stilt-river/interview.mp3` | interview | a soft flute over running water; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | marimba, bells, light | [x] "River Flute" (Kevin MacLeod), 313 KB |

## Frozen Mine (`frozen-mine/`)

**Sound of the place**: a mine on a frozen lake: plucked harps and zither, glockenspiel, cold pads.  
**Search**: harp, zither, plucked strings, glockenspiel, cold.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `frozen-mine/opener.mp3` | opener | a bright, mystical glockenspiel and harp; bright, confident, the place in its first bars | 40-60 s loop | harp, zither, bright | [x] "Aquarium" (Kevin MacLeod), 352 KB |
| `frozen-mine/travel.mp3` | travel | a grooving zither and strings on the snowy road; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | harp, zither, moving | [x] "Morgana Rides" (Kevin MacLeod), 391 KB |
| `frozen-mine/challenge.mp3` | challenge | an adventurous harp and bassoon: the yachts and the shaft; driving, building, percussion forward, 110-140 bpm | 60 s loop | harp, zither, driving | [x] "Adventures in Adventureland" (Kevin MacLeod), 391 KB |
| `frozen-mine/struggle.mp3` | struggle | a dark little xylophone and bassoon; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | harp, zither, tense | [x] "Holiday Weasel" (Kevin MacLeod), 352 KB |
| `frozen-mine/chill-zone.mp3` | chill-zone | a calm autoharp in the sauna; relief and a little swagger, mid-tempo, warm | 45 s loop | harp, zither, relief and a little swagger | [x] "Canon in D for Autoharp" (Kevin MacLeod), 352 KB |
| `frozen-mine/elimination.mp3` | elimination | a slow harp meditation; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | harp, zither, sombre and short | [x] "Elf Meditation" (Kevin MacLeod), 274 KB |
| `frozen-mine/recap.mp3` | recap | a quick lute and strings; quick, punchy, recap energy, the place still in it | 30-40 s loop | harp, zither, quick | [x] "Industrious Ferret" (Kevin MacLeod), 235 KB |
| `frozen-mine/interview.mp3` | interview | a soft harp and pads; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | harp, zither, light | [x] "Ancient Winds" (Kevin MacLeod), 313 KB |

## Tea Hills (`tea-hills/`)

**Sound of the place**: tea terraces in the morning: sitar, tabla and bansuri, a steam train chuffing.  
**Search**: sitar, tabla, bansuri, raga, morning.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `tea-hills/opener.mp3` | opener | a grooving sitar, tambura and bansuri; bright, confident, the place in its first bars | 40-60 s loop | sitar, tabla, bright | [x] "Vadodora" (Kevin MacLeod), 352 KB |
| `tea-hills/travel.mp3` | travel | a super-groovy sitar and percussion up the hill road; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | sitar, tabla, moving | [x] "Jalandhar" (Kevin MacLeod), 391 KB |
| `tea-hills/challenge.mp3` | challenge | driving drums and shakers: the baskets and the train; driving, building, percussion forward, 110-140 bpm | 60 s loop | sitar, tabla, driving | [x] "Cretaceous Dawn" (Kevin MacLeod), 391 KB |
| `tea-hills/struggle.mp3` | struggle | an intense, psychedelic sitar; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | sitar, tabla, tense | [x] "Psychedelic Crater" (Kevin MacLeod), 352 KB |
| `tea-hills/chill-zone.mp3` | chill-zone | drums and harp at the station; relief and a little swagger, mid-tempo, warm | 45 s loop | sitar, tabla, relief and a little swagger | [x] "Truth in the Stones" (Kevin MacLeod), 352 KB |
| `tea-hills/elimination.mp3` | elimination | a sarod melody over a drone; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | sitar, tabla, sombre and short | [x] "Dhaka" (Kevin MacLeod), 274 KB |
| `tea-hills/recap.mp3` | recap | four big drums; quick, punchy, recap energy, the place still in it | 30-40 s loop | sitar, tabla, quick | [x] "Big Drumming" (Kevin MacLeod), 235 KB |
| `tea-hills/interview.mp3` | interview | a soft tongue drum and strings; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | sitar, tabla, light | [x] "Ethereal Relaxation" (Kevin MacLeod), 313 KB |

## Pampas Ranch (`pampas-ranch/`)

**Sound of the place**: a tango city and the grasslands: piano and accordion tango, open acoustic guitars.  
**Search**: tango, accordion, acoustic guitar, folk, grasslands.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `pampas-ranch/opener.mp3` | opener | a tango in two chords; bright, confident, the place in its first bars | 40-60 s loop | tango, accordion, bright | [x] "Tango de Manzana" (Kevin MacLeod), 352 KB |
| `pampas-ranch/travel.mp3` | travel | flowing acoustic guitars out to the grasslands; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | tango, accordion, moving | [x] "Porch Swing Days - faster" (Kevin MacLeod), 391 KB |
| `pampas-ranch/challenge.mp3` | challenge | an intense guitar waltz: the dance and the emu; driving, building, percussion forward, 110-140 bpm | 60 s loop | tango, accordion, driving | [x] "Feral Angel Waltz" (Kevin MacLeod), 391 KB |
| `pampas-ranch/struggle.mp3` | struggle | a dark folk round on guitar and violin; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | tango, accordion, tense | [x] "Folk Round" (Kevin MacLeod), 352 KB |
| `pampas-ranch/chill-zone.mp3` | chill-zone | slower, warm acoustic guitars at the cliff; relief and a little swagger, mid-tempo, warm | 45 s loop | tango, accordion, relief and a little swagger | [x] "Porch Swing Days - slower" (Kevin MacLeod), 352 KB |
| `pampas-ranch/elimination.mp3` | elimination | an intimate guitar dance; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | tango, accordion, sombre and short | [x] "Sardana" (Kevin MacLeod), 274 KB |
| `pampas-ranch/recap.mp3` | recap | a bright little guitar groove; quick, punchy, recap energy, the place still in it | 30-40 s loop | tango, accordion, quick | [x] "Happy Alley" (Kevin MacLeod), 235 KB |
| `pampas-ranch/interview.mp3` | interview | an easy guitar waltz; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | tango, accordion, light | [x] "Joey's Formal Waltz - Unscented" (Kevin MacLeod), 313 KB |

## Game Show City (`game-show-city/`)

**Sound of the place**: a giant game show: hyper chiptune jingles, arcade synths and a studio band.  
**Search**: chiptune, arcade, game show, synth pop.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `game-show-city/opener.mp3` | opener | a bright, uplifting arcade synth; bright, confident, the place in its first bars | 40-60 s loop | chiptune, arcade, bright | [x] "Neon Laser Horizon" (Kevin MacLeod), 352 KB |
| `game-show-city/travel.mp3` | travel | a chiptune groove on the bullet train; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | chiptune, arcade, moving | [x] "Voxel Revolution" (Kevin MacLeod), 391 KB |
| `game-show-city/challenge.mp3` | challenge | a manic balloon-game loop: human pinball; driving, building, percussion forward, 110-140 bpm | 60 s loop | chiptune, arcade, driving | [x] "Balloon Game" (Kevin MacLeod), 391 KB |
| `game-show-city/struggle.mp3` | struggle | a pulsing synth groove; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | chiptune, arcade, tense | [x] "Brain Dance" (Kevin MacLeod), 352 KB |
| `game-show-city/chill-zone.mp3` | chill-zone | a relaxed space jazz on the stage; relief and a little swagger, mid-tempo, warm | 45 s loop | chiptune, arcade, relief and a little swagger | [x] "Space Jazz" (Kevin MacLeod), 352 KB |
| `game-show-city/elimination.mp3` | elimination | a calm synth canon; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | chiptune, arcade, sombre and short | [x] "Canon In D Interstellar Mix" (Kevin MacLeod), 274 KB |
| `game-show-city/recap.mp3` | recap | a frantic game-show band; quick, punchy, recap energy, the place still in it | 30-40 s loop | chiptune, arcade, quick | [x] "Happy Happy Game Show" (Kevin MacLeod), 235 KB |
| `game-show-city/interview.mp3` | interview | a blip-bloop screen saver; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | chiptune, arcade, light | [x] "Screen Saver" (Kevin MacLeod), 313 KB |

## Ice River (`ice-river/`)

**Sound of the place**: a frozen river at the edge of the world: low brass, plucked harps and cold, sparse strings.  
**Search**: low brass, harp, sparse, cold, somber.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `ice-river/opener.mp3` | opener | a dark, mysterious tuba and horns; bright, confident, the place in its first bars | 40-60 s loop | low brass, harp, bright | [x] "Mary Celeste" (Kevin MacLeod), 352 KB |
| `ice-river/travel.mp3` | travel | a harp solo over the snow; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | low brass, harp, moving | [x] "Enchanted Journey" (Kevin MacLeod), 391 KB |
| `ice-river/challenge.mp3` | challenge | a comic plucked-strings plan: floes and the sled; driving, building, percussion forward, 110-140 bpm | 60 s loop | low brass, harp, driving | [x] "Marty Gots a Plan" (Kevin MacLeod), 391 KB |
| `ice-river/struggle.mp3` | struggle | dark, eerie strings and clarinet; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | low brass, harp, tense | [x] "Vanishing" (Kevin MacLeod), 352 KB |
| `ice-river/chill-zone.mp3` | chill-zone | a mystical autoharp at the finish; relief and a little swagger, mid-tempo, warm | 45 s loop | low brass, harp, relief and a little swagger | [x] "Dama-May" (Kevin MacLeod), 352 KB |
| `ice-river/elimination.mp3` | elimination | a slow bassoon and harp; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | low brass, harp, sombre and short | [x] "Plaint" (Kevin MacLeod), 274 KB |
| `ice-river/recap.mp3` | recap | a quick epic horn and hurdy-gurdy; quick, punchy, recap energy, the place still in it | 30-40 s loop | low brass, harp, quick | [x] "Strength of the Titans" (Kevin MacLeod), 235 KB |
| `ice-river/interview.mp3` | interview | a soft harp and pennywhistle; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | low brass, harp, light | [x] "Decline" (Kevin MacLeod), 313 KB |

## Snow Peaks (`snow-peaks/`)

**Sound of the place**: the alpine slopes: oompah brass, accordion and tuba polkas.  
**Search**: polka, oompah, accordion, tuba, alpine.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `snow-peaks/opener.mp3` | opener | a bouncing accordion and tuba oompah; bright, confident, the place in its first bars | 40-60 s loop | polka, oompah, bright | [x] "Meanwhile in Bavaria" (Kevin MacLeod), 352 KB |
| `snow-peaks/travel.mp3` | travel | a peppy polka up the cable car; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | polka, oompah, moving | [x] "No Spam Polka" (Kevin MacLeod), 391 KB |
| `snow-peaks/challenge.mp3` | challenge | a manic polka: the sausage and the goats; driving, building, percussion forward, 110-140 bpm | 60 s loop | polka, oompah, driving | [x] "Manic Polka" (Kevin MacLeod), 391 KB |
| `snow-peaks/struggle.mp3` | struggle | a dark little polka; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | polka, oompah, tense | [x] "Dvorak Polka" (Kevin MacLeod), 352 KB |
| `snow-peaks/chill-zone.mp3` | chill-zone | a swinging snare polka at the finish; relief and a little swagger, mid-tempo, warm | 45 s loop | polka, oompah, relief and a little swagger | [x] "Snare Bounce Polka" (Kevin MacLeod), 352 KB |
| `snow-peaks/elimination.mp3` | elimination | a slow, happy-sad polka; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | polka, oompah, sombre and short | [x] "Double Polka" (Kevin MacLeod), 274 KB |
| `snow-peaks/recap.mp3` | recap | an EDM polka; quick, punchy, recap energy, the place still in it | 30-40 s loop | polka, oompah, quick | [x] "Ultra Polka" (Kevin MacLeod), 235 KB |
| `snow-peaks/interview.mp3` | interview | a bright four-beer polka; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | polka, oompah, light | [x] "Four Beers' Polka" (Kevin MacLeod), 313 KB |

## Jungle Ruins (`jungle-ruins/`)

**Sound of the place**: mountain ruins over the jungle: flutes over drums, mysterious and driving.  
**Search**: flute, drums, jungle, ancient, mysterious.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `jungle-ruins/opener.mp3` | opener | a calm flute and drums, our ancestors' sky; bright, confident, the place in its first bars | 40-60 s loop | flute, drums, bright | [x] "The Sky of our Ancestors" (Kevin MacLeod), 352 KB |
| `jungle-ruins/travel.mp3` | travel | a driving guitar and flute up the river; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | flute, drums, moving | [x] "Fearless First" (Kevin MacLeod), 391 KB |
| `jungle-ruins/challenge.mp3` | challenge | a mysterious flute and percussion: the trail and the idol; driving, building, percussion forward, 110-140 bpm | 60 s loop | flute, drums, driving | [x] "River of Io" (Kevin MacLeod), 391 KB |
| `jungle-ruins/struggle.mp3` | struggle | a moody flute over dark synths; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | flute, drums, tense | [x] "Crypto" (Kevin MacLeod), 352 KB |
| `jungle-ruins/chill-zone.mp3` | chill-zone | a bright flute and vibraphone on the ruins; relief and a little swagger, mid-tempo, warm | 45 s loop | flute, drums, relief and a little swagger | [x] "On My Way" (Kevin MacLeod), 352 KB |
| `jungle-ruins/elimination.mp3` | elimination | a sombre pennywhistle and lute; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | flute, drums, sombre and short | [x] "Heavy Heart" (Kevin MacLeod), 274 KB |
| `jungle-ruins/recap.mp3` | recap | dark, driving flutes and strings; quick, punchy, recap energy, the place still in it | 30-40 s loop | flute, drums, quick | [x] "Malicious" (Kevin MacLeod), 235 KB |
| `jungle-ruins/interview.mp3` | interview | soft guitar, flute and xylophone; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | flute, drums, light | [x] "Carpe Diem" (Kevin MacLeod), 313 KB |

## Glass Pyramid City (`glass-pyramid-city/`)

**Sound of the place**: the museum city at night: a café waltz, then a runway's electro beat.  
**Search**: waltz, cafe, electro, runway, club.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `glass-pyramid-city/opener.mp3` | opener | a grand dark waltz at the glass pyramid; bright, confident, the place in its first bars | 40-60 s loop | waltz, cafe, bright | [x] "Grand Dark Waltz Allegro" (Kevin MacLeod), 352 KB |
| `glass-pyramid-city/travel.mp3` | travel | a light piano waltz down the boulevard; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | waltz, cafe, moving | [x] "Starting Out Waltz Allegretto" (Kevin MacLeod), 391 KB |
| `glass-pyramid-city/challenge.mp3` | challenge | a driving electro beat: statues and the runway; driving, building, percussion forward, 110-140 bpm | 60 s loop | waltz, cafe, driving | [x] "Realizer" (Kevin MacLeod), 391 KB |
| `glass-pyramid-city/struggle.mp3` | struggle | a dark, grooving synth; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | waltz, cafe, tense | [x] "Fantasia Fantasia" (Kevin MacLeod), 352 KB |
| `glass-pyramid-city/chill-zone.mp3` | chill-zone | a 1960s club jazz under the lights; relief and a little swagger, mid-tempo, warm | 45 s loop | waltz, cafe, relief and a little swagger | [x] "Deuces" (Kevin MacLeod), 352 KB |
| `glass-pyramid-city/elimination.mp3` | elimination | a slow gymnopédie waltz; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | waltz, cafe, sombre and short | [x] "Valse Gymnopedie" (Kevin MacLeod), 274 KB |
| `glass-pyramid-city/recap.mp3` | recap | a bright, fast EDM hit; quick, punchy, recap energy, the place still in it | 30-40 s loop | waltz, cafe, quick | [x] "Cloud Dancer" (Kevin MacLeod), 235 KB |
| `glass-pyramid-city/interview.mp3` | interview | an easy electro groove; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | waltz, cafe, light | [x] "Getting it Done" (Kevin MacLeod), 313 KB |

## Fishing Cove (`fishing-cove/`)

**Sound of the place**: a fishing cove at the edge of the sea: tin whistle and fiddle jigs, a sea shanty.  
**Search**: jig, reel, tin whistle, shanty, sea.

| File | Moment | Look for | Length | Search | Filled |
|---|---|---|---|---|---|
| `fishing-cove/opener.mp3` | opener | a bouncing tin-whistle tune; bright, confident, the place in its first bars | 40-60 s loop | jig, reel, bright | [x] "Music to Delight" (Kevin MacLeod), 352 KB |
| `fishing-cove/travel.mp3` | travel | a salty sea ditty at the oars; moving, steady pulse, 100-130 bpm, never heavy | 60 s loop | jig, reel, moving | [x] "Salty Ditty" (Kevin MacLeod), 391 KB |
| `fishing-cove/challenge.mp3` | challenge | a solid village jig: the welcome rite; driving, building, percussion forward, 110-140 bpm | 60 s loop | jig, reel, driving | [x] "Thatched Villagers" (Kevin MacLeod), 391 KB |
| `fishing-cove/struggle.mp3` | struggle | a dark accordion and whistle shanty; tense, low, ticking, unresolved (strings or the place's drums, minor) | 45 s loop | jig, reel, tense | [x] "Netherworld Shanty" (Kevin MacLeod), 352 KB |
| `fishing-cove/chill-zone.mp3` | chill-zone | a relaxed groove with uilleann pipes by the shack; relief and a little swagger, mid-tempo, warm | 45 s loop | jig, reel, relief and a little swagger | [x] "Cold Sober" (Kevin MacLeod), 352 KB |
| `fishing-cove/elimination.mp3` | elimination | a slow little flute and glockenspiel waltz; sombre and short, slow, sparse, one or two instruments | 30-45 s loop | jig, reel, sombre and short | [x] "Teddy Bear Waltz" (Kevin MacLeod), 274 KB |
| `fishing-cove/recap.mp3` | recap | a quick, poofy reel; quick, punchy, recap energy, the place still in it | 30-40 s loop | jig, reel, quick | [x] "Poofy Reel" (Kevin MacLeod), 235 KB |
| `fishing-cove/interview.mp3` | interview | a medieval minstrel round; light, low, under a voice: soft pulse, no melody fighting the words | 40 s loop | jig, reel, light | [x] "Minstrel Guild" (Kevin MacLeod), 313 KB |
