# Slasher Night Overdrive — "CHRIS McLEAN PRESENTS"

**Date:** 2026-04-18
**Status:** Design spec. No implementation yet.
**File:** `js/chal/slasher-night.js` (modify in place)
**Goal:** Elevate Slasher Night VP from card-based recap to full horror movie VHS experience. Interactive, scary, cinematic. Scream meets found-footage meets TDI camp horror.

---

## Identity

**Vibe:** Found-footage VHS slasher film. The VP is a degrading VHS tape of a horror movie where the contestants are the cast. Tracking lines, tape degradation, timecode, "PLAY ▶" overlay. Caught players get horror movie death-scene treatment (screen glitch, static burst, "SIGNAL LOST"). The whole thing feels like watching a recovered VHS tape of something that went wrong at camp.

**The Slasher:** Escaped Psycho Killer with chainsaw and hook. Uses existing `slasher.png` reference with 🔪 fallback. Faceless, impersonal. Pure menace.

**Chris's Role:** Horror movie director. Title card, scene transitions, act breaks, post-kill commentary. "DIRECTED BY CHRIS McLEAN" in end credits. His voice is the tape's narration layer.

**Anti-reuse clause:** No other challenge VP may use: VHS tracking lines, tape timecode overlay, horror movie act structure, found-footage grain, "SIGNAL LOST" portrait kill effect, Web Audio synthesized horror drone/stinger system.

---

## VHS Tape Visual Layer

Entire VP wrapped in a VHS playback shell. Every screen exists "inside the tape."

### Tape Shell (persistent across all screens)
- **Scanlines:** CSS `repeating-linear-gradient` overlay, subtle horizontal lines, opacity increases each act (0.03 → 0.05 → 0.08)
- **Tracking lines:** animated horizontal distortion bands that drift up screen. CSS `@keyframes`. Frequency increases per act. Act III = constant tracking problems.
- **Timecode:** top-right corner, `REC ●` blinking red dot + running `HH:MM:SS:FF` counter. Time advances per event. Glitches on catches (numbers scramble for 0.5s).
- **Tape counter:** bottom-left, `▶ PLAY 0037` style. Advances per reveal click.
- **Color grading:** slight desaturation + warm yellow-brown shift. Gets more degraded each act.
- **Film grain:** CSS `background-image` noise pattern, animated. Intensity scales with act number.

### Degradation Progression
| Act | Grain | Tracking | Scanlines | Color |
|-----|-------|----------|-----------|-------|
| Title | Clean, crisp | None | Minimal | Full color |
| I | Light noise | Occasional drift | 0.03 opacity | Slight warmth |
| II | Medium noise | Frequent bands | 0.05 opacity | Yellow shift, color bleed |
| III | Heavy noise | Constant | 0.08 opacity | Deep degradation, desaturating |
| Credits | Tape rewinding effect | Maximum | Flickering | B&W moments mixed with color |

### Event Card Treatment
- Events render as "scenes" not cards — no borders, no badge boxes
- Positive events: normal tape quality, player portrait visible
- Negative events: brief static burst before text appears, portrait flickers
- Catch events: full screen tear → static → "SIGNAL LOST" over portrait → portrait goes grayscale with static overlay permanently
- Environment text: VHS on-screen display (blocky, white, bottom of screen, like closed captions)

### Portrait Kill Effect ("SIGNAL LOST")
When caught:
1. Portrait gets CSS class `slasher-caught`
2. Visual: grayscale filter + static noise overlay + red "SIGNAL LOST" text
3. On subsequent screens, caught players always show degraded
4. Catch moment: portrait rapidly flickers between normal and static for 0.8s, then locks to dead

---

## Jumpscare System

2-3 per game max. Fires ONLY on catch moments.

### Jumpscare Levels (set in simulate)
- `0` = no jumpscare (most catches)
- `1` = minor scare (screen flicker + static burst, 0.3s)
- `2` = full jumpscare (blackout → slasher face → screen tear → static, 0.8s)

