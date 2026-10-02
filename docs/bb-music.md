# Big Brother: music and sound to download

Everything the Big Brother viewer (`js/vp-bb-ep/`) will play, one row per part of
the game. Each file has a fixed name and folder; drop it in and it plays the next
time you open a week. Spec 2026-10-01 §4.8 (Phase 3) wires it.

- **Music beds** loop under a whole screen. A missing bed plays **silence**.
- **Stingers** are one-shot sounds on a moment (a key turns, EVICTED, the winner).
  A missing stinger plays a **built-in synth sound**; your file replaces it.

The plan is the Circle's (`docs/the-circle-music.md`, `js/vp-ci/sound.js`): the
bed is chosen from the screen being shown, the music turns mid-screen at a few
named moments, stingers play only on a click (Reveal all is silent), and the
site's mute, volume and music on/off apply.

## Where the files go

```
assets/audio/bb/        <- the music beds
assets/audio/bb/sfx/    <- the stingers
```

**Format:** mp3, 128–192 kbps.

- **Beds:** 1–3 minutes long. They loop, so pick tracks without a big ending,
  or trim the ending off. Where a row lists several files, each screen picks one
  and keeps it, so two weeks don't sound the same.
- **Stingers:** under 3 seconds. The sound starts at 0 s, with no silence in front.

**Easiest route:** put everything in one folder (e.g. `Downloads/BB music`),
named however you like, and ask Claude to "wire the Big Brother music". It
trims, renames, re-encodes and levels them (beds to -17 dB, stingers to -14 dB)
by measured loudness, the way the Circle and Traitors tracks were done.

**Where to look:** Pixabay Music, YouTube Audio Library, Uppbeat, Epidemic
Sound, or your own library. The real show's score isn't sold. The search words
in each row describe its sound: a pulsing synth-and-strings theme, plucky
"sneaky" pizzicato for scheming, light marimba and pop for house life, big
string swells and drum hits for the ceremonies and the live show, and a goofy
carnival sound for the comedy competitions.

---

## Music beds: `assets/audio/bb/`

### The house

| # | Files | When it plays | What it should sound like (search words) |
|---|---|---|---|
| 1 | `theme.mp3` | the week's cold open, "Previously on Big Brother" | the show's own feel: a pulsing electronic theme with strings, driving and a little ominous |
| 2 | `morning.mp3` | the wake-up call, the first scenes of a day | bright light pop, a sunny morning, ukulele or claps |
| 3 | `house-1.mp3` `house-2.mp3` `house-3.mp3` | everyday talk: the kitchen, the living room, the backyard | playful light pizzicato or marimba, bouncy reality-TV underscore |
| 4 | `scheming-1.mp3` `scheming-2.mp3` `scheming-3.mp3` | bedroom whispers, pitches, deals, alliance meetings, a lie told | sneaky pizzicato strings, low synth pulse, "plotting" |
| 5 | `drama-1.mp3` `drama-2.mp3` | a fight, a blow-up, a confrontation, being called out | tense strings, heavy drums, rising stakes |
| 6 | `showmance.mp3` | a showmance moment, the hammock, a late-night cuddle | soft romantic acoustic, warm |
| 7 | `night.mp3` | lights out, the 2 a.m. conversations | quiet ambient, low pads, late night |
| 8 | `hoh-room.mp3` | the HOH room reveal and visits upstairs | glossy celebratory pop that settles into something intimate |
| 9 | `diary.mp3` | the Diary Room cut, a confessional | a soft pulse with very little on top, so the voice sits in front |
| 10 | `havenot.mp3` | the have-nots, slop, the cold shower | comedic sad, a slow tuba or kazoo lament |
| 11 | `twist.mp3` | Big Brother announces a twist, Pandora's Box, the hacker, a power | mysterious and ominous, a synth drone with a heartbeat |

### Competitions (by arena, `js/bb/comp-arenas.js`)

| # | Files | When it plays | What it should sound like |
|---|---|---|---|
| 12 | `comp-1.mp3` `comp-2.mp3` | an HOH or veto competition: the course, the lanes, the pool, the puzzle stations | driving game-show energy, sporty electronic |
| 13 | `endurance.mp3` | the endurance rig at night: The Wall, Hold the Line, final HOH part 1 | slow, relentless, building tension that never resolves, long |
| 14 | `quiz.mp3` | the quiz podiums, Majority Rules, the final HOH jury quiz | a ticking clock, quiz-show suspense |
| 15 | `comedy.mp3` | the game-show stage: Zingbot, BB Comics, OTEV, Pressure Cooker | goofy carnival, a circus or cartoon sound |
| 16 | `luck.mp3` | the luck booth: Pure Chance, Tumblin' Dice | a casino lounge, a playful spin-the-wheel feel |
| 17 | `blockbuster.mp3` | the Block Buster arena | the most intense of the comp tracks, an arena battle with big drums |
| 18 | `comp-win.mp3` | from the moment a winner is crowned to the end of the screen | short triumphant, a victory sting that turns into a bed |

### The ceremonies

