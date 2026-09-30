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

**Installed 2026-09-30** from `Downloads/The Circle Music`. Each track was
trimmed of silence, levelled to one loudness (-17 dB) and re-encoded at
128 kbps. A kind with several tracks keeps them all: each screen picks one
and keeps it, so episodes don't always sound the same.

| # | Files | From your folder | When it plays |
|---|---|---|---|
| 1 | `morning.mp3` | morning | a quiet morning, a no-blocking day |
| 2 | `apartment.mp3` | apartment | private chats, apartment life, dates, the after-party |
| 3 | `circle-chat-1.mp3` `circle-chat-2.mp3` `circle-chat-3.mp3` | circle-chat #1–3 | Circle Chat, statuses, the Newsfeed, invitations |
| 4 | `scheming-1.mp3` `scheming-2.mp3` `scheming-3.mp3` `scheming-4.mp3` | scheming #1–4 (#4 the comedy-adjacent one) | a lie reported, watching in secret, the Joker, secret missions |
| 5 | `drama-1.mp3` `drama-2.mp3` | drama #1–2 | a face they know, an accusation, a power revealed, swaps and clones |
| 6 | `arrival.mp3` | arrival | meet the players, a new player |
| 7 | `game-1.mp3` … `game-5.mp3` (`game-2.mp3` `game-3.mp3` `game-4.mp3`) | game #1–5 | a Circle game, the first-to-respond race |
| 8 | `party.mp3` | party | a party, the newcomer's party |
| 9 | `ratings.mp3` | ratings #3 | players rating each other |
| 10 | `results-1.mp3` `results-2.mp3` | Results, Results #2 | the results read from the bottom (the music turns here) |
| 11 | `hangout.mp3` | hangout | the Influencers' Hangout, saves, pleas, votes |
| 12 | `blocking.mp3` | blocking | the blocking, up to the name |
| 13 | `after-block.mp3` | after-block #1 | from BLOCKED to the end of the scene |
| 14 | `visit.mp3` | visit or hangout-suspense-before-meeting | the hallway and the door |
| 15 | `goodbye-1.mp3` `goodbye-2.mp3` | goodbye, goodbye #2 | the goodbye video, videos from home |
| 16 | `finale.mp3` | finale | the final ratings, the finale studio board |
| 17 | `meet.mp3` | meet | finalists meeting in person |
| 18 | `meet-wait.mp3` | Final-meeting-waiting-to-meet-people #2 | the first finalist waiting alone for the others |
| 19 | `winner.mp3` | winner | from the moment the winner is named |

`ratings #1` and `ratings #2` were the same files as `Results` and
`Results #2` (byte for byte). They are used once, for the results, so the
music changes when the results start instead of restarting the same track.

Some tracks sit quieter than the rest and could not be raised further without
clipping: scheming #1, #2 and #4, the goodbyes, and meet-wait. The player
lifts those on playback (`lift` in `js/vp-ci/sound.js`).

---

## Stingers: `assets/audio/circle/sfx/`

Levelled to -14 dB and re-encoded at 160 kbps. Where there are two files, they
take turns.

| # | Files | From your folder | The moment |
|---|---|---|---|
| 1 | `alert-1.mp3` `alert-2.mp3` | alert, alert #2 | ALERT! slams onto every TV |
| 2 | `send-1.mp3` `send-2.mp3` | send, send #2 | a message is dictated and sent |
| 3 | `message.mp3` | message | a status or a video lands on the feed |
| 4 | `typing.mp3` | typing (first 3 s) | "the Influencers are typing…" |
| 5 | `tick.mp3` | tick | a name placed in a ranking slot |
| 6 | `crown.mp3` | crown | the Influencers are crowned |
| 7 | `gasp.mp3` | gasp | a face they know, a catfish accusation |
| 8 | `winner.mp3` | sfxwinner (first 12 s, its 16 s of silence cut) | the winner is named |
| 9 | `blocked.mp3` | made for the show | BLOCKED appears: a suck-in, a deep saturated boom, a crack and a three-step digital glitch |
| 10 | `reveal.mp3` | made for the show | a place on the board revealed: a low drum hit with a click on top |
| 11 | `door.mp3` | made for the show | three knocks, the latch, the door swinging open |
| 12 | `play.mp3` | made for the show | play pressed on the goodbye video: a two-note blip and a tape spinning up |
| 13 | `whoosh.mp3` | made for the show | a player walks in: a swish that travels left to right |

The last five were made for the show rather than downloaded. They were
rendered by `tools/circle-make-stings.py` (layered synthesis with a small
room reverb, levelled like the rest) and checked by measurement. BLOCKED keeps
a quarter of its energy between 100 and 250 Hz so a laptop speaker can play
it, not only the sub boom. To replace any of them, drop your own file in
under the same name.

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
