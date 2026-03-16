"""
DC Franchise Database — Data Audit & Auto-Fix Tool
====================================================
Run from the repo root:   python tools/audit_data.py
Run in report-only mode:  python tools/audit_data.py --dry-run

Auto-fixes (safe, always applied unless --dry-run):
  - players_database.json:
      • totalSeasons  synced to len(seasons)
      • seasonsPlayed synced to len(seasons)
      • avgPlacement  recalculated from seasonDetails placements
      • missing numeric fields (totalJuryVotes, etc.) defaulted to 0

Reports only (require manual review):
  - strategicRank type inconsistency (number vs string vs missing)
  - seasonDetails count != seasons count
  - missing 'tier' field on a player
  - season-data placements count != castSize
  - placement numbers not sequential
  - player names in season-data that don't match players_database.json
  - duplicate player IDs
"""

import json
import os
import sys
import glob
from copy import deepcopy

# Force UTF-8 output on Windows
if sys.stdout.encoding != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

DRY_RUN = "--dry-run" in sys.argv
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PLAYERS_FILE   = os.path.join(ROOT, "players_database.json")
SEASON_PATTERN = os.path.join(ROOT, "season*-data.json")

NUMERIC_PLAYER_FIELDS = [
    "totalSeasons", "bestPlacement", "wins",
    "totalChallengeWins", "totalImmunityWins", "totalRewardWins",
    "totalVotesAgainst", "totalIdolsFound", "totalJuryVotes",
]
NUMERIC_SEASON_DETAIL_FIELDS = [
    "challengeWins", "immunityWins", "rewardWins",
    "votesReceived", "idolsFound",
]

issues   = []   # things that need manual review
fixes    = []   # changes applied (or would be applied in dry-run)

def warn(msg):
    issues.append(msg)

def fix(msg):
    fixes.append(msg)


# ─── Load files ───────────────────────────────────────────────────────────────

with open(PLAYERS_FILE, encoding="utf-8") as f:
    players_data = json.load(f)

players_original = deepcopy(players_data)

season_files = sorted(glob.glob(SEASON_PATTERN))
seasons_data = {}
for path in season_files:
    with open(path, encoding="utf-8") as f:
        sd = json.load(f)
    seasons_data[path] = sd


# ─── Build lookup: player name (lowercase) → player object ────────────────────

player_by_id   = {}
player_by_name = {}
duplicate_ids  = []

for p in players_data["players"]:
    pid = p.get("id", "").strip()
    if pid in player_by_id:
        duplicate_ids.append(pid)
    player_by_id[pid] = p
    player_by_name[p.get("name", "").strip().lower()] = p

if duplicate_ids:
    for pid in duplicate_ids:
        warn(f"DUPLICATE player ID: '{pid}'")


# ─── Audit players_database.json ──────────────────────────────────────────────

for p in players_data["players"]:
    name = p.get("name", "?")
    seasons_list = p.get("seasons", [])
    season_details = p.get("seasonDetails", [])
    expected_count = len(seasons_list)

    # --- tier field missing ---
    if "tier" not in p:
        warn(f"[{name}] Missing 'tier' field")

    # --- missing numeric fields (auto-fix to 0) ---
    for field in NUMERIC_PLAYER_FIELDS:
        if field not in p:
            warn(f"[{name}] Missing numeric field '{field}' — defaulting to 0")
            if not DRY_RUN:
                p[field] = 0
            fix(f"[{name}] Set '{field}' = 0 (was missing)")

    # --- totalSeasons mismatch ---
    if p.get("totalSeasons") != expected_count:
        old = p.get("totalSeasons", "?")
        warn(f"[{name}] totalSeasons={old} but seasons list has {expected_count} entries → auto-fixing")
        if not DRY_RUN:
            p["totalSeasons"] = expected_count
        fix(f"[{name}] totalSeasons: {old} → {expected_count}")

    # --- seasonsPlayed mismatch ---
    if "seasonsPlayed" in p and p["seasonsPlayed"] != expected_count:
        old = p["seasonsPlayed"]
        warn(f"[{name}] seasonsPlayed={old} but seasons list has {expected_count} → auto-fixing")
        if not DRY_RUN:
            p["seasonsPlayed"] = expected_count
        fix(f"[{name}] seasonsPlayed: {old} → {expected_count}")

    # --- avgPlacement recalculation ---
    if season_details:
        placements = [sd.get("placement") for sd in season_details if isinstance(sd.get("placement"), (int, float))]
        if placements:
            calculated_avg = round(sum(placements) / len(placements), 2)
            stored_avg = p.get("avgPlacement")
            if stored_avg is not None and abs(stored_avg - calculated_avg) > 0.01:
                warn(f"[{name}] avgPlacement={stored_avg} but calculated={calculated_avg} → auto-fixing")
                if not DRY_RUN:
                    p["avgPlacement"] = calculated_avg
                fix(f"[{name}] avgPlacement: {stored_avg} → {calculated_avg}")

    # --- seasonDetails count mismatch (report only) ---
    if len(season_details) != expected_count:
        warn(f"[{name}] seasons list has {expected_count} entries but seasonDetails has {len(season_details)} — MANUAL REVIEW")

    # --- strategicRank type inconsistency in seasonDetails ---
    for sd in season_details:
        sr = sd.get("strategicRank")
        snum = sd.get("season", "?")
        if sr is None:
            warn(f"[{name}] Season {snum}: missing 'strategicRank' — MANUAL REVIEW")
        elif isinstance(sr, str):
            # Auto-fix if it's a plain numeric string like "2", "10"
            try:
                numeric = int(sr)
                if not DRY_RUN:
                    sd["strategicRank"] = numeric
                fix(f"[{name}] Season {snum}: strategicRank string '{sr}' → int {numeric}")
            except ValueError:
                warn(f"[{name}] Season {snum}: strategicRank is string '{sr}' (expected number) — MANUAL REVIEW")

    # --- numeric fields in seasonDetails ---
    for sd in season_details:
        snum = sd.get("season", "?")
        for field in NUMERIC_SEASON_DETAIL_FIELDS:
            if field not in sd:
                warn(f"[{name}] Season {snum}: missing seasonDetail field '{field}' — defaulting to 0")
                if not DRY_RUN:
                    sd[field] = 0
                fix(f"[{name}] Season {snum}: set '{field}' = 0 (was missing)")


