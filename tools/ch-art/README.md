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
