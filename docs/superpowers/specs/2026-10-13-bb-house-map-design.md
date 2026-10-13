# Big Brother: the house map, as live feeds

2026-10-13. Sub-project 2 of the Big Brother overhaul (part 1: `2026-10-13-bb-resort-plates-design.md`). The
user: "start the house map while I edit".

## What it is

House Life stops being a line of scenes and becomes the house you watch, like Total Drama's camp map
(`js/vp-td-ep/map.js`) but in Big Brother's own grammar: the feeds. The map is the Reality Resort blueprint (the
user's `Resort_Blueprint`), every room a camera.

The user's rules from the Total Drama map carry over unchanged:

- the map is the default House Life view, and **Next still walks every conversation in story order**;
- free order inside a time of day; the clock moves on once that time's **key** conversations have been watched;
- nothing here decides anything: a conversation is drawn where the stage stages it (its plate), and plays exactly
  the steps the linear segment plays.

## The three levels

1. **The house** (the blueprint). Each room has its camera number, the faces of who is in it now, and a speech
   bubble per conversation there: gold with a star when it is key, a check when watched, a lock when its time has
   not come. A room with a conversation shows a red REC dot. Across the top, the day: Morning, Afternoon, Evening,
   Late night, with the clock. The Diary Room and the HOH suite are not on the blueprint; they are two tiles
   above it ("Upstairs" and the Diary Room door).
2. **A feed** (click a room). The room's plate fills the stage with the people in it, and its conversations listed
   as feed cards along the bottom ("CAM 05 · Backyard · Chase, Axel · 3:20 PM").
3. **A conversation** (click a bubble or a card). The stepped stage plays that scene's steps; at its last line,
   Next returns to the map, the bubble now checked.

## Data (pure, `js/vp-bb-ep/housemap.js`)

From a House Life screen: each scene marker opens a conversation that runs to the step before the next marker
(the steps before the first marker belong to the first conversation). A conversation carries its range, room
label, plate, clock, cast and a **zone** on the blueprint, from its plate (`living-*` the living room, `pool-*` the
pool, `gym-*` the gym...) or, with no plate, from its set.

- **Time of day** from the scene's clock: before noon, noon to 5 pm, 5 pm to 9 pm, after 9 pm.
- **Key**: a storyline step that is not house life (alliance, target, scheme, feud, showmance), a campaign pitch,
  an engine moment, a whole-house set piece, or the HOH's week. Style chat, bond vents and life scenes are colour.
- **Who is where**: the cast of each conversation is in its room for that time of day. Everyone else in the house
  is placed, by a hash, in a public room with no private conversation in it then (living room, kitchen, pool, gym,
  bedroom): visible life, never a witness to a private scene.

## Viewer (`screens.js`)

A House Life screen's controller keeps `mode` (`map`, `feed`, `play`), the watched set and the current window.
Next: in `play`, the next line, and at the conversation's last line back to the map; on the map, the next
conversation in story order among the unlocked ones; when all are watched, the next screen. Back inside a
conversation never leaves it. Reveal all, a script line and Go to keep their linear meaning (they play from that
step). A **Map / Linear** switch (per viewer, `localStorage`) keeps the old segment view one click away.

## Art

`map-house` is built by `tools/bb-resort/build.py` like any plate (a `crop` to the house and the driveway, 16:9, no
night: at night the map dims and the lit rooms glow). The overlay is HTML and SVG in the stepped viewer's
broadcast language (`feedback_bb_viewer_look`): camera tags, REC dots, scanlines, the eye.

## Testing

- `tests/bb-housemap.test.js`: every step of a real segment belongs to exactly one conversation; every conversation
  has a zone on the blueprint; windows never run backwards; the gate opens in order; a private conversation's room
  has nobody idle in it; Next in story order visits every conversation once.
- Play a real-roster season in Chromium, click through the map, a feed and a conversation, and screenshot.
