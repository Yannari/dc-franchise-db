"""
DC Franchise Database — Cross-File Lint Tool
=============================================
Checks referential integrity across all data files.
Run BEFORE adding a new season to catch problems early.

Run from the repo root:
  python tools/lint_data.py

Exit code 0 = clean. Exit code 1 = issues found.

A season is (SHOW, NUMBER) throughout. Big Brother 1 and Total Drama season 1
are both "1" and are not the same season; keying on the number alone reported
that S1's winner was two different people.

Checks performed:
  1.  Player slugs in season-data exist in players_database
  2.  Players in players_database reference valid season numbers
  3.  Season winner in season-data matches placement #1
  4.  Season winner slug/name agrees across season-data, seasons_database,
      and franchise_database
  5.  Every player who played season N appears in seasonN-data placements
  6.  A player's recorded 'wins' matches actual first-place placements
  7.  A player's recorded 'bestPlacement' matches actual best across seasons
  8.  Every player has an avatar file in assets/avatars/
  9.  Every avatar file has a matching player in players_database
  10. No duplicate player slugs within one season's placements
  11. seasons_database and season-data files are in sync (same seasons exist)
  12. franchise_database champion list matches season winners
"""

import json
import os
import sys
import glob

# Force UTF-8 output on Windows
if sys.stdout.encoding != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
issues = []
warnings = []


def err(msg):
    issues.append(msg)


def warn(msg):
    warnings.append(msg)


# ─── Load all files ───────────────────────────────────────────────────────────

def load(path):
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return json.load(f)


players_data    = load("players_database.json")
seasons_db      = load("seasons_database.json")
franchise_db    = load("franchise_database.json")

# Index players by id and by name (lowercase)
player_by_id   = {p["id"]: p for p in players_data["players"]}
player_by_name = {p["name"].strip().lower(): p for p in players_data["players"]}

# A SEASON IS (SHOW, NUMBER), NOT A NUMBER.
#
# This globbed "season*-data.json", so Big Brother was invisible to all twelve
# checks below — and where a number DID reach them it collided: Big Brother 1
# and Total Drama season 1 are both "1", which is why this reported that S1's
# winner was Lindsay in one file and Misha in another. They are different
# seasons of different shows.
FORMAT_TAGS = {"total-drama": "S", "big-brother": "BB"}

def _fmt_of(sd, path):
    f = sd.get("format")
    if f:
        return f
    if os.path.basename(path).startswith("bb-"):
        return "big-brother"
    return "total-drama"

def tag(fmt, sn):
    """A season named the way its own show numbers them: S9, but BB1."""
    return f"{FORMAT_TAGS.get(fmt, 'S')}{sn}"

def player_seasons(p):
    """Every (show, number) a player actually played.

    `seasons` is a flat list of NUMBERS and cannot tell two shows apart, so the
    detail rows are the source and the bare list is only a fallback for entries
    written before the second show existed. An absent format is Total Drama —
    the same rule the rest of the repo uses.
    """
    out = set()
    for d in p.get("seasonDetails", []) or []:
        if d.get("season") is not None:
            out.add((d.get("format") or "total-drama", d["season"]))
    if not out:
        out = {("total-drama", n) for n in p.get("seasons", []) or []}
    return out

# Load all season-data files
season_data_files = {}
for path in glob.glob(os.path.join(ROOT, "data", "seasons", "*-data.json")):
    sd = json.load(open(path, encoding="utf-8"))
    sn = sd.get("seasonNumber")
    if sn is not None:
        season_data_files[(_fmt_of(sd, path), sn)] = sd

# Avatar files on disk
avatar_dir   = os.path.join(ROOT, "assets", "avatars")
avatar_files = {f.lower() for f in os.listdir(avatar_dir) if f.endswith(".png")}


# ─── Check 1: Player slugs in season-data exist in players_database ──────────

print("\nCheck 1: Season-data slugs exist in players_database")
for (fmt, sn), sd in sorted(season_data_files.items()):
    for pl in sd.get("placements", []):
        slug = pl.get("playerSlug", "").strip()
        name = pl.get("name", "").strip()
        if slug and slug not in player_by_id:
            # Try name match as fallback
            if name.lower() not in player_by_name:
                err(f"  {tag(fmt, sn)} placement {pl.get('placement')}: slug '{slug}' ({name}) not in players_database")
            else:
                warn(f"  {tag(fmt, sn)} placement {pl.get('placement')}: slug '{slug}' not found but name '{name}' matches — slug mismatch")
print("  done")


# ─── Check 2: Players_database season list references valid season files ──────

print("Check 2: players_database season references have data files")
known_seasons = set(season_data_files.keys())
for p in players_data["players"]:
    for (fmt, sn) in sorted(player_seasons(p)):
        if (fmt, sn) not in known_seasons:
            err(f"  [{p['name']}] references {tag(fmt, sn)} but no season document for it was found")
print("  done")


# ─── Check 3: Season-data winner matches placement #1 ─────────────────────────

