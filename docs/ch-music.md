# The Challenge: music and sound

Everything the Challenge viewer (`js/vp-ch-ep/`) plays, one row per part of the game. The
sound module is `js/vp-ch-ep/sound.js`; `tests/ch-vp-sound.test.js` checks that every file it
names is here and on disk.

The user found the tracks on 2026-10-15 (Mixkit, Pixabay, BigSoundBank; free licences) and
saved them to `Downloads/Challenge-art/music/<slot>/`, with `SUGGESTED-USE.txt` saying what
each one is. `tools/ch-make-audio.py` turns that folder into the files below:

```
python tools/ch-make-audio.py [path/to/Challenge-art/music]
```

It trims the silence in front, layers the moments that are several sounds at once, loops the
ambience (tail crossfaded into the head), levels beds to -17 dB and stingers to -14 dB (RMS of
the part that sounds, peaks under -1 dBFS) and encodes 128 kbps mp3. A file it could not
raise all the way without clipping prints a `lift`, which `sound.js` gives back on playback.

How it plays (manual §6.6, §18):

- **Beds** loop under a moment, read off the step on screen: a step can only sound like what
  is on screen.
- **Stingers** play when the viewer moves to a step (a click, Play, a place on the map). Going
  back, restarting or seeking moves the music only.
- **Music only where the moment earns it.** A house scene plays the music of the event it is
  (`MOOD_OF` in `sound.js`), and anything else plays the place itself: the sea by day,
  crickets at night, the jungle on the trails, the torches in the Arena. A confessional is
  silent.
- The site's mute, volume and music on/off apply.

## Beds (`assets/audio/ch/`)

| Bed | File | When it plays | Source (Downloads/Challenge-art/music) |
|---|---|---|---|
| `ch-open` | `open.mp3`, `open-2.mp3` | The show open, "Previously on" | show-open: Rock the Game, Sports Highlights (Ahjay Stelino, Mixkit) |
| `ch-fun` | `fun.mp3` | The arrival, the villa reveal; pranks, the gym, pool games, banter, a kitchen disaster | house-day: Hip Hop 02 (Lily J, Mixkit) |
| `ch-scheming` | `scheming.mp3` | Meetings, deals, recruiting, campaigning, overhearing | house-night: Complicated (Arulo, Mixkit) |
| `ch-drama` | `drama.mp3` | A fight, receipts, a betrayal, a breakup, TJ's house meeting | called-out: Nu Metal - no solo (LiteSaturation, Pixabay) |
| `ch-romance` | `romance.mp3`, `romance-2.mp3` | A spark, a showmance, a date, the hot tub | romance: J.B. R&B Music (Arulo), True Love (Ahjay Stelino), Mixkit |
| `ch-daily` | `daily.mp3` | The daily, from TJ's GO to the winners | daily: Powerful Energetic Nu Metal (Adrenaline) (BrightestAvenue, Pixabay) |
| `ch-deliberation` | `deliberation.mp3` | The vote: the silence before the names | deliberation: Cinematic mystery heartbeat transition (Mixkit) |
| `ch-tribunal` | `tribunal.mp3` | A Tribunal week's vote | tribunal: Epical Drums 01 (Grigoriy Nuzhny, Mixkit) |
| `ch-arena-walk` | `arena-walk.mp3`, `arena-walk-2.mp3` | The house in the stand, the call-out, the game named | arena-walk: Tribal ritual drums, Tribal drumming ambience (Mixkit), over the torches (`td/amb/campfire.ogg`) |
| `ch-arena` | `arena.mp3` | The duel, from the first round to the winner; the final's instant elimination | arena: Extreme Sports Metal - Game On (Keyframe_Audio, Pixabay) |
| `ch-party` | `party.mp3` | The night out at the Beach Club | party: Tech House vibes (Alejandro Magaña, Mixkit) |
| `ch-party-walls` | `party-walls.mp3` | Back at the villa on a party night: the club through the walls | the same track low-passed, under the night crickets |
| `ch-final` | `final.mp3` | The final's start, checkpoints and day two | the-final: Workout Epic Rock Trailer_Inflamed (QubeSounds, Pixabay) |
| `ch-overnight` | `overnight.mp3`, `overnight-2.mp3` | The final's overnight | overnight: Echoes (Andrew Ev), Silent Descent (Eugenio Mininni), Mixkit; with the campfire and the wind |
| `ch-champions` | `champions.mp3` | The champions, from the confetti | champions: Epic Rock Anthem (ikoliks, Pixabay) |
| `ch-goodbye` | `goodbye.mp3` | The Arena goodbye: the loser's last words, the friends down from the stand, the walk to the gate | goodbye: No Way, sad inspirational alternative rock (BirdsDieAlone, Pixabay; found 2026-10-16) |
| `ch-amb-day` | `amb-day.mp3` | Any place by day with no music | waves-wind: Sea waves on a rocky shore (Mixkit) |
| `ch-amb-night` | `amb-night.mp3` | Any place at night with no music | the sea, and jungle crickets at night (Mixkit) |
| `ch-amb-jungle` | `amb-jungle.mp3` | The maze, the tiki path, the trail | jungle: Twilight jungle (Mixkit) |
| `ch-amb-arena` | `amb-arena.mp3` | The Arena after the duel | the campfire and the crickets |

