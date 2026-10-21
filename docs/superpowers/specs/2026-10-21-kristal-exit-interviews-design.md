# Kristal-talKs exit interviews — in-season episodes

Date: 2026-10-21. Status: design, awaiting approval.

## Why

Kristal-talKs (`kristal.html`, `js/kristal.js`, `js/kristal-voice.js`) only
records between seasons: the debrief after a finale, and the life catch-up. A
houseguest evicted in week two, before the jury, never speaks again. Real shows
have a whole genre for that person — RHAP's Big Brother and Survivor exit
interviews — and the user wants it: Kristal sits down with every boot, the week
they leave, while the season is still airing.

It matters because it is not a recording. A podcast changes things: fans warm
to or turn on the people it names, the people named hear it and answer back,
and a season of them becomes a story of its own.

## Goals

- **Every boot gets an exit interview**, on every show, the week they leave.
  Not only the ones with a story; the user decided "every boot gets one".
- **Jurors get theirs the week they leave too.** The user, 2026-10-21: "juror
  still have exit interview, the finalists just have interview at the same
  time." Every boot talks the week they go, jury or not; the FINALISTS each
  get their own interview, all released on finale night, after the result.
- **Only a player who can still come back waits** (my call, not yet confirmed
  by the user): someone on a return path is still in the game, so their
  interview waits until that path closes.

  | Show | Talks the week they leave | Waits |
  |---|---|---|
  | Big Brother | every evictee, jurors included | — |
  | Total Drama | every boot, jurors included | anyone on Rescue Island / Edge of Extinction or another return path, until it closes |
  | Perfect Match | every dumped islander | — |
  | The Traitors | every banished or murdered player | — |
  | Drag Race | every eliminated queen | any queen with a return still open (All Stars return, Battle Back), until it closes |
  | The Circle | every blocked player | — |
  | The Challenge / Ridonculous Race | every eliminated pair or team | anyone who can still re-enter, until they can't |

  Every show: each finalist gets their own interview, all released together on
  finale night, after the result (the user: separate, not one shared table).

  A player who comes back (a TD return, a DR return) and leaves again gets a
  second interview; the first stays aired.

- **They only know what they knew the night they left.** No event after their
  exit, no other player's secret they never learned, no Traitor or catfish they
  never uncovered. Their prediction of the winner names someone still in, and
  may be wrong.
- **It has consequences, applied in the simulator, during the season:**
  - **Popularity / followers, up or down**, for the guest and for whoever they
    talk about. Gracious and funny gains; bitter, or dragging a fan favourite,
    costs. In-game this is the show's own popularity, so a podcast can swing a
    fan vote at the finale.
  - **Relationships move when the person HEARS it, not when it is said.**
    Already out: they hear it the week it airs. Still in: they hear it the week
    they leave. Jurors and anyone on a return path are sequestered: a juror
    still RECORDS the week they leave, but hears nobody else's until finale
    night, AFTER the final vote — so a podcast never reaches a juror's ballot
    (my call; it keeps the jury vote a game decision).
  - **Later episodes reference it.** The dragged person's own interview opens on
    "I just heard what you said about me" and answers back. Feuds between boots
    can run across a season, then into the debrief.
- **Not boring.** The user's first reaction to a fixed question list was "too
  short and too repetitive". Variety is a requirement, not polish (see below).

## Non-goals

- **Nothing shows in the simulator.** The user, 2026-10-21: "nothing shown in
  the simulator, it's outside the game." No VP screen, no text-backlog entry.
  This overrides the "every feature needs VP + text backlog" rule in CLAUDE.md
  for this feature, by the user's decision. Consequence the user accepted: a fan
  vote can swing on a podcast nobody in the viewer saw.
- **Nothing published mid-season.** Interviews reach the site only when the
  season is published (the existing export / "publish to site").
- **`current-season.html` is not part of this.** Repurposing it stays open; this
  feature lives on Kristal-talKs.
- **The debrief and catch-up are unchanged** except where they read the new
  in-season record (callbacks, below).

## Anti-goals (a failure even if it runs)

- Every interview the same five beats. A season of them reading alike.
- A guest knowing something they could not know.
- An interview that says something about someone and nothing moves.
- A rerun that leaves the old interview behind anywhere.

## How it works

### Decided in the simulator, heard on the site

