# The Circle — Plan 3b: blocking formats, arrivals, powers, the Season Timeline

> Executed inline (the user's standing rule: no subagents). Each task is
> RED → GREEN → read the transcript → commit and push. Steps are check-listed.

**Goal:** every blocking format of spec §10, every arrival of §12.2 and every
power of §14 plays as the real show plays it, booked on a Season Timeline the
way Perfect Match books its dumpings; and a catfish wins about as often as on
the real show.

**Architecture:** formats, arrivals and powers are `TWIST_CATALOG` entries
(`format: 'the-circle'`, `category: 'blocking' | 'arrivals' | 'power'`,
`ciFormat` / `ciEntry` / `ciPower`, `ciSlots`). `buildSchedule` stays the
skeleton; a new `bookSeason(schedule, rng, bookings)` in `js/ci/timeline.js`
draws what each night is (weighted by where it sits in the season, from the
real seasons) and applies the author's bookings. `season.js` dispatches the
night through `runBlocking(state, rng, rating, night)` (`js/ci/formats.js`),
`arrive(state, rng, handles, entry)` and `runPower(...)` (`js/ci/powers.js`).
The engine writes no English; each format records ids and the writing layer
adds its pools and builders.

**Spec:** `docs/superpowers/specs/2026-09-29-the-circle-design.md` — §10, §12,
§14, §21.1; §2.2 for the catfish record.

## Global constraints

- Everything in Plan 3a's constraints: proportional stats, the archetype rule
  (nice archetypes never scheme), the engine writes no player English, own
  dice per feature (`streamFor(seed, '<feature>:<day>')`), US English, fluent
  not clever, no names in pools.
- The Circle tells the players every rule **on screen, before it happens**
  (ADDING-A-SHOW §16.4): every format opens with its alert in the Circle's
  words, taken from the transcripts where they exist.
- A season must lose exactly the players it needs to on the nights it has
  (§16.3): a format that removes two turns one later blocking day into a
  social day; the timeline never books more removals than the cast allows.
- Depth before done: every new scene kind joins `SCENE_DEPTH`, the wear
  guard, and a transcript read.

## Review focus

1. A night booked with a format that cannot run (antivirus with no newcomers,
   a room vote with three players) falls back to standard, and says so in the
   ledger, never silently.
2. A double removal on the last blocking night must still leave exactly the
   finalists.
3. Secret influencers: nobody's words may know who they are (the traceable-
   knowledge rule), including the blocked player's visit.
4. A power handed over at a visit reaches a player who is still active.
5. Bookings are keyed by slot, never by day number.

---

### Task 1: the catfish calibration — DONE (commit "catfish calibration")

22% → 42% of seasons won by a catfish (real: 5 of 10); the audit fails
outside 35–65%. Curated warmth (§5.3), "deserves it" as a rate, goodbye
accusations only past the theory line and discounted as sour grapes,
misreads to the spec's "a handful".

### Task 2: the Season Timeline for the Circle

**Files:** create `js/ci/timeline.js`, `tests/ci-timeline.test.js`; modify
`js/ci/schedule.js` (removals-aware), `js/ci/season.js` (dispatch),
`js/core.js` (catalog entries), `js/shows.js` if the registry lists formats.

- `NIGHT_DRAWS`: for each ratings slot position (first / early / middle /
  late / last), the formats and weights, from the real seasons (§10 sources).
- `bookSeason(schedule, rng, { bookings, cast })` → each blocking day gains
  `night: { format, removes }`; arrival days gain `entry`; power days gain
  `power`. Author bookings (`{ [slot]: twistId }`) win; an impossible
  booking falls back and is recorded (`night.fellBack`).
- `buildSchedule` accepts `doubles` so a double removal shortens the blocking
  days; `bookSeason` decides doubles first.
- Tests: the draw is stable per seed; bookings by slot; removals always leave
  the finalists; impossible bookings fall back and are recorded; every
  catalog entry for the show has `ciSlots` that exist.

### Task 3: Hangout formats

**Files:** `js/ci/formats.js`, `tests/ci-formats.test.js`, pools.

Standard (moved here), **sole influencer**, **three-way tie**, **save one
first** (each influencer saves one before the Hangout), **secret
influencers** (nobody learns who), **super influencer** (top player alone,
ratings hidden, may block in person), **block each other** (the offer; the
engine decides whether they take it). Each records its own data and its
alert id; each has builder + pools + `SCENE_DEPTH`.

### Task 4: public formats

**Save two each** in Circle Chat, **save then plead** (the last two plead
face to face), **room vote** (bottom two named, everyone votes publicly),
**forced statement** (before the ratings, everyone names who they'd block;
the top-rated's statement becomes the block). Every public save and vote is a
claim the room remembers (loyalty record).

### Task 5: removals

**Instant block** (lowest-rated, sometimes no visit), **double block**
(instant then influencer; or each influencer blocks one; or bottom two).
Pacing from Task 2.

### Task 6: antivirus

The newcomers hold antivirus and pass it; each receiver passes it again;
whoever never gets it is blocked; the chart order is recorded (SAVED FIRST …).
Needs two or more newcomers active; falls back otherwise.

### Task 7: arrivals as timeline cards

Snoop and choose (exists), **date with one of three**, **invite one by one**,
**race to message**, **throw a party**, **lurk silently**, **chosen by the
influencers**, **arrive as a pair**. Each an entry with its scene, pools and
consequences (who was chosen is public).

### Task 8: powers handed over at a visit

**The Joker / Inner Circle**, **the Hacker**, **the burner profile**,
**immunity to give away**; the visit's `warning` motive gains "a power to
give" (§11.1).

### Task 9: Circle-wide twists

**Disrupter mode** (first to respond wins an unknown effect), **the clone**
(blocked players take a profile; the room votes which is real), **second
chance / shared return** (two blocked players come back as one shared
profile, reusing §14.8), **the profile swap**, **Ride or Die**, **secret
mission**, **the celebrity profile**, **the AI player + Most Human**,
**egg twist**, **public super influencer**, **no blocking**.

### Task 10: calibration and the read

Spec audit: formats per season by slot against the real seasons; removals
always exact; catfish band still holds; every new pool under the wear guard.
Read three transcripts end to end; fix the prose; update the spec, the
ledger and memory; merge, push, confirm 0 apart.

---

## Ledger

- Task 1: complete (catfish 22% -> 42%; audit band 30-65%).
- Task 2: complete (timeline, sole influencer).
- Task 3: complete (trio, save first, secret, super, block each other; CURATED 0.3 -> 0.4).
- Task 4: complete (save two each, plead, room vote, forced statement).
- Task 5: complete (instant, double).
- Task 6: complete (antivirus).
- Task 7: complete (eight arrival entries; unique slots; bookings take a list).
- Task 8: complete (immunity, Hacker, Joker, burner).
- Task 9: complete (public super, no blocking, secret task, disrupter; swap, clone, Ride or Die; second chance, egg; the AI and Most Human).
- Task 10: complete (400 seasons: all end with five, catfish 45.5%, every target in range; worn pools topped up; two default seasons read).
- Ruling: Ride or Die keeps the count exact (someone always goes) instead of the real "both go unless one sacrifices" — the timeline cannot plan an unknown removal — cost if wrong: a rarer, harsher night the show had.
- Ruling: "mission" is The Traitors' word in this repo; the Circle's is a secret task — cost if wrong: a word.
- Ruling: the public Super Influencer is computed in public.js and handed in by season.js — the engine still never reads the audience ledger — cost if wrong: none found.
- Deferred: the celebrity profile (needs the franchise ledger, Plan 6); newcomers chosen by the public.
