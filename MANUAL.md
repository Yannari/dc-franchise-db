# DC Franchise Database — Operating Manual

How to run a season, publish it, and fix things when they refuse.

For code architecture see `CLAUDE.md`. This file is about **operating** the site.

---

## The one idea that explains everything

There are two kinds of data, and they flow in **opposite directions**. Almost every
question ("why did that need a commit?", "why is the site behind?") answers itself
once this is clear.

| | **Authored** | **Derived** |
|---|---|---|
| What | Who *exists* — characters, stats, archetypes, voices | What *happened* — placements, wins, votes, rankings |
| Who makes it | You, in the Casting Studio | The simulator, when a season is exported |
| Lives in | **D1 is the truth** | **The JSON is the truth** |
| The JSON file | `franchise_roster.json` is a *snapshot* of D1 | `players_database.json` etc. are the real thing |
| Direction | D1 → JSON (**Publish**) | JSON → D1 (**Sync**) |
| Editing by hand | Fine — that's the point | Pointless, the next export overwrites it |

So: **Publish** pushes your roster *out* to the site. **Sync** pulls season results *in*
to the database. They are not two versions of the same button.

---

## Running a season, start to finish

### 1. Create the cast

Casting Studio → **👥 Roster** tab → **＋ New character**.

Each save writes straight to the database: instant, no commit, and visible from any
device you log into. Avatars are the exception — a PNG has to live in the repo, so
uploading one is a commit.

### 2. Publish the roster

**⬆ Publish to site**

Writes `franchise_roster.json` + `voice-profiles.json` and commits them. The site
rebuilds in about a minute. The button shows a **•** when you have unpublished changes.

Do this before running a season, so the site's roster matches who's actually playing.

### 3. Run the season

Build a cast (star the members — starred players sort to the top of the roster grid),
load it into the season, and play episodes as usual.

### 4. Sync episodes as you go — optional

Simulator → season controls → **🔴 Sync episode to site**

Pushes current standings so `devotees.html` and player profiles show the season
*while it's still airing*: who's still in, who went out and when, immunity and votes
so far. Newly created characters appear too, even though they have no history yet.

**No commit and no rebuild.** Sync after every episode if you like — it won't fill
your git history or make you wait.

### 5. Publish the finished season

Simulator → **Export Season**

Builds the season documents, commits them, and refreshes the database — one action.
It also clears the airing-season overlay, because that season is now real history.

If the backend can't be reached, it falls back to **downloading** the files so an
export is never lost. In that case, move them into the repo yourself, commit, and
press **🔄 Sync season data** in the Studio.

---

## What each button costs

| Button | Where | Commits? | Rebuild wait? |
|---|---|---|---|
| Save a character | Studio | No | No |
| Upload an avatar | Studio → Avatars | **Yes** | ~1 min |
| ⬆ Publish to site | Studio | **Yes** | ~1 min |
| 🔴 Sync episode to site | Simulator | No | No |
| Export Season | Simulator | **Yes** | ~1 min |
| 🔄 Sync season data | Studio | No | No |
| Delete / retire a character | Studio | No (until you Publish) | No |

---

## Characters

**Deleting** asks the database what to do:

- **Never played** → deleted outright.
- **Has season history** → **retired** instead. Hidden from casting, but the character
  and every appearance, bond and placement stay intact. Reversible any time from
  **👻 Retired → ↩ Bring back**.

This exists because the roster is what the simulator draws casts from, *including
returnees*. Hard-deleting someone with four seasons would leave their history all over
the site while making it impossible for them to ever return.

**🌱 Never played** filters the pool to characters with no season history — your cleanup
list. Chef and Chris are excluded: hosts never compete, so they'd always match.

---

## Avatars

Studio → **🖼 Avatars** tab.

- **＋ Add avatar** — upload one or many. Slugs come from the filenames, so a bulk drop
  doesn't prompt for each; it shows what will be created and what will be **replaced**
  first. A single file still asks, in case you want to rename it.
- **All / Unused / In use** — *unused* means no character points at that file.
- **🗑 on a tile** — unused files delete with one confirm. Files in use name the owner
  and take a second confirm.

**"Unused" is not simply "no character has this slug".** Two kinds of avatar are loaded
by name rather than through a roster entry, and both are reported as in use:

- `<slug>-returnee.png` — the alternate portrait the returnee system looks for
- `chef`, `chris`, `Slasher` — loaded directly by challenge code

Deleting removes a real file from the repo. It stays in git history, but it's gone from
the site until you put it back.

---

## When something refuses

Refusals are deliberate. They mean data was about to be lost.

