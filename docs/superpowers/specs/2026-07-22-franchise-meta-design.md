# Franchise Meta — Design

**Date:** 2026-07-22
**Status:** Approved direction, pending spec review

## Goal

Make the franchise feel like one continuous universe. Returnees carry their history
into new seasons: reputation, grudges, alliances, trauma, and learned instincts.
Today every season resets to zero; the all-stars cold open *talks* about history
but nothing mechanical backs it up.

## Overview

A new module `js/franchise-meta.js` owns a persistent **franchise ledger** —
compact per-player-per-season fact records written automatically when a finale
completes. When a new season starts, any cast member with ledger history gets a
computed **meta profile** that drives four mechanics:

1. **Reputation threat** — past winners/finalists/blindside authors enter with elevated threat perception
2. **Carried relationships** — returnees who shared a season start with pre-seeded bonds/grudges
3. **Learned behavior** — experience tunes paranoia, idol-hunting, and scheme detection
4. **Narrative callbacks** — text layer references real history in camp events, vote pitches, cold opens, finale speeches

All effects are **proportional** (stat/weight multipliers), never threshold gates,
per the project's stats rules. Every effect is tunable via a single weights object.

## Storage

- Reuse the existing IndexedDB database in `js/savestate.js`. Add a second object
  store `franchise-ledger` (DB version bump + `onupgradeneeded` handling).
- Ledger is loaded into memory once at startup (`loadFranchiseLedger()`), exposed
  as a plain object; written back once per finale (`appendSeasonToLedger()`).
- Size: ~150–300 bytes per player per season (~5 KB per season). Storage is a non-issue.
- The ledger survives independently of savestates — deleting saves does not delete history.

## Ledger Schema

Keyed by season number. One record per player who appeared that season:

```javascript
{
  seasons: {
    "12": {
      seasonName: "…",
      players: {
        "Fiore": {
          placement: 3,            // 1 = winner
          winner: false,
          finalist: true,
          episodesLasted: 18,
          blindsided: true,        // voted out without seeing it coming
          blindsidedBy: ["Thom"],  // vote organizers
          blindsidesAuthored: 2,   // blindsides this player organized
          idolsFound: 1,
          idolsPlayed: 1,
          idoledOut: false,        // eliminated while someone else played an idol
          betrayed: ["Jacques"],   // allies this player flipped on
          betrayedBy: ["Thom"],
          allies: ["MacArthur"],   // endgame alliance mates (loyal to the end)
          showmances: [{ partner: "Chase", ended: "breakup" | "intact" | "betrayal" }],
          rivals: ["Emma"],        // persistent negative-bond pairs
          chalWins: 4,             // individual immunity wins
          schemesCaught: 1         // times exposed as a schemer
        }
      }
    }
  }
}
```

Facts are derived at finale time from state the sim already tracks: `gs.votingHistory`,
`gs.episodeHistory`, bond values, `gs.namedAlliances`, `gs.showmances`, advantage
records, and the betrayal-detection layer. Exact derivation rules per field are an
implementation-plan concern; the schema above is the contract.

## Season-Start Meta Build

When a season begins (cast locked, first episode about to simulate), `buildFranchiseMeta()`
scans the cast against the ledger and produces `gs.franchiseMeta`:

```javascript
gs.franchiseMeta = {
  profiles: {
    "Fiore": {
      seasonsPlayed: 2,
      repScore: 0.0–1.0,        // normalized reputation threat
      resume: ["Won S10", "Blindsided 2 players in S12", …],  // pre-rendered strings
      idolParanoia: 0–1,        // from idoledOut / blindsided history
      blindsideWariness: 0–1,   // from blindsided history
      knownSchemer: 0–1         // from betrayals + schemesCaught
    }
  },
  seededPairs: [ { a, b, bondDelta, reason } ]   // applied to starting bonds
}
```

`gs.franchiseMeta` is plain serializable data (pre-rendered strings, no functions,
no Sets) so it survives savestates unchanged.

Newbies get no profile and are unaffected. Seasons with zero returnees short-circuit —
the module is a no-op and costs nothing.

## Mechanic 1 — Reputation Threat

- `repScore` derives from: won a season (largest weight), made finale, blindsides
  authored, individual challenge wins, idols played. Normalized 0–1 across factors.
- Threat utilities in `js/players.js` apply a proportional modifier:
  `perceivedThreat * (1 + repScore * REP_THREAT_FACTOR)` — never an if-gate.