| # | Files | When it plays | What it should sound like |
|---|---|---|---|
| 19 | `nominations.mp3` | the nomination ceremony at the dining table, up to the last key | slow, tense strings building, sparse piano notes |
| 20 | `draw.mp3` | the veto player pick, the chips | light suspense, plucky and curious |
| 21 | `veto-meeting.mp3` | the veto meeting, the pleas, "I have decided..." | serious and restrained, a slow string swell |
| 22 | `campaign.mp3` | the campaign days before the vote | moody, uncertain, a slow pulse |

### Eviction night (live)

| # | Files | When it plays | What it should sound like |
|---|---|---|---|
| 23 | `live.mp3` | the host opens the live show, the nominees' pleas | a big live-TV sound: orchestral, a studio-audience energy |
| 24 | `vote.mp3` | the votes cast one by one in the Diary Room | low pulse, ticking, hushed |
| 25 | `result.mp3` | "By a vote of..." held until the name | a suspense hold, one long rising note |
| 26 | `goodbye.mp3` | from EVICTED to the front door closing | emotional, piano and strings, bittersweet |
| 27 | `jury-house.mp3` | the jury house | calm and reflective, a little lonely, acoustic |

### Finale night

| # | Files | When it plays | What it should sound like |
|---|---|---|---|
| 28 | `finale.mp3` | finale night opens, the last days in the house, how tonight works | epic, cinematic, the theme played big |
| 29 | `final-cut.mp3` | the final HOH's decision, the pitches | intimate and heavy, one instrument |
| 30 | `jury.mp3` | the jury's questions, closing statements | courtroom gravity, measured strings |
| 31 | `jury-vote.mp3` | the jury votes and the keys are read | the biggest suspense hold of the season |
| 32 | `winner.mp3` | from the moment the winner is named | triumphant, confetti, an anthem |
| 33 | `reunion.mp3` | America's Favourite, the reunion | warm, upbeat, a party |

### Season themes (optional)

A themed season can replace any bed with its own: put the file in
`assets/audio/bb/<theme>/` under the same name (`summer-of-temptation`,
`machine-summer`, `summer-of-mystery`, `high-rollers`, `summer-camp`,
`summer-school`). Anything a theme does not have falls back to the default.
For example, `high-rollers/house-1.mp3` could be casino lounge jazz, and
`summer-camp/morning.mp3` a campfire guitar.

---

## Stingers: `assets/audio/bb/sfx/`

| # | File | The moment | What it should sound like |
|---|---|---|---|
| 1 | `bb-voice.mp3` | Big Brother speaks ("Houseguests, please...") | a two-tone chime, then the room hum drops |
| 2 | `blink.mp3` | the eye closes and opens between rooms | a soft camera-shutter swish |
| 3 | `dr-cut.mp3` | the cut to the Diary Room and back | a quick whoosh with a click |
| 4 | `hoh-crown.mp3` | Head of Household is won | a bright fanfare hit |
| 5 | `veto-crown.mp3` | the Power of Veto is won | a golden shimmer hit |
| 6 | `comp-out.mp3` | somebody is out of a competition | a short buzzer |
| 7 | `key-turn.mp3` | the HOH turns a nomination key | a heavy mechanical click and clunk |
| 8 | `face.mp3` | a nominee's face fills a slot on the screen | a low impact boom with a digital flicker |
| 9 | `chip.mp3` | a veto chip is drawn | a plastic rattle and a pop |
| 10 | `medallion.mp3` | the veto medallion goes on | a metallic clink, a little reverb |
| 11 | `veto-used.mp3` | "...to use the Power of Veto" | a dramatic hit with a riser |
| 12 | `not-used.mp3` | "...not to use the Power of Veto" | a flat, deflating hit |
| 13 | `ballot.mp3` | a vote is cast in the Diary Room | a soft thud, a card dropped in a box |
| 14 | `result.mp3` | "By a vote of..." | a deep rising boom |
| 15 | `evicted.mp3` | "...you are evicted from the Big Brother house" | a big impact with a reverb tail |
| 16 | `door.mp3` | the front door opens, the crowd outside | a door latch, then a muffled cheer |
| 17 | `wall.mp3` | a portrait on the memory wall goes black and white | a desaturating sweep, a camera shutter |
| 18 | `twist.mp3` | a twist is revealed | an ominous hit and a reversed cymbal |
| 19 | `bond-up.mp3` | a bond or trust goes up | a soft upward blip |
| 20 | `bond-down.mp3` | a bond or trust goes down | a soft downward blip |
| 21 | `winner.mp3` | the winner is named | confetti cannons and a fanfare |

Two files are called `winner.mp3`: the bed is `bb/winner.mp3`, the fanfare
stinger is `bb/sfx/winner.mp3`. The same goes for `result.mp3`.

---

## How it will be used

- A screen starts its bed; moving to the next screen crossfades to that screen's
  bed. A Diary Room line ducks the bed and plays `diary.mp3` under it, then
  restores it on the cut back.
- The music turns mid-screen at four moments: a competition's winner
  (`comp-win`), EVICTED (`goodbye`), "By a vote of..." (`result`), and the
  winner (`winner`).
- The classic screens kept inside the viewer (twists, House Life, the comps'
  themed boards) keep the sound they already have.