### Assignment Logic
- First catch: always `jumpscareLevel: 2`
- Final showdown loser: always `jumpscareLevel: 2`
- One random mid-game catch: `jumpscareLevel: 1`
- All others: `jumpscareLevel: 0`

### Full Jumpscare Sequence (level 2)
1. **0-200ms:** Screen goes black. All audio cuts.
2. **200-500ms:** Slasher silhouette fills screen. Red tint. CSS `scale(1.2)`. Stinger fires.
3. **500-650ms:** Screen tears horizontally (CSS clip-path). Static burst.
4. **650-800ms:** Fade to catch card with SIGNAL LOST portrait.

### Minor Scare (level 1)
1. Screen flickers 3x rapidly
2. Brief static frame (100ms)
3. Catch card with SIGNAL LOST portrait

### Implementation
- `_fireJumpscare(level, containerId)` function
- CSS animations + `requestAnimationFrame`
- Slasher face: CSS-drawn silhouette (no image dependency) — dark shape, two red dots for eyes
- All animations are CSS classes toggled by JS timers

---

## Rotating POV Camera

Each round auto-picks a "POV player" — most dramatic perspective.

### POV Selection (set in simulate)
```
povScore = abs(eventPoints) * 2
         + (wasCaught ? 10 : 0)
         + (hadPositiveEvent >= 3 ? 3 : 0)
         + (hadNegativeEvent ? 2 : 0)
         + noise(-1, 1)
```
Highest = POV. No repeat picks until all players used once.

### POV Visual Treatment
- POV player portrait: camera viewfinder brackets `⌜ ⌝`, "REC ●" label, pulsing red dot
- Their events: first-person `povText` — "You hear..." / "Behind you—"
- Other events: shorter, slightly faded, seen from distance
- POV caught: jumpscare fires from their perspective

### POV Text
Simulate generates `povText` alongside `text` for POV player events:

| Normal | POV |
|--------|-----|
| `"{name} hears a branch snap and screams"` | `"A branch snaps behind you. You scream before you can stop yourself."` |
| `"{name} slides under the cabin"` | `"You press yourself flat. The wood is cold. The footsteps pass three inches above your head."` |
| `"{name} grabs a rock"` | `"Your hand closes around something heavy. It'll do."` |

Each SLASHER_EVENTS entry gets `povVariants` array alongside `textVariants`.

---

## Web Audio Synthesized Soundscape

Zero audio files. All Web Audio API.

### Audio Engine (`_slasherAudio`)
Singleton. Created on first VP screen enter. Destroyed on leave. Mute toggle 🔊/🔇 in tape shell corner. **Default: muted.** User opts in. State in `_tvState.slasherAudioMuted`.

### Sound Layers

**1. Ambient Drone (continuous)**
- Two detuned sine oscillators (55Hz + 57Hz) — slow beat frequency
- Low-pass filtered brown noise underneath
- Gain per act: I=0.03, II=0.06, III=0.10

**2. Chainsaw Rev (event-triggered)**
- Sawtooth oscillator swept 80Hz → 400Hz → 200Hz over 1.5s
- Bandpass filter, high Q
- Fires on: chainsaw text, proximity events, chainsaw environment
- Duration: 1-1.5s

**3. Static Crackle (transition-triggered)**
- White noise buffer, staccato gain envelope
- Fires on: screen transitions, tracking glitches, catches, reveals
- Duration: 0.1-0.3s

**4. Tape Rewind (navigation)**
- Filtered white noise, pitch sweep high → low
- 0.5s. Fires on reveal button press, act transitions.

**5. Heartbeat (Act III only)**
- Two sequential sine thuds at 40Hz (lub-DUB pattern)
- Tempo: 72 BPM start → 120 BPM during showdown
- Stops dead on final catch. Silence = horror.

**6. Jumpscare Stinger (catch-triggered)**
- Level 1: dissonant chord (200Hz + 283Hz + 337Hz square waves). 0.3s. Gain 0.4.
- Level 2: same at gain 0.7 + white noise burst + 30Hz sine thud. 0.5s.
- Synced to jumpscare visual timing.

---

## Simulate Enhancements

New fields added to `ep.slasherNight`. All optional — VP checks before using. Old saves render with classic fallback.