- Targeting/vote-reasoning text can cite the résumé ("She's already won once —
  she cannot make it to the end").
- The modifier decays as the season progresses (returnees who survive to late game
  have "proven themselves" as current threats; the résumé matters most early):
  `effectiveRep = repScore * max(0.3, 1 - episodesElapsed * REP_DECAY)`.

## Mechanic 2 — Carried Relationships

Applied once at season start to the real bond values via `addBond`, and to
perceived bonds where asymmetry matters:

| Shared history | Bond seed |
|---|---|
| Endgame allies | +2 to +4 (both sides) |
| Betrayer → victim | victim side −4 to −6, betrayer side −1 to −2 (asymmetric via perceived bonds) |
| Blindside author → victim | victim side −3 to −5 |
| Past rivals | −3 both sides |
| Showmance ended intact | +3 to +5 both sides (and eligible for rekindle spark — via `_challengeRomanceSpark` rules only, respecting the 4-showmance cap and `romanticCompat`) |
| Showmance ended in breakup/betrayal | −2 to −4, awkwardness camp event eligible |

Multiple shared seasons stack with diminishing returns (most recent season weighted
highest). Seeds are clamped so no pair starts outside −6…+6 — history biases, it
does not predetermine.

## Mechanic 3 — Learned Behavior

Proportional weight multipliers into existing systems — no new subsystems:

- **Idol paranoia** (`js/advantages.js`): players with `idolParanoia` get a
  multiplier on advantage-search rates and on suspecting others hold idols
  (feeds split-vote / flush consideration where the engine already weighs it).
- **Blindside wariness** (`js/voting.js` / `js/alliances.js` heat reads): wary
  players weight perceived-bond signals more skeptically — a proportional bump
  to their chance of sensing the vote shifting, and to paranoia-flavored camp events.
- **Known schemer** (`js/social-manipulation.js`): perceptive players get a
  detection-roll bonus proportional to the schemer's `knownSchemer` score
  ("we've all seen her season — watch her").

All multipliers are small (target: shifts outcomes ~10–20% at max history, tunable
via the weights object). Upsets must still happen; history informs, never scripts.

## Mechanic 4 — Narrative Callbacks

The `resume` strings and `seededPairs` reasons feed the text layer:

- **Cold open** (`js/vp-screens.js`): returnee intro lines cite real history
  ("Winner of Season 10. Blindsided in 12. She's back, and she remembers everything.")
  replacing the current generic all-stars copy when ledger facts exist.
- **Camp events** (`js/camp-events.js`): new event templates gated on seeded pairs —
  grudge confrontation, old-allies reunion, awkward-exes moment. Each has real
  consequences (bond deltas, heat, information) per the camp-event rules, with
  `players[]` + badge.
- **Vote pitches / targeting text**: cite résumé and grudges where the engine
  already generates reasoning text.
- **Finale speeches** (`js/finale.js` / jury text): jurors and finalists can
  reference multi-season arcs.
- All callback text has 4+ variants per category.

## VP + Text Backlog

Per project rules, every feature surfaces in VP and text backlog:

- Callbacks flow through existing VP surfaces (cold open, camp event cards, vote
  reveal, finale) — no new screen type required.
- **Cast builder UI** (`js/cast-ui.js`): a "Franchise History" panel per player
  showing their ledger record (seasons, placements, notable facts) so the user
  sees what the sim knows before simulating. Includes a per-player
  "clear history" and a global "wipe ledger" control.
- Camp-event callbacks appear in the text backlog automatically via the existing
  camp-event text path.

## Backfill Importer

- Button in the cast builder/config UI: "Import history from seasons_database.json"
  (file picker, same pattern as the existing stats-export upload flow).
- Maps what the export DB actually contains — placements, winners, episode counts,
  challenge wins where present. Relationship-level facts (betrayals, showmances,
  rivals) are not in the export schema and are left empty for backfilled seasons;
  those seasons contribute reputation but not carried relationships.
- Import is idempotent: re-importing a season overwrites that season's ledger entry.
- Ledger records written by live finales always win over backfill for the same season.

## Recording Hook

- Fires once when a finale completes (all finale formats, including no-jury formats
  like Hawaiian Punch and rescue-mission). Guarded against double-writes if the
  finale VP is rebuilt/replayed: keyed by season number, write is idempotent.
- If `seasonConfig.seasonNumber` is 0/unset, prompt-free fallback: skip recording
  and surface a small notice ("Season number not set — this season was not added
  to franchise history").

## Config

- `seasonConfig.franchiseMeta` toggle (default ON) — disables all four mechanics
  and recording for a season when off (e.g., non-canon test sims).
- Single exported `META_WEIGHTS` object in `franchise-meta.js` holding every factor
  (rep threat factor, decay, bond seeds, behavior multipliers) for tuning.

## Error Handling

- Ledger load failure (corrupt/missing store) → empty ledger, sim proceeds normally,
  console warning. Never blocks simulation.
- Name collisions: players are keyed by name (the sim's global convention);
  roster slugs from `franchise_roster.json` are stored alongside for disambiguation
  if the roster ever gains duplicate names.
- Serialization: `gs.franchiseMeta` is plain data; ledger writes use structured
  clone via IndexedDB (no JSON.stringify function-loss risk).

## Testing

- Unit-style checks via the existing headless full-season-audit harness
  (vitest + jsdom): run a season, assert ledger record correctness (placement,
  winner, blindside facts match voting history); run a second season with
  returnees, assert seeded bonds, repScore presence, and that newbie-only
  seasons produce zero meta effects.
- Balance check: 20-season headless batch with returnees, compare returnee
  early-boot rate and win rate against the 60-season baseline — effects should
  shift outcomes, not dominate them.

## Out of Scope

- Cross-season player stat growth (stats stay as rostered).
- AI-written history prose (worker pipeline unchanged).
- Migrating savestates to a different store.
- Manual history editor beyond the backfill import + clear controls (can be a
  follow-up if backfilled seasons need relationship facts).
