"""
DC Franchise Database — Cross-File Lint Tool
=============================================
Checks referential integrity across all data files.
Run BEFORE adding a new season to catch problems early.

Run from the repo root:
  python tools/lint_data.py

Exit code 0 = clean. Exit code 1 = issues found.

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

# Load all season-data files
season_data_files = {}
for path in glob.glob(os.path.join(ROOT, "season*-data.json")):
    sd = json.load(open(path, encoding="utf-8"))
    sn = sd.get("seasonNumber")
    if sn is not None:
        season_data_files[sn] = sd

# Avatar files on disk
avatar_dir   = os.path.join(ROOT, "assets", "avatars")
avatar_files = {f.lower() for f in os.listdir(avatar_dir) if f.endswith(".png")}


# ─── Check 1: Player slugs in season-data exist in players_database ──────────

print("\nCheck 1: Season-data slugs exist in players_database")
for sn, sd in sorted(season_data_files.items()):
    for pl in sd.get("placements", []):
        slug = pl.get("playerSlug", "").strip()
        name = pl.get("name", "").strip()
        if slug and slug not in player_by_id:
            # Try name match as fallback
            if name.lower() not in player_by_name:
                err(f"  S{sn} placement {pl.get('placement')}: slug '{slug}' ({name}) not in players_database")
            else:
                warn(f"  S{sn} placement {pl.get('placement')}: slug '{slug}' not found but name '{name}' matches — slug mismatch")
print("  done")


# ─── Check 2: Players_database season list references valid season files ──────

print("Check 2: players_database season references have data files")
known_season_nums = set(season_data_files.keys())
for p in players_data["players"]:
    for sn in p.get("seasons", []):
        if sn not in known_season_nums:
            err(f"  [{p['name']}] references season {sn} but season{sn}-data.json not found")
print("  done")


# ─── Check 3: Season-data winner matches placement #1 ─────────────────────────

print("Check 3: Season winner matches placement #1 in season-data")
for sn, sd in sorted(season_data_files.items()):
    winner_slug  = sd.get("winner", {}).get("playerSlug", "").strip()
    winner_name  = sd.get("winner", {}).get("name", "").strip()
    p1_entries   = [p for p in sd.get("placements", []) if p.get("placement") == 1]

    if not p1_entries:
        err(f"  S{sn}: no placement=1 found in placements array")
        continue

    p1_slugs = {p.get("playerSlug", "").strip() for p in p1_entries}
    p1_names = {p.get("name", "").strip() for p in p1_entries}

    if winner_slug not in p1_slugs:
        err(f"  S{sn}: winner slug '{winner_slug}' ({winner_name}) not in placement-1 entries: {p1_slugs}")
print("  done")


# ─── Check 4: Winner agrees across season-data, seasons_db, franchise_db ──────

print("Check 4: Winner consistent across season-data / seasons_database / franchise_database")

# Build lookup from seasons_database
sdb_winner = {s["seasonNumber"]: s["winner"]["playerSlug"]
              for s in seasons_db.get("seasons", [])
              if "winner" in s}

# Build lookup from franchise_database
fdb_winner = {c["season"]: c["playerSlug"]
              for c in franchise_db.get("champions", [])}

for sn, sd in sorted(season_data_files.items()):
    sd_slug  = sd.get("winner", {}).get("playerSlug", "").strip()

    sdb_slug = sdb_winner.get(sn, "")
    fdb_slug = fdb_winner.get(sn, "")

    if sdb_slug and sdb_slug != sd_slug:
        err(f"  S{sn}: winner slug '{sd_slug}' in season-data vs '{sdb_slug}' in seasons_database")
    if fdb_slug and fdb_slug != sd_slug:
        err(f"  S{sn}: winner slug '{sd_slug}' in season-data vs '{fdb_slug}' in franchise_database")
    if not sdb_slug:
        warn(f"  S{sn}: season not found in seasons_database")
    if not fdb_slug:
        warn(f"  S{sn}: season not found in franchise_database champions list")
print("  done")


# ─── Check 5: players_database season memberships match season-data placements ─

print("Check 5: players_database season memberships match season-data placements")
for sn, sd in sorted(season_data_files.items()):
    # Slugs that appeared in this season's placements
    placed_slugs = {pl.get("playerSlug", "").strip()
                    for pl in sd.get("placements", [])
                    if pl.get("playerSlug")}

    # Players who claim to have played this season
    claimed_players = {p["id"]: p["name"]
                       for p in players_data["players"]
                       if sn in p.get("seasons", [])}

    for pid, pname in claimed_players.items():
        if pid not in placed_slugs:
            warn(f"  [{pname}] claims season {sn} in players_database but not in season{sn}-data placements")

    for slug in placed_slugs:
        if slug in player_by_id:
            if sn not in player_by_id[slug].get("seasons", []):
                warn(f"  [{player_by_id[slug]['name']}] in season{sn}-data placements but season {sn} not in players_database seasons list")
print("  done")


# ─── Check 6: Player win count matches actual wins across season-data ─────────

print("Check 6: Player win counts match actual placement-1 records")
# Build actual wins from season-data
actual_wins = {pid: 0 for pid in player_by_id}
for sn, sd in season_data_files.items():
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
for sn, sd in season_data_files.items():
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
for sn, sd in sorted(season_data_files.items()):
    seen = {}
    for pl in sd.get("placements", []):
        slug = pl.get("playerSlug", "").strip()
        pos  = pl.get("placement")
        if slug in seen and seen[slug] != pos:
            err(f"  S{sn}: slug '{slug}' appears multiple times in placements (positions {seen[slug]} and {pos})")
        seen[slug] = pos
print("  done")


# ─── Check 11: seasons_database and season-data files are in sync ─────────────

print("Check 11: seasons_database and season-data files are in sync")
sdb_nums  = {s["seasonNumber"] for s in seasons_db.get("seasons", [])}
data_nums = set(season_data_files.keys())
for n in data_nums - sdb_nums:
    warn(f"  season{n}-data.json exists but season {n} not in seasons_database")
for n in sdb_nums - data_nums:
    warn(f"  season {n} in seasons_database but season{n}-data.json not found")
print("  done")


# ─── Check 12: franchise_database champions match season winners ──────────────

print("Check 12: franchise_database champions match season-data winners")
for champ in franchise_db.get("champions", []):
    sn   = champ["season"]
    slug = champ["playerSlug"]
    if sn in season_data_files:
        sd_slug = season_data_files[sn].get("winner", {}).get("playerSlug", "")
        if slug != sd_slug:
            err(f"  franchise_database S{sn} champion '{slug}' != season-data winner '{sd_slug}'")
    else:
        warn(f"  franchise_database S{sn} champion listed but season{sn}-data.json not found")
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