### New Fields Per Round
```
round.povPlayer        // name — rotating POV pick
round.povEvents        // [{...evt, povText}] — first-person rewrites
round.jumpscareLevel   // 0/1/2 on catch entry
round.tensionScore     // 0-10 — drives audio/visual escalation
round.environmentEsc   // environment with escalation metadata
round.slasherProximity // { [name]: 'far'|'near'|'closing'|'here' }
round.chrisLine        // director commentary string
```

### New Top-Level Fields
```
sn.actBreaks           // [roundIdx, roundIdx] — Act I→II and II→III splits
sn.jumpscareRounds     // [roundIdx, ...] — which rounds have jumpscares
sn.povOrder            // [name, ...] — POV player per round
sn.chrisOpener         // title card commentary
sn.chrisCloser         // credits commentary
sn.filmTitle           // generated movie title
```

### Film Title Generator
Pattern: `"[Adjective] [Noun] at [Location]"` or `"The [Noun] of [Location]"`
- Adjectives: Silent, Crimson, Last, Endless, Bleeding, Forgotten, Final
- Nouns: Night, Scream, Shadow, Campfire, Darkness, Silence, Hour
- Locations: Camp Wawanakwa, Skull Island, Dead Man's Cove, The Dock, Cabin 13
- Examples: "Silent Scream at Camp Wawanakwa", "The Last Campfire", "Crimson Night at Cabin 13"

### Tension Score
```
tensionScore = min(10,
  roundNum * 1.2
  + caughtThisRound.length * 2
  + (environment.id === 'silence' ? 1 : 0)
  + (survivors.length <= 3 ? 2 : 0)
  + (survivors.length <= 2 ? 3 : 0)
)
```

### Slasher Proximity
Per surviving player per round:
- `'far'` — default
- `'near'` — scored negative this round OR low boldness
- `'closing'` — will be caught next round (lookahead)
- `'here'` — caught this round

VP portrait treatment: `far`=normal, `near`=slight static, `closing`=heavy flicker + red tint, `here`=SIGNAL LOST.

### Act Break Logic
```
actBreaks[0] = first round with a catch (end of Act I)
actBreaks[1] = round where survivors.length <= 3 (start of Act III)
```

---

## Chris Director Commentary

One line per round plus opener/closer. Horror movie director who's way too excited.

### Per-Round `chrisLine` Pool
- First round: `"Opening scene. Establish the setting. Let the audience get comfortable. ...That's long enough."`
- First catch: `"FIRST BLOOD! And we're only in Act One. This is going to be GREAT television."`
- Mid-game, high tension: `"The pacing is perfect. The audience can feel it. Something bad is about to happen."`
- Environment shift: `"Love what the fog is doing for the atmosphere. Very Carpenter."`
- Final 3: `"Act Three. This is where careers are made, people."`
- Final showdown: `"Two left. One walks away. The other... doesn't. Roll camera."`
- Multiple catches: `"A DOUBLE FEATURE! I didn't even plan that. Actually I might have."`

### Title Card (`chrisOpener`)
`"Ladies and gentlemen... CHRIS McLEAN PRESENTS... [filmTitle]. Viewer discretion is advised. Actually, no. Watch every second."`

### Credits (`chrisCloser`)
`"And... CUT. That's a wrap on [filmTitle]. [winner] — you earned that final girl moment. [eliminated] — you were my favorite kill. See you at the premiere."`

---

## VP Screen Structure — Three-Act Film

### Screen 1 — Title Card
- Black screen → VHS tracking → `"CHRIS McLEAN PRESENTS"` fade in
- Film title in red horror dripping font
- `"VIEWER DISCRETION IS ADVISED"` subtitle
- Cast portraits as horror movie poster (2 rows, rotated, red-tinted)
- Chris opener quote
- VHS `▶ PLAY` indicator

### Screen 2 — Act I: First Blood
- Act card: `"ACT I"` + subtitle from first catch
- Rounds 1 through `actBreaks[0]`
- POV camera viewfinder on selected player
- Events chronological, POV uses `povText`
- First catch: level 2 jumpscare → SIGNAL LOST
- Scores hidden by default, "PRODUCTION NOTES" toggle to show
- Reveal: `"▶▶ FAST FORWARD"` per round, tape rewind sound