# ─── Audit season*-data.json files ────────────────────────────────────────────

for path, sd in seasons_data.items():
    fname = os.path.basename(path)
    season_num = sd.get("seasonNumber", "?")
    cast_size = sd.get("castSize")
    placements = sd.get("placements", [])

    # --- placements count vs castSize ---
    if cast_size is not None and len(placements) != cast_size:
        warn(f"[{fname}] castSize={cast_size} but placements has {len(placements)} entries — MANUAL REVIEW")

    # --- placement numbers sequential (allow ties for co-winner scenarios) ---
    placement_nums = [p.get("placement") for p in placements if isinstance(p.get("placement"), int)]
    has_ties = len(placement_nums) != len(set(placement_nums))
    if not has_ties:
        expected_nums = list(range(1, len(placements) + 1))
        if sorted(placement_nums) != expected_nums:
            warn(f"[{fname}] Placement numbers are not sequential 1..{len(placements)}: {sorted(placement_nums)} — MANUAL REVIEW")
    else:
        # Ties are valid (e.g. co-winners): verify min is 1 and max is reasonable
        if placement_nums and min(placement_nums) != 1:
            warn(f"[{fname}] Tied placements but first place is not 1: {sorted(set(placement_nums))} — MANUAL REVIEW")

    # --- player names not in players_database ---
    for entry in placements:
        pname = entry.get("name", "").strip()
        slug  = entry.get("playerSlug", "")
        if pname.lower() not in player_by_name and slug not in player_by_id:
            warn(f"[{fname}] Placement name '{pname}' (slug '{slug}') not found in players_database.json — MANUAL REVIEW")

    # --- strategicRank type in placements ---
    for entry in placements:
        sr = entry.get("strategicRank")
        pname = entry.get("name", "?")
        if sr is None:
            pass  # strategicRank is optional in season-data placements
        elif isinstance(sr, str):
            warn(f"[{fname}] Placement '{pname}': strategicRank is string '{sr}' (expected number) — MANUAL REVIEW")


# ─── Save fixed file ──────────────────────────────────────────────────────────

if not DRY_RUN and players_data != players_original:
    with open(PLAYERS_FILE, "w", encoding="utf-8") as f:
        json.dump(players_data, f, indent=2, ensure_ascii=False)
    print(f"[OK] Saved fixed players_database.json")
else:
    print(f"{'(dry-run) ' if DRY_RUN else ''}No changes to players_database.json")


# ─── Print report ─────────────────────────────────────────────────────────────

print()
print("=" * 60)
print("AUDIT REPORT")
print("=" * 60)

if fixes:
    print(f"\n[AUTO-FIXES APPLIED] ({len(fixes)}):")
    for f_msg in fixes:
        print(f"   + {f_msg}")
else:
    print("\n[OK] No auto-fixes needed.")

if issues:
    # Separate the applied fixes (already printed) from manual review items
    manual = [i for i in issues if "MANUAL REVIEW" in i]
    auto_warned = [i for i in issues if "MANUAL REVIEW" not in i]

    if auto_warned and DRY_RUN:
        print(f"\n[WOULD AUTO-FIX] ({len(auto_warned)}):")
        for i in auto_warned:
            print(f"   ~ {i}")

    if manual:
        print(f"\n[MANUAL REVIEW NEEDED] ({len(manual)}):")
        for i in manual:
            print(f"   ! {i}")
else:
    print("\n[OK] No issues found.")

print()
print(f"Players checked : {len(players_data['players'])}")
print(f"Season files    : {len(seasons_data)}")
print("=" * 60)
