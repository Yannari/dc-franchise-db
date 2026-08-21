# Kristal-talKs v2 — a podcast, not a card stack

**Status:** approved 2026-08-21, building
**Supersedes:** the v1 episode shape inside `js/kristal.js` (three generic Q/A pairs)

## The complaint, verbatim

"dont u think the episode will be repetitive i feel like u didnt work enough in
it its shallow" — and the diagnosis agreed: twelve generic answer lines shared
across sixty episodes, no names, no numbers, no memory, every episode the same
shape. The questions cornered people about specifics; the answers never touched
one.

## The design

### The page is a podcast app, tabbed by period

The off-seasons are the podcast's seasons: a tab rail, newest first, each tab
the slate of that gap (debrief chairs + catch-ups). An episode opens into a
full transcript — NOW PLAYING header with artwork, a decorative scrub bar,
timestamps per segment, then: cold open → exchanges → rapid fire → the viral
clip → listener comments.

### One voice style per guest, from archetype × stats

Eight styles; archetype sets the default, stats override (thresholds for text
selection only, which is what the stats rules permit). Priority order matters —
a villain with temperament 1 is a hothead first:

rambler (mental ≤ 2) → hothead (temperament ≤ 2, or the archetype) →
bomb-thrower (villain/schemer) → chaos (chaos-agent/wildcard) →
analyst (mastermind, or strategic ≥ 8) → charmer (social-butterfly/showmancer,
or social ≥ 8) → earnest (hero/loyal-soldier, or loyalty ≥ 8) →
deadpan (floater/goat, or social ≤ 3) → stat fallback.

Every style has its own answer banks per topic group, **with fact slots**
({rival}, {votes}, {alliance}, {season}, {placement}, {jury}, {partner}) filled
from the season detail and the season row. A variant whose slots cannot all be
filled is not eligible — no "undefined" ever prints.

### The press

Kristal's characterization as mechanics: on the juiciest topic the exchange is
question → deflection → KRISTAL PRESSES (a press line per style — the charmer
and the analyst are cornered differently) → the crack, where the fact lands.
One press per episode, two on a viral.

### Continuity

Episodes within a gap are ordered. If the person your conflict/romance topic is
about sat in the chair earlier in the same gap, Kristal quotes their actual
crack line at you and you answer it (a 'response' exchange). Repeat guests get
"last time you were in that chair" cold opens, counted from their appearance
history.

### The room

2–3 listener comments per episode off the social graph, and one guarantee: the
person a viral episode was ABOUT always comments — they were not in the room.

## The unbreakable rule

Stats, archetype and the graph shape PROSE ONLY. Listeners, tiers, durations
and follower deltas are computed from careers + seasons + life log alone, so
no two pages can disagree on a number. Enforced by the existing parity test.

## Files

- `js/kristal-voice.js` (new) — styles, banks, composers. ~220 lines of prose.
- `js/kristal.js` — booking and numbers unchanged; episode gains facts, style,
  coldOpen, pressed exchanges, rapid fire, duration, continuity.
- `kristal.html` — period tabs + the player view + comments.
- `tests/kristal.test.js` — extended; parity and vocabulary tests kept.
