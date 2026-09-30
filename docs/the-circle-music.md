# The Circle: music and sound to download

Everything the Circle's episode player can play. Each file has a fixed name
and folder; drop it in and it plays the next time you open an episode. Nothing
else to set up.

- **Music beds** loop under a whole scene. A bed that is missing plays
  **silence**.
- **Stingers** are one-shot sounds on a moment (ALERT!, BLOCKED, the winner…).
  A stinger that is missing plays a **built-in synth sound**, so the show has
  sound already; your file replaces it.

The code that reads this list is `js/vp-ci/sound.js` (`CI_BEDS`, `CI_STINGS`).
`tests/ci-vp-sound.test.js` checks that every file there is listed here.

## Where the files go

```
assets/audio/circle/            <- the 18 music beds
assets/audio/circle/sfx/        <- the 13 stingers
```

**Format:** mp3, 128–192 kbps.

**Beds:**
- 1–3 minutes long.
- They loop, so pick tracks without a big ending, or trim the ending off.

**Stingers:**
- Under 3 seconds.
- Start the sound at 0 s, with no silence in front.

**Easiest route:** put everything in one folder (e.g. `Downloads/Circle
music`) named however you like, and ask Claude to "wire the Circle music". It
will trim, rename and re-encode the files, and set the volumes from measured
loudness. That's how the Traitors tracks were done, where one track was 15 dB
louder than another.

**Where to look.** Royalty-free libraries search well by mood:
- Pixabay Music
- YouTube Audio Library
- Uppbeat
- Epidemic Sound, if you have it
- Your own music library

The real show's score isn't sold separately. The search words below describe
its sound: glossy electronic pop, synth plucks, bubbly notification tones, and
dark pulses for the blockings.

---

## Music beds: `assets/audio/circle/`

| # | File | When it plays | What it should sound like | Search words |
|---|---|---|---|---|
| 1 | `morning.mp3` | a quiet morning, a no-blocking day | bright, easy, a little cheeky; sunrise pop | "morning pop", "upbeat ukulele electronic", "happy lifestyle" |
| 2 | `apartment.mp3` | private chats, apartment life, dates, the after-party | light pop / lo-fi you can talk over; the most-heard track, so pick one you won't tire of | "lo-fi pop", "chill vlog", "light electronic background" |
| 3 | `circle-chat.mp3` | Circle Chat, statuses, the Newsfeed, invitations | upbeat and social, a bit busier than the apartment | "social media pop", "upbeat electronic", "tech pop bubbly" |
| 4 | `scheming.mp3` | a lie reported, watching in secret, the Joker, secret missions | sneaky, plotting; pizzicato strings or tiptoe synth | "sneaky pizzicato", "mischief", "comedic suspense" |
| 5 | `drama.mp3` | a face they know, an accusation, a power revealed, swaps and clones | tense and dramatic; reality-TV "oh no she didn't" | "reality tv drama", "dramatic tension hits", "suspense strings" |
| 6 | `arrival.mp3` | meet the players, a new player, two new players | curious and stylish; a runway walk-in | "fashion electronic", "stylish intro", "confident pop beat" |
| 7 | `game.mp3` | a Circle game, the first-to-respond race | playful game-show energy | "game show", "quiz fun electronic", "playful competition" |
| 8 | `party.mp3` | a party, the newcomer's party | a real dance track | "dance pop", "party edm", "club house upbeat" |
| 9 | `ratings.mp3` | players rating each other | a slow build; pulse and pads, thinking music | "slow build tension", "pulse ambient", "decision music" |
| 10 | `results.mp3` | the ratings results read from the bottom | suspense with a ticking pulse; switches in when the results start | "countdown suspense", "ticking tension", "results reveal" |
| 11 | `hangout.mp3` | the Influencers' Hangout, saves, pleas, votes | tense, deliberate, whispery | "tense deliberation", "dark minimal electronic", "investigation" |
| 12 | `blocking.mp3` | the blocking, up to the name | dark drone and heartbeat; the scariest track | "dark drone heartbeat", "elimination tension", "horror pulse subtle" |
| 13 | `after-block.mp3` | right after BLOCKED, until the scene ends | shock turning sad; soft piano or strings | "sad piano", "emotional aftermath", "heartbreak ambient" |
| 14 | `visit.mp3` | the blocked player walks the hallway to a door | anticipation; footsteps-tempo suspense | "anticipation suspense", "creeping tension", "hallway suspense" |
| 15 | `goodbye.mp3` | the goodbye video, videos from home | emotional and warm; a bittersweet farewell | "emotional farewell", "bittersweet piano", "heartfelt acoustic" |
| 16 | `finale.mp3` | the final ratings, the finale studio board | epic build; big drums and synths | "epic build up", "finale cinematic electronic", "trailer rise" |
| 17 | `meet.mp3` | finalists meeting in person | emotional reunion; hopeful and swelling | "emotional reunion", "uplifting cinematic", "hopeful strings" |
| 18 | `winner.mp3` | from the moment the winner is named | full celebration | "victory celebration", "triumphant pop", "confetti party" |

