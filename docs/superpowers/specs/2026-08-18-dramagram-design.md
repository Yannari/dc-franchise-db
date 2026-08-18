# Dramagram — where a life gets seen

**Status:** design. Nothing built. 2026-08-18.
**Depends on:** the life layer (`2026-08-18-life-layer-design.md`), which is built
as far as the generator. Dramagram is its missing third reader.

A life event on a wiki page is a *record*. The same event as a post is a
*moment*. The Post-show section reads dry precisely because it summarises things
that happened somewhere else — and the somewhere-else does not exist yet.

Dramagram is the somewhere-else.

## What already exists

- **`social.html`** hosts two apps that deliberately share no colour, type or
  shape: **Birdie** (public, ratios, tomatoes) and **ChatAlumni** (host-only main
  stage, member comments). A third app on that route is the established pattern.
- **162 characters have gallery folders** in R2, served through the Worker. The
  photo supply is real, not theoretical.
- **The Studio's uploader** (`_libAddFile` in `js/studio.js`) already does
  multi-file → square crop → R2. Bulk import is wiring, not building.
- **The social graph** (`socialGraph` in `js/life-resolver.js`) knows who every
  character likes and loathes, from every season they played.
- **The voice profiles**, the phrasings, `social_posts` in D1, and an AI writer
  behind a season-config flag.

## Decisions

### 1. It is the feeder first, a management screen second

Life events drive the posts; the directory exists so the author can curate who
has which photo. Both, in that order.

### 2. A post is a photo when one fits, a designed card when not

The galleries are character art. There is no wedding photo of Lindsay, and
inventing one is not on the table. So a post carries a gallery picture when
there is a plausible one and otherwise renders as a text card in the app's own
colours.

The grid stays visual, and no photograph is ever claimed to be something it is
not. 42 characters have no gallery at all; they are all-card until they do.

### 3. Followers are replayed, never stored

Growth **and decay**, derived from the whole history:

| | |
|---|---|
| a season played | adds |
| winning | adds a lot |
| each life event | adds a little, scaled by significance |
| a quiet off-season | takes some back |

The decay is the interesting half. A winner spikes, bleeds for two years while
nothing happens to them, then spikes again on returning — so the number tells a
career instead of restating a fame score, and coming back is visibly worth
something.

Never stored, for the same reason the trivia and the records are not: a stored
count and the record it came from will disagree eventually.

### 4. Two status states, layered

- **Sequestered** — currently competing. A real houseguest has no phone. The
  grid dims as a season runs and the dots come back on at the finale, when
  eighteen people post at once.
- **Quiet** — has not posted in a long time. Pairs with the follower decay: an
  inactive character is visibly inactive.

Both, distinctly, so somebody off competing is not confused with somebody who
has drifted out of public life.

### 5. One account, seen from every show

A character who has played both shows has **one Dramagram account** and appears
in both shows' views. Filtering is a lens on one directory, never a second
profile.

The site's show switcher already means this on every other page, and the wiki
learned it the hard way: an article is scoped to one show, but a *person* is
not. Their posts carry the show they happened in, so a Big Brother lens shows
the ones from that era without splitting the account.

### 6. Comments come from people who actually know them

The social graph, already built. Positive ties are warm, rivals are snide,
strangers say nothing. A stranger congratulating somebody on their wedding is
exactly what would make the app read as generated.

### 7. It grows on its own

The directory is derived from the roster and the record, so adding characters
adds profiles with no further work. Nothing about the grid is a list somebody
maintains.

## The two surfaces

**The grid.** Profile picture, follower count, status dot, per show. Search by
name; sort by name, followers, or recent activity. Bulk import and per-character
profile picture.

**The profile.** Header — picture, name, followers, the bio line the wiki
already builds from the roster. Then a photo grid. A post opens to its caption
and comments.

## Open questions

- **Where a profile picture lives.** Reuse `assets/avatars/`, or a separate
  Dramagram picture so a character can have a posed avatar and a different
  profile shot?
- **Who writes captions and comments** — templates plus the voice profile (free,
  and the voices are already tuned) or the AI writer that exists behind a flag
  (better, costs per call). The life layer left the same question open; they
  should be answered together.
- **Who is on it at all.** All 182 including Chef and Chris, or only people who
  have played?
- **How posting volume is gated.** Fame throttles the life layer already;
  Dramagram probably inherits that rather than inventing a second dial.

## Build order

1. **The grid**, from the roster and the record. No posts — just the directory,
   search, sort, status dots and follower counts. Useful alone, and it proves
   the derived follower model against real data before anything depends on it.
2. **The profile**, reading approved life events into a photo grid.
3. **Captions and comments.**
4. **Import and curation.**

The follower model is the piece to measure early rather than trust: a decay
curve that looks plausible in a document is exactly how the comp-domination and
relationship rates went wrong before anybody counted them.
