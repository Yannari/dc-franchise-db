# Big Brother music

The user's tracks (`Downloads/BigBrother Music`, 2026-10-04) as the Big Brother
viewer plays them. Code: `js/vp-bb-ep/sound.js` (`BB_BEDS`, `BB_STINGS`,
`bedFor`, `soundFor`). Files: `assets/audio/bb/` (beds) and `assets/audio/bb/sfx/`
(stings).

## How the tracks were placed

Each track was measured before it was given a moment (PyAV decode, numpy):
length, loudness (RMS), tempo (onset autocorrelation), how strong the beat is,
brightness (spectral centroid), bass weight (energy under 150 Hz), how its
loudness moves across ten slices of the track, the big hits per track, and
whether its end sounds like its start (a clean loop). The names said what each
track was meant for; the numbers decided where it fits best and which of
several similar tracks goes where.

Processing: trimmed of silence (-45 dB), levelled to -17 dB RMS (beds) or
-14 dB (stings) with peaks held under -1 dBFS, short fades, re-encoded to mp3
(128 kbps beds, 160 kbps stings). A track that could not reach its level
without clipping gets the difference back on playback (`lift`).

## Beds

| file | source | measured | plays under |
|---|---|---|---|
| theme.mp3 | Big Brother - Theme Song | 40 s, the brightest track (centroid 849 Hz), no hits | the opening titles |
| previously.mp3 | Previously on Big Brother Music | 103 s, quiet until the last third, then +3 dB | the "previously on" recap |
| coming-up.mp3 | Big Brother -ComingUp | 124 s, steady build, strong beat (0.75) | finale night's brief; teasers |
| ending.mp3 | Big Brother Ending Music | 113 s, the quietest bed, loops | the closing credits, the reunion |
| house-talk.mp3, house-low.mp3 | Talking 2, Laying Low | 46 s bright with a light beat; 98 s with almost no beat (0.25) | everyday house scenes |
| deals.mp3, night.mp3 | Secret Meeting 2, Secret Meeting 3 | flat loudness, no hits; Secret Meeting 3 is the cleanest loop of the set (0.77) | deals, late-night talks, a power never played |
| scheming.mp3, planning.mp3 | Trust No One, Planning Something Big | 129 bpm building; heavy bass with a mid-track drop | alliances scheming; Safety Suite, Duo Week, Team America |
| campaign.mp3 | Arm Twisting | the strongest beat of all (0.76), 117 bpm | campaigning; Chain of Safety; closing speeches |
| drama.mp3 | BB-DRAMA | very bass-heavy (84% under 150 Hz), 60 hits | fights; the Interrogation; the curse |
| brewing.mp3 | Something's Brewing | slow (81 bpm), low, quiet | nominations; ceremonies; Camp Comeback; final cut |
| confused.mp3 | Confused | the loudest bed, heavy, 26 hits | a week turned over: Nightmare, Rewind, Halting Hex, powers played, premiere night |
| secret.mp3 | Hacker Meeting (BB20) | steady 144 bpm, flat | secret powers: the Hidden Power, Secret Power comp, the Den, the Coin, the Mystery powers |
| pre-hoh.mp3 | BB preHoh | 63 s, bright, a soft pulse | (catalogued; before a competition) |
| comp-1..4.mp3 | Competition #3, #2, #1, #4 | #3 bright, loud, 117 bpm, loops; #2 fast 144 bpm; #1 heavy bass; #4 builds | every competition screen (kept per screen), the twist games |
| post-hoh.mp3 | Post HOH Competition | bright, loops well (0.73) | the veto draw; Prizes and Punishments |
| comp-win.mp3 | Competition Win Music | 19 s, quiet (lifted) | the moment an HOH or the veto is won |
| celebration.mp3 | Celebration Music (updated) | 41 s, the quietest track (lifted 1.6 dB on playback) | back in the house; America's favourite; the winner |
| veto-meeting.mp3 | Veto Meeting Adjourned | 102 s, steady | the veto meeting; the second veto |
| live-vote.mp3 | 017 Live Vote | 145 s, 108 bpm, swells at 80% | live eviction night, the vote |
| live-wait.mp3 | INTENSE WAITING (live eviction) | the strongest build (-5.8 dB to +2.7), ticking pulse | from "The votes are in" to the name |
| jury-wait.mp3 | INTENSE WAITING #2 | a long, slower build | the jury votes read |

## Stings

| file | moment |
|---|---|
| voice.mp3 | Big Brother speaks (first line of a run) |
| twist.mp3 | a twist's rules card opens |
| dr-cut.mp3 | a cut to the Diary Room |
| blink.mp3 | a house scene opens (a camera cut) |
| key-turn.mp3 | a nomination key turns |
| face.mp3 | the nominees' faces fill the wall |
| medallion.mp3 | the veto meeting opens on the medallion |
| veto-used.mp3 / not-used.mp3 | the veto decision |
| hoh-crown.mp3 | a Head of Household, or any twist's winner, crowned |
| veto-crown.mp3 | the Power of Veto won |
| result.mp3 | "By a vote of..." |
| evicted-hit.mp3 (018 Eviction Music) | "you are evicted" |
| door.mp3 | the front door |
| wall.mp3 | a portrait goes black and white |
| crowd.mp3 | the live audience as eviction night opens |
| winner-crowd.mp3 | the winner of the season |
| comp-out.mp3 | out of a competition |
| coin.mp3 | money changes hands (the Coin) |

## The opening titles and the closing

Rendered in Blender 5.1 with the season's own cast: `tools/bb-intro/intro.py`
builds the studio (navy, a cyan floor grid, light strips, a soft halo), the
Big Brother eye (a pointed almond, cyan iris), the title and a wall of lit
portrait screens; `tools/bb-intro/render.py` renders a season's pair headless:

    python tools/bb-intro/render.py bb-1        # assets/bb/intro/bb-1-intro.mp4, bb-1-outro.mp4
    python tools/bb-intro/render.py --generic   # the logo-only pair, for seasons with no render

- **The opening** (39.6 s, the theme muxed in): the eye opens out of the dark,
  BIG BROTHER and the season line, then the camera visits each houseguest's
  portrait as it lights up, and pulls back to the whole house under the eye.
- **The closing** (26 s, the ending music, faded): the whole house on the
  wall, a slow drift across it, the title, and the eye closes. It never shows
  a result: it plays after every episode, the first included, and the wall is
  alphabetical so even the order says nothing.

`js/vp-bb-ep/titles.js` puts the opening first and the closing last in every
episode of the stepped viewer. Both have a Skip button, follow the site's
volume and mute, stop the music bed while they play (`data-ambient="none"`),
show a Play button if the browser blocks autoplay, and fall back to the
generic pair when a season has no render of its own.
