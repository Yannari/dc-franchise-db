# Production & Editing Layer — Design (Realism Roadmap §6, Insight Layer v1)

Approved decisions (user, 2026-07-24): **insight layer first** (no "As Aired" VP mode yet) ·
**live per-episode reads** (no peeking at future results) · **feeds fan perception only**
(popularity drift; never contestant AI, votes, or jury) · **confessional counts + generated quotes**.
Architecture: **Approach A — post-episode derivation engine**, same pattern as `updateSocialStatus(ep)`.

## What it does

The game determines what happened; the edit determines what the audience sees. After every
episode, a new engine converts the episode's recorded events into screen-time units, tones,
and confessional slots per player, maintains a running per-player **edit read** (archetype
label), and surfaces it all in the Season Overview's "Audience pulse" column, the Hub
aftermath, and the retrospective.

## Module: `js/edit-layer.js`

- `updateEditLayer(ep)` — called immediately after `updateSocialStatus(ep)` at every
  episode-completion site in `episode.js`. No-op when `seasonConfig.editLayer === false`.
- `finalizeEditSeason()` — called once from `finale.js`; final tallies + season edit awards.
- Read helpers for UI: `editRead(name)`, `editSummary()`.

### Screen-time derivation (single table, degrades gracefully)

| Source | Units | Tone |
|---|---|---|
| Camp event participant (`ep.campEvents[camp].pre/post`, `players[]`) | 2 | keyword map on `type`+`badgeText` |
| Immunity/challenge winner | 3 | strategic |
| Challenge podium (`chalPlacements` top 3) | 2 | neutral |
| Challenge participant (`chalMemberScores` keys) | 1 | neutral |
| Ballot cast (`votingLog`) | 0.5 | strategic |
| Vote received | 0.3 | emotional |
| Eliminated (farewell arc) | 4 | emotional |
| Idol/advantage find or play | 2 | strategic |

Tones: `heroic · villainous · comic · strategic · emotional · neutral`, matched by keyword
regex (sabotage/scheme/lie → villainous; help/comfort/bond → heroic; romance/spark →
emotional; prank/chaos/slacker → comic; alliance/vote/plan/intel → strategic). Unknown event
type = 1 neutral unit — never throws on new content.

### Confessionals

Per episode: `slots = clamp(round(active*0.6), 4, 10)`, allocated proportionally to
screen-time with archetype bias multipliers (comic 1.3, villain 1.25, winner 1.2,
invisible 0.6), max 3 per player, small noise. Top 2–3 recipients get a generated quote:
tone-keyed pools (5+ variants each, archetype-voiced nice/villain/neutral variants,
`{name}`/`{target}` slots). Quotes are pre-rendered strings (serialization rule).

### Edit reads (live archetypes, EMA + hysteresis)

Per-player features per episode: presence share vs `1/activeCount` baseline, tone shares,
votes received; smoothed with EMA (α=0.4). Archetype scores:

- **invisible** — presence well below baseline
- **villain edit** — villainous tone share dominant
- **comic relief** — comic share dominant
- **growth arc** — presence trend rising vs early-season average
- **winner edit** — above-baseline presence + heroic/strategic dominant + low villain + few votes received
- **decoy favorite** — very high presence + positive tones + a shown flaw (votes received / challenge bomb)
- **steady presence** — fallback label

Current label only flips when a challenger score beats the incumbent by 15% (hysteresis —
no episode-to-episode flip-flop).

### Fan-perception drift (the ONLY consequence)

Per episode, `gs.popularity[name] += drift`: growth +0.3, winner +0.25, decoy +0.2,
comic +0.15, villain +0.1 (polarizing but watchable), steady 0, invisible −0.2. Popularity
already feeds aftermath/finale fan systems, so no other coupling is needed. Bonds, votes,
alliances, jury logic: untouched, verified by test.

### State (`gs.edit`, plain JSON, save-safe)

```
gs.edit = {
  episodes: [{ ep, units:{name:n}, conf:{name:n}, quotes:[{name,text,tone}], reads:{name:label} }],
  totals:   { name: { units, conf, tones:{...} } },
  reads:    { name: { label, score, ema:{...} } },
  final:    null | { editWinner, biggestVillain, mostInvisible, comicRelief }   // finale only
}
```

Old saves: `gs.edit` absent → engine initializes on next episode; all UI guards for absence.

## UI surfaces (run-ui.js + css/simulator.css)

1. **Season Overview — "Audience pulse" section**: per active player, edit-read chip
   (label + trend), screen-time share bar, confessional count, latest quote for top-quoted
   players. Fills the existing truth-legend third column with real data.
2. **Hub aftermath — "Audience pulse" card (05)**: 2–3 edit-watch lines for the episode
   ("Riley seized the winner edit", quote of the night).
3. **Retrospective**: same Overview section plus per-player condensed arc line
   ("invisible → growth arc → winner edit") and season edit awards from `gs.edit.final`.

Spoiler rule: edit reads reflect only aired/public information by construction (derived from
recorded events, live, no future access), so the Hub privacy guardrail holds.

## Testing (tests/edit-layer.test.js, vitest)

Derivation from synthetic `ep` fixtures; confessional slot math + bias; villain-heavy
episodes produce a villain read within 3 episodes; hysteresis stability; drift bounded and
absent when `seasonConfig.editLayer === false`; no mutation of bonds/alliances (AI
isolation); old-save (no `gs.edit`) does not throw in engine or Overview builder; quote
pools have ≥5 variants per tone and render no `{name}` placeholders.

## Out of scope (v1)

"As Aired" VP mode, flashbacks, unreliable narrator, screen-time minute simulation,
per-scene omission. The data model above (per-episode units/tones/quotes) is the input the
future As Aired cut will consume.
