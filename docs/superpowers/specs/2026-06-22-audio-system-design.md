# Audio System — Design Spec

**Date:** 2026-06-22
**Status:** Approved (design), pending implementation plan
**Scope:** First "wow" pillar — a layered sound system for the DC Franchise Simulator.

## Goal

Give the simulator its missing sensory dimension: a broadcast-style soundscape.
Today there is **zero audio** in the codebase. This adds cinematic cues to the
dramatic episode moments (Viewing Party) plus subtle app-wide UI feedback,
without files, licensing, or a build step.

## Decisions (locked)

- **Hybrid, fully synthesized in v1.** All SFX, stings, *and* ambient beds are
  generated in-browser via the Web Audio API. **Zero audio files** ship in v1.
  A manifest exposes drop-in slots so real recorded loops can replace synth beds
  later with no code change.
- **Reach:** cinematic cues on big VP/episode beats + ambient beds per phase +
  *subtle* app-wide UI feedback (tab swoosh, button tick, save chime). Not every
  interaction.
- **Default on**, with a persistent header control (speaker + volume slider), a
  one-time "🔊 Sound on — click to mute" toast, and the choice remembered in
  `localStorage`. Audio actually begins on the first user gesture (browser
  autoplay policy).

## Architecture

Static ES-module site, no build step, GitHub Pages. `core.js` stays a leaf; the
audio engine is a new self-contained module exposed on `window` via the existing
`main.js` pattern.

### Components

1. **`js/audio.js` — `AudioEngine` (singleton).**
   - Wraps one `AudioContext` (created suspended).
   - API: `sfx(name)`, `ambient(name)` (crossfades beds), `setMuted(bool)`,
     `setVolume(0..1)`, `unlock()` (resume context on first gesture),
     `isMuted()`, `getVolume()`.
   - Master gain + **ducking**: beds dip briefly when a big sting plays.
   - Every cue is a small synth *voice* function (oscillators + noise + ADSR
     envelopes). Voices registered in a `CUE_CATALOG` map (name → builder fn).
   - Beds are looping synth pad/drone graphs registered in a `BED_CATALOG` with
     optional `file` slot (drop-in upgrade path).
   - Persistence: reads/writes `localStorage` key `dc_audio` = `{muted, volume}`.

2. **Declarative cue layer (the core scaling mechanism).**
   - The central VP reveal handlers (`vpReveal*` in `js/vp-ui.js`) read
     `data-sfx="<name>"` on the newly revealed step element and play it.
   - `renderVPScreen` (`js/vp-ui.js`) reads `data-ambient="<bed>"` on the screen
     container → crossfade to that bed; and fires a screen-transition swoosh.
   - Builders opt in by adding attributes. v1 seeds the universal moments;
     per-challenge bespoke cues are added incrementally later, engine untouched.

3. **App-wide subtle layer (3 imperative hooks only).**
   - `showTab` (`js/cast-ui.js`) → tab swoosh.
   - One delegated document click listener on `.btn` → button tick.
   - Save/confirm path → save chime.

4. **Header control + toast.**
   - Speaker icon + volume slider added to `.sim-header` in `simulator.html`.
   - One-time toast on first unlocked playback.

5. **Dev/test panel.**
   - An "Audio" debug panel listing every cue + bed with play buttons (mirrors
     existing challenge debug tabs). Doubles as the tuning tool.

### Data flow

`user gesture → unlock() resumes ctx`
`VP reveal step shown → vpReveal* reads data-sfx → AudioEngine.sfx(name)`
`VP screen rendered → renderVPScreen reads data-ambient → AudioEngine.ambient(bed)`
`tab/button/save → imperative hook → AudioEngine.sfx(name)`
`header control → setMuted/setVolume → persisted to localStorage`

## Cue catalog (v1)

- **Big VP cues:** `torch-snuff`, `idol-sting`, `vote-tick`, `tension-drum`,
  `win-fanfare`, `elimination-gong`, `reveal-whoosh`, `screen-swoosh`.
- **Ambient beds:** `camp-day`, `camp-night`, `tribal-tension`, `victory`.
- **UI:** `tab-swoosh`, `button-tick`, `save-chime`.

### Seeded hook points (v1)

- Torch snuff: elements carrying `torch-snuffed` (vp-screens.js) → `data-sfx="torch-snuff"`.
- Idol/advantage played: `superIdolPlayed` paths → `data-sfx="idol-sting"`.
- Vote reveal/tally steps → `data-sfx="vote-tick"` / `tension-drum`.
- Challenge/immunity winner reveal → `data-sfx="win-fanfare"`.
- Boot confirmed → `data-sfx="elimination-gong"`.
- Generic reveal steps → `data-sfx="reveal-whoosh"` (default when unspecified).
- VP screens tagged with `data-ambient` for phase beds.

## Error handling & constraints

- Context starts suspended; before `unlock()`, all cues no-op (never throw).
- Muted or volume 0 → cues no-op cleanly.
- Missing cue name → warn once in console, no throw.
- Respect a reduced-motion preference by defaulting volume lower (not muted) —
  audio is never required for function; mute is always one click away.
- No network, no files, no build step. Tiny footprint.

## Testing

- **Headless unit tests** (mocked `AudioContext`) for pure logic: name→config
  resolution, mute/volume math, `localStorage` persistence round-trip, ducking
  gain math, unlock state machine.
- **Manual:** the Audio debug panel auditions every cue + bed.

## YAGNI / out of scope (v1)

- No bespoke per-challenge sound design for all 40 challenges (added incrementally
  via `data-sfx` later).
- No recorded audio files (drop-in slots exist for later).
- No spatial/positional audio, no music sequencer.

## Later upgrade path

Drop `bed-night.mp3` into `/assets/audio/`, set the `file` slot on that bed in
`BED_CATALOG` → real recorded ambience replaces the synth bed, no other change.
