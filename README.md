# DC Franchise Database

A fan-made Total Drama franchise database tracking 9 seasons, 102 unique players, and 128 episodes. Includes player profiles, season history, voting analytics, rankings, and AI-powered episode/season generation.

Live site: hosted on GitHub Pages.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (no frameworks) |
| Data | JSON files loaded client-side |
| AI Backend | Cloudflare Workers + OpenAI API (gpt-5) |
| Fonts | Custom Samdan family (TTF) |
| Tooling | Python scripts for data maintenance |

---

## File Structure

```
/
├── index.html               # Home page
├── current-season.html      # Live season tracker + AI tools
├── voting-analytics.html    # Vote charts and breakdowns
├── franchise.html           # All-time franchise stats
├── player.html              # Individual player profiles (query: ?player=slug)
├── seasons.html             # Season history list
├── season_ref.html          # Season reference page
├── season-awards_ref.html   # Season awards reference
├── rankings.html            # Power rankings
├── awards.html              # Season awards
├── devotees.html            # Player devotee tracking
│
├── config.js                # Site-wide config — auto-synced from franchise_database.json
├── styles.css               # Global styles
│
├── worker-episode.js        # Cloudflare Worker: episode generation + analytics
├── worker-season.js         # Cloudflare Worker: season data extraction + rankings
│
├── franchise_database.json  # Aggregate franchise stats + champions list
├── players_database.json    # All player profiles and career stats
├── seasons_database.json    # Season metadata (titles, winners, awards)
├── rankings_database.json   # Player power rankings with tier scores
├── season1-data.json        # Per-season episode data (seasons 1–9)
├── season2-data.json
│   ...
├── season9-data.json
│
├── assets/
│   ├── avatars/             # Player avatar images (name.png format)
│   ├── gallery/             # Player gallery images (player/1-7.webp)
│   ├── cast/                # Cast photo images
│   └── fonts/               # Samdan font family
│
└── tools/
    ├── audit_data.py        # Data audit and auto-fix script
    ├── patch_players.py     # Patches header/footer into player HTML files
    ├── patch_players_header.py
    ├── ranking-override-manager.html  # Tool for managing ranking overrides
    ├── story-format-converter.html    # Converts episode story text formats
    ├── list_icons.py        # Lists available player icons
    ├── rename.py            # Renames asset files
    └── rename_png_lowercase.py
```

---

## Data Files

### `franchise_database.json`
The master stats file. `config.js` auto-syncs from this on every page load.

```json
{
  "franchiseStats": {
    "totalSeasons": 9,
    "totalEpisodes": 128,
    "uniquePlayers": 102,
    "totalAppearances": 166,
    "lastUpdated": "2026-03-03"
  },
  "champions": [ { "season": 1, "winner": "Lindsay", "finalVote": "5-4", ... } ]
}
```

**Update this file when a season ends.** Everything else updates automatically.

---

### `players_database.json`
One entry per player. Career stats are aggregated across all seasons.

```json
{
  "id": "alejandro",
  "name": "Alejandro",
  "seasons": [4, 2, 1, 8],
  "totalSeasons": 4,
  "wins": 2,
  "bestPlacement": 1,
  "totalChallengeWins": 18,
  "totalImmunityWins": 14,
  "totalVotesAgainst": 27,
  "totalJuryVotes": 12,
  "tier": "S+",
  "seasonDetails": [
    {
      "season": 4,
      "placement": 1,
      "status": "Winner",
      "tribe": "Yellow → Red",
      "challengeWins": 2,
      "immunityWins": 2,
      "votesReceived": 9,
      "idolsFound": 0,
      "strategicRank": 1,
      "juryVotes": 7,
      "finalVote": "7-6-1",
      "keyMoments": [ "..." ],
      "notes": [ "..." ]
    }
  ],
  "story": "Career narrative text...",
  "avgPlacement": 1.5
}
```

**Note on `strategicRank`:** Seasons 6–9 use a numeric score (1–10, higher = more strategic). Seasons 1–5 have a mix of text labels (`"High"`, `"Low"`, etc.) and missing values — these are flagged by the audit script for manual review.

