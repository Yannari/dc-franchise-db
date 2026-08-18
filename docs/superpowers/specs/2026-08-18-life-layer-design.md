# The Life Layer — what happens to a character between seasons

**Status:** design. Nothing built. 2026-08-18.

A character's life does not stop when their season does. They date, break up,
move city, finish a degree, have a baby, fall out with someone in public, walk a
red carpet, get divorced. Today the project records none of it: the wiki has a
Post-show section that can only state what the *record* knows — which other
shows they played — and says nothing about their life, because there is nothing
to read.

This is the third nature of data in this project, and the only one not built:

| nature | what it is | where it lives |
|---|---|---|
| **authored** | who somebody IS — voice, backstory, casting interview | D1 `roster` → `franchise_roster.json` |
| **derived** | what happened in a season — placements, records, trivia | `players_database.json`, computed at read |
| **accrued** | what happened to them afterwards | **this document** |

## What already exists, and must not be rebuilt

The social app is done. Birdie and ChatAlumni, the voice system, the event
engine, `social_posts` in D1, and an AI writer on `dc-analytics` behind a
season-config flag. **"A social media app where they build a following" is not a
new app — it is a new event source pointed at the one that exists.**

`js/player-trivia.js` and the Post-show section already render derived facts on
the wiki. The life layer adds rows they can read; it does not need its own page.

Popularity, fame (`computeFame`) and the edit layer already exist and are the
natural throttle and the natural source of audience pressure.

## Decisions

### 1. Time is a calendar, not a gap

Every season carries a **year and a slot** (Winter / Spring / Summer / Fall).
Two Big Brothers a year is Summer + Winter; two Survivors is Spring + Fall; a
Traitors season can share a slot. "Now" in-world is the end of the most recent
season aired — **nothing ticks on its own.**

This was chosen over "the gap between two seasons" because with several shows
running there is no such thing as *the* gap. It was chosen over exact dates
because two dropdowns cannot be got wrong and days never matter here.

`seasons_database.json` currently records **no temporal field at all** — fifteen
seasons, no dates, no cross-show ordering. The fifteen existing seasons need
slots assigned **by hand**: whether `bb-1` aired before or after `td-14` is a
creative decision, not something to infer.

The calendar is independently useful and worth building first even if the rest
never happens:

- **Cross-show career order.** `player-trivia.js` orders "the fourth contestant
  to win" by season number *within one show*; across shows there is nothing to
  sort on.
- **Ages that move.** Birthdates exist now. Birthdate + air date = their age *in
  that season*, which is what a wiki shows, rather than one age forever.
- New trivia falls out: *"the first player to win two shows in the same year."*

### 2. State is derived from an event log

One append-only log. **"Married to Raj" is not a stored field** — it is a
`wedding` event with no later `divorce`.

```
life_events   player_slug · after_season · seq · kind · significance
              with_whom · headline · detail · status
```

Two sources of truth for "are they together" is how a page ends up saying
married in one section and single in another. The same instinct governs the
trivia, the records and the tier: store what happened, compute what is true.

### 3. Tracks, not dice

A relationship is a **position** — talking, dating, public, living together,
engaged, married — that advances, holds, or **goes backwards**. Not a coin flip
resolved once at a finale: you do not get married that easily, and divorce and
children have to be reachable.

Most characters never reach the end of their track. That is the honest version
and the reason the wedding means something when it happens.

Candidate tracks, **not settled**: relationship, family, education, career,
home, public profile, health.

### 4. Quiet gaps drift; being cast is the test

Nobody cast, and things drift gently forward. **One partner cast alone is the
hardest test there is** — three months on camera, shipped with somebody else, an
edit that may be unkind. Both cast together is a different strain. Neither is
the calm that lets things advance.

Popularity and the edit feed in: a couple the audience loves gets pushed
together, a couple it turns on gets pulled apart.

This is what stops the life layer being a side-system. It reads the game, and
the game reads it back.

RNG dominates; these factors tilt. A high-social player is never *owed* the
wedding. (The user's rule, from the jury-pressure work: "at the end of the day
it's all a matter of rng and circumstance — these can influence but they don't
dominate.")

### 5. Fame is the throttle

Everyone has a life; **how much happens and how loudly is set by fame.** A
winner gets red carpets and tabloid speculation; a 14th-place boot quietly
changes jobs and posts twice a year.

Nobody is excluded, so no wiki page has an empty heading — they just have a
quieter life. And the feed is dominated by the people worth reading about.

### 6. The off-season is proposed, not imposed

Finishing a season proposes the off-season as a readable list. You edit, delete,
add, then commit to canon. Generated as a first draft, the same as the casting
interviews — and for the same reason: the engine does the typing, the author
keeps the authorship.

### 7. An inbox, with a policy per significance

Every event carries a significance, because approving 182 characters is
unbearable when a flat move and a divorce arrive as the same row.

```
minor    changed jobs · moved flat · a hobby · gym phase
notable  new relationship · left a job · moved city · public spat
major    engagement · wedding · baby · divorce · a death · leaving the franchise
```

Policy is per tier — minor auto-accepts silently, notable auto-accepts and
notifies, major waits — with **a global default and a per-character override**.
Pin the four characters you care about to "always ask"; mute the background
alumni entirely. This mirrors how the roster is already worked: hand-tuned
voices for some, defaults for the rest.

Two rules override any policy:

- **Anything that contradicts authored text always asks.** If a backstory says
  somebody is estranged from their family, a warm family reunion does not
  auto-accept.
- **Anything irreversible always asks.** A wedding can be undone by a divorce; a
  death or a permanent franchise exit cannot, and must not slip through on a
  policy set months earlier.

### 8. Three readers

The resolver emits events once. Then:

- the **feed** turns them into posts (engine templates + the voice profile are
  free; the existing AI writer is optional and already behind a flag),
- the **wiki** Post-show section lists them,
- the **next season's generator** reads them, so a returnee arrives married,
  divorced, or carrying a grudge.

## Open questions

- **Which tracks exist**, exactly. Relationship and career are certain; family,
  education, home, health and public profile are candidates.
- **Does this feed `franchise_meta`?** Returnee reputation and grudges already
  exist there. A public falling-out in the off-season *is* a grudge, and two
  systems for one idea would be a mistake.
- **How dark does it go?** "Sad news" was asked for. Illness, bereavement, a
  character retiring from the franchise for good — a tone decision for the
  author, not the engine.
- **Who writes the prose** — templates plus voice (free) or the AI writer
  (already built, costs per call).

## Build order

1. **The franchise calendar.** Small, self-contained, useful on its own, and a
   prerequisite for everything else. Two fields on a season, a backfill of
   fifteen by hand, and ages/ordering/trivia improve immediately.
2. **The event log and the wiki reader.** Hand-write a few events, see them on a
   page. Proves the shape before any generator exists.
3. **One track, end to end** — relationship. Advance, hold, regress; tested by
   casting. The most interesting content and the full pipeline.
4. **The inbox and policies.**
5. **The feed reader**, and more tracks.

Nothing here is worth building fast. The data shape is the expensive part to get
wrong: the events accrue forever and a bad `kind` vocabulary is very hard to
migrate once there are thousands of rows.
