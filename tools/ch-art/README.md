# The Challenge: the art jobs (sub-project 4)

Spec §7. The user runs each job in an AI image tool; the jobs live in
`Downloads/Challenge-art/to-edit/<job>/` (`prompt.txt`, `edit-this.png` or `0-layout.png`,
`1-set-*` real-show photos for what a place is, `2-style-*` cleaned Total Drama plates for the look),
and each result comes back as `Result*.png` in its folder.

- **A01–A13** edit a found frame (sources below). **B01–B10** are made from scratch. **M01–M02** paint
  the maps from `layouts/island.svg` and `layouts/villa.svg`.
- `layouts/deliberation.svg` and `layouts/arena.svg` are camera views of the two key sets: the 20 sofa
  seats, the speaker's spot, TJ, the Arena's two start podiums, the empty game space, the house's stand.
  The plate marks are placed from these, so a made plate and its marks agree.
- Day plates only, except A09, B08, B09 and B10 (night); the pipeline makes the other hour (§7, TD's
  `nightify`).

## Where the edited frames came from

| Job | Frame | By |
|---|---|---|
| `A01-arrival-airstrip` | Screen Shot 2016-09-17 at 7.58.12 PM.png | Total Drama Do-Over wiki |
| `A02-island-opener` | PAHK3.png | Total Drama Do-Over wiki |
| `A03-dock` | Hawaii6.png | Total Drama Do-Over wiki |
| `A04-beach-field` | Hawaii12.png | Total Drama Do-Over wiki |
| `A05-gorge-water-course` | Total drama pahkitew island waterfall background by totaldramalegohd-d7pv610.png | Total Drama Do-Over wiki |
| `A06-cliff-jump` | Hawaii11.png | Total Drama Do-Over wiki |
| `A07-jungle-trail` | Screen Shot 2016-09-17 at 7.58.41 PM.png | Total Drama Do-Over wiki |
| `A08-summit` | Total Drama World Tour - Volcano Background #2 | MigueLLima1999 |
| `A09-overnight-camp` | Total Drama Island Background | MigueLLima1999 |
| `A10-tiki-path` | Hawaii9.png | Total Drama Do-Over wiki |
| `A11-gym` | Total Drama - Gym Background | ordartz |
| `A12-lookout` | Hawaii10.png | Total Drama Do-Over wiki |
| `A13-beach` | Total Drama Beach Background | MigueLLima1999 |

Found through the user's links: MigueLLima1999's Total Drama backgrounds gallery, gaby-sunflower's
backgrounds favourites, and the Total Drama Do-Over wiki's backgrounds page (DeviantArt read through
`backend.deviantart.com/rss.xml`; fandom through `api.php` with a curl user agent).

## More references (2026-10-14): the background masterpost and the first results

The user pointed at jasmineshawn's Total Drama background masterpost
(https://jasmineshawn.tumblr.com/post/91122443870/total-drama-background-masterpost): 124 frames, 500 px wide
only (no `_1280` copies exist). They went into the open jobs as `3-more-*` references, and three as
`edit-this-alt.png`, a second frame the job may edit instead (letterbox cropped, upscaled):

| Job | Alternative frame | References (masterpost order) |
|---|---|---|
| `A06-cliff-jump` | 74, waterfall cliff over a lake | 48 |
| `A09-overnight-camp` | 61, torch-lit clearing at night | 4 |
| `A11-gym` | 115, gym with hoop and weights | 113 (caution stripes) |
| others | | A03 3/10/100, A04 83/8, A05 107/74/38, A07 117/103, A08 76, A10 61/4, A12 48/2, A13 8/34, B01 43, B02 56/84, B03 95/12, B06 18/84/94, B07 22/24 |

The finished plates (A01, A02, B05, B08, B09, B10, M01, M02) went back into the open jobs as `2-ours-*`, so
the rest match them: the island opener and the villa map for the villa rooms, the hot tub for the pool deck
(same deck), the Arena for the torch path.

## The plates: `plates.py` (2026-10-14)

The user's finished paintings become the show's plates through Total Drama's own pipeline
(`tools/td-camp/clean.py`, `nightify.py`), pointed at this show's folders by `tools/ch-art/plates.py`:

```
python tools/ch-art/plates.py import      # Downloads/Challenge-art/to-edit/<job>/<result> -> src/<place>.webp
python tools/ch-art/plates.py night       # src/<place>-night.webp for "night": "auto" places (never over one that exists)
python tools/ch-art/plates.py build       # assets/sets/ch/<spot>-<hour>{,-hd,-motion,-water}.webp + .json, js/vp-ch-ep/marks.js
python tools/ch-art/plates.py grid arena  # src with the 1600x900 grid and the marks drawn on (tools/ch-art/cuts/grid)
```

`places.json` says, per place: which painting (`from`, `from_night`), which hours exist, how night is
made (`auto` = nightify repaints the day; `painted` = the user painted it), what moves (fire, pool, fall,
sway, cloth, glow, critters) and the marks, read off the painting by eye on the grid: `stand`, `seat`
(`group`: house, bar, tub), `podium` and `duel` (`side` L/R), `host`, `gate`, `gong`, `dj`, `plane`, and on
the maps `spot` pins (`id` = the place). `h` is the pixels one metre takes there; a person is 1.75 h.

`tools/ch-art/preview.html` (serve the repo root) shows every plate alive with its marks over it.

What the first build taught:
- **Import trims letterbox bars by flatness, not darkness.** The Arena came back with a flat black bar
  under it (mean 0.1, spread 0.3); the airstrip's edge is a painted black palm (mean 2, spread 3.7). A
  darkness test cut 26 px of the palm.
- **A night frame takes its water and wind from the day.** In the dark the hot tub's water and its rim are
  the same colour, so the night's water mask took the whole deck; the night map's sea ran into the jungle.
  The night plate's wind / water / fall panel is now the day's (same layout); its lights and flames stay
  its own.
- **A map's sun is not a cloud.** Cloud lifting took the island map's swirl sun and left its ring
  (`noclouds`).
- **The airstrip has no night.** Its yellow haze has no sky edge to grow from, so the repaint came out grey
  with lit leaves; arrivals are by day.

## Which plate each challenge plays on (2026-10-15)

25 places, 44 plate keys. The challenge's props that are not painted (buoys, tokens, crates on a ring) are drawn
over the plate by the viewer.

| Event | Plate |
|---|---|
| Cliff Relay | `cliff` (climbers on the `top` stand group, the house on the beach) |
| Reef Dash | `beach` |
| Lagoon Quiz | `gorge` (the floating platforms) |
| Hang On | `dock` |
| Night Swim | `beach-night` / `cliff-night` |
| Gauntlet Run | `field` (the bell is the `gong` mark) |
| Truck Tug, Jungle Maze, Demolition Derby, Balance Beam | jobs C01-C04 (waiting on art) |
| every Arena game | `arena` (house + walk-in) and `ring` (the duel) |
| Final: start, Beach Haul | `field` / `beach` |
| Final: Ridge Puzzle | job C05 (waiting on art); `lookout` until then |
| Final: Summit Run, finish | `trail`, then `summit` (finish arch = `gate`, gong) |
| Final: overnight | `camp` (night only) |
| Final: instant elimination | `tiki` |
| Gym scenes | `gym` |
| Quiet talks at sunset | `lookout` |