---

### `season1-data.json` — `season9-data.json`
Per-season data used for the season reference pages.

```json
{
  "seasonNumber": 1,
  "title": "Total Drama: Cullhouse",
  "castSize": 24,
  "episodeCount": 24,
  "jurySize": 9,
  "winner": { "name": "Lindsay", "vote": "5-4", "runnerUp": "Alejandro" },
  "finalists": [ ... ],
  "placements": [
    {
      "placement": 1,
      "name": "Lindsay",
      "playerSlug": "lindsay",
      "phase": "Winner",
      "notes": "Won Final Tribal 5–4",
      "strategicRank": 8,
      "story": "Narrative...",
      "keyMoments": [ "..." ]
    }
  ],
  "episodes": [ ... ],
  "awards": { ... }
}
```

---

### `seasons_database.json`
Summary metadata for all seasons, used by the seasons list page.

### `rankings_database.json`
Player rankings with tier (`S+`, `S`, `A`, `B`, `C`, `D`), score (0–100), and reasoning.

---

## AI Worker Pipeline

Two Cloudflare Workers handle AI features. Their URLs are saved in `localStorage` on `current-season.html`.

### Worker 1 — `worker-episode.js`
Deployed to your episode analytics endpoint (e.g. `https://dc-analytics.yourname.workers.dev`).

Accepts POST with a `mode` field:

| Mode | Input | Output |
|---|---|---|
| `"episode"` | Episode summary text + season/episode number | Formatted episode narrative |
| `(default)` | Episode summary text | Voting analytics JSON |
| `"season-data-extraction"` | All episode summaries + metadata | Full `season-data.json` structure |

**Environment variable required:** `OPENAI_API_KEY` set in your Cloudflare Worker settings.

### Worker 2 — `worker-season.js`
Deployed to your season builder endpoint (e.g. `https://dc-analytic-seasons.yourname.workers.dev`).

Handles season-level operations: rankings generation, player auditions, season stats aggregation.

### Episode summary format
Workers expect episode summaries using structured markers:

```
=== CAST (ALL) ===
Player1, Player2, Player3 ...

=== EPISODE SUMMARY ===
...narrative...

=== VOTES ===
PlayerA voted PlayerB
...
```

---

## How to Add a New Season

1. **Play the season** — record episode summaries in the standard format above.

2. **Generate season data** — paste all episode summaries into `current-season.html` → Season Builder, point it at `worker-episode.js`, and click "Extract Season Data". This produces a `seasonN-data.json`.

3. **Save the season file** — download the generated JSON and save as `seasonN-data.json` in the repo root.

4. **Update `franchise_database.json`** — increment `totalSeasons`, `totalEpisodes`, `uniquePlayers`, `totalAppearances`, update `lastUpdated`, and add the new season to `"champions"`. Everything on the site updates automatically from this file.

5. **Update `seasons_database.json`** — add the new season entry with title, cast size, winner, and awards.

6. **Update `players_database.json`** — use the `current-season.html` database tools to update player career stats, or edit manually. Run the audit script after to verify consistency:
   ```
   python tools/audit_data.py
   ```

7. **Add player avatars** — place `playername.png` files in `assets/avatars/`. File names must be lowercase with no spaces.

8. **Commit and push** — GitHub Pages deploys automatically.

---

## Maintenance

### Running the data audit
```bash
python tools/audit_data.py           # audit + auto-fix
python tools/audit_data.py --dry-run # report only, no changes
```

The audit checks:
- `totalSeasons` / `seasonsPlayed` / `avgPlacement` accuracy
- `strategicRank` type consistency (number vs string)
- Missing required fields
- Season placement counts vs cast size
- Player names in season files not matching the player database

### Recovering deleted files
All deleted files remain in git history. To recover a specific file:
```bash
git log --oneline -- Backup_Files/   # find the last commit that had it
git checkout <commit-hash> -- Backup_Files/some-file.html
```

### Avatar naming
Avatars must be lowercase with no spaces: `anne-maria.png`, `dj.png`, `macarthur.png`. Use `tools/rename_png_lowercase.py` to bulk-rename if needed.