print("Check 3: Season winner matches placement #1 in season-data")
for (fmt, sn), sd in sorted(season_data_files.items()):
    winner_slug  = sd.get("winner", {}).get("playerSlug", "").strip()
    winner_name  = sd.get("winner", {}).get("name", "").strip()
    p1_entries   = [p for p in sd.get("placements", []) if p.get("placement") == 1]

    if not p1_entries:
        err(f"  {tag(fmt, sn)}: no placement=1 found in placements array")
        continue

    p1_slugs = {p.get("playerSlug", "").strip() for p in p1_entries}
    p1_names = {p.get("name", "").strip() for p in p1_entries}

    if winner_slug not in p1_slugs:
        err(f"  {tag(fmt, sn)}: winner slug '{winner_slug}' ({winner_name}) not in placement-1 entries: {p1_slugs}")
print("  done")


# ─── Check 4: Winner agrees across season-data, seasons_db, franchise_db ──────

print("Check 4: Winner consistent across season-data / seasons_database / franchise_database")

# Build lookup from seasons_database
sdb_winner = {(s.get("format") or "total-drama", s["seasonNumber"]): s["winner"]["playerSlug"]
              for s in seasons_db.get("seasons", [])
              if "winner" in s}

# Build lookup from franchise_database
fdb_winner = {(c.get("format") or "total-drama", c["season"]): c["playerSlug"]
              for c in franchise_db.get("champions", [])}

for (fmt, sn), sd in sorted(season_data_files.items()):
    sd_slug  = sd.get("winner", {}).get("playerSlug", "").strip()

    sdb_slug = sdb_winner.get((fmt, sn), "")
    fdb_slug = fdb_winner.get((fmt, sn), "")

    if sdb_slug and sdb_slug != sd_slug:
        err(f"  {tag(fmt, sn)}: winner slug '{sd_slug}' in season-data vs '{sdb_slug}' in seasons_database")
    if fdb_slug and fdb_slug != sd_slug:
        err(f"  {tag(fmt, sn)}: winner slug '{sd_slug}' in season-data vs '{fdb_slug}' in franchise_database")
    if not sdb_slug:
        warn(f"  {tag(fmt, sn)}: season not found in seasons_database")
    if not fdb_slug:
        warn(f"  {tag(fmt, sn)}: season not found in franchise_database champions list")
print("  done")


# ─── Check 5: players_database season memberships match season-data placements ─

print("Check 5: players_database season memberships match season-data placements")
for (fmt, sn), sd in sorted(season_data_files.items()):
    # Slugs that appeared in this season's placements
    placed_slugs = {pl.get("playerSlug", "").strip()
                    for pl in sd.get("placements", [])
                    if pl.get("playerSlug")}

    # Players who claim to have played this season
    claimed_players = {p["id"]: p["name"]
                       for p in players_data["players"]
                       if (fmt, sn) in player_seasons(p)}

    for pid, pname in claimed_players.items():
        if pid not in placed_slugs:
            warn(f"  [{pname}] claims {tag(fmt, sn)} in players_database but is not in its placements")

    for slug in placed_slugs:
        if slug in player_by_id:
            if (fmt, sn) not in player_seasons(player_by_id[slug]):
                warn(f"  [{player_by_id[slug]['name']}] is in {tag(fmt, sn)} placements but does not claim it in players_database")
print("  done")


# ─── Check 6: Player win count matches actual wins across season-data ─────────

print("Check 6: Player win counts match actual placement-1 records")
# Build actual wins from season-data
actual_wins = {pid: 0 for pid in player_by_id}
for (fmt, sn), sd in season_data_files.items():
    for pl in sd.get("placements", []):
        if pl.get("placement") == 1:
            slug = pl.get("playerSlug", "").strip()
            if slug in actual_wins:
                actual_wins[slug] += 1

for p in players_data["players"]:
    pid       = p["id"]
    recorded  = p.get("wins", 0)
    actual    = actual_wins.get(pid, 0)
    if recorded != actual:
        err(f"  [{p['name']}] wins={recorded} in players_database but {actual} first-place placement(s) in season-data files")
print("  done")


# ─── Check 7: Player bestPlacement matches actual best across season-data ─────

print("Check 7: Player bestPlacement matches actual best placement")
actual_best = {}
for (fmt, sn), sd in season_data_files.items():
    for pl in sd.get("placements", []):
        slug = pl.get("playerSlug", "").strip()
        pos  = pl.get("placement")
        if slug and isinstance(pos, int):
            if slug not in actual_best or pos < actual_best[slug]:
                actual_best[slug] = pos

for p in players_data["players"]:
    pid      = p["id"]
    recorded = p.get("bestPlacement")
    actual   = actual_best.get(pid)
    if actual is not None and recorded != actual:
        err(f"  [{p['name']}] bestPlacement={recorded} in players_database but actual best is {actual}")
print("  done")


# ─── Check 8: Every player has an avatar file ─────────────────────────────────

print("Check 8: Every player has an avatar file in assets/avatars/")
for p in players_data["players"]:
    expected = p["id"].lower() + ".png"
    if expected not in avatar_files:
        warn(f"  [{p['name']}] missing avatar: assets/avatars/{expected}")
print("  done")


# ─── Check 9: Every avatar has a matching player ──────────────────────────────