1. **In the simulator**, when a player leaves for good, the engine decides
   that week's interview: the exit kind, the guest's mood, which segments run,
   who gets named and how (praise, drag, blame, prediction), the length, and
   the effects. It is part of the episode — saved in `gs`, in the episode
   checkpoint. A **rerun** re-rolls it with everything else; a **replay** shows
   the kept version and changes nothing.
2. **Effects apply at once**: popularity for the guest and for the named; bond
   changes for anyone who has heard it, at the moment they hear it.
3. **On publish**, the season document carries the interviews (as the Circle's
   `ci.photos` and twists do now). Republishing replaces them; nothing from an
   earlier version stays.
4. **On Kristal-talKs**, the season's in-season episodes appear, dated between
   the episodes they followed, in the period they aired in. Comments, follower
   numbers and callbacks are derived from the published record on every page
   load, so they follow a republish automatically.

**Store decisions, write words on the site** (recommended, the builder's call
on the exact split). The engine stores what was decided (`kind`, `mood`,
`segments`, `named: [{ who, stance, quote-key }]`, `prediction`, effects); the
site composes the words with `kristal-voice.js`, as it does for debriefs today.
The effects must be computable from the decisions alone — no number may depend
on which words were drawn (`tests/kristal.test.js` already holds that line for
the follower model). If the builder finds callbacks need fixed quotes, pre-render
the quoted line in the save (CLAUDE.md: functions do not survive serialization).

### Variety: the interview's shape comes from how and why they left

1. **An episode shape per exit kind**, chosen from the record:
   - first boot — "we barely met you": who they were, who they clicked with,
     the game they meant to play;
   - blindside — told in order: didn't see it coming, then Kristal reads what
     the others were saying, and they react;
   - quit / medevac — no strategy: what happened, and the regret;
   - showmance left behind — the partner is still in: trust, and a message;
   - self-inflicted — they own it, or they don't, and Kristal pushes;
   - show-specific: a banished Traitor on how they lied; a murdered Faithful
     guessing who did it; a queen and the looks she packed and never wore; a
     blocked Circle player on the catfish they met; a dumped couple or a
     double eviction interviewed together.
2. **The guest's mood** (bitter, gracious, in denial, relieved, still crying),
   from personality and how they went, changes every answer.
3. **Rotating segments, never all in one episode**: fan tweets about them read
   out (from the social pack), rank who is left, a message to someone still in,
   a previous boot calling in, "who goes next?".
4. **The season is a story**: last week's guest called this one the snake, and
   Kristal plays it to them; a running scoreboard of who predicted right; a boot
   who sent someone home last week and goes home this week hears about it.
5. **Length follows the story**: a messy blindside runs long, a quiet first boot
   short — but still its own shape.

The builder runs the season-read loop (ADDING-A-SHOW.md §19) on full seasons of
every show and checks the repetition rules of the line picker (§17) before
calling the writing done.

### Effects, in numbers

- **Followers** (Dramagram's follower model reads `podcastFor`): an exit
  interview is worth less than a debrief, so leaving early does not buy a
  following by itself; a viral one is possible but rare, and can cost the
  person it was about (the existing `MENTIONED_HIT` rule, extended).
- **Popularity in the season**: through each show's own popularity store, sized
  like that show's other popularity events (proportional, no thresholds).
- **Bonds**: the show's own bond system, applied when heard. Stats are
  proportional (CLAUDE.md); archetype rules apply to how a guest talks (nice
  archetypes are not vicious on air).
- **After the season** (builder's call on depth): the "who said what about whom"
  pairs travel with the published record so the debrief can call back to them
  ("you told me Natalia had this") and returnee grudges in a later season can
  read them (`js/franchise-carry.js`).

## Build order (my call; the user can reorder)

1. Big Brother — the RHAP model, the clearest jury/pre-jury split.
2. Total Drama.
3. The rest: Traitors, Drag Race, Perfect Match, The Circle, The Challenge,
   Ridonculous Race.

Each show ships with its exit kinds, its "who waits" rule, its popularity and
bond hook, a published record, and a season read. ADDING-A-SHOW.md gets a
section: what a new show must supply for exit interviews.

## Left to the builder

- The exact shape of the stored decision record and the season-document field.
- How the in-season episodes sit on `kristal.html` (same episode cards, marked
  as exit interviews; my call: a "During <season>" tab of their own, just
  before that season's debrief tab — periods are keyed by season, and two
  shows airing at once made "the period whose dates they aired in" ambiguous).
- Line banks and their size, within the variety rules above.
- The follower and popularity constants, calibrated by measurement across
  seasons, not guessed.