### Screen 3 — Act II: The Long Night
- `"ACT II — THE LONG NIGHT"`. Drone escalates.
- Rounds after Act I through `actBreaks[1] - 1`
- VHS degradation visibly worse
- Slasher proximity on portraits: `near`=static edge, `closing`=red pulse
- Mid-game jumpscare (level 1) on flagged catch
- **Body Count Sidebar:** caught portraits with red X, count `"BODY COUNT: 3/8"`, persists through act

### Screen 4 — Act III: Final Girl
- `"ACT III"` + winner-based subtitle: `"[winner] STANDS ALONE"`
- Rounds from `actBreaks[1]` through end + final showdown
- Maximum VHS degradation
- Heartbeat audio, accelerating
- 2-3 survivor portraits large, center, proximity `closing` on all
- Final showdown as VS inside VHS shell
- Winner: tape clears to crisp for one moment, golden VHS frame
- Final catch: level 2 jumpscare. Then silence. Heartbeat stops. Drone cuts.

### Screen 5 — End Credits
- `"CUT."` → `"DIRECTED BY CHRIS McLEAN"`
- Winner as `"STARRING: [name] as THE FINAL GIRL/GUY"` — clean portrait, golden border, best moments
- Eliminated as `"ALSO STARRING: [name]"` — SIGNAL LOST portrait, "Didn't make the sequel", why-they-lost bullets
- Full leaderboard as rolling credits: `"[name] .......... [score] pts — Caught Round [n]"`
- Chris closer quote
- `"REWIND ◀◀"` button → scrolls to Title Card
- Torch snuff (existing effect, inside VHS shell)
- `"THE END"` → 2s later → `"...OR IS IT?"`

---

## File Structure

Modify in place: `js/chal/slasher-night.js`

### Simulate Changes (additive)
- Add `povVariants` to each SLASHER_EVENTS entry
- Add POV selection logic after event generation per round
- Add `povText` generation for POV player events
- Add jumpscare level assignment
- Add tension score calculation
- Add slasher proximity calculation
- Add act break detection
- Add film title generation
- Add Chris commentary generation
- All new fields stored in `ep.slasherNight`

### VP Replacements
Replace all 6 `rpBuild*` functions:
- `rpBuildSlasherAnnouncement` → `rpBuildSlasherTitleCard`
- `rpBuildSlasherRounds` → `rpBuildSlasherActI` + `rpBuildSlasherActII`
- `rpBuildSlasherShowdown` → merged into `rpBuildSlasherActIII`
- `rpBuildSlasherImmunity` + `rpBuildSlasherElimination` → `rpBuildSlasherCredits`
- `rpBuildSlasherLeaderboard` → merged into credits as rolling cast list

### New Functions
- `_slasherVHSShell(innerHtml, act, tensionScore)` — wraps content in tape shell with degradation
- `_fireJumpscare(level, containerId)` — jumpscare animation + audio sync
- `_slasherAudioInit()` / `_slasherAudioDestroy()` — Web Audio lifecycle
- `_slasherAudioSetAct(actNum, tension)` — ramp drone/heartbeat
- `_slasherAudioFireStinger(level)` — jumpscare audio
- `_slasherAudioFireChainsaw()` — chainsaw rev
- `_slasherAudioFireStatic()` — crackle burst
- `_slasherAudioFireRewind()` — tape rewind
- `slasherRevealNextScene(stateKey, actRounds)` — replaces round reveal

### vp-screens.js Changes
- Update import list for new function names
- Update screen push chain: 5 screens instead of 6
- Update debug challenge tab flag
- Update cold open text

### Backward Compatibility
- VP functions check `sn.actBreaks` existence. If missing (old save), fall back to rendering all rounds in a single act with classic styling.
- Audio engine only initializes if `sn.tensionScore` exists on first round.
- Jumpscare only fires if `jumpscareLevel` field present.