## Stingers (`assets/audio/ch/sfx/`)

| Cue | File | The moment | Made from |
|---|---|---|---|
| `ch-impact` | `sfx/impact.mp3` | The show open: the logo lands | daily-win: Cool impact movie trailer |
| `ch-recap` | `sfx/recap.mp3` | "Previously on The Challenge" | recap: Cinematic transition swoosh heartbeat trailer |
| `ch-card` | `sfx/card.mp3` | A title card: today's daily, tonight, a new alliance, the final | drama-sting: Movie trailer whoosh hit |
| `ch-gong` | `sfx/gong.mp3` | TJ hits the gong: the Arena, a GO, the summit | gong: Big Gong Sound Effect (SoundReality) |
| `ch-horn` | `sfx/horn.mp3`, `sfx/horn-2.mp3` | TJ blows the horn (Demolition, King of the Raft, Reef Dash, Deep Freeze, Pole Grapple, Tug Pit) | air-horn: Air Horn, DJ airhorn |
| `ch-arena-horn` | `sfx/arena-horn.mp3` | Tonight's Arena game is named | arena-horn: Warfare horn |
| `ch-daily-win` | `sfx/daily-win.mp3` | The daily's winners | Cool impact movie trailer + Young crowd cheers |
| `ch-arena-win` | `sfx/arena-win.mp3` | The Arena's winner | Achievement win drums + Stadium joy shouting crowd |
| `ch-eliminated` | `sfx/eliminated.mp3` | ELIMINATED | Traditional stamp + Deep dark horror drum + Electric guitar distorted slide + Paper tear |
| `ch-called-out` | `sfx/called-out.mp3` | CALLED OUT | Deodorant bomb (BigSoundBank) + a guitar stab cut from Nu Metal - no solo (47.04 s) |
| `ch-voted-in` | `sfx/voted-in.mp3` | VOTED IN | Aerosol Spray (Universfield) + Deep cinematic subtle drum impact |
| `ch-spray` | `sfx/spray.mp3` | NEW MEMBER, NOMINATED, SENT IN | Deodorant bomb |
| `ch-betrayed` | `sfx/betrayed.mp3` | BETRAYED, IT'S OVER | Deodorant bomb + Cinematic mystery trailer drum hit |
| `ch-vote` | `sfx/vote.mp3` | Each vote said out loud | the-vote: Deep cinematic subtle drum impact |
| `ch-fight` | `sfx/fight.mp3` | A fight breaks out | fight: Hard horror hit drum |
| `ch-tj` | `sfx/tj.mp3`, `sfx/tj-2.mp3` | TJ takes the floor at a daily | tj: Drum joke accent, Clown horn at circus |
| `ch-whistle` | `sfx/whistle.mp3` | A quit | red-card: Police whistle |
| `ch-tape` | `sfx/tape.mp3` | A disqualification | caution-tape: Duct Tape Rip (kai_audio) + a slap |
| `ch-gate` | `sfx/gate.mp3` | The loser walks out of the Arena | gate: Scary wooden door opening + Gate latch click |
| `ch-crowd` | `sfx/crowd.mp3` | The house walks into the stand | crowd: Stadium joy shouting crowd |
| `ch-confetti` | `sfx/confetti.mp3` | The champions | confetti: 1gift-confetti + Stadium joy shouting crowd |
| `ch-plane` | `sfx/plane.mp3` | The plane lands on the airstrip | plane: Jet plane arrival at airport |
| `ch-splash` | `td/sfx/splash.ogg` | Into the water | the site's own (Total Drama) |
| `ch-mud` | `sfx/mud.mp3`, `sfx/mud-2.mp3` | Into the mud (Hang Time, the mud pit) | mud: Heavy fall into mud, Falling into mud surface |
| `ch-fall` | `sfx/fall.mp3` | Down on the sand; "goes down hard" | body-fall: Body impact falling into the sand |
| `ch-sag` | `sfx/sag.mp3` | The net or the rope drops a notch | rope: Rope creak |
| `ch-creak` | `sfx/creak.mp3` | The bar tips toward the water (Interrogation) | car-jump: Ship hull creak |
| `ch-dig` | `sfx/dig.mp3` | Digging in the sand | coffin: Sand swish |
| `ch-bell` | `sfx/bell.mp3` | A bell rung: the gauntlet, the cages, Hallway Hustle, Spin Stack | bell: Boxing Bell 1 (LazyChillZone) |
| `ch-buzzer` | `sfx/buzzer.mp3` | A buzzer: Food Wars, Puzzle Pit, Buried | buzzer: Short buzzer sound |
| `ch-correct` | `sfx/correct.mp3` | A right answer (not used by a step yet) | buzzer: Correct answer tone |
| `ch-wrong` | `sfx/wrong.mp3` | A wrong word at the maze | buzzer: Electric low buzzer |
| `ch-clock` | `sfx/clock.mp3` | The clock on the poles | timer: Ticking timer |
| `ch-engine` | `sfx/engine.mp3` | The truck starts (Road Kill) | truck: Truck start engine |
| `ch-motor` | `sfx/motor.mp3` | The motor spins the log | motor: Spinning electric machine |
| `ch-smoke-bomb` | `sfx/smoke-bomb.mp3` | Knot Bomb's box goes off | smoke-bomb: Smoke bomb |
| `ch-ice` | `sfx/ice.mp3`, `sfx/ice-2.mp3` | More ice in the tubs | ice: Large pour of water with ice cubes, Dropping ice |
| `ch-crash` | `sfx/crash.mp3` | A tower in pieces | crate-smash: Wood Crate Destory 2 |
| `ch-smash` | `sfx/smash.mp3` | A ram knocks a crate off | crate-smash: Wood Smash 3 (floraphonic) |
| `ch-knife` | `sfx/knife.mp3` | Cut the Rope: the rope is cut | rope: Quick knife slice cutting |
| `ch-knock` | `sfx/knock.mp3` | Buried: pounding on the lid, three knocks | coffin: Knocking on a thick wooden door |
| `ch-shovel` | `sfx/shovel.mp3` | Buried: the crew shovels sand over the coffins | coffin: Hard shovel stab + Sand swish |
| `ch-hiss` | `sfx/hiss.mp3` | The Box: a hand in the crate of snakes | bugs: Snake Hiss |
| `ch-squish` | `sfx/squish.mp3` | The Box: a bite (not used by a step yet) | bugs: Juicy insect fast squish |
| `ch-gag` | `sfx/gag.mp3` | Food Wars: a gag | gross-food: Gagging Sounds |
| `ch-eat` | `sfx/eat.mp3` | Food Wars: the dish is eaten | gross-food: Eating and biting crunchy food |
| `ch-barrel` | `sfx/barrel.mp3` | Barrel Ramp: a barrel rolls back down | barrel: Rolling Metal Barrel |
| `ch-car` | `sfx/car.mp3` | Car Jump: into the next car | car-jump: Car door slam |
| `ch-bubbles` | `sfx/bubbles.mp3` | Locked In: into the cage, under the water | underwater: Deep water bubbles |
| `ch-punch` | `sfx/punch.mp3` | A punch thrown, a hard shove | punch: Strong punches to the body |
| `ch-smoke-alarm` | `sfx/smoke-alarm.mp3` | The kitchen disaster | alarm: Fire Alarm Beep |
| `ch-alarm-clock` | `sfx/alarm-clock.mp3` | The bunk war's alarm at five | alarm: Alarm clock beep |
| `ch-phone` | `td/sfx/phone-ring.ogg` | The call home | the site's own (Total Drama) |
| `ch-glass` | `sfx/glass.mp3` | Shots at the bar (not used by a step yet) | glass-clink: A couple of glasses clink |

## Downloaded and not used

- `arena-horn/cinematic-trailer-apocalypse-horn.wav` (17 s; the 4-second warfare horn fits the cut).
- `fire/campfire-crackles.wav`, `fire/campfire-burning-crackles.wav`: measured nearly silent
  (-53 and -62 dB RMS), so the fire is the site's `td/amb/campfire.ogg`.
- `waves-wind/sea-coast-breaking-waves.wav`, `spray-hiss/spray-x4_bigsoundbank.mp3`,
  `stamp/office-stamp.mp3`, `bass-thump/knocking-sub-bass.wav` (the party through the walls is
  the club track low-passed instead), `injury/*`, `plane/landing-jet-flying-whoosh.wav`,
  `confetti/happy-party-horn.wav`, `crowd/crowd-yelling-at-stadium.wav`,
  `underwater/underwater-white-noise.wav`, `bugs/snake-pit.mp3`.