**"Publishing would remove N character(s)…"**
Someone is in the published roster but not in the database — usually a save whose
database write failed while the repo write succeeded. Publishing would delete them.
Re-save that character in the Studio, then publish again. (Deliberate deletes don't
trigger this; they're recorded as intentional.)

**"players_database.json payload has no players"**
The export produced an empty file. That's a bug in the export, not a season — nothing
was committed over your good data. Don't force it; re-run the export.

**"this sync would run N statements, over the safety limit"**
The franchise outgrew a single-request sync. Nothing was changed. Needs the sync split
per season — a code change, not a setting.

**"sync failed on rows X–Y"**
It stopped mid-rebuild, so the tables are partial. **Press Sync again** — it rebuilds
from scratch every time, so retrying always converges.

**Saved, but the database write failed**
The character is in your browser and possibly the repo, but not the database. Fix the
cause (usually connectivity), then save again *before* publishing. This is the failure
the publish guard above protects you from.

---

## Admin commands

Always `cd` to `worker/` with the **full path** first:

```bash
cd "C:\Users\yanna\OneDrive\Documents\GitHub\dc-franchise-db\worker"
npx wrangler deploy
```

> **Never run `npx wrangler deploy` from the repo root.** With no config there, wrangler
> assumes you want to deploy the whole site as a static Worker, auto-answers its own
> prompts, writes a `wrangler.jsonc`, and adds a `deploy` script to `package.json` that
> would repeat the mistake. It fails on a large file in `node_modules` before uploading,
> so nothing reaches Cloudflare — but you have to undo the files it left behind.

**After deploying, changes take up to a minute to propagate.** A stale response right
after a deploy is not necessarily a bug — retest before debugging.

Read-only queries (safe any time):

```bash
npx wrangler d1 execute dc-franchise --remote --command "SELECT COUNT(*) FROM roster;"
```

Re-applying schema (safe to re-run — every table is `IF NOT EXISTS`):

```bash
npx wrangler d1 execute dc-franchise --remote --file roster_schema.sql --yes
```

Rebuilding the whole database from the JSON, if D1 is ever badly out of step:

```bash
python worker/build_seed.py          # -> seed.sql        (season history)
python worker/build_roster_seed.py   # -> roster_seed.sql (character pool)
npx wrangler d1 execute dc-franchise --remote --file seed.sql --yes
```

Note the roster seed rebuilds D1 **from the JSON**, i.e. backwards from the normal
direction. Only do it if the database is wrong and the JSON is right.

---

## Setting up a new device

The site works everywhere with no setup. *Writing* needs the token:

```js
localStorage.setItem('studio_api_token', '<your STUDIO_TOKEN>')
```

Without it the Studio still opens and reads everything — saves just return
`401 unauthorized`. That's also why anyone can browse your simulator without being able
to touch your site.

To point the Studio at a different backend:
`localStorage.setItem('studio_api_base', 'https://…')`

Server-side secrets (set once, not stored in the repo):

```bash
npx wrangler secret put GITHUB_TOKEN   # fine-grained PAT, Contents: Read+Write
npx wrangler secret put STUDIO_TOKEN   # long random string; the frontend sends it
```

---

## Is my site the same for everyone?

**Yes.** Every visitor gets the same static files and the same database, so the roster,
leaderboards and airing season look identical to everyone.

What's private to each browser: `localStorage` (cached databases, saved seasons),
IndexedDB `dc_studio` (character drafts, casts), and the token. A visitor can run a
whole season in their browser; it stays there and cannot reach your site.

One asymmetry: the Studio on `localhost` talks to a local `serve.py`, **not** the
Worker — but the live-season overlay on `devotees.html` and `player.html` uses an
absolute Worker URL, so those pages read the **real** airing season even locally.

---

## Reference

**Worker:** `https://dc-studio.yannari19.workers.dev` (source: `worker/worker-studio.js`)
**Database:** D1 `dc-franchise`

| Table | Kind | Filled by |
|---|---|---|
| `roster` | authored | Casting Studio |
| `roster_deleted` | authored | delete (tombstones, so Publish knows a removal was intended) |
| `players`, `appearances`, `bonds`, `seasons` | derived | Sync / Export Season |
| `rankings` | derived | Sync / Export Season |
| `live_season`, `live_meta` | temporary | Sync episode; cleared when the season is published |

**Public endpoints** (no token, readable from anywhere):
`/api/roster`, `/api/live-season`, `/api/leaderboard`, `/api/relationships`, `/api/stats`

`/api/ping` and `/api/avatars` also need no token, but are restricted to the site's own
origin, so they only work from the Studio — not from another site or a plain browser tab.

**Write endpoints** (require `Authorization: Bearer <STUDIO_TOKEN>`):
`/api/roster` and `/delete` `/unretire` `/publish` · `/api/avatar` and `/delete` ·
`/api/sync-seasons` · `/api/publish-season` · `/api/live-season` and `/clear` ·
`/api/character`

**Pages:** `leaderboards.html` (D1-backed; Compare is a tab there) · `devotees.html` and
`player.html` (JSON + live overlay) · everything else reads the JSON as it always has.