print("Check 9: Every avatar file has a matching player in players_database")
player_ids = {p["id"].lower() for p in players_data["players"]}
for fname in sorted(avatar_files):
    slug = fname[:-4]  # strip .png
    if slug not in player_ids:
        warn(f"  assets/avatars/{fname} has no matching player (id '{slug}' not in players_database)")
print("  done")


# ─── Check 10: No duplicate slugs within one season's placements ──────────────

print("Check 10: No duplicate player slugs within one season")
for (fmt, sn), sd in sorted(season_data_files.items()):
    seen = {}
    for pl in sd.get("placements", []):
        slug = pl.get("playerSlug", "").strip()
        pos  = pl.get("placement")
        if slug in seen and seen[slug] != pos:
            err(f"  {tag(fmt, sn)}: slug '{slug}' appears multiple times in placements (positions {seen[slug]} and {pos})")
        seen[slug] = pos
print("  done")


# ─── Check 11: seasons_database and season-data files are in sync ─────────────

print("Check 11: seasons_database and season-data files are in sync")
sdb_nums  = {(s.get("format") or "total-drama", s["seasonNumber"]) for s in seasons_db.get("seasons", [])}
data_nums = set(season_data_files.keys())
for n in data_nums - sdb_nums:
    warn(f"  a season document exists for {tag(*n)} but it is not in seasons_database")
for n in sdb_nums - data_nums:
    warn(f"  {tag(*n)} is in seasons_database but has no season document")
print("  done")


# ─── Check 12: franchise_database champions match season winners ──────────────

print("Check 12: franchise_database champions match season-data winners")
for champ in franchise_db.get("champions", []):
    key  = (champ.get("format") or "total-drama", champ["season"])
    slug = champ["playerSlug"]
    if key in season_data_files:
        sd_slug = season_data_files[key].get("winner", {}).get("playerSlug", "")
        if slug != sd_slug:
            err(f"  franchise_database {tag(*key)} champion '{slug}' != season-data winner '{sd_slug}'")
    else:
        warn(f"  franchise_database {tag(*key)} champion listed but no season document was found")
print("  done")


# ─── Check 13: placements are one per player, numbered 1..N ──────────────

# This was once the only check here that looked at Big Brother: every check
# above globbed "season*-data.json", so bb-1-data.json had never been linted by
# any of them -- which is how it sat for two weeks numbering a cast of
# seventeen 1-12 and 14-18, with the first boot listed eighteenth and nobody
# thirteenth. They all key on (show, number) now, and this one is ordinary.
#
# The cause was upstream and is already fixed (_bbPlacements counted eviction
# EVENTS, so a houseguest who was evicted, came back and was evicted again ate
# two numbers and left a hole). This check exists because the FILE stayed wrong
# long after the code was right: an artifact is not regenerated by fixing its
# generator, and nothing was watching the artifact.
#
# A tie at the top is legitimate -- season 8 has two co-winners at 1 and no 2 --
# so a gap is only an error when it is not explained by people sharing a place
# above it.

print("Check 13: placements are one per player, numbered 1..N")
for path in sorted(glob.glob(os.path.join(ROOT, "data", "seasons", "*-data.json"))):
    sd = load(path)
    if not sd:
        continue
    label = os.path.basename(path)
    pls = [p.get("placement") for p in sd.get("placements", [])]
    if not pls or any(not isinstance(v, int) for v in pls):
        err(f"  {label}: placements missing or non-integer")
        continue

    cast = sd.get("castSize")
    if cast is not None and len(pls) != cast:
        err(f"  {label}: {len(pls)} placements but castSize is {cast}")

    # Shared places push everyone below down by the size of the tie, so the
    # expected next number after a group of k players tied at p is p + k.
    expected, seen = 1, {}
    for v in pls:
        seen[v] = seen.get(v, 0) + 1
    for v in sorted(seen):
        if v != expected:
            err(f"  {label}: expected placement {expected} next, found {v}"
                f" (highest is {max(pls)} for {len(pls)} players)")
            break
        expected = v + seen[v]
    else:
        if max(pls) > len(pls):
            err(f"  {label}: highest placement {max(pls)} exceeds {len(pls)} players")
    for v, n in sorted(seen.items()):
        if n > 1 and v != 1:
            warn(f"  {label}: {n} players share placement {v} — ties below first are unusual")
print("  done")


# ─── Report ───────────────────────────────────────────────────────────────────

print()
print("=" * 60)
print("LINT REPORT")
print("=" * 60)

if issues:
    print(f"\n[ERRORS] ({len(issues)}) — must fix:")
    for i in issues:
        print(f"  ! {i.strip()}")
else:
    print("\n[OK] No errors found.")

if warnings:
    print(f"\n[WARNINGS] ({len(warnings)}) — review recommended:")
    for w in warnings:
        print(f"  ~ {w.strip()}")
else:
    print("[OK] No warnings.")

print()
print(f"Players   : {len(players_data['players'])}")
print(f"Seasons   : {len(season_data_files)}")
print(f"Avatars   : {len(avatar_files)}")
print("=" * 60)
print()

sys.exit(1 if issues else 0)