**If you only get six:** `apartment`, `circle-chat`, `blocking`,
`after-block`, `ratings` and `winner`. Those cover most of every episode and
its biggest moment.

---

## Stingers: `assets/audio/circle/sfx/`

| # | File | The moment | What it should sound like | Search words |
|---|---|---|---|---|
| 1 | `alert.mp3` | ALERT! slams onto every TV | bright electronic alarm sting, 1–2 s | "notification alarm sting", "tech alert", "broadcast sting" |
| 2 | `send.mp3` | a message is dictated and sent | soft whoosh, a paper plane | "message sent whoosh", "swoosh ui" |
| 3 | `message.mp3` | a status or a video lands on the feed | a phone chime / pop | "notification chime", "message pop", "ui bubble" |
| 4 | `typing.mp3` | "the Influencers are typing…" | soft keyboard taps, 1–2 s | "keyboard typing short", "phone typing" |
| 5 | `blocked.mp3` | BLOCKED appears | deep impact plus a digital glitch; the heaviest sound | "impact boom glitch", "cinematic hit dark", "error glitch hit" |
| 6 | `tick.mp3` | a name placed in a ranking slot | a crisp click | "ui click", "tick select" |
| 7 | `reveal.mp3` | a place on the board is revealed | a drum hit / reveal thud | "reveal hit", "drum hit single", "boom reveal" |
| 8 | `crown.mp3` | the Influencers are crowned | a rising magical shimmer | "success shimmer", "achievement sparkle", "level up" |
| 9 | `door.mp3` | the knock, the door opening at a visit | knock-knock plus the door | "door knock", "door open" |
| 10 | `play.mp3` | play pressed on the goodbye video | a blip and video start | "video play button", "tape start blip" |
| 11 | `winner.mp3` | the winner is named | a fanfare burst | "fanfare win", "victory sting", "crowd cheer short" |
| 12 | `whoosh.mp3` | a player walks in at the arrivals | a stylish swish | "fashion whoosh", "transition swish" |
| 13 | `gasp.mp3` | a face they know, a catfish accusation | a drama sting, dun-dun-DUN | "drama sting", "reality tv gasp", "shock sting" |

Two different files are called `winner.mp3`: the music bed is
`circle/winner.mp3`, the fanfare stinger is `circle/sfx/winner.mp3`.

---

## How it is used

- A screen starts its scene's bed. Moving to the next screen crossfades to
  that screen's bed.
- The music turns mid-scene in three places:
  - at **BLOCKED**, to after-block;
  - when **the results start**, to results;
  - when **the winner is named**, to winner.
- Stingers play only on a click (Next, or Auto). *Reveal all* is silent, the
  same rule every other show follows.
- The site's sound controls apply as usual: mute, volume, and music on/off.
  Music off keeps the stingers.
